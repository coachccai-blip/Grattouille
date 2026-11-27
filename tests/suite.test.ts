// La suite du jeu : tickets semés, vraie fin, trophées — et la promesse faite aux joueurs
// déjà là : rien de ce qu'ils ont ne bouge, et tout ce qu'ils ont mérité leur revient.

import { describe, expect, it } from "vitest";
import { handle, type Deps } from "../server/app";
import { toState, type PlayerRecord } from "../server/player";
import { MemoryStorage } from "../server/storage";
import { CATALOG, KIOSK } from "../shared/catalog";
import { PLACES } from "../shared/places";
import { BOARD_PUBLISH_INTERVAL_MS, BUY_COOLDOWN_MS, LUCKY_FIND_MS, standingOf } from "../shared/rules";
import { ticketById } from "../shared/tickets";
import { MEDAL_COUNT, TROPHIES, medalsOf, newMedals, progressOf, trophyById } from "../shared/trophies";
import type { PlayerState } from "../shared/types";
import { completeResponse, completeState } from "../src/app/etat";

const T0 = Date.UTC(2026, 10, 27, 9, 0, 0);
const ALL_ITEMS = CATALOG.map((item) => item.id);
const ALL_PLACES = PLACES.map((place) => place.id);

interface Account {
  playerId: string;
  auth: string;
  state: PlayerState;
}

