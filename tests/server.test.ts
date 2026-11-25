// Serveur, avec le stockage en mémoire (BRIEF.md, sections 15 et 17.4).

import { describe, expect, it } from "vitest";
import { handle, type Deps } from "../server/app";
import { sha256Hex } from "../server/auth";
import { MemoryStorage } from "../server/storage";
import { CATALOG } from "../shared/catalog";
import { WEIGHT_TOTAL } from "../shared/economy";
import { CODE_ALPHABET } from "../shared/rules";
import type { Board, PendingTicket, PlayerState } from "../shared/types";

const ADMIN_KEY = "clef-d-administration-de-test";
const T0 = Date.UTC(2026, 10, 25, 12, 0, 0);

interface Reply<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

interface Account {
  playerId: string;
  code: string;
  auth: string;
  state: PlayerState;
}

function makeWorld() {
  const storage = new MemoryStorage();
  let now = T0;
  let lcg = 0x1234abcd;
  /** Tirages forcés : chaque valeur est consommée telle quelle par le prochain random32. */
  const forced: number[] = [];
  const deps: Deps = {
    storage,
    context: "test",
    adminKey: ADMIN_KEY,
    now: () => now,
    random32: () => {
      if (forced.length > 0) return forced.shift()!;
      lcg = (Math.imul(lcg, 1664525) + 1013904223) >>> 0;
      return lcg;
    },
  };

  async function call<T = any>(method: string, path: string, body?: unknown, auth?: string, raw?: RequestInit): Promise<Reply<T>> {
    const headers: Record<string, string> = {};
    if (auth) headers.authorization = `Bearer ${auth}`;
    let payload: string | undefined;
    if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = typeof body === "string" ? body : JSON.stringify(body);
    }
    const req = new Request(`https://grattouille.test${path}`, { method, headers, body: payload, ...raw });
    const res = await handle(req, deps);
    return { status: res.status, body: (await res.json()) as T, headers: res.headers };
  }

  async function signup(pseudo: string, species = "renard"): Promise<Account> {
    const r = await call("POST", "/api/players", { pseudo, species });
    if (r.status !== 201) throw new Error(`création refusée : ${JSON.stringify(r.body)}`);
    return { playerId: r.body.playerId, code: r.body.code, auth: `${r.body.playerId}.${r.body.code}`, state: r.body.state };
  }

  return {
    storage, deps, call, signup,
    advance: (ms: number) => { now += ms; },
    now: () => now,
    /** Force le prochain tirage de gain : `r` est l'entier dans [0, 100 000[. */
    forceDraw: (r: number) => { forced.push(r); },
  };
}

/** Une valeur 32 bits dont le reste modulo 100 000 vaut `r`. */
const drawValue = (r: number) => r % WEIGHT_TOTAL;

describe("santé", () => {
  it("GET /api/health écrit puis relit un blob", async () => {
    const w = makeWorld();
    const r = await w.call("GET", "/api/health");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true, context: "test" });
  });
});

describe("création de compte", () => {
  it("un pseudo et une espèce : identifiant, code de récupération et 4 € en poche", async () => {
    const w = makeWorld();
    const r = await w.call("POST", "/api/players", { pseudo: "Marcel", species: "renard" });
    expect(r.status).toBe(201);
    expect(r.body.playerId).toMatch(/^p_[a-z0-9]{16}$/);
    expect(r.body.code).toHaveLength(16);
    expect([...r.body.code].every((ch: string) => CODE_ALPHABET.includes(ch))).toBe(true);
    const state: PlayerState = r.body.state;
    expect(state).toMatchObject({
      id: r.body.playerId, pseudo: "Marcel", species: "renard", balance: 4, pending: [], owned: [],
      kiosk: false, standing: 0, fortune: 4,
      look: { chapeau: null, lunettes: null, tenue: null, accessoire: null, vehicule: null, residence: null },
      stats: { tickets: 0, winners: 0, wagered: 0, won: 0, bestGain: 0, bestTicket: null, jackpots: 0 },
    });
  });

  it("le serveur ne conserve que l'empreinte du code, et ne l'envoie jamais", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const record = w.storage.peek(a.playerId)!;
    expect(record.codeHash).toBe(await sha256Hex(a.code));
    expect(JSON.stringify(record)).not.toContain(a.code);
    const me = await w.call("GET", "/api/me", undefined, a.auth);
    expect(Object.keys(me.body.state).sort()).toEqual([
      "balance", "createdAt", "fortune", "id", "kiosk", "look", "owned", "pending", "pseudo", "species", "standing", "stats",
    ]);
    expect(JSON.stringify(me.body)).not.toContain(record.codeHash);
  });

  it("pseudo déjà pris, sans tenir compte de la casse ni des accents", async () => {
    const w = makeWorld();
    await w.signup("Zoé");
    for (const pseudo of ["Zoé", "ZOE", "zoe"]) {
      const r = await w.call("POST", "/api/players", { pseudo, species: "chat" });
      expect(r.status).toBe(409);
      expect(r.body.error.code).toBe("PSEUDO_TAKEN");
      expect(r.body.error.message).toBe("Ce pseudo est pris. Essaie avec un autre.");
    }
    expect(w.storage.playerCount()).toBe(1);
  });

  it("deux créations simultanées du même pseudo : une seule passe", async () => {
    const w = makeWorld();
    const replies = await Promise.all(
      Array.from({ length: 6 }, () => w.call("POST", "/api/players", { pseudo: "Lulu", species: "lapin" })),
    );
    expect(replies.filter((r) => r.status === 201).length).toBe(1);
    expect(replies.filter((r) => r.body.error?.code === "PSEUDO_TAKEN").length).toBe(5);
    expect(w.storage.playerCount()).toBe(1);
  });

  it("PSEUDO_INVALID : hors format ou refusé", async () => {
    const w = makeWorld();
    for (const pseudo of ["ab", "A2345678901234567", "Jean_Luc", "admin", "Gaspard", "Le Baron", 12, null]) {
      const r = await w.call("POST", "/api/players", { pseudo, species: "renard" });
      expect([pseudo, r.status, r.body.error.code]).toEqual([pseudo, 400, "PSEUDO_INVALID"]);
    }
  });

  it("BAD_REQUEST : espèce inconnue, corps illisible, trop gros ou d'un autre type", async () => {
    const w = makeWorld();
    const cases: Promise<Reply>[] = [
      w.call("POST", "/api/players", { pseudo: "Marcel", species: "licorne" }),
      w.call("POST", "/api/players", { pseudo: "Marcel" }),
      w.call("POST", "/api/players", "{ pas du json"),
      w.call("POST", "/api/players", "[1, 2]"),
      w.call("POST", "/api/players", { pseudo: "Marcel", species: "renard", bourrage: "x".repeat(5000) }),
      w.call("POST", "/api/players", undefined, undefined, {
        body: JSON.stringify({ pseudo: "Marcel", species: "renard" }), headers: { "content-type": "text/plain" },
      }),
    ];
    for (const r of await Promise.all(cases)) {
      expect(r.status).toBe(400);
      expect(r.body.error.code).toBe("BAD_REQUEST");
      expect(typeof r.body.error.message).toBe("string");
    }
    expect(w.storage.playerCount()).toBe(0);
  });
});

