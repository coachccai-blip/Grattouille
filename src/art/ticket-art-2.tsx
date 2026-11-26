// Vignettes des quinze nouveaux tickets.
//
// Même contrat que ticket-art.tsx (à lire d'abord) : viewBox 0 0 100 60, fond
// transparent, une silhouette franche qui se lit à 96 px de large comme à 40 px.
//
// Identifiants attendus (shared/tickets.ts) :
//   saute-crabe, grande-maree, grille-du-jour, rouge-et-noir, bonne-aventure, pari-auguste,
//   cocktails, babord-tribord, peche-au-gros, sesame, compte-numerote, interets-composes,
//   eclipse-totale, alignement, gratte-ciel.

import { C, METAL, Svg, shade, type Art } from "./kit";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Un éclat à quatre branches, centré en (x, y), de rayon r. */
function eclat(x: number, y: number, r: number): string {
  const k = r * 0.22;
  const p = (dx: number, dy: number) => `${r2(x + dx)} ${r2(y + dy)}`;
  return `M${p(0, -r)}Q${p(k, -k)} ${p(r, 0)}Q${p(k, k)} ${p(0, r)}Q${p(-k, k)} ${p(-r, 0)}Q${p(-k, -k)} ${p(0, -r)}Z`;
}

/** Des ronds réunis en un seul tracé : [cx, cy, r]. */
function ronds(...liste: [number, number, number][]): string {
  return liste.map(([x, y, r]) => `M${r2(x - r)} ${y}a${r} ${r} 0 1 0 ${r2(2 * r)} 0a${r} ${r} 0 1 0 ${r2(-2 * r)} 0Z`).join("");
}

/** L'ombre en croissant d'une boule (cx, cy, r) : en bas à droite, la lumière vient d'en haut à gauche. */
function croissant(cx: number, cy: number, r: number): string {
  const p = (dx: number, dy: number) => `${r2(cx + dx * r)} ${r2(cy + dy * r)}`;
  const grand = r2(r * 1.22);
  return `M${p(0, 1)}A${r} ${r} 0 0 0 ${p(0.944, -0.333)}A${grand} ${grand} 0 0 1 ${p(-0.667, 0.744)}A${r} ${r} 0 0 0 ${p(0, 1)}Z`;
}

/** Le point de l'ellipse (cx, cy, rx, ry) à l'angle `deg`, en degrés (0 à droite, 90 en bas). */
function surEllipse(cx: number, cy: number, rx: number, ry: number, deg: number): string {
  const a = (deg * Math.PI) / 180;
  return `${r2(cx + rx * Math.cos(a))} ${r2(cy + ry * Math.sin(a))}`;
}

/**
 * Les parts d'un disque vu de trois quarts : l'ellipse est découpée en n parts égales,
 * la part 0 au fond ; on garde celles que `garde` retient.
 */
function parts(cx: number, cy: number, rx: number, ry: number, n: number, garde: (i: number) => boolean): string {
  const pas = 360 / n;
  let d = "";
  for (let i = 0; i < n; i++) {
    if (!garde(i)) continue;
    const a = -90 - pas / 2 + i * pas;
    d += `M${cx} ${cy}L${surEllipse(cx, cy, rx, ry, a)}A${rx} ${ry} 0 0 1 ${surEllipse(cx, cy, rx, ry, a + pas)}Z`;
  }
  return d;
}

/** n traits rayonnants autour de (cx, cy), de l'ellipse (rx1, ry1) à l'ellipse (rx2, ry2), à partir de l'angle `debut`. */
function rais(cx: number, cy: number, rx1: number, ry1: number, rx2: number, ry2: number, n: number, debut: number): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = debut + (i * 360) / n;
    d += `M${surEllipse(cx, cy, rx1, ry1, a)}L${surEllipse(cx, cy, rx2, ry2, a)}`;
  }
  return d;
}

/** Des rayons en pointe autour de (cx, cy) : [angle, longueur], de base r0 et de demi-largeur `demi` degrés. */
function rayons(cx: number, cy: number, r0: number, demi: number, liste: [number, number][]): string {
  return liste
    .map(([deg, l]) => `M${surEllipse(cx, cy, r0, r0, deg - demi)}L${surEllipse(cx, cy, l, l, deg)}L${surEllipse(cx, cy, r0, r0, deg + demi)}Z`)
    .join("");
}

/**
 * Un fuseau de montgolfière d'axe x = cx, du sommet (y = haut) à l'encolure, entre les
 * fractions f1 et f2 de la demi-largeur (de -1, bord gauche, à 1, bord droit).
 */
function fuseau(cx: number, haut: number, f1: number, f2: number): string {
  const x = (f: number, k: number) => r2(cx + f * k);
  const y = (dy: number) => haut + dy;
  return (
    `M${cx} ${haut}C${x(f2, 12)} ${haut} ${x(f2, 18)} ${y(9)} ${x(f2, 18)} ${y(18)}` +
    `C${x(f2, 18)} ${y(27)} ${x(f2, 9)} ${y(33)} ${x(f2, 5.5)} ${y(38)}H${x(f1, 5.5)}` +
    `C${x(f1, 9)} ${y(33)} ${x(f1, 18)} ${y(27)} ${x(f1, 18)} ${y(18)}C${x(f1, 18)} ${y(9)} ${x(f1, 12)} ${haut} ${cx} ${haut}Z`
  );
}

/** Une pince de crabe, ouverte vers le haut, centrée sur l'origine. */
const PINCE = "M-1.6 -5.3L0.3 -0.6L2.3 -4.85A4.6 5.6 0 1 1 -1.6 -5.3Z";

