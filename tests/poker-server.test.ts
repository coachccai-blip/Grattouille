// Les routes du Poker Tricheur, avec le stockage en mémoire (POKER.md, section 4) :
// le hall, créer et rejoindre une table, la regarder, y agir ; l'avance paresseuse ; les
// vues par joueur ; l'argent entre la bourse et la table, coupé à chaque écriture.

import { describe, expect, it } from "vitest";
import { handle, type Deps } from "../server/app";
import { MemoryStorage, type Storage } from "../server/storage";
import { CATALOG } from "../shared/catalog";
import {
  CHEAT_MS, IDLE_TABLE_MS, RESERVE_MS, RESULT_MS, TURN_MS,
  chipsOnTable, seatIndexOfSession,
  type PokerAction, type PokerLobbyResponse, type PokerTableResponse, type TableView,
} from "../shared/poker";
import type { PlayerState } from "../shared/types";

const T0 = Date.UTC(2026, 10, 26, 21, 0, 0);

interface Reply<T = any> {
  status: number;
  body: T;
}

interface Account {
  playerId: string;
  code: string;
  auth: string;
  pseudo: string;
}

type StorageMethod = keyof Storage;

function makeWorld() {
  const storage = new MemoryStorage();
  let now = T0;
  let lcg = 0x2545f491;
  /** Une panne programmée : la n-ième opération de stockage à venir échoue, avant ou après avoir eu lieu. */
  let fault: { method: StorageMethod | "*"; countdown: number; when: "before" | "after" } | null = null;
  let calls = 0;
  const faulty = new Proxy(storage, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown;
      if (typeof value !== "function" || typeof prop !== "string") return value;
      const watched = ["getPlayer", "mutatePlayer", "getTable", "createTable", "mutateTable", "deleteTable"].includes(prop);
      if (!watched) return (value as (...args: unknown[]) => unknown).bind(target);
      return async (...args: unknown[]) => {
        calls += 1;
        const hit = fault !== null && (fault.method === "*" || fault.method === prop) && --fault.countdown === 0;
        const when = hit ? fault!.when : null;
        if (hit) fault = null;
        if (when === "before") throw new Error(`panne simulée avant ${prop}`);
        const result = await (value as (...a: unknown[]) => Promise<unknown>).apply(target, args);
        if (when === "after") throw new Error(`panne simulée après ${prop}`);
        return result;
      };
    },
  });
  const deps: Deps = {
    storage: faulty,
    context: "test",
    adminKey: null,
    now: () => now,
    random32: () => {
      // xorshift32 : un hasard reproductible, de meilleure tenue qu'un simple générateur congruentiel.
      lcg ^= lcg << 13;
      lcg ^= lcg >>> 17;
      lcg ^= lcg << 5;
      return lcg >>> 0;
    },
  };

  async function call<T = any>(method: string, path: string, body?: unknown, auth?: string): Promise<Reply<T>> {
    const headers: Record<string, string> = {};
    if (auth) headers.authorization = `Bearer ${auth}`;
    let payload: string | undefined;
    if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = typeof body === "string" ? body : JSON.stringify(body);
    }
    const res = await handle(new Request(`https://grattouille.test${path}`, { method, headers, body: payload }), deps);
    return { status: res.status, body: (await res.json()) as T };
  }

  /** Une requête pendant laquelle une panne est attendue : le journal d'erreurs est mis de côté. */
  async function crashing<T>(work: () => Promise<T>): Promise<T> {
    const original = console.error;
    console.error = () => undefined;
    try {
      return await work();
    } finally {
      console.error = original;
      fault = null;
    }
  }

  async function signup(pseudo: string, purse: number, owned: string[] = []): Promise<Account> {
    const r = await call("POST", "/api/players", { pseudo, species: "renard" });
    if (r.status !== 201) throw new Error(`création refusée : ${JSON.stringify(r.body)}`);
    storage.poke(r.body.playerId, (p) => {
      p.balance = purse;
      p.owned = owned;
    });
    return { playerId: r.body.playerId, code: r.body.code, auth: `${r.body.playerId}.${r.body.code}`, pseudo };
  }

  const balance = (a: Account) => storage.peek(a.playerId)!.balance;
  const table = (code: string) => storage.peekTable(code);

  /**
   * Tout l'argent des joueurs, où qu'il soit : dans les bourses, sur les tables, en route
   * entre les deux, ou dû par une table à une bourse. Sans robot, cette somme ne change jamais.
   */
  function money(accounts: Account[]): number {
    let total = 0;
    const tables = storage.tableCodes().map((code) => storage.peekTable(code)!);
    for (const t of tables) total += chipsOnTable(t);
    for (const a of accounts) {
      const p = storage.peek(a.playerId);
      if (!p) continue;
      total += p.balance;
      const session = p.poker;
      if (!session) continue;
      const t = tables.find((x) => x.code === session.code);
      const seat = t ? t.seats[seatIndexOfSession(t, session.sid)] ?? null : null;
      const ended = t ? t.ended.find((e) => e.sid === session.sid) ?? null : null;
      // Ce que la bourse a sorti et que la table n'a pas (encore) reçu.
      total += session.paid - (seat ? seat.received : ended ? ended.received : 0);
      // Un tapis rendu par la table, pas encore crédité.
      if (ended) total += ended.payout;
    }
    return total;
  }

  const poker = {
    lobby: (a: Account) => call<PokerLobbyResponse>("GET", "/api/poker", undefined, a.auth),
    create: (a: Account, body: unknown) => call<PokerTableResponse>("POST", "/api/poker/tables", body, a.auth),
    join: (a: Account, code: string, buyIn: number) => call<PokerTableResponse>("POST", "/api/poker/join", { code, buyIn }, a.auth),
    poll: (a: Account, code: string, v?: number) =>
      call<PokerTableResponse & { unchanged?: true }>("GET", `/api/poker/table?code=${code}${v === undefined ? "" : `&v=${v}`}`, undefined, a.auth),
    act: (a: Account, code: string, action: PokerAction, step?: number) =>
      call<PokerTableResponse>("POST", "/api/poker/act", step === undefined ? { code, action } : { code, action, step }, a.auth),
  };

  /** La vue d'un joueur, relue. */
  async function view(a: Account, code: string): Promise<TableView> {
    const r = await poker.poll(a, code);
    if (r.status !== 200 || !r.body.view) throw new Error(`pas de vue : ${JSON.stringify(r.body)}`);
    return r.body.view;
  }

  return {
    storage, deps, call, crashing, signup, balance, table, money, poker, view,
    advance: (ms: number) => { now += ms; },
    now: () => now,
    calls: () => calls,
    failAt: (method: StorageMethod | "*", countdown = 1, when: "before" | "after" = "before") => { fault = { method, countdown, when }; },
  };
}

type World = ReturnType<typeof makeWorld>;

const PRIVATE = { blind: 10, maxBuyIn: 1000, seats: 4, bots: 0 };

/** Une table privée où `accounts` sont assis, chacun avec `buyIn`. Le premier l'a créée. */
async function seated(w: World, accounts: Account[], buyIn = 500, settings: Record<string, unknown> = PRIVATE): Promise<string> {
  const created = await w.poker.create(accounts[0]!, { ...settings, buyIn });
  if (created.status !== 201) throw new Error(`table refusée : ${JSON.stringify(created.body)}`);
  const code = created.body.view!.code;
  for (const a of accounts.slice(1)) {
    const joined = await w.poker.join(a, code, buyIn);
    if (joined.status !== 200) throw new Error(`siège refusé : ${JSON.stringify(joined.body)}`);
  }
  return code;
}

/** La même, la partie lancée : on en est à la triche de la première main. */
async function started(w: World, accounts: Account[], buyIn = 500): Promise<string> {
  const code = await seated(w, accounts, buyIn);
  const r = await w.poker.act(accounts[0]!, code, { type: "lancer" });
  if (r.status !== 200) throw new Error(`lancement refusé : ${JSON.stringify(r.body)}`);
  return code;
}

/** Donne à chaque siège la main voulue, derrière le dos du serveur. */
function setHands(w: World, code: string, hands: Record<number, string>): void {
  w.storage.pokeTable(code, (t) => {
    for (const [seat, text] of Object.entries(hands)) t.hand!.players.find((p) => p.seat === Number(seat))!.cards = text.split(" ");
  });
}

/** Les douze biens les moins chers : 22 ★, de quoi ouvrir le Grand Café. */
const CAFE_GOODS = [...CATALOG].sort((a, b) => a.price - b.price).slice(0, 12).map((i) => i.id);

describe("le hall", () => {
  it("un compte tout neuf : rien n'est à sa portée, mais tout est là", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 0);
    const r = await w.poker.lobby(a);
    expect(r.status).toBe(200);
    expect(r.body.seat).toBeNull();
    expect(r.body.blinds).toEqual([]);
    expect(r.body.houses.map((h) => [h.place, h.open, h.affordable])).toEqual([
      ["kiosque", true, false], ["cafe", false, false], ["casino", false, false], ["salon", false, false],
      ["cercle", false, false], ["yacht", false, false], ["banque", false, false], ["lune", false, false],
    ]);
    expect(r.body.houses[0]).toEqual({
      place: "kiosque", host: "gaspard", blind: 1, minBuyIn: 20, maxBuyIn: 100, difficulty: "facile", open: true, affordable: false,
    });
    expect(r.body.challenges).toHaveLength(8);
    expect(r.body.challenges[0]).toEqual({
      place: "kiosque", host: "gaspard", blind: 1, buyIn: 30, bonus: 100, difficulty: "facile", open: true, won: false, affordable: false,
    });
    expect(r.body.challenges[7]).toMatchObject({ place: "lune", host: "selene", blind: 250_000_000_000, buyIn: 7_500_000_000_000, bonus: 25_000_000_000_000, difficulty: "difficile" });
    expect(r.body.state).toMatchObject({ id: a.playerId, balance: 0 });
    expect(r.body.state.poker).toBeUndefined();
  });

  it("les tables auxquelles on peut s'asseoir dépendent de la bourse et des lieux ouverts", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 19);
    const at = async (purse: number, owned: string[] = []) => {
      w.storage.poke(a.playerId, (p) => { p.balance = purse; p.owned = owned; });
      return (await w.poker.lobby(a)).body;
    };
    // 20 € : la cave minimale du Kiosque. 30 € : son défi. 40 € : de quoi créer une table à 1 €.
    expect((await at(19)).houses[0]).toMatchObject({ open: true, affordable: false });
    expect((await at(20)).houses[0]).toMatchObject({ open: true, affordable: true });
    expect((await at(29)).challenges[0]!.affordable).toBe(false);
    expect((await at(30)).challenges[0]!.affordable).toBe(true);
    expect((await at(39)).blinds).toEqual([]);
    expect((await at(40)).blinds).toEqual([1]);
    expect((await at(4_000)).blinds).toEqual([1, 2, 5, 10, 20, 50, 100]);
    // Riche mais sans Standing : le Grand Café reste fermé.
    const rich = await at(1_000_000);
    expect(rich.houses.map((h) => h.open)).toEqual([true, false, false, false, false, false, false, false]);
    expect(rich.houses[1]).toMatchObject({ place: "cafe", open: false, affordable: true });
    const cafe = await at(1_000_000, CAFE_GOODS);
    expect(cafe.houses.map((h) => h.open)).toEqual([true, true, false, false, false, false, false, false]);
    expect(cafe.challenges.map((c) => c.open)).toEqual([true, true, false, false, false, false, false, false]);
  });

  it("la table où le joueur est assis figure dans le hall et dans GET /api/me", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 5_000);
    const created = await w.poker.create(a, { ...PRIVATE, buyIn: 400 });
    const code = created.body.view!.code;
    expect((await w.poker.lobby(a)).body.seat).toEqual({ code, kind: "privee", place: null });
    const me = await w.call("GET", "/api/me", undefined, a.auth);
    expect(me.body.state.poker).toEqual({ code });
    expect(me.body.state.balance).toBe(4_600);
    // Une fois parti, plus rien.
    await w.poker.act(a, code, { type: "quitter" });
    expect((await w.poker.lobby(a)).body.seat).toBeNull();
    expect((await w.call("GET", "/api/me", undefined, a.auth)).body.state.poker).toBeUndefined();
  });

  it("toutes les routes du poker sont authentifiées", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 5_000);
    for (const auth of [undefined, `${a.playerId}.ABCDEFGHJKMNPQRS`, "n-importe-quoi"]) {
      for (const [method, path, body] of [
        ["GET", "/api/poker", undefined],
        ["POST", "/api/poker/tables", { ...PRIVATE }],
        ["POST", "/api/poker/join", { code: "ABCDE", buyIn: 200 }],
        ["GET", "/api/poker/table?code=ABCDE", undefined],
        ["POST", "/api/poker/act", { code: "ABCDE", action: { type: "quitter" } }],
      ] as const) {
        const r = await w.call(method, path, body, auth);
        expect([auth, path, r.status, r.body.error.code]).toEqual([auth, path, 401, "UNAUTHORIZED"]);
      }
    }
    expect(w.storage.tableCodes()).toEqual([]);
    expect(w.balance(a)).toBe(5_000);
  });
});

