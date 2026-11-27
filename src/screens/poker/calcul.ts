// Les calculs des écrans du Poker Tricheur : rien ici ne touche à l'écran, au réseau ni
// à la langue. Qui s'assoit où autour du tapis, les mises proposées, les cartes qu'on
// peut glisser, ce que raconte un dénouement. Des fonctions pures, que les tests éprouvent.

import { RANK_CHARS, SUIT_CHARS, type Card } from "../../../shared/poker/cards";
import { evaluate, type HandCategory } from "../../../shared/poker/hands";
import {
  ACCUSE_MS, CHALLENGE_ROUNDS, CHEAT_MS, MASTERS_BLINDS, MAX_BUYIN_BLINDS, MIN_BUYIN_BLINDS, RESTART_MS, RESULT_MS,
  TABLE_CODE_LENGTH, TURN_MS, WALKOVER_MS,
} from "../../../shared/poker/rules";
import type {
  HandResult, LobbyChallenge, LobbyMasters, Options, PokerAction, Range, SeatView, TableView,
} from "../../../shared/poker/types";
import { CODE_ALPHABET, HOST_STORY_WINS } from "../../../shared/rules";
import type { PlaceId } from "../../../shared/types";

// ---------------------------------------------------------------------------
// Le temps

/** Ce qu'il reste avant une échéance du serveur, vu de l'appareil. `offset` : heure du serveur moins heure de l'appareil. */
export function remainingMs(deadline: number | null, offset: number, now: number): number {
  return deadline === null ? 0 : Math.max(0, deadline - (now + offset));
}

/** La durée entière du temps en cours : la barre de temps se mesure à elle. */
export function phaseTotal(view: Pick<TableView, "phase" | "result" | "handNo">): number {
  switch (view.phase) {
    case "triche": return CHEAT_MS;
    case "encheres": return TURN_MS;
    case "abattage": return ACCUSE_MS;
    case "denouement": return view.result && view.result.no === view.handNo && !view.result.showdown ? WALKOVER_MS : RESULT_MS;
    case "attente": return RESTART_MS;
    default: return 0;
  }
}

// ---------------------------------------------------------------------------
// Autour du tapis

export interface Neighbour {
  seat: number;
  /** `null` : le siège est libre. */
  who: SeatView | null;
}

/**
 * Les autres sièges, dans le sens de la table à partir du voisin du joueur : c'est
 * l'ordre de la parole. Qui regarde sans être assis voit tous les sièges, du premier au dernier.
 */
export function neighbours(view: Pick<TableView, "seats" | "you">): Neighbour[] {
  const n = view.seats.length;
  const out: Neighbour[] = [];
  if (view.you === null) {
    view.seats.forEach((who, seat) => out.push({ seat, who }));
    return out;
  }
  for (let k = 1; k < n; k++) {
    const seat = (view.you + k) % n;
    out.push({ seat, who: view.seats[seat] ?? null });
  }
  return out;
}

export type Side = "gauche" | "haut" | "droite";

/**
 * Où s'assoit chaque voisin : jusqu'à trois, ils tiennent en face ; au-delà, le premier
 * et le dernier prennent les côtés du tapis. La parole tourne ainsi comme autour d'une
 * vraie table : à gauche, en face, à droite.
 */
export function sidesFor(count: number): Side[] {
  if (count <= 3) return Array.from({ length: count }, () => "haut" as const);
  return ["gauche", ...Array.from({ length: count - 2 }, () => "haut" as const), "droite"];
}

// ---------------------------------------------------------------------------
// Les enchères

export interface BetChoice {
  /**
   * `min` : la plus petite mise permise ; `pot` : la hauteur du pot (ou, à la limite du pot, la plus
   * grosse permise) ; `milieu` : entre la plus petite et la plus grosse ; `tapis` : tout le tapis.
   */
  size: "min" | "milieu" | "pot" | "tapis";
  /**
   * Ce que la mise du joueur vaudra dans le tour (pour une relance, tapis compris : les trois
   * tailles se comparent), ou les jetons posés (pour une première mise).
   */
  amount: number;
  action: PokerAction;
}

/** Ce que l'écran sait de la table pour tailler ses mises. */
export interface BetTable {
  /** La mise de la hauteur du pot (`potSized`). Absente : on propose le milieu de la fourchette. */
  pot?: number;
}

