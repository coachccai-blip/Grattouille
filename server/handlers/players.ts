// Comptes : création, récupération, lecture, suppression (BRIEF.md, section 11).

import { cleanPseudo, isSpecies, normalizeCode, pseudoKey, validatePseudo } from "../../shared/rules";
import { newCode, newPlayerId, safeEqual, sha256Hex } from "../auth";
import { planPublish, publish, removeFromBoard } from "../board";
import { fail } from "../errors";
import { json, readBody, readPlayer, type Deps } from "../http";
import { newPlayer, toState } from "../player";

/** POST /api/players { pseudo, species } → { playerId, code, state } */
export async function createPlayer(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const check = validatePseudo(body.pseudo);
  if (!check.ok) fail("PSEUDO_INVALID");
  if (!isSpecies(body.species)) fail("BAD_REQUEST");

  const now = deps.now();
  const id = newPlayerId(deps.random32);
  const code = newCode(deps.random32);
  const record = newPlayer({
    id, pseudo: check.pseudo, pseudoKey: check.key, codeHash: await sha256Hex(code),
    species: body.species, now,
  });
  const entry = planPublish(record, now);

  // Réserver d'abord le pseudo, puis écrire le joueur. Si cette écriture échoue, libérer le pseudo.
  if (!(await deps.storage.claimPseudo(check.key, id, now))) fail("PSEUDO_TAKEN");
  let created = false;
  try {
    created = await deps.storage.createPlayer(record);
  } finally {
    if (!created) await deps.storage.releasePseudo(check.key).catch(() => undefined);
  }
  if (!created) fail("CONFLICT");

  if (entry) {
    const task = publish(deps.storage, entry, now);
    if (deps.defer) deps.defer(task);
    else await task;
  }
  return json({ playerId: id, code, state: toState(record) }, 201);
}

/** POST /api/session { pseudo, code } → { playerId, state } : changer d'appareil. */
export async function openSession(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  if (typeof body.pseudo !== "string" || typeof body.code !== "string") fail("BAD_REQUEST");
  const code = normalizeCode(body.code);
  const pseudo = cleanPseudo(body.pseudo);
  if (!code || pseudo.length === 0 || pseudo.length > 32) fail("UNAUTHORIZED");
  const hash = await sha256Hex(code);
  const playerId = await deps.storage.findPseudo(pseudoKey(pseudo));
  const record = playerId ? await deps.storage.getPlayer(playerId) : null;
  // Même réponse que le pseudo existe ou non, et comparaison en temps constant.
  if (!safeEqual(record?.codeHash ?? "", hash) || !record) fail("UNAUTHORIZED");
  return json({ playerId: record.id, state: toState(record) });
}

/** GET /api/me → { state } */
export async function getMe(req: Request, deps: Deps): Promise<Response> {
  const record = await readPlayer(req, deps);
  return json({ state: toState(record) });
}

/**
 * DELETE /api/me → { ok }
 * Le serveur efface le joueur, libère le pseudo et le retire du classement.
 */
export async function deleteMe(req: Request, deps: Deps): Promise<Response> {
  const record = await readPlayer(req, deps);
  await deps.storage.deletePlayer(record.id);
  await deps.storage.releasePseudo(record.pseudoKey);
  await removeFromBoard(deps.storage, record.id, deps.now());
  return json({ ok: true });
}