/** Saute-Crabe : un crabe rouge saute par-dessus deux dés, sur la planche de la jetée. */
const sauteCrabe: Art = (props) => {
  const rouge = C.cerise;
  const rougeOmbre = shade(rouge, -0.25);
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* La mer */}
      <path d="M2 33Q8 30 14 33Q20 36 26 33Q32 30 38 33Q44 36 50 33Q56 30 62 33Q68 36 74 33Q80 30 86 33Q92 36 98 33V51Q98 57 92 57H8Q2 57 2 51Z" fill={C.azur} />
      <path d="M17 38.5Q20 36.7 23 38.5M45 39.5Q48 37.7 51 39.5M76 38Q79 36.2 82 38" fill="none" stroke={C.blanc} strokeWidth="0.9" strokeLinecap="round" />
      {/* La jetée : pieux, planche, joints */}
      <rect x="8" y="41" width="5" height="16" rx="1.4" fill={C.boisFonce} />
      <rect x="87" y="41" width="5" height="16" rx="1.4" fill={C.boisFonce} />
      <rect x="5" y="46" width="90" height="4.8" rx="1.2" fill={C.bois} />
      <path d="M5 48.6H95V49.6Q95 50.8 93.8 50.8H6.2Q5 50.8 5 49.6Z" fill={shade(C.bois, -0.25)} />
      <path d="M27.5 46V50.8M50 46V50.8M72.5 46V50.8" fill="none" stroke={C.boisFonce} strokeWidth="0.7" />
      <path d="M2 54Q8 51.6 14 54Q20 56.4 26 54Q32 51.6 38 54Q44 56.4 50 54Q56 51.6 62 54Q68 56.4 74 54Q80 51.6 86 54Q92 56.4 98 54Q97 57 92 57H8Q3 57 2 54Z" fill={C.mer} />
      {/* Les deux dés */}
      <g transform="translate(36 39) rotate(-7)">
        <rect x="-5.8" y="-5.6" width="13.4" height="13.4" rx="2.8" fill={C.marine} fillOpacity="0.45" />
        <rect x="-6.7" y="-6.7" width="13.4" height="13.4" rx="2.8" fill={C.blanc} />
        <path d={ronds([-3.5, -3.5, 1.4], [3.5, -3.5, 1.4], [0, 0, 1.4], [-3.5, 3.5, 1.4], [3.5, 3.5, 1.4])} fill={C.nuit} />
      </g>
      <g transform="translate(63.5 39.2) rotate(11)">
        <rect x="-5.3" y="-5.1" width="12.4" height="12.4" rx="2.6" fill={C.marine} fillOpacity="0.45" />
        <rect x="-6.2" y="-6.2" width="12.4" height="12.4" rx="2.6" fill={C.blanc} />
        <path d={ronds([-3.2, -3.2, 1.4], [0, 0, 1.4], [3.2, 3.2, 1.4])} fill={C.nuit} />
      </g>
      {/* L'élan du saut */}
      <path d="M17.5 44Q17 25 30.5 16.5" fill="none" stroke={C.corail} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="3 3" />
      {/* Le crabe : pattes, bras, pinces levées, carapace, yeux au bout de leurs tiges */}
      <g transform="translate(50 19.5) rotate(-8)">
        <path d="M-9.5 2L-14.6 4.6L-15.6 8.6M-8 4.4L-12 8L-12 11.4M-5.4 5.8L-7.8 9.8L-7 12.4M9.5 2L14.6 4.6L15.6 8.6M8 4.4L12 8L12 11.4M5.4 5.8L7.8 9.8L7 12.4" fill="none" stroke={rougeOmbre} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-10 -3L-15.5 -6.5M10 -3L15.5 -6.5" fill="none" stroke={rouge} strokeWidth="3" strokeLinecap="round" />
        <path d={PINCE} transform="translate(-17.6 -9.6) rotate(-24)" fill={rouge} />
        <path d={PINCE} transform="translate(17.6 -9.6) rotate(24) scale(-1 1)" fill={rouge} />
        <path d="M-3.4 -6.4L-3.8 -10.6M3.4 -6.4L3.8 -10.6" fill="none" stroke={rouge} strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="0" cy="0" rx="12" ry="7.8" fill={rouge} />
        <path d="M0 7.8Q12 7.8 12 0Q12 -3 9.8 -4.6Q10.4 5 -5.6 6.9Q-3 7.8 0 7.8Z" fill={rougeOmbre} />
        <path d="M-7.4 -2.4Q-5 -5.2 -1 -5.6" fill="none" stroke={C.ceriseClair} strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="-3.9" cy="-11.4" r="1.9" fill={C.nuit} />
        <circle cx="3.9" cy="-11.4" r="1.9" fill={C.nuit} />
      </g>
    </Svg>
  );
};

/** Grande Marée : une grande vague roule devant le soleil, l'échelle de marée et le seau de pêche à pied. */
const grandeMaree: Art = (props) => {
  const eau = C.mer;
  const fond = shade(C.mer, -0.3);
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Le soleil */}
      <circle cx="54" cy="25" r="22" fill={C.corail} />
      {/* L'échelle de marée : pieu de bois, graduations blanches, tête rouge */}
      <path d="M85 54V10.5L88 7L91 10.5V54Z" fill={C.bois} />
      <path d="M89.2 8.4L91 10.5V54H89.2Z" fill={C.boisFonce} />
      <path d="M85 12.6V10.5L88 7L91 10.5V12.6Z" fill={C.cerise} />
      <path d="M86 16h3.2v2.2h-3.2zM86 21.4h3.2v2.2h-3.2zM86 26.8h3.2v2.2h-3.2zM86 32.2h3.2v2.2h-3.2zM86 37.6h3.2v2.2h-3.2z" fill={C.blanc} />
      {/* Le seau */}
      <path d="M72.4 38.6Q77 29.6 81.6 38.6" fill="none" stroke={C.cerise} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M71.6 39.5H82.4L80.8 52H73.2Z" fill={C.mimosa} />
      <path d="M79 39.5H82.4L80.8 52H78Z" fill={C.mimosaFonce} fillOpacity="0.6" />
      <rect x="70.8" y="38.2" width="12.4" height="2.4" rx="1.2" fill={C.mimosaFonce} />
      {/* La vague : son corps, le creux du rouleau, ses filets d'eau */}
      <path d="M2 51V38Q13 35 22 23Q31 9.5 46 9Q60 8.5 67 18.5Q70.5 25 67.5 30.5Q66 22.5 56 19.5Q44 17 39.5 27Q36 36 46 41Q58 46 76 43H98V51Q98 57 92 57H8Q2 57 2 51Z" fill={eau} />
      <path d="M56 19.5Q44 17 39.5 27Q36 36 46 41Q58 46 76 43Q57 49 43.5 44.2Q32 38 35.6 26Q40 14 56 19.5Z" fill={fond} />
      <path d="M10 41.5Q20 37 27 27.5M19 45Q27.5 40.5 31.5 33" fill="none" stroke={C.azur} strokeWidth="1.4" strokeLinecap="round" />
      {/* L'écume de la crête, les embruns */}
      <path d={ronds([48, 10, 3.4], [53.5, 9.2, 3.8], [59.5, 10.8, 4], [64.5, 14.6, 4], [67.6, 19.6, 3.8], [69, 25, 3.4], [67.4, 29.8, 3], [66, 33.4, 2], [64.6, 36.2, 1.3])} fill={C.blanc} />
      <path d={ronds([73.6, 16, 1.3], [72.5, 31.5, 1.1], [58, 4.6, 1.2])} fill={C.blanc} />
      {/* La mer au premier plan */}
      <path d="M2 50.5Q8 48 14 50.5Q20 53 26 50.5Q32 48 38 50.5Q44 53 50 50.5Q56 48 62 50.5Q68 53 74 50.5Q80 48 86 50.5Q92 53 98 50.5V51Q98 57 92 57H8Q2 57 2 51Z" fill={fond} />
      <path d="M12 46.5Q15 44.7 18 46.5M60 47.6Q63 45.8 66 47.6" fill="none" stroke={C.blanc} strokeWidth="0.9" strokeLinecap="round" />
    </Svg>
  );
};

