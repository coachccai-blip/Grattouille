// Moteur `multi` : trois jeux en un (BRIEF.md, section 7.9).

import type { TicketDef } from "../../shared/types";
import { mulberry32, palette, range, shuffle, splitGain, type Match } from "./common";
import * as duel from "./duel";
import * as numeros from "./numeros";
import * as trio from "./trio";

export interface MultiLayout {
  engine: "multi";
  /** Trois volets : un `trio`, un `numeros` (2 gagnants, 6 numéros), un `duel` (3 manches, cartes). */
  panels: [trio.TrioLayout, numeros.NumerosLayout, duel.DuelLayout];
}

export const PANEL_COUNT = 3;
export const PANEL_NAMES = ["Trois identiques", "Numéros gagnants", "Le 21"] as const;

const NUMEROS_OPTIONS: numeros.NumerosOptions = { winning: 2, count: 6, cols: 3 };
const DUEL_OPTIONS: duel.DuelOptions = { rounds: 3, skin: "cartes" };

export function buildLayout(def: TicketDef, gain: number, seed: number): MultiLayout {
  const pal = palette(def);
  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  // Chaque part est attribuée à un volet différent, tiré au hasard. Les volets sans part sont perdants.
  const parts = splitGain(gain, pal, PANEL_COUNT, rng);
  const order = shuffle(range(PANEL_COUNT), rng);
  const gains = [0, 0, 0];
  parts.forEach((p, i) => {
    gains[order[i]!] = p;
  });
  // Chaque volet construit sa grille avec un seul lot, à partir de la graine `seed + numéro du volet`.
  const sub = (i: number) => mulberry32((seed + i) >>> 0);
  return {
    engine: "multi",
    panels: [
      trio.buildTrio(pal, gains[0]!, sub(0)),
      numeros.buildNumeros(pal, NUMEROS_OPTIONS, gains[1]!, sub(1), 1),
      duel.buildDuel(pal, DUEL_OPTIONS, gains[2]!, sub(2), 1),
    ],
  };
}

/** Somme des trois volets. */
export function evaluate(layout: MultiLayout): number {
  return trio.evaluate(layout.panels[0]) + numeros.evaluate(layout.panels[1]) + duel.evaluate(layout.panels[2]);
}

export function panelCellIds(layout: MultiLayout, panel: number): string[] {
  const ids = panel === 0
    ? trio.cellIds(layout.panels[0])
    : panel === 1
      ? numeros.cellIds(layout.panels[1])
      : duel.cellIds(layout.panels[2]);
  return ids.map((id) => `p${panel}:${id}`);
}

export function cellIds(layout: MultiLayout): string[] {
  return range(PANEL_COUNT).flatMap((p) => panelCellIds(layout, p));
}

/** Les cases d'un volet, sans leur préfixe, parmi celles qui sont visibles. */
export function panelRevealed(revealed: ReadonlySet<string>, panel: number): Set<string> {
  const prefix = `p${panel}:`;
  const out = new Set<string>();
  for (const id of revealed) if (id.startsWith(prefix)) out.add(id.slice(prefix.length));
  return out;
}

export function matches(layout: MultiLayout, revealed: ReadonlySet<string>): Match[] {
  const lift = (panel: number, list: Match[]): Match[] =>
    list.map((m) => ({ key: `p${panel}:${m.key}`, cells: m.cells.map((c) => `p${panel}:${c}`), amount: m.amount }));
  return [
    ...lift(0, trio.matches(layout.panels[0], panelRevealed(revealed, 0))),
    ...lift(1, numeros.matches(layout.panels[1], panelRevealed(revealed, 1))),
    ...lift(2, duel.matches(layout.panels[2], panelRevealed(revealed, 2))),
  ];
}

/** Le premier volet qui n'est pas entièrement gratté, ou le dernier. */
export function currentPanel(layout: MultiLayout, revealed: ReadonlySet<string>): number {
  for (let p = 0; p < PANEL_COUNT; p++) {
    if (!panelCellIds(layout, p).every((id) => revealed.has(id))) return p;
  }
  return PANEL_COUNT - 1;
}
