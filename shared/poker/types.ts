// Les types du Poker Tricheur partagés entre le serveur et le client (POKER.md).
//
// Trois familles :
//   1. l'état d'une table tel que le serveur le garde (`TableState`) : il contient des
//      secrets (les mains, qui a triché) et ne sort jamais tel quel ;
//   2. ce que voit un joueur (`TableView`), fabriqué par le serveur, siège par siège ;
//   3. le contrat de l'API : le corps de chaque requête et la forme de chaque réponse.
// Le client n'a besoin que des familles 2 et 3.

import type { PlaceId, PlayerState, PokerStats } from "../types";
import type { Card } from "./cards";
import type { HandCategory } from "./hands";

export type Difficulty = "facile" | "normal" | "difficile";

/**
 * Une table créée par un joueur, une table de la maison, un défi de la campagne, ou la
 * Table des Maîtres : le joueur contre quatre hôtes tirés au sort, en tournoi.
 */
export type TableKind = "privee" | "maison" | "defi" | "maitres";

/**
 * Les temps d'une table.
 * - `attente` : pas de main en cours (la partie n'est pas lancée, ou il manque des joueurs) ;
 * - `triche` : les cartes sont données, chacun choisit en secret de remplacer une carte ou non ;
 * - `encheres` : le tour d'enchères, un joueur après l'autre ;
 * - `abattage` : les mains sont montrées, chacun choisit en secret d'accuser ou non ;
 * - `denouement` : le résultat de la main est affiché, la suivante arrive ;
 * - `fermee` : la table est fermée, les tapis sont rendus.
 */
export type Phase = "attente" | "triche" | "encheres" | "abattage" | "denouement" | "fermee";

// ---------------------------------------------------------------------------
// Erreurs

/**
 * Les codes d'erreur propres au poker. Ils s'ajoutent à ceux de shared/types.ts
 * (BAD_REQUEST, UNAUTHORIZED, PLACE_LOCKED pour un lieu fermé, CONFLICT…).
 */
export type PokerErrorCode =
  | "TABLE_NOT_FOUND"     // 404 : code inconnu, ou table fermée
  | "TABLE_FULL"          // 409 : plus de siège libre
  | "ALREADY_SEATED"      // 409 : assis à une autre table
  | "NOT_SEATED"          // 409 : pas assis à cette table
  | "BUYIN_UNAFFORDABLE"  // 409 : la bourse ne suffit pas pour la cave
  | "NOT_YOUR_TURN"       // 409 : ce n'est pas à lui de parler
  | "ACTION_IMPOSSIBLE"   // 409 : geste interdit à ce moment, ou montant hors limites
  | "BLIND_TOO_HIGH"      // 409 : blinde au-dessus du quarantième de la bourse
  | "MASTERS_LOCKED";     // 403 : la Table des Maîtres n'ouvre qu'une fois les huit défis relevés

// ---------------------------------------------------------------------------
// Ce qui est public pendant une main

/**
 * Le journal d'une table : ses derniers événements publics, dans l'ordre. Le client
 * retient le dernier `n` qu'il a montré et anime ce qui est arrivé depuis.
 * - `arrivee`, `depart` : un joueur s'assoit, s'en va ;
 * - `cave` : de l'argent arrive sur un tapis (`amount`) : première cave, recave, robot qui recave ;
 * - `blinde` : un joueur paie la blinde (`amount`) ;
 * - `donne` : les cartes sont distribuées (`seat` vaut le siège du donneur) ;
 * - `choix` : un joueur a fait son choix pendant la triche (on ne sait pas lequel) ;
 * - `parole`, `mise`, `suit`, `relance`, `couche` : le tour d'enchères. `amount` : les jetons
 *   posés par ce geste ; `to` : sa mise totale dans le tour après ce geste ;
 * - `rendu` : une mise que personne n'a suivie retourne à son joueur (`amount`) ;
 * - `abattage` : les mains sont montrées ;
 * - `parle` : un joueur a parlé pendant l'abattage (accusé ou non : on ne sait pas) ;
 * - `pot` : un joueur ramasse (`amount`).
 */
