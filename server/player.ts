// Le document d'un joueur côté serveur, et ce qui en sort vers le client
// (BRIEF.md, sections 15.3 et 15.4).

import { JACKPOT_MULTIPLIER } from "../shared/economy";
import { experiencesValue, knownExperiences } from "../shared/experiences";
import { PLACES } from "../shared/places";
import { LUCKY_FIND_MS, emptyLook, fortuneOf, standingOf, START_BALANCE } from "../shared/rules";
import { ticketById } from "../shared/tickets";
import type { BoardEntry, Look, PendingTicket, PlaceId, PlayerState, PlayerStats, PokerStats } from "../shared/types";

export const SCHEMA_VERSION = 1;

/**
 * La séance de poker en cours : ce que le joueur a sorti de sa bourse pour une table
 * (POKER.md, section 4). Tant qu'elle figure ici, cet argent n'est pas dans `balance` :
 * il est sur la table, ou en route. Elle disparaît quand la table a rendu le tapis.
 */
export interface PokerSession {
  /** Le code de la table. */
  code: string;
  /** L'identifiant de la séance : un nouveau chaque fois que le joueur s'assoit. */
  sid: string;
  /** Le numéro du dernier dépôt : 1 pour la cave, puis un de plus par recave. */
  seq: number;
  /** Tout ce qui a quitté la bourse pour cette séance. */
  paid: number;
}

/**
 * Les statistiques telles qu'elles sont enregistrées. Les compteurs ajoutés après la
 * première version manquent dans les comptes plus anciens : ils valent alors zéro.
 * Aucun compte n'est jamais réécrit pour les recevoir.
 */
export type StoredStats = Omit<PlayerStats, "sown" | "sownValue"> & { sown?: number; sownValue?: number };

export interface PlayerRecord {
  /** Version du schéma. */
  v: number;
  id: string;
  pseudo: string;
  species: string;
  balance: number;
  pending: PendingTicket[];
  owned: string[];
  look: Look;
  kiosk: boolean;
  stats: StoredStats;
  createdAt: number;
  /** Absent d'un compte qui n'a jamais joué au poker. */
  poker?: PokerSession | null;
  /** Les lieux dont le défi est relevé : la cagnotte d'un hôte ne se verse qu'une fois. */
  pokerWins?: string[];
  /** Combien de fois la Table des Maîtres a été remportée. Absent : jamais. */
  masters?: number;
  /**
   * Les victoires au poker contre l'hôte de chaque lieu, comptées depuis la version 2.1.
   * Absent d'un compte d'avant : voir `hostWinsOf`.
   */
  hostWins?: Partial<Record<string, number>>;
  /** Les compteurs du poker. Absents d'un compte d'avant : ils valent zéro. */
  pokerStats?: Partial<PokerStats>;
  /** La vraie fin, « Huit as de cœur », a été vue. Absent : pas encore. */
  vraieFin?: boolean;
  /** Les expériences de vie vécues à l'Agence Carpe Diem. Absent : aucune. */
  experiences?: string[];

  // Les champs suivants ne sont jamais envoyés au client.
  pseudoKey: string;
  /** Empreinte SHA-256 du code de récupération. Le code lui-même n'est pas conservé. */
  codeHash: string;
  /** Date de la dernière publication au classement. */
  boardAt: number;
  /** Signature de ce qui a été publié : sert à savoir si la fortune a changé depuis. */
  boardSig: string;
  lastBuyAt: number;
  lastHouseAt: number;
  /** Jour UTC du compteur quotidien. */
  day: string;
  dayTickets: number;
  banned: boolean;
  updatedAt: number;
}

export function newPlayer(p: {
  id: string; pseudo: string; pseudoKey: string; codeHash: string; species: string; now: number;
}): PlayerRecord {
  return {
    v: SCHEMA_VERSION,
    id: p.id,
    pseudo: p.pseudo,
    species: p.species,
    balance: START_BALANCE,
    pending: [],
    owned: [],
    look: emptyLook(),
    kiosk: false,
    stats: { tickets: 0, winners: 0, wagered: 0, won: 0, bestGain: 0, bestTicket: null, jackpots: 0 },
    createdAt: p.now,
    pseudoKey: p.pseudoKey,
    codeHash: p.codeHash,
    boardAt: 0,
    boardSig: "",
    lastBuyAt: 0,
    lastHouseAt: 0,
    day: "",
    dayTickets: 0,
    banned: false,
    updatedAt: p.now,
  };
}

