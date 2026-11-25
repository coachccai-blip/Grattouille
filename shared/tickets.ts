// Les quinze tickets (BRIEF.md, sections 6.4 et 7.10).

import type { PlaceId, TicketDef } from "./types";

export const CONSTELLATIONS = [
  "homard", "chouette", "tortue", "paon", "hippocampe", "cerf",
  "baleine", "papillon", "lievre", "cygne", "abeille", "escargot",
] as const;

export const METS = ["caviar", "champagne", "homard", "truffe", "macaron", "huitre"] as const;

/** Symboles du Bandit Manchot, du plus petit montant au plus grand. */
export const SYMBOLES_BANDIT = [
  "cloche", "cerise", "citron", "trefle", "fer-a-cheval", "etoile", "sept", "diamant", "couronne", "manchot",
] as const;

/** Symboles de La Pie Voleuse, du plus petit montant au plus grand. */
export const SYMBOLES_PIE = [
  "bouton", "perle", "amethyste", "topaze", "aigue-marine", "saphir", "emeraude", "rubis", "diamant", "etoile-de-diamants",
] as const;

export const TICKETS: readonly TicketDef[] = [
  {
    id: "tirelire", name: "La Tirelire de Piou", place: "kiosque", price: 1,
    temperament: "pepere", engine: "trio", options: { mode: "montants" },
  },
  {
    id: "signe-du-homard", name: "Signe du Homard", place: "kiosque", price: 2,
    temperament: "joueur", engine: "etoile", options: { cells: 6, signs: CONSTELLATIONS, family: "constellations" },
  },
  {
    id: "tic-tac-truffe", name: "Tic-Tac-Truffe", place: "kiosque", price: 5,
    temperament: "casse-cou", engine: "morpion", options: { target: "truffe", other: "gland" },
  },
  {
    id: "lucarne", name: "Lucarne", place: "cafe", price: 10,
    temperament: "pepere", engine: "duel",
    options: { rounds: 4, skin: "foot", opponents: ["les Goélands", "les Sardines", "les Bigorneaux", "les Mouettes"] },
  },
  {
    id: "reussite", name: "Réussite", place: "cafe", price: 20,
    temperament: "joueur", engine: "lignes", options: { skin: "cartes" },
  },
  {
    id: "bas-de-laine", name: "Bas de Laine", place: "cafe", price: 50,
    temperament: "casse-cou", engine: "numeros", options: { winning: 3, count: 8, cols: 4 },
  },
  {
    id: "vingt-et-un", name: "Le 21 d'Hector", place: "casino", price: 100,
    temperament: "pepere", engine: "duel", options: { rounds: 4, skin: "cartes" },
  },
  {
    id: "bandit-manchot", name: "Bandit Manchot", place: "casino", price: 500,
    temperament: "joueur", engine: "trio", options: { mode: "symboles", symbols: SYMBOLES_BANDIT, family: "bandit" },
  },
  {
    id: "mille-pattes", name: "Mille-Pattes", place: "casino", price: 2_000,
    temperament: "casse-cou", engine: "numeros", options: { winning: 4, count: 15, cols: 5 },
  },
  {
    id: "pie-voleuse", name: "La Pie Voleuse", place: "salon", price: 10_000,
    temperament: "pepere", engine: "trio", options: { mode: "symboles", symbols: SYMBOLES_PIE, family: "pie" },
  },
  {
    id: "caviar-champagne", name: "Caviar & Champagne", place: "salon", price: 50_000,
    temperament: "joueur", engine: "etoile", options: { cells: 6, signs: METS, family: "mets" },
  },
  {
    id: "grand-prix", name: "Grand Prix de la Corniche", place: "salon", price: 250_000,
    temperament: "casse-cou", engine: "duel", options: { rounds: 4, skin: "course" },
  },
  {
    id: "regate", name: "La Régate", place: "cercle", price: 1_000_000,
    temperament: "pepere", engine: "lignes", options: { skin: "nombres" },
  },
  {
    id: "moustache-dor", name: "Moustache d'Or", place: "cercle", price: 5_000_000,
    temperament: "joueur", engine: "morpion", options: { target: "moustache", other: "monocle" },
  },
  {
    id: "grand-grattouille", name: "Le Grand Grattouille", place: "cercle", price: 25_000_000,
    temperament: "casse-cou", engine: "multi", options: {},
  },
];

const BY_ID = new Map(TICKETS.map((t) => [t.id, t]));

export function ticketById(id: string): TicketDef | undefined {
  return BY_ID.get(id);
}

/** Les tickets d'un lieu, du moins cher au plus cher. */
export function ticketsOfPlace(place: PlaceId): TicketDef[] {
  return TICKETS.filter((t) => t.place === place).sort((a, b) => a.price - b.price);
}

/** Le ticket le moins cher d'un lieu. */
export function cheapestTicket(place: PlaceId): TicketDef {
  return ticketsOfPlace(place)[0]!;
}

export const BOOKLET_SIZES = [1, 5, 10] as const;
