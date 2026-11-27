// Les mots du Poker Tricheur : le nom d'une combinaison, d'un siège, d'une table, d'une
// carte en deux signes. Tout se lit à l'affichage, dans la langue du jeu : les tables de
// ce fichier gardent leurs phrases françaises, qui sont les clés de traduction.

import { formatEuros } from "../../../shared/format";
import { cardRank, cardSuit, type Card } from "../../../shared/poker/cards";
import { placeById } from "../../../shared/places";
import type { HandCategory } from "../../../shared/poker/hands";
import type { Difficulty, LeaveReason, SeatView, TableView } from "../../../shared/poker/types";
import { hostName } from "../../app/dialogues";
import { capitalize } from "../../app/helpers";
import { pick, t } from "../../i18n";
import { placeShort } from "../../i18n/noms";
import type { HostStory } from "./calcul";

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

/** Un personnage du jeu, sans qu'il soit assis : de quoi le nommer et dessiner sa tête. */
export function character(bot: string): Identity {
  return { bot, pseudo: null, species: null, look: null };
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
export function tableTitle(view: Pick<TableView, "kind" | "place" | "code">): string {
  if (view.kind === "maitres") return t("Table des Maîtres");
  if (view.kind === "maison" && view.place) return capitalize(placeShort(view.place));
  // L'hôte se retrouve par son lieu : une table fermée n'a plus personne d'assis.
  if (view.kind === "defi") return view.place ? t("Défi : {hote}", { hote: hostName(placeById(view.place).host) }) : t("Le défi");
  return t("Table {code}", { code: view.code });
}

/**
 * L'état d'un siège, en un mot, quand il en a un : il s'écrit à la place de son tapis.
 * Éliminé de la Table des Maîtres, un siège ne dit plus rien d'autre.
 */
export function seatStateText(seat: SeatView, view: Pick<TableView, "started" | "hand" | "phase">): string | null {
  if (seat.out) return t("éliminé");
  if (!seat.funded) return t("arrive…");
  if (seat.absent) return t("absent");
  if (seat.folded) return t("couché");
  if (seat.allIn) return t("à tapis");
  if (view.started && view.hand !== null && !seat.inHand && (view.phase === "triche" || view.phase === "encheres")) return t("attend");
  return null;
}

// ---------------------------------------------------------------------------
// La Table des Maîtres

/** Combien de maîtres sont encore assis : « 3 maîtres assis », « Plus qu'un maître ». Vide quand il n'en reste aucun. */
export function mastersLeftText(left: number): string {
  if (left > 1) return t("{n} maîtres assis", { n: left });
  return left === 1 ? t("Plus qu'un maître") : "";
}

/** Les trois façons de sortir de la Table des Maîtres : elle est gagnée, elle est perdue, ou le joueur s'est levé. */
export type MastersEnd = Extract<LeaveReason, "maitres-gagne" | "maitres-perdu" | "quitte">;

export function isMastersEnd(reason: LeaveReason | null | undefined): reason is MastersEnd {
  return reason === "maitres-gagne" || reason === "maitres-perdu" || reason === "quitte";
}

/** Ce que dit le panneau de fin : un titre, une phrase, et ce qui s'écrit au-dessus de la somme quand il y en a une à fêter. */
export interface MastersEnding {
  titre: string;
  /**
   * La phrase sous le titre. Pour la victoire, c'est celle qui dit le montant d'une traite :
   * à l'écran il défile en grand, et cette phrase est lue à sa place par un lecteur d'écran.
   */
  texte: string;
  /** La victoire seulement : le mot posé au-dessus du montant remporté, qui défile. */
  somme: string | null;
}

/**
 * Les mots des trois fins. `payout` : ce qui retourne à la bourse (toute la table pour une
 * victoire, le tapis pour un départ, rien pour une défaite).
 */
export function mastersEnding(reason: MastersEnd, payout: number): MastersEnding {
  switch (reason) {
    case "maitres-gagne":
      return {
        titre: t("La table est à toi !"),
        texte: t("Tu remportes {montant}.", { montant: formatEuros(payout) }),
        somme: t("Tu remportes"),
      };
    case "maitres-perdu":
      return {
        titre: t("Les maîtres gardent la table"),
        texte: t("Tu y laisses ta cave, pas ta place : reviens quand tu veux, quatre maîtres seront tirés au sort."),
        somme: null,
      };
    case "quitte":
      return {
        titre: t("Tu te lèves de table"),
        texte: payout > 0
          ? t("Tu repars avec ton tapis, {montant}, sans la victoire. La table rouvre quand tu veux.", { montant: formatEuros(payout) })
          : t("Tu repars sans la victoire. La table rouvre quand tu veux."),
        somme: null,
      };
  }
}

// ---------------------------------------------------------------------------
// L'histoire de chaque hôte (LOT4.md, section 12) : trois victoires au poker l'ouvrent

/** Dans le hall, sous la bulle d'un hôte : où en est son histoire. */
export function storyProgressText(story: HostStory): string {
  if (story.open) return t("Son histoire t'attend dans tes Souvenirs.");
  const vars = { n: story.wins, total: story.needed };
  return story.wins > 1 ? t("Son histoire : {n} victoires sur {total}", vars) : t("Son histoire : {n} victoire sur {total}", vars);
}

/** Ce qu'il reste à faire pour l'histoire d'un hôte : « Encore 2 victoires et Gaspard te raconte son histoire. » */
export function storyLeftText(story: HostStory, host: string): string | null {
  if (story.open || story.left <= 0) return null;
  const hote = nameInSentence(character(host));
  return story.left === 1
    ? t("Encore une victoire et {hote} te raconte son histoire.", { hote })
    : t("Encore {n} victoires et {hote} te raconte son histoire.", { n: story.left, hote });
}

/**
 * Les histoires qui viennent de s'ouvrir, en une phrase : « Gaspard a une histoire à te
 * raconter : elle t'attend dans tes Souvenirs. » `hosts` : les hôtes concernés ; `null` s'il n'y
 * en a pas. Quatre d'un coup, ce sont les quatre maîtres d'une Table des Maîtres : on ne les
 * renomme pas un à un (ils saluent juste au-dessus).
 */
export function storiesOpenedText(hosts: readonly string[]): string | null {
  if (hosts.length === 0) return null;
  if (hosts.length >= 4) return t("Les quatre maîtres ont des histoires à te raconter : elles t'attendent dans tes Souvenirs.");
  // Le premier nom ouvre la phrase : « Le Baron et le Commodore ont… ».
  const names = hosts.map((host, i) => (i === 0 ? hostName(host) : nameInSentence(character(host))));
  if (names.length === 1) return t("{hote} a une histoire à te raconter : elle t'attend dans tes Souvenirs.", { hote: names[0]! });
  return t("{hotes} ont des histoires à te raconter : elles t'attendent dans tes Souvenirs.", { hotes: nameList(names) });
}

/** Ce qu'une victoire contre un hôte change à son histoire. `ouverte` : c'est elle qui vient de l'ouvrir. */
export interface StoryNews {
  texte: string;
  ouverte: boolean;
}

/**
 * Au panneau de fin d'un défi gagné. La troisième victoire annonce l'histoire ; les deux
 * premières disent ce qu'il reste ; au-delà de trois, plus rien. `story` : le compte d'après
 * la victoire (à zéro, l'état du joueur ne la porte pas encore : on ne dit rien).
 */
export function storyAfterWin(story: HostStory, host: string): StoryNews | null {
  if (story.wins <= 0) return null;
  if (story.justOpened) return { texte: storiesOpenedText([host])!, ouverte: true };
  const texte = storyLeftText(story, host);
  return texte === null ? null : { texte, ouverte: false };
}
