// La garde-robe de la Maison Sidonie, suite : 7 chapeaux et 7 paires de lunettes.
//
// Même contrat que wardrobe.tsx (à lire d'abord) : chaque article est un calque <g>
// dessiné dans le repère de l'avatar (viewBox 0 0 400 480), sans <svg> autour.
// - `chapeau` : posé sur le crâne. Base à y = 95, largeur utile 170 (x de 115 à 285),
//   rien au-dessus de y = 2.
// - `lunettes` : centrées en (200, 165), un verre par œil, en (165, 165) et (235, 165).
// `thumb` recadre la vignette de boutique quand le cadrage par défaut ne convient pas.
//
// Identifiants attendus (shared/catalog.ts) :
//   chapeau-journal, panama, casquette-capitaine, tiare, casque-scaphandre, aureole, anneaux-saturne,
//   lunettes-carton, lunettes-aviateur, jumelles-opera, lunettes-rubis, visiere-cosmonaute,
//   lunettes-etoiles, monocle-telescope.

import { C, METAL, shade } from "./kit";
import type { WardrobeArt } from "./wardrobe";

/** Le noir des feutres et des rubans : un ton au-dessus de `noir`, qui lui sert d'ombre. */
const NOIR_DOUX = "#333B41";
/** L'or à l'ombre : le dernier ton du dégradé, en aplat. */
const OR_SOMBRE = "#8A6410";
/** L'or en pleine lumière : le premier ton du dégradé, en aplat. */
const OR_CLAIR = "#FFF0B8";
/** La nacre : en lumière, à mi-ombre, à l'ombre. */
const NACRE = "#F7F0E3";
const NACRE_MI = "#E8DCCB";
const NACRE_OMBRE = "#CDBDA8";

/**
 * Une rangée de pastilles le long d'un tracé : rivets, brillants, poussières. C'est un
 * tireté de longueur presque nulle à bouts ronds, donc autant de disques pleins.
 * `pas` est l'écart entre deux centres, `strokeWidth` le diamètre.
 */
function pastilles(pas: number) {
  return {
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: `0.1 ${(pas - 0.1).toFixed(2)}`,
  } as const;
}

/** Un éclat à quatre branches, posé en (0, 0). */
const ECLAT = "M0 -9Q1 -1 9 0Q1 1 0 9Q-1 1 -9 0Q-1 -1 0 -9Z";

// ---------------------------------------------------------------------------
// Chapeaux

const PAPIER = "#F3F1EA";

const chapeauJournal: WardrobeArt = {
  Layer: () => (
    <g transform="rotate(-6 200 108)">
      {/* L'ombre du bord relevé : la même forme, plus sombre, décalée en bas à droite. */}
      <path d="M99 126L113 96H293L307 126Z" fill={shade(PAPIER, -0.34)} />
      {/* Les deux rabats du pliage. Celui de droite est dans l'ombre du pli. */}
      <path d="M200 12L100 122H200Z" fill={shade(PAPIER, -0.05)} />
      <path d="M200 12L300 122H200Z" fill={shade(PAPIER, -0.17)} />
      {/* Le papier imprimé : un titre, des lignes de texte, une photo. */}
      <path d="M147 87L177 54" fill="none" stroke={C.grisFonce} strokeWidth="5" />
      <path d="M193 47.9L156.6 88M167.4 88L193 59.8M193 71.7L178.2 88" fill="none" stroke={C.gris} strokeWidth="2.6" strokeDasharray="13 3 8 3 17 3" />
      <path d="M246.9 78.4L230.7 60.6L215.9 74.1L232.1 91.9Z" fill={C.gris} />
      <path d="M227.3 58.4L207 36.1M207 47.9L221.3 63.7M221.8 88L207 71.7" fill="none" stroke={C.gris} strokeWidth="2.6" strokeDasharray="13 3 8 3 17 3" />
      {/* Le bord relevé, ses deux coins rentrés. */}
      <path d="M96 122L110 92H290L304 122Z" fill={PAPIER} />
      <path d="M110 92L96 122H112Z" fill={shade(PAPIER, -0.08)} />
      <path d="M290 92L304 122H288Z" fill={shade(PAPIER, -0.17)} />
      {/* La une : le nom du journal, deux colonnes, les mots croisés. */}
      <rect x="124" y="98" width="50" height="8" fill={C.grisFonce} />
      <path d="M124 112H174M174 117H136M186 100H236M236 105H186M186 110H236M222 115H186" fill="none" stroke={C.gris} strokeWidth="2.6" strokeDasharray="13 3 8 3 17 3" />
      <rect x="247" y="96" width="24" height="24" fill={C.grisFonce} />
      <path d="M248.5 97.5h6v6h-6ZM263.5 97.5h6v6h-6ZM248.5 105h6v6h-6ZM256 105h6v6h-6ZM263.5 105h6v6h-6ZM256 112.5h6v6h-6Z" fill={PAPIER} />
    </g>
  ),
};

const PANAMA = "#F3E3BF";

