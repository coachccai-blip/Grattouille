// Galerie Archibald, suite : 13 trésors, de la capsule porte-bonheur à l'étoile à ton nom.
//
// Même contrat que treasures.tsx (à lire d'abord) : même viewBox, même cadrage. Les
// trois trésors les plus chers sont exposés en tout petit sur la console du Domaine :
// une silhouette franche, peu de détails.
//
// Identifiants attendus (shared/catalog.ts) :
//   capsule, galet, boule-a-neige, nain, maquette, pendule, tapis, armure, dinosaure,
//   meteorite, trone, morceau-de-lune, etoile-a-ton-nom.

import { C, METAL, Svg, shade, type Art } from "./kit";

const arrondi = (v: number) => Math.round(v * 10) / 10;

/** Un éclat à quatre branches, centré en (x, y), de rayon r : le même que ceux du diamant. */
function eclat(x: number, y: number, r: number): string {
  const k = r * 0.2;
  const p = (dx: number, dy: number) => `${arrondi(x + dx)} ${arrondi(y + dy)}`;
  return `M${p(0, -r)}L${p(k, -k)}L${p(r, 0)}L${p(k, k)}L${p(0, r)}L${p(-k, k)}L${p(-r, 0)}L${p(-k, -k)}Z`;
}

/** Une étoile à cinq branches centrée en (x, y) : pointes à R, creux à r, tournée de `tour` degrés. */
function etoile(x: number, y: number, R: number, r: number, tour = 0): string {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = ((tour - 90 + i * 36) * Math.PI) / 180;
    const k = i % 2 ? r : R;
    d += `${i ? "L" : "M"}${arrondi(x + k * Math.cos(a))} ${arrondi(y + k * Math.sin(a))}`;
  }
  return `${d}Z`;
}

// ---------------------------------------------------------------------------
// La capsule porte-bonheur

/**
 * Un point de la capsule, centrée à l'origine : au creux n° `i` (21 au tour), à la distance `r`.
 * Le creux n° 0 est calé pour que les six premiers crans pointent vers le bas, de part et d'autre
 * de la verticale : la corde qui les ferme est horizontale, en y = 20.6.
 */
function cran(i: number, r: number): string {
  const t = ((38.57 + (i * 360) / 21) * Math.PI) / 180;
  return `${arrondi(r * Math.cos(t))} ${arrondi(r * Math.sin(t))}`;
}

/** Le bord cranté, du creux n° `de` au creux n° `a`, refermé par la corde. */
function crans(de: number, a: number): string {
  let d = `M${cran(de, 33)}`;
  for (let i = de; i < a; i++) d += `Q${cran(i + 0.5, 38.2)} ${cran(i + 1, 33)}`;
  return `${d}Z`;
}

/** Les stries du sertissage : un trait dans chaque creux, du n° `de` au n° `a`. */
function stries(de: number, a: number): string {
  let d = "";
  for (let i = de; i <= a; i++) d += `M${cran(i, 28.8)}L${cran(i, 33.2)}`;
  return d;
}

/** La jupe de la capsule : quinze crans intacts, et les six du coin plié. */
const JUPE = crans(6, 21);
const JUPE_PLIEE = crans(0, 6);
/** Le coin plié est le même dessin, écrasé contre la ligne de pli. */
const PLI = "matrix(1 0 0 0.45 0 11.33)";

/** La capsule : tôle rouge, 21 crans, une étoile imprimée, un coin plié par le décapsuleur. */
const capsule: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="24" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* L'épaisseur de la tôle, à l'ombre */}
    <g transform="translate(52.4 56.4) rotate(-40)" fill={shade(C.cerise, -0.58)}>
      <path d={JUPE} />
      <path d={JUPE_PLIEE} transform={PLI} />
    </g>
    <g transform="translate(50 54.4) rotate(-40)">
      {/* La jupe crantée et ses stries, puis le dessus peint */}
      <path d={JUPE} fill={shade(C.cerise, -0.2)} />
      <path d={stries(7, 20)} fill="none" stroke={shade(C.cerise, -0.42)} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M16.7 20.6A26.5 26.5 0 1 0 -16.7 20.6Z" fill={C.cerise} />
      {/* Le coin plié, l'arête du pli */}
      <g transform={PLI}>
        <path d={JUPE_PLIEE} fill={shade(C.cerise, -0.4)} />
        <path d={stries(0, 6)} fill="none" stroke={shade(C.cerise, -0.58)} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M-16.7 20.6A26.5 26.5 0 0 0 16.7 20.6Z" fill={shade(C.cerise, -0.28)} />
      </g>
      <path d="M-22 20.6H22" fill="none" stroke={C.ceriseClair} strokeWidth="0.7" strokeLinecap="round" />
      {/* L'étoile imprimée, un reflet */}
      <path d={etoile(0, -3.5, 13.5, 6, 28)} fill={C.creme} />
      <path d="M-13.2 -18.8A23 23 0 0 1 7.9 -21.6" fill="none" stroke={C.ceriseClair} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  </Svg>
);

// ---------------------------------------------------------------------------
// Le galet en forme de cœur

/** Le gris-bleu du galet mouillé. */
const GALET = "#8399A8";

