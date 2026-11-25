// Règles, catalogue et affichage (BRIEF.md, sections 5, 6.1, 8.5, 11 et annexe A).

import { describe, expect, it } from "vitest";
import { CATALOG, COLLECTION_SIZE, KIOSK, SHOPS, itemsOfShop, itemsOfSlot } from "../shared/catalog";
import { formatEuros, formatInt, formatPercent, formatReturn } from "../shared/format";
import { PLACES } from "../shared/places";
import {
  CODE_ALPHABET, START_BALANCE, bestPlace, collectionComplete, fortuneOf, formatCode, houseEligible,
  houseGain, houseTicketDef, isPlaceOpen, newlyOpened, nextPlace, normalizeCode, pseudoKey, registerOf,
  serialOf, standingOf, tierOf, validatePseudo,
} from "../shared/rules";
import { cheapestTicket } from "../shared/tickets";
import type { PendingTicket } from "../shared/types";

const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("formatEuros", () => {
  it("les quatre valeurs du brief", () => {
    expect(plain(formatEuros(999_999))).toBe("999 999 €");
    expect(plain(formatEuros(1_000_000))).toBe("1 M€");
    expect(plain(formatEuros(1_250_000))).toBe("1,25 M€");
    expect(plain(formatEuros(1_250_000_000))).toBe("1,25 Md€");
  });

  it("séparateur de milliers sous le million", () => {
    expect(plain(formatEuros(0))).toBe("0 €");
    expect(plain(formatEuros(4))).toBe("4 €");
    expect(plain(formatEuros(9_500))).toBe("9 500 €");
    expect(plain(formatEuros(250_000))).toBe("250 000 €");
  });

  it("deux décimales au plus, sans zéro inutile", () => {
    expect(plain(formatEuros(1_500_000))).toBe("1,5 M€");
    expect(plain(formatEuros(20_030_000))).toBe("20,03 M€");
    expect(plain(formatEuros(12_500_000))).toBe("12,5 M€");
    expect(plain(formatEuros(350_000_000))).toBe("350 M€");
    expect(plain(formatEuros(125_000_000_000))).toBe("125 Md€");
    expect(plain(formatEuros(2_545_029_535))).toBe("2,55 Md€");
    expect(plain(formatEuros(3_545_029_535))).toBe("3,55 Md€");
  });

  it("au-delà de 999 Md€ : « 1 250 Md€ »", () => {
    expect(plain(formatEuros(999_990_000_000))).toBe("999,99 Md€");
    expect(plain(formatEuros(1_250_000_000_000))).toBe("1 250 Md€");
    expect(plain(formatEuros(1_000_000_000_000))).toBe("1 000 Md€");
  });

  it("arrondit au plus proche et change d'unité quand l'arrondi la franchit", () => {
    expect(plain(formatEuros(1_994_999))).toBe("1,99 M€");
    expect(plain(formatEuros(1_999_999))).toBe("2 M€");
    expect(plain(formatEuros(1_005_000))).toBe("1,01 M€");
    expect(plain(formatEuros(1_004_999))).toBe("1 M€");
    expect(plain(formatEuros(999_994_999))).toBe("999,99 M€");
    expect(plain(formatEuros(999_999_999))).toBe("1 Md€");
    expect(plain(formatEuros(999_999_000_000))).toBe("1 000 Md€");
  });

  it("espaces insécables", () => {
    expect(formatEuros(9_500)).toBe("9 500 €");
    expect(formatInt(1234567)).toBe("1 234 567");
  });

  it("pourcentages et retours", () => {
    expect(plain(formatPercent(0.61525))).toBe("61,5 %");
    expect(plain(formatPercent(0.5206))).toBe("52,1 %");
    expect(plain(formatPercent(0.3744))).toBe("37,4 %");
    expect(plain(formatReturn(2.59))).toBe("2,59 €");
    expect(plain(formatReturn(3.15))).toBe("3,15 €");
    expect(plain(formatReturn(4.89))).toBe("4,89 €");
  });
});

