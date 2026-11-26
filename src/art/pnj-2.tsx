// Les trois hôtes d'après minuit.
//
// Même contrat que pnj.tsx (à lire d'abord) : portrait en buste, de face, dans un
// médaillon rond, viewBox 0 0 120 120, fond en aplat, visage dans le cercle de
// rayon 52 centré en (60, 60).
//
// Identifiants attendus : balthazar (le Commodore Balthazar, pélican, hôte du Yacht),
// taupin (Maître Taupin, taupe, banquier), selene (Dame Séléné, lièvre de la Lune).

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Un semis de petits ronds en un seul tracé : boutons, verres de lunettes, étoiles lointaines. */
function semis(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** Une étoile à quatre branches, de rayon `s`, en un seul tracé. */
function etoile(x: number, y: number, s: number): string {
  const k = +(s * 0.26).toFixed(2);
  return `M${x} ${y - s}l${k} ${s - k}l${s - k} ${k}l${k - s} ${k}l${-k} ${s - k}l${-k} ${k - s}l${k - s} ${-k}l${s - k} ${-k}Z`;
}

/**
 * Le Commodore Balthazar : pélican en grand blanc, épaulettes d'or. Pompeux et ravi de lui :
 * le bec porté haut, la poche qui pend, un sourcil levé. Le buste est de face, le bec de profil :
 * c'est à sa poche qu'on reconnaît un pélican.
 */
const balthazar: Art = (props) => {
  const ombre = shade(C.blanc, -0.14);
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={shade(C.marine, -0.35)} />
      {/* Grand blanc : épaules larges, épaulettes à franges, médaille, boutons d'or */}
      <path d="M6 120V106Q6 88 28 88H92Q114 88 114 106V120Z" fill={C.blanc} />
      <path d="M92 88Q114 88 114 106V120H98V92ZM60 88H90Q84 95.5 72 95.5Q63 95 60 88Z" fill={ombre} />
      <path d="M15 95V103M19.5 95.5V104M24 96V104.5M28.5 96V104M33 95.5V103M105 95V103M100.5 95.5V104M96 96V104.5M91.5 96V104M87 95.5V103" fill="none" stroke={METAL.or} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="25" cy="91" rx="14" ry="5.5" transform="rotate(-12 25 91)" fill={METAL.or} />
      <ellipse cx="95" cy="91" rx="14" ry="5.5" transform="rotate(12 95 91)" fill={METAL.or} />
      <rect x="29" y="102" width="6" height="6" fill={C.cerise} />
      <circle cx="32" cy="110.5" r="3.4" fill={METAL.or} />
      <circle cx="50" cy="102" r="2.5" fill={METAL.or} />
      <circle cx="70" cy="102" r="2.5" fill={METAL.or} />
      <circle cx="50" cy="113" r="2.5" fill={METAL.or} />
      <circle cx="70" cy="113" r="2.5" fill={METAL.or} />
      {/* Long cou, petite tête */}
      <rect x="40" y="56" width="20" height="34" fill={C.blanc} />
      <ellipse cx="50" cy="45" rx="20" ry="18" fill={C.blanc} />
      {/* L'énorme bec, porté haut, et sa poche qui pend */}
      <path d="M49 54Q40 82 64 90Q88 94 101 67L99 64L50 55Z" fill={C.mimosa} />
      <path d="M64 90Q88 94 101 67L99 64L92 62.6Q84 84 64 90Z" fill={shade(C.mimosa, -0.18)} />
      <path d="M50 56Q49 47 60 45L104 59Q109 62 108 68Q106 72 102 67L99 66Z" fill={C.corail} />
      <path d="M97 56.8L104 59Q109 62 108 68Q106 72 102 67L99 66L96.2 65.4Z" fill={shade(C.corail, -0.2)} />
      <circle cx="41" cy="42.5" r="2.5" fill={C.nuit} />
      <circle cx="59" cy="41" r="2.5" fill={C.nuit} />
      {/* Un sourcil posé, l'autre très haut */}
      <path d="M35 38Q40.5 35 46.5 37.5L46 40Q40.5 37.8 35.8 40.6Z" fill={C.nuit} />
      <path d="M53 35.5Q58.5 29.5 65.5 33.5L64.5 36.2Q58.5 32.8 54.5 37.5Z" fill={C.nuit} />
      {/* Casquette de commodore, un peu en arrière */}
      <g transform="rotate(-8 50 26)">
        <path d="M19 16.5Q19 2.5 50 2.5Q81 2.5 81 16.5Q81 21.5 75 21.5H25Q19 21.5 19 16.5Z" fill={C.blanc} />
        <path d="M67 5Q81 7.5 81 16.5Q81 21.5 75 21.5H65Q71 13.5 67 5Z" fill={ombre} />
        <path d="M29 19.5H71V29Q50 23.5 29 29Z" fill={C.marine} />
        <path d="M27 28.5Q50 21.5 73 28.5Q50 35.5 27 28.5Z" fill={C.nuit} />
        <path d="M35 28.5Q50 25 65 28.5" fill="none" stroke={METAL.or} strokeWidth="1.6" strokeLinecap="round" />
        <path d={etoile(50, 17, 7)} fill={METAL.or} />
      </g>
    </Svg>
  );
};

