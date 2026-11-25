// Symboles imprimés sous l'encre des tickets (BRIEF.md, section 7.10).
//
// Un symbole par case à gratter. viewBox 0 0 48 48, fond transparent, le dessin
// tient dans le carré de 4 à 44. Il doit se reconnaître d'un coup d'œil à 28 px de
// côté : une forme pleine, deux ou trois couleurs, pas de détail fin.
// Clés : « famille:identifiant ».

import { C, METAL, Svg, shade, type Art } from "./kit";

// ---------------------------------------------------------------------------
// Signe du Homard : les douze constellations, sur un ciel de nuit

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

/** La chouette, de face, sur sa branche : la tête ronde, sans aigrettes, deux gros yeux, le masque en cœur. */
const constellationChouette: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 5L34.5 9L39.5 20L35 32L24 40.5L13 32L8.5 20L13.5 9ZM24 5L17.5 18L24 25.5L30.5 18ZM8 43L24 40.5L40 42" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="17.5" cy="18" r="3.4" />
      <circle cx="30.5" cy="18" r="3.4" />
      <circle cx="24" cy="25.5" r="1.8" />
      <circle cx="24" cy="5" r="2" />
      <circle cx="34.5" cy="9" r="2" />
      <circle cx="13.5" cy="9" r="2" />
      <circle cx="39.5" cy="20" r="2.4" />
      <circle cx="8.5" cy="20" r="2.4" />
      <circle cx="35" cy="32" r="2.2" />
      <circle cx="13" cy="32" r="2.2" />
      <circle cx="24" cy="40.5" r="2.4" />
      <circle cx="8" cy="43" r="1.8" />
      <circle cx="40" cy="42" r="1.8" />
    </g>
  </Svg>
);

/** La tortue, de profil : la carapace en dôme, la tête levée, deux pattes, un bout de queue. */
const constellationTortue: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M8 30L12 19L22.5 13L33 19L37 30ZM37 30L42.5 23M8 30L5 34M15 30L13 40M30.5 30L32.5 40" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="22.5" cy="13" r="3.2" />
      <circle cx="12" cy="19" r="2.4" />
      <circle cx="33" cy="19" r="2.4" />
      <circle cx="8" cy="30" r="2.2" />
      <circle cx="37" cy="30" r="2.2" />
      <circle cx="15" cy="30" r="2" />
      <circle cx="30.5" cy="30" r="2" />
      <circle cx="42.5" cy="23" r="2.5" />
      <circle cx="5" cy="34" r="1.8" />
      <circle cx="13" cy="40" r="2" />
      <circle cx="32.5" cy="40" r="2" />
    </g>
  </Svg>
);

/** Le paon qui fait la roue : six plumes en éventail, un ocelle au bout de chacune. */
const constellationPaon: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 36L5.5 32M24 36L6 19M24 36L15.5 7.5M24 36L32.5 7.5M24 36L42 19M24 36L42.5 32M24 36L24 24M24 36L20 43M24 36L28 43" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="24" cy="36" r="3.2" />
      <circle cx="24" cy="24" r="2.2" />
      <circle cx="5.5" cy="32" r="2.4" />
      <circle cx="6" cy="19" r="2.8" />
      <circle cx="15.5" cy="7.5" r="3" />
      <circle cx="32.5" cy="7.5" r="3" />
      <circle cx="42" cy="19" r="2.8" />
      <circle cx="42.5" cy="32" r="2.4" />
      <circle cx="20" cy="43" r="1.8" />
      <circle cx="28" cy="43" r="1.8" />
    </g>
  </Svg>
);

/** L'hippocampe : le museau en trompette, le ventre rond, la queue enroulée. */
const constellationHippocampe: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M8 15L17 10L27 11L33 21L28 31L18 24L17 10M17 10L22 4.5M28 31L26 39L18 42.5L11 38L16 32M33 21L40 25" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="17" cy="10" r="3" />
      <circle cx="8" cy="15" r="1.8" />
      <circle cx="22" cy="4.5" r="1.8" />
      <circle cx="27" cy="11" r="2.2" />
      <circle cx="33" cy="21" r="2.6" />
      <circle cx="18" cy="24" r="2.6" />
      <circle cx="28" cy="31" r="2.2" />
      <circle cx="40" cy="25" r="1.8" />
      <circle cx="26" cy="39" r="2" />
      <circle cx="18" cy="42.5" r="2" />
      <circle cx="11" cy="38" r="1.8" />
      <circle cx="16" cy="32" r="1.8" />
    </g>
  </Svg>
);

/** Le cerf, de profil : l'encolure dressée, les grands bois à quatre pointes. */
const constellationCerf: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M7 42.5L8 32L23 31L24 42.5M23 31L31 22L39 26M31 22L27 13L20 6M27 13L29.5 4.5M31 22L36 13L42.5 6M36 13L36.5 4.5M8 32L4.5 29.5" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="8" cy="32" r="2.6" />
      <circle cx="23" cy="31" r="3" />
      <circle cx="7" cy="42.5" r="2" />
      <circle cx="24" cy="42.5" r="2" />
      <circle cx="31" cy="22" r="2.8" />
      <circle cx="39" cy="26" r="1.8" />
      <circle cx="27" cy="13" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="29.5" cy="4.5" r="1.8" />
      <circle cx="36" cy="13" r="2" />
      <circle cx="42.5" cy="6" r="2" />
      <circle cx="36.5" cy="4.5" r="1.8" />
      <circle cx="4.5" cy="29.5" r="1.8" />
    </g>
  </Svg>
);

