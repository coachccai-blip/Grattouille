// Les films de l'Agence Carpe Diem, chapitre « À portée du port » : la glace, le pédalo, le
// cerf-volant, le pique-nique de gala, la plongée, la montgolfière et le parachute.
//
// Une scène se dessine dans le <svg> du film (viewBox 0 0 360 800 ; voir ./kit.tsx pour le
// cadre, le style et le mouvement). Chaque élément est posé là où il sera sur la carte
// postale : sans animation, le dessin est l'image de la fin.

import { C, METAL, shade } from "../kit";
import {
  Astre, Buste, Ciel, Goeland, Mer, Mouette, Perso, a, etoiles, nuage, pelageDe, relief, ronds, tf, vagues, type SceneArt,
} from "./kit";

// ---------------------------------------------------------------------------
// Une glace trois boules face à la mer : trois boules tombent sur le cornet, une cerise,
// et une mouette qui avait tout vu repart avec la boule du dessus.

const glace: SceneArt = ({ espece, look }) => {
  const patte = pelageDe(espece);
  return (
    <>
      <Ciel id="glace" couleurs={["#6FC4EC", "#BDE7F5", "#F2F6E6"]} bas={440} />
      <Astre x={292} y={214} r={28} />
      <g transform={tf(128, 196)}><path d={nuage(120)} fill={C.blanc} {...a("flotte", { dx: 9, t: 5 })} /></g>
      <g transform={tf(-14, 344)}><path d={nuage(84)} fill={C.blanc} fillOpacity="0.85" {...a("flotte", { dx: 7, t: 6.5 })} /></g>
      <Mer y={436} bas={560} />
      {/* Un voilier, au large */}
      <g transform={tf(96, 440)}>
        <g {...a("va", { dx: -60, t: 7.4, e: "lin" })}>
          <path d="M-14 -2H16L11 6H-9Z" fill={C.cerise} />
          <path d="M1 -32V-2H19Z" fill={C.blanc} />
          <path d="M-2 -25V-2H-13Z" fill={C.creme} />
        </g>
      </g>
      {/* La terrasse du front de mer */}
      <rect x="-20" y="548" width="400" height="110" fill={C.pierre} />
      <rect x="-20" y="548" width="400" height="6" fill={shade(C.pierre, 0.3)} />
      {/* Le voyageur, accoudé au parapet, le cornet à bout de patte */}
      <g {...a("flotte", { dy: 2.5, t: 1.6 })}>
        <g transform={tf(14, 388, 0.56)}><Buste espece={espece} look={look} /></g>
        <path d="M196 606L262 600" fill="none" stroke={patte} strokeWidth="26" strokeLinecap="round" />
      </g>
      <path d="M247 540H293L270 628Z" fill={C.paille} />
      <path d="M270 540H293L270 628Z" fill={shade(C.paille, -0.16)} />
      <path d="M252 556L283 580M258 540L288 562M287 556L259 580M281 540L254 562" fill="none" stroke={shade(C.paille, -0.3)} strokeWidth="1.6" />
      <circle cx="270" cy="601" r="16" fill={shade(patte, 0.18)} />
      {/* Pistache, vanille : les deux qui resteront */}
      <g {...a("chute", { dy: -420, t: 0.6, d: 0.8, o: "50% 100%" })}>
        <circle cx="270" cy="524" r="27" fill={C.persClair} />
        <path d="M252 512Q262 500 276 502" fill="none" stroke={C.blanc} strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g {...a("chute", { dy: -420, t: 0.6, d: 1.6, o: "50% 100%" })}>
        <circle cx="270" cy="486" r="24" fill={C.creme} />
        <path d="M254 476Q262 466 274 467" fill="none" stroke={C.blanc} strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* La surprise du voyageur */}
      <path d="M214 438L226 426M222 452L238 446M206 426L210 410" fill="none" stroke={C.nuit} strokeWidth="4" strokeLinecap="round" {...a("eclat", { t: 0.8, d: 5.1, o: "0% 100%" })} />
      {/* La mouette, la boule à la fraise et sa cerise : elles repartent ensemble */}
      <g {...a("va", { dx: 226, dy: 154, t: 1.5, d: 5.05, e: "cubic-bezier(.5,0,.3,1)" })}>
        <g {...a("chute", { dy: -420, t: 0.6, d: 2.4, o: "50% 100%" })}>
          <circle cx="44" cy="298" r="22" fill={C.bougClair} />
          <path d="M30 290Q36 280 48 281" fill="none" stroke={C.blanc} strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" />
        </g>
        <g {...a("chute", { dy: -420, t: 0.5, d: 3.2, o: "50% 100%" })}>
          <path d="M44 268Q46 256 56 252" fill="none" stroke={C.feuille} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="44" cy="273" r="7.5" fill={C.cerise} />
        </g>
        <g {...a("va", { dx: 230, dy: -200, t: 0.8, d: 4.2, e: "sortie" })}>
          <g transform="translate(104 268) scale(-1 1)"><Goeland /></g>
        </g>
      </g>
      {/* Le parapet, et sa bouée */}
      <rect x="-20" y="642" width="400" height="178" fill={shade(C.pierre, -0.16)} />
      <rect x="-20" y="634" width="400" height="12" fill={C.craie} />
      <rect x="-20" y="646" width="400" height="5" fill={shade(C.pierre, -0.32)} />
      <path d="M24 672H150V760H24ZM178 672H336V760H178Z" fill={shade(C.pierre, -0.24)} />
      <circle cx="86" cy="712" r="27" fill="none" stroke={C.blanc} strokeWidth="14" />
      <path d="M86 685A27 27 0 0 1 113 712M86 739A27 27 0 0 1 59 712" fill="none" stroke={C.cerise} strokeWidth="14" />
    </>
  );
};

