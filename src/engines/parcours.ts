// Moteur `parcours` : trois dés et un chemin.
//
// Le ticket imprime un chemin de 18 cases. On gratte trois dés : le pion avance de
// leur total, et l'on gagne le montant de la case où il s'arrête.
//
// Les cases sont rangées comme les dés les distribuent vraiment : les totaux du
// milieu (10, 11), qui sortent sans arrêt, sont des cases vides ; plus un total est
// rare, plus sa case est belle, et le triple six porte le gros lot. Le plateau
// promet donc à peu près ce que le tableau de lots donne. Les chances exactes
// restent celles du tableau, affichées sur la fiche du ticket.

import { TEMPERAMENTS } from "../../shared/economy";
import type { Temperament, TicketDef } from "../../shared/types";
import { mulberry32, optString, palette, type Match, type Rng } from "./common";

export const DICE_COUNT = 3;
/** Le plus petit et le plus grand total de trois dés. */
export const FIRST_STOP = 3;
export const LAST_STOP = 18;
export const SQUARES = LAST_STOP;

/**
 * Pour chaque tempérament, le lot de chaque case d'arrivée, du total 3 au total 18 :
 * l'indice du lot dans le tableau (0 pour le plus petit), ou -1 pour une case vide.
 */
const BOARDS: Record<Temperament, readonly number[]> = {
  //           3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18
  pepere:    [ 8,  6,  4,  2,  1,  0, -1, -1, -1,  0,  1,  3,  5,  7,  8,  9],
  joueur:    [ 8,  6,  4,  2,  1,  0, -1, -1, -1, -1,  0,  1,  3,  5,  7,  9],
  "casse-cou": [ 8,  6,  4,  2,  0, -1, -1, -1, -1, -1, -1,  1,  3,  5,  7,  9],
};

/** Le nombre de façons d'obtenir chaque total avec trois dés, de 0 à 18. */
const WAYS: readonly number[] = (() => {
  const ways = new Array<number>(LAST_STOP + 1).fill(0);
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) ways[a + b + c]!++;
  return ways;
})();

export interface ParcoursLayout {
  engine: "parcours";
  skin: string;
  /** Les trois dés, de 1 à 6. */
  dice: number[];
  /** Le montant de chaque case, de la case 1 à la case 18. 0 : une case vide. */
  squares: number[];
}

/** Le tempérament dont `pal` est la palette : la longueur ne suffit pas, on compare les rapports. */
function temperamentOf(pal: readonly number[]): Temperament {
  const unit = pal[0] ?? 1;
  for (const t of Object.keys(TEMPERAMENTS) as Temperament[]) {
    if (TEMPERAMENTS[t].every(([m], i) => pal[i] === m * unit)) return t;
  }
  return "pepere";
}

/** Le plateau : les montants imprimés sur les 18 cases. Les cases 1 et 2 ne sont que l'élan. */
export function boardOf(pal: readonly number[], temperament: Temperament = temperamentOf(pal)): number[] {
  const squares = new Array<number>(SQUARES).fill(0);
  BOARDS[temperament].forEach((index, i) => {
    squares[FIRST_STOP - 1 + i] = index < 0 ? 0 : pal[index] ?? 0;
  });
  return squares;
}

/** Trois dés qui font `total`, tirés au hasard parmi toutes les façons de le faire. */
function diceFor(total: number, rng: Rng): number[] {
  const options: number[][] = [];
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      const c = total - a - b;
      if (c >= 1 && c <= 6) options.push([a, b, c]);
    }
  }
  return options[Math.floor(rng() * options.length)]!.slice();
}

export function buildParcours(
  pal: readonly number[], skin: string, gain: number, rng: Rng, temperament?: Temperament,
): ParcoursLayout {
  const squares = boardOf(pal, temperament);
  // Les cases d'arrivée possibles : celles qui portent le gain, ou les cases vides si le ticket perd.
  const stops: number[] = [];
  for (let total = FIRST_STOP; total <= LAST_STOP; total++) {
    if (squares[total - 1] === (gain > 0 ? gain : 0)) stops.push(total);
  }
  // Entre deux cases du même montant, le hasard suit celui des dés.
  let weight = 0;
  for (const total of stops) weight += WAYS[total]!;
  let r = rng() * weight;
  let chosen = stops[0] ?? 10;
  for (const total of stops) {
    r -= WAYS[total]!;
    if (r < 0) {
      chosen = total;
      break;
    }
  }
  return { engine: "parcours", skin, dice: diceFor(chosen, rng), squares };
}

export function buildLayout(def: TicketDef, gain: number, seed: number): ParcoursLayout {
  return buildParcours(palette(def), optString(def.options, "skin", "jetee"), gain, mulberry32(seed), def.temperament);
}

export function totalOf(dice: readonly number[]): number {
  let total = 0;
  for (const d of dice) total += d;
  return total;
}

/** Le montant de la case où le pion s'arrête. */
export function evaluate(layout: ParcoursLayout): number {
  return layout.squares[totalOf(layout.dice) - 1] ?? 0;
}

export function cellIds(_layout: ParcoursLayout): string[] {
  return ["x0", "x1", "x2"];
}

/** La case où se tient le pion, vu les dés déjà grattés (0 : au départ). */
export function position(layout: ParcoursLayout, revealed: ReadonlySet<string>): number {
  let at = 0;
  layout.dice.forEach((d, i) => {
    if (revealed.has(`x${i}`)) at += d;
  });
  return at;
}

/** Les trois dés grattés, le pion est arrivé : sa case paie, si elle porte un montant. */
export function matches(layout: ParcoursLayout, revealed: ReadonlySet<string>): Match[] {
  const ids = cellIds(layout);
  if (!ids.every((id) => revealed.has(id))) return [];
  const amount = evaluate(layout);
  return amount > 0 ? [{ key: "parcours:arrivee", cells: ids, amount }] : [];
}
