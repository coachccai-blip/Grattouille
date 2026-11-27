// Les réglages du Poker Tricheur : limites d'une table, délais, échelle des blindes,
// tables de la maison et défis de la campagne (POKER.md, sections 1 à 3).

import { uniformInt } from "../economy";
import { PLACES, placeById } from "../places";
import { CODE_ALPHABET } from "../rules";
import { cheapestTicket } from "../tickets";
import type { PlaceId } from "../types";
import type { Random32 } from "./cards";
import type { Difficulty } from "./types";

// ---------------------------------------------------------------------------
// Une table

export const MIN_SEATS = 2;
export const MAX_SEATS = 6;
/** La cave (ce qu'un joueur pose sur la table) se compte en blindes. */
export const MIN_BUYIN_BLINDS = 20;
export const MAX_BUYIN_BLINDS = 100;
/** À la création, la blinde ne dépasse pas le quarantième de la bourse du créateur. */
export const BLIND_SHARE = 40;
/** Trois relances au plus dans le tour d'enchères (la première mise n'est pas une relance). */
export const MAX_RAISES = 3;
/** Le code d'une table : cinq caractères de l'alphabet des codes de récupération. */
export const TABLE_CODE_LENGTH = 5;

// ---------------------------------------------------------------------------
// Le temps (en millisecondes)

/** La triche : 20 secondes, pour tout le monde à la fois. */
export const CHEAT_MS = 20_000;
/** Les enchères : 20 secondes par décision. */
export const TURN_MS = 20_000;
/** L'abattage et les accusations : 20 secondes, pour tout le monde à la fois. */
export const ACCUSE_MS = 20_000;
/** Le dénouement reste affiché avant la main suivante. */
export const RESULT_MS = 8_000;
/** Un pot emporté sans abattage se regarde moins longtemps. */
export const WALKOVER_MS = 4_000;
/** Après une attente (un joueur recave, un ami arrive), la main suivante part au bout de ce délai. */
export const RESTART_MS = 3_000;
/** Un robot réfléchit entre une et trois secondes. */
export const BOT_MIN_MS = 1_000;
export const BOT_MAX_MS = 3_000;
/** Deux délais dépassés de suite : le joueur est « absent ». */
export const MISSES_BEFORE_ABSENT = 2;
/** Trois mains de suite sans jouer (absent, ou à sec) : il quitte la table. */
export const IDLE_HANDS_BEFORE_LEAVE = 3;
/** Une table sans activité depuis 30 minutes se ferme. */
export const IDLE_TABLE_MS = 30 * 60_000;
/** Un siège réservé dont la cave n'arrive pas est libéré. */
export const RESERVE_MS = 30_000;

// ---------------------------------------------------------------------------
// Les garde-fous

/** Un robot qui dépasse trois caves maximales met le surplus de côté : les sommes restent bornées. */
export const BOT_STACK_CAVES = 3;
/** Au-delà, l'arithmétique entière ne serait plus exacte : la table ferme et rend les tapis. */
export const MAX_TABLE_CHIPS = 2 ** 52;
/** Le journal d'une table garde ses derniers événements. */
export const LOG_SIZE = 30;
/** Les derniers départs, pour dire à un joueur pourquoi il n'est plus assis. */
export const DEPARTED_SIZE = 6;

// ---------------------------------------------------------------------------
// L'échelle des blindes : 1, 2, 5, 10, 20, 50, 100… jusqu'à 1 000 Md€.

export const MAX_BLIND = 1_000_000_000_000;

export const BLIND_LADDER: readonly number[] = (() => {
  const ladder: number[] = [];
  for (let p = 1; p < MAX_BLIND; p *= 10) ladder.push(p, 2 * p, 5 * p);
  ladder.push(MAX_BLIND);
  return ladder;
})();

export function isBlind(x: unknown): x is number {
  return typeof x === "number" && BLIND_LADDER.includes(x);
}

/** Les blindes qu'une bourse permet à la création d'une table : au plus son quarantième. */
export function allowedBlinds(balance: number): number[] {
  return BLIND_LADDER.filter((blind) => blind * BLIND_SHARE <= balance);
}

export function minBuyIn(blind: number): number {
  return blind * MIN_BUYIN_BLINDS;
}

export function maxBuyIn(blind: number): number {
  return blind * MAX_BUYIN_BLINDS;
}

// ---------------------------------------------------------------------------
// Les robots : ils portent le nom et le portrait des personnages du jeu.

export const DIFFICULTIES: readonly Difficulty[] = ["facile", "normal", "difficile"];

export function isDifficulty(x: unknown): x is Difficulty {
  return typeof x === "string" && (DIFFICULTIES as readonly string[]).includes(x);
}

