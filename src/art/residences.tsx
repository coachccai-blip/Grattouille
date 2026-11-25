// Les résidences de l'Agence Colette, et le décor de départ (BRIEF.md, section 9.4 et annexe A).
//
// Décor du domaine, vu de face. viewBox 0 0 400 260. Le sol occupe le bas de
// l'image (ligne d'horizon vers y = 200) ; le ciel reste transparent, il est
// peint par l'écran avec le dégradé du meilleur lieu débloqué. L'avatar se tient
// devant, au centre : garder le milieu bas dégagé de tout détail important.
// `banc` : sans résidence, le banc du port avec une valise.
//
// Une seule animation d'ambiance par décor, lente. Elle est jouée par la feuille de
// style : il suffit de poser UNE de ces classes sur UN élément ou groupe du dessin.
//   amb-scintille : la mer, une vitre, une étoile (l'opacité respire)
//   amb-flotte    : un fanion, un drapeau, du linge (léger balancement)
//   amb-vacille   : une lampe, une lanterne (la lumière tremble)

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Une rangée de rectangles identiques (fenêtres, volets), d'un seul tracé. */
const rangee = (xs: number[], y: number, w: number, h: number) => xs.map((x) => `M${x} ${y}h${w}v${h}h${-w}Z`).join("");

/** Une rangée de baies cintrées (fenêtres ou portes à sommet arrondi), d'un seul tracé. */
const baies = (xs: number[], y: number, w: number, h: number) =>
  xs.map((x) => `M${x} ${y + h}V${y + w / 2}Q${x} ${y} ${x + w / 2} ${y}Q${x + w} ${y} ${x + w} ${y + w / 2}V${y + h}Z`).join("");

/** Les cinq palmes d'un palmier, en couronne autour du sommet du tronc. */
const palmes = (x: number, y: number) =>
  ["q-20 -14 -38 6q22 -6 38 -6", "q-12 -26 -34 -20q20 2 34 20", "q-6 -22 6 -34q0 18 -6 34", "q12 -26 34 -20q-20 2 -34 20", "q20 -14 38 6q-22 -6 -38 -6"]
    .map((palme) => `M${x} ${y}${palme}Z`)
    .join("");

const banc: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et le quai */}
    <rect x="0" y="150" width="400" height="60" fill={C.mer} />
    <path className="amb-scintille" d="M0 162H60L70 158L80 162H190L200 158L210 162H330L340 158L350 162H400V168H0Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
    <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
    {/* Un voilier au loin */}
    <path d="M296 150L296 104L326 150Z" fill={C.blanc} />
    <path d="M292 150L292 116L272 150Z" fill={C.craie} />
    <path d="M266 152H332L324 162H274Z" fill={C.cerise} />
    {/* Réverbère */}
    <rect x="62" y="70" width="8" height="150" fill={C.nuit} />
    <path d="M52 220H80L76 208H56Z" fill={C.nuit} />
    <path d="M50 70H82L76 44H56Z" fill={C.mimosa} />
    <path d="M66 44H76L82 70H66Z" fill={shade(C.mimosa, -0.2)} />
    <rect x="48" y="66" width="36" height="6" fill={C.nuit} />
    {/* Le banc */}
    <rect x="118" y="168" width="164" height="12" rx="3" fill={C.bois} />
    <rect x="118" y="186" width="164" height="12" rx="3" fill={C.bois} />
    <rect x="112" y="204" width="176" height="12" rx="3" fill={C.bois} />
    <rect x="118" y="174" width="164" height="6" fill={shade(C.bois, -0.22)} />
    <rect x="118" y="192" width="164" height="6" fill={shade(C.bois, -0.22)} />
    <rect x="112" y="210" width="176" height="6" fill={shade(C.bois, -0.22)} />
    <rect x="128" y="162" width="10" height="78" fill={C.nuit} />
    <rect x="262" y="162" width="10" height="78" fill={C.nuit} />
    {/* La valise, posée à droite du banc */}
    <rect x="306" y="196" width="58" height="44" rx="6" fill={C.terracotta} />
    <rect x="336" y="196" width="28" height="44" rx="6" fill={shade(C.terracotta, -0.22)} />
    <rect x="306" y="212" width="58" height="6" fill={C.boisFonce} />
    <path d="M324 196V186Q335 178 346 186V196" fill="none" stroke={C.boisFonce} strokeWidth="5" />
    <ellipse cx="335" cy="244" rx="36" ry="4" fill={C.nuit} fillOpacity="0.18" />
  </Svg>
);

