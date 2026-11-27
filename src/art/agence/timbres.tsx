// Les timbres de l'Agence Carpe Diem : un par expérience de vie (LOT4.md, section 13).
// C'est la vignette de chaque expérience, dans le catalogue, sur sa fiche et sur la carte
// postale qu'on en rapporte. Vécue, elle est oblitérée.
//
// Même style que le reste (../kit.tsx) : papier découpé à la gouache, aplats sans contour,
// peu de formes, peu de couleurs. Un timbre se lit à 52 px de large : une seule idée par
// image, comme sur une étiquette de valise. viewBox 0 0 60 72 ; l'image tient dans le
// cadre de 50 × 62 posé en (5, 5), fond compris. Aucun texte dans les dessins.

import type { ReactNode } from "react";
import { C, METAL, Svg, shade, type ArtProps } from "../kit";

/** Des petits ronds en un seul tracé : bulles, étoiles lointaines, pois. */
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

/** Le bord dentelé d'un timbre de `l` × `h` : une dent tous les `pas`, des trous de rayon `r`. */
function dentele(l: number, h: number, pas: number, r: number): string {
  const nx = Math.round(l / pas);
  const ny = Math.round(h / pas);
  const cx = (i: number) => +((i + 0.5) * (l / nx)).toFixed(2);
  const cy = (i: number) => +((i + 0.5) * (h / ny)).toFixed(2);
  let d = "M0 0";
  for (let i = 0; i < nx; i++) d += `H${cx(i) - r}a${r} ${r} 0 0 0 ${2 * r} 0`;
  d += `H${l}`;
  for (let i = 0; i < ny; i++) d += `V${cy(i) - r}a${r} ${r} 0 0 0 0 ${2 * r}`;
  d += `V${h}`;
  for (let i = nx - 1; i >= 0; i--) d += `H${cx(i) + r}a${r} ${r} 0 0 0 ${-2 * r} 0`;
  d += "H0";
  for (let i = ny - 1; i >= 0; i--) d += `V${cy(i) + r}a${r} ${r} 0 0 0 0 ${-2 * r}`;
  return `${d}Z`;
}

const PAPIER = dentele(60, 72, 6, 1.7);

/** Quelques teintes de ciel et de nuit que la palette n'a pas. */
const AUBE = "#F9C9B6";
const COUCHANT = "#F6A35C";
const ESPACE = "#141B45";
const ABYSSE = "#07182F";
const MARS = "#E9A56B";

interface Image {
  /** Le fond du timbre : un ciel, une mer, une nuit. */
  fond: string;
  dessin: ReactNode;
}

