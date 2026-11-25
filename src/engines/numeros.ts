// Moteur `numeros` : numéros gagnants (BRIEF.md, section 7.4).

import type { TicketDef } from "../../shared/types";
import { decoy, mulberry32, optNumber, palette, range, shuffle, splitGain, type Match, type Rng } from "./common";

export interface NumerosOptions {
  /** K numéros gagnants. */
  winning: number;
  /** N cases « tes numéros ». */
  count: number;
  /** Colonnes de la grille de tes numéros. */
  cols: number;
}

export interface NumerosLayout {
  engine: "numeros";
  /** K numéros gagnants distincts entre 1 et 49. */
  winning: number[];
  /** N cases, chacune avec un numéro distinct et un montant. */
  yours: { n: number; amount: number }[];
  cols: number;
}

export function buildNumeros(
  pal: readonly number[], opts: NumerosOptions, gain: number, rng: Rng, maxParts = 3,
): NumerosLayout {
  const parts = splitGain(gain, pal, Math.min(maxParts, opts.winning, opts.count), rng);
  const numbers = shuffle(range(49, 1), rng);
  const winning = numbers.slice(0, opts.winning);
  const others = numbers.slice(opts.winning, opts.winning + opts.count);
  // Autant de cases que de parts reçoivent un numéro gagnant, tous différents.
  const lucky = shuffle(winning, rng).slice(0, parts.length);
  const positions = shuffle(range(opts.count), rng);
  const yours = new Array<{ n: number; amount: number }>(opts.count);
  positions.forEach((pos, i) => {
    yours[pos] = i < parts.length
      ? { n: lucky[i]!, amount: parts[i]! }
      : { n: others[i]!, amount: decoy(pal, rng) };
  });
  return { engine: "numeros", winning: winning.sort((a, b) => a - b), yours, cols: opts.cols };
}

export function numerosOptions(def: TicketDef): NumerosOptions {
  return {
    winning: optNumber(def.options, "winning", 3),
    count: optNumber(def.options, "count", 8),
    cols: optNumber(def.options, "cols", 4),
  };
}

export function buildLayout(def: TicketDef, gain: number, seed: number): NumerosLayout {
  return buildNumeros(palette(def), numerosOptions(def), gain, mulberry32(seed));
}

/** Somme des montants des cases dont le numéro figure parmi les gagnants. */
export function evaluate(layout: NumerosLayout): number {
  let total = 0;
  for (const cell of layout.yours) if (layout.winning.includes(cell.n)) total += cell.amount;
  return total;
}

export function cellIds(layout: NumerosLayout): string[] {
  return [...layout.winning.map((_, i) => `w${i}`), ...layout.yours.map((_, i) => `n${i}`)];
}

/**
 * Une case gagnante se signale dès que son numéro et le numéro gagnant
 * correspondant sont tous deux visibles, quel que soit l'ordre de grattage.
 */
export function matches(layout: NumerosLayout, revealed: ReadonlySet<string>): Match[] {
  const out: Match[] = [];
  layout.yours.forEach((cell, i) => {
    const w = layout.winning.indexOf(cell.n);
    if (w < 0) return;
    if (revealed.has(`n${i}`) && revealed.has(`w${w}`)) {
      out.push({ key: `numeros:${i}`, cells: [`n${i}`, `w${w}`], amount: cell.amount });
    }
  });
  return out;
}