/** Le galet : un cœur dodu, un lobe plus haut que l'autre, la pointe émoussée, une veine blanche. */
const galet: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="22" ry="4" fill={C.nuit} fillOpacity="0.18" />
    <path d="M50 30C56 30 60 17 70 17C81 17 89 27 89 40C89 53 80 62 71 70C64 77 57 88 50 88C43 88 36 77 28 69C20 61 11 54 11 42C11 29 19 19 30 19C40 19 44 30 50 30Z" fill={GALET} />
    {/* Le flanc à l'ombre */}
    <path d="M70 17C81 17 89 27 89 40C89 53 80 62 71 70C64 77 57 88 50 88C60 83 68 74 75 62C84 49 84 29 70 17Z" fill={shade(GALET, -0.25)} />
    {/* La veine de quartz, un reflet, quelques grains */}
    <path d="M13.5 38C26 33 43 37 53 42.5C63 48 74 52.5 82 54.5C73 55.5 61.5 50.5 51.5 46C42 42 26 38.5 13.5 38Z" fill={C.blanc} />
    <path d="M17.5 34Q18 26 26.5 23Q21.5 28 21 34.5Q19 35.5 17.5 34Z" fill={shade(GALET, 0.35)} />
    <path d="M29.7 55a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM41.9 70a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0ZM58.8 27a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0ZM56 64a1 1 0 1 0 2 0a1 1 0 1 0 -2 0ZM23 47a1 1 0 1 0 2 0a1 1 0 1 0 -2 0Z" fill={shade(GALET, -0.25)} />
  </Svg>
);

// ---------------------------------------------------------------------------
// La boule à neige

/** La boule à neige : le phare de Grattouille sous son globe, la neige qui tombe, un socle de bois. */
const bouleANeige: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="32" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le globe : l'épaisseur du verre, puis l'eau */}
    <circle cx="50" cy="42" r="33" fill={shade(C.ciel, -0.22)} />
    <circle cx="50" cy="42" r="31.4" fill={C.ciel} />
    {/* Le phare : fût blanc, bandes rouges, galerie, lanterne, toit */}
    <path d="M44.5 60L46.5 33H53.5L55.5 60Z" fill={C.blanc} />
    <path d="M46.1 38H53.9L54.3 43.5H45.7ZM45.3 49H54.7L55.1 54.5H44.9Z" fill={C.cerise} />
    <path d="M50 33H53.5L55.5 60H50Z" fill={C.nuit} fillOpacity="0.14" />
    <rect x="44.5" y="30.6" width="11" height="2.6" fill={C.nuit} />
    <rect x="47" y="24.8" width="6" height="6" fill={C.mimosa} />
    <path d="M45.5 25L50 19L54.5 25Z" fill={C.cerise} />
    {/* La neige au fond, les flocons */}
    <path d="M24.3 60Q35 52.5 48 56Q62 51.5 75.7 60A31.4 31.4 0 0 1 24.3 60Z" fill={C.blanc} />
    <g fill={C.blanc}>
      <circle cx="30" cy="24" r="1.6" />
      <circle cx="38" cy="34" r="1.3" />
      <circle cx="27" cy="40" r="1.5" />
      <circle cx="36" cy="47" r="1.2" />
      <circle cx="42" cy="17" r="1.2" />
      <circle cx="58" cy="14" r="1.1" />
      <circle cx="62" cy="23" r="1.4" />
      <circle cx="70" cy="32" r="1.7" />
      <circle cx="63" cy="42" r="1.2" />
      <circle cx="72" cy="48" r="1.4" />
    </g>
    {/* Le verre : l'ombre en croissant, le reflet */}
    <path d="M75.7 24A31.4 31.4 0 0 1 32 67.7A37 37 0 0 0 75.7 24Z" fill={C.marine} fillOpacity="0.16" />
    <path d="M25.6 33.1A26 26 0 0 1 39 18.4" fill="none" stroke={C.blanc} strokeWidth="2.6" strokeLinecap="round" />
    {/* Le socle de bois et sa plaque */}
    <path d="M30 72H70L74 84H78V90H22V84H26Z" fill={C.bois} />
    <path d="M60 72H70L74 84H78V90H63V84Z" fill={shade(C.bois, -0.28)} />
    <path d="M30 72H70L70.8 74.4H29.2Z" fill={C.boisFonce} />
    <rect x="40" y="76.5" width="20" height="5.2" rx="1" fill={METAL.laiton} />
  </Svg>
);

// ---------------------------------------------------------------------------
// Le nain de jardin

