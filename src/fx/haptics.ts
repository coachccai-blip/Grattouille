// Vibrations (BRIEF.md, section 14.3), avec navigator.vibrate quand il existe et que
// le réglage est activé. Sur Safari iPhone l'API manque : il ne se passe rien, sans erreur.

import type { Tier } from "../../shared/rules";

let enabled = true;

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
  if (!on) vibrate(0, true);
}

export function hapticsAvailable(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function vibrate(pattern: number | number[], force = false): void {
  if ((!enabled && !force) || !hapticsAvailable()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Refusé par le navigateur : tant pis.
  }
}

/** Motifs en millisecondes. Perdu : aucune vibration. */
const TIER_PATTERNS: Record<Tier, number[] | null> = {
  perdu: null,
  rembourse: null,
  petit: [15],
  joli: [20, 40, 20],
  gros: [30, 40, 30, 40, 60],
  enorme: [40, 40, 40, 40, 40, 40, 120],
  jackpot: [60, 40, 60, 40, 60, 40, 60, 40, 300],
};

export const haptic = {
  /** Grattage : 4 ms, tous les 48 px parcourus, au plus une fois toutes les 60 ms. */
  scratch: () => vibrate(4),
  /** Case révélée. */
  reveal: () => vibrate(10),
  /** Achat. */
  buy: () => vibrate(12),
  tier: (tier: Tier) => {
    const pattern = TIER_PATTERNS[tier];
    if (pattern) vibrate(pattern);
  },
};
