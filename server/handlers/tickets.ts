// Tickets : achat, ticket trouvé par terre, déclaration (BRIEF.md, sections 5.5, 6.5, 15.4 et 15.6),
// et les tickets que le Patron laisse tomber à son tour.

import { FIRST_TICKET_MULTIPLIER, HOUSE_MULTIPLIER, drawGain } from "../../shared/economy";
import {
  BUY_COOLDOWN_MS, DAILY_TICKET_LIMIT, MAX_PENDING,
  dayOf, foundReason, houseEligible, houseTicketDef, isPlaceOpen, standingOf,
} from "../../shared/rules";
import { ticketById } from "../../shared/tickets";
import type { PendingTicket } from "../../shared/types";
import { newTicketId } from "../auth";
import { fail } from "../errors";
import { commit, json, readAck, readBody, unchanged, writePlayer, type Deps } from "../http";
import { countOf, safeAdd } from "../player";

/** POST /api/tickets/buy { type, qty, ack? } → { tickets, state } */
export async function buyTickets(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  const def = typeof body.type === "string" ? ticketById(body.type) : undefined;
  if (!def) fail("BAD_REQUEST");
  const qty = body.qty;
  if (qty !== 1 && qty !== 5 && qty !== 10) fail("BAD_REQUEST");

  const { result, state } = await writePlayer(req, deps, ack, (p, now) => {
    const cost = def.price * qty;
    if (!isPlaceOpen(def.place, standingOf(p.owned, p.kiosk))) fail("PLACE_LOCKED");
    if (p.pending.length + qty > MAX_PENDING) fail("PENDING_FULL");
    if (p.balance < cost) fail("INSUFFICIENT_FUNDS");
    if (now - p.lastBuyAt < BUY_COOLDOWN_MS) fail("TOO_FAST");
    const today = dayOf(now);
    const boughtToday = p.day === today ? p.dayTickets : 0;
    if (boughtToday + qty > DAILY_TICKET_LIMIT) fail("DAILY_LIMIT");

    // Le gain est décidé ici, au moment de l'achat. Il sera versé à la déclaration.
    const tickets: PendingTicket[] = [];
    for (let i = 0; i < qty; i++) {
      // Le premier ticket d'un compte gagne toujours 5 fois son prix.
      const first = p.stats.tickets === 0 && i === 0;
      const gain = first ? def.price * FIRST_TICKET_MULTIPLIER : drawGain(def, deps.random32);
      tickets.push({ id: newTicketId(deps.random32), type: def.id, gain, seed: deps.random32() >>> 0, at: now });
    }
    p.balance -= cost;
    p.pending.push(...tickets);
    p.stats.tickets += qty;
    p.stats.wagered = safeAdd(p.stats.wagered, cost);
    p.lastBuyAt = now;
    p.day = today;
    p.dayTickets = boughtToday + qty;
    return commit(tickets);
  });
  return json({ tickets: result, state });
}

/**
 * POST /api/tickets/found { ack? } → { tickets, state }
 * Le ticket trouvé par terre : un exemplaire du ticket le moins cher du meilleur lieu
 * débloqué, toujours gagnant, qui rapporte 3 fois son prix. Il traîne là pour qui n'a
 * plus de quoi jouer (un toutes les 20 secondes au plus) et, de temps en temps, pour
 * tout le monde (un toutes les 8 minutes au plus). Le tout premier ticket d'un compte
 * se ramasse ainsi, et rapporte 5 fois son prix.
 */
export async function foundTicket(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  const { result, state } = await writePlayer(req, deps, ack, (p, now) => {
    const standing = standingOf(p.owned, p.kiosk);
    // Conditions vérifiées après `ack` : la pile et le solde sont à jour.
    const reason = foundReason({
      balance: p.balance, pendingCount: p.pending.length, standing, since: now - p.lastHouseAt,
    });
    if (!reason) {
      const broke = houseEligible({ balance: p.balance, pendingCount: p.pending.length, standing });
      fail("HOUSE_NOT_ELIGIBLE", broke ? "Rien par terre pour l'instant. Regarde encore dans un instant." : undefined);
    }
    const def = houseTicketDef(standing);
    const first = p.stats.tickets === 0;
    const ticket: PendingTicket = {
      id: newTicketId(deps.random32), type: def.id,
      gain: def.price * (first ? FIRST_TICKET_MULTIPLIER : HOUSE_MULTIPLIER),
      seed: deps.random32() >>> 0, house: true, at: now,
    };
    p.pending.push(ticket);
    p.stats.tickets += 1;
    p.lastHouseAt = now;
    return commit([ticket]);
  });
  return json({ tickets: result, state });
}

/** POST /api/tickets/ack { ack } → { state } */
export async function ackTickets(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body, true);
  const { state } = await writePlayer(req, deps, ack, (_p, _now, paid) => (paid > 0 ? commit(null) : unchanged(null)));
  return json({ state });
}

/**
 * POST /api/tickets/sow { type, qty?, ack? } → { state }
 * Le Patron du Kiosque laisse tomber des tickets pour ceux qui débarquent sans rien : un,
 * cinq ou dix d'un coup (`qty`, un par défaut). Il les paie de sa bourse, au prix du
 * comptoir. Ce ne sont pas ses tickets : rien ne l'attend à gratter, rien ne s'ajoute à
 * ses tickets joués ni à ses mises, et il n'y gagne rien que le plaisir de les semer.
 */
export async function sowTickets(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  const def = typeof body.type === "string" ? ticketById(body.type) : undefined;
  if (!def) fail("BAD_REQUEST");
  const qty = body.qty === undefined || body.qty === null ? 1 : body.qty;
  if (qty !== 1 && qty !== 5 && qty !== 10) fail("BAD_REQUEST");

  const { state } = await writePlayer(req, deps, ack, (p, now) => {
    const cost = def.price * qty;
    if (!p.kiosk) fail("SOW_LOCKED");
    if (p.balance < cost) fail("INSUFFICIENT_FUNDS");
    if (now - p.lastBuyAt < BUY_COOLDOWN_MS) fail("TOO_FAST");
    p.balance -= cost;
    p.stats.sown = safeAdd(countOf(p.stats.sown), qty);
    p.stats.sownValue = safeAdd(countOf(p.stats.sownValue), cost);
    p.lastBuyAt = now;
    return commit(null);
  });
  return json({ state });
}
