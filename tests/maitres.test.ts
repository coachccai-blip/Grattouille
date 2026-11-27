// La Table des Maîtres (le joueur contre quatre hôtes tirés au sort, en tournoi, avec des
// montants astronomiques) et les compteurs du poker (`pokerStats`).
//
// D'abord le moteur, pur : la tablée, le barème de la blinde, le tournoi (pas de recave,
// élimination, fins de partie et leurs versements), les comptes de contrôle, les compteurs.
// Puis le serveur, avec le stockage en mémoire : les refus, une table jouée jusqu'au bout
// dans les deux sens, la victoire comptée une seule fois même si la requête est rejouée ou
// coupée, les compteurs versés une seule fois, et une table enregistrée avant la mise à jour.

import { describe, expect, it } from "vitest";
import { PLACES } from "../shared/places";
import {
  ACCUSE_MS, BOT_PERSONAS, BOT_STACK_CAVES, DECK, HOSTS, IDLE_TABLE_MS, MASTERS_BLIND, MASTERS_BLINDS, MASTERS_BUYIN,
  MASTERS_LEVEL_HANDS, MASTERS_SEATS, MAX_TABLE_CHIPS, RESERVE_MS, RESULT_MS,
  PokerError, act, advance, blindAt, botAccuse, botBet, botCheat, challengeBlind, chipsOnTable, createTable,
  deposit, isOut, isTournament, leave, mastersBlind, mastersRise, nextEventAt, pickMasters, playerInHand, rebuyRange,
  sit, splitPot, viewFor, viewOfSeat,
  type Card, type GameAction, type Random32, type TableState, type TableView,
} from "../shared/poker";

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
    expect(pickMasters(always(0xffff_ffff))).not.toEqual(pickMasters(always(0)));
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
      blind: MASTERS_BLIND, rise: { hand: 13, blind: 2 * MASTERS_BLIND }, started: true, you: 0, handNo: 1,
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
  it("elle double de palier en palier : douze mains, dix, huit, six, puis quatre par quatre", () => {
    expect([...MASTERS_LEVEL_HANDS]).toEqual([12, 10, 8, 6, 4]);
    const span = (times: number, hands: number): number[] => Array.from({ length: hands }, () => times);
    const expected = [
      ...span(1, 12), ...span(2, 10), ...span(4, 8), ...span(8, 6),
      ...span(16, 4), ...span(32, 4), ...span(64, 4), ...span(128, 4), ...span(256, 8),
    ];
    expect(Array.from({ length: 60 }, (_, i) => mastersBlind(1, i + 1))).toEqual(expected);
    // Elle cesse de monter dès qu'elle dépasse tout l'argent en jeu : cinq caves de 30 blindes.
    for (const main of [53, 60, 100, 1_000_000]) expect(mastersBlind(1, main)).toBe(256);
    expect([mastersBlind(1, 0), mastersBlind(1, -3)]).toEqual([1, 1]);
    // La prochaine hausse : à quelle main, et combien.
    expect([1, 12, 13, 22, 23, 30, 31, 36, 37, 40, 41, 48, 49, 52].map((main) => mastersRise(1, main))).toEqual([
      { hand: 13, blind: 2 }, { hand: 13, blind: 2 }, { hand: 23, blind: 4 }, { hand: 23, blind: 4 },
      { hand: 31, blind: 8 }, { hand: 31, blind: 8 }, { hand: 37, blind: 16 }, { hand: 37, blind: 16 },
      { hand: 41, blind: 32 }, { hand: 41, blind: 32 }, { hand: 45, blind: 64 }, { hand: 49, blind: 128 },
      { hand: 53, blind: 256 }, { hand: 53, blind: 256 },
    ]);
    for (const main of [53, 54, 500]) expect(mastersRise(1, main)).toBeNull();
  });

  it("en euros : de 10 Bn€ à 2 560 Bn€, toujours des entiers exacts", () => {
    const real = Array.from({ length: 60 }, (_, i) => mastersBlind(MASTERS_BLIND, i + 1));
    expect(real.every(Number.isSafeInteger)).toBe(true);
    expect([1, 13, 23, 31, 37, 41, 45, 49, 53].map((main) => real[main - 1]! / BN)).toEqual([10, 20, 40, 80, 160, 320, 640, 1_280, 2_560]);
    // À la 52e main elle tient encore dans la table ; à la 53e elle la dépasse, et s'arrête là.
    expect(real[51]!).toBeLessThan(ALL);
    expect(real[52]!).toBeGreaterThan(ALL);
    expect(mastersRise(MASTERS_BLIND, 52)).toEqual({ hand: 53, blind: 2_560 * BN });
    // Le barème d'un défi, lui, n'a pas bougé.
    expect(Array.from({ length: 20 }, (_, i) => challengeBlind(1, i + 1))).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 8, 8, 16, 16, 32, 32, 64, 64]);
  });

  it("la vue donne la blinde en vigueur et la main où elle montera, comme dans un défi", () => {
    const rng = rngOf(21);
    const even = [30 * U, 30 * U, 30 * U, 30 * U, 30 * U];
    // Entre la douzième et la treizième main, la vue annonce déjà la blinde de la main qui vient.
    const between = mastersAt(rng, { played: 12, stacks: even, dealer: 3 });
    expect([blindAt(between, 12), blindAt(between, 13)]).toEqual([U, 2 * U]);
    expect([viewFor(between, "p_a", T0).blind, viewFor(between, "p_a", T0).rise]).toEqual([2 * U, { hand: 23, blind: 4 * U }]);
    let t = advance(between, T0, rng);
    expect([t.handNo, t.hand!.blind, t.hand!.pot, stacksOf(t)]).toEqual([13, 2 * U, 10 * U, even.map((x) => x - 2 * U)]);
    expect(t.log.filter((e) => e.hand === 13 && e.kind === "blinde").map((e) => e.amount)).toEqual([2 * U, 2 * U, 2 * U, 2 * U, 2 * U]);
    // La blinde de base de la table, elle, ne bouge pas.
    expect(t.blind).toBe(U);
    const view = viewFor(t, "p_a", T0);
    expect([view.blind, view.rise, view.seats.map((s) => s!.committed)]).toEqual([2 * U, { hand: 23, blind: 4 * U }, [2 * U, 2 * U, 2 * U, 2 * U, 2 * U]]);
    // Le donneur est au siège 4 : le joueur parle le premier. La mise minimale suit la blinde en vigueur.
    t = act(hostsSilent(t), "p_a", { type: "franc-jeu" }, T0, rng);
    expect([t.phase, t.dealer, t.hand!.turn]).toEqual(["encheres", 4, 0]);
    expect(viewFor(t, "p_a", T0).options).toMatchObject({ check: true, bet: { min: 2 * U, max: 10 * U } });
    expect(refusal(() => act(t, "p_a", { type: "miser", amount: U }, T0, rng))).toBe("ACTION_IMPOSSIBLE");
    // Plus loin : 160 Bn€ à la 37e main ; à la 53e, elle ne monte plus et dépasse tous les tapis.
    const late = viewFor(advance(mastersAt(rng, { played: 36, stacks: [60 * U, 90 * U, 0, 0, 0] }), T0, rng), "p_a", T0);
    expect([late.handNo, late.blind, late.rise, late.pot]).toEqual([37, 16 * U, { hand: 41, blind: 32 * U }, 32 * U]);
    const last = viewFor(advance(mastersAt(rng, { played: 52, stacks: [60 * U, 90 * U, 0, 0, 0] }), T0, rng), "p_a", T0);
    expect([last.handNo, last.blind, last.rise, last.pot]).toEqual([53, 256 * U, null, 150 * U]);
    expect(last.seats.slice(0, 2).map((s) => [s!.stack, s!.committed, s!.allIn])).toEqual([[0, 60 * U, true], [0, 90 * U, true]]);
  });
});

