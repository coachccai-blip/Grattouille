// La machine à états d'une table et d'une main (POKER.md, sections 1 et 4).
//
// Tout est fonction pure : (état, action ou heure, hasard injecté) → nouvel état.
// Aucune fonction ne modifie l'état qu'elle reçoit ; aucune ne lit d'horloge ni de
// stockage. Quand rien ne change, la fonction rend l'état reçu, le même objet : c'est
// ainsi que l'appelant sait s'il doit écrire.
//
// Il n'y a pas de minuteur. Chaque fonction commence par faire avancer la table jusqu'à
// l'heure qu'on lui donne (délais échus, décisions des robots, mains qui s'enchaînent),
// puis applique ce qu'on lui demande.
//
// L'argent ne se compte qu'en euros entiers et se conserve exactement : ce qui sort
// d'un tapis entre dans le pot, ce qui sort du pot entre dans un tapis ou reste sur la
// table. Seuls les robots créent de l'argent (leur tapis, leurs recaves) ou en font
// disparaître (ce qu'ils emportent quand la table ferme).

import { uniformInt } from "../economy";
import type { PlaceId } from "../types";
import { betOptions, type BetOptions } from "./betting";
import { botAccuse, botBet, botCheat } from "./bots";
import { isCard, shuffledDeck, type Card, type Random32 } from "./cards";
import { PokerError, refuse } from "./errors";
import { evaluate } from "./hands";
import { sidePots, splitPot } from "./pots";
import {
  ACCUSE_MS, BOT_MAX_MS, BOT_MIN_MS, BOT_STACK_CAVES, CHEAT_MS, DEPARTED_SIZE, IDLE_HANDS_BEFORE_LEAVE,
  IDLE_TABLE_MS, LOG_SIZE, MAX_BUYIN_BLINDS, MAX_SEATS, MAX_TABLE_CHIPS, MIN_BUYIN_BLINDS, MIN_SEATS,
  MISSES_BEFORE_ABSENT, RESERVE_MS, RESTART_MS, RESULT_MS, TURN_MS, WALKOVER_MS, minBuyIn,
} from "./rules";
import {
  canDeal, chipsOnTable, dealableSeats, isFunded, isLive, playerInHand, seatIndexOf, seatIndexOfSession,
  seatsAfter,
} from "./state";
import type {
  Accusation, AvatarLook, CloseReason, Difficulty, GameAction, HandPlayer, HandState, LeaveReason, LogEntry,
  LogKind, PotResult, SeatState, TableKind, TableState,
} from "./types";
import { viewOfSeat } from "./view";

// ---------------------------------------------------------------------------
// Création

export interface TableSpec {
  code: string;
  kind: TableKind;
  /** Table de la maison ou défi : le lieu. */
  place: PlaceId | null;
  blind: number;
  /** La cave maximale. Dans un défi, c'est la cave tout court : chacun pose exactement cela. */
  maxBuyIn: number;
  /** Le nombre de sièges, de 2 à 6. */
  seats: number;
  /** Les personnages des robots, un par robot. Ils prennent les derniers sièges. */
  bots: readonly string[];
  difficulty: Difficulty;
}

/** Qui s'assoit : un joueur, sa séance, et de quoi dessiner sa tête. */
export interface Sitter {
  playerId: string;
  sid: string;
  pseudo: string;
  species: string;
  look: AvatarLook | null;
}

const isCount = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x > 0;

/** Une table neuve : les robots sont assis, aucun joueur ne l'est encore. */
export function createTable(spec: TableSpec, now: number): TableState {
  if (!isCount(spec.blind) || !isCount(spec.maxBuyIn)) refuse("BAD_REQUEST");
  if (!Number.isInteger(spec.seats) || spec.seats < MIN_SEATS || spec.seats > MAX_SEATS) refuse("BAD_REQUEST");
  if (spec.bots.length > spec.seats - 1) refuse("BAD_REQUEST");
  const caves = spec.maxBuyIn / spec.blind;
  if (caves < MIN_BUYIN_BLINDS || caves > MAX_BUYIN_BLINDS) refuse("BAD_REQUEST");

  const seats: (SeatState | null)[] = Array.from({ length: spec.seats }, () => null);
  let bank = 0;
  spec.bots.forEach((bot, k) => {
    seats[spec.seats - spec.bots.length + k] = {
      bot, playerId: "", sid: "", pseudo: "", species: "", look: null,
      stack: spec.maxBuyIn, reserve: 0, seq: 0, received: 0, since: now, missed: 0, absent: false, idle: 0,
    };
    bank += spec.maxBuyIn;
  });
  return {
    v: 1,
    code: spec.code,
    kind: spec.kind,
    place: spec.place,
    blind: spec.blind,
    minBuyIn: spec.kind === "defi" ? spec.maxBuyIn : minBuyIn(spec.blind),
    maxBuyIn: spec.maxBuyIn,
    difficulty: spec.difficulty,
    seats,
    owner: null,
    // Une table de la maison ou un défi part dès que le joueur a posé sa cave.
    started: spec.kind !== "privee",
    phase: "attente",
    version: 1,
    step: 0,
    createdAt: now,
    clock: now,
    activeAt: now,
    dealer: -1,
    handNo: 0,
    carry: 0,
    hand: null,
    result: null,
    nextAt: null,
    ended: [],
    departed: [],
    closed: null,
    log: [],
    logNo: 0,
    audit: { in: 0, out: 0, bank },
  };
}

