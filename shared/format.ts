// Affichage des montants (BRIEF.md, section 6.1). Une seule fonction : formatEuros.

/** Espace fine insécable, entre les groupes de trois chiffres. */
export const THIN = " ";
/** Espace insécable, avant l'unité. */
export const NBSP = " ";

/** Entier avec séparateur de milliers : « 250 000 ». */
export function formatInt(n: number): string {
  const v = Math.trunc(Math.abs(n));
  const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  return n < 0 ? `-${s}` : s;
}

/** `hundredths` : la valeur en centièmes d'unité. Deux décimales au plus, sans zéro inutile. */
function twoDecimals(hundredths: number): string {
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  if (frac === 0) return formatInt(whole);
  if (frac % 10 === 0) return `${formatInt(whole)},${frac / 10}`;
  return `${formatInt(whole)},${String(frac).padStart(2, "0")}`;
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
  if (!Number.isFinite(n)) return `0${NBSP}€`;
  if (n < 0) return `-${formatEuros(-n)}`;
  const v = Math.round(n);
  if (v < 1_000_000) return `${formatInt(v)}${NBSP}€`;
  // En centièmes de million. À 1 000,00 M€ on passe aux milliards.
  const millions = Math.round(v / 10_000);
  if (millions < 100_000) return `${twoDecimals(millions)}${NBSP}M€`;
  // En centièmes de milliard. À 1 000,00 Md€ on passe aux billions.
  const milliards = Math.round(v / 10_000_000);
  if (milliards < 100_000) return `${twoDecimals(milliards)}${NBSP}Md€`;
  // En centièmes de billion. Au-delà de 999 Bn€, plus de décimales.
  const billions = Math.round(v / 10_000_000_000);
  if (billions < 100_000) return `${twoDecimals(billions)}${NBSP}Bn€`;
  return `${formatInt(Math.round(v / 1_000_000_000_000))}${NBSP}Bn€`;
}

/** Pourcentage français à une décimale : 0.615 donne « 61,5 % ». */
export function formatPercent(share: number): string {
  const tenths = Math.round(share * 1000);
  const whole = Math.floor(tenths / 10);
  const dec = tenths % 10;
  return `${whole},${dec}${NBSP}%`;
}

/** Retour moyen : 2.59 donne « 2,59 € ». */
export function formatReturn(x: number): string {
  const cents = Math.round(x * 100);
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}${NBSP}€`;
}
