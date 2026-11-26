// Agence Colette, suite : 8 résidences, du carton sous le ponton à la base lunaire.
//
// Même contrat que residences.tsx (à lire d'abord) : même viewBox, même ligne de sol,
// une classe d'ambiance `amb-*` par résidence. La résidence est le décor du Domaine,
// derrière l'avatar.
//
// Identifiants attendus (shared/catalog.ts) :
//   carton, tente, cabine, palais, tour, archipel, station-orbitale, base-lunaire.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Arrondit une coordonnée calculée, pour garder des tracés courts. */
const n = (v: number) => +v.toFixed(1);

/** Une rangée de rectangles identiques (fenêtres, pieux, poteaux), d'un seul tracé. */
const rangee = (xs: number[], y: number, w: number, h: number) => xs.map((x) => `M${x} ${y}h${w}v${h}h${-w}Z`).join("");

/** Une rangée de baies cintrées (fenêtres ou portes à sommet arrondi), d'un seul tracé. */
const baies = (xs: number[], y: number, w: number, h: number) =>
  xs.map((x) => `M${x} ${y + h}V${y + w / 2}Q${x} ${y} ${x + w / 2} ${y}Q${x + w} ${y} ${x + w} ${y + w / 2}V${y + h}Z`).join("");

/** Une rangée d'ogives vénitiennes : l'arc s'infléchit et finit en pointe de flamme. */
const ogives = (xs: number[], y: number, w: number, h: number) =>
  xs
    .map(
      (x) =>
        `M${x} ${y + h}V${n(y + 0.8 * w)}C${x} ${n(y + 0.45 * w)} ${n(x + 0.38 * w)} ${n(y + 0.38 * w)} ${n(x + w / 2)} ${y}` +
        `C${n(x + 0.62 * w)} ${n(y + 0.38 * w)} ${x + w} ${n(y + 0.45 * w)} ${x + w} ${n(y + 0.8 * w)}V${y + h}Z`,
    )
    .join("");

/** Des ovales en un seul tracé : [cx, cy, rx, ry]. Galets, hublots, cratères, lagons. */
const ovales = (points: [number, number, number, number][]) =>
  points.map(([cx, cy, rx, ry]) => `M${n(cx - rx)} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`).join("");

/** Des étoiles à quatre branches en un seul tracé : [x, y, rayon]. */
const etoiles = (points: [number, number, number][]) =>
  points
    .map(([x, y, r]) => {
      const q = +(r * 0.26).toFixed(2);
      return `M${x} ${y - r}L${x + q} ${y - q}L${x + r} ${y}L${x + q} ${y + q}L${x} ${y + r}L${x - q} ${y + q}L${x - r} ${y}L${x - q} ${y - q}Z`;
    })
    .join("");

/** Une étoile à cinq branches, pointe en haut. */
const etoile5 = (cx: number, cy: number, r: number) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const k = i % 2 ? r * 0.42 : r;
    d += `${i ? "L" : "M"}${n(cx + k * Math.cos(a))} ${n(cy + k * Math.sin(a))}`;
  }
  return `${d}Z`;
};

/** Les cinq palmes d'un palmier, en couronne autour du sommet du tronc. `k` réduit la couronne. */
const palmes = (x: number, y: number, k = 1) =>
  ["q-20 -14 -38 6q22 -6 38 -6", "q-12 -26 -34 -20q20 2 34 20", "q-6 -22 6 -34q0 18 -6 34", "q12 -26 34 -20q-20 2 -34 20", "q20 -14 38 6q-22 -6 -38 -6"]
    .map((palme) => `M${x} ${y}${palme.replace(/-?\d+/g, (v) => `${n(+v * k)}`)}Z`)
    .join("");

/** Les rayures d'une façade à pignon (planches d'une cabine, toile d'une tente) : des bandes verticales coupées par les deux pentes. */
const planches = (xs: number[], w: number, cx: number, sommet: number, pente: number, sol: number) =>
  xs
    .map((x) => {
      const y = (v: number) => n(sommet + pente * Math.abs(v - cx));
      const pointe = x < cx && x + w > cx ? `L${cx} ${sommet}` : "";
      return `M${n(x)} ${sol}V${y(x)}${pointe}L${n(x + w)} ${y(x + w)}V${sol}Z`;
    })
    .join("");

/** Les rayures en biais d'un pieu d'amarrage, de y0 jusqu'à y1. */
const torsade = (x: number, y0: number, y1: number, w: number) => {
  let d = "";
  for (let y = y0 + 8; y < y1; y += 14) d += `M${x} ${y}L${x + w} ${y - 5}V${y + 2}L${x} ${y + 7}Z`;
  return d;
};

/** Des traits verticaux en un seul tracé, centrés sur `xs` : travées d'une tour, nervures. */
const montants = (xs: number[], y0: number, y1: number) => xs.map((x) => `M${x} ${y0}V${y1}`).join("");

/** Les travées d'une tour, de part et d'autre de son axe (x = 200) : une tous les 6, du rang `de` au rang `a`. */
const travees = (de: number, a: number) => {
  const xs: number[] = [];
  for (let k = -a; k <= a; k++) if (Math.abs(k) >= de) xs.push(200 + 6 * k);
  return xs;
};