/**
 * La mise « du pot » : pour une première mise, ce qu'il y a au milieu ; pour une relance (sa mise
 * totale dans le tour), la mise à égaler plus le pot une fois cette mise suivie.
 */
export function potSized(view: Pick<TableView, "pot" | "bet">, mine: number): number {
  if (view.bet <= 0) return view.pot;
  return view.bet + view.pot + Math.max(0, view.bet - mine);
}

/**
 * Les mises à proposer : trois au plus, toutes permises (les bornes de `options.bet` ou
 * `options.raise`, comprises). La plus petite ; entre les deux, la hauteur du pot quand elle tient
 * dans la fourchette, sinon son milieu ; la plus grosse, qui est un tapis quand elle engage tout.
 */
export function betChoices(o: Pick<Options, "bet" | "raise" | "allIn">, table: BetTable = {}): BetChoice[] {
  const first = o.bet !== null;
  const range: Range | null = o.bet ?? o.raise;
  if (!range || range.max < range.min) return [];
  const make = (amount: number): PokerAction => (first ? { type: "miser", amount } : { type: "relancer", amount });
  const out: BetChoice[] = [{ size: "min", amount: range.min, action: make(range.min) }];
  const inside = (amount: number) => amount > range.min && amount < range.max;
  const pot = table.pot === undefined ? null : Math.round(table.pot);
  const middle = Math.round((range.min + range.max) / 2);
  if (pot !== null && inside(pot)) out.push({ size: "pot", amount: pot, action: make(pot) });
  else if (inside(middle)) out.push({ size: "milieu", amount: middle, action: make(middle) });
  if (range.max > range.min) out.push({ size: "pot", amount: range.max, action: make(range.max) });
  // La plus grosse mise engage tout le tapis : c'est un tapis.
  if (o.allIn) out[out.length - 1] = { size: "tapis", amount: range.max, action: { type: "tapis" } };
  return out;
}

// ---------------------------------------------------------------------------
// La mise saisie à la main (LOT4.md, section 14)

/** Les unités de saisie : l'euro, le millier, le million, le milliard, le billion. */
export const UNITS = [1, 1_000, 1_000_000, 1_000_000_000, 1_000_000_000_000] as const;
export type Unit = (typeof UNITS)[number];

/** Avant la virgule, six chiffres au plus : « 999 999 », puis on change d'unité. */
export const MAX_DIGITS = 6;

/** La plus grosse unité qui tient dans un montant ; l'euro pour moins de mille euros. */
export function unitOf(amount: number): Unit {
  let unit: Unit = 1;
  for (const u of UNITS) if (amount >= u) unit = u;
  return unit;
}

/**
 * Les unités utiles pour une fourchette : de celle de sa plus petite mise à celle de sa plus
 * grosse. À la table du Kiosque, l'euro seul ; à la Table des Maîtres, le billion seul.
 */
export function unitsFor(range: Range): Unit[] {
  const low = unitOf(range.min);
  const high = unitOf(Math.max(range.min, range.max));
  return UNITS.filter((u) => u >= low && u <= high);
}

/** Les décimales qu'une unité laisse taper : aucune en euros (une mise est un nombre entier d'euros), deux au-delà. */
export function decimalsFor(unit: Unit): number {
  return unit === 1 ? 0 : 2;
}

/**
 * Ce que devient la saisie après une touche. La saisie s'écrit en chiffres, avec au plus une
 * virgule (« , », quelle que soit la langue : c'est l'affichage qui la traduit). `key` : un chiffre,
 * « , », ou « effacer ». Une touche qui ne mène à rien ne change rien.
 */
export function pressKey(text: string, key: string, unit: Unit): string {
  if (key === "effacer") return text.slice(0, -1);
  const comma = text.indexOf(",");
  if (key === ",") {
    if (decimalsFor(unit) === 0 || comma >= 0) return text;
    return text === "" ? "0," : `${text},`;
  }
  if (!/^[0-9]$/.test(key)) return text;
  if (comma >= 0) return text.length - comma - 1 < decimalsFor(unit) ? text + key : text;
  // Pas de zéro devant un nombre : « 0 » puis « 5 » donne « 5 ».
  if (text === "0") return key;
  return text.length < MAX_DIGITS ? text + key : text;
}

/** La saisie relue quand on change d'unité : en euros, plus de virgule ; ailleurs, elle ne bouge pas. */
export function fitUnit(text: string, unit: Unit): string {
  const comma = text.indexOf(",");
  if (comma < 0) return text;
  const kept = text.slice(0, comma + 1 + decimalsFor(unit));
  return decimalsFor(unit) === 0 ? text.slice(0, comma) : kept;
}

