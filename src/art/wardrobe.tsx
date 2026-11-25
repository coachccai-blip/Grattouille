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
import { BUSTE, C, METAL, shade } from "./kit";

export interface WardrobeArt {
  Layer: () => ReactNode;
  /** viewBox de la vignette : « x y largeur hauteur ». */
  thumb?: string;
}

/** Le noir des feutres et des draps : un ton au-dessus de `noir`, qui lui sert d'ombre. */
const NOIR_DOUX = "#333B41";
/** L'ombre du flanc droit, la même pour toutes les tenues. */
const OMBRE_FLANC = "M330 372V480H300V340Q330 346 330 372Z";

/**
 * Une rangée de pastilles le long d'un tracé : perles, brillants, pois. C'est un
 * tireté de longueur presque nulle à bouts ronds, donc autant de disques pleins.
 * `pas` est l'écart entre deux centres, `strokeWidth` le diamètre.
 */
function pastilles(pas: number, decalage = 0) {
  return {
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: `0.1 ${(pas - 0.1).toFixed(2)}`,
    strokeDashoffset: decalage ? -decalage : undefined,
  } as const;
}

// ---------------------------------------------------------------------------
// Chapeaux

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

const canotier: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Bord plat : la tranche, puis le dessus. */}
      <ellipse cx="200" cy="106" rx="118" ry="19" fill={shade(C.paille, -0.32)} />
      <ellipse cx="200" cy="101" rx="118" ry="19" fill={C.paille} />
      {/* L'ombre de la calotte sur le bord. */}
      <path d="M128 100Q200 118 272 100Q284 106 270 112Q204 128 142 110Z" fill={C.noir} fillOpacity="0.16" />
      {/* Calotte basse à fond plat. */}
      <path d="M128 52Q200 68 272 52V100Q200 118 128 100Z" fill={C.paille} />
      <ellipse cx="200" cy="52" rx="72" ry="8" fill={shade(C.paille, 0.35)} />
      {/* Ruban marine à liseré cerise. */}
      <path d="M128 76Q200 94 272 76V100Q200 118 128 100Z" fill={C.marine} />
      <path d="M128 84Q200 102 272 84V91Q200 109 128 91Z" fill={C.cerise} />
      <path d="M272 52V100Q260 104 248 106V57Q262 55 272 52Z" fill={C.noir} fillOpacity="0.16" />
    </g>
  ),
};

const melon: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Calotte en dôme et son ombre. */}
      <path d="M124 110Q106 16 200 14Q294 16 276 110Q200 128 124 110Z" fill={NOIR_DOUX} />
      <path d="M276 110Q200 128 124 110Q176 112 222 100Q266 86 272 48Q284 78 276 110Z" fill={C.noir} />
      {/* Ruban de gros-grain et son nœud plat. */}
      <path d="M121 84Q200 104 279 84L276 110Q200 128 124 110Z" fill={C.grisFonce} />
      <path d="M279 84L276 110Q262 114 246 116L246 92Q264 89 279 84Z" fill={C.noir} fillOpacity="0.3" />
      <path d="M156 100L141 91L139 107ZM156 100L172 95L170 111ZM151 93L160 94L159 108L150 107Z" fill={C.noir} />
      {/* Reflet du feutre. */}
      <path d="M140 68Q140 34 178 24Q154 42 152 72Z" fill={C.grisFonce} />
      {/* Bord roulé, relevé sur les côtés, et son liseré : il cache le pied de la calotte. */}
      <path d="M86 94Q80 108 98 113Q200 137 302 113Q320 108 314 94Q304 104 290 105Q200 124 110 105Q96 104 86 94Z" fill={C.noir} />
      <path d="M110 105Q200 124 290 105L289 109Q200 128 111 109Z" fill={C.grisFonce} />
    </g>
  ),
};

const hautDeForme: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Fût cintré, plus large en haut ; on voit le fond plat par-dessus. */}
      <path d="M140 111Q150 60 132 13Q200 29 268 13Q250 60 260 111Q200 125 140 111Z" fill={NOIR_DOUX} />
      <ellipse cx="200" cy="13" rx="68" ry="8.5" fill={C.grisFonce} />
      {/* Ombre à droite, lustre de la soie à gauche. */}
      <path d="M268 13Q250 60 260 111Q248 114 234 116Q226 62 242 19Q256 17 268 13Z" fill={C.noir} />
      <path d="M152 19Q166 60 158 100L170 100Q178 62 166 22Z" fill="#5B656C" />
      <path d="M176 24Q186 62 180 100L185 100Q191 62 181 25Z" fill="#5B656C" />
      {/* Ruban de soie : à pois. */}
      <path d="M142 80Q200 94 258 80L260 111Q200 125 140 111Z" fill={C.bordeaux} />
      <path d="M142 80Q200 94 258 80L258.5 85Q200 99 141.5 85Z" fill={shade(C.bordeaux, 0.3)} />
      <path d="M149 95Q200 107 251 95" stroke={shade(C.bordeaux, 0.3)} strokeWidth="4.5" {...pastilles(15)} />
      <path d="M258 80L260 111Q248 114 234 116L233 86Q246 84 258 80Z" fill={C.noir} fillOpacity="0.3" />
      {/* Bord relevé sur les côtés, et son liseré : il cache le pied du fût. */}
      <path d="M88 94Q84 108 102 113Q200 136 298 113Q316 108 312 94Q300 104 288 105Q200 123 112 105Q100 104 88 94Z" fill={C.noir} />
      <path d="M112 105Q200 123 288 105L287 109Q200 127 113 109Z" fill={C.grisFonce} />
    </g>
  ),
  thumb: "80 -10 240 150",
};

