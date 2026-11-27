// La pile de Piou : cinq cents tickets au chaud (vingt jusqu'à la version 2.1).
//
// Ce que cela demande au-delà du nombre : une requête ne déclare que soixante-quatre tickets
// grattés, et une rafale peut en laisser des centaines. Le magasin d'état les déclare donc par
// paquets, un seul envoi à la fois, et tout est déclaré avant un achat : le serveur voit le
// même solde que le joueur. L'écran « À gratter » range la pile par ticket. Les règles du
// serveur (la pile pleine, le coup de chance qui attend de la place) sont éprouvées dans
// tests/server.test.ts.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CATALOG } from "../shared/catalog";
import { PLACES } from "../shared/places";
import { MAX_ACK, MAX_BODY_BYTES, MAX_PENDING } from "../shared/rules";
import { TICKETS } from "../shared/tickets";
import type { PendingTicket, PlayerState } from "../shared/types";
import { setLang } from "../src/i18n";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  setLang("fr");
});

/** Un ticket en attente, d'identifiant valable (`t_` et douze caractères). */
function ticket(i: number, type = "tirelire", gain = 2, house = false): PendingTicket {
  return { id: `t_${String(i).padStart(12, "0")}`, type, gain, seed: i, at: 0, ...(house ? { house: true as const } : {}) };
}

/** Un joueur et sa pile : `plus` règle ce qui change d'un test à l'autre. */
function joueur(pending: PendingTicket[], plus: Partial<PlayerState> = {}): PlayerState {
  return {
    id: "p_test", pseudo: "Zabeth", species: "renard", balance: 0, pending, owned: CATALOG.map((item) => item.id),
    look: { chapeau: null, lunettes: null, tenue: null, accessoire: null, vehicule: null, residence: null },
    kiosk: false, standing: 1_000_000_000, fortune: 0,
    stats: { tickets: pending.length, winners: 0, wagered: 0, won: 0, bestGain: 0, bestTicket: null, jackpots: 0, sown: 0, sownValue: 0 },
    createdAt: 0, luckyIn: 60_000, defis: [], masters: 0, story: { fin: false, vraieFin: false },
    pokerStats: { hands: 0, pots: 0, unmasked: 0, caught: 0 },
    hostWins: { kiosque: 0, cafe: 0, casino: 0, salon: 0, cercle: 0, yacht: 0, banque: 0, lune: 0 }, experiences: [],
    ...plus,
  };
}

/**
 * Un faux serveur, aussi strict que le vrai sur ce qui compte ici : soixante-quatre tickets
 * déclarés par requête au plus, et un achat refusé si le solde, une fois la déclaration
 * faite, ne suffit pas.
 */
function fauxServeur(depart: PlayerState) {
  let etat = depart;
  const paquets: number[] = [];
  let enCours = 0;
  let auPlusEnMeme = 0;
  async function declarer(ids: readonly string[]): Promise<PlayerState> {
    enCours += 1;
    auPlusEnMeme = Math.max(auPlusEnMeme, enCours);
    // Un vrai réseau prend son temps : deux envois qui se chevaucheraient se verraient.
    await new Promise((resolve) => setTimeout(resolve, 5));
    enCours -= 1;
    const { ApiFailure } = await import("../src/app/api");
    if (ids.length > MAX_ACK) throw new ApiFailure("BAD_REQUEST", 400);
    if (ids.length > 0) paquets.push(ids.length);
    const vus = new Set(ids);
    let balance = etat.balance;
    const restent = etat.pending.filter((t) => {
      if (!vus.has(t.id)) return true;
      balance += t.gain;
      return false;
    });
    etat = { ...etat, balance, pending: restent };
    return etat;
  }
  return { declarer, paquets, etat: () => etat, auPlusEnMeme: () => auPlusEnMeme };
}