/** La saisie en euros entiers : « 1,5 » en millions donne 1 500 000. `null` : rien de tapé. */
export function typedAmount(text: string, unit: Unit): number | null {
  const m = /^(\d*)(?:,(\d*))?$/.exec(text);
  if (!m || (m[1] === "" && (m[2] ?? "") === "")) return null;
  const whole = m[1] === "" ? 0 : Number(m[1]);
  const digits = (m[2] ?? "").slice(0, decimalsFor(unit));
  // Des entiers d'un bout à l'autre : l'unité se divise par 10 ou 100 sans reste.
  const frac = digits === "" ? 0 : Number(digits) * (unit / 10 ** digits.length);
  return whole * unit + frac;
}

export interface BoundedBet {
  /** Le montant qui partira : entier, et dans la fourchette. */
  amount: number;
  /** La borne à laquelle il a fallu le ramener ; `null` s'il y tenait déjà. */
  moved: "min" | "max" | null;
}

/** Un montant ramené dans la fourchette que le serveur donne : jamais une mise qu'il refuserait. */
export function boundBet(amount: number, range: Range): BoundedBet {
  // Un nombre de travers ne part pas : c'est la plus petite mise qui le remplace.
  if (Number.isNaN(amount)) return { amount: range.min, moved: "min" };
  const whole = Math.round(amount);
  if (whole < range.min) return { amount: range.min, moved: "min" };
  if (whole > range.max) return { amount: range.max, moved: "max" };
  return { amount: whole, moved: null };
}

/** Ce qu'une mise saisie engage : le geste à envoyer, ce qui quitte le tapis, et ce qu'il en reste. */
export interface TypedBet extends BoundedBet {
  action: PokerAction;
  /** Elle engage tout le tapis : c'est un tapis. */
  allIn: boolean;
  /** Ce que le joueur pose maintenant (pour une relance : le supplément à ce qu'il a déjà misé dans le tour). */
  added: number;
  /** Ce qu'il lui restera devant lui. */
  left: number;
}

/**
 * La mise saisie, telle qu'elle partira. `amount` : ce que le joueur a tapé (les jetons d'une
 * première mise ; pour une relance, sa mise totale dans le tour). `mine` : ce qu'il a déjà misé
 * dans le tour ; `stack` : son tapis. `null` : il n'y a ni mise ni relance à faire.
 */
export function typedBet(amount: number, o: Pick<Options, "bet" | "raise" | "allIn">, mine: number, stack: number): TypedBet | null {
  const first = o.bet !== null;
  const range = o.bet ?? o.raise;
  if (!range || range.max < range.min) return null;
  const bounded = boundBet(amount, range);
  const allIn = o.allIn && bounded.amount >= range.max;
  const added = allIn ? stack : first ? bounded.amount : bounded.amount - mine;
  const action: PokerAction = allIn
    ? { type: "tapis" }
    : first ? { type: "miser", amount: bounded.amount } : { type: "relancer", amount: bounded.amount };
  return { ...bounded, action, allIn, added, left: Math.max(0, stack - added) };
}

// ---------------------------------------------------------------------------
// La triche

export const RANKS: readonly string[] = [...RANK_CHARS].reverse();
export const SUITS: readonly string[] = [...SUIT_CHARS];

/** Une valeur dont le joueur tient déjà les quatre couleurs, ou la carte exacte une fois la couleur choisie. */
export function rankTaken(hand: readonly Card[], rank: string, suit: string | null): boolean {
  if (suit !== null) return hand.includes(`${rank}${suit}`);
  return SUITS.every((s) => hand.includes(`${rank}${s}`));
}

/** Une couleur dont le joueur tient déjà les treize cartes (jamais, à cinq cartes), ou la carte exacte une fois la valeur choisie. */
export function suitTaken(hand: readonly Card[], suit: string, rank: string | null): boolean {
  if (rank !== null) return hand.includes(`${rank}${suit}`);
  return RANKS.every((r) => hand.includes(`${r}${suit}`));
}

/** La main une fois la carte glissée à cette place, et la combinaison qu'elle donne. */
export function swapped(hand: readonly Card[], index: number, card: Card): { cards: Card[]; category: HandCategory } {
  const cards = [...hand];
  cards[index] = card;
  return { cards, category: evaluate(cards).category };
}

