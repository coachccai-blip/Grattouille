// Le Poker Tricheur côté écrans : les calculs purs (qui s'assoit où, les mises proposées,
// les cartes qu'on peut glisser, le récit d'un dénouement), les répliques des personnages
// dans les deux langues, le dictionnaire anglais, et une recette de contrat : tout geste
// que l'écran propose à partir d'une vue est accepté par le vrai serveur.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { handle, type Deps } from "../server/app";
import { MemoryStorage } from "../server/storage";
import { formatEuros } from "../shared/format";
import { PLACES } from "../shared/places";
import {
  ACCUSE_MS, BOT_PERSONAS, CHEAT_MS, DECK, RESULT_MS, TURN_MS, WALKOVER_MS, betOptions, evaluate,
  type HandResult, type PokerAction, type PokerTableResponse, type SeatView, type TableView,
} from "../shared/poker";
import { hostName } from "../src/app/dialogues";
import { setLang, t, type Lang } from "../src/i18n";
import { EN_BOUTIQUES } from "../src/i18n/en/boutiques";
import { EN_JEU } from "../src/i18n/en/jeu";
import { EN_POKER } from "../src/i18n/en/poker";
import { EN_RECIT } from "../src/i18n/en/recit";
import { EN_TICKETS } from "../src/i18n/en/tickets";
import {
  RANKS, SUITS, accusationCost, beatsOf, betChoices, buyInSteps, cleanCode, defaultBuyIn, doubles, freshEntries, isFullCode,
  lineBeats, maxBuyInChoices, neighbours, netOf, outcomeLines, phaseTotal, rankTaken, remainingMs, sidesFor, suitTaken,
  swapped, winnersOf,
} from "../src/screens/poker/calcul";
import {
  HOST_TALK, PIOU_HALL, TABLE_TALK, hostLine, piouHall, tableLine,
  type Bot, type Host, type HostMoment, type TableMoment,
} from "../src/screens/poker/repliques";

// Chaque test repart du français, quoi qu'il arrive dans le précédent.
afterEach(() => setLang("fr"));

const LANGUES: readonly Lang[] = ["fr", "en"];
/** Longueur en caractères, pas en unités UTF-16. */
const len = (s: string) => [...s].length;
const variables = (s: string) => [...new Set(s.match(/\{\w+\}/g) ?? [])].sort();

// ---------------------------------------------------------------------------
// De quoi fabriquer une vue

function seat(index: number, over: Partial<SeatView> = {}): SeatView {
  return {
    seat: index, pseudo: `J${index}`, bot: null, species: "renard", look: null, stack: 100, reserve: 0, funded: true,
    absent: false, inHand: true, folded: false, allIn: false, bet: 0, committed: 1, done: false, cards: null, category: null,
    ...over,
  };
}

/** Le dénouement donné en exemple dans la note de l'API : un tricheur démasqué par le joueur. */
const EXEMPLE: HandResult = {
  no: 1,
  showdown: true,
  hands: [
    { seat: 1, cards: ["Kc", "Kd", "Kh", "4h", "3c"], category: "brelan" },
    { seat: 2, cards: ["6d", "9s", "8s", "7c", "Tc"], category: "suite" },
    { seat: 0, cards: ["As", "Ad", "7c", "5h", "2d"], category: "paire" },
  ],
  accusations: [{ from: 0, to: 1, right: true, paid: 0 }],
  unmasked: [{ seat: 1, index: 2, from: "9s", to: "Kh" }],
  pots: [{ amount: 78, winners: [{ seat: 2, amount: 78 }], carried: false }],
  net: [{ seat: 1, amount: -26 }, { seat: 2, amount: 52 }, { seat: 0, amount: -26 }],
  carry: 0,
  until: 0,
};

// ---------------------------------------------------------------------------

