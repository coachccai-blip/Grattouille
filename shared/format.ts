// Affichage des montants (BRIEF.md, section 6.1). Une seule fonction : formatEuros.
//
// Deux écritures. La française, celle du brief : « 9 500 € », « 1,25 M€ », « 1,25 Md€ »,
// « 1,25 Bn€ ». L'anglaise, quand le jeu est joué en anglais : « €9,500 », « €1.25M »,
// « €1.25B » (billion, le milliard), « €1.25T » (trillion, le billion français).
// Le serveur n'écrit qu'à la française ; c'est le client qui choisit avec `setFormatLang`.

export type FormatLang = "fr" | "en";

let formatLang: FormatLang = "fr";

export function setFormatLang(lang: FormatLang): void {
  formatLang = lang;
}

export function getFormatLang(): FormatLang {
  return formatLang;
}

/** Espace fine insécable, entre les groupes de trois chiffres. */
export const THIN = " ";
/** Espace insécable, avant l'unité. */
export const NBSP = " ";

/** Entier avec séparateur de milliers : « 250 000 », ou « 250,000 » à l'anglaise. */
export function formatInt(n: number): string {
  const v = Math.trunc(Math.abs(n));
  const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, formatLang === "en" ? "," : THIN);
  return n < 0 ? `-${s}` : s;
}

/** `hundredths` : la valeur en centièmes d'unité. Deux décimales au plus, sans zéro inutile. */
function twoDecimals(hundredths: number): string {
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  const mark = formatLang === "en" ? "." : ",";
  if (frac === 0) return formatInt(whole);
  if (frac % 10 === 0) return `${formatInt(whole)}${mark}${frac / 10}`;
  return `${formatInt(whole)}${mark}${String(frac).padStart(2, "0")}`;
}

/** Nombre et unité, assemblés selon la langue : « 1,25 Md€ » ou « €1.25B ». */
function euros(number: string, unit: "" | "M" | "Md" | "Bn"): string {
  if (formatLang === "en") return `€${number}${unit === "Md" ? "B" : unit === "Bn" ? "T" : unit}`;
  return `${number}${NBSP}${unit}€`;
}

/**
 * Montant en euros entiers.
 * - Moins de 1 million : séparateur de milliers, « 9 500 € ».
 * - De 1 million à moins de 1 milliard : « 1,25 M€ ».
 * - De 1 milliard à moins de 1 000 milliards : « 1,25 Md€ ».
 * - 1 000 milliards et plus : « 1,25 Bn€ ». Un billion, c'est mille milliards ;
 *   au-delà de 999 Bn€, plus de décimales : « 1 250 Bn€ ».
 * Les décimales sont arrondies au plus proche, comme dans le brief
 * (20 029 535 € s'écrit « 20,03 M€ »).
 */
export function formatEuros(n: number): string {
  if (!Number.isFinite(n)) return euros("0", "");
  if (n < 0) return `-${formatEuros(-n)}`;
  const v = Math.round(n);
  if (v < 1_000_000) return euros(formatInt(v), "");
  // En centièmes de million. À 1 000,00 M€ on passe aux milliards.
  const millions = Math.round(v / 10_000);
  if (millions < 100_000) return euros(twoDecimals(millions), "M");
  // En centièmes de milliard. À 1 000,00 Md€ on passe aux billions.
  const milliards = Math.round(v / 10_000_000);
  if (milliards < 100_000) return euros(twoDecimals(milliards), "Md");
  // En centièmes de billion. Au-delà de 999 Bn€, plus de décimales.
  const billions = Math.round(v / 10_000_000_000);
  if (billions < 100_000) return euros(twoDecimals(billions), "Bn");
  return euros(formatInt(Math.round(v / 1_000_000_000_000)), "Bn");
}

/**
 * Un montant coupé en deux pour tenir sur deux lignes dans une petite case :
 * le nombre, puis son unité. « 1 250 Md€ » donne [« 1 250 », « Md€ »] ; « €1,250B »
 * donne [« €1,250 », « B »]. Un montant sans unité à détacher rend `null`.
 */
export function splitAmount(text: string): [string, string] | null {
  const space = text.lastIndexOf(NBSP);
  if (space > 0) return [text.slice(0, space), text.slice(space + 1)];
  const m = /^(-?€[\d.,]+)([MBT])$/.exec(text);
  return m ? [m[1]!, m[2]!] : null;
}

/** Pourcentage à une décimale : 0.615 donne « 61,5 % », ou « 61.5% » à l'anglaise. */
export function formatPercent(share: number): string {
  const tenths = Math.round(share * 1000);
  const whole = Math.floor(tenths / 10);
  const dec = tenths % 10;
  return formatLang === "en" ? `${whole}.${dec}%` : `${whole},${dec}${NBSP}%`;
}

/** Retour moyen : 2.59 donne « 2,59 € », ou « €2.59 » à l'anglaise. */
export function formatReturn(x: number): string {
  const cents = Math.round(x * 100);
  const whole = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, "0");
  return formatLang === "en" ? `€${whole}.${frac}` : `${whole},${frac}${NBSP}€`;
}