// ---------------------------------------------------------------------------
// L'abattage

/** Les cartes montrées deux fois : l'une des deux, au moins, a été glissée. C'est un indice. */
export function doubles(hands: readonly (readonly Card[])[]): Set<Card> {
  const seen = new Set<Card>();
  const twice = new Set<Card>();
  for (const hand of hands) {
    for (const card of hand) {
      if (seen.has(card)) twice.add(card);
      else seen.add(card);
    }
  }
  return twice;
}

/** Ce qu'une accusation à tort coûterait : la mise de l'accusé, dans la limite de son propre tapis. */
export function accusationCost(target: Pick<SeatView, "committed">, mine: Pick<SeatView, "stack">): number {
  return Math.max(0, Math.min(target.committed, mine.stack));
}

// ---------------------------------------------------------------------------
// Le dénouement : ce qui s'est passé, dans l'ordre où on le raconte

export type OutcomeLine =
  /** Un tricheur démasqué : la fausse carte, celle qu'il avait reçue, et ceux qui l'ont vu. */
  | { kind: "demasque"; seat: number; fake: Card; real: Card; by: number[] }
  /** Une accusation à tort : l'accusateur paie l'innocent. */
  | { kind: "tort"; from: number; to: number; paid: number }
  /** Un pot ramassé par un seul joueur. `side` : un pot annexe. */
  | { kind: "pot"; seat: number; amount: number; side: boolean }
  /** Un pot partagé entre des mains égales. */
  | { kind: "partage"; seats: number[]; amount: number; side: boolean }
  /** Tous ceux qui y prétendaient sont démasqués : le pot reste sur la table. */
  | { kind: "reste"; amount: number }
  /** Tout le monde s'est couché : le dernier prend le pot sans montrer ses cartes. */
  | { kind: "seul"; seat: number; amount: number };

/** Le récit d'un dénouement : les accusations d'abord, puis les pots. */
export function outcomeLines(result: HandResult): OutcomeLine[] {
  const out: OutcomeLine[] = [];
  for (const u of result.unmasked) {
    const by = result.accusations.filter((a) => a.right && a.to === u.seat).map((a) => a.from);
    out.push({ kind: "demasque", seat: u.seat, fake: u.to, real: u.from, by });
  }
  for (const a of result.accusations) {
    if (!a.right) out.push({ kind: "tort", from: a.from, to: a.to, paid: a.paid });
  }
  result.pots.forEach((pot, index) => {
    if (pot.amount <= 0) return;
    const side = index > 0;
    if (!result.showdown && pot.winners.length === 1) {
      out.push({ kind: "seul", seat: pot.winners[0]!.seat, amount: pot.amount });
    } else if (pot.carried || pot.winners.length === 0) {
      out.push({ kind: "reste", amount: pot.amount });
    } else if (pot.winners.length === 1) {
      out.push({ kind: "pot", seat: pot.winners[0]!.seat, amount: pot.amount, side });
    } else {
      out.push({ kind: "partage", seats: pot.winners.map((w) => w.seat), amount: pot.amount, side });
    }
  });
  return out;
}

/** Un battement du dénouement, tel que l'écran le met en scène. */
export interface Beat {
  /** `accuse` : « Tricheur ! » ; `verdict` : démasqué ou innocent ; `pots` : le pot est ramassé. */
  kind: "accuse" | "verdict" | "pots";
  /** Le siège accusé (pour `accuse` et `verdict`) ; -1 pour les pots. */
  seat: number;
  /** Ce que dure le battement avant le suivant, en millisecondes. */
  ms: number;
}

/** Le temps laissé à toutes les accusations d'une main, quel que soit leur nombre. */
const ACCUSATIONS_MS = 4_500;

/**
 * Les battements d'un dénouement : les accusations, un accusé après l'autre, puis les
 * pots. Une accusation seule a droit à son moment (le cri, puis le verdict) ; à
 * plusieurs, les verdicts s'enchaînent, et le tout tient en quatre secondes et demie.
 */
export function beatsOf(result: HandResult): Beat[] {
  const targets = [...new Set(result.accusations.map((a) => a.to))];
  const beats: Beat[] = [];
  if (targets.length === 1) {
    beats.push({ kind: "accuse", seat: targets[0]!, ms: 1_300 }, { kind: "verdict", seat: targets[0]!, ms: 2_000 });
  } else {
    const each = targets.length > 0 ? Math.min(1_500, Math.round(ACCUSATIONS_MS / targets.length)) : 0;
    for (const seat of targets) beats.push({ kind: "verdict", seat, ms: each });
  }
  beats.push({ kind: "pots", seat: -1, ms: 0 });
  return beats;
}

