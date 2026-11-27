// Le Poker Tricheur côté écrans : les calculs purs (qui s'assoit où, les mises proposées,
// les cartes qu'on peut glisser, le récit d'un dénouement), les répliques des personnages
// dans les deux langues, le dictionnaire anglais, et une recette de contrat : tout geste
// que l'écran propose à partir d'une vue est accepté par le vrai serveur.
//
// Et la Table des Maîtres (LOT4.md, section 5) : sa carte dans le hall (fermée, ouverte,
// bourse trop courte, serveur plus ancien), ses sièges éliminés, ses trois fins, les mots
// des huit maîtres, et une table jouée jusqu'au bout contre le vrai serveur.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { handle, type Deps } from "../server/app";
import { MemoryStorage } from "../server/storage";
import { NBSP, THIN, formatEuros } from "../shared/format";
import { PLACES } from "../shared/places";
import {
  ACCUSE_MS, BOT_PERSONAS, CHEAT_MS, DECK, MASTERS_BLIND, MASTERS_BUYIN, MASTERS_SEATS, RESULT_MS, TURN_MS, WALKOVER_MS,
  betOptions, evaluate,
  type HandResult, type LobbyMasters, type PokerAction, type PokerLobbyResponse, type PokerTableResponse, type SeatView,
  type TableView,
} from "../shared/poker";
import { hostName } from "../src/app/dialogues";
import { setLang, t, type Lang } from "../src/i18n";
import { EN_BOUTIQUES } from "../src/i18n/en/boutiques";
import { EN_JEU } from "../src/i18n/en/jeu";
import { EN_POKER } from "../src/i18n/en/poker";
import { EN_RECIT } from "../src/i18n/en/recit";
import { EN_TICKETS } from "../src/i18n/en/tickets";
import {
  RANKS, SUITS, accusationCost, beatsOf, betChoices, buyInSteps, challengesWon, cleanCode, defaultBuyIn, doubles, fallenSeats,
  freshEntries, isFullCode, lineBeats, mastersCard, mastersLeft, maxBuyInChoices, neighbours, netOf, outcomeLines, phaseTotal,
  rankTaken, remainingMs, sidesFor, suitTaken, swapped, tournamentDecided, winnersOf,
} from "../src/screens/poker/calcul";
import {
  HOST_TALK, MASTERS_TALK, PIOU_HALL, TABLE_TALK, hostLine, mastersLine, piouHall, tableLine,
  type Bot, type Host, type HostMoment, type MastersMoment, type TableMoment,
} from "../src/screens/poker/repliques";
import {
  isMastersEnd, mastersEnding, mastersLeftText, seatStateText, tableTitle, type MastersEnd,
} from "../src/screens/poker/textes";

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
// La Table des Maîtres

/** Ce que le hall rend de la Table des Maîtres, comme le serveur le fabrique. */
function masters(over: Partial<LobbyMasters> = {}): LobbyMasters {
  return { open: false, defis: 0, blind: MASTERS_BLIND, buyIn: MASTERS_BUYIN, won: 0, affordable: false, ...over };
}

/** Huit défis, dont les `won` premiers sont relevés. */
const challenges = (won: number) => PLACES.map((_, i) => ({ won: i < won }));