/** Les identifiants de src/app/dialogues.ts : les huit hôtes, puis les quatre vendeurs. */
export const BOT_PERSONAS: readonly string[] = [
  "gaspard", "ondine", "hector", "baron", "auguste", "balthazar", "taupin", "selene",
  "sidonie", "enzo", "colette", "archibald",
];

/** `count` personnages distincts, tirés au sort. `first`, s'il est donné, ouvre la liste. */
export function pickPersonas(count: number, rng: Random32, first?: string): string[] {
  const pool = BOT_PERSONAS.filter((id) => id !== first);
  const picked: string[] = first ? [first] : [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(uniformInt(pool.length, rng), 1)[0]!);
  }
  return picked.slice(0, count);
}

// ---------------------------------------------------------------------------
// Les tables de la maison et les défis (section 3)

/** Une table de la maison : le joueur, l'hôte du lieu et deux autres personnages. */
export const HOUSE_SEATS = 4;
/** Un défi : un tête-à-tête, 30 blindes de base chacun. */
export const CHALLENGE_BLINDS = 30;
/** La cagnotte de l'hôte : 100 blindes de base de son lieu, versées une seule fois. */
export const CHALLENGE_BONUS_BLINDS = 100;
/**
 * Un défi est un duel court : une quinzaine de mains. La blinde y double de palier en
 * palier, alors que les caves ne bougent pas. Les trois premiers paliers durent quatre
 * mains (la blinde de base, puis 2 fois, puis 4 fois), les suivants deux mains seulement
 * (8, 16, 32, 64 fois) : passé la douzième main, tout l'argent part vite au milieu.
 * Le dernier nombre de la liste vaut pour tous les paliers suivants.
 */
export const CHALLENGE_LEVEL_HANDS: readonly number[] = [4, 4, 4, 2];

/**
 * Le palier de la main `handNo` (la première porte le numéro 1) : 0, puis 1, 2…
 * `levels` : la durée de chaque palier, en mains ; le dernier nombre vaut pour tous les suivants.
 */
function levelAt(handNo: number, levels: readonly number[]): number {
  let level = 0;
  let left = Math.max(1, Math.floor(handNo)) - 1;
  for (;;) {
    const hands = levels[Math.min(level, levels.length - 1)]!;
    // Garde-fou : la blinde cesse de monter après quelques paliers, inutile de compter sans fin.
    if (left < hands || level >= 60) return level;
    left -= hands;
    level += 1;
  }
}

/**
 * Une blinde qui double de palier en palier. Elle cesse de monter dès qu'elle dépasse tout
 * l'argent en jeu (`everything`) : au-delà, rien ne changerait.
 */
function risingBlind(base: number, handNo: number, levels: readonly number[], everything: number): number {
  let blind = base;
  for (let level = levelAt(handNo, levels); level > 0 && blind < everything; level--) blind *= 2;
  return blind;
}

/** La main où cette blinde montera, après la main `handNo`, et ce qu'elle vaudra. `null` : elle ne montera plus. */
function risingNext(
  base: number, handNo: number, levels: readonly number[], everything: number,
): { hand: number; blind: number } | null {
  const now = risingBlind(base, handNo, levels, everything);
  if (now >= everything) return null;
  // Tant qu'elle n'a pas dépassé tout l'argent en jeu, elle double au palier suivant.
  let hand = Math.max(1, Math.floor(handNo)) + 1;
  while (risingBlind(base, hand, levels, everything) === now) hand += 1;
  return { hand, blind: risingBlind(base, hand, levels, everything) };
}

/**
 * La blinde d'un défi à la main `handNo`. Elle cesse de monter dès qu'elle dépasse tout
 * l'argent en jeu (les deux caves) : au-delà, rien ne changerait.
 */
export function challengeBlind(base: number, handNo: number): number {
  return risingBlind(base, handNo, CHALLENGE_LEVEL_HANDS, base * CHALLENGE_BLINDS * 2);
}

/**
 * La main à laquelle la blinde d'un défi montera, après la main `handNo`, et ce qu'elle
 * vaudra alors. `null` quand elle ne montera plus.
 */
export function challengeRise(base: number, handNo: number): { hand: number; blind: number } | null {
  return risingNext(base, handNo, CHALLENGE_LEVEL_HANDS, base * CHALLENGE_BLINDS * 2);
}

/** Facile au Kiosque et au Grand Café, normal au Casino et au Salon, difficile à partir du Cercle. */
export function difficultyOf(place: PlaceId): Difficulty {
  const index = PLACES.findIndex((p) => p.id === place);
  return index < 2 ? "facile" : index < 4 ? "normal" : "difficile";
}

/** La blinde d'un lieu : le prix de son ticket le moins cher. */
export function placeBlind(place: PlaceId): number {
  return cheapestTicket(place).price;
}

