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

/** Chat des Chartreux : gris-bleu, tigré au front, truffe rose. */
const chat: SpeciesArt = {
  colors: { pelage: "#8496AD", ventre: "#EEF1F4", truffe: "#E58A8F" },
  Ears: () => (
    <g>
      {/* Oreilles plus courtes que celles du renard, pointe arrondie, intérieur rose. */}
      <path d="M114 138L101 60Q99 36 121 44L190 88Z" fill="#8496AD" />
      <path d="M286 138L299 60Q301 36 279 44L210 88Z" fill="#8496AD" />
      <path d="M121 116L113 69Q112 55 126 61L166 88Z" fill={C.rose} />
      <path d="M279 116L287 69Q288 55 274 61L234 88Z" fill={C.rose} />
    </g>
  ),
  Muzzle: () => (
    <g>
      {/* Tigrures : trois au front, deux sur chaque joue. */}
      <g fill={shade("#8496AD", -0.3)}>
        <path d="M193 76H207L204 114Q200 122 196 114Z" />
        <path d="M160 82L173 79L180 108Q177 116 171 110Z" />
        <path d="M240 82L227 79L220 108Q223 116 229 110Z" />
        <path d="M98 178L134 188L100 196Z" />
        <path d="M302 178L266 188L300 196Z" />
        <path d="M106 208L136 210L114 224Z" />
        <path d="M294 208L264 210L286 224Z" />
      </g>
      {/* Babines claires et menton. */}
      <ellipse cx="200" cy="243" rx="18" ry="13" fill="#EEF1F4" />
      <ellipse cx="182" cy="226" rx="25" ry="19" fill="#EEF1F4" />
      <ellipse cx="218" cy="226" rx="25" ry="19" fill="#EEF1F4" />
      <path d="M189 203H211Q209 216 200 218Q191 216 189 203Z" fill="#E58A8F" />
      {/* Moustaches : des traits, l'objet est une ligne. */}
      <path d="M164 222L112 212M164 229L110 232M166 236L118 250M236 222L288 212M236 229L290 232M234 236L282 250" fill="none" stroke={C.blanc} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
};

/** Ours brun : oreilles rondes, gros museau clair. */
const ours: SpeciesArt = {
  colors: { pelage: C.bois, ventre: "#E9CFA4", truffe: "#2B2320" },
  Ears: () => (
    <g>
      <circle cx="118" cy="98" r="36" fill={C.bois} />
      <circle cx="282" cy="98" r="36" fill={C.bois} />
      <circle cx="122" cy="102" r="20" fill={shade(C.bois, -0.3)} />
      <circle cx="278" cy="102" r="20" fill={shade(C.bois, -0.3)} />
    </g>
  ),
  Muzzle: () => (
    <g>
      <ellipse cx="200" cy="224" rx="52" ry="40" fill="#E9CFA4" />
      <path d="M180 200Q200 192 220 200Q222 214 200 222Q178 214 180 200Z" fill="#2B2320" />
      <ellipse cx="193" cy="203" rx="6" ry="3" fill={shade("#2B2320", 0.35)} />
    </g>
  ),
};

/** Lapin blanc : longues oreilles en V, pour laisser la place au chapeau. */
const lapin: SpeciesArt = {
  colors: { pelage: "#EBE1D3", ventre: C.blanc, truffe: "#E58A8F" },
  Ears: () => (
    <g>
      <ellipse cx="132" cy="63" rx="24" ry="60" transform="rotate(-17 132 63)" fill="#EBE1D3" />
      <ellipse cx="268" cy="63" rx="24" ry="60" transform="rotate(17 268 63)" fill="#EBE1D3" />
      <ellipse cx="133" cy="68" rx="12" ry="44" transform="rotate(-17 133 68)" fill={C.rose} />
      <ellipse cx="267" cy="68" rx="12" ry="44" transform="rotate(17 267 68)" fill={C.rose} />
    </g>
  ),
  Muzzle: () => (
    <g>
      {/* Deux joues rondes, deux dents, une truffe en cœur. */}
      <rect x="190" y="238" width="20" height="20" rx="4" fill={C.blanc} />
      <circle cx="179" cy="226" r="26" fill={C.blanc} />
      <circle cx="221" cy="226" r="26" fill={C.blanc} />
      <path d="M189 203H211Q209 216 200 218Q191 216 189 203Z" fill="#E58A8F" />
    </g>
  ),
};

/** Blaireau : tête blanche barrée de deux bandes noires, ventre sombre. */
const blaireau: SpeciesArt = {
  colors: { pelage: "#78818A", ventre: "#30363B", truffe: C.noir, oeil: C.blanc },
  Ears: () => (
    <g>
      {/* Oreilles noires, ourlées de blanc sur le dessus. */}
      <circle cx="122" cy="104" r="25" fill={C.blanc} />
      <circle cx="278" cy="104" r="25" fill={C.blanc} />
      <circle cx="126" cy="109" r="22" fill="#262B2F" />
      <circle cx="274" cy="109" r="22" fill="#262B2F" />
    </g>
  ),
  Muzzle: () => (
    <g>
      <rect x="96" y="70" width="208" height="200" fill="#F6F3EC" />
      {/* Les bandes partent de la truffe, passent sur les yeux et filent vers les oreilles. */}
      <path d="M190 226Q150 204 140 160Q130 112 104 96V70H180Q176 120 188 170Q194 198 196 226Z" fill="#262B2F" />
      <path d="M210 226Q250 204 260 160Q270 112 296 96V70H220Q224 120 212 170Q206 198 204 226Z" fill="#262B2F" />
      <ellipse cx="200" cy="222" rx="17" ry="12" fill={C.noir} />
      <ellipse cx="194" cy="218" rx="5" ry="3" fill={shade(C.noir, 0.35)} />
    </g>
  ),
};

/** Grenouille : pas d'oreilles, deux bosses sur le crâne et une large mâchoire claire. */
const grenouille: SpeciesArt = {
  colors: { pelage: C.vert, ventre: "#E3EDB4", truffe: C.feuille },
  Ears: () => (
    <g>
      <circle cx="150" cy="104" r="42" fill={C.vert} />
      <circle cx="250" cy="104" r="42" fill={C.vert} />
      {/* Un reflet sur chaque bosse : la peau est mouillée. */}
      <ellipse cx="134" cy="80" rx="15" ry="8" transform="rotate(-28 134 80)" fill={shade(C.vert, 0.3)} />
      <ellipse cx="246" cy="72" rx="13" ry="6.5" transform="rotate(-18 246 72)" fill={shade(C.vert, 0.3)} />
    </g>
  ),
  Muzzle: () => (
    <g>
      {/* Mâchoire, narines, taches. */}
      <path d="M96 204Q200 236 304 204V280H96Z" fill="#E3EDB4" />
      <circle cx="190" cy="198" r="4" fill={C.feuille} />
      <circle cx="210" cy="198" r="4" fill={C.feuille} />
      <circle cx="118" cy="176" r="7" fill={shade(C.vert, -0.2)} />
      <circle cx="284" cy="186" r="6" fill={shade(C.vert, -0.2)} />
      <circle cx="272" cy="166" r="4" fill={shade(C.vert, -0.2)} />
    </g>
  ),
};

/** Raton laveur : masque de bandit, sourcils blancs, oreilles ourlées de clair. */
const raton: SpeciesArt = {
  colors: { pelage: "#9B9088", ventre: "#EDE6DB", truffe: "#2B2320", oeil: C.creme },
  Ears: () => (
    <g>
      <path d="M102 132Q90 62 118 44Q156 58 186 90Z" fill="#EDE6DB" />
      <path d="M298 132Q310 62 282 44Q244 58 214 90Z" fill="#EDE6DB" />
      <path d="M114 122Q106 78 124 64Q148 74 168 94Z" fill="#3A3331" />
      <path d="M286 122Q294 78 276 64Q252 74 232 94Z" fill="#3A3331" />
    </g>
  ),
  Muzzle: () => (
    <g>
      {/* Le clair : deux arches au-dessus des yeux, puis tout le bas du visage. */}
      <path d="M94 156Q146 100 200 152Q254 100 306 156V280H94Z" fill="#EDE6DB" />
      {/* Le masque. */}
      <path d="M199 182Q178 124 136 128Q100 136 94 194Q112 220 142 208Q172 198 199 182Z" fill="#3A3331" />
      <path d="M201 182Q222 124 264 128Q300 136 306 194Q288 220 258 208Q228 198 201 182Z" fill="#3A3331" />
      <path d="M191 80H209L207 190Q200 198 193 190Z" fill="#3A3331" />
      <ellipse cx="200" cy="216" rx="16" ry="11" fill="#2B2320" />
      <ellipse cx="194" cy="212" rx="5" ry="3" fill={shade("#2B2320", 0.35)} />
    </g>
  ),
};

/** Couronne de piquants : pointes sur une ellipse, creux sur une autre, de 158° à 382°. */
function piquants(n: number, rx: number, ry: number, rxCreux: number, ryCreux: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 2 * n; i++) {
    const a = ((158 + (224 * i) / (2 * n)) * Math.PI) / 180;
    const pointe = i % 2 === 1;
    const x = 200 + (pointe ? rx : rxCreux) * Math.cos(a);
    const y = 172 + (pointe ? ry : ryCreux) * Math.sin(a);
    pts.push(`${Math.round(x)} ${Math.round(y)}`);
  }
  return `M${pts.join("L")}Z`;
}

