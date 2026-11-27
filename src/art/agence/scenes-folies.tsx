// Les films de l'Agence Carpe Diem, chapitre « Les folies » : l'Everest en chaise à
// porteurs, l'île déserte tout compris, le train de légende, le film dont on est la
// vedette, la fosse des Mariannes et le parc d'attractions pour soi tout seul.
//
// Une scène se dessine dans le <svg> du film (viewBox 0 0 360 800 ; voir ./kit.tsx pour le
// cadre, le style et le mouvement). Chaque élément est posé là où il sera sur la carte
// postale : sans animation, le dessin est l'image de la fin.

import type { ReactNode } from "react";
import { C, METAL, shade } from "../kit";
import {
  Astre, Buste, Ciel, Etoiles, Fenetre, Mer, Mouette, Perso, Tete, a, etoile5, etoiles, nuage, pelageDe, relief, ronds, tf,
  vagues, type SceneArt,
} from "./kit";

// ---------------------------------------------------------------------------
// L'Everest en chaise à porteurs : deux bouquetins en bonnet hissent la chaise jusqu'au
// sommet, et l'on y plante le drapeau sans avoir quitté son coussin.

/** Un bouquetin porteur, de profil, tourné vers la droite. Posé sur ses sabots en (0, 0), haut de 54. */
function Porteur({ d = 0 }: { d?: number }) {
  const poil = "#8A6B4E";
  return (
    <g {...a("flotte", { dy: 1.6, t: 0.3, d })}>
      <path d="M-14 0V-16M-6 0V-16M8 0V-16M16 0V-16" fill="none" stroke={shade(poil, -0.25)} strokeWidth="4.5" strokeLinecap="round" />
      <rect x="-20" y="-34" width="42" height="21" rx="9" fill={poil} />
      <path d="M14 -30L24 -46Q32 -50 36 -42L34 -34Q28 -30 20 -24Z" fill={poil} />
      <path d="M28 -47Q22 -64 8 -62" fill="none" stroke={C.creme} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M33 -35L34 -27" fill="none" stroke={C.creme} strokeWidth="3" strokeLinecap="round" />
      <circle cx="31" cy="-42" r="1.7" fill={C.nuit} />
      <path d="M22 -48Q28 -56 35 -47Z" fill={C.cerise} />
      <circle cx="28" cy="-55" r="3" fill={C.ivoire} />
      {/* Une goutte de sueur : c'est lui qui monte */}
      <path d="M-4 -44Q0 -38 -4 -35Q-8 -38 -4 -44Z" fill={C.ciel} {...a("clignote", { t: 0.6, d, o0: 0 })} />
    </g>
  );
}

/** Les fanions de prière, du mât jusqu'au bord du ciel : [x, y, couleur]. */
const FANIONS: readonly (readonly [number, number, string])[] = [
  [262, 258, C.azur], [226, 250, C.blanc], [190, 238, C.cerise], [154, 222, C.vert], [118, 204, C.mimosa], [82, 184, C.azur],
  [46, 162, C.blanc], [10, 138, C.cerise],
];

/** La pente de l'arête, en degrés : la chaise la monte penchée d'autant. */
const PENTE = 48;

