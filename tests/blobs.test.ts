// Le stockage Netlify Blobs, essayé contre le serveur local fourni par @netlify/blobs.
// Ce test vérifie que storage.blobs.ts est aligné sur la version installée du paquet :
// cohérence forte, getWithMetadata, écritures conditionnelles onlyIfNew et onlyIfMatch.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getStore, setEnvironmentContext } from "@netlify/blobs";
import { BlobsServer } from "@netlify/blobs/server";
import { handle, type Deps } from "../server/app";
import { cryptoRandom32 } from "../server/auth";
import { newPlayer } from "../server/player";
import { BlobsStorage } from "../server/storage.blobs";
import { commit } from "../server/storage";
import { createTable, deposit, sit, type TableState } from "../shared/poker";
import type { Board } from "../shared/types";

let server: BlobsServer;
let directory: string;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "grattouille-blobs-"));
  server = new BlobsServer({ directory, token: "jeton-local" });
  const { port } = await server.start();
  const url = `http://localhost:${port}`;
  // Ce que Netlify fournit automatiquement à une fonction.
  setEnvironmentContext({ edgeURL: url, uncachedEdgeURL: url, siteID: "site-local", token: "jeton-local" });
});

afterAll(async () => {
  await server.stop();
  await rm(directory, { recursive: true, force: true });
});

function record(id: string, pseudoKey: string) {
  return newPlayer({ id, pseudo: pseudoKey, pseudoKey, codeHash: "0".repeat(64), species: "renard", now: 1 });
}