const PIQUANTS_FOND = piquants(13, 134, 146, 112, 112);
const PIQUANTS_DEVANT = piquants(11, 121, 127, 103, 100);

/** Hérisson : visage clair qui sort d'un manteau de piquants. */
const herisson: SpeciesArt = {
  colors: { pelage: "#DDBD92", ventre: C.creme, truffe: "#2B2320" },
  Ears: () => (
    <g>
      <path d={PIQUANTS_FOND} fill={C.boisFonce} />
      <path d={PIQUANTS_DEVANT} fill={C.bois} />
      <circle cx="106" cy="140" r="19" fill="#DDBD92" />
      <circle cx="294" cy="140" r="19" fill="#DDBD92" />
      <circle cx="109" cy="143" r="10" fill={C.bois} />
      <circle cx="291" cy="143" r="10" fill={C.bois} />
    </g>
  ),
  Muzzle: () => (
    <g>
      {/* La frange de piquants qui descend sur le front. */}
      <path d="M96 70H304V122L284 106L268 128L251 107L234 126L217 105L200 124L183 105L166 126L149 107L132 128L116 106L96 122Z" fill={C.bois} />
      <path d="M96 70H304V100L292 88L276 108L259 88L242 106L226 86L209 104L200 90L191 104L174 86L158 106L141 88L124 108L108 88L96 100Z" fill={C.boisFonce} />
      <path d="M146 222Q200 176 254 222Q250 266 200 270Q150 266 146 222Z" fill={C.creme} />
      <circle cx="200" cy="212" r="14" fill="#2B2320" />
      <ellipse cx="195" cy="207" rx="5" ry="3" fill={shade("#2B2320", 0.35)} />
    </g>
  ),
};

/**
 * Les espèces dessinées. Une espèce absente retombe sur le renard (voir speciesArt).
 * Identifiants attendus : renard, chat, ours, lapin, blaireau, grenouille, raton, herisson.
 */
export const SPECIES_ART: Record<string, SpeciesArt> = {
  renard,
  chat,
  ours,
  lapin,
  blaireau,
  grenouille,
  raton,
  herisson,
};

export function speciesArt(id: string): SpeciesArt {
  return SPECIES_ART[id] ?? renard;
}
