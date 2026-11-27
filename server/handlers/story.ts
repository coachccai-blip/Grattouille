// L'histoire : ce que le joueur a vu, quand cela se mérite et ne se voit qu'une fois.

import { fail } from "../errors";
import { commit, json, readAck, readBody, unchanged, writePlayer, type Deps } from "../http";
import { trueEndingEarned } from "../player";

/**
 * POST /api/story/seen { id: "vraie-fin", ack? } → { state }
 * Marque la vraie fin, « Huit as de cœur », comme vue. Elle se mérite : le Kiosque est à
 * lui et les huit défis de poker sont relevés. La marquer deux fois ne change rien.
 */
export async function storySeen(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  if (body.id !== "vraie-fin") fail("BAD_REQUEST");
  const { state } = await writePlayer(req, deps, ack, (p, _now, paid) => {
    if (!trueEndingEarned(p)) fail("BAD_REQUEST", "Cette page de l'histoire ne s'ouvre pas encore.");
    if (p.vraieFin === true) return paid > 0 ? commit(null) : unchanged(null);
    p.vraieFin = true;
    return commit(null);
  });
  return json({ state });
}
