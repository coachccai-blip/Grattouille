// Le Poker Tricheur côté serveur : faire vivre une table dans le stockage, et faire
// passer l'argent entre la bourse d'un joueur et la table (POKER.md, section 4).
//
// Une table est un blob, écrit sous condition comme un joueur. Le moteur de
// shared/poker est pur ; ce fichier ne fait que le brancher sur le stockage.
//
// L'argent passe par deux écritures qui ne sont pas atomiques : le joueur, la table.
// Pour qu'un plantage entre les deux ne crée ni ne détruise rien, chaque sens a sa règle.
//
// - De la bourse vers la table. Le joueur porte une séance (`poker`) : un identifiant,
//   un numéro de dépôt, et le total sorti de sa bourse. La table retient, par siège, le
//   dernier numéro pris en compte et le total reçu. Elle rattrape la différence quand
//   elle voit un numéro plus grand : rejouer un dépôt ne crédite rien. Un siège se
//   réserve toujours sur la table AVANT que la bourse ne paie : la table connaît donc
//   toute séance pour laquelle de l'argent est sorti.
// - De la table vers la bourse. Quand un joueur part, son tapis attend dans `ended`.
//   La bourse est créditée seulement si elle porte encore cette séance, et la séance
//   est effacée dans la même écriture : la créditer deux fois est impossible. Ensuite
//   seulement la table oublie l'entrée. Ce que la bourse avait sorti et que la table n'a
//   jamais reçu est rendu au même moment.
// - Une séance que la table ne connaît pas (ni siège, ni tapis à rendre) n'a rien reçu :
//   tout ce qui était sorti de la bourse y retourne.
// - Un tournoi qui se termine avec plusieurs joueurs encore assis : chacun est réglé par sa
//   propre requête, et la table fermée attend dans le stockage que tous soient passés. C'est
//   cette requête qui dit à chacun comment la table a fini pour lui ; réglé par un autre, il ne
//   retrouverait qu'une table effacée.
// Chaque requête sur une table commence par ces rattrapages : la suivante répare.

import {
  BLIND_SHARE, CHALLENGE_BONUS_BLINDS, advance, cancel, deposit, isMasters, placeBlind, seatIndexOf, seatIndexOfSession,
  settled, PokerError, type EndedSeat, type LeaveReason, type PokerTableResponse, type Sitter, type TableState,
} from "../shared/poker";
import { uniformInt } from "../shared/economy";
import type { BoardEntry, PokerStats } from "../shared/types";
import { planPublish, publish } from "./board";
import { ApiError, fail } from "./errors";
import type { Deps } from "./http";
import { applyAck, bumpPokerStat, countOf, recordHostWin, safeAdd, type PlayerRecord, type PokerSession } from "./player";
import { commit, unchanged, type Mutation } from "./storage";

const SID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** L'identifiant d'une séance : `s_` suivi de 16 caractères aléatoires. */
export function newSessionId(next32: () => number): string {
  let out = "s_";
  for (let i = 0; i < 16; i++) out += SID_ALPHABET[uniformInt(SID_ALPHABET.length, next32)];
  return out;
}

/** Ce que la table montre d'un joueur : son pseudo et de quoi dessiner sa tête. */
export function sitterOf(p: PlayerRecord, sid: string): Sitter {
  return {
    playerId: p.id,
    sid,
    pseudo: p.pseudo,
    species: p.species,
    look: { chapeau: p.look.chapeau, lunettes: p.look.lunettes, tenue: p.look.tenue, accessoire: p.look.accessoire },
  };
}

/** Un refus du moteur devient une erreur de l'API, avec le même code. */
export function engine<T>(work: () => T): T {
  try {
    return work();
  } catch (error) {
    if (error instanceof PokerError) fail(error.code);
    throw error;
  }
}

const isApiError = (error: unknown, code: string): boolean => error instanceof ApiError && error.code === code;

