// Grilles de mots croisés anglaises du moteur `mots`.
//
// Même contrat que mots-grilles.ts : pour chaque lexique (`terrasse`, `tresor`),
// 10 grilles de 10 mots entrecroisés, dans 9 colonnes sur 8 rangées au plus, écrits
// avec les 10 lettres de ALPHABET seulement (A E I L N O P R S T), en anglais. Pour
// chaque nombre de mots de 0 à 10, il doit exister un jeu de lettres à cacher qui
// laisse exactement ce nombre de mots complets.
//
// Fichier produit par un générateur (recherche aléatoire, puis contrôles) et relu à la
// main, comme mots-grilles.ts.
//
// Un mot : [texte, rangée, colonne, sens] ; sens 0 = horizontal, 1 = vertical.

import type { Grille } from "./mots-grilles";

export const GRILLES_EN: Record<string, readonly Grille[]> = {
  // Le café, la plage, la table : La Grille du Jour.
  terrasse: [
    [["STOOL", 3, 7, 1], ["PONTOON", 5, 2, 0], ["ROSE", 3, 5, 0], ["OPERETTA", 0, 5, 1], ["PORPOISE", 0, 1, 0], ["ENTREE", 2, 0, 0], ["PORT", 4, 3, 1], ["RESPITE", 1, 0, 1], ["OATS", 0, 2, 1], ["TEA", 7, 3, 0]],
    [["SESSION", 7, 0, 0], ["ESPRESSO", 0, 5, 1], ["REPRISE", 1, 1, 1], ["ROLL", 3, 5, 0], ["PALATE", 1, 8, 1], ["ISLE", 0, 2, 0], ["SETTEE", 0, 3, 1], ["REST", 2, 0, 0], ["SEAT", 5, 5, 0], ["TILE", 5, 0, 0]],
    [["LATTE", 1, 7, 1], ["POTATOES", 5, 1, 0], ["EEL", 1, 5, 0], ["TEAPOT", 0, 5, 1], ["STEREO", 0, 2, 1], ["PITA", 3, 5, 0], ["PAL", 5, 1, 1], ["LISTEN", 7, 1, 0], ["OPEN", 2, 0, 0], ["ATOLL", 0, 0, 1]],
    [["PATRON", 0, 2, 1], ["PENNE", 5, 0, 0], ["TERN", 4, 4, 1], ["TREAT", 4, 4, 0], ["PARSNIP", 0, 2, 0], ["PLATTER", 0, 8, 1], ["PAINTER", 7, 1, 0], ["TART", 2, 2, 0], ["TRIP", 2, 0, 1], ["SITAR", 0, 5, 1]],
    [["STARTER", 1, 0, 1], ["TEASPOON", 5, 0, 0], ["PEA", 5, 4, 1], ["LOTION", 1, 6, 1], ["NOTE", 2, 5, 0], ["SALT", 4, 2, 1], ["SLOOP", 1, 0, 0], ["SEAL", 1, 8, 1], ["NOON", 0, 3, 1], ["RATTAN", 7, 0, 0]],
    [["POLENTA", 1, 2, 1], ["SEAPLANE", 4, 1, 0], ["PAIL", 1, 5, 1], ["SPOON", 1, 4, 0], ["PLANTER", 7, 0, 0], ["ANISE", 0, 8, 1], ["TOOT", 2, 0, 0], ["POET", 4, 4, 1], ["NAP", 5, 0, 1], ["ALTO", 0, 0, 1]],
    [["REPOSE", 0, 0, 0], ["SIRLOIN", 0, 4, 1], ["TRILL", 3, 0, 0], ["STRAINER", 5, 0, 0], ["SIT", 5, 0, 1], ["TIP", 7, 0, 0], ["RESORT", 1, 7, 1], ["RIPE", 2, 4, 0], ["REST", 0, 0, 1], ["PIER", 2, 2, 1]],
    [["SEAPORT", 0, 3, 1], ["PARAPET", 2, 2, 0], ["ASLEEP", 0, 2, 0], ["PRATTLE", 6, 0, 0], ["TONE", 2, 8, 1], ["TAN", 4, 6, 0], ["OAR", 4, 1, 1], ["SOLO", 4, 0, 0], ["IRIS", 1, 0, 1], ["POT", 2, 6, 1]],
    [["ARTIST", 0, 2, 1], ["PORPOISE", 1, 0, 0], ["PASTEL", 1, 0, 1], ["STIR", 3, 0, 0], ["NET", 0, 7, 1], ["PIANIST", 0, 5, 1], ["SIREN", 4, 4, 0], ["OTTER", 6, 3, 0], ["INN", 3, 8, 1], ["EAT", 5, 0, 0]],
    [["LATTE", 3, 1, 0], ["OPERA", 1, 5, 1], ["PLEASANT", 5, 0, 0], ["PETAL", 3, 7, 1], ["PORTION", 1, 0, 0], ["PARASOL", 7, 1, 0], ["ALE", 3, 2, 1], ["POOL", 0, 1, 1], ["SEA", 5, 4, 1], ["SPA", 4, 0, 1]],
  ],
  // L'argent, les coffres, les rois : Sésame.
  tresor: [
    [["STOLEN", 2, 5, 1], ["EARN", 6, 5, 0], ["ATOLL", 5, 1, 0], ["TREASON", 0, 8, 1], ["LINEN", 7, 1, 0], ["PESETA", 0, 1, 1], ["RAREST", 0, 3, 0], ["NET", 3, 0, 0], ["SALE", 2, 5, 0], ["LOAN", 4, 3, 1]],
    [["TRILLION", 0, 5, 1], ["PATINA", 0, 3, 0], ["SIRE", 2, 4, 0], ["SNARE", 7, 4, 0], ["RETAILER", 4, 0, 0], ["SAIL", 3, 3, 1], ["REEL", 6, 0, 0], ["PLATE", 0, 1, 1], ["RARE", 4, 0, 1], ["EARNER", 2, 7, 1]],
    [["APPRAISER", 4, 0, 0], ["TRIAL", 3, 3, 1], ["LOSS", 1, 6, 1], ["RETAIL", 6, 0, 0], ["TINSEL", 1, 1, 0], ["INSERT", 0, 8, 1], ["LAIR", 3, 0, 1], ["PIN", 0, 2, 1], ["ISLE", 4, 5, 1], ["EARL", 7, 5, 0]],
    [["PINSTRIPE", 5, 0, 0], ["ALIAS", 1, 3, 1], ["RETIRE", 2, 6, 1], ["IRON", 2, 5, 0], ["TSARINA", 1, 1, 1], ["RENT", 0, 8, 1], ["SALARIES", 7, 0, 0], ["SIR", 0, 6, 0], ["SATIN", 3, 0, 0], ["STEAL", 1, 0, 0]],
    [["SPREE", 2, 4, 0], ["PORTAL", 0, 6, 1], ["TRAP", 0, 3, 0], ["LEASE", 4, 4, 0], ["RESALE", 0, 4, 1], ["TIARA", 3, 0, 0], ["PRESENT", 0, 8, 1], ["PLOT", 0, 0, 1], ["ELITE", 5, 0, 0], ["RAPIER", 2, 2, 1]],
    [["SPOILS", 3, 0, 0], ["SLOOP", 3, 5, 1], ["PELT", 7, 5, 0], ["OPAL", 5, 5, 0], ["ATTIRE", 0, 3, 1], ["PESETA", 0, 7, 1], ["POOL", 3, 1, 1], ["TASSEL", 1, 3, 0], ["NOTE", 5, 0, 0], ["LIRA", 0, 0, 0]],
    [["RATION", 2, 0, 0], ["SPONSOR", 0, 4, 1], ["RETAIN", 0, 2, 1], ["STEEL", 4, 4, 0], ["SIR", 0, 0, 1], ["ASSENT", 1, 7, 1], ["PRINT", 6, 3, 0], ["RISE", 0, 2, 0], ["OAR", 1, 6, 0], ["TIN", 5, 0, 0]],
    [["RENTER", 3, 0, 0], ["PATROL", 0, 0, 1], ["LION", 5, 0, 0], ["PISTOL", 0, 0, 0], ["TON", 3, 3, 1], ["TRAIL", 2, 5, 1], ["ALLOT", 6, 4, 0], ["TALENT", 1, 8, 1], ["ANTE", 4, 5, 0], ["ART", 1, 6, 0]],
    [["ROSETTE", 5, 0, 0], ["STOLE", 1, 6, 1], ["SILENT", 0, 4, 1], ["LASER", 1, 0, 1], ["ASSET", 3, 2, 1], ["NATION", 7, 0, 0], ["PESO", 0, 2, 0], ["TEN", 5, 5, 1], ["SLOT", 2, 3, 0], ["SEA", 3, 0, 0]],
    [["TIPTOE", 0, 5, 1], ["PARROT", 4, 1, 0], ["INTEREST", 0, 3, 1], ["RETIREE", 7, 1, 0], ["LOOT", 2, 0, 0], ["POT", 2, 5, 0], ["PISTOL", 0, 2, 0], ["PILE", 0, 0, 1], ["PEER", 4, 1, 1], ["ORE", 5, 7, 1]],
  ],
};
