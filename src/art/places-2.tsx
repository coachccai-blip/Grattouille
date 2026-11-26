// Les trois lieux d'après minuit : le Yacht, la Banque, la Lune.
//
// Même contrat que places.tsx (à lire d'abord) : façade du lieu, vue de face,
// viewBox 0 0 400 200, ciel transparent (l'écran peint derrière le dégradé du lieu),
// sol à partir de y = 170 environ. La façade se lit aussi en petit, grisée, quand le
// lieu est encore fermé.
//
// Identifiants attendus (shared/places.ts) : yacht, banque, lune.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Deux décimales au plus : des tracés courts, sans bruit d'arrondi. */
const n = (v: number) => +v.toFixed(2);

/** Une rangée de rectangles identiques (colonnes, chapiteaux, lettres gravées), d'un seul tracé. */
const rangee = (xs: number[], y: number, w: number, h: number) => xs.map((x) => `M${x} ${y}h${w}v${h}h${-w}Z`).join("");

/** Des petits ronds en un seul tracé : rivets, hublots. */
function ronds(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** Des ovales en un seul tracé : [cx, cy, rx, ry]. Les cratères, les hublots du croissant. */
const ovales = (points: [number, number, number, number][]) =>
  points.map(([cx, cy, rx, ry]) => `M${n(cx - rx)} ${cy}a${rx} ${ry} 0 1 0 ${n(2 * rx)} 0a${rx} ${ry} 0 1 0 ${n(-2 * rx)} 0Z`).join("");

/** Des étoiles à quatre branches en un seul tracé : [x, y, rayon]. */
function etoiles(points: [number, number, number][]): string {
  return points
    .map(([x, y, r]) => {
      const q = +(r * 0.26).toFixed(2);
      return `M${x} ${y - r}L${x + q} ${y - q}L${x + r} ${y}L${x + q} ${y + q}L${x} ${y + r}L${x - q} ${y + q}L${x - r} ${y}L${x - q} ${y - q}Z`;
    })
    .join("");
}

/** Le Yacht « Démesure » : deux heures du matin, trois ponts, une guirlande de la poupe à la proue. */
const yacht: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* Quelques étoiles */}
    <path d={etoiles([[44, 42, 4], [100, 20, 3], [20, 88, 2.5], [132, 60, 2.5], [248, 44, 3.5], [314, 72, 2.5], [372, 54, 3]])} fill={C.ecume} />
    {/* La mer, noire, et les reflets des hublots */}
    <rect x="0" y="166" width="400" height="34" fill={shade(C.marine, -0.38)} />
    <path d="M0 166H400V168.5H0ZM12 187H56V189H12ZM316 191H366V193H316ZM226 195H262V197H226Z" fill={shade(C.marine, 0.05)} />
    <path d="M48 173H112V175H48ZM136 173H238V175H136ZM262 173H334V175H262ZM84 180H152V182H84ZM182 180H284V182H182ZM126 187H208V189H126Z" fill={C.mimosa} fillOpacity="0.6" />
    {/* La coque, interminable : ligne de flottaison cerise, liston d'or */}
    <path d="M10 140H322Q368 140 398 130L372 166H24Q13 157 10 140Z" fill={C.blanc} />
    <path d="M14.6 153H381.4L372 166H24Q17.5 160.5 14.6 153Z" fill={shade(C.blanc, -0.14)} />
    <path d="M20.8 162H374.9L372 166H24Z" fill={C.cerise} />
    <path d="M10.6 143H388.6L387 145.2H11.2Z" fill={METAL.or} />
    {/* La rangée de hublots */}
    <path d="M28 147H374L370 153H29.5Z" fill={C.nuit} />
    <path d="M36 150H366" fill="none" stroke={C.mimosa} strokeWidth="4.2" strokeLinecap="round" strokeDasharray="0.1 11.9" />
    {/* La piscine du pont arrière : l'eau derrière sa paroi de verre, le plongeoir */}
    <path d="M30 130H62V140H30Z" fill={C.azur} />
    <path d="M30 130H62V133Q58 130.6 54 133T46 133T38 133T30 133Z" fill={C.ciel} />
    <path d="M50 126.4H70V128H50ZM66.5 128H68.5V140H66.5Z" fill={C.blanc} />
    {/* Les trois ponts, leurs casquettes, leurs baies éclairées */}
    <path d="M76 140V123H296L310 140ZM104 123V106H258L270 123ZM136 106V91H214L226 106Z" fill={C.ecume} />
    <path d="M70 120H300V123.5H70ZM98 103H262V106.5H98ZM130 88H218V91.5H130Z" fill={C.blanc} />
    <path d="M84 127.5H292L297 135.5H84ZM112 110.5H254L259 118.5H112ZM142 95H212L217 102H142Z" fill={C.nuit} />
    <path d="M88 131.5H287.5M116 114.5H247.5M146 98.5H209.5" fill="none" stroke={C.mimosa} strokeWidth="4.6" strokeDasharray="9 4.6" />
    {/* Le mât, les radômes, la flamme */}
    <path d="M158 88L163 78H195L200 88ZM176.5 78V46H179.5V78ZM169 60H187V62.5H169ZM17 140V131H19V140ZM393 131V114H395V131Z" fill={C.ecume} />
    <circle cx="167" cy="73" r="6" fill={C.blanc} />
    <circle cx="190" cy="74.5" r="3.6" fill={C.blanc} />
    <path d="M176.5 46L156 50.5L176.5 55Z" fill={C.cerise} />
    {/* L'hélicoptère sur sa plate-forme */}
    <path d="M322 137H368V140H322Z" fill={shade(C.blanc, -0.14)} />
    <path d="M340 127.5Q340 122 346 122H351Q357.5 122 357.5 128Q357.5 134.5 351 134.5H345Q340 134.5 340 127.5ZM340.5 126.5H324V128.6H340.5ZM323 123H325.6V131.5H323Z" fill={C.cerise} />
    <path d="M349.5 124H352Q355.2 124 355.6 128H349.5Z" fill={C.ciel} />
    <path d="M333 119.4H365V120.8H333ZM348.4 120.8H349.8V122H348.4ZM342 136H356V137H342ZM345 134.5H346.2V136H345ZM351.8 134.5H353V136H351.8Z" fill={C.ecume} />
    {/* La guirlande, de la poupe à la proue */}
    <path d="M18 132Q96 103 178 58Q285 104 394 116" fill="none" stroke={shade(C.marine, 0.35)} strokeWidth="1" />
    <path d="M18 132Q96 103 178 58Q285 104 394 116" fill="none" stroke={C.mimosa} strokeWidth="4.4" strokeLinecap="round" strokeDasharray="0.1 13.3" />
  </Svg>
);