// ---------------------------------------------------------------------------
// Outils internes. À partir d'ici, `d` est toujours une copie de travail : la seule
// chose que ces fonctions modifient.

function clone(state: TableState): TableState {
  return JSON.parse(JSON.stringify(state)) as TableState;
}

function think(rng: Random32): number {
  return BOT_MIN_MS + uniformInt(BOT_MAX_MS - BOT_MIN_MS + 1, rng);
}

function note(d: TableState, kind: LogKind, seat: number, amount = 0, extra: Partial<LogEntry> = {}): void {
  d.log.push({ n: ++d.logNo, hand: d.handNo, kind, seat, amount, ...extra });
  if (d.log.length > LOG_SIZE) d.log.splice(0, d.log.length - LOG_SIZE);
}

/** Un délai dépassé. Au deuxième de suite, le joueur est absent. */
function miss(seat: SeatState): void {
  seat.missed += 1;
  if (seat.missed >= MISSES_BEFORE_ABSENT && !seat.absent) {
    seat.absent = true;
    // La main où il s'absente ne compte pas : il lui en reste trois entières avant de quitter la table.
    seat.idle = -1;
  }
}

/** Le joueur vient d'agir : il est là. */
function present(seat: SeatState): void {
  seat.missed = 0;
  seat.absent = false;
}

function handOf(d: TableState): HandState {
  if (!d.hand) throw new Error("pas de main en cours");
  return d.hand;
}

// ---------------------------------------------------------------------------
// Le temps : quel est le prochain événement qui arrive tout seul, et quand ?

function phaseEventAt(t: TableState): number | null {
  const h = t.hand;
  if (t.phase === "attente" || t.phase === "denouement") return t.nextAt;
  if (!h) return null;
  if (t.phase === "triche" || t.phase === "abattage") {
    let at = h.deadline;
    for (const p of h.players) {
      const done = p.folded || (t.phase === "triche" ? p.chosen : p.spoke);
      if (!done && p.actAt !== null) at = Math.min(at, p.actAt);
    }
    return at;
  }
  if (t.phase === "encheres" && h.turn !== null) {
    const p = playerInHand(t, h.turn);
    return p && p.actAt !== null ? p.actAt : h.deadline;
  }
  return null;
}

/**
 * L'heure du prochain événement qui arrive sans que personne n'agisse : la décision d'un
 * robot, un délai dépassé, la main suivante, un siège réservé libéré, la fermeture d'une
 * table sans activité. `null` : il n'arrivera plus rien (table fermée).
 */
export function nextEventAt(t: TableState): number | null {
  if (t.phase === "fermee") return null;
  let at = t.activeAt + IDLE_TABLE_MS;
  for (const seat of t.seats) {
    if (seat && seat.bot === null && seat.seq === 0) at = Math.min(at, seat.since + RESERVE_MS);
  }
  const phase = phaseEventAt(t);
  return phase === null ? at : Math.min(at, phase);
}

/** Traite un événement, à l'heure `at`. */
function fire(d: TableState, at: number, rng: Random32): void {
  d.clock = Math.max(d.clock, at);
  const t = d.clock;
  const phase = phaseEventAt(d);
  if (phase !== null && phase <= t) {
    firePhase(d, t, rng);
    return;
  }
  for (let index = 0; index < d.seats.length; index++) {
    const seat = d.seats[index];
    if (seat && seat.bot === null && seat.seq === 0 && seat.since + RESERVE_MS <= t) {
      depart(d, index, t, rng, "reserve");
      return;
    }
  }
  if (d.activeAt + IDLE_TABLE_MS <= t) closeTable(d, t, "inactive", () => "inactive");
}

/** Fait avancer la table jusqu'à `now`. Rend vrai si quelque chose a bougé. */
function run(d: TableState, now: number, rng: Random32): boolean {
  let moved = false;
  // Le garde-fou ne sert jamais : chaque événement fait avancer la table.
  for (let guard = 0; guard < 5_000; guard++) {
    const at = nextEventAt(d);
    if (at === null || at > now) break;
    fire(d, at, rng);
    moved = true;
  }
  return moved;
}

function firePhase(d: TableState, t: number, rng: Random32): void {
  if (d.phase === "attente" || d.phase === "denouement") {
    nextHand(d, t, rng);
    return;
  }
  const h = handOf(d);
  if (d.phase === "triche") {
    const expired = t >= h.deadline;
    for (const p of h.players) {
      if (p.folded || p.chosen) continue;
      const seat = d.seats[p.seat]!;
      const due = p.actAt !== null && p.actAt <= t;
      if (seat.bot !== null) {
        if (due || expired) chooseCheat(d, p, due ? checkedSwap(p, botCheat(viewOfSeat(d, p.seat, t), d.difficulty, rng)) : null, false);
      } else if (due) {
        chooseCheat(d, p, null, true);
      } else if (expired) {
        miss(seat);
        chooseCheat(d, p, null, true);
      }
    }
    if (h.players.every((p) => p.folded || p.chosen)) beginBetting(d, t, rng);
    return;
  }
  if (d.phase === "abattage") {
    const expired = t >= h.deadline;
    for (const p of h.players) {
      if (p.folded || p.spoke) continue;
      const seat = d.seats[p.seat]!;
      const due = p.actAt !== null && p.actAt <= t;
      if (seat.bot !== null) {
        if (due || expired) speak(d, p, due ? checkedTarget(d, p, botAccuse(viewOfSeat(d, p.seat, t), d.difficulty, rng)) : null, false);
      } else if (due) {
        speak(d, p, null, true);
      } else if (expired) {
        miss(seat);
        speak(d, p, null, true);
      }
    }
    if (h.players.every((p) => p.folded || p.spoke)) resolve(d, t);
    return;
  }
  if (d.phase === "encheres" && h.turn !== null) {
    const p = playerInHand(d, h.turn)!;
    const seat = d.seats[p.seat]!;
    if (seat.bot !== null) {
      const move = botBet(viewOfSeat(d, p.seat, t), d.difficulty, rng);
      try {
        applyMove(d, p, move, t, rng, false);
      } catch (error) {
        // Un robot ne propose jamais un geste interdit ; s'il le faisait, il passerait son tour.
        if (!(error instanceof PokerError)) throw error;
        applyMove(d, p, passMove(d, p), t, rng, false);
      }
      return;
    }
    // Un humain : son délai est dépassé, ou il est absent et sa décision tombe aussitôt.
    if (!seat.absent) miss(seat);
    applyMove(d, p, passMove(d, p), t, rng, true);
  }
}