/**
 * Lit la table, la fait avancer jusqu'à maintenant, rattrape les dépôts du joueur,
 * applique `step`, et écrit si quelque chose a changé. Rend `null` si la table n'existe pas.
 */
export async function touchTable(
  deps: Deps, me: PlayerRecord, code: string, now: number, step?: (table: TableState) => TableState,
): Promise<TableState | null> {
  const session = me.poker && me.poker.code === code ? me.poker : null;
  try {
    return await deps.storage.mutateTable(code, (stored) => {
      const next = engine(() => {
        let t = advance(stored, now, deps.random32);
        // La bourse a sorti de l'argent que la table n'a pas encore vu : elle le rattrape.
        const seat = session ? t.seats[seatIndexOfSession(t, session.sid)] : null;
        if (session && seat && seat.seq < session.seq) t = deposit(t, session.sid, session.seq, session.paid, now, deps.random32);
        return step ? step(t) : t;
      });
      return { result: next, write: next === stored ? null : next };
    });
  } catch (error) {
    if (isApiError(error, "NOT_FOUND")) return null;
    throw error;
  }
}

/**
 * Une écriture sur la bourse d'un joueur, qui n'est pas forcément celui de la requête
 * (un tapis rendu à un joueur écarté). Rend le document écrit, ou `null` si rien ne l'a été.
 */
export async function writePurse<T>(
  deps: Deps, playerId: string, now: number, action: (p: PlayerRecord) => Mutation<T>,
): Promise<{ result: T; record: PlayerRecord | null }> {
  const out: { entry: BoardEntry | null; record: PlayerRecord | null } = { entry: null, record: null };
  const result = await deps.storage.mutatePlayer(playerId, (p) => {
    const mutation = action(p);
    out.entry = null;
    out.record = null;
    if (mutation.write) {
      p.updatedAt = now;
      out.entry = planPublish(p, now);
      out.record = p;
    }
    return mutation;
  });
  if (out.entry) {
    const task = publish(deps.storage, out.entry, now);
    if (deps.defer) deps.defer(task);
    else await task;
  }
  return { result, record: out.record };
}

/**
 * La bourse paie la cave d'une séance : `amount` quitte le solde, la séance s'ouvre.
 * Rejouer le même paiement ne débite rien. `blind`, s'il est donné, est la blinde d'une
 * table que le joueur crée : elle ne dépasse pas le quarantième de sa bourse.
 */
export async function payBuyIn(
  deps: Deps, playerId: string, now: number, ack: readonly string[],
  buy: { code: string; sid: string; amount: number; blind?: number },
): Promise<PlayerRecord> {
  const { record } = await writePurse(deps, playerId, now, (p) => {
    if (p.poker) {
      if (p.poker.sid === buy.sid) return unchanged(null);
      fail("ALREADY_SEATED");
    }
    // Comme partout : les tickets grattés sont versés avant de compter la bourse.
    applyAck(p, ack);
    if (buy.blind !== undefined && buy.blind * BLIND_SHARE > p.balance) fail("BLIND_TOO_HIGH");
    if (p.balance < buy.amount) fail("BUYIN_UNAFFORDABLE");
    p.balance -= buy.amount;
    p.poker = { code: buy.code, sid: buy.sid, seq: 1, paid: buy.amount };
    return commit(null);
  });
  if (record) return record;
  const fresh = await deps.storage.getPlayer(playerId);
  if (!fresh) fail("UNAUTHORIZED");
  return fresh;
}

/**
 * La bourse paie une recave : un dépôt de plus pour la séance. `seq` est le numéro du
 * dernier dépôt que la table a pris en compte : s'il ne correspond pas à celui de la
 * bourse, un autre dépôt est en route et celui-ci est refusé.
 */
