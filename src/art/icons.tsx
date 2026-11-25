// Jeu d'icônes maison (BRIEF.md, section 13.6) : grille de 24 px, trait de 2 px à
// bouts ronds, version pleine pour l'onglet actif.

import type { ReactNode } from "react";

export type IconName =
  | "domaine" | "jouer" | "boutiques" | "classement" | "reglages" | "etoile" | "piece" | "retour"
  | "cadenas" | "son" | "son-coupe" | "vibration" | "fermer" | "chevron" | "copier" | "corbeille"
  | "info" | "coche" | "hors-ligne" | "doigt" | "rafraichir" | "eclair" | "telephone" | "calme" | "cle";

interface IconProps {
  name: IconName;
  /** Taille en pixels. */
  size?: number;
  /** Version pleine : l'onglet actif. */
  plein?: boolean;
  className?: string;
  /** Nom lu par les lecteurs d'écran. Absent : l'icône est décorative. */
  title?: string;
}

/** Chaque icône : son tracé au trait, et sa version pleine quand elle en a une. */
const PATHS: Record<IconName, { trait: ReactNode; plein?: ReactNode }> = {
  // Maison au palmier
  domaine: {
    trait: (
      <>
        <path d="M3 21h18M5 21v-8l5-4 5 4v8M9 21v-4h2v4" />
        <path d="M18 21V9M18 9c-1.5-2-3.5-2.5-5-2M18 9c1.5-2 3-2.5 4-2M18 9c-.5-2.500-.200-4 1-5.500" />
      </>
    ),
    plein: (
      <>
        <path d="M5 21v-8l5-4 5 4v8z" fill="currentColor" />
        <path d="M3 21h18M18 21V9M18 9c-1.5-2-3.5-2.5-5-2M18 9c1.5-2 3-2.5 4-2M18 9c-.5-2.500-.200-4 1-5.500" />
      </>
    ),
  },
  // Ticket et son talon
  jouer: {
    trait: (
      <>
        <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
        <path d="M15 8v1.500M15 11.250v1.500M15 14.500V16" />
      </>
    ),
    plein: (
      <>
        <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" fill="currentColor" />
        <path d="M15 8v1.500M15 11.250v1.500M15 14.500V16" stroke="var(--icone-fond, #0E2F3A)" />
      </>
    ),
  },
  // Cintre
  boutiques: {
    trait: <path d="M12 9V8a2 2 0 1 0-2-2M12 9l9 7a1.500 1.500 0 0 1-.900 2.700H3.900A1.500 1.500 0 0 1 3 16z" />,
    plein: (
      <>
        <path d="M12 9l9 7a1.500 1.500 0 0 1-.900 2.700H3.900A1.500 1.500 0 0 1 3 16z" fill="currentColor" />
        <path d="M12 9V8a2 2 0 1 0-2-2" />
      </>
    ),
  },
  // Coupe
  classement: {
    trait: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
        <path d="M12 13v4M8.500 20h7M10 17h4" />
      </>
    ),
    plein: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0z" fill="currentColor" />
        <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.500 20h7M10 17h4" />
      </>
    ),
  },
  // Roue dentée
  reglages: {
    trait: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.640 5.640l1.770 1.770M16.590 16.590l1.770 1.770M5.640 18.360l1.770-1.770M16.590 7.410l1.770-1.770" />
        <circle cx="12" cy="12" r="6.500" />
      </>
    ),
  },
  etoile: {
    trait: <path d="M12 3.500l2.600 5.300 5.900.850-4.250 4.150 1 5.850L12 16.900l-5.250 2.750 1-5.850L3.500 9.650l5.900-.850z" />,
    plein: <path d="M12 3.500l2.600 5.300 5.900.850-4.250 4.150 1 5.850L12 16.900l-5.250 2.750 1-5.850L3.500 9.650l5.900-.850z" fill="currentColor" />,
  },
  piece: {
    trait: (
      <>
        <circle cx="12" cy="12" r="8.500" />
        <path d="M15 9.500a3.500 3.500 0 1 0 0 5M8 11h4.500M8 13.500h4.500" />
      </>
    ),
    plein: (
      <>
        <circle cx="12" cy="12" r="8.500" fill="currentColor" />
        <path d="M15 9.500a3.500 3.500 0 1 0 0 5M8 11h4.500M8 13.500h4.500" stroke="var(--icone-fond, #B88A14)" />
      </>
    ),
  },
  retour: { trait: <path d="M15 5l-7 7 7 7" /> },
  cadenas: {
    trait: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3M12 14.500v2" />
      </>
    ),
  },
  son: { trait: <path d="M4 10v4h3l5 4V6l-5 4zM15.500 9a4 4 0 0 1 0 6M18 6.500a7.500 7.500 0 0 1 0 11" /> },
  "son-coupe": { trait: <path d="M4 10v4h3l5 4V6l-5 4zM16 9.500l5 5M21 9.500l-5 5" /> },
  // Téléphone qui vibre
  vibration: {
    trait: (
      <>
        <rect x="8" y="4" width="8" height="16" rx="2" />
        <path d="M4.500 9v6M19.500 9v6M2 10.500v3M22 10.500v3M11 17h2" />
      </>
    ),
  },
  telephone: {
    trait: (
      <>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
  },
  fermer: { trait: <path d="M6 6l12 12M18 6L6 18" /> },
  chevron: { trait: <path d="M9 5l7 7-7 7" /> },
  copier: {
    trait: (
      <>
        <rect x="8" y="8" width="11" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1" />
      </>
    ),
  },
  corbeille: { trait: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" /> },
  info: {
    trait: (
      <>
        <circle cx="12" cy="12" r="8.500" />
        <path d="M12 11v5M12 8v.010" />
      </>
    ),
  },
  coche: { trait: <path d="M5 12.500l4.500 4.500L19 7.500" /> },
  "hors-ligne": {
    trait: <path d="M3 9a14 14 0 0 1 4-2.700M21 9a14 14 0 0 0-8-3.900M6.500 12.500a9 9 0 0 1 3-1.800M17.500 12.500a9 9 0 0 0-2.500-1.600M9.800 16a4 4 0 0 1 4.400 0M12 19.500v.010M4 4l16 16" />,
  },
  // Le doigt qui montre le geste de grattage
  doigt: {
    trait: (
      <path d="M9 11V5.500a1.500 1.500 0 0 1 3 0V11M12 10V9a1.500 1.500 0 0 1 3 0v2M15 11v-.500a1.500 1.500 0 0 1 3 0V15a6 6 0 0 1-6 6h-.500a5.500 5.500 0 0 1-4.600-2.500L4.500 14.700a1.500 1.500 0 0 1 2.300-1.900L9 15" />
    ),
    plein: (
      <path
        d="M9 11V5.500a1.500 1.500 0 0 1 3 0V11M12 10V9a1.500 1.500 0 0 1 3 0v2M15 11v-.500a1.500 1.500 0 0 1 3 0V15a6 6 0 0 1-6 6h-.500a5.500 5.500 0 0 1-4.600-2.500L4.500 14.700a1.500 1.500 0 0 1 2.300-1.900L9 15"
        fill="currentColor"
      />
    ),
  },
  rafraichir: { trait: <path d="M20 5v5h-5M4 19v-5h5M19.500 10a8 8 0 0 0-14-2.500M4.500 14a8 8 0 0 0 14 2.500" /> },
  eclair: { trait: <path d="M13 3L5 13.500h6L10 21l8-10.500h-6z" /> },
  // Animations réduites : une plume qui se pose
  calme: { trait: <path d="M4 20c2-8 7-14 16-16-1 9-6 14-13 14M4 20l7-7M9 18l2-5 5-2" /> },
  cle: {
    trait: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="M11 12l8.500-8.500M16 7l2.500 2.500M18.500 4.500L21 7" />
      </>
    ),
  },
};

export function Icon({ name, size = 24, plein = false, className, title }: IconProps) {
  const icon = PATHS[name];
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {plein && icon.plein ? icon.plein : icon.trait}
    </svg>
  );
}

/** L'étoile du Standing, posée dans une phrase à la place du caractère ★. */
export function Etoile({ className }: { className?: string }) {
  return (
    <svg className={className ?? "etoile"} width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2.500l2.900 5.900 6.600.950-4.750 4.650 1.100 6.500L12 17.400l-5.850 3.100 1.100-6.500L2.500 9.350l6.600-.950z" fill="currentColor" />
    </svg>
  );
}
