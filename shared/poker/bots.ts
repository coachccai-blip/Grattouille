// Les robots du Poker Tricheur (POKER.md, section 2).
//
// Trois décisions par main : tricher ou non, que faire aux enchères, accuser ou non.
// Chacune est une fonction pure de ce que le robot voit (la vue de son siège, la même
// qu'un joueur humain) et du hasard injecté. Un robot ne lit jamais l'état de la table.
//
// - Facile : triche rarement (une main sur six) et grossièrement (la plus belle main
//   possible : il se fait un carré), mise selon sa main, suit trop, accuse rarement et au hasard.
// - Normal : triche une fois sur trois quand cela améliore sa combinaison ; mise selon sa
//   force, bluffe un peu ; accuse une main trop belle (full ou mieux) une fois sur deux, et
//   toujours quand un adversaire montre une carte qu'il a lui-même reçue.
// - Difficile : triche une fois sur deux, discrètement (un brelan, une suite, une couleur,
//   jamais plus) ; relance et bluffe avec mesure ; accuse d'après la vraisemblance de la
//   main montrée, et tient une carte en double pour une preuve quand il en détient l'autre.

import { uniformInt } from "../economy";
import { DECK, type Card, type Random32 } from "./cards";
import { CATEGORIES, evaluate, type HandValue } from "./hands";
import type { Difficulty, GameAction, Range, SeatView, TableView } from "./types";

export type BetMove = Extract<GameAction, { type: "parole" | "miser" | "suivre" | "relancer" | "coucher" }>;

export interface Swap {
  /** La place de la carte remplacée, de 0 à 4. */
  index: number;
  card: Card;
}

const BRELAN = CATEGORIES.indexOf("brelan");
const COULEUR = CATEGORIES.indexOf("couleur");
const FULL = CATEGORIES.indexOf("full");

/** Vrai `num` fois sur `den`. */
function chance(rng: Random32, num: number, den: number): boolean {
  return uniformInt(den, rng) < num;
}

/** Un nombre entre 0 inclus et 1 exclu, au millième. */
function roll(rng: Random32): number {
  return uniformInt(1000, rng) / 1000;
}

// ---------------------------------------------------------------------------
// La force d'une main

/** Plancher et étendue de chaque combinaison, de la carte haute à la quinte flush. */
const FLOOR = [0.02, 0.15, 0.40, 0.55, 0.70, 0.78, 0.86, 0.94, 0.99];
const SPAN = [0.10, 0.20, 0.10, 0.12, 0.06, 0.06, 0.06, 0.04, 0.01];

/**
 * La force d'une main, entre 0 et 1 : la combinaison d'abord, puis sa hauteur. Une paire
 * vaut de 0,15 à 0,35, un brelan de 0,55 à 0,67, un full de 0,86 à 0,92. À cette table,
 * où chacun peut s'offrir une carte, un brelan est une main moyenne.
 */
export function handStrength(cards: readonly Card[]): number {
  const value = evaluate(cards);
  const height = ((value.ranks[0] ?? 2) - 2) / 12;
  return FLOOR[value.level]! + SPAN[value.level]! * height;
}

// ---------------------------------------------------------------------------
// La triche

/** Toutes les façons de remplacer une carte : 5 places, 47 cartes qu'il n'a pas en main. */
export function possibleSwaps(cards: readonly Card[]): { swap: Swap; value: HandValue }[] {
  const out: { swap: Swap; value: HandValue }[] = [];
  const free = DECK.filter((card) => !cards.includes(card));
  for (let index = 0; index < cards.length; index++) {
    for (const card of free) {
      const next = [...cards];
      next[index] = card;
      out.push({ swap: { index, card }, value: evaluate(next) });
    }
  }
  return out;
}

