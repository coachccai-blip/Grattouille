// Le magasin d'état, unique (BRIEF.md, sections 15.4 et 15.9).
//
// - Le solde affiché vaut `state.balance` plus les gains des tickets grattés pas
//   encore déclarés au serveur.
// - Les tickets grattés sont déclarés dans le champ `ack` de la requête suivante,
//   quelle qu'elle soit ; à défaut en quittant l'écran de grattage, au passage en
//   arrière-plan, ou 3 secondes après le dernier grattage.
// - Affichage optimiste seulement là où un retour en arrière est simple : porter un
//   article, changer de résidence. Jamais pour un achat.

import { create } from "zustand";
import { KIOSK, itemById } from "../../shared/catalog";
import { formatEuros } from "../../shared/format";
import { PLACES, placeById } from "../../shared/places";
import { HOUSE_COOLDOWN_MS, MAX_PENDING, houseEligible, isPlaceOpen, newlyOpened, normalizeCode } from "../../shared/rules";
import { TICKETS, ticketById } from "../../shared/tickets";
import type { LookSlot, PendingTicket, PlaceId, PlayerState } from "../../shared/types";
import { resumeAudio, setSoundEnabled, suspendAudio } from "../fx/audio";
import { setHapticsEnabled } from "../fx/haptics";
import { ApiFailure, api, enableSandbox, wantsSandbox, type FailureCode } from "./api";
import { hostName } from "./dialogues";
import {
  DEFAULT_SETTINGS, clearAll, clearSession, loadAuth, loadRevealed, loadSettings, saveAuth, saveRevealed, saveSettings,
  type Auth, type Settings,
} from "./persist";

export interface Toast {
  id: number;
  kind: "info" | "erreur";
  text: string;
}

export type Phase = "amorce" | "bienvenue" | "jeu" | "panne";

interface GameState {
  phase: Phase;
  /** Pourquoi le jeu ne démarre pas : pas de réseau, panne, ou API non déployée. */
  panne: "reseau" | "serveur" | "absent" | null;
  sandbox: boolean;
  auth: Auth | null;
  player: PlayerState | null;
  /** Tickets grattés pas encore déclarés au serveur. */
  revealed: string[];
  settings: Settings;
  /** Préférence du système pour les animations réduites. */
  systemCalm: boolean;
  online: boolean;
  toast: Toast | null;
  /** Lieux qu'un achat vient d'ouvrir, à présenter en plein écran. */
  openings: PlaceId[];
  /** Le Kiosque vient d'être racheté : générique de fin. */
  ending: boolean;
  /** Piou accueille un nouveau compte. */
  welcome: boolean;
  /** Durée du prochain comptage du solde dans la bourse, en millisecondes. */
  countMs: number;
  /** Incrémenté à chaque achat refusé faute d'argent : la bourse clignote. */
  purseFlash: number;
  /** Date du dernier ticket offert reçu sur cet appareil. */
  lastHouseAt: number;
}

export const useGame = create<GameState>(() => ({
  phase: "amorce",
  panne: null,
  sandbox: false,
  auth: null,
  player: null,
  revealed: [],
  settings: DEFAULT_SETTINGS,
  systemCalm: false,
  online: true,
  toast: null,
  openings: [],
  ending: false,
  welcome: false,
  countMs: 800,
  purseFlash: 0,
  lastHouseAt: 0,
}));

const get = useGame.getState;
const set = useGame.setState;

// ---------------------------------------------------------------------------
// Lectures dérivées

/** Somme des gains des tickets grattés mais pas encore déclarés. */
function unackedGains(player: PlayerState | null, revealed: readonly string[]): number {
  if (!player || revealed.length === 0) return 0;
  let sum = 0;
  for (const t of player.pending) if (revealed.includes(t.id)) sum += t.gain;
  return sum;
}

/** Le solde à afficher et à comparer aux prix. */
export function displayBalance(s: Pick<GameState, "player" | "revealed">): number {
  return (s.player?.balance ?? 0) + unackedGains(s.player, s.revealed);
}

/** Les tickets en attente qui restent à gratter : la pile « À gratter ». */
export function toScratch(s: Pick<GameState, "player" | "revealed">): PendingTicket[] {
  return (s.player?.pending ?? []).filter((t) => !s.revealed.includes(t.id));
}

