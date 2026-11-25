// Symboles des jeux de plateau, de cartes et de course (BRIEF.md, section 7.10).
//
// Même contrat que symbols.tsx : viewBox 0 0 48 48, fond transparent, le dessin tient
// dans le carré de 4 à 44 et se reconnaît à 28 px de côté. Ces symboles sont
// imprimés sur des cases ivoire.
// Clés : « famille:identifiant ».

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Tic-Tac-Truffe : la truffe noire, bosselée, entamée d'un coup de couteau. */
const morpionTruffe: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M22 5.5L28.5 4.5L33 8L39 9L41.5 15L44 20.5L42 27L43 33L38 37.5L35 42L28 42.5L22 44L16 41L10 39.5L7.5 33L4.5 27.5L6.5 21L6 14.5L11.5 11L15 6.5Z" fill={C.noir} />
    {/* Les verrues en pointe de diamant, leur arête éclairée */}
    <path d="M15 12l3 2.6l-3 2.6l-3 -2.6zM26 9l2.6 2.3l-2.6 2.3l-2.6 -2.3zM34.5 14l2.4 2.1l-2.4 2.1l-2.4 -2.1zM23 19.5l3.2 2.8l-3.2 2.8l-3.2 -2.8zM12 24l2.6 2.3l-2.6 2.3l-2.6 -2.3zM19.5 32l2.8 2.5l-2.8 2.5l-2.8 -2.5z" fill={C.grisFonce} />
    <path d="M15 12l3 2.6h-6zM26 9l2.6 2.3h-5.2zM23 19.5l3.2 2.8h-6.4zM12 24l2.6 2.3h-5.2z" fill={C.gris} />
    {/* La chair sombre, veinée de blanc */}
    <path d="M44 20.5L42 27L43 33L38 37.5L35 42L28 42.5Q25 29 44 20.5Z" fill={C.grisFonce} />
    <path d="M41 25Q34 28 30.6 40M41.6 31.4Q36.5 33 35 39M36 27.4L39.4 35.6" fill="none" stroke={C.creme} strokeWidth="1.1" strokeLinecap="round" />
  </Svg>
);

/** Tic-Tac-Truffe : le gland, blond sous sa cupule brune. */
const morpionGland: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 9.5Q23.4 6.6 26.4 5.4" fill="none" stroke={C.boisFonce} strokeWidth="2.6" strokeLinecap="round" />
    {/* Le fruit et son ombre */}
    <path d="M12.5 19Q11 33 20 39.6Q22.5 41.6 24 44Q25.5 41.6 28 39.6Q37 33 35.5 19Z" fill={C.mimosaFonce} />
    <path d="M35.5 19Q37 33 28 39.6Q25.5 41.6 24 44Q30 35 29.5 19Z" fill={shade(C.mimosaFonce, -0.25)} />
    <path d="M17 24Q16.6 30 19 34" fill="none" stroke={C.paille} strokeWidth="2.2" strokeLinecap="round" />
    {/* La cupule et ses écailles */}
    <path d="M9 19.5Q9 8 24 8Q39 8 39 19.5Q39 22.5 36 22.5H12Q9 22.5 9 19.5Z" fill={C.bois} />
    <path d="M12 17L17 12M17.5 20.5L26 12M25 20.5L33 12.5M32.5 20.5L37 16M15 11.5L24 20.5M22.5 9.5L33.5 20.5M31 10.5L37.5 17" fill="none" stroke={C.boisFonce} strokeWidth="1" strokeLinecap="round" />
  </Svg>
);

/** Moustache d'Or : la moustache d'or, pointes retroussées. */
const morpionMoustache: Art = (props) => {
  const moustache =
    "M24 21.5C25.5 16.5 31 15.5 34 20C36 23 39.5 24.5 40.5 20.5C41.3 17.5 40.5 14.5 38.5 12.5C42.5 13 45 17 44 23C43 30 38 33.5 32 33.5C28 33.5 25.5 31 24 27.5C22.5 31 20 33.5 16 33.5C10 33.5 5 30 4 23C3 17 5.5 13 9.5 12.5C7.5 14.5 6.7 17.5 7.5 20.5C8.5 24.5 12 23 14 20C17 15.5 22.5 16.5 24 21.5Z";
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <g transform="translate(0.8 1.4) scale(0.95)">
        <path d={moustache} transform="translate(1.2 1.6)" fill={C.mimosaFonce} />
        {/* L'or sur un fond mimosa : la pointe de gauche ne se perd pas dans l'ivoire */}
        <path d={moustache} fill={C.mimosa} />
        <path d={moustache} fill={METAL.or} fillOpacity="0.6" />
        <path d="M26.6 20.6Q29.4 18.4 32.2 20.6M21.4 20.6Q18.6 18.4 15.8 20.6" fill="none" stroke={C.ivoire} strokeOpacity="0.85" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </Svg>
  );
};