/** Les fenêtres allumées d'un gradin de la tour : une sur trois par travée, décalées en chevrons. */
const lumieres = (de: number, a: number, y: number, rangs: number) => {
  let d = "";
  for (let k = -a; k <= a; k++) {
    if (Math.abs(k) < de) continue;
    for (let r = 0; r < rangs; r++) if ((r + Math.abs(k)) % 3 === 0) d += `M${n(198.4 + 6 * k)} ${y + 4.5 * r}h3.2v3h-3.2Z`;
  }
  return d;
};

/** Les fenêtres allumées d'un immeuble voisin : par colonne [x, y du haut], une tous les 12 jusqu'à `sol`. */
const veilleuses = (colonnes: [number, number][], sol: number) => {
  let d = "";
  for (const [x, y0] of colonnes) for (let y = y0; y + 3.5 <= sol; y += 12) d += `M${n(x - 1.6)} ${y}h3.2v3.5h-3.2Z`;
  return d;
};

/** Les cellules d'un panneau solaire de 52 × 48 : trois rangs de trois. */
const cellules = (x: number, y: number) => {
  let d = "";
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) d += `M${x + 2.5 + 16.5 * i} ${y + 2.25 + 15.25 * j}h14v13h-14Z`;
  return d;
};

/** Le carton sous le ponton : un carton retourné (ses flèches « haut » pointent vers le bas), un toit calé par deux galets. */
const carton: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et le sable */}
    <rect x="0" y="150" width="400" height="58" fill={C.mer} />
    <path d="M0 164H24L34 160L44 164H66V169H0ZM318 168H342L352 164L362 168H400V173H318ZM76 176H100V179H76ZM300 176H324V179H300Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="200" width="400" height="60" fill={C.sable} />
    <rect x="0" y="200" width="400" height="7" fill={shade(C.sable, -0.15)} />
    {/* Le dessous du ponton : solives, entretoise, pieux du fond */}
    <path d="M0 60H400V67H0ZM0 86H400V92H0ZM84 67H92V177H84ZM308 67H316V177H308Z" fill={shade(C.bois, -0.32)} />
    {/* Les pieux du premier plan et leurs jambes de force */}
    <path d="M36 108L6 66M36 108L66 66M364 108L334 66M364 108L394 66" fill="none" stroke={C.bois} strokeWidth="7" strokeLinecap="round" />
    <path d={rangee([28, 356], 60, 16, 160)} fill={C.bois} />
    <path d={rangee([39, 367], 60, 5, 160)} fill={shade(C.bois, -0.22)} />
    {/* Le tablier, ses planches, son garde-corps */}
    <rect x="0" y="42" width="400" height="18" fill={C.bois} />
    <rect x="0" y="42" width="400" height="4" fill={shade(C.bois, 0.3)} />
    <path d="M12 53H400" fill="none" stroke={shade(C.bois, -0.32)} strokeWidth="14" strokeDasharray="1.5 23.5" />
    <path d={"M0 20H400V24H0Z" + rangee([22, 72, 122, 172, 222, 272, 322, 372], 24, 4, 18)} fill={C.bois} />
    {/* Une mouette, qui surveille le quartier */}
    <path d="M293 14Q295 7 305 7Q313 7 319 12L326 10L321 16.5Q314 20 304 20Q295 19.5 293 14ZM289.5 9a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0Z" fill={C.blanc} />
    <path d="M302 10.5Q311 9.5 320 14.5Q311 17.5 303 15.5Z" fill={C.grisClair} />
    <path d="M290 8L283.5 10.5L290.3 11.5Z" fill={C.mimosa} />
    <circle cx="293" cy="8" r="0.9" fill={C.nuit} />
    {/* La lanterne, pendue à un pieu */}
    <path d="M44 114H60V117H44ZM55 117H57V123H55ZM48 130L56 122L64 130V152H48Z" fill={C.nuit} />
    <rect className="amb-vacille" x="51" y="132" width="10" height="16" fill={C.mimosa} />
    {/* Le carton, son côté à l'ombre, le ruban adhésif */}
    <ellipse cx="204" cy="213" rx="102" ry="4" fill={C.nuit} fillOpacity="0.18" />
    <rect x="108" y="118" width="184" height="94" fill={C.kraft} />
    <rect x="252" y="118" width="40" height="94" fill={shade(C.kraft, -0.14)} />
    <path d="M108 134H252V144H108ZM292 134L301 136.5L299 145.5L292 144Z" fill={shade(C.kraft, 0.5)} />
    <rect x="252" y="134" width="40" height="10" fill={shade(C.kraft, 0.26)} />
    {/* Imprimés à l'envers : « haut » et « fragile » */}
    <path
      d="M114 150H138V153H114ZM118.5 156H121.5V170H118.5ZM114.5 170H125.5L120 179ZM130.5 156H133.5V170H130.5ZM126.5 170H137.5L132 179ZM144.5 150H155.5V152.5H144.5ZM148.8 152.5H151.2V165H148.8ZM143 179Q143 164 150 164Q157 164 157 179Z"
      fill={shade(C.kraft, -0.45)}
    />
    {/* Le toit : un carton à plat, de travers, et ses deux galets */}
    <path d="M108 127.6L292 120.4V125.4L108 132.6Z" fill={shade(C.kraft, -0.3)} />
    <path d="M98 118L302 110L303 120L99 128Z" fill={shade(C.kraft, 0.22)} />
    <path d={ovales([[124, 113.5, 9, 5], [276, 107.5, 7, 4.5]])} fill={C.gris} />
    {/* La porte découpée : au fond, l'oreiller et le lit */}
    <path d="M168 212V162Q168 144 200 144Q232 144 232 162V212Z" fill={shade(C.kraft, -0.62)} />
    <path d="M174 212V203Q174 196 181 196H195Q202 196 202 203V212Z" fill={C.creme} />
    <path d="M198 212V205Q214 197 232 201V212Z" fill={C.cerise} />
    {/* La fenêtre, et la couverture qui prend l'air */}
    <path d="M258 152L282 150L283 172L259 174Z" fill={shade(C.kraft, -0.62)} />
    <path d="M255 164L287 162V201Q283 205.5 279 201Q275 205.5 271 201Q267 205.5 263 201Q259 205.5 255 201Z" fill={C.cerise} />
    <path d="M255 174H287V178.5H255ZM255 186H287V190.5H255Z" fill={C.creme} />
    {/* Une rustine de ruban adhésif */}
    <path d="M116 190L131 204M131 190L116 204" fill="none" stroke={shade(C.kraft, 0.5)} strokeWidth="5" />
    {/* Une pâquerette dans une boîte de conserve */}
    <path d="M146 203V192" fill="none" stroke={C.feuille} strokeWidth="2" />
    <rect x="140" y="203" width="12" height="13" fill={C.grisClair} />
    <rect x="140" y="207" width="12" height="5" fill={C.cerise} />
    <circle cx="146" cy="188" r="5" fill={C.blanc} />
    <circle cx="146" cy="188" r="2.2" fill={C.mimosa} />
  </Svg>
);