/** La baleine : le gros corps, la gueule fendue, le jet d'eau, la queue en fourche. */
const constellationBaleine: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M5 28L9 20L15.5 16L24.5 18L31 27L21 37L10 36ZM5 28L14 28M31 27L38 21L35.5 13.5M38 21L43 24M15.5 16L12.5 7M15.5 16L19.5 7" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="21" cy="37" r="3" />
      <circle cx="9" cy="20" r="2.4" />
      <circle cx="5" cy="28" r="2" />
      <circle cx="14" cy="28" r="1.8" />
      <circle cx="15.5" cy="16" r="2.2" />
      <circle cx="24.5" cy="18" r="2.6" />
      <circle cx="31" cy="27" r="2.2" />
      <circle cx="10" cy="36" r="2.2" />
      <circle cx="38" cy="21" r="2" />
      <circle cx="35.5" cy="13.5" r="2.2" />
      <circle cx="43" cy="24" r="2" />
      <circle cx="12.5" cy="7" r="1.8" />
      <circle cx="19.5" cy="7" r="1.8" />
    </g>
  </Svg>
);

/** Le papillon : quatre ailes autour du corps, deux antennes. */
const constellationPapillon: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 13L24 34M24 13L19 5M24 13L29 5M24 23L6 8L7 23ZM24 23L42 8L41 23ZM24 23L10 39L24 34L38 39Z" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="24" cy="23" r="3" />
      <circle cx="24" cy="13" r="2" />
      <circle cx="24" cy="34" r="2" />
      <circle cx="19" cy="5" r="1.8" />
      <circle cx="29" cy="5" r="1.8" />
      <circle cx="6" cy="8" r="2.8" />
      <circle cx="42" cy="8" r="2.8" />
      <circle cx="7" cy="23" r="2.2" />
      <circle cx="41" cy="23" r="2.2" />
      <circle cx="10" cy="39" r="2.6" />
      <circle cx="38" cy="39" r="2.6" />
    </g>
  </Svg>
);

/** Le lièvre assis : le dos rond, les deux longues oreilles dressées. */
const constellationLievre: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M37 31L26 20L16 15.5L8 19.5L18 28L16 42L33 42ZM16 15.5L22 5.5M16 15.5L14 5M37 31L41 37" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="16" cy="15.5" r="3" />
      <circle cx="8" cy="19.5" r="1.8" />
      <circle cx="22" cy="5.5" r="2" />
      <circle cx="14" cy="5" r="2" />
      <circle cx="26" cy="20" r="2.2" />
      <circle cx="37" cy="31" r="2.8" />
      <circle cx="18" cy="28" r="2" />
      <circle cx="16" cy="42" r="2.2" />
      <circle cx="33" cy="42" r="2.4" />
      <circle cx="41" cy="37" r="1.8" />
    </g>
  </Svg>
);

/** Le cygne : le cou en S, le corps en barque, la queue relevée. */
const constellationCygne: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M5.5 11L11 6L19 10L18 21L11 31L17 40L34 40L42.5 30L31 22L11 31" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="11" cy="6" r="2.8" />
      <circle cx="5.5" cy="11" r="1.8" />
      <circle cx="19" cy="10" r="2" />
      <circle cx="18" cy="21" r="2" />
      <circle cx="11" cy="31" r="2.6" />
      <circle cx="17" cy="40" r="2.2" />
      <circle cx="34" cy="40" r="2.2" />
      <circle cx="42.5" cy="30" r="2.4" />
      <circle cx="31" cy="22" r="2.8" />
    </g>
  </Svg>
);

/** L'abeille, vue de dessus : deux ailes rabattues, la taille fine, l'abdomen rayé, le dard. */
const constellationAbeille: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 6.5L24 21.5L16 28.5L24 42.5L32 28.5L24 21.5M16 28.5L32 28.5M19.7 35L28.3 35M24 14.5L5.5 16L8.5 25ZM24 14.5L42.5 16L39.5 25Z" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="24" cy="14.5" r="3" />
      <circle cx="24" cy="6.5" r="2.2" />
      <circle cx="24" cy="21.5" r="1.8" />
      <circle cx="16" cy="28.5" r="2.2" />
      <circle cx="32" cy="28.5" r="2.2" />
      <circle cx="19.7" cy="35" r="1.8" />
      <circle cx="28.3" cy="35" r="1.8" />
      <circle cx="24" cy="42.5" r="2" />
      <circle cx="5.5" cy="16" r="2.4" />
      <circle cx="8.5" cy="25" r="2" />
      <circle cx="42.5" cy="16" r="2.4" />
      <circle cx="39.5" cy="25" r="2" />
    </g>
  </Svg>
);

/** L'escargot : la coquille en spirale sur le pied, deux cornes. */
const constellationEscargot: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M5 40L29 40L41 33M41 33L37 24.5M41 33L43 24.5M29 40L31 24L23 11L10 13L6 26L16 33L25 27L18 21" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <g fill={C.mimosa}>
      <circle cx="18" cy="21" r="3.2" />
      <circle cx="31" cy="24" r="2.2" />
      <circle cx="23" cy="11" r="2.4" />
      <circle cx="10" cy="13" r="2.4" />
      <circle cx="6" cy="26" r="2.2" />
      <circle cx="16" cy="33" r="2" />
      <circle cx="25" cy="27" r="1.8" />
      <circle cx="5" cy="40" r="1.8" />
      <circle cx="29" cy="40" r="2.2" />
      <circle cx="41" cy="33" r="2.6" />
      <circle cx="37" cy="24.5" r="1.8" />
      <circle cx="43" cy="24.5" r="1.8" />
    </g>
  </Svg>
);

