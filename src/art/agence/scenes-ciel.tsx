// Les films de l'Agence Carpe Diem, chapitre « Plus haut que le ciel » : la sieste en
// apesanteur, la semaine en orbite, le feu d'artifice visible de l'espace, le tour de la
// Lune, le petit pas, la soirée sur la Lune, le pique-nique sur Mars, le surf sur les
// anneaux de Saturne et la balade à dos de comète.
//
// Une scène se dessine dans le <svg> du film (viewBox 0 0 360 800 ; voir ./kit.tsx pour le
// cadre, le style et le mouvement). Chaque élément est posé là où il sera sur la carte
// postale : sans animation, le dessin est l'image de la fin.

import type { ReactNode } from "react";
import { C, METAL, shade } from "../kit";
import {
  Astre, Astronaute, Ciel, Etoiles, Fenetre, Fusee, Medaillon, Perso, SolLunaire, Terre, Tete, a, etoiles, relief, ronds, tf,
  type SceneArt,
} from "./kit";

/** Le noir de l'espace, du plus profond au moins profond. */
const ESPACE: readonly string[] = ["#050818", "#0D1540", "#1A2867"];

/** Les étoiles du fond, les mêmes d'une scène à l'autre : on est toujours sous le même ciel. */
const FIRMAMENT: readonly (readonly [number, number])[] = [
  [22, 120], [64, 196], [110, 132], [152, 240], [200, 118], [246, 206], [296, 140], [338, 232], [36, 300], [320, 330],
  [84, 372], [270, 392], [176, 322], [18, 430], [344, 452],
];

// ---------------------------------------------------------------------------
// Une sieste en apesanteur : le voyant passe au vert, et tout ce qui n'est pas attaché
// décolle. L'oreiller, la peluche, les pantoufles, et le dormeur.

const CAPITON = "#E6ECF3";

/** Un objet qui quitte le plancher et se met à dériver. */
function Flottant({ x, y, r = 0, chute, d, t = 3, children }: { x: number; y: number; r?: number; chute: number; d: number; t?: number; children: ReactNode }) {
  return (
    <g {...a("va", { dy: chute, r: -r, t: 2.6, d, e: "cubic-bezier(.3,0,.3,1)" })}>
      <g transform={`translate(${x} ${y}) rotate(${r})`}>
        <g {...a("flotte", { dy: 6, r: 5, t, d: -d })}>{children}</g>
      </g>
    </g>
  );
}

const apesanteur: SceneArt = ({ espece, look }) => {
  let capitons = "";
  for (let i = -8; i < 12; i++) capitons += `M${i * 60} 150l520 520M${i * 60 + 520} 150l-520 520`;
  return (
    <>
      <rect x="-20" y="-20" width="400" height="840" fill={CAPITON} />
      <path d={capitons} fill="none" stroke="#CAD5E1" strokeWidth="3" />
      <rect x="-20" y="-20" width="400" height="190" fill="#B8C6D6" />
      <rect x="-20" y="160" width="400" height="10" fill="#93A5BA" />
      <rect x="-20" y="650" width="400" height="170" fill="#8FA3BA" />
      <rect x="-20" y="650" width="400" height="8" fill="#6F859E" />
      {/* Les hublots : le ciel, tout en haut, et le bord de la Terre */}
      {[66, 180, 294].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="260" r="39" fill="#6F859E" />
          <circle cx={x} cy="260" r="32" fill="#0D1540" />
          <Fenetre x={x - 32} y={228} l={64} h={64} rx={32}>
            <circle cx={x} cy="360" r="86" fill={C.azur} />
            <path d={`M${x - 60} 286h40M${x} 292h46`} fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="5" strokeLinecap="round" {...a("flotte", { dx: 8, t: 3 + i })} />
            <path d={ronds(1.2, [[x - 14, 240], [x + 12, 248], [x + 2, 236]])} fill={C.blanc} />
          </Fenetre>
        </g>
      ))}
      {/* La main courante, le voyant : rouge, puis vert */}
      <path d="M-20 470H380" fill="none" stroke={C.mimosa} strokeWidth="7" />
      <path d="M40 470V486M180 470V486M320 470V486" fill="none" stroke={C.mimosaFonce} strokeWidth="5" />
      <rect x="150" y="186" width="60" height="26" rx="13" fill="#3A4658" />
      <circle cx="166" cy="199" r="8" fill={C.cerise} />
      <circle cx="194" cy="199" r="8" fill="#55667C" />
      <g {...a("apparait", { t: 0.2, d: 1.4 })}>
        <circle cx="166" cy="199" r="8" fill="#55667C" />
        <circle cx="194" cy="199" r="8" fill={C.persClair} />
        <circle cx="194" cy="199" r="14" fill={C.persClair} fillOpacity="0.35" {...a("pulse", { s0: 0.8, s: 1.3, t: 0.7 })} />
      </g>
      {/* Tout ce qui n'était pas attaché */}
      <Flottant x={76} y={548} r={-24} chute={96} d={1.9}>
        <ellipse cx="0" cy="0" rx="22" ry="26" fill={C.bois} />
        <circle cx="0" cy="-32" r="17" fill={C.bois} />
        <path d={ronds(7, [[-14, -45], [14, -45]])} fill={C.bois} />
        <ellipse cx="0" cy="-27" rx="8" ry="6" fill={C.creme} />
        <path d={ronds(1.8, [[-6, -36], [6, -36]])} fill={C.nuit} />
        <ellipse cx="0" cy="2" rx="12" ry="15" fill={C.creme} />
        <path d="M-24 -10L-36 -22M24 -10L36 -22M-12 22L-18 38M12 22L18 38" fill="none" stroke={C.bois} strokeWidth="11" strokeLinecap="round" />
      </Flottant>
      <Flottant x={294} y={420} r={38} chute={236} d={1.6} t={3.6}>
        <path d="M-24 6Q-24 -10 -6 -10H14Q26 -10 26 2V10H-24Z" fill={C.cerise} />
        <path d="M-24 6H26V12H-24Z" fill={C.creme} />
        <circle cx="-8" cy="-12" r="6" fill={C.ivoire} />
      </Flottant>
      <Flottant x={300} y={580} r={-52} chute={76} d={2.2} t={2.6}>
        <path d="M-24 6Q-24 -10 -6 -10H14Q26 -10 26 2V10H-24Z" fill={C.cerise} />
        <path d="M-24 6H26V12H-24Z" fill={C.creme} />
        <circle cx="-8" cy="-12" r="6" fill={C.ivoire} />
      </Flottant>
      <Flottant x={52} y={380} r={18} chute={266} d={2.4} t={3.3}>
        <path d="M-16 -16H16V10Q16 18 8 18H-8Q-16 18 -16 10Z" fill={C.ivoire} />
        <path d="M16 -8Q28 -8 28 2Q28 12 16 12" fill="none" stroke={C.ivoire} strokeWidth="5" />
        <path d="M-16 -16H16V-10H-16Z" fill={C.boisFonce} />
        <path d={ronds(5, [[6, -30]]) + ronds(3.5, [[-8, -40]]) + ronds(2.5, [[14, -46]])} fill={C.boisFonce} />
      </Flottant>
      {/* Le dormeur, masque sur les yeux, et son oreiller qui le suit */}
      <g {...a("va", { dy: 164, r: 26, t: 2.8, d: 1.4, e: "cubic-bezier(.3,0,.3,1)", o: [186, 400] })}>
        <g {...a("flotte", { dy: 7, r: 2.5, t: 3.2, o: [186, 400] })}>
          <g transform="translate(120 280) rotate(-26 66 120)">
            <g transform="translate(-34 -36) rotate(-10)">
              <rect x="0" y="0" width="112" height="70" rx="26" fill={C.blanc} />
              <path d="M86 0Q112 0 112 26V44Q112 70 86 70Q100 52 100 35Q100 18 86 0Z" fill="#CAD5E1" />
            </g>
            <g transform="scale(0.34)">
              <Perso espece={espece} look={look} bras={[30, 58]} jambes={[14, 22]} />
              <path d="M96 150Q200 124 304 150L298 194Q200 212 102 194Z" fill={C.bougainvillier} />
              <path d="M96 150L84 168M304 150L316 168" fill="none" stroke={C.bougFonce} strokeWidth="9" strokeLinecap="round" />
              <path d="M140 168Q164 184 188 168M212 168Q236 184 260 168" fill="none" stroke={C.ivoire} strokeWidth="8" strokeLinecap="round" />
            </g>
          </g>
          {/* Zzz */}
          <g fill="none" stroke={C.marine} strokeLinecap="round" strokeLinejoin="round">
            <path d="M232 262h16l-16 18h16" strokeWidth="5" {...a("clignote", { t: 1.2, o0: 0.15 })} />
            <path d="M256 228h20l-20 23h20" strokeWidth="6" {...a("clignote", { t: 1.2, d: -0.4, o0: 0.15 })} />
            <path d="M286 188h26l-26 30h26" strokeWidth="7" {...a("clignote", { t: 1.2, d: -0.8, o0: 0.15 })} />
          </g>
        </g>
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------
// Une semaine en orbite : seize levers de soleil par jour. La station dérive au-dessus de
// la Terre, le linge sèche dehors, et le soleil se lève, se lève, se lève.

