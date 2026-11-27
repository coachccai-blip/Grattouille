// Les dessins de la vitrine des trophées (BRIEF.md, section 4.5 : papier découpé à la
// gouache, aplats sans contour, ombres décalées, les métaux pour seuls dégradés).
//
// - Douze objets de vitrine, un par famille, et le drap qui couvre ceux qui gardent leur
//   secret. viewBox 0 0 100 100, comme les trésors de la Galerie ; l'objet est posé sur une
//   même tablette de bois, qui les rassemble.
// - La médaille : un ruban aux couleurs de sa famille, un disque dont le métal monte avec
//   le palier (cuivre, argent, or, or émaillé, or dentelé, étoile à rayons : la dernière
//   médaille d'une famille est toujours la plus belle), et l'emblème de la famille. Pas
//   encore gagnée, elle n'est qu'une silhouette.

import type { ReactNode } from "react";
import type { TrophyId } from "../../../shared/trophies";
import { trophyById } from "../../../shared/trophies";
import { C, METAL, Svg, shade, type Art, type ArtProps } from "../../art/kit";

/** Une étoile à cinq branches, centrée, de rayon 9. */
const ETOILE = "M0-9L2.2-3.1L8.6-2.8L3.6 1.2L5.3 7.3L0 3.8L-5.3 7.3L-3.6 1.2L-8.6-2.8L-2.2-3.1Z";
/** Un pique et un cœur, centrés, hauts de 16 environ. */
const PIQUE = "M0-8C4-3 8 0 8 3.5A4 4 0 0 1 1.5 6L3 9H-3L-1.5 6A4 4 0 0 1-8 3.5C-8 0-4-3 0-8Z";
const COEUR = "M0 8C-9 1-8-6-3.5-6.5Q-1-6.6 0-4Q1-6.6 3.5-6.5C8-6 9 1 0 8Z";

/** La tablette de bois sombre sur laquelle chaque objet est exposé. */
function Socle() {
  return (
    <>
      <path d="M14 87H86L90 95H10Z" fill={C.boisFonce} />
      <rect x="16" y="83" width="68" height="5" rx="1.5" fill={C.bois} />
      <rect x="41" y="89.5" width="18" height="3" rx="1" fill={METAL.laiton} />
    </>
  );
}

/** La Pièce à gratter : un ticket dont l'encre d'argent est entamée, et la pièce qui l'a gratté. */
const piece: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <g transform="rotate(-9 40 50)">
      <rect x="15" y="20" width="52" height="58" rx="5" fill={shade(C.ivoire, -0.2)} transform="translate(2.5 2.5)" />
      <rect x="15" y="20" width="52" height="58" rx="5" fill={C.ivoire} />
      <path d="M15 34V25Q15 20 20 20H62Q67 20 67 25V34Z" fill={C.bougainvillier} />
      <rect x="21" y="41" width="40" height="29" rx="3" fill={METAL.argent} />
      <path d="M26 64L33 48M36 65L45 46M48 63L54 50" fill="none" stroke={C.ivoire} strokeWidth="5.5" strokeLinecap="round" />
    </g>
    <circle cx="68" cy="62" r="22" fill={C.mimosaFonce} />
    <circle cx="66" cy="60" r="22" fill={METAL.or} />
    <circle cx="66" cy="60" r="16.5" fill="none" stroke={C.mimosaFonce} strokeWidth="1.6" />
    <path d={ETOILE} transform="translate(66 60) scale(1.1)" fill={C.mimosaFonce} />
    <path d="M17 82q3-3.5 6 0M29 80q2.5-3 5 0M40 82q2-2.5 4 0" fill="none" stroke={C.grisClair} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/** Le Chèque géant : plus large que le chevalet qui le porte, sa cocarde au coin. */
