// Moteur `etoile` : ton signe (BRIEF.md, section 7.7).

import type { TicketDef } from "../../shared/types";
import { decoy, mulberry32, optNumber, optStrings, palette, range, shuffle, splitGain, type Match, type Rng } from "./common";

export interface EtoileOptions {
  cells: number;
  signs: readonly string[];
}

export interface EtoileLayout {
  engine: "etoile";
  /** Le signe choisi par le joueur avant de gratter. */
  pick: string;
  /** C cases, chacune avec un signe et un montant. */
  cells: { sign: string; amount: number }[];
}

export function etoileOptions(def: TicketDef): EtoileOptions {
  return { cells: optNumber(def.options, "cells", 6), signs: optStrings(def.options, "signs") };
}

/** Le signe proposé par défaut : celui demandé s'il existe sur ce ticket, sinon le premier. */
export function resolvePick(def: TicketDef, pick?: string): string {
  const signs = optStrings(def.options, "signs");
  return pick && signs.includes(pick) ? pick : signs[0] ?? "";
}

export function buildEtoile(
  pal: readonly number[], opts: EtoileOptions, gain: number, rng: Rng, pick: string, maxParts = 3,
): EtoileLayout {
  const parts = splitGain(gain, pal, Math.min(maxParts, opts.cells), rng);
  const others = opts.signs.filter((s) => s !== pick);
  // Les autres cases montrent un autre signe : tous différents tant qu'il en reste.
  let bag: string[] = [];
  const nextOther = (): string => {
    if (bag.length === 0) bag = shuffle(others, rng);
    return bag.pop() ?? pick;
  };
  const positions = shuffle(range(opts.cells), rng);
  const cells = new Array<{ sign: string; amount: number }>(opts.cells);
  positions.forEach((pos, i) => {
    cells[pos] = i < parts.length
      ? { sign: pick, amount: parts[i]! }
      : { sign: nextOther(), amount: decoy(pal, rng) };
  });
  return { engine: "etoile", pick, cells };
}

/** La grille est construite après le choix du signe, passé en `pick`. */
export function buildLayout(def: TicketDef, gain: number, seed: number, pick?: string): EtoileLayout {
  return buildEtoile(palette(def), etoileOptions(def), gain, mulberry32(seed), resolvePick(def, pick));
}

/** Somme des montants des cases qui montrent le signe choisi. */
export function evaluate(layout: EtoileLayout, pick?: string): number {
  const sign = pick ?? layout.pick;
  let total = 0;
  for (const c of layout.cells) if (c.sign === sign) total += c.amount;
  return total;
}

export function cellIds(layout: EtoileLayout): string[] {
  return layout.cells.map((_, i) => `s${i}`);
}

export function matches(layout: EtoileLayout, revealed: ReadonlySet<string>): Match[] {
  const out: Match[] = [];
  layout.cells.forEach((c, i) => {
    if (c.sign === layout.pick && revealed.has(`s${i}`)) {
      out.push({ key: `etoile:${i}`, cells: [`s${i}`], amount: c.amount });
    }
  });
  return out;
}
