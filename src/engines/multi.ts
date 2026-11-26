// Moteur `multi` : trois jeux en un (BRIEF.md, section 7.9).
//
// Deux tickets à volets :
// - `classique`, Le Grand Grattouille : un `trio`, un `numeros`, un `duel` ;
// - `ciel`, Le Gratte-Ciel : un `parcours`, un `coef`, un `morpion`.

import type { TicketDef } from "../../shared/types";
import * as coef from "./coef";
import { mulberry32, optString, palette, range, shuffle, splitGain, type Match } from "./common";
import * as duel from "./duel";
import * as morpion from "./morpion";
import * as numeros from "./numeros";
import * as parcours from "./parcours";
import * as trio from "./trio";

export type MultiKind = "classique" | "ciel";

export type MultiLayout =
  | {
      engine: "multi";
      kind: "classique";
      /** Trois volets : un `trio`, un `numeros` (2 gagnants, 6 numéros), un `duel` (3 manches, cartes). */
      panels: [trio.TrioLayout, numeros.NumerosLayout, duel.DuelLayout];
    }
  | {
      engine: "multi";
      kind: "ciel";
      /** Trois volets : un `parcours` (l'ascenseur), un `coef`, un `morpion`. */
      panels: [parcours.ParcoursLayout, coef.CoefLayout, morpion.MorpionLayout];
    };

export const PANEL_COUNT = 3;

// Des noms courts, qui tiennent sur une ligne à côté des trois pastilles, et qui ne
// répètent aucun libellé du volet lui-même (« Numéros gagnants », « Prime »).
const NAMES: Record<MultiKind, readonly [string, string, string]> = {
  classique: ["Le trio", "Le tirage", "Le 21"],
  ciel: ["L'ascenseur", "Le bureau", "Le toit"],
};

/** Les noms français des trois volets : ce sont des clés de traduction, l'affichage les passe à `t()`. */
export function panelNames(layout: MultiLayout): readonly [string, string, string] {
  return NAMES[layout.kind];
}

const NUMEROS_OPTIONS: numeros.NumerosOptions = { winning: 2, count: 6, cols: 3 };
const DUEL_OPTIONS: duel.DuelOptions = { rounds: 3, skin: "cartes" };

export function kindOf(def: TicketDef): MultiKind {
  return optString<MultiKind>(def.options, "panels", "classique") === "ciel" ? "ciel" : "classique";
}

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
  if (kindOf(def) === "ciel") {
    return {
      engine: "multi",
      kind: "ciel",
      panels: [
        parcours.buildParcours(pal, "ascenseur", gains[0]!, sub(0), def.temperament),
        coef.buildCoef(pal, "prime", gains[1]!, sub(1)),
        morpion.buildMorpion(pal, gains[2]!, sub(2)),
      ],
    };
  }
  return {
    engine: "multi",
    kind: "classique",
    panels: [
      trio.buildTrio(pal, gains[0]!, sub(0)),
      numeros.buildNumeros(pal, NUMEROS_OPTIONS, gains[1]!, sub(1), 1),
      duel.buildDuel(pal, DUEL_OPTIONS, gains[2]!, sub(2), 1),
    ],
  };
}

/** Somme des trois volets. */
export function evaluate(layout: MultiLayout): number {
  if (layout.kind === "ciel") {
    return parcours.evaluate(layout.panels[0]) + coef.evaluate(layout.panels[1]) + morpion.evaluate(layout.panels[2]);
  }
  return trio.evaluate(layout.panels[0]) + numeros.evaluate(layout.panels[1]) + duel.evaluate(layout.panels[2]);
}

function rawCellIds(layout: MultiLayout, panel: number): string[] {
  if (layout.kind === "ciel") {
    if (panel === 0) return parcours.cellIds(layout.panels[0]);
    if (panel === 1) return coef.cellIds(layout.panels[1]);
    return morpion.cellIds(layout.panels[2]);
  }
  if (panel === 0) return trio.cellIds(layout.panels[0]);
  if (panel === 1) return numeros.cellIds(layout.panels[1]);
  return duel.cellIds(layout.panels[2]);
}

export function panelCellIds(layout: MultiLayout, panel: number): string[] {
  return rawCellIds(layout, panel).map((id) => `p${panel}:${id}`);
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
  if (layout.kind === "ciel") {
    return [
      ...lift(0, parcours.matches(layout.panels[0], panelRevealed(revealed, 0))),
      ...lift(1, coef.matches(layout.panels[1], panelRevealed(revealed, 1))),
      ...lift(2, morpion.matches(layout.panels[2], panelRevealed(revealed, 2))),
    ];
  }
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
