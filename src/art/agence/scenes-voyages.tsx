// Les films de l'Agence Carpe Diem, chapitre « Les grands voyages » : le roadtrip en
// Australie, le Japon et la Corée, le safari photo, les aurores boréales, la traversée de
// l'Atlantique, le tour du monde et l'expédition chez les manchots.
//
// Une scène se dessine dans le <svg> du film (viewBox 0 0 360 800 ; voir ./kit.tsx pour le
// cadre, le style et le mouvement). Chaque élément est posé là où il sera sur la carte
// postale : sans animation, le dessin est l'image de la fin.

import type { ReactNode } from "react";
import { C, shade } from "../kit";
import {
  Astre, Buste, Ciel, Etoiles, Fenetre, Mouette, Perso, Tete, a, etoiles, nuage, relief, ronds, tf, vagues, type SceneArt,
} from "./kit";

// ---------------------------------------------------------------------------
// Un roadtrip en Australie : la camionnette file sur la piste rouge, la planche sur le
// toit, et les kangourous lui font la course. Ils ont la priorité.

const ROUX = "#9A5B3C";

/** Un kangourou, de profil, qui regarde à droite. Posé sur ses pattes en (0, 0), haut de 92. */
function Kangourou({ petit = false }: { petit?: boolean }) {
  return (
    <>
      <path d="M-10 -32Q-36 -26 -50 -2L-43 0Q-30 -16 -8 -20Z" fill={shade(ROUX, -0.18)} />
      <path d="M-14 -36Q-12 -60 14 -68Q30 -70 34 -58Q30 -42 16 -30Q2 -22 -14 -36Z" fill={ROUX} />
      <path d="M-10 -32Q4 -36 10 -22L8 -6L26 -3V2H2L-3 -15Z" fill={shade(ROUX, -0.18)} />
      <path d="M22 -64Q30 -78 40 -80L53 -74Q55 -68 47 -66L34 -59Z" fill={ROUX} />
      <path d="M36 -80L33 -95L41 -82ZM41 -80L45 -93L47 -79Z" fill={shade(ROUX, -0.18)} />
      <path d="M24 -54L37 -45L35 -41L22 -47Z" fill={shade(ROUX, -0.18)} />
      <path d="M2 -34Q12 -44 24 -44Q22 -32 10 -27Z" fill={C.creme} />
      <circle cx="44.5" cy="-74.5" r="1.9" fill={C.nuit} />
      {petit && (
        <>
          <path d="M10 -38Q10 -48 18 -48Q25 -47 24 -38Z" fill={shade(ROUX, 0.2)} />
          <path d="M13 -47L12 -55L17 -48ZM20 -48L23 -55L23 -46Z" fill={shade(ROUX, 0.2)} />
          <circle cx="20" cy="-43" r="1.3" fill={C.nuit} />
        </>
      )}
    </>
  );
}

/** Une touffe d'herbe à porc-épic. Plantée en (0, 0). */
const SPINIFEX = "M0 0L-10 -14M0 0L-4 -18M0 0L4 -17M0 0L11 -12M0 0L-14 -6M0 0L15 -5";

