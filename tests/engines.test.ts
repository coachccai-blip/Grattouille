// Moteurs de tickets (BRIEF.md, sections 7.1 à 7.9 et 17.4).

import { readFileSync, readdirSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { TICKETS, ticketById } from "../shared/tickets";
import { buildLayout, cellIds, evaluate, matches, needsPick, pickOptions, ruleOf } from "../src/engines";
import { CAMP_CELLS, MAJORITY, countOf } from "../src/engines/camps";
import { COEFS, tripleOf } from "../src/engines/coef";
import { GRID_COLS, GRID_ROWS, completeWords, gridOf, grilleValide, grillesOf } from "../src/engines/mots";
import { ALPHABET, GRILLES, LETTRES_MORTES, type Grille } from "../src/engines/mots-grilles";
import { GRILLES_EN } from "../src/engines/mots-grilles-en";
import { panelNames } from "../src/engines/multi";
import { boardOf, totalOf } from "../src/engines/parcours";
import { decoy, mulberry32, palette, splitGain } from "../src/engines/common";
import { roundWon } from "../src/engines/duel";
import { CARD_RANK_NAMES, CARD_SUIT_NAMES, DRAW_SIZE, LINE_COUNT } from "../src/engines/lignes";
import { completeLines } from "../src/engines/morpion";
import { optStrings } from "../src/engines/common";
import { i18nMisses, lang, setLang, t } from "../src/i18n";
import { EN_TICKETS } from "../src/i18n/en/tickets";
import { SYMBOL_NAMES, symbolName } from "../src/ticket/themes";

// Chaque test repart du français, même si le précédent a échoué en anglais.
afterEach(() => setLang("fr"));

/** Exécute `run` en anglais, puis revient au français quoi qu'il arrive. */
function inEnglish<T>(run: () => T): T {
  setLang("en");
  try {
    return run();
  } finally {
    setLang("fr");
  }
}

const SEEDS = 500;

/** Graines réparties sur tout l'intervalle 32 bits. */
function seedAt(i: number): number {
  return (Math.imul(i + 1, 2654435761) ^ (i * 7919)) >>> 0;
}

describe("invariant : evaluate(buildLayout(def, gain, seed)) === gain", () => {
  for (const def of TICKETS) {
    it(`${def.name} : chaque gain possible, 0 compris, sur ${SEEDS} graines`, () => {
      const gains = [0, ...palette(def)];
      // Les tickets à choix (un signe, un camp) sont essayés avec chacun de leurs choix.
      const picks = needsPick(def) ? pickOptions(def) : [undefined];
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
          const [lo, hi] = layout.skin === "cartes" ? [0, 31] : layout.skin === "cocktails" ? [0, 13] : [1, 40];
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
        if (layout.engine !== "multi" || layout.kind !== "classique") throw new Error("moteur inattendu");
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

describe("multi, Le Gratte-Ciel", () => {
  it("trois volets : parcours, coef, morpion, un seul lot par volet", () => {
    const def = ticketById("gratte-ciel")!;
    for (const gain of [0, ...palette(def)]) {
      for (let i = 0; i < 200; i++) {
        const layout = buildLayout(def, gain, seedAt(i));
        if (layout.engine !== "multi" || layout.kind !== "ciel") throw new Error("moteur inattendu");
        const [a, b, c] = layout.panels;
        expect(a.dice.length).toBe(3);
        expect(b.cells.length).toBe(6);
        expect(c.grid.length).toBe(9);
        expect(cellIds(layout).length).toBe(3 + 7 + 10);
      }
    }
  });
});

describe("parcours", () => {
  const tickets = TICKETS.filter((t) => t.engine === "parcours");

  it("trois dés de 1 à 6, et le pion s'arrête sur la case de leur total", () => {
    expect(tickets.length).toBe(2);
    for (const def of tickets) {
      for (const gain of [0, ...palette(def)]) {
        for (let i = 0; i < 200; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          if (layout.engine !== "parcours") throw new Error("moteur inattendu");
          expect(layout.dice.length).toBe(3);
          for (const d of layout.dice) expect(d >= 1 && d <= 6).toBe(true);
          expect(layout.squares[totalOf(layout.dice) - 1]).toBe(gain);
        }
      }
    }
  });

  it("le plateau porte chaque lot du ticket, des cases vides, et le gros lot sur le triple six", () => {
    for (const def of TICKETS) {
      const pal = palette(def);
      const board = boardOf(pal, def.temperament);
      expect(board.length).toBe(18);
      expect(board[0]).toBe(0);
      expect(board[1]).toBe(0);
      for (const amount of pal) expect(board).toContain(amount);
      expect(board.slice(2).filter((a) => a === 0).length).toBeGreaterThanOrEqual(3);
      expect(board[17]).toBe(pal[pal.length - 1]);
    }
  });

  it("les cases vides sont les totaux que trois dés donnent le plus souvent", () => {
    for (const def of tickets) {
      const board = boardOf(palette(def), def.temperament);
      // 10 et 11 sont les totaux les plus fréquents : jamais de lot dessus.
      expect(board[9]).toBe(0);
      expect(board[10]).toBe(0);
    }
  });
});

describe("coef", () => {
  const tickets = TICKETS.filter((t) => t.engine === "coef");

  it("six montants et un coefficient de la liste", () => {
    expect(tickets.length).toBe(2);
    for (const def of tickets) {
      for (const gain of [0, ...palette(def)]) {
        for (let i = 0; i < 200; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          if (layout.engine !== "coef") throw new Error("moteur inattendu");
          expect(layout.cells.length).toBe(6);
          expect((COEFS as readonly number[]).includes(layout.coef)).toBe(true);
          for (const a of layout.cells) expect(Number.isInteger(a) && a > 0).toBe(true);
        }
      }
    }
  });

  it("perdant : aucun montant trois fois ; gagnant : un seul montant trois fois, et pas quatre", () => {
    for (const def of tickets) {
      for (let i = 0; i < 400; i++) {
        const lost = buildLayout(def, 0, seedAt(i));
        if (lost.engine !== "coef") throw new Error("moteur inattendu");
        expect(tripleOf(lost)).toBe(0);
        for (const gain of palette(def)) {
          const won = buildLayout(def, gain, seedAt(i));
          if (won.engine !== "coef") throw new Error("moteur inattendu");
          const base = tripleOf(won);
          expect(base * won.coef).toBe(gain);
          expect(won.cells.filter((a) => a === base).length).toBe(3);
        }
      }
    }
  });

  it("le coefficient d'un gagnant n'est pas toujours 1 : la multiplication se voit", () => {
    const def = ticketById("grande-maree")!;
    const gain = palette(def)[4]!; // 10 fois la mise
    const coefs = new Set<number>();
    for (let i = 0; i < 300; i++) {
      const layout = buildLayout(def, gain, seedAt(i));
      if (layout.engine === "coef") coefs.add(layout.coef);
    }
    expect(coefs.size).toBeGreaterThan(2);
  });
});

describe("camps", () => {
  const tickets = TICKETS.filter((t) => t.engine === "camps");

  it("neuf cases, deux camps : celui du joueur l'emporte si et seulement si le ticket gagne", () => {
    expect(tickets.length).toBe(3);
    for (const def of tickets) {
      for (const pick of pickOptions(def)) {
        for (const gain of [0, ...palette(def)]) {
          for (let i = 0; i < 100; i++) {
            const layout = buildLayout(def, gain, seedAt(i), pick);
            if (layout.engine !== "camps") throw new Error("moteur inattendu");
            expect(layout.cells.length).toBe(CAMP_CELLS);
            expect(layout.pick).toBe(pick);
            for (const c of layout.cells) expect(layout.camps.includes(c)).toBe(true);
            expect(countOf(layout, pick) >= MAJORITY).toBe(gain > 0);
            if (gain > 0) expect(layout.lot).toBe(gain);
          }
        }
      }
    }
  });

  it("un camp inconnu retombe sur le premier camp du ticket", () => {
    const def = ticketById("rouge-et-noir")!;
    const layout = buildLayout(def, 0, 7, "vert");
    if (layout.engine !== "camps") throw new Error("moteur inattendu");
    expect(layout.pick).toBe("rouge");
  });

  it("le score suit la loi de neuf tirages à pile ou face : le 5 à 4 est le plus fréquent", () => {
    const def = ticketById("rouge-et-noir")!;
    const gain = palette(def)[0]!;
    const counts = new Map<number, number>();
    for (let i = 0; i < 2000; i++) {
      const layout = buildLayout(def, gain, seedAt(i), "rouge");
      if (layout.engine !== "camps") continue;
      const n = countOf(layout, "rouge");
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    expect(counts.get(5)! > counts.get(6)!).toBe(true);
    expect(counts.get(6)! > counts.get(7)!).toBe(true);
    expect((counts.get(5) ?? 0) / 2000).toBeGreaterThan(0.42);
  });
});

describe("mots", () => {
  const tickets = TICKETS.filter((t) => t.engine === "mots");

  it("les grilles : 10 mots, écrits avec les 10 lettres, dans 9 colonnes sur 8 rangées, sans mot parasite", () => {
    expect(ALPHABET.length).toBe(10);
    for (const ch of LETTRES_MORTES) expect(ALPHABET.includes(ch)).toBe(false);
    for (const [lexique, grilles] of Object.entries(GRILLES)) {
      expect(grilles.length).toBeGreaterThanOrEqual(8);
      for (const grille of grilles) {
        expect(grille.length).toBe(10);
        expect(new Set(grille.map(([text]) => text)).size).toBe(10);
        const cells = new Map<string, string>();
        let rows = 0;
        let cols = 0;
        for (const [text, row, col, dir] of grille) {
          expect(text.length).toBeGreaterThanOrEqual(3);
          for (let i = 0; i < text.length; i++) {
            expect(ALPHABET.includes(text[i]!)).toBe(true);
            const r = row + (dir === 1 ? i : 0);
            const c = col + (dir === 0 ? i : 0);
            const key = `${r}:${c}`;
            // Deux mots qui se croisent partagent la même lettre.
            if (cells.has(key) && cells.get(key) !== text[i]) throw new Error(`${lexique} : croisement faux en ${key}`);
            cells.set(key, text[i]!);
            rows = Math.max(rows, r + 1);
            cols = Math.max(cols, c + 1);
          }
        }
        expect(rows).toBeLessThanOrEqual(8);
        expect(cols).toBeLessThanOrEqual(9);
        // Toute suite de deux lettres ou plus, en ligne ou en colonne, est un mot de la grille.
        const runs: string[] = [];
        for (let r = 0; r < rows; r++) {
          let run = "";
          for (let c = 0; c <= cols; c++) {
            const ch = cells.get(`${r}:${c}`) ?? "";
            if (ch) run += ch;
            else {
              if (run.length >= 2) runs.push(run);
              run = "";
            }
          }
        }
        for (let c = 0; c < cols; c++) {
          let run = "";
          for (let r = 0; r <= rows; r++) {
            const ch = cells.get(`${r}:${c}`) ?? "";
            if (ch) run += ch;
            else {
              if (run.length >= 2) runs.push(run);
              run = "";
            }
          }
        }
        expect(runs.sort()).toEqual(grille.map(([text]) => text).sort());
      }
    }
  });

  it("dix lettres toutes différentes, et autant de mots complets que le rang du lot", () => {
    expect(tickets.length).toBe(2);
    for (const def of tickets) {
      const pal = palette(def);
      const grids = new Set<number>();
      for (let k = 0; k <= pal.length; k++) {
        const gain = k === 0 ? 0 : pal[k - 1]!;
        for (let i = 0; i < 300; i++) {
          const layout = buildLayout(def, gain, seedAt(i));
          if (layout.engine !== "mots") throw new Error("moteur inattendu");
          grids.add(layout.grid);
          expect(layout.letters.length).toBe(10);
          expect(new Set(layout.letters).size).toBe(10);
          expect(completeWords(layout, layout.letters).length).toBe(k);
          expect(gridOf(layout).length).toBe(10);
        }
      }
      // Toutes les grilles du lexique servent.
      expect(grids.size).toBe(GRILLES[String(def.options.lexique)]!.length);
    }
  });

  it("un ticket perdant découvre quand même des lettres de la grille", () => {
    const def = ticketById("grille-du-jour")!;
    let useful = 0;
    const runs = 300;
    for (let i = 0; i < runs; i++) {
      const layout = buildLayout(def, 0, seedAt(i));
      if (layout.engine !== "mots") throw new Error("moteur inattendu");
      useful += layout.letters.filter((l) => ALPHABET.includes(l)).length;
    }
    // Sept lettres utiles sur dix au moins, en moyenne.
    expect(useful / runs).toBeGreaterThanOrEqual(7);
  });
});

describe("mots, en anglais", () => {
  const tickets = TICKETS.filter((t) => t.engine === "mots");
  const lexiques = tickets.map((def) => String(def.options.lexique));
  const texts = (grille: Grille) => grille.map(([text]) => text).sort();

  it("le français n'a que des grilles françaises, quelle que soit la langue quittée", () => {
    inEnglish(() => undefined);
    expect(lang()).toBe("fr");
    for (const lexique of Object.keys(GRILLES)) expect(grillesOf(lexique)).toBe(GRILLES[lexique]);
    // Un lexique inconnu retombe sur celui de la terrasse.
    expect(grillesOf("inconnu")).toBe(GRILLES.terrasse);
  });

  it("les grilles anglaises respectent le même contrat que les françaises", () => {
    for (const [lexique, grilles] of Object.entries(GRILLES_EN)) {
      // Les mêmes lexiques qu'en français : rien d'autre ne serait jamais affiché.
      expect(Object.keys(GRILLES)).toContain(lexique);
      for (const grille of grilles) {
        if (!grilleValide(grille)) throw new Error(`${lexique} : grille anglaise invalide (${texts(grille).join(", ")})`);
        expect(grille.length).toBe(10);
        let rows = 0;
        let cols = 0;
        for (const [text, row, col, dir] of grille) {
          expect(text.length).toBeGreaterThanOrEqual(3);
          for (const ch of text) expect(ALPHABET.includes(ch)).toBe(true);
          rows = Math.max(rows, row + (dir === 1 ? text.length : 1));
          cols = Math.max(cols, col + (dir === 0 ? text.length : 1));
        }
        expect(rows).toBeLessThanOrEqual(GRID_ROWS);
        expect(cols).toBeLessThanOrEqual(GRID_COLS);
      }
    }
  });

  it("le contrôle des grilles refuse ce qui ne tient pas debout", () => {
    const good = GRILLES.terrasse![0]!;
    expect(grilleValide(good)).toBe(true);
    // Neuf mots seulement.
    expect(grilleValide(good.slice(1))).toBe(false);
    // Une lettre hors des dix : le K de « KAYAK ».
    expect(grilleValide(good.map((w, i) => (i === 0 ? (["KAYAK", w[1], w[2], w[3]] as const) : w)))).toBe(false);
    // Un mot déplacé : les croisements ne tombent plus juste.
    expect(grilleValide(good.map((w, i) => (i === 0 ? ([w[0], w[1] + 1, w[2] + 1, w[3]] as const) : w)))).toBe(false);
    // Toutes les grilles françaises passent le contrôle.
    for (const grilles of Object.values(GRILLES)) for (const g of grilles) expect(grilleValide(g)).toBe(true);
  });

  it("en anglais : les grilles anglaises du lexique, ou les françaises tant qu'il n'en a pas", () => {
    expect(tickets.length).toBe(2);
    inEnglish(() => {
      for (const lexique of lexiques) {
        const english = (GRILLES_EN[lexique] ?? []).filter(grilleValide);
        const used = grillesOf(lexique);
        if (english.length > 0) expect(used).toEqual(english);
        else expect(used).toBe(GRILLES[lexique]);
        expect(used.length).toBeGreaterThan(0);
      }
      // Un lexique inconnu retombe sur celui de la terrasse, dans la langue du jeu.
      expect(grillesOf("inconnu")).toBe(grillesOf("terrasse"));
    });
  });

  it("invariant : evaluate(buildLayout(def, gain, seed)) === gain, pour chaque lot, sur 500 graines", () => {
    for (const def of tickets) {
      const pal = palette(def);
      inEnglish(() => {
        const grids = new Set<number>();
        for (let k = 0; k <= pal.length; k++) {
          const gain = k === 0 ? 0 : pal[k - 1]!;
          for (let i = 0; i < SEEDS; i++) {
            const seed = seedAt(i);
            const layout = buildLayout(def, gain, seed);
            if (layout.engine !== "mots") throw new Error("moteur inattendu");
            const paid = evaluate(layout);
            if (paid !== gain) throw new Error(`${def.id} (anglais) gain=${gain} seed=${seed} paie ${paid}`);
            grids.add(layout.grid);
            // Dix lettres toutes différentes, et autant de mots complets que le rang du lot.
            expect(layout.letters.length).toBe(10);
            expect(new Set(layout.letters).size).toBe(10);
            expect(completeWords(layout, layout.letters).length).toBe(k);
            // La grille lue est bien une grille de la langue du jeu.
            expect(grillesOf(String(def.options.lexique))).toContain(gridOf(layout));
          }
        }
        // Toutes les grilles du lexique servent.
        expect(grids.size).toBe(grillesOf(String(def.options.lexique)).length);
      });
    }
  });

  it("toutes les lettres grattées : les mots complets paient exactement le gain", () => {
    for (const def of tickets) {
      inEnglish(() => {
        for (const gain of [0, ...palette(def)]) {
          for (let i = 0; i < 60; i++) {
            const layout = buildLayout(def, gain, seedAt(i));
            const list = matches(layout, new Set(cellIds(layout)));
            expect(list.reduce((s, m) => s + m.amount, 0)).toBe(gain);
            expect(matches(layout, new Set()).length).toBe(0);
            expect(new Set(list.map((m) => m.key)).size).toBe(list.length);
          }
        }
      });
    }
  });

  it("le gain ne dépend pas de la langue : seule l'image change", () => {
    for (const def of tickets) {
      const lexique = String(def.options.lexique);
      const hasEnglish = (GRILLES_EN[lexique] ?? []).some(grilleValide);
      let different = 0;
      for (const gain of [0, ...palette(def)]) {
        for (let i = 0; i < 40; i++) {
          const seed = seedAt(i);
          const fr = buildLayout(def, gain, seed);
          expect(evaluate(fr)).toBe(gain);
          const wordsFr = fr.engine === "mots" ? texts(gridOf(fr)) : [];
          const [paid, scale, wordsEn] = inEnglish(() => {
            const en = buildLayout(def, gain, seed);
            if (en.engine !== "mots") throw new Error("moteur inattendu");
            return [evaluate(en), en.scale, texts(gridOf(en))] as const;
          });
          expect(paid).toBe(gain);
          // Le barème est celui du ticket, dans les deux langues.
          expect(scale).toEqual(fr.engine === "mots" ? fr.scale : []);
          if (wordsEn.join() !== wordsFr.join()) different++;
        }
      }
      // Avec des grilles anglaises, les mots ne sont plus ceux du français.
      if (hasEnglish) expect(different).toBeGreaterThan(0);
      else expect(different).toBe(0);
    }
  });

  it("les autres moteurs ne changent pas avec la langue : même graine, même grille", () => {
    for (const def of TICKETS.filter((t) => t.engine !== "mots")) {
      const gain = palette(def)[5]!;
      const fr = buildLayout(def, gain, 20261125);
      const en = inEnglish(() => buildLayout(def, gain, 20261125));
      expect(en).toEqual(fr);
    }
  });
});

describe("règles", () => {
  it("chaque ticket a sa règle en une phrase", () => {
    for (const def of TICKETS) {
      const rule = ruleOf(def);
      expect(rule.length).toBeGreaterThan(20);
      expect(rule.endsWith(".")).toBe(true);
    }
  });

  it("dans les deux langues : une règle anglaise pour chaque ticket, courte, sans manque", () => {
    for (const def of TICKETS) {
      const fr = ruleOf(def);
      const en = inEnglish(() => ruleOf(def));
      // La règle française est la clé de sa traduction.
      expect(EN_TICKETS[fr]).toBe(en);
      expect(en).not.toBe(fr);
      expect(en.endsWith(".")).toBe(true);
      // Deux lignes au pied d'un ticket de 252 px : 86 caractères au plus.
      expect(fr.length).toBeLessThanOrEqual(86);
      expect(en.length).toBeLessThanOrEqual(86);
      // Guillemets et espaces : l'anglais s'affiche tel quel.
      expect(/[«»\u00A0\u202F]/.test(en)).toBe(false);
      expect(i18nMisses()).not.toContain(fr);
    }
    // Revenu au français, la règle redevient française.
    expect(lang()).toBe("fr");
    expect(ruleOf(ticketById("tirelire")!)).toBe("Trouve 3 montants identiques : tu gagnes ce montant.");
  });

  it("deux tickets qui ne se jouent pas pareil n'ont pas la même règle", () => {
    const rules = new Map<string, string>();
    for (const def of TICKETS) {
      const key = `${def.engine}:${String(def.options.mode ?? def.options.skin ?? def.options.family ?? def.options.target ?? "")}`;
      const rule = ruleOf(def);
      const seen = [...rules.entries()].find(([k, r]) => r === rule && k.split(":")[0] !== def.engine);
      expect(seen).toBeUndefined();
      rules.set(key, rule);
    }
  });
});

describe("textes des tickets", () => {
  /** Tout ce qu'un ticket peut imprimer ou faire lire, en français : ce sont les clés de traduction. */
  function frenchTexts(): string[] {
    const out = new Set<string>();
    for (const def of TICKETS) {
      out.add(ruleOf(def));
      for (const opponent of optStrings(def.options, "opponents")) out.add(opponent);
      const layout = buildLayout(def, 0, 1);
      if (layout.engine === "multi") for (const name of panelNames(layout)) out.add(name);
    }
    for (const name of Object.values(SYMBOL_NAMES)) out.add(name);
    for (const name of [...Object.values(CARD_RANK_NAMES), ...Object.values(CARD_SUIT_NAMES)]) out.add(name);
    // Les libellés que les vues tiennent dans des tables : adversaires des duels, coefficients.
    for (const label of ["Hector", "Croupier", "Rival", "Coefficient de marée", "Taux d'intérêt", "Prime", "Coefficient"]) {
      out.add(label);
    }
    return [...out];
  }

  /** Les phrases passées à `t("…")` dans le code du ticket. */
  function literalKeys(): string[] {
    const out = new Set<string>();
    for (const file of ["src/ticket/Ticket.tsx", "src/ticket/views.tsx"]) {
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) out.add(m[1]!);
      // Les deux branches d'un choix : t(condition ? "A" : "B").
      for (const m of source.matchAll(/\bt\([^()"]*\?\s*"([^"]*)"\s*:\s*"([^"]*)"/g)) {
        out.add(m[1]!);
        out.add(m[2]!);
      }
    }
    return [...out];
  }

  it("chaque texte d'un ticket a sa traduction anglaise", () => {
    const keys = [...frenchTexts(), ...literalKeys()];
    expect(keys.length).toBeGreaterThan(120);
    expect(keys.filter((fr) => EN_TICKETS[fr] === undefined)).toEqual([]);
    inEnglish(() => {
      for (const fr of keys) expect(t(fr)).toBe(EN_TICKETS[fr]);
      expect(keys.filter((fr) => i18nMisses().includes(fr))).toEqual([]);
    });
  });

  it("les noms des symboles suivent la langue, et un symbole inconnu garde son repli", () => {
    expect(symbolName("constellation:homard")).toBe("Homard");
    expect(symbolName("famille:inconnu", "inconnu")).toBe("inconnu");
    inEnglish(() => {
      expect(symbolName("constellation:homard")).toBe("Lobster");
      expect(symbolName("fanal:babord")).toBe("Port");
      expect(symbolName("famille:inconnu", "inconnu")).toBe("inconnu");
      // Les figures : valet, dame et roi se lisent jack, queen et king.
      expect(t("{rang} de {couleur}", { rang: t("valet"), couleur: t("pique") })).toBe("jack of spades");
      expect(t("{rang} de {couleur}", { rang: t("roi"), couleur: t("cœur") })).toBe("king of hearts");
      expect(t("Payé")).toBe("Paid");
    });
    expect(t("Payé")).toBe("Payé");
  });

  it("une traduction tient à la place de son texte : jamais beaucoup plus longue", () => {
    const tooLong = Object.entries(EN_TICKETS)
      .filter(([fr, en]) => en.length > fr.length + 8)
      .map(([fr, en]) => `${fr} → ${en}`);
    expect(tooLong).toEqual([]);
    // Les libellés imprimés dans la zone de jeu tiennent sur une ligne.
    for (const fr of ["Numéros gagnants", "Tes numéros", "Comptes gagnants", "Tes comptes", "Coefficient de marée", "Taux d'intérêt", "Les ingrédients"]) {
      expect(EN_TICKETS[fr]!.length).toBeLessThanOrEqual(20);
    }
  });

  it("plus aucune mention « jeu de fiction », dans aucune langue", () => {
    const forbidden = /fiction|gain r[ée]el|argent r[ée]el|aucun gain|r[ée]serv[ée] aux adultes|real money|no real|not real|adults only/i;
    const texts = [...frenchTexts(), ...literalKeys(), ...Object.keys(EN_TICKETS), ...Object.values(EN_TICKETS)];
    expect(texts.filter((x) => forbidden.test(x))).toEqual([]);
    // Ni dans le code du ticket, ni dans celui des moteurs, ni dans leur feuille de style.
    const files = [
      ...readdirSync("src/ticket").map((f) => `src/ticket/${f}`),
      ...readdirSync("src/engines").map((f) => `src/engines/${f}`),
      ...readdirSync("src/scratch").map((f) => `src/scratch/${f}`),
      "src/i18n/en/tickets.ts",
    ];
    expect(files.length).toBeGreaterThan(20);
    expect(files.filter((file) => forbidden.test(readFileSync(file, "utf8")))).toEqual([]);
  });

  it("un ticket trouvé le dit en deux mots, et le tampon en un", () => {
    const source = readFileSync("src/ticket/Ticket.tsx", "utf8");
    expect(source).toContain('t("Trouvé par terre")');
    expect(source).not.toMatch(/toujours gagnant/i);
    expect(EN_TICKETS["Trouvé par terre"]).toBe("Found on the ground");
    expect(EN_TICKETS["Payé"]).toBe("Paid");
  });
});