/** La chambre de bonne : une lucarne allumée tout en haut, et le linge qui sèche sur les toits. */
const chambreDeBonne: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* Le trottoir */}
    <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
    <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
    {/* Les immeubles voisins, plus bas */}
    <rect x="40" y="102" width="102" height="100" fill={shade(C.creme, -0.12)} />
    <path d="M32 104L46 84H142V104Z" fill={C.terracotta} />
    <rect x="326" y="58" width="16" height="38" fill={C.terracotta} />
    <rect x="258" y="98" width="106" height="104" fill={shade(C.creme, -0.2)} />
    <rect x="254" y="92" width="114" height="8" fill={shade(C.creme, -0.34)} />
    <path d={rangee([56, 102], 118, 22, 28) + rangee([56, 102], 160, 22, 28) + rangee([278, 322], 114, 22, 28) + rangee([278, 322], 158, 22, 28)} fill={C.ardoise} />
    {/* L'immeuble : étroit, tout en hauteur, volets clos */}
    <rect x="140" y="72" width="120" height="130" fill={C.creme} />
    <rect x="140" y="72" width="120" height="6" fill={shade(C.creme, -0.2)} />
    <path d={rangee([158, 218], 88, 24, 30) + rangee([158, 218], 130, 24, 30)} fill={C.ardoise} />
    {/* Le toit de zinc et sa cheminée */}
    <rect x="152" y="10" width="24" height="26" fill={C.terracotta} />
    <path d="M155 10V2H162V10ZM166 10V4H173V10Z" fill={shade(C.terracotta, -0.3)} />
    <path d="M134 72L148 30H252L266 72Z" fill={C.ardoise} />
    <path d="M232 30H252L266 72H232Z" fill={shade(C.ardoise, -0.22)} />
    {/* La lucarne et sa fenêtre allumée */}
    <path d="M174 50L200 30L226 50Z" fill={shade(C.ardoise, -0.4)} />
    <rect x="180" y="50" width="40" height="22" fill={C.creme} />
    <rect x="189" y="53" width="22" height="17" fill={C.mimosa} />
    <path d="M200 53V70M189 61H211" fill="none" stroke={C.creme} strokeWidth="2" />
    {/* Le fil et le linge. `amb-flotte` balance à partir du bord gauche, comme un fanion :
        le repère est tourné d'un quart de tour pour que ce bord soit le haut du linge, pincé sur le fil. */}
    <path d="M220 52Q276 70 334 60" fill="none" stroke={shade(C.ardoise, -0.4)} strokeWidth="1.5" />
    <g transform="rotate(90 276 60)">
      <g className="amb-flotte">
        <g transform="rotate(-90 276 60)">
          <path d="M238 60H256L262 67L257 71V86H237V71L232 67Z" fill={C.blanc} />
          <path d="M270 64H280V78H287V85H270Z" fill={C.terracotta} />
          <rect x="294" y="65" width="26" height="22" fill={C.blanc} />
        </g>
      </g>
    </g>
  </Svg>
);

/** Le studio sous les toits : la grande verrière d'atelier, et son bout de balcon. */
const studio: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* Le trottoir */}
    <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
    <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
    {/* La façade rose, ses fenêtres et ses persiennes ouvertes */}
    <rect x="56" y="100" width="288" height="102" fill={C.rose} />
    <rect x="286" y="100" width="58" height="102" fill={shade(C.rose, -0.12)} />
    <path d={rangee([76, 126, 250, 300], 116, 24, 44) + baies([78, 186, 294], 166, 28, 36)} fill={shade(C.ardoise, -0.6)} />
    <path d={rangee([67, 100, 117, 150, 241, 274, 291, 324], 114, 9, 48)} fill={C.persienne} />
    {/* La cheminée, le toit d'ardoise, la corniche */}
    <rect x="86" y="20" width="22" height="30" fill={shade(C.rose, -0.3)} />
    <path d="M48 100L68 46H332L352 100Z" fill={C.ardoise} />
    <path d="M300 46H332L352 100H300Z" fill={shade(C.ardoise, -0.22)} />
    <rect x="48" y="96" width="304" height="7" fill={C.blanc} />
    {/* La verrière : montants blancs, vitres, reflets */}
    <path d="M140 96V48L200 22L260 48V96Z" fill={C.blanc} />
    <path d="M146 96V52L200 29L254 52V96Z" fill={C.ciel} />
    <path className="amb-scintille" d="M150 92L186 40L198 35L156 96H150ZM200 96L236 50L246 53L212 96Z" fill={shade(C.ciel, 0.6)} />
    <path d="M173 96V41M200 96V29M227 96V41M146 66H254" fill="none" stroke={C.blanc} strokeWidth="3" />
    {/* Le balcon et ses plantes */}
    <path d="M142 80a9 9 0 1 0 18 0a9 9 0 1 0 -18 0ZM240 80a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z" fill={C.persienne} />
    <path d="M136 90H264" fill="none" stroke={shade(C.ardoise, -0.6)} strokeWidth="14" strokeDasharray="2 8" />
    <rect x="132" y="80" width="136" height="3" fill={shade(C.ardoise, -0.6)} />
    <rect x="130" y="96" width="140" height="7" fill={C.blanc} />
  </Svg>
);

