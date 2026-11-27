// Le Poker Tricheur côté appareil (POKER.md, section 5) : le hall, la table qu'on
// regarde, ses relectures, et les gestes du joueur.
//
// Il n'y a pas de WebSocket. La table se relit à intervalle régulier, toujours avec la
// version de la dernière vue reçue : si rien n'a changé, le serveur le dit en quelques
// octets. C'est aussi cette relecture qui fait avancer la table : le serveur n'a pas de
// minuteur, il rattrape à chaque requête ce qui devait arriver (délais échus, robots).
//
// - Toutes les secondes pendant une main, toutes les 2,5 secondes quand on attend des
//   joueurs, et aussitôt qu'une échéance passe sur l'appareil.
// - Onglet caché : on ne relit plus. Au retour, une relecture rejoue ce qui s'est passé.
// - Un geste porte le `step` de la vue sur laquelle le joueur a décidé : arrivé trop tard,
//   il est refusé au lieu de s'appliquer au tour suivant.
// - La bourse ne bouge qu'en s'asseyant, en recavant et en partant : le serveur joint alors
//   l'état du joueur, que le magasin du jeu applique.

import { create } from "zustand";
import type {
  ActBody, CreateTableBody, PokerAction, PokerLobbyResponse, PokerPollResponse, PokerTableResponse, TableView,
} from "../../shared/poker/types";
import { playRefuse } from "../fx/audio";
import { t } from "../i18n";
import { ApiFailure, api } from "./api";
import { ackList, applyState, failureText, flushAck, recover, requireAuth, useGame } from "./store";

/** Pourquoi le joueur n'est plus assis, et ce qui est retourné à sa bourse. */
export type Left = NonNullable<PokerTableResponse["left"]>;

export interface PokerNotice {
  id: number;
  text: string;
}

interface PokerState {
  /** Le hall, tel que le serveur l'a rendu la dernière fois. */
  lobby: PokerLobbyResponse | null;
  lobbyBusy: boolean;
  /** Pourquoi le hall ne s'est pas chargé (une phrase, dans la langue du jeu). */
  lobbyError: string | null;

  /** La table qu'on regarde. */
  code: string | null;
  view: TableView | null;
  /** L'heure du serveur moins celle de l'appareil, à la réception de la vue : les échéances se calent dessus. */
  offset: number;
  /** Le joueur n'est plus assis à cette table. */
  left: Left | null;
  /** La table n'existe plus. */
  gone: boolean;
  /** Le geste en route vers le serveur. */
  busy: PokerAction["type"] | null;
  /** Les relectures n'aboutissent plus : pas de réseau, ou serveur muet. */
  stalled: boolean;
  /** Un mot de la table pour le joueur (un geste refusé) : affiché là où il regarde, trois secondes. */
  notice: PokerNotice | null;
  /** La vue vient d'un geste d'installation (créer, rejoindre, relever un défi) : la donne se joue sous ses yeux. */
  fresh: boolean;
  /**
   * La table vient de fermer sous les yeux du joueur, mais ce qu'elle lui rend n'est pas arrivé
   * avec elle (le versement à sa bourse a été remis à la requête suivante) : on la relit encore.
   */
  settling: boolean;
}

const EMPTY_TABLE = {
  code: null, view: null, offset: 0, left: null, gone: false, busy: null, stalled: false, notice: null, fresh: false,
  settling: false,
} satisfies Partial<PokerState>;

export const usePoker = create<PokerState>(() => ({ lobby: null, lobbyBusy: false, lobbyError: null, ...EMPTY_TABLE }));

const get = usePoker.getState;
const set = usePoker.setState;

// En bac à sable et en développement, la recette peut lire l'état de la table depuis la console du navigateur.
if (typeof window !== "undefined" && (import.meta.env.DEV || window.location.search.includes("bac-a-sable"))) {
  (window as unknown as { __poker: typeof usePoker }).__poker = usePoker;
}

