// Moteur `coef` : trois identiques, multipliés par un coefficient.
//
// Six cases cachent des montants, une septième cache le coefficient (×1 à ×20).
// Trois montants identiques font gagner ce montant, multiplié par le coefficient.

import type { TicketDef } from "../../shared/types";
import { decoyWhere, mulberry32, optString, palette, range, shuffle, type Match, type Rng } from "./common";

export const COEFS = [1, 2, 3, 5, 10, 20] as const;
export const AMOUNT_CELLS = 6;

/** Le coefficient d'un ticket perdant : les petits sortent plus souvent que les gros. */
const COEF_WEIGHTS = [5, 5, 4, 3, 2, 1] as const;

export interface CoefLayout {
  engine: "coef";
  skin: string;
  /** Six cases, chacune cache un montant. */
  cells: number[];
  coef: number;
}

/**
 * Les montants qui peuvent figurer dans les cases : chaque lot du ticket, et ce qu'il
 * donne une fois divisé par un coefficient, quand la division tombe juste.
 */
export function bases(pal: readonly number[]): number[] {
  const set = new Set<number>();
  for (const amount of pal) {
    for (const c of COEFS) if (amount % c === 0) set.add(amount / c);
  }
  return [...set].sort((a, b) => a - b);
}

function weighted<T>(items: readonly T[], weights: readonly number[], rng: Rng): T {
  let total = 0;
  for (const w of weights) total += w;
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

export function buildCoef(pal: readonly number[], skin: string, gain: number, rng: Rng): CoefLayout {
  const pool = bases(pal);
  const cells = new Array<number>(AMOUNT_CELLS).fill(0);
  const counts = new Map<number, number>();
  const positions = shuffle(range(AMOUNT_CELLS), rng);
  let next = 0;
  let coef: number;
  let base = 0;
  if (gain > 0) {
    // Un coefficient qui divise le gain : la base, répétée trois fois, fait le reste.
    const options = COEFS.filter((c) => gain % c === 0);
    coef = weighted(options, options.map((c) => (c === 1 ? 1 : 2)), rng);
    base = gain / coef;
    for (; next < 3; next++) cells[positions[next]!] = base;
    counts.set(base, 3);
  } else {
    coef = weighted(COEFS, COEF_WEIGHTS, rng);
  }
  for (; next < AMOUNT_CELLS; next++) {
    // Aucun autre montant n'apparaît plus de 2 fois.
    const d = decoyWhere(pool, rng, (a) => a !== base && (counts.get(a) ?? 0) < 2);
    counts.set(d, (counts.get(d) ?? 0) + 1);
    cells[positions[next]!] = d;
  }
  return { engine: "coef", skin, cells, coef };
}

export function buildLayout(def: TicketDef, gain: number, seed: number): CoefLayout {
  return buildCoef(palette(def), optString(def.options, "skin", "maree"), gain, mulberry32(seed));
}

/** Le montant présent trois fois, ou 0. */
export function tripleOf(layout: CoefLayout): number {
  const counts = new Map<number, number>();
  for (const a of layout.cells) counts.set(a, (counts.get(a) ?? 0) + 1);
  for (const [amount, n] of counts) if (n >= 3) return amount;
  return 0;
}

export function evaluate(layout: CoefLayout): number {
  return tripleOf(layout) * layout.coef;
}

export function cellIds(_layout: CoefLayout): string[] {
  return [...range(AMOUNT_CELLS).map((i) => `a${i}`), "k"];
}

/**
 * Les trois montants identiques se signalent d'abord, sans rien payer encore ;
 * le coefficient, une fois gratté, fait le total.
 */
export function matches(layout: CoefLayout, revealed: ReadonlySet<string>): Match[] {
  const base = tripleOf(layout);
  if (base <= 0) return [];
  const cells = layout.cells.map((a, i) => (a === base ? `a${i}` : "")).filter((id) => id !== "");
  if (!cells.every((id) => revealed.has(id))) return [];
  const out: Match[] = [{ key: "coef:trio", cells, amount: 0 }];
  if (revealed.has("k")) out.push({ key: "coef:total", cells: ["k"], amount: base * layout.coef });
  return out;
}
