// Le dernier film de l'Agence Carpe Diem : « Des vacances pour toute la ville ». Tout
// Grattouille sur la même plage, de Piou à Madame Diem, autour de celui qui a tout payé.
//
// Une scène se dessine dans le <svg> du film (viewBox 0 0 360 800 ; voir ./kit.tsx pour le
// cadre, le style et le mouvement). Chaque élément est posé là où il sera sur la carte
// postale : sans animation, le dessin est l'image de la fin.

import { C, METAL, shade } from "../kit";
import { Diem } from "./diem";
import { Astre, Buste, Ciel, Medaillon, Mer, Mouette, a, nuage, relief, ronds, tf, type SceneArt } from "./kit";

/**
 * La photo de groupe : qui est où, à quelle taille, et son tour d'arriver. Trois rangs,
 * comme sur les marches d'une mairie ; le voyageur est au milieu du dernier.
 */
const VILLE: readonly (readonly [qui: string, x: number, y: number, k: number])[] = [
  ["gaspard", 30, 404, 0.44], ["ondine", 90, 400, 0.44], ["hector", 150, 396, 0.44], ["baron", 210, 396, 0.44],
  ["auguste", 270, 400, 0.44], ["balthazar", 330, 404, 0.44],
  ["taupin", 36, 470, 0.5], ["selene", 102, 466, 0.5], ["sidonie", 258, 466, 0.5], ["enzo", 324, 470, 0.5],
  ["piou", 36, 544, 0.56], ["colette", 106, 548, 0.56], ["archibald", 254, 548, 0.56], ["diem", 324, 544, 0.56],
];

/** Quand le premier arrive, et l'écart entre deux arrivées, en secondes. */
const PREMIER = 1.1;
const ECART = 0.3;
/** Quand toute la ville saute de joie. */
const HOURRA = PREMIER + VILLE.length * ECART + 0.5;

/** Un parasol ouvert, planté en (0, 0), haut de 230 : il s'ouvre à l'instant `d`. */
function Parasol({ couleur, d }: { couleur: string; d: number }) {
  return (
    <>
      <rect x="-3" y="-226" width="6" height="226" fill={C.boisFonce} />
      <g {...a("etire", { sx: 0.08, sy: 0.7, t: 0.5, d, e: "rebond", o: "50% 0%" })}>
        <path d="M-84 -150Q-78 -224 0 -230Q78 -224 84 -150Q70 -162 56 -150Q42 -162 28 -150Q14 -162 0 -150Q-14 -162 -28 -150Q-42 -162 -56 -150Q-70 -162 -84 -150Z" fill={couleur} />
        <path d="M0 -230Q-34 -212 -28 -150Q-42 -162 -56 -150Q-62 -208 0 -230ZM0 -230Q34 -212 28 -150Q42 -162 56 -150Q62 -208 0 -230Z" fill={C.ivoire} />
        <circle cx="0" cy="-232" r="5" fill={METAL.or} />
      </g>
    </>
  );
}

/** Les fanions de la fête : leur place sur la guirlande, et leur couleur. */
const FANIONS: readonly (readonly [number, number, string])[] = [
  [18, 262, C.cerise], [52, 274, C.mimosa], [88, 282, C.persClair], [124, 286, C.bougainvillier], [162, 288, C.ciel],
  [198, 288, C.cerise], [236, 286, C.mimosa], [272, 282, C.persClair], [308, 274, C.bougainvillier], [342, 262, C.ciel],
];

