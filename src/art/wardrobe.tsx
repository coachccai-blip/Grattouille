// La garde-robe de la Maison Sidonie : 24 articles (BRIEF.md, section 4.6 et annexe A).
//
// Chaque article est un calque <g> dessiné dans le repère de l'avatar
// (viewBox 0 0 400 480), sans <svg> autour : Avatar.tsx l'empile au bon endroit.
// - `chapeau` : posé sur le crâne. Base à y = 95, largeur utile 170 (x de 115 à 285),
//   rien au-dessus de y = 2.
// - `lunettes` : centrées en (200, 165), un verre par œil, en (165, 165) et (235, 165).
// - `accessoire` : au cou, centré en (200, 290).
// - `tenue` : couvre tout ce qui est sous y = 290. Partir de la silhouette BUSTE et
//   laisser le cou visible ; `clipPath="url(#av-buste)"` découpe un motif aux épaules.
//
// `thumb` recadre la vignette de boutique quand le cadrage par défaut de
// l'emplacement ne convient pas (voir THUMB_BY_SLOT dans Avatar.tsx).

import type { ReactNode } from "react";
import { BUSTE, C, shade } from "./kit";

export interface WardrobeArt {
  Layer: () => ReactNode;
  /** viewBox de la vignette : « x y largeur hauteur ». */
  thumb?: string;
}

const beret: WardrobeArt = {
  Layer: () => (
    <g>
      <path d="M104 100Q96 40 200 34Q304 40 296 100Q250 114 200 112Q150 114 104 100Z" fill={C.marine} />
      {/* Ombre : la même forme, plus sombre, décalée en bas à droite. */}
      <path d="M296 100Q250 114 200 112Q150 114 104 100Q150 104 200 102Q262 100 290 70Q298 84 296 100Z" fill={shade(C.marine, -0.3)} />
      <path d="M112 96Q200 122 288 96L290 108Q200 132 110 108Z" fill={shade(C.marine, -0.45)} />
      <circle cx="200" cy="30" r="11" fill={C.cerise} />
      <circle cx="203" cy="33" r="7" fill={shade(C.cerise, -0.25)} />
    </g>
  ),
};

const lunettesRondes: WardrobeArt = {
  Layer: () => (
    <g>
      <circle cx="165" cy="165" r="25" fill={C.blanc} fillOpacity="0.28" />
      <circle cx="235" cy="165" r="25" fill={C.blanc} fillOpacity="0.28" />
      <circle cx="165" cy="165" r="25" fill="none" stroke={C.noir} strokeWidth="6" />
      <circle cx="235" cy="165" r="25" fill="none" stroke={C.noir} strokeWidth="6" />
      <path d="M190 162Q200 154 210 162" fill="none" stroke={C.noir} strokeWidth="6" strokeLinecap="round" />
      <path d="M140 160L112 150M260 160L288 150" fill="none" stroke={C.noir} strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
};

const mariniere: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={BUSTE} fill={C.craie} />
      {/* Rayures : le motif de la marinière. */}
      <g clipPath="url(#av-buste)" fill={C.marine}>
        <rect x="60" y="352" width="280" height="12" />
        <rect x="60" y="382" width="280" height="12" />
        <rect x="60" y="412" width="280" height="12" />
        <rect x="60" y="442" width="280" height="12" />
        <rect x="60" y="472" width="280" height="12" />
      </g>
      {/* Encolure bateau. */}
      <path d="M140 320Q200 352 260 320L268 332Q200 368 132 332Z" fill={C.marine} />
      <path d="M330 372V480H300V340Q330 346 330 372Z" fill={C.noir} fillOpacity="0.12" />
    </g>
  ),
};

const noeudPap: WardrobeArt = {
  Layer: () => (
    <g>
      <path d="M200 290L148 262Q140 290 148 318Z" fill={C.cerise} />
      <path d="M200 290L252 262Q260 290 252 318Z" fill={C.cerise} />
      <path d="M200 290L252 318Q258 304 258 290Z" fill={shade(C.cerise, -0.28)} />
      <path d="M200 290L148 318Q142 304 142 290Z" fill={shade(C.cerise, -0.28)} />
      <rect x="188" y="276" width="24" height="28" rx="7" fill={shade(C.cerise, -0.4)} />
    </g>
  ),
};

/**
 * Les articles dessinés, par identifiant du catalogue. Un article absent n'est
 * simplement pas affiché. Identifiants attendus :
 * chapeaux : beret, canotier, melon, haut-de-forme, bicorne, couronne ;
 * lunettes : lunettes-rondes, solaires-ecaille, monocle, lorgnon, solaires-diamants, monocle-saphir ;
 * tenues : mariniere, veston-tweed, trois-pieces, smoking, queue-de-pie, cape-imperiale ;
 * accessoires : noeud-pap, foulard, gousset, perles, tourbillon, sautoir.
 */
export const WARDROBE: Record<string, WardrobeArt> = {
  beret,
  "lunettes-rondes": lunettesRondes,
  mariniere,
  "noeud-pap": noeudPap,
};