export type LogKind =
  | "arrivee" | "depart" | "cave" | "blinde" | "donne" | "choix"
  | "parole" | "mise" | "suit" | "relance" | "couche" | "rendu" | "abattage" | "parle" | "pot";

export interface LogEntry {
  /** Numéro d'ordre, croissant sur toute la vie de la table. */
  n: number;
  /** Numéro de la main (0 avant la première). */
  hand: number;
  kind: LogKind;
  /** Le siège concerné, ou -1. */
  seat: number;
  /** Les jetons déplacés par ce geste, ou 0. */
  amount: number;
  /** Enchères : la mise totale du joueur dans le tour après ce geste. */
  to?: number;
  /** Le joueur est à tapis après ce geste. */
  allIn?: true;
  /** Le geste est tombé tout seul : délai dépassé, ou joueur absent. */
  auto?: true;
}

/** Une main montrée à l'abattage. */
export interface ShownHand {
  seat: number;
  /** Les cinq cartes telles que le joueur les montre (la carte trichée en fait partie). */
  cards: Card[];
  category: HandCategory;
}

/** Une accusation, révélée au dénouement. */
export interface Accusation {
  /** Le siège de l'accusateur. */
  from: number;
  /** Le siège de l'accusé. */
  to: number;
  /** Vrai : l'accusé avait triché, il est démasqué. Faux : il était innocent. */
  right: boolean;
  /** Ce que l'accusateur paie à l'innocent (0 si l'accusation était juste, ou s'il n'a plus rien). */
  paid: number;
}

/** Un tricheur démasqué : on montre la carte qu'il avait glissée dans sa main. */
export interface Unmasked {
  seat: number;
  /** La place de la fausse carte dans sa main (0 à 4). */
  index: number;
  /** La carte qu'il avait reçue. */
  from: Card;
  /** La carte qu'il a mise à la place. */
  to: Card;
}

/** Un pot (principal ou annexe) et ce qu'il devient. */
export interface PotResult {
  amount: number;
  /** Les gagnants et leur part. Vide si le pot reste sur la table. */
  winners: { seat: number; amount: number }[];
  /** Vrai : tous ceux qui y prétendaient sont démasqués, le pot reste pour la main suivante. */
  carried: boolean;
}

/** Le dénouement d'une main. Tout ce qu'il contient est public. */
export interface HandResult {
  /** Le numéro de la main. */
  no: number;
  /** Faux : il ne restait qu'un joueur, il a pris le pot sans montrer ses cartes. */
  showdown: boolean;
  hands: ShownHand[];
  accusations: Accusation[];
  unmasked: Unmasked[];
  pots: PotResult[];
  /** Le bilan de la main, siège par siège : ce qu'il a reçu moins ce qu'il a versé. */
  net: { seat: number; amount: number }[];
  /** Le pot resté sur la table pour la main suivante. */
  carry: number;
  /** Heure du serveur jusqu'à laquelle le dénouement reste affiché. */
  until: number;
}

/** Pourquoi un joueur n'est plus assis. */
export type LeaveReason =
  | "quitte"       // il est parti de lui-même
  | "absent"       // trois mains de suite absent
  | "a-sec"        // trois mains de suite sans pouvoir payer la blinde
  | "reserve"      // sa cave n'est jamais arrivée : le siège réservé a été libéré
  | "inactive"     // la table a fermé après 30 minutes sans activité
  | "banque"       // la table a fermé : trop d'argent sur le tapis pour compter juste
  | "defi-gagne"   // défi : l'hôte n'a plus rien
  | "defi-perdu"   // défi : le joueur n'a plus rien
  | "defi-nul"     // défi : plus personne n'a rien (tous deux démasqués, tout est resté au pot)
  | "maitres-gagne"  // Table des Maîtres : il est le dernier assis, tout l'argent de la table est à lui
  | "maitres-perdu"; // Table des Maîtres : son tapis est à zéro

/** Pourquoi une table est fermée. `vide` : plus aucun joueur humain. */
export type CloseReason = "vide" | "inactive" | "defi" | "banque" | "maitres";