const australie: SceneArt = ({ espece, look }) => (
    <>
      <Ciel id="australie" couleurs={["#E36F3A", "#F5A54C", "#FCE0A0"]} bas={480} />
      <Astre x={262} y={248} r={40} couleur="#FFEDB0" halo="#FFE08A" />
      <g transform="translate(40 300) scale(0.7)"><g {...a("va", { dx: -90, t: 8, e: "lin" })}><Mouette couleur="#7A2E1C" /></g></g>
      {/* Le grand rocher rouge */}
      <path d="M30 482Q44 408 104 398H252Q316 404 330 482Z" fill="#B5472E" />
      <path d="M252 398Q316 404 330 482H286Q292 428 252 398Z" fill="#8F3622" />
      <path d="M96 404Q90 440 94 480M140 399Q134 436 138 480M186 399Q182 440 186 480M230 399Q232 440 228 480" fill="none" stroke="#8F3622" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
      {/* Le désert, qui défile */}
      <rect x="-20" y="478" width="400" height="342" fill="#C9623F" />
      <g {...a("defile", { dx: -240, t: 2.4 })}>
        {[-240, 0, 240, 480].map((x) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <path d={SPINIFEX} transform="translate(30 520)" fill="none" stroke={C.olive} strokeWidth="3" strokeLinecap="round" />
            <path d={SPINIFEX} transform="translate(170 506) scale(0.8)" fill="none" stroke={C.olive} strokeWidth="3" strokeLinecap="round" />
            <path d="M92 512Q96 492 104 492Q112 494 114 512Z" fill="#A8452E" />
          </g>
        ))}
      </g>
      {/* Les kangourous : ils doublent */}
      <g {...a("va", { dx: -420, t: 4.6, d: 0.8, e: "cubic-bezier(.3,.6,.4,1)" })}>
        <g transform="translate(300 552)"><g {...a("saut", { dy: -40, t: 0.56 })}><Kangourou petit /></g></g>
      </g>
      <g {...a("va", { dx: -420, t: 4.6, d: 1.5, e: "cubic-bezier(.3,.6,.4,1)" })}>
        <g transform="translate(222 548) scale(0.84)"><g {...a("saut", { dy: -44, t: 0.5, d: -0.2 })}><Kangourou /></g></g>
      </g>
      <g {...a("va", { dx: -420, t: 4.6, d: 2.3, e: "cubic-bezier(.3,.6,.4,1)" })}>
        <g transform="translate(158 544) scale(0.7)"><g {...a("saut", { dy: -42, t: 0.46, d: -0.1 })}><Kangourou /></g></g>
      </g>
      {/* La piste */}
      <rect x="-20" y="566" width="400" height="74" fill="#5B4A44" />
      <rect x="-20" y="566" width="400" height="4" fill="#E9A56B" />
      <rect x="-20" y="636" width="400" height="4" fill="#E9A56B" />
      <path d="M-160 601h44v5h-44ZM-80 601h44v5h-44ZM0 601h44v5H0ZM80 601h44v5H80ZM160 601h44v5h-44ZM240 601h44v5h-44ZM320 601h44v5h-44ZM400 601h44v5h-44Z" fill={C.ivoire} {...a("defile", { dx: -80, t: 0.5 })} />
      {/* La camionnette */}
      <g {...a("va", { dx: -340, t: 3, e: "sortie" })}>
        <g transform="translate(118 628)">
          <g {...a("flotte", { dy: 1.6, t: 0.16 })}>
            {/* La galerie : la planche, la valise, et un koala qui s'y cramponne */}
            <path d="M-72 -96H70" fill="none" stroke={C.grisFonce} strokeWidth="3" strokeLinecap="round" />
            <path d="M-84 -104Q-10 -116 78 -104Q-10 -98 -84 -104Z" fill={C.bougainvillier} />
            <path d="M-84 -104Q-10 -110 78 -104" fill="none" stroke={C.ivoire} strokeWidth="2" />
            <rect x="-56" y="-124" width="38" height="20" rx="3" fill={C.bois} />
            <path d="M-56 -116H-18" fill="none" stroke={C.boisFonce} strokeWidth="2" />
            <circle cx="-2" cy="-118" r="11" fill={C.gris} />
            <path d={ronds(5, [[-11, -127], [7, -127]])} fill={C.gris} />
            <ellipse cx="-2" cy="-115" rx="3.4" ry="4.4" fill={C.noir} />
            <path d={ronds(1.4, [[-7, -120], [3, -120]])} fill={C.nuit} />
            {/* La caisse : vert d'eau en bas, ivoire en haut */}
            <path d="M-88 -94Q-88 -98 -82 -98H50Q72 -96 84 -62V-22H-88Z" fill={C.ivoire} />
            <path d="M-88 -58H84V-18Q84 -12 78 -12H-82Q-88 -12 -88 -18Z" fill={C.persClair} />
            <path d="M-88 -58H84L80 -50H-88Z" fill={shade(C.persClair, -0.18)} />
            <path d="M52 -90Q66 -88 76 -62H40V-90Z" fill={C.ciel} />
            <rect x="-78" y="-90" width="34" height="26" rx="4" fill={C.ciel} />
            <rect x="-38" y="-90" width="34" height="26" rx="4" fill={C.ciel} />
            <rect x="0" y="-92" width="38" height="30" rx="4" fill={C.lagune} />
            <Fenetre x={0} y={-92} l={38} h={30} rx={4}>
              <g transform={tf(-5, -106, 0.17)}><Tete espece={espece} look={look} /></g>
            </Fenetre>
            <circle cx="76" cy="-40" r="7" fill={C.mimosa} />
            <rect x="84" y="-26" width="8" height="10" rx="2" fill={C.grisClair} />
            {/* Les roues */}
            {[-52, 46].map((x) => (
              <g key={x} transform={`translate(${x} -10)`}>
                <circle r="17" fill={C.noir} />
                <g {...a("tourne", { t: 0.4 })}>
                  <circle r="8.5" fill={C.grisClair} />
                  <path d="M-8 0H8M0 -8V8" fill="none" stroke={C.grisFonce} strokeWidth="2.4" />
                </g>
              </g>
            ))}
          </g>
          {/* La poussière de la piste */}
          <circle cx="-104" cy="-8" r="13" fill="#E9A56B" {...a("eclat", { t: 0.7, n: "inf" })} />
          <circle cx="-126" cy="-18" r="17" fill="#E9A56B" {...a("eclat", { t: 0.7, d: 0.3, n: "inf" })} />
        </g>
      </g>
      {/* Le panneau : priorité aux kangourous */}
      <rect x="318" y="556" width="5" height="84" fill={C.grisFonce} />
      <path d="M320.5 508L352 540L320.5 572L289 540Z" fill={C.mimosa} />
      <path d="M320.5 514L346 540L320.5 566L295 540Z" fill="none" stroke={C.noir} strokeWidth="2.4" />
      <g transform="translate(316 553) scale(0.28)" fill={C.noir}>
        <path d="M-10 -32Q-36 -26 -50 -2L-43 0Q-30 -16 -8 -20ZM-14 -36Q-12 -60 14 -68Q30 -70 34 -58Q30 -42 16 -30Q2 -22 -14 -36ZM-10 -32Q4 -36 10 -22L8 -6L26 -3V2H2L-3 -15ZM22 -64Q30 -78 40 -80L53 -74Q55 -68 47 -66L34 -59ZM36 -80L33 -95L41 -82ZM41 -80L45 -93L47 -79Z" />
      </g>
      {/* Le premier plan */}
      <path d={relief([[-20, 690], [120, 676], [260, 694], [380, 680]])} fill="#A8452E" />
      <path d={SPINIFEX} transform="translate(60 690) scale(1.3)" fill="none" stroke={C.olive} strokeWidth="3" strokeLinecap="round" />
      <path d={SPINIFEX} transform="translate(250 700) scale(1.5)" fill="none" stroke={C.olive} strokeWidth="3" strokeLinecap="round" />
    </>
);

// ---------------------------------------------------------------------------
// Un voyage au Japon et en Corée : le mont Fuji et son torii d'un côté, la porte d'un
// palais et ses lanternes de l'autre, et entre les deux un train qui file sous les cerisiers.

/** Les pétales qui tombent : [x, y de départ, durée, décalage]. */
const PETALES: readonly (readonly [number, number, number, number])[] = [
  [20, 150, 4.2, 0], [70, 120, 5, 1.2], [128, 170, 4.6, 2.3], [182, 110, 5.4, 0.6], [226, 160, 4.4, 3], [44, 210, 5.2, 3.6],
];