const bicorne: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le feutre, porté en bataille, et son ombre. */}
      <path d="M68 118Q74 94 108 80Q150 20 200 20Q250 20 292 80Q326 94 332 118Q298 102 266 106Q200 124 134 106Q102 102 68 118Z" fill={NOIR_DOUX} />
      <path d="M332 118Q298 102 266 106Q200 124 134 106Q186 110 236 96Q282 82 292 80Q326 94 332 118Z" fill={C.noir} />
      {/* Plumetis blanc sur l'arête. */}
      <path d="M110 78Q152 18 200 18Q248 18 290 78" stroke={C.blanc} strokeWidth="14" {...pastilles(9.6)} />
      {/* Galon d'or. */}
      <path d="M82 110Q90 96 116 88Q158 35 200 35Q242 35 284 88Q310 96 318 110" fill="none" stroke={METAL.or} strokeWidth="6" strokeLinecap="round" />
      {/* Glands d'or aux deux cornes. */}
      <path d="M63 118H77L75 138H65Z" fill={METAL.or} />
      <path d="M323 118H337L335 138H325Z" fill={METAL.or} />
      <circle cx="70" cy="117" r="5" fill={METAL.or} />
      <circle cx="330" cy="117" r="5" fill={METAL.or} />
      {/* Ganse, cocarde et bouton. */}
      <path d="M194 66H206L205 106H195Z" fill={METAL.or} />
      <circle cx="200" cy="66" r="20" fill={C.cerise} />
      <circle cx="200" cy="66" r="13" fill={C.blanc} />
      <circle cx="200" cy="66" r="7" fill={C.marine} />
      <circle cx="200" cy="106" r="6" fill={METAL.or} />
    </g>
  ),
  thumb: "44 -22 312 195",
};

/** Un fleuron de la couronne, pointe vers le haut, posé en (0, 0). */
const FLEURON = "M-8 3Q-16 -13 0 -34Q16 -13 8 3Z";

const couronne: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Bonnet de velours : losanges. */}
      <path d="M118 92C100 54 128 28 200 26C272 28 300 54 282 92Q200 112 118 92Z" fill={C.bordeaux} />
      <path d="M152 50l8 11-8 11-8-11ZM248 50l8 11-8 11-8-11ZM176 40l6 9-6 9-6-9ZM224 40l6 9-6 9-6-9Z" fill={C.blanc} fillOpacity="0.22" />
      {/* Trois arches d'or, perlées. */}
      <path d="M112 90C92 50 122 22 200 20V32C134 34 110 56 126 92Z" fill={METAL.or} />
      <path d="M288 90C308 50 278 22 200 20V32C266 34 290 56 274 92Z" fill={METAL.or} />
      <path d="M193 98L196 30H204L207 98Z" fill={METAL.or} />
      <path d="M121 48C133 35 157 27 192 26M279 48C267 35 243 27 208 26" stroke={C.blanc} strokeWidth="5" {...pastilles(10.87)} />
      {/* Le globe et sa croix. */}
      <path d="M197 2H203V7H209V12H203V18H197V12H191V7H197Z" fill={METAL.or} />
      <circle cx="200" cy="25" r="10" fill={METAL.or} />
      {/* Fleurons, une perle à chaque pointe. */}
      <g fill={METAL.or}>
        <path d={FLEURON} transform="translate(124 90) rotate(-12)" />
        <path d={FLEURON} transform="translate(161 97)" />
        <path d={FLEURON} transform="translate(200 100)" />
        <path d={FLEURON} transform="translate(239 97)" />
        <path d={FLEURON} transform="translate(276 90) rotate(12)" />
      </g>
      <g fill={C.blanc}>
        <circle cx="117" cy="56" r="5" />
        <circle cx="161" cy="62" r="5" />
        <circle cx="200" cy="65" r="5.5" />
        <circle cx="239" cy="62" r="5" />
        <circle cx="283" cy="56" r="5" />
      </g>
      {/* Bandeau d'or massif : tranche sombre en bas, filet clair en haut. */}
      <path d="M112 86Q200 108 288 86L290 110Q200 134 110 110Z" fill={METAL.or} />
      <path d="M110 104Q200 128 290 104V110Q200 134 110 110Z" fill={C.noir} fillOpacity="0.28" />
      <path d="M112 86Q200 108 288 86V90Q200 112 112 90Z" fill={C.blanc} fillOpacity="0.55" />
      {/* Rubis, saphirs, émeraudes, brillants. */}
      <ellipse cx="200" cy="109" rx="10" ry="9" fill={C.cerise} />
      <ellipse cx="160" cy="106" rx="8" ry="7" fill={C.azur} />
      <ellipse cx="240" cy="106" rx="8" ry="7" fill={C.azur} />
      <circle cx="126" cy="100" r="6.5" fill={C.persienne} />
      <circle cx="274" cy="100" r="6.5" fill={C.persienne} />
      <g fill={C.blanc} fillOpacity="0.55">
        <ellipse cx="197" cy="106" rx="4" ry="3" />
        <ellipse cx="158" cy="104" rx="3" ry="2.2" />
        <ellipse cx="238" cy="104" rx="3" ry="2.2" />
        <circle cx="124.5" cy="98.5" r="2" />
        <circle cx="272.5" cy="98.5" r="2" />
      </g>
      <g fill={C.blanc}>
        <circle cx="143" cy="103.5" r="3.5" />
        <circle cx="180" cy="108" r="3.5" />
        <circle cx="220" cy="108" r="3.5" />
        <circle cx="257" cy="103.5" r="3.5" />
      </g>
    </g>
  ),
  thumb: "80 -10 240 150",
};

