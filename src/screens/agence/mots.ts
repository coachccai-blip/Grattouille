// Le `t()` des écrans de l'Agence Carpe Diem (le catalogue, la fiche, le film).
//
// Leur anglais (src/i18n/en/experiences.ts) voyage avec eux : ce module l'ajoute aux
// dictionnaires du jeu quand l'agence arrive (`addEnglish`), puis rend le `t()` de tout le
// monde. Rien de tout cela ne pèse sur le démarrage (LOT4.md, section 11) ; une phrase qui
// manquerait reste en français et se note comme partout ailleurs (`window.__i18nMisses()`).

import { addEnglish, t } from "../../i18n";
import { EN_EXPERIENCES } from "../../i18n/en/experiences";

addEnglish(EN_EXPERIENCES);

export { t };
