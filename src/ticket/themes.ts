// Habillage des trente tickets (BRIEF.md, section 7.10, et les quinze suivants) : papier ivoire teinté de
// la couleur du ticket, bandeau, zone de jeu, et teinte de l'encre à gratter.

import { t } from "../i18n";
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

  // --- Les quinze tickets ajoutés après le brief.
  // Saute-Crabe : le sable, l'eau claire, le rouge du crabe.
  "saute-crabe": {
    ...BASE, papier: "#F7F0DC", bandeau: "#D9482F", bandeauTexte: "#FFFFFF",
    zone: "#BFE4E0", zoneTexte: "#0E2F3A", accent: "#D9482F", encre: "sable", forme: "rect",
  },
  // Grande Marée : le bleu du large et l'écume.
  "grande-maree": {
    ...BASE, papier: "#EEF6F8", bandeau: "#0F5E78", bandeauTexte: "#FFFFFF",
    zone: "#BFE3EA", zoneTexte: "#0E2F3A", accent: "#0F5E78", encre: "nacre-blanche", forme: "rect",
  },
  // La Grille du Jour : une page de journal, encre noire, un filet rouge.
  "grille-du-jour": {
    ...BASE, papier: "#F3EFE4", bandeau: "#1D2326", bandeauTexte: "#FFFFFF",
    zone: "#FBF8EF", zoneTexte: "#1D2326", caseFond: "#FFFFFF", accent: "#B8262F", encre: "plomb", forme: "rond",
  },
  // Le Rouge et le Noir : le tapis vert de la roulette.
  "rouge-et-noir": {
    ...BASE, papier: "#F4EFE6", bandeau: "#1D2326", bandeauTexte: "#F3D58A",
    zone: "#1F6F57", zoneTexte: "#FFF7E6", accent: "#B8262F", encre: "or", forme: "rond",
  },
  // La Bonne Aventure : la tente de la voyante, aubergine et or.
  "bonne-aventure": {
    ...BASE, papier: "#F3ECF5", bandeau: "#3A1B4D", bandeauTexte: "#F3D58A",
    zone: "#2B1638", zoneTexte: "#EAD9F2", accent: "#6B3F8A", encre: "nacre-lilas", forme: "rect",
  },
  // Le Pari de Sir Auguste : une vieille carte du monde.
  "pari-auguste": {
    ...BASE, papier: "#F3EFE2", bandeau: "#5A1730", bandeauTexte: "#F3D58A",
    zone: "#EADFC2", zoneTexte: "#3B2A1A", accent: "#7A1F35", encre: "bronze", forme: "rect",
  },
  // Cocktails du Commodore : le bar du pont supérieur, la nuit.
  cocktails: {
    ...BASE, papier: "#FDF1E7", bandeau: "#D9457A", bandeauTexte: "#FFFFFF",
    zone: "#17505C", zoneTexte: "#FFF7E6", accent: "#D9457A", encre: "nacre-rose", forme: "rect",
  },
  // Bâbord, Tribord : la mer de nuit et ses deux fanaux.
  "babord-tribord": {
    ...BASE, papier: "#EEF2F4", bandeau: "#12324F", bandeauTexte: "#FFFFFF",
    zone: "#0E2F3A", zoneTexte: "#E6F2F0", caseFond: "#14323F", caseTexte: "#E6F2F0",
    accent: "#C8323C", encre: "chrome", forme: "rond",
  },
  // Pêche au Gros : le grand bleu.
  "peche-au-gros": {
    ...BASE, papier: "#EAF4F7", bandeau: "#1F4E79", bandeauTexte: "#FFFFFF",
    zone: "#2C7DA0", zoneTexte: "#FFFFFF", accent: "#1F4E79", encre: "argent", forme: "rect",
  },
  // Sésame : l'acier de la chambre forte.
  sesame: {
    ...BASE, papier: "#F2EFE8", bandeau: "#33424B", bandeauTexte: "#F3D58A",
    zone: "#3B4A52", zoneTexte: "#FFF7E6", accent: "#8F6A1F", encre: "chrome", forme: "rond",
  },
  // Compte Numéroté : le vert des banques privées, les plaques de laiton.
  "compte-numerote": {
    ...BASE, papier: "#F1F4F1", bandeau: "#1F4A3B", bandeauTexte: "#F3D58A",
    zone: "#DCE6DD", zoneTexte: "#0E2F3A", accent: "#1F4A3B", encre: "or", forme: "rect",
  },
  // Intérêts Composés : le cuir vert du bureau et l'or.
  "interets-composes": {
    ...BASE, papier: "#F7F3E6", bandeau: "#14181A", bandeauTexte: "#F3D58A",
    zone: "#173F35", zoneTexte: "#F3E6BE", accent: "#8F6A1F", encre: "or", forme: "rect",
  },
  // Éclipse Totale : le violet de l'espace.
  "eclipse-totale": {
    ...BASE, papier: "#EFEAF6", bandeau: "#1B1440", bandeauTexte: "#F7C948",
    zone: "#0F0C29", zoneTexte: "#D9D0F2", caseFond: "#1E1A4A", caseTexte: "#EDE8FF",
    accent: "#5B4B8A", encre: "nacre-lilas", forme: "rond",
  },
  // L'Alignement des Planètes : bleu nuit.
  alignement: {
    ...BASE, papier: "#EEF1F8", bandeau: "#14213D", bandeauTexte: "#FFFFFF",
    zone: "#14213D", zoneTexte: "#E6ECFF", caseFond: "#1F2F57", caseTexte: "#E6ECFF",
    accent: "#3D5A9A", encre: "nacre-irisee", forme: "rect",
  },
  // Le Gratte-Ciel : la nuit au sommet, chrome et or.
  "gratte-ciel": {
    ...BASE, papier: "#0F1730", texte: "#E6ECFF", doux: "#9FB0D9", bandeau: "or", bandeauTexte: "#0F1730",
    zone: "#1A2547", zoneTexte: "#E6ECFF", accent: "#F2C94C", encre: "chrome", forme: "rect", ratio: "9:16",
  },
};

