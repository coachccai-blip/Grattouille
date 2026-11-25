// Les trésors de la Galerie Archibald (BRIEF.md, annexe A).
//
// Un objet posé, vu de face. viewBox 0 0 100 100. L'objet tient entre y = 8 et
// y = 90 ; une ombre plate au sol vers y = 92. Fond transparent : l'objet est
// exposé sur une console dans le domaine, et sur une étiquette ivoire en boutique.

import { C, METAL, Svg, shade, type Art } from "./kit";

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

/** L'affiche ancienne du Casino : soleil couchant sur la jetée, le lettrage en barres. */
const affiche: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="36" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le cadre en bois */}
    <rect x="20" y="8" width="60" height="82" fill={C.bois} />
    <path d="M80 8V90H20L25 85H75V13Z" fill={shade(C.bois, -0.28)} />
    {/* Le papier jauni */}
    <rect x="25" y="13" width="50" height="72" fill={C.creme} />
    {/* Le ciel du soir, les rayons, le soleil, la mer */}
    <rect x="29" y="27" width="42" height="40" fill={C.corail} />
    <path d="M44 55L29 35V44ZM44 55L33 27H41ZM44 55L50 27H58ZM44 55L66 27H71V31ZM44 55L71 41V50Z" fill={shade(C.corail, 0.3)} />
    <circle cx="44" cy="55" r="10" fill={C.mimosa} />
    <rect x="29" y="55" width="42" height="12" fill={C.marine} />
    {/* Le Casino sur sa jetée */}
    <path d="M40 57H50V47Q58 36 66 47V57H71V60H69V65H67V60H58V65H56V60H46V65H44V60H40Z" fill={C.prune} />
    {/* Le lettrage : des barres */}
    <path d="M31 17H69V23H31ZM33 71H67V74H33ZM39 78H61V81H39Z" fill={C.prune} />
  </Svg>
);

/** Le vase en porcelaine : blanc et bleu, une fleur peinte sur la panse. */
const vase: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="26" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le col, la panse, le pied */}
    <path d="M38 90H62L58 84Q80 70 78 52Q76 34 60 28Q58 20 66 10H34Q42 20 40 28Q24 34 22 52Q20 70 42 84Z" fill={C.ecume} />
    <path d="M66 10Q58 20 60 28Q76 34 78 52Q80 70 58 84L62 90H54L52 84Q68 70 66 52Q64 36 54 28Q52 20 58 10Z" fill={C.brume} />
    {/* Les liserés bleus */}
    <path d="M34 10H66L62 16H38ZM40 26H60V30H40ZM42 84H58L62 90H38Z" fill={C.marine} />
    {/* Le décor peint : une fleur, sa tige, ses feuilles */}
    <path d="M45 62Q44 70 48 78" fill="none" stroke={C.marine} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M47 68Q57 62 62 70Q54 75 47 68ZM44 72Q36 68 31 74Q38 79 44 72Z" fill={C.azur} />
    <path d="M39.5 49.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM45.7 54a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM43.3 61.3a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM35.7 61.3a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0ZM33.3 54a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0Z" fill={C.marine} />
    <circle cx="44" cy="56" r="3" fill={C.ecume} />
    <path d="M58 42a2 2 0 1 0 4 0a2 2 0 1 0 -4 0ZM29 46a2 2 0 1 0 4 0a2 2 0 1 0 -4 0ZM62 56a2 2 0 1 0 4 0a2 2 0 1 0 -4 0Z" fill={C.azur} />
  </Svg>
);

/** Une pince du homard, poignet à l'origine, pointe vers la droite. */
const PINCE = "M0 0Q2 -6 10 -6Q16 -6 19 -2L11 -1L18 3Q12 6 6 5Q1 4 0 0Z";