// ---------------------------------------------------------------------------
// Lunettes

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

/** Les deux verres des solaires en écaille. */
const VERRES_ECAILLE = "M134 146Q135 139 144 139L187 141Q196 142 196 151V166Q196 192 168 192H160Q134 192 133 164ZM266 146Q265 139 256 139L213 141Q204 142 204 151V166Q204 192 232 192H240Q266 192 267 164Z";

const solairesEcaille: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={VERRES_ECAILLE} fill="#33261C" />
      <path d="M142 147H160L148 176H138ZM212 149H230L218 176H209Z" fill={C.blanc} fillOpacity="0.2" />
      {/* Monture : un trait ambre, moucheté de brun et de miel pour l'écaille. */}
      <path d="M134 150L108 144M266 150L292 144M196 153Q200 148 204 153" fill="none" stroke="#A9601F" strokeWidth="7" strokeLinecap="round" />
      <path d={VERRES_ECAILLE} fill="none" stroke="#A9601F" strokeWidth="7" strokeLinejoin="round" />
      <path d={VERRES_ECAILLE} fill="none" stroke="#4E2A12" strokeWidth="7" strokeDasharray="11 8 5 15 8 19" />
      <path d={VERRES_ECAILLE} fill="none" stroke="#E3A44E" strokeWidth="4" strokeDasharray="5 28 3 37" strokeDashoffset="-13" />
    </g>
  ),
};

const monocle: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Cordon de soie, jusqu'à la boutonnière. */}
      <path d="M258 181Q292 250 252 334" fill="none" stroke={C.noir} strokeWidth="3" strokeLinecap="round" />
      <circle cx="252" cy="337" r="5" fill={METAL.laiton} />
      <circle cx="235" cy="165" r="27" fill={C.blanc} fillOpacity="0.3" />
      <path d="M217 160Q221 147 234 145Q225 151 222 162Z" fill={C.blanc} fillOpacity="0.8" />
      <circle cx="235" cy="165" r="27" fill="none" stroke={METAL.laiton} strokeWidth="6" />
    </g>
  ),
  thumb: "145 120 180 90",
};

const lorgnon: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Chaînette d'or, de l'anneau à la boutonnière. */}
      <path d="M266 169Q300 250 256 336" fill="none" stroke={METAL.or} strokeWidth="3" strokeDasharray="5 3" />
      <circle cx="256" cy="339" r="6" fill={METAL.or} />
      <ellipse cx="165" cy="165" rx="23" ry="21" fill={C.blanc} fillOpacity="0.3" />
      <ellipse cx="235" cy="165" rx="23" ry="21" fill={C.blanc} fillOpacity="0.3" />
      <path d="M149 160Q152 149 163 148Q155 153 153 162ZM219 160Q222 149 233 148Q225 153 223 162Z" fill={C.blanc} fillOpacity="0.8" />
      <ellipse cx="165" cy="165" rx="23" ry="21" fill="none" stroke={METAL.or} strokeWidth="5" />
      <ellipse cx="235" cy="165" rx="23" ry="21" fill="none" stroke={METAL.or} strokeWidth="5" />
      {/* Le ressort qui pince le nez, puis l'anneau de la chaînette. */}
      <path d="M187 156Q200 132 213 156" fill="none" stroke={METAL.or} strokeWidth="5" strokeLinecap="round" />
      <circle cx="264" cy="165" r="5" fill="none" stroke={METAL.or} strokeWidth="3" />
    </g>
  ),
};

/** Les deux verres papillon des solaires serties. */
const VERRES_PAPILLON = "M196 152Q196 142 186 141L150 138Q132 136 120 126Q122 150 130 168Q140 192 168 192Q196 192 196 164ZM204 152Q204 142 214 141L250 138Q268 136 280 126Q278 150 270 168Q260 192 232 192Q204 192 204 164Z";
/** Un brillant taillé en losange, posé en (0, 0) : le blanc, la culasse glacée, sa facette à l'ombre. */
const BRILLANT = "M0 -10L9 0L0 10L-9 0Z";
const BRILLANT_CULASSE = "M-9 0H9L0 10Z";
const BRILLANT_OMBRE = "M0 0H9L0 10Z";

