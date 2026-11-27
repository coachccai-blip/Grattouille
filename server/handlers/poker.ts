// Le Poker Tricheur : le hall, créer ou rejoindre une table, la regarder, y agir
// (POKER.md, section 4). Toutes les routes sont authentifiées comme les autres.
//
// Il n'y a pas de minuteur : chaque requête sur une table commence par la faire avancer
// jusqu'à l'heure courante (délais échus, tours des robots), puis applique ce qui est
// demandé. La vue rendue est fabriquée pour le joueur qui la demande : jamais les cartes
// cachées des autres, ni qui a triché.

import { PLACES, isPlaceId } from "../../shared/places";
import {
  BLIND_SHARE, HOUSE_SEATS, MASTERS_BLIND, MASTERS_BUYIN, MASTERS_SEATS, MAX_SEATS, MIN_SEATS,
  act, allowedBlinds, challengeOf, createTable, houseOf, isBlind, isCard, isDifficulty, leave, maxBuyIn, minBuyIn,
  newTableCode, normalizeTableCode, pickMasters, pickPersonas, rebuyRange, seatIndexOf, sit, viewFor,
  type GameAction, type PokerAction, type PokerLobbyResponse, type PokerPollResponse, type PokerTableResponse,
  type TableSpec, type TableState,
} from "../../shared/poker";
import { isPlaceOpen, standingOf } from "../../shared/rules";
import type { PlaceId } from "../../shared/types";
import { ApiError, fail } from "../errors";
import { json, readAck, readBody, readPlayer, type Body, type Deps } from "../http";
import { allChallengesWon, countOf, defisOf, toState, type PlayerRecord } from "../player";
import {
  departureOf, engine, newSessionId, payBuyIn, payRebuy, reconcile, releaseSeat, sitterOf, touchTable,
  type Reconciled,
} from "../poker";

const isAmount = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x > 0;

/** Le solde une fois versés les tickets déclarés avec la requête : c'est lui qui compte. */
function balanceAfter(p: PlayerRecord, ack: readonly string[]): number {
  let balance = p.balance;
  for (const ticket of p.pending) if (ack.includes(ticket.id)) balance += ticket.gain;
  return balance;
}

/** La réponse d'une route qui touche une table. */
function reply(r: Reconciled, now: number, status = 200): Response {
  const body: PokerTableResponse = { view: r.table ? viewFor(r.table, r.me.id, now) : null };
  if (r.moved) body.state = toState(r.me, now);
  const left = r.left ?? (r.table ? departureOf(r.table, r.me.id) : undefined);
  if (left) body.left = left;
  return json(body, status);
}

/**
 * Le joueur est peut-être encore assis ailleurs. On fait avancer cette table-là et on
 * rattrape l'argent : s'il n'y est plus, sa séance se solde ; s'il y est toujours, on refuse.
 */
async function freeFromOtherTable(deps: Deps, me: PlayerRecord, now: number, except?: string): Promise<PlayerRecord> {
  if (!me.poker || me.poker.code === except) return me;
  const code = me.poker.code;
  const after = await reconcile(deps, me, code, await touchTable(deps, me, code, now), now);
  if (after.me.poker) fail("ALREADY_SEATED");
  return after.me;
}

// ---------------------------------------------------------------------------
// GET /api/poker → le hall

/**
 * GET /api/poker → { seat, blinds, houses, challenges, masters, state }
 * Les tables de la maison et les défis du joueur, la Table des Maîtres (ouverte ou non),
 * l'échelle des blindes que sa bourse permet, et la table où il est assis s'il y en a une.
 */