const panama: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le bord souple : la tranche, puis le dessus et un rang de tressage. */}
      <path d="M72 107Q70 96 96 92Q200 78 304 92Q330 96 328 107Q326 116 300 121Q200 137 100 121Q74 116 72 107Z" fill={shade(PANAMA, -0.32)} />
      <path d="M72 103Q70 92 96 88Q200 74 304 88Q330 92 328 103Q326 112 300 117Q200 133 100 117Q74 112 72 103Z" fill={PANAMA} />
      <path d="M88 104Q200 124 312 104" fill="none" stroke={shade(PANAMA, -0.14)} strokeWidth="1.6" />
      {/* L'ombre de la calotte sur le bord. */}
      <path d="M132 100Q200 120 268 100Q284 106 270 112Q204 128 144 112Z" fill={C.noir} fillOpacity="0.14" />
      {/* Calotte pincée : deux épaules, un creux au sommet. */}
      <path d="M134 102Q133 68 143 44Q150 24 170 22Q187 21 200 30Q213 21 230 22Q250 24 257 44Q267 68 266 102Q200 122 134 102Z" fill={PANAMA} />
      <path d="M266 102Q200 122 134 102Q186 106 228 96Q254 88 257 44Q267 68 266 102Z" fill={shade(PANAMA, -0.16)} />
      <path d="M146 66Q145 40 165 29Q154 43 155 70Z" fill={shade(PANAMA, 0.5)} />
      {/* La pince du devant : un V qui descend du creux. */}
      <path d="M200 37Q191 31 183 32Q194 47 200 77Q206 47 217 32Q209 31 200 37Z" fill={shade(PANAMA, -0.16)} />
      <path d="M200 37Q209 31 217 32Q206 47 200 77Z" fill={shade(PANAMA, -0.26)} />
      {/* Ruban noir, son nœud plat sur le côté. */}
      <path d="M134.5 78Q200 98 265.5 78L266 102Q200 122 134 102Z" fill={NOIR_DOUX} />
      <path d="M134.5 78Q200 98 265.5 78L265.6 81.5Q200 101.5 134.4 81.5Z" fill={C.grisFonce} />
      <path d="M265.5 78L266 102Q254 106 240 109L240 85.5Q254 82.5 265.5 78Z" fill={C.noir} fillOpacity="0.4" />
      <path d="M150 81.5L162 84L162 110L150 107.5Z" fill={C.noir} />
    </g>
  ),
  thumb: "62 -4 276 172",
};

const casquetteCapitaine: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le fond blanc, plus large que le bandeau, et son ombre. */}
      <path d="M98 64Q94 34 150 24Q200 16 250 24Q306 34 302 64Q298 80 278 84Q200 102 122 84Q102 80 98 64Z" fill={C.blanc} />
      <path d="M302 64Q298 80 278 84Q200 102 122 84Q104 80 99 68Q150 86 216 76Q280 64 294 40Q304 50 302 64Z" fill={C.grisClair} />
      {/* Bandeau marine. */}
      <path d="M121 82Q200 100 279 82L280 106Q200 124 120 106Z" fill={C.marine} />
      <path d="M279 82L280 106Q266 110 250 113L250 89Q266 86 279 82Z" fill={C.noir} fillOpacity="0.3" />
      {/* Visière vernie, son reflet, son jonc d'or. */}
      <path d="M126 106Q200 124 274 106Q284 116 268 123Q200 143 132 123Q116 116 126 106Z" fill={shade(C.marine, -0.5)} />
      <path d="M146 117Q200 131 244 124Q200 137 152 124Z" fill={C.azur} fillOpacity="0.55" />
      <path d="M131 122.5Q200 143 269 122.5" fill="none" stroke={METAL.or} strokeWidth="2.5" strokeLinecap="round" />
      {/* Fausse jugulaire : un galon d'or torsadé entre deux boutons. */}
      <path d="M128 100Q200 118 272 100" fill="none" stroke={METAL.or} strokeWidth="6.5" strokeLinecap="round" />
      <path d="M128 100Q200 118 272 100" fill="none" stroke={OR_SOMBRE} strokeWidth="6.5" strokeDasharray="1.6 5" />
      <circle cx="127" cy="99.5" r="6" fill={METAL.or} />
      <circle cx="273" cy="99.5" r="6" fill={METAL.or} />
      {/* L'écusson : une ancre d'or sur un ovale marine. */}
      <ellipse cx="200" cy="76" rx="25" ry="28" fill={METAL.or} />
      <ellipse cx="200" cy="76" rx="21" ry="24" fill={C.marine} />
      <path d="M198 66H202V71H210V75H202V92H198V75H190V71H198ZM182.5 84L187 76L191.5 84ZM208.5 84L213 76L217.5 84Z" fill={METAL.or} />
      <path d="M187 82Q188 93 200 93Q212 93 213 82" fill="none" stroke={METAL.or} strokeWidth="3.6" />
      <circle cx="200" cy="62" r="3.6" fill="none" stroke={METAL.or} strokeWidth="2.6" />
    </g>
  ),
};