function makeWorld() {
  const storage = new MemoryStorage();
  let now = T0;
  let lcg = 0x2468ace1;
  const deps: Deps = {
    storage,
    context: "test",
    adminKey: null,
    now: () => now,
    random32: () => {
      lcg = (Math.imul(lcg, 1664525) + 1013904223) >>> 0;
      return lcg;
    },
  };

  async function call(method: string, path: string, body?: unknown, auth?: string) {
    const headers: Record<string, string> = {};
    if (auth) headers.authorization = `Bearer ${auth}`;
    if (body !== undefined) headers["content-type"] = "application/json";
    const req = new Request(`https://grattouille.test${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const res = await handle(req, deps);
    return { status: res.status, body: (await res.json()) as any };
  }

  async function signup(pseudo: string): Promise<Account> {
    const r = await call("POST", "/api/players", { pseudo, species: "renard" });
    if (r.status !== 201) throw new Error(`création refusée : ${JSON.stringify(r.body)}`);
    return { playerId: r.body.playerId, auth: `${r.body.playerId}.${r.body.code}`, state: r.body.state };
  }

  /** Un Patron : toute la collection, le Kiosque, et de quoi semer. */
  async function patron(pseudo: string, balance = 1_000): Promise<Account> {
    const a = await signup(pseudo);
    storage.poke(a.playerId, (p) => {
      p.owned = [...ALL_ITEMS];
      p.kiosk = true;
      p.balance = balance;
    });
    a.state = (await call("GET", "/api/me", undefined, a.auth)).body.state;
    return a;
  }

  return { storage, call, signup, patron, advance: (ms: number) => { now += ms; }, now: () => now };
}

/**
 * Remplace l'enregistrement d'un compte par celui qu'une version passée du jeu aurait
 * écrit : seuls ses champs à elle, rien de ce qui est venu après.
 */
function rewind(w: ReturnType<typeof makeWorld>, a: Account, legacy: Record<string, unknown>): void {
  w.storage.poke(a.playerId, (p) => {
    const record = p as unknown as Record<string, unknown>;
    const keep = { id: p.id, pseudoKey: p.pseudoKey, codeHash: p.codeHash };
    for (const key of Object.keys(record)) delete record[key];
    Object.assign(record, legacy, keep);
  });
}

/** Ce qu'un joueur possède, et qui ne doit jamais bouger sans lui. */
function belongings(s: PlayerState) {
  return {
    pseudo: s.pseudo, species: s.species, balance: s.balance, pending: s.pending, owned: s.owned, look: s.look,
    kiosk: s.kiosk, standing: s.standing, fortune: s.fortune, createdAt: s.createdAt,
    stats: {
      tickets: s.stats.tickets, winners: s.stats.winners, wagered: s.stats.wagered, won: s.stats.won,
      bestGain: s.stats.bestGain, bestTicket: s.stats.bestTicket, jackpots: s.stats.jackpots,
    },
  };
}

const LOOK_10 = { chapeau: "casquette", lunettes: null, tenue: null, accessoire: null, vehicule: null, residence: null };

/** Un compte de la première version : cinq lieux, pas de poker, un ticket en attente. */
function recordV10(): Record<string, unknown> {
  return {
    v: 1, pseudo: "Ancienne", species: "chat", balance: 1_234,
    pending: [{ id: "t_abcdefghijkl", type: "lucarne", gain: 50, seed: 123456, at: T0 - 60_000 }],
    owned: ALL_ITEMS.slice(0, 12), look: LOOK_10, kiosk: false,
    stats: { tickets: 240, winners: 96, wagered: 3_100, won: 2_950, bestGain: 500, bestTicket: "lucarne", jackpots: 0 },
    createdAt: T0 - 40 * 86_400_000,
    boardAt: 0, boardSig: "", lastBuyAt: T0 - 3_600_000, lastHouseAt: T0 - 3_600_000,
    day: "2026-11-26", dayTickets: 12, banned: false, updatedAt: T0 - 3_600_000,
  };
}

/** Un compte de la version 1.1 : huit lieux, déjà Patron, un ticket trouvé par terre en attente. */
function recordV11(): Record<string, unknown> {
  return {
    v: 1, pseudo: "Patronne", species: "ours", balance: 77_000_000_000,
    pending: [{ id: "t_mnopqrstuvwx", type: "gratte-ciel", gain: 3_000_000_000_000, seed: 987654, house: true, at: T0 - 30_000 }],
    owned: [...ALL_ITEMS], look: LOOK_10, kiosk: true,
    stats: {
      tickets: 1_620, winners: 700, wagered: 9_000_000_000_000, won: 9_400_000_000_000,
      bestGain: 2_500_000_000_000, bestTicket: "gratte-ciel", jackpots: 6,
    },
    createdAt: T0 - 20 * 86_400_000,
    boardAt: 0, boardSig: "", lastBuyAt: T0 - 600_000, lastHouseAt: T0 - 30_000,
    day: "2026-11-27", dayTickets: 40, banned: false, updatedAt: T0 - 30_000,
  };
}

/** Un compte de la version 2.0 : le poker, trois défis relevés, assis nulle part. */
function recordV20(): Record<string, unknown> {
  return {
    ...recordV11(), pseudo: "Tricheuse", kiosk: false, owned: ALL_ITEMS.slice(0, 80), pending: [],
    poker: null, pokerWins: ["casino", "kiosque", "cafe"],
  };
}

// ---------------------------------------------------------------------------

describe("les comptes déjà là : rien ne bouge", () => {
  const VERSIONS: [string, () => Record<string, unknown>][] = [["1.0", recordV10], ["1.1", recordV11], ["2.0", recordV20]];

  for (const [version, make] of VERSIONS) {
    it(`un compte de la version ${version} retrouve tout ce qu'il avait`, async () => {
      const w = makeWorld();
      const a = await w.signup("Temoin");
      const legacy = make();
      rewind(w, a, legacy);
      const before = JSON.stringify(w.storage.peek(a.playerId));

      const me = await w.call("GET", "/api/me", undefined, a.auth);
      expect(me.status).toBe(200);
      const state: PlayerState = me.body.state;
      const owned = legacy.owned as string[];
      const pending = legacy.pending as { gain: number }[];
      const kiosk = legacy.kiosk as boolean;
      // Son bien, à l'euro et au ticket près.
      expect(belongings(state)).toEqual({
        pseudo: legacy.pseudo, species: legacy.species, balance: legacy.balance, pending: legacy.pending,
        owned, look: legacy.look, kiosk, standing: standingOf(owned, kiosk),
        fortune: (legacy.balance as number) + pending.reduce((sum, t) => sum + t.gain, 0)
          + CATALOG.filter((i) => owned.includes(i.id)).reduce((sum, i) => sum + i.price, 0) + (kiosk ? KIOSK.price : 0),
        createdAt: legacy.createdAt, stats: legacy.stats,
      });
      // Lire un compte ne le réécrit pas : aucune « migration ».
      expect(JSON.stringify(w.storage.peek(a.playerId))).toBe(before);
    });

    it(`un compte de la version ${version} reçoit les nouveaux champs avec leur valeur de départ`, async () => {
      const w = makeWorld();
      const a = await w.signup("Temoin");
      const legacy = make();
      rewind(w, a, legacy);
      const state: PlayerState = (await w.call("GET", "/api/me", undefined, a.auth)).body.state;
      expect(state.stats.sown).toBe(0);
      expect(state.stats.sownValue).toBe(0);
      expect(state.masters).toBe(0);
      expect(state.pokerStats).toEqual({ hands: 0, pots: 0, unmasked: 0, caught: 0 });
      expect(state.story).toEqual({ fin: legacy.kiosk, vraieFin: false });
      // Les défis déjà relevés sont rendus dans l'ordre des lieux.
      expect(state.defis).toEqual(version === "2.0" ? ["kiosque", "cafe", "casino"] : []);
      expect(state.poker).toBeUndefined();
    });
  }

  it("une écriture ordinaire ne glisse aucun champ nouveau dans un vieux compte", async () => {
    const w = makeWorld();
    const a = await w.signup("Temoin");
    rewind(w, a, recordV10());
    // Il déclare son ticket gratté, puis en achète un : deux écritures de la vie courante.
    const ack = await w.call("POST", "/api/tickets/ack", { ack: ["t_abcdefghijkl"] }, a.auth);
    expect(ack.status).toBe(200);
    expect(ack.body.state.balance).toBe(1_234 + 50);
    const buy = await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth);
    expect(buy.status).toBe(200);
    const record = w.storage.peek(a.playerId)! as unknown as Record<string, unknown>;
    expect(Object.keys(record).sort()).toEqual(Object.keys({ ...recordV10(), id: 1, pseudoKey: 1, codeHash: 1 }).sort());
    expect(Object.keys(record.stats as object).sort()).toEqual(
      ["bestGain", "bestTicket", "jackpots", "tickets", "wagered", "winners", "won"],
    );
  });

  it("le ticket en attente d'un vieux compte se gratte et se paie comme avant", async () => {
    const w = makeWorld();
    const a = await w.signup("Temoin");
    rewind(w, a, recordV11());
    const r = await w.call("POST", "/api/tickets/ack", { ack: ["t_mnopqrstuvwx"] }, a.auth);
    expect(r.status).toBe(200);
    expect(r.body.state.balance).toBe(77_000_000_000 + 3_000_000_000_000);
    expect(r.body.state.pending).toEqual([]);
    expect(r.body.state.stats.bestGain).toBe(3_000_000_000_000);
    expect(r.body.state.stats.winners).toBe(701);
  });

  it("toState ne modifie pas l'enregistrement qu'on lui donne", () => {
    const record = { ...recordV20(), id: "p_0123456789abcdef", pseudoKey: "tricheuse", codeHash: "x" } as unknown as PlayerRecord;
    const frozen = JSON.stringify(record);
    const state = toState(record, T0);
    state.stats.sown = 99;
    state.defis.push("lune");
    expect(JSON.stringify(record)).toBe(frozen);
  });
});