/** Le meilleur remplacement parmi ceux que `keep` accepte ; à égalité, au hasard. */
function bestSwap(cards: readonly Card[], rng: Random32, keep: (value: HandValue) => boolean): Swap | null {
  let best: Swap[] = [];
  let score = -1;
  for (const { swap, value } of possibleSwaps(cards)) {
    if (!keep(value)) continue;
    if (value.score > score) {
      score = value.score;
      best = [swap];
    } else if (value.score === score) best.push(swap);
  }
  return best.length === 0 ? null : best[uniformInt(best.length, rng)]!;
}

/** Tricher ou non. `null` : franc jeu. */
export function botCheat(view: TableView, level: Difficulty, rng: Random32): Swap | null {
  const hand = view.hand;
  if (!hand || hand.chosen || hand.folded) return null;
  const current = evaluate(hand.cards);
  if (level === "facile") {
    // Rarement, et grossièrement : la plus belle main qu'une carte puisse lui donner.
    if (!chance(rng, 1, 6)) return null;
    return bestSwap(hand.cards, rng, (value) => value.score > current.score);
  }
  if (level === "normal") {
    // Seulement quand la combinaison y gagne, et une fois sur trois.
    if (!chance(rng, 1, 3)) return null;
    return bestSwap(hand.cards, rng, (value) => value.level > current.level);
  }
  // Discrètement : un brelan, une suite ou une couleur, jamais un full ni un carré.
  if (!chance(rng, 1, 2)) return null;
  return bestSwap(hand.cards, rng, (value) => value.level > current.level && value.level >= BRELAN && value.level <= COULEUR);
}

// ---------------------------------------------------------------------------
// Les enchères

function clamp(amount: number, range: Range): number {
  return Math.max(range.min, Math.min(range.max, Math.round(amount)));
}

/** Parole si elle est permise, sinon se coucher : ce que fait aussi un joueur qui laisse passer son tour. */
function pass(view: TableView): BetMove {
  return view.options.check ? { type: "parole" } : { type: "coucher" };
}

/** Miser (ou relancer) une part du pot. Si le geste n'est pas permis : suivre, ou parole. */
function push(view: TableView, share: number): BetMove {
  const o = view.options;
  if (o.bet) return { type: "miser", amount: clamp(view.pot * share, o.bet) };
  if (o.raise) return { type: "relancer", amount: clamp(view.bet + (view.pot + o.call) * share, o.raise) };
  if (o.call > 0) return { type: "suivre" };
  return pass(view);
}

/** Que faire quand c'est à lui de parler. */
export function botBet(view: TableView, level: Difficulty, rng: Random32): BetMove {
  const o = view.options;
  const hand = view.hand;
  if (!hand) return pass(view);
  const strength = handStrength(hand.cards);
  // Deux tirages par décision, toujours : l'un décide, l'autre dose la mise.
  const mood = roll(rng);
  const size = roll(rng);
  const facing = o.call > 0;
  // Le prix à payer pour voir : la part du pot final qu'il faut y mettre.
  const price = facing ? o.call / (view.pot + o.call) : 0;

  if (level === "facile") {
    if (!facing) {
      // Il mise selon sa main, sans jamais bluffer.
      if (strength >= 0.40) return push(view, 0.25 + 0.5 * strength);
      return pass(view);
    }
    if (strength >= 0.86 && mood < 0.5) return push(view, 0.5);
    // Il suit trop : toute paire, et une fois sur deux sans rien.
    if (strength >= 0.15 || mood < 0.5) return { type: "suivre" };
    return { type: "coucher" };
  }

  if (level === "normal") {
    if (!facing) {
      if (strength >= 0.55) return push(view, 0.5 + 0.25 * size);
      if (strength >= 0.40) return mood < 0.5 ? push(view, 0.33) : pass(view);
      // Il bluffe un peu.
      if (strength < 0.30 && mood < 0.10) return push(view, 0.5);
      return pass(view);
    }
    if (strength >= 0.78 && mood < 0.6) return push(view, 0.5 + 0.4 * size);
    if (strength >= 0.25 + 0.9 * price) return { type: "suivre" };
    return { type: "coucher" };
  }

  // Difficile : il relance et bluffe avec mesure.
  if (!facing) {
    if (strength >= 0.70) return mood < 0.85 ? push(view, 0.6 + 0.3 * size) : pass(view);
    if (strength >= 0.55) return mood < 0.75 ? push(view, 0.5 + 0.16 * size) : pass(view);
    if (strength >= 0.40) return mood < 0.40 ? push(view, 0.33) : pass(view);
    if (strength < 0.30 && mood < 0.15) return push(view, 0.66);
    return pass(view);
  }
  if (strength >= 0.70 && mood < 0.5) return push(view, 0.5 + 0.5 * size);
  if (strength < 0.25 && mood >= 0.95 && o.raise) return push(view, 0.75);
  if (strength >= 0.30 + 0.9 * price) return { type: "suivre" };
  return { type: "coucher" };
}