/** « Nature morte au homard » : un cadre doré, une table, un plat, et la bête rouge. */
const tableau: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="44" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le cadre doré et son fronton */}
    <path d="M36 20Q50 2 64 20Z" fill={METAL.or} />
    <rect x="8" y="18" width="84" height="72" fill={METAL.or} />
    <path d="M92 18V90H8L15 83H85V25Z" fill={C.mimosaFonce} />
    <rect x="15" y="25" width="70" height="58" fill={shade(C.mimosaFonce, -0.4)} />
    {/* La toile : fond sombre, table, bouteille, plat */}
    <rect x="17" y="27" width="66" height="54" fill={C.nuit} />
    <rect x="17" y="60" width="66" height="21" fill={C.bois} />
    <rect x="17" y="74" width="66" height="7" fill={shade(C.bois, -0.25)} />
    <path d="M20 62V44Q20 40 22 38V31H26V38Q28 40 28 44V62Z" fill={C.persFonce} />
    <ellipse cx="54" cy="63" rx="27" ry="9" fill={C.creme} />
    <ellipse cx="25" cy="72" rx="5.5" ry="4" fill={C.mimosa} />
    {/* Le homard : queue, carapace, pinces, antennes et pattes */}
    <path d="M36 58L29 52Q31 58 29 64ZM46 53.5Q38 52 34 58Q38 64 46 62.5ZM60 54L68 58L60 62Z" fill={C.cerise} />
    <ellipse cx="53" cy="58" rx="9" ry="5.5" fill={C.cerise} />
    <path d="M44 59Q53 62 62 59Q60 63.5 53 63.5Q46 63.5 44 59Z" fill={shade(C.cerise, -0.28)} />
    <path d="M60 55L66 48M61 61L68 64" fill="none" stroke={C.cerise} strokeWidth="3.5" strokeLinecap="round" />
    <path d={PINCE} transform="translate(65 48) rotate(-32)" fill={C.cerise} />
    <path d={PINCE} transform="translate(67 64) rotate(10)" fill={C.cerise} />
    <path d="M66 57Q75 52 81 40M66 59Q76 58 82 53M48 53L46 49M52 52.5L51 48.5M56 53L57 49M48 63L46 67M52 63.5L51 67.5M56 63L57 67" fill="none" stroke={C.cerise} strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

/** La silhouette de l'hippocampe, d'un seul tenant : couronne, museau, ventre, queue en crosse. */
const HIPPOCAMPE =
  "M42 19L43 13L45.5 7.5L48 12.5L51 7.5L53 12.5Q59.5 14 62 20L73 26L72 31.5L61 28.5Q57 29 56.5 32.5Q49.5 36.5 55.5 41.5Q63 47 57 55Q54.5 58.5 51.5 59.5Q49.5 62 50.5 65.5Q51.5 69 54.5 69Q58.5 69 58.5 66Q58.5 63 55.5 62Q61.5 59 63 65Q64.5 73 54.5 74Q45 74 44 66Q43.5 60 45 56Q45.5 52 41.5 50L35 51Q29.5 45 34.5 39.5L39.5 40.5Q37.5 33 39.5 27Q40.5 22 42 19Z";

/** La statue en bronze : un hippocampe cabré sur son socle de marbre sombre. */
const statue: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="52" cy="92" rx="28" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le socle de marbre */}
    <path d="M34 74H70V79H74V90H30V79H34Z" fill={C.ardoise} />
    <path d="M58 74H70V79H74V90H61V79H58Z" fill={shade(C.ardoise, -0.3)} />
    <rect x="38" y="82" width="16" height="5" rx="1" fill={METAL.laiton} />
    {/* Le bronze : l'ombre décalée, puis la silhouette */}
    <path d={HIPPOCAMPE} transform="translate(2.5 2)" fill={C.boisFonce} />
    <path d={HIPPOCAMPE} fill={METAL.cuivre} />
    <path d="M44 43Q51 46 58 44M44.5 49Q52 52 59 49.5M47 55Q52 57 56.5 55" fill="none" stroke={C.boisFonce} strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="54.5" cy="20" r="1.8" fill={C.boisFonce} />
  </Svg>
);

/** L'œuf d'orfèvre : émail vert, résille et ceinture d'or, un rubis, des perles. */
const oeuf: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="26" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* L'œuf émaillé */}
    <path d="M50 18Q69 21 72 46Q73 70 50 73Q27 70 28 46Q31 21 50 18Z" fill={C.persienne} />
    <path d="M50 18Q69 21 72 46Q73 70 50 73Q63 68 63 46Q62 26 50 18Z" fill={shade(C.persienne, -0.3)} />
    {/* La résille et les guirlandes d'or */}
    <path d="M31 42L46 21M40 46.5L57 22M52 48.5L65 29M69 42L54 21M60 46.5L43 22M48 48.5L35 29M30 54Q40 67 50 57Q60 67 70 54" fill="none" stroke={METAL.or} strokeWidth="1.6" strokeLinecap="round" />
    {/* La ceinture, le rubis et les perles */}
    <path d="M28 45Q50 53 72 45V51Q50 59 28 51Z" fill={METAL.or} />
    <circle cx="50" cy="52" r="4.5" fill={C.cerise} />
    <path d="M34.5 49.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0ZM60.5 49.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0ZM48 64a2 2 0 1 0 4 0a2 2 0 1 0 -4 0Z" fill={C.blanc} />
    {/* Le fleuron */}
    <path d="M43 21L44 12L50 17L56 12L57 21Z" fill={METAL.or} />
    <circle cx="50" cy="11" r="3" fill={C.cerise} />
    {/* Le pied d'or */}
    <path d="M36 68Q50 80 64 68L60 76Q56 78 54 78L56 84Q66 84 68 90H32Q34 84 44 84L46 78Q44 78 40 76Z" fill={METAL.or} />
  </Svg>
);