/** Un magasin neuf, branché sur le faux serveur, avec ce joueur dedans et ces tickets déjà grattés. */
async function magasin(player: PlayerState, grattes: readonly string[] = []) {
  vi.resetModules();
  // Le magasin programme ses déclarations avec les minuteurs de la fenêtre : ici, ceux de Node.
  vi.stubGlobal("window", { setTimeout, clearTimeout, location: { search: "" } });
  const store = await import("../src/app/store");
  const { api, ApiFailure } = await import("../src/app/api");
  const serveur = fauxServeur(player);
  store.useGame.setState({
    phase: "jeu", sandbox: true, online: true, auth: { playerId: player.id, code: "CODE" }, player, revealed: [...grattes], toast: null,
  });
  const ack = vi.spyOn(api, "ack").mockImplementation(async (_auth, ids) => ({ state: await serveur.declarer(ids) }));
  const achat = vi.spyOn(api, "buyTickets").mockImplementation(async (_auth, type, qty, ids) => {
    const etat = await serveur.declarer(ids);
    const def = TICKETS.find((x) => x.id === type)!;
    if (etat.balance < def.price * qty) throw new ApiFailure("INSUFFICIENT_FUNDS", 409);
    const vendus = Array.from({ length: qty }, (_, i) => ticket(9_000 + i, type, 0));
    const apres = { ...etat, balance: etat.balance - def.price * qty, pending: [...etat.pending, ...vendus] };
    return { tickets: vendus, state: apres };
  });
  vi.spyOn(api, "me").mockRejectedValue(new ApiFailure("NETWORK"));
  return { ...store, serveur, ack, achat, etat: () => store.useGame.getState() };
}

// ---------------------------------------------------------------------------

describe("les limites", () => {
  it("cinq cents tickets au chaud ; soixante par déclaration, sous ce que le serveur accepte", async () => {
    expect(MAX_PENDING).toBe(500);
    expect(MAX_ACK).toBe(64);
    const { ACK_BATCH } = await import("../src/app/store");
    expect(ACK_BATCH).toBe(60);
    expect(ACK_BATCH).toBeLessThanOrEqual(MAX_ACK);
    // Un achat qui porte un paquet plein tient dans le corps de requête permis.
    const corps = JSON.stringify({ type: "tirelire", qty: 10, ack: Array.from({ length: ACK_BATCH }, (_, i) => ticket(i).id) });
    expect(new TextEncoder().encode(corps).length).toBeLessThan(MAX_BODY_BYTES / 2);
  });
});