const solairesDiamants: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={VERRES_PAPILLON} fill="#10283F" />
      <path d="M140 146H158L146 176H134ZM214 148H232L220 176H210Z" fill={C.ciel} fillOpacity="0.3" />
      {/* Monture d'or blanc, pavée de brillants : blancs, puis glacés. */}
      <path d="M124 132L108 128M276 132L292 128M196 151Q200 146 204 151" fill="none" stroke={METAL.argent} strokeWidth="8" strokeLinecap="round" />
      <path d={VERRES_PAPILLON} fill="none" stroke={METAL.argent} strokeWidth="9" strokeLinejoin="round" />
      <path d={VERRES_PAPILLON} stroke={C.blanc} strokeWidth="4.5" {...pastilles(9)} />
      <path d={VERRES_PAPILLON} stroke={C.ciel} strokeWidth="4.5" {...pastilles(9, 4.5)} />
      {/* Trois gros brillants : aux deux pointes et sur le pont. */}
      <g fill={C.blanc}>
        <path d={BRILLANT} transform="translate(121 128)" />
        <path d={BRILLANT} transform="translate(279 128)" />
        <path d={BRILLANT} transform="translate(200 146) scale(0.8)" />
      </g>
      <g fill={C.ciel}>
        <path d={BRILLANT_CULASSE} transform="translate(121 128)" />
        <path d={BRILLANT_CULASSE} transform="translate(279 128)" />
        <path d={BRILLANT_CULASSE} transform="translate(200 146) scale(0.8)" />
      </g>
      <g fill={C.azur}>
        <path d={BRILLANT_OMBRE} transform="translate(121 128)" />
        <path d={BRILLANT_OMBRE} transform="translate(279 128)" />
        <path d={BRILLANT_OMBRE} transform="translate(200 146) scale(0.8)" />
      </g>
    </g>
  ),
  thumb: "90 104 220 110",
};

const monocleSaphir: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Chaîne d'or semée de brillants, saphir en goutte au bout. */}
      <path d="M260 180Q294 250 254 330" fill="none" stroke={METAL.or} strokeWidth="4" />
      <path d="M260 180Q294 250 254 330" stroke={C.blanc} strokeWidth="5" {...pastilles(15, 8)} />
      <path d="M254 328L263 346Q263 356 254 358Q245 356 245 346Z" fill={C.azur} />
      <path d="M254 328L263 346Q263 356 254 358Z" fill={C.marine} />
      {/* Le verre : un saphir taillé. La table, au centre, laisse voir l'œil. */}
      <path d="M260 175L245 190L225 190L210 175L210 155L225 140L245 140L260 155Z" fill={C.azur} fillOpacity="0.55" />
      <path d="M210 155L225 140L230 152L222 160ZM225 140L245 140L240 152L230 152Z" fill={C.ciel} fillOpacity="0.85" />
      <path d="M210 175L210 155L222 160L222 170ZM245 140L260 155L248 160L240 152Z" fill={C.azur} fillOpacity="0.85" />
      <path d="M225 190L210 175L222 170L230 178ZM260 155L260 175L248 170L248 160Z" fill={C.marine} fillOpacity="0.8" />
      <path d="M260 175L245 190L240 178L248 170ZM245 190L225 190L230 178L240 178Z" fill={shade(C.marine, -0.35)} fillOpacity="0.85" />
      {/* Cercle d'or serti de brillants. */}
      <circle cx="235" cy="165" r="28" fill="none" stroke={METAL.or} strokeWidth="8" />
      <circle cx="235" cy="165" r="28" stroke={C.blanc} strokeWidth="4" {...pastilles(8.8)} />
    </g>
  ),
  thumb: "135 115 200 100",
};

// ---------------------------------------------------------------------------
// Tenues

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

/** Une ligne de chevrons d'une épaule à l'autre : le motif du tweed. */
function chevrons(y: number): string {
  let d = `M58 ${y}`;
  for (let i = 0; i < 24; i++) d += `l12 ${i % 2 === 0 ? -10 : 10}`;
  return d;
}

const TWEED = "#A98B5D";

const vestonTweed: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={BUSTE} fill={TWEED} />
      {/* Chevrons : le motif du tweed. */}
      <g clipPath="url(#av-buste)" fill="none" stroke={shade(TWEED, -0.25)} strokeWidth="3">
        {[344, 366, 388, 410, 432, 454, 476].map((y) => (
          <path key={y} d={chevrons(y)} />
        ))}
      </g>
      {/* Gilet de laine, chemise au col ouvert. */}
      <path d="M158 320L200 440L242 320Z" fill={C.olive} />
      <path d="M168 318L200 396L232 318Z" fill={C.craie} />
      <path d="M166 296L200 328L186 348L156 318ZM234 296L200 328L214 348L244 318Z" fill={C.craie} />
      {/* Revers à cran. */}
      <path d="M158 320L124 340L138 358L116 370L200 440ZM242 320L276 340L262 358L284 370L200 440Z" fill={shade(TWEED, -0.25)} />
      {/* Bord du devant, bouton de cuir. */}
      <path d="M199 440H202V480H199Z" fill={shade(TWEED, -0.25)} />
      <circle cx="200" cy="460" r="7" fill={C.boisFonce} />
      <path d={OMBRE_FLANC} fill={C.noir} fillOpacity="0.14" />
    </g>
  ),
};

