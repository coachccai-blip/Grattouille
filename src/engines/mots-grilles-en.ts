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
    [["TASTER", 3, 2, 0], ["APRON", 3, 3, 1], ["PAINT", 7, 0, 0], ["NAP", 5, 0, 1], ["SIRLOIN", 1, 7, 1], ["PASTRIES", 1, 0, 0], ["TOOT", 3, 5, 1], ["TAN", 0, 1, 1], ["TRIO", 5, 2, 0], ["IRIS", 0, 4, 1]],
    [["ESPRESSO", 2, 0, 0], ["RIPPLE", 2, 3, 1], ["LISTEN", 0, 6, 1], ["SALT", 6, 1, 0], ["TRILL", 0, 2, 0], ["TRIP", 4, 0, 0], ["SIESTA", 0, 0, 1], ["TERN", 4, 5, 0], ["TIP", 0, 2, 1], ["INLET", 3, 8, 1]],
    [["STROLL", 0, 2, 1], ["LANTERN", 5, 2, 0], ["ALE", 5, 3, 1], ["SNAPPER", 0, 6, 1], ["LOTION", 0, 4, 1], ["TILE", 7, 0, 0], ["EASEL", 0, 0, 0], ["TENOR", 3, 8, 1], ["REST", 4, 0, 1], ["RATTAN", 2, 2, 0]],
    [["OTTER", 0, 4, 1], ["OPEN", 0, 4, 0], ["ROAST", 2, 0, 0], ["PARAPET", 1, 2, 1], ["PORPOISE", 0, 0, 1], ["SLEEP", 6, 0, 0], ["NOTE", 0, 7, 1], ["EASE", 3, 4, 0], ["SEAL", 3, 6, 1], ["EAT", 5, 5, 0]],
    [["TORTE", 3, 6, 1], ["LENTIL", 3, 3, 0], ["TRELLIS", 0, 3, 1], ["NOON", 0, 5, 1], ["SITAR", 5, 2, 0], ["PIER", 1, 0, 0], ["PEEL", 7, 4, 0], ["LILT", 1, 8, 1], ["PENNE", 1, 0, 1], ["TONE", 0, 3, 0]],
    [["PATRON", 1, 8, 1], ["APPETISER", 4, 0, 0], ["SONATA", 0, 4, 1], ["PAL", 4, 1, 1], ["PARSNIP", 0, 1, 0], ["SIREN", 2, 0, 0], ["PASTA", 2, 6, 1], ["SPA", 2, 0, 1], ["NAAN", 6, 5, 0], ["PEA", 2, 6, 0]],
    [["SOPRANO", 0, 6, 1], ["SEA", 0, 6, 0], ["LOLLIPOP", 6, 0, 0], ["ARTIST", 0, 8, 1], ["PATIO", 1, 2, 0], ["ATOLL", 0, 4, 1], ["PAELLA", 4, 1, 0], ["EEL", 4, 3, 1], ["PITA", 1, 2, 1], ["POT", 2, 6, 0]],
    [["STOOL", 0, 7, 1], ["PASTEL", 4, 2, 0], ["POTATOES", 0, 5, 1], ["SETTEE", 6, 0, 0], ["PINT", 2, 2, 0], ["SALSA", 3, 0, 1], ["TAPAS", 0, 3, 0], ["STIR", 7, 5, 0], ["OAR", 5, 8, 1], ["ALTO", 4, 3, 1]],
    [["OPERA", 5, 0, 0], ["POOL", 3, 0, 1], ["PARASAIL", 0, 4, 1], ["ROLL", 7, 1, 0], ["STRAIT", 2, 2, 0], ["ENTREE", 0, 7, 1], ["ROSE", 0, 2, 1], ["SOLE", 4, 4, 0], ["REPOSE", 0, 2, 0], ["PIE", 3, 0, 0]],
    [["PANINI", 0, 4, 1], ["RIPE", 3, 3, 0], ["PIANIST", 5, 0, 0], ["SPRAT", 0, 3, 0], ["NAP", 3, 0, 1], ["SEAT", 2, 6, 1], ["SIP", 5, 5, 1], ["TEASPOON", 7, 1, 0], ["TALE", 4, 2, 1], ["PORTION", 1, 8, 1]],
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