// ---------------------------------------------------------------------------
// Bandit Manchot : dix symboles de machine à sous, sur une case ivoire

/** Bandit Manchot : la cloche dorée, battant cerise, lèvre chromée. */
const banditCloche: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <circle cx="24" cy="41.5" r="3" fill={C.cerise} />
    <circle cx="24" cy="6.5" r="3" fill={C.cerise} />
    <path d="M24 8C17.5 8 14 12 13.5 17.5C13 22.5 12.5 27 10.5 30.5C9.5 32.5 8 34.5 5.5 36H42.5C40 34.5 38.5 32.5 37.5 30.5C35.5 27 35 22.5 34.5 17.5C34 12 30.5 8 24 8Z" fill={C.mimosa} />
    <path d="M24 8C30.5 8 34 12 34.5 17.5C35 22.5 35.5 27 37.5 30.5C38.5 32.5 40 34.5 42.5 36H32C32.5 27 31.5 13 24 8Z" fill={C.mimosaFonce} />
    <path d="M19.5 12.5Q15.5 17 15.5 25Q17.5 18 21 13.5Z" fill={shade(C.mimosa, 0.55)} />
    <rect x="4.5" y="34.5" width="39" height="5" rx="2.5" fill={METAL.chrome} />
  </Svg>
);

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

/** Le jaune citron, plus acide que le mimosa. */
const CITRON = "#FBE04F";

/** Bandit Manchot : le citron, penché, avec sa feuille. */
const banditCitron: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="rotate(-28 24 27)">
      <path d="M2.6 27Q5.3 26.5 7.4 23.8C11.2 9.4 36.8 9.4 40.6 23.8Q42.7 26.5 45.4 27Q42.7 27.5 40.6 30.2C36.8 44.6 11.2 44.6 7.4 30.2Q5.3 27.5 2.6 27Z" fill={CITRON} />
      <path d="M8 31.3C11.7 44.6 36.8 44.6 40.6 30.2C34.7 38.8 17.6 40.4 8 31.3Z" fill={C.mimosa} />
      <ellipse cx="18.6" cy="18.4" rx="5.4" ry="2.1" fill={C.blanc} fillOpacity="0.7" />
    </g>
    <path d="M42.6 16.9C36.8 16.9 32 12.5 30.5 5.5C37.4 5 42.6 9.4 42.6 16.9Z" fill={C.vert} />
    <path d="M42.6 16.9C36.8 16.9 32 12.5 30.5 5.5Z" fill={C.feuille} />
  </Svg>
);

/** Une foliole de trèfle en cœur, la pointe un rien au-delà du centre (23, 22), et ses deux moitiés. */
const FOLIOLE = "M23 23C17.5 18.5 12.5 13.8 12.5 9.5C12.5 6 15.3 4 18 4C20.3 4 22.2 5.3 23 7.3C23.8 5.3 25.7 4 28 4C30.7 4 33.5 6 33.5 9.5C33.5 13.8 28.5 18.5 23 23Z";
const FOLIOLE_DROITE = "M23 23C28.5 18.5 33.5 13.8 33.5 9.5C33.5 6 30.7 4 28 4C25.7 4 23.8 5.3 23 7.3Z";
const FOLIOLE_GAUCHE = "M23 23C17.5 18.5 12.5 13.8 12.5 9.5C12.5 6 15.3 4 18 4C20.3 4 22.2 5.3 23 7.3Z";

/** Bandit Manchot : le trèfle à quatre feuilles. */
const banditTrefle: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M23 22C28 28 33.5 33.5 38.8 42.3" fill="none" stroke={C.feuille} strokeWidth="3" strokeLinecap="round" />
    <g fill={C.vert}>
      <path d={FOLIOLE} />
      <path d={FOLIOLE} transform="rotate(90 23 22)" />
      <path d={FOLIOLE} transform="rotate(180 23 22)" />
      <path d={FOLIOLE} transform="rotate(270 23 22)" />
    </g>
    {/* Le pli de chaque foliole : la moitié à l'ombre, en bas à droite */}
    <g fill={C.feuille}>
      <path d={FOLIOLE_DROITE} />
      <path d={FOLIOLE_DROITE} transform="rotate(90 23 22)" />
      <path d={FOLIOLE_GAUCHE} transform="rotate(180 23 22)" />
      <path d={FOLIOLE_GAUCHE} transform="rotate(270 23 22)" />
    </g>
  </Svg>
);

/**
 * Le fer à cheval, tracé branches en bas puis retourné d'un demi-tour : le blanc du
 * chrome tombe ainsi sur la pince, là où l'ombre le détache de l'ivoire.
 */
const FER = "M39.5 42H32L33.5 25A9.5 10 0 0 0 14.5 25L16 42H8.5L6 25A18 19.5 0 0 1 42 25Z";

/** Bandit Manchot : le fer à cheval chromé, branches en l'air, ses six étampures. */
const banditFerACheval: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d={FER} transform="translate(1.5 1.5) rotate(180 24 24)" fill={C.grisFonce} />
    <path d={FER} transform="rotate(180 24 24)" fill={METAL.chrome} />
    <g fill={C.grisFonce}>
      <circle cx="11.3" cy="14" r="1.6" />
      <circle cx="10.3" cy="23.5" r="1.6" />
      <circle cx="14.3" cy="33.4" r="1.6" />
      <circle cx="36.7" cy="14" r="1.6" />
      <circle cx="37.7" cy="23.5" r="1.6" />
      <circle cx="33.7" cy="33.4" r="1.6" />
    </g>
  </Svg>
);