describe("créer une table", () => {
  it("le créateur s'assoit : sa cave quitte sa bourse et devient son tapis", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 5_000);
    const before = (await w.call("GET", "/api/me", undefined, a.auth)).body.state as PlayerState;
    const r = await w.poker.create(a, { blind: 10, maxBuyIn: 800, seats: 5, bots: 2, difficulty: "difficile", buyIn: 400 });
    expect(r.status).toBe(201);
    const view = r.body.view!;
    expect(view.code).toMatch(/^[A-HJ-KM-NP-TV-Z2-9]{5}$/);
    expect(view).toMatchObject({
      kind: "privee", place: null, blind: 10, minBuyIn: 200, maxBuyIn: 800, difficulty: "difficile",
      phase: "attente", started: false, you: 0, owner: 0, dealer: null, handNo: 0, pot: 0, hand: null, result: null, closed: null,
    });
    expect(view.seats.map((s) => (s ? [s.pseudo, s.bot !== null, s.stack, s.funded] : null))).toEqual([
      ["Marcel", false, 400, true], null, null, [null, true, 800, true], [null, true, 800, true],
    ]);
    const bots = view.seats.filter((s) => s?.bot).map((s) => s!.bot!);
    expect(new Set(bots).size).toBe(2);
    expect(view.seats[0]).toMatchObject({ species: "renard", look: { chapeau: null, lunettes: null, tenue: null, accessoire: null } });
    // Il peut lancer : deux robots l'attendent.
    expect(view.options).toMatchObject({ start: true, rebuy: { min: 1, max: 400 } });
    expect(r.body.state).toMatchObject({ balance: 4_600, poker: { code: view.code } });
    // S'asseoir ne change pas la fortune : l'argent posé sur la table compte pour ce qu'il a coûté.
    expect(r.body.state!.fortune).toBe(before.fortune);
    expect(w.storage.peek(a.playerId)!.poker).toMatchObject({ code: view.code, seq: 1, paid: 400 });
    expect(w.table(view.code)!.seats[0]).toMatchObject({ playerId: a.playerId, stack: 400, received: 400, seq: 1 });
  });

  it("sans cave demandée : la cave maximale, ou tout ce que la bourse permet", async () => {
    const w = makeWorld();
    const rich = await w.signup("Crésus", 5_000);
    const poor = await w.signup("Gueux", 450);
    expect((await w.poker.create(rich, { blind: 10, maxBuyIn: 800, seats: 2, bots: 1 })).body.state!.balance).toBe(4_200);
    const r = await w.poker.create(poor, { blind: 10, maxBuyIn: 800, seats: 2, bots: 1 });
    expect(r.body.view!.seats[0]!.stack).toBe(450);
    expect(r.body.state!.balance).toBe(0);
    // La difficulté par défaut : normal.
    expect(r.body.view!.difficulty).toBe("normal");
  });

  it("BAD_REQUEST : des réglages hors limites", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 1_000_000);
    for (const body of [
      {}, { blind: 10 }, { ...PRIVATE, blind: 3 }, { ...PRIVATE, blind: "10" }, { ...PRIVATE, blind: 0 },
      { ...PRIVATE, maxBuyIn: 190 }, { ...PRIVATE, maxBuyIn: 1_010 }, { ...PRIVATE, maxBuyIn: 500.5 },
      { ...PRIVATE, seats: 1 }, { ...PRIVATE, seats: 7 }, { ...PRIVATE, seats: 2.5 },
      { ...PRIVATE, bots: -1 }, { ...PRIVATE, bots: 4 }, { ...PRIVATE, bots: "2" },
      { ...PRIVATE, difficulty: "impossible" },
      { ...PRIVATE, buyIn: 199 }, { ...PRIVATE, buyIn: 1_001 }, { ...PRIVATE, buyIn: 300.5 }, { ...PRIVATE, buyIn: "300" },
      { maison: "nulle-part" }, { defi: 12 }, { maison: "kiosque", defi: "kiosque" },
      { maison: "kiosque", buyIn: 19 }, { maison: "kiosque", buyIn: 101 },
      { ...PRIVATE, ack: "t_aaaaaaaaaaaa" },
    ]) {
      const r = await w.poker.create(a, body);
      expect([JSON.stringify(body), r.status, r.body]).toEqual([JSON.stringify(body), 400, { error: { code: "BAD_REQUEST", message: "Cette demande est illisible. Recharge la page et réessaie." } }]);
    }
    expect(w.storage.tableCodes()).toEqual([]);
    expect(w.balance(a)).toBe(1_000_000);
  });

  it("BLIND_TOO_HIGH : la blinde ne dépasse pas le quarantième de la bourse", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 399);
    const r = await w.poker.create(a, { blind: 10, maxBuyIn: 200, seats: 2, bots: 1 });
    expect([r.status, (r.body as any).error]).toEqual([409, {
      code: "BLIND_TOO_HIGH", message: "Cette blinde est trop haute pour ta bourse : elle ne peut pas dépasser son quarantième.",
    }]);
    expect(w.storage.tableCodes()).toEqual([]);
    w.storage.poke(a.playerId, (p) => { p.balance = 400; });
    expect((await w.poker.create(a, { blind: 10, maxBuyIn: 200, seats: 2, bots: 1 })).status).toBe(201);
    expect(w.balance(a)).toBe(200);
  });

  it("BUYIN_UNAFFORDABLE : la bourse ne suffit pas pour la cave", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 500);
    const asked = await w.poker.create(a, { blind: 10, maxBuyIn: 1000, seats: 2, bots: 1, buyIn: 501 });
    expect([asked.status, (asked.body as any).error]).toEqual([409, { code: "BUYIN_UNAFFORDABLE", message: "Ta bourse ne suffit pas pour cette cave." }]);
    // À la table du Kiosque, il faut 20 € ; pour son défi, 30 €.
    w.storage.poke(a.playerId, (p) => { p.balance = 19; });
    expect((await w.poker.create(a, { maison: "kiosque" }) as Reply).body.error.code).toBe("BUYIN_UNAFFORDABLE");
    w.storage.poke(a.playerId, (p) => { p.balance = 29; });
    expect((await w.poker.create(a, { defi: "kiosque" }) as Reply).body.error.code).toBe("BUYIN_UNAFFORDABLE");
    expect((await w.poker.create(a, { maison: "kiosque", buyIn: 30 }) as Reply).body.error.code).toBe("BUYIN_UNAFFORDABLE");
    expect(w.storage.tableCodes()).toEqual([]);
    expect(w.balance(a)).toBe(29);
  });

  it("PLACE_LOCKED : la table et le défi d'un lieu encore fermé", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 1_000_000);
    for (const body of [{ maison: "cafe" }, { defi: "cafe" }, { maison: "lune" }, { defi: "casino" }]) {
      const r = await w.poker.create(a, body) as Reply;
      expect([JSON.stringify(body), r.status, r.body.error.code]).toEqual([JSON.stringify(body), 403, "PLACE_LOCKED"]);
    }
    w.storage.poke(a.playerId, (p) => { p.owned = CAFE_GOODS; });
    expect((await w.poker.create(a, { maison: "cafe" })).status).toBe(201);
  });

  it("ALREADY_SEATED : un joueur ne s'assoit qu'à une table à la fois", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 5_000);
    const first = await w.poker.create(a, { ...PRIVATE, buyIn: 300 });
    for (const body of [{ ...PRIVATE, buyIn: 300 }, { maison: "kiosque" }, { defi: "kiosque" }]) {
      const r = await w.poker.create(a, body) as Reply;
      expect([r.status, r.body.error]).toEqual([409, { code: "ALREADY_SEATED", message: "Tu es déjà assis à une table. Quitte-la avant d'en rejoindre une autre." }]);
    }
    expect(w.storage.tableCodes()).toEqual([first.body.view!.code]);
    expect(w.balance(a)).toBe(4_700);
    // Une fois parti, il peut en ouvrir une autre.
    await w.poker.act(a, first.body.view!.code, { type: "quitter" });
    expect((await w.poker.create(a, { maison: "kiosque" })).status).toBe(201);
  });

  it("une table de la maison : l'hôte du lieu et deux autres personnages, et la partie part aussitôt", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 5_000, CAFE_GOODS);
    const r = await w.poker.create(a, { maison: "cafe", buyIn: 600 });
    expect(r.status).toBe(201);
    const view = r.body.view!;
    expect(view).toMatchObject({ kind: "maison", place: "cafe", blind: 10, minBuyIn: 200, maxBuyIn: 1_000, difficulty: "facile", started: true, phase: "triche", handNo: 1, you: 0 });
    expect(view.seats.map((s) => s!.bot)).toEqual([null, "ondine", expect.any(String), expect.any(String)]);
    expect(new Set(view.seats.map((s) => s!.bot)).size).toBe(4);
    expect(view.seats.map((s) => s!.stack)).toEqual([590, 990, 990, 990]);
    expect(view.hand!.cards).toHaveLength(5);
    expect(view.options).toMatchObject({ cheat: true, start: false });
    expect(view.deadline).toBe(T0 + CHEAT_MS);
    expect(r.body.state!.balance).toBe(4_400);
    // Elle n'a pas de code à partager : personne d'autre ne peut la voir ni la rejoindre.
    const b = await w.signup("Lulu", 5_000, CAFE_GOODS);
    expect((await w.poker.poll(b, view.code) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    expect((await w.poker.join(b, view.code, 300) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    expect(w.balance(b)).toBe(5_000);
    expect((await w.poker.lobby(a)).body.seat).toEqual({ code: view.code, kind: "maison", place: "cafe" });
  });

  it("un défi : un tête-à-tête avec l'hôte, 30 blindes chacun", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 100);
    const r = await w.poker.create(a, { defi: "kiosque" });
    expect(r.status).toBe(201);
    expect(r.body.view).toMatchObject({ kind: "defi", place: "kiosque", blind: 1, minBuyIn: 30, maxBuyIn: 30, difficulty: "facile", phase: "triche", started: true });
    expect(r.body.view!.seats.map((s) => [s!.bot, s!.stack])).toEqual([[null, 29], ["gaspard", 29]]);
    expect(r.body.view!.options.rebuy).toBeNull();
    expect(r.body.state!.balance).toBe(70);
  });

  it("comme partout, les tickets grattés déclarés avec la requête comptent dans la bourse", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 10);
    w.storage.poke(a.playerId, (p) => {
      p.pending = [{ id: "t_gagnant00000", type: "tirelire", gain: 25, seed: 1, at: T0 }, { id: "t_autre0000000", type: "tirelire", gain: 500, seed: 2, at: T0 }];
    });
    // 10 € en poche : pas assez. Avec le ticket de 25 € déclaré : 35 €, de quoi relever le défi.
    expect((await w.poker.create(a, { defi: "kiosque" }) as Reply).body.error.code).toBe("BUYIN_UNAFFORDABLE");
    const r = await w.poker.create(a, { defi: "kiosque", ack: ["t_gagnant00000"] });
    expect(r.status).toBe(201);
    expect(r.body.state).toMatchObject({ balance: 5, pending: [{ id: "t_autre0000000" }] });
    expect(r.body.state!.stats).toMatchObject({ winners: 1, won: 25 });
  });

  it("deux codes ne se marchent pas dessus : un code déjà pris est retiré au sort", async () => {
    const w = makeWorld();
    const accounts = await Promise.all(Array.from({ length: 12 }, (_, i) => w.signup(`Joueur ${i}`, 1_000)));
    const codes: string[] = [];
    for (const a of accounts) codes.push((await w.poker.create(a, { maison: "kiosque", buyIn: 50 })).body.view!.code);
    expect(new Set(codes).size).toBe(12);
    expect(w.storage.tableCodes().sort()).toEqual([...codes].sort());
  });
});