/** L'appartement avec balcon : un bel étage, du fer forgé, le bougainvillier qui déborde. */
const appartement: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* Le trottoir */}
    <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
    <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
    {/* Le toit de tuiles, la façade, la corniche */}
    <path d="M26 30L46 10H354L374 30Z" fill={C.terracotta} />
    <rect x="24" y="36" width="352" height="166" fill={C.paille} />
    <rect x="24" y="134" width="352" height="68" fill={shade(C.paille, -0.12)} />
    <rect x="16" y="28" width="368" height="10" fill={C.blanc} />
    <rect x="24" y="38" width="352" height="5" fill={shade(C.paille, -0.25)} />
    {/* Les portes-fenêtres du bel étage, leurs persiennes */}
    <path d={rangee([60, 180, 300], 52, 40, 74)} fill={C.blanc} />
    <path d={rangee([65, 185, 305], 57, 30, 69) + baies([60, 300], 152, 40, 50)} fill={C.nuit} />
    <path d={rangee([45, 100, 165, 220, 285, 340], 54, 15, 72)} fill={C.persienne} />
    {/* Les lanternes */}
    <path d="M132 62L140 54L148 62V88H132ZM252 62L260 54L268 62V88H252Z" fill={C.nuit} />
    <g className="amb-vacille">
      <rect x="135" y="64" width="10" height="20" fill={shade(C.paille, 0.6)} />
      <rect x="255" y="64" width="10" height="20" fill={shade(C.paille, 0.6)} />
    </g>
    {/* Le balcon filant : la dalle, son ombre, le fer forgé */}
    <rect x="34" y="126" width="332" height="7" fill={C.blanc} />
    <rect x="34" y="133" width="332" height="6" fill={shade(C.paille, -0.32)} />
    <path d="M38 114H362" fill="none" stroke={C.nuit} strokeWidth="24" strokeDasharray="1.6 6.4" />
    <rect x="34" y="100" width="332" height="3" fill={C.nuit} />
    {/* Le bougainvillier */}
    <path d="M28 96Q40 80 58 92Q72 106 68 128Q62 150 44 152Q26 148 28 122Z" fill={C.persFonce} />
    <path d="M32 98a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM46 110a9 9 0 1 0 18 0a9 9 0 1 0 -18 0ZM30 118a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM44 132a8 8 0 1 0 16 0a8 8 0 1 0 -16 0ZM33 140a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z" fill={C.bougainvillier} />
  </Svg>
);

/** La maison de pêcheur : murs blanchis, volets bleus, le filet qui sèche, la mer derrière. */
const maisonPecheur: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et la plage */}
    <rect x="0" y="150" width="400" height="58" fill={C.mer} />
    <path className="amb-scintille" d="M0 164H22L32 160L42 164H70V169H0ZM330 170H352L362 166L372 170H400V175H330ZM4 184H44V188H4Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="200" width="400" height="60" fill={C.sable} />
    <rect x="0" y="200" width="400" height="7" fill={shade(C.sable, -0.15)} />
    {/* Une barque à voile */}
    <path d="M358 150V108L386 150Z" fill={C.craie} />
    <path d="M338 152H394L386 164H346Z" fill={C.cerise} />
    {/* La maison : cheminée, murs, toit de tuiles */}
    <rect x="270" y="34" width="24" height="40" fill={C.craie} />
    <rect x="266" y="30" width="32" height="7" fill={C.terracotta} />
    <rect x="84" y="112" width="232" height="92" fill={C.craie} />
    <rect x="262" y="112" width="54" height="92" fill={shade(C.craie, -0.1)} />
    <path d="M70 116L100 62H300L330 116Z" fill={C.terracotta} />
    <path d="M262 62H300L330 116H262Z" fill={shade(C.terracotta, -0.2)} />
    <rect x="98" y="58" width="204" height="6" fill={shade(C.terracotta, -0.35)} />
    {/* Fenêtres, volets et porte bleus */}
    <path d={rangee([108, 264], 134, 28, 36)} fill={shade(C.mer, -0.6)} />
    <path d={rangee([94, 136, 250, 292], 132, 14, 40) + rangee([184], 140, 32, 64)} fill={C.azur} />
    {/* La bouée au-dessus de la porte */}
    <circle cx="200" cy="125" r="9" fill="none" stroke={C.cerise} strokeWidth="6" />
    <circle cx="200" cy="125" r="9" fill="none" stroke={C.craie} strokeWidth="6" strokeDasharray="4 10.14" />
    {/* Le filet qui sèche entre deux piquets */}
    <path d="M20 152Q42 170 64 152V186Q42 200 20 186Z" fill={shade(C.sable, -0.38)} />
    <path d="M20 152Q42 170 64 152" fill="none" stroke={C.cerise} strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 8.9" />
    <path d="M20 146V214M64 146V214" fill="none" stroke={shade(C.sable, -0.6)} strokeWidth="4" strokeLinecap="round" />
  </Svg>
);