/** La tente de plage : une canadienne de toile rayée, rapiécée, ses haubans, la serviette qui sèche et le fanion. */
const tente: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et la plage */}
    <rect x="0" y="150" width="400" height="58" fill={C.mer} />
    <path d="M0 162H30L40 158L50 162H84V167H0ZM326 166H350L360 162L370 166H400V171H326ZM16 182H58V186H16ZM338 184H384V188H338Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="200" width="400" height="60" fill={C.sable} />
    <rect x="0" y="200" width="400" height="7" fill={shade(C.sable, -0.15)} />
    {/* Les haubans et leurs piquets */}
    <ellipse cx="200" cy="214" rx="128" ry="4.5" fill={C.nuit} fillOpacity="0.16" />
    <path d="M200 64L28 216M200 64L372 216" fill="none" stroke={shade(C.sable, -0.6)} strokeWidth="1.8" />
    <path d="M22 208L32 221M378 208L368 221" fill="none" stroke={C.boisFonce} strokeWidth="4" strokeLinecap="round" />
    {/* La toile : écrue, rayée de mimosa, le côté droit à l'ombre */}
    <path d="M200 60L322 212H78Z" fill={C.craie} />
    <path d="M200 60L322 212H200Z" fill={shade(C.craie, -0.1)} />
    <path d={planches([78, 122.36, 166.73], 22.18, 200, 60, 1.2459, 212)} fill={C.mimosa} />
    <path d={planches([211.09, 255.45, 299.82], 22.18, 200, 60, 1.2459, 212)} fill={shade(C.mimosa, -0.13)} />
    {/* L'entrée : les deux pans relevés, le mât */}
    <path d="M200 100L234 212H166Z" fill={C.boisFonce} />
    <path d="M200 100L166 212H177Q186 164 200 100ZM200 100L234 212H223Q214 164 200 100Z" fill={shade(C.craie, 0.5)} />
    <rect x="198.5" y="26" width="3" height="186" fill={C.bois} />
    {/* Les rapiéçages : deux pièces cousues, une déchirure reprisée */}
    <path d="M127.2 170.5L148.7 165.9L152.8 185.5L131.3 190.1Z" fill={C.cerise} />
    <path d="M249.5 155.1L266.9 159.5L262.6 176.9L245.1 172.6Z" fill={C.azur} />
    <path d="M130.7 172.8L146.4 169.5L149.3 183.2L133.6 186.5ZM251.6 158.7L263.3 161.6L260.4 173.3L248.7 170.4Z" fill="none" stroke={C.nuit} strokeWidth="1.3" strokeDasharray="2.6 2.4" />
    <path d="M266 199l4.5 -7l4.5 7l4.5 -7l4.5 7" fill="none" stroke={C.nuit} strokeWidth="1.5" strokeLinejoin="round" />
    {/* La serviette qui sèche sur le hauban */}
    <path d="M306 157.7L332 180.7V200.7L306 177.7Z" fill={C.azur} />
    <path d="M306 163.7L332 186.7V190.7L306 167.7ZM306 171.7L332 194.7V197.7L306 174.7Z" fill={C.blanc} />
    {/* Le seau et la pelle */}
    <path d="M56 203H78L75 220H59Z" fill={C.cerise} />
    <path d="M54.5 201H79.5V205H54.5Z" fill={shade(C.cerise, -0.25)} />
    <path d="M90 196V208M86.5 208H93.5V219Q90 222 86.5 219Z" fill={C.azur} stroke={C.azur} strokeWidth="2.4" strokeLinecap="round" />
    {/* Le fanion, en haut du mât */}
    <path className="amb-flotte" d="M201.5 27L226 34L201.5 41Z" fill={C.cerise} />
  </Svg>
);