/** La Grille du Jour : le journal plié sur la table du café, sa grille de mots croisés, un crayon, un café. */
const grilleDuJour: Art = (props) => {
  const table = C.lagune;
  const noires: [number, number][] = [[0, 2], [1, 4], [2, 1], [2, 3], [3, 0], [4, 2]];
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* La table et son ombre */}
      <rect x="3" y="5.4" width="96" height="52" rx="10" fill={shade(table, -0.4)} />
      <rect x="2" y="4" width="96" height="52" rx="10" fill={table} />
      {/* Le journal plié */}
      <g transform="rotate(-6 37 30)">
        <rect x="15.6" y="11.8" width="46" height="38" rx="0.8" fill={C.nuit} fillOpacity="0.35" />
        <rect x="14.8" y="10.9" width="46" height="38" rx="0.8" fill={shade(C.ivoire, -0.16)} />
        <rect x="14" y="10" width="46" height="38" rx="0.8" fill={C.ivoire} />
        {/* Le titre, le filet, une photo et des lignes */}
        <rect x="17.5" y="13" width="22" height="4.2" rx="0.8" fill={C.noir} />
        <path d="M42 13.4h14.5v1.3h-14.5zM42 15.9h10v1.3h-10zM17.5 32h13v1.2h-13zM17.5 34.6h13v1.2h-13zM17.5 37.2h13v1.2h-13zM17.5 39.8h13v1.2h-13zM17.5 42.4h13v1.2h-13zM17.5 45h8v1.2h-8z" fill={C.gris} />
        <rect x="17.5" y="19" width="39" height="0.7" fill={C.noir} />
        <rect x="17.5" y="21.6" width="13" height="8.4" fill={C.brume} />
        {/* La grille */}
        <rect x="33.5" y="21.6" width="23" height="23" fill={C.blanc} />
        <path d={noires.map(([r, c]) => `M${r2(33.5 + c * 4.6)} ${r2(21.6 + r * 4.6)}h4.6v4.6h-4.6Z`).join("")} fill={C.noir} />
        <path d="M38.1 21.6V44.6M42.7 21.6V44.6M47.3 21.6V44.6M51.9 21.6V44.6M33.5 26.2H56.5M33.5 30.8H56.5M33.5 35.4H56.5M33.5 40H56.5" fill="none" stroke={C.noir} strokeWidth="0.45" />
        <rect x="33.5" y="21.6" width="23" height="23" fill="none" stroke={C.noir} strokeWidth="0.8" />
      </g>
      {/* Le crayon : gomme, virole, corps, bois taillé, mine */}
      <g transform="translate(13 50.5) rotate(-24)">
        <rect x="-6.2" y="-0.6" width="39" height="3.4" rx="1.2" fill={C.nuit} fillOpacity="0.35" />
        <rect x="-7" y="-1.7" width="4" height="3.4" rx="1.1" fill={C.rose} />
        <rect x="-3.6" y="-1.7" width="3.6" height="3.4" fill={METAL.argent} />
        <rect x="0" y="-1.7" width="27" height="3.4" fill={C.mimosa} />
        <rect x="0" y="0.4" width="27" height="1.3" fill={C.mimosaFonce} />
        <path d="M27 -1.7L33 0L27 1.7Z" fill={C.sable} />
        <path d="M31 -0.55L33 0L31 0.55Z" fill={C.noir} />
      </g>
      {/* La tasse sur sa soucoupe, vue de dessus */}
      <circle cx="81.2" cy="29.4" r="12" fill={C.nuit} fillOpacity="0.35" />
      <circle cx="80" cy="28" r="12" fill={C.ecume} />
      <g transform="rotate(30 80 28)">
        <rect x="86.4" y="27.3" width="7.4" height="3.4" rx="1.7" fill={C.brume} />
        <rect x="85.6" y="26.3" width="7.4" height="3.4" rx="1.7" fill={C.blanc} />
      </g>
      <circle cx="80.8" cy="28.9" r="7.4" fill={C.brume} />
      <circle cx="80" cy="28" r="7.4" fill={C.blanc} />
      <circle cx="80" cy="28" r="5.8" fill={C.boisFonce} />
      <path d="M76.4 26.4Q77.4 23.8 80.4 23.4" fill="none" stroke={C.bois} strokeWidth="1.1" strokeLinecap="round" />
    </Svg>
  );
};

/** Le Rouge et le Noir : la roulette vue de trois quarts, cases rouges et noires, moyeu d'or, bille blanche. */
const rougeEtNoir: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    <ellipse cx="51" cy="56" rx="42" ry="2.6" fill={C.nuit} fillOpacity="0.18" />
    {/* La cuvette : son flanc, son bord, la piste de la bille et ses losanges */}
    <ellipse cx="50" cy="34.5" rx="46" ry="21" fill={shade(C.boisFonce, -0.4)} />
    <ellipse cx="50" cy="30.5" rx="46" ry="21" fill={C.boisFonce} />
    <ellipse cx="50" cy="31" rx="41" ry="18" fill={C.bois} />
    <path d="M48.2 47.5L50 46.6L51.8 47.5L50 48.4ZM13.9 38.2L15.7 37.3L17.5 38.2L15.7 39.1ZM82.5 38.2L84.3 37.3L86.1 38.2L84.3 39.1ZM13.9 24.4L15.7 23.5L17.5 24.4L15.7 25.3ZM82.5 24.4L84.3 23.5L86.1 24.4L84.3 25.3Z" fill={METAL.or} />
    {/* La couronne des cases : rouge, noir, et le zéro vert au fond */}
    <ellipse cx="50" cy="31.6" rx="34.5" ry="14.6" fill={C.cerise} />
    <path d={parts(50, 31.6, 34.5, 14.6, 18, (i) => i % 2 === 1)} fill={C.noir} />
    <path d={parts(50, 31.6, 34.5, 14.6, 18, (i) => i === 0)} fill={C.persienne} />
    <path d={rais(50, 31.6, 21, 8.8, 34.5, 14.6, 18, -100)} fill="none" stroke={METAL.or} strokeWidth="0.5" />
    <ellipse cx="50" cy="31.6" rx="34.5" ry="14.6" fill="none" stroke={METAL.or} strokeWidth="0.9" />
    {/* Le cône de bois */}
    <ellipse cx="50" cy="31.4" rx="21" ry="8.8" fill={C.kraft} />
    <path d="M50 40.2A21 8.8 0 0 0 71 31.4Q62 37 43 39.6Q46.4 40.2 50 40.2Z" fill={C.bois} />
    <ellipse cx="50" cy="31.4" rx="21" ry="8.8" fill="none" stroke={METAL.or} strokeWidth="0.9" />
    {/* Le moyeu d'or : pied, fût, croisillon, bouton */}
    <ellipse cx="50" cy="31.4" rx="7" ry="3" fill={METAL.or} />
    <path d="M45.8 31Q48.6 27 48.4 19H51.6Q51.4 27 54.2 31Z" fill={METAL.or} />
    <rect x="39.5" y="22.3" width="21" height="1.9" rx="0.95" fill={METAL.or} />
    <circle cx="39.5" cy="23.2" r="2.1" fill={METAL.or} />
    <circle cx="60.5" cy="23.2" r="2.1" fill={METAL.or} />
    <circle cx="50" cy="16.5" r="3.4" fill={METAL.or} />
    <circle cx="48.9" cy="15.4" r="1" fill={C.ivoire} />
    {/* La bille */}
    <circle cx="33.1" cy="41.4" r="2.7" fill={C.nuit} fillOpacity="0.5" />
    <circle cx="32.3" cy="40.5" r="2.7" fill={C.blanc} />
  </Svg>
);