const cheque: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <path d="M29 86L46 12H54L71 86H64L50 24L36 86Z" fill={C.bois} />
    <path d="M50 24L54 12L71 86H64Z" fill={C.boisFonce} />
    <g transform="rotate(-4 50 48)">
      <rect x="5" y="27" width="90" height="44" rx="3" fill={shade(C.ivoire, -0.2)} transform="translate(2 2.5)" />
      <rect x="5" y="27" width="90" height="44" rx="3" fill={C.ivoire} />
      <path d="M5 37V30Q5 27 8 27H92Q95 27 95 30V37Z" fill={C.persienne} />
      <path d="M12 45H48M12 52H38" fill="none" stroke={C.encre} strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
      <path d="M12 64Q17 57 22 63T32 62T40 63" fill="none" stroke={C.marine} strokeWidth="2" strokeLinecap="round" />
      <rect x="54" y="42" width="35" height="13" rx="2.5" fill={C.mimosa} />
      <path
        d="M58 48.5a2.2 3 0 1 0 4.4 0a2.2 3 0 1 0-4.4 0ZM64.4 48.5a2.2 3 0 1 0 4.4 0a2.2 3 0 1 0-4.4 0ZM70.8 48.5a2.2 3 0 1 0 4.4 0a2.2 3 0 1 0-4.4 0ZM77.2 48.5a2.2 3 0 1 0 4.4 0a2.2 3 0 1 0-4.4 0Z"
        fill="none" stroke={C.nuit} strokeWidth="1.5"
      />
    </g>
    <path d="M76 68L72 84L79 79L84 85L84 68Z" fill={C.bougFonce} />
    <circle cx="80" cy="64" r="9" fill={C.bougainvillier} />
    <path d={ETOILE} transform="translate(80 64) scale(0.55)" fill={C.ivoire} />
  </Svg>
);

/** La Cloche du jackpot : une cloche de bord en laiton, sous son portique. */
const cloche: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <path d="M20 84V16H80V84H73V23H27V84Z" fill={C.bois} />
    <path d="M73 23H80V84H73Z" fill={C.boisFonce} />
    <path d="M50 23V32" fill="none" stroke={C.grisFonce} strokeWidth="3" />
    <circle cx="50" cy="74" r="4.5" fill={C.grisFonce} />
    <path d="M50 30C38 30 35 43 34 55L28 66H72L66 55C65 43 62 30 50 30Z" fill={METAL.laiton} />
    <path d="M50 30C62 30 65 43 66 55L72 66H57C60 53 58 37 50 30Z" fill={C.boisFonce} opacity="0.35" />
    <rect x="26" y="64" width="48" height="5.5" rx="2.75" fill={METAL.or} />
    <path d="M50 78Q55 80 52 85" fill="none" stroke={C.ecume} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M14 42Q9 49 14 56M86 42Q91 49 86 56M8 37Q0 49 8 61M92 37Q100 49 92 61" fill="none" stroke={C.mimosa} strokeWidth="2.4" strokeLinecap="round" />
  </Svg>
);

/** La Poche trouée : un pan de tweed sous cadre, et le ticket qui s'échappe par la pointe de la poche. */
const poche: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <rect x="17" y="5" width="66" height="68" rx="2" fill={C.bois} />
    <path d="M83 5V73H17L22 68H78V10Z" fill={C.boisFonce} />
    <rect x="22" y="10" width="56" height="58" fill={C.marine} />
    <path
      d="M22 19l7-5 7 5 7-5 7 5 7-5 7 5 7-5 7 5M22 66l7-5 7 5 7-5 7 5 7-5 7 5 7-5 7 5"
      fill="none" stroke={shade(C.marine, 0.28)} strokeWidth="1.6"
    />
    <path d="M31 24H69V48L50 60L31 48Z" fill={shade(C.marine, 0.38)} />
    <path d="M31 24H69V31H31Z" fill={shade(C.marine, 0.6)} />
    <path d="M40 53.5L50 60L60 53.5Q50 49 40 53.5Z" fill="#06181E" />
    <g transform="rotate(12 51 72)">
      <rect x="41.5" y="56" width="19" height="30" rx="2.5" fill={C.mimosaFonce} transform="translate(1.5 1.5)" />
      <rect x="41.5" y="56" width="19" height="30" rx="2.5" fill={C.mimosa} />
      <path d="M41.5 65H60.5" fill="none" stroke={C.mimosaFonce} strokeWidth="1.4" strokeDasharray="2 2" />
      <path d={ETOILE} transform="translate(51 76) scale(0.55)" fill={C.mimosaFonce} />
    </g>
  </Svg>
);

