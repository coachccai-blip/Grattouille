// Les robots du Poker Tricheur (POKER.md, section 2).
//
// Trois décisions par main : tricher ou non, que faire aux enchères, accuser ou non.
// Chacune est une fonction pure de ce que le robot voit (la vue de son siège, la même
// qu'un joueur humain) et du hasard injecté. Un robot ne lit jamais l'état de la table.
//
// Ce qu'ils ont en commun :
// - aux enchères (sans limite), ils misent gros quand ils sont confiants : jusqu'à trois
//   fois le pot, et parfois tout leur tapis sur une très belle main ;
// - face à une mise, ils se défendent : on ne les plume pas en misant à chaque main. Une
//   petite mise se suit presque toujours ; le pot, plus d'une fois sur deux ;
// - à l'abattage, ils savent qu'une belle main est rare dans une donne honnête (un brelan
//   ou mieux : moins de trois donnes sur cent) : celle qu'on leur montre doit souvent
//   quelque chose à une carte glissée. Ils pèsent ce que l'accusation rapporte contre ce
//   qu'elle coûte, et ils disent « tricheur » dès que le pari est bon.
//
// Ce qui les distingue :
// - Facile : triche rarement (une main sur six) et grossièrement (la plus belle main
//   possible : il se fait un carré) ; sa mise dit sa main ; il bluffe rarement et mal
//   (toujours trop gros) ; il suit trop ; il accuse au jugé, et rate souvent une belle main.
// - Normal : solide. Triche une fois sur trois, pour une main plausible (une belle paire,
//   un brelan, au plus une couleur) ; bluffe un peu ; se défend selon le prix ; accuse
//   près d'une fois sur deux la belle main qui le bat, et toujours une carte qu'il a
//   lui-même reçue.
// - Difficile : redoutable. Triche une fois sur deux, pour des mains qu'on ne remarque
//   pas (une belle paire, deux paires, un brelan), et se fait oublier quand on vient de
//   l'accuser ; dose ses bluffs et tend des pièges ; se défend un peu plus que le robot
//   normal ; ne laisse presque jamais passer une belle main qui le bat, et se souvient
//   d'un tricheur démasqué à la main précédente.

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

const PAIRE = CATEGORIES.indexOf("paire");
const DEUX_PAIRES = CATEGORIES.indexOf("deux-paires");
const BRELAN = CATEGORIES.indexOf("brelan");
const COULEUR = CATEGORIES.indexOf("couleur");

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
 * vaut de 0,15 à 0,35, un brelan de 0,55 à 0,67, un full de 0,86 à 0,92. C'est elle qui
 * dit la confiance du robot, donc la taille de ses mises.
 */
export function handStrength(cards: readonly Card[]): number {
  const value = evaluate(cards);
  const height = ((value.ranks[0] ?? 2) - 2) / 12;
  return FLOOR[value.level]! + SPAN[value.level]! * height;
}

/** La part des donnes honnêtes qui tombent sur chaque combinaison, de la carte haute à la quinte flush. */
const DEALT = [0.501177, 0.422569, 0.047539, 0.021128, 0.003925, 0.001965, 0.001441, 0.00024, 0.000016];
/** La part des donnes honnêtes qui valent moins que chaque combinaison. */
const BELOW = DEALT.map((_, level) => DEALT.slice(0, level).reduce((sum, share) => sum + share, 0));

/** Le nombre de façons de choisir `k` choses parmi `n`. */
function choose(n: number, k: number): number {
  if (n < k) return 0;
  let ways = 1;
  for (let i = 0; i < k; i++) ways = (ways * (n - i)) / (i + 1);
  return ways;
}

/** La place d'une main parmi celles de sa combinaison, de 0 (la plus basse) à 1 exclu. */
function within(value: HandValue): number {
  // Les hauteurs, de 0 (le deux) à 12 (l'as).
  const r = value.ranks.map((rank) => rank - 2);
  switch (value.category) {
    case "carte-haute":
    case "couleur":
      // Cinq hauteurs distinctes : leur numéro parmi les 1 287 jeux de cinq hauteurs.
      return (choose(r[0]!, 5) + choose(r[1]!, 4) + choose(r[2]!, 3) + choose(r[3]!, 2) + r[4]!) / 1287;
    case "paire":
      return (r[0]! + (choose(r[1]!, 3) + choose(r[2]!, 2) + r[3]!) / 286) / 13;
    case "deux-paires":
      return (choose(r[0]!, 2) + r[1]! + r[2]! / 13) / 78;
    case "suite":
    case "quinte-flush":
      // La plus haute carte d'une suite va du 5 à l'as.
      return (value.ranks[0]! - 5) / 10;
    default:
      // Brelan, full, carré : la hauteur du groupe, puis celle de ce qui l'accompagne.
      return (r[0]! + (r[1] ?? 0) / 13) / 13;
  }
}