export function isCalm(s: Pick<GameState, "settings" | "systemCalm">): boolean {
  return s.settings.calme || s.systemCalm;
}

/** Vrai si la maison peut offrir un ticket, vu de l'appareil. */
export function canAskHouse(s: Pick<GameState, "player" | "revealed">): boolean {
  if (!s.player) return false;
  return houseEligible({
    balance: displayBalance(s),
    pendingCount: toScratch(s).length,
    standing: s.player.standing,
  });
}

// ---------------------------------------------------------------------------
// Messages

let toastId = 0;
let toastTimer = 0;

/** Message bref : bandeau au-dessus des onglets, 3 secondes. */
export function toast(text: string, kind: Toast["kind"] = "info"): void {
  window.clearTimeout(toastTimer);
  const id = ++toastId;
  set({ toast: { id, kind, text } });
  toastTimer = window.setTimeout(() => {
    if (get().toast?.id === id) set({ toast: null });
  }, 3000);
}

export function dismissToast(): void {
  window.clearTimeout(toastTimer);
  set({ toast: null });
}

const GENERIC: Partial<Record<FailureCode, string>> = {
  NETWORK: "Pas de réponse du kiosque. Vérifie ta connexion, puis réessaie.",
  SERVER_ERROR: "Le kiosque ne répond pas. Réessaie dans un instant.",
  NO_SERVER: "Le kiosque ne répond pas. Réessaie dans un instant.",
  CONFLICT: "Deux demandes en même temps. Réessaie dans un instant.",
  UNAUTHORIZED: "Ce compte n'est plus reconnu. Retrouve-le avec ton pseudo et ton code.",
};

/** Le texte à montrer pour un échec : jamais de code technique. */
export function failureText(error: unknown): string {
  if (error instanceof ApiFailure) {
    return GENERIC[error.code] ?? (error.message && error.message !== error.code ? error.message : GENERIC.SERVER_ERROR!);
  }
  return GENERIC.SERVER_ERROR!;
}

// ---------------------------------------------------------------------------
// État du serveur

/** Se cale sur l'état rendu par le serveur. Les tickets déclarés quittent la liste locale. */
function applyState(state: PlayerState): void {
  const pending = new Set(state.pending.map((t) => t.id));
  const revealed = get().revealed.filter((id) => pending.has(id));
  if (!get().sandbox) saveRevealed(revealed);
  set({ player: state, revealed });
}

/** Les tickets grattés à déclarer avec la prochaine requête. */
function ackList(): string[] {
  const { player, revealed } = get();
  if (!player) return [];
  const pending = new Set(player.pending.map((t) => t.id));
  return revealed.filter((id) => pending.has(id)).slice(0, 60);
}

function requireAuth(): Auth {
  const { auth } = get();
  if (!auth) throw new ApiFailure("UNAUTHORIZED", 401);
  return auth;
}

/** Le compte n'existe plus côté serveur : retour à l'écran de bienvenue. */
function dropSession(): void {
  if (!get().sandbox) clearSession();
  set({ auth: null, player: null, revealed: [], phase: "bienvenue", openings: [], ending: false, welcome: false });
}

/**
 * Après un échec : jamais de renvoi automatique d'un POST. Sur une erreur réseau,
 * on relit GET /api/me pour se caler sur l'état du serveur.
 */
async function recover(error: unknown): Promise<void> {
  if (!(error instanceof ApiFailure)) return;
  if (error.code === "UNAUTHORIZED") {
    dropSession();
    return;
  }
  if (error.code === "NETWORK" || error.code === "SERVER_ERROR" || error.code === "CONFLICT") {
    await refresh().catch(() => undefined);
  }
}

/** Relit l'état du joueur. */
export async function refresh(): Promise<void> {
  const { auth } = get();
  if (!auth) return;
  const { state } = await api.me(auth);
  applyState(state);
}

// ---------------------------------------------------------------------------
// Déclaration des tickets grattés

let ackTimer = 0;