describe("rejoindre une table", () => {
  it("avec le code et une cave : le joueur s'assoit au premier siège libre", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900)];
    const code = (await w.poker.create(a, { ...PRIVATE, buyIn: 500 })).body.view!.code;
    // Le code s'accepte en minuscules, avec des espaces.
    const r = await w.poker.join(b, ` ${code.toLowerCase().slice(0, 2)} ${code.toLowerCase().slice(2)}`, 300);
    expect(r.status).toBe(200);
    expect(r.body.view).toMatchObject({ code, you: 1, owner: 0, phase: "attente" });
    expect(r.body.view!.seats.map((s) => (s ? [s.pseudo, s.stack] : null))).toEqual([["Marcel", 500], ["Lulu", 300], null, null]);
    expect(r.body.state).toMatchObject({ balance: 600, poker: { code } });
    // Le créateur voit arriver son ami, et peut lancer.
    const seen = await w.view(a, code);
    expect(seen.seats[1]).toMatchObject({ pseudo: "Lulu", stack: 300, funded: true });
    expect(seen.options.start).toBe(true);
    expect(w.money([a, b])).toBe(5_900);
  });

  it("rejoindre deux fois ne débite qu'une fois", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900)];
    const code = await seated(w, [a, b], 300);
    const again = await w.poker.join(b, code, 300);
    expect(again.status).toBe(200);
    expect(again.body.view!.you).toBe(1);
    expect(w.balance(b)).toBe(600);
    expect(w.table(code)!.seats.filter(Boolean)).toHaveLength(2);
    expect(w.money([a, b])).toBe(5_900);
  });

  it("TABLE_NOT_FOUND : code inconnu, mal formé, ou table fermée", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900)];
    for (const code of ["ZZZZZ", "abc", "ABCDEF", "AB0DE", ""]) {
      const r = await w.poker.join(b, code, 300) as Reply;
      expect([code, r.status, r.body.error]).toEqual([code, 404, { code: "TABLE_NOT_FOUND", message: "Cette table n'existe pas, ou elle a fermé. Vérifie le code." }]);
    }
    const code = await seated(w, [a], 300);
    await w.poker.act(a, code, { type: "quitter" });
    expect((await w.poker.join(b, code, 300) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    expect(w.balance(b)).toBe(900);
  });

  it("TABLE_FULL : plus de siège libre", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900), await w.signup("Zoé", 900)];
    const code = (await w.poker.create(a, { blind: 10, maxBuyIn: 1000, seats: 3, bots: 1, buyIn: 300 })).body.view!.code;
    expect((await w.poker.join(b, code, 300)).status).toBe(200);
    const r = await w.poker.join(c, code, 300) as Reply;
    expect([r.status, r.body.error]).toEqual([409, { code: "TABLE_FULL", message: "Cette table est complète. Attends qu'un siège se libère." }]);
    expect(w.balance(c)).toBe(900);
    // Un siège se libère : il peut s'asseoir.
    await w.poker.act(b, code, { type: "quitter" });
    expect((await w.poker.join(c, code, 300)).body.view!.you).toBe(1);
  });

  it("ALREADY_SEATED : assis à une autre table", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const first = await seated(w, [a], 300);
    const second = await seated(w, [b], 300);
    const r = await w.poker.join(b, first, 300) as Reply;
    expect([r.status, r.body.error.code]).toEqual([409, "ALREADY_SEATED"]);
    expect(w.table(first)!.seats.filter(Boolean)).toHaveLength(1);
    expect(w.balance(b)).toBe(4_700);
    expect(w.table(second)!.seats[0]!.playerId).toBe(b.playerId);
  });

  it("BUYIN_UNAFFORDABLE et BAD_REQUEST : la cave doit tenir dans la bourse et dans les limites de la table", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 250)];
    const code = await seated(w, [a], 300);
    expect((await w.poker.join(b, code, 251) as Reply).body.error.code).toBe("BUYIN_UNAFFORDABLE");
    w.storage.poke(b.playerId, (p) => { p.balance = 5_000; });
    for (const buyIn of [199, 1_001]) expect((await w.poker.join(b, code, buyIn) as Reply).body.error.code).toBe("BAD_REQUEST");
    for (const body of [{ code }, { buyIn: 300 }, { code, buyIn: "300" }, { code, buyIn: 300.5 }, { code: 12345, buyIn: 300 }, { code, buyIn: -5 }]) {
      const r = await w.call("POST", "/api/poker/join", body, b.auth);
      expect([JSON.stringify(body), r.status, r.body.error.code]).toEqual([JSON.stringify(body), 400, "BAD_REQUEST"]);
    }
    expect(w.table(code)!.seats.filter(Boolean)).toHaveLength(1);
    expect(w.balance(b)).toBe(5_000);
    expect((await w.poker.join(b, code, 200)).status).toBe(200);
  });

  it("arrivé en pleine main, on attend la suivante", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
    const code = await started(w, [a, b], 500);
    const r = await w.poker.join(c, code, 400);
    expect(r.body.view).toMatchObject({ you: 2, phase: "triche", hand: null });
    expect(r.body.view!.seats[2]).toMatchObject({ inHand: false, stack: 400 });
    expect(r.body.view!.options).toMatchObject({ cheat: false, rebuy: { min: 1, max: 600 } });
    expect((await w.poker.act(c, code, { type: "franc-jeu" }) as Reply).body.error.code).toBe("ACTION_IMPOSSIBLE");
    expect(w.money([a, b, c])).toBe(15_000);
  });
});

describe("regarder la table", () => {
  it("si la version n'a pas changé : la réponse minimale, sans rien écrire", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    const first = await w.poker.poll(a, code);
    expect(first.status).toBe(200);
    const v = first.body.view!.version;
    expect(first.body.state).toBeUndefined();
    expect(first.body.left).toBeUndefined();
    const ops = { ...w.storage.ops };
    const again = await w.poker.poll(a, code, v);
    expect([again.status, again.body]).toEqual([200, { unchanged: true }]);
    // Une lecture du joueur, une lecture de la table, aucune écriture.
    expect(w.storage.ops).toEqual({ ...ops, playerReads: ops.playerReads + 1, tableReads: ops.tableReads + 1 });
    // Une version périmée, ou pas de version : la vue entière.
    expect((await w.poker.poll(a, code, v - 1)).body.view!.version).toBe(v);
    expect((await w.poker.poll(a, code)).body.view!.version).toBe(v);
    // Quelqu'un agit : la version monte, la vue revient.
    await w.poker.act(b, code, { type: "franc-jeu" });
    const after = await w.poker.poll(a, code, v);
    expect(after.body.view!.version).toBe(v + 1);
    expect(after.body.view!.seats[1]).toMatchObject({ done: true });
  });

  it("l'avance paresseuse : chaque requête fait d'abord arriver ce qui devait arriver", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    const v = (await w.view(a, code)).version;
    // Rien ne bouge tant que le délai court.
    w.advance(CHEAT_MS - 1);
    expect((await w.poker.poll(a, code, v)).body).toEqual({ unchanged: true });
    // Le délai de la triche est passé : franc jeu pour tous, les enchères commencent.
    w.advance(1);
    const betting = (await w.poker.poll(a, code, v)).body.view!;
    expect(betting).toMatchObject({ phase: "encheres", turn: 1, deadline: T0 + CHEAT_MS + TURN_MS, now: T0 + CHEAT_MS });
    expect(betting.version).toBeGreaterThan(v);
    expect(w.table(code)!.phase).toBe("encheres");
    // Une longue absence se rejoue d'un coup, dans l'ordre : les deux joueurs finissent écartés,
    // la table se ferme, les tapis retournent aux bourses, le blob disparaît.
    w.advance(10 * 60_000);
    const gone = await w.poker.poll(a, code, betting.version);
    expect(gone.status).toBe(200);
    expect(gone.body.view).toMatchObject({ phase: "fermee", closed: "vide", you: null });
    expect(gone.body.left).toMatchObject({ reason: "absent", bonus: 0 });
    expect(gone.body.state!.poker).toBeUndefined();
    expect(w.storage.tableCodes()).toEqual([]);
    // L'autre joueur a été crédité sans avoir rien demandé.
    expect(w.storage.peek(b.playerId)!.poker).toBeNull();
    expect(w.balance(a) + w.balance(b)).toBe(10_000);
    expect(gone.body.left!.payout).toBe(w.balance(a) - 4_500);
    // Ensuite, la table n'existe plus.
    expect((await w.poker.poll(b, code) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    expect((await w.poker.lobby(b)).body.seat).toBeNull();
  });

  it("un aperçu pour qui n'est pas assis : de quoi choisir sa cave, rien de caché", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
    const code = await started(w, [a, b]);
    const r = await w.poker.poll(c, code);
    expect(r.status).toBe(200);
    expect(r.body.view).toMatchObject({ code, you: null, hand: null, blind: 10, minBuyIn: 200, maxBuyIn: 1000, phase: "triche", pot: 20 });
    expect(r.body.view!.seats.map((s) => s?.cards ?? null)).toEqual([null, null, null, null]);
    expect(r.body.left).toBeUndefined();
    const hidden = w.table(code)!.hand!.players.flatMap((p) => p.cards);
    for (const card of hidden) expect(JSON.stringify(r.body)).not.toContain(`"${card}"`);
    expect(w.balance(c)).toBe(5_000);
  });

  it("TABLE_NOT_FOUND : code inconnu ou mal formé", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 5_000);
    for (const query of ["?code=ZZZZZ", "?code=abc", "", "?code=", "?v=3"]) {
      const r = await w.call("GET", `/api/poker/table${query}`, undefined, a.auth);
      expect([query, r.status, r.body.error.code]).toEqual([query, 404, "TABLE_NOT_FOUND"]);
    }
  });

  it("la vue ne montre jamais les cartes cachées des autres, ni dans la réponse d'une action", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
    const code = await started(w, [a, b, c]);
    setHands(w, code, { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c", 2: "Qs Jd 8c 6h 2s" });
    const others = { [a.playerId]: ["Kc", "Kd", "9s", "4h", "3c", "Qs", "Jd", "8c", "6h", "2s"], [b.playerId]: ["As", "Ad", "7c", "5h", "2d", "Qs", "Jd", "8c", "6h", "2s"] };
    const clean = (who: Account, body: unknown) => {
      const text = JSON.stringify(body);
      for (const card of others[who.playerId]!) expect([who.pseudo, card, text.includes(`"${card}"`)]).toEqual([who.pseudo, card, false]);
      expect(text).not.toContain("playerId");
      expect(text).not.toContain("\"sid\"");
    };
    clean(a, (await w.poker.poll(a, code)).body);
    // Lulu triche : personne d'autre ne le sait.
    const cheat = await w.poker.act(b, code, { type: "tricher", index: 2, card: "Kh" });
    expect(cheat.body.view!.hand).toMatchObject({ cards: ["Kc", "Kd", "Kh", "4h", "3c"], swap: { index: 2, from: "9s" }, category: "brelan" });
    clean(a, (await w.poker.act(a, code, { type: "franc-jeu" })).body);
    const betting = await w.poker.act(c, code, { type: "franc-jeu" });
    expect(betting.body.view!.phase).toBe("encheres");
    expect(JSON.stringify((await w.poker.poll(a, code)).body)).not.toContain("swap\":{");
    clean(a, (await w.poker.poll(a, code)).body);
    clean(b, (await w.poker.act(b, code, { type: "miser", amount: 30 })).body);
    // Zoé se couche : sa main ne sera jamais montrée.
    await w.poker.act(c, code, { type: "coucher" });
    const showdown = await w.poker.act(a, code, { type: "suivre" });
    expect(showdown.body.view!.phase).toBe("abattage");
    expect(showdown.body.view!.seats.map((s) => s?.cards ?? null)).toEqual([["As", "Ad", "7c", "5h", "2d"], ["Kc", "Kd", "Kh", "4h", "3c"], null, null]);
    for (const card of ["Qs", "Jd", "8c", "6h", "2s", "9s"]) expect(JSON.stringify(showdown.body)).not.toContain(`"${card}"`);
    // Personne n'accuse : la triche de Lulu ne sortira jamais.
    await w.poker.act(a, code, { type: "rien" });
    const result = await w.poker.act(b, code, { type: "rien" });
    expect(result.body.view!.result).toMatchObject({ no: 1, showdown: true, unmasked: [], accusations: [], pots: [{ amount: 90, winners: [{ seat: 1, amount: 90 }] }] });
    for (const who of [a, b, c]) {
      const text = JSON.stringify((await w.poker.poll(who, code)).body);
      expect(text).not.toContain("\"9s\"");
      expect(text).not.toContain("swap\":{");
    }
    expect(JSON.stringify(w.table(code))).not.toContain("swap");
  });
});

