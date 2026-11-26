// Grilles de mots croisés du moteur `mots`.
//
// Fichier produit par un générateur (recherche aléatoire, puis contrôles) et relu à la
// main. Chaque grille : 10 mots entrecroisés dans 9 colonnes sur 8 rangées au plus,
// écrits avec les 10 lettres de ALPHABET seulement. Pour chaque nombre de mots de 0 à
// 10, il existe un jeu de lettres à cacher qui laisse exactement ce nombre de mots
// complets : c'est ce qui permet à une grille de porter n'importe quel lot.
//
// Un mot : [texte, rangée, colonne, sens] ; sens 0 = horizontal, 1 = vertical.

/** Les dix lettres avec lesquelles tous les mots sont écrits. */
export const ALPHABET = "AEILNOPRST";

/** Les seize autres : des lettres qui ne servent à rien, pour compléter un tirage. */
export const LETTRES_MORTES = "BCDFGHJKMQUVWXYZ";

export type MotPose = readonly [text: string, row: number, col: number, dir: 0 | 1];
export type Grille = readonly MotPose[];

export const GRILLES: Record<string, readonly Grille[]> = {
  // Le café, la plage, la table : La Grille du Jour.
  terrasse: [
    [["TASSE", 4, 0, 0], ["PLAISIR", 0, 2, 1], ["PISTE", 0, 2, 0], ["SIRENE", 6, 0, 0], ["ENTREE", 0, 6, 1], ["PATIO", 2, 4, 0], ["ROSEE", 1, 8, 1], ["PIE", 2, 4, 1], ["ETE", 4, 6, 0], ["SPA", 2, 0, 0]],
    [["NAPPE", 2, 4, 0], ["PETALE", 2, 6, 1], ["SOLE", 6, 4, 0], ["ANE", 1, 4, 1], ["PLIE", 3, 1, 0], ["PATE", 3, 1, 1], ["OPERA", 1, 0, 0], ["OIE", 0, 8, 1], ["ALTO", 0, 5, 0], ["ETE", 5, 0, 0]],
    [["POISSON", 2, 0, 0], ["PINTE", 0, 6, 1], ["PANINI", 2, 0, 1], ["LAPIN", 0, 4, 0], ["PIE", 4, 4, 0], ["LAITON", 0, 2, 1], ["ILE", 4, 5, 1], ["REPAS", 6, 4, 0], ["NAPPE", 0, 8, 1], ["SEL", 0, 0, 0]],
    [["ENTREE", 5, 0, 0], ["ALTO", 3, 2, 1], ["LAIT", 3, 1, 0], ["ETE", 5, 5, 1], ["PLAT", 0, 4, 1], ["PAIN", 0, 4, 0], ["SIESTE", 7, 3, 0], ["ILE", 0, 6, 1], ["ARTISTE", 1, 8, 1], ["ANE", 2, 4, 0]],
    [["TOILE", 7, 1, 0], ["LIESSE", 2, 5, 1], ["ENTREE", 4, 0, 0], ["POIRE", 0, 0, 1], ["ILE", 2, 0, 0], ["PAPIER", 0, 0, 0], ["SPA", 6, 5, 0], ["OPERA", 2, 7, 1], ["ROTI", 4, 3, 1], ["PIE", 0, 2, 1]],
    [["SIROP", 3, 4, 0], ["POIRE", 0, 6, 1], ["LIESSE", 0, 4, 1], ["ASTRE", 2, 0, 0], ["PIANISTE", 0, 0, 1], ["TRIO", 2, 2, 1], ["OPERA", 2, 8, 1], ["SEL", 0, 2, 0], ["ETE", 7, 0, 0], ["OIE", 5, 2, 0]],
    [["LIESSE", 4, 1, 0], ["ARTISTE", 0, 5, 1], ["PASTEL", 0, 3, 1], ["PERLE", 6, 4, 0], ["ANIS", 2, 0, 0], ["SPA", 0, 0, 1], ["ENTREE", 1, 8, 1], ["LAIT", 4, 1, 1], ["PIE", 6, 0, 0], ["ROSE", 1, 5, 0]],
    [["SIROP", 4, 4, 0], ["ATELIER", 0, 5, 1], ["TARTE", 0, 4, 0], ["PERLE", 2, 1, 0], ["PETALE", 2, 1, 1], ["TENOR", 7, 0, 0], ["ANE", 5, 1, 0], ["PORT", 4, 8, 1], ["PIE", 0, 2, 1], ["ETE", 0, 8, 1]],
    [["ETOILE", 4, 1, 0], ["TARTE", 0, 1, 1], ["PATE", 1, 6, 1], ["ILE", 4, 4, 1], ["TAPAS", 1, 4, 0], ["SOPRANO", 1, 8, 1], ["POIRE", 6, 0, 0], ["TRIO", 4, 2, 1], ["ETE", 0, 0, 0], ["ALTO", 7, 5, 0]],
    [["PINTE", 5, 0, 0], ["PISTE", 1, 4, 1], ["NOISETTE", 3, 1, 0], ["OLE", 1, 8, 1], ["TAPAS", 3, 6, 1], ["ESPRESSO", 7, 0, 0], ["ALTO", 0, 2, 1], ["PATIO", 1, 4, 0], ["PLAT", 0, 0, 0], ["PIE", 5, 0, 1]],
  ],
  // L'argent, les coffres, les rois : Sésame.
  tresor: [
    [["TIRELIRE", 4, 0, 0], ["ROI", 4, 6, 1], ["OPERA", 1, 2, 1], ["LIRE", 4, 4, 1], ["SOIE", 1, 7, 1], ["RATIO", 2, 0, 1], ["REINE", 6, 4, 0], ["PRET", 2, 2, 0], ["LOT", 0, 5, 1], ["NOTE", 7, 1, 0]],
    [["ROSETTE", 4, 2, 0], ["PISTOLE", 1, 6, 1], ["LAINE", 7, 2, 0], ["TIARE", 0, 8, 1], ["LIASSE", 0, 4, 1], ["STELE", 0, 1, 0], ["LIRE", 2, 2, 1], ["ROI", 3, 0, 0], ["PARTS", 1, 0, 1], ["LOT", 6, 6, 0]],
    [["TITRE", 4, 0, 0], ["PORTE", 1, 2, 1], ["ROSETTE", 0, 0, 1], ["TRESOR", 2, 4, 1], ["ARENE", 7, 3, 0], ["LIRE", 4, 7, 1], ["ROI", 3, 4, 0], ["SATIN", 5, 4, 0], ["PARI", 0, 6, 1], ["TAPIS", 0, 4, 0]],
    [["OSEILLE", 6, 2, 0], ["SERIE", 2, 8, 1], ["TRESORIER", 4, 0, 0], ["STELE", 0, 2, 1], ["RATIO", 1, 0, 0], ["RENTE", 1, 0, 1], ["LOT", 0, 4, 1], ["LIRE", 0, 4, 0], ["TAPIS", 2, 4, 0], ["RIPAILLE", 0, 6, 1]],
    [["RENTIER", 5, 0, 0], ["ASSIETTE", 0, 3, 1], ["PATENTE", 0, 2, 0], ["ARENE", 3, 5, 1], ["PARI", 3, 0, 0], ["ENTREE", 0, 8, 1], ["INTERET", 7, 0, 0], ["OPALE", 1, 1, 1], ["LOT", 2, 6, 0], ["ROI", 5, 0, 1]],
    [["RENTIER", 5, 2, 0], ["SONATE", 0, 3, 1], ["TIARE", 2, 8, 1], ["TONNE", 2, 0, 0], ["SATIN", 2, 6, 1], ["PARI", 3, 5, 0], ["RATIO", 0, 0, 1], ["ESPOIR", 0, 2, 0], ["ROI", 5, 2, 1], ["LIRE", 7, 1, 0]],
    [["RELIRE", 3, 3, 0], ["TITRE", 0, 3, 1], ["TRESOR", 2, 7, 1], ["TIARE", 7, 4, 0], ["PATENTE", 0, 1, 0], ["PORTRAIT", 0, 1, 1], ["PRISE", 5, 4, 0], ["ROI", 5, 5, 1], ["LIRE", 6, 0, 0], ["PRET", 2, 0, 0]],
    [["POSTE", 0, 4, 0], ["PIRATE", 0, 4, 1], ["PIASTRE", 4, 0, 0], ["RATIO", 2, 4, 0], ["PIANO", 3, 1, 1], ["OPALE", 2, 8, 1], ["NOTE", 6, 5, 0], ["TRESOR", 2, 6, 1], ["PORTE", 7, 0, 0], ["ROI", 1, 2, 0]],
    [["OSEILLE", 4, 2, 0], ["TIROIR", 1, 2, 1], ["INTERET", 2, 2, 0], ["ENTREE", 0, 4, 1], ["PEPITE", 0, 3, 0], ["ROI", 5, 0, 0], ["LIRE", 4, 6, 1], ["PORTE", 3, 0, 1], ["PESETA", 7, 3, 0], ["LOT", 1, 0, 0]],
    [["PIASTRE", 5, 0, 0], ["SONATE", 0, 6, 1], ["SERIE", 2, 1, 1], ["LIASSE", 1, 3, 1], ["LOT", 1, 5, 0], ["SOIE", 2, 1, 0], ["ROI", 5, 5, 1], ["PARI", 3, 5, 0], ["TITRE", 7, 4, 0], ["LIRE", 2, 8, 1]],
  ],
};
