// Moteur `morpion` : trois alignés (BRIEF.md, section 7.5).

import type { TicketDef } from "../../shared/types";
import { decoy, mulberry32, palette, pickOne, randInt, range, shuffle, type Match, type Rng } from "./common";

export interface MorpionLayout {
  engine: "morpion";
  /** 9 cases en 3 × 3 : `true` pour le symbole cible, `false` pour l'autre. */
  grid: boolean[];
  /** La case « lot » : le gain si une ligne est complète, sinon un leurre. */
  lot: number;
}

/** Les 8 lignes possibles : 3 rangées, 3 colonnes, 2 diagonales. */
export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function completeLines(grid: readonly boolean[]): number[] {
  const out: number[] = [];
  LINES.forEach((line, i) => {
    if (line.every((c) => grid[c])) out.push(i);
  });
  return out;
}

export function buildMorpion(pal: readonly number[], gain: number, rng: Rng): MorpionLayout {
  for (;;) {
    const grid = new Array<boolean>(9).fill(false);
    if (gain > 0) {
      // Exactement une ligne faite de 3 symboles cibles, et entre 3 et 5 cibles en tout.
      const line = pickOne(rng, LINES);
      for (const c of line) grid[c] = true;
      const rest = shuffle(range(9).filter((c) => !line.includes(c)), rng);
      const extra = randInt(rng, 3);
      for (let i = 0; i < extra; i++) grid[rest[i]!] = true;
      if (completeLines(grid).length === 1) return { engine: "morpion", grid, lot: gain };
    } else {
      // Aucune ligne complète, entre 3 et 5 cibles.
      const count = 3 + randInt(rng, 3);
      const cells = shuffle(range(9), rng);
      for (let i = 0; i < count; i++) grid[cells[i]!] = true;
      if (completeLines(grid).length === 0) return { engine: "morpion", grid, lot: decoy(pal, rng) };
    }
  }
}

export function buildLayout(def: TicketDef, gain: number, seed: number): MorpionLayout {
  return buildMorpion(palette(def), gain, mulberry32(seed));
}

/** Le lot si une ligne est complète, sinon 0. */
export function evaluate(layout: MorpionLayout): number {
  return completeLines(layout.grid).length > 0 ? layout.lot : 0;
}

export function cellIds(_layout: MorpionLayout): string[] {
  return [...range(9).map((i) => `g${i}`), "lot"];
}

/** La ligne gagnante se barre dès que ses trois cases sont visibles. */
export function matches(layout: MorpionLayout, revealed: ReadonlySet<string>): Match[] {
  const out: Match[] = [];
  for (const i of completeLines(layout.grid)) {
    const cells = LINES[i]!.map((c) => `g${c}`);
    if (cells.every((id) => revealed.has(id))) {
      out.push({ key: `morpion:${i}`, cells, amount: revealed.has("lot") ? layout.lot : 0 });
    }
  }
  return out;
}