const japonCoree: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="japon" couleurs={["#F2B8CC", "#FAD9D6", "#FFF3DF"]} bas={520} />
    {/* Le soleil rouge, le mont Fuji */}
    <circle cx="232" cy="318" r="36" fill="#EE6A5D" />
    <path d="M-30 524L112 286Q122 276 132 286L276 524Z" fill="#8E9AC9" />
    <path d="M112 286Q122 276 132 286L162 336L148 328L136 346L122 326L108 346L96 330L82 338Z" fill={C.blanc} />
    {/* La colline de Séoul et sa tour */}
    <path d={relief([[200, 524], [262, 470], [316, 430], [380, 476]], 524)} fill="#7FB98D" />
    <path d="M314 432V352H320V432Z" fill={C.grisClair} />
    <path d="M306 372Q317 358 328 372V384H306Z" fill={C.ivoire} />
    <path d="M316 352V326H318V352Z" fill={C.cerise} />
    <circle cx="317" cy="324" r="3" fill={C.cerise} {...a("clignote", { t: 0.7 })} />
    {/* Le pré, la voie */}
    <rect x="-20" y="520" width="400" height="300" fill="#CFE3B4" />
    <path d={relief([[-20, 668], [150, 652], [380, 672]])} fill="#B4D39A" />
    {/* Le torii */}
    <path d="M30 560V440H40V560ZM88 560V440H98V560ZM24 458H104V466H24Z" fill={C.cerise} />
    <path d="M14 426Q64 438 114 426V438Q64 450 14 438Z" fill={C.cerise} />
    <path d="M14 426Q64 438 114 426V431Q64 443 14 431Z" fill={C.nuit} />
    {/* La porte du palais : socle de pierre, colonnes rouges, toit retroussé */}
    <path d="M250 560V508H350V560ZM284 560V532Q300 516 316 532V560Z" fill={C.pierre} fillRule="evenodd" />
    <path d="M262 508V472H270V508ZM330 508V472H338V508ZM294 508V472H306V508Z" fill={C.cerise} />
    <rect x="256" y="462" width="88" height="11" fill={C.persienne} />
    <path d="M262 467h6M276 467h6M290 467h6M304 467h6M318 467h6M332 467h6" fill="none" stroke={C.mimosa} strokeWidth="3" />
    <path d="M238 464Q300 454 362 464L374 438Q300 414 226 438Z" fill={C.ardoise} />
    <path d="M226 438L212 426L238 464ZM374 438L388 426L362 464Z" fill={C.ardoise} />
    <path d="M246 446Q300 430 354 446M256 432Q300 420 344 432" fill="none" stroke={shade(C.ardoise, -0.3)} strokeWidth="2" />
    <path d="M286 420Q300 410 314 420Z" fill={shade(C.ardoise, -0.3)} />
    {/* Les lanternes */}
    <path d="M196 214Q270 250 372 204" fill="none" stroke={C.nuit} strokeWidth="1.2" />
    {([[222, 228, C.bougClair, 0], [258, 240, C.mimosa, -0.3], [296, 238, C.persClair, -0.6], [334, 226, C.lilas, -0.9]] as const).map(([x, y, couleur, d]) => (
      <g key={x} {...a("flotte", { r: 7, t: 1.3, d, o: [x, y] })}>
        <ellipse cx={x} cy={y + 15} rx="11" ry="13" fill={couleur} />
        <rect x={x - 6} y={y} width="12" height="4" fill={C.nuit} />
        <rect x={x - 5} y={y + 27} width="10" height="3" fill={C.nuit} />
        <path d={`M${x} ${y + 30}v9`} fill="none" stroke={C.cerise} strokeWidth="1.6" />
      </g>
    ))}
    {/* Le train */}
    <rect x="-20" y="610" width="400" height="5" fill={C.gris} />
    <path d="M-10 615v8M30 615v8M70 615v8M110 615v8M150 615v8M190 615v8M230 615v8M270 615v8M310 615v8M350 615v8" fill="none" stroke={C.bois} strokeWidth="5" />
    <g {...a("va", { dx: -560, t: 2.8, d: 1.2, e: "cubic-bezier(.1,.7,.2,1)" })}>
      <path d="M-40 562H250Q310 566 344 600V606Q344 610 338 610H-40Z" fill={C.blanc} />
      <path d="M-40 588H326L340 598V606Q344 610 338 610H-40Z" fill={C.azur} />
      <path d="M-40 584H320L326 588H-40Z" fill={C.marine} />
      <path d="M262 568Q296 572 318 590H262Z" fill={C.nuit} />
      <path d={[-20, 16, 52, 88, 186, 222].map((x) => `M${x} 568h28v16h-28Z`).join("")} fill={C.nuit} />
      <rect x="126" y="563" width="54" height="27" rx="5" fill={C.ciel} />
      <Fenetre x={126} y={563} l={54} h={27} rx={5}>
        <g transform={tf(122.2, 540, 0.22)}><Tete espece={espece} look={look} /></g>
      </Fenetre>
      <path d="M-40 562V610" fill="none" stroke={C.grisClair} strokeWidth="2" />
      <path d="M84 562V588" fill="none" stroke={C.grisClair} strokeWidth="2" />
    </g>
    <g fill={C.blanc} {...a("disparait", { t: 0.4, d: 3.4 })}>
      <rect x="-40" y="574" width="120" height="3" rx="1.5" {...a("passe", { dx: 420, fx: -200, t: 0.5, d: 1.1, n: 5 })} />
      <rect x="-40" y="596" width="90" height="3" rx="1.5" {...a("passe", { dx: 440, fx: -160, t: 0.45, d: 1.3, n: 5 })} />
    </g>
    {/* Le cerisier, et ses pétales */}
    <path d="M-20 196Q40 214 84 180Q110 160 140 168" fill="none" stroke={C.boisFonce} strokeWidth="9" strokeLinecap="round" />
    <path d="M40 204Q60 230 84 232M84 180Q92 150 116 140" fill="none" stroke={C.boisFonce} strokeWidth="5" strokeLinecap="round" />
    <path d={ronds(17, [[8, 186], [46, 176], [86, 232], [118, 138], [142, 168]]) + ronds(13, [[26, 214], [66, 196], [100, 162], [62, 236], [-6, 216]])} fill={C.bougClair} />
    <path d={ronds(9, [[20, 178], [92, 222], [124, 150], [52, 188]])} fill="#FAD0DC" />
    <g fill={C.bougClair}>
      {PETALES.map(([x, y, t, d]) => (
        <ellipse key={x} cx={x} cy={y} rx="5" ry="3" {...a("passe", { fx: 110, fy: 420, r: 300, t, d, n: "inf" })} />
      ))}
      <path d="M150 300q6 -3 10 2q-6 3 -10 -2ZM204 392q6 -3 10 2q-6 3 -10 -2ZM58 352q6 -3 10 2q-6 3 -10 -2ZM232 500q6 -3 10 2q-6 3 -10 -2ZM120 470q6 -3 10 2q-6 3 -10 -2Z" />
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Un safari photo dans la savane : la jeep s'arrête, les éléphants défilent, on cadre… et
// la girafe se met devant.

const SAVANE = "#D9A441";
const ELEPHANT = "#75655A";
const GIRAFE = "#E9B95B";

/** Un acacia, en ombre chinoise. Planté en (0, 0), haut de 120. */
function Acacia() {
  return (
    <>
      <path d="M-4 0Q0 -50 -18 -84M2 0Q6 -46 28 -86M0 -40Q-2 -70 4 -92" fill="none" stroke="#4A3A2A" strokeWidth="6" strokeLinecap="round" />
      <path d="M-66 -86Q-40 -112 0 -108Q44 -116 70 -88Q40 -80 0 -84Q-40 -78 -66 -86Z" fill="#4A3A2A" />
      <path d="M-44 -98Q-20 -122 16 -118Q44 -120 56 -104Q20 -102 -44 -98Z" fill="#4A3A2A" />
    </>
  );
}

/** Un éléphant de profil, qui marche vers la droite. Posé en (0, 0), haut de 60. */
function Elephant() {
  return (
    <path
      d="M-40 0V-34Q-40 -58 -12 -58H14Q40 -58 44 -36Q50 -30 50 -12Q50 -2 44 0Q42 -8 44 -18Q38 -22 34 -18V0H22V-16H-14V0H-26V-18Q-30 -10 -30 0ZM-40 -40Q-46 -30 -44 -18L-41 -18Z"
      fill={ELEPHANT}
    />
  );
}