describe("authentification", () => {
  it("UNAUTHORIZED : en-tête absent, code faux, identifiant inconnu", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const other = "ABCDEFGHJKMNPQRS";
    const attempts = [
      undefined,
      `${a.playerId}.${other}`,
      `p_aaaaaaaaaaaaaaaa.${a.code}`,
      `${a.playerId}`,
      `n-importe-quoi`,
    ];
    for (const auth of attempts) {
      for (const [method, path, body] of [
        ["GET", "/api/me", undefined],
        ["POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }],
        ["POST", "/api/tickets/ack", { ack: [] }],
        ["POST", "/api/shop/buy", { itemId: "noeud-pap" }],
        ["DELETE", "/api/me", undefined],
      ] as const) {
        const r = await w.call(method, path, body, auth);
        expect([auth, path, r.status, r.body.error.code]).toEqual([auth, path, 401, "UNAUTHORIZED"]);
      }
    }
    expect(w.storage.peek(a.playerId)!.balance).toBe(4);
  });

  it("le code s'accepte avec ou sans tirets", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const dashed = a.code.replace(/(.{4})(?=.)/g, "$1-").toLowerCase();
    const r = await w.call("GET", "/api/me", undefined, `${a.playerId}.${dashed}`);
    expect(r.status).toBe(200);
  });

  it("changer d'appareil : pseudo et code rendent le compte", async () => {
    const w = makeWorld();
    const a = await w.signup("Tonton Jo");
    const ok = await w.call("POST", "/api/session", { pseudo: "tonton  jo", code: a.code.toLowerCase() });
    expect(ok.status).toBe(200);
    expect(ok.body.playerId).toBe(a.playerId);
    expect(ok.body.state.pseudo).toBe("Tonton Jo");
    for (const body of [
      { pseudo: "Tonton Jo", code: "ABCDEFGHJKMNPQRS" },
      { pseudo: "Inconnu", code: a.code },
      { pseudo: "Tonton Jo", code: "trop-court" },
    ]) {
      const r = await w.call("POST", "/api/session", body);
      expect([r.status, r.body.error.code, r.body.error.message]).toEqual([401, "UNAUTHORIZED", "Pseudo ou code incorrect."]);
    }
    expect((await w.call("POST", "/api/session", { pseudo: "Tonton Jo" })).body.error.code).toBe("BAD_REQUEST");
  });
});

