// Symboles des nouveaux tickets, seconde planche : cocktails, camps, pions.
//
// Même contrat que symbols.tsx (à lire d'abord) : viewBox 0 0 48 48, fond transparent,
// le dessin tient dans le carré de 4 à 44 et se reconnaît à 28 px de côté.
// Clés : « famille:identifiant ».
//
// Identifiants attendus :
//   cocktail:citron, cocktail:orange, cocktail:fraise, cocktail:cerise, cocktail:ananas,
//   cocktail:coco, cocktail:menthe, cocktail:olive, cocktail:glacon, cocktail:cafe,
//   cocktail:sirop, cocktail:bulles, cocktail:sucre, cocktail:ombrelle,
//   roulette:rouge, roulette:noir, fanal:babord, fanal:tribord, astre:soleil, astre:lune,
//   pion:crabe, pion:montgolfiere, pion:ascenseur.

import { C, METAL, Svg, shade, type Art } from "./kit";

// ---------------------------------------------------------------------------
// Cocktails du Commodore : quatorze ingrédients, sur une case ivoire.
// Chacun a sa silhouette et sa couleur : aucun ne se lit par la teinte seule.

/** Le jaune citron, plus acide que le mimosa (le même que celui du Bandit Manchot). */
const CITRON = "#FBE04F";
/** L'orange du fruit, que la palette n'a pas : la pulpe et l'écorce. */
const ORANGE = "#F7982B";
const ECORCE = "#E86F17";
/** Le rouge franc de la fraise, plus chaud que le cerise. */
const FRAISE = "#E5443C";
/** L'or mûr de l'ananas, entre le mimosa et l'orange. */
const ANANAS = "#F2B33C";
/** Le rouge framboise du sirop de grenadine. */
const GRENADINE = "#D42A56";
/** Le turquoise de l'eau de Seltz. */
const TURQUOISE = "#1FB3AE";

/** Cocktails du Commodore : la rondelle de citron, huit quartiers sous leur zeste. */
const cocktailCitron: Art = (props) => {
  const peau = shade(CITRON, 0.75);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Le zeste et son ombre, la peau blanche, la pulpe */}
      <circle cx="25.2" cy="25.2" r="18.8" fill={C.mimosaFonce} />
      <circle cx="24" cy="24" r="18.8" fill={C.mimosa} />
      <circle cx="24" cy="24" r="15.8" fill={peau} />
      <circle cx="24" cy="24" r="13.8" fill={CITRON} />
      <path d="M33.76 14.24A13.8 13.8 0 0 1 14.24 33.76A17 17 0 0 0 33.76 14.24Z" fill={C.mimosa} fillOpacity="0.6" />
      {/* Les cloisons des quartiers, un reflet */}
      <path d="M11.25 18.72L36.75 29.28M18.72 11.25L29.28 36.75M29.28 11.25L18.72 36.75M36.75 18.72L11.25 29.28" fill="none" stroke={peau} strokeWidth="1.7" />
      <circle cx="24" cy="24" r="2.3" fill={peau} />
      <ellipse cx="18.2" cy="16" rx="2.4" ry="1.1" transform="rotate(-50 18.2 16)" fill={C.blanc} fillOpacity="0.8" />
    </Svg>
  );
};

/** Une demi-tranche, le plat en haut, centrée sur l'origine. */
const DEMI_TRANCHE = "M-20 0A20 20 0 0 0 20 0Z";

/** Cocktails du Commodore : le quartier d'orange, posé de biais sur son écorce. */
const cocktailOrange: Art = (props) => {
  const peau = shade(ORANGE, 0.78);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      <path d={DEMI_TRANCHE} transform="translate(23.9 19.9) rotate(-30)" fill={shade(ECORCE, -0.3)} />
      <g transform="translate(22.7 18.7) rotate(-30)">
        {/* L'écorce, la peau blanche, la pulpe */}
        <path d={DEMI_TRANCHE} fill={ECORCE} />
        <path d="M-17.3 0A17.3 17.3 0 0 0 17.3 0Z" fill={peau} />
        <path d="M-15.5 0A15.5 15.5 0 0 0 15.5 0Z" fill={ORANGE} />
        {/* Les cloisons et leur cœur, un reflet */}
        <path d="M1.1 0.8L12.5 9.1M0.4 1.2L4.8 14.7M-0.4 1.2L-4.8 14.7M-1.1 0.8L-12.5 9.1" fill="none" stroke={peau} strokeWidth="1.6" />
        <path d="M-2.4 0A2.4 2.4 0 0 0 2.4 0Z" fill={peau} />
        <ellipse cx="-9.6" cy="3.2" rx="2.3" ry="1" transform="rotate(18 -9.6 3.2)" fill={C.blanc} fillOpacity="0.75" />
      </g>
    </Svg>
  );
};

