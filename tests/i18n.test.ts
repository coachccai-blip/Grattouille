// Le socle bilingue : les noms anglais des données (src/i18n/en/noms.ts), les fonctions
// de src/i18n/noms.ts, `t()` et ses dictionnaires, et les formats dans les deux langues.

import { afterEach, describe, expect, it, vi } from "vitest";
import { CATALOG, KIOSK, SHOPS, SLOT_LABELS } from "../shared/catalog";
import { TEMPERAMENT_LABELS } from "../shared/economy";
import {
  NBSP, THIN, formatEuros, formatInt, formatPercent, formatReturn, getFormatLang, splitAmount,
} from "../shared/format";
import { PLACES } from "../shared/places";
import { SPECIES, SPECIES_LABELS, rankOf } from "../shared/rules";
import { TICKETS } from "../shared/tickets";
import type { Slot, Temperament } from "../shared/types";
import { LANGS, i18nMisses, isLang, lang, pick, setLang, t } from "../src/i18n";
import { EN_BOUTIQUES } from "../src/i18n/en/boutiques";
import { EN_JEU } from "../src/i18n/en/jeu";
import {
  EN_ITEM_NAMES, EN_PLACES, EN_RANKS, EN_SHOPS, EN_SLOT_LABELS, EN_SPECIES, EN_TEMPERAMENTS, EN_TICKET_NAMES,
} from "../src/i18n/en/noms";
import { EN_RECIT } from "../src/i18n/en/recit";
import { EN_TICKETS } from "../src/i18n/en/tickets";
import * as noms from "../src/i18n/noms";

// Chaque test repart du français, quoi qu'il arrive dans le précédent.
afterEach(() => setLang("fr"));

/** Les espaces insécables de la typographie française, ramenées à des espaces ordinaires. */
const plain = (s: string) => s.replace(/[  ]/g, " ");
const sorted = (list: readonly string[]) => [...list].sort();
/** Longueur en caractères, pas en unités UTF-16. */
const len = (s: string) => [...s].length;

const ITEMS = [...CATALOG, KIOSK];
const SLOTS = Object.keys(SLOT_LABELS) as Slot[];
const TEMPERAMENTS = Object.keys(TEMPERAMENT_LABELS) as Temperament[];
/** Les clés des rangs : un par lieu, puis celui du propriétaire du Kiosque, puis celui de la vraie fin. */
const RANK_KEYS = [...PLACES.map((p) => p.id), "patron", "legende"];
const frenchRank = (key: string) => {
  const place = PLACES.find((p) => p.id === key);
  return place ? rankOf(place.standing, false) : rankOf(0, true, key === "legende");
};

/**
 * Tous les noms, par paires : ce que c'est, le français de shared/, l'anglais de
 * en/noms.ts (`undefined` s'il manque).
 */
function pairs(): { what: string; fr: string; en: string | undefined }[] {
  return [
    ...TICKETS.map((x) => ({ what: `ticket:${x.id}`, fr: x.name, en: EN_TICKET_NAMES[x.id] })),
    ...ITEMS.map((i) => ({ what: `item:${i.id}`, fr: i.name, en: EN_ITEM_NAMES[i.id] })),
    ...PLACES.flatMap((p) => [
      { what: `place:${p.id}`, fr: p.name, en: EN_PLACES[p.id]?.name },
      { what: `place:${p.id}:short`, fr: p.short, en: EN_PLACES[p.id]?.short },
      { what: `place:${p.id}:moment`, fr: p.moment, en: EN_PLACES[p.id]?.moment },
    ]),
    ...SHOPS.flatMap((s) => [
      { what: `shop:${s.id}`, fr: s.name, en: EN_SHOPS[s.id]?.name },
      { what: `shop:${s.id}:keeper`, fr: s.keeperName, en: EN_SHOPS[s.id]?.keeperName },
      { what: `shop:${s.id}:blurb`, fr: s.blurb, en: EN_SHOPS[s.id]?.blurb },
    ]),
    ...SLOTS.map((s) => ({ what: `slot:${s}`, fr: SLOT_LABELS[s], en: EN_SLOT_LABELS[s] })),
    ...SPECIES.map((s) => ({ what: `species:${s}`, fr: SPECIES_LABELS[s], en: EN_SPECIES[s] })),
    ...RANK_KEYS.map((k) => ({ what: `rank:${k}`, fr: frenchRank(k), en: EN_RANKS[k] })),
    ...TEMPERAMENTS.map((x) => ({ what: `temperament:${x}`, fr: TEMPERAMENT_LABELS[x], en: EN_TEMPERAMENTS[x] })),
  ];
}

/** Ce que `i18nMisses()` noterait pour chaque nom connu, s'il manquait en anglais. */
const KNOWN = pairs().map((p) => p.what);

type Noms = typeof noms;