/** Les rythmes de relecture, en millisecondes. */
const PACE_HAND = 1_000;
const PACE_WAIT = 2_500;
/** Après une échéance : le temps que la requête parte juste après elle, pas juste avant. */
const AFTER_DEADLINE = 60;

// ---------------------------------------------------------------------------
// Le hall

/** Relit le hall. Les tickets grattés sont déclarés d'abord : la bourse que le hall compte est celle qu'on voit. */
export async function loadLobby(): Promise<void> {
  if (get().lobbyBusy) return;
  set({ lobbyBusy: true, lobbyError: null });
  try {
    await flushAck();
    const lobby = await api.pokerLobby(requireAuth());
    // Cette route solde une séance restée en plan : l'état du joueur est à jour.
    applyState(lobby.state);
    set({ lobby, lobbyBusy: false });
  } catch (error) {
    set({ lobbyBusy: false, lobbyError: failureText(error) });
    await recover(error);
  }
}

// ---------------------------------------------------------------------------
// La vue d'une table

/** Range ce que le serveur vient de rendre pour cette table. */
function receive(code: string, res: PokerPollResponse, fresh = false): void {
  if ("unchanged" in res) return;
  if (res.state) applyState(res.state);
  const before = get();
  const same = before.code === code;
  const patch: Partial<PokerState> = same ? {} : { ...EMPTY_TABLE, code };
  if (res.view) {
    // Les réponses arrivent dans l'ordre (une requête à la fois) ; par prudence, une vue plus ancienne ne remplace rien.
    const older = same && before.view !== null && res.view.version < before.view.version;
    if (!older) {
      patch.view = res.view;
      patch.offset = res.view.now - Date.now();
      if (fresh) patch.fresh = true;
    }
  } else {
    patch.gone = true;
  }
  if (res.left) patch.left = res.left;
  // Assis à une table qui se joue : si elle ferme, elle doit dire ce qu'elle rend.
  if (res.view && res.view.you !== null && res.view.phase !== "fermee") seatedAt = code;
  set(patch);
  // Parti sans que la bourse suive : le tapis a été rendu par une autre requête (un autre
  // onglet, un autre joueur). Le hall dit où en sont la bourse et les défis relevés.
  if (res.left && !res.state && before.left === null) void loadLobby();
}

let watching: string | null = null;
let pollTimer = 0;
let deadlineTimer = 0;
let inFlight = false;
/** La table où le joueur était assis, à la dernière vue d'une partie en cours. */
let seatedAt: string | null = null;
/** Les relectures d'une table fermée dont le résultat se fait attendre : quelques-unes, pas plus. */
let settleTries = 0;
const SETTLE_TRIES = 6;
const PACE_SETTLE = 600;

function clearTimers(): void {
  window.clearTimeout(pollTimer);
  window.clearTimeout(deadlineTimer);
}

/** Prévoit la prochaine relecture : au rythme du temps en cours, et juste après l'échéance s'il y en a une. */
function planNext(): void {
  clearTimers();
  if (!watching) return;
  const s = get();
  // Parti : il n'y a plus rien à relire.
  if (s.gone || s.left) {
    if (s.settling) set({ settling: false });
    return;
  }
  if (s.view?.phase === "fermee") {
    // La table a fermé sous ses yeux, sans dire ce qu'elle lui rend : le versement à sa bourse a été
    // remis à la requête suivante (deux écritures en même temps). On la relit, quelques fois : c'est
    // cette relecture qui apporte le résultat. Au-delà, le hall soldera ce qui reste.
    if (seatedAt === watching && settleTries < SETTLE_TRIES) {
      settleTries += 1;
      if (!s.settling) set({ settling: true });
      pollTimer = window.setTimeout(() => void poll(), PACE_SETTLE);
    } else if (s.settling) {
      set({ settling: false });
      void loadLobby();
    }
    return;
  }
  const view = s.code === watching ? s.view : null;
  const pace = s.stalled || view?.phase === "attente" ? PACE_WAIT : PACE_HAND;
  pollTimer = window.setTimeout(() => void poll(), view ? pace : 400);
  if (view && view.deadline !== null) {
    const left = view.deadline - (Date.now() + s.offset);
    // C'est cette requête qui fait tomber le délai côté serveur.
    if (left > 0) deadlineTimer = window.setTimeout(() => void poll(), left + AFTER_DEADLINE);
  }
}