/** Cocktails du Commodore : la fraise, sa collerette verte, ses akènes. */
const cocktailFraise: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Le fruit, son côté à l'ombre, un reflet */}
    <path d="M24 15C27.5 11 37 11.2 39.6 18.2C42 25 36 35.5 24 43.5C12 35.5 6 25 8.4 18.2C11 11.2 20.5 11 24 15Z" fill={FRAISE} />
    <path d="M39.6 18.2C42 25 36 35.5 24 43.5C31 35 37 25 39.6 18.2Z" fill={shade(FRAISE, -0.28)} />
    <path d="M11.6 21.5Q11.2 26.5 14.6 31" fill="none" stroke={shade(FRAISE, 0.45)} strokeWidth="1.8" strokeLinecap="round" />
    {/* Les akènes */}
    <g fill={shade(C.mimosa, 0.45)}>
      <ellipse cx="18" cy="24" rx="1" ry="1.5" />
      <ellipse cx="25" cy="27" rx="1" ry="1.5" />
      <ellipse cx="32" cy="24" rx="1" ry="1.5" />
      <ellipse cx="20.5" cy="31.5" rx="1" ry="1.5" />
      <ellipse cx="28.5" cy="32.5" rx="1" ry="1.5" />
      <ellipse cx="24.5" cy="37.5" rx="1" ry="1.5" />
    </g>
    {/* La collerette, le pli de ses sépales à l'ombre, la queue */}
    <path d="M24 13Q17.8 18.7 9.5 17.5Q15.7 11.8 24 13ZM24 13Q17 12 14 5.5Q21 6.5 24 13ZM24 13Q31 12 34 5.5Q27 6.5 24 13ZM24 13Q30.2 18.7 38.5 17.5Q32.3 11.8 24 13ZM24 13Q27.4 18 24 23Q20.6 18 24 13Z" fill={C.vert} />
    <path d="M24 13Q31 12 34 5.5ZM24 13Q30.2 18.7 38.5 17.5ZM24 13Q27.4 18 24 23Z" fill={C.feuille} />
    <path d="M24 12.5L24.9 5.7" fill="none" stroke={C.feuille} strokeWidth="2.6" strokeLinecap="round" />
  </Svg>
);

/** Cocktails du Commodore : la cerise confite, embrochée sur sa petite épée. */
const cocktailCerise: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* L'épée : la lame, la garde, la poignée et son pommeau */}
    <path d="M33.9 13.1L7.6 41.9" fill="none" stroke={C.mimosaFonce} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M30.7 10.2L37.2 16.1" fill="none" stroke={C.mimosaFonce} strokeWidth="2.8" strokeLinecap="round" />
    <path d="M39 7.6L34.6 12.4" fill="none" stroke={C.mimosaFonce} strokeWidth="3.4" strokeLinecap="round" />
    <circle cx="39" cy="7.6" r="2.6" fill={C.mimosaFonce} />
    {/* La queue */}
    <path d="M20 17.6Q18.6 10.2 12.4 6.6" fill="none" stroke={shade(C.cerise, -0.45)} strokeWidth="2" strokeLinecap="round" />
    {/* Le fruit, son ombre, son reflet */}
    <circle cx="20.4" cy="27.9" r="12.6" fill={C.cerise} />
    <path d="M29.31 18.99A12.6 12.6 0 0 1 11.49 36.81A16 16 0 0 0 29.31 18.99Z" fill={shade(C.cerise, -0.3)} />
    <circle cx="15.4" cy="22.6" r="3" fill={C.ceriseClair} />
  </Svg>
);

/** Cocktails du Commodore : l'ananas, son plumet de feuilles, son écorce en losanges. */
const cocktailAnanas: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Le plumet : les feuilles du fond, puis celles de devant */}
    <path d="M22 21Q13 20 8.5 13.5Q17 13.5 24 19ZM26 21Q35 20 39.5 13.5Q31 13.5 24 19Z" fill={C.feuille} />
    <path d="M23 20Q14.5 16 12.5 6.5Q20.5 10.5 24.5 19ZM25 20Q33.5 16 35.5 6.5Q27.5 10.5 23.5 19Z" fill={C.vert} />
    <path d="M24 21Q19 12 24 4Q29 12 24 21Z" fill={C.feuille} />
    {/* Le fruit, son côté à l'ombre, ses losanges */}
    <ellipse cx="24" cy="30.5" rx="11.5" ry="13" fill={ANANAS} />
    <path d="M24 17.5A11.5 13 0 0 1 24 43.5Q32 39 32 30.5Q32 22 24 17.5Z" fill={shade(ANANAS, -0.16)} />
    <path d="M13.5 32.4L21.5 42.4M14.2 25.8L27.3 42.1M16.8 21.5L31.2 39.5M20.7 18.9L33.8 35.2M26.5 18.6L34.5 28.6M13.5 28.6L21.5 18.6M14.2 35.2L27.3 18.9M16.8 39.5L31.2 21.5M20.7 42.1L33.8 25.8M26.5 42.4L34.5 32.4" fill="none" stroke={shade(ANANAS, -0.38)} strokeWidth="1.1" strokeLinecap="round" />
  </Svg>
);

/** Cocktails du Commodore : la demi-noix de coco, coque brune et chair blanche. */
const cocktailCoco: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="translate(0.7 -0.8) rotate(-12 24 24)">
      {/* La coque, son ombre, ses fibres */}
      <path d="M5.5 20A18.5 18.5 0 0 0 42.5 20Z" fill={C.bois} />
      <path d="M42.5 20A18.5 18.5 0 0 1 10.9 33.1Q26 37 36.5 20Z" fill={C.boisFonce} />
      <path d="M8.6 25.5Q9.6 29 12 31.5M14 26.5Q15 30 17.5 32.5M20 28.5Q21 31 23 32.8" fill="none" stroke={C.boisFonce} strokeWidth="1.1" strokeLinecap="round" />
      {/* La tranche : le bord de la coque, la chair, le creux et son ombre */}
      <ellipse cx="24" cy="20" rx="18.5" ry="8.5" fill={C.boisFonce} />
      <ellipse cx="24" cy="20" rx="17" ry="7.3" fill={C.blanc} />
      <ellipse cx="24" cy="20.6" rx="12.5" ry="4.6" fill={C.pierre} />
      <ellipse cx="25.2" cy="21.4" rx="10.8" ry="3.6" fill={C.craie} />
    </g>
  </Svg>
);

/**
 * Une feuille de menthe dentelée, de la base (bx, by) à la pointe (tx, ty), large de deux fois `w`.
 * `cote` : 0 pour la feuille entière, 1 ou -1 pour la seule moitié d'un côté de la nervure.
 */