/** La cabine de plage : planches rayées, toit pointu, hublot, fanion, et ses voisines de rangée. */
const cabine: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer et la plage */}
    <rect x="0" y="150" width="400" height="58" fill={C.mer} />
    <path d="M0 164H20L30 160L40 164H60V169H0ZM336 168H358L368 164L378 168H400V173H336ZM96 178H120V182H96ZM282 180H304V184H282Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="200" width="400" height="60" fill={C.sable} />
    <rect x="0" y="200" width="400" height="7" fill={shade(C.sable, -0.15)} />
    {/* Les cabines voisines, plus loin dans la rangée */}
    <path d="M22 204V134.9L57 108L92 134.9V204ZM308 204V134.9L343 108L378 134.9V204Z" fill={C.blanc} />
    <path d={planches([22, 42, 62, 82], 10, 57, 108, 0.769, 204)} fill={C.paille} />
    <path d={planches([308, 328, 348, 368], 10, 343, 108, 0.769, 204)} fill={C.rose} />
    <path d={rangee([49, 335], 168, 16, 36)} fill={C.ardoise} />
    <path d="M57 97L99 129.3V140.3L57 108L15 140.3V129.3ZM343 97L385 129.3V140.3L343 108L301 140.3V129.3Z" fill={C.ardoise} />
    {/* Le plancher et la marche */}
    <path d="M112 208H288V215H112ZM172 215H228V221H172Z" fill={C.bois} />
    <path d="M112 212H288V215H112ZM172 218.5H228V221H172Z" fill={shade(C.bois, -0.22)} />
    {/* La cabine : planches blanches et vertes, le côté droit à l'ombre */}
    <path d="M122 208V106L200 46L278 106V208Z" fill={C.blanc} />
    <path d={planches([122, 146, 170, 194, 218], 12, 200, 46, 0.769, 208)} fill={C.persClair} />
    <path d="M242 208V78.3L278 106V208Z" fill={shade(C.blanc, -0.1)} />
    <path d={planches([242, 266], 12, 200, 46, 0.769, 208)} fill={shade(C.persClair, -0.2)} />
    {/* Le toit pointu */}
    <path d="M200 30L292 100.7V116.7L200 46L108 116.7V100.7Z" fill={C.corail} />
    <path d="M200 30L292 100.7V116.7L200 46Z" fill={shade(C.corail, -0.22)} />
    {/* Le hublot du pignon, la porte et son losange */}
    <circle cx="200" cy="86" r="10.5" fill={C.corail} />
    <circle cx="200" cy="86" r="6.5" fill={C.nuit} />
    <rect x="176" y="136" width="48" height="72" fill={C.blanc} />
    <rect x="180" y="140" width="40" height="68" fill={C.corail} />
    <path d="M193.3 140V208M206.7 140V208" fill="none" stroke={shade(C.corail, -0.22)} strokeWidth="1.6" />
    <path d="M200 152L207 162L200 172L193 162Z" fill={C.nuit} />
    <circle cx="214.5" cy="182" r="2.2" fill={C.mimosa} />
    {/* Le fanion */}
    <rect x="199" y="6" width="2" height="26" fill={C.nuit} />
    <path className="amb-flotte" d="M201 7L224 13L201 19Z" fill={C.mimosa} />
  </Svg>
);

/** Les créneaux du palais : une rangée de petits merlons arrondis, tous les 12. */
const MERLONS = Array.from({ length: 24 }, (_, i) => 58 + 12 * i)
  .map((x) => `M${x} 39V32Q${x} 28 ${x + 4} 26Q${x + 8} 28 ${x + 8} 32V39Z`)
  .join("");