/** Le nain de jardin : bonnet rouge, barbe blanche, et une belle prise au bout de la ligne. */
const nain: Art = (props) => {
  const manche = shade(C.azur, -0.16);
  return (
    <Svg viewBox="0 0 100 100" {...props}>
      <ellipse cx="46" cy="92" rx="28" ry="4" fill={C.nuit} fillOpacity="0.18" />
      {/* Le socle d'herbe, les bottes */}
      <path d="M22 87Q22 84 26 84H62Q66 84 66 87V90H22Z" fill={C.vert} />
      <path d="M52 84H62Q66 84 66 87V90H55Z" fill={C.feuille} />
      <path d="M30 79H43V85.5H25Q25 81 30 79ZM45 79H58Q63 81 63 85.5H45Z" fill={C.boisFonce} />
      {/* La tunique, la ceinture et sa boucle */}
      <path d="M32 50H56Q62 52 63 61L64 80H24L25 61Q26 52 32 50Z" fill={C.azur} />
      <path d="M50 50H56Q62 52 63 61L64 80H53Q56 65 50 50Z" fill={shade(C.azur, -0.22)} />
      <path d="M24.5 70H63.5L63.7 75H24.3Z" fill={C.boisFonce} />
      <rect x="40" y="69" width="8" height="7" rx="1" fill={METAL.laiton} />
      <rect x="42.2" y="71.2" width="3.6" height="2.6" fill={C.boisFonce} />
      {/* La canne, le fil, le poisson */}
      <path d="M66.2 72L90 12" fill="none" stroke={C.bois} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M90 12Q93.5 28 90 44" fill="none" stroke={C.encre} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M90 60L85.5 66.5H94.5Z" fill={shade(C.corail, -0.22)} />
      <path d="M90 44Q95 48 94 55Q92 60 90 61Q88 60 86 55Q85 48 90 44Z" fill={C.corail} />
      <circle cx="88.6" cy="49.5" r="0.9" fill={C.noir} />
      {/* Les bras et les mains */}
      <path d="M29 55Q22.5 58 22 67M59 55Q65 56 68.5 61" fill="none" stroke={manche} strokeWidth="7" strokeLinecap="round" />
      <circle cx="21.8" cy="70" r="3.6" fill={C.rose} />
      <circle cx="70" cy="63" r="3.8" fill={C.rose} />
      {/* Le visage : la barbe, les yeux, les sourcils, le nez */}
      <ellipse cx="44" cy="46" rx="13" ry="9" fill={C.rose} />
      <path d="M31 47Q29 58 37 63L44 68L51 63Q59 58 57 47Q52 53 48 51Q44 49 40 51Q36 53 31 47Z" fill={C.blanc} />
      <path d="M57 47Q59 58 51 63L44 68Q53 60 53.5 50.4Q55.6 49.4 57 47Z" fill={C.brume} />
      <circle cx="38.5" cy="45.6" r="1.4" fill={C.noir} />
      <circle cx="49.5" cy="45.6" r="1.4" fill={C.noir} />
      <path d="M36 44.2Q38.4 42.4 40.8 43.5M52 44.2Q49.6 42.4 47.2 43.5" fill="none" stroke={C.blanc} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="44" cy="49.6" r="3.6" fill={shade(C.rose, -0.16)} />
      {/* Le bonnet pointu */}
      <path d="M27.5 41C32 28 39 15 52 8C52.5 20 56.5 31 60.5 41Q44 43 27.5 41Z" fill={C.cerise} />
      <path d="M52 8C52.5 20 56.5 31 60.5 41Q55 41.8 50 42C51.5 31 51.5 19 52 8Z" fill={shade(C.cerise, -0.28)} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// La maquette de voilier

/** Les cinq voiles carrées et le foc, d'un seul tenant. */
const VOILES =
  "M24 42H48Q50 50 47.5 57Q36 60 24.5 57Q22 50 24 42ZM25.5 26H46.5Q48 33 46 39.5Q36 42 26 39.5Q24 33 25.5 26ZM28 13H44Q45.2 18.5 43.6 23.5Q36 25.5 28.4 23.5Q26.8 18.5 28 13ZM52 44H70Q71.7 51 69.5 57Q61 59.5 52.5 57Q50.3 51 52 44ZM53.5 30H68.5Q69.8 36 68.2 41.5Q61 43.5 53.8 41.5Q52.2 36 53.5 30ZM55.5 19H66.5Q67.5 23.5 66.2 27.5Q61 29 55.8 27.5Q54.5 23.5 55.5 19ZM66 21L93.5 53.5L76.5 56.5Q75.5 39 66 21Z";

/** La maquette de voilier : un deux-mâts toutes voiles dehors, sur son ber de bois. */
const maquette: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="32" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le gréement, les mâts, le beaupré */}
    <path d="M36 10L14 57M36 10L61 15L95 54" fill="none" stroke={C.boisFonce} strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M35.2 9H36.8V63H35.2ZM60.3 15H61.7V63H60.3Z" fill={C.boisFonce} />
    <path d="M76 60.5L95 54" fill="none" stroke={C.boisFonce} strokeWidth="1.5" strokeLinecap="round" />
    {/* Les voiles : l'ombre décalée, puis la toile, les vergues, le pavillon */}
    <path d={VOILES} transform="translate(1.3 1.3)" fill={C.brume} />
    <path d={VOILES} fill={C.blanc} />
    <path d="M22.5 42H49.5M24 26H48M26.5 13H45.5M50.5 44H71.5M52 30H69.5M54 19H68" fill="none" stroke={C.boisFonce} strokeWidth="1.1" strokeLinecap="round" />
    <path d="M36 9L27.5 8L30 11L27.5 14L36 13Z" fill={C.cerise} />
    {/* La coque : œuvres mortes bleues, carène rouge, liston blanc */}
    <path d="M13 57H27L28 62Q50 67 72 62L85 57Q80 72 68 78H30Q17 74 13 57Z" fill={C.marine} />
    <path d="M21 72.7L76.5 71.8Q72.8 75.6 68 78H30Q24.8 76.4 21 72.7Z" fill={C.cerise} />
    <path d="M17.5 62.5Q23 66 28 66.5Q50 71 72 66.5L81 62.5" fill="none" stroke={C.blanc} strokeWidth="1.2" strokeLinecap="round" />
    {/* Le ber et sa plaque */}
    <path d="M34 85L36 76.5H42L44 85ZM56 85L58 76.5H64L66 85Z" fill={C.bois} />
    <rect x="24" y="85" width="52" height="5" rx="1" fill={C.bois} />
    <path d="M60 85H75Q76 85 76 86V89Q76 90 75 90H63Z" fill={shade(C.bois, -0.28)} />
    <rect x="43" y="86.2" width="12" height="2.8" rx="0.6" fill={METAL.laiton} />
  </Svg>
);

// ---------------------------------------------------------------------------
// La pendule de cheminée

