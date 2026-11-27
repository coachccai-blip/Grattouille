// Le moteur du Poker Tricheur (POKER.md, sections 1 à 3) : cartes, combinaisons, pots
// annexes, machine à états d'une main et d'une table, vues, robots, tables de la maison.
// Tout est pur : un état, une action ou une heure, un hasard injecté.

import { describe, expect, it } from "vitest";
import { PLACES } from "../shared/places";
import {
  ACCUSE_MS, BLIND_LADDER, BOT_MAX_MS, BOT_MIN_MS, BOT_PERSONAS, CATEGORIES, CHALLENGE_LEVEL_HANDS, CHEAT_MS, DECK,
  IDLE_TABLE_MS, MAX_BLIND, MAX_TABLE_CHIPS, RESERVE_MS, RESTART_MS, RESULT_MS, TURN_MS, WALKOVER_MS,
  PokerError, act, advance, allowedBlinds, betOptions, blindAt, botAccuse, botBet, botCheat, canDeal, cancel,
  cardRank, cardSuit, challengeBlind, challengeOf, challengeRise, chipsOnTable, compareHands, createTable, deposit,
  difficultyOf, evaluate, handStrength, houseOf, isBlind, isCard, leave, makeCard, newTableCode, nextEventAt,
  normalizeTableCode, pickPersonas, placeBlind, playerInHand, possibleSwaps, rebuyRange, seatIndexOf, settled,
  shuffledDeck, sidePots, sit, splitPot, viewFor, viewOfSeat,
  type Card, type Difficulty, type GameAction, type HandCategory, type Random32, type TableSpec, type TableState,
  type TableView,
} from "../shared/poker";
import { CODE_ALPHABET } from "../shared/rules";
import { cheapestTicket } from "../shared/tickets";

const T0 = Date.UTC(2026, 10, 26, 20, 0, 0);
const IDS = ["p_a", "p_b", "p_c", "p_d", "p_e", "p_f"] as const;

/** Un hasard reproductible (mulberry32) : assez bon pour compter des fréquences. */
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
/** Les tirages donnés, dans l'ordre, puis toujours le dernier. */
function sequence(...values: number[]): Random32 {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]! >>> 0;
}

const hand = (text: string): Card[] => text.split(" ");
const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

function freeze<T>(x: T): T {
  if (x && typeof x === "object") {
    Object.freeze(x);
    for (const value of Object.values(x as object)) freeze(value);
  }
  return x;
}

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

interface Setup {
  /** Les caves des joueurs humains, dans l'ordre des sièges. */
  stacks: number[];
  blind?: number;
  max?: number;
  bots?: string[];
  difficulty?: Difficulty;
  seats?: number;
  kind?: TableSpec["kind"];
}

/** Une table où chaque joueur a posé sa cave. La partie n'est pas lancée. */
function tableOf(setup: Setup, rng: Random32 = rngOf()): TableState {
  const blind = setup.blind ?? 10;
  const bots = setup.bots ?? [];
  let t = createTable({
    code: "ABCDE", kind: setup.kind ?? "privee", place: null, blind, maxBuyIn: setup.max ?? blind * 100,
    seats: setup.seats ?? setup.stacks.length + bots.length, bots, difficulty: setup.difficulty ?? "normal",
  }, T0);
  setup.stacks.forEach((stack, i) => {
    t = sit(t, { playerId: IDS[i]!, sid: `s_${i}`, pseudo: `Joueur ${i}`, species: "chat", look: null }, T0, rng);
    t = deposit(t, `s_${i}`, 1, stack, T0, rng);
  });
  return t;
}

/** La même, la première main donnée : on en est à la triche. */
function dealt(setup: Setup, rng: Random32 = rngOf(), now = T0): TableState {
  return act(tableOf(setup, rng), IDS[0], { type: "lancer" }, now, rng);
}

/** Remplace les cartes de certains sièges : le test choisit les mains. */
function withHands(t: TableState, hands: Record<number, string>): TableState {
  const next = copy(t);
  for (const [seat, text] of Object.entries(hands)) {
    const p = next.hand!.players.find((x) => x.seat === Number(seat))!;
    p.cards = hand(text);
  }
  return next;
}

function play(t: TableState, seat: number, action: GameAction, now = T0, rng: Random32 = rngOf(7)): TableState {
  return act(t, IDS[seat]!, action, now, rng);
}

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

const stacksOf = (t: TableState) => t.seats.map((s) => (s ? s.stack : null));
const netOf = (t: TableState) => Object.fromEntries(t.result!.net.map((n) => [n.seat, n.amount]));
/** Les comptes d'une table tombent juste. */
function audited(t: TableState): void {
  expect(chipsOnTable(t)).toBe(t.audit.in - t.audit.out + t.audit.bank);
}

// ---------------------------------------------------------------------------

