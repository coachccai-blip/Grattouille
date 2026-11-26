// Économie (BRIEF.md, sections 6.2, 6.3, 6.5 et 6.7).

import { describe, expect, it } from "vitest";
import {
  TEMPERAMENTS, WEIGHT_TOTAL, drawGain, drawMultiplier, expectedReturn, losingWeight, maxGain,
  oddsLabel, prizeTable, uniformInt, weightAtLeast, winningShare, winningWeight,
} from "../shared/economy";
import { TICKETS, ticketById, ticketsOfPlace } from "../shared/tickets";
import { PLACES } from "../shared/places";
import type { Temperament } from "../shared/types";

const ALL: Temperament[] = ["pepere", "joueur", "casse-cou"];
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("tempéraments", () => {
  it("la somme des poids de chaque tempérament est inférieure à 100 000", () => {
    for (const t of ALL) {
      expect(winningWeight(t)).toBeLessThan(WEIGHT_TOTAL);
      expect(losingWeight(t)).toBeGreaterThan(0);
    }
  });

  it("les retours moyens calculés exactement valent 2,59, 3,15 et 4,89", () => {
    expect(expectedReturn("pepere")).toBe(2.59);
    expect(expectedReturn("joueur")).toBe(3.15);
    expect(expectedReturn("casse-cou")).toBe(4.89);
  });

  it("les proportions de tickets gagnants valent 61,525 %, 52,06 % et 37,44 %", () => {
    expect(winningShare("pepere")).toBe(0.61525);
    expect(winningShare("joueur")).toBe(0.5206);
    expect(winningShare("casse-cou")).toBe(0.3744);
  });

  it("les poids des tickets perdants sont ceux du brief", () => {
    expect(losingWeight("pepere")).toBe(38475);
    expect(losingWeight("joueur")).toBe(47940);
    expect(losingWeight("casse-cou")).toBe(62560);
  });

  it("les multiplicateurs sont croissants et les poids entiers positifs", () => {
    for (const t of ALL) {
      const rows = TEMPERAMENTS[t];
      expect(rows.length).toBe(10);
      for (let i = 0; i < rows.length; i++) {
        expect(Number.isInteger(rows[i]![1]) && rows[i]![1] > 0).toBe(true);
        if (i > 0) expect(rows[i]![0]).toBeGreaterThan(rows[i - 1]![0]);
      }
    }
  });

  it("gros gains et jackpots : les chances du tableau 6.2", () => {
    expect(plain(oddsLabel(weightAtLeast("pepere", 50)))).toBe("1 sur 108");
    expect(plain(oddsLabel(weightAtLeast("joueur", 50)))).toBe("1 sur 79");
    expect(plain(oddsLabel(weightAtLeast("casse-cou", 50)))).toBe("1 sur 69");
    expect(plain(oddsLabel(weightAtLeast("pepere", 500)))).toBe("1 sur 6 667");
    expect(plain(oddsLabel(weightAtLeast("joueur", 500)))).toBe("1 sur 2 500");
    expect(plain(oddsLabel(weightAtLeast("casse-cou", 500)))).toBe("1 sur 345");
    expect(plain(oddsLabel(winningWeight("pepere")))).toBe("1 sur 1,6");
    expect(plain(oddsLabel(winningWeight("joueur")))).toBe("1 sur 1,9");
    expect(plain(oddsLabel(winningWeight("casse-cou")))).toBe("1 sur 2,7");
  });

  it("les chances affichées sont celles des tableaux lisibles du brief", () => {
    const expected: Record<Temperament, string[]> = {
      pepere: ["2,6", "4,5", "5,6", "11", "15", "29", "62", "167", "400", "1 667", "6 667"],
      joueur: ["2,1", "5,9", "7,1", "12", "17", "25", "56", "125", "333", "833", "2 500"],
      "casse-cou": ["1,6", "11", "10", "11", "17", "50", "125", "286", "500", "1 250", "10 000"],
    };
    for (const t of ALL) {
      const table = prizeTable({ price: 1, temperament: t });
      expect(table.map((l) => plain(l.odds))).toEqual(expected[t].map((x) => `1 sur ${x}`));
    }
  });
});