/** À quel battement chaque ligne du récit se lit : avec le verdict de son accusé, ou avec les pots. */
export function lineBeats(lines: readonly OutcomeLine[], beats: readonly Beat[]): number[] {
  const verdictAt = (seat: number) => beats.findIndex((b) => b.kind === "verdict" && b.seat === seat);
  const pots = beats.findIndex((b) => b.kind === "pots");
  return lines.map((line) => {
    if (line.kind === "demasque") return Math.max(0, verdictAt(line.seat));
    if (line.kind === "tort") return Math.max(0, verdictAt(line.to));
    return pots;
  });
}

/** Le bilan de la main pour un siège : ce qu'il a reçu moins ce qu'il a versé. `null` s'il n'était pas servi. */
export function netOf(result: HandResult, seat: number | null): number | null {
  if (seat === null) return null;
  const entry = result.net.find((n) => n.seat === seat);
  return entry ? entry.amount : null;
}

/** Les sièges qui ramassent quelque chose : leur rangée se met en avant. */
export function winnersOf(result: HandResult): Set<number> {
  const out = new Set<number>();
  for (const pot of result.pots) for (const w of pot.winners) if (w.amount > 0) out.add(w.seat);
  return out;
}

// ---------------------------------------------------------------------------
// Les caves

/**
 * Les caves proposées : de dix blindes en dix blindes entre les bornes de la table,
 * bornes comprises, sans dépasser la bourse. Vide si la bourse ne couvre pas la cave minimale.
 */
export function buyInSteps(min: number, max: number, blind: number, balance: number): number[] {
  const top = Math.min(max, Math.floor(balance));
  if (top < min || blind <= 0) return [];
  const out = new Set<number>([min]);
  const step = blind * 10;
  for (let amount = Math.ceil(min / step) * step; amount <= top; amount += step) if (amount >= min) out.add(amount);
  // Tout ce que la bourse permet, quand elle s'arrête entre deux crans.
  out.add(top);
  return [...out].sort((a, b) => a - b);
}

/** La cave proposée d'abord : cinquante blindes, ou ce qui s'en approche le plus sans les dépasser. */
export function defaultBuyIn(steps: readonly number[], blind: number): number | null {
  if (steps.length === 0) return null;
  const wanted = blind * 50;
  let best = steps[0]!;
  for (const amount of steps) if (amount <= wanted) best = amount;
  return best;
}

/** Les caves maximales qu'un créateur peut choisir : 20, 40, 60, 80 ou 100 blindes. */
export function maxBuyInChoices(blind: number): number[] {
  const out: number[] = [];
  for (let n = MIN_BUYIN_BLINDS; n <= MAX_BUYIN_BLINDS; n += 20) out.push(n * blind);
  return out;
}

// ---------------------------------------------------------------------------
// La Table des Maîtres

/** Ce que le hall sait des défis et de la Table des Maîtres. Un serveur plus ancien ne rend pas `masters`. */
export interface MastersLobby {
  masters?: LobbyMasters | null;
  challenges: readonly Pick<LobbyChallenge, "won">[];
}

/** « Défis relevés : N sur 8 » : les défis relevés, et ceux qu'il y a à relever. */
export function challengesWon(lobby: MastersLobby): { won: number; total: number } {
  const total = lobby.challenges.length;
  const counted = lobby.challenges.filter((c) => c.won).length;
  // Le serveur le dit lui-même quand il connaît la Table des Maîtres ; sinon, on compte les défis relevés.
  const said = lobby.masters?.defis;
  const won = typeof said === "number" && Number.isFinite(said) ? Math.floor(said) : counted;
  return { won: Math.max(0, Math.min(total, won)), total };
}

/** La carte de la Table des Maîtres, dans le hall. */
export interface MastersCard {
  /** Les huit défis sont relevés : on peut s'y asseoir. Sinon elle se devine, fermée. */
  open: boolean;
  /** Les défis relevés, et ceux qu'il faut. */
  defis: number;
  total: number;
  /** La blinde de base et la cave, la même pour les cinq joueurs. */
  blind: number;
  buyIn: number;
  /** Combien de fois le joueur l'a remportée. */
  won: number;
  /** Ce qui manque à la bourse pour la cave ; 0 quand elle suffit. */
  short: number;
}