async function poll(): Promise<void> {
  const code = watching;
  if (!code || inFlight) return;
  // Onglet caché : on arrête de relire. Le retour à l'écran relance.
  if (document.visibilityState === "hidden") return;
  inFlight = true;
  try {
    const s = get();
    // Une table fermée dont on attend le résultat se relit en entier, pas « si elle a changé ».
    const version = s.code === code && s.view && !s.settling ? s.view.version : undefined;
    const res = await api.pokerTable(requireAuth(), code, version);
    if (watching !== code) return;
    if (get().stalled) set({ stalled: false });
    receive(code, res);
  } catch (error) {
    if (watching === code) await pollFailed(error);
  } finally {
    inFlight = false;
    if (watching === code) planNext();
  }
}

async function pollFailed(error: unknown): Promise<void> {
  if (!(error instanceof ApiFailure)) return;
  switch (error.code) {
    case "TABLE_NOT_FOUND":
      // La table a été effacée. Le hall solde ce qui restait à rendre, et dit où l'on en est.
      set({ gone: true });
      void loadLobby();
      break;
    case "UNAUTHORIZED":
      await recover(error);
      break;
    case "NETWORK":
    case "SERVER_ERROR":
    case "NO_SERVER":
      set({ stalled: true });
      break;
    default:
      // Deux écritures en même temps, par exemple : la relecture suivante y reviendra.
      break;
  }
}

/**
 * Regarde une table : la relit tant que l'écran est là. Rend la fonction qui arrête.
 * Une vue qui vient d'arriver par un geste d'installation n'est pas relue dans la foulée.
 */
export function watchTable(code: string): () => void {
  watching = code;
  settleTries = 0;
  if (get().code !== code) set({ ...EMPTY_TABLE, code });
  const wake = () => {
    if (document.visibilityState === "visible") void poll();
  };
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("online", wake);
  if (get().view && get().fresh) planNext();
  else void poll();
  return () => {
    if (watching === code) watching = null;
    clearTimers();
    document.removeEventListener("visibilitychange", wake);
    window.removeEventListener("online", wake);
    // Une table quittée ou fermée s'oublie : y revenir (avec le même code) repart d'une vue neuve.
    const s = get();
    if (s.code === code && (s.left !== null || s.gone)) set({ ...EMPTY_TABLE });
  };
}

/** La donne d'une table où l'on vient de s'asseoir se joue une fois : l'écran le demande en arrivant. */
export function takeFresh(): boolean {
  const fresh = get().fresh;
  if (fresh) set({ fresh: false });
  return fresh;
}

// ---------------------------------------------------------------------------
// S'asseoir

function adopt(res: PokerTableResponse): string {
  if (!res.view) throw new ApiFailure("TABLE_NOT_FOUND", 404);
  // On s'assoit : ce qu'on savait d'une visite précédente à cette table (un départ) ne vaut plus.
  set({ ...EMPTY_TABLE });
  receive(res.view.code, res, true);
  return res.view.code;
}

/**
 * Crée une table, ouvre une table de la maison ou lance un défi : le joueur s'y assoit.
 * Rend le code de la table. Lève l'échec tel quel : c'est la feuille qui le raconte.
 */
export async function sitDown(body: CreateTableBody): Promise<string> {
  return adopt(await api.pokerCreate(requireAuth(), { ...body, ack: ackList() }));
}

/** Un aperçu d'une table avant de la rejoindre : sa blinde, ses caves, qui est là. */
export async function previewTable(code: string): Promise<TableView> {
  const res = await api.pokerTable(requireAuth(), code);
  if ("unchanged" in res || !res.view || res.view.phase === "fermee") throw new ApiFailure("TABLE_NOT_FOUND", 404);
  return res.view;
}