const SAPHIR = "#2456B4";
/** Les flammes de la tiare, pointe vers le haut, posées en (0, 0) : grande, moyenne, petite. */
const FLAMME_1 = "M-13 3Q-14.5 -24 0 -46Q14.5 -24 13 3Z";
const FLAMME_2 = "M-11 3Q-12 -18 0 -34Q12 -18 11 3Z";
const FLAMME_3 = "M-9 3Q-10 -12 0 -23Q10 -12 9 3Z";
/** Le bandeau : un arc qui suit le haut du crâne, d'une tempe à l'autre. */
const BANDEAU_TIARE = "M123.55 119.39A94.5 89.5 0 0 1 276.45 119.39";
/** Les six flammes, de part et d'autre du médaillon : elles rayonnent autour du crâne. */
const FLAMMES: readonly (readonly [string, string])[] = [
  [FLAMME_3, "translate(132 109.8) rotate(-46)"],
  [FLAMME_2, "translate(149.9 96.1) rotate(-32)"],
  [FLAMME_1, "translate(172.4 86.4) rotate(-17)"],
  [FLAMME_1, "translate(227.6 86.4) rotate(17)"],
  [FLAMME_2, "translate(250.1 96.1) rotate(32)"],
  [FLAMME_3, "translate(268 109.8) rotate(46)"],
];

const tiare: WardrobeArt = {
  Layer: () => (
    <g>
      {/* L'ombre des flammes et du médaillon : les mêmes formes, décalées en bas à droite. */}
      <g transform="translate(2.5 3.5)" fill={C.noir} opacity="0.22">
        {FLAMMES.map(([d, t]) => (
          <path key={t} d={d} transform={t} />
        ))}
        <ellipse cx="200" cy="60" rx="19" ry="23" />
      </g>
      {/* Les flammes d'argent. */}
      <g fill={METAL.argent}>
        {FLAMMES.map(([d, t]) => (
          <path key={t} d={d} transform={t} />
        ))}
        <path d="M194 42Q193 30 200 20Q207 30 206 42Z" />
      </g>
      {/* Le bandeau, qui épouse le crâne, pavé de brillants. */}
      <path d={BANDEAU_TIARE} fill="none" stroke={METAL.argent} strokeWidth="11" strokeLinecap="round" />
      <path d="M127.03 121.92A90.2 85.2 0 0 1 272.97 121.92" fill="none" stroke={C.noir} strokeOpacity="0.25" strokeWidth="2.4" />
      <path d={BANDEAU_TIARE} stroke={C.blanc} strokeWidth="5" {...pastilles(10.34)} />
      {/* Le médaillon : un grand saphir ovale dans son entourage de brillants. */}
      <ellipse cx="200" cy="60" rx="19" ry="23" fill={METAL.argent} />
      <ellipse cx="200" cy="60" rx="15.5" ry="19.5" stroke={C.blanc} strokeWidth="3.6" {...pastilles(9.2)} />
      <ellipse cx="200" cy="60" rx="11.5" ry="15.5" fill={SAPHIR} />
      <path d="M194 50H206L210 60L206 70H194L190 60Z" fill={C.azur} />
      <path d="M211.5 60Q211.5 71 200 75.5Q192 73 189.5 66L194 70H206L210 60Z" fill={shade(SAPHIR, -0.45)} />
      <path d="M193 51H199.5L195.5 59H191Z" fill={C.blanc} fillOpacity="0.8" />
      {/* Les saphirs des flammes, un reflet sur chacun. */}
      <g fill={SAPHIR}>
        <circle cx="166.8" cy="68.2" r="6.5" />
        <circle cx="233.2" cy="68.2" r="6.5" />
        <circle cx="142.5" cy="84.2" r="5" />
        <circle cx="257.5" cy="84.2" r="5" />
      </g>
      <g fill={C.ciel}>
        <circle cx="164.8" cy="66.2" r="2.4" />
        <circle cx="231.2" cy="66.2" r="2.4" />
        <circle cx="141" cy="82.7" r="1.9" />
        <circle cx="256" cy="82.7" r="1.9" />
      </g>
      {/* Brillants : aux pointes et sur les deux petites flammes. */}
      <g fill={C.blanc}>
        <circle cx="200" cy="17" r="4.5" />
        <circle cx="158.4" cy="40.5" r="4" />
        <circle cx="241.6" cy="40.5" r="4" />
        <circle cx="130.8" cy="65.6" r="3.5" />
        <circle cx="269.2" cy="65.6" r="3.5" />
        <circle cx="114.4" cy="92.7" r="3" />
        <circle cx="285.6" cy="92.7" r="3" />
        <circle cx="125.5" cy="103.5" r="3" />
        <circle cx="274.5" cy="103.5" r="3" />
      </g>
      {/* Deux éclats. */}
      <path d={ECLAT} transform="translate(186 42)" fill={C.blanc} />
      <path d={ECLAT} transform="translate(262 52) scale(0.65)" fill={C.blanc} />
    </g>
  ),
  thumb: "100 4 200 125",
};