/** Moustache d'Or : le monocle et sa chaînette. */
const morpionMonocle: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* La chaînette et son bouton */}
    <path d="M37.6 24.6Q44 29.6 39.6 34.4Q35.4 38.8 38.6 41.6" fill="none" stroke={C.nuit} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.1 3.7" />
    <circle cx="38.8" cy="41.8" r="2.3" fill={C.nuit} />
    {/* L'anneau d'attache, la monture, le verre et son reflet */}
    <circle cx="36" cy="21.6" r="2.6" fill={C.nuit} />
    <circle cx="20.5" cy="20" r="14.5" fill={C.nuit} />
    <circle cx="20.5" cy="20" r="10.8" fill={C.ciel} />
    <path d="M13 19Q13.5 13.6 19 12.2" fill="none" stroke={C.blanc} strokeWidth="2.4" strokeLinecap="round" />
  </Svg>
);

/** Les cartes : le pique. */
const cartePique: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 4C30 12 43 18 43 28C43 34 38.5 38 33.5 38C30.5 38 27.8 36.6 26 34.3C26.5 38.5 28.5 42 31 44H17C19.5 42 21.5 38.5 22 34.3C20.2 36.6 17.5 38 14.5 38C9.5 38 5 34 5 28C5 18 18 12 24 4Z" fill={C.noir} />
    <path d="M11 28Q11.5 22 17 17.5" fill="none" stroke={C.grisFonce} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

/** Les cartes : le cœur. */
const carteCoeur: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 43C8 31 4 22 4 16C4 10 9 5.5 14.5 5.5C19 5.5 22.5 8 24 11.5C25.5 8 29 5.5 33.5 5.5C39 5.5 44 10 44 16C44 22 40 31 24 43Z" fill={C.cerise} />
    <path d="M24 43C40 31 44 22 44 16C44 12.4 42.3 9.4 39.7 7.6C42 17 37 28 24 38.5Z" fill={shade(C.cerise, -0.3)} />
    <circle cx="13.5" cy="15" r="3.2" fill={C.ceriseClair} />
  </Svg>
);

/** Les cartes : le carreau. */
const carteCarreau: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 4Q31 15.5 41 24Q31 32.5 24 44Q17 32.5 7 24Q17 15.5 24 4Z" fill={C.cerise} />
    <path d="M41 24Q31 32.5 24 44V37.5Q29.5 29.5 41 24Z" fill={shade(C.cerise, -0.3)} />
    <path d="M18 19.5Q20 17 21.5 14" fill="none" stroke={C.ceriseClair} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

/** Les cartes : le trèfle. */
const carteTrefle: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 23C24.5 34 27 40.5 31 44H17C21 40.5 23.5 34 24 23Z" fill={C.noir} />
    <circle cx="24" cy="13.5" r="9.5" fill={C.noir} />
    <circle cx="13.5" cy="27" r="9.5" fill={C.noir} />
    <circle cx="34.5" cy="27" r="9.5" fill={C.noir} />
    <circle cx="24" cy="23" r="5" fill={C.noir} />
    <path d="M18.5 13Q19 9.5 22 8M8 26.5Q8.5 23 11.5 21.5" fill="none" stroke={C.grisFonce} strokeWidth="2.6" strokeLinecap="round" />
  </Svg>
);

/** Les cartes : le valet, un lièvre à béret. */
const carteValet: Art = (props) => {
  const pelage = C.kraft;
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Les longues oreilles */}
      <path d="M15.5 25Q10 13 13.5 4Q21 10 23 23ZM32.5 25Q38 13 34.5 4Q27 10 25 23Z" fill={pelage} />
      <path d="M16.6 21Q13.6 13 14.9 8.5Q18.6 13 20 21ZM31.4 21Q34.4 13 33.1 8.5Q29.4 13 28 21Z" fill={C.rose} />
      {/* La tête, le museau */}
      <path d="M24 19Q34 19 36 30Q37.5 43.5 24 43.5Q10.5 43.5 12 30Q14 19 24 19Z" fill={pelage} />
      <ellipse cx="24" cy="37" rx="6.6" ry="4.8" fill={C.creme} />
      <path d="M21.8 33.6H26.2L24 36.4Z" fill={C.bougFonce} />
      <circle cx="18.5" cy="29.8" r="1.9" fill={C.nuit} />
      <circle cx="29.5" cy="29.8" r="1.9" fill={C.nuit} />
      {/* Le béret */}
      <path d="M13.5 24.6Q12 15.6 22.5 15Q34.6 14.6 34.6 21.6Q29 19.8 24 20.5Q18 21.5 13.5 24.6Z" fill={C.cerise} />
      <path d="M23.4 15.4L24.6 12.4" fill="none" stroke={C.cerise} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
};

