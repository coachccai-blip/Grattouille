// Les trente films de l'Agence Carpe Diem : pour chaque expérience, sa scène, sa durée,
// le ciel sur lequel sa carte postale se pose, et ses bruits (LOT4.md, section 13).
// Les scènes elles-mêmes sont rangées par chapitre du catalogue : scenes-port.tsx,
// scenes-voyages.tsx, scenes-folies.tsx, scenes-ciel.tsx.
//
// Ce module n'arrive qu'avec les films (src/screens/agence/films.ts).

import type { SceneArt } from "./kit";
import { SCENES_CIEL } from "./scenes-ciel";
import { SCENES_FOLIES } from "./scenes-folies";
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

  // --- Les folies
  everest: {
    Art: SCENES_FOLIES.everest!,
    duree: 8200,
    fond: ["#2A68BC", "#7DB6E7"],
    cadre: 150,
    sons: [[700, "toc", 0], [1400, "toc", 1], [2100, "toc", 2], [2800, "toc", 3], [3500, "toc", 4], [4200, "toc", 5], [5900, "fanfare"]],
  },
  "ile-deserte": {
    Art: SCENES_FOLIES["ile-deserte"]!,
    duree: 8400,
    fond: ["#3BB3E7", "#2BB5C6"],
    cadre: 220,
    sons: [[500, "mouette"], [1560, "toc", 1], [2300, "ding", 5], [2700, "ding", 5], [3300, "glisse"], [4800, "toc", 2], [5300, "toc", 3], [5950, "accord", 1], [6900, "clin"]],
  },
  train: {
    Art: SCENES_FOLIES.train!,
    duree: 8200,
    fond: ["#74499A", "#252562"],
    cadre: 250,
    sons: [[300, "cliquetis"], [1500, "cliquetis"], [2700, "souffle"], [4700, "ding", 3], [5700, "tendre"]],
  },
  film: {
    Art: SCENES_FOLIES.film!,
    duree: 8400,
    fond: ["#7A1F35", "#3A0F1C"],
    cadre: 190,
    sons: [[800, "clap"], [1700, "roule"], [3900, "declic"], [4500, "declic"], [5100, "declic"], [5700, "fanfare"], [6700, "bravo"]],
  },
  abysses: {
    Art: SCENES_FOLIES.abysses!,
    duree: 9200,
    fond: ["#0A3663", "#030B1E"],
    cadre: 215,
    sons: [[300, "glisse"], [1300, "tic", 1], [2100, "tic", 3], [2900, "tic", 0], [4000, "halo"], [6000, "coups"], [7000, "scintille"], [7900, "clin"]],
  },
  parc: {
    Art: SCENES_FOLIES.parc!,
    duree: 8400,
    fond: ["#35206D", "#17113F"],
    cadre: 200,
    sons: [[300, "cliquetis"], [1500, "souffle"], [3200, "souffle"], [4800, "souffle"], [6900, "gamme", 6]],
  },

  // --- Plus haut que le ciel
  apesanteur: {
    Art: SCENES_CIEL.apesanteur!,
    duree: 8000,
    fond: ["#B8C6D6", "#6F859E"],
    cadre: 160,
    sons: [[1400, "ding", 5], [1900, "halo"], [3600, "carillon"], [5000, "tendre"]],
  },
  orbite: {
    Art: SCENES_CIEL.orbite!,
    duree: 8400,
    fond: ["#1A2867", "#050818"],
    cadre: 190,
    sons: [[500, "halo"], [2700, "ding", 2], [5000, "ding", 4], [7300, "ding", 6]],
  },
  "feu-artifice": {
    Art: SCENES_CIEL["feu-artifice"]!,
    duree: 8400,
    fond: ["#1A2867", "#050818"],
    cadre: 150,
    sons: [[800, "souffle"], [1300, "gamme", 4], [2100, "accord", 0], [2900, "gamme", 5], [3700, "accord", 1], [4300, "accord", 2], [5100, "fanfare"], [6300, "bravo"]],
  },
  "tour-de-lune": {
    Art: SCENES_CIEL["tour-de-lune"]!,
    duree: 8400,
    fond: ["#1A2867", "#050818"],
    cadre: 215,
    sons: [[300, "souffle"], [2200, "halo"], [3600, "clin"], [4600, "tendre"], [7000, "carillon"]],
  },
  "pas-sur-la-lune": {
    Art: SCENES_CIEL["pas-sur-la-lune"]!,
    duree: 8600,
    fond: ["#1A2867", "#050818"],
    cadre: 215,
    sons: [[1500, "toc", 0], [2650, "coups"], [3800, "coups"], [4950, "coups"], [6100, "coups"], [6400, "fanfare"]],
  },
  "soiree-lune": {
    Art: SCENES_CIEL["soiree-lune"]!,
    duree: 8800,
    fond: ["#3E2A7C", "#120A36"],
    cadre: 284,
    sons: [
      [500, "accord", 0], [1020, "toc", 2], [1540, "accord", 1], [2060, "toc", 4], [2580, "accord", 2], [3100, "toc", 2], [3620, "accord", 1],
      [4140, "toc", 4], [4660, "accord", 2], [5180, "toc", 5], [5700, "gamme", 6], [7000, "bravo"],
    ],
  },
  mars: {
    Art: SCENES_CIEL.mars!,
    duree: 8400,
    fond: ["#D5814F", "#8A3A20"],
    cadre: 250,
    sons: [[1300, "toc", 0], [1750, "toc", 0], [2200, "toc", 0], [3350, "clin"], [5000, "frotte"], [6000, "roule"], [6900, "clin"]],
  },
  saturne: {
    Art: SCENES_CIEL.saturne!,
    duree: 8400,
    fond: ["#35245F", "#0B0728"],
    cadre: 190,
    sons: [[400, "souffle"], [1800, "glisse"], [3300, "souffle"], [4800, "hop"], [6600, "halo"]],
  },
  "dos-de-comete": {
    Art: SCENES_CIEL["dos-de-comete"]!,
    duree: 8400,
    fond: ["#22306E", "#060A22"],
    cadre: 200,
    sons: [[300, "souffle"], [1500, "grelots"], [2800, "souffle"], [4200, "scintille"], [5400, "gamme", 7], [6800, "halo"]],
  },
};