/** Le hublot de face : c'est le même trou qui perce l'ombre et l'or du bonnet. */
const HUBLOT = "M134 176A66 66 0 1 0 266 176A66 66 0 1 0 134 176Z";
/** La ligne des huit boulons de la collerette. */
const BOULONS_COLLERETTE = "M115.5 263.7Q200 289.3 284.5 263.7";

const casqueScaphandre: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le raccord d'air, au sommet. */}
      <rect x="188" y="24" width="24" height="22" rx="5" fill={METAL.laiton} />
      <rect x="180" y="38" width="40" height="9" rx="3" fill={METAL.or} />
      {/* Le bonnet : une sphère d'or percée du hublot. L'ombre d'abord, puis l'or, décalé vers la lumière. */}
      <path fillRule="evenodd" d={`M80 162A120 120 0 1 1 320 162A120 120 0 1 1 80 162Z${HUBLOT}`} fill={OR_SOMBRE} />
      <path fillRule="evenodd" d={`M80 158A116 116 0 1 1 312 158A116 116 0 1 1 80 158Z${HUBLOT}`} fill={METAL.or} />
      <path d="M110 112Q124 68 164 56Q136 78 124 116Z" fill={C.blanc} fillOpacity="0.55" />
      {/* La vitre : à peine teintée, un reflet. */}
      <circle cx="200" cy="176" r="66" fill={C.ciel} fillOpacity="0.16" />
      <path d="M142 160Q141 133 165 119Q150 135 150 162Z" fill={C.blanc} fillOpacity="0.5" />
      {/* Le cadre du hublot et son ombre, qui tombe sur la vitre en haut à gauche. */}
      <circle cx="203" cy="180" r="74" fill="none" stroke={C.noir} strokeOpacity="0.28" strokeWidth="16" />
      <circle cx="200" cy="176" r="74" fill="none" stroke={METAL.laiton} strokeWidth="16" />
      <circle cx="201.5" cy="178" r="74" stroke={OR_SOMBRE} strokeWidth="9" {...pastilles(46.49)} />
      <circle cx="200" cy="176" r="74" stroke={OR_CLAIR} strokeWidth="9" {...pastilles(46.49)} />
      {/* Les deux hublots de côté, vus de biais. */}
      <ellipse cx="104" cy="150" rx="10" ry="22" transform="rotate(8 104 150)" fill={C.nuit} stroke={METAL.laiton} strokeWidth="6" />
      <ellipse cx="296" cy="150" rx="10" ry="22" transform="rotate(-8 296 150)" fill={C.nuit} stroke={METAL.laiton} strokeWidth="6" />
      <path d="M99 142Q100 134 104 131Q103 138 103 146ZM291 142Q292 134 296 131Q295 138 295 146Z" fill={C.ciel} />
      {/* La collerette boulonnée, sa tranche. */}
      <path d="M102 273Q200 307 298 273V268Q200 302 102 268Z" fill={OR_SOMBRE} />
      <path d="M106 252Q200 284 294 252L298 268Q200 302 102 268Z" fill={METAL.laiton} />
      <path d="M106 252Q200 284 294 252L294.8 255.5Q200 287.5 105.2 255.5Z" fill={C.blanc} fillOpacity="0.45" />
      <path d={BOULONS_COLLERETTE} transform="translate(1.5 2)" stroke={OR_SOMBRE} strokeWidth="8" {...pastilles(24.45)} />
      <path d={BOULONS_COLLERETTE} stroke={OR_CLAIR} strokeWidth="8" {...pastilles(24.45)} />
    </g>
  ),
  thumb: "62 14 276 286",
};

/** La lueur de l'auréole : un jaune plus chaud que l'or clair, pour rester doré sur fond sombre. */
const HALO = "#FFE48A";

const aureole: WardrobeArt = {
  Layer: () => (
    <g transform="rotate(-8 200 46)">
      {/* Le halo : trois anneaux translucides, de plus en plus serrés. */}
      <ellipse cx="200" cy="46" rx="70" ry="16" fill="none" stroke={HALO} strokeOpacity="0.16" strokeWidth="44" />
      <ellipse cx="200" cy="46" rx="70" ry="16" fill="none" stroke={HALO} strokeOpacity="0.22" strokeWidth="31" />
      <ellipse cx="200" cy="46" rx="70" ry="16" fill="none" stroke={HALO} strokeOpacity="0.32" strokeWidth="20" />
      {/* L'anneau d'or, vu de trois quarts : la tranche, puis le dessus. */}
      <path d="M124 49.5A76 19.5 0 1 0 276 49.5A76 19.5 0 1 0 124 49.5ZM137 49.5A63 11.5 0 1 1 263 49.5A63 11.5 0 1 1 137 49.5Z" fill={OR_SOMBRE} />
      <path d="M124 46A76 19.5 0 1 0 276 46A76 19.5 0 1 0 124 46ZM137 46A63 11.5 0 1 1 263 46A63 11.5 0 1 1 137 46Z" fill={METAL.or} />
      <path d="M131 43.3A70 15.5 0 0 1 176 31.4" fill="none" stroke={C.blanc} strokeOpacity="0.75" strokeWidth="3" strokeLinecap="round" />
      {/* Trois éclats : il est authentique. */}
      <path d={ECLAT} transform="translate(258 26)" fill={C.blanc} />
      <path d={ECLAT} transform="translate(146 64) scale(0.6)" fill={C.blanc} />
      <path d={ECLAT} transform="translate(214 62) scale(0.45)" fill={C.blanc} />
    </g>
  ),
  thumb: "100 -14 200 125",
};