describe("la Table des Maîtres, dans le hall", () => {
  it("« Défis relevés : N sur 8 » : le serveur le dit ; à défaut, on compte les défis relevés", () => {
    expect(challengesWon({ masters: masters({ defis: 5 }), challenges: challenges(5) })).toEqual({ won: 5, total: 8 });
    // Un serveur plus ancien ne rend pas `masters` : le compte se fait sur les défis eux-mêmes.
    expect(challengesWon({ challenges: challenges(3) })).toEqual({ won: 3, total: 8 });
    expect(challengesWon({ masters: null, challenges: challenges(8) })).toEqual({ won: 8, total: 8 });
    expect(challengesWon({ challenges: challenges(0) })).toEqual({ won: 0, total: 8 });
    // Jamais plus que ce qu'il y a à relever, jamais moins que rien.
    expect(challengesWon({ masters: masters({ defis: 12 }), challenges: challenges(8) }).won).toBe(8);
    expect(challengesWon({ masters: masters({ defis: -1 }), challenges: challenges(0) }).won).toBe(0);
  });

  it("fermée tant qu'il reste un maître à ruiner : elle se devine, avec le compte", () => {
    const card = mastersCard({ masters: masters({ defis: 5 }), challenges: challenges(5) }, 5_000_000);
    expect(card).toMatchObject({ open: false, defis: 5, total: 8, won: 0 });
    // Un joueur qui débarque la voit déjà, à zéro.
    expect(mastersCard({ masters: masters(), challenges: challenges(0) }, 0)).toMatchObject({ open: false, defis: 0, total: 8 });
  });

  it("ouverte : dix billions de blinde, trois cents de cave, et le palmarès", () => {
    const lobby = { masters: masters({ open: true, defis: 8, won: 2, affordable: true }), challenges: challenges(8) };
    const card = mastersCard(lobby, 900_000_000_000_000)!;
    expect(card).toEqual({ open: true, defis: 8, total: 8, blind: MASTERS_BLIND, buyIn: MASTERS_BUYIN, won: 2, short: 0 });
    // Les montants s'écrivent avec formatEuros, dans les deux langues.
    expect([formatEuros(card.blind), formatEuros(card.buyIn)]).toEqual([`10${NBSP}Bn€`, `300${NBSP}Bn€`]);
    setLang("en");
    expect([formatEuros(card.blind), formatEuros(card.buyIn)]).toEqual(["€10T", "€300T"]);
    expect(t("Tu l'as remportée {n} fois", { n: card.won })).toBe("You've won it 2 times");
    // La cave tout juste : elle suffit.
    expect(mastersCard(lobby, MASTERS_BUYIN)!.short).toBe(0);
  });

  it("la bourse ne suffit pas : la carte dit ce qu'il manque, au plus juste", () => {
    const lobby = { masters: masters({ open: true, defis: 8 }), challenges: challenges(8) };
    expect(mastersCard(lobby, 5_000_000)!.short).toBe(MASTERS_BUYIN - 5_000_000);
    expect(mastersCard(lobby, MASTERS_BUYIN - 1)!.short).toBe(1);
    expect(mastersCard(lobby, 0)!.short).toBe(MASTERS_BUYIN);
    // La bourse affichée compte les tickets grattés pas encore déclarés : c'est elle qui décide, pas `affordable`.
    expect(mastersCard({ ...lobby, masters: masters({ open: true, defis: 8, affordable: false }) }, MASTERS_BUYIN)!.short).toBe(0);
    expect(t("Il te manque {montant}.", { montant: formatEuros(mastersCard(lobby, 250_000_000_000_000)!.short) })).toBe(`Il te manque 50${NBSP}Bn€.`);
    setLang("en");
    expect(t("Il te manque {montant}.", { montant: formatEuros(mastersCard(lobby, 250_000_000_000_000)!.short) })).toBe("You're €50T short.");
  });

  it("un serveur plus ancien ne rend pas `masters` : pas de carte", () => {
    expect(mastersCard({ challenges: challenges(8) }, 900_000_000_000_000)).toBeNull();
    expect(mastersCard({ masters: null, challenges: challenges(8) }, 900_000_000_000_000)).toBeNull();
    // Le hall d'un vrai serveur d'avant ce lot : mêmes champs, sans `masters`.
    const old = { seat: null, blinds: [], houses: [], challenges: challenges(2) } as unknown as PokerLobbyResponse;
    expect(mastersCard({ masters: old.masters ?? null, challenges: old.challenges }, 0)).toBeNull();
    expect(challengesWon({ masters: old.masters ?? null, challenges: old.challenges })).toEqual({ won: 2, total: 8 });
  });

  it("des valeurs de travers ne cassent pas la carte", () => {
    const odd = mastersCard({ masters: masters({ open: true, defis: 8, won: Number.NaN, blind: -5, buyIn: -1 }), challenges: challenges(8) }, 10)!;
    expect(odd).toMatchObject({ won: 0, blind: 0, buyIn: 0, short: 0 });
  });
});

