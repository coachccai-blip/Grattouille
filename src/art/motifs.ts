// Motifs des cinq lieux (BRIEF.md, section 4.2) : rayures de store, cannage,
// guirlande d'ampoules, capitons en losange, éventails Art déco.
//
// Chaque motif est une tuile SVG répétée en fond d'écran, par-dessus le dégradé du
// lieu. `tile` est le code SVG complet de la tuile (avec xmlns et viewBox), dessiné
// en une ou deux couleurs à faible opacité pour ne jamais gêner la lecture du texte.
// L'écran en fait une image de fond : `url("data:image/svg+xml,…")`.

import { C } from "./kit";

export interface Motif {
  /** Code SVG de la tuile. */
  tile: string;
  /** Taille d'affichage de la tuile, en pixels. */
  width: number;
  height: number;
}

/** Une tuile : le viewBox garde les proportions de la taille d'affichage, pour un raccord sans couture. */
function tuile(width: number, height: number, viewBox: string, dessin: string): Motif {
  return {
    tile: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${dessin}</svg>`,
    width,
    height,
  };
}

/** Des ronds en un seul tracé. */
function ronds(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/**
 * Un éventail Art déco : trois arcs concentriques autour de (cx, cy), arrêtés là où
 * passent les éventails du rang suivant (décalés d'un rayon, un demi-rayon plus bas).
 */
function eventail(cx: number, cy: number): string {
  const arcs: [number, number, number][] = [[24, 20.9, 11.8], [16, 13, 9.33], [8, 6.6, 4.53]];
  const n = (v: number) => +v.toFixed(2);
  return arcs.map(([r, dx, dy]) => `M${n(cx - dx)} ${n(cy - dy)}A${r} ${r} 0 0 1 ${n(cx + dx)} ${n(cy - dy)}`).join("");
}

/** Les éventails qui touchent une tuile de 48 × 24 : un rang tous les 12, décalé de 24 une fois sur deux. */
const RANGS: [number, number][] = [[0, 0], [48, 0], [24, 12], [0, 24], [48, 24], [24, 36], [0, 48], [48, 48]];

/** Identifiants attendus : kiosque, cafe, casino, salon, cercle. */
export const MOTIFS: Record<string, Motif> = {
  // Rayures de store, mimosa et blanc.
  kiosque: tuile(
    64,
    64,
    "0 0 64 64",
    `<rect width="32" height="64" fill="${C.mimosa}" fill-opacity=".18"/>` +
      `<rect x="32" width="32" height="64" fill="${C.blanc}" fill-opacity=".3"/>`,
  ),
  // Cannage : brins doublés à l'horizontale et à la verticale, simples en diagonale.
  cafe: tuile(
    36,
    36,
    "0 0 24 24",
    `<g fill="none" stroke="${C.ivoire}" stroke-opacity=".34">` +
      `<path stroke-width="1.3" d="M-1 2.2H25M-1 21.8H25M2.2 -1V25M21.8 -1V25"/>` +
      `<path stroke-width="1.1" d="M-2 10L14 26M10 -2L26 14M-2 14L14 -2M10 26L26 10"/>` +
      `</g>`,
  ),
  // Guirlandes d'ampoules, un rang sur deux décalé.
  casino: tuile(
    96,
    80,
    "0 0 96 80",
    `<path fill="none" stroke="${C.blanc}" stroke-opacity=".26" stroke-width="1" d="M-96 8Q-48 40 0 8Q48 40 96 8Q144 40 192 8M-48 48Q0 80 48 48Q96 80 144 48"/>` +
      `<path fill="${C.mimosa}" fill-opacity=".5" d="${ronds(3.2, [[12, 20], [36, 28], [60, 28], [84, 20], [12, 68], [36, 60], [60, 60], [84, 68]])}"/>`,
  ),
  // Capitons en losange : les plis du velours et un bouton à chaque croisement.
  salon: tuile(
    48,
    64,
    "0 0 48 64",
    `<path fill="none" stroke="${C.noir}" stroke-opacity=".3" stroke-width="1.6" d="M-3 -4L51 68M51 -4L-3 68M-3 60L3 68M45 -4L51 4M-3 4L3 -4M45 68L51 60"/>` +
      `<path fill="none" stroke="${C.bougClair}" stroke-opacity=".1" stroke-width="1.2" d="M-3 -2L51 70M51 -2L-3 70M45 -2L51 6M-3 6L3 -2"/>` +
      `<path fill="${C.bougClair}" fill-opacity=".16" d="${ronds(3, [[0, 0], [48, 0], [24, 32], [0, 64], [48, 64]])}"/>`,
  ),
  // Éventails Art déco, en écailles.
  cercle: tuile(
    64,
    32,
    "0 0 48 24",
    `<path fill="none" stroke="${C.mimosa}" stroke-opacity=".2" stroke-width="1.1" d="${RANGS.map(([x, y]) => eventail(x, y)).join("")}"/>`,
  ),
};

/** L'image de fond CSS d'un motif. */
export function motifBackground(id: string): string | undefined {
  const m = MOTIFS[id];
  return m ? `url("data:image/svg+xml,${encodeURIComponent(m.tile)}")` : undefined;
}
