// Règles, catalogue et affichage (BRIEF.md, sections 5, 6.1, 8.5, 11 et annexe A).

import { describe, expect, it } from "vitest";
import { CATALOG, COLLECTION_SIZE, KIOSK, SHOPS, itemsOfShop, itemsOfSlot, standingForPrice } from "../shared/catalog";
import { formatEuros, formatInt, formatPercent, formatReturn } from "../shared/format";
import { PLACES } from "../shared/places";
import {
  CODE_ALPHABET, HOUSE_COOLDOWN_MS, LUCKY_FIND_MS, MAX_PENDING, START_BALANCE, bestPlace, collectionComplete,
  fortuneOf, formatCode, foundReason, houseEligible, houseGain, houseTicketDef, isPlaceOpen, newlyOpened,
  nextPlace, normalizeCode, pseudoKey, rankOf, registerOf, serialOf, standingOf, tierOf, validatePseudo,
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

  it("mille milliards font un billion : « 1,25 Bn€ », puis « 1 250 Bn€ » au-delà de 999 Bn€", () => {
    expect(plain(formatEuros(999_990_000_000))).toBe("999,99 Md€");
    expect(plain(formatEuros(1_000_000_000_000))).toBe("1 Bn€");
    expect(plain(formatEuros(1_250_000_000_000))).toBe("1,25 Bn€");
    expect(plain(formatEuros(250_000_000_000_000))).toBe("250 Bn€");
    expect(plain(formatEuros(999_990_000_000_000))).toBe("999,99 Bn€");
    expect(plain(formatEuros(1_250_000_000_000_000))).toBe("1 250 Bn€");
    expect(plain(formatEuros(Number.MAX_SAFE_INTEGER))).toBe("9 007 Bn€");
  });

  it("arrondit au plus proche et change d'unité quand l'arrondi la franchit", () => {
    expect(plain(formatEuros(1_994_999))).toBe("1,99 M€");
    expect(plain(formatEuros(1_999_999))).toBe("2 M€");
    expect(plain(formatEuros(1_005_000))).toBe("1,01 M€");
    expect(plain(formatEuros(1_004_999))).toBe("1 M€");
    expect(plain(formatEuros(999_994_999))).toBe("999,99 M€");
    expect(plain(formatEuros(999_999_999))).toBe("1 Md€");
    expect(plain(formatEuros(999_994_999_999))).toBe("999,99 Md€");
    expect(plain(formatEuros(999_999_000_000))).toBe("1 Bn€");
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
  it("110 biens pour 167 930 679 468 784 € et 67 578 ★", () => {
    expect(CATALOG.length).toBe(110);
    expect(COLLECTION_SIZE).toBe(110);
    expect(new Set(CATALOG.map((i) => i.id)).size).toBe(110);
    expect(CATALOG.reduce((s, i) => s + i.price, 0)).toBe(167_930_679_468_784);
    expect(CATALOG.reduce((s, i) => s + i.standing, 0)).toBe(67_578);
    for (const item of CATALOG) expect(Number.isSafeInteger(item.price) && item.price > 0).toBe(true);
  });

  it("les 52 biens du brief sont toujours là, à leur prix : 2 545 029 535 € et 4 086 ★", () => {
    const brief = [
      "beret", "canotier", "melon", "haut-de-forme", "bicorne", "couronne",
      "lunettes-rondes", "solaires-ecaille", "monocle", "lorgnon", "solaires-diamants", "monocle-saphir",
      "mariniere", "veston-tweed", "trois-pieces", "smoking", "queue-de-pie", "cape-imperiale",
      "noeud-pap", "foulard", "gousset", "perles", "tourbillon", "sautoir",
      "velo", "scooter", "citadine", "cabriolet", "berline", "coupe", "supercar", "hypercar", "yacht", "jet",
      "chambre-de-bonne", "studio", "appartement", "maison-pecheur", "loft", "villa-mimosas",
      "hotel-particulier", "villa-corniche", "chateau", "ile",
      "coquillage", "affiche", "vase", "tableau", "statue", "oeuf", "fresque", "diamant",
    ];
    const items = brief.map((id) => CATALOG.find((i) => i.id === id));
    expect(items.every((i) => i !== undefined)).toBe(true);
    expect(items.reduce((s, i) => s + i!.price, 0)).toBe(2_545_029_535);
    expect(items.reduce((s, i) => s + i!.standing, 0)).toBe(4_086);
  });

  it("avec le Kiosque : 417,93 Bn€ et 80 000 ★", () => {
    expect(KIOSK.price).toBe(250_000_000_000_000);
    expect(KIOSK.standing).toBe(12_422);
    const all = CATALOG.map((i) => i.id);
    expect(standingOf(all, true)).toBe(80_000);
    const total = CATALOG.reduce((s, i) => s + i.price, 0) + KIOSK.price;
    expect(total).toBe(417_930_679_468_784);
    expect(plain(formatEuros(total))).toBe("417,93 Bn€");
    // Le Kiosque vaut plus que tout le reste réuni, et tout tient dans un entier exact.
    expect(KIOSK.price).toBeGreaterThan(CATALOG.reduce((s, i) => s + i.price, 0));
    expect(Number.isSafeInteger(total * 2)).toBe(true);
  });

  it("quatre boutiques : 52, 19, 18 et 21 articles", () => {
    expect(SHOPS.map((s) => itemsOfShop(s.id).length)).toEqual([52, 19, 18, 21]);
    for (const slot of ["chapeau", "lunettes", "tenue", "accessoire"] as const) {
      expect(itemsOfSlot(slot).length).toBe(13);
    }
  });

  it("de quoi commencer en gueux et finir ultra-riche", () => {
    const byPrice = [...CATALOG].sort((a, b) => a.price - b.price);
    // La première chose qu'on s'offre : une ficelle à 1 €.
    expect(byPrice[0]!.id).toBe("ficelle");
    expect(byPrice[0]!.price).toBe(1);
    expect(byPrice.filter((i) => i.price <= 10).length).toBeGreaterThanOrEqual(9);
    // La dernière : une comète apprivoisée à 40 Bn€.
    expect(byPrice[byPrice.length - 1]!.id).toBe("comete");
    expect(byPrice[byPrice.length - 1]!.price).toBe(40_000_000_000_000);
    // Chaque rayon a de quoi s'offrir quelque chose à chaque étage de fortune.
    for (const slot of ["chapeau", "lunettes", "tenue", "accessoire", "vehicule", "residence", "tresor"] as const) {
      const prices = itemsOfSlot(slot).map((i) => i.price);
      expect(Math.min(...prices)).toBeLessThanOrEqual(10);
      expect(Math.max(...prices)).toBeGreaterThanOrEqual(10_000_000_000_000);
    }
  });

  it("le barème de Standing suit le prix", () => {
    // Le barème de l'annexe A du brief, de 10 € à 500 M€, est conservé tel quel.
    const brief: [number, number][] = [
      [10, 2], [50, 3], [200, 5], [1_000, 8], [5_000, 12], [20_000, 18], [100_000, 25], [500_000, 40],
      [2_000_000, 60], [10_000_000, 90], [50_000_000, 130], [200_000_000, 200], [500_000_000, 300],
    ];
    for (const [limit, stars] of brief) {
      if (limit > 10) expect(standingForPrice(limit - 1)).toBe(stars);
    }
    expect(standingForPrice(5)).toBe(2);
    expect(standingForPrice(4)).toBe(1);
    expect(standingForPrice(500_000_000)).toBe(400);
    expect(standingForPrice(2_000_000_000)).toBe(600);
    expect(standingForPrice(5_000_000_000_000)).toBe(4_000);
    for (const item of CATALOG) {
      expect([item.id, item.standing]).toEqual([item.id, standingForPrice(item.price)]);
    }
  });

  it("achats cumulés pour ouvrir chaque lieu, du moins cher au plus cher", () => {
    const byPrice = [...CATALOG].sort((a, b) => a.price - b.price);
    const costToReach = (standing: number): { cost: number; count: number } => {
      let stars = 0;
      let cost = 0;
      let count = 0;
      for (const item of byPrice) {
        if (stars >= standing) break;
        stars += item.standing;
        cost += item.price;
        count++;
      }
      return { cost, count };
    };
    expect(PLACES.slice(1).map((p) => costToReach(p.standing))).toEqual([
      { cost: 74, count: 12 },                      // le Grand Café : les douze premières babioles
      { cost: 5_984, count: 32 },                   // le Casino
      { cost: 248_784, count: 47 },                 // le Salon Privé
      { cost: 34_468_784, count: 64 },              // le Cercle
      { cost: 3_279_468_784, count: 81 },           // le Yacht
      { cost: 380_679_468_784, count: 94 },         // la Banque
      { cost: 25_930_679_468_784, count: 104 },     // la Lune
    ]);
  });
});

describe("Standing et fortune", () => {
  it("le Standing est la somme des ★ possédées, portées ou non", () => {
    expect(standingOf([], false)).toBe(0);
    expect(standingOf(["noeud-pap", "beret", "lunettes-rondes", "mariniere"], false)).toBe(10);
    expect(standingOf(["noeud-pap", "inconnu"], false)).toBe(2);
    expect(standingOf(["ficelle"], false)).toBe(1);
    expect(standingOf([], true)).toBe(12_422);
  });

  it("la fortune : solde, gains en attente, prix d'achat des biens", () => {
    const pending: PendingTicket[] = [
      { id: "t_aaaaaaaaaaaa", type: "tirelire", gain: 5, seed: 1, at: 0 },
      { id: "t_bbbbbbbbbbbb", type: "tirelire", gain: 0, seed: 2, at: 0 },
    ];
    expect(fortuneOf({ balance: 3, pending, owned: [], kiosk: false })).toBe(8);
    expect(fortuneOf({ balance: 3, pending: [], owned: ["noeud-pap"], kiosk: false })).toBe(8);
    expect(fortuneOf({ balance: 0, pending: [], owned: [], kiosk: true })).toBe(250_000_000_000_000);
  });

  it("acheter ne fait jamais baisser la fortune", () => {
    const before = fortuneOf({ balance: 100, pending: [], owned: [], kiosk: false });
    const after = fortuneOf({ balance: 100 - 60, pending: [], owned: ["foulard"], kiosk: false });
    expect(after).toBe(before);
  });

  it("collection complète : les 110 biens, pas un de moins", () => {
    const all = CATALOG.map((i) => i.id);
    expect(collectionComplete(all)).toBe(true);
    expect(collectionComplete(all.slice(1))).toBe(false);
    expect(collectionComplete([...all.slice(1), all[1]!])).toBe(false);
  });
});

describe("lieux", () => {
  it("huit lieux, du port à la Lune, et leurs seuils de Standing", () => {
    expect(PLACES.map((p) => [p.id, p.standing])).toEqual([
      ["kiosque", 0], ["cafe", 20], ["casino", 130], ["salon", 400], ["cercle", 1_400],
      ["yacht", 5_000], ["banque", 15_000], ["lune", 40_000],
    ]);
    expect(isPlaceOpen("kiosque", 0)).toBe(true);
    expect(isPlaceOpen("cafe", 19)).toBe(false);
    expect(isPlaceOpen("cafe", 20)).toBe(true);
    expect(isPlaceOpen("cercle", 1_399)).toBe(false);
    expect(isPlaceOpen("cercle", 1_400)).toBe(true);
    expect(isPlaceOpen("lune", 39_999)).toBe(false);
    expect(isPlaceOpen("lune", 40_000)).toBe(true);
    // Chaque lieu a son hôte et son heure.
    expect(new Set(PLACES.map((p) => p.host)).size).toBe(8);
    expect(new Set(PLACES.map((p) => p.moment)).size).toBe(8);
  });

  it("meilleur lieu débloqué et prochain lieu", () => {
    expect(bestPlace(0).id).toBe("kiosque");
    expect(bestPlace(129).id).toBe("cafe");
    expect(bestPlace(130).id).toBe("casino");
    expect(bestPlace(5_000).id).toBe("yacht");
    expect(bestPlace(80_000).id).toBe("lune");
    expect(nextPlace(0)?.id).toBe("cafe");
    expect(nextPlace(34)?.id).toBe("casino");
    expect(nextPlace(1_400)?.id).toBe("yacht");
    expect(nextPlace(40_000)).toBeNull();
  });

  it("lieux ouverts par un achat qui franchit un seuil", () => {
    expect(newlyOpened(18, 20).map((p) => p.id)).toEqual(["cafe"]);
    expect(newlyOpened(20, 22)).toEqual([]);
    expect(newlyOpened(125, 405).map((p) => p.id)).toEqual(["casino", "salon"]);
  });

  it("le rang : de gueux à Crésus, puis Patron", () => {
    expect([0, 20, 130, 400, 1_400, 5_000, 15_000, 40_000].map((s) => rankOf(s, false))).toEqual([
      "Gueux", "Habitué", "Flambeur", "Notable", "Rentier", "Nabab", "Magnat", "Crésus",
    ]);
    expect(rankOf(19, false)).toBe("Gueux");
    expect(rankOf(80_000, true)).toBe("Patron");
  });
});

describe("ticket trouvé par terre", () => {
  const thresholds = [0, 20, 130, 400, 1_400, 5_000, 15_000, 40_000];

  it("un exemplaire du ticket le moins cher du meilleur lieu, qui rapporte 3 fois son prix", () => {
    expect(thresholds.map((s) => houseTicketDef(s).id)).toEqual([
      "tirelire", "lucarne", "vingt-et-un", "pie-voleuse", "regate", "cocktails", "sesame", "eclipse-totale",
    ]);
    expect(thresholds.map(houseGain)).toEqual([
      3, 30, 300, 30_000, 3_000_000, 300_000_000, 15_000_000_000, 750_000_000_000,
    ]);
  });

  it("fauché : aucun ticket en attente et un solde sous le prix du ticket le moins cher", () => {
    expect(houseEligible({ balance: 0, pendingCount: 0, standing: 0 })).toBe(true);
    expect(houseEligible({ balance: 1, pendingCount: 0, standing: 0 })).toBe(false);
    expect(houseEligible({ balance: 0, pendingCount: 1, standing: 0 })).toBe(false);
    // On ne redescend jamais d'un lieu : au Grand Café, 9 € ne suffisent pas.
    expect(houseEligible({ balance: 9, pendingCount: 0, standing: 20 })).toBe(true);
    expect(houseEligible({ balance: 10, pendingCount: 0, standing: 20 })).toBe(false);
    expect(houseEligible({ balance: 999_999, pendingCount: 0, standing: 1_400 })).toBe(true);
    expect(cheapestTicket("cercle").price).toBe(1_000_000);
  });

  it("on débarque sans un sou : le premier ticket se ramasse par terre", () => {
    expect(START_BALANCE).toBe(0);
    // Un compte tout neuf n'a jamais rien trouvé : le ticket l'attend.
    expect(foundReason({ balance: START_BALANCE, pendingCount: 0, standing: 0, since: Number.MAX_SAFE_INTEGER })).toBe("fauche");
  });

  it("fauché, un ticket toutes les 20 secondes au plus ; sinon un coup de chance toutes les 8 minutes", () => {
    const broke = { balance: 0, pendingCount: 0, standing: 0 };
    expect(foundReason({ ...broke, since: HOUSE_COOLDOWN_MS - 1 })).toBeNull();
    expect(foundReason({ ...broke, since: HOUSE_COOLDOWN_MS })).toBe("fauche");
    const rich = { balance: 5_000, pendingCount: 0, standing: 0 };
    expect(foundReason({ ...rich, since: HOUSE_COOLDOWN_MS })).toBeNull();
    expect(foundReason({ ...rich, since: LUCKY_FIND_MS - 1 })).toBeNull();
    expect(foundReason({ ...rich, since: LUCKY_FIND_MS })).toBe("chance");
    // Le coup de chance ne demande pas une pile vide, seulement de la place.
    expect(foundReason({ ...rich, pendingCount: 3, since: LUCKY_FIND_MS })).toBe("chance");
    expect(foundReason({ ...rich, pendingCount: MAX_PENDING, since: LUCKY_FIND_MS })).toBeNull();
    // Sans le sou mais avec des tickets à gratter : on gratte d'abord, la chance peut passer quand même.
    expect(foundReason({ balance: 0, pendingCount: 2, standing: 0, since: HOUSE_COOLDOWN_MS })).toBeNull();
    expect(foundReason({ balance: 0, pendingCount: 2, standing: 0, since: LUCKY_FIND_MS })).toBe("chance");
  });

  it("jamais bloqué : à tout Standing, qui n'a rien et rien à gratter trouve un ticket", () => {
    for (const standing of [0, 5, 20, 131, 999, 1_400, 5_000, 15_000, 40_000, 80_000]) {
      expect(foundReason({ balance: 0, pendingCount: 0, standing, since: HOUSE_COOLDOWN_MS })).toBe("fauche");
      // Et ce ticket rapporte de quoi rejouer au moins trois fois dans le meilleur lieu.
      expect(houseGain(standing)).toBeGreaterThanOrEqual(3 * houseTicketDef(standing).price);
    }
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

  it("le ticket trouvé par terre joue le palier « petit »", () => {
    expect(tierOf(3, 1, true)).toBe("petit");
    expect(tierOf(3_000_000, 1_000_000, true)).toBe("petit");
  });
});

describe("registre des personnages", () => {
  it("change quand les portes s'ouvrent : 130, 400, 1 400 et 15 000", () => {
    expect([0, 129, 130, 399, 400, 1_399, 1_400, 14_999, 15_000, 80_000].map(registerOf)).toEqual([
      "familier", "familier", "poli", "poli", "deferent", "deferent", "obsequieux", "obsequieux", "cosmique", "cosmique",
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