/**
 * Le rang d'une main : la part des donnes honnêtes qu'elle bat, de 0 à 1. Rien du tout
 * (sept, cinq, quatre, trois, deux) vaut 0 ; un as sec, de 0,31 à 0,50 ; une paire, de
 * 0,50 (les deux) à 0,92 (les as) ; deux paires, 0,92 à 0,97 ; un brelan, plus de 0,97.
 * C'est lui qui dit si une main vaut d'être défendue face à une mise.
 */
export function handRank(cards: readonly Card[]): number {
  const value = evaluate(cards);
  return BELOW[value.level]! + DEALT[value.level]! * within(value);
}

// ---------------------------------------------------------------------------
// La main précédente : ce qu'un joueur attentif en retient

/** Le dénouement de la main d'avant, s'il est encore dans la vue. */
function previous(view: TableView): NonNullable<TableView["result"]> | null {
  const result = view.result;
  return result && result.no === view.handNo - 1 ? result : null;
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
  const me = view.you;
  if (!hand || hand.chosen || hand.folded) return null;
  const current = evaluate(hand.cards);
  if (level === "facile") {
    // Rarement, et grossièrement : la plus belle main qu'une carte puisse lui donner.
    if (!chance(rng, 1, 6)) return null;
    return bestSwap(hand.cards, rng, (value) => value.score > current.score);
  }

  // Ce qui vient de lui arriver : démasqué à la main précédente, il se fait oublier une
  // main ; accusé (à tort ou à raison), il se méfie de ce joueur-là.
  const last = previous(view);
  const caught = last !== null && last.unmasked.some((u) => u.seat === me);
  const accused = last !== null && last.accusations.some((a) => a.to === me);

  if (level === "normal") {
    // Une fois sur trois, et seulement si sa combinaison y gagne : une main plausible, au
    // plus une couleur. Pas de full ni de carré tombés du ciel.
    if (!chance(rng, 1, 3) || caught) return null;
    return bestSwap(hand.cards, rng, (value) => value.level > current.level && value.level <= COULEUR);
  }

  // Difficile : une fois sur deux, pour une main qu'on ne remarque pas. Avec deux paires
  // ou mieux, il a déjà de quoi jouer : il ne touche à rien.
  if (!chance(rng, 1, 2) || caught || current.level >= DEUX_PAIRES) return null;
  // Une fois sur deux, la main la plus forte qui reste plausible : un brelan, une suite, une
  // couleur. Sinon, et toujours quand on vient de l'accuser, plus discret encore : une belle
  // paire avec rien, deux paires avec une paire. Personne n'accuse ces mains-là.
  const loud = chance(rng, 1, 2) && !accused;
  const strong = bestSwap(hand.cards, rng, (value) => value.level >= BRELAN && value.level <= COULEUR);
  if (loud && strong) return strong;
  const quiet = bestSwap(hand.cards, rng, (value) => value.level > current.level && value.level <= DEUX_PAIRES);
  // Avec rien du tout et rien de discret à y gagner, il prend ce qu'il y a de plausible.
  return quiet ?? (accused ? null : strong);
}

// ---------------------------------------------------------------------------
// Les enchères
//
// Les enchères sont sans limite, et les robots s'en servent : une main confiante mise
// gros, jusqu'à trois fois le pot, d'autant plus gros qu'elle est belle. Ils bluffent
// aussi, chacun à sa mesure, si bien qu'une grosse mise ne dit pas à coup sûr une belle
// main. Et face à une mise, ils se défendent assez souvent pour qu'on ne puisse pas les
// plumer en misant à chaque main : la part des mains qu'ils continuent dépend du prix.

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
 * La défense : la part de ses mains qu'un robot continue face à une mise, selon le prix
 * (la part du pot final qu'il faut y mettre : un quart pour une mise d'un demi-pot, un
 * tiers pour le pot, trois septièmes pour trois fois le pot, presque la moitié pour un
 * gros tapis). Toujours plus que ce qu'il faudrait pour que miser sans rien rapporte : on
 * ne le plume pas en misant à chaque main, et il sait que le joueur bluffe et triche.
 * Le robot normal continue ses 58 meilleures mains sur cent face au pot, le robot
 * difficile 64 ; face à une blinde, presque toutes ; face à un gros tapis, le meilleur
 * quart. Ces parts se comptent sur des donnes honnêtes : un robot qui s'est glissé une
 * carte a mieux, et continue plus souvent encore (mesuré : il se couche 28 fois sur cent
 * face au pot au niveau normal, 17 au niveau difficile).
 */
