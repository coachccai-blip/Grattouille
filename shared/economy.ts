// Économie : tempéraments, tableaux de lots, tirage (BRIEF.md, section 6).
// Les chiffres de ce fichier sont contractuels : ne pas les retoucher sans relancer
// `npm run simulate`.

import type { Temperament, TicketDef } from "./types";

// shared/economy.ts — [multiplicateur du prix du ticket, poids sur 100 000]
export const WEIGHT_TOTAL = 100_000; // le reste des poids = ticket perdant
export const TEMPERAMENTS = {
  pepere: [[1, 22000], [2, 18000], [3, 9000], [5, 6500], [10, 3500], [20, 1600], [50, 600], [100, 250], [200, 60], [500, 15]],
  joueur: [[1, 17000], [2, 14000], [3, 8000], [5, 6000], [10, 4000], [20, 1800], [50, 800], [100, 300], [250, 120], [1000, 40]],
  "casse-cou": [[1, 9000], [2, 10000], [5, 9000], [10, 6000], [25, 2000], [50, 800], [100, 350], [500, 200], [1000, 80], [5000, 10]],
} as const;

export const TEMPERAMENT_LABELS: Record<Temperament, string> = {
  pepere: "pépère",
  joueur: "joueur",
  "casse-cou": "casse-cou",
};

/** Multiplicateur du premier ticket d'un compte (section 5.4). */
export const FIRST_TICKET_MULTIPLIER = 5;
/** Multiplicateur du ticket trouvé par terre (section 5.5 du brief : le coup de pouce de la maison). */
export const HOUSE_MULTIPLIER = 3;
/** Un jackpot est un gain d'au moins 500 fois le prix. */
export const JACKPOT_MULTIPLIER = 500;

export function prizeRows(t: Temperament): readonly (readonly [number, number])[] {
  return TEMPERAMENTS[t];
}

/** Les multiplicateurs gagnants d'un tempérament, par ordre croissant. */
export function multipliers(t: Temperament): number[] {
  return TEMPERAMENTS[t].map(([m]) => m);
}

export function winningWeight(t: Temperament): number {
  let sum = 0;
  for (const [, w] of TEMPERAMENTS[t]) sum += w;
  return sum;
}

/** Poids du ticket perdant. */
export function losingWeight(t: Temperament): number {
  return WEIGHT_TOTAL - winningWeight(t);
}

/** Retour moyen par euro misé, calculé exactement. */
export function expectedReturn(t: Temperament): number {
  let sum = 0;
  for (const [m, w] of TEMPERAMENTS[t]) sum += m * w;
  return sum / WEIGHT_TOTAL;
}

/** Proportion de tickets gagnants, entre 0 et 1. */
export function winningShare(t: Temperament): number {
  return winningWeight(t) / WEIGHT_TOTAL;
}

/** Poids cumulé des lots d'au moins `min` fois la mise. */
export function weightAtLeast(t: Temperament, min: number): number {
  let sum = 0;
  for (const [m, w] of TEMPERAMENTS[t]) if (m >= min) sum += w;
  return sum;
}

export function maxMultiplier(t: Temperament): number {
  const rows = TEMPERAMENTS[t];
  return rows[rows.length - 1]![0];
}

/**
 * Tirage (section 6.5) : `r` est un entier uniforme dans [0, 100 000[.
 * On parcourt le tableau en cumulant les poids ; le premier lot dont le cumul
 * dépasse `r` est gagné. Si aucun ne le dépasse, le ticket est perdant (0).
 */
export function drawMultiplier(t: Temperament, r: number): number {
  let cumul = 0;
  for (const [m, w] of TEMPERAMENTS[t]) {
    cumul += w;
    if (cumul > r) return m;
  }
  return 0;
}

/**
 * Entier uniforme dans [0, max[ par rejet, sans biais de modulo.
 * `next32` rend un entier 32 bits non signé (crypto.getRandomValues côté serveur).
 */
export function uniformInt(max: number, next32: () => number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 0x1_0000_0000) throw new RangeError("max invalide");
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  for (;;) {
    const x = next32();
    if (x < limit) return x % max;
  }
}

/** Gain en euros d'un ticket tiré au sort. */
export function drawGain(def: Pick<TicketDef, "price" | "temperament">, next32: () => number): number {
  const r = uniformInt(WEIGHT_TOTAL, next32);
  return drawMultiplier(def.temperament, r) * def.price;
}

function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(x);
}

/**
 * « 1 sur 2,6 », « 1 sur 62 », « 1 sur 6 667 » : une décimale sous 10, entier au-delà.
 * Les arrondis suivent ceux du brief (12,5 donne 12 ; 62,5 donne 62).
 */
export function oddsLabel(weight: number): string {
  if (weight <= 0) return "jamais";
  const ratio = WEIGHT_TOTAL / weight;
  if (ratio < 9.95) {
    const tenths = roundHalfEven(ratio * 10);
    const whole = Math.floor(tenths / 10);
    const dec = tenths % 10;
    return `1 sur ${whole},${dec}`;
  }
  const n = roundHalfEven(ratio);
  return `1 sur ${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
}

export interface PrizeLine {
  multiplier: number; // 0 pour « Perdu »
  amount: number;     // euros
  weight: number;
  odds: string;
}

/** Tableau des lots d'un ticket, converti en euros, du perdant au plus gros lot. */
export function prizeTable(def: Pick<TicketDef, "price" | "temperament">): PrizeLine[] {
  const lines: PrizeLine[] = [];
  const lose = losingWeight(def.temperament);
  lines.push({ multiplier: 0, amount: 0, weight: lose, odds: oddsLabel(lose) });
  for (const [m, w] of TEMPERAMENTS[def.temperament]) {
    lines.push({ multiplier: m, amount: m * def.price, weight: w, odds: oddsLabel(w) });
  }
  return lines;
}

/** Gain maximal d'un ticket, en euros. */
export function maxGain(def: Pick<TicketDef, "price" | "temperament">): number {
  return maxMultiplier(def.temperament) * def.price;
}
