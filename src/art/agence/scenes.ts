// Les trente films de l'Agence Carpe Diem : pour chaque expérience, sa scène, sa durée,
// le ciel sur lequel sa carte postale se pose, et ses bruits (LOT4.md, section 13).
// Les scènes elles-mêmes sont rangées par chapitre du catalogue : scenes-port.tsx,
// scenes-voyages.tsx, scenes-folies.tsx, scenes-ciel.tsx.
//
// Ce module n'arrive qu'avec les films (src/screens/agence/films.ts).

import type { SceneArt } from "./kit";
import { SCENES_PORT } from "./scenes-port";

/**
 * Les bruits qu'un film peut demander : ce sont ceux du jeu (src/fx/audio.ts), sous le nom
 * de ce qu'ils racontent ici. Le lecteur (Film.tsx) fait le lien.
 */
export type Son =
  | "mouette" | "oiseau" | "hop" | "ding" | "scintille" | "souffle" | "toc" | "coups" | "roule" | "carillon"
  | "accord" | "gamme" | "grelots" | "glisse" | "degringole" | "halo" | "tendre" | "fanfare" | "clap" | "bravo"
  | "tic" | "clin" | "volette" | "cliquetis" | "frotte" | "declic";

/** Un bruit du film : son instant (en millisecondes après le lever de rideau), son nom, son réglage. */
export type Bruit = readonly [ms: number, son: Son, n?: number];

export interface Scene {
  Art: SceneArt;
  /** La durée du film, en millisecondes : après quoi il se fige en carte postale. De six à dix secondes. */
  duree: number;
  /** Le ciel de la scène, du haut vers le bas : la carte postale se pose dessus. */
  fond: readonly [string, string];
  /** Le haut du cadre de la carte postale, haute de 450. Par défaut 175 : le milieu du dessin. */
  cadre?: number;
  sons?: readonly Bruit[];
}

export const SCENES: Record<string, Scene> = {
  // --- À portée du port
  glace: {
    Art: SCENES_PORT.glace!,
    duree: 7400,
    fond: ["#6FC4EC", "#2C7DA0"],
    sons: [[1160, "toc", 0], [1960, "toc", 1], [2760, "toc", 2], [3500, "ding", 4], [4300, "mouette"], [5080, "hop"]],
  },
  "balade-en-pedalo": {
    Art: SCENES_PORT["balade-en-pedalo"]!,
    duree: 7600,
    fond: ["#A94377", "#33265F"],
    sons: [[900, "tendre"], [3000, "mouette"], [5600, "scintille"]],
  },
  "cerf-volant": {
    Art: SCENES_PORT["cerf-volant"]!,
    duree: 7400,
    fond: ["#4FAEE6", "#2C7DA0"],
    cadre: 190,
    sons: [[300, "souffle"], [2900, "souffle"], [3450, "hop"], [4700, "mouette"], [5600, "carillon"]],
  },
  "pique-nique": {
    Art: SCENES_PORT["pique-nique"]!,
    duree: 8000,
    fond: ["#8FD2EF", "#B88A14"],
    sons: [[1350, "toc", 0], [1650, "toc", 1], [1950, "toc", 2], [2250, "toc", 3], [3700, "tic", 3], [3950, "accord", 1], [4550, "scintille"], [5600, "clin"]],
  },
  plongee: {
    Art: SCENES_PORT.plongee!,
    duree: 8000,
    fond: ["#3AB0D2", "#0E416D"],
    cadre: 215,
    sons: [[500, "glisse"], [1500, "tic", 1], [1900, "tic", 3], [2700, "toc", 0], [3100, "toc", 1], [3500, "toc", 2], [3900, "toc", 3], [4300, "toc", 4], [5900, "clin"]],
  },
  montgolfiere: {
    Art: SCENES_PORT.montgolfiere!,
    duree: 8000,
    fond: ["#B8719F", "#474687"],
    sons: [[500, "souffle"], [2700, "souffle"], [3700, "oiseau"], [5700, "halo"]],
  },
  parachute: {
    Art: SCENES_PORT.parachute!,
    duree: 8000,
    fond: ["#3D95DC", "#1F4E79"],
    cadre: 220,
    sons: [[150, "souffle"], [800, "degringole"], [2200, "souffle"], [3400, "hop"], [5700, "halo"]],
  },
};
