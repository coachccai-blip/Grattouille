// La Table des Maîtres (le joueur contre quatre hôtes tirés au sort, en tournoi, avec des
// montants astronomiques) et les compteurs du poker (`pokerStats`).
//
// D'abord le moteur, pur : la tablée, le barème de la blinde, le tournoi (pas de recave,
// élimination, fins de partie et leurs versements), les comptes de contrôle, les compteurs.
// Puis le serveur, avec le stockage en mémoire : les refus, une table jouée jusqu'au bout
// dans les deux sens, la victoire comptée une seule fois même si la requête est rejouée ou
// coupée, les compteurs versés une seule fois, et une table enregistrée avant la mise à jour.

import { describe, expect, it } from "vitest";
import { handle, type Deps } from "../server/app";
import { MemoryStorage, type Storage } from "../server/storage";
import { PLACES } from "../shared/places";
import {
  ACCUSE_MS, BOT_PERSONAS, BOT_STACK_CAVES, DECK, HOSTS, IDLE_TABLE_MS, MASTERS_BLIND, MASTERS_BLINDS, MASTERS_BUYIN,
  MASTERS_LEVEL_HANDS, MASTERS_SEATS, MAX_TABLE_CHIPS, RESERVE_MS, RESULT_MS,
  PokerError, act, advance, blindAt, botAccuse, botBet, botCheat, challengeBlind, chipsOnTable, createTable,
  deposit, isOut, isTournament, leave, mastersBlind, mastersRise, nextEventAt, nextRise, pickMasters, playerInHand, rebuyRange,
  seatIndexOf, seatsAfter, settled, sit, splitPot, viewFor, viewOfSeat,
  type Card, type GameAction, type PokerAction, type PokerLobbyResponse, type PokerTableResponse, type Random32,
  type TableState, type TableView,
} from "../shared/poker";
import type { PlayerState, PokerStats } from "../shared/types";

const T0 = Date.UTC(2026, 10, 27, 20, 0, 0);
/** Un billion : mille milliards. La blinde de base en vaut dix, la cave trois cents. */
const BN = 1_000_000_000_000;
/** La blinde de base, pour écrire les tapis en blindes. */
const U = MASTERS_BLIND;
/** Tout l'argent d'une Table des Maîtres : cinq caves. */
const ALL = MASTERS_SEATS * MASTERS_BUYIN;

/** Un hasard reproductible (mulberry32). */
function rngOf(seed = 1): Random32 {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return (x ^ (x >>> 14)) >>> 0;
  };
}

/** Un hasard qui rend toujours la même valeur : pour forcer une décision. */
const always = (value: number): Random32 => () => value >>> 0;
const hand = (text: string): Card[] => text.split(" ");
const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Le code d'un refus du moteur. */
function refusal(work: () => unknown): string {
  try {
    work();
  } catch (error) {
    if (error instanceof PokerError) return error.code;
    throw error;
  }
  return "accepté";
}

/** Les comptes d'une table tombent juste. */
function audited(t: TableState): void {
  expect(chipsOnTable(t)).toBe(t.audit.in - t.audit.out + t.audit.bank);
}

const stacksOf = (t: TableState) => t.seats.map((s) => (s ? s.stack : null));

const FOUR = ["gaspard", "ondine", "hector", "baron"] as const;

/** Une Table des Maîtres : le joueur au siège 0, sa cave posée. La première main est donnée. */
function masters(rng: Random32, hosts: readonly string[] = FOUR): TableState {
  let t = createTable({
    code: "ABCDE", kind: "maitres", place: null, blind: MASTERS_BLIND, maxBuyIn: MASTERS_BUYIN, seats: MASTERS_SEATS,
    bots: hosts, difficulty: "difficile",
  }, T0);
  t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rng);
  return deposit(t, "s_0", 1, MASTERS_BUYIN, T0, rng);
}

interface Between {
  /** Les mains déjà jouées. */
  played: number;
  /** Les tapis, en euros, dans l'ordre des sièges (le joueur d'abord). */
  stacks: number[];
  /** Le pot resté sur la table. */
  carry?: number;
  /** Le siège du dernier donneur. */
  dealer?: number;
  /** L'heure de la main suivante (par défaut : tout de suite). */
  nextAt?: number;
}

/** Cas d'école : la même table arrêtée entre deux mains, pendant le dénouement de la dernière. */
function mastersAt(rng: Random32, at: Between): TableState {
  const s = copy(masters(rng));
  s.hand = null;
  s.phase = "denouement";
  s.nextAt = at.nextAt ?? T0;
  s.handNo = at.played;
  s.carry = at.carry ?? 0;
  if (at.dealer !== undefined) s.dealer = at.dealer;
  at.stacks.forEach((stack, i) => { s.seats[i]!.stack = stack; });
  // Ce que la table porte de plus que la cave du joueur vient des hôtes.
  s.audit.bank = chipsOnTable(s) - MASTERS_BUYIN;
  audited(s);
  return s;
}

/** Les hôtes ont choisi (franc jeu) et ne diront rien : on fait passer leurs étapes à la main. */
function hostsSilent(t: TableState): TableState {
  const s = copy(t);
  for (const p of s.hand!.players) {
    if (s.seats[p.seat]!.bot === null) continue;
    p.chosen = true;
    p.spoke = s.phase === "abattage";
    p.actAt = null;
  }
  return s;
}

interface Showdown {
  /** Les mains qu'on donne, par siège. */
  cards: Record<number, string>;
  /** Les sièges qui poussent leur tapis ; les autres se couchent. */
  push: number[];
  /** Les sièges qui ont triché (une carte glissée à la première place). */
  cheats?: number[];
  /** Qui accuse qui, parmi les hôtes. */
  accuse?: Record<number, number>;
}

/**
 * Cas d'école : de la triche à l'abattage d'un coup. Les sièges de `push` sont à tapis (la
 * mise que personne ne peut suivre est déjà rendue), les autres sont couchés, et les hôtes
 * ont parlé. Il ne reste qu'au joueur à parler, s'il est dans le coup.
 */
function toShowdown(t: TableState, plan: Showdown, now = T0): TableState {
  const s = copy(t);
  const h = s.hand!;
  // Ce que chacun peut jouer au plus : le deuxième plus gros tapis parmi ceux qui poussent.
  const totals = plan.push.map((seat) => h.players.find((p) => p.seat === seat)!.committed + s.seats[seat]!.stack).sort((a, b) => b - a);
  const cap = totals[1] ?? totals[0]!;
  for (const p of h.players) {
    const seat = s.seats[p.seat]!;
    if (plan.cards[p.seat]) p.cards = hand(plan.cards[p.seat]!);
    p.chosen = true;
    p.actAt = null;
    if (!plan.push.includes(p.seat)) {
      p.folded = true;
      continue;
    }
    const added = Math.min(seat.stack, cap - p.committed);
    seat.stack -= added;
    p.committed += added;
    h.pot += added;
    p.allIn = seat.stack === 0;
    if (plan.cheats?.includes(p.seat)) p.swap = { index: 0, from: "2c" };
    if (seat.bot !== null) {
      p.spoke = true;
      p.accuse = plan.accuse?.[p.seat] ?? null;
    }
  }
  s.phase = "abattage";
  s.step += 1;
  h.turn = null;
  h.pending = [];
  h.deadline = now + ACCUSE_MS;
  audited(s);
  return s;
}

/** Ce que ferait un robot difficile assis à la place du joueur, d'après sa seule vue. */
function botMove(view: TableView, rng: Random32): GameAction | null {
  const o = view.options;
  if (o.cheat) {
    const swap = botCheat(view, "difficile", rng);
    return swap ? { type: "tricher", index: swap.index, card: swap.card } : { type: "franc-jeu" };
  }
  if (o.fold) return botBet(view, "difficile", rng);
  if (o.accuse.length > 0) {
    const target = botAccuse(view, "difficile", rng);
    return target !== null && o.accuse.includes(target) ? { type: "accuser", seat: target } : { type: "rien" };
  }
  return o.next ? { type: "suite" } : null;
}

interface Played {
  /** La table fermée. */
  table: TableState;
  /** Son dernier état avant la fermeture. */
  before: TableState;
}

/**
 * Une Table des Maîtres jouée jusqu'au bout, le joueur tenu par un robot difficile.
 * `watch` voit chaque état de la table, fermeture comprise.
 */
function playMasters(seed: number, watch?: (t: TableState, now: number) => void): Played {
  const rng = rngOf(seed);
  let now = T0;
  let t = masters(rng, pickMasters(rng));
  let before = t;
  watch?.(t, now);
  for (let guard = 0; guard < 100_000 && t.phase !== "fermee"; guard++) {
    const move = botMove(viewFor(t, "p_a", now), rng);
    before = t;
    if (move) {
      // Le joueur se décide en une seconde.
      now += 1_000;
      t = act(t, "p_a", move, now, rng);
    } else {
      now = Math.max(now, nextEventAt(t)!);
      t = advance(t, now, rng);
    }
    watch?.(t, now);
  }
  expect(t.phase).toBe("fermee");
  return { table: t, before };
}

// ---------------------------------------------------------------------------