export interface Departure {
  playerId: string;
  seat: number;
  reason: LeaveReason;
  /** Ce qui est retourné à sa bourse depuis la table (son tapis, sa part d'un pot resté là). */
  payout: number;
  at: number;
}

// ---------------------------------------------------------------------------
// L'état d'une table, côté serveur. Ne sort jamais tel quel.

/** Ce qui se voit d'un avatar autour de la table. */
export interface AvatarLook {
  chapeau: string | null;
  lunettes: string | null;
  tenue: string | null;
  accessoire: string | null;
}

export interface SeatState {
  /** Robot : l'identifiant de son personnage. Humain : `null`. */
  bot: string | null;
  /** Humain : son identifiant de joueur. Robot : chaîne vide. */
  playerId: string;
  /** Humain : l'identifiant de sa séance à cette table. Robot : chaîne vide. */
  sid: string;
  pseudo: string;
  species: string;
  look: AvatarLook | null;
  stack: number;
  /** Une recave arrivée pendant que le joueur était dans le coup : elle rejoint le tapis à la main suivante. */
  reserve: number;
  /** Le numéro du dernier dépôt de la bourse pris en compte (0 : la cave n'est pas encore posée). */
  seq: number;
  /** Tout ce que la table a reçu de la bourse du joueur pendant cette séance. */
  received: number;
  /** Heure d'arrivée. */
  since: number;
  /** Délais dépassés de suite. */
  missed: number;
  absent: boolean;
  /** Mains de suite sans jouer (absent, ou sans de quoi payer la blinde). */
  idle: number;
  /** Dénouement : il a demandé la main suivante. */
  ready: boolean;
  /**
   * Humain : les compteurs de sa séance à cette table (mains jouées jusqu'au dénouement,
   * pots ramassés, tricheurs démasqués, fois où il s'est fait prendre). Ils le suivent
   * jusqu'à son départ, où ils rejoignent ceux de son compte avec son tapis.
   * Absent tant qu'il n'a fini aucune main, d'un siège de robot, et d'une table enregistrée
   * avant ces compteurs : tout vaut alors zéro.
   */
  stats?: PokerStats;
}

/** Un joueur dans la main en cours. */
export interface HandPlayer {
  seat: number;
  cards: Card[];
  /** Secret : la carte remplacée, et où. `null` : franc jeu. */
  swap: { index: number; from: Card } | null;
  /** Triche : il a fait son choix. */
  chosen: boolean;
  /** Tout ce qu'il a versé au pot dans cette main, blinde comprise. */
  committed: number;
  /** Sa mise dans le tour d'enchères. */
  bet: number;
  folded: boolean;
  allIn: boolean;
  /** Abattage : il a parlé. */
  spoke: boolean;
  /** Secret jusqu'au dénouement : le siège qu'il accuse, ou `null`. */
  accuse: number | null;
  /** Robot ou absent : l'heure à laquelle sa décision tombe, dans le temps en cours. */
  actAt: number | null;
  /** Il a quitté la table pendant la main : son argent reste au pot, son siège est libre. */
  gone: boolean;
}

export interface HandState {
  /** Les joueurs servis, dans l'ordre de parole : le voisin du donneur d'abord. */
  players: HandPlayer[];
  /** La blinde de cette main. Celle de la table, sauf en tournoi (défi, Table des Maîtres), où elle monte au fil des mains. */
  blind: number;
  /** Tout l'argent au milieu : les mises de la main, plus le pot resté de la main précédente. */
  pot: number;
  /** La mise à égaler dans le tour d'enchères. */
  bet: number;
  raises: number;
  /** Le siège qui doit parler, pendant les enchères. */
  turn: number | null;
  /** Les sièges qui doivent encore parler, dans l'ordre. */
  pending: number[];
  /** L'échéance du temps en cours (triche, tour de parole, abattage). */
  deadline: number;
}

