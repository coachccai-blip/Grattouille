// Les calculs des écrans du Poker Tricheur : rien ici ne touche à l'écran, au réseau ni
// à la langue. Qui s'assoit où autour du tapis, les mises proposées, les cartes qu'on
// peut glisser, ce que raconte un dénouement. Des fonctions pures, que les tests éprouvent.

import { RANK_CHARS, SUIT_CHARS, type Card } from "../../../shared/poker/cards";
import { evaluate, type HandCategory } from "../../../shared/poker/hands";
import {
  ACCUSE_MS, CHEAT_MS, MAX_BUYIN_BLINDS, MIN_BUYIN_BLINDS, RESTART_MS, RESULT_MS, TABLE_CODE_LENGTH, TURN_MS, WALKOVER_MS,
} from "../../../shared/poker/rules";
import type { HandResult, Options, PokerAction, Range, SeatView, TableView } from "../../../shared/poker/types";
import { CODE_ALPHABET } from "../../../shared/rules";

// ---------------------------------------------------------------------------
// Le temps

/** Ce qu'il reste avant une échéance du serveur, vu de l'appareil. `offset` : heure du serveur moins heure de l'appareil. */
export function remainingMs(deadline: number | null, offset: number, now: number): number {
  return deadline === null ? 0 : Math.max(0, deadline - (now + offset));
}

/** La durée entière du temps en cours : la barre de temps se mesure à elle. */
export function phaseTotal(view: Pick<TableView, "phase" | "result" | "handNo">): number {
  switch (view.phase) {
    case "triche": return CHEAT_MS;
    case "encheres": return TURN_MS;
    case "abattage": return ACCUSE_MS;
    case "denouement": return view.result && view.result.no === view.handNo && !view.result.showdown ? WALKOVER_MS : RESULT_MS;
    case "attente": return RESTART_MS;
    default: return 0;
  }
}

// ---------------------------------------------------------------------------
// Autour du tapis

export interface Neighbour {
  seat: number;
  /** `null` : le siège est libre. */
  who: SeatView | null;
}

/**
 * Les autres sièges, dans le sens de la table à partir du voisin du joueur : c'est
 * l'ordre de la parole. Qui regarde sans être assis voit tous les sièges, du premier au dernier.
 */
export function neighbours(view: Pick<TableView, "seats" | "you">): Neighbour[] {
  const n = view.seats.length;
  const out: Neighbour[] = [];
  if (view.you === null) {
    view.seats.forEach((who, seat) => out.push({ seat, who }));
    return out;
  }
  for (let k = 1; k < n; k++) {
    const seat = (view.you + k) % n;
    out.push({ seat, who: view.seats[seat] ?? null });
  }
  return out;
}

export type Side = "gauche" | "haut" | "droite";

/**
 * Où s'assoit chaque voisin : jusqu'à trois, ils tiennent en face ; au-delà, le premier
 * et le dernier prennent les côtés du tapis. La parole tourne ainsi comme autour d'une
 * vraie table : à gauche, en face, à droite.
 */
export function sidesFor(count: number): Side[] {
  if (count <= 3) return Array.from({ length: count }, () => "haut" as const);
  return ["gauche", ...Array.from({ length: count - 2 }, () => "haut" as const), "droite"];
}

// ---------------------------------------------------------------------------
// Les enchères

export interface BetChoice {
  /** `min` : la plus petite mise permise ; `milieu` : entre les deux ; `pot` : la plus grosse (la limite du pot) ; `tapis` : tout le tapis. */
  size: "min" | "milieu" | "pot" | "tapis";
  /** Ce que la mise du joueur vaudra dans le tour (pour une relance), ou les jetons posés (pour une première mise). */
  amount: number;
  action: PokerAction;
}

/**
 * Les mises à proposer : la plus petite, une moyenne, la plus grosse. Trois au plus, toutes
 * permises (les bornes de `options.bet` ou `options.raise`, comprises). Quand la plus grosse
 * engage tout le tapis, c'est un tapis.
 */
export function betChoices(o: Pick<Options, "bet" | "raise" | "allIn">): BetChoice[] {
  const first = o.bet !== null;
  const range: Range | null = o.bet ?? o.raise;
  if (!range || range.max < range.min) return [];
  const make = (amount: number): PokerAction => (first ? { type: "miser", amount } : { type: "relancer", amount });
  const out: BetChoice[] = [{ size: "min", amount: range.min, action: make(range.min) }];
  const middle = Math.round((range.min + range.max) / 2);
  if (middle > range.min && middle < range.max) out.push({ size: "milieu", amount: middle, action: make(middle) });
  if (range.max > range.min) out.push({ size: "pot", amount: range.max, action: make(range.max) });
  // La limite du pot laisse pousser tout le tapis : la plus grosse mise est un tapis.
  if (o.allIn) {
    const last = out[out.length - 1]!;
    out[out.length - 1] = { size: "tapis", amount: last.amount, action: { type: "tapis" } };
  }
  return out;
}