function feuille(bx: number, by: number, tx: number, ty: number, w: number, cote: -1 | 0 | 1 = 0): string {
  const dx = tx - bx;
  const dy = ty - by;
  const long = Math.hypot(dx, dy);
  const profil = (s: number) => w * Math.sin(Math.PI * s ** 0.72) ** 0.85;
  const point = (s: number, l: number) => `${Math.round((bx + dx * s - (dy / long) * l) * 10) / 10} ${Math.round((by + dy * s + (dx / long) * l) * 10) / 10}`;
  // Cinq dents par côté : la pointe de chaque dent sur le profil ovale, puis le cran qui rentre.
  const bord = (signe: number): string[] => {
    const points: string[] = [];
    for (let dent = 1; dent <= 5; dent++) {
      const pointe = (dent - 0.25) / 5.7;
      const cran = dent / 5.7;
      points.push(point(pointe, signe * profil(pointe)), point(cran, signe * Math.max(profil(cran) - 0.13 * w, 0.3)));
    }
    return points;
  };
  if (cote !== 0) return `M${bx} ${by}L${bord(cote).join("L")}L${tx} ${ty}Z`;
  return `M${bx} ${by}L${bord(1).join("L")}L${tx} ${ty}L${bord(-1).reverse().join("L")}Z`;
}

/** Les trois étages du brin de menthe : les feuilles entières, puis leurs moitiés tournées vers la lumière. */
const MENTHE_BAS = feuille(23.4, 36, 9, 33.5, 4.6) + feuille(24.6, 36, 39, 33.5, 4.6);
const MENTHE_BAS_CLAIR = feuille(23.4, 36, 9, 33.5, 4.6, 1) + feuille(24.6, 36, 39, 33.5, 4.6, -1);
const MENTHE_MILIEU = feuille(23.4, 28.4, 6.4, 18.6, 6) + feuille(24.6, 28.4, 41.6, 18.6, 6);
const MENTHE_MILIEU_CLAIR = feuille(23.4, 28.4, 6.4, 18.6, 6, 1) + feuille(24.6, 28.4, 41.6, 18.6, 6, -1);
const MENTHE_CIME = feuille(24, 22.6, 24, 5, 6.4);
const MENTHE_CIME_CLAIR = feuille(24, 22.6, 24, 5, 6.4, -1);

/** Cocktails du Commodore : le brin de menthe, cinq feuilles dentelées, pliées sur leur nervure. */
const cocktailMenthe: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="translate(-0.8 -0.2) rotate(8 24 24)">
      <path d="M24 22V42.4" fill="none" stroke={C.persFonce} strokeWidth="2.2" strokeLinecap="round" />
      {/* Du bas vers la cime, chaque étage recouvre le précédent */}
      <path d={MENTHE_BAS} fill={C.persienne} />
      <path d={MENTHE_BAS_CLAIR} fill={C.persClair} />
      <path d={MENTHE_MILIEU} fill={C.persienne} />
      <path d={MENTHE_MILIEU_CLAIR} fill={C.persClair} />
      <path d={MENTHE_CIME} fill={C.persienne} />
      <path d={MENTHE_CIME_CLAIR} fill={C.persClair} />
    </g>
  </Svg>
);

/** Cocktails du Commodore : l'olive verte et son piment, sur une pique de bois. */
const cocktailOlive: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="translate(0.6 -0.4) rotate(40 24 25)">
      {/* La pique et sa boule */}
      <path d="M4 25H24" fill="none" stroke={C.bois} strokeWidth="2.2" />
      <circle cx="4" cy="25" r="3" fill={C.boisFonce} />
      {/* L'olive, son ombre, son reflet */}
      <ellipse cx="24" cy="25" rx="14" ry="11" fill={shade(C.olive, -0.3)} />
      <ellipse cx="22.8" cy="24.4" rx="12.6" ry="10.2" fill={C.olive} />
      <ellipse cx="17" cy="19.6" rx="4.4" ry="1.8" transform="rotate(-24 17 19.6)" fill={shade(C.olive, 0.5)} />
      {/* Le piment, d'où ressort la pique */}
      <ellipse cx="33.4" cy="25" rx="3.6" ry="5.2" fill={C.cerise} />
      <path d="M33.4 25H45" fill="none" stroke={C.bois} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  </Svg>
);

/** Le glaçon vu de trois quarts : sa silhouette aux coins fondus, puis ses faces de gauche et du dessus. */
const GLACON = "M21.4 6.5Q24 5 26.6 6.5L37.9 13Q40.5 14.5 40.5 17.5V30.5Q40.5 33.5 37.9 35L26.6 41.5Q24 43 21.4 41.5L10.1 35Q7.5 33.5 7.5 30.5V17.5Q7.5 14.5 10.1 13Z";
const GLACON_GAUCHE = "M24 24V42.25Q22.7 42.25 21.4 41.5L10.1 35Q7.5 33.5 7.5 30.5V17.5Q7.5 16 8.15 14.875Z";
const GLACON_DESSUS = "M24 24L8.15 14.875Q8.8 13.75 10.1 13L21.4 6.5Q24 5 26.6 6.5L37.9 13Q39.2 13.75 39.85 14.875Z";