/** La Bonne Aventure : la boule de cristal sur son pied de laiton, trois arcanes en éventail. */
const bonneAventure: Art = (props) => {
  const dos = C.prune;
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      <ellipse cx="50" cy="56.6" rx="24" ry="2.2" fill={C.nuit} fillOpacity="0.18" />
      {/* Les arcanes : le soleil, l'étoile, la lune */}
      <g transform="rotate(-33 50 61)">
        <rect x="41.9" y="4.1" width="18" height="29" rx="2.2" fill={C.nuit} fillOpacity="0.18" />
        <rect x="41" y="3" width="18" height="29" rx="2.2" fill={dos} />
        <rect x="42.8" y="4.8" width="14.4" height="25.4" rx="1" fill="none" stroke={C.mimosa} strokeWidth="0.7" />
        <circle cx="50" cy="13.5" r="3" fill={C.mimosa} />
        <path d={rais(50, 13.5, 4.4, 4.4, 6.2, 6.2, 8, 0)} fill="none" stroke={C.mimosa} strokeWidth="1" strokeLinecap="round" />
      </g>
      <g>
        <rect x="41.9" y="4.1" width="18" height="29" rx="2.2" fill={C.nuit} fillOpacity="0.18" />
        <rect x="41" y="3" width="18" height="29" rx="2.2" fill={dos} />
        <rect x="42.8" y="4.8" width="14.4" height="25.4" rx="1" fill="none" stroke={C.mimosa} strokeWidth="0.7" />
        <path d={eclat(50, 8.6, 2.8)} fill={C.mimosa} />
      </g>
      <g transform="rotate(33 50 61)">
        <rect x="41.9" y="4.1" width="18" height="29" rx="2.2" fill={C.nuit} fillOpacity="0.18" />
        <rect x="41" y="3" width="18" height="29" rx="2.2" fill={dos} />
        <rect x="42.8" y="4.8" width="14.4" height="25.4" rx="1" fill="none" stroke={C.mimosa} strokeWidth="0.7" />
        <path d="M51.2 9.06A4.6 4.6 0 1 0 51.2 17.94A5 5 0 0 1 51.2 9.06Z" fill={C.ivoire} />
      </g>
      {/* Le pied de laiton */}
      <path d="M41 49.5H59L63 54.8Q63.6 56.2 62 56.2H38Q36.4 56.2 37 54.8Z" fill={METAL.laiton} />
      {/* La boule : son ombre, sa lueur, les étoiles qui s'y allument, le reflet */}
      <circle cx="50" cy="27" r="16.5" fill={C.azur} />
      <path d={croissant(50, 27, 16.5)} fill={C.marine} fillOpacity="0.55" />
      <circle cx="47" cy="24" r="10" fill={C.ciel} fillOpacity="0.45" />
      <path d={eclat(46.5, 22, 6.2)} fill={C.ivoire} />
      <path d={eclat(56.8, 19.6, 2.4)} fill={C.ivoire} />
      <path d={eclat(54, 32.6, 3)} fill={C.ivoire} />
      <path d={ronds([41.6, 31.6, 0.8], [59.6, 27, 0.7], [47.4, 36.8, 0.7])} fill={C.ivoire} />
      <path d="M36.4 23Q38.2 16 44.6 12.8" fill="none" stroke={C.blanc} strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" />
      {/* Le collier du pied, devant la boule */}
      <path d="M37.4 44.6Q36.8 42.4 38.8 43.3Q50 48.8 61.2 43.3Q63.2 42.4 62.6 44.6L60.8 49.5H39.2Z" fill={METAL.laiton} />
      <path d="M39.2 48.3H60.8L60.4 49.8H39.6Z" fill={shade(C.mimosaFonce, -0.35)} />
      {/* Étincelles */}
      <path d={eclat(9, 47, 3.2)} fill={C.mimosa} />
      <path d={eclat(91, 47, 3.2)} fill={C.mimosa} />
      <path d={eclat(20, 53.4, 1.8)} fill={C.lilas} />
      <path d={eclat(80, 53.4, 1.8)} fill={C.lilas} />
    </Svg>
  );
};

/** Une moustache en guidon, centrée en (50, 28), large de 80. */
const MOUSTACHE =
  "M50 26C53 20.5 62 19 68 24.5C72.5 28.5 80 31 83.5 26C85.5 23 85 19.5 83 17C88 18 91 22.5 90 27.5C88.5 34.5 80 38.5 72 38.5C62 38.5 54 36.5 50 32C46 36.5 38 38.5 28 38.5C20 38.5 11.5 34.5 10 27.5C9 22.5 12 18 17 17C15 19.5 14.5 23 16.5 26C20 31 27.5 28.5 32 24.5C38 19 47 20.5 50 26Z";

/** Le Pari de Sir Auguste : la montgolfière bordeaux et or, frappée de la moustache, entre la montre et le globe. */
const pariAuguste: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    <ellipse cx="17.5" cy="56.6" rx="9.5" ry="1.5" fill={C.nuit} fillOpacity="0.18" />
    <ellipse cx="82" cy="56.8" rx="11.5" ry="1.5" fill={C.nuit} fillOpacity="0.18" />
    {/* La montre de gousset : chaîne, bélière, boîtier d'or, cadran, aiguilles */}
    <path d="M15 31.4Q5 32 5.6 43.5Q6 51 9.4 55.6" fill="none" stroke={C.mimosaFonce} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 2.3" />
    <circle cx="17.5" cy="31.4" r="2.5" fill="none" stroke={METAL.or} strokeWidth="1.3" />
    <rect x="16" y="33.4" width="3" height="3.6" fill={METAL.or} />
    <circle cx="18.4" cy="47" r="9.2" fill={C.mimosaFonce} />
    <circle cx="17.5" cy="46" r="9.2" fill={METAL.or} />
    <circle cx="17.5" cy="46" r="7" fill={C.ivoire} />
    <path d={rais(17.5, 46, 5.3, 5.3, 6.2, 6.2, 12, 0)} fill="none" stroke={C.nuit} strokeWidth="0.6" />
    <path d="M17.5 46V41.2M17.5 46L21 47.8" fill="none" stroke={C.nuit} strokeWidth="1.1" strokeLinecap="round" />
    <circle cx="17.5" cy="46" r="1" fill={C.bordeaux} />
    {/* La montgolfière : enveloppe, fuseaux d'or, ombre, moustache, encolure */}
    <path d={fuseau(50, 3, -1, 1)} fill={C.bordeaux} />
    <path d={fuseau(50, 3, -0.8, -0.44) + fuseau(50, 3, 0.44, 0.8)} fill={METAL.or} />
    <path d={fuseau(50, 3, 0.8, 1)} fill={shade(C.bordeaux, -0.35)} />
    <path d={MOUSTACHE} transform="translate(50 20.5) scale(0.165) translate(-50 -28)" fill={METAL.or} />
    <rect x="44" y="40" width="12" height="2.6" rx="1.1" fill={shade(C.bordeaux, -0.35)} />
    {/* Les suspentes et la nacelle d'osier */}
    <path d="M45.5 42.6L46.6 47M54.5 42.6L53.4 47M50 42.6V47" fill="none" stroke={C.boisFonce} strokeWidth="0.7" />
    <rect x="45.6" y="47" width="8.8" height="6.8" rx="1.3" fill={C.bois} />
    <path d="M51.6 47H53.1Q54.4 47 54.4 48.3V52.5Q54.4 53.8 53.1 53.8H51.6Z" fill={C.boisFonce} />
    <rect x="44.8" y="46.2" width="10.4" height="2" rx="1" fill={C.kraft} />
    {/* Le globe terrestre : socle, méridien de laiton, mers et continents */}
    <path d="M73.5 56.6Q73.5 52.4 82 52.4Q90.5 52.4 90.5 56.6Z" fill={METAL.laiton} />
    <rect x="80.9" y="46.4" width="2.2" height="6.6" fill={METAL.laiton} />
    <g transform="rotate(18 82 33.5)">
      <path d="M82 19.7A13.8 13.8 0 0 1 82 47.3" fill="none" stroke={METAL.laiton} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="82" cy="20.1" r="1.5" fill={METAL.laiton} />
    </g>
    <circle cx="82" cy="33.5" r="11.5" fill={C.mer} />
    <path d="M71 21.5Q74.5 19.6 77.5 22Q81 22.6 81.6 26Q80 28.6 77.6 28.4Q79.6 32 77.4 35.6Q75.4 38.6 73.4 36Q71.6 33 72.6 29.6Q69 28.6 69.2 25Q69.4 22.6 71 21.5ZM63.6 27Q66.4 26 67 29.4Q66.6 33 65 35.6Q62.8 34 62.4 31Q62.2 28.4 63.6 27ZM80.6 34.6Q83 34 83.4 36.4Q82 38.6 80.2 37.6Q79.6 35.6 80.6 34.6Z" transform="translate(82 33.5) scale(0.92) translate(-73 -31)" fill={C.sable} />
    <path d={croissant(82, 33.5, 11.5)} fill={C.nuit} fillOpacity="0.25" />
  </Svg>
);