/** Le loft sur le port : un entrepôt de brique aux grandes verrières, la terrasse sur le toit. */
const loft: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et le quai */}
    <rect x="0" y="150" width="400" height="58" fill={C.mer} />
    <path d="M0 164H24L34 160L44 164H66V169H0ZM338 164H356L366 160L376 164H400V169H338Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
    <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
    {/* Les bittes d'amarrage */}
    <path d="M22 228V216H20V209Q20 204 29 204Q38 204 38 209V216H36V228ZM364 228V216H362V209Q362 204 371 204Q380 204 380 209V216H378V228Z" fill={C.nuit} />
    {/* La terrasse : parasol, olivier en pot */}
    <rect x="108" y="26" width="3" height="36" fill={C.nuit} />
    <path d="M80 38Q110 2 140 38Z" fill={C.mimosa} />
    <path d="M99 38Q101 14 110 11Q119 14 121 38Z" fill={shade(C.mimosa, 0.65)} />
    <circle cx="292" cy="36" r="13" fill={C.feuille} />
    <path d="M301.2 26.8A13 13 0 0 1 282.8 45.2A18 18 0 0 0 301.2 26.8Z" fill={shade(C.feuille, -0.25)} />
    <path d="M284 60H300L298 48H286Z" fill={shade(C.brique, -0.35)} />
    {/* L'entrepôt de brique et son couronnement de pierre */}
    <rect x="70" y="64" width="260" height="140" fill={C.brique} />
    <rect x="276" y="64" width="54" height="140" fill={shade(C.brique, -0.2)} />
    <rect x="64" y="58" width="272" height="9" fill={C.pierre} />
    {/* Les grandes verrières cintrées */}
    <path d={baies([86, 172, 258], 84, 56, 96)} fill={C.nuit} />
    <path d={baies([91, 177, 263], 89, 46, 86)} fill={C.ciel} />
    <path d="M114 89V175M200 89V175M286 89V175M91 114H137M91 135H137M91 156H137M177 114H223M177 135H223M177 156H223M263 114H309M263 135H309M263 156H309" fill="none" stroke={C.nuit} strokeWidth="2.5" />
    <path d={rangee([82, 168, 254], 180, 64, 5)} fill={C.pierre} />
    {/* La guirlande d'ampoules */}
    <path d="M74 60V20M326 60V20M74 22Q200 56 326 22" fill="none" stroke={C.nuit} strokeWidth="1.5" />
    <path className="amb-vacille" d="M74 22Q200 56 326 22" fill="none" stroke={C.mimosa} strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 18.3" />
  </Svg>
);

