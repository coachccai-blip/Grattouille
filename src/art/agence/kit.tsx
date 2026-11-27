// La boîte à outils des films de l'Agence Carpe Diem (LOT4.md, section 13) : de quoi
// monter trente scènes sans redessiner trente fois le ciel, la mer et le voyageur.
//
// Une scène est un dessin de 360 × 800, plus haut que tous les téléphones : l'écran en
// montre le milieu, et rogne le ciel et le sol selon sa hauteur. Ce qui compte tient entre
// y = 110 et y = 710 ; la carte postale de la fin ne garde que le cadre de 360 × 450 posé en
// y = 175 (ou celui que la scène choisit).
//
// Même style que le reste (../kit.tsx) : papier découpé à la gouache, aplats sans contour,
// ombres en formes décalées, deux points pour les yeux, aucun filtre. Un film a droit à son
// ciel en dégradé, comme les lieux de la Promenade.
//
// Le mouvement : chaque élément est dessiné là où il sera sur la carte postale, et une
// animation l'y amène (`a("va", …)`) ou le fait vivre autour de cette pose (`a("flotte", …)`).
// Sans animation (animations réduites, carte postale), le dessin est donc l'image de la
// fin, telle quelle. Uniquement des transformations et de l'opacité (film.css).

import { useId, type CSSProperties, type ReactNode } from "react";
import { Avatar, type AvatarLook } from "../Avatar";
import { Illustration } from "../Illustration";
import { C, shade } from "../kit";
import { speciesArt } from "../species";

/** Celui qui voyage : l'espèce du joueur, et ce qu'il porte. */
export interface Voyageur {
  espece: string;
  look: AvatarLook;
}

/** Une scène : ce qui se dessine dans le <svg> du film (viewBox 0 0 360 800). */
export type SceneArt = (props: Voyageur) => ReactNode;

// ---------------------------------------------------------------------------
// Le mouvement

export interface Mouvement {
  /** Durée, en secondes. */
  t?: number;
  /** Départ, en secondes après le lever de rideau. */
  d?: number;
  /** D'où l'on vient, ou jusqu'où l'on va, en unités de la scène. */
  dx?: number;
  dy?: number;
  /** `passe` : où l'on finit. */
  fx?: number;
  fy?: number;
  /** Rotation, en degrés (`r0` : au départ d'un `passe`). */
  r?: number;
  r0?: number;
  /** Échelle (`s0` : au départ d'un `pulse`). */
  s?: number;
  s0?: number;
  /** `etire` : l'échelle de départ, en largeur et en hauteur. */
  sx?: number;
  sy?: number;
  /** Opacités de départ et d'arrivée. */
  o0?: number;
  o1?: number;
  /** La courbe : `lin`, `sortie`, `entree`, `rebond`, ou une courbe CSS. */
  e?: string;
  /** Répétitions : un nombre, ou `inf`. Les boucles tournent sans fin par défaut. */
  n?: number | "inf";
  /** Aller-retour. */
  alt?: boolean;
  /** Le pivot : dans la boîte de l'élément (« 50% 100% »), ou un point de son repère ([x, y]). */
  o?: string | readonly [number, number];
  /** Des classes en plus. */
  c?: string;
}

/** Les mouvements de film.css. */
export type Geste =
  | "va" | "sort" | "passe" | "apparait" | "disparait" | "pop" | "chute" | "eclat" | "etire"
  | "flotte" | "tourne" | "defile" | "pulse" | "clignote" | "saut" | "bat";

const BOUCLES: ReadonlySet<Geste> = new Set(["flotte", "tourne", "defile", "pulse", "clignote", "saut", "bat"]);
const ALLERS_RETOURS: ReadonlySet<Geste> = new Set(["flotte", "pulse", "clignote", "bat"]);
const COURBES: Record<string, string> = {
  lin: "linear",
  sortie: "cubic-bezier(.2,.8,.2,1)",
  entree: "cubic-bezier(.6,0,.9,.5)",
  rebond: "cubic-bezier(.34,1.56,.64,1)",
};

