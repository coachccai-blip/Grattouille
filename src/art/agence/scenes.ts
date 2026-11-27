// Les trente films de l'Agence Carpe Diem : pour chaque expérience, sa scène, sa durée,
// le ciel sur lequel sa carte postale se pose, et ses bruits (LOT4.md, section 13).
// Les scènes elles-mêmes sont rangées par chapitre du catalogue : scenes-port.tsx,
// scenes-voyages.tsx, scenes-folies.tsx, scenes-ciel.tsx.
//
// Ce module n'arrive qu'avec les films (src/screens/agence/films.ts).

import type { SceneArt } from "./kit";
import { SCENES_PORT } from "./scenes-port";
import { SCENES_VOYAGES } from "./scenes-voyages";

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
    cadre: 184,
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

  // --- Les grands voyages
  australie: {
    Art: SCENES_VOYAGES.australie!,
    duree: 8000,
    fond: ["#E36F3A", "#8F3622"],
    cadre: 195,
    sons: [[300, "souffle"], [1500, "toc", 0], [2100, "toc", 2], [2700, "toc", 4], [3300, "toc", 1], [3900, "toc", 3], [4500, "toc", 5], [5600, "oiseau"]],
  },
  "japon-coree": {
    Art: SCENES_VOYAGES["japon-coree"]!,
    duree: 8000,
    fond: ["#F2B8CC", "#8E9AC9"],
    cadre: 185,
    sons: [[700, "carillon"], [1300, "souffle"], [3600, "ding", 2], [4600, "carillon"], [5600, "ding", 5]],
  },
  safari: {
    Art: SCENES_VOYAGES.safari!,
    duree: 7600,
    fond: ["#EE8F3F", "#7A3A1E"],
    cadre: 205,
    sons: [[400, "souffle"], [2700, "declic"], [3600, "declic"], [4500, "hop"], [5600, "clin"]],
  },
  aurores: {
    Art: SCENES_VOYAGES.aurores!,
    duree: 8400,
    fond: ["#102C5C", "#081535"],
    cadre: 215,
    sons: [[800, "halo"], [2300, "scintille"], [3200, "carillon"], [4700, "halo"], [6200, "carillon"]],
  },
  transatlantique: {
    Art: SCENES_VOYAGES.transatlantique!,
    duree: 8600,
    fond: ["#57AEE4", "#1B5A7A"],
    sons: [[500, "mouette"], [2300, "souffle"], [3250, "coups"], [4050, "coups"], [5300, "halo"], [6600, "carillon"]],
  },
  "tour-du-monde": {
    Art: SCENES_VOYAGES["tour-du-monde"]!,
    duree: 8800,
    fond: ["#2A58A2", "#18245F"],
    cadre: 215,
    sons: [[300, "souffle"], [1250, "toc", 0], [2250, "toc", 1], [3250, "toc", 2], [4250, "toc", 3], [5250, "toc", 4], [7000, "gamme", 6]],
  },
  antarctique: {
    Art: SCENES_VOYAGES.antarctique!,
    duree: 8600,
    fond: ["#A5D3EC", "#2E6F8E"],
    cadre: 235,
    sons: [[1300, "toc", 0], [2000, "toc", 2], [2700, "glisse"], [3000, "toc", 1], [3500, "toc", 3], [4000, "toc", 4], [4500, "toc", 5], [5200, "oiseau"], [6800, "bravo"]],
  },
};