describe("achat de tickets", () => {
  it("achat nominal : le premier ticket d'un compte gagne toujours 5 fois son prix", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.forceDraw(drawValue(99_999)); // ne doit pas servir : le premier ticket ne se tire pas au sort
    const r = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect(r.status).toBe(200);
    expect(r.body.tickets).toHaveLength(1);
    const t: PendingTicket = r.body.tickets[0];
    expect(t.id).toMatch(/^t_[a-z0-9]{12}$/);
    expect(t).toMatchObject({ type: "tirelire", gain: 5, at: T0 });
    expect(Number.isInteger(t.seed) && t.seed >= 0 && t.seed <= 0xffffffff).toBe(true);
    expect(t.house).toBeUndefined();
    // Le gain n'est pas encore dans le solde, mais il compte dans la fortune.
    expect(r.body.state).toMatchObject({ balance: 3, fortune: 8, pending: [t] });
    expect(r.body.state.stats).toMatchObject({ tickets: 1, wagered: 1, winners: 0, won: 0 });
  });

  it("la règle du premier ticket ne joue qu'une fois, sur le premier ticket du premier achat", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 100; });
    const first = await w.call("POST", "/api/tickets/buy", { type: "signe-du-homard", qty: 5 }, a.auth);
    expect(first.body.tickets[0].gain).toBe(10);
    w.advance(1500);
    // r = 99 999 : au-delà de tous les poids cumulés, donc perdant.
    w.forceDraw(drawValue(99_999));
    const second = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect(second.body.tickets[0].gain).toBe(0);
    w.advance(1500);
    // r = 0 : le premier lot du tableau, ×1.
    w.forceDraw(drawValue(0));
    const third = await w.call("POST", "/api/tickets/buy", { type: "tic-tac-truffe", qty: 1 }, a.auth);
    expect(third.body.tickets[0].gain).toBe(5);
    w.advance(1500);
    // r = 61 524 : le dernier poids gagnant du tempérament pépère, ×500.
    w.forceDraw(drawValue(61_524));
    const fourth = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect(fourth.body.tickets[0].gain).toBe(500);
  });

  it("carnets de 5 et de 10, sans remise", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 100; });
    const five = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 5 }, a.auth);
    expect(five.body.tickets).toHaveLength(5);
    expect(five.body.state.balance).toBe(95);
    w.advance(1000);
    const ten = await w.call("POST", "/api/tickets/buy", { type: "signe-du-homard", qty: 10 }, a.auth);
    expect(ten.body.tickets).toHaveLength(10);
    expect(ten.body.state.balance).toBe(75);
    expect(ten.body.state.pending).toHaveLength(15);
    expect(ten.body.state.stats).toMatchObject({ tickets: 15, wagered: 25 });
    const ids = ten.body.state.pending.map((t: PendingTicket) => t.id);
    expect(new Set(ids).size).toBe(15);
  });

  it("BAD_REQUEST : ticket inconnu ou quantité invalide", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    for (const body of [
      { type: "millionnaire", qty: 1 }, { type: "tirelire", qty: 2 }, { type: "tirelire", qty: "1" },
      { type: "tirelire" }, { qty: 1 }, { type: "tirelire", qty: 1, ack: "t_aaaaaaaaaaaa" },
      { type: "tirelire", qty: 1, ack: ["pas-un-ticket"] },
    ]) {
      const r = await w.call("POST", "/api/tickets/buy", body, a.auth);
      expect([JSON.stringify(body), r.status, r.body.error.code]).toEqual([JSON.stringify(body), 400, "BAD_REQUEST"]);
    }
    expect(w.storage.peek(a.playerId)!.balance).toBe(4);
  });

  it("PLACE_LOCKED : Standing insuffisant pour ce ticket", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 1000; });
    const r = await w.call("POST", "/api/tickets/buy", { type: "lucarne", qty: 1 }, a.auth);
    expect([r.status, r.body.error.code]).toEqual([403, "PLACE_LOCKED"]);
    // Dix étoiles ouvrent le Grand Café.
    w.storage.poke(a.playerId, (p) => { p.owned = ["noeud-pap", "beret", "lunettes-rondes", "mariniere"]; });
    const ok = await w.call("POST", "/api/tickets/buy", { type: "lucarne", qty: 1 }, a.auth);
    expect(ok.status).toBe(200);
    expect(ok.body.state.standing).toBe(10);
    w.advance(1000);
    const casino = await w.call("POST", "/api/tickets/buy", { type: "vingt-et-un", qty: 1 }, a.auth);
    expect(casino.body.error.code).toBe("PLACE_LOCKED");
  });

  it("INSUFFICIENT_FUNDS : solde insuffisant, et le solde ne devient jamais négatif", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const r = await w.call("POST", "/api/tickets/buy", { type: "tic-tac-truffe", qty: 1 }, a.auth);
    expect([r.status, r.body.error.code]).toEqual([409, "INSUFFICIENT_FUNDS"]);
    const carnet = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 5 }, a.auth);
    expect(carnet.body.error.code).toBe("INSUFFICIENT_FUNDS");
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 4, pending: [] });
  });

  it("PENDING_FULL : 20 tickets en attente au plus", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 1000; });
    await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 10 }, a.auth);
    w.advance(1000);
    const full = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 10 }, a.auth);
    expect(full.body.state.pending).toHaveLength(20);
    w.advance(1000);
    const r = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect([r.status, r.body.error.code, r.body.error.message]).toEqual([
      409, "PENDING_FULL", "Gratte d'abord tes tickets en attente.",
    ]);
    // En déclarant un ticket gratté dans la même requête, la place se libère.
    const firstId = full.body.state.pending[0].id;
    const ok = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1, ack: [firstId] }, a.auth);
    expect(ok.status).toBe(200);
    expect(ok.body.state.pending).toHaveLength(20);
  });

  it("TOO_FAST : moins d'une seconde depuis le dernier achat de ticket", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    w.advance(999);
    const r = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect([r.status, r.body.error.code, r.body.error.message]).toEqual([
      429, "TOO_FAST", "Gaspard n'a que deux pattes. Réessaie dans un instant.",
    ]);
    w.advance(1);
    expect((await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth)).status).toBe(200);
  });

  it("DAILY_LIMIT : plus de 3 000 tickets achetés dans la journée", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 100_000; p.day = "2026-11-25"; p.dayTickets = 2_995; });
    const five = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 5 }, a.auth);
    expect(five.status).toBe(200);
    w.advance(1000);
    const r = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1, ack: five.body.tickets.map((t: PendingTicket) => t.id) }, a.auth);
    expect([r.status, r.body.error.code]).toEqual([429, "DAILY_LIMIT"]);
    // Le lendemain, le compteur repart de zéro.
    w.advance(24 * 3600 * 1000);
    const next = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 10, ack: five.body.tickets.map((t: PendingTicket) => t.id) }, a.auth);
    expect(next.status).toBe(200);
    expect(w.storage.peek(a.playerId)).toMatchObject({ day: "2026-11-26", dayTickets: 10 });
  });
});