/** Addition bornée : un solde reste un entier exact. */
export function safeAdd(a: number, b: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, a + b);
}

/**
 * La fortune d'un joueur. L'argent posé sur une table de poker compte pour ce qu'il a
 * coûté : s'asseoir ne change pas la fortune, c'est en quittant la table qu'elle bouge.
 * Une expérience vécue compte pour ce qu'elle a coûté, comme un bien : s'offrir un voyage
 * ne fait pas reculer au classement.
 */
export function fortune(r: PlayerRecord): number {
  const lived = r.experiences && r.experiences.length > 0 ? experiencesValue(r.experiences) : 0;
  return safeAdd(safeAdd(fortuneOf(r), r.poker?.paid ?? 0), lived);
}

/** Un compteur enregistré, ou zéro s'il manque (compte d'avant) ou s'il est illisible. */
export function countOf(x: unknown): number {
  return typeof x === "number" && Number.isFinite(x) && x > 0 ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(x)) : 0;
}

/** Les lieux dont le défi de poker est relevé, dans l'ordre de la Promenade. */
export function defisOf(r: Pick<PlayerRecord, "pokerWins">): PlaceId[] {
  const wins = r.pokerWins ?? [];
  return PLACES.filter((place) => wins.includes(place.id)).map((place) => place.id);
}

/** Les huit hôtes sont ruinés : la Table des Maîtres s'ouvre. */
export function allChallengesWon(r: Pick<PlayerRecord, "pokerWins">): boolean {
  return defisOf(r).length === PLACES.length;
}

/**
 * Les victoires contre l'hôte de chaque lieu. Avant la version 2.1, seule la première
 * victoire d'un défi était retenue (`pokerWins`) : elle compte pour une, si bien qu'un
 * compte d'avant ne repart pas de zéro.
 */
export function hostWinsOf(r: Pick<PlayerRecord, "hostWins" | "pokerWins">): Record<PlaceId, number> {
  const first = r.pokerWins ?? [];
  const out = {} as Record<PlaceId, number>;
  for (const place of PLACES) {
    out[place.id] = Math.max(countOf(r.hostWins?.[place.id]), first.includes(place.id) ? 1 : 0);
  }
  return out;
}

/**
 * Une victoire de plus contre l'hôte d'un lieu. À appeler AVANT d'inscrire un défi relevé
 * pour la première fois dans `pokerWins` : la victoire en cours n'est ainsi comptée qu'une
 * fois, et celle d'un compte d'avant (déjà dans `pokerWins`) reste acquise.
 */
export function recordHostWin(r: PlayerRecord, place: PlaceId): void {
  r.hostWins = { ...r.hostWins, [place]: safeAdd(hostWinsOf(r)[place], 1) };
}

/** Le lieu que tient un hôte (« gaspard » → le Kiosque), ou `null` si ce n'est pas un hôte. */
export function placeOfHost(host: string): PlaceId | null {
  return PLACES.find((place) => place.host === host)?.id ?? null;
}

/** La vraie fin se mérite : le Kiosque est à lui et les huit défis sont relevés. */
export function trueEndingEarned(r: Pick<PlayerRecord, "kiosk" | "pokerWins">): boolean {
  return r.kiosk && allChallengesWon(r);
}

export function pokerStatsOf(r: Pick<PlayerRecord, "pokerStats">): PokerStats {
  const s = r.pokerStats ?? {};
  return { hands: countOf(s.hands), pots: countOf(s.pots), unmasked: countOf(s.unmasked), caught: countOf(s.caught) };
}

/** Ajoute à un compteur du poker (créé à la première fois). */
export function bumpPokerStat(r: PlayerRecord, key: keyof PokerStats, by = 1): void {
  if (by <= 0) return;
  const stats = pokerStatsOf(r);
  stats[key] = safeAdd(stats[key], by);
  r.pokerStats = stats;
}