// ---------------------------------------------------------------------------

describe("ce qui était mérité avant la mise à jour est acquis d'emblée", () => {
  it("les trophées d'un vieux compte se calculent sur ce qu'il a déjà fait", async () => {
    const w = makeWorld();
    const a = await w.signup("Temoin");
    rewind(w, a, recordV11());
    const state: PlayerState = (await w.call("GET", "/api/me", undefined, a.auth)).body.state;
    const medals = medalsOf(state);
    // 1 620 tickets : quatre paliers sur cinq. 2 500 Md€ sur un ticket : cinq sur six.
    expect(medals.filter((m) => m.startsWith("tickets:"))).toEqual(["tickets:1", "tickets:2", "tickets:3", "tickets:4"]);
    expect(medals.filter((m) => m.startsWith("gain:"))).toEqual(["gain:1", "gain:2", "gain:3", "gain:4", "gain:5"]);
    expect(medals.filter((m) => m.startsWith("jackpots:"))).toEqual(["jackpots:1", "jackpots:2"]);
    expect(medals).toEqual(expect.arrayContaining(["collection:3", "voyage:3", "patron:1"]));
    // Ce qui n'existait pas encore reste à gagner.
    expect(medals.some((m) => /^(semeur|mecene|maitres|legende|limier|defis):/.test(m))).toBe(false);
  });

  it("les défis relevés en 2.0 comptent pour les trophées et pour la vraie fin", async () => {
    const w = makeWorld();
    const a = await w.signup("Temoin");
    rewind(w, a, { ...recordV11(), poker: null, pokerWins: [...ALL_PLACES].reverse() });
    const state: PlayerState = (await w.call("GET", "/api/me", undefined, a.auth)).body.state;
    expect(state.defis).toEqual(ALL_PLACES);
    expect(medalsOf(state)).toEqual(expect.arrayContaining(["defis:1", "defis:2", "defis:3"]));
    // Patron et huit défis : la vraie fin l'attend, sans rien refaire.
    const seen = await w.call("POST", "/api/story/seen", { id: "vraie-fin" }, a.auth);
    expect(seen.status).toBe(200);
    expect(seen.body.state.story).toEqual({ fin: true, vraieFin: true });
    expect(medalsOf(seen.body.state)).toContain("legende:1");
  });

  it("un Patron d'avant la mise à jour peut semer dès sa première visite", async () => {
    const w = makeWorld();
    const a = await w.signup("Temoin");
    rewind(w, a, recordV11());
    const r = await w.call("POST", "/api/tickets/sow", { type: "tirelire" }, a.auth);
    expect(r.status).toBe(200);
    expect(r.body.state.stats.sown).toBe(1);
    expect(r.body.state.balance).toBe(77_000_000_000 - 1);
    expect(medalsOf(r.body.state)).toContain("semeur:1");
  });
});

