// Les huit espèces du joueur (BRIEF.md, sections 4.4 et 4.6).
//
// Les espèces partagent le même buste et la même tête, dessinés par Avatar.tsx.
// Une espèce ne fournit que ses couleurs, ses oreilles et son museau.
//
// Repères du gabarit (viewBox 0 0 400 480) : sommet du crâne à y = 80, yeux en
// (165, 165) et (235, 165), menton à y = 265. La tête est l'ellipse centrée en
// (200, 172), de rayons 98 et 93.
// - `Ears` est dessiné DERRIÈRE la tête : oreilles, piquants, tout ce qui dépasse.
// - `Muzzle` est dessiné SUR la tête et découpé par elle : museau, joues, masque,
//   truffe. Les yeux et les sourcils sont posés par-dessus par Avatar.tsx.

import type { ReactNode } from "react";
import { C, shade } from "./kit";

export interface SpeciesArt {
  colors: {
    pelage: string;
    ventre: string;
    truffe: string;
    /** Couleur des yeux et des sourcils. Par défaut `nuit`. */
    oeil?: string;
  };
  Ears: () => ReactNode;
  Muzzle: () => ReactNode;
}

const renard: SpeciesArt = {
  colors: { pelage: "#D9713C", ventre: C.creme, truffe: "#2B2320" },
  Ears: () => (
    <g>
      <path d="M106 128L92 22L186 84Z" fill="#D9713C" />
      <path d="M294 128L308 22L214 84Z" fill="#D9713C" />
      <path d="M92 22L101 62L128 46Z" fill="#3B2A22" />
      <path d="M308 22L299 62L272 46Z" fill="#3B2A22" />
      <path d="M116 108L110 60L160 92Z" fill={shade("#D9713C", -0.28)} />
      <path d="M284 108L290 60L240 92Z" fill={shade("#D9713C", -0.28)} />
    </g>
  ),
  Muzzle: () => (
    <g>
      {/* Joues crème qui remontent en pointe vers le front. */}
      <path d="M96 198Q150 196 200 150Q250 196 304 198Q300 270 200 272Q100 270 96 198Z" fill={C.creme} />
      <ellipse cx="200" cy="216" rx="17" ry="12" fill="#2B2320" />
      <ellipse cx="194" cy="212" rx="5" ry="3" fill={shade("#2B2320", 0.35)} />
    </g>
  ),
};

/**
 * Les espèces dessinées. Une espèce absente retombe sur le renard (voir speciesArt).
 * Identifiants attendus : renard, chat, ours, lapin, blaireau, grenouille, raton, herisson.
 */
export const SPECIES_ART: Record<string, SpeciesArt> = {
  renard,
};

export function speciesArt(id: string): SpeciesArt {
  return SPECIES_ART[id] ?? renard;
}