/** Les trente images, dans le cadre de 50 × 62. */
const IMAGES: Record<string, Image> = {
  // --- À portée du port
  glace: {
    fond: C.ciel,
    dessin: (
      <>
        <rect y="42" width="50" height="20" fill={C.mer} />
        <path d="M0 46H12L16 44L20 46H50V48H0Z" fill={shade(C.mer, 0.25)} />
        <path d="M17 34H33L25 58Z" fill={C.paille} />
        <path d="M25 34H33L25 58Z" fill={shade(C.paille, -0.18)} />
        <circle cx="25" cy="30" r="8.5" fill={C.bougClair} />
        <circle cx="25" cy="19.5" r="7.5" fill={C.creme} />
        <circle cx="25" cy="10.5" r="6" fill={C.persClair} />
        <circle cx="25" cy="4.5" r="2.2" fill={C.cerise} />
      </>
    ),
  },
  "balade-en-pedalo": {
    fond: COUCHANT,
    dessin: (
      <>
        <circle cx="25" cy="38" r="13" fill={C.mimosa} />
        <rect y="38" width="50" height="24" fill="#B4527F" />
        <path d="M17 42H33V44H17ZM20 47H30V49H20ZM22.5 52H27.5V54H22.5Z" fill={C.mimosa} />
        <path d="M8 44H40L36 52H12Z" fill={C.blanc} />
        <path d="M34 45Q39 34 33 30Q29 29 29 33" fill="none" stroke={C.blanc} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M28.5 32.5L24 34.5L29 35.5Z" fill={C.corail} />
        <path d="M12 52H36L37.2 49.5H10.8Z" fill={C.cerise} />
      </>
    ),
  },
  "cerf-volant": {
    fond: C.ciel,
    dessin: (
      <>
        <path d={ronds(5, [[9, 50], [16, 47]]) + ronds(4, [[23, 51]]) + "M9 50H23V55H9Z"} fill={C.blanc} />
        <path d="M27 6L41 24L27 44L13 24Z" fill={C.bougainvillier} />
        <path d="M27 6L41 24H13Z" fill={C.mimosa} />
        <path d="M27 6V44M13 24H41" fill="none" stroke={C.nuit} strokeWidth="1" />
        <path d="M27 44Q22 50 29 53Q36 56 32 61" fill="none" stroke={C.nuit} strokeWidth="1.1" />
        <path d="M23 47.5L28 50.5L23.5 52ZM34 53.5L29.5 56.5L35 57.5Z" fill={C.cerise} />
      </>
    ),
  },
  "pique-nique": {
    fond: C.sable,
    dessin: (
      <>
        <rect y="42" width="50" height="20" fill={C.blanc} />
        <path d="M0 42H10V52H0ZM20 42H30V52H20ZM40 42H50V52H40ZM10 52H20V62H10ZM30 52H40V62H30Z" fill={C.cerise} />
        <path d="M10 39A15 15 0 0 1 40 39Z" fill={METAL.argent} />
        <circle cx="25" cy="22" r="2.8" fill={METAL.argent} />
        <rect x="6" y="38.5" width="38" height="3.5" rx="1.7" fill={C.gris} />
        <path d="M15 34A11 11 0 0 1 22 27" fill="none" stroke={C.blanc} strokeWidth="2" strokeLinecap="round" />
        <path d={etoiles([[40, 14, 5], [9, 20, 3]])} fill={C.blanc} />
      </>
    ),
  },
  plongee: {
    fond: C.mer,
    dessin: (
      <>
        <path d="M0 0H50V10Q38 14 25 10Q12 6 0 10Z" fill={shade(C.mer, 0.3)} />
        <path d="M36 31L47 23V41Z" fill={C.corail} />
        <ellipse cx="23" cy="32" rx="16" ry="11" fill={C.corail} />
        <path d="M13 23Q17 32 13 41Q10.5 37 10 32Q10.5 27 13 23ZM24 21.2Q29 32 24 42.8Q28 42 31.5 40Q35 32 31.5 24Q28 22 24 21.2Z" fill={C.blanc} />
        <circle cx="13.5" cy="29.5" r="2" fill={C.nuit} />
        <path d={ronds(2.6, [[8, 17]]) + ronds(1.7, [[13, 11], [41, 50]]) + ronds(1.2, [[5, 9]])} fill={C.blanc} fillOpacity="0.75" />
        <path d="M4 62Q6 50 10 52Q11 46 16 50Q18 56 18 62Z" fill={C.bougClair} />
      </>
    ),
  },
  montgolfiere: {
    fond: AUBE,
    dessin: (
      <>
        <path d="M0 62V52Q10 46 22 51Q36 44 50 50V62Z" fill={C.lilas} />
        <path d="M25 4C38 4 44 14 44 23C44 33 34 38 31 45H19C16 38 6 33 6 23C6 14 12 4 25 4Z" fill={C.bougainvillier} />
        <path d="M25 4C31 9 33 17 33 24C33 33 29 39 28 45H22C21 39 17 33 17 24C17 17 19 9 25 4Z" fill={C.mimosa} />
        <path d="M19 45H31V47.5H19Z" fill={C.bougFonce} />
        <path d="M20.5 47.5L22 53M29.5 47.5L28 53" fill="none" stroke={C.boisFonce} strokeWidth="1" />
        <rect x="20.5" y="53" width="9" height="6" rx="1" fill={C.bois} />
      </>
    ),
  },
  parachute: {
    fond: C.azur,
    dessin: (
      <>
        <path d={ronds(5, [[36, 55], [43, 52]]) + "M36 55H43V60H36Z"} fill={C.blanc} />
        <path d="M6 26A19 19 0 0 1 44 26Q37.7 21.5 31.3 26Q25 21.5 18.7 26Q12.3 21.5 6 26Z" fill={C.cerise} />
        <path d="M25 7Q32 12 31.3 26Q25 21.5 18.7 26Q18 12 25 7Z" fill={C.blanc} />
        <path d="M6 26L23 44M18.7 26L24 44M31.3 26L26 44M44 26L27 44" fill="none" stroke={C.nuit} strokeWidth="0.8" />
        <circle cx="25" cy="44" r="3.5" fill={C.mimosa} />
        <path d="M21.5 48H28.5L27 56H23Z" fill={C.nuit} />
      </>
    ),
  },

  // --- Les grands voyages
  australie: {
    fond: COUCHANT,
    dessin: (
      <>
        <circle cx="36" cy="16" r="9" fill={C.mimosa} />
        <path d="M2 40Q6 29 16 28H36Q45 30 48 40Z" fill={C.brique} />
        <path d="M36 28Q45 30 48 40H38Q40 33 36 28Z" fill={shade(C.brique, -0.2)} />
        <rect y="40" width="50" height="22" fill={C.terracotta} />
        {/* Le kangourou, en plein bond */}
        <path d="M30 37Q33 36 34 38.5L36 44Q41 46 41.5 51L44 58H40.5L38 52.5L33 55L36 58H31.5L27.5 53Q22 52 19 47Q14 49 8 56Q9 48 17.5 43.5Q21 39 27 39.5L29 37.5L28 33L30.5 35.5L31.5 32.5L32.5 36Z" fill={C.boisFonce} />
      </>
    ),
  },
  "japon-coree": {
    fond: "#FBE0E3",
    dessin: (
      <>
        <path d="M2 54L25 24L48 54Z" fill={C.lilas} />
        <path d="M25 24L32 33L28.5 31.5L25 34.5L21.5 31.5L18 33Z" fill={C.blanc} />
        <rect y="54" width="50" height="8" fill={C.amande} />
        <path d="M10 56V22H14.5V56ZM35.5 56V22H40V56ZM7 26H43V29.5H7Z" fill={C.cerise} />
        <path d="M3 14Q25 19 47 14V19.5Q25 24 3 19.5Z" fill={C.cerise} />
        <path d="M3 14Q25 19 47 14V16Q25 21 3 16Z" fill={C.nuit} />
        <path d={ronds(2.2, [[6, 36], [44, 40], [20, 46]]) + ronds(1.6, [[31, 42], [45, 30], [5, 47]])} fill={C.bougClair} />
      </>
    ),
  },
  safari: {
    fond: "#F5B546",
    dessin: (
      <>
        <circle cx="13" cy="20" r="8" fill={C.ivoire} />
        <rect y="50" width="50" height="12" fill={C.boisFonce} />
        {/* La girafe : elle se met toujours devant */}
        <path d="M27 62L31 24Q28 22 28.5 18L31.5 12L33 16.5L36.5 12.5L37 18Q42 19.5 44 24Q45 28 41 28.5L38 28L41 62Z" fill={C.paille} />
        <path d="M32.5 31L36 33L33 36.5ZM33.5 41L38 43L35 47.5L31.5 45ZM31 51L36 53L33.5 58L29.5 56ZM37 50.5L39.5 51L40 55Z" fill={C.bois} />
        <circle cx="38" cy="21.5" r="1.3" fill={C.nuit} />
        <path d="M31.5 12L30.5 8.5M36.5 12.5L37.5 9" fill="none" stroke={C.bois} strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  aurores: {
    fond: "#10244D",
    dessin: (
      <>
        <path d={ronds(0.9, [[6, 8], [44, 12], [38, 4], [16, 16], [28, 7]])} fill={C.blanc} />
        <path d="M4 44Q0 28 10 12Q14 22 12 32Q16 40 12 46Z" fill={C.persClair} fillOpacity="0.85" />
        <path d="M18 42Q14 24 24 6Q29 18 26 30Q30 38 27 44Z" fill={C.persClair} />
        <path d="M33 42Q30 26 39 12Q44 22 41 32Q45 38 41 44Z" fill={C.lilas} fillOpacity="0.9" />
        <path d="M0 62V52Q14 44 28 50Q40 46 50 52V62Z" fill={C.blanc} />
        <path d="M39 53L43 41L47 53Z" fill={C.nuit} />
        <path d="M40.2 47L43 37L45.8 47Z" fill={C.nuit} />
      </>
    ),
  },
  transatlantique: {
    fond: C.ciel,
    dessin: (
      <>
        <circle cx="40" cy="12" r="6" fill={C.mimosa} />
        <path d="M24 8V44" fill="none" stroke={C.boisFonce} strokeWidth="1.6" />
        <path d="M26 10L41 40H26Z" fill={C.blanc} />
        <path d="M22 16L9 40H22Z" fill={C.creme} />
        <path d="M8 43H42L37 52H13Z" fill={C.cerise} />
        <path d="M0 62V51Q6.2 47 12.5 51T25 51T37.5 51T50 51V62Z" fill={C.marine} />
        <path d="M4 56H14L17 54.5L20 56H30M34 59H46" fill="none" stroke={shade(C.marine, 0.3)} strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  "tour-du-monde": {
    fond: C.lagune,
    dessin: (
      <>
        <circle cx="25" cy="33" r="17" fill={C.azur} />
        <path d="M15 22Q20 18 25 21Q27 26 22 28Q21 33 16 32Q12 28 15 22ZM29 30Q35 27 39 32Q40 39 34 43Q30 41 31 36ZM18 40Q22 38 24 42Q23 47 19 47Q16 44 18 40Z" fill={C.vert} />
        <ellipse cx="25" cy="33" rx="23" ry="7" transform="rotate(-24 25 33)" fill="none" stroke={C.ivoire} strokeWidth="1.3" strokeDasharray="2.5 2.5" />
        {/* L'avion */}
        <g transform="translate(42 15) rotate(-28)">
          <path d="M-7 0Q-7 -2 -4 -2H5Q8 -2 8 0Q8 2 5 2H-4Q-7 2 -7 0Z" fill={C.blanc} />
          <path d="M-1 -2L-4 -8H-1L3 -2ZM-1 2L-4 8H-1L3 2ZM-6 -1.5L-8 -5H-6L-4 -1.5Z" fill={C.blanc} />
        </g>
      </>
    ),
  },
  antarctique: {
    fond: "#CDEAF4",
    dessin: (
      <>
        <path d="M2 50L12 22L20 34L27 16L38 50Z" fill={C.blanc} />
        <path d="M27 16L38 50H28L30 36Z" fill={C.ciel} />
        <rect y="50" width="50" height="12" fill={C.mer} />
        <path d="M0 50H50V52.5H0Z" fill={C.blanc} />
        {/* Le manchot */}
        <ellipse cx="36" cy="44" rx="8" ry="11.5" fill={C.noir} />
        <ellipse cx="35" cy="46.5" rx="5" ry="8.5" fill={C.blanc} />
        <path d="M32 37.5L27 39.5L32 41Z" fill={C.mimosaFonce} />
        <circle cx="34" cy="37" r="1.1" fill={C.blanc} />
        <path d="M30 55H35V57H29ZM37 55H42L43 57H37Z" fill={C.mimosaFonce} />
      </>
    ),
  },

  // --- Les folies
  everest: {
    fond: "#9FCDEA",
    dessin: (
      <>
        <path d="M-2 62L18 26L28 44L34 34L52 62Z" fill={C.ardoise} />
        <path d="M6 62L26 12L46 62Z" fill={shade(C.ardoise, 0.25)} />
        <path d="M26 12L46 62H34Z" fill={C.ardoise} />
        <path d="M26 12L33.5 31L29.5 28L26 33L22.5 28L18.5 31Z" fill={C.blanc} />
        <path d="M26 12V3" fill="none" stroke={C.nuit} strokeWidth="1.2" />
        <path d="M26 3L35 5.5L26 8Z" fill={C.cerise} />
        {/* La chaise à porteurs, en chemin */}
        <rect x="8" y="46" width="9" height="9" rx="1.5" fill={C.bordeaux} />
        <path d="M3 52H22" fill="none" stroke={C.mimosa} strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  "ile-deserte": {
    fond: C.ciel,
    dessin: (
      <>
        <circle cx="11" cy="12" r="6" fill={C.mimosa} />
        <rect y="46" width="50" height="16" fill={C.mer} />
        <path d="M6 50Q25 32 44 50Z" fill={C.sable} />
        <path d="M27 42Q25 28 31 16" fill="none" stroke={C.bois} strokeWidth="3" strokeLinecap="round" />
        <path d="M31 16Q22 9 14 14Q23 14 31 16ZM31 16Q25 5 30 0Q33 8 31 16ZM31 16Q41 8 48 14Q39 14 31 16ZM31 16Q40 18 44 26Q36 22 31 16ZM31 16Q22 19 19 27Q26 22 31 16Z" fill={C.feuille} />
        <path d="M0 54H10L13 52.5L16 54H30M34 58H48" fill="none" stroke={shade(C.mer, 0.3)} strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  train: {
    fond: "#2A2E63",
    dessin: (
      <>
        <path d={ronds(4.5, [[14, 12]]) + ronds(6, [[23, 8]]) + ronds(3.2, [[8, 18]])} fill={C.blanc} fillOpacity="0.85" />
        <path d="M4 26H34Q46 26 46 40V48H4Z" fill={C.marine} />
        <path d="M4 37H46V41H4Z" fill={METAL.or} />
        <rect x="9" y="19" width="6" height="8" fill={C.nuit} />
        <path d="M8 29H16V35H8ZM20 29H28V35H20Z" fill={C.mimosa} />
        <path d="M34 26Q46 26 46 40V48H40V34Q40 28 34 26Z" fill={shade(C.marine, -0.3)} />
        <path d={ronds(5, [[13, 49], [27, 49], [39, 49]])} fill={C.nuit} />
        <path d={ronds(2, [[13, 49], [27, 49], [39, 49]])} fill={METAL.or} />
        <rect y="54" width="50" height="2.5" fill={C.gris} />
      </>
    ),
  },
  film: {
    fond: C.bordeaux,
    dessin: (
      <>
        <path d={etoiles([[40, 12, 6], [9, 52, 3.5]])} fill={C.mimosa} />
        <rect x="7" y="30" width="36" height="24" rx="2" fill={C.noir} />
        <rect x="11" y="36" width="28" height="3" fill={C.gris} />
        <rect x="11" y="43" width="18" height="3" fill={C.gris} />
        <g transform="rotate(-16 8 29)">
          <rect x="7" y="20" width="37" height="8" rx="1.5" fill={C.blanc} />
          <path d="M12 20H18L14 28H8ZM24 20H30L26 28H20ZM36 20H42L38 28H32Z" fill={C.noir} />
        </g>
      </>
    ),
  },
  abysses: {
    fond: ABYSSE,
    dessin: (
      <>
        <path d="M17 34L4 62H46L33 34Z" fill={C.mimosa} fillOpacity="0.22" />
        <circle cx="25" cy="24" r="13" fill={C.mimosa} />
        <path d="M25 11A13 13 0 0 1 38 24A13 13 0 0 1 25 37Q33 31 33 24Q33 16 25 11Z" fill={C.mimosaFonce} />
        <circle cx="23" cy="24" r="6" fill={C.nuit} />
        <circle cx="23" cy="24" r="4.3" fill={C.ciel} />
        <rect x="21" y="6" width="8" height="5" rx="1" fill={C.gris} />
        <path d={ronds(1.6, [[42, 14], [8, 44]]) + ronds(1, [[44, 8], [5, 38]])} fill={C.persClair} />
        <rect x="19" y="55" width="12" height="7" rx="1" transform="rotate(-10 25 58)" fill={C.ivoire} />
      </>
    ),
  },
  parc: {
    fond: "#35266B",
    dessin: (
      <>
        <path d="M25 28L12 60H16L25 38L34 60H38Z" fill={C.ecume} />
        <circle cx="25" cy="28" r="18" fill="none" stroke={C.mimosa} strokeWidth="2.2" />
        <path d="M25 10V46M7 28H43M12.3 15.3L37.7 40.7M37.7 15.3L12.3 40.7" fill="none" stroke={C.mimosa} strokeWidth="0.9" />
        <path d={ronds(3.3, [[25, 10], [43, 28], [25, 46], [7, 28]])} fill={C.bougainvillier} />
        <path d={ronds(3.3, [[12.3, 15.3], [37.7, 40.7], [37.7, 15.3], [12.3, 40.7]])} fill={C.persClair} />
        <circle cx="25" cy="28" r="3.2" fill={C.ivoire} />
      </>
    ),
  },

  // --- Plus haut que le ciel
  apesanteur: {
    fond: "#22386E",
    dessin: (
      <>
        <path d={ronds(0.9, [[8, 10], [42, 20], [14, 54], [40, 52]])} fill={C.blanc} />
        <g transform="rotate(-18 24 36)">
          <rect x="7" y="27" width="34" height="20" rx="8" fill={C.blanc} />
          <path d="M33 27Q41 27 41 35V39Q41 47 33 47Q37 42 37 37Q37 31 33 27Z" fill={C.brume} />
          <path d="M13 33Q18 30 23 33" fill="none" stroke={C.brume} strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <path d="M30 6H40L33 15H40M21 9H27L22.5 15H27" fill="none" stroke={C.mimosa} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  orbite: {
    fond: ESPACE,
    dessin: (
      <>
        <path d={ronds(0.9, [[6, 8], [44, 6], [40, 30], [10, 34]])} fill={C.blanc} />
        <circle cx="25" cy="80" r="36" fill={C.azur} />
        <path d="M6 52Q14 46 22 50Q24 56 16 58Q10 62 4 60ZM30 47Q38 45 44 50Q42 56 34 54Z" fill={C.vert} />
        <g transform="rotate(-14 25 24)">
          <rect x="3" y="19" width="14" height="10" fill={C.ciel} />
          <rect x="33" y="19" width="14" height="10" fill={C.ciel} />
          <path d="M10 19V29M40 19V29M3 24H17M33 24H47" fill="none" stroke={C.marine} strokeWidth="0.9" />
          <rect x="17" y="22.5" width="16" height="3" fill={C.gris} />
          <rect x="19.5" y="17" width="11" height="14" rx="3" fill={C.blanc} />
          <circle cx="25" cy="24" r="2.6" fill={C.nuit} />
        </g>
      </>
    ),
  },
  "feu-artifice": {
    fond: ESPACE,
    dessin: (
      <>
        <circle cx="25" cy="92" r="46" fill="#1C3A6E" />
        <path d={ronds(0.9, [[12, 54], [20, 57], [31, 53], [38, 58], [26, 59]])} fill={C.mimosa} />
        <path d="M17 24V8M17 24L28.3 12.7M17 24H33M17 24L28.3 35.3M17 24V40M17 24L5.7 35.3M17 24H1M17 24L5.7 12.7" fill="none" stroke={C.mimosa} strokeWidth="2" strokeLinecap="round" strokeDasharray="5 3.5" />
        <path d="M37 36V26M37 36L44 29M37 36H47M37 36L44 43M37 36V46M37 36L30 43M37 36H27M37 36L30 29" fill="none" stroke={C.bougClair} strokeWidth="1.7" strokeLinecap="round" strokeDasharray="3.5 2.5" />
        <path d={etoiles([[38, 12, 3.5]])} fill={C.persClair} />
      </>
    ),
  },
  "tour-de-lune": {
    fond: ESPACE,
    dessin: (
      <>
        <path d={ronds(0.9, [[6, 10], [44, 8], [8, 52], [42, 54]])} fill={C.blanc} />
        <path d="M2 38A24 9 -22 0 1 48 24" fill="none" stroke={C.mimosa} strokeWidth="1.3" strokeDasharray="2.5 2.5" />
        <circle cx="25" cy="31" r="14" fill={C.ivoire} />
        <path d="M25 17A14 14 0 0 1 25 45Q32 38 32 31Q32 23 25 17Z" fill={C.pierre} />
        <path d={ronds(3, [[20, 26]]) + ronds(2, [[26, 37], [17, 35]])} fill={C.pierre} />
        <path d="M2 38A24 9 -22 0 0 48 24" fill="none" stroke={C.mimosa} strokeWidth="1.3" strokeDasharray="2.5 2.5" />
        {/* La fusée */}
        <g transform="translate(41 45) rotate(62)">
          <path d="M-6 0Q-6 -3 0 -3H3Q8 -1.5 9 0Q8 1.5 3 3H0Q-6 3 -6 0Z" fill={C.blanc} />
          <path d="M-6 -3L-9 -6V6L-6 3Z" fill={C.cerise} />
          <circle cx="2" cy="0" r="1.4" fill={C.azur} />
        </g>
      </>
    ),
  },
  "pas-sur-la-lune": {
    fond: ESPACE,
    dessin: (
      <>
        <path d={ronds(0.9, [[8, 8], [22, 14], [44, 20]])} fill={C.blanc} />
        <circle cx="38" cy="10" r="6" fill={C.azur} />
        <path d="M34 8Q37 6 39 8.5Q37 11 34.5 10.5Z" fill={C.vert} />
        <path d="M0 62V30Q25 22 50 30V62Z" fill={C.grisClair} />
        <path d={ronds(3, [[9, 36]]) + ronds(2, [[43, 40]])} fill={C.gris} fillOpacity="0.6" />
        {/* L'empreinte */}
        <g transform="rotate(12 25 45)">
          <path d="M18 33Q18 28 25 28Q32 28 32 33V46Q32 49 25 49Q18 49 18 46Z" fill={C.grisFonce} />
          <path d="M19 52Q19 50 25 50Q31 50 31 52V56Q31 59 25 59Q19 59 19 56Z" fill={C.grisFonce} />
          <path d="M20 33H30M20 37H30M20 41H30M20 45H30M21 54H29" fill="none" stroke={C.grisClair} strokeWidth="1.5" />
        </g>
      </>
    ),
  },
  "soiree-lune": {
    fond: "#2B1A60",
    dessin: (
      <>
        <path d="M0 62V50Q25 42 50 50V62Z" fill={C.grisClair} />
        <ellipse cx="14" cy="56" rx="6" ry="2" fill={C.gris} />
        <path d="M25 0V12" fill="none" stroke={C.brume} strokeWidth="1.2" />
        <path d="M25 26L2 46H14ZM25 26L48 44H36Z" fill={C.mimosa} fillOpacity="0.28" />
        <circle cx="25" cy="24" r="12" fill={METAL.argent} />
        <path d="M13.5 21H36.5M13.5 27.5H36.5M19 13.7Q16 24 19 34.3M25 12V36M31 13.7Q34 24 31 34.3" fill="none" stroke={C.nuit} strokeOpacity="0.45" strokeWidth="0.9" />
        <path d={etoiles([[8, 16, 4.5], [43, 12, 3.5], [41, 34, 3]])} fill={C.bougClair} />
      </>
    ),
  },
  mars: {
    fond: MARS,
    dessin: (
      <>
        <path d={ronds(3, [[40, 10]]) + ronds(1.6, [[30, 6]])} fill={C.ivoire} />
        <path d="M0 62V42Q12 34 24 40Q38 32 50 40V62Z" fill={C.brique} />
        <path d="M0 62V52Q14 46 28 52Q40 48 50 52V62Z" fill={shade(C.brique, -0.2)} />
        {/* Le panier, et sa nappe à carreaux */}
        <path d="M12 30Q25 8 38 30" fill="none" stroke={C.boisFonce} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M9 30H41L37 48H13Z" fill={C.bois} />
        <path d="M9 30H41L40 35H10Z" fill={C.blanc} />
        <path d="M13 30H18L17.7 35H12.5ZM23 30H28V35H23ZM33 30H38L37.5 35H32.5Z" fill={C.cerise} />
        <path d="M13 40H37M14 44H36" fill="none" stroke={C.boisFonce} strokeWidth="1" />
      </>
    ),
  },
  saturne: {
    fond: "#1B1440",
    dessin: (
      <>
        <path d={ronds(0.9, [[6, 8], [44, 10], [8, 54], [40, 56]])} fill={C.blanc} />
        <path d="M2.9 39.8A23 6.5 -20 0 1 47.1 22.2" fill="none" stroke={C.creme} strokeWidth="3.6" />
        <circle cx="25" cy="31" r="13" fill={C.paille} />
        <path d="M12.5 27.5Q25 31 37.5 27.5M12.8 35Q25 38.5 37.2 35" fill="none" stroke={C.mimosaFonce} strokeWidth="2" />
        <path d="M2.9 39.8A23 6.5 -20 0 0 47.1 22.2" fill="none" stroke={C.creme} strokeWidth="3.6" />
        {/* La planche, sur l'anneau */}
        <ellipse cx="41" cy="27" rx="7" ry="2.2" transform="rotate(-24 41 27)" fill={C.bougainvillier} />
      </>
    ),
  },
  "dos-de-comete": {
    fond: ESPACE,
    dessin: (
      <>
        <path d={ronds(0.9, [[8, 8], [44, 40], [14, 30], [40, 56]])} fill={C.blanc} />
        <path d="M30 16L2 58L10 60L38 24Z" fill={C.ciel} fillOpacity="0.45" />
        <path d="M33 18L14 60L22 61L39 25Z" fill={C.blanc} fillOpacity="0.5" />
        <circle cx="36" cy="18" r="8.5" fill={C.ciel} />
        <circle cx="38" cy="16" r="4.5" fill={C.blanc} />
        <path d={etoiles([[10, 14, 4], [42, 48, 3]])} fill={C.mimosa} />
      </>
    ),
  },

  // --- La dernière
  "toute-la-ville": {
    fond: C.mimosa,
    dessin: (
      <>
        <rect y="40" width="50" height="8" fill={C.mer} />
        <rect y="48" width="50" height="14" fill={C.sable} />
        <path d="M25 14V54" fill="none" stroke={C.boisFonce} strokeWidth="1.8" />
        <path d="M3 30Q5 10 25 8Q45 10 47 30Q41.5 26 36 30Q30.5 26 25 30Q19.5 26 14 30Q8.5 26 3 30Z" fill={C.bougainvillier} />
        <path d="M25 8Q19 16 19.5 28Q16.7 27.2 14 30Q13 16 25 8ZM25 8Q31 16 30.5 28Q33.3 27.2 36 30Q37 16 25 8Z" fill={C.ivoire} />
        {/* Des valises : tout le monde part */}
        <rect x="5" y="46" width="13" height="10" rx="1.5" fill={C.cerise} />
        <rect x="32" y="44" width="14" height="12" rx="1.5" fill={C.persienne} />
        <path d="M9 46V44Q9 42.5 11.5 42.5T14 44V46M36 44V42Q36 40.5 39 40.5T42 42V44" fill="none" stroke={C.nuit} strokeWidth="1.2" />
        <path d="M5 50.5H18M32 49.5H46" fill="none" stroke={C.ivoire} strokeWidth="1.3" />
      </>
    ),
  },
};

/** Les identifiants des expériences qui ont leur timbre. */
export const TIMBRES: readonly string[] = Object.keys(IMAGES);

interface TimbreProps extends ArtProps {
  /** L'identifiant de l'expérience. */
  id: string;
  /** Vécue : le timbre est oblitéré. */
  vecue?: boolean;
}

/** Le timbre d'une expérience : son image dans un papier dentelé, et son cachet quand elle est vécue. */
export function Timbre({ id, vecue = false, className, title }: TimbreProps) {
  const image = IMAGES[id];
  return (
    <Svg viewBox="0 0 60 72" className={className} title={title}>
      <path d={PAPIER} fill={C.blanc} />
      <g transform="translate(5 5)">
        <rect width="50" height="62" fill={image?.fond ?? C.brume} />
        {image?.dessin}
      </g>
      {vecue && (
        <g className="timbre__cachet" fill="none" stroke={C.nuit} strokeOpacity="0.72" strokeLinecap="round">
          <path d="M2 52q4.5 -3.5 9 0t9 0t9 0M2 58q4.5 -3.5 9 0t9 0t9 0M2 64q4.5 -3.5 9 0t9 0t9 0" strokeWidth="1.5" />
          <circle cx="44" cy="56" r="13" strokeWidth="1.8" />
          <circle cx="44" cy="56" r="9.5" strokeWidth="0.9" />
          <path d="M38.5 56.5L42.5 60.5L50 52" strokeWidth="2.4" strokeLinejoin="round" />
        </g>
      )}
    </Svg>
  );
}