const FALLBACK = THEMES.tirelire!;

export function themeOf(ticketId: string): TicketTheme {
  return THEMES[ticketId] ?? FALLBACK;
}

/** Vrai pour une couleur sombre (« #14181A ») : ce qui s'imprime dessus doit être clair. */
export function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 < 110;
}

/**
 * Noms des signes et des symboles, pour les étiquettes et les lecteurs d'écran.
 * La table garde les noms français : à l'affichage, passer par `symbolName(clé)`,
 * ou par `t(SYMBOL_NAMES[clé])`.
 */
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
  "morpion:planete": "Planète", "morpion:asteroide": "Astéroïde",
  "arcane:soleil": "Le Soleil", "arcane:lune": "La Lune", "arcane:etoile": "L'Étoile", "arcane:roue": "La Roue",
  "arcane:couronne": "La Couronne", "arcane:phare": "Le Phare", "arcane:ancre": "L'Ancre", "arcane:sirene": "La Sirène",
  "peche:sardine": "Sardine", "peche:crevette": "Crevette", "peche:crabe": "Crabe", "peche:daurade": "Daurade",
  "peche:raie": "Raie", "peche:thon": "Thon", "peche:espadon": "Espadon", "peche:requin": "Requin",
  "peche:baleine": "Baleine", "peche:kraken": "Kraken",
  "cocktail:citron": "Citron", "cocktail:orange": "Orange", "cocktail:fraise": "Fraise", "cocktail:cerise": "Cerise",
  "cocktail:ananas": "Ananas", "cocktail:coco": "Noix de coco", "cocktail:menthe": "Menthe", "cocktail:olive": "Olive",
  "cocktail:glacon": "Glaçon", "cocktail:cafe": "Café", "cocktail:sirop": "Sirop", "cocktail:bulles": "Bulles",
  "cocktail:sucre": "Sucre", "cocktail:ombrelle": "Ombrelle",
  "roulette:rouge": "Rouge", "roulette:noir": "Noir", "fanal:babord": "Bâbord", "fanal:tribord": "Tribord",
  "astre:soleil": "Le Soleil", "astre:lune": "La Lune",
};

/** Le nom d'un symbole dans la langue du jeu. Se lit au rendu, jamais à l'import d'un module. */
export function symbolName(key: string, fallback?: string): string {
  const fr = SYMBOL_NAMES[key];
  return fr === undefined ? (fallback ?? key) : t(fr);
}

/** La famille de symboles d'un ticket : « constellations » donne la clé « constellation ». */
export function symbolKey(family: unknown, id: string): string {
  const f = family === "constellations" ? "constellation" : typeof family === "string" ? family : "bandit";
  return `${f}:${id}`;
}