describe("tirage", () => {
  it("drawMultiplier suit les poids cumulés, borne par borne", () => {
    for (const t of ALL) {
      let cumul = 0;
      for (const [m, w] of TEMPERAMENTS[t]) {
        expect(drawMultiplier(t, cumul)).toBe(m);
        expect(drawMultiplier(t, cumul + w - 1)).toBe(m);
        cumul += w;
      }
      expect(drawMultiplier(t, cumul)).toBe(0);
      expect(drawMultiplier(t, WEIGHT_TOTAL - 1)).toBe(0);
    }
  });

  it("chaque valeur de r tombe sur le bon nombre de lots", () => {
    for (const t of ALL) {
      const counts = new Map<number, number>();
      for (let r = 0; r < WEIGHT_TOTAL; r++) {
        const m = drawMultiplier(t, r);
        counts.set(m, (counts.get(m) ?? 0) + 1);
      }
      for (const [m, w] of TEMPERAMENTS[t]) expect(counts.get(m)).toBe(w);
      expect(counts.get(0)).toBe(losingWeight(t));
    }
  });

  it("uniformInt rejette les valeurs qui biaiseraient le modulo", () => {
    const limit = Math.floor(0x1_0000_0000 / WEIGHT_TOTAL) * WEIGHT_TOTAL;
    const values = [0xffff_ffff, limit, limit - 1];
    let i = 0;
    const r = uniformInt(WEIGHT_TOTAL, () => values[i++]!);
    expect(i).toBe(3);
    expect(r).toBe((limit - 1) % WEIGHT_TOTAL);
    expect(r).toBe(WEIGHT_TOTAL - 1);
  });

  it("uniformInt reste dans [0, max[", () => {
    let s = 12345;
    const next = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s;
    };
    for (let k = 0; k < 20_000; k++) {
      const r = uniformInt(30, next);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(30);
    }
    expect(() => uniformInt(0, next)).toThrow();
  });

  it("drawGain rend un multiple du prix présent dans le tableau", () => {
    const def = ticketById("mille-pattes")!;
    const allowed = new Set([0, ...TEMPERAMENTS["casse-cou"].map(([m]) => m * def.price)]);
    let s = 99;
    const next = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s;
    };
    for (let k = 0; k < 5_000; k++) expect(allowed.has(drawGain(def, next))).toBe(true);
  });
});