export async function payRebuy(
  deps: Deps, playerId: string, now: number, ack: readonly string[],
  buy: { sid: string; seq: number; amount: number },
): Promise<PlayerRecord> {
  const { record } = await writePurse(deps, playerId, now, (p) => {
    const session = p.poker;
    if (!session || session.sid !== buy.sid) fail("NOT_SEATED");
    if (session.seq !== buy.seq) fail("CONFLICT");
    applyAck(p, ack);
    if (p.balance < buy.amount) fail("BUYIN_UNAFFORDABLE");
    p.balance -= buy.amount;
    session.paid += buy.amount;
    session.seq += 1;
    return commit(null);
  });
  return record!;
}

/** Le siège réservé ne sera pas payé : on le libère. */
export async function releaseSeat(deps: Deps, code: string, sid: string, now: number): Promise<TableState | null> {
  try {
    return await deps.storage.mutateTable(code, (stored) => {
      const next = engine(() => cancel(stored, sid, now, deps.random32));
      return { result: next, write: next === stored ? null : next };
    });
  } catch (error) {
    if (isApiError(error, "NOT_FOUND")) return null;
    throw error;
  }
}

type Left = NonNullable<PokerTableResponse["left"]>;

const STAT_KEYS: readonly (keyof PokerStats)[] = ["hands", "pots", "unmasked", "caught"];

/**
 * Rend un tapis à sa bourse. Sans effet si la bourse ne porte plus cette séance.
 * Tout ce qu'une séance rapporte arrive ici, dans cette seule écriture, qui efface la
 * séance : le tapis, la cagnotte d'un défi relevé, la Table des Maîtres remportée, les
 * victoires contre chaque hôte, les compteurs du poker. Rejouer le versement ne recrédite
 * rien et ne recompte rien.
 */
function credit(p: PlayerRecord, ended: EndedSeat, table: TableState): Mutation<Left | null> {
  const session = p.poker;
  if (!session || session.sid !== ended.sid) return unchanged(null);
  // Ce qui avait quitté la bourse sans jamais atteindre la table lui revient aussi.
  const payout = ended.payout + Math.max(0, session.paid - ended.received);
  p.balance = safeAdd(p.balance, payout);
  let bonus = 0;
  if (ended.reason === "defi-gagne" && table.kind === "defi" && table.place) {
    // Une victoire de plus contre l'hôte du lieu, à chaque défi gagné : trois ouvrent son
    // histoire. À compter avant d'inscrire le lieu parmi les défis relevés (`recordHostWin`).
    recordHostWin(p, table.place);
    const wins = p.pokerWins ?? [];
    if (!wins.includes(table.place)) {
      // Un défi ouvert avant les trois manches (sans manche dans son état) se règle selon ses
      // règles d'origine : la cagnotte de l'hôte, 100 blindes du lieu, une seule fois. Depuis,
      // il n'y a plus de cagnotte à part : le gain, c'est la mise que l'hôte a posée.
      if (table.level === undefined) {
        bonus = placeBlind(table.place) * CHALLENGE_BONUS_BLINDS;
        p.balance = safeAdd(p.balance, bonus);
      }
      // L'hôte est battu au moins une fois : le défi compte parmi les défis relevés.
      p.pokerWins = [...wins, table.place];
    }
  }
  // La Table des Maîtres remportée : une victoire de plus, une seule par table gagnée. Elle ne
  // compte pas comme une victoire contre ses hôtes : seules les manches d'un défi ouvrent une histoire.
  if (ended.reason === "maitres-gagne" && table.kind === "maitres") p.masters = countOf(p.masters) + 1;
  // Les compteurs de la séance rejoignent ceux du compte. Une entrée d'avant ces compteurs
  // n'en porte pas : rien n'est alors ajouté au compte, pas même un champ vide.
  if (ended.stats) for (const key of STAT_KEYS) bumpPokerStat(p, key, countOf(ended.stats[key]));
  p.poker = null;
  return commit({ reason: ended.reason, payout, bonus });
}

