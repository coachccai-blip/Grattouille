// Un refus du moteur : une règle du jeu s'oppose au geste demandé.
// Le serveur le traduit en erreur de l'API, avec le même code.

import type { PokerErrorCode } from "./types";

export type EngineErrorCode = PokerErrorCode | "BAD_REQUEST";

export class PokerError extends Error {
  readonly code: EngineErrorCode;

  constructor(code: EngineErrorCode) {
    super(code);
    this.name = "PokerError";
    this.code = code;
  }
}

export function refuse(code: EngineErrorCode): never {
  throw new PokerError(code);
}
