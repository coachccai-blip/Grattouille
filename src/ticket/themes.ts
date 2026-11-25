// Habillage des quinze tickets (BRIEF.md, section 7.10) : papier ivoire teinté de
// la couleur du ticket, bandeau, zone de jeu, et teinte de l'encre à gratter.

import type { CellShape, InkKind } from "../scratch/ink";

export interface TicketTheme {
  /** Papier : ivoire teinté de la couleur du ticket. */
  papier: string;
  /** Texte imprimé sur le papier, et sa version secondaire. */
  texte: string;
  doux: string;
  /** Bandeau du nom. `or` : un bandeau en feuille d'or. */
  bandeau: string;
  bandeauTexte: string;
  /** Zone de jeu : le décor du ticket. */
  zone: string;
  zoneTexte: string;
  /** Intérieur d'une case, sous l'encre. */
  caseFond: string;
  caseTexte: string;
  /** Couleur d'accent : filets, pastille de prix. */
  accent: string;
  encre: InkKind;
  /** Forme des cases principales. */
  forme: CellShape;
  /** Format du ticket : 5:8, ou 9:16 pour Le Grand Grattouille. */
  ratio: "5:8" | "9:16";
}

const BASE = {
  texte: "#0E2F3A",
  doux: "#4A6670",
  caseFond: "#FFF7E6",
  caseTexte: "#0E2F3A",
  ratio: "5:8",
} as const;

export const THEMES: Record<string, TicketTheme> = {
  tirelire: {
    ...BASE, papier: "#F2F6EF", bandeau: "#1F5F86", bandeauTexte: "#FFFFFF",
    zone: "#D7E9F2", zoneTexte: "#0E2F3A", accent: "#1F4E79", encre: "argent", forme: "rond",
  },
  "signe-du-homard": {
    ...BASE, papier: "#F2EEF7", bandeau: "#1B2A4E", bandeauTexte: "#E6F2F0",
    zone: "#1B2A4E", zoneTexte: "#E6F2F0", caseFond: "#243665", caseTexte: "#E6F2F0",
    accent: "#5B4B8A", encre: "nacre-lilas", forme: "etoile",
  },
  "tic-tac-truffe": {
    ...BASE, papier: "#F5E9D0", bandeau: "#5E3B25", bandeauTexte: "#FFF7E6",
    zone: "#E2CDA4", zoneTexte: "#0E2F3A", accent: "#3F7D3A", encre: "cuivre", forme: "rect",
  },
  lucarne: {
    ...BASE, papier: "#F1F7E6", bandeau: "#1F6F57", bandeauTexte: "#FFFFFF",
    zone: "#C9E3B4", zoneTexte: "#0E2F3A", accent: "#1F6F57", encre: "craie", forme: "rect",
  },
  reussite: {
    ...BASE, papier: "#F0F5E8", bandeau: "#7A1F35", bandeauTexte: "#FFF7E6",
    zone: "#BFD8B8", zoneTexte: "#0E2F3A", accent: "#7A1F35", encre: "argent", forme: "rect",
  },
  "bas-de-laine": {
    ...BASE, papier: "#FBEFDD", bandeau: "#A62A33", bandeauTexte: "#FFF7E6",
    zone: "#F2DBBE", zoneTexte: "#0E2F3A", accent: "#A62A33", encre: "or", forme: "rect",
  },
  "vingt-et-un": {
    ...BASE, papier: "#EBF4ED", bandeau: "#1D2326", bandeauTexte: "#F3D58A",
    zone: "#2B7459", zoneTexte: "#FFF7E6", accent: "#1F6F57", encre: "argent", forme: "rect",
  },
  "bandit-manchot": {
    ...BASE, papier: "#FBEBE7", bandeau: "#B8262F", bandeauTexte: "#FFFFFF",
    zone: "#DDE3EA", zoneTexte: "#0E2F3A", accent: "#B8262F", encre: "chrome", forme: "rect",
  },
  "mille-pattes": {
    ...BASE, papier: "#EFF6E3", bandeau: "#2F6A2C", bandeauTexte: "#FFFFFF",
    zone: "#D3E7BD", zoneTexte: "#0E2F3A", accent: "#2F6A2C", encre: "or", forme: "rect",
  },
  "pie-voleuse": {
    ...BASE, papier: "#F6F4F0", bandeau: "#1D2326", bandeauTexte: "#FFFFFF",
    zone: "#E4E0D8", zoneTexte: "#0E2F3A", accent: "#B02A5F", encre: "nacre-irisee", forme: "rond",
  },
  "caviar-champagne": {
    ...BASE, papier: "#F8F1DD", bandeau: "#1D2326", bandeauTexte: "#F3D58A",
    zone: "#1D2326", zoneTexte: "#F3E6BE", accent: "#8F6A1F", encre: "or-champagne", forme: "cloche",
  },
  "grand-prix": {
    ...BASE, papier: "#EBF2F9", bandeau: "#1F4E79", bandeauTexte: "#FFFFFF",
    zone: "#CFE0F0", zoneTexte: "#0E2F3A", accent: "#1F4E79", encre: "argent", forme: "rect",
  },
  regate: {
    ...BASE, papier: "#F4F7FA", bandeau: "#12324F", bandeauTexte: "#FFFFFF",
    zone: "#D9E6F1", zoneTexte: "#0E2F3A", accent: "#12324F", encre: "nacre-blanche", forme: "rect",
  },
  "moustache-dor": {
    ...BASE, papier: "#F9EEE7", bandeau: "#5A1730", bandeauTexte: "#F7C948",
    zone: "#5A1730", zoneTexte: "#F3D58A", accent: "#7A1F35", encre: "or", forme: "rect",
  },
  "grand-grattouille": {
    ...BASE, papier: "#14181A", texte: "#F3D58A", doux: "#C9B27A", bandeau: "or", bandeauTexte: "#14181A",
    zone: "#22282B", zoneTexte: "#F3D58A", accent: "#F2C94C", encre: "or", forme: "rect", ratio: "9:16",
  },
};

