// Règles du jeu : Standing, fortune, lieux, ticket de la maison, paliers, validations
// (BRIEF.md, sections 5, 8.5 et 11).

import { CATALOG, COLLECTION_SIZE, KIOSK, itemById } from "./catalog";
import { HOUSE_MULTIPLIER } from "./economy";
import { PLACES } from "./places";
import { cheapestTicket } from "./tickets";
import type { Look, LookSlot, PendingTicket, PlaceDef, PlaceId, TicketDef } from "./types";

/** On débarque sans un sou : le premier ticket se ramasse par terre. */
export const START_BALANCE = 0;
export const MAX_PENDING = 20;
/** Fauché, on trouve un ticket par terre : un toutes les 20 secondes au plus. */
export const HOUSE_COOLDOWN_MS = 20_000;
/** Et de temps en temps, un coup de chance : un ticket par terre même sans être fauché. */
export const LUCKY_FIND_MS = 8 * 60_000;
export const BUY_COOLDOWN_MS = 1_000;
export const DAILY_TICKET_LIMIT = 6_000;
export const BOARD_SIZE = 200;
export const BOARD_SHOWN = 100;
export const BOARD_PUBLISH_INTERVAL_MS = 30_000;
export const MAX_BODY_BYTES = 4_096;

export const SPECIES = ["renard", "chat", "ours", "lapin", "blaireau", "grenouille", "raton", "herisson"] as const;
export type SpeciesId = (typeof SPECIES)[number];

export const SPECIES_LABELS: Record<SpeciesId, string> = {
  renard: "Renard",
  chat: "Chat",
  ours: "Ours",
  lapin: "Lapin",
  blaireau: "Blaireau",
  grenouille: "Grenouille",
  raton: "Raton laveur",
  herisson: "Hérisson",
};

export function isSpecies(x: unknown): x is SpeciesId {
  return typeof x === "string" && (SPECIES as readonly string[]).includes(x);
}

export const LOOK_SLOTS: readonly LookSlot[] = ["chapeau", "lunettes", "tenue", "accessoire", "vehicule", "residence"];

export function emptyLook(): Look {
  return { chapeau: null, lunettes: null, tenue: null, accessoire: null, vehicule: null, residence: null };
}

// ---------------------------------------------------------------------------
// Standing et fortune

/** Somme des ★ de tous les biens possédés, portés ou non. Ne baisse jamais. */
export function standingOf(owned: readonly string[], kiosk: boolean): number {
  let s = kiosk ? KIOSK.standing : 0;
  for (const id of owned) s += itemById(id)?.standing ?? 0;
  return s;
}

/** Prix d'achat de tous les biens possédés. */
export function assetsValue(owned: readonly string[], kiosk: boolean): number {
  let s = kiosk ? KIOSK.price : 0;
  for (const id of owned) s += itemById(id)?.price ?? 0;
  return s;
}

/** Solde, plus gains des tickets pas encore grattés, plus prix d'achat de tous les biens. */
export function fortuneOf(p: {
  balance: number; pending: readonly PendingTicket[]; owned: readonly string[]; kiosk: boolean;
}): number {
  let f = p.balance + assetsValue(p.owned, p.kiosk);
  for (const t of p.pending) f += t.gain;
  return f;
}

export function collectionComplete(owned: readonly string[]): boolean {
  if (owned.length < COLLECTION_SIZE) return false;
  const set = new Set(owned);
  return CATALOG.every((i) => set.has(i.id));
}

// ---------------------------------------------------------------------------
// Lieux

export function isPlaceOpen(place: PlaceId, standing: number): boolean {
  const def = PLACES.find((p) => p.id === place);
  return !!def && standing >= def.standing;
}

/** Le meilleur lieu débloqué. */
export function bestPlace(standing: number): PlaceDef {
  let best = PLACES[0]!;
  for (const p of PLACES) if (standing >= p.standing) best = p;
  return best;
}

/** Le prochain lieu à ouvrir, ou `null` quand tout est ouvert. */
export function nextPlace(standing: number): PlaceDef | null {
  for (const p of PLACES) if (standing < p.standing) return p;
  return null;
}

/** Les lieux qu'un passage de `before` à `after` ★ vient d'ouvrir. */
export function newlyOpened(before: number, after: number): PlaceDef[] {
  return PLACES.filter((p) => before < p.standing && after >= p.standing);
}

