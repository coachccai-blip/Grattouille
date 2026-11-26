// Erreurs de l'API (BRIEF.md, section 15.5).
// Une erreur a la forme { "error": { "code": "…", "message": "…" } }.

import type { ErrorCode } from "../shared/types";

/** Les codes du brief, plus SERVER_ERROR pour une panne inattendue. */
export type ServerErrorCode = ErrorCode | "SERVER_ERROR";

const STATUS: Record<ServerErrorCode, number> = {
  BAD_REQUEST: 400,
  PSEUDO_INVALID: 400,
  UNAUTHORIZED: 401,
  PLACE_LOCKED: 403,
  KIOSK_LOCKED: 403,
  NOT_FOUND: 404,
  PSEUDO_TAKEN: 409,
  INSUFFICIENT_FUNDS: 409,
  PENDING_FULL: 409,
  ALREADY_OWNED: 409,
  HOUSE_NOT_ELIGIBLE: 409,
  CONFLICT: 409,
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
  NOT_FOUND: "Cette adresse n'existe pas.",
  PSEUDO_TAKEN: "Ce pseudo est pris. Essaie avec un autre.",
  INSUFFICIENT_FUNDS: "Il te manque de l'argent pour cet achat.",
  PENDING_FULL: "Gratte d'abord tes tickets en attente.",
  ALREADY_OWNED: "Tu possèdes déjà ce bien.",
  HOUSE_NOT_ELIGIBLE: "Rien ne traîne par terre pour l'instant.",
  CONFLICT: "Deux demandes sont arrivées en même temps. Réessaie dans un instant.",
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
