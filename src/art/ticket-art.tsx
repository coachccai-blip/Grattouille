// Vignettes des quinze tickets (BRIEF.md, section 7.10).
//
// La vignette est le petit dessin imprimé sur le ticket, à côté de sa promesse :
// la mascotte ou le décor qui lui donne sa tête. viewBox 0 0 100 60, fond
// transparent (le papier du ticket est teinté derrière). Elle se lit à 96 px de
// large comme à 40 px : une silhouette franche, peu de détails.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Un éclat à quatre branches, centré en (x, y), de rayon r. */
function eclat(x: number, y: number, r: number): string {
  const k = r * 0.22;
  const p = (dx: number, dy: number) => `${Math.round((x + dx) * 100) / 100} ${Math.round((y + dy) * 100) / 100}`;
  return `M${p(0, -r)}Q${p(k, -k)} ${p(r, 0)}Q${p(k, k)} ${p(0, r)}Q${p(-k, k)} ${p(-r, 0)}Q${p(-k, -k)} ${p(0, -r)}Z`;
}

/** Les cases noires d'un damier de `cols` × `rows` carrés de côté `s`, à partir de (x, y). */
function damier(x: number, y: number, cols: number, rows: number, s: number): string {
  let d = "";
  for (let r = 0; r < rows; r++) {
    for (let c = (r + 1) % 2; c < cols; c += 2) d += `M${x + c * s} ${y + r * s}h${s}v${s}h${-s}Z`;
  }
  return d;
}

// Les quatre enseignes en petit, centrées sur l'origine (9 de haut environ).
const PIQUE = "M0 -4.6C3.4 -1.2 4.6 0.2 4.6 1.6C4.6 3.6 1.6 4 0.5 2.4L1.5 4.6H-1.5L-0.5 2.4C-1.6 4 -4.6 3.6 -4.6 1.6C-4.6 0.2 -3.4 -1.2 0 -4.6Z";
const COEUR = "M0 4.4C-4.8 0.8 -4.8 -1.6 -4.8 -2.2C-4.8 -4.6 -1 -5 0 -2.4C1 -5 4.8 -4.6 4.8 -2.2C4.8 -1.6 4.8 0.8 0 4.4Z";
const CARREAU = "M0 -4.8L3.6 0L0 4.8L-3.6 0Z";
const TREFLE = "M-2.1 -2.4a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0ZM-4.5 0.9a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0ZM0.3 0.9a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0ZM0 0L1.5 4.6H-1.5Z";

/** Une feuille de chêne couchée, de la queue (0, 0) à la pointe (20, 0). */
const CHENE = "M0 0Q1 -3.5 4.5 -3Q5 -6.5 9 -5.5Q10.5 -8 13.5 -6Q16.5 -7 17 -4Q20.5 -3.5 20 0Q20.5 3.5 17 4Q16.5 7 13.5 6Q10.5 8 9 5.5Q5 6.5 4.5 3Q1 3.5 0 0Z";

/** La Tirelire de Piou : un cochon-tirelire en faïence, une pièce qui tombe. */
const tirelire: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    <ellipse cx="50" cy="55" rx="30" ry="3" fill={C.nuit} fillOpacity="0.18" />
    {/* Pattes */}
    <rect x="30" y="42" width="9" height="12" rx="3" fill={shade(C.azur, -0.25)} />
    <rect x="58" y="42" width="9" height="12" rx="3" fill={shade(C.azur, -0.25)} />
    {/* Corps en faïence bleue */}
    <ellipse cx="48" cy="32" rx="28" ry="19" fill={C.azur} />
    <path d="M48 51Q76 51 76 32Q76 24 70 19Q72 44 34 49Q40 51 48 51Z" fill={shade(C.azur, -0.2)} />
    {/* Décor blanc de faïence */}
    <circle cx="40" cy="30" r="5" fill={C.blanc} />
    <circle cx="54" cy="38" r="3" fill={C.blanc} />
    {/* Groin, oreille, œil */}
    <rect x="70" y="26" width="12" height="13" rx="5" fill={shade(C.azur, 0.3)} />
    <circle cx="77" cy="32" r="1.6" fill={C.nuit} />
    <path d="M58 16L64 6L70 18Z" fill={shade(C.azur, -0.25)} />
    <circle cx="63" cy="25" r="2" fill={C.nuit} />
    {/* Queue en tire-bouchon */}
    <path d="M20 30Q12 28 15 22Q18 18 21 22" fill="none" stroke={shade(C.azur, -0.25)} strokeWidth="3" strokeLinecap="round" />
    {/* La fente et la pièce */}
    <rect x="40" y="13" width="16" height="3" rx="1.5" fill={C.nuit} />
    <circle cx="48" cy="6" r="6" fill={METAL.or} />
  </Svg>
);

/** Signe du Homard : un coin de ciel de nuit, la constellation du homard. */
const signeDuHomard: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    {/* Le ciel, découpé comme un galet : un bleu de nuit voisin de celui du bandeau */}
    <path d="M12 6C30 2 70 1 88 5Q94 6 95 12C98 24 98 38 95 48Q94 54 88 54C70 59 30 59 11 54Q5 53 4.5 47C1.5 36 2 22 5 12Q6 7 12 6Z" fill={shade(C.marine, -0.5)} />
    <g transform="rotate(-8 50 30)">
      {/* Le homard, en ombre rouge sur la nuit : queue, corps, pinces, pattes */}
      <g fill={C.bordeaux}>
        <path d="M25 32L14 24Q10.5 28 13 32Q10.5 36 14 40Z" />
        <path d="M23 29.5L42 26.5Q52 23.5 59 27.5L64.5 32L59 36.5Q52 40.5 42 37.5L23 34.5Z" />
        <path d="M65 20.5Q67 10.5 84 11.5L77.5 16.5L87.5 19.5Q76.5 26 65 20.5ZM65 43.5Q67 53.5 84 52.5L77.5 47.5L87.5 44.5Q76.5 38 65 43.5Z" />
        <path d="M54.5 27.5L62 18.5L68.5 18L69 21L63.5 21.5L57 29.5ZM54.5 36.5L62 45.5L68.5 46L69 43L63.5 42.5L57 34.5Z" />
      </g>
      <path d="M44 26.5L42.5 21.5M48.5 25.5L48 20.5M53 25.6L53.5 20.8M44 37.5L42.5 42.5M48.5 38.5L48 43.5M53 38.4L53.5 43.2" fill="none" stroke={C.bordeaux} strokeWidth="1.2" strokeLinecap="round" />
      {/* Les traits de la constellation */}
      <path d="M13 24L24 32L13 40M24 32H62M62 32L63 20L77 16M62 32L63 44L77 48M62 32L90 28M62 32L90 36" fill="none" stroke={C.ecume} strokeOpacity="0.7" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Les étoiles */}
      <g fill={C.mimosa}>
        <path d={eclat(50, 32, 5.5)} />
        <path d={eclat(77, 16, 3.8)} />
        <path d={eclat(77, 48, 3.8)} />
        <circle cx="13" cy="24" r="1.5" />
        <circle cx="13" cy="40" r="1.5" />
        <circle cx="24" cy="32" r="2" />
        <circle cx="37" cy="32" r="1.6" />
        <circle cx="62" cy="32" r="2" />
        <circle cx="63" cy="20" r="1.6" />
        <circle cx="63" cy="44" r="1.6" />
        <circle cx="90" cy="28" r="1.1" />
        <circle cx="90" cy="36" r="1.1" />
      </g>
    </g>
    {/* Poussière d'étoiles */}
    <g fill={C.ecume}>
      <circle cx="16" cy="13" r="0.9" />
      <circle cx="31" cy="9" r="0.7" />
      <circle cx="47" cy="12" r="0.8" />
      <circle cx="91" cy="43" r="0.8" />
      <circle cx="40" cy="50" r="0.8" />
      <circle cx="57" cy="52" r="0.7" />
      <circle cx="24" cy="48" r="0.7" />
    </g>
  </Svg>
);

