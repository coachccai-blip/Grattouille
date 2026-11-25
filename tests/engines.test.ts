// Moteurs de tickets (BRIEF.md, sections 7.1 à 7.9 et 17.4).

import { describe, expect, it } from "vitest";
import { TICKETS, ticketById } from "../shared/tickets";
import { buildLayout, cellIds, evaluate, matches } from "../src/engines";
import { decoy, mulberry32, palette, splitGain } from "../src/engines/common";
import { roundWon } from "../src/engines/duel";
import { DRAW_SIZE, LINE_COUNT } from "../src/engines/lignes";
import { completeLines } from "../src/engines/morpion";
import { optStrings } from "../src/engines/common";

const SEEDS = 500;

/** Graines réparties sur tout l'intervalle 32 bits. */
function seedAt(i: number): number {
  return (Math.imul(i + 1, 2654435761) ^ (i * 7919)) >>> 0;
}

describe("invariant : evaluate(buildLayout(def, gain, seed)) === gain", () => {
  for (const def of TICKETS) {
    it(`${def.name} : chaque gain possible, 0 compris, sur ${SEEDS} graines`, () => {
      const gains = [0, ...palette(def)];
      const picks = def.engine === "etoile" ? optStrings(def.options, "signs") : [undefined];
      expect(picks.length).toBeGreaterThan(0);
      for (const pick of picks) {
        for (const gain of gains) {
          for (let i = 0; i < SEEDS; i++) {
            const seed = seedAt(i);
            const layout = buildLayout(def, gain, seed, pick);
            const paid = evaluate(layout, pick);
            if (paid !== gain) {
              throw new Error(`${def.id} gain=${gain} seed=${seed} pick=${pick} paie ${paid}`);
            }
          }
        }
      }
    });
  }

  it("la grille est déterministe : mêmes valeurs, même grille", () => {
    for (const def of TICKETS) {
      const gain = palette(def)[3]!;
      const a = buildLayout(def, gain, 123456789, "tortue");
      const b = buildLayout(def, gain, 123456789, "tortue");
      expect(a).toEqual(b);
      const c = buildLayout(def, gain, 987654321, "tortue");
      expect(JSON.stringify(c)).not.toBe(JSON.stringify(a));
    }
  });

  it("toutes les cases grattées : les correspondances visibles paient exactement le gain", () => {
    for (const def of TICKETS) {
      for (const gain of [0, ...palette(def)]) {
        for (let i = 0; i < 40; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          const all = new Set(cellIds(layout));
          const list = matches(layout, all);
          const total = list.reduce((s, m) => s + m.amount, 0);
          expect(total).toBe(gain);
          expect(matches(layout, new Set()).length).toBe(0);
          // Les clés sont stables et uniques.
          expect(new Set(list.map((m) => m.key)).size).toBe(list.length);
        }
      }
    }
  });
});

describe("splitGain", () => {
  it("rend toujours des montants de la palette dont la somme est exacte", () => {
    for (const def of TICKETS) {
      const pal = palette(def);
      const set = new Set(pal);
      for (const gain of pal) {
        for (const maxParts of [1, 2, 3]) {
          for (let i = 0; i < 200; i++) {
            const parts = splitGain(gain, pal, maxParts, mulberry32(seedAt(i)));
            expect(parts.length).toBeGreaterThanOrEqual(1);
            expect(parts.length).toBeLessThanOrEqual(maxParts);
            expect(parts.every((p) => set.has(p))).toBe(true);
            expect(parts.reduce((s, p) => s + p, 0)).toBe(gain);
          }
        }
      }
    }
  });

  it("gain = 0 rend une liste vide", () => {
    expect(splitGain(0, [1, 2, 3], 3, mulberry32(1))).toEqual([]);
  });

  it("choisit le nombre de montants avec les poids 5, 3 et 2", () => {
    // 5 = 5 = 2 + 3 = 1 + 2 + 2 = 1 + 1 + 3 : les trois tailles existent.
    const pal = [1, 2, 3, 5, 10];
    const counts = [0, 0, 0, 0];
    const rng = mulberry32(42);
    const n = 30_000;
    for (let i = 0; i < n; i++) counts[splitGain(5, pal, 3, rng).length]!++;
    expect(counts[1]! / n).toBeGreaterThan(0.48);
    expect(counts[1]! / n).toBeLessThan(0.52);
    expect(counts[2]! / n).toBeGreaterThan(0.28);
    expect(counts[2]! / n).toBeLessThan(0.32);
    expect(counts[3]! / n).toBeGreaterThan(0.18);
    expect(counts[3]! / n).toBeLessThan(0.22);
  });

  it("un seul montant quand aucun autre découpage n'existe", () => {
    // 1 ne se découpe pas.
    for (let i = 0; i < 50; i++) expect(splitGain(1, [1, 2, 3], 3, mulberry32(i))).toEqual([1]);
  });
});