describe("agir à la table", () => {
  it("une main entière entre deux joueurs : triche, enchères, accusation, dénouement", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    setHands(w, code, { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c" });
    let va = await w.view(a, code);
    expect(va).toMatchObject({ phase: "triche", dealer: 0, pot: 20, you: 0, deadline: T0 + CHEAT_MS });
    expect(va.hand).toMatchObject({ cards: ["As", "Ad", "7c", "5h", "2d"], category: "paire", swap: null, chosen: false });
    // Lulu se fait un brelan ; Marcel joue franc jeu.
    w.advance(3_000);
    await w.poker.act(b, code, { type: "tricher", index: 2, card: "Kh" }, va.step);
    w.advance(2_000);
    const fair = await w.poker.act(a, code, { type: "franc-jeu" }, va.step);
    expect(fair.body.view).toMatchObject({ phase: "encheres", turn: 1, deadline: T0 + 5_000 + TURN_MS });
    expect(fair.body.view!.options).toMatchObject({ fold: false, check: false });
    // Lulu parle la première (le donneur est Marcel).
    let vb = await w.view(b, code);
    expect(vb.options).toMatchObject({ check: true, bet: { min: 10, max: 20 }, fold: true });
    const bet = await w.poker.act(b, code, { type: "miser", amount: 20 }, vb.step);
    expect(bet.body.view).toMatchObject({ pot: 40, bet: 20, turn: 0 });
    va = await w.view(a, code);
    expect(va.options).toMatchObject({ call: 20, raise: { min: 30, max: 80 }, fold: true });
    const raise = await w.poker.act(a, code, { type: "relancer", amount: 80 }, va.step);
    expect(raise.body.view).toMatchObject({ pot: 120, bet: 80, turn: 1 });
    vb = await w.view(b, code);
    const call = await w.poker.act(b, code, { type: "suivre" }, vb.step);
    expect(call.body.view).toMatchObject({ phase: "abattage", pot: 180, turn: null, deadline: T0 + 5_000 + 20_000 });
    // Les deux mains sont montrées. Marcel trouve ce brelan trop beau.
    va = await w.view(a, code);
    expect(va.seats[1]).toMatchObject({ cards: ["Kc", "Kd", "Kh", "4h", "3c"], category: "brelan" });
    expect(va.options.accuse).toEqual([1]);
    await w.poker.act(a, code, { type: "accuser", seat: 1 }, va.step);
    const done = await w.poker.act(b, code, { type: "rien" }, va.step);
    expect(done.body.view).toMatchObject({ phase: "denouement", pot: 0, hand: null, deadline: T0 + 5_000 + RESULT_MS });
    expect(done.body.view!.result).toEqual({
      no: 1, showdown: true,
      hands: [{ seat: 1, cards: ["Kc", "Kd", "Kh", "4h", "3c"], category: "brelan" }, { seat: 0, cards: ["As", "Ad", "7c", "5h", "2d"], category: "paire" }],
      accusations: [{ from: 0, to: 1, right: true, paid: 0 }],
      unmasked: [{ seat: 1, index: 2, from: "9s", to: "Kh" }],
      pots: [{ amount: 180, winners: [{ seat: 0, amount: 180 }], carried: false }],
      net: [{ seat: 1, amount: -90 }, { seat: 0, amount: 90 }],
      carry: 0, until: T0 + 5_000 + RESULT_MS,
    });
    expect(done.body.view!.seats.map((s) => s?.stack ?? null)).toEqual([590, 410, null, null]);
    // Les bourses n'ont pas bougé : l'argent est sur la table.
    expect([w.balance(a), w.balance(b)]).toEqual([4_500, 4_500]);
    expect(w.money([a, b])).toBe(10_000);
    // La main suivante part toute seule.
    w.advance(RESULT_MS);
    expect(await w.view(b, code)).toMatchObject({ phase: "triche", handNo: 2, dealer: 1, pot: 20 });
  });

  it("NOT_YOUR_TURN et ACTION_IMPOSSIBLE : les gestes refusés ne changent rien", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    const refused = async (who: Account, action: PokerAction, step?: number) => {
      const before = JSON.stringify(w.table(code));
      const r = await w.poker.act(who, code, action, step) as Reply;
      expect(JSON.stringify(w.table(code))).toBe(before);
      return [r.status, r.body.error?.code, r.body.error?.message];
    };
    // Pendant la triche : pas d'enchère, pas d'accusation.
    expect(await refused(a, { type: "parole" })).toEqual([409, "ACTION_IMPOSSIBLE", "Ce geste n'est pas possible maintenant."]);
    expect(await refused(a, { type: "accuser", seat: 1 })).toEqual([409, "ACTION_IMPOSSIBLE", "Ce geste n'est pas possible maintenant."]);
    expect(await refused(a, { type: "lancer" })).toEqual([409, "ACTION_IMPOSSIBLE", "Ce geste n'est pas possible maintenant."]);
    const mine = (await w.view(a, code)).hand!.cards;
    expect((await refused(a, { type: "tricher", index: 0, card: mine[3]! }))[1]).toBe("ACTION_IMPOSSIBLE");
    await w.poker.act(a, code, { type: "franc-jeu" });
    await w.poker.act(b, code, { type: "franc-jeu" });
    // Aux enchères, c'est à Lulu de parler.
    expect(await refused(a, { type: "parole" })).toEqual([409, "NOT_YOUR_TURN", "Ce n'est pas ton tour. Attends que la parole te revienne."]);
    expect((await refused(a, { type: "tapis" }))[1]).toBe("NOT_YOUR_TURN");
    expect((await refused(b, { type: "miser", amount: 21 }))[1]).toBe("ACTION_IMPOSSIBLE");
    expect((await refused(b, { type: "suivre" }))[1]).toBe("ACTION_IMPOSSIBLE");
    expect((await refused(b, { type: "relancer", amount: 40 }))[1]).toBe("ACTION_IMPOSSIBLE");
    expect((await refused(b, { type: "franc-jeu" }))[1]).toBe("ACTION_IMPOSSIBLE");
    // Une décision prise sur une vue périmée.
    const step = (await w.view(b, code)).step;
    expect((await refused(b, { type: "parole" }, step - 1))[1]).toBe("ACTION_IMPOSSIBLE");
    expect((await w.poker.act(b, code, { type: "parole" }, step)).status).toBe(200);
  });

  it("NOT_SEATED et TABLE_NOT_FOUND : agir là où l'on n'est pas", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
    const code = await started(w, [a, b]);
    for (const action of [{ type: "franc-jeu" }, { type: "parole" }, { type: "quitter" }, { type: "recaver", amount: 100 }, { type: "retour" }] as PokerAction[]) {
      const r = await w.poker.act(c, code, action) as Reply;
      expect([action.type, r.status, r.body.error]).toEqual([action.type, 409, { code: "NOT_SEATED", message: "Tu n'es plus assis à cette table." }]);
    }
    for (const action of [{ type: "franc-jeu" }, { type: "quitter" }, { type: "recaver", amount: 100 }] as PokerAction[]) {
      const r = await w.poker.act(a, "ZZZZZ", action) as Reply;
      expect([action.type, r.status, r.body.error.code]).toEqual([action.type, 404, "TABLE_NOT_FOUND"]);
    }
    expect((await w.call("POST", "/api/poker/act", { code: "abc", action: { type: "parole" } }, a.auth)).body.error.code).toBe("TABLE_NOT_FOUND");
    expect(w.balance(c)).toBe(5_000);
  });

  it("BAD_REQUEST : une action illisible", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    for (const body of [
      { code }, { action: { type: "parole" } }, { code, action: "parole" }, { code, action: [] }, { code, action: {} },
      { code, action: { type: "bluffer" } }, { code, action: { type: 3 } },
      { code, action: { type: "tricher" } }, { code, action: { type: "tricher", index: 5, card: "Ah" } },
      { code, action: { type: "tricher", index: 0, card: "Ax" } }, { code, action: { type: "tricher", index: "0", card: "Ah" } },
      { code, action: { type: "miser" } }, { code, action: { type: "miser", amount: 0 } }, { code, action: { type: "miser", amount: 12.5 } },
      { code, action: { type: "relancer", amount: "40" } }, { code, action: { type: "recaver", amount: -100 } },
      { code, action: { type: "accuser" } }, { code, action: { type: "accuser", seat: 6 } }, { code, action: { type: "accuser", seat: 1.5 } },
      { code, action: { type: "franc-jeu" }, step: "3" }, { code, action: { type: "franc-jeu" }, step: 1.5 },
      { code: 42, action: { type: "franc-jeu" } }, { code, action: { type: "franc-jeu" }, ack: [42] },
    ]) {
      const r = await w.call("POST", "/api/poker/act", body, a.auth);
      expect([JSON.stringify(body), r.status, r.body.error.code]).toEqual([JSON.stringify(body), 400, "BAD_REQUEST"]);
    }
    expect(w.table(code)!.hand!.players.every((p) => !p.chosen)).toBe(true);
  });

  it("quitter : le tapis retourne à la bourse ; en pleine main, c'est se coucher", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
    const code = await started(w, [a, b, c]);
    const r = await w.poker.act(b, code, { type: "quitter" });
    expect(r.status).toBe(200);
    // Sa blinde reste au pot.
    expect(r.body.left).toEqual({ reason: "quitte", payout: 490, bonus: 0 });
    expect(r.body.state).toMatchObject({ balance: 4_990 });
    expect(r.body.state!.poker).toBeUndefined();
    expect(r.body.view).toMatchObject({ you: null, hand: null, pot: 30 });
    expect(r.body.view!.seats[1]).toBeNull();
    // La table a rendu le tapis et n'en garde rien.
    expect(w.table(code)!.ended).toEqual([]);
    expect(w.money([a, b, c])).toBe(15_000);
    // Quitter deux fois : il n'est plus assis.
    const again = await w.poker.act(b, code, { type: "quitter" }) as Reply;
    expect([again.status, again.body.error.code]).toEqual([409, "NOT_SEATED"]);
    expect(w.balance(b)).toBe(4_990);
    // Sa prochaine visite lui dit pourquoi il n'est plus là.
    const seen = await w.poker.poll(b, code);
    expect(seen.body.left).toEqual({ reason: "quitte", payout: 490, bonus: 0 });
    expect(seen.body.state).toBeUndefined();
    // Les autres continuent ; quand tous sont partis, la table disparaît.
    await w.poker.act(a, code, { type: "quitter" });
    const last = await w.poker.act(c, code, { type: "quitter" });
    expect(last.body.view).toMatchObject({ phase: "fermee", closed: "vide" });
    expect(w.storage.tableCodes()).toEqual([]);
    expect(w.balance(a) + w.balance(b) + w.balance(c)).toBe(15_000);
    expect((await w.poker.act(c, code, { type: "quitter" }) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
  });

  it("recaver : entre deux mains ou une fois couché, jusqu'à la cave maximale", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await seated(w, [a, b], 300);
    expect((await w.view(a, code)).options.rebuy).toEqual({ min: 1, max: 700 });
    const r = await w.poker.act(a, code, { type: "recaver", amount: 200 });
    expect(r.status).toBe(200);
    expect(r.body.view!.seats[0]).toMatchObject({ stack: 500, reserve: 0 });
    expect(r.body.state).toMatchObject({ balance: 4_500 });
    expect(w.storage.peek(a.playerId)!.poker).toMatchObject({ seq: 2, paid: 500 });
    expect(w.table(code)!.seats[0]).toMatchObject({ seq: 2, received: 500 });
    // Au-delà de la cave maximale, ou sans le sou : refusé, rien ne bouge.
    expect((await w.poker.act(a, code, { type: "recaver", amount: 501 }) as Reply).body.error.code).toBe("ACTION_IMPOSSIBLE");
    w.storage.poke(b.playerId, (p) => { p.balance = 50; });
    const poor = await w.poker.act(b, code, { type: "recaver", amount: 100 }) as Reply;
    expect([poor.status, poor.body.error.code]).toEqual([409, "BUYIN_UNAFFORDABLE"]);
    expect(w.table(code)!.seats[1]).toMatchObject({ stack: 300, seq: 1 });
    // Dans le coup, on ne recave pas ; couché, si.
    await w.poker.act(a, code, { type: "lancer" });
    expect((await w.poker.act(a, code, { type: "recaver", amount: 100 }) as Reply).body.error.code).toBe("ACTION_IMPOSSIBLE");
    await w.poker.act(a, code, { type: "franc-jeu" });
    await w.poker.act(b, code, { type: "franc-jeu" });
    await w.poker.act(b, code, { type: "miser", amount: 10 });
    await w.poker.act(a, code, { type: "coucher" });
    const folded = await w.poker.act(a, code, { type: "recaver", amount: 100 });
    expect(folded.body.view!.seats[0]).toMatchObject({ stack: 590 });
    expect(w.balance(a)).toBe(4_400);
    // Les 5 000 € de Marcel, les 300 € que Lulu a posés et les 50 € qu'on lui a laissés.
    expect(w.money([a, b])).toBe(5_350);
  });

  it("un joueur écarté pour absence est crédité par la requête d'un autre, et l'apprend à sa prochaine visite", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
    const code = await started(w, [a, b, c]);
    // Zoé ne répond plus. Marcel et Lulu jouent trois minutes, seconde par seconde.
    for (let i = 0; i < 180 && w.table(code)!.seats[2]; i++) {
      w.advance(1_000);
      for (const who of [a, b]) {
        const view = await w.view(who, code);
        const o = view.options;
        if (o.cheat) await w.poker.act(who, code, { type: "franc-jeu" }, view.step);
        else if (o.fold) await w.poker.act(who, code, o.check ? { type: "parole" } : { type: "suivre" }, view.step);
        else if (o.accuse.length > 0) await w.poker.act(who, code, { type: "rien" }, view.step);
      }
    }
    expect(w.table(code)!.seats[2]).toBeNull();
    // Son tapis est déjà dans sa bourse, et sa séance est close.
    const zoe = w.storage.peek(c.playerId)!;
    expect(zoe.poker).toBeNull();
    expect(zoe.balance).toBeGreaterThan(4_900);
    expect(w.table(code)!.ended).toEqual([]);
    expect(w.money([a, b, c])).toBe(15_000);
    const seen = await w.poker.poll(c, code);
    expect(seen.body.view!.you).toBeNull();
    expect(seen.body.left).toEqual({ reason: "absent", payout: zoe.balance - 4_500, bonus: 0 });
    expect((await w.call("GET", "/api/me", undefined, c.auth)).body.state.poker).toBeUndefined();
    // La table continue pour les deux autres.
    expect(w.table(code)!.phase).not.toBe("fermee");
  });

  it("« retour » : un joueur absent reprend la main", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    w.advance(CHEAT_MS + 2 * TURN_MS);
    const away = await w.view(a, code);
    expect(away.seats.map((s) => s?.absent ?? null)).toEqual([true, true, null, null]);
    expect(away.options.back).toBe(true);
    const r = await w.poker.act(a, code, { type: "retour" });
    expect(r.body.view!.seats[0]).toMatchObject({ absent: false });
    expect(r.body.view!.options.back).toBe(false);
  });

  it("« suite » : sans attendre la fin du dénouement quand tout le monde est prêt", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    for (const action of [{ type: "franc-jeu" }, { type: "parole" }, { type: "rien" }] as PokerAction[]) {
      await w.poker.act(b, code, action);
      await w.poker.act(a, code, action);
    }
    const done = await w.view(a, code);
    expect(done).toMatchObject({ phase: "denouement", handNo: 1, deadline: T0 + RESULT_MS });
    expect(done.options.next).toBe(true);
    const first = await w.poker.act(a, code, { type: "suite" }, done.step);
    expect(first.body.view).toMatchObject({ phase: "denouement" });
    expect(first.body.view!.options.next).toBe(false);
    expect(first.body.view!.seats[0]).toMatchObject({ done: true });
    const second = await w.poker.act(b, code, { type: "suite" }, done.step);
    expect(second.body.view).toMatchObject({ phase: "triche", handNo: 2, deadline: T0 + CHEAT_MS });
    // Trop tard pour la demander : la main est déjà partie.
    expect((await w.poker.act(a, code, { type: "suite" }) as Reply).body.error.code).toBe("ACTION_IMPOSSIBLE");
  });

  it("une table sans activité depuis 30 minutes se ferme et rend les tapis", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await seated(w, [a, b], 400);
    w.advance(IDLE_TABLE_MS - 1);
    expect((await w.view(a, code)).phase).toBe("attente");
    w.advance(1);
    const r = await w.poker.poll(a, code);
    expect(r.body.view).toMatchObject({ phase: "fermee", closed: "inactive", you: null });
    expect(r.body.left).toEqual({ reason: "inactive", payout: 400, bonus: 0 });
    expect(r.body.state).toMatchObject({ balance: 5_000 });
    expect([w.balance(a), w.balance(b)]).toEqual([5_000, 5_000]);
    expect(w.storage.tableCodes()).toEqual([]);
    expect(w.storage.peek(b.playerId)!.poker).toBeNull();
  });
});

