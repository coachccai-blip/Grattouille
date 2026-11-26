// Les mots du Poker Tricheur : le nom d'une combinaison, d'un siège, d'une table, d'une
// carte en deux signes. Tout se lit à l'affichage, dans la langue du jeu : les tables de
// ce fichier gardent leurs phrases françaises, qui sont les clés de traduction.

import { cardRank, cardSuit, type Card } from "../../../shared/poker/cards";
import type { HandCategory } from "../../../shared/poker/hands";
import type { Difficulty, SeatView, TableView } from "../../../shared/poker/types";
import { hostName } from "../../app/dialogues";
import { capitalize } from "../../app/helpers";
import { pick, t } from "../../i18n";
import { placeShort } from "../../i18n/noms";

const CATEGORIES: Record<HandCategory, string> = {
  "carte-haute": "Carte haute",
  paire: "Paire",
  "deux-paires": "Deux paires",
  brelan: "Brelan",
  suite: "Suite",
  couleur: "Couleur",
  full: "Full",
  carre: "Carré",
  "quinte-flush": "Quinte flush",
};

/** « Brelan », « Three of a kind ». */
export function categoryName(category: HandCategory): string {
  return t(CATEGORIES[category]);
}

/** Les neuf combinaisons, de la plus forte à la plus faible, pour la fiche des règles. */
export function categoriesFromTop(): string[] {
  return (Object.keys(CATEGORIES) as HandCategory[]).reverse().map(categoryName);
}

const DIFFICULTIES: Record<Difficulty, string> = { facile: "facile", normal: "normal", difficile: "difficile" };

/** « facile », « easy » : le niveau des robots, en minuscules (il suit un autre mot). */
export function difficultyName(difficulty: Difficulty): string {
  return t(DIFFICULTIES[difficulty]);
}

/** Les figures s'écrivent V, D, R en français, et J, Q, K en anglais, comme sur les cartes. */
const FIGURES_FR: Record<string, string> = { J: "V", Q: "D", K: "R" };
const SIGNS: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };

/** Ce qui s'imprime dans le coin d'une carte : « 10 », « V », « A ». `rank` : « 2 » à « 9 », « T », « J », « Q », « K », « A ». */
export function rankLabel(rank: string): string {
  if (rank === "T") return "10";
  return pick<Record<string, string>>({ fr: FIGURES_FR, en: {} })[rank] ?? rank;
}

/** Une carte en deux signes, pour une phrase : « R♥ », « 10♠ ». */
export function cardShort(card: Card): string {
  return `${rankLabel(card[0]!)}${SIGNS[cardSuit(card)] ?? ""}`;
}

/** Vrai pour une carte rouge (cœur, carreau). */
export function isRed(card: Card): boolean {
  const suit = cardSuit(card);
  return suit === "h" || suit === "d";
}

/** Les cartes d'une main, de la plus haute à la plus basse : utile pour lire une main d'un coup d'œil. */
export function sortedHigh(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => cardRank(b) - cardRank(a));
}

/** Ce qu'on sait d'un joueur assis, gardé même après son départ : de quoi le nommer et dessiner sa tête. */
export interface Identity {
  bot: string | null;
  pseudo: string | null;
  species: string | null;
  look: SeatView["look"];
}

export function identityOf(seat: SeatView): Identity {
  return { bot: seat.bot, pseudo: seat.pseudo, species: seat.species, look: seat.look };
}

/** Le nom d'un joueur à table : un personnage, ou un pseudo. */
export function playerName(who: Identity | null | undefined): string {
  if (!who) return t("Un joueur parti");
  return who.bot ? hostName(who.bot) : who.pseudo ?? t("Un joueur parti");
}

/**
 * Le même nom au milieu d'une phrase : « le Baron », « the Commodore ». Seuls les noms
 * des personnages portent un article ; un pseudo ne change pas.
 */
export function nameInSentence(who: Identity | null | undefined): string {
  const name = playerName(who);
  if (!who?.bot) return name;
  return /^(Le|La|The) /.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}

/** Une liste de noms dans une phrase : « toi », « toi et Hector », « toi, Hector et Ondine ». */
export function nameList(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  const last = names[names.length - 1]!;
  return t("{debut} et {fin}", { debut: names.slice(0, -1).join(", "), fin: last });
}

/** Le titre d'une table : le lieu d'une table de la maison, l'hôte d'un défi, le code d'une table d'amis. */
export function tableTitle(view: Pick<TableView, "kind" | "place" | "code" | "seats">): string {
  if (view.kind === "maison" && view.place) return capitalize(placeShort(view.place));
  if (view.kind === "defi") {
    const host = view.seats.find((seat) => seat !== null && seat.bot !== null);
    return host?.bot ? t("Défi : {hote}", { hote: hostName(host.bot) }) : t("Le défi");
  }
  return t("Table {code}", { code: view.code });
}