// ---------------------------------------------------------------------------
// Les accusations

/**
 * Ce qu'une main montrée a de suspect, par combinaison : une main rare l'est davantage.
 * De la carte haute à la quinte flush.
 */
const SUSPICION = [0, 0.02, 0.05, 0.30, 0.40, 0.45, 0.65, 0.85, 0.95];
/** Deux adversaires montrent la même carte : l'un des deux au moins a triché. */
const TWIN_SUSPICION = 0.6;
/** À tapis, une accusation fausse ne coûte rien : il suffit d'un doute. */
const FREE_SUSPICION = 0.2;

function strongest(seats: readonly SeatView[]): SeatView {
  return [...seats].sort((a, b) => evaluate(b.cards!).score - evaluate(a.cards!).score || a.seat - b.seat)[0]!;
}

/** Accuser un siège, ou `null` : rien à dire. */
export function botAccuse(view: TableView, level: Difficulty, rng: Random32): number | null {
  const hand = view.hand;
  const me = view.you;
  if (me === null || !hand || hand.folded) return null;
  const rivals = view.seats.filter((s): s is SeatView => s !== null && s.seat !== me && s.cards !== null);
  if (rivals.length === 0) return null;

  if (level === "facile") {
    return chance(rng, 1, 10) ? rivals[uniformInt(rivals.length, rng)]!.seat : null;
  }

  // Les cartes qu'il a vraiment reçues : celles qu'il tient encore, et celle qu'il a écartée.
  // Le paquet n'en compte qu'une de chaque : quiconque en montre une l'a glissée dans sa main.
  const dealt = new Set(hand.cards.filter((_, index) => index !== hand.swap?.index));
  if (hand.swap) dealt.add(hand.swap.from);
  const proven = rivals.filter((s) => s.cards!.some((card) => dealt.has(card)));
  if (proven.length > 0) return strongest(proven).seat;

  if (level === "normal") {
    const tooGood = rivals.filter((s) => evaluate(s.cards!).level >= FULL);
    if (tooGood.length === 0) return null;
    return chance(rng, 1, 2) ? strongest(tooGood).seat : null;
  }

  // Difficile : il pèse la vraisemblance, et ne s'en prend qu'à une main qui bat la sienne.
  const own = evaluate(hand.cards).score;
  const shown = new Map<Card, number>();
  for (const s of rivals) for (const card of s.cards!) shown.set(card, (shown.get(card) ?? 0) + 1);
  let target: SeatView | null = null;
  let doubt = 0;
  for (const s of rivals) {
    const value = evaluate(s.cards!);
    if (value.score < own) continue;
    let suspicion = SUSPICION[value.level]!;
    if (s.cards!.some((card) => shown.get(card)! > 1)) suspicion = Math.max(suspicion, TWIN_SUSPICION);
    if (suspicion > doubt) {
      doubt = suspicion;
      target = s;
    }
  }
  if (!target) return null;
  if (view.seats[me]!.stack === 0) return doubt >= FREE_SUSPICION ? target.seat : null;
  return roll(rng) < doubt ? target.seat : null;
}