export async function pokerLobby(req: Request, deps: Deps): Promise<Response> {
  let me = await readPlayer(req, deps);
  const now = deps.now();
  let seat: PokerLobbyResponse["seat"] = null;
  if (me.poker) {
    // Sa table a pu avancer, ou fermer, depuis sa dernière visite.
    const code = me.poker.code;
    const after = await reconcile(deps, me, code, await touchTable(deps, me, code, now), now);
    me = after.me;
    if (me.poker && after.table) seat = { code, kind: after.table.kind, place: after.table.place };
  }
  const standing = standingOf(me.owned, me.kiosk);
  const wins = me.pokerWins ?? [];
  const lobby: PokerLobbyResponse = {
    seat,
    blinds: allowedBlinds(me.balance),
    houses: PLACES.map((place) => {
      const def = houseOf(place.id);
      return { ...def, open: isPlaceOpen(place.id, standing), affordable: me.balance >= def.minBuyIn };
    }),
    challenges: PLACES.map((place) => {
      const def = challengeOf(place.id);
      return {
        ...def, open: isPlaceOpen(place.id, standing), won: wins.includes(place.id), affordable: me.balance >= def.buyIn,
      };
    }),
    masters: {
      open: allChallengesWon(me), defis: defisOf(me).length, blind: MASTERS_BLIND, buyIn: MASTERS_BUYIN,
      won: countOf(me.masters), affordable: me.balance >= MASTERS_BUYIN,
    },
    state: toState(me, now),
  };
  return json(lobby);
}

// ---------------------------------------------------------------------------
// POST /api/poker/tables → créer une table

interface Order {
  spec: Omit<TableSpec, "code" | "bots">;
  /** Le nombre de robots, et l'hôte qui ouvre la liste s'il y en a un. */
  bots: number;
  host?: string;
  /** Table des Maîtres : les robots sont quatre des huit hôtes, tirés au sort. */
  masters?: true;
  /** La cave demandée, ou `undefined` : la plus grosse que la bourse permet. */
  buyIn: number | undefined;
  minBuyIn: number;
  /** Table créée par le joueur : la blinde est plafonnée par sa bourse. */
  capped: boolean;
}

function readPlace(raw: unknown, me: PlayerRecord): PlaceId {
  if (!isPlaceId(raw)) fail("BAD_REQUEST");
  if (!isPlaceOpen(raw, standingOf(me.owned, me.kiosk))) fail("PLACE_LOCKED");
  return raw;
}

function readBuyIn(raw: unknown, min: number, max: number): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!isAmount(raw) || raw < min || raw > max) fail("BAD_REQUEST");
  return raw;
}

function readOrder(body: Body, me: PlayerRecord): Order {
  // Une table de la maison, un défi ou la Table des Maîtres : un seul à la fois.
  if ([body.maison, body.defi, body.maitres].filter((x) => x !== undefined).length > 1) fail("BAD_REQUEST");
  if (body.maitres !== undefined) {
    // La Table des Maîtres : le joueur et quatre hôtes, 30 blindes de base chacun, en tournoi.
    // Elle n'ouvre qu'à qui a relevé les huit défis.
    if (body.maitres !== true) fail("BAD_REQUEST");
    if (!allChallengesWon(me)) fail("MASTERS_LOCKED");
    return {
      spec: { kind: "maitres", place: null, blind: MASTERS_BLIND, maxBuyIn: MASTERS_BUYIN, seats: MASTERS_SEATS, difficulty: "difficile" },
      bots: MASTERS_SEATS - 1, masters: true, buyIn: MASTERS_BUYIN, minBuyIn: MASTERS_BUYIN, capped: false,
    };
  }
  if (body.maison !== undefined) {
    // Une table de la maison : l'hôte du lieu et deux autres personnages.
    const def = houseOf(readPlace(body.maison, me));
    return {
      spec: { kind: "maison", place: def.place, blind: def.blind, maxBuyIn: def.maxBuyIn, seats: HOUSE_SEATS, difficulty: def.difficulty },
      bots: HOUSE_SEATS - 1, host: def.host,
      buyIn: readBuyIn(body.buyIn, def.minBuyIn, def.maxBuyIn), minBuyIn: def.minBuyIn, capped: false,
    };
  }
  if (body.defi !== undefined) {
    // Un défi : un tête-à-tête avec l'hôte, 30 blindes de base chacun. La blinde monte au fil du duel.
    const def = challengeOf(readPlace(body.defi, me));
    return {
      spec: { kind: "defi", place: def.place, blind: def.blind, maxBuyIn: def.buyIn, seats: 2, difficulty: def.difficulty },
      bots: 1, host: def.host, buyIn: def.buyIn, minBuyIn: def.buyIn, capped: false,
    };
  }
  const { blind, seats, bots } = body;
  if (!isBlind(blind)) fail("BAD_REQUEST");
  if (!isAmount(body.maxBuyIn) || body.maxBuyIn < minBuyIn(blind) || body.maxBuyIn > maxBuyIn(blind)) fail("BAD_REQUEST");
  if (typeof seats !== "number" || !Number.isInteger(seats) || seats < MIN_SEATS || seats > MAX_SEATS) fail("BAD_REQUEST");
  if (typeof bots !== "number" || !Number.isInteger(bots) || bots < 0 || bots > seats - 1) fail("BAD_REQUEST");
  if (body.difficulty !== undefined && !isDifficulty(body.difficulty)) fail("BAD_REQUEST");
  return {
    spec: { kind: "privee", place: null, blind, maxBuyIn: body.maxBuyIn, seats, difficulty: body.difficulty ?? "normal" },
    bots,
    buyIn: readBuyIn(body.buyIn, minBuyIn(blind), body.maxBuyIn), minBuyIn: minBuyIn(blind), capped: true,
  };
}