/** Le palais sur la lagune : gothique vénitien, loggia, pieux d'amarrage rayés, reflets dans l'eau. */
const palais: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La lagune et les reflets du palais */}
    <rect x="0" y="172" width="400" height="88" fill={C.lagune} />
    <path d="M8 188H40V191H8ZM354 194H394V197H354ZM18 204H50V207H18ZM346 180H374V183H346Z" fill={shade(C.lagune, 0.22)} />
    <g className="amb-scintille">
      <path d="M60 176H340V179.5H60ZM84 184H190V187H84ZM214 184H318V187H214ZM112 192H170V195H112ZM232 192H292V195H232ZM140 200H206V203H140ZM226 200H262V203H226ZM168 208H236V211H168Z" fill={C.rose} fillOpacity="0.7" />
      <path d="M196 184H208V187H196ZM178 192H222V195H178ZM212 200H220V203H212Z" fill={C.blanc} fillOpacity="0.55" />
    </g>
    {/* Les cheminées évasées */}
    <path d="M93 40V18L88 4H106L101 18V40ZM299 40V18L294 4H312L307 18V40Z" fill={shade(C.rose, -0.3)} />
    {/* La façade rose, son côté à l'ombre */}
    <rect x="56" y="40" width="288" height="132" fill={C.rose} />
    <rect x="298" y="40" width="46" height="132" fill={shade(C.rose, -0.12)} />
    {/* La pierre blanche : créneaux, corniche, bandeaux, loggia, encadrements, balcons */}
    <path
      d={
        MERLONS +
        "M52 38H348V45H52ZM56 82H344V86H56ZM56 136H344V140H56ZM56 167H344V172H56ZM128 88H272V134H128ZM72 130H112V134H72ZM288 130H328V134H288Z" +
        ogives([78, 294], 89, 28, 45)
      }
      fill={C.blanc}
    />
    {/* Les baies : étage, loggia et ses quadrilobes, portique sur l'eau */}
    <path
      d={
        ogives([135, 155, 175, 215, 235, 255], 54, 10, 22) +
        ogives([84, 300], 52, 16, 26) +
        ogives([133, 153, 173, 193, 213, 233, 253], 102, 14, 28) +
        ovales([150, 170, 190, 210, 230, 250].map((x): [number, number, number, number] => [x, 96, 3.4, 3.4])) +
        ogives([82, 298], 95, 20, 37) +
        ogives([141, 185, 229], 142, 30, 30) +
        ogives([85, 301], 146, 14, 20)
      }
      fill={C.prune}
    />
    {/* Les balustrades, le médaillon d'or */}
    <path d="M130 127H270M74 126H110M290 126H326" fill="none" stroke={C.blanc} strokeWidth="6.5" strokeDasharray="2 3" />
    <rect x="52" y="45" width="296" height="2.5" fill={METAL.or} />
    <circle cx="200" cy="65" r="7.5" fill={METAL.or} />
    {/* Les pieux d'amarrage, rayés, coiffés d'or */}
    <path d="M68 122H76V226H68ZM98 136H106V226H98ZM294 136H302V226H294ZM324 122H332V226H324Z" fill={C.blanc} />
    <path d={torsade(68, 122, 222, 8) + torsade(98, 136, 222, 8) + torsade(294, 136, 222, 8) + torsade(324, 122, 222, 8)} fill={C.cerise} />
    <path d={rangee([66, 322], 119, 12, 4) + rangee([96, 292], 133, 12, 4)} fill={C.mimosaFonce} />
    <circle cx="72" cy="114" r="4.8" fill={METAL.or} />
    <circle cx="102" cy="128" r="4.8" fill={METAL.or} />
    <circle cx="298" cy="128" r="4.8" fill={METAL.or} />
    <circle cx="328" cy="114" r="4.8" fill={METAL.or} />
    {/* Le quai du premier plan */}
    <rect x="0" y="218" width="400" height="42" fill={C.pierre} />
    <rect x="0" y="218" width="400" height="7" fill={shade(C.pierre, -0.18)} />
  </Svg>
);

/** La tour à ton nom : gradins Art déco, travées éclairées en chevrons, flèche d'or, et l'enseigne géante. */
const tour: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* Le trottoir */}
    <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
    <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
    {/* Les immeubles voisins et leurs fenêtres allumées */}
    <path d="M-4 204V170H20V204ZM24 204V150H32V140H64V150H72V204ZM328 204V158H336V148H368V158H376V204ZM380 204V174H404V204Z" fill={shade(C.ardoise, -0.25)} />
    <path d="M76 204V126H84V114H120V126H128V204ZM272 204V134H280V122H316V134H324V204Z" fill={C.ardoise} />
    <path
      d={
        veilleuses([[6, 176], [13, 182], [31, 156], [38, 146], [45, 158], [52, 143], [59, 152], [66, 161]], 199) +
        veilleuses([[81, 133], [88, 119], [95, 128], [102, 117], [109, 125], [116, 121], [123, 136]], 199) +
        veilleuses([[277, 141], [284, 127], [291, 136], [298, 125], [305, 133], [312, 129], [319, 144]], 199) +
        veilleuses([[333, 166], [340, 152], [347, 161], [354, 155], [361, 164], [371, 163], [386, 180], [393, 186]], 199)
      }
      fill={C.mimosa}
    />
    {/* La tour : un socle et quatre gradins, leur côté à l'ombre */}
    <path d="M132 204V188H144V158H154V122H164V90H172V66H228V90H236V122H246V158H256V188H268V204Z" fill={C.brume} />
    <path d="M221 66H228V90H221ZM229 90H236V122H229ZM239 122H246V158H239ZM249 158H256V188H249ZM261 188H268V204H261Z" fill={shade(C.brume, -0.2)} />
    {/* Les travées sombres, les fenêtres allumées en chevrons */}
    <path
      d={montants(travees(0, 3), 71, 86) + montants(travees(0, 5), 96, 119) + montants(travees(0, 6), 128, 155) + montants(travees(3, 8), 164, 183) + montants(travees(4, 10), 192, 201.5)}
      fill="none"
      stroke={C.nuit}
      strokeWidth="3.2"
    />
    <path d={lumieres(0, 3, 72, 3) + lumieres(0, 5, 97, 5) + lumieres(0, 6, 129, 6) + lumieres(3, 8, 165, 4) + lumieres(4, 10, 193, 2)} fill={C.mimosa} />
    {/* Les couronnements d'or, leurs pointes, le grand porche */}
    <path
      d={
        "M172 66H228V68.6H172ZM164 90H236V92.6H164ZM154 122H246V124.6H154ZM144 158H256V160.6H144ZM132 188H268V190.6H132Z" +
        "M132 188L134.5 178L137 188ZM263 188L265.5 178L268 188ZM144 158L146.5 148L149 158ZM251 158L253.5 148L256 158Z" +
        "M154 122L156.5 112L159 122ZM241 122L243.5 112L246 122ZM164 90L166.5 80L169 90ZM231 90L233.5 80L236 90Z" +
        "M172 66L174.5 57L177 66ZM223 66L225.5 57L228 66ZM184 204V180A16 16 0 0 1 216 180V204Z"
      }
      fill={METAL.or}
    />
    <path d="M189 204V182A11 11 0 0 1 211 182V204Z" fill={C.nuit} />
    <path d="M200 182V171M200 182L192.2 174.2M200 182L207.8 174.2" fill="none" stroke={METAL.or} strokeWidth="1.4" />
    {/* La flèche, puis l'enseigne sur son échafaudage : pas de lettres, une étoile */}
    <path d="M196.5 28L200 2L203.5 28Z" fill={METAL.or} />
    <path d="M180 66V58M190 66V58M210 66V58M220 66V58M180 66L190 58M220 66L210 58" fill="none" stroke={C.ardoise} strokeWidth="2.2" />
    <rect x="146" y="24" width="108" height="34" rx="7" fill={C.cerise} />
    <rect x="154" y="31" width="92" height="20" rx="3" fill={shade(C.cerise, -0.4)} />
    <path
      className="amb-vacille"
      d="M156 27.5H244Q250.5 27.5 250.5 34V48Q250.5 54.5 244 54.5H156Q149.5 54.5 149.5 48V34Q149.5 27.5 156 27.5Z"
      fill="none"
      stroke={C.mimosa}
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeDasharray="0.02 1.98"
      pathLength="68"
    />
    <path d={etoile5(200, 41.6, 9.5)} fill={METAL.or} />
    <path d={etoiles([[174, 41, 5], [226, 41, 5]])} fill={C.ivoire} />
  </Svg>
);