describe("déclaration et versement", () => {
  it("le gain est versé au solde quand le ticket est déclaré gratté", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    const id = buy.body.tickets[0].id;
    const r = await w.call("POST", "/api/tickets/ack", { ack: [id] }, a.auth);
    expect(r.status).toBe(200);
    expect(r.body.state).toMatchObject({ balance: 8, pending: [], fortune: 8 });
    expect(r.body.state.stats).toMatchObject({ tickets: 1, winners: 1, wagered: 1, won: 5, bestGain: 5, bestTicket: "tirelire", jackpots: 0 });
  });

  it("déclaration répétée : rien n'est versé la seconde fois, et rien n'est écrit", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    const id = buy.body.tickets[0].id;
    await w.call("POST", "/api/tickets/ack", { ack: [id] }, a.auth);
    const writes = w.storage.ops.playerWrites;
    for (let i = 0; i < 3; i++) {
      const again = await w.call("POST", "/api/tickets/ack", { ack: [id, id, "t_zzzzzzzzzzzz"] }, a.auth);
      expect(again.status).toBe(200);
      expect(again.body.state.balance).toBe(8);
      expect(again.body.state.stats.winners).toBe(1);
    }
    expect(w.storage.ops.playerWrites).toBe(writes);
  });

  it("dix déclarations simultanées du même ticket : un seul versement", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    const id = buy.body.tickets[0].id;
    const replies = await Promise.all(Array.from({ length: 10 }, () => w.call("POST", "/api/tickets/ack", { ack: [id] }, a.auth)));
    for (const r of replies) expect([200, 409]).toContain(r.status);
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 8, pending: [] });
    expect(w.storage.peek(a.playerId)!.stats.winners).toBe(1);
  });

  it("`ack` est traité avant de vérifier le solde : on rachète avec ce qu'on vient de gagner", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    w.advance(1000);
    // 3 € en poche, 5 € à déclarer : le Tic-Tac-Truffe à 5 € passe.
    const r = await w.call("POST", "/api/tickets/buy", { type: "tic-tac-truffe", qty: 1, ack: [buy.body.tickets[0].id] }, a.auth);
    expect(r.status).toBe(200);
    expect(r.body.state.balance).toBe(3);
    expect(r.body.state.pending).toHaveLength(1);
    expect(r.body.state.stats).toMatchObject({ tickets: 2, wagered: 6, winners: 1, won: 5 });
  });

  it("un achat refusé ne verse rien : la déclaration sera refaite", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    const id = buy.body.tickets[0].id;
    const refused = await w.call("POST", "/api/shop/buy", { itemId: "melon", ack: [id] }, a.auth);
    expect(refused.body.error.code).toBe("INSUFFICIENT_FUNDS");
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 3 });
    expect(w.storage.peek(a.playerId)!.pending).toHaveLength(1);
    const ok = await w.call("POST", "/api/shop/buy", { itemId: "noeud-pap", ack: [id] }, a.auth);
    expect(ok.body.state).toMatchObject({ balance: 3, pending: [], owned: ["noeud-pap"] });
  });

  it("un perdant déclaré quitte la pile sans rien verser ; un jackpot est compté", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => {
      p.pending = [
        { id: "t_perdant00000", type: "tirelire", gain: 0, seed: 1, at: T0 },
        { id: "t_jackpot00000", type: "tic-tac-truffe", gain: 2_500, seed: 2, at: T0 },
        { id: "t_presque00000", type: "tic-tac-truffe", gain: 2_495, seed: 3, at: T0 },
      ];
    });
    const r = await w.call("POST", "/api/tickets/ack", { ack: ["t_perdant00000", "t_jackpot00000", "t_presque00000"] }, a.auth);
    expect(r.body.state).toMatchObject({ balance: 4 + 2_500 + 2_495, pending: [] });
    expect(r.body.state.stats).toMatchObject({ winners: 2, won: 4_995, bestGain: 2_500, bestTicket: "tic-tac-truffe", jackpots: 1 });
  });

  it("BAD_REQUEST : `ack` absent ou mal formé", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    for (const body of [{}, { ack: "t_aaaaaaaaaaaa" }, { ack: [42] }, { ack: Array.from({ length: 65 }, (_, i) => `t_${String(i).padStart(12, "0")}`) }]) {
      const r = await w.call("POST", "/api/tickets/ack", body, a.auth);
      expect([r.status, r.body.error.code]).toEqual([400, "BAD_REQUEST"]);
    }
  });
});