// ---------------------------------------------------------------------------
// La main : blinde, donne, triche

/** Les joueurs écartés, la fin d'un défi, puis la main suivante si elle peut partir. */
function nextHand(d: TableState, t: number, rng: Random32): void {
  d.nextAt = null;
  // Trois mains de suite sans jouer (absent, ou à sec) : le joueur quitte la table et
  // récupère son tapis.
  const humans = fundedHumans(d);
  const leaving = humans.filter((index) => d.seats[index]!.idle >= IDLE_HANDS_BEFORE_LEAVE);
  const cause = (seat: SeatState): LeaveReason => (seat.absent ? "absent" : "a-sec");
  if (humans.length === 0 || leaving.length === humans.length) {
    // Plus aucun joueur humain : la table ferme avec eux.
    closeTable(d, t, "vide", cause);
    return;
  }
  for (const index of leaving) removeSeat(d, index, t, cause(d.seats[index]!));
  if (d.kind === "defi" && d.handNo > 0) {
    // Un défi dure jusqu'à ce que l'un des deux n'ait plus de quoi payer la blinde.
    const human = d.seats.find((s) => s !== null && s.bot === null)!;
    const host = d.seats.find((s) => s !== null && s.bot !== null);
    const humanOut = human.stack + human.reserve < d.blind;
    const hostOut = !host || host.stack < d.blind;
    if (humanOut || hostOut) {
      const outcome: LeaveReason = humanOut && hostOut ? "defi-nul" : hostOut ? "defi-gagne" : "defi-perdu";
      closeTable(d, t, "defi", () => outcome);
      return;
    }
  }
  if (!startHand(d, t, rng) && d.phase !== "fermee") d.phase = "attente";
}

/** La blinde, puis la donne. Rend faux si la main ne peut pas partir. */
function startHand(d: TableState, t: number, rng: Random32): boolean {
  if (!d.started || !canDeal(d)) return false;
  for (let index = 0; index < d.seats.length; index++) {
    const seat = d.seats[index];
    if (!seat) continue;
    if (seat.reserve > 0) {
      seat.stack += seat.reserve;
      seat.reserve = 0;
    }
    if (seat.bot === null || d.kind === "defi") continue;
    // Un robot à sec recave ; un robot trop riche met le surplus de côté.
    const cap = d.maxBuyIn * BOT_STACK_CAVES;
    if (seat.stack < d.blind) {
      const added = d.maxBuyIn - seat.stack;
      seat.stack = d.maxBuyIn;
      d.audit.bank += added;
      note(d, "cave", index, added);
    } else if (seat.stack > cap) {
      d.audit.bank -= seat.stack - cap;
      seat.stack = cap;
    }
  }
  if (chipsOnTable(d) > MAX_TABLE_CHIPS) {
    closeTable(d, t, "banque", () => "banque");
    return true;
  }

  const seated = dealableSeats(d);
  // Le donneur tourne ; la parole part de son voisin, il parle en dernier.
  const dealer = seatsAfter(d, d.dealer, seated)[0]!;
  const order = seatsAfter(d, dealer, seated);
  const deck = shuffledDeck(rng);
  d.dealer = dealer;
  d.handNo += 1;
  const h: HandState = {
    players: order.map((seat, k) => ({
      seat, cards: deck.slice(5 * k, 5 * k + 5), swap: null, chosen: false, committed: 0, bet: 0,
      folded: false, allIn: false, spoke: false, accuse: null, actAt: null, gone: false,
    })),
    // Le pot resté de la main précédente attend là.
    pot: d.carry,
    bet: 0,
    raises: 0,
    turn: null,
    pending: [],
    deadline: t + CHEAT_MS,
  };
  d.carry = 0;
  d.hand = h;
  d.phase = "triche";
  d.step += 1;
  for (const p of h.players) {
    const seat = d.seats[p.seat]!;
    seat.stack -= d.blind;
    p.committed = d.blind;
    p.allIn = seat.stack === 0;
    h.pot += d.blind;
    note(d, "blinde", p.seat, d.blind, p.allIn ? { allIn: true } : {});
  }
  note(d, "donne", dealer);
  for (const p of h.players) {
    const seat = d.seats[p.seat]!;
    // Un robot réfléchit ; la décision d'un absent tombe aussitôt.
    if (seat.bot !== null) p.actAt = t + think(rng);
    else if (seat.absent) p.actAt = t;
  }
  return true;
}

