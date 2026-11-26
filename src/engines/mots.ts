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
//
// Les grilles suivent la langue du jeu : en anglais, des mots anglais (mots-grilles-en.ts),
// écrits avec les dix mêmes lettres. Le lot, lui, vient du serveur : il ne dépend pas de
// la langue, seule l'image change. Une grille se lit donc dans la langue où elle a été
// construite : changer de langue remonte tout l'écran, et la grille est refaite.

import type { TicketDef } from "../../shared/types";
import { lang } from "../i18n";
import { mulberry32, optString, palette, pickOne, shuffle, type Match, type Rng } from "./common";
import { ALPHABET, GRILLES, LETTRES_MORTES, type Grille } from "./mots-grilles";
import { GRILLES_EN } from "./mots-grilles-en";

export const LETTER_COUNT = ALPHABET.length; // 10
export const WORD_COUNT = 10;
/** La place d'une grille sur le ticket : 9 colonnes sur 8 rangées au plus. */
export const GRID_COLS = 9;
export const GRID_ROWS = 8;

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

function checkGrille(grille: Grille): boolean {
  if (!Array.isArray(grille) || grille.length !== WORD_COUNT) return false;
  const words = new Set<string>();
  const cells = new Map<string, string>();
  let rows = 0;
  let cols = 0;
  for (const [text, row, col, dir] of grille) {
    if (typeof text !== "string" || text.length < 2 || words.has(text)) return false;
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || (dir !== 0 && dir !== 1)) return false;
    words.add(text);
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]!;
      if (!ALPHABET.includes(ch)) return false;
      const r = row + (dir === 1 ? i : 0);
      const c = col + (dir === 0 ? i : 0);
      const key = `${r}:${c}`;
      // Deux mots qui se croisent partagent la même lettre.
      const before = cells.get(key);
      if (before !== undefined && before !== ch) return false;
      cells.set(key, ch);
      rows = Math.max(rows, r + 1);
      cols = Math.max(cols, c + 1);
    }
  }
  if (rows > GRID_ROWS || cols > GRID_COLS) return false;
  // Toute suite de deux lettres ou plus, en ligne ou en colonne, est un mot de la grille.
  let runs = 0;
  const scan = (outer: number, inner: number, at: (o: number, i: number) => string | undefined): boolean => {
    for (let o = 0; o < outer; o++) {
      let run = "";
      for (let i = 0; i <= inner; i++) {
        const ch = at(o, i);
        if (ch) {
          run += ch;
          continue;
        }
        if (run.length >= 2) {
          if (!words.has(run)) return false;
          runs++;
        }
        run = "";
      }
    }
    return true;
  };
  if (!scan(rows, cols, (r, c) => cells.get(`${r}:${c}`))) return false;
  if (!scan(cols, rows, (c, r) => cells.get(`${r}:${c}`))) return false;
  if (runs !== WORD_COUNT) return false;
  // La grille sait porter tous les lots : de 0 à 10 mots complets.
  return hiddenSets(grille).every((sets) => sets.length > 0);
}

const VALID_CACHE = new WeakMap<Grille, boolean>();

/**
 * Vrai si une grille tient debout : 10 mots différents écrits avec les dix lettres,
 * des croisements justes, aucun mot parasite, 9 colonnes sur 8 rangées au plus, et un
 * jeu de lettres à cacher pour chaque nombre de mots de 0 à 10.
 */
export function grilleValide(grille: Grille): boolean {
  let ok = VALID_CACHE.get(grille);
  if (ok === undefined) {
    ok = checkGrille(grille);
    VALID_CACHE.set(grille, ok);
  }
  return ok;
}

const EN_CACHE = new Map<string, { source: readonly Grille[]; valid: readonly Grille[] }>();

/** Les grilles anglaises d'un lexique, celles qui tiennent debout seulement. */
function grillesAnglaises(lexique: string): readonly Grille[] {
  const source = GRILLES_EN[lexique];
  if (!source || source.length === 0) return [];
  const cached = EN_CACHE.get(lexique);
  if (cached && cached.source === source) return cached.valid;
  const valid = source.filter(grilleValide);
  EN_CACHE.set(lexique, { source, valid });
  return valid;
}

/**
 * Les grilles d'un lexique, dans la langue du jeu. Tant qu'un lexique n'a pas de
 * grille anglaise, le jeu en anglais garde les grilles françaises.
 */
export function grillesOf(lexique: string): readonly Grille[] {
  const known = GRILLES[lexique] ? lexique : "terrasse";
  if (lang() === "en") {
    const en = grillesAnglaises(known);
    if (en.length > 0) return en;
  }
  return GRILLES[known]!;
}

export function gridOf(layout: Pick<MotsLayout, "lexique" | "grid">): Grille {
  const list = grillesOf(layout.lexique);
  return list[layout.grid % list.length]!;
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