const safari: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="safari" couleurs={["#EE8F3F", "#F7BE60", "#FCE7A9"]} bas={500} />
    <Astre x={104} y={430} r={48} couleur="#FFEDB0" halo="#FFE08A" />
    <path d="M190 504Q232 440 262 430H314Q340 448 380 504Z" fill="#D99A5E" />
    <path d="M262 430H314L326 440L304 448L290 440L276 450Z" fill={C.blanc} fillOpacity="0.85" />
    <g transform="translate(56 256) scale(0.6)"><g {...a("va", { dx: -120, t: 8, e: "lin" })}><Mouette couleur="#7A3A1E" /></g></g>
    <g transform="translate(84 276) scale(0.5)"><g {...a("va", { dx: -130, t: 8, e: "lin" })}><Mouette couleur="#7A3A1E" /></g></g>
    {/* La savane, les acacias */}
    <rect x="-20" y="498" width="400" height="322" fill={SAVANE} />
    <g transform="translate(52 512)"><Acacia /></g>
    <g transform="translate(318 504) scale(0.62)"><Acacia /></g>
    {/* Les éléphants passent, à la queue leu leu */}
    <g {...a("va", { dx: -330, t: 7.2, e: "lin" })}>
      <g {...a("flotte", { dy: 1.5, t: 0.5 })}>
        <g transform="translate(246 540) scale(0.9)"><Elephant /></g>
        <g transform="translate(172 540) scale(0.72)"><Elephant /></g>
        <g transform="translate(118 540) scale(0.44)"><Elephant /></g>
      </g>
    </g>
    <path d={relief([[-20, 548], [120, 538], [250, 552], [380, 540]])} fill={shade(SAVANE, -0.1)} />
    {/* La jeep, et le photographe debout dans le toit ouvrant */}
    <g {...a("va", { dx: 320, t: 2.2, e: "sortie" })}>
      <g transform="translate(232 640)">
        <g transform={tf(-60, -214, 0.36)}><Buste espece={espece} look={look} /></g>
        {/* L'appareil, tenu devant soi */}
        <rect x="-18" y="-112" width="44" height="30" rx="5" fill={C.nuit} />
        <rect x="-10" y="-119" width="16" height="9" rx="2" fill={C.nuit} />
        <circle cx="4" cy="-97" r="11" fill={C.grisFonce} />
        <circle cx="4" cy="-97" r="6.5" fill={C.ciel} />
        <path d={etoiles([[4, -97, 46]])} fill={C.blanc} {...a("eclat", { t: 0.5, d: 2.7, o: [4, -97] })} />
        <path d={etoiles([[4, -97, 46]])} fill={C.blanc} {...a("eclat", { t: 0.5, d: 3.6, o: [4, -97] })} />
        <g transform="scale(-1 1)">
          <circle cx="-96" cy="-46" r="19" fill={C.noir} />
          <circle cx="-96" cy="-46" r="8" fill={C.grisFonce} />
          <path d="M-70 -84H64L92 -50V-12H-92V-70Q-92 -84 -70 -84Z" fill={C.persFonce} />
          <path d="M-92 -44H92V-12H-92Z" fill={shade(C.persFonce, -0.2)} />
          <path d="M40 -84H64L86 -56H40Z" fill={C.ciel} />
          <path d="M-52 -84V-58H10V-84" fill="none" stroke={C.persClair} strokeWidth="3" />
          <rect x="82" y="-40" width="12" height="9" rx="3" fill={C.mimosa} />
          <path d="M-78 -30H74" fill="none" stroke={C.mimosa} strokeWidth="3" strokeLinecap="round" />
          {[-54, 52].map((x) => (
            <g key={x} transform={`translate(${x} -8)`}>
              <circle r="21" fill={C.noir} />
              <circle r="9" fill={C.grisClair} />
            </g>
          ))}
        </g>
      </g>
    </g>
    {/* Les herbes du premier plan */}
    <path d={relief([[-20, 664], [140, 650], [380, 670]])} fill="#B98531" />
    <path d="M20 664L12 632M28 664L26 626M38 664L46 634M300 668L292 640M310 668L310 632M322 668L332 642M180 660L176 636M190 660L196 634" fill="none" stroke="#8E6420" strokeWidth="4" strokeLinecap="round" />
    {/* La girafe se met devant */}
    <g {...a("va", { dy: -470, r: -8, t: 0.9, d: 4.4, e: "rebond", o: [70, 100] })}>
      <path d="M-30 90L40 96Q64 228 84 318L62 372Q40 384 24 372Q-6 240 -30 90Z" fill={GIRAFE} />
      <path d="M0 120L24 124L26 156L4 150ZM14 180L38 188L42 222L18 212ZM30 248L52 258L56 290L36 280ZM-12 170L4 176L10 208L-8 196ZM44 310L60 318L58 336Z" fill="#A8672B" />
      <path d="M22 330Q20 300 50 296Q92 294 124 322Q150 348 148 376Q146 402 118 404Q84 404 58 392Q24 376 22 330Z" fill={GIRAFE} />
      <path d="M96 352Q124 340 148 366Q150 392 132 402Q104 404 90 384Q84 364 96 352Z" fill="#F4D9A0" />
      <path d="M34 300Q24 280 34 268L44 294ZM58 294L56 262Q64 258 68 266L70 294Z" fill="#A8672B" />
      <circle cx="34" cy="266" r="6" fill="#4A3A2A" />
      <circle cx="62" cy="260" r="6" fill="#4A3A2A" />
      <path d="M22 326Q2 318 -6 330Q4 344 26 340Z" fill={GIRAFE} />
      <circle cx="74" cy="332" r="6.5" fill={C.nuit} />
      <circle cx="76" cy="330" r="2" fill={C.blanc} />
      <path d="M62 320Q74 312 88 320" fill="none" stroke="#4A3A2A" strokeWidth="3" strokeLinecap="round" />
      <path d={ronds(3, [[126, 372], [138, 378]])} fill="#A8672B" />
      <path d="M108 396Q124 400 140 392" fill="none" stroke="#A8672B" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Une nuit sous les aurores boréales : le ciel déroule ses rideaux verts au-dessus de la
// neige, et l'on regarde, sous un plaid, un chocolat chaud entre les pattes.

/** Un sapin, en ombre. Planté en (0, 0), haut de `h`. */
function sapin(x: number, y: number, h: number): string {
  const l = h * 0.34;
  return `M${x} ${y - h}L${x + l * 0.5} ${y - h * 0.62}H${x + l * 0.24}L${x + l * 0.78} ${y - h * 0.3}H${x + l * 0.36}L${x + l} ${y}H${x - l}L${x - l * 0.36} ${y - h * 0.3}H${x - l * 0.78}L${x - l * 0.24} ${y - h * 0.62}H${x - l * 0.5}Z`;
}

/** Un rideau d'aurore : une bande sinueuse qui tombe du ciel. */
function rideau(x: number, l: number, haut: number, bas: number): string {
  const m = (haut + bas) / 2;
  return `M${x} ${haut}Q${x + l * 0.7} ${(haut + m) / 2} ${x + l * 0.1} ${m}T${x + l * 0.3} ${bas}H${x + l * 1.3}Q${x + l * 0.9} ${(m + bas) / 2} ${x + l * 1.2} ${m}T${x + l} ${haut}Z`;
}