// ---------------------------------------------------------------------------
// La triche

export const RANKS: readonly string[] = [...RANK_CHARS].reverse();
export const SUITS: readonly string[] = [...SUIT_CHARS];

/** Une valeur dont le joueur tient déjà les quatre couleurs, ou la carte exacte une fois la couleur choisie. */
export function rankTaken(hand: readonly Card[], rank: string, suit: string | null): boolean {
  if (suit !== null) return hand.includes(`${rank}${suit}`);
  return SUITS.every((s) => hand.includes(`${rank}${s}`));
}

/** Une couleur dont le joueur tient déjà les treize cartes (jamais, à cinq cartes), ou la carte exacte une fois la valeur choisie. */
export function suitTaken(hand: readonly Card[], suit: string, rank: string | null): boolean {
  if (rank !== null) return hand.includes(`${rank}${suit}`);
  return RANKS.every((r) => hand.includes(`${r}${suit}`));
}

/** La main une fois la carte glissée à cette place, et la combinaison qu'elle donne. */
export function swapped(hand: readonly Card[], index: number, card: Card): { cards: Card[]; category: HandCategory } {
  const cards = [...hand];
  cards[index] = card;
  return { cards, category: evaluate(cards).category };
}

// ---------------------------------------------------------------------------
// L'abattage

/** Les cartes montrées deux fois : l'une des deux, au moins, a été glissée. C'est un indice. */
export function doubles(hands: readonly (readonly Card[])[]): Set<Card> {
  const seen = new Set<Card>();
  const twice = new Set<Card>();
  for (const hand of hands) {
    for (const card of hand) {
      if (seen.has(card)) twice.add(card);
      else seen.add(card);
    }
  }
  return twice;
}

/** Ce qu'une accusation à tort coûterait : la mise de l'accusé, dans la limite de son propre tapis. */
export function accusationCost(target: Pick<SeatView, "committed">, mine: Pick<SeatView, "stack">): number {
  return Math.max(0, Math.min(target.committed, mine.stack));
}

// ---------------------------------------------------------------------------
// Le dénouement : ce qui s'est passé, dans l'ordre où on le raconte

export type OutcomeLine =
  /** Un tricheur démasqué : la fausse carte, celle qu'il avait reçue, et ceux qui l'ont vu. */
  | { kind: "demasque"; seat: number; fake: Card; real: Card; by: number[] }
  /** Une accusation à tort : l'accusateur paie l'innocent. */
  | { kind: "tort"; from: number; to: number; paid: number }
  /** Un pot ramassé par un seul joueur. `side` : un pot annexe. */
  | { kind: "pot"; seat: number; amount: number; side: boolean }
  /** Un pot partagé entre des mains égales. */
  | { kind: "partage"; seats: number[]; amount: number; side: boolean }
  /** Tous ceux qui y prétendaient sont démasqués : le pot reste sur la table. */
  | { kind: "reste"; amount: number }
  /** Tout le monde s'est couché : le dernier prend le pot sans montrer ses cartes. */
  | { kind: "seul"; seat: number; amount: number };

/** Le récit d'un dénouement : les accusations d'abord, puis les pots. */
export function outcomeLines(result: HandResult): OutcomeLine[] {
  const out: OutcomeLine[] = [];
  for (const u of result.unmasked) {
    const by = result.accusations.filter((a) => a.right && a.to === u.seat).map((a) => a.from);
    out.push({ kind: "demasque", seat: u.seat, fake: u.to, real: u.from, by });
  }
  for (const a of result.accusations) {
    if (!a.right) out.push({ kind: "tort", from: a.from, to: a.to, paid: a.paid });
  }
  result.pots.forEach((pot, index) => {
    if (pot.amount <= 0) return;
    const side = index > 0;
    if (!result.showdown && pot.winners.length === 1) {
      out.push({ kind: "seul", seat: pot.winners[0]!.seat, amount: pot.amount });
    } else if (pot.carried || pot.winners.length === 0) {
      out.push({ kind: "reste", amount: pot.amount });
    } else if (pot.winners.length === 1) {
      out.push({ kind: "pot", seat: pot.winners[0]!.seat, amount: pot.amount, side });
    } else {
      out.push({ kind: "partage", seats: pot.winners.map((w) => w.seat), amount: pot.amount, side });
    }
  });
  return out;
}

/** Un battement du dénouement, tel que l'écran le met en scène. */
export interface Beat {
  /** `accuse` : « Tricheur ! » ; `verdict` : démasqué ou innocent ; `pots` : le pot est ramassé. */
  kind: "accuse" | "verdict" | "pots";
  /** Le siège accusé (pour `accuse` et `verdict`) ; -1 pour les pots. */
  seat: number;
  /** Ce que dure le battement avant le suivant, en millisecondes. */
  ms: number;
}