/** Bandit Manchot : l'étoile à cinq branches, taillée à facettes. */
const banditEtoile: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 4.6L29.9 17.5L44 19.1L33.5 28.7L36.3 42.6L24 35.6L11.7 42.6L14.5 28.7L4 19.1L18.1 17.5Z" fill={C.mimosa} />
    <path d="M24 25.6L4 19.1L18.1 17.5L24 4.6Z" fill={shade(C.mimosa, 0.45)} />
    <path d="M24 25.6V4.6L29.9 17.5ZM24 25.6L44 19.1L33.5 28.7L36.3 42.6ZM24 25.6V35.6L11.7 42.6ZM24 25.6L14.5 28.7L4 19.1Z" fill={C.mimosaFonce} />
  </Svg>
);

/** Le sept, tracé à la main : barre, ergot, jambe galbée. */
const SEPT = "M7 4H40V12C32 20 28 30 27 41H16C17 29 21 20 28 13H12V17H7Z";

/** Bandit Manchot : le sept porte-bonheur, rouge cerise. */
const banditSept: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d={SEPT} transform="translate(2.5 2.5)" fill={shade(C.cerise, -0.4)} />
    <path d={SEPT} fill={C.cerise} />
    <rect x="10" y="6.5" width="26" height="2.5" rx="1.25" fill={C.ceriseClair} />
  </Svg>
);

/** Bandit Manchot : le diamant bleu, vu de profil. */
const banditDiamant: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M14 8H34L44 19L24 43L4 19Z" fill={C.azur} />
    <path d="M14 8H34L32.5 19H15.5Z" fill={C.ciel} />
    <path d="M4 19L14 8L15.5 19Z" fill={shade(C.ciel, 0.5)} />
    <path d="M4 19H15.5L24 43Z" fill={shade(C.azur, 0.35)} />
    <path d="M32.5 19H44L24 43Z" fill={shade(C.azur, -0.3)} />
  </Svg>
);

/** Bandit Manchot : la couronne d'or, coiffe de velours cerise. */
const banditCouronne: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M11 33Q11 13 24 13Q37 13 37 33Z" fill={C.cerise} />
    <path d="M9 35L7 17L16 26L24 11L32 26L41 17L39 35Z" fill={METAL.or} />
    <circle cx="7" cy="15" r="2.8" fill={METAL.or} />
    <circle cx="24" cy="9" r="3" fill={METAL.or} />
    <circle cx="41" cy="15" r="2.8" fill={METAL.or} />
    <rect x="8" y="34" width="32" height="8" rx="2" fill={C.mimosaFonce} />
    <path d="M24 35L27 38L24 41L21 38Z" fill={C.cerise} />
    <circle cx="14" cy="38" r="1.8" fill={C.cerise} />
    <circle cx="34" cy="38" r="1.8" fill={C.cerise} />
  </Svg>
);

/** Bandit Manchot : le manchot masqué, loup cerise noué derrière la tête. Le gros lot. */
const banditManchot: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M37.5 21L44.5 17L43 21.5L44.5 26L37.5 24Z" fill={shade(C.cerise, -0.25)} />
    <ellipse cx="21.5" cy="25" rx="17" ry="18" fill={C.noir} />
    <ellipse cx="12.2" cy="11.4" rx="2.6" ry="1.2" transform="rotate(-42 12.2 11.4)" fill={C.grisFonce} />
    <path d="M21.5 15C17.5 10 8 12 8 23C8 33 14 40 21.5 40C29 40 35 33 35 23C35 12 25.5 10 21.5 15Z" fill={C.blanc} />
    <path d="M21.5 40C29 40 35 33 35 23C35 20.5 34.5 18.3 33.6 16.5C34 26 30 35 21.5 40Z" fill={C.grisClair} />
    <path d="M4.7 22Q12 14.5 21.5 19Q31 14.5 38.3 22Q31 30.5 21.5 26Q12 30.5 4.7 22Z" fill={C.cerise} />
    <circle cx="14.5" cy="22" r="2.3" fill={C.blanc} />
    <circle cx="28.5" cy="22" r="2.3" fill={C.blanc} />
    <path d="M17.5 28H25.5L21.5 35.5Z" fill={C.mimosa} />
    <path d="M21.5 28H25.5L21.5 35.5Z" fill={C.mimosaFonce} />
  </Svg>
);

// ---------------------------------------------------------------------------
// La Pie Voleuse : dix bijoux, du plus modeste au plus précieux, sur une case ivoire

/** Un éclat à quatre branches, centré en (x, y), de rayon r. */
function eclat(x: number, y: number, r: number): string {
  const k = Math.round(r * 22) / 100;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}

/** La Pie Voleuse : le bouton de nacre, rond, quatre trous. */
const pieBouton: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <circle cx="25.5" cy="25.5" r="16" fill={shade(C.brume, -0.3)} />
    <circle cx="24" cy="24" r="16" fill={C.brume} />
    <circle cx="24" cy="24" r="12" fill={C.ecume} />
    {/* Les reflets de la nacre */}
    <path d="M13.6 18A12 12 0 0 1 30 13.6Q21.4 14.2 13.6 18Z" fill={shade(C.rose, 0.3)} />
    <path d="M34.4 30A12 12 0 0 1 18 34.4Q26.6 33.8 34.4 30Z" fill={shade(C.lilas, 0.35)} />
    <g fill={C.encre}>
      <circle cx="20.5" cy="20.5" r="2" />
      <circle cx="27.5" cy="20.5" r="2" />
      <circle cx="20.5" cy="27.5" r="2" />
      <circle cx="27.5" cy="27.5" r="2" />
    </g>
  </Svg>
);