/**
 * La carte de la Table des Maîtres. `null` : le serveur ne la connaît pas (il est plus ancien
 * que cet écran), il n'y a rien à montrer. `balance` : la bourse telle que le joueur la voit,
 * tickets grattés compris ; c'est elle que le serveur comptera au moment de s'asseoir.
 */
export function mastersCard(lobby: MastersLobby, balance: number): MastersCard | null {
  const m = lobby.masters ?? null;
  if (!m) return null;
  const { won: defis, total } = challengesWon(lobby);
  const buyIn = Math.max(0, m.buyIn);
  return {
    open: m.open === true,
    defis,
    total,
    blind: Math.max(0, m.blind),
    buyIn,
    won: Number.isFinite(m.won) && m.won > 0 ? Math.floor(m.won) : 0,
    short: balance >= buyIn ? 0 : buyIn - Math.max(0, Math.floor(balance)),
  };
}

/**
 * Une table jouée en tournoi : la Table des Maîtres, ou une table entre amis créée à ses
 * règles (LOT4.md, section 16). Chacun y pose la même cagnotte, personne ne recave, la blinde
 * monte, qui n'a plus rien est éliminé, et le dernier assis remporte tout. Un serveur plus
 * ancien ne dit pas le format : seule la Table des Maîtres en est un.
 */
export function isTournament(view: Pick<TableView, "kind"> & { format?: string }): boolean {
  return view.kind === "maitres" || view.format === "tournoi";
}

/** La cagnotte que chacun pose à un tournoi entre amis : trente blindes de départ, ni plus ni moins. */
export function tournamentStake(blind: number): number {
  return Math.max(0, blind) * MASTERS_BLINDS;
}

/** Les joueurs encore en jeu à un tournoi (le joueur compris), et combien ils étaient au départ. */
export function playersLeft(view: Pick<TableView, "seats">): { left: number; of: number } {
  let left = 0;
  let of = 0;
  for (const seat of view.seats) {
    if (!seat) continue;
    of += 1;
    if (!seat.out) left += 1;
  }
  return { left, of };
}

/**
 * Ce que partir veut dire, à dire AVANT de partir. `libre` : une table classique, ou un tournoi
 * pas encore lancé : on s'en va avec son tapis. `seul` : un tournoi où aucun autre joueur humain
 * n'est là et en jeu (la Table des Maîtres ; ou des amis éliminés, partis ou absents) : il reprend
 * son tapis, sans la victoire. `abandon` : un tournoi entre amis où un autre humain joue encore :
 * son tapis reste sur la table, et le gagnant le prendra.
 *
 * C'est le critère du serveur (API-POKER.md, section 13) : la partie est lancée, et un autre
 * siège est tenu par un joueur humain, cave posée, pas absent, et encore en jeu (il a des jetons,
 * ou il est dans la main : à tapis, on n'a plus rien devant soi mais on joue encore). On ne
 * dispute rien à un absent.
 */
export function quitMeans(view: Pick<TableView, "kind" | "seats" | "you" | "handNo"> & { format?: string }): "libre" | "seul" | "abandon" {
  if (!isTournament(view) || view.handNo <= 0) return "libre";
  const others = view.seats.some((seat) => seat !== null && seat.seat !== view.you && seat.bot === null
    && seat.funded && !seat.absent && (seat.stack + seat.reserve > 0 || seat.inHand));
  return others ? "abandon" : "seul";
}

/**
 * Sur la feuille « rejoindre », une partie déjà lancée se dit une fois, et une seule. `closed` :
 * la table est un tournoi lancé ; `refusal` : le code du refus que le serveur vient d'opposer à
 * qui a voulu s'asseoir quand même. S'il vient de le dire lui-même (`TABLE_STARTED`), sa phrase
 * suffit ; sinon c'est la feuille qui l'explique, et un refus moins précis (la table « complète »
 * d'un serveur plus ancien) s'efface devant elle. `null` : la table n'est pas un tournoi lancé.
 */
export function startedSaidBy(closed: boolean, refusal: string | null): "serveur" | "feuille" | null {
  if (!closed) return null;
  return refusal === "TABLE_STARTED" ? "serveur" : "feuille";
}