/** Le fragment de fresque, d'un seul tenant. */
const FRAGMENT = "M14 30L24 14L46 17L60 9L84 16L90 40L84 54L88 74L80 86H20L10 72L16 54L9 40Z";

/** La fresque de maître : deux pattes qui vont se toucher, sur un éclat de mur monté sur or. */
const fresque: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="38" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* L'éclat de mur : l'épaisseur à l'ombre, puis la face peinte */}
    <path d={FRAGMENT} transform="translate(3 2.5)" fill={shade(C.pierre, -0.3)} />
    <path d={FRAGMENT} fill={C.brume} />
    {/* La colline, et la gloire à la feuille d'or */}
    <path d="M10 72L16 54L11.5 44Q30 50 44 86H20Z" fill={C.olive} />
    <path d="M84 16L90 40L86 49Q66 44 64 30Q64 18 72 12.5Z" fill={METAL.or} />
    {/* La frise du haut */}
    <path d="M19 22H85.5L86.8 27H15.9Z" fill={C.terracotta} />
    <path d="M24 24.5H84" fill="none" stroke={C.craie} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 5.9" />
    {/* Les deux pattes */}
    <path d="M15 57L37 44Q43 41 48 44.5L52 47Q53.5 49 51.5 50L46.5 49.5Q46 54.5 41 53L19 66Z" fill={C.terracotta} />
    <path d="M88 33L66 39Q60 40 58 44L56 46Q54.5 48 56.5 48.5L61 47.5Q62 51.5 67 50L86 46Z" fill={C.gris} />
    {/* Les manques et la fissure */}
    <path d="M24 14L46 17L38 23L27 21ZM88 74L80 86H66L72 78ZM16 54L9 40L15 42Z" fill={C.craie} />
    <path d="M60 9L57 20L62 29L55 38L54 45M54 52L57 62L52 70" fill="none" stroke={shade(C.pierre, -0.4)} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    {/* La monture dorée */}
    <path d="M22 86H78V90H22ZM26 86V78H30V86ZM70 86V78H74V86Z" fill={METAL.or} />
  </Svg>
);

/** « L'Étoile du Port » : un diamant énorme, posé sur son coussin de velours. */
const diamant: Art = (props) => (
  <Svg viewBox="0 0 100 100" {...props}>
    <ellipse cx="50" cy="92" rx="40" ry="4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le coussin de velours et ses pompons d'or */}
    <path d="M10 64Q30 71 50 69Q70 71 90 64Q86 76 90 88Q50 83 10 88Q14 76 10 64Z" fill={C.bordeaux} />
    <path d="M90 64Q86 76 90 88Q50 83 10 88Q50 78 78 75Q86 71 90 64Z" fill={shade(C.bordeaux, -0.3)} />
    <ellipse cx="50" cy="70.5" rx="17" ry="3" fill={shade(C.bordeaux, -0.45)} />
    <circle cx="10.5" cy="64" r="3.5" fill={METAL.or} />
    <circle cx="89.5" cy="64" r="3.5" fill={METAL.or} />
    <circle cx="10.5" cy="87" r="3.5" fill={METAL.or} />
    <circle cx="89.5" cy="87" r="3.5" fill={METAL.or} />
    {/* Le diamant : la couronne, puis la culasse */}
    <path d="M14 32L30 14L39 32Z" fill={shade(C.ciel, 0.5)} />
    <path d="M30 14H50L39 32Z" fill={C.blanc} />
    <path d="M39 32L50 14L61 32Z" fill={shade(C.azur, 0.55)} />
    <path d="M50 14H70L61 32Z" fill={C.azur} />
    <path d="M61 32L70 14L86 32Z" fill={shade(C.azur, -0.2)} />
    <path d="M14 32H39L50 70Z" fill={shade(C.azur, 0.55)} />
    <path d="M39 32H61L50 70Z" fill={C.azur} />
    <path d="M61 32H86L50 70Z" fill={C.marine} />
    {/* Les éclats */}
    <path d="M62 18L64.8 28.2L75 31L64.8 33.8L62 44L59.2 33.8L49 31L59.2 28.2Z" fill={C.blanc} />
    <path d="M18 8L19.6 14.4L26 16L19.6 17.6L18 24L16.4 17.6L10 16L16.4 14.4ZM88 42L89 46L93 47L89 48L88 52L87 48L83 47L87 46Z" fill={C.mimosa} />
  </Svg>
);

/**
 * Identifiants attendus : coquillage, affiche, vase, tableau, statue, oeuf,
 * fresque, diamant.
 */
export const TREASURES: Record<string, Art> = {
  coquillage,
  affiche,
  vase,
  tableau,
  statue,
  oeuf,
  fresque,
  diamant,
};