/** Maître Taupin : taupe en costume noir et faux col. Méticuleux et myope : petites lunettes épaisses, mains jointes. */
const taupin: Art = (props) => {
  const velours = C.ardoise;
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      {/* Vert de coffre-fort : une amande assourdie */}
      <rect width="120" height="120" fill={shade(C.amande, -0.16)} />
      {/* Costume noir aux épaules rondes, revers de satin */}
      <path d="M6 120V100Q6 78 30 74H90Q114 78 114 100V120Z" fill={C.noir} />
      <path d="M45 88L54 120H42L34 86ZM75 88L66 120H78L86 86Z" fill={C.grisFonce} />
      {/* La chaîne de montre */}
      <path d="M79 100Q87 109 96 101" fill="none" stroke={METAL.or} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 3.3" />
      <circle cx="96.5" cy="100.5" r="2.4" fill={METAL.or} />
      {/* Ni cou, ni oreilles : la tête est posée sur un grand faux col, raide et blanc */}
      <path d="M56.5 88H63.5L62 96H58Z" fill={C.grisFonce} />
      <path d="M33 58H87L84 84Q72 90 62.5 91L60 85L57.5 91Q48 90 36 84Z" fill={C.blanc} />
      <path d="M73 58H87L84 84Q78.5 87 73 88.8Z" fill={shade(C.blanc, -0.14)} />
      {/* Trois cheveux, peignés avec soin */}
      <path d="M55 16Q55 8 61 5.5M60 15Q61 7 68 6M65 16Q67 9 74 9.5" fill="none" stroke={velours} strokeWidth="1.5" strokeLinecap="round" />
      {/* Tête en goutte, la pointe en bas : le long museau rose */}
      <path d="M60 14C78 14 93 28 93 44C93 56 78 60 70 68L64.5 79Q63.5 83 60 83Q56.5 83 55.5 79L50 68C42 60 27 56 27 44C27 28 42 14 60 14Z" fill={velours} />
      <path d="M54.5 74L37 70M54.5 77L36 78M65.5 74L83 70M65.5 77L84 78" fill="none" stroke={velours} strokeWidth="0.9" />
      <path d="M69.5 69L64.5 79Q63.5 83 60 83Q56.5 83 55.5 79L50.5 69Q60 64.5 69.5 69Z" fill={C.rose} />
      <path d={semis(0.8, [[58.3, 80], [61.7, 80]])} fill={shade(C.rose, -0.45)} />
      {/* Petites lunettes épaisses : les yeux sont deux points derrière */}
      <path d="M54 54Q60 51 66 54" fill="none" stroke={METAL.or} strokeWidth="1.8" />
      <path d={semis(6, [[48, 55], [72, 55]])} fill={C.ciel} />
      <path d={semis(3.4, [[48, 55], [72, 55]])} fill={C.blanc} />
      <path d={semis(1.5, [[48, 55], [72, 55]])} fill={C.nuit} />
      <circle cx="48" cy="55" r="6.2" fill="none" stroke={METAL.or} strokeWidth="2.5" />
      <circle cx="72" cy="55" r="6.2" fill="none" stroke={METAL.or} strokeWidth="2.5" />
      {/* Sourcils relevés au milieu : le scrupule */}
      <path d="M37.5 46L51 41.5L51.8 44.5L38.5 48.8Z" fill={C.blanc} />
      <path d="M82.5 46L69 41.5L68.2 44.5L81.5 48.8Z" fill={C.blanc} />
      {/* Mains jointes : larges pattes roses, griffes claires, manchettes */}
      <path d="M40.5 120L44 114H59.5V120ZM79.5 120L76 114H60.5V120Z" fill={C.blanc} />
      <path d="M47.2 104.6L48.4 98.2L50.6 104.2ZM52.6 101.6L54.2 94.6L55.6 101.4ZM57.6 99L59.4 92.2L59.8 98.4ZM72.8 104.6L71.6 98.2L69.4 104.2ZM67.4 101.6L65.8 94.6L64.4 101.4ZM62.4 99L60.6 92.2L60.2 98.4Z" fill={C.blanc} />
      <path d="M45 116Q43.5 108.5 49 103.5L51.6 106.2L54 100.2L56.4 103L59.6 97.5V116Z" fill={C.rose} />
      <path d="M75 116Q76.5 108.5 71 103.5L68.4 106.2L66 100.2L63.6 103L60.4 97.5V116Z" fill={shade(C.rose, -0.12)} />
    </Svg>
  );
};

