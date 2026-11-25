// Stockage : l'interface, et sa version en mémoire pour les tests, le développement
// local et le mode bac à sable (BRIEF.md, section 15.7).
// La version Netlify Blobs est dans storage.blobs.ts, pour que le client puisse
// importer ce fichier sans embarquer @netlify/blobs.

import type { Board } from "../shared/types";
import { ApiError } from "./errors";
import type { PlayerRecord } from "./player";

/** Ce que rend une mutation : son résultat, et s'il faut écrire le document. */
export interface Mutation<T> {
  result: T;
  write: boolean;
}

export const commit = <T>(result: T): Mutation<T> => ({ result, write: true });
export const unchanged = <T>(result: T): Mutation<T> => ({ result, write: false });

export const MUTATE_ATTEMPTS = 3;

export interface Storage {
  getPlayer(id: string): Promise<PlayerRecord | null>;
  /**
   * Lit le joueur, applique `mutate`, écrit sous condition (etag). Si quelqu'un a
   * écrit entre-temps, on relit et on recommence : trois essais, puis CONFLICT.
   * `mutate` lève une ApiError pour refuser ; rien n'est alors écrit.
   * Lève NOT_FOUND si le joueur n'existe pas.
   */
  mutatePlayer<T>(id: string, mutate: (p: PlayerRecord) => Mutation<T>): Promise<T>;
  /** Écrit un nouveau joueur. Rend `false` si l'identifiant existe déjà. */
  createPlayer(record: PlayerRecord): Promise<boolean>;
  deletePlayer(id: string): Promise<void>;
  /**
   * Réserve un pseudo. Rend `false` s'il est déjà pris. Une réservation orpheline
   * (suppression interrompue : le joueur n'existe plus) peut être reprise, mais
   * seulement passé un délai, pour ne pas voler un pseudo en cours de création.
   */
  claimPseudo(key: string, playerId: string, now: number): Promise<boolean>;
  releasePseudo(key: string): Promise<void>;
  /** L'identifiant du joueur qui détient ce pseudo. */
  findPseudo(key: string): Promise<string | null>;
  getBoard(): Promise<Board>;
  /**
   * Lit le classement, applique `mutate` (qui rend `false` s'il n'y a rien à
   * écrire), écrit sous condition. Rend `false` après `attempts` conflits :
   * ce n'est jamais une erreur pour le joueur.
   */
  mutateBoard(mutate: (board: Board) => boolean, attempts?: number): Promise<boolean>;
  /** Écrit puis relit un blob dans le store de santé. */
  health(): Promise<boolean>;
}

/** Âge à partir duquel une réservation sans joueur est considérée comme orpheline. */
export const ORPHAN_PSEUDO_MS = 60_000;

export interface PseudoClaim {
  playerId: string;
  at: number;
}

export function emptyBoard(): Board {
  return { entries: [], updatedAt: 0 };
}