/** Le remplacement proposé par un robot, s'il respecte la règle. */
function checkedSwap(p: HandPlayer, swap: { index: number; card: Card } | null): { index: number; card: Card } | null {
  if (!swap) return null;
  if (!Number.isInteger(swap.index) || swap.index < 0 || swap.index >= p.cards.length) return null;
  if (!isCard(swap.card) || p.cards.includes(swap.card)) return null;
  return swap;
}

function chooseCheat(d: TableState, p: HandPlayer, swap: { index: number; card: Card } | null, auto: boolean): void {
  if (swap) {
    p.swap = { index: swap.index, from: p.cards[swap.index]! };
    p.cards[swap.index] = swap.card;
  }
  p.chosen = true;
  p.actAt = null;
  note(d, "choix", p.seat, 0, auto ? { auto: true } : {});
}

// ---------------------------------------------------------------------------
// Les enchères

function optionsOf(d: TableState, p: HandPlayer): BetOptions {
  const h = handOf(d);
  const rivals = h.players.filter((q) => q !== p && !q.folded && !q.allIn).length;
  return betOptions({
    pot: h.pot, bet: h.bet, raises: h.raises, blind: d.blind, mine: p.bet, stack: d.seats[p.seat]!.stack, rivals,
  });
}

type Move = Extract<GameAction, { type: "parole" | "miser" | "suivre" | "relancer" | "coucher" | "tapis" }>;

/** Ce qui tombe quand un joueur ne répond pas : parole si possible, sinon couché. */
function passMove(d: TableState, p: HandPlayer): Move {
  return optionsOf(d, p).check ? { type: "parole" } : { type: "coucher" };
}

function beginBetting(d: TableState, t: number, rng: Random32): void {
  const h = handOf(d);
  d.phase = "encheres";
  h.bet = 0;
  h.raises = 0;
  h.turn = null;
  for (const p of h.players) p.actAt = null;
  // Il faut deux joueurs avec des jetons pour qu'il y ait des enchères.
  const able = h.players.filter((p) => !p.folded && !p.allIn).map((p) => p.seat);
  h.pending = able.length >= 2 ? able : [];
  continueBetting(d, t, rng);
}

function continueBetting(d: TableState, t: number, rng: Random32): void {
  const h = handOf(d);
  if (h.players.filter((p) => !p.folded).length <= 1) {
    walkover(d, t);
    return;
  }
  if (h.pending.length === 0) {
    endBetting(d, t, rng);
    return;
  }
  h.turn = h.pending[0]!;
  d.step += 1;
  const p = playerInHand(d, h.turn)!;
  const seat = d.seats[p.seat]!;
  h.deadline = t + TURN_MS;
  if (seat.bot !== null) p.actAt = t + think(rng);
  else p.actAt = seat.absent ? t : null;
}

/** Applique un geste d'enchère. Refuse, sans rien toucher, un geste que les règles interdisent. */
function applyMove(d: TableState, p: HandPlayer, move: Move, t: number, rng: Random32, auto: boolean): void {
  const h = handOf(d);
  const seat = d.seats[p.seat]!;
  const o = optionsOf(d, p);
  const inRange = (amount: unknown, range: { min: number; max: number } | null): amount is number =>
    range !== null && typeof amount === "number" && Number.isInteger(amount) && amount >= range.min && amount <= range.max;

  let kind: LogKind;
  let added = 0;
  switch (move.type) {
    case "parole":
      if (!o.check) refuse("ACTION_IMPOSSIBLE");
      kind = "parole";
      break;
    case "coucher":
      kind = "couche";
      break;
    case "suivre":
      if (o.call <= 0) refuse("ACTION_IMPOSSIBLE");
      added = o.call;
      kind = "suit";
      break;
    case "miser":
      if (!inRange(move.amount, o.bet)) refuse("ACTION_IMPOSSIBLE");
      added = move.amount;
      kind = "mise";
      break;
    case "relancer":
      if (!inRange(move.amount, o.raise)) refuse("ACTION_IMPOSSIBLE");
      added = move.amount - p.bet;
      kind = "relance";
      break;
    case "tapis":
      if (!o.allIn) refuse("ACTION_IMPOSSIBLE");
      added = seat.stack;
      kind = p.bet + added <= h.bet ? "suit" : h.bet === 0 ? "mise" : "relance";
      break;
    default:
      refuse("BAD_REQUEST");
  }

  if (kind === "couche") p.folded = true;
  if (added > 0) {
    seat.stack -= added;
    p.bet += added;
    p.committed += added;
    h.pot += added;
    p.allIn = seat.stack === 0;
  }
  if (p.bet > h.bet) {
    // La première mise n'est pas une relance ; tout ce qui la dépasse ensuite en est une.
    if (h.bet > 0) h.raises += 1;
    h.bet = p.bet;
    // Tous les autres doivent répondre, à partir du voisin de celui qui vient de parler.
    const index = h.players.indexOf(p);
    h.pending = [];
    for (let k = 1; k < h.players.length; k++) {
      const q = h.players[(index + k) % h.players.length]!;
      if (!q.folded && !q.allIn) h.pending.push(q.seat);
    }
  } else {
    h.pending = h.pending.filter((s) => s !== p.seat);
  }
  p.actAt = null;
  const extra: Partial<LogEntry> = {};
  if (kind !== "parole" && kind !== "couche") extra.to = p.bet;
  if (p.allIn && added > 0) extra.allIn = true;
  if (auto) extra.auto = true;
  note(d, kind, p.seat, added, extra);
  continueBetting(d, t, rng);
}