describe("la tablée des Maîtres", () => {
  it("quatre hôtes distincts, tirés au sort sans remise parmi les huit", () => {
    expect([...HOSTS]).toEqual(["gaspard", "ondine", "hector", "baron", "auguste", "balthazar", "taupin", "selene"]);
    expect([...HOSTS]).toEqual(PLACES.map((place) => place.host));
    const rng = rngOf(11);
    const seen = new Map<string, number>();
    const tables = new Set<string>();
    const orders = new Set<string>();
    for (let i = 0; i < 2_000; i++) {
      const picked = pickMasters(rng);
      expect(picked).toHaveLength(MASTERS_SEATS - 1);
      expect(new Set(picked).size).toBe(4);
      // Des hôtes, jamais un vendeur.
      expect(picked.every((id) => HOSTS.includes(id) && BOT_PERSONAS.includes(id))).toBe(true);
      for (const id of picked) seen.set(id, (seen.get(id) ?? 0) + 1);
      tables.add([...picked].sort().join(" "));
      orders.add(picked.join(" "));
    }
    // Chaque hôte est de la partie une fois sur deux.
    expect([...seen.keys()].sort()).toEqual([...HOSTS].sort());
    for (const count of seen.values()) {
      expect(count).toBeGreaterThan(900);
      expect(count).toBeLessThan(1_100);
    }
    // Les 70 tablées possibles sortent toutes, et dans tous les ordres.
    expect(tables.size).toBe(70);
    expect(orders.size).toBeGreaterThan(1_000);
  });

  it("le tirage change d'une table à l'autre, et le même hasard redonne la même tablée", () => {
    expect(pickMasters(rngOf(5))).toEqual(pickMasters(rngOf(5)));
    const rng = rngOf(6);
    const draws = Array.from({ length: 12 }, () => pickMasters(rng).join(" "));
    expect(new Set(draws).size).toBeGreaterThan(9);
    // Un hasard figé donne toujours la même chose : c'est bien lui qui décide.
    expect(pickMasters(always(0))).toEqual(["gaspard", "ondine", "hector", "baron"]);
    // Toujours 5 : le sixième des huit, le sixième des sept qui restent, le sixième des six, le premier des cinq.
    expect(pickMasters(always(5))).toEqual(["balthazar", "taupin", "selene", "gaspard"]);
  });

  it("la table : cinq sièges, 300 Bn€ chacun, et la partie part dès que la cave est posée", () => {
    expect([MASTERS_SEATS, MASTERS_BLIND, MASTERS_BLINDS, MASTERS_BUYIN]).toEqual([5, 10 * BN, 30, 300 * BN]);
    const rng = rngOf(12);
    const hosts = pickMasters(rng);
    let t = createTable({
      code: "ABCDE", kind: "maitres", place: null, blind: MASTERS_BLIND, maxBuyIn: MASTERS_BUYIN, seats: MASTERS_SEATS,
      bots: hosts, difficulty: "difficile",
    }, T0);
    expect(t).toMatchObject({
      kind: "maitres", place: null, blind: MASTERS_BLIND, minBuyIn: MASTERS_BUYIN, maxBuyIn: MASTERS_BUYIN,
      difficulty: "difficile", started: true, phase: "attente", handNo: 0,
    });
    expect(isTournament(t)).toBe(true);
    // Le premier siège attend le joueur ; les hôtes ont déjà leur cave.
    expect(t.seats.map((s) => (s ? [s.bot, s.stack] : null))).toEqual([null, ...hosts.map((id) => [id, MASTERS_BUYIN])]);
    expect(t.audit).toEqual({ in: 0, out: 0, bank: 4 * MASTERS_BUYIN });
    t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rng);
    expect([t.phase, t.handNo]).toEqual(["attente", 0]);
    // Complète : personne d'autre ne s'y assoit.
    expect(refusal(() => sit(t, { playerId: "p_b", sid: "s_1", pseudo: "Bob", species: "chat", look: null }, T0, rng))).toBe("TABLE_FULL");
    t = deposit(t, "s_0", 1, MASTERS_BUYIN, T0, rng);
    // Pas besoin de lancer : la première main est donnée, chacun a payé la blinde.
    expect([t.phase, t.handNo, t.hand!.blind, t.hand!.pot]).toEqual(["triche", 1, MASTERS_BLIND, 5 * MASTERS_BLIND]);
    expect(t.hand!.players.map((p) => p.seat).sort()).toEqual([0, 1, 2, 3, 4]);
    expect(stacksOf(t)).toEqual(Array.from({ length: 5 }, () => MASTERS_BUYIN - MASTERS_BLIND));
    expect(t.audit).toEqual({ in: MASTERS_BUYIN, out: 0, bank: 4 * MASTERS_BUYIN });
    expect(refusal(() => act(t, "p_a", { type: "lancer" }, T0, rng))).toBe("ACTION_IMPOSSIBLE");

    const view = viewFor(t, "p_a", T0);
    expect(view).toMatchObject({
      kind: "maitres", place: null, difficulty: "difficile", minBuyIn: MASTERS_BUYIN, maxBuyIn: MASTERS_BUYIN,
      blind: MASTERS_BLIND, rise: { hand: 17, blind: 2 * MASTERS_BLIND }, started: true, you: 0, handNo: 1,
    });
    expect(view.options).toMatchObject({ start: false, rebuy: null, cheat: true });
    expect(view.seats.map((s) => s!.bot)).toEqual([null, ...hosts]);
    // Personne n'est éliminé : le champ `out` n'existe sur aucun siège.
    expect(view.seats.every((s) => !("out" in s!))).toBe(true);
  });

  it("les montants astronomiques restent des entiers exacts, loin des garde-fous", () => {
    // Cinq caves : 1 500 Bn€, soit 1,5 × 10^15, sous le plus grand entier exact (9 × 10^15).
    expect(ALL).toBe(1_500_000_000_000_000);
    expect(Number.isSafeInteger(ALL)).toBe(true);
    // La fermeture « banque » (trop d'argent pour compter juste) est hors d'atteinte : personne ne recave.
    expect(ALL).toBeLessThan(MAX_TABLE_CHIPS);
    expect(chipsOnTable(masters(rngOf(13)))).toBe(ALL);
    // Un pot de cette taille se partage à l'euro près, quel que soit le nombre de gagnants.
    for (const amount of [ALL, ALL - 1, ALL - 7, 299_999_999_999_999, 1_234_567_890_123_457]) {
      for (let n = 1; n <= 5; n++) {
        const shares = splitPot(amount, Array.from({ length: n }, (_, i) => i), [0, 1, 2, 3, 4]).map((s) => s.amount);
        expect(shares.every(Number.isSafeInteger)).toBe(true);
        expect(shares.reduce((sum, x) => sum + BigInt(x), 0n)).toBe(BigInt(amount));
        expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ---------------------------------------------------------------------------

describe("le barème de la blinde", () => {
  it("elle double de palier en palier : seize mains, puis quatre par quatre, puis deux par deux", () => {
    expect([...MASTERS_LEVEL_HANDS]).toEqual([16, 4, 4, 4, 2]);
    const span = (times: number, hands: number): number[] => Array.from({ length: hands }, () => times);
    const expected = [
      ...span(1, 16), ...span(2, 4), ...span(4, 4), ...span(8, 4),
      ...span(16, 2), ...span(32, 2), ...span(64, 2), ...span(128, 2), ...span(256, 24),
    ];
    expect(Array.from({ length: 60 }, (_, i) => mastersBlind(1, i + 1))).toEqual(expected);
    // Elle cesse de monter dès qu'elle dépasse tout l'argent en jeu : cinq caves de 30 blindes.
    for (const main of [37, 60, 100, 1_000_000]) expect(mastersBlind(1, main)).toBe(256);
    expect([mastersBlind(1, 0), mastersBlind(1, -3)]).toEqual([1, 1]);
    // La prochaine hausse : à quelle main, et combien.
    expect([1, 16, 17, 20, 21, 24, 25, 28, 29, 30, 31, 34, 35, 36].map((main) => mastersRise(1, main))).toEqual([
      { hand: 17, blind: 2 }, { hand: 17, blind: 2 }, { hand: 21, blind: 4 }, { hand: 21, blind: 4 },
      { hand: 25, blind: 8 }, { hand: 25, blind: 8 }, { hand: 29, blind: 16 }, { hand: 29, blind: 16 },
      { hand: 31, blind: 32 }, { hand: 31, blind: 32 }, { hand: 33, blind: 64 }, { hand: 35, blind: 128 },
      { hand: 37, blind: 256 }, { hand: 37, blind: 256 },
    ]);
    for (const main of [37, 38, 500]) expect(mastersRise(1, main)).toBeNull();
  });

  it("en euros : de 10 Bn€ à 2 560 Bn€, toujours des entiers exacts", () => {
    const real = Array.from({ length: 60 }, (_, i) => mastersBlind(MASTERS_BLIND, i + 1));
    expect(real.every(Number.isSafeInteger)).toBe(true);
    expect([1, 17, 21, 25, 29, 31, 33, 35, 37].map((main) => real[main - 1]! / BN)).toEqual([10, 20, 40, 80, 160, 320, 640, 1_280, 2_560]);
    // À la 36e main elle tient encore dans la table ; à la 37e elle la dépasse, et s'arrête là.
    expect(real[35]!).toBeLessThan(ALL);
    expect(real[36]!).toBeGreaterThan(ALL);
    expect(mastersRise(MASTERS_BLIND, 36)).toEqual({ hand: 37, blind: 2_560 * BN });
    // Le barème d'un défi : trois mains à la blinde de base, puis elle double toutes les deux mains.
    expect(Array.from({ length: 15 }, (_, i) => challengeBlind(1, i + 1))).toEqual([1, 1, 1, 2, 2, 4, 4, 8, 8, 16, 16, 32, 32, 64, 64]);
  });

  it("la vue donne la blinde en vigueur et la main où elle montera, comme dans un défi", () => {
    const rng = rngOf(21);
    const even = [30 * U, 30 * U, 30 * U, 30 * U, 30 * U];
    // Entre la seizième et la dix-septième main, la vue annonce déjà la blinde de la main qui vient.
    const between = mastersAt(rng, { played: 16, stacks: even, dealer: 3 });
    expect([blindAt(between, 16), blindAt(between, 17)]).toEqual([U, 2 * U]);
    expect([viewFor(between, "p_a", T0).blind, viewFor(between, "p_a", T0).rise]).toEqual([2 * U, { hand: 21, blind: 4 * U }]);
    let t = advance(between, T0, rng);
    expect([t.handNo, t.hand!.blind, t.hand!.pot, stacksOf(t)]).toEqual([17, 2 * U, 10 * U, even.map((x) => x - 2 * U)]);
    expect(t.log.filter((e) => e.hand === 17 && e.kind === "blinde").map((e) => e.amount)).toEqual([2 * U, 2 * U, 2 * U, 2 * U, 2 * U]);
    // La blinde de base de la table, elle, ne bouge pas.
    expect(t.blind).toBe(U);
    const view = viewFor(t, "p_a", T0);
    expect([view.blind, view.rise, view.seats.map((s) => s!.committed)]).toEqual([2 * U, { hand: 21, blind: 4 * U }, [2 * U, 2 * U, 2 * U, 2 * U, 2 * U]]);
    // Le donneur est au siège 4 : le joueur parle le premier. La mise minimale suit la blinde en
    // vigueur ; la plus grosse, sans limite, est tout son tapis.
    t = act(hostsSilent(t), "p_a", { type: "franc-jeu" }, T0, rng);
    expect([t.phase, t.dealer, t.hand!.turn]).toEqual(["encheres", 4, 0]);
    expect(viewFor(t, "p_a", T0).options).toMatchObject({ check: true, bet: { min: 2 * U, max: 28 * U }, allIn: true });
    expect(refusal(() => act(t, "p_a", { type: "miser", amount: U }, T0, rng))).toBe("ACTION_IMPOSSIBLE");
    // Plus loin : 160 Bn€ à la 29e main ; à la 37e, elle ne monte plus et dépasse tous les tapis.
    const late = viewFor(advance(mastersAt(rng, { played: 28, stacks: [60 * U, 90 * U, 0, 0, 0] }), T0, rng), "p_a", T0);
    expect([late.handNo, late.blind, late.rise, late.pot]).toEqual([29, 16 * U, { hand: 31, blind: 32 * U }, 32 * U]);
    const last = viewFor(advance(mastersAt(rng, { played: 36, stacks: [60 * U, 90 * U, 0, 0, 0] }), T0, rng), "p_a", T0);
    expect([last.handNo, last.blind, last.rise, last.pot]).toEqual([37, 256 * U, null, 150 * U]);
    expect(last.seats.slice(0, 2).map((s) => [s!.stack, s!.committed, s!.allIn])).toEqual([[0, 60 * U, true], [0, 90 * U, true]]);
  });
});

// ---------------------------------------------------------------------------

describe("un tournoi : la blinde à tapis, l'élimination, pas de recave", () => {
  it("qui n'a plus de quoi payer la blinde pose ce qui lui reste et joue la main à tapis", () => {
    const rng = rngOf(31);
    // 21e main, blinde de 40 Bn€ : il reste 30 Bn€ au joueur, 20 Bn€ à Hector, un euro à Baron.
    const t = advance(mastersAt(rng, { played: 20, stacks: [3 * U, 50 * U, 95 * U - 1, 2 * U, 1] }), T0, rng);
    expect([t.handNo, t.phase, t.hand!.blind]).toEqual([21, "triche", 4 * U]);
    expect(t.hand!.pot).toBe(3 * U + 4 * U + 4 * U + 2 * U + 1);
    expect(stacksOf(t)).toEqual([0, 46 * U, 91 * U - 1, 0, 0]);
    expect(chipsOnTable(t)).toBe(ALL);
    // Un euro suffit pour être servi : personne n'est écarté d'office.
    expect(t.hand!.players.map((p) => p.seat).sort()).toEqual([0, 1, 2, 3, 4]);
    const posted = t.log.filter((e) => e.hand === 21 && e.kind === "blinde").map((e) => [e.seat, e.amount, e.allIn ?? false]).sort();
    expect(posted).toEqual([[0, 3 * U, true], [1, 4 * U, false], [2, 4 * U, false], [3, 2 * U, true], [4, 1, true]]);
    const view = viewFor(t, "p_a", T0);
    expect(view.seats.map((s) => [s!.committed, s!.allIn])).toEqual([[3 * U, true], [4 * U, false], [4 * U, false], [2 * U, true], [1, true]]);
    // À tapis d'entrée, il joue quand même sa main : il triche ou non, il accusera ou non.
    expect(view.options.cheat).toBe(true);
    expect(view.seats.every((s) => !("out" in s!))).toBe(true);
    audited(t);
  });

  it("un seul joueur a encore des jetons : pas d'enchères, ce qu'il a posé de trop lui revient", () => {
    const rng = rngOf(32);
    // 25e main, blinde de 80 Bn€. Seul Gaspard (siège 1) peut la payer en entier.
    let t = advance(mastersAt(rng, { played: 24, stacks: [5 * U, 135 * U, 4 * U, 3 * U, 3 * U] }), T0, rng);
    expect([t.hand!.blind, t.hand!.pot, stacksOf(t)]).toEqual([8 * U, 23 * U, [0, 127 * U, 0, 0, 0]]);
    t = act(hostsSilent(t), "p_a", { type: "franc-jeu" }, T0, rng);
    // Trois des huit blindes de Gaspard lui reviennent : le plus gros tapis en face n'en a suivi que cinq.
    expect([t.phase, t.hand!.pot, stacksOf(t)]).toEqual(["abattage", 20 * U, [0, 130 * U, 0, 0, 0]]);
    expect(t.log.find((e) => e.hand === 25 && e.kind === "rendu")).toMatchObject({ seat: 1, amount: 3 * U });
    expect(t.log.some((e) => e.hand === 25 && ["parole", "mise", "suit", "relance", "couche"].includes(e.kind))).toBe(false);
    audited(t);
    // Les pots annexes : chacun ne prétend qu'à ce qu'il a pu suivre.
    const s = hostsSilent(t);
    const cards: Record<number, string> = { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c", 2: "Qs Qd 8c 6h 2s", 3: "Jh Jd 9c 6s 3d", 4: "Th Td 9h 5s 4d" };
    for (const p of s.hand!.players) p.cards = hand(cards[p.seat]!);
    const done = act(s, "p_a", { type: "rien" }, T0, rng);
    // 3 × 5 = 15 pour tous, 1 × 3 entre les trois qui ont suivi 4, 1 × 2 entre les deux qui ont suivi 5.
    expect(done.result!.pots).toEqual([
      { amount: 15 * U, winners: [{ seat: 0, amount: 15 * U }], carried: false },
      { amount: 3 * U, winners: [{ seat: 0, amount: 3 * U }], carried: false },
      { amount: 2 * U, winners: [{ seat: 0, amount: 2 * U }], carried: false },
    ]);
    expect(stacksOf(done)).toEqual([20 * U, 130 * U, 0, 0, 0]);
    audited(done);
  });

  it("un hôte à zéro est éliminé : son siège reste, vide, et ne reçoit plus de cartes", () => {
    const rng = rngOf(33);
    // Première main : le joueur et Ondine (siège 2) poussent leur tapis, les autres se couchent.
    const start = masters(rng);
    const shown = toShowdown(start, { cards: { 0: "As Ad 7c 5h 2d", 2: "Kc Kd 9s 4h 3c" }, push: [0, 2] });
    // À tapis, on n'a plus rien devant soi mais on joue encore : pas éliminé.
    expect(viewFor(shown, "p_a", T0).seats[2]).toMatchObject({ stack: 0, inHand: true, allIn: true });
    expect("out" in viewFor(shown, "p_a", T0).seats[2]!).toBe(false);
    expect(isOut(shown, 2)).toBe(false);
    let t = act(shown, "p_a", { type: "rien" }, T0, rng);
    expect([t.phase, stacksOf(t)]).toEqual(["denouement", [63 * U, 29 * U, 0, 29 * U, 29 * U]]);
    // Dès le dénouement, le siège d'Ondine est marqué ; lui seul.
    const view = viewFor(t, "p_a", T0);
    expect(view.seats[2]).toMatchObject({ bot: "ondine", stack: 0, inHand: false, allIn: false, out: true });
    expect(view.seats.map((s) => s!.out ?? false)).toEqual([false, false, true, false, false]);
    expect(view.seats.filter((s) => "out" in s!)).toHaveLength(1);
    expect([isOut(t, 0), isOut(t, 2)]).toEqual([false, true]);
    // La partie continue à quatre. Ondine n'a pas recavé : ni jetons, ni cartes, ni entrée au journal.
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.phase, t.handNo, t.hand!.players.map((p) => p.seat).sort()]).toEqual(["triche", 2, [0, 1, 3, 4]]);
    expect(playerInHand(t, 2)).toBeNull();
    expect(t.seats[2]).toMatchObject({ bot: "ondine", stack: 0, reserve: 0 });
    expect(t.log.some((e) => e.kind === "cave" && e.seat === 2)).toBe(false);
    expect(t.log.some((e) => e.kind === "depart")).toBe(false);
    expect(viewFor(t, "p_a", T0 + RESULT_MS).seats[2]).toMatchObject({ stack: 0, inHand: false, committed: 0, cards: null, out: true });
    expect(t.hand!.pot).toBe(4 * U);
    // Rien n'est apparu ni disparu : toujours cinq caves, et l'argent des hôtes n'a pas bougé.
    expect(chipsOnTable(t)).toBe(ALL);
    expect(t.audit).toEqual({ in: MASTERS_BUYIN, out: 0, bank: 4 * MASTERS_BUYIN });
    // On ne peut pas l'accuser, et la vue des autres dit la même chose.
    expect(viewOfSeat(t, 1, T0 + RESULT_MS).seats[2]!.out).toBe(true);
  });

  it("le bouton et la parole sautent un siège éliminé", () => {
    const rng = rngOf(34);
    const stacks = [70 * U, 30 * U, 0, 30 * U, 20 * U];
    // Le donneur était au siège 0 : le bouton passe au siège 1, la parole part du siège 3.
    let t = advance(mastersAt(rng, { played: 1, stacks, dealer: 0 }), T0, rng);
    expect([t.handNo, t.dealer, t.hand!.players.map((p) => p.seat)]).toEqual([2, 1, [3, 4, 0, 1]]);
    // Il était au siège 1 : le siège 2, éliminé, ne le reçoit pas. Le bouton va au siège 3.
    t = advance(mastersAt(rng, { played: 2, stacks, dealer: 1 }), T0, rng);
    expect([t.handNo, t.dealer, t.hand!.players.map((p) => p.seat)]).toEqual([3, 3, [4, 0, 1, 3]]);
    expect(viewFor(t, "p_a", T0).dealer).toBe(3);
    // À deux, celui qui n'a pas le bouton parle le premier.
    t = advance(mastersAt(rng, { played: 40, stacks: [80 * U, 0, 0, 70 * U, 0], dealer: 0 }), T0, rng);
    expect([t.dealer, t.hand!.players.map((p) => p.seat)]).toEqual([3, [0, 3]]);
    t = advance(mastersAt(rng, { played: 40, stacks: [80 * U, 0, 0, 70 * U, 0], dealer: 3 }), T0, rng);
    expect([t.dealer, t.hand!.players.map((p) => p.seat)]).toEqual([0, [3, 0]]);
  });

  it("à tapis et battu, mais dédommagé d'une fausse accusation : il a de nouveau des jetons, il reste", () => {
    const rng = rngOf(35);
    // Le joueur et Ondine à tapis ; Ondine, battue, est accusée à tort par Hector, resté dans le coup.
    const s = toShowdown(masters(rng), {
      cards: { 0: "As Ad 7c 5h 2d", 2: "Kc Kd 9s 4h 3c", 3: "Qs Qd 8c 6h 2s" }, push: [0, 2, 3], accuse: { 3: 2 },
    });
    // Cas d'école : Hector garde 50 Bn€ devant lui, de quoi payer une part de ce qu'il devra.
    s.seats[3]!.stack += 5 * U;
    s.hand!.players.find((p) => p.seat === 3)!.allIn = false;
    s.audit.bank += 5 * U;
    const t = act(s, "p_a", { type: "rien" }, T0, rng);
    expect(t.result!.accusations).toEqual([{ from: 3, to: 2, right: false, paid: 5 * U }]);
    // Ondine a perdu le pot, mais Hector lui doit sa mise, dans la limite de ce qu'il a.
    expect(stacksOf(t)).toEqual([92 * U, 29 * U, 5 * U, 0, 29 * U]);
    expect(viewFor(t, "p_a", T0).seats.map((seat) => seat!.out ?? false)).toEqual([false, false, false, true, false]);
    audited(t);
  });

  it("personne ne recave, et rien ne plafonne le tapis d'un hôte", () => {
    const rng = rngOf(36);
    let t = masters(rng);
    expect(rebuyRange(t, 0)).toBeNull();
    expect(viewFor(t, "p_a", T0).options.rebuy).toBeNull();
    // Entre deux mains non plus, même presque à sec.
    const dry = mastersAt(rng, { played: 4, stacks: [1 * U, 100 * U, 29 * U, 10 * U, 10 * U], nextAt: T0 + RESULT_MS });
    expect(rebuyRange(dry, 0)).toBeNull();
    expect(viewFor(dry, "p_a", T0).options).toMatchObject({ rebuy: null, next: true });
    // Gaspard a plus de trois caves : à une table de la maison, le surplus serait mis de côté. Pas ici.
    expect(100 * U).toBeGreaterThan(BOT_STACK_CAVES * MASTERS_BUYIN);
    t = advance(dry, T0 + RESULT_MS, rng);
    expect([t.handNo, stacksOf(t)]).toEqual([5, [0, 99 * U, 28 * U, 9 * U, 9 * U]]);
    expect(t.audit).toEqual(dry.audit);
    expect(t.log.some((e) => e.kind === "cave" && e.hand === 5)).toBe(false);
    audited(t);
    // À une table de la maison, en revanche, rien n'a changé : un robot à sec recave.
    expect(isTournament({ kind: "maison" })).toBe(false);
    expect(isTournament({ kind: "privee" })).toBe(false);
    expect(isTournament({ kind: "defi" })).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("comment finit la table", () => {
  const SEAT = { sid: "s_0", playerId: "p_a", seat: 0, received: MASTERS_BUYIN };

  it("le joueur est le dernier à avoir des jetons : gagnée, il repart avec tout l'argent de la table", () => {
    const rng = rngOf(41);
    const won = mastersAt(rng, { played: 40, stacks: [150 * U, 0, 0, 0, 0], nextAt: T0 + RESULT_MS });
    // Pendant le dénouement de la dernière main, la table est encore là : les quatre hôtes sont éliminés.
    expect(viewFor(won, "p_a", T0).seats.map((s) => s!.out ?? false)).toEqual([false, true, true, true, true]);
    expect(viewFor(won, "p_a", T0).options.next).toBe(true);
    expect(advance(won, T0 + RESULT_MS - 1, rng)).toBe(won);
    const t = advance(won, T0 + RESULT_MS, rng);
    expect([t.phase, t.closed, t.seats, t.handNo]).toEqual(["fermee", "maitres", [null, null, null, null, null], 40]);
    expect(t.ended).toEqual([{ ...SEAT, payout: ALL, reason: "maitres-gagne", at: T0 + RESULT_MS }]);
    expect(t.departed).toEqual([{ playerId: "p_a", seat: 0, reason: "maitres-gagne", payout: ALL, at: T0 + RESULT_MS }]);
    // Une cave entrée, cinq sorties : les quatre autres venaient des hôtes.
    expect(t.audit).toEqual({ in: MASTERS_BUYIN, out: ALL, bank: 4 * MASTERS_BUYIN });
    expect(chipsOnTable(t)).toBe(0);
    audited(t);
    expect(viewFor(t, "p_a", T0 + RESULT_MS)).toMatchObject({ phase: "fermee", closed: "maitres", you: null });
    // « Main suivante » dénoue la table sans attendre.
    const asked = act(won, "p_a", { type: "suite" }, T0 + 1_000, rng);
    expect([asked.phase, asked.closed, asked.ended[0]!.reason, asked.ended[0]!.payout]).toEqual(["fermee", "maitres", "maitres-gagne", ALL]);
  });

  it("gagnée avec un pot resté au milieu : il est à lui aussi", () => {
    const rng = rngOf(42);
    // Les deux derniers hôtes se sont démasqués l'un l'autre à tapis : 50 blindes attendent sur la table.
    const t = advance(mastersAt(rng, { played: 30, stacks: [100 * U, 0, 0, 0, 0], carry: 50 * U }), T0, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "maitres"]);
    expect(t.ended).toEqual([{ ...SEAT, payout: ALL, reason: "maitres-gagne", at: T0 }]);
    expect(t.audit).toEqual({ in: MASTERS_BUYIN, out: ALL, bank: 4 * MASTERS_BUYIN });
    audited(t);
  });

  it("le tapis du joueur est à zéro : perdue, il repart sans rien", () => {
    const rng = rngOf(43);
    const lost = mastersAt(rng, { played: 9, stacks: [0, 60 * U, 40 * U, 30 * U, 20 * U], nextAt: T0 + RESULT_MS });
    // Son propre siège est marqué pendant le dénouement de sa dernière main.
    expect(viewFor(lost, "p_a", T0).seats.map((s) => s!.out ?? false)).toEqual([true, false, false, false, false]);
    const t = advance(lost, T0 + RESULT_MS, rng);
    expect([t.phase, t.closed, t.handNo]).toEqual(["fermee", "maitres", 9]);
    expect(t.ended).toEqual([{ ...SEAT, payout: 0, reason: "maitres-perdu", at: T0 + RESULT_MS }]);
    // Sa cave disparaît avec les hôtes.
    expect(t.audit).toEqual({ in: MASTERS_BUYIN, out: 0, bank: -MASTERS_BUYIN });
    expect(chipsOnTable(t)).toBe(0);
    audited(t);
  });

  it("perdue même si un pot est resté là, et même si plus personne n'a rien", () => {
    const rng = rngOf(44);
    // Démasqué à tapis avec un hôte : le pot reste, mais il n'appartient qu'à ceux qui ont encore des jetons.
    let t = advance(mastersAt(rng, { played: 9, stacks: [0, 60 * U, 40 * U, 0, 0], carry: 50 * U }), T0, rng);
    expect([t.closed, t.ended]).toEqual(["maitres", [{ ...SEAT, payout: 0, reason: "maitres-perdu", at: T0 }]]);
    audited(t);
    // Tout le monde à tapis, tout le monde démasqué : il n'y a pas de match nul à cette table.
    t = advance(mastersAt(rng, { played: 9, stacks: [0, 0, 0, 0, 0], carry: 150 * U }), T0, rng);
    expect([t.closed, t.ended]).toEqual(["maitres", [{ ...SEAT, payout: 0, reason: "maitres-perdu", at: T0 }]]);
    expect(t.audit).toEqual({ in: MASTERS_BUYIN, out: 0, bank: -MASTERS_BUYIN });
    audited(t);
  });

  it("tant que le joueur et un hôte ont des jetons, la partie continue, pot resté là compris", () => {
    const rng = rngOf(45);
    const t = advance(mastersAt(rng, { played: 9, stacks: [10 * U, 90 * U, 0, 0, 0], carry: 50 * U, dealer: 0 }), T0, rng);
    expect([t.phase, t.handNo, t.closed]).toEqual(["triche", 10, null]);
    expect(t.hand!.players.map((p) => p.seat)).toEqual([0, 1]);
    // Le pot resté là rejoint celui de la main, que seuls les deux derniers se disputent.
    expect([t.hand!.pot, t.carry, stacksOf(t)]).toEqual([52 * U, 0, [9 * U, 89 * U, 0, 0, 0]]);
    audited(t);
  });

  it("une dernière main jusqu'à la victoire : le dernier hôte tombe, la table ferme, tout est versé", () => {
    const rng = rngOf(46);
    // 53e main : la blinde (2 560 Bn€) dépasse les deux derniers tapis. Chacun pose tout ce qu'il a.
    let t = advance(mastersAt(rng, { played: 52, stacks: [80 * U, 0, 0, 70 * U, 0], dealer: 0 }), T0, rng);
    expect([t.hand!.blind, t.hand!.pot, stacksOf(t)]).toEqual([256 * U, 150 * U, [0, 0, 0, 0, 0]]);
    expect(viewFor(t, "p_a", T0).seats.map((seat) => [seat!.inHand, seat!.allIn, seat!.out ?? false])).toEqual([
      [true, true, false], [false, false, true], [false, false, true], [true, true, false], [false, false, true],
    ]);
    const s = hostsSilent(t);
    s.hand!.players.find((p) => p.seat === 0)!.cards = hand("As Ad 7c 5h 2d");
    s.hand!.players.find((p) => p.seat === 3)!.cards = hand("Kc Kd 9s 4h 3c");
    t = act(s, "p_a", { type: "franc-jeu" }, T0, rng);
    // Pas d'enchères : les dix blindes que Hector n'a pas pu suivre reviennent au joueur.
    expect([t.phase, t.hand!.pot, stacksOf(t)]).toEqual(["abattage", 140 * U, [10 * U, 0, 0, 0, 0]]);
    expect(t.log.find((e) => e.hand === 53 && e.kind === "rendu")).toMatchObject({ seat: 0, amount: 10 * U });
    audited(t);
    t = act(hostsSilent(t), "p_a", { type: "rien" }, T0, rng);
    expect([t.phase, stacksOf(t)]).toEqual(["denouement", [150 * U, 0, 0, 0, 0]]);
    expect(viewFor(t, "p_a", T0).seats.map((seat) => seat!.out ?? false)).toEqual([false, true, true, true, true]);
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.phase, t.closed, t.ended[0]!.reason, t.ended[0]!.payout]).toEqual(["fermee", "maitres", "maitres-gagne", ALL]);
    // Avec son tapis, les compteurs de sa séance : une main, un pot.
    expect(t.ended[0]!.stats).toEqual({ hands: 1, pots: 1, unmasked: 0, caught: 0 });
    audited(t);
  });

  it("quitter avant la fin : il reprend son tapis, sans victoire, et la table ferme", () => {
    const rng = rngOf(47);
    // Entre deux mains.
    const between = mastersAt(rng, { played: 9, stacks: [50 * U, 40 * U, 30 * U, 20 * U, 10 * U], nextAt: T0 + RESULT_MS });
    let t = leave(between, "p_a", T0, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "vide"]);
    expect(t.ended).toEqual([{ ...SEAT, payout: 50 * U, reason: "quitte", at: T0 }]);
    expect(t.audit).toEqual({ in: MASTERS_BUYIN, out: 50 * U, bank: 20 * U });
    audited(t);
    // En pleine main : ce qu'il a déjà misé reste au pot, comme ailleurs.
    const start = masters(rng);
    t = leave(start, "p_a", T0 + 2_000, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "vide"]);
    expect(t.ended).toEqual([{ ...SEAT, payout: MASTERS_BUYIN - MASTERS_BLIND, reason: "quitte", at: T0 + 2_000 }]);
    expect(chipsOnTable(t)).toBe(0);
    audited(t);
    // À tapis, quitter c'est tout laisser.
    const shown = toShowdown(start, { cards: { 0: "As Ad 7c 5h 2d", 2: "Kc Kd 9s 4h 3c" }, push: [0, 2] });
    t = leave(shown, "p_a", T0, rng);
    expect(t.ended).toEqual([{ ...SEAT, payout: 0, reason: "quitte", at: T0 }]);
    audited(t);
  });

  it("quitter entre deux mains avec un pot resté là : sa part, partagée entre ceux qui ont encore des jetons", () => {
    const rng = rngOf(48);
    // Deux hôtes éliminés, trente blindes au milieu : dix pour chacun des trois qui restent, pas six.
    const s = mastersAt(rng, { played: 9, stacks: [50 * U, 40 * U, 30 * U, 0, 0], carry: 30 * U, nextAt: T0 + RESULT_MS });
    const t = leave(s, "p_a", T0, rng);
    expect(t.ended).toEqual([{ ...SEAT, payout: 60 * U, reason: "quitte", at: T0 }]);
    // La part des hôtes disparaît avec eux.
    expect(t.audit).toEqual({ in: MASTERS_BUYIN, out: 60 * U, bank: 30 * U });
    audited(t);
  });

  it("partir pendant le dénouement de la dernière main ne change pas le résultat", () => {
    const rng = rngOf(49);
    // Il vient de ruiner le dernier hôte et quitte sans attendre : la victoire est acquise.
    const won = mastersAt(rng, { played: 40, stacks: [150 * U, 0, 0, 0, 0], nextAt: T0 + RESULT_MS });
    let t = leave(won, "p_a", T0 + 1_000, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "maitres"]);
    expect(t.ended).toEqual([{ ...SEAT, payout: ALL, reason: "maitres-gagne", at: T0 + 1_000 }]);
    audited(t);
    // Il vient de tout perdre et quitte : c'est perdu, pas quitté.
    const lost = mastersAt(rng, { played: 9, stacks: [0, 60 * U, 40 * U, 30 * U, 20 * U], nextAt: T0 + RESULT_MS });
    t = leave(lost, "p_a", T0 + 1_000, rng);
    expect([t.closed, t.ended]).toEqual(["maitres", [{ ...SEAT, payout: 0, reason: "maitres-perdu", at: T0 + 1_000 }]]);
    // Tant que rien n'est joué, partir reste partir.
    const open = mastersAt(rng, { played: 9, stacks: [140 * U, 10 * U, 0, 0, 0], nextAt: T0 + RESULT_MS });
    t = leave(open, "p_a", T0 + 1_000, rng);
    expect([t.closed, t.ended[0]!.reason, t.ended[0]!.payout]).toEqual(["vide", "quitte", 140 * U]);
  });

  it("le joueur ne répond plus : écarté avec son tapis après trois mains, sans victoire", () => {
    const rng = rngOf(50);
    const s = mastersAt(rng, { played: 9, stacks: [50 * U, 40 * U, 30 * U, 20 * U, 10 * U] });
    s.seats[0]!.absent = true;
    s.seats[0]!.idle = 3;
    let t = advance(s, T0, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "vide"]);
    expect(t.ended).toEqual([{ ...SEAT, payout: 50 * U, reason: "absent", at: T0 }]);
    audited(t);
    // Mais si la partie s'est jouée entre-temps, son résultat passe d'abord.
    const won = mastersAt(rng, { played: 9, stacks: [150 * U, 0, 0, 0, 0] });
    won.seats[0]!.absent = true;
    won.seats[0]!.idle = 3;
    t = advance(won, T0, rng);
    expect([t.closed, t.ended[0]!.reason, t.ended[0]!.payout]).toEqual(["maitres", "maitres-gagne", ALL]);
    const lost = mastersAt(rng, { played: 9, stacks: [0, 150 * U, 0, 0, 0] });
    lost.seats[0]!.absent = true;
    lost.seats[0]!.idle = 3;
    t = advance(lost, T0, rng);
    expect([t.closed, t.ended[0]!.reason, t.ended[0]!.payout]).toEqual(["maitres", "maitres-perdu", 0]);
  });

  it("le joueur ne répond plus, de bout en bout : absent, puis écarté, tout seul et sans requête", () => {
    const rng = rngOf(51);
    const start = masters(rng, pickMasters(rng));
    // Personne ne regarde la table pendant une heure : elle rattrape tout d'un coup.
    const t = advance(start, T0 + 3_600_000, rng);
    // Deux délais dépassés : absent. Trois mains entières plus tard, il est écarté avec son tapis.
    expect([t.phase, t.closed, t.ended.length, t.ended[0]!.reason]).toEqual(["fermee", "vide", 1, "absent"]);
    expect(t.handNo).toBeGreaterThanOrEqual(4);
    expect(t.handNo).toBeLessThanOrEqual(5);
    // Il n'a jamais misé : il n'a perdu que ses blindes, à 10 Bn€ la main.
    expect(t.ended[0]!.payout).toBeGreaterThanOrEqual(MASTERS_BUYIN - t.handNo * MASTERS_BLIND);
    expect(t.ended[0]!.payout).toBeLessThan(2 * MASTERS_BUYIN);
    // Les mains jouées sans lui comptent : il y a reçu des cartes, et elles sont allées au bout.
    expect(t.ended[0]!.stats).toMatchObject({ hands: t.handNo, unmasked: 0, caught: 0 });
    // La table a fermé bien avant la demi-heure d'inactivité.
    expect(t.ended[0]!.at).toBeLessThan(T0 + 10 * 60_000);
    audited(t);
  });

  it("table sans geste depuis 30 minutes : elle ferme, la main en cours est annulée, pas de victoire", () => {
    const rng = rngOf(52);
    // Cas d'école : on vieillit la table à la main, l'absence l'aurait fermée bien avant.
    const stale = copy(masters(rng));
    stale.activeAt = T0 - IDLE_TABLE_MS + 1_000;
    const t = advance(stale, T0 + 1_000, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "inactive"]);
    // Chacun reprend ce qu'il avait versé dans la main : il retrouve sa cave entière.
    expect(t.ended).toEqual([{ ...SEAT, payout: MASTERS_BUYIN, reason: "inactive", at: T0 + 1_000 }]);
    expect(chipsOnTable(t)).toBe(0);
    audited(t);
  });

  it("la cave n'arrive jamais : le siège réservé est libéré et la table ferme", () => {
    const rng = rngOf(53);
    let t = createTable({
      code: "ABCDE", kind: "maitres", place: null, blind: MASTERS_BLIND, maxBuyIn: MASTERS_BUYIN, seats: MASTERS_SEATS,
      bots: FOUR, difficulty: "difficile",
    }, T0);
    t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rng);
    t = advance(t, T0 + RESERVE_MS, rng);
    expect([t.phase, t.closed, t.handNo]).toEqual(["fermee", "vide", 0]);
    expect(t.ended).toEqual([{ sid: "s_0", playerId: "p_a", seat: 0, payout: 0, received: 0, reason: "reserve", at: T0 + RESERVE_MS }]);
    audited(t);
  });
});

// ---------------------------------------------------------------------------

