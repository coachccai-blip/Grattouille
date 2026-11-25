// Les cinq lieux de la Promenade (BRIEF.md, section 4.2).
//
// Façade du lieu, vue de face. viewBox 0 0 400 200. Le ciel reste transparent :
// l'écran peint derrière le dégradé du lieu (matin au port, minuit au Cercle).
// Le sol occupe le bas (à partir de y = 170 environ). La façade se lit aussi en
// petit, grisée, quand le lieu est encore fermé : silhouette franche, peu de détails.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Le Kiosque de Gaspard : le port, les mouettes, le store rayé mimosa et blanc. */
const kiosque: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* La mer et le quai */}
    <rect x="0" y="120" width="400" height="56" fill={C.mer} />
    <path d="M0 134H50L58 130L66 134H170L178 130L186 134H300L308 130L316 134H400V139H0Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="172" width="400" height="28" fill={C.pierre} />
    <rect x="0" y="172" width="400" height="6" fill={shade(C.pierre, -0.18)} />
    {/* Une barque */}
    <path d="M40 132H104L96 146H50Z" fill={C.cerise} />
    <rect x="70" y="100" width="4" height="34" fill={C.boisFonce} />
    <path d="M74 102L98 128H74Z" fill={C.blanc} />
    {/* Mouettes */}
    <path d="M300 54Q308 44 316 54Q324 44 332 54Q324 50 316 58Q308 50 300 54Z" fill={C.blanc} />
    <path d="M250 30Q256 22 262 30Q268 22 274 30Q268 27 262 33Q256 27 250 30Z" fill={C.blanc} />
    {/* Le kiosque */}
    <rect x="140" y="92" width="120" height="84" fill={C.persienne} />
    <rect x="220" y="92" width="40" height="84" fill={shade(C.persienne, -0.25)} />
    <rect x="152" y="104" width="96" height="42" fill={C.nuit} />
    <rect x="146" y="146" width="108" height="8" fill={METAL.laiton} />
    {/* Des tickets en vitrine */}
    <rect x="160" y="112" width="18" height="26" rx="2" fill={C.ivoire} />
    <rect x="184" y="112" width="18" height="26" rx="2" fill={C.mimosa} />
    <rect x="208" y="112" width="18" height="26" rx="2" fill={C.bougainvillier} />
    {/* Le store rayé mimosa et blanc */}
    <path d="M124 60H276L290 96H110Z" fill={C.blanc} />
    <path d="M143 60H162L156 96H132ZM181 60H200V96H178ZM219 60H238L246 96H222ZM257 60H276L290 96H268Z" fill={C.mimosa} />
    <path d="M110 96H290V104Q281 110 272 104Q263 110 254 104Q245 110 236 104Q227 110 218 104Q209 110 200 104Q191 110 182 104Q173 110 164 104Q155 110 146 104Q137 110 128 104Q119 110 110 104Z" fill={shade(C.mimosa, -0.18)} />
    {/* Le toit et son fanion */}
    <path d="M150 60L200 34L250 60Z" fill={C.persFonce} />
    <rect x="198" y="14" width="4" height="22" fill={C.nuit} />
    <path d="M202 14L224 20L202 26Z" fill={C.cerise} />
  </Svg>
);

/** Identifiants attendus : kiosque, cafe, casino, salon, cercle. */
export const PLACE_ART: Record<string, Art> = {
  kiosque,
};