/**
 * Les attributs d'un élément qui bouge : `<g {...a("va", { dx: -400, t: 3, d: 1 })}>`.
 * Le mouvement se règle par des variables CSS, lues par les animations de film.css.
 */
export function a(geste: Geste, m: Mouvement = {}): { className: string; style: CSSProperties } {
  const vars: Record<string, string> = {};
  const px = (nom: string, v: number | undefined) => {
    if (v !== undefined) vars[nom] = `${v}px`;
  };
  if (m.t !== undefined) vars["--t"] = `${m.t}s`;
  if (m.d !== undefined) vars["--d"] = `${m.d}s`;
  px("--dx", m.dx);
  px("--dy", m.dy);
  px("--fx", m.fx);
  px("--fy", m.fy);
  if (m.r !== undefined) vars["--r"] = `${m.r}deg`;
  if (m.r0 !== undefined) vars["--r0"] = `${m.r0}deg`;
  if (m.s !== undefined) vars["--s"] = String(m.s);
  if (m.s0 !== undefined) vars["--s0"] = String(m.s0);
  if (m.sx !== undefined) vars["--sx"] = String(m.sx);
  if (m.sy !== undefined) vars["--sy"] = String(m.sy);
  if (m.o0 !== undefined) vars["--o0"] = String(m.o0);
  if (m.o1 !== undefined) vars["--o1"] = String(m.o1);
  const courbe = m.e ?? (geste === "tourne" || geste === "defile" || geste === "passe" ? "lin" : undefined);
  if (courbe) vars["--e"] = COURBES[courbe] ?? courbe;
  const n = m.n ?? (BOUCLES.has(geste) ? "inf" : undefined);
  if (n !== undefined) vars["--n"] = n === "inf" ? "infinite" : String(n);
  if (m.alt ?? ALLERS_RETOURS.has(geste)) vars["--sens"] = "alternate";
  let dansLaVue = false;
  if (typeof m.o === "string") vars["--o"] = m.o;
  else if (m.o) {
    vars["--o"] = `${m.o[0]}px ${m.o[1]}px`;
    dansLaVue = true;
  }
  return {
    className: `xp-a xp-${geste}${dansLaVue ? " xp-a--vue" : ""}${m.c ? ` ${m.c}` : ""}`,
    style: vars as CSSProperties,
  };
}

/** Place un groupe : `transform={tf(x, y, échelle, rotation)}`. */
export function tf(x: number, y: number, k = 1, r = 0): string {
  return `translate(${x} ${y})${r ? ` rotate(${r})` : ""}${k !== 1 ? ` scale(${k})` : ""}`;
}

// ---------------------------------------------------------------------------
// Les tracés

const n2 = (v: number) => +v.toFixed(2);

/** Des petits ronds en un seul tracé : étoiles lointaines, bulles, pois, hublots. */
export function ronds(r: number, points: readonly (readonly [number, number])[]): string {
  const d = n2(2 * r);
  return points.map(([x, y]) => `M${n2(x - r)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** Des étoiles à quatre branches en un seul tracé : [x, y, rayon]. */
export function etoiles(points: readonly (readonly [number, number, number])[]): string {
  return points
    .map(([x, y, r]) => {
      const q = n2(r * 0.26);
      return `M${x} ${y - r}L${x + q} ${y - q}L${x + r} ${y}L${x + q} ${y + q}L${x} ${y + r}L${x - q} ${y + q}L${x - r} ${y}L${x - q} ${y - q}Z`;
    })
    .join("");
}

/** Une étoile à cinq branches, centrée en (x, y), de rayon `r`. */
export function etoile5(x: number, y: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rayon = i % 2 === 0 ? r : r * 0.42;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${n2(x + rayon * Math.cos(angle))} ${n2(y + rayon * Math.sin(angle))}`);
  }
  return `M${pts.join("L")}Z`;
}

