// Typographie française : les espaces insécables que l'on ne tape pas au clavier.
// Les textes du jeu s'écrivent avec des espaces ordinaires ; `typo` pose les
// insécables au moment de l'affichage, pour qu'une ligne ne commence jamais par
// « ! », « ? », « : » ou « € », et qu'un guillemet ne reste jamais seul.
//
// La fabrique JSX du projet (src/jsx) l'applique à tous les textes affichés :
// il n'y a rien à appeler à la main.

/** Espace insécable : avant « : », à l'intérieur des guillemets, avant une unité. */
const NBSP = " ";
/** Espace fine insécable : avant « ; », « ! » et « ? ». */
const FINE = " ";

/** Rien à faire dans la plupart des textes : ce test les écarte d'un coup. */
const NEEDED = / [;:!?»€%★Mh]|« |M(?:me|lle|\.) /;

export function typo(text: string): string {
  if (!NEEDED.test(text)) return text;
  return text
    .replace(/ ([;!?])/g, `${FINE}$1`)
    .replace(/ »/g, `${NBSP}»`)
    .replace(/« /g, `«${NBSP}`)
    // Deux-points de ponctuation seulement : suivis d'une espace ou en fin de texte.
    .replace(/ :(?=\s|$)/g, `${NBSP}:`)
    // « 4 € », « 1 Md€ », « 70 % », « 12 ★ », « 8 h ».
    .replace(/(\d) (?=€|M€|Md€|%|★|h(?![a-zà-ÿ]))/g, `$1${NBSP}`)
    // « Mme Colette », « Mlle Sidonie », « M. Enzo ».
    .replace(/(^|[^\p{L}])(Mme|Mlle|M\.) (?=\p{Lu})/gu, `$1$2${NBSP}`);
}
