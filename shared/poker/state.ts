// Lire l'état d'une table : qui est assis où, qui est dans le coup, qui peut jouer la
// main suivante. Rien ici ne modifie l'état.

import { CHALLENGE_LEVEL_HANDS, challengeBlind } from "./rules";
import type { HandPlayer, Range, SeatState, TableState } from "./types";

/** Le siège d'un joueur humain, ou -1. */
export function seatIndexOf(t: TableState, playerId: string): number {
  if (!playerId) return -1;
  return t.seats.findIndex((s) => s !== null && s.bot === null && s.playerId === playerId);
}

/** Le siège d'une séance, ou -1. */
export function seatIndexOfSession(t: TableState, sid: string): number {
  if (!sid) return -1;
  return t.seats.findIndex((s) => s !== null && s.bot === null && s.sid === sid);
}

/** Vrai si la cave du siège est posée. Un robot arrive avec son tapis. */
export function isFunded(seat: SeatState): boolean {
  return seat.bot !== null || seat.seq >= 1;
}

/** Le joueur de ce siège dans la main en cours, s'il y a des cartes. */
export function playerInHand(t: TableState, seat: number): HandPlayer | null {
  return t.hand?.players.find((p) => p.seat === seat && !p.gone) ?? null;
}

/** Dans le coup : servi, et pas couché. */
export function isLive(t: TableState, seat: number): boolean {
  const p = playerInHand(t, seat);
  return p !== null && !p.folded;
}

/** Les sièges dans l'ordre de la table, à partir du voisin de `from`. */
export function seatsAfter(t: TableState, from: number, seats: readonly number[]): number[] {
  const n = t.seats.length;
  return [...seats].sort((a, b) => ((a - from - 1 + 2 * n) % n) - ((b - from - 1 + 2 * n) % n));
}

/**
 * La blinde de la main `handNo`. À une table, c'est toujours la même. Dans un défi, elle
 * part de la blinde de base (`t.blind`) et double toutes les trois mains.
 */
export function blindAt(t: TableState, handNo: number): number {
  return t.kind === "defi" ? challengeBlind(t.blind, handNo) : t.blind;
}

/** La blinde en vigueur : celle de la main en cours, ou celle de la prochaine entre deux mains. */
export function currentBlind(t: TableState): number {
  return t.hand ? t.hand.blind : blindAt(t, t.handNo + 1);
}

/**
 * Défi : la prochaine hausse de la blinde, c'est-à-dire le numéro de la main où elle monte
 * et ce qu'elle vaudra. `null` hors défi, ou quand elle ne montera plus.
 */
export function nextRise(t: TableState): { hand: number; blind: number } | null {
  if (t.kind !== "defi") return null;
  const hand = t.hand ? t.handNo : t.handNo + 1;
  const next = (Math.floor((hand - 1) / CHALLENGE_LEVEL_HANDS) + 1) * CHALLENGE_LEVEL_HANDS + 1;
  const blind = blindAt(t, next);
  return blind > blindAt(t, hand) ? { hand: next, blind } : null;
}

/**
 * Les sièges qui seraient servis si une main partait maintenant : ceux qui peuvent payer
 * la blinde. Un robot à sec recave avant la donne. Dans un défi, personne ne recave, et
 * qui n'a plus de quoi payer la blinde pose ce qui lui reste : il suffit d'avoir un euro.
 */
export function dealableSeats(t: TableState): number[] {
  const out: number[] = [];
  const challenge = t.kind === "defi";
  t.seats.forEach((seat, index) => {
    if (!seat || !isFunded(seat)) return;
    const refill = seat.bot !== null && !challenge;
    if (refill || seat.stack + seat.reserve >= (challenge ? 1 : t.blind)) out.push(index);
  });
  return out;
}

/** Une main peut partir : deux joueurs au moins peuvent payer la blinde, dont un humain. */
export function canDeal(t: TableState): boolean {
  const seats = dealableSeats(t);
  return seats.length >= 2 && seats.some((index) => t.seats[index]!.bot === null);
}

/**
 * Ce qu'un joueur peut recaver maintenant, ou `null`. On recave entre deux mains, ou dès
 * qu'on n'est plus dans le coup ; jusqu'à la cave maximale, et pas en dessous de la cave
 * minimale. Dans un défi, personne ne recave.
 */
export function rebuyRange(t: TableState, index: number): Range | null {
  const seat = t.seats[index];
  if (!seat || seat.bot !== null || seat.seq < 1) return null;
  if (t.kind === "defi" || t.phase === "fermee") return null;
  if (isLive(t, index)) return null;
  const total = seat.stack + seat.reserve;
  if (total >= t.maxBuyIn) return null;
  return { min: Math.max(1, t.minBuyIn - total), max: t.maxBuyIn - total };
}

/** Tous les jetons posés sur la table : tapis, réserves, et l'argent du milieu. */
export function chipsOnTable(t: TableState): number {
  let chips = t.hand ? t.hand.pot : t.carry;
  for (const seat of t.seats) if (seat) chips += seat.stack + seat.reserve;
  return chips;
}
