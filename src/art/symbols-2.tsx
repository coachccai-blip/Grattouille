// Symboles des nouveaux tickets, première planche : arcanes, pêche au gros, planètes, coefficients.
//
// Même contrat que symbols.tsx (à lire d'abord) : viewBox 0 0 48 48, fond transparent,
// le dessin tient dans le carré de 4 à 44 et se reconnaît à 28 px de côté.
// Clés : « famille:identifiant ».
//
// Identifiants attendus :
//   arcane:soleil, arcane:lune, arcane:etoile, arcane:roue, arcane:couronne, arcane:phare,
//   arcane:ancre, arcane:sirene,
//   peche:sardine, peche:crevette, peche:crabe, peche:daurade, peche:raie, peche:thon,
//   peche:espadon, peche:requin, peche:baleine, peche:kraken,
//   morpion:planete, morpion:asteroide,
//   coef:maree, coef:interets.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Un éclat à quatre branches, centré en (x, y), de rayon r. */
function eclat(x: number, y: number, r: number): string {
  const k = Math.round(r * 22) / 100;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}

// ---------------------------------------------------------------------------
// La Bonne Aventure : huit arcanes d'un tarot de bord de mer, sur une case ivoire

/** L'aubergine du tarot, que la palette n'a pas : l'encre sombre des huit arcanes. */
const AUBERGINE = "#4A2A5C";

/**
 * Une couronne de rayons en triangle autour de (24, 24) : `n` pointes, de la base
 * `r0` à la pointe `r1`, ouvertes de `demi` degrés de part et d'autre, tournées de `tour` degrés.
 */