const aurores: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="aurores" couleurs={["#081535", "#102C5C", "#1D4E72"]} bas={560} />
    <Etoiles
      points={[[24, 130], [70, 190], [120, 120], [168, 220], [214, 140], [262, 200], [310, 130], [340, 250], [44, 290], [300, 330], [150, 330], [226, 380]]}
      brillantes={[[92, 250, 7], [282, 160, 8], [196, 300, 6], [330, 380, 6]]}
    />
    <g {...a("passe", { fx: 520, fy: 300, t: 0.8, d: 2.2 })}>
      <rect x="-80" y="-40" width="80" height="2.5" rx="1.2" fill={C.blanc} transform="rotate(28)" />
    </g>
    {/* Les rideaux de l'aurore se déroulent un à un, puis ondulent */}
    {([[20, 62, 150, 470, "#5FE0B0", 0.6, 0.7], [104, 74, 120, 500, "#7BE8C4", 0.75, 1.5], [196, 66, 140, 480, "#B9A5D6", 0.6, 2.3], [268, 70, 170, 490, "#5FE0B0", 0.55, 3.1]] as const).map(
      ([x, l, haut, bas, couleur, opacite, d], i) => (
        <g key={x} {...a("apparait", { t: 0.3, d })}>
          <g {...a("etire", { sy: 0.02, t: 1.6, d, e: "sortie", o: "50% 0%" })}>
            <g {...a("flotte", { dx: 9, t: 2.1 + i * 0.3, d: -i * 0.7 })}>
              <path d={rideau(x, l, haut, bas)} fill={couleur} fillOpacity={opacite} {...a("clignote", { t: 1.4 + i * 0.25, d: -i * 0.4, o0: 0.55 })} />
            </g>
          </g>
        </g>
      ),
    )}
    {/* La neige, la forêt, la cabane */}
    <path d={relief([[-20, 548], [90, 520], [210, 552], [320, 524], [380, 540]])} fill="#BFD6EC" />
    <path d={sapin(26, 548, 96) + sapin(58, 540, 70) + sapin(300, 536, 104) + sapin(336, 534, 76) + sapin(266, 546, 56)} fill="#0B2038" />
    <path d="M96 560V532L120 514L144 532V560Z" fill="#3A2A22" />
    <path d="M90 534L120 510L150 534L144 540L120 520L96 540Z" fill={C.blanc} />
    <rect x="113" y="536" width="14" height="14" fill={C.mimosa} {...a("clignote", { t: 1.7, o0: 0.7 })} />
    <rect x="132" y="508" width="6" height="14" fill="#3A2A22" />
    <g fill={C.blanc} fillOpacity="0.5">
      <circle cx="136" cy="500" r="6" {...a("passe", { fy: -60, fx: 16, t: 2.6, n: "inf" })} />
      <circle cx="137" cy="500" r="5" {...a("passe", { fy: -60, fx: 20, t: 2.6, d: 1.3, n: "inf" })} />
    </g>
    {/* Un renne, sur la crête */}
    <g transform="translate(232 532)">
      <path d="M-14 0V-12H-18Q-22 -22 -10 -24H10L18 -34L24 -32L20 -22Q16 -14 14 -12V0H10V-10H-10V0Z" fill="#0B2038" />
      <path d="M19 -33L15 -46L11 -42M19 -33L23 -47L28 -43M19 -40L24 -40" fill="none" stroke="#0B2038" strokeWidth="2" strokeLinecap="round" />
    </g>
    <path d={relief([[-20, 600], [120, 574], [250, 604], [380, 580]])} fill="#E9F3FA" />
    {/* Le voyageur, sous son plaid */}
    <g {...a("flotte", { dy: 2, t: 2.2 })}>
      <g transform={tf(94, 440, 0.43)}>
        <Buste espece={espece} look={look} />
        <path d="M30 482V408Q30 336 116 322Q200 366 284 322Q370 336 370 408V482Z" fill={C.cerise} />
        <path d="M116 322Q200 366 284 322L300 330Q200 392 100 330Z" fill={shade(C.cerise, -0.22)} />
        <path d="M110 380V482M200 400V482M290 380V482M30 440H370" fill="none" stroke={shade(C.cerise, -0.3)} strokeWidth="8" />
      </g>
      {/* Le chocolat chaud */}
      <path d="M160 628H200V652Q200 662 190 662H170Q160 662 160 652Z" fill={C.ivoire} />
      <path d="M200 634Q212 634 212 644Q212 654 200 654" fill="none" stroke={C.ivoire} strokeWidth="5" />
      <path d="M160 628H200V634H160Z" fill={C.boisFonce} />
      <g fill="none" stroke={C.blanc} strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round">
        <path d="M172 620q-5 -8 0 -16t0 -16" {...a("clignote", { t: 1.2, o0: 0.15 })} />
        <path d="M188 620q5 -8 0 -16t0 -16" {...a("clignote", { t: 1.2, d: -0.6, o0: 0.15 })} />
      </g>
    </g>
    <path d={relief([[-20, 668], [150, 646], [380, 672]])} fill={C.blanc} />
    {/* Quelques flocons */}
    <path d={ronds(2.4, [[40, 410], [300, 450], [210, 250], [120, 600], [330, 610]])} fill={C.blanc} />
    <g fill={C.blanc}>
      <circle cx="80" cy="100" r="2.6" {...a("passe", { fy: 640, fx: 30, t: 6, n: "inf" })} />
      <circle cx="250" cy="100" r="2.2" {...a("passe", { fy: 640, fx: -24, t: 7, d: 2, n: "inf" })} />
      <circle cx="170" cy="100" r="2" {...a("passe", { fy: 640, fx: 18, t: 6.5, d: 3.6, n: "inf" })} />
    </g>
  </>
);

// ---------------------------------------------------------------------------
// La traversée de l'Atlantique à la voile : on quitte le phare, on essuie un grain, et un
// matin il y a une ville de l'autre côté.

const HOULE = "#2C7DA0";