/** Le centre de la Terre, bien en dessous du cadre : on n'en voit que le dos. */
const TX = 180;
const TY = 1210;
const TR = 640;

const orbite: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="orbite" couleurs={ESPACE} />
    <Etoiles points={FIRMAMENT} brillantes={[[70, 250, 7], [300, 236, 8], [220, 470, 6]]} />
    {/* Le soleil se couche derrière la Terre, et se relève. Et recommence : seize fois par jour. */}
    <g {...a("saut", { dy: 96, t: 2.3, d: 0.4, n: 3 })}>
      <Astre x={292} y={528} r={25} couleur="#FFF2B8" halo="#FFD873" />
    </g>
    {/* La Terre tourne */}
    <circle cx={TX} cy={TY} r={TR + 10} fill="#7FD0F0" fillOpacity="0.35" />
    <circle cx={TX} cy={TY} r={TR} fill={C.azur} />
    <g {...a("va", { r: 24, t: 9, e: "lin", o: [TX, TY] })}>
      <g fill={C.vert}>
        <path d="M40 620Q90 590 150 600Q190 620 170 660Q110 690 60 670Q30 650 40 620Z" />
        <path d="M230 596Q290 580 330 610Q340 650 300 664Q250 660 232 630Z" />
        <path d="M-120 700Q-60 660 -10 690Q0 730 -50 750Q-110 740 -120 700Z" />
        <path d="M400 640Q460 630 500 670Q480 710 430 706Q396 680 400 640Z" />
      </g>
      <path d="M70 700H170M250 690H330M-60 660H20" fill="none" stroke={C.blanc} strokeOpacity="0.75" strokeWidth="9" strokeLinecap="round" />
    </g>
    {/* La station */}
    <g {...a("va", { dx: -300, dy: 40, t: 2.6, e: "sortie" })}>
      <g transform="translate(180 372)">
        <g {...a("flotte", { dy: 5, r: 1.6, t: 3 })}>
          {/* Les panneaux solaires */}
          <path d="M-56 -4H-150M56 -4H150" fill="none" stroke={C.gris} strokeWidth="5" />
          {[-150, -106, 106, 150].map((x) => (
            <g key={x}>
              <rect x={x - 18} y="-58" width="36" height="108" rx="3" fill={C.marine} />
              <path d={`M${x} -58V50M${x - 18} -31H${x + 18}M${x - 18} -4H${x + 18}M${x - 18} 23H${x + 18}`} fill="none" stroke={C.ciel} strokeWidth="2" />
            </g>
          ))}
          {/* La corde à linge, entre deux panneaux : une semaine, ça se lave */}
          <path d="M-88 -52Q-66 -40 -44 -46" fill="none" stroke={C.ivoire} strokeWidth="1.5" />
          <g {...a("flotte", { r: 8, t: 1.5, o: "50% 0%" })}>
            <path d="M-80 -50l8 0l2 20l8 2l-2 6l-14 -3Z" fill={C.cerise} />
            <path d="M-62 -46h12v22h-12Z" fill={C.mimosa} />
          </g>
          {/* Les modules */}
          <rect x="-56" y="-22" width="112" height="44" rx="20" fill={C.blanc} />
          <path d="M20 -22H36Q56 -22 56 -2V2Q56 22 36 22H20Z" fill={C.grisClair} />
          <rect x="-16" y="-58" width="32" height="40" rx="8" fill={C.blanc} />
          <rect x="-16" y="18" width="32" height="34" rx="8" fill={C.grisClair} />
          <path d="M-56 -8H56" fill="none" stroke={C.bougainvillier} strokeWidth="3" />
          <path d="M0 -58V-78M-10 -78H10" fill="none" stroke={C.gris} strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="-82" r="4" fill={C.cerise} {...a("clignote", { t: 0.6, o0: 0.15 })} />
          {/* La coupole, et le voyageur à sa fenêtre */}
          <circle cx="0" cy="0" r="27" fill={C.grisFonce} />
          <circle cx="0" cy="0" r="22" fill="#BEE7F5" />
          <Fenetre x={-22} y={-22} l={44} h={44} rx={22}>
            <g transform={tf(-29.4, -34, 0.21)}><Tete espece={espece} look={look} /></g>
          </Fenetre>
          <path d="M-14 -12A20 20 0 0 1 -2 -18" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round" />
          <path d={ronds(4, [[-40, 8], [40, 8]])} fill={C.azur} />
        </g>
      </g>
    </g>
    {/* Une brosse à dents s'est échappée */}
    <g {...a("passe", { dx: 380, dy: 0, fx: -80, fy: -90, r: -300, t: 6, d: 1.5 })}>
      <rect x="0" y="560" width="26" height="5" rx="2.5" fill={C.persClair} />
      <rect x="20" y="555" width="8" height="6" rx="1" fill={C.blanc} />
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Un feu d'artifice visible depuis l'espace : les fusées partent du côté nuit de la Terre,
// et le bouquet final fait la taille d'un continent. Même la Lune fait « oh ».