/** Fin du tour : la mise que personne n'a suivie retourne à son joueur, puis l'abattage. */
function endBetting(d: TableState, t: number, rng: Random32): void {
  const h = handOf(d);
  h.turn = null;
  h.pending = [];
  const sorted = [...h.players].sort((a, b) => b.committed - a.committed);
  const top = sorted[0]!;
  const excess = top.committed - sorted[1]!.committed;
  if (excess > 0 && !top.folded && !top.gone) {
    const seat = d.seats[top.seat]!;
    seat.stack += excess;
    top.committed -= excess;
    top.bet -= excess;
    top.allIn = false;
    h.pot -= excess;
    h.bet = Math.max(...h.players.map((p) => p.bet));
    note(d, "rendu", top.seat, excess);
  }
  beginShowdown(d, t, rng);
}

// ---------------------------------------------------------------------------
// L'abattage, les accusations, le dénouement

function beginShowdown(d: TableState, t: number, rng: Random32): void {
  const h = handOf(d);
  d.phase = "abattage";
  d.step += 1;
  h.deadline = t + ACCUSE_MS;
  note(d, "abattage", -1);
  for (const p of h.players) {
    p.spoke = false;
    p.accuse = null;
    p.actAt = null;
    if (p.folded) continue;
    const seat = d.seats[p.seat]!;
    if (seat.bot !== null) p.actAt = t + think(rng);
    else if (seat.absent) p.actAt = t;
  }
}

/** Le siège accusé par un robot, s'il est bien un adversaire encore en jeu. */
function checkedTarget(d: TableState, p: HandPlayer, target: number | null): number | null {
  if (target === null || target === p.seat || !isLive(d, target)) return null;
  return target;
}

function speak(d: TableState, p: HandPlayer, target: number | null, auto: boolean): void {
  p.accuse = target;
  p.spoke = true;
  p.actAt = null;
  note(d, "parle", p.seat, 0, auto ? { auto: true } : {});
}

/** La main est finie : les compteurs de présence, puis l'affichage du dénouement. */
function finishHand(d: TableState, t: number, shownFor: number): void {
  const h = handOf(d);
  const dealt = new Set(h.players.filter((p) => !p.gone).map((p) => p.seat));
  d.seats.forEach((seat, index) => {
    if (!seat) return;
    if (seat.reserve > 0) {
      seat.stack += seat.reserve;
      seat.reserve = 0;
    }
    if (seat.bot !== null || seat.seq < 1) return;
    if (dealt.has(index) && !seat.absent) seat.idle = 0;
    else seat.idle += 1;
  });
  // Les cartes et les secrets de la main disparaissent ici : une triche que personne n'a
  // accusée reste secrète pour toujours.
  d.hand = null;
  d.phase = "denouement";
  d.step += 1;
  d.nextAt = t + shownFor;
}

/** Il ne reste qu'un joueur : il prend le pot sans montrer ses cartes. */
function walkover(d: TableState, t: number): void {
  const h = handOf(d);
  const winner = h.players.find((p) => !p.folded) ?? null;
  // Sans personne pour le prendre (cela n'arrive pas), le pot resterait sur la table.
  if (winner) {
    d.seats[winner.seat]!.stack += h.pot;
    note(d, "pot", winner.seat, h.pot);
  }
  d.carry = winner ? 0 : h.pot;
  d.result = {
    no: d.handNo,
    showdown: false,
    hands: [],
    accusations: [],
    unmasked: [],
    pots: [{ amount: h.pot, winners: winner ? [{ seat: winner.seat, amount: h.pot }] : [], carried: !winner }],
    net: h.players.filter((p) => !p.gone).map((p) => ({ seat: p.seat, amount: (p === winner ? h.pot : 0) - p.committed })),
    carry: d.carry,
    until: t + WALKOVER_MS,
  };
  finishHand(d, t, WALKOVER_MS);
}