const DRAP = C.ardoise;

const troisPieces: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={BUSTE} fill={DRAP} />
      {/* Le gilet, entre les deux devants du veston. */}
      <path d="M154 320H246L226 480H174Z" fill={shade(DRAP, 0.16)} />
      {/* Revers à cran. */}
      <path d="M156 320L116 346L132 362L110 374L150 480H176ZM244 320L284 346L268 362L290 374L250 480H224Z" fill={shade(DRAP, -0.24)} />
      {/* Rayures tennis sur tout le drap. */}
      <g clipPath="url(#av-buste)" fill={C.blanc} fillOpacity="0.22">
        {[84, 100, 116, 132, 148, 164, 180, 196, 212, 228, 244, 260, 276, 292, 308].map((x) => (
          <rect key={x} x={x} y="316" width="2" height="170" />
        ))}
      </g>
      {/* Chemise et col fermé. */}
      <path d="M168 316L200 378L232 316Z" fill={C.blanc} />
      <path d="M166 294L200 314L186 340L158 316ZM234 294L200 314L214 340L242 316Z" fill={C.blanc} />
      <path d="M200 314L186 340L190 344L200 326L210 344L214 340Z" fill={C.grisClair} />
      <circle cx="200" cy="346" r="3" fill={C.grisClair} />
      {/* Boutons du gilet, pochette. */}
      <g fill={METAL.laiton}>
        <circle cx="200" cy="398" r="5" />
        <circle cx="200" cy="426" r="5" />
        <circle cx="200" cy="454" r="5" />
      </g>
      <path d="M286 406L290 390L298 399L305 388L312 404Z" fill={C.blanc} />
      <path d={OMBRE_FLANC} fill={C.noir} fillOpacity="0.14" />
    </g>
  ),
};

const smoking: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={BUSTE} fill={NOIR_DOUX} />
      {/* Plastron plissé et ses boutons d'or. */}
      <path d="M160 312H240L236 400L200 458L164 400Z" fill={C.blanc} />
      <path d="M186 322L190 420M214 322L210 420" fill="none" stroke={C.grisClair} strokeWidth="2" />
      <g fill={METAL.or}>
        <circle cx="200" cy="338" r="3.5" />
        <circle cx="200" cy="366" r="3.5" />
        <circle cx="200" cy="394" r="3.5" />
      </g>
      {/* Col cassé. */}
      <path d="M164 288Q200 300 236 288L240 314H160Z" fill={C.blanc} />
      {/* Revers châle en satin, un reflet sur chacun. */}
      <path d="M158 314Q112 352 136 400Q160 436 200 456Q172 420 168 376Q166 340 174 314ZM242 314Q288 352 264 400Q240 436 200 456Q228 420 232 376Q234 340 226 314Z" fill={C.noir} />
      <path d="M150 334Q126 362 142 398Q136 364 156 340ZM240 334Q246 366 236 396Q252 366 246 338Z" fill={C.grisClair} fillOpacity="0.4" />
      <circle cx="200" cy="470" r="6" fill={C.noir} />
      {/* Le nœud noir : plus petit que `noeud-pap`, qui le recouvre entièrement s'il est porté. */}
      <path d="M200 293L160 281.5Q155 293 160 304.5ZM200 293L240 281.5Q245 293 240 304.5Z" fill={C.noir} />
      <rect x="191" y="284" width="18" height="18" rx="5" fill={NOIR_DOUX} />
      {/* Œillet à la boutonnière, pochette. */}
      <circle cx="268" cy="362" r="9" fill={C.cerise} />
      <circle cx="270" cy="364" r="5" fill={C.noir} fillOpacity="0.28" />
      <path d="M272 412H300V420H272Z" fill={C.blanc} />
      <path d={OMBRE_FLANC} fill={C.noir} fillOpacity="0.3" />
    </g>
  ),
};