function rayons(n: number, r0: number, r1: number, demi: number, tour = 0): string {
  const point = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${Math.round((24 + r * Math.sin(a)) * 10) / 10} ${Math.round((24 - r * Math.cos(a)) * 10) / 10}`;
  };
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = tour + (i * 360) / n;
    d += `M${point(r0, a - demi)}L${point(r1, a)}L${point(r0, a + demi)}Z`;
  }
  return d;
}

/** Les rayons du Soleil : huit longs, et huit courts glissés entre eux. */
const RAYONS_LONGS = rayons(8, 11.2, 20, 14);
const RAYONS_COURTS = rayons(8, 11.2, 17, 8.5, 22.5);

/** La Bonne Aventure : le Soleil, visage d'or serein, huit rayons corail derrière huit rayons d'or. */
const arcaneSoleil: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d={RAYONS_LONGS} fill={C.corail} />
    <path d={RAYONS_COURTS} fill={C.mimosa} />
    {/* Le visage, son ombre, un reflet, les deux yeux */}
    <circle cx="24" cy="24" r="11.5" fill={C.mimosa} />
    <path d="M31.07 14.93A11.5 11.5 0 1 1 14.93 31.07A11.5 11.5 0 0 0 31.07 14.93Z" fill={shade(C.mimosa, -0.2)} />
    <path d="M16.2 21.6Q16.8 17.4 20.8 15.9" fill="none" stroke={shade(C.mimosa, 0.6)} strokeWidth="2" strokeLinecap="round" />
    <circle cx="20" cy="24.6" r="1.6" fill={AUBERGINE} />
    <circle cx="28" cy="24.6" r="1.6" fill={AUBERGINE} />
  </Svg>
);

/** La Bonne Aventure : la Lune, croissant lilas et trois étoiles d'or. */
const arcaneLune: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24.47 6.76A17.5 17.5 0 1 0 37.47 31.14A14 14 0 1 1 24.47 6.76Z" fill={C.lilas} />
    <path d="M37.47 31.14A17.5 17.5 0 0 1 8.17 35.33A17.5 17.5 0 0 0 32.69 33.51A14 14 0 0 0 37.47 31.14Z" fill={shade(C.lilas, -0.28)} />
    <path d="M8.6 18.2Q11 11.6 17 8.9" fill="none" stroke={shade(C.lilas, 0.5)} strokeWidth="2.2" strokeLinecap="round" />
    <g fill={METAL.or}>
      <path d={eclat(31.5, 18, 6.5)} />
      <path d={eclat(40, 28.5, 3.6)} />
      <path d={eclat(39.5, 8.5, 3.2)} />
    </g>
  </Svg>
);

/** La Bonne Aventure : l'Étoile, rose des vents à huit branches taillée à facettes, au-dessus d'une vague. */
const arcaneEtoile: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 4L26.91 13.48L32.77 11.73L31.02 17.59L40.5 20.5L31.02 23.41L32.77 29.27L26.91 27.52L24 37L21.09 27.52L15.23 29.27L16.98 23.41L7.5 20.5L16.98 17.59L15.23 11.73L21.09 13.48Z" fill={C.mimosa} />
    {/* Les facettes au jour, puis les facettes à l'ombre */}
    <path d="M24 20.5L26.91 13.48L32.77 11.73ZM24 20.5L15.23 29.27L16.98 23.41ZM24 20.5H7.5L16.98 17.59ZM24 20.5L15.23 11.73L21.09 13.48L24 4Z" fill={shade(C.mimosa, 0.38)} />
    <path d="M24 20.5V4L26.91 13.48ZM24 20.5L32.77 11.73L31.02 17.59ZM24 20.5H40.5L31.02 23.41ZM24 20.5L32.77 29.27L26.91 27.52L24 37ZM24 20.5L21.09 27.52L15.23 29.27ZM24 20.5L16.98 23.41L7.5 20.5Z" fill={C.mimosaFonce} />
    {/* La vague */}
    <path d="M6 41Q10.5 38 15 41T24 41T33 41T42 41" fill="none" stroke={C.azur} strokeWidth="2.8" strokeLinecap="round" />
  </Svg>
);

/** Un rayon de la roue et sa poignée tournée, du moyeu (23.5, 23.5) vers le haut. */
const RAYON = "M22.3 23.5V10.2C22.3 9.2 21.5 8.6 21.5 7.2C21.5 5.4 22.3 4.2 23.5 4.2C24.7 4.2 25.5 5.4 25.5 7.2C25.5 8.6 24.7 9.2 24.7 10.2V23.5Z";

/** La roue de gouvernail d'une seule teinte : la jante, huit rayons et leurs poignées. */
function gouvernail(teinte: string) {
  return (
    <g fill={teinte}>
      <circle cx="23.5" cy="23.5" r="11.5" fill="none" stroke={teinte} strokeWidth="4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((tour) => (
        <path key={tour} d={RAYON} transform={`rotate(${tour} 23.5 23.5)`} />
      ))}
    </g>
  );
}

/** La Bonne Aventure : la Roue, une roue de gouvernail en guise de roue de la fortune, moyeu d'or. */
const arcaneRoue: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="translate(1.2 1.2)">{gouvernail(C.boisFonce)}</g>
    {gouvernail(C.bois)}
    {/* Le reflet de la jante, le moyeu et son ombre */}
    <path d="M12.2 21.5A11.5 11.5 0 0 1 14.1 16.9M16.9 14.1A11.5 11.5 0 0 1 21.5 12.2" fill="none" stroke={C.kraft} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="24.5" cy="24.5" r="5" fill={C.boisFonce} />
    <circle cx="23.5" cy="23.5" r="5" fill={METAL.or} />
    <circle cx="23.5" cy="23.5" r="1.6" fill={AUBERGINE} />
  </Svg>
);

/** La Bonne Aventure : la Couronne, cinq fleurons d'or, coiffe de velours aubergine, bandeau serti. */
const arcaneCouronne: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* La coiffe de velours */}
    <path d="M10.5 34.2Q10.5 14.7 24 14.7Q37.5 14.7 37.5 34.2Z" fill={AUBERGINE} />
    {/* Les cinq fleurons, leurs perles d'or, la pierre du sommet */}
    <path d="M8 36.7L6.5 18.7L11.5 26.7L15 14.7L20 26.7L24 10.7L28 26.7L33 14.7L36.5 26.7L41.5 18.7L40 36.7Z" fill={METAL.or} />
    <g fill={METAL.or}>
      <circle cx="6.5" cy="17.2" r="2.3" />
      <circle cx="15" cy="13.2" r="2.3" />
      <circle cx="33" cy="13.2" r="2.3" />
      <circle cx="41.5" cy="17.2" r="2.3" />
    </g>
    <circle cx="24" cy="8.6" r="3" fill={C.bougainvillier} />
    {/* Le bandeau cintré, son liseré, ses pierres */}
    <path d="M7 33.7Q24 38.2 41 33.7V39.8Q24 44.8 7 39.8Z" fill={C.mimosaFonce} />
    <path d="M7.6 34.4Q24 38.8 40.4 34.4" fill="none" stroke={C.mimosa} strokeWidth="1.1" strokeLinecap="round" />
    <path d="M24 36.6L27 39.3L24 42L21 39.3Z" fill={C.bougainvillier} />
    <circle cx="14" cy="38.6" r="1.9" fill={C.azur} />
    <circle cx="34" cy="38.6" r="1.9" fill={C.azur} />
  </Svg>
);

/** La Bonne Aventure : le Phare, tour rayée cerise et blanc, deux faisceaux d'or. */
const arcanePhare: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Les deux faisceaux */}
    <path d="M23 11.6L4 5.6V17.6ZM25 11.6L44 5.6V17.6Z" fill={C.mimosa} />
    {/* Le rocher */}
    <path d="M9.5 43.6Q11.5 38.2 24 38.2Q36.5 38.2 38.5 43.6Z" fill={AUBERGINE} />
    {/* La tour blanche, ses trois bandes cerise, son côté à l'ombre, la porte */}
    <path d="M19.6 17H28.4L31.5 40H16.5Z" fill={C.blanc} />
    <path d="M19.6 17H28.4L29.02 21.6H18.98ZM18.36 26.2H29.64L30.26 30.8H17.74ZM17.12 35.4H30.88L31.5 40H16.5Z" fill={C.cerise} />
    <path d="M25.6 17H28.4L31.5 40H27.2Z" fill={AUBERGINE} fillOpacity="0.32" />
    <path d="M22.4 40V36.8Q24 34.8 25.6 36.8V40Z" fill={AUBERGINE} />
    {/* La galerie, la lanterne, le toit */}
    <rect x="17.4" y="14.6" width="13.2" height="2.8" rx="1" fill={AUBERGINE} />
    <rect x="20.6" y="8.8" width="6.8" height="6" fill={shade(C.mimosa, 0.55)} />
    <path d="M18.8 9.4L24 4.2L29.2 9.4Z" fill={AUBERGINE} />
  </Svg>
);

/** Le cordage de l'ancre : il sort de l'organeau, passe devant le jas et s'enroule autour de la verge. */
const CORDAGE = "M27 7C36 7.6 38.6 17.4 30.5 22.6C25 26.2 18.4 24.6 17 29.6C16 33 19.6 35.6 22.6 34.4";

/** La Bonne Aventure : l'Ancre, organeau d'or, un cordage tourné autour de la verge. */
const arcaneAncre: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* L'organeau */}
    <circle cx="24" cy="9" r="3.6" fill="none" stroke={METAL.or} strokeWidth="2.6" />
    {/* La verge, le jas, les bras et leurs pattes */}
    <g fill={AUBERGINE}>
      <rect x="22" y="12.4" width="4" height="27.6" />
      <rect x="13.1" y="16.5" width="21.8" height="3.8" rx="1.9" />
      <path d="M8.2 19.5L4 29.6L6.9 28.9A17.5 17.5 0 0 0 41.1 28.9L44 29.6L39.8 19.5L32.6 28.6L36 28.8A12.5 12.5 0 0 1 12 28.8L15.4 28.6Z" />
    </g>
    <path d="M22 12.4H23.4V37.9H22ZM8.2 19.5L4 29.6L6 29.1L8.7 22.4ZM39.8 19.5L32.6 28.6L34.7 28.7L39.5 22.4Z" fill={shade(AUBERGINE, 0.28)} />
    {/* Le cordage et ses torons */}
    <path d={CORDAGE} fill="none" stroke={C.mimosa} strokeWidth="2.2" strokeLinecap="round" />
    <path d={CORDAGE} fill="none" stroke={C.mimosaFonce} strokeWidth="2.2" strokeDasharray="1 2.4" />
  </Svg>
);

/** La Bonne Aventure : la Sirène, une queue d'écailles qui sort de la vague. */
const arcaneSirene: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* La nageoire en croissant et ses rayons */}
    <path d="M26.6 17.4C21.5 16.4 13.5 14.6 9 6.8C15.5 6.4 23.5 8 28.2 13C30.6 8.4 36.2 5.4 43.6 5.6C41.8 11.8 36 16.2 30.4 18.4Z" fill={C.persClair} />
    <path d="M27.4 15.4Q20.5 13.4 13.8 9.4M29.6 15.6Q33.4 10.8 39.4 8.2" fill="none" stroke={C.persienne} strokeWidth="1" strokeLinecap="round" />
    {/* La queue, son côté à l'ombre, ses écailles */}
    <path d="M15 42.5C14 36.5 15 32 17 28.5C18.8 25 22.5 23 24.6 20.6C25.8 19.2 26.4 18.2 26.8 16.9L30.2 18.1C30 20.5 29.8 22 29 23.6C27.6 26.6 25.4 28.6 24.9 32C24.5 35 26.2 39 27 42.5Z" fill={C.persienne} />
    <path d="M28.4 17.5L30.2 18.1C30 20.5 29.8 22 29 23.6C27.6 26.6 25.4 28.6 24.9 32C24.5 35 26.2 39 27 42.5H22.6C21.6 37 21.4 31.5 23.6 27.5C25.4 24.2 27.6 21.5 28.4 17.5Z" fill={C.persFonce} />
    <path d="M16 35.2q1.5 2 3 0M19.6 35.2q1.5 2 3 0M17.4 31.6q1.5 2 3 0M21 31.6q1.5 2 3 0M19.2 28q1.5 2 3 0M22.8 28q1.4 2 2.8 0M22 24.6q1.4 1.9 2.8 0M25.2 24.4q1.2 1.8 2.4 0M25.4 21.4q1.2 1.7 2.4 0" fill="none" stroke={C.persClair} strokeWidth="1" strokeLinecap="round" />
    {/* Les gouttes d'or */}
    <g fill={METAL.or}>
      <circle cx="8" cy="16" r="1.6" />
      <circle cx="12.4" cy="21.4" r="1.1" />
      <circle cx="38.6" cy="20" r="1.5" />
    </g>
    {/* La vague et son écume */}
    <path d="M4 38.5Q7.33 34.5 10.67 38.5T17.33 38.5T24 38.5T30.67 38.5T37.33 38.5T44 38.5V42Q44 44 42 44H6Q4 44 4 42Z" fill={C.azur} />
    <path d="M4 42Q7.33 40 10.67 42T17.33 42T24 42T30.67 42T37.33 42T44 42Q44 44 42 44H6Q4 44 4 42Z" fill={C.mer} />
    <path d="M11.8 40.2Q13.2 38 15.4 38.6M25.8 38.4Q28 37.8 29.6 40" fill="none" stroke={C.blanc} strokeWidth="1.1" strokeLinecap="round" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Pêche au Gros : dix prises, de la plus petite à la plus grosse, sur une case ivoire

/** L'orangé vif du crabe, que la palette n'a pas. */
const VERMILLON = "#E8562F";
/** Le gris-violet de la raie. */
const GRIS_VIOLET = "#8F86B0";
/** Le bleu sarcelle de l'espadon. */
const SARCELLE = "#1E8A8C";
/** Le violet du kraken : celui de l'améthyste de symbols.tsx. */
const VIOLET = "#8C5FBF";

/** Pêche au Gros : la sardine, menue, dos bleu et ventre d'argent. */
const pecheSardine: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="translate(1.6 -1.6) rotate(-38 24 24)">
      {/* La queue fourchue, la dorsale, les nageoires du ventre */}
      <path d="M10.5 24L2 17.4Q5 24 2 30.6Z" fill={C.mer} />
      <path d="M21.5 19.2L27.5 14.6L29.8 18.4Z" fill={C.mer} />
      <path d="M20 29.4L22.4 33.2L26 30.2ZM31 30.4L32.8 33.2L35.6 29.8Z" fill={C.gris} />
      {/* Le corps d'argent, le dos bleu */}
      <path d="M46 24C41.5 18.4 32 16.6 23.5 18.8C17.5 20.4 12.5 22.4 9 22.8V25.2C12.5 25.6 17.5 27.8 23.5 29.4C32 31.6 41.5 29.8 46 24Z" fill={METAL.argent} />
      <path d="M46 24C41.5 18.4 32 16.6 23.5 18.8C17.5 20.4 12.5 22.4 9 22.8V24C15 23.2 22 22 28 22.2C35 22.4 41.5 23.2 46 24Z" fill={C.mer} />
      {/* L'ouïe, les points du flanc, l'œil */}
      <path d="M37.2 20.2Q35.4 24.2 37 28.4" fill="none" stroke={C.gris} strokeWidth="1" strokeLinecap="round" />
      <g fill={C.mer}>
        <circle cx="32.5" cy="25.2" r="1" />
        <circle cx="28.5" cy="25.4" r="1" />
        <circle cx="24.5" cy="25.4" r="1" />
        <circle cx="20.5" cy="25.2" r="1" />
        <circle cx="16.8" cy="24.9" r="1" />
      </g>
      <circle cx="41" cy="22.8" r="1.9" fill={C.blanc} />
      <circle cx="41.2" cy="22.8" r="1" fill={C.noir} />
    </g>
  </Svg>
);

/** Pêche au Gros : la crevette rose, enroulée, antennes au vent. */
const pecheCrevette: Art = (props) => {
  const anneau = shade(C.ceriseClair, -0.24);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <g transform="translate(-0.9 1.4)">
        {/* Les antennes, les pattes */}
        <path d="M42.5 15.2Q41.5 6.5 31 4.6M42.6 15.8Q44 20.5 42 26" fill="none" stroke={anneau} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M27.5 20.2L29.5 25.5M24.5 18L25.5 24M21 17.8L21 23.5" fill="none" stroke={anneau} strokeWidth="1.4" strokeLinecap="round" />
        {/* Le corps enroulé et l'éventail de la queue */}
        <path d="M43 15.5L35.5 12.2A17.4 17.4 0 0 0 6 25A16 16 0 0 0 23 40.8A14.5 14.5 0 0 0 33.5 35.2L40 33L36.3 31.3L39.6 27.4L35 29.5L34.6 25L30.3 31.8A9.8 9.8 0 0 1 23 34.6A9.4 9.4 0 0 1 14 25A8.6 8.6 0 0 1 23 17.2A7.5 7.5 0 0 1 28.5 20.5L37 21.5Z" fill={C.ceriseClair} />
        {/* Les anneaux, un reflet sur la tête, l'œil */}
        <path d="M20.8 16.7L18.7 9M14.9 20.3L8.8 16.8M13.3 27.6L7.6 29.1M17.1 33.4L14.2 37.5M23.3 35.4L23.5 39.7M28.3 34.3L30 37" fill="none" stroke={anneau} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M24.5 10.4Q29.5 10 33.6 12.8" fill="none" stroke={C.blanc} strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="38.2" cy="15.4" r="1.4" fill={C.noir} />
      </g>
    </Svg>
  );
};

/** Une pince de crabe ouverte, pointes en l'air, poignet en (13.5, 20.5). */
const PINCE_CRABE = "M13.5 20.5C8 21.5 4 17.5 4.2 12.5C4.4 8.5 6.5 5.5 9.2 4.4C10.2 6.8 10.4 9 10 11.4C11.3 9 13 7.4 15.4 6.6C17.6 11 17.2 16.5 13.5 20.5Z";

/** Pêche au Gros : le crabe, vu de dessus, pinces levées. */
const pecheCrabe: Art = (props) => {
  const ombre = shade(VERMILLON, -0.3);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Les pattes */}
      <path d="M12 27.5Q7.2 26.5 5.4 30.5M12 31.5Q7 32.5 5.6 37.5M14.5 35Q10.5 37.5 10 42.4M36 27.5Q40.8 26.5 42.6 30.5M36 31.5Q41 32.5 42.4 37.5M33.5 35Q37.5 37.5 38 42.4" fill="none" stroke={ombre} strokeWidth="2.2" strokeLinecap="round" />
      {/* Les bras et les pinces levées */}
      <path d="M16 25L13 19.5M32 25L35 19.5" fill="none" stroke={VERMILLON} strokeWidth="4.2" strokeLinecap="round" />
      <path d={PINCE_CRABE} fill={VERMILLON} />
      <path d={PINCE_CRABE} transform="matrix(-1 0 0 1 48 0)" fill={VERMILLON} />
      <ellipse cx="7.4" cy="12.6" rx="1.3" ry="3" transform="rotate(10 7.4 12.6)" fill={C.blanc} fillOpacity="0.5" />
      {/* Les yeux au bout de leur tige */}
      <path d="M20.5 22V17.5M27.5 22V17.5" fill="none" stroke={VERMILLON} strokeWidth="1.8" />
      <circle cx="20.5" cy="16.6" r="2" fill={C.noir} />
      <circle cx="27.5" cy="16.6" r="2" fill={C.noir} />
      {/* La carapace, son ombre, un reflet */}
      <path d="M24 20.5C31 20.5 37.5 23.5 37.5 29C37.5 35 31.5 38.5 24 38.5C16.5 38.5 10.5 35 10.5 29C10.5 23.5 17 20.5 24 20.5Z" fill={VERMILLON} />
      <path d="M36.6 25.5C37.2 26.6 37.5 27.8 37.5 29C37.5 35 31.5 38.5 24 38.5C20.5 38.5 17.3 37.7 14.8 36.3C22 38 32.5 36 36.6 25.5Z" fill={ombre} />
      <ellipse cx="17.5" cy="25.5" rx="3.4" ry="1.5" transform="rotate(-24 17.5 25.5)" fill={C.blanc} fillOpacity="0.5" />
    </Svg>
  );
};

/** Le corps de la daurade, museau à gauche : haut et rond, le front abrupt, resserré vers la queue. */
const DAURADE = "M4.5 25.5C6.5 18.5 12.5 13 20 13C27.5 13 33 17.5 37 22.5V25.5C33 30.5 27.5 36 20 36C12.5 36 6.5 32 4.5 25.5Z";

/** Pêche au Gros : la daurade royale, ronde et dorée. */
const pecheDaurade: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* La queue fourchue, la longue dorsale, l'anale et la ventrale */}
    <path d="M35.5 22L44 13.5Q39.8 24 44 34.5L35.5 26Z" fill={C.mimosaFonce} />
    <path d="M12.5 17.5L14.5 11.8L16.6 12.4L18.4 10.4L20.6 11.2L22.6 10L24.6 11.2L26.6 10.6L28.4 12.2L30.4 12L31.8 14L33.6 14.2L35.5 20.5Z" fill={C.mimosaFonce} />
    <path d="M24 35.2L26.8 39.4L29 37.4L31 38L34 28.6ZM14.6 34.6L14.2 39L18.8 35.8Z" fill={C.mimosaFonce} />
    {/* Le corps d'or, le ventre plus pâle */}
    <path d={DAURADE} fill={C.mimosa} />
    <path d={DAURADE} fill={METAL.or} fillOpacity="0.6" />
    <path d="M4.5 25.5C6.5 32 12.5 36 20 36C24.8 36 28.8 33.8 32 30.8C24 33.6 12 32.2 4.5 25.5Z" fill={shade(C.mimosa, 0.42)} />
    {/* L'ouïe et sa tache, la pectorale, les écailles */}
    <path d="M15.2 17.6Q18.4 24 15 30.6" fill="none" stroke={C.mimosaFonce} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="17.2" cy="18.8" r="1.5" fill={C.corail} />
    <path d="M18.5 25.4Q24 23.8 26.8 28Q21.8 30 18.5 25.4Z" fill={C.mimosaFonce} />
    <path d="M22 17.2q2 1.6 0 3.4M26.4 17q2 1.6 0 3.4M30.2 19.2q2 1.5 0 3.2M24.4 21.4q2 1.6 0 3.4M29 23.4q2 1.5 0 3.2" fill="none" stroke={C.mimosaFonce} strokeOpacity="0.6" strokeWidth="1" strokeLinecap="round" />
    {/* Le bandeau d'or du front, la bouche, l'œil */}
    <path d="M7.8 19Q10.6 16.8 13.6 17.8" fill="none" stroke={shade(C.mimosa, 0.6)} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M5.4 27.2Q7 27.8 8.4 27.2" fill="none" stroke={C.mimosaFonce} strokeWidth="1" strokeLinecap="round" />
    <circle cx="10.8" cy="22" r="2.2" fill={C.blanc} />
    <circle cx="10.6" cy="22" r="1.2" fill={C.noir} />
  </Svg>
);

/** Pêche au Gros : la raie, losange gris-violet vu de dessus, longue queue en fouet. */
const pecheRaie: Art = (props) => {
  const ombre = shade(GRIS_VIOLET, -0.25);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <g transform="translate(1 0) rotate(-20 24 23)">
        {/* Les pelviennes */}
        <path d="M21.4 27.6Q19.2 31.6 21.6 33.4Q23.4 31 23 27.6ZM26.6 27.6Q28.8 31.6 26.4 33.4Q24.6 31 25 27.6Z" fill={ombre} />
        {/* Les ailes, celle de droite à l'ombre */}
        <path d="M24 4.5C26 9 33 12.5 43.5 19.5C43.9 20.6 43.5 21.3 42.5 21.5C35 23 29.5 25.8 27 29H21C18.5 25.8 13 23 5.5 21.5C4.5 21.3 4.1 20.6 4.5 19.5C15 12.5 22 9 24 4.5Z" fill={GRIS_VIOLET} />
        <path d="M24 4.5C26 9 33 12.5 43.5 19.5C43.9 20.6 43.5 21.3 42.5 21.5C35 23 29.5 25.8 27 29H24Z" fill={ombre} fillOpacity="0.45" />
        {/* L'échine, qui file en longue queue */}
        <path d="M24 9C25.8 13 26.4 21 25.4 29C25.2 34 25.8 38.5 27.2 41.5C27.8 43 28 44.5 28 46C26 43.5 24 40 23.4 36C23 33.5 22.8 31 22.6 29C21.6 21 22.2 13 24 9Z" fill={ombre} />
        {/* Les taches, les yeux */}
        <g fill={shade(GRIS_VIOLET, 0.45)}>
          <circle cx="13.5" cy="18.6" r="1.7" />
          <circle cx="17.6" cy="22" r="1.2" />
          <circle cx="18" cy="15.6" r="1.2" />
          <circle cx="34.5" cy="18.6" r="1.7" />
          <circle cx="30.4" cy="22" r="1.2" />
          <circle cx="30" cy="15.6" r="1.2" />
        </g>
        <circle cx="21.4" cy="12.8" r="1.3" fill={C.nuit} />
        <circle cx="26.6" cy="12.8" r="1.3" fill={C.nuit} />
      </g>
    </Svg>
  );
};

/** Pêche au Gros : le thon, trapu, bleu nuit, pinnules jaunes. */
const pecheThon: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* La queue en croissant, la première dorsale */}
    <path d="M11 24.6L4.2 12.5Q8.6 24.6 4.2 36.5Z" fill={shade(C.marine, -0.3)} />
    <path d="M35 16.8L30.5 8.5Q30 13 26.5 15Z" fill={shade(C.marine, -0.3)} />
    {/* Les nageoires en faucille et les pinnules jaunes */}
    <path d="M24.5 15.2L20.2 7.5Q21 13 19.5 16.4ZM24.5 34L20.2 41.5Q21 36 19.5 32.8Z" fill={C.mimosa} />
    <path d="M18.6 17L16.4 14.9L16.6 18.3ZM16 18.7L13.9 16.8L14.1 20.1ZM13.6 20.4L11.7 18.7L11.9 21.7ZM18.6 32.2L16.4 34.3L16.6 30.9ZM16 30.5L13.9 32.4L14.1 29.1ZM13.6 28.8L11.7 30.5L11.9 27.5Z" fill={C.mimosa} />
    {/* Le dos, puis le ventre d'argent qui le recouvre d'un rien */}
    <path d="M44 25C41 18.5 33.5 15 26 15C19 15 13.5 19.5 9.5 23.2V25.6C16 29 24 30.5 31 29.8C36.5 29.2 41 27.4 44 25Z" fill={C.marine} />
    <path d="M44 25C41 31 33.5 34 26 34C19 34 13.5 29.5 9.5 26V25.2C16 28 24 29.5 31 28.8C36.5 28.2 41 26.8 44 25Z" fill={METAL.argent} />
    {/* La pectorale, un reflet sur le dos, l'œil */}
    <path d="M33.5 25.4Q28 29.6 22.5 28.6Q27.5 25.2 33.5 24.2Z" fill={shade(C.marine, -0.3)} />
    <path d="M24.5 18Q31 17.4 36.5 20.6" fill="none" stroke={C.azur} strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="39.3" cy="23" r="1.9" fill={C.blanc} />
    <circle cx="39.6" cy="23" r="1" fill={C.noir} />
  </Svg>
);

/** Pêche au Gros : l'espadon, qui bondit, le rostre vers le ciel. */
const pecheEspadon: Art = (props) => {
  const ombre = shade(SARCELLE, -0.32);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* La grande dorsale, la pectorale */}
      <path d="M18 11.4L28.6 6.6Q25.6 12 27 18.4Z" fill={ombre} />
      <path d="M14.4 19.4Q12.4 25.5 14.4 31Q16.8 27.6 18.6 25.4Z" fill={ombre} />
      {/* Le dos, du rostre à la queue en croissant */}
      <path d="M4.3 4.3L13.5 10.7Q16 10 18.35 11.49C20.58 13.14 23.01 14.48 25.05 16.44C27.09 18.4 28.94 21.15 30.59 23.26C32.24 25.37 33.58 27.41 34.96 29.1C36.34 30.79 37.58 31.95 38.89 33.37L43.8 26.5Q41 31 41.2 34.9Q40.2 39 41.8 43.4L38.11 35.83L38.2 35.5C35.96 35.09 33.81 35.18 31.48 34.25C29.15 33.31 26.49 31.82 24.22 29.9C21.95 27.99 19.68 25.09 17.86 22.76C16.04 20.44 14.81 18.22 13.29 15.95L12.65 16.51C11.8 15 11.2 13.6 10.8 12.2L12.3 12Z" fill={SARCELLE} />
      {/* Le ventre clair, qui recouvre le dos d'un rien, l'œil */}
      <path d="M12.65 16.51C14.08 18.86 15.16 21.19 16.95 23.56C18.74 25.93 21.06 28.85 23.41 30.74C25.76 32.63 28.59 34.05 31.04 34.9C33.49 35.75 35.75 35.52 38.11 35.83L38.3 35.2C36.17 34.66 34.13 34.61 31.92 33.59C29.71 32.57 27.21 31 25.02 29.06C22.83 27.12 20.62 24.24 18.77 21.96C16.92 19.68 15.54 17.57 13.93 15.38Z" fill={shade(SARCELLE, 0.68)} />
      <circle cx="16.2" cy="13.6" r="1.6" fill={C.blanc} />
      <circle cx="16" cy="13.5" r="0.9" fill={C.noir} />
      {/* Les éclaboussures */}
      <g fill={C.azur}>
        <circle cx="30" cy="40.5" r="1.5" />
        <circle cx="34.6" cy="41.6" r="1.1" />
        <circle cx="26" cy="37.6" r="1.1" />
      </g>
    </Svg>
  );
};

/** Pêche au Gros : le requin, gris acier, museau pointu, aileron dressé. */
const pecheRequin: Art = (props) => {
  const ombre = shade(C.ardoise, -0.28);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* La queue, l'aileron, les nageoires */}
      <path d="M38.2 25.4L43.8 12.5Q42.4 22 41.4 26.2Q42.6 30 43.6 34Q40.4 31.4 38 28.4Z" fill={ombre} />
      <path d="M20 19.3L26 7.5Q26.4 14 30 19.6Z" fill={ombre} />
      <path d="M33.6 21.2L36.2 18.4Q36.2 20.8 37.4 22.6ZM15.5 31.5L18.5 40.5Q21.5 36.5 22.6 33ZM30 31.6L32.2 35.2Q33.4 33 33.6 30.6Z" fill={ombre} />
      {/* Le dos, puis le ventre clair qui le recouvre d'un rien */}
      <path d="M4 26.5C8.5 21.5 15 19 22.5 19C30 19 36 21.6 40 24.6L39.2 27.6C33 29.6 26 30.6 19 30.2C13 29.8 8 28.4 4 26.5Z" fill={C.ardoise} />
      <path d="M4 26.5C7.5 30.5 12.5 32.6 18.5 33.2C26 33.8 33.5 31.5 39 28.2L39.4 26.8C33 28.6 26 29.6 19 29.2C13 28.8 8 27.8 4 26.5Z" fill={C.grisClair} />
      {/* Les ouïes, la gueule, l'œil */}
      <path d="M13.6 23.6V27M15.4 23.4V27.2M17.2 23.4V27.4" fill="none" stroke={ombre} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M6.8 28.6Q9.6 30.6 12.8 30" fill="none" stroke={C.noir} strokeWidth="1" strokeLinecap="round" />
      <circle cx="9.6" cy="24.4" r="1.2" fill={C.noir} />
    </Svg>
  );
};

/** Pêche au Gros : la baleine bleue et son jet d'eau. */
const pecheBaleine: Art = (props) => {
  const eau = shade(C.azur, 0.4);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Le jet d'eau */}
      <path d="M14 15.6Q13.6 10 9 8.6M14 15.6Q14.6 9.4 19.6 8" fill="none" stroke={eau} strokeWidth="2.2" strokeLinecap="round" />
      <g fill={eau}>
        <circle cx="6.6" cy="12.6" r="1.2" />
        <circle cx="21.6" cy="11.8" r="1.2" />
        <circle cx="14.2" cy="6.4" r="1.3" />
      </g>
      {/* Le dos et la queue dressée */}
      <path d="M4.5 28.5C4.5 20.5 11.5 16.5 20 16.5C27.5 16.5 32.5 20 35 24.5C36 26.3 37 25.8 37.4 24L38.2 19.2C36 18.5 33.5 16 32.5 12.5C35 12.5 37.8 13.8 39.3 16.2C40 13.5 41.8 11.8 43.8 11.2C44 15 42.8 18 40.6 19.6L40.4 25C40.15 29.1 38.07 33.39 33.69 36.13Q24 35 17 32.5Q10 33.5 4.55 30.4Z" fill={C.azur} />
      {/* Le ventre plissé, qui recouvre le dos d'un rien, la nageoire, un reflet sur le dos, l'œil */}
      <path d="M4.6 29.6Q10 32.5 17 31.5Q24 34 33.69 36.13C31.12 37.74 27.76 38.82 23.5 39C12 39.5 5.2 35.5 4.6 29.6Z" fill={shade(C.azur, 0.6)} />
      <path d="M8 33.6Q14 36.6 22 36.8M12 36.2Q16.5 38 22 38.2" fill="none" stroke={C.azur} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M19.5 34.5Q20.5 40.5 25.5 43Q26 39 24.5 35.5Z" fill={shade(C.azur, -0.3)} />
      <path d="M9 22.6Q13 18.9 19 18.7" fill="none" stroke={shade(C.azur, 0.45)} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="13.5" cy="28.2" r="1.3" fill={C.nuit} />
    </Svg>
  );
};

/** Trois tentacules du kraken, côté gauche : le bras levé, le bras de côté, le bras du bas. */
const TENTACULES = "M17 27C11 30.5 5.9 27 6.1 20.5C6.3 15 10.4 13.4 10.4 16.8M18 29.5C13 32 8 31 6.6 35.5C5.6 39 8.8 41.6 10.8 39.2M21.5 30C21.5 35 16.5 36.5 16.5 40C16.5 42.4 20.3 42.6 20.4 40.2";

/** Pêche au Gros : le kraken, tête violette, tentacules enroulés, un éclat d'or. Le gros lot. */
const pecheKraken: Art = (props) => {
  const ombre = shade(VIOLET, -0.26);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Les six tentacules, le manteau qui les réunit, les ventouses */}
      <g fill="none" stroke={ombre} strokeWidth="3.6" strokeLinecap="round">
        <path d={TENTACULES} />
        <path d={TENTACULES} transform="matrix(-1 0 0 1 48 0)" />
      </g>
      <path d="M15.6 25.5Q24 37.5 32.4 25.5Z" fill={ombre} />
      <g fill={C.lilas}>
        <circle cx="6.8" cy="23.6" r="0.8" />
        <circle cx="7" cy="19.4" r="0.8" />
        <circle cx="7.8" cy="34" r="0.8" />
        <circle cx="7.1" cy="37.6" r="0.8" />
        <circle cx="17.1" cy="37.6" r="0.8" />
        <circle cx="17.2" cy="40.6" r="0.8" />
        <circle cx="41.2" cy="23.6" r="0.8" />
        <circle cx="41" cy="19.4" r="0.8" />
        <circle cx="40.2" cy="34" r="0.8" />
        <circle cx="40.9" cy="37.6" r="0.8" />
        <circle cx="30.9" cy="37.6" r="0.8" />
        <circle cx="30.8" cy="40.6" r="0.8" />
      </g>
      {/* La tête, son ombre, un reflet */}
      <path d="M24 4.5C30.2 4.5 34 9 34 15C34 19.5 32.6 22.5 31.8 25.5C31 29 28.6 31 24 31C19.4 31 17 29 16.2 25.5C15.4 22.5 14 19.5 14 15C14 9 17.8 4.5 24 4.5Z" fill={VIOLET} />
      <path d="M24 4.5C30.2 4.5 34 9 34 15C34 19.5 32.6 22.5 31.8 25.5C31 29 28.6 31 24 31C28 28 30.6 22 30.6 15C30.6 10.5 28.5 6.5 24 4.5Z" fill={ombre} />
      <ellipse cx="19.6" cy="10.4" rx="3.2" ry="1.8" transform="rotate(-38 19.6 10.4)" fill={C.lilas} fillOpacity="0.8" />
      {/* Les yeux sous leurs sourcils froncés */}
      <ellipse cx="20.2" cy="21.4" rx="2.3" ry="2.7" fill={C.creme} />
      <ellipse cx="27.8" cy="21.4" rx="2.3" ry="2.7" fill={C.creme} />
      <circle cx="20.6" cy="21.8" r="1.2" fill={C.noir} />
      <circle cx="27.4" cy="21.8" r="1.2" fill={C.noir} />
      <path d="M17.4 17.2L22.4 19M30.6 17.2L25.6 19" fill="none" stroke={shade(VIOLET, -0.5)} strokeWidth="1.5" strokeLinecap="round" />
      {/* L'éclat d'or */}
      <path d={eclat(40, 8, 4)} fill={METAL.or} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// L'Alignement des Planètes : deux astres, sur une case bleu nuit

/** L'ocre des bandes de la planète, entre le mimosa et la terracotta. */
const OCRE = "#E0952E";

/** L'Alignement des Planètes : la planète aux anneaux, ocre et or. Le symbole gagnant. */
const morpionPlanete: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="rotate(-18 24 24)">
      {/* Les anneaux, côté lointain */}
      <ellipse cx="24" cy="24" rx="18.8" ry="6.2" fill="none" stroke={C.creme} strokeWidth="3" />
      <ellipse cx="24" cy="24" rx="14.8" ry="4" fill="none" stroke={C.paille} strokeWidth="1.5" />
      {/* Le globe et ses bandes */}
      <circle cx="24" cy="24" r="12.5" fill={C.mimosa} />
      <path d="M18.06 13H29.94A12.5 12.5 0 0 1 31.76 14.2H16.24A12.5 12.5 0 0 1 18.06 13ZM14 16.5H34A12.5 12.5 0 0 1 35.66 19.5H12.34A12.5 12.5 0 0 1 14 16.5ZM11.66 22H36.34A12.5 12.5 0 0 1 36.49 23.4H11.51A12.5 12.5 0 0 1 11.66 22ZM14.93 32.6H33.07A12.5 12.5 0 0 1 30.93 34.4H17.07A12.5 12.5 0 0 1 14.93 32.6Z" fill={OCRE} />
    </g>
    {/* L'ombre du globe, un reflet */}
    <path d="M31.78 14.22A12.5 12.5 0 1 1 14.22 31.78A12.5 12.5 0 0 0 31.78 14.22Z" fill={C.brique} fillOpacity="0.5" />
    <path d="M14.6 21Q15.6 16.4 19.8 14.4" fill="none" stroke={shade(C.mimosa, 0.65)} strokeWidth="1.8" strokeLinecap="round" />
    {/* Les anneaux, côté proche */}
    <g transform="rotate(-18 24 24)" fill="none">
      <path d="M5.2 24A18.8 6.2 0 0 0 42.8 24" stroke={C.creme} strokeWidth="3" />
      <path d="M9.2 24A14.8 4 0 0 0 38.8 24" stroke={C.paille} strokeWidth="1.5" />
    </g>
    <path d={eclat(40, 9, 3.6) + eclat(8.5, 39.5, 2.5)} fill={C.blanc} />
  </Svg>
);

/** L'Alignement des Planètes : l'astéroïde, un caillou gris criblé de cratères. Le symbole perdant. */
const morpionAsteroide: Art = (props) => {
  const ombre = shade(C.gris, -0.28);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Le caillou dans l'ombre, sa face de côté, sa face au jour */}
      <path d="M16 7.5L27 5L36 9.5L42.5 18L41 28L43 33.5L36 41L25 43L15 40L8.5 33.5L5 23.5L9 13.5Z" fill={ombre} />
      <path d="M16 7.5L27 5L36 9.5L42.5 18L37.5 24.5L33.5 33L24.5 37.5L15 40L8.5 33.5L5 23.5L9 13.5Z" fill={C.gris} />
      <path d="M16 7.5L27 5L36 9.5L29.5 13.5L18.5 15.5L12 22L5 23.5L9 13.5Z" fill={C.grisClair} />
      {/* Les cratères, leur bord éclairé */}
      <g fill={ombre}>
        <circle cx="17.5" cy="26.5" r="4.2" />
        <circle cx="29" cy="21" r="3" />
        <circle cx="22" cy="12" r="1.7" />
      </g>
      <circle cx="29.5" cy="35.5" r="2.2" fill={shade(C.gris, -0.5)} />
      <path d="M21.45 25.06A4.2 4.2 0 0 1 16.06 30.45M31.82 19.97A3 3 0 0 1 27.97 23.82" fill="none" stroke={C.grisClair} strokeWidth="1.1" strokeLinecap="round" />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Les emblèmes posés à côté d'un coefficient, sur une case ivoire

/** Grande Marée : la vague qui déferle, crête d'écume. */
const coefMaree: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="translate(0 -1)">
      {/* La vague, puis son creux plus clair, qui la recouvre d'un rien */}
      <path d="M4 42C6 32 10.5 16.5 23 10.5C30.5 7 39 9.6 41.2 17C42.2 20.8 40.6 24.2 37.8 25C38.8 21.4 36.8 18 33 16.9C27.2 14.6 21.4 18.6 20.9 25C20.5 30.8 25.4 36.4 32.3 38.3C36 39.3 40.3 39.7 44 39.7V42Q44 44 42 44H6Q4 44 4 42Z" fill={C.mer} />
      <path d="M33 16.9C27.5 15.4 22.4 19.2 22 25C21.7 30.2 26 35.4 32.6 37.2C36.2 38.2 40.4 38.6 44 38.6V41.2C37 41.4 29.5 40.2 24.6 36.4C19 32 17.4 23.2 21.8 17.6C25 13.6 30 13.6 33 16.9Z" fill={C.azur} />
      {/* Les filets d'eau sur le dos */}
      <path d="M8.8 40.4C10.2 31.6 13.6 23 18.6 17.4M13.6 40.8C14 36.4 15 32.4 16.4 28.8" fill="none" stroke={C.azur} strokeWidth="1.6" strokeLinecap="round" />
      {/* L'écume de la crête, festonnée, et son cœur blanc */}
      <path d="M12.4 21.6A3.3 3.3 0 0 1 14.6 15.8A3.4 3.4 0 0 1 19 11.4A3.5 3.5 0 0 1 24.6 8.6A3.7 3.7 0 0 1 31 7.4A3.6 3.6 0 0 1 36.8 9.2A3.4 3.4 0 0 1 40.8 13.4A3.2 3.2 0 0 1 42.2 19A4.1 4.1 0 0 1 38 25.6Q39.6 23 38.6 21.2Q40.2 19 39.2 17.2Q39.2 14.6 37 13.8Q35.6 11.2 33.2 11.6Q31 10 28.8 11.4Q26.2 10.6 24.4 12.6Q21.6 12.6 20.4 15.2Q17.8 16 17.2 18.8Q15 19.4 12.4 21.6Z" fill={C.ciel} />
      <path d="M16 17.6Q19.4 12.6 25 10.4Q31 8.4 36.2 11Q40.4 13.8 40.6 18.8Q40.8 21.4 39.6 23.4" fill="none" stroke={C.blanc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Les embruns */}
      <circle cx="42.4" cy="28.2" r="1.2" fill={C.azur} />
      <circle cx="39.6" cy="31.6" r="0.8" fill={C.azur} />
    </g>
  </Svg>
);

/** Les quatre pièces de la pile, de bas en haut : le centre de leur face. */
const PIECES: ReadonlyArray<readonly [number, number]> = [
  [24, 35.2],
  [25, 31],
  [23.2, 26.8],
  [24.2, 22.6],
];

/** La tranche d'une pièce, à poser sous sa face centrée en (cx, cy). */
function tranche(cx: number, cy: number): string {
  const n = (v: number) => Math.round(v * 10) / 10;
  return `M${n(cx - 14.4)} ${cy}V${n(cy + 4)}A14.4 4.6 0 0 0 ${n(cx + 14.4)} ${n(cy + 4)}V${cy}Z`;
}

/** Intérêts Composés : la pile de pièces d'or où pousse une feuille. */
const coefInterets: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Les pièces : la tranche, puis la face */}
    {PIECES.map(([cx, cy]) => (
      <g key={cy}>
        <path d={tranche(cx, cy)} fill={C.mimosaFonce} />
        <path d={tranche(cx, cy)} fill={METAL.or} fillOpacity="0.75" />
        <ellipse cx={cx} cy={cy} rx="14.4" ry="4.6" fill={shade(C.mimosa, 0.35)} />
      </g>
    ))}
    <ellipse cx="24.2" cy="22.6" rx="10" ry="2.9" fill={C.mimosa} />
    {/* La pousse et ses deux feuilles */}
    <path d="M24.2 22.4C24.2 18 23.6 15 24 11.4" fill="none" stroke={C.feuille} strokeWidth="2" strokeLinecap="round" />
    <path d="M24 14.6C18 15.4 12 12 10.6 5.2C17.6 4.6 23.6 8.4 24 14.6ZM24 11.8C24.6 7 29 4.2 35.4 4.2C35 9.6 30.4 12.6 24 11.8Z" fill={C.vert} />
    <path d="M24 14.6C18 15.4 12 12 10.6 5.2ZM35.4 4.2C35 9.6 30.4 12.6 24 11.8Z" fill={C.feuille} />
  </Svg>
);

export const SYMBOLS_2: Record<string, Art> = {
  "arcane:soleil": arcaneSoleil,
  "arcane:lune": arcaneLune,
  "arcane:etoile": arcaneEtoile,
  "arcane:roue": arcaneRoue,
  "arcane:couronne": arcaneCouronne,
  "arcane:phare": arcanePhare,
  "arcane:ancre": arcaneAncre,
  "arcane:sirene": arcaneSirene,

  "peche:sardine": pecheSardine,
  "peche:crevette": pecheCrevette,
  "peche:crabe": pecheCrabe,
  "peche:daurade": pecheDaurade,
  "peche:raie": pecheRaie,
  "peche:thon": pecheThon,
  "peche:espadon": pecheEspadon,
  "peche:requin": pecheRequin,
  "peche:baleine": pecheBaleine,
  "peche:kraken": pecheKraken,

  "morpion:planete": morpionPlanete,
  "morpion:asteroide": morpionAsteroide,

  "coef:maree": coefMaree,
  "coef:interets": coefInterets,
};