/** Le dénouement : les accusations d'abord, puis les pots. */
function resolve(d: TableState, t: number): void {
  const h = handOf(d);
  const live = h.players.filter((p) => !p.folded);
  const bySeat = new Map(live.map((p) => [p.seat, p]));
  const net = new Map<number, number>();
  for (const p of h.players) if (!p.gone) net.set(p.seat, -p.committed);
  const gain = (seat: number, amount: number) => net.set(seat, (net.get(seat) ?? 0) + amount);

  // Chaque accusation se juge seule, quel que soit le sort de l'accusateur.
  const accusations: Accusation[] = [];
  const unmasked = new Set<number>();
  for (const accuser of live) {
    if (accuser.accuse === null) continue;
    const target = bySeat.get(accuser.accuse);
    // L'accusé a quitté la main entre-temps : l'accusation tombe.
    if (!target || target === accuser) continue;
    if (target.swap) {
      // Démasqué : il perd toute sa mise, elle reste au pot, et il sort de la main.
      unmasked.add(target.seat);
      accusations.push({ from: accuser.seat, to: target.seat, right: true, paid: 0 });
    } else {
      // Innocent : l'accusateur lui paie sa mise, dans la limite de son tapis. Chacun
      // n'accuse qu'une fois : ce qu'il paie ne dépend pas de ce qu'il reçoit.
      const paid = Math.min(target.committed, d.seats[accuser.seat]!.stack);
      accusations.push({ from: accuser.seat, to: target.seat, right: false, paid });
    }
  }
  for (const a of accusations) {
    if (a.paid <= 0) continue;
    d.seats[a.from]!.stack -= a.paid;
    d.seats[a.to]!.stack += a.paid;
    gain(a.from, -a.paid);
    gain(a.to, a.paid);
  }

  // Chaque pot va à la meilleure main parmi ceux qui y prétendent et ne sont pas démasqués.
  let staked = 0;
  for (const p of h.players) staked += p.committed;
  const order = h.players.map((p) => p.seat);
  const values = new Map(live.map((p) => [p.seat, evaluate(p.cards)]));
  const pots: PotResult[] = [];
  const won = new Map<number, number>();
  let carry = 0;
  for (const pot of sidePots(h.players.map((p) => ({ seat: p.seat, amount: p.committed, live: !p.folded })), h.pot - staked)) {
    if (pot.amount <= 0) continue;
    const contenders = pot.eligible.filter((seat) => !unmasked.has(seat));
    if (contenders.length === 0) {
      // Tous démasqués : ce pot reste sur la table pour la main suivante.
      carry += pot.amount;
      pots.push({ amount: pot.amount, winners: [], carried: true });
      continue;
    }
    const best = Math.max(...contenders.map((seat) => values.get(seat)!.score));
    const winners = splitPot(pot.amount, contenders.filter((seat) => values.get(seat)!.score === best), order);
    for (const w of winners) {
      d.seats[w.seat]!.stack += w.amount;
      gain(w.seat, w.amount);
      won.set(w.seat, (won.get(w.seat) ?? 0) + w.amount);
    }
    pots.push({ amount: pot.amount, winners, carried: false });
  }
  for (const [seat, amount] of won) note(d, "pot", seat, amount);

  d.carry = carry;
  d.result = {
    no: d.handNo,
    showdown: true,
    hands: live.map((p) => ({ seat: p.seat, cards: [...p.cards], category: values.get(p.seat)!.category })),
    accusations,
    unmasked: [...unmasked].map((seat) => {
      const p = bySeat.get(seat)!;
      return { seat, index: p.swap!.index, from: p.swap!.from, to: p.cards[p.swap!.index]! };
    }),
    pots,
    net: [...net].map(([seat, amount]) => ({ seat, amount })),
    carry,
    until: t + RESULT_MS,
  };
  finishHand(d, t, RESULT_MS);
}

// ---------------------------------------------------------------------------
// Les départs et la fermeture

/**
 * Retire un joueur de la table. S'il était dans le coup, il se couche : ce qu'il a versé
 * reste au pot. Son tapis attend dans `ended` de retourner à sa bourse.
 * Rend vrai si c'était à lui de parler.
 */
function removeSeat(d: TableState, index: number, t: number, reason: LeaveReason): boolean {
  const seat = d.seats[index]!;
  const h = d.hand;
  let wasTurn = false;
  if (h) {
    const p = playerInHand(d, index);
    if (p) {
      wasTurn = d.phase === "encheres" && h.turn === index;
      p.folded = true;
      p.gone = true;
      p.actAt = null;
      h.pending = h.pending.filter((s) => s !== index);
    }
  }
  const payout = seat.stack + seat.reserve;
  if (seat.bot === null) {
    d.ended.push({ sid: seat.sid, playerId: seat.playerId, seat: index, payout, received: seat.received, reason, at: t });
    d.audit.out += payout;
    d.departed.push({ playerId: seat.playerId, seat: index, reason, payout, at: t });
    if (d.departed.length > DEPARTED_SIZE) d.departed.splice(0, d.departed.length - DEPARTED_SIZE);
  } else {
    d.audit.bank -= payout;
  }
  d.seats[index] = null;
  note(d, "depart", index, payout);
  if (d.owner === seat.playerId) {
    // La table passe au joueur humain suivant.
    const heirs = seatsAfter(d, index, d.seats.map((_, i) => i).filter((i) => d.seats[i] !== null && d.seats[i]!.bot === null));
    d.owner = heirs.length > 0 ? d.seats[heirs[0]!]!.playerId : null;
  }
  return wasTurn;
}

/** Les sièges des joueurs humains dont la cave est posée. */
function fundedHumans(d: TableState): number[] {
  const out: number[] = [];
  d.seats.forEach((seat, index) => {
    if (seat && seat.bot === null && isFunded(seat)) out.push(index);
  });
  return out;
}

/**
 * Un joueur s'en va. S'il est le dernier humain et qu'aucune main n'est en cours, la
 * table ferme avec lui : il est encore assis au moment du partage d'un pot resté là.
 * En pleine main, il se couche d'abord ; la main continue sans lui.
 */
function depart(d: TableState, index: number, t: number, rng: Random32, reason: LeaveReason): void {
  const seat = d.seats[index]!;
  const humans = fundedHumans(d);
  if (!d.hand && isFunded(seat) && humans.length === 1 && humans[0] === index) {
    closeTable(d, t, "vide", () => reason);
    return;
  }
  const wasTurn = removeSeat(d, index, t, reason);
  afterRemoval(d, t, rng, wasTurn);
}