export async function joinTable(code: string, buyIn: number): Promise<string> {
  return adopt(await api.pokerJoin(requireAuth(), { code, buyIn, ack: ackList() }));
}

/**
 * Après un échec en voulant s'asseoir : le compte se recale, et le hall aussi quand
 * c'est lui qui n'était plus à jour (déjà assis ailleurs, bourse trop courte, lieu fermé,
 * Table des Maîtres encore fermée).
 */
export async function afterSitFailure(error: unknown): Promise<void> {
  await recover(error);
  if (!(error instanceof ApiFailure)) return;
  const stale: readonly string[] = ["ALREADY_SEATED", "BUYIN_UNAFFORDABLE", "BLIND_TOO_HIGH", "PLACE_LOCKED", "MASTERS_LOCKED"];
  if (stale.includes(error.code)) void loadLobby();
}

// ---------------------------------------------------------------------------
// Les gestes

let noticeId = 0;
let noticeTimer = 0;

/** Un mot pour le joueur, à la table : un refus s'entend aussi (un double « non », tout doux). */
export function tableNotice(text: string): void {
  playRefuse();
  const id = ++noticeId;
  set({ notice: { id, text } });
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    if (get().notice?.id === id) set({ notice: null });
  }, 3_200);
}

const pause = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * Un geste à la table. Rend vrai s'il a été appliqué.
 * - Deux écritures en même temps (409) : le geste n'a pas été appliqué, on le renvoie une fois.
 * - Réseau coupé pendant un geste de jeu : le renvoyer avec le même `step` est sans danger.
 *   Une recave, elle, ne se renvoie jamais à l'aveugle : elle paierait deux fois.
 */
export async function play(action: PokerAction): Promise<boolean> {
  const s = get();
  if (!s.code || !s.view || s.busy !== null) return false;
  const code = s.code;
  const body: ActBody = { code, action };
  if (action.type === "recaver") body.ack = ackList();
  else if (action.type !== "quitter") body.step = s.view.step;
  set({ busy: action.type });
  try {
    let res: PokerTableResponse;
    try {
      res = await api.pokerAct(requireAuth(), body);
    } catch (error) {
      const again = error instanceof ApiFailure && action.type !== "recaver"
        && (error.code === "CONFLICT" || error.code === "NETWORK");
      if (!again) throw error;
      await pause(error.code === "CONFLICT" ? 300 : 700);
      res = await api.pokerAct(requireAuth(), body);
    }
    if (get().stalled) set({ stalled: false });
    receive(code, res);
    return true;
  } catch (error) {
    await actFailed(error);
    return false;
  } finally {
    set({ busy: null });
    if (watching === code) planNext();
  }
}

async function actFailed(error: unknown): Promise<void> {
  if (!(error instanceof ApiFailure)) {
    tableNotice(failureText(error));
    return;
  }
  switch (error.code) {
    case "UNAUTHORIZED":
      await recover(error);
      return;
    case "NOT_SEATED":
    case "TABLE_NOT_FOUND":
      // La relecture dira pourquoi le joueur n'est plus assis, ou que la table a fermé.
      break;
    case "NETWORK":
    case "SERVER_ERROR":
    case "NO_SERVER":
      set({ stalled: true });
      tableNotice(t("Le geste n'est pas parti : pas de réseau. Réessaie."));
      break;
    default:
      tableNotice(failureText(error));
  }
  // La table a tourné sans nous : on se recale tout de suite.
  void poll();
}

/**
 * Vrai quand la table ne joint plus le serveur : pas de réseau, ou relectures sans réponse.
 * Jamais en bac à sable, où le serveur tourne dans le navigateur.
 */
export function useTableOffline(): boolean {
  const stalled = usePoker((s) => s.stalled);
  const online = useGame((s) => s.online);
  const sandbox = useGame((s) => s.sandbox);
  return !sandbox && (stalled || !online);
}
