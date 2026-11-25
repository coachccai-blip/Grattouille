// Santé, classement et administration (BRIEF.md, sections 10, 15.5 et 15.8).

import { isPlayerId, readBearer, safeEqual } from "../auth";
import { removeFromBoard } from "../board";
import { fail } from "../errors";
import { commit, json, readBody, type Deps } from "../http";

/** GET /api/health → { ok, context } : écrit puis relit un blob. */
export async function health(_req: Request, deps: Deps): Promise<Response> {
  let ok = false;
  try {
    ok = await deps.storage.health();
  } catch {
    ok = false;
  }
  return json({ ok, context: deps.context }, ok ? 200 : 503);
}

/**
 * GET /api/leaderboard → { entries, updatedAt }
 * Public : la même réponse pour tout le monde, mise en cache 30 secondes.
 * Le client retrouve sa propre ligne grâce à son `id`.
 */
export async function leaderboard(_req: Request, deps: Deps): Promise<Response> {
  const board = await deps.storage.getBoard();
  return json(board, 200, {
    "cache-control": "public, max-age=30, s-maxage=30",
    "netlify-cdn-cache-control": "public, s-maxage=30",
  });
}

/**
 * POST /api/admin/ban { playerId, unban? } → { ok }
 * Protégée par la clé d'administration. Un joueur banni disparaît du classement ;
 * son compte continue de fonctionner.
 */
export async function ban(req: Request, deps: Deps): Promise<Response> {
  const presented = readBearer(req) ?? "";
  const key = deps.adminKey ?? "";
  // Sans clé configurée, la route est fermée à tout le monde.
  if (key.length < 8 || !safeEqual(presented, key)) fail("UNAUTHORIZED", "Clé d'administration invalide.");
  const body = await readBody(req);
  if (!isPlayerId(body.playerId)) fail("BAD_REQUEST");
  if (body.unban !== undefined && typeof body.unban !== "boolean") fail("BAD_REQUEST");
  const banned = body.unban !== true;
  const now = deps.now();
  await deps.storage.mutatePlayer(body.playerId, (p) => {
    p.banned = banned;
    // Une levée de bannissement republie à la prochaine écriture du joueur.
    p.boardSig = "";
    p.updatedAt = now;
    return commit(null);
  });
  if (banned) await removeFromBoard(deps.storage, body.playerId, now);
  return json({ ok: true });
}