/**
 * Un anneau plat vu de trois quarts, centré en (200, 88) : la couronne entre deux
 * ellipses de même aplatissement. Les deux tours tournent en sens contraires, donc
 * le trou reste un trou quelle que soit la règle de remplissage.
 */
function anneau(dehors: number, dedans: number): string {
  const ellipse = (rx: number, sens: 0 | 1) => {
    const ry = (rx * 0.28).toFixed(1);
    return `M${200 - rx} 88A${rx} ${ry} 0 1 ${sens} ${200 + rx} 88A${rx} ${ry} 0 1 ${sens} ${200 - rx} 88Z`;
  };
  return ellipse(dehors, 0) + ellipse(dedans, 1);
}

const anneauxSaturne: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Les anneaux penchent ; le crâne passe au milieu. Du plus large au plus serré : or, trois lilas, or pâle. */}
      <g transform="rotate(-12 200 88)">
        <path d={anneau(130, 116)} fill={METAL.or} />
        <path d={anneau(113, 106)} fill={shade(C.lilas, -0.22)} />
        <path d={anneau(106, 96)} fill={C.lilas} />
        <path d={anneau(96, 89)} fill={shade(C.lilas, 0.45)} />
        <path d={anneau(86, 79)} fill={C.sable} />
        {/* Poussière de glace sur l'anneau d'or. */}
        <ellipse cx="200" cy="88" rx="123" ry="34.44" stroke={C.blanc} strokeWidth="3.2" {...pastilles(16.7)} />
      </g>
      {/* Deux lunes minuscules, chacune avec sa face à l'ombre. */}
      <circle cx="316" cy="30" r="9" fill={C.craie} />
      <path d="M322.4 23.6A9 9 0 0 1 309.6 36.4A11.5 11.5 0 0 0 322.4 23.6Z" fill={C.pierre} />
      <circle cx="312.5" cy="27" r="2" fill={C.pierre} />
      <circle cx="96" cy="147" r="5.5" fill={shade(C.lilas, 0.45)} />
      <path d="M99.9 143.1A5.5 5.5 0 0 1 92.1 150.9A7 7 0 0 0 99.9 143.1Z" fill={C.lilas} />
      {/* Trois éclats. */}
      <path d={ECLAT} transform="translate(100 126) scale(0.8)" fill={C.blanc} />
      <path d={ECLAT} transform="translate(283 56) scale(0.55)" fill={C.blanc} />
      <path d={ECLAT} transform="translate(288 112) scale(0.5)" fill={C.blanc} />
    </g>
  ),
  thumb: "58 7 284 160",
};

// ---------------------------------------------------------------------------
// Lunettes

/** La monture de carton : le tour, puis les deux fenêtres. */
const CARTON = "M136 142H264Q272 142 272 150V182Q272 190 264 190H208L202 178Q200 175 198 178L192 190H136Q128 190 128 182V150Q128 142 136 142ZM146 150H184Q190 150 190 156V176Q190 182 184 182H146Q140 182 140 176V156Q140 150 146 150ZM216 150H254Q260 150 260 156V176Q260 182 254 182H216Q210 182 210 176V156Q210 150 216 150Z";

const lunettesCarton: WardrobeArt = {
  Layer: () => (
    <g transform="rotate(-3 200 165)">
      {/* Les branches, pliées vers les oreilles. */}
      <path d="M132 158L106 150M268 158L294 150" fill="none" stroke={shade(C.kraft, -0.2)} strokeWidth="13" />
      {/* L'ombre du carton. */}
      <path fillRule="evenodd" d={CARTON} transform="translate(2.5 3.5)" fill={shade(C.kraft, -0.42)} />
      {/* Les deux filtres : rouge à gauche, bleu à droite. */}
      <rect x="138" y="148" width="54" height="36" fill={C.cerise} fillOpacity="0.62" />
      <rect x="208" y="148" width="54" height="36" fill={C.azur} fillOpacity="0.68" />
      <path d="M148 152H158L150 178H140ZM218 152H228L220 178H210Z" fill={C.blanc} fillOpacity="0.3" />
      {/* La monture, ses deux plis. */}
      <path fillRule="evenodd" d={CARTON} fill={C.kraft} />
      <path d="M133 144.5V187.5M267 144.5V187.5" fill="none" stroke={shade(C.kraft, -0.2)} strokeWidth="1.6" />
      <path d="M140 146.2H260" fill="none" stroke={shade(C.kraft, 0.35)} strokeWidth="1.6" strokeDasharray="5 4" />
    </g>
  ),
};