describe("la Table des Maîtres, à la table", () => {
  /** Cinq sièges : le joueur au siège 0, et quatre maîtres. */
  const table = (over: Partial<Record<number, Partial<SeatView>>> = {}) => [
    seat(0, { stack: 300, ...over[0] }),
    ...["hector", "baron", "selene", "gaspard"].map((bot, i) => seat(i + 1, { pseudo: null, bot, species: null, stack: 300, ...over[i + 1] })),
  ];

  it("son titre, dans les deux langues", () => {
    expect(tableTitle({ kind: "maitres", place: null, code: "FRBQX" })).toBe("Table des Maîtres");
    setLang("en");
    expect(tableTitle({ kind: "maitres", place: null, code: "FRBQX" })).toBe("Masters' Table");
  });

  it("combien de maîtres sont encore assis", () => {
    expect(mastersLeft({ seats: table() })).toEqual({ left: 4, of: 4 });
    expect(mastersLeft({ seats: table({ 2: { out: true, stack: 0 }, 4: { out: true, stack: 0 } }) })).toEqual({ left: 2, of: 4 });
    // Le joueur ne compte pas parmi les maîtres, éliminé ou non.
    expect(mastersLeft({ seats: table({ 0: { out: true, stack: 0 } }) })).toEqual({ left: 4, of: 4 });
    // Une table fermée n'a plus personne à ses sièges.
    expect(mastersLeft({ seats: [null, null, null, null, null] })).toEqual({ left: 0, of: 0 });
    expect(mastersLeftText(3)).toBe("3 maîtres assis");
    expect(mastersLeftText(1)).toBe("Plus qu'un maître");
    expect(mastersLeftText(0)).toBe("");
    setLang("en");
    expect(mastersLeftText(4)).toBe("4 masters seated");
    expect(mastersLeftText(1)).toBe("One master left");
  });

  it("un siège éliminé ne dit plus que cela, quoi qu'il ait fait avant", () => {
    const view = { started: true, hand: null, phase: "encheres" as const };
    const out = seat(2, { bot: "baron", out: true, stack: 0, inHand: false });
    expect(seatStateText(out, view)).toBe("éliminé");
    // Ni « couché », ni « absent », ni « attend » : éliminé passe devant.
    expect(seatStateText({ ...out, folded: true, absent: true, allIn: true }, view)).toBe("éliminé");
    // Les autres sièges gardent leurs mots.
    expect(seatStateText(seat(1, { folded: true }), view)).toBe("couché");
    expect(seatStateText(seat(1, { allIn: true }), view)).toBe("à tapis");
    expect(seatStateText(seat(1, { absent: true }), view)).toBe("absent");
    expect(seatStateText(seat(1, { funded: false }), view)).toBe("arrive…");
    expect(seatStateText(seat(1), view)).toBeNull();
    setLang("en");
    expect(seatStateText(out, view)).toBe("knocked out");
    expect(t("{nom} : éliminé", { nom: hostName("baron") })).toBe("The Baron: knocked out");
  });

  it("les sièges que la main vient d'éliminer : ceux qui y jouaient, et n'ont plus rien", () => {
    const result: HandResult = { ...EXEMPLE, no: 7, net: [{ seat: 0, amount: 300 }, { seat: 1, amount: -300 }, { seat: 3, amount: 0 }] };
    const view = { kind: "maitres" as const, phase: "denouement" as const, handNo: 7, result, seats: table({ 1: { out: true, stack: 0 }, 2: { out: true, stack: 0 } }) };
    // Hector (siège 1) tombe à cette main ; le Baron (siège 2) était déjà éliminé : il n'y jouait pas.
    expect(fallenSeats(view)).toEqual([1]);
    // Hors du dénouement de cette main, ou à une autre table : personne.
    expect(fallenSeats({ ...view, phase: "triche" })).toEqual([]);
    expect(fallenSeats({ ...view, handNo: 8 })).toEqual([]);
    expect(fallenSeats({ ...view, kind: "maison" })).toEqual([]);
    expect(fallenSeats({ ...view, result: null })).toEqual([]);
  });

  it("le tournoi est joué quand le joueur n'a plus rien, ou plus aucun maître", () => {
    expect(tournamentDecided({ kind: "maitres", you: 0, seats: table() })).toBe(false);
    expect(tournamentDecided({ kind: "maitres", you: 0, seats: table({ 1: { stack: 0, out: true }, 2: { stack: 0, out: true }, 3: { stack: 0, out: true } }) })).toBe(false);
    expect(tournamentDecided({ kind: "maitres", you: 0, seats: table({ 0: { stack: 1500 }, 1: { stack: 0 }, 2: { stack: 0 }, 3: { stack: 0 }, 4: { stack: 0 } }) })).toBe(true);
    expect(tournamentDecided({ kind: "maitres", you: 0, seats: table({ 0: { stack: 0 } }) })).toBe(true);
    // Un défi se juge de la même façon ; une table ordinaire, jamais.
    expect(tournamentDecided({ kind: "defi", you: 0, seats: [seat(0), seat(1, { bot: "gaspard", stack: 0 })] })).toBe(true);
    expect(tournamentDecided({ kind: "defi", you: 0, seats: [seat(0), seat(1, { bot: "gaspard" })] })).toBe(false);
    expect(tournamentDecided({ kind: "maison", you: 0, seats: table({ 0: { stack: 0 } }) })).toBe(false);
    expect(tournamentDecided({ kind: "maitres", you: null, seats: table() })).toBe(false);
  });

  it("ses trois fins : gagnée, perdue, quittée", () => {
    const ENDS: readonly MastersEnd[] = ["maitres-gagne", "maitres-perdu", "quitte"];
    for (const reason of ENDS) expect(isMastersEnd(reason)).toBe(true);
    for (const reason of ["defi-gagne", "defi-perdu", "absent", "inactive", "banque", null, undefined] as const) expect(isMastersEnd(reason)).toBe(false);

    const all = MASTERS_BUYIN * MASTERS_SEATS;
    const won = mastersEnding("maitres-gagne", all);
    // Cinq caves : tout l'argent de la table. « 1 500 Bn€ », avec ses espaces insécables.
    expect(won).toEqual({ titre: "La table est à toi !", texte: `Tu remportes 1${THIN}500${NBSP}Bn€.`, somme: "Tu remportes" });
    const lost = mastersEnding("maitres-perdu", 0);
    expect(lost.titre).toBe("Les maîtres gardent la table");
    // Digne, et une invitation à revenir : pas de somme à fêter, pas de chiffre du tout.
    expect(lost.somme).toBeNull();
    expect(lost.texte).toMatch(/reviens quand tu veux/);
    expect(lost.texte).not.toMatch(/\d/);
    const quit = mastersEnding("quitte", 287_350_000_000_000);
    expect(quit).toEqual({
      titre: "Tu te lèves de table",
      texte: `Tu repars avec ton tapis, 287,35${NBSP}Bn€, sans la victoire. La table rouvre quand tu veux.`,
      somme: null,
    });
    expect(mastersEnding("quitte", 0).texte).toBe("Tu repars sans la victoire. La table rouvre quand tu veux.");

    setLang("en");
    expect(mastersEnding("maitres-gagne", all)).toEqual({ titre: "The table is yours!", texte: "You win €1,500T.", somme: "You win" });
    expect(mastersEnding("maitres-perdu", 0).titre).toBe("The masters keep the table");
    expect(mastersEnding("maitres-perdu", 0).texte).toMatch(/come back whenever you like/);
    expect(mastersEnding("quitte", 287_350_000_000_000).texte).toBe(
      "You leave with your stack, €287.35T, but without the win. The table reopens whenever you like.",
    );
    // Aucune des trois fins ne reste en français.
    for (const reason of ENDS) {
      const fr = (setLang("fr"), mastersEnding(reason, all));
      const en = (setLang("en"), mastersEnding(reason, all));
      expect([reason, en.titre !== fr.titre, en.texte !== fr.texte]).toEqual([reason, true, true]);
    }
  });
});