/** Les maîtres encore assis à la Table des Maîtres, et combien ils étaient au départ. */
export function mastersLeft(view: Pick<TableView, "seats">): { left: number; of: number } {
  let left = 0;
  let of = 0;
  for (const seat of view.seats) {
    if (!seat || seat.bot === null) continue;
    of += 1;
    if (!seat.out) left += 1;
  }
  return { left, of };
}

/**
 * Les sièges que la main qui vient de finir a éliminés : ils y jouaient, et n'ont plus rien.
 * Vide hors du dénouement d'une main de la Table des Maîtres.
 */
export function fallenSeats(view: Pick<TableView, "kind" | "phase" | "seats" | "result" | "handNo">): number[] {
  const result = view.result;
  if (view.kind !== "maitres" || view.phase !== "denouement" || !result || result.no !== view.handNo) return [];
  const played = new Set(result.net.map((n) => n.seat));
  const out: number[] = [];
  for (const seat of view.seats) if (seat && seat.out && played.has(seat.seat)) out.push(seat.seat);
  return out;
}

/**
 * Un tournoi (un défi, la Table des Maîtres, une table entre amis à ses règles) est joué :
 * pendant le dénouement de sa dernière main, le joueur n'a plus rien, ou plus aucun adversaire
 * n'a de jetons. La main suivante n'aura pas lieu, et le résultat est acquis : partir à ce
 * moment-là ne le change pas. (Pendant une main, un joueur à tapis n'a plus rien devant lui
 * et joue encore : seul le dénouement compte.)
 */
export function tournamentDecided(view: Pick<TableView, "kind" | "phase" | "seats" | "you"> & { format?: string }): boolean {
  if (view.kind !== "defi" && !isTournament(view)) return false;
  if (view.phase !== "denouement") return false;
  const me = view.you === null ? null : view.seats[view.you] ?? null;
  if (!me) return false;
  if (me.stack + me.reserve <= 0) return true;
  const rivals = view.seats.filter((seat): seat is SeatView => seat !== null && seat.seat !== me.seat);
  return rivals.length > 0 && rivals.every((seat) => seat.stack <= 0);
}

// ---------------------------------------------------------------------------
// L'histoire de chaque hôte (LOT4.md, section 12)

/** Les victoires du joueur contre l'hôte de chaque lieu, telles que son état les porte. */
export type HostWins = Partial<Record<PlaceId, number>> | null | undefined;

/**
 * Où en est le joueur avec l'hôte d'un lieu. Le battre trois fois au poker (les trois manches
 * de son défi) ouvre son histoire, dans les Souvenirs.
 */
export interface HostStory {
  /** Ses victoires contre cet hôte. */
  wins: number;
  /** Celles qu'il faut. */
  needed: number;
  /** Celles qui manquent encore ; 0 une fois l'histoire ouverte. */
  left: number;
  open: boolean;
  /** Le compte y est tout juste : c'est la dernière victoire qui vient de l'ouvrir. */
  justOpened: boolean;
}

/** La même règle que `hostStoryOpen` (shared/rules.ts), sur un compte remis d'aplomb : un état de travers vaut zéro. */
export function hostStory(hostWins: HostWins, place: PlaceId): HostStory {
  const raw = hostWins?.[place];
  const wins = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  return {
    wins,
    needed: HOST_STORY_WINS,
    left: Math.max(0, HOST_STORY_WINS - wins),
    open: wins >= HOST_STORY_WINS,
    justOpened: wins === HOST_STORY_WINS,
  };
}

// ---------------------------------------------------------------------------
// Le défi, en trois manches (LOT4.md, section 15)

/** Les étapes d'un défi : ses trois manches, puis la revanche, une fois l'histoire de l'hôte ouverte. */
export type DuelStage = 1 | 2 | 3 | "revanche";

/** L'étape que joue un joueur qui a déjà battu cet hôte `wins` fois. */
export function stageOf(wins: number): DuelStage {
  const won = Number.isFinite(wins) && wins > 0 ? Math.floor(wins) : 0;
  return won >= CHALLENGE_ROUNDS ? "revanche" : ((won + 1) as 1 | 2 | 3);
}

/** Ce que le hall sait d'un défi. Un serveur d'avant les trois manches ne rend que la cave et la cagnotte. */
export type DuelLobby = Pick<LobbyChallenge, "place" | "buyIn"> & Partial<Pick<LobbyChallenge, "level" | "wins" | "stake" | "prize" | "rematch">>;

