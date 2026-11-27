// Les robots du Poker Tricheur (POKER.md, section 2).
//
// Trois décisions par main : tricher ou non, que faire aux enchères, accuser ou non.
// Chacune est une fonction pure de ce que le robot voit (la vue de son siège, la même
// qu'un joueur humain) et du hasard injecté. Un robot ne lit jamais l'état de la table.
//
// Aux enchères (sans limite), tous misent gros quand ils sont confiants : jusqu'à trois
// fois le pot, et parfois tout leur tapis sur une très belle main. Ce qui les distingue :
// - Facile : triche rarement (une main sur six) et grossièrement (la plus belle main
//   possible : il se fait un carré) ; sa mise dit sa main ; il bluffe rarement et mal
//   (toujours trop gros) ; il suit trop ; il accuse rarement et au hasard.
// - Normal : triche une fois sur trois quand cela améliore sa combinaison ; bluffe un peu,
//   avec la mise d'une belle main ; face à une mise, pèse la cote du pot ; accuse une main
//   trop belle (full ou mieux) une fois sur deux, et toujours quand un adversaire montre
//   une carte qu'il a lui-même reçue.
// - Difficile : triche une fois sur deux, discrètement (un brelan, une suite, une couleur,
//   jamais plus ; s'il n'y a rien de discret à gagner, il s'abstient) ; dose ses bluffs
//   (ils ont la taille de ses belles mains) et tend des pièges ; pèse la cote du pot ;
//   accuse d'après la vraisemblance de la main montrée, et tient une carte en double pour
//   une preuve quand il en détient l'autre.

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
//
// Les enchères sont sans limite, et les robots s'en servent : une main confiante mise
// gros, jusqu'à trois fois le pot, d'autant plus gros qu'elle est belle. Ils bluffent
// aussi, chacun à sa mesure, si bien qu'une grosse mise ne dit pas à coup sûr une belle
// main. Et face à une grosse mise, ils pèsent la cote du pot au lieu de se coucher par
// principe : pousser son tapis à chaque main ne rapporte rien contre eux.

/** Un robot ne mise jamais plus de trois fois le pot, sauf à pousser son tapis sur une très belle main. */
export const BOT_MAX_POTS = 3;

function clamp(amount: number, range: Range): number {
  return Math.max(range.min, Math.min(range.max, Math.round(amount)));
}