/** Tic-Tac-Truffe : un cochon truffier en veston de tweed et casquette, le groin sur sa truffe. */
const ticTacTruffe: Art = (props) => {
  const peau = C.rose;
  const peauOmbre = shade(peau, -0.14);
  const peauFonce = shade(peau, -0.28);
  const tweed = C.bois;
  const tweedOmbre = shade(tweed, -0.2);
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      <ellipse cx="50" cy="55.5" rx="42" ry="2.8" fill={C.nuit} fillOpacity="0.18" />
      {/* Feuilles de chêne */}
      <path d={CHENE} transform="translate(5 17) rotate(-32)" fill={C.olive} />
      <path d="M2.5 18.6L19.4 8" fill="none" stroke={shade(C.olive, -0.3)} strokeWidth="0.9" strokeLinecap="round" />
      <path d={CHENE} transform="translate(97 5) rotate(140) scale(0.85)" fill={C.kraft} />
      <path d="M99 3.3L86 14.3" fill="none" stroke={tweed} strokeWidth="0.9" strokeLinecap="round" />
      {/* La truffe dans sa motte */}
      <path d="M87 50Q86 45.4 90.4 44.6Q95 43.4 97 47.4Q98.8 52 95 54.6H89Q86.6 53 87 50Z" fill={C.noir} />
      <path d="M93.6 45.6l1.1 1.1l-1.1 1.1l-1.1 -1.1zM95.2 49.6l1.2 1.2l-1.2 1.2l-1.2 -1.2zM91.4 50.4l0.9 0.9l-0.9 0.9l-0.9 -0.9z" fill={C.grisFonce} />
      <path d="M83 55.8Q86.5 51.8 90.5 53.4Q94.5 51.4 99 55.8Z" fill={C.boisFonce} />
      {/* Pattes du fond */}
      <rect x="31" y="42" width="7" height="12.5" rx="3" fill={peauFonce} />
      <rect x="59" y="46" width="6.4" height="8.5" rx="3" fill={peauFonce} />
      <rect x="58.5" y="36" width="7.4" height="12.4" rx="3" fill={C.boisFonce} />
      {/* Queue en tire-bouchon, corps, pattes */}
      <path d="M19 31Q11 30 13 24Q15.5 20 19 23.5" fill="none" stroke={peauFonce} strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="42" cy="33" rx="24" ry="14" fill={peau} />
      <rect x="24" y="40" width="8.5" height="14.5" rx="3.5" fill={peauOmbre} />
      <rect x="52" y="44" width="8" height="10.5" rx="3.5" fill={peauOmbre} />
      {/* Le veston : dos et basque, ombre de l'ourlet, col de chemise */}
      <path d="M60.5 21.5Q44 13.5 28 22Q23 27 23.5 38.5L27.5 40.6Q43 43.4 58 42Q63.5 41 65 34.5Q66 26 60.5 21.5Z" fill={tweed} />
      <path d="M23.5 38.5L27.5 40.6Q43 43.4 58 42Q63.5 41 65 34.5Q61.5 38.6 55 39.4Q41 40.6 23.6 35.4Z" fill={tweedOmbre} />
      <path d="M33.4 42L35 35.6L37.4 42.6Z" fill={peau} />
      <path d="M59.4 20.8Q65.8 25.6 65.2 34L62.6 35.4Q63.4 27 57.6 21.6Z" fill={C.creme} />
      {/* Chevrons du tweed, poche et pochette */}
      <path d="M35 24L37 22L39 24M44 21.5L46 19.5L48 21.5M40 30L42 28L44 30M46 36L48 34L50 36M49 27L51 25L53 27" fill="none" stroke={C.boisFonce} strokeOpacity="0.7" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29.6 32.4L32.2 29.2L34.8 32.4Z" fill={C.creme} />
      <rect x="28.2" y="32.2" width="8.2" height="1.9" rx="0.9" fill={C.boisFonce} />
      {/* La manche : coudière, poignet de chemise */}
      <rect x="50.5" y="30.5" width="11" height="16.6" rx="4" fill={tweedOmbre} />
      <ellipse cx="56" cy="38" rx="2.8" ry="3.6" fill={C.kraft} />
      <rect x="50.5" y="45" width="11" height="2.8" fill={C.creme} />
      {/* Tête, groin, oreille tombante, œil */}
      <circle cx="72" cy="36.5" r="11.5" fill={peau} />
      <ellipse cx="84.5" cy="43.5" rx="5.2" ry="5.8" fill={peauOmbre} />
      <ellipse cx="86.4" cy="44.6" rx="1.1" ry="1.6" fill={C.boisFonce} />
      <path d="M62 33Q61 40.5 66.5 44Q70.5 38.5 69 32Q65 30.6 62 33Z" fill={peauFonce} />
      <circle cx="78.6" cy="36.6" r="1.6" fill={C.nuit} />
      {/* La casquette */}
      <path d="M60.6 33Q60 23.5 72 23.5Q82 23.5 83.4 31.5Q72 28.5 60.6 33ZM80 29.8Q85.5 29.4 88 32.5L82.6 33.4Z" transform="rotate(10 72 36.5)" fill={C.boisFonce} />
    </Svg>
  );
};