/** Un joueur parti, dont le tapis attend de retourner à sa bourse. */
export interface EndedSeat {
  sid: string;
  playerId: string;
  seat: number;
  /** Ce que la table lui doit. */
  payout: number;
  /** Ce que la table avait reçu de sa bourse : le reste de ce qu'il a sorti lui est rendu aussi. */
  received: number;
  reason: LeaveReason;
  at: number;
  /**
   * Les compteurs de sa séance, versés à son compte dans la même écriture que son tapis :
   * une fois, et une seule. Absent : rien à verser (aucune main finie, ou entrée d'avant
   * ces compteurs).
   */
  stats?: PokerStats;
}

export interface TableState {
  /** Version du schéma. */
  v: 1;
  code: string;
  kind: TableKind;
  /** Table de la maison ou défi : le lieu. */
  place: PlaceId | null;
  /** La blinde de la table. En tournoi (défi, Table des Maîtres) : la blinde de base, celle des premières mains. */
  blind: number;
  minBuyIn: number;
  maxBuyIn: number;
  difficulty: Difficulty;
  /**
   * Un par siège ; `null` : siège libre. À la Table des Maîtres, un hôte éliminé garde le
   * sien, avec un tapis à zéro : il ne reçoit plus de cartes.
   */
  seats: (SeatState | null)[];
  /** Le joueur qui peut lancer la partie. */
  owner: string | null;
  /** La partie est lancée : les mains s'enchaînent tant qu'il y a des joueurs. */
  started: boolean;
  phase: Phase;
  /** Augmente à chaque changement. */
  version: number;
  /** Augmente à chaque nouveau temps de jeu et à chaque nouveau tour de parole. */
  step: number;
  createdAt: number;
  /** L'heure du dernier événement traité : le temps d'une table ne recule jamais. */
  clock: number;
  /** La dernière action d'un joueur humain. */
  activeAt: number;
  /** Le siège du donneur (-1 avant la première main). */
  dealer: number;
  handNo: number;
  /** Le pot resté sur la table entre deux mains (tous les joueurs de l'abattage démasqués). */
  carry: number;
  hand: HandState | null;
  /** Le dénouement de la dernière main finie. */
  result: HandResult | null;
  /** Attente ou dénouement : l'heure de la prochaine main, si elle est prévue. */
  nextAt: number | null;
  /** Les tapis à rendre : chaque entrée attend que la bourse du joueur soit créditée. */
  ended: EndedSeat[];
  /** Les derniers départs (information seulement). */
  departed: Departure[];
  closed: CloseReason | null;
  log: LogEntry[];
  logNo: number;
  /**
   * Comptabilité de contrôle. À tout instant :
   * jetons sur la table (tapis, réserves, pot) = `in` − `out` + `bank`.
   * `in` : reçu des bourses ; `out` : rendu ou dû aux bourses ; `bank` : l'argent
   * fictif des robots, net (ce qu'ils ont apporté moins ce qui a disparu avec eux).
   * Sans robot, `bank` reste nul. Rien ne dépend de ces compteurs : ils servent aux
   * tests et au diagnostic.
   */
  audit: { in: number; out: number; bank: number };
}

// ---------------------------------------------------------------------------
// Ce que voit un joueur

export interface SeatView {
  seat: number;
  /** Humain : son pseudo. Robot : `null`. */
  pseudo: string | null;
  /** Robot : l'identifiant de son personnage (gaspard, ondine…). Humain : `null`. */
  bot: string | null;
  /** Humain : de quoi dessiner sa tête. */
  species: string | null;
  look: AvatarLook | null;
  stack: number;
  /** Recave en attente : elle rejoint le tapis à la main suivante. */
  reserve: number;
  /** Faux tant que sa cave n'est pas posée (siège réservé). */
  funded: boolean;
  absent: boolean;
  /** Il a des cartes dans la main en cours. */
  inHand: boolean;
  folded: boolean;
  allIn: boolean;
  /** Sa mise dans le tour d'enchères. */
  bet: number;
  /**
   * Tout ce qu'il a versé au pot dans cette main, blinde comprise. Dans un défi et à la
   * Table des Maîtres, un joueur qui n'a plus de quoi payer la blinde pose ce qui lui
   * reste : il est à tapis d'entrée.
   */
  committed: number;
  /**
   * Il a fait son choix dans le temps en cours : pendant la triche ou l'abattage, il a
   * choisi (jamais quoi) ; pendant le dénouement, il a demandé la main suivante.
   */
  done: boolean;
  /** Sa main, seulement quand elle est montrée (abattage). `null` sinon. */
  cards: Card[] | null;
  category: HandCategory | null;
  /**
   * Table des Maîtres : éliminé. Il n'a plus rien (`stack` vaut 0) et regarde la fin de la
   * partie ; son siège reste dessiné, mais il ne reçoit plus de cartes et la parole comme le
   * bouton le sautent. Le champ est ABSENT de tout autre siège, et de toute autre table.
   * Il apparaît au dénouement de la main où le joueur a tout perdu (pendant cette main, il
   * est encore `inHand` et `allIn`).
   */
  out?: true;
}

