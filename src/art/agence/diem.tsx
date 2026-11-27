// Madame Diem, qui tient l'Agence Carpe Diem (LOT4.md, section 13).
//
// Même contrat que les portraits de pnj.tsx (à lire d'abord) : buste de face dans un
// médaillon rond, viewBox 0 0 120 120, fond en aplat, visage dans le cercle de rayon 52
// centré en (60, 60), deux points pour les yeux.
//
// Ce dessin n'est pas au registre des illustrations : il n'arrive qu'avec l'agence (et,
// dans l'onglet Boutiques, un instant après l'enseigne), pour ne rien peser au démarrage.

import { C, METAL, Svg, shade, type ArtProps } from "../kit";

/** Un semis de petits ronds en un seul tracé : bulles, pois du foulard. */
function semis(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** L'eau du bassin : un turquoise que personne d'autre ne porte. */
const BASSIN = "#2A9DAE";
/** La robe d'une koï : nacre, et le rouge orangé de ses taches. */
const NACRE = "#FFF6EA";
const KOI = "#EC6530";

/**
 * Madame Diem : carpe koï, veste d'agence et foulard noué. Volubile et enjôleuse : la tête
 * penchée vers le client, les sourcils haut levés par-dessus ses lunettes papillon, les
 * nageoires qui ne tiennent pas en place, et toujours une bulle ou deux en l'air (elle
 * parle). C'est un poisson, et cela se voit : la tête large, les yeux très écartés, la
 * bouche en rond et ses deux barbillons, la nageoire du dos en crête, la robe tachée de
 * rouge et d'encre des koïs.
 */
export function Diem(props: ArtProps) {
  const ombre = shade(NACRE, -0.13);
  const ecaille = shade(NACRE, -0.24);
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={BASSIN} />
      {/* Elle n'a rien de muet : des bulles montent */}
      <path d={semis(3.4, [[101, 30]]) + semis(2.1, [[107, 19], [94, 17]])} fill={C.blanc} fillOpacity="0.6" />
      {/* Les nageoires, en éventail : ses mains parlent avec elle */}
      <path d="M31 74Q8 60 3 80Q8 78 11 84Q15 79 19 85Q23 80 27 86Q30 80 36 83Z" fill={KOI} />
      <path d="M11 84L24 76M19 85L28 78M27 86L32 80" fill="none" stroke={shade(KOI, -0.2)} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M89 74Q112 60 117 80Q112 78 109 84Q105 79 101 85Q97 80 93 86Q90 80 84 83Z" fill={shade(KOI, -0.16)} />
      {/* Veste d'agence aux épaules rondes, chemisier, galon d'or */}
      <path d="M12 120V107Q12 89 32 88H88Q108 89 108 107V120Z" fill={C.marine} />
      <path d="M88 88Q108 89 108 107V120H94V92Z" fill={shade(C.marine, -0.28)} />
      <path d="M46 88H74L60 114Z" fill={C.blanc} />
      <path d="M46 88L60 114M74 88L60 114" fill="none" stroke={METAL.or} strokeWidth="2" strokeLinecap="round" />
      {/* L'insigne : une petite rose des vents */}
      <path d="M28 101L30 106L35 108L30 110L28 115L26 110L21 108L26 106Z" fill={METAL.or} />
      <g transform="rotate(-5 60 86)">
        {/* La nageoire du dos, dressée en crête */}
        <path d="M43 31L45 11L52 22L58 6L63 20L71 9L76 30Q60 20 43 31Z" fill={KOI} />
        <path d="M49 27L47 15M58 24V9M68 26L70 13" fill="none" stroke={shade(KOI, -0.2)} strokeWidth="1.2" strokeLinecap="round" />
        {/* La tête : large, nacrée, plus étroite vers la bouche */}
        <path d="M60 25Q86 25 94 45Q98 60 87 72Q76 84 60 84Q44 84 33 72Q22 60 26 45Q34 25 60 25Z" fill={NACRE} />
        <path d="M78 29Q90 34 94 45Q98 60 87 72Q76 84 60 84Q74 80 81 69Q89 57 85 44Q83 35 78 29Z" fill={ombre} />
        {/* La robe : une grande tache rouge sur l'œil, une autre sur la joue, deux taches d'encre */}
        <path d="M28 47Q34 28 55 26.5Q63 34 56 43Q52 55 40 58Q28 57 28 47Z" fill={KOI} />
        <path d="M73 63Q85 58 89 67Q84 78 73 78Q67 70 73 63Z" fill={KOI} />
        <path d="M68 30Q76 28 80 35Q76 40 70 38Q66 34 68 30Z" fill={shade(KOI, -0.16)} />
        <ellipse cx="71" cy="45" rx="3.2" ry="2.6" fill={C.noir} />
        <circle cx="46" cy="70" r="2.2" fill={C.noir} />
        {/* Quelques écailles, sur le front */}
        <path d="M58 33q3.5 3.5 7 0M54 38.5q3.5 3.5 7 0M62 38.5q3.5 3.5 7 0" fill="none" stroke={ecaille} strokeWidth="1.3" strokeLinecap="round" />
        {/* Les ouïes */}
        <path d="M31 57Q29.5 65 34 72M89 57Q90.5 65 86 72" fill="none" stroke={ecaille} strokeWidth="1.5" strokeLinecap="round" />
        {/* Les barbillons, puis la bouche en rond de qui ne se tait jamais */}
        <path d="M51 75Q40 77 37 91M69 75Q80 77 83 91" fill="none" stroke={NACRE} strokeWidth="2.3" strokeLinecap="round" />
        <ellipse cx="60" cy="74" rx="9.5" ry="7" fill="#F2978C" />
        <ellipse cx="60" cy="74.5" rx="5" ry="3.4" fill={C.prune} />
        {/* Lunettes papillon : les yeux, très écartés, sont deux points derrière */}
        <path d="M28 50.5Q27.5 45.5 32.5 46L48 47.5Q50.5 48 50 52Q49 60 41 60Q29.5 60 28 50.5ZM92 50.5Q92.5 45.5 87.5 46L72 47.5Q69.5 48 70 52Q71 60 79 60Q90.5 60 92 50.5Z" fill={C.ciel} fillOpacity="0.5" />
        <path d="M28 50.5Q27.5 45.5 32.5 46L48 47.5Q50.5 48 50 52Q49 60 41 60Q29.5 60 28 50.5ZM92 50.5Q92.5 45.5 87.5 46L72 47.5Q69.5 48 70 52Q71 60 79 60Q90.5 60 92 50.5ZM50 50.5Q60 47 70 50.5" fill="none" stroke={METAL.or} strokeWidth="2.1" strokeLinejoin="round" />
        <path d="M28.5 47.5L22.5 43L31 45.5ZM91.5 47.5L97.5 43L89 45.5Z" fill={METAL.or} />
        <circle cx="40" cy="53" r="2.9" fill={C.nuit} />
        <circle cx="80" cy="53" r="2.9" fill={C.nuit} />
        {/* Sourcils haut levés : tout l'enchante, surtout ce qu'elle vend */}
        <path d="M32 40Q39 34.5 47 38L46.5 40.5Q39 37.5 33.5 42Z" fill={C.nuit} />
        <path d="M88 38Q81 32.5 73 36.5L73.5 39Q81 35.8 86.5 40Z" fill={C.nuit} />
      </g>
      {/* Le foulard d'hôtesse, noué de côté, à pois */}
      <path d="M43 84Q60 93 77 84L75.5 94Q60 102 44.5 94Z" fill={C.bougainvillier} />
      <path d="M62 94L77 106L68 106.5L70 113Z" fill={C.bougFonce} />
      <circle cx="62" cy="94.5" r="4.2" fill={C.bougainvillier} />
      <path d={semis(1.2, [[49, 91.5], [55, 94.5], [70, 92.5]])} fill={C.ivoire} />
    </Svg>
  );
}

export default Diem;
