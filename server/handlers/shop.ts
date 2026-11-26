// Boutiques et tenue (BRIEF.md, sections 9 et 15.6).

import { KIOSK, itemById } from "../../shared/catalog";
import { LOOK_SLOTS, collectionComplete, isSpecies } from "../../shared/rules";
import type { LookSlot } from "../../shared/types";
import { fail } from "../errors";
import { commit, json, readAck, readBody, writePlayer, type Deps } from "../http";

/** POST /api/shop/buy { itemId, equip?, ack? } → { state } */
export async function buyItem(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  if (typeof body.itemId !== "string") fail("BAD_REQUEST");
  if (body.equip !== undefined && typeof body.equip !== "boolean") fail("BAD_REQUEST");
  const isKiosk = body.itemId === KIOSK.id;
  const item = isKiosk ? KIOSK : itemById(body.itemId);
  if (!item) fail("BAD_REQUEST");
  const equip = body.equip === true;

  const { state } = await writePlayer(req, deps, ack, (p) => {
    if (isKiosk) {
      if (p.kiosk) fail("ALREADY_OWNED");
      // Le Kiosque exige tous les biens du catalogue.
      if (!collectionComplete(p.owned)) fail("KIOSK_LOCKED");
    } else if (p.owned.includes(item.id)) {
      fail("ALREADY_OWNED");
    }
    if (p.balance < item.price) fail("INSUFFICIENT_FUNDS");
    // Les achats en boutique sont définitifs.
    p.balance -= item.price;
    if (isKiosk) {
      p.kiosk = true;
    } else {
      p.owned.push(item.id);
      if (equip && item.slot !== "tresor") p.look[item.slot] = item.id;
    }
    return commit(null);
  });
  return json({ state });
}

/**
 * POST /api/look { look?, species? } → { state }
 * Chaque article désigné doit être possédé et correspondre à son emplacement. `null` retire.
 */
export async function setLook(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const changes: [LookSlot, string | null][] = [];
  if (body.look !== undefined) {
    const look = body.look;
    if (typeof look !== "object" || look === null || Array.isArray(look)) fail("BAD_REQUEST");
    for (const [slot, value] of Object.entries(look as Record<string, unknown>)) {
      if (!(LOOK_SLOTS as readonly string[]).includes(slot)) fail("BAD_REQUEST");
      if (value !== null && typeof value !== "string") fail("BAD_REQUEST");
      if (typeof value === "string") {
        const item = itemById(value);
        if (!item || item.slot !== slot) fail("BAD_REQUEST");
      }
      changes.push([slot as LookSlot, value as string | null]);
    }
  }
  if (body.species !== undefined && !isSpecies(body.species)) fail("BAD_REQUEST");
  const species = body.species as string | undefined;
  if (changes.length === 0 && species === undefined) fail("BAD_REQUEST");

  const { state } = await writePlayer(req, deps, [], (p) => {
    for (const [slot, value] of changes) {
      if (value !== null && !p.owned.includes(value)) fail("BAD_REQUEST", "Tu ne possèdes pas cet article.");
      p.look[slot] = value;
    }
    if (species !== undefined) p.species = species;
    return commit(null);
  });
  return json({ state });
}
