// Moteur `trio` : trois identiques (BRIEF.md, section 7.3).

import type { TicketDef } from "../../shared/types";
import { decoyWhere, mulberry32, palette, range, shuffle, type Match, type Rng } from "./common";

export interface TrioLayout {
  engine: "trio";
  /** 9 cases en 3 × 3, chacune cache un montant de la palette. */
  cells: number[];
}

export function buildTrio(pal: readonly number[], gain: number, rng: Rng): TrioLayout {
  const cells = new Array<number>(9).fill(0);
  const counts = new Map<number, number>();
  const positions = shuffle(range(9), rng);
  let next = 0;
  if (gain > 0) {
    // Le gain apparaît exactement 3 fois.
    for (; next < 3; next++) cells[positions[next]!] = gain;
    counts.set(gain, 3);
  }
  for (; next < 9; next++) {
    // Aucun autre montant n'apparaît plus de 2 fois.
    const d = decoyWhere(pal, rng, (a) => (gain <= 0 || a !== gain) && (counts.get(a) ?? 0) < 2);
    counts.set(d, (counts.get(d) ?? 0) + 1);
    cells[positions[next]!] = d;
  }
  return { engine: "trio", cells };
}

export function buildLayout(def: TicketDef, gain: number, seed: number): TrioLayout {
  return buildTrio(palette(def), gain, mulberry32(seed));
}

/** Le montant présent au moins 3 fois, sinon 0. */
export function evaluate(layout: TrioLayout): number {
  const counts = new Map<number, number>();
  for (const a of layout.cells) counts.set(a, (counts.get(a) ?? 0) + 1);
  for (const [amount, n] of counts) if (n >= 3) return amount;
  return 0;
}

export function cellIds(_layout: TrioLayout): string[] {
  return range(9).map((i) => `c${i}`);
}

/** À la troisième case identique visible, les trois se signalent. */
export function matches(layout: TrioLayout, revealed: ReadonlySet<string>): Match[] {
  const byAmount = new Map<number, string[]>();
  layout.cells.forEach((a, i) => {
    const id = `c${i}`;
    if (!revealed.has(id)) return;
    const list = byAmount.get(a) ?? [];
    list.push(id);
    byAmount.set(a, list);
  });
  const out: Match[] = [];
  for (const [amount, cells] of byAmount) {
    if (cells.length >= 3) out.push({ key: `trio:${amount}`, cells, amount });
  }
  return out;
}