/** Cocktails du Commodore : un verre à pied, son ombrelle de papier et sa cerise, le shaker chromé. */
const cocktails: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    <ellipse cx="51" cy="56.4" rx="40" ry="2.4" fill={C.nuit} fillOpacity="0.18" />
    {/* Le verre : coupe, pied, cocktail en deux tons */}
    <path d="M18 13H58L39.3 36.5H36.7Z" fill={C.brume} fillOpacity="0.65" />
    <rect x="37" y="36" width="2" height="17" fill={shade(C.brume, -0.1)} />
    <path d="M27.5 55.4Q38 49.8 48.5 55.4Z" fill={shade(C.brume, -0.1)} />
    <path d="M23 17H53L46.65 25H29.35Z" fill={C.mimosa} />
    <path d="M29.35 25H46.65L38.6 34.8H37.4Z" fill={C.corail} />
    <path d="M24.8 19.6L33.2 30.2" fill="none" stroke={C.blanc} strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" />
    <rect x="18" y="12.4" width="40" height="1.4" rx="0.7" fill={shade(C.brume, -0.22)} />
    {/* L'ombrelle de papier */}
    <path d="M41 30L28.5 9" fill="none" stroke={C.kraft} strokeWidth="1.1" strokeLinecap="round" />
    <g transform="translate(28.5 9) rotate(-31)">
      <path d="M-13 3Q-11.5 -6 0 -6.5Q11.5 -6 13 3Q8.7 0.6 4.4 3Q0 0.6 -4.4 3Q-8.7 0.6 -13 3Z" fill={C.bougainvillier} />
      <path d="M0 -6.5Q-4.8 -3 -4.4 3Q0 0.6 4.4 3Q4.8 -3 0 -6.5Z" fill={C.bougClair} />
      <circle cx="0" cy="-6.8" r="1.1" fill={C.bougFonce} />
    </g>
    {/* La cerise */}
    <path d="M50.8 10.2Q51.5 5.5 56 4" fill="none" stroke={C.feuille} strokeWidth="1" strokeLinecap="round" />
    <circle cx="50.5" cy="13.5" r="3.7" fill={C.cerise} />
    <circle cx="49.3" cy="12.3" r="1" fill={C.ceriseClair} />
    {/* Le shaker : timbale, épaule, bouchon */}
    <path d="M66.5 27H87.5L85.4 54Q85.2 55.6 83.6 55.6H70.4Q68.8 55.6 68.6 54Z" fill={METAL.chrome} />
    <path d="M67.5 27Q67.2 18 73.4 16H80.6Q86.8 18 86.5 27Z" fill={METAL.argent} />
    <rect x="72.4" y="7.4" width="9.2" height="8.8" rx="1.8" fill={METAL.chrome} />
    <path d="M84 27H87.5L85.4 54Q85.2 55.6 83.6 55.6H82Z" fill={C.ardoise} fillOpacity="0.3" />
    <path d="M66.9 27H87.1M73 16.1H81" fill="none" stroke={C.ardoise} strokeWidth="0.7" />
    <rect x="70.6" y="30" width="1.7" height="21" rx="0.85" fill={C.blanc} fillOpacity="0.85" />
  </Svg>
);

/** Un fanal de bord : anneau, chapeau, verre de couleur et sa flamme, pied de laiton. Centré sur x. */
function fanal(x: number, verre: string, clair: string) {
  return (
    <g transform={`translate(${x} 0)`}>
      <circle cx="0" cy="33" r="16" fill={clair} fillOpacity="0.3" />
      <circle cx="0" cy="8.6" r="3" fill="none" stroke={METAL.laiton} strokeWidth="1.5" />
      <rect x="-3" y="11.5" width="6" height="4" fill={METAL.laiton} />
      <path d="M-10.5 21.5Q-9 15 0 15Q9 15 10.5 21.5Z" fill={METAL.laiton} />
      <path d="M-9.5 21H9.5Q12 33 9.5 45H-9.5Q-12 33 -9.5 21Z" fill={verre} />
      <path d="M4.5 21H9.5Q12 33 9.5 45H4.5Q7 33 4.5 21Z" fill={shade(verre, -0.25)} />
      <path d="M0 26Q4.6 33 0 40.5Q-4.6 33 0 26Z" fill={clair} />
      <rect x="-11" y="44.6" width="22" height="4" rx="1" fill={METAL.laiton} />
      <path d="M-8 48.6H8L9.5 53.6Q9.8 54.6 8.8 54.6H-8.8Q-9.8 54.6 -9.5 53.6Z" fill={METAL.laiton} />
    </g>
  );
}

/** Bâbord, Tribord : le fanal rouge de bâbord, le fanal vert de tribord, et la barre entre les deux. */
const babordTribord: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    <ellipse cx="50" cy="56" rx="46" ry="2.4" fill={C.nuit} fillOpacity="0.18" />
    {/* La barre à roue : poignées, rais, jante, moyeu */}
    <path d={rais(50, 35.5, 13.5, 13.5, 18.4, 18.4, 8, 22.5)} fill="none" stroke={C.boisFonce} strokeWidth="2.8" strokeLinecap="round" />
    <path d={rais(50, 35.5, 2, 2, 13.5, 13.5, 8, 22.5)} fill="none" stroke={C.bois} strokeWidth="2" />
    <circle cx="50.7" cy="36.3" r="11.5" fill="none" stroke={C.boisFonce} strokeWidth="3.4" />
    <circle cx="50" cy="35.5" r="11.5" fill="none" stroke={C.bois} strokeWidth="3.4" />
    <circle cx="50" cy="35.5" r="4.4" fill={METAL.laiton} />
    <circle cx="50" cy="35.5" r="1.5" fill={C.boisFonce} />
    {/* Les deux fanaux */}
    {fanal(18, C.cerise, C.ceriseClair)}
    {fanal(82, C.persienne, C.persClair)}
  </Svg>
);