/** Lucarne : le ballon file dans la lucarne, pelouse rayée et fanions. */
const lucarne: Art = (props) => {
  const gazon = C.vert;
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* La pelouse tondue en bandes */}
      <rect x="2" y="3" width="96" height="54" rx="7" fill={gazon} />
      <path d="M2 15H98V25H2ZM2 36H98V46H2Z" fill={shade(gazon, -0.14)} />
      {/* Le filet */}
      <path d="M6 28L35 57M18 28L47 57M30 28L59 57M42 28L71 57M54 28L78 52M66 28L78 40M2 36L23 57M2 48L11 57M14 28L2 40M26 28L2 52M38 28L9 57M50 28L21 57M62 28L33 57M74 28L45 57M78 36L57 57M78 48L69 57" fill="none" stroke={C.blanc} strokeOpacity="0.5" strokeWidth="0.7" />
      {/* Barre et poteau, leur ombre */}
      <path d="M2 24H86V57H80V30H2Z" fill={shade(gazon, -0.42)} />
      <path d="M2 22H84V57H78V28H2Z" fill={C.blanc} />
      {/* La trajectoire */}
      <path d="M12 55Q36 54 53 45" fill="none" stroke={C.blanc} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="3.4 3" />
      {/* Le ballon */}
      <circle cx="63" cy="40" r="9" fill={C.blanc} />
      <path d="M63 49A9 9 0 0 0 71.5 37A11 11 0 0 1 57 46.7A9 9 0 0 0 63 49Z" fill={C.grisClair} />
      <path d="M62.4 36.5L66.2 38.3L65.6 42.5L61.4 43.2L59.4 39.5ZM58.6 32.1A9 9 0 0 1 64.4 31.1L63 33.8L60.9 34.2ZM69.1 33.4A9 9 0 0 1 71.9 38.6L68.9 38.1L67.9 36.2ZM71.2 43.8A9 9 0 0 1 67.1 48L66.6 45L68.1 43.5ZM61.9 48.9A9 9 0 0 1 56.6 46.4L59.4 45L61.3 46ZM54.2 41.7A9 9 0 0 1 55 35.9L57.1 38.1L56.8 40.2Z" fill={C.noir} />
      {/* La guirlande de fanions */}
      <path d="M4 6Q50 13 96 6" fill="none" stroke={C.blanc} strokeWidth="0.8" />
      <path d="M10 6.9L18 7.8L14 15.4ZM54 9.5L62 9.3L58 17.4Z" fill={C.cerise} />
      <path d="M24 8.4L32 9L28 16.7ZM68 9L76 8.4L72 16.7Z" fill={C.blanc} />
      <path d="M38 9.3L46 9.5L42 17.4ZM82 7.8L90 6.9L86 15.4Z" fill={C.mimosa} />
    </Svg>
  );
};

/** Réussite : quatre cartes en éventail sur un tapis vert amande. */
const reussite: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    {/* Le tapis, son ombre, son galon */}
    <rect x="3" y="4.4" width="96" height="54" rx="20" fill={shade(C.amande, -0.28)} />
    <rect x="2" y="3" width="96" height="54" rx="20" fill={C.amande} />
    <rect x="6" y="7" width="88" height="46" rx="16" fill="none" stroke={shade(C.amande, -0.2)} strokeWidth="1" />
    {/* L'éventail : trèfle, carreau, pique, puis l'as de cœur */}
    <g transform="rotate(-33 50 75)">
      <rect x="41.2" y="14.4" width="20" height="30" rx="2.5" fill={C.nuit} fillOpacity="0.2" />
      <rect x="40" y="13" width="20" height="30" rx="2.5" fill={C.blanc} />
      <path d={TREFLE} transform="translate(45.4 19.4) scale(0.62)" fill={C.noir} />
    </g>
    <g transform="rotate(-11 50 75)">
      <rect x="41.2" y="14.4" width="20" height="30" rx="2.5" fill={C.nuit} fillOpacity="0.2" />
      <rect x="40" y="13" width="20" height="30" rx="2.5" fill={C.blanc} />
      <path d={CARREAU} transform="translate(45.4 19.4) scale(0.62)" fill={C.cerise} />
    </g>
    <g transform="rotate(11 50 75)">
      <rect x="41.2" y="14.4" width="20" height="30" rx="2.5" fill={C.nuit} fillOpacity="0.2" />
      <rect x="40" y="13" width="20" height="30" rx="2.5" fill={C.blanc} />
      <path d={PIQUE} transform="translate(45.4 19.4) scale(0.62)" fill={C.noir} />
    </g>
    <g transform="rotate(33 50 75)">
      <rect x="41.2" y="14.4" width="20" height="30" rx="2.5" fill={C.nuit} fillOpacity="0.2" />
      <rect x="40" y="13" width="20" height="30" rx="2.5" fill={C.blanc} />
      <path d={COEUR} transform="translate(45.4 19.4) scale(0.62)" fill={C.cerise} />
      <path d={COEUR} transform="translate(50 28.6) scale(1.25)" fill={C.cerise} />
      <path d={COEUR} transform="translate(54.6 36.6) scale(-0.62)" fill={C.cerise} />
    </g>
  </Svg>
);

/** Bas de Laine : une chaussette tricotée rouge et crème, pleine à déborder de pièces d'or. */
const basDeLaine: Art = (props) => {
  const laine = C.cerise;
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      <ellipse cx="52" cy="56.6" rx="44" ry="2.6" fill={C.nuit} fillOpacity="0.18" />
      {/* Les pièces qui dépassent du revers */}
      <circle cx="41" cy="8" r="5" fill={METAL.or} />
      <circle cx="35.4" cy="12" r="5" fill={C.mimosaFonce} />
      <circle cx="34.5" cy="11" r="5" fill={METAL.or} />
      <circle cx="47.9" cy="12" r="5" fill={C.mimosaFonce} />
      <circle cx="47" cy="11" r="5" fill={METAL.or} />
      {/* La chaussette */}
      <path d="M30 16H52V34Q52 38 57 39L72 41Q82 43 82 49Q82 56 74 56H42Q30 56 30 45Z" fill={laine} />
      {/* Rayures, talon et pointe crème */}
      <path d="M30 25H52V28H30ZM30 31.5H52V34.5H30ZM56.5 38.9L60 39.4V56H56.5Z" fill={C.creme} />
      <path d="M30 42V45Q30 56 42 56H45Q37 51 36.5 42Z" fill={C.creme} />
      <path d="M72 41Q82 43 82 49Q82 56 74 56H70.5Q66.5 48 72 41Z" fill={C.creme} />
      {/* L'ombre du tricot */}
      <path d="M48 20H52V34Q52 38 57 39L72 41Q82 43 82 49Q82 56 74 56H42Q33 56 30.6 49Q34 53 42 53H74Q79 53 79 49Q79 45.5 72 44L56 42Q48 41 48 34Z" fill={C.prune} fillOpacity="0.3" />
      {/* Le revers à côtes */}
      <rect x="28" y="12" width="26" height="8.5" rx="2.5" fill={shade(laine, -0.22)} />
      <path d="M32.2 13.8V18.8M36.6 13.8V18.8M41 13.8V18.8M45.4 13.8V18.8M49.8 13.8V18.8" fill="none" stroke={C.creme} strokeWidth="1.3" strokeLinecap="round" />
      {/* Les pièces tombées */}
      <g fill={C.mimosaFonce}>
        <circle cx="62.9" cy="17" r="4.6" />
        <ellipse cx="70.8" cy="29" rx="4.6" ry="3" transform="rotate(28 70.8 29)" />
        <circle cx="15.9" cy="48" r="5.2" />
      </g>
      <g fill={METAL.or}>
        <circle cx="62" cy="16" r="4.6" />
        <ellipse cx="70" cy="28" rx="4.6" ry="3" transform="rotate(28 70 28)" />
        <circle cx="15" cy="47" r="5.2" />
        <rect x="5" y="52.4" width="13" height="3.6" rx="1.8" />
        <rect x="85" y="52.4" width="12" height="3.6" rx="1.8" />
        <rect x="86" y="48.8" width="12" height="3.6" rx="1.8" />
        <rect x="85" y="45.2" width="12" height="3.6" rx="1.8" />
      </g>
    </Svg>
  );
};