/** Tous les noms connus, lus par les fonctions de noms.ts dans la langue courante. */
function readAll(n: Noms) {
  return {
    tickets: TICKETS.map((x) => n.ticketName(x.id)),
    items: ITEMS.map((i) => n.itemName(i.id)),
    places: PLACES.map((p) => [n.placeName(p.id), n.placeShort(p.id), n.placeMoment(p.id)]),
    shops: SHOPS.map((s) => [n.shopName(s.id), n.keeperName(s.id), n.shopBlurb(s.id)]),
    slots: SLOTS.map((s) => n.slotLabel(s)),
    species: SPECIES.map((s) => n.speciesName(s)),
    ranks: [...PLACES.map((p) => n.rankName(p.standing, false)), n.rankName(0, true), n.rankName(0, true, true)],
    temperaments: TEMPERAMENTS.map((x) => n.temperamentName(x)),
  };
}

/** Les mêmes, tels que shared/ les écrit. */
const FRENCH = {
  tickets: TICKETS.map((x) => x.name),
  items: ITEMS.map((i) => i.name),
  places: PLACES.map((p) => [p.name, p.short, p.moment]),
  shops: SHOPS.map((s) => [s.name, s.keeperName, s.blurb]),
  slots: SLOTS.map((s) => SLOT_LABELS[s]),
  species: SPECIES.map((s) => SPECIES_LABELS[s]),
  ranks: RANK_KEYS.map(frenchRank),
  temperaments: TEMPERAMENTS.map((x) => TEMPERAMENT_LABELS[x]),
};

/** Les mêmes, tels que en/noms.ts les écrit. */
const ENGLISH = {
  tickets: TICKETS.map((x) => EN_TICKET_NAMES[x.id]),
  items: ITEMS.map((i) => EN_ITEM_NAMES[i.id]),
  places: PLACES.map((p) => [EN_PLACES[p.id].name, EN_PLACES[p.id].short, EN_PLACES[p.id].moment]),
  shops: SHOPS.map((s) => [EN_SHOPS[s.id].name, EN_SHOPS[s.id].keeperName, EN_SHOPS[s.id].blurb]),
  slots: SLOTS.map((s) => EN_SLOT_LABELS[s]),
  species: SPECIES.map((s) => EN_SPECIES[s]),
  ranks: RANK_KEYS.map((k) => EN_RANKS[k]),
  temperaments: TEMPERAMENTS.map((x) => EN_TEMPERAMENTS[x]),
};

// ---------------------------------------------------------------------------

describe("noms anglais : rien ne manque", () => {
  it("un titre pour chacun des 30 tickets, et pas un de plus", () => {
    expect(TICKETS.length).toBe(30);
    expect(sorted(Object.keys(EN_TICKET_NAMES))).toEqual(sorted(TICKETS.map((x) => x.id)));
  });

  it("un nom pour chacun des 110 biens et pour le Kiosque", () => {
    expect(CATALOG.length).toBe(110);
    expect(sorted(Object.keys(EN_ITEM_NAMES))).toEqual(sorted([...CATALOG.map((i) => i.id), "kiosque"]));
    // Le Kiosque à vendre porte le nom du lieu, dans les deux langues.
    expect(KIOSK.name).toBe(PLACES[0]!.name);
    expect(EN_ITEM_NAMES.kiosque).toBe(EN_PLACES.kiosque.name);
  });

  it("les huit lieux : nom, nom court et moment de la journée", () => {
    expect(sorted(Object.keys(EN_PLACES))).toEqual(sorted(PLACES.map((p) => p.id)));
    for (const p of PLACES) expect(sorted(Object.keys(EN_PLACES[p.id]))).toEqual(["moment", "name", "short"]);
    // Chaque lieu a son heure, comme en français.
    expect(new Set(PLACES.map((p) => EN_PLACES[p.id].moment)).size).toBe(PLACES.length);
  });

  it("les quatre boutiques : enseigne, vendeur et rayon", () => {
    expect(sorted(Object.keys(EN_SHOPS))).toEqual(sorted(SHOPS.map((s) => s.id)));
    for (const s of SHOPS) expect(sorted(Object.keys(EN_SHOPS[s.id]))).toEqual(["blurb", "keeperName", "name"]);
  });

  it("emplacements, espèces, rangs et tempéraments", () => {
    expect(sorted(Object.keys(EN_SLOT_LABELS))).toEqual(sorted(SLOTS));
    expect(sorted(Object.keys(EN_SPECIES))).toEqual(sorted(SPECIES));
    expect(sorted(Object.keys(EN_RANKS))).toEqual(sorted(RANK_KEYS));
    expect(sorted(Object.keys(EN_TEMPERAMENTS))).toEqual(sorted(TEMPERAMENTS));
  });

  it("aucune entrée absente ni vide", () => {
    const all = pairs();
    // 30 tickets, 111 biens, 8 × 3 pour les lieux, 4 × 3 pour les boutiques, 7 emplacements,
    // 8 espèces, 10 rangs, 3 tempéraments.
    expect(all.length).toBe(30 + 111 + 24 + 12 + 7 + 8 + 10 + 3);
    expect(all.filter((p) => typeof p.en !== "string" || p.en.trim() === "").map((p) => p.what)).toEqual([]);
  });
});