/** Où en est le défi d'un hôte : l'étape à jouer, ce que chacun pose, ce que le gagnant emporte. */
export interface Duel {
  /** L'étape à jouer : la manche (1, 2 ou 3), ou la revanche, aux conditions de la troisième. */
  stage: DuelStage;
  /** Les manches qu'il y a à gagner. */
  rounds: number;
  /** Les manches gagnées, de 0 à `rounds` : autant de repères pleins. */
  won: number;
  /** Ce que chacun pose. */
  stake: number;
  /** Ce que le gagnant emporte : les deux mises. */
  prize: number;
}

/**
 * Le défi d'un hôte, tel que le hall le rend. `hostWins` : les victoires du joueur, pour un
 * serveur qui ne dit pas encore la manche (elle s'en déduit : aucune victoire, manche 1…).
 */
export function duelOf(challenge: DuelLobby, hostWins: HostWins): Duel {
  const count = (n: unknown): number | null => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null);
  const wins = count(challenge.wins) ?? hostStory(hostWins, challenge.place).wins;
  const stake = count(challenge.stake) ?? Math.max(0, challenge.buyIn);
  return {
    stage: challenge.rematch === true ? "revanche" : stageOf(wins),
    rounds: CHALLENGE_ROUNDS,
    won: Math.min(CHALLENGE_ROUNDS, wins),
    stake,
    prize: count(challenge.prize) ?? stake * 2,
  };
}

/**
 * L'étape qu'une table de défi vient de jouer, vue du panneau de fin. `level` : la manche que
 * dit la table (3 aussi pour une revanche) ; `winsAfter` : les victoires contre l'hôte une fois
 * la table réglée ; `won` : le joueur l'a gagnée.
 */
export function playedStage(level: number | undefined, winsAfter: number, won: boolean): DuelStage {
  const after = Number.isFinite(winsAfter) && winsAfter > 0 ? Math.floor(winsAfter) : 0;
  const stage = stageOf(Math.max(0, won ? after - 1 : after));
  // La table dit sa manche : c'est elle qui fait foi pour les deux premières.
  if (level === 1 || level === 2) return level;
  if (level === 3) return stage === "revanche" ? "revanche" : 3;
  return stage;
}

/**
 * Dans un défi, au dénouement d'une main : l'hôte vient de prendre l'avantage (`avantage` : il a
 * désormais le plus gros tapis, ce qui n'était pas le cas avant la main), ou de le perdre
 * (`recul` : c'est le joueur qui passe devant). `null` : rien n'a basculé, ou ce n'est pas un défi.
 */
export function leadShift(view: Pick<TableView, "kind" | "phase" | "seats" | "you" | "result" | "handNo">): "avantage" | "recul" | null {
  const result = view.result;
  if (view.kind !== "defi" || view.phase !== "denouement" || !result || result.no !== view.handNo || view.you === null) return null;
  const me = view.seats[view.you] ?? null;
  const host = view.seats.find((seat): seat is SeatView => seat !== null && seat.bot !== null) ?? null;
  if (!me || !host) return null;
  const net = (seat: number) => result.net.find((n) => n.seat === seat)?.amount ?? 0;
  const now = Math.sign(host.stack - me.stack);
  const before = Math.sign(host.stack - net(host.seat) - (me.stack - net(me.seat)));
  if (now === before || now === 0) return null;
  return now > 0 ? "avantage" : "recul";
}

// ---------------------------------------------------------------------------
// Le code d'une table

/** Ce qu'on tape devient un code : capitales, sans espace ni tiret, cinq caractères au plus, ceux de l'alphabet des codes. */
export function cleanCode(raw: string): string {
  let out = "";
  for (const ch of raw.toUpperCase()) {
    if (CODE_ALPHABET.includes(ch)) out += ch;
    if (out.length >= TABLE_CODE_LENGTH) break;
  }
  return out;
}

export function isFullCode(code: string): boolean {
  return code.length === TABLE_CODE_LENGTH;
}

// ---------------------------------------------------------------------------
// Le journal : ce qui vient d'arriver à la table, pour l'animer

/** Les entrées du journal que l'écran n'a pas encore montrées. Après une longue pause, on ne rejoue que la fin. */
export function freshEntries<T extends { n: number }>(log: readonly T[], seen: number, max = 12): T[] {
  const fresh = log.filter((entry) => entry.n > seen);
  return fresh.length > max ? fresh.slice(fresh.length - max) : fresh;
}