/** Le 21 d'Hector : le héron croupier distribue sur le feutre vert, soleil couchant sur la jetée. */
const vingtEtUn: Art = (props) => {
  const plumage = C.gris;
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Le soleil couchant */}
      <circle cx="40" cy="28" r="25" fill={C.corail} />
      {/* Plumage gris, aile posée, aile qui distribue */}
      <path d="M19 46Q19 30 35 28Q51 30 51 46Z" fill={plumage} />
      <path d="M43 33Q54 30.5 63 34.5L66.5 37.5L62 38L64 41L59 40L46 44Z" fill={shade(plumage, -0.25)} />
      <path d="M19 46Q16.5 37 24.5 32L27.5 46Z" fill={shade(plumage, -0.25)} />
      {/* Gilet noir, chemise blanche */}
      <path d="M25 46L27.5 30.5H42.5L45 46Z" fill={C.noir} />
      <path d="M30.5 30H39.5L35 39.5Z" fill={C.blanc} />
      {/* Long cou blanc */}
      <path d="M31.6 31Q26.6 22 31.4 16Q34.4 12.4 34.4 9L40 10Q40 14.4 36.6 18.4Q32.6 23 38.4 31Z" fill={C.blanc} />
      {/* Nœud papillon */}
      <path d="M35 31.5L29.6 28.4V34.6ZM35 31.5L40.4 28.4V34.6Z" fill={C.persFonce} />
      <circle cx="35" cy="31.5" r="1.5" fill={C.persienne} />
      {/* Tête, bandeau noir, œil */}
      <ellipse cx="38.5" cy="10.6" rx="6.3" ry="5.7" fill={C.blanc} />
      <path d="M42.4 8.6Q36 5.4 31 8Q26.4 10.6 23 16.4Q29 13 33 11Q37.6 9.6 42.4 10.8Z" fill={C.noir} />
      <circle cx="41.3" cy="12" r="1.05" fill={C.nuit} />
      {/* Long bec en poignard */}
      <path d="M44.2 9.3L63 13.7L44.2 15Z" fill={C.mimosa} />
      <path d="M44.2 12.6L63 13.7L44.2 15Z" fill={shade(C.mimosa, -0.2)} />
      {/* Visière verte */}
      <path d="M32.3 8.2Q38.5 2.2 44.6 8L44.8 9.8Q38.5 4.6 32.2 10Z" fill={C.persFonce} />
      <path d="M43 5.8Q50.5 6.4 55.5 10.8L44.4 10.2Z" fill={C.persienne} />
      {/* La carte qui part, dos vert */}
      <g transform="rotate(20 70 33)">
        <rect x="65.5" y="27" width="9.5" height="13" rx="1.4" fill={C.blanc} />
        <rect x="66.7" y="28.2" width="7.1" height="10.6" rx="0.8" fill={C.persFonce} />
      </g>
      {/* La table : lisière de laiton, feutre */}
      <path d="M2 58V49Q2 43 9 43H91Q98 43 98 49V58Z" fill={METAL.laiton} />
      <path d="M4.5 58V50Q4.5 45.5 10 45.5H90Q95.5 45.5 95.5 50V58Z" fill={C.persienne} />
      <path d="M24 58Q50 46.5 76 58" fill="none" stroke={C.persClair} strokeWidth="0.9" />
      {/* Deux cartes servies */}
      <g transform="rotate(-9 64 52)">
        <rect x="59.8" y="48.2" width="10" height="8" rx="1.2" fill={C.persFonce} />
        <rect x="59" y="47.4" width="10" height="8" rx="1.2" fill={C.blanc} />
        <path d={PIQUE} transform="translate(64 51.5) scale(0.6)" fill={C.noir} />
      </g>
      <g transform="rotate(7 79 52)">
        <rect x="74.8" y="48.2" width="10" height="8" rx="1.2" fill={C.persFonce} />
        <rect x="74" y="47.4" width="10" height="8" rx="1.2" fill={C.blanc} />
        <path d={COEUR} transform="translate(79 51.6) scale(0.6)" fill={C.corail} />
      </g>
      {/* Une pile de jetons */}
      <ellipse cx="16" cy="54.2" rx="5" ry="1.9" fill={C.mimosa} />
      <ellipse cx="16" cy="52.2" rx="5" ry="1.9" fill={C.blanc} />
      <ellipse cx="16" cy="50.2" rx="5" ry="1.9" fill={C.mimosa} />
    </Svg>
  );
};