describe("des tables entières", () => {
  /** Rien de négatif, rien de fractionnaire, rien au-delà des entiers exacts. */
  function sound(t: TableState): void {
    for (const seat of t.seats) {
      if (!seat) continue;
      if (!Number.isSafeInteger(seat.stack) || seat.stack < 0 || seat.reserve !== 0) throw new Error(`tapis invalide : ${seat.stack}`);
    }
    if (t.hand) {
      let staked = 0;
      for (const p of t.hand.players) {
        if (!Number.isSafeInteger(p.committed) || p.committed < 0 || p.bet < 0 || p.bet > p.committed) throw new Error("mise invalide");
        staked += p.committed;
      }
      if (!Number.isSafeInteger(t.hand.pot) || t.hand.pot < staked) throw new Error("pot invalide");
    }
    if (!Number.isSafeInteger(t.carry) || t.carry < 0) throw new Error("pot resté invalide");
  }

  it("200 tables jouées jusqu'au bout : cinq caves du début à la fin, et une fin nette", () => {
    const lengths: number[] = [];
    const wins: number[] = [];
    let eliminations = 0;
    let shortBlinds = 0;
    let sidePots = 0;
    let carried = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const out = new Set<number>();
      let lastHand = 0;
      let lastResult = 0;
      const { table: t, before } = playMasters(40_000 + seed, (state, now) => {
        if (state.phase === "fermee") return;
        sound(state);
        // Personne ne recave, rien ne disparaît : l'argent de la table ne bouge pas d'un euro.
        if (chipsOnTable(state) !== ALL) throw new Error(`jetons : ${chipsOnTable(state)}`);
        if (state.audit.in !== MASTERS_BUYIN || state.audit.out !== 0 || state.audit.bank !== 4 * MASTERS_BUYIN) throw new Error("comptes");
        if (state.seats.some((seat) => seat === null)) throw new Error("un siège s'est vidé");
        const view = viewFor(state, "p_a", now);
        if (view.options.rebuy !== null || view.options.start) throw new Error("une recave est offerte");
        // Un siège éliminé le reste, et ne reçoit plus jamais de cartes.
        for (const seat of view.seats) {
          if (seat!.out) out.add(seat!.seat);
          else if (out.has(seat!.seat)) throw new Error(`le siège ${seat!.seat} est revenu`);
          if (seat!.out && (seat!.stack !== 0 || seat!.inHand)) throw new Error("un éliminé joue");
        }
        if (state.hand && state.handNo !== lastHand) {
          lastHand = state.handNo;
          // La blinde de la main suit le barème, et la vue l'annonce.
          const blind = mastersBlind(MASTERS_BLIND, state.handNo);
          if (state.hand.blind !== blind || view.blind !== blind) throw new Error(`blinde de la main ${state.handNo}`);
          const rise = mastersRise(MASTERS_BLIND, state.handNo);
          if (JSON.stringify(view.rise) !== JSON.stringify(rise)) throw new Error("hausse annoncée");
          // Sont servis ceux qui avaient encore des jetons, et eux seuls.
          const dealt = state.hand.players.map((p) => p.seat).sort();
          const alive = [0, 1, 2, 3, 4].filter((i) => !out.has(i));
          if (JSON.stringify(dealt) !== JSON.stringify(alive)) throw new Error(`donne de la main ${state.handNo}`);
          // Chacun a posé la blinde, ou ce qui lui restait.
          for (const p of state.hand.players) {
            if (p.committed > blind) throw new Error("blinde trop payée");
            if (p.committed < blind) {
              shortBlinds += 1;
              if (!p.allIn || state.seats[p.seat]!.stack !== 0) throw new Error("blinde incomplète sans tapis");
            }
          }
        }
        if (state.result && state.result.no !== lastResult) {
          lastResult = state.result.no;
          if (state.result.pots.length > 1) sidePots += 1;
          if (state.result.carry > 0) carried += 1;
        }
      });
      // La fin : le joueur à zéro, ou seul en jetons. Jamais autre chose.
      expect([seed, t.closed, t.ended.length]).toEqual([seed, "maitres", 1]);
      const { reason, payout, stats } = t.ended[0]!;
      const mine = before.seats[0]!.stack;
      const others = before.seats.slice(1).reduce((sum, seat) => sum + seat!.stack, 0);
      if (reason === "maitres-gagne") {
        expect([seed, payout, others, mine + before.carry]).toEqual([seed, ALL, 0, ALL]);
        wins.push(t.handNo);
      } else {
        expect([seed, reason, payout, mine]).toEqual([seed, "maitres-perdu", 0, 0]);
      }
      expect(before.phase).toBe("denouement");
      expect(chipsOnTable(t)).toBe(0);
      audited(t);
      // Il a reçu des cartes à chaque main, et chacune est allée à son dénouement.
      expect([seed, stats?.hands]).toEqual([seed, t.handNo]);
      eliminations += before.seats.filter((seat) => seat!.bot !== null && seat!.stack === 0).length;
      lengths.push(t.handNo);
    }
    lengths.sort((a, b) => a - b);
    wins.sort((a, b) => a - b);
    const at = (list: number[], share: number) => list[Math.min(list.length - 1, Math.floor(share * list.length))]!;
    // Le barème est réglé pour qu'une table se dénoue en 15 à 22 mains en médiane. Les robots
    // misent gros : une table sur dix est finie pour le joueur en une main ou deux.
    expect(at(lengths, 0.5)).toBeGreaterThanOrEqual(15);
    expect(at(lengths, 0.5)).toBeLessThanOrEqual(22);
    expect(at(lengths, 0.9)).toBeLessThanOrEqual(38);
    expect(lengths[lengths.length - 1]!).toBeLessThanOrEqual(55);
    // Un robot à la place du joueur la gagne une fois sur cinq, et il lui faut une trentaine de mains.
    expect(wins.length).toBeGreaterThanOrEqual(25);
    expect(wins.length).toBeLessThanOrEqual(55);
    expect(at(wins, 0.5)).toBeGreaterThanOrEqual(25);
    expect(at(wins, 0.5)).toBeLessThanOrEqual(36);
    // Assez de tout pour que ces invariants veuillent dire quelque chose.
    expect(eliminations).toBeGreaterThan(300);
    expect(shortBlinds).toBeGreaterThan(100);
    expect(sidePots).toBeGreaterThan(100);
    expect(carried).toBeGreaterThan(20);
  });

  it("un joueur qui fait n'importe quoi de permis, ou rien du tout : l'argent reste juste, la fin reste nette", () => {
    const reasons = new Map<string, number>();
    let hands = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rng = rngOf(43_000 + seed);
      const pick = (n: number) => rng() % n;
      // Un joueur sur trois est un flâneur : il laisse passer un tour sur deux. Un sur cinq
      // s'endort pour de bon au bout d'un moment, et ne touche plus à rien.
      const lazy = seed % 3 === 0 ? 2 : 14;
      const asleepFrom = seed % 5 === 0 ? 20 + pick(120) : Infinity;
      let now = T0;
      let t = masters(rng, pickMasters(rng));
      let before = t;
      const step = (next: TableState) => {
        if (next === t) return;
        before = t;
        t = next;
        if (t.phase === "fermee") return;
        sound(t);
        if (chipsOnTable(t) !== ALL) throw new Error(`jetons : ${chipsOnTable(t)} (graine ${seed})`);
        if (t.audit.in !== MASTERS_BUYIN || t.audit.out !== 0 || t.audit.bank !== 4 * MASTERS_BUYIN) throw new Error("comptes");
      };
      const open = (): boolean => t.phase !== "fermee";
      for (let guard = 0; guard < 4_000 && open(); guard++) {
        step(advance(t, now, rng));
        if (!open()) break;
        const view = viewFor(t, "p_a", now);
        now += 500 + pick(2_500);
        if (guard >= asleepFrom) continue;
        const o = view.options;
        let action: GameAction | null = null;
        if (pick(lazy) === 0) action = null;
        else if (o.cheat) {
          const free = DECK.filter((c) => !view.hand!.cards.includes(c));
          action = pick(2) === 0 ? { type: "tricher", index: pick(5), card: free[pick(free.length)]! } : { type: "franc-jeu" };
        } else if (o.fold) {
          const choices: GameAction[] = [];
          if (o.check) choices.push({ type: "parole" }, { type: "parole" });
          if (o.call > 0) choices.push({ type: "suivre" }, { type: "suivre" });
          // Les montants se tirent en blindes de base : un entier 32 bits ne couvre pas ces sommes.
          if (o.bet) choices.push({ type: "miser", amount: Math.min(o.bet.max, o.bet.min + pick(40) * MASTERS_BLIND) });
          if (o.raise) choices.push({ type: "relancer", amount: Math.min(o.raise.max, o.raise.min + pick(40) * MASTERS_BLIND) });
          if (o.allIn) choices.push({ type: "tapis" });
          if (!o.check) choices.push({ type: "coucher" });
          action = choices[pick(choices.length)]!;
        } else if (o.accuse.length > 0) {
          action = pick(2) === 0 ? { type: "accuser", seat: o.accuse[pick(o.accuse.length)]! } : { type: "rien" };
        } else if (o.back && pick(3) === 0) action = { type: "retour" };
        else if (o.next && pick(2) === 0) action = { type: "suite" };
        // Tout ce que la vue annonce comme permis est accepté.
        if (action) step(act(t, "p_a", action, view.now, rng, view.step));
        // De temps en temps, il se lève : entre deux mains ou en plein coup.
        else if (open() && pick(250) === 0) step(leave(t, "p_a", view.now, rng));
      }
      expect([seed, t.phase, t.ended.length]).toEqual([seed, "fermee", 1]);
      const { reason, payout } = t.ended[0]!;
      reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
      hands += t.handNo;
      // Ce que le joueur avait devant lui juste avant, et sa part d'un pot resté là s'il a encore des jetons.
      const mine = before.seats[0]!.stack;
      const alive = before.seats.map((seat, i) => (seat!.stack > 0 ? i : -1)).filter((i) => i >= 0);
      const order = seatsAfter(before, before.dealer, alive);
      const share = before.hand ? 0 : splitPot(before.carry, order, order).find((x) => x.seat === 0)?.amount ?? 0;
      const others = before.seats.slice(1).some((seat) => seat!.stack > 0);
      if (reason === "maitres-gagne") expect([seed, t.closed, payout, others, before.hand]).toEqual([seed, "maitres", ALL, false, null]);
      else if (reason === "maitres-perdu") expect([seed, t.closed, payout, mine, before.hand]).toEqual([seed, "maitres", 0, 0, null]);
      else {
        // Parti de lui-même ou écarté pour absence, la partie n'étant pas jouée : son tapis, rien de plus.
        expect([seed, ["quitte", "absent"].includes(reason), t.closed, payout]).toEqual([seed, true, "vide", mine + share]);
        if (!before.hand) expect([seed, mine > 0, others]).toEqual([seed, true, true]);
      }
      expect(chipsOnTable(t)).toBe(0);
      audited(t);
    }
    // Toutes les sorties se sont produites.
    expect([...reasons.keys()].sort()).toEqual(["absent", "maitres-gagne", "maitres-perdu", "quitte"]);
    expect(hands).toBeGreaterThan(250);
  });

  it("le même hasard rejoue la même table, à l'euro près", () => {
    const a = playMasters(4_242);
    const b = playMasters(4_242);
    expect(a.table).toEqual(b.table);
    expect(playMasters(4_243).table).not.toEqual(a.table);
  });

  it("les options annoncées sont exactes, tapis d'entrée et pots annexes compris", () => {
    let checked = 0;
    const accepted = (t: TableState, action: GameAction, now: number, step: number) =>
      refusal(() => act(t, "p_a", action, now, rngOf(1), step)) === "accepté";
    for (let seed = 1; seed <= 6; seed++) {
      let tick = 0;
      playMasters(41_000 + seed, (t, now) => {
        // Un état sur trois suffit : chaque essai rejoue le moteur.
        if (t.phase === "fermee" || tick++ % 3 !== 0) return;
        const view = viewFor(t, "p_a", now);
        const o = view.options;
        const stack = t.seats[0]!.stack;
        const expectSame = (label: string, action: GameAction, announced: boolean) => {
          if (accepted(t, action, now, view.step) !== announced) throw new Error(`${label} : annoncé ${announced}, phase ${t.phase}, main ${t.handNo}`);
          checked += 1;
        };
        expectSame("lancer", { type: "lancer" }, false);
        expectSame("suite", { type: "suite" }, o.next);
        expectSame("franc-jeu", { type: "franc-jeu" }, o.cheat);
        const free = DECK.find((card) => !(view.hand?.cards ?? []).includes(card))!;
        expectSame("tricher", { type: "tricher", index: 0, card: free }, o.cheat);
        expectSame("parole", { type: "parole" }, o.check && o.fold);
        expectSame("suivre", { type: "suivre" }, o.call > 0);
        expectSame("coucher", { type: "coucher" }, o.fold);
        expectSame("tapis", { type: "tapis" }, o.allIn);
        for (const amount of new Set([1, view.blind, view.pot, view.pot + 1, stack, o.bet?.min ?? 2, (o.bet?.min ?? 2) - 1, o.bet?.max ?? 3, (o.bet?.max ?? 3) + 1])) {
          if (amount <= 0) continue;
          expectSame(`miser ${amount}`, { type: "miser", amount }, o.bet !== null && amount >= o.bet.min && amount <= o.bet.max);
        }
        for (const amount of new Set([view.bet + 1, view.bet + view.blind, o.raise?.min ?? 2, (o.raise?.min ?? 2) - 1, o.raise?.max ?? 3, (o.raise?.max ?? 3) + 1])) {
          if (amount <= 0) continue;
          expectSame(`relancer ${amount}`, { type: "relancer", amount }, o.raise !== null && amount >= o.raise.min && amount <= o.raise.max);
        }
        expectSame("rien", { type: "rien" }, o.accuse.length > 0);
        // On n'accuse qu'un joueur encore en jeu : jamais un siège éliminé.
        for (let target = 0; target < MASTERS_SEATS; target++) {
          expectSame(`accuser ${target}`, { type: "accuser", seat: target }, o.accuse.includes(target));
          if (o.accuse.includes(target) && view.seats[target]!.out) throw new Error("un éliminé est accusable");
        }
      });
    }
    expect(checked).toBeGreaterThan(3_000);
  });
});

// ---------------------------------------------------------------------------

describe("les robots autour de la table", () => {
  /** L'abattage vu du siège `me`, avec les mains qu'on donne à chacun. */
  function showdownView(me: number, cards: Record<number, string>): TableView {
    const s = toShowdown(masters(rngOf(61)), { cards, push: Object.keys(cards).map(Number) });
    for (const p of s.hand!.players) p.spoke = false;
    return viewOfSeat(s, me, T0);
  }

  it("à soupçon égal, le robot difficile vise la main la plus forte, pas le premier siège", () => {
    // Trois brelans le battent, aussi suspects l'un que l'autre : il s'en prend au plus haut.
    const low = "7h 5d 4c 3s 2h";
    for (const [cards, target] of [
      [{ 0: "9h 9d 9c Ks 2d", 1: low, 2: "Jh Jd Jc 8s 3d", 3: "Th Td Tc 8h 3c" }, 2],
      [{ 0: "Jh Jd Jc 8s 3d", 1: low, 2: "9h 9d 9c Ks 2d", 3: "Th Td Tc 8h 3c" }, 0],
      [{ 0: "9h 9d 9c Ks 2d", 1: low, 2: "Th Td Tc 8h 3c", 3: "Jh Jd Jc 8s 3d" }, 3],
    ] as const) {
      // Le tirage le plus bas : il accuse à coup sûr.
      expect(botAccuse(showdownView(1, cards), "difficile", always(0))).toBe(target);
    }
    // Le joueur (siège 0) n'est donc pas plus souvent visé qu'un autre : sur toutes les façons
    // d'asseoir ces trois mains, chacun est accusé aussi souvent.
    const hands = ["9h 9d 9c Ks 2d", "Jh Jd Jc 8s 3d", "Th Td Tc 8h 3c"];
    const accused = [0, 0, 0, 0, 0];
    for (const order of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) {
      const cards = { 0: hands[order[0]!]!, 2: hands[order[1]!]!, 4: hands[order[2]!]!, 3: low };
      accused[botAccuse(showdownView(3, cards), "difficile", always(0))!]! += 1;
    }
    expect(accused).toEqual([2, 0, 2, 0, 2]);
    // Le soupçon passe toujours avant la force. Deux adversaires montrent le même as de cœur :
    // l'un des deux a triché, et cela l'inquiète plus qu'un brelan. Entre ces deux-là, la paire.
    const twins = { 0: "Ah Ad 8c 6h 2d", 1: low, 2: "Ah Kd Qc 9s 3d", 3: "Th Td Tc 8h 3c" };
    expect(botAccuse(showdownView(1, twins), "difficile", always(0))).toBe(0);
    expect(botAccuse(showdownView(1, { ...twins, 0: twins[2], 2: twins[0] }), "difficile", always(0))).toBe(2);
  });

  it("le siège du joueur ne pèse pas sur ses chances : il est accusé aussi souvent qu'un hôte", () => {
    // 100 tables : les accusations que chaque siège a subies, rapportées aux mains qu'il a jouées.
    const suffered = [0, 0, 0, 0, 0];
    const played = [0, 0, 0, 0, 0];
    for (let seed = 1; seed <= 100; seed++) {
      let seen = 0;
      playMasters(42_000 + seed, (t) => {
        const r = t.result;
        if (!r || r.no === seen) return;
        seen = r.no;
        for (const n of r.net) played[n.seat]! += 1;
        for (const a of r.accusations) suffered[a.to]! += 1;
      });
    }
    const rate = suffered.map((n, i) => n / played[i]!);
    const hosts = (rate[1]! + rate[2]! + rate[3]! + rate[4]!) / 4;
    // Avant la correction, le joueur en subissait un quart de plus que les autres.
    expect(rate[0]!).toBeGreaterThan(hosts * 0.8);
    expect(rate[0]!).toBeLessThan(hosts * 1.2);
    expect(played[0]!).toBeGreaterThan(1_200);
    expect(suffered[0]!).toBeGreaterThan(120);
  });
});

// ---------------------------------------------------------------------------
// Les compteurs du poker, dans le moteur : la table les tient par siège, main après main.

const IDS = ["p_a", "p_b", "p_c", "p_d"] as const;
const ACES = "As Ad 7c 5h 2d";
const KINGS = "Kc Kd 9s 4h 3c";
const NOTHING = "Qs Jd 8c 6h 2s";

/** Une table de joueurs, blinde de 10 €, chacun avec sa cave. La première main est donnée. */
function friends(stacks: number[], rng: Random32 = rngOf(71), bots: string[] = []): TableState {
  let t = createTable({
    code: "ABCDE", kind: "privee", place: null, blind: 10, maxBuyIn: 1000, seats: stacks.length + bots.length, bots,
    difficulty: "difficile",
  }, T0);
  stacks.forEach((stack, i) => {
    t = sit(t, { playerId: IDS[i]!, sid: `s_${i}`, pseudo: `Joueur ${i}`, species: "chat", look: null }, T0, rng);
    t = deposit(t, `s_${i}`, 1, stack, T0, rng);
  });
  return act(t, IDS[0], { type: "lancer" }, T0, rng);
}

/** Remplace les cartes de certains sièges : le test choisit les mains. */
function withHands(t: TableState, hands: Record<number, string>): TableState {
  const next = copy(t);
  for (const [seat, text] of Object.entries(hands)) next.hand!.players.find((p) => p.seat === Number(seat))!.cards = hand(text);
  return next;
}

const play = (t: TableState, seat: number, action: GameAction, now = T0): TableState => act(t, IDS[seat]!, action, now, rngOf(7));

/** Tous les humains qui n'ont pas choisi jouent franc jeu. */
function allFair(t: TableState, now = T0): TableState {
  let next = t;
  for (const p of t.hand!.players) {
    if (!p.chosen && next.phase === "triche" && next.seats[p.seat]?.bot === null) next = play(next, p.seat, { type: "franc-jeu" }, now);
  }
  return next;
}

/** Tout le monde dit parole, jusqu'à l'abattage. */
function checkAround(t: TableState, now = T0): TableState {
  let next = t;
  for (let guard = 0; guard < 12 && next.phase === "encheres"; guard++) next = play(next, next.hand!.turn!, { type: "parole" }, now);
  return next;
}

/** Les joueurs qui n'ont pas parlé n'accusent personne. */
function allQuiet(t: TableState, now = T0): TableState {
  let next = t;
  for (const p of t.hand!.players) {
    if (next.phase === "abattage" && !p.folded && !playerInHand(next, p.seat)!.spoke) next = play(next, p.seat, { type: "rien" }, now);
  }
  return next;
}

const stat = (hands: number, pots = 0, unmasked = 0, caught = 0): PokerStats => ({ hands, pots, unmasked, caught });
const statsOf = (t: TableState) => t.seats.map((s) => s?.stats ?? null);

describe("les compteurs du poker : ce que la table retient pour chaque joueur", () => {
  it("quatre mains : l'abattage, les accusations, le pot emporté sans abattage, le partage", () => {
    const rng = rngOf(71);
    let now = T0;
    let t = withHands(friends([1000, 1000, 1000], rng), { 0: ACES, 1: KINGS, 2: NOTHING });
    // Rien n'est compté avant le premier dénouement : le champ n'existe pas encore.
    expect(statsOf(t)).toEqual([null, null, null]);
    expect(t.seats.every((s) => !("stats" in s!))).toBe(true);

    // Main 1 : tout le monde va à l'abattage, les as l'emportent.
    t = allQuiet(checkAround(allFair(t)));
    expect([t.phase, t.result!.pots[0]!.winners]).toEqual(["denouement", [{ seat: 0, amount: 30 }]]);
    expect(statsOf(t)).toEqual([stat(1, 1), stat(1), stat(1)]);

    // Main 2 : le siège 1 se fait un brelan de rois. Les deux autres l'accusent ; lui accuse à tort.
    now += RESULT_MS;
    t = withHands(advance(t, now, rng), { 0: ACES, 1: KINGS, 2: NOTHING });
    t = play(t, 1, { type: "tricher", index: 2, card: "Kh" }, now);
    t = checkAround(allFair(t, now), now);
    t = play(t, 0, { type: "accuser", seat: 1 }, now);
    t = play(t, 2, { type: "accuser", seat: 1 }, now);
    t = play(t, 1, { type: "accuser", seat: 0 }, now);
    // Les accusations se lisent dans l'ordre de parole : le donneur (siège 1) en dernier.
    expect(t.result!.accusations).toEqual([
      { from: 2, to: 1, right: true, paid: 0 }, { from: 0, to: 1, right: true, paid: 0 }, { from: 1, to: 0, right: false, paid: 10 },
    ]);
    // Deux tricheurs démasqués ? Non : un seul, par deux joueurs. Chacun des deux en compte un,
    // lui ne s'est fait prendre qu'une fois, et son accusation fausse ne compte pour personne.
    expect(statsOf(t)).toEqual([stat(2, 2, 1, 0), stat(2, 0, 0, 1), stat(2, 0, 1, 0)]);

    // Main 3 : le siège 0 mise, les autres se couchent. Il prend le pot sans montrer ses cartes.
    now += RESULT_MS;
    t = allFair(advance(t, now, rng), now);
    expect([t.dealer, t.hand!.turn]).toEqual([2, 0]);
    t = play(t, 0, { type: "miser", amount: 10 }, now);
    t = play(t, 1, { type: "coucher" }, now);
    t = play(t, 2, { type: "coucher" }, now);
    expect([t.phase, t.result!.showdown]).toEqual(["denouement", false]);
    expect(statsOf(t)).toEqual([stat(3, 3, 1, 0), stat(3, 0, 0, 1), stat(3, 0, 1, 0)]);

    // Main 4 : le siège 2 se couche, les deux autres partagent le pot. Couché, on a joué la main.
    now += RESULT_MS;
    t = withHands(advance(t, now, rng), { 0: "Ah Kd Qc Js 9h", 1: "Ad Kc Qs Jh 9c", 2: NOTHING });
    t = allFair(t, now);
    expect([t.dealer, t.hand!.turn]).toEqual([0, 1]);
    t = play(t, 1, { type: "miser", amount: 10 }, now);
    t = play(t, 2, { type: "coucher" }, now);
    t = play(t, 0, { type: "suivre" }, now);
    t = allQuiet(t, now);
    expect(t.result!.pots).toEqual([{ amount: 50, winners: [{ seat: 1, amount: 25 }, { seat: 0, amount: 25 }], carried: false }]);
    expect(statsOf(t)).toEqual([stat(4, 4, 1, 0), stat(4, 1, 0, 1), stat(4, 0, 1, 0)]);
    audited(t);
  });

  it("une mise rendue ou un dédommagement ne sont pas des pots", () => {
    const rng = rngOf(72);
    // Tête-à-tête. Le siège 1 mise 20 ; l'autre n'a plus que 15 € et suit à tapis : 5 € sont rendus.
    let t = withHands(friends([25, 1000], rng), { 0: ACES, 1: KINGS });
    t = allFair(t);
    expect(t.hand!.turn).toBe(1);
    t = play(t, 1, { type: "miser", amount: 20 });
    t = play(t, 0, { type: "tapis" });
    expect([t.phase, t.hand!.pot, stacksOf(t)]).toEqual(["abattage", 50, [0, 975]]);
    expect(t.log.find((e) => e.kind === "rendu")).toMatchObject({ seat: 1, amount: 5 });
    // Chacun accuse l'autre à tort. À tapis, le siège 0 n'a rien pour payer ; le siège 1 paie la mise du siège 0.
    t = play(t, 0, { type: "accuser", seat: 1 });
    t = play(t, 1, { type: "accuser", seat: 0 });
    expect(t.result!.accusations).toEqual([{ from: 1, to: 0, right: false, paid: 25 }, { from: 0, to: 1, right: false, paid: 0 }]);
    expect(stacksOf(t)).toEqual([75, 950]);
    // Le siège 0 a ramassé le pot. Le siège 1 a repris 5 € et en a versé 25 : il n'a ramassé aucun pot.
    expect(statsOf(t)).toEqual([stat(1, 1), stat(1, 0)]);
    audited(t);
  });

  it("qui n'a pas reçu de cartes n'a pas joué la main", () => {
    const rng = rngOf(73);
    // Le siège 3 n'a pas de quoi payer la blinde : il n'est pas servi.
    let t = withHands(friends([1000, 1000, 1000, 5], rng), { 0: ACES, 1: KINGS, 2: NOTHING });
    expect(playerInHand(t, 3)).toBeNull();
    t = allQuiet(checkAround(allFair(t)));
    expect(statsOf(t)).toEqual([stat(1, 1), stat(1), stat(1), null]);
    // Un robot n'a pas de compteurs : ils ne servent qu'aux joueurs.
    let house = friends([1000], rngOf(74), ["hector"]);
    for (let now = T0; now < T0 + 120_000 && house.phase !== "denouement"; now += 500) {
      house = advance(house, now, rng);
      const o = viewFor(house, "p_a", now).options;
      if (o.cheat) house = act(house, "p_a", { type: "franc-jeu" }, now, rng);
      else if (o.fold) house = act(house, "p_a", o.check ? { type: "parole" } : { type: "suivre" }, now, rng);
      else if (o.accuse.length > 0) house = act(house, "p_a", { type: "rien" }, now, rng);
    }
    expect([house.phase, house.seats[0]!.stats!.hands, "stats" in house.seats[1]!]).toEqual(["denouement", 1, false]);
  });

  it("ses compteurs suivent le joueur qui s'en va ; la main qu'il quitte ne compte pas", () => {
    const rng = rngOf(75);
    let t = withHands(friends([1000, 1000, 1000], rng), { 0: ACES, 1: KINGS, 2: NOTHING });
    // Le siège 2 part en pleine première main : il n'a rien fini, la table ne lui doit que son tapis.
    t = leave(allFair(t), "p_c", T0, rng);
    expect(t.ended).toEqual([{ sid: "s_2", playerId: "p_c", seat: 2, payout: 990, received: 1000, reason: "quitte", at: T0 }]);
    t = allQuiet(checkAround(t));
    expect(statsOf(t)).toEqual([stat(1, 1), stat(1), null]);
    // Main 2 : le siège 1 part pendant l'abattage. Sa première main le suit, pas celle-ci.
    t = withHands(advance(t, T0 + RESULT_MS, rng), { 0: ACES, 1: KINGS });
    t = checkAround(allFair(t, T0 + RESULT_MS), T0 + RESULT_MS);
    expect(t.phase).toBe("abattage");
    t = leave(t, "p_b", T0 + RESULT_MS, rng);
    expect(t.ended[1]).toEqual({
      sid: "s_1", playerId: "p_b", seat: 1, payout: 980, received: 1000, reason: "quitte", at: T0 + RESULT_MS, stats: stat(1),
    });
    // Resté seul, le siège 0 prend le pot : pour lui, la main est allée au bout.
    expect([t.phase, statsOf(t)[0]]).toEqual(["denouement", stat(2, 2)]);
    // Il part à son tour, la table ferme : ses deux mains et ses deux pots le suivent.
    t = leave(t, "p_a", T0 + RESULT_MS + 1_000, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "vide"]);
    expect(t.ended[2]).toMatchObject({ playerId: "p_a", payout: 1030, reason: "quitte", stats: stat(2, 2) });
    // La copie est à lui : accuser réception ne touche à rien d'autre.
    expect(settled(t, ["s_2", "s_1", "s_0"]).ended).toEqual([]);
    audited(t);
  });

  it("un siège libéré en pleine main et repris aussitôt : le nouveau venu n'a pas joué cette main", () => {
    const rng = rngOf(78);
    let t = withHands(friends([1000, 1000, 1000], rng), { 0: ACES, 1: KINGS, 2: NOTHING });
    t = leave(allFair(t), "p_c", T0, rng);
    // Un autre joueur prend le siège tout de suite : il attend la main suivante.
    t = sit(t, { playerId: "p_d", sid: "s_3", pseudo: "Joueur 3", species: "chat", look: null }, T0, rng);
    t = deposit(t, "s_3", 1, 1000, T0, rng);
    expect([seatIndexOf(t, "p_d"), playerInHand(t, 2)]).toEqual([2, null]);
    t = allQuiet(checkAround(t));
    expect([t.phase, t.result!.no]).toEqual(["denouement", 1]);
    // La main s'est finie sous ses yeux, pas dans ses compteurs.
    expect(statsOf(t)).toEqual([stat(1, 1), stat(1), null]);
    // À la suivante, il est servi, et compté comme les autres.
    const now = T0 + RESULT_MS;
    const who = (seat: number): string => (seat === 2 ? "p_d" : IDS[seat]!);
    t = withHands(advance(t, now, rng), { 0: ACES, 1: KINGS, 2: NOTHING });
    for (const seat of [0, 1, 2]) t = act(t, who(seat), { type: "franc-jeu" }, now, rng);
    for (let guard = 0; guard < 6 && t.phase === "encheres"; guard++) t = act(t, who(t.hand!.turn!), { type: "parole" }, now, rng);
    for (const seat of [0, 1, 2]) t = act(t, who(seat), { type: "rien" }, now, rng);
    expect([t.phase, t.result!.no]).toEqual(["denouement", 2]);
    expect(statsOf(t)).toEqual([stat(2, 2), stat(2), stat(1)]);
  });

  it("une main annulée par la fermeture de la table ne compte pour personne", () => {
    const rng = rngOf(76);
    let t = withHands(friends([1000, 1000], rng), { 0: ACES, 1: KINGS });
    t = allQuiet(checkAround(allFair(t)));
    expect(statsOf(t)).toEqual([stat(1, 1), stat(1)]);
    // Deuxième main en cours quand la table ferme (cas d'école : on la vieillit à la main).
    t = allFair(advance(t, T0 + RESULT_MS, rng), T0 + RESULT_MS);
    const stale = copy(t);
    stale.activeAt = T0 - IDLE_TABLE_MS;
    const closed = advance(stale, T0 + RESULT_MS + 1_000, rng);
    expect([closed.phase, closed.closed]).toEqual(["fermee", "inactive"]);
    expect(closed.ended.map((e) => [e.playerId, e.payout, e.stats])).toEqual([["p_a", 1010, stat(1, 1)], ["p_b", 990, stat(1)]]);
  });

  it("des parties au hasard : chaque main est comptée une fois, à chaque joueur qui y était", () => {
    let hands = 0;
    let departures = 0;
    const totals = stat(0);
    for (let seed = 1; seed <= 10; seed++) {
      const rng = rngOf(77_000 + seed);
      const pick = (n: number) => rng() % n;
      let now = T0;
      let t = createTable({ code: "ABCDE", kind: "privee", place: null, blind: 10, maxBuyIn: 1000, seats: 5, bots: ["hector"], difficulty: "difficile" }, now);
      // Le compte que le test tient de son côté, d'après les dénouements publics.
      const expected = new Map<string, PokerStats>(IDS.map((id) => [id, stat(0)]));
      const collected = new Map<string, PokerStats | undefined>();
      IDS.forEach((id, i) => {
        t = sit(t, { playerId: id, sid: `s_${i}`, pseudo: id, species: "chat", look: null }, now, rng);
        t = deposit(t, `s_${i}`, 1, 400 + pick(601), now, rng);
      });
      let last = 0;
      const changed = (next: TableState) => {
        for (const e of next.ended) {
          collected.set(e.playerId, e.stats);
          departures += 1;
        }
        t = next.ended.length > 0 ? settled(next, next.ended.map((e) => e.sid)) : next;
        const r = t.result;
        if (!r || r.no === last) return;
        // Une seule main s'est dénouée depuis la dernière fois : le temps avance par petits pas.
        expect(r.no).toBe(last + 1);
        last = r.no;
        hands += 1;
        for (const { seat } of r.net) {
          const id = IDS[seat];
          if (!id) continue;
          const mine = expected.get(id)!;
          mine.hands += 1;
          if (r.pots.some((pot) => pot.winners.some((w) => w.seat === seat && w.amount > 0))) mine.pots += 1;
          if (r.accusations.some((a) => a.from === seat && a.right)) mine.unmasked += 1;
          if (r.unmasked.some((u) => u.seat === seat)) mine.caught += 1;
        }
      };
      changed(act(t, "p_a", { type: "lancer" }, now, rng));
      for (let step = 0; step < 900 && t.phase !== "fermee"; step++) {
        IDS.forEach((id) => {
          if (seatIndexOf(t, id) < 0 || t.phase === "fermee") return;
          const view = viewFor(t, id, now);
          const o = view.options;
          let action: GameAction | null = null;
          if (pick(15) === 0) return;
          if (o.cheat) {
            const free = DECK.filter((c) => !view.hand!.cards.includes(c));
            action = pick(2) === 0 ? { type: "tricher", index: pick(5), card: free[pick(free.length)]! } : { type: "franc-jeu" };
          } else if (o.fold) {
            const choices: GameAction[] = [];
            if (o.check) choices.push({ type: "parole" }, { type: "parole" });
            if (o.call > 0) choices.push({ type: "suivre" }, { type: "suivre" });
            if (o.bet) choices.push({ type: "miser", amount: o.bet.min + pick(o.bet.max - o.bet.min + 1) });
            if (o.raise) choices.push({ type: "relancer", amount: o.raise.min + pick(o.raise.max - o.raise.min + 1) });
            if (!o.check) choices.push({ type: "coucher" });
            action = choices[pick(choices.length)]!;
          } else if (o.accuse.length > 0) {
            action = pick(2) === 0 ? { type: "accuser", seat: o.accuse[pick(o.accuse.length)]! } : { type: "rien" };
          } else if (o.next && pick(3) === 0) {
            action = { type: "suite" };
          } else if (pick(400) === 0) {
            changed(leave(t, id, now, rng));
          }
          if (action) changed(act(t, id, action, now, rng, view.step));
        });
        now += 700;
        const next = advance(t, now, rng);
        if (next !== t) changed(next);
      }
      // À la fin, ce que la table retient (ou a rendu) pour chacun est exactement ce compte.
      for (const id of IDS) {
        const index = seatIndexOf(t, id);
        const actual = index >= 0 ? t.seats[index]!.stats : collected.get(id);
        const mine = expected.get(id)!;
        expect([seed, id, actual]).toEqual([seed, id, mine.hands > 0 ? mine : undefined]);
        for (const key of ["hands", "pots", "unmasked", "caught"] as const) totals[key] += mine[key];
      }
    }
    // Assez de tout pour que le recoupement veuille dire quelque chose.
    expect(hands).toBeGreaterThan(100);
    expect(totals.hands).toBeGreaterThan(250);
    expect(totals.pots).toBeGreaterThan(100);
    expect(totals.unmasked).toBeGreaterThan(20);
    expect(totals.caught).toBeGreaterThan(20);
    expect(departures).toBeGreaterThan(3);
  });
});