// ---------------------------------------------------------------------------
// Une heure de pédalo au soleil couchant : le soleil descend, le cygne avance, la roue tourne.

const NUIT_ROSE = "#6B3277";

const pedalo: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="pedalo" couleurs={["#33265F", "#A94377", "#F0774F", "#FBC46A"]} bas={476} />
    <g {...a("va", { dy: -124, t: 6.8, e: "lin" })}><Astre x={180} y={456} r={66} couleur="#FFD873" halo="#FFC25A" /></g>
    <g transform={tf(74, 250)}><g {...a("va", { dx: -130, t: 7, e: "lin" })}><Mouette couleur="#2B1C4A" /></g></g>
    <g transform={tf(118, 222, 0.7)}><g {...a("va", { dx: -150, t: 7, e: "lin" })}><Mouette couleur="#2B1C4A" /></g></g>
    <Mer y={476} couleur={NUIT_ROSE} reflets="#B4527F" t={6} />
    <rect x="-20" y="640" width="400" height="180" fill="#3E2466" fillOpacity="0.6" />
    {/* Le phare, au bout de la jetée */}
    <path d="M26 476V438H36V476ZM22 438H40V432H22Z" fill="#2B1C4A" />
    <circle cx="31" cy="427" r="5" fill="#FFD873" {...a("clignote", { t: 0.9, o0: 0.15 })} />
    <path d="M-20 476H58V470H-20Z" fill="#2B1C4A" />
    {/* Le reflet du soleil : une échelle d'or sur l'eau */}
    <path d="M118 486H242V493H118ZM134 505H226V512H134ZM148 524H212V531H148ZM160 543H200V550H160Z" fill="#FFD873" {...a("clignote", { t: 1.3, o0: 0.5 })} />
    {/* Le cygne et son équipage */}
    <g {...a("va", { dx: -340, t: 5.4, e: "sortie" })}>
      <g transform={tf(190, 574)}>
        <g {...a("flotte", { dy: 2.5, r: 1.3, t: 1.5, o: "50% 100%" })}>
          {/* La roue à aubes, à la poupe */}
          <g transform="translate(-92 -8)">
            <g {...a("tourne", { t: 1.3, r: -360 })}>
              <circle r="26" fill="none" stroke={C.blanc} strokeWidth="5" />
              <path d="M0 -30V30M-30 0H30M-21 -21L21 21M21 -21L-21 21" fill="none" stroke={C.blanc} strokeWidth="5" strokeLinecap="round" />
            </g>
          </g>
          {/* Le fanion, le dossier, le voyageur */}
          <path d="M-58 -46V-112" fill="none" stroke={C.nuit} strokeWidth="2.4" />
          <path d="M-58 -112L-84 -103L-58 -94Z" fill={C.mimosa} {...a("flotte", { r: 7, t: 0.5, o: "100% 50%" })} />
          <rect x="-50" y="-92" width="104" height="72" rx="14" fill={C.bougainvillier} />
          <g transform={tf(-60, -160, 0.31)}><Buste espece={espece} look={look} /></g>
          {/* Le cou du cygne, à la proue */}
          <path d="M92 -26Q80 -74 104 -94" fill="none" stroke={C.blanc} strokeWidth="19" strokeLinecap="round" />
          <circle cx="110" cy="-100" r="13.5" fill={C.blanc} />
          <path d="M120 -106L142 -98L120 -92Z" fill={C.corail} />
          <circle cx="113" cy="-103" r="2.1" fill={C.nuit} />
          {/* La coque, son aile, son liseré */}
          <path d="M-114 -28Q-118 12 -84 16H88Q114 12 120 -24Q60 -14 0 -16Q-60 -18 -114 -28Z" fill={C.blanc} />
          <path d="M-70 -17Q-40 6 20 -14Q-6 10 -46 8Q-66 2 -70 -17Z" fill={shade(C.blanc, -0.12)} />
          <path d="M-113 -8Q0 4 117 -6L114 3Q0 12 -110 2Z" fill={C.cerise} />
        </g>
      </g>
    </g>
    {/* L'eau, devant la coque */}
    <path d={vagues(584, 60, 4)} fill={NUIT_ROSE} {...a("defile", { dx: -60, t: 2.2 })} />
    <path d="M40 606H78L85 602L92 606H130V609H40ZM214 628H252L259 624L266 628H304V631H214Z" fill="#B4527F" {...a("clignote", { t: 1.1, o0: 0.4 })} />
  </>
);

// ---------------------------------------------------------------------------
// Un cerf-volant géant par grand vent : les nuages filent, la dune s'ébouriffe, et c'est
// le voyageur qui décolle.

/** Une touffe d'oyats, couchée par le vent. Plantée en (0, 0). */
function Oyats({ d = 0 }: { d?: number }) {
  return (
    <path
      d="M0 0Q4 -22 22 -30M0 0Q10 -16 30 -16M0 0Q-2 -20 10 -36M0 0Q8 -8 26 -4"
      fill="none"
      stroke={C.olive}
      strokeWidth="3"
      strokeLinecap="round"
      {...a("flotte", { r: 7, t: 0.34, d, o: "0% 100%" })}
    />
  );
}