// ---------------------------------------------------------------------------
// Le ticket trouvé par terre (section 5.5 du brief : « le coup de pouce de la maison »)
//
// On ne redescend jamais d'un lieu et on ne reste jamais bloqué. Qui n'a plus de quoi
// jouer trouve un ticket par terre, toujours gagnant. Et de temps en temps, la chance
// en laisse traîner un pour tout le monde.

/** Le ticket trouvé : un exemplaire du ticket le moins cher du meilleur lieu débloqué. */
export function houseTicketDef(standing: number): TicketDef {
  return cheapestTicket(bestPlace(standing).id);
}

export function houseGain(standing: number): number {
  return houseTicketDef(standing).price * HOUSE_MULTIPLIER;
}

/**
 * Condition : aucun ticket en attente, et un solde inférieur au prix du ticket
 * le moins cher du meilleur lieu débloqué. La limite d'un toutes les 20 secondes
 * est vérifiée à part, côté serveur.
 */
export function houseEligible(p: { balance: number; pendingCount: number; standing: number }): boolean {
  return p.pendingCount === 0 && p.balance < houseTicketDef(p.standing).price;
}

/**
 * Pourquoi un ticket traîne par terre, ou `null` s'il n'y en a pas.
 * `since` : le temps écoulé depuis le dernier ticket trouvé, en millisecondes.
 * - `fauche` : plus de quoi jouer, et le dernier ticket trouvé date de 20 secondes au moins ;
 * - `chance` : le dernier ticket trouvé date de 8 minutes au moins, et la pile a de la place.
 */
export function foundReason(p: {
  balance: number; pendingCount: number; standing: number; since: number;
}): "fauche" | "chance" | null {
  if (houseEligible(p)) return p.since >= HOUSE_COOLDOWN_MS ? "fauche" : null;
  return p.since >= LUCKY_FIND_MS && p.pendingCount < MAX_PENDING ? "chance" : null;
}

// ---------------------------------------------------------------------------
// Paliers de résultat (section 8.5)

export type Tier = "perdu" | "rembourse" | "petit" | "joli" | "gros" | "enorme" | "jackpot";

export function tierOf(gain: number, price: number, house = false): Tier {
  if (gain <= 0) return "perdu";
  if (house) return "petit";
  const m = gain / price;
  if (m === 1) return "rembourse";
  if (m < 5) return "petit";
  if (m < 25) return "joli";
  if (m < 100) return "gros";
  if (m < 500) return "enorme";
  return "jackpot";
}

export const TIER_RANK: Record<Tier, number> = {
  perdu: 0, rembourse: 1, petit: 2, joli: 3, gros: 4, enorme: 5, jackpot: 6,
};

/** Durée de la fête, en millisecondes. */
export const TIER_DURATION: Record<Tier, number> = {
  perdu: 400, rembourse: 600, petit: 800, joli: 1200, gros: 1800, enorme: 2500, jackpot: 3500,
};

// ---------------------------------------------------------------------------
// Registre des personnages selon le Standing (section 4.8)

export type Register = "familier" | "poli" | "deferent" | "obsequieux" | "cosmique";

/**
 * Le ton des personnages suit les portes qui s'ouvrent : familier jusqu'au Casino,
 * poli jusqu'au Salon Privé, déférent jusqu'au Cercle, obséquieux ensuite, et
 * franchement dépassé par les événements à partir de la Banque.
 */
export function registerOf(standing: number): Register {
  if (standing < 130) return "familier";
  if (standing < 400) return "poli";
  if (standing < 1_400) return "deferent";
  if (standing < 15_000) return "obsequieux";
  return "cosmique";
}

// ---------------------------------------------------------------------------
// Les Souvenirs : l'histoire de chaque hôte

/** Battre trois fois un hôte au poker ouvre son histoire, dans les Souvenirs. */
export const HOST_STORY_WINS = 3;

/** L'histoire de l'hôte d'un lieu est ouverte : il a été battu assez souvent. */
export function hostStoryOpen(hostWins: Partial<Record<PlaceId, number>> | undefined, place: PlaceId): boolean {
  return (hostWins?.[place] ?? 0) >= HOST_STORY_WINS;
}

// ---------------------------------------------------------------------------
// Le rang : de gueux à Crésus