export interface HouseDef {
  place: PlaceId;
  /** L'hôte du lieu : il est toujours à la table. */
  host: string;
  blind: number;
  minBuyIn: number;
  maxBuyIn: number;
  difficulty: Difficulty;
}

export function houseOf(place: PlaceId): HouseDef {
  const blind = placeBlind(place);
  return {
    place, host: placeById(place).host, blind,
    minBuyIn: minBuyIn(blind), maxBuyIn: maxBuyIn(blind), difficulty: difficultyOf(place),
  };
}

export interface ChallengeDef {
  place: PlaceId;
  host: string;
  /** La blinde de base : celle des premières mains. Elle monte ensuite (`challengeBlind`). */
  blind: number;
  /** La cave du défi : 30 blindes de base, ni plus ni moins, pour le joueur comme pour l'hôte. */
  buyIn: number;
  /** Ce que l'hôte verse la première fois qu'il est ruiné : 100 blindes de base. */
  bonus: number;
  difficulty: Difficulty;
}

export function challengeOf(place: PlaceId): ChallengeDef {
  const blind = placeBlind(place);
  return {
    place, host: placeById(place).host, blind,
    buyIn: blind * CHALLENGE_BLINDS, bonus: blind * CHALLENGE_BONUS_BLINDS, difficulty: difficultyOf(place),
  };
}

// ---------------------------------------------------------------------------
// La Table des Maîtres : le joueur contre quatre hôtes tirés au sort, en tournoi

/** Cinq sièges : le joueur et quatre des huit hôtes. */
export const MASTERS_SEATS = 5;
/** La blinde de base : dix billions (10 Bn€). Elle monte au fil des mains. */
export const MASTERS_BLIND = 10_000_000_000_000;
/** La cave de chacun : trente blindes de base, soit 300 Bn€. Pas de recave. */
export const MASTERS_BLINDS = 30;
export const MASTERS_BUYIN = MASTERS_BLIND * MASTERS_BLINDS;

/** Les huit hôtes, du Kiosque à la Lune : c'est parmi eux que la tablée des Maîtres est tirée. */
export const HOSTS: readonly string[] = PLACES.map((place) => place.host);

/** La tablée des Maîtres : quatre hôtes distincts, tirés au sort sans remise parmi les huit. */
export function pickMasters(rng: Random32): string[] {
  const pool = [...HOSTS];
  const picked: string[] = [];
  while (picked.length < MASTERS_SEATS - 1 && pool.length > 0) {
    picked.push(pool.splice(uniformInt(pool.length, rng), 1)[0]!);
  }
  return picked;
}

/**
 * La Table des Maîtres est un tournoi : personne ne recave, et la blinde double de palier en
 * palier jusqu'à dépasser tout l'argent en jeu (les cinq caves). Les paliers raccourcissent :
 * douze mains à la blinde de base, dix à 2 fois, huit à 4 fois, six à 8 fois, puis quatre
 * mains par palier (16, 32, 64, 128 fois ; 256 fois à partir de la 53e main, où elle s'arrête).
 * Le dernier nombre de la liste vaut pour tous les paliers suivants.
 *
 * Réglé par simulation, le joueur tenu par un robot difficile (deux séries de 3 000 tables) :
 * la table se dénoue pour lui en 30 à 31 mains en médiane (10 au 10e centile, 45 au 90e) ;
 * il la gagne une fois sur cinq, en 42 mains en médiane.
 */
export const MASTERS_LEVEL_HANDS: readonly number[] = [12, 10, 8, 6, 4];

/** La blinde de la Table des Maîtres à la main `handNo`, à partir de sa blinde de base. */
export function mastersBlind(base: number, handNo: number): number {
  return risingBlind(base, handNo, MASTERS_LEVEL_HANDS, base * MASTERS_BLINDS * MASTERS_SEATS);
}

/**
 * La main à laquelle la blinde de la Table des Maîtres montera, après la main `handNo`, et
 * ce qu'elle vaudra alors. `null` quand elle ne montera plus.
 */
export function mastersRise(base: number, handNo: number): { hand: number; blind: number } | null {
  return risingNext(base, handNo, MASTERS_LEVEL_HANDS, base * MASTERS_BLINDS * MASTERS_SEATS);
}

// ---------------------------------------------------------------------------
// Le code d'une table

export function newTableCode(rng: Random32): string {
  let code = "";
  for (let i = 0; i < TABLE_CODE_LENGTH; i++) code += CODE_ALPHABET[uniformInt(CODE_ALPHABET.length, rng)];
  return code;
}

/** Retire espaces et tirets, passe en capitales. `null` si ce n'est pas un code de table. */
export function normalizeTableCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== TABLE_CODE_LENGTH) return null;
  for (const ch of code) if (!CODE_ALPHABET.includes(ch)) return null;
  return code;
}