const cerfVolant: SceneArt = ({ espece, look }) => {
  /** De combien le voyageur décolle. */
  const envol = 142;
  const trois = (
    <>
      <path d={nuage(110)} transform="translate(30 150)" />
      <path d={nuage(80)} transform="translate(250 262)" />
      <path d={nuage(130)} transform="translate(392 108)" />
    </>
  );
  return (
    <>
      <Ciel id="cerf-volant" couleurs={["#4FAEE6", "#A8DCF4", "#E6F4F2"]} bas={580} />
      {/* Les nuages filent : il y a du vent */}
      <g fill={C.blanc} {...a("defile", { dx: 520, t: 4.5 })}>
        {trois}
        <g transform="translate(-520 0)">{trois}</g>
      </g>
      <g fill={C.blanc} fillOpacity="0.8">
        <rect x="-60" y="200" width="52" height="3" rx="1.5" {...a("passe", { dx: 0, fx: 480, t: 0.9, n: "inf" })} />
        <rect x="-60" y="344" width="74" height="3" rx="1.5" {...a("passe", { dx: 0, fx: 500, t: 1.2, d: 0.4, n: "inf" })} />
        <rect x="-60" y="470" width="44" height="3" rx="1.5" {...a("passe", { dx: 0, fx: 470, t: 0.8, d: 0.7, n: "inf" })} />
      </g>
      <Mer y={566} bas={640} t={2.4} />
      {/* La dune */}
      <path d={relief([[-20, 646], [86, 618], [226, 672], [380, 634]])} fill={C.sable} />
      <path d={relief([[-20, 720], [140, 700], [380, 736]])} fill={shade(C.sable, -0.1)} />
      <g transform="translate(52 632)"><Oyats /></g>
      <g transform="translate(118 634)"><Oyats d={-0.1} /></g>
      <g transform="translate(300 658)"><Oyats d={-0.2} /></g>
      <g transform="translate(330 650)"><Oyats d={-0.05} /></g>
      {/* Un goéland qui n'avance plus */}
      <g transform="translate(70 452) scale(-0.6 0.6)"><g {...a("flotte", { dx: 12, dy: 5, t: 0.55 })}><Goeland /></g></g>
      {/* Le cerf-volant, sa ficelle, le voyageur */}
      <g {...a("flotte", { dx: 5, dy: 6, t: 1.7 })}>
        <g transform="translate(196 368)">
          <g {...a("flotte", { r: 7, t: 1.1, o: [0, 0] })}>
            <g {...a("flotte", { r: 16, t: 0.3, o: [-62, -100] })}>
              <path d="M-62 -100Q-42 -92 -32 -74Q-20 -80 -10 -64L-16 -58Q-24 -70 -36 -64Q-46 -82 -62 -90Z" fill={C.cerise} />
            </g>
            <g {...a("flotte", { r: 16, t: 0.26, d: -0.1, o: [62, -100] })}>
              <path d="M62 -100Q82 -92 92 -74Q104 -80 114 -64L108 -58Q100 -70 88 -64Q78 -82 62 -90Z" fill={C.persienne} />
            </g>
            <path d="M0 -170L62 -100L0 0L-62 -100Z" fill={C.bougainvillier} />
            <path d="M0 -170L62 -100H-62Z" fill={C.mimosa} />
            <path d="M0 -170L62 -100L0 0Z" fill={C.nuit} fillOpacity="0.12" />
            <path d="M0 -170V0M-62 -100H62" fill="none" stroke={C.nuit} strokeWidth="2" />
            <path d={etoiles([[0, -100, 17]])} fill={C.ivoire} />
          </g>
          <path d="M0 0V70" fill="none" stroke={C.nuit} strokeWidth="1.8" {...a("etire", { sy: (70 + envol) / 70, t: 1.7, d: 3.4, e: "rebond", o: "50% 0%" })} />
        </g>
        <g {...a("va", { dy: envol, t: 1.7, d: 3.4, e: "rebond" })}>
          <g transform={tf(176.1, 387.4, 0.24)}>
            <g {...a("flotte", { r: 6, t: 1.3, o: [83, 211] })}>
              <Perso espece={espece} look={look} bras={[175, 24]} jambes={[10, 16]} />
            </g>
          </g>
        </g>
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------
// Un pique-nique de gala sur la plage : nappe blanche, chandelier, et un crabe maître
// d'hôtel qui soulève la cloche d'argent. Dessous : un jambon-beurre.

/** Le crabe, en nœud papillon, la pince gauche levée. Posé sur ses pattes en (0, 0). */
function Crabe() {
  return (
    <>
      <path d="M-22 -8L-38 2M-20 -4L-34 10M22 -8L38 2M20 -4L34 10M-12 -2L-18 12M12 -2L18 12" fill="none" stroke={shade(C.cerise, -0.2)} strokeWidth="4" strokeLinecap="round" />
      <path d="M-20 -30Q-34 -52 -26 -68" fill="none" stroke={C.cerise} strokeWidth="7" strokeLinecap="round" />
      <path d="M-36 -70Q-30 -88 -14 -80L-24 -72L-12 -66Q-26 -58 -36 -70Z" fill={C.cerise} />
      <path d="M22 -26Q36 -30 40 -18" fill="none" stroke={C.cerise} strokeWidth="7" strokeLinecap="round" />
      <path d="M32 -18Q46 -26 52 -10L42 -12L44 0Q30 -4 32 -18Z" fill={shade(C.cerise, -0.2)} />
      <ellipse cx="0" cy="-22" rx="29" ry="19" fill={C.cerise} />
      <path d="M0 -41A29 19 0 0 1 0 -3Q16 -10 16 -22Q16 -34 0 -41Z" fill={shade(C.cerise, -0.2)} />
      <path d="M-9 -38V-50M9 -38V-50" fill="none" stroke={C.cerise} strokeWidth="3.4" />
      <path d={ronds(5.5, [[-9, -53], [9, -53]])} fill={C.blanc} />
      <path d={ronds(2.4, [[-8, -53], [10, -53]])} fill={C.nuit} />
      <path d="M0 -12L-11 -18V-6ZM0 -12L11 -18V-6Z" fill={C.nuit} />
      <circle cx="0" cy="-12" r="3" fill={C.grisFonce} />
    </>
  );
}

/** Une fourmi, de profil, qui marche vers la gauche. Posée en (0, 0), longue de 16. */
function Fourmi({ d = 0 }: { d?: number }) {
  return (
    <g {...a("saut", { dy: -2.5, t: 0.24, d })}>
      <path d={ronds(3.4, [[-6, -5]]) + ronds(2.6, [[0, -5]]) + ronds(4, [[7, -5]])} fill={C.nuit} />
      <path d="M-2 -3L-4 0M0 -3V0M3 -3L5 0M-8 -8L-12 -12M-7 -8L-8 -13" fill="none" stroke={C.nuit} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

/** Les trois flammes du chandelier : où elles sont, et leur décalage. */
const FLAMMES: readonly (readonly [x: number, y: number, d: number])[] = [[48, 484, 0], [70, 480, -0.2], [92, 484, -0.4]];

const piqueNique: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="pique-nique" couleurs={["#8FD2EF", "#D9EEF0", "#FCE9C8"]} bas={420} />
    <Astre x={296} y={222} r={25} />
    <g transform={tf(206, 300)}><path d={nuage(96)} fill={C.blanc} {...a("flotte", { dx: 8, t: 6 })} /></g>
    <Mer y={408} bas={490} />
    <path d={relief([[-20, 478], [120, 468], [260, 482], [380, 470]])} fill={C.sable} />
    <path d={relief([[-20, 668], [180, 652], [380, 672]])} fill={shade(C.sable, -0.1)} />
    {/* Le parasol */}
    <rect x="93" y="250" width="6" height="320" fill={C.boisFonce} />
    <path d="M-18 312Q-10 214 96 204Q202 214 210 312Q191 298 172 312Q153 298 134 312Q115 298 96 312Q77 298 58 312Q39 298 20 312Q1 298 -18 312Z" fill={C.bougainvillier} />
    <path d="M96 204Q56 222 58 312Q39 298 20 312Q16 232 96 204ZM96 204Q136 222 134 312Q153 298 172 312Q176 232 96 204Z" fill={C.ivoire} />
    <circle cx="96" cy="202" r="6" fill={METAL.or} />
    {/* Le voyageur, à table */}
    <g {...a("flotte", { dy: 2, t: 1.8 })}><g transform={tf(84, 322, 0.5)}><Buste espece={espece} look={look} /></g></g>
    {/* La nappe blanche et son tombé */}
    <path d="M36 546H324L344 566H16Z" fill={C.craie} />
    <path d="M16 566H344V636Q324 648 303 636Q282 648 262 636Q241 648 221 636Q200 648 180 636Q159 648 139 636Q118 648 98 636Q77 648 57 636Q36 648 16 636Z" fill={C.blanc} />
    <path d="M96 566V640M262 566V640" fill="none" stroke={C.craie} strokeWidth="4" />
    {/* Le chandelier : trois bougies qui dansent */}
    <path d="M70 546V508M48 520Q70 500 92 520M48 520V506M92 520V506" fill="none" stroke={METAL.argent} strokeWidth="4" strokeLinecap="round" />
    <path d="M58 546H82L78 538H62Z" fill={METAL.argent} />
    <path d="M44 506H52V486H44ZM66 508H74V482H66ZM88 506H96V486H88Z" fill={C.ivoire} />
    {FLAMMES.map(([x, y, d]) => (
      <path key={x} d={`M${x - 4} ${y}Q${x - 5} ${y - 9} ${x} ${y - 16}Q${x + 5} ${y - 9} ${x + 4} ${y}Z`} fill={C.mimosa} {...a("pulse", { s0: 0.8, s: 1.15, t: 0.3, d, o: "50% 100%" })} />
    ))}
    {/* Le seau à champagne */}
    <path d="M300 498Q296 486 304 478H310Q318 486 314 498Z" fill={C.persFonce} />
    <path d="M303 478H311V468H303Z" fill={METAL.or} />
    <path d="M286 500H330L324 546H292Z" fill={METAL.argent} />
    <path d="M284 498H332V504H284Z" fill={C.gris} />
    {/* L'assiette, et ce qu'il y avait sous la cloche */}
    <ellipse cx="180" cy="548" rx="50" ry="8" fill={METAL.argent} />
    <path d="M142 542Q150 522 180 522Q210 522 218 542Q180 552 142 542Z" fill={C.paille} />
    <path d="M144 540Q180 548 216 540L214 545Q180 554 146 545Z" fill={C.rose} />
    <path d="M146 546Q180 556 214 546Q210 552 180 553Q150 552 146 546Z" fill={shade(C.paille, -0.2)} />
    <path d="M160 530L168 526M178 528L186 524M196 530L204 526" fill="none" stroke={shade(C.paille, -0.25)} strokeWidth="2.4" strokeLinecap="round" />
    <path d={etoiles([[128, 520, 9], [232, 512, 7], [180, 500, 6]])} fill={C.blanc} {...a("pop", { t: 0.5, d: 4.5 })} />
    {/* Le maître d'hôtel arrive par le bout de la table, et soulève la cloche */}
    <g {...a("va", { dx: 160, t: 1.6, d: 1.3, e: "lin" })}>
      <g transform="translate(272 550)"><g {...a("saut", { dy: -5, t: 0.26, n: 9 })}><Crabe /></g></g>
    </g>
    <g {...a("va", { dx: -66, dy: 62, r: -22, t: 0.6, d: 3.9, e: "rebond", o: [248, 470] })}>
      <g transform="translate(248 470) rotate(22)">
        <path d="M-44 44A44 44 0 0 1 44 44Z" fill={METAL.argent} />
        <path d="M-30 30A32 32 0 0 1 -6 8" fill="none" stroke={C.blanc} strokeWidth="5" strokeLinecap="round" />
        <rect x="-48" y="42" width="96" height="6" rx="3" fill={C.gris} />
        <circle cx="0" cy="-4" r="6" fill={METAL.argent} />
      </g>
    </g>
    {/* Les fourmis ont déjà trouvé le canapé */}
    <g {...a("va", { dx: 300, t: 2.8, d: 4.6, e: "lin" })}>
      <g transform="translate(60 606)"><Fourmi /></g>
      <g transform="translate(82 606)">
        <Fourmi d={-0.08} />
        <rect x="-8" y="-20" width="16" height="9" rx="2" fill={C.mimosa} />
        <circle cx="0" cy="-22" r="3" fill={C.olive} />
      </g>
      <g transform="translate(104 606)"><Fourmi d={-0.16} /></g>
      <g transform="translate(126 606)"><Fourmi d={-0.04} /></g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Une plongée chez les poissons-clowns : on descend, ils sortent de l'anémone un par un,
// et ils trouvent ça très drôle.

/** Un poisson-clown, qui nage vers la droite. Centré en (0, 0), long de 58. */
function Clown({ d = 0 }: { d?: number }) {
  return (
    <g {...a("flotte", { r: 9, t: 0.34, d, o: "60% 50%" })}>
      <path d="M-18 0L-32 -13Q-36 0 -32 13Z" fill={C.corail} />
      <path d="M-4 -12Q4 -24 14 -14ZM-6 12Q0 22 10 13Z" fill={C.corail} />
      <ellipse cx="2" cy="0" rx="23" ry="14.5" fill={C.corail} />
      <path d="M11 -12.5Q16 0 11 12.5Q15 11 18.5 8Q21 0 18.5 -8Q15 -11 11 -12.5ZM-6 -13.6Q-1 0 -6 13.6Q-10 12.8 -13 11Q-9 0 -13 -11Q-10 -12.8 -6 -13.6ZM-19 -6.5Q-16.5 0 -19 6.5L-23 4Q-21.5 0 -23 -4Z" fill={C.blanc} />
      <circle cx="19" cy="-3" r="2.3" fill={C.nuit} />
    </g>
  );
}

/** Une anémone : des tentacules qui ondulent. Plantée en (0, 0), haute de `h`. */
function Anemone({ h, couleur }: { h: number; couleur: string }) {
  const brins = [-34, -22, -10, 2, 14, 26, 38];
  return (
    <>
      {brins.map((x, i) => (
        <path
          key={x}
          d={`M${x * 0.5} 0Q${x * 0.8} ${-h * 0.5} ${x} ${-h * (0.82 + (i % 2) * 0.18)}`}
          fill="none"
          stroke={i % 2 ? couleur : shade(couleur, 0.25)}
          strokeWidth="9"
          strokeLinecap="round"
          {...a("flotte", { r: 7, t: 1.1 + (i % 3) * 0.2, d: -i * 0.17, o: "50% 100%" })}
        />
      ))}
    </>
  );
}

/** Où chaque poisson finit, d'où il regarde, et quand il sort de l'anémone. */
const BANC: readonly (readonly [x: number, y: number, sens: 1 | -1, depart: number])[] = [
  [182, 284, 1, 2.6], [96, 372, 1, 3.0], [272, 380, -1, 3.4], [84, 470, 1, 3.8], [280, 476, -1, 4.2],
];

const plongee: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="plongee" couleurs={["#3AB0D2", "#1B6FA0", "#0E416D"]} />
    {/* La surface, tout en haut, et le jour qui descend */}
    <path d={vagues(118, 90, 7, -30)} fill="#9BE0EE" fillOpacity="0.75" {...a("defile", { dx: -90, t: 3.2 })} />
    <path d="M52 110L8 640H96L112 110Z" fill={C.blanc} fillOpacity="0.09" {...a("clignote", { t: 2.2, o0: 0.4 })} />
    <path d="M176 110L150 640H250L226 110Z" fill={C.blanc} fillOpacity="0.07" {...a("clignote", { t: 2.8, d: -1, o0: 0.4 })} />
    <path d="M288 110L296 640H372L330 110Z" fill={C.blanc} fillOpacity="0.09" {...a("clignote", { t: 2.5, d: -0.5, o0: 0.4 })} />
    {/* Une tortue passe, au loin */}
    <g {...a("passe", { dx: 260, fx: -280, fy: -40, t: 9, d: 0.4 })}>
      <path d="M156 236Q160 220 180 220Q200 220 204 236Q180 246 156 236ZM156 234L142 228L146 240ZM194 240L206 252L188 246ZM170 242L164 254L178 245Z" fill="#0E416D" fillOpacity="0.55" />
    </g>
    {/* Le fond : le sable, les rochers, le corail, les anémones */}
    <path d={relief([[-20, 676], [80, 656], [200, 680], [300, 652], [380, 670]])} fill="#E9D6A5" />
    <path d={ronds(4, [[40, 700], [150, 716], [236, 698], [330, 710]])} fill={shade("#E9D6A5", -0.2)} />
    <path d="M214 680Q222 640 250 640Q282 644 286 682Z" fill={C.ardoise} />
    <path d="M250 640Q282 644 286 682H262Q268 656 250 640Z" fill={shade(C.ardoise, -0.25)} />
    <path d="M322 664V626M322 646L306 628M322 640L338 620M322 654L340 644" fill="none" stroke={C.corail} strokeWidth="6" strokeLinecap="round" />
    <g transform="translate(300 656)"><Anemone h={56} couleur={C.lilas} /></g>
    <g transform="translate(74 662)"><Anemone h={96} couleur={C.bougClair} /></g>
    {/* Le voyageur : masque, tuba, palmes */}
    <g {...a("va", { dy: -470, t: 2.4, e: "sortie" })}>
      <g {...a("flotte", { dy: 5, r: 2, t: 1.9 })}>
        <g transform={tf(116, 305, 0.32)}>
          <path d="M96 566L44 700L176 668Z" fill={C.mimosa} />
          <path d="M304 566L356 700L224 668Z" fill={shade(C.mimosa, -0.18)} />
          <Perso espece={espece} look={look} bras={[72, 72]} jambes={[16, 16]} />
          <path d="M272 236Q330 236 326 150V58" fill="none" stroke={C.bougainvillier} strokeWidth="16" strokeLinecap="round" />
          <rect x="314" y="34" width="24" height="30" rx="6" fill={C.bougFonce} />
          <rect x="104" y="116" width="192" height="100" rx="42" fill="#BEE7F5" fillOpacity="0.38" />
          <rect x="104" y="116" width="192" height="100" rx="42" fill="none" stroke={C.mimosa} strokeWidth="13" />
          <path d="M98 166H82M302 166H318" fill="none" stroke={C.nuit} strokeWidth="16" strokeLinecap="round" />
          <path d="M126 150Q142 132 166 134" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="8" strokeLinecap="round" />
        </g>
        {/* Ses bulles */}
        <g fill={C.blanc} fillOpacity="0.7">
          <circle cx="222" cy="296" r="6" {...a("passe", { fy: -150, fx: 8, t: 1.5, n: "inf" })} />
          <circle cx="226" cy="300" r="4" {...a("passe", { fy: -170, fx: -10, t: 1.8, d: 0.5, n: "inf" })} />
          <circle cx="220" cy="302" r="3" {...a("passe", { fy: -140, fx: 14, t: 1.3, d: 0.9, n: "inf" })} />
        </g>
        <path d={ronds(5.5, [[224, 280]]) + ronds(3.5, [[232, 256], [218, 236]]) + ronds(2.4, [[228, 214]])} fill={C.blanc} fillOpacity="0.7" />
      </g>
    </g>
    {/* Ils sortent de l'anémone, un par un */}
    {BANC.map(([x, y, sens, depart]) => (
      <g key={depart} {...a("va", { dx: 74 - x, dy: 632 - y, t: 1.5, d: depart, e: "sortie" })}>
        <g transform={`translate(${x} ${y}) scale(${sens} 1)`}><Clown d={-depart} /></g>
      </g>
    ))}
  </>
);

// ---------------------------------------------------------------------------
// Un vol en montgolfière au petit matin : le village dort encore, le ballon monte, le
// soleil se lève derrière les collines.

const montgolfiere: SceneArt = ({ espece, look }) => (
  <>
    <Ciel id="montgolfiere" couleurs={["#474687", "#B8719F", "#F5AE8A", "#FDE5B4"]} bas={640} />
    <path d={ronds(1.4, [[40, 130], [120, 170], [300, 140], [250, 210], [70, 230]])} fill={C.blanc} {...a("disparait", { t: 4, d: 1 })} />
    <g transform={tf(-30, 420)}><path d={nuage(120)} fill="#F9C9B6" fillOpacity="0.8" {...a("flotte", { dx: 10, t: 6 })} /></g>
    <g transform={tf(262, 300)}><path d={nuage(90)} fill="#F9C9B6" fillOpacity="0.7" {...a("flotte", { dx: 8, t: 7 })} /></g>
    {/* Le soleil se lève derrière les collines */}
    <g {...a("va", { dy: 84, t: 7.2, e: "lin" })}><Astre x={268} y={566} r={34} couleur="#FFE08A" halo="#FFD06A" /></g>
    <path d={relief([[-20, 604], [70, 572], [170, 606], [280, 574], [380, 598]])} fill="#8E79B8" />
    <path d={relief([[-20, 644], [100, 616], [220, 652], [330, 620], [380, 642]])} fill="#6A5A9E" />
    {/* Le village dort : un clocher, quatre toits, une fenêtre qui s'allume */}
    <path d="M60 632V606H82V628ZM92 626V596H110V624ZM118 622V610H140V628ZM150 632V616H170V638Z" fill="#F3D3C4" />
    <path d="M56 608L71 594L86 608ZM114 612L129 600L144 612ZM146 618L160 606L174 618Z" fill={C.brique} />
    <path d="M90 598L101 568L112 598Z" fill={C.ardoise} />
    <path d="M66 614H72V620H66ZM124 614H130V620H124Z" fill="#4B3F7C" />
    <rect x="156" y="622" width="6" height="6" fill={C.mimosa} {...a("apparait", { t: 0.3, d: 2.6 })} />
    <path d={relief([[-20, 694], [120, 668], [260, 704], [380, 676]])} fill="#4B3F7C" />
    {/* La brume du matin */}
    <rect x="-40" y="634" width="250" height="12" rx="6" fill={C.blanc} fillOpacity="0.4" {...a("flotte", { dx: 16, t: 4 })} />
    <rect x="150" y="664" width="270" height="14" rx="7" fill={C.blanc} fillOpacity="0.32" {...a("flotte", { dx: -14, t: 5 })} />
    {/* Trois oiseaux matinaux */}
    <g {...a("va", { dx: -170, dy: 30, t: 7.4, e: "lin" })}>
      <g transform="translate(64 262) scale(0.6)"><Mouette couleur="#33265F" /></g>
      <g transform="translate(40 276) scale(0.5)"><Mouette couleur="#33265F" /></g>
      <g transform="translate(46 248) scale(0.5)"><Mouette couleur="#33265F" /></g>
    </g>
    {/* Le ballon monte */}
    <g {...a("va", { dy: 320, t: 5.8, e: "cubic-bezier(.35,0,.25,1)" })}>
      <g transform="translate(172 300)">
        <g {...a("flotte", { r: 1.6, dx: 4, t: 2.4, o: [0, 0] })}>
          <path d="M-28 122L-30 200M28 122L30 200M-10 122L-12 200M10 122L12 200" fill="none" stroke={C.boisFonce} strokeWidth="1.6" />
          <path d="M0 -112C64 -112 98 -62 98 -12C98 38 46 70 30 112H-30C-46 70 -98 38 -98 -12C-98 -62 -64 -112 0 -112Z" fill={C.bougainvillier} />
          <path d="M0 -112C40 -98 62 -56 62 -10C62 42 36 76 26 112H-26C-36 76 -62 42 -62 -10C-62 -56 -40 -98 0 -112Z" fill={C.mimosa} />
          <path d="M0 -112C16 -90 26 -50 26 -10C26 44 14 80 10 112H-10C-14 80 -26 44 -26 -10C-26 -50 -16 -90 0 -112Z" fill={C.bougainvillier} />
          <path d="M0 -112C64 -112 98 -62 98 -12C98 38 46 70 30 112H20C38 70 82 34 82 -12C82 -60 54 -104 0 -112Z" fill={C.nuit} fillOpacity="0.14" />
          <rect x="-30" y="110" width="60" height="12" fill={C.bougFonce} />
          <g {...a("pulse", { s0: 0.7, s: 1.2, t: 0.22, o: "50% 100%" })}>
            <path d="M-7 138Q-12 124 0 110Q12 124 7 138Z" fill={C.mimosa} />
          </g>
          <rect x="-8" y="136" width="16" height="9" rx="2" fill={C.gris} />
          <g transform={tf(-52, 132, 0.26)}><Buste espece={espece} look={look} /></g>
          <path d="M-38 206H38L32 258H-32Z" fill={C.bois} />
          <path d="M-36 222H36M-34 238H34M-18 206L-15 258M0 206V258M18 206L15 258" fill="none" stroke={C.boisFonce} strokeOpacity="0.6" strokeWidth="1.6" />
          <rect x="-43" y="198" width="86" height="11" rx="4" fill={C.boisFonce} />
          <path d="M-44 214Q-52 216 -52 228Q-52 238 -44 238ZM44 214Q52 216 52 228Q52 238 44 238Z" fill={C.paille} />
        </g>
      </g>
    </g>
  </>
);

// ---------------------------------------------------------------------------
// Un saut en parachute (parachute compris) : l'avion passe, on tombe, les nuages remontent
// à toute allure, puis la voile s'ouvre et tout devient très calme.

const parachute: SceneArt = ({ espece, look }) => {
  const filants = (
    <>
      <path d={nuage(120)} transform="translate(-10 90)" />
      <path d={nuage(96)} transform="translate(250 380)" />
      <path d={nuage(110)} transform="translate(40 640)" />
    </>
  );
  return (
    <>
      <Ciel id="parachute" couleurs={["#3D95DC", "#9AD5F4", "#DDF2F5"]} />
      {/* L'avion, d'où l'on vient de sauter */}
      <g {...a("passe", { dx: -120, fx: 480, fy: -30, t: 1.9, d: 0.1 })}>
        <g transform="translate(0 170)">
          <path d="M-50 0Q-50 -12 -30 -12H30Q52 -10 56 0Q52 10 30 10H-30Q-50 10 -50 0Z" fill={C.blanc} />
          <path d="M-48 -4L-64 -26H-48L-34 -10Z" fill={C.cerise} />
          <path d="M-6 0L-22 26H2L16 0Z" fill={C.grisClair} />
          <path d={ronds(3.5, [[-16, -3], [-2, -3], [12, -3], [26, -3]])} fill={C.azur} />
        </g>
      </g>
      {/* La chute : les nuages remontent, l'air siffle */}
      <g {...a("disparait", { t: 0.5, d: 3.3 })}>
        <g fill={C.blanc} {...a("defile", { dy: -800, t: 1.15 })}>
          {filants}
          <g transform="translate(0 800)">{filants}</g>
        </g>
        <g fill={C.blanc} fillOpacity="0.85">
          <rect x="62" y="820" width="3" height="70" rx="1.5" {...a("passe", { fy: -960, t: 0.55, n: "inf" })} />
          <rect x="128" y="820" width="3" height="50" rx="1.5" {...a("passe", { fy: -940, t: 0.48, d: 0.2, n: "inf" })} />
          <rect x="250" y="820" width="3" height="80" rx="1.5" {...a("passe", { fy: -980, t: 0.6, d: 0.1, n: "inf" })} />
          <rect x="310" y="820" width="3" height="56" rx="1.5" {...a("passe", { fy: -950, t: 0.5, d: 0.35, n: "inf" })} />
        </g>
      </g>
      {/* Puis le calme : les nuages ne bougent presque plus */}
      <g fill={C.blanc} {...a("apparait", { t: 0.7, d: 3.4 })}>
        <g transform="translate(-6 236)"><path d={nuage(120)} {...a("flotte", { dy: 6, dx: 4, t: 4 })} /></g>
        <g transform="translate(262 336)"><path d={nuage(84)} {...a("flotte", { dy: 5, t: 5 })} /></g>
        <g transform="translate(20 520)"><path d={nuage(96)} fillOpacity="0.85" {...a("flotte", { dy: 6, t: 4.5 })} /></g>
      </g>
      {/* Le sol arrive : un pré, une cible, une manche à air */}
      <g {...a("va", { dy: 330, t: 2.8, d: 4.6, e: "sortie" })}>
        <path d={relief([[-20, 626], [110, 612], [250, 630], [380, 614]])} fill={C.vert} />
        <path d={relief([[-20, 700], [180, 686], [380, 706]])} fill={shade(C.vert, -0.12)} />
        <ellipse cx="180" cy="650" rx="62" ry="16" fill={C.blanc} />
        <ellipse cx="180" cy="650" rx="42" ry="10.5" fill={C.cerise} />
        <ellipse cx="180" cy="650" rx="20" ry="5" fill={C.blanc} />
        <rect x="312" y="566" width="4" height="56" fill={C.grisFonce} />
        <g {...a("flotte", { r: 7, t: 0.6, o: "100% 50%" })}>
          <path d="M312 566L270 574L272 588L312 584Z" fill={C.blanc} />
          <path d="M312 566L298 568.5L299 585.5L312 584ZM285 571L272 574L272 588L286 587Z" fill={C.cerise} />
        </g>
      </g>
      {/* Le voyageur, bras et jambes en croix ; puis la voile, d'un coup */}
      <g {...a("flotte", { r: 6, t: 1.7, o: [180, 232] })}>
        <g {...a("pop", { t: 0.5, d: 3.4, o: [180, 404] })}>
          <path d="M70 310L160 404M107 310L164 404M143 310L172 404M217 310L188 404M253 310L196 404M290 310L200 404" fill="none" stroke={C.nuit} strokeOpacity="0.6" strokeWidth="1.3" />
          <path d="M70 310A110 96 0 0 1 290 310Q271.5 296 253 310Q235 296 217 310Q198.5 296 180 310Q161.5 296 143 310Q125 296 107 310Q88.5 296 70 310Z" fill={C.cerise} />
          <path d="M107 310Q110 240 152 218Q140 252 143 310Q125 296 107 310ZM253 310Q250 240 208 218Q220 252 217 310Q235 296 253 310Z" fill={C.ivoire} />
          <path d="M180 214Q244 222 290 310Q271.5 296 262 303Q236 236 180 214Z" fill={C.nuit} fillOpacity="0.14" />
        </g>
        <g {...a("saut", { dy: -16, t: 0.6, d: 3.4, n: 1 })}>
          <g transform={tf(120, 380, 0.3)}>
            <g {...a("flotte", { r: 4, t: 0.22 })}>
              <Perso espece={espece} look={look} bras={[108, 108]} jambes={[30, 30]} />
            </g>
          </g>
        </g>
      </g>
    </>
  );
};

export const SCENES_PORT: Record<string, SceneArt> = {
  glace,
  "balade-en-pedalo": pedalo,
  "cerf-volant": cerfVolant,
  "pique-nique": piqueNique,
  plongee,
  montgolfiere,
  parachute,
};