describe("BlobsStorage", () => {
  it("santé : écrit puis relit un blob", async () => {
    expect(await new BlobsStorage("test").health()).toBe(true);
  });

  it("création sous condition, lecture, suppression", async () => {
    const s = new BlobsStorage("test");
    const id = "p_aaaaaaaaaaaaaaa1";
    expect(await s.getPlayer(id)).toBeNull();
    expect(await s.createPlayer(record(id, "un"))).toBe(true);
    expect(await s.createPlayer(record(id, "un"))).toBe(false); // onlyIfNew
    expect((await s.getPlayer(id))?.balance).toBe(0);
    await s.deletePlayer(id);
    expect(await s.getPlayer(id)).toBeNull();
    await s.deletePlayer(id); // sans erreur
  });

  it("mutatePlayer : écriture conditionnelle, relecture après conflit, refus sans écriture", async () => {
    const s = new BlobsStorage("test");
    const id = "p_aaaaaaaaaaaaaaa2";
    await s.createPlayer(record(id, "deux"));
    // Laisse passer une milliseconde : l'etag du serveur local dérive de la date de modification.
    const pause = () => new Promise((r) => setTimeout(r, 15));
    await pause();
    expect(await s.mutatePlayer(id, (p) => { p.balance += 14; return commit(p.balance); })).toBe(14);
    expect((await s.getPlayer(id))?.balance).toBe(14);

    // Quelqu'un écrit entre la lecture et l'écriture : la mutation est rejouée sur la valeur fraîche.
    let calls = 0;
    await pause();
    const result = await s.mutatePlayer(id, (p) => {
      calls++;
      p.balance += 1;
      return commit(p.balance);
    });
    expect([calls, result]).toEqual([1, 15]);

    // Quelqu'un d'autre écrit entre notre lecture et notre écriture : l'écriture conditionnelle
    // est refusée, la mutation est rejouée sur la valeur fraîche. (Le serveur local ne sait pas
    // départager deux écritures réellement simultanées : on intercale donc l'intruse à la main.)
    const realFetch = globalThis.fetch;
    const intrude = (times: number) => {
      let left = times;
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        if (left > 0 && String(init?.method).toLowerCase() === "put" && headers["if-match"]) {
          left--;
          await pause();
          const current = (await getStore({ name: "gr-players-test", consistency: "strong", fetch: realFetch })
            .get(id, { type: "json" })) as { balance: number };
          await getStore({ name: "gr-players-test", consistency: "strong", fetch: realFetch })
            .setJSON(id, { ...current, balance: current.balance + 1000 });
          await pause();
        }
        return realFetch(input, init);
      }) as typeof fetch;
    };
    try {
      calls = 0;
      intrude(1);
      const raced = await s.mutatePlayer(id, (p) => {
        calls++;
        p.balance += 100;
        return commit(p.balance);
      });
      expect([calls, raced]).toEqual([2, 1115]);
      expect((await s.getPlayer(id))?.balance).toBe(1115);

      // Trois écritures concurrentes ratées de suite : CONFLICT, et rien de nous n'est écrit.
      calls = 0;
      intrude(3);
      await expect(s.mutatePlayer(id, (p) => {
        calls++;
        p.balance += 7;
        return commit(p.balance);
      })).rejects.toMatchObject({ code: "CONFLICT" });
      expect(calls).toBe(3);
      expect((await s.getPlayer(id))?.balance).toBe(4115);
    } finally {
      globalThis.fetch = realFetch;
    }

    await expect(s.mutatePlayer(id, () => { throw new Error("refus"); })).rejects.toThrow("refus");
    expect((await s.getPlayer(id))?.balance).toBe(4115);
    await expect(s.mutatePlayer("p_inconnuinconnu00", (p) => commit(p))).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("pseudos : réservation unique, libération, reprise d'une réservation orpheline", async () => {
    const s = new BlobsStorage("test");
    const now = 1_000_000;
    expect(await s.claimPseudo("marcel", "p_aaaaaaaaaaaaaaa3", now)).toBe(true);
    expect(await s.claimPseudo("marcel", "p_aaaaaaaaaaaaaaa4", now + 10)).toBe(false);
    expect(await s.findPseudo("marcel")).toBe("p_aaaaaaaaaaaaaaa3");
    // Le détenteur n'existe pas, mais la réservation est récente : on n'y touche pas.
    expect(await s.claimPseudo("marcel", "p_aaaaaaaaaaaaaaa4", now + 59_000)).toBe(false);
    // Passé le délai, elle est orpheline.
    await new Promise((r) => setTimeout(r, 15));
    expect(await s.claimPseudo("marcel", "p_aaaaaaaaaaaaaaa4", now + 61_000)).toBe(true);
    expect(await s.findPseudo("marcel")).toBe("p_aaaaaaaaaaaaaaa4");
    // Un détenteur qui existe garde son pseudo pour toujours.
    await s.createPlayer(record("p_aaaaaaaaaaaaaaa4", "marcel"));
    expect(await s.claimPseudo("marcel", "p_aaaaaaaaaaaaaaa5", now + 10_000_000)).toBe(false);
    await s.releasePseudo("marcel");
    expect(await s.findPseudo("marcel")).toBeNull();
    expect(await s.findPseudo("personne")).toBeNull();
  });

  it("classement : création, mise à jour conditionnelle, lecture", async () => {
    const s = new BlobsStorage("test");
    expect(await s.getBoard()).toEqual({ entries: [], updatedAt: 0 });
    const entry = (id: string, fortune: number) => ({
      id, pseudo: id, species: "chat", fortune, standing: 0, kiosk: false, at: fortune,
      look: { chapeau: null, lunettes: null, tenue: null, accessoire: null },
    });
    expect(await s.mutateBoard((b: Board) => { b.entries.push(entry("a", 1)); b.updatedAt = 1; return true; })).toBe(true);
    await new Promise((r) => setTimeout(r, 15));
    expect(await s.mutateBoard((b: Board) => { b.entries.push(entry("b", 2)); b.updatedAt = 2; return true; })).toBe(true);
    expect(await s.mutateBoard(() => false)).toBe(true);
    const board = await s.getBoard();
    expect(board.entries.map((e) => e.id)).toEqual(["a", "b"]);
    expect(board.updatedAt).toBe(2);
  });

  it("tables de poker : création sous condition, écriture conditionnelle, relecture après conflit, suppression", async () => {
    const s = new BlobsStorage("test");
    const pause = () => new Promise((r) => setTimeout(r, 15));
    const rng = () => 12345;
    let table = createTable({ code: "TABLE", kind: "privee", place: null, blind: 10, maxBuyIn: 1000, seats: 3, bots: [], difficulty: "normal" }, 1);
    table = sit(table, { playerId: "p_aaaaaaaaaaaaaaa7", sid: "s_un", pseudo: "Ada", species: "chat", look: null }, 1, rng);
    expect(await s.getTable("TABLE")).toBeNull();
    expect(await s.createTable(table)).toBe(true);
    expect(await s.createTable(table)).toBe(false); // onlyIfNew
    expect(await s.getTable("TABLE")).toEqual(table);

    // Le moteur est pur : la mutation rend la table à écrire, ou `null` s'il n'y a rien à écrire.
    await pause();
    const funded = await s.mutateTable("TABLE", (t) => {
      const next = deposit(t, "s_un", 1, 400, 2, rng);
      return { result: next.seats[0]!.stack, write: next };
    });
    expect(funded).toBe(400);
    expect((await s.getTable("TABLE"))!.seats[0]).toMatchObject({ stack: 400, seq: 1, received: 400 });
    expect(await s.mutateTable("TABLE", (t) => ({ result: t.version, write: null }))).toBe(table.version + 1);

    // Quelqu'un d'autre écrit entre notre lecture et notre écriture : on relit et on recommence.
    const realFetch = globalThis.fetch;
    const intrude = (times: number) => {
      let left = times;
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        if (left > 0 && String(init?.method).toLowerCase() === "put" && headers["if-match"]) {
          left--;
          await pause();
          const store = getStore({ name: "gr-tables-test", consistency: "strong", fetch: realFetch });
          const current = (await store.get("TABLE", { type: "json" })) as TableState;
          await store.setJSON("TABLE", { ...current, activeAt: current.activeAt + 1000 });
          await pause();
        }
        return realFetch(input, init);
      }) as typeof fetch;
    };
    try {
      let calls = 0;
      await pause();
      intrude(1);
      const raced = await s.mutateTable("TABLE", (t) => {
        calls++;
        const next = deposit(t, "s_un", 2, 700, 3, rng);
        return { result: next.activeAt, write: next };
      });
      expect(calls).toBe(2);
      // L'écriture de l'intruse n'est pas perdue : la nôtre a été rejouée sur la table fraîche.
      expect((await s.getTable("TABLE"))!.seats[0]).toMatchObject({ stack: 700, seq: 2, received: 700 });
      expect(raced).toBe(3);

      // Cinq écritures disputées de suite : CONFLICT, et rien de nous n'est écrit.
      calls = 0;
      await pause();
      intrude(5);
      await expect(s.mutateTable("TABLE", (t) => {
        calls++;
        return { result: null, write: deposit(t, "s_un", 3, 900, 4, rng) };
      })).rejects.toMatchObject({ code: "CONFLICT" });
      expect(calls).toBe(5);
      expect((await s.getTable("TABLE"))!.seats[0]).toMatchObject({ stack: 700, seq: 2 });
    } finally {
      globalThis.fetch = realFetch;
    }

    await expect(s.mutateTable("TABLE", () => { throw new Error("refus"); })).rejects.toThrow("refus");
    await expect(s.mutateTable("NULLE", (t) => ({ result: t, write: null }))).rejects.toMatchObject({ code: "NOT_FOUND" });
    await s.deleteTable("TABLE");
    expect(await s.getTable("TABLE")).toBeNull();
    await s.deleteTable("TABLE"); // sans erreur
    // Les tables de `prod` et de `test` ne se voient pas.
    expect(await s.createTable(table)).toBe(true);
    expect(await new BlobsStorage("prod").getTable("TABLE")).toBeNull();
    await s.deleteTable("TABLE");
  });

  it("les stores `prod` et `test` sont séparés", async () => {
    const test = new BlobsStorage("test");
    const prod = new BlobsStorage("prod");
    await test.createPlayer(record("p_aaaaaaaaaaaaaaa6", "six"));
    expect(await prod.getPlayer("p_aaaaaaaaaaaaaaa6")).toBeNull();
    expect((await prod.getBoard()).entries).toEqual([]);
  });

  it("une partie de bout en bout à travers l'API", async () => {
    const deps: Deps = { storage: new BlobsStorage("e2e"), context: "test", adminKey: null, now: Date.now, random32: cryptoRandom32 };
    const call = async (method: string, path: string, body?: unknown, auth?: string) => {
      const headers: Record<string, string> = {};
      if (auth) headers.authorization = `Bearer ${auth}`;
      if (body !== undefined) headers["content-type"] = "application/json";
      const res = await handle(new Request(`https://local.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), deps);
      return { status: res.status, body: (await res.json()) as any };
    };
    expect((await call("GET", "/api/health")).body).toEqual({ ok: true, context: "test" });
    const created = await call("POST", "/api/players", { pseudo: "Belle Lurette", species: "raton" });
    expect(created.status).toBe(201);
    const auth = `${created.body.playerId}.${created.body.code}`;
    expect((await call("POST", "/api/players", { pseudo: "belle lurette", species: "chat" })).body.error.code).toBe("PSEUDO_TAKEN");
    // On débarque sans un sou : le premier ticket se ramasse par terre, et rapporte 5 €.
    expect(created.body.state.balance).toBe(0);
    const found = await call("POST", "/api/tickets/found", {}, auth);
    expect(found.body.tickets[0]).toMatchObject({ type: "tirelire", gain: 5, house: true });
    const shop = await call("POST", "/api/shop/buy", { itemId: "noeud-pap", equip: true, ack: [found.body.tickets[0].id] }, auth);
    expect(shop.body.state).toMatchObject({ balance: 0, standing: 2, fortune: 5, owned: ["noeud-pap"] });
    const session = await call("POST", "/api/session", { pseudo: "Belle Lurette", code: created.body.code });
    expect(session.body.playerId).toBe(created.body.playerId);
    const board = await call("GET", "/api/leaderboard");
    expect(board.body.entries).toHaveLength(1);
    expect(board.body.entries[0].pseudo).toBe("Belle Lurette");
    expect((await call("DELETE", "/api/me", undefined, auth)).body).toEqual({ ok: true });
    expect((await call("GET", "/api/leaderboard")).body.entries).toEqual([]);
    expect((await call("GET", "/api/me", undefined, auth)).status).toBe(401);
  });

  it("une table de poker de bout en bout à travers l'API", async () => {
    const storage = new BlobsStorage("e2e");
    let now = Date.UTC(2026, 10, 26, 22, 0, 0);
    const deps: Deps = { storage, context: "test", adminKey: null, now: () => now, random32: cryptoRandom32 };
    const call = async (method: string, path: string, body?: unknown, auth?: string) => {
      const headers: Record<string, string> = {};
      if (auth) headers.authorization = `Bearer ${auth}`;
      if (body !== undefined) headers["content-type"] = "application/json";
      const res = await handle(new Request(`https://local.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), deps);
      return { status: res.status, body: (await res.json()) as any };
    };
    const created = await call("POST", "/api/players", { pseudo: "Fine Mouche", species: "chat" });
    const auth = `${created.body.playerId}.${created.body.code}`;
    await storage.mutatePlayer(created.body.playerId, (p) => { p.balance = 200; return commit(null); });
    const lobby = await call("GET", "/api/poker", undefined, auth);
    expect(lobby.body).toMatchObject({ seat: null, blinds: [1, 2, 5] });
    expect(lobby.body.houses[0]).toMatchObject({ place: "kiosque", open: true, affordable: true });

    // Une table de la maison : la cave quitte la bourse, la première main est donnée.
    const table = await call("POST", "/api/poker/tables", { maison: "kiosque", buyIn: 60 }, auth);
    expect(table.status).toBe(201);
    const code: string = table.body.view.code;
    expect(table.body.view).toMatchObject({ kind: "maison", phase: "triche", you: 0 });
    expect(table.body.state).toMatchObject({ balance: 140, poker: { code } });
    expect((await storage.getTable(code))!.seats[0]).toMatchObject({ stack: 59, received: 60 });
    expect((await call("GET", "/api/me", undefined, auth)).body.state.poker).toEqual({ code });

    // Rien n'a changé : la réponse minimale.
    const v: number = table.body.view.version;
    expect((await call("GET", `/api/poker/table?code=${code}&v=${v}`, undefined, auth)).body).toEqual({ unchanged: true });
    const fair = await call("POST", "/api/poker/act", { code, action: { type: "franc-jeu" }, step: table.body.view.step }, auth);
    expect(fair.status).toBe(200);
    expect(fair.body.view.hand).toMatchObject({ chosen: true, swap: null });
    expect(fair.body.view.version).toBeGreaterThan(v);

    // Dix secondes plus tard, les robots ont joué : la table a avancé toute seule.
    now += 10_000;
    const later = await call("GET", `/api/poker/table?code=${code}&v=${fair.body.view.version}`, undefined, auth);
    expect(later.body.view.version).toBeGreaterThan(fair.body.view.version);
    expect(["encheres", "abattage", "denouement"]).toContain(later.body.view.phase);
    expect((await storage.getTable(code))!.version).toBe(later.body.view.version);

    // Quitter : le tapis retourne à la bourse, la table sans humain se ferme et son blob disparaît.
    const stack: number = (await storage.getTable(code))!.seats[0]!.stack;
    const quit = await call("POST", "/api/poker/act", { code, action: { type: "quitter" } }, auth);
    expect(quit.status).toBe(200);
    expect(quit.body.left).toEqual({ reason: "quitte", payout: stack, bonus: 0 });
    expect(quit.body.state.balance).toBe(140 + stack);
    expect(quit.body.state.poker).toBeUndefined();
    expect(await storage.getTable(code)).toBeNull();
    expect((await call("GET", `/api/poker/table?code=${code}`, undefined, auth)).body.error.code).toBe("TABLE_NOT_FOUND");
    expect((await call("GET", "/api/poker", undefined, auth)).body.seat).toBeNull();
    await call("DELETE", "/api/me", undefined, auth);
  });
});