/** Un nuage de papier, large de `l` et haut d'environ 0,46 × l, coin haut gauche en (0, 0). */
export function nuage(l: number): string {
  const bosses: [number, number][] = [[0.2, 0.3], [0.42, 0.2], [0.66, 0.27], [0.84, 0.34]];
  const rayons = [0.16, 0.2, 0.17, 0.12];
  const cercles = bosses.map(([x, y], i) => ronds(n2(rayons[i]! * l), [[n2(x * l), n2(y * l)]])).join("");
  return `${cercles}M${n2(0.1 * l)} ${n2(0.3 * l)}V${n2(0.46 * l)}H${n2(0.9 * l)}V${n2(0.3 * l)}Z`
    + ronds(n2(0.08 * l), [[n2(0.1 * l), n2(0.38 * l)], [n2(0.9 * l), n2(0.38 * l)]]);
}

/**
 * Une bande à crête de vagues, qui déborde de deux périodes de chaque côté : en la faisant
 * défiler d'une période (`a("defile", { dx: -periode })`), la mer avance sans fin.
 */
export function vagues(y: number, periode: number, amplitude: number, bas = 800): string {
  const demi = n2(periode / 2);
  const quart = n2(periode / 4);
  let d = `M${-2 * periode} ${y}`;
  for (let x = -2 * periode; x < 360 + 2 * periode; x += periode) d += `q${quart} ${-amplitude} ${demi} 0t${demi} 0`;
  return `${d}V${bas}H${-2 * periode}Z`;
}

/** Une ligne de crêtes ou de collines : des points reliés par des courbes douces, refermée vers le bas. */
export function relief(points: readonly (readonly [number, number])[], bas = 800): string {
  const [premier, ...suite] = points;
  if (!premier) return "";
  let d = `M${premier[0]} ${premier[1]}`;
  let avant = premier;
  for (const p of suite) {
    const mx = n2((avant[0] + p[0]) / 2);
    d += `C${mx} ${avant[1]} ${mx} ${p[1]} ${p[0]} ${p[1]}`;
    avant = p;
  }
  return `${d}V${bas}H${premier[0]}Z`;
}

// ---------------------------------------------------------------------------
// Le ciel et ses astres

