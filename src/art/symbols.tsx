// Symboles imprimés sous l'encre des tickets (BRIEF.md, section 7.10).
//
// Un symbole par case à gratter. viewBox 0 0 48 48, fond transparent, le dessin
// tient dans le carré de 4 à 44. Il doit se reconnaître d'un coup d'œil à 28 px de
// côté : une forme pleine, deux ou trois couleurs, pas de détail fin.
// Clés : « famille:identifiant ».

import { C, Svg, shade, type Art } from "./kit";

/** Bandit Manchot : la cerise. */
const banditCerise: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M17 30Q20 14 34 8M31 30Q30 16 34 8" fill="none" stroke={C.feuille} strokeWidth="3" strokeLinecap="round" />
    <path d="M34 8Q44 6 44 16Q36 18 34 8Z" fill={C.vert} />
    <circle cx="16" cy="33" r="10" fill={C.cerise} />
    <circle cx="32" cy="34" r="10" fill={C.cerise} />
    <path d="M32 44A10 10 0 0 0 41 30A10 10 0 0 1 26 42A10 10 0 0 0 32 44Z" fill={shade(C.cerise, -0.3)} />
    <circle cx="12" cy="29" r="3" fill={C.ceriseClair} />
  </Svg>
);

/**
 * Signe du Homard : la constellation du homard. Les constellations sont imprimées
 * sur un ciel de nuit : étoiles mimosa reliées par un trait fin écume.
 */
const constellationHomard: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 42L24 30L24 18L16 10L8 12M24 18L32 10L40 12M24 30L15 34M24 30L33 34M16 10L12 4M32 10L36 4" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="24" cy="42" r="2.6" />
      <circle cx="24" cy="30" r="3.2" />
      <circle cx="24" cy="18" r="3.6" />
      <circle cx="16" cy="10" r="2.6" />
      <circle cx="32" cy="10" r="2.6" />
      <circle cx="8" cy="12" r="2.2" />
      <circle cx="40" cy="12" r="2.2" />
      <circle cx="12" cy="4" r="1.8" />
      <circle cx="36" cy="4" r="1.8" />
      <circle cx="15" cy="34" r="2" />
      <circle cx="33" cy="34" r="2" />
    </g>
  </Svg>
);

/**
 * Clés attendues :
 * - constellation:homard, chouette, tortue, paon, hippocampe, cerf, baleine, papillon,
 *   lievre, cygne, abeille, escargot
 * - bandit:cloche, cerise, citron, trefle, fer-a-cheval, etoile, sept, diamant, couronne, manchot
 * - pie:bouton, perle, amethyste, topaze, aigue-marine, saphir, emeraude, rubis, diamant,
 *   etoile-de-diamants
 * - mets:caviar, champagne, homard, truffe, macaron, huitre
 * - morpion:truffe, gland, moustache, monocle
 * - carte:pique, coeur, carreau, trefle (les enseignes), carte:valet (un lièvre),
 *   carte:dame (une chatte), carte:roi (un ours)
 * - regate:voilier, regate:bouee, foot:ballon, course:drapeau
 */
export const SYMBOLS: Record<string, Art> = {
  "bandit:cerise": banditCerise,
  "constellation:homard": constellationHomard,
};
