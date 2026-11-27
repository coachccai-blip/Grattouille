// Le `t()` des écrans de la suite chargés à la demande (le geste du Patron, la vignette, le
// Carnet, la vraie fin, le premier ticket sous cloche, les Souvenirs).
//
// Leur anglais (`./en`) voyage avec eux : ce module l'ajoute aux dictionnaires du jeu au
// moment où le premier de ces écrans arrive (`addEnglish`), puis rend le `t()` de tout le
// monde. Rien de tout cela ne pèse sur le démarrage (LOT4.md, section 11) ; une phrase qui
// manquerait reste en français et se note comme partout ailleurs (`window.__i18nMisses()`).

import { addEnglish, t } from "../../i18n";
import { EN_ECRANS } from "./en";

addEnglish(EN_ECRANS);

export { t };