/** Une pièce d'or et sa tranche, pour ce qui déborde de la corne. */
function Sou({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x + 1.2} cy={y + 1.2} r="6.5" fill={C.mimosaFonce} />
      <circle cx={x} cy={y} r="6.5" fill={C.mimosa} />
      <circle cx={x} cy={y} r="3.6" fill="none" stroke={C.mimosaFonce} strokeWidth="1.2" />
    </>
  );
}

/** La Corne d'abondance : il en tombe des pièces et des tickets. */
const corne: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <path d="M30 84L33 50" fill="none" stroke={C.bois} strokeWidth="4" strokeLinecap="round" />
    <path d="M64 27Q40 22 22 11Q12 8 12 18Q14 30 28 45Q44 64 66 75Z" fill={METAL.laiton} />
    <path d="M66 75Q44 64 28 45Q14 30 12 18Q22 34 36 46Q50 58 66 62Z" fill={C.boisFonce} opacity="0.35" />
    <path d="M49 24Q41 42 52 64M35 18Q29 31 37 51M23 13Q19 21 24 36" fill="none" stroke={C.mimosaFonce} strokeWidth="2.4" strokeLinecap="round" />
    <ellipse cx="65" cy="51" rx="11" ry="24.5" fill={C.boisFonce} transform="rotate(4 65 51)" />
    <ellipse cx="65" cy="51" rx="11" ry="24.5" fill="none" stroke={METAL.or} strokeWidth="3" transform="rotate(4 65 51)" />
    <rect x="62" y="44" width="15" height="21" rx="2" fill={C.ivoire} transform="rotate(28 69 54)" />
    <rect x="74" y="56" width="14" height="20" rx="2" fill={C.bougainvillier} transform="rotate(62 81 66)" />
    <Sou x={70} y={75} />
    <Sou x={84} y={77} />
    <Sou x={58} y={78} />
    <Sou x={77} y={64} />
  </Svg>
);

/** Le Cintre d'or : accroché à son écusson de velours, son étiquette encore au bras. */
const cintre: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <path d="M20 8H80V56Q80 77 50 85Q20 77 20 56Z" fill={C.prune} />
    <path d="M50 8H80V56Q80 77 50 85Z" fill={shade(C.prune, -0.3)} />
    <circle cx="50" cy="19" r="3.5" fill={METAL.laiton} />
    <path d="M50 39V33a7 7 0 1 0-7-7" fill="none" stroke={METAL.or} strokeWidth="4" strokeLinecap="round" />
    <path d="M50 39L84 61a3.5 3.5 0 0 1-2 6.5H18a3.5 3.5 0 0 1-2-6.5Z" fill="none" stroke={METAL.or} strokeWidth="4.5" strokeLinejoin="round" />
    <path d="M30 67V73" fill="none" stroke={C.paille} strokeWidth="1.4" />
    <g transform="rotate(-8 30 73)">
      <path d="M24 75L27 71H33L36 75V89H24Z" fill={C.ivoire} />
      <path d={ETOILE} transform="translate(30 81) scale(0.45)" fill={C.bougainvillier} />
    </g>
  </Svg>
);