describe("noms anglais : écriture", () => {
  const all = pairs().map((p) => ({ what: p.what, fr: p.fr, en: p.en ?? "" }));
  const failing = (test: (en: string, fr: string) => boolean) =>
    all.filter((p) => !test(p.en, p.fr)).map((p) => `${p.what} : ${p.en}`);

  it("guillemets anglais : ni « ni » dans un nom anglais", () => {
    expect(failing((en) => !/[«»]/.test(en))).toEqual([]);
    // Un guillemet ouvert se referme, et jamais de guillemet droit.
    expect(failing((en) => (en.match(/“/g) ?? []).length === (en.match(/”/g) ?? []).length)).toEqual([]);
    expect(failing((en) => !en.includes('"'))).toEqual([]);
  });

  it("un surnom entre « » reste un surnom, entre “ ”", () => {
    // Des véhicules, deux résidences, deux trésors et le Yacht.
    const nicknamed = all.filter((p) => p.fr.includes("«"));
    expect(nicknamed.length).toBeGreaterThan(0);
    expect(nicknamed.filter((p) => !/“[^“”]+”/.test(p.en)).map((p) => p.what)).toEqual([]);
    // Et l'anglais n'en invente pas là où le français n'en a pas.
    expect(failing((en, fr) => fr.includes("«") || !en.includes("“"))).toEqual([]);
  });

  it("pas d'espace insécable, d'espace double ni d'espace au bord : l'anglais s'affiche tel quel", () => {
    expect(failing((en) => !/[   ]/.test(en))).toEqual([]);
    expect(failing((en) => !/\s{2}/.test(en) && en === en.trim())).toEqual([]);
  });

  it("des noms tous différents, là où le français les distingue", () => {
    const duplicates = (list: string[]) => list.filter((x, i) => list.indexOf(x) !== i);
    expect(duplicates(Object.values(EN_TICKET_NAMES))).toEqual([]);
    // Seul le Kiosque porte deux fois le même nom : c'est un bien et un lieu.
    expect(duplicates(CATALOG.map((i) => EN_ITEM_NAMES[i.id]!))).toEqual([]);
    expect(duplicates(Object.values(EN_SPECIES))).toEqual([]);
    expect(duplicates(Object.values(EN_RANKS))).toEqual([]);
    expect(duplicates(Object.values(EN_TEMPERAMENTS))).toEqual([]);
    expect(duplicates(PLACES.map((p) => EN_PLACES[p.id].name))).toEqual([]);
    expect(duplicates(PLACES.map((p) => EN_PLACES[p.id].short))).toEqual([]);
    expect(duplicates(SHOPS.map((s) => EN_SHOPS[s.id].name))).toEqual([]);
  });

  it("capitales : comme en français", () => {
    const upper = /^\p{Lu}/u;
    // Biens, lieux, moments, enseignes, rayons, emplacements, espèces, rangs : une capitale en tête.
    expect(
      all.filter((p) => !/^(place:\w+:short|temperament:)/.test(p.what) && !upper.test(p.en)).map((p) => p.what),
    ).toEqual([]);
    // Le nom court d'un lieu se lit en cours de phrase : article en minuscule.
    for (const p of PLACES) expect(EN_PLACES[p.id].short).toMatch(/^the \p{Lu}/u);
    // Les tempéraments suivent « tempérament : » sur la jauge : un seul mot, en minuscules.
    for (const x of TEMPERAMENTS) expect(EN_TEMPERAMENTS[x]).toMatch(/^[a-z]+(-[a-z]+)?$/);
  });
});