/** Les rivets du cadre de la porte forte : seize, sur un cercle de rayon 41. */
const RIVETS: [number, number][] = Array.from({ length: 16 }, (_, i) => {
  const a = ((i + 0.5) * Math.PI) / 8;
  return [+(200 + 41 * Math.cos(a)).toFixed(1), +(118 + 41 * Math.sin(a)).toFixed(1)];
});

/** La Banque Coffre & Fils : avant l'aube, un temple de pierre dont la porte est celle d'un coffre, entrouverte sur l'or. */
const banque: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* Le parvis */}
    <rect x="0" y="170" width="400" height="30" fill={C.grisFonce} />
    <rect x="0" y="170" width="400" height="5" fill={shade(C.grisFonce, -0.3)} />
    {/* Le mur du fond, à l'ombre du péristyle */}
    <rect x="88" y="70" width="224" height="98" fill={C.ardoise} />
    <rect x="88" y="70" width="224" height="7" fill={shade(C.ardoise, -0.3)} />
    {/* Le fronton, sa pièce d'or, l'entablement */}
    <path d="M78 50L200 14L322 50Z" fill={C.craie} />
    <path d="M106 46L200 20L294 46Z" fill={shade(C.craie, -0.14)} />
    <circle cx="200" cy="36" r="7" fill={METAL.or} />
    <rect x="84" y="54" width="232" height="18" fill={C.craie} />
    <rect x="78" y="49" width="244" height="6" fill={shade(C.craie, 0.6)} />
    {/* Le nom gravé, en lettres de laiton : six barres, un losange, quatre barres */}
    <path d={rangee([150.5, 159, 167.5, 176, 184.5, 193], 60, 6, 6.5) + "M208.6 59.4L212.2 63.2L208.6 67L205 63.2Z" + rangee([218, 226.5, 235, 243.5], 60, 6, 6.5)} fill={METAL.laiton} />
    {/* Les marches */}
    <path d="M80 166H320V172H80ZM68 172H332V178H68ZM56 178H344V184H56Z" fill={C.craie} />
    <path d="M80 170.5H320V172H80ZM68 176.5H332V178H68ZM56 182.5H344V184H56Z" fill={shade(C.craie, -0.25)} />
    {/* Les quatre colonnes : leur flanc à l'ombre, sauf celui que dore la lumière du coffre */}
    <path d={rangee([96, 128, 256, 288], 76, 16, 86)} fill={C.craie} />
    <path d={rangee([107, 267, 299], 76, 5, 86)} fill={shade(C.craie, -0.16)} />
    <path d={rangee([139], 76, 5, 86)} fill={shade(C.mimosa, 0.45)} />
    <path d={rangee([93, 125, 253, 285], 72, 22, 6) + rangee([93, 125, 253, 285], 160, 22, 6)} fill={shade(C.craie, 0.6)} />
    {/* Le cadre riveté de la porte forte, et l'or qui s'en échappe jusqu'au parvis */}
    <circle cx="200" cy="118" r="45" fill={METAL.argent} />
    <path d={ronds(1.8, RIVETS)} fill={C.grisFonce} />
    <circle cx="200" cy="118" r="37" fill={C.mimosa} />
    <circle cx="189" cy="118" r="23" fill={shade(C.mimosa, 0.5)} />
    <path d="M172.3 153.5A45 45 0 0 0 201.6 163L219 200H104Z" fill={C.mimosa} fillOpacity="0.82" />
    {/* La porte entrouverte : sa tranche, ses pênes, sa face chromée, son volant */}
    <path d="M186.5 101H194V105.5H186.5ZM184 115.8H192V120.2H184ZM186.5 130.5H194V135H186.5ZM240 96H250V104H240ZM240 132H250V140H240Z" fill={C.grisFonce} />
    <ellipse cx="214" cy="118" rx="27" ry="38.5" fill={C.grisFonce} />
    <ellipse cx="219" cy="118" rx="26" ry="38.5" fill={METAL.chrome} />
    <ellipse cx="219" cy="118" rx="18.5" ry="28" fill="none" stroke={C.gris} strokeWidth="1.6" />
    <ellipse cx="219" cy="118" rx="9" ry="12.5" fill="none" stroke={METAL.laiton} strokeWidth="3" />
    <path d="M219 105.5V130.5M211 111.5L227 124.5M211 124.5L227 111.5" fill="none" stroke={METAL.laiton} strokeWidth="2.2" />
    <ellipse cx="219" cy="118" rx="3" ry="4" fill={METAL.or} />
    {/* Les deux lanternes de laiton, sur leurs socles */}
    <path d={rangee([36, 340], 150, 24, 34)} fill={C.craie} />
    <path d={rangee([53, 357], 150, 7, 34)} fill={shade(C.craie, -0.16)} />
    <path d={rangee([33, 337], 146, 30, 5)} fill={shade(C.craie, 0.6)} />
    <path d="M39.5 130L48 120.5L56.5 130ZM42.5 130H53.5L52.5 144H43.5ZM41 144H55V146.5H41Z" fill={METAL.laiton} />
    <path d="M343.5 130L352 120.5L360.5 130ZM346.5 130H357.5L356.5 144H347.5ZM345 144H359V146.5H345Z" fill={METAL.laiton} />
    <path d="M44.6 132H51.4L50.7 142.5H45.3ZM348.6 132H355.4L354.7 142.5H349.3Z" fill={C.mimosa} />
    <circle cx="48" cy="118.5" r="2.4" fill={METAL.or} />
    <circle cx="352" cy="118.5" r="2.4" fill={METAL.or} />
  </Svg>
);