describe("les mots des huit maîtres à la Table des Maîtres, dans les deux langues", () => {
  const HOSTS = Object.keys(MASTERS_TALK) as Host[];
  const MOMENTS: readonly MastersMoment[] = ["assis", "elimine", "victoire", "defaite"];
  /** À table et sur le panneau de la victoire (quatre maîtres d'un coup) : deux lignes. Raccompagner le joueur : une bulle. */
  const MAX: Record<MastersMoment, number> = { assis: 70, elimine: 70, victoire: 70, defaite: 110 };
  const lines = (langue: Lang) => HOSTS.flatMap((host) => MOMENTS.map((m) => MASTERS_TALK[host][langue][m]));

  it("les huit hôtes, pas un de plus : c'est parmi eux que la tablée est tirée", () => {
    expect([...HOSTS].sort()).toEqual(PLACES.map((p) => p.host).sort());
    expect([...HOSTS].sort()).toEqual((Object.keys(HOST_TALK) as Host[]).sort());
  });

  it("chacun a ses quatre moments, de même forme dans les deux langues", () => {
    for (const host of HOSTS) {
      for (const langue of LANGUES) expect([host, langue, Object.keys(MASTERS_TALK[host][langue]).sort()]).toEqual([host, langue, [...MOMENTS].sort()]);
      // Un geste en français reste un geste en anglais.
      for (const m of MOMENTS) expect([host, m, MASTERS_TALK[host].en[m].startsWith("~")]).toEqual([host, m, MASTERS_TALK[host].fr[m].startsWith("~")]);
    }
  });

  it("chaque mot tient dans sa place : 70 caractères à table, 110 pour raccompagner le joueur", () => {
    const tooLong: string[] = [];
    for (const host of HOSTS) {
      for (const langue of LANGUES) {
        for (const m of MOMENTS) {
          const line = MASTERS_TALK[host][langue][m].replace(/^~\s*/, "");
          if (len(line) > MAX[m]) tooLong.push(`${host}.${langue}.${m} (${len(line)}) : ${line}`);
          // Un mot, pas un silence.
          expect([host, langue, m, len(line) >= 20]).toEqual([host, langue, m, true]);
        }
      }
    }
    expect(tooLong).toEqual([]);
  });

  it("pas de guillemets (la bulle pose les siens), pas de somme écrite à la main, pas d'espace au bord", () => {
    const all = [...lines("fr"), ...lines("en")];
    expect(all.filter((line) => /[«»“”"]/.test(line))).toEqual([]);
    expect(all.filter((line) => line !== line.trim() || /\s{2}/.test(line))).toEqual([]);
    expect(all.filter((line) => /€|\{\w+\}|\d/.test(line))).toEqual([]);
    // L'anglais s'affiche tel quel : pas d'espace insécable à la française.
    expect(lines("en").filter((line) => /[\u00A0\u202F]| [!?:;]/.test(line))).toEqual([]);
    // Aucun mot n'est le même dans les deux langues : rien n'est resté en français.
    for (const host of HOSTS) for (const m of MOMENTS) expect([host, m, MASTERS_TALK[host].en[m] !== MASTERS_TALK[host].fr[m]]).toEqual([host, m, true]);
  });

  it("aucun mot n'est dit deux fois : ni entre maîtres, ni avec leurs répliques de table ou de défi", () => {
    for (const langue of LANGUES) {
      const mine = lines(langue);
      expect(new Set(mine).size).toBe(mine.length);
      const elsewhere = new Set([
        ...HOSTS.flatMap((host) => (Object.keys(TABLE_TALK[host][langue]) as TableMoment[]).flatMap((m) => [...TABLE_TALK[host][langue][m]])),
        ...HOSTS.flatMap((host) => (Object.keys(HOST_TALK[host][langue]) as HostMoment[]).map((m) => HOST_TALK[host][langue][m])),
      ]);
      expect(mine.filter((line) => elsewhere.has(line))).toEqual([]);
    }
  });

  it("chacun garde sa voix : Hmpf, la maison, la moustache, la citronnade, le registre, la Terre", () => {
    const all = (host: Host, langue: Lang) => MOMENTS.map((m) => MASTERS_TALK[host][langue][m]).join(" ");
    expect(all("gaspard", "fr")).toMatch(/Sapristi|sardine|mouette/);
    expect(all("gaspard", "en")).toMatch(/Blimey|sardines|seagull/);
    expect(all("ondine", "fr")).toMatch(/citronnade/);
    expect(all("ondine", "en")).toMatch(/lemonade/);
    expect(all("hector", "fr")).toMatch(/La maison/);
    expect(all("hector", "en")).toMatch(/The house/);
    for (const m of MOMENTS) {
      expect(MASTERS_TALK.baron.fr[m]).toMatch(/^Hmpf\./);
      expect(MASTERS_TALK.baron.en[m]).toMatch(/^Hmph\./);
    }
    expect(all("auguste", "fr")).toMatch(/moustache/);
    expect(all("auguste", "fr")).toMatch(/pari/);
    expect(all("auguste", "en")).toMatch(/moustache/);
    expect(all("auguste", "en")).toMatch(/wager/);
    expect(all("balthazar", "fr")).toMatch(/flotte|pavois|vigie|bord/);
    expect(all("balthazar", "en")).toMatch(/fleet|decks|crow's nest|aboard/);
    expect(all("taupin", "fr")).toMatch(/registre|colonne/);
    expect(all("taupin", "en")).toMatch(/ledger|column/);
    expect(all("selene", "fr")).toMatch(/Terre|lune|constellation/);
    expect(all("selene", "en")).toMatch(/Earth|moon|constellation/);
    // Les maîtres vouvoient ; Gaspard, lui, ne s'adresse à personne (il tutoie les uns, vouvoie les autres).
    const words = (text: string) => text.toLowerCase().split(/[^\p{L}]+/u);
    expect(words(all("gaspard", "fr")).filter((w) => ["tu", "te", "toi", "ton", "ta", "tes", "vous", "votre", "vos"].includes(w))).toEqual([]);
    for (const host of HOSTS.filter((h) => h !== "gaspard")) {
      expect([host, words(all(host, "fr")).filter((w) => ["tu", "te", "toi", "ton", "ta", "tes"].includes(w))]).toEqual([host, []]);
    }
  });

  it("on ne se moque jamais de qui perd : le joueur ruiné est invité à revenir", () => {
    // Chaque maître, en raccompagnant le joueur, parle de la suite : un retour, une revanche, une porte qui rouvre.
    const again: Record<Lang, RegExp> = {
      fr: /remet ça|revanche|rouvre|Revenez|retour|Remontez|revient/,
      en: /go again|rematch|reopens|Come back|return|comes back/,
    };
    for (const host of HOSTS) for (const langue of LANGUES) expect([host, langue, again[langue].test(MASTERS_TALK[host][langue].defaite)]).toEqual([host, langue, true]);
  });

  it("dire un mot : dans la langue du jeu, le geste sans son tilde ; rien pour qui n'est pas un maître", () => {
    expect(mastersLine("baron", "assis")).toEqual({ speaker: "baron", name: "Le Baron", text: "Hmpf. Vous m'avez déjà ruiné une fois. Ce soir, je mords.", gesture: false });
    expect(mastersLine("hector", "elimine")).toEqual({ speaker: "hector", name: "Hector", text: "Hector ôte sa visière. La maison s'incline.", gesture: true });
    // Les vendeurs s'assoient aux tables de la maison, jamais à celle-ci.
    for (const other of ["sidonie", "enzo", "colette", "archibald", "piou", "zoe", null]) expect(mastersLine(other, "assis")).toBeNull();
    setLang("en");
    expect(mastersLine("hector", "elimine")).toEqual({ speaker: "hector", name: "Hector", text: "Hector takes off his visor. The house bows.", gesture: true });
    expect(mastersLine("selene", "victoire")?.text).toBe("Everything rises to you tonight. Even the Earth seems to be watching.");
    for (const host of HOSTS) for (const m of MOMENTS) expect([host, m, mastersLine(host, m) !== null]).toEqual([host, m, true]);
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
      // Les règles de la Table des Maîtres, en trois lignes (Feuilles.tsx).
      "Chacun pose {cave}, et personne ne recave : à zéro, on quitte la table.",
      "La blinde part de {blinde} et monte au fil des mains.",
      "Tu peux partir avec ton tapis, mais sans la victoire.",
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
    // La Table des Maîtres : trois lignes, celles que le relevé connaît.
    const masters = sources.slice(sources.indexOf("const REGLES_MAITRES = ["), sources.indexOf("] as const;", sources.indexOf("const REGLES_MAITRES = [")));
    expect(masters.match(/^ {2}"/gm)?.length).toBe(3);
    for (const phrase of [
      "Chacun pose {cave}, et personne ne recave : à zéro, on quitte la table.",
      "La blinde part de {blinde} et monte au fil des mains.",
      "Tu peux partir avec ton tapis, mais sans la victoire.",
    ]) {
      expect(masters).toContain(`"${phrase}"`);
    }
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
    // La Table des Maîtres garde son nom d'un écran à l'autre.
    expect(EN_POKER["La Table des Maîtres"]).toBe("The Masters' Table");
    expect(EN_POKER["Table des Maîtres"]).toBe("Masters' Table");
    expect(entries.filter((e) => /Table des Maîtres/.test(e.fr) && !/Masters' Table/.test(e.en)).map((e) => e.fr)).toEqual([]);
  });

  it("un bouton sur une ligne reste sur une ligne : pas plus de six caractères de plus que le français", () => {
    const buttons = [
      "Jouer franc jeu", "Rien à dire", "Main suivante", "Se coucher", "Parole", "Recaver", "Créer la table", "Voir la table",
      "Lancer la partie", "Quitter la table", "Rester à table", "Retour au hall", "Reprendre ma place", "Créer une table",
      "Rejoindre avec un code", "Tricheur !", "Je suis là", "Partager", "Finalement, non", "Fin du défi",
      "Prendre place", "Fin du tournoi",
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

  /**
   * Un joueur qui a relevé les huit défis, et de quoi poser sa cave à la Table des Maîtres.
   * Rend aussi le hall tel que le serveur le lui montre.
   */
  async function master(seed: number, balance = MASTERS_BUYIN * 2) {
    const w = makeWorld(seed);
    const created = await w.call<{ playerId: string; code: string }>("POST", "/api/players", { pseudo: `Zoe${seed}`, species: "renard" });
    const auth = `${created.body.playerId}.${created.body.code}`;
    w.storage.poke(created.body.playerId, (p) => {
      p.balance = balance;
      p.pokerWins = PLACES.map((place) => place.id);
    });
    return { w, auth, playerId: created.body.playerId };
  }

  async function play(kind: "maison" | "defi" | "maitres", seed: number, hands: number, watch?: (view: TableView) => void) {
    const w = makeWorld(seed);
    const created = await w.call<{ playerId: string; code: string }>("POST", "/api/players", { pseudo: `Zoe${seed}`, species: "renard" });
    const auth = `${created.body.playerId}.${created.body.code}`;
    w.storage.poke(created.body.playerId, (p) => {
      p.balance = kind === "maitres" ? MASTERS_BUYIN * 2 : 5_000;
      if (kind === "maitres") p.pokerWins = PLACES.map((place) => place.id);
    });
    const body = kind === "maison" ? { maison: "kiosque", buyIn: 100 } : kind === "defi" ? { defi: "kiosque" } : { maitres: true };
    const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", body, auth);
    expect(opened.status).toBe(201);
    let view = opened.body.view!;
    const refused: string[] = [];
    const seen = new Set<string>();
    let left: PokerTableResponse["left"];
    for (let step = 0; step < 20_000 && view.handNo <= hands && !left; step++) {
      watch?.(view);
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
    watch?.(view);
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

  it("le hall d'un vrai serveur : la Table des Maîtres fermée, puis ouverte, puis trop chère", async () => {
    // Un joueur qui débarque : elle se devine, à zéro sur huit.
    const fresh = makeWorld(3);
    const created = await fresh.call<{ playerId: string; code: string }>("POST", "/api/players", { pseudo: "Debut", species: "renard" });
    const lobby0 = await fresh.call<PokerLobbyResponse>("GET", "/api/poker", undefined, `${created.body.playerId}.${created.body.code}`);
    expect(lobby0.status).toBe(200);
    expect(mastersCard(lobby0.body, lobby0.body.state.balance)).toMatchObject({ open: false, defis: 0, total: 8, won: 0 });
    expect(challengesWon(lobby0.body)).toEqual({ won: 0, total: 8 });

    // Les huit défis relevés, la bourse garnie : ouverte, et à sa portée.
    const rich = await master(4);
    const lobby1 = await rich.w.call<PokerLobbyResponse>("GET", "/api/poker", undefined, rich.auth);
    expect(mastersCard(lobby1.body, lobby1.body.state.balance)).toEqual({
      open: true, defis: 8, total: 8, blind: MASTERS_BLIND, buyIn: MASTERS_BUYIN, won: 0, short: 0,
    });
    expect(challengesWon(lobby1.body)).toEqual({ won: 8, total: 8 });

    // Les huit défis relevés, la bourse à plat : ouverte, et la carte dit ce qu'il manque.
    const poor = await master(5, 5_000_000);
    const lobby2 = await poor.w.call<PokerLobbyResponse>("GET", "/api/poker", undefined, poor.auth);
    expect(lobby2.body.masters.affordable).toBe(false);
    expect(mastersCard(lobby2.body, lobby2.body.state.balance)).toMatchObject({ open: true, short: MASTERS_BUYIN - 5_000_000 });
    // Et le serveur refuse bien de l'asseoir : la feuille n'offre pas ce bouton.
    const refusal = await poor.w.call<{ error?: { code: string } }>("POST", "/api/poker/tables", { maitres: true }, poor.auth);
    expect([refusal.status, refusal.body.error?.code]).toEqual([409, "BUYIN_UNAFFORDABLE"]);
    // Un défi manque : le serveur dit pourquoi, avec un code que l'écran sait dire.
    const locked = await fresh.call<{ error?: { code: string } }>("POST", "/api/poker/tables", { maitres: true }, `${created.body.playerId}.${created.body.code}`);
    expect([locked.status, locked.body.error?.code]).toEqual([403, "MASTERS_LOCKED"]);
  });

  it("à la Table des Maîtres, jusqu'au bout : cinq sièges, pas de recave, des sièges éliminés, et une fin", async () => {
    const ends = new Set<string>();
    let rises = 0;
    let fallen = 0;
    for (const seed of [7, 21, 404, 2027, 31_337, 90_210]) {
      const out = new Set<number>();
      let lastBlind = 0;
      const { refused, left, view } = await play("maitres", seed, 400, (v) => {
        expect(v.kind).toBe("maitres");
        if (v.phase === "fermee") return;
        // Le joueur et quatre des huit hôtes, tous différents.
        expect(v.seats.length).toBe(MASTERS_SEATS);
        const bots = v.seats.filter((s): s is SeatView => s !== null && s.bot !== null).map((s) => s.bot!);
        expect(bots.length).toBe(MASTERS_SEATS - 1);
        expect(new Set(bots).size).toBe(bots.length);
        for (const bot of bots) expect([bot, PLACES.some((p) => p.host === bot)]).toEqual([bot, true]);
        // Chacun a de quoi dire en s'asseyant, et en partant.
        for (const bot of bots) expect([bot, mastersLine(bot, "assis") !== null, mastersLine(bot, "elimine") !== null]).toEqual([bot, true, true]);
        // Personne ne recave : l'écran n'a pas de bouton à montrer.
        expect(v.options.rebuy).toBeNull();
        // La blinde ne fait que monter, et sa prochaine hausse est annoncée plus haut qu'elle.
        expect(v.blind).toBeGreaterThanOrEqual(lastBlind);
        if (v.blind > lastBlind && lastBlind > 0) rises++;
        lastBlind = v.blind;
        if (v.rise) {
          expect(v.rise.blind).toBeGreaterThan(v.blind);
          expect(v.rise.hand).toBeGreaterThan(v.handNo);
        }
        // Un siège éliminé n'a plus rien, n'est plus servi, et ne revient pas.
        for (const s of v.seats) {
          if (!s) continue;
          if (s.out) {
            out.add(s.seat);
            expect([s.seat, s.stack, s.inHand]).toEqual([s.seat, 0, false]);
            expect(seatStateText(s, v)).toBe("éliminé");
          } else {
            expect([s.seat, out.has(s.seat)]).toEqual([s.seat, false]);
          }
        }
        // Le compte des maîtres encore assis suit les sièges éliminés.
        const still = mastersLeft(v);
        expect(still.of).toBe(MASTERS_SEATS - 1);
        expect(still.left).toBe(bots.length - [...out].filter((i) => v.seats[i]?.bot != null).length);
        // Ceux que la main vient d'éliminer y jouaient.
        for (const index of fallenSeats(v)) expect(v.result!.net.some((n) => n.seat === index)).toBe(true);
      });
      expect(refused).toEqual([]);
      expect(left).toBeDefined();
      expect([seed, ["maitres-gagne", "maitres-perdu"].includes(left!.reason)]).toEqual([seed, true]);
      expect(isMastersEnd(left!.reason)).toBe(true);
      expect(view.phase).toBe("fermee");
      expect(view.closed).toBe("maitres");
      // Gagnée : tout l'argent de la table, cinq caves. Perdue : rien.
      expect(left!.payout).toBe(left!.reason === "maitres-gagne" ? MASTERS_BUYIN * MASTERS_SEATS : 0);
      expect(left!.bonus).toBe(0);
      // Le panneau de fin a ses mots, avec la somme telle qu'elle sera écrite.
      const ending = mastersEnding(left!.reason as MastersEnd, left!.payout);
      if (left!.reason === "maitres-gagne") expect(ending.texte).toContain(formatEuros(MASTERS_BUYIN * MASTERS_SEATS));
      fallen += [...out].filter((index) => index !== 0).length;
      ends.add(left!.reason);
    }
    // Un joueur qui touche ses boutons au hasard perd presque toujours : au moins cette fin-là est jouée ici.
    expect(ends.has("maitres-perdu")).toBe(true);
    // Sur ces tables, la blinde a monté, et des maîtres ont été éliminés sous les yeux du joueur.
    expect(rises).toBeGreaterThan(0);
    expect(fallen).toBeGreaterThan(0);
  });

  /**
   * Un joueur qui connaît la table : il joue franc jeu, mise ses belles mains, suit avec une
   * paire quand c'est donné, et accuse les brelans, les suites et les couleurs (un maître
   * triche une fois sur deux, toujours vers ces mains-là). Avec les seuls boutons de l'écran.
   */
  function sleuth(view: TableView): PokerAction | null {
    const o = view.options;
    if (o.back) return { type: "retour" };
    if (view.phase === "triche" && o.cheat) return { type: "franc-jeu" };
    if (view.phase === "encheres" && o.fold && view.hand) {
      const level = evaluate(view.hand.cards).level;
      const choices = betChoices(o);
      const me = view.seats[view.you!]!;
      if (level >= 2 && choices.length > 0) return choices[choices.length - 1]!.action;
      if (o.check) return { type: "parole" };
      if (level >= 2 || (level === 1 && o.call <= Math.max(view.blind * 3, me.stack * 0.25))) return { type: "suivre" };
      return { type: "coucher" };
    }
    if (view.phase === "abattage" && o.accuse.length > 0) {
      const suspects = view.seats
        .filter((s): s is SeatView => s !== null && o.accuse.includes(s.seat) && s.cards !== null)
        .filter((s) => s.category === "brelan" || s.category === "suite" || s.category === "couleur")
        .sort((a, b) => evaluate(b.cards!).score - evaluate(a.cards!).score);
      return suspects[0] ? { type: "accuser", seat: suspects[0].seat } : { type: "rien" };
    }
    if (view.phase === "denouement" && o.next) return { type: "suite" };
    return null;
  }

  it("la Table des Maîtres remportée pour de vrai : toute la table, un trophée de plus, et les maîtres qui saluent", async () => {
    let won: { payout: number; masters: readonly string[]; hands: number } | null = null;
    // Ce joueur-là gagne plus d'une table sur deux : en dix tables, il en gagne une (à mille contre un près).
    for (const seed of [7_919, 15_838, 23_757, 31_676, 39_595, 47_514, 55_433, 63_352, 71_271, 79_190]) {
      const { w, auth } = await master(seed, MASTERS_BUYIN);
      const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", { maitres: true }, auth);
      expect(opened.status).toBe(201);
      let view = opened.body.view!;
      const seated = view.seats.filter((s): s is SeatView => s !== null && s.bot !== null).map((s) => s.bot!);
      const refused: string[] = [];
      let left: PokerTableResponse["left"];
      let state: PokerTableResponse["state"];
      // Ce que l'écran montrerait au dernier dénouement : le bouton change de nom, le dernier maître a son mot.
      let lastWord = false;
      for (let step = 0; step < 40_000 && !left; step++) {
        if (view.phase === "denouement" && tournamentDecided(view) && view.seats[view.you!]!.stack > 0) {
          lastWord = fallenSeats(view).some((index) => mastersLine(view.seats[index]!.bot, "elimine") !== null);
        }
        const action = sleuth(view);
        if (action) {
          const r = await w.call<PokerTableResponse & { error?: { code: string } }>("POST", "/api/poker/act", { code: view.code, action, step: view.step }, auth);
          if (r.status !== 200) refused.push(`main ${view.handNo}, ${view.phase} : ${JSON.stringify(action)} → ${r.body.error?.code}`);
          else if (r.body.view) view = r.body.view;
          left = r.body.left;
          state = r.body.state ?? state;
          continue;
        }
        w.tick(1_000);
        const r = await w.call<PokerTableResponse | { unchanged: true }>("GET", `/api/poker/table?code=${view.code}&v=${view.version}`, undefined, auth);
        if ("unchanged" in r.body) continue;
        if (r.body.view) view = r.body.view;
        left = r.body.left;
        state = r.body.state ?? state;
      }
      expect(refused).toEqual([]);
      expect(left && isMastersEnd(left.reason)).toBe(true);
      if (left!.reason !== "maitres-gagne") continue;

      // Gagnée : tout l'argent de la table revient à la bourse, qui n'avait plus rien d'autre.
      expect(left!.payout).toBe(MASTERS_BUYIN * MASTERS_SEATS);
      expect(state?.balance).toBe(MASTERS_BUYIN * MASTERS_SEATS);
      expect(state?.masters).toBe(1);
      expect(lastWord).toBe(true);
      // Le hall le sait : une victoire au palmarès, et la table rouvre.
      const lobby = await w.call<PokerLobbyResponse>("GET", "/api/poker", undefined, auth);
      expect(mastersCard(lobby.body, lobby.body.state.balance)).toMatchObject({ open: true, won: 1, short: 0 });
      expect(lobby.body.seat).toBeNull();
      won = { payout: left!.payout, masters: seated, hands: view.handNo };
      break;
    }
    expect(won).not.toBeNull();
    // Le panneau de la victoire : le montant tel qu'il s'écrit, et un mot de chacun des quatre maîtres.
    expect(mastersEnding("maitres-gagne", won!.payout).texte).toBe(`Tu remportes 1${THIN}500${NBSP}Bn€.`);
    expect(won!.masters.map((bot) => mastersLine(bot, "victoire")?.speaker)).toEqual(won!.masters);
    setLang("en");
    expect(mastersEnding("maitres-gagne", won!.payout).texte).toBe("You win €1,500T.");
    for (const bot of won!.masters) expect(mastersLine(bot, "victoire")?.text).toBe(MASTERS_TALK[bot as Host].en.victoire);
  });

  it("quitter la Table des Maîtres : on repart avec son tapis, sans la victoire", async () => {
    const { w, auth, playerId } = await master(11);
    const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", { maitres: true }, auth);
    expect(opened.status).toBe(201);
    const view = opened.body.view!;
    expect([view.kind, view.place, view.blind, view.minBuyIn, view.maxBuyIn]).toEqual(["maitres", null, MASTERS_BLIND, MASTERS_BUYIN, MASTERS_BUYIN]);
    // La cave a quitté la bourse ; le hall ramène à cette table, et sait la nommer.
    expect(opened.body.state!.balance).toBe(MASTERS_BUYIN);
    const lobby = await w.call<PokerLobbyResponse>("GET", "/api/poker", undefined, auth);
    expect(lobby.body.seat).toMatchObject({ code: view.code, kind: "maitres", place: null });
    expect(tableTitle(lobby.body.seat!)).toBe("Table des Maîtres");
    // Partir en pleine main, c'est se coucher : la blinde reste au pot, le reste du tapis revient.
    const quit = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: view.code, action: { type: "quitter" } }, auth);
    expect(quit.status).toBe(200);
    expect(quit.body.left).toEqual({ reason: "quitte", payout: MASTERS_BUYIN - MASTERS_BLIND, bonus: 0 });
    expect(isMastersEnd(quit.body.left!.reason)).toBe(true);
    expect(mastersEnding("quitte", quit.body.left!.payout).texte).toContain(formatEuros(MASTERS_BUYIN - MASTERS_BLIND));
    // Aucune victoire n'est comptée, et la table peut se rouvrir aussitôt.
    expect(quit.body.state!.masters).toBe(0);
    expect(w.storage.peek(playerId)!.balance).toBe(MASTERS_BUYIN * 2 - MASTERS_BLIND);
    const again = await w.call<PokerLobbyResponse>("GET", "/api/poker", undefined, auth);
    expect(again.body.seat).toBeNull();
    expect(mastersCard(again.body, again.body.state.balance)).toMatchObject({ open: true, short: 0, won: 0 });
  });
});
