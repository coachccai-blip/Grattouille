// Boîte à outils des illustrations (BRIEF.md, section 4.5).
//
// Style : papier découpé à la gouache.
// - Aplats sans contour. Une ombre est une forme plus sombre décalée vers le bas à
//   droite (la lumière vient d'en haut à gauche), jamais un flou.
// - 40 formes et 6 couleurs au plus par illustration, métaux à part.
// - Les métaux (laiton, or, argent, cuivre, chrome) sont les seuls dégradés autorisés.
// - Visages : deux points pour les yeux, pas de bouche détaillée. L'expression passe
//   par les sourcils et la posture.
// - Matières par motif simple : chevrons pour le tweed, pois pour la soie, rayures
//   pour la marinière, losanges pour le velours.
// - Aucun filtre SVG, aucune image bitmap.

import type { ReactNode } from "react";

/** Une illustration autonome : un <svg> qui remplit la largeur de son conteneur. */
export type Art = (props: ArtProps) => ReactNode;

export interface ArtProps {
  className?: string;
  /** Nom lu par les lecteurs d'écran. Absent : l'illustration est décorative. */
  title?: string;
}

/** Couleurs de gouache. Les six premières lignes reprennent les jetons de l'interface. */
export const C = {
  nuit: "#0E2F3A", lagune: "#17505C", ecume: "#E6F2F0", brume: "#B4CDD0", ivoire: "#FFF7E6", encre: "#4A6670",
  mimosa: "#F7C948", mimosaFonce: "#B88A14", bougainvillier: "#D9457A", bougFonce: "#B02A5F", bougClair: "#F08DB1",
  persienne: "#2F8F72", persFonce: "#1F6F57", persClair: "#5FC9A6", cerise: "#C8323C", ceriseClair: "#FF8A8F",

  blanc: "#FFFFFF", craie: "#F4EFE6", creme: "#FBEBD3", sable: "#F1DDB3", paille: "#E8C877",
  ciel: "#BEE7F5", azur: "#4E9FD1", marine: "#1F4E79", mer: "#2C7DA0", lilas: "#B9A5D6", prune: "#5A1730",
  rose: "#F2B5B0", corail: "#EE7B5D", terracotta: "#C9623F", brique: "#A8452E", bordeaux: "#7A1F35",
  vert: "#6DAA4F", feuille: "#3F7D3A", olive: "#8A9440", amande: "#BFD8B8",
  bois: "#9A6B45", boisFonce: "#5E3B25", kraft: "#C9A77A", pierre: "#D8CDBA", ardoise: "#5B6B78",
  gris: "#8E979F", grisClair: "#C9CED4", grisFonce: "#4B555C", noir: "#1D2326",
} as const;

/** Les métaux : les seuls dégradés. Définis une fois dans <ArtDefs />. */
export const METAL = {
  or: "url(#m-or)",
  laiton: "url(#m-laiton)",
  argent: "url(#m-argent)",
  cuivre: "url(#m-cuivre)",
  chrome: "url(#m-chrome)",
} as const;

/** Assombrit (amount < 0) ou éclaircit (amount > 0) une couleur hexadécimale. `amount` entre -1 et 1. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v: number) => Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Silhouette du buste de l'avatar : épaules de x = 70 à x = 330 à partir de y = 320. */
export const BUSTE = "M70 480V372Q70 320 122 320H278Q330 320 330 372V480Z";
/** Le cou, centré en (200, 285). */
export const COU = "M168 246H232V330H168Z";

interface SvgProps extends ArtProps {
  viewBox: string;
  children: ReactNode;
}

/** Enveloppe commune : remplit la largeur, décorative sauf si un titre est donné. */
export function Svg({ viewBox, title, className, children }: SvgProps) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Définitions partagées, rendues une seule fois à la racine de l'application :
 * les dégradés métalliques et les découpes de l'avatar. Tout SVG de la page peut
 * y faire référence par `url(#…)`.
 */
export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="m-or" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF0B8" />
          <stop offset="0.38" stopColor="#F2C94C" />
          <stop offset="0.62" stopColor="#D9A520" />
          <stop offset="1" stopColor="#9A6F0E" />
        </linearGradient>
        <linearGradient id="m-laiton" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3D58A" />
          <stop offset="0.45" stopColor="#C99A3A" />
          <stop offset="1" stopColor="#8F6A1F" />
        </linearGradient>
        <linearGradient id="m-argent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1F3F5" />
          <stop offset="0.4" stopColor="#C9CED4" />
          <stop offset="0.6" stopColor="#AEB5BC" />
          <stop offset="1" stopColor="#7E8790" />
        </linearGradient>
        <linearGradient id="m-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#B8C2CC" />
          <stop offset="0.5" stopColor="#6F7B87" />
          <stop offset="1" stopColor="#DCE3EA" />
        </linearGradient>
        <linearGradient id="m-cuivre" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6C7A0" />
          <stop offset="0.45" stopColor="#C8733F" />
          <stop offset="1" stopColor="#8A4A22" />
        </linearGradient>
        <clipPath id="av-tete">
          <ellipse cx="200" cy="172" rx="98" ry="93" />
        </clipPath>
        <clipPath id="av-buste">
          <path d={BUSTE} />
        </clipPath>
      </defs>
    </svg>
  );
}