describe("la déclaration des tickets grattés, par paquets", () => {
  it("une rafale de trois cents tickets se déclare en cinq paquets, un seul envoi à la fois", async () => {
    const pile = Array.from({ length: 300 }, (_, i) => ticket(i, "tirelire", i % 3 === 0 ? 2 : 0));
    const m = await magasin(joueur(pile), pile.map((t) => t.id));
    const affiche = m.displayBalance(m.etat());
    expect(affiche).toBe(200);
    // Deux demandes en même temps n'en font qu'une.
    await Promise.all([m.flushAck(), m.flushAck()]);
    expect(m.serveur.paquets).toEqual([60, 60, 60, 60, 60]);
    expect(m.serveur.auPlusEnMeme()).toBe(1);
    // Tout est déclaré : le serveur a crédité les gains, la bourse affichée n'a pas bougé.
    expect([m.serveur.etat().pending.length, m.serveur.etat().balance]).toEqual([0, 200]);
    expect([m.etat().revealed.length, m.etat().player?.pending.length, m.displayBalance(m.etat())]).toEqual([0, 0, 200]);
  });

  it("un paquet plein part tout de suite, sans attendre les trois secondes", async () => {
    const pile = Array.from({ length: 130 }, (_, i) => ticket(i));
    const m = await magasin(joueur(pile));
    for (let i = 0; i < ACK(m) - 1; i++) m.markRevealed(pile[i]!.id, 0);
    await new Promise((resolve) => setTimeout(resolve, 20));
    // Moins d'un paquet : on attend la fin des grattages.
    expect(m.ack).not.toHaveBeenCalled();
    m.markRevealed(pile[ACK(m) - 1]!.id, 0);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(m.ack).toHaveBeenCalledTimes(1);
    expect(m.serveur.paquets).toEqual([60]);
    // La suite de la rafale : le paquet suivant part à son tour.
    for (let i = 60; i < 120; i++) m.markRevealed(pile[i]!.id, 0);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(m.serveur.paquets).toEqual([60, 60]);
    expect(m.etat().player?.pending.length).toBe(10);
  });

  it("avant un achat, tout ce qui a été gratté est déclaré : le serveur voit le solde affiché", async () => {
    // 200 tickets grattés, gagnants de 5 € chacun : 1 000 € affichés, rien encore au serveur.
    const pile = Array.from({ length: 200 }, (_, i) => ticket(i, "tirelire", 5));
    const m = await magasin(joueur(pile), pile.map((t) => t.id));
    expect([m.serveur.etat().balance, m.displayBalance(m.etat())]).toEqual([0, 1_000]);
    // Le Bandit manchot, à 500 € : un seul paquet (300 €) ne suffirait pas.
    const cher = TICKETS.find((x) => x.id === "bandit-manchot")!;
    expect(cher.price).toBe(500);
    expect(m.ticketBlocker(cher.id, 1)).toBeNull();
    const vendus = await m.buyTickets(cher.id, 1);
    expect(vendus).toHaveLength(1);
    expect(m.etat().toast).toBeNull();
    // Trois paquets d'abord, puis l'achat, qui porte le reste.
    expect(m.serveur.paquets).toEqual([60, 60, 60, 20]);
    expect(m.achat.mock.calls[0]![3]).toHaveLength(20);
    expect(m.serveur.etat().balance).toBe(1_000);
    expect(m.etat().player?.balance).toBe(500);
    expect(m.etat().revealed).toEqual([]);
  });

  it("un paquet refusé arrête la déclaration, sans rien perdre : la prochaine reprend", async () => {
    const pile = Array.from({ length: 150 }, (_, i) => ticket(i, "tirelire", 1));
    const m = await magasin(joueur(pile), pile.map((t) => t.id));
    const { ApiFailure } = await import("../src/app/api");
    m.ack.mockImplementationOnce(async () => {
      throw new ApiFailure("NETWORK");
    });
    await m.flushAck();
    expect(m.serveur.paquets).toEqual([]);
    expect(m.etat().revealed).toHaveLength(150);
    expect(m.displayBalance(m.etat())).toBe(150);
    await m.flushAck();
    expect(m.serveur.paquets).toEqual([60, 60, 30]);
    expect([m.etat().revealed.length, m.etat().player?.balance]).toEqual([0, 150]);
  });

  it("hors connexion, rien ne part, et la bourse affichée compte quand même tout", async () => {
    const pile = Array.from({ length: 80 }, (_, i) => ticket(i, "tirelire", 1));
    const m = await magasin(joueur(pile), pile.map((t) => t.id));
    m.useGame.setState({ online: false });
    await m.flushAck();
    expect(m.ack).not.toHaveBeenCalled();
    expect([m.toScratch(m.etat()).length, m.displayBalance(m.etat())]).toEqual([0, 80]);
  });
});

/** La taille d'un paquet, lue sur le magasin du test. */
function ACK(m: { ACK_BATCH: number }): number {
  return m.ACK_BATCH;
}

// ---------------------------------------------------------------------------