/** La valeur d'une courbe en segments de droite, donnée par ses points (abscisses croissantes). */
function along(points: readonly (readonly [number, number])[], x: number): number {
  if (x <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    if (x > x1) continue;
    const [x0, y0] = points[i - 1]!;
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return points[points.length - 1]![1];
}

/**
 * Ce qu'une main confiante mise, en parts du pot : un demi-pot avec deux paires, le pot
 * avec un brelan, près de deux fois le pot avec une suite ou une couleur, deux fois et
 * demie à trois fois avec un full ou mieux. Plus il est confiant, plus il mise gros.
 */
const BOLDNESS: readonly (readonly [strength: number, pots: number])[] = [
  [0.40, 0.5], [0.55, 1], [0.70, 1.6], [0.86, 2.4], [0.94, BOT_MAX_POTS],
];

/** La part du pot que vaut une main de cette force, à un cinquième près selon l'humeur. */
function boldness(strength: number, size: number): number {
  return Math.min(BOT_MAX_POTS, along(BOLDNESS, strength) * (0.8 + 0.4 * size));
}

/**
 * La force qu'il faut pour suivre, selon le prix : la part du pot final qu'il faut y mettre
 * (un tiers pour une mise du pot, trois septièmes pour trois fois le pot, presque la moitié
 * pour un gros tapis). Une petite mise se suit avec une paire ; le pot, avec une paire de
 * six ; trois fois le pot, avec une paire de valets ; un tapis de cinq fois le pot, avec
 * deux paires ; au-delà, avec un brelan. C'est assez souvent pour que miser gros sans rien
 * ne rapporte pas (mesuré : un joueur qui pousse son tapis à chaque main y perd).
 */
const CALLING: readonly (readonly [price: number, strength: number])[] = [
  [0.20, 0.15], [1 / 3, 0.20], [3 / 7, 0.30], [5 / 11, 0.40], [9 / 19, 0.55], [0.49, 0.64],
];

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

/** Pousser tout son tapis. Si le geste n'est pas permis : suivre, ou parole. */
function shove(view: TableView): BetMove {
  const o = view.options;
  if (o.bet) return { type: "miser", amount: o.bet.max };
  if (o.raise) return { type: "relancer", amount: o.raise.max };
  if (o.call > 0) return { type: "suivre" };
  return pass(view);
}

/** Une main très belle (un full ou mieux) pousse parfois tout son tapis : une fois sur quatre. */
const SHOVE_FROM = 0.86;

/** Miser selon sa confiance ; avec une très belle main, tout le tapis une fois sur quatre. */
function bold(view: TableView, strength: number, size: number): BetMove {
  if (strength >= SHOVE_FROM && size >= 0.75) return shove(view);
  return push(view, boldness(strength, size));
}

/** Un bluff : la mise d'une belle main qu'il n'a pas, du pot à trois fois le pot. */
function bluff(view: TableView, size: number): BetMove {
  return push(view, boldness(0.55 + 0.4 * size, size));
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
      // Il mise selon sa main, et cela se voit : plus elle est belle, plus il mise gros.
      if (strength >= 0.40) return bold(view, strength, size);
      // Il bluffe rarement, et mal : toujours trop gros, avec rien du tout.
      if (strength < 0.15 && mood < 0.04) return push(view, 2 + size);
      return pass(view);
    }
    if (strength >= 0.86 && mood < 0.5) return bold(view, strength, size);
    // Il suit trop : toute paire, et une fois sur deux sans rien.
    if (strength >= 0.15 || mood < 0.5) return { type: "suivre" };
    return { type: "coucher" };
  }

  if (level === "normal") {
    if (!facing) {
      if (strength >= 0.55) return bold(view, strength, size);
      if (strength >= 0.40) return mood < 0.5 ? bold(view, strength, size) : pass(view);
      // Il bluffe un peu : une main sur dix quand il n'a rien, avec la mise d'une belle main.
      if (strength < 0.30 && mood < 0.10) return bluff(view, size);
      return pass(view);
    }
    if (strength >= 0.78 && mood < 0.6) return bold(view, strength, size);
    // Il relance pour rien une fois sur cinquante : assez pour qu'on ne le lise pas à coup sûr.
    if (strength < 0.25 && mood >= 0.98 && o.raise) return bluff(view, size);
    if (strength >= along(CALLING, price)) return { type: "suivre" };
    return { type: "coucher" };
  }

  // Difficile : il mise gros quand il est confiant, bluffe avec mesure, et tend des pièges.
  if (!facing) {
    if (strength >= 0.70) return mood < 0.85 ? bold(view, strength, size) : pass(view);
    if (strength >= 0.55) return mood < 0.75 ? bold(view, strength, size) : pass(view);
    if (strength >= 0.40) return mood < 0.40 ? bold(view, strength, size) : pass(view);
    // Ses bluffs ont la taille de ses belles mains : rien ne les en distingue.
    if (strength < 0.30 && mood < 0.15) return bluff(view, size);
    return pass(view);
  }
  if (strength >= 0.70 && mood < 0.5) return bold(view, strength, size);
  if (strength < 0.25 && mood >= 0.95 && o.raise) return bluff(view, size);
  // Il pèse le prix un peu plus sévèrement que le robot normal.
  if (strength >= along(CALLING, price) + 0.03) return { type: "suivre" };
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
  let best = 0;
  for (const s of rivals) {
    const value = evaluate(s.cards!);
    if (value.score < own) continue;
    let suspicion = SUSPICION[value.level]!;
    if (s.cards!.some((card) => shown.get(card)! > 1)) suspicion = Math.max(suspicion, TWIN_SUSPICION);
    // À soupçon égal, il vise la main la plus forte : c'est elle qui lui prend le pot. La place
    // autour de la table n'y est pour rien (le joueur, toujours au premier siège, n'est pas visé d'abord).
    if (suspicion > doubt || (target !== null && suspicion === doubt && value.score > best)) {
      doubt = suspicion;
      target = s;
      best = value.score;
    }
  }
  if (!target) return null;
  if (view.seats[me]!.stack === 0) return doubt >= FREE_SUSPICION ? target.seat : null;
  return roll(rng) < doubt ? target.seat : null;
}