/** Les deux verres en goutte des lunettes d'aviateur. */
const VERRES_AVIATEUR = "M189 146Q164 141 141 144Q129 146 129 160Q129 184 148 194Q164 202 178 192Q193 181 194 158Q194 147 189 146ZM211 146Q236 141 259 144Q271 146 271 160Q271 184 252 194Q236 202 222 192Q207 181 206 158Q206 147 211 146Z";

const lunettesAviateur: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={VERRES_AVIATEUR} fill="#3B5143" fillOpacity="0.92" />
      {/* Le reflet : deux bandes en biais sur chaque verre. */}
      <path d="M152 150H166L154 182H142ZM171 150H177L165 182H159ZM226 150H240L228 182H216ZM245 150H251L239 182H233Z" fill={C.blanc} fillOpacity="0.24" />
      {/* Monture fine en or : les cercles, le double pont, les branches. */}
      <path d={VERRES_AVIATEUR} fill="none" stroke={METAL.or} strokeWidth="3.6" strokeLinejoin="round" />
      <path d="M178 143Q200 137 222 143M194 157Q200 152 206 157M130 152L108 146M270 152L292 146" fill="none" stroke={METAL.or} strokeWidth="3.6" strokeLinecap="round" />
    </g>
  ),
};

const jumellesOpera: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le manche de la lorgnette : nacre, viroles d'or, anneau au bout. */}
      <g transform="translate(262 184) rotate(-32)">
        <rect x="-2" y="6" width="9" height="84" rx="4.5" fill={NACRE_OMBRE} />
        <rect x="-4.5" y="4" width="9" height="84" rx="4.5" fill={NACRE} />
        <rect x="-5.5" y="10" width="11" height="7" rx="2" fill={METAL.or} />
        <rect x="-5.5" y="44" width="11" height="7" rx="2" fill={METAL.or} />
        <rect x="-5.5" y="78" width="11" height="7" rx="2" fill={METAL.or} />
        <circle cx="0" cy="97" r="7" fill="none" stroke={METAL.or} strokeWidth="4" />
      </g>
      {/* Le pont et la molette de mise au point. */}
      <rect x="179" y="151" width="42" height="6" rx="2" fill={METAL.or} />
      <rect x="189" y="186" width="22" height="6" rx="2" fill={METAL.or} />
      <rect x="193" y="154" width="14" height="34" rx="4" fill={METAL.laiton} />
      <path d="M197 159V183M200 159V183M203 159V183" fill="none" stroke={OR_SOMBRE} strokeWidth="1.5" />
      {/* Les deux fûts, braqués vers nous : nacre irisée, bague d'or, objectif. */}
      {[165, 235].map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <path d="M-16 152A16 6 0 0 1 16 152L27 190H-27Z" fill={NACRE_MI} />
          <path d="M-12 148L1 146L2 190H-19Z" fill={NACRE} />
          <path d="M7.5 146.7A16 6 0 0 1 16 152L27 190H15Z" fill={NACRE_OMBRE} />
          <path d="M-12 148L-6 146.9L-15 188Z" fill={C.rose} fillOpacity="0.6" />
          <path d="M3 156L10 190H0Z" fill={C.ciel} fillOpacity="0.75" />
          <path d="M-16 152A16 6 0 0 1 16 152L17.7 158H-17.7Z" fill={METAL.or} />
          <ellipse cx="0" cy="190" rx="27" ry="14.5" fill={METAL.or} />
          <ellipse cx="0" cy="190" rx="21.5" ry="10.5" fill={C.nuit} />
          <path d="M-11 183.5H-4L-8 196.5H-15ZM0 183.5H3L-1 196.5H-4Z" fill={C.ciel} fillOpacity="0.5" />
        </g>
      ))}
      <circle cx="262" cy="187" r="6" fill={METAL.or} />
    </g>
  ),
  thumb: "124 132 214 156",
};

/** Les deux verres de rubis, taillés à pans coupés, et leurs tables. */
const VERRES_RUBIS = "M148 142H182L193 153V177L182 188H148L137 177V153ZM218 142H252L263 153V177L252 188H218L207 177V153Z";

const lunettesRubis: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Les verres : deux rubis taillés. La table, au centre, laisse voir l'œil. */}
      <path d={VERRES_RUBIS} fill={C.cerise} fillOpacity="0.7" />
      <path d="M153 153H160L155 163H148ZM223 153H230L225 163H218Z" fill={C.blanc} fillOpacity="0.45" />
      <path d="M137 153L148 142L152 151L146 157ZM148 142H182L178 151H152ZM207 153L218 142L222 151L216 157ZM218 142H252L248 151H222Z" fill={C.ceriseClair} fillOpacity="0.9" />
      <path d="M137 153L146 157V173L137 177ZM182 142L193 153L184 157L178 151ZM207 153L216 157V173L207 177ZM252 142L263 153L254 157L248 151Z" fill={C.cerise} fillOpacity="0.9" />
      <path d="M137 177L146 173L152 179L148 188ZM193 153V177L184 173V157ZM207 177L216 173L222 179L218 188ZM263 153V177L254 173V157Z" fill={C.bordeaux} fillOpacity="0.85" />
      <path d="M148 188L152 179H178L182 188ZM182 188L178 179L184 173L193 177ZM218 188L222 179H248L252 188ZM252 188L248 179L254 173L263 177Z" fill={shade(C.bordeaux, -0.4)} fillOpacity="0.9" />
      {/* Monture d'or sertie de brillants. */}
      <path d="M193 158Q200 151 207 158M137 156L108 148M263 156L292 148" fill="none" stroke={METAL.or} strokeWidth="6.5" strokeLinecap="round" />
      <path d={VERRES_RUBIS} fill="none" stroke={METAL.or} strokeWidth="7.5" strokeLinejoin="round" />
      <path d={VERRES_RUBIS} stroke={C.blanc} strokeWidth="3.6" {...pastilles(9.9)} />
      {/* Deux éclats. */}
      <path d={ECLAT} transform="translate(141 146)" fill={C.blanc} />
      <path d={ECLAT} transform="translate(259 185) scale(0.6)" fill={C.blanc} />
    </g>
  ),
};