/** La pendule de cheminée : bronze doré, cadran d'émail blanc, dix heures dix, le balancier en marche. */
const pendule: Art = (props) => {
  const perle = shade(C.mimosa, 0.6);
  return (
    <Svg viewBox="0 0 100 100" {...props}>
      <ellipse cx="50" cy="92" rx="36" ry="4" fill={C.nuit} fillOpacity="0.18" />
      {/* Les pieds toupie, la terrasse et sa frise de perles */}
      <path d="M19 85H29L27.5 90H20.5ZM71 85H81L79.5 90H72.5Z" fill={C.mimosaFonce} />
      <rect x="14" y="77" width="72" height="8" fill={METAL.or} />
      <rect x="14" y="81.5" width="72" height="3.5" fill={C.mimosaFonce} />
      <path d="M17.5 79.3H82.6" fill="none" stroke={perle} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 3.15" />
      {/* La caisse en borne : le flanc à l'ombre, puis la face */}
      <path d="M17 77Q27 73 28 58V44A22 22 0 0 1 72 44V58Q73 73 83 77Z" fill={C.mimosaFonce} />
      <path d="M17 77Q27 73 28 58V44A22 22 0 0 1 50 22A18 22 0 0 1 68 44V58Q69 72 77 77Z" fill={METAL.or} />
      {/* Les rinceaux des flancs, les volutes du pied */}
      <path d="M28.5 53Q21.5 53 21 59Q21 63 25 63Q27.5 62.5 27.5 60Q25.8 60.8 25.2 59.2Q25 56.8 28.5 56.8ZM71.5 53Q78.5 53 79 59Q79 63 75 63Q72.5 62.5 72.5 60Q74.2 60.8 74.8 59.2Q75 56.8 71.5 56.8Z" fill={METAL.or} />
      <circle cx="21" cy="73" r="4" fill={METAL.or} />
      <circle cx="79" cy="73" r="4" fill={METAL.or} />
      <path d="M19.4 73a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0ZM77.4 73a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0Z" fill={C.mimosaFonce} />
      <path d="M34.6 71a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0 -2.8 0ZM62.6 71a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0 -2.8 0Z" fill={perle} />
      {/* Le fleuron : une urne sur son dé */}
      <path d="M44.5 23.5L46 18.5H54L55.5 23.5Z" fill={METAL.or} />
      <ellipse cx="50" cy="15" rx="4.6" ry="4.5" fill={METAL.or} />
      <circle cx="50" cy="10" r="1.9" fill={METAL.or} />
      {/* La lunette perlée, le cadran, les heures */}
      <circle cx="50" cy="45" r="19.5" fill={C.mimosaFonce} />
      <circle cx="50" cy="45" r="18.3" fill={METAL.or} />
      <circle cx="50" cy="45" r="16.8" fill="none" stroke={perle} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="0.1 3.199" />
      <circle cx="50" cy="45" r="15" fill={C.blanc} />
      <circle cx="50" cy="45" r="11.8" fill="none" stroke={C.nuit} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="0.1 6.078" />
      {/* Les aiguilles */}
      <path d="M50 45L44.7 41.3" fill="none" stroke={C.nuit} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M50 45L58.7 40" fill="none" stroke={C.nuit} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="50" cy="45" r="1.7" fill={C.nuit} />
      {/* La fenêtre du balancier */}
      <path d="M45.5 75.5V71.5A4.5 4.5 0 0 1 54.5 71.5V75.5Z" fill={C.nuit} />
      <path d="M50 67.5L51 72.4" fill="none" stroke={C.mimosa} strokeWidth="0.7" strokeLinecap="round" />
      <circle cx="51.1" cy="72.8" r="2" fill={C.mimosa} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Le tapis d'Orient

/** Le tapis, d'un seul tenant : arrondi en haut, là où il passe sur la barre. */
const TAPIS = "M22 12Q22 10 24 10H76Q78 10 78 12V83H22Z";

/** Le tapis d'Orient : rouge profond, médaillon, écoinçons et bordure perlée, jeté sur un portant de laiton. */
const tapis: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="42" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le portant : les pieds, les montants, la barre et ses pommeaux */}
    <path d="M10 90L13.5 86H19.5L23 90ZM77 90L80.5 86H86.5L90 90Z" fill={C.mimosaFonce} />
    <rect x="15" y="12" width="3" height="75" fill={METAL.laiton} />
    <rect x="82" y="12" width="3" height="75" fill={METAL.laiton} />
    <rect x="10" y="11" width="80" height="4" rx="2" fill={METAL.laiton} />
    <circle cx="10" cy="13" r="3.2" fill={METAL.laiton} />
    <circle cx="90" cy="13" r="3.2" fill={METAL.laiton} />
    {/* Le tapis, replié sur la barre : l'ombre décalée, puis la laine */}
    <path d={TAPIS} transform="translate(1.8 1.5)" fill={shade(C.bordeaux, -0.45)} />
    <path d={TAPIS} fill={C.bordeaux} />
    <rect x="23.5" y="10.9" width="53" height="1.6" rx="0.8" fill={shade(C.bordeaux, 0.22)} />
    <rect x="25" y="17" width="50" height="63" fill={C.marine} />
    <rect x="30" y="22" width="40" height="53" fill={C.cerise} />
    <path d="M27.45 19.8H72.55V77.2H27.45V23.9" fill="none" stroke={C.paille} strokeWidth="1.7" strokeLinecap="round" strokeDasharray="0.1 4" />
    {/* Les écoinçons, le médaillon */}
    <path d="M30 22H40L30 34ZM70 22V34L60 22ZM30 75V63L40 75ZM70 75H60L70 63Z" fill={C.marine} />
    <path d="M50 28L64 48.5L50 69L36 48.5Z" fill={C.marine} />
    <path d="M50 33.5L60 48.5L50 63.5L40 48.5Z" fill={C.paille} />
    <path d="M50 39.5L56 48.5L50 57.5L44 48.5Z" fill={C.cerise} />
    <circle cx="50" cy="48.5" r="2" fill={C.marine} />
    {/* Les franges */}
    <path d="M22 85.6H78" fill="none" stroke={C.paille} strokeWidth="5.2" strokeDasharray="1.1 1.287" />
  </Svg>
);

// ---------------------------------------------------------------------------
// L'armure de chevalier

/**
 * Les plates de l'armure, dans l'ordre où on les pose : solerets, jambes, braconnière,
 * gantelets, bras, plastron, spalières, heaume.
 */