/**
 * Ce que le client reçoit. Standing et fortune sont recalculés à chaque fois ; tout ce
 * qui a été ajouté après la première version reçoit ici sa valeur par défaut.
 */
export function toState(r: PlayerRecord, now: number = Date.now()): PlayerState {
  const state: PlayerState = {
    id: r.id,
    pseudo: r.pseudo,
    species: r.species,
    balance: r.balance,
    pending: r.pending,
    owned: r.owned,
    look: r.look,
    kiosk: r.kiosk,
    standing: standingOf(r.owned, r.kiosk),
    fortune: fortune(r),
    stats: { ...r.stats, sown: countOf(r.stats.sown), sownValue: countOf(r.stats.sownValue) },
    createdAt: r.createdAt,
    luckyIn: Math.max(0, LUCKY_FIND_MS - (now - r.lastHouseAt)),
    defis: defisOf(r),
    masters: countOf(r.masters),
    hostWins: hostWinsOf(r),
    experiences: knownExperiences(r.experiences),
    story: { fin: r.kiosk, vraieFin: r.vraieFin === true },
    pokerStats: pokerStatsOf(r),
  };
  // La table où il est assis, pour y revenir après un rechargement.
  if (r.poker) state.poker = { code: r.poker.code };
  return state;
}

/**
 * Versement (section 15.4) : pour chaque ticket déclaré encore présent dans
 * `pending`, le gain rejoint le solde, les statistiques de gain sont mises à
 * jour et le ticket est retiré. Déclarer deux fois le même ticket ne verse rien
 * la seconde fois. Rend le nombre de tickets versés.
 */
export function applyAck(r: PlayerRecord, ack: readonly string[]): number {
  let paid = 0;
  for (const id of ack) {
    const index = r.pending.findIndex((t) => t.id === id);
    if (index < 0) continue;
    const ticket = r.pending[index]!;
    r.pending.splice(index, 1);
    paid++;
    if (ticket.gain <= 0) continue;
    r.balance = safeAdd(r.balance, ticket.gain);
    r.stats.winners += 1;
    r.stats.won = safeAdd(r.stats.won, ticket.gain);
    if (ticket.gain > r.stats.bestGain) {
      r.stats.bestGain = ticket.gain;
      r.stats.bestTicket = ticket.type;
    }
    const def = ticketById(ticket.type);
    if (def && ticket.gain >= JACKPOT_MULTIPLIER * def.price) r.stats.jackpots += 1;
  }
  return paid;
}

/** Une Légende : le Kiosque est à lui, et il a vu la vraie fin de l'histoire. */
function isLegend(r: Pick<PlayerRecord, "kiosk" | "vraieFin">): boolean {
  return r.kiosk && r.vraieFin === true;
}

export function boardEntryOf(r: PlayerRecord, now: number): BoardEntry {
  const entry: BoardEntry = {
    id: r.id,
    pseudo: r.pseudo,
    species: r.species,
    look: {
      chapeau: r.look.chapeau,
      lunettes: r.look.lunettes,
      tenue: r.look.tenue,
      accessoire: r.look.accessoire,
    },
    fortune: fortune(r),
    standing: standingOf(r.owned, r.kiosk),
    kiosk: r.kiosk,
    at: now,
  };
  // Seules les Légendes portent la marque : les entrées des autres gardent leur forme d'avant.
  if (isLegend(r)) entry.legend = true;
  return entry;
}

/** Tout ce qui se voit au classement. Si rien n'a changé, inutile de republier. */
export function boardSignature(r: PlayerRecord): string {
  const l = r.look;
  const signature = [
    fortune(r), standingOf(r.owned, r.kiosk), r.species,
    l.chapeau ?? "", l.lunettes ?? "", l.tenue ?? "", l.accessoire ?? "",
    r.kiosk ? 1 : 0, r.pseudo,
  ].join("|");
  // La marque ne s'ajoute que pour une Légende : la signature des autres comptes ne change pas,
  // et personne n'est republié pour rien à la mise à jour.
  return isLegend(r) ? `${signature}|legende` : signature;
}
