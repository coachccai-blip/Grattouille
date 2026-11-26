// Les pots annexes, comme au poker classique (POKER.md, section 1).
//
// Un joueur à tapis ne peut gagner, de chaque adversaire, que ce qu'il a lui-même mis.
// On découpe donc le pot par paliers : un palier par hauteur de mise d'un joueur encore
// en jeu. L'argent des joueurs couchés reste dans les paliers qu'il a atteints.

export interface Stake {
  seat: number;
  /** Tout ce que le joueur a versé dans cette main, blinde comprise. */
  amount: number;
  /** Encore en jeu (pas couché). */
  live: boolean;
}

export interface Pot {
  amount: number;
  /** Les sièges qui peuvent prétendre à ce pot : encore en jeu, et montés jusqu'à ce palier. */
  eligible: number[];
}

/**
 * Découpe le pot. `dead` : l'argent sans propriétaire (le pot resté de la main
 * précédente) ; il rejoint le pot principal, auquel tous les joueurs en jeu prétendent.
 * La somme des pots rendus vaut toujours la somme des mises plus `dead`.
 */
export function sidePots(stakes: readonly Stake[], dead = 0): Pot[] {
  const levels = [...new Set(stakes.filter((s) => s.live && s.amount > 0).map((s) => s.amount))].sort((a, b) => a - b);
  const pots: Pot[] = [];
  let below = 0;
  for (const level of levels) {
    let amount = 0;
    for (const s of stakes) amount += Math.min(s.amount, level) - Math.min(s.amount, below);
    pots.push({ amount, eligible: stakes.filter((s) => s.live && s.amount >= level).map((s) => s.seat) });
    below = level;
  }
  // Ce qui dépasse la plus haute mise encore en jeu. Le moteur rend la mise non suivie
  // avant l'abattage : il ne reste rien ici, sauf si plus personne n'est en jeu.
  let above = 0;
  for (const s of stakes) above += Math.max(0, s.amount - below);
  if (pots.length === 0) pots.push({ amount: 0, eligible: [] });
  pots[pots.length - 1]!.amount += above;
  pots[0]!.amount += dead;
  return pots;
}

/**
 * Partage un pot entre des gagnants à égalité. `order` : les sièges dans l'ordre de
 * parole, le premier après le donneur d'abord ; les euros indivisibles lui reviennent,
 * puis aux suivants, un par un.
 */
export function splitPot(amount: number, winners: readonly number[], order: readonly number[]): { seat: number; amount: number }[] {
  if (winners.length === 0) return [];
  const sorted = [...winners].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const share = Math.floor(amount / sorted.length);
  let odd = amount - share * sorted.length;
  return sorted.map((seat) => {
    const extra = odd > 0 ? 1 : 0;
    odd -= extra;
    return { seat, amount: share + extra };
  });
}