/** Une gerbe : `n` traits qui rayonnent, du tiers du rayon jusqu'au bout, et une perle à chaque pointe. Centrée en (0, 0). */
function gerbe(r: number, n: number): { traits: string; perles: string } {
  let traits = "";
  const pointes: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    traits += `M${+(cos * r * 0.3).toFixed(1)} ${+(sin * r * 0.3).toFixed(1)}L${+(cos * r * 0.86).toFixed(1)} ${+(sin * r * 0.86).toFixed(1)}`;
    pointes.push([+(cos * r).toFixed(1), +(sin * r).toFixed(1)]);
  }
  return { traits, perles: ronds(Math.max(2, r * 0.045), pointes) };
}

/** Une gerbe de feu d'artifice, posée en (x, y). */
function Gerbe({ x, y, r, n = 12, couleur }: { x: number; y: number; r: number; n?: number; couleur: string }) {
  const { traits, perles } = gerbe(r, n);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={traits} fill="none" stroke={couleur} strokeWidth={Math.max(2, r * 0.04)} strokeLinecap="round" />
      <path d={perles} fill={couleur} />
      <circle r={r * 0.12} fill={C.blanc} />
    </g>
  );
}

/** Les fusées d'avant le bouquet : où elles éclatent, leur taille, leur couleur, et quand. */
const SALVES: readonly (readonly [x: number, y: number, r: number, couleur: string, d: number])[] = [
  [96, 380, 70, C.mimosa, 1.3], [262, 340, 78, C.bougClair, 2.1], [170, 290, 66, C.persClair, 2.9], [292, 440, 60, C.ciel, 3.7],
  [72, 300, 58, C.bougClair, 4.3],
];