const DEFENCE: Record<"normal" | "difficile", readonly (readonly [price: number, share: number])[]> = {
  normal: [[0.18, 0.96], [0.25, 0.88], [1 / 3, 0.58], [3 / 7, 0.36], [5 / 11, 0.29], [0.48, 0.22], [0.495, 0.18]],
  difficile: [[0.18, 0.98], [0.25, 0.92], [1 / 3, 0.64], [3 / 7, 0.42], [5 / 11, 0.34], [0.48, 0.27], [0.495, 0.22]],
};
/** À plusieurs, chacun défend un peu moins : un autre que lui peut tenir la belle main. */
const CROWD = 0.15;

/** Vrai si cette main fait partie de celles qu'il continue à ce prix. */
function defends(level: "normal" | "difficile", rank: number, price: number, rivals: number): boolean {
  const share = along(DEFENCE[level], price) * (1 - CROWD * Math.max(0, rivals - 1));
  return rank >= 1 - share;
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
/** Une paire de dix ou mieux : en tête-à-tête, c'est une main qui vaut une petite mise. */
const GOOD_PAIR = 0.28;
/** Sous la paire : rien. C'est avec cela qu'on bluffe. */
const NOTHING = 0.15;

/** Miser selon sa confiance ; avec une très belle main, tout le tapis une fois sur quatre. */
function bold(view: TableView, strength: number, size: number): BetMove {
  if (strength >= SHOVE_FROM && size >= 0.75) return shove(view);
  return push(view, boldness(strength, size));
}

/** Un bluff : la mise d'une belle main qu'il n'a pas, du pot à trois fois le pot. */
function bluff(view: TableView, size: number): BetMove {
  return push(view, boldness(0.55 + 0.4 * size, size));
}

/** Une petite mise pour une main honnête : d'un tiers à deux tiers du pot. */
function probe(view: TableView, size: number): BetMove {
  return push(view, 0.35 + 0.3 * size);
}

/** Les adversaires encore dans le coup. */
function rivalsOf(view: TableView): number {
  return view.seats.filter((s) => s !== null && s.seat !== view.you && s.inHand && !s.folded).length;
}

// ---------------------------------------------------------------------------
// En tournoi : tenir à son tapis
//
// À la Table des Maîtres et dans un tournoi entre amis, personne ne recave : un tapis perdu,
// c'est la partie perdue. Tant que la blinde est basse devant son tapis, un robot ne l'engage
// donc pas à la légère. Ses mises gardent leur taille devant le pot (jusqu'à trois fois), mais
// il ne met plus du tiers de son tapis dans une main qu'avec de quoi le justifier, et il ne
// suit pas le tapis ou l'énorme relance d'un autre sans une très belle main. C'est ce qui
// empêche la table de se vider entre robots dès les premières mains, relance sur relance
// (mesuré à la Table des Maîtres : un maître tombait avant la troisième main à près d'une
// table sur quatre ; c'est une sur trente). Plus la blinde monte devant les tapis, plus il se
// lâche : la fin de partie reste rapide. Hors tournoi (une table ordinaire, un défi), rien de
// tout cela.

/** Au-delà de douze blindes devant lui, un robot est sur ses gardes ; sous cinq, plus du tout. */
const DEEP_STACK = 12;
const SHORT_STACK = 5;
/** La part de son tapis qu'il engage sans y regarder de près : un tiers. Au double, c'est presque tout. */
const SAFE_SHARE = 1 / 3;

/**
 * La main qu'il faut, tapis profonds, pour engager plus du tiers de son tapis (`big`) ou plus
 * des deux tiers (`all`) : en misant ou en relançant soi-même, et en suivant la mise d'un autre.
 * Les robots normal et difficile : un brelan pour miser gros, un full pour pousser ; deux
 * paires pour suivre gros, un brelan pour suivre un tapis (assez souvent pour qu'on ne leur
 * vole pas les blindes en poussant à chaque main : qui s'y essaie y laisse neuf blindes par
 * main). Le robot facile se contente de moins.
 */
const STAKES: Record<Difficulty, { betBig: number; betAll: number; callBig: number; callAll: number }> = {
  facile: { betBig: 0.40, betAll: 0.55, callBig: 0.15, callAll: 0.40 },
  normal: { betBig: 0.55, betAll: 0.86, callBig: 0.40, callAll: 0.55 },
  difficile: { betBig: 0.55, betAll: 0.86, callBig: 0.40, callAll: 0.55 },
};

/**
 * La retenue : de 1 (tapis profonds, il tient à son tapis) à 0 (la blinde l'a rattrapé, ou
 * la table n'est pas un tournoi : il joue comme partout).
 */
function restraint(view: TableView): number {
  const me = view.you === null ? null : view.seats[view.you];
  if (view.format !== "tournoi" || !me) return 0;
  const depth = (me.stack + me.committed) / view.blind;
  return Math.max(0, Math.min(1, (depth - SHORT_STACK) / (DEEP_STACK - SHORT_STACK)));
}

/** Ce que devient le geste voulu une fois la retenue passée par là : le même, plus petit, ou rien. */
function restrained(view: TableView, level: Difficulty, move: BetMove): BetMove {
  const calm = restraint(view);
  const me = view.you === null ? null : view.seats[view.you];
  const hand = view.hand;
  if (calm === 0 || !me || !hand) return move;
  const o = view.options;
  const strength = handStrength(hand.cards);
  const stakes = STAKES[level];
  // Son tapis au début de la main, et la part qu'il en aurait engagée en ajoutant `chips`.
  const whole = me.stack + me.committed;
  const share = (chips: number): number => (me.committed + chips) / whole;

  const call = (): BetMove => {
    const at = share(o.call);
    const need = at > 2 * SAFE_SHARE ? stakes.callAll : at > SAFE_SHARE ? stakes.callBig : 0;
    return strength >= need * calm ? { type: "suivre" } : { type: "coucher" };
  };
  if (move.type === "suivre") return call();
  if (move.type !== "miser" && move.type !== "relancer") return move;

  // Ce que sa main l'autorise à engager : tout son tapis, les deux tiers, ou le tiers.
  const limit = strength >= stakes.betAll * calm ? 1 : strength >= stakes.betBig * calm ? 2 * SAFE_SHARE : SAFE_SHARE;
  const added = move.type === "miser" ? move.amount : move.amount - me.bet;
  if (share(added) <= limit) return move;
  // Trop pour cette main : il ramène sa mise à ce qu'il accepte de risquer.
  const most = Math.floor(whole * limit) - me.committed;
  if (move.type === "miser") return o.bet && most >= o.bet.min ? { type: "miser", amount: Math.min(most, o.bet.max) } : pass(view);
  // Une relance plus petite, s'il a de quoi la faire et une main à faire payer : un bluff
  // rabougri ne ferait peur à personne, il y renonce.
  if (strength >= NOTHING && o.raise && me.bet + most >= o.raise.min) return { type: "relancer", amount: Math.min(me.bet + most, o.raise.max) };
  // Sinon il suit si sa main vaut d'être défendue, ou il se couche.
  const price = o.call / (view.pot + o.call);
  const worth = level === "facile" ? strength >= NOTHING : defends(level, handRank(hand.cards), price, rivalsOf(view));
  return worth ? call() : { type: "coucher" };
}

/** Que faire quand c'est à lui de parler. */
export function botBet(view: TableView, level: Difficulty, rng: Random32): BetMove {
  return restrained(view, level, intent(view, level, rng));
}

/** Ce qu'il ferait partout ailleurs qu'en tournoi : sa main, le prix, l'humeur. */
function intent(view: TableView, level: Difficulty, rng: Random32): BetMove {
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
  const rivals = rivalsOf(view);
  const duel = rivals <= 1;

  if (level === "facile") {
    if (!facing) {
      // Il mise selon sa main, et cela se voit : plus elle est belle, plus il mise gros.
      if (strength >= 0.40) return bold(view, strength, size);
      // Il bluffe rarement, et mal : toujours trop gros, avec rien du tout.
      if (strength < NOTHING && mood < 0.04) return push(view, 2 + size);
      return pass(view);
    }
    if (strength >= 0.86 && mood < 0.5) return bold(view, strength, size);
    // Il suit trop : toute paire, quelle que soit la mise, et une fois sur deux sans rien.
    if (strength >= NOTHING || mood < 0.5) return { type: "suivre" };
    return { type: "coucher" };
  }

  const rank = handRank(hand.cards);

  if (level === "normal") {
    if (!facing) {
      if (strength >= 0.55) return bold(view, strength, size);
      if (strength >= 0.40) return mood < 0.6 ? bold(view, strength, size) : pass(view);
      // En tête-à-tête, une belle paire vaut une petite mise, près d'une fois sur deux.
      if (duel && strength >= GOOD_PAIR) return mood < 0.45 ? probe(view, size) : pass(view);
      // Il bluffe un peu : une main sur dix quand il n'a rien, avec la mise d'une belle main.
      if (strength < NOTHING && mood < 0.10) return bluff(view, size);
      return pass(view);
    }
    // Face à une mise : il relance ses très belles mains (parfois un brelan), bluffe une fois
    // sur cinquante, et défend le reste selon le prix.
    if (strength >= 0.78 && mood < 0.6) return bold(view, strength, size);
    if (strength >= 0.70 && mood < 0.4) return bold(view, strength, size);
    if (strength >= 0.55 && mood < 0.2) return bold(view, strength, size);
    if (strength < NOTHING && mood >= 0.98 && o.raise) return bluff(view, size);
    return defends("normal", rank, price, rivals) ? { type: "suivre" } : { type: "coucher" };
  }

  // Difficile : il mise gros quand il est confiant, bluffe avec mesure, et tend des pièges.
  if (!facing) {
    if (strength >= 0.70) return mood < 0.85 ? bold(view, strength, size) : pass(view);
    if (strength >= 0.55) return mood < 0.75 ? bold(view, strength, size) : pass(view);
    if (strength >= 0.40) return mood < 0.50 ? bold(view, strength, size) : pass(view);
    if (duel && strength >= GOOD_PAIR) return mood < 0.55 ? probe(view, size) : pass(view);
    // Ses bluffs ont la taille de ses belles mains : rien ne les en distingue.
    if (strength < NOTHING && mood < 0.16) return bluff(view, size);
    return pass(view);
  }
  if (strength >= 0.70 && mood < 0.5) return bold(view, strength, size);
  if (strength >= 0.55 && mood < 0.3) return bold(view, strength, size);
  if (strength < NOTHING && mood >= 0.95 && o.raise) return bluff(view, size);
  return defends("difficile", rank, price, rivals) ? { type: "suivre" } : { type: "coucher" };
}

// ---------------------------------------------------------------------------
// Les accusations
//
// Le raisonnement des robots : une belle main est rare dans une donne honnête, et courante
// chez qui s'est glissé une carte. Le rapport entre les deux dit ce que la main montrée a
// de suspect ; avec ce que le robot croit des habitudes de la table, cela fait une chance
// que l'adversaire ait triché. Reste à peser le pari : s'il a raison, le tricheur sort de la
// main et le pot lui revient ; s'il a tort, il paie la mise de l'accusé.

/**
 * Combien de fois plus souvent un tricheur montre cette combinaison qu'un joueur honnête,
 * du brelan à la quinte flush. Un brelan : deux donnes honnêtes sur cent, mais ce que
 * devient toute paire (quatre donnes sur dix) avec une carte glissée.
 */
const TELL = [0, 0, 0.15, 20, 22, 22, 33, 88, 70];
/** Une paire : seules les plus hautes sont suspectes (celle qu'on se fait avec sa plus haute carte quand on n'a rien). */
const PAIR_TELL: readonly (readonly [rank: number, tell: number])[] = [[9, 0.1], [10, 0.25], [11, 0.45], [12, 0.7], [13, 1], [14, 1.3]];

/** Ce que la main montrée a de suspect : le rapport de vraisemblance entre la triche et le franc jeu. */
function tell(value: HandValue): number {
  return value.level === PAIRE ? along(PAIR_TELL, value.ranks[0]!) : TELL[value.level]!;
}

/** Ce que chaque robot croit des autres avant de voir leur main : la part des mains où l'on triche. */
const PRIOR = { normal: 0.20, difficile: 0.30 };
/** Un joueur démasqué à la main précédente est un tricheur : le soupçon monte d'autant. */
const KNOWN_CHEAT = 0.30;
/** Deux adversaires montrent la même carte : l'un des deux au moins a triché. */
const TWIN_SUSPICION = 0.6;
/** À tapis, une accusation fausse ne coûte rien : il suffit d'un doute. */
const FREE_SUSPICION = 0.2;
/** La prudence : ce qu'une accusation fausse pèse de plus que ce qu'elle coûte. */
const CAUTION = { normal: 1.5, difficile: 1.2 };
/** L'attention : la part des bons paris qu'il voit. Le robot normal en laisse passer plus d'un sur deux. */
const ATTENTION = { normal: 0.45, difficile: 0.9 };

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
  const own = evaluate(hand.cards).score;

  // Les cartes qu'il a vraiment reçues : celles qu'il tient encore, et celle qu'il a écartée.
  // Le paquet n'en compte qu'une de chaque : quiconque en montre une l'a glissée dans sa main.
  const dealt = new Set(hand.cards.filter((_, index) => index !== hand.swap?.index));
  if (hand.swap) dealt.add(hand.swap.from);
  const proven = rivals.filter((s) => s.cards!.some((card) => dealt.has(card)));

  if (level === "facile") {
    // Au jugé. Il voit la preuve trois fois sur cinq, et la belle main qui le bat (un brelan
    // ou mieux) deux fois sur cinq ; le reste du temps, il lui arrive d'accuser au hasard.
    const glance = roll(rng);
    if (proven.length > 0 && glance < 0.6) return strongest(proven).seat;
    const tooGood = rivals.filter((s) => evaluate(s.cards!).level >= BRELAN && evaluate(s.cards!).score > own);
    if (tooGood.length > 0 && glance < 0.4) return strongest(tooGood).seat;
    return chance(rng, 1, 16) ? rivals[uniformInt(rivals.length, rng)]!.seat : null;
  }

  // Une carte qu'il a lui-même reçue, revue en face : c'est une preuve, il accuse toujours.
  if (proven.length > 0) return strongest(proven).seat;

  // Le pari, adversaire par adversaire. Il ne s'en prend qu'à une main qui bat la sienne :
  // démasquer une main qu'il bat déjà ne lui rapporterait rien.
  const stack = view.seats[me]!.stack;
  const last = previous(view);
  const shown = new Map<Card, number>();
  for (const s of rivals) for (const card of s.cards!) shown.set(card, (shown.get(card) ?? 0) + 1);
  let target: SeatView | null = null;
  let doubt = 0;
  let worth = 0;
  let best = 0;
  for (const s of rivals) {
    const value = evaluate(s.cards!);
    if (value.score <= own) continue;
    // Ce qu'il croit de ce joueur, puis ce que sa main y ajoute.
    const known = last !== null && last.unmasked.some((u) => u.seat === s.seat);
    const prior = Math.min(0.75, PRIOR[level] + (known ? KNOWN_CHEAT : 0));
    const odds = prior * tell(value);
    let suspicion = odds / (odds + 1 - prior);
    // Le robot difficile voit aussi la carte que deux adversaires montrent à la fois.
    if (level === "difficile" && s.cards!.some((card) => shown.get(card)! > 1)) suspicion = Math.max(suspicion, TWIN_SUSPICION);
    // S'il a raison, le pot lui revient, pourvu qu'aucun autre adversaire ne le batte aussi.
    const gain = rivals.some((other) => other !== s && evaluate(other.cards!).score > own) ? 0 : view.pot;
    // S'il a tort, il paie la mise de l'accusé, dans la limite de son tapis.
    const cost = Math.min(s.committed, stack);
    // À tapis, se tromper ne coûte rien : seul le soupçon compte. Sinon, c'est le pari.
    const edge = stack === 0 ? suspicion : suspicion * gain - (1 - suspicion) * cost * CAUTION[level];
    // À pari égal, il vise la main la plus forte : c'est elle qui lui prend le pot. La place
    // autour de la table n'y est pour rien (le joueur, toujours au premier siège, n'est pas visé d'abord).
    if (target === null || edge > worth || (edge === worth && value.score > best)) {
      target = s;
      doubt = suspicion;
      worth = edge;
      best = value.score;
    }
  }
  if (!target) return null;
  // À tapis, un doute suffit ; sinon il faut que le pari soit bon. Et encore faut-il le voir.
  if (stack === 0 ? doubt < FREE_SUSPICION : worth <= 0) return null;
  return roll(rng) < ATTENTION[level] ? target.seat : null;
}
