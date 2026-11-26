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
    [["REPOSE", 5, 0, 0], ["RIPPLE", 0, 5, 1], ["PEAR", 2, 0, 1], ["PEPPER", 2, 2, 0], ["LILT", 4, 5, 0], ["POOL", 4, 3, 1], ["LOLLIPOP", 7, 0, 0], ["PATRON", 0, 2, 0], ["ROLL", 2, 7, 1], ["ALE", 0, 3, 1]],
    [["PRATTLE", 0, 5, 1], ["NOTE", 4, 3, 0], ["PINT", 0, 5, 0], ["ANTIPASTO", 2, 0, 0], ["ISLET", 6, 2, 0], ["LINEN", 0, 1, 1], ["OPEN", 2, 8, 1], ["ALTO", 0, 0, 0], ["NET", 0, 7, 1], ["ONION", 0, 3, 1]],
    [["PALATE", 4, 3, 0], ["STOOL", 0, 5, 1], ["APPLE", 3, 3, 1], ["SEAT", 1, 2, 0], ["ROSE", 7, 0, 0], ["STRAINER", 0, 0, 1], ["LOITER", 0, 8, 1], ["ARIA", 3, 0, 0], ["LATTE", 6, 3, 0], ["SAIL", 0, 5, 0]],
    [["PLATE", 0, 4, 1], ["TRELLIS", 4, 2, 0], ["SLEEP", 3, 6, 1], ["POLENTA", 1, 2, 0], ["ATOLL", 3, 2, 1], ["PARASOL", 0, 8, 1], ["PEA", 3, 0, 0], ["PEEL", 6, 5, 0], ["REPRISE", 1, 0, 1], ["SALT", 6, 0, 0]],
    [["APPETITE", 1, 0, 0], ["PARSNIP", 1, 2, 1], ["SERENE", 3, 0, 0], ["ANISE", 5, 1, 0], ["PIANIST", 7, 2, 0], ["ARTIST", 2, 8, 1], ["OAT", 4, 6, 0], ["TILE", 0, 5, 1], ["SEA", 5, 4, 1], ["SALSA", 0, 0, 1]],
    [["PEARL", 2, 6, 1], ["ENTREE", 3, 2, 0], ["OPERA", 1, 2, 1], ["TORTILLA", 0, 4, 1], ["PITA", 7, 1, 0], ["STIR", 0, 3, 0], ["OAR", 4, 0, 0], ["LOTION", 0, 0, 1], ["TIP", 2, 0, 0], ["LOLL", 6, 4, 0]],
    [["PASTEL", 2, 2, 0], ["SOLO", 0, 7, 1], ["ESPRESSO", 0, 1, 0], ["RESPITE", 0, 4, 1], ["SETTEE", 6, 3, 0], ["RAISIN", 4, 0, 0], ["PATIO", 3, 1, 1], ["PIER", 4, 8, 1], ["POT", 7, 0, 0], ["SIP", 0, 2, 1]],
    [["SIREN", 2, 2, 0], ["STRAIT", 2, 2, 1], ["RATTAN", 2, 4, 1], ["LANTERN", 5, 1, 0], ["TONE", 7, 2, 0], ["SIT", 3, 0, 0], ["PENNE", 3, 7, 1], ["ROAST", 0, 0, 1], ["PAN", 0, 6, 1], ["REST", 0, 0, 0]],
    [["SESSION", 1, 0, 1], ["STARTER", 3, 0, 0], ["TASTE", 3, 4, 1], ["POTATOES", 0, 2, 1], ["PARAPET", 0, 2, 0], ["TRIO", 2, 6, 1], ["SLOOP", 5, 4, 0], ["EASEL", 7, 4, 0], ["TOOT", 0, 8, 1], ["PAL", 5, 8, 1]],
    [["TOASTER", 0, 4, 1], ["PLANTER", 2, 2, 0], ["LINER", 6, 0, 0], ["PETAL", 2, 0, 1], ["SIESTA", 0, 0, 0], ["TREAT", 4, 0, 0], ["TERN", 0, 8, 1], ["TRILL", 2, 6, 1], ["PIE", 2, 2, 1], ["EEL", 5, 4, 0]],
  ],
  // L'argent, les coffres, les rois : Sésame.
  tresor: [
    [["TRIPLE", 1, 5, 1], ["SAIL", 3, 3, 0], ["TIPTOE", 6, 0, 0], ["SILENT", 1, 0, 0], ["PIN", 0, 1, 1], ["POT", 4, 0, 1], ["LIEN", 5, 5, 0], ["PENNANT", 0, 8, 1], ["LEASE", 0, 3, 1], ["PILE", 4, 0, 0]],
    [["RAREST", 1, 3, 1], ["ATTEST", 2, 3, 0], ["PORTRAIT", 6, 0, 0], ["SATIN", 0, 5, 1], ["SPENT", 2, 7, 1], ["TRAP", 3, 0, 1], ["POT", 0, 8, 1], ["SLIP", 0, 5, 0], ["PENNIES", 4, 2, 0], ["PEER", 1, 0, 0]],
    [["PROSPER", 0, 1, 1], ["PENSIONER", 5, 0, 0], ["PEARL", 2, 8, 1], ["ASSENT", 3, 0, 0], ["PELT", 0, 1, 0], ["ART", 1, 5, 1], ["NET", 5, 6, 1], ["SENSOR", 2, 3, 1], ["RENT", 7, 3, 0], ["REAP", 2, 5, 0]],
    [["APPARENT", 0, 3, 1], ["RAPIER", 4, 3, 0], ["EARN", 4, 7, 1], ["PISTOL", 7, 0, 0], ["PALATIAL", 0, 0, 0], ["ATTIRE", 0, 1, 1], ["PIRATE", 2, 3, 0], ["LOT", 0, 7, 1], ["ART", 6, 6, 0], ["LIRA", 3, 0, 0]],
    [["SPONSOR", 2, 0, 0], ["ORNATE", 2, 5, 1], ["TIN", 6, 5, 0], ["RETAINER", 4, 0, 0], ["PORTER", 1, 2, 1], ["PRINT", 3, 7, 1], ["ORE", 6, 1, 0], ["TSAR", 1, 0, 1], ["OAR", 0, 6, 1], ["LION", 0, 4, 0]],
    [["TRIAL", 1, 4, 1], ["ATOLL", 5, 1, 0], ["SENATOR", 1, 2, 1], ["TRESPASS", 7, 1, 0], ["TIN", 3, 0, 0], ["NOTARIES", 0, 8, 1], ["ASSET", 1, 0, 0], ["IRON", 0, 5, 0], ["RATE", 0, 6, 1], ["ANTE", 1, 0, 1]],
    [["TALLIES", 7, 2, 0], ["PERIL", 3, 5, 1], ["PINSTRIPE", 5, 0, 0], ["RATIO", 2, 1, 1], ["PORT", 3, 5, 0], ["LAIR", 0, 7, 1], ["STEEL", 0, 3, 0], ["SELL", 0, 3, 1], ["SEA", 5, 3, 1], ["EARL", 3, 0, 0]],
    [["LINEN", 3, 7, 1], ["TRAIL", 3, 3, 0], ["STOLEN", 2, 3, 1], ["TON", 7, 5, 0], ["LOAN", 7, 0, 0], ["ESTATE", 0, 5, 1], ["TINSEL", 2, 0, 1], ["PARTNER", 0, 0, 0], ["TOSS", 2, 0, 0], ["SEAL", 5, 0, 0]],
    [["SENTRIES", 3, 1, 0], ["PRISON", 0, 1, 1], ["LOOT", 0, 4, 1], ["SIRE", 0, 7, 1], ["SPOILS", 0, 0, 0], ["RAISE", 3, 5, 1], ["SESSION", 6, 2, 0], ["STONE", 3, 8, 1], ["TIP", 1, 6, 0], ["NOTE", 3, 3, 1]],
    [["ARSENAL", 0, 2, 0], ["SALARIES", 0, 4, 1], ["OPAL", 2, 1, 0], ["PESETA", 2, 2, 1], ["SPARE", 7, 4, 0], ["LASER", 4, 0, 0], ["ESTATE", 2, 8, 1], ["PATINA", 2, 6, 1], ["ELITE", 3, 0, 1], ["TITLE", 6, 0, 0]],
  ],
};