/** Le ciel : un dégradé du haut (première couleur) jusqu'à l'horizon `bas`. Il déborde du cadre, par sûreté. */
export function Ciel({ id, couleurs, bas = 800 }: { id: string; couleurs: readonly string[]; bas?: number }) {
  return (
    <>
      <defs>
        <linearGradient id={`xp-ciel-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={bas}>
          {couleurs.map((couleur, i) => <stop key={i} offset={couleurs.length > 1 ? i / (couleurs.length - 1) : 0} stopColor={couleur} />)}
        </linearGradient>
      </defs>
      <rect x="-20" y="-20" width="400" height="840" fill={`url(#xp-ciel-${id})`} />
    </>
  );
}

/** Un astre et son halo : le soleil, la lune pleine. */
export function Astre({ x, y, r, couleur = C.mimosa, halo = couleur }: { x: number; y: number; r: number; couleur?: string; halo?: string }) {
  return (
    <>
      <circle cx={x} cy={y} r={r * 1.9} fill={halo} fillOpacity="0.14" />
      <circle cx={x} cy={y} r={r * 1.4} fill={halo} fillOpacity="0.22" />
      <circle cx={x} cy={y} r={r} fill={couleur} />
    </>
  );
}

/** Un semis d'étoiles : des points fixes, et quelques étoiles à branches qui scintillent chacune à son heure. */
export function Etoiles({ points, brillantes = [], couleur = C.blanc }: {
  points: readonly (readonly [number, number])[];
  brillantes?: readonly (readonly [number, number, number])[];
  couleur?: string;
}) {
  return (
    <>
      <path d={ronds(1.3, points)} fill={couleur} fillOpacity="0.85" />
      {brillantes.map((etoile, i) => (
        <path key={i} d={etoiles([etoile])} fill={couleur} {...a("clignote", { t: 1.1 + (i % 3) * 0.35, d: (i % 4) * 0.3, o0: 0.25 })} />
      ))}
    </>
  );
}

/** Une mouette au loin : deux ailes en accent, qui battent. Centrée en (0, 0), large de 32. */
export function Mouette({ couleur = C.blanc }: { couleur?: string }) {
  return (
    <path
      d="M-16 0Q-8 -10 0 0Q8 -10 16 0Q8 -4 0 4Q-8 -4 -16 0Z"
      fill={couleur}
      {...a("bat", { s: 0.35, t: 0.42, o: "50% 100%" })}
    />
  );
}

/**
 * Un goéland de près, de profil, qui vole vers la droite : centré en (0, 0), long de 110.
 * Ses deux ailes battent. Son bec est en (58, 2) : de quoi emporter quelque chose.
 */
export function Goeland() {
  const ombre = shade(C.blanc, -0.14);
  return (
    <>
      <g {...a("bat", { s: -0.45, t: 0.3, d: -0.1, o: "50% 100%" })}>
        <path d="M-6 0Q-16 -30 -40 -42Q-30 -22 -22 2Z" fill={ombre} />
        <path d="M-40 -42Q-34 -38 -30 -30L-36 -30Z" fill={C.grisFonce} />
      </g>
      <path d="M-34 6L-56 0L-50 9L-58 16L-32 13Z" fill={C.grisClair} />
      <path d="M-38 8Q-20 -6 12 -2Q32 0 40 8Q28 22 0 22Q-24 22 -38 8Z" fill={C.blanc} />
      <path d="M0 22Q28 22 40 8Q30 16 2 17Q-16 18 -28 14Q-16 22 0 22Z" fill={ombre} />
      <circle cx="36" cy="0" r="11.5" fill={C.blanc} />
      <circle cx="39.5" cy="-2.5" r="1.9" fill={C.nuit} />
      <path d="M45 -2L62 2.5L45 6Z" fill={C.mimosaFonce} />
      <g {...a("bat", { s: -0.45, t: 0.3, o: "50% 100%" })}>
        <path d="M-2 4Q-6 -34 26 -46Q18 -22 22 6Z" fill={C.blanc} />
        <path d="M26 -46Q20 -40 16 -30L24 -34Z" fill={C.grisFonce} />
      </g>
    </>
  );
}

/** La mer : une nappe à partir de `y`, et ses reflets de papier qui glissent. */
export function Mer({ y, bas = 800, couleur = C.mer, reflets = shade(couleur, 0.25), t = 5 }: {
  y: number; bas?: number; couleur?: string; reflets?: string; t?: number;
}) {
  let d = "";
  const rangs = Math.min(4, Math.floor((bas - y) / 34));
  for (let rang = 0; rang < rangs; rang++) {
    const yy = y + 14 + rang * 34;
    for (let x = -180 + (rang % 2) * 60; x < 540; x += 120) d += `M${x} ${yy}h26l7 -4l7 4h26v3h-66Z`;
  }
  return (
    <>
      <rect x="-20" y={y} width="400" height={bas - y} fill={couleur} />
      <rect x="-20" y={y} width="400" height="3" fill={reflets} />
      <path d={d} fill={reflets} {...a("defile", { dx: -120, t })} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Le voyageur

/**
 * Le buste du joueur, tel qu'il est sur son Domaine : son espèce, son chapeau, ses lunettes,
 * sa tenue. Dans son repère de 400 × 480 (yeux en (165, 165) et (235, 165), épaules en bas) ;
 * à poser dans un groupe qui le place et le réduit.
 */
export function Buste({ espece, look }: Voyageur) {
  return (
    <svg width="400" height="480" viewBox="0 0 400 480">
      <Avatar species={espece} look={look} />
    </svg>
  );
}

/** Sa tête seule, chapeau et lunettes compris, dans un carré de 280 : pour un hublot, une fenêtre de wagon. */
export function Tete({ espece, look }: Voyageur) {
  return (
    <svg width="280" height="280">
      <Avatar species={espece} look={look} crop="tete" />
    </svg>
  );
}

/**
 * Une fenêtre : ce qu'on y met ne dépasse pas de son cadre (un rectangle aux coins ronds,
 * ou un rond quand `rx` vaut la moitié de sa largeur). Pour une tête à la vitre d'un wagon.
 */
export function Fenetre({ x, y, l, h, rx = 0, children }: { x: number; y: number; l: number; h: number; rx?: number; children: ReactNode }) {
  const id = `xp-f${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <clipPath id={id}><rect x={x} y={y} width={l} height={h} rx={rx} /></clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/** La couleur du pelage du joueur : pour une patte qui dépasse, une queue, une empreinte. */
export function pelageDe(espece: string): string {
  return speciesArt(espece).colors.pelage;
}

/** Le bout d'un membre : son attache, son angle depuis la verticale basse (positif : vers l'extérieur), sa longueur. */
function bout(x: number, y: number, angle: number, longueur: number, cote: -1 | 1): [number, number] {
  const rad = (angle * Math.PI) / 180;
  return [n2(x + cote * longueur * Math.sin(rad)), n2(y + longueur * Math.cos(rad))];
}

interface CorpsProps extends Voyageur {
  /** L'angle de chaque bras, en degrés : 0 le long du corps, 90 à l'horizontale, 150 levé. [celui de gauche à l'image, celui de droite]. */
  bras?: readonly [number, number];
  /** L'angle de chaque jambe : 0 droite, positif vers l'extérieur. */
  jambes?: readonly [number, number];
  /** Le bras de droite à l'image salue : il s'agite. */
  salut?: boolean;
}

/**
 * Le joueur en pied : son buste, et ce que le Domaine ne montre jamais, deux bras et deux
 * jambes de son pelage. Même repère que le buste ; les pieds touchent le sol vers y = 610.
 */
export function Perso({ espece, look, bras = [14, 14], jambes = [4, 4], salut = false }: CorpsProps) {
  const pelage = speciesArt(espece).colors.pelage;
  const sombre = shade(pelage, -0.22);
  const clair = shade(pelage, 0.18);
  const mainG = bout(96, 360, bras[0], 150, -1);
  const mainD = bout(304, 360, bras[1], 150, 1);
  const piedG = bout(160, 462, jambes[0], 122, -1);
  const piedD = bout(240, 462, jambes[1], 122, 1);
  const brasDroit = (
    <>
      <path d={`M304 360L${mainD[0]} ${mainD[1]}`} fill="none" stroke={sombre} strokeWidth="50" strokeLinecap="round" />
      <circle cx={mainD[0]} cy={mainD[1]} r="30" fill={clair} />
    </>
  );
  return (
    <>
      <path d={`M160 462L${piedG[0]} ${piedG[1]}`} fill="none" stroke={pelage} strokeWidth="60" strokeLinecap="round" />
      <path d={`M240 462L${piedD[0]} ${piedD[1]}`} fill="none" stroke={sombre} strokeWidth="60" strokeLinecap="round" />
      <ellipse cx={piedG[0] - 8} cy={piedG[1] + 18} rx="46" ry="22" fill={sombre} />
      <ellipse cx={piedD[0] + 8} cy={piedD[1] + 18} rx="46" ry="22" fill={shade(pelage, -0.38)} />
      <path d={`M96 360L${mainG[0]} ${mainG[1]}`} fill="none" stroke={pelage} strokeWidth="50" strokeLinecap="round" />
      <circle cx={mainG[0]} cy={mainG[1]} r="30" fill={clair} />
      {salut ? <g {...a("flotte", { r: 13, t: 0.4, o: [304, 360] })}>{brasDroit}</g> : brasDroit}
      <Buste espece={espece} look={look} />
    </>
  );
}

/** Les teintes d'un scaphandre. */
const TISSU = "#F4F6F8";
const TISSU_OMBRE = "#C9D1D9";
const JOINT = "#8E979F";

/**
 * Le joueur en scaphandre : sa tête (et son chapeau) dans une grande bulle de verre, le
 * reste dans du blanc. Même repère que le buste ; les bottes touchent le sol vers y = 620.
 */
export function Astronaute({ espece, look, bras = [22, 22], jambes = [6, 6], salut = false }: CorpsProps) {
  const mainG = bout(84, 376, bras[0], 132, -1);
  const mainD = bout(316, 376, bras[1], 132, 1);
  const piedG = bout(152, 458, jambes[0], 112, -1);
  const piedD = bout(248, 458, jambes[1], 112, 1);
  const brasDroit = (
    <>
      <path d={`M316 376L${mainD[0]} ${mainD[1]}`} fill="none" stroke={TISSU_OMBRE} strokeWidth="66" strokeLinecap="round" />
      <circle cx={mainD[0]} cy={mainD[1]} r="37" fill={JOINT} />
    </>
  );
  return (
    <>
      {/* Le sac à dos, les jambes, les bras */}
      <rect x="66" y="292" width="268" height="176" rx="36" fill={JOINT} />
      <path d={`M152 458L${piedG[0]} ${piedG[1]}`} fill="none" stroke={TISSU} strokeWidth="80" strokeLinecap="round" />
      <path d={`M248 458L${piedD[0]} ${piedD[1]}`} fill="none" stroke={TISSU_OMBRE} strokeWidth="80" strokeLinecap="round" />
      <ellipse cx={piedG[0] - 6} cy={piedG[1] + 30} rx="56" ry="28" fill={JOINT} />
      <ellipse cx={piedD[0] + 6} cy={piedD[1] + 30} rx="56" ry="28" fill={C.grisFonce} />
      <path d={`M84 376L${mainG[0]} ${mainG[1]}`} fill="none" stroke={TISSU} strokeWidth="66" strokeLinecap="round" />
      <circle cx={mainG[0]} cy={mainG[1]} r="37" fill={JOINT} />
      {salut ? <g {...a("flotte", { r: 12, t: 0.45, o: [316, 376] })}>{brasDroit}</g> : brasDroit}
      {/* Le fond de la bulle, le voyageur, puis le scaphandre par-dessus ses épaules */}
      <circle cx="200" cy="165" r="182" fill="#D6F1F8" fillOpacity="0.3" />
      <Buste espece={espece} look={look} />
      <path d="M56 482V388Q56 322 122 322H278Q344 322 344 388V482Z" fill={TISSU} />
      <path d="M278 322Q344 322 344 388V482H300V346Q294 328 278 322Z" fill={TISSU_OMBRE} />
      <path d="M94 326Q200 372 306 326V350Q200 396 94 350Z" fill={JOINT} />
      <rect x="150" y="398" width="100" height="54" rx="10" fill={C.ciel} />
      <path d={ronds(9, [[174, 425]])} fill={C.cerise} />
      <path d={ronds(9, [[200, 425]])} fill={C.mimosa} />
      <path d={ronds(9, [[226, 425]])} fill={C.persienne} />
      {/* Le verre de la bulle, et son reflet */}
      <circle cx="200" cy="165" r="182" fill="none" stroke={TISSU} strokeWidth="14" />
      <path d="M52 132A154 154 0 0 1 118 40" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="13" strokeLinecap="round" />
    </>
  );
}

/** Un habitant de Grattouille dans son médaillon rond (120 de large), cerclé d'ivoire. Le film en fournit la découpe. */
export function Medaillon({ pnj }: { pnj: string }) {
  return (
    <>
      <g clipPath="url(#xp-rond)">
        <svg width="120" height="120">
          <Illustration id={`pnj:${pnj}`} />
        </svg>
      </g>
      <circle cx="60" cy="60" r="58" fill="none" stroke={C.ivoire} strokeWidth="5" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Ce qui revient d'une scène à l'autre

/** La Terre, vue de loin : un disque de rayon `r` centré en (0, 0), ses continents, son ombre. */
export function Terre({ r }: { r: number }) {
  const k = r / 50;
  return (
    <g transform={k === 1 ? undefined : `scale(${n2(k)})`}>
      <circle r="50" fill={C.azur} />
      <path d="M-34 -22Q-22 -38 -4 -34Q6 -24 -4 -14Q-6 0 -20 2Q-34 -4 -34 -22ZM8 -6Q26 -14 38 -2Q42 14 30 26Q16 24 14 10ZM-22 16Q-8 12 -2 24Q-6 38 -18 40Q-28 32 -22 16ZM16 -40Q26 -42 32 -34Q24 -28 16 -32Z" fill={C.vert} />
      <path d="M-44 -6Q-30 -12 -18 -8M4 34Q18 30 30 36M-10 -44Q0 -48 12 -44" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="5" strokeLinecap="round" />
      <path d="M0 -50A50 50 0 0 1 0 50Q26 28 26 0Q26 -28 0 -50Z" fill={C.marine} fillOpacity="0.28" />
    </g>
  );
}

/** Une fusée de papier, debout, haute de 150 : sa pointe en (0, -75), ses ailerons en bas. Le hublot est vide : (0, -18), rayon 17. */
export function Fusee({ flamme = true }: { flamme?: boolean }) {
  return (
    <>
      {flamme && (
        <g {...a("pulse", { s0: 0.8, s: 1.15, t: 0.16, o: "50% 0%" })}>
          <path d="M-16 58Q-20 86 0 112Q20 86 16 58Z" fill={C.mimosa} />
          <path d="M-8 58Q-10 76 0 92Q10 76 8 58Z" fill={C.blanc} />
        </g>
      )}
      <path d="M-32 30L-50 66H-22ZM32 30L50 66H22Z" fill={C.cerise} />
      <path d="M0 -75Q32 -46 32 0V52Q32 60 24 60H-24Q-32 60 -32 52V0Q-32 -46 0 -75Z" fill={C.blanc} />
      <path d="M0 -75Q32 -46 32 0V52Q32 60 24 60H10V-64Q6 -70 0 -75Z" fill={C.grisClair} />
      <path d="M0 -75Q18 -60 26 -38H-26Q-18 -60 0 -75Z" fill={C.cerise} />
      <rect x="-32" y="34" width="64" height="9" fill={C.cerise} />
      <circle cx="0" cy="-18" r="21" fill={C.grisFonce} />
      <circle cx="0" cy="-18" r="17" fill={C.ciel} />
    </>
  );
}

/** Le sol de la Lune : une plaine grise à partir de `y`, bombée, avec ses cratères. */
export function SolLunaire({ y, couleur = "#C7CCD6" }: { y: number; couleur?: string }) {
  const ombre = shade(couleur, -0.2);
  return (
    <>
      <path d={`M-20 ${y + 22}Q180 ${y - 26} 380 ${y + 22}V820H-20Z`} fill={couleur} />
      <ellipse cx="62" cy={y + 62} rx="38" ry="10" fill={ombre} />
      <ellipse cx="62" cy={y + 65} rx="30" ry="6" fill={shade(couleur, -0.34)} />
      <ellipse cx="292" cy={y + 108} rx="48" ry="12" fill={ombre} />
      <ellipse cx="292" cy={y + 111} rx="38" ry="7" fill={shade(couleur, -0.34)} />
      <ellipse cx="150" cy={y + 190} rx="60" ry="14" fill={ombre} />
      <ellipse cx="228" cy={y + 36} rx="18" ry="5" fill={ombre} />
      <ellipse cx="330" cy={y + 240} rx="34" ry="9" fill={ombre} />
      <ellipse cx="30" cy={y + 270} rx="44" ry="11" fill={ombre} />
    </>
  );
}