describe("cartes", () => {
  it("un paquet de 52 cartes distinctes, quatre couleurs de treize valeurs", () => {
    expect(DECK).toHaveLength(52);
    expect(new Set(DECK).size).toBe(52);
    expect(DECK.every(isCard)).toBe(true);
    for (const suit of ["s", "h", "d", "c"] as const) {
      expect(DECK.filter((c) => cardSuit(c) === suit).map(cardRank).sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    }
    expect([cardRank("Ah"), cardRank("Td"), cardRank("2c"), cardSuit("Ks")]).toEqual([14, 10, 2, "s"]);
    expect([makeCard(14, "h"), makeCard(10, "d"), makeCard(2, "c")]).toEqual(["Ah", "Td", "2c"]);
    for (const bad of ["", "A", "Ahh", "1h", "Ax", "ah", "10h", 12, null, undefined]) expect(isCard(bad)).toBe(false);
  });

  it("le mélange rend les 52 cartes, dans un ordre qui dépend du hasard injecté", () => {
    const a = shuffledDeck(rngOf(1));
    const b = shuffledDeck(rngOf(2));
    expect([...a].sort()).toEqual([...DECK].sort());
    expect(a).not.toEqual(b);
    expect(shuffledDeck(rngOf(1))).toEqual(a);
    expect(a).not.toEqual(DECK);
  });

  it("le mélange est équitable : chaque carte passe partout", () => {
    const rng = rngOf(99);
    const first = new Map<Card, number>();
    for (let i = 0; i < 5_200; i++) {
      const top = shuffledDeck(rng)[0]!;
      first.set(top, (first.get(top) ?? 0) + 1);
    }
    expect(first.size).toBe(52);
    for (const count of first.values()) {
      expect(count).toBeGreaterThan(55);
      expect(count).toBeLessThan(150);
    }
  });
});

describe("combinaisons", () => {
  const EXAMPLES: [HandCategory, string, number[]][] = [
    ["carte-haute", "Ah Kd 9c 5s 2h", [14, 13, 9, 5, 2]],
    ["paire", "9h 9d Ac 5s 2h", [9, 14, 5, 2]],
    ["deux-paires", "Kh Kd 4c 4s Ah", [13, 4, 14]],
    ["brelan", "7h 7d 7c Ks 2h", [7, 13, 2]],
    ["suite", "9h 8d 7c 6s 5h", [9]],
    ["couleur", "Ah Jh 9h 5h 2h", [14, 11, 9, 5, 2]],
    ["full", "3h 3d 3c Ks Kh", [3, 13]],
    ["carre", "5h 5d 5c 5s Kh", [5, 13]],
    ["quinte-flush", "9s 8s 7s 6s 5s", [9]],
  ];

  it("chaque combinaison est reconnue, de la carte haute à la quinte flush", () => {
    EXAMPLES.forEach(([category, text, ranks], level) => {
      const value = evaluate(hand(text));
      expect([text, value.category, value.level, value.ranks]).toEqual([text, category, level, ranks]);
    });
    expect(EXAMPLES.map(([c]) => c)).toEqual([...CATEGORIES]);
  });

  it("l'ordre des cartes dans la main ne change rien", () => {
    const rng = rngOf(5);
    for (const [, text] of EXAMPLES) {
      const cards = hand(text);
      const score = evaluate(cards).score;
      for (let i = 0; i < 10; i++) {
        const shuffled = [...cards].sort(() => (rng() % 2 === 0 ? 1 : -1));
        expect(evaluate(shuffled).score).toBe(score);
      }
    }
  });

  it("chaque combinaison bat toutes celles d'en dessous, même la plus belle d'entre elles", () => {
    // La plus petite main de chaque combinaison bat la plus grande de la combinaison précédente.
    const lowest = ["7h 5d 4c 3s 2h", "2h 2d 5c 4s 3h", "3h 3d 2c 2s 4h", "2h 2d 2c 4s 3h", "5h 4d 3c 2s Ah", "7h 5h 4h 3h 2h", "2h 2d 2c 3s 3h", "2h 2d 2c 2s 3h", "5s 4s 3s 2s As"];
    const highest = ["Ah Kd Qc Js 9h", "Ah Ad Kc Qs Jh", "Ah Ad Kc Ks Qh", "Ah Ad Ac Ks Qh", "Ah Kd Qc Js Th", "Ah Kh Qh Jh 9h", "Ah Ad Ac Ks Kh", "Ah Ad Ac As Kh", "As Ks Qs Js Ts"];
    for (let level = 0; level < CATEGORIES.length; level++) {
      expect(evaluate(hand(lowest[level]!)).category).toBe(CATEGORIES[level]);
      expect(evaluate(hand(highest[level]!)).category).toBe(CATEGORIES[level]);
      expect(compareHands(hand(highest[level]!), hand(lowest[level]!))).toBeGreaterThan(0);
      if (level > 0) expect(compareHands(hand(lowest[level]!), hand(highest[level - 1]!))).toBeGreaterThan(0);
    }
  });

  it("à combinaison égale, la hauteur départage, puis les cartes d'accompagnement", () => {
    const beats = (a: string, b: string) => expect([a, b, compareHands(hand(a), hand(b)) > 0]).toEqual([a, b, true]);
    beats("Ah Qd 9c 5s 2h", "Kh Qd Jc Ts 8h");   // carte haute : l'as
    beats("Ah Kd 9c 5s 3h", "Ad Kc 9s 5h 2d");   // carte haute : la dernière carte
    beats("Th Td 4c 3s 2h", "9h 9d Ac Ks Qh");   // paire : la paire d'abord
    beats("9h 9d Ac 5s 2h", "9c 9s Kc Qs Jh");   // paire : puis la plus haute carte à côté
    beats("9h 9d Ac 5s 3h", "9c 9s Ad 5h 2h");
    beats("Ah Ad 2c 2s 3h", "Kh Kd Qc Qs Jh");   // deux paires : la plus haute paire
    beats("Kh Kd 5c 5s 2h", "Kc Ks 4c 4s Ah");   // deux paires : la seconde paire
    beats("Kh Kd 5c 5s 9h", "Kc Ks 5d 5h 8h");   // deux paires : la cinquième carte
    beats("8h 8d 8c 3s 2h", "7h 7d 7c As Kh");   // brelan
    beats("8h 8d 8c As 2h", "8h 8d 8c Ks Qh");   // brelan : même brelan (une carte en double chez l'un), l'as
    beats("Th 9d 8c 7s 6h", "9h 8d 7c 6s 5h");   // suite : la plus haute carte
    beats("Ah Jh 9h 5h 3h", "Ad Jd 9d 5d 2d");   // couleur : la dernière carte
    beats("4h 4d 4c 2s 2h", "3h 3d 3c As Ah");   // full : le brelan d'abord
    beats("4h 4d 4c As Ah", "4h 4d 4c Ks Kh");   // full : puis la paire
    beats("6h 6d 6c 6s 2h", "5h 5d 5c 5s Ah");   // carré
    beats("6h 6d 6c 6s Ah", "6h 6d 6c 6s Kh");
    beats("Ts 9s 8s 7s 6s", "9h 8h 7h 6h 5h");   // quinte flush
  });

  it("égalité : les couleurs ne départagent jamais", () => {
    expect(compareHands(hand("Ah Kd Qc Js 9h"), hand("Ad Kc Qs Jh 9c"))).toBe(0);
    expect(compareHands(hand("9h 8d 7c 6s 5h"), hand("9d 8c 7s 6h 5d"))).toBe(0);
    expect(compareHands(hand("Ah Jh 9h 5h 2h"), hand("As Js 9s 5s 2s"))).toBe(0);
    expect(compareHands(hand("Kh Kd 4c 4s Ah"), hand("Kc Ks 4d 4h Ad"))).toBe(0);
  });

  it("la roue : l'as vaut 1 dans A-2-3-4-5, et la suite est au cinq", () => {
    const wheel = evaluate(hand("Ah 2d 3c 4s 5h"));
    expect([wheel.category, wheel.ranks]).toEqual(["suite", [5]]);
    // La roue est la plus petite suite : la suite au six la bat, le brelan d'as perd.
    expect(compareHands(hand("6h 5d 4c 3s 2h"), hand("Ah 2d 3c 4s 5h"))).toBeGreaterThan(0);
    expect(compareHands(hand("Ah 2d 3c 4s 5h"), hand("Ah Ad Ac Ks Qh"))).toBeGreaterThan(0);
    // L'as vaut aussi 14 : la suite à l'as.
    expect(evaluate(hand("Ah Kd Qc Js Th")).ranks).toEqual([14]);
    // Mais il ne fait pas le tour : Q-K-A-2-3 n'est pas une suite.
    expect(evaluate(hand("Qh Kd Ac 2s 3h")).category).toBe("carte-haute");
    // La roue dans une seule couleur est une quinte flush, la plus petite.
    const steel = evaluate(hand("As 2s 3s 4s 5s"));
    expect([steel.category, steel.ranks]).toEqual(["quinte-flush", [5]]);
    expect(compareHands(hand("6s 5s 4s 3s 2s"), hand("As 2s 3s 4s 5s"))).toBeGreaterThan(0);
    expect(compareHands(hand("As 2s 3s 4s 5s"), hand("Ah Ad Ac As Kh"))).toBeGreaterThan(0);
  });

  it("le score classe 2 000 mains au hasard comme la comparaison carte à carte", () => {
    const rng = rngOf(2026);
    const order = (a: Card[], b: Card[]) => {
      const x = evaluate(a);
      const y = evaluate(b);
      if (x.level !== y.level) return x.level - y.level;
      for (let i = 0; i < Math.max(x.ranks.length, y.ranks.length); i++) {
        if ((x.ranks[i] ?? 0) !== (y.ranks[i] ?? 0)) return (x.ranks[i] ?? 0) - (y.ranks[i] ?? 0);
      }
      return 0;
    };
    const seen = new Set<string>();
    for (let i = 0; i < 2_000; i++) {
      const deck = shuffledDeck(rng);
      const a = deck.slice(0, 5);
      const b = deck.slice(5, 10);
      expect(Math.sign(compareHands(a, b))).toBe(Math.sign(order(a, b)));
      seen.add(evaluate(a).category);
    }
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  it("une main compte cinq cartes", () => {
    expect(() => evaluate(hand("Ah Kd Qc Js"))).toThrow(RangeError);
    expect(() => evaluate(hand("Ah Kd Qc Js 9h 2c"))).toThrow(RangeError);
  });
});

describe("pots annexes", () => {
  const total = (pots: { amount: number }[]) => pots.reduce((s, p) => s + p.amount, 0);

  it("tout le monde a mis autant : un seul pot", () => {
    expect(sidePots([{ seat: 0, amount: 50, live: true }, { seat: 1, amount: 50, live: true }, { seat: 2, amount: 50, live: true }]))
      .toEqual([{ amount: 150, eligible: [0, 1, 2] }]);
  });

  it("un joueur à tapis pour moins ne prétend qu'au pot principal", () => {
    const pots = sidePots([{ seat: 0, amount: 100, live: true }, { seat: 1, amount: 300, live: true }, { seat: 2, amount: 300, live: true }]);
    expect(pots).toEqual([{ amount: 300, eligible: [0, 1, 2] }, { amount: 400, eligible: [1, 2] }]);
  });

  it("trois hauteurs de tapis : trois pots", () => {
    const pots = sidePots([
      { seat: 0, amount: 20, live: true }, { seat: 1, amount: 70, live: true },
      { seat: 2, amount: 200, live: true }, { seat: 3, amount: 200, live: true },
    ]);
    expect(pots).toEqual([
      { amount: 80, eligible: [0, 1, 2, 3] }, { amount: 150, eligible: [1, 2, 3] }, { amount: 260, eligible: [2, 3] },
    ]);
    expect(total(pots)).toBe(490);
  });

  it("l'argent d'un joueur couché reste dans les paliers qu'il a atteints", () => {
    const pots = sidePots([
      { seat: 0, amount: 100, live: true }, { seat: 1, amount: 300, live: true },
      { seat: 2, amount: 300, live: true }, { seat: 3, amount: 150, live: false },
    ]);
    expect(pots).toEqual([{ amount: 400, eligible: [0, 1, 2] }, { amount: 450, eligible: [1, 2] }]);
    expect(total(pots)).toBe(850);
  });

  it("le pot resté de la main précédente rejoint le pot principal", () => {
    const pots = sidePots([{ seat: 0, amount: 10, live: true }, { seat: 1, amount: 40, live: true }, { seat: 2, amount: 40, live: true }], 75);
    expect(pots).toEqual([{ amount: 105, eligible: [0, 1, 2] }, { amount: 60, eligible: [1, 2] }]);
  });

  it("rien ne se perd : la somme des pots vaut la somme des mises, quelles qu'elles soient", () => {
    const rng = rngOf(77);
    for (let i = 0; i < 500; i++) {
      const n = 2 + (rng() % 5);
      const stakes = Array.from({ length: n }, (_, seat) => ({ seat, amount: 1 + (rng() % 60), live: rng() % 3 !== 0 }));
      if (!stakes.some((s) => s.live)) stakes[0]!.live = true;
      const dead = rng() % 40;
      const pots = sidePots(stakes, dead);
      expect(total(pots)).toBe(stakes.reduce((s, x) => s + x.amount, 0) + dead);
      for (const pot of pots) {
        expect(pot.amount).toBeGreaterThan(0);
        for (const seat of pot.eligible) expect(stakes[seat]!.live).toBe(true);
      }
      // Chaque pot a moins de prétendants que le précédent.
      for (let k = 1; k < pots.length; k++) expect(pots[k]!.eligible.length).toBeLessThan(pots[k - 1]!.eligible.length);
    }
  });

  it("partage : parts égales, l'euro indivisible au premier après le donneur", () => {
    // Ordre de parole : 2, 0, 1 (le donneur est le siège 1).
    expect(splitPot(100, [0, 2], [2, 0, 1])).toEqual([{ seat: 2, amount: 50 }, { seat: 0, amount: 50 }]);
    expect(splitPot(101, [0, 2], [2, 0, 1])).toEqual([{ seat: 2, amount: 51 }, { seat: 0, amount: 50 }]);
    expect(splitPot(101, [0, 1], [2, 0, 1])).toEqual([{ seat: 0, amount: 51 }, { seat: 1, amount: 50 }]);
    expect(splitPot(11, [0, 1, 2], [2, 0, 1])).toEqual([{ seat: 2, amount: 4 }, { seat: 0, amount: 4 }, { seat: 1, amount: 3 }]);
    expect(splitPot(7, [1], [2, 0, 1])).toEqual([{ seat: 1, amount: 7 }]);
    expect(splitPot(7, [], [2, 0, 1])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("une table", () => {
  it("une table neuve : les robots sont assis aux derniers sièges, personne d'autre", () => {
    const t = createTable({ code: "ABCDE", kind: "privee", place: null, blind: 5, maxBuyIn: 300, seats: 5, bots: ["hector", "ondine"], difficulty: "difficile" }, T0);
    expect(t).toMatchObject({
      code: "ABCDE", kind: "privee", blind: 5, minBuyIn: 100, maxBuyIn: 300, difficulty: "difficile",
      phase: "attente", started: false, version: 1, handNo: 0, dealer: -1, carry: 0, owner: null, hand: null, result: null,
    });
    expect(t.seats.map((s) => s?.bot ?? null)).toEqual([null, null, null, "hector", "ondine"]);
    expect(t.seats.filter(Boolean).map((s) => s!.stack)).toEqual([300, 300]);
    // L'argent des robots est fictif : la table le compte à part.
    expect(t.audit).toEqual({ in: 0, out: 0, bank: 600 });
    audited(t);
  });

  it("refuse une table mal réglée", () => {
    const base: TableSpec = { code: "ABCDE", kind: "privee", place: null, blind: 10, maxBuyIn: 500, seats: 4, bots: [], difficulty: "normal" };
    for (const change of [
      { seats: 1 }, { seats: 7 }, { seats: 2.5 }, { blind: 0 }, { blind: 1.5 }, { blind: -3 },
      { maxBuyIn: 190 }, { maxBuyIn: 1010 }, { maxBuyIn: 500.5 }, { bots: ["a", "b", "c", "d"] },
    ]) {
      expect([JSON.stringify(change), refusal(() => createTable({ ...base, ...change }, T0))]).toEqual([JSON.stringify(change), "BAD_REQUEST"]);
    }
    expect(refusal(() => createTable({ ...base, maxBuyIn: 200 }, T0))).toBe("accepté");
    expect(refusal(() => createTable({ ...base, maxBuyIn: 1000, bots: ["a", "b", "c"] }, T0))).toBe("accepté");
  });

  it("s'asseoir réserve un siège sans argent ; la cave arrive ensuite", () => {
    const rng = rngOf();
    let t = createTable({ code: "ABCDE", kind: "privee", place: null, blind: 10, maxBuyIn: 1000, seats: 3, bots: [], difficulty: "normal" }, T0);
    t = sit(t, { playerId: "p_a", sid: "s_a", pseudo: "Ada", species: "chat", look: { chapeau: "beret", lunettes: null, tenue: null, accessoire: null } }, T0, rng);
    expect(t.seats[0]).toMatchObject({ playerId: "p_a", sid: "s_a", pseudo: "Ada", stack: 0, seq: 0, received: 0 });
    expect(t.owner).toBe("p_a");
    expect(viewFor(t, "p_a", T0).seats[0]).toMatchObject({ pseudo: "Ada", bot: null, species: "chat", funded: false, stack: 0, look: { chapeau: "beret" } });
    // S'asseoir deux fois ne change rien.
    expect(sit(t, { playerId: "p_a", sid: "s_autre", pseudo: "Ada", species: "chat", look: null }, T0, rng)).toBe(t);
    t = deposit(t, "s_a", 1, 400, T0, rng);
    expect(t.seats[0]).toMatchObject({ stack: 400, seq: 1, received: 400 });
    expect(t.audit).toEqual({ in: 400, out: 0, bank: 0 });
    t = sit(t, { playerId: "p_b", sid: "s_b", pseudo: "Bob", species: "ours", look: null }, T0, rng);
    t = sit(t, { playerId: "p_c", sid: "s_c", pseudo: "Cléo", species: "lapin", look: null }, T0, rng);
    expect(t.seats.map((s) => s?.pseudo)).toEqual(["Ada", "Bob", "Cléo"]);
    expect(refusal(() => sit(t, { playerId: "p_d", sid: "s_d", pseudo: "Dédé", species: "chat", look: null }, T0, rng))).toBe("TABLE_FULL");
    audited(t);
  });

  it("un siège réservé dont la cave n'arrive pas est libéré au bout de 30 secondes", () => {
    const rng = rngOf();
    let t = tableOf({ stacks: [500], seats: 3 });
    t = sit(t, { playerId: "p_b", sid: "s_b", pseudo: "Bob", species: "ours", look: null }, T0 + 5_000, rng);
    expect(nextEventAt(t)).toBe(T0 + 5_000 + RESERVE_MS);
    expect(advance(t, T0 + 5_000 + RESERVE_MS - 1, rng)).toBe(t);
    const after = advance(t, T0 + 5_000 + RESERVE_MS, rng);
    expect(after.seats[1]).toBeNull();
    // La table garde une trace du départ : si la bourse avait payé entre-temps, elle sera remboursée.
    expect(after.ended).toEqual([{ sid: "s_b", playerId: "p_b", seat: 1, payout: 0, received: 0, reason: "reserve", at: T0 + 5_000 + RESERVE_MS }]);
    expect(after.phase).toBe("attente");
    // Une cave arrivée trop tard ne ressuscite pas le siège.
    expect(deposit(after, "s_b", 1, 300, T0 + 40_000, rng)).toBe(after);
  });

  it("annuler une réservation : sans effet si la cave est déjà posée", () => {
    const rng = rngOf();
    let t = tableOf({ stacks: [500], seats: 3 });
    expect(cancel(t, "s_0", T0, rng)).toBe(t);
    expect(cancel(t, "s_inconnue", T0, rng)).toBe(t);
    t = sit(t, { playerId: "p_b", sid: "s_b", pseudo: "Bob", species: "ours", look: null }, T0, rng);
    const after = cancel(t, "s_b", T0, rng);
    expect(after.seats[1]).toBeNull();
    expect(after.ended.map((e) => [e.sid, e.payout, e.reason])).toEqual([["s_b", 0, "reserve"]]);
    expect(after.phase).toBe("attente");
  });

  it("seul le créateur lance la partie, et il faut deux joueurs capables de payer la blinde", () => {
    const alone = tableOf({ stacks: [500], seats: 3 });
    expect(viewFor(alone, "p_a", T0).options.start).toBe(false);
    expect(refusal(() => play(alone, 0, { type: "lancer" }))).toBe("ACTION_IMPOSSIBLE");
    const two = tableOf({ stacks: [500, 500], seats: 3 });
    expect(viewFor(two, "p_a", T0).options.start).toBe(true);
    expect(viewFor(two, "p_b", T0).options.start).toBe(false);
    expect(refusal(() => play(two, 1, { type: "lancer" }))).toBe("ACTION_IMPOSSIBLE");
    const started = play(two, 0, { type: "lancer" });
    expect([started.started, started.phase, started.handNo]).toEqual([true, "triche", 1]);
    expect(refusal(() => play(started, 0, { type: "lancer" }))).toBe("ACTION_IMPOSSIBLE");
    // Un joueur dont la cave n'est pas posée ne compte pas.
    let reserved = tableOf({ stacks: [500], seats: 3 });
    reserved = sit(reserved, { playerId: "p_b", sid: "s_b", pseudo: "Bob", species: "ours", look: null }, T0, rngOf());
    expect(refusal(() => play(reserved, 0, { type: "lancer" }))).toBe("ACTION_IMPOSSIBLE");
    // Un robot suffit comme adversaire.
    const bot = tableOf({ stacks: [500], bots: ["enzo"] });
    expect(play(bot, 0, { type: "lancer" }).phase).toBe("triche");
  });

  it("si le créateur s'en va avant de lancer, la table passe au joueur suivant", () => {
    const t = tableOf({ stacks: [500, 500, 500] });
    const after = leave(t, "p_a", T0, rngOf());
    expect(after.owner).toBe("p_b");
    expect(viewFor(after, "p_b", T0).options.start).toBe(true);
    expect(viewFor(after, "p_b", T0).owner).toBe(1);
  });

  it("aucune fonction ne modifie l'état qu'elle reçoit", () => {
    const rng = rngOf(3);
    const t = freeze(dealt({ stacks: [500, 500, 500], bots: ["gaspard"], seats: 5 }));
    const snapshot = JSON.stringify(t);
    const next = act(t, "p_a", { type: "franc-jeu" }, T0, rng);
    expect(next).not.toBe(t);
    advance(t, T0 + 120_000, rng);
    deposit(t, "s_0", 2, 600, T0, rng);
    leave(t, "p_b", T0, rng);
    cancel(t, "s_1", T0, rng);
    sit(t, { playerId: "p_z", sid: "s_z", pseudo: "Zoé", species: "chat", look: null }, T0, rng);
    settled(t, ["s_0"]);
    viewFor(t, "p_a", T0);
    expect(JSON.stringify(t)).toBe(snapshot);
    // Quand rien ne change, c'est le même objet qui revient.
    expect(advance(t, T0, rng)).toBe(t);
    expect(deposit(t, "s_0", 1, 500, T0, rng)).toBe(t);
    expect(settled(t, ["s_0"])).toBe(t);
  });

  it("le numéro de version augmente à chaque changement, et seulement alors", () => {
    const rng = rngOf();
    let t = dealt({ stacks: [500, 500] });
    const v = t.version;
    expect(advance(t, T0 + 1_000, rng).version).toBe(v);
    t = play(t, 0, { type: "franc-jeu" });
    expect(t.version).toBe(v + 1);
    t = play(t, 1, { type: "franc-jeu" });
    expect(t.version).toBe(v + 2);
    const late = advance(t, T0 + TURN_MS, rng);
    expect(late.version).toBe(v + 3);
  });
});

describe("la blinde et la donne", () => {
  it("chaque joueur paie la blinde et reçoit cinq cartes d'un même paquet", () => {
    const t = dealt({ stacks: [1000, 1000, 1000] });
    const h = t.hand!;
    expect([t.phase, t.handNo, t.dealer]).toEqual(["triche", 1, 0]);
    // La parole part du voisin du donneur : le donneur parle en dernier.
    expect(h.players.map((p) => p.seat)).toEqual([1, 2, 0]);
    expect(h.pot).toBe(30);
    expect(stacksOf(t)).toEqual([990, 990, 990]);
    expect(h.players.map((p) => p.committed)).toEqual([10, 10, 10]);
    const all = h.players.flatMap((p) => p.cards);
    expect(all).toHaveLength(15);
    expect(new Set(all).size).toBe(15);
    expect(all.every(isCard)).toBe(true);
    expect(h.deadline).toBe(T0 + CHEAT_MS);
    expect(t.log.map((e) => e.kind)).toEqual(["arrivee", "cave", "arrivee", "cave", "arrivee", "cave", "blinde", "blinde", "blinde", "donne"]);
    audited(t);
  });

  it("le donneur tourne à chaque main", () => {
    const rng = rngOf(4);
    let t = dealt({ stacks: [1000, 1000, 1000] }, rng);
    const dealers = [t.dealer];
    const speakers = [t.hand!.players[0]!.seat];
    for (let i = 0; i < 4; i++) {
      t = allQuiet(checkAround(allFair(t)));
      t = advance(t, t.clock + RESULT_MS, rng);
      dealers.push(t.dealer);
      speakers.push(t.hand!.players[0]!.seat);
    }
    expect(dealers).toEqual([0, 1, 2, 0, 1]);
    expect(speakers).toEqual([1, 2, 0, 1, 2]);
  });

  it("qui ne peut pas payer la blinde ne reçoit pas de cartes ; qui la paie tout juste est à tapis", () => {
    const t = dealt({ stacks: [1000, 9, 10, 1000] });
    expect(t.hand!.players.map((p) => p.seat)).toEqual([2, 3, 0]);
    expect(playerInHand(t, 1)).toBeNull();
    expect(playerInHand(t, 2)).toMatchObject({ committed: 10, allIn: true });
    expect(stacksOf(t)).toEqual([990, 9, 0, 990]);
    const view = viewFor(t, "p_b", T0);
    expect(view.hand).toBeNull();
    expect(view.seats[1]).toMatchObject({ inHand: false, stack: 9 });
    expect(view.seats[2]).toMatchObject({ inHand: true, allIn: true });
  });

  it("deux mains de suite ne se ressemblent pas, et le même hasard redonne la même main", () => {
    const a = dealt({ stacks: [500, 500] }, rngOf(10));
    const b = dealt({ stacks: [500, 500] }, rngOf(11));
    const again = dealt({ stacks: [500, 500] }, rngOf(10));
    expect(a.hand!.players.map((p) => p.cards)).not.toEqual(b.hand!.players.map((p) => p.cards));
    expect(a).toEqual(again);
  });
});

describe("la triche", () => {
  const base = () => withHands(dealt({ stacks: [1000, 1000, 1000] }), { 0: "Ah Kd 9c 5s 2h", 1: "Kc Kh 9s 4h 3c", 2: "Qs Jd 8c 6h 2s" });

  it("remplacer une carte par la carte de son choix", () => {
    const t = play(base(), 1, { type: "tricher", index: 2, card: "Ks" });
    const p = playerInHand(t, 1)!;
    expect(p.cards).toEqual(hand("Kc Kh Ks 4h 3c"));
    expect(p.swap).toEqual({ index: 2, from: "9s" });
    expect(p.chosen).toBe(true);
    // Les autres n'ont pas encore choisi : on attend.
    expect(t.phase).toBe("triche");
    const mine = viewFor(t, "p_b", T0);
    expect(mine.hand).toMatchObject({ cards: hand("Kc Kh Ks 4h 3c"), category: "brelan", swap: { index: 2, from: "9s" }, chosen: true });
    expect(mine.options.cheat).toBe(false);
  });

  it("on peut prendre une carte qu'un autre joueur a en main : deux joueurs montreront la même", () => {
    // L'as de cœur est dans la main du siège 0.
    let t = play(base(), 1, { type: "tricher", index: 4, card: "Ah" });
    expect(playerInHand(t, 1)!.cards).toEqual(hand("Kc Kh 9s 4h Ah"));
    t = allQuiet(checkAround(allFair(t)));
    const shown = t.result!.hands.flatMap((x) => x.cards);
    expect(shown.filter((c) => c === "Ah")).toHaveLength(2);
  });

  it("pas une carte qu'on a déjà en main, ni deux fois, ni hors du temps de la triche", () => {
    const t = base();
    // Une carte de sa propre main, y compris celle qu'on remplace.
    expect(refusal(() => play(t, 1, { type: "tricher", index: 2, card: "Kc" }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 1, { type: "tricher", index: 2, card: "9s" }))).toBe("ACTION_IMPOSSIBLE");
    // Une place ou une carte qui n'existent pas.
    for (const [index, card] of [[5, "Ks"], [-1, "Ks"], [1.5, "Ks"], [2, "Kx"], [2, "1s"], [2, ""]] as const) {
      expect(refusal(() => play(t, 1, { type: "tricher", index, card }))).toBe("BAD_REQUEST");
    }
    // Un seul choix par main, triche ou franc jeu.
    const cheated = play(t, 1, { type: "tricher", index: 2, card: "Ks" });
    expect(refusal(() => play(cheated, 1, { type: "tricher", index: 3, card: "Kd" }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(cheated, 1, { type: "franc-jeu" }))).toBe("ACTION_IMPOSSIBLE");
    const fair = play(t, 1, { type: "franc-jeu" });
    expect(refusal(() => play(fair, 1, { type: "tricher", index: 2, card: "Ks" }))).toBe("ACTION_IMPOSSIBLE");
    // Une fois les enchères commencées, il est trop tard.
    const betting = allFair(t);
    expect(betting.phase).toBe("encheres");
    expect(refusal(() => play(betting, 1, { type: "tricher", index: 2, card: "Ks" }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(betting, 1, { type: "franc-jeu" }))).toBe("ACTION_IMPOSSIBLE");
  });

  it("jamais cinq cartes identiques : les 235 remplacements possibles donnent tous cinq cartes distinctes", () => {
    const cards = hand("Kc Kh Ks Kd 3c");
    const swaps = possibleSwaps(cards);
    expect(swaps).toHaveLength(5 * 47);
    for (const { swap } of swaps) {
      expect(cards.includes(swap.card)).toBe(false);
      const next = [...cards];
      next[swap.index] = swap.card;
      expect(new Set(next).size).toBe(5);
    }
  });

  it("les enchères commencent quand tout le monde a choisi, sans attendre la fin du délai", () => {
    let t = base();
    t = play(t, 0, { type: "franc-jeu" }, T0 + 2_000);
    t = play(t, 2, { type: "tricher", index: 0, card: "6d" }, T0 + 3_000);
    expect(t.phase).toBe("triche");
    t = play(t, 1, { type: "franc-jeu" }, T0 + 4_000);
    expect([t.phase, t.hand!.turn, t.hand!.deadline]).toEqual(["encheres", 1, T0 + 4_000 + TURN_MS]);
  });

  it("un joueur qui n'est pas dans la main ne peut pas tricher", () => {
    const t = dealt({ stacks: [1000, 5, 1000] });
    expect(refusal(() => play(t, 1, { type: "franc-jeu" }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => act(t, "p_inconnu", { type: "franc-jeu" }, T0, rngOf()))).toBe("NOT_SEATED");
  });
});

describe("les enchères", () => {
  const betting = (stacks = [1000, 1000, 1000], blind = 10) => allFair(dealt({ stacks, blind }));
  const options = (t: TableState, seat: number) => viewFor(t, IDS[seat]!, T0).options;

  it("la parole part du voisin du donneur ; parole pour tous mène à l'abattage", () => {
    let t = betting();
    expect([t.phase, t.hand!.turn, t.hand!.pending]).toEqual(["encheres", 1, [1, 2, 0]]);
    // Sans limite : d'une blinde à tout son tapis.
    expect(options(t, 1)).toMatchObject({ check: true, call: 0, bet: { min: 10, max: 990 }, raise: null, allIn: true, fold: true });
    // Ce n'est pas aux autres de parler.
    expect(options(t, 2)).toMatchObject({ check: false, bet: null, fold: false });
    expect(refusal(() => play(t, 2, { type: "parole" }))).toBe("NOT_YOUR_TURN");
    expect(refusal(() => play(t, 0, { type: "coucher" }))).toBe("NOT_YOUR_TURN");
    t = play(t, 1, { type: "parole" });
    expect(t.hand!.turn).toBe(2);
    t = play(t, 2, { type: "parole" });
    t = play(t, 0, { type: "parole" });
    expect([t.phase, t.hand!.pot]).toEqual(["abattage", 30]);
    expect(stacksOf(t)).toEqual([990, 990, 990]);
  });

  it("mise, suivre, relancer : d'une blinde à tout le tapis, la relance minimale d'une blinde", () => {
    let t = betting();
    // Miser : d'une blinde à tout son tapis (990 ici), quelle que soit la taille du pot.
    expect(refusal(() => play(t, 1, { type: "miser", amount: 9 }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 1, { type: "miser", amount: 991 }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 1, { type: "miser", amount: 31 }))).toBe("accepté");
    expect(refusal(() => play(t, 1, { type: "miser", amount: 990 }))).toBe("accepté");
    expect(refusal(() => play(t, 1, { type: "miser", amount: 15.5 }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 1, { type: "suivre" }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 1, { type: "relancer", amount: 20 }))).toBe("ACTION_IMPOSSIBLE");
    t = play(t, 1, { type: "miser", amount: 30 });
    expect([t.hand!.pot, t.hand!.bet, t.hand!.raises, t.hand!.turn]).toEqual([60, 30, 0, 2]);
    // Face à une mise : plus de parole. Relancer : de 40 (la mise plus une blinde) à 990
    // (tout son tapis : sa mise totale dans le tour après la relance).
    expect(options(t, 2)).toMatchObject({ check: false, call: 30, bet: null, raise: { min: 40, max: 990 }, allIn: true, fold: true });
    expect(refusal(() => play(t, 2, { type: "parole" }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 2, { type: "miser", amount: 30 }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 2, { type: "relancer", amount: 39 }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 2, { type: "relancer", amount: 991 }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 2, { type: "relancer", amount: 121 }))).toBe("accepté");
    t = play(t, 2, { type: "suivre" });
    expect([t.hand!.pot, t.hand!.turn]).toEqual([90, 0]);
    expect(options(t, 0)).toMatchObject({ call: 30, raise: { min: 40, max: 990 } });
    t = play(t, 0, { type: "relancer", amount: 150 });
    expect([t.hand!.pot, t.hand!.bet, t.hand!.raises, t.hand!.pending]).toEqual([240, 150, 1, [1, 2]]);
    // Le premier a déjà misé 30 : il lui en manque 120. Sa relance va jusqu'à ses 30 déjà misés plus ses 960 restants.
    expect(options(t, 1)).toMatchObject({ call: 120, raise: { min: 160, max: 990 } });
    t = play(t, 1, { type: "suivre" });
    t = play(t, 2, { type: "suivre" });
    expect([t.phase, t.hand!.pot]).toEqual(["abattage", 480]);
    expect(stacksOf(t)).toEqual([840, 840, 840]);
    expect(t.log.slice(-6).map((e) => [e.kind, e.seat, e.amount, e.to ?? null])).toEqual([
      ["mise", 1, 30, 30], ["suit", 2, 30, 30], ["relance", 0, 150, 150], ["suit", 1, 120, 150], ["suit", 2, 120, 150],
      ["abattage", -1, 0, null],
    ]);
    audited(t);
  });

  it("trois relances au plus dans le tour : ensuite on suit ou on se couche", () => {
    let t = betting([5000, 5000, 5000]);
    t = play(t, 1, { type: "miser", amount: 10 });          // la mise n'est pas une relance
    t = play(t, 2, { type: "relancer", amount: 20 });       // 1
    t = play(t, 0, { type: "relancer", amount: 30 });       // 2
    expect(options(t, 1).raise).not.toBeNull();
    t = play(t, 1, { type: "relancer", amount: 40 });       // 3
    expect(t.hand!.raises).toBe(3);
    expect(options(t, 2)).toMatchObject({ call: 20, raise: null, allIn: false, fold: true });
    expect(refusal(() => play(t, 2, { type: "relancer", amount: 50 }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(t, 2, { type: "tapis" }))).toBe("ACTION_IMPOSSIBLE");
    t = play(t, 2, { type: "suivre" });
    t = play(t, 0, { type: "suivre" });
    expect([t.phase, t.hand!.pot]).toEqual(["abattage", 150]);
  });

  it("le chemin complet jusqu'au tapis général", () => {
    let t = betting();
    t = play(t, 1, { type: "miser", amount: 30 });          // pot 60
    t = play(t, 2, { type: "suivre" });                     // pot 90
    t = play(t, 0, { type: "relancer", amount: 150 });      // pot 240
    t = play(t, 1, { type: "relancer", amount: 510 });      // pot 720
    expect([t.hand!.pot, t.hand!.raises]).toEqual([720, 2]);
    // Le troisième peut pousser son tapis : 990 en tout.
    expect(options(t, 2)).toMatchObject({ call: 480, raise: { min: 520, max: 990 }, allIn: true });
    t = play(t, 2, { type: "tapis" });
    expect([t.hand!.pot, t.hand!.bet, t.hand!.raises]).toEqual([1680, 990, 3]);
    expect(playerInHand(t, 2)).toMatchObject({ allIn: true, bet: 990, committed: 1000 });
    // Il reste aux deux autres exactement de quoi suivre : suivre, c'est tapis.
    expect(options(t, 0)).toMatchObject({ call: 840, raise: null, allIn: true });
    t = play(t, 0, { type: "tapis" });
    t = play(t, 1, { type: "suivre" });
    expect([t.phase, t.hand!.pot]).toEqual(["abattage", 3000]);
    expect(stacksOf(t)).toEqual([0, 0, 0]);
    expect(t.log.filter((e) => e.allIn).map((e) => [e.kind, e.seat])).toEqual([["relance", 2], ["suit", 0], ["suit", 1]]);
    audited(t);
  });

  it("faire tapis est permis dès qu'on peut miser, quelle que soit la taille du pot", () => {
    const t = betting();
    expect(options(t, 1)).toMatchObject({ bet: { min: 10, max: 990 }, allIn: true });
    // 990 dans un pot de 30 : trente-trois fois le pot. Sans limite, c'est permis.
    const deep = play(t, 1, { type: "tapis" });
    expect(playerInHand(deep, 1)).toMatchObject({ bet: 990, allIn: true });
    expect(deep.log[deep.log.length - 1]).toMatchObject({ kind: "mise", seat: 1, amount: 990, to: 990, allIn: true });
    expect([deep.hand!.pot, deep.hand!.bet, deep.hand!.raises, deep.hand!.turn]).toEqual([1020, 990, 0, 2]);
    // Les autres ont tout juste de quoi suivre : suivre, c'est tapis, et il n'y a plus rien à relancer.
    expect(options(deep, 2)).toMatchObject({ call: 990, raise: null, allIn: true, fold: true });
    audited(deep);
    // Avec un petit tapis aussi, on peut tout pousser.
    const small = betting([1000, 25, 1000]);
    expect(options(small, 1)).toMatchObject({ bet: { min: 10, max: 15 }, allIn: true });
    const pushed = play(small, 1, { type: "tapis" });
    expect(playerInHand(pushed, 1)).toMatchObject({ bet: 15, allIn: true });
    expect(pushed.log[pushed.log.length - 1]).toMatchObject({ kind: "mise", seat: 1, amount: 15, to: 15, allIn: true });
  });

  it("un tapis plus petit que la mise minimale est permis, et vaut relance s'il dépasse la mise", () => {
    // Le siège 1 n'a plus que 4 après la blinde : moins qu'une blinde.
    let t = betting([1000, 14, 1000]);
    expect(options(t, 1)).toMatchObject({ bet: { min: 4, max: 4 }, allIn: true });
    t = play(t, 1, { type: "miser", amount: 4 });
    expect([t.hand!.bet, t.hand!.raises]).toEqual([4, 0]);
    t = play(t, 2, { type: "relancer", amount: 14 });
    expect(t.hand!.raises).toBe(1);
    t = play(t, 0, { type: "suivre" });
    // Le siège 1 est à tapis : il ne parle plus.
    expect(t.phase).toBe("abattage");
  });

  it("suivre sans avoir de quoi : tapis pour moins, et un pot annexe", () => {
    // Après la blinde : 40, 290, 290.
    let t = betting([50, 300, 300]);
    t = play(t, 1, { type: "miser", amount: 30 });
    t = play(t, 2, { type: "relancer", amount: 120 });
    expect(options(t, 0)).toMatchObject({ call: 40, raise: null, allIn: true });
    t = play(t, 0, { type: "suivre" });
    expect(playerInHand(t, 0)).toMatchObject({ allIn: true, committed: 50, bet: 40 });
    // Suivre pour moins ne relance pas : la mise à égaler reste 120.
    expect([t.hand!.bet, t.hand!.raises, t.hand!.pending]).toEqual([120, 1, [1]]);
    t = play(t, 1, { type: "suivre" });
    expect([t.phase, t.hand!.pot]).toEqual(["abattage", 310]);
    expect(t.hand!.players.map((p) => [p.seat, p.committed])).toEqual([[1, 130], [2, 130], [0, 50]]);
  });

  it("la mise que personne n'a suivie retourne à son joueur avant l'abattage", () => {
    // Tête-à-tête : le siège 1 n'a que 15 après la blinde.
    let t = betting([1000, 25]);
    expect(t.hand!.players.map((p) => p.seat)).toEqual([1, 0]);
    t = play(t, 1, { type: "parole" });
    t = play(t, 0, { type: "miser", amount: 20 });
    t = play(t, 1, { type: "suivre" });
    expect(t.phase).toBe("abattage");
    // Le siège 0 avait misé 20, le siège 1 n'a pu en suivre que 15 : 5 lui reviennent.
    expect(t.hand!.pot).toBe(50);
    expect(t.hand!.players.map((p) => [p.seat, p.committed, p.bet])).toEqual([[1, 25, 15], [0, 25, 15]]);
    expect(stacksOf(t)).toEqual([975, 0]);
    expect(t.log.find((e) => e.kind === "rendu")).toMatchObject({ seat: 0, amount: 5 });
    audited(t);
  });

  it("tout le monde se couche : le dernier prend le pot sans montrer ses cartes", () => {
    let t = withHands(dealt({ stacks: [1000, 1000, 1000] }), { 1: "7h 5d 4c 3s 2h" });
    t = play(t, 1, { type: "tricher", index: 0, card: "2d" });
    t = allFair(t);
    t = play(t, 1, { type: "miser", amount: 30 });
    t = play(t, 2, { type: "coucher" });
    expect(t.phase).toBe("encheres");
    t = play(t, 0, { type: "coucher" });
    // Pas d'abattage, pas d'accusation : sa triche reste secrète.
    expect(t.phase).toBe("denouement");
    expect(t.result).toMatchObject({
      no: 1, showdown: false, hands: [], accusations: [], unmasked: [], carry: 0,
      pots: [{ amount: 60, winners: [{ seat: 1, amount: 60 }], carried: false }],
      until: T0 + WALKOVER_MS,
    });
    expect(netOf(t)).toEqual({ 0: -10, 1: 20, 2: -10 });
    expect(stacksOf(t)).toEqual([990, 1020, 990]);
    expect(t.hand).toBeNull();
    expect(JSON.stringify(t)).not.toContain("swap");
    for (const id of IDS.slice(0, 3)) {
      const view = viewFor(t, id, T0);
      expect(view.seats.every((s) => s!.cards === null)).toBe(true);
      expect(JSON.stringify(view)).not.toContain("7h");
    }
    audited(t);
  });

  it("on peut se coucher même quand la parole est permise", () => {
    let t = betting();
    t = play(t, 1, { type: "coucher" });
    expect(playerInHand(t, 1)!.folded).toBe(true);
    expect(t.hand!.turn).toBe(2);
    // Couché, on ne parle plus.
    t = play(t, 2, { type: "miser", amount: 10 });
    t = play(t, 0, { type: "suivre" });
    expect(t.phase).toBe("abattage");
    expect(refusal(() => play(t, 1, { type: "rien" }))).toBe("ACTION_IMPOSSIBLE");
  });

  it("pas d'enchères quand un seul joueur a encore des jetons", () => {
    // Deux joueurs sont à tapis sur la blinde.
    const t = allFair(dealt({ stacks: [10, 10, 1000] }));
    expect(t.phase).toBe("abattage");
    expect(t.hand!.pot).toBe(30);
    // Et s'ils sont deux à en avoir, ils enchérissent entre eux.
    const two = allFair(dealt({ stacks: [10, 1000, 1000] }));
    expect([two.phase, two.hand!.pending]).toEqual(["encheres", [1, 2]]);
  });

  it("relancer n'a pas de sens quand plus personne ne peut répondre", () => {
    // Le siège 1 pousse son tapis ; le siège 2 se couche ; reste le siège 0 face à un joueur à tapis.
    let t = betting([1000, 30, 1000]);
    t = play(t, 1, { type: "tapis" });
    t = play(t, 2, { type: "coucher" });
    expect(options(t, 0)).toMatchObject({ call: 20, raise: null, allIn: false, fold: true });
    expect(refusal(() => play(t, 0, { type: "relancer", amount: 30 }))).toBe("ACTION_IMPOSSIBLE");
  });

  it("une action qui arrive après que la table a tourné est refusée", () => {
    let t = betting();
    const step = viewFor(t, "p_b", T0).step;
    t = play(t, 1, { type: "parole" });
    t = play(t, 2, { type: "miser", amount: 10 });
    t = play(t, 0, { type: "suivre" });
    // C'est de nouveau au siège 1, mais sa décision d'avant ne vaut plus.
    expect(t.hand!.turn).toBe(1);
    expect(refusal(() => act(t, "p_b", { type: "coucher" }, T0, rngOf(), step))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => act(t, "p_b", { type: "suivre" }, T0, rngOf(), viewFor(t, "p_b", T0).step))).toBe("accepté");
    expect(refusal(() => act(t, "p_b", { type: "suivre" }, T0, rngOf()))).toBe("accepté");
  });

  it("les fourchettes d'enchères : cas limites", () => {
    const base = { pot: 60, bet: 0, raises: 0, blind: 10, mine: 0, stack: 500, rivals: 2 };
    // Le pot (60 ici) ne borne plus rien : la mise va d'une blinde à tout le tapis, et le tapis est toujours permis.
    expect(betOptions(base)).toEqual({ check: true, call: 0, bet: { min: 10, max: 500 }, raise: null, allIn: true });
    expect(betOptions({ ...base, pot: 1 })).toEqual(betOptions({ ...base, pot: 1_000_000 }));
    expect(betOptions({ ...base, stack: 45 })).toEqual({ check: true, call: 0, bet: { min: 10, max: 45 }, raise: null, allIn: true });
    expect(betOptions({ ...base, stack: 0 })).toEqual({ check: true, call: 0, bet: null, raise: null, allIn: false });
    expect(betOptions({ ...base, rivals: 0 })).toEqual({ check: true, call: 0, bet: null, raise: null, allIn: false });
    const facing = { ...base, pot: 100, bet: 40 };
    expect(betOptions(facing)).toEqual({ check: false, call: 40, bet: null, raise: { min: 50, max: 500 }, allIn: true });
    // La relance se compte en mise totale dans le tour : ce qu'il a déjà misé, plus tout son tapis.
    expect(betOptions({ ...facing, mine: 10 })).toEqual({ check: false, call: 30, bet: null, raise: { min: 50, max: 510 }, allIn: true });
    expect(betOptions({ ...facing, stack: 40 })).toEqual({ check: false, call: 40, bet: null, raise: null, allIn: true });
    expect(betOptions({ ...facing, stack: 25 })).toEqual({ check: false, call: 25, bet: null, raise: null, allIn: true });
    expect(betOptions({ ...facing, stack: 45 })).toEqual({ check: false, call: 40, bet: null, raise: { min: 45, max: 45 }, allIn: true });
    expect(betOptions({ ...facing, raises: 3 })).toEqual({ check: false, call: 40, bet: null, raise: null, allIn: false });
    expect(betOptions({ ...facing, rivals: 0 })).toEqual({ check: false, call: 40, bet: null, raise: null, allIn: false });
  });
});

// ---------------------------------------------------------------------------

describe("l'abattage et les accusations", () => {
  /** Paire d'as au siège 0, paire de rois au siège 1, dame haute au siège 2. */
  const HANDS = { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c", 2: "Qs Jd 8c 6h 2s" };
  /** Le siège 1 se fait un brelan de rois ; le siège 0, un brelan d'as. */
  const KINGS: GameAction = { type: "tricher", index: 2, card: "Kh" };
  const ACES: GameAction = { type: "tricher", index: 2, card: "Ah" };

  /** Trois joueurs à l'abattage, sans enchère : 10 chacun au pot. */
  function showdown(cheats: Record<number, GameAction> = {}, stacks = [1000, 1000, 1000], hands: Record<number, string> = HANDS): TableState {
    let t = withHands(dealt({ stacks }), hands);
    for (const [seat, action] of Object.entries(cheats)) t = play(t, Number(seat), action);
    t = checkAround(allFair(t));
    expect(t.phase).toBe("abattage");
    return t;
  }

  it("les mains des joueurs encore en jeu sont montrées à toute la table", () => {
    const t = showdown({ 1: KINGS });
    expect(t.hand!.deadline).toBe(T0 + ACCUSE_MS);
    for (const viewer of [...IDS.slice(0, 3), "p_spectateur"]) {
      const view = viewFor(t, viewer, T0);
      expect(view.seats.map((s) => s!.cards)).toEqual([hand("As Ad 7c 5h 2d"), hand("Kc Kd Kh 4h 3c"), hand("Qs Jd 8c 6h 2s")]);
      expect(view.seats.map((s) => s!.category)).toEqual(["paire", "brelan", "carte-haute"]);
      expect(view.deadline).toBe(T0 + ACCUSE_MS);
    }
    expect(viewFor(t, "p_a", T0).options.accuse).toEqual([1, 2]);
    expect(viewFor(t, "p_b", T0).options.accuse).toEqual([2, 0]);
    expect(viewFor(t, "p_spectateur", T0).options.accuse).toEqual([]);
  });

  it("personne n'accuse : la meilleure main prend le pot, et une triche reste secrète pour toujours", () => {
    const t = allQuiet(showdown({ 1: KINGS }));
    expect(t.phase).toBe("denouement");
    expect(t.result).toEqual({
      no: 1,
      showdown: true,
      hands: [
        { seat: 1, cards: hand("Kc Kd Kh 4h 3c"), category: "brelan" },
        { seat: 2, cards: hand("Qs Jd 8c 6h 2s"), category: "carte-haute" },
        { seat: 0, cards: hand("As Ad 7c 5h 2d"), category: "paire" },
      ],
      accusations: [],
      unmasked: [],
      pots: [{ amount: 30, winners: [{ seat: 1, amount: 30 }], carried: false }],
      net: [{ seat: 1, amount: 20 }, { seat: 2, amount: -10 }, { seat: 0, amount: -10 }],
      carry: 0,
      until: T0 + RESULT_MS,
    });
    expect(stacksOf(t)).toEqual([990, 1020, 990]);
    // Plus aucune trace de la triche dans l'état de la table.
    expect(t.hand).toBeNull();
    expect(JSON.stringify(t)).not.toContain("swap");
    expect(JSON.stringify(t)).not.toContain("9s");
    audited(t);
  });

  it("accusation juste : le tricheur est démasqué, il perd sa mise et sort de la main", () => {
    let t = showdown({ 1: KINGS });
    t = play(t, 0, { type: "accuser", seat: 1 });
    expect(t.phase).toBe("abattage");
    t = allQuiet(t);
    expect(t.result).toMatchObject({
      accusations: [{ from: 0, to: 1, right: true, paid: 0 }],
      unmasked: [{ seat: 1, index: 2, from: "9s", to: "Kh" }],
      // Sa mise reste au pot ; la meilleure main des joueurs restants le prend.
      pots: [{ amount: 30, winners: [{ seat: 0, amount: 30 }], carried: false }],
      carry: 0,
    });
    expect(netOf(t)).toEqual({ 0: 20, 1: -10, 2: -10 });
    expect(stacksOf(t)).toEqual([1020, 990, 990]);
    audited(t);
  });

  it("accusation fausse : l'accusateur paie à l'innocent la mise de celui-ci", () => {
    let t = showdown();
    t = allQuiet(play(t, 2, { type: "accuser", seat: 0 }));
    expect(t.result).toMatchObject({
      accusations: [{ from: 2, to: 0, right: false, paid: 10 }],
      unmasked: [],
      pots: [{ amount: 30, winners: [{ seat: 0, amount: 30 }] }],
    });
    expect(netOf(t)).toEqual({ 0: 30, 1: -10, 2: -20 });
    expect(stacksOf(t)).toEqual([1030, 990, 980]);
    audited(t);
  });

  it("la mise de l'accusé compte tout ce qu'il a versé dans la main", () => {
    let t = withHands(dealt({ stacks: [1000, 1000, 1000] }), HANDS);
    t = allFair(t);
    t = play(t, 1, { type: "miser", amount: 30 });
    t = play(t, 2, { type: "suivre" });
    t = play(t, 0, { type: "suivre" });
    // Chacun a versé 40. Le siège 2 accuse à tort le siège 1.
    t = allQuiet(play(t, 2, { type: "accuser", seat: 1 }));
    expect(t.result!.accusations).toEqual([{ from: 2, to: 1, right: false, paid: 40 }]);
    expect(netOf(t)).toEqual({ 0: 80, 1: 0, 2: -80 });
    expect(stacksOf(t)).toEqual([1080, 1000, 920]);
  });

  it("accusations croisées entre deux innocents : chacun paie l'autre", () => {
    let t = showdown();
    t = play(t, 0, { type: "accuser", seat: 1 });
    t = play(t, 1, { type: "accuser", seat: 0 });
    t = allQuiet(t);
    expect(t.result!.accusations).toEqual([
      { from: 1, to: 0, right: false, paid: 10 }, { from: 0, to: 1, right: false, paid: 10 },
    ]);
    expect(netOf(t)).toEqual({ 0: 20, 1: -10, 2: -10 });
    expect(stacksOf(t)).toEqual([1020, 990, 990]);
  });

  it("accusations croisées entre deux tricheurs : tous deux démasqués, le troisième prend le pot", () => {
    let t = showdown({ 0: ACES, 1: KINGS });
    t = play(t, 0, { type: "accuser", seat: 1 });
    t = play(t, 1, { type: "accuser", seat: 0 });
    t = allQuiet(t);
    expect(t.result!.unmasked.map((u) => u.seat).sort()).toEqual([0, 1]);
    expect(t.result!.pots).toEqual([{ amount: 30, winners: [{ seat: 2, amount: 30 }], carried: false }]);
    expect(stacksOf(t)).toEqual([990, 990, 1020]);
  });

  it("un tricheur et un innocent s'accusent : l'un est démasqué, l'autre paie", () => {
    let t = showdown({ 1: KINGS });
    t = play(t, 0, { type: "accuser", seat: 1 });   // juste
    t = play(t, 1, { type: "accuser", seat: 0 });   // faux : le tricheur démasqué paie quand même
    t = allQuiet(t);
    expect(t.result!.accusations).toEqual([
      { from: 1, to: 0, right: false, paid: 10 }, { from: 0, to: 1, right: true, paid: 0 },
    ]);
    expect(netOf(t)).toEqual({ 0: 30, 1: -20, 2: -10 });
  });

  it("plusieurs accusateurs : chacun paie l'innocent ; un tricheur n'est démasqué qu'une fois", () => {
    let innocent = showdown();
    innocent = play(innocent, 0, { type: "accuser", seat: 2 });
    innocent = play(innocent, 1, { type: "accuser", seat: 2 });
    innocent = allQuiet(innocent);
    expect(innocent.result!.accusations).toEqual([
      { from: 1, to: 2, right: false, paid: 10 }, { from: 0, to: 2, right: false, paid: 10 },
    ]);
    expect(netOf(innocent)).toEqual({ 0: 10, 1: -20, 2: 10 });
    expect(stacksOf(innocent)).toEqual([1010, 980, 1010]);

    let cheater = showdown({ 1: KINGS });
    cheater = play(cheater, 0, { type: "accuser", seat: 1 });
    cheater = play(cheater, 2, { type: "accuser", seat: 1 });
    cheater = allQuiet(cheater);
    expect(cheater.result!.accusations).toEqual([
      { from: 2, to: 1, right: true, paid: 0 }, { from: 0, to: 1, right: true, paid: 0 },
    ]);
    expect(cheater.result!.unmasked).toEqual([{ seat: 1, index: 2, from: "9s", to: "Kh" }]);
    expect(stacksOf(cheater)).toEqual([1020, 990, 990]);
  });

  it("l'accusation d'un joueur démasqué vaut quand même", () => {
    // Les sièges 0 et 1 ont triché. 0 accuse 1 ; 2 accuse 0.
    let t = showdown({ 0: ACES, 1: KINGS });
    t = play(t, 0, { type: "accuser", seat: 1 });
    t = play(t, 2, { type: "accuser", seat: 0 });
    t = allQuiet(t);
    expect(t.result!.unmasked.map((u) => u.seat).sort()).toEqual([0, 1]);
    expect(t.result!.pots[0]!.winners).toEqual([{ seat: 2, amount: 30 }]);
  });

  it("tout le monde est démasqué : le pot reste sur la table pour la main suivante", () => {
    const rng = rngOf(8);
    let t = withHands(dealt({ stacks: [1000, 1000] }, rng), { 0: HANDS[0], 1: HANDS[1] });
    t = play(t, 0, ACES);
    t = play(t, 1, KINGS);
    t = checkAround(t);
    t = play(t, 0, { type: "accuser", seat: 1 });
    t = play(t, 1, { type: "accuser", seat: 0 });
    expect(t.result).toMatchObject({ pots: [{ amount: 20, winners: [], carried: true }], carry: 20 });
    expect(netOf(t)).toEqual({ 0: -10, 1: -10 });
    expect([t.carry, stacksOf(t)]).toEqual([20, [990, 990]]);
    expect(viewFor(t, "p_a", T0).pot).toBe(20);
    audited(t);
    // La main suivante : le pot resté là s'ajoute aux blindes, et le gagnant prend tout.
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.handNo, t.hand!.pot, t.carry]).toEqual([2, 40, 0]);
    expect(viewFor(t, "p_a", T0 + RESULT_MS).pot).toBe(40);
    // Il est dans le pot de la main ; la mise, elle, ne dépend que du tapis.
    t = withHands(t, { 0: HANDS[0], 1: HANDS[1] });
    t = allFair(t, T0 + RESULT_MS);
    expect(viewFor(t, IDS[t.hand!.turn!]!, T0 + RESULT_MS).options.bet).toEqual({ min: 10, max: 980 });
    t = allQuiet(checkAround(t, T0 + RESULT_MS), T0 + RESULT_MS);
    expect(t.result!.pots).toEqual([{ amount: 40, winners: [{ seat: 0, amount: 40 }], carried: false }]);
    expect(stacksOf(t)).toEqual([1020, 980]);
    audited(t);
  });

  it("trois joueurs, tous démasqués : le pot reste, personne ne paie", () => {
    let t = showdown({ 0: ACES, 1: KINGS, 2: { type: "tricher", index: 4, card: "Qd" } });
    t = play(t, 0, { type: "accuser", seat: 1 });
    t = play(t, 1, { type: "accuser", seat: 2 });
    t = play(t, 2, { type: "accuser", seat: 0 });
    expect(t.result).toMatchObject({ carry: 30, pots: [{ amount: 30, winners: [], carried: true }] });
    expect(t.result!.unmasked).toHaveLength(3);
    expect(stacksOf(t)).toEqual([990, 990, 990]);
    audited(t);
  });

  it("l'accusateur n'a pas de quoi payer : il paie ce qui lui reste", () => {
    // Le siège 0 n'a plus que 5 après la blinde ; la mise de l'accusé est de 10.
    let short = showdown({}, [15, 1000, 1000]);
    short = allQuiet(play(short, 0, { type: "accuser", seat: 1 }));
    expect(short.result!.accusations).toEqual([{ from: 0, to: 1, right: false, paid: 5 }]);
    // Il gagne le pot ensuite : l'amende se paie sur le tapis, pas sur les gains.
    expect(stacksOf(short)).toEqual([30, 995, 990]);
    expect(netOf(short)).toEqual({ 0: 15, 1: -5, 2: -10 });
    audited(short);

    // À tapis sur la blinde : il ne paie rien.
    let broke = showdown({}, [10, 1000, 1000]);
    broke = allQuiet(play(broke, 0, { type: "accuser", seat: 1 }));
    expect(broke.result!.accusations).toEqual([{ from: 0, to: 1, right: false, paid: 0 }]);
    expect(stacksOf(broke)).toEqual([30, 990, 990]);
    audited(broke);
  });

  it("on accuse un autre joueur encore en jeu, un seul, et une seule fois", () => {
    let t = withHands(dealt({ stacks: [1000, 1000, 1000, 1000, 5], seats: 6 }), HANDS);
    t = allFair(t);
    t = play(t, 1, { type: "miser", amount: 10 });
    t = play(t, 2, { type: "suivre" });
    t = play(t, 3, { type: "coucher" });
    t = play(t, 0, { type: "suivre" });
    expect(t.phase).toBe("abattage");
    expect(viewFor(t, "p_a", T0).options.accuse).toEqual([1, 2]);
    expect(refusal(() => play(t, 0, { type: "accuser", seat: 0 }))).toBe("ACTION_IMPOSSIBLE");  // soi-même
    expect(refusal(() => play(t, 0, { type: "accuser", seat: 3 }))).toBe("ACTION_IMPOSSIBLE");  // couché
    expect(refusal(() => play(t, 0, { type: "accuser", seat: 4 }))).toBe("ACTION_IMPOSSIBLE");  // pas dans la main
    expect(refusal(() => play(t, 0, { type: "accuser", seat: 5 }))).toBe("ACTION_IMPOSSIBLE");  // siège vide
    expect(refusal(() => play(t, 0, { type: "accuser", seat: 1.5 }))).toBe("BAD_REQUEST");
    expect(refusal(() => play(t, 3, { type: "accuser", seat: 1 }))).toBe("ACTION_IMPOSSIBLE");  // un joueur couché n'accuse pas
    expect(refusal(() => play(t, 4, { type: "rien" }))).toBe("ACTION_IMPOSSIBLE");
    const spoken = play(t, 0, { type: "accuser", seat: 1 });
    expect(refusal(() => play(spoken, 0, { type: "accuser", seat: 2 }))).toBe("ACTION_IMPOSSIBLE");
    expect(refusal(() => play(spoken, 0, { type: "rien" }))).toBe("ACTION_IMPOSSIBLE");
    // Les accusations restent secrètes jusqu'au dénouement.
    expect(viewFor(spoken, "p_a", T0).hand).toMatchObject({ spoke: true, accuse: 1 });
    expect(viewFor(spoken, "p_b", T0).seats[0]).toMatchObject({ done: true });
    expect(JSON.stringify(viewFor(spoken, "p_b", T0))).not.toContain("accuse\":1");
    // Hors de l'abattage, on n'accuse pas.
    expect(refusal(() => play(allFair(dealt({ stacks: [500, 500] })), 1, { type: "accuser", seat: 0 }))).toBe("ACTION_IMPOSSIBLE");
  });

  it("égalité : le pot est partagé, l'euro indivisible va au premier après le donneur", () => {
    // Blinde de 5 à trois : un pot de 15. Les sièges 1 et 0 ont la même main.
    let t = withHands(dealt({ stacks: [500, 500, 500], blind: 5 }), { 0: "Ad Kc Qs Jh 9c", 1: "Ah Kd Qc Js 9h", 2: "7h 5d 4c 3s 2h" });
    t = allQuiet(checkAround(allFair(t)));
    expect(t.result!.pots).toEqual([{ amount: 15, winners: [{ seat: 1, amount: 8 }, { seat: 0, amount: 7 }], carried: false }]);
    expect(stacksOf(t)).toEqual([502, 503, 495]);
    audited(t);
    // À la main suivante le donneur a tourné : c'est le siège 2 qui parle en premier, puis le 0.
    let next = advance(t, T0 + RESULT_MS, rngOf());
    next = withHands(next, { 0: "Ad Kc Qs Jh 9c", 1: "Ah Kd Qc Js 9h", 2: "7h 5d 4c 3s 2h" });
    next = allQuiet(checkAround(allFair(next, T0 + RESULT_MS), T0 + RESULT_MS), T0 + RESULT_MS);
    expect(next.result!.pots[0]!.winners).toEqual([{ seat: 0, amount: 8 }, { seat: 1, amount: 7 }]);
  });

  it("deux joueurs montrent la même carte : chaque main se juge seule", () => {
    // Le siège 1 prend l'as de pique, que le siège 0 a déjà : deux paires d'as à départager.
    let t = showdown({ 1: { type: "tricher", index: 0, card: "As" } }, [1000, 1000, 1000], { 0: "As Kd 7c 5h 2d", 1: "Kc Ah 9s 4h 3c", 2: "Qs Jd 8c 6h 2s" });
    expect(viewFor(t, "p_c", T0).seats.map((s) => s!.cards![0])).toEqual(["As", "As", "Qs"]);
    t = allQuiet(t);
    // Paire d'as, neuf à côté, contre as-roi sans paire : le tricheur gagne s'il n'est pas accusé.
    expect(t.result!.hands.map((x) => [x.seat, x.category])).toEqual([[1, "paire"], [2, "carte-haute"], [0, "carte-haute"]]);
    expect(t.result!.pots[0]!.winners).toEqual([{ seat: 1, amount: 30 }]);
  });

  it("pots annexes à l'abattage : le joueur à tapis ne prend que le pot principal", () => {
    const sidePotTable = (cheats: Record<number, GameAction> = {}) => {
      let t = withHands(dealt({ stacks: [50, 300, 300] }), HANDS);
      for (const [seat, action] of Object.entries(cheats)) t = play(t, Number(seat), action);
      t = allFair(t);
      t = play(t, 1, { type: "miser", amount: 30 });
      t = play(t, 2, { type: "relancer", amount: 120 });
      t = play(t, 0, { type: "suivre" });
      return play(t, 1, { type: "suivre" });
    };
    // Sans triche : la paire d'as (à tapis pour 50) prend 150, la paire de rois prend le reste.
    let fair = allQuiet(sidePotTable());
    expect(fair.result!.pots).toEqual([
      { amount: 150, winners: [{ seat: 0, amount: 150 }], carried: false },
      { amount: 160, winners: [{ seat: 1, amount: 160 }], carried: false },
    ]);
    expect(stacksOf(fair)).toEqual([150, 330, 170]);
    expect(netOf(fair)).toEqual({ 0: 100, 1: 30, 2: -130 });
    audited(fair);

    // Le joueur à tapis triche et se fait démasquer : le pot principal va au meilleur des deux autres.
    let caught = sidePotTable({ 0: ACES });
    caught = allQuiet(play(caught, 2, { type: "accuser", seat: 0 }));
    expect(caught.result!.pots.map((p) => p.winners)).toEqual([[{ seat: 1, amount: 150 }], [{ seat: 1, amount: 160 }]]);
    expect(stacksOf(caught)).toEqual([0, 480, 170]);

    // Les deux gros tapis trichent et se démasquent : le pot annexe n'a plus de prétendant, il reste sur la table.
    let orphan = sidePotTable({ 1: KINGS, 2: { type: "tricher", index: 4, card: "Qd" } });
    orphan = play(orphan, 1, { type: "accuser", seat: 2 });
    orphan = play(orphan, 2, { type: "accuser", seat: 1 });
    orphan = allQuiet(orphan);
    expect(orphan.result!.pots).toEqual([
      { amount: 150, winners: [{ seat: 0, amount: 150 }], carried: false },
      { amount: 160, winners: [], carried: true },
    ]);
    expect([orphan.carry, stacksOf(orphan)]).toEqual([160, [150, 170, 170]]);
    audited(orphan);
  });

  it("l'abattage se dénoue dès que tout le monde a parlé, sinon à la fin du délai", () => {
    const rng = rngOf();
    let t = showdown();
    t = play(t, 0, { type: "rien" }, T0 + 1_000);
    t = play(t, 1, { type: "rien" }, T0 + 2_000);
    expect(t.phase).toBe("abattage");
    expect(advance(t, T0 + ACCUSE_MS - 1, rng)).toBe(t);
    const late = advance(t, T0 + ACCUSE_MS, rng);
    expect([late.phase, late.result!.until]).toEqual(["denouement", T0 + ACCUSE_MS + RESULT_MS]);
    const quick = play(t, 2, { type: "rien" }, T0 + 3_000);
    expect([quick.phase, quick.result!.until]).toEqual(["denouement", T0 + 3_000 + RESULT_MS]);
  });
});

// ---------------------------------------------------------------------------

/**
 * Fait vivre une table jusqu'à `until`, seconde par seconde : les sièges de `players`
 * répondent aussitôt (franc jeu, parole ou suivre, rien à dire), les autres ne font rien.
 */
function drive(start: TableState, from: number, until: number, players: number[], rng: Random32, each?: (t: TableState, now: number) => void): TableState {
  let t = start;
  for (let now = from; now <= until; now += 1_000) {
    t = advance(t, now, rng);
    for (const seat of players) {
      if (t.phase === "fermee" || !t.seats[seat]) continue;
      const o = viewFor(t, IDS[seat]!, now).options;
      if (o.cheat) t = act(t, IDS[seat]!, { type: "franc-jeu" }, now, rng);
      else if (o.fold) t = act(t, IDS[seat]!, o.check ? { type: "parole" } : { type: "suivre" }, now, rng);
      else if (o.accuse.length > 0) t = act(t, IDS[seat]!, { type: "rien" }, now, rng);
    }
    each?.(t, now);
  }
  return t;
}

describe("le temps", () => {
  it("pas de réponse pendant la triche : franc jeu, à la fin du délai et pas avant", () => {
    const rng = rngOf();
    const t = dealt({ stacks: [1000, 1000, 1000] });
    expect(nextEventAt(t)).toBe(T0 + CHEAT_MS);
    expect(advance(t, T0 + CHEAT_MS - 1, rng)).toBe(t);
    const after = advance(t, T0 + CHEAT_MS, rng);
    expect([after.phase, after.hand!.turn, after.hand!.deadline]).toEqual(["encheres", 1, T0 + CHEAT_MS + TURN_MS]);
    expect(after.hand!.players.every((p) => p.chosen && p.swap === null)).toBe(true);
    expect(after.seats.map((s) => [s!.missed, s!.absent])).toEqual([[1, false], [1, false], [1, false]]);
    expect(after.log.filter((e) => e.kind === "choix").map((e) => e.auto)).toEqual([true, true, true]);
    // Un joueur qui a choisi à temps n'est pas compté en retard.
    const one = advance(play(t, 2, { type: "franc-jeu" }, T0 + 5_000), T0 + CHEAT_MS, rng);
    expect(one.seats.map((s) => s!.missed)).toEqual([1, 1, 0]);
  });

  it("pas de réponse aux enchères : parole si possible, sinon couché", () => {
    const rng = rngOf();
    const t = allFair(dealt({ stacks: [1000, 1000, 1000] }));
    // Personne n'a misé : parole.
    const checked = advance(t, T0 + TURN_MS, rng);
    expect(advance(t, T0 + TURN_MS - 1, rng)).toBe(t);
    expect(checked.log[checked.log.length - 1]).toMatchObject({ kind: "parole", seat: 1, auto: true });
    expect([checked.hand!.turn, checked.hand!.deadline, checked.seats[1]!.missed]).toEqual([2, T0 + 2 * TURN_MS, 1]);
    // Face à une mise : couché.
    const bet = play(t, 1, { type: "miser", amount: 20 }, T0 + 3_000);
    const folded = advance(bet, T0 + 3_000 + TURN_MS, rng);
    expect(folded.log[folded.log.length - 1]).toMatchObject({ kind: "couche", seat: 2, auto: true });
    expect(playerInHand(folded, 2)!.folded).toBe(true);
    expect([folded.hand!.turn, folded.seats[2]!.missed, folded.seats[1]!.missed]).toEqual([0, 1, 0]);
  });

  it("pas de réponse à l'abattage : pas d'accusation", () => {
    const rng = rngOf();
    let t = checkAround(allFair(dealt({ stacks: [1000, 1000, 1000] })));
    t = play(t, 0, { type: "accuser", seat: 1 }, T0 + 1_000);
    const after = advance(t, T0 + ACCUSE_MS, rng);
    expect(after.phase).toBe("denouement");
    expect(after.result!.accusations.map((a) => a.from)).toEqual([0]);
    expect(after.seats.map((s) => s!.missed)).toEqual([0, 1, 1]);
  });

  it("deux délais dépassés de suite : le joueur est absent, ses décisions tombent aussitôt", () => {
    const rng = rngOf();
    let t = dealt({ stacks: [1000, 1000, 1000] });
    // Le siège 1 laisse passer la triche, puis son tour de parole.
    t = play(t, 0, { type: "franc-jeu" }, T0 + 1_000);
    t = play(t, 2, { type: "franc-jeu" }, T0 + 1_000);
    t = advance(t, T0 + CHEAT_MS, rng);
    expect(t.seats[1]).toMatchObject({ missed: 1, absent: false });
    t = advance(t, T0 + CHEAT_MS + TURN_MS, rng);
    expect(t.seats[1]).toMatchObject({ missed: 2, absent: true });
    expect(viewFor(t, "p_b", T0).options.back).toBe(true);
    expect(viewFor(t, "p_c", T0).seats[1]!.absent).toBe(true);
    // Les deux autres jouent. À l'abattage, l'absent ne fait attendre personne.
    const at = T0 + CHEAT_MS + TURN_MS + 1_000;
    t = play(t, 2, { type: "parole" }, at);
    t = play(t, 0, { type: "parole" }, at);
    expect(t.phase).toBe("abattage");
    expect(playerInHand(t, 1)).toMatchObject({ spoke: true, accuse: null });
    t = play(t, 2, { type: "rien" }, at);
    t = play(t, 0, { type: "rien" }, at);
    expect(t.phase).toBe("denouement");
    // À la main suivante, tout ce qui le concerne tombe sans délai.
    t = advance(t, at + RESULT_MS, rng);
    expect([t.phase, t.handNo]).toEqual(["triche", 2]);
    expect(playerInHand(t, 1)).toMatchObject({ chosen: true, swap: null });
    t = allFair(t, at + RESULT_MS);
    expect(t.phase).toBe("encheres");
    // Le donneur est le siège 1 : la parole part du siège 2, puis 0, puis l'absent, qui passe aussitôt.
    t = play(t, 2, { type: "parole" }, at + RESULT_MS);
    t = play(t, 0, { type: "parole" }, at + RESULT_MS);
    expect(t.phase).toBe("abattage");
    expect(t.log.filter((e) => e.hand === 2 && e.seat === 1 && e.auto).map((e) => e.kind)).toEqual(["choix", "parole", "parle"]);
    // Et face à une mise, il se couche aussitôt.
    t = advance(allQuiet(t, at + RESULT_MS), at + 2 * RESULT_MS, rng);
    t = allFair(t, at + 2 * RESULT_MS);
    expect(t.hand!.turn).toBe(0);
    t = play(t, 0, { type: "miser", amount: 10 }, at + 2 * RESULT_MS);
    expect(playerInHand(t, 1)!.folded).toBe(true);
    expect(t.hand!.turn).toBe(2);
  });

  it("agir à temps remet le compteur de retards à zéro", () => {
    const rng = rngOf();
    let t = dealt({ stacks: [1000, 1000] });
    t = advance(t, T0 + CHEAT_MS, rng);
    expect(t.seats.map((s) => s!.missed)).toEqual([1, 1]);
    t = play(t, 1, { type: "parole" }, T0 + CHEAT_MS + 1_000);
    t = play(t, 0, { type: "parole" }, T0 + CHEAT_MS + 2_000);
    expect(t.seats.map((s) => s!.missed)).toEqual([0, 0]);
    // Un nouveau retard isolé ne suffit pas à être absent.
    t = advance(t, T0 + CHEAT_MS + 2_000 + ACCUSE_MS, rng);
    expect(t.seats.map((s) => [s!.missed, s!.absent])).toEqual([[1, false], [1, false]]);
  });

  it("au bout de trois mains absent, le joueur quitte la table et récupère son tapis", () => {
    const rng = rngOf(21);
    const hands: number[] = [];
    const idle: number[] = [];
    // Le siège 2 ne répond jamais ; les deux autres jouent.
    let t = drive(dealt({ stacks: [1000, 1000, 1000] }, rng), T0, T0 + 200_000, [0, 1], rng, (state) => {
      if (state.seats[2] && state.phase === "denouement" && hands[hands.length - 1] !== state.handNo) {
        hands.push(state.handNo);
        idle.push(state.seats[2].idle);
      }
    });
    // La main où il s'absente ne compte pas ; les trois suivantes, si.
    expect(hands).toEqual([1, 2, 3, 4]);
    expect(idle).toEqual([0, 1, 2, 3]);
    expect(t.seats[2]).toBeNull();
    const gone = t.departed.find((d) => d.playerId === "p_c")!;
    expect(gone).toMatchObject({ seat: 2, reason: "absent" });
    // Il a payé quatre blindes sans jamais miser davantage, et n'a rien gagné de plus que les pots.
    // Ses compteurs le suivent : quatre mains reçues et menées au dénouement, deux pots ramassés à la parole.
    expect(t.ended).toEqual([{
      sid: "s_2", playerId: "p_c", seat: 2, payout: gone.payout, received: 1000, reason: "absent", at: gone.at,
      stats: { hands: 4, pots: 2, unmasked: 0, caught: 0 },
    }]);
    expect(gone.payout).toBeGreaterThanOrEqual(960);
    // La table continue pour les deux autres.
    expect(t.phase).not.toBe("fermee");
    expect(t.handNo).toBeGreaterThan(5);
    expect(t.seats[0]!.stack + t.seats[1]!.stack + (t.hand ? t.hand.pot : t.carry) + gone.payout).toBe(3000);
    audited(t);
  });

  it("tous les joueurs absents : la table se vide d'elle-même, sans requête entre-temps", () => {
    const rng = rngOf();
    const t = dealt({ stacks: [1000, 1000, 1000] });
    // Une seule avance, vingt minutes plus tard : tout se rejoue dans l'ordre.
    const after = advance(t, T0 + 20 * 60_000, rng);
    expect([after.phase, after.closed]).toEqual(["fermee", "vide"]);
    expect(after.seats).toEqual([null, null, null]);
    // Main 1 : la triche (20 s), puis trois tours de parole (20 s chacun) font trois absents.
    // Ensuite chaque main ne dure que le temps du dénouement.
    const closedAt = T0 + CHEAT_MS + 3 * TURN_MS + 4 * RESULT_MS;
    expect(after.ended.map((e) => [e.playerId, e.reason, e.at])).toEqual([
      ["p_a", "absent", closedAt], ["p_b", "absent", closedAt], ["p_c", "absent", closedAt],
    ]);
    expect(after.handNo).toBe(4);
    expect(after.ended.reduce((s, e) => s + e.payout, 0)).toBe(3000);
    expect(chipsOnTable(after)).toBe(0);
    expect(after.audit).toEqual({ in: 3000, out: 3000, bank: 0 });
    // Le même résultat en avançant pas à pas : l'avance paresseuse ne dépend pas du rythme des requêtes.
    let stepped = t;
    const rng2 = rngOf();
    for (let now = T0; now <= T0 + 20 * 60_000; now += 7_000) stepped = advance(stepped, now, rng2);
    expect(stepped.ended).toEqual(after.ended);
    expect(nextEventAt(after)).toBeNull();
    expect(advance(after, T0 + 3_600_000, rng)).toBe(after);
  });

  it("« retour » : un joueur absent reprend sa place", () => {
    const rng = rngOf();
    let t = dealt({ stacks: [1000, 1000] });
    t = advance(t, T0 + CHEAT_MS + 2 * TURN_MS, rng);
    expect(t.seats.map((s) => s!.absent)).toEqual([true, true]);
    const at = T0 + CHEAT_MS + 2 * TURN_MS + 500;
    t = play(t, 0, { type: "retour" }, at);
    expect(t.seats[0]).toMatchObject({ absent: false, missed: 0, idle: 0 });
    expect(viewFor(t, "p_a", at).options.back).toBe(false);
    // À la main suivante, on l'attend de nouveau.
    t = advance(t, at + RESULT_MS, rng);
    expect([t.phase, t.handNo]).toEqual(["triche", 2]);
    expect(playerInHand(t, 0)!.chosen).toBe(false);
    expect(playerInHand(t, 1)!.chosen).toBe(true);
    expect(viewFor(t, "p_a", at + RESULT_MS).options.cheat).toBe(true);
  });

  it("« suite » : la main suivante part dès que tous les joueurs présents l'ont demandée", () => {
    const rng = rngOf();
    let t = allQuiet(checkAround(allFair(dealt({ stacks: [1000, 1000, 1000] }))));
    expect([t.phase, t.nextAt]).toEqual(["denouement", T0 + RESULT_MS]);
    expect(viewFor(t, "p_a", T0).options.next).toBe(true);
    t = play(t, 0, { type: "suite" }, T0 + 1_000);
    t = play(t, 1, { type: "suite" }, T0 + 1_500);
    // Il en manque un : on attend encore.
    expect([t.phase, t.nextAt]).toEqual(["denouement", T0 + RESULT_MS]);
    expect(viewFor(t, "p_c", T0 + 1_500).seats.map((s) => s!.done)).toEqual([true, true, false]);
    expect(viewFor(t, "p_a", T0 + 1_500).options.next).toBe(false);
    t = play(t, 2, { type: "suite" }, T0 + 2_000);
    expect([t.phase, t.handNo, t.hand!.deadline]).toEqual(["triche", 2, T0 + 2_000 + CHEAT_MS]);
    expect(t.seats.every((s) => s!.ready === false)).toBe(true);
    // Hors du dénouement, ce geste n'existe pas.
    expect(refusal(() => play(t, 0, { type: "suite" }, T0 + 2_000))).toBe("ACTION_IMPOSSIBLE");
    expect(viewFor(t, "p_a", T0 + 2_000).options.next).toBe(false);
    // Sans personne pour la demander, la main suivante part à la fin de l'affichage.
    const waiting = allQuiet(checkAround(allFair(dealt({ stacks: [1000, 1000] }))));
    expect(advance(waiting, T0 + RESULT_MS - 1, rng)).toBe(waiting);
    expect(advance(waiting, T0 + RESULT_MS, rng).handNo).toBe(2);
  });

  it("« suite » n'attend pas un joueur absent, et seul contre des robots elle part aussitôt", () => {
    const rng = rngOf(33);
    // Le siège 1 devient absent dès la première main.
    let t = dealt({ stacks: [1000, 1000] });
    t = play(t, 0, { type: "franc-jeu" }, T0);
    t = advance(t, T0 + CHEAT_MS + TURN_MS, rng);
    expect(t.seats[1]!.absent).toBe(true);
    const at = T0 + CHEAT_MS + TURN_MS;
    t = play(t, 0, { type: "parole" }, at);
    t = play(t, 0, { type: "rien" }, at);
    expect(t.phase).toBe("denouement");
    t = play(t, 0, { type: "suite" }, at);
    expect([t.phase, t.handNo]).toEqual(["triche", 2]);
    // Contre des robots : ils n'ont rien à demander.
    let solo = dealt({ stacks: [1000], bots: ["gaspard", "ondine"] }, rng);
    solo = leaveToShowdown(solo, rng);
    expect(solo.phase).toBe("denouement");
    const now = solo.clock;
    solo = act(solo, "p_a", { type: "suite" }, now, rng);
    expect([solo.phase, solo.handNo]).toEqual(["triche", 2]);
  });

  it("le temps d'une table ne recule jamais", () => {
    const rng = rngOf();
    let t = allFair(dealt({ stacks: [1000, 1000] }), T0 + 10_000);
    expect(t.clock).toBe(T0 + 10_000);
    // Une requête dont l'horloge retarde agit à l'heure de la table.
    t = play(t, 1, { type: "parole" }, T0 + 4_000);
    expect([t.clock, t.hand!.deadline]).toEqual([T0 + 10_000, T0 + 10_000 + TURN_MS]);
    expect(advance(t, T0, rng)).toBe(t);
  });
});

describe("quitter la table", () => {
  it("entre deux mains : le tapis attend de retourner à la bourse", () => {
    const t = tableOf({ stacks: [500, 700, 900] });
    const after = leave(t, "p_b", T0 + 1_000, rngOf());
    expect(after.seats.map((s) => s?.playerId ?? null)).toEqual(["p_a", null, "p_c"]);
    expect(after.ended).toEqual([{ sid: "s_1", playerId: "p_b", seat: 1, payout: 700, received: 700, reason: "quitte", at: T0 + 1_000 }]);
    expect(after.departed).toEqual([{ playerId: "p_b", seat: 1, reason: "quitte", payout: 700, at: T0 + 1_000 }]);
    expect(after.audit).toEqual({ in: 2100, out: 700, bank: 0 });
    expect(after.phase).toBe("attente");
    expect(refusal(() => leave(after, "p_b", T0, rngOf()))).toBe("NOT_SEATED");
    // Le tapis rendu, la table n'a plus rien à ce nom.
    const acked = settled(after, ["s_1"]);
    expect(acked.ended).toEqual([]);
    expect(acked.version).toBe(after.version);
    audited(after);
  });

  it("en pleine main, à son tour : il se couche, ce qu'il a versé reste au pot, la parole passe", () => {
    let t = allFair(dealt({ stacks: [1000, 1000, 1000] }));
    t = play(t, 1, { type: "miser", amount: 30 });
    expect(t.hand!.turn).toBe(2);
    t = leave(t, "p_c", T0, rngOf());
    expect(t.seats[2]).toBeNull();
    expect(t.ended).toMatchObject([{ sid: "s_2", payout: 990, received: 1000, reason: "quitte" }]);
    expect([t.phase, t.hand!.pot, t.hand!.turn, t.hand!.pending]).toEqual(["encheres", 60, 0, [0]]);
    expect(viewFor(t, "p_a", T0).seats[2]).toBeNull();
    t = play(t, 0, { type: "suivre" });
    expect(t.phase).toBe("abattage");
    t = allQuiet(t);
    // Le pot de 90 compte les 10 du joueur parti.
    expect(t.result!.pots[0]!.amount).toBe(90);
    expect(t.result!.net.map((n) => n.seat).sort()).toEqual([0, 1]);
    expect(stacksOf(t).reduce((s: number, x) => s + (x ?? 0), 0)).toBe(2010);
    audited(t);
  });

  it("en pleine main, hors de son tour : la main continue sans lui", () => {
    let t = allFair(dealt({ stacks: [1000, 1000, 1000] }));
    t = leave(t, "p_a", T0, rngOf());
    expect([t.hand!.turn, t.hand!.pending]).toEqual([1, [1, 2]]);
    t = checkAround(t);
    expect(t.phase).toBe("abattage");
    expect(viewFor(t, "p_b", T0).options.accuse).toEqual([2]);
  });

  it("il ne reste qu'un joueur : il prend le pot, et la table attend", () => {
    const rng = rngOf();
    // Pendant la triche déjà : quitter, c'est se coucher.
    let t = dealt({ stacks: [1000, 1000] });
    t = leave(t, "p_a", T0 + 2_000, rng);
    expect(t.phase).toBe("denouement");
    expect(t.result).toMatchObject({ showdown: false, pots: [{ amount: 20, winners: [{ seat: 1, amount: 20 }] }] });
    expect(stacksOf(t)).toEqual([null, 1010]);
    expect(t.ended).toMatchObject([{ playerId: "p_a", payout: 990 }]);
    // Seul à table, pas de main : on attend un autre joueur.
    t = advance(t, T0 + 2_000 + WALKOVER_MS, rng);
    expect([t.phase, t.hand, t.nextAt]).toEqual(["attente", null, null]);
    expect(canDeal(t)).toBe(false);
    // Un ami arrive et pose sa cave : la partie repart toute seule, trois secondes plus tard.
    const at = T0 + 60_000;
    t = sit(t, { playerId: "p_z", sid: "s_z", pseudo: "Zoé", species: "chat", look: null }, at, rng);
    t = deposit(t, "s_z", 1, 800, at, rng);
    expect([t.phase, t.nextAt]).toEqual(["attente", at + RESTART_MS]);
    expect(viewFor(t, "p_b", at).deadline).toBe(at + RESTART_MS);
    t = advance(t, at + RESTART_MS, rng);
    expect([t.phase, t.handNo]).toEqual(["triche", 2]);
    audited(t);
  });

  it("pendant l'abattage : il sort de la main, les accusations qui le visent tombent", () => {
    let t = withHands(dealt({ stacks: [1000, 1000, 1000] }), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c", 2: "Qs Jd 8c 6h 2s" });
    t = checkAround(allFair(t));
    t = play(t, 2, { type: "accuser", seat: 0 });
    t = play(t, 1, { type: "rien" });
    // Le siège 0 avait la meilleure main, et s'en va avant de parler.
    t = leave(t, "p_a", T0, rngOf());
    expect(t.phase).toBe("denouement");
    expect(t.result).toMatchObject({
      showdown: true, accusations: [],
      pots: [{ amount: 30, winners: [{ seat: 1, amount: 30 }] }],
    });
    expect(t.result!.hands.map((x) => x.seat)).toEqual([1, 2]);
    expect(t.ended).toMatchObject([{ playerId: "p_a", payout: 990 }]);
    expect(stacksOf(t)).toEqual([null, 1020, 990]);
    audited(t);
  });

  it("un siège libéré en pleine main peut être repris : le nouveau venu attend la main suivante", () => {
    const rng = rngOf();
    let t = allFair(dealt({ stacks: [1000, 1000, 1000] }));
    t = leave(t, "p_a", T0, rng);
    t = sit(t, { playerId: "p_z", sid: "s_z", pseudo: "Zoé", species: "chat", look: null }, T0, rng);
    t = deposit(t, "s_z", 1, 400, T0, rng);
    expect(t.seats[0]).toMatchObject({ playerId: "p_z", stack: 400, reserve: 0 });
    const view = viewFor(t, "p_z", T0);
    expect([view.you, view.hand]).toEqual([0, null]);
    expect(view.seats[0]).toMatchObject({ pseudo: "Zoé", inHand: false, folded: false, committed: 0, stack: 400 });
    expect(refusal(() => act(t, "p_z", { type: "parole" }, T0, rng))).toBe("ACTION_IMPOSSIBLE");
    t = allQuiet(checkAround(t));
    expect(t.result!.net.map((n) => n.seat).sort()).toEqual([1, 2]);
    expect(t.seats[0]!.stack).toBe(400);
    t = advance(t, T0 + RESULT_MS, rng);
    expect(t.hand!.players.map((p) => p.seat).sort()).toEqual([0, 1, 2]);
    audited(t);
  });

  it("le dernier joueur humain s'en va : la table se ferme, l'argent des robots disparaît avec eux", () => {
    const rng = rngOf(12);
    let t = dealt({ stacks: [500], bots: ["gaspard", "ondine"] }, rng);
    expect(t.audit).toEqual({ in: 500, out: 0, bank: 2000 });
    t = leave(t, "p_a", T0 + 500, rng);
    expect([t.phase, t.closed, t.seats]).toEqual(["fermee", "vide", [null, null, null]]);
    // En pleine main, il s'est couché : sa blinde est perdue.
    expect(t.ended).toMatchObject([{ playerId: "p_a", payout: 490, reason: "quitte" }]);
    expect(chipsOnTable(t)).toBe(0);
    expect(t.audit).toEqual({ in: 500, out: 490, bank: -10 });
    expect(refusal(() => act(t, "p_a", { type: "franc-jeu" }, T0 + 600, rng))).toBe("TABLE_NOT_FOUND");
    expect(refusal(() => sit(t, { playerId: "p_z", sid: "s_z", pseudo: "Zoé", species: "chat", look: null }, T0, rng))).toBe("TABLE_NOT_FOUND");
  });
});

describe("recaver", () => {
  it("la table rattrape un dépôt une fois et une seule", () => {
    const rng = rngOf();
    let t = tableOf({ stacks: [400, 400] });
    expect(rebuyRange(t, 0)).toEqual({ min: 1, max: 600 });
    t = deposit(t, "s_0", 2, 700, T0, rng);
    expect(t.seats[0]).toMatchObject({ stack: 700, seq: 2, received: 700 });
    expect(t.log[t.log.length - 1]).toMatchObject({ kind: "cave", seat: 0, amount: 300 });
    // Le même dépôt rejoué, ou un plus ancien arrivé en retard : rien ne bouge.
    expect(deposit(t, "s_0", 2, 700, T0, rng)).toBe(t);
    expect(deposit(t, "s_0", 1, 400, T0, rng)).toBe(t);
    // Deux dépôts rattrapés d'un coup.
    t = deposit(t, "s_0", 4, 1000, T0, rng);
    expect(t.seats[0]).toMatchObject({ stack: 1000, seq: 4, received: 1000 });
    expect(rebuyRange(t, 0)).toBeNull();
    expect(t.audit.in).toBe(1400);
    audited(t);
  });

  it("dans le coup, la recave attend la main suivante ; couché, elle arrive tout de suite", () => {
    const rng = rngOf();
    let t = allFair(dealt({ stacks: [400, 400, 400] }));
    expect(rebuyRange(t, 1)).toBeNull();
    expect(viewFor(t, "p_b", T0).options.rebuy).toBeNull();
    // Le dépôt arrive quand même (la bourse a payé avant que la main ne parte).
    t = deposit(t, "s_1", 2, 600, T0, rng);
    expect(t.seats[1]).toMatchObject({ stack: 390, reserve: 200, received: 600 });
    expect(viewFor(t, "p_c", T0).seats[1]).toMatchObject({ stack: 390, reserve: 200 });
    // Son tapis en jeu n'a pas bougé : il ne peut miser que ce qu'il avait, pas la recave qui attend.
    expect(viewFor(t, "p_b", T0).options.bet).toEqual({ min: 10, max: 390 });
    audited(t);
    t = play(t, 1, { type: "coucher" });
    // Couché, il peut recaver, et l'argent rejoint le tapis aussitôt.
    expect(rebuyRange(t, 1)).toEqual({ min: 1, max: 410 });
    t = deposit(t, "s_1", 3, 700, T0, rng);
    expect(t.seats[1]).toMatchObject({ stack: 490, reserve: 200 });
    t = allQuiet(checkAround(t));
    // À la fin de la main, la réserve rejoint le tapis.
    expect(t.seats[1]).toMatchObject({ stack: 690, reserve: 0 });
    audited(t);
  });

  it("jusqu'à la cave maximale, pas en dessous de la cave minimale", () => {
    let t = tableOf({ stacks: [50, 950, 1000, 1200], blind: 10 });
    expect(t.minBuyIn).toBe(200);
    expect([0, 1, 2, 3].map((i) => rebuyRange(t, i))).toEqual([{ min: 150, max: 950 }, { min: 1, max: 50 }, null, null]);
    expect(rebuyRange(t, 4)).toBeNull();
    // Un siège réservé, sans cave : il faut d'abord la poser.
    t = createTable({ code: "ABCDE", kind: "privee", place: null, blind: 10, maxBuyIn: 1000, seats: 2, bots: [], difficulty: "normal" }, T0);
    t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rngOf());
    expect(rebuyRange(t, 0)).toBeNull();
  });

  it("à sec : il ne joue plus ; s'il recave il rejoue, sinon il quitte la table après trois mains", () => {
    const rng = rngOf(31);
    // Le siège 2 n'a que la blinde : il la perd à la première main (mains choisies).
    let t = withHands(dealt({ stacks: [1000, 1000, 10] }, rng), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c", 2: "7h 5d 4c 3s 2h" });
    t = allQuiet(checkAround(allFair(t)));
    expect(t.seats[2]).toMatchObject({ stack: 0, idle: 0 });
    expect(rebuyRange(t, 2)).toEqual({ min: 200, max: 1000 });
    const busted = t;
    // Sans recave : trois mains sans lui, puis il part.
    const seen: number[] = [];
    t = drive(busted, T0, T0 + 60_000, [0, 1], rng, (state) => {
      if (state.hand && seen[seen.length - 1] !== state.handNo) {
        seen.push(state.handNo);
        expect(playerInHand(state, 2)).toBeNull();
      }
    });
    expect(t.seats[2]).toBeNull();
    expect(t.departed).toMatchObject([{ playerId: "p_c", reason: "a-sec", payout: 0 }]);
    expect(seen.slice(0, 3)).toEqual([2, 3, 4]);
    // Avec une recave pendant le dénouement : il est servi à la main suivante.
    let back = deposit(busted, "s_2", 2, 310, T0 + 1_000, rng);
    expect(back.seats[2]).toMatchObject({ stack: 300, idle: 0 });
    back = advance(back, T0 + RESULT_MS, rng);
    expect(playerInHand(back, 2)).not.toBeNull();
    audited(back);
  });
});

describe("la fermeture", () => {
  it("sans activité depuis 30 minutes, la table se ferme et rend les tapis", () => {
    const rng = rngOf();
    const t = tableOf({ stacks: [500, 700] });
    expect(nextEventAt(t)).toBe(T0 + IDLE_TABLE_MS);
    expect(advance(t, T0 + IDLE_TABLE_MS - 1, rng)).toBe(t);
    const closed = advance(t, T0 + IDLE_TABLE_MS, rng);
    expect([closed.phase, closed.closed, closed.seats]).toEqual(["fermee", "inactive", [null, null]]);
    expect(closed.ended).toEqual([
      { sid: "s_0", playerId: "p_a", seat: 0, payout: 500, received: 500, reason: "inactive", at: T0 + IDLE_TABLE_MS },
      { sid: "s_1", playerId: "p_b", seat: 1, payout: 700, received: 700, reason: "inactive", at: T0 + IDLE_TABLE_MS },
    ]);
    expect(closed.audit).toEqual({ in: 1200, out: 1200, bank: 0 });
    expect(viewFor(closed, "p_a", T0).closed).toBe("inactive");
    // Une action d'un joueur repousse l'échéance ; regarder la table ne la repousse pas.
    const active = leave(tableOf({ stacks: [500, 700, 900] }), "p_c", T0 + 600_000, rng);
    expect(nextEventAt(active)).toBe(T0 + 600_000 + IDLE_TABLE_MS);
  });

  it("une main en cours est annulée à la fermeture : chacun reprend ce qu'il y avait versé", () => {
    const rng = rngOf();
    let t = allFair(dealt({ stacks: [500, 500, 500] }));
    t = play(t, 1, { type: "miser", amount: 30 });
    // Cas d'école : on vieillit la table à la main, les délais de jeu la fermeraient bien avant.
    const stale = copy(t);
    stale.activeAt = T0 - IDLE_TABLE_MS + 1_000;
    const closed = advance(stale, T0 + 1_000, rng);
    expect([closed.phase, closed.closed]).toEqual(["fermee", "inactive"]);
    expect(closed.ended.map((e) => e.payout)).toEqual([500, 500, 500]);
    expect(chipsOnTable(closed)).toBe(0);
    audited(closed);
  });

  it("un pot resté sur la table est partagé entre les joueurs assis à la fermeture", () => {
    const rng = rngOf();
    // Tête-à-tête, tous deux démasqués : 20 restent sur la table.
    const carried = () => {
      let t = withHands(dealt({ stacks: [1000, 1000] }), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c" });
      t = play(t, 0, { type: "tricher", index: 2, card: "Ah" });
      t = play(t, 1, { type: "tricher", index: 2, card: "Kh" });
      t = checkAround(t);
      t = play(t, 0, { type: "accuser", seat: 1 });
      return play(t, 1, { type: "accuser", seat: 0 });
    };
    // La table ferme pour inactivité (cas d'école) : chacun reprend son tapis et la moitié du pot.
    const stale = copy(carried());
    stale.activeAt = T0 - IDLE_TABLE_MS;
    const closed = advance(stale, T0, rng);
    expect(closed.ended.map((e) => [e.playerId, e.payout])).toEqual([["p_a", 1000], ["p_b", 1000]]);
    expect(closed.audit).toEqual({ in: 2000, out: 2000, bank: 0 });

    // Un joueur part entre deux mains : il laisse le pot. Le dernier assis l'emporte en fermant la table.
    let t = leave(carried(), "p_a", T0 + 1_000, rng);
    expect(t.ended).toMatchObject([{ playerId: "p_a", payout: 990 }]);
    expect([t.phase, t.carry]).toEqual(["denouement", 20]);
    t = leave(t, "p_b", T0 + 2_000, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "vide"]);
    expect(t.ended.map((e) => [e.playerId, e.payout])).toEqual([["p_a", 990], ["p_b", 1010]]);
    // Sans robot à la table, rien n'est créé ni détruit.
    expect(t.audit).toEqual({ in: 2000, out: 2000, bank: 0 });
  });

  it("la part d'un robot dans un pot resté là disparaît avec lui ; l'euro indivisible va au premier après le donneur", () => {
    const rng = rngOf(13);
    let t = createTable({ code: "ABCDE", kind: "privee", place: null, blind: 10, maxBuyIn: 1000, seats: 3, bots: ["hector", "baron"], difficulty: "normal" }, T0);
    t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rng);
    t = deposit(t, "s_0", 1, 1000, T0, rng);
    // Cas d'école : un pot de 25 resté là, le donneur au siège 0.
    const state = copy(t);
    state.carry = 25;
    state.dealer = 0;
    state.audit.bank += 25;
    audited(state);
    const closed = leave(state, "p_a", T0, rng);
    // Trois assis : 9, 8, 8. Le premier après le donneur est le siège 1 (un robot).
    expect(closed.ended).toMatchObject([{ playerId: "p_a", payout: 1008, reason: "quitte" }]);
    expect(chipsOnTable(closed)).toBe(0);
    audited(closed);
  });

  it("trop d'argent sur le tapis pour compter juste : la table ferme et rend tout", () => {
    const rng = rngOf();
    const t = tableOf({ stacks: [500, 500] });
    const rich = copy(t);
    rich.seats[0]!.stack = MAX_TABLE_CHIPS;
    rich.seats[0]!.received = MAX_TABLE_CHIPS;
    rich.audit.in = MAX_TABLE_CHIPS + 500;
    const closed = act(rich, "p_a", { type: "lancer" }, T0, rng);
    expect([closed.phase, closed.closed, closed.handNo]).toEqual(["fermee", "banque", 0]);
    expect(closed.ended.map((e) => [e.payout, e.reason])).toEqual([[MAX_TABLE_CHIPS, "banque"], [500, "banque"]]);
  });
});

// ---------------------------------------------------------------------------
// Des parties entières, jouées au hasard : des humains qui font n'importe quoi de permis
// (ou rien du tout), des robots des trois niveaux, des recaves, des départs.

interface Game {
  table: TableState;
  /** Ce que le test a lui-même déposé et repris, pour recouper les comptes de la table. */
  deposited: number;
  collected: number;
  hands: number;
  now: number;
}

interface Watch {
  /** Après chaque changement d'état. */
  step?: (t: TableState, now: number) => void;
  /** À la fin de chaque main. */
  hand?: (t: TableState) => void;
}

function randomGame(seed: number, watch: Watch = {}, options: { bots?: number; steps?: number } = {}): Game {
  const rng = rngOf(seed);
  const pick = (n: number) => rng() % n;
  const levels: Difficulty[] = ["facile", "normal", "difficile"];
  const nbots = options.bots ?? pick(5);
  const nhumans = nbots === 0 ? 2 + pick(4) : 1 + pick(2);
  const blind = [1, 2, 5, 10][pick(4)]!;
  const max = blind * (20 + pick(81));
  let now = T0;
  let t = createTable({
    code: "ABCDE", kind: "privee", place: null, blind, maxBuyIn: max, seats: 6,
    bots: BOT_PERSONAS.slice(0, nbots), difficulty: levels[pick(3)]!,
  }, now);
  const game: Game = { table: t, deposited: 0, collected: 0, hands: 0, now };
  const purses = new Map<string, { sid: string; seq: number; paid: number }>();
  const changed = (next: TableState) => {
    // Les tapis rendus : le test les encaisse et en accuse réception.
    for (const e of next.ended) game.collected += e.payout;
    t = next.ended.length > 0 ? settled(next, next.ended.map((e) => e.sid)) : next;
    watch.step?.(t, now);
  };
  for (let i = 0; i < nhumans; i++) {
    const id = IDS[i]!;
    const buy = blind * 20 + pick(max - blind * 20 + 1);
    purses.set(id, { sid: `s_${i}`, seq: 1, paid: buy });
    game.deposited += buy;
    changed(deposit(sit(t, { playerId: id, sid: `s_${i}`, pseudo: id, species: "chat", look: null }, now, rng), `s_${i}`, 1, buy, now, rng));
  }
  changed(act(t, t.owner!, { type: "lancer" }, now, rng));

  let last = 0;
  for (let step = 0; step < (options.steps ?? 500) && t.phase !== "fermee"; step++) {
    for (const [id, purse] of purses) {
      if (seatIndexOf(t, id) < 0) continue;
      const view = viewFor(t, id, now);
      const o = view.options;
      const lazy = pick(12) === 0;
      let action: GameAction | null = null;
      if (o.cheat && !lazy) {
        const free = DECK.filter((c) => !view.hand!.cards.includes(c));
        action = pick(5) < 2 ? { type: "tricher", index: pick(5), card: free[pick(free.length)]! } : { type: "franc-jeu" };
      } else if (o.fold && !lazy) {
        const choices: GameAction[] = [];
        if (o.check) choices.push({ type: "parole" }, { type: "parole" });
        if (o.call > 0) choices.push({ type: "suivre" }, { type: "suivre" });
        if (o.bet) choices.push({ type: "miser", amount: o.bet.min + pick(o.bet.max - o.bet.min + 1) });
        if (o.raise) choices.push({ type: "relancer", amount: o.raise.min + pick(o.raise.max - o.raise.min + 1) });
        if (o.allIn) choices.push({ type: "tapis" });
        if (!o.check) choices.push({ type: "coucher" });
        action = choices[pick(choices.length)]!;
      } else if (o.accuse.length > 0 && !lazy) {
        action = pick(3) === 0 ? { type: "accuser", seat: o.accuse[pick(o.accuse.length)]! } : { type: "rien" };
      } else if (o.back && pick(2) === 0) {
        action = { type: "retour" };
      } else if (o.next && pick(4) === 0) {
        action = { type: "suite" };
      } else if (o.rebuy && pick(3) === 0) {
        const amount = o.rebuy.min + pick(o.rebuy.max - o.rebuy.min + 1);
        purse.seq += 1;
        purse.paid += amount;
        game.deposited += amount;
        changed(deposit(t, purse.sid, purse.seq, purse.paid, now, rng));
      } else if (pick(500) === 0) {
        changed(leave(t, id, now, rng));
      }
      // Tout ce que la vue annonce comme permis doit être accepté.
      if (action) changed(act(t, id, action, now, rng, view.step));
    }
    now += 200 + pick(2_500);
    const next = advance(t, now, rng);
    if (next !== t) changed(next);
    if (t.result && t.result.no !== last) {
      last = t.result.no;
      game.hands += 1;
      watch.hand?.(t);
    }
  }
  game.table = t;
  game.now = now;
  return game;
}

describe("l'argent se conserve", () => {
  /** Rien de négatif, rien de fractionnaire, et les comptes tombent juste. */
  function sound(t: TableState): void {
    const chips = chipsOnTable(t);
    if (chips !== t.audit.in - t.audit.out + t.audit.bank) throw new Error(`comptes faux : ${chips} jetons, ${JSON.stringify(t.audit)}`);
    for (const seat of t.seats) {
      if (!seat) continue;
      if (!Number.isInteger(seat.stack) || seat.stack < 0 || !Number.isInteger(seat.reserve) || seat.reserve < 0) throw new Error(`tapis invalide : ${seat.stack}`);
    }
    if (t.hand) {
      let staked = 0;
      for (const p of t.hand.players) {
        if (!Number.isInteger(p.committed) || p.committed < 0 || p.bet < 0 || p.bet > p.committed) throw new Error("mise invalide");
        staked += p.committed;
      }
      // Le pot : les mises de la main, plus ce qui restait de la précédente.
      if (t.hand.pot < staked) throw new Error("le pot est plus petit que les mises");
    }
    if (!Number.isInteger(t.carry) || t.carry < 0) throw new Error("pot resté négatif");
  }

  it("sans robot, pas un euro n'est créé ni détruit : 60 parties, des milliers de mains", () => {
    let hands = 0;
    let closed = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const game = randomGame(seed, {
        step: (t) => {
          sound(t);
          // Les robots sont la seule source et le seul puits : sans eux, rien ne bouge.
          if (t.audit.bank !== 0) throw new Error("de l'argent est apparu sans robot");
        },
        hand: (t) => {
          // Le bilan d'une main : ce que les uns gagnent, les autres le perdent, au pot resté près.
          const r = t.result!;
          for (const pot of r.pots) expect(pot.winners.reduce((s, w) => s + w.amount, 0)).toBe(pot.carried ? 0 : pot.amount);
        },
      }, { bots: 0 });
      const t = game.table;
      // Les comptes de la table recoupent ceux que le test a tenus de son côté.
      expect(t.audit.in).toBe(game.deposited);
      expect(t.audit.out).toBe(game.collected);
      expect(chipsOnTable(t) + game.collected).toBe(game.deposited);
      if (t.phase === "fermee") {
        closed += 1;
        expect(chipsOnTable(t)).toBe(0);
        expect(game.collected).toBe(game.deposited);
      }
      hands += game.hands;
    }
    expect(hands).toBeGreaterThan(2_000);
    expect(closed).toBeGreaterThan(3);
  });

  it("avec des robots : les jetons de la table valent ce que les bourses ont versé, moins ce qu'elles ont repris, plus l'argent fictif des robots", () => {
    let hands = 0;
    let showdowns = 0;
    let carried = 0;
    let sidePotHands = 0;
    let unmasked = 0;
    let innocents = 0;
    for (let seed = 101; seed <= 200; seed++) {
      const game = randomGame(seed, {
        step: sound,
        hand: (t) => {
          const r = t.result!;
          if (r.showdown) showdowns += 1;
          if (r.carry > 0) carried += 1;
          if (r.pots.length > 1) sidePotHands += 1;
          unmasked += r.unmasked.length;
          innocents += r.accusations.filter((a) => !a.right).length;
          // Démasqué si et seulement si accusé à raison.
          expect(r.unmasked.map((u) => u.seat).sort()).toEqual([...new Set(r.accusations.filter((a) => a.right).map((a) => a.to))].sort());
          // Un joueur démasqué ne gagne aucun pot.
          for (const pot of r.pots) for (const w of pot.winners) expect(r.unmasked.some((u) => u.seat === w.seat)).toBe(false);
          expect(r.pots.reduce((s, p) => s + (p.carried ? p.amount : 0), 0)).toBe(r.carry);
        },
      });
      const t = game.table;
      expect(t.audit.in).toBe(game.deposited);
      expect(t.audit.out).toBe(game.collected);
      if (t.phase === "fermee") expect(chipsOnTable(t)).toBe(0);
      hands += game.hands;
    }
    // Assez de mains, et de toutes les sortes, pour que l'invariant veuille dire quelque chose.
    expect(hands).toBeGreaterThan(3_000);
    expect(showdowns).toBeGreaterThan(2_000);
    expect(carried).toBeGreaterThan(5);
    expect(sidePotHands).toBeGreaterThan(20);
    expect(unmasked).toBeGreaterThan(300);
    expect(innocents).toBeGreaterThan(300);
  });

  it("le même hasard rejoue la même partie, à l'euro près", () => {
    const a = randomGame(4242);
    const b = randomGame(4242);
    expect(a.table).toEqual(b.table);
    expect([a.deposited, a.collected, a.hands]).toEqual([b.deposited, b.collected, b.hands]);
    expect(randomGame(4243).table).not.toEqual(a.table);
  });

  it("de très grosses blindes restent des entiers exacts", () => {
    const rng = rngOf(5);
    const blind = MAX_BLIND;
    let t = createTable({ code: "ABCDE", kind: "privee", place: null, blind, maxBuyIn: blind * 100, seats: 6, bots: BOT_PERSONAS.slice(0, 5), difficulty: "difficile" }, T0);
    t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Crésus", species: "chat", look: null }, T0, rng);
    t = deposit(t, "s_0", 1, blind * 100, T0, rng);
    t = act(t, "p_a", { type: "lancer" }, T0, rng);
    // Le joueur dit parole ou se couche : il ne perd que ses blindes, et la partie dure. Les
    // robots, eux, misent jusqu'à trois fois le pot et poussent leur tapis.
    for (let now = T0; now <= T0 + 600_000; now += 1_000) {
      t = advance(t, now, rng);
      const o = viewFor(t, "p_a", now).options;
      if (o.cheat) t = act(t, "p_a", { type: "franc-jeu" }, now, rng);
      else if (o.fold) t = act(t, "p_a", o.check ? { type: "parole" } : { type: "coucher" }, now, rng);
      else if (o.accuse.length > 0) t = act(t, "p_a", { type: "rien" }, now, rng);
      sound(t);
      expect(chipsOnTable(t)).toBeLessThan(MAX_TABLE_CHIPS);
      // Un robot ne garde jamais plus de trois caves d'une main sur l'autre.
      if (t.phase === "triche") for (const seat of t.seats) if (seat?.bot) expect(seat.stack + blind).toBeLessThanOrEqual(3 * t.maxBuyIn);
    }
    expect(t.handNo).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------

describe("ce que voit un joueur", () => {
  /**
   * La même table, où tout ce que `viewer` n'a pas à savoir est remplacé par autre
   * chose : les cartes cachées des autres, qui a triché, qui accuse qui, quand les
   * robots vont se décider. Si une vue dépend d'un secret, elle change.
   */
  function scrambled(t: TableState, viewer: number | null, rng: Random32): TableState {
    const s = copy(t);
    if (!s.hand) return s;
    for (const p of s.hand.players) {
      if (!p.gone && p.seat === viewer) continue;
      // Une main ne se montre qu'à l'abattage, si son joueur est encore en jeu.
      if (s.phase !== "abattage" || p.folded) p.cards = shuffledDeck(rng).slice(0, 5);
      p.swap = p.swap ? null : { index: rng() % 5, from: DECK[rng() % 52]! };
      if (p.spoke) p.accuse = p.accuse === null ? rng() % 6 : null;
      if (p.actAt !== null) p.actAt += 1 + (rng() % 500);
    }
    return s;
  }

  it("une vue ne dépend d'aucun secret des autres : 30 parties, tous les sièges, à chaque instant", () => {
    const side = rngOf(606);
    let compared = 0;
    const phases = new Set<string>();
    for (let seed = 301; seed <= 330; seed++) {
      randomGame(seed, {
        step: (t, now) => {
          phases.add(t.phase);
          const viewers: (number | null)[] = [null, ...t.seats.map((_, i) => i)];
          for (const viewer of viewers) {
            const view = viewOfSeat(t, viewer, now);
            const other = viewOfSeat(scrambled(t, viewer, side), viewer, now);
            if (JSON.stringify(view) !== JSON.stringify(other)) throw new Error(`la vue du siège ${viewer} dépend d'un secret (${t.phase})`);
            compared += 1;
          }
        },
      }, { steps: 150 });
    }
    expect(compared).toBeGreaterThan(25_000);
    expect([...phases].sort()).toEqual(["abattage", "attente", "denouement", "encheres", "fermee", "triche"]);
  });

  it("les options annoncées sont exactes : tout ce qui est annoncé est accepté, tout le reste est refusé", () => {
    let checked = 0;
    const accepted = (t: TableState, id: string, action: GameAction, now: number, step: number) =>
      refusal(() => act(t, id, action, now, rngOf(1), step)) === "accepté";
    for (let seed = 601; seed <= 615; seed++) {
      let tick = 0;
      randomGame(seed, {
        step: (t, now) => {
          // Un état sur quatre suffit : chaque essai rejoue le moteur.
          if (t.phase === "fermee" || tick++ % 4 !== 0) return;
          t.seats.forEach((seat, index) => {
            if (!seat || seat.bot !== null) return;
            const view = viewOfSeat(t, index, now);
            const o = view.options;
            const id = seat.playerId;
            const expectSame = (label: string, action: GameAction, announced: boolean) => {
              if (accepted(t, id, action, now, view.step) !== announced) throw new Error(`${label} : annoncé ${announced}, phase ${t.phase}, siège ${index}`);
              checked += 1;
            };
            expectSame("lancer", { type: "lancer" }, o.start);
            expectSame("suite", { type: "suite" }, o.next);
            expectSame("franc-jeu", { type: "franc-jeu" }, o.cheat);
            const free = DECK.find((card) => !(view.hand?.cards ?? []).includes(card))!;
            expectSame("tricher", { type: "tricher", index: 0, card: free }, o.cheat);
            expectSame("parole", { type: "parole" }, o.check && o.fold);
            expectSame("suivre", { type: "suivre" }, o.call > 0);
            expectSame("coucher", { type: "coucher" }, o.fold);
            expectSame("tapis", { type: "tapis" }, o.allIn);
            for (const amount of new Set([1, t.blind, view.pot, view.pot + 1, seat.stack, o.bet?.min ?? 2, (o.bet?.min ?? 2) - 1, o.bet?.max ?? 3, (o.bet?.max ?? 3) + 1])) {
              if (amount <= 0) continue;
              expectSame(`miser ${amount}`, { type: "miser", amount }, o.bet !== null && amount >= o.bet.min && amount <= o.bet.max);
            }
            for (const amount of new Set([view.bet + 1, view.bet + t.blind, o.raise?.min ?? 2, (o.raise?.min ?? 2) - 1, o.raise?.max ?? 3, (o.raise?.max ?? 3) + 1])) {
              if (amount <= 0) continue;
              expectSame(`relancer ${amount}`, { type: "relancer", amount }, o.raise !== null && amount >= o.raise.min && amount <= o.raise.max);
            }
            expectSame("rien", { type: "rien" }, o.accuse.length > 0);
            t.seats.forEach((_, target) => expectSame(`accuser ${target}`, { type: "accuser", seat: target }, o.accuse.includes(target)));
          });
        },
      }, { steps: 120 });
    }
    expect(checked).toBeGreaterThan(20_000);
  });

  it("avant l'abattage : sa main, et rien des cartes des autres", () => {
    let t = withHands(dealt({ stacks: [1000, 1000, 1000] }), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c", 2: "Qs Jd 8c 6h 2s" });
    t = play(t, 1, { type: "tricher", index: 2, card: "Kh" });
    for (const state of [t, allFair(t)]) {
      const mine = viewFor(state, "p_a", T0);
      expect(mine.you).toBe(0);
      expect(mine.hand).toMatchObject({ cards: hand("As Ad 7c 5h 2d"), category: "paire", swap: null });
      expect(mine.seats.map((s) => s!.cards)).toEqual([null, null, null]);
      const text = JSON.stringify(mine);
      for (const card of [...hand("Kc Kd 9s 4h 3c Kh"), ...hand("Qs Jd 8c 6h 2s")]) expect([card, text.includes(`"${card}"`)]).toEqual([card, false]);
      // Qui a choisi se voit ; ce qu'il a choisi, non.
      expect(mine.seats[1]).toMatchObject({ done: state.phase === "triche", inHand: true });
      // Le tricheur, lui, sait ce qu'il a fait.
      expect(viewFor(state, "p_b", T0).hand).toMatchObject({ cards: hand("Kc Kd Kh 4h 3c"), swap: { index: 2, from: "9s" } });
    }
  });

  it("une vue ne contient que des champs publics : ni horloge interne, ni comptes, ni séances", () => {
    const t = allFair(dealt({ stacks: [1000, 1000], bots: ["gaspard"] }));
    const view = viewFor(t, "p_a", T0 + 500);
    expect(Object.keys(view).sort()).toEqual([
      "bet", "blind", "closed", "code", "deadline", "dealer", "difficulty", "hand", "handNo", "kind", "log", "maxBuyIn",
      "minBuyIn", "now", "options", "owner", "phase", "place", "pot", "result", "rise", "seats", "started", "step",
      "turn", "version", "you",
    ]);
    // Hors d'un défi, la blinde ne bouge pas.
    expect([view.blind, view.rise]).toEqual([10, null]);
    expect(Object.keys(view.seats[1]!).sort()).toEqual([
      "absent", "allIn", "bet", "bot", "cards", "category", "committed", "done", "folded", "funded", "inHand", "look",
      "pseudo", "reserve", "seat", "species", "stack",
    ]);
    const text = JSON.stringify(view);
    for (const secret of ["sid", "s_0", "s_1", "p_a", "p_b", "playerId", "actAt", "audit", "received", "seq", "ended", "missed"]) {
      expect([secret, text.includes(secret)]).toEqual([secret, false]);
    }
    expect(view.now).toBe(T0 + 500);
  });

  it("à l'abattage : les mains encore en jeu, pas celles des joueurs couchés ; jamais qui a triché", () => {
    let t = withHands(dealt({ stacks: [1000, 1000, 1000] }), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c", 2: "Qs Jd 8c 6h 2s" });
    t = play(t, 1, { type: "tricher", index: 2, card: "Kh" });
    t = allFair(t);
    t = play(t, 1, { type: "miser", amount: 10 });
    t = play(t, 2, { type: "coucher" });
    t = play(t, 0, { type: "suivre" });
    expect(t.phase).toBe("abattage");
    for (const viewer of ["p_a", "p_b", "p_c", "p_spectateur"]) {
      const view = viewFor(t, viewer, T0);
      expect(view.seats.map((s) => s!.cards)).toEqual([hand("As Ad 7c 5h 2d"), hand("Kc Kd Kh 4h 3c"), null]);
      expect(view.seats[2]).toMatchObject({ folded: true, cards: null, category: null });
      if (viewer !== "p_b") expect(JSON.stringify(view)).not.toContain("swap\":{");
      if (viewer !== "p_c") expect(JSON.stringify(view)).not.toContain("\"Qs\"");
    }
    // Le joueur couché voit toujours sa propre main.
    expect(viewFor(t, "p_c", T0).hand).toMatchObject({ cards: hand("Qs Jd 8c 6h 2s"), folded: true });
  });

  it("au dénouement : un tricheur démasqué est montré, un tricheur que personne n'accuse ne l'est jamais", () => {
    const base = () => {
      let t = withHands(dealt({ stacks: [1000, 1000, 1000] }), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c", 2: "Qs Jd 8c 6h 2s" });
      t = play(t, 1, { type: "tricher", index: 2, card: "Kh" });
      return checkAround(allFair(t));
    };
    const caught = allQuiet(play(base(), 0, { type: "accuser", seat: 1 }));
    const safe = allQuiet(base());
    for (const viewer of ["p_a", "p_b", "p_c", "p_spectateur"]) {
      const seen = viewFor(caught, viewer, T0);
      expect(seen.result!.unmasked).toEqual([{ seat: 1, index: 2, from: "9s", to: "Kh" }]);
      expect(seen.hand).toBeNull();
      const blind = viewFor(safe, viewer, T0);
      expect(blind.result!.unmasked).toEqual([]);
      expect(JSON.stringify(blind)).not.toContain("9s");
      expect(JSON.stringify(blind)).not.toContain("swap");
    }
    // Et la main suivante n'en garde aucune trace.
    const next = advance(safe, T0 + RESULT_MS, rngOf());
    expect(next.result!.no).toBe(1);
    expect(JSON.stringify(viewFor(next, "p_a", T0 + RESULT_MS).result)).not.toContain("9s");
  });

  it("qui n'est pas assis reçoit un aperçu : la table, sans main ni geste possible", () => {
    const t = allFair(dealt({ stacks: [1000, 1000] }));
    for (const viewer of ["p_inconnu", null]) {
      const view = viewFor(t, viewer, T0);
      expect([view.you, view.hand]).toEqual([null, null]);
      expect(view.options).toEqual({
        start: false, cheat: false, check: false, call: 0, bet: null, raise: null, allIn: false, fold: false,
        accuse: [], rebuy: null, back: false, next: false,
      });
      expect(view).toMatchObject({ code: "ABCDE", blind: 10, minBuyIn: 200, maxBuyIn: 1000, phase: "encheres", pot: 20, turn: 1 });
    }
  });

  it("l'échéance suit le temps du jeu ; le temps de réflexion d'un robot ne se montre pas", () => {
    const rng = rngOf(17);
    let t = dealt({ stacks: [1000], bots: ["ondine"] }, rng);
    expect(viewFor(t, "p_a", T0)).toMatchObject({ phase: "triche", deadline: T0 + CHEAT_MS, turn: null });
    t = act(t, "p_a", { type: "franc-jeu" }, T0, rng);
    // Le robot réfléchit encore : la triche n'est pas finie.
    expect(t.phase).toBe("triche");
    const thinking = playerInHand(t, 1)!.actAt!;
    expect(thinking).toBeGreaterThanOrEqual(T0 + BOT_MIN_MS);
    expect(thinking).toBeLessThanOrEqual(T0 + BOT_MAX_MS);
    expect(advance(t, thinking - 1, rng)).toBe(t);
    t = advance(t, thinking, rng);
    // Le donneur est le siège 0 : le robot parle le premier, et son délai reste caché.
    expect([t.phase, t.hand!.turn]).toEqual(["encheres", 1]);
    expect(viewFor(t, "p_a", thinking).deadline).toBeNull();
    const speaking = playerInHand(t, 1)!.actAt!;
    expect(speaking - thinking).toBeGreaterThanOrEqual(BOT_MIN_MS);
    expect(speaking - thinking).toBeLessThanOrEqual(BOT_MAX_MS);
    t = advance(t, speaking, rng);
    if (t.phase === "encheres") expect(viewFor(t, "p_a", speaking)).toMatchObject({ turn: 0, deadline: speaking + TURN_MS });
  });
});

describe("les robots", () => {
  /** La vue d'un robot assis face à un humain, avec la main qu'on lui donne. */
  function botView(cards: string, stage: "triche" | "parole" | "mise" | "abattage" = "triche", rival = "Qs Jd 8c 6h 2s", bet = 20, stacks: [number, number] = [1000, 1000]): TableView {
    // Le siège 0 est humain et donneur ; le robot, siège 1, parle le premier.
    let t = createTable({ code: "ABCDE", kind: "privee", place: null, blind: 10, maxBuyIn: 1000, seats: 2, bots: ["hector"], difficulty: "normal" }, T0);
    const rng = rngOf(40);
    t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rng);
    t = deposit(t, "s_0", 1, stacks[0], T0, rng);
    t.seats[1]!.stack = stacks[1];
    t = act(t, "p_a", { type: "lancer" }, T0, rng);
    t = withHands(t, { 0: rival, 1: cards });
    if (stage === "triche") return viewOfSeat(t, 1, T0);
    // On fait passer les étapes à la main, sans laisser le robot décider.
    const s = copy(t);
    const h = s.hand!;
    for (const p of h.players) p.chosen = true;
    s.phase = "encheres";
    if (stage === "abattage") {
      s.phase = "abattage";
      return viewOfSeat(s, 1, T0);
    }
    if (stage === "parole") {
      h.turn = 1;
      h.pending = [1, 0];
      return viewOfSeat(s, 1, T0);
    }
    // L'humain a misé `bet` ; au robot de répondre.
    h.players.find((p) => p.seat === 0)!.bet = bet;
    h.players.find((p) => p.seat === 0)!.committed += bet;
    s.seats[0]!.stack -= bet;
    h.pot += bet;
    h.bet = bet;
    h.turn = 1;
    h.pending = [1];
    return viewOfSeat(s, 1, T0);
  }

  /** La même vue pendant la triche, avec cinq autres cartes : pour compter sur des milliers de mains. */
  const dealtView = botView("7h 5d 4c 3s 2h");
  const withCards = (cards: Card[]): TableView => ({ ...dealtView, hand: { ...dealtView.hand!, cards, category: evaluate(cards).category } });

  const after = (view: TableView, swap: { index: number; card: Card } | null): Card[] => {
    const cards = [...view.hand!.cards];
    if (swap) cards[swap.index] = swap.card;
    return cards;
  };
  const LEVELS: Difficulty[] = ["facile", "normal", "difficile"];

  it("la force d'une main suit les combinaisons, puis leur hauteur", () => {
    const samples = ["7h 5d 4c 3s 2h", "Ah Kd 9c 5s 2h", "2h 2d 9c 5s 3h", "Ah Ad 9c 5s 3h", "Kh Kd 4c 4s Ah", "7h 7d 7c Ks 2h", "9h 8d 7c 6s 5h", "Ah Jh 9h 5h 2h", "3h 3d 3c Ks Kh", "5h 5d 5c 5s Kh", "As Ks Qs Js Ts"];
    const strengths = samples.map((s) => handStrength(hand(s)));
    for (let i = 1; i < strengths.length; i++) expect(strengths[i]!).toBeGreaterThan(strengths[i - 1]!);
    expect(strengths[0]!).toBeGreaterThan(0);
    expect(strengths[strengths.length - 1]!).toBeLessThanOrEqual(1);
  });

  it("facile : triche une main sur six, et grossièrement", () => {
    const rng = rngOf(50);
    let cheated = 0;
    const N = 3_000;
    for (let i = 0; i < N; i++) {
      const view = withCards(shuffledDeck(rng).slice(0, 5));
      if (botCheat(view, "facile", rng)) cheated += 1;
    }
    expect(cheated / N).toBeGreaterThan(1 / 6 - 0.03);
    expect(cheated / N).toBeLessThan(1 / 6 + 0.03);
    // Quand il triche, il prend la plus belle main qu'une carte puisse lui donner : avec un brelan, un carré.
    const swap = botCheat(botView("7h 7d 7c Ks 2h"), "facile", always(0))!;
    expect(evaluate(after(botView("7h 7d 7c Ks 2h"), swap)).category).toBe("carre");
    expect(evaluate(after(botView("Kh Kd 4c 4s Ah"), botCheat(botView("Kh Kd 4c 4s Ah"), "facile", always(0)))).category).toBe("full");
    expect(evaluate(after(botView("9h 9d Ac 5s 2h"), botCheat(botView("9h 9d Ac 5s 2h"), "facile", always(0)))).category).toBe("brelan");
    expect(evaluate(after(botView("Ah Jh 9h 5h 2c"), botCheat(botView("Ah Jh 9h 5h 2c"), "facile", always(0)))).category).toBe("couleur");
    // Cinq fois sur six, franc jeu.
    expect(botCheat(botView("7h 7d 7c Ks 2h"), "facile", always(1))).toBeNull();
    expect(botCheat(botView("7h 7d 7c Ks 2h"), "facile", always(5))).toBeNull();
  });

  it("normal : triche une fois sur trois, et seulement si sa combinaison y gagne", () => {
    const rng = rngOf(51);
    let cheated = 0;
    const N = 3_000;
    for (let i = 0; i < N; i++) {
      const view = withCards(shuffledDeck(rng).slice(0, 5));
      const swap = botCheat(view, "normal", rng);
      if (!swap) continue;
      cheated += 1;
      expect(evaluate(after(view, swap)).level).toBeGreaterThan(evaluate(view.hand!.cards).level);
    }
    expect(cheated / N).toBeGreaterThan(1 / 3 - 0.04);
    expect(cheated / N).toBeLessThan(1 / 3 + 0.04);
    // Une suite ne devient ni couleur ni full en une carte : il ne triche pas, même quand le dé le veut.
    expect(botCheat(botView("9h 8d 7c 6s 5h"), "normal", always(0))).toBeNull();
    expect(evaluate(after(botView("9h 9d Ac 5s 2h"), botCheat(botView("9h 9d Ac 5s 2h"), "normal", always(0)))).category).toBe("brelan");
    expect(evaluate(after(botView("3h 3d 3c Ks Kh"), botCheat(botView("3h 3d 3c Ks Kh"), "normal", always(0)))).category).toBe("carre");
    expect(botCheat(botView("9h 9d Ac 5s 2h"), "normal", always(1))).toBeNull();
  });

  it("difficile : triche une fois sur deux, discrètement : un brelan, une suite, une couleur, jamais plus", () => {
    const rng = rngOf(52);
    let cheated = 0;
    let possible = 0;
    const N = 2_000;
    for (let i = 0; i < N; i++) {
      const view = withCards(shuffledDeck(rng).slice(0, 5));
      const level = evaluate(view.hand!.cards).level;
      const discreet = possibleSwaps(view.hand!.cards).some(({ value }) => value.level > level && value.level >= 3 && value.level <= 5);
      if (discreet) possible += 1;
      const swap = botCheat(view, "difficile", rng);
      if (!swap) continue;
      cheated += 1;
      const made = evaluate(after(view, swap));
      expect(discreet).toBe(true);
      expect(["brelan", "suite", "couleur"]).toContain(made.category);
      expect(made.level).toBeGreaterThan(level);
    }
    expect(cheated / possible).toBeGreaterThan(0.5 - 0.04);
    expect(cheated / possible).toBeLessThan(0.5 + 0.04);
    // Avec un brelan, tricher ferait un carré ou un full : trop voyant. Il s'abstient.
    expect(botCheat(botView("7h 7d 7c Ks 2h"), "difficile", always(0))).toBeNull();
    // Avec deux paires, il préfère un brelan au full que prendraient les deux autres.
    expect(evaluate(after(botView("Kh Kd 4c 4s Ah"), botCheat(botView("Kh Kd 4c 4s Ah"), "difficile", always(0)))).category).toBe("brelan");
    expect(evaluate(after(botView("Kh Kd 4c 4s Ah"), botCheat(botView("Kh Kd 4c 4s Ah"), "normal", always(0)))).category).toBe("full");
    // Une suite, une couleur, un full : rien de discret à y gagner.
    for (const made of ["9h 8d 7c 6s 5h", "Ah Jh 9h 5h 2h", "3h 3d 3c Ks Kh"]) expect(botCheat(botView(made), "difficile", always(0))).toBeNull();
    expect(evaluate(after(botView("9h 9d Ac 5s 2h"), botCheat(botView("9h 9d Ac 5s 2h"), "difficile", always(0)))).category).toBe("brelan");
    expect(evaluate(after(botView("Ah Jh 9h 5h 2c"), botCheat(botView("Ah Jh 9h 5h 2c"), "difficile", always(0)))).category).toBe("couleur");
    expect(evaluate(after(botView("9h 8d 7c 6s 2h"), botCheat(botView("9h 8d 7c 6s 2h"), "difficile", always(0)))).category).toBe("suite");
    // Une fois sur deux, franc jeu.
    expect(botCheat(botView("9h 9d Ac 5s 2h"), "difficile", always(1))).toBeNull();
  });

  it("un robot ne propose que des remplacements permis", () => {
    const rng = rngOf(53);
    for (let i = 0; i < 1_500; i++) {
      const view = withCards(shuffledDeck(rng).slice(0, 5));
      for (const level of LEVELS) {
        const swap = botCheat(view, level, rng);
        if (!swap) continue;
        expect(swap.index >= 0 && swap.index < 5 && Number.isInteger(swap.index)).toBe(true);
        expect(isCard(swap.card)).toBe(true);
        expect(view.hand!.cards.includes(swap.card)).toBe(false);
      }
    }
    // Il a déjà choisi : il ne recommence pas.
    const chosen = copy(botView("9h 9d Ac 5s 2h"));
    chosen.hand!.chosen = true;
    for (const level of LEVELS) expect(botCheat(chosen, level, always(0))).toBeNull();
  });

  it("enchères, personne n'a misé : il mise selon sa main", () => {
    const weak = botView("7h 5d 4c 3s 2h", "parole");
    const full = botView("3h 3d 3c Ks Kh", "parole");
    expect(weak.options).toMatchObject({ check: true, bet: { min: 10, max: 20 } });
    // Sans rien : parole. Le robot facile ne bluffe jamais ; les deux autres, rarement.
    for (const mood of [0, 500, 999]) expect(botBet(weak, "facile", sequence(mood, 500))).toEqual({ type: "parole" });
    expect(botBet(weak, "normal", sequence(500, 500))).toEqual({ type: "parole" });
    expect(botBet(weak, "normal", sequence(50, 500))).toEqual({ type: "miser", amount: 10 });
    expect(botBet(weak, "difficile", sequence(500, 500))).toEqual({ type: "parole" });
    expect(botBet(weak, "difficile", sequence(100, 500))).toEqual({ type: "miser", amount: 13 });
    // Avec un full : il mise, à tous les niveaux.
    for (const level of LEVELS) {
      const move = botBet(full, level, sequence(300, 500));
      expect(move.type).toBe("miser");
      expect((move as { amount: number }).amount).toBeGreaterThanOrEqual(10);
      expect((move as { amount: number }).amount).toBeLessThanOrEqual(20);
    }
    // Le robot difficile tend parfois un piège : parole avec une très belle main.
    expect(botBet(full, "difficile", sequence(900, 500))).toEqual({ type: "parole" });
  });

  it("enchères, face à une mise : le robot facile suit trop, les autres pèsent le prix", () => {
    const nothing = botView("7h 5d 4c 3s 2h", "mise");
    const smallPair = botView("4h 4d 9c 7s 2h", "mise");
    const trips = botView("7h 7d 7c Ks 2h", "mise");
    const full = botView("3h 3d 3c Ks Kh", "mise");
    expect(nothing.options).toMatchObject({ check: false, call: 20, raise: { min: 30, max: 80 } });
    // Facile : il suit avec n'importe quelle paire, et une fois sur deux sans rien.
    expect(botBet(smallPair, "facile", sequence(999, 0))).toEqual({ type: "suivre" });
    expect(botBet(nothing, "facile", sequence(100, 0))).toEqual({ type: "suivre" });
    expect(botBet(nothing, "facile", sequence(900, 0))).toEqual({ type: "coucher" });
    // Normal et difficile : une petite paire ne vaut pas une mise du pot.
    expect(botBet(smallPair, "normal", sequence(999, 0))).toEqual({ type: "coucher" });
    expect(botBet(smallPair, "difficile", sequence(500, 0))).toEqual({ type: "coucher" });
    expect(botBet(nothing, "normal", sequence(0, 0))).toEqual({ type: "coucher" });
    // Un brelan suit.
    expect(botBet(trips, "normal", sequence(999, 0))).toEqual({ type: "suivre" });
    expect(botBet(trips, "difficile", sequence(999, 0))).toEqual({ type: "suivre" });
    // Un full relance, quand l'humeur y est ; sinon il suit.
    expect(botBet(full, "facile", sequence(100, 0)).type).toBe("relancer");
    expect(botBet(full, "normal", sequence(100, 0)).type).toBe("relancer");
    expect(botBet(full, "difficile", sequence(100, 0)).type).toBe("relancer");
    expect(botBet(full, "normal", sequence(900, 0))).toEqual({ type: "suivre" });
    // Le robot difficile bluffe en relançant, avec mesure : une fois sur vingt quand il n'a rien.
    expect(botBet(nothing, "difficile", sequence(960, 0)).type).toBe("relancer");
    expect(botBet(nothing, "difficile", sequence(940, 0))).toEqual({ type: "coucher" });
    // Le prix compte : une paire d'as ne paie pas une mise du pot, mais suit une blinde dans un gros pot.
    const aces = botView("Ah Ad 9c 7s 2h", "mise");
    expect(botBet(aces, "normal", sequence(999, 0))).toEqual({ type: "coucher" });
    expect(botBet(aces, "difficile", sequence(500, 0))).toEqual({ type: "coucher" });
    const cheap = copy(aces);
    cheap.pot = 200;
    cheap.options.call = 10;
    expect(botBet(cheap, "normal", sequence(999, 0))).toEqual({ type: "suivre" });
    expect(botBet(cheap, "difficile", sequence(500, 0))).toEqual({ type: "suivre" });
  });

  it("un robot ne propose que des gestes permis, dans les fourchettes annoncées", () => {
    const side = rngOf(54);
    let checked = 0;
    for (let seed = 401; seed <= 425; seed++) {
      randomGame(seed, {
        step: (t, now) => {
          if (t.phase !== "encheres" || t.hand!.turn === null || t.seats[t.hand!.turn]?.bot === null) return;
          const view = viewOfSeat(t, t.hand!.turn, now);
          const o = view.options;
          for (const level of LEVELS) {
            const move = botBet(view, level, side);
            checked += 1;
            if (move.type === "parole") expect(o.check).toBe(true);
            else if (move.type === "suivre") expect(o.call).toBeGreaterThan(0);
            else if (move.type === "miser") expect(o.bet !== null && move.amount >= o.bet.min && move.amount <= o.bet.max && Number.isInteger(move.amount)).toBe(true);
            else if (move.type === "relancer") expect(o.raise !== null && move.amount >= o.raise.min && move.amount <= o.raise.max && Number.isInteger(move.amount)).toBe(true);
            else expect(o.check).toBe(false); // il ne se couche pas quand la parole est gratuite
          }
        },
      }, { bots: 4, steps: 200 });
    }
    expect(checked).toBeGreaterThan(3_000);
  });

  it("facile : accuse rarement, et au hasard", () => {
    const view = botView("7h 5d 4c 3s 2h", "abattage", "As Ks Qs Js Ts");
    const rng = rngOf(55);
    let accused = 0;
    for (let i = 0; i < 4_000; i++) if (botAccuse(view, "facile", rng) !== null) accused += 1;
    expect(accused / 4_000).toBeGreaterThan(0.07);
    expect(accused / 4_000).toBeLessThan(0.13);
    expect(botAccuse(view, "facile", always(0))).toBe(0);
    expect(botAccuse(view, "facile", always(1))).toBeNull();
  });

  it("normal : accuse une main trop belle une fois sur deux, et toujours une carte qu'il a lui-même en main", () => {
    // Un brelan chez l'adversaire : rien à dire. Un full : une fois sur deux.
    expect(botAccuse(botView("7h 5d 4c 3s 2h", "abattage", "9h 9d 9c Ks 2d"), "normal", always(0))).toBeNull();
    const full = botView("7h 5d 4c 3s 2h", "abattage", "9h 9d 9c Ks Kd");
    expect(botAccuse(full, "normal", always(0))).toBe(0);
    expect(botAccuse(full, "normal", always(1))).toBeNull();
    const rng = rngOf(56);
    let accused = 0;
    for (let i = 0; i < 2_000; i++) if (botAccuse(full, "normal", rng) !== null) accused += 1;
    expect(accused / 2_000).toBeGreaterThan(0.45);
    expect(accused / 2_000).toBeLessThan(0.55);
    // L'adversaire montre le 7 de cœur, que le robot a reçu : c'est une preuve, quelle que soit la main.
    const proof = botView("7h 5d 4c 3s 2h", "abattage", "7h Jd 8c 6h 2s");
    for (const value of [0, 1, 999_999]) expect(botAccuse(proof, "normal", always(value))).toBe(0);
    expect(botAccuse(proof, "difficile", always(999_999))).toBe(0);
  });

  it("une carte en double n'est une preuve que si le robot l'a vraiment reçue", () => {
    // Le robot a lui-même glissé le roi de cœur dans sa main, et l'adversaire le montre aussi :
    // c'est peut-être le robot le seul tricheur. Pas de preuve.
    const own = copy(botView("Kc Kd Kh 4h 3c", "abattage", "Kh Jd 8c 6h 2s"));
    own.hand!.swap = { index: 2, from: "9s" };
    expect(botAccuse(own, "normal", always(1))).toBeNull();
    expect(botAccuse(own, "difficile", always(999_999))).toBeNull();
    // Mais si l'adversaire montre la carte que le robot a écartée, il a triché.
    const discarded = copy(botView("Kc Kd Kh 4h 3c", "abattage", "9s Jd 8c 6h 2s"));
    discarded.hand!.swap = { index: 2, from: "9s" };
    expect(botAccuse(discarded, "normal", always(1))).toBe(0);
    expect(botAccuse(discarded, "difficile", always(999_999))).toBe(0);
  });

  it("difficile : accuse d'après la vraisemblance, et seulement une main qui bat la sienne", () => {
    const rng = rngOf(57);
    const rate = (view: TableView) => {
      let n = 0;
      for (let i = 0; i < 2_000; i++) if (botAccuse(view, "difficile", rng) !== null) n += 1;
      return n / 2_000;
    };
    // Plus la main montrée est rare, plus elle est suspecte.
    const pair = rate(botView("7h 5d 4c 3s 2h", "abattage", "9h 9d Ac 5s 2d"));
    const trips = rate(botView("7h 5d 4c 3s 2h", "abattage", "9h 9d 9c Ks 2d"));
    const full = rate(botView("7h 5d 4c 3s 2h", "abattage", "9h 9d 9c Ks Kd"));
    const quads = rate(botView("7h 5d 4c 3s 2h", "abattage", "9h 9d 9c 9s Kd"));
    expect(pair).toBeLessThan(0.06);
    expect(trips).toBeGreaterThan(0.24);
    expect(trips).toBeLessThan(0.36);
    expect(full).toBeGreaterThan(0.58);
    expect(full).toBeLessThan(0.72);
    expect(quads).toBeGreaterThan(0.8);
    // Il ne démasque pas une main qu'il bat déjà : cela ne lui rapporterait rien.
    expect(rate(botView("As Ks Qs Js Ts", "abattage", "9h 9d 9c 9s Kd"))).toBe(0);
    // À tapis, une accusation fausse ne coûte rien : un doute suffit.
    const allIn = botView("7h 5d 4c 3s 2h", "abattage", "9h 9d 9c Ks 2d", 20, [1000, 10]);
    expect(allIn.seats[1]!.stack).toBe(0);
    expect(botAccuse(allIn, "difficile", always(999_999))).toBe(0);
    expect(botAccuse(botView("7h 5d 4c 3s 2h", "abattage", "9h 9d Ac 5s 2d", 20, [1000, 10]), "difficile", always(0))).toBeNull();
  });

  it("deux adversaires montrent la même carte : pour le robot difficile, l'un des deux au moins a triché", () => {
    const rng = rngOf(58);
    let t = createTable({ code: "ABCDE", kind: "privee", place: null, blind: 10, maxBuyIn: 1000, seats: 3, bots: ["hector"], difficulty: "difficile" }, T0);
    for (const i of [0, 1]) {
      t = sit(t, { playerId: IDS[i]!, sid: `s_${i}`, pseudo: `J${i}`, species: "chat", look: null }, T0, rng);
      t = deposit(t, `s_${i}`, 1, 1000, T0, rng);
    }
    t = act(t, "p_a", { type: "lancer" }, T0, rng);
    // Deux paires chez l'un et chez l'autre, avec le même as de pique ; le robot (siège 2) n'a rien.
    const s = copy(withHands(t, { 0: "As Ad 7c 7h 2d", 1: "As Kd Kc 4h 4c", 2: "9h 5d 4s 3s 2h" }));
    s.phase = "abattage";
    for (const p of s.hand!.players) p.chosen = true;
    const view = viewOfSeat(s, 2, T0);
    let accused = 0;
    for (let i = 0; i < 2_000; i++) if (botAccuse(view, "difficile", rng) !== null) accused += 1;
    // Deux paires seules ne l'inquiètent guère (5 %) ; la carte en double, beaucoup (60 %).
    expect(accused / 2_000).toBeGreaterThan(0.53);
    expect(accused / 2_000).toBeLessThan(0.67);
    // Les robots plus simples n'y voient rien.
    expect(botAccuse(view, "normal", always(0))).toBeNull();
  });

  it("un robot n'accuse jamais que des adversaires encore en jeu", () => {
    const side = rngOf(59);
    let checked = 0;
    for (let seed = 501; seed <= 520; seed++) {
      randomGame(seed, {
        step: (t, now) => {
          if (t.phase !== "abattage") return;
          for (const p of t.hand!.players) {
            if (p.folded || t.seats[p.seat]?.bot === null) continue;
            const view = viewOfSeat(t, p.seat, now);
            for (const level of LEVELS) {
              const target = botAccuse(view, level, side);
              checked += 1;
              if (target !== null) expect(view.options.accuse.includes(target) || p.spoke).toBe(true);
              if (target !== null) expect(target).not.toBe(p.seat);
            }
          }
        },
      }, { bots: 4, steps: 200 });
    }
    expect(checked).toBeGreaterThan(1_000);
  });

  it("à la table, les robots jouent avec un délai d'une à trois secondes et sans rien savoir des cartes cachées", () => {
    const rng = rngOf(60);
    let t = dealt({ stacks: [1000], bots: ["gaspard", "ondine", "hector"], difficulty: "difficile" }, rng);
    const delays = t.hand!.players.filter((p) => t.seats[p.seat]!.bot !== null).map((p) => p.actAt! - T0);
    expect(delays).toHaveLength(3);
    for (const d of delays) {
      expect(d).toBeGreaterThanOrEqual(BOT_MIN_MS);
      expect(d).toBeLessThanOrEqual(BOT_MAX_MS);
    }
    // Trois secondes plus tard, tous les robots ont choisi ; l'humain, pas encore.
    t = advance(t, T0 + BOT_MAX_MS, rng);
    expect(t.phase).toBe("triche");
    expect(t.hand!.players.map((p) => p.chosen)).toEqual([true, true, true, false]);
  });
});

describe("tables de la maison et défis", () => {
  it("l'échelle des blindes : 1, 2, 5, 10… jusqu'à 1 000 Md€", () => {
    expect(BLIND_LADDER.slice(0, 7)).toEqual([1, 2, 5, 10, 20, 50, 100]);
    expect(BLIND_LADDER[BLIND_LADDER.length - 1]).toBe(1_000_000_000_000);
    expect(BLIND_LADDER).toHaveLength(37);
    expect([...BLIND_LADDER].sort((a, b) => a - b)).toEqual([...BLIND_LADDER]);
    expect(BLIND_LADDER.every((b) => Number.isSafeInteger(b) && isBlind(b))).toBe(true);
    for (const bad of [0, 3, 15, 2_000_000_000_000, "10", null, 1.5]) expect(isBlind(bad)).toBe(false);
  });

  it("la blinde ne dépasse pas le quarantième de la bourse", () => {
    expect(allowedBlinds(0)).toEqual([]);
    expect(allowedBlinds(39)).toEqual([]);
    expect(allowedBlinds(40)).toEqual([1]);
    expect(allowedBlinds(79)).toEqual([1]);
    expect(allowedBlinds(80)).toEqual([1, 2]);
    expect(allowedBlinds(399)).toEqual([1, 2, 5]);
    expect(allowedBlinds(400)).toEqual([1, 2, 5, 10]);
    expect(allowedBlinds(40_000_000_000_000)).toEqual([...BLIND_LADDER]);
    expect(allowedBlinds(Number.MAX_SAFE_INTEGER)).toEqual([...BLIND_LADDER]);
  });

  it("une table par lieu : la blinde est le prix du ticket le moins cher, la difficulté monte avec le lieu", () => {
    expect(PLACES.map((p) => [p.id, placeBlind(p.id), difficultyOf(p.id)])).toEqual([
      ["kiosque", 1, "facile"], ["cafe", 10, "facile"], ["casino", 100, "normal"], ["salon", 10_000, "normal"],
      ["cercle", 1_000_000, "difficile"], ["yacht", 100_000_000, "difficile"],
      ["banque", 5_000_000_000, "difficile"], ["lune", 250_000_000_000, "difficile"],
    ]);
    for (const place of PLACES) {
      const blind = cheapestTicket(place.id).price;
      expect(houseOf(place.id)).toEqual({
        place: place.id, host: place.host, blind, minBuyIn: 20 * blind, maxBuyIn: 100 * blind, difficulty: difficultyOf(place.id),
      });
      // Un défi : 30 blindes chacun, et 100 blindes de cagnotte.
      expect(challengeOf(place.id)).toEqual({
        place: place.id, host: place.host, blind, buyIn: 30 * blind, bonus: 100 * blind, difficulty: difficultyOf(place.id),
      });
      expect(BOT_PERSONAS).toContain(place.host);
    }
  });

  it("les robots portent les noms des personnages du jeu", () => {
    expect([...BOT_PERSONAS].sort()).toEqual([
      "archibald", "auguste", "balthazar", "baron", "colette", "enzo", "gaspard", "hector", "ondine", "selene", "sidonie", "taupin",
    ]);
    const rng = rngOf(70);
    for (let i = 0; i < 200; i++) {
      const n = 1 + (rng() % 5);
      const picked = pickPersonas(n, rng);
      expect(picked).toHaveLength(n);
      expect(new Set(picked).size).toBe(n);
      expect(picked.every((id) => BOT_PERSONAS.includes(id))).toBe(true);
      // L'hôte d'un lieu ouvre la liste, et n'y figure qu'une fois.
      const hosted = pickPersonas(3, rng, "hector");
      expect(hosted[0]).toBe("hector");
      expect(new Set(hosted).size).toBe(3);
    }
    expect(pickPersonas(0, rng)).toEqual([]);
    expect(pickPersonas(12, rng)).toHaveLength(12);
  });

  it("le code d'une table : cinq caractères sans ambiguïté", () => {
    const rng = rngOf(71);
    const codes = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const code = newTableCode(rng);
      expect(code).toHaveLength(5);
      expect([...code].every((ch) => CODE_ALPHABET.includes(ch))).toBe(true);
      expect(normalizeTableCode(code)).toBe(code);
      codes.add(code);
    }
    expect(codes.size).toBeGreaterThan(495);
    expect(normalizeTableCode("abcde")).toBe("ABCDE");
    expect(normalizeTableCode(" ab-cd e ")).toBe("ABCDE");
    for (const bad of ["ABCD", "ABCDEF", "ABCD0", "ABCDI", "ABCDO", "", 12345, null, undefined]) expect(normalizeTableCode(bad)).toBeNull();
  });

  /** Un défi au Kiosque : 30 € chacun, blinde de 1 €. Le joueur est au siège 0, l'hôte au siège 1. */
  function challenge(rng: Random32): TableState {
    const def = challengeOf("kiosque");
    let t = createTable({ code: "ABCDE", kind: "defi", place: "kiosque", blind: def.blind, maxBuyIn: def.buyIn, seats: 2, bots: [def.host], difficulty: def.difficulty }, T0);
    t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rng);
    return deposit(t, "s_0", 1, def.buyIn, T0, rng);
  }

  it("un défi : un tête-à-tête, 30 blindes chacun, qui part dès que la cave est posée", () => {
    const rng = rngOf(72);
    const t = challenge(rng);
    expect(t).toMatchObject({ kind: "defi", place: "kiosque", blind: 1, minBuyIn: 30, maxBuyIn: 30, difficulty: "facile", started: true, phase: "triche", handNo: 1 });
    expect(t.seats.map((s) => [s!.bot, s!.stack])).toEqual([[null, 29], ["gaspard", 29]]);
    expect(t.audit).toEqual({ in: 30, out: 0, bank: 30 });
    // Pas besoin de lancer, et personne ne recave.
    expect(refusal(() => act(t, "p_a", { type: "lancer" }, T0, rng))).toBe("ACTION_IMPOSSIBLE");
    expect(rebuyRange(t, 0)).toBeNull();
    expect(viewFor(t, "p_a", T0).options).toMatchObject({ start: false, rebuy: null, cheat: true });
  });

  it("dans un défi, la blinde double de palier en palier : quatre mains, quatre, quatre, puis deux par deux", () => {
    expect([...CHALLENGE_LEVEL_HANDS]).toEqual([4, 4, 4, 2]);
    expect(Array.from({ length: 22 }, (_, i) => challengeBlind(1, i + 1))).toEqual([
      1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 8, 8, 16, 16, 32, 32, 64, 64, 64, 64,
    ]);
    // Elle cesse de monter quand elle dépasse tout l'argent en jeu (deux caves de 30 blindes).
    for (const hand of [19, 25, 100, 1_000_000]) expect(challengeBlind(1, hand)).toBe(64);
    expect([challengeBlind(1, 0), challengeBlind(1, -3)]).toEqual([1, 1]);
    // À la Lune comme au Kiosque, et toujours en euros entiers.
    const lune = challengeOf("lune").blind;
    expect(Array.from({ length: 19 }, (_, i) => challengeBlind(lune, i + 1) / lune)).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 8, 8, 16, 16, 32, 32, 64]);
    expect(Number.isSafeInteger(challengeBlind(lune, 99))).toBe(true);
    // La prochaine hausse : à quelle main, et combien.
    expect([1, 4, 5, 8, 9, 12, 13, 14, 15, 17, 18].map((hand) => challengeRise(1, hand))).toEqual([
      { hand: 5, blind: 2 }, { hand: 5, blind: 2 }, { hand: 9, blind: 4 }, { hand: 9, blind: 4 },
      { hand: 13, blind: 8 }, { hand: 13, blind: 8 }, { hand: 15, blind: 16 }, { hand: 15, blind: 16 },
      { hand: 17, blind: 32 }, { hand: 19, blind: 64 }, { hand: 19, blind: 64 },
    ]);
    for (const hand of [19, 20, 500]) expect(challengeRise(1, hand)).toBeNull();
    // La cave et la cagnotte se comptent toujours en blindes de base.
    expect(challengeOf("kiosque")).toMatchObject({ blind: 1, buyIn: 30, bonus: 100 });
    // Ailleurs que dans un défi, la blinde d'une table ne bouge jamais.
    const table = dealt({ stacks: [500, 500], blind: 5 });
    expect([1, 5, 13, 40].map((hand) => blindAt(table, hand))).toEqual([5, 5, 5, 5]);
    expect([viewFor(table, "p_a", T0).blind, viewFor(table, "p_a", T0).rise, table.hand!.blind]).toEqual([5, null, 5]);
  });

  /**
   * Un défi arrêté entre deux mains (cas d'école) : `played` mains ont été jouées, il reste
   * `mine` au joueur, `host` à l'hôte, et `carry` sur la table. La main suivante part à T0.
   */
  function challengeAt(rng: Random32, played: number, mine: number, host: number, carry = 0): TableState {
    const s = copy(challenge(rng));
    s.hand = null;
    s.phase = "denouement";
    s.nextAt = T0;
    s.handNo = played;
    s.carry = carry;
    s.seats[0]!.stack = mine;
    s.seats[1]!.stack = host;
    // Ce que les deux tapis et le pot resté là ont de plus que la cave du joueur vient de l'hôte.
    s.audit.bank = mine + host + carry - 30;
    audited(s);
    return s;
  }

  /** Les robots ont choisi et ne diront rien : on fait passer leurs étapes à la main. */
  function hostSilent(t: TableState): TableState {
    const s = copy(t);
    for (const p of s.hand!.players) {
      if (s.seats[p.seat]!.bot === null) continue;
      p.chosen = true;
      p.spoke = s.phase === "abattage";
      p.actAt = null;
    }
    return s;
  }

  it("la vue d'un défi donne la blinde en vigueur et la main où elle montera", () => {
    const rng = rngOf(77);
    // Première main : la blinde de base ; elle doublera à la cinquième.
    const first = viewFor(challenge(rng), "p_a", T0);
    expect([first.handNo, first.blind, first.rise, first.minBuyIn, first.maxBuyIn]).toEqual([1, 1, { hand: 5, blind: 2 }, 30, 30]);
    // Entre la quatrième et la cinquième main, la vue annonce déjà la blinde de la main qui vient.
    const between = challengeAt(rng, 4, 30, 30);
    expect([viewFor(between, "p_a", T0).blind, viewFor(between, "p_a", T0).rise]).toEqual([2, { hand: 9, blind: 4 }]);
    let t = advance(between, T0, rng);
    expect([t.handNo, t.hand!.blind, t.hand!.pot, stacksOf(t)]).toEqual([5, 2, 4, [28, 28]]);
    expect(t.log.filter((e) => e.hand === 5 && e.kind === "blinde").map((e) => e.amount)).toEqual([2, 2]);
    expect(t.blind).toBe(1);
    let view = viewFor(t, "p_a", T0);
    expect([view.blind, view.rise, view.seats.map((s) => s!.committed)]).toEqual([2, { hand: 9, blind: 4 }, [2, 2]]);
    // La mise et la relance minimales suivent la blinde en vigueur.
    t = act(hostSilent(t), "p_a", { type: "franc-jeu" }, T0, rng);
    expect([t.phase, t.hand!.turn]).toEqual(["encheres", 0]);
    expect(viewFor(t, "p_a", T0).options).toMatchObject({ check: true, bet: { min: 2, max: 4 } });
    expect(refusal(() => act(t, "p_a", { type: "miser", amount: 1 }, T0, rng))).toBe("ACTION_IMPOSSIBLE");
    // Plus loin : 8 à la treizième main, 16 à la quinzième ; à la dix-neuvième, elle ne monte plus.
    view = viewFor(advance(challengeAt(rng, 12, 30, 30), T0, rng), "p_a", T0);
    expect([view.handNo, view.blind, view.rise, view.pot]).toEqual([13, 8, { hand: 15, blind: 16 }, 16]);
    view = viewFor(advance(challengeAt(rng, 18, 30, 30), T0, rng), "p_a", T0);
    expect([view.handNo, view.blind, view.rise]).toEqual([19, 64, null]);
    // La blinde dépasse les deux tapis : chacun pose tout ce qu'il a.
    expect([view.pot, view.seats.map((s) => [s!.stack, s!.committed, s!.allIn])]).toEqual([60, [[0, 30, true], [0, 30, true]]]);
  });

  it("qui n'a plus de quoi payer la blinde pose ce qui lui reste et joue sa main à tapis", () => {
    const rng = rngOf(78);
    // Treizième main, blinde de 8 : il reste 5 au joueur, 55 à l'hôte.
    let t = advance(challengeAt(rng, 12, 5, 55), T0, rng);
    expect([t.handNo, t.phase, t.hand!.blind, t.hand!.pot, stacksOf(t)]).toEqual([13, "triche", 8, 13, [0, 47]]);
    expect(t.log.filter((e) => e.hand === 13 && e.kind === "blinde").map((e) => [e.seat, e.amount, e.allIn ?? false]).sort()).toEqual([[0, 5, true], [1, 8, false]]);
    expect(viewFor(t, "p_a", T0).seats.map((s) => [s!.committed, s!.allIn])).toEqual([[5, true], [8, false]]);
    expect(viewFor(t, "p_a", T0).options.cheat).toBe(true);
    audited(t);
    // Pas d'enchères : un seul des deux a encore des jetons. Ce que l'hôte a posé de trop lui revient.
    t = withHands(hostSilent(t), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c" });
    t = act(t, "p_a", { type: "franc-jeu" }, T0, rng);
    expect([t.phase, t.hand!.pot, stacksOf(t)]).toEqual(["abattage", 10, [0, 50]]);
    expect(t.hand!.players.map((p) => [p.seat, p.committed, p.bet, p.allIn]).sort()).toEqual([[0, 5, 0, true], [1, 5, 0, false]]);
    expect(t.log.find((e) => e.hand === 13 && e.kind === "rendu")).toMatchObject({ seat: 1, amount: 3 });
    expect(t.log.some((e) => e.hand === 13 && ["parole", "mise", "suit", "relance", "couche"].includes(e.kind))).toBe(false);
    audited(t);
    // Il gagne : son tapis double, et le duel continue.
    const won = act(hostSilent(t), "p_a", { type: "rien" }, T0, rng);
    expect([won.phase, stacksOf(won)]).toEqual(["denouement", [10, 50]]);
    expect(won.result).toMatchObject({ pots: [{ amount: 10, winners: [{ seat: 0, amount: 10 }] }], net: expect.arrayContaining([{ seat: 0, amount: 5 }, { seat: 1, amount: -5 }]) });
    const next = advance(won, T0 + RESULT_MS, rng);
    expect([next.phase, next.handNo, next.hand!.blind, stacksOf(next)]).toEqual(["triche", 14, 8, [2, 42]]);
    audited(next);
    // Il perd : cette fois il n'a plus rien, le défi est fini.
    const losing = withHands(hostSilent(advance(challengeAt(rng, 12, 5, 55), T0, rng)), { 0: "Kc Kd 9s 4h 3c", 1: "As Ad 7c 5h 2d" });
    let lost = act(losing, "p_a", { type: "franc-jeu" }, T0, rng);
    lost = act(hostSilent(lost), "p_a", { type: "rien" }, T0, rng);
    expect(stacksOf(lost)).toEqual([0, 60]);
    lost = advance(lost, T0 + RESULT_MS, rng);
    expect([lost.phase, lost.closed]).toEqual(["fermee", "defi"]);
    expect(lost.ended).toMatchObject([{ payout: 0, reason: "defi-perdu" }]);
    audited(lost);
  });

  it("l'hôte aussi pose ce qui lui reste, et l'accusateur à tapis ne risque rien", () => {
    const rng = rngOf(79);
    // Quinzième main, blinde de 16 : il reste 6 à l'hôte.
    let t = advance(challengeAt(rng, 14, 54, 6), T0, rng);
    expect([t.hand!.blind, t.hand!.pot, stacksOf(t)]).toEqual([16, 22, [38, 0]]);
    t = withHands(hostSilent(t), { 0: "Kc Kd 9s 4h 3c", 1: "As Ad 7c 5h 2d" });
    t = act(t, "p_a", { type: "franc-jeu" }, T0, rng);
    // Dix reviennent au joueur : l'hôte n'a pu en suivre que six.
    expect([t.phase, t.hand!.pot, stacksOf(t)]).toEqual(["abattage", 12, [48, 0]]);
    // L'hôte, à tapis, accuse à tort : il n'a plus rien pour payer.
    const s = hostSilent(t);
    s.hand!.players.find((p) => p.seat === 1)!.accuse = 0;
    const done = act(s, "p_a", { type: "rien" }, T0, rng);
    expect(done.result!.accusations).toEqual([{ from: 1, to: 0, right: false, paid: 0 }]);
    expect(stacksOf(done)).toEqual([48, 12]);
    audited(done);
  });

  it("les deux à court devant une blinde énorme : tout part au milieu, le pot resté là compris", () => {
    const rng = rngOf(80);
    // Dix-neuvième main, blinde de 64. Il reste 3 et 5 ; 52 attendent sur la table depuis la main d'avant.
    let t = advance(challengeAt(rng, 18, 3, 5, 52), T0, rng);
    expect([t.hand!.blind, t.hand!.pot, t.carry, stacksOf(t)]).toEqual([64, 60, 0, [0, 0]]);
    t = withHands(hostSilent(t), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c" });
    t = act(t, "p_a", { type: "franc-jeu" }, T0, rng);
    // Deux de trop chez l'hôte lui reviennent ; le joueur prétend au reste.
    expect([t.phase, t.hand!.pot, stacksOf(t)]).toEqual(["abattage", 58, [0, 2]]);
    t = act(hostSilent(t), "p_a", { type: "rien" }, T0, rng);
    expect(stacksOf(t)).toEqual([58, 2]);
    // L'hôte a encore deux euros : le duel n'est pas fini, il les posera à la main suivante.
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.phase, t.handNo, stacksOf(t), t.hand!.pot]).toEqual(["triche", 20, [0, 0], 60]);
    t = withHands(hostSilent(t), { 0: "As Ad 7c 5h 2d", 1: "Kc Kd 9s 4h 3c" });
    t = act(t, "p_a", { type: "franc-jeu" }, T0 + RESULT_MS, rng);
    expect([t.hand!.pot, stacksOf(t)]).toEqual([4, [56, 0]]);
    t = act(hostSilent(t), "p_a", { type: "rien" }, T0 + RESULT_MS, rng);
    t = advance(t, T0 + 2 * RESULT_MS, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "defi"]);
    expect(t.ended).toMatchObject([{ payout: 60, reason: "defi-gagne" }]);
    audited(t);
  });

  it("un euro suffit pour rester dans le duel ; à une table ordinaire, il faut toujours la blinde entière", () => {
    const rng = rngOf(81);
    // Cinquième main, blinde de 2 : le joueur n'a qu'un euro. Il n'est pas éliminé d'office.
    const t = advance(challengeAt(rng, 4, 1, 59), T0, rng);
    expect([t.phase, t.handNo, stacksOf(t)]).toEqual(["triche", 5, [0, 57]]);
    expect(playerInHand(t, 0)).toMatchObject({ committed: 1, allIn: true });
    // Sans rien du tout, en revanche, le défi est fini.
    const over = advance(challengeAt(rng, 4, 0, 60), T0, rng);
    expect([over.phase, over.closed, over.ended[0]!.reason]).toEqual(["fermee", "defi", "defi-perdu"]);
    // À une table d'un joueur, rien n'a changé : qui n'a pas la blinde n'est pas servi.
    const table = dealt({ stacks: [1000, 9, 1000] });
    expect(playerInHand(table, 1)).toBeNull();
    expect(table.hand!.players.map((p) => p.committed)).toEqual([10, 10]);
  });

  it("un défi finit toujours à la table, avec un tapis à zéro, en une quinzaine de mains", () => {
    type Style = "passif" | "craintif" | "pousse";
    const lengths: number[] = [];
    const outcomes = new Map<string, number>();
    for (const difficulty of ["facile", "normal", "difficile"] as Difficulty[]) {
      for (const style of ["passif", "craintif", "pousse"] as Style[]) {
        for (let seed = 1; seed <= 25; seed++) {
          const rng = rngOf(9_000 + seed);
          const def = challengeOf("cafe");
          let t = createTable({ code: "ABCDE", kind: "defi", place: "cafe", blind: def.blind, maxBuyIn: def.buyIn, seats: 2, bots: [def.host], difficulty }, T0);
          t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rng);
          t = deposit(t, "s_0", 1, def.buyIn, T0, rng);
          // Le dernier état de la table avant sa fermeture.
          let before = t;
          const move = (next: TableState) => {
            t = next;
            if (t.phase === "fermee") return;
            before = t;
            // L'argent : deux caves, ni plus ni moins, et l'hôte n'en crée pas en cours de route.
            expect(chipsOnTable(t)).toBe(2 * def.buyIn);
            expect(t.audit).toEqual({ in: def.buyIn, out: 0, bank: def.buyIn });
          };
          // `move` change la table derrière le dos du compilateur : on relit sa phase par une fonction.
          const closed = (): boolean => t.phase === "fermee";
          for (let now = T0; now < T0 + 3_600_000 && !closed(); now += 1_000) {
            move(advance(t, now, rng));
            if (closed()) break;
            const o = viewFor(t, "p_a", now).options;
            // Trois joueurs sans malice : l'un suit tout, l'autre se couche à la moindre mise, le dernier mise le pot.
            if (o.cheat) move(act(t, "p_a", { type: "franc-jeu" }, now, rng));
            else if (o.fold && style === "pousse" && o.bet) move(act(t, "p_a", { type: "miser", amount: o.bet.max }, now, rng));
            else if (o.fold && o.check) move(act(t, "p_a", { type: "parole" }, now, rng));
            else if (o.fold) move(act(t, "p_a", style === "craintif" ? { type: "coucher" } : { type: "suivre" }, now, rng));
            else if (o.accuse.length > 0) move(act(t, "p_a", { type: "rien" }, now, rng));
            else if (o.next) move(act(t, "p_a", { type: "suite" }, now, rng));
          }
          expect([difficulty, style, seed, t.phase, t.closed]).toEqual([difficulty, style, seed, "fermee", "defi"]);
          audited(t);
          // Le duel s'est fini à la table : juste avant la fermeture, l'un des deux tapis était à zéro.
          const stacks = before.seats.map((s) => s!.stack);
          expect(Math.min(...stacks)).toBe(0);
          expect(stacks[0]! + stacks[1]! + before.carry).toBe(2 * def.buyIn);
          const { reason, payout } = t.ended[0]!;
          outcomes.set(reason, (outcomes.get(reason) ?? 0) + 1);
          if (before.carry === 0) expect(payout).toBe(reason === "defi-gagne" ? 2 * def.buyIn : 0);
          lengths.push(t.handNo);
        }
      }
    }
    lengths.sort((a, b) => a - b);
    const at = (share: number) => lengths[Math.floor(share * (lengths.length - 1))]!;
    // Une quinzaine de mains, et presque jamais plus de vingt-cinq. Il n'y a pas de maximum
    // absolu : tant que le plus petit tapis gagne ses tapis, le duel continue.
    expect(at(0.5)).toBeGreaterThanOrEqual(12);
    expect(at(0.5)).toBeLessThanOrEqual(18);
    expect(at(0.9)).toBeLessThanOrEqual(21);
    expect(lengths.filter((n) => n > 25).length / lengths.length).toBeLessThan(0.03);
    expect(lengths[lengths.length - 1]!).toBeLessThanOrEqual(60);
    expect(outcomes.get("defi-gagne")).toBeGreaterThan(10);
    expect(outcomes.get("defi-perdu")).toBeGreaterThan(50);
  });

  /** Joue une main du défi où les deux tapis partent au milieu, avec les mains qu'on choisit. */
  function showdownAllIn(rng: Random32, mine: string, host: string, cheat = false, accuse = false): TableState {
    let t = challenge(rng);
    // Cas d'école : on met l'hôte à tapis sur la blinde (son tapis tombe à 0), et le joueur de même.
    const s = copy(withHands(t, { 0: mine, 1: host }));
    for (const p of s.hand!.players) {
      const seat = s.seats[p.seat]!;
      p.committed += seat.stack;
      s.hand!.pot += seat.stack;
      seat.stack = 0;
      p.allIn = true;
      if (s.seats[p.seat]!.bot !== null) {
        // L'hôte a choisi, et il ne dira rien à l'abattage.
        p.chosen = true;
        if (cheat) p.swap = { index: 0, from: "2c" };
      }
    }
    t = act(s, "p_a", cheat ? { type: "tricher", index: 4, card: "Ac" } : { type: "franc-jeu" }, T0, rng);
    expect(t.phase).toBe("abattage");
    const st = copy(t);
    const bot = st.hand!.players.find((p) => p.seat === 1)!;
    bot.spoke = true;
    bot.accuse = accuse ? 0 : null;
    bot.actAt = null;
    return act(st, "p_a", accuse ? { type: "accuser", seat: 1 } : { type: "rien" }, T0, rng);
  }

  it("l'hôte est ruiné : le défi est gagné, la table ferme, le joueur repart avec tout", () => {
    const rng = rngOf(73);
    let t = showdownAllIn(rng, "As Ad 7c 5h 2d", "Kc Kd 9s 4h 3c");
    expect([t.phase, stacksOf(t)]).toEqual(["denouement", [60, 0]]);
    // L'hôte ne recave pas : au moment de donner la main suivante, le défi est fini.
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "defi"]);
    // Avec son tapis, la table lui doit les compteurs de sa séance : une main, un pot.
    expect(t.ended).toEqual([{
      sid: "s_0", playerId: "p_a", seat: 0, payout: 60, received: 30, reason: "defi-gagne", at: T0 + RESULT_MS,
      stats: { hands: 1, pots: 1, unmasked: 0, caught: 0 },
    }]);
    expect(t.audit).toEqual({ in: 30, out: 60, bank: 30 });
    expect(chipsOnTable(t)).toBe(0);
  });

  it("le joueur est ruiné : le défi est perdu", () => {
    const rng = rngOf(74);
    let t = showdownAllIn(rng, "Kc Kd 9s 4h 3c", "As Ad 7c 5h 2d");
    expect(stacksOf(t)).toEqual([0, 60]);
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "defi"]);
    expect(t.ended).toMatchObject([{ playerId: "p_a", payout: 0, received: 30, reason: "defi-perdu" }]);
    // Ce que le joueur a perdu disparaît avec l'hôte.
    expect(t.audit).toEqual({ in: 30, out: 0, bank: -30 });
    expect(chipsOnTable(t)).toBe(0);
  });

  it("tous deux démasqués à tapis : plus personne n'a rien, le pot resté là est partagé", () => {
    const rng = rngOf(75);
    let t = showdownAllIn(rng, "Kc Kd 9s 4h 3c", "As Ad 7c 5h 2d", true, true);
    expect([t.carry, stacksOf(t)]).toEqual([60, [0, 0]]);
    t = advance(t, T0 + RESULT_MS, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "defi"]);
    // Partie nulle : chacun reprend la moitié du pot. La part de l'hôte disparaît avec lui.
    expect(t.ended).toMatchObject([{ playerId: "p_a", payout: 30, reason: "defi-nul" }]);
    expect(t.audit).toEqual({ in: 30, out: 30, bank: 0 });
  });

  it("partir pendant le dénouement de la dernière main ne change pas le résultat du défi", () => {
    const rng = rngOf(84);
    // L'hôte vient d'être ruiné ; la table n'a pas encore fermé, et le joueur s'en va sans attendre.
    const won = showdownAllIn(rng, "As Ad 7c 5h 2d", "Kc Kd 9s 4h 3c");
    expect([won.phase, stacksOf(won)]).toEqual(["denouement", [60, 0]]);
    let t = leave(won, "p_a", T0 + 1_000, rng);
    expect([t.phase, t.closed]).toEqual(["fermee", "defi"]);
    expect(t.ended).toMatchObject([{ playerId: "p_a", payout: 60, reason: "defi-gagne", at: T0 + 1_000 }]);
    expect(t.audit).toEqual({ in: 30, out: 60, bank: 30 });
    // Ruiné lui-même, partir ne rattrape rien non plus ; et un nul reste un nul.
    t = leave(showdownAllIn(rng, "Kc Kd 9s 4h 3c", "As Ad 7c 5h 2d"), "p_a", T0 + 1_000, rng);
    expect([t.closed, t.ended[0]!.reason, t.ended[0]!.payout]).toEqual(["defi", "defi-perdu", 0]);
    t = leave(showdownAllIn(rng, "Kc Kd 9s 4h 3c", "As Ad 7c 5h 2d", true, true), "p_a", T0 + 1_000, rng);
    expect([t.closed, t.ended[0]!.reason, t.ended[0]!.payout]).toEqual(["defi", "defi-nul", 30]);
    // Tant que le duel n'est pas joué, partir reste partir : on reprend son tapis, sans victoire.
    const open = copy(challengeAt(rng, 4, 45, 15));
    open.nextAt = T0 + RESULT_MS;
    t = leave(open, "p_a", T0, rng);
    expect([t.closed, t.ended[0]!.reason, t.ended[0]!.payout]).toEqual(["vide", "quitte", 45]);
    // Absent depuis trois mains au moment où l'hôte tombe : le défi est gagné, pas abandonné.
    const away = copy(won);
    away.seats[0]!.absent = true;
    away.seats[0]!.idle = 3;
    t = advance(away, T0 + RESULT_MS, rng);
    expect([t.closed, t.ended[0]!.reason, t.ended[0]!.payout]).toEqual(["defi", "defi-gagne", 60]);
  });

  it("un défi se joue jusqu'au bout : le tricheur le gagne souvent, le joueur honnête qui mise à l'aveugle rarement", () => {
    const outcomes = new Map<string, number>();
    for (let seed = 1; seed <= 60; seed++) {
      const rng = rngOf(8_000 + seed);
      let t = challenge(rng);
      // Un joueur pressé : il mise ou relance autant que la limite le permet, et suit tout.
      // Une partie sur deux, il est aussi sans scrupule : il se donne la plus belle main possible.
      const cheater = seed % 2 === 1;
      for (let now = T0; now < T0 + 3_600_000 && t.phase !== "fermee"; now += 1_000) {
        t = advance(t, now, rng);
        if (t.phase === "fermee") break;
        const view = viewFor(t, "p_a", now);
        const o = view.options;
        if (o.cheat && cheater) {
          const best = possibleSwaps(view.hand!.cards).sort((a, b) => b.value.score - a.value.score)[0]!;
          t = act(t, "p_a", { type: "tricher", ...best.swap }, now, rng);
        } else if (o.cheat) t = act(t, "p_a", { type: "franc-jeu" }, now, rng);
        else if (o.raise) t = act(t, "p_a", { type: "relancer", amount: o.raise.max }, now, rng);
        else if (o.bet) t = act(t, "p_a", { type: "miser", amount: o.bet.max }, now, rng);
        else if (o.fold) t = act(t, "p_a", o.check ? { type: "parole" } : { type: "suivre" }, now, rng);
        else if (o.accuse.length > 0) t = act(t, "p_a", { type: "rien" }, now, rng);
        // Personne ne recave : il n'y a jamais plus de 60 € en jeu, et l'hôte ne crée rien.
        expect(chipsOnTable(t)).toBe(t.audit.in - t.audit.out + t.audit.bank);
        expect(chipsOnTable(t)).toBeLessThanOrEqual(60);
        if (t.phase !== "fermee") expect(t.audit.bank).toBe(30);
      }
      expect(t.phase).toBe("fermee");
      expect(t.closed).toBe("defi");
      expect(t.ended).toHaveLength(1);
      const { reason, payout } = t.ended[0]!;
      outcomes.set(reason, (outcomes.get(reason) ?? 0) + 1);
      // Le vaincu n'a plus rien : le vainqueur a tout.
      if (reason === "defi-gagne") expect(payout).toBe(60);
      if (reason === "defi-perdu") expect(payout).toBe(0);
      expect(t.handNo).toBeLessThanOrEqual(60);
      expect(["defi-gagne", "defi-perdu", "defi-nul"]).toContain(reason);
    }
    // Contre un hôte facile, qui accuse rarement, le tricheur gagne presque toujours ;
    // le joueur honnête qui mise à l'aveugle, presque jamais.
    expect(outcomes.get("defi-gagne")).toBeGreaterThan(20);
    expect(outcomes.get("defi-perdu")).toBeGreaterThan(15);
  });

  it("une table de la maison : trois robots, la partie part toute seule, un robot à sec recave", () => {
    const rng = rngOf(76);
    const def = houseOf("cafe");
    let t = createTable({ code: "ABCDE", kind: "maison", place: "cafe", blind: def.blind, maxBuyIn: def.maxBuyIn, seats: 4, bots: pickPersonas(3, rng, def.host), difficulty: def.difficulty }, T0);
    expect(t.seats.map((s) => s?.bot ?? null).slice(1, 2)).toEqual(["ondine"]);
    t = sit(t, { playerId: "p_a", sid: "s_0", pseudo: "Ada", species: "chat", look: null }, T0, rng);
    expect(t.phase).toBe("attente");
    t = deposit(t, "s_0", 1, 500, T0, rng);
    expect([t.phase, t.handNo, t.started]).toEqual(["triche", 1, true]);
    expect(t.hand!.players).toHaveLength(4);
    // On ruine un robot à la main : à la main suivante, il a recavé.
    t = checkAroundWithBots(t, rng);
    expect(t.phase).toBe("denouement");
    const broke = copy(t);
    broke.audit.bank -= broke.seats[2]!.stack;
    broke.seats[2]!.stack = 0;
    const next = advance(broke, broke.nextAt!, rng);
    expect(next.handNo).toBe(2);
    expect(next.seats[2]!.stack).toBe(def.maxBuyIn - def.blind);
    expect(next.log.some((e) => e.kind === "cave" && e.seat === 2 && e.amount === def.maxBuyIn)).toBe(true);
    expect(chipsOnTable(next)).toBe(next.audit.in - next.audit.out + next.audit.bank);
  });
});

/** Joue une main contre des robots jusqu'au dénouement : franc jeu, parole ou suivre, rien à dire. */
function leaveToShowdown(start: TableState, rng: Random32): TableState {
  let t = start;
  for (let now = start.clock; now < start.clock + 300_000 && t.phase !== "denouement"; now += 500) {
    t = advance(t, now, rng);
    const o = viewFor(t, "p_a", now).options;
    if (o.cheat) t = act(t, "p_a", { type: "franc-jeu" }, now, rng);
    else if (o.fold) t = act(t, "p_a", o.check ? { type: "parole" } : { type: "suivre" }, now, rng);
    else if (o.accuse.length > 0) t = act(t, "p_a", { type: "rien" }, now, rng);
  }
  return t;
}

/** Laisse les robots finir la main : l'humain joue franc jeu, puis dit parole ou suit. */
function checkAroundWithBots(start: TableState, rng: Random32): TableState {
  let t = start;
  for (let now = T0; now < T0 + 120_000 && t.phase !== "abattage" && t.phase !== "denouement"; now += 500) {
    t = advance(t, now, rng);
    const o = viewFor(t, "p_a", now).options;
    if (o.cheat) t = act(t, "p_a", { type: "franc-jeu" }, now, rng);
    else if (o.fold) t = act(t, "p_a", o.check ? { type: "parole" } : { type: "suivre" }, now, rng);
  }
  // À l'abattage, on laisse passer le délai : les robots parlent, l'humain se tait.
  if (t.phase === "abattage") t = advance(t, t.hand!.deadline, rng);
  return t;
}