describe("les défis de la campagne", () => {
  /** Met le joueur et l'hôte à tapis avec les mains voulues, puis déroule la main jusqu'au dénouement. */
  async function allIn(w: World, a: Account, code: string, mine: string, host: string): Promise<void> {
    w.storage.pokeTable(code, (t) => {
      for (const p of t.hand!.players) {
        const seat = t.seats[p.seat]!;
        p.cards = (seat.bot === null ? mine : host).split(" ");
        p.committed += seat.stack;
        t.hand!.pot += seat.stack;
        seat.stack = 0;
        p.allIn = true;
        // L'hôte a choisi : franc jeu.
        if (seat.bot !== null) { p.chosen = true; p.actAt = null; }
      }
    });
    const fair = await w.poker.act(a, code, { type: "franc-jeu" });
    expect(fair.body.view!.phase).toBe("abattage");
    // L'hôte ne dit rien.
    w.storage.pokeTable(code, (t) => {
      const bot = t.hand!.players.find((p) => t.seats[p.seat]!.bot !== null)!;
      bot.spoke = true;
      bot.actAt = null;
    });
    const quiet = await w.poker.act(a, code, { type: "rien" });
    expect(quiet.body.view!.phase).toBe("denouement");
  }

  it("la première fois que l'hôte est ruiné, il verse sa cagnotte : 100 blindes, une seule fois", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 100);
    expect((await w.poker.lobby(a)).body.challenges[0]).toMatchObject({ place: "kiosque", won: false, bonus: 100 });

    // Premier défi : gagné.
    let code = (await w.poker.create(a, { defi: "kiosque" })).body.view!.code;
    expect(w.balance(a)).toBe(70);
    await allIn(w, a, code, "As Ad 7c 5h 2d", "Kc Kd 9s 4h 3c");
    w.advance(RESULT_MS);
    const won = await w.poker.poll(a, code);
    expect(won.status).toBe(200);
    expect(won.body.view).toMatchObject({ phase: "fermee", closed: "defi", you: null });
    expect(won.body.view!.result!.pots).toEqual([{ amount: 60, winners: [{ seat: 0, amount: 60 }], carried: false }]);
    // Son tapis de 60 €, et la cagnotte de Gaspard : 100 €.
    expect(won.body.left).toEqual({ reason: "defi-gagne", payout: 60, bonus: 100 });
    expect(won.body.state).toMatchObject({ balance: 230 });
    expect(won.body.state!.poker).toBeUndefined();
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 230, poker: null, pokerWins: ["kiosque"] });
    expect(w.storage.tableCodes()).toEqual([]);
    const lobby = (await w.poker.lobby(a)).body;
    expect(lobby.challenges.map((c) => c.won)).toEqual([true, false, false, false, false, false, false, false]);
    expect(lobby.seat).toBeNull();
    // La table n'existe plus : rien à rejouer, rien à reverser.
    expect((await w.poker.poll(a, code) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    expect(w.balance(a)).toBe(230);

    // Deuxième défi au même lieu, gagné encore : le tapis, mais plus de cagnotte.
    code = (await w.poker.create(a, { defi: "kiosque" })).body.view!.code;
    await allIn(w, a, code, "As Ad 7c 5h 2d", "Kc Kd 9s 4h 3c");
    w.advance(RESULT_MS);
    const again = await w.poker.poll(a, code);
    expect(again.body.left).toEqual({ reason: "defi-gagne", payout: 60, bonus: 0 });
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 260, pokerWins: ["kiosque"] });
  });

  it("un défi perdu coûte sa cave, et se retente autant qu'on veut", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 100);
    for (const expected of [70, 40, 10]) {
      const code = (await w.poker.create(a, { defi: "kiosque" })).body.view!.code;
      await allIn(w, a, code, "Kc Kd 9s 4h 3c", "As Ad 7c 5h 2d");
      w.advance(RESULT_MS);
      const lost = await w.poker.poll(a, code);
      expect(lost.body.left).toEqual({ reason: "defi-perdu", payout: 0, bonus: 0 });
      expect(lost.body.state).toMatchObject({ balance: expected });
      expect(w.storage.tableCodes()).toEqual([]);
    }
    expect(w.storage.peek(a.playerId)!.pokerWins ?? []).toEqual([]);
    expect((await w.poker.lobby(a)).body.challenges[0]!.won).toBe(false);
    // Plus de quoi poser la cave.
    expect((await w.poker.create(a, { defi: "kiosque" }) as Reply).body.error.code).toBe("BUYIN_UNAFFORDABLE");
  });

  it("quitter un défi en cours : on repart avec son tapis, sans cagnotte", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 100);
    const code = (await w.poker.create(a, { defi: "kiosque" })).body.view!.code;
    const r = await w.poker.act(a, code, { type: "quitter" });
    expect(r.body.left).toEqual({ reason: "quitte", payout: 29, bonus: 0 });
    expect(r.body.view).toMatchObject({ phase: "fermee", closed: "vide" });
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 99, poker: null });
    expect(w.storage.peek(a.playerId)!.pokerWins ?? []).toEqual([]);
    expect(w.storage.tableCodes()).toEqual([]);
  });

  it("dans un défi, personne ne recave", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 1_000);
    const code = (await w.poker.create(a, { defi: "kiosque" })).body.view!.code;
    const r = await w.poker.act(a, code, { type: "recaver", amount: 10 }) as Reply;
    expect([r.status, r.body.error.code]).toEqual([409, "ACTION_IMPOSSIBLE"]);
    expect(w.balance(a)).toBe(970);
  });

  it("une cagnotte par lieu : chaque hôte verse la sienne", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 10_000, CAFE_GOODS);
    for (const [place, blind] of [["kiosque", 1], ["cafe", 10]] as const) {
      const before = w.balance(a);
      const code = (await w.poker.create(a, { defi: place })).body.view!.code;
      await allIn(w, a, code, "As Ad 7c 5h 2d", "Kc Kd 9s 4h 3c");
      w.advance(RESULT_MS);
      const won = await w.poker.poll(a, code);
      expect(won.body.left).toEqual({ reason: "defi-gagne", payout: 60 * blind, bonus: 100 * blind });
      expect(w.balance(a)).toBe(before + 30 * blind + 100 * blind);
    }
    expect(w.storage.peek(a.playerId)!.pokerWins).toEqual(["kiosque", "cafe"]);
  });

  it("une partie contre la maison jusqu'au bout : ce que la bourse gagne ou perd, c'est le tapis", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 1_000);
    const code = (await w.poker.create(a, { maison: "kiosque", buyIn: 100 })).body.view!.code;
    expect(w.balance(a)).toBe(900);
    // Deux minutes de jeu : franc jeu, parole ou suivre, rien à dire.
    let hands = 0;
    for (let i = 0; i < 240; i++) {
      w.advance(500);
      const r = await w.poker.poll(a, code);
      const view = r.body.view;
      if (!view || view.you === null) break;
      hands = view.handNo;
      const o = view.options;
      if (o.cheat) await w.poker.act(a, code, { type: "franc-jeu" }, view.step);
      else if (o.fold) await w.poker.act(a, code, o.check ? { type: "parole" } : { type: "suivre" }, view.step);
      else if (o.accuse.length > 0) await w.poker.act(a, code, { type: "rien" }, view.step);
    }
    expect(hands).toBeGreaterThan(3);
    const t = w.table(code)!;
    // La bourse n'a pas bougé pendant la partie.
    expect(w.balance(a)).toBe(900);
    const stack = t.seats[0]!.stack + (t.hand ? t.hand.players.find((p) => p.seat === 0 && !p.gone)?.committed ?? 0 : 0);
    const r = await w.poker.act(a, code, { type: "quitter" });
    expect(r.body.left!.reason).toBe("quitte");
    expect(r.body.left!.payout).toBe(t.seats[0]!.stack);
    expect(w.balance(a)).toBe(900 + t.seats[0]!.stack);
    expect(stack).toBeGreaterThanOrEqual(t.seats[0]!.stack);
    expect(w.storage.tableCodes()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// L'argent entre la bourse et la table : deux écritures qui ne sont pas atomiques.

/** Après réparation : chaque séance correspond à un siège payé, et plus rien n'attend nulle part. */
function consistent(w: World, accounts: Account[]): void {
  for (const code of w.storage.tableCodes()) {
    const t = w.table(code)!;
    // Plus de tapis à rendre, et une table fermée qui a tout rendu est effacée.
    expect(t.ended).toEqual([]);
    expect(t.phase).not.toBe("fermee");
    for (const seat of t.seats) {
      if (!seat || seat.bot !== null) continue;
      // Un siège : une séance, et tout ce que la bourse a sorti est arrivé.
      expect(w.storage.peek(seat.playerId)!.poker).toEqual({ code, sid: seat.sid, seq: seat.seq, paid: seat.received });
      expect(seat.seq).toBeGreaterThan(0);
    }
  }
  for (const a of accounts) {
    const session = w.storage.peek(a.playerId)!.poker;
    if (!session) continue;
    const t = w.table(session.code);
    expect(t).not.toBeNull();
    expect(seatIndexOfSession(t!, session.sid)).toBeGreaterThanOrEqual(0);
  }
}

/** Ce que font les requêtes suivantes : chacun repasse par le hall, le temps passe, chacun regarde les tables. */
async function recover(w: World, accounts: Account[]): Promise<void> {
  for (const a of accounts) expect((await w.poker.lobby(a)).status).toBe(200);
  w.advance(RESERVE_MS + 1_000);
  for (const code of w.storage.tableCodes()) {
    for (const a of accounts) await w.poker.poll(a, code);
  }
  for (const a of accounts) expect((await w.poker.lobby(a)).status).toBe(200);
}

interface Cut<C> {
  /** Le monde juste avant la requête à couper. Doit être reproductible. */
  setup: (w: World) => Promise<C>;
  /** La requête pendant laquelle le serveur tombe. */
  request: (w: World, ctx: C) => Promise<Reply>;
  accounts: (ctx: C) => Account[];
  /** Des robots sont à la table : leur argent est fictif, la somme de tout l'argent n'est plus constante. */
  bots?: true;
  /** Après la panne, avant toute réparation. */
  afterCrash?: (w: World, ctx: C, label: string) => void | Promise<void>;
  /** Après les requêtes suivantes. */
  afterRecovery: (w: World, ctx: C, label: string) => void | Promise<void>;
}

/**
 * Rejoue la même requête en coupant le serveur à chaque opération de stockage, juste avant
 * qu'elle ait lieu puis juste après. Rend le nombre de coupures essayées.
 */
async function cutEverywhere<C>(cut: Cut<C>): Promise<number> {
  const dry = makeWorld();
  const ctx0 = await cut.setup(dry);
  const before = dry.calls();
  const ok = await cut.request(dry, ctx0);
  expect(ok.status).toBeLessThan(300);
  const steps = dry.calls() - before;
  expect(steps).toBeGreaterThanOrEqual(3);
  let cuts = 0;
  for (let k = 1; k <= steps; k++) {
    for (const when of ["before", "after"] as const) {
      const label = `coupure ${when === "before" ? "avant" : "après"} l'opération ${k} sur ${steps}`;
      const w = makeWorld();
      const ctx = await cut.setup(w);
      const accounts = cut.accounts(ctx);
      const total = w.money(accounts);
      w.failAt("*", k, when);
      const crashed = await w.crashing(() => cut.request(w, ctx));
      expect([label, crashed.status, crashed.body.error?.code]).toEqual([label, 500, "SERVER_ERROR"]);
      // Rien n'est créé ni détruit, même au milieu du gué.
      if (!cut.bots) expect([label, w.money(accounts)]).toEqual([label, total]);
      await cut.afterCrash?.(w, ctx, label);
      await recover(w, accounts);
      if (!cut.bots) expect([label, w.money(accounts)]).toEqual([label, total]);
      await cut.afterRecovery(w, ctx, label);
      cuts += 1;
    }
  }
  return cuts;
}

describe("l'argent entre la bourse et la table", () => {
  it("s'asseoir, coupé entre la bourse et la table : la requête suivante pose la cave", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900)];
    const code = await seated(w, [a], 500);
    // La table réserve le siège, la bourse paie, et le serveur tombe avant que la table ne reçoive.
    w.failAt("mutateTable", 2);
    const crashed = await w.crashing(() => w.poker.join(b, code, 300));
    expect(crashed.status).toBe(500);
    expect(w.balance(b)).toBe(600);
    expect(w.storage.peek(b.playerId)!.poker).toMatchObject({ code, seq: 1, paid: 300 });
    expect(w.table(code)!.seats[1]).toMatchObject({ playerId: b.playerId, stack: 0, seq: 0, received: 0 });
    // L'argent n'est ni dans la bourse ni sur la table : il est en route, et compté.
    expect(w.money([a, b])).toBe(5_900);
    // GET /api/me dit où le joueur est assis ; la première requête sur la table répare.
    expect((await w.call("GET", "/api/me", undefined, b.auth)).body.state.poker).toEqual({ code });
    const repaired = await w.poker.poll(b, code);
    expect(repaired.body.view!.seats[1]).toMatchObject({ pseudo: "Lulu", stack: 300, funded: true });
    expect(repaired.body.view!.you).toBe(1);
    expect(w.table(code)!.seats[1]).toMatchObject({ stack: 300, seq: 1, received: 300 });
    expect(w.balance(b)).toBe(600);
    expect(w.money([a, b])).toBe(5_900);
    consistent(w, [a, b]);
    // Rejouer la réparation ne crédite rien de plus.
    await w.poker.poll(b, code);
    await w.poker.lobby(b);
    expect(w.table(code)!.seats[1]!.stack).toBe(300);
    expect(w.money([a, b])).toBe(5_900);
  });

  it("s'asseoir, coupé, et le siège réservé expire avant le retour du joueur : la cave retourne à la bourse", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900)];
    const code = await seated(w, [a], 500);
    w.failAt("mutateTable", 2);
    await w.crashing(() => w.poker.join(b, code, 300));
    expect(w.balance(b)).toBe(600);
    // Trente secondes passent. Un autre joueur regarde la table : le siège est libéré.
    w.advance(RESERVE_MS);
    await w.poker.poll(a, code);
    expect(w.table(code)!.seats[1]).toBeNull();
    // La table a soldé la séance au passage : la cave est revenue sans que Lulu ne demande rien.
    expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 900, poker: null });
    expect(w.money([a, b])).toBe(5_900);
    const back = await w.poker.lobby(b);
    expect(back.body).toMatchObject({ seat: null, state: { balance: 900 } });
    consistent(w, [a, b]);
  });

  it("la table a disparu avec une cave en route : tout ce qui était sorti de la bourse y retourne", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900)];
    const code = await seated(w, [a], 500);
    w.failAt("mutateTable", 2);
    await w.crashing(() => w.poker.join(b, code, 300));
    // Le créateur s'en va : la table ferme. Le siège réservé de Lulu part avec.
    await w.poker.act(a, code, { type: "quitter" });
    expect(w.balance(a)).toBe(5_000);
    expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 900, poker: null });
    expect(w.storage.tableCodes()).toEqual([]);
    // Cas d'école : la séance pointe encore vers une table qui n'existe plus.
    w.storage.poke(b.playerId, (p) => { p.balance = 600; p.poker = { code, sid: "s_fantome000000000", seq: 1, paid: 300 }; });
    const r = await w.poker.poll(b, code);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ view: null, left: { reason: "reserve", payout: 300, bonus: 0 }, state: { balance: 900 } });
    expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 900, poker: null });
    // Une seule fois.
    expect((await w.poker.poll(b, code) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    expect(w.balance(b)).toBe(900);
  });

  it("quitter, coupé avant que la bourse ne soit créditée : le tapis attend sur la table, puis arrive une fois", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await seated(w, [a, b], 400);
    w.failAt("mutatePlayer", 1);
    const crashed = await w.crashing(() => w.poker.act(b, code, { type: "quitter" }));
    expect(crashed.status).toBe(500);
    // Le siège est libre, la bourse n'a rien reçu : le tapis est dû.
    expect(w.table(code)!.seats[1]).toBeNull();
    expect(w.table(code)!.ended).toMatchObject([{ playerId: b.playerId, payout: 400, received: 400 }]);
    expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 4_600, poker: { code } });
    expect(w.money([a, b])).toBe(10_000);
    // N'importe quelle requête sur la table solde : ici, celle de l'autre joueur.
    await w.poker.poll(a, code);
    expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 5_000, poker: null });
    expect(w.table(code)!.ended).toEqual([]);
    // Et les suivantes ne versent plus rien.
    await w.poker.poll(a, code);
    await w.poker.lobby(b);
    const again = await w.poker.act(b, code, { type: "quitter" }) as Reply;
    expect(again.body.error.code).toBe("NOT_SEATED");
    expect(w.balance(b)).toBe(5_000);
    expect(w.money([a, b])).toBe(10_000);
    consistent(w, [a, b]);
  });

  it("quitter, coupé après le crédit de la bourse : la table rejoue le versement sans rien verser", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await seated(w, [a, b], 400);
    // La deuxième écriture de la table (l'accusé de réception) n'a pas lieu.
    w.failAt("mutateTable", 2);
    const crashed = await w.crashing(() => w.poker.act(b, code, { type: "quitter" }));
    expect(crashed.status).toBe(500);
    expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 5_000, poker: null });
    // La table croit encore devoir le tapis.
    expect(w.table(code)!.ended).toMatchObject([{ playerId: b.playerId, payout: 400 }]);
    expect(w.money([a, b])).toBe(10_000);
    // Dix requêtes plus tard : toujours 5 000 €.
    for (let i = 0; i < 5; i++) {
      await w.poker.poll(a, code);
      await w.poker.poll(b, code);
    }
    expect(w.balance(b)).toBe(5_000);
    expect(w.table(code)!.ended).toEqual([]);
    consistent(w, [a, b]);
  });

  it("recaver, coupé entre la bourse et la table : la table rattrape le dépôt, une fois", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await seated(w, [a, b], 400);
    w.failAt("mutateTable", 2);
    const crashed = await w.crashing(() => w.poker.act(b, code, { type: "recaver", amount: 250 }));
    expect(crashed.status).toBe(500);
    expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 4_350, poker: { seq: 2, paid: 650 } });
    expect(w.table(code)!.seats[1]).toMatchObject({ stack: 400, seq: 1, received: 400 });
    expect(w.money([a, b])).toBe(10_000);
    // La première requête du joueur sur la table rattrape le dépôt.
    const view = await w.poker.poll(b, code);
    expect(view.body.view!.seats[1]).toMatchObject({ stack: 650 });
    expect(w.table(code)!.seats[1]).toMatchObject({ stack: 650, seq: 2, received: 650 });
    for (let i = 0; i < 3; i++) await w.poker.poll(b, code);
    expect(w.table(code)!.seats[1]!.stack).toBe(650);
    expect(w.money([a, b])).toBe(10_000);
    consistent(w, [a, b]);
  });

  it("une recave partie pendant que le joueur quittait la table lui est rendue avec son tapis", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await seated(w, [a, b], 400);
    // La bourse paie la recave, le serveur tombe ; puis le joueur est écarté avant que la table ne la voie.
    w.failAt("mutateTable", 2);
    await w.crashing(() => w.poker.act(b, code, { type: "recaver", amount: 250 }));
    w.storage.pokeTable(code, (t) => {
      const seat = t.seats[1]!;
      t.ended.push({ sid: seat.sid, playerId: seat.playerId, seat: 1, payout: seat.stack, received: seat.received, reason: "absent", at: T0 });
      t.audit.out += seat.stack;
      t.seats[1] = null;
    });
    expect(w.money([a, b])).toBe(10_000);
    const r = await w.poker.poll(b, code);
    // 400 de tapis, et les 250 qui n'étaient jamais arrivés.
    expect(r.body.left).toEqual({ reason: "absent", payout: 650, bonus: 0 });
    expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 5_000, poker: null });
    expect(w.money([a, b])).toBe(10_000);
  });

  it("s'asseoir à une table qu'on crée : coupé à chaque écriture, pas un euro ne se perd", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => ({ a: await w.signup("Marcel", 5_000) }),
      accounts: ({ a }) => [a],
      request: (w, { a }) => w.poker.create(a, { ...PRIVATE, buyIn: 400 }),
      afterRecovery: (w, { a }, label) => {
        consistent(w, [a]);
        const p = w.storage.peek(a.playerId)!;
        // Ou bien il est assis avec ses 400 €, ou bien il ne l'est pas et n'a rien payé.
        if (p.poker) {
          expect([label, p.balance, w.table(p.poker.code)!.seats[0]!.stack]).toEqual([label, 4_600, 400]);
        } else {
          expect([label, p.balance, w.storage.tableCodes()]).toEqual([label, 5_000, []]);
        }
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("rejoindre une table : coupé à chaque écriture", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900)];
        return { a, b, code: await seated(w, [a], 500) };
      },
      accounts: ({ a, b }) => [a, b],
      request: (w, { b, code }) => w.poker.join(b, code, 300),
      afterRecovery: async (w, { a, b, code }, label) => {
        consistent(w, [a, b]);
        const p = w.storage.peek(b.playerId)!;
        const seat = w.table(code)!.seats[1];
        if (p.poker) expect([label, p.balance, seat?.stack]).toEqual([label, 600, 300]);
        else expect([label, p.balance, seat]).toEqual([label, 900, null]);
        // Dans tous les cas, il peut (re)venir s'asseoir, et ne paie qu'une cave.
        const r = await w.poker.join(b, code, 300);
        expect([label, r.status, w.balance(b), w.table(code)!.seats[1]!.stack]).toEqual([label, 200, 600, 300]);
        expect(w.money([a, b])).toBe(5_900);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("recaver : coupé à chaque écriture", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
        return { a, b, code: await seated(w, [a, b], 400) };
      },
      accounts: ({ a, b }) => [a, b],
      request: (w, { b, code }) => w.poker.act(b, code, { type: "recaver", amount: 250 }),
      afterRecovery: (w, { a, b, code }, label) => {
        consistent(w, [a, b]);
        const stack = w.table(code)!.seats[1]!.stack;
        // La recave est passée en entier, ou pas du tout.
        expect([400, 650]).toContain(stack);
        expect([label, w.balance(b)]).toEqual([label, 5_000 - stack]);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(6);
  });

  it("quitter en pleine main : coupé à chaque écriture", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
        return { a, b, c, code: await started(w, [a, b, c], 400) };
      },
      accounts: ({ a, b, c }) => [a, b, c],
      request: (w, { b, code }) => w.poker.act(b, code, { type: "quitter" }),
      afterRecovery: async (w, { a, b, c, code }, label) => {
        consistent(w, [a, b, c]);
        const p = w.storage.peek(b.playerId)!;
        // Parti avec son tapis moins la blinde, ou toujours assis.
        if (p.poker) expect([label, p.balance]).toEqual([label, 4_600]);
        else expect([label, p.balance]).toEqual([label, 4_990]);
        // Quitter de nouveau finit le travail, sans jamais verser deux fois.
        await w.poker.act(b, code, { type: "quitter" });
        expect([label, w.storage.peek(b.playerId)!.poker]).toEqual([label, null]);
        expect(w.money([a, b, c])).toBe(15_000);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("le dernier joueur s'en va, la table ferme : coupé à chaque écriture", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const a = await w.signup("Marcel", 5_000);
        return { a, code: await seated(w, [a], 400) };
      },
      accounts: ({ a }) => [a],
      request: (w, { a, code }) => w.poker.act(a, code, { type: "quitter" }),
      afterRecovery: async (w, { a, code }, label) => {
        consistent(w, [a]);
        if (w.storage.peek(a.playerId)!.poker) await w.poker.act(a, code, { type: "quitter" });
        expect([label, w.storage.peek(a.playerId)!.balance, w.storage.peek(a.playerId)!.poker, w.storage.tableCodes()]).toEqual([label, 5_000, null, []]);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("une table ferme pour inactivité et rend trois tapis : coupé à chaque écriture", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
        const code = await seated(w, [a, b, c], 400);
        w.advance(IDLE_TABLE_MS);
        return { a, b, c, code };
      },
      accounts: ({ a, b, c }) => [a, b, c],
      request: (w, { a, code }) => w.poker.poll(a, code),
      afterRecovery: (w, { a, b, c }, label) => {
        consistent(w, [a, b, c]);
        expect([label, w.balance(a), w.balance(b), w.balance(c), w.storage.tableCodes()]).toEqual([label, 5_000, 5_000, 5_000, []]);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(12);
  });

  it("un défi gagné : coupé à chaque écriture, la cagnotte n'est versée qu'une fois", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const a = await w.signup("Marcel", 100);
        const code = (await w.poker.create(a, { defi: "kiosque" })).body.view!.code;
        // L'hôte est ruiné : la main est finie, il ne reste qu'à fermer la table.
        w.storage.pokeTable(code, (t) => {
          t.hand = null;
          t.phase = "denouement";
          t.nextAt = w.now() + RESULT_MS;
          t.audit.bank -= 30 - t.seats[1]!.stack;
          t.seats[0]!.stack = 60;
          t.seats[1]!.stack = 0;
        });
        w.advance(RESULT_MS);
        return { a, code };
      },
      accounts: ({ a }) => [a],
      bots: true,
      request: (w, { a, code }) => w.poker.poll(a, code),
      afterRecovery: async (w, { a }, label) => {
        // 70 € restés en poche, 60 € de tapis, 100 € de cagnotte : ni plus, ni moins.
        expect([label, w.storage.peek(a.playerId)!.balance, w.storage.peek(a.playerId)!.pokerWins, w.storage.peek(a.playerId)!.poker]).toEqual([label, 230, ["kiosque"], null]);
        expect(w.storage.tableCodes()).toEqual([]);
        expect((await w.poker.lobby(a)).body.challenges[0]!.won).toBe(true);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("ouvrir une table de la maison : coupé à chaque écriture, la bourse ne paie que ce qui arrive sur la table", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => ({ a: await w.signup("Marcel", 500) }),
      accounts: ({ a }) => [a],
      bots: true,
      request: (w, { a }) => w.poker.create(a, { maison: "kiosque", buyIn: 50 }),
      afterRecovery: (w, { a }, label) => {
        const p = w.storage.peek(a.playerId)!;
        if (p.poker) {
          const t = w.table(p.poker.code)!;
          expect([label, p.balance, t.seats[0]!.received, p.poker.paid]).toEqual([label, 450, 50, 50]);
        } else {
          expect([label, p.balance, w.storage.tableCodes()]).toEqual([label, 500, []]);
        }
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });
});