// ---------------------------------------------------------------------------
// Une table enregistrée par la version 2.0, avant la Table des Maîtres et les compteurs.

interface OldIds {
  /** Le joueur encore assis. */
  a: string;
  /** Celui qui est parti, et dont le tapis attend encore sur la table. */
  c: string;
}

const OLD_CODE = "VXQ27";
const OLD_SID_A = "s_aaaaaaaaaaaaaaaa";
const OLD_SID_C = "s_cccccccccccccccc";

/**
 * Une table d'un joueur telle que la version 2.0 l'a écrite, champ pour champ, en pleine
 * cinquième main : c'est au joueur de parler. Un autre est parti à la main d'avant, et son
 * tapis (380 €) n'a pas encore été rendu à sa bourse. Aucun champ ajouté depuis n'y figure.
 */
function oldTable(now: number, ids: OldIds): TableState {
  const seat = { reserve: 0, since: now - 600_000, missed: 0, absent: false, idle: 0, ready: false };
  const player = { swap: null, chosen: true, bet: 0, folded: false, allIn: false, spoke: false, accuse: null, actAt: null, gone: false };
  const table = {
    v: 1, code: OLD_CODE, kind: "privee", place: null, blind: 10, minBuyIn: 200, maxBuyIn: 1000, difficulty: "normal",
    seats: [
      {
        bot: null, playerId: ids.a, sid: OLD_SID_A, pseudo: "Ancienne", species: "chat",
        look: { chapeau: null, lunettes: null, tenue: null, accessoire: null }, stack: 470, seq: 1, received: 500, ...seat,
      },
      { bot: "hector", playerId: "", sid: "", pseudo: "", species: "", look: null, stack: 1010, seq: 0, received: 0, ...seat },
      null,
    ],
    owner: ids.a, started: true, phase: "encheres", version: 57, step: 23,
    createdAt: now - 600_000, clock: now - 2_000, activeAt: now - 2_000, dealer: 1, handNo: 5, carry: 0,
    hand: {
      players: [
        { seat: 0, cards: hand(ACES), committed: 10, ...player },
        { seat: 1, cards: hand(KINGS), committed: 10, ...player },
      ],
      blind: 10, pot: 20, bet: 0, raises: 0, turn: 0, pending: [0, 1], deadline: now + 18_000,
    },
    result: {
      no: 4, showdown: false, hands: [], accusations: [], unmasked: [],
      pots: [{ amount: 30, winners: [{ seat: 1, amount: 30 }], carried: false }],
      net: [{ seat: 0, amount: -10 }, { seat: 1, amount: 20 }], carry: 0, until: now - 6_000,
    },
    nextAt: null,
    ended: [{ sid: OLD_SID_C, playerId: ids.c, seat: 2, payout: 380, received: 400, reason: "quitte", at: now - 12_000 }],
    departed: [{ playerId: ids.c, seat: 2, reason: "quitte", payout: 380, at: now - 12_000 }],
    closed: null,
    log: [
      { n: 61, hand: 4, kind: "depart", seat: 2, amount: 380 },
      { n: 62, hand: 4, kind: "pot", seat: 1, amount: 30 },
      { n: 63, hand: 5, kind: "blinde", seat: 0, amount: 10 },
      { n: 64, hand: 5, kind: "blinde", seat: 1, amount: 10 },
      { n: 65, hand: 5, kind: "donne", seat: 1, amount: 0 },
      { n: 66, hand: 5, kind: "choix", seat: 1, amount: 0 },
      { n: 67, hand: 5, kind: "choix", seat: 0, amount: 0 },
    ],
    logNo: 67,
    // Deux caves entrées (500 et 400), un tapis dû (380), et l'argent du robot.
    audit: { in: 900, out: 380, bank: 980 },
  };
  return table as unknown as TableState;
}

/** Un défi de la version 2.0, arrêté au dénouement de sa dernière main : l'hôte est ruiné. */
function oldChallenge(now: number, id: string): TableState {
  const seat = { reserve: 0, since: now - 300_000, missed: 0, absent: false, idle: 0, ready: false };
  const table = {
    v: 1, code: "D2K7Q", kind: "defi", place: "kiosque", blind: 1, minBuyIn: 30, maxBuyIn: 30, difficulty: "facile",
    seats: [
      {
        bot: null, playerId: id, sid: OLD_SID_A, pseudo: "Ancienne", species: "chat",
        look: { chapeau: null, lunettes: null, tenue: null, accessoire: null }, stack: 60, seq: 1, received: 30, ...seat,
      },
      { bot: "gaspard", playerId: "", sid: "", pseudo: "", species: "", look: null, stack: 0, seq: 0, received: 0, ...seat },
    ],
    owner: id, started: true, phase: "denouement", version: 41, step: 17,
    createdAt: now - 300_000, clock: now - 3_000, activeAt: now - 3_000, dealer: 1, handNo: 7, carry: 0, hand: null,
    result: {
      no: 7, showdown: true,
      hands: [{ seat: 0, cards: hand(ACES), category: "paire" }, { seat: 1, cards: hand(KINGS), category: "paire" }],
      accusations: [], unmasked: [], pots: [{ amount: 60, winners: [{ seat: 0, amount: 60 }], carried: false }],
      net: [{ seat: 0, amount: 30 }, { seat: 1, amount: -30 }], carry: 0, until: now + 5_000,
    },
    nextAt: now + 5_000, ended: [], departed: [], closed: null,
    log: [{ n: 88, hand: 7, kind: "pot", seat: 0, amount: 60 }], logNo: 88,
    audit: { in: 30, out: 0, bank: 30 },
  };
  return table as unknown as TableState;
}

/** Les champs qu'une table de la version 2.0 portait : ni plus, ni moins. */
const OLD_KEYS = {
  table: [
    "activeAt", "audit", "blind", "carry", "clock", "closed", "code", "createdAt", "dealer", "departed", "difficulty", "ended",
    "hand", "handNo", "kind", "log", "logNo", "maxBuyIn", "minBuyIn", "nextAt", "owner", "phase", "place", "result", "seats",
    "started", "step", "v", "version",
  ],
  seat: ["absent", "bot", "idle", "look", "missed", "playerId", "pseudo", "ready", "received", "reserve", "seq", "sid", "since", "species", "stack"],
  ended: ["at", "payout", "playerId", "reason", "received", "seat", "sid"],
};

describe("une table d'avant la mise à jour : le moteur", () => {
  const ids: OldIds = { a: "p_a", c: "p_c" };

  it("le témoin a bien la forme d'une table de la version 2.0 : aucun champ nouveau", () => {
    for (const t of [oldTable(T0, ids), oldChallenge(T0, "p_a")]) {
      expect(Object.keys(t).sort()).toEqual(OLD_KEYS.table);
      for (const seat of t.seats) if (seat) expect(Object.keys(seat).sort()).toEqual(OLD_KEYS.seat);
      for (const e of t.ended) expect(Object.keys(e).sort()).toEqual(OLD_KEYS.ended);
      const text = JSON.stringify(t);
      for (const word of ["stats", "beaten", "maitres"]) expect([word, text.includes(word)]).toEqual([word, false]);
      audited(t);
    }
    // Une table neuve d'aujourd'hui s'écrit encore avec ces champs-là, tant qu'aucune main n'est finie.
    const fresh = friends([1000, 1000]);
    expect(Object.keys(fresh).sort()).toEqual(OLD_KEYS.table);
    expect(Object.keys(fresh.seats[0]!).sort()).toEqual(OLD_KEYS.seat);
  });

  it("elle se lit, se joue et se règle comme avant ; ses compteurs partent de zéro", () => {
    const rng = rngOf(81);
    const old = oldTable(T0, ids);
    // La vue : la même qu'avant, sans rien de nouveau.
    const view = viewFor(old, "p_a", T0);
    expect(view).toMatchObject({ kind: "privee", format: "classique", blind: 10, rise: null, phase: "encheres", turn: 0, you: 0, pot: 20, handNo: 5 });
    expect(view.options).toMatchObject({ check: true, fold: true, bet: { min: 10, max: 470 }, rebuy: null });
    expect(view.seats.every((s) => s === null || !("out" in s))).toBe(true);
    expect(advance(old, T0, rng)).toBe(old);
    // La main en cours se finit : parole, le robot répond, abattage, personne n'accuse.
    let t = act(old, "p_a", { type: "parole" }, T0, rng);
    for (let now = T0; now < T0 + 120_000 && t.phase !== "denouement"; now += 500) {
      t = advance(t, now, rng);
      const o = viewFor(t, "p_a", now).options;
      if (o.fold) t = act(t, "p_a", o.check ? { type: "parole" } : { type: "suivre" }, now, rng);
      else if (o.accuse.length > 0) t = act(t, "p_a", { type: "rien" }, now, rng);
    }
    expect([t.phase, t.result!.no]).toEqual(["denouement", 5]);
    // La première main finie après la mise à jour est la première comptée.
    expect(t.seats[0]!.stats).toMatchObject({ hands: 1, unmasked: 0, caught: 0 });
    audited(t);
    // Le tapis dû d'avant est toujours là, tel quel ; en accuser réception marche comme avant.
    expect(t.ended).toEqual(old.ended);
    t = settled(t, [OLD_SID_C]);
    expect(t.ended).toEqual([]);
    // Le joueur s'en va : la table ferme, il reprend son tapis et ses compteurs.
    const stack = t.seats[0]!.stack;
    t = leave(t, "p_a", t.clock, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "vide"]);
    expect(t.ended).toMatchObject([{ sid: OLD_SID_A, playerId: "p_a", payout: stack, received: 500, reason: "quitte", stats: { hands: 1 } }]);
    expect(chipsOnTable(t)).toBe(0);
    audited(t);
  });

  it("quitter en pleine main d'une vieille table : rien à compter, rien de perdu", () => {
    const rng = rngOf(82);
    const t = leave(oldTable(T0, ids), "p_a", T0, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "vide"]);
    // Les deux tapis à rendre : celui d'avant, tel quel, et le sien. Aucun ne porte de compteurs.
    expect(t.ended).toEqual([
      { sid: OLD_SID_C, playerId: "p_c", seat: 2, payout: 380, received: 400, reason: "quitte", at: T0 - 12_000 },
      { sid: OLD_SID_A, playerId: "p_a", seat: 0, payout: 470, received: 500, reason: "quitte", at: T0 },
    ]);
    audited(t);
  });

  it("un vieux défi déjà joué se dénoue comme avant, et partir pendant son dénouement ne le perd plus", () => {
    const rng = rngOf(83);
    const old = oldChallenge(T0, "p_a");
    expect(viewFor(old, "p_a", T0)).toMatchObject({ kind: "defi", place: "kiosque", blind: 8, rise: { hand: 10, blind: 16 }, phase: "denouement" });
    // L'hôte n'a plus rien, mais `out` n'existe qu'à la Table des Maîtres : la vue d'un défi n'a pas changé.
    expect(viewFor(old, "p_a", T0).seats.map((s) => [s!.stack, "out" in s!])).toEqual([[60, false], [0, false]]);
    const won = { sid: OLD_SID_A, playerId: "p_a", seat: 0, payout: 60, received: 30, reason: "defi-gagne" };
    const waited = advance(old, T0 + 5_000, rng);
    expect([waited.phase, waited.closed, waited.ended]).toEqual(["fermee", "defi", [{ ...won, at: T0 + 5_000 }]]);
    // Avant cette version, partir à ce moment-là rendait « quitte » : la cagnotte était perdue.
    const left = leave(old, "p_a", T0 + 1_000, rng);
    expect([left.phase, left.closed, left.ended]).toEqual(["fermee", "defi", [{ ...won, at: T0 + 1_000 }]]);
    expect(left.audit).toEqual({ in: 30, out: 60, bank: 30 });
  });
});

// ---------------------------------------------------------------------------
// Le format tournoi d'une table entre amis : les règles de la Table des Maîtres, à plusieurs
// joueurs humains. La même cagnotte pour tous, pas de recave, la blinde qui monte, les perdants
// éliminés, et le dernier à avoir des jetons qui remporte tout.

/** La cagnotte de chacun à une table en tournoi dont la blinde de départ est de 10 € : trente blindes. */
const STAKE = 300;

const sitter = (i: number, sid = `s_${i}`) => ({ playerId: IDS[i]!, sid, pseudo: `Joueur ${i}`, species: "chat", look: null });

/** Une table entre amis créée en tournoi, blinde de 10 € : `humans` joueurs assis, leur cagnotte posée. Pas encore lancée. */
function tourney(humans: number, bots: string[] = [], seats = humans + bots.length, rng: Random32 = rngOf(71)): TableState {
  let t = createTable({
    code: "ABCDE", kind: "privee", place: null, format: "tournoi", blind: 10, maxBuyIn: STAKE, seats, bots, difficulty: "difficile",
  }, T0);
  for (let i = 0; i < humans; i++) {
    t = sit(t, sitter(i), T0, rng);
    t = deposit(t, `s_${i}`, 1, STAKE, T0, rng);
  }
  return t;
}

/** La même, lancée par son créateur : la première main est donnée. */
function launched(humans: number, bots: string[] = [], rng: Random32 = rngOf(71)): TableState {
  return act(tourney(humans, bots, humans + bots.length, rng), "p_a", { type: "lancer" }, T0, rng);
}

/**
 * Cas d'école : le tournoi arrêté entre deux mains, pendant le dénouement de la dernière.
 * Les tapis sont ceux qu'on donne ; ce que la table porte de plus ou de moins que les
 * cagnottes des joueurs est mis au compte des robots.
 */
function tourneyAt(t: TableState, at: Between): TableState {
  const s = copy(t);
  s.hand = null;
  s.phase = "denouement";
  s.nextAt = at.nextAt ?? T0;
  s.handNo = at.played;
  s.carry = at.carry ?? 0;
  if (at.dealer !== undefined) s.dealer = at.dealer;
  at.stacks.forEach((stack, i) => { s.seats[i]!.stack = stack; });
  s.audit.bank = chipsOnTable(s) - s.audit.in + s.audit.out;
  audited(s);
  return s;
}

/** Ce que la table doit à ce joueur : la raison de son départ et ce qui retourne à sa bourse. */
const owed = (t: TableState, playerId: string) => t.ended.filter((e) => e.playerId === playerId).map((e) => [e.reason, e.payout]);