/** La Valise aux étiquettes : une étiquette par escale, et la dernière vient de la Lune. */
const valise: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <path d="M37 30V23Q37 16 44 16H56Q63 16 63 23V30" fill="none" stroke={C.boisFonce} strokeWidth="5" />
    <rect x="9" y="28" width="82" height="56" rx="7" fill={C.terracotta} />
    <path d="M9 62H91V77Q91 84 84 84H16Q9 84 9 77Z" fill={shade(C.terracotta, -0.2)} />
    <path d="M22 28H29V84H22ZM71 28H78V84H71Z" fill={C.boisFonce} />
    <path d="M9 42V35Q9 28 16 28H22ZM91 42V35Q91 28 84 28H78ZM9 70V77Q9 84 16 84H22ZM91 70V77Q91 84 84 84H78Z" fill={METAL.laiton} />
    <rect x="45.5" y="28" width="9" height="7" rx="1.5" fill={METAL.laiton} />
    <circle cx="42" cy="50" r="9.5" fill={C.azur} />
    <path d={ETOILE} transform="translate(42 50) scale(0.6)" fill={C.blanc} />
    <rect x="48" y="62" width="19" height="13" rx="2" fill={C.mimosa} transform="rotate(-11 57 68)" />
    <path d="M51 68.5H63" fill="none" stroke={C.mimosaFonce} strokeWidth="2" strokeLinecap="round" transform="rotate(-11 57 68)" />
    <path d="M33 64L46 70L33 77Z" fill={C.bougainvillier} />
    <circle cx="60" cy="46" r="8.5" fill={C.nuit} />
    <path d="M62 40.5A6 6 0 1 0 66 49.5A5 5 0 0 1 62 40.5Z" fill={C.ivoire} />
  </Svg>
);

/** Une clé : l'anneau, la tige, le panneton. Pendue par le haut de l'anneau, en (0, 0). */
function Cle({ metal, tourne }: { metal: string; tourne: number }) {
  return (
    <g transform={`translate(50 38) rotate(${tourne})`}>
      <path d="M-6.5 13a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0ZM-2.8 13a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0-5.6 0Z" fillRule="evenodd" fill={metal} />
      <path d="M-2 19H2V44H-2ZM2 33H8V37H5V40H2Z" fill={metal} />
    </g>
  );
}

/** Les Clés du Kiosque : le trousseau de Gaspard, et son porte-clés aux rayures du store. */
const cles: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <path d="M22 28V84M78 28V84" fill="none" stroke={METAL.laiton} strokeWidth="3.5" />
    <rect x="16" y="8" width="68" height="22" rx="4" fill={C.bois} />
    <path d="M16 22H84V26Q84 30 80 30H20Q16 30 16 26Z" fill={C.boisFonce} />
    <rect x="48" y="13" width="4" height="15" rx="2" fill={METAL.laiton} />
    <circle cx="50" cy="35" r="8" fill="none" stroke={METAL.argent} strokeWidth="2.8" />
    <Cle metal={METAL.laiton} tourne={27} />
    <Cle metal={METAL.or} tourne={-27} />
    <path d="M50 43V52" fill="none" stroke={C.grisClair} strokeWidth="1.6" />
    <path d="M41 51H59V72Q56 76.5 53 72Q50 76.5 47 72Q44 76.5 41 72Z" fill={C.blanc} />
    <path d="M41 51H47V72Q44 76.5 41 72ZM53 51H59V72Q56 76.5 53 72Z" fill={C.mimosa} />
  </Svg>
);

/** Le Gant relevé : un gant blanc, dressé sur son coussin de velours. */
const gant: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <path d="M14 66Q50 57 86 66Q90 75 86 84Q50 89 14 84Q10 75 14 66Z" fill={C.bordeaux} />
    <path d="M86 66Q90 75 86 84Q50 89 14 84Q52 83 86 66Z" fill={shade(C.bordeaux, -0.3)} />
    <path d="M12 64a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0ZM81 64a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0Z" fill={METAL.or} />
    <path d="M35 72L37.5 50H62.5L65 72Z" fill={C.craie} />
    <path d="M37.5 50H62.5L63.2 56H36.8Z" fill={shade(C.craie, -0.16)} />
    <path d="M37 52V15a3.3 3.3 0 0 1 6.6 0V10a3.3 3.3 0 0 1 6.6 0V12a3.3 3.3 0 0 1 6.6 0V19a3.3 3.3 0 0 1 6.2 0V52Z" fill={C.craie} />
    <path d="M37 44Q28 40 26.5 30Q26.5 25.5 30 25.5Q33.5 25.5 34 30L37 36Z" fill={C.craie} />
    <path d="M56.8 12a3.3 3.3 0 0 1 0 0V19a3.3 3.3 0 0 1 6.2 0V52H56.8Z" fill={shade(C.craie, -0.12)} />
    <path d="M43.6 24V40M50.2 22V40M56.8 26V40" fill="none" stroke={shade(C.craie, -0.25)} strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);

