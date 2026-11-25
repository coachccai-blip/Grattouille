// Outils communs aux moteurs de tickets (BRIEF.md, section 7.1).

import { multipliers } from "../../shared/economy";
import type { TicketDef } from "../../shared/types";

export type Rng = () => number;

/** Générateur pseudo-aléatoire déterministe, à partir d'une graine 32 bits. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entier dans [0, n[. */
export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

/** Entier dans [min, max], bornes comprises. */
export function randBetween(rng: Rng, min: number, max: number): number {
  return min + randInt(rng, max - min + 1);
}

export function pickOne<T>(rng: Rng, items: readonly T[]): T {
  return items[randInt(rng, items.length)]!;
}

/** Mélange de Fisher-Yates, rend une copie. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function range(n: number, from = 0): number[] {
  return Array.from({ length: n }, (_, i) => from + i);
}

/** Les montants possibles du ticket : chaque multiplicateur du tempérament, multiplié par le prix. */
export function palette(def: Pick<TicketDef, "price" | "temperament">): number[] {
  return multipliers(def.temperament).map((m) => m * def.price);
}

const SPLIT_WEIGHTS = [5, 3, 2];

/**
 * Découpe un gain en 1 à `maxParts` montants de la palette.
 * On liste les découpages possibles en 1, 2 et 3 montants, sans tenir compte de
 * l'ordre. On choisit d'abord le nombre de montants parmi ceux qui existent,
 * avec les poids 5, 3 et 2, puis un découpage au hasard.
 * `gain = 0` rend une liste vide.
 */
export function splitGain(gain: number, pal: readonly number[], maxParts: number, rng: Rng): number[] {
  if (gain <= 0) return [];
  const set = new Set(pal);
  const byCount: number[][][] = [[], [], []];
  if (set.has(gain)) byCount[0]!.push([gain]);
  if (maxParts >= 2) {
    for (const a of pal) {
      const b = gain - a;
      if (b < a) break;
      if (set.has(b)) byCount[1]!.push([a, b]);
    }
  }
  if (maxParts >= 3) {
    for (let i = 0; i < pal.length; i++) {
      const a = pal[i]!;
      if (a * 3 > gain) break;
      for (let j = i; j < pal.length; j++) {
        const b = pal[j]!;
        const c = gain - a - b;
        if (c < b) break;
        if (set.has(c)) byCount[2]!.push([a, b, c]);
      }
    }
  }
  let total = 0;
  for (let k = 0; k < 3; k++) if (byCount[k]!.length > 0) total += SPLIT_WEIGHTS[k]!;
  // Un seul montant est toujours possible quand le gain vient du tableau de lots.
  if (total === 0) return [gain];
  let r = rng() * total;
  let chosen = byCount[0]!;
  for (let k = 0; k < 3; k++) {
    if (byCount[k]!.length === 0) continue;
    chosen = byCount[k]!;
    r -= SPLIT_WEIGHTS[k]!;
    if (r < 0) break;
  }
  return shuffle(pickOne(rng, chosen), rng);
}

const DECOY_RATIO = 0.65;

/**
 * Montant leurre pour une case non gagnante. Le i-ème montant de la palette, par
 * ordre croissant en partant de 0, a le poids 0,65 puissance i. La loi est la
 * même que le ticket soit gagnant ou perdant : pas de « presque gagné » fabriqué.
 */
export function decoy(pal: readonly number[], rng: Rng): number {
  let total = 0;
  let w = 1;
  for (let i = 0; i < pal.length; i++) {
    total += w;
    w *= DECOY_RATIO;
  }
  let r = rng() * total;
  w = 1;
  for (let i = 0; i < pal.length; i++) {
    r -= w;
    if (r < 0) return pal[i]!;
    w *= DECOY_RATIO;
  }
  return pal[pal.length - 1]!;
}

/** Un leurre qui respecte `accept`. Après trop d'essais, le premier montant accepté de la palette. */
export function decoyWhere(pal: readonly number[], rng: Rng, accept: (amount: number) => boolean): number {
  for (let tries = 0; tries < 200; tries++) {
    const d = decoy(pal, rng);
    if (accept(d)) return d;
  }
  for (const a of pal) if (accept(a)) return a;
  return pal[0]!;
}

export function sum(values: readonly number[]): number {
  let s = 0;
  for (const v of values) s += v;
  return s;
}

/** Une correspondance visible : ce qui se signale dès que les cases concernées sont grattées. */
export interface Match {
  /** Identifiant stable, pour ne tinter qu'une fois. */
  key: string;
  /** Les cases concernées. */
  cells: string[];
  /** Le montant que cette correspondance rapporte. */
  amount: number;
}

export function optNumber(options: Record<string, unknown>, key: string, fallback: number): number {
  const v = options[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function optString<T extends string>(options: Record<string, unknown>, key: string, fallback: T): T {
  const v = options[key];
  return typeof v === "string" ? (v as T) : fallback;
}

export function optStrings(options: Record<string, unknown>, key: string): string[] {
  const v = options[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
