// Moteur `camps` : choisis ton camp.
//
// Avant de gratter, le joueur choisit un camp parmi deux (le rouge ou le noir, bâbord
// ou tribord, le Soleil ou la Lune). Neuf cases montrent chacune un des deux camps :
// si le sien sort le plus souvent, il gagne le lot. Comme pour le signe du moteur
// `etoile`, le choix ne change pas les chances : la grille est construite après lui.

import type { TicketDef } from "../../shared/types";
import { decoy, mulberry32, optStrings, palette, range, shuffle, type Match, type Rng } from "./common";

export const CAMP_CELLS = 9;
export const MAJORITY = 5;

/**
 * Combien de fois sort le camp gagnant : la loi de neuf tirages à pile ou face,
 * sachant qu'il l'emporte. Un 5 à 4 est le plus fréquent, un 9 à 0 presque jamais.
 */
const WINNER_COUNTS = [5, 6, 7, 8, 9] as const;
const WINNER_WEIGHTS = [126, 84, 36, 9, 1] as const;

export interface CampsLayout {
  engine: "camps";
  /** Les deux camps du ticket. */
  camps: [string, string];
  /** Le camp choisi par le joueur. */
  pick: string;
  /** Neuf cases : le camp qu'elles montrent. */
  cells: string[];
  /** La case « lot » : le gain si le camp choisi l'emporte, sinon un leurre. */
  lot: number;
}

export function campsOf(def: TicketDef): [string, string] {
  const list = optStrings(def.options, "camps");
  return [list[0] ?? "rouge", list[1] ?? "noir"];
}

export function resolveCamp(def: TicketDef, pick?: string): string {
  const camps = campsOf(def);
  return pick && camps.includes(pick) ? pick : camps[0];
}

export function buildCamps(pal: readonly number[], camps: [string, string], gain: number, rng: Rng, pick: string): CampsLayout {
  const other = pick === camps[0] ? camps[1] : camps[0];
  let r = rng() * 256;
  let lead: number = WINNER_COUNTS[0];
  for (let i = 0; i < WINNER_COUNTS.length; i++) {
    r -= WINNER_WEIGHTS[i]!;
    if (r < 0) {
      lead = WINNER_COUNTS[i]!;
      break;
    }
  }
  // Le camp qui l'emporte occupe `lead` cases : celui du joueur si le ticket gagne, l'autre sinon.
  const winner = gain > 0 ? pick : other;
  const loser = gain > 0 ? other : pick;
  const order = shuffle(range(CAMP_CELLS), rng);
  const cells = new Array<string>(CAMP_CELLS).fill(loser);
  for (let i = 0; i < lead; i++) cells[order[i]!] = winner;
  return { engine: "camps", camps, pick, cells, lot: gain > 0 ? gain : decoy(pal, rng) };
}

/** La grille est construite après le choix du camp, passé en `pick`. */
export function buildLayout(def: TicketDef, gain: number, seed: number, pick?: string): CampsLayout {
  return buildCamps(palette(def), campsOf(def), gain, mulberry32(seed), resolveCamp(def, pick));
}

export function countOf(layout: CampsLayout, camp: string): number {
  let n = 0;
  for (const c of layout.cells) if (c === camp) n++;
  return n;
}

/** Le lot si le camp choisi sort au moins 5 fois sur 9, sinon 0. */
export function evaluate(layout: CampsLayout, pick?: string): number {
  return countOf(layout, pick ?? layout.pick) >= MAJORITY ? layout.lot : 0;
}

export function cellIds(_layout: CampsLayout): string[] {
  return [...range(CAMP_CELLS).map((i) => `q${i}`), "lot"];
}

/** Les cases du camp choisi déjà visibles. */
export function seen(layout: CampsLayout, revealed: ReadonlySet<string>, camp: string): number {
  let n = 0;
  layout.cells.forEach((c, i) => {
    if (c === camp && revealed.has(`q${i}`)) n++;
  });
  return n;
}

/** À la cinquième case de son camp, le joueur a gagné : elles se signalent. */
export function matches(layout: CampsLayout, revealed: ReadonlySet<string>): Match[] {
  const cells = layout.cells.map((c, i) => (c === layout.pick && revealed.has(`q${i}`) ? `q${i}` : "")).filter((id) => id !== "");
  if (cells.length < MAJORITY) return [];
  return [{ key: "camps:majorite", cells, amount: revealed.has("lot") ? layout.lot : 0 }];
}
