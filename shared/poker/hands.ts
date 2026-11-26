// Les combinaisons du poker à cinq cartes, de la carte haute à la quinte flush
// (POKER.md, section 1). L'as vaut 14, ou 1 dans la suite A-2-3-4-5.
//
// Une main compte cinq cartes distinctes : on ne peut pas prendre une carte qu'on a
// déjà, il n'y a donc jamais cinq cartes identiques. Deux joueurs, en revanche, peuvent
// montrer la même carte ; chaque main se juge seule.

import { cardRank, cardSuit, type Card } from "./cards";

/** De la plus faible à la plus forte. */
export const CATEGORIES = [
  "carte-haute", "paire", "deux-paires", "brelan", "suite", "couleur", "full", "carre", "quinte-flush",
] as const;
export type HandCategory = (typeof CATEGORIES)[number];

export interface HandValue {
  category: HandCategory;
  /** Rang de la combinaison : 0 pour la carte haute, 8 pour la quinte flush. */
  level: number;
  /**
   * Ce qui départage deux mains de même combinaison, du plus important au moins
   * important : la paire avant ses accompagnatrices, le brelan avant la paire d'un full,
   * la plus haute carte d'une suite (5 pour A-2-3-4-5).
   */
  ranks: number[];
  /** Un seul nombre pour tout comparer : la main la plus forte a le score le plus grand. */
  score: number;
}

const BASE = 15;

function valueOf(category: HandCategory, ranks: number[]): HandValue {
  const level = CATEGORIES.indexOf(category);
  let score = level;
  for (let i = 0; i < 5; i++) score = score * BASE + (ranks[i] ?? 0);
  return { category, level, ranks, score };
}

/** Juge une main de cinq cartes. */
export function evaluate(cards: readonly Card[]): HandValue {
  if (cards.length !== 5) throw new RangeError("une main compte cinq cartes");
  const ranks = cards.map(cardRank).sort((a, b) => b - a);
  const flush = cards.every((c) => cardSuit(c) === cardSuit(cards[0]!));

  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  // Les groupes : les plus nombreux d'abord, puis les plus hauts.
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const shape = groups.map(([, n]) => n).join("");
  const byGroup = groups.map(([rank]) => rank);

  let straight = 0; // la plus haute carte de la suite, 0 s'il n'y en a pas
  if (groups.length === 5) {
    if (ranks[0]! - ranks[4]! === 4) straight = ranks[0]!;
    // La roue : as, 5, 4, 3, 2. L'as y vaut 1, la suite est au 5.
    else if (ranks[0] === 14 && ranks[1] === 5 && ranks[4] === 2) straight = 5;
  }

  if (straight > 0 && flush) return valueOf("quinte-flush", [straight]);
  if (shape === "41") return valueOf("carre", byGroup);
  if (shape === "32") return valueOf("full", byGroup);
  if (flush) return valueOf("couleur", ranks);
  if (straight > 0) return valueOf("suite", [straight]);
  if (shape === "311") return valueOf("brelan", byGroup);
  if (shape === "221") return valueOf("deux-paires", byGroup);
  if (shape === "2111") return valueOf("paire", byGroup);
  return valueOf("carte-haute", ranks);
}

/** Positif si `a` bat `b`, négatif si `b` bat `a`, zéro à égalité. */
export function compareHands(a: readonly Card[], b: readonly Card[]): number {
  return evaluate(a).score - evaluate(b).score;
}