/** L'archipel privé : trois îlots à palmiers reliés par des passerelles, la villa sur le plus grand, l'hydravion à l'ancre. */
const archipel: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* La mer, ses reflets, deux îlots au large */}
    <rect x="0" y="118" width="400" height="102" fill={C.mer} />
    <path d="M92 118Q106 107 122 118ZM282 118Q296 109 312 118Z" fill={shade(C.feuille, -0.3)} />
    <path className="amb-scintille" d="M148 126H182V129H148ZM226 130H262V133H226ZM96 180H140V183H96ZM178 176H232V179H178ZM20 190H66V193H20ZM120 196H172V199H120ZM212 192H256V195H212Z" fill={shade(C.mer, 0.3)} />
    {/* Les lagons et le sable des trois îlots */}
    <path d={ovales([[41, 166, 50, 9], [200, 158, 92, 12], [359, 162, 50, 9]])} fill={shade(C.mer, 0.38)} />
    <path d="M2 165Q41 155 80 165Q41 173 2 165ZM124 157Q200 145 276 157Q200 167 124 157ZM320 161Q359 151 398 161Q359 169 320 161Z" fill={C.sable} />
    {/* La villa blanche, plantée dans la colline */}
    <rect x="160" y="78" width="80" height="44" fill={C.blanc} />
    <rect x="222" y="78" width="18" height="44" fill={shade(C.blanc, -0.1)} />
    <rect x="180" y="54" width="40" height="18" fill={C.blanc} />
    <path d="M174 56L183 46H217L226 56ZM154 80L163 70H237L246 80Z" fill={C.terracotta} />
    <path d={baies([165, 180, 195, 210, 225], 85, 10, 16) + baies([186, 204], 59, 10, 11)} fill={C.nuit} />
    {/* Les collines */}
    <path d="M12 163Q22 140 42 138Q62 140 72 163Q41 158 12 163ZM136 154Q150 110 200 106Q250 110 264 154Q200 146 136 154ZM330 159Q340 134 360 132Q380 134 390 159Q359 154 330 159Z" fill={C.feuille} />
    <path d="M42 138Q62 140 72 163Q62 161 52 160Q58 148 42 138ZM200 106Q250 110 264 154Q244 151 226 149Q238 124 200 106ZM360 132Q380 134 390 159Q380 157 370 156Q376 144 360 132Z" fill={shade(C.feuille, -0.22)} />
    {/* Les passerelles */}
    <path d="M76 165Q101 147 128 159M272 159Q298 143 324 162" fill="none" stroke={shade(C.terracotta, -0.4)} strokeWidth="3.2" strokeLinecap="round" />
    <path d="M76 162Q101 144 128 156M272 156Q298 140 324 159" fill="none" stroke={shade(C.terracotta, -0.4)} strokeWidth="7" strokeDasharray="1.4 5.2" />
    <path d="M76 158.5Q101 140.5 128 152.5M272 152.5Q298 136.5 324 155.5" fill="none" stroke={shade(C.terracotta, -0.4)} strokeWidth="1.4" />
    {/* Les palmiers */}
    <path d="M146 134Q142 118 134 106M254 134Q258 118 266 104M36 152Q34 132 28 114M56 152Q58 134 66 120M350 148Q348 126 342 106M370 150Q372 132 380 118" fill="none" stroke={shade(C.terracotta, -0.4)} strokeWidth="4.5" strokeLinecap="round" />
    <path d={palmes(134, 106) + palmes(266, 104) + palmes(28, 114, 0.85) + palmes(66, 120, 0.7) + palmes(342, 106, 0.85) + palmes(380, 118, 0.7)} fill={C.persFonce} />
    {/* L'hydravion à l'ancre */}
    <path d="M288 194H352L346 200H292Z" fill={C.blanc} />
    <path d="M306 187L302 194M332 187L336 194" fill="none" stroke={C.gris} strokeWidth="2" />
    <path d="M282 176L302 172H336Q350 172 356 180Q350 187 336 187H312L282 180Z" fill={C.blanc} />
    <path d="M282 180V164H290L298 174ZM300 180.5H353Q351.5 183 348 184.5H304Z" fill={C.cerise} />
    <path d="M330 174H342Q347 174 350 178H330Z" fill={C.nuit} />
    <rect x="304" y="166.5" width="48" height="5.5" rx="2.7" fill={C.cerise} />
    <rect x="356" y="170" width="2.6" height="20" rx="1.3" fill={C.nuit} />
    {/* La plage du premier plan et son écume */}
    <path d="M0 260V206Q100 218 200 210Q300 202 400 214V260Z" fill={C.sable} />
    <path d="M0 206Q100 218 200 210Q300 202 400 214V219Q300 207 200 215Q100 223 0 211Z" fill={C.blanc} />
  </Svg>
);