describe("catalogue", () => {
  it("52 biens pour 2 545 029 535 € et 4 086 ★", () => {
    expect(CATALOG.length).toBe(52);
    expect(COLLECTION_SIZE).toBe(52);
    expect(new Set(CATALOG.map((i) => i.id)).size).toBe(52);
    expect(CATALOG.reduce((s, i) => s + i.price, 0)).toBe(2_545_029_535);
    expect(CATALOG.reduce((s, i) => s + i.standing, 0)).toBe(4_086);
  });

  it("avec le Kiosque : 3,55 Md€ et 5 000 ★", () => {
    expect(KIOSK.price).toBe(1_000_000_000);
    expect(KIOSK.standing).toBe(914);
    const all = CATALOG.map((i) => i.id);
    expect(standingOf(all, true)).toBe(5_000);
    expect(CATALOG.reduce((s, i) => s + i.price, 0) + KIOSK.price).toBe(3_545_029_535);
  });

  it("quatre boutiques : 24, 10, 10 et 8 articles", () => {
    expect(SHOPS.map((s) => itemsOfShop(s.id).length)).toEqual([24, 10, 10, 8]);
    for (const slot of ["chapeau", "lunettes", "tenue", "accessoire"] as const) {
      expect(itemsOfSlot(slot).length).toBe(6);
    }
  });

  it("le barème de Standing suit le prix", () => {
    const bareme: [number, number][] = [
      [10, 2], [50, 3], [200, 5], [1_000, 8], [5_000, 12], [20_000, 18], [100_000, 25], [500_000, 40],
      [2_000_000, 60], [10_000_000, 90], [50_000_000, 130], [200_000_000, 200], [500_000_000, 300], [Infinity, 400],
    ];
    for (const item of CATALOG) {
      const expected = bareme.find(([limit]) => item.price < limit)![1];
      expect([item.id, item.standing]).toEqual([item.id, expected]);
    }
  });

  it("achats cumulés pour ouvrir chaque lieu, du moins cher au plus cher", () => {
    const byPrice = [...CATALOG].sort((a, b) => a.price - b.price);
    const costToReach = (standing: number): number => {
      let stars = 0;
      let cost = 0;
      for (const item of byPrice) {
        if (stars >= standing) break;
        stars += item.standing;
        cost += item.price;
      }
      return cost;
    };
    expect(costToReach(10)).toBe(40);
    expect(costToReach(60)).toBe(2_835);
    expect(costToReach(250)).toBe(149_535);
    expect(costToReach(1000)).toBe(20_029_535);
    expect(plain(formatEuros(costToReach(1000)))).toBe("20,03 M€");
  });
});

describe("Standing et fortune", () => {
  it("le Standing est la somme des ★ possédées, portées ou non", () => {
    expect(standingOf([], false)).toBe(0);
    expect(standingOf(["noeud-pap", "beret", "lunettes-rondes", "mariniere"], false)).toBe(10);
    expect(standingOf(["noeud-pap", "inconnu"], false)).toBe(2);
    expect(standingOf([], true)).toBe(914);
  });

  it("la fortune : solde, gains en attente, prix d'achat des biens", () => {
    const pending: PendingTicket[] = [
      { id: "t_aaaaaaaaaaaa", type: "tirelire", gain: 5, seed: 1, at: 0 },
      { id: "t_bbbbbbbbbbbb", type: "tirelire", gain: 0, seed: 2, at: 0 },
    ];
    expect(fortuneOf({ balance: 3, pending, owned: [], kiosk: false })).toBe(8);
    expect(fortuneOf({ balance: 3, pending: [], owned: ["noeud-pap"], kiosk: false })).toBe(8);
    expect(fortuneOf({ balance: 0, pending: [], owned: [], kiosk: true })).toBe(1_000_000_000);
  });

  it("acheter ne fait jamais baisser la fortune", () => {
    const before = fortuneOf({ balance: 100, pending: [], owned: [], kiosk: false });
    const after = fortuneOf({ balance: 100 - 60, pending: [], owned: ["foulard"], kiosk: false });
    expect(after).toBe(before);
  });

  it("collection complète : les 52 biens, pas un de moins", () => {
    const all = CATALOG.map((i) => i.id);
    expect(collectionComplete(all)).toBe(true);
    expect(collectionComplete(all.slice(1))).toBe(false);
    expect(collectionComplete([...all.slice(1), all[1]!])).toBe(false);
  });
});