/** Dame Séléné : lièvre de la Lune, diadème en croissant, cape de nuit étoilée. Sereine, un rien amusée. */
const selene: Art = (props) => {
  // Blanc d'argent, bleu de minuit, violet de l'espace : trois teintes absentes de la palette.
  const pelage = "#DFE5EE";
  const cape = "#19235C";
  const espace = "#43307F";
  const sourcil = shade(pelage, -0.5);
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={espace} />
      {/* Cape de nuit, semée d'étoiles, ouverte sur une robe lilas */}
      <path d="M10 120V106Q10 88 32 86H88Q110 88 110 106V120Z" fill={cape} />
      <path d="M88 86Q110 88 110 106V120H96V90Z" fill={shade(cape, -0.3)} />
      <path d="M60 99L51 120H69Z" fill={C.lilas} />
      <path d={etoile(30, 104, 5) + etoile(89, 109, 4) + semis(1.1, [[20, 111], [43, 114], [38, 99], [81, 100], [77, 115], [100, 102]])} fill={METAL.or} />
      <g transform="rotate(4 60 84)">
        {/* Très longues oreilles : elles sortent du cadre */}
        <path d="M37 33.5Q27 14 26.5 -4H44Q48 12 54 26.5Z" fill={pelage} />
        <path d="M83 33.5Q93 14 93.5 -4H76Q72 12 66 26.5Z" fill={pelage} />
        <path d="M41 26.5Q33.5 10 33 -4H39.5Q43 10 49 24ZM79 26.5Q86.5 10 87 -4H80.5Q77 10 71 24Z" fill={C.lilas} />
        {/* Collerette de fourrure */}
        <path d="M41.5 75Q60 86.5 78.5 75L77 94.5Q60 105 43 94.5Z" fill={pelage} />
        {/* Tête longue, joues en pointe, museau blanc */}
        <path d="M33.5 56.5L25.5 67L37 69ZM86.5 56.5L94.5 67L83 69Z" fill={pelage} />
        <path d="M60 22Q80.5 22 87.5 42.5Q92 61 80.5 75Q71.5 84 60 84Q48.5 84 39.5 75Q28 61 32.5 42.5Q39.5 22 60 22Z" fill={pelage} />
        <path d="M76 26.5Q84 32.5 87.5 42.5Q92 61 80.5 75Q71.5 84 60 84Q74 79.5 79.5 68Q85.5 54 80.5 40.5Q79.5 32.5 76 26.5Z" fill={shade(pelage, -0.14)} />
        <path d="M48.5 61L28 56.5M48.5 64.5L26.5 67M71.5 61L92 56.5M71.5 64.5L93.5 67" fill="none" stroke={C.blanc} strokeWidth="0.9" />
        <path d="M60 56.5Q53 53.5 49.5 58.5Q49 65.5 56 65.5Q59 65.5 60 64Q61 65.5 64 65.5Q71 65.5 70.5 58.5Q67 53.5 60 56.5Z" fill={C.blanc} />
        <path d="M56 51H64L60 56.5Z" fill={C.bougClair} />
        <circle cx="47" cy="47" r="2.8" fill={C.nuit} />
        <circle cx="73" cy="47" r="2.8" fill={C.nuit} />
        <path d="M44 48L38.5 44.5L44.5 45.5ZM76 48L81.5 44.5L75.5 45.5Z" fill={C.nuit} />
        {/* Sourcils en arc, l'un à peine plus haut : sereine, un rien amusée */}
        <path d="M40 40.5Q46 36.5 53.5 39L53 41.5Q46 39 41 42.5Z" fill={sourcil} />
        <path d="M80 38.5Q74 34 66.5 37.5L67 39.5Q74 36.5 79 41Z" fill={sourcil} />
        {/* Diadème : un croissant de lune */}
        <path d="M38 33.5Q60 23 82 33.5" fill="none" stroke={METAL.or} strokeWidth="2" strokeLinecap="round" />
        <path d="M45 14Q60 44 75 14Q60 29 45 14Z" fill={METAL.or} />
      </g>
      {/* Fermoir */}
      <circle cx="60" cy="101" r="4.5" fill={METAL.or} />
    </Svg>
  );
};

export const PNJ_2: Record<string, Art> = {
  balthazar,
  taupin,
  selene,
};
