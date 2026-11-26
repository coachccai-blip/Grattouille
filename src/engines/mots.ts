// Moteur `mots` : mots croisés.
//
// Le ticket imprime une grille de 10 mots entrecroisés. On gratte 10 lettres : chaque
// lettre découverte s'allume partout où elle figure dans la grille. Un mot dont toutes
// les lettres sont découvertes est complet, et le nombre de mots complets donne le
// lot : 1 mot rembourse, 10 mots font le gros lot.
//
// Tous les mots s'écrivent avec les dix mêmes lettres (mots-grilles.ts). Pour un lot
// donné, le moteur choisit quelles lettres manquent au tirage, de façon qu'il reste
// exactement le bon nombre de mots complets, puis remplace les lettres manquantes par
// des lettres qui ne figurent dans aucun mot.

import type { TicketDef } from "../../shared/types";
import { mulberry32, optString, palette, pickOne, shuffle, type Match, type Rng } from "./common";
import { ALPHABET, GRILLES, LETTRES_MORTES, type Grille } from "./mots-grilles";

export const LETTER_COUNT = ALPHABET.length; // 10
export const WORD_COUNT = 10;

export interface MotsLayout {
  engine: "mots";
  lexique: string;
  /** Le numéro de la grille dans son lexique. */
  grid: number;
  /** Les dix lettres à gratter. */
  letters: string[];
  /** Le barème : ce que rapportent 1 mot, 2 mots... 10 mots complets. */
  scale: number[];
}

function grillesOf(lexique: string): readonly Grille[] {
  return GRILLES[lexique] ?? GRILLES.terrasse!;
}

export function gridOf(layout: Pick<MotsLayout, "lexique" | "grid">): Grille {
  const list = grillesOf(layout.lexique);
  return list[layout.grid % list.length]!;
}

/** Les lettres d'un mot, en masque de bits sur ALPHABET. */
function maskOf(word: string): number {
  let mask = 0;
  for (const ch of word) mask |= 1 << ALPHABET.indexOf(ch);
  return mask;
}

function bitCount(n: number): number {
  let c = 0;
  for (let v = n; v; v &= v - 1) c++;
  return c;
}

/**
 * Pour une grille, les jeux de lettres à cacher classés par nombre de mots qu'ils
 * laissent complets. On ne garde, pour chaque nombre, que les jeux les plus petits :
 * moins on cache de lettres, plus la grille se remplit, même quand le ticket perd.
 */
const HIDDEN_CACHE = new Map<Grille, number[][]>();

function hiddenSets(grille: Grille): number[][] {
  const cached = HIDDEN_CACHE.get(grille);
  if (cached) return cached;
  const masks = grille.map(([text]) => maskOf(text));
  const all: number[][] = Array.from({ length: WORD_COUNT + 1 }, () => []);
  const best = new Array<number>(WORD_COUNT + 1).fill(99);
  for (let hidden = 0; hidden < 1 << LETTER_COUNT; hidden++) {
    let complete = 0;
    for (const m of masks) if ((m & hidden) === 0) complete++;
    const size = bitCount(hidden);
    if (size < best[complete]!) {
      best[complete] = size;
      all[complete] = [hidden];
    } else if (size === best[complete]) {
      all[complete]!.push(hidden);
    }
  }
  HIDDEN_CACHE.set(grille, all);
  return all;
}

export function buildMots(pal: readonly number[], lexique: string, gain: number, rng: Rng): MotsLayout {
  const list = grillesOf(lexique);
  // Le nombre de mots à compléter : le rang du gain dans le barème.
  const words = gain > 0 ? pal.indexOf(gain) + 1 : 0;
  // Toutes les grilles savent porter tous les lots (c'est contrôlé par les tests) ;
  // par prudence, on passe à la suivante si l'une d'elles ne le pouvait pas.
  let grid = Math.floor(rng() * list.length);
  for (let tries = 0; tries < list.length && hiddenSets(list[grid]!)[words]!.length === 0; tries++) {
    grid = (grid + 1) % list.length;
  }
  const hidden = pickOne(rng, hiddenSets(list[grid]!)[words]!) ?? 0;
  const kept: string[] = [];
  let missing = 0;
  for (let i = 0; i < LETTER_COUNT; i++) {
    if (hidden & (1 << i)) missing++;
    else kept.push(ALPHABET[i]!);
  }
  // Autant de lettres mortes que de lettres cachées : le tirage fait toujours dix lettres.
  const dead = shuffle([...LETTRES_MORTES], rng).slice(0, missing);
  return { engine: "mots", lexique, grid, letters: shuffle([...kept, ...dead], rng), scale: pal.slice(0, WORD_COUNT) };
}

export function buildLayout(def: TicketDef, gain: number, seed: number): MotsLayout {
  return buildMots(palette(def), optString(def.options, "lexique", "terrasse"), gain, mulberry32(seed));
}

/** Les mots complets, vu un ensemble de lettres : leurs numéros dans la grille. */
export function completeWords(layout: MotsLayout, letters: Iterable<string>): number[] {
  const known = new Set(letters);
  const out: number[] = [];
  gridOf(layout).forEach(([text], w) => {
    if ([...text].every((ch) => known.has(ch))) out.push(w);
  });
  return out;
}

/** Ce que rapporte le nombre de mots complets. */
export function evaluate(layout: MotsLayout): number {
  const n = completeWords(layout, layout.letters).length;
  return n > 0 ? layout.scale[n - 1] ?? 0 : 0;
}

export function cellIds(_layout: MotsLayout): string[] {
  return Array.from({ length: LETTER_COUNT }, (_, i) => `l${i}`);
}

/** Les lettres déjà grattées. */
export function lettersVisible(layout: MotsLayout, revealed: ReadonlySet<string>): Set<string> {
  const out = new Set<string>();
  layout.letters.forEach((letter, i) => {
    if (revealed.has(`l${i}`)) out.add(letter);
  });
  return out;
}

/** Chaque mot complété tinte ; le dernier porte le montant atteint. */
export function matches(layout: MotsLayout, revealed: ReadonlySet<string>): Match[] {
  const done = completeWords(layout, lettersVisible(layout, revealed));
  const grille = gridOf(layout);
  return done.map((w, i) => {
    const text = grille[w]![0];
    const cells = layout.letters.map((letter, k) => (text.includes(letter) ? `l${k}` : "")).filter((id) => id !== "");
    return { key: `mots:${w}`, cells, amount: i === done.length - 1 ? layout.scale[done.length - 1] ?? 0 : 0 };
  });
}