/** La Pie Voleuse : la perle, une sphère rosée et son ombre lilas. */
const piePerle: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <circle cx="25.2" cy="25.2" r="16" fill={shade(C.lilas, -0.2)} />
    <circle cx="24" cy="24" r="16" fill={shade(C.rose, 0.45)} />
    <path d="M34.05 11.55A16 16 0 1 1 11.55 34.05A16 16 0 0 0 34.05 11.55Z" fill={shade(C.lilas, 0.15)} />
    <ellipse cx="17.8" cy="16.8" rx="4.6" ry="2.8" transform="rotate(-40 17.8 16.8)" fill={C.blanc} />
  </Svg>
);

/** Le violet de l'améthyste, que la palette n'a pas. */
const VIOLET = "#8C5FBF";

/** La Pie Voleuse : l'améthyste, taille ovale. */
const pieAmethyste: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <ellipse cx="24" cy="24" rx="15.5" ry="19" fill={VIOLET} />
    <path d="M29.6 6.3A15.5 19 0 0 0 9.8 31.7L16.1 28.3V19.7L20.7 13.5H27.3Z" fill={C.lilas} />
    <path d="M38.2 16.3A15.5 19 0 0 1 18.4 41.7L20.7 34.5H27.3L31.9 28.3V19.7Z" fill={shade(VIOLET, -0.3)} />
    <path d="M20.7 13.5H27.3L31.9 19.7V28.3L27.3 34.5H20.7L16.1 28.3V19.7Z" fill={shade(VIOLET, 0.22)} />
    <path d="M18.2 20.3L21.4 15.8H24.4L18.2 24Z" fill={C.blanc} fillOpacity="0.75" />
  </Svg>
);

/** La Pie Voleuse : la topaze, taille poire. */
const pieTopaze: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 5C29.4 12 39 19 39 29A15 14 0 0 1 9 29C9 19 18.6 12 24 5Z" fill={C.mimosa} />
    <path d="M24 5C18.6 12 9 19 9 29L9.1 30.9L16 30L17.6 24L24 14.5Z" fill={shade(C.mimosa, 0.45)} />
    <path d="M32 30L38.9 30.9A15 14 0 0 1 15.5 40.5L19.2 35.5H28.8Z" fill={C.mimosaFonce} />
    <path d="M24 14.5L30.4 24L32 30L28.8 35.5H19.2L16 30L17.6 24Z" fill={shade(C.mimosa, 0.22)} />
    <path d="M19.2 25L22.9 19.5L24.5 22L20.2 28.5Z" fill={C.blanc} fillOpacity="0.75" />
  </Svg>
);

/** Le bleu-vert pâle de l'aigue-marine, que la palette n'a pas. */
const AIGUE = "#7FD0DD";

/** La Pie Voleuse : l'aigue-marine, taille marquise, en biais. */
const pieAigueMarine: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M5 43Q7 7 43 5Q41 41 5 43Z" fill={AIGUE} />
    <path d="M14.45 33.55L7.73 28.24Q13.05 13.05 28.24 7.73L33.55 14.45L23.29 15.51L15.51 23.29Z" fill={C.ciel} />
    <path d="M14.45 33.55L19.76 40.27Q34.95 34.95 40.27 19.76L33.55 14.45L32.49 24.71L24.71 32.49Z" fill={C.mer} />
    <path d="M14.45 33.55L15.51 23.29L23.29 15.51L33.55 14.45L32.49 24.71L24.71 32.49Z" fill={shade(AIGUE, 0.3)} />
    <path d="M17 27.5L17.6 23.9L23.9 17.6L27.5 17Z" fill={C.blanc} fillOpacity="0.8" />
  </Svg>
);

/** La Pie Voleuse : le saphir, taille coussin. */
const pieSaphir: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 6.5C38 6.5 41.5 10 41.5 24C41.5 38 38 41.5 24 41.5C10 41.5 6.5 38 6.5 24C6.5 10 10 6.5 24 6.5Z" fill={C.marine} />
    <path d="M31.06 6.95C29.07 6.63 26.74 6.5 24 6.5C10 6.5 6.5 10 6.5 24C6.5 26.74 6.63 29.07 6.95 31.06L15.7 27.4V20.6L20.6 15.7H27.4Z" fill={C.azur} />
    <path d="M41.05 16.94C41.37 18.93 41.5 21.26 41.5 24C41.5 38 38 41.5 24 41.5C21.26 41.5 18.93 41.37 16.94 41.05L20.6 32.3H27.4L32.3 27.4V20.6Z" fill={shade(C.marine, -0.4)} />
    <path d="M20.6 15.7H27.4L32.3 20.6V27.4L27.4 32.3H20.6L15.7 27.4V20.6Z" fill={shade(C.azur, -0.25)} />
    <path d="M14.6 18.4L10.4 14.2Q11.6 11.6 14.2 10.4L18.4 14.6Z" fill={C.ciel} fillOpacity="0.85" />
    <path d={eclat(33, 13.5, 3.6)} fill={C.blanc} />
  </Svg>
);

/** La Pie Voleuse : l'émeraude, taille émeraude à pans coupés. */
const pieEmeraude: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M14.4 5H33.6L40 11V37L33.6 43H14.4L8 37V11Z" fill={C.persienne} />
    <path d="M33.6 5H14.4L8 11V37L12.8 35V13L16.5 9.5H31.5Z" fill={C.persClair} />
    <path d="M40 11V37L33.6 43H14.4L16.5 38.5H31.5L35.2 35V13Z" fill={C.persFonce} />
    <path d="M19.2 14H28.8L30.4 15.5V32.5L28.8 34H19.2L17.6 32.5V15.5Z" fill={shade(C.persClair, 0.3)} />
    <path d="M17.6 23.5L27.7 14H23.5L17.6 19.5Z" fill={C.blanc} fillOpacity="0.7" />
    <path d={eclat(33.6, 11.5, 3.4)} fill={C.blanc} />
  </Svg>
);