/** Le temps laissé à toutes les accusations d'une main, quel que soit leur nombre. */
const ACCUSATIONS_MS = 4_500;

/**
 * Les battements d'un dénouement : les accusations, un accusé après l'autre, puis les
 * pots. Une accusation seule a droit à son moment (le cri, puis le verdict) ; à
 * plusieurs, les verdicts s'enchaînent, et le tout tient en quatre secondes et demie.
 */
export function beatsOf(result: HandResult): Beat[] {
  const targets = [...new Set(result.accusations.map((a) => a.to))];
  const beats: Beat[] = [];
  if (targets.length === 1) {
    beats.push({ kind: "accuse", seat: targets[0]!, ms: 1_300 }, { kind: "verdict", seat: targets[0]!, ms: 2_000 });
  } else {
    const each = targets.length > 0 ? Math.min(1_500, Math.round(ACCUSATIONS_MS / targets.length)) : 0;
    for (const seat of targets) beats.push({ kind: "verdict", seat, ms: each });
  }
  beats.push({ kind: "pots", seat: -1, ms: 0 });
  return beats;
}

/** À quel battement chaque ligne du récit se lit : avec le verdict de son accusé, ou avec les pots. */
export function lineBeats(lines: readonly OutcomeLine[], beats: readonly Beat[]): number[] {
  const verdictAt = (seat: number) => beats.findIndex((b) => b.kind === "verdict" && b.seat === seat);
  const pots = beats.findIndex((b) => b.kind === "pots");
  return lines.map((line) => {
    if (line.kind === "demasque") return Math.max(0, verdictAt(line.seat));
    if (line.kind === "tort") return Math.max(0, verdictAt(line.to));
    return pots;
  });
}

/** Le bilan de la main pour un siège : ce qu'il a reçu moins ce qu'il a versé. `null` s'il n'était pas servi. */
export function netOf(result: HandResult, seat: number | null): number | null {
  if (seat === null) return null;
  const entry = result.net.find((n) => n.seat === seat);
  return entry ? entry.amount : null;
}

/** Les sièges qui ramassent quelque chose : leur rangée se met en avant. */
export function winnersOf(result: HandResult): Set<number> {
  const out = new Set<number>();
  for (const pot of result.pots) for (const w of pot.winners) if (w.amount > 0) out.add(w.seat);
  return out;
}

// ---------------------------------------------------------------------------
// Les caves

/**
 * Les caves proposées : de dix blindes en dix blindes entre les bornes de la table,
 * bornes comprises, sans dépasser la bourse. Vide si la bourse ne couvre pas la cave minimale.
 */
export function buyInSteps(min: number, max: number, blind: number, balance: number): number[] {
  const top = Math.min(max, Math.floor(balance));
  if (top < min || blind <= 0) return [];
  const out = new Set<number>([min]);
  const step = blind * 10;
  for (let amount = Math.ceil(min / step) * step; amount <= top; amount += step) if (amount >= min) out.add(amount);
  // Tout ce que la bourse permet, quand elle s'arrête entre deux crans.
  out.add(top);
  return [...out].sort((a, b) => a - b);
}

/** La cave proposée d'abord : cinquante blindes, ou ce qui s'en approche le plus sans les dépasser. */
export function defaultBuyIn(steps: readonly number[], blind: number): number | null {
  if (steps.length === 0) return null;
  const wanted = blind * 50;
  let best = steps[0]!;
  for (const amount of steps) if (amount <= wanted) best = amount;
  return best;
}

/** Les caves maximales qu'un créateur peut choisir : 20, 40, 60, 80 ou 100 blindes. */
export function maxBuyInChoices(blind: number): number[] {
  const out: number[] = [];
  for (let n = MIN_BUYIN_BLINDS; n <= MAX_BUYIN_BLINDS; n += 20) out.push(n * blind);
  return out;
}

// ---------------------------------------------------------------------------
// Le code d'une table

/** Ce qu'on tape devient un code : capitales, sans espace ni tiret, cinq caractères au plus, ceux de l'alphabet des codes. */
export function cleanCode(raw: string): string {
  let out = "";
  for (const ch of raw.toUpperCase()) {
    if (CODE_ALPHABET.includes(ch)) out += ch;
    if (out.length >= TABLE_CODE_LENGTH) break;
  }
  return out;
}

export function isFullCode(code: string): boolean {
  return code.length === TABLE_CODE_LENGTH;
}

// ---------------------------------------------------------------------------
// Le journal : ce qui vient d'arriver à la table, pour l'animer

/** Les entrées du journal que l'écran n'a pas encore montrées. Après une longue pause, on ne rejoue que la fin. */
export function freshEntries<T extends { n: number }>(log: readonly T[], seen: number, max = 12): T[] {
  const fresh = log.filter((entry) => entry.n > seen);
  return fresh.length > max ? fresh.slice(fresh.length - max) : fresh;
}