/**
 * Le croissant : la partie d'un disque (200, 112, r 48) que n'entame pas un second
 * disque (215.6, 103, r 40). Il s'ouvre vers le haut à droite, comme la lune du Cercle.
 */
const CROISSANT = "M205.4 64.3A48 48 0 1 0 244 131.1A40 40 0 1 1 205.4 64.3Z";

/** Les hublots du croissant, de la corne du haut jusqu'au ventre : [x, y, rayon]. Ils suivent sa ligne médiane. */
const HUBLOTS: [number, number, number][] = [
  [184.6, 71.3, 1.8], [172.6, 82.5, 3], [165.5, 97.3, 3.8], [164.4, 113.8, 4.4], [169.7, 129.5, 4.6], [180.6, 142, 4.4],
];

/** Le Croissant de Lune : au lever de Terre, un club en croissant d'or sous sa cloche de verre, tapis rouge sur la poussière. */
const lune: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* Les étoiles */}
    <path d={etoiles([[24, 58, 3], [76, 28, 3.5], [112, 84, 2.5], [146, 36, 4], [254, 40, 3], [302, 68, 2.5], [338, 40, 4], [378, 92, 3], [292, 112, 2.5]])} fill={C.mimosa} />
    {/* La Terre qui se lève */}
    <circle cx="62" cy="150" r="46" fill={C.azur} />
    <path d="M36 122Q50 110 68 116Q78 128 66 140Q48 144 36 136ZM74 150Q92 142 106 152L104 168H78Q72 160 74 150Z" fill={C.persClair} />
    <path d="M22 146Q40 140 60 145Q42 152 22 146ZM60 112Q76 106 92 112Q76 118 60 112Z" fill={C.blanc} />
    <path d="M94.5 117.5A46 46 0 0 1 29.5 182.5A63.7 63.7 0 0 0 94.5 117.5Z" fill={C.nuit} fillOpacity="0.4" />
    {/* Les reliefs, le sol lunaire, les cratères */}
    <path d="M262 170Q290 152 320 160Q350 146 400 158V172H262Z" fill={shade(C.lilas, -0.3)} />
    <path d="M0 200V168Q200 158 400 168V200Z" fill={C.grisClair} />
    <path d="M0 168Q200 158 400 168V173Q200 163 0 173Z" fill={shade(C.grisClair, -0.15)} />
    <path d={ovales([[110, 188.5, 22, 5], [306, 186.5, 26, 5.5], [362, 194.5, 12, 3], [36, 193.5, 14, 3.5]])} fill={shade(C.grisClair, 0.55)} />
    <path d={ovales([[110, 186.5, 22, 5], [306, 184.5, 26, 5.5], [362, 193, 12, 3], [36, 192, 14, 3.5]])} fill={shade(C.lilas, -0.3)} />
    {/* La fusée des habitués */}
    <path d="M331 150L323 167H331ZM349 150L357 167H349ZM336 160H344V166H336Z" fill={C.cerise} />
    <path d="M331 160V138Q331 122 340 112Q349 122 349 138V160Z" fill={C.ecume} />
    <path d="M334.2 126Q336.5 117 340 112Q343.5 117 345.8 126Z" fill={C.cerise} />
    <circle cx="340" cy="139" r="4" fill={C.azur} />
    {/* La cloche de verre et le club : un croissant d'or, ses hublots éclairés */}
    <path d="M132 164V118A68 68 0 0 1 268 118V164Z" fill={C.lilas} fillOpacity="0.34" />
    <path d={CROISSANT} fill={METAL.or} />
    <path d={ovales(HUBLOTS.map(([x, y, r]) => [x, y, r, r]))} fill={C.nuit} />
    <path d={ovales(HUBLOTS.filter(([, , r]) => r > 2).map(([x, y, r]) => [x, y, n(r - 1.7), n(r - 1.7)]))} fill={C.ivoire} />
    <path d="M142 91A64 64 0 0 1 173 60L175.5 65.4A58 58 0 0 0 147.4 93.5Z" fill={C.blanc} fillOpacity="0.4" />
    <path d="M132 164V118A68 68 0 0 1 268 118V164" fill="none" stroke={C.ecume} strokeWidth="3" />
    <rect x="124" y="160" width="152" height="8" rx="3" fill={C.ecume} />
    <rect x="124" y="164.5" width="152" height="3.5" rx="1.7" fill={shade(C.ecume, -0.2)} />
    {/* Le sas d'entrée et le tapis rouge */}
    <path d="M184 168V154Q184 141 200 141Q216 141 216 154V168Z" fill={C.ivoire} />
    <path d="M191 168V155A9 9 0 0 1 209 155V168Z" fill={C.nuit} />
    <path d="M194 168V155.5A6 6 0 0 1 206 155.5V168Z" fill={C.mimosa} />
    <path d="M191 167H209L232 200H168Z" fill={C.cerise} />
    {/* Le fanion, tout en haut de la cloche */}
    <rect x="199" y="24" width="2" height="27" fill={C.ecume} />
    <path d="M201 25L222 31L201 37Z" fill={C.mimosa} />
    <circle cx="200" cy="50" r="3.4" fill={METAL.or} />
  </Svg>
);

export const PLACE_ART_2: Record<string, Art> = {
  yacht,
  banque,
  lune,
};