/** La Pie Voleuse : le rubis, taille cœur. */
const pieRubis: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 42C10 32 5 23 5 16C5 9.5 10 6 15 6C19 6 22.5 8.5 24 12C25.5 8.5 29 6 33 6C38 6 43 9.5 43 16C43 23 38 32 24 42Z" fill={C.cerise} />
    <path d="M24 12C22.5 8.5 19 6 15 6C10 6 5 9.5 5 16C5 19.5 6.25 23.5 9.25 27.9L17 27L14 20L18 15.5L24 18Z" fill={shade(C.cerise, 0.3)} />
    <path d="M38.75 27.9C35.75 32.25 31 37 24 42V33L31 27Z" fill={shade(C.cerise, -0.35)} />
    <path d="M24 18L30 15.5L34 20L31 27L24 33L17 27L14 20L18 15.5Z" fill={shade(C.cerise, 0.15)} />
    <path d="M9.5 15.5Q10 10.5 15 9.5Q12 12 11.5 16Z" fill={C.blanc} fillOpacity="0.8" />
    <path d={eclat(34.5, 13, 3.6)} fill={C.blanc} />
  </Svg>
);

/** Le diamant de profil : table, rondiste, culasse. */
const BRILLANT = "M12.5 10H34.5L43.5 20L23.5 43L3.5 20Z";

/** La Pie Voleuse : le diamant, taille brillant, deux éclats. */
const pieDiamant: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d={BRILLANT} transform="translate(1.2 1.2)" fill={shade(C.brume, -0.3)} />
    <path d={BRILLANT} fill={C.ciel} />
    <path d="M3.5 20L12.5 10L16.5 20Z" fill={shade(C.ciel, 0.5)} />
    <path d="M16.5 20L23.5 10L30.5 20Z" fill={C.blanc} />
    <path d="M23.5 10H34.5L30.5 20ZM16.5 20H30.5L23.5 43Z" fill={shade(C.azur, 0.45)} />
    <path d="M30.5 20L34.5 10L43.5 20L23.5 43Z" fill={shade(C.azur, 0.15)} />
    <path d={eclat(40, 8, 4) + eclat(7, 35, 3.2)} fill={C.azur} />
  </Svg>
);

/** La Pie Voleuse : l'étoile de diamants, cinq losanges sertis d'or autour d'un brillant. Le gros lot. */
const pieEtoileDeDiamants: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 4.5L29.9 16.9L43.5 18.7L33.5 28.1L36 41.6L24 35L12 41.6L14.5 28.1L4.5 18.7L18.1 16.9Z" fill={METAL.or} />
    {/* Les cinq diamants en losange, chacun à deux facettes */}
    <path d="M24 23.2L19.3 16.7L24 6.8L28.7 16.7ZM25.7 24.4L30.5 18L41.3 19.4L33.4 26.9ZM25.1 26.5L32.7 29L34.7 39.8L25.1 34.5ZM22.9 26.5V34.5L13.3 39.8L15.3 29ZM22.3 24.4L14.7 26.9L6.7 19.4L17.5 18Z" fill={C.ciel} />
    <path d="M24 23.2L19.3 16.7L24 6.8ZM22.3 24.4L6.7 19.4L17.5 18Z" fill={C.blanc} />
    <path d="M24 23.2V6.8L28.7 16.7ZM25.7 24.4L41.3 19.4L33.4 26.9ZM25.1 26.5L32.7 29L34.7 39.8ZM22.9 26.5V34.5L13.3 39.8ZM22.3 24.4L14.7 26.9L6.7 19.4Z" fill={shade(C.azur, 0.2)} />
    {/* Le brillant du centre */}
    <circle cx="24" cy="25" r="5" fill={METAL.or} />
    <circle cx="24" cy="25" r="3.4" fill={C.blanc} />
    <path d="M24 25L26.9 23.3A3.4 3.4 0 0 1 24 28.4Z" fill={C.ciel} />
    <path d={eclat(40, 8.5, 4.5) + eclat(7, 38, 3)} fill={C.mimosa} />
  </Svg>
);

// ---------------------------------------------------------------------------
// Caviar & Champagne : six mets, sur une case ivoire

/** Caviar & Champagne : la boîte de caviar ouverte, son couvercle posé derrière. */
const metsCaviar: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Le couvercle */}
    <ellipse cx="32.5" cy="14" rx="11" ry="9.5" transform="rotate(20 32.5 14)" fill={METAL.or} />
    <ellipse cx="32.5" cy="14" rx="8.5" ry="7" transform="rotate(20 32.5 14)" fill={C.marine} />
    <ellipse cx="32.5" cy="14" rx="4" ry="3" transform="rotate(20 32.5 14)" fill={METAL.or} />
    {/* La boîte */}
    <path d="M5 27V35A17 8.5 0 0 0 39 35V27Z" fill={C.marine} />
    <path d="M30 34.5V42.5A17 8.5 0 0 0 39 35V27A17 8.5 0 0 1 30 34.5Z" fill={shade(C.marine, -0.35)} />
    <ellipse cx="22" cy="27" rx="17" ry="8.5" fill={METAL.or} />
    {/* Les grains */}
    <ellipse cx="22" cy="27" rx="15" ry="7" fill={C.noir} />
    <g fill={C.ardoise}>
      <circle cx="13" cy="26" r="1.5" />
      <circle cx="18" cy="23.5" r="1.5" />
      <circle cx="19" cy="29.5" r="1.5" />
      <circle cx="24" cy="26.5" r="1.5" />
      <circle cx="27" cy="31" r="1.5" />
      <circle cx="29.5" cy="24.5" r="1.5" />
      <circle cx="33" cy="28.5" r="1.5" />
    </g>
  </Svg>
);