const everest: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="everest" couleurs={["#2A68BC", "#7DB6E7", "#D6ECF7"]} bas={600} />
    <Astre x={318} y={196} r={20} couleur={C.blanc} halo="#FFF3C8" />
    {/* Les sommets voisins */}
    <path d="M150 620L236 452L276 510L322 430L400 620Z" fill="#A9C7E4" />
    <path d="M236 452L258 494L244 488L232 504L220 484ZM322 430L346 478L332 470L318 488L304 466Z" fill={C.blanc} />
    {/* Le toit du monde : une longue arête, et tout en haut un replat */}
    <path d="M-20 800V500L150 312H300L380 430V800Z" fill={C.blanc} />
    <path d="M300 312L380 430V800H262L312 540L260 420Z" fill="#B9D5EC" />
    <path d="M-20 640L50 566L76 598L128 520L150 560L112 640Z" fill="#DCEBF6" />
    <path d="M120 800L186 650L224 708L262 630L320 800Z" fill="#DCEBF6" />
    <path d="M168 372L190 350L204 376L222 362L232 392L196 404ZM60 478L84 452L96 480L78 496ZM250 470L270 446L286 478L262 492ZM150 470L166 456L176 480L160 488Z" fill="#8FA3BA" />
    <path d="M190 350L204 376L196 404L186 372ZM84 452L96 480L78 496L86 474ZM270 446L286 478L262 492L272 468Z" fill="#6F859E" />
    {/* Le camp de base : une tente, et la fumée du thé */}
    <path d="M196 560L218 522L240 560Z" fill={C.corail} />
    <path d="M218 522L240 560H226Z" fill={shade(C.corail, -0.25)} />
    <path d="M214 560L218 544L222 560Z" fill={C.nuit} />
    <g fill={C.blanc} fillOpacity="0.7">
      <circle cx="250" cy="548" r="5" {...a("passe", { fy: -40, fx: 10, t: 2.4, n: "inf" })} />
      <circle cx="250" cy="548" r="4" {...a("passe", { fy: -40, fx: 14, t: 2.4, d: 1.2, n: "inf" })} />
    </g>
    <path d="M244 560H256V552H244Z" fill={C.grisFonce} />
    {/* Le mât du sommet et ses fanions de prière */}
    <path d="M300 312V232" fill="none" stroke={C.nuit} strokeWidth="3" strokeLinecap="round" />
    <path d="M300 240Q160 238 -20 112" fill="none" stroke={C.nuit} strokeWidth="1.2" />
    {FANIONS.map(([x, y, couleur], i) => (
      <path key={x} d={`M${x} ${y}h16l-3 17l-5 -4l-5 4Z`} fill={couleur} {...a("flotte", { r: 9, t: 0.4 + (i % 3) * 0.08, d: -i * 0.1, o: "50% 0%" })} />
    ))}
    {/* La chaise et ses porteurs : ils montent par l'arête, puis se redressent sur le replat */}
    <g {...a("va", { dx: -114, dy: 45, r: -PENTE, t: 1.4, d: 4.2, e: "cubic-bezier(.4,0,.2,1)", o: [224, 312] })}>
      <g {...a("va", { dx: -250, t: 3.9, d: 0.3, e: "cubic-bezier(.3,0,.6,1)" })}>
        <g transform="translate(224 288)">
          <g transform="translate(-58 24)"><Porteur /></g>
          <g transform="translate(54 24)"><Porteur d={-0.15} /></g>
          <g {...a("flotte", { dy: 1.5, r: 1.2, t: 0.3 })}>
            <path d="M-84 -8H86" fill="none" stroke={C.bois} strokeWidth="5" strokeLinecap="round" />
            <path d="M-30 -62Q0 -80 30 -62V-58H-30Z" fill={METAL.or} />
            <circle cx="0" cy="-74" r="4.5" fill={METAL.or} />
            <rect x="-28" y="-60" width="56" height="66" rx="5" fill={C.bordeaux} />
            <path d="M14 -60H23Q28 -60 28 -55V1Q28 6 23 6H14Z" fill={shade(C.bordeaux, -0.3)} />
            <rect x="-28" y="-18" width="56" height="5" fill={METAL.or} />
            <rect x="-20" y="-52" width="40" height="32" rx="4" fill={C.ciel} />
            <Fenetre x={-20} y={-52} l={40} h={32} rx={4}>
              <g transform={tf(-24.5, -66, 0.175)}><Tete espece={espece} look={look} /></g>
            </Fenetre>
            <path d="M-20 -52H-10Q-12 -40 -20 -34ZM20 -52H10Q12 -40 20 -34Z" fill={C.cerise} />
            <path d={ronds(2.2, [[-18, -4], [-6, -4], [6, -4], [18, -4]])} fill={METAL.or} />
          </g>
        </g>
      </g>
    </g>
    {/* Le drapeau, hissé au sommet */}
    <g {...a("pop", { t: 0.5, d: 5.9, o: "0% 100%" })}>
      <path d="M300 234L340 245L300 260Z" fill={C.mimosa} />
      <path d={etoiles([[313, 246, 6]])} fill={C.bougainvillier} />
    </g>
    {/* La mer de nuages, en dessous */}
    <g fill={C.blanc} {...a("defile", { dx: -360, t: 14 })}>
      {[-360, 0, 360].map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <path d={nuage(200)} transform="translate(-30 610)" />
          <path d={nuage(180)} transform="translate(180 636)" />
        </g>
      ))}
    </g>
    <rect x="-20" y="690" width="400" height="130" fill={C.blanc} />
  </>
);

// ---------------------------------------------------------------------------
// Un mois sur une île déserte, tout compris : un palmier, un hamac, personne. On sonne, et
// le service en chambre arrive à la nage.

const LAGON = "#2BB5C6";

/** La tortue du service en chambre, nœud papillon, plateau levé. Posée en (0, 0), tournée vers la gauche. */
function Tortue() {
  return (
    <>
      <path d="M-34 -8Q-46 -4 -50 6L-36 4ZM20 -4Q32 2 34 12L20 6Z" fill={C.vert} />
      <path d="M-30 -10Q-28 -44 6 -44Q36 -42 36 -10Z" fill={C.persFonce} />
      <path d="M-18 -12Q-16 -34 6 -34Q26 -32 26 -12Z" fill={C.persienne} />
      <path d="M-6 -34L-2 -12M14 -33L12 -12M-16 -24H26" fill="none" stroke={C.persFonce} strokeWidth="2" />
      <path d="M-32 -8H38V-2H-32Z" fill={C.amande} />
      <path d="M-30 -14Q-48 -18 -54 -32Q-52 -46 -40 -44Q-30 -40 -30 -26Z" fill={C.vert} />
      <circle cx="-46" cy="-34" r="1.9" fill={C.nuit} />
      <path d="M-34 -16L-44 -21V-9ZM-34 -16L-24 -21V-9Z" fill={C.nuit} />
      {/* Le plateau d'argent, à bout de nageoire */}
      <path d="M-22 -24Q-34 -44 -30 -64" fill="none" stroke={C.vert} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="-30" cy="-67" rx="24" ry="4.5" fill={METAL.argent} />
    </>
  );
}