/** Bandit Manchot : un manchot masqué, l'aileron sur le levier de la machine à sous. */
const banditManchot: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    <ellipse cx="50" cy="56.4" rx="44" ry="2.6" fill={C.nuit} fillOpacity="0.18" />
    {/* La machine : socle, caisse, fronton chromé */}
    <rect x="8" y="50" width="40" height="5.5" rx="2" fill={shade(C.cerise, -0.4)} />
    <path d="M17 12Q17 5 28 5Q39 5 39 12Z" fill={METAL.chrome} />
    <rect x="10" y="11" width="36" height="41" rx="5" fill={C.cerise} />
    <path d="M41 11Q46 11 46 16V47Q46 52 41 52Z" fill={shade(C.cerise, -0.25)} />
    <circle cx="28" cy="8.6" r="2" fill={C.mimosa} />
    {/* Les rouleaux : trois sept */}
    <rect x="13" y="17.5" width="30" height="16" rx="2.5" fill={METAL.chrome} />
    <path d="M15 20h7.6v11h-7.6zM24.2 20h7.6v11h-7.6zM33.4 20h7.6v11h-7.6z" fill={C.blanc} />
    <path d="M16.7 22.6H21L18.3 28.6M25.9 22.6H30.2L27.5 28.6M35.1 22.6H39.4L36.7 28.6" fill="none" stroke={C.cerise} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    {/* Le bac à pièces */}
    <rect x="22" y="36.4" width="12" height="2.6" rx="1.3" fill={C.mimosa} />
    <rect x="16" y="41.5" width="24" height="7" rx="2.5" fill={METAL.chrome} />
    <rect x="19" y="43.5" width="18" height="3" rx="1.5" fill={C.noir} />
    {/* Le levier */}
    <circle cx="48" cy="37" r="3.6" fill={METAL.chrome} />
    <path d="M48 37L58 15" fill="none" stroke={METAL.chrome} strokeWidth="2.6" strokeLinecap="round" />
    {/* Le manchot : pattes, corps, ventre */}
    <ellipse cx="72.5" cy="55" rx="4.6" ry="2" fill={C.mimosa} />
    <ellipse cx="84" cy="55" rx="4.6" ry="2" fill={C.mimosa} />
    <path d="M64 40Q64 22 78 22Q92 22 92 40Q92 55 78 55Q64 55 64 40Z" fill={C.noir} />
    <path d="M68 42Q68 30 78.5 30Q89 30 89 42Q89 53 78.5 53Q68 53 68 42Z" fill={C.blanc} />
    {/* Les ailerons : l'un pend, l'autre tient le levier */}
    <path d="M89.5 29.5Q96.5 36 95.5 46L92 44.5Q92 37 87.5 33Z" fill={C.noir} />
    <path d="M70 28.5Q63 24 60.5 16.5L56 18Q59 28 67.5 33.5Z" fill={C.noir} />
    <circle cx="58" cy="14" r="4.6" fill={C.cerise} />
    <circle cx="56.4" cy="12.4" r="1.4" fill={C.ceriseClair} />
    {/* Tête, face blanche, loup de bandit et ses rubans */}
    <circle cx="78" cy="19" r="10.5" fill={C.noir} />
    <path d="M70.5 20Q70.5 13 78.5 14.5Q86.5 13 86.5 20Q86.5 27 78.5 27Q70.5 27 70.5 20Z" fill={C.blanc} />
    <path d="M87.5 18L95.5 14.5L94 18.4L96.5 21.5L87.5 20.5Z" fill={shade(C.cerise, -0.25)} />
    <path d="M68.5 19Q73 14.5 78.5 17Q84 14.5 88.5 19Q84 23.5 78.5 21Q73 23.5 68.5 19Z" fill={C.cerise} />
    <circle cx="74.6" cy="19" r="1.4" fill={C.blanc} />
    <circle cx="82.4" cy="19" r="1.4" fill={C.blanc} />
    <path d="M75.6 22.4H81.4L78.5 27.4Z" fill={C.mimosa} />
  </Svg>
);