describe("lieux", () => {
  it("seuils de la section 5.3", () => {
    expect(PLACES.map((p) => [p.id, p.standing])).toEqual([
      ["kiosque", 0], ["cafe", 10], ["casino", 60], ["salon", 250], ["cercle", 1000],
    ]);
    expect(isPlaceOpen("kiosque", 0)).toBe(true);
    expect(isPlaceOpen("cafe", 9)).toBe(false);
    expect(isPlaceOpen("cafe", 10)).toBe(true);
    expect(isPlaceOpen("cercle", 999)).toBe(false);
    expect(isPlaceOpen("cercle", 1000)).toBe(true);
  });

  it("meilleur lieu débloqué et prochain lieu", () => {
    expect(bestPlace(0).id).toBe("kiosque");
    expect(bestPlace(59).id).toBe("cafe");
    expect(bestPlace(60).id).toBe("casino");
    expect(bestPlace(5000).id).toBe("cercle");
    expect(nextPlace(0)?.id).toBe("cafe");
    expect(nextPlace(34)?.id).toBe("casino");
    expect(nextPlace(1000)).toBeNull();
  });

  it("lieux ouverts par un achat qui franchit un seuil", () => {
    expect(newlyOpened(8, 10).map((p) => p.id)).toEqual(["cafe"]);
    expect(newlyOpened(10, 12)).toEqual([]);
    expect(newlyOpened(55, 255).map((p) => p.id)).toEqual(["casino", "salon"]);
  });
});

describe("ticket de la maison", () => {
  it("un exemplaire du ticket le moins cher du meilleur lieu, qui rapporte 3 fois son prix", () => {
    expect([0, 10, 60, 250, 1000].map((s) => houseTicketDef(s).id)).toEqual([
      "tirelire", "lucarne", "vingt-et-un", "pie-voleuse", "regate",
    ]);
    expect([0, 10, 60, 250, 1000].map(houseGain)).toEqual([3, 30, 300, 30_000, 3_000_000]);
  });

  it("condition : aucun ticket en attente et un solde sous le prix du ticket le moins cher", () => {
    expect(houseEligible({ balance: 0, pendingCount: 0, standing: 0 })).toBe(true);
    expect(houseEligible({ balance: 1, pendingCount: 0, standing: 0 })).toBe(false);
    expect(houseEligible({ balance: 0, pendingCount: 1, standing: 0 })).toBe(false);
    // On ne redescend jamais d'un lieu : au Grand Café, 9 € ne suffisent pas.
    expect(houseEligible({ balance: 9, pendingCount: 0, standing: 10 })).toBe(true);
    expect(houseEligible({ balance: 10, pendingCount: 0, standing: 10 })).toBe(false);
    expect(houseEligible({ balance: 999_999, pendingCount: 0, standing: 1000 })).toBe(true);
    expect(cheapestTicket("cercle").price).toBe(1_000_000);
  });

  it("le solde de départ suffit pour commencer", () => {
    expect(START_BALANCE).toBe(4);
    expect(houseEligible({ balance: START_BALANCE, pendingCount: 0, standing: 0 })).toBe(false);
  });
});

describe("paliers de résultat", () => {
  it("les bornes de la section 8.5", () => {
    expect(tierOf(0, 5)).toBe("perdu");
    expect(tierOf(5, 5)).toBe("rembourse");
    expect(tierOf(10, 5)).toBe("petit");
    expect(tierOf(15, 5)).toBe("petit");
    expect(tierOf(25, 5)).toBe("joli");
    expect(tierOf(100, 5)).toBe("joli");
    expect(tierOf(125, 5)).toBe("gros");
    expect(tierOf(250, 5)).toBe("gros");
    expect(tierOf(500, 5)).toBe("enorme");
    expect(tierOf(1250, 5)).toBe("enorme");
    expect(tierOf(2500, 5)).toBe("jackpot");
    expect(tierOf(25000, 5)).toBe("jackpot");
  });

  it("le ticket de la maison joue le palier « petit »", () => {
    expect(tierOf(3, 1, true)).toBe("petit");
    expect(tierOf(3_000_000, 1_000_000, true)).toBe("petit");
  });
});

