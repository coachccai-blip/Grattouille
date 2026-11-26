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
});