/** La villa « Les Mimosas » : une tourelle, un balcon, et les mimosas en fleur de chaque côté. */
const villaMimosas: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La pelouse */}
    <rect x="0" y="200" width="400" height="60" fill={C.vert} />
    <rect x="0" y="200" width="400" height="7" fill={shade(C.vert, -0.2)} />
    {/* Les mimosas : troncs, feuillage, pompons */}
    <path d="M50 204V150M354 204V150" fill="none" stroke={shade(C.terracotta, -0.5)} strokeWidth="7" />
    <path d="M6 128Q6 94 42 90Q80 86 90 118Q96 152 58 160Q14 162 6 128ZM316 128Q316 96 352 94Q390 96 394 128Q394 160 356 162Q318 160 316 128Z" fill={C.persFonce} />
    <path d="M90 118Q96 152 58 160Q30 161 16 148Q40 156 62 146Q82 136 84 104Q88 110 90 118ZM394 128Q394 160 356 162Q336 161 324 150Q346 158 366 148Q386 136 388 108Q393 116 394 128Z" fill={shade(C.persFonce, -0.25)} />
    <path d="M16 122Q44 92 82 116M22 144Q50 122 84 138M326 120Q354 98 386 122M330 146Q356 128 386 142" fill="none" stroke={C.mimosa} strokeWidth="9" strokeLinecap="round" strokeDasharray="0.1 12.9" />
    {/* La villa : murs, toits de tuiles */}
    <rect x="100" y="100" width="170" height="104" fill={C.creme} />
    <path d="M90 102L110 66H262L280 102Z" fill={C.terracotta} />
    <path d="M112 102L140 62L168 102Z" fill={C.creme} />
    <path d="M104 102L140 50L176 102H166L140 64L114 102Z" fill={shade(C.terracotta, -0.25)} />
    {/* La tourelle et son fanion */}
    <rect x="252" y="66" width="60" height="138" fill={C.creme} />
    <rect x="292" y="66" width="20" height="138" fill={shade(C.creme, -0.12)} />
    <path d="M244 68L282 20L320 68Z" fill={C.terracotta} />
    <path d="M282 20L320 68H282Z" fill={shade(C.terracotta, -0.25)} />
    <rect x="281" y="4" width="2" height="18" fill={C.nuit} />
    <path className="amb-flotte" d="M283 5L304 10L283 15Z" fill={C.mimosa} />
    {/* Fenêtres, œil-de-bœuf, persiennes */}
    <path d={rangee([118], 112, 24, 34) + rangee([186], 112, 30, 38) + rangee([116], 160, 28, 44) + baies([184], 160, 34, 44) + baies([270], 82, 24, 42) + rangee([270], 150, 24, 36) + "M133 88a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z"} fill={C.nuit} />
    <path d={rangee([108, 142], 112, 10, 34) + rangee([106, 144], 160, 10, 44)} fill={C.persienne} />
    {/* Le balcon blanc */}
    <path d="M178 142H229" fill="none" stroke={C.blanc} strokeWidth="14" strokeDasharray="3 5" />
    <rect x="174" y="133" width="58" height="3" fill={C.blanc} />
    <rect x="172" y="149" width="62" height="5" fill={C.blanc} />
  </Svg>
);

/** L'hôtel particulier : pierre blonde, fronton, toit d'ardoise, et les lanternes de la grille. */
const hotelParticulier: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La cour de gravier */}
    <rect x="0" y="200" width="400" height="60" fill={C.sable} />
    <rect x="0" y="200" width="400" height="7" fill={shade(C.sable, -0.15)} />
    {/* Les cheminées, le toit d'ardoise, ses lucarnes */}
    <path d="M70 52V20H90V52ZM310 52V20H330V52Z" fill={shade(C.craie, -0.25)} />
    <path d="M36 88L56 44H344L364 88Z" fill={C.ardoise} />
    <path d="M308 44H344L364 88H308Z" fill={shade(C.ardoise, -0.22)} />
    <path d={baies([84, 118, 264, 298], 56, 18, 28)} fill={C.craie} />
    <path d={baies([88, 122, 268, 302], 61, 10, 21)} fill={C.nuit} />
    {/* La façade, sa corniche, son bandeau */}
    <rect x="44" y="86" width="312" height="118" fill={C.craie} />
    <rect x="300" y="86" width="56" height="118" fill={shade(C.craie, -0.1)} />
    <rect x="40" y="84" width="320" height="6" fill={shade(C.craie, -0.25)} />
    <rect x="44" y="146" width="312" height="4" fill={shade(C.craie, -0.25)} />
    {/* L'avant-corps, son fronton, son cartouche d'or */}
    <rect x="150" y="80" width="100" height="124" fill={shade(C.craie, 0.55)} />
    <path d="M142 82L200 42L258 82Z" fill={shade(C.craie, 0.55)} />
    <path d="M160 78L200 50L240 78Z" fill={shade(C.craie, -0.15)} />
    <circle cx="200" cy="67" r="6" fill={METAL.or} />
    {/* Les fenêtres */}
    <path d={baies([62, 106, 272, 316], 100, 22, 40) + baies([62, 106, 272, 316], 158, 22, 46) + baies([162, 190, 218], 96, 20, 44) + baies([162, 218], 158, 20, 46) + baies([188], 154, 24, 50)} fill={C.nuit} />
    {/* Les topiaires en caisse */}
    <path d={rangee([102, 278], 190, 20, 16)} fill={shade(C.craie, 0.55)} />
    <path d="M99 176a13 13 0 1 0 26 0a13 13 0 1 0 -26 0ZM275 176a13 13 0 1 0 26 0a13 13 0 1 0 -26 0Z" fill={C.feuille} />
    <path d="M121.2 166.8A13 13 0 0 1 102.8 185.2A18 18 0 0 0 121.2 166.8ZM297.2 166.8A13 13 0 0 1 278.8 185.2A18 18 0 0 0 297.2 166.8Z" fill={shade(C.feuille, -0.25)} />
    {/* La grille : barreaux, pointes dorées, piliers, lanternes */}
    <path d="M36 184H92M308 184H364" fill="none" stroke={C.nuit} strokeWidth="40" strokeDasharray="2 7" />
    <path d="M37 162H92M309 162H364" fill="none" stroke={C.mimosa} strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 8.9" />
    <path d={rangee([6, 372], 146, 22, 60)} fill={shade(C.craie, -0.12)} />
    <path d={rangee([2, 368], 140, 30, 7)} fill={C.craie} />
    <path d="M9 140V120L17 110L25 120V140ZM375 140V120L383 110L391 120V140Z" fill={C.nuit} />
    <g className="amb-vacille">
      <rect x="12" y="122" width="10" height="15" fill={C.mimosa} />
      <rect x="378" y="122" width="10" height="15" fill={C.mimosa} />
    </g>
    <circle cx="17" cy="107" r="3" fill={METAL.or} />
    <circle cx="383" cy="107" r="3" fill={METAL.or} />
  </Svg>
);

