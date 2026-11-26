// Le document d'un joueur côté serveur, et ce qui en sort vers le client
// (BRIEF.md, sections 15.3 et 15.4).

import { JACKPOT_MULTIPLIER } from "../shared/economy";
import { LUCKY_FIND_MS, emptyLook, fortuneOf, standingOf, START_BALANCE } from "../shared/rules";
import { ticketById } from "../shared/tickets";
import type { BoardEntry, Look, PendingTicket, PlayerState, PlayerStats } from "../shared/types";

export const SCHEMA_VERSION = 1;

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
  stats: PlayerStats;
  createdAt: number;

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

/** Ce que le client reçoit. Standing et fortune sont recalculés à chaque fois. */
export function toState(r: PlayerRecord, now: number = Date.now()): PlayerState {
  return {
    id: r.id,
    pseudo: r.pseudo,
    species: r.species,
    balance: r.balance,
    pending: r.pending,
    owned: r.owned,
    look: r.look,
    kiosk: r.kiosk,
    standing: standingOf(r.owned, r.kiosk),
    fortune: fortuneOf(r),
    stats: r.stats,
    createdAt: r.createdAt,
    luckyIn: Math.max(0, LUCKY_FIND_MS - (now - r.lastHouseAt)),
  };
}

/** Addition bornée : un solde reste un entier exact. */
export function safeAdd(a: number, b: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, a + b);
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

export function boardEntryOf(r: PlayerRecord, now: number): BoardEntry {
  return {
    id: r.id,
    pseudo: r.pseudo,
    species: r.species,
    look: {
      chapeau: r.look.chapeau,
      lunettes: r.look.lunettes,
      tenue: r.look.tenue,
      accessoire: r.look.accessoire,
    },
    fortune: fortuneOf(r),
    standing: standingOf(r.owned, r.kiosk),
    kiosk: r.kiosk,
    at: now,
  };
}

/** Tout ce qui se voit au classement. Si rien n'a changé, inutile de republier. */
export function boardSignature(r: PlayerRecord): string {
  const l = r.look;
  return [
    fortuneOf(r), standingOf(r.owned, r.kiosk), r.species,
    l.chapeau ?? "", l.lunettes ?? "", l.tenue ?? "", l.accessoire ?? "",
    r.kiosk ? 1 : 0, r.pseudo,
  ].join("|");
}