describe("plusieurs joueurs en même temps", () => {
  it("deux joueurs choisissent au même instant : les deux choix sont pris", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    const free = ["2c", "3c", "4c", "5c", "6c", "7c", "8c"].find((c) => !w.table(code)!.hand!.players.find((p) => p.seat === 1)!.cards.includes(c))!;
    const writes = w.storage.ops.tableWrites;
    const [ra, rb] = await Promise.all([
      w.poker.act(a, code, { type: "franc-jeu" }),
      w.poker.act(b, code, { type: "tricher", index: 0, card: free }),
    ]);
    expect([ra.status, rb.status]).toEqual([200, 200]);
    // Chacune des deux écritures est passée : l'une a dû relire la table et recommencer.
    expect(w.storage.ops.tableWrites).toBe(writes + 2);
    const t = w.table(code)!;
    expect(t.phase).toBe("encheres");
    expect(t.hand!.players.map((p) => [p.seat, p.chosen, p.swap !== null])).toEqual([[1, true, true], [0, true, false]]);
    expect(t.hand!.players[0]!.cards[0]).toBe(free);
    // Chacun a reçu sa propre vue, dans l'état où son geste a laissé la table.
    expect(ra.body.view!.you).toBe(0);
    expect(rb.body.view!.you).toBe(1);
    expect(rb.body.view!.hand!.swap).toMatchObject({ index: 0 });
    expect(ra.body.view!.hand!.swap).toBeNull();
    expect(w.money([a, b])).toBe(10_000);
  });

  it("deux joueurs parlent au même instant : seul celui dont c'est le tour est entendu", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    await w.poker.act(a, code, { type: "franc-jeu" });
    await w.poker.act(b, code, { type: "franc-jeu" });
    expect(w.table(code)!.hand!.turn).toBe(1);
    const [ra, rb] = await Promise.all([
      w.poker.act(a, code, { type: "miser", amount: 20 }) as Promise<Reply>,
      w.poker.act(b, code, { type: "miser", amount: 10 }) as Promise<Reply>,
    ]);
    expect([ra.status, ra.body.error.code]).toEqual([409, "NOT_YOUR_TURN"]);
    expect(rb.status).toBe(200);
    const t = w.table(code)!;
    expect([t.hand!.pot, t.hand!.bet, t.hand!.turn]).toEqual([30, 10, 0]);
  });

  it("six joueurs agissent au même instant : aucun geste n'est appliqué deux fois, aucun n'est perdu sans le dire", async () => {
    const w = makeWorld();
    const accounts = await Promise.all(["Ada", "Bob", "Cléo", "Dédé", "Elsa", "Fred"].map((p) => w.signup(p, 5_000)));
    const code = await seated(w, accounts, 500, { blind: 10, maxBuyIn: 1000, seats: 6, bots: 0 });
    await w.poker.act(accounts[0]!, code, { type: "lancer" });
    const replies = await Promise.all(accounts.map((a) => w.poker.act(a, code, { type: "franc-jeu" }) as Promise<Reply>));
    // Une écriture trop disputée peut être refusée (CONFLICT) : le joueur réessaie. Jamais d'autre erreur.
    for (const r of replies) expect([200, 409]).toContain(r.status);
    for (const r of replies) if (r.status === 409) expect(r.body.error.code).toBe("CONFLICT");
    const t = w.table(code)!;
    accounts.forEach((a, seat) => {
      const chosen = (t.hand ?? { players: [] }).players.find((p) => p.seat === seat)?.chosen ?? true;
      expect([a.pseudo, chosen]).toEqual([a.pseudo, replies[seat]!.status === 200]);
    });
    expect(replies.filter((r) => r.status === 200).length).toBeGreaterThanOrEqual(4);
    // Ceux qui ont été refusés réessaient, et la main avance.
    for (const [seat, r] of replies.entries()) if (r.status !== 200) expect((await w.poker.act(accounts[seat]!, code, { type: "franc-jeu" })).status).toBe(200);
    expect(w.table(code)!.phase).toBe("encheres");
    expect(w.table(code)!.log.filter((e) => e.kind === "choix")).toHaveLength(6);
    expect(w.money(accounts)).toBe(30_000);
  });

  it("CONFLICT : cinq écritures disputées de suite, et rien n'est appliqué", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    let collisions = 0;
    w.storage.beforeTableWrite = (which) => {
      collisions += 1;
      const hook = w.storage.beforeTableWrite;
      w.storage.beforeTableWrite = null;
      // Quelqu'un d'autre écrit la table juste avant nous, à chaque essai.
      w.storage.pokeTable(which, (t) => { t.activeAt += 1; });
      w.storage.beforeTableWrite = hook;
    };
    const r = await w.poker.act(a, code, { type: "franc-jeu" }) as Reply;
    expect([r.status, r.body.error]).toEqual([409, { code: "CONFLICT", message: "Deux demandes sont arrivées en même temps. Réessaie dans un instant." }]);
    expect(collisions).toBe(5);
    expect(w.table(code)!.hand!.players.every((p) => !p.chosen)).toBe(true);
    // Une seule collision : la requête relit la table et passe au deuxième essai.
    let once = true;
    w.storage.beforeTableWrite = (which) => {
      if (!once) return;
      once = false;
      w.storage.pokeTable(which, (t) => { t.activeAt += 1; });
    };
    const ok = await w.poker.act(a, code, { type: "franc-jeu" });
    expect(ok.status).toBe(200);
    expect(w.table(code)!.hand!.players.find((p) => p.seat === 0)!.chosen).toBe(true);
    w.storage.beforeTableWrite = null;
  });

  it("quatre joueurs se disputent deux sièges : deux s'assoient, personne ne paie pour rien", async () => {
    const w = makeWorld();
    const host = await w.signup("Marcel", 5_000);
    const guests = await Promise.all(["Bob", "Cléo", "Dédé", "Elsa"].map((p) => w.signup(p, 1_000)));
    const code = (await w.poker.create(host, { blind: 10, maxBuyIn: 1000, seats: 3, bots: 0, buyIn: 500 })).body.view!.code;
    const replies = await Promise.all(guests.map((g) => w.poker.join(g, code, 300) as Promise<Reply>));
    const seatedCount = replies.filter((r) => r.status === 200).length;
    expect(seatedCount).toBe(2);
    for (const r of replies) if (r.status !== 200) expect(["TABLE_FULL", "CONFLICT"]).toContain(r.body.error.code);
    const all = [host, ...guests];
    await recover(w, all);
    consistent(w, all);
    const t = w.table(code)!;
    expect(t.seats.filter(Boolean)).toHaveLength(3);
    guests.forEach((g, i) => {
      const sits = t.seats.some((s) => s?.playerId === g.playerId);
      expect([g.pseudo, sits, w.balance(g)]).toEqual([g.pseudo, replies[i]!.status === 200, replies[i]!.status === 200 ? 700 : 1_000]);
    });
    expect(w.money(all)).toBe(9_000);
  });

  it("le même joueur rejoint depuis deux onglets : un seul siège, une seule cave", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 900)];
    const code = await seated(w, [a], 500);
    const replies = await Promise.all([w.poker.join(b, code, 300), w.poker.join(b, code, 300), w.poker.join(b, code, 300)]) as Reply[];
    for (const r of replies) expect([200, 409]).toContain(r.status);
    expect(replies.some((r) => r.status === 200)).toBe(true);
    await recover(w, [a, b]);
    consistent(w, [a, b]);
    const t = w.table(code)!;
    expect(t.seats.filter((s) => s?.playerId === b.playerId)).toHaveLength(1);
    expect(t.seats[1]).toMatchObject({ stack: 300, received: 300 });
    expect(w.balance(b)).toBe(600);
    expect(w.money([a, b])).toBe(5_900);
  });

  it("le même joueur s'assoit à deux tables en même temps : une seule l'accueille", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 2_000)];
    const first = await seated(w, [a], 500);
    const second = await seated(w, [b], 500);
    const replies = await Promise.all([w.poker.join(c, first, 300), w.poker.join(c, second, 300)]) as Reply[];
    expect(replies.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(replies.find((r) => r.status === 409)!.body.error.code).toBe("ALREADY_SEATED");
    await recover(w, [a, b, c]);
    consistent(w, [a, b, c]);
    const seats = [first, second].map((code) => w.table(code)!.seats.filter((s) => s?.playerId === c.playerId).length);
    expect(seats.sort()).toEqual([0, 1]);
    expect(w.balance(c)).toBe(1_700);
    expect(w.money([a, b, c])).toBe(12_000);
  });

  it("deux recaves du même joueur en même temps : jamais deux dépôts en route", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await seated(w, [a, b], 300);
    const replies = await Promise.all([
      w.poker.act(b, code, { type: "recaver", amount: 400 }), w.poker.act(b, code, { type: "recaver", amount: 400 }),
    ]) as Reply[];
    // La cave maximale est de 1 000 : les deux recaves ensemble la dépasseraient.
    expect(replies.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(["CONFLICT", "ACTION_IMPOSSIBLE"]).toContain(replies.find((r) => r.status === 409)!.body.error.code);
    await recover(w, [a, b]);
    consistent(w, [a, b]);
    expect(w.table(code)!.seats[1]).toMatchObject({ stack: 700, received: 700 });
    expect(w.balance(b)).toBe(4_300);
    expect(w.money([a, b])).toBe(10_000);
  });

  it("un joueur quitte pendant qu'un autre agit : la main continue, l'argent est juste", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
    const code = await started(w, [a, b, c]);
    const replies = await Promise.all([
      w.poker.act(a, code, { type: "franc-jeu" }), w.poker.act(b, code, { type: "quitter" }), w.poker.act(c, code, { type: "franc-jeu" }),
    ]) as Reply[];
    for (const r of replies) expect([200, 409]).toContain(r.status);
    await recover(w, [a, b, c]);
    if (replies[1]!.status === 200) expect(w.storage.peek(b.playerId)).toMatchObject({ balance: 4_990, poker: null });
    expect(w.money([a, b, c])).toBe(15_000);
  });

  it("dix regards au même instant quand un délai vient de tomber : l'événement n'arrive qu'une fois", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    const v = (await w.view(a, code)).version;
    w.advance(CHEAT_MS);
    const replies = await Promise.all(Array.from({ length: 10 }, (_, i) => w.poker.poll(i % 2 === 0 ? a : b, code, v)));
    for (const r of replies) expect(r.status).toBe(200);
    const versions = new Set(replies.map((r) => r.body.view!.version));
    expect(versions.size).toBe(1);
    const t = w.table(code)!;
    expect(t.version).toBe([...versions][0]);
    // Un seul retard compté par joueur, un seul choix au journal.
    expect(t.seats.filter(Boolean).map((s) => s!.missed)).toEqual([1, 1]);
    expect(t.log.filter((e) => e.kind === "choix")).toHaveLength(2);
    expect(t.phase).toBe("encheres");
  });
});