describe("noms anglais : longueurs", () => {
  // Les noms sont imprimés sur des étiquettes, des pastilles et des bandeaux de ticket,
  // dessinés pour le français : l'anglais ne doit pas déborder.
  const MAX_EXTRA = 6;
  const MAX_TITLE = 24;

  it("un nom anglais ne dépasse pas son original de plus de 6 caractères", () => {
    const tooLong = pairs()
      .filter((p) => len(p.en ?? "") > len(p.fr) + MAX_EXTRA)
      .map((p) => `${p.what} : « ${p.fr} » (${len(p.fr)}) → “${p.en}” (${len(p.en ?? "")})`);
    expect(tooLong).toEqual([]);
  });

  it("un titre de ticket tient en 24 caractères, comme les plus longs titres français", () => {
    expect(Math.max(...TICKETS.map((x) => len(x.name)))).toBeLessThanOrEqual(MAX_TITLE + 1);
    const tooLong = TICKETS.map((x) => EN_TICKET_NAMES[x.id] ?? "").filter((title) => len(title) > MAX_TITLE);
    expect(tooLong).toEqual([]);
  });

  it("un rang tient en un ou deux mots", () => {
    for (const k of RANK_KEYS) expect([k, EN_RANKS[k]!.split(" ").length <= 2]).toEqual([k, true]);
  });

  it("les tickets sont originaux : aucun titre de jeu de loterie existant", () => {
    const taken = [
      "cash", "jackpot", "solitaire", "banco", "astro", "black jack", "blackjack", "goal", "vegas", "millionaire",
      "millionnaire", "morpion", "bingo", "crossword", "nest egg", "piggy bank", "stocking filler", "pot of gold",
    ];
    const bare = (title: string) => title.toLowerCase().replace(/^the /, "").replace(/[!?.]/g, "").trim();
    expect(TICKETS.map((x) => EN_TICKET_NAMES[x.id] ?? "").filter((title) => taken.includes(bare(title)))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("noms.ts : français par défaut, anglais sur demande", () => {
  it("la langue de départ est le français, et setLang règle aussi les formats", () => {
    expect(lang()).toBe("fr");
    expect(getFormatLang()).toBe("fr");
    setLang("en");
    expect(lang()).toBe("en");
    expect(getFormatLang()).toBe("en");
    setLang("fr");
    expect(lang()).toBe("fr");
    expect(getFormatLang()).toBe("fr");
  });

  it("deux langues, et rien d'autre", () => {
    expect(LANGS).toEqual(["fr", "en"]);
    expect(isLang("fr") && isLang("en")).toBe(true);
    for (const bad of ["", "FR", "de", "english", null, undefined, 0, {}]) expect([bad, isLang(bad)]).toEqual([bad, false]);
  });

  it("en français : les noms de shared/, tels quels", () => {
    expect(readAll(noms)).toEqual(FRENCH);
    expect(noms.ticketName("tirelire")).toBe("La Tirelire de Piou");
    expect(noms.itemName("aureole")).toBe("Auréole (authentique)");
    expect(noms.itemName("kiosque")).toBe("Le Kiosque de Gaspard");
    expect(noms.placeShort("casino")).toBe("le Casino");
    expect(noms.rankName(0, false)).toBe("Gueux");
  });

  it("en anglais : les noms de en/noms.ts", () => {
    setLang("en");
    expect(readAll(noms)).toEqual(ENGLISH);
    expect(noms.ticketName("tirelire")).toBe("Piou's Piggy Bank");
    expect(noms.itemName("aureole")).toBe("Halo (genuine)");
    expect(noms.itemName("soucoupe")).toBe("Second-hand flying saucer");
    expect(noms.itemName("kiosque")).toBe("Gaspard's Kiosk");
    expect(noms.placeName("kiosque")).toBe("Gaspard's Kiosk");
    expect(noms.placeShort("casino")).toBe("the Casino");
    expect(noms.placeMoment("lune")).toBe("Earthrise");
    expect(noms.keeperName("sidonie")).toBe("Mlle Sidonie");
    expect(noms.slotLabel("chapeau")).toBe("Hats");
    expect(noms.speciesName("raton")).toBe("Raccoon");
    expect(noms.temperamentName("casse-cou")).toBe("daredevil");
  });

  it("revenir au français rend les noms français", () => {
    setLang("en");
    expect(noms.ticketName("lucarne")).not.toBe("Lucarne");
    setLang("fr");
    expect(readAll(noms)).toEqual(FRENCH);
  });

  it("le rang suit le meilleur lieu ouvert, puis le Kiosque", () => {
    const thresholds = PLACES.map((p) => p.standing);
    expect(thresholds.map((s) => noms.rankName(s, false))).toEqual(thresholds.map((s) => rankOf(s, false)));
    expect(noms.rankName(80_000, true)).toBe("Patron");
    setLang("en");
    expect(thresholds.map((s) => noms.rankName(s, false))).toEqual(PLACES.map((p) => EN_RANKS[p.id]));
    // Juste sous un seuil, on garde le rang du lieu précédent.
    expect(noms.rankName(19, false)).toBe(EN_RANKS.kiosque);
    expect(noms.rankName(39_999, false)).toBe(EN_RANKS.banque);
    // Le propriétaire du Kiosque, quel que soit son Standing.
    expect(noms.rankName(0, true)).toBe(EN_RANKS.patron);
    expect(noms.rankName(80_000, true)).toBe(EN_RANKS.patron);
    // Après la vraie fin : « Légende ». Sans le Kiosque, ce rang n'existe pas.
    expect(noms.rankName(80_000, true, true)).toBe(EN_RANKS.legende);
    expect(noms.rankName(80_000, false, true)).toBe(EN_RANKS.lune);
  });

  it("aucun identifiant connu n'est noté comme manquant", () => {
    setLang("en");
    readAll(noms);
    const misses = i18nMisses();
    expect(KNOWN.filter((what) => misses.includes(what))).toEqual([]);
  });

  it("un identifiant inconnu : rendu tel quel, et noté en anglais seulement", () => {
    expect(noms.ticketName("ticket-inconnu")).toBe("ticket-inconnu");
    expect(noms.itemName("bien-inconnu")).toBe("bien-inconnu");
    expect(noms.speciesName("licorne")).toBe("licorne");
    expect(i18nMisses()).not.toContain("ticket:ticket-inconnu");
    setLang("en");
    expect(noms.ticketName("ticket-inconnu")).toBe("ticket-inconnu");
    expect(noms.itemName("bien-inconnu")).toBe("bien-inconnu");
    expect(noms.speciesName("licorne")).toBe("licorne");
    expect(i18nMisses()).toEqual(expect.arrayContaining(["ticket:ticket-inconnu", "item:bien-inconnu", "species:licorne"]));
  });
});

// Ces tests chargent un second exemplaire du socle, avec des tables de remplacement :
// l'exemplaire des autres tests, sa langue et sa liste de manques ne bougent pas.
describe("ce qui manque retombe sur le français et se signale", () => {
  const EMPTY_NAMES = {
    EN_TICKET_NAMES: {}, EN_ITEM_NAMES: {}, EN_PLACES: {}, EN_SHOPS: {}, EN_SLOT_LABELS: {},
    EN_SPECIES: {}, EN_RANKS: {}, EN_TEMPERAMENTS: {},
  };

  afterEach(() => {
    vi.doUnmock("../src/i18n/en/noms");
    vi.doUnmock("../src/i18n/en/recit");
    vi.resetModules();
  });

  it("sans table anglaise, chaque nom reste français et chaque manque est noté", async () => {
    vi.resetModules();
    vi.doMock("../src/i18n/en/noms", () => EMPTY_NAMES);
    const i18n = await import("../src/i18n");
    const bare = await import("../src/i18n/noms");
    expect(readAll(bare)).toEqual(FRENCH);
    expect(i18n.i18nMisses()).toEqual([]);
    i18n.setLang("en");
    expect(readAll(bare)).toEqual(FRENCH);
    expect(i18n.i18nMisses()).toEqual(sorted(KNOWN));
    // Le second exemplaire a sa propre langue : celle des autres tests n'a pas changé.
    expect(lang()).toBe("fr");
    expect(getFormatLang()).toBe("fr");
  });

  it("un seul nom manquant : lui seul reste français", async () => {
    vi.resetModules();
    const { tirelire: _missing, ...others } = EN_TICKET_NAMES;
    vi.doMock("../src/i18n/en/noms", () => ({
      EN_TICKET_NAMES: others, EN_ITEM_NAMES, EN_PLACES, EN_SHOPS, EN_SLOT_LABELS, EN_SPECIES, EN_RANKS, EN_TEMPERAMENTS,
    }));
    const i18n = await import("../src/i18n");
    const partial = await import("../src/i18n/noms");
    i18n.setLang("en");
    expect(partial.ticketName("tirelire")).toBe("La Tirelire de Piou");
    expect(partial.ticketName("lucarne")).toBe(EN_TICKET_NAMES.lucarne);
    expect(readAll(partial).items).toEqual(ENGLISH.items);
    expect(i18n.i18nMisses()).toEqual(["ticket:tirelire"]);
  });

  it("en anglais, t() rend la phrase du dictionnaire, variables comprises", async () => {
    vi.resetModules();
    vi.doMock("../src/i18n/en/recit", () => ({
      EN_RECIT: {
        "Phrase d'essai du test i18n.": "Sample sentence from the i18n test.",
        "Essai i18n : il te manque {montant}, {pseudo}.": "i18n sample: {pseudo}, you're {montant} short.",
      },
    }));
    const i18n = await import("../src/i18n");
    expect(i18n.t("Phrase d'essai du test i18n.")).toBe("Phrase d'essai du test i18n.");
    i18n.setLang("en");
    expect(i18n.t("Phrase d'essai du test i18n.")).toBe("Sample sentence from the i18n test.");
    // L'ordre des mots change d'une langue à l'autre : les variables suivent.
    expect(i18n.t("Essai i18n : il te manque {montant}, {pseudo}.", { montant: "€5", pseudo: "Zoé" }))
      .toBe("i18n sample: Zoé, you're €5 short.");
    expect(i18n.i18nMisses()).toEqual([]);
    expect(i18n.pick({ fr: "bonjour", en: "hello" })).toBe("hello");
  });
});

// ---------------------------------------------------------------------------

describe("t()", () => {
  it("en français, rend la phrase elle-même", () => {
    expect(t("Tout gratter")).toBe("Tout gratter");
    expect(t("")).toBe("");
    // Une phrase inconnue des dictionnaires ne manque à personne tant qu'on joue en français.
    expect(t("Phrase française que personne n'a traduite.")).toBe("Phrase française que personne n'a traduite.");
    expect(i18nMisses()).not.toContain("Phrase française que personne n'a traduite.");
  });

  it("remplace les {variables}, textes ou nombres, autant de fois qu'elles apparaissent", () => {
    expect(t("Il te manque {montant}.", { montant: "5 €" })).toBe("Il te manque 5 €.");
    expect(t("{n} sur {total}", { n: 3, total: 110 })).toBe("3 sur 110");
    expect(t("{nom}, {nom} et encore {nom}", { nom: "Piou" })).toBe("Piou, Piou et encore Piou");
    expect(t("{n} ticket", { n: 0 })).toBe("0 ticket");
  });

  it("laisse en place une variable qu'on ne lui donne pas, et ignore celles en trop", () => {
    expect(t("Encore {n} ★ pour {lieu}", { n: 12 })).toBe("Encore 12 ★ pour {lieu}");
    expect(t("Encore {n} ★", { n: 12, lieu: "le Casino" })).toBe("Encore 12 ★");
    expect(t("Sans variable {ici}")).toBe("Sans variable {ici}");
    // Une valeur n'est pas relue : elle peut contenir des accolades.
    expect(t("{a} puis {b}", { a: "{b}", b: "fin" })).toBe("{b} puis fin");
  });

  it("en anglais, une phrase sans traduction reste en français et se signale", () => {
    const unknown = "Phrase du test i18n, absente de tous les dictionnaires : {n}.";
    setLang("en");
    expect(t(unknown, { n: 7 })).toBe("Phrase du test i18n, absente de tous les dictionnaires : 7.");
    expect(i18nMisses()).toContain(unknown);
    // Notée une seule fois, et la liste est triée.
    t(unknown);
    const misses = i18nMisses();
    expect(misses.filter((m) => m === unknown).length).toBe(1);
    expect(misses).toEqual(sorted(misses));
  });

  it("pick() rend la valeur de la langue courante", () => {
    const hello = { fr: "bonjour", en: "hello" };
    expect(pick(hello)).toBe("bonjour");
    setLang("en");
    expect(pick(hello)).toBe("hello");
    expect(pick({ fr: 1, en: 2 })).toBe(2);
  });
});

describe("dictionnaires de phrases", () => {
  // Dans l'ordre où src/i18n/index.ts les assemble.
  const DICTIONARIES: [string, Record<string, string>][] = [
    ["recit", EN_RECIT], ["jeu", EN_JEU], ["boutiques", EN_BOUTIQUES], ["tickets", EN_TICKETS],
  ];
  const entries = DICTIONARIES.flatMap(([name, dict]) => Object.entries(dict).map(([fr, en]) => ({ name, fr, en })));
  const variables = (s: string) => new Set(s.match(/\{\w+\}/g) ?? []);

  it("t() trouve chaque phrase de chaque dictionnaire", () => {
    const merged: Record<string, string> = Object.assign({}, ...DICTIONARIES.map(([, dict]) => dict));
    setLang("en");
    const wrong = Object.keys(merged).filter((fr) => t(fr) !== merged[fr]);
    expect(wrong).toEqual([]);
    expect(Object.keys(merged).filter((fr) => i18nMisses().includes(fr))).toEqual([]);
  });

  it("une phrase n'a qu'une traduction, d'un dictionnaire à l'autre", () => {
    const first = new Map<string, { name: string; en: string }>();
    const conflicts: string[] = [];
    for (const e of entries) {
      const seen = first.get(e.fr);
      if (!seen) first.set(e.fr, e);
      else if (seen.en !== e.en) conflicts.push(`« ${e.fr} » : “${seen.en}” (${seen.name}) et “${e.en}” (${e.name})`);
    }
    expect(conflicts).toEqual([]);
  });

  it("une traduction n'emploie que les variables de sa phrase française", () => {
    const strangers = entries
      .filter((e) => [...variables(e.en)].some((v) => !variables(e.fr).has(v)))
      .map((e) => `${e.name} : « ${e.fr} » → “${e.en}”`);
    expect(strangers).toEqual([]);
  });

  it("guillemets anglais dans les traductions, et aucune traduction vide", () => {
    expect(entries.filter((e) => /[«»]/.test(e.en)).map((e) => `${e.name} : ${e.en}`)).toEqual([]);
    expect(entries.filter((e) => e.fr.trim() !== "" && e.en.trim() === "").map((e) => `${e.name} : ${e.fr}`)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("formats dans les deux langues", () => {
  /** Montant, écriture française (espaces ordinaires), écriture anglaise. */
  const EUROS: [number, string, string][] = [
    // Sous le million : séparateur de milliers.
    [0, "0 €", "€0"],
    [4, "4 €", "€4"],
    [5, "5 €", "€5"],
    [1_500, "1 500 €", "€1,500"],
    [9_500, "9 500 €", "€9,500"],
    [250_000, "250 000 €", "€250,000"],
    [999_999, "999 999 €", "€999,999"],
    // Millions : deux décimales au plus, sans zéro inutile.
    [1_000_000, "1 M€", "€1M"],
    [1_250_000, "1,25 M€", "€1.25M"],
    [1_500_000, "1,5 M€", "€1.5M"],
    [12_500_000, "12,5 M€", "€12.5M"],
    [20_029_535, "20,03 M€", "€20.03M"],
    [20_030_000, "20,03 M€", "€20.03M"],
    [350_000_000, "350 M€", "€350M"],
    // Milliards : « Md » en français, « B » (billion) en anglais.
    [1_250_000_000, "1,25 Md€", "€1.25B"],
    [2_545_029_535, "2,55 Md€", "€2.55B"],
    [3_545_029_535, "3,55 Md€", "€3.55B"],
    [125_000_000_000, "125 Md€", "€125B"],
    [999_990_000_000, "999,99 Md€", "€999.99B"],
    // Mille milliards : un billion français, « Bn », est un « trillion » anglais, « T ».
    [1_000_000_000_000, "1 Bn€", "€1T"],
    [1_250_000_000_000, "1,25 Bn€", "€1.25T"],
    [250_000_000_000_000, "250 Bn€", "€250T"],
    [417_930_679_468_784, "417,93 Bn€", "€417.93T"],
    [999_990_000_000_000, "999,99 Bn€", "€999.99T"],
    // Au-delà de 999 : plus de décimales, et le séparateur de milliers revient.
    [1_250_000_000_000_000, "1 250 Bn€", "€1,250T"],
    [5e15, "5 000 Bn€", "€5,000T"],
    [Number.MAX_SAFE_INTEGER, "9 007 Bn€", "€9,007T"],
    // L'arrondi au plus proche, et l'unité qui change quand il la franchit.
    [1_994_999, "1,99 M€", "€1.99M"],
    [1_999_999, "2 M€", "€2M"],
    [1_005_000, "1,01 M€", "€1.01M"],
    [1_004_999, "1 M€", "€1M"],
    [999_994_999, "999,99 M€", "€999.99M"],
    [999_999_999, "1 Md€", "€1B"],
    [999_994_999_999, "999,99 Md€", "€999.99B"],
    [999_999_000_000, "1 Bn€", "€1T"],
    [999_999.6, "1 M€", "€1M"],
    // Montants négatifs : le signe passe devant le symbole.
    [-5, "-5 €", "-€5"],
    [-1_250_000, "-1,25 M€", "-€1.25M"],
  ];

  it("formatEuros en français : inchangé (les valeurs de tests/rules.test.ts)", () => {
    for (const [n, fr] of EUROS) expect([n, plain(formatEuros(n))]).toEqual([n, fr]);
  });

  it("formatEuros en anglais : « €1,500 », « €1.25M », « €1.25B », « €1.25T »", () => {
    setLang("en");
    for (const [n, , en] of EUROS) expect([n, formatEuros(n)]).toEqual([n, en]);
    // Les valeurs de la consigne, noir sur blanc.
    expect([0, 5, 1_500, 999_999, 1_000_000, 20_029_535, 1_250_000_000, 1_250_000_000_000, 5e15].map(formatEuros))
      .toEqual(["€0", "€5", "€1,500", "€999,999", "€1M", "€20.03M", "€1.25B", "€1.25T", "€5,000T"]);
  });

  it("le français retrouve ses écritures après un passage par l'anglais", () => {
    const before = EUROS.map(([n]) => formatEuros(n));
    setLang("en");
    expect(EUROS.map(([n]) => formatEuros(n))).not.toEqual(before);
    setLang("fr");
    expect(EUROS.map(([n]) => formatEuros(n))).toEqual(before);
  });

  it("ce qui n'est pas un nombre fini s'écrit zéro", () => {
    for (const n of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) expect(plain(formatEuros(n))).toBe("0 €");
    setLang("en");
    for (const n of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) expect(formatEuros(n)).toBe("€0");
  });

  it("espaces insécables en français, aucune espace en anglais", () => {
    expect(THIN).toBe(" ");
    expect(NBSP).toBe(" ");
    expect(formatEuros(9_500)).toBe("9 500 €");
    expect(formatEuros(1_250_000_000_000_000)).toBe("1 250 Bn€");
    expect(formatInt(1_234_567)).toBe("1 234 567");
    expect(formatPercent(0.61525)).toBe("61,5 %");
    expect(formatReturn(2.59)).toBe("2,59 €");
    setLang("en");
    const english = [
      ...EUROS.map(([n]) => formatEuros(n)), formatInt(1_234_567), formatPercent(0.61525), formatReturn(2.59),
    ];
    expect(english.filter((s) => /\s/.test(s))).toEqual([]);
  });

  /** Entier, écriture française (espaces ordinaires), écriture anglaise. */
  const INTS: [number, string, string][] = [
    [0, "0", "0"],
    [7, "7", "7"],
    [999, "999", "999"],
    [1_000, "1 000", "1,000"],
    [40_000, "40 000", "40,000"],
    [250_000, "250 000", "250,000"],
    [1_234_567, "1 234 567", "1,234,567"],
    [-1_500, "-1 500", "-1,500"],
    // Les décimales sont coupées, pas arrondies.
    [1_234.9, "1 234", "1,234"],
  ];

  it("formatInt : « 250 000 » en français, « 250,000 » en anglais", () => {
    for (const [n, fr] of INTS) expect([n, plain(formatInt(n))]).toEqual([n, fr]);
    setLang("en");
    for (const [n, , en] of INTS) expect([n, formatInt(n)]).toEqual([n, en]);
  });

  /** Part entre 0 et 1, écriture française, écriture anglaise. */
  const PERCENTS: [number, string, string][] = [
    [0.61525, "61,5 %", "61.5%"],
    [0.5206, "52,1 %", "52.1%"],
    [0.3744, "37,4 %", "37.4%"],
    [0, "0,0 %", "0.0%"],
    [0.7, "70,0 %", "70.0%"],
    [1, "100,0 %", "100.0%"],
  ];

  it("formatPercent : « 61,5 % » en français, « 61.5% » en anglais", () => {
    for (const [share, fr] of PERCENTS) expect([share, plain(formatPercent(share))]).toEqual([share, fr]);
    setLang("en");
    for (const [share, , en] of PERCENTS) expect([share, formatPercent(share)]).toEqual([share, en]);
  });

  /** Retour moyen par euro misé, écriture française, écriture anglaise. */
  const RETURNS: [number, string, string][] = [
    [2.59, "2,59 €", "€2.59"],
    [3.15, "3,15 €", "€3.15"],
    [4.89, "4,89 €", "€4.89"],
    [3, "3,00 €", "€3.00"],
    [0.5, "0,50 €", "€0.50"],
    [12.05, "12,05 €", "€12.05"],
  ];

  it("formatReturn : « 2,59 € » en français, « €2.59 » en anglais", () => {
    for (const [x, fr] of RETURNS) expect([x, plain(formatReturn(x))]).toEqual([x, fr]);
    setLang("en");
    for (const [x, , en] of RETURNS) expect([x, formatReturn(x)]).toEqual([x, en]);
  });

  it("splitAmount, à la française : le nombre, puis son unité avec le symbole", () => {
    expect(splitAmount(formatEuros(1_250_000_000_000))).toEqual(["1,25", "Bn€"]);
    expect(splitAmount(formatEuros(1_250_000_000_000_000))).toEqual(["1 250", "Bn€"]);
    expect(splitAmount(formatEuros(2_545_029_535))).toEqual(["2,55", "Md€"]);
    expect(splitAmount(formatEuros(20_029_535))).toEqual(["20,03", "M€"]);
    expect(splitAmount(formatEuros(9_500))).toEqual(["9 500", "€"]);
    expect(splitAmount(formatEuros(-1_250_000))).toEqual(["-1,25", "M€"]);
  });

  it("splitAmount, à l'anglaise : le symbole reste avec le nombre, l'unité se détache", () => {
    setLang("en");
    expect(splitAmount(formatEuros(1_250_000_000_000))).toEqual(["€1.25", "T"]);
    expect(splitAmount(formatEuros(1_250_000_000_000_000))).toEqual(["€1,250", "T"]);
    expect(splitAmount(formatEuros(2_545_029_535))).toEqual(["€2.55", "B"]);
    expect(splitAmount(formatEuros(20_029_535))).toEqual(["€20.03", "M"]);
    expect(splitAmount(formatEuros(-1_250_000))).toEqual(["-€1.25", "M"]);
    // Sous le million, rien à détacher.
    expect(splitAmount(formatEuros(9_500))).toBeNull();
    expect(splitAmount(formatEuros(0))).toBeNull();
  });

  it("splitAmount lit l'écriture du montant, pas la langue courante, et les morceaux se recollent", () => {
    const amounts = [9_500, 20_029_535, 2_545_029_535, 1_250_000_000_000, 5e15, -1_250_000];
    const french = amounts.map(formatEuros);
    setLang("en");
    const english = amounts.map(formatEuros);
    for (const language of ["fr", "en"] as const) {
      setLang(language);
      for (const text of french) {
        const parts = splitAmount(text);
        expect(parts && `${parts[0]}${NBSP}${parts[1]}`).toBe(text);
      }
      for (const text of english.slice(1)) {
        const parts = splitAmount(text);
        expect(parts && `${parts[0]}${parts[1]}`).toBe(text);
      }
    }
    expect(splitAmount("")).toBeNull();
    expect(splitAmount("Patience")).toBeNull();
    expect(splitAmount("€12 and more")).toBeNull();
  });
});
