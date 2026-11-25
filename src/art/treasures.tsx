// Les trésors de la Galerie Archibald (BRIEF.md, annexe A).
//
// Un objet posé, vu de face. viewBox 0 0 100 100. L'objet tient entre y = 8 et
// y = 90 ; une ombre plate au sol vers y = 92. Fond transparent : l'objet est
// exposé sur une console dans le domaine, et sur une étiquette ivoire en boutique.

import { C, Svg, shade, type Art } from "./kit";

const coquillage: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="30" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* La coquille en éventail */}
    <path d="M50 86Q8 70 12 36Q30 10 50 12Q70 10 88 36Q92 70 50 86Z" fill={C.rose} />
    <path d="M50 86Q92 70 88 36Q80 24 68 17Q80 50 50 86Z" fill={shade(C.rose, -0.18)} />
    {/* Les côtes */}
    <path d="M50 84L26 26M50 84L38 16M50 84L50 12M50 84L62 16M50 84L74 26M50 84L15 44M50 84L85 44" fill="none" stroke={C.corail} strokeWidth="2.5" strokeLinecap="round" />
    {/* La charnière */}
    <path d="M38 82H62L58 92H42Z" fill={C.creme} />
    <path d="M50 82H62L58 92H50Z" fill={shade(C.creme, -0.15)} />
  </Svg>
);

/**
 * Identifiants attendus : coquillage, affiche, vase, tableau, statue, oeuf,
 * fresque, diamant.
 */
export const TREASURES: Record<string, Art> = {
  coquillage,
};
