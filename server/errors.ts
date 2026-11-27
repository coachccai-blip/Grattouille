// Erreurs de l'API (BRIEF.md, section 15.5).
// Une erreur a la forme { "error": { "code": "…", "message": "…" } }.

import type { PokerErrorCode } from "../shared/poker/types";
import type { ErrorCode } from "../shared/types";

/** Les codes du brief, ceux du poker, plus SERVER_ERROR pour une panne inattendue. */
export type ServerErrorCode = ErrorCode | PokerErrorCode | "SERVER_ERROR";

const STATUS: Record<ServerErrorCode, number> = {
  BAD_REQUEST: 400,
  PSEUDO_INVALID: 400,
  UNAUTHORIZED: 401,
  PLACE_LOCKED: 403,
  KIOSK_LOCKED: 403,
  SOW_LOCKED: 403,
  MASTERS_LOCKED: 403,
  NOT_FOUND: 404,
  TABLE_NOT_FOUND: 404,
  PSEUDO_TAKEN: 409,
  INSUFFICIENT_FUNDS: 409,
  PENDING_FULL: 409,
  ALREADY_OWNED: 409,
  HOUSE_NOT_ELIGIBLE: 409,
  CONFLICT: 409,
  TABLE_FULL: 409,
  TABLE_STARTED: 409,
  ALREADY_SEATED: 409,
  NOT_SEATED: 409,
  BUYIN_UNAFFORDABLE: 409,
  NOT_YOUR_TURN: 409,
  ACTION_IMPOSSIBLE: 409,
  BLIND_TOO_HIGH: 409,
  TOO_FAST: 429,
  DAILY_LIMIT: 429,
  SERVER_ERROR: 500,
};

// Un message dit ce qui s'est passé et quoi faire. Il ne s'excuse pas (section 12.4).
const MESSAGES: Record<ServerErrorCode, string> = {
  BAD_REQUEST: "Cette demande est illisible. Recharge la page et réessaie.",
  PSEUDO_INVALID: "Ce pseudo ne convient pas. Il faut 3 à 16 caractères : lettres, chiffres, espace ou tiret.",
  UNAUTHORIZED: "Pseudo ou code incorrect.",
  PLACE_LOCKED: "Ce lieu est encore fermé. Il te faut plus de Standing.",
  KIOSK_LOCKED: "Le Kiosque n'est à vendre qu'une fois ta collection complète.",
  SOW_LOCKED: "Seul le Patron du Kiosque laisse tomber des tickets pour les nouveaux venus.",
  NOT_FOUND: "Cette adresse n'existe pas.",
  PSEUDO_TAKEN: "Ce pseudo est pris. Essaie avec un autre.",
  INSUFFICIENT_FUNDS: "Il te manque de l'argent pour cet achat.",
  PENDING_FULL: "Gratte d'abord tes tickets en attente.",
  ALREADY_OWNED: "Tu possèdes déjà ce bien.",
  HOUSE_NOT_ELIGIBLE: "Rien ne traîne par terre pour l'instant.",
  CONFLICT: "Deux demandes sont arrivées en même temps. Réessaie dans un instant.",
  // Le Poker Tricheur (POKER.md, section 4).
  TABLE_NOT_FOUND: "Cette table n'existe pas, ou elle a fermé. Vérifie le code.",
  TABLE_FULL: "Cette table est complète. Attends qu'un siège se libère.",
  TABLE_STARTED: "Cette partie est déjà lancée : on n'y entre plus.",
  ALREADY_SEATED: "Tu es déjà assis à une table. Quitte-la avant d'en rejoindre une autre.",
  NOT_SEATED: "Tu n'es plus assis à cette table. Repasse par le hall pour t'y rasseoir.",
  BUYIN_UNAFFORDABLE: "Ta bourse ne suffit pas pour cette cave. Choisis-en une plus petite, ou une table moins chère.",
  NOT_YOUR_TURN: "Ce n'est pas ton tour. Attends que la parole te revienne.",
  ACTION_IMPOSSIBLE: "Ce geste n'est pas possible maintenant. Regarde où en est la table.",
  BLIND_TOO_HIGH: "Cette blinde est trop haute pour ta bourse. Elle ne peut pas dépasser son quarantième.",
  MASTERS_LOCKED: "La Table des Maîtres n'ouvre qu'à qui a relevé les huit défis.",
  TOO_FAST: "Gaspard n'a que deux pattes. Réessaie dans un instant.",
  DAILY_LIMIT: "6 000 tickets aujourd'hui : le guichet rouvre demain.",
  SERVER_ERROR: "Le kiosque ne répond pas. Réessaie dans un instant.",
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ServerErrorCode;

  constructor(code: ServerErrorCode, message?: string) {
    super(message ?? MESSAGES[code]);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS[code];
  }
}

export function fail(code: ServerErrorCode, message?: string): never {
  throw new ApiError(code, message);
}

export function statusOf(code: ServerErrorCode): number {
  return STATUS[code];
}
