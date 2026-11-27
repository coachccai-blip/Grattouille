// L'anglais du poker voyage avec ses écrans : plus de trois cents phrases, qui n'ont rien
// à faire dans le premier chargement du jeu. Tout module du poker qui affiche un texte
// importe celui-ci (pour son effet) : le dictionnaire s'ajoute une fois, à son arrivée.

import { addEnglish } from "../../i18n";
import { EN_POKER } from "../../i18n/en/poker";

addEnglish(EN_POKER);
