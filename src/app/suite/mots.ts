// Le `t()` des écrans de la suite de l'histoire (le geste du Patron, la vignette, le
// Carnet, la vraie fin, la cloche). Il s'emploie comme celui de `src/i18n` :
//
//   t("Ticket semé n° {n}", { n })   → "Dropped ticket no. 12"
//
// La différence : les traductions de ces écrans voyagent avec eux (`./en`), au lieu de
// peser sur le démarrage du jeu, presque à son plafond (LOT4.md, section 11). Une phrase
// absente d'ici se cherche dans les dictionnaires du jeu (« Continuer », « Aller au
// Kiosque ») ; absente de partout, elle reste en français et se signale comme les autres
// dans `i18nMisses()`.

import { lang, t as commun } from "../../i18n";
import { EN_ECRANS } from "./en";

/** La phrase dans la langue courante. `{nom}` est remplacé par `vars.nom`. */
export function t(fr: string, vars?: Record<string, string | number>): string {
  const en = lang() === "en" ? EN_ECRANS[fr] : undefined;
  // Les variables se remplissent comme partout : le `t()` du jeu s'en charge, sur une phrase qu'il ne traduit plus.
  if (en === undefined) return commun(fr, vars);
  return vars ? en.replace(/\{(\w+)\}/g, (tout, nom: string) => (nom in vars ? String(vars[nom]) : tout)) : en;
}
