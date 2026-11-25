// Les résidences de l'Agence Colette, et le décor de départ (BRIEF.md, section 9.4 et annexe A).
//
// Décor du domaine, vu de face. viewBox 0 0 400 260. Le sol occupe le bas de
// l'image (ligne d'horizon vers y = 200) ; le ciel reste transparent, il est
// peint par l'écran avec le dégradé du meilleur lieu débloqué. L'avatar se tient
// devant, au centre : garder le milieu bas dégagé de tout détail important.
// `banc` : sans résidence, le banc du port avec une valise.
//
// Une seule animation d'ambiance par décor, lente. Elle est jouée par la feuille de
// style : il suffit de poser UNE de ces classes sur UN élément ou groupe du dessin.
//   amb-scintille : la mer, une vitre, une étoile (l'opacité respire)
//   amb-flotte    : un fanion, un drapeau, du linge (léger balancement)
//   amb-vacille   : une lampe, une lanterne (la lumière tremble)

import { C, Svg, shade, type Art } from "./kit";

const banc: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et le quai */}
    <rect x="0" y="150" width="400" height="60" fill={C.mer} />
    <path className="amb-scintille" d="M0 162H60L70 158L80 162H190L200 158L210 162H330L340 158L350 162H400V168H0Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
    <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
    {/* Un voilier au loin */}
    <path d="M296 150L296 104L326 150Z" fill={C.blanc} />
    <path d="M292 150L292 116L272 150Z" fill={C.craie} />
    <path d="M266 152H332L324 162H274Z" fill={C.cerise} />
    {/* Réverbère */}
    <rect x="62" y="70" width="8" height="150" fill={C.nuit} />
    <path d="M52 220H80L76 208H56Z" fill={C.nuit} />
    <path d="M50 70H82L76 44H56Z" fill={C.mimosa} />
    <path d="M66 44H76L82 70H66Z" fill={shade(C.mimosa, -0.2)} />
    <rect x="48" y="66" width="36" height="6" fill={C.nuit} />
    {/* Le banc */}
    <rect x="118" y="168" width="164" height="12" rx="3" fill={C.bois} />
    <rect x="118" y="186" width="164" height="12" rx="3" fill={C.bois} />
    <rect x="112" y="204" width="176" height="12" rx="3" fill={C.bois} />
    <rect x="118" y="174" width="164" height="6" fill={shade(C.bois, -0.22)} />
    <rect x="118" y="192" width="164" height="6" fill={shade(C.bois, -0.22)} />
    <rect x="112" y="210" width="176" height="6" fill={shade(C.bois, -0.22)} />
    <rect x="128" y="162" width="10" height="78" fill={C.nuit} />
    <rect x="262" y="162" width="10" height="78" fill={C.nuit} />
    {/* La valise, posée à droite du banc */}
    <rect x="306" y="196" width="58" height="44" rx="6" fill={C.terracotta} />
    <rect x="336" y="196" width="28" height="44" rx="6" fill={shade(C.terracotta, -0.22)} />
    <rect x="306" y="212" width="58" height="6" fill={C.boisFonce} />
    <path d="M324 196V186Q335 178 346 186V196" fill="none" stroke={C.boisFonce} strokeWidth="5" />
    <ellipse cx="335" cy="244" rx="36" ry="4" fill={C.nuit} fillOpacity="0.18" />
  </Svg>
);

/**
 * Identifiants attendus : banc (décor de départ), chambre-de-bonne, studio,
 * appartement, maison-pecheur, loft, villa-mimosas, hotel-particulier,
 * villa-corniche, chateau, ile, et kiosque (le Kiosque de Gaspard, racheté à la fin).
 */
export const RESIDENCES: Record<string, Art> = {
  banc,
};