/**
 * POST /api/poker/tables → { view, state }
 * Créer une table ({ blind, maxBuyIn, seats, bots, difficulty?, buyIn? }), ouvrir une
 * table de la maison ({ maison: lieu, buyIn? }), lancer un défi ({ defi: lieu }) ou
 * s'asseoir à la Table des Maîtres ({ maitres: true }).
 * Le créateur s'assoit. Le siège est réservé sur la table avant que la bourse ne paie.
 */
export async function createPokerTable(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  let me = await readPlayer(req, deps);
  const now = deps.now();
  const order = readOrder(body, me);
  me = await freeFromOtherTable(deps, me, now);

  // On vérifie la bourse avant de créer quoi que ce soit ; elle le sera encore au moment de payer.
  const balance = balanceAfter(me, ack);
  const { blind } = order.spec;
  if (order.capped && blind * BLIND_SHARE > balance) fail("BLIND_TOO_HIGH");
  if (balance < order.minBuyIn) fail("BUYIN_UNAFFORDABLE");
  const buyIn = order.buyIn ?? Math.min(order.spec.maxBuyIn, balance);
  if (balance < buyIn) fail("BUYIN_UNAFFORDABLE");

  const sid = newSessionId(deps.random32);
  // La tablée des Maîtres se tire au sort à chaque nouvelle table : quatre des huit hôtes.
  const bots = order.masters ? pickMasters(deps.random32) : pickPersonas(order.bots, deps.random32, order.host);
  let code = "";
  for (let attempt = 0; attempt < 8 && !code; attempt++) {
    const candidate = newTableCode(deps.random32);
    const table = engine(() => sit(createTable({ ...order.spec, code: candidate, bots }, now), sitterOf(me, sid), now, deps.random32));
    if (await deps.storage.createTable(table)) code = candidate;
  }
  if (!code) fail("CONFLICT");

  try {
    me = await payBuyIn(deps, me.id, now, ack, { code, sid, amount: buyIn, blind: order.capped ? blind : undefined });
  } catch (error) {
    // La bourse a refusé : le siège réservé est libéré, et la table, vide, se ferme.
    if (error instanceof ApiError) await reconcile(deps, me, code, await releaseSeat(deps, code, sid, now), now);
    throw error;
  }
  const after = await reconcile(deps, me, code, await touchTable(deps, me, code, now), now);
  return reply({ ...after, moved: true }, now, 201);
}

// ---------------------------------------------------------------------------
// POST /api/poker/join → rejoindre avec un code

/**
 * POST /api/poker/join { code, buyIn, ack? } → { view, state }
 * Rejoindre une table avec son code et une cave. Seules les tables créées par un joueur
 * se rejoignent : une table de la maison ou un défi n'a pas de code à partager.
 */