/** Caviar & Champagne : la coupe de champagne et ses bulles. */
const metsChampagne: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Le pied et la jambe */}
    <path d="M14 43.5Q24 37 34 43.5Z" fill={C.brume} />
    <rect x="22.5" y="29" width="3" height="11" fill={C.brume} />
    {/* La coupe, le vin, un reflet sur le verre */}
    <path d="M6 13Q6 30.5 24 30.5Q42 30.5 42 13Z" fill={C.brume} />
    <path d="M8.5 17Q10 28 24 28Q38 28 39.5 17Z" fill={METAL.or} />
    <ellipse cx="24" cy="17" rx="15.5" ry="2.2" fill={shade(C.mimosa, 0.5)} />
    <path d="M10.6 20.5Q12 25 16.5 27Q13.6 24.5 12.8 20.5Z" fill={C.blanc} fillOpacity="0.8" />
    {/* Les bulles */}
    <g fill={C.mimosa}>
      <circle cx="16.5" cy="9" r="1.6" />
      <circle cx="24.5" cy="6" r="2.2" />
      <circle cx="31" cy="10" r="1.4" />
    </g>
  </Svg>
);

/** Une pince de homard, pointe en l'air, poignet en (13, 18). */
const PINCE = "M12 19C7 19 3.5 15 4 10C4.3 7 6 5 8 4C9.5 6 10 8 10 10.5C11 8.5 12 7 13.5 6C15.5 9 15.5 14 14 17Z";

/** Caviar & Champagne : le homard, vu de dessus, rouge d'être cuit. */
const metsHomard: Art = (props) => {
  const ombre = shade(C.cerise, -0.28);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Pattes et antennes */}
      <path d="M17.5 19L10 22M17.3 22L10 27M18 25L11.5 31M30.5 19L38 22M30.7 22L38 27M30 25L36.5 31" fill="none" stroke={ombre} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22.5 9Q21 5.5 17.5 4.6M25.5 9Q27 5.5 30.5 4.6" fill="none" stroke={ombre} strokeWidth="1.2" strokeLinecap="round" />
      {/* Bras et pinces */}
      <path d="M18.5 15L13 17.5M29.5 15L35 17.5" fill="none" stroke={C.cerise} strokeWidth="3.2" strokeLinecap="round" />
      <path d={PINCE} fill={C.cerise} />
      <path d={PINCE} transform="matrix(-1 0 0 1 48 0)" fill={C.cerise} />
      <ellipse cx="7" cy="11.5" rx="1.2" ry="2.8" transform="rotate(12 7 11.5)" fill={C.ceriseClair} />
      {/* Queue en éventail, abdomen, carapace */}
      <path d="M24 34L32.5 40Q29 44.5 24 43.5Q19 44.5 15.5 40Z" fill={ombre} />
      <path d="M18.5 23H29.5L27.5 37H20.5Z" fill={C.cerise} />
      <path d="M19.2 28H28.8M19.9 32.5H28.1" fill="none" stroke={ombre} strokeWidth="1.4" />
      <path d="M21 10L24 5L27 10Z" fill={C.cerise} />
      <ellipse cx="24" cy="17" rx="7.5" ry="8.5" fill={C.cerise} />
      <path d="M27 9.2A7.5 8.5 0 0 1 24 25.5Q29.5 21 27 9.2Z" fill={ombre} />
      <circle cx="21.3" cy="11.5" r="1.1" fill={C.noir} />
      <circle cx="26.7" cy="11.5" r="1.1" fill={C.noir} />
    </Svg>
  );
};

/** Caviar & Champagne : la truffe noire, entamée, sa chair marbrée. */
const metsTruffe: Art = (props) => {
  const peau = shade(C.boisFonce, -0.5);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <path d="M8.3 20.7Q7.3 11.2 15.7 8Q22.1 2.7 29.5 6.9Q38 6.9 40.1 15.4Q45.4 21.8 41.2 30.3Q41.2 38.7 31.6 40.9Q24.2 45.1 16.8 40.9Q7.3 39.8 6.2 30.3Q3 25 8.3 20.7Z" fill={peau} />
      {/* Les verrues de la peau */}
      <path d="M11.5 15.4l2.1-2.1l2.1 2.1l-2.1 2.1zM20 9.1l2.1-2.1l2.1 2.1l-2.1 2.1zM29.5 11.2l2.1-2.1l2.1 2.1l-2.1 2.1zM8.3 27.1l2.1-2.1l2.1 2.1l-2.1 2.1zM13.6 35.6l2.1-2.1l2.1 2.1l-2.1 2.1z" fill={C.boisFonce} />
      {/* La tranche et ses veines */}
      <ellipse cx="29" cy="28.1" rx="13.2" ry="12.2" transform="rotate(-20 29 28.1)" fill={C.boisFonce} />
      <path d="M19.4 27.1Q23.2 21.2 27.9 24.4T37.5 21.2M20.5 34Q25.8 28.7 30 31.8T39.6 28.7M27.4 18.1Q30 21.8 27.9 24.4M30 31.8Q29 35.6 31.1 38.7" fill="none" stroke={C.sable} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
};