const PLATES = [
  "M41 81H48.2V86H34.5Q36 82.5 41 81ZM51.8 81H59Q64 82.5 65.5 86H51.8Z",
  "M39.5 65H48.5L48 82H41ZM51.5 65H60.5L59 82H52Z",
  "M37.5 57H62.5L65.5 66Q58 70 51 66L50 63.5L49 66Q42 70 34.5 66Z",
  "M26 59.5H35.5L34.6 65Q35 71.5 30.8 71.5Q26.5 71.5 27 65ZM64.5 59.5H74L73 65Q73.5 71.5 69.2 71.5Q65 71.5 65.4 65Z",
  "M27 44H34.5L34 60H27.5ZM65.5 44H73L72.5 60H66Z",
  "M38 36H62Q66.5 46 62.5 57Q50 61.5 37.5 57Q33.5 46 38 36Z",
  "M24.5 46Q24 34.5 36 34Q40.5 34 41.5 37.5Q40 43 36 45.5Q30 44 24.5 46ZM75.5 46Q76 34.5 64 34Q59.5 34 58.5 37.5Q60 43 64 45.5Q70 44 75.5 46Z",
  "M40.5 23.5Q40.5 14.5 50 14.5Q59.5 14.5 59.5 23.5V30Q55 34.5 50 35Q45 34.5 40.5 30Z",
];

/** L'armure de chevalier : plates d'argent, cubitières et genouillères dorées, panache rouge, sur son mannequin de bois. */
const armure: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="30" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le mannequin : la perche et le socle */}
    <rect x="48.9" y="62" width="2.2" height="25" fill={C.boisFonce} />
    <rect x="28" y="86" width="44" height="4" rx="1" fill={C.bois} />
    <path d="M58 86H71Q72 86 72 87V89Q72 90 71 90H60Z" fill={shade(C.bois, -0.28)} />
    {/* Le gorgerin, à l'ombre du heaume */}
    <path d="M43.5 32H56.5L59 37.5H41Z" fill={C.gris} />
    {/* Les plates : l'ombre décalée, puis l'argent, des solerets au heaume */}
    <g transform="translate(1.6 1.4)" fill={C.grisFonce}>
      {PLATES.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
    {PLATES.map((d) => (
      <path key={d} d={d} fill={METAL.argent} />
    ))}
    {/* Le côté à l'ombre du plastron et du heaume */}
    <path d="M50 36H62Q66.5 46 62.5 57Q56.5 59.2 50 59.3ZM50 14.5Q59.5 14.5 59.5 23.5V30Q55 34.5 50 35Z" fill={C.grisFonce} fillOpacity="0.28" />
    {/* La visière, les trous d'aération, une lame de la braconnière */}
    <path d="M42.5 23.5H57.5L57 26H43Z" fill={C.nuit} />
    <path d="M44.5 29.2H47.3M52.7 29.2H55.5" fill="none" stroke={C.grisFonce} strokeWidth="1" strokeLinecap="round" strokeDasharray="0.1 1.3" />
    <path d="M36.4 61.8Q43 64.6 49.4 62.4M50.6 62.4Q57 64.6 63.6 61.8" fill="none" stroke={C.gris} strokeWidth="0.9" strokeLinecap="round" />
    {/* Les dorures : ceinture, cubitières, genouillères */}
    <path d="M37.3 55Q50 59.5 62.7 55L62.9 58Q50 62.5 37.1 58Z" fill={METAL.or} />
    <circle cx="30.6" cy="52.5" r="3.8" fill={METAL.or} />
    <circle cx="69.4" cy="52.5" r="3.8" fill={METAL.or} />
    <circle cx="44.4" cy="74" r="3.5" fill={METAL.or} />
    <circle cx="55.6" cy="74" r="3.5" fill={METAL.or} />
    {/* Le panache */}
    <path d="M48.5 16.5C46.5 10 51 8 56 8C63 8 68 11.5 70 18C65.5 14 60.5 13.5 56.5 15C54 16 52.5 17 52 19Z" fill={C.cerise} />
    <path d="M70 18C65.5 14 60.5 13.5 56.5 15C54 16 52.5 17 52 19Q53.5 13.5 60 12.5Q66 13 70 18Z" fill={shade(C.cerise, -0.28)} />
  </Svg>
);

// ---------------------------------------------------------------------------
// Le squelette de dinosaure

/** Les os du tyrannosaure, d'une seule couleur : on les pose deux fois, l'ombre puis l'os. */
function squelette(couleur: string) {
  return (
    <>
      <g fill={couleur}>
        {/* Le crâne et ses trois fenêtres, la mâchoire, les dents */}
        <path fillRule="evenodd" d="M34 13.5L27 12Q24.5 12.5 22 15L13 16.5Q8.5 17.5 8.5 22Q8.5 25 10.5 25.5L27 27.5L32.5 30L35.5 22ZM26.1 18a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0ZM17 20.8Q17.5 18 21 18Q24 18.5 23.8 21Q23 23.5 20 23.5Q17 23.3 17 20.8ZM10.8 20.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0Z" />
        <path d="M10.5 25.5L11.7 29L13.2 25.8L14.8 29.6L16.4 26.2L18 30L19.6 26.6L21.2 30.2L22.8 27L24.2 30L25.6 27.3Z" />
        <path d="M32.8 29.2L34 34L14 39.5Q10.5 39.5 11 36.3L27 32.6Z" />
        <path d="M12.5 36L13.8 32.8L15.2 35.3L16.8 32L18.3 34.6L19.8 31.5L21.3 33.9L22.8 31L24.2 33.2Z" />
        {/* Le bassin, le genou, la cheville */}
        <ellipse cx="61.5" cy="53" rx="6.5" ry="3.8" transform="rotate(40 61.5 53)" />
        <circle cx="53" cy="66" r="2.2" />
        <circle cx="57" cy="77" r="2" />
      </g>
      <g fill="none" stroke={couleur} strokeLinecap="round" strokeLinejoin="round">
        {/* Les vertèbres : le cou et le dos, puis la queue qui s'affine */}
        <path d="M35.5 22.5C46 23 44 38 63 54" strokeWidth="4.4" strokeLinecap="butt" strokeDasharray="2.3 0.9" />
        <path d="M63 54C66.5 57.5 70.75 63 75.9 67.4" strokeWidth="3.6" strokeLinecap="butt" strokeDasharray="2.1 0.9" />
        <path d="M75.9 67.4C81 71.75 87 75 94 74" strokeWidth="2.4" strokeLinecap="butt" strokeDasharray="1.9 0.9" />
        {/* Les côtes, le petit bras, le pubis */}
        <path d="M44.7 29.9Q37.9 31 35.5 37.5M46.5 33.2Q38.7 35 35.3 42.3M48.6 37Q40.6 39 37 46.5M51.3 41.1Q43.9 42.6 40.9 49.6M54.6 45.5Q48.5 46 46.9 51.8" strokeWidth="1.7" />
        <path d="M38 37L33.5 42.5L29 41.5M58.5 56L52 62.5" strokeWidth="1.7" />
        {/* La patte : fémur, tibia, pied */}
        <path d="M61 54L53 66L57 77L53 83.2H45.5" strokeWidth="3" />
      </g>
    </>
  );
}

