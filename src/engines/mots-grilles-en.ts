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
    [["SESSION", 1, 0, 1], ["STARTER", 3, 0, 0], ["TASTE", 3, 4, 1], ["POTATOES", 0, 2, 1], ["PARAPET", 0, 2, 0], ["TRIO", 2, 6, 1], ["SLOOP", 5, 4, 0], ["EASEL", 7, 4, 0], ["TOOT", 0, 8, 1], ["PAL", 5, 8, 1]],
    [["PRATTLE", 0, 5, 1], ["NOTE", 4, 3, 0], ["PINT", 0, 5, 0], ["ANTIPASTO", 2, 0, 0], ["ISLET", 6, 2, 0], ["LINEN", 0, 1, 1], ["OPEN", 2, 8, 1], ["ALTO", 0, 0, 0], ["NET", 0, 7, 1], ["ONION", 0, 3, 1]],
    [["PALATE", 4, 3, 0], ["STOOL", 0, 5, 1], ["APPLE", 3, 3, 1], ["SEAT", 1, 2, 0], ["ROSE", 7, 0, 0], ["STRAINER", 0, 0, 1], ["LOITER", 0, 8, 1], ["ARIA", 3, 0, 0], ["LATTE", 6, 3, 0], ["SAIL", 0, 5, 0]],
    [["PEARL", 2, 6, 1], ["ENTREE", 3, 2, 0], ["OPERA", 1, 2, 1], ["TORTILLA", 0, 4, 1], ["PITA", 7, 1, 0], ["STIR", 0, 3, 0], ["OAR", 4, 0, 0], ["LOTION", 0, 0, 1], ["TIP", 2, 0, 0], ["LOLL", 6, 4, 0]],
    [["PASTEL", 2, 2, 0], ["SOLO", 0, 7, 1], ["ESPRESSO", 0, 1, 0], ["RESPITE", 0, 4, 1], ["SETTEE", 6, 3, 0], ["RAISIN", 4, 0, 0], ["PATIO", 3, 1, 1], ["PIER", 4, 8, 1], ["POT", 7, 0, 0], ["SIP", 0, 2, 1]],
    [["APPETITE", 1, 0, 0], ["PARSNIP", 1, 2, 1], ["SERENE", 3, 0, 0], ["ANISE", 5, 1, 0], ["PIANIST", 7, 2, 0], ["ARTIST", 2, 8, 1], ["OAT", 4, 6, 0], ["TILE", 0, 5, 1], ["SEA", 5, 4, 1], ["SALSA", 0, 0, 1]],
    [["REPOSE", 5, 0, 0], ["RIPPLE", 0, 5, 1], ["PEAR", 2, 0, 1], ["PEPPER", 2, 2, 0], ["LILT", 4, 5, 0], ["POOL", 4, 3, 1], ["LOLLIPOP", 7, 0, 0], ["PATRON", 0, 2, 0], ["ROLL", 2, 7, 1], ["ALE", 0, 3, 1]],
    [["SIREN", 2, 2, 0], ["STRAIT", 2, 2, 1], ["RATTAN", 2, 4, 1], ["LANTERN", 5, 1, 0], ["TONE", 7, 2, 0], ["SIT", 3, 0, 0], ["PENNE", 3, 7, 1], ["ROAST", 0, 0, 1], ["PAN", 0, 6, 1], ["REST", 0, 0, 0]],
    [["PLATE", 0, 4, 1], ["TRELLIS", 4, 2, 0], ["SLEEP", 3, 6, 1], ["POLENTA", 1, 2, 0], ["ATOLL", 3, 2, 1], ["PARASOL", 0, 8, 1], ["PEA", 3, 0, 0], ["PEEL", 6, 5, 0], ["REPRISE", 1, 0, 1], ["SALT", 6, 0, 0]],
    [["TOASTER", 0, 4, 1], ["PLANTER", 2, 2, 0], ["LINER", 6, 0, 0], ["PETAL", 2, 0, 1], ["SIESTA", 0, 0, 0], ["TREAT", 4, 0, 0], ["TERN", 0, 8, 1], ["TRILL", 2, 6, 1], ["PIE", 2, 2, 1], ["EEL", 5, 4, 0]],
  ],
  // L'argent, les coffres, les rois : Sésame.
  tresor: [
    [["STERN", 5, 1, 0], ["LOSSES", 0, 1, 1], ["NET", 5, 5, 1], ["PESETA", 7, 1, 0], ["POTENTATE", 1, 0, 0], ["SATIN", 0, 6, 1], ["PEASANT", 0, 8, 1], ["SIR", 3, 4, 1], ["PEN", 0, 3, 1], ["SPIES", 3, 4, 0]],
    [["PIRATE", 2, 3, 0], ["PLANNER", 0, 6, 1], ["SENATOR", 6, 0, 0], ["RETAINER", 4, 1, 0], ["PAPER", 0, 1, 1], ["ROPE", 0, 4, 0], ["ART", 4, 4, 1], ["EARL", 2, 8, 1], ["POT", 2, 3, 1], ["OAR", 1, 0, 0]],
    [["STEAL", 0, 5, 1], ["TALLIES", 4, 2, 0], ["SAIL", 0, 5, 0], ["NOTE", 2, 2, 1], ["ASSENT", 2, 8, 1], ["RAREST", 7, 3, 0], ["PENNIES", 2, 0, 0], ["PATENT", 2, 0, 1], ["ISLE", 4, 6, 1], ["LIRA", 4, 4, 1]],
    [["TONNE", 5, 0, 0], ["SEAL", 4, 4, 1], ["PARROT", 0, 0, 1], ["ALLOT", 7, 3, 0], ["PORTAL", 0, 0, 0], ["RETINA", 2, 0, 0], ["PASSPORT", 0, 7, 1], ["LOAN", 0, 5, 1], ["RATE", 0, 2, 1], ["ORE", 5, 1, 1]],
    [["PEARL", 7, 0, 0], ["PATINA", 2, 2, 1], ["LOTTERIES", 4, 0, 0], ["TRAIL", 0, 0, 1], ["SPREE", 1, 4, 1], ["LASER", 2, 8, 1], ["ASSET", 1, 3, 0], ["RETAILER", 0, 6, 1], ["TEN", 0, 0, 0], ["PEER", 6, 5, 0]],
    [["OPTION", 5, 3, 0], ["PERIL", 2, 6, 1], ["TITLE", 3, 2, 0], ["TALENT", 1, 8, 1], ["IRON", 3, 3, 1], ["LIEN", 6, 0, 0], ["TINSEL", 1, 0, 1], ["TELLER", 1, 0, 0], ["RENT", 0, 4, 1], ["PLOT", 0, 2, 1]],
    [["ASSESS", 2, 0, 1], ["SENTINEL", 4, 0, 0], ["ESTATE", 2, 3, 1], ["LAIR", 4, 7, 1], ["PENNANT", 1, 5, 1], ["SILENT", 7, 0, 0], ["PIN", 1, 5, 0], ["ANTE", 2, 0, 0], ["LOT", 0, 2, 1], ["PELT", 0, 0, 0]],
    [["ATTIRE", 7, 1, 0], ["SNARE", 3, 6, 1], ["APPRAISER", 3, 0, 0], ["ARREST", 2, 3, 1], ["TRESPASS", 5, 1, 0], ["RISE", 3, 8, 1], ["LIRA", 0, 0, 1], ["LOOT", 0, 0, 0], ["SALE", 0, 7, 1], ["OPAL", 1, 5, 0]],
    [["TREATIES", 0, 6, 1], ["PRESENT", 4, 0, 0], ["RESTORE", 2, 0, 0], ["ORNATE", 6, 1, 0], ["ROSETTE", 0, 2, 0], ["ELITE", 0, 8, 1], ["TRAP", 1, 0, 1], ["STONE", 0, 4, 1], ["SEA", 7, 6, 0], ["EARN", 4, 2, 1]],
    [["STORE", 7, 0, 0], ["PRISONER", 0, 3, 1], ["PISTOL", 0, 3, 0], ["SETTLE", 0, 5, 1], ["TILL", 3, 5, 0], ["SPOIL", 4, 1, 0], ["PLATE", 2, 8, 1], ["SLOT", 4, 1, 1], ["TSAR", 1, 0, 0], ["TIP", 1, 0, 1]],
  ],
};