const queueDePie: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={BUSTE} fill={NOIR_DOUX} />
      {/* Plastron et gilet de piqué blanc. */}
      <path d="M158 314H242L236 428L244 480H156L164 428Z" fill={C.blanc} />
      <path d="M162 432Q200 464 238 432L244 480H156Z" fill={C.craie} />
      <path d="M162 432Q200 464 238 432L239 438Q200 470 161 438Z" fill={C.grisClair} />
      <g fill={METAL.or}>
        <circle cx="200" cy="340" r="3.5" />
        <circle cx="200" cy="368" r="3.5" />
        <circle cx="200" cy="396" r="3.5" />
        <circle cx="200" cy="472" r="4.5" />
      </g>
      {/* Col cassé. */}
      <path d="M164 288Q200 300 236 288L239 318H161Z" fill={C.craie} />
      {/* Revers de satin, en pointe. */}
      <path d="M158 314L126 332L140 346L106 338L164 430ZM242 314L274 332L260 346L294 338L236 430Z" fill={C.noir} />
      {/* Broderies d'or : une branche de laurier sur chaque revers, un galon au bord des devants. */}
      <path d="M158 416Q138 388 116 356M242 416Q262 388 284 356" fill="none" stroke={METAL.or} strokeWidth="2.5" strokeLinecap="round" />
      <g fill={METAL.or}>
        <ellipse cx="154" cy="398" rx="9" ry="4" transform="rotate(-20 154 398)" />
        <ellipse cx="143" cy="404" rx="9" ry="4" transform="rotate(80 143 404)" />
        <ellipse cx="141" cy="378" rx="9" ry="4" transform="rotate(-24 141 378)" />
        <ellipse cx="130" cy="386" rx="9" ry="4" transform="rotate(84 130 386)" />
        <ellipse cx="128" cy="360" rx="8" ry="3.5" transform="rotate(-28 128 360)" />
        <ellipse cx="116" cy="366" rx="8" ry="3.5" transform="rotate(88 116 366)" />
        <ellipse cx="246" cy="398" rx="9" ry="4" transform="rotate(20 246 398)" />
        <ellipse cx="257" cy="404" rx="9" ry="4" transform="rotate(-80 257 404)" />
        <ellipse cx="259" cy="378" rx="9" ry="4" transform="rotate(24 259 378)" />
        <ellipse cx="270" cy="386" rx="9" ry="4" transform="rotate(-84 270 386)" />
        <ellipse cx="272" cy="360" rx="8" ry="3.5" transform="rotate(28 272 360)" />
        <ellipse cx="284" cy="366" rx="8" ry="3.5" transform="rotate(-88 284 366)" />
        <path d="M164 430L156 480H150L158 430ZM236 430L244 480H250L242 430Z" />
        <circle cx="134" cy="446" r="6" />
        <circle cx="130" cy="472" r="6" />
        <circle cx="266" cy="446" r="6" />
        <circle cx="270" cy="472" r="6" />
      </g>
      {/* Le nœud blanc : plus petit que `noeud-pap`, qui le recouvre entièrement s'il est porté. */}
      <path d="M200 293L160 281.5Q155 293 160 304.5ZM200 293L240 281.5Q245 293 240 304.5Z" fill={C.blanc} />
      <path d="M200 293L160 304.5Q157.5 299 157.5 293ZM200 293L240 304.5Q242.5 299 242.5 293Z" fill={C.grisClair} />
      <rect x="191" y="284" width="18" height="18" rx="5" fill={C.craie} />
      <path d={OMBRE_FLANC} fill={C.noir} fillOpacity="0.3" />
    </g>
  ),
};

/** Une moucheture d'hermine, posée en (0, 0). */
const MOUCHETURE = "M0 -7Q4 0 3 7L0 4L-3 7Q-4 0 0 -7Z";
const VELOURS = C.bordeaux;

const capeImperiale: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le velours, plus large que les épaules. */}
      <path d="M44 480Q40 380 76 334Q120 310 200 310Q280 310 324 334Q360 380 356 480Z" fill={VELOURS} />
      {/* Losanges : le motif du velours. Un sur deux est brodé d'or. */}
      <path d="M96 394l10 14-10 14-10-14ZM136 434l10 14-10 14-10-14ZM304 394l10 14-10 14-10-14ZM264 434l10 14-10 14-10-14ZM66 440l10 14-10 14-10-14ZM334 440l10 14-10 14-10-14Z" fill={C.blanc} fillOpacity="0.2" />
      <path d="M136 388l8 11-8 11-8-11ZM98 442l8 11-8 11-8-11ZM264 388l8 11-8 11-8-11ZM302 442l8 11-8 11-8-11Z" fill={METAL.or} />
      <path d="M356 480Q360 380 324 334Q334 400 326 480Z" fill={C.noir} fillOpacity="0.25" />
      {/* Les deux bords d'hermine qui se rejoignent devant, galonnés d'or. */}
      <path d="M168 380H232L240 480H160Z" fill={C.blanc} />
      <path d="M166 384L158 480H152L160 384ZM234 384L242 480H248L240 384Z" fill={METAL.or} />
      <path d="M199 392H201V480H199Z" fill={C.grisClair} />
      {/* Grand col d'hermine et son ombre. */}
      <path d="M64 354Q104 312 160 296Q200 318 240 296Q296 312 336 354Q340 382 322 390Q262 372 200 406Q138 372 78 390Q60 382 64 354Z" fill={C.blanc} />
      <path d="M336 354Q340 382 322 390Q262 372 200 406Q138 372 78 390Q140 364 200 394Q264 362 326 378Q334 368 336 354Z" fill={C.grisClair} />
      <g fill={C.noir}>
        <path d={MOUCHETURE} transform="translate(96 356)" />
        <path d={MOUCHETURE} transform="translate(128 338)" />
        <path d={MOUCHETURE} transform="translate(148 366)" />
        <path d={MOUCHETURE} transform="translate(168 324)" />
        <path d={MOUCHETURE} transform="translate(232 324)" />
        <path d={MOUCHETURE} transform="translate(252 366)" />
        <path d={MOUCHETURE} transform="translate(272 338)" />
        <path d={MOUCHETURE} transform="translate(304 356)" />
        <path d={MOUCHETURE} transform="translate(182 432)" />
        <path d={MOUCHETURE} transform="translate(218 454)" />
        <path d={MOUCHETURE} transform="translate(184 472)" />
      </g>
      {/* Agrafe : une navette d'or, un rubis, deux brillants. Assez étroite pour laisser passer un collier. */}
      <path d="M174 354Q187 338 200 338Q213 338 226 354Q213 370 200 370Q187 370 174 354Z" fill={METAL.or} />
      <path d="M200 343l9 11-9 11-9-11Z" fill={C.cerise} />
      <path d="M200 343l9 11-9 11Z" fill={C.noir} fillOpacity="0.25" />
      <circle cx="183" cy="354" r="3" fill={C.blanc} />
      <circle cx="217" cy="354" r="3" fill={C.blanc} />
    </g>
  ),
  thumb: "30 266 340 214",
};