/** Déclare maintenant les tickets grattés. Un échec n'est pas grave : ce sera refait. */
export async function flushAck(): Promise<void> {
  window.clearTimeout(ackTimer);
  const list = ackList();
  const { auth, online } = get();
  if (!auth || list.length === 0 || !online) return;
  try {
    const { state } = await api.ack(auth, list);
    applyState(state);
  } catch (error) {
    if (error instanceof ApiFailure && error.code === "UNAUTHORIZED") dropSession();
  }
}

/**
 * Le résultat d'un ticket vient de s'afficher : il rejoint `grattouille.revealed`.
 * `countMs` : la durée pendant laquelle la bourse compte jusqu'à sa nouvelle valeur.
 */
export function markRevealed(ticketId: string, countMs: number): void {
  const { revealed, sandbox } = get();
  if (revealed.includes(ticketId)) return;
  const next = [...revealed, ticketId];
  if (!sandbox) saveRevealed(next);
  set({ revealed: next, countMs });
  window.clearTimeout(ackTimer);
  ackTimer = window.setTimeout(() => void flushAck(), 3000);
}

// ---------------------------------------------------------------------------
// Démarrage

let booted = false;

export async function boot(): Promise<void> {
  const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const settings = loadSettings();
  setSoundEnabled(settings.son);
  setHapticsEnabled(settings.vibrations);
  set({ settings, online: navigator.onLine !== false, systemCalm: media?.matches ?? false });

  if (!booted) {
    booted = true;
    media?.addEventListener?.("change", (e) => set({ systemCalm: e.matches }));
    window.addEventListener("online", () => {
      set({ online: true });
      void flushAck();
    });
    window.addEventListener("offline", () => set({ online: false }));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        suspendAudio();
        // Passage en arrière-plan : la déclaration part sans attendre la réponse.
        const { auth } = get();
        const list = ackList();
        if (auth && list.length > 0) api.ackNow(auth, list);
      } else {
        resumeAudio();
        if (get().phase === "jeu") void refresh().catch(() => undefined);
      }
    });
  }

  if (wantsSandbox()) {
    await enableSandbox();
    set({ sandbox: true, phase: "bienvenue", panne: null });
    return;
  }

  const auth = loadAuth();
  if (!auth) {
    set({ phase: "bienvenue", panne: null });
    return;
  }
  set({ auth, revealed: loadRevealed(), phase: "amorce", panne: null });
  try {
    const { state } = await api.me(auth);
    applyState(state);
    set({ phase: "jeu" });
    // Les tickets de `pending` déjà présents dans `grattouille.revealed` sont déclarés.
    void flushAck();
  } catch (error) {
    if (error instanceof ApiFailure && (error.code === "UNAUTHORIZED" || error.code === "NOT_FOUND")) {
      dropSession();
      toast("Ce compte n'est plus reconnu. Retrouve-le avec ton pseudo et ton code.", "erreur");
      return;
    }
    const code = error instanceof ApiFailure ? error.code : "SERVER_ERROR";
    set({ phase: "panne", panne: code === "NETWORK" ? "reseau" : code === "NO_SERVER" ? "absent" : "serveur" });
  }
}

// ---------------------------------------------------------------------------
// Compte

function enter(auth: Auth, state: PlayerState, welcome: boolean): void {
  if (!get().sandbox) {
    saveAuth(auth);
    saveRevealed([]);
  }
  set({ auth, player: state, revealed: [], phase: "jeu", welcome, openings: [], ending: false });
}

export async function signup(pseudo: string, species: string): Promise<void> {
  const r = await api.createPlayer(pseudo, species);
  enter({ playerId: r.playerId, code: r.code }, r.state, true);
}

export async function login(pseudo: string, code: string): Promise<void> {
  const normalized = normalizeCode(code);
  if (!normalized) throw new ApiFailure("UNAUTHORIZED", 401, "Pseudo ou code incorrect.");
  const r = await api.openSession(pseudo, normalized);
  enter({ playerId: r.playerId, code: normalized }, r.state, false);
  patchSettings({ codeNote: true });
}

export async function deleteAccount(): Promise<void> {
  const auth = requireAuth();
  await api.deleteMe(auth);
  // L'appareil vide son stockage.
  if (!get().sandbox) clearAll();
  const settings = { ...DEFAULT_SETTINGS };
  setSoundEnabled(settings.son);
  setHapticsEnabled(settings.vibrations);
  set({ auth: null, player: null, revealed: [], phase: "bienvenue", settings, openings: [], ending: false, welcome: false });
  toast("Ton compte est supprimé. Il ne reste rien sur cet appareil.");
}