const FALLBACK = THEMES.tirelire!;

export function themeOf(ticketId: string): TicketTheme {
  return THEMES[ticketId] ?? FALLBACK;
}

/** Noms affichés des signes et des symboles, pour les étiquettes et les lecteurs d'écran. */
export const SYMBOL_NAMES: Record<string, string> = {
  "constellation:homard": "Homard", "constellation:chouette": "Chouette", "constellation:tortue": "Tortue",
  "constellation:paon": "Paon", "constellation:hippocampe": "Hippocampe", "constellation:cerf": "Cerf",
  "constellation:baleine": "Baleine", "constellation:papillon": "Papillon", "constellation:lievre": "Lièvre",
  "constellation:cygne": "Cygne", "constellation:abeille": "Abeille", "constellation:escargot": "Escargot",
  "mets:caviar": "Caviar", "mets:champagne": "Champagne", "mets:homard": "Homard", "mets:truffe": "Truffe",
  "mets:macaron": "Macaron", "mets:huitre": "Huître",
  "bandit:cloche": "Cloche", "bandit:cerise": "Cerise", "bandit:citron": "Citron", "bandit:trefle": "Trèfle",
  "bandit:fer-a-cheval": "Fer à cheval", "bandit:etoile": "Étoile", "bandit:sept": "Sept",
  "bandit:diamant": "Diamant", "bandit:couronne": "Couronne", "bandit:manchot": "Manchot",
  "pie:bouton": "Bouton de nacre", "pie:perle": "Perle", "pie:amethyste": "Améthyste", "pie:topaze": "Topaze",
  "pie:aigue-marine": "Aigue-marine", "pie:saphir": "Saphir", "pie:emeraude": "Émeraude", "pie:rubis": "Rubis",
  "pie:diamant": "Diamant", "pie:etoile-de-diamants": "Étoile de diamants",
  "morpion:truffe": "Truffe", "morpion:gland": "Gland", "morpion:moustache": "Moustache", "morpion:monocle": "Monocle",
};

/** La famille de symboles d'un ticket : « constellations » donne la clé « constellation ». */
export function symbolKey(family: unknown, id: string): string {
  const f = family === "constellations" ? "constellation" : typeof family === "string" ? family : "bandit";
  return `${f}:${id}`;
}