const transatlantique: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="atlantique" couleurs={["#57AEE4", "#A9DAF2", "#E4F3F4"]} bas={500} />
    <Astre x={70} y={236} r={26} />
    <g transform={tf(210, 190)}><path d={nuage(120)} fill={C.blanc} {...a("flotte", { dx: 10, t: 5 })} /></g>
    <g transform="translate(130 300) scale(0.7)"><g {...a("va", { dx: -150, dy: 20, t: 8, e: "lin" })}><Mouette /></g></g>
    {/* Le phare qu'on quitte */}
    <g {...a("sort", { dx: -230, t: 2.6, d: 0.3, e: "entree" })}>
      <path d="M-10 500Q20 470 60 474Q84 480 92 500Z" fill={C.ardoise} />
      <path d="M28 476L34 392H52L58 476Z" fill={C.blanc} />
      <path d="M32 420H54L55 436H31ZM30 452H56L57 468H29Z" fill={C.cerise} />
      <rect x="30" y="378" width="26" height="16" fill={C.nuit} />
      <rect x="35" y="381" width="16" height="10" fill={C.mimosa} />
      <path d="M28 378L43 364L58 378Z" fill={C.cerise} />
    </g>
    {/* La ville, de l'autre côté */}
    <g {...a("va", { dx: 300, t: 2.4, d: 5.2, e: "sortie" })}>
      <g transform="translate(44 0)">
        <path d="M232 500V440H250V414H266V452H280V396H298V432H310V376H328V420H342V452H360V500Z" fill="#7A8FB8" />
        <path d="M250 500V460H262V500ZM284 500V436H294V500ZM314 500V410H324V500ZM346 500V470H356V500Z" fill="#5E739E" />
        <path d={ronds(1.5, [[256, 426], [258, 440], [288, 410], [290, 424], [318, 392], [320, 406], [336, 434], [350, 462]])} fill={C.mimosa} />
      </g>
      {/* La statue, flambeau levé */}
      <g transform="translate(66 -6) scale(1.12)">
        <path d="M196 500V478H224V500Z" fill={C.pierre} />
        <path d="M202 478L206 436Q210 426 214 436L218 478Z" fill="#7FC6B2" />
        <circle cx="210" cy="426" r="7" fill="#7FC6B2" />
        <path d="M204 422L200 414M208 419L207 410M213 419L215 410M216 423L221 416" fill="none" stroke="#7FC6B2" strokeWidth="2" strokeLinecap="round" />
        <path d="M214 440L224 408" fill="none" stroke="#7FC6B2" strokeWidth="5" strokeLinecap="round" />
        <path d="M220 406Q220 396 226 392Q230 400 228 408Z" fill={C.mimosa} {...a("pulse", { s0: 0.8, s: 1.2, t: 0.3, o: "50% 100%" })} />
      </g>
    </g>
    {/* La houle du large */}
    <path d={vagues(498, 120, 9)} fill={HOULE} {...a("defile", { dx: -120, t: 4 })} />
    <path d={vagues(516, 90, 8)} fill={shade(HOULE, -0.12)} {...a("defile", { dx: -90, t: 2.6 })} />
    {/* Le voilier, qui tangue */}
    <g transform="translate(172 540)">
      <g {...a("flotte", { r: 5, dy: 5, t: 1.5, o: [0, 0] })}>
        <path d="M-4 -176V-20" fill="none" stroke={C.boisFonce} strokeWidth="4" />
        <path d="M2 -172Q62 -110 78 -30H2Z" fill={C.ivoire} />
        <path d="M2 -172Q40 -110 44 -30H2Z" fill={C.blanc} />
        <path d="M-10 -150Q-56 -90 -66 -30H-10Z" fill={C.creme} />
        <path d="M-4 -176L-30 -168L-4 -160Z" fill={C.mimosa} {...a("flotte", { r: 8, t: 0.4, o: "100% 50%" })} />
        <g transform={tf(-40, -112, 0.2)}><Buste espece={espece} look={look} /></g>
        <path d="M-92 -24H92L72 12H-74Z" fill={C.cerise} />
        <path d="M-92 -24H92L88 -16H-88Z" fill={C.ivoire} />
        <path d="M-80 0H78L72 12H-74Z" fill={shade(C.cerise, -0.22)} />
        <rect x="-36" y="-40" width="52" height="18" rx="4" fill={C.ivoire} />
        <path d={ronds(4, [[-22, -31], [-6, -31]])} fill={C.azur} />
      </g>
    </g>
    {/* Deux dauphins sautent devant l'étrave */}
    {([[92, 0], [286, -0.9]] as const).map(([x, d]) => (
      <g key={x} {...a("saut", { dy: -64, t: 1.8, d })}>
        <path d={`M${x - 24} 582Q${x - 10} 556 ${x + 14} 562L${x + 26} 558L${x + 22} 568Q${x + 10} 584 ${x - 12} 584L${x - 28} 594Z`} fill="#4C6E8C" />
        <path d={`M${x - 2} 560L${x + 2} 548L${x + 8} 562Z`} fill="#4C6E8C" />
      </g>
    ))}
    <path d={vagues(566, 150, 12)} fill={shade(HOULE, -0.26)} {...a("defile", { dx: -150, t: 2.2 })} />
    <path d="M30 620H64L71 616L78 620H112V623H30ZM214 650H248L255 646L262 650H296V653H214Z" fill={shade(HOULE, 0.2)} {...a("clignote", { t: 1.2, o0: 0.4 })} />
    {/* Le grain : le ciel noircit, la pluie tombe, puis tout se lève */}
    <g {...a("apparait", { t: 0.8, d: 2.2 })}>
      <g {...a("disparait", { t: 0.9, d: 4.3 })}>
        <rect x="-20" y="-20" width="400" height="840" fill="#14233F" fillOpacity="0.5" />
        <path d={nuage(220)} transform="translate(-40 96)" fill="#3D4A63" />
        <path d={nuage(240)} transform="translate(150 132)" fill="#4B5873" />
        <g fill="none" stroke={C.blanc} strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round">
          <path d="M60 220l-14 40M150 240l-14 40M240 216l-14 40M320 236l-14 40M100 320l-14 40M200 330l-14 40M290 320l-14 40" {...a("passe", { fx: -70, fy: 200, t: 0.5, n: "inf" })} />
          <path d="M30 280l-14 40M120 276l-14 40M260 290l-14 40M340 300l-14 40M180 200l-14 40" {...a("passe", { fx: -70, fy: 200, t: 0.5, d: 0.25, n: "inf" })} />
        </g>
        <path d="M250 190L226 250H244L224 306L270 236H250L268 190Z" fill={C.mimosa} {...a("eclat", { t: 0.45, d: 3.2, s: 1, o: "50% 0%" })} />
        <path d="M96 170L76 222H92L74 270L114 210H98L112 170Z" fill={C.mimosa} {...a("eclat", { t: 0.45, d: 4, s: 1, o: "50% 0%" })} />
      </g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Le tour du monde : le globe tourne sous l'avion, et les monuments poussent sur son bord,
// l'un après l'autre.

/** Le centre et le rayon du globe. */
const GX = 180;
const GY = 440;
const GR = 112;

/** Un monument, debout sur le bord du globe à l'angle `angle` (0 : en haut), qui surgit à l'instant `d`. */
function Monument({ angle, d, children }: { angle: number; d: number; children: ReactNode }) {
  return (
    <g transform={`rotate(${angle} ${GX} ${GY}) translate(${GX} ${GY - GR + 3}) scale(1.3)`}>
      <g {...a("pop", { t: 0.45, d, o: "50% 100%" })}>{children}</g>
    </g>
  );
}