/** Une séance que la table ne connaît pas : rien n'y est arrivé, tout retourne à la bourse. */
function refund(p: PlayerRecord, session: PokerSession): Mutation<Left | null> {
  const mine = p.poker;
  if (!mine || mine.sid !== session.sid) return unchanged(null);
  const payout = mine.paid;
  p.balance = safeAdd(p.balance, payout);
  p.poker = null;
  return commit<Left>({ reason: "reserve", payout, bonus: 0 });
}

export interface Reconciled {
  /** La table après les rattrapages. Une table fermée dont tout est rendu est effacée du stockage. */
  table: TableState | null;
  /** Le document du joueur, tel qu'il vient d'être écrit s'il l'a été. */
  me: PlayerRecord;
  /** Sa bourse a bougé pendant la requête. */
  moved: boolean;
  /** Il n'est plus assis : pourquoi, et ce qui est retourné à sa bourse. */
  left?: Left;
}

/**
 * Les rattrapages d'argent après avoir touché une table : rendre aux bourses les tapis
 * des joueurs partis (le sien et ceux des autres), en accuser réception sur la table,
 * effacer une table fermée, et rendre à ce joueur une séance que la table ne connaît pas.
 */
export async function reconcile(
  deps: Deps, me: PlayerRecord, code: string, table: TableState | null, now: number,
): Promise<Reconciled> {
  const session = me.poker && me.poker.code === code ? me.poker : null;
  const out: Reconciled = { table, me, moved: false };
  const known = table !== null && session !== null
    && (seatIndexOfSession(table, session.sid) >= 0 || table.ended.some((e) => e.sid === session.sid));

  if (table && table.ended.length > 0) {
    const paid: string[] = [];
    // Un tournoi fermé : chacun vient chercher son règlement lui-même (voir en tête de fichier).
    const own = table.phase === "fermee" && isMasters(table);
    for (const ended of table.ended) {
      if (own && ended.playerId !== me.id) continue;
      try {
        const { result, record } = await writePurse(deps, ended.playerId, now, (p) => credit(p, ended, table));
        paid.push(ended.sid);
        if (ended.playerId === me.id && result && record) {
          out.me = record;
          out.moved = true;
          out.left = result;
        }
      } catch (error) {
        // Le compte n'existe plus : il n'y a plus de bourse à créditer.
        if (isApiError(error, "NOT_FOUND")) paid.push(ended.sid);
        // Trop d'écritures en même temps sur ce joueur : la requête suivante y reviendra.
        else if (!isApiError(error, "CONFLICT")) throw error;
      }
    }
    if (paid.length > 0) {
      try {
        out.table = await deps.storage.mutateTable(code, (stored) => {
          const next = settled(stored, paid);
          return { result: next, write: next === stored ? null : next };
        });
      } catch (error) {
        if (isApiError(error, "NOT_FOUND")) out.table = null;
        else if (!isApiError(error, "CONFLICT")) throw error;
      }
    }
  }
  // Une table fermée qui n'a plus rien à rendre ne sert plus à personne.
  if (out.table && out.table.phase === "fermee" && out.table.ended.length === 0) {
    await deps.storage.deleteTable(code);
  }
  if (session && !known) {
    const { result, record } = await writePurse(deps, me.id, now, (p) => refund(p, session));
    if (result && record) {
      out.me = record;
      out.moved = true;
      out.left = result;
    }
  }
  return out;
}

/** Ce qu'on dit à un joueur qui n'est plus assis à cette table, d'après les derniers départs. */
export function departureOf(table: TableState, playerId: string): Left | undefined {
  if (seatIndexOf(table, playerId) >= 0) return undefined;
  for (let i = table.departed.length - 1; i >= 0; i--) {
    const d = table.departed[i]!;
    if (d.playerId === playerId) return { reason: d.reason as LeaveReason, payout: d.payout, bonus: 0 };
  }
  return undefined;
}
