// Le Poker Tricheur côté écrans : les calculs purs (qui s'assoit où, les mises proposées,
// les cartes qu'on peut glisser, le récit d'un dénouement), les répliques des personnages
// dans les deux langues, le dictionnaire anglais, et une recette de contrat : tout geste
// que l'écran propose à partir d'une vue est accepté par le vrai serveur.
//
// Et la Table des Maîtres (LOT4.md, section 5) : sa carte dans le hall (fermée, ouverte,
// bourse trop courte, serveur plus ancien), ses sièges éliminés, ses trois fins, les mots
// des huit maîtres, et une table jouée jusqu'au bout contre le vrai serveur.
//
// Et l'histoire de chaque hôte (LOT4.md, section 12) : le battre trois fois au poker l'ouvre.
// Ce que le hall en dit, ce que le panneau de fin annonce, et le compte tel que le vrai
// serveur le rend avec la fin d'un défi ou d'une Table des Maîtres.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { handle, type Deps } from "../server/app";
import { MemoryStorage } from "../server/storage";
import { NBSP, THIN, formatEuros } from "../shared/format";
import { PLACES } from "../shared/places";
import { HOST_STORY_WINS, hostStoryOpen } from "../shared/rules";
import type { PlaceId } from "../shared/types";
import {
  ACCUSE_MS, BOT_PERSONAS, CHALLENGE_ROUNDS, CHEAT_MS, DECK, MASTERS_BLIND, MASTERS_BLINDS, MASTERS_BUYIN, MASTERS_SEATS,
  RESULT_MS, TURN_MS, WALKOVER_MS, betOptions, challengeOf, evaluate,
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
  MAX_DIGITS, RANKS, SUITS, UNITS, accusationCost, beatsOf, betChoices, boundBet, buyInSteps, challengesWon, cleanCode,
  decimalsFor, defaultBuyIn, doubles, duelOf, fallenSeats, fitUnit, freshEntries, hostStory, isFullCode, isTournament,
  leadShift, lineBeats, mastersCard, mastersLeft, maxBuyInChoices, neighbours, netOf, outcomeLines, phaseTotal, playedStage,
  playersLeft, potSized, pressKey, quitMeans, rankTaken, remainingMs, sidesFor, stageOf, startedSaidBy, suitTaken, swapped,
  tournamentDecided, tournamentStake, typedAmount, typedBet, unitOf, unitsFor, winnersOf, type DuelStage, type Unit,
} from "../src/screens/poker/calcul";
import {
  DUEL_TALK, KITTY_TALK, MASTERS_TALK, PIOU_HALL, TABLE_TALK, duelLine, kittyLine, mastersLine, piouHall, tableLine,
  type Bot, type DuelMoment, type Host, type MastersMoment, type TableMoment,
} from "../src/screens/poker/repliques";
import {
  FRIENDS_MODES, boundsText, decimalMark, duelLost, duelProgressText, duelStakesText, duelStoryText, duelWon, fieldAround,
  isMastersEnd, mastersEnding, mastersLeftText, modeName, modeRule, playersLeftText, seatStateText, stageText,
  storyOpenedText, tableTitle, typedBetLabel, typedBetText, typedText, unitLabel, unitName, type MastersEnd,
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

describe("les mises proposées, sans limite : la plus petite, le pot, le tapis", () => {
  it("la mise du pot : ce qu'il y a au milieu ; pour une relance, la mise à égaler plus le pot une fois suivie", () => {
    // Personne n'a misé : le pot, tel quel.
    expect(potSized({ pot: 50, bet: 0 }, 0)).toBe(50);
    // Une mise de 20 à suivre, 70 au milieu : suivre (20) porte le pot à 90, et relancer du pot fait une mise de 110.
    expect(potSized({ pot: 70, bet: 20 }, 0)).toBe(110);
    // Le joueur avait déjà misé 5 : il lui manque 15 pour suivre.
    expect(potSized({ pot: 70, bet: 20 }, 5)).toBe(105);
  });

  it("un tapis profond : la plus petite, la hauteur du pot, et le tapis", () => {
    const o = { bet: { min: 10, max: 290 }, raise: null, allIn: true };
    const choices = betChoices(o, { pot: 50 });
    expect(choices.map((c) => [c.size, c.amount])).toEqual([["min", 10], ["pot", 50], ["tapis", 290]]);
    expect(choices.map((c) => c.action)).toEqual([{ type: "miser", amount: 10 }, { type: "miser", amount: 50 }, { type: "tapis" }]);
    // Une relance après avoir déjà misé 20, avec 200 devant soi : sous « Relancer à », les trois tailles sont des
    // mises totales dans le tour (le tapis vaut 220), et se rangent de la plus petite à la plus grosse.
    const raise = betChoices({ bet: null, raise: { min: 70, max: 220 }, allIn: true }, { pot: 210 });
    expect(raise.map((c) => [c.size, c.amount])).toEqual([["min", 70], ["pot", 210], ["tapis", 220]]);
    expect(raise[1]!.action).toEqual({ type: "relancer", amount: 210 });
    expect(raise[2]!.action).toEqual({ type: "tapis" });
  });

  it("le pot ne tient pas dans la fourchette (tapis court) : le milieu prend sa place", () => {
    const o = { bet: null, raise: { min: 122, max: 260 }, allIn: true };
    expect(betChoices(o, { pot: 500 }).map((c) => [c.size, c.amount])).toEqual([["min", 122], ["milieu", 191], ["tapis", 260]]);
    // Le pot vaut la plus petite mise, ou la plus grosse : pas de doublon.
    expect(betChoices({ bet: { min: 4, max: 60 }, raise: null, allIn: true }, { pot: 4 }).map((c) => c.size)).toEqual(["min", "milieu", "tapis"]);
    expect(betChoices({ bet: { min: 1, max: 6 }, raise: null, allIn: true }, { pot: 6 }).map((c) => c.size)).toEqual(["min", "milieu", "tapis"]);
    // Un tapis plus petit que la mise minimale : il n'y a que lui.
    expect(betChoices({ bet: { min: 3, max: 3 }, raise: null, allIn: true }, { pot: 9 })).toEqual([
      { size: "tapis", amount: 3, action: { type: "tapis" } },
    ]);
  });

  it("un serveur qui s'arrête encore au pot : l'écran suit ses bornes, comme avant", () => {
    // La plus grosse mise permise est le pot, et le tapis n'est pas offert.
    const o = { bet: { min: 1, max: 8 }, raise: null, allIn: false };
    expect(betChoices(o, { pot: 8 }).map((c) => [c.size, c.amount])).toEqual([["min", 1], ["milieu", 5], ["pot", 8]]);
    expect(betChoices(o, { pot: 8 }).map((c) => c.action.type)).toEqual(["miser", "miser", "miser"]);
  });

  it("sur toutes les situations du moteur, les tailles proposées sont permises, et le tapis vaut le tapis", () => {
    let checked = 0;
    let withPot = 0;
    for (const pot of [2, 4, 9, 30, 200]) {
      for (const bet of [0, 1, 4, 20]) {
        for (const mine of [0, 1, 4]) {
          for (const stack of [1, 3, 10, 80, 1000]) {
            for (const raises of [0, 3]) {
              if (mine > bet) continue;
              const o = betOptions({ pot, bet, raises, blind: 1, mine, stack, rivals: 1 });
              const range = o.bet ?? o.raise;
              const choices = betChoices(o, { pot: potSized({ pot, bet }, mine) });
              if (!range) {
                expect(choices).toEqual([]);
                continue;
              }
              expect(choices.length).toBeGreaterThan(0);
              expect(choices.length).toBeLessThanOrEqual(3);
              const sizes = choices.map((c) => c.size);
              expect(new Set(sizes).size).toBe(sizes.length);
              // Des montants croissants, tous différents, tous entiers, tous dans la fourchette.
              const amounts = choices.map((c) => c.amount);
              expect(amounts).toEqual([...new Set(amounts)].sort((a, b) => a - b));
              for (const c of choices) {
                expect(Number.isInteger(c.amount)).toBe(true);
                expect(c.amount).toBeGreaterThanOrEqual(range.min);
                expect(c.amount).toBeLessThanOrEqual(range.max);
                if (c.action.type === "tapis") {
                  expect(o.allIn).toBe(true);
                  // Le tapis vaut bien tout ce que le joueur a devant lui : sa mise totale, s'il avait déjà misé.
                  expect(c.amount).toBe(o.bet ? stack : mine + stack);
                } else {
                  expect(c.action.type).toBe(o.bet ? "miser" : "relancer");
                  expect(c.action).toEqual({ type: c.action.type, amount: c.amount });
                }
              }
              // Le tapis, quand il est permis, est toujours le dernier ; la plus petite mise, toujours la première.
              if (o.allIn) expect(sizes[sizes.length - 1]).toBe("tapis");
              if (choices.length > 1) expect(sizes[0]).toBe("min");
              if (sizes.includes("pot") && o.allIn) withPot++;
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(150);
    // Sans limite, la hauteur du pot tient souvent entre la plus petite mise et le tapis.
    expect(withPot).toBeGreaterThan(20);
  });
});

describe("la mise saisie à la main", () => {
  const BN = 1_000_000_000_000;

  it("les unités d'une table : de celle de sa plus petite mise à celle de sa plus grosse", () => {
    expect([...UNITS]).toEqual([1, 1_000, 1_000_000, 1_000_000_000, BN]);
    expect([0, 1, 999, 1_000, 999_999, 1_000_000, 2_500_000_000, 300 * BN].map(unitOf)).toEqual([1, 1, 1, 1_000, 1_000, 1_000_000, 1_000_000_000, BN]);
    // Au Kiosque (une blinde d'un euro, soixante euros de tapis) : l'euro seul, pas de touche d'unité.
    expect(unitsFor({ min: 1, max: 60 })).toEqual([1]);
    // À la Table des Maîtres : le billion seul. On ne tape pas quinze chiffres.
    expect(unitsFor({ min: 10 * BN, max: 290 * BN })).toEqual([BN]);
    // Entre deux : celles qui servent, dans l'ordre.
    expect(unitsFor({ min: 2, max: 5_000 })).toEqual([1, 1_000]);
    expect(unitsFor({ min: 500_000, max: 80_000_000 })).toEqual([1_000, 1_000_000]);
    expect(unitsFor({ min: 1, max: 3 * BN })).toEqual([...UNITS]);
    // Une fourchette d'un seul montant (le tapis ne couvre pas la mise minimale) : son unité.
    expect(unitsFor({ min: 3_000_000, max: 3_000_000 })).toEqual([1_000_000]);
  });

  it("les touches : des chiffres, une seule virgule, deux décimales au plus, jamais de virgule en euros", () => {
    const type = (keys: string, unit: Unit, from = "") => [...keys].reduce((text, k) => pressKey(text, k === "<" ? "effacer" : k, unit), from);
    expect(type("150", 1)).toBe("150");
    // Pas de zéro devant un nombre.
    expect(type("007", 1)).toBe("7");
    expect(type("0", 1)).toBe("0");
    // Six chiffres avant la virgule, pas un de plus : au-delà, on change d'unité.
    expect(MAX_DIGITS).toBe(6);
    expect(type("1234567890", 1)).toBe("123456");
    // En euros, une mise est un nombre entier : la virgule ne fait rien.
    expect(decimalsFor(1)).toBe(0);
    expect(type("12,5", 1)).toBe("125");
    // Ailleurs : une virgule, deux décimales.
    for (const unit of [1_000, 1_000_000, 1_000_000_000, BN] as const) expect(decimalsFor(unit)).toBe(2);
    expect(type("1,5", 1_000_000)).toBe("1,5");
    expect(type("1,,5,2", 1_000_000)).toBe("1,52");
    expect(type("1,2345", BN)).toBe("1,23");
    // La virgule d'abord : « 0, ».
    expect(type(",5", BN)).toBe("0,5");
    // Effacer retire le dernier signe ; sur un champ vide, rien.
    expect(type("12,5<", BN)).toBe("12,");
    expect(type("12,5<<<<", BN)).toBe("");
    expect(type("<", BN)).toBe("");
    // Une touche inconnue ne change rien.
    expect(pressKey("12", "a", 1)).toBe("12");
    expect(pressKey("12", "10", 1)).toBe("12");
    expect(pressKey("12", ".", 1_000)).toBe("12");
  });

  it("changer d'unité garde ce qui est tapé ; en euros, la virgule s'en va", () => {
    expect(fitUnit("12,5", 1_000_000)).toBe("12,5");
    expect(fitUnit("12,5", 1)).toBe("12");
    expect(fitUnit("12,", 1)).toBe("12");
    expect(fitUnit("0,75", 1)).toBe("0");
    expect(fitUnit("150", 1)).toBe("150");
    expect(fitUnit("", 1_000)).toBe("");
  });

  it("le montant tapé, en euros entiers : « 1,5 » en millions donne 1 500 000", () => {
    expect(typedAmount("150", 1)).toBe(150);
    expect(typedAmount("1,5", 1_000_000)).toBe(1_500_000);
    expect(typedAmount("1,25", 1_000)).toBe(1_250);
    expect(typedAmount("0,01", BN)).toBe(10_000_000_000);
    expect(typedAmount("137,05", BN)).toBe(137_050_000_000_000);
    expect(typedAmount("12,", 1_000_000_000)).toBe(12_000_000_000);
    expect(typedAmount("0,", BN)).toBe(0);
    expect(typedAmount("0", 1)).toBe(0);
    // Rien de tapé : rien à miser.
    expect(typedAmount("", 1)).toBeNull();
    expect(typedAmount(",", BN)).toBeNull();
    // Ce qui ne vient pas des touches ne se lit pas.
    expect(typedAmount("12a", 1)).toBeNull();
    expect(typedAmount("1.5", 1_000)).toBeNull();
    expect(typedAmount("-3", 1)).toBeNull();
    // Des décimales en trop sont ignorées (les touches n'en laissent pas passer).
    expect(typedAmount("1,239", 1_000_000)).toBe(1_230_000);
    expect(typedAmount("7,9", 1)).toBe(7);
  });

  it("toujours un nombre entier d'euros, quoi qu'on tape : aucune décimale ne survit à l'unité", () => {
    let x = 12_345;
    const next = (n: number) => {
      x = (x * 1_103_515_245 + 12_345) % 2_147_483_648;
      return x % n;
    };
    const KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "effacer"];
    let typed = 0;
    for (let round = 0; round < 4_000; round++) {
      const unit = UNITS[next(UNITS.length)]!;
      let text = "";
      for (let i = 0, n = 1 + next(9); i < n; i++) text = pressKey(text, KEYS[next(KEYS.length)]!, unit);
      // La saisie reste une saisie : des chiffres, une virgule au plus, dans les limites des touches.
      expect(text).toMatch(/^\d{0,6}(,\d{0,2})?$/);
      if (unit === 1) expect(text).not.toContain(",");
      const amount = typedAmount(text, unit);
      if (amount === null) {
        expect(text).toBe("");
        continue;
      }
      typed++;
      expect([text, unit, Number.isInteger(amount), amount >= 0]).toEqual([text, unit, true, true]);
      // Le montant est bien celui qu'on lit : à un centième d'unité près, rien d'autre.
      expect(Math.abs(amount - Number(text.replace(",", ".")) * unit)).toBeLessThan(unit / 100 + 1);
    }
    expect(typed).toBeGreaterThan(3_000);
  });

  it("un montant hors de la fourchette est ramené à sa borne, sans jamais sortir des entiers", () => {
    const range = { min: 20, max: 500 };
    expect(boundBet(20, range)).toEqual({ amount: 20, moved: null });
    expect(boundBet(137, range)).toEqual({ amount: 137, moved: null });
    expect(boundBet(500, range)).toEqual({ amount: 500, moved: null });
    expect(boundBet(0, range)).toEqual({ amount: 20, moved: "min" });
    expect(boundBet(19, range)).toEqual({ amount: 20, moved: "min" });
    expect(boundBet(501, range)).toEqual({ amount: 500, moved: "max" });
    expect(boundBet(999_999 * BN, range)).toEqual({ amount: 500, moved: "max" });
    // Rien d'autre qu'un entier ne part : un demi s'arrondit, un nombre de travers vaut le minimum.
    expect(boundBet(137.5, range)).toEqual({ amount: 138, moved: null });
    expect(boundBet(Number.NaN, range)).toEqual({ amount: 20, moved: "min" });
    expect(boundBet(Number.POSITIVE_INFINITY, range)).toEqual({ amount: 500, moved: "max" });
    expect(boundBet(-5, range)).toEqual({ amount: 20, moved: "min" });
  });

  it("une première mise : les jetons posés, et ce qu'il reste devant soi", () => {
    const o = { bet: { min: 10, max: 290 }, raise: null, allIn: true };
    expect(typedBet(40, o, 0, 290)).toEqual({ amount: 40, moved: null, action: { type: "miser", amount: 40 }, allIn: false, added: 40, left: 250 });
    expect(typedBet(3, o, 0, 290)).toMatchObject({ amount: 10, moved: "min", action: { type: "miser", amount: 10 }, added: 10, left: 280 });
    // Tout le tapis, ou davantage : c'est un tapis, et c'est le geste « tapis » qui part.
    expect(typedBet(290, o, 0, 290)).toEqual({ amount: 290, moved: null, action: { type: "tapis" }, allIn: true, added: 290, left: 0 });
    expect(typedBet(5_000, o, 0, 290)).toEqual({ amount: 290, moved: "max", action: { type: "tapis" }, allIn: true, added: 290, left: 0 });
  });

  it("une relance s'annonce par sa mise totale dans le tour : ce qu'on pose, c'est le supplément", () => {
    // Le joueur a déjà misé 20 ; on l'a relancé à 60. Il peut relancer de 70 à 220 (ses 20, plus les 200 qu'il a devant lui).
    const o = { bet: null, raise: { min: 70, max: 220 }, allIn: true };
    expect(typedBet(100, o, 20, 200)).toEqual({ amount: 100, moved: null, action: { type: "relancer", amount: 100 }, allIn: false, added: 80, left: 120 });
    expect(typedBet(65, o, 20, 200)).toMatchObject({ amount: 70, moved: "min", action: { type: "relancer", amount: 70 }, added: 50, left: 150 });
    // Sa mise totale au maximum : il pousse tout ce qu'il a devant lui, pas un euro de plus.
    expect(typedBet(220, o, 20, 200)).toEqual({ amount: 220, moved: null, action: { type: "tapis" }, allIn: true, added: 200, left: 0 });
    expect(typedBet(900, o, 20, 200)).toMatchObject({ amount: 220, moved: "max", action: { type: "tapis" }, added: 200, left: 0 });
  });

  it("quand le serveur plafonne sans offrir le tapis, la plus grosse mise reste une mise ; sans fourchette, rien", () => {
    const limited = { bet: null, raise: { min: 8, max: 26 }, allIn: false };
    expect(typedBet(999, limited, 0, 500)).toEqual({ amount: 26, moved: "max", action: { type: "relancer", amount: 26 }, allIn: false, added: 26, left: 474 });
    expect(typedBet(40, { bet: null, raise: null, allIn: true }, 0, 30)).toBeNull();
    expect(typedBet(40, { bet: null, raise: null, allIn: false }, 0, 30)).toBeNull();
  });

  it("les touches d'unité : « M€ », « Md€ », « Bn€ » ; en anglais K, M, B, T", () => {
    expect(UNITS.map(unitLabel)).toEqual(["€", "k€", "M€", "Md€", "Bn€"]);
    expect(UNITS.map(unitName)).toEqual(["euros", "milliers d'euros", "millions d'euros", "milliards d'euros", "billions d'euros"]);
    expect(decimalMark()).toBe(",");
    expect(fieldAround(1)).toEqual({ avant: "", apres: `${NBSP}€` });
    expect(fieldAround(BN)).toEqual({ avant: "", apres: `${NBSP}Bn€` });
    setLang("en");
    expect(UNITS.map(unitLabel)).toEqual(["€", "K", "M", "B", "T"]);
    // Le « billion » anglais est le milliard, le « trillion » le billion français : comme `formatEuros`.
    expect(UNITS.map(unitName)).toEqual(["euros", "thousands of euros", "millions of euros", "billions of euros", "trillions of euros"]);
    expect(decimalMark()).toBe(".");
    expect(fieldAround(1)).toEqual({ avant: "€", apres: "" });
    expect(fieldAround(BN)).toEqual({ avant: "€", apres: "T" });
    // Le champ et le montant relu s'écrivent pareil : « €150M ».
    expect(`${fieldAround(1_000_000).avant}${typedText("150")}${fieldAround(1_000_000).apres}`).toBe(formatEuros(150_000_000));
    setLang("fr");
    expect(`${fieldAround(1_000_000).avant}${typedText("150")}${fieldAround(1_000_000).apres}`).toBe(formatEuros(150_000_000));
    expect(`${fieldAround(BN).avant}${typedText("137,05")}${fieldAround(BN).apres}`).toBe(formatEuros(137_050_000_000_000));
  });

  it("le champ : les milliers séparés, la virgule dans la langue du jeu", () => {
    expect(typedText("")).toBe("");
    expect(typedText("150000")).toBe(`150${THIN}000`);
    expect(typedText("1,5")).toBe("1,5");
    expect(typedText("12,")).toBe("12,");
    expect(typedText("0,05")).toBe("0,05");
    setLang("en");
    expect(typedText("150000")).toBe("150,000");
    expect(typedText("1,5")).toBe("1.5");
    expect(typedText("12,")).toBe("12.");
  });

  it("sous le champ : la fourchette, ou pourquoi le montant a été ramené à une borne", () => {
    const o = { bet: { min: 10 * BN, max: 290 * BN }, raise: null, allIn: true };
    const range = o.bet;
    expect(boundsText(null, range)).toEqual({ texte: `Entre 10${NBSP}Bn€ et 290${NBSP}Bn€`, ramene: false });
    expect(boundsText(typedBet(40 * BN, o, 0, 290 * BN), range, 40 * BN)).toEqual({ texte: `Entre 10${NBSP}Bn€ et 290${NBSP}Bn€`, ramene: false });
    expect(boundsText(typedBet(3 * BN, o, 0, 290 * BN), range, 3 * BN)).toEqual({ texte: `Moins que le minimum : ce sera 10${NBSP}Bn€.`, ramene: true });
    expect(boundsText(typedBet(900 * BN, o, 0, 290 * BN), range, 900 * BN)).toEqual({ texte: "Plus que ton tapis : ce sera tout ton tapis.", ramene: true });
    // Un serveur qui plafonne sans offrir le tapis : la borne se dit par son montant.
    const limited = { bet: { min: 2, max: 26 }, raise: null, allIn: false };
    expect(boundsText(typedBet(99, limited, 0, 500), limited.bet, 99)).toEqual({ texte: `Plus que le maximum : ce sera 26${NBSP}€.`, ramene: true });
    // Un minimum qui ne tombe pas rond (122 464 000 000 000 €) s'écrit « 122,46 Bn€ » : taper 122,46 part au
    // minimum, sans qu'on explique au joueur qu'il a tapé « moins » que ce qu'il lit.
    const odd = { bet: null, raise: { min: 122_464_000_000_000, max: 260 * BN }, allIn: true };
    const typed = typedAmount("122,46", BN)!;
    const bet = typedBet(typed, odd, 0, 260 * BN)!;
    expect(bet).toMatchObject({ amount: 122_464_000_000_000, moved: "min", action: { type: "relancer", amount: 122_464_000_000_000 } });
    expect(boundsText(bet, odd.raise, typed).ramene).toBe(false);
    expect(typedBetLabel(bet, false, 260 * BN)).toBe(`Relancer à 122,46${NBSP}Bn€`);
    setLang("en");
    expect(boundsText(null, range).texte).toBe("Between €10T and €290T");
    expect(boundsText(typedBet(3 * BN, o, 0, 290 * BN), range, 3 * BN).texte).toBe("Below the minimum: it will be €10T.");
    expect(boundsText(typedBet(900 * BN, o, 0, 290 * BN), range, 900 * BN).texte).toBe("More than your stack: you'll be all in.");
    expect(boundsText(typedBet(99, limited, 0, 500), limited.bet, 99).texte).toBe("Above the maximum: it will be €26.");
  });

  it("ce que la mise engage, et ce qui s'écrit sur le bouton : le montant tel qu'il partira", () => {
    const bet = { bet: { min: 10, max: 290 }, raise: null, allIn: true };
    const raise = { bet: null, raise: { min: 70, max: 220 }, allIn: true };
    // Rien de tapé : le bouton attend, et dit son geste.
    expect(typedBetLabel(null, true, 290)).toBe("Miser");
    expect(typedBetLabel(null, false, 200)).toBe("Relancer");
    // Une mise.
    expect(typedBetLabel(typedBet(40, bet, 0, 290), true, 290)).toBe(`Miser 40${NBSP}€`);
    expect(typedBetText(typedBet(40, bet, 0, 290)!, true)).toBe(`Tu poses 40${NBSP}€ : il te restera 250${NBSP}€.`);
    // Une relance : le bouton dit la mise totale (« relancer à »), la phrase dit ce qu'on pose en plus.
    expect(typedBetLabel(typedBet(100, raise, 20, 200), false, 200)).toBe(`Relancer à 100${NBSP}€`);
    expect(typedBetText(typedBet(100, raise, 20, 200)!, false)).toBe(`Tu ajoutes 80${NBSP}€ à ta mise : il te restera 120${NBSP}€.`);
    // Une relance sans avoir encore misé dans le tour : ce qu'on pose est la mise elle-même.
    expect(typedBetText(typedBet(100, raise, 0, 220)!, false)).toBe(`Tu poses 100${NBSP}€ : il te restera 120${NBSP}€.`);
    // Un tapis : son montant est celui du tapis, pas de la mise totale.
    expect(typedBetLabel(typedBet(900, raise, 20, 200), false, 200)).toBe(`Tapis : 200${NBSP}€`);
    expect(typedBetText(typedBet(900, raise, 20, 200)!, false)).toBe(`Tu poses 200${NBSP}€ : c'est tout ton tapis.`);
    setLang("en");
    expect(typedBetLabel(null, true, 290)).toBe("Bet");
    expect(typedBetLabel(null, false, 200)).toBe("Raise");
    expect(typedBetLabel(typedBet(40, bet, 0, 290), true, 290)).toBe("Bet €40");
    expect(typedBetLabel(typedBet(100, raise, 20, 200), false, 200)).toBe("Raise to €100");
    expect(typedBetLabel(typedBet(900, raise, 20, 200), false, 200)).toBe("All in: €200");
    expect(typedBetText(typedBet(40, bet, 0, 290)!, true)).toBe("You put in €40: you'll have €250 left.");
    expect(typedBetText(typedBet(100, raise, 20, 200)!, false)).toBe("You add €80 to your bet: you'll have €120 left.");
    expect(typedBetText(typedBet(900, raise, 20, 200)!, false)).toBe("You put in €200: that's your whole stack.");
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
  const HOSTS = Object.keys(DUEL_TALK) as Host[];
  const MOMENTS: readonly TableMoment[] = ["accuse", "demasque", "innocent", "gagne"];
  const DUEL_MOMENTS: readonly DuelMoment[] = ["ouverture", "avantage", "recul", "victoire", "defaite"];
  const STAGES: readonly DuelStage[] = [1, 2, 3, "revanche"];
  /** À table : deux lignes au-dessus des cartes, sur un téléphone de 320 px. */
  const MAX_TABLE = 70;
  /** Dans le hall, à l'ouverture et à la fin d'une manche : une bulle de trois lignes. */
  const MAX_HOST = 110;
  /** Tout ce qu'un hôte dit pendant ses défis, dans une langue. */
  const duelLines = (host: Host, langue: Lang) => DUEL_MOMENTS.flatMap((m) => [...DUEL_TALK[host][langue][m]]);

  it("un personnage par robot du moteur, un hôte par lieu", () => {
    expect([...BOTS].sort()).toEqual([...BOT_PERSONAS].sort());
    expect([...HOSTS].sort()).toEqual(PLACES.map((p) => p.host).sort());
    expect(Object.keys(KITTY_TALK).sort()).toEqual([...HOSTS].sort());
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

  it("le défi en trois manches : cinq moments par hôte, une réplique par manche, puis celle de la revanche", () => {
    for (const host of HOSTS) {
      for (const langue of LANGUES) {
        const voice = DUEL_TALK[host][langue];
        expect([host, langue, Object.keys(voice).sort()]).toEqual([host, langue, [...DUEL_MOMENTS].sort()]);
        // L'ouverture, la victoire et la défaite : trois manches et la revanche. L'avantage et le recul : trois manches.
        expect([host, langue, DUEL_MOMENTS.map((m) => voice[m].length)]).toEqual([host, langue, [4, 3, 3, 4, 4]]);
      }
      // Un geste en français reste un geste en anglais, réplique par réplique.
      for (const moment of DUEL_MOMENTS) {
        DUEL_TALK[host].fr[moment].forEach((line, i) => {
          expect([host, moment, i, DUEL_TALK[host].en[moment][i]!.startsWith("~")]).toEqual([host, moment, i, line.startsWith("~")]);
        });
      }
    }
  });

  it("trois manches de suite ne se ressemblent pas : aucune réplique d'un hôte n'est dite deux fois", () => {
    for (const langue of LANGUES) {
      const all = HOSTS.flatMap((host) => duelLines(host, langue));
      // Huit hôtes, dix-huit répliques chacun, toutes différentes : d'une manche à l'autre, d'un hôte à l'autre.
      expect(all.length).toBe(8 * 18);
      expect(all.filter((line, i) => all.indexOf(line) !== i)).toEqual([]);
      // Et aucune ne redit une réplique de table, ni un mot de la Table des Maîtres.
      const elsewhere = new Set([
        ...BOTS.flatMap((bot) => MOMENTS.flatMap((m) => [...TABLE_TALK[bot][langue][m]])),
        ...HOSTS.flatMap((host) => Object.values(MASTERS_TALK[host][langue])),
      ]);
      expect(all.filter((line) => elsewhere.has(line))).toEqual([]);
    }
  });

  it("les deux répliques de table d'un défi tiennent en 70 caractères ; ses trois bulles, en 110", () => {
    const tooLong: string[] = [];
    for (const host of HOSTS) {
      for (const langue of LANGUES) {
        for (const moment of DUEL_MOMENTS) {
          const max = moment === "avantage" || moment === "recul" ? MAX_TABLE : MAX_HOST;
          DUEL_TALK[host][langue][moment].forEach((line, i) => {
            if (len(line.replace(/^~\s*/, "")) > max) tooLong.push(`${host}.${langue}.${moment}[${i}] (${len(line)}) : ${line}`);
          });
        }
        // Une table d'avant les trois manches : la plus longue somme qu'un hôte puisse remettre, celle de la Lune.
        setLang(langue);
        const kitty = KITTY_TALK[host][langue].replace("{cagnotte}", formatEuros(25_000_000_000_000));
        if (len(kitty) > MAX_HOST) tooLong.push(`${host}.${langue}.cagnotte (${len(kitty)}) : ${kitty}`);
      }
    }
    setLang("fr");
    expect(tooLong).toEqual([]);
  });

  it("aucune somme écrite à la main dans un défi : seule la cagnotte d'une table d'avant s'annonce, par sa variable", () => {
    for (const host of HOSTS) {
      for (const langue of LANGUES) {
        for (const line of duelLines(host, langue)) {
          expect([host, langue, variables(line)]).toEqual([host, langue, []]);
          // La mise change d'une manche à l'autre et d'un lieu à l'autre : un hôte dit « le double », jamais un montant.
          expect([line, /\d|€/.test(line)]).toEqual([line, false]);
        }
        expect([host, langue, variables(KITTY_TALK[host][langue])]).toEqual([host, langue, ["{cagnotte}"]]);
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
      ...HOSTS.flatMap((host) => LANGUES.flatMap((l) => [...duelLines(host, l), KITTY_TALK[host][l]])),
      ...Object.values(PIOU_HALL).flatMap((deux) => [deux.fr, deux.en]),
    ];
    expect(all.filter((line) => /[«»“”"]/.test(line))).toEqual([]);
    expect(all.filter((line) => line !== line.trim() || /\s{2}/.test(line))).toEqual([]);
    // L'anglais s'affiche tel quel : pas d'espace insécable à la française.
    const english = [
      ...BOTS.flatMap((bot) => MOMENTS.flatMap((m) => [...TABLE_TALK[bot].en[m]])),
      ...HOSTS.flatMap((host) => [...duelLines(host, "en"), KITTY_TALK[host].en]),
    ];
    expect(english.filter((line) => /[\u00A0\u202F]| [!?:;]/.test(line))).toEqual([]);
    // Et le français pose ses espaces devant les signes doubles.
    const french = HOSTS.flatMap((host) => duelLines(host, "fr"));
    expect(french.filter((line) => /[^\s][!?;:]/.test(line.replace(/\.\.\./g, "")))).toEqual([]);
  });

  it("en anglais, la cagnotte d'un hôte est « the kitty » : « purse » est la bourse du joueur", () => {
    const english = HOSTS.flatMap((host) => [...duelLines(host, "en"), KITTY_TALK[host].en]);
    expect(english.filter((line) => /\bpurse\b/i.test(line))).toEqual([]);
    expect(HOSTS.filter((host) => !/kitty/.test(KITTY_TALK[host].en))).toEqual([]);
    expect(HOSTS.filter((host) => !/cagnotte/.test(KITTY_TALK[host].fr))).toEqual([]);
  });

  it("d'une manche à l'autre, l'hôte change de ton : il double à la deuxième, joue la dernière, puis doit une histoire", () => {
    for (const host of HOSTS) {
      const fr = DUEL_TALK[host].fr;
      const en = DUEL_TALK[host].en;
      // À la deuxième manche, la mise a doublé : il le dit.
      expect([host, /doubl/i.test(fr.ouverture[1])]).toEqual([host, true]);
      expect([host, /doubl/i.test(en.ouverture[1])]).toEqual([host, true]);
      // La troisième est la dernière : il y joue tout.
      expect([host, /derni[èe]re manche/i.test(fr.ouverture[2])]).toEqual([host, true]);
      expect([host, /last round/i.test(en.ouverture[2])]).toEqual([host, true]);
      // Battu une fois, il annonce qu'il doublera ; battu trois fois, il rend les armes et promet de raconter.
      expect([host, /doubl/i.test(fr.defaite[0])]).toEqual([host, true]);
      expect([host, /doubl/i.test(en.defaite[0])]).toEqual([host, true]);
      expect([host, /histoire|raconter/i.test(fr.defaite[2])]).toEqual([host, true]);
      expect([host, /story|tell you/i.test(en.defaite[2])]).toEqual([host, true]);
      expect([host, /[Tt]rois/.test(fr.defaite[2])]).toEqual([host, true]);
      expect([host, /[Tt]hree/.test(en.defaite[2])]).toEqual([host, true]);
      // Une histoire promise, jamais racontée ici : rien de ce qu'elle garde pour les Souvenirs.
      for (const line of [...duelLines(host, "fr"), ...duelLines(host, "en")]) expect(line).not.toMatch(/Piou|as de cœur|ace of hearts|fondé|founded/i);
      // Quand il gagne, il invite à retenter : on ne se moque jamais de qui perd.
      for (const line of [...fr.victoire, ...en.victoire]) expect(line).not.toMatch(/perdant|nul|loser|pathetic|pauvre/i);
    }
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
    // Dans ses défis, chacun reste lui-même à toutes les manches.
    const every = (host: Host, langue: Lang, voice: RegExp) => STAGES.map((_, i) => voice.test(DUEL_TALK[host][langue].ouverture[i]!));
    expect(every("baron", "fr", /Hmpf/)).toEqual([true, true, true, true]);
    expect(every("baron", "en", /Hmph/)).toEqual([true, true, true, true]);
    expect(every("hector", "fr", /[Ll]a maison/)).toEqual([true, true, true, true]);
    expect(every("hector", "en", /[Tt]he house/)).toEqual([true, true, true, true]);
    expect(duelLines("auguste", "fr").filter((line) => /moustache|pari/i.test(line)).length).toBeGreaterThan(12);
    expect(duelLines("balthazar", "fr").filter((line) => /bord|pavillon|corne|cale|barre|quai|vent|voile|coul|eau|yacht|cap|terre|second|avarie/i.test(line)).length).toBeGreaterThan(12);
    expect(duelLines("taupin", "fr").filter((line) => /registre|colonne|encre|inscri|crayon|coffre|ligne|bas|chut|compte|lunettes|mine|virgule/i.test(line)).length).toBeGreaterThan(12);
    expect(duelLines("ondine", "fr").filter((line) => /citronnade|plateau|service|terrasse|salle|goûter|note|ardoise|sers|sourire|calme|agaçant|désagréable|souffle|enthousiasme/i.test(line)).length).toBeGreaterThan(12);
    expect(duelLines("selene", "fr").filter((line) => /Terre|Lune|lunaire|d'ici|d'en haut|là-haut|ici|marée|étoile|croissant|rayon|flott|nuit/i.test(line)).length).toBeGreaterThan(12);
    expect(duelLines("gaspard", "fr").filter((line) => /renard|[Ss]apristi|sardine|Kiosque|comptoir|tiroir-caisse|[Ff]açon de parler|moustaches|plumé|plaisir|temps en temps/i.test(line)).length).toBeGreaterThan(12);
    // Les hôtes vouvoient ; Gaspard, lui, ne s'adresse à personne (il tutoie les uns, vouvoie les autres).
    const words = (text: string) => text.toLowerCase().split(/[^\p{L}]+/u);
    const gaspard = words([...duelLines("gaspard", "fr"), KITTY_TALK.gaspard.fr, all("gaspard", "fr")].join(" "));
    expect(gaspard.filter((w) => ["tu", "te", "toi", "ton", "ta", "tes", "vous", "votre", "vos"].includes(w))).toEqual([]);
    for (const host of HOSTS.filter((h) => h !== "gaspard")) {
      const said = words([...duelLines(host, "fr"), KITTY_TALK[host].fr].join(" "));
      expect([host, said.filter((w) => ["tu", "te", "toi", "ton", "ta", "tes"].includes(w))]).toEqual([host, []]);
    }
    // Ondine et Séléné parlent d'elles au féminin ; personne ne donne de genre au joueur.
    expect(duelLines("ondine", "fr").join(" ")).toMatch(/[Bb]attue/);
    expect(duelLines("selene", "fr").join(" ")).toMatch(/[Bb]attue/);
    for (const host of HOSTS) expect(duelLines(host, "fr").join(" ")).not.toMatch(/mon grand|ma grande|le seul |la seule |en habitué |remonté /);
  });

  it("dire une réplique : dans la langue du jeu, le geste sans son tilde, la manche à sa place", () => {
    expect(tableLine("hector", "accuse", 0)).toEqual({ speaker: "hector", name: "Hector", text: "La maison ne triche pas. Elle arrondit.", gesture: false });
    expect(tableLine("hector", "accuse", 1)).toEqual({ speaker: "hector", name: "Hector", text: "Hector hausse un sourcil. Le gauche.", gesture: true });
    // La graine choisit la variante, et ne déborde jamais.
    expect(tableLine("hector", "accuse", 7)?.text).toBe(tableLine("hector", "accuse", 1)?.text);
    expect(tableLine("hector", "accuse", -3)?.text).toBe(tableLine("hector", "accuse", 1)?.text);
    // Un joueur n'a pas de réplique.
    expect(tableLine(null, "gagne")).toBeNull();
    expect(tableLine("zoe", "gagne")).toBeNull();
    // Le défi : la réplique de la manche, puis celle de la revanche.
    expect(duelLine("gaspard", "ouverture", 1)?.text).toBe("Un tête-à-tête ? Le vieux renard a plus d'un tour dans sa manche. Façon de parler.");
    expect(duelLine("gaspard", "ouverture", 2)?.text).toBe(DUEL_TALK.gaspard.fr.ouverture[1]);
    expect(duelLine("gaspard", "defaite", 3)?.text).toBe("Trois fois ! Le renard rend les armes. Et il doit une histoire : la sienne.");
    expect(duelLine("gaspard", "victoire", "revanche")?.text).toBe(DUEL_TALK.gaspard.fr.victoire[3]);
    // L'avantage et le recul n'ont que trois répliques : en revanche, la graine pioche parmi elles.
    expect(duelLine("baron", "avantage", 2)?.text).toBe("Hmpf. Devant. Je ne souris pas, c'est un tic.");
    expect([0, 1, 2, 3, -1].map((seed) => duelLine("baron", "recul", "revanche", seed)?.text)).toEqual(
      [0, 1, 2, 0, 1].map((i) => DUEL_TALK.baron.fr.recul[i]),
    );
    // Un geste garde son statut de geste.
    expect(duelLine("hector", "avantage", 2)).toEqual({ speaker: "hector", name: "Hector", text: "Hector aligne ses jetons. Au millimètre.", gesture: true });
    // Qui n'est pas un hôte n'a pas de défi.
    expect(duelLine("sidonie", "ouverture", 1)).toBeNull();
    expect(duelLine(null, "ouverture", 1)).toBeNull();
    expect(kittyLine("gaspard", "100 €")?.text).toBe("Sapristi ! Plumé à mon propre comptoir. La cagnotte est là : 100 €. Bien joué !");
    expect(kittyLine("sidonie", "100 €")).toBeNull();
    expect(piouHall("fauche", "20 €")).toBe("Il vous faut 20 € pour vous asseoir. Un ticket ou deux, et à table !");
    setLang("en");
    expect(tableLine("baron", "gagne", 0)).toEqual({ speaker: "baron", name: "The Baron", text: "Hmph. Nice pot. I am not crying.", gesture: false });
    expect(duelLine("gaspard", "ouverture", 3)?.text).toBe("Last round, my friend. The whole till goes on the table. Blimey, I've got stage fright.");
    expect(kittyLine("gaspard", "€100")?.text).toBe("Blimey! Fleeced at my own counter. Here's the kitty: €100. Well played!");
    expect(piouHall("fauche", "€20")).toBe("You need €20 to take a seat. A ticket or two, and you're at the table!");
    expect(hostName("balthazar")).toBe("The Commodore");
  });
});

// ---------------------------------------------------------------------------

/** La Table des Maîtres, telle que le hall la rend. */
function masters(over: Partial<LobbyMasters> = {}): LobbyMasters {
  return { open: false, defis: 0, blind: MASTERS_BLIND, buyIn: MASTERS_BUYIN, won: 0, affordable: false, ...over };
}

/** Les huit défis du hall, dont les `won` premiers sont relevés. */
function challenges(won: number): { won: boolean }[] {
  return PLACES.map((_, i) => ({ won: i < won }));
}

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

  it("le tournoi est joué quand, au dénouement, le joueur n'a plus rien, ou plus aucun maître", () => {
    const end = { kind: "maitres" as const, phase: "denouement" as const, you: 0 };
    const allOut = table({ 0: { stack: 1500 }, 1: { stack: 0 }, 2: { stack: 0 }, 3: { stack: 0 }, 4: { stack: 0 } });
    expect(tournamentDecided({ ...end, seats: table() })).toBe(false);
    expect(tournamentDecided({ ...end, seats: table({ 1: { stack: 0, out: true }, 2: { stack: 0, out: true }, 3: { stack: 0, out: true } }) })).toBe(false);
    expect(tournamentDecided({ ...end, seats: allOut })).toBe(true);
    expect(tournamentDecided({ ...end, seats: table({ 0: { stack: 0 } }) })).toBe(true);
    // Pendant une main, un joueur à tapis n'a plus rien devant lui et joue encore : rien n'est joué.
    for (const phase of ["triche", "encheres", "abattage", "attente"] as const) {
      expect([phase, tournamentDecided({ ...end, phase, seats: table({ 0: { stack: 0, allIn: true } }) })]).toEqual([phase, false]);
      expect([phase, tournamentDecided({ ...end, phase, seats: allOut })]).toEqual([phase, false]);
    }
    // Un défi se juge de la même façon ; une table ordinaire, jamais.
    expect(tournamentDecided({ ...end, kind: "defi", seats: [seat(0), seat(1, { bot: "gaspard", stack: 0 })] })).toBe(true);
    expect(tournamentDecided({ ...end, kind: "defi", seats: [seat(0), seat(1, { bot: "gaspard" })] })).toBe(false);
    expect(tournamentDecided({ ...end, kind: "maison", seats: table({ 0: { stack: 0 } }) })).toBe(false);
    expect(tournamentDecided({ ...end, you: null, seats: table() })).toBe(false);
  });

  it("ses trois fins : gagnée, perdue, quittée", () => {
    const ENDS: readonly MastersEnd[] = ["maitres-gagne", "maitres-perdu", "quitte"];
    for (const reason of [...ENDS, "maitres-nul"] as const) expect(isMastersEnd(reason)).toBe(true);
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
  /**
   * En s'asseyant, les quatre maîtres parlent ensemble, à la place du tapis : deux lignes chacun sur un
   * écran de 320 px, nom compris. À table et sur le panneau de la victoire : deux lignes. Raccompagner
   * le joueur : une bulle.
   */
  const MAX: Record<MastersMoment, number> = { assis: 60, elimine: 70, victoire: 70, defaite: 110 };
  const lines = (langue: Lang) => HOSTS.flatMap((host) => MOMENTS.map((m) => MASTERS_TALK[host][langue][m]));

  it("les huit hôtes, pas un de plus : c'est parmi eux que la tablée est tirée", () => {
    expect([...HOSTS].sort()).toEqual(PLACES.map((p) => p.host).sort());
    expect([...HOSTS].sort()).toEqual((Object.keys(DUEL_TALK) as Host[]).sort());
  });

  it("chacun a ses quatre moments, de même forme dans les deux langues", () => {
    for (const host of HOSTS) {
      for (const langue of LANGUES) expect([host, langue, Object.keys(MASTERS_TALK[host][langue]).sort()]).toEqual([host, langue, [...MOMENTS].sort()]);
      // Un geste en français reste un geste en anglais.
      for (const m of MOMENTS) expect([host, m, MASTERS_TALK[host].en[m].startsWith("~")]).toEqual([host, m, MASTERS_TALK[host].fr[m].startsWith("~")]);
    }
  });

  it("chaque mot tient dans sa place : 60 caractères en s'asseyant, 70 à table, 110 pour raccompagner le joueur", () => {
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
        ...HOSTS.flatMap((host) => (Object.keys(DUEL_TALK[host][langue]) as DuelMoment[]).flatMap((m) => [...DUEL_TALK[host][langue][m]])),
        ...HOSTS.map((host) => KITTY_TALK[host][langue]),
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

describe("le défi, en trois manches : la mise double, et la troisième victoire ouvre l'histoire de l'hôte", () => {
  const wins = (over: Partial<Record<PlaceId, number>> = {}) => {
    const out = {} as Record<PlaceId, number>;
    for (const place of PLACES) out[place.id] = over[place.id] ?? 0;
    return out;
  };
  /** Le défi d'un lieu tel que le serveur le rend dans le hall, pour un joueur qui a battu son hôte `n` fois. */
  const lobby = (place: PlaceId, n: number) => {
    const def = challengeOf(place, Math.min(CHALLENGE_ROUNDS, n + 1));
    return { place, buyIn: def.buyIn, bonus: def.bonus, level: def.level, wins: n, stake: def.buyIn, prize: def.prize, rematch: n >= CHALLENGE_ROUNDS };
  };

  it("l'étape à jouer suit les victoires : manche 1, 2, 3, puis la revanche pour toujours", () => {
    expect(CHALLENGE_ROUNDS).toBe(3);
    // Trois manches, trois victoires pour l'histoire : c'est la même règle, vue de deux côtés.
    expect(HOST_STORY_WINS).toBe(CHALLENGE_ROUNDS);
    expect([0, 1, 2, 3, 4, 40].map(stageOf)).toEqual([1, 2, 3, "revanche", "revanche", "revanche"]);
    // Un compte de travers vaut zéro : la première manche.
    expect([Number.NaN, -3, 0.9, Number.POSITIVE_INFINITY].map(stageOf)).toEqual([1, 1, 1, 1]);
    expect(stageOf(2.9)).toBe(3);
    for (let n = 0; n <= 5; n++) expect(stageOf(n) === "revanche").toBe(hostStoryOpen(wins({ lune: n }), "lune"));
  });

  it("où l'on en est avec un hôte : ses victoires, et l'histoire ouverte à trois", () => {
    expect(hostStory(wins(), "kiosque")).toEqual({ wins: 0, needed: 3, left: 3, open: false, justOpened: false });
    expect(hostStory(wins({ kiosque: 2 }), "kiosque")).toEqual({ wins: 2, needed: 3, left: 1, open: false, justOpened: false });
    expect(hostStory(wins({ kiosque: 3 }), "kiosque")).toEqual({ wins: 3, needed: 3, left: 0, open: true, justOpened: true });
    expect(hostStory(wins({ kiosque: 7 }), "kiosque")).toEqual({ wins: 7, needed: 3, left: 0, open: true, justOpened: false });
    expect(hostStory(wins({ kiosque: 3 }), "cafe").wins).toBe(0);
    // Un état sans ce compte, ou de travers, ne casse rien : zéro victoire.
    const zero = { wins: 0, needed: 3, left: 3, open: false, justOpened: false };
    for (const odd of [undefined, null, {}, { kiosque: Number.NaN }, { kiosque: -2 }, { kiosque: "3" as unknown as number }]) {
      expect(hostStory(odd, "kiosque")).toEqual(zero);
    }
    expect(hostStory({ kiosque: 2.9 }, "kiosque").wins).toBe(2);
  });

  it("le défi tel que le hall le rend : la manche, les manches gagnées, la mise, ce que le gagnant emporte", () => {
    // Au Kiosque : 100 € pour gagner 200 €, puis le double, puis encore le double (l'exemple du propriétaire).
    expect(duelOf(lobby("kiosque", 0), wins())).toEqual({ stage: 1, rounds: 3, won: 0, stake: 100, prize: 200 });
    expect(duelOf(lobby("kiosque", 1), wins({ kiosque: 1 }))).toEqual({ stage: 2, rounds: 3, won: 1, stake: 200, prize: 400 });
    expect(duelOf(lobby("kiosque", 2), wins({ kiosque: 2 }))).toEqual({ stage: 3, rounds: 3, won: 2, stake: 400, prize: 800 });
    // L'histoire ouverte : la revanche, aux conditions de la troisième manche, les trois repères pleins.
    expect(duelOf(lobby("kiosque", 3), wins({ kiosque: 3 }))).toEqual({ stage: "revanche", rounds: 3, won: 3, stake: 400, prize: 800 });
    expect(duelOf(lobby("kiosque", 9), wins({ kiosque: 9 }))).toEqual({ stage: "revanche", rounds: 3, won: 3, stake: 400, prize: 800 });
    // Sur la Lune, les mêmes manches, en billions.
    expect(duelOf(lobby("lune", 2), wins({ lune: 2 }))).toMatchObject({ stage: 3, stake: 100_000_000_000_000, prize: 200_000_000_000_000 });
    // C'est le serveur qui fait foi, quoi que l'état du joueur ait gardé en mémoire.
    expect(duelOf(lobby("kiosque", 2), wins())).toMatchObject({ stage: 3, won: 2, stake: 400 });
  });

  it("un serveur d'avant les trois manches ne dit que la cave : la manche se déduit des victoires, le gain vaut les deux mises", () => {
    const old = { place: "kiosque" as const, buyIn: 30 };
    expect(duelOf(old, wins())).toEqual({ stage: 1, rounds: 3, won: 0, stake: 30, prize: 60 });
    expect(duelOf(old, wins({ kiosque: 1 }))).toEqual({ stage: 2, rounds: 3, won: 1, stake: 30, prize: 60 });
    expect(duelOf(old, wins({ kiosque: 5 }))).toEqual({ stage: "revanche", rounds: 3, won: 3, stake: 30, prize: 60 });
    expect(duelOf(old, undefined)).toEqual({ stage: 1, rounds: 3, won: 0, stake: 30, prize: 60 });
    // Des champs de travers ne cassent rien.
    expect(duelOf({ place: "kiosque", buyIn: 100, level: Number.NaN, wins: -1, stake: Number.NaN, prize: -5 }, wins({ kiosque: 1 }))).toEqual({
      stage: 2, rounds: 3, won: 1, stake: 100, prize: 200,
    });
  });

  it("dans le hall et sur la feuille : la manche, l'enjeu sans détour, et ce qu'il y a au bout", () => {
    const at = (n: number) => duelOf(lobby("kiosque", n), wins({ kiosque: n }));
    expect([0, 1, 2, 3].map((n) => stageText(at(n)))).toEqual(["Manche 1 sur 3", "Manche 2 sur 3", "Manche 3 sur 3", "Revanche"]);
    // Sous la bulle de l'hôte : la manche ; l'histoire ouverte, le rappel qu'elle attend dans les Souvenirs.
    expect([0, 1, 2, 3].map((n) => duelProgressText(at(n)))).toEqual([
      "Manche 1 sur 3", "Manche 2 sur 3", "Manche 3 sur 3", "Son histoire t'attend dans tes Souvenirs.",
    ]);
    // L'enjeu : ce que chacun pose, ce que le gagnant emporte. Les mots du propriétaire, au Kiosque.
    expect(duelStakesText(at(0))).toBe(`Chacun pose 100${NBSP}€. Le gagnant repart avec 200${NBSP}€.`);
    expect(duelStakesText(at(1))).toBe(`Chacun pose 200${NBSP}€. Le gagnant repart avec 400${NBSP}€.`);
    expect(duelStakesText(at(2))).toBe(`Chacun pose 400${NBSP}€. Le gagnant repart avec 800${NBSP}€.`);
    // Ce qu'il y a au bout des trois manches.
    expect(duelStoryText(at(0), "gaspard")).toBe("Gagne les trois manches, et Gaspard te raconte son histoire.");
    expect(duelStoryText(at(1), "baron")).toBe("Gagne les trois manches, et le Baron te raconte son histoire.");
    expect(duelStoryText(at(2), "balthazar")).toBe("Gagne cette manche, et le Commodore te raconte son histoire.");
    expect(duelStoryText(at(3), "gaspard")).toBe("Son histoire est déjà dans tes Souvenirs : on rejoue pour l'honneur.");
    setLang("en");
    // Ni « his » ni « her » : chaque phrase vaut pour les huit hôtes. Les Souvenirs sont « Memories », comme aux Réglages.
    expect([0, 1, 2, 3].map((n) => stageText(at(n)))).toEqual(["Round 1 of 3", "Round 2 of 3", "Round 3 of 3", "Rematch"]);
    expect(duelProgressText(at(3))).toBe("Story unlocked: see your Memories.");
    expect(duelStakesText(at(1))).toBe("Each puts up €200. The winner leaves with €400.");
    expect(duelStoryText(at(0), "ondine")).toBe("Win all three rounds, and you'll hear Ondine's story.");
    expect(duelStoryText(at(2), "balthazar")).toBe("Win this round, and you'll hear the Commodore's story.");
    expect(duelStoryText(at(3), "selene")).toBe("The story is already in your Memories: this one is for honour.");
  });

  it("la manche qu'une table vient de jouer : celle que dit la table, départagée par les victoires pour la revanche", () => {
    // Gagnée : le compte vient de monter.
    expect(playedStage(1, 1, true)).toBe(1);
    expect(playedStage(2, 2, true)).toBe(2);
    expect(playedStage(3, 3, true)).toBe(3);
    // La table dit « 3 » aussi pour une revanche : au-delà de trois victoires, c'en était une.
    expect(playedStage(3, 4, true)).toBe("revanche");
    expect(playedStage(3, 12, true)).toBe("revanche");
    // Perdue : le compte n'a pas bougé.
    expect(playedStage(1, 0, false)).toBe(1);
    expect(playedStage(2, 1, false)).toBe(2);
    expect(playedStage(3, 2, false)).toBe(3);
    expect(playedStage(3, 3, false)).toBe("revanche");
    // Une table qui ne dit pas sa manche (ouverte avant les trois manches) : elle se déduit des victoires.
    expect(playedStage(undefined, 1, true)).toBe(1);
    expect(playedStage(undefined, 1, false)).toBe(2);
    expect(playedStage(undefined, 5, false)).toBe("revanche");
    // Un état pas encore à jour ne fait pas mentir la table sur ses deux premières manches.
    expect(playedStage(1, 0, true)).toBe(1);
    expect(playedStage(2, 0, true)).toBe(2);
  });

  it("le panneau d'une manche gagnée : la suivante et sa mise doublée, puis l'histoire, puis plus rien", () => {
    expect(duelWon(1, 100, "gaspard")).toEqual({
      titre: "Manche 1 gagnée !", suite: { texte: `Manche 2 : la mise double, 200${NBSP}€.`, ouverte: false }, textes: [],
    });
    expect(duelWon(2, 200, "gaspard")).toEqual({
      titre: "Manche 2 gagnée !", suite: { texte: `Manche 3 : la mise double, 400${NBSP}€.`, ouverte: false }, textes: [],
    });
    // La troisième : son histoire s'ouvre dans les Souvenirs.
    expect(duelWon(3, 400, "gaspard")).toEqual({
      titre: "Manche 3 gagnée !",
      suite: { texte: "Gaspard a une histoire à te raconter : elle t'attend dans tes Souvenirs.", ouverte: true },
      textes: [],
    });
    expect(duelWon(3, 400, "baron").suite?.texte).toBe("Le Baron a une histoire à te raconter : elle t'attend dans tes Souvenirs.");
    expect(storyOpenedText("selene")).toBe("Dame Séléné a une histoire à te raconter : elle t'attend dans tes Souvenirs.");
    // En revanche : plus rien à annoncer.
    expect(duelWon("revanche", 400, "gaspard")).toEqual({ titre: "Revanche gagnée !", suite: null, textes: [] });
    // Sans la mise de la table, on annonce la manche, pas un montant inventé.
    expect(duelWon(1, 0, "gaspard").suite?.texte).toBe("Manche 2 : la mise double.");
    setLang("en");
    expect(duelWon(1, 100, "gaspard")).toEqual({ titre: "Round 1 won!", suite: { texte: "Round 2: the stake doubles, €200.", ouverte: false }, textes: [] });
    expect(duelWon(3, 400, "balthazar").suite?.texte).toBe("The Commodore has a story to tell you: it's waiting in your Memories.");
    expect(duelWon("revanche", 400, "gaspard").titre).toBe("Rematch won!");
  });

  it("le panneau d'une manche perdue : la mise qu'on y laisse, et la même manche qui attend", () => {
    expect(duelLost(1, 100)).toEqual({
      titre: "Manche 1 perdue", suite: null,
      textes: [`Tu y laisses ta mise : 100${NBSP}€.`, "La manche 1 t'attend : retente-la quand tu veux."],
    });
    expect(duelLost(3, 400).textes).toEqual([`Tu y laisses ta mise : 400${NBSP}€.`, "La manche 3 t'attend : retente-la quand tu veux."]);
    expect(duelLost("revanche", 400)).toEqual({
      titre: "Revanche perdue", suite: null, textes: [`Tu y laisses ta mise : 400${NBSP}€.`, "Elle se retente quand tu veux."],
    });
    // Jamais une moquerie : une somme, et une invitation.
    for (const stage of [1, 2, 3, "revanche"] as const) {
      const ending = duelLost(stage, 400);
      expect(ending.textes.join(" ")).toMatch(/quand tu veux/);
      expect(ending.suite).toBeNull();
    }
    expect(duelLost(2, 0).textes).toEqual(["La manche 2 t'attend : retente-la quand tu veux."]);
    setLang("en");
    expect(duelLost(2, 200)).toEqual({
      titre: "Round 2 lost", suite: null, textes: ["You leave your stake behind: €200.", "Round 2 is waiting: try it again whenever you like."],
    });
    expect(duelLost("revanche", 400).titre).toBe("Rematch lost");
  });

  it("l'avantage qui bascule : l'hôte passe devant, ou le joueur ; rien quand la main ne change pas l'ordre", () => {
    const view = (meStack: number, hostStack: number, meNet: number): Parameters<typeof leadShift>[0] => ({
      kind: "defi", phase: "denouement", you: 0, handNo: 4,
      seats: [seat(0, { stack: meStack }), seat(1, { pseudo: null, bot: "gaspard", stack: hostStack })],
      result: { ...EXEMPLE, no: 4, net: [{ seat: 0, amount: meNet }, { seat: 1, amount: -meNet }] },
    });
    // À égalité (100 chacun), l'hôte gagne 20 : il prend l'avantage.
    expect(leadShift(view(80, 120, -20))).toBe("avantage");
    // À égalité, le joueur gagne 20 : l'hôte passe derrière.
    expect(leadShift(view(120, 80, 20))).toBe("recul");
    // L'hôte menait déjà (130 contre 70) et gagne encore : rien ne bascule.
    expect(leadShift(view(50, 150, -20))).toBeNull();
    // Le joueur menait (140 contre 60), l'hôte en reprend 30 sans repasser devant : rien.
    expect(leadShift(view(110, 90, -30))).toBeNull();
    // Le joueur menait (110 contre 90), l'hôte en reprend 30 : il repasse devant.
    expect(leadShift(view(80, 120, -30))).toBe("avantage");
    // Retour à l'égalité : personne ne mène, personne ne parle.
    expect(leadShift(view(100, 100, -20))).toBeNull();
    // Hors d'un dénouement, hors d'un défi, ou sur le résultat d'une autre main : rien.
    expect(leadShift({ ...view(80, 120, -20), phase: "encheres" })).toBeNull();
    expect(leadShift({ ...view(80, 120, -20), kind: "maison" })).toBeNull();
    expect(leadShift({ ...view(80, 120, -20), handNo: 5 })).toBeNull();
    expect(leadShift({ ...view(80, 120, -20), you: null })).toBeNull();
  });

  it("aucune de ces phrases ne reste en français, et chacune tient sur un panneau : 90 caractères au plus", () => {
    for (const lang of LANGUES) {
      setLang(lang);
      const said: string[] = [];
      for (const place of PLACES) {
        for (let n = 0; n <= 3; n++) {
          const duel = duelOf(lobby(place.id, n), wins({ [place.id]: n }));
          said.push(stageText(duel), duelProgressText(duel), duelStakesText(duel), duelStoryText(duel, place.host));
          const won = duelWon(duel.stage, duel.stake, place.host);
          const lost = duelLost(duel.stage, duel.stake);
          said.push(won.titre, lost.titre, ...lost.textes);
          if (won.suite) said.push(won.suite.texte);
        }
      }
      for (const texte of said) {
        expect([texte, len(texte) <= 90]).toEqual([texte, true]);
        // Aucune variable oubliée, aucun « undefined ».
        expect(texte).not.toMatch(/[{}]|undefined|null|NaN/);
        // En anglais, plus un mot de français.
        if (lang === "en") expect(texte).not.toMatch(/[Mm]anche|histoire|mise\b|Souvenirs|raconte|gagn|perdu/);
      }
    }
  });
});

// ---------------------------------------------------------------------------

describe("entre amis, deux façons de jouer : la table classique et la Table des Maîtres", () => {
  /** Une table entre amis en tournoi : le joueur au siège 0, une amie, un robot. */
  const friends = (over: Partial<Record<number, Partial<SeatView>>> = {}) => [
    seat(0, { stack: 300, ...over[0] }),
    seat(1, { pseudo: "Léa", stack: 300, ...over[1] }),
    seat(2, { pseudo: null, bot: "baron", species: null, stack: 300, ...over[2] }),
  ];

  it("le format tournoi : la Table des Maîtres, et une table entre amis créée à ses règles", () => {
    expect(isTournament({ kind: "maitres" })).toBe(true);
    expect(isTournament({ kind: "maitres", format: "tournoi" })).toBe(true);
    expect(isTournament({ kind: "privee", format: "tournoi" })).toBe(true);
    // Une table classique, et toutes celles d'avant (un serveur plus ancien ne dit pas le format).
    expect(isTournament({ kind: "privee", format: "classique" })).toBe(false);
    expect(isTournament({ kind: "privee" })).toBe(false);
    expect(isTournament({ kind: "maison", format: "classique" })).toBe(false);
    expect(isTournament({ kind: "defi", format: "classique" })).toBe(false);
  });

  it("la cagnotte d'un tournoi : trente blindes de départ, la même pour tous, comme à la Table des Maîtres", () => {
    expect(MASTERS_BLINDS).toBe(30);
    expect(tournamentStake(1)).toBe(30);
    expect(tournamentStake(500)).toBe(15_000);
    expect(tournamentStake(MASTERS_BLIND)).toBe(MASTERS_BUYIN);
    expect(tournamentStake(-5)).toBe(0);
  });

  it("combien de joueurs sont encore en jeu, le joueur compris", () => {
    expect(playersLeft({ seats: friends() })).toEqual({ left: 3, of: 3 });
    expect(playersLeft({ seats: friends({ 2: { out: true, stack: 0 } }) })).toEqual({ left: 2, of: 3 });
    // Un siège libre ne compte pas.
    expect(playersLeft({ seats: [...friends({ 1: { out: true, stack: 0 } }), null] })).toEqual({ left: 2, of: 3 });
    expect(playersLeftText(3)).toBe("3 joueurs en jeu");
    expect(playersLeftText(1)).toBe("");
    setLang("en");
    expect(playersLeftText(2)).toBe("2 players in");
  });

  it("ce que partir veut dire, à dire avant : rien à une table classique, son tapis laissé si un ami joue encore", () => {
    const table = (over: object = {}) => ({ kind: "privee" as const, format: "tournoi", you: 0, handNo: 3, seats: friends(), ...over });
    // Un autre humain est là et joue encore : partir, c'est abandonner. Le tapis reste sur la table.
    expect(quitMeans(table())).toBe("abandon");
    // À tapis, l'amie n'a plus rien devant elle mais joue encore la main : c'est toujours un abandon.
    expect(quitMeans(table({ seats: friends({ 1: { stack: 0, allIn: true, inHand: true } }) }))).toBe("abandon");
    // Sa cave attend encore la main suivante : elle est en jeu.
    expect(quitMeans(table({ seats: friends({ 1: { stack: 0, reserve: 300, inHand: false } }) }))).toBe("abandon");
    // L'amie est éliminée, ou partie : seul face au robot, on reprend son tapis, sans la victoire.
    expect(quitMeans(table({ seats: friends({ 1: { out: true, stack: 0, inHand: false } }) }))).toBe("seul");
    expect(quitMeans(table({ seats: [friends()[0]!, null, friends()[2]!] }))).toBe("seul");
    // On ne dispute rien à une absente : si les seuls autres humains sont absents, on repart avec son tapis.
    expect(quitMeans(table({ seats: friends({ 1: { absent: true } }) }))).toBe("seul");
    // Une cave qui n'est pas encore arrivée ne fait pas un adversaire.
    expect(quitMeans(table({ seats: friends({ 1: { funded: false } }) }))).toBe("seul");
    // Deux amies, dont une absente : l'autre joue, c'est un abandon.
    expect(quitMeans(table({ seats: [...friends({ 1: { absent: true } }), seat(3, { pseudo: "Max" })] }))).toBe("abandon");
    // Avant le lancement, rien n'est encore en jeu : on se lève avec sa cagnotte.
    expect(quitMeans(table({ handNo: 0 }))).toBe("libre");
    // Une table classique : on part quand on veut, avec son tapis.
    expect(quitMeans(table({ format: "classique" }))).toBe("libre");
    expect(quitMeans(table({ format: undefined }))).toBe("libre");
    // LA Table des Maîtres : le joueur y est le seul humain.
    expect(quitMeans({ kind: "maitres", format: "tournoi", you: 0, handNo: 5, seats: [seat(0), seat(1, { pseudo: null, bot: "hector" })] })).toBe("seul");
  });

  it("rejoindre une partie déjà lancée : la raison se dit une fois, par le serveur s'il vient de refuser, sinon par la feuille", () => {
    // L'aperçu montre un tournoi lancé : la feuille l'explique avant qu'on n'essaie.
    expect(startedSaidBy(true, null)).toBe("feuille");
    // On a essayé quand même (la partie a été lancée entre-temps) : le serveur répond `TABLE_STARTED`, et sa phrase suffit.
    expect(startedSaidBy(true, "TABLE_STARTED")).toBe("serveur");
    // Un serveur plus ancien dit seulement que la table est « complète » : la feuille reste la mieux placée pour expliquer.
    expect(startedSaidBy(true, "TABLE_FULL")).toBe("feuille");
    expect(startedSaidBy(true, "NETWORK")).toBe("feuille");
    // Une table qui n'est pas un tournoi lancé n'a rien de tel à dire : ses refus s'affichent tels quels.
    expect(startedSaidBy(false, null)).toBeNull();
    expect(startedSaidBy(false, "TABLE_FULL")).toBeNull();
    expect(startedSaidBy(false, "TABLE_STARTED")).toBeNull();
    // La phrase de la feuille, dans les deux langues : pourquoi on n'entre plus.
    const why = "La partie est lancée : on n'entre plus dans un tournoi en cours. Les cagnottes sont sur la table, et personne ne peut en ajouter une.";
    expect(t(why)).toBe(why);
    setLang("en");
    expect(t(why)).toBe("The game has started: nobody joins a tournament in progress. The kitties are on the table, and no one can add another.");
  });

  it("un tournoi entre amis est joué quand, au dénouement, plus personne d'autre n'a de jetons, ou que le joueur n'a plus rien", () => {
    const at = (seats: (SeatView | null)[], phase: TableView["phase"] = "denouement") => ({ kind: "privee" as const, format: "tournoi", phase, you: 0, seats });
    expect(tournamentDecided(at(friends()))).toBe(false);
    // L'amie n'a plus rien, le robot non : la partie continue.
    expect(tournamentDecided(at(friends({ 1: { stack: 0 } })))).toBe(false);
    // Plus aucun adversaire, humain ou robot : c'est gagné.
    expect(tournamentDecided(at(friends({ 0: { stack: 900 }, 1: { stack: 0 }, 2: { stack: 0 } })))).toBe(true);
    // Le joueur n'a plus rien : c'est fini pour lui, même si la table continue pour les autres.
    expect(tournamentDecided(at(friends({ 0: { stack: 0 } })))).toBe(true);
    // Pendant une main, rien n'est décidé : un joueur à tapis joue encore.
    expect(tournamentDecided(at(friends({ 0: { stack: 0 } }), "encheres"))).toBe(false);
    // Une table classique ne finit jamais d'elle-même.
    expect(tournamentDecided({ ...at(friends({ 0: { stack: 0 } })), format: "classique" })).toBe(false);
  });

  it("les deux modes ont un nom et une règle en une phrase, dans les deux langues", () => {
    expect([...FRIENDS_MODES]).toEqual(["classique", "tournoi"]);
    expect(FRIENDS_MODES.map(modeName)).toEqual(["Table classique", "Table des Maîtres"]);
    // Classique : sa cave, la recave, on part quand on veut avec son tapis.
    expect(modeRule("classique")).toMatch(/choisit sa cave/);
    expect(modeRule("classique")).toMatch(/recaver/);
    expect(modeRule("classique")).toMatch(/avec son tapis/);
    // Table des Maîtres : la même cagnotte, pas de recave, la blinde monte, on est éliminé, le dernier remporte tout.
    for (const mot of [/même cagnotte/, /sans recave/, /blinde monte/, /éliminé/, /dernier assis remporte tout/]) expect(modeRule("tournoi")).toMatch(mot);
    setLang("en");
    expect(FRIENDS_MODES.map(modeName)).toEqual(["Classic table", "Masters' Table"]);
    for (const mot of [/same kitty/, /no topping up/, /blind goes up/, /knocked out/, /last one seated takes it all/]) expect(modeRule("tournoi")).toMatch(mot);
    expect(modeRule("classique")).toMatch(/buy-in/);
    // Une phrase, pas un paragraphe : elle tient sous son bouton, sur un téléphone de 320 px.
    for (const lang of LANGUES) {
      setLang(lang);
      for (const mode of FRIENDS_MODES) expect([lang, mode, len(modeRule(mode)) <= 150]).toEqual([lang, mode, true]);
    }
  });

  it("LA Table des Maîtres du hall ne se confond pas avec le mode du même nom : elle se joue contre quatre maîtres des lieux", () => {
    // Dans le hall : « La Table des Maîtres », contre quatre hôtes ; entre amis, le mode n'en parle pas.
    expect(t("Contre quatre maîtres des lieux, tirés au sort")).toMatch(/maîtres des lieux/);
    expect(modeRule("tournoi")).not.toMatch(/maîtres des lieux|tirés au sort/);
    expect(t("Une table classique, ou aux règles de la Table des Maîtres : tu choisis en la créant.")).toMatch(/aux règles de la Table des Maîtres/);
    // À la table : celle des hôtes s'appelle « Table des Maîtres » ; celle des amis garde son code.
    expect(tableTitle({ kind: "maitres", place: null, code: "QR24F" })).toBe("Table des Maîtres");
    expect(tableTitle({ kind: "privee", place: null, code: "QR24F" })).toBe("Table QR24F");
    setLang("en");
    expect(t("Contre quatre maîtres des lieux, tirés au sort")).toBe("Against four of your hosts, drawn by lot");
    expect(t("La Table des Maîtres du hall se joue ainsi, contre quatre maîtres des lieux : elle seule compte pour le trophée.")).toMatch(/it alone counts towards the trophy/);
    expect(tableTitle({ kind: "privee", place: null, code: "QR24F" })).toBe("Table QR24F");
  });

  it("les fins d'un tournoi entre amis : il remporte la table, il est éliminé, il abandonne, ou il se lève seul face aux robots", () => {
    // Gagné : les mêmes mots qu'à la Table des Maîtres, et tout ce qu'il y avait sur la table.
    expect(mastersEnding("maitres-gagne", 45_000, true)).toEqual({ titre: "La table est à toi !", texte: `Tu remportes 45${THIN}000${NBSP}€.`, somme: "Tu remportes" });
    // Éliminé : sa cagnotte reste aux autres. Pas de maître tiré au sort ici, pas de table qui rouvre.
    const lost = mastersEnding("maitres-perdu", 0, true);
    expect(lost).toEqual({ titre: "Le tournoi s'arrête là pour toi", texte: "Ta cagnotte reste sur la table : le dernier assis remportera tout.", somme: null });
    expect(lost.texte).not.toMatch(/tirés au sort|rouvre/);
    // Abandon (un ami jouait encore) : rien ne revient à la bourse, et le panneau le redit.
    expect(mastersEnding("quitte", 0, true)).toEqual({
      titre: "Tu abandonnes le tournoi", texte: "Ton tapis est resté sur la table : le dernier assis le remportera.", somme: null,
    });
    // Seul face aux robots : il reprend son tapis, sans la victoire.
    expect(mastersEnding("quitte", 14_500, true)).toEqual({
      titre: "Tu te lèves de table", texte: `Tu repars avec ton tapis, 14${THIN}500${NBSP}€, sans la victoire.`, somme: null,
    });
    // La Table des Maîtres du hall garde ses propres mots.
    expect(mastersEnding("maitres-perdu", 0).titre).toBe("Les maîtres gardent la table");
    // Match nul (tous ceux de la dernière main à tapis et démasqués) : ni gagné ni perdu, le pot est partagé,
    // et le panneau dit ce qu'on en reprend. C'est une fin de tournoi comme les autres, avec son panneau.
    expect(isMastersEnd("maitres-nul")).toBe(true);
    expect(mastersEnding("maitres-nul", 15_000, true)).toEqual({
      titre: "Match nul", texte: `Plus personne n'a de jetons : le pot est partagé, et tu en reprends 15${THIN}000${NBSP}€.`, somme: null,
    });
    expect(mastersEnding("maitres-nul", 0, true)).toEqual({ titre: "Match nul", texte: "Plus personne n'a de jetons : le pot est partagé.", somme: null });
    // Pas de somme à fêter, pas de reproche non plus.
    expect(mastersEnding("maitres-nul", 15_000, true).texte).not.toMatch(/perdu|éliminé|abandon/);
    setLang("en");
    expect(mastersEnding("maitres-nul", 15_000, true)).toEqual({
      titre: "A draw", texte: "Nobody has any chips left: the pot is split, and you take back €15,000.", somme: null,
    });
    expect(mastersEnding("maitres-nul", 0, true).texte).toBe("Nobody has any chips left: the pot is split.");
    expect(mastersEnding("maitres-perdu", 0, true).titre).toBe("The tournament ends here for you");
    expect(mastersEnding("quitte", 0, true)).toEqual({
      titre: "You abandon the tournament", texte: "Your stack stayed on the table: the last one seated will win it.", somme: null,
    });
    expect(mastersEnding("quitte", 14_500, true).texte).toBe("You leave with your stack, €14,500, but without the win.");
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
      "Un seul tour d'enchères, sans limite : parole, mise, relance, jusqu'à faire tapis, ou tu te couches.",
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
      // Les noms des unités de la mise saisie, dits par un lecteur d'écran (textes.ts).
      "euros", "milliers d'euros", "millions d'euros", "milliards d'euros", "billions d'euros",
      // Les deux façons de jouer entre amis : le nom de chaque mode et sa règle (textes.ts).
      "Table classique", "Table des Maîtres",
      "Chacun choisit sa cave et peut recaver. On s'assoit et on part quand on veut, avec son tapis.",
      "Chacun pose la même cagnotte, sans recave. La blinde monte, qui n'a plus rien est éliminé, et le dernier assis remporte tout.",
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
    expect(entries.filter((e) => /cagnotte/i.test(e.fr) && !/kitt(y|ies)/i.test(e.en)).map((e) => e.fr)).toEqual([]);
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

  it("la mise saisie : quoi qu'on tape, le montant part dans la fourchette, et le vrai serveur l'accepte", async () => {
    const KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "effacer"];
    const seen = { sent: 0, min: 0, max: 0, inside: 0, tapis: 0, raises: 0, added: 0, decimals: 0 };
    const tables: readonly (readonly ["maison" | "defi" | "maitres", number])[] = [
      ["maison", 31], ["maison", 2_031], ["defi", 32], ["defi", 4_032], ["maitres", 33], ["maitres", 9_033],
    ];
    for (const [kind, seed] of tables) {
      const w = makeWorld(seed);
      const created = await w.call<{ playerId: string; code: string }>("POST", "/api/players", { pseudo: `Tape${seed}`, species: "renard" });
      const auth = `${created.body.playerId}.${created.body.code}`;
      w.storage.poke(created.body.playerId, (p) => {
        p.balance = kind === "maitres" ? MASTERS_BUYIN * 2 : 50_000;
        if (kind === "maitres") p.pokerWins = PLACES.map((place) => place.id);
      });
      const body = kind === "maison" ? { maison: "kiosque", buyIn: 100 } : kind === "defi" ? { defi: "kiosque" } : { maitres: true };
      const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", body, auth);
      expect(opened.status).toBe(201);
      let view = opened.body.view!;
      let left: PokerTableResponse["left"];
      const refused: string[] = [];
      for (let step = 0; step < 6_000 && view.handNo <= 40 && !left; step++) {
        const o = view.options;
        const range = o.bet ?? o.raise;
        let action: PokerAction | null = null;
        let expected: { stack: number } | null = null;
        if (view.phase === "encheres" && o.fold && range && w.pick(4) !== 0) {
          // Ce que la feuille laisse faire : une unité de la table, des touches au hasard (ou « 0 », ou « 999999 »).
          const units = unitsFor(range);
          const unit = units[w.pick(units.length)]!;
          const mode = w.pick(6);
          let text = mode === 0 ? "0" : mode === 1 ? "999999" : "";
          if (text === "") for (let i = 0, n = 1 + w.pick(5); i < n; i++) text = pressKey(text, KEYS[w.pick(KEYS.length)]!, unit);
          // Une fois sur trois, un montant plausible : autour de la plus petite mise.
          if (mode >= 4) text = String(Math.floor((range.min / unit) * (1 + w.pick(4)))) + (decimalsFor(unit) > 0 && w.pick(2) === 0 ? `,${w.pick(10)}` : "");
          const amount = typedAmount(text, unit);
          const me = view.seats[view.you!]!;
          const bet = amount === null ? null : typedBet(amount, o, me.bet, me.stack);
          if (bet) {
            action = bet.action;
            expected = { stack: bet.left };
            // Ce qui part est un entier, dans la fourchette que le serveur vient de donner.
            expect(Number.isInteger(bet.amount)).toBe(true);
            expect(bet.amount).toBeGreaterThanOrEqual(range.min);
            expect(bet.amount).toBeLessThanOrEqual(range.max);
            if (bet.action.type !== "tapis") expect(bet.action).toEqual({ type: o.bet ? "miser" : "relancer", amount: bet.amount });
            seen.sent++;
            if (bet.moved === "min") seen.min++;
            else if (bet.moved === "max") seen.max++;
            else seen.inside++;
            if (bet.allIn) seen.tapis++;
            if (!o.bet) seen.raises++;
            if (!o.bet && bet.added !== bet.amount) seen.added++;
            if (text.includes(",")) seen.decimals++;
          }
        }
        action ??= tap(view, w.pick);
        if (action) {
          const hand = view.handNo;
          const r = await w.call<PokerTableResponse & { error?: { code: string } }>("POST", "/api/poker/act", { code: view.code, action, step: view.step }, auth);
          if (r.status !== 200) refused.push(`${kind} ${seed}, main ${view.handNo}, ${view.phase} : ${JSON.stringify(action)} sur ${JSON.stringify(range)} → ${r.body.error?.code}`);
          else if (r.body.view) view = r.body.view;
          left = r.body.left;
          // Le serveur a compté ce que la feuille annonçait : il reste devant le joueur ce qu'elle disait.
          if (expected && r.status === 200 && !left && view.handNo === hand && (view.phase === "encheres" || view.phase === "abattage")) {
            expect(view.seats[view.you!]!.stack).toBe(expected.stack);
          }
          if (!left && view.options.rebuy && view.seats[view.you!]!.stack < view.blind) {
            const rebuy = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: view.code, action: { type: "recaver", amount: view.options.rebuy.max } }, auth);
            if (rebuy.status === 200) view = rebuy.body.view!;
          }
          continue;
        }
        w.tick(1_000);
        const r = await w.call<PokerTableResponse | { unchanged: true }>("GET", `/api/poker/table?code=${view.code}&v=${view.version}`, undefined, auth);
        if ("unchanged" in r.body) continue;
        if (r.body.view) view = r.body.view;
        left = r.body.left;
      }
      // Jamais une erreur du serveur : ni montant hors bornes, ni montant non entier.
      expect(refused).toEqual([]);
    }
    // Tout a été essayé : des montants trop petits, trop gros (des tapis), justes, des relances, des virgules.
    expect(seen.sent).toBeGreaterThan(60);
    for (const key of ["min", "max", "inside", "tapis", "raises", "decimals"] as const) expect([key, seen[key] > 0]).toEqual([key, true]);
  });

  it("les trois manches contre le vrai serveur : la mise double, le gagnant emporte tout, la troisième ouvre l'histoire", async () => {
    const w = makeWorld(1_203);
    const created = await w.call<{ playerId: string; code: string }>("POST", "/api/players", { pseudo: "Conteuse", species: "renard" });
    const auth = `${created.body.playerId}.${created.body.code}`;
    const START = 50_000;
    w.storage.poke(created.body.playerId, (p) => {
      p.balance = START;
    });
    const hall = async () => (await w.call<PokerLobbyResponse>("GET", "/api/poker", undefined, auth)).body;
    const kiosque = async () => {
      const lobby = await hall();
      return { lobby, duel: duelOf(lobby.challenges.find((c) => c.place === "kiosque")!, lobby.state.hostWins) };
    };
    // Un joueur qui débarque : la manche 1 de chacun des huit hôtes.
    const first = await hall();
    expect(first.state.hostWins).toEqual(Object.fromEntries(PLACES.map((place) => [place.id, 0])));
    for (const c of first.challenges) expect([c.place, duelOf(c, first.state.hostWins).stage]).toEqual([c.place, 1]);

    /** Ce que le panneau de fin annonce après chaque manche gagnée, et ce que le hall proposait avant. */
    const told: (string | null)[] = [];
    const stakes: number[] = [];
    let wins = 0;
    let lost = 0;
    let balance = START;
    for (let game = 0; game < 80 && wins < 4; game++) {
      const before = await kiosque();
      // Le hall dit la manche à jouer, sa mise, et ce que le gagnant emporte : les deux mises.
      expect(before.duel.stage).toBe(stageOf(wins));
      expect(before.duel.won).toBe(Math.min(3, wins));
      expect(before.duel.stake).toBe(100 * 2 ** (Math.min(3, wins + 1) - 1));
      expect(before.duel.prize).toBe(before.duel.stake * 2);
      const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", { defi: "kiosque" }, auth);
      expect(opened.status).toBe(201);
      let view = opened.body.view!;
      // La table dit sa manche, et chacun y a posé la mise annoncée.
      expect(view.level).toBe(Math.min(3, wins + 1));
      expect(playedStage(view.level, wins, false)).toBe(before.duel.stage);
      expect(view.maxBuyIn).toBe(before.duel.stake);
      expect(view.seats.map((s) => (s ? s.stack + s.committed : null))).toEqual([before.duel.stake, before.duel.stake]);
      let left: PokerTableResponse["left"];
      let state: PokerTableResponse["state"];
      const refused: string[] = [];
      for (let step = 0; step < 20_000 && !left; step++) {
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
      expect(left && ["defi-gagne", "defi-perdu", "defi-nul"].includes(left.reason)).toBe(true);
      // L'état du joueur arrive avec la fin de table : le panneau n'a rien à relire pour savoir où en est le défi.
      expect(state).toBeDefined();
      // Plus de cagnotte versée à part : ce qu'on gagne, c'est ce que l'hôte avait posé.
      expect(left!.bonus).toBe(0);
      const after = hostStory(state!.hostWins, "kiosque").wins;
      const stage = playedStage(view.level, after, left!.reason === "defi-gagne");
      expect(stage).toBe(before.duel.stage);
      if (left!.reason === "defi-gagne") {
        wins += 1;
        expect(after).toBe(wins);
        // Le gagnant repart avec tout : les deux mises.
        expect(left!.payout).toBe(before.duel.prize);
        balance += before.duel.stake;
        stakes.push(before.duel.stake);
        const ending = duelWon(stage, view.maxBuyIn, "gaspard");
        told.push(ending.suite?.texte ?? null);
      } else if (left!.reason === "defi-perdu") {
        // Perdre, c'est perdre sa mise : un vrai enjeu. Et la même manche attend.
        lost += 1;
        expect(after).toBe(wins);
        expect(left!.payout).toBe(0);
        balance -= before.duel.stake;
        expect(duelLost(stage, view.maxBuyIn).textes[0]).toBe(`Tu y laisses ta mise : ${formatEuros(before.duel.stake)}.`);
      } else {
        expect(after).toBe(wins);
        balance += left!.payout - before.duel.stake;
      }
      expect(state!.balance).toBe(balance);
      // Le hall dit la même chose, et ne compte que cet hôte-là.
      const now = await kiosque();
      expect(now.lobby.state.hostWins).toEqual(state!.hostWins);
      expect(PLACES.filter((place) => place.id !== "kiosque").map((place) => now.lobby.state.hostWins[place.id])).toEqual([0, 0, 0, 0, 0, 0, 0]);
      expect(now.lobby.challenges.find((c) => c.place === "kiosque")?.won).toBe(wins > 0);
      expect(now.duel.stage).toBe(stageOf(wins));
    }
    expect(wins).toBe(4);
    // 100 €, puis 200 €, puis 400 € ; la revanche se joue aux conditions de la troisième manche.
    expect(stakes).toEqual([100, 200, 400, 400]);
    expect(told).toEqual([
      `Manche 2 : la mise double, 200${NBSP}€.`,
      `Manche 3 : la mise double, 400${NBSP}€.`,
      "Gaspard a une histoire à te raconter : elle t'attend dans tes Souvenirs.",
      // La revanche : plus rien à annoncer, l'histoire est ouverte.
      null,
    ]);
    const end = await kiosque();
    expect(duelProgressText(end.duel)).toBe("Son histoire t'attend dans tes Souvenirs.");
    expect(end.duel).toEqual({ stage: "revanche", rounds: 3, won: 3, stake: 400, prize: 800 });
    // Dans ce monde-là, le chemin est passé par des défaites : elles ont coûté leur mise, et rien d'autre.
    expect(lost).toBeGreaterThan(0);
  });

  it("un tournoi entre amis contre le vrai serveur : la cagnotte exacte, on n'entre plus une fois lancé, l'abandon laisse son tapis", async () => {
    const w = makeWorld(606);
    const mk = async (pseudo: string) => {
      const created = await w.call<{ playerId: string; code: string }>("POST", "/api/players", { pseudo, species: "renard" });
      w.storage.poke(created.body.playerId, (p) => {
        p.balance = 100_000;
      });
      return `${created.body.playerId}.${created.body.code}`;
    };
    const [alice, bob, carl] = [await mk("Alice"), await mk("Bob"), await mk("Carl")];
    const see = async (auth: string, code: string) => (await w.call<PokerTableResponse>("GET", `/api/poker/table?code=${code}`, undefined, auth)).body;

    // Ce que la feuille de création envoie en mode Table des Maîtres : la blinde, et la cagnotte qui en découle.
    const stake = tournamentStake(10);
    const made = await w.call<PokerTableResponse>("POST", "/api/poker/tables", { blind: 10, maxBuyIn: stake, seats: 4, bots: 1, difficulty: "facile", format: "tournoi" }, alice);
    expect(made.status).toBe(201);
    const view = made.body.view!;
    expect([view.kind, view.format, isTournament(view), view.started]).toEqual(["privee", "tournoi", true, false]);
    // Chacun pose la même cagnotte : trente blindes, ni plus ni moins.
    expect([view.minBuyIn, view.maxBuyIn]).toEqual([stake, stake]);
    expect(view.seats.filter((s) => s !== null).map((s) => s!.stack)).toEqual([stake, stake]);
    expect(view.options.rebuy).toBeNull();
    // Avant le lancement, rien n'est encore en jeu : se lever ne coûte rien.
    expect(quitMeans(view)).toBe("libre");

    // Bob voit la table avant de s'asseoir : la feuille « rejoindre » lui annonce le mode et la cagnotte.
    const preview = (await see(bob, view.code)).view!;
    expect([preview.you, isTournament(preview), preview.started, preview.maxBuyIn]).toEqual([null, true, false, stake]);
    // La cagnotte exacte : c'est celle que la feuille propose. Toute autre somme est refusée.
    const wrong = await w.call<{ error?: { code: string } }>("POST", "/api/poker/join", { code: view.code, buyIn: stake - 100 }, bob);
    expect(wrong.status).toBe(400);
    const joined = await w.call<PokerTableResponse>("POST", "/api/poker/join", { code: view.code, buyIn: preview.maxBuyIn }, bob);
    expect(joined.status).toBe(200);
    expect(playersLeft(joined.body.view!)).toEqual({ left: 3, of: 3 });

    // Alice lance : la blinde montera, et plus personne n'entre.
    const go = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: view.code, action: { type: "lancer" } }, alice);
    expect(go.status).toBe(200);
    expect(go.body.view!.started).toBe(true);
    expect(go.body.view!.rise).not.toBeNull();
    const late = (await see(carl, view.code)).view!;
    // La feuille de Carl le sait avant qu'il n'essaie : la table est lancée.
    expect([late.you, isTournament(late), late.started]).toEqual([null, true, true]);
    const refused = await w.call<{ error?: { code: string } }>("POST", "/api/poker/join", { code: view.code, buyIn: stake }, carl);
    expect(refused.status).toBe(409);

    // Alice se lève alors que Bob joue encore : la feuille « quitter » l'a prévenue, son tapis reste sur la table.
    const mine = (await see(alice, view.code)).view!;
    expect(quitMeans(mine)).toBe("abandon");
    const before = mine.seats[mine.you!]!.stack;
    expect(before).toBeGreaterThan(0);
    const quit = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: view.code, action: { type: "quitter" } }, alice);
    expect(quit.body.left).toEqual({ reason: "quitte", payout: 0, bonus: 0 });
    expect(quit.body.state?.balance).toBe(100_000 - stake);
    expect(mastersEnding("quitte", quit.body.left!.payout, true).titre).toBe("Tu abandonnes le tournoi");

    // Bob reste seul humain face au robot : s'il se lève, il reprend son tapis, sans la victoire.
    const his = (await see(bob, view.code)).view!;
    expect(quitMeans(his)).toBe("seul");
    const stack = his.seats[his.you!]!.stack;
    const leave = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: view.code, action: { type: "quitter" } }, bob);
    expect(leave.body.left?.reason).toBe("quitte");
    expect(leave.body.left!.payout).toBeGreaterThanOrEqual(stack);
    expect(mastersEnding("quitte", leave.body.left!.payout, true).titre).toBe("Tu te lèves de table");
  });

  it("un tournoi entre amis joué jusqu'au bout avec des robots : pas de recave, des éliminés, et le dernier assis remporte tout", async () => {
    const ends = new Set<string>();
    for (const seed of [41, 4_242, 77_041, 9_001, 123_457, 31]) {
      const w = makeWorld(seed);
      const created = await w.call<{ playerId: string; code: string }>("POST", "/api/players", { pseudo: `Amis${seed}`, species: "renard" });
      const auth = `${created.body.playerId}.${created.body.code}`;
      w.storage.poke(created.body.playerId, (p) => {
        p.balance = 50_000;
      });
      const stake = tournamentStake(20);
      const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", { blind: 20, maxBuyIn: stake, seats: 3, bots: 2, difficulty: "facile", format: "tournoi" }, auth);
      expect(opened.status).toBe(201);
      expect(opened.body.view!.options.start).toBe(true);
      const started = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: opened.body.view!.code, action: { type: "lancer" } }, auth);
      let view = started.body.view!;
      let left: PokerTableResponse["left"];
      let state: PokerTableResponse["state"];
      const refused: string[] = [];
      const out = new Set<number>();
      let lastBlind = 0;
      // Une fois sur deux le joueur connaît la table, une fois sur deux il tape au hasard : les deux fins se jouent.
      const policy = seed % 2 === 1 ? sleuth : (v: TableView) => tap(v, w.pick);
      for (let step = 0; step < 40_000 && !left; step++) {
        if (view.phase !== "fermee") {
          expect([view.kind, view.format]).toEqual(["privee", "tournoi"]);
          // Personne ne recave, la blinde ne fait que monter, un siège éliminé ne revient pas.
          expect(view.options.rebuy).toBeNull();
          expect(view.blind).toBeGreaterThanOrEqual(lastBlind);
          lastBlind = view.blind;
          for (const s of view.seats) {
            if (!s) continue;
            if (s.out) {
              out.add(s.seat);
              expect(seatStateText(s, view)).toBe("éliminé");
            } else expect([s.seat, out.has(s.seat)]).toEqual([s.seat, false]);
          }
          expect(playersLeft(view).left).toBe(3 - out.size);
          // Seul humain : se lever, c'est reprendre son tapis, jamais l'abandonner aux robots.
          expect(quitMeans(view)).toBe("seul");
        }
        const action = policy(view);
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
      // Les mêmes fins qu'à la Table des Maîtres : c'est le même panneau qui les dit.
      expect(left && isMastersEnd(left.reason)).toBe(true);
      expect([seed, ["maitres-gagne", "maitres-perdu"].includes(left!.reason)]).toEqual([seed, true]);
      // Le dernier assis remporte tout : les trois cagnottes. Éliminé : rien.
      expect(left!.payout).toBe(left!.reason === "maitres-gagne" ? stake * 3 : 0);
      expect(state?.balance).toBe(50_000 - stake + left!.payout);
      // Un tournoi entre amis ne compte ni pour la Table des Maîtres du hall, ni contre les hôtes.
      expect(state?.masters).toBe(0);
      expect(Object.values(state!.hostWins).every((n) => n === 0)).toBe(true);
      ends.add(left!.reason);
    }
    expect([...ends].sort()).toEqual(["maitres-gagne", "maitres-perdu"]);
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
    // Sur ces tables, des maîtres ont été éliminés sous les yeux du joueur.
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
    let won: { payout: number; masters: readonly string[]; hands: number; blind: number; announced: boolean } | null = null;
    // Ce joueur-là gagne plus d'une table sur deux : en dix tables, il en gagne une (à mille contre un près).
    for (const seed of [7_919, 15_838, 23_757, 31_676, 39_595, 47_514, 55_433, 63_352, 71_271, 79_190]) {
      const { w, auth, playerId } = await master(seed, MASTERS_BUYIN);
      const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", { maitres: true }, auth);
      expect(opened.status).toBe(201);
      let view = opened.body.view!;
      const seated = view.seats.filter((s): s is SeatView => s !== null && s.bot !== null).map((s) => s.bot!);
      // Avant cette table : deux manches déjà gagnées contre le premier maître assis ; les autres n'ont
      // perdu que leur première manche (un défi relevé avant les trois manches en vaut une).
      const firstPlace = PLACES.find((place) => place.host === seated[0])!.id;
      w.storage.poke(playerId, (p) => {
        p.hostWins = { [firstPlace]: 2 };
      });
      const refused: string[] = [];
      let left: PokerTableResponse["left"];
      let state: PokerTableResponse["state"];
      // Ce que l'écran montrerait au dernier dénouement : le bouton change de nom, le dernier maître a son mot.
      let lastWord = false;
      // La blinde en vigueur, et sa hausse : toujours annoncée avant d'arriver, à la main dite.
      let blind = view.blind;
      let announced = true;
      let rise = view.rise;
      for (let step = 0; step < 40_000 && !left; step++) {
        if (view.phase !== "fermee") {
          if (view.blind > blind) announced &&= rise !== null && rise.blind === view.blind && rise.hand <= view.handNo + 1;
          blind = view.blind;
          rise = view.rise;
        }
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
      // La Table des Maîtres ne compte pas comme une victoire contre ses hôtes : seules les manches d'un défi
      // ouvrent une histoire. Les comptes n'ont pas bougé, pas même pour celui qui en était à deux.
      for (const place of PLACES) expect([place.id, state!.hostWins[place.id]]).toEqual([place.id, place.id === firstPlace ? 2 : 1]);
      expect(lobby.body.state.hostWins).toEqual(state!.hostWins);
      won = { payout: left!.payout, masters: seated, hands: view.handNo, blind, announced };
      break;
    }
    expect(won).not.toBeNull();
    // Une table gagnée dure : la blinde a monté en chemin, et l'écran l'avait annoncée chaque fois.
    if (won!.hands > 12) expect(won!.blind).toBeGreaterThan(MASTERS_BLIND);
    expect(won!.announced).toBe(true);
    // Le panneau de la victoire : le montant tel qu'il s'écrit, et un mot de chacun des quatre maîtres.
    expect(mastersEnding("maitres-gagne", won!.payout).texte).toBe(`Tu remportes 1${THIN}500${NBSP}Bn€.`);
    expect(won!.masters.map((bot) => mastersLine(bot, "victoire")?.speaker)).toEqual(won!.masters);
    setLang("en");
    expect(mastersEnding("maitres-gagne", won!.payout).texte).toBe("You win €1,500T.");
    for (const bot of won!.masters) expect(mastersLine(bot, "victoire")?.text).toBe(MASTERS_TALK[bot as Host].en.victoire);
  });

  it("se lever pendant le dernier dénouement ne change rien : le résultat est acquis, l'écran y va sans feuille", async () => {
    const reasons = new Set<string>();
    // Un joueur qui tape au hasard perd, un joueur qui connaît la table en gagne plus d'une sur deux :
    // on joue jusqu'à avoir quitté ainsi une table gagnée et une table perdue.
    const tables: readonly (readonly [number, "hasard" | "limier"])[] = [
      [7, "hasard"], [21, "hasard"],
      [7_919, "limier"], [15_838, "limier"], [23_757, "limier"], [31_676, "limier"], [39_595, "limier"], [47_514, "limier"],
      [55_433, "limier"], [63_352, "limier"],
    ];
    for (const [seed, policy] of tables) {
      if (reasons.has("maitres-gagne") && reasons.has("maitres-perdu")) break;
      const { w, auth } = await master(seed, MASTERS_BUYIN);
      const opened = await w.call<PokerTableResponse>("POST", "/api/poker/tables", { maitres: true }, auth);
      let view = opened.body.view!;
      let left: PokerTableResponse["left"];
      for (let step = 0; step < 40_000 && !left; step++) {
        // Le tournoi est joué : la croix de l'en-tête quitte aussitôt, sans rien demander.
        if (tournamentDecided(view)) {
          const mine = view.seats[view.you!]!;
          const r = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: view.code, action: { type: "quitter" } }, auth);
          expect(r.status).toBe(200);
          left = r.body.left;
          // Ni « quitte », ni un tapis rendu : la table gagnée est gagnée, la table perdue est perdue.
          expect(left).toEqual(mine.stack > 0
            ? { reason: "maitres-gagne", payout: MASTERS_BUYIN * MASTERS_SEATS, bonus: 0 }
            : { reason: "maitres-perdu", payout: 0, bonus: 0 });
          expect(r.body.state?.masters).toBe(mine.stack > 0 ? 1 : 0);
          break;
        }
        const action = policy === "hasard" ? tap(view, w.pick) : sleuth(view);
        if (action) {
          const r = await w.call<PokerTableResponse>("POST", "/api/poker/act", { code: view.code, action, step: view.step }, auth);
          if (r.status === 200 && r.body.view) view = r.body.view;
          left = r.body.left;
          continue;
        }
        w.tick(1_000);
        const r = await w.call<PokerTableResponse | { unchanged: true }>("GET", `/api/poker/table?code=${view.code}&v=${view.version}`, undefined, auth);
        if ("unchanged" in r.body) continue;
        if (r.body.view) view = r.body.view;
        left = r.body.left;
      }
      expect(left).toBeDefined();
      reasons.add(left!.reason);
    }
    // Les deux fins ont été quittées ainsi, au moins une fois chacune.
    expect([...reasons].sort()).toEqual(["maitres-gagne", "maitres-perdu"]);
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