describe("decoy", () => {
  it("suit la loi 0,65 puissance i", () => {
    const pal = palette(ticketById("tirelire")!);
    const counts = new Map<number, number>();
    const rng = mulberry32(7);
    const n = 200_000;
    for (let i = 0; i < n; i++) {
      const d = decoy(pal, rng);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    let total = 0;
    for (let i = 0; i < pal.length; i++) total += Math.pow(0.65, i);
    pal.forEach((amount, i) => {
      const expected = Math.pow(0.65, i) / total;
      const got = (counts.get(amount) ?? 0) / n;
      expect(Math.abs(got - expected)).toBeLessThan(0.006);
    });
  });
});

describe("trio", () => {
  const trios = TICKETS.filter((t) => t.engine === "trio");

  it("un trio perdant ne contient jamais trois montants identiques", () => {
    for (const def of trios) {
      for (let i = 0; i < 3000; i++) {
        const layout = buildLayout(def, 0, seedAt(i));
        if (layout.engine !== "trio") throw new Error("moteur inattendu");
        const counts = new Map<number, number>();
        for (const a of layout.cells) counts.set(a, (counts.get(a) ?? 0) + 1);
        expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
      }
    }
  });

  it("un trio gagnant montre le gain exactement 3 fois, et rien d'autre plus de 2 fois", () => {
    for (const def of trios) {
      for (const gain of palette(def)) {
        for (let i = 0; i < 300; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          if (layout.engine !== "trio") throw new Error("moteur inattendu");
          expect(layout.cells.length).toBe(9);
          const counts = new Map<number, number>();
          for (const a of layout.cells) counts.set(a, (counts.get(a) ?? 0) + 1);
          expect(counts.get(gain)).toBe(3);
          for (const [a, c] of counts) if (a !== gain) expect(c).toBeLessThanOrEqual(2);
        }
      }
    }
  });
});

describe("morpion", () => {
  const morpions = TICKETS.filter((t) => t.engine === "morpion");

  it("un morpion perdant n'a aucune ligne complète", () => {
    for (const def of morpions) {
      for (let i = 0; i < 3000; i++) {
        const layout = buildLayout(def, 0, seedAt(i));
        if (layout.engine !== "morpion") throw new Error("moteur inattendu");
        expect(completeLines(layout.grid).length).toBe(0);
        const targets = layout.grid.filter(Boolean).length;
        expect(targets).toBeGreaterThanOrEqual(3);
        expect(targets).toBeLessThanOrEqual(5);
      }
    }
  });

  it("un morpion gagnant a exactement une ligne complète et 3 à 5 cibles", () => {
    for (const def of morpions) {
      for (const gain of palette(def)) {
        for (let i = 0; i < 300; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          if (layout.engine !== "morpion") throw new Error("moteur inattendu");
          expect(completeLines(layout.grid).length).toBe(1);
          expect(layout.lot).toBe(gain);
          const targets = layout.grid.filter(Boolean).length;
          expect(targets).toBeGreaterThanOrEqual(3);
          expect(targets).toBeLessThanOrEqual(5);
        }
      }
    }
  });
});

describe("numeros", () => {
  it("numéros distincts entre 1 et 49, tailles de grille du tableau 7.10", () => {
    const sizes: Record<string, [number, number]> = { "bas-de-laine": [3, 8], "mille-pattes": [4, 15] };
    for (const [id, [k, n]] of Object.entries(sizes)) {
      const def = ticketById(id)!;
      for (const gain of [0, ...palette(def)]) {
        for (let i = 0; i < 100; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          if (layout.engine !== "numeros") throw new Error("moteur inattendu");
          expect(layout.winning.length).toBe(k);
          expect(layout.yours.length).toBe(n);
          const numbers = [...layout.winning, ...layout.yours.map((c) => c.n)];
          expect(numbers.every((x) => Number.isInteger(x) && x >= 1 && x <= 49)).toBe(true);
          expect(new Set(layout.winning).size).toBe(k);
          expect(new Set(layout.yours.map((c) => c.n)).size).toBe(n);
          const hits = layout.yours.filter((c) => layout.winning.includes(c.n)).length;
          expect(hits).toBeLessThanOrEqual(3);
          if (gain === 0) expect(hits).toBe(0);
        }
      }
    }
  });
});

describe("duel", () => {
  it("valeurs dans les bornes de chaque habillage", () => {
    for (const def of TICKETS.filter((t) => t.engine === "duel")) {
      for (const gain of [0, ...palette(def)]) {
        for (let i = 0; i < 200; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          if (layout.engine !== "duel") throw new Error("moteur inattendu");
          expect(layout.rounds.length).toBe(4);
          for (const r of layout.rounds) {
            if (layout.skin === "foot") {
              expect(r.you >= 0 && r.you <= 5 && r.them >= 0 && r.them <= 5).toBe(true);
              expect(typeof r.opponent).toBe("string");
            } else if (layout.skin === "cartes") {
              expect(r.you >= 12 && r.you <= 21).toBe(true);
              expect(r.them >= 17 && r.them <= 26).toBe(true);
            } else {
              expect(r.you >= 7000 && r.you <= 9999 && r.them >= 7000 && r.them <= 9999).toBe(true);
            }
          }
          if (layout.skin === "foot") {
            expect(new Set(layout.rounds.map((r) => r.opponent)).size).toBe(4);
          }
        }
      }
    }
  });

  it("égalité : pas de gain", () => {
    expect(roundWon("foot", 2, 2)).toBe(false);
    expect(roundWon("foot", 3, 2)).toBe(true);
    expect(roundWon("cartes", 19, 19)).toBe(false);
    expect(roundWon("cartes", 12, 23)).toBe(true);
    expect(roundWon("cartes", 20, 19)).toBe(true);
    expect(roundWon("cartes", 18, 19)).toBe(false);
    expect(roundWon("course", 7512, 7512)).toBe(false);
    expect(roundWon("course", 7511, 7512)).toBe(true);
  });
});

describe("etoile", () => {
  it("le signe choisi n'apparaît que sur les cases gagnantes", () => {
    for (const def of TICKETS.filter((t) => t.engine === "etoile")) {
      const signs = optStrings(def.options, "signs");
      for (const pick of signs) {
        for (const gain of [0, ...palette(def)]) {
          for (let i = 0; i < 60; i++) {
            const layout = buildLayout(def, gain, seedAt(i), pick);
            if (layout.engine !== "etoile") throw new Error("moteur inattendu");
            expect(layout.cells.length).toBe(6);
            expect(layout.cells.every((c) => signs.includes(c.sign))).toBe(true);
            const mine = layout.cells.filter((c) => c.sign === pick);
            expect(mine.reduce((s, c) => s + c.amount, 0)).toBe(gain);
            if (gain === 0) expect(mine.length).toBe(0);
          }
        }
      }
    }
  });

  it("un signe inconnu retombe sur le premier signe du ticket", () => {
    const def = ticketById("caviar-champagne")!;
    const layout = buildLayout(def, def.price * 5, 77, "licorne");
    if (layout.engine !== "etoile") throw new Error("moteur inattendu");
    expect(layout.pick).toBe("caviar");
    expect(evaluate(layout)).toBe(def.price * 5);
  });
});

describe("lignes", () => {
  it("8 éléments tirés, 4 rangées de 3 éléments tous différents, triées par montant", () => {
    for (const def of TICKETS.filter((t) => t.engine === "lignes")) {
      for (const gain of [0, ...palette(def)]) {
        for (let i = 0; i < 200; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          if (layout.engine !== "lignes") throw new Error("moteur inattendu");
          expect(layout.draw.length).toBe(DRAW_SIZE);
          expect(new Set(layout.draw).size).toBe(DRAW_SIZE);
          expect(layout.lines.length).toBe(LINE_COUNT);
          const items = layout.lines.flatMap((l) => l.items);
          expect(new Set(items).size).toBe(12);
          const [lo, hi] = layout.skin === "cartes" ? [0, 31] : [1, 40];
          expect([...items, ...layout.draw].every((e) => e >= lo && e <= hi)).toBe(true);
          for (let l = 1; l < layout.lines.length; l++) {
            expect(layout.lines[l]!.amount).toBeGreaterThanOrEqual(layout.lines[l - 1]!.amount);
          }
          const drawn = new Set(layout.draw);
          const complete = layout.lines.filter((l) => l.items.every((e) => drawn.has(e)));
          expect(complete.length).toBeLessThanOrEqual(2);
          if (gain === 0) expect(complete.length).toBe(0);
        }
      }
    }
  });
});

describe("multi", () => {
  it("trois volets : trio, numéros (2 gagnants, 6 numéros), duel (3 manches, cartes)", () => {
    const def = ticketById("grand-grattouille")!;
    for (const gain of [0, ...palette(def)]) {
      for (let i = 0; i < 200; i++) {
        const layout = buildLayout(def, gain, seedAt(i));
        if (layout.engine !== "multi") throw new Error("moteur inattendu");
        const [a, b, c] = layout.panels;
        expect(a.cells.length).toBe(9);
        expect(b.winning.length).toBe(2);
        expect(b.yours.length).toBe(6);
        expect(c.rounds.length).toBe(3);
        expect(c.skin).toBe("cartes");
        // Chaque volet ne porte qu'un seul lot.
        expect(b.yours.filter((y) => b.winning.includes(y.n)).length).toBeLessThanOrEqual(1);
        expect(c.rounds.filter((r) => roundWon("cartes", r.you, r.them)).length).toBeLessThanOrEqual(1);
        expect(cellIds(layout).length).toBe(9 + 8 + 6);
      }
    }
  });
});