const feuArtifice: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="feu" couleurs={ESPACE} />
    <Etoiles points={FIRMAMENT} brillantes={[[326, 196, 7], [150, 186, 6]]} />
    {/* La Lune regarde. Au bouquet, elle fait « oh ». */}
    <circle cx="64" cy="178" r="40" fill={C.ivoire} />
    <path d="M64 138A40 40 0 0 1 64 218Q86 198 86 178Q86 158 64 138Z" fill={C.pierre} />
    <path d={ronds(6, [[44, 200]]) + ronds(4, [[84, 160], [30, 176]])} fill={C.pierre} />
    <path d={ronds(3.2, [[52, 170], [74, 170]])} fill={C.nuit} />
    <path d="M45 160Q52 154 59 158M69 158Q76 154 83 160" fill="none" stroke={C.nuit} strokeWidth="2.4" strokeLinecap="round" {...a("va", { dy: 5, t: 0.3, d: 5.2 })} />
    <ellipse cx="63" cy="188" rx="5" ry="6.5" fill={C.nuit} {...a("pop", { t: 0.35, d: 5.2 })} />
    {/* La Terre, côté nuit : ses villes allumées */}
    <circle cx="180" cy="1100" r="566" fill="#7FD0F0" fillOpacity="0.25" />
    <circle cx="180" cy="1100" r="556" fill="#14306B" />
    <path d="M30 600Q90 570 150 584Q190 606 170 640Q100 664 50 648Q22 628 30 600ZM220 580Q280 566 324 596Q332 632 292 644Q244 640 224 612Z" fill="#1C4A5E" />
    <path d={ronds(1.8, [[60, 610], [78, 622], [96, 604], [120, 618], [140, 632], [108, 640], [70, 636], [246, 596], [262, 610], [284, 600], [300, 620], [270, 628], [200, 660], [330, 660], [20, 680]])} fill={C.mimosa} {...a("clignote", { t: 1.3, o0: 0.55 })} />
    {/* Les fusées montent, une à une, et éclatent */}
    {SALVES.map(([x, y, r, couleur, d]) => (
      <g key={d}>
        <g {...a("apparait", { t: 0.05, d: d - 0.5 })}>
          <g {...a("disparait", { t: 0.1, d })}>
            <rect x={x - 1.5} y={y} width="3" height="34" rx="1.5" fill={C.ivoire} {...a("passe", { dy: 590 - y, fy: 0, t: 0.5, d: d - 0.5, e: "sortie" })} />
          </g>
        </g>
        <g {...a("eclat", { t: 1.6, d, e: "sortie", o: [x, y] })}><Gerbe x={x} y={y} r={r} couleur={couleur} /></g>
      </g>
    ))}
    {/* Le bouquet final : il reste dans le ciel le temps de la photo */}
    <g {...a("pop", { t: 0.7, d: 5.1, o: [180, 380] })}>
      <Gerbe x={180} y={380} r={150} n={18} couleur={C.mimosa} />
      <Gerbe x={180} y={380} r={96} n={14} couleur={C.bougClair} />
    </g>
    <g {...a("pop", { t: 0.6, d: 5.5, o: [84, 316] })}><Gerbe x={84} y={316} r={62} couleur={C.persClair} /></g>
    <g {...a("pop", { t: 0.6, d: 5.8, o: [286, 300] })}><Gerbe x={286} y={300} r={56} couleur={C.ciel} /></g>
    <path d={etoiles([[40, 430, 9], [322, 460, 10], [250, 220, 8], [120, 230, 7]])} fill={C.ivoire} {...a("pop", { t: 0.5, d: 6.2 })} />
    {/* Le voyageur, aux premières loges */}
    <g {...a("va", { dx: 140, dy: 60, t: 2.4, e: "sortie" })}>
      <g {...a("flotte", { dy: 6, r: 4, t: 2.4 })}>
        <g transform={tf(226, 470, 0.24)}>
          <Astronaute espece={espece} look={look} bras={[150, 150]} jambes={[24, 30]} />
        </g>
      </g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Le tour de la Lune : on la survole de près, on passe du côté de sa face cachée (elle
// rougit), et la Terre se lève sur l'horizon.

/** Le centre de la Lune, sous le cadre : on la survole. */
const LX = 180;
const LY = 1010;
const LR = 480;
const GRIS_LUNE = "#C7CCD6";

/** Un cratère posé sur le bord de la Lune, à l'angle `angle` (0 : en haut). */
function Cratere({ angle, l }: { angle: number; l: number }) {
  return (
    <g transform={`rotate(${angle} ${LX} ${LY}) translate(${LX} ${LY - LR + 30 + l * 0.2})`}>
      <ellipse rx={l} ry={l * 0.3} fill={shade(GRIS_LUNE, -0.2)} />
      <ellipse cy={l * 0.07} rx={l * 0.8} ry={l * 0.2} fill={shade(GRIS_LUNE, -0.34)} />
    </g>
  );
}

const tourDeLune: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="tour-de-lune" couleurs={ESPACE} />
    <Etoiles points={FIRMAMENT} brillantes={[[60, 210, 7], [150, 150, 6], [330, 250, 6]]} />
    {/* La Terre se lève */}
    <g {...a("va", { dy: 210, t: 3, d: 4.4, e: "sortie" })}>
      <g transform="translate(276 356)"><Terre r={50} /></g>
    </g>
    {/* La Lune défile sous la fusée. Du côté caché, elle est timide : elle rougit. */}
    <circle cx={LX} cy={LY} r={LR} fill={GRIS_LUNE} />
    <g {...a("va", { r: 92, t: 8, e: "lin", o: [LX, LY] })}>
      <Cratere angle={-18} l={40} />
      <Cratere angle={-8} l={22} />
      <Cratere angle={6} l={34} />
      <Cratere angle={17} l={18} />
      <Cratere angle={-96} l={30} />
      <Cratere angle={-108} l={44} />
      <Cratere angle={-84} l={20} />
      <Cratere angle={-38} l={16} />
      {/* Sa face cachée : deux yeux fermés, deux joues roses */}
      <g transform={`rotate(-58 ${LX} ${LY})`}>
        <path d={`M${LX - 60} ${LY - LR + 60}q16 14 32 0M${LX + 28} ${LY - LR + 60}q16 14 32 0`} fill="none" stroke={shade(GRIS_LUNE, -0.5)} strokeWidth="6" strokeLinecap="round" />
        <ellipse cx={LX - 76} cy={LY - LR + 92} rx="22" ry="11" fill={C.bougClair} {...a("clignote", { t: 0.8, o0: 0.5 })} />
        <ellipse cx={LX + 76} cy={LY - LR + 92} rx="22" ry="11" fill={C.bougClair} {...a("clignote", { t: 0.8, o0: 0.5 })} />
      </g>
    </g>
    <path d={`M${LX - 300} ${LY - 380}A${LR} ${LR} 0 0 1 ${LX + 300} ${LY - 380}`} fill="none" stroke={C.blanc} strokeOpacity="0.5" strokeWidth="4" />
    {/* La fusée, et le voyageur à son hublot */}
    <g {...a("va", { dx: -300, dy: 30, t: 2, e: "sortie" })}>
      <g transform="translate(150 430)">
        <g {...a("flotte", { dy: 6, r: 2, t: 1.9 })}>
          <g transform="rotate(78) scale(1.15)">
            <Fusee />
            <Fenetre x={-17} y={-35} l={34} h={34} rx={17}>
              <g transform={`rotate(-78 0 -18) ${tf(-22.4, -44, 0.16)}`}><Tete espece={espece} look={look} /></g>
            </Fenetre>
          </g>
        </g>
      </g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Un petit pas sur la Lune : on descend l'échelle, on fait trois bonds très lents, et l'on
// plante un drapeau qui ne flottera jamais.

/** Les empreintes, du module jusqu'au drapeau : [x, y, quand]. */
const EMPREINTES: readonly (readonly [number, number, number])[] = [
  [262, 624, 2.9], [236, 640, 3.6], [206, 622, 4.5], [176, 640, 5.2], [150, 624, 6],
];

const pasSurLaLune: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="pas" couleurs={ESPACE} />
    <Etoiles points={FIRMAMENT} brillantes={[[200, 160, 7], [320, 260, 6], [130, 300, 6]]} />
    <g transform="translate(74 276)"><Terre r={42} /></g>
    <path d={relief([[-20, 520], [60, 486], [130, 514], [210, 480], [290, 508], [380, 478]], 560)} fill={shade("#C7CCD6", -0.24)} />
    <SolLunaire y={530} />
    {/* Le module : sa cabine d'or, ses pattes, son échelle */}
    <path d="M250 560L232 612M330 560L348 612M290 560V610" fill="none" stroke={C.gris} strokeWidth="5" strokeLinecap="round" />
    <path d="M222 612H244M338 612H360M280 610H300" fill="none" stroke={C.grisFonce} strokeWidth="6" strokeLinecap="round" />
    <path d="M246 520H334L344 560H236Z" fill={METAL.or} />
    <path d="M258 456H322L334 520H246Z" fill={C.grisClair} />
    <path d="M300 456H322L334 520H306Z" fill={C.gris} />
    <rect x="272" y="472" width="30" height="34" rx="6" fill={C.nuit} />
    <path d="M290 456V430M278 430H302" fill="none" stroke={C.gris} strokeWidth="3" strokeLinecap="round" />
    <circle cx="290" cy="424" r="9" fill="none" stroke={C.gris} strokeWidth="3" />
    <path d="M250 560V618M266 560V618M250 574H266M250 588H266M250 602H266" fill="none" stroke={C.grisFonce} strokeWidth="2.6" />
    {/* Les empreintes : elles y sont pour un million d'années */}
    {EMPREINTES.map(([x, y, d], i) => (
      <g key={x} transform={`translate(${x} ${y}) rotate(${i % 2 ? -14 : 12})`} fill={shade("#C7CCD6", -0.38)}>
        <g {...a("apparait", { t: 0.2, d })}>
          <rect x="-8" y="-10" width="16" height="14" rx="6" />
          <rect x="-7" y="6" width="14" height="7" rx="3.5" />
        </g>
      </g>
    ))}
    {/* Le voyageur : il descend, puis il bondit, lentement */}
    <g {...a("va", { dx: 124, dy: -44, t: 4.6, d: 1.5, e: "cubic-bezier(.2,0,.4,1)" })}>
      <g {...a("saut", { dy: -42, t: 1.15, d: 1.5, n: 4 })}>
        <g transform={tf(62, 430, 0.31)}>
          <Astronaute espece={espece} look={look} bras={[34, 150]} jambes={[10, 14]} salut />
        </g>
      </g>
    </g>
    {/* Le drapeau : raide, il n'y a pas de vent */}
    <g {...a("pop", { t: 0.5, d: 6.3, o: "0% 100%" })}>
      <path d="M200 620V500" fill="none" stroke={C.grisClair} strokeWidth="4" strokeLinecap="round" />
      <path d="M200 502H262V540H200Z" fill={C.mimosa} />
      <path d="M200 502H262" fill="none" stroke={C.grisClair} strokeWidth="3" />
      <path d={etoiles([[231, 521, 12]])} fill={C.bougainvillier} />
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Une soirée sur la Lune : la boule à facettes pend au-dessus d'un cratère, les faisceaux
// balaient la poussière, et tout Grattouille danse en scaphandre.

/** Un invité : son médaillon dans une bulle, sur un petit scaphandre. Posé sur ses bottes en (0, 0), haut de 96. */
function Invite({ pnj, d }: { pnj: string; d: number }) {
  return (
    <g {...a("saut", { dy: -14, t: 0.52, d })}>
      <path d="M-13 -34V-6M13 -34V-6" fill="none" stroke="#F4F6F8" strokeWidth="13" strokeLinecap="round" />
      <path d="M-20 -2H-6M6 -2H20" fill="none" stroke={C.gris} strokeWidth="8" strokeLinecap="round" />
      <path d="M-22 -40L-34 -58M22 -40L34 -58" fill="none" stroke="#F4F6F8" strokeWidth="11" strokeLinecap="round" />
      <rect x="-22" y="-52" width="44" height="32" rx="12" fill="#F4F6F8" />
      <rect x="-10" y="-40" width="20" height="10" rx="3" fill={C.ciel} />
      <g transform="translate(-27 -100) scale(0.45)"><Medaillon pnj={pnj} /></g>
      <circle cx="0" cy="-73" r="30" fill="none" stroke="#F4F6F8" strokeWidth="4" />
      <path d="M-22 -86A26 26 0 0 1 -8 -98" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}

/** La hauteur de la boule à facettes. */
const BOULE = 344;

/** Les faisceaux de la boule : leur couleur, et où ils tombent. */
const FAISCEAUX: readonly (readonly [string, number, number, number])[] = [
  [C.bougClair, 10, 700, 1.3], [C.persClair, 130, 720, 1.7], [C.mimosa, 250, 720, 1.5], [C.ciel, 370, 700, 1.9],
];

const soireeLune: SceneArt = ({ espece, look }) => {
  let facettes = "";
  for (let i = -3; i <= 3; i++) facettes += `M${180 - 46} ${BOULE + i * 13}H${180 + 46}M${180 + i * 13} ${BOULE - 46}V${BOULE + 46}`;
  return (
    <>
      <Ciel id="soiree" couleurs={["#120A36", "#27185C", "#3E2A7C"]} />
      <Etoiles points={FIRMAMENT} brillantes={[[40, 250, 7], [330, 300, 7], [280, 130, 6]]} />
      <g transform="translate(300 352)"><Terre r={36} /></g>
      <path d={relief([[-20, 540], [70, 506], [150, 532], [230, 500], [300, 526], [380, 498]], 580)} fill="#8D8FB0" />
      <SolLunaire y={548} couleur="#B4B7D0" />
      {/* La piste de danse, au fond d'un cratère */}
      <ellipse cx="180" cy="668" rx="156" ry="46" fill="#7C7FA4" />
      <ellipse cx="180" cy="672" rx="138" ry="38" fill="#2A1B5E" />
      {([[110, 664, C.bougClair, 0], [156, 684, C.mimosa, -0.3], [204, 660, C.persClair, -0.6], [250, 682, C.ciel, -0.15], [180, 700, C.bougClair, -0.45]] as const).map(([x, y, couleur, d]) => (
        <ellipse key={x} cx={x} cy={y} rx="20" ry="7" fill={couleur} {...a("clignote", { t: 0.52, d, o0: 0.12 })} />
      ))}
      {/* Les faisceaux */}
      {FAISCEAUX.map(([couleur, x, y, t], i) => (
        <g key={x} {...a("flotte", { r: 7, t, d: -i * 0.4, o: [180, BOULE] })}>
          <path d={`M180 ${BOULE}L${x - 34} ${y}H${x + 34}Z`} fill={couleur} fillOpacity="0.2" />
        </g>
      ))}
      {/* La boule à facettes */}
      <path d={`M180 -20V${BOULE - 46}`} fill="none" stroke={C.brume} strokeWidth="2" />
      <g {...a("flotte", { r: 2.4, t: 1.6, o: [180, 0] })}>
        <circle cx="180" cy={BOULE} r="46" fill={METAL.argent} />
        <Fenetre x={134} y={BOULE - 46} l={92} h={92} rx={46}>
          <path d={facettes} fill="none" stroke={C.nuit} strokeOpacity="0.4" strokeWidth="1.5" />
          <g transform={`translate(0 ${BOULE - 250})`} fill={C.blanc} fillOpacity="0.85">
            <path d="M150 220h13v13h-13ZM189 233h13v13h-13ZM163 259h13v13h-13ZM202 272h13v13h-13ZM176 207h13v13h-13Z" {...a("clignote", { t: 0.4, o0: 0.2 })} />
            <path d="M163 233h13v13h-13ZM202 220h13v13h-13ZM150 272h13v13h-13ZM189 259h13v13h-13Z" {...a("clignote", { t: 0.4, d: -0.4, o0: 0.2 })} />
          </g>
        </Fenetre>
        <path d={etoiles([[224, BOULE - 38, 13], [140, BOULE + 32, 9]])} fill={C.blanc} {...a("clignote", { t: 0.6, o0: 0.2 })} />
      </g>
      {/* Les invités : tout Grattouille est monté */}
      <g transform="translate(52 642) scale(0.9)"><Invite pnj="selene" d={0} /></g>
      <g transform="translate(308 646) scale(0.9)"><Invite pnj="piou" d={-0.26} /></g>
      <g transform="translate(106 612) scale(0.72)"><Invite pnj="gaspard" d={-0.13} /></g>
      <g transform="translate(256 614) scale(0.72)"><Invite pnj="ondine" d={-0.39} /></g>
      {/* Le voyageur, au milieu de la piste */}
      <g {...a("saut", { dy: -22, t: 0.52 })}>
        <g {...a("flotte", { r: 5, t: 1.04, o: [180, 660] })}>
          <g transform={tf(118, 476, 0.31)}>
            <Astronaute espece={espece} look={look} bras={[146, 128]} jambes={[14, 20]} />
          </g>
        </g>
      </g>
      <g transform="translate(64 716) scale(1.05)"><Invite pnj="baron" d={-0.2} /></g>
      <g transform="translate(298 720) scale(1.05)"><Invite pnj="colette" d={-0.33} /></g>
      {/* Des notes s'envolent */}
      <g fill={C.ivoire}>
        <g {...a("passe", { fy: -150, fx: 20, r: 20, t: 2.4, n: "inf" })}>
          <path d="M40 470V440L58 436V464" fill="none" stroke={C.ivoire} strokeWidth="3" />
          <path d={ronds(5, [[35, 470], [53, 464]])} />
        </g>
        <g {...a("passe", { fy: -150, fx: -20, r: -20, t: 2.4, d: 1.2, n: "inf" })}>
          <path d="M318 430V402" fill="none" stroke={C.ivoire} strokeWidth="3" />
          <path d={ronds(5, [[313, 430]])} />
        </g>
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------
// Un pique-nique sur Mars : la nappe à carreaux, le robot qui regarde, le sandwich qui
// cogne contre la bulle. Et quelqu'un, derrière le rocher, qui a très envie des chips.

const ROUILLE = "#B5522E";

const mars: SceneArt = ({ espece, look }) => {
  let carreaux = "";
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) carreaux += `M${72 + i * 36} ${640 + j * 20}h36v20h-36Z`;
  return (
    <>
      <Ciel id="mars" couleurs={["#D5814F", "#EBB583", "#F6D9B0"]} bas={480} />
      <circle cx="286" cy="226" r="13" fill="#FFF3D6" />
      <circle cx="286" cy="226" r="22" fill="#FFF3D6" fillOpacity="0.3" />
      <path d="M60 250Q66 240 78 244Q86 252 78 260Q66 262 60 250Z" fill="#8F6A52" />
      <circle cx="156" cy="206" r="5" fill="#8F6A52" />
      {/* Le grand volcan, les dunes */}
      <path d="M-20 482Q60 400 150 396H230Q300 404 380 482Z" fill="#C4683F" />
      <path d="M150 396H230L214 404H166Z" fill="#9A3F22" />
      <rect x="-20" y="478" width="400" height="342" fill={ROUILLE} />
      <path d={relief([[-20, 540], [100, 520], [220, 544], [380, 522]])} fill={shade(ROUILLE, -0.1)} />
      <path d={ronds(5, [[40, 560], [300, 570], [200, 590]]) + ronds(3, [[120, 572], [260, 600], [340, 610]])} fill="#8A3A20" />
      {/* Un tourbillon de poussière, au loin */}
      <g {...a("flotte", { dx: 30, t: 3 })}>
        <path d="M40 480Q30 450 44 430Q34 410 52 396Q40 380 58 370L70 372Q58 384 68 398Q56 412 64 432Q54 452 60 480Z" fill="#E9C09A" fillOpacity="0.7" {...a("flotte", { r: 4, t: 0.5, o: "50% 100%" })} />
      </g>
      {/* Le robot : il s'approche, il regarde */}
      <g {...a("va", { dx: -150, t: 2.4, e: "sortie" })}>
        <g transform="translate(60 640)">
          <path d={ronds(10, [[-26, -8], [0, -8], [26, -8]])} fill={C.noir} />
          <path d={ronds(4, [[-26, -8], [0, -8], [26, -8]])} fill={C.gris} />
          <rect x="-34" y="-40" width="68" height="24" rx="5" fill={C.ivoire} />
          <rect x="-40" y="-48" width="52" height="8" rx="2" fill={C.marine} />
          <path d="M-28 -48V-40M-16 -48V-40M-4 -48V-40" fill="none" stroke={C.ciel} strokeWidth="1.6" />
          <path d="M20 -40V-78" fill="none" stroke={C.gris} strokeWidth="4" />
          <g {...a("flotte", { r: 10, t: 1.4, o: [20, -84] })}>
            <rect x="8" y="-96" width="30" height="20" rx="5" fill={C.ivoire} />
            <path d={ronds(4.5, [[18, -86], [30, -86]])} fill={C.nuit} />
            <path d={ronds(1.6, [[19, -87], [31, -87]])} fill={C.ciel} />
          </g>
        </g>
      </g>
      {/* Le rocher, et celui qui se cache derrière */}
      <g {...a("va", { dy: 62, t: 0.7, d: 3.3, e: "rebond" })}>
        <path d="M296 560V522" fill="none" stroke="#7FC28A" strokeWidth="4" strokeLinecap="round" />
        <circle cx="296" cy="518" r="6" fill={C.mimosa} {...a("pulse", { s0: 0.8, s: 1.25, t: 0.5 })} />
        <path d="M268 620Q266 558 298 556Q330 558 328 620Z" fill="#7FC28A" />
        <path d={ronds(8, [[286, 584], [310, 584]])} fill={C.blanc} />
        <path d={ronds(3.6, [[288, 585], [308, 585]])} fill={C.nuit} />
        {/* Le paquet de chips, une fois chipé */}
        <g {...a("apparait", { t: 0.1, d: 5.9 })}>
          <path d="M320 564L354 558L358 596L326 602Z" fill={C.mimosa} />
          <path d="M322 576L356 570L357 582L324 588Z" fill={C.cerise} />
          <path d={ronds(3, [[342, 552], [352, 544], [332, 546]])} fill={C.paille} {...a("saut", { dy: -8, t: 0.4 })} />
        </g>
      </g>
      <path d="M250 660Q244 600 280 590Q330 584 350 610Q372 640 360 664Z" fill="#8A3A20" />
      <path d="M330 596Q350 604 358 630Q366 650 360 664H336Q346 630 330 596Z" fill="#6E2C18" />
      {/* La nappe à carreaux, le panier, la thermos */}
      <path d="M72 640H288L306 700H54Z" fill={C.blanc} />
      <path d={carreaux} fill={C.cerise} fillOpacity="0.85" />
      <path d="M96 640Q116 600 136 640" fill="none" stroke={C.boisFonce} strokeWidth="4" strokeLinecap="round" />
      <path d="M90 640H142L138 668H94Z" fill={C.bois} />
      <path d="M92 650H140M93 659H139" fill="none" stroke={C.boisFonce} strokeWidth="1.6" />
      <rect x="232" y="616" width="16" height="38" rx="4" fill={C.persienne} />
      <rect x="234" y="608" width="12" height="10" rx="3" fill={C.gris} />
      {/* Le paquet de chips : il glisse vers le rocher */}
      <g {...a("sort", { dx: 76, dy: -30, t: 0.9, d: 5, e: "entree" })}>
        <path d="M250 652L284 646L288 684L256 690Z" fill={C.mimosa} />
        <path d="M252 664L286 658L287 670L254 676Z" fill={C.cerise} />
      </g>
      {/* Le voyageur : le sandwich cogne contre la bulle */}
      <g transform={tf(110, 470, 0.3)}>
        <Astronaute
          espece={espece}
          look={look}
          bras={[24, 146]}
          jambes={[62, 62]}
          salut
          tient={(
            <g transform="rotate(-24)">
              <path d="M-70 -44H50V-10H-70Z" fill={C.paille} />
              <path d="M-70 -10H50V6H-70Z" fill={C.vert} />
              <path d="M-70 6H50V30H-70Z" fill={shade(C.paille, -0.14)} />
              <path d="M-70 -2H50" fill="none" stroke={C.cerise} strokeWidth="9" />
            </g>
          )}
        />
      </g>
      <path d="M232 520L244 508M240 532L256 528M226 508L230 492" fill="none" stroke={C.nuit} strokeWidth="3" strokeLinecap="round" {...a("eclat", { t: 0.45, d: 1.2, n: 4, o: "0% 100%" })} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Du surf sur les anneaux de Saturne : la plus longue vague du système solaire. L'anneau
// tourne, la planche glisse dessus, et la vague ne casse jamais.

/** Le centre de Saturne, l'inclinaison de ses anneaux et leur aplatissement. */
const SX = 150;
const SY = 360;
const PENCHE = -16;
const APLATI = 0.24;

/** Le plan des anneaux : un cercle y devient une ellipse penchée. */
const PLAN = `translate(${SX} ${SY}) rotate(${PENCHE}) scale(1 ${APLATI})`;

/** Les anneaux, par moitié : celle de derrière la planète, ou celle de devant. */
function Anneaux({ moitie }: { moitie: "derriere" | "devant" }) {
  return (
    <g transform={PLAN}>
      <Fenetre x={-420} y={moitie === "derriere" ? -420 : 0} l={840} h={420}><Poussieres /></Fenetre>
    </g>
  );
}

/** Les anneaux : des poussières qui tournent, plus ou moins vite. */
function Poussieres() {
  return (
    <>
      <circle r="290" fill="none" stroke={C.creme} strokeOpacity="0.8" strokeWidth="34" />
      <circle r="246" fill="none" stroke={C.paille} strokeOpacity="0.85" strokeWidth="40" />
      <circle r="204" fill="none" stroke={C.creme} strokeOpacity="0.6" strokeWidth="22" />
      <g {...a("tourne", { t: 9, r: -360, o: [0, 0] })}>
        <circle r="290" fill="none" stroke={C.blanc} strokeWidth="7" strokeDasharray="6 44" />
        <circle r="234" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="6" strokeDasharray="10 60" />
      </g>
      <g {...a("tourne", { t: 6, r: -360, o: [0, 0] })}>
        <circle r="258" fill="none" stroke={C.mimosaFonce} strokeOpacity="0.7" strokeWidth="5" strokeDasharray="14 70" />
        <circle r="204" fill="none" stroke={C.blanc} strokeOpacity="0.7" strokeWidth="5" strokeDasharray="5 50" />
      </g>
    </>
  );
}

/** D'où part le surfeur sur l'anneau, et où il s'arrête, en degrés (90 : au plus près de nous). */
const DEPART = 168;
const ARRIVEE = 62;
const GLISSE = { t: 6.4, d: 0.6, e: "cubic-bezier(.3,0,.3,1)" } as const;

const saturne: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="saturne" couleurs={["#0B0728", "#1B1440", "#35245F"]} />
    <Etoiles points={FIRMAMENT} brillantes={[[310, 180, 8], [40, 560, 6], [330, 600, 7], [250, 660, 6]]} />
    <Anneaux moitie="derriere" />
    {/* La planète, ses bandes */}
    <circle cx={SX} cy={SY} r="128" fill={C.paille} />
    <Fenetre x={SX - 128} y={SY - 128} l={256} h={256} rx={128}>
      <g transform={`rotate(${PENCHE} ${SX} ${SY})`}>
        <rect x={SX - 140} y={SY - 96} width="280" height="26" fill={C.creme} />
        <rect x={SX - 140} y={SY - 44} width="280" height="18" fill={C.mimosaFonce} fillOpacity="0.55" />
        <rect x={SX - 140} y={SY + 6} width="280" height="30" fill={C.creme} />
        <rect x={SX - 140} y={SY + 62} width="280" height="20" fill={C.mimosaFonce} fillOpacity="0.55" />
      </g>
      <path d={`M${SX} ${SY - 128}A128 128 0 0 1 ${SX} ${SY + 128}Q${SX + 70} ${SY + 70} ${SX + 70} ${SY}Q${SX + 70} ${SY - 70} ${SX} ${SY - 128}Z`} fill={C.prune} fillOpacity="0.22" />
    </Fenetre>
    {/* Une lune, au loin */}
    <circle cx="316" cy="250" r="12" fill={C.corail} />
    <Anneaux moitie="devant" />
    <g transform={PLAN}>
      {/* Le surfeur : il suit l'anneau, sans tourner ni s'aplatir avec lui */}
      <g transform={`rotate(${ARRIVEE})`}>
        <g {...a("va", { r: DEPART - ARRIVEE, ...GLISSE, o: [0, 0] })}>
          <g transform="translate(250 0)">
            <g transform={`rotate(${-ARRIVEE})`}>
              <g {...a("va", { r: ARRIVEE - DEPART, ...GLISSE, o: [0, 0] })}>
                <g transform={`scale(1 ${1 / APLATI}) rotate(${-PENCHE})`}>
                  <g {...a("flotte", { r: 7, dy: 3, t: 0.9, o: [0, 0] })}>
                    {/* L'écume d'anneau, derrière la planche */}
                    <g fill={C.blanc}>
                      <circle cx="-58" cy="-6" r="6" {...a("eclat", { t: 0.6, n: "inf", o: [-40, 0] })} />
                      <circle cx="-74" cy="-18" r="8" {...a("eclat", { t: 0.6, d: 0.2, n: "inf", o: [-40, 0] })} />
                      <circle cx="-66" cy="6" r="5" {...a("eclat", { t: 0.6, d: 0.4, n: "inf", o: [-40, 0] })} />
                    </g>
                    <g transform={tf(-42, -134, 0.21)}>
                      <Astronaute espece={espece} look={look} bras={[86, 104]} jambes={[26, 30]} />
                    </g>
                    <path d="M-58 0Q0 -12 62 -4Q66 2 60 6Q0 14 -58 6Q-64 3 -58 0Z" fill={C.bougainvillier} />
                    <path d="M-40 1Q0 -4 46 0" fill="none" stroke={C.ivoire} strokeWidth="3" strokeLinecap="round" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Une balade à dos de comète : elle est sellée, bridée, et elle ne passe que tous les
// soixante-seize ans. Les étoiles filent, les planètes défilent, la crinière flotte.

/** Les bandes de la crinière : [couleur, largeur à l'attache, longueur, angle, durée]. */
const CRINIERE: readonly (readonly [string, number, number, number, number])[] = [
  ["#F2C94C", 20, 250, -20, 0.7], ["#BFE0F5", 26, 290, -10, 0.9], [C.blanc, 22, 270, 0, 0.8], ["#F2C94C", 18, 240, 10, 0.75],
  ["#BFE0F5", 22, 220, 20, 0.85],
];

const dosDeComete: SceneArt = ({ espece, look }) => {
  let filantes = "";
  for (let i = 0; i < 9; i++) filantes += `M${40 + ((i * 97) % 380)} ${120 + ((i * 173) % 560)}l-34 14`;
  return (
    <>
      <Ciel id="comete" couleurs={["#060A22", "#101A4C", "#22306E"]} />
      <Etoiles points={FIRMAMENT} brillantes={[[50, 180, 7], [310, 600, 7]]} />
      {/* Les étoiles filent : on va vite */}
      <g fill="none" stroke={C.blanc} strokeOpacity="0.6" strokeWidth="2.4" strokeLinecap="round" {...a("defile", { dx: -380, dy: 156, t: 1.5 })}>
        <path d={filantes} />
        <path d={filantes} transform="translate(380 -156)" />
      </g>
      {/* Des planètes, qu'on dépasse */}
      <g {...a("passe", { dx: 300, dy: -90, fx: -260, fy: 130, t: 5, d: 0.6 })}>
        <circle cx="200" cy="250" r="30" fill={C.corail} />
        <path d="M172 244Q200 254 228 240" fill="none" stroke={C.brique} strokeWidth="5" />
      </g>
      <g {...a("va", { dx: 300, dy: -110, t: 5.2, d: 2.6, e: "sortie" })}>
        <ellipse cx="74" cy="560" rx="52" ry="11" transform="rotate(-18 74 560)" fill="none" stroke={C.creme} strokeWidth="6" />
        <circle cx="74" cy="560" r="28" fill={C.paille} />
        <path d="M24.6 576A52 11 -18 0 0 123.4 544" fill="none" stroke={C.creme} strokeWidth="6" />
      </g>
      {/* La comète, sa crinière, son cavalier */}
      <g {...a("va", { dx: -330, dy: 150, t: 2.8, e: "sortie" })}>
        <g transform="translate(214 446)">
          <g {...a("flotte", { r: 4, dy: 7, t: 1.1, o: [0, 0] })}>
            {CRINIERE.map(([couleur, l, longueur, angle, t], i) => (
              <g key={i} transform={`rotate(${160 + angle})`}>
                <path d={`M0 ${-l / 2}Q${longueur * 0.5} ${-l * 0.9} ${longueur} 0Q${longueur * 0.5} ${l * 0.9} 0 ${l / 2}Z`} fill={couleur} fillOpacity="0.88" {...a("flotte", { r: 5, t, d: -i * 0.2, o: [0, 0] })} />
              </g>
            ))}
            {/* Le noyau de glace, à facettes */}
            <circle r="62" fill="#DDF1FA" fillOpacity="0.5" />
            <circle r="50" fill="#BFE0F5" />
            <path d="M-4 -40L28 -32L44 -6L38 26L14 42L-20 40L-42 18L-44 -14L-26 -34Z" fill={C.blanc} />
            <path d="M44 -6L38 26L14 42L-20 40L12 22L26 -2Z" fill={C.azur} fillOpacity="0.8" />
            <path d="M-44 -14L-18 -4L-20 40L-42 18Z" fill={C.ciel} />
            {/* L'œil, la bride, les rênes */}
            <circle cx="30" cy="-10" r="4" fill={C.nuit} />
            <path d="M24 -34Q42 0 30 36" fill="none" stroke={C.boisFonce} strokeWidth="4" strokeLinecap="round" />
            <circle cx="38" cy="2" r="5" fill={METAL.or} />
            {/* La selle, puis le cavalier */}
            <path d="M-36 -44H22L16 -24Q-8 -16 -30 -24Z" fill={C.cerise} />
            <path d="M-30 -48Q-28 -62 -16 -56Q-4 -52 8 -58Q18 -60 18 -46Q8 -40 -8 -40Q-22 -40 -30 -48Z" fill={C.bois} />
            <g transform={tf(-56, -190, 0.25)}>
              <Astronaute espece={espece} look={look} bras={[50, 58]} jambes={[58, 58]} />
            </g>
            <path d="M38 2Q30 -50 6 -84M38 2Q10 -40 -30 -82" fill="none" stroke={C.boisFonce} strokeWidth="3" strokeLinecap="round" />
            <path d={etoiles([[74, -36, 12], [64, 34, 9], [86, 6, 7]])} fill={METAL.or} {...a("clignote", { t: 0.5, o0: 0.3 })} />
          </g>
        </g>
      </g>
    </>
  );
};

export const SCENES_CIEL: Record<string, SceneArt> = {
  apesanteur,
  orbite,
  "feu-artifice": feuArtifice,
  "tour-de-lune": tourDeLune,
  "pas-sur-la-lune": pasSurLaLune,
  "soiree-lune": soireeLune,
  mars,
  saturne,
  "dos-de-comete": dosDeComete,
};