/** La Loupe du limier : sous le verre, la carte montre ce qu'elle cachait. */
const loupe: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <g transform="rotate(-12 36 50)">
      <rect x="14" y="14" width="44" height="66" rx="5" fill={shade(C.ivoire, -0.2)} transform="translate(2.5 2.5)" />
      <rect x="14" y="14" width="44" height="66" rx="5" fill={C.ivoire} />
      <path d={PIQUE} transform="translate(23 25) scale(0.6)" fill={C.nuit} />
      <path d={PIQUE} transform="translate(49 69) scale(0.6) rotate(180)" fill={C.nuit} />
    </g>
    <path d="M70 60L88 79" fill="none" stroke={C.boisFonce} strokeWidth="8" strokeLinecap="round" />
    <path d="M69 59L75 65.5" fill="none" stroke={METAL.laiton} strokeWidth="9" />
    <circle cx="54" cy="43" r="21" fill={C.ciel} />
    <path d={PIQUE} transform="translate(49 44) scale(1.5)" fill={C.nuit} />
    <path d={COEUR} transform="translate(64 50) scale(0.75)" fill={C.cerise} />
    <circle cx="54" cy="43" r="21" fill="none" stroke={METAL.laiton} strokeWidth="5" />
    <path d="M40 34Q43 26 51 25" fill="none" stroke={C.blanc} strokeWidth="2.6" strokeLinecap="round" />
  </Svg>
);

/** La Coupe des Maîtres : la seule coupe de la vitrine, frappée d'un pique. */
const coupe: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <path d="M30 79H70V85H76V95H24V85H30Z" fill={C.boisFonce} />
    <path d="M30 79H70V85H30Z" fill={C.bois} />
    <rect x="41" y="87.5" width="18" height="4" rx="1" fill={METAL.laiton} />
    <path d="M30 24Q11 24 13 39Q15 52 35 52M70 24Q89 24 87 39Q85 52 65 52" fill="none" stroke={METAL.or} strokeWidth="4.5" strokeLinecap="round" />
    <path d="M28 12H72Q72 50 56 58V69H63V79H37V69H44V58Q28 50 28 12Z" fill={METAL.or} />
    <path d="M52 12H72Q72 50 56 58V69H63V79H52Z" fill={C.mimosaFonce} opacity="0.45" />
    <rect x="25" y="9" width="50" height="6" rx="3" fill={METAL.or} />
    <path d={PIQUE} transform="translate(49 32) scale(1.15)" fill={C.nuit} />
  </Svg>
);

/** Les angles de l'éventail : huit cartes, de gauche à droite. */
const EVENTAIL = [-33, -23.6, -14.1, -4.7, 4.7, 14.1, 23.6, 33];

/** Les Huit As de cœur : c'est comme ça qu'on se reconnaît, à Grattouille. */
const as: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    {EVENTAIL.map((angle) => (
      <g key={angle} transform={`rotate(${angle} 50 88)`}>
        <rect x="36" y="18" width="24" height="56" rx="3" fill={shade(C.ivoire, -0.32)} />
        <rect x="38" y="18" width="24" height="56" rx="3" fill={C.ivoire} />
        <path d={COEUR} transform="translate(50 30) scale(0.7)" fill={C.cerise} />
      </g>
    ))}
    <path d="M36 72H64L66 84H34Z" fill={METAL.or} />
    <path d={COEUR} transform="translate(50 78) scale(0.45)" fill={C.cerise} />
  </Svg>
);