/** Ce qu'un départ entraîne : une table sans humain se ferme ; sinon la main continue sans lui. */
function afterRemoval(d: TableState, t: number, rng: Random32, wasTurn: boolean): void {
  if (fundedHumans(d).length === 0) {
    closeTable(d, t, "vide", () => "quitte");
    return;
  }
  const h = d.hand;
  if (!h) return;
  if (h.players.filter((p) => !p.folded).length <= 1) {
    walkover(d, t);
    return;
  }
  if (d.phase === "triche" && h.players.every((p) => p.folded || p.chosen)) beginBetting(d, t, rng);
  else if (d.phase === "encheres" && (wasTurn || h.pending.length === 0)) continueBetting(d, t, rng);
  else if (d.phase === "abattage" && h.players.every((p) => p.folded || p.spoke)) resolve(d, t);
}

/**
 * Ferme la table et rend les tapis. Une main en cours est annulée : chacun reprend ce
 * qu'il y avait versé. Un pot resté là est partagé entre les joueurs assis ; la part des
 * robots disparaît avec eux. `reason` : ce qu'on dira à chaque joueur humain encore assis.
 */
function closeTable(d: TableState, t: number, why: CloseReason, reason: (seat: SeatState) => LeaveReason): void {
  const h = d.hand;
  if (h) {
    for (const p of h.players) {
      if (p.gone) continue;
      d.seats[p.seat]!.stack += p.committed;
      h.pot -= p.committed;
    }
    d.carry = h.pot;
    d.hand = null;
  }
  const seated = seatsAfter(d, d.dealer, d.seats.map((_, i) => i).filter((i) => d.seats[i] !== null && isFunded(d.seats[i]!)));
  const shares = new Map(splitPot(d.carry, seated, seated).map((s) => [s.seat, s.amount]));
  if (seated.length === 0) d.audit.bank -= d.carry;
  d.carry = 0;
  for (let index = 0; index < d.seats.length; index++) {
    const seat = d.seats[index];
    if (!seat) continue;
    const share = shares.get(index) ?? 0;
    if (seat.bot !== null) {
      d.audit.bank -= seat.stack + seat.reserve + share;
    } else {
      const payout = seat.stack + seat.reserve + share;
      // Un siège réservé dont la cave n'est jamais arrivée n'a rien à reprendre.
      const cause: LeaveReason = isFunded(seat) ? reason(seat) : "reserve";
      d.ended.push({ sid: seat.sid, playerId: seat.playerId, seat: index, payout, received: seat.received, reason: cause, at: t });
      d.audit.out += payout;
      d.departed.push({ playerId: seat.playerId, seat: index, reason: cause, payout, at: t });
    }
    d.seats[index] = null;
  }
  if (d.departed.length > DEPARTED_SIZE) d.departed.splice(0, d.departed.length - DEPARTED_SIZE);
  d.phase = "fermee";
  d.closed = why;
  d.owner = null;
  d.nextAt = null;
  d.step += 1;
}

// ---------------------------------------------------------------------------
// Les fonctions publiques : (état, action ou heure, hasard) → état

/** Copie de travail, avancée jusqu'à `now`. */
function open(state: TableState, now: number, rng: Random32): { d: TableState; t: number; moved: boolean } {
  const d = clone(state);
  const t = Math.max(now, d.clock);
  const moved = run(d, t, rng);
  return { d, t, moved };
}

function done(state: TableState, d: TableState, changed: boolean): TableState {
  if (!changed) return state;
  d.version = state.version + 1;
  return d;
}

/**
 * L'avance paresseuse : fait arriver tout ce qui devait arriver jusqu'à `now` (délais
 * dépassés, décisions des robots, mains qui s'enchaînent, table qui ferme).
 */
export function advance(state: TableState, now: number, rng: Random32): TableState {
  const at = nextEventAt(state);
  if (at === null || at > Math.max(now, state.clock)) return state;
  const { d } = open(state, now, rng);
  return done(state, d, true);
}

/**
 * Réserve un siège pour un joueur. Aucun argent ne bouge ici : la cave arrive ensuite,
 * par `deposit`. Si le joueur a déjà un siège à cette table, rien ne change.
 */
export function sit(state: TableState, who: Sitter, now: number, rng: Random32): TableState {
  const { d, t, moved } = open(state, now, rng);
  if (d.phase === "fermee") refuse("TABLE_NOT_FOUND");
  if (seatIndexOf(d, who.playerId) >= 0) return done(state, d, moved);
  const free = d.seats.indexOf(null);
  if (free < 0) refuse("TABLE_FULL");
  d.seats[free] = {
    bot: null, playerId: who.playerId, sid: who.sid, pseudo: who.pseudo, species: who.species, look: who.look,
    stack: 0, reserve: 0, seq: 0, received: 0, since: t, missed: 0, absent: false, idle: 0,
  };
  if (d.owner === null) d.owner = who.playerId;
  d.clock = t;
  d.activeAt = t;
  note(d, "arrivee", free);
  return done(state, d, true);
}

/**
 * La table rattrape les dépôts d'un joueur. `seq` et `paid` viennent de sa bourse : le
 * numéro de son dernier dépôt et tout ce qu'il a sorti pour cette séance. La table
 * crédite la différence avec ce qu'elle a déjà reçu, une fois et une seule : rejouer le
 * même dépôt ne change rien. Si le joueur est dans le coup, l'argent attend la main suivante.
 */
