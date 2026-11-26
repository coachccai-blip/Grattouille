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
import { t } from "../i18n";
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

// Les règles, en français : ce sont les clés de traduction de `ruleOf`. Une phrase ou
// deux, courtes : sur un téléphone, la règle tient sur deux lignes au pied du ticket.

const MORPION_RULES: Record<string, string> = {
  truffe: "Aligne 3 truffes en ligne, en colonne ou en diagonale : tu gagnes le lot.",
  moustache: "Aligne 3 moustaches en ligne, en colonne ou en diagonale : tu gagnes le lot.",
  planete: "Aligne 3 planètes en ligne, en colonne ou en diagonale : tu gagnes le lot.",
};

const DUEL_RULES: Record<string, string> = {
  foot: "Chaque match gagné rapporte son montant. Match nul : pas de gain.",
  cartes: "Chaque manche gagnée rapporte son montant. Égalité : pas de gain.",
  course: "Chaque course gagnée rapporte son montant. Égalité : pas de gain.",
};

const LIGNES_RULES: Record<string, string> = {
  cartes: "Une rangée dont les 3 cartes sont sorties au tirage rapporte son montant.",
  nombres: "Un voilier dont les 3 bouées sont sorties au tirage rapporte son montant.",
  cocktails: "Un cocktail dont les 3 ingrédients sont sortis rapporte son montant.",
};

function ruleKey(def: TicketDef): string {
  switch (def.engine) {
    case "trio":
      return def.options.mode === "symboles"
        ? "3 symboles identiques : tu gagnes leur montant."
        : "Trouve 3 montants identiques : tu gagnes ce montant.";
    case "numeros":
      return def.options.skin === "comptes"
        ? "Chacun de tes comptes qui est aussi gagnant rapporte son montant."
        : "Chacun de tes numéros qui est aussi gagnant rapporte son montant.";
    case "morpion":
      return MORPION_RULES[optString(def.options, "target", "truffe")] ?? MORPION_RULES.truffe!;
    case "duel":
      return DUEL_RULES[optString(def.options, "skin", "foot")] ?? DUEL_RULES.cartes!;
    case "etoile":
      return def.options.family === "arcane"
        ? "Chaque fois que ton arcane apparaît, tu gagnes le montant inscrit dessous."
        : "Chaque fois que ton signe apparaît, tu gagnes le montant inscrit dessous.";
    case "lignes":
      return LIGNES_RULES[optString(def.options, "skin", "cartes")] ?? LIGNES_RULES.cartes!;
    case "multi":
      return "Trois jeux en un : gratte les trois volets, leurs gains s'additionnent.";
    case "parcours":
      return "Ton pion avance du total des 3 dés : tu gagnes le montant de sa case d'arrivée.";
    case "coef":
      return def.options.skin === "interets"
        ? "3 montants identiques : tu gagnes ce montant, multiplié par le taux d'intérêt."
        : "3 montants identiques : tu gagnes ce montant, multiplié par le coefficient.";
    case "mots":
      return "Chaque mot complété avec tes 10 lettres fait monter le lot.";
    case "camps":
      return "Si ton camp sort au moins 5 fois sur 9, tu gagnes le lot.";
  }
}

/** La règle affichée sur le ticket, dans la langue du jeu. Se lit au rendu. */
export function ruleOf(def: TicketDef): string {
  return t(ruleKey(def));
}

export type { Match } from "./common";
export { camps, coef, duel, etoile, lignes, morpion, mots, multi, numeros, parcours, trio };