/** Cocktails du Commodore : le glaçon, bleu pâle, un éclat blanc. */
const cocktailGlacon: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d={GLACON} transform="translate(0.7 0.7)" fill={C.azur} />
    <g transform="translate(-0.6 -0.6)">
      <path d={GLACON} fill={shade(C.azur, 0.25)} />
      <path d={GLACON_GAUCHE} fill={shade(C.azur, 0.55)} />
      <path d={GLACON_DESSUS} fill={shade(C.ciel, 0.45)} />
      {/* Les arêtes givrées, deux reflets, l'éclat à quatre branches */}
      <path d="M8.6 15.1L24 24L39.4 15.1M24 24V41.8" fill="none" stroke={C.blanc} strokeOpacity="0.85" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 21.5L14.2 23.3V31.3L11 29.5ZM16.2 24.5L17.8 25.4V30.4L16.2 29.5Z" fill={C.blanc} fillOpacity="0.85" />
      <path d="M33 19.3Q33.92 22.58 37.2 23.5Q33.92 24.42 33 27.7Q32.08 24.42 28.8 23.5Q32.08 22.58 33 19.3Z" fill={C.blanc} />
    </g>
  </Svg>
);

/** Un grain de café debout, centré sur l'origine : sa moitié éclairée, son sillon, son reflet. */
const GRAIN_CLAIR = "M0 -14A10 14 0 0 0 0 14C-5 5 5 -5 0 -14Z";
const GRAIN_SILLON = "M0 14C-5 5 5 -5 0 -14";
const GRAIN_REFLET = "M-6.4 -4Q-6.6 -8.2 -3.6 -10.8";

/** Cocktails du Commodore : deux grains de café torréfiés. */
const cocktailCafe: Art = (props) => {
  const sombre = shade(C.boisFonce, -0.3);
  const sillon = shade(C.boisFonce, -0.62);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Le grain du fond */}
      <g transform="translate(31 28.6) rotate(32)">
        <ellipse rx="10" ry="14" fill={sombre} />
        <path d={GRAIN_CLAIR} fill={C.boisFonce} />
        <path d={GRAIN_SILLON} fill="none" stroke={sillon} strokeWidth="2" strokeLinecap="round" />
        <path d={GRAIN_REFLET} fill="none" stroke={C.bois} strokeWidth="1.8" strokeLinecap="round" />
      </g>
      {/* Le grain de devant et son ombre portée */}
      <g transform="translate(16.8 20) rotate(-24)">
        <ellipse cx="1.1" cy="1.5" rx="10" ry="14" fill={sillon} />
        <ellipse rx="10" ry="14" fill={sombre} />
        <path d={GRAIN_CLAIR} fill={C.boisFonce} />
        <path d={GRAIN_SILLON} fill="none" stroke={sillon} strokeWidth="2" strokeLinecap="round" />
        <path d={GRAIN_REFLET} fill="none" stroke={C.bois} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </Svg>
  );
};

/** Cocktails du Commodore : la fiole de sirop de grenadine, étiquette crème, capsule dorée. */
const cocktailSirop: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Le flacon plein, son côté à l'ombre, un reflet sur l'épaule */}
    <path d="M21.2 8V17.5C21.2 20.5 13 21 13 27V41C13 42.7 14.3 44 16 44H32C33.7 44 35 42.7 35 41V27C35 21 26.8 20.5 26.8 17.5V8Z" fill={GRENADINE} />
    <path d="M24.8 8H26.8V17.5C26.8 20.5 35 21 35 27V41C35 42.7 33.7 44 32 44H30.5V27C30.5 22 24.8 20.5 24.8 17.5Z" fill={shade(GRENADINE, -0.3)} />
    <path d="M15.6 25.6Q15.8 23.6 18.6 21.9" fill="none" stroke={C.blanc} strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
    {/* L'étiquette et sa goutte */}
    <rect x="13" y="27.5" width="22" height="11" fill={C.creme} />
    <rect x="30.5" y="27.5" width="4.5" height="11" fill={C.sable} />
    <path d="M21.8 29.4Q24.8 33 24.8 34.6A3 3 0 0 1 18.8 34.6Q18.8 33 21.8 29.4Z" fill={GRENADINE} />
    {/* La capsule */}
    <rect x="19.8" y="4" width="8.4" height="5.6" rx="1.2" fill={METAL.or} />
  </Svg>
);

/** Cocktails du Commodore : les bulles d'eau de Seltz, turquoise. */
const cocktailBulles: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g fill={TURQUOISE}>
      <circle cx="17.5" cy="29.1" r="12.5" />
      <circle cx="34.5" cy="17.1" r="8" />
      <circle cx="36" cy="36.6" r="6" />
      <circle cx="19" cy="9.6" r="4.4" />
      <circle cx="7.6" cy="12" r="2.6" />
    </g>
    {/* Le creux de chaque bulle : il laisse un croissant d'ombre en bas à droite */}
    <g fill={shade(TURQUOISE, 0.6)}>
      <circle cx="16.2" cy="27.8" r="9.6" />
      <circle cx="33.6" cy="16.2" r="6" />
      <circle cx="35.3" cy="35.9" r="4.3" />
      <circle cx="18.5" cy="9.1" r="3" />
      <circle cx="7.3" cy="11.7" r="1.6" />
    </g>
    {/* Les reflets */}
    <g fill={C.blanc}>
      <circle cx="12" cy="23.6" r="2.6" />
      <circle cx="31.2" cy="13.8" r="1.7" />
      <circle cx="33.8" cy="34.4" r="1.2" />
    </g>
  </Svg>
);

/** Un morceau de sucre vu de trois quarts, le milieu du dessus à l'origine : la silhouette, puis ses faces. */
const SUCRE = "M0 -7.4L13 0V9.6L0 17L-13 9.6V0Z";
const SUCRE_DESSUS = "M0 -7.4L13 0L0 7.4L-13 0Z";
const SUCRE_GAUCHE = "M-13 0L0 7.4V17L-13 9.6Z";