/** La station orbitale : une grande roue d'argent, ses panneaux solaires, son bras d'amarrage, et la Terre en guise de sol. */
const stationOrbitale: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* Les étoiles */}
    <path className="amb-scintille" d={etoiles([[42, 28, 5], [116, 14, 3], [350, 22, 4], [300, 136, 3], [28, 150, 3.5], [96, 132, 3], [376, 122, 3.5], [330, 10, 2.5]])} fill={C.mimosa} />
    {/* L'arrière de la roue, ses rayons, les bras des panneaux */}
    <path d="M88 72A112 44 0 0 1 312 72H294A94 28 0 0 0 106 72Z" fill={C.gris} />
    <path d="M62 69.5H338V74.5H62Z" fill={shade(C.gris, -0.25)} />
    <path d="M200 66L136 48M200 66L264 48M200 80L132 98M200 80L268 98" fill="none" stroke={shade(C.gris, -0.25)} strokeWidth="3.6" />
    {/* Les panneaux solaires : cadre d'or, cellules bleues */}
    <rect x="12" y="48" width="52" height="48" fill={METAL.or} />
    <rect x="336" y="48" width="52" height="48" fill={METAL.or} />
    <path d={cellules(12, 48) + cellules(336, 48)} fill={C.azur} />
    <path d="M14.5 50.2h14v13h-14ZM47.5 80.8h14v13h-14ZM338.5 50.2h14v13h-14ZM371.5 80.8h14v13h-14Z" fill={shade(C.azur, 0.35)} />
    {/* Le bras d'amarrage et la capsule qui arrive */}
    <path d="M200 32V18L228 8L250 18" fill="none" stroke={C.grisClair} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d={ovales([[200, 18, 3.4, 3.4], [228, 8, 3.4, 3.4]])} fill={C.gris} />
    <path d="M250 18L256 13.5M250 18L256 22.5" fill="none" stroke={C.grisClair} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M260 14.5L270 8H282Q287 8 287 13V23Q287 28 282 28H270L260 21.5Z" fill={C.blanc} />
    <path d="M275 8H281V28H275ZM287 13.5L292 11V25L287 22.5Z" fill={C.cerise} />
    <circle cx="268" cy="18" r="2.6" fill={C.nuit} />
    {/* Le moyeu */}
    <path d="M187 39Q187 30 196 30H204Q213 30 213 39V97Q213 106 204 106H196Q187 106 187 97Z" fill={C.ecume} />
    <path d="M202 30H204Q213 30 213 39V97Q213 106 204 106H202Z" fill={shade(C.ecume, -0.18)} />
    <path d="M187 42H213V45.5H187ZM187 56H213V59.5H187Z" fill={C.gris} />
    {/* L'avant de la roue, son épaisseur, ses hublots éclairés */}
    <path d="M88 77A112 44 0 0 0 312 77H294A94 28 0 0 1 106 77Z" fill={shade(C.gris, -0.3)} />
    <path d="M88 72A112 44 0 0 0 312 72H294A94 28 0 0 1 106 72Z" fill={METAL.argent} />
    <path d="M99 78A103 36 0 0 0 301 78" fill="none" stroke={C.mimosa} strokeWidth="4.6" strokeLinecap="round" strokeDasharray="0.1 12.4" />
    {/* La Terre : son horizon courbe, l'atmosphère, deux continents, des nuages */}
    <path d="M0 260V224Q200 168 400 224V260Z" fill={C.azur} />
    <path d="M0 224Q200 168 400 224V231Q200 175 0 231Z" fill={shade(C.azur, 0.45)} />
    <path d="M50 260V243Q60 231 80 233Q92 225 106 233Q122 243 118 260ZM246 215Q262 205 284 209Q296 203 312 211Q334 221 332 241Q318 255 296 251Q288 241 274 243Q252 237 246 215Z" fill={C.persClair} />
    <path d="M134 216Q158 209 186 214Q166 220 134 216ZM16 244Q32 238 50 242Q34 248 16 244ZM338 238Q360 231 384 238Q362 244 338 238ZM196 240Q214 234 236 239Q216 245 196 240Z" fill={C.blanc} />
  </Svg>
);