/** Les cartes : la dame, une chatte au diadème. */
const carteDame: Art = (props) => {
  // Le gris-bleu du chat des Chartreux (species.tsx), absent de la palette.
  const pelage = "#8496AD";
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Les oreilles */}
      <path d="M9.5 27L10 8.5L23 18ZM38.5 27L38 8.5L25 18Z" fill={pelage} />
      <path d="M12.6 19.5L12.9 13L18.6 17.2ZM35.4 19.5L35.1 13L29.4 17.2Z" fill={C.rose} />
      {/* La tête, les babines, la truffe */}
      <ellipse cx="24" cy="30" rx="15.5" ry="13" fill={pelage} />
      <ellipse cx="24" cy="36" rx="6.4" ry="4.4" fill={C.blanc} />
      <path d="M22 32.4H26L24 35Z" fill={C.bougainvillier} />
      <circle cx="17.5" cy="28.6" r="1.9" fill={C.nuit} />
      <circle cx="30.5" cy="28.6" r="1.9" fill={C.nuit} />
      {/* Le diadème */}
      <path d="M17 20.5L18 14L21 17L24 11.5L27 17L30 14L31 20.5Q24 17.5 17 20.5Z" fill={METAL.or} />
      <circle cx="24" cy="16.6" r="1.4" fill={C.bougainvillier} />
    </Svg>
  );
};

/** Les cartes : le roi, un ours couronné. */
const carteRoi: Art = (props) => {
  const pelage = C.bois;
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Les oreilles rondes */}
      <circle cx="12.5" cy="21" r="5.6" fill={pelage} />
      <circle cx="35.5" cy="21" r="5.6" fill={pelage} />
      <circle cx="12.8" cy="21.3" r="2.8" fill={shade(pelage, -0.3)} />
      <circle cx="35.2" cy="21.3" r="2.8" fill={shade(pelage, -0.3)} />
      {/* La tête, le museau, la truffe */}
      <circle cx="24" cy="30.5" r="13.5" fill={pelage} />
      <ellipse cx="24" cy="36" rx="7" ry="5.4" fill={C.sable} />
      <ellipse cx="24" cy="33.8" rx="2.8" ry="2" fill={C.noir} />
      <circle cx="18.5" cy="28.4" r="1.9" fill={C.nuit} />
      <circle cx="29.5" cy="28.4" r="1.9" fill={C.nuit} />
      {/* La couronne */}
      <path d="M16.5 19.5L15.5 6.5L20.5 11.5L24 5L27.5 11.5L32.5 6.5L31.5 19.5Z" fill={METAL.or} />
      <circle cx="24" cy="15.6" r="1.6" fill={C.cerise} />
    </Svg>
  );
};

/** La Régate : le voilier. */
const regateVoilier: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Le mât, la flamme, les voiles */}
    <rect x="22" y="4" width="1.8" height="28" fill={C.marine} />
    <path d="M23.8 4L31 6L23.8 8.2Z" fill={C.cerise} />
    <path d="M25.4 9.4Q37.5 17.8 40.5 29H25.4Z" fill={C.marine} />
    <path d="M20.4 8.4Q13 18.8 7.5 29H20.4Z" fill={C.azur} />
    {/* La coque */}
    <path d="M5 31H43Q41 40 34 40H14Q7.5 40 5 31Z" fill={C.cerise} />
    <path d="M7.6 36H40.6Q38.6 40 34 40H14Q9.8 40 7.6 36Z" fill={shade(C.cerise, -0.3)} />
    {/* La vague */}
    <path d="M5.2 41.4Q9.9 38 14.6 41.4Q19.3 44.8 24 41.4Q28.7 38 33.4 41.4Q38.1 44.8 42.8 41.4" fill="none" stroke={C.azur} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

