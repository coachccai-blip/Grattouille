// Moteur `duel` : battre l'adversaire (BRIEF.md, section 7.6).

import type { TicketDef } from "../../shared/types";
import {
  decoy, mulberry32, optNumber, optString, optStrings, palette, randBetween, range, shuffle, splitGain,
  type Match, type Rng,
} from "./common";

export type DuelSkin = "foot" | "cartes" | "course";

export interface DuelOptions {
  rounds: number;
  skin: DuelSkin;
  opponents?: readonly string[];
}

export interface DuelRound {
  /**
   * Ta valeur. `foot` : buts de 0 à 5. `cartes` : main de 12 à 21.
   * `course` : chrono en centièmes de seconde, de 7 000 (1:10.00) à 9 999 (1:39.99).
   */
  you: number;
  /** Celle de l'adversaire. En `cartes`, de 17 à 21, ou plus de 21 : le croupier saute. */
  them: number;
  amount: number;
  /** Nom de l'adversaire, pour l'habillage `foot`. */
  opponent?: string;
}

export interface DuelLayout {
  engine: "duel";
  skin: DuelSkin;
  rounds: DuelRound[];
}

/** Vrai si la manche est gagnée. Égalité : pas de gain. */
export function roundWon(skin: DuelSkin, you: number, them: number): boolean {
  switch (skin) {
    case "foot": return you > them;               // le plus grand score gagne
    case "cartes": return them > 21 || you > them; // main strictement plus forte, ou le croupier saute
    case "course": return you < them;             // le plus petit chrono gagne
  }
}

const COURSE_MIN = 7_000;
const COURSE_MAX = 9_999;

function makeRound(skin: DuelSkin, won: boolean, rng: Rng): { you: number; them: number } {
  switch (skin) {
    case "foot": {
      if (won) {
        const you = randBetween(rng, 1, 5);
        return { you, them: randBetween(rng, 0, you - 1) };
      }
      if (rng() < 0.25) {
        const draw = randBetween(rng, 0, 4);
        return { you: draw, them: draw };
      }
      const them = randBetween(rng, 1, 5);
      return { you: randBetween(rng, 0, them - 1), them };
    }
    case "cartes": {
      if (won) {
        if (rng() < 0.35) return { you: randBetween(rng, 12, 21), them: randBetween(rng, 22, 26) };
        const them = randBetween(rng, 17, 20);
        return { you: randBetween(rng, them + 1, 21), them };
      }
      if (rng() < 0.2) {
        const draw = randBetween(rng, 17, 21);
        return { you: draw, them: draw };
      }
      const them = randBetween(rng, 17, 21);
      return { you: randBetween(rng, 12, them - 1), them };
    }
    case "course": {
      // Des chronos serrés : quelques centièmes à quelques secondes d'écart.
      const gap = randBetween(rng, 1, 320);
      const fast = randBetween(rng, COURSE_MIN, COURSE_MAX - gap);
      const slow = fast + gap;
      if (won) return { you: fast, them: slow };
      if (rng() < 0.03) return { you: fast, them: fast };
      return { you: slow, them: fast };
    }
  }
}

export function buildDuel(
  pal: readonly number[], opts: DuelOptions, gain: number, rng: Rng, maxParts = 3,
): DuelLayout {
  const parts = splitGain(gain, pal, Math.min(maxParts, opts.rounds), rng);
  const positions = shuffle(range(opts.rounds), rng);
  const names = opts.opponents && opts.opponents.length > 0 ? shuffle(opts.opponents, rng) : [];
  const rounds = new Array<DuelRound>(opts.rounds);
  positions.forEach((pos, i) => {
    const won = i < parts.length;
    const values = makeRound(opts.skin, won, rng);
    const round: DuelRound = { ...values, amount: won ? parts[i]! : decoy(pal, rng) };
    if (names.length > 0) round.opponent = names[pos % names.length]!;
    rounds[pos] = round;
  });
  return { engine: "duel", skin: opts.skin, rounds };
}

export function duelOptions(def: TicketDef): DuelOptions {
  return {
    rounds: optNumber(def.options, "rounds", 4),
    skin: optString<DuelSkin>(def.options, "skin", "foot"),
    opponents: optStrings(def.options, "opponents"),
  };
}

export function buildLayout(def: TicketDef, gain: number, seed: number): DuelLayout {
  return buildDuel(palette(def), duelOptions(def), gain, mulberry32(seed));
}

/** Somme des montants des manches gagnées. */
export function evaluate(layout: DuelLayout): number {
  let total = 0;
  for (const r of layout.rounds) if (roundWon(layout.skin, r.you, r.them)) total += r.amount;
  return total;
}

/** Deux cases à gratter par manche : la rencontre, puis le montant. */
export function cellIds(layout: DuelLayout): string[] {
  return layout.rounds.flatMap((_, i) => [`r${i}m`, `r${i}a`]);
}

export function matches(layout: DuelLayout, revealed: ReadonlySet<string>): Match[] {
  const out: Match[] = [];
  layout.rounds.forEach((r, i) => {
    if (!roundWon(layout.skin, r.you, r.them)) return;
    if (revealed.has(`r${i}m`) && revealed.has(`r${i}a`)) {
      out.push({ key: `duel:${i}`, cells: [`r${i}m`, `r${i}a`], amount: r.amount });
    }
  });
  return out;
}

/** 7 512 donne « 1:15.12 ». */
export function formatChrono(centis: number): string {
  const minutes = Math.floor(centis / 6000);
  const seconds = Math.floor((centis % 6000) / 100);
  const hundredths = centis % 100;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}