/** La main du joueur qui regarde. */
export interface OwnHand {
  /** Ses cinq cartes, la carte trichée à sa place. */
  cards: Card[];
  category: HandCategory;
  /** Ce qu'il a remplacé : la place (0 à 4) et la carte d'origine. `null` : franc jeu. */
  swap: { index: number; from: Card } | null;
  /** Il a fait son choix pendant la triche. */
  chosen: boolean;
  folded: boolean;
  /** Il a parlé pendant l'abattage. */
  spoke: boolean;
  /** Le siège qu'il accuse, ou `null`. */
  accuse: number | null;
}

/** Une fourchette de montants, bornes comprises. */
export interface Range {
  min: number;
  max: number;
}

/**
 * Ce que le joueur qui regarde peut faire maintenant. Chaque champ correspond à un
 * `type` d'action ; le serveur refuse tout le reste (ACTION_IMPOSSIBLE, NOT_YOUR_TURN).
 */
export interface Options {
  /** `lancer` : il a créé la table, la partie n'est pas lancée, et deux joueurs au moins peuvent jouer. */
  start: boolean;
  /** `tricher` ou `franc-jeu` : c'est le temps de la triche et il n'a pas encore choisi. */
  cheat: boolean;
  /** `parole` : c'est son tour et personne n'a misé. */
  check: boolean;
  /** `suivre` : ce qu'il doit ajouter pour suivre (0 : rien à suivre, ou pas son tour). */
  call: number;
  /** `miser` : fourchette de `amount`. `null` : pas possible. */
  bet: Range | null;
  /** `relancer` : fourchette de `amount`, sa mise totale dans le tour après la relance. */
  raise: Range | null;
  /** `tapis` : il peut pousser tout son tapis (la limite du pot le permet). */
  allIn: boolean;
  /** `coucher` : c'est son tour. */
  fold: boolean;
  /** `accuser` : les sièges qu'il peut accuser. Vide hors de l'abattage, ou s'il a déjà parlé. `rien` est permis dès que la liste n'est pas vide. */
  accuse: number[];
  /** `recaver` : fourchette de `amount`. `null` : pas possible maintenant (ou jamais, dans un défi et à la Table des Maîtres). */
  rebuy: Range | null;
  /** `retour` : il est marqué absent. */
  back: boolean;
  /**
   * `suite` : pendant le dénouement, demander la main suivante sans attendre la fin de
   * l'affichage. Elle part dès que tous les joueurs humains présents l'ont demandée.
   */
  next: boolean;
}