describe("la pile « À gratter », rangée par ticket", () => {
  it("un paquet par ticket, ceux trouvés par terre juste après, dans l'ordre des comptoirs", async () => {
    const { paquetsDe, fileDepuis } = await import("../src/screens/a-gratter/AGratter");
    // Achetés dans le désordre : une Lucarne (10 €), deux Tirelires (1 €), une trouvée par terre, une autre Lucarne.
    const pile = [
      ticket(0, "lucarne"), ticket(1, "tirelire"), ticket(2, "tirelire", 3, true), ticket(3, "tirelire"), ticket(4, "lucarne"),
    ];
    const paquets = paquetsDe(pile);
    expect(paquets.map((p) => [p.type, p.house, p.tickets.map((t) => t.seed)])).toEqual([
      ["tirelire", false, [1, 3]], ["tirelire", true, [2]], ["lucarne", false, [0, 4]],
    ]);
    // La liste se lit dans l'ordre du grattage ; toucher une ligne fait tourner la pile à partir d'elle.
    expect(fileDepuis(paquets, 0).map((t) => t.seed)).toEqual([1, 3, 2, 0, 4]);
    expect(fileDepuis(paquets, 2).map((t) => t.seed)).toEqual([0, 4, 1, 3, 2]);
    expect(fileDepuis(paquets, 1).map((t) => t.seed)).toEqual([2, 0, 4, 1, 3]);
    // Rien ne se perd, rien ne se double ; un ticket que ce jeu ne connaît pas passe en dernier.
    expect(paquets.flatMap((p) => p.tickets)).toHaveLength(pile.length);
    expect(paquetsDe([ticket(9, "inconnu"), ticket(8, "tirelire")]).map((p) => p.type)).toEqual(["tirelire", "inconnu"]);
    expect(paquetsDe([])).toEqual([]);
  });

  /** L'écran, rendu avec cette pile (hors navigateur, il lit l'état initial du magasin). */
  async function ecran(pile: PendingTicket[], langue: "fr" | "en" = "fr") {
    vi.resetModules();
    vi.stubGlobal("window", { setTimeout, clearTimeout, location: { search: "" } });
    const i18n = await import("../src/i18n");
    i18n.setLang(langue);
    const { useGame } = await import("../src/app/store");
    Object.assign(useGame.getInitialState(), { phase: "jeu", player: joueur(pile), revealed: [] });
    const { AGratter } = await import("../src/screens/a-gratter/AGratter");
    return renderToStaticMarkup(createElement(AGratter)).replace(/[  ]/g, " ").replace(/&#x27;/g, "'");
  }

  it("cinq cents tickets : quelques lignes, chacune avec son nombre, et Piou dit que sa poche est pleine", async () => {
    // Les tickets de deux lieux, par carnets de dix ; un sur cinquante trouvé par terre (toujours le même ticket).
    const types = TICKETS.filter((x) => x.place === PLACES[0]!.id || x.place === PLACES[1]!.id).map((x) => x.id);
    const pile = Array.from({ length: MAX_PENDING }, (_, i) =>
      (i % 50 === 49 ? ticket(i, types[0]!, 3, true) : ticket(i, types[Math.floor(i / 10) % types.length]!, 1)));
    const html = await ecran(pile);
    const lignes = html.match(/class="pile__ticket( pile__ticket--paquet)?"/g) ?? [];
    expect(lignes.length).toBe(types.length + 1);
    expect(lignes.length).toBeLessThan(20);
    // Les nombres, sur les vignettes, font les cinq cents.
    const nombres = [...html.matchAll(/class="pile__nombre chiffres">(\d+)</g)].map((m) => Number(m[1]));
    expect(nombres.reduce((a, b) => a + b, 0)).toBe(MAX_PENDING);
    // Ceux trouvés par terre : leur ligne, sans prix.
    expect(html).toContain(`aria-label="Gratter ${ticketNameFr(types[0]!)}, trouvé par terre : 10 tickets"`);
    expect(html).toContain(`${MAX_PENDING} tickets au chaud : ma poche est pleine !`);
    expect(html).toContain("Tout gratter en rafale");
  });

  it("une pile ordinaire garde ses lignes d'avant : un ticket seul n'a ni nombre ni second talon", async () => {
    const html = await ecran([ticket(0, "tirelire"), ticket(1, "lucarne"), ticket(2, "tirelire")]);
    expect(html.match(/class="pile__ticket"/g)).toHaveLength(1);
    expect(html.match(/class="pile__ticket pile__ticket--paquet"/g)).toHaveLength(1);
    expect([...html.matchAll(/class="pile__nombre chiffres">(\d+)</g)].map((m) => m[1])).toEqual(["2"]);
    expect(html).toContain("Je vous ai gardé 3 tickets au chaud.");
  });

  it("en anglais aussi", async () => {
    const html = await ecran([ticket(0, "tirelire"), ticket(1, "tirelire"), ticket(2, "tirelire", 3, true)], "en");
    expect(html).toMatch(/aria-label="Scratch [^"]+, [^"]+: 2 tickets"/);
    expect(html).toMatch(/aria-label="Scratch [^"]+, found on the ground"/);
    expect(html).toContain("I've kept 3 tickets warm for you.");
  });
});

/** Le nom français d'un ticket (celui du socle). */
function ticketNameFr(id: string): string {
  return TICKETS.find((x) => x.id === id)!.name;
}

describe("Piou, quand la pile est pleine", () => {
  it("il le dit, dans les deux langues, et pas avant", async () => {
    vi.resetModules();
    const i18n = await import("../src/i18n");
    const { PIOU } = await import("../src/app/dialogues");
    i18n.setLang("fr");
    expect(PIOU.enAttente(499)).toBe("Je vous ai gardé 499 tickets au chaud.");
    expect(PIOU.enAttente(500)).toBe("500 tickets au chaud : ma poche est pleine ! Grattez-en quelques-uns avant d'en reprendre.");
    i18n.setLang("en");
    expect(PIOU.enAttente(500)).toBe("500 tickets kept warm: my pocket is full! Scratch a few before you buy more.");
    expect(PIOU.enAttente(1)).toBe("I've kept 1 ticket warm for you.");
  });
});

// ---------------------------------------------------------------------------

describe("de bout en bout : le magasin d'état et le vrai serveur, dans le bac à sable", () => {
  it("cinq cents tickets achetés, grattés d'une traite, tous déclarés et payés, sans qu'une requête en porte trop", async () => {
    vi.resetModules();
    vi.stubGlobal("window", { setTimeout, clearTimeout, location: { search: "?bac-a-sable&solde=10&attente=500" } });
    const api = await import("../src/app/api");
    const store = await import("../src/app/store");
    await api.enableSandbox();
    store.useGame.setState({ sandbox: true, online: true });
    // Chaque déclaration passe par le vrai serveur, qui refuse plus de 64 tickets par requête.
    const tailles: number[] = [];
    const ack = api.api.ack;
    vi.spyOn(api.api, "ack").mockImplementation((auth, ids) => {
      tailles.push(ids.length);
      return ack(auth, ids);
    });
    await store.signup("Pileuse", "renard");
    const etat = () => store.useGame.getState();
    const pile = etat().player!.pending;
    expect(pile).toHaveLength(MAX_PENDING);
    // La pile est pleine : le comptoir le dit avant même de demander, avec son nombre.
    expect(store.ticketBlocker("tirelire", 1)).toBe("La pile de Piou est pleine : 500 tickets. Gratte d'abord.");
    const gains = pile.reduce((somme, t) => somme + t.gain, 0);
    const depart = etat().player!.balance;
    expect(depart).toBe(10);
    // Une rafale : chaque ticket gratté rejoint la liste ; un paquet plein part tout de suite.
    for (const t of pile) store.markRevealed(t.id, 0);
    expect(store.displayBalance(etat())).toBe(depart + gains);
    await store.flushAck();
    expect(etat().player!.pending).toHaveLength(0);
    expect(etat().player!.balance).toBe(depart + gains);
    expect(etat().revealed).toEqual([]);
    expect(Math.max(...tailles)).toBeLessThanOrEqual(60);
    expect(tailles.reduce((a, b) => a + b, 0)).toBe(MAX_PENDING);
    // La pile vidée, le comptoir rouvre.
    expect(store.ticketBlocker("tirelire", 1)).toBeNull();
  }, 20_000);
});

describe("le comptoir, quand la pile n'a plus la place", () => {
  it("pleine, il dit son nombre ; presque pleine, ce qui y tient encore", async () => {
    const pile = (n: number) => Array.from({ length: n }, (_, i) => ticket(i));
    let m = await magasin(joueur(pile(MAX_PENDING), { balance: 1_000 }));
    expect(m.ticketBlocker("tirelire", 1)).toBe("La pile de Piou est pleine : 500 tickets. Gratte d'abord.");
    m = await magasin(joueur(pile(495), { balance: 1_000 }));
    expect(m.ticketBlocker("tirelire", 5)).toBeNull();
    expect(m.ticketBlocker("tirelire", 10)).toBe("Piou n'a plus de place que pour 5 tickets.");
    m = await magasin(joueur(pile(499), { balance: 1_000 }));
    expect(m.ticketBlocker("tirelire", 1)).toBeNull();
    expect(m.ticketBlocker("tirelire", 5)).toBe("Piou n'a plus de place que pour 1 ticket.");
    // Les tickets déjà grattés ne comptent plus : ils sont payés à la prochaine requête.
    m = await magasin(joueur(pile(MAX_PENDING), { balance: 1_000 }), pile(10).map((t) => t.id));
    expect(m.ticketBlocker("tirelire", 10)).toBeNull();
  });
});
