// Le tour d'enchères : ce qu'un joueur a le droit de faire quand c'est à lui de parler
// (POKER.md, section 1). Un seul tour, sans limite :
// - parole si personne n'a misé ;
// - mise : d'une blinde au moins, et jusqu'à tout son tapis ;
// - relance : d'une blinde au moins au-dessus de la mise à égaler, et jusqu'à tout son
//   tapis ; trois relances au plus dans le tour (ensuite on suit ou on se couche) ;
// - tapis : permis dès qu'on peut miser ou relancer, et toujours pour suivre quand on n'a
//   pas de quoi suivre ; un tapis plus petit que la mise minimale reste permis.

import { MAX_RAISES } from "./rules";
import type { Range } from "./types";

export interface BetOptions {
  check: boolean;
  /** Ce qu'il faut ajouter pour suivre (plafonné par le tapis). 0 : rien à suivre. */
  call: number;
  /** Fourchette de la première mise. */
  bet: Range | null;
  /** Fourchette de la relance : la mise totale du joueur dans le tour, après la relance. */
  raise: Range | null;
  /** Le joueur peut pousser tout son tapis. */
  allIn: boolean;
}

export interface BetContext {
  /** Tout l'argent au milieu. Ne borne plus rien depuis que les enchères sont sans limite. */
  pot: number;
  /** La mise à égaler dans le tour. */
  bet: number;
  raises: number;
  blind: number;
  /** Ce que le joueur a déjà misé dans le tour. */
  mine: number;
  stack: number;
  /** Les adversaires qui peuvent encore répondre : ni couchés, ni à tapis. */
  rivals: number;
}

export function betOptions(c: BetContext): BetOptions {
  const owe = Math.max(0, c.bet - c.mine);
  const options: BetOptions = {
    check: owe === 0,
    call: owe > 0 ? Math.min(owe, c.stack) : 0,
    bet: null,
    raise: null,
    allIn: false,
  };
  if (c.stack <= 0) return options;
  // Suivre avec tout ce qu'on a, quand on n'a pas de quoi suivre : toujours permis.
  if (owe > 0 && c.stack <= owe) {
    options.allIn = true;
    return options;
  }
  // Miser ou relancer n'a de sens que si quelqu'un peut répondre.
  if (c.rivals <= 0) return options;
  if (c.bet === 0) {
    // Sans limite : d'une blinde à tout le tapis.
    options.bet = { min: Math.min(c.blind, c.stack), max: c.stack };
    options.allIn = true;
    return options;
  }
  // Après la troisième relance, on ne peut plus que suivre ou se coucher.
  if (c.raises >= MAX_RAISES) return options;
  const all = c.mine + c.stack;
  options.raise = { min: Math.min(c.bet + c.blind, all), max: all };
  options.allIn = true;
  return options;
}