/** Cocktails du Commodore : deux morceaux de sucre blanc, l'un sur l'autre. */
const cocktailSucre: Art = (props) => {
  const ombre = shade(C.pierre, -0.3);
  const faceClaire = shade(C.pierre, 0.3);
  const faceSombre = shade(C.pierre, -0.07);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Le morceau du dessous */}
      <path d={SUCRE} transform="translate(21.3 26.6)" fill={ombre} />
      <g transform="translate(20.1 25.4)">
        <path d={SUCRE} fill={faceSombre} />
        <path d={SUCRE_GAUCHE} fill={faceClaire} />
        <path d={SUCRE_DESSUS} fill={C.blanc} />
      </g>
      {/* Le morceau du dessus, posé de travers, et son ombre portée */}
      <path d={SUCRE} transform="translate(27.8 13.3)" fill={ombre} />
      <g transform="translate(26.6 12.1)">
        <path d={SUCRE} fill={faceSombre} />
        <path d={SUCRE_GAUCHE} fill={faceClaire} />
        <path d={SUCRE_DESSUS} fill={C.blanc} />
      </g>
      {/* Les cristaux : sombres sur le dessus, blancs sur les flancs */}
      <g fill={C.pierre}>
        <circle cx="22.6" cy="10" r="0.7" />
        <circle cx="30.1" cy="12.6" r="0.7" />
        <circle cx="24.6" cy="15" r="0.7" />
        <circle cx="14.1" cy="27" r="0.7" />
        <circle cx="19.6" cy="29.6" r="0.7" />
      </g>
      <g fill={C.blanc}>
        <circle cx="17.6" cy="19" r="0.7" />
        <circle cx="22.1" cy="24.5" r="0.7" />
        <circle cx="31.6" cy="22" r="0.7" />
        <circle cx="36.1" cy="17" r="0.7" />
        <circle cx="11.1" cy="33" r="0.7" />
        <circle cx="16.1" cy="38" r="0.7" />
        <circle cx="25.6" cy="36.5" r="0.7" />
      </g>
    </Svg>
  );
};

/** Cocktails du Commodore : l'ombrelle de papier, rose et jaune, sur son bâtonnet. */
const cocktailOmbrelle: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g transform="translate(-1.5 -0.9) rotate(25 24 24)">
      {/* Le bâtonnet et sa bague */}
      <path d="M24 5V44.5" fill="none" stroke={C.bois} strokeWidth="2" strokeLinecap="round" />
      <rect x="22.2" y="26.6" width="3.6" height="3.4" rx="0.8" fill={C.bougFonce} />
      {/* Les cinq pans, du plus éclairé au plus sombre */}
      <path d="M24 7.5L3.5 20.5Q7.2 20.6 10 23.2Z" fill={C.bougClair} />
      <path d="M24 7.5L10 23.2Q14.7 22.4 19 24.8Z" fill={C.mimosa} />
      <path d="M24 7.5L19 24.8Q24 23.2 29 24.8Z" fill={C.bougainvillier} />
      <path d="M24 7.5L29 24.8Q33.3 22.4 38 23.2Z" fill={shade(C.mimosa, -0.14)} />
      <path d="M24 7.5L38 23.2Q40.8 20.6 44.5 20.5Z" fill={C.bougFonce} />
    </g>
  </Svg>
);

// ---------------------------------------------------------------------------
// Le Rouge et le Noir : deux jetons, sur une case ivoire ronde.
// L'emblème du centre et le nombre d'encoches les distinguent autant que la couleur.

/** Le pique des cartes (celui de symbols-jeux.tsx), réduit de moitié au centre du jeton. */
const PIQUE = "M24 4C30 12 43 18 43 28C43 34 38.5 38 33.5 38C30.5 38 27.8 36.6 26 34.3C26.5 38.5 28.5 42 31 44H17C19.5 42 21.5 38.5 22 34.3C20.2 36.6 17.5 38 14.5 38C9.5 38 5 34 5 28C5 18 18 12 24 4Z";
/** Le carreau, aux flancs creusés. */
const CARREAU = "M23.5 13.3Q27.2 19.4 31.1 23.5Q27.2 27.6 23.5 33.7Q19.8 27.6 15.9 23.5Q19.8 19.4 23.5 13.3Z";

/** Le Rouge et le Noir : le jeton rouge, huit encoches, frappé d'un carreau blanc. */
const rouletteRouge: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <circle cx="24.8" cy="24.8" r="19" fill={shade(C.cerise, -0.45)} />
    <circle cx="23.5" cy="23.5" r="19" fill={C.cerise} />
    {/* Les encoches de la tranche, le médaillon, l'emblème */}
    <circle cx="23.5" cy="23.5" r="15.7" fill="none" stroke={C.blanc} strokeWidth="4" strokeDasharray="5.4 6.931" strokeDashoffset="2.7" />
    <circle cx="23.5" cy="23.5" r="12.3" fill={shade(C.cerise, -0.2)} />
    <path d={CARREAU} fill={C.blanc} />
  </Svg>
);

/** Le Rouge et le Noir : le jeton noir, six encoches, frappé d'un pique blanc. */
const rouletteNoir: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <circle cx="24.8" cy="24.8" r="19" fill={C.grisFonce} />
    <circle cx="23.5" cy="23.5" r="19" fill={C.noir} />
    {/* Les encoches de la tranche, le médaillon, l'emblème */}
    <circle cx="23.5" cy="23.5" r="15.7" fill="none" stroke={C.blanc} strokeWidth="4" strokeDasharray="6.8 9.641" strokeDashoffset="3.4" />
    <circle cx="23.5" cy="23.5" r="12.3" fill={shade(C.noir, 0.14)} />
    <path d={PIQUE} transform="translate(11.5 11.5) scale(0.5)" fill={C.blanc} />
  </Svg>
);

// ---------------------------------------------------------------------------
// Bâbord, Tribord : deux fanaux, sur une case bleu nuit.
// Le rouge est rond, halo rond, et penche à gauche ; le vert est à pans, halo en étoile, et penche à droite.