const CONTINENTS = "M10 -60Q40 -78 70 -62Q84 -40 64 -24Q60 -4 34 0Q8 -6 10 -32ZM112 -30Q146 -44 168 -22Q174 6 150 26Q124 22 122 0ZM40 34Q66 26 78 48Q72 76 48 78Q28 62 40 34ZM176 -84Q200 -92 214 -76Q200 -62 182 -68ZM196 40Q222 34 236 54Q226 72 204 66Z";

const tourDuMonde: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="monde" couleurs={["#18245F", "#2A58A2", "#69B7DB"]} />
    <Etoiles
      points={[[30, 140], [86, 200], [140, 130], [226, 170], [300, 130], [334, 220], [54, 280], [312, 300]]}
      brillantes={[[70, 170, 7], [270, 220, 8]]}
    />
    <g transform={tf(-20, 610)}><path d={nuage(130)} fill={C.blanc} fillOpacity="0.85" {...a("flotte", { dx: 12, t: 5 })} /></g>
    <g transform={tf(250, 640)}><path d={nuage(110)} fill={C.blanc} fillOpacity="0.75" {...a("flotte", { dx: -10, t: 6 })} /></g>
    {/* Les monuments, sur le bord du monde */}
    <Monument angle={-56} d={1.2}>
      <path d="M-14 0L-3 -52H3L14 0H8L0 -30L-8 0Z" fill={C.ardoise} />
      <path d="M-9 -18H9M-6 -34H6" fill="none" stroke={C.ardoise} strokeWidth="3" />
      <path d="M-1.5 -52V-62H1.5V-52Z" fill={C.ardoise} />
    </Monument>
    <Monument angle={-24} d={2.2}>
      <path d="M-26 0L0 -40L26 0Z" fill={C.paille} />
      <path d="M0 -40L26 0H8Z" fill={shade(C.paille, -0.2)} />
    </Monument>
    <Monument angle={10} d={3.2}>
      <path d="M-5 0V-14H5V0ZM-4 -20V-30H4V-20ZM-3 -36V-44H3V-36Z" fill={C.ivoire} />
      <path d="M-18 -12Q0 -22 18 -12L14 -18H-14ZM-15 -28Q0 -38 15 -28L11 -34H-11ZM-12 -42Q0 -52 12 -42L0 -56Z" fill={C.cerise} />
    </Monument>
    <Monument angle={40} d={4.2}>
      <path d="M-9 0V-12H9V0Z" fill={C.pierre} />
      <path d="M-6 -12L-3 -38Q0 -44 3 -38L6 -12Z" fill="#7FC6B2" />
      <circle cx="0" cy="-45" r="5" fill="#7FC6B2" />
      <path d="M3 -36L10 -58" fill="none" stroke="#7FC6B2" strokeWidth="4" strokeLinecap="round" />
      <circle cx="11" cy="-62" r="4" fill={C.mimosa} />
    </Monument>
    {/* La tour de l'horloge, un peu plus petite : couchée sur le bord, sa flèche reste dans l'image */}
    <Monument angle={-80} d={5.2}>
      <g transform="scale(0.8)">
        <path d="M-9 0V-48H9V0Z" fill={C.bois} />
        <path d="M-12 -48H12L0 -68Z" fill={C.boisFonce} />
        <circle cx="0" cy="-36" r="6" fill={C.ivoire} />
        <path d="M0 -36V-40M0 -36L3 -34" fill="none" stroke={C.nuit} strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </Monument>
    {/* Le globe : les continents défilent, il tourne. Rien ne dépasse de son disque (une fenêtre ronde). */}
    <circle cx={GX} cy={GY} r={GR} fill={C.azur} />
    <Fenetre x={GX - GR} y={GY - GR} l={GR * 2} h={GR * 2} rx={GR}>
      <g fill={C.vert} {...a("defile", { dx: -260, t: 5 })}>
        {[-260, 0, 260].map((x) => <path key={x} d={CONTINENTS} transform={`translate(${GX - GR + x} ${GY})`} />)}
      </g>
      <path d={`M${GX - GR} ${GY - 70}h70M${GX + 20} ${GY + 84}h70M${GX - 40} ${GY - 96}h60`} fill="none" stroke={C.blanc} strokeOpacity="0.7" strokeWidth="8" strokeLinecap="round" />
      <path d={`M${GX} ${GY - GR}A${GR} ${GR} 0 0 1 ${GX} ${GY + GR}Q${GX + 60} ${GY + 60} ${GX + 60} ${GY}Q${GX + 60} ${GY - 60} ${GX} ${GY - GR}Z`} fill={C.marine} fillOpacity="0.3" />
    </Fenetre>
    {/* La route de l'avion, puis l'avion, qui boucle la boucle */}
    <circle cx={GX} cy={GY} r="152" fill="none" stroke={C.ivoire} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="3 9" />
    <g {...a("va", { r: -720, t: 7.4, e: "cubic-bezier(.3,0,.2,1)", o: [GX, GY] })}>
      <g transform={`rotate(74 ${GX} ${GY}) translate(${GX} ${GY - 152})`}>
        <path d="M-12 0L-34 -30H-18L10 0ZM-12 0L-34 30H-18L10 0Z" fill={C.grisClair} />
        <path d="M-56 0Q-56 -15 -34 -15H30Q54 -12 62 0Q54 12 30 15H-34Q-56 15 -56 0Z" fill={C.blanc} />
        <path d="M-50 -6L-68 -30H-50L-36 -13Z" fill={C.bougainvillier} />
        <path d="M-56 4H52" fill="none" stroke={C.bougainvillier} strokeWidth="3" />
        <circle cx="26" cy="-1" r="15" fill={C.nuit} />
        <circle cx="26" cy="-1" r="12.5" fill={C.ciel} />
        <Fenetre x={13.5} y={-13.5} l={25} h={25} rx={12.5}>
          <g transform={`rotate(-74 26 -1) ${tf(26 - 16.8, -1 - 20, 0.12)}`}><Tete espece={espece} look={look} /></g>
        </Fenetre>
        <path d={ronds(3.2, [[-22, -3], [-8, -3], [6, -3]])} fill={C.azur} />
      </g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Une expédition chez les manchots : le brise-glace accoste, et toute la colonie vient
// voir qui est ce grand machin sans smoking.