describe("une table entre amis jouée en tournoi : le moteur", () => {
  it("créée en tournoi : la même cagnotte pour tous, trente blindes, et le format se lit dans la vue", () => {
    const t = tourney(2, ["gaspard"], 4);
    expect([t.kind, t.format, t.minBuyIn, t.maxBuyIn, t.started, isTournament(t)]).toEqual(["privee", "tournoi", STAKE, STAKE, false, true]);
    // Le robot arrive avec la même cagnotte que les joueurs.
    expect(stacksOf(t)).toEqual([STAKE, STAKE, null, STAKE]);
    const view = viewFor(t, "p_a", T0);
    expect([view.kind, view.format, view.minBuyIn, view.maxBuyIn, view.blind, view.rise]).toEqual([
      "privee", "tournoi", STAKE, STAKE, 10, { hand: 17, blind: 20 },
    ]);
    // Qui n'est pas encore assis lit la même chose dans l'aperçu : de quoi remplir la feuille « rejoindre ».
    const preview = viewFor(t, "p_z", T0);
    expect([preview.you, preview.format, preview.minBuyIn, preview.maxBuyIn, preview.started]).toEqual([null, "tournoi", STAKE, STAKE, false]);
    audited(t);
  });

  it("sans rien demander, une table reste classique ; le format ne se choisit qu'à une table à code", () => {
    // La table à code de toujours : rien n'est écrit dans son état, et sa vue dit « classique ».
    const classic = friends([1000, 1000]);
    expect(["format" in classic, viewFor(classic, "p_a", T0).format, isTournament(classic)]).toEqual([false, "classique", false]);
    expect([classic.minBuyIn, classic.maxBuyIn, viewFor(classic, "p_a", T0).rise]).toEqual([200, 1000, null]);
    const asked = createTable({
      code: "ABCDE", kind: "privee", place: null, format: "classique", blind: 10, maxBuyIn: 1000, seats: 2, bots: [], difficulty: "normal",
    }, T0);
    expect(["format" in asked, asked.minBuyIn]).toEqual([false, 200]);
    // Une table de la maison ne devient pas un tournoi parce qu'on le lui demande.
    const house = createTable({
      code: "ABCDE", kind: "maison", place: "kiosque", format: "tournoi", blind: 1, maxBuyIn: 100, seats: 4, bots: ["gaspard"], difficulty: "facile",
    }, T0);
    expect(["format" in house, house.minBuyIn, viewFor(house, null, T0).format]).toEqual([false, 20, "classique"]);
    // La Table des Maîtres est un tournoi par nature : rien à écrire dans son état non plus.
    const m = masters(rngOf(3));
    expect(["format" in m, viewFor(m, "p_a", T0).format]).toEqual([false, "tournoi"]);
  });

  it("on s'y assoit avant le lancement ; ensuite plus personne n'entre, même s'il reste un siège", () => {
    const rng = rngOf(5);
    let t = tourney(2, [], 4, rng);
    // Avant le lancement : on entre et on sort librement, en reprenant sa cagnotte.
    t = deposit(sit(t, sitter(2), T0, rng), "s_2", 1, STAKE, T0, rng);
    t = leave(t, "p_c", T0, rng);
    expect(owed(t, "p_c")).toEqual([["quitte", STAKE]]);
    expect([t.carry, t.phase]).toEqual([0, "attente"]);
    t = act(t, "p_a", { type: "lancer" }, T0, rng);
    expect([t.started, t.handNo, t.phase, t.seats.filter((seat) => seat === null).length]).toEqual([true, 1, "triche", 2]);
    expect(refusal(() => sit(t, sitter(3), T0, rng))).toBe("TABLE_FULL");
    expect(refusal(() => sit(t, sitter(2, "s_9"), T0, rng))).toBe("TABLE_FULL");
    // Qui est déjà assis ne bouge pas : rejouer sa demande ne change rien.
    expect(sit(t, sitter(1, "s_9"), T0, rng)).toBe(t);
    audited(t);
  });

  it("un siège réservé avant le lancement, jamais payé, ne se paie plus après : il est libéré", () => {
    const rng = rngOf(6);
    // Le troisième a réservé son siège, mais sa cagnotte n'est pas arrivée quand la partie part.
    let t = sit(tourney(2, [], 4, rng), sitter(2), T0, rng);
    t = act(t, "p_a", { type: "lancer" }, T0, rng);
    expect([t.handNo, t.hand!.players.map((p) => p.seat).sort(), t.seats[2]!.seq]).toEqual([1, [0, 1], 0]);
    // Sa demande rejouée est refusée : il n'entrera plus.
    expect(refusal(() => sit(t, sitter(2), T0 + 1_000, rng))).toBe("TABLE_FULL");
    // Au bout de trente secondes, son siège est libéré ; il n'avait rien posé, il n'a rien à reprendre.
    t = advance(t, T0 + RESERVE_MS, rng);
    expect([t.seats[2], owed(t, "p_c"), t.closed]).toEqual([null, [["reserve", 0]], null]);
    audited(t);
  });

  it("le créateur la lance dès qu'ils sont deux, humains ou robots", () => {
    const alone = tourney(1, [], 3);
    expect(viewFor(alone, "p_a", T0).options.start).toBe(false);
    expect(refusal(() => act(alone, "p_a", { type: "lancer" }, T0, rngOf(1)))).toBe("ACTION_IMPOSSIBLE");
    // Un siège réservé dont la cagnotte n'est pas posée ne compte pas.
    const reserved = sit(alone, sitter(1), T0, rngOf(1));
    expect(refusal(() => act(reserved, "p_a", { type: "lancer" }, T0, rngOf(1)))).toBe("ACTION_IMPOSSIBLE");
    // Un robot suffit.
    const withBot = tourney(1, ["gaspard"], 3);
    expect(viewFor(withBot, "p_a", T0).options.start).toBe(true);
    expect(act(withBot, "p_a", { type: "lancer" }, T0, rngOf(1)).hand!.players.map((p) => p.seat).sort()).toEqual([0, 2]);
    // Un ami aussi ; et seul le créateur lance.
    const two = tourney(2, [], 3);
    expect(viewFor(two, "p_b", T0).options.start).toBe(false);
    expect(refusal(() => act(two, "p_b", { type: "lancer" }, T0, rngOf(1)))).toBe("ACTION_IMPOSSIBLE");
    const started = act(two, "p_a", { type: "lancer" }, T0, rngOf(1));
    expect([started.handNo, started.hand!.players.length, started.hand!.pot]).toEqual([1, 2, 20]);
  });

  it("personne ne recave, et la blinde monte comme à la Table des Maîtres, jusqu'à dépasser tout l'argent de la table", () => {
    const t = launched(2, ["gaspard"]);
    for (const seat of [0, 1, 2]) expect([seat, rebuyRange(t, seat)]).toEqual([seat, null]);
    expect(viewFor(t, "p_b", T0).options.rebuy).toBeNull();
    // Même entre deux mains, avec un tapis entamé : à une table classique, on lui proposerait de recaver.
    const short = tourneyAt(t, { played: 4, stacks: [350, 250, 300], nextAt: T0 + 5_000 });
    expect([rebuyRange(short, 1), viewFor(short, "p_b", T0).options.rebuy]).toEqual([null, null]);
    const classic = copy(friends([1000, 1000]));
    Object.assign(classic, { hand: null, phase: "denouement", nextAt: T0 + 5_000 });
    classic.seats[1]!.stack = 250;
    expect(rebuyRange(classic, 1)).toEqual({ min: 1, max: 750 });
    // Le même barème : seize mains à la blinde de départ, puis elle double par paliers.
    expect([1, 16, 17, 20, 21, 25, 29, 31, 33, 35].map((n) => blindAt(t, n))).toEqual([10, 10, 20, 40 / 2, 40, 80, 160, 320, 640, 1280]);
    for (const n of [1, 16, 17, 21, 25, 29, 31, 33, 35]) expect([n, blindAt(t, n)]).toEqual([n, mastersBlind(10, n)]);
    // Elle s'arrête dès qu'elle dépasse tout l'argent en jeu : trente blindes par siège.
    // À trois sièges (900 €) : 1 280 €. À deux (600 €) : 640 €. À six (1 800 €) : 2 560 €, comme à cinq.
    expect([blindAt(t, 37), blindAt(t, 99), nextRise({ ...t, handNo: 34 }), nextRise({ ...t, handNo: 36 })]).toEqual([1280, 1280, { hand: 35, blind: 1280 }, null]);
    expect([2, 3, 4, 5, 6].map((seats) => mastersBlind(10, 99, seats))).toEqual([640, 1280, 1280, 2560, 2560]);
    expect([mastersBlind(10, 99), mastersRise(10, 32, 2), mastersRise(10, 33, 2), mastersRise(10, 36, 6)]).toEqual([
      2560, { hand: 33, blind: 640 }, null, { hand: 37, blind: 2560 },
    ]);
    const duel = launched(2);
    expect([blindAt(duel, 33), blindAt(duel, 99)]).toEqual([640, 640]);
  });

  it("un joueur à zéro est éliminé : il quitte la table sans rien, la partie continue entre les autres", () => {
    const rng = rngOf(11);
    // Première main à trois : les sièges 0 et 2 poussent leur tapis, le siège 1 se couche.
    let t = toShowdown(launched(3, [], rng), { cards: { 0: ACES, 1: KINGS, 2: NOTHING }, push: [0, 2] });
    t = play(play(t, 0, { type: "rien" }), 2, { type: "rien" });
    expect([t.phase, stacksOf(t)]).toEqual(["denouement", [610, 290, 0]]);
    // Pendant le dénouement, il est encore assis, sans un jeton : éliminé, cela se voit.
    expect(viewFor(t, "p_a", T0).seats.map((seat) => seat?.out ?? false)).toEqual([false, false, true]);
    expect(t.ended).toEqual([]);
    t = advance(t, T0 + RESULT_MS, rng);
    // La main suivante part sans lui : son siège est libre, et la table lui doit zéro.
    expect(owed(t, "p_c")).toEqual([["maitres-perdu", 0]]);
    expect(t.ended[0]).toMatchObject({ sid: "s_2", seat: 2, received: STAKE });
    expect(t.departed).toEqual([{ playerId: "p_c", seat: 2, reason: "maitres-perdu", payout: 0, at: T0 + RESULT_MS }]);
    expect([t.closed, t.phase, t.handNo, t.seats[2], t.hand!.players.map((p) => p.seat).sort()]).toEqual([null, "triche", 2, null, [0, 1]]);
    // Sa cagnotte reste en jeu : les deux autres se la disputent.
    expect(chipsOnTable(t)).toBe(3 * STAKE);
    expect(refusal(() => sit(t, sitter(2, "s_9"), T0 + RESULT_MS, rng))).toBe("TABLE_FULL");
    audited(t);
  });

  it("le dernier à avoir des jetons remporte tout : la table ferme, gagnée pour lui, perdue pour l'autre", () => {
    const rng = rngOf(12);
    let t = toShowdown(launched(2, [], rng), { cards: { 0: KINGS, 1: ACES }, push: [0, 1] });
    t = play(play(t, 0, { type: "rien" }), 1, { type: "rien" });
    expect([t.phase, stacksOf(t), t.closed]).toEqual(["denouement", [0, 600], null]);
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.phase, t.closed, t.seats]).toEqual(["fermee", "maitres", [null, null]]);
    expect([owed(t, "p_a"), owed(t, "p_b")]).toEqual([[["maitres-perdu", 0]], [["maitres-gagne", 600]]]);
    expect(t.audit).toEqual({ in: 600, out: 600, bank: 0 });
    audited(t);
  });

  it("gagnée avec un pot resté au milieu : il est au vainqueur aussi", () => {
    const t = advance(tourneyAt(launched(3), { played: 9, stacks: [0, 820, 0], carry: 80 }), T0, rngOf(2));
    expect([t.closed, owed(t, "p_a"), owed(t, "p_b"), owed(t, "p_c")]).toEqual([
      "maitres", [["maitres-perdu", 0]], [["maitres-gagne", 900]], [["maitres-perdu", 0]],
    ]);
    audited(t);
  });

  it("avec des robots : un robot éliminé garde son siège, un joueur éliminé libère le sien", () => {
    const rng = rngOf(13);
    const t = advance(tourneyAt(launched(2, ["gaspard", "ondine"], rng), { played: 6, stacks: [400, 0, 800, 0] }), T0, rng);
    expect([t.closed, t.handNo, t.seats.map((seat) => seat === null)]).toEqual([null, 7, [false, true, false, false]]);
    expect(owed(t, "p_b")).toEqual([["maitres-perdu", 0]]);
    expect(t.hand!.players.map((p) => p.seat).sort()).toEqual([0, 2]);
    expect(viewFor(t, "p_a", T0).seats.map((seat) => seat?.out ?? false)).toEqual([false, false, false, true]);
    // Personne ne recave : le robot à zéro n'est pas renfloué.
    expect([t.seats[3]!.stack, chipsOnTable(t)]).toEqual([0, 1200]);
    audited(t);
  });

  it("avec des robots : le dernier joueur en jetons face à des robots à sec a gagné", () => {
    const t = advance(tourneyAt(launched(2, ["gaspard", "ondine"]), { played: 12, stacks: [1200, 0, 0, 0] }), T0, rngOf(2));
    expect([t.closed, owed(t, "p_a"), owed(t, "p_b")]).toEqual(["maitres", [["maitres-gagne", 1200]], [["maitres-perdu", 0]]]);
    audited(t);
  });

  it("avec des robots : quand plus aucun joueur n'a de jetons, la table ferme et tous ont perdu", () => {
    const t = advance(tourneyAt(launched(2, ["gaspard", "ondine"]), { played: 12, stacks: [0, 0, 700, 500] }), T0, rngOf(2));
    expect([t.closed, owed(t, "p_a"), owed(t, "p_b")]).toEqual(["maitres", [["maitres-perdu", 0]], [["maitres-perdu", 0]]]);
    // L'argent des joueurs est resté aux robots, et disparaît avec eux.
    expect([t.audit.in, t.audit.out, chipsOnTable(t)]).toEqual([600, 0, 0]);
    audited(t);
  });

  it("plus personne n'a rien (tous à tapis, tous démasqués) : match nul, ils se partagent le pot resté là", () => {
    const rng = rngOf(25);
    // À deux, première main : tous deux poussent leur tapis, tous deux ont triché, et chacun accuse l'autre.
    let t = toShowdown(launched(2, [], rng), { cards: { 0: ACES, 1: KINGS }, push: [0, 1], cheats: [0, 1] });
    t = play(play(t, 0, { type: "accuser", seat: 1 }), 1, { type: "accuser", seat: 0 });
    expect([t.phase, stacksOf(t), t.carry, t.result!.pots]).toEqual([
      "denouement", [0, 0], 600, [{ amount: 600, winners: [], carried: true }],
    ]);
    t = advance(t, T0 + RESULT_MS, rng);
    // Personne n'a gagné, personne n'a perdu : chacun reprend sa part.
    expect([t.closed, owed(t, "p_a"), owed(t, "p_b")]).toEqual(["maitres", [["maitres-nul", 300]], [["maitres-nul", 300]]]);
    expect(t.audit).toEqual({ in: 600, out: 600, bank: 0 });
    audited(t);
  });

  it("match nul avec un robot dans le coup : la part du robot disparaît avec lui ; un joueur éliminé plus tôt n'a droit à rien", () => {
    const rng = rngOf(26);
    // Trois joueurs et un robot ; le siège 2 est déjà éliminé, le siège 1 se couche. Le siège 0
    // et le robot poussent 450 € chacun, ont triché tous les deux, et s'accusent l'un l'autre.
    let t = advance(tourneyAt(launched(3, ["gaspard"], rng), { played: 5, stacks: [450, 300, 0, 450] }), T0, rng);
    expect([owed(t, "p_c"), t.handNo, stacksOf(t)]).toEqual([[["maitres-perdu", 0]], 6, [440, 290, null, 440]]);
    t = toShowdown(t, { cards: { 0: ACES, 3: KINGS }, push: [0, 3], cheats: [0, 3], accuse: { 3: 0 } });
    t = play(t, 0, { type: "accuser", seat: 3 });
    // Le pot (910 €) reste là ; le siège 1, couché, a gardé ses jetons : la partie continue, et il la gagne.
    expect([t.phase, stacksOf(t), t.carry]).toEqual(["denouement", [0, 290, null, 0], 910]);
    const won = advance(t, T0 + RESULT_MS, rng);
    expect([won.closed, owed(won, "p_a"), owed(won, "p_b")]).toEqual(["maitres", [["maitres-perdu", 0]], [["maitres-gagne", 1200]]]);
    audited(won);

    // Sans le siège 1 : plus personne n'a rien. Le joueur et le robot qui jouait le coup se
    // partagent le pot (la part du robot disparaît avec lui) ; l'autre robot, éliminé plus tôt et
    // toujours assis, n'y a pas droit.
    let duel = advance(tourneyAt(launched(2, ["gaspard", "ondine"], rng), { played: 5, stacks: [450, 0, 0, 450] }), T0, rng);
    expect([owed(duel, "p_b"), duel.seats.map((seat) => seat === null), duel.hand!.players.map((p) => p.seat).sort()]).toEqual([
      [["maitres-perdu", 0]], [false, true, false, false], [0, 3],
    ]);
    duel = toShowdown(duel, { cards: { 0: ACES, 3: KINGS }, push: [0, 3], cheats: [0, 3], accuse: { 3: 0 } });
    duel = advance(play(duel, 0, { type: "accuser", seat: 3 }), T0 + RESULT_MS, rng);
    expect([duel.closed, owed(duel, "p_a")]).toEqual(["maitres", [["maitres-nul", 450]]]);
    expect([duel.audit.in, duel.audit.out, chipsOnTable(duel)]).toEqual([600, 450, 0]);
    audited(duel);
  });

  it("abandonner entre deux mains : le tapis de celui qui part reste sur la table et rejoint le pot de la main suivante", () => {
    const rng = rngOf(14);
    let t = tourneyAt(launched(3, [], rng), { played: 4, stacks: [350, 250, 300], nextAt: T0 + 5_000 });
    t = leave(t, "p_b", T0 + 1_000, rng);
    // Il repart sans rien : c'est un abandon, pas une élimination.
    expect(owed(t, "p_b")).toEqual([["quitte", 0]]);
    expect([t.closed, t.phase, t.carry, t.seats[1], viewFor(t, "p_a", T0 + 1_000).pot]).toEqual([null, "denouement", 250, null, 250]);
    expect(t.departed).toEqual([{ playerId: "p_b", seat: 1, reason: "quitte", payout: 0, at: T0 + 1_000 }]);
    audited(t);
    // La main suivante : son tapis est au milieu, avec les deux blindes.
    t = advance(t, T0 + 5_000, rng);
    expect([t.handNo, t.carry, t.hand!.pot, stacksOf(t)]).toEqual([5, 0, 270, [340, null, 290]]);
    expect(chipsOnTable(t)).toBe(3 * STAKE);
    audited(t);
  });

  it("abandonner en pleine main : ce qu'il a versé reste au pot de la main, le reste de son tapis attend la suivante", () => {
    const rng = rngOf(15);
    let t = launched(3, [], rng);
    t = leave(t, "p_b", T0, rng);
    expect(owed(t, "p_b")).toEqual([["quitte", 0]]);
    // Sa blinde est au pot de la main ; ses 290 € attendent à part, sans rien changer au coup en cours.
    expect([t.hand!.pot, t.carry, viewFor(t, "p_a", T0).pot, chipsOnTable(t)]).toEqual([30, 290, 30, 900]);
    audited(t);
    // Les deux autres jouent la main jusqu'au bout, sans miser.
    t = withHands(t, { 0: ACES, 2: KINGS });
    t = allQuiet(checkAround(allFair(t)));
    expect([t.phase, t.result!.pots, t.result!.carry, t.carry]).toEqual([
      "denouement", [{ amount: 30, winners: [{ seat: 0, amount: 30 }], carried: false }], 290, 290,
    ]);
    expect(stacksOf(t)).toEqual([320, null, 290]);
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.handNo, t.carry, t.hand!.pot, stacksOf(t)]).toEqual([2, 0, 310, [310, null, 280]]);
    audited(t);
  });

  it("abandonner face à un joueur à tapis : il n'a plus rien devant lui, mais il est encore en jeu", () => {
    const rng = rngOf(24);
    const s = copy(launched(2, ["gaspard"], rng));
    // Le siège 0 a tout poussé dans la main en cours.
    const pushed = s.hand!.players.find((p) => p.seat === 0)!;
    pushed.committed += s.seats[0]!.stack;
    s.hand!.pot += s.seats[0]!.stack;
    s.seats[0]!.stack = 0;
    pushed.allIn = true;
    audited(s);
    const t = leave(s, "p_b", T0, rng);
    expect([owed(t, "p_b"), t.carry, t.closed]).toEqual([[["quitte", 0]], 290, null]);
    audited(t);
  });

  it("abandonner à deux : l'autre remporte tout, tapis abandonné compris", () => {
    const rng = rngOf(16);
    let t = leave(launched(2, [], rng), "p_b", T0, rng);
    // Il ne reste qu'un joueur dans le coup : il prend le pot sans abattage.
    expect([t.phase, t.closed, stacksOf(t), t.carry, t.result!.carry]).toEqual(["denouement", null, [310, null], 290, 290]);
    t = advance(t, T0 + 60_000, rng);
    expect([t.closed, owed(t, "p_a"), owed(t, "p_b")]).toEqual(["maitres", [["maitres-gagne", 600]], [["quitte", 0]]]);
    expect(t.audit).toEqual({ in: 600, out: 600, bank: 0 });
    audited(t);
  });

  it("seul joueur encore à la table : il reprend son tapis, sans victoire, et la table ferme", () => {
    const rng = rngOf(17);
    // Son ami vient d'être éliminé ; il reste un robot.
    let t = advance(tourneyAt(launched(2, ["gaspard"], rng), { played: 6, stacks: [500, 0, 400] }), T0, rng);
    expect([owed(t, "p_b"), t.handNo, stacksOf(t)]).toEqual([[["maitres-perdu", 0]], 7, [490, null, 390]]);
    // En pleine main, il se couche : sa blinde reste au pot, son tapis lui revient.
    t = leave(t, "p_a", T0, rng);
    expect([t.closed, owed(t, "p_a")]).toEqual(["vide", [["quitte", 490]]]);
    audited(t);
    // Entre deux mains, de même ; et un pot resté là se partage entre ceux qui ont encore des jetons.
    const between = tourneyAt(launched(2, ["gaspard"], rng), { played: 6, stacks: [450, 0, 400], carry: 50, nextAt: T0 + 5_000 });
    const gone = leave(leave(between, "p_b", T0, rng), "p_a", T0, rng);
    expect([gone.closed, owed(gone, "p_b"), owed(gone, "p_a")]).toEqual(["vide", [["maitres-perdu", 0]], [["quitte", 475]]]);
    audited(gone);
  });

  it("un joueur déjà éliminé qui s'en va pendant le dénouement a perdu : il n'a pas « quitté »", () => {
    const rng = rngOf(18);
    const t = leave(tourneyAt(launched(3, [], rng), { played: 4, stacks: [400, 500, 0], nextAt: T0 + 5_000 }), "p_c", T0, rng);
    expect([t.closed, t.carry, owed(t, "p_c")]).toEqual([null, 0, [["maitres-perdu", 0]]]);
    audited(t);
  });

  it("partir pendant le dénouement de la dernière main ne change rien : le vainqueur a gagné, le vaincu a perdu", () => {
    for (const leaver of ["p_a", "p_b"]) {
      const rng = rngOf(19);
      const decided = tourneyAt(launched(2, ["gaspard"], rng), { played: 8, stacks: [0, 900, 0], nextAt: T0 + 5_000 });
      const t = leave(decided, leaver, T0, rng);
      expect([leaver, t.closed, owed(t, "p_a"), owed(t, "p_b")]).toEqual([leaver, "maitres", [["maitres-perdu", 0]], [["maitres-gagne", 900]]]);
      audited(t);
    }
  });

  it("un absent ne quitte pas la table tant qu'un autre joueur y joue : la blinde entame son tapis, et il revient quand il veut", () => {
    const rng = rngOf(20);
    const away = (t: TableState, seat: number, idle: number): TableState => {
      const s = copy(t);
      s.seats[seat]!.absent = true;
      s.seats[seat]!.idle = idle;
      return s;
    };
    // Absent depuis cinq mains : à une table classique, il aurait été écarté à la troisième.
    let t = advance(away(tourneyAt(launched(2, ["gaspard"], rng), { played: 8, stacks: [300, 300, 300] }), 1, 5), T0, rng);
    expect([t.closed, t.ended, t.handNo, t.hand!.players.map((p) => p.seat).sort()]).toEqual([null, [], 9, [0, 1, 2]]);
    // Il est servi, sa blinde est posée, et sa décision tombe aussitôt : il ne fait attendre personne.
    expect([t.seats[1]!.stack, playerInHand(t, 1)!.chosen, viewFor(t, "p_b", T0).options.back]).toEqual([290, true, true]);
    // Il revient : il joue de nouveau.
    t = act(t, "p_b", { type: "retour" }, T0, rng);
    expect([t.seats[1]!.absent, t.seats[1]!.idle]).toEqual([false, 0]);

    // La même absence à une table classique : écarté, avec son tapis.
    const classic = copy(friends([300, 300, 300], rng));
    classic.hand = null;
    classic.phase = "denouement";
    classic.nextAt = T0;
    for (const seat of classic.seats) seat!.stack = 300;
    const kicked = advance(away(classic, 1, 5), T0, rng);
    expect(owed(kicked, "p_b")).toEqual([["absent", 300]]);
  });

  it("celui qui reste seul avec un absent peut partir avec son tapis ; l'absent, écarté à son tour, reprend le sien", () => {
    const rng = rngOf(21);
    let t = copy(tourneyAt(launched(2, ["gaspard"], rng), { played: 8, stacks: [350, 250, 300], nextAt: T0 + 5_000 }));
    t.seats[1]!.absent = true;
    t.seats[1]!.idle = 2;
    // On ne dispute rien à quelqu'un qui n'est plus là : ce n'est pas un abandon.
    t = leave(t, "p_a", T0, rng);
    expect([t.closed, t.carry, owed(t, "p_a")]).toEqual([null, 0, [["quitte", 350]]]);
    // L'absent reste seul joueur humain : au bout de trois mains sans jouer, la table ferme et il reprend son tapis.
    t = advance(t, T0 + 10 * 60_000, rng);
    expect([t.closed, owed(t, "p_b").map(([reason]) => reason)]).toEqual(["vide", ["absent"]]);
    expect(t.ended.find((e) => e.playerId === "p_b")!.payout).toBeGreaterThanOrEqual(200);
    audited(t);
  });

  it("tous absents : la table ferme, et chacun reprend son tapis", () => {
    const rng = rngOf(22);
    const s = copy(tourneyAt(launched(2, ["gaspard"], rng), { played: 8, stacks: [350, 250, 300] }));
    for (const seat of [0, 1]) Object.assign(s.seats[seat]!, { absent: true, idle: 3 });
    const t = advance(s, T0, rng);
    expect([t.closed, owed(t, "p_a"), owed(t, "p_b")]).toEqual(["vide", [["absent", 350]], [["absent", 250]]]);
    audited(t);
  });

  it("table sans geste depuis 30 minutes : elle ferme, la main en cours est annulée, chacun reprend ce qu'il avait", () => {
    const rng = rngOf(23);
    let t = launched(3, [], rng);
    t = leave(t, "p_b", T0, rng);
    const s = copy(t);
    s.activeAt = T0 - IDLE_TABLE_MS;
    const closed = advance(s, T0, rng);
    // Chacun reprend sa blinde. Le tapis abandonné attendait toujours, avec la blinde de celui qui
    // est parti : 300 €, partagés entre ceux qui ont encore des jetons.
    expect([closed.closed, owed(closed, "p_a"), owed(closed, "p_c")]).toEqual(["inactive", [["inactive", 450]], [["inactive", 450]]]);
    expect(closed.audit).toEqual({ in: 900, out: 900, bank: 0 });
    audited(closed);
  });

  /**
   * Un tournoi entier, tous les joueurs tenus par des robots difficiles. `quitters` : la
   * chance, sur mille, qu'un joueur se lève à chaque fois que c'est à lui de décider.
   */
  function playTourney(seed: number, humans: number, bots: string[], quitters = 0): { table: TableState; hands: number } {
    const rng = rngOf(seed);
    const side = rngOf(seed + 1000);
    let now = T0;
    let t = launched(humans, bots, rng);
    const total = (humans + bots.length) * STAKE;
    for (let guard = 0; guard < 100_000 && t.phase !== "fermee"; guard++) {
      let acted = false;
      for (let i = 0; i < humans && t.phase !== "fermee"; i++) {
        // Chacun se décide en une seconde, sur la table telle qu'elle est à ce moment-là.
        now += 1_000;
        t = advance(t, now, rng);
        if (t.phase === "fermee" || seatIndexOf(t, IDS[i]!) < 0) continue;
        const move = botMove(viewFor(t, IDS[i]!, now), rng);
        if (!move) continue;
        t = quitters > 0 && side() % 1000 < quitters ? leave(t, IDS[i]!, now, rng) : act(t, IDS[i]!, move, now, rng);
        acted = true;
      }
      if (!acted && t.phase !== "fermee") {
        now = Math.max(now, nextEventAt(t)!);
        t = advance(t, now, rng);
      }
      // L'argent reste juste à chaque pas : rien n'est créé, personne ne recave.
      audited(t);
      expect(chipsOnTable(t) + t.audit.out).toBeLessThanOrEqual(total);
      // Tant que personne ne se lève, tout l'argent reste sur la table jusqu'à la fin.
      if (quitters === 0 && t.phase !== "fermee") expect([chipsOnTable(t), t.audit.out]).toEqual([total, 0]);
    }
    expect(t.phase).toBe("fermee");
    return { table: t, hands: t.handNo };
  }

  it("des tournois entiers à deux, trois et quatre joueurs, avec et sans robots : un vainqueur au plus, chacun réglé une fois", () => {
    const shapes: [number, string[]][] = [[2, []], [3, []], [4, []], [2, ["gaspard"]], [2, ["gaspard", "ondine", "hector"]], [3, ["baron", "selene"]]];
    let won = 0;
    let lost = 0;
    const lengths: number[] = [];
    for (const [humans, bots] of shapes) {
      for (let seed = 1; seed <= 12; seed++) {
        const { table: t, hands } = playTourney(seed * 31 + humans, humans, bots);
        const total = (humans + bots.length) * STAKE;
        lengths.push(hands);
        expect(t.closed).toBe("maitres");
        // Chaque joueur a une entrée, et une seule.
        expect(t.ended.map((e) => e.playerId).sort()).toEqual(IDS.slice(0, humans));
        const winners = t.ended.filter((e) => e.reason === "maitres-gagne");
        const drawn = t.ended.filter((e) => e.reason === "maitres-nul");
        expect(winners.length).toBeLessThanOrEqual(1);
        // Un match nul n'a pas de vainqueur.
        if (drawn.length > 0) expect(winners.length).toBe(0);
        for (const e of t.ended) {
          if (e.reason === "maitres-gagne") expect(e.payout).toBe(total);
          else if (e.reason === "maitres-nul") expect(e.payout).toBeGreaterThan(0);
          else expect([e.reason, e.payout]).toEqual(["maitres-perdu", 0]);
        }
        if (winners.length === 1) won += 1;
        else lost += 1;
        expect(t.audit.out).toBe(winners.length === 1 ? total : drawn.reduce((sum, e) => sum + e.payout, 0));
        // Sans robot à la table, tout l'argent retourne aux joueurs : à un vainqueur, ou à ceux d'un match nul.
        if (bots.length === 0) expect([winners.length + (drawn.length > 0 ? 1 : 0), t.audit.out]).toEqual([1, total]);
      }
    }
    expect(won).toBeGreaterThan(lost);
    expect(Math.max(...lengths)).toBeLessThan(60);
  });

  it("les mêmes, avec des joueurs qui se lèvent n'importe quand : l'argent reste juste, la fin reste nette", () => {
    const reasons = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const humans = 2 + (seed % 3);
      const bots = seed % 2 === 0 ? ["gaspard", "ondine"].slice(0, 1 + (seed % 4) / 2) : [];
      const { table: t } = playTourney(seed * 17, humans, bots, 25);
      const total = (humans + bots.length) * STAKE;
      expect(["maitres", "vide"]).toContain(t.closed);
      expect(t.ended.map((e) => e.playerId).sort()).toEqual(IDS.slice(0, humans));
      const winners = t.ended.filter((e) => e.reason === "maitres-gagne");
      expect(winners.length).toBeLessThanOrEqual(1);
      for (const e of t.ended) {
        reasons.add(e.payout > 0 ? `${e.reason}+` : e.reason);
        expect(["maitres-gagne", "maitres-perdu", "maitres-nul", "quitte"]).toContain(e.reason);
        if (e.reason === "maitres-perdu") expect(e.payout).toBe(0);
      }
      // Un vainqueur remporte tout ce qui restait sur la table : rien n'est sorti d'autre que des tapis repris.
      expect(t.audit.out).toBeLessThanOrEqual(total);
      if (winners.length === 1 && t.ended.every((e) => e === winners[0] || e.payout === 0)) expect(winners[0]!.payout).toBe(total);
      expect(chipsOnTable(t)).toBe(0);
    }
    // Les quatre sorties se sont toutes produites : gagné, perdu, abandonné sans rien, parti avec son tapis.
    expect([...reasons].filter((reason) => reason !== "maitres-nul+").sort()).toEqual(["maitres-gagne+", "maitres-perdu", "quitte", "quitte+"]);
  });
});

// ===========================================================================
// Le serveur : les mêmes règles, par les routes, avec le stockage en mémoire.

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

const ALL_PLACES = PLACES.map((place) => place.id);
const NO_WINS = { kiosque: 0, cafe: 0, casino: 0, salon: 0, cercle: 0, yacht: 0, banque: 0, lune: 0 };
/** De quoi s'asseoir trois fois à la Table des Maîtres. */
const PURSE = 900 * BN;

