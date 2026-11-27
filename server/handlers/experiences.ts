// L'Agence Carpe Diem : les expériences de vie.

import { experienceById, knownExperiences } from "../../shared/experiences";
import { fail } from "../errors";
import { commit, json, readAck, readBody, writePlayer, type Deps } from "../http";

/**
 * POST /api/experiences/buy { id, ack? } → { state }
 * S'offrir une expérience. Elle se vit une fois (`ALREADY_OWNED` ensuite) et se paie de
 * la bourse (`INSUFFICIENT_FUNDS`). Elle ne donne pas de Standing et n'entre pas dans la
 * collection ; son prix reste compté dans la fortune.
 */
export async function buyExperience(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  const experience = typeof body.id === "string" ? experienceById(body.id) : undefined;
  if (!experience) fail("BAD_REQUEST");

  const { state } = await writePlayer(req, deps, ack, (p) => {
    const lived = knownExperiences(p.experiences);
    if (lived.includes(experience.id)) fail("ALREADY_OWNED", "Tu as déjà vécu cette expérience.");
    if (p.balance < experience.price) fail("INSUFFICIENT_FUNDS");
    p.balance -= experience.price;
    p.experiences = [...lived, experience.id];
    return commit(null);
  });
  return json({ state });
}