/** Sous le drap : un trophée qui garde son secret. */
const mystere: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <Socle />
    <path d="M50 10Q63 10 67 23L82 84H18L33 23Q37 10 50 10Z" fill={C.prune} />
    <path d="M50 10Q63 10 67 23L82 84H64L57 30Q55 15 50 10Z" fill={shade(C.prune, -0.3)} />
    <path d="M39 30L31 84M45 25L43 84" fill="none" stroke={shade(C.prune, 0.16)} strokeWidth="2.2" strokeLinecap="round" />
    <rect x="18" y="81" width="64" height="3.5" fill={METAL.or} />
    <path d="M42.5 43Q42.5 33.5 50 33.5Q57.5 33.5 57.5 41Q57.5 46 50 50.5V56" fill="none" stroke={C.mimosa} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="65" r="3.3" fill={C.mimosa} />
  </Svg>
);

const OBJETS: Record<TrophyId, Art> = {
  tickets: piece, gain: cheque, jackpots: cloche, semeur: poche, mecene: corne, collection: cintre,
  voyage: valise, patron: cles, defis: gant, limier: loupe, maitres: coupe, legende: as,
};

/** L'objet d'une famille dans la vitrine ; sous son drap tant qu'il garde son secret. */
export function Objet({ famille, voile = false, ...props }: ArtProps & { famille: TrophyId; voile?: boolean }) {
  const Dessin = voile ? mystere : OBJETS[famille];
  return <Dessin {...props} />;
}

// ---------------------------------------------------------------------------
// La médaille

/**
 * Le ruban de chaque famille : sa couleur et son filet. L'émail des plus hautes médailles
 * reprend la couleur du ruban, un ton plus bas ; une troisième couleur le remplace quand
 * celle du ruban ne trancherait pas sur l'or.
 */
const RUBANS: Record<TrophyId, readonly [ruban: string, filet: string, email?: string]> = {
  tickets: [C.mimosa, C.blanc, C.marine],
  gain: [C.persienne, C.ivoire],
  jackpots: [C.bougainvillier, C.mimosa],
  semeur: [C.amande, C.persFonce, C.persFonce],
  mecene: [C.corail, C.ivoire, C.brique],
  collection: [C.azur, C.blanc],
  voyage: [C.marine, C.ciel],
  patron: [C.brique, C.paille],
  defis: [C.bordeaux, C.paille],
  limier: [C.ardoise, C.mimosa],
  maitres: [C.noir, C.mimosa],
  legende: [C.cerise, C.blanc],
};

/** L'emblème de chaque famille, dans un carré de 18 centré : plein, ou au trait. */
const EMBLEMES: Record<TrophyId, { d: string; trait?: true }> = {
  tickets: { d: "M-8-5H8V-1.7A1.7 1.7 0 0 0 8 1.7V5H-8V1.7A1.7 1.7 0 0 0-8-1.7Z" },
  gain: { d: "M5.5-5.5A7 7 0 1 0 5.5 5.5M-8.5-1.9H2M-8.5 1.9H2", trait: true },
  jackpots: { d: ETOILE },
  semeur: { d: "M-1 8.5V0C-6 .5-8.5-3-8.5-8C-3.5-8-.5-6 0-2C1-5.5 4-7 8.5-7C8.5-2 6 1.5 1 1.5V8.5Z" },
  mecene: { d: COEUR },
  collection: { d: "M0-2.5V-4a2.5 2.5 0 1 0-2.5-2.5M0-2.5L8 3.5a1.5 1.5 0 0 1-1 2.7H-7a1.5 1.5 0 0 1-1-2.7Z", trait: true },
  voyage: { d: "M3-8.5A8.5 8.5 0 1 0 8.5 3A6.8 6.8 0 0 1 3-8.5Z" },
  patron: { d: "M-4.5-2A4 4 0 1 0-4.5 2H2.5V4.5H4.5V2H6V4.5H8.5V-2ZM-9.3 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0Z" },
  defis: { d: PIQUE },
  limier: { d: "M-9.5 0Q0-8.5 9.5 0Q0 8.5-9.5 0ZM-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0-6.4 0Z" },
  maitres: { d: "M-8.5 5.5V-5L-4-1L0-7.5L4-1L8.5-5V5.5Z" },
  legende: { d: "M-6.5-9H6.5V9H-6.5ZM0 4.4C-5-.5-4.4-3.3-1.9-3.6Q-.55-3.6 0-2.2Q.55-3.6 1.9-3.6C4.4-3.3 5-.5 0 4.4Z" },
};