function makeWorld(seed = 0x2545f491) {
  const storage = new MemoryStorage();
  let now = T0;
  let x = seed >>> 0 || 1;
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
      // xorshift32 : un hasard reproductible, propre à chaque monde.
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return x >>> 0;
    },
  };

  async function call<T = any>(method: string, path: string, body?: unknown, auth?: string): Promise<Reply<T>> {
    const headers: Record<string, string> = {};
    if (auth) headers.authorization = `Bearer ${auth}`;
    if (body !== undefined) headers["content-type"] = "application/json";
    const res = await handle(new Request(`https://grattouille.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), deps);
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

  async function signup(pseudo: string, purse: number): Promise<Account> {
    const r = await call("POST", "/api/players", { pseudo, species: "renard" });
    if (r.status !== 201) throw new Error(`création refusée : ${JSON.stringify(r.body)}`);
    storage.poke(r.body.playerId, (p) => { p.balance = purse; });
    return { playerId: r.body.playerId, code: r.body.code, auth: `${r.body.playerId}.${r.body.code}`, pseudo };
  }

  /** Un joueur qui a relevé les huit défis : la Table des Maîtres lui est ouverte. */
  async function master(pseudo: string, purse = PURSE): Promise<Account> {
    const a = await signup(pseudo, purse);
    storage.poke(a.playerId, (p) => { p.pokerWins = [...ALL_PLACES]; });
    return a;
  }

  const poker = {
    lobby: (a: Account) => call<PokerLobbyResponse>("GET", "/api/poker", undefined, a.auth),
    create: (a: Account, body: unknown) => call<PokerTableResponse>("POST", "/api/poker/tables", body, a.auth),
    join: (a: Account, code: string, buyIn: number) => call<PokerTableResponse>("POST", "/api/poker/join", { code, buyIn }, a.auth),
    poll: (a: Account, code: string) => call<PokerTableResponse>("GET", `/api/poker/table?code=${code}`, undefined, a.auth),
    act: (a: Account, code: string, action: PokerAction, step?: number) =>
      call<PokerTableResponse>("POST", "/api/poker/act", step === undefined ? { code, action } : { code, action, step }, a.auth),
  };

  const me = async (a: Account): Promise<PlayerState> => (await call("GET", "/api/me", undefined, a.auth)).body.state;

  return {
    storage, deps, call, crashing, signup, master, poker, me,
    record: (a: Account) => storage.peek(a.playerId)!,
    balance: (a: Account) => storage.peek(a.playerId)!.balance,
    table: (code: string) => storage.peekTable(code),
    advance: (ms: number) => { now += ms; },
    now: () => now,
    calls: () => calls,
    failAt: (method: StorageMethod | "*", countdown = 1, when: "before" | "after" = "before") => { fault = { method, countdown, when }; },
  };
}

type World = ReturnType<typeof makeWorld>;

/** S'assoit à la Table des Maîtres. Rend le code de la table. */
async function sitAtMasters(w: World, a: Account): Promise<string> {
  const r = await w.poker.create(a, { maitres: true });
  if (r.status !== 201) throw new Error(`table refusée : ${JSON.stringify(r.body)}`);
  return r.body.view!.code;
}

/** Les lieux des quatre hôtes assis à cette table. */
function placesAt(w: World, code: string): string[] {
  return w.table(code)!.seats.filter((s) => s !== null && s.bot !== null).map((s) => PLACES.find((place) => place.host === s!.bot)!.id);
}

const HOST_HANDS = ["Kc Kd 9s 4h 3c", "Qs Qd 8c 6h 2s", "Jh Jd 9c 6s 3d", "Th Td 9h 5s 4d"];
const WORST = "7h 5d 4c 3s 2h";

/**
 * Tout le monde à tapis dès la première main, avec les mains qu'on choisit (derrière le dos
 * du serveur), puis la main se déroule jusqu'au dénouement : le joueur joue franc jeu et
 * n'accuse personne, les hôtes non plus.
 */
async function everyoneAllIn(w: World, a: Account, code: string, mine: string): Promise<TableView> {
  w.storage.pokeTable(code, (t) => {
    for (const p of t.hand!.players) {
      const seat = t.seats[p.seat]!;
      p.cards = hand(seat.bot === null ? mine : HOST_HANDS[p.seat - 1]!);
      p.committed += seat.stack;
      t.hand!.pot += seat.stack;
      seat.stack = 0;
      p.allIn = true;
      // Les hôtes ont choisi : franc jeu.
      if (seat.bot !== null) { p.chosen = true; p.actAt = null; }
    }
  });
  const fair = await w.poker.act(a, code, { type: "franc-jeu" });
  expect(fair.body.view!.phase).toBe("abattage");
  // Les hôtes ne disent rien.
  w.storage.pokeTable(code, (t) => {
    for (const p of t.hand!.players) if (t.seats[p.seat]!.bot !== null) { p.spoke = true; p.actAt = null; }
  });
  const quiet = await w.poker.act(a, code, { type: "rien" });
  expect(quiet.body.view!.phase).toBe("denouement");
  return quiet.body.view!;
}

/** Joue la table par l'API jusqu'à en sortir, le joueur tenu par un robot difficile. */
async function playByApi(w: World, a: Account, code: string, side: Random32, each?: (view: TableView) => void): Promise<PokerTableResponse> {
  for (let i = 0; i < 8_000; i++) {
    w.advance(1_000);
    const polled = await w.poker.poll(a, code);
    expect(polled.status).toBe(200);
    if (polled.body.left) return polled.body;
    const view = polled.body.view!;
    each?.(view);
    const move = botMove(view, side);
    if (!move) continue;
    const acted = await w.poker.act(a, code, move, view.step);
    expect([move.type, acted.status]).toEqual([move.type, 200]);
    if (acted.body.left) return acted.body;
  }
  throw new Error("la table ne s'est pas dénouée");
}

/** Ce que font les requêtes suivantes après une panne : le hall, le temps qui passe, la table relue. */
async function recover(w: World, accounts: Account[]): Promise<void> {
  for (const a of accounts) expect((await w.poker.lobby(a)).status).toBe(200);
  w.advance(RESERVE_MS + 1_000);
  for (const code of w.storage.tableCodes()) for (const a of accounts) await w.poker.poll(a, code);
  for (const a of accounts) expect((await w.poker.lobby(a)).status).toBe(200);
}

interface Cut<C> {
  /** Le monde juste avant la requête à couper. Doit être reproductible. */
  setup: (w: World) => Promise<C>;
  /** La requête pendant laquelle le serveur tombe. */
  request: (w: World, ctx: C) => Promise<Reply>;
  accounts: (ctx: C) => Account[];
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
      w.failAt("*", k, when);
      const crashed = await w.crashing(() => cut.request(w, ctx));
      expect([label, crashed.status, crashed.body.error?.code]).toEqual([label, 500, "SERVER_ERROR"]);
      await recover(w, cut.accounts(ctx));
      await cut.afterRecovery(w, ctx, label);
      cuts += 1;
    }
  }
  return cuts;
}

// ---------------------------------------------------------------------------

describe("s'asseoir à la Table des Maîtres", () => {
  it("MASTERS_LOCKED : fermée tant que les huit défis ne sont pas tous relevés", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", PURSE);
    for (const n of [0, 1, 7]) {
      w.storage.poke(a.playerId, (p) => { p.pokerWins = ALL_PLACES.slice(0, n); });
      const r = await w.poker.create(a, { maitres: true }) as Reply;
      expect([n, r.status, r.body.error?.code]).toEqual([n, 403, "MASTERS_LOCKED"]);
      // Une phrase pour le joueur, comme les autres refus.
      expect(Object.keys(r.body)).toEqual(["error"]);
      expect(r.body.error.message).toBe("La Table des Maîtres n'ouvre qu'à qui a relevé les huit défis.");
      expect((await w.poker.lobby(a)).body.masters).toMatchObject({ open: false, defis: n, affordable: true });
    }
    // Sept défis dans le désordre, et un lieu qui n'existe pas : toujours fermée.
    w.storage.poke(a.playerId, (p) => { p.pokerWins = ["lune", "atlantide", ...ALL_PLACES.slice(0, 6)]; });
    expect((await w.poker.create(a, { maitres: true }) as Reply).body.error.code).toBe("MASTERS_LOCKED");
    // Aucun refus n'a rien coûté ni rien créé.
    expect([w.balance(a), w.record(a).poker ?? null, w.storage.tableCodes()]).toEqual([PURSE, null, []]);
    // Le huitième défi relevé, elle ouvre.
    w.storage.poke(a.playerId, (p) => { p.pokerWins = [...ALL_PLACES].reverse(); });
    expect((await w.poker.lobby(a)).body.masters).toMatchObject({ open: true, defis: 8 });
    expect((await w.poker.create(a, { maitres: true })).status).toBe(201);
  });

  it("BAD_REQUEST : `maitres` vaut `true`, et ne se combine ni avec une table de la maison ni avec un défi", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    for (const body of [
      { maitres: false }, { maitres: "oui" }, { maitres: 1 }, { maitres: null },
      { maitres: true, defi: "kiosque" }, { maitres: true, maison: "kiosque" }, { maitres: true, ack: "t_x" },
    ]) {
      const r = await w.poker.create(a, body) as Reply;
      expect([JSON.stringify(body), r.status, r.body.error?.code]).toEqual([JSON.stringify(body), 400, "BAD_REQUEST"]);
    }
    expect([w.balance(a), w.storage.tableCodes()]).toEqual([PURSE, []]);
    // Sans compte : comme partout.
    expect((await w.call("POST", "/api/poker/tables", { maitres: true })).status).toBe(401);
  });

  it("BUYIN_UNAFFORDABLE : il faut 300 Bn€ dans la bourse, tickets déclarés compris", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel", MASTERS_BUYIN - 25);
    expect((await w.poker.lobby(a)).body.masters).toEqual({
      open: true, defis: 8, blind: MASTERS_BLIND, buyIn: MASTERS_BUYIN, won: 0, affordable: false,
    });
    const poor = await w.poker.create(a, { maitres: true }) as Reply;
    expect([poor.status, poor.body.error?.code]).toEqual([409, "BUYIN_UNAFFORDABLE"]);
    expect([w.balance(a), w.storage.tableCodes()]).toEqual([MASTERS_BUYIN - 25, []]);
    // Un ticket de 25 € gratté et déclaré avec la requête : le compte y est, à l'euro près.
    w.storage.poke(a.playerId, (p) => { p.pending = [{ id: "t_gagnant00000", type: "tirelire", gain: 25, seed: 1, at: T0 }]; });
    expect((await w.poker.create(a, { maitres: true }) as Reply).body.error.code).toBe("BUYIN_UNAFFORDABLE");
    const r = await w.poker.create(a, { maitres: true, ack: ["t_gagnant00000"] });
    expect(r.status).toBe(201);
    expect(r.body.state).toMatchObject({ balance: 0, pending: [] });
    expect(w.record(a).poker).toMatchObject({ seq: 1, paid: MASTERS_BUYIN });
  });

  it("ALREADY_SEATED : un joueur ne s'assoit qu'à une table à la fois", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    const house = (await w.poker.create(a, { maison: "kiosque", buyIn: 50 })).body.view!.code;
    const refused = await w.poker.create(a, { maitres: true }) as Reply;
    expect([refused.status, refused.body.error?.code]).toEqual([409, "ALREADY_SEATED"]);
    await w.poker.act(a, house, { type: "quitter" });
    const code = await sitAtMasters(w, a);
    // Assis aux Maîtres, il ne s'assoit nulle part ailleurs, pas même à une autre Table des Maîtres.
    for (const body of [{ maitres: true }, { defi: "kiosque" }, { maison: "kiosque" }]) {
      expect((await w.poker.create(a, body) as Reply).body.error?.code).toBe("ALREADY_SEATED");
    }
    expect(w.storage.tableCodes()).toEqual([code]);
    expect(w.record(a).poker).toMatchObject({ code, paid: MASTERS_BUYIN });
  });

  it("la table : le joueur et quatre hôtes tirés au sort, 300 Bn€ chacun, et la première main est donnée", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    const before = await w.me(a);
    const r = await w.poker.create(a, { maitres: true });
    expect(r.status).toBe(201);
    const view = r.body.view!;
    expect(view.code).toMatch(/^[A-HJ-KM-NP-TV-Z2-9]{5}$/);
    expect(view).toMatchObject({
      kind: "maitres", place: null, difficulty: "difficile", minBuyIn: MASTERS_BUYIN, maxBuyIn: MASTERS_BUYIN,
      blind: MASTERS_BLIND, rise: { hand: 17, blind: 2 * MASTERS_BLIND }, started: true, phase: "triche", handNo: 1,
      you: 0, pot: 5 * MASTERS_BLIND, closed: null,
    });
    // Cinq sièges : lui, puis quatre hôtes distincts, chacun avec sa cave moins la blinde.
    expect(view.seats).toHaveLength(5);
    expect(view.seats[0]).toMatchObject({ pseudo: "Marcel", bot: null, stack: MASTERS_BUYIN - MASTERS_BLIND, funded: true, inHand: true });
    const hosts = view.seats.slice(1).map((s) => s!.bot!);
    expect(new Set(hosts).size).toBe(4);
    expect(hosts.every((id) => HOSTS.includes(id))).toBe(true);
    expect(view.seats.slice(1).map((s) => [s!.pseudo, s!.stack, s!.committed])).toEqual(
      Array.from({ length: 4 }, () => [null, MASTERS_BUYIN - MASTERS_BLIND, MASTERS_BLIND]),
    );
    expect(view.seats.every((s) => !("out" in s!))).toBe(true);
    // Pas de recave, pas de lancement : c'est un tournoi, et il est parti.
    expect(view.options).toMatchObject({ start: false, rebuy: null, cheat: true });
    // Sa cave a quitté sa bourse ; sa fortune, elle, n'a pas bougé.
    expect(r.body.state).toMatchObject({ balance: PURSE - MASTERS_BUYIN, poker: { code: view.code }, masters: 0, fortune: before.fortune });
    expect(w.record(a).poker).toMatchObject({ code: view.code, seq: 1, paid: MASTERS_BUYIN });
    const stored = w.table(view.code)!;
    expect(stored).toMatchObject({ kind: "maitres", place: null, blind: MASTERS_BLIND, minBuyIn: MASTERS_BUYIN, maxBuyIn: MASTERS_BUYIN, difficulty: "difficile" });
    expect(stored.audit).toEqual({ in: MASTERS_BUYIN, out: 0, bank: 4 * MASTERS_BUYIN });
    expect(chipsOnTable(stored)).toBe(ALL);
    // Le hall et GET /api/me disent où il est assis.
    expect((await w.poker.lobby(a)).body.seat).toEqual({ code: view.code, kind: "maitres", place: null });
    expect((await w.me(a)).poker).toEqual({ code: view.code });
  });

  it("personne d'autre ne s'y assoit ni ne la regarde, et personne n'y recave", async () => {
    const w = makeWorld();
    const [a, b] = [await w.master("Marcel"), await w.master("Lulu")];
    const code = await sitAtMasters(w, a);
    const joined = await w.poker.join(b, code, MASTERS_BUYIN) as Reply;
    expect([joined.status, joined.body.error?.code]).toEqual([404, "TABLE_NOT_FOUND"]);
    const peeked = await w.poker.poll(b, code) as Reply;
    expect([peeked.status, peeked.body.error?.code]).toEqual([404, "TABLE_NOT_FOUND"]);
    expect([w.balance(b), w.record(b).poker ?? null]).toEqual([PURSE, null]);
    for (const action of [{ type: "recaver", amount: MASTERS_BLIND }, { type: "lancer" }] as PokerAction[]) {
      const r = await w.poker.act(a, code, action) as Reply;
      expect([action.type, r.status, r.body.error?.code]).toEqual([action.type, 409, "ACTION_IMPOSSIBLE"]);
    }
    expect(w.balance(a)).toBe(PURSE - MASTERS_BUYIN);
    expect(chipsOnTable(w.table(code)!)).toBe(ALL);
  });

  it("le tirage change d'une table à l'autre", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    const tables: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = await sitAtMasters(w, a);
      const hosts = w.table(code)!.seats.slice(1).map((s) => s!.bot!);
      expect(new Set(hosts).size).toBe(4);
      expect(hosts.every((id) => HOSTS.includes(id))).toBe(true);
      tables.push(hosts.join(" "));
      // Il se lève aussitôt : sa blinde reste au pot.
      const r = await w.poker.act(a, code, { type: "quitter" });
      expect(r.body.left).toEqual({ reason: "quitte", payout: MASTERS_BUYIN - MASTERS_BLIND, bonus: 0 });
      expect(r.body.view).toMatchObject({ phase: "fermee", closed: "vide" });
    }
    expect(new Set(tables).size).toBeGreaterThanOrEqual(6);
    expect(new Set(tables.flatMap((x) => x.split(" "))).size).toBeGreaterThanOrEqual(7);
    // Huit blindes perdues, rien d'autre ; ni victoire, ni histoire d'hôte, ni main comptée.
    expect(w.balance(a)).toBe(PURSE - 8 * MASTERS_BLIND);
    expect(await w.me(a)).toMatchObject({ masters: 0, hostWins: { ...NO_WINS, ...Object.fromEntries(ALL_PLACES.map((id) => [id, 1])) }, pokerStats: stat(0) });
    expect(w.storage.tableCodes()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("jouer la Table des Maîtres jusqu'au bout", () => {
  it("gagnée : il repart avec tout l'argent de la table, et la victoire est comptée une fois", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    const code = await sitAtMasters(w, a);
    const places = placesAt(w, code);
    const shown = await everyoneAllIn(w, a, code, ACES);
    // Le dénouement de la dernière main : les quatre hôtes sont éliminés, la table est encore là.
    expect(shown.seats.map((s) => [s!.stack, s!.out ?? false])).toEqual([[ALL, false], [0, true], [0, true], [0, true], [0, true]]);
    expect(shown.options.next).toBe(true);
    expect(w.balance(a)).toBe(PURSE - MASTERS_BUYIN);
    w.advance(RESULT_MS);
    const r = await w.poker.poll(a, code);
    expect(r.status).toBe(200);
    expect(r.body.view).toMatchObject({ phase: "fermee", closed: "maitres", you: null, seats: [null, null, null, null, null] });
    // 1 500 Bn€ : sa cave et celles des quatre hôtes. Pas de cagnotte : le gain, c'est la table.
    expect(r.body.left).toEqual({ reason: "maitres-gagne", payout: ALL, bonus: 0 });
    expect(places).toHaveLength(4);
    expect(r.body.state).toMatchObject({
      balance: PURSE - MASTERS_BUYIN + ALL, masters: 1, pokerStats: stat(1, 1),
      // Elle ne compte pas comme une victoire contre ses quatre hôtes : seules les manches d'un défi ouvrent une histoire.
      hostWins: { ...NO_WINS, ...Object.fromEntries(ALL_PLACES.map((id) => [id, 1])) },
    });
    expect(w.record(a).hostWins).toBeUndefined();
    expect(r.body.state!.poker).toBeUndefined();
    expect(w.record(a)).toMatchObject({ balance: 2_100 * BN, masters: 1, poker: null });
    expect(w.storage.tableCodes()).toEqual([]);
    // Rejouer le règlement : la table n'existe plus, et plus rien ne bouge.
    const frozen = JSON.stringify(w.record(a));
    expect((await w.poker.poll(a, code) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    expect((await w.poker.act(a, code, { type: "quitter" }) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    const lobby = (await w.poker.lobby(a)).body;
    expect([lobby.seat, lobby.masters]).toEqual([null, { open: true, defis: 8, blind: MASTERS_BLIND, buyIn: MASTERS_BUYIN, won: 1, affordable: true }]);
    expect(await w.me(a)).toMatchObject({ masters: 1, balance: 2_100 * BN });
    expect(JSON.stringify(w.record(a))).toBe(frozen);
  });

  it("gagnée deux fois : deux victoires, et la table se rejoue autant qu'on veut", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    for (const wins of [1, 2]) {
      const code = await sitAtMasters(w, a);
      await everyoneAllIn(w, a, code, ACES);
      // Il demande la suite sans attendre la fin de l'affichage : la table se dénoue aussitôt.
      const r = await w.poker.act(a, code, { type: "suite" });
      expect(r.body.left).toEqual({ reason: "maitres-gagne", payout: ALL, bonus: 0 });
      expect(r.body.state).toMatchObject({ masters: wins, balance: PURSE + wins * 4 * MASTERS_BUYIN, pokerStats: stat(wins, wins) });
    }
    const state = await w.me(a);
    for (const place of ALL_PLACES) expect([place, state.hostWins[place]]).toEqual([place, 1]);
    expect((await w.poker.lobby(a)).body.masters.won).toBe(2);
  });

  it("perdue : sa cave est perdue, rien n'est compté comme une victoire, et elle se retente", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    const code = await sitAtMasters(w, a);
    const shown = await everyoneAllIn(w, a, code, WORST);
    // Les rois ont tout pris : lui et trois hôtes sont éliminés d'un coup.
    expect(shown.seats.map((s) => [s!.stack, s!.out ?? false])).toEqual([[0, true], [ALL, false], [0, true], [0, true], [0, true]]);
    w.advance(RESULT_MS);
    const r = await w.poker.poll(a, code);
    expect(r.body.view).toMatchObject({ phase: "fermee", closed: "maitres", you: null });
    expect(r.body.left).toEqual({ reason: "maitres-perdu", payout: 0, bonus: 0 });
    expect(r.body.state).toMatchObject({ balance: PURSE - MASTERS_BUYIN, masters: 0, pokerStats: stat(1, 0) });
    expect(r.body.state!.hostWins).toEqual({ ...NO_WINS, ...Object.fromEntries(ALL_PLACES.map((id) => [id, 1])) });
    // Rien n'est écrit qui ne soit mérité : ni victoire, ni compte d'hôtes.
    expect([w.record(a).masters, w.record(a).hostWins, w.record(a).poker]).toEqual([undefined, undefined, null]);
    expect(w.storage.tableCodes()).toEqual([]);
    expect((await w.poker.lobby(a)).body.masters).toMatchObject({ won: 0, affordable: true });
    expect((await w.poker.create(a, { maitres: true })).status).toBe(201);
    expect(w.balance(a)).toBe(PURSE - 2 * MASTERS_BUYIN);
  });

  it("quittée en cours de route : son tapis, sans victoire", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    const code = await sitAtMasters(w, a);
    const r = await w.poker.act(a, code, { type: "quitter" });
    expect(r.body.left).toEqual({ reason: "quitte", payout: MASTERS_BUYIN - MASTERS_BLIND, bonus: 0 });
    expect(r.body.view).toMatchObject({ phase: "fermee", closed: "vide" });
    expect(r.body.state).toMatchObject({ balance: PURSE - MASTERS_BLIND, masters: 0, pokerStats: stat(0) });
    expect([w.record(a).masters, w.record(a).hostWins, w.record(a).pokerStats]).toEqual([undefined, undefined, undefined]);
    expect(w.storage.tableCodes()).toEqual([]);
  });

  it("partir pendant le dénouement de la dernière main : la victoire reste acquise", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    const code = await sitAtMasters(w, a);
    await everyoneAllIn(w, a, code, ACES);
    w.advance(1_000);
    const r = await w.poker.act(a, code, { type: "quitter" });
    expect(r.body.left).toEqual({ reason: "maitres-gagne", payout: ALL, bonus: 0 });
    expect(r.body.view).toMatchObject({ phase: "fermee", closed: "maitres" });
    expect(r.body.state).toMatchObject({ masters: 1, balance: PURSE + 4 * MASTERS_BUYIN });
    // Et une défaite acquise reste une défaite.
    const again = await sitAtMasters(w, a);
    await everyoneAllIn(w, a, again, WORST);
    const lost = await w.poker.act(a, again, { type: "quitter" });
    expect(lost.body.left).toEqual({ reason: "maitres-perdu", payout: 0, bonus: 0 });
    expect(lost.body.state).toMatchObject({ masters: 1, balance: PURSE + 3 * MASTERS_BUYIN });
  });

  it("le joueur ferme le jeu en pleine table : écarté pour absence, il retrouve son tapis au hall", async () => {
    const w = makeWorld();
    const a = await w.master("Marcel");
    const code = await sitAtMasters(w, a);
    w.advance(3_600_000);
    const lobby = await w.poker.lobby(a);
    expect(lobby.body.seat).toBeNull();
    const record = w.record(a);
    expect(record.poker).toBeNull();
    // Il n'a perdu que les blindes des mains jouées sans lui (et gagné, peut-être, un pot à la parole).
    expect(record.balance).toBeGreaterThanOrEqual(PURSE - 5 * MASTERS_BLIND);
    expect(record.balance).toBeLessThan(PURSE + MASTERS_BUYIN);
    expect([record.masters, record.hostWins]).toEqual([undefined, undefined]);
    expect(lobby.body.state.pokerStats.hands).toBeGreaterThanOrEqual(4);
    expect(w.storage.tableCodes()).toEqual([]);
    expect((await w.poker.poll(a, code) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
  });

  it("des tables entières par l'API, dans les deux sens : la blinde monte, les hôtes tombent, tout est versé", async () => {
    const outcomes = new Map<string, number>();
    for (const seed of [11, 12, 13, 14, 15, 16]) {
      const w = makeWorld(seed);
      const a = await w.master("Marcel");
      const code = await sitAtMasters(w, a);
      const out = new Set<number>();
      const blinds = new Map<number, number>();
      let last: TableView | null = null;
      const end = await playByApi(w, a, code, rngOf(900 + seed), (view) => {
        last = view;
        // La bourse ne bouge pas pendant la partie, et l'argent de la table non plus.
        if (view.options.rebuy !== null) throw new Error("une recave est offerte");
        if (view.phase === "triche") blinds.set(view.handNo, view.blind);
        for (const seat of view.seats) {
          if (seat!.out) out.add(seat!.seat);
          else if (out.has(seat!.seat)) throw new Error("un éliminé est revenu");
        }
      });
      const stored = w.record(a);
      const view = last as TableView | null;
      expect(view).not.toBeNull();
      expect(end.view).toMatchObject({ phase: "fermee", closed: "maitres", you: null });
      const won = end.left!.reason === "maitres-gagne";
      outcomes.set(end.left!.reason, (outcomes.get(end.left!.reason) ?? 0) + 1);
      expect(end.left).toEqual({ reason: won ? "maitres-gagne" : "maitres-perdu", payout: won ? ALL : 0, bonus: 0 });
      expect(end.state).toMatchObject({ balance: PURSE - MASTERS_BUYIN + (won ? ALL : 0), masters: won ? 1 : 0 });
      expect([stored.balance, stored.poker, stored.masters]).toEqual([end.state!.balance, null, won ? 1 : undefined]);
      // Gagnée : les quatre hôtes sont tombés. Perdue : son propre siège était marqué.
      if (won) expect([...out].sort()).toEqual([1, 2, 3, 4]);
      else expect(out.has(0)).toBe(true);
      // Chaque main jouée a suivi le barème, et chacune est comptée au joueur, une fois.
      for (const [main, blind] of blinds) expect([main, blind]).toEqual([main, mastersBlind(MASTERS_BLIND, main)]);
      expect(blinds.size).toBe(view!.handNo);
      expect(end.state!.pokerStats.hands).toBe(view!.handNo);
      expect(w.storage.tableCodes()).toEqual([]);
    }
    // Les deux fins se sont produites.
    expect(outcomes.get("maitres-gagne") ?? 0).toBeGreaterThanOrEqual(1);
    expect(outcomes.get("maitres-perdu") ?? 0).toBeGreaterThanOrEqual(1);
    expect([...outcomes.keys()].sort()).toEqual(["maitres-gagne", "maitres-perdu"]);
  });
});

// ---------------------------------------------------------------------------

describe("la victoire, comptée une seule fois", () => {
  /** La table arrêtée au dénouement de sa dernière main : les quatre hôtes sont ruinés. */
  async function wonTable(w: World): Promise<{ a: Account; code: string; places: string[] }> {
    const a = await w.master("Marcel");
    const code = await sitAtMasters(w, a);
    w.storage.pokeTable(code, (t) => {
      t.hand = null;
      t.phase = "denouement";
      t.nextAt = w.now() + RESULT_MS;
      t.handNo = 40;
      t.seats.forEach((seat, i) => { seat!.stack = i === 0 ? ALL : 0; });
      t.seats[0]!.stats = { hands: 40, pots: 12, unmasked: 5, caught: 3 };
    });
    w.advance(RESULT_MS);
    return { a, code, places: placesAt(w, code) };
  }

  function expectWonOnce(w: World, a: Account, places: string[], label: string): void {
    const p = w.record(a);
    expect([label, p.balance, p.masters, p.poker, p.pokerStats, w.storage.tableCodes()]).toEqual([
      label, PURSE + 4 * MASTERS_BUYIN, 1, null, { hands: 40, pots: 12, unmasked: 5, caught: 3 }, [],
    ]);
    // Aucune victoire contre un hôte n'est comptée ici : le compte n'en porte pas la trace.
    expect([label, places.length, p.hostWins]).toEqual([label, 4, undefined]);
  }

  it("rejouer la requête de règlement ne recrédite ni ne recompte", async () => {
    const w = makeWorld();
    const { a, code, places } = await wonTable(w);
    // La bourse est créditée, mais l'accusé de réception de la table n'a pas lieu : elle croit devoir encore.
    w.failAt("mutateTable", 2);
    const crashed = await w.crashing(() => w.poker.poll(a, code));
    expect(crashed.status).toBe(500);
    expect(w.record(a)).toMatchObject({ balance: PURSE + 4 * MASTERS_BUYIN, masters: 1, poker: null });
    expect(w.table(code)!.ended).toMatchObject([{ playerId: a.playerId, payout: ALL, reason: "maitres-gagne" }]);
    // Dix requêtes plus tard : toujours une victoire, toujours 2 100 Bn€.
    for (let i = 0; i < 5; i++) {
      const r = await w.poker.poll(a, code);
      // La table dit encore pourquoi il n'y est plus, sans rien reverser.
      if (r.status === 200) expect(r.body.left).toMatchObject({ reason: "maitres-gagne" });
      await w.poker.lobby(a);
    }
    expectWonOnce(w, a, places, "rejoué");
    const state = await w.me(a);
    expect(state).toMatchObject({ masters: 1, balance: 2_100 * BN, pokerStats: { hands: 40, pots: 12, unmasked: 5, caught: 3 } });
    for (const place of ALL_PLACES) expect([place, state.hostWins[place]]).toEqual([place, 1]);
  });

  it("coupée à chaque écriture : la table est versée une fois, la victoire comptée une fois", async () => {
    const cuts = await cutEverywhere({
      setup: (w) => wonTable(w),
      accounts: ({ a }) => [a],
      request: (w, { a, code }) => w.poker.poll(a, code),
      afterRecovery: async (w, { a, places }, label) => {
        expectWonOnce(w, a, places, label);
        expect([label, (await w.poker.lobby(a)).body.masters.won]).toEqual([label, 1]);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("coupée pendant qu'il quitte la table gagnée : pareil", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const a = await w.master("Marcel");
        const code = await sitAtMasters(w, a);
        const places = placesAt(w, code);
        await everyoneAllIn(w, a, code, ACES);
        return { a, code, places };
      },
      accounts: ({ a }) => [a],
      request: (w, { a, code }) => w.poker.act(a, code, { type: "quitter" }),
      afterRecovery: (w, { a, places }, label) => {
        const p = w.record(a);
        expect([label, p.balance, p.masters, p.poker, p.pokerStats, w.storage.tableCodes()]).toEqual([
          label, PURSE + 4 * MASTERS_BUYIN, 1, null, stat(1, 1), [],
        ]);
        expect([label, places.length, p.hostWins]).toEqual([label, 4, undefined]);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("s'asseoir, coupé à chaque écriture : il est assis avec sa cave, ou il n'a rien payé", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => ({ a: await w.master("Marcel") }),
      accounts: ({ a }) => [a],
      request: (w, { a }) => w.poker.create(a, { maitres: true }),
      afterRecovery: async (w, { a }, label) => {
        const p = w.record(a);
        if (p.poker) {
          const t = w.table(p.poker.code)!;
          expect([label, p.balance, t.seats[0]!.received, p.poker.paid, t.kind]).toEqual([label, PURSE - MASTERS_BUYIN, MASTERS_BUYIN, MASTERS_BUYIN, "maitres"]);
          // Il s'en va : il retrouve tout, sauf ce que les mains jouées sans lui ont coûté.
          await w.poker.act(a, p.poker.code, { type: "quitter" });
        }
        const after = w.record(a);
        expect([label, after.poker ?? null, after.masters, w.storage.tableCodes()]).toEqual([label, null, undefined, []]);
        expect(after.balance).toBeGreaterThan(PURSE - MASTERS_BUYIN);
        expect(after.balance).toBeLessThanOrEqual(PURSE + MASTERS_BUYIN);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------------

describe("le hall", () => {
  it("dit où en est la Table des Maîtres : fermée ou ouverte, à sa portée ou non, combien de fois gagnée", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 0);
    const fresh = (await w.poker.lobby(a)).body;
    // La forme du hall : les champs d'avant, plus `masters`.
    expect(Object.keys(fresh).sort()).toEqual(["blinds", "challenges", "houses", "masters", "seat", "state"]);
    expect(fresh.masters).toEqual({ open: false, defis: 0, blind: 10 * BN, buyIn: 300 * BN, won: 0, affordable: false });
    const at = async (change: (p: ReturnType<World["record"]>) => void) => {
      w.storage.poke(a.playerId, change);
      return (await w.poker.lobby(a)).body.masters;
    };
    // Riche mais trois défis seulement : fermée, et le hall dit combien il en manque.
    expect(await at((p) => { p.balance = PURSE; p.pokerWins = ["casino", "kiosque", "cafe"]; })).toMatchObject({ open: false, defis: 3, affordable: true });
    // Les huit défis, mais un euro trop court.
    expect(await at((p) => { p.balance = MASTERS_BUYIN - 1; p.pokerWins = [...ALL_PLACES]; })).toMatchObject({ open: true, defis: 8, affordable: false });
    expect(await at((p) => { p.balance = MASTERS_BUYIN; })).toMatchObject({ open: true, affordable: true, won: 0 });
    // Ses victoires passées ; un compteur illisible vaut zéro.
    expect((await at((p) => { p.masters = 3; })).won).toBe(3);
    expect((await at((p) => { (p as unknown as { masters: unknown }).masters = "beaucoup"; })).won).toBe(0);
    // Regarder le hall n'écrit rien dans le compte.
    const frozen = JSON.stringify(w.record(a));
    await w.poker.lobby(a);
    expect(JSON.stringify(w.record(a))).toBe(frozen);
  });
});

// ---------------------------------------------------------------------------

describe("les compteurs du poker, versés avec le tapis", () => {
  /** Une table de deux joueurs, la partie lancée : on en est à la triche de la première main. */
  async function duel(w: World): Promise<{ a: Account; b: Account; code: string }> {
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    const code = (await w.poker.create(a, { blind: 10, maxBuyIn: 1000, seats: 2, bots: 0, buyIn: 500 })).body.view!.code;
    expect((await w.poker.join(b, code, 500)).status).toBe(200);
    expect((await w.poker.act(a, code, { type: "lancer" })).status).toBe(200);
    return { a, b, code };
  }

  /** Une main entière : Lulu (siège 1) se fait un brelan, Marcel (siège 0) la démasque et prend le pot. */
  async function caughtHand(w: World, a: Account, b: Account, code: string): Promise<void> {
    w.storage.pokeTable(code, (t) => {
      t.hand!.players.find((p) => p.seat === 0)!.cards = hand(ACES);
      t.hand!.players.find((p) => p.seat === 1)!.cards = hand(KINGS);
    });
    expect((await w.poker.act(b, code, { type: "tricher", index: 2, card: "Kh" })).status).toBe(200);
    expect((await w.poker.act(a, code, { type: "franc-jeu" })).status).toBe(200);
    for (let i = 0; i < 2; i++) {
      const turn = w.table(code)!.hand!.turn;
      expect((await w.poker.act(turn === 0 ? a : b, code, { type: "parole" })).status).toBe(200);
    }
    expect((await w.poker.act(a, code, { type: "accuser", seat: 1 })).status).toBe(200);
    const r = await w.poker.act(b, code, { type: "rien" });
    expect(r.body.view).toMatchObject({ phase: "denouement", result: { unmasked: [{ seat: 1 }] } });
  }

  it("pendant la partie rien ne bouge ; en partant, chacun reçoit les siens", async () => {
    const w = makeWorld();
    const { a, b, code } = await duel(w);
    await caughtHand(w, a, b, code);
    // La table les tient, siège par siège ; les comptes, eux, n'ont pas encore bougé.
    expect(w.table(code)!.seats.map((s) => s!.stats)).toEqual([stat(1, 1, 1, 0), stat(1, 0, 0, 1)]);
    expect([(await w.me(a)).pokerStats, (await w.me(b)).pokerStats]).toEqual([stat(0), stat(0)]);
    expect([w.record(a).pokerStats, w.record(b).pokerStats]).toEqual([undefined, undefined]);
    // Lulu s'en va : son tapis et ses compteurs arrivent ensemble, dans la même réponse.
    const gone = await w.poker.act(b, code, { type: "quitter" });
    expect(gone.body.left).toEqual({ reason: "quitte", payout: 490, bonus: 0 });
    expect(gone.body.state).toMatchObject({ balance: 4_990, pokerStats: stat(1, 0, 0, 1) });
    expect(w.record(b).pokerStats).toEqual(stat(1, 0, 0, 1));
    // Marcel est toujours assis : rien pour lui tant qu'il reste.
    expect((await w.me(a)).pokerStats).toEqual(stat(0));
    const last = await w.poker.act(a, code, { type: "quitter" });
    expect(last.body.state).toMatchObject({ balance: 5_010, pokerStats: stat(1, 1, 1, 0) });
    expect(w.storage.tableCodes()).toEqual([]);
    // Rien n'est recompté ensuite, quoi qu'on relise.
    for (const who of [a, b]) {
      await w.poker.lobby(who);
      await w.poker.poll(who, code);
    }
    expect([(await w.me(a)).pokerStats, (await w.me(b)).pokerStats]).toEqual([stat(1, 1, 1, 0), stat(1, 0, 0, 1)]);
    // Les médailles du limier se comptent là-dessus.
    expect((await w.me(a)).pokerStats.unmasked).toBe(1);
  });

  it("d'une table à l'autre, ils s'ajoutent", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Marcel", 5_000), await w.signup("Lulu", 5_000)];
    for (const round of [1, 2, 3]) {
      const code = (await w.poker.create(a, { blind: 10, maxBuyIn: 1000, seats: 2, bots: 0, buyIn: 500 })).body.view!.code;
      await w.poker.join(b, code, 500);
      await w.poker.act(a, code, { type: "lancer" });
      await caughtHand(w, a, b, code);
      await w.poker.act(b, code, { type: "quitter" });
      const r = await w.poker.act(a, code, { type: "quitter" });
      expect(r.body.state!.pokerStats).toEqual(stat(round, round, round, 0));
      expect((await w.me(b)).pokerStats).toEqual(stat(round, 0, 0, round));
    }
  });

  it("crédités par la requête d'un autre joueur, une fois, puis plus jamais", async () => {
    const w = makeWorld();
    const { a, b, code } = await duel(w);
    await caughtHand(w, a, b, code);
    // Lulu quitte, et le serveur tombe avant de créditer sa bourse : la table lui doit tapis et compteurs.
    w.failAt("mutatePlayer", 1);
    expect((await w.crashing(() => w.poker.act(b, code, { type: "quitter" }))).status).toBe(500);
    expect(w.table(code)!.ended).toMatchObject([{ playerId: b.playerId, payout: 490, stats: stat(1, 0, 0, 1) }]);
    expect(w.record(b)).toMatchObject({ balance: 4_500, poker: { code } });
    expect(w.record(b).pokerStats).toBeUndefined();
    // La requête de Marcel solde le tout.
    await w.poker.poll(a, code);
    expect(w.record(b)).toMatchObject({ balance: 4_990, poker: null, pokerStats: stat(1, 0, 0, 1) });
    expect(w.table(code)!.ended).toEqual([]);
    // Lulu revient plus tard : rien de plus.
    await w.poker.lobby(b);
    const again = await w.poker.act(b, code, { type: "quitter" }) as Reply;
    expect(again.body.error.code).toBe("NOT_SEATED");
    expect(w.record(b)).toMatchObject({ balance: 4_990, pokerStats: stat(1, 0, 0, 1) });
  });

  it("quitter après une main, coupé à chaque écriture : comptée une fois, jamais deux", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const ctx = await duel(w);
        await caughtHand(w, ctx.a, ctx.b, ctx.code);
        return ctx;
      },
      accounts: ({ a, b }) => [a, b],
      request: (w, { b, code }) => w.poker.act(b, code, { type: "quitter" }),
      afterRecovery: async (w, { a, b, code }, label) => {
        // Parti ou toujours assis, quitter de nouveau finit le travail. Si la coupure l'a laissé
        // assis, la main suivante est partie entre-temps : il la quitte en route (sa blinde reste
        // au pot, la main ne compte pas pour lui) et l'autre la ramasse.
        const stayed = w.record(b).poker !== null && w.record(b).poker !== undefined;
        if (stayed) await w.poker.act(b, code, { type: "quitter" });
        expect([label, w.record(b).poker, w.record(b).pokerStats]).toEqual([label, null, stat(1, 0, 0, 1)]);
        if (w.record(a).poker) await w.poker.act(a, code, { type: "quitter" });
        const [mine, theirs] = [w.record(b), w.record(a)];
        expect([label, mine.balance]).toEqual([label, stayed ? 4_980 : 4_990]);
        expect([label, mine.balance + theirs.balance, w.storage.tableCodes()]).toEqual([label, 10_000, []]);
        // Le tricheur démasqué l'a été une fois ; celui qui l'a démasqué en compte un, jamais deux.
        expect([label, theirs.pokerStats]).toEqual([label, theirs.balance === 5_010 ? stat(1, 1, 1, 0) : stat(2, 2, 1, 0)]);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("une table où il n'a fini aucune main n'ajoute rien à son compte, pas même un champ vide", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 1_000);
    const before = Object.keys(w.record(a)).sort();
    const code = (await w.poker.create(a, { maison: "kiosque", buyIn: 100 })).body.view!.code;
    const r = await w.poker.act(a, code, { type: "quitter" });
    expect(r.body.state!.pokerStats).toEqual(stat(0));
    // Le compte a gagné la trace de sa séance (soldée), comme en 2.0, et rien d'autre.
    expect(Object.keys(w.record(a)).sort()).toEqual([...before, "poker"].sort());
    for (const key of ["pokerStats", "masters", "hostWins"]) expect([key, key in w.record(a)]).toEqual([key, false]);
  });

  it("à une table de la maison comme ailleurs : trois mains jouées, trois mains comptées", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 1_000);
    const code = (await w.poker.create(a, { maison: "kiosque", buyIn: 100 })).body.view!.code;
    // Franc jeu, parole ou suivre, rien à dire : jusqu'au dénouement de la troisième main.
    let seen = 0;
    const pots = { mine: 0, caught: 0 };
    for (let i = 0; i < 400 && seen < 3; i++) {
      w.advance(500);
      const view = (await w.poker.poll(a, code)).body.view!;
      const result = view.result;
      if (result && result.no > seen && view.phase === "denouement") {
        seen = result.no;
        if (result.pots.some((pot) => pot.winners.some((x) => x.seat === 0 && x.amount > 0))) pots.mine += 1;
        if (result.unmasked.some((u) => u.seat === 0)) pots.caught += 1;
        if (seen < 3) await w.poker.act(a, code, { type: "suite" }, view.step);
        continue;
      }
      const o = view.options;
      if (o.cheat) await w.poker.act(a, code, { type: "franc-jeu" }, view.step);
      else if (o.fold) await w.poker.act(a, code, o.check ? { type: "parole" } : { type: "suivre" }, view.step);
      else if (o.accuse.length > 0) await w.poker.act(a, code, { type: "rien" }, view.step);
    }
    expect(seen).toBe(3);
    const r = await w.poker.act(a, code, { type: "quitter" });
    // Il n'a jamais triché ni accusé : seuls les mains et les pots ont bougé.
    expect(r.body.state!.pokerStats).toEqual(stat(3, pots.mine, 0, 0));
    expect(pots.caught).toBe(0);
  });
});

// ---------------------------------------------------------------------------

describe("les victoires contre chaque hôte", () => {
  /** Lance le défi du Kiosque et le joue en une main : tout le monde à tapis, avec la main qu'on choisit. */
  async function challenge(w: World, a: Account, mine: string): Promise<Reply<PokerTableResponse>> {
    const created = await w.poker.create(a, { defi: "kiosque" });
    expect(created.status).toBe(201);
    const code = created.body.view!.code;
    await everyoneAllIn(w, a, code, mine);
    w.advance(RESULT_MS);
    return w.poker.poll(a, code);
  }

  it("trois manches gagnées contre le même hôte : trois victoires, la mise double de l'une à l'autre", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 100);
    expect((await w.me(a)).hostWins).toEqual(NO_WINS);
    for (const round of [1, 2, 3]) {
      const stake = 100 * 2 ** (round - 1);
      expect((await w.poker.lobby(a)).body.challenges[0]).toMatchObject({ level: round, wins: round - 1, stake, prize: 2 * stake });
      const r = await challenge(w, a, ACES);
      // Chacun a posé la même mise ; le gagnant repart avec les deux. Rien n'est versé à part.
      expect(r.body.left).toEqual({ reason: "defi-gagne", payout: 2 * stake, bonus: 0 });
      expect(r.body.state).toMatchObject({ balance: 2 * stake, defis: ["kiosque"], hostWins: { ...NO_WINS, kiosque: round }, pokerStats: stat(round, round) });
    }
    expect(w.record(a)).toMatchObject({ balance: 800, pokerWins: ["kiosque"], hostWins: { kiosque: 3 } });
    expect((await w.poker.lobby(a)).body.challenges[0]).toMatchObject({ level: 3, wins: 3, rematch: true, stake: 400 });
  });

  it("un compte d'avant, qui avait déjà relevé ce défi, reprend à la deuxième manche", async () => {
    const w = makeWorld();
    const a = await w.signup("Ancienne", 200);
    // En 2.0, seule la première victoire était retenue, dans `pokerWins` : elle vaut la première manche gagnée.
    w.storage.poke(a.playerId, (p) => { p.pokerWins = ["kiosque", "lune"]; });
    expect((await w.me(a)).hostWins).toEqual({ ...NO_WINS, kiosque: 1, lune: 1 });
    expect(w.record(a).hostWins).toBeUndefined();
    const lobby = (await w.poker.lobby(a)).body;
    expect(lobby.challenges[0]).toMatchObject({ won: true, level: 2, wins: 1, stake: 200, prize: 400, difficulty: "normal" });
    expect(lobby.challenges[7]).toMatchObject({ won: true, level: 2, wins: 1, stake: 50_000_000_000_000 });
    expect(lobby.challenges[1]).toMatchObject({ won: false, level: 1, wins: 0, stake: 1_000 });
    const r = await challenge(w, a, ACES);
    expect(r.body.left).toEqual({ reason: "defi-gagne", payout: 400, bonus: 0 });
    expect(r.body.state!.hostWins).toEqual({ ...NO_WINS, kiosque: 2, lune: 1 });
    expect(w.record(a)).toMatchObject({ balance: 400, pokerWins: ["kiosque", "lune"], hostWins: { kiosque: 2 } });
  });

  it("un défi perdu fait perdre sa mise, un défi quitté rend le tapis : ni l'un ni l'autre ne compte", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 300);
    const lost = await challenge(w, a, WORST);
    expect(lost.body.left).toEqual({ reason: "defi-perdu", payout: 0, bonus: 0 });
    expect(lost.body.state).toMatchObject({ balance: 200, hostWins: NO_WINS });
    const code = (await w.poker.create(a, { defi: "kiosque" })).body.view!.code;
    const quit = await w.poker.act(a, code, { type: "quitter" });
    expect(quit.body.left).toEqual({ reason: "quitte", payout: 96, bonus: 0 });
    expect(quit.body.state).toMatchObject({ balance: 196, hostWins: NO_WINS });
    expect([w.record(a).hostWins, w.record(a).pokerWins ?? []]).toEqual([undefined, []]);
    // Toujours la première manche.
    expect((await w.poker.lobby(a)).body.challenges[0]).toMatchObject({ level: 1, wins: 0, stake: 100 });
  });

  it("un défi gagné, coupé à chaque écriture : une victoire, les deux mises, une fois", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const a = await w.signup("Marcel", 100);
        const code = (await w.poker.create(a, { defi: "kiosque" })).body.view!.code;
        await everyoneAllIn(w, a, code, ACES);
        w.advance(RESULT_MS);
        return { a, code };
      },
      accounts: ({ a }) => [a],
      request: (w, { a, code }) => w.poker.poll(a, code),
      afterRecovery: (w, { a }, label) => {
        const p = w.record(a);
        expect([label, p.balance, p.pokerWins, p.hostWins, p.pokerStats, p.poker, w.storage.tableCodes()]).toEqual([
          label, 200, ["kiosque"], { kiosque: 1 }, stat(1, 1), null, [],
        ]);
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(8);
  });

  it("une table de la maison ne compte pas : seules les manches d'un défi sont des victoires contre un hôte", async () => {
    const w = makeWorld();
    const a = await w.signup("Marcel", 1_000);
    const code = (await w.poker.create(a, { maison: "kiosque", buyIn: 100 })).body.view!.code;
    // Gaspard est à la table (siège 1). Le joueur lui prend tout en une main.
    await everyoneAllIn(w, a, code, ACES);
    const r = await w.poker.act(a, code, { type: "quitter" });
    expect(r.body.left!.reason).toBe("quitte");
    expect(r.body.state!.hostWins).toEqual(NO_WINS);
    expect(w.record(a).hostWins).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Le format tournoi d'une table entre amis, par les routes.

/**
 * Une main réglée d'avance, par l'API : les sièges de `push` poussent leur tapis avec les
 * mains qu'on leur donne (derrière le dos du serveur), les autres sont couchés. Chacun joue
 * franc jeu et n'accuse personne. Rend quand le dénouement est affiché.
 */
async function forcedHand(w: World, code: string, players: Account[], plan: { cards: Record<number, string>; push: number[] }): Promise<TableView> {
  w.storage.pokeTable(code, (t) => {
    const h = t.hand!;
    const live = h.players.filter((p) => !p.gone);
    const totals = plan.push.map((seat) => live.find((p) => p.seat === seat)!.committed + t.seats[seat]!.stack).sort((x, y) => y - x);
    // Ce que chacun peut jouer au plus : le deuxième plus gros tapis parmi ceux qui poussent.
    const cap = totals[1] ?? totals[0]!;
    for (const p of live) {
      const seat = t.seats[p.seat]!;
      if (plan.cards[p.seat]) p.cards = hand(plan.cards[p.seat]!);
      if (seat.bot !== null) { p.chosen = true; p.actAt = null; }
      if (!plan.push.includes(p.seat)) { p.folded = true; continue; }
      const added = Math.min(seat.stack, cap - p.committed);
      seat.stack -= added;
      p.committed += added;
      h.pot += added;
      p.allIn = seat.stack === 0;
    }
  });
  for (const a of players) {
    if ((await w.poker.poll(a, code)).body.view!.options.cheat) expect((await w.poker.act(a, code, { type: "franc-jeu" })).status).toBe(200);
  }
  // Les robots ne disent rien.
  w.storage.pokeTable(code, (t) => {
    for (const p of t.hand?.players ?? []) if (!p.gone && t.seats[p.seat]!.bot !== null) { p.spoke = true; p.actAt = null; }
  });
  for (const a of players) {
    if ((await w.poker.poll(a, code)).body.view!.options.accuse.length > 0) expect((await w.poker.act(a, code, { type: "rien" })).status).toBe(200);
  }
  const view = (await w.poker.poll(players[0]!, code)).body.view!;
  expect(view.phase).toBe("denouement");
  return view;
}

describe("une table entre amis jouée en tournoi : le serveur", () => {
  const GONE = { reason: "quitte", payout: 0, bonus: 0 };
  const BEATEN = { reason: "maitres-perdu", payout: 0, bonus: 0 };

  /**
   * Le premier crée la table (blinde de 10 € : 300 € chacun), les autres la rejoignent, et il
   * la lance. Rend le code de la table.
   */
  async function tournament(w: World, players: Account[], opts: { bots?: number; seats?: number; launch?: boolean } = {}): Promise<string> {
    const bots = opts.bots ?? 0;
    const created = await w.poker.create(players[0]!, { blind: 10, seats: opts.seats ?? players.length + bots, bots, format: "tournoi" });
    expect(created.status).toBe(201);
    const code = created.body.view!.code;
    for (const a of players.slice(1)) expect((await w.poker.join(a, code, STAKE)).status).toBe(200);
    if (opts.launch !== false) expect((await w.poker.act(players[0]!, code, { type: "lancer" })).status).toBe(200);
    return code;
  }

  it("créer : `format: \"tournoi\"` fixe la cagnotte de tous à trente blindes ; `maxBuyIn` et `buyIn` ne se lisent pas", async () => {
    const w = makeWorld();
    const a = await w.signup("Ada", 1_000);
    // Ce que l'écran de création envoyait jusqu'ici, plus le format : la cave demandée ne compte pas.
    const r = await w.poker.create(a, { blind: 10, maxBuyIn: 1_000, buyIn: 200, seats: 4, bots: 1, difficulty: "facile", format: "tournoi" });
    expect(r.status).toBe(201);
    const view = r.body.view!;
    expect(view).toMatchObject({
      kind: "privee", place: null, format: "tournoi", blind: 10, rise: { hand: 17, blind: 20 }, minBuyIn: STAKE, maxBuyIn: STAKE,
      difficulty: "facile", started: false, phase: "attente", you: 0, owner: 0, handNo: 0,
    });
    // Le robot a la même cagnotte ; le créateur a payé la sienne, et rien d'autre.
    expect(view.seats.map((seat) => (seat ? [seat.bot !== null, seat.stack] : null))).toEqual([[false, STAKE], null, null, [true, STAKE]]);
    expect([r.body.state!.balance, w.record(a).poker]).toEqual([700, { code: view.code, sid: expect.any(String), seq: 1, paid: STAKE }]);
    expect(w.table(view.code)).toMatchObject({ kind: "privee", format: "tournoi", minBuyIn: STAKE, maxBuyIn: STAKE });
    // Il faut être deux pour lancer : le robot suffit.
    expect(view.options.start).toBe(true);
    // Sans `maxBuyIn` du tout : la même table.
    const b = await w.signup("Bob", 1_000);
    const bare = await w.poker.create(b, { blind: 10, seats: 2, bots: 0, format: "tournoi" });
    expect([bare.status, bare.body.view!.format, bare.body.view!.maxBuyIn, bare.body.view!.options.start]).toEqual([201, "tournoi", STAKE, false]);
  });

  it("créer : les refus, et le corps d'avant qui crée toujours une table classique", async () => {
    const w = makeWorld();
    const a = await w.signup("Ada", 1_000);
    const refused = async (body: unknown) => {
      const r = await w.poker.create(a, body) as Reply;
      return [r.status, r.body.error?.code];
    };
    // Un format inconnu est refusé, même dans un corps par ailleurs valable pour une table classique.
    for (const format of ["autre", "", true, null, 1]) {
      expect([format, ...(await refused({ blind: 10, maxBuyIn: 1_000, seats: 2, bots: 0, format }))]).toEqual([format, 400, "BAD_REQUEST"]);
    }
    expect(await refused({ blind: 10, seats: 7, bots: 0, format: "tournoi" })).toEqual([400, "BAD_REQUEST"]);
    expect(await refused({ blind: 10, seats: 3, bots: 3, format: "tournoi" })).toEqual([400, "BAD_REQUEST"]);
    expect(await refused({ blind: 15, seats: 3, bots: 1, format: "tournoi" })).toEqual([400, "BAD_REQUEST"]);
    // La même règle de bourse qu'à toute table qu'on crée : la blinde ne dépasse pas son quarantième.
    expect(await refused({ blind: 50, seats: 2, bots: 1, format: "tournoi" })).toEqual([409, "BLIND_TOO_HIGH"]);
    // `classique`, dit ou non : la cave maximale se lit comme avant.
    expect(await refused({ blind: 10, seats: 2, bots: 0, format: "classique" })).toEqual([400, "BAD_REQUEST"]);
    expect(await refused({ blind: 10, seats: 2, bots: 0 })).toEqual([400, "BAD_REQUEST"]);
    expect([w.balance(a), w.storage.tableCodes()]).toEqual([1_000, []]);
    for (const body of [{ blind: 10, maxBuyIn: 1_000, seats: 2, bots: 0 }, { blind: 10, maxBuyIn: 1_000, seats: 2, bots: 0, format: "classique" }]) {
      const r = await w.poker.create(a, body);
      expect([r.status, r.body.view!.format, r.body.view!.minBuyIn, r.body.view!.maxBuyIn, r.body.view!.rise]).toEqual([201, "classique", 200, 1_000, null]);
      expect("format" in w.table(r.body.view!.code)!).toBe(false);
      await w.poker.act(a, r.body.view!.code, { type: "quitter" });
    }
    // Le format ne se lit que pour une table à code : ailleurs il n'a pas de sens, et ne change rien.
    const house = await w.poker.create(a, { maison: "kiosque", buyIn: 100, format: "tournoi" });
    expect([house.status, house.body.view!.format, house.body.view!.kind]).toEqual([201, "classique", "maison"]);
  });

  it("rejoindre : avant le lancement seulement, et à la cagnotte exacte", async () => {
    const w = makeWorld();
    const [a, b, c, d] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000), await w.signup("Cléo", 1_000), await w.signup("Dan", 299)];
    const code = await tournament(w, [a], { seats: 4, launch: false });
    // L'aperçu dit tout ce qu'il faut à la feuille « rejoindre ».
    const preview = (await w.poker.poll(b, code)).body.view!;
    expect(preview).toMatchObject({ you: null, format: "tournoi", minBuyIn: STAKE, maxBuyIn: STAKE, blind: 10, started: false, handNo: 0 });
    const refused = async (who: Account, buyIn: number) => {
      const r = await w.poker.join(who, code, buyIn) as Reply;
      return [r.status, r.body.error?.code];
    };
    expect(await refused(b, 299)).toEqual([400, "BAD_REQUEST"]);
    expect(await refused(b, 301)).toEqual([400, "BAD_REQUEST"]);
    expect(await refused(d, STAKE)).toEqual([409, "BUYIN_UNAFFORDABLE"]);
    expect([w.balance(b), w.record(b).poker ?? null, w.table(code)!.seats.filter((seat) => seat !== null).length]).toEqual([1_000, null, 1]);
    const joined = await w.poker.join(b, code, STAKE);
    expect([joined.status, joined.body.view!.you, joined.body.state!.balance]).toEqual([200, 1, 700]);
    // Le créateur lance : la première main est donnée, à deux.
    const started = await w.poker.act(a, code, { type: "lancer" });
    expect(started.body.view).toMatchObject({ started: true, handNo: 1, phase: "triche", pot: 20 });
    // Ensuite plus personne n'entre, alors qu'il reste deux sièges.
    expect(await refused(c, STAKE)).toEqual([409, "TABLE_FULL"]);
    expect([w.balance(c), w.record(c).poker ?? null, w.table(code)!.seats.map((seat) => seat !== null)]).toEqual([1_000, null, [true, true, false, false]]);
    // Qui est déjà assis peut rejouer sa demande : rien ne change, rien n'est payé deux fois.
    const again = await w.poker.join(b, code, STAKE);
    expect([again.status, again.body.view!.you, w.balance(b)]).toEqual([200, 1, 700]);
    // Et personne ne recave.
    expect(((await w.poker.act(b, code, { type: "recaver", amount: 100 })) as Reply).body.error.code).toBe("ACTION_IMPOSSIBLE");
    expect(w.balance(b)).toBe(700);
  });

  it("une demande coupée avant de payer, puis la partie lancée : son siège réservé ne se paie plus, il est libéré", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
    const code = await tournament(w, [a], { seats: 3, bots: 1, launch: false });
    // La demande de Bob tombe entre la réservation de son siège et le paiement de sa cagnotte.
    w.failAt("mutatePlayer", 1, "before");
    const crashed = await w.crashing(() => w.poker.join(b, code, STAKE));
    expect(crashed.status).toBe(500);
    expect(w.table(code)!.seats[1]).toMatchObject({ playerId: b.playerId, seq: 0, stack: 0 });
    // Ada lance sans lui : elle et le robot.
    const started = await w.poker.act(a, code, { type: "lancer" });
    expect([started.body.view!.handNo, started.body.view!.seats[1]!.funded]).toEqual([1, false]);
    // Bob réessaie : trop tard, et il n'a rien payé.
    const retry = await w.poker.join(b, code, STAKE) as Reply;
    expect([retry.status, retry.body.error.code]).toEqual([409, "TABLE_FULL"]);
    expect([w.balance(b), w.record(b).poker ?? null]).toEqual([1_000, null]);
    // Trente secondes après sa réservation, son siège est libéré.
    w.advance(RESERVE_MS);
    await w.poker.poll(a, code);
    expect([w.table(code)!.seats[1], w.balance(b), w.record(b).poker ?? null]).toEqual([null, 1_000, null]);
  });

  it("à deux : le vainqueur remporte tout, chacun est réglé par sa propre requête, et `masters` ne bouge pas", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
    const code = await tournament(w, [a, b]);
    await forcedHand(w, code, [a, b], { cards: { 0: ACES, 1: KINGS }, push: [0, 1] });
    expect(w.table(code)!.seats.map((seat) => seat!.stack)).toEqual([600, 0]);
    w.advance(RESULT_MS);
    // C'est le vaincu qui relit la table le premier : elle ferme, et lui dit qu'il a perdu.
    const lost = await w.poker.poll(b, code);
    expect(lost.body.view).toMatchObject({ phase: "fermee", closed: "maitres", format: "tournoi", you: null });
    expect(lost.body.left).toEqual(BEATEN);
    expect(lost.body.state).toMatchObject({ balance: 700, masters: 0, pokerStats: stat(1, 0) });
    expect(lost.body.state!.poker).toBeUndefined();
    // Le vainqueur n'est pas encore réglé : la table fermée l'attend, avec ce qu'elle lui doit.
    expect([w.balance(a), w.record(a).poker?.code, w.storage.tableCodes()]).toEqual([700, code, [code]]);
    expect(w.table(code)!.ended.map((e) => [e.playerId, e.reason, e.payout])).toEqual([[a.playerId, "maitres-gagne", 600]]);
    // Le vaincu relit encore : la même annonce, et rien ne bouge.
    const again = await w.poker.poll(b, code);
    expect([again.body.left, again.body.state, w.balance(b)]).toEqual([BEATEN, undefined, 700]);
    // Le vainqueur arrive : tout l'argent de la table est à lui.
    const won = await w.poker.poll(a, code);
    expect(won.body.view).toMatchObject({ phase: "fermee", closed: "maitres", you: null });
    expect(won.body.left).toEqual({ reason: "maitres-gagne", payout: 600, bonus: 0 });
    expect(won.body.state).toMatchObject({ balance: 1_300, masters: 0, pokerStats: stat(1, 1) });
    // La victoire à la Table des Maîtres ne se gagne qu'à la Table des Maîtres.
    expect([w.record(a).masters, w.record(b).masters, w.record(a).hostWins]).toEqual([undefined, undefined, undefined]);
    expect([w.record(a).poker, w.record(b).poker, w.storage.tableCodes()]).toEqual([null, null, []]);
    // Rejouer : la table n'existe plus, rien n'est reversé.
    for (const who of [a, b]) expect(((await w.poker.poll(who, code)) as Reply).body.error.code).toBe("TABLE_NOT_FOUND");
    expect([w.balance(a), w.balance(b)]).toEqual([1_300, 700]);
  });

  it("à deux, le vainqueur relit le premier : pareil, et le vaincu apprend ensuite qu'il a perdu", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
    const code = await tournament(w, [a, b]);
    const done = await forcedHand(w, code, [a, b], { cards: { 0: ACES, 1: KINGS }, push: [0, 1] });
    // Les deux demandent la suite : la table ferme sans attendre la fin du dénouement.
    await w.poker.act(a, code, { type: "suite" }, done.step);
    const won = await w.poker.act(a, code, { type: "suite" }, done.step) as Reply;
    expect(won.body.error.code).toBe("ACTION_IMPOSSIBLE");
    const closing = await w.poker.act(b, code, { type: "suite" }, done.step);
    expect([closing.body.view!.closed, closing.body.left]).toEqual(["maitres", BEATEN]);
    expect((await w.poker.poll(a, code)).body.left).toEqual({ reason: "maitres-gagne", payout: 600, bonus: 0 });
    expect([w.balance(a), w.balance(b), w.storage.tableCodes()]).toEqual([1_300, 700, []]);
  });

  it("le vainqueur ne relit pas la table mais repasse par le hall : il est réglé là, une fois", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
    const code = await tournament(w, [a, b]);
    await forcedHand(w, code, [a, b], { cards: { 0: ACES, 1: KINGS }, push: [0, 1] });
    w.advance(RESULT_MS);
    expect((await w.poker.poll(b, code)).body.left).toEqual(BEATEN);
    const lobby = await w.poker.lobby(a);
    expect([lobby.body.seat, lobby.body.state.balance, w.storage.tableCodes()]).toEqual([null, 1_300, []]);
    expect((await w.poker.lobby(a)).body.state.balance).toBe(1_300);
    // Il peut s'asseoir ailleurs aussitôt.
    expect((await w.poker.create(a, { maison: "kiosque", buyIn: 100 })).status).toBe(201);
  });

  it("à trois avec un robot : une élimination, un abandon, puis le dernier remporte tout", async () => {
    const w = makeWorld();
    const [a, b, c] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000), await w.signup("Cléo", 1_000)];
    const code = await tournament(w, [a, b, c], { bots: 1 });
    expect(w.table(code)!.audit).toEqual({ in: 900, out: 0, bank: STAKE });

    // Première main : Ada et Cléo poussent leur tapis, Bob et le robot se couchent.
    await forcedHand(w, code, [a, b, c], { cards: { 0: ACES, 2: NOTHING }, push: [0, 2] });
    expect(w.table(code)!.seats.map((seat) => seat!.stack)).toEqual([620, 290, 0, 290]);
    expect((await w.poker.poll(c, code)).body.view!.seats[2]).toMatchObject({ stack: 0, out: true });
    // Personne ne recave, pas même entre deux mains : ni celle qui n'a plus rien, ni celui dont le tapis est entamé.
    for (const who of [b, c]) {
      expect((await w.poker.poll(who, code)).body.view!.options.rebuy).toBeNull();
      expect(((await w.poker.act(who, code, { type: "recaver", amount: 10 })) as Reply).body.error.code).toBe("ACTION_IMPOSSIBLE");
    }
    expect([w.balance(b), w.balance(c)]).toEqual([700, 700]);
    w.advance(RESULT_MS);
    // La main suivante part sans Cléo : éliminée, elle repart sans rien. C'est la requête d'Ada qui la règle.
    const next = await w.poker.poll(a, code);
    expect(next.body.view).toMatchObject({ handNo: 2, phase: "triche", closed: null });
    expect(next.body.view!.seats[2]).toBeNull();
    expect([w.record(c).poker, w.balance(c), w.record(c).pokerStats]).toEqual([null, 700, stat(1, 0)]);
    // Elle l'apprend à sa requête suivante, et peut encore regarder la table : un aperçu, rien de caché.
    const out = await w.poker.poll(c, code);
    expect([out.status, out.body.left, out.body.view!.you, out.body.view!.hand]).toEqual([200, BEATEN, null, null]);
    expect(((await w.poker.join(c, code, STAKE)) as Reply).body.error.code).toBe("TABLE_FULL");
    expect(w.balance(c)).toBe(700);

    // Deuxième main : Bob abandonne. Sa blinde reste au pot, son tapis attend la main suivante.
    const quit = await w.poker.act(b, code, { type: "quitter" });
    expect(quit.body.left).toEqual(GONE);
    expect(quit.body.state).toMatchObject({ balance: 700, pokerStats: stat(1, 0) });
    expect(quit.body.state!.poker).toBeUndefined();
    const waiting = w.table(code)!;
    expect([waiting.carry, waiting.hand!.pot, waiting.seats[1], chipsOnTable(waiting)]).toEqual([280, 30, null, 1_200]);
    expect((await w.poker.poll(b, code)).body.left).toEqual(GONE);

    // Ada prend le tapis du robot : il ne reste qu'elle.
    const last = await forcedHand(w, code, [a], { cards: { 0: ACES, 3: KINGS }, push: [0, 3] });
    expect([last.result!.carry, last.seats.map((seat) => seat?.stack ?? null)]).toEqual([280, [920, null, null, 0]]);
    expect(last.seats[3]).toMatchObject({ out: true });
    w.advance(RESULT_MS);
    const won = await w.poker.poll(a, code);
    // Tout l'argent de la table : les quatre cagnottes, tapis abandonné compris.
    expect(won.body.left).toEqual({ reason: "maitres-gagne", payout: 1_200, bonus: 0 });
    expect(won.body.view).toMatchObject({ phase: "fermee", closed: "maitres" });
    expect(won.body.state).toMatchObject({ balance: 1_900, masters: 0, pokerStats: stat(2, 2) });
    expect([w.balance(a), w.balance(b), w.balance(c), w.storage.tableCodes()]).toEqual([1_900, 700, 700, []]);
    for (const who of [a, b, c]) expect([w.record(who).poker, w.record(who).masters]).toEqual([null, undefined]);
  });

  it("match nul : tous deux à tapis, tous deux démasqués ; chacun reprend sa part du pot, sans victoire", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
    const code = await tournament(w, [a, b]);
    // Chacun se glisse une carte qu'il n'a pas, puis pousse son tapis (derrière le dos du serveur).
    const spare = async (who: Account): Promise<Card> => {
      const cards = (await w.poker.poll(who, code)).body.view!.hand!.cards;
      return DECK.find((card) => !cards.includes(card))!;
    };
    expect((await w.poker.act(a, code, { type: "tricher", index: 4, card: await spare(a) })).status).toBe(200);
    w.storage.pokeTable(code, (t) => {
      for (const p of t.hand!.players) {
        const seat = t.seats[p.seat]!;
        p.committed += seat.stack;
        t.hand!.pot += seat.stack;
        seat.stack = 0;
        p.allIn = true;
      }
    });
    expect((await w.poker.act(b, code, { type: "tricher", index: 0, card: await spare(b) })).body.view!.phase).toBe("abattage");
    // Chacun accuse l'autre : à tapis, cela ne coûte rien.
    await w.poker.act(a, code, { type: "accuser", seat: 1 });
    const done = await w.poker.act(b, code, { type: "accuser", seat: 0 });
    expect(done.body.view).toMatchObject({ phase: "denouement", pot: 600 });
    expect(done.body.view!.result).toMatchObject({ carry: 600, unmasked: [{ seat: 0 }, { seat: 1 }] });
    expect(done.body.view!.seats.map((seat) => seat!.out ?? false)).toEqual([true, true]);
    w.advance(RESULT_MS);
    for (const who of [a, b]) {
      const r = await w.poker.poll(who, code);
      expect(r.body.left).toEqual({ reason: "maitres-nul", payout: STAKE, bonus: 0 });
      expect(r.body.state).toMatchObject({ balance: 1_000, masters: 0, pokerStats: stat(1, 0, 1, 1) });
    }
    expect([w.record(a).masters, w.record(b).masters, w.storage.tableCodes()]).toEqual([undefined, undefined, []]);
  });

  it("le dernier joueur humain se lève : il reprend son tapis, sans victoire, et la table ferme", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
    const code = await tournament(w, [a, b], { bots: 1 });
    // Bob perd tout contre Ada ; le robot s'est couché.
    await forcedHand(w, code, [a, b], { cards: { 0: ACES, 1: KINGS }, push: [0, 1] });
    w.advance(RESULT_MS);
    expect((await w.poker.poll(b, code)).body.left).toEqual(BEATEN);
    // Ada, seule avec le robot, s'en va en pleine main : sa blinde reste au pot.
    const quit = await w.poker.act(a, code, { type: "quitter" });
    expect(quit.body.left).toEqual({ reason: "quitte", payout: 600, bonus: 0 });
    expect(quit.body.view).toMatchObject({ phase: "fermee", closed: "vide" });
    expect([w.balance(a), w.balance(b), w.record(a).masters, w.storage.tableCodes()]).toEqual([1_300, 700, undefined, []]);
  });

  it("avant le lancement, chacun repart avec sa cagnotte", async () => {
    const w = makeWorld();
    const [a, b] = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
    const code = await tournament(w, [a, b], { launch: false });
    expect((await w.poker.act(b, code, { type: "quitter" })).body.left).toEqual({ reason: "quitte", payout: STAKE, bonus: 0 });
    expect((await w.poker.act(a, code, { type: "quitter" })).body.left).toEqual({ reason: "quitte", payout: STAKE, bonus: 0 });
    expect([w.balance(a), w.balance(b), w.storage.tableCodes()]).toEqual([1_000, 1_000, []]);
  });

  it("la fin du tournoi, coupée à chaque écriture : le vainqueur est payé une fois, le vaincu ne récupère rien", async () => {
    for (const closer of [0, 1]) {
      const cuts = await cutEverywhere({
        setup: async (w) => {
          const players = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
          const code = await tournament(w, players);
          await forcedHand(w, code, players, { cards: { 0: ACES, 1: KINGS }, push: [0, 1] });
          w.advance(RESULT_MS);
          return { players, code };
        },
        accounts: ({ players }) => players,
        request: (w, { players, code }) => w.poker.poll(players[closer]!, code),
        afterRecovery: (w, { players }, label) => {
          const [pa, pb] = players.map((who) => w.record(who));
          expect([label, pa!.balance, pb!.balance, pa!.poker, pb!.poker, w.storage.tableCodes()]).toEqual([label, 1_300, 700, null, null, []]);
          expect([label, pa!.pokerStats, pb!.pokerStats, pa!.masters, pb!.masters]).toEqual([label, stat(1, 1), stat(1, 0), undefined, undefined]);
        },
      });
      expect(cuts).toBeGreaterThanOrEqual(6);
    }
  });

  it("un abandon, coupé à chaque écriture : il a lieu ou non, et l'argent tombe juste dans les deux cas", async () => {
    const cuts = await cutEverywhere({
      setup: async (w) => {
        const players = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000)];
        return { players, code: await tournament(w, players) };
      },
      accounts: ({ players }) => players,
      request: (w, { players, code }) => w.poker.act(players[1]!, code, { type: "quitter" }),
      afterRecovery: (w, { players, code }, label) => {
        const [pa, pb] = players.map((who) => w.record(who));
        if (pb!.poker === null) {
          // L'abandon a eu lieu : Bob n'a rien repris, et Ada, restée seule, a tout remporté.
          expect([label, pa!.balance, pb!.balance, pa!.poker, w.storage.tableCodes()]).toEqual([label, 1_300, 700, null, []]);
        } else {
          // Il n'a pas eu lieu : les deux sont toujours assis, tout l'argent est sur la table.
          expect([label, pa!.balance, pb!.balance, chipsOnTable(w.table(code)!)]).toEqual([label, 700, 700, 600]);
        }
      },
    });
    expect(cuts).toBeGreaterThanOrEqual(6);
  });

  it("des tournois entiers par l'API, à trois joueurs et deux robots : tout l'argent finit chez un seul, ou chez personne", async () => {
    let winners = 0;
    for (const seed of [3, 4, 5, 6]) {
      const w = makeWorld(0x9e3779b9 + seed);
      const players = [await w.signup("Ada", 1_000), await w.signup("Bob", 1_000), await w.signup("Cléo", 1_000)];
      const code = await tournament(w, players, { bots: 2 });
      const side = rngOf(seed);
      const left = new Map<string, NonNullable<PokerTableResponse["left"]>>();
      for (let i = 0; i < 20_000 && left.size < players.length; i++) {
        w.advance(700);
        for (const who of players) {
          if (left.has(who.playerId)) continue;
          const polled = await w.poker.poll(who, code);
          expect(polled.status).toBe(200);
          let body = polled.body;
          const move = body.left ? null : botMove(body.view!, side);
          if (move) body = (await w.poker.act(who, code, move, body.view!.step)).body;
          if (body.left) left.set(who.playerId, body.left);
          else if (body.view) expect([body.view.format, body.view.options.rebuy]).toEqual(["tournoi", null]);
        }
        const table = w.table(code);
        if (table) expect(chipsOnTable(table)).toBe(table.audit.in - table.audit.out + table.audit.bank);
      }
      expect(left.size).toBe(3);
      const won = [...left.values()].filter((l) => l.reason === "maitres-gagne");
      const drawn = [...left.values()].filter((l) => l.reason === "maitres-nul");
      expect(won.length).toBeLessThanOrEqual(1);
      if (drawn.length > 0) expect(won.length).toBe(0);
      for (const l of left.values()) {
        if (l.reason === "maitres-gagne") expect(l.payout).toBe(1_500);
        else if (l.reason === "maitres-nul") expect(l.payout).toBeGreaterThan(0);
        else expect([l.reason, l.payout]).toEqual(["maitres-perdu", 0]);
      }
      winners += won.length;
      // Les bourses : 700 € chacun, plus ce que la table a rendu (toute la table au vainqueur, s'il y en a un).
      const back = [...left.values()].reduce((sum, l) => sum + l.payout, 0);
      expect(players.reduce((sum, who) => sum + w.balance(who), 0)).toBe(2_100 + back);
      if (won.length === 1) expect(players.map((who) => w.balance(who)).sort((x, y) => x - y)).toEqual([700, 700, 2_200]);
      expect(players.map((who) => [w.record(who).poker, w.record(who).masters])).toEqual([[null, undefined], [null, undefined], [null, undefined]]);
      expect(w.storage.tableCodes()).toEqual([]);
    }
    expect(winners).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------

describe("une table d'avant la mise à jour : le serveur", () => {
  const NEW_FIELDS = ["masters", "pokerStats", "hostWins", "vraieFin"];

  it("un joueur assis au moment de la mise à jour finit sa main, quitte, et ne perd rien", async () => {
    const w = makeWorld();
    const [a, c] = [await w.signup("Ancienne", 4_500), await w.signup("Partie", 2_600)];
    // Les comptes tels que la version 2.0 les a écrits : une séance en cours, aucun champ nouveau.
    w.storage.poke(a.playerId, (p) => { p.poker = { code: OLD_CODE, sid: OLD_SID_A, seq: 1, paid: 500 }; });
    w.storage.poke(c.playerId, (p) => { p.poker = { code: OLD_CODE, sid: OLD_SID_C, seq: 1, paid: 400 }; });
    for (const who of [a, c]) for (const key of NEW_FIELDS) expect([key, key in w.record(who)]).toEqual([key, false]);
    expect(await w.storage.createTable(oldTable(w.now(), { a: a.playerId, c: c.playerId }))).toBe(true);
    const fortune = (await w.me(a)).fortune;
    expect((await w.me(a)).poker).toEqual({ code: OLD_CODE });

    // Sa première requête après la mise à jour : la même vue qu'avant.
    const first = await w.poker.poll(a, OLD_CODE);
    expect(first.status).toBe(200);
    expect(first.body.view).toMatchObject({
      kind: "privee", format: "classique", blind: 10, rise: null, phase: "encheres", turn: 0, you: 0, handNo: 5, pot: 20,
      options: { check: true, fold: true, rebuy: null },
    });
    expect([first.body.left, first.body.state]).toEqual([undefined, undefined]);
    expect(first.body.view!.seats.map((s) => (s ? [s.stack, "out" in s] : null))).toEqual([[470, false], [1010, false], null]);
    // Au passage, le tapis dû depuis avant la mise à jour est rendu : 380 €, ni plus ni moins,
    // et pas un champ nouveau ne se glisse dans ce vieux compte.
    expect(w.record(c)).toMatchObject({ balance: 2_980, poker: null });
    for (const key of NEW_FIELDS) expect([key, key in w.record(c)]).toEqual([key, false]);
    expect(w.table(OLD_CODE)!.ended).toEqual([]);
    expect((await w.poker.poll(c, OLD_CODE)).body.left).toEqual({ reason: "quitte", payout: 380, bonus: 0 });
    expect(w.balance(c)).toBe(2_980);

    // Il joue : parole, puis la main va à son dénouement contre Hector.
    expect((await w.poker.act(a, OLD_CODE, { type: "parole" }, 23)).status).toBe(200);
    let view = (await w.poker.poll(a, OLD_CODE)).body.view!;
    for (let i = 0; i < 200 && !(view.phase === "denouement" && view.result!.no === 5); i++) {
      w.advance(1_000);
      view = (await w.poker.poll(a, OLD_CODE)).body.view!;
      const o = view.options;
      if (o.fold) view = (await w.poker.act(a, OLD_CODE, o.check ? { type: "parole" } : { type: "suivre" }, view.step)).body.view!;
      else if (o.accuse.length > 0) view = (await w.poker.act(a, OLD_CODE, { type: "rien" }, view.step)).body.view!;
    }
    expect([view.phase, view.result!.no]).toEqual(["denouement", 5]);
    const t = w.table(OLD_CODE)!;
    // Les comptes de la table tombent toujours juste, et sa première main comptée est celle-ci.
    expect(chipsOnTable(t)).toBe(t.audit.in - t.audit.out + t.audit.bank);
    expect(t.seats[0]!.stats).toMatchObject({ hands: 1, unmasked: 0, caught: 0 });
    // La bourse n'a pas bougé pendant la partie ; sa fortune non plus.
    expect([w.balance(a), (await w.me(a)).fortune]).toEqual([4_500, fortune]);

    // Il quitte : son tapis retourne à sa bourse, la table ferme et disparaît.
    const stack = t.seats[0]!.stack;
    const left = await w.poker.act(a, OLD_CODE, { type: "quitter" });
    expect(left.body.left).toEqual({ reason: "quitte", payout: stack, bonus: 0 });
    expect(left.body.state).toMatchObject({ balance: 4_500 + stack, pokerStats: { hands: 1, unmasked: 0, caught: 0 }, masters: 0, defis: [] });
    expect(left.body.state!.poker).toBeUndefined();
    // Il avait 470 € devant lui et 10 € au pot : il repart avec ses 480 € et le bilan de la main, à l'euro près.
    const net = view.result!.net.find((n) => n.seat === 0)!.amount;
    expect(stack).toBe(480 + net);
    expect(Math.abs(net)).toBeGreaterThanOrEqual(10);
    expect(w.storage.tableCodes()).toEqual([]);
    expect((await w.poker.lobby(a)).body.seat).toBeNull();
  });

  it("il préfère quitter tout de suite : son tapis d'avant, intact", async () => {
    const w = makeWorld();
    const [a, c] = [await w.signup("Ancienne", 4_500), await w.signup("Partie", 2_600)];
    w.storage.poke(a.playerId, (p) => { p.poker = { code: OLD_CODE, sid: OLD_SID_A, seq: 1, paid: 500 }; });
    w.storage.poke(c.playerId, (p) => { p.poker = { code: OLD_CODE, sid: OLD_SID_C, seq: 1, paid: 400 }; });
    await w.storage.createTable(oldTable(w.now(), { a: a.playerId, c: c.playerId }));
    // Par le hall d'abord, comme au retour dans le jeu : il y est toujours assis.
    expect((await w.poker.lobby(a)).body).toMatchObject({ seat: { code: OLD_CODE, kind: "privee", place: null }, masters: { open: false, defis: 0, won: 0 } });
    const r = await w.poker.act(a, OLD_CODE, { type: "quitter" });
    // En pleine main : ses 10 € de blinde restent au pot, comme avant.
    expect(r.body.left).toEqual({ reason: "quitte", payout: 470, bonus: 0 });
    expect([w.balance(a), w.balance(c), w.storage.tableCodes()]).toEqual([4_970, 2_980, []]);
    // Aucune main finie depuis la mise à jour : rien de nouveau dans les deux comptes.
    for (const who of [a, c]) for (const key of NEW_FIELDS) expect([key, key in w.record(who)]).toEqual([key, false]);
  });

  it("un vieux défi déjà joué se règle selon ses règles d'origine : le tapis, la cagnotte, et une victoire contre l'hôte", async () => {
    const w = makeWorld();
    const a = await w.signup("Ancienne", 70);
    w.storage.poke(a.playerId, (p) => { p.poker = { code: "D2K7Q", sid: OLD_SID_A, seq: 1, paid: 30 }; });
    await w.storage.createTable(oldChallenge(w.now(), a.playerId));
    w.advance(5_000);
    const r = await w.poker.poll(a, "D2K7Q");
    expect(r.body.view).toMatchObject({ phase: "fermee", closed: "defi" });
    // Ouverte avant les trois manches, la table n'en porte pas : 30 € chacun, et la cagnotte de 100 € versée à part.
    expect("level" in r.body.view!).toBe(false);
    expect(r.body.left).toEqual({ reason: "defi-gagne", payout: 60, bonus: 100 });
    expect(r.body.state).toMatchObject({ balance: 230, defis: ["kiosque"], hostWins: { ...NO_WINS, kiosque: 1 }, pokerStats: stat(0), masters: 0 });
    const record = w.record(a);
    expect(record).toMatchObject({ balance: 230, poker: null, pokerWins: ["kiosque"], hostWins: { kiosque: 1 } });
    // La main décisive s'est jouée avant la mise à jour : elle n'a pas été comptée, et rien n'est inventé.
    for (const key of ["masters", "pokerStats", "vraieFin"]) expect([key, key in record]).toEqual([key, false]);
    expect(w.storage.tableCodes()).toEqual([]);
    // Son prochain défi contre Gaspard est la deuxième manche : 200 €.
    expect((await w.poker.lobby(a)).body.challenges[0]).toMatchObject({ won: true, level: 2, wins: 1, stake: 200 });
  });
});