export async function joinPokerTable(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  if (typeof body.code !== "string" || !isAmount(body.buyIn)) fail("BAD_REQUEST");
  const buyIn = body.buyIn;
  const code = normalizeTableCode(body.code);
  let me = await readPlayer(req, deps);
  if (!code) fail("TABLE_NOT_FOUND");
  const now = deps.now();
  me = await freeFromOtherTable(deps, me, now, code);
  if (me.poker) {
    // Il a déjà une séance à cette table : s'il y est assis, rejoindre ne change rien ;
    // s'il n'y est plus, elle vient d'être soldée et il se rassoit comme un nouveau venu.
    const here = await reconcile(deps, me, code, await touchTable(deps, me, code, now), now);
    if (here.me.poker && here.table && seatIndexOf(here.table, me.id) >= 0) return reply(here, now);
    if (here.me.poker) fail("CONFLICT");
    me = here.me;
  }
  if (balanceAfter(me, ack) < buyIn) fail("BUYIN_UNAFFORDABLE");

  // 1. Réserver un siège. Aucun argent ne bouge encore.
  const fresh = newSessionId(deps.random32);
  const reserved = await touchTable(deps, me, code, now, (t) => {
    if (t.kind !== "privee" || t.phase === "fermee") fail("TABLE_NOT_FOUND");
    if (buyIn < t.minBuyIn || buyIn > t.maxBuyIn) fail("BAD_REQUEST");
    // Un siège déjà réservé à son nom (une requête interrompue) : on le reprend.
    return sit(t, sitterOf(me, fresh), now, deps.random32);
  });
  const index = reserved ? seatIndexOf(reserved, me.id) : -1;
  if (!reserved || index < 0) {
    // La table n'existe pas, ou elle vient de fermer : une séance restée là est soldée.
    await reconcile(deps, me, code, reserved, now);
    fail("TABLE_NOT_FOUND");
  }
  const seat = reserved.seats[index]!;

  // 2. Payer la cave. Si une autre requête du même joueur vient de la poser, celle-ci s'efface.
  if (seat.seq > 0) fail("CONFLICT");
  try {
    me = await payBuyIn(deps, me.id, now, ack, { code, sid: seat.sid, amount: buyIn });
  } catch (error) {
    if (error instanceof ApiError) await reconcile(deps, me, code, await releaseSeat(deps, code, seat.sid, now), now);
    throw error;
  }

  // 3. La table reçoit la cave.
  const after = await reconcile(deps, me, code, await touchTable(deps, me, code, now), now);
  return reply({ ...after, moved: true }, now);
}

// ---------------------------------------------------------------------------
// GET /api/poker/table → la vue du joueur

/**
 * GET /api/poker/table?code=…&v=… → { view, state?, left? } ou { unchanged: true }
 * La vue du joueur. Si la version n'a pas changé depuis `v` : la réponse minimale.
 * Qui n'est pas assis reçoit un aperçu (rien de caché n'y figure), pour une table créée
 * par un joueur seulement.
 */
export async function pokerTable(req: Request, deps: Deps): Promise<Response> {
  const me = await readPlayer(req, deps);
  const url = new URL(req.url);
  const code = normalizeTableCode(url.searchParams.get("code") ?? "");
  if (!code) fail("TABLE_NOT_FOUND");
  const seen = url.searchParams.get("v");
  const now = deps.now();
  const after = await reconcile(deps, me, code, await touchTable(deps, me, code, now), now);
  const table = after.table;
  if (!table) {
    // La table n'existe plus. S'il y avait une séance, sa bourse vient d'être soldée.
    if (after.moved) return reply(after, now);
    fail("TABLE_NOT_FOUND");
  }
  const seated = seatIndexOf(table, me.id) >= 0;
  if (!seated && table.kind !== "privee" && !after.left && !departureOf(table, me.id)) fail("TABLE_NOT_FOUND");
  if (!after.moved && seen !== null && seen !== "" && Number(seen) === table.version) {
    const unchanged: PokerPollResponse = { unchanged: true };
    return json(unchanged);
  }
  return reply(after, now);
}

// ---------------------------------------------------------------------------
// POST /api/poker/act → agir

const ACTIONS: readonly PokerAction["type"][] = [
  "lancer", "tricher", "franc-jeu", "parole", "miser", "suivre", "relancer", "coucher", "tapis",
  "accuser", "rien", "suite", "retour", "recaver", "quitter",
];