// ---------------------------------------------------------------------------

describe("POST /api/tickets/sow : le Patron laisse tomber des tickets", () => {
  it("réservé au Patron du Kiosque", async () => {
    const w = makeWorld();
    const a = await w.signup("Gueux");
    w.storage.poke(a.playerId, (p) => { p.balance = 500; });
    const r = await w.call("POST", "/api/tickets/sow", { type: "tirelire" }, a.auth);
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("SOW_LOCKED");
    expect(w.storage.peek(a.playerId)!.balance).toBe(500);
  });

  it("sans compte : refusé", async () => {
    const w = makeWorld();
    const r = await w.call("POST", "/api/tickets/sow", { type: "tirelire" });
    expect(r.status).toBe(401);
  });

  it("un ticket semé coûte son prix, et rien d'autre ne bouge", async () => {
    const w = makeWorld();
    const a = await w.patron("Semeuse", 1_000);
    const before = a.state;
    const r = await w.call("POST", "/api/tickets/sow", { type: "lucarne" }, a.auth);
    expect(r.status).toBe(200);
    const after: PlayerState = r.body.state;
    const price = ticketById("lucarne")!.price;
    expect(after.balance).toBe(1_000 - price);
    expect(after.fortune).toBe(before.fortune - price);
    expect(after.stats.sown).toBe(1);
    expect(after.stats.sownValue).toBe(price);
    // Ce n'est pas son ticket : rien à gratter, rien de joué, rien de misé, rien de gagné.
    expect(after.pending).toEqual([]);
    expect(after.stats.tickets).toBe(before.stats.tickets);
    expect(after.stats.wagered).toBe(before.stats.wagered);
    expect(after.stats.won).toBe(before.stats.won);
    expect(after.owned).toEqual(before.owned);
    expect(after.standing).toBe(before.standing);
    expect(after.luckyIn).toBe(before.luckyIn);
  });

  it("par un, cinq ou dix : le compte et la valeur suivent", async () => {
    const w = makeWorld();
    const a = await w.patron("Semeuse", 10_000);
    const price = ticketById("bas-de-laine")!.price;
    let sown = 0;
    for (const qty of [1, 5, 10]) {
      w.advance(BUY_COOLDOWN_MS);
      const r = await w.call("POST", "/api/tickets/sow", { type: "bas-de-laine", qty }, a.auth);
      expect(r.status).toBe(200);
      sown += qty;
      expect(r.body.state.stats.sown).toBe(sown);
      expect(r.body.state.stats.sownValue).toBe(sown * price);
      expect(r.body.state.balance).toBe(10_000 - sown * price);
    }
    // Les compteurs sont bien dans l'enregistrement : ils survivent à la visite suivante.
    expect(w.storage.peek(a.playerId)!.stats.sown).toBe(16);
  });

  it("refuse une quantité ou un ticket qui n'existent pas", async () => {
    const w = makeWorld();
    const a = await w.patron("Semeuse");
    for (const body of [{ type: "tirelire", qty: 2 }, { type: "tirelire", qty: 0 }, { type: "tirelire", qty: "5" }, { type: "inconnu" }, {}]) {
      const r = await w.call("POST", "/api/tickets/sow", body, a.auth);
      expect([body, r.status, r.body.error.code]).toEqual([body, 400, "BAD_REQUEST"]);
    }
    expect(w.storage.peek(a.playerId)!.balance).toBe(1_000);
  });

  it("la bourse doit couvrir le prix : pas de ticket semé à crédit", async () => {
    const w = makeWorld();
    const a = await w.patron("Semeuse", 49);
    const r = await w.call("POST", "/api/tickets/sow", { type: "bas-de-laine" }, a.auth);
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("INSUFFICIENT_FUNDS");
    const five = await w.call("POST", "/api/tickets/sow", { type: "lucarne", qty: 5 }, a.auth);
    expect(five.body.error.code).toBe("INSUFFICIENT_FUNDS");
    expect(w.storage.peek(a.playerId)!.balance).toBe(49);
    expect(w.storage.peek(a.playerId)!.stats.sown).toBeUndefined();
  });

  it("les gains déclarés avec la demande comptent dans la bourse", async () => {
    const w = makeWorld();
    const a = await w.patron("Semeuse", 0);
    w.storage.poke(a.playerId, (p) => {
      p.pending.push({ id: "t_aaaaaaaaaaaa", type: "tirelire", gain: 30, seed: 1, at: T0 });
    });
    const r = await w.call("POST", "/api/tickets/sow", { type: "lucarne", ack: ["t_aaaaaaaaaaaa"] }, a.auth);
    expect(r.status).toBe(200);
    expect(r.body.state.balance).toBe(30 - 10);
    expect(r.body.state.pending).toEqual([]);
  });

  it("un geste par seconde au comptoir, achat ou semis", async () => {
    const w = makeWorld();
    const a = await w.patron("Semeuse");
    expect((await w.call("POST", "/api/tickets/sow", { type: "tirelire" }, a.auth)).status).toBe(200);
    const fast = await w.call("POST", "/api/tickets/sow", { type: "tirelire" }, a.auth);
    expect(fast.status).toBe(429);
    expect(fast.body.error.code).toBe("TOO_FAST");
    // Acheter juste après avoir semé attend aussi.
    expect((await w.call("POST", "/api/tickets/buy", { type: "tirelire", qty: 1 }, a.auth)).body.error.code).toBe("TOO_FAST");
    w.advance(BUY_COOLDOWN_MS);
    expect((await w.call("POST", "/api/tickets/sow", { type: "tirelire" }, a.auth)).status).toBe(200);
    expect(w.storage.peek(a.playerId)!.stats.sown).toBe(2);
  });

  it("semer ne touche ni au ticket par terre ni au compteur du jour", async () => {
    const w = makeWorld();
    const a = await w.patron("Semeuse");
    const before = w.storage.peek(a.playerId)!;
    const lastHouseAt = before.lastHouseAt;
    const dayTickets = before.dayTickets;
    w.advance(LUCKY_FIND_MS / 2);
    await w.call("POST", "/api/tickets/sow", { type: "tirelire", qty: 10 }, a.auth);
    const after = w.storage.peek(a.playerId)!;
    expect(after.lastHouseAt).toBe(lastHouseAt);
    expect(after.dayTickets).toBe(dayTickets);
  });

  it("la fortune publiée au classement suit la bourse", async () => {
    const w = makeWorld();
    const a = await w.patron("Semeuse", 5_000);
    // Le classement ne republie un joueur qu'une fois toutes les trente secondes.
    w.advance(BOARD_PUBLISH_INTERVAL_MS);
    await w.call("POST", "/api/tickets/sow", { type: "mille-pattes" }, a.auth);
    const board = (await w.call("GET", "/api/leaderboard")).body;
    const mine = board.entries.find((e: { id: string }) => e.id === a.playerId);
    expect(mine.fortune).toBe(a.state.fortune - ticketById("mille-pattes")!.price);
  });
});

