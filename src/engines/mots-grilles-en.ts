// Grilles de mots croisés anglaises du moteur `mots`.
//
// Même contrat que mots-grilles.ts : pour chaque lexique (`terrasse`, `tresor`),
// 10 grilles de 10 mots entrecroisés, dans 9 colonnes sur 8 rangées au plus, écrits
// avec les 10 lettres de ALPHABET seulement (A E I L N O P R S T), en anglais. Pour
// chaque nombre de mots de 0 à 10, il doit exister un jeu de lettres à cacher qui
// laisse exactement ce nombre de mots complets.
//
// Un mot : [texte, rangée, colonne, sens] ; sens 0 = horizontal, 1 = vertical.

import type { Grille } from "./mots-grilles";

export const GRILLES_EN: Record<string, readonly Grille[]> = {};