/** Pêche au Gros : un espadon jaillit de la vague, la ligne tendue vers le scion de la canne. */
const pecheAuGros: Art = (props) => {
  const dos = C.marine;
  const nageoire = shade(C.marine, -0.3);
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* La mer du fond */}
      <path d="M2 45Q8 42 14 45Q20 48 26 45Q32 42 38 45Q44 48 50 45Q56 42 62 45Q68 48 74 45Q80 42 86 45Q92 48 98 45V51Q98 57 92 57H8Q2 57 2 51Z" fill={C.azur} />
      {/* La canne et la ligne tendue */}
      <path d="M92.6 56Q93.4 43 88.2 33.6L89.2 33Q95.4 43 94.8 56Z" fill={C.boisFonce} />
      <path d="M75.2 18.6L88.7 33.3" fill="none" stroke={C.nuit} strokeWidth="0.7" strokeLinecap="round" />
      <circle cx="88.7" cy="33.3" r="1.3" fill={C.mimosaFonce} />
      {/* L'espadon : nageoires, dos, ventre d'argent, rostre, œil, leurre */}
      <g transform="translate(31 40) rotate(-30)">
        <path d="M2.5 0Q-3 -8.5 -10.5 -11.5Q-6 -4 -6 0Q-6 4 -10.5 11.5Q-3 8.5 2.5 0ZM24 -8Q25 -17.5 35 -20Q32.5 -13 38 -6.6ZM33 4.4Q31.5 10.5 25 12.6Q28.5 8 28.6 5ZM9 -5.6L6.5 -8.8L11.5 -6.6ZM9 4.2L6.5 7.6L11.8 5.2Z" fill={nageoire} />
        <path d="M0 -1.2Q9 -8.5 25 -8Q38 -7.5 45.5 -2.6L66 0.4L46.5 1.4L48.6 3.2L44 4Q36 7 24 6Q10 5 0 1.2Z" fill={dos} />
        <path d="M0 1.2Q10 5 24 6Q36 7 44 4L46.5 1.4Q36 2.6 24 1.6Q10 0.6 0 0Z" fill={METAL.argent} />
        <circle cx="42" cy="-2" r="1.7" fill={C.ivoire} />
        <circle cx="42.3" cy="-2" r="0.9" fill={C.nuit} />
        <circle cx="49" cy="3.6" r="1.5" fill={C.cerise} />
      </g>
      {/* La gerbe d'eau, les gouttes */}
      <path d="M13 52V46Q14 38 18.5 41.5Q19.5 33.5 24.5 39Q27.5 31.5 31 38.5Q35.6 34 36.4 41Q41 38.6 41.6 46V52Z" fill={C.azur} />
      <path d={ronds([11, 35.5, 1.3], [21.5, 29.5, 1.1], [47, 41.4, 1.1], [7.5, 41, 0.9], [15.5, 27, 0.8])} fill={C.azur} />
      <path d={ronds([20, 43.6, 1.2], [27.5, 41.4, 1.4], [34, 43.8, 1.1])} fill={C.blanc} />
      {/* La mer au premier plan, l'écume */}
      <path d="M2 51Q8 48.5 14 51Q20 53.5 26 51Q32 48.5 38 51Q44 53.5 50 51Q56 48.5 62 51Q68 53.5 74 51Q80 48.5 86 51Q92 53.5 98 51Q98 57 92 57H8Q2 57 2 51Z" fill={C.mer} />
      <path d="M52 47Q55 45.2 58 47M70 48.6Q73 46.8 76 48.6M8 48.4Q10.5 46.8 13 48.4" fill="none" stroke={C.blanc} strokeWidth="0.9" strokeLinecap="round" />
    </Svg>
  );
};

/** Sésame : la porte ronde du coffre s'entrouvre sur une lumière d'or, trois lettres attendent le mot. */
const sesame: Art = (props) => {
  const acier = C.ardoise;
  const boulons: [number, number, number][] = Array.from({ length: 8 }, (_, i) => {
    const a = ((22.5 + i * 45) * Math.PI) / 180;
    return [r2(63 + 16.4 * Math.cos(a)), r2(29.5 + 18.2 * Math.sin(a)), 0.9];
  });
  const poignees: [number, number, number][] = Array.from({ length: 5 }, (_, i) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    return [r2(63 + 10.6 * Math.cos(a)), r2(29.5 + 11.8 * Math.sin(a)), 1.4];
  });
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Le mur d'acier, son ombre, ses rivets */}
      <rect x="30.2" y="4.4" width="64" height="53" rx="6" fill={shade(acier, -0.4)} />
      <rect x="29" y="3" width="64" height="53" rx="6" fill={acier} />
      <path d={ronds([34, 8, 1.1], [88, 8, 1.1], [34, 51, 1.1], [88, 51, 1.1])} fill={C.grisClair} />
      {/* L'embrasure et la lumière d'or */}
      <circle cx="57" cy="29.5" r="23" fill={C.grisFonce} />
      <circle cx="57" cy="29.5" r="20.5" fill={METAL.or} />
      {/* Les rayons qui s'échappent */}
      <path d="M38 22L5 9V17.5ZM37 29.5L3 25.5V33Z" fill={C.mimosa} />
      {/* Les gonds, la tranche de la porte, la porte */}
      <path d="M79.5 17h7v5.4h-7zM79.5 36.6h7v5.4h-7z" fill={C.grisFonce} />
      <ellipse cx="60.5" cy="29.5" rx="18.5" ry="20.5" fill={shade(C.gris, -0.3)} />
      <ellipse cx="63" cy="29.5" rx="18.5" ry="20.5" fill={METAL.argent} />
      <ellipse cx="63" cy="29.5" rx="14.2" ry="15.8" fill="none" stroke={C.gris} strokeWidth="0.8" />
      <path d={ronds(...boulons)} fill={acier} />
      {/* Le volant de laiton */}
      <path d={rais(63, 29.5, 0, 0, 8.6, 9.6, 5, -90)} fill="none" stroke={METAL.laiton} strokeWidth="1.6" />
      <ellipse cx="63" cy="29.5" rx="8.6" ry="9.6" fill="none" stroke={METAL.laiton} strokeWidth="1.8" />
      <path d={ronds(...poignees)} fill={METAL.laiton} />
      <circle cx="63" cy="29.5" r="2.9" fill={METAL.laiton} />
      <circle cx="63" cy="29.5" r="1" fill={C.boisFonce} />
      {/* Les trois lettres : M, O, T */}
      <g transform="translate(9 47.6) rotate(-9)">
        <rect x="-4" y="-3.9" width="9.6" height="9.6" rx="1.6" fill={C.nuit} fillOpacity="0.25" />
        <rect x="-4.8" y="-4.8" width="9.6" height="9.6" rx="1.6" fill={C.paille} />
        <path d="M-2.6 2.8V-2.8L0 0.8L2.6 -2.8V2.8" fill="none" stroke={C.nuit} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(20 48.6) rotate(5)">
        <rect x="-4" y="-3.9" width="9.6" height="9.6" rx="1.6" fill={C.nuit} fillOpacity="0.25" />
        <rect x="-4.8" y="-4.8" width="9.6" height="9.6" rx="1.6" fill={C.paille} />
        <ellipse cx="0" cy="0" rx="2.5" ry="2.9" fill="none" stroke={C.nuit} strokeWidth="1.5" />
      </g>
      <g transform="translate(31 47.2) rotate(-5)">
        <rect x="-4" y="-3.9" width="9.6" height="9.6" rx="1.6" fill={C.nuit} fillOpacity="0.25" />
        <rect x="-4.8" y="-4.8" width="9.6" height="9.6" rx="1.6" fill={C.paille} />
        <path d="M-2.7 -2.8H2.7M0 -2.8V2.8" fill="none" stroke={C.nuit} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </Svg>
  );
};

/** Les tracés de la clé du coffre : l'anneau (à remplir en evenodd), puis la tige et son panneton. */
const CLE_ANNEAU = "M77.5 30a7 7 0 1 0 14 0a7 7 0 1 0 -14 0ZM81 30a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0Z";
const CLE_TIGE = "M82 36.8h5v2.2h-5zM83 39h3v15.4h-3zM86 45.4h6v2.8h-2.6v1.7h2.6v3.6h-6z";