// ---------------------------------------------------------------------------

describe("POST /api/story/seen : la vraie fin", () => {
  async function ready(w: ReturnType<typeof makeWorld>, wins: string[] = ALL_PLACES): Promise<Account> {
    const a = await w.patron("Legende");
    w.storage.poke(a.playerId, (p) => { p.pokerWins = [...wins]; });
    return a;
  }

  it("se mérite : le Kiosque et les huit défis", async () => {
    const w = makeWorld();
    // Sept défis sur huit.
    const almost = await ready(w, ALL_PLACES.slice(0, 7));
    const r1 = await w.call("POST", "/api/story/seen", { id: "vraie-fin" }, almost.auth);
    expect([r1.status, r1.body.error.code]).toEqual([400, "BAD_REQUEST"]);
    // Huit défis, mais pas le Kiosque.
    const b = await w.signup("Tricheur");
    w.storage.poke(b.playerId, (p) => { p.pokerWins = [...ALL_PLACES]; });
    const r2 = await w.call("POST", "/api/story/seen", { id: "vraie-fin" }, b.auth);
    expect([r2.status, r2.body.error.code]).toEqual([400, "BAD_REQUEST"]);
    expect(w.storage.peek(almost.playerId)!.vraieFin).toBeUndefined();
    expect(w.storage.peek(b.playerId)!.vraieFin).toBeUndefined();
  });

  it("une fois vue, elle le reste ; la revoir ne change rien", async () => {
    const w = makeWorld();
    const a = await ready(w);
    expect(a.state.story).toEqual({ fin: true, vraieFin: false });
    const first = await w.call("POST", "/api/story/seen", { id: "vraie-fin" }, a.auth);
    expect(first.status).toBe(200);
    expect(first.body.state.story).toEqual({ fin: true, vraieFin: true });
    const stored = JSON.stringify(w.storage.peek(a.playerId));
    const again = await w.call("POST", "/api/story/seen", { id: "vraie-fin" }, a.auth);
    expect(again.status).toBe(200);
    expect(again.body.state.story.vraieFin).toBe(true);
    expect(JSON.stringify(w.storage.peek(a.playerId))).toBe(stored);
    // Rien d'autre n'a bougé : ni bourse, ni biens, ni Standing.
    expect(belongings(again.body.state)).toEqual(belongings(a.state));
  });

  it("au classement, seule une Légende porte la marque, et les autres entrées gardent leur forme", async () => {
    const w = makeWorld();
    const a = await ready(w);
    const other = await w.patron("Patronne");
    w.advance(BOARD_PUBLISH_INTERVAL_MS);
    // Une écriture ordinaire de chacune, pour publier leur fortune.
    await w.call("POST", "/api/tickets/sow", { type: "tirelire" }, a.auth);
    await w.call("POST", "/api/tickets/sow", { type: "tirelire" }, other.auth);
    let board = (await w.call("GET", "/api/leaderboard")).body;
    const KEYS = ["at", "fortune", "id", "kiosk", "look", "pseudo", "species", "standing"];
    for (const entry of board.entries) expect(Object.keys(entry).sort()).toEqual(KEYS);
    // La vraie fin vue : la marque est publiée avec l'écriture, sans attendre un changement de fortune.
    w.advance(BOARD_PUBLISH_INTERVAL_MS);
    await w.call("POST", "/api/story/seen", { id: "vraie-fin" }, a.auth);
    board = (await w.call("GET", "/api/leaderboard")).body;
    const mine = board.entries.find((e: { id: string }) => e.id === a.playerId);
    const hers = board.entries.find((e: { id: string }) => e.id === other.playerId);
    expect(mine.legend).toBe(true);
    expect(Object.keys(hers).sort()).toEqual(KEYS);
  });

  it("la signature de publication d'un compte qui n'est pas une Légende est celle d'avant", async () => {
    const w = makeWorld();
    const a = await w.patron("Patronne");
    w.advance(BOARD_PUBLISH_INTERVAL_MS);
    await w.call("POST", "/api/tickets/sow", { type: "tirelire" }, a.auth);
    const record = w.storage.peek(a.playerId)!;
    // Neuf champs séparés par des barres, comme en 2.0 : fortune, Standing, espèce, quatre pièces de tenue, Kiosque, pseudo.
    expect(record.boardSig.split("|")).toHaveLength(9);
    expect(record.boardSig.endsWith("|1|Patronne")).toBe(true);
  });

  it("refuse une page d'histoire inconnue", async () => {
    const w = makeWorld();
    const a = await ready(w);
    for (const body of [{ id: "fin" }, { id: 1 }, {}]) {
      const r = await w.call("POST", "/api/story/seen", body, a.auth);
      expect([body, r.status]).toEqual([body, 400]);
    }
    expect((await w.call("POST", "/api/story/seen", { id: "vraie-fin" })).status).toBe(401);
  });

  it("le premier générique est derrière lui dès que le Kiosque est à lui", async () => {
    const w = makeWorld();
    const a = await w.signup("Gueux");
    expect(a.state.story).toEqual({ fin: false, vraieFin: false });
    const p = await w.patron("Patron");
    expect(p.state.story).toEqual({ fin: true, vraieFin: false });
  });
});