const touteLaVille: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="ville" couleurs={["#38B4E8", "#8EDCF0", "#FFF2C9"]} bas={410} />
    <Astre x={62} y={232} r={30} />
    <g transform={tf(210, 200)}><path d={nuage(120)} fill={C.blanc} {...a("flotte", { dx: 10, t: 6 })} /></g>
    <g transform="translate(300 330) scale(0.6)"><g {...a("va", { dx: 110, t: 9, e: "lin" })}><Mouette /></g></g>
    <g transform="translate(264 350) scale(0.5)"><g {...a("va", { dx: 120, t: 9, e: "lin" })}><Mouette /></g></g>
    <Mer y={398} bas={480} couleur="#2BB5C6" reflets="#8FE3E8" t={6} />
    {/* Le paquebot qui a amené tout le monde */}
    <g {...a("flotte", { dy: 1.5, t: 2.4 })}>
      <path d="M232 404H332L324 418H240Z" fill={C.nuit} />
      <path d="M244 404V394H318V404ZM256 394V386H306V394Z" fill={C.blanc} />
      <path d="M268 386V374H276V386ZM288 386V374H296V386Z" fill={C.mimosa} />
      <path d={ronds(1.6, [[252, 399], [262, 399], [272, 399], [282, 399], [292, 399], [302, 399], [312, 399]])} fill={C.azur} />
    </g>
    {/* La plage, en trois marches de sable */}
    <path d={relief([[-20, 428], [110, 418], [250, 430], [380, 420]])} fill={C.sable} />
    {/* Les parasols : aux couleurs des boutiques */}
    <g transform="translate(62 520)"><Parasol couleur={C.bougainvillier} d={0.4} /></g>
    <g transform="translate(180 506)"><Parasol couleur="#2C7DA0" d={0.6} /></g>
    <g transform="translate(298 520)"><Parasol couleur={C.persienne} d={0.8} /></g>
    {/* La guirlande de fanions tombe du ciel */}
    <g {...a("va", { dy: -260, t: 0.8, d: HOURRA - 0.3, e: "rebond" })}>
      <path d="M-20 240Q180 330 380 240" fill="none" stroke={C.nuit} strokeWidth="1.4" />
      {FANIONS.map(([x, y, couleur], i) => (
        <path key={x} d={`M${x - 9} ${y}h18l-9 20Z`} fill={couleur} {...a("flotte", { r: 8, t: 0.5 + (i % 3) * 0.1, d: -i * 0.13, o: "50% 0%" })} />
      ))}
    </g>
    {/* Toute la ville, rang par rang ; entre deux rangs, une marche de sable */}
    {VILLE.map(([qui, x, y, k], i) => (
      <g key={qui}>
        {i === 6 && <path d={relief([[-20, 446], [120, 436], [240, 448], [380, 438]])} fill={shade(C.sable, -0.06)} />}
        {i === 10 && <path d={relief([[-20, 516], [130, 506], [250, 518], [380, 508]])} fill={shade(C.sable, -0.12)} />}
        <g transform={`translate(${x - 60 * k} ${y - 60 * k}) scale(${k})`}>
          <g {...a("pop", { t: 0.4, d: PREMIER + i * ECART, o: "50% 100%" })}>
            <g {...a("saut", { dy: -26, t: 0.5, d: HOURRA + (i % 5) * 0.06, n: 3 })}>
              <Medaillon pnj={qui === "diem" ? undefined : qui}>{qui === "diem" ? <Diem /> : undefined}</Medaillon>
            </g>
          </g>
        </g>
      </g>
    ))}
    {/* Celui qui a tout payé, au milieu */}
    <g {...a("va", { dy: 60, o0: 0, t: 0.6, d: 0.5, e: "rebond" })}>
      <g {...a("saut", { dy: -10, t: 0.5, d: HOURRA, n: 3 })}>
        <g transform={tf(92, 430, 0.44)}><Buste espece={espece} look={look} /></g>
      </g>
    </g>
    {/* Le premier plan : le sable, les valises, le ballon */}
    <path d={relief([[-20, 606], [120, 594], [250, 608], [380, 596]])} fill={shade(C.sable, -0.18)} />
    <path d={relief([[-20, 700], [180, 688], [380, 704]])} fill={shade(C.sable, -0.26)} />
    <rect x="34" y="628" width="54" height="40" rx="5" fill={C.cerise} />
    <path d="M50 628V620Q50 614 61 614T72 620V628" fill="none" stroke={C.nuit} strokeWidth="3" />
    <path d="M34 644H88" fill="none" stroke={C.ivoire} strokeWidth="4" />
    <rect x="70" y="646" width="44" height="32" rx="5" fill={C.persienne} />
    <path d="M70 660H114" fill="none" stroke={C.mimosa} strokeWidth="4" />
    <circle cx="96" cy="668" r="6" fill={C.mimosa} />
    <g {...a("saut", { dy: -46, t: 0.9 })}>
      <circle cx="286" cy="650" r="24" fill={C.ivoire} />
      <path d="M286 626A24 24 0 0 1 310 650H286ZM286 674A24 24 0 0 1 262 650H286Z" fill={C.bougainvillier} />
      <path d="M286 626A24 24 0 0 0 262 650H286Z" fill={C.mimosa} />
      <circle cx="286" cy="650" r="5" fill={C.ivoire} />
    </g>
    <path d="M196 668L201 680L214 682L204 690L207 703L196 696L185 703L188 690L178 682L191 680Z" fill={C.corail} />
  </>
);

export const SCENES_VILLE: Record<string, SceneArt> = {
  "toute-la-ville": touteLaVille,
};