describe("ticket de la maison", () => {
  it("HOUSE_NOT_ELIGIBLE tant qu'on peut encore s'offrir le ticket le moins cher", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const r = await w.call("POST", "/api/tickets/house", {}, a.auth);
    expect([r.status, r.body.error.code]).toEqual([409, "HOUSE_NOT_ELIGIBLE"]);
  });

  it("offert, toujours gagnant : 3 fois le prix, un toutes les 20 secondes", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 0; });
    const r = await w.call("POST", "/api/tickets/house", undefined, a.auth);
    expect(r.status).toBe(200);
    const t: PendingTicket = r.body.tickets[0];
    expect(t).toMatchObject({ type: "tirelire", gain: 3, house: true });
    expect(r.body.state).toMatchObject({ balance: 0, fortune: 3 });
    expect(r.body.state.stats).toMatchObject({ tickets: 1, wagered: 0 });
    // Un ticket en attente : pas de second ticket offert.
    expect((await w.call("POST", "/api/tickets/house", {}, a.auth)).body.error.code).toBe("HOUSE_NOT_ELIGIBLE");
    // Déclaré, il rapporte 3 € : de quoi rejouer, donc pas de ticket offert.
    const paid = await w.call("POST", "/api/tickets/house", { ack: [t.id] }, a.auth);
    expect(paid.body.error.code).toBe("HOUSE_NOT_ELIGIBLE");
    await w.call("POST", "/api/tickets/ack", { ack: [t.id] }, a.auth);
    expect(w.storage.peek(a.playerId)!.balance).toBe(3);
    // De nouveau à sec, moins de 20 secondes plus tard : il faut attendre.
    w.storage.poke(a.playerId, (p) => { p.balance = 0; });
    w.advance(19_999);
    const early = await w.call("POST", "/api/tickets/house", {}, a.auth);
    expect([early.status, early.body.error.code]).toEqual([409, "HOUSE_NOT_ELIGIBLE"]);
    w.advance(1);
    expect((await w.call("POST", "/api/tickets/house", {}, a.auth)).status).toBe(200);
  });

  it("on ne redescend jamais d'un lieu : le ticket offert est celui du meilleur lieu débloqué", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => {
      p.balance = 99;
      p.owned = CATALOG.filter((i) => i.price <= 2_500).map((i) => i.id);
    });
    const r = await w.call("POST", "/api/tickets/house", {}, a.auth);
    expect(r.status).toBe(200);
    expect(r.body.state.standing).toBeGreaterThanOrEqual(60);
    expect(r.body.tickets[0]).toMatchObject({ type: "vingt-et-un", gain: 300, house: true });
  });
});

describe("boutiques", () => {
  it("achat nominal : le Standing monte, la fortune ne baisse pas", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 8; });
    const r = await w.call("POST", "/api/shop/buy", { itemId: "noeud-pap", equip: true }, a.auth);
    expect(r.status).toBe(200);
    expect(r.body.state).toMatchObject({ balance: 3, owned: ["noeud-pap"], standing: 2, fortune: 8 });
    expect(r.body.state.look.accessoire).toBe("noeud-pap");
  });

  it("sans `equip`, l'article est acheté mais pas porté ; un trésor ne se porte pas", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 100; });
    const beret = await w.call("POST", "/api/shop/buy", { itemId: "beret" }, a.auth);
    expect(beret.body.state.look.chapeau).toBeNull();
    const shell = await w.call("POST", "/api/shop/buy", { itemId: "coquillage", equip: true }, a.auth);
    expect(shell.body.state.owned).toEqual(["beret", "coquillage"]);
    expect(Object.values(shell.body.state.look).every((v) => v === null)).toBe(true);
    const velo = await w.call("POST", "/api/shop/buy", { itemId: "velo", equip: true }, a.auth);
    expect(velo.body.state.look.vehicule).toBe("velo");
  });

  it("refus : article inconnu, déjà possédé, trop cher", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 10; });
    expect((await w.call("POST", "/api/shop/buy", { itemId: "sceptre" }, a.auth)).body.error.code).toBe("BAD_REQUEST");
    expect((await w.call("POST", "/api/shop/buy", {}, a.auth)).body.error.code).toBe("BAD_REQUEST");
    expect((await w.call("POST", "/api/shop/buy", { itemId: "beret", equip: "oui" }, a.auth)).body.error.code).toBe("BAD_REQUEST");
    await w.call("POST", "/api/shop/buy", { itemId: "noeud-pap" }, a.auth);
    const again = await w.call("POST", "/api/shop/buy", { itemId: "noeud-pap" }, a.auth);
    expect([again.status, again.body.error.code]).toEqual([409, "ALREADY_OWNED"]);
    const dear = await w.call("POST", "/api/shop/buy", { itemId: "beret" }, a.auth);
    expect([dear.status, dear.body.error.code]).toEqual([409, "INSUFFICIENT_FUNDS"]);
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 5, owned: ["noeud-pap"] });
  });

  it("KIOSK_LOCKED tant que la collection est incomplète, puis le Kiosque : +914 ★", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const all = CATALOG.map((i) => i.id);
    w.storage.poke(a.playerId, (p) => { p.balance = 2_000_000_000; p.owned = all.slice(0, 51); });
    const locked = await w.call("POST", "/api/shop/buy", { itemId: "kiosque" }, a.auth);
    expect([locked.status, locked.body.error.code]).toEqual([403, "KIOSK_LOCKED"]);
    w.storage.poke(a.playerId, (p) => { p.owned = all; });
    const poor = w.storage.peek(a.playerId)!;
    expect(poor.kiosk).toBe(false);
    w.storage.poke(a.playerId, (p) => { p.balance = 999_999_999; });
    expect((await w.call("POST", "/api/shop/buy", { itemId: "kiosque" }, a.auth)).body.error.code).toBe("INSUFFICIENT_FUNDS");
    w.storage.poke(a.playerId, (p) => { p.balance = 1_000_000_007; });
    const ok = await w.call("POST", "/api/shop/buy", { itemId: "kiosque" }, a.auth);
    expect(ok.status).toBe(200);
    expect(ok.body.state).toMatchObject({ kiosk: true, standing: 5_000, balance: 7, fortune: 3_545_029_535 + 7 });
    expect(ok.body.state.owned).toHaveLength(52);
    const again = await w.call("POST", "/api/shop/buy", { itemId: "kiosque" }, a.auth);
    expect(again.body.error.code).toBe("ALREADY_OWNED");
  });
});

