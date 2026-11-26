// Types partagés entre le client et la fonction (BRIEF.md, sections 7.1, 10 et 15.3).

export type PlaceId = "kiosque" | "cafe" | "casino" | "salon" | "cercle" | "yacht" | "banque" | "lune";
export type Temperament = "pepere" | "joueur" | "casse-cou";
export type EngineId =
  | "trio" | "numeros" | "morpion" | "duel" | "etoile" | "lignes" | "multi"
  | "parcours" | "coef" | "mots" | "camps";
export type Slot = "chapeau" | "lunettes" | "tenue" | "accessoire" | "vehicule" | "residence" | "tresor";
export type LookSlot = Exclude<Slot, "tresor">;
export type ShopId = "sidonie" | "enzo" | "colette" | "archibald";

export interface TicketDef {
  id: string; name: string; place: PlaceId; price: number;
  temperament: Temperament; engine: EngineId; options: Record<string, unknown>;
}

export interface ItemDef {
  id: string; name: string; shop: ShopId;
  slot: Slot; price: number; standing: number;
}

export interface PlaceDef {
  id: PlaceId;
  /** Nom complet : « Le Casino de la Jetée ». */
  name: string;
  /** Nom court en cours de phrase : « le Casino ». */
  short: string;
  /** Identifiant du personnage qui tient le lieu. */
  host: string;
  /** Standing requis pour entrer. */
  standing: number;
  moment: string;
  /** Dégradé du fond, de haut en bas. */
  sky: readonly string[];
  /** Couleur du texte posé sur le fond ; `bandeau` : sur un bandeau nuit (section 4.2). */
  text: "nuit" | "ecume" | "bandeau";
}

export interface PendingTicket {
  id: string;     // "t_" + 12 caractères aléatoires
  type: string;   // id du ticket, par exemple "lucarne"
  gain: number;   // euros, 0 si perdant
  seed: number;   // entier 32 bits non signé
  house?: true;   // trouvé par terre : toujours gagnant
  at: number;     // date d'achat en millisecondes
}

export type Look = Record<LookSlot, string | null>;

export interface PlayerStats {
  tickets: number; winners: number; wagered: number; won: number;
  bestGain: number; bestTicket: string | null; jackpots: number;
}

export interface PlayerState {      // ce que le client reçoit
  id: string; pseudo: string; species: string;
  balance: number;                  // dépensable tout de suite
  pending: PendingTicket[];         // achetés, pas encore déclarés grattés (20 au plus)
  owned: string[];                  // ids du catalogue
  look: Look;
  kiosk: boolean;
  standing: number;                 // recalculé par le serveur à chaque écriture
  fortune: number;                  // balance + gains en attente + prix des biens
  stats: PlayerStats;
  createdAt: number;
  /** Millisecondes avant le prochain coup de chance (un ticket par terre) ; 0 s'il traîne déjà. */
  luckyIn: number;
  /** La table de poker où le joueur est assis, pour y revenir. Absent s'il n'est assis nulle part. */
  poker?: { code: string };
}

export interface BoardEntry {
  id: string; pseudo: string; species: string;
  look: { chapeau: string | null; lunettes: string | null; tenue: string | null; accessoire: string | null };
  fortune: number; standing: number; kiosk: boolean;
  at: number; // date de la dernière publication
}

export interface Board {
  entries: BoardEntry[];
  updatedAt: number;
}

export type ErrorCode =
  | "BAD_REQUEST" | "PSEUDO_INVALID" | "UNAUTHORIZED" | "PLACE_LOCKED" | "KIOSK_LOCKED"
  | "NOT_FOUND" | "PSEUDO_TAKEN" | "INSUFFICIENT_FUNDS" | "PENDING_FULL" | "ALREADY_OWNED"
  | "HOUSE_NOT_ELIGIBLE" | "CONFLICT" | "TOO_FAST" | "DAILY_LIMIT";

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}

// Réponses de l'API (section 15.5).
export interface HealthResponse { ok: boolean; context: string }
export interface CreatePlayerResponse { playerId: string; code: string; state: PlayerState }
export interface SessionResponse { playerId: string; state: PlayerState }
export interface StateResponse { state: PlayerState }
export interface TicketsResponse { tickets: PendingTicket[]; state: PlayerState }
export interface OkResponse { ok: boolean }
export type LeaderboardResponse = Board;