/** Caviar & Champagne : le macaron framboise, deux coques et leur collerette. */
const metsMacaron: Art = (props) => {
  const collerette = shade(C.bougClair, -0.2);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* La coque du dessous, la crème */}
      <path d="M7 32H41C41 38.5 34 42 24 42C14 42 7 38.5 7 32Z" fill={shade(C.bougClair, -0.1)} />
      <path d="M7 33V31.5q1.42-2.2 2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.87 0V33Z" fill={collerette} />
      <rect x="8" y="25.5" width="32" height="5.5" rx="2.75" fill={C.creme} />
      {/* La coque du dessus */}
      <path d="M6 21C6 11 14 6 24 6C34 6 42 11 42 21C42 22.7 40.7 24 39 24H9C7.3 24 6 22.7 6 21Z" fill={C.bougClair} />
      <path d="M42 21C42 22.7 40.7 24 39 24H26C34 22 39 17 39.5 12.5C41 15 42 18 42 21Z" fill={collerette} />
      <path d="M7 23V25.5q1.42 2.2 2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.83 0t2.87 0V23Z" fill={collerette} />
      <path d="M11.5 15Q14.5 9.5 22 8.5Q16 11 13.5 16Z" fill={C.blanc} fillOpacity="0.7" />
    </Svg>
  );
};

/** Caviar & Champagne : l'huître ouverte, sa nacre, un quartier de citron. */
const metsHuitre: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* La coquille feuilletée, la nacre et son ombre */}
    <path d="M17 42C12 40 8 35 6.5 29Q3.5 25 6 21Q5 15 10 12.5Q11.5 6.5 18 6Q23 2.5 28 6Q34.5 5 37 10.5Q42.5 13 41.5 19.5Q44 25 39.5 28.5C37 34 30 40 23 43Q19.5 44 17 42Z" fill={C.ardoise} />
    <path d="M18 38.5C14 36.5 10.5 32 9.5 27.5C8.5 23 9 17 12.5 13.5C16 9.5 22 8 27 9C32 10 36.5 13 37.5 18C38.5 23 36 28 33 31.5C30 35 26 38 22.5 39.5C20.5 40.3 19 39.3 18 38.5Z" fill={C.ecume} />
    <path d="M37.5 18C38.5 23 36 28 33 31.5C30 35 26 38 22.5 39.5C27 35.5 31 31 32.5 26C33.5 22 34 17 32.5 12.5C35 13.5 37 15.5 37.5 18Z" fill={C.brume} />
    {/* La chair, son manteau frangé, la noix */}
    <path d="M14 21C14 15.5 19 12 24.5 12.5C30 13 33.5 17 32.5 22C31.5 27 28 31.5 23.5 33.5C20 35 16.5 33.5 15.5 30C14.8 27.5 14 24.5 14 21Z" fill={C.pierre} />
    <path d="M31.2 15.2C33.2 17.5 33.3 19.8 32.5 22C31.5 27 28 31.5 23.5 33.5C20.7 34.7 17.9 33.9 16.4 31.6Q18.6 32 19.8 30.6Q22.3 31.3 23.4 29.2Q26 29.3 26.6 26.9Q29 26.3 29 23.8Q31.2 22.6 30.4 20.2Q32 18.2 31.2 15.2Z" fill={shade(C.pierre, -0.3)} />
    <ellipse cx="20.5" cy="19.5" rx="3.6" ry="3" fill={shade(C.pierre, 0.5)} />
    {/* Le citron */}
    <path d="M31 43.5Q31.5 35 41 32.5L44 41.5Q37.5 44.5 31 43.5Z" fill={C.mimosa} />
    <path d="M33.5 42Q34 37 40 35L42 40.5Q38 42.5 33.5 42Z" fill={shade(C.mimosa, 0.5)} />
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
  "constellation:homard": constellationHomard,
  "constellation:chouette": constellationChouette,
  "constellation:tortue": constellationTortue,
  "constellation:paon": constellationPaon,
  "constellation:hippocampe": constellationHippocampe,
  "constellation:cerf": constellationCerf,
  "constellation:baleine": constellationBaleine,
  "constellation:papillon": constellationPapillon,
  "constellation:lievre": constellationLievre,
  "constellation:cygne": constellationCygne,
  "constellation:abeille": constellationAbeille,
  "constellation:escargot": constellationEscargot,

  "bandit:cloche": banditCloche,
  "bandit:cerise": banditCerise,
  "bandit:citron": banditCitron,
  "bandit:trefle": banditTrefle,
  "bandit:fer-a-cheval": banditFerACheval,
  "bandit:etoile": banditEtoile,
  "bandit:sept": banditSept,
  "bandit:diamant": banditDiamant,
  "bandit:couronne": banditCouronne,
  "bandit:manchot": banditManchot,

  "pie:bouton": pieBouton,
  "pie:perle": piePerle,
  "pie:amethyste": pieAmethyste,
  "pie:topaze": pieTopaze,
  "pie:aigue-marine": pieAigueMarine,
  "pie:saphir": pieSaphir,
  "pie:emeraude": pieEmeraude,
  "pie:rubis": pieRubis,
  "pie:diamant": pieDiamant,
  "pie:etoile-de-diamants": pieEtoileDeDiamants,

  "mets:caviar": metsCaviar,
  "mets:champagne": metsChampagne,
  "mets:homard": metsHomard,
  "mets:truffe": metsTruffe,
  "mets:macaron": metsMacaron,
  "mets:huitre": metsHuitre,
};