/** Une étoile à `pointes` branches autour du disque de la médaille, centré en (24, 42). */
function rayons(pointes: number, grand: number, petit: number): string {
  let d = "";
  for (let i = 0; i < pointes * 2; i++) {
    const r = i % 2 === 0 ? grand : petit;
    const a = (Math.PI * i) / pointes - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(24 + r * Math.cos(a)).toFixed(1)} ${(42 + r * Math.sin(a)).toFixed(1)}`;
  }
  return `${d}Z`;
}

/** Le bord dentelé de l'avant-dernier grade, et l'étoile à rayons du dernier. */
const DENTELE = rayons(18, 19.5, 17);
const RAYONS = rayons(12, 23.5, 18);

/**
 * Le grade d'une médaille, de 1 à 6 : le premier palier d'une famille est de cuivre, son
 * dernier porte toujours l'étoile à rayons, quel que soit le nombre de paliers entre les deux.
 */
export function gradeDe(famille: TrophyId, rang: number): number {
  const paliers = trophyById(famille)?.tiers.length ?? 1;
  return paliers <= 1 ? 6 : Math.round(1 + ((rang - 1) * 5) / (paliers - 1));
}

interface MedailleProps extends ArtProps {
  famille: TrophyId;
  /** Le rang dans la famille, à partir de 1. */
  rang: number;
  /** Pas encore gagnée : une silhouette, de la couleur du texte qui l'entoure. */
  gagnee?: boolean;
  /** Une médaille dont on ne sait rien : sa silhouette porte un point d'interrogation. */
  secrete?: boolean;
}

export function Medaille({ famille, rang, gagnee = true, secrete = false, ...props }: MedailleProps) {
  const grade = gradeDe(famille, rang);
  const dos = grade >= 6 ? RAYONS : grade === 5 ? DENTELE : null;
  let corps: ReactNode;
  if (!gagnee || secrete) {
    corps = (
      <>
        <g fill="currentColor">
          <path d="M15 0H33V25L24 32L15 25Z" />
          {dos && <path d={dos} />}
          <circle cx="24" cy="42" r="16" />
        </g>
        {secrete && (
          <>
            <path d="M19.5 39Q19.5 34 24 34Q28.5 34 28.5 38Q28.5 41 24 43.5V46" fill="none" stroke={C.nuit} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            <circle cx="24" cy="51" r="2" fill={C.nuit} opacity="0.7" />
          </>
        )}
      </>
    );
  } else {
    const [ruban, filet, email = shade(ruban, -0.15)] = RUBANS[famille];
    const metal = grade === 1 ? METAL.cuivre : grade === 2 ? METAL.argent : METAL.or;
    const ombre = grade === 1 ? "#8A4A22" : grade === 2 ? "#7E8790" : "#9A6F0E";
    const emaille = grade >= 4;
    const embleme = EMBLEMES[famille];
    const encre = emaille ? C.ivoire : ombre;
    corps = (
      <>
        <path d="M15 0H33V25L24 32L15 25Z" fill={ruban} />
        <path d="M21 0H27V29.7L24 32L21 29.7Z" fill={filet} />
        {dos && <path d={dos} fill={ombre} transform="translate(1 1.3)" />}
        {dos && <path d={dos} fill={metal} />}
        <circle cx="25.2" cy="43.5" r="16" fill={ombre} />
        <circle cx="24" cy="42" r="16" fill={metal} />
        {emaille
          ? <circle cx="24" cy="42" r="12" fill={email} />
          : <circle cx="24" cy="42" r="12.5" fill="none" stroke={ombre} strokeWidth="1.3" />}
        <path
          d={embleme.d}
          transform="translate(24 42)"
          fillRule="evenodd"
          {...(embleme.trait
            ? { fill: "none", stroke: encre, strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }
            : { fill: encre })}
        />
      </>
    );
  }
  return <Svg viewBox="0 0 48 66" {...props}>{corps}</Svg>;
}