function readAction(raw: unknown): PokerAction {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail("BAD_REQUEST");
  const a = raw as Record<string, unknown>;
  const type = a.type as PokerAction["type"];
  if (typeof type !== "string" || !ACTIONS.includes(type)) fail("BAD_REQUEST");
  switch (type) {
    case "tricher":
      if (typeof a.index !== "number" || !Number.isInteger(a.index) || a.index < 0 || a.index > 4 || !isCard(a.card)) fail("BAD_REQUEST");
      return { type, index: a.index, card: a.card };
    case "miser":
    case "relancer":
    case "recaver":
      if (!isAmount(a.amount)) fail("BAD_REQUEST");
      return { type, amount: a.amount };
    case "accuser":
      if (typeof a.seat !== "number" || !Number.isInteger(a.seat) || a.seat < 0 || a.seat >= MAX_SEATS) fail("BAD_REQUEST");
      return { type, seat: a.seat };
    default:
      return { type };
  }
}

/**
 * POST /api/poker/act { code, action, step?, ack? } → { view, state?, left? }
 * Agir à la table : tricher ou non, parole, miser, suivre, relancer, se coucher, tapis,
 * accuser ou non, lancer la partie, demander la main suivante, revenir d'une absence,
 * recaver, quitter.
 */
export async function pokerAct(req: Request, deps: Deps): Promise<Response> {
  const body = await readBody(req);
  const ack = readAck(body);
  const action = readAction(body.action);
  const step = body.step;
  if (step !== undefined && (typeof step !== "number" || !Number.isInteger(step))) fail("BAD_REQUEST");
  if (typeof body.code !== "string") fail("BAD_REQUEST");
  const code = normalizeTableCode(body.code);
  const me = await readPlayer(req, deps);
  if (!code) fail("TABLE_NOT_FOUND");
  const now = deps.now();

  if (action.type === "recaver") return rebuy(deps, me, code, action.amount, ack, now);

  if (action.type === "quitter") {
    // En pleine main, quitter c'est se coucher. Le tapis retourne à la bourse aussitôt.
    const table = await touchTable(deps, me, code, now, (t) => (seatIndexOf(t, me.id) >= 0 ? leave(t, me.id, now, deps.random32) : t));
    const after = await reconcile(deps, me, code, table, now);
    if (!after.moved && !after.left) fail(after.table ? "NOT_SEATED" : "TABLE_NOT_FOUND");
    return reply(after, now);
  }

  const move: GameAction = action;
  let table: TableState | null;
  try {
    table = await touchTable(deps, me, code, now, (t) => act(t, me.id, move, now, deps.random32, step));
  } catch (error) {
    // Le geste est refusé, mais la table a pu avancer : l'argent à rendre l'est quand même.
    if (error instanceof ApiError && (error.code === "NOT_SEATED" || error.code === "TABLE_NOT_FOUND")) {
      await reconcile(deps, me, code, await touchTable(deps, me, code, now), now);
    }
    throw error;
  }
  const after = await reconcile(deps, me, code, table, now);
  if (!after.table) fail("TABLE_NOT_FOUND");
  return reply(after, now);
}

/**
 * Recaver : la bourse paie d'abord, la table reçoit ensuite. Si la requête s'arrête
 * entre les deux, la table rattrape le dépôt à la requête suivante.
 */
async function rebuy(deps: Deps, me: PlayerRecord, code: string, amount: number, ack: readonly string[], now: number): Promise<Response> {
  const before = await reconcile(deps, me, code, await touchTable(deps, me, code, now), now);
  const table = before.table;
  if (!table) fail("TABLE_NOT_FOUND");
  const index = seatIndexOf(table, me.id);
  if (index < 0) fail("NOT_SEATED");
  const seat = table.seats[index]!;
  const range = rebuyRange(table, index);
  if (!range || amount < range.min || amount > range.max) fail("ACTION_IMPOSSIBLE");
  const paid = await payRebuy(deps, me.id, now, ack, { sid: seat.sid, seq: seat.seq, amount });
  const after = await reconcile(deps, paid, code, await touchTable(deps, paid, code, now), now);
  return reply({ ...after, moved: true }, now);
}