/** La villa de la Corniche : blanche sur la falaise rouge, les pins parasols, la mer en contrebas. */
const villaCorniche: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer, vue de haut, et un voilier au large */}
    <rect x="0" y="128" width="400" height="80" fill={C.mer} />
    <path className="amb-scintille" d="M14 140H44V143H14ZM86 136H110V139H86ZM56 156H100V159H56ZM8 170H44V173H8ZM110 166H150V169H110ZM150 146H176V149H150Z" fill={shade(C.mer, 0.3)} />
    <path d="M42 126V100L60 126Z" fill={C.blanc} />
    <path d="M32 127H64L60 133H36Z" fill={C.nuit} />
    {/* La falaise rouge */}
    <path d="M400 206H170L178 184L200 170L206 142L234 112H400Z" fill={C.terracotta} />
    <path d="M400 206H222L244 178L234 154L262 132H400Z" fill={shade(C.terracotta, -0.18)} />
    {/* Les pins parasols */}
    <path d="M208 140L202 100M390 114L386 66" fill="none" stroke={shade(C.terracotta, -0.5)} strokeWidth="4" strokeLinecap="round" />
    <path d="M176 94a24 10 0 1 0 48 0a24 10 0 1 0 -48 0ZM366 60a18 9 0 1 0 36 0a18 9 0 1 0 -36 0Z" fill={C.feuille} />
    {/* La villa : aile basse, corps principal, belvédère */}
    <rect x="214" y="74" width="44" height="40" fill={C.blanc} />
    <rect x="256" y="48" width="116" height="66" fill={C.blanc} />
    <rect x="342" y="48" width="30" height="66" fill={shade(C.blanc, -0.1)} />
    <rect x="296" y="18" width="38" height="26" fill={C.blanc} />
    <path d="M289 20L315 2L341 20ZM250 41H378V50H250ZM209 67H263V75H209Z" fill={C.terracotta} />
    <path d={baies([270, 300, 330], 72, 22, 42) + baies([226], 86, 18, 28) + baies([308], 26, 14, 15) + rangee([274, 304, 334], 55, 14, 9)} fill={C.nuit} />
    <rect x="204" y="110" width="178" height="8" fill={C.blanc} />
    {/* L'esplanade et sa balustrade */}
    <rect x="0" y="204" width="400" height="56" fill={C.pierre} />
    <path d="M6 191H400" fill="none" stroke={C.blanc} strokeWidth="18" strokeDasharray="5 9" />
    <rect x="0" y="176" width="400" height="7" fill={C.blanc} />
    <rect x="0" y="198" width="400" height="8" fill={C.blanc} />
    <rect x="0" y="183" width="400" height="2.5" fill={shade(C.blanc, -0.2)} />
  </Svg>
);