/** Un manchot, de face. Posé sur ses pattes en (0, 0), haut de 72. `empereur` : avec son col d'or. */
function Manchot({ empereur = false, d = 0, poisson = false }: { empereur?: boolean; d?: number; poisson?: boolean }) {
  return (
    <g {...a("flotte", { r: 7, t: 0.34, d, o: "50% 100%" })}>
      <path d="M-10 0Q-18 0 -18 4H-2Q-2 0 -10 0ZM10 0Q18 0 18 4H2Q2 0 10 0Z" fill={C.mimosaFonce} />
      <path d="M-22 -42Q-32 -30 -28 -14L-20 -24ZM22 -42Q32 -30 28 -14L20 -24Z" fill={C.noir} />
      <path d="M0 -72Q20 -72 22 -46V-22Q22 0 0 0Q-22 0 -22 -22V-46Q-20 -72 0 -72Z" fill={C.noir} />
      <path d="M0 -58Q14 -56 15 -34V-20Q15 -3 0 -3Q-15 -3 -15 -20V-34Q-14 -56 0 -58Z" fill={C.blanc} />
      {empereur && <path d="M-14 -44Q0 -52 14 -44Q8 -40 0 -40Q-8 -40 -14 -44Z" fill={C.mimosa} />}
      <path d={ronds(2.2, [[-7, -60], [7, -60]])} fill={C.blanc} />
      <path d="M-5 -54H5L0 -46Z" fill={C.mimosaFonce} />
      {poisson && (
        <>
          <path d="M4 -50Q18 -58 30 -50Q18 -42 4 -50ZM28 -50L38 -57V-43Z" fill={C.ciel} />
          <circle cx="11" cy="-51" r="1.2" fill={C.nuit} />
        </>
      )}
    </g>
  );
}

/** Où chaque manchot finit, sa taille, d'où il arrive, et quand. */
const COLONIE: readonly (readonly [x: number, y: number, k: number, dx: number, depart: number])[] = [
  [40, 606, 0.9, -160, 1.2], [84, 628, 1.1, -200, 1.9], [302, 606, 0.95, 170, 1.5], [258, 632, 1.15, 200, 2.3],
  [128, 596, 0.7, -220, 2.9], [238, 594, 0.72, 220, 3.3], [22, 662, 1.2, -140, 3.9], [330, 664, 1.25, 150, 4.3],
];

const antarctique: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="antarctique" couleurs={["#A5D3EC", "#DCEFF6", "#F6FBFC"]} bas={440} />
    <Astre x={292} y={292} r={24} couleur={C.blanc} halo="#FFF3C8" />
    {/* Les icebergs */}
    <path d="M-20 446L40 330L78 378L112 300L176 446Z" fill={C.blanc} />
    <path d="M112 300L176 446H128L140 380Z" fill="#BFE0EE" />
    <path d="M206 446L252 368L286 404L314 356L380 446Z" fill={C.blanc} />
    <path d="M314 356L380 446H334L342 404Z" fill="#BFE0EE" />
    <rect x="-20" y="440" width="400" height="110" fill="#2E6F8E" />
    <path d="M196 462H262L270 468H204Z" fill={C.blanc} />
    {/* Le brise-glace accoste */}
    <g {...a("va", { dx: -260, t: 3.2, e: "sortie" })}>
      <path d="M40 440V420H112V440Z" fill={C.blanc} />
      <path d="M58 420V404H94V420Z" fill={C.blanc} />
      <rect x="70" y="386" width="14" height="20" fill={C.mimosa} />
      <rect x="70" y="386" width="14" height="6" fill={C.nuit} />
      <path d={ronds(3, [[52, 430], [66, 430], [80, 430], [94, 430]])} fill={C.azur} />
      <path d="M8 440H150L162 474H24Z" fill={C.cerise} />
      <path d="M12 452H154L162 474H24Z" fill={shade(C.cerise, -0.22)} />
      <circle cx="78" cy="372" r="8" fill={C.blanc} fillOpacity="0.7" {...a("passe", { fy: -50, fx: -24, t: 2.2, n: "inf" })} />
    </g>
    <path d="M-20 474H380V480H-20Z" fill={shade("#2E6F8E", 0.25)} {...a("clignote", { t: 1.5, o0: 0.4 })} />
    {/* La banquise */}
    <path d={relief([[-20, 540], [100, 522], [230, 544], [380, 524]])} fill={C.blanc} />
    <path d={relief([[-20, 600], [140, 586], [380, 606]])} fill="#EAF5FA" />
    {/* Un manchot glisse sur le ventre, d'un bout à l'autre */}
    <g {...a("passe", { dx: -200, fx: 520, t: 1.8, d: 2.6 })}>
      <g transform="translate(0 562) rotate(90)"><Manchot /></g>
    </g>
    {/* La colonie arrive en se dandinant */}
    {COLONIE.slice(0, 6).map(([x, y, k, dx, depart]) => (
      <g key={x} {...a("va", { dx, t: 1.7, d: depart, e: "lin" })}>
        <g transform={tf(x, y, k)}><Manchot d={-depart} empereur={k > 1} /></g>
      </g>
    ))}
    {/* Le voyageur, adopté */}
    <g {...a("va", { dy: 24, o0: 0, t: 0.8, d: 0.9 })}>
      <g transform={tf(120, 440, 0.3)}>
        <Perso espece={espece} look={look} bras={[36, 150]} jambes={[6, 6]} salut />
      </g>
    </g>
    {COLONIE.slice(6).map(([x, y, k, dx, depart]) => (
      <g key={x} {...a("va", { dx, t: 1.7, d: depart, e: "lin" })}>
        <g transform={tf(x, y, k)}><Manchot d={-depart} empereur poisson={x < 180} /></g>
      </g>
    ))}
    {/* Le petit dernier, tout gris, qui a mis du temps */}
    <g {...a("va", { dx: 200, t: 2, d: 4.8, e: "lin" })}>
      <g transform="translate(206 640)">
        <g {...a("flotte", { r: 9, t: 0.28, o: "50% 100%" })}>
          <ellipse cx="0" cy="-17" rx="15" ry="17" fill={C.grisClair} />
          <circle cx="0" cy="-36" r="10" fill={C.noir} />
          <path d={ronds(4.4, [[-5, -36], [5, -36]])} fill={C.blanc} />
          <path d={ronds(1.4, [[-5, -36], [5, -36]])} fill={C.nuit} />
          <path d="M-3 -32H3L0 -27Z" fill={C.mimosaFonce} />
        </g>
      </g>
    </g>
    {/* La neige tombe, à peine */}
    <path d={ronds(2.4, [[60, 250], [200, 300], [330, 220], [140, 400], [280, 520]])} fill={C.blanc} />
    <g fill={C.blanc}>
      <circle cx="100" cy="90" r="2.6" {...a("passe", { fy: 700, fx: 40, t: 6, n: "inf" })} />
      <circle cx="240" cy="90" r="2.2" {...a("passe", { fy: 700, fx: -30, t: 7, d: 2.4, n: "inf" })} />
    </g>
  </>
);

export const SCENES_VOYAGES: Record<string, SceneArt> = {
  australie,
  "japon-coree": japonCoree,
  safari,
  aurores,
  transatlantique,
  "tour-du-monde": tourDuMonde,
  antarctique,
};