export interface TableView {
  code: string;
  kind: TableKind;
  place: PlaceId | null;
  /**
   * La blinde en vigueur : celle de la main en cours, ou de la prochaine entre deux mains.
   * À une table, elle ne change jamais. Dans un défi et à la Table des Maîtres, elle part
   * de la blinde de base et double de palier en palier (voir `rise`) ; c'est aussi la mise
   * et la relance minimales du tour d'enchères.
   */
  blind: number;
  /**
   * Défi et Table des Maîtres : la prochaine hausse de la blinde. `hand` : le numéro de la
   * main où elle monte (à comparer à `handNo`) ; `blind` : ce qu'elle vaudra. `null` à une
   * table ordinaire, ou quand elle a dépassé tout l'argent en jeu et ne montera plus.
   */
  rise: { hand: number; blind: number } | null;
  /**
   * Les caves. Dans un défi et à la Table des Maîtres, toutes deux valent 30 blindes de
   * base (la cave imposée), quelle que soit la blinde en vigueur.
   */
  minBuyIn: number;
  maxBuyIn: number;
  difficulty: Difficulty;
  /** À renvoyer dans `v` : si rien n'a changé, le serveur répond `{ unchanged: true }`. */
  version: number;
  /** À renvoyer avec une action de jeu : le serveur refuse une action qui arrive trop tard. */
  step: number;
  /** L'heure du serveur à la fabrication de la vue : sert à caler les échéances sur l'horloge de l'appareil. */
  now: number;
  phase: Phase;
  started: boolean;
  /** Un par siège de la table ; `null` : siège libre. */
  seats: (SeatView | null)[];
  /** Le siège de celui qui regarde. `null` : il n'est pas assis (aperçu avant de rejoindre). */
  you: number | null;
  /** Le siège de celui qui peut lancer la partie. */
  owner: number | null;
  /** Le siège du donneur, ou `null` avant la première main. */
  dealer: number | null;
  handNo: number;
  /** Tout l'argent au milieu, pot resté de la main précédente compris. */
  pot: number;
  /** Enchères : la mise à égaler. */
  bet: number;
  /** Enchères : le siège qui doit parler. */
  turn: number | null;
  /**
   * L'échéance, à l'heure du serveur : fin de la triche, fin du tour de parole d'un
   * humain, fin de l'abattage, fin de l'affichage du dénouement, reprise prévue après une
   * attente. `null` s'il n'y en a pas (attente sans reprise prévue, tour d'un robot).
   */
  deadline: number | null;
  /** Sa main. `null` s'il n'est pas dans la main en cours. */
  hand: OwnHand | null;
  options: Options;
  log: LogEntry[];
  /** Le dénouement de la dernière main finie (voir `result.no`). */
  result: HandResult | null;
  closed: CloseReason | null;
}

// ---------------------------------------------------------------------------
// Le contrat de l'API

/** Ce que GET /api/me dit du poker (`state.poker`) : la table où le joueur est assis. */
export type PokerSeatRef = NonNullable<PlayerState["poker"]>;

/**
 * Une action. `recaver` et `quitter` touchent la bourse ; les autres sont des gestes
 * de jeu.
 * - `miser.amount` : les jetons posés (personne n'a encore misé) ;
 * - `relancer.amount` : sa mise totale dans le tour après la relance, pas le supplément ;
 * - `tricher` : remplacer la carte à la place `index` (0 à 4) par `card` ;
 * - `accuser.seat` : le siège accusé ;
 * - `suite` : pendant le dénouement, passer à la main suivante sans attendre ;
 * - `retour` : revenir d'une absence.
 */
export type PokerAction =
  | { type: "lancer" }
  | { type: "tricher"; index: number; card: Card }
  | { type: "franc-jeu" }
  | { type: "parole" }
  | { type: "miser"; amount: number }
  | { type: "suivre" }
  | { type: "relancer"; amount: number }
  | { type: "coucher" }
  | { type: "tapis" }
  | { type: "accuser"; seat: number }
  | { type: "rien" }
  | { type: "suite" }
  | { type: "retour" }
  | { type: "recaver"; amount: number }
  | { type: "quitter" };

/** Les gestes que le moteur applique à une table (tout sauf la bourse). */
export type GameAction = Exclude<PokerAction, { type: "recaver" } | { type: "quitter" }>;

/** Une table de la maison, dans le hall. */
export interface LobbyHouse {
  place: PlaceId;
  /** Faux : le lieu est encore fermé au joueur (grisé). */
  open: boolean;
  host: string;
  blind: number;
  minBuyIn: number;
  maxBuyIn: number;
  difficulty: Difficulty;
  /** La bourse suffit pour la cave minimale. */
  affordable: boolean;
}