/** Le château de Belle-Rive : tours en poivrière, grand toit d'ardoise, l'oriflamme au sommet. */
const chateau: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* Les douves et la pelouse */}
    <rect x="0" y="192" width="400" height="16" fill={C.mer} />
    <path d="M10 198H60V201H10ZM330 198H390V201H330Z" fill={shade(C.mer, 0.3)} />
    <rect x="0" y="206" width="400" height="54" fill={C.vert} />
    <rect x="0" y="206" width="400" height="6" fill={shade(C.vert, -0.2)} />
    {/* Le corps de logis : cheminées, toit, lucarnes, murs */}
    <path d={rangee([140, 248], 40, 12, 30)} fill={shade(C.craie, -0.22)} />
    <path d="M88 106L104 58H296L312 106Z" fill={C.ardoise} />
    <path d="M116 104V86L127 76L138 86V104ZM262 104V86L273 76L284 86V104Z" fill={C.craie} />
    <rect x="94" y="104" width="212" height="92" fill={C.craie} />
    {/* Le pavillon central, sa crête d'or, l'oriflamme */}
    <path d="M160 86L176 36H224L240 86Z" fill={C.ardoise} />
    <path d="M208 36H224L240 86H208Z" fill={shade(C.ardoise, -0.22)} />
    <rect x="166" y="84" width="68" height="112" fill={shade(C.craie, 0.55)} />
    <rect x="174" y="32" width="52" height="5" fill={METAL.or} />
    <rect x="199" y="6" width="2" height="28" fill={C.nuit} />
    <path className="amb-flotte" d="M201 7H226L219 13L226 19H201Z" fill={C.cerise} />
    {/* Les tours et leurs poivrières */}
    <path d={rangee([34, 306], 76, 60, 120)} fill={C.craie} />
    <path d={rangee([74, 346], 76, 20, 120)} fill={shade(C.craie, -0.12)} />
    <path d="M26 78L64 8L102 78ZM298 78L336 8L374 78Z" fill={C.ardoise} />
    <path d="M64 8L102 78H64ZM336 8L374 78H336Z" fill={shade(C.ardoise, -0.22)} />
    <circle cx="64" cy="8" r="3.5" fill={METAL.or} />
    <circle cx="336" cy="8" r="3.5" fill={METAL.or} />
    {/* Les fenêtres */}
    <path d={rangee([108, 138, 246, 276], 116, 16, 26) + rangee([108, 138, 246, 276], 156, 16, 32) + rangee([122, 268], 88, 10, 14) + rangee([58, 330], 96, 12, 22) + rangee([58, 330], 138, 12, 22) + baies([188], 96, 24, 40) + baies([186], 150, 28, 46)} fill={C.nuit} />
    {/* Les ifs taillés */}
    <path d="M8 206L20 166L32 206ZM368 206L380 166L392 206Z" fill={shade(C.vert, -0.45)} />
    <path d="M20 166L32 206H20ZM380 166L392 206H380Z" fill={shade(C.vert, -0.58)} />
  </Svg>
);

/** L'île privée : une colline, une villa blanche, des palmiers, et la mer tout autour. */
const ile: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et ses reflets */}
    <rect x="0" y="120" width="400" height="100" fill={C.mer} />
    <path className="amb-scintille" d="M8 132H34V135H8ZM352 130H388V133H352ZM10 176H56V179H10ZM330 174H384V177H330ZM64 190H112V193H64ZM282 190H332V193H282Z" fill={shade(C.mer, 0.3)} />
    {/* L'île : le lagon, le sable, la colline */}
    <ellipse cx="200" cy="153" rx="178" ry="13" fill={shade(C.mer, 0.38)} />
    <path d="M44 152Q200 136 356 152Q200 164 44 152Z" fill={C.sable} />
    <path d="M70 148Q120 84 204 80Q292 84 336 148Q200 138 70 148Z" fill={C.feuille} />
    <path d="M204 80Q292 84 336 148Q280 143 240 142Q252 108 204 80Z" fill={shade(C.feuille, -0.22)} />
    {/* La villa */}
    <rect x="170" y="68" width="64" height="30" fill={C.blanc} />
    <rect x="218" y="68" width="16" height="30" fill={shade(C.blanc, -0.1)} />
    <path d="M162 70L202 46L242 70Z" fill={C.terracotta} />
    <path d={baies([178, 196, 214], 78, 12, 20)} fill={C.nuit} />
    {/* Les palmiers */}
    <path d="M106 124Q104 96 96 74M298 122Q300 94 308 72M324 138Q328 116 338 100" fill="none" stroke={shade(C.terracotta, -0.4)} strokeWidth="5" strokeLinecap="round" />
    <path d={palmes(96, 74) + palmes(308, 72) + palmes(338, 100)} fill={C.persFonce} />
    {/* Le ponton et la barque */}
    <path d="M22 150H78V154H22ZM28 154H31V162H28ZM48 154H51V162H48ZM68 154H71V162H68Z" fill={shade(C.terracotta, -0.4)} />
    <path d="M2 144H26L22 152H6Z" fill={C.terracotta} />
    {/* La plage du premier plan et son écume */}
    <path d="M0 260V212Q100 198 200 206Q300 214 400 200V260Z" fill={C.sable} />
    <path d="M0 212Q100 198 200 206Q300 214 400 200V205Q300 219 200 211Q100 203 0 217Z" fill={C.blanc} />
  </Svg>
);