/** Mille-Pattes : un mille-pattes en canotier, un soulier verni à chaque patte. */
const millePattes: Art = (props) => {
  const clair = C.vert;
  const fonce = shade(C.vert, -0.2);
  const soulier = "M-2.4 -1.2Q-2.8 1.6 -2.4 2.6H5Q5.8 0.9 2.6 0.3Q1 0 0.9 -1.2Z";
  // Les pieds : un sur deux est levé, le mille-pattes marche au pas.
  const pieds: [number, number][] = [[13, 49.6], [25.5, 46.8], [37, 49.6], [49.5, 46.8], [61, 49.6], [73.5, 46.8]];
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      <ellipse cx="48" cy="54.4" rx="42" ry="2.2" fill={C.nuit} fillOpacity="0.18" />
      {/* Les pattes */}
      <path d="M13 38V48.6M24.5 34L25.5 45.8M36 32L37 48.6M47.5 33L49.5 45.8M59 36L61 48.6M70.5 34L73.5 45.8" fill="none" stroke={C.feuille} strokeWidth="1.8" strokeLinecap="round" />
      {/* Les souliers vernis et leur reflet */}
      {pieds.map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(1.25)`}>
          <path d={soulier} fill={C.noir} />
          <ellipse cx="3" cy="1.3" rx="1.1" ry="0.5" fill={C.blanc} />
        </g>
      ))}
      {/* Les anneaux, de la queue à la tête */}
      <circle cx="13" cy="35" r="6.2" fill={fonce} />
      <circle cx="24.5" cy="31" r="7.2" fill={clair} />
      <circle cx="36" cy="28.5" r="7.6" fill={fonce} />
      <circle cx="47.5" cy="29.5" r="7.6" fill={clair} />
      <circle cx="59" cy="32.5" r="7.6" fill={fonce} />
      <circle cx="70.5" cy="31" r="7.6" fill={clair} />
      {/* Les antennes */}
      <path d="M76 20Q73 12 68 11.5M90 18Q92 10 96 9.5" fill="none" stroke={C.feuille} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="68" cy="11.5" r="1.6" fill={C.feuille} />
      <circle cx="96" cy="9.5" r="1.6" fill={C.feuille} />
      {/* La tête et ses deux yeux */}
      <circle cx="82.5" cy="26.5" r="9.5" fill={fonce} />
      <circle cx="82" cy="27" r="1.4" fill={C.nuit} />
      <circle cx="88" cy="27" r="1.4" fill={C.nuit} />
      {/* Le canotier */}
      <g transform="rotate(-12 82.5 17)">
        <rect x="77" y="10.6" width="11" height="6.4" rx="1" fill={C.paille} />
        <rect x="77" y="13.8" width="11" height="2.8" fill={C.cerise} />
        <rect x="72.5" y="16.2" width="20" height="2.6" rx="1.3" fill={shade(C.paille, -0.12)} />
      </g>
    </Svg>
  );
};

/** La Pie Voleuse : une pie en collier de perles, un rubis au bec. */
const pieVoleuse: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    <ellipse cx="46" cy="56.4" rx="30" ry="2.4" fill={C.nuit} fillOpacity="0.18" />
    {/* Éclats de couleur */}
    <path d={eclat(15, 13, 5.5)} fill={C.mimosa} />
    <path d={eclat(31, 7, 3)} fill={C.azur} />
    <path d={eclat(93, 38, 3.4)} fill={C.mimosa} />
    <path d={eclat(84, 49, 2.4)} fill={C.cerise} />
    {/* La longue queue et son reflet bleu */}
    <path d="M39 31L7 46Q4 50 8.5 52L41 40Z" fill={C.noir} />
    <path d="M36 35.5L10.5 47.6Q9.6 49.4 11.6 49.8L37 39Z" fill={C.azur} />
    {/* Pattes */}
    <path d="M45 44L43.5 55.6M53 43.5L54 55.6M40.5 55.8H47.5M51 55.8H58" fill="none" stroke={C.noir} strokeWidth="1.4" strokeLinecap="round" />
    {/* Corps, ventre blanc, poitrail */}
    <ellipse cx="48" cy="32" rx="19" ry="12" transform="rotate(-15 48 32)" fill={C.noir} />
    <path d="M33.5 38.5Q40 47 52 45Q61 43.4 64.5 36Q52 42 33.5 38.5Z" fill={C.blanc} />
    <path d="M37.4 42.4Q43.6 47 52 45Q61 43.4 64.5 36Q58.5 43 48.6 43.6Q42 44 37.4 42.4Z" fill={C.brume} />
    <ellipse cx="65" cy="29" rx="9.5" ry="9" fill={C.noir} />
    {/* Tache blanche de l'épaule, reflet de l'aile */}
    <path d="M43 26Q51 21.5 58 26Q51.5 31.5 43 30Z" fill={C.blanc} />
    <path d="M33 33.5Q41 29.5 49 31L46 35Q39.5 35 34.5 37Z" fill={C.azur} />
    {/* Le rubis, la tête, le bec, l'œil */}
    <path d="M86 20L88 17.5H93L95 20L90.5 26Z" fill={C.cerise} />
    <path d="M86 20L88 17.5H93L95 20Z" fill={C.ceriseClair} />
    <circle cx="68" cy="18" r="8.5" fill={C.noir} />
    <path d="M75 14.5L88.5 18.6L75.5 22Z" fill={C.noir} />
    <circle cx="71" cy="16" r="1.5" fill={C.blanc} />
    {/* Le collier de perles */}
    <g fill={C.blanc}>
      <circle cx="60" cy="22.4" r="1.7" />
      <circle cx="59" cy="26.8" r="1.7" />
      <circle cx="60.6" cy="31" r="1.7" />
      <circle cx="64.4" cy="33.6" r="1.7" />
      <circle cx="68.8" cy="33.2" r="1.7" />
      <circle cx="71.8" cy="30" r="1.7" />
      <circle cx="72.6" cy="25.8" r="1.7" />
    </g>
  </Svg>
);

/** Caviar & Champagne : une cloche d'argent, une coupe et ses bulles, noir et or. */
const caviarChampagne: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    {/* Le cartouche noir à pans coupés, son filet d'or */}
    <path d="M10 3H90L98 11V49L90 57H10L2 49V11Z" fill={C.noir} />
    <path d="M11.5 6.5H88.5L94.5 12.5V47.5L88.5 53.5H11.5L5.5 47.5V12.5Z" fill="none" stroke={METAL.or} strokeWidth="0.9" />
    {/* La cloche : plateau, dôme, ombre, reflet, bouton */}
    <rect x="9" y="45" width="50" height="4" rx="2" fill={METAL.argent} />
    <path d="M13 45A21 21 0 0 1 55 45Z" fill={METAL.argent} />
    <path d="M55 45A21 21 0 0 0 43 26Q50.5 34 49.5 45Z" fill={C.gris} fillOpacity="0.6" />
    <path d="M19.6 40.6Q18.2 31 29 27.2Q22.6 32 22.2 40.6Q20.9 41.6 19.6 40.6Z" fill={C.blanc} fillOpacity="0.85" />
    <rect x="32.6" y="20.5" width="2.8" height="4.5" fill={METAL.argent} />
    <circle cx="34" cy="18.5" r="3.3" fill={METAL.argent} />
    <path d={eclat(21, 16, 3.4)} fill={C.blanc} />
    {/* La coupe de champagne */}
    <path d="M66 24H92Q92 34 79 35Q66 34 66 24Z" fill={C.ecume} fillOpacity="0.35" />
    <path d="M67.3 26.8H90.7Q89.4 33.4 79 34Q68.6 33.4 67.3 26.8Z" fill={METAL.or} />
    <rect x="78" y="34.5" width="2" height="12" fill={C.ecume} fillOpacity="0.75" />
    <path d="M72 49Q79 44.5 86 49Z" fill={C.ecume} fillOpacity="0.75" />
    <path d="M66 24H92" fill="none" stroke={C.blanc} strokeWidth="1" strokeLinecap="round" />
    {/* Les bulles */}
    <g fill={C.mimosa}>
      <circle cx="74" cy="19" r="1.6" />
      <circle cx="82" cy="16" r="2.2" />
      <circle cx="86.5" cy="20.4" r="1.2" />
      <circle cx="77.5" cy="11.5" r="1.4" />
      <circle cx="85" cy="9.6" r="1.8" />
      <circle cx="90" cy="14" r="1.1" />
    </g>
  </Svg>
);

/** Grand Prix de la Corniche : un bolide bleu course, la route en lacets au-dessus de la mer. */
const grandPrix: Art = (props) => {
  const caisse = C.azur;
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* La mer, une voile au loin, le cap et sa route en lacets */}
      <path d="M2 10Q2 4 8 4H92Q98 4 98 10V33H2Z" fill={C.mer} />
      <path d="M18 23L22.6 14.6V23ZM13.6 24.2H24.4L23 26.2H15.2Z" fill={C.blanc} />
      <path d="M30 17H36M39 25H44M6 28.5H11" fill="none" stroke={C.blanc} strokeOpacity="0.7" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M48 33Q59 11 79 6Q90 3.6 98 10V33Z" fill={C.sable} />
      <path d="M97 29.4Q77 28 83.6 22.4Q90 17.6 76.6 15.6Q69 14.4 78.6 8.6" fill="none" stroke={C.blanc} strokeWidth="2" strokeLinecap="round" />
      {/* Le parapet, la chaussée, le damier */}
      <rect x="2" y="31.5" width="96" height="11.5" fill={shade(C.sable, -0.18)} />
      <rect x="2" y="31.5" width="96" height="2.2" fill={shade(C.sable, 0.4)} />
      <rect x="2" y="42" width="96" height="9" fill={C.ardoise} />
      <rect x="2" y="50" width="96" height="8" fill={C.blanc} />
      <path d={damier(2, 50, 24, 2, 4)} fill={C.noir} />
      <ellipse cx="51" cy="49.4" rx="38" ry="1.5" fill={C.nuit} fillOpacity="0.3" />
      {/* Le pilote : écharpe au vent, casque, lunettes, saute-vent */}
      <path d="M45 30.6Q39 26.6 32 28.6L33 30.6Q39 29.5 44 33Z" fill={C.blanc} />
      <circle cx="47.5" cy="29.4" r="3.9" fill={C.noir} />
      <ellipse cx="49.8" cy="29.2" rx="1.7" ry="1.2" fill={C.blanc} />
      <path d="M55 33.6L57.2 29.8L58.4 30.3L57.4 33.6Z" fill={C.blanc} />
      {/* Le bolide : caisse, ombre, échappement, ouïes, calandre, rond du numéro */}
      <path d="M13 41.5Q22 37 32 34Q39 31 42.5 31.5L43.5 33.6H55L56.5 32.5H66Q80 33 85 37.5Q87.5 40.5 86.5 44.5H21Q15 44.5 13 41.5Z" fill={caisse} />
      <path d="M86.5 44.5H21Q15 44.5 13 41.5Q30 42.5 50 42H86.9Q87 43.4 86.5 44.5Z" fill={shade(caisse, -0.28)} />
      <rect x="20" y="39.4" width="34" height="1.5" rx="0.75" fill={METAL.argent} />
      <path d="M60 35.4V39.4M63 35.4V39.4M66 35.4V39.4" fill="none" stroke={shade(caisse, -0.3)} strokeWidth="0.8" strokeLinecap="round" />
      <path d="M82.6 35.8Q86.4 38.2 86.6 43.5H83Z" fill={METAL.argent} />
      <circle cx="41.5" cy="37.4" r="3.3" fill={C.blanc} />
      {/* Les roues */}
      <circle cx="30" cy="43.4" r="6.6" fill={C.noir} />
      <circle cx="73" cy="43.4" r="6.6" fill={C.noir} />
      <circle cx="30" cy="43.4" r="3" fill={METAL.argent} />
      <circle cx="73" cy="43.4" r="3" fill={METAL.argent} />
    </Svg>
  );
};

/** La Régate : voiliers et bouée sous le grand pavois, bleu marine et blanc. */
const regate: Art = (props) => (
  <Svg viewBox="0 0 100 60" {...props}>
    {/* Le ciel marine et la mer, bord en vagues */}
    <path d="M2 10Q2 4 8 4H92Q98 4 98 10V52Q92 58 86 52Q80 58 74 52Q68 58 62 52Q56 58 50 52Q44 58 38 52Q32 58 26 52Q20 58 14 52Q8 58 2 52Z" fill={C.marine} />
    <path d="M2 42Q8 39 14 42Q20 45 26 42Q32 39 38 42Q44 45 50 42Q56 39 62 42Q68 45 74 42Q80 39 86 42Q92 45 98 42V52Q92 58 86 52Q80 58 74 52Q68 58 62 52Q56 58 50 52Q44 58 38 52Q32 58 26 52Q20 58 14 52Q8 58 2 52Z" fill={C.azur} />
    {/* Le grand pavois */}
    <path d="M4 6Q50 12 96 6" fill="none" stroke={C.blanc} strokeWidth="0.7" />
    <g transform="translate(18 7.6) rotate(5)">
      <rect x="-4.5" y="0" width="9" height="6.5" fill={C.mimosa} />
      <rect x="0" y="0" width="4.5" height="6.5" fill={C.azur} />
    </g>
    <g transform="translate(34 8.6) rotate(2.6)">
      <rect x="-4.5" y="0" width="9" height="6.5" fill={C.blanc} />
      <path d="M-4.5 0H0V3.25H-4.5ZM0 3.25H4.5V6.5H0Z" fill={C.cerise} />
    </g>
    <g transform="translate(50 9)">
      <rect x="-4.5" y="0" width="9" height="6.5" fill={C.mimosa} />
      <path d="M-4.5 0H4.5L-4.5 6.5Z" fill={C.cerise} />
    </g>
    <g transform="translate(66 8.6) rotate(-2.6)">
      <rect x="-4.5" y="0" width="9" height="6.5" fill={C.blanc} />
      <rect x="-2" y="1.75" width="4" height="3" fill={C.azur} />
    </g>
    <g transform="translate(82 7.6) rotate(-5)">
      <rect x="-4.5" y="0" width="9" height="6.5" fill={C.cerise} />
      <rect x="-4.5" y="0" width="4.5" height="6.5" fill={C.blanc} />
    </g>
    {/* Le voilier de tête */}
    <rect x="39.4" y="19" width="1.3" height="23" fill={C.blanc} />
    <path d="M41.6 20Q55 29 60 40H41.6Z" fill={C.blanc} />
    <path d="M38.4 22Q30 31 24 40H38.4Z" fill={C.brume} />
    <path d="M40.7 19L47 20.6L40.7 22.4Z" fill={C.mimosa} />
    <path d="M21 41.5H63Q61 48 55 48H29Q23 48 21 41.5Z" fill={C.cerise} />
    {/* Un concurrent, et un autre au loin */}
    <path d="M77 25.6Q83.6 32.2 86 39H77Z" fill={C.blanc} />
    <path d="M75.6 27.6Q72 33.4 69 39H75.6Z" fill={C.brume} />
    <path d="M66.5 40H87Q86 44.5 82.5 44.5H71Q67.5 44.5 66.5 40Z" fill={C.blanc} />
    <path d="M10 30L15 39.6H10ZM9 32L5.6 39.6H9ZM4.5 40.4H16.5L15 43H6Z" fill={C.blanc} />
    {/* La bouée */}
    <rect x="91.6" y="41.4" width="0.9" height="6" fill={C.blanc} />
    <path d="M92.5 41.4L97 42.9L92.5 44.4Z" fill={C.cerise} />
    <path d="M88 52Q88 46.6 92 46.6Q96 46.6 96 52Z" fill={C.mimosa} />
    {/* L'écume */}
    <path d="M12 49Q15 47.2 18 49M30 50Q33 48.2 36 50M58 50.5Q61 48.7 64 50.5M74 49.2Q77 47.4 80 49.2" fill="none" stroke={C.blanc} strokeWidth="0.9" strokeLinecap="round" />
  </Svg>
);

/** Moustache d'Or : une grande moustache d'or sur son coussin de velours bordeaux. */
const moustacheDor: Art = (props) => {
  const moustache =
    "M50 26C53 20.5 62 19 68 24.5C72.5 28.5 80 31 83.5 26C85.5 23 85 19.5 83 17C88 18 91 22.5 90 27.5C88.5 34.5 80 38.5 72 38.5C62 38.5 54 36.5 50 32C46 36.5 38 38.5 28 38.5C20 38.5 11.5 34.5 10 27.5C9 22.5 12 18 17 17C15 19.5 14.5 23 16.5 26C20 31 27.5 28.5 32 24.5C38 19 47 20.5 50 26Z";
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Les glands des quatre coins */}
      <path d="M8 11L1.5 8.5L4.5 4.5ZM92 11L98.5 8.5L95.5 4.5ZM92 49L98.5 51.5L95.5 55.5ZM8 49L1.5 51.5L4.5 55.5Z" fill={METAL.or} />
      {/* Le coussin et son ombre */}
      <path d="M6 9Q50 15 94 9Q89 30 94 51Q50 45 6 51Q11 30 6 9Z" fill={C.bordeaux} />
      <path d="M6 51Q50 45 94 51Q89 30 94 9Q85.5 30 89.5 46.6Q50 41.5 6 51Z" fill={shade(C.bordeaux, -0.3)} />
      {/* Losanges du velours, galon doré */}
      <path d="M20 17l2.2 3.3l-2.2 3.3l-2.2 -3.3zM35 14.6l2.2 3.3l-2.2 3.3l-2.2 -3.3zM50 15l2.2 3.3l-2.2 3.3l-2.2 -3.3zM65 14.6l2.2 3.3l-2.2 3.3l-2.2 -3.3zM80 17l2.2 3.3l-2.2 3.3l-2.2 -3.3zM20 36.4l2.2 3.3l-2.2 3.3l-2.2 -3.3zM35 39l2.2 3.3l-2.2 3.3l-2.2 -3.3zM50 38.4l2.2 3.3l-2.2 3.3l-2.2 -3.3zM65 39l2.2 3.3l-2.2 3.3l-2.2 -3.3zM80 36.4l2.2 3.3l-2.2 3.3l-2.2 -3.3z" fill={shade(C.bordeaux, 0.16)} />
      <path d="M10 12.5Q50 18 90 12.5Q86 30 90 47.5Q50 42 10 47.5Q14 30 10 12.5Z" fill="none" stroke={METAL.or} strokeWidth="0.9" />
      {/* La moustache, son ombre, ses reflets */}
      <path d={moustache} transform="translate(1.3 1.5)" fill={shade(C.bordeaux, -0.5)} />
      <path d={moustache} fill={METAL.or} />
      <path d="M54 24.4Q60 21.2 66 25.2M46 24.4Q40 21.2 34 25.2" fill="none" stroke={C.ivoire} strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M55 33.6Q66 36.4 78 33.4M45 33.6Q34 36.4 22 33.4" fill="none" stroke={C.mimosaFonce} strokeWidth="0.9" strokeLinecap="round" />
      <path d={eclat(89, 14, 3)} fill={C.ivoire} />
    </Svg>
  );
};

/** Deux feuilles de laurier en V, de la tige (0, 0) vers l'avant ; et la feuille du bout. */
const LAURIER = "M0 0Q5.1 -0.4 7 4.8Q1.5 4.9 0 0ZM0 0Q5.1 0.4 7 -4.8Q1.5 -4.9 0 0Z";
const LAURIER_BOUT = "M0 0Q4 -3 8.5 0Q4 3 0 0Z";

/** Le rameau droit de la couronne de laurier ; le gauche est son reflet. */
const rameau = (
  <g fill={METAL.or}>
    <path d="M52.1 50A30 19.5 0 0 0 70.8 16.5" fill="none" stroke={METAL.or} strokeWidth="0.8" strokeLinecap="round" />
    <path d={LAURIER} transform="translate(58.3 49.2) rotate(-11)" />
    <path d={LAURIER} transform="translate(65.5 47.2) rotate(-21)" />
    <path d={LAURIER} transform="translate(71.6 44) rotate(-34)" />
    <path d={LAURIER} transform="translate(76.2 40) rotate(-50)" />
    <path d={LAURIER} transform="translate(79.1 35.2) rotate(-69)" />
    <path d={LAURIER} transform="translate(80 30.2) rotate(-92)" />
    <path d={LAURIER} transform="translate(78.8 25.1) rotate(-114)" />
    <path d={LAURIER} transform="translate(75.7 20.5) rotate(-133)" />
    <path d={LAURIER_BOUT} transform="translate(70.8 16.5) rotate(-148)" />
  </g>
);

/** Le Grand Grattouille : un blason à la feuille d'or sur noir profond. */
const grandGrattouille: Art = (props) => {
  const noirProfond = shade(C.noir, -0.45);
  return (
    <Svg viewBox="0 0 100 60" {...props}>
      {/* Le cartouche aux coins échancrés, son filet d'or */}
      <path d="M10 3H90Q90 11 98 11V49Q90 49 90 57H10Q10 49 2 49V11Q10 11 10 3Z" fill={noirProfond} />
      <path d="M13 6.5H87Q88.5 12.5 94.5 14V46Q88.5 47.5 87 53.5H13Q11.5 47.5 5.5 46V14Q11.5 12.5 13 6.5Z" fill="none" stroke={METAL.or} strokeWidth="0.9" />
      {/* La couronne de laurier */}
      {rameau}
      <g transform="translate(100 0) scale(-1 1)">{rameau}</g>
      <path d="M50 47L53 50L50 53L47 50Z" fill={METAL.or} />
      {/* Le soleil d'or, un éclat en son cœur */}
      <path d="M48.8 22.5L50 17.5L51.2 22.5ZM52.6 22.7L54.8 20.5L54.7 23.6ZM55.9 24.4L60.3 21.7L57.6 26.1ZM58.4 27.3L61.5 27.2L59.3 29.4ZM59.5 30.8L64.5 32L59.5 33.2ZM59.3 34.6L61.5 36.8L58.4 36.7ZM57.6 37.9L60.3 42.3L55.9 39.6ZM54.7 40.4L54.8 43.5L52.6 41.3ZM51.2 41.5L50 46.5L48.8 41.5ZM47.4 41.3L45.2 43.5L45.3 40.4ZM44.1 39.6L39.7 42.3L42.4 37.9ZM41.6 36.7L38.5 36.8L40.7 34.6ZM40.5 33.2L35.5 32L40.5 30.8ZM40.7 29.4L38.5 27.2L41.6 27.3ZM42.4 26.1L39.7 21.7L44.1 24.4ZM45.3 23.6L45.2 20.5L47.4 22.7Z" fill={METAL.or} />
      <circle cx="50" cy="32" r="8.2" fill={METAL.or} />
      <path d={eclat(50, 32, 5.6)} fill={noirProfond} />
      {/* La petite couronne */}
      <path d="M43.6 15.6L42.6 8.4L47 11.6L50 7L53 11.6L57.4 8.4L56.4 15.6Z" fill={METAL.or} />
      {/* Éclats de feuille d'or */}
      <path d={eclat(10.5, 30, 2.6)} fill={METAL.or} />
      <path d={eclat(89.5, 30, 2.6)} fill={METAL.or} />
    </Svg>
  );
};

/**
 * Identifiants attendus, ceux des tickets : tirelire, signe-du-homard, tic-tac-truffe,
 * lucarne, reussite, bas-de-laine, vingt-et-un, bandit-manchot, mille-pattes,
 * pie-voleuse, caviar-champagne, grand-prix, regate, moustache-dor, grand-grattouille.
 */
export const TICKET_VIGNETTES: Record<string, Art> = {
  tirelire,
  "signe-du-homard": signeDuHomard,
  "tic-tac-truffe": ticTacTruffe,
  lucarne,
  reussite,
  "bas-de-laine": basDeLaine,
  "vingt-et-un": vingtEtUn,
  "bandit-manchot": banditManchot,
  "mille-pattes": millePattes,
  "pie-voleuse": pieVoleuse,
  "caviar-champagne": caviarChampagne,
  "grand-prix": grandPrix,
  regate,
  "moustache-dor": moustacheDor,
  "grand-grattouille": grandGrattouille,
};