describe("tenue et espèce", () => {
  it("porter, retirer, changer d'espèce", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.owned = ["beret", "canotier", "velo"]; });
    const wear = await w.call("POST", "/api/look", { look: { chapeau: "canotier", vehicule: "velo" } }, a.auth);
    expect(wear.body.state.look).toMatchObject({ chapeau: "canotier", vehicule: "velo", tenue: null });
    const off = await w.call("POST", "/api/look", { look: { chapeau: null }, species: "herisson" }, a.auth);
    expect(off.body.state.look.chapeau).toBeNull();
    expect(off.body.state.look.vehicule).toBe("velo");
    expect(off.body.state.species).toBe("herisson");
  });

  it("chaque article désigné doit être possédé et correspondre à son emplacement", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.owned = ["beret"]; });
    for (const body of [
      { look: { chapeau: "canotier" } },   // pas possédé
      { look: { lunettes: "beret" } },     // mauvais emplacement
      { look: { tresor: "coquillage" } },  // emplacement inconnu
      { look: { chapeau: 12 } },
      { look: "beret" },
      { species: "dragon" },
      {},
    ]) {
      const r = await w.call("POST", "/api/look", body, a.auth);
      expect([JSON.stringify(body), r.status, r.body.error.code]).toEqual([JSON.stringify(body), 400, "BAD_REQUEST"]);
    }
    expect(w.storage.peek(a.playerId)!.look.chapeau).toBeNull();
  });
});

describe("écritures concurrentes", () => {
  it("deux achats concurrents sur le même joueur ne corrompent pas le solde", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 10; p.stats.tickets = 1; });
    // 5 € de ticket et 8 € de béret : 13 € pour 10 € en poche. Un seul des deux peut passer.
    const [ticket, beret] = await Promise.all([
      w.call("POST", "/api/tickets/buy", { type: "tic-tac-truffe", qty: 1 }, a.auth),
      w.call("POST", "/api/shop/buy", { itemId: "beret" }, a.auth),
    ]);
    const statuses = [ticket.status, beret.status].sort();
    expect(statuses).toEqual([200, 409]);
    const record = w.storage.peek(a.playerId)!;
    if (ticket.status === 200) {
      expect(beret.body.error.code).toBe("INSUFFICIENT_FUNDS");
      expect(record).toMatchObject({ balance: 5, owned: [] });
      expect(record.pending).toHaveLength(1);
    } else {
      expect(ticket.body.error.code).toBe("INSUFFICIENT_FUNDS");
      expect(record).toMatchObject({ balance: 2, owned: ["beret"], pending: [] });
    }
  });

  it("deux onglets achètent en même temps : chaque euro n'est dépensé qu'une fois", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.storage.poke(a.playerId, (p) => { p.balance = 60; p.stats.tickets = 1; });
    const items = ["noeud-pap", "beret", "lunettes-rondes", "mariniere", "coquillage", "canotier", "velo"];
    // 5 + 8 + 12 + 15 + 20 + 35 + 40 = 135 € d'envies pour 60 € en poche.
    const replies = await Promise.all(items.map((itemId) => w.call("POST", "/api/shop/buy", { itemId }, a.auth)));
    const record = w.storage.peek(a.playerId)!;
    const spent = CATALOG.filter((i) => record.owned.includes(i.id)).reduce((s, i) => s + i.price, 0);
    expect(record.balance).toBe(60 - spent);
    expect(record.balance).toBeGreaterThanOrEqual(0);
    const bought = replies.filter((r) => r.status === 200).length;
    expect(bought).toBe(record.owned.length);
    expect(new Set(record.owned).size).toBe(record.owned.length);
    for (const r of replies) {
      if (r.status !== 200) expect(["INSUFFICIENT_FUNDS", "CONFLICT"]).toContain(r.body.error.code);
    }
  });

  it("CONFLICT : trois écritures concurrentes ratées de suite", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    let collisions = 0;
    w.storage.beforePlayerWrite = (id) => {
      collisions++;
      const hook = w.storage.beforePlayerWrite;
      w.storage.beforePlayerWrite = null;
      w.storage.poke(id, (p) => { p.updatedAt += 1; });
      w.storage.beforePlayerWrite = hook;
    };
    const r = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect([r.status, r.body.error.code]).toEqual([409, "CONFLICT"]);
    expect(collisions).toBe(3);
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 4, pending: [] });
    // Une seule collision : la requête relit et passe au deuxième essai.
    let once = true;
    w.storage.beforePlayerWrite = (id) => {
      if (!once) return;
      once = false;
      w.storage.poke(id, (p) => { p.updatedAt += 1; });
    };
    const ok = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect(ok.status).toBe(200);
    expect(w.storage.peek(a.playerId)).toMatchObject({ balance: 3 });
  });
});