describe("registre des personnages", () => {
  it("change aux seuils 60, 250 et 1 000", () => {
    expect([0, 59, 60, 249, 250, 999, 1000, 5000].map(registerOf)).toEqual([
      "familier", "familier", "poli", "poli", "deferent", "deferent", "obsequieux", "obsequieux",
    ]);
  });
});

describe("pseudo", () => {
  it("accepte 3 à 16 caractères : lettres accentuées ou non, chiffres, espace, tiret", () => {
    for (const ok of ["Marcel", "Zoé", "Tonton Jo", "Belle Lurette", "Jean-Luc 2", "Lulu", "abc", "A234567890123456", "Éloïse"]) {
      expect([ok, validatePseudo(ok).ok]).toEqual([ok, true]);
    }
  });

  it("refuse les formats invalides", () => {
    for (const bad of ["ab", "A2345678901234567", "Jean_Luc", "a@b", "   ", "-ab", "ab-", "émoji🙂", "", "a\u0000b"]) {
      const r = validatePseudo(bad);
      expect([bad, r.ok, r.ok ? "" : r.reason]).toEqual([bad, false, "format"]);
    }
    expect(validatePseudo(42).ok).toBe(false);
    expect(validatePseudo(undefined).ok).toBe(false);
  });

  it("refuse « admin », les noms des personnages et les grossièretés courantes", () => {
    for (const bad of [
      "admin", "Admin 2", "Administrateur", "Gaspard", "gaspard75", "Le Baron", "Sir Auguste", "Mlle Sidonie",
      "Enzo", "Mme Colette", "Archibald", "Piou", "Ondine", "Hector", "Grattouille", "xXconnardXx", "Gros Con",
      "sale-pute", "Putain", "ENCULÉ", "Mérde",
    ]) {
      const r = validatePseudo(bad);
      expect([bad, r.ok, r.ok ? "" : r.reason]).toEqual([bad, false, "refused"]);
    }
  });

  it("ne refuse pas un pseudo honnête qui contient ces lettres par hasard", () => {
    for (const ok of ["Conrad", "Monique", "Baronne", "Hectorine", "Calcul", "Dominique", "Colettine"]) {
      expect([ok, validatePseudo(ok).ok]).toEqual([ok, true]);
    }
  });

  it("unique sans tenir compte de la casse ni des accents", () => {
    expect(pseudoKey("Zoé")).toBe(pseudoKey("ZOE"));
    expect(pseudoKey("  Tonton   Jo ")).toBe("tonton_jo");
    expect(pseudoKey("Éloïse")).toBe("eloise");
    expect(pseudoKey("Cœur")).toBe("coeur");
    expect(pseudoKey("Jean-Luc")).not.toBe(pseudoKey("Jean Luc"));
    const r = validatePseudo("  Tonton   Jo ");
    expect(r.ok && r.pseudo).toBe("Tonton Jo");
  });
});

describe("code de récupération", () => {
  it("alphabet sans caractères ambigus", () => {
    expect(CODE_ALPHABET).toBe("ABCDEFGHJKMNPQRSTVWXYZ23456789");
    for (const ch of "ILOU01") expect(CODE_ALPHABET.includes(ch)).toBe(false);
  });

  it("s'affiche sous la forme XXXX-XXXX-XXXX-XXXX et se relit avec ou sans tirets", () => {
    const code = "ABCD2345EFGH6789";
    expect(formatCode(code)).toBe("ABCD-2345-EFGH-6789");
    expect(normalizeCode("abcd-2345-efgh-6789")).toBe(code);
    expect(normalizeCode(" ABCD 2345 EFGH 6789 ")).toBe(code);
    expect(normalizeCode("ABCD-2345-EFGH-678")).toBeNull();
    expect(normalizeCode("ABCD-2345-EFGH-67O9")).toBeNull();
    expect(normalizeCode(12)).toBeNull();
  });
});

describe("numéro de série", () => {
  it("GR-0000-0000, dérivé de la graine", () => {
    expect(serialOf(0)).toBe("GR-0000-0000");
    expect(serialOf(48_210_937)).toBe("GR-4821-0937");
    expect(serialOf(4_294_967_295)).toMatch(/^GR-\d{4}-\d{4}$/);
  });
});
