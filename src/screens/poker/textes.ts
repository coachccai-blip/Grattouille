// Les mots du Poker Tricheur : le nom d'une combinaison, d'un siège, d'une table, d'une
// carte en deux signes. Tout se lit à l'affichage, dans la langue du jeu : les tables de
// ce fichier gardent leurs phrases françaises, qui sont les clés de traduction.

import "./anglais";
import { NBSP, formatEuros, formatInt } from "../../../shared/format";
import { cardRank, cardSuit, type Card } from "../../../shared/poker/cards";
import { placeById } from "../../../shared/places";
import type { HandCategory } from "../../../shared/poker/hands";
import type { Difficulty, LeaveReason, SeatView, TableView } from "../../../shared/poker/types";
import { hostName } from "../../app/dialogues";
import { capitalize } from "../../app/helpers";
import { pick, t } from "../../i18n";
import { placeShort } from "../../i18n/noms";
import type { Duel, DuelStage, TypedBet, Unit } from "./calcul";

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
export function mastersEnding(reason: MastersEnd, payout: number, friends = false): MastersEnding {
  // Entre amis, le tournoi a les mêmes fins ; mais la table ne rouvre pas, et aucun maître n'y sera tiré au sort.
  if (friends && reason === "maitres-perdu") {
    return {
      titre: t("Le tournoi s'arrête là pour toi"),
      texte: t("Ta cagnotte reste sur la table : le dernier assis remportera tout."),
      somme: null,
    };
  }
  if (friends && reason === "quitte") {
    return payout > 0
      ? { titre: t("Tu te lèves de table"), texte: t("Tu repars avec ton tapis, {montant}, sans la victoire.", { montant: formatEuros(payout) }), somme: null }
      : { titre: t("Tu abandonnes le tournoi"), texte: t("Ton tapis est resté sur la table : le dernier assis le remportera."), somme: null };
  }
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
// Le défi, en trois manches (LOT4.md, sections 12 et 15) : la mise double d'une manche à
// l'autre, et la troisième victoire ouvre l'histoire de l'hôte, dans les Souvenirs

/** « Manche 2 sur 3 » ; une fois les trois gagnées, « Revanche ». */
export function stageText(duel: Pick<Duel, "stage" | "rounds">): string {
  return duel.stage === "revanche" ? t("Revanche") : t("Manche {n} sur {total}", { n: duel.stage, total: duel.rounds });
}

/**
 * Dans le hall, sous la bulle d'un hôte : la manche à jouer ; en revanche, le rappel que son
 * histoire attend dans les Souvenirs.
 */
export function duelProgressText(duel: Pick<Duel, "stage" | "rounds">): string {
  return duel.stage === "revanche" ? t("Son histoire t'attend dans tes Souvenirs.") : stageText(duel);
}

/** L'enjeu, sans détour : « Chacun pose 200 €. Le gagnant repart avec 400 €. » */
export function duelStakesText(duel: Pick<Duel, "stake" | "prize">): string {
  return t("Chacun pose {mise}. Le gagnant repart avec {gain}.", { mise: formatEuros(duel.stake), gain: formatEuros(duel.prize) });
}

/** Sur la feuille du défi : ce qu'il y a au bout des trois manches. `host` : l'hôte du lieu. */
export function duelStoryText(duel: Pick<Duel, "stage">, host: string): string {
  const hote = nameInSentence(character(host));
  if (duel.stage === "revanche") return t("Son histoire est déjà dans tes Souvenirs : on rejoue pour l'honneur.");
  return duel.stage === 3
    ? t("Gagne cette manche, et {hote} te raconte son histoire.", { hote })
    : t("Gagne les trois manches, et {hote} te raconte son histoire.", { hote });
}

/** L'histoire d'un hôte vient de s'ouvrir : « Gaspard a une histoire à te raconter : elle t'attend dans tes Souvenirs. » */
export function storyOpenedText(host: string): string {
  return t("{hote} a une histoire à te raconter : elle t'attend dans tes Souvenirs.", { hote: hostName(host) });
}

/** Ce qui vient après une manche gagnée. `ouverte` : c'est l'histoire de l'hôte qui s'ouvre. */
export interface DuelNext {
  texte: string;
  ouverte: boolean;
}

/** Les mots du panneau de fin d'une manche. */
export interface DuelEnding {
  titre: string;
  /** Gagnée : la manche suivante et sa mise doublée, ou l'histoire qui s'ouvre ; rien après une revanche. */
  suite: DuelNext | null;
  /** Perdue : la mise qu'on y laisse, et l'invitation à retenter la même manche. */
  textes: string[];
}

/**
 * Une manche gagnée. `stage` : celle qui vient de se jouer ; `stake` : ce que chacun y posait
 * (la suivante en demande le double) ; `host` : l'hôte du lieu.
 */
export function duelWon(stage: DuelStage, stake: number, host: string): DuelEnding {
  if (stage === "revanche") return { titre: t("Revanche gagnée !"), suite: null, textes: [] };
  const titre = t("Manche {n} gagnée !", { n: stage });
  if (stage === 3) return { titre, suite: { texte: storyOpenedText(host), ouverte: true }, textes: [] };
  // Sans la mise de la table (une vue perdue en route), on annonce la manche, pas un montant inventé.
  const texte = stake > 0
    ? t("Manche {n} : la mise double, {montant}.", { n: stage + 1, montant: formatEuros(stake * 2) })
    : t("Manche {n} : la mise double.", { n: stage + 1 });
  return { titre, suite: { texte, ouverte: false }, textes: [] };
}

/** Une manche perdue : la mise y reste, et la même manche attend. */
export function duelLost(stage: DuelStage, stake: number): DuelEnding {
  const textes = stake > 0 ? [t("Tu y laisses ta mise : {montant}.", { montant: formatEuros(stake) })] : [];
  if (stage === "revanche") return { titre: t("Revanche perdue"), suite: null, textes: [...textes, t("Elle se retente quand tu veux.")] };
  return {
    titre: t("Manche {n} perdue", { n: stage }),
    suite: null,
    textes: [...textes, t("La manche {n} t'attend : retente-la quand tu veux.", { n: stage })],
  };
}

// ---------------------------------------------------------------------------
// La mise saisie à la main (LOT4.md, section 14)

// Les unités, comme `formatEuros` les écrit : « M€ », « Md€ », « Bn€ » ; en anglais « M », « B »
// (billion, le milliard), « T » (trillion, le billion français). Le millier n'a pas d'écriture
// dans les montants du jeu : c'est une touche, rien de plus.
const UNIT_LABELS: Record<"fr" | "en", Record<Unit, string>> = {
  fr: { 1: "€", 1000: "k€", 1000000: "M€", 1000000000: "Md€", 1000000000000: "Bn€" },
  en: { 1: "€", 1000: "K", 1000000: "M", 1000000000: "B", 1000000000000: "T" },
};

/** Ce qui s'écrit sur la touche d'une unité : « M€ », ou « M » en anglais. */
export function unitLabel(unit: Unit): string {
  return pick(UNIT_LABELS)[unit];
}

// Le nom d'une unité, dit par un lecteur d'écran : des clés de traduction.
const UNIT_NAMES: Record<Unit, string> = {
  1: "euros", 1000: "milliers d'euros", 1000000: "millions d'euros", 1000000000: "milliards d'euros",
  1000000000000: "billions d'euros",
};

export function unitName(unit: Unit): string {
  return t(UNIT_NAMES[unit]);
}

/**
 * Ce qui entoure le nombre dans le champ, pour qu'il se lise comme un montant du jeu :
 * « 150 M€ » en français (l'unité derrière), « €150M » en anglais (l'euro devant).
 */
export function fieldAround(unit: Unit): { avant: string; apres: string } {
  return pick({
    fr: { avant: "", apres: `${NBSP}${UNIT_LABELS.fr[unit]}` },
    en: { avant: "€", apres: unit === 1 ? "" : UNIT_LABELS.en[unit] },
  });
}

/** La virgule de la saisie, comme elle s'écrit dans la langue du jeu : « , », ou « . » en anglais. */
export function decimalMark(): string {
  return pick({ fr: ",", en: "." });
}

/**
 * La saisie telle qu'elle s'affiche dans le champ : ses milliers séparés, sa virgule dans la
 * langue du jeu. « 150000 » donne « 150 000 » ; « 1,5 » donne « 1.5 » en anglais.
 */
export function typedText(text: string): string {
  if (text === "") return "";
  const comma = text.indexOf(",");
  const whole = comma < 0 ? text : text.slice(0, comma);
  const shown = formatInt(Number(whole === "" ? "0" : whole));
  return comma < 0 ? shown : `${shown}${decimalMark()}${text.slice(comma + 1)}`;
}

/** Ce qui s'écrit sous le champ. `ramene` : c'est une explication, le montant a été ramené à une borne. */
export interface BoundsNote {
  texte: string;
  ramene: boolean;
}

/**
 * Sous le champ : la fourchette permise, ou le mot qui explique pourquoi le montant a été ramené
 * à une borne. `typed` : ce que le joueur a tapé, en euros. Un montant qui s'écrit comme la borne
 * (« 122,46 Bn€ » pour un minimum de 122 464 000 000 000 €) n'appelle aucune explication : il part
 * à la borne, et rien à l'écran ne le contredit.
 */
export function boundsText(
  bet: Pick<TypedBet, "amount" | "moved" | "allIn"> | null, range: { min: number; max: number }, typed: number | null = null,
): BoundsNote {
  const plain = { texte: t("Entre {min} et {max}", { min: formatEuros(range.min), max: formatEuros(range.max) }), ramene: false };
  if (!bet || bet.moved === null) return plain;
  if (typed !== null && formatEuros(typed) === formatEuros(bet.amount)) return plain;
  if (bet.moved === "min") return { texte: t("Moins que le minimum : ce sera {montant}.", { montant: formatEuros(bet.amount) }), ramene: true };
  return {
    texte: bet.allIn
      ? t("Plus que ton tapis : ce sera tout ton tapis.")
      : t("Plus que le maximum : ce sera {montant}.", { montant: formatEuros(bet.amount) }),
    ramene: true,
  };
}

/** Ce que la mise saisie engage, en une phrase : ce que le joueur pose, et ce qu'il lui restera. */
export function typedBetText(bet: TypedBet, first: boolean): string {
  if (bet.allIn) return t("Tu poses {montant} : c'est tout ton tapis.", { montant: formatEuros(bet.added) });
  const vars = { montant: formatEuros(bet.added), reste: formatEuros(bet.left) };
  // Une relance s'annonce par sa mise totale dans le tour : ce qu'on y ajoute est moindre quand on a déjà misé.
  return !first && bet.added !== bet.amount
    ? t("Tu ajoutes {montant} à ta mise : il te restera {reste}.", vars)
    : t("Tu poses {montant} : il te restera {reste}.", vars);
}

/** Ce qui s'écrit sur le bouton qui envoie la mise saisie : le geste, et son montant tel qu'il partira. */
export function typedBetLabel(bet: TypedBet | null, first: boolean, stack: number): string {
  if (!bet) return first ? t("Miser") : t("Relancer");
  if (bet.allIn) return t("Tapis : {montant}", { montant: formatEuros(stack) });
  return first ? t("Miser {montant}", { montant: formatEuros(bet.amount) }) : t("Relancer à {montant}", { montant: formatEuros(bet.amount) });
}

// ---------------------------------------------------------------------------
// Entre amis, deux façons de jouer (LOT4.md, section 16)

/** Le format d'une table entre amis : classique, ou aux règles de la Table des Maîtres. */
export type FriendsMode = "classique" | "tournoi";

// Le nom de chaque mode et sa règle en une phrase : des clés de traduction, lues à l'affichage.
const MODES: Record<FriendsMode, { nom: string; regle: string }> = {
  classique: {
    nom: "Table classique",
    regle: "Chacun choisit sa cave et peut recaver. On s'assoit et on part quand on veut, avec son tapis.",
  },
  tournoi: {
    nom: "Table des Maîtres",
    regle: "Chacun pose la même cagnotte, sans recave. La blinde monte, qui n'a plus rien est éliminé, et le dernier assis remporte tout.",
  },
};

export const FRIENDS_MODES: readonly FriendsMode[] = ["classique", "tournoi"];

/** « Table classique », « Table des Maîtres » : le nom d'un mode, sur son bouton. */
export function modeName(mode: FriendsMode): string {
  return t(MODES[mode].nom);
}

/** La règle d'un mode, en une phrase. */
export function modeRule(mode: FriendsMode): string {
  return t(MODES[mode].regle);
}

/** À un tournoi entre amis : combien de joueurs sont encore en jeu. Rien quand il n'en reste qu'un. */
export function playersLeftText(left: number): string {
  return left > 1 ? t("{n} joueurs en jeu", { n: left }) : "";
}