// ---------------------------------------------------------------------------
// Accessoires

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

const foulard: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Les deux pans, sous le nœud. */}
      <path d="M204 302L180 346L206 342L222 306Z" fill={C.bougFonce} />
      <path d="M212 300L238 350L256 332L228 296Z" fill={C.bougainvillier} />
      {/* Le tour de cou et son ombre. */}
      <path d="M156 265Q200 285 244 265L248 302Q200 326 152 302Z" fill={C.bougainvillier} />
      <path d="M248 302Q200 326 152 302Q200 314 246 291Z" fill={C.bougFonce} />
      {/* Le nœud, sur le côté. */}
      <ellipse cx="215" cy="303" rx="14" ry="12" fill={C.bougainvillier} />
      <ellipse cx="217" cy="305" rx="9" ry="7" fill={C.bougFonce} />
      {/* Pois : le motif de la soie. */}
      <g fill={C.ivoire}>
        <circle cx="168" cy="282" r="3.5" />
        <circle cx="186" cy="292" r="3.5" />
        <circle cx="206" cy="284" r="3.5" />
        <circle cx="232" cy="280" r="3.5" />
        <circle cx="198" cy="328" r="3.5" />
        <circle cx="232" cy="320" r="3.5" />
        <circle cx="243" cy="338" r="3.5" />
      </g>
    </g>
  ),
  thumb: "124 254 160 110",
};

const gousset: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Chaîne à maillons, bélière et remontoir. */}
      <path d="M168 263Q175 300 200 314Q225 300 232 263" fill="none" stroke={METAL.laiton} strokeWidth="4" strokeDasharray="7 3" />
      <circle cx="200" cy="313" r="6" fill="none" stroke={METAL.laiton} strokeWidth="3.5" />
      <rect x="194" y="317" width="12" height="8" rx="2" fill={METAL.laiton} />
      {/* Boîtier et son ombre, cadran, aiguilles. */}
      <circle cx="203" cy="350" r="25" fill={C.noir} fillOpacity="0.35" />
      <circle cx="200" cy="346" r="25" fill={METAL.laiton} />
      <circle cx="200" cy="346" r="19" fill={C.ivoire} />
      <path d="M200 329V334M200 358V363M183 346H188M212 346H217" fill="none" stroke={C.nuit} strokeWidth="2.5" />
      <path d="M200 346V334M200 346L209 351" fill="none" stroke={C.nuit} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  thumb: "120 268 160 110",
};

/** Les onze perles du collier : x, y, rayon. Les plus grosses au milieu. */
const PERLES: readonly (readonly [number, number, number])[] = [
  [165, 288, 5], [165.9, 299.4, 5.5], [169.1, 311.4, 6], [175.3, 323.4, 6.5], [185.4, 333.5, 7], [200, 338, 7.5],
  [214.6, 333.5, 7], [224.7, 323.4, 6.5], [230.9, 311.4, 6], [234.1, 299.4, 5.5], [235, 288, 5],
];
const NACRE = "#F7F0E3";

const perles: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Chaque perle : son ombre décalée, la nacre, un reflet. */}
      <g fill="#BFAE9B">
        {PERLES.map(([x, y, r]) => (
          <circle key={x} cx={x + 1.2} cy={y + 1.8} r={r + 1} />
        ))}
      </g>
      <g fill={NACRE}>
        {PERLES.map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g fill={C.blanc}>
        {PERLES.map(([x, y, r]) => (
          <circle key={x} cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.3} />
        ))}
      </g>
    </g>
  ),
  thumb: "120 258 160 110",
};