describe("n'importe quoi, dans n'importe quel ordre", () => {
  it("des joueurs qui s'assoient, jouent, recavent, partent, avec des pannes au hasard : l'argent reste juste à chaque requête", async () => {
    let requests = 0;
    let crashes = 0;
    let hands = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const w = makeWorld();
      // Un hasard propre au test, pour choisir quoi faire.
      let x = (seed * 2654435761) >>> 0;
      const pick = (n: number) => {
        x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
        return x % n;
      };
      const accounts: Account[] = [];
      for (const pseudo of ["Ada", "Bob", "Cléo", "Dédé"]) accounts.push(await w.signup(pseudo, 3_000));
      const total = 12_000;
      let code = "";
      for (let i = 0; i < 160; i++) {
        const who = accounts[pick(accounts.length)]!;
        const dice = pick(100);
        // Une requête sur dix est coupée en route, à une opération au hasard.
        const cut = pick(10) === 0;
        if (cut) w.failAt("*", 1 + pick(6), pick(2) === 0 ? "before" : "after");
        const request = async (): Promise<Reply> => {
          if (!code || !w.table(code)) {
            const r = await w.poker.create(who, { blind: 10, maxBuyIn: 1000, seats: 3 + pick(2), bots: 0, buyIn: 200 + pick(801) });
            if (r.status === 201) code = r.body.view!.code;
            else code = w.storage.tableCodes()[0] ?? code;
            return r;
          }
          if (dice < 12) return w.poker.join(who, code, 200 + pick(801));
          if (dice < 16) return w.poker.act(who, code, { type: "quitter" });
          if (dice < 22) return w.poker.act(who, code, { type: "recaver", amount: 1 + pick(600) });
          if (dice < 26) return w.poker.act(who, code, { type: "lancer" });
          if (dice < 30) return w.poker.lobby(who) as Promise<Reply>;
          if (dice < 34) return w.poker.act(who, code, { type: "retour" });
          const polled = await w.poker.poll(who, code);
          const view = polled.body.view;
          if (!view || view.you === null) return polled;
          const o = view.options;
          if (o.cheat) {
            return w.poker.act(who, code, pick(2) === 0 ? { type: "franc-jeu" } : { type: "tricher", index: pick(5), card: `${"23456789TJQKA"[pick(13)]}${"shdc"[pick(4)]}` }, view.step);
          }
          if (o.fold) {
            const moves: PokerAction[] = [{ type: "coucher" }, { type: "tapis" }, { type: "suivre" }, { type: "parole" }, { type: "miser", amount: 1 + pick(200) }, { type: "relancer", amount: 1 + pick(400) }];
            return w.poker.act(who, code, moves[pick(moves.length)]!, view.step);
          }
          if (o.accuse.length > 0) return w.poker.act(who, code, pick(2) === 0 ? { type: "rien" } : { type: "accuser", seat: pick(4) }, view.step);
          return polled;
        };
        const r = cut ? await w.crashing(request) : await request();
        requests += 1;
        if (r.status === 500) crashes += 1;
        // Jamais d'erreur inattendue hors des pannes provoquées.
        if (!cut) expect([seed, i, r.status < 500]).toEqual([seed, i, true]);
        // Pas un euro créé ni détruit, quoi qu'il vienne de se passer.
        expect([seed, i, w.money(accounts)]).toEqual([seed, i, total]);
        for (const a of accounts) expect(w.balance(a)).toBeGreaterThanOrEqual(0);
        w.advance(pick(4) === 0 ? pick(25_000) : pick(3_000));
        hands = Math.max(hands, code && w.table(code) ? w.table(code)!.handNo : 0);
      }
      // À la fin, tout le monde s'en va : chacun retrouve son argent, il ne reste rien nulle part.
      await recover(w, accounts);
      for (const a of accounts) {
        const session = w.storage.peek(a.playerId)!.poker;
        if (session) await w.poker.act(a, session.code, { type: "quitter" });
      }
      await recover(w, accounts);
      consistent(w, accounts);
      expect([seed, accounts.reduce((sum, a) => sum + w.balance(a), 0)]).toEqual([seed, total]);
      expect(accounts.every((a) => !w.storage.peek(a.playerId)!.poker)).toBe(true);
      // Tout au plus une table vide que personne n'a payée (une création coupée avant le paiement).
      for (const left of w.storage.tableCodes()) expect(chipsOnTable(w.table(left)!)).toBe(0);
    }
    expect(requests).toBe(25 * 160);
    expect(crashes).toBeGreaterThan(100);
    expect(hands).toBeGreaterThan(2);
  });
});