describe("classement", () => {
  const board = async (w: ReturnType<typeof makeWorld>) => (await w.call<Board>("GET", "/api/leaderboard")).body;

  it("état vide, lecture publique mise en cache 30 secondes", async () => {
    const w = makeWorld();
    const r = await w.call<Board>("GET", "/api/leaderboard");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ entries: [], updatedAt: 0 });
    expect(r.headers.get("cache-control")).toContain("max-age=30");
    expect(r.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("publication : une entrée par joueur, avec son allure et sa fortune", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", "ours");
    const b = await board(w);
    expect(b.entries).toEqual([{
      id: a.playerId, pseudo: "Marcel", species: "ours", fortune: 4, standing: 0, kiosk: false, at: T0,
      look: { chapeau: null, lunettes: null, tenue: null, accessoire: null },
    }]);
    expect(b.updatedAt).toBe(T0);
  });

  it("au plus une publication toutes les 30 secondes par joueur ; la suivante rattrape", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.advance(5_000);
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect(buy.body.state.fortune).toBe(8);
    expect((await board(w)).entries[0]!.fortune).toBe(4); // trop tôt
    w.advance(30_000);
    // Une déclaration ne change pas la fortune, mais la fortune publiée a 30 secondes de retard.
    await w.call("POST", "/api/tickets/ack", { ack: [buy.body.tickets[0].id] }, a.auth);
    const b = await board(w);
    expect(b.entries[0]).toMatchObject({ fortune: 8, at: T0 + 35_000 });
    // Rien n'a changé depuis : pas de nouvelle écriture du classement.
    const writes = w.storage.ops.boardWrites;
    w.advance(60_000);
    await w.call("POST", "/api/look", { species: "chat" }, a.auth);
    expect(w.storage.ops.boardWrites).toBe(writes + 1); // l'espèce se voit au classement
    w.advance(60_000);
    await w.call("POST", "/api/look", { species: "chat" }, a.auth);
    expect(w.storage.ops.boardWrites).toBe(writes + 1);
  });

  it("tri par fortune décroissante ; à égalité, la publication la plus ancienne d'abord", async () => {
    const w = makeWorld();
    const lulu = await w.signup("Lulu");
    w.advance(1000);
    const zoe = await w.signup("Zoe");
    w.advance(1000);
    const mimi = await w.signup("Mimi");
    w.storage.poke(mimi.playerId, (p) => { p.balance = 500; });
    w.advance(31_000);
    await w.call("POST", "/api/look", { species: "chat" }, mimi.auth);
    const b = await board(w);
    expect(b.entries.map((e) => e.pseudo)).toEqual(["Mimi", "Lulu", "Zoe"]);
    expect(b.entries.map((e) => e.fortune)).toEqual([500, 4, 4]);
    expect(lulu.playerId).not.toBe(zoe.playerId);
  });

  it("limite de 200 entrées : seules les plus grosses fortunes restent", async () => {
    const w = makeWorld();
    const accounts: Account[] = [];
    for (let i = 0; i < 205; i++) {
      accounts.push(await w.signup(`Joueur ${String(i).padStart(3, "0")}`));
    }
    expect((await board(w)).entries).toHaveLength(200);
    w.advance(31_000);
    for (let i = 0; i < accounts.length; i++) {
      w.storage.poke(accounts[i]!.playerId, (p) => { p.balance = 1000 + i; });
      await w.call("POST", "/api/look", { species: "ours" }, accounts[i]!.auth);
    }
    const b = await board(w);
    expect(b.entries).toHaveLength(200);
    expect(b.entries[0]).toMatchObject({ pseudo: "Joueur 204", fortune: 1204 });
    expect(b.entries[199]).toMatchObject({ pseudo: "Joueur 005", fortune: 1005 });
    for (let i = 1; i < b.entries.length; i++) expect(b.entries[i - 1]!.fortune).toBeGreaterThanOrEqual(b.entries[i]!.fortune);
    expect(new Set(b.entries.map((e) => e.id)).size).toBe(200);
  });

  it("dix publications simultanées n'en perdent aucune durablement", async () => {
    const w = makeWorld();
    const accounts: Account[] = [];
    for (let i = 0; i < 10; i++) accounts.push(await w.signup(`Simultane ${i}`));
    w.advance(31_000);
    accounts.forEach((a, i) => w.storage.poke(a.playerId, (p) => { p.balance = 100 * (i + 1); }));
    // Dix joueurs écrivent au même instant : dix publications se disputent le même document.
    const replies = await Promise.all(accounts.map((a) => w.call("POST", "/api/look", { species: "lapin" }, a.auth)));
    expect(replies.every((r) => r.status === 200)).toBe(true);
    // Certaines ont pu échouer après trois essais : ce n'est jamais une erreur pour le joueur,
    // et la publication suivante rattrape.
    w.advance(31_000);
    for (const a of accounts) await w.call("POST", "/api/look", { species: "lapin" }, a.auth);
    const b = await board(w);
    expect(b.entries).toHaveLength(10);
    expect(b.entries.map((e) => e.fortune)).toEqual([1000, 900, 800, 700, 600, 500, 400, 300, 200, 100]);
    expect(b.entries.every((e) => e.species === "lapin")).toBe(true);
  });

  it("un échec de publication n'est pas une erreur, et se rattrape", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.advance(31_000);
    // Le classement est réécrit par quelqu'un d'autre à chaque essai.
    let blocked = true;
    w.storage.beforeBoardWrite = () => {
      if (!blocked) return;
      w.storage.pokeBoard((bd) => { bd.updatedAt += 1; });
    };
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect(buy.status).toBe(200);
    expect((await board(w)).entries[0]!.fortune).toBe(4);
    expect(w.storage.peek(a.playerId)!.boardSig).toBe("");
    blocked = false;
    w.advance(31_000);
    await w.call("POST", "/api/tickets/ack", { ack: [buy.body.tickets[0].id] }, a.auth);
    expect((await board(w)).entries[0]!.fortune).toBe(8);
  });
});