/** Les feux de navigation, vifs sur la nuit : le rouge de bâbord, le vert de tribord. */
const FEU_ROUGE = "#FF4F58";
const FEU_VERT = "#35D98C";
/** Le laiton en aplat, pour les traits trop fins pour un dégradé. */
const LAITON = "#D9AE55";

/** Bâbord, Tribord : le fanal de bâbord, globe rouge sous son dôme de laiton. */
const fanalBabord: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Le halo, rond */}
    <circle cx="24.4" cy="27" r="16.8" fill={FEU_ROUGE} fillOpacity="0.22" />
    <circle cx="24.4" cy="27" r="13" fill={FEU_ROUGE} fillOpacity="0.3" />
    <g transform="rotate(-8 24 24)">
      {/* L'anneau, le dôme, le col */}
      <circle cx="24" cy="7.6" r="2.7" fill="none" stroke={METAL.laiton} strokeWidth="1.7" />
      <path d="M19.2 15.5Q19.2 10.2 24 10.2Q28.8 10.2 28.8 15.5Z" fill={METAL.laiton} />
      <rect x="16.4" y="15" width="15.2" height="3.2" rx="1.2" fill={METAL.laiton} />
      {/* Le globe, son cœur brûlant, la flamme */}
      <circle cx="24" cy="27" r="9.6" fill={FEU_ROUGE} />
      <circle cx="23.2" cy="26.2" r="6" fill={shade(FEU_ROUGE, 0.45)} />
      <path d="M23.6 22.6Q26.6 26 25.6 28.4A2.5 2.5 0 0 1 20.9 27.6Q21.4 25 23.6 22.6Z" fill={C.creme} />
      {/* Les arceaux, le socle */}
      <path d="M18.6 18Q12.4 27 18.6 36M29.4 18Q35.6 27 29.4 36" fill="none" stroke={LAITON} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="15.8" y="35.6" width="16.4" height="3.2" rx="1.2" fill={METAL.laiton} />
      <rect x="18.6" y="38.4" width="10.8" height="2.8" rx="1.2" fill={METAL.laiton} />
    </g>
  </Svg>
);

/** Bâbord, Tribord : le fanal de tribord, verre vert à pans sous son toit pointu. */
const fanalTribord: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    {/* Le halo, en étoile à huit branches */}
    <path d="M23.6 10.2L27.9 16.7L35.5 15.1L33.9 22.7L40.4 27L33.9 31.3L35.5 38.9L27.9 37.3L23.6 43.8L19.3 37.3L11.7 38.9L13.3 31.3L6.8 27L13.3 22.7L11.7 15.1L19.3 16.7Z" fill={FEU_VERT} fillOpacity="0.24" />
    <circle cx="23.6" cy="27" r="11.4" fill={FEU_VERT} fillOpacity="0.26" />
    <g transform="rotate(8 24 24)">
      {/* L'anneau, le toit */}
      <circle cx="24" cy="7.6" r="2.7" fill="none" stroke={METAL.laiton} strokeWidth="1.7" />
      <path d="M24 9.8L33.6 17.8H14.4Z" fill={METAL.laiton} />
      {/* Le verre à trois pans, la flamme */}
      <path d="M15.4 17.8H21L22 36H18.4Z" fill={FEU_VERT} />
      <path d="M21 17.8H27L26 36H22Z" fill={shade(FEU_VERT, 0.4)} />
      <path d="M27 17.8H32.6L29.6 36H26Z" fill={shade(FEU_VERT, -0.25)} />
      <path d="M23.8 22.4Q26.4 25.8 25.6 28A2.2 2.2 0 0 1 21.6 27.4Q22 25 23.8 22.4Z" fill={C.creme} />
      {/* Les montants, le socle */}
      <path d="M21 17.8L22 36M27 17.8L26 36" fill="none" stroke={LAITON} strokeWidth="1.2" />
      <path d="M16.6 35.6H31.4L30.4 39H17.6Z" fill={METAL.laiton} />
      <rect x="19" y="38.6" width="10" height="2.6" rx="1" fill={METAL.laiton} />
    </g>
  </Svg>
);

// ---------------------------------------------------------------------------
// Éclipse Totale : deux astres, sur une case violet nuit.

/** Éclipse Totale : le soleil d'or, seize rayons pointus, un long, un court. */
const astreSoleil: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d="M24 4L26.4 11.2L21.6 11.2ZM30.6 8.1L30.6 12.8L27.3 11.4ZM38.1 9.9L34.7 16.6L31.4 13.3ZM39.9 17.4L36.6 20.7L35.2 17.4ZM44 24L36.8 26.4L36.8 21.6ZM39.9 30.6L35.2 30.6L36.6 27.3ZM38.1 38.1L31.4 34.7L34.7 31.4ZM30.6 39.9L27.3 36.6L30.6 35.2ZM24 44L21.6 36.8L26.4 36.8ZM17.4 39.9L17.4 35.2L20.7 36.6ZM9.9 38.1L13.3 31.4L16.6 34.7ZM8.1 30.6L11.4 27.3L12.8 30.6ZM4 24L11.2 21.6L11.2 26.4ZM8.1 17.4L12.8 17.4L11.4 20.7ZM9.9 9.9L16.6 13.3L13.3 16.6ZM17.4 8.1L20.7 11.4L17.4 12.8Z" fill={C.mimosa} />
    <circle cx="24" cy="24" r="10.8" fill={METAL.or} />
    <path d="M16.6 22.4A7.6 7.6 0 0 1 22.4 16.6" fill="none" stroke={shade(C.mimosa, 0.6)} strokeWidth="1.9" strokeLinecap="round" />
  </Svg>
);