describe("les trente tickets", () => {
  /** Les quinze tickets du brief, dans l'ordre du tableau 6.4. */
  const BRIEF = [
    "tirelire", "signe-du-homard", "tic-tac-truffe", "lucarne", "reussite", "bas-de-laine", "vingt-et-un",
    "bandit-manchot", "mille-pattes", "pie-voleuse", "caviar-champagne", "grand-prix", "regate",
    "moustache-dor", "grand-grattouille",
  ];

  it("trente tickets, de trois à cinq par lieu, les trois tempéraments dans chaque lieu", () => {
    expect(TICKETS.length).toBe(30);
    expect(new Set(TICKETS.map((t) => t.id)).size).toBe(30);
    expect(new Set(TICKETS.map((t) => t.name)).size).toBe(30);
    expect(PLACES.map((p) => ticketsOfPlace(p.id).length)).toEqual([4, 5, 4, 4, 4, 3, 3, 3]);
    for (const place of PLACES) {
      const list = ticketsOfPlace(place.id);
      expect(new Set(list.map((t) => t.temperament)).size).toBe(3);
      // Le moins cher est un pépère, le plus cher un casse-cou : c'est lui que l'on trouve par terre.
      expect(list[0]!.temperament).toBe("pepere");
      expect(list[list.length - 1]!.temperament).toBe("casse-cou");
    }
  });

  it("les prix montent de lieu en lieu, sans trou ni chevauchement", () => {
    let previous = 0;
    for (const place of PLACES) {
      const prices = ticketsOfPlace(place.id).map((t) => t.price);
      expect(new Set(prices).size).toBe(prices.length);
      expect(prices[0]!).toBeGreaterThan(previous);
      // D'un lieu au suivant, le premier ticket ne coûte jamais plus de 50 fois le dernier.
      if (previous > 0) expect(prices[0]! / previous).toBeLessThanOrEqual(50);
      previous = prices[prices.length - 1]!;
    }
  });

  it("le plus gros lot du jeu reste un entier exact", () => {
    const top = Math.max(...TICKETS.map((t) => maxGain(t)));
    expect(top).toBe(5_000_000_000_000_000);
    expect(Number.isSafeInteger(top)).toBe(true);
  });

  it("les quinze tickets du brief : prix et gains maximaux du tableau 6.4", () => {
    const expected: [string, number, number][] = [
      ["tirelire", 1, 500],
      ["signe-du-homard", 2, 2_000],
      ["tic-tac-truffe", 5, 25_000],
      ["lucarne", 10, 5_000],
      ["reussite", 20, 20_000],
      ["bas-de-laine", 50, 250_000],
      ["vingt-et-un", 100, 50_000],
      ["bandit-manchot", 500, 500_000],
      ["mille-pattes", 2_000, 10_000_000],
      ["pie-voleuse", 10_000, 5_000_000],
      ["caviar-champagne", 50_000, 50_000_000],
      ["grand-prix", 250_000, 1_250_000_000],
      ["regate", 1_000_000, 500_000_000],
      ["moustache-dor", 5_000_000, 5_000_000_000],
      ["grand-grattouille", 25_000_000, 125_000_000_000],
    ];
    const brief = BRIEF.map((id) => TICKETS.find((t) => t.id === id)!);
    expect(brief.map((t) => [t.id, t.price, maxGain(t)])).toEqual(expected);
    expect(brief.map((t) => t.engine)).toEqual([
      "trio", "etoile", "morpion", "duel", "lignes", "numeros", "duel", "trio",
      "numeros", "trio", "etoile", "duel", "lignes", "morpion", "multi",
    ]);
  });

  it("les quinze suivants : prix, gains maximaux et moteurs", () => {
    const expected: [string, string, number, number][] = [
      ["saute-crabe", "parcours", 3, 1_500],
      ["grande-maree", "coef", 15, 15_000],
      ["grille-du-jour", "mots", 30, 15_000],
      ["rouge-et-noir", "camps", 1_000, 5_000_000],
      ["bonne-aventure", "etoile", 25_000, 25_000_000],
      ["pari-auguste", "parcours", 2_000_000, 2_000_000_000],
      ["cocktails", "lignes", 100_000_000, 50_000_000_000],
      ["babord-tribord", "camps", 500_000_000, 500_000_000_000],
      ["peche-au-gros", "trio", 2_000_000_000, 10_000_000_000_000],
      ["sesame", "mots", 5_000_000_000, 2_500_000_000_000],
      ["compte-numerote", "numeros", 20_000_000_000, 20_000_000_000_000],
      ["interets-composes", "coef", 100_000_000_000, 500_000_000_000_000],
      ["eclipse-totale", "camps", 250_000_000_000, 125_000_000_000_000],
      ["alignement", "morpion", 500_000_000_000, 500_000_000_000_000],
      ["gratte-ciel", "multi", 1_000_000_000_000, 5_000_000_000_000_000],
    ];
    const added = TICKETS.filter((t) => !BRIEF.includes(t.id));
    expect(added.map((t) => [t.id, t.engine, t.price, maxGain(t)])).toEqual(expected);
  });

  it("onze moteurs, tous utilisés", () => {
    expect([...new Set(TICKETS.map((t) => t.engine))].sort()).toEqual([
      "camps", "coef", "duel", "etoile", "lignes", "morpion", "mots", "multi", "numeros", "parcours", "trio",
    ]);
  });
});