describe("autour du tapis", () => {
  it("les voisins se suivent dans le sens de la table, à partir du voisin du joueur", () => {
    const seats = [seat(0), seat(1), null, seat(3), seat(4), seat(5)];
    expect(neighbours({ seats, you: 3 }).map((n) => n.seat)).toEqual([4, 5, 0, 1, 2]);
    expect(neighbours({ seats, you: 0 }).map((n) => n.seat)).toEqual([1, 2, 3, 4, 5]);
    // Un siège libre garde sa place : un ami peut encore s'y asseoir.
    expect(neighbours({ seats, you: 0 })[1]).toEqual({ seat: 2, who: null });
    // Qui regarde sans être assis voit tous les sièges.
    expect(neighbours({ seats, you: null }).map((n) => n.seat)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(neighbours({ seats: [seat(0), seat(1)], you: 1 }).map((n) => n.seat)).toEqual([0]);
  });

  it("jusqu'à trois voisins en face ; au-delà, le premier et le dernier prennent les côtés", () => {
    expect(sidesFor(0)).toEqual([]);
    expect(sidesFor(1)).toEqual(["haut"]);
    expect(sidesFor(3)).toEqual(["haut", "haut", "haut"]);
    expect(sidesFor(4)).toEqual(["gauche", "haut", "haut", "droite"]);
    expect(sidesFor(5)).toEqual(["gauche", "haut", "haut", "haut", "droite"]);
    // En face, jamais plus de trois : chaque siège garde la place d'un nom.
    for (let n = 0; n <= 5; n++) expect(sidesFor(n).filter((s) => s === "haut").length).toBeLessThanOrEqual(3);
  });
});

describe("la barre de temps", () => {
  it("ce qu'il reste se cale sur l'horloge du serveur", () => {
    // Le serveur a 5 secondes d'avance sur l'appareil.
    expect(remainingMs(120_000, 5_000, 100_000)).toBe(15_000);
    expect(remainingMs(120_000, -5_000, 100_000)).toBe(25_000);
    expect(remainingMs(100_000, 0, 200_000)).toBe(0);
    expect(remainingMs(null, 0, 0)).toBe(0);
  });

  it("la durée entière suit le temps de la main", () => {
    const base = { handNo: 3, result: null };
    expect(phaseTotal({ ...base, phase: "triche" })).toBe(CHEAT_MS);
    expect(phaseTotal({ ...base, phase: "encheres" })).toBe(TURN_MS);
    expect(phaseTotal({ ...base, phase: "abattage" })).toBe(ACCUSE_MS);
    expect(phaseTotal({ ...base, phase: "denouement", result: { ...EXEMPLE, no: 3 } })).toBe(RESULT_MS);
    // Un pot emporté sans abattage se regarde moins longtemps.
    expect(phaseTotal({ ...base, phase: "denouement", result: { ...EXEMPLE, no: 3, showdown: false } })).toBe(WALKOVER_MS);
    // Le résultat d'une main plus ancienne ne compte pas.
    expect(phaseTotal({ ...base, phase: "denouement", result: { ...EXEMPLE, no: 2, showdown: false } })).toBe(RESULT_MS);
    expect(phaseTotal({ ...base, phase: "fermee" })).toBe(0);
  });
});

describe("les mises proposées", () => {
  it("la plus petite, une moyenne, la plus grosse : toutes dans la fourchette", () => {
    const choices = betChoices({ bet: { min: 1, max: 8 }, raise: null, allIn: false });
    expect(choices.map((c) => c.size)).toEqual(["min", "milieu", "pot"]);
    expect(choices.map((c) => c.amount)).toEqual([1, 5, 8]);
    expect(choices.map((c) => c.action)).toEqual([
      { type: "miser", amount: 1 }, { type: "miser", amount: 5 }, { type: "miser", amount: 8 },
    ]);
  });

  it("une relance s'exprime en mise totale, comme le serveur l'attend", () => {
    const choices = betChoices({ bet: null, raise: { min: 4, max: 13 }, allIn: false });
    expect(choices.map((c) => c.action)).toEqual([
      { type: "relancer", amount: 4 }, { type: "relancer", amount: 9 }, { type: "relancer", amount: 13 },
    ]);
  });

  it("quand la plus grosse engage tout le tapis, c'est un tapis", () => {
    const choices = betChoices({ bet: { min: 1, max: 6 }, raise: null, allIn: true });
    expect(choices[choices.length - 1]).toEqual({ size: "tapis", amount: 6, action: { type: "tapis" } });
    // Un tapis plus petit que la mise minimale : un seul choix.
    expect(betChoices({ bet: { min: 3, max: 3 }, raise: null, allIn: true })).toEqual([{ size: "tapis", amount: 3, action: { type: "tapis" } }]);
  });

  it("une fourchette étroite ne propose pas deux fois la même mise", () => {
    expect(betChoices({ bet: { min: 2, max: 2 }, raise: null, allIn: false }).map((c) => c.amount)).toEqual([2]);
    expect(betChoices({ bet: { min: 2, max: 3 }, raise: null, allIn: false }).map((c) => c.amount)).toEqual([2, 3]);
    expect(betChoices({ bet: null, raise: null, allIn: false })).toEqual([]);
    expect(betChoices({ bet: null, raise: null, allIn: true })).toEqual([]);
  });

  it("sur toutes les situations du moteur, chaque mise proposée est permise", () => {
    let checked = 0;
    for (const pot of [2, 4, 9, 30, 200]) {
      for (const bet of [0, 1, 4, 20]) {
        for (const mine of [0, 1, 4]) {
          for (const stack of [1, 3, 10, 80, 1000]) {
            for (const raises of [0, 3]) {
              if (mine > bet) continue;
              const o = betOptions({ pot, bet, raises, blind: 1, mine, stack, rivals: 1 });
              const choices = betChoices(o);
              const range = o.bet ?? o.raise;
              if (!range) {
                expect(choices).toEqual([]);
                continue;
              }
              expect(choices.length).toBeGreaterThan(0);
              expect(choices.length).toBeLessThanOrEqual(3);
              // Des montants croissants, tous différents, tous dans la fourchette.
              const amounts = choices.map((c) => c.amount);
              expect(amounts).toEqual([...new Set(amounts)].sort((a, b) => a - b));
              for (const c of choices) {
                expect(c.amount).toBeGreaterThanOrEqual(range.min);
                expect(c.amount).toBeLessThanOrEqual(range.max);
                if (c.action.type === "tapis") {
                  expect(o.allIn).toBe(true);
                  // Le tapis vaut bien tout ce que le joueur a devant lui.
                  expect(c.amount).toBe(o.bet ? stack : mine + stack);
                } else {
                  expect(c.action.type).toBe(o.bet ? "miser" : "relancer");
                }
              }
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(150);
  });
});

describe("la triche : les cartes qu'on peut glisser", () => {
  const hand = ["Kc", "Kd", "Kh", "4h", "3c"];

  it("treize valeurs de l'as au deux, quatre couleurs", () => {
    expect(RANKS).toEqual(["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]);
    expect(SUITS).toEqual(["s", "h", "d", "c"]);
    // Toutes les cartes du paquet s'écrivent avec ces touches.
    expect(RANKS.flatMap((r) => SUITS.map((s) => `${r}${s}`)).sort()).toEqual([...DECK].sort());
  });

  it("une carte qu'on tient déjà n'est pas offerte", () => {
    // La couleur choisie : la valeur qu'on tient dans cette couleur s'éteint.
    expect(rankTaken(hand, "K", "h")).toBe(true);
    expect(rankTaken(hand, "K", "s")).toBe(false);
    expect(rankTaken(hand, "4", "h")).toBe(true);
    // La valeur choisie : les couleurs qu'on tient s'éteignent.
    expect(SUITS.filter((s) => suitTaken(hand, s, "K"))).toEqual(["h", "d", "c"]);
    expect(SUITS.filter((s) => suitTaken(hand, s, "A"))).toEqual([]);
    // Rien de choisi : tout est offert, sauf une valeur dont on tient les quatre cartes.
    expect(RANKS.filter((r) => rankTaken(hand, r, null))).toEqual([]);
    expect(rankTaken(["7s", "7h", "7d", "7c", "2s"], "7", null)).toBe(true);
    expect(SUITS.filter((s) => suitTaken(hand, s, null))).toEqual([]);
  });

  it("ce que l'écran laisse choisir, le moteur l'accepte : jamais une carte de sa propre main", () => {
    for (const r of RANKS) {
      for (const s of SUITS) {
        const offered = !rankTaken(hand, r, s) && !suitTaken(hand, s, r);
        expect(offered).toBe(!hand.includes(`${r}${s}`));
      }
    }
  });

  it("la main une fois la carte glissée, et ce qu'elle donne", () => {
    const next = swapped(hand, 3, "Ks");
    expect(next.cards).toEqual(["Kc", "Kd", "Kh", "Ks", "3c"]);
    expect(next.category).toBe("carre");
    expect(next.category).toBe(evaluate(next.cards).category);
    // La main d'origine n'est pas touchée.
    expect(hand).toEqual(["Kc", "Kd", "Kh", "4h", "3c"]);
  });
});

describe("l'abattage", () => {
  it("une carte montrée deux fois se repère", () => {
    const twice = doubles([["As", "Kd", "7c", "5h", "2d"], ["As", "Ad", "Ah", "9c", "9d"], ["Kd", "3c", "4c", "5c", "6c"]]);
    expect([...twice].sort()).toEqual(["As", "Kd"]);
    expect(doubles([["As", "Kd"], ["Ah", "Kc"]]).size).toBe(0);
    expect(doubles([]).size).toBe(0);
  });

  it("accuser à tort coûte la mise de l'accusé, dans la limite de son propre tapis", () => {
    expect(accusationCost({ committed: 12 }, { stack: 40 })).toBe(12);
    expect(accusationCost({ committed: 12 }, { stack: 5 })).toBe(5);
    expect(accusationCost({ committed: 12 }, { stack: 0 })).toBe(0);
  });
});

describe("le dénouement", () => {
  it("le récit de l'exemple : un tricheur démasqué, puis le pot", () => {
    expect(outcomeLines(EXEMPLE)).toEqual([
      { kind: "demasque", seat: 1, fake: "Kh", real: "9s", by: [0] },
      { kind: "pot", seat: 2, amount: 78, side: false },
    ]);
    expect(netOf(EXEMPLE, 0)).toBe(-26);
    expect(netOf(EXEMPLE, 2)).toBe(52);
    // Qui n'était pas servi n'a pas de bilan.
    expect(netOf(EXEMPLE, 5)).toBeNull();
    expect(netOf(EXEMPLE, null)).toBeNull();
    expect([...winnersOf(EXEMPLE)]).toEqual([2]);
  });

  it("une accusation à tort, un pot partagé, un pot annexe, un pot qui reste", () => {
    const result: HandResult = {
      ...EXEMPLE,
      accusations: [{ from: 0, to: 2, right: false, paid: 9 }, { from: 2, to: 1, right: true, paid: 0 }, { from: 0, to: 1, right: true, paid: 0 }],
      pots: [
        { amount: 40, winners: [{ seat: 2, amount: 20 }, { seat: 0, amount: 20 }], carried: false },
        { amount: 12, winners: [{ seat: 2, amount: 12 }], carried: false },
        { amount: 6, winners: [], carried: true },
        { amount: 0, winners: [], carried: false },
      ],
    };
    expect(outcomeLines(result)).toEqual([
      { kind: "demasque", seat: 1, fake: "Kh", real: "9s", by: [2, 0] },
      { kind: "tort", from: 0, to: 2, paid: 9 },
      { kind: "partage", seats: [2, 0], amount: 40, side: false },
      { kind: "pot", seat: 2, amount: 12, side: true },
      { kind: "reste", amount: 6 },
    ]);
    expect([...winnersOf(result)].sort()).toEqual([0, 2]);
  });

  it("tout le monde s'est couché : le dernier prend le pot sans montrer ses cartes", () => {
    const walkover: HandResult = {
      no: 4, showdown: false, hands: [], accusations: [], unmasked: [],
      pots: [{ amount: 6, winners: [{ seat: 3, amount: 6 }], carried: false }],
      net: [{ seat: 3, amount: 4 }, { seat: 0, amount: -2 }], carry: 0, until: 0,
    };
    expect(outcomeLines(walkover)).toEqual([{ kind: "seul", seat: 3, amount: 6 }]);
    expect(beatsOf(walkover).map((b) => b.kind)).toEqual(["pots"]);
  });

  it("une accusation seule a son moment : le cri, le verdict, puis le pot", () => {
    const beats = beatsOf(EXEMPLE);
    expect(beats.map((b) => [b.kind, b.seat])).toEqual([["accuse", 1], ["verdict", 1], ["pots", -1]]);
    const lines = outcomeLines(EXEMPLE);
    // Le démasqué se lit avec son verdict, le pot avec le dernier battement.
    expect(lineBeats(lines, beats)).toEqual([1, 2]);
  });

  it("plusieurs accusés : un verdict chacun, et le tout tient en quatre secondes et demie", () => {
    for (let n = 2; n <= 5; n++) {
      const result: HandResult = {
        ...EXEMPLE,
        accusations: Array.from({ length: n }, (_, i) => ({ from: (i + 1) % 6, to: i, right: false, paid: 1 })),
        unmasked: [],
      };
      const beats = beatsOf(result);
      expect(beats.map((b) => b.kind)).toEqual([...Array.from({ length: n }, () => "verdict"), "pots"]);
      expect(beats.reduce((sum, b) => sum + b.ms, 0)).toBeLessThanOrEqual(4_500);
      const lines = outcomeLines(result);
      // Chaque accusation à tort se lit avec le verdict de son accusé, jamais avant.
      lineBeats(lines, beats).forEach((beat, i) => {
        const line = lines[i]!;
        if (line.kind === "tort") expect(beats[beat]).toMatchObject({ kind: "verdict", seat: line.to });
        else expect(beats[beat]!.kind).toBe("pots");
      });
    }
    // Deux accusateurs pour un même accusé : un seul moment.
    const both: HandResult = { ...EXEMPLE, accusations: [{ from: 0, to: 1, right: true, paid: 0 }, { from: 2, to: 1, right: true, paid: 0 }] };
    expect(beatsOf(both).map((b) => b.kind)).toEqual(["accuse", "verdict", "pots"]);
  });
});

describe("les caves", () => {
  it("de dix blindes en dix blindes, bornes comprises, sans dépasser la bourse", () => {
    expect(buyInSteps(20, 100, 1, 1_000)).toEqual([20, 30, 40, 50, 60, 70, 80, 90, 100]);
    // La bourse s'arrête entre deux crans : tout ce qu'elle permet est proposé aussi.
    expect(buyInSteps(20, 100, 1, 45)).toEqual([20, 30, 40, 45]);
    expect(buyInSteps(20, 100, 1, 20)).toEqual([20]);
    expect(buyInSteps(20, 100, 1, 19)).toEqual([]);
    expect(buyInSteps(200, 1_000, 10, 260_000)).toEqual([200, 300, 400, 500, 600, 700, 800, 900, 1_000]);
    // Une recave : de ce qui manque pour la cave minimale à ce qui manque pour la maximale.
    expect(buyInSteps(8, 88, 1, 500)).toEqual([8, 10, 20, 30, 40, 50, 60, 70, 80, 88]);
  });

  it("la cave proposée d'abord : cinquante blindes, ou ce qui s'en approche sans les dépasser", () => {
    expect(defaultBuyIn(buyInSteps(20, 100, 1, 1_000), 1)).toBe(50);
    expect(defaultBuyIn(buyInSteps(20, 100, 1, 45), 1)).toBe(45);
    expect(defaultBuyIn(buyInSteps(20, 100, 1, 20), 1)).toBe(20);
    expect(defaultBuyIn([], 1)).toBeNull();
  });

  it("les caves maximales d'une table : de 20 à 100 blindes", () => {
    expect(maxBuyInChoices(10)).toEqual([200, 400, 600, 800, 1_000]);
  });
});

describe("le code d'une table", () => {
  it("ce qu'on tape devient un code : capitales, sans espace ni tiret, cinq caractères", () => {
    expect(cleanCode("frbqx")).toBe("FRBQX");
    expect(cleanCode(" fr-bq x ")).toBe("FRBQX");
    expect(cleanCode("FRBQXYZ")).toBe("FRBQX");
    // Les caractères ambigus ne font pas partie de l'alphabet des codes : 0, 1, I, L, O, U.
    expect(cleanCode("o0i1lu")).toBe("");
    expect(isFullCode(cleanCode("frbq"))).toBe(false);
    expect(isFullCode(cleanCode("frbqx"))).toBe(true);
  });
});

describe("le journal de la table", () => {
  const log = Array.from({ length: 30 }, (_, i) => ({ n: i + 11 }));

  it("on ne montre que ce qui est arrivé depuis la dernière vue", () => {
    expect(freshEntries(log, 38).map((e) => e.n)).toEqual([39, 40]);
    expect(freshEntries(log, 40)).toEqual([]);
    expect(freshEntries([], 0)).toEqual([]);
  });

  it("après une longue pause, seule la fin se rejoue", () => {
    expect(freshEntries(log, 0).map((e) => e.n)).toEqual([29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]);
    expect(freshEntries(log, 0, 3).map((e) => e.n)).toEqual([38, 39, 40]);
  });
});

// ---------------------------------------------------------------------------

describe("les répliques des personnages, dans les deux langues", () => {
  const BOTS = Object.keys(TABLE_TALK) as Bot[];
  const HOSTS = Object.keys(HOST_TALK) as Host[];
  const MOMENTS: readonly TableMoment[] = ["accuse", "demasque", "innocent", "gagne"];
  const HOST_MOMENTS: readonly HostMoment[] = ["defi", "revanche", "ruine", "ruine-encore", "vainqueur"];
  /** À table : deux lignes au-dessus des cartes, sur un téléphone de 320 px. */
  const MAX_TABLE = 70;
  /** Dans le hall et à la fin d'un défi : une bulle de trois lignes. */
  const MAX_HOST = 110;

  it("un personnage par robot du moteur, un hôte par lieu", () => {
    expect([...BOTS].sort()).toEqual([...BOT_PERSONAS].sort());
    expect([...HOSTS].sort()).toEqual(PLACES.map((p) => p.host).sort());
  });

  it("chaque personnage a ses quatre moments, deux variantes chacun, de même forme dans les deux langues", () => {
    for (const bot of BOTS) {
      for (const moment of MOMENTS) {
        const fr = TABLE_TALK[bot].fr[moment];
        const en = TABLE_TALK[bot].en[moment];
        expect([bot, moment, fr.length]).toEqual([bot, moment, 2]);
        expect([bot, moment, en.length]).toEqual([bot, moment, 2]);
        // Un geste en français reste un geste en anglais.
        fr.forEach((line, i) => expect([bot, moment, i, en[i]!.startsWith("~")]).toEqual([bot, moment, i, line.startsWith("~")]));
      }
    }
  });

  it("à table, une réplique tient sur deux lignes : 70 caractères au plus", () => {
    const tooLong: string[] = [];
    for (const bot of BOTS) {
      for (const langue of LANGUES) {
        for (const moment of MOMENTS) {
          for (const line of TABLE_TALK[bot][langue][moment]) {
            if (len(line.replace(/^~\s*/, "")) > MAX_TABLE) tooLong.push(`${bot}.${langue}.${moment} : ${line}`);
          }
        }
      }
    }
    expect(tooLong).toEqual([]);
  });

  it("un défi, une ruine : 110 caractères au plus, cagnotte comprise", () => {
    const tooLong: string[] = [];
    for (const host of HOSTS) {
      for (const langue of LANGUES) {
        setLang(langue);
        // La plus longue somme qu'un hôte puisse remettre : celle de la Lune.
        const cagnotte = formatEuros(25_000_000_000_000);
        for (const moment of HOST_MOMENTS) {
          const line = HOST_TALK[host][langue][moment].replace("{cagnotte}", cagnotte);
          if (len(line) > MAX_HOST) tooLong.push(`${host}.${langue}.${moment} (${len(line)}) : ${line}`);
        }
      }
    }
    setLang("fr");
    expect(tooLong).toEqual([]);
  });

  it("la cagnotte s'annonce avec sa somme quand l'hôte est ruiné, et nulle part ailleurs", () => {
    for (const host of HOSTS) {
      for (const langue of LANGUES) {
        for (const moment of HOST_MOMENTS) {
          const expected = moment === "ruine" ? ["{cagnotte}"] : [];
          expect([host, langue, moment, variables(HOST_TALK[host][langue][moment])]).toEqual([host, langue, moment, expected]);
        }
      }
    }
    for (const bot of BOTS) {
      for (const langue of LANGUES) {
        for (const moment of MOMENTS) for (const line of TABLE_TALK[bot][langue][moment]) expect(variables(line)).toEqual([]);
      }
    }
  });

  it("pas de guillemets dans une réplique (la bulle pose les siens), ni d'espace au bord", () => {
    const all = [
      ...BOTS.flatMap((bot) => LANGUES.flatMap((l) => MOMENTS.flatMap((m) => [...TABLE_TALK[bot][l][m]]))),
      ...HOSTS.flatMap((host) => LANGUES.flatMap((l) => HOST_MOMENTS.map((m) => HOST_TALK[host][l][m]))),
      ...Object.values(PIOU_HALL).flatMap((deux) => [deux.fr, deux.en]),
    ];
    expect(all.filter((line) => /[«»“”"]/.test(line))).toEqual([]);
    expect(all.filter((line) => line !== line.trim() || /\s{2}/.test(line))).toEqual([]);
    // L'anglais s'affiche tel quel : pas d'espace insécable à la française.
    const english = [
      ...BOTS.flatMap((bot) => MOMENTS.flatMap((m) => [...TABLE_TALK[bot].en[m]])),
      ...HOSTS.flatMap((host) => HOST_MOMENTS.map((m) => HOST_TALK[host].en[m])),
    ];
    expect(english.filter((line) => /[  ]| [!?:;]/.test(line))).toEqual([]);
  });

  it("en anglais, la cagnotte d'un hôte est « the kitty » : « purse » est la bourse du joueur", () => {
    const english = HOSTS.flatMap((host) => HOST_MOMENTS.map((m) => HOST_TALK[host].en[m]));
    expect(english.filter((line) => /\bpurse\b/i.test(line))).toEqual([]);
    expect(HOSTS.filter((host) => !/kitty/.test(HOST_TALK[host].en.ruine))).toEqual([]);
    expect(HOSTS.filter((host) => !/cagnotte/.test(HOST_TALK[host].fr.ruine))).toEqual([]);
  });

  it("chacun garde sa voix : Hmpf, Hou, Vroum, ravissant, la maison, la moustache", () => {
    const all = (bot: Bot, langue: Lang) => MOMENTS.flatMap((m) => [...TABLE_TALK[bot][langue][m]]).join(" ");
    expect(all("baron", "fr")).toMatch(/Hmpf/);
    expect(all("baron", "en")).toMatch(/Hmph/);
    expect(all("archibald", "fr")).toMatch(/Hou/);
    expect(all("archibald", "en")).toMatch(/Hoo/);
    expect(all("enzo", "fr")).toMatch(/Vroum|Vrrr/);
    expect(all("enzo", "en")).toMatch(/Vroom|Vrrr/);
    expect(all("colette", "fr")).toMatch(/[Rr]avissant/);
    expect(all("colette", "en")).toMatch(/[Dd]ivine/);
    expect(all("hector", "fr")).toMatch(/La maison/);
    expect(all("hector", "en")).toMatch(/The house/);
    expect(all("auguste", "fr")).toMatch(/moustache/);
    expect(all("auguste", "en")).toMatch(/moustache/);
    // Gaspard change de sujet : la mouette.
    expect(all("gaspard", "fr")).toMatch(/mouette/);
    expect(all("gaspard", "en")).toMatch(/seagull/);
    // Les hôtes vouvoient ; Gaspard, lui, ne s'adresse à personne (il tutoie les uns, vouvoie les autres).
    const words = (text: string) => text.toLowerCase().split(/[^\p{L}]+/u);
    const gaspard = words([...HOST_MOMENTS.map((m) => HOST_TALK.gaspard.fr[m]), all("gaspard", "fr")].join(" "));
    expect(gaspard.filter((w) => ["tu", "te", "toi", "ton", "ta", "tes", "vous", "votre", "vos"].includes(w))).toEqual([]);
    for (const host of HOSTS.filter((h) => h !== "gaspard")) {
      const said = words(HOST_MOMENTS.map((m) => HOST_TALK[host].fr[m]).join(" "));
      expect([host, said.filter((w) => ["tu", "te", "toi", "ton", "ta", "tes"].includes(w))]).toEqual([host, []]);
    }
  });

  it("dire une réplique : dans la langue du jeu, le geste sans son tilde, la cagnotte à sa place", () => {
    expect(tableLine("hector", "accuse", 0)).toEqual({ speaker: "hector", name: "Hector", text: "La maison ne triche pas. Elle arrondit.", gesture: false });
    expect(tableLine("hector", "accuse", 1)).toEqual({ speaker: "hector", name: "Hector", text: "Hector hausse un sourcil. Le gauche.", gesture: true });
    // La graine choisit la variante, et ne déborde jamais.
    expect(tableLine("hector", "accuse", 7)?.text).toBe(tableLine("hector", "accuse", 1)?.text);
    expect(tableLine("hector", "accuse", -3)?.text).toBe(tableLine("hector", "accuse", 1)?.text);
    // Un joueur n'a pas de réplique.
    expect(tableLine(null, "gagne")).toBeNull();
    expect(tableLine("zoe", "gagne")).toBeNull();
    expect(hostLine("gaspard", "ruine", "100 €")?.text).toBe("Sapristi ! Plumé à mon propre comptoir. La cagnotte est là : 100 €. Bien joué !");
    expect(hostLine("sidonie", "defi")).toBeNull();
    expect(piouHall("fauche", "20 €")).toBe("Il vous faut 20 € pour vous asseoir. Un ticket ou deux, et à table !");
    setLang("en");
    expect(tableLine("baron", "gagne", 0)).toEqual({ speaker: "baron", name: "The Baron", text: "Hmph. Nice pot. I am not crying.", gesture: false });
    expect(hostLine("gaspard", "ruine", "€100")?.text).toBe("Blimey! Fleeced at my own counter. Here's the kitty: €100. Well played!");
    expect(piouHall("fauche", "€20")).toBe("You need €20 to take a seat. A ticket or two, and you're at the table!");
    expect(hostName("balthazar")).toBe("The Commodore");
  });
});

// ---------------------------------------------------------------------------

describe("le dictionnaire anglais du poker", () => {
  const entries = Object.entries(EN_POKER).map(([fr, en]) => ({ fr, en }));
  const OTHERS: Record<string, string> = { ...EN_RECIT, ...EN_JEU, ...EN_BOUTIQUES, ...EN_TICKETS };
  const root = fileURLToPath(new URL("..", import.meta.url));

  /** Les phrases passées à t("…") dans un fichier, et celles de ses tables de constantes. */
  function keysOf(source: string): string[] {
    const out: string[] = [];
    for (const m of source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) out.push(JSON.parse(`"${m[1]}"`) as string);
    return out;
  }

  function used(): string[] {
    const dir = `${root}src/screens/poker/`;
    const files = [...readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).map((f) => dir + f), `${root}src/app/poker.ts`];
    const keys = files.flatMap((file) => keysOf(readFileSync(file, "utf8")));
    // Les tables de constantes de ces écrans : leurs phrases passent par t() à l'affichage.
    keys.push(
      "Chacun paie la blinde, puis reçoit cinq cartes.",
      "En secret, tu peux remplacer une de tes cartes par celle de ton choix, ou jouer franc jeu.",
      "Un seul tour d'enchères : parole, mise, relance jusqu'à la hauteur du pot, ou tu te couches.",
      "À l'abattage, les mains se montrent et chacun peut accuser un joueur : un tricheur démasqué perd sa mise, et sa main ne compte plus.",
      "Accuser à tort coûte la mise de l'accusé, que tu lui verses ; puis la meilleure main encore en jeu prend le pot.",
      "Carte haute", "Paire", "Deux paires", "Brelan", "Suite", "Couleur", "Full", "Carré", "Quinte flush",
      "facile", "normal", "difficile", "mini", "milieu", "pot", "tapis", "pique", "cœur", "carreau", "trèfle",
      "Trois mains sans jouer : ta place a été libérée.",
      "Trois mains sans pouvoir payer la blinde : ta place a été libérée.",
      "Ta cave n'est pas arrivée à temps : ta place a été libérée.",
      "La table s'est endormie : trente minutes sans un geste, elle a fermé.",
      "La table a fermé : il y avait trop d'argent sur le tapis pour compter juste.",
      "Match nul : plus personne n'a de quoi continuer.",
    );
    // La porte du poker sur la Promenade, et les échecs du serveur traduits par le magasin d'état.
    const promenade = readFileSync(`${root}src/screens/promenade/Promenade.tsx`, "utf8");
    keys.push(...keysOf(promenade.slice(promenade.indexOf("lieu--poker"))));
    const store = readFileSync(`${root}src/app/store.ts`, "utf8");
    const failures = store.slice(store.indexOf("// Le Poker Tricheur (traduits"), store.indexOf("};", store.indexOf("// Le Poker Tricheur (traduits")));
    for (const m of failures.matchAll(/:\s*"((?:[^"\\]|\\.)*)"/g)) keys.push(JSON.parse(`"${m[1]}"`) as string);
    return [...new Set(keys)];
  }

  it("chaque phrase des écrans du poker a sa traduction", () => {
    const keys = used();
    // Le relevé a bien trouvé les écrans : il y a plus de deux cents phrases.
    expect(keys.length).toBeGreaterThan(200);
    expect(keys.filter((key) => !(key in EN_POKER) && !(key in OTHERS))).toEqual([]);
  });

  it("le dictionnaire ne garde aucune phrase que les écrans n'emploient plus", () => {
    const keys = new Set(used());
    expect(Object.keys(EN_POKER).filter((key) => !keys.has(key))).toEqual([]);
  });

  it("les tables de constantes relevées à la main sont bien celles des écrans", () => {
    const sources = ["Feuilles.tsx", "Table.tsx", "textes.ts"].map((f) => readFileSync(`${root}src/screens/poker/${f}`, "utf8")).join("\n");
    for (const phrase of ["Chacun paie la blinde, puis reçoit cinq cartes.", "Quinte flush", "Match nul : plus personne n'a de quoi continuer.", "milieu"]) {
      expect(sources).toContain(`"${phrase}"`);
    }
    // Cinq phrases de règles, pas une de plus.
    const rules = sources.slice(sources.indexOf("const REGLES = ["), sources.indexOf("] as const;", sources.indexOf("const REGLES = [")));
    expect(rules.match(/^ {2}"/gm)?.length).toBe(5);
  });

  it("t() trouve chaque phrase, et aucune ne contredit un autre dictionnaire", () => {
    setLang("en");
    expect(entries.filter((e) => t(e.fr) !== e.en).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => e.fr in OTHERS && OTHERS[e.fr] !== e.en).map((e) => e.fr)).toEqual([]);
  });

  it("une traduction n'emploie que les variables de sa phrase française, et toutes", () => {
    expect(entries.filter((e) => variables(e.en).join() !== variables(e.fr).join()).map((e) => `${e.fr} → ${e.en}`)).toEqual([]);
  });

  it("guillemets anglais, aucune traduction vide, pas d'espace à la française", () => {
    expect(entries.filter((e) => /[«»]/.test(e.en)).map((e) => e.en)).toEqual([]);
    expect(entries.filter((e) => e.en.trim() === "" || e.en !== e.en.trim()).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => /[  ]| [!?;:]/.test(e.en)).map((e) => e.en)).toEqual([]);
    expect(entries.filter((e) => (e.en.match(/“/g) ?? []).length !== (e.en.match(/”/g) ?? []).length).map((e) => e.en)).toEqual([]);
  });

  it("les mots du jeu : la cagnotte est « kitty », la bourse reste « purse », la cave « buy-in »", () => {
    expect(entries.filter((e) => /cagnotte/i.test(e.fr) && !/kitty/i.test(e.en)).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => /\bbourse\b/i.test(e.fr) && !/purse/i.test(e.en)).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => /\bcave\b/i.test(e.fr) && !/buy-in/i.test(e.en)).map((e) => e.fr)).toEqual([]);
    expect(EN_POKER["Le Poker Tricheur"]).toBe("Cheater's Poker");
  });

  it("un bouton sur une ligne reste sur une ligne : pas plus de six caractères de plus que le français", () => {
    const buttons = [
      "Jouer franc jeu", "Rien à dire", "Main suivante", "Se coucher", "Parole", "Recaver", "Créer la table", "Voir la table",
      "Lancer la partie", "Quitter la table", "Rester à table", "Retour au hall", "Reprendre ma place", "Créer une table",
      "Rejoindre avec un code", "Tricheur !", "Je suis là", "Partager", "Finalement, non", "Fin du défi",
    ];
    for (const fr of buttons) {
      expect([fr, fr in EN_POKER]).toEqual([fr, true]);
      expect([fr, len(EN_POKER[fr]!) <= len(fr) + 6]).toEqual([fr, true]);
    }
  });
});

// ---------------------------------------------------------------------------
// Le contrat : ce que l'écran propose à partir d'une vue, le vrai serveur l'accepte

describe("les gestes proposés par l'écran sont ceux que le serveur accepte", () => {
  function makeWorld(seed: number) {
    const storage = new MemoryStorage();
    let now = Date.UTC(2026, 10, 26, 21, 0, 0);
    let x = seed >>> 0 || 1;
    const next = () => {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return x >>> 0;
    };
    const deps: Deps = { storage, context: "test", adminKey: null, now: () => now, random32: next };
    async function call<T>(method: string, path: string, body?: unknown, auth?: string): Promise<{ status: number; body: T }> {
      const headers: Record<string, string> = {};
      if (auth) headers.authorization = `Bearer ${auth}`;
      if (body !== undefined) headers["content-type"] = "application/json";
      const res = await handle(new Request(`https://grattouille.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), deps);
      return { status: res.status, body: (await res.json()) as T };
    }
    return { storage, call, tick: (ms: number) => { now += ms; }, pick: (n: number) => next() % n };
  }

  /** Le geste qu'un joueur ferait en touchant, au hasard, l'un des boutons que l'écran lui montre. */
  function tap(view: TableView, pick: (n: number) => number): PokerAction | null {
    const o = view.options;
    if (o.back) return { type: "retour" };
    if (view.phase === "triche" && o.cheat && view.hand) {
      if (pick(3) === 0) return { type: "franc-jeu" };
      // La feuille de triche : une place, puis une valeur et une couleur que les touches laissent choisir.
      const index = pick(5);
      const ranks = RANKS.filter((r) => !rankTaken(view.hand!.cards, r, null));
      const rank = ranks[pick(ranks.length)]!;
      const suits = SUITS.filter((s) => !suitTaken(view.hand!.cards, s, rank));
      return { type: "tricher", index, card: `${rank}${suits[pick(suits.length)]!}` };
    }
    if (view.phase === "encheres" && o.fold) {
      const choices = betChoices(o);
      const buttons: PokerAction[] = [{ type: "coucher" }, o.check ? { type: "parole" } : { type: "suivre" }, ...choices.map((c) => c.action)];
      return buttons[pick(buttons.length)]!;
    }
    if (view.phase === "abattage" && o.accuse.length > 0) {
      return pick(2) === 0 ? { type: "rien" } : { type: "accuser", seat: o.accuse[pick(o.accuse.length)]! };
    }
    if (view.phase === "denouement" && o.next) return { type: "suite" };
    return null;
  }

  async function play(kind: "maison" | "defi", seed: number, hands: number) {
    const w = makeWorld(seed);
    const created = await w.call<{ playerId: string; code: string }>("POST", "/api/players", { pseudo: `Zoe${seed}`, species: "renard" });
    const auth = `${created.body.playerId}.${created.body.code}`;
    w.storage.poke(created.body.playerId, (p) => { p.balance = 5_000; });
    const body = kind === "maison" ? { maison: "kiosque", buyIn: 100 } : { defi: "kiosque" };
    const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", body, auth);
    expect(opened.status).toBe(201);
    let view = opened.body.view!;
    const refused: string[] = [];
    const seen = new Set<string>();
    let left: PokerTableResponse["left"];
    for (let step = 0; step < 4_000 && view.handNo <= hands && !left; step++) {
      const action = tap(view, w.pick);
      if (action) {
        seen.add(action.type);
        const r = await w.call<PokerTableResponse & { error?: { code: string } }>("POST", "/api/poker/act", { code: view.code, action, step: view.step }, auth);
        if (r.status !== 200) refused.push(`main ${view.handNo}, ${view.phase} : ${JSON.stringify(action)} → ${r.body.error?.code}`);
        else if (r.body.view) view = r.body.view;
        left = r.body.left;
        // Une recave quand le tapis ne couvre plus la blinde : la fourchette offerte est acceptée.
        if (!left && view.options.rebuy && view.seats[view.you!]!.stack < view.blind) {
          const amount = view.options.rebuy.max;
          const rebuy = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: view.code, action: { type: "recaver", amount } }, auth);
          if (rebuy.status !== 200) refused.push(`recave de ${amount} refusée`);
          else view = rebuy.body.view!;
        }
        continue;
      }
      // Rien à faire : le temps passe, et la relecture fait avancer la table.
      w.tick(1_000);
      const r = await w.call<PokerTableResponse | { unchanged: true }>("GET", `/api/poker/table?code=${view.code}&v=${view.version}`, undefined, auth);
      if ("unchanged" in r.body) continue;
      if (r.body.view) view = r.body.view;
      left = r.body.left;
    }
    return { refused, seen, left, view };
  }

  it("à une table de la maison : triche, enchères, accusations, suite, sur une trentaine de mains", async () => {
    const all = new Set<string>();
    for (const seed of [11, 2026, 77_777]) {
      const { refused, seen } = await play("maison", seed, 12);
      expect(refused).toEqual([]);
      for (const type of seen) all.add(type);
    }
    // Tous les boutons de l'écran ont servi au moins une fois.
    for (const type of ["tricher", "franc-jeu", "parole", "suivre", "coucher", "miser", "relancer", "accuser", "rien", "suite"]) {
      expect([type, all.has(type)]).toEqual([type, true]);
    }
  });

  it("dans un défi, jusqu'au bout : la blinde monte, et le duel finit à la table", async () => {
    for (const seed of [5, 404]) {
      const { refused, left, view } = await play("defi", seed, 80);
      expect(refused).toEqual([]);
      // Le défi s'est joué jusqu'à son dénouement : gagné, perdu ou nul.
      expect(left && ["defi-gagne", "defi-perdu", "defi-nul"].includes(left.reason)).toBe(true);
      expect(view.phase).toBe("fermee");
    }
  });
});