// ---------------------------------------------------------------------------

describe("un tournoi : la blinde à tapis, l'élimination, pas de recave", () => {
  it("qui n'a plus de quoi payer la blinde pose ce qui lui reste et joue la main à tapis", () => {
    const rng = rngOf(31);
    // 23e main, blinde de 40 Bn€ : il reste 30 Bn€ au joueur, 20 Bn€ à Hector, un euro à Baron.
    const t = advance(mastersAt(rng, { played: 22, stacks: [3 * U, 50 * U, 95 * U - 1, 2 * U, 1] }), T0, rng);
    expect([t.handNo, t.phase, t.hand!.blind]).toEqual([23, "triche", 4 * U]);
    expect(t.hand!.pot).toBe(3 * U + 4 * U + 4 * U + 2 * U + 1);
    expect(stacksOf(t)).toEqual([0, 46 * U, 91 * U - 1, 0, 0]);
    expect(chipsOnTable(t)).toBe(ALL);
    // Un euro suffit pour être servi : personne n'est écarté d'office.
    expect(t.hand!.players.map((p) => p.seat).sort()).toEqual([0, 1, 2, 3, 4]);
    const posted = t.log.filter((e) => e.hand === 23 && e.kind === "blinde").map((e) => [e.seat, e.amount, e.allIn ?? false]).sort();
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
    // 31e main, blinde de 80 Bn€. Seul Gaspard (siège 1) peut la payer en entier.
    let t = advance(mastersAt(rng, { played: 30, stacks: [5 * U, 135 * U, 4 * U, 3 * U, 3 * U] }), T0, rng);
    expect([t.hand!.blind, t.hand!.pot, stacksOf(t)]).toEqual([8 * U, 23 * U, [0, 127 * U, 0, 0, 0]]);
    t = act(hostsSilent(t), "p_a", { type: "franc-jeu" }, T0, rng);
    // Trois des huit blindes de Gaspard lui reviennent : le plus gros tapis en face n'en a suivi que cinq.
    expect([t.phase, t.hand!.pot, stacksOf(t)]).toEqual(["abattage", 20 * U, [0, 130 * U, 0, 0, 0]]);
    expect(t.log.find((e) => e.hand === 31 && e.kind === "rendu")).toMatchObject({ seat: 1, amount: 3 * U });
    expect(t.log.some((e) => e.hand === 31 && ["parole", "mise", "suit", "relance", "couche"].includes(e.kind))).toBe(false);
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
    // Le barème est réglé pour qu'une table se dénoue en 25 à 35 mains en médiane.
    expect(at(lengths, 0.5)).toBeGreaterThanOrEqual(25);
    expect(at(lengths, 0.5)).toBeLessThanOrEqual(35);
    expect(at(lengths, 0.1)).toBeGreaterThanOrEqual(5);
    expect(at(lengths, 0.9)).toBeLessThanOrEqual(50);
    expect(lengths[lengths.length - 1]!).toBeLessThanOrEqual(70);
    // Un robot à la place du joueur la gagne une fois sur cinq, et il lui faut une quarantaine de mains.
    expect(wins.length).toBeGreaterThanOrEqual(25);
    expect(wins.length).toBeLessThanOrEqual(55);
    expect(at(wins, 0.5)).toBeGreaterThanOrEqual(35);
    expect(at(wins, 0.5)).toBeLessThanOrEqual(50);
    // Assez de tout pour que ces invariants veuillent dire quelque chose.
    expect(eliminations).toBeGreaterThan(300);
    expect(shortBlinds).toBeGreaterThan(100);
    expect(sidePots).toBeGreaterThan(100);
    expect(carried).toBeGreaterThan(5);
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
    // 60 tables : les accusations justes que chaque siège a subies, rapportées aux mains qu'il a jouées.
    const suffered = [0, 0, 0, 0, 0];
    const played = [0, 0, 0, 0, 0];
    for (let seed = 1; seed <= 60; seed++) {
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
  });
});