/** Petite attente au hasard entre deux essais, pour désynchroniser des écritures simultanées. */
export function jitter(attempt: number): Promise<void> {
  const ms = 15 + Math.floor(Math.random() * 60 * (attempt + 1));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Entry {
  json: string;
  etag: number;
}

/**
 * Stockage en mémoire. Les documents sont gardés sérialisés et chaque opération
 * rend la main, comme un vrai stockage distant : deux requêtes concurrentes
 * s'entrelacent réellement, et l'écriture conditionnelle est mise à l'épreuve.
 */
export class MemoryStorage implements Storage {
  private players = new Map<string, Entry>();
  private pseudos = new Map<string, Entry>();
  private board: Entry | null = null;
  private healthBlob: string | null = null;
  private counter = 0;

  /** Pour les tests : appelé juste avant chaque écriture conditionnelle d'un joueur. */
  beforePlayerWrite: ((id: string) => void) | null = null;
  /** Pour les tests : appelé juste avant chaque écriture conditionnelle du classement. */
  beforeBoardWrite: (() => void) | null = null;
  /** Compteurs d'opérations, pour vérifier ce que coûte une requête. */
  ops = { playerReads: 0, playerWrites: 0, boardReads: 0, boardWrites: 0 };

  private tick(): Promise<void> {
    return Promise.resolve();
  }

  private put(map: Map<string, Entry>, key: string, value: unknown): void {
    map.set(key, { json: JSON.stringify(value), etag: ++this.counter });
  }

  /** Pour les tests : modifie un joueur sans passer par l'API. */
  poke(id: string, change: (p: PlayerRecord) => void): void {
    const entry = this.players.get(id);
    if (!entry) throw new Error(`joueur inconnu : ${id}`);
    const record = JSON.parse(entry.json) as PlayerRecord;
    change(record);
    this.put(this.players, id, record);
  }

  /** Pour les tests : lecture directe. */
  peek(id: string): PlayerRecord | null {
    const entry = this.players.get(id);
    return entry ? (JSON.parse(entry.json) as PlayerRecord) : null;
  }

  /** Pour les tests : réécrit le classement sans passer par l'API, comme le ferait un autre joueur. */
  pokeBoard(change: (board: Board) => void): void {
    const board = this.board ? (JSON.parse(this.board.json) as Board) : emptyBoard();
    change(board);
    this.board = { json: JSON.stringify(board), etag: ++this.counter };
  }

  playerCount(): number {
    return this.players.size;
  }

  async getPlayer(id: string): Promise<PlayerRecord | null> {
    await this.tick();
    this.ops.playerReads++;
    const entry = this.players.get(id);
    return entry ? (JSON.parse(entry.json) as PlayerRecord) : null;
  }

  async mutatePlayer<T>(id: string, mutate: (p: PlayerRecord) => Mutation<T>): Promise<T> {
    for (let attempt = 0; attempt < MUTATE_ATTEMPTS; attempt++) {
      await this.tick();
      this.ops.playerReads++;
      const found = this.players.get(id);
      if (!found) throw new ApiError("NOT_FOUND");
      const record = JSON.parse(found.json) as PlayerRecord;
      const { result, write } = mutate(record); // lève ApiError en cas de refus
      if (!write) return result;
      await this.tick();
      this.beforePlayerWrite?.(id);
      const current = this.players.get(id);
      if (current && current.etag === found.etag) {
        this.ops.playerWrites++;
        this.put(this.players, id, record);
        return result;
      }
      // Quelqu'un a écrit entre-temps : on relit.
    }
    throw new ApiError("CONFLICT");
  }

  async createPlayer(record: PlayerRecord): Promise<boolean> {
    await this.tick();
    if (this.players.has(record.id)) return false;
    this.ops.playerWrites++;
    this.put(this.players, record.id, record);
    return true;
  }

  async deletePlayer(id: string): Promise<void> {
    await this.tick();
    this.players.delete(id);
  }

  async claimPseudo(key: string, playerId: string, now: number): Promise<boolean> {
    await this.tick();
    const existing = this.pseudos.get(key);
    if (existing) {
      const claim = JSON.parse(existing.json) as PseudoClaim;
      if (this.players.has(claim.playerId)) return false;
      if (now - (claim.at ?? 0) < ORPHAN_PSEUDO_MS) return false;
    }
    const claim: PseudoClaim = { playerId, at: now };
    this.put(this.pseudos, key, claim);
    return true;
  }

  async releasePseudo(key: string): Promise<void> {
    await this.tick();
    this.pseudos.delete(key);
  }

  async findPseudo(key: string): Promise<string | null> {
    await this.tick();
    const entry = this.pseudos.get(key);
    return entry ? (JSON.parse(entry.json) as PseudoClaim).playerId : null;
  }

  async getBoard(): Promise<Board> {
    await this.tick();
    this.ops.boardReads++;
    return this.board ? (JSON.parse(this.board.json) as Board) : emptyBoard();
  }

  async mutateBoard(mutate: (board: Board) => boolean, attempts = MUTATE_ATTEMPTS): Promise<boolean> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0) await jitter(attempt);
      await this.tick();
      this.ops.boardReads++;
      const found = this.board;
      const board = found ? (JSON.parse(found.json) as Board) : emptyBoard();
      if (!mutate(board)) return true;
      await this.tick();
      this.beforeBoardWrite?.();
      if (this.board === found || (this.board && found && this.board.etag === found.etag)) {
        this.ops.boardWrites++;
        this.board = { json: JSON.stringify(board), etag: ++this.counter };
        return true;
      }
    }
    return false;
  }

  async health(): Promise<boolean> {
    await this.tick();
    const stamp = String(Date.now());
    this.healthBlob = stamp;
    await this.tick();
    return this.healthBlob === stamp;
  }
}