/** Compte Numéroté : un coffre de la banque privée, sa plaque de laiton, et la clé au bout de son ruban. */
const compteNumerote: Art = (props) => {
  const email = C.persFonce;
  const sombre = shade(C.persFonce, -0.45);
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Le casier : ombre, cadre, porte émaillée */}
      <rect x="7.2" y="7.4" width="64" height="48" rx="4.5" fill={C.nuit} fillOpacity="0.2" />
      <rect x="6" y="6" width="64" height="48" rx="4.5" fill={sombre} />
      <rect x="9.6" y="9.6" width="56.8" height="40.8" rx="2.6" fill={email} />
      <path d="M9.6 46.4H66.4V47.8Q66.4 50.4 63.8 50.4H12.2Q9.6 50.4 9.6 47.8Z" fill={shade(email, -0.22)} />
      <rect x="12" y="11.2" width="52" height="1.1" rx="0.55" fill={C.persienne} />
      {/* Les charnières */}
      <path d="M7.4 14.5h5v6h-5zM7.4 37.5h5v6h-5z" fill={METAL.laiton} />
      {/* La plaque du numéro : quatre chiffres, à peine des barres */}
      <rect x="23" y="16" width="30" height="13" rx="2" fill={sombre} />
      <rect x="22" y="15" width="30" height="13" rx="2" fill={METAL.laiton} />
      <path d="M28.2 18h2.6v7h-2.6zM33.4 18h2.6v3h-2.6zM33.4 22h2.6v3h-2.6zM38.6 18h2.6v7h-2.6zM43.8 18h2.6v7h-2.6z" fill={C.boisFonce} />
      <path d={ronds([24.6, 21.5, 0.8], [49.4, 21.5, 0.8])} fill={C.boisFonce} />
      {/* Les deux serrures */}
      <path d={ronds([25.3, 39.3, 4.4], [50.3, 39.3, 4.4])} fill={sombre} />
      <circle cx="24.5" cy="38.5" r="4.4" fill={METAL.laiton} />
      <circle cx="49.5" cy="38.5" r="4.4" fill={METAL.laiton} />
      <path d="M23.2 37.6a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM23.8 38L23.3 41.2H25.7L25.2 38ZM48.2 37.6a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM48.8 38L48.3 41.2H50.7L50.2 38Z" fill={C.nuit} />
      {/* Le ruban */}
      <path d="M83.6 24Q73.5 13 79.5 7Q85.5 3 90.2 8.8" fill="none" stroke={C.cerise} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M90.2 8.8Q93.5 13.8 85.4 24" fill="none" stroke={shade(C.cerise, -0.25)} strokeWidth="2.8" strokeLinecap="round" />
      {/* La clé d'or et son ombre */}
      <g transform="translate(0.9 1.1)" fill={C.nuit} fillOpacity="0.2">
        <path d={CLE_ANNEAU} fillRule="evenodd" />
        <path d={CLE_TIGE} />
      </g>
      <path d={CLE_TIGE} fill={METAL.or} />
      <path d={CLE_ANNEAU} fillRule="evenodd" fill={METAL.or} />
    </Svg>
  );
};

/** Intérêts Composés : des piles de pièces d'or de plus en plus hautes, et la flèche qui grimpe. */
const interetsComposes: Art = (props) => {
  const piles: [number, number][] = [[15.5, 2], [35.5, 4], [55.5, 7], [75.5, 10]];
  const jeu = [0, 0.7, -0.5, 0.4, -0.7, 0.3, 0.6, -0.4, 0.2, -0.6];
  const vert = C.persienne;
  const vertOmbre = shade(C.persienne, -0.35);
  const fleche = "M7 40.5Q38 38 58 24Q72 14 83.5 10";
  const pointe = "M92 7.1L84.6 14.9L81.4 5.5Z";
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      <ellipse cx="46" cy="56.2" rx="42" ry="2.4" fill={C.nuit} fillOpacity="0.18" />
      {/* Les piles de pièces, chacune avec son ombre */}
      {piles.map(([x, n], p) => (
        <g key={x}>
          <rect x={x - 6.4} y={r2(55.6 - n * 3.3)} width="15" height={r2(n * 3.3)} rx="1.75" fill={C.mimosaFonce} />
          {Array.from({ length: n }, (_, k) => (
            <rect key={k} x={r2(x - 7.5 + (k === 0 ? 0 : (jeu[(k + p * 3) % jeu.length] ?? 0)))} y={r2(51.5 - k * 3.3)} width="15" height="3.5" rx="1.75" fill={METAL.or} />
          ))}
        </g>
      ))}
      {/* La flèche qui grimpe, son ombre */}
      <g transform="translate(0.9 1.2)">
        <path d={fleche} fill="none" stroke={vertOmbre} strokeWidth="3.6" strokeLinecap="round" />
        <path d={pointe} fill={vertOmbre} stroke={vertOmbre} strokeWidth="1.2" strokeLinejoin="round" />
      </g>
      <path d={fleche} fill="none" stroke={vert} strokeWidth="3.6" strokeLinecap="round" />
      <path d={pointe} fill={vert} stroke={vert} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Éclats d'or */}
      <path d={eclat(24, 19, 4.4)} fill={METAL.or} />
      <path d={eclat(40, 9.5, 2.6)} fill={METAL.or} />
      <path d={eclat(93.5, 30, 2.8)} fill={METAL.or} />
    </Svg>
  );
};

/** Éclipse Totale : la Lune noire devant le Soleil, la couronne, et le diamant de l'anneau. */
const eclipseTotale: Art = (props) => {
  const ciel = shade(C.marine, -0.55);
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Le ciel assombri et ses étoiles */}
      <rect x="2" y="3" width="96" height="54" rx="9" fill={ciel} />
      <path d={ronds([12, 12, 0.9], [22, 47, 0.8], [9, 34, 0.7], [30, 9.5, 0.7], [84, 11, 0.9], [91, 39, 0.8], [76, 50, 0.8], [16, 23, 0.6], [88, 25, 0.6])} fill={C.lilas} />
      {/* La couronne : halo, rayons d'or, lumière nacrée */}
      <circle cx="50" cy="30" r="21.5" fill={C.lilas} fillOpacity="0.22" />
      <path
        d={rayons(50, 30, 12, 8, [
          [0, 39], [180, 39], [20, 27], [-20, 27], [160, 27], [200, 27], [42, 23.5], [-42, 23.5], [138, 23.5], [222, 23.5],
          [66, 21], [-66, 21], [114, 21], [246, 21], [90, 24.5], [270, 24.5],
        ])}
        fill={METAL.or}
      />
      <circle cx="50" cy="30" r="16.6" fill={C.ivoire} />
      <circle cx="50" cy="30" r="15" fill={METAL.or} />
      {/* La Lune et ses cratères */}
      <circle cx="50" cy="30" r="13.6" fill={shade(C.noir, -0.45)} />
      <path d={ronds([45.5, 26, 2.6], [53.5, 35, 3.4], [55, 24.6, 1.6])} fill={C.ardoise} fillOpacity="0.3" />
      {/* Le diamant de l'anneau */}
      <circle cx="59.6" cy="19.4" r="2.2" fill={C.blanc} />
      <path d={eclat(59.6, 19.4, 6.6)} fill={C.blanc} />
    </Svg>
  );
};