/** La visière d'un seul tenant, échancrée sur le nez. */
const VISIERE = "M118 150Q118 138 134 137Q200 131 266 137Q282 138 282 150V172Q282 194 258 196Q226 198 210 188Q200 182 190 188Q174 198 142 196Q118 194 118 172Z";

const visiereCosmonaute: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Les attaches, puis le cadre blanc et son ombre. */}
      <path d="M122 160L105 154M278 160L295 154" fill="none" stroke={C.grisClair} strokeWidth="18" />
      <path d={VISIERE} transform="translate(2 3)" fill="none" stroke={C.gris} strokeWidth="11" strokeLinejoin="round" />
      <path d={VISIERE} fill="none" stroke={C.blanc} strokeWidth="11" strokeLinejoin="round" />
      {/* Le miroir d'or. En haut, le ciel noir s'y reflète. */}
      <path d={VISIERE} fill={METAL.or} />
      <path d="M118 171V150Q118 138 134 137Q200 131 266 137Q282 138 282 150V168Q200 152 118 171Z" fill="#4A2C05" fillOpacity="0.55" />
      {/* Dans le reflet : trois étoiles, et la Terre qui se lève. */}
      <g fill={C.blanc}>
        <circle cx="150" cy="150" r="1.8" />
        <circle cx="181" cy="145" r="1.4" />
        <circle cx="266" cy="148" r="1.5" />
        <circle cx="205" cy="149" r="1.2" />
      </g>
      <circle cx="236" cy="156" r="11" fill={C.azur} />
      <path d="M229 151Q234 146 240 149Q238 154 232 155ZM238 158Q243 156 246 160Q242 164 238 162Z" fill={C.persClair} />
      <path d="M236 145A11 11 0 0 1 236 167A15 15 0 0 0 236 145Z" fill={C.marine} fillOpacity="0.6" />
      {/* Le sol, en bas, et la ligne d'horizon, courbée par la visière. */}
      <path d="M118 171Q200 152 282 168V172Q282 194 258 196Q226 198 210 188Q200 182 190 188Q174 198 142 196Q118 194 118 172Z" fill={METAL.or} />
      <path d="M118 171Q200 152 282 168L282 171Q200 155 118 174Z" fill={C.blanc} fillOpacity="0.7" />
      {/* Un reflet en biais, deux pivots. */}
      <path d="M134 141H148L139 164H126ZM153 141H158L149 164H144Z" fill={C.blanc} fillOpacity="0.3" />
      <circle cx="120" cy="164" r="7.5" fill={C.blanc} />
      <circle cx="280" cy="164" r="7.5" fill={C.blanc} />
      <circle cx="120" cy="164" r="3" fill={C.cerise} />
      <circle cx="280" cy="164" r="3" fill={C.cerise} />
    </g>
  ),
};

/** Les deux montures en étoile, une par œil. */
const VERRES_ETOILES = "M165 133L175 151.2L195.4 155.1L181.2 170.3L183.8 190.9L165 182L146.2 190.9L148.8 170.3L134.6 155.1L155 151.2ZM235 133L245 151.2L265.4 155.1L251.2 170.3L253.8 190.9L235 182L216.2 190.9L218.8 170.3L204.6 155.1L225 151.2Z";
const NUIT_BLEUE = "#182A66";