const tourbillon: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Chaîne d'or, bélière, remontoir à cabochon. */}
      <path d="M168 263Q175 298 200 312Q225 298 232 263" fill="none" stroke={METAL.or} strokeWidth="3.5" />
      <circle cx="200" cy="311" r="6" fill="none" stroke={METAL.or} strokeWidth="3.5" />
      <rect x="194" y="314" width="12" height="9" rx="2" fill={METAL.or} />
      <circle cx="200" cy="318" r="3" fill={C.marine} />
      {/* Boîtier d'or et son ombre, lunette sertie de brillants, cadran bleu. */}
      <circle cx="203" cy="352" r="28" fill={C.noir} fillOpacity="0.35" />
      <circle cx="200" cy="348" r="28" fill={METAL.or} />
      <circle cx="200" cy="348" r="24" stroke={C.blanc} strokeWidth="4" {...pastilles(7.54)} />
      <circle cx="200" cy="348" r="20" fill={C.marine} />
      {/* La cage du tourbillon, visible à six heures : pont, roue, rubis. */}
      <circle cx="200" cy="357" r="9" fill={C.nuit} />
      <circle cx="200" cy="357" r="6" fill="none" stroke={C.grisClair} strokeWidth="2" />
      <path d="M200 351V363M194.8 354L205.2 360M194.8 360L205.2 354" fill="none" stroke={C.grisClair} strokeWidth="1.5" />
      <circle cx="200" cy="357" r="2.2" fill={C.cerise} />
      {/* Aiguilles et index. */}
      <path d="M200 343L191 335M200 343L211 339" fill="none" stroke={METAL.or} strokeWidth="2.5" strokeLinecap="round" />
      <g fill={C.blanc}>
        <circle cx="200" cy="332" r="1.7" />
        <circle cx="184" cy="348" r="1.7" />
        <circle cx="216" cy="348" r="1.7" />
      </g>
    </g>
  ),
  thumb: "120 274 160 110",
};

/** La grande courbe du sautoir, du cou au milieu de la poitrine. */
const RANG_SAUTOIR = "M169 263C146 326 168 384 200 404C232 384 254 326 231 263";
/** Les six gros brillants du rang : où les poser. */
const STATIONS_SAUTOIR = [
  "translate(160 301) rotate(6) scale(1.15)", "translate(162 339) rotate(-10) scale(1.15)", "translate(174.5 376) rotate(-30) scale(1.15)",
  "translate(240 301) rotate(-6) scale(1.15)", "translate(238 339) rotate(10) scale(1.15)", "translate(225.5 376) rotate(30) scale(1.15)",
];
/** Un éclat à quatre branches, posé en (0, 0). */
const ECLAT = "M0 -9Q1 -1 9 0Q1 1 0 9Q-1 1 -9 0Q-1 -1 0 -9Z";

const sautoir: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le rang : un fil de platine, des brillants blancs et glacés en alternance. */}
      <path d={RANG_SAUTOIR} fill="none" stroke={METAL.argent} strokeWidth="3" />
      <path d={RANG_SAUTOIR} stroke={METAL.argent} strokeWidth="10" {...pastilles(12.91)} />
      <path d={RANG_SAUTOIR} stroke={C.blanc} strokeWidth="7.5" {...pastilles(12.91)} />
      <path d={RANG_SAUTOIR} stroke={C.ciel} strokeWidth="5.5" {...pastilles(12.91, 6.45)} />
      {/* Six gros brillants taillés en losange, sertis de platine. */}
      <g fill={METAL.argent}>
        {STATIONS_SAUTOIR.map((t) => (
          <path key={t} d="M0 -12.5L11.5 0L0 12.5L-11.5 0Z" transform={t} />
        ))}
      </g>
      <g fill={C.blanc}>
        {STATIONS_SAUTOIR.map((t) => (
          <path key={t} d={BRILLANT} transform={t} />
        ))}
      </g>
      <g fill={C.ciel}>
        {STATIONS_SAUTOIR.map((t) => (
          <path key={t} d={BRILLANT_CULASSE} transform={t} />
        ))}
      </g>
      <g fill={C.azur}>
        {STATIONS_SAUTOIR.map((t) => (
          <path key={t} d={BRILLANT_OMBRE} transform={t} />
        ))}
      </g>
      {/* Le pendant : un diamant poire monté sur platine, et son ombre. */}
      <circle cx="200" cy="406" r="6" fill={METAL.argent} />
      <path d="M203 413L221 443Q221 461 203 465Q185 461 185 443Z" fill={C.azur} />
      <path d="M200 410L218 440Q218 458 200 462Q182 458 182 440Z" fill={C.blanc} />
      <path d="M200 410L218 440Q218 458 200 462Z" fill={C.ciel} />
      <path d="M200 426L211 441L200 462L189 441Z" fill={C.ciel} />
      <path d="M200 426L211 441L200 462Z" fill={C.azur} />
      {/* Deux éclats. */}
      <path d={ECLAT} transform="translate(226 422)" fill={C.blanc} />
      <path d={ECLAT} transform="translate(148 320) scale(0.7)" fill={C.blanc} />
    </g>
  ),
  thumb: "60 256 280 216",
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
  canotier,
  melon,
  "haut-de-forme": hautDeForme,
  bicorne,
  couronne,
  "lunettes-rondes": lunettesRondes,
  "solaires-ecaille": solairesEcaille,
  monocle,
  lorgnon,
  "solaires-diamants": solairesDiamants,
  "monocle-saphir": monocleSaphir,
  mariniere,
  "veston-tweed": vestonTweed,
  "trois-pieces": troisPieces,
  smoking,
  "queue-de-pie": queueDePie,
  "cape-imperiale": capeImperiale,
  "noeud-pap": noeudPap,
  foulard,
  gousset,
  perles,
  tourbillon,
  sautoir,
};