describe("suppression de compte", () => {
  it("efface le joueur, libère le pseudo et le retire du classement", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    await w.signup("Lulu");
    expect((await w.call<Board>("GET", "/api/leaderboard")).body.entries).toHaveLength(2);
    const r = await w.call("DELETE", "/api/me", undefined, a.auth);
    expect([r.status, r.body]).toEqual([200, { ok: true }]);
    expect(w.storage.peek(a.playerId)).toBeNull();
    const b = (await w.call<Board>("GET", "/api/leaderboard")).body;
    expect(b.entries.map((e) => e.pseudo)).toEqual(["Lulu"]);
    expect((await w.call("GET", "/api/me", undefined, a.auth)).status).toBe(401);
    expect((await w.call("POST", "/api/session", { pseudo: "Marcel", code: a.code })).status).toBe(401);
    // Le pseudo est de nouveau libre.
    const again = await w.signup("Marcel");
    expect(again.playerId).not.toBe(a.playerId);
  });

  it("une réservation de pseudo orpheline peut être reprise", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    // Suppression interrompue : le joueur a disparu, pas sa réservation.
    await w.storage.deletePlayer(a.playerId);
    // Trop tôt : une réservation récente sans joueur est peut-être une création en cours.
    const early = await w.call("POST", "/api/players", { pseudo: "Marcel", species: "chat" });
    expect(early.body.error.code).toBe("PSEUDO_TAKEN");
    w.advance(60_000);
    const again = await w.call("POST", "/api/players", { pseudo: "Marcel", species: "chat" });
    expect(again.status).toBe(201);
    expect(await w.storage.findPseudo("marcel")).toBe(again.body.playerId);
  });
});

describe("administration", () => {
  it("la route est protégée par la clé", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    for (const auth of [undefined, "mauvaise-clef", a.auth]) {
      const r = await w.call("POST", "/api/admin/ban", { playerId: a.playerId }, auth);
      expect([r.status, r.body.error.code]).toEqual([401, "UNAUTHORIZED"]);
    }
    // Sans clé configurée, personne n'entre, même avec une clé vide.
    w.deps.adminKey = "";
    expect((await w.call("POST", "/api/admin/ban", { playerId: a.playerId }, "")).status).toBe(401);
    w.deps.adminKey = null;
    expect((await w.call("POST", "/api/admin/ban", { playerId: a.playerId }, "null")).status).toBe(401);
  });

  it("un joueur banni disparaît du classement ; son compte continue de fonctionner", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    await w.signup("Lulu");
    const r = await w.call("POST", "/api/admin/ban", { playerId: a.playerId }, ADMIN_KEY);
    expect([r.status, r.body]).toEqual([200, { ok: true }]);
    const names = async () => (await w.call<Board>("GET", "/api/leaderboard")).body.entries.map((e) => e.pseudo);
    expect(await names()).toEqual(["Lulu"]);
    w.advance(60_000);
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect(buy.status).toBe(200);
    expect(await names()).toEqual(["Lulu"]);
    // Levée du bannissement : la prochaine écriture republie.
    await w.call("POST", "/api/admin/ban", { playerId: a.playerId, unban: true }, ADMIN_KEY);
    w.advance(60_000);
    await w.call("POST", "/api/tickets/ack", { ack: [buy.body.tickets[0].id] }, a.auth);
    expect(await names()).toEqual(["Marcel", "Lulu"]);
  });

  it("refus : joueur inconnu ou corps invalide", async () => {
    const w = makeWorld();
    const unknown = await w.call("POST", "/api/admin/ban", { playerId: "p_aaaaaaaaaaaaaaaa" }, ADMIN_KEY);
    expect([unknown.status, unknown.body.error.code]).toEqual([404, "NOT_FOUND"]);
    const bad = await w.call("POST", "/api/admin/ban", { playerId: "marcel" }, ADMIN_KEY);
    expect([bad.status, bad.body.error.code]).toEqual([400, "BAD_REQUEST"]);
  });
});

describe("routes", () => {
  it("NOT_FOUND : route inconnue ou mauvaise méthode", async () => {
    const w = makeWorld();
    for (const [method, path] of [
      ["GET", "/api/nulle-part"], ["GET", "/api/tickets/buy"], ["POST", "/api/me"], ["PUT", "/api/look"],
      ["OPTIONS", "/api/players"], ["GET", "/api"],
    ] as const) {
      const r = await w.call(method, path);
      expect([path, r.status, r.body.error.code]).toEqual([path, 404, "NOT_FOUND"]);
      expect(r.headers.get("access-control-allow-origin")).toBeNull();
    }
  });

  it("toutes les erreurs ont la forme { error: { code, message } }, sans code technique dans le message", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    const replies = [
      await w.call("POST", "/api/tickets/buy", { type: "lucarne", qty: 1 }, a.auth),
      await w.call("POST", "/api/tickets/buy", { type: "tic-tac-truffe", qty: 1 }, a.auth),
      await w.call("POST", "/api/shop/buy", { itemId: "kiosque" }, a.auth),
      await w.call("GET", "/api/nulle-part"),
    ];
    for (const r of replies) {
      expect(Object.keys(r.body)).toEqual(["error"]);
      expect(Object.keys(r.body.error).sort()).toEqual(["code", "message"]);
      expect(r.body.error.message).not.toMatch(/[A-Z_]{6,}|Error|undefined|null/);
      expect(r.headers.get("content-type")).toContain("application/json");
      expect(r.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("une panne inattendue répond SERVER_ERROR sans rien révéler", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel");
    w.deps.storage = new Proxy(w.storage, {
      get(target, prop, receiver) {
        if (prop === "getPlayer") return async () => { throw new Error(`secret ${a.code}`); };
        return Reflect.get(target, prop, receiver);
      },
    });
    const logged: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => { logged.push(args); };
    try {
      const r = await w.call("GET", "/api/me", undefined, a.auth);
      expect([r.status, r.body.error.code]).toEqual([500, "SERVER_ERROR"]);
      expect(JSON.stringify(r.body)).not.toContain(a.code);
    } finally {
      console.error = original;
    }
    expect(logged).toHaveLength(1);
  });
});
