// Les trophées. Un trophée est une famille et des paliers ; chaque palier atteint est une
// médaille. Tout se calcule à partir de l'état du joueur : rien n'est enregistré à part,
// si bien qu'un compte créé avant les trophées reçoit d'emblée tout ce qu'il a mérité.
// Le nom et la phrase de chaque trophée sont du ressort de l'écran (deux langues).

import { PLACES } from "./places";
import type { PlayerState } from "./types";

const M = 1_000_000;
const MD = 1_000 * M;
const BN = 1_000 * MD;

export type TrophyId =
  | "tickets" | "gain" | "jackpots" | "semeur" | "mecene" | "collection"
  | "voyage" | "patron" | "defis" | "limier" | "maitres" | "legende";

/** Ce que compte une famille : un nombre de fois, ou une somme en euros. */
export type TrophyUnit = "nombre" | "euros";

export interface TrophyFamily {
  id: TrophyId;
  unit: TrophyUnit;
  /** Les paliers, croissants : un par médaille. */
  tiers: readonly number[];
  value(state: PlayerState): number;
}

/** Un compteur de l'état, ou zéro s'il manque (réponse d'un serveur plus ancien). */
function n(x: unknown): number {
  return typeof x === "number" && Number.isFinite(x) && x > 0 ? x : 0;
}

export const TROPHIES: readonly TrophyFamily[] = [
  // Les tickets joués : achetés au comptoir ou ramassés par terre.
  { id: "tickets", unit: "nombre", tiers: [10, 100, 500, 1_500, 5_000], value: (s) => n(s.stats?.tickets) },
  // Le plus gros gain sur un seul ticket.
  { id: "gain", unit: "euros", tiers: [100, 10_000, M, MD, BN, 1_000 * BN], value: (s) => n(s.stats?.bestGain) },
  { id: "jackpots", unit: "nombre", tiers: [1, 5, 25], value: (s) => n(s.stats?.jackpots) },
  // Les tickets laissés tomber par terre pour les nouveaux venus, et ce qu'ils valaient.
  { id: "semeur", unit: "nombre", tiers: [1, 10, 50, 200, 1_000], value: (s) => n(s.stats?.sown) },
  { id: "mecene", unit: "euros", tiers: [1_000, M, MD, BN], value: (s) => n(s.stats?.sownValue) },
  { id: "collection", unit: "nombre", tiers: [10, 50, 110], value: (s) => (Array.isArray(s.owned) ? s.owned.length : 0) },
  // Les lieux ouverts, du Kiosque à la Lune.
  {
    id: "voyage", unit: "nombre", tiers: [2, 4, 8],
    value: (s) => PLACES.filter((place) => n(s.standing) >= place.standing).length,
  },
  { id: "patron", unit: "nombre", tiers: [1], value: (s) => (s.kiosk === true ? 1 : 0) },
  // Le Poker Tricheur.
  { id: "defis", unit: "nombre", tiers: [1, 4, 8], value: (s) => (Array.isArray(s.defis) ? s.defis.length : 0) },
  { id: "limier", unit: "nombre", tiers: [1, 10, 50], value: (s) => n(s.pokerStats?.unmasked) },
  { id: "maitres", unit: "nombre", tiers: [1], value: (s) => n(s.masters) },
  { id: "legende", unit: "nombre", tiers: [1], value: (s) => (s.story?.vraieFin === true ? 1 : 0) },
];

/** Le nombre total de médailles à gagner. */
export const MEDAL_COUNT = TROPHIES.reduce((sum, family) => sum + family.tiers.length, 0);

const BY_ID = new Map<string, TrophyFamily>(TROPHIES.map((family) => [family.id, family]));

export function trophyById(id: string): TrophyFamily | undefined {
  return BY_ID.get(id);
}

/** Le nom d'une médaille : « famille:rang », le rang compté à partir de 1. */
export function medalId(family: TrophyId, rank: number): string {
  return `${family}:${rank}`;
}

/** Combien de paliers d'une famille sont atteints. */
function earnedIn(family: TrophyFamily, state: PlayerState): number {
  const value = family.value(state);
  let earned = 0;
  while (earned < family.tiers.length && value >= family.tiers[earned]!) earned += 1;
  return earned;
}

/** Les médailles gagnées, dans l'ordre des familles puis des rangs. */
export function medalsOf(state: PlayerState): string[] {
  const out: string[] = [];
  for (const family of TROPHIES) {
    const earned = earnedIn(family, state);
    for (let rank = 1; rank <= earned; rank++) out.push(medalId(family.id, rank));
  }
  return out;
}

export interface TrophyProgress {
  /** Ce que la famille compte aujourd'hui. */
  value: number;
  /** Le prochain palier, ou `null` quand tous sont atteints. */
  next: number | null;
  /** Les médailles gagnées dans la famille. */
  earned: number;
  /** Les médailles de la famille. */
  total: number;
}

/** Où en est le joueur dans une famille. Une famille inconnue : tout à zéro. */
export function progressOf(state: PlayerState, family: string): TrophyProgress {
  const def = BY_ID.get(family);
  if (!def) return { value: 0, next: null, earned: 0, total: 0 };
  const earned = earnedIn(def, state);
  return { value: def.value(state), next: def.tiers[earned] ?? null, earned, total: def.tiers.length };
}

/** Les médailles gagnées entre deux états : ce qu'une action vient de débloquer. */
export function newMedals(before: PlayerState | null, after: PlayerState): string[] {
  if (!before) return [];
  const had = new Set(medalsOf(before));
  return medalsOf(after).filter((medal) => !had.has(medal));
}