// ---------------------------------------------------------------------------

/** Un état vierge, celui d'un compte qui débarque. */
function fresh(): PlayerState {
  return {
    id: "p_0000000000000000", pseudo: "Neuf", species: "renard", balance: 0, pending: [], owned: [],
    look: { chapeau: null, lunettes: null, tenue: null, accessoire: null, vehicule: null, residence: null },
    kiosk: false, standing: 0, fortune: 0,
    stats: { tickets: 0, winners: 0, wagered: 0, won: 0, bestGain: 0, bestTicket: null, jackpots: 0, sown: 0, sownValue: 0 },
    createdAt: T0, luckyIn: 0, defis: [], masters: 0, story: { fin: false, vraieFin: false },
    pokerStats: { hands: 0, pots: 0, unmasked: 0, caught: 0 },
  };
}

describe("trophées", () => {
  it("douze familles, trente-huit médailles, des paliers croissants", () => {
    expect(TROPHIES.map((f) => f.id)).toEqual([
      "tickets", "gain", "jackpots", "semeur", "mecene", "collection", "voyage", "patron", "defis", "limier", "maitres", "legende",
    ]);
    expect(MEDAL_COUNT).toBe(38);
    for (const family of TROPHIES) {
      expect(family.tiers.length).toBeGreaterThan(0);
      for (let i = 1; i < family.tiers.length; i++) expect(family.tiers[i]!).toBeGreaterThan(family.tiers[i - 1]!);
      expect(family.tiers.every((tier) => Number.isSafeInteger(tier) && tier > 0)).toBe(true);
      expect(trophyById(family.id)).toBe(family);
    }
    expect(trophyById("inconnu")).toBeUndefined();
  });

  it("le dernier palier de chaque famille reste à portée du jeu", () => {
    const top = (id: string) => trophyById(id)!.tiers.at(-1)!;
    expect(top("collection")).toBe(CATALOG.length);
    expect(top("voyage")).toBe(PLACES.length);
    expect(top("defis")).toBe(PLACES.length);
    // Le plus gros lot du jeu dépasse le dernier palier du « gain sur un seul ticket ».
    expect(top("gain")).toBeLessThanOrEqual(ticketById("gratte-ciel")!.price * 1_000);
  });

  it("un compte qui débarque : aucune médaille, sauf le premier lieu qui ne compte pas", () => {
    const state = fresh();
    expect(medalsOf(state)).toEqual([]);
    for (const family of TROPHIES) {
      const progress = progressOf(state, family.id);
      expect(progress.earned).toBe(0);
      expect(progress.total).toBe(family.tiers.length);
      expect(progress.next).toBe(family.tiers[0]);
    }
    // Le Kiosque est ouvert d'emblée : un lieu, et il en faut deux pour la première médaille.
    expect(progressOf(state, "voyage").value).toBe(1);
  });

  it("un palier se gagne pile à sa valeur, pas un cran avant", () => {
    const state = fresh();
    state.stats.tickets = 9;
    expect(medalsOf(state)).toEqual([]);
    state.stats.tickets = 10;
    expect(medalsOf(state)).toEqual(["tickets:1"]);
    state.stats.tickets = 4_999;
    expect(progressOf(state, "tickets")).toEqual({ value: 4_999, next: 5_000, earned: 4, total: 5 });
    state.stats.tickets = 5_000;
    expect(progressOf(state, "tickets")).toEqual({ value: 5_000, next: null, earned: 5, total: 5 });
  });

  it("chaque famille lit le bon compteur", () => {
    const state = fresh();
    state.stats.bestGain = 1_000_000;
    state.stats.jackpots = 5;
    state.stats.sown = 50;
    state.stats.sownValue = 1_000_000_000;
    state.owned = ALL_ITEMS.slice(0, 50);
    state.standing = 400;
    state.defis = ["kiosque", "cafe", "casino", "salon"];
    state.pokerStats.unmasked = 10;
    expect(medalsOf(state)).toEqual([
      "gain:1", "gain:2", "gain:3", "jackpots:1", "jackpots:2", "semeur:1", "semeur:2", "semeur:3",
      "mecene:1", "mecene:2", "mecene:3", "collection:1", "collection:2", "voyage:1", "voyage:2",
      "defis:1", "defis:2", "limier:1", "limier:2",
    ]);
    state.kiosk = true;
    state.masters = 1;
    state.story.vraieFin = true;
    expect(medalsOf(state)).toEqual(expect.arrayContaining(["patron:1", "maitres:1", "legende:1"]));
  });

  it("tout gagné : trente-huit médailles, toutes différentes", () => {
    const state = fresh();
    state.stats = {
      tickets: 5_000, winners: 0, wagered: 0, won: 0, bestGain: 1e15, bestTicket: "gratte-ciel", jackpots: 25,
      sown: 1_000, sownValue: 1e12,
    };
    state.owned = [...ALL_ITEMS];
    state.kiosk = true;
    state.standing = standingOf(ALL_ITEMS, true);
    state.defis = [...ALL_PLACES];
    state.pokerStats.unmasked = 50;
    state.masters = 1;
    state.story = { fin: true, vraieFin: true };
    const medals = medalsOf(state);
    expect(medals).toHaveLength(38);
    expect(new Set(medals).size).toBe(38);
    for (const family of TROPHIES) expect(progressOf(state, family.id).next).toBeNull();
  });

  it("newMedals : ce qu'une action vient de débloquer, et rien au premier état", () => {
    const before = fresh();
    const after = fresh();
    after.stats.tickets = 100;
    after.stats.bestGain = 150;
    expect(newMedals(before, after)).toEqual(["tickets:1", "tickets:2", "gain:1"]);
    expect(newMedals(after, after)).toEqual([]);
    // Sans état d'avant (ouverture de la session), rien n'est « nouveau » : pas de fanfare rétroactive.
    expect(newMedals(null, after)).toEqual([]);
  });

  it("une famille inconnue, un état incomplet : rien ne casse", () => {
    expect(progressOf(fresh(), "inconnu")).toEqual({ value: 0, next: null, earned: 0, total: 0 });
    // L'état d'un serveur plus ancien, sans les champs ajoutés depuis.
    const old = fresh() as unknown as Record<string, unknown>;
    delete old.defis; delete old.masters; delete old.story; delete old.pokerStats;
    expect(medalsOf(old as unknown as PlayerState)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("l'appareil complète l'état d'un serveur plus ancien", () => {
  it("ce qui manque reçoit sa valeur de départ", () => {
    const old = fresh() as unknown as Record<string, unknown>;
    delete old.defis; delete old.masters; delete old.story; delete old.pokerStats;
    old.stats = { tickets: 12, winners: 4, wagered: 30, won: 20, bestGain: 10, bestTicket: "tirelire", jackpots: 0 };
    old.kiosk = true;
    const state = completeState(old as unknown as PlayerState);
    expect(state.stats).toEqual({
      tickets: 12, winners: 4, wagered: 30, won: 20, bestGain: 10, bestTicket: "tirelire", jackpots: 0, sown: 0, sownValue: 0,
    });
    expect(state.defis).toEqual([]);
    expect(state.masters).toBe(0);
    expect(state.story).toEqual({ fin: true, vraieFin: false });
    expect(state.pokerStats).toEqual({ hands: 0, pots: 0, unmasked: 0, caught: 0 });
  });

  it("un état complet ressort tel quel", () => {
    const full = fresh();
    full.stats.sown = 7; full.stats.sownValue = 700;
    full.defis = ["kiosque", "lune"]; full.masters = 2; full.kiosk = true;
    full.story = { fin: true, vraieFin: true };
    full.pokerStats = { hands: 30, pots: 11, unmasked: 4, caught: 2 };
    full.poker = { code: "ABCD" };
    expect(completeState(full)).toEqual(full);
  });

  it("des valeurs illisibles retombent sur zéro, des lieux inconnus sont écartés", () => {
    const odd = fresh() as unknown as Record<string, unknown>;
    odd.masters = "3"; odd.defis = ["lune", "atlantide", "kiosque"]; odd.pokerStats = { hands: -4, pots: 2.9 };
    const state = completeState(odd as unknown as PlayerState);
    expect(state.masters).toBe(0);
    expect(state.defis).toEqual(["kiosque", "lune"]);
    expect(state.pokerStats).toEqual({ hands: 0, pots: 2, unmasked: 0, caught: 0 });
  });

  it("completeResponse : seule une réponse qui porte l'état du joueur est touchée", () => {
    const board = { entries: [], updatedAt: 1 };
    expect(completeResponse(board)).toBe(board);
    expect(completeResponse(null)).toBeNull();
    const unchanged = { unchanged: true };
    expect(completeResponse(unchanged)).toBe(unchanged);
    const old = fresh() as unknown as Record<string, unknown>;
    delete old.story;
    const reply = completeResponse({ tickets: [], state: old as unknown as PlayerState });
    expect(reply.state.story).toEqual({ fin: false, vraieFin: false });
    expect(reply.tickets).toEqual([]);
  });
});