/** La base lunaire : une plage sous cloche, un module d'habitation, l'antenne pointée vers la Terre, le drapeau. */
const baseLunaire: Art = (props) => (
  <Svg viewBox="0 0 400 260" {...props}>
    {/* Les étoiles et la Terre */}
    <path d={etoiles([[30, 34, 4], [150, 20, 5], [216, 74, 3], [376, 118, 3.5], [22, 112, 3], [238, 18, 3], [122, 86, 2.5], [356, 14, 3]])} fill={C.mimosa} />
    <circle cx="296" cy="52" r="30" fill={C.azur} />
    <path d="M276 36Q286 27 300 31Q306 41 296 49Q284 51 276 44ZM300 62Q312 55 322 61Q321 72 310 78Q300 73 300 62Z" fill={C.persClair} />
    <path d="M268 58Q280 53 294 57Q282 62 268 58ZM296 28Q306 24 316 28Q306 32 296 28Z" fill={C.blanc} />
    <path d="M317.2 30.8A30 30 0 0 1 274.8 73.2A41.5 41.5 0 0 0 317.2 30.8Z" fill={C.nuit} fillOpacity="0.4" />
    {/* Les reliefs au loin, le sol, les cratères */}
    <path d="M0 204V190Q28 174 60 188Q92 176 126 192L170 198H238Q262 182 300 190Q340 170 400 186V204Z" fill={C.gris} />
    <path d="M0 260V202Q200 190 400 202V260Z" fill={C.grisClair} />
    <path d="M0 202Q200 190 400 202V209Q200 197 0 209Z" fill={shade(C.grisClair, -0.14)} />
    <path d={ovales([[58, 237, 26, 6], [338, 241, 30, 7], [196, 227, 14, 3.5], [256, 249, 18, 4.5], [128, 251, 10, 2.5]])} fill={shade(C.grisClair, 0.55)} />
    <path d={ovales([[58, 234.5, 26, 6], [338, 238.5, 30, 7], [196, 225.5, 14, 3.5], [256, 247, 18, 4.5], [128, 249.5, 10, 2.5]])} fill={shade(C.grisClair, -0.24)} />
    {/* Le couloir et ses nervures */}
    <rect x="168" y="179" width="88" height="14" rx="4" fill={C.blanc} />
    <path d={montants([184, 198, 212, 226, 240], 179, 193)} fill="none" stroke={C.grisClair} strokeWidth="2" />
    {/* La grande cloche de verre : une plage, un palmier, un parasol */}
    <path d="M26 198A72 72 0 0 1 170 198Z" fill={C.ciel} />
    <path d="M30 198Q62 180 100 184Q140 178 166 198Z" fill={C.sable} />
    <path d="M122 184Q122 168 118 152" fill="none" stroke={shade(C.terracotta, -0.4)} strokeWidth="3.4" strokeLinecap="round" />
    <path d={palmes(118, 152, 0.6)} fill={C.persFonce} />
    <path d="M61.2 176H62.8V190H61.2Z" fill={C.nuit} />
    <path d="M46 178Q62 158 78 178Z" fill={C.mimosa} />
    <path d="M57.5 178Q59 164 62 161.6Q65 164 66.5 178Z" fill={C.blanc} />
    <path className="amb-scintille" d="M39.7 176.8A62 62 0 0 1 76.8 139.7L79.5 147.2A54 54 0 0 0 47.3 179.5Z" fill={C.blanc} fillOpacity="0.7" />
    <path d="M26 198A72 72 0 0 1 170 198M62 198A36 72 0 0 1 98 126A36 72 0 0 1 134 198M35.6 162Q98 172 160.4 162" fill="none" stroke={C.blanc} strokeWidth="2.6" />
    <rect x="20" y="194" width="156" height="9" rx="3" fill={C.blanc} />
    <rect x="20" y="199" width="156" height="4" rx="2" fill={shade(C.blanc, -0.16)} />
    {/* Le module d'habitation, ses hublots éclairés, ses pieds */}
    <path d="M264 188L260 201M300 188V201M336 188L340 201" fill="none" stroke={C.gris} strokeWidth="4" strokeLinecap="round" />
    <rect x="246" y="150" width="108" height="40" rx="20" fill={C.blanc} />
    <path d="M246.5 174H353.5Q350 190 334 190H266Q250 190 246.5 174Z" fill={shade(C.blanc, -0.14)} />
    <path d={ovales([[274, 168, 7.5, 7.5], [300, 168, 7.5, 7.5], [326, 168, 7.5, 7.5]])} fill={C.nuit} />
    <path d={ovales([[274, 168, 5, 5], [300, 168, 5, 5], [326, 168, 5, 5]])} fill={C.mimosa} />
    {/* L'antenne parabolique, pointée vers la Terre */}
    <path d="M330 151V126" fill="none" stroke={C.grisClair} strokeWidth="3" />
    <g transform="translate(330 122) rotate(-24)">
      <path d="M0 3V-13" fill="none" stroke={C.gris} strokeWidth="1.8" />
      <path d="M-18 -3Q0 17 18 -3Q0 5 -18 -3Z" fill={C.blanc} />
      <path d="M-18 -3Q0 5 18 -3Q0 0 -18 -3Z" fill={C.grisClair} />
      <circle cx="0" cy="-14" r="2.4" fill={C.cerise} />
    </g>
    {/* Le drapeau, tenu par sa tringle : pas de vent ici */}
    <path d="M370 150H372V206H370ZM370 150H394V151.8H370Z" fill={C.grisClair} />
    <rect x="372" y="151.8" width="21" height="14" fill={C.cerise} />
    <circle cx="382.5" cy="158.8" r="3.2" fill={C.mimosa} />
  </Svg>
);

export const RESIDENCES_2: Record<string, Art> = {
  carton,
  tente,
  cabine,
  palais,
  tour,
  archipel,
  "station-orbitale": stationOrbitale,
  "base-lunaire": baseLunaire,
};