/** Un défi, dans le hall. */
export interface LobbyChallenge {
  place: PlaceId;
  open: boolean;
  host: string;
  /** La blinde de base du lieu : celle des quatre premières mains du duel. Elle double ensuite de palier en palier. */
  blind: number;
  /** La cave du défi : 30 blindes de base. */
  buyIn: number;
  /** La cagnotte de l'hôte : 100 blindes de base, versées la première fois qu'il est ruiné. */
  bonus: number;
  difficulty: Difficulty;
  /** Le défi a déjà été relevé : la cagnotte est versée. On peut le rejouer, sans cagnotte. */
  won: boolean;
  affordable: boolean;
}

/** La Table des Maîtres, dans le hall. */
export interface LobbyMasters {
  /** Les huit défis sont relevés : la table est ouverte. */
  open: boolean;
  /** Les défis relevés, de 0 à 8. */
  defis: number;
  /** La blinde de base : dix billions. Elle monte au fil des mains, comme dans un défi. */
  blind: number;
  /** La cave, la même pour les cinq joueurs : trente blindes de base. Pas de recave. */
  buyIn: number;
  /** Combien de fois le joueur l'a remportée. */
  won: number;
  affordable: boolean;
}

/** GET /api/poker → le hall. */
export interface PokerLobbyResponse {
  /** La table où le joueur est assis, s'il y en a une. */
  seat: { code: string; kind: TableKind; place: PlaceId | null } | null;
  /** Les blindes que sa bourse permet à la création d'une table (au plus son quarantième). */
  blinds: number[];
  houses: LobbyHouse[];
  challenges: LobbyChallenge[];
  /** La Table des Maîtres. Absente de la réponse d'un serveur plus ancien : l'écran lit `masters ?? null`. */
  masters: LobbyMasters;
  state: PlayerState;
}

/**
 * POST /api/poker/tables : créer une table, ouvrir une table de la maison, ou lancer un défi.
 * `ack` : comme partout, les tickets grattés à déclarer avant de compter la bourse.
 */
export type CreateTableBody =
  | {
    blind: number;
    /** La cave maximale de la table, entre 20 et 100 blindes. */
    maxBuyIn: number;
    /** Le nombre de sièges, de 2 à 6. */
    seats: number;
    /** Le nombre de robots, de 0 à sièges − 1. */
    bots: number;
    /** La difficulté des robots. `normal` si elle manque. */
    difficulty?: Difficulty;
    /** La cave du créateur. Si elle manque : la cave maximale, ou tout ce que sa bourse permet. */
    buyIn?: number;
    ack?: string[];
  }
  | { maison: PlaceId; buyIn?: number; ack?: string[] }
  | { defi: PlaceId; ack?: string[] }
  | { maitres: true; ack?: string[] };

/** POST /api/poker/join */
export interface JoinTableBody {
  code: string;
  /** La cave, entre la cave minimale et la cave maximale de la table. */
  buyIn: number;
  ack?: string[];
}

/** POST /api/poker/act */
export interface ActBody {
  code: string;
  action: PokerAction;
  /** Le `step` de la vue sur laquelle le joueur a décidé. Conseillé pour les gestes de jeu. */
  step?: number;
  ack?: string[];
}

/**
 * La réponse de toutes les routes qui touchent une table.
 * - `view` : ce que voit le joueur. `null` : la table n'existe plus ;
 * - `state` : présent quand la bourse du joueur a bougé pendant la requête ;
 * - `left` : présent quand le joueur n'est plus assis à cette table (il a quitté, il a
 *   été écarté, la table a fermé). `bonus` : la cagnotte d'un défi relevé pour la première fois.
 */
export interface PokerTableResponse {
  view: TableView | null;
  state?: PlayerState;
  left?: { reason: LeaveReason; payout: number; bonus: number };
}

/** GET /api/poker/table?code=…&v=… quand la version n'a pas changé. */
export interface PokerUnchangedResponse {
  unchanged: true;
}

export type PokerPollResponse = PokerTableResponse | PokerUnchangedResponse;