/** La Régate : la bouée de parcours et son fanion. */
const regateBouee: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* La hampe et le fanion */}
    <rect x="23.1" y="4" width="1.8" height="10" fill={shade(C.cerise, -0.3)} />
    <path d="M24.9 4L33 6.6L24.9 9.2Z" fill={C.mimosa} />
    {/* Le corps, sa bande blanche, son ombre */}
    <path d="M13 36L18.6 15.5Q24 11 29.4 15.5L35 36Z" fill={C.cerise} />
    <path d="M15.7 26L17.6 19H30.4L32.3 26Z" fill={C.blanc} />
    <path d="M29.4 15.5L35 36H29.5L25.5 12.6Q27.6 13.6 29.4 15.5Z" fill={C.prune} fillOpacity="0.35" />
    {/* Le flotteur */}
    <path d="M9 35H39Q39 40 34.5 40H13.5Q9 40 9 35Z" fill={shade(C.cerise, -0.3)} />
    {/* La vague */}
    <path d="M5.2 41.4Q9.9 38 14.6 41.4Q19.3 44.8 24 41.4Q28.7 38 33.4 41.4Q38.1 44.8 42.8 41.4" fill="none" stroke={C.azur} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

/** Lucarne : le ballon de cuir à pentagones. */
const footBallon: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <circle cx="25.4" cy="25.4" r="19" fill={C.grisClair} />
    <circle cx="24" cy="24" r="19" fill={C.blanc} />
    <path d="M24 43A19 19 0 0 0 42.9 22A24 24 0 0 1 10.5 37.4A19 19 0 0 0 24 43Z" fill={C.grisClair} />
    {/* Les coutures */}
    <path d="M24 17.2V12.1M30.5 21.9L35.3 20.3M28 29.5L31 33.6M20 29.5L17 33.6M17.5 21.9L12.7 20.3" fill="none" stroke={C.noir} strokeWidth="1.2" strokeLinecap="round" />
    {/* Les pentagones */}
    <path d="M24 17.2L30.5 21.9L28 29.5H20L17.5 21.9ZM16.3 6.6A19 19 0 0 1 31.7 6.6L26.8 12.1H21.2ZM38.1 11.3A19 19 0 0 1 42.9 26L36.2 22.9L34.5 17.7ZM40.5 33.5A19 19 0 0 1 28 42.6L28.8 35.2L33.2 32ZM20 42.6A19 19 0 0 1 7.5 33.5L14.8 32L19.2 35.2ZM5.1 26A19 19 0 0 1 9.9 11.3L13.5 17.7L11.8 22.9Z" fill={C.noir} />
  </Svg>
);

/** Grand Prix de la Corniche : le drapeau à damier. */
const courseDrapeau: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* La hampe et sa pomme dorée */}
    <rect x="7.4" y="7" width="3" height="37" rx="1.5" fill={C.boisFonce} />
    <circle cx="8.9" cy="6.8" r="2.8" fill={METAL.or} />
    {/* L'étoffe qui ondule, son ombre, son damier */}
    <path d="M11 7L19 10L27 10.5L35 8L43 7V31L35 32L27 34.5L19 34L11 31Z" transform="translate(1.4 1.6)" fill={C.grisClair} />
    <path d="M11 7L19 10L27 10.5L35 8L43 7V31L35 32L27 34.5L19 34L11 31Z" fill={C.blanc} />
    <path d="M11 7L19 10V18L11 15ZM11 23L19 26V34L11 31ZM19 18L27 18.5V26.5L19 26ZM27 10.5L35 8V16L27 18.5ZM27 26.5L35 24V32L27 34.5ZM35 16L43 15V23L35 24Z" fill={C.noir} />
  </Svg>
);

/**
 * Clés attendues :
 * - morpion:truffe, morpion:gland (Tic-Tac-Truffe), morpion:moustache, morpion:monocle (Moustache d'Or)
 * - carte:pique, carte:coeur, carte:carreau, carte:trefle (les enseignes),
 *   carte:valet (un lièvre), carte:dame (une chatte), carte:roi (un ours)
 * - regate:voilier, regate:bouee
 * - foot:ballon
 * - course:drapeau (un drapeau à damier)
 */
export const SYMBOLS_JEUX: Record<string, Art> = {
  "morpion:truffe": morpionTruffe,
  "morpion:gland": morpionGland,
  "morpion:moustache": morpionMoustache,
  "morpion:monocle": morpionMonocle,
  "carte:pique": cartePique,
  "carte:coeur": carteCoeur,
  "carte:carreau": carteCarreau,
  "carte:trefle": carteTrefle,
  "carte:valet": carteValet,
  "carte:dame": carteDame,
  "carte:roi": carteRoi,
  "regate:voilier": regateVoilier,
  "regate:bouee": regateBouee,
  "foot:ballon": footBallon,
  "course:drapeau": courseDrapeau,
};
