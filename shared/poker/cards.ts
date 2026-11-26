// Les cartes du Poker Tricheur : un paquet de 52 cartes (POKER.md, section 1).
//
// Une carte s'écrit en deux caractères, à l'internationale : la valeur, puis la couleur.
//   valeur  : 2 3 4 5 6 7 8 9 T (dix) J (valet) Q (dame) K (roi) A (as)
//   couleur : s (pique) h (cœur) d (carreau) c (trèfle)
// « Ah » est l'as de cœur, « Td » le dix de carreau. C'est cette écriture qui voyage
// entre le serveur et le client ; l'affichage à la française est l'affaire de l'écran.

import { uniformInt } from "../economy";

/** Un entier 32 bits non signé : le hasard injecté partout dans le moteur. */
export type Random32 = () => number;

export const RANK_CHARS = "23456789TJQKA";
export const SUIT_CHARS = "shdc";

export type Suit = "s" | "h" | "d" | "c";
/** Deux caractères : valeur puis couleur. Voir `isCard`. */
export type Card = string;

/** Valeur d'une carte, de 2 à 14 (l'as vaut 14 ; il vaut aussi 1 dans la suite A-2-3-4-5). */
export function cardRank(card: Card): number {
  return RANK_CHARS.indexOf(card[0]!) + 2;
}

export function cardSuit(card: Card): Suit {
  return card[1] as Suit;
}

/** `rank` de 2 à 14. */
export function makeCard(rank: number, suit: Suit): Card {
  return `${RANK_CHARS[rank - 2]!}${suit}`;
}

export function isCard(x: unknown): x is Card {
  return typeof x === "string" && x.length === 2 && RANK_CHARS.includes(x[0]!) && SUIT_CHARS.includes(x[1]!);
}

/** Les 52 cartes, dans l'ordre : par couleur, puis par valeur croissante. */
export const DECK: readonly Card[] = [...SUIT_CHARS].flatMap((suit) => [...RANK_CHARS].map((rank) => `${rank}${suit}`));

/** Un paquet neuf, mélangé (Fisher-Yates, sans biais de modulo). */
export function shuffledDeck(rng: Random32): Card[] {
  const deck = [...DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = uniformInt(i + 1, rng);
    const swap = deck[i]!;
    deck[i] = deck[j]!;
    deck[j] = swap;
  }
  return deck;
}
