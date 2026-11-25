// Classement (BRIEF.md, section 10).
// Un seul document, `top`, qui contient au plus 200 entrées triées.

import { BOARD_PUBLISH_INTERVAL_MS, BOARD_SIZE } from "../shared/rules";
import type { Board, BoardEntry } from "../shared/types";
import { boardEntryOf, boardSignature, type PlayerRecord } from "./player";
import { commit, unchanged, type Storage } from "./storage";

/** Fortune décroissante ; à égalité, la publication la plus ancienne d'abord. */
export function sortBoard(entries: BoardEntry[]): BoardEntry[] {
  return entries.sort((a, b) => b.fortune - a.fortune || a.at - b.at || (a.id < b.id ? -1 : 1));
}

export function upsertEntry(board: Board, entry: BoardEntry, now: number): void {
  board.entries = sortBoard([...board.entries.filter((e) => e.id !== entry.id), entry]).slice(0, BOARD_SIZE);
  board.updatedAt = now;
}

/**
 * Décide s'il faut publier (étape 7 de la section 15.6), juste avant d'écrire le
 * joueur : ce qui se voit au classement a changé, et la dernière publication date
 * de plus de 30 secondes. Marque alors le joueur comme publié et rend l'entrée.
 */
export function planPublish(r: PlayerRecord, now: number): BoardEntry | null {
  if (r.banned) return null;
  const sig = boardSignature(r);
  if (sig === r.boardSig) return null;
  if (r.boardAt > 0 && now - r.boardAt < BOARD_PUBLISH_INTERVAL_MS) return null;
  r.boardAt = now;
  r.boardSig = sig;
  return boardEntryOf(r, now);
}

/**
 * Publie (étape 9). Lire `top`, remplacer ou insérer l'entrée, trier, garder 200
 * entrées, écrire sous condition ; trois essais au plus. Un échec n'est jamais une
 * erreur pour le joueur : on efface la marque de publication, et la publication
 * suivante rattrape.
 */
export async function publish(storage: Storage, entry: BoardEntry, now: number): Promise<boolean> {
  let ok = false;
  try {
    ok = await storage.mutateBoard((board) => {
      upsertEntry(board, entry, now);
      return true;
    });
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      await storage.mutatePlayer(entry.id, (p) => {
        if (p.boardSig === "") return unchanged(null);
        p.boardSig = "";
        return commit(null);
      });
    } catch {
      // Tant pis : la prochaine écriture dont la fortune change republiera.
    }
  }
  return ok;
}

/** Retire un joueur du classement (suppression de compte, bannissement). */
export async function removeFromBoard(storage: Storage, playerId: string, now: number): Promise<boolean> {
  try {
    return await storage.mutateBoard((board) => {
      if (!board.entries.some((e) => e.id === playerId)) return false;
      board.entries = board.entries.filter((e) => e.id !== playerId);
      board.updatedAt = now;
      return true;
    }, 8);
  } catch {
    return false;
  }
}
