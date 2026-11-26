// Point d'entrée des moteurs : deux fonctions pures par moteur (BRIEF.md, section 7.1).
//
//   buildLayout(def, gain, seed, pick?) : la grille, fabriquée de façon déterministe
//   evaluate(layout, pick?)             : ce que la grille paie, lue comme la lirait un joueur
//
// Invariant testé : evaluate(buildLayout(def, gain, seed)) === gain.
//
// Onze moteurs : les sept du brief (trio, numeros, morpion, duel, etoile, lignes,
// multi) et quatre autres (parcours, coef, mots, camps).

import type { TicketDef } from "../../shared/types";
import * as camps from "./camps";
import * as coef from "./coef";
import type { Match } from "./common";
import { optString, optStrings } from "./common";
import * as duel from "./duel";
import * as etoile from "./etoile";
import * as lignes from "./lignes";
import * as morpion from "./morpion";
import * as mots from "./mots";
import * as multi from "./multi";
import * as numeros from "./numeros";
import * as parcours from "./parcours";
import * as trio from "./trio";

export type Layout =
  | trio.TrioLayout
  | numeros.NumerosLayout
  | morpion.MorpionLayout
  | duel.DuelLayout
  | etoile.EtoileLayout
  | lignes.LignesLayout
  | multi.MultiLayout
  | parcours.ParcoursLayout
  | coef.CoefLayout
  | mots.MotsLayout
  | camps.CampsLayout;

export function buildLayout(def: TicketDef, gain: number, seed: number, pick?: string): Layout {
  switch (def.engine) {
    case "trio": return trio.buildLayout(def, gain, seed);
    case "numeros": return numeros.buildLayout(def, gain, seed);
    case "morpion": return morpion.buildLayout(def, gain, seed);
    case "duel": return duel.buildLayout(def, gain, seed);
    case "etoile": return etoile.buildLayout(def, gain, seed, pick);
    case "lignes": return lignes.buildLayout(def, gain, seed);
    case "multi": return multi.buildLayout(def, gain, seed);
    case "parcours": return parcours.buildLayout(def, gain, seed);
    case "coef": return coef.buildLayout(def, gain, seed);
    case "mots": return mots.buildLayout(def, gain, seed);
    case "camps": return camps.buildLayout(def, gain, seed, pick);
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
    case "parcours": return parcours.evaluate(layout);
    case "coef": return coef.evaluate(layout);
    case "mots": return mots.evaluate(layout);
    case "camps": return camps.evaluate(layout, pick);
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
    case "parcours": return parcours.cellIds(layout);
    case "coef": return coef.cellIds(layout);
    case "mots": return mots.cellIds(layout);
    case "camps": return camps.cellIds(layout);
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
    case "parcours": return parcours.matches(layout, revealed);
    case "coef": return coef.matches(layout, revealed);
    case "mots": return mots.matches(layout, revealed);
    case "camps": return camps.matches(layout, revealed);
  }
}

/** Vrai si le ticket demande un choix avant de gratter : un signe (`etoile`) ou un camp (`camps`). */
export function needsPick(def: TicketDef): boolean {
  return def.engine === "etoile" || def.engine === "camps";
}

/** Les choix proposés avant de gratter : les signes du ticket, ou ses deux camps. */
export function pickOptions(def: TicketDef): string[] {
  if (def.engine === "etoile") return optStrings(def.options, "signs");
  if (def.engine === "camps") return camps.campsOf(def);
  return [];
}

/** Le choix proposé par défaut : celui demandé s'il existe sur ce ticket, sinon le premier. */
export function resolvePick(def: TicketDef, pick?: string): string | undefined {
  if (def.engine === "etoile") return etoile.resolvePick(def, pick);
  if (def.engine === "camps") return camps.resolveCamp(def, pick);
  return undefined;
}

const MORPION_TARGETS: Record<string, string> = { truffe: "truffes", moustache: "moustaches", planete: "planètes" };

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
      const target = MORPION_TARGETS[optString(def.options, "target", "truffe")] ?? "truffes";
      return `Aligne 3 ${target} en ligne, en colonne ou en diagonale : tu gagnes le lot.`;
    }
    case "duel":
      return "À chaque manche gagnée, tu remportes son montant. Égalité : pas de gain.";
    case "etoile":
      return def.options.family === "arcane"
        ? "Chaque fois que ton arcane apparaît, tu gagnes le montant inscrit dessous."
        : "Chaque fois que ton signe apparaît, tu gagnes le montant inscrit dessous.";
    case "lignes":
      return def.options.skin === "cocktails"
        ? "Gratte les ingrédients. Un cocktail dont les 3 ingrédients sont sortis rapporte son montant."
        : "Gratte le tirage. Une rangée dont les 3 éléments sont sortis rapporte son montant.";
    case "multi":
      return "Trois jeux en un : gratte les trois volets, leurs gains s'additionnent.";
    case "parcours":
      return "Gratte les 3 dés : ton pion avance du total. Tu gagnes le montant de la case où il s'arrête.";
    case "coef":
      return "Trouve 3 montants identiques : tu gagnes ce montant, multiplié par le coefficient.";
    case "mots":
      return "Gratte tes 10 lettres. Chaque mot entièrement découvert compte : plus il y en a, plus tu gagnes.";
    case "camps":
      return "Si ton camp sort au moins 5 fois sur 9, tu gagnes le lot.";
  }
}

export type { Match } from "./common";
export { camps, coef, duel, etoile, lignes, morpion, mots, multi, numeros, parcours, trio };
