// Lire l'état d'une table : qui est assis où, qui est dans le coup, qui peut jouer la
// main suivante. Rien ici ne modifie l'état.

import { challengeBlind, challengeRise, mastersBlind, mastersRise } from "./rules";
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
 * Un défi, la Table des Maîtres et une table entre amis créée en tournoi se jouent sans
 * recave (ni les joueurs, ni les robots) : la blinde monte au fil des mains, et qui n'a plus
 * de quoi la payer pose ce qui lui reste. Ailleurs, la blinde est fixe et un robot à sec recave.
 */
export function isTournament(t: Pick<TableState, "kind" | "format">): boolean {
  return t.kind === "defi" || isMasters(t);
}

/**
 * Le format de la Table des Maîtres : la Table des Maîtres elle-même, et une table entre amis
 * créée en tournoi. Chacun arrive avec la même cagnotte, les perdants sont éliminés, le dernier
 * à avoir des jetons remporte tout ce qui est sur la table.
 */
export function isMasters(t: Pick<TableState, "kind" | "format">): boolean {
  return t.kind === "maitres" || t.format === "tournoi";
}

/**
 * La blinde de la main `handNo`. À une table classique, c'est toujours la même. Dans un défi
 * et en tournoi, elle part de la blinde de départ (`t.blind`) et double de palier en palier.
 */
export function blindAt(t: TableState, handNo: number): number {
  if (t.kind === "defi") return challengeBlind(t.blind, handNo);
  if (isMasters(t)) return mastersBlind(t.blind, handNo, t.seats.length);
  return t.blind;
}

/** La blinde en vigueur : celle de la main en cours, ou celle de la prochaine entre deux mains. */
export function currentBlind(t: TableState): number {
  return t.hand ? t.hand.blind : blindAt(t, t.handNo + 1);
}

/**
 * Tournoi : la prochaine hausse de la blinde, c'est-à-dire le numéro de la main où elle
 * monte et ce qu'elle vaudra. `null` à une table ordinaire, ou quand elle ne montera plus.
 */
export function nextRise(t: TableState): { hand: number; blind: number } | null {
  // La main de référence : celle qui se joue, ou celle qui va se jouer.
  const hand = t.hand ? t.handNo : t.handNo + 1;
  if (t.kind === "defi") return challengeRise(t.blind, hand);
  if (isMasters(t)) return mastersRise(t.blind, hand, t.seats.length);
  return null;
}

/** Ce qu'un siège a devant lui : son tapis, et la recave qui l'attend. */
export function chipsOf(seat: SeatState): number {
  return seat.stack + seat.reserve;
}

/**
 * Tournoi (le format des Maîtres) : ce siège est éliminé. Il n'a plus rien, et il n'est pas
 * dans la main en cours (à tapis, on n'a plus rien devant soi mais on joue encore). Il ne
 * reçoit plus de cartes, et la parole comme le bouton le sautent. Un robot garde son siège,
 * vide de jetons ; un joueur humain libère le sien à la main suivante.
 */
export function isOut(t: TableState, index: number): boolean {
  const seat = t.seats[index];
  if (!seat || !isMasters(t) || t.handNo === 0 || !isFunded(seat)) return false;
  return chipsOf(seat) <= 0 && playerInHand(t, index) === null;
}

/**
 * Les sièges qui seraient servis si une main partait maintenant : ceux qui peuvent payer
 * la blinde. Un robot à sec recave avant la donne. En tournoi, personne ne recave, et qui
 * n'a plus de quoi payer la blinde pose ce qui lui reste : il suffit d'avoir un euro.
 */
export function dealableSeats(t: TableState): number[] {
  const out: number[] = [];
  const tournament = isTournament(t);
  t.seats.forEach((seat, index) => {
    if (!seat || !isFunded(seat)) return;
    const refill = seat.bot !== null && !tournament;
    if (refill || chipsOf(seat) >= (tournament ? 1 : t.blind)) out.push(index);
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
 * minimale. Dans un défi et en tournoi, personne ne recave.
 */
export function rebuyRange(t: TableState, index: number): Range | null {
  const seat = t.seats[index];
  if (!seat || seat.bot !== null || seat.seq < 1) return null;
  if (isTournament(t) || t.phase === "fermee") return null;
  if (isLive(t, index)) return null;
  const total = seat.stack + seat.reserve;
  if (total >= t.maxBuyIn) return null;
  return { min: Math.max(1, t.minBuyIn - total), max: t.maxBuyIn - total };
}

/**
 * Tous les jetons posés sur la table : tapis, réserves, et l'argent du milieu (le pot de la
 * main en cours, et ce qui attend la main suivante).
 */
export function chipsOnTable(t: TableState): number {
  let chips = (t.hand ? t.hand.pot : 0) + t.carry;
  for (const seat of t.seats) if (seat) chips += seat.stack + seat.reserve;
  return chips;
}
