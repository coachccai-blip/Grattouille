// Moteur `lignes` : tirage et rangées à compléter (BRIEF.md, section 7.8).

import type { TicketDef } from "../../shared/types";
import { decoy, mulberry32, optString, palette, range, shuffle, splitGain, type Match, type Rng } from "./common";

export type LignesSkin = "cartes" | "nombres" | "cocktails";

/** Les 14 ingrédients des Cocktails du Commodore : l'élément `e` est COCKTAIL_INGREDIENTS[e]. */
export const COCKTAIL_INGREDIENTS = [
  "citron", "orange", "fraise", "cerise", "ananas", "coco", "menthe",
  "olive", "glacon", "cafe", "sirop", "bulles", "sucre", "ombrelle",
] as const;

export interface LignesLayout {
  engine: "lignes";
  skin: LignesSkin;
  /**
   * Le tirage : 8 éléments à gratter.
   * `cartes` : 0 à 31, jeu de 32 cartes (rang = e % 8 pour 7, 8, 9, 10, valet, dame, roi, as ;
   * couleur = e ÷ 8). `nombres` : 1 à 40. `cocktails` : 0 à 13, un ingrédient.
   */
  draw: number[];
  /** 4 rangées de 3 éléments, visibles dès le départ avec leur montant, triées par montant croissant. */
  lines: { items: number[]; amount: number }[];
}

export const DRAW_SIZE = 8;
export const LINE_COUNT = 4;
export const LINE_SIZE = 3;

function universe(skin: LignesSkin): number[] {
  if (skin === "cartes") return range(32);
  if (skin === "cocktails") return range(COCKTAIL_INGREDIENTS.length);
  return range(40, 1);
}

export function buildLignes(
  pal: readonly number[], skin: LignesSkin, gain: number, rng: Rng, maxParts = 2,
): LignesLayout {
  const parts = splitGain(gain, pal, Math.min(maxParts, 2), rng);
  const all = shuffle(universe(skin), rng);
  // Les 12 éléments des rangées sont tous différents.
  const lineItems = range(LINE_COUNT).map((l) => all.slice(l * LINE_SIZE, (l + 1) * LINE_SIZE));
  const offLines = all.slice(LINE_COUNT * LINE_SIZE);
  // Autant de rangées gagnantes que de parts : leurs 3 éléments sont dans le tirage.
  const order = shuffle(range(LINE_COUNT), rng);
  const winners = order.slice(0, parts.length);
  const draw: number[] = [];
  for (const l of winners) draw.push(...lineItems[l]!);
  // Les places restantes : au plus 2 éléments par rangée non gagnante, le reste hors rangées.
  const lineOf = new Map<number, number>();
  const candidates: number[] = [...offLines];
  lineItems.forEach((items, l) => {
    if (winners.includes(l)) return;
    for (const e of items) {
      lineOf.set(e, l);
      candidates.push(e);
    }
  });
  const taken = new Array<number>(LINE_COUNT).fill(0);
  for (const e of shuffle(candidates, rng)) {
    if (draw.length >= DRAW_SIZE) break;
    const l = lineOf.get(e);
    if (l !== undefined) {
      if (taken[l]! >= LINE_SIZE - 1) continue;
      taken[l]!++;
    }
    draw.push(e);
  }
  const lines = lineItems.map((items, l) => {
    const w = winners.indexOf(l);
    return { items, amount: w >= 0 ? parts[w]! : decoy(pal, rng) };
  });
  // Pour l'affichage, les rangées sont triées par montant croissant.
  lines.sort((a, b) => a.amount - b.amount);
  return { engine: "lignes", skin, draw: shuffle(draw, rng), lines };
}

export function buildLayout(def: TicketDef, gain: number, seed: number): LignesLayout {
  return buildLignes(palette(def), optString<LignesSkin>(def.options, "skin", "cartes"), gain, mulberry32(seed));
}

/** Somme des montants des rangées dont les 3 éléments sont dans le tirage. */
export function evaluate(layout: LignesLayout): number {
  const drawn = new Set(layout.draw);
  let total = 0;
  for (const line of layout.lines) if (line.items.every((e) => drawn.has(e))) total += line.amount;
  return total;
}

/** Seul le tirage se gratte : les rangées sont visibles dès le départ. */
export function cellIds(_layout: LignesLayout): string[] {
  return range(DRAW_SIZE).map((i) => `d${i}`);
}

/** Les éléments du tirage déjà visibles. */
export function drawnVisible(layout: LignesLayout, revealed: ReadonlySet<string>): Set<number> {
  const out = new Set<number>();
  layout.draw.forEach((e, i) => {
    if (revealed.has(`d${i}`)) out.add(e);
  });
  return out;
}

/** Rangée complète : son montant s'illumine. */
export function matches(layout: LignesLayout, revealed: ReadonlySet<string>): Match[] {
  const visible = drawnVisible(layout, revealed);
  const out: Match[] = [];
  layout.lines.forEach((line, l) => {
    if (line.items.every((e) => visible.has(e))) {
      const cells = line.items.map((e) => `d${layout.draw.indexOf(e)}`);
      out.push({ key: `lignes:${l}`, cells, amount: line.amount });
    }
  });
  return out;
}

export const CARD_RANKS = ["7", "8", "9", "10", "V", "D", "R", "A"] as const;
export const CARD_SUITS = ["pique", "coeur", "carreau", "trefle"] as const;
export type CardSuit = (typeof CARD_SUITS)[number];

export function cardOf(e: number): { rank: string; suit: CardSuit; red: boolean; name: string } {
  const rank = CARD_RANKS[e % 8]!;
  const suit = CARD_SUITS[Math.floor(e / 8) % 4]!;
  const rankNames: Record<string, string> = { V: "valet", D: "dame", R: "roi", A: "as" };
  const suitNames: Record<CardSuit, string> = { pique: "pique", coeur: "cœur", carreau: "carreau", trefle: "trèfle" };
  return {
    rank, suit,
    red: suit === "coeur" || suit === "carreau",
    name: `${rankNames[rank] ?? rank} de ${suitNames[suit]}`,
  };
}