/** Le Kiosque de Gaspard, racheté à la fin : le même store rayé, mais un petit palais. */
const kiosque: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et le quai, comme au premier jour */}
    <rect x="0" y="150" width="400" height="58" fill={C.mer} />
    <path d="M0 164H26L36 160L46 164H70V169H0ZM330 164H354L364 160L374 164H400V169H330Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
    <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
    {/* Les mouettes */}
    <path d="M318 44Q326 34 334 44Q342 34 350 44Q342 40 334 48Q326 40 318 44ZM54 38Q60 30 66 38Q72 30 78 38Q72 35 66 41Q60 35 54 38Z" fill={C.blanc} />
    {/* Le tapis rouge */}
    <path d="M152 204L116 260H284L248 204Z" fill={C.cerise} />
    {/* Les deux tourelles, coiffées comme le store */}
    <path d={rangee([30, 324], 134, 46, 70)} fill={C.persienne} />
    <path d={rangee([62, 356], 134, 14, 70)} fill={shade(C.persienne, -0.25)} />
    <path d={baies([43, 337], 150, 20, 36)} fill={C.nuit} />
    <path d="M22 136L53 100L84 136ZM316 136L347 100L378 136Z" fill={C.blanc} />
    <path d="M22 136L53 100L36 136ZM53 100L48 136H58ZM53 100L84 136H70ZM316 136L347 100L330 136ZM347 100L342 136H352ZM347 100L378 136H364Z" fill={C.mimosa} />
    {/* Le kiosque, sa vitrine, ses tickets, son comptoir de laiton */}
    <rect x="120" y="110" width="160" height="94" fill={C.persienne} />
    <rect x="232" y="110" width="48" height="94" fill={shade(C.persienne, -0.25)} />
    <rect x="136" y="124" width="128" height="42" fill={C.nuit} />
    <path d="M146 130h20v30h-20ZM218 130h20v30h-20Z" fill={C.ivoire} />
    <path d="M170 130h20v30h-20ZM242 130h14v30h-14Z" fill={C.mimosa} />
    <rect x="194" y="130" width="20" height="30" fill={C.bougainvillier} />
    <rect x="128" y="166" width="144" height="9" fill={METAL.laiton} />
    <path d={rangee([120, 272], 112, 8, 92)} fill={METAL.laiton} />
    {/* Les guirlandes */}
    <path d="M104 78Q72 104 55 100M296 78Q328 104 345 100" fill="none" stroke={C.mimosa} strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 10.9" />
    {/* Le store rayé mimosa et blanc */}
    <path d="M104 74H296L320 112H80Z" fill={C.blanc} />
    <path d="M104 74H125.3L106.7 112H80ZM146.7 74H168L160 112H133.3ZM189.3 74H210.7L213.3 112H186.7ZM232 74H253.3L266.7 112H240ZM274.7 74H296L320 112H293.3Z" fill={C.mimosa} />
    <path d="M80 112H320V120Q310 127 300 120Q290 127 280 120Q270 127 260 120Q250 127 240 120Q230 127 220 120Q210 127 200 120Q190 127 180 120Q170 127 160 120Q150 127 140 120Q130 127 120 120Q110 127 100 120Q90 127 80 120Z" fill={shade(C.mimosa, -0.18)} />
    {/* Le toit, le dôme d'or, le fanion */}
    <path d="M128 74L200 44L272 74Z" fill={C.persFonce} />
    <path d="M180 58Q180 36 200 32Q220 36 220 58Z" fill={METAL.or} />
    <rect x="176" y="56" width="48" height="5" rx="2.5" fill={METAL.laiton} />
    <rect x="199" y="6" width="2" height="24" fill={C.nuit} />
    <path className="amb-flotte" d="M201 6L226 13L201 20Z" fill={C.cerise} />
    <circle cx="200" cy="30" r="4" fill={METAL.or} />
    <circle cx="53" cy="98" r="4" fill={METAL.or} />
    <circle cx="347" cy="98" r="4" fill={METAL.or} />
  </Svg>
);

/**
 * Identifiants attendus : banc (décor de départ), chambre-de-bonne, studio,
 * appartement, maison-pecheur, loft, villa-mimosas, hotel-particulier,
 * villa-corniche, chateau, ile, et kiosque (le Kiosque de Gaspard, racheté à la fin).
 */
export const RESIDENCES: Record<string, Art> = {
  banc,
  "chambre-de-bonne": chambreDeBonne,
  studio,
  appartement,
  "maison-pecheur": maisonPecheur,
  loft,
  "villa-mimosas": villaMimosas,
  "hotel-particulier": hotelParticulier,
  "villa-corniche": villaCorniche,
  chateau,
  ile,
  kiosque,
};
