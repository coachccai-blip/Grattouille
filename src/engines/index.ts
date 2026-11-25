// Point d'entrée des moteurs : deux fonctions pures par moteur (BRIEF.md, section 7.1).
//
//   buildLayout(def, gain, seed, pick?) : la grille, fabriquée de façon déterministe
//   evaluate(layout, pick?)             : ce que la grille paie, lue comme la lirait un joueur
//
// Invariant testé : evaluate(buildLayout(def, gain, seed)) === gain.

import type { TicketDef } from "../../shared/types";
import type { Match } from "./common";
import * as duel from "./duel";
import * as etoile from "./etoile";
import * as lignes from "./lignes";
import * as morpion from "./morpion";
import * as multi from "./multi";
import * as numeros from "./numeros";
import * as trio from "./trio";

export type Layout =
  | trio.TrioLayout
  | numeros.NumerosLayout
  | morpion.MorpionLayout
  | duel.DuelLayout
  | etoile.EtoileLayout
  | lignes.LignesLayout
  | multi.MultiLayout;

export function buildLayout(def: TicketDef, gain: number, seed: number, pick?: string): Layout {
  switch (def.engine) {
    case "trio": return trio.buildLayout(def, gain, seed);
    case "numeros": return numeros.buildLayout(def, gain, seed);
    case "morpion": return morpion.buildLayout(def, gain, seed);
    case "duel": return duel.buildLayout(def, gain, seed);
    case "etoile": return etoile.buildLayout(def, gain, seed, pick);
    case "lignes": return lignes.buildLayout(def, gain, seed);
    case "multi": return multi.buildLayout(def, gain, seed);
  }
}

export function evaluate(layout: Layout, pick?: string): number {
  switch (layout.engine) {
    case "trio": return trio.evaluate(layout);
    case "numeros": return numeros.evaluate(layout);
    case "morpion": return morpion.evaluate(layout);
    case "duel": return duel.evaluate(layout);
    case "etoile": return etoile.evaluate(layout, pick);
    case "lignes": return lignes.evaluate(layout);
    case "multi": return multi.evaluate(layout);
  }
}

/** Toutes les cases à gratter de la grille, dans l'ordre de lecture. */
export function cellIds(layout: Layout): string[] {
  switch (layout.engine) {
    case "trio": return trio.cellIds(layout);
    case "numeros": return numeros.cellIds(layout);
    case "morpion": return morpion.cellIds(layout);
    case "duel": return duel.cellIds(layout);
    case "etoile": return etoile.cellIds(layout);
    case "lignes": return lignes.cellIds(layout);
    case "multi": return multi.cellIds(layout);
  }
}

/** Les correspondances déjà visibles, vu les cases grattées. */
export function matches(layout: Layout, revealed: ReadonlySet<string>): Match[] {
  switch (layout.engine) {
    case "trio": return trio.matches(layout, revealed);
    case "numeros": return numeros.matches(layout, revealed);
    case "morpion": return morpion.matches(layout, revealed);
    case "duel": return duel.matches(layout, revealed);
    case "etoile": return etoile.matches(layout, revealed);
    case "lignes": return lignes.matches(layout, revealed);
    case "multi": return multi.matches(layout, revealed);
  }
}

/** Vrai si le ticket demande de choisir un signe avant de gratter. */
export function needsPick(def: TicketDef): boolean {
  return def.engine === "etoile";
}

/** La règle affichée sur le ticket, en une phrase. */
export function ruleOf(def: TicketDef): string {
  switch (def.engine) {
    case "trio":
      return def.options.mode === "symboles"
        ? "3 symboles identiques : tu gagnes leur montant."
        : "Trouve 3 montants identiques : tu gagnes ce montant.";
    case "numeros":
      return "Chaque fois qu'un de tes numéros est aussi un numéro gagnant, tu gagnes le montant inscrit dessous.";
    case "morpion": {
      const target = def.options.target === "moustache" ? "moustaches" : "truffes";
      return `Aligne 3 ${target} en ligne, en colonne ou en diagonale : tu gagnes le lot.`;
    }
    case "duel":
      return "À chaque manche gagnée, tu remportes son montant. Égalité : pas de gain.";
    case "etoile":
      return "Chaque fois que ton signe apparaît, tu gagnes le montant inscrit dessous.";
    case "lignes":
      return "Gratte le tirage. Une rangée dont les 3 éléments sont sortis rapporte son montant.";
    case "multi":
      return "Trois jeux en un : gratte les trois volets, leurs gains s'additionnent.";
  }
}

export type { Match } from "./common";
export { duel, etoile, lignes, morpion, multi, numeros, trio };