/** Le croissant de lune, ouvert vers le haut à droite. */
const CROISSANT = "M25.36 4.44A19 19 0 1 0 41.69 30.57A15.5 15.5 0 1 1 25.36 4.44Z";

/** Éclipse Totale : le croissant de lune d'argent, ses cratères, son étoile. */
const astreLune: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <path d={CROISSANT} transform="translate(1.2 1.2)" fill={C.ardoise} />
    <path d={CROISSANT} fill={METAL.argent} />
    <g fill={C.gris} fillOpacity="0.6">
      <circle cx="14.1" cy="26.4" r="2.3" />
      <circle cx="20.1" cy="34.9" r="1.7" />
      <circle cx="12.2" cy="17.8" r="1.4" />
    </g>
    <path d="M33.1 10.4L34.6 14.3L38.8 14.5L35.6 17.2L36.6 21.3L33.1 19L29.6 21.3L30.6 17.2L27.4 14.5L31.6 14.3Z" fill={C.blanc} />
  </Svg>
);

// ---------------------------------------------------------------------------
// Les pions : ils avancent de case en case, par-dessus des cases de couleur.
// Un liseré ivoire, taillé dans la silhouette, les détache de n'importe quel fond.

/** Le liseré d'un pion : sa silhouette en ivoire, épaissie d'un trait de 1,7 de chaque côté. */
const LISERE = { fill: C.ivoire, stroke: C.ivoire, strokeWidth: 3.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** Une pince, pointe en l'air (celle du homard de symbols.tsx). */
const PINCE = "M12 19C7 19 3.5 15 4 10C4.3 7 6 5 8 4C9.5 6 10 8 10 10.5C11 8.5 12 7 13.5 6C15.5 9 15.5 14 14 17Z";
/** La carapace du crabe, vue de face. */
const CARAPACE = "M11 27C11 21.5 16.5 19.5 24 19.5C31.5 19.5 37 21.5 37 27C37 33 31.5 37 24 37C16.5 37 11 33 11 27Z";
/** Ses six pattes, ses deux bras, les tiges de ses yeux. */
const PATTES = "M12.4 28.6Q8.4 28.6 7.2 32.6M13.2 32Q9.6 32.8 8.4 37M15.8 35Q13 36.2 12 40M35.6 28.6Q39.6 28.6 40.8 32.6M34.8 32Q38.4 32.8 39.6 37M32.2 35Q35 36.2 36 40";
const BRAS = "M14.6 25.5L13.6 19.6M33.4 25.5L34.4 19.6";
const TIGES = "M20.6 21.5L19.9 14.5M27.4 21.5L28.1 14.5";

/** Saute-Crabe : le petit crabe rouge, de face, pinces en l'air, deux points noirs pour les yeux au bout de leurs tiges. */
const pionCrabe: Art = (props) => {
  const ombre = shade(C.cerise, -0.28);
  return (
    <Svg viewBox="0 0 48 48" {...props}>
      {/* Le liseré : la silhouette, et les creux entre les pinces et les yeux */}
      <g {...LISERE}>
        <path d={PATTES} fill="none" strokeWidth="5.8" />
        <path d={BRAS} fill="none" strokeWidth="6.8" />
        <rect x="15.5" y="12.4" width="17" height="8.6" />
        <path d={PINCE} transform="translate(2.4 3.4) scale(0.88)" />
        <path d={PINCE} transform="matrix(-0.88 0 0 0.88 45.6 3.4)" />
        <path d={CARAPACE} />
        <circle cx="19.9" cy="12.2" r="2.9" />
        <circle cx="28.1" cy="12.2" r="2.9" />
      </g>
      {/* Les pattes, les bras, les pinces */}
      <path d={PATTES} fill="none" stroke={ombre} strokeWidth="2.4" strokeLinecap="round" />
      <path d={BRAS} fill="none" stroke={ombre} strokeWidth="3.4" strokeLinecap="round" />
      <path d={PINCE} transform="translate(2.4 3.4) scale(0.88)" fill={C.cerise} />
      <path d={PINCE} transform="matrix(-0.88 0 0 0.88 45.6 3.4)" fill={C.cerise} />
      <ellipse cx="8.4" cy="13.6" rx="1.1" ry="2.6" transform="rotate(12 8.4 13.6)" fill={C.ceriseClair} />
      {/* Les yeux au bout de leurs tiges, un reflet dans chacun */}
      <path d={TIGES} fill="none" stroke={C.cerise} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="19.9" cy="12.2" r="2.9" fill={C.noir} />
      <circle cx="28.1" cy="12.2" r="2.9" fill={C.noir} />
      <circle cx="19" cy="11.3" r="1" fill={C.blanc} />
      <circle cx="27.2" cy="11.3" r="1" fill={C.blanc} />
      {/* La carapace, son ombre, son reflet */}
      <path d={CARAPACE} fill={C.cerise} />
      <path d="M37 27C37 33 31.5 37 24 37C20.25 37 17 36 14.69 34.25C22 35.6 33 33.5 37 27Z" fill={ombre} />
      <ellipse cx="18.4" cy="23.4" rx="3.6" ry="1.4" transform="rotate(-14 18.4 23.4)" fill={C.ceriseClair} />
    </Svg>
  );
};

/** L'enveloppe de la montgolfière, puis le vide entre ses suspentes, que le liseré comble. */
const ENVELOPPE = "M24 5.8C33.4 5.8 39.5 11.6 39.5 18.6C39.5 24.6 33.6 28 29.6 31.5H18.4C14.4 28 8.5 24.6 8.5 18.6C8.5 11.6 14.6 5.8 24 5.8Z";
const SUSPENTES = "M18.6 31.5H29.4L29.2 37.4H18.8Z";

/** Le Pari de Sir Auguste : la montgolfière, fuseaux bordeaux et or, nacelle d'osier. */
const pionMontgolfiere: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g {...LISERE}>
      <path d={ENVELOPPE} />
      <path d={SUSPENTES} />
      <rect x="18.4" y="36.6" width="11.2" height="5.6" rx="1.4" />
    </g>
    {/* Les fuseaux : bordeaux, or, bordeaux, or, bordeaux */}
    <path d={ENVELOPPE} fill={C.bordeaux} />
    <path d="M24 5.8C30.4 5.8 34.5 11.6 34.5 18.6C34.5 24.6 30.3 28 27.6 31.5H25.4C26.6 28 28.5 24.6 28.5 18.6C28.5 11.6 26.7 5.8 24 5.8Z" fill={METAL.or} />
    <path d="M24 5.8C17.6 5.8 13.5 11.6 13.5 18.6C13.5 24.6 17.7 28 20.4 31.5H22.6C21.4 28 19.5 24.6 19.5 18.6C19.5 11.6 21.3 5.8 24 5.8Z" fill={METAL.or} />
    {/* Le côté à l'ombre, un reflet */}
    <path d="M24 5.8C33.4 5.8 39.5 11.6 39.5 18.6C39.5 24.6 33.6 28 29.6 31.5H27.2C31.2 28 35.6 24.4 35.6 18.6C35.6 12.2 31 6.9 24 5.8Z" fill={C.prune} fillOpacity="0.4" />
    <ellipse cx="15.6" cy="13.6" rx="1.9" ry="4" transform="rotate(30 15.6 13.6)" fill={C.blanc} fillOpacity="0.4" />
    {/* Le col, les suspentes, la nacelle et son rebord */}
    <rect x="18.4" y="31" width="11.2" height="2.2" rx="0.8" fill={C.prune} />
    <path d="M19.6 33.2L20.4 37M28.4 33.2L27.6 37M24 33.2V37" fill="none" stroke={C.boisFonce} strokeWidth="1" />
    <rect x="18.4" y="36.6" width="11.2" height="5.6" rx="1.4" fill={C.bois} />
    <path d="M24.6 36.6H28.2C29 36.6 29.6 37.2 29.6 38V40.8C29.6 41.6 29 42.2 28.2 42.2H24.6Z" fill={C.boisFonce} />
    <rect x="18" y="36.4" width="12" height="1.8" rx="0.9" fill={C.boisFonce} />
  </Svg>
);