/** L'Alignement des Planètes : trois planètes sur une même ligne, la plus proche en grand, une à anneau. */
const alignement: Art = (props) => {
  const ciel = shade(C.marine, -0.55);
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Le ciel, long galet de nuit */}
      <rect x="2" y="3" width="96" height="54" rx="20" fill={ciel} />
      {/* L'axe de l'alignement */}
      <path d="M8 45.25L92 10.25" fill="none" stroke={C.lilas} strokeOpacity="0.8" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="1.6 2.6" />
      {/* Les étoiles */}
      <path d={eclat(41, 12, 3.8)} fill={C.mimosa} />
      <path d={eclat(84, 41, 3.2)} fill={C.mimosa} />
      <path d={eclat(64, 47.5, 2.2)} fill={C.mimosa} />
      <path d={ronds([27, 10, 0.9], [57, 8, 0.7], [69, 13, 0.7], [91, 30, 0.9], [47, 49, 0.8], [76, 33, 0.7], [52, 40, 0.6], [16, 18, 0.7])} fill={C.lilas} />
      {/* La grande planète, ses bandes de nuages */}
      <circle cx="23" cy="39" r="15" fill={C.corail} />
      <g transform="rotate(-18 23 39)" fill={C.rose}>
        <path d="M9.25 33Q23 35.5 36.75 33A15 15 0 0 1 37.87 37Q23 39.5 8.13 37A15 15 0 0 1 9.25 33Z" />
        <path d="M8.54 43Q23 45.5 37.46 43A15 15 0 0 1 36.52 45.5Q23 48 9.48 45.5A15 15 0 0 1 8.54 43Z" />
      </g>
      <path d={croissant(23, 39, 15)} fill={C.prune} fillOpacity="0.35" />
      {/* La planète à anneau */}
      <g transform="translate(56.6 25) rotate(-22)">
        <path d="M-16 0A16 4.8 0 0 1 16 0" fill="none" stroke={C.mimosaFonce} strokeWidth="2.2" />
      </g>
      <circle cx="56.6" cy="25" r="9.5" fill={C.azur} />
      <path d={croissant(56.6, 25, 9.5)} fill={C.marine} fillOpacity="0.5" />
      <g transform="translate(56.6 25) rotate(-22)">
        <path d="M-16 0A16 4.8 0 0 0 16 0" fill="none" stroke={C.mimosa} strokeWidth="2.2" />
      </g>
      {/* La petite planète */}
      <circle cx="83" cy="14" r="5.5" fill={C.persClair} />
      <path d={croissant(83, 14, 5.5)} fill={C.persFonce} fillOpacity="0.6" />
    </Svg>
  );
};

/** Le Gratte-Ciel : une tour Art déco perce la mer de nuages, fenêtres allumées, étoile d'or à la flèche. */
const gratteCiel: Art = (props) => {
  const fenetre = (x: number, y: number, h: number) => `M${x} ${y}h1.7v${h}h-1.7z`;
  const nuages =
    "M10 51.5Q4.5 51.5 4.5 47.5Q4.5 43.5 9.5 43.5Q10.5 39 16 39.5Q19 35.5 24.5 37.5Q29 35 32.5 39Q37 38 38.5 42Q43 40.5 45.5 44Q50 42.5 53 44.5Q56 40.5 61 42Q63.5 37.5 69.5 38.5Q74 35.5 78.5 39Q84 38 85.5 42.5Q91 41.5 93 45.5Q96.5 47 95 50Q94 51.5 91 51.5Z";
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Les étoiles */}
      <path d={ronds([14, 10, 0.9], [27, 21, 0.7], [8, 28, 0.7], [72, 8, 0.8], [88, 18, 0.9], [80, 29, 0.6], [34, 6, 0.6], [93, 32, 0.6], [66, 24, 0.6])} fill={C.ecume} />
      <path d={eclat(21, 31, 2.2)} fill={C.ecume} />
      <path d={eclat(77, 17, 2.6)} fill={C.ecume} />
      {/* La ville, tout en bas */}
      <path d="M5 57V54H11V55.4H15V53H22V55H27V54H33V57ZM67 57V54H73V55.4H77V53H84V54.6H89V55.6H95V57Z" fill={C.marine} />
      <path d={ronds([8, 55.6, 0.5], [18.5, 54.6, 0.5], [30, 55.6, 0.5], [70, 55.6, 0.5], [80.5, 54.6, 0.5], [92, 56.4, 0.4])} fill={C.mimosa} />
      {/* Les nuages du fond, derrière la tour */}
      <path d="M17 47Q15.5 41 22 40.5Q24 35.5 30.5 37Q34.5 33 40 36Q45 32.5 49.5 36Q54.5 32.5 59.5 36.5Q64 32 70 35.5Q76 34 77.5 39.5Q84 40 83 47Z" fill={shade(C.lilas, -0.28)} />
      {/* La tour : flèche, gradins, face à l'ombre */}
      <rect x="49.4" y="9" width="1.2" height="6" fill={C.ciel} />
      <path d="M36.5 57V46H39V44.4H40.5V33H42.2V31.4H43.4V25H44.6V23.6H45.6V19H47.3V16.6L50 13.8L52.7 16.6V19H54.4V23.6H55.4V25H56.6V31.4H57.8V33H59.5V44.4H61V46H63.5V57Z" fill={C.azur} />
      <path d="M51.7 15.56L52.7 16.6V19H54.4V23.6H55.4V25H56.6V31.4H57.8V33H59.5V44.4H61V46H63.5V57H55.6V33H53.6V25H52.2V19H51.7Z" fill={C.mer} />
      {/* Les fenêtres allumées */}
      <path
        d={
          fenetre(46.6, 20.2, 3.2) + fenetre(49.4, 20.2, 3.2) +
          fenetre(44.9, 26.4, 4.8) + fenetre(48.3, 26.4, 4.8) + fenetre(54.3, 26.4, 4.8) +
          fenetre(42.1, 34.6, 4.8) + fenetre(46, 34.6, 4.8) + fenetre(49.9, 34.6, 4.8) + fenetre(56.7, 34.6, 4.8) +
          fenetre(42.1, 41, 4.8) + fenetre(49.9, 41, 4.8) +
          fenetre(38.4, 53, 2.4) + fenetre(42.1, 53, 2.4) + fenetre(46, 53, 2.4) + fenetre(49.9, 53, 2.4) + fenetre(60, 53, 2.4)
        }
        fill={C.mimosa}
      />
      <path d="M50 15.3L51.2 16.9L50 18.5L48.8 16.9Z" fill={C.mimosa} />
      {/* La mer de nuages, son ombre */}
      <path d={nuages} transform="translate(1.2 1.6)" fill={C.lilas} />
      <path d={nuages} fill={C.blanc} />
      {/* L'étoile d'or */}
      <path d={eclat(50, 7.5, 5.4)} fill={METAL.or} />
      <path d={eclat(50, 7.5, 3)} transform="rotate(45 50 7.5)" fill={METAL.or} />
      <circle cx="50" cy="7.5" r="1.2" fill={C.ivoire} />
    </Svg>
  );
};

export const TICKET_VIGNETTES_2: Record<string, Art> = {
  "saute-crabe": sauteCrabe,
  "grande-maree": grandeMaree,
  "grille-du-jour": grilleDuJour,
  "rouge-et-noir": rougeEtNoir,
  "bonne-aventure": bonneAventure,
  "pari-auguste": pariAuguste,
  cocktails,
  "babord-tribord": babordTribord,
  "peche-au-gros": pecheAuGros,
  sesame,
  "compte-numerote": compteNumerote,
  "interets-composes": interetsComposes,
  "eclipse-totale": eclipseTotale,
  alignement,
  "gratte-ciel": gratteCiel,
};