const lunettesEtoiles: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Les verres : un morceau de nuit. */}
      <path d={VERRES_ETOILES} fill={NUIT_BLEUE} />
      {/* La poussière d'étoiles, dans les verres et jusque dans l'air. */}
      <path d="M157 160h.01M172 157h.01M160 174h.01M174 171h.01M165 146h.01M149 161h.01M227 158h.01M243 162h.01M231 173h.01M245 175h.01M235 146h.01M252 160h.01" fill="none" stroke={C.blanc} strokeWidth="3" strokeLinecap="round" />
      <path d="M166 153h.01M154 167h.01M167 176h.01M180 162h.01M222 166h.01M239 153h.01M238 176h.01M223 157h.01M274 141h.01M283 133h.01M290 128h.01" fill="none" stroke={C.mimosa} strokeWidth="2.2" strokeLinecap="round" />
      <path d={ECLAT} transform="translate(166 165) scale(0.5)" fill={C.blanc} />
      <path d={ECLAT} transform="translate(236 166) scale(0.5)" fill={C.blanc} />
      {/* Monture d'or, un brillant à chaque pointe. */}
      <path d="M195.4 155.1H204.6M134.6 155.1L108 147M265.4 155.1L292 147" fill="none" stroke={METAL.or} strokeWidth="5.5" strokeLinecap="round" />
      <path d={VERRES_ETOILES} fill="none" stroke={METAL.or} strokeWidth="5.5" strokeLinejoin="round" />
      <path d="M165 133h.01M183.8 190.9h.01M146.2 190.9h.01M134.6 155.1h.01M235 133h.01M253.8 190.9h.01M216.2 190.9h.01M265.4 155.1h.01M200 155.1h.01" fill="none" stroke={C.blanc} strokeWidth="6" strokeLinecap="round" />
      <path d={ECLAT} transform="translate(268 132)" fill={C.blanc} />
    </g>
  ),
};

const monocleTelescope: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Chaînette d'or, de l'œilleton à la boutonnière. */}
      <path d="M230 180Q276 250 252 334" fill="none" stroke={METAL.or} strokeWidth="2.2" strokeDasharray="4 3" />
      <circle cx="252" cy="337" r="5" fill={METAL.or} />
      {/* La lunette, braquée de trois quarts : trois tubes de laiton, du plus fin au plus gros. */}
      <g transform="translate(235 165) rotate(22)">
        {/* L'œilleton, contre l'œil, et sa bague. */}
        <path d="M-5 -16H5V16H-5A6 16 0 0 1 -5 -16Z" fill={NOIR_DOUX} />
        <ellipse cx="5" cy="0" rx="5" ry="16" fill={METAL.or} />
        {/* Les trois tubes, chacun avec son flanc à l'ombre. */}
        <path d="M5 -12H32V12H5Z" fill={METAL.laiton} />
        <path d="M5 5H32V12H5Z" fill={C.noir} fillOpacity="0.22" />
        <path d="M30 -17H58V17H30A6 17 0 0 1 30 -17Z" fill={METAL.laiton} />
        <path d="M27.2 8H58V17H30A6 17 0 0 1 27.2 8Z" fill={C.noir} fillOpacity="0.22" />
        <path d="M56 -23H88V23H56A8 23 0 0 1 56 -23Z" fill={METAL.laiton} />
        <path d="M52.6 11H88V23H56A8 23 0 0 1 52.6 11Z" fill={C.noir} fillOpacity="0.22" />
        {/* Viroles d'or serties à chaque emboîtement, un filet de lumière sur chaque tube. */}
        <path d="M30 -17H37A6 17 0 0 0 37 17H30A6 17 0 0 1 30 -17ZM56 -23H64A8 23 0 0 0 64 23H56A8 23 0 0 1 56 -23Z" fill={METAL.or} />
        <path d="M29.85 -13.5A6 17 0 0 0 29.85 13.5" stroke={C.blanc} strokeWidth="2.6" {...pastilles(6.89)} />
        <path d="M55.5 -19A8 23 0 0 0 55.5 19" stroke={C.blanc} strokeWidth="2.8" {...pastilles(7.78)} />
        <path d="M10 -8H23V-5.5H10ZM39 -12H47V-9H39ZM67 -17H78V-13.5H67Z" fill={C.blanc} fillOpacity="0.55" />
        {/* L'objectif : cerclé d'or et de brillants, un ciel de nuit dans le verre. */}
        <ellipse cx="88" cy="0" rx="10.5" ry="24" fill={METAL.or} />
        <ellipse cx="88.5" cy="0" rx="7" ry="19" fill={C.nuit} />
        <ellipse cx="88.2" cy="0" rx="8.8" ry="21.6" stroke={C.blanc} strokeWidth="2.4" {...pastilles(7.127)} />
        <path d="M84.5 -9Q85 -14.5 88 -16Q87 -11 87.5 -5Z" fill={C.ciel} />
        <path d={ECLAT} transform="translate(90 5) scale(0.42)" fill={C.blanc} />
      </g>
    </g>
  ),
  thumb: "192 132 160 104",
};

/** Les articles dessinés, par identifiant du catalogue. Un article absent n'est simplement pas affiché. */
export const WARDROBE_2: Record<string, WardrobeArt> = {
  "chapeau-journal": chapeauJournal,
  panama,
  "casquette-capitaine": casquetteCapitaine,
  tiare,
  "casque-scaphandre": casqueScaphandre,
  aureole,
  "anneaux-saturne": anneauxSaturne,
  "lunettes-carton": lunettesCarton,
  "lunettes-aviateur": lunettesAviateur,
  "jumelles-opera": jumellesOpera,
  "lunettes-rubis": lunettesRubis,
  "visiere-cosmonaute": visiereCosmonaute,
  "lunettes-etoiles": lunettesEtoiles,
  "monocle-telescope": monocleTelescope,
};