/** Le squelette de dinosaure : un tyrannosaure monté à l'ancienne, debout sur son socle de musée. */
const dinosaure: Art = (props) => {
  const os = C.sable;
  const ombre = shade(C.kraft, -0.18);
  return (
    <Svg viewBox="0 0 100 100" {...props}>
      <ellipse cx="52" cy="92" rx="40" ry="4" fill={C.nuit} fillOpacity="0.18" />
      {/* Le socle, sa plaque, les tiges de soutien */}
      <rect x="18" y="84.5" width="74" height="5.5" rx="1" fill={C.boisFonce} />
      <path d="M70 84.5H91Q92 84.5 92 85.5V89Q92 90 91 90H73Z" fill={shade(C.boisFonce, -0.3)} />
      <rect x="23" y="85.8" width="14" height="3" rx="0.6" fill={METAL.laiton} />
      <rect x="42.3" y="46" width="1.4" height="38.5" fill={METAL.laiton} />
      <rect x="80.3" y="72" width="1.4" height="12.5" fill={METAL.laiton} />
      {/* La patte du fond */}
      <path d="M63 55L65 66.5L70 77L66 83.2H58.5" fill="none" stroke={ombre} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Les os : l'ombre décalée, puis l'os */}
      <g transform="translate(1.3 1.3)">{squelette(ombre)}</g>
      {squelette(os)}
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// La météorite

/** La roche tombée du ciel, d'un seul tenant. */
const ROCHE = "M17 38L24 22L40 12L59 10.5L76 18L86 34L84 50L72 63L54 68.5L34 66L20 54Z";
/** La fissure, en éclair. */
const FISSURE = "M30.5 24.5L41 32.5L38.6 40.2L51.8 46.6L57.2 56.2L66.5 60L56 58.2L49.6 49L35.6 42.6L38 34.4Z";

/** La météorite : une roche noire et grêlée, une fissure encore rougeoyante, des griffes de laiton. */
const meteorite: Art = (props) => {
  const roche = shade(C.ardoise, -0.38);
  return (
    <Svg viewBox="0 0 100 100" {...props}>
      <ellipse cx="50" cy="92" rx="30" ry="4" fill={C.nuit} fillOpacity="0.18" />
      {/* Le socle et sa plaque */}
      <path d="M32 78H68V81.5H73V90H27V81.5H32Z" fill={C.boisFonce} />
      <path d="M58 78H68V81.5H73V90H61V81.5H58Z" fill={shade(C.boisFonce, -0.3)} />
      <rect x="35" y="83.4" width="20" height="4.4" rx="1" fill={METAL.laiton} />
      {/* La roche : la masse, la face éclairée, la face à l'ombre */}
      <path d={ROCHE} fill={roche} />
      <path d="M17 38L24 22L40 12L59 10.5L49 23L29 33Z" fill={C.ardoise} />
      <path d="M86 34L84 50L72 63L54 68.5L63 55L77 45Z" fill={C.noir} />
      {/* Les cupules */}
      <g fill={C.noir} fillOpacity="0.55">
        <ellipse cx="29" cy="27" rx="2.6" ry="1.8" transform="rotate(-30 29 27)" />
        <ellipse cx="62" cy="23" rx="4" ry="2.7" transform="rotate(15 62 23)" />
        <ellipse cx="72" cy="36" rx="3" ry="2.2" transform="rotate(30 72 36)" />
        <ellipse cx="27" cy="48" rx="3.2" ry="2.3" transform="rotate(-15 27 48)" />
        <ellipse cx="43" cy="59" rx="3.4" ry="2.2" transform="rotate(10 43 59)" />
        <ellipse cx="50" cy="33" rx="2.2" ry="1.6" />
      </g>
      {/* La fissure : le halo, la braise, le cœur */}
      <path d={FISSURE} fill="none" stroke={C.corail} strokeOpacity="0.35" strokeWidth="4.5" strokeLinejoin="round" />
      <path d={FISSURE} fill={C.corail} />
      <path d="M50.5 46.2L60 42L52.6 48.6Z" fill={C.corail} />
      <path d="M32.5 26.3L40.2 33.1L37.8 40.9L51.2 47.3L56.9 56.8L63.5 59.2L56.3 57.6L50.2 48.4L36.4 41.9L38.8 33.9Z" fill={C.mimosa} />
      {/* Les griffes de laiton */}
      <path d="M35 60Q35 73 50 73Q65 73 65 61M50 73V78" fill="none" stroke={METAL.laiton} strokeWidth="3" strokeLinecap="round" />
      {/* Les étincelles */}
      <path d={`${eclat(14, 17, 4.5)}${eclat(88, 20, 3)}`} fill={C.mimosa} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Le trône en or massif

/** Le trône en or massif : haut dossier capitonné, couronne au fronton, coussin de velours, pieds en pattes de lion. */
const trone: Art = (props) => {
  const velours = shade(C.cerise, -0.32);
  return (
    <Svg viewBox="0 0 100 100" {...props}>
      <ellipse cx="50" cy="92" rx="38" ry="4" fill={C.nuit} fillOpacity="0.18" />
      {/* Le dossier, son montant à l'ombre, les pommeaux */}
      <path d="M29 66V25Q29 18 36 18H64Q71 18 71 25V66Z" fill={METAL.or} />
      <path d="M64 18Q71 18 71 25V66H66.5V25Q66.5 20.5 64 18Z" fill={C.mimosaFonce} />
      <circle cx="31" cy="17.5" r="3.4" fill={METAL.or} />
      <circle cx="69" cy="17.5" r="3.4" fill={METAL.or} />
      {/* Le velours capitonné : losanges et boutons */}
      <rect x="34" y="23" width="32" height="40" fill={C.cerise} />
      <path d="M34.5 41.4L49.5 23.6M34.5 60.4L65.5 23.6M50.5 60.4L65.5 42.6M34.5 42.6L49.5 60.4M34.5 23.6L65.5 60.4M50.5 23.6L65.5 41.4" fill="none" stroke={velours} strokeWidth="0.8" />
      <path d="M34 23H66V25.5H36.5V63H34Z" fill={velours} />
      <path d="M40.8 32.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0ZM56.8 32.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0ZM48.8 42a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0ZM40.8 51.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0ZM56.8 51.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0Z" fill={C.mimosa} />
      {/* La couronne du fronton */}
      <path d="M42 20.5V17.5L41 11L46 14.5L50 9.5L54 14.5L59 11L58 17.5V20.5Z" fill={METAL.or} />
      <rect x="42" y="17.5" width="16" height="1.6" fill={C.mimosaFonce} />
      <circle cx="50" cy="14.8" r="1.5" fill={C.cerise} />
      {/* Le coussin */}
      <path d="M24.5 60Q50 55 75.5 60Q78.5 64.5 75.5 69H24.5Q21.5 64.5 24.5 60Z" fill={C.cerise} />
      <path d="M23.3 65.5Q50 69.5 76.7 65.5Q76.5 67.5 75.5 69H24.5Q23.5 67.5 23.3 65.5Z" fill={velours} />
      {/* Les accotoirs et leurs volutes */}
      <rect x="17" y="47" width="7" height="24" fill={METAL.or} />
      <rect x="76" y="47" width="7" height="24" fill={METAL.or} />
      <circle cx="20.5" cy="46.5" r="5.2" fill={METAL.or} />
      <circle cx="79.5" cy="46.5" r="5.2" fill={METAL.or} />
      <path d="M18.5 46.5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0ZM77.5 46.5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0Z" fill={C.mimosaFonce} />
      {/* La ceinture, son rubis, le tablier */}
      <path d="M29 76H71Q66 81.5 58 80Q50 78.5 42 80Q34 81.5 29 76Z" fill={C.mimosaFonce} />
      <rect x="16" y="69" width="68" height="7" fill={METAL.or} />
      <rect x="16" y="73" width="68" height="3" fill={C.mimosaFonce} />
      <circle cx="50" cy="72.4" r="2.2" fill={C.cerise} />
      {/* Les pieds en pattes de lion */}
      <path d="M18 76H29Q28.5 81 27 87H19.5Q19 81 18 76ZM14.5 90V87.6Q14.5 84.6 17.6 84.6Q19.8 84.6 20.4 86.2Q21 83.4 23.3 83.4Q25.6 83.4 26.2 86.2Q26.8 84.6 29 84.6Q32 84.6 32 87.6V90ZM82 76H71Q71.5 81 73 87H80.5Q81 81 82 76ZM85.5 90V87.6Q85.5 84.6 82.4 84.6Q80.2 84.6 79.6 86.2Q79 83.4 76.7 83.4Q74.4 83.4 73.8 86.2Q73.2 84.6 71 84.6Q68 84.6 68 87.6V90Z" fill={METAL.or} />
      <path d="M20.4 86.6V90M26.2 86.6V90M73.8 86.6V90M79.6 86.6V90" fill="none" stroke={C.mimosaFonce} strokeWidth="1" strokeLinecap="round" />
      {/* Les éclats */}
      <path d={eclat(22, 44, 4.5)} fill={C.blanc} />
      <path d={`${eclat(84, 22, 4)}${eclat(13, 28, 2.6)}`} fill={C.mimosa} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Le morceau de Lune

/** Le quartier de Lune, d'un seul tenant : l'arrondi d'un côté, la cassure en dents de l'autre. */
const LUNE ="M54.6 34.5A16.5 16.5 0 1 0 62.5 59.5L57.5 56L59 51L54 48.5L56.5 43.5L52.5 40Z";

/** Le morceau de Lune : un quartier gris pâle et son halo, sous une cloche de verre, sur un socle de nuit. */
const morceauDeLune: Art = (props) => {
  const sol = shade(C.grisClair, -0.07);
  return (
    <Svg viewBox="0 0 100 100" {...props}>
      <ellipse cx="50" cy="92" rx="38" ry="4" fill={C.nuit} fillOpacity="0.18" />
      {/* Le socle et son jonc d'or */}
      <rect x="16" y="81.5" width="68" height="8.5" rx="1.5" fill={C.nuit} />
      <rect x="19" y="79" width="62" height="3" rx="1.5" fill={METAL.or} />
      {/* La cloche : l'épaisseur du verre, le verre, le bouton */}
      <path fillRule="evenodd" d="M24 79V38Q24 15 50 15Q76 15 76 38V79ZM25.4 79V38Q25.4 16.4 50 16.4Q74.6 16.4 74.6 38V79Z" fill={C.marine} fillOpacity="0.2" />
      <path d="M24 79V38Q24 15 50 15Q76 15 76 38V79Z" fill={C.ciel} fillOpacity="0.42" />
      <circle cx="50" cy="12" r="3.6" fill={C.ciel} fillOpacity="0.8" />
      {/* Le halo : un disque à peine voilé, cerné d'un anneau de lumière */}
      <circle cx="49" cy="50" r="22" fill={C.blanc} fillOpacity="0.16" stroke={C.blanc} strokeOpacity="0.6" strokeWidth="1.3" />
      {/* La tige de laiton */}
      <path d="M49.2 64H50.8V77Q53.5 77.5 55 79.5H45Q46.5 77.5 49.2 77Z" fill={METAL.laiton} />
      {/* Le quartier de Lune : la tranche à l'ombre, la face, les cratères */}
      <path d={LUNE} transform="translate(2.4 2)" fill={C.gris} />
      <path d={LUNE} fill={C.grisClair} />
      <g fill={C.gris}>
        <circle cx="40" cy="45" r="3.4" />
        <circle cx="44" cy="57.5" r="2.6" />
        <circle cx="37.5" cy="54" r="1.6" />
        <circle cx="47.5" cy="38.5" r="2" />
      </g>
      <g fill={sol}>
        <circle cx="40.8" cy="45.8" r="2.6" />
        <circle cx="44.6" cy="58.1" r="1.9" />
        <circle cx="37.9" cy="54.4" r="1.1" />
        <circle cx="48" cy="39" r="1.4" />
      </g>
      {/* Le verre : l'ombre à droite, les reflets à gauche */}
      <path d="M76 38V79H70V38Q70 24 60 17.5Q76 20 76 38Z" fill={C.marine} fillOpacity="0.14" />
      <path d="M29.5 72V39Q29.5 26 38 20.5" fill="none" stroke={C.blanc} strokeOpacity="0.85" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M34 62V46" fill="none" stroke={C.blanc} strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round" />
      {/* Les éclats */}
      <path d={`${eclat(86, 24, 4)}${eclat(13, 34, 2.6)}`} fill={C.mimosa} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// L'étoile à ton nom

/** L'astre, centré en (50, 36). */
const ASTRE = etoile(50, 36, 21, 9);

/** Dix rayons en fuseau autour de (x, y) : cinq longs dans l'axe des branches, cinq courts entre elles. */
function rayons(x: number, y: number, long: number, court: number): string {
  const p = (r: number, a: number) => `${arrondi(x + r * Math.cos(a))} ${arrondi(y + r * Math.sin(a))}`;
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 - 90) * Math.PI) / 180;
    d += `M${p(i % 2 ? court : long, a)}L${p(8, a + 0.22)}L${p(8, a - 0.22)}Z`;
  }
  return d;
}

/** L'étoile à ton nom : une vraie étoile, qui flotte au-dessus de son pied doré. Le ruban est noué, la plaque attend son nom. */
const etoileATonNom: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="30" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* La lueur : deux disques et dix rayons */}
    <circle cx="50" cy="36" r="27" fill={C.mimosa} fillOpacity="0.2" />
    <circle cx="50" cy="36" r="20" fill={C.mimosa} fillOpacity="0.28" />
    <path d={rayons(50, 36, 28, 25)} fill={C.mimosa} fillOpacity="0.55" />
    {/* Le pied doré : coupelle, fût, terrasse */}
    <path d="M47 79L48 65H52L53 79Z" fill={METAL.or} />
    <path d="M42.5 61.5H57.5Q56 66.5 50 66.5Q44 66.5 42.5 61.5Z" fill={METAL.or} />
    <rect x="26" y="80" width="48" height="10" rx="1.5" fill={C.nuit} />
    <rect x="24" y="78" width="52" height="3" rx="1.5" fill={METAL.or} />
    {/* La plaque, vierge, et ses deux rivets */}
    <rect x="36" y="83" width="28" height="5" rx="1" fill={METAL.laiton} />
    <path d="M37.6 85.5a0.7 0.7 0 1 0 1.4 0a0.7 0.7 0 1 0 -1.4 0ZM61 85.5a0.7 0.7 0 1 0 1.4 0a0.7 0.7 0 1 0 -1.4 0Z" fill={C.boisFonce} />
    {/* Le ruban : les pans, les coques, le nœud */}
    <path d="M49 72L44 79L46.6 78.4L47.6 80.4L51 73ZM51 72L56 79L53.4 78.4L52.4 80.4L49 73Z" fill={C.bougFonce} />
    <path d="M50 71.5Q44 64.5 39 67.5Q36.5 71.5 39.5 75Q45 76.5 50 71.5Z" fill={C.bougainvillier} />
    <path d="M50 71.5Q56 64.5 61 67.5Q63.5 71.5 60.5 75Q55 76.5 50 71.5Z" fill={C.bougFonce} />
    <rect x="48" y="69.7" width="4" height="3.6" rx="1.2" fill={C.bougainvillier} />
    {/* L'étoile : l'ombre décalée, l'astre, son cœur */}
    <path d={ASTRE} transform="translate(1.6 1.6)" fill={C.mimosaFonce} />
    <path d={ASTRE} fill={C.mimosa} />
    <path d={etoile(50, 36, 12, 5.2)} fill={shade(C.mimosa, 0.55)} />
    <path d={eclat(50, 36, 7)} fill={C.blanc} />
    {/* Les éclats */}
    <path d={`${eclat(82, 16, 4)}${eclat(17, 24, 3)}${eclat(80, 54, 2.4)}`} fill={C.mimosa} />
  </Svg>
);

export const TREASURES_2: Record<string, Art> = {
  capsule,
  galet,
  "boule-a-neige": bouleANeige,
  nain,
  maquette,
  pendule,
  tapis,
  armure,
  dinosaure,
  meteorite,
  trone,
  "morceau-de-lune": morceauDeLune,
  "etoile-a-ton-nom": etoileATonNom,
};