/** Le Gratte-Ciel : la cabine d'ascenseur dorée, fronton à gradins, flèche vers le haut. */
const pionAscenseur: Art = (props) => (
  <Svg viewBox="0 0 48 48" {...props}>
    <g {...LISERE}>
      <rect x="23" y="5.9" width="2" height="4" />
      <rect x="17" y="8.2" width="14" height="3.4" />
      <rect x="13" y="10.6" width="22" height="3.4" />
      <rect x="9.4" y="13" width="29.2" height="29.2" rx="1.2" />
    </g>
    {/* Le câble, le fronton à gradins */}
    <rect x="23" y="5.9" width="2" height="2.9" fill={C.grisFonce} />
    <rect x="17" y="8.2" width="14" height="3" fill={METAL.or} />
    <rect x="13" y="10.6" width="22" height="3" fill={METAL.laiton} />
    {/* La cabine, sa plinthe */}
    <rect x="9.4" y="13" width="29.2" height="29.2" rx="1.2" fill={METAL.or} />
    <path d="M9.4 40.4H38.6V41C38.6 41.7 38.1 42.2 37.4 42.2H10.6C9.9 42.2 9.4 41.7 9.4 41Z" fill={C.mimosaFonce} />
    {/* Le cadran et sa flèche */}
    <rect x="16" y="14.4" width="16" height="11.2" rx="2" fill={C.nuit} />
    <path d="M24 15.6L30.2 20.6H25.7V24.4H22.3V20.6H17.8Z" fill={C.mimosa} />
    {/* La porte : deux vantaux à chevrons dans leur embrasure */}
    <rect x="12.6" y="27" width="22.8" height="13.4" fill={C.nuit} />
    <rect x="14.2" y="28.6" width="9" height="11.8" fill={shade(C.mimosa, 0.3)} />
    <rect x="24.8" y="28.6" width="9" height="11.8" fill={C.mimosa} />
    <path d="M14.2 35.4L23.2 30.8M24.8 30.8L33.8 35.4M14.2 39.6L23.2 35M24.8 35L33.8 39.6" fill="none" stroke={C.mimosaFonce} strokeWidth="1.5" />
  </Svg>
);

export const SYMBOLS_3: Record<string, Art> = {
  "cocktail:citron": cocktailCitron,
  "cocktail:orange": cocktailOrange,
  "cocktail:fraise": cocktailFraise,
  "cocktail:cerise": cocktailCerise,
  "cocktail:ananas": cocktailAnanas,
  "cocktail:coco": cocktailCoco,
  "cocktail:menthe": cocktailMenthe,
  "cocktail:olive": cocktailOlive,
  "cocktail:glacon": cocktailGlacon,
  "cocktail:cafe": cocktailCafe,
  "cocktail:sirop": cocktailSirop,
  "cocktail:bulles": cocktailBulles,
  "cocktail:sucre": cocktailSucre,
  "cocktail:ombrelle": cocktailOmbrelle,

  "roulette:rouge": rouletteRouge,
  "roulette:noir": rouletteNoir,

  "fanal:babord": fanalBabord,
  "fanal:tribord": fanalTribord,

  "astre:soleil": astreSoleil,
  "astre:lune": astreLune,

  "pion:crabe": pionCrabe,
  "pion:montgolfiere": pionMontgolfiere,
  "pion:ascenseur": pionAscenseur,
};
