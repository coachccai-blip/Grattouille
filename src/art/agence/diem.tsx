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
 * parle). Sa tache rouge sur le front est celle des koïs « tancho » ; son grain de beauté
 * est une tache d'encre.
 */
export function Diem(props: ArtProps) {
  const ombre = shade(NACRE, -0.13);
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={BASSIN} />
      {/* Elle n'a rien de muet : des bulles montent */}
      <path d={semis(3.4, [[99, 31]]) + semis(2.1, [[105, 20], [92, 19]])} fill={C.blanc} fillOpacity="0.6" />
      {/* Les nageoires, en éventail : ses mains parlent avec elle */}
      <path d="M33 72Q10 60 5 80Q10 78 13 84Q17 79 21 85Q25 80 29 86Q32 80 38 82Z" fill={KOI} />
      <path d="M87 72Q110 60 115 80Q110 78 107 84Q103 79 99 85Q95 80 91 86Q88 80 82 82Z" fill={shade(KOI, -0.16)} />
      {/* Veste d'agence aux épaules rondes, chemisier, galon d'or */}
      <path d="M12 120V107Q12 89 32 88H88Q108 89 108 107V120Z" fill={C.marine} />
      <path d="M88 88Q108 89 108 107V120H94V92Z" fill={shade(C.marine, -0.28)} />
      <path d="M46 88H74L60 114Z" fill={C.blanc} />
      <path d="M46 88L60 114M74 88L60 114" fill="none" stroke={METAL.or} strokeWidth="2" strokeLinecap="round" />
      {/* L'insigne : une petite rose des vents */}
      <path d="M28 101L30 106L35 108L30 110L28 115L26 110L21 108L26 106Z" fill={METAL.or} />
      <g transform="rotate(-5 60 86)">
        {/* La tête : nacre, plus large aux joues */}
        <path d="M60 23Q82 23 89 44Q93 62 83 74Q74 84 60 84Q46 84 37 74Q27 62 31 44Q38 23 60 23Z" fill={NACRE} />
        <path d="M77 28Q85 34 89 44Q93 62 83 74Q74 84 60 84Q73 80 79 69Q86 57 82 43Q81 34 77 28Z" fill={ombre} />
        {/* La tache du front, et celle de la joue */}
        <path d="M37.5 43Q41 26.5 60 25.5Q79 26.5 82.5 43Q76 38 70.5 44Q65 37.5 59 43.5Q52 37 46 44Q41.5 39.5 37.5 43Z" fill={KOI} />
        <path d="M71 27.5Q79.5 31.5 82.5 43Q79 40 76.5 39.8Q76.5 33 71 27.5Z" fill={shade(KOI, -0.16)} />
        <ellipse cx="41" cy="68" rx="5" ry="4" fill={KOI} />
        {/* Les ouïes */}
        <path d="M35.5 56Q33.5 64 37.5 71M84.5 56Q86.5 64 82.5 71" fill="none" stroke={shade(NACRE, -0.28)} strokeWidth="1.3" strokeLinecap="round" />
        {/* La bouche en rond de qui ne se tait jamais, et ses barbillons */}
        <path d="M51.5 73Q45 79 46.5 87.5M68.5 73Q75 79 73.5 87.5" fill="none" stroke={KOI} strokeWidth="1.7" strokeLinecap="round" />
        <ellipse cx="60" cy="72.5" rx="8.2" ry="5.6" fill={C.rose} />
        <ellipse cx="60" cy="73" rx="4" ry="2.5" fill={shade(C.rose, -0.5)} />
        {/* Lunettes papillon : les yeux sont deux points derrière */}
        <path d="M33.5 51.5Q33 46.5 38 47L52 48.5Q54.5 49 54 53Q53 60.5 45.5 60.5Q35 60.5 33.5 51.5ZM86.5 51.5Q87 46.5 82 47L68 48.5Q65.5 49 66 53Q67 60.5 74.5 60.5Q85 60.5 86.5 51.5Z" fill={C.ciel} fillOpacity="0.55" />
        <path d="M33.5 51.5Q33 46.5 38 47L52 48.5Q54.5 49 54 53Q53 60.5 45.5 60.5Q35 60.5 33.5 51.5ZM86.5 51.5Q87 46.5 82 47L68 48.5Q65.5 49 66 53Q67 60.5 74.5 60.5Q85 60.5 86.5 51.5ZM54 51.5Q60 48.5 66 51.5" fill="none" stroke={METAL.or} strokeWidth="2" strokeLinejoin="round" />
        <path d="M34 48.5L28.5 44.5L36.5 46.5ZM86 48.5L91.5 44.5L83.5 46.5Z" fill={METAL.or} />
        <circle cx="45" cy="54" r="2.7" fill={C.nuit} />
        <circle cx="75" cy="54" r="2.7" fill={C.nuit} />
        {/* Sourcils haut levés : tout l'enchante, surtout ce qu'elle vend */}
        <path d="M38 41.5Q45 36 52.5 39.5L52 42Q45 39 39.5 43.5Z" fill={C.nuit} />
        <path d="M82 39.5Q75 34 67.5 38L68 40.5Q75 37.2 80.5 41.5Z" fill={C.nuit} />
        {/* Le grain de beauté : une tache d'encre */}
        <circle cx="76.5" cy="66" r="1.9" fill={C.noir} />
        {/* La nageoire du dos, coiffée en chignon */}
        <path d="M47 27Q46 13 58 9Q56 15 62 13Q61 19 68 17Q68 23 74 28Q60 21 47 27Z" fill={shade(KOI, -0.16)} />
      </g>
      {/* Le foulard d'hôtesse, noué de côté, à pois */}
      <path d="M43 83Q60 92 77 83L75.5 93Q60 101 44.5 93Z" fill={C.bougainvillier} />
      <path d="M62 93L77 105L68 105.5L70 112Z" fill={C.bougFonce} />
      <circle cx="62" cy="93.5" r="4.2" fill={C.bougainvillier} />
      <path d={semis(1.2, [[49, 90.5], [55, 93.5], [70, 91.5]])} fill={C.ivoire} />
    </Svg>
  );
}

export default Diem;
