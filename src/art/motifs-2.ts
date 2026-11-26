// Motifs des trois lieux d'après minuit.
//
// Même contrat que motifs.ts (à lire d'abord) : une tuile SVG répétée en fond d'écran,
// par-dessus le dégradé du lieu, en une ou deux couleurs à faible opacité.
//
// Identifiants attendus : yacht, banque, lune.

import { C } from "./kit";
import type { Motif } from "./motifs";

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

/** Des étoiles à quatre branches en un seul tracé : [x, y, rayon]. */
function etoiles(points: [number, number, number][]): string {
  return points
    .map(([x, y, r]) => {
      const q = +(r * 0.26).toFixed(2);
      return `M${x} ${y - r}L${x + q} ${y - q}L${x + r} ${y}L${x + q} ${y + q}L${x} ${y + r}L${x - q} ${y + q}L${x - r} ${y}L${x - q} ${y - q}Z`;
    })
    .join("");
}

/** Les centres des hublots d'une tuile de 72 × 72, en quinconce : les quatre coins et le milieu. */
const HUBLOTS: [number, number][] = [[0, 0], [72, 0], [36, 36], [0, 72], [72, 72]];

/** Les quatre boulons d'un hublot, sur ses diagonales. */
const boulons = ([x, y]: [number, number]): [number, number][] => [[x - 6.4, y - 6.4], [x + 6.4, y - 6.4], [x + 6.4, y + 6.4], [x - 6.4, y + 6.4]];

/** Deux vaguelettes superposées, centrées sur (x, y). */
const vaguelettes = (x: number, y: number) => `M${x - 12} ${y - 2.5}q6 -6 12 0t12 0M${x - 12} ${y + 4.5}q6 -6 12 0t12 0`;

/**
 * Une tresse de guilloche sur une tuile de 60 de large : deux ondes de 30 de période qui
 * se croisent tous les 15, d'amplitude `a`, décalées de `dx`.
 */
const tresse = (y: number, a: number, dx: number) =>
  [-2 * a, 2 * a].map((c) => `M${dx - 15} ${y}q7.5 ${c} 15 0${"t15 0".repeat(5)}`).join("");

/** Identifiants attendus : yacht, banque, lune. */
export const MOTIFS_2: Record<string, Motif> = {
  // Hublots boulonnés en quinconce, et des vaguelettes entre deux.
  yacht: tuile(
    72,
    72,
    "0 0 72 72",
    `<path fill="none" stroke="${C.ciel}" stroke-opacity=".17" stroke-width="1.5" d="${ronds(9, HUBLOTS)}"/>` +
      `<path fill="none" stroke="${C.ciel}" stroke-opacity=".1" stroke-width="1" d="${ronds(5.4, HUBLOTS)}"/>` +
      `<path fill="${C.ciel}" fill-opacity=".2" d="${ronds(1.1, HUBLOTS.flatMap(boulons))}"/>` +
      `<path fill="none" stroke="${C.blanc}" stroke-opacity=".13" stroke-width="1.3" stroke-linecap="round" d="${vaguelettes(36, 0)}${vaguelettes(36, 72)}${vaguelettes(0, 36)}${vaguelettes(72, 36)}"/>`,
  ),
  // Guilloche de billet de banque : deux tresses d'ondes, un rivet à chaque croisement, un filet entre les rangs.
  banque: tuile(
    60,
    44,
    "0 0 60 44",
    `<path fill="none" stroke="${C.paille}" stroke-opacity=".2" stroke-width="1" d="${tresse(11, 8, 0)}${tresse(33, 8, 7.5)}"/>` +
      `<path fill="none" stroke="${C.paille}" stroke-opacity=".12" stroke-width="1" d="${tresse(11, 4, 7.5)}${tresse(33, 4, 0)}M0 0H60M0 22H60M0 44H60"/>` +
      `<path fill="${C.paille}" fill-opacity=".24" d="${ronds(1.5, [[0, 11], [15, 11], [30, 11], [45, 11], [60, 11], [7.5, 33], [22.5, 33], [37.5, 33], [52.5, 33]])}"/>`,
  ),
  // Semis d'étoiles et petits cratères vus d'en haut : un anneau, et le reflet de son rebord en bas à droite.
  lune: tuile(
    120,
    120,
    "0 0 120 120",
    `<path fill="${C.lilas}" fill-opacity=".3" d="${etoiles([[22, 26, 5], [84, 14, 3], [100, 70, 6], [40, 92, 3.5], [64, 52, 2.5]])}"/>` +
      `<path fill="${C.blanc}" fill-opacity=".22" d="${ronds(1, [[58, 18], [110, 36], [12, 106], [72, 86], [8, 60], [48, 66]])}"/>` +
      `<path fill="none" stroke="${C.lilas}" stroke-opacity=".2" stroke-width="1.3" d="${ronds(8.5, [[88, 104]])}${ronds(5.5, [[30, 58]])}"/>` +
      `<path fill="none" stroke="${C.lilas}" stroke-opacity=".13" stroke-width="1.3" stroke-linecap="round" d="M93.7 103A5.8 5.8 0 0 1 87 109.7M33.4 57.4A3.5 3.5 0 0 1 29.4 61.4"/>`,
  ),
};