const RANKS: Record<PlaceId, string> = {
  kiosque: "Gueux", cafe: "Habitué", casino: "Flambeur", salon: "Notable",
  cercle: "Rentier", yacht: "Nabab", banque: "Magnat", lune: "Crésus",
};

/**
 * Le rang affiché sous le pseudo : celui du meilleur lieu débloqué, puis « Patron » pour
 * qui a racheté le Kiosque, et « Légende » pour qui a vu la vraie fin de l'histoire.
 */
export function rankOf(standing: number, kiosk: boolean, legend = false): string {
  if (kiosk && legend) return "Légende";
  return kiosk ? "Patron" : RANKS[bestPlace(standing).id];
}

// ---------------------------------------------------------------------------
// Pseudo (section 11)

const LETTER = "A-Za-zÀ-ÖØ-öø-ÿŒœ";
const PSEUDO_RE = new RegExp(`^[${LETTER}0-9][${LETTER}0-9 -]{1,14}[${LETTER}0-9]$`);

/** Forme affichée : espaces resserrés, sans espace au bord. */
export function cleanPseudo(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/g, " ").trim();
}

function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Clé d'unicité : sans tenir compte de la casse ni des accents. */
export function pseudoKey(pseudo: string): string {
  return fold(cleanPseudo(pseudo)).replace(/ /g, "_");
}

/** Refusés où qu'ils apparaissent dans le pseudo. */
const REFUSED_ANYWHERE = [
  "admin", "moderateur", "grattouille", "gaspard", "sidonie", "archibald",
  "connard", "connasse", "salop", "salaud", "encul", "enfoire", "putain", "merde", "couille",
  "batard", "pouffiasse", "petasse", "trouduc", "branleur", "branlette", "nichon", "gouine",
  "negre", "bougnoul", "youpin", "nazi", "hitler", "violeur", "pedophil", "terroris", "daesh",
  "abruti", "cretin", "fuck", "bitch", "porn", "nigger", "nigga", "asshole",
];

/** Refusés seulement comme mot entier : trop courts ou trop ambigus pour une recherche large. */
const REFUSED_WORDS = [
  "piou", "ondine", "hector", "baron", "auguste", "enzo", "colette", "modo",
  "con", "cons", "conne", "connes", "cul", "culs", "pute", "putes", "bite", "bites", "nique", "niquer",
  "ntm", "fdp", "tg", "pd", "pede", "tapette", "chier", "chieur", "chieuse", "viol", "sexe", "negro",
  "shit", "cunt", "dick", "pussy", "slut", "whore",
];

export type PseudoCheck =
  | { ok: true; pseudo: string; key: string }
  | { ok: false; reason: "format" | "refused" };

export function validatePseudo(raw: unknown): PseudoCheck {
  if (typeof raw !== "string") return { ok: false, reason: "format" };
  const pseudo = cleanPseudo(raw);
  if (!PSEUDO_RE.test(pseudo)) return { ok: false, reason: "format" };
  const folded = fold(pseudo);
  const compact = folded.replace(/[^a-z]/g, "");
  const words = folded.split(/[^a-z]+/).filter(Boolean);
  if (REFUSED_ANYWHERE.some((w) => compact.includes(w))) return { ok: false, reason: "refused" };
  if (REFUSED_WORDS.some((w) => words.includes(w) || compact === w)) return { ok: false, reason: "refused" };
  return { ok: true, pseudo, key: pseudoKey(pseudo) };
}

// ---------------------------------------------------------------------------
// Code de récupération (section 11)

/** Sans caractères ambigus : ni I, L, O, U, ni 0, 1. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
export const CODE_LENGTH = 16;

/** Retire tirets et espaces, passe en capitales. `null` si ce n'est pas un code. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== CODE_LENGTH) return null;
  for (const ch of code) if (!CODE_ALPHABET.includes(ch)) return null;
  return code;
}

/** XXXX-XXXX-XXXX-XXXX */
export function formatCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, "$1-");
}

// ---------------------------------------------------------------------------
// Divers

/** Jour UTC d'une date, pour la limite quotidienne : « 2026-11-25 ». */
export function dayOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Numéro de série imprimé sur le talon, dérivé de la graine : GR-0000-0000. */
export function serialOf(seed: number): string {
  const s = seed >>> 0;
  const a = String(s % 10_000).padStart(4, "0");
  const b = String(Math.floor(s / 10_000) % 10_000).padStart(4, "0");
  return `GR-${b}-${a}`;
}
