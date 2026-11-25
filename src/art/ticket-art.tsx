// Vignettes des quinze tickets (BRIEF.md, section 7.10).
//
// La vignette est le petit dessin imprimé sur le ticket, à côté de sa promesse :
// la mascotte ou le décor qui lui donne sa tête. viewBox 0 0 100 60, fond
// transparent (le papier du ticket est teinté derrière). Elle se lit à 96 px de
// large comme à 40 px : une silhouette franche, peu de détails.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** La Tirelire de Piou : un cochon-tirelire en faïence, une pièce qui tombe. */
const tirelire: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    <ellipse cx="50" cy="55" rx="30" ry="3" fill={C.nuit} fillOpacity="0.18" />
    {/* Pattes */}
    <rect x="30" y="42" width="9" height="12" rx="3" fill={shade(C.azur, -0.25)} />
    <rect x="58" y="42" width="9" height="12" rx="3" fill={shade(C.azur, -0.25)} />
    {/* Corps en faïence bleue */}
    <ellipse cx="48" cy="32" rx="28" ry="19" fill={C.azur} />
    <path d="M48 51Q76 51 76 32Q76 24 70 19Q72 44 34 49Q40 51 48 51Z" fill={shade(C.azur, -0.2)} />
    {/* Décor blanc de faïence */}
    <circle cx="40" cy="30" r="5" fill={C.blanc} />
    <circle cx="54" cy="38" r="3" fill={C.blanc} />
    {/* Groin, oreille, œil */}
    <rect x="70" y="26" width="12" height="13" rx="5" fill={shade(C.azur, 0.3)} />
    <circle cx="77" cy="32" r="1.6" fill={C.nuit} />
    <path d="M58 16L64 6L70 18Z" fill={shade(C.azur, -0.25)} />
    <circle cx="63" cy="25" r="2" fill={C.nuit} />
    {/* Queue en tire-bouchon */}
    <path d="M20 30Q12 28 15 22Q18 18 21 22" fill="none" stroke={shade(C.azur, -0.25)} strokeWidth="3" strokeLinecap="round" />
    {/* La fente et la pièce */}
    <rect x="40" y="13" width="16" height="3" rx="1.5" fill={C.nuit} />
    <circle cx="48" cy="6" r="6" fill={METAL.or} />
  </Svg>
);

/**
 * Identifiants attendus, ceux des tickets : tirelire, signe-du-homard, tic-tac-truffe,
 * lucarne, reussite, bas-de-laine, vingt-et-un, bandit-manchot, mille-pattes,
 * pie-voleuse, caviar-champagne, grand-prix, regate, moustache-dor, grand-grattouille.
 */
export const TICKET_VIGNETTES: Record<string, Art> = {
  tirelire,
};
