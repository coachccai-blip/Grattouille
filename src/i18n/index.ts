// Deux langues : le français, langue d'origine du jeu, et l'anglais.
//
// Les textes de l'interface s'écrivent en français dans le code, entourés de `t()`.
// En anglais, `t()` va chercher la traduction dans les dictionnaires de `en/`, dont
// la clé est la phrase française elle-même :
//
//   t("Tout gratter")                                  → "Scratch all"
//   t("Il te manque {montant}.", { montant })          → "You're {montant} short."
//
// Règles d'usage :
// - `t()` se lit au rendu, jamais à l'import d'un module : une table de constantes
//   garde ses phrases françaises, et c'est l'affichage qui appelle `t(phrase)`.
// - Les noms tirés des données (tickets, biens, lieux, boutiques, espèces) passent
//   par `noms.ts`. Les répliques des personnages ont leurs deux versions dans
//   `app/dialogues.ts`.
// - Changer de langue remonte tout l'écran (voir main.tsx) : pas d'abonnement à gérer.

import { setFormatLang } from "../../shared/format";
import { EN_BOUTIQUES } from "./en/boutiques";
import { EN_JEU } from "./en/jeu";
import { EN_MUSIQUE } from "./en/musique";
import { EN_POKER } from "./en/poker";
import { EN_RECIT } from "./en/recit";
import { EN_SUITE } from "./en/suite";
import { EN_TICKETS } from "./en/tickets";
import { EN_TROPHEES } from "./en/trophees";

export type Lang = "fr" | "en";
export const LANGS: readonly Lang[] = ["fr", "en"];

export function isLang(x: unknown): x is Lang {
  return x === "fr" || x === "en";
}

const EN: Record<string, string> = {
  ...EN_RECIT, ...EN_JEU, ...EN_BOUTIQUES, ...EN_TICKETS, ...EN_POKER,
  ...EN_SUITE, ...EN_TROPHEES, ...EN_MUSIQUE,
};

/**
 * Ajoute des traductions anglaises. Un écran chargé à la demande apporte ainsi son propre
 * dictionnaire avec lui, au lieu de peser sur le premier chargement.
 */
export function addEnglish(dictionary: Record<string, string>): void {
  Object.assign(EN, dictionary);
}

let current: Lang = "fr";
/** Les phrases demandées en anglais et absentes des dictionnaires : elles restent en français. */
const misses = new Set<string>();

export function lang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  current = next;
  setFormatLang(next);
  if (typeof document !== "undefined") document.documentElement.lang = next;
}

function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** La phrase dans la langue courante. `{nom}` est remplacé par `vars.nom`. */
export function t(fr: string, vars?: Record<string, string | number>): string {
  let text = fr;
  if (current === "en") {
    const en = EN[fr];
    if (en === undefined) misses.add(fr);
    else text = en;
  }
  return vars ? fill(text, vars) : text;
}

/** Une valeur par langue, pour les données qui ne sont pas de simples phrases. */
export function pick<T>(byLang: Record<Lang, T>): T {
  return byLang[current];
}

/** Note une traduction manquante (utilisé par `noms.ts`). */
export function missed(what: string): void {
  misses.add(what);
}

/** Pour les tests et la recette : ce qui est resté en français faute de traduction. */
export function i18nMisses(): string[] {
  return [...misses].sort();
}

// En bac à sable, la recette peut lire la liste depuis la console du navigateur.
if (typeof window !== "undefined" && window.location.search.includes("bac-a-sable")) {
  (window as unknown as { __i18nMisses: () => string[] }).__i18nMisses = i18nMisses;
}
