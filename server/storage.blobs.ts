// Stockage Netlify Blobs (BRIEF.md, section 15.7).
// Aligné sur @netlify/blobs 11 : getStore({ name, consistency }), getWithMetadata(key,
// { type: "json" }) qui rend { data, etag, metadata } ou null, et setJSON(key, value,
// { onlyIfMatch | onlyIfNew }) qui rend { modified, etag }.
//
// Trois stores de site, ouverts en cohérence forte. `{ctx}` vaut `prod` en production
// et `test` partout ailleurs : les stores de site sont partagés entre tous les
// déploiements, un aperçu ne doit jamais écrire dans les données des vrais joueurs.

import { getStore } from "@netlify/blobs";
import type { Board } from "../shared/types";
import { ApiError } from "./errors";
import type { PlayerRecord } from "./player";
import {
  MUTATE_ATTEMPTS, ORPHAN_PSEUDO_MS, emptyBoard, jitter,
  type Mutation, type PseudoClaim, type Storage,
} from "./storage";

const BOARD_KEY = "top";

type Store = ReturnType<typeof getStore>;

interface Versioned {
  data: unknown;
  etag: string;
}

/**
 * Lit un document et son etag. En production, la lecture rend l'etag. Le serveur
 * local de développement (`netlify dev`) ne le rend que dans les listes : on liste
 * alors d'abord, puis on relit. Si quelqu'un écrit entre les deux, l'etag obtenu est
 * périmé et l'écriture conditionnelle échoue : on reste du côté sûr.
 */
async function readVersioned(store: Store, key: string): Promise<Versioned | null> {
  const found = await store.getWithMetadata(key, { type: "json" });
  if (!found) return null;
  if (found.etag) return { data: found.data, etag: found.etag };
  const { blobs } = await store.list({ prefix: key });
  const etag = blobs.find((b) => b.key === key)?.etag;
  // Sans etag, l'écriture ne pourrait pas être conditionnelle : on refuse d'écrire.
  if (!etag) throw new ApiError("SERVER_ERROR");
  const data: unknown = await store.get(key, { type: "json" });
  if (data === null || data === undefined) return null;
  return { data, etag };
}

export class BlobsStorage implements Storage {
  private readonly ctx: string;

  constructor(ctx: string) {
    this.ctx = ctx;
  }

  private store(kind: "players" | "pseudos" | "board" | "health"): Store {
    return getStore({ name: `gr-${kind}-${this.ctx}`, consistency: "strong" });
  }

  async getPlayer(id: string): Promise<PlayerRecord | null> {
    const data = await this.store("players").get(id, { type: "json" });
    return (data as PlayerRecord | null) ?? null;
  }

  async mutatePlayer<T>(id: string, mutate: (p: PlayerRecord) => Mutation<T>): Promise<T> {
    const store = this.store("players");
    for (let attempt = 0; attempt < MUTATE_ATTEMPTS; attempt++) {
      const found = await readVersioned(store, id);
      if (!found) throw new ApiError("NOT_FOUND");
      const record = found.data as PlayerRecord;
      const { result, write } = mutate(record); // lève ApiError en cas de refus
      if (!write) return result;
      const { modified } = await store.setJSON(id, record, { onlyIfMatch: found.etag });
      if (modified) return result;            // sinon quelqu'un a écrit entre-temps : on relit
    }
    throw new ApiError("CONFLICT");
  }

  async createPlayer(record: PlayerRecord): Promise<boolean> {
    const { modified } = await this.store("players").setJSON(record.id, record, { onlyIfNew: true });
    return modified;
  }

  async deletePlayer(id: string): Promise<void> {
    await this.store("players").delete(id);
  }

  async claimPseudo(key: string, playerId: string, now: number): Promise<boolean> {
    const store = this.store("pseudos");
    const claim: PseudoClaim = { playerId, at: now };
    const created = await store.setJSON(key, claim, { onlyIfNew: true });
    if (created.modified) return true;
    // Déjà réservé. Si le joueur qui le détenait n'existe plus (suppression interrompue),
    // la réservation est orpheline : passé un délai, on la reprend, toujours sous condition.
    const found = await readVersioned(store, key);
    if (!found) {
      const retry = await store.setJSON(key, claim, { onlyIfNew: true });
      return retry.modified;
    }
    const holder = found.data as Partial<PseudoClaim> | null;
    if (now - (holder?.at ?? 0) < ORPHAN_PSEUDO_MS) return false;
    if (holder?.playerId && (await this.getPlayer(holder.playerId))) return false;
    const taken = await store.setJSON(key, claim, { onlyIfMatch: found.etag });
    return taken.modified;
  }

  async releasePseudo(key: string): Promise<void> {
    await this.store("pseudos").delete(key);
  }

  async findPseudo(key: string): Promise<string | null> {
    const data = (await this.store("pseudos").get(key, { type: "json" })) as Partial<PseudoClaim> | null;
    return data?.playerId ?? null;
  }

  async getBoard(): Promise<Board> {
    const data = (await this.store("board").get(BOARD_KEY, { type: "json" })) as Board | null;
    return data && Array.isArray(data.entries) ? data : emptyBoard();
  }

  async mutateBoard(mutate: (board: Board) => boolean, attempts = MUTATE_ATTEMPTS): Promise<boolean> {
    const store = this.store("board");
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0) await jitter(attempt);
      const found = await readVersioned(store, BOARD_KEY);
      const data = found?.data as Board | null | undefined;
      const board = data && Array.isArray(data.entries) ? data : emptyBoard();
      if (!mutate(board)) return true;
      const { modified } = found
        ? await store.setJSON(BOARD_KEY, board, { onlyIfMatch: found.etag })
        : await store.setJSON(BOARD_KEY, board, { onlyIfNew: true });
      if (modified) return true;
    }
    return false;
  }

  async health(): Promise<boolean> {
    const store = this.store("health");
    const stamp = `${Date.now()}`;
    await store.setJSON("ping", { stamp });
    const back = (await store.get("ping", { type: "json" })) as { stamp?: string } | null;
    return back?.stamp === stamp;
  }
}