export function deposit(state: TableState, sid: string, seq: number, paid: number, now: number, rng: Random32): TableState {
  const { d, t, moved } = open(state, now, rng);
  const index = seatIndexOfSession(d, sid);
  const seat = index >= 0 ? d.seats[index]! : null;
  if (!seat || seq <= seat.seq) return done(state, d, moved);
  const added = paid - seat.received;
  if (added > 0) {
    if (isLive(d, index)) seat.reserve += added;
    else seat.stack += added;
    seat.received = paid;
    d.audit.in += added;
    note(d, "cave", index, added);
  }
  seat.seq = seq;
  present(seat);
  seat.idle = 0;
  d.clock = t;
  d.activeAt = t;
  // La partie attendait un joueur capable de payer la blinde : elle peut repartir.
  if (d.phase === "attente" && d.started && d.nextAt === null && canDeal(d)) d.nextAt = d.handNo === 0 ? t : t + RESTART_MS;
  run(d, t, rng);
  return done(state, d, true);
}

/**
 * Libère un siège réservé dont la cave n'arrivera pas (la bourse a refusé de payer).
 * Si la cave est déjà posée, ou si le siège n'existe plus, rien ne change.
 */
export function cancel(state: TableState, sid: string, now: number, rng: Random32): TableState {
  const { d, t, moved } = open(state, now, rng);
  const index = seatIndexOfSession(d, sid);
  if (index < 0 || d.seats[index]!.seq > 0) return done(state, d, moved);
  d.clock = t;
  depart(d, index, t, rng, "reserve");
  run(d, t, rng);
  return done(state, d, true);
}

/** Un joueur quitte la table. En pleine main, il se couche. */
export function leave(state: TableState, playerId: string, now: number, rng: Random32): TableState {
  const { d, t } = open(state, now, rng);
  const index = seatIndexOf(d, playerId);
  if (index < 0) refuse("NOT_SEATED");
  d.clock = t;
  d.activeAt = t;
  depart(d, index, t, rng, "quitte");
  run(d, t, rng);
  return done(state, d, true);
}

/**
 * Un geste de jeu. `step`, s'il est donné, est celui de la vue sur laquelle le joueur a
 * décidé : un geste qui arrive après que la table a tourné est refusé.
 */
export function act(state: TableState, playerId: string, action: GameAction, now: number, rng: Random32, step?: number): TableState {
  const { d, t } = open(state, now, rng);
  if (d.phase === "fermee") refuse("TABLE_NOT_FOUND");
  const index = seatIndexOf(d, playerId);
  if (index < 0) refuse("NOT_SEATED");
  const seat = d.seats[index]!;
  const p = playerInHand(d, index);

  switch (action.type) {
    case "lancer":
      if (d.kind !== "privee" || d.started || d.owner !== playerId || !canDeal(d)) refuse("ACTION_IMPOSSIBLE");
      d.started = true;
      d.nextAt = t;
      break;
    case "retour":
      seat.idle = 0;
      break;
    case "tricher":
    case "franc-jeu": {
      if (step !== undefined && step !== d.step) refuse("ACTION_IMPOSSIBLE");
      if (d.phase !== "triche" || !p || p.folded || p.chosen) refuse("ACTION_IMPOSSIBLE");
      if (action.type === "franc-jeu") {
        chooseCheat(d, p, null, false);
      } else {
        if (!Number.isInteger(action.index) || action.index < 0 || action.index >= p.cards.length) refuse("BAD_REQUEST");
        if (!isCard(action.card)) refuse("BAD_REQUEST");
        // La carte de son choix, pourvu qu'il ne l'ait pas déjà en main.
        if (p.cards.includes(action.card)) refuse("ACTION_IMPOSSIBLE");
        chooseCheat(d, p, { index: action.index, card: action.card }, false);
      }
      if (handOf(d).players.every((q) => q.folded || q.chosen)) beginBetting(d, t, rng);
      break;
    }
    case "parole":
    case "miser":
    case "suivre":
    case "relancer":
    case "coucher":
    case "tapis": {
      if (step !== undefined && step !== d.step) refuse("ACTION_IMPOSSIBLE");
      if (d.phase !== "encheres" || !p || p.folded) refuse("ACTION_IMPOSSIBLE");
      if (handOf(d).turn !== index) refuse("NOT_YOUR_TURN");
      applyMove(d, p, action, t, rng, false);
      break;
    }
    case "accuser":
    case "rien": {
      if (step !== undefined && step !== d.step) refuse("ACTION_IMPOSSIBLE");
      if (d.phase !== "abattage" || !p || p.folded || p.spoke) refuse("ACTION_IMPOSSIBLE");
      if (action.type === "accuser") {
        if (!Number.isInteger(action.seat)) refuse("BAD_REQUEST");
        // Un autre joueur encore en jeu, et un seul.
        if (action.seat === index || !isLive(d, action.seat)) refuse("ACTION_IMPOSSIBLE");
        speak(d, p, action.seat, false);
      } else {
        speak(d, p, null, false);
      }
      if (handOf(d).players.every((q) => q.folded || q.spoke)) resolve(d, t);
      break;
    }
    default:
      refuse("BAD_REQUEST");
  }
  present(seat);
  d.clock = t;
  d.activeAt = t;
  run(d, t, rng);
  return done(state, d, true);
}

/**
 * Les bourses de ces séances ont été créditées : la table n'a plus rien à leur rendre.
 * Rien de visible ne change : la version reste la même.
 */
export function settled(state: TableState, sids: readonly string[]): TableState {
  if (!state.ended.some((e) => sids.includes(e.sid))) return state;
  const d = clone(state);
  d.ended = d.ended.filter((e) => !sids.includes(e.sid));
  return d;
}