const ileDeserte: SceneArt = ({ espece, look }) => {
  const patte = pelageDe(espece);
  return (
    <>
      <Ciel id="ile" couleurs={["#3BB3E7", "#9ADCF2", "#EAF7EE"]} bas={470} />
      <Astre x={292} y={214} r={30} />
      <g transform={tf(20, 190)}><path d={nuage(110)} fill={C.blanc} {...a("flotte", { dx: 9, t: 6 })} /></g>
      <g transform="translate(250 330) scale(0.6)"><g {...a("va", { dx: 120, t: 8, e: "lin" })}><Mouette /></g></g>
      <Mer y={466} couleur={LAGON} reflets={shade(LAGON, 0.35)} t={6} />
      {/* L'île : un dos de sable, un anneau d'eau claire */}
      <ellipse cx="170" cy="596" rx="190" ry="34" fill={shade(LAGON, 0.3)} />
      <path d="M12 600Q60 548 170 544Q286 548 330 600Q170 626 12 600Z" fill={C.sable} />
      <path d="M170 544Q286 548 330 600Q250 612 196 610Q252 580 170 544Z" fill={shade(C.sable, -0.1)} />
      {/* Le palmier, et le poteau du hamac */}
      <path d="M92 566Q76 470 108 372" fill="none" stroke={C.bois} strokeWidth="13" strokeLinecap="round" />
      <path d="M88 540L98 536M86 506L97 504M88 472L99 472M92 438L103 440M98 404L109 408" fill="none" stroke={C.boisFonce} strokeWidth="2.4" />
      <g {...a("flotte", { r: 2.5, t: 2.4, o: [108, 372] })}>
        <path d="M108 372Q60 346 16 368Q62 366 108 372ZM108 372Q84 318 38 306Q78 332 108 372ZM108 372Q118 310 168 290Q136 326 108 372ZM108 372Q166 344 206 372Q160 366 108 372ZM108 372Q150 388 172 426Q138 396 108 372ZM108 372Q70 392 56 430Q80 398 108 372Z" fill={C.feuille} />
        <path d={ronds(8, [[100, 380], [116, 384]])} fill={C.boisFonce} />
      </g>
      <rect x="262" y="480" width="8" height="90" rx="3" fill={C.boisFonce} />
      {/* Une noix de coco tombe */}
      <circle cx="54" cy="566" r="9" fill={C.boisFonce} {...a("chute", { dy: -180, t: 0.6, d: 1.2, o: "50% 100%" })} />
      {/* Le voyageur, dans son hamac */}
      <g {...a("flotte", { r: 2.2, t: 2, o: [182, 440] })}>
        <g transform={tf(126, 404, 0.3)}><Buste espece={espece} look={look} /></g>
        <path d="M104 486Q182 566 266 492Q260 548 184 556Q112 548 104 486Z" fill={C.ivoire} />
        <path d="M104 486Q182 566 266 492" fill="none" stroke={C.cerise} strokeWidth="4" />
        <path d="M124 512Q182 566 246 516M144 532Q184 562 226 536" fill="none" stroke={C.cerise} strokeOpacity="0.6" strokeWidth="2" />
        <path d="M98 470L104 486M270 482L266 492" fill="none" stroke={C.boisFonce} strokeWidth="2.4" />
        {/* Le cocktail, enfin */}
        <g {...a("pop", { t: 0.5, d: 5.9, o: "50% 100%" })}>
          <path d="M232 504L246 486" fill="none" stroke={patte} strokeWidth="13" strokeLinecap="round" />
          <path d="M240 456H268L260 484H248Z" fill={C.corail} />
          <path d="M240 456H268L266 463H242Z" fill={C.mimosa} />
          <path d="M254 484V496M246 497H262" fill="none" stroke={C.blanc} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M262 458L272 436" fill="none" stroke={C.nuit} strokeWidth="1.6" />
          <path d="M260 440Q272 426 286 438Z" fill={C.bougainvillier} />
          <path d={etoiles([[282, 462, 8], [228, 468, 6]])} fill={C.blanc} />
        </g>
      </g>
      {/* La sonnette de service, sur sa souche */}
      <path d="M296 580V562H316V580Z" fill={C.bois} />
      <g {...a("secoue", { r: 14, t: 0.18, d: 2.3, n: 5, o: "50% 100%" })}>
        <path d="M298 562Q298 548 306 548Q314 548 314 562Z" fill={METAL.or} />
        <circle cx="306" cy="546" r="3" fill={METAL.or} />
      </g>
      <path d="M292 540L286 532M306 536V526M320 540L326 532" fill="none" stroke={C.nuit} strokeWidth="3" strokeLinecap="round" {...a("eclat", { t: 0.7, d: 2.3, o: "50% 100%" })} />
      {/* Le service en chambre arrive à la nage */}
      <g {...a("va", { dx: 230, dy: 26, t: 2.4, d: 3.2, e: "sortie" })}>
        <g transform="translate(318 612)">
          <g {...a("flotte", { dy: 2.5, r: 2, t: 0.5 })}><Tortue /></g>
        </g>
      </g>
      {/* Une bouteille à la mer : personne ne la lira */}
      <g {...a("flotte", { dy: 3, r: 5, t: 1.6 })}>
        <rect x="26" y="650" width="26" height="11" rx="5" transform="rotate(-18 39 655)" fill={C.persClair} fillOpacity="0.8" />
        <rect x="50" y="645" width="6" height="6" transform="rotate(-18 53 648)" fill={C.bois} />
      </g>
      <path d={vagues(662, 80, 5)} fill={LAGON} fillOpacity="0.85" {...a("defile", { dx: -80, t: 3 })} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Un train de légende rien que pour toi : douze wagons bleu nuit sur le viaduc, et une
// seule fenêtre allumée.

/** Un wagon : bleu nuit, bandeau crème, liseré d'or. Posé sur le rail en (0, 0), long de 150. `allume` : la fenêtre du voyageur. */
function Wagon({ children }: { children?: ReactNode }) {
  return (
    <>
      <rect x="2" y="-52" width="146" height="44" rx="6" fill={C.marine} />
      <rect x="2" y="-44" width="146" height="20" fill={C.creme} />
      <path d="M2 -46H148M2 -22H148" fill="none" stroke={METAL.or} strokeWidth="2" />
      <path d="M12 -41h18v14H12ZM38 -41h18v14H38ZM94 -41h18v14H94ZM120 -41h18v14h-18Z" fill="#1B2440" />
      <rect x="62" y="-42" width="26" height="16" rx="2" fill="#1B2440" />
      {children}
      <path d={ronds(7, [[26, -4], [46, -4], [104, -4], [124, -4]])} fill={C.noir} />
      <path d="M-4 -12H6" fill="none" stroke={C.grisFonce} strokeWidth="3" />
    </>
  );
}

const train: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="train" couleurs={["#252562", "#74499A", "#EE866A", "#FBCB8E"]} bas={560} />
    <Etoiles points={[[40, 140], [110, 190], [190, 130], [270, 180], [330, 140], [70, 250]]} brillantes={[[300, 230, 6], [150, 220, 5]]} />
    <path d="M300 300A26 26 0 1 0 322 344A21 21 0 1 1 300 300Z" fill={C.ivoire} />
    {/* Les montagnes, la vallée */}
    <path d="M-20 560L60 420L110 480L170 380L250 520L300 460L380 560Z" fill="#5B4A8E" />
    <path d="M170 380L196 426L180 420L168 436L152 416Z" fill="#E6D9F0" />
    <path d={relief([[-20, 600], [100, 560], [220, 596], [380, 556]])} fill="#443776" />
    <rect x="-20" y="690" width="400" height="130" fill="#2B2260" />
    <path d="M120 706H180L186 702L192 706H250V709H120Z" fill="#74499A" {...a("clignote", { t: 1.4, o0: 0.4 })} />
    {/* Le viaduc */}
    <path d="M-20 580H380V720H346V640A30 30 0 0 0 286 640V720H254V640A30 30 0 0 0 194 640V720H162V640A30 30 0 0 0 102 640V720H70V640A30 30 0 0 0 10 640V720H-20Z" fill="#D8C7B0" />
    <path d="M-20 580H380V590H-20Z" fill="#B9A58C" />
    {/* Le train entre sur le viaduc, et s'arrête */}
    <g {...a("va", { dx: -640, t: 4.6, e: "cubic-bezier(.1,.6,.2,1)" })}>
      <g transform="translate(0 580)">
        <g transform="translate(-196 0)"><Wagon /></g>
        <g transform="translate(-46 0)">
          <Wagon>
            <rect x="62" y="-42" width="26" height="16" rx="2" fill={C.mimosa} />
            <Fenetre x={62} y={-42} l={26} h={16} rx={2}>
              <g transform={tf(58.2, -55, 0.12)}><Tete espece={espece} look={look} /></g>
            </Fenetre>
          </Wagon>
        </g>
        <g transform="translate(104 0)"><Wagon /></g>
        {/* La locomotive */}
        <g transform="translate(254 0)">
          <path d="M4 -52H40V-8H4Z" fill={C.marine} />
          <path d="M10 -46H34V-32H10Z" fill={C.mimosa} />
          <path d="M40 -42H92Q100 -42 100 -30V-8H40Z" fill="#1B2440" />
          <path d="M40 -26H100" fill="none" stroke={METAL.or} strokeWidth="2.4" />
          <rect x="76" y="-60" width="12" height="20" fill="#1B2440" />
          <rect x="72" y="-64" width="20" height="6" rx="2" fill={METAL.or} />
          <path d="M100 -12L112 -4H100Z" fill={C.cerise} />
          <circle cx="98" cy="-34" r="4" fill={C.mimosa} />
          {[[22, -6, 9], [56, -10, 13], [84, -10, 13]].map(([x, y, r]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <g {...a("tourne", { t: 0.46, n: 9 })}>
                <circle r={r} fill={C.noir} />
                <path d={`M${-r! + 2} 0H${r! - 2}M0 ${-r! + 2}V${r! - 2}`} fill="none" stroke={C.cerise} strokeWidth="2.4" />
              </g>
            </g>
          ))}
          {/* La vapeur */}
          <g fill={C.blanc} fillOpacity="0.85">
            <circle cx="82" cy="-74" r="9" {...a("passe", { fx: -60, fy: -70, t: 1.6, n: "inf" })} />
            <circle cx="82" cy="-74" r="12" {...a("passe", { fx: -80, fy: -90, t: 1.6, d: 0.5, n: "inf" })} />
            <circle cx="82" cy="-74" r="7" {...a("passe", { fx: -50, fy: -60, t: 1.6, d: 1, n: "inf" })} />
          </g>
          <path d={ronds(10, [[60, -92]]) + ronds(14, [[38, -112]]) + ronds(9, [[18, -128]])} fill={C.blanc} fillOpacity="0.7" />
        </g>
      </g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Un film dont tu es la vedette : le clap claque, les projecteurs cherchent, et il n'y en
// a que pour toi.

const film: SceneArt = ({ espece, look }) => {
  const trous = (y: number) => {
    let d = "";
    for (let x = -60; x < 440; x += 30) d += `M${x} ${y}h14v10h-14Z`;
    return d;
  };
  return (
    <>
      {/* Le rideau de velours, la scène */}
      <rect x="-20" y="-20" width="400" height="840" fill={C.bordeaux} />
      <path d="M20 0V560M70 0V560M120 0V560M170 0V560M220 0V560M270 0V560M320 0V560" fill="none" stroke={shade(C.bordeaux, -0.28)} strokeWidth="12" />
      <path d="M-20 150Q80 210 180 160Q280 210 380 150V-20H-20Z" fill={shade(C.bordeaux, 0.18)} />
      <path d="M-20 150Q80 210 180 160Q280 210 380 150" fill="none" stroke={METAL.or} strokeWidth="5" />
      <rect x="-20" y="560" width="400" height="260" fill={C.boisFonce} />
      <path d="M-20 560H380V568H-20ZM60 568V800M160 568V800M260 568V800" fill="none" stroke={shade(C.boisFonce, -0.3)} strokeWidth="3" />
      {/* Les projecteurs cherchent la vedette */}
      <g {...a("flotte", { r: 9, t: 1.7, o: [20, 150] })}><path d="M20 150L110 600H250Z" fill={C.mimosa} fillOpacity="0.2" /></g>
      <g {...a("flotte", { r: -9, t: 1.9, o: [340, 150] })}><path d="M340 150L110 600H250Z" fill={C.ivoire} fillOpacity="0.2" /></g>
      {/* L'estrade : une étoile */}
      <g transform="translate(180 590) scale(1 0.34)"><path d={etoile5(0, 0, 118)} fill={METAL.or} /></g>
      {/* La vedette */}
      <g {...a("va", { dy: 30, o0: 0, t: 0.7, d: 1.5 })}>
        <g {...a("saut", { dy: -8, t: 0.7 })}>
          <g transform={tf(113, 372, 0.335)}>
            <Perso espece={espece} look={look} bras={[40, 158]} jambes={[10, 10]} salut />
          </g>
        </g>
      </g>
      {/* La statuette */}
      <g {...a("pop", { t: 0.5, d: 5.7, o: "50% 100%" })}>
        <path d="M70 590H106V580H70ZM78 580H98V566H78Z" fill={C.noir} />
        <path d="M82 566Q78 530 88 520Q98 530 94 566Z" fill={METAL.or} />
        <circle cx="88" cy="512" r="8" fill={METAL.or} />
        <path d={etoiles([[88, 486, 11]])} fill={C.ivoire} />
      </g>
      {/* La caméra tourne */}
      <g transform="translate(294 560)">
        <path d="M0 0L-22 60M0 0L22 60M0 0V60" fill="none" stroke={C.noir} strokeWidth="5" strokeLinecap="round" />
        <rect x="-36" y="-44" width="64" height="44" rx="6" fill={C.noir} />
        <path d="M-36 -32H-58V-12H-36Z" fill={C.grisFonce} />
        <circle cx="-60" cy="-22" r="9" fill={C.ciel} />
        {[[-18, -58], [14, -62]].map(([x, y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <g {...a("tourne", { t: 1.4 })}>
              <circle r="17" fill={C.grisFonce} />
              <path d={ronds(4, [[0, -9], [8, 5], [-8, 5]])} fill={C.noir} />
            </g>
          </g>
        ))}
        <circle cx="18" cy="-12" r="3.5" fill={C.cerise} {...a("clignote", { t: 0.5, o0: 0.2 })} />
      </g>
      {/* Les flashs des photographes */}
      <path d={etoiles([[52, 300, 26]])} fill={C.blanc} {...a("eclat", { t: 0.45, d: 3.9, o: [52, 300] })} />
      <path d={etoiles([[318, 380, 30]])} fill={C.blanc} {...a("eclat", { t: 0.45, d: 4.5, o: [318, 380] })} />
      <path d={etoiles([[92, 430, 22]])} fill={C.blanc} {...a("eclat", { t: 0.45, d: 5.1, o: [92, 430] })} />
      <path d={etoiles([[40, 250, 9], [316, 286, 12], [286, 214, 8], [70, 344, 7], [330, 470, 8]])} fill={C.mimosa} {...a("pop", { t: 0.5, d: 6 })} />
      {/* La pellicule, en haut et en bas, qui défile */}
      <rect x="-20" y="84" width="400" height="34" fill={C.noir} />
      <rect x="-20" y="672" width="400" height="34" fill={C.noir} />
      <path d={trous(96) + trous(684)} fill={C.ivoire} {...a("defile", { dx: -30, t: 0.35 })} />
      {/* Le clap : il claque, et le film commence */}
      <g {...a("sort", { dy: 620, r: 14, t: 0.6, d: 1.4, e: "entree" })}>
        <rect x="56" y="330" width="248" height="170" rx="8" fill={C.noir} />
        <path d="M76 372H284M76 410H200M76 448H240" fill="none" stroke={C.gris} strokeWidth="8" strokeLinecap="round" />
        <rect x="56" y="330" width="248" height="14" fill={C.blanc} />
        <path d="M70 330H98L88 344H60ZM126 330H154L144 344H116ZM182 330H210L200 344H172ZM238 330H266L256 344H228Z" fill={C.noir} />
        <g {...a("va", { r: -30, t: 0.16, d: 0.8, e: "entree", o: [60, 326] })}>
          <rect x="56" y="300" width="252" height="28" rx="5" fill={C.blanc} />
          <path d="M76 300H110L94 328H60ZM144 300H178L162 328H128ZM212 300H246L230 328H196ZM280 300H306V310L296 328H264Z" fill={C.noir} />
        </g>
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------
// Une descente dans la fosse des Mariannes : la lumière s'en va, les lanternes vivantes
// s'allument, et tout au fond, dans le faisceau du projecteur… un ticket.

const NOIR_ABYSSE = "#030B1E";

/** Une méduse, qui pulse. Centrée en (0, 0). */
function Meduse({ couleur, d = 0 }: { couleur: string; d?: number }) {
  return (
    <g {...a("flotte", { dy: 7, t: 1.5, d })}>
      <path d="M-10 4q-4 14 2 26M-2 4q4 16 -2 30M8 4q6 12 2 26" fill="none" stroke={couleur} strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-18 4Q-18 -18 0 -18Q18 -18 18 4Q9 9 0 5Q-9 9 -18 4Z" fill={couleur} fillOpacity="0.85" {...a("pulse", { s0: 0.9, s: 1.08, t: 0.75, d, o: "50% 100%" })} />
    </g>
  );
}

const abysses: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="abysses" couleurs={["#0A3663", "#051C3C", NOIR_ABYSSE]} />
    {/* La lumière du jour reste en haut : on la quitte */}
    <g {...a("sort", { dy: -760, t: 4.2, d: 0.4, e: "cubic-bezier(.4,0,.6,1)" })}>
      <rect x="-20" y="-20" width="400" height="640" fill="#2E90C2" fillOpacity="0.6" />
      <path d={vagues(100, 90, 7, -30)} fill="#9BE0EE" fillOpacity="0.7" />
      <path d="M40 420Q70 404 110 410Q150 392 190 412Q150 432 110 426Q70 438 40 420ZM186 412L214 396V428Z" fill="#0A3663" fillOpacity="0.5" />
      <path d={ronds(3, [[70, 300], [230, 360], [300, 250], [150, 520]])} fill={C.blanc} fillOpacity="0.5" />
    </g>
    {/* La neige marine remonte : c'est nous qui descendons */}
    <g {...a("disparait", { t: 0.8, d: 5 })}>
      <g fill={C.blanc} fillOpacity="0.5">
        <circle cx="50" cy="820" r="2.4" {...a("passe", { fy: -860, t: 1.3, n: "inf" })} />
        <circle cx="130" cy="820" r="1.8" {...a("passe", { fy: -860, t: 1.1, d: 0.4, n: "inf" })} />
        <circle cx="220" cy="820" r="2.6" {...a("passe", { fy: -860, t: 1.5, d: 0.2, n: "inf" })} />
        <circle cx="300" cy="820" r="2" {...a("passe", { fy: -860, t: 1.2, d: 0.7, n: "inf" })} />
        <circle cx="340" cy="820" r="1.6" {...a("passe", { fy: -860, t: 1, d: 0.9, n: "inf" })} />
      </g>
    </g>
    <path d={ronds(1.6, [[44, 250], [120, 330], [300, 290], [330, 420], [60, 470], [250, 200]])} fill={C.blanc} fillOpacity="0.35" />
    {/* Les méduses, qu'on croise en chemin */}
    <g {...a("va", { dy: 520, t: 4.4, d: 1.4, e: "sortie" })}>
      <g transform="translate(56 300)"><Meduse couleur={C.bougClair} /></g>
      <g transform="translate(312 246) scale(0.8)"><Meduse couleur={C.lilas} d={-0.5} /></g>
    </g>
    {/* Le fond arrive : la roche, une cheminée qui fume, et sur le sable… */}
    <g {...a("va", { dy: 300, t: 2.4, d: 4.8, e: "sortie" })}>
      <path d={relief([[-20, 612], [70, 588], [170, 610], [280, 584], [380, 606]])} fill="#1B2A44" />
      <path d="M-20 640L30 560L64 600L90 640ZM290 630L326 540L352 586L380 560V640Z" fill="#0E1930" />
      <path d="M318 600V560Q318 548 328 548Q338 548 338 560V600Z" fill="#2A3A58" />
      <g fill="#5B6B88" fillOpacity="0.7">
        <circle cx="328" cy="540" r="8" {...a("passe", { fy: -90, fx: 10, t: 2, n: "inf" })} />
        <circle cx="328" cy="540" r="6" {...a("passe", { fy: -90, fx: -8, t: 2, d: 1, n: "inf" })} />
      </g>
      <path d="M36 606V582M44 606V574M52 606V586" fill="none" stroke={C.cerise} strokeWidth="5" strokeLinecap="round" />
      <path d={ronds(3, [[36, 580], [44, 572], [52, 584]])} fill={C.bougClair} />
      {/* Le ticket */}
      <g transform="translate(188 596) rotate(-10) scale(1.5)">
        <rect x="-15" y="-8.5" width="30" height="20" rx="2.5" fill={C.mimosaFonce} />
        <rect x="-15" y="-10" width="30" height="20" rx="2.5" fill={C.mimosa} />
        <rect x="-11" y="-6" width="15" height="12" rx="1.5" fill={C.creme} />
        <path d="M8 -9V9" fill="none" stroke={C.nuit} strokeWidth="1" strokeDasharray="1.8 2" />
        <circle cx="11.5" cy="0" r="1.6" fill={C.nuit} />
      </g>
      <path d={etoiles([[216, 572, 9]])} fill={C.blanc} {...a("clignote", { t: 0.7, o0: 0.2 })} />
      {/* La baudroie, curieuse, sa lanterne au-dessus du ticket */}
      <g {...a("va", { dx: 180, t: 1.6, d: 6.2, e: "sortie" })}>
        <g {...a("flotte", { dy: 3, t: 1.3 })}>
          <path d="M300 560L326 544V582Z" fill="#33405F" />
          <ellipse cx="282" cy="562" rx="30" ry="22" fill="#33405F" />
          <path d="M254 568L262 560L268 570L274 560L280 570L286 562L290 572Q270 584 254 568Z" fill={C.ivoire} />
          <circle cx="268" cy="552" r="5.5" fill={C.ivoire} />
          <circle cx="267" cy="552" r="2.4" fill={C.nuit} />
          <path d="M276 542Q262 514 240 526" fill="none" stroke="#33405F" strokeWidth="3" strokeLinecap="round" />
          <circle cx="238" cy="528" r="14" fill={C.persClair} fillOpacity="0.3" {...a("pulse", { s0: 0.8, s: 1.2, t: 0.8 })} />
          <circle cx="238" cy="528" r="6" fill={C.persClair} />
        </g>
      </g>
    </g>
    {/* Le bathyscaphe descend, son projecteur allumé */}
    <g {...a("va", { dy: -420, t: 2.6, e: "sortie" })}>
      <g transform="translate(150 430)">
        <g {...a("flotte", { dy: 4, r: 1.5, t: 2 })}>
          <path d="M22 44L-14 180H104Z" fill={C.mimosa} fillOpacity="0.2" />
          <path d="M-70 -12H-52V12H-70Z" fill={C.gris} />
          <g transform="translate(-76 0)"><path d="M-3 -20Q4 -10 -3 0Q4 10 -3 20Q-10 10 -3 0Q-10 -10 -3 -20Z" fill={C.grisClair} {...a("pulse", { s0: 1, s: 0.2, t: 0.2, o: "50% 50%" })} /></g>
          <rect x="-22" y="-74" width="44" height="18" rx="5" fill={C.gris} />
          <path d="M-8 -86H8V-72H-8Z" fill={C.grisFonce} />
          <circle r="60" fill={C.mimosa} />
          <path d="M0 -60A60 60 0 0 1 0 60Q34 36 34 0Q34 -36 0 -60Z" fill={C.mimosaFonce} />
          <path d="M-58 16H58L52 30H-52Z" fill={C.cerise} />
          <circle r="34" fill={C.nuit} />
          <circle r="29" fill="#BEE7F5" />
          <Fenetre x={-29} y={-29} l={58} h={58} rx={29}>
            <g transform={tf(-39, -46, 0.28)}><Tete espece={espece} look={look} /></g>
          </Fenetre>
          <path d="M-20 -16A26 26 0 0 1 -4 -24" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="4" strokeLinecap="round" />
          <path d={ronds(3.4, [[-46, -22], [46, -22], [-46, 4], [46, 4]])} fill={C.mimosaFonce} />
          <path d="M14 46L30 40L34 52L18 58Z" fill={C.gris} />
          <circle cx="26" cy="50" r="6" fill={C.ivoire} />
        </g>
        {/* Ses bulles */}
        <g fill={C.blanc} fillOpacity="0.6">
          <circle cx="-66" cy="-30" r="5" {...a("passe", { fy: -160, fx: 8, t: 1.6, n: "inf" })} />
          <circle cx="-60" cy="-30" r="3.5" {...a("passe", { fy: -180, fx: -10, t: 1.9, d: 0.6, n: "inf" })} />
        </g>
      </g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Un parc d'attractions pour toi tout seul : la grande roue tourne à vide, la file
// d'attente est déserte, et le grand huit boucle sa boucle avec un seul passager.

/** Le centre et le rayon de la grande roue, puis de la boucle du grand huit. */
const RX = 112;
const RY = 330;
const RR = 112;
const BX = 232;
const BY = 486;
const BR = 74;

/** De combien la grande roue tourne pendant le film, en degrés. */
const TOUR = 150;
const VITESSE_ROUE = { t: 8, e: "lin" } as const;

const parc: SceneArt = ({ espece, look }) => {
  const nacelles = [0, 45, 90, 135, 180, 225, 270, 315];
  const teintes = [C.bougainvillier, C.mimosa, C.persClair, C.ciel];
  return (
    <>
      <Ciel id="parc" couleurs={["#17113F", "#35206D", "#763A8C"]} bas={640} />
      <Etoiles points={[[30, 130], [200, 150], [270, 120], [330, 200], [300, 300], [20, 240]]} brillantes={[[250, 190, 7], [330, 130, 6]]} />
      {/* La grande roue : elle tourne à vide */}
      <path d={`M${RX} ${RY}L${RX - 62} 640H${RX - 48}L${RX} ${RY + 30}L${RX + 48} 640H${RX + 62}Z`} fill="#C9BEE6" />
      <g {...a("va", { r: -TOUR, ...VITESSE_ROUE, o: [RX, RY] })}>
        <circle cx={RX} cy={RY} r={RR} fill="none" stroke={C.mimosa} strokeWidth="5" />
        <circle cx={RX} cy={RY} r={RR - 20} fill="none" stroke={C.mimosa} strokeOpacity="0.6" strokeWidth="2" />
        {nacelles.map((angle, i) => (
          <g key={angle} transform={`rotate(${angle} ${RX} ${RY})`}>
            <path d={`M${RX} ${RY}V${RY - RR}`} fill="none" stroke={C.mimosa} strokeWidth="2.4" />
            <circle cx={RX} cy={RY - RR} r="4.5" fill={C.ivoire} {...a("clignote", { t: 0.5, d: -i * 0.12, o0: 0.3 })} />
            {/* La nacelle reste d'aplomb : elle tourne à l'envers de la roue */}
            <g transform={`rotate(${-angle} ${RX} ${RY - RR})`}>
              <g {...a("va", { r: TOUR, ...VITESSE_ROUE, o: [RX, RY - RR] })}>
                <path d={`M${RX} ${RY - RR}v10`} fill="none" stroke={C.ivoire} strokeWidth="2" />
                <path d={`M${RX - 15} ${RY - RR + 10}h30v8q0 12 -15 12q-15 0 -15 -12Z`} fill={teintes[i % 4]} />
                <rect x={RX - 12} y={RY - RR + 13} width="24" height="7" rx="2" fill="#17113F" />
              </g>
            </g>
          </g>
        ))}
        <circle cx={RX} cy={RY} r="12" fill={C.ivoire} />
      </g>
      {/* La guirlande d'ampoules */}
      <path d="M-20 170Q90 230 180 180Q270 230 380 170" fill="none" stroke={C.nuit} strokeWidth="1.5" />
      {[[10, 187], [46, 200], [84, 204], [122, 199], [156, 188], [204, 188], [238, 199], [276, 204], [314, 200], [350, 187]].map(([x, y], i) => (
        <circle key={x} cx={x} cy={y! + 5} r="5" fill={teintes[i % 4]} {...a("clignote", { t: 0.6, d: -(i % 3) * 0.2, o0: 0.35 })} />
      ))}
      {/* Le sol du parc, le stand de barbe à papa */}
      <rect x="-20" y="636" width="400" height="184" fill="#2A1B5A" />
      <path d="M278 640V592H346V640Z" fill={C.ivoire} />
      <path d="M268 592Q312 560 356 592Z" fill={C.bougainvillier} />
      <path d="M290 592Q301 574 312 566Q312 580 312 592ZM334 592Q323 574 312 566V592Z" fill={C.ivoire} />
      <path d="M300 640V612M324 640V618" fill="none" stroke={C.bois} strokeWidth="3" />
      <ellipse cx="300" cy="604" rx="12" ry="14" fill={C.bougClair} />
      <ellipse cx="324" cy="610" rx="10" ry="12" fill={C.ciel} />
      {/* Le grand huit : ses rails, sa boucle */}
      <path d={`M-20 ${BY + BR}H380`} fill="none" stroke="#C9BEE6" strokeWidth="5" />
      <path d={`M40 ${BY + BR}V640M120 ${BY + BR}V640M${BX} ${BY + BR}V640M340 ${BY + BR}V640`} fill="none" stroke="#8E7FC0" strokeWidth="4" />
      <circle cx={BX} cy={BY} r={BR} fill="none" stroke="#C9BEE6" strokeWidth="5" />
      <circle cx={BX} cy={BY} r={BR - 9} fill="none" stroke="#8E7FC0" strokeWidth="2" />
      {/* Le wagonnet et son unique passager : deux tours et demi, et l'on s'arrête la tête en bas */}
      <g transform={`rotate(180 ${BX} ${BY})`}>
        <g {...a("va", { r: -900, t: 6.8, e: "cubic-bezier(.45,0,.4,1)", o: [BX, BY] })}>
          <g transform={`translate(${BX} ${BY + BR - 10})`}>
            <g transform={tf(-23.5, -58, 0.168)}><Tete espece={espece} look={look} /></g>
            <path d="M-26 -22L-34 -40M26 -22L34 -40" fill="none" stroke={pelageDe(espece)} strokeWidth="6" strokeLinecap="round" />
            <path d="M-30 -22H30V-4Q30 4 22 4H-22Q-30 4 -30 -4Z" fill={C.cerise} />
            <path d="M-30 -22H30V-15H-30Z" fill={C.mimosa} />
            <path d={ronds(5, [[-16, 4], [16, 4]])} fill={C.noir} />
          </g>
        </g>
      </g>
      {/* La file d'attente : personne */}
      <path d="M20 700H200M200 700V730M200 730H40M40 730V760M40 760H220" fill="none" stroke={C.cerise} strokeWidth="4" strokeLinecap="round" />
      <path d={ronds(5, [[20, 696], [80, 696], [140, 696], [200, 696], [200, 726], [140, 726], [80, 726], [40, 726], [40, 756], [100, 756], [160, 756], [220, 756]])} fill={METAL.or} />
      <path d="M20 700V712M80 700V712M140 700V712M200 700V712M200 730V742M140 730V742M80 730V742M40 730V742M40 760V772M100 760V772M160 760V772M220 760V772" fill="none" stroke={METAL.or} strokeWidth="3" />
    </>
  );
};

export const SCENES_FOLIES: Record<string, SceneArt> = {
  everest,
  "ile-deserte": ileDeserte,
  train,
  film,
  abysses,
  parc,
};