export function patchSettings(change: Partial<Settings>): void {
  const settings = { ...get().settings, ...change };
  saveSettings(settings);
  setSoundEnabled(settings.son);
  setHapticsEnabled(settings.vibrations);
  set({ settings });
}

export function rememberSign(ticketId: string, sign: string): void {
  const { settings } = get();
  if (settings.signes[ticketId] === sign) return;
  patchSettings({ signes: { ...settings.signes, [ticketId]: sign } });
}

export function closeWelcome(): void {
  set({ welcome: false });
}

export function closeOpening(): void {
  set({ openings: get().openings.slice(1) });
}

export function closeEnding(): void {
  set({ ending: false });
}

// ---------------------------------------------------------------------------
// Tickets

/** Pourquoi un achat de ticket est impossible, vu de l'appareil. `null` : rien ne s'y oppose. */
export function ticketBlocker(type: string, qty: number): string | null {
  const s = get();
  const def = ticketById(type);
  if (!s.player || !def) return null;
  if (!s.online) return "Hors connexion. Tu peux gratter tes tickets en attente, pas en acheter.";
  const place = placeById(def.place);
  if (!isPlaceOpen(def.place, s.player.standing)) {
    const missing = place.standing - s.player.standing;
    return `${capitalize(place.short)} ouvre à ★ ${place.standing}. Il te manque ${missing} ★ : passe chez Sidonie.`;
  }
  if (toScratch(s).length + qty > MAX_PENDING) return "Gratte d'abord tes tickets en attente.";
  const balance = displayBalance(s);
  const cost = def.price * qty;
  if (balance < cost) {
    const missing = formatEuros(cost - balance);
    // Le ticket le plus cher encore à portée, parmi les lieux ouverts.
    const within = TICKETS.filter((t) => t.price <= balance && isPlaceOpen(t.place, s.player!.standing))
      .sort((a, b) => b.price - a.price)[0];
    if (qty > 1 && balance >= def.price) return `Il te manque ${missing} pour ce carnet. À l'unité, ça passe.`;
    if (within) return `Il te manque ${missing}. ${within.name} est à ${formatEuros(within.price)}.`;
    return `Il te manque ${missing}.`;
  }
  return null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** La bourse clignote : un achat vient d'être refusé faute d'argent. */
export function flashPurse(): void {
  set({ purseFlash: get().purseFlash + 1 });
}

/**
 * Achète des tickets. Rend les tickets vendus, ou `null` si l'achat n'a pas eu
 * lieu (le message est déjà affiché).
 */
export async function buyTickets(type: string, qty: number): Promise<PendingTicket[] | null> {
  const blocker = ticketBlocker(type, qty);
  if (blocker) {
    if (blocker.startsWith("Il te manque")) flashPurse();
    toast(blocker, "erreur");
    return null;
  }
  const def = ticketById(type)!;
  try {
    const r = await api.buyTickets(requireAuth(), type, qty, ackList());
    applyState(r.state);
    return r.tickets;
  } catch (error) {
    await recover(error);
    if (error instanceof ApiFailure) {
      switch (error.code) {
        case "NETWORK":
          toast("Connexion coupée pendant l'achat. Si le ticket a été vendu, il t'attend dans À gratter.", "erreur");
          break;
        case "TOO_FAST":
          toast(`${hostName(placeById(def.place).host)} n'a que deux pattes. Réessaie dans un instant.`, "erreur");
          break;
        case "INSUFFICIENT_FUNDS":
          flashPurse();
          toast(ticketBlocker(type, qty) ?? failureText(error), "erreur");
          break;
        case "PLACE_LOCKED":
        case "PENDING_FULL":
          toast(ticketBlocker(type, qty) ?? failureText(error), "erreur");
          break;
        default:
          toast(failureText(error), "erreur");
      }
    } else {
      toast(failureText(error), "erreur");
    }
    return null;
  }
}

/** Demande le ticket offert par la maison. */
export async function askHouseTicket(): Promise<PendingTicket | null> {
  const s = get();
  if (!s.online) {
    toast("Hors connexion. Tu peux gratter tes tickets en attente, pas en acheter.", "erreur");
    return null;
  }
  if (Date.now() - s.lastHouseAt < HOUSE_COOLDOWN_MS) {
    toast("La maison prépare ton ticket. Réessaie dans un instant.");
    return null;
  }
  try {
    const r = await api.houseTicket(requireAuth(), ackList());
    applyState(r.state);
    set({ lastHouseAt: Date.now() });
    return r.tickets[0] ?? null;
  } catch (error) {
    await recover(error);
    if (error instanceof ApiFailure && error.code === "HOUSE_NOT_ELIGIBLE") {
      toast(canAskHouse(get()) ? "La maison prépare ton ticket. Réessaie dans un instant." : "Tu as de quoi jouer : la maison garde son ticket.");
    } else {
      toast(failureText(error), "erreur");
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Boutiques et tenue

/** Pourquoi un achat en boutique est impossible, vu de l'appareil. */
export function itemBlocker(itemId: string): string | null {
  const s = get();
  const item = itemId === KIOSK.id ? KIOSK : itemById(itemId);
  if (!s.player || !item) return null;
  if (!s.online) return "Hors connexion. Les boutiques rouvrent dès que le réseau revient.";
  const balance = displayBalance(s);
  if (balance < item.price) return `Il te manque ${formatEuros(item.price - balance)}.`;
  return null;
}

/**
 * Achète un bien. Rend `true` si l'achat a eu lieu. Un achat qui franchit un seuil
 * de Standing met le lieu ouvert en file pour sa présentation en plein écran.
 */
export async function buyItem(itemId: string): Promise<boolean> {
  const blocker = itemBlocker(itemId);
  if (blocker) {
    if (blocker.startsWith("Il te manque")) flashPurse();
    toast(blocker, "erreur");
    return false;
  }
  const before = get().player;
  try {
    const r = await api.buyItem(requireAuth(), itemId, ackList());
    applyState(r.state);
    const opened = newlyOpened(before?.standing ?? 0, r.state.standing).map((p) => p.id);
    const ending = !before?.kiosk && r.state.kiosk;
    set({ openings: [...get().openings, ...opened], ending: get().ending || ending, countMs: 500 });
    return true;
  } catch (error) {
    await recover(error);
    if (error instanceof ApiFailure && error.code === "INSUFFICIENT_FUNDS") {
      flashPurse();
      toast(itemBlocker(itemId) ?? failureText(error), "erreur");
    } else if (error instanceof ApiFailure && error.code === "NETWORK") {
      toast("Connexion coupée pendant l'achat. Regarde ta collection : s'il a été vendu, il y est.", "erreur");
    } else {
      toast(failureText(error), "erreur");
    }
    return false;
  }
}

/** Porter, retirer, s'installer, prendre le volant : affichage optimiste. */
export async function wear(slot: LookSlot, itemId: string | null): Promise<void> {
  const before = get().player;
  if (!before || before.look[slot] === itemId) return;
  set({ player: { ...before, look: { ...before.look, [slot]: itemId } } });
  try {
    const r = await api.setLook(requireAuth(), { look: { [slot]: itemId } });
    applyState(r.state);
  } catch (error) {
    // Retour en arrière, puis on se cale sur le serveur.
    const now = get().player;
    if (now) set({ player: { ...now, look: { ...now.look, [slot]: before.look[slot] } } });
    await recover(error);
    toast(failureText(error), "erreur");
  }
}

/** Changer d'espèce, gratuitement : affichage optimiste. */
export async function changeSpecies(species: string): Promise<void> {
  const before = get().player;
  if (!before || before.species === species) return;
  set({ player: { ...before, species } });
  try {
    const r = await api.setLook(requireAuth(), { species });
    applyState(r.state);
  } catch (error) {
    const now = get().player;
    if (now) set({ player: { ...now, species: before.species } });
    await recover(error);
    toast(failureText(error), "erreur");
  }
}

/** Le meilleur lieu ouvert, pour ouvrir la Promenade au bon endroit. */
export function bestOpenPlace(standing: number): PlaceId {
  let best: PlaceId = "kiosque";
  for (const p of PLACES) if (standing >= p.standing) best = p.id;
  return best;
}