describe("erreurs du poker", () => {
  it("chaque code a son statut et sa phrase, sans code technique dans le message", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000), await w.signup("Zoé", 5_000)];
    const code = (await w.poker.create(a, { blind: 10, maxBuyIn: 1000, seats: 2, bots: 0, buyIn: 500 })).body.view!.code;
    await w.poker.join(b, code, 500);
    await w.poker.act(a, code, { type: "lancer" });
    const purse = (amount: number) => w.storage.poke(c.playerId, (p) => { p.balance = amount; });
    const cases: [string, number, () => Promise<Reply>][] = [
      ["TABLE_NOT_FOUND", 404, () => w.poker.poll(c, "ZZZZZ")],
      ["TABLE_FULL", 409, () => w.poker.join(c, code, 200)],
      ["ALREADY_SEATED", 409, () => w.poker.create(a, { maison: "kiosque" })],
      ["NOT_SEATED", 409, () => w.poker.act(c, code, { type: "parole" })],
      ["ACTION_IMPOSSIBLE", 409, () => w.poker.act(b, code, { type: "accuser", seat: 0 })],
      ["NOT_YOUR_TURN", 409, async () => {
        await w.poker.act(a, code, { type: "franc-jeu" });
        await w.poker.act(b, code, { type: "franc-jeu" });
        return w.poker.act(a, code, { type: "parole" });
      }],
      ["BUYIN_UNAFFORDABLE", 409, () => { purse(60); return w.poker.create(c, { maison: "kiosque", buyIn: 61 }); }],
      ["BLIND_TOO_HIGH", 409, () => { purse(60); return w.poker.create(c, { blind: 2, maxBuyIn: 40, seats: 2, bots: 1 }); }],
      ["PLACE_LOCKED", 403, () => w.poker.create(c, { maison: "lune" })],
      ["BAD_REQUEST", 400, () => w.poker.create(c, { blind: 7, maxBuyIn: 140, seats: 2, bots: 1 })],
    ];
    for (const [expected, status, request] of cases) {
      const r = await request();
      expect([expected, r.status, r.body.error?.code]).toEqual([expected, status, expected]);
      expect(Object.keys(r.body)).toEqual(["error"]);
      expect(Object.keys(r.body.error).sort()).toEqual(["code", "message"]);
      // Une phrase pour le joueur : ce qui s'est passé, quoi faire. Jamais de code technique.
      expect(r.body.error.message).not.toMatch(/[A-Z_]{6,}|Error|undefined|null/);
      expect(r.body.error.message.length).toBeGreaterThan(20);
      expect(r.body.error.message).toMatch(/\.$/);
    }
    // Les huit codes propres au poker y sont tous.
    expect(cases.map(([c0]) => c0).filter((c0) => !["PLACE_LOCKED", "BAD_REQUEST"].includes(c0)).sort()).toEqual([
      "ACTION_IMPOSSIBLE", "ALREADY_SEATED", "BLIND_TOO_HIGH", "BUYIN_UNAFFORDABLE", "NOT_SEATED", "NOT_YOUR_TURN",
      "TABLE_FULL", "TABLE_NOT_FOUND",
    ]);
    // Aucun refus n'a coûté quoi que ce soit.
    expect(w.balance(c)).toBe(60);
    expect(w.storage.tableCodes()).toEqual([code]);
  });

  it("une panne inattendue répond SERVER_ERROR, sans rien révéler de la table", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = await started(w, [a, b]);
    const secret = w.table(code)!.hand!.players.find((p) => p.seat === 1)!.cards;
    w.failAt("mutateTable", 1);
    const logged: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => { logged.push(args); };
    try {
      const r = await w.poker.poll(a, code) as Reply;
      expect([r.status, r.body.error.code]).toEqual([500, "SERVER_ERROR"]);
      for (const card of secret) expect(JSON.stringify(r.body)).not.toContain(card);
    } finally {
      console.error = original;
    }
    expect(logged).toHaveLength(1);
    expect(JSON.stringify(logged)).not.toContain(a.code);
  });
});
