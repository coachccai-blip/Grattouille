// Le magasin d'état, unique (BRIEF.md, sections 15.4 et 15.9).
//
// - Le solde affiché vaut `state.balance` plus les gains des tickets grattés pas
//   encore déclarés au serveur.
// - Les tickets grattés sont déclarés dans le champ `ack` de la requête suivante,
//   quelle qu'elle soit ; à défaut en quittant l'écran de grattage, au passage en
//   arrière-plan, ou 3 secondes après le dernier grattage.
// - Affichage optimiste seulement là où un retour en arrière est simple : porter un
//   article, changer de résidence. Jamais pour un achat.

import { useEffect, useState } from "react";
import { create } from "zustand";
import { KIOSK, itemById } from "../../shared/catalog";
import { formatEuros, formatInt } from "../../shared/format";
import { PLACES, placeById } from "../../shared/places";
import {
  DAILY_TICKET_LIMIT, HOUSE_COOLDOWN_MS, LUCKY_FIND_MS, MAX_PENDING, houseEligible, isPlaceOpen, newlyOpened,
  normalizeCode,
} from "../../shared/rules";
import { TICKETS, ticketById } from "../../shared/tickets";
import type { LookSlot, PendingTicket, PlaceId, PlayerState } from "../../shared/types";
import { playCashRegister, playRefuse, playStars, resumeAudio, setSoundEnabled, suspendAudio } from "../fx/audio";
import { setHapticsEnabled } from "../fx/haptics";
import { ApiFailure, api, enableSandbox, wantsSandbox, type FailureCode } from "./api";
import { hostName } from "./dialogues";
import { capitalize } from "./helpers";
import { setLang, t } from "../i18n";
import { placeShort, ticketName } from "../i18n/noms";
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
  /** La vraie fin, « Huit as de cœur », est à l'écran. */
  trueEnding: boolean;
  /** Le générique à l'écran est un souvenir, revu depuis les Réglages : il ne dit rien au serveur et ne sème rien. */
  replay: boolean;
  /** Durée du prochain comptage du solde dans la bourse, en millisecondes. */
  countMs: number;
  /**
   * Ce que la bourse attend avant de compter un gain, en millisecondes : le temps que le
   * montant gagné finisse de défiler et que ses pièces arrivent jusqu'à elle.
   */
  countDelay: number;
  /** Incrémenté à chaque achat refusé faute d'argent : la bourse clignote. */
  purseFlash: number;
  /**
   * Date, sur cet appareil, à partir de laquelle la chance laisse traîner un ticket.
   * Calculée à chaque réponse du serveur (`luckyIn`) : l'horloge de l'appareil ne compte pas.
   */
  luckyAt: number;
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
  trueEnding: false,
  replay: false,
  countMs: 800,
  countDelay: 0,
  purseFlash: 0,
  luckyAt: 0,
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

/** Vrai tant qu'un grand moment (accueil, ouverture d'un lieu, générique) couvre le jeu : l'écran du dessous se tait. */
export function isCovered(s: Pick<GameState, "welcome" | "ending" | "openings"> & Partial<Pick<GameState, "trueEnding">>): boolean {
  return s.welcome || s.ending || s.trueEnding === true || s.openings.length > 0;
}

type FoundView = Pick<GameState, "player" | "revealed" | "luckyAt">;

/**
 * Qui n'a plus de quoi jouer n'attend pas la chance : son ticket traîne par terre
 * 20 secondes après le précédent, soit bien avant le rendez-vous de la chance.
 */
const BROKE_LEAD_MS = LUCKY_FIND_MS - HOUSE_COOLDOWN_MS;

/** Vrai si le joueur n'a plus de quoi jouer, vu de l'appareil. */
export function isBroke(s: Pick<GameState, "player" | "revealed">): boolean {
  if (!s.player) return false;
  return houseEligible({
    balance: displayBalance(s),
    pendingCount: toScratch(s).length,
    standing: s.player.standing,
  });
}

/**
 * Le ticket qui traîne par terre, vu de l'appareil : `fauche` quand le joueur n'a plus
 * de quoi jouer, `chance` quand la chance en a laissé un, `null` s'il n'y a rien.
 * Le serveur a le dernier mot.
 */
export function foundKind(s: FoundView, now: number): "fauche" | "chance" | null {
  if (!s.player) return null;
  if (isBroke(s)) return now >= s.luckyAt - BROKE_LEAD_MS ? "fauche" : null;
  return now >= s.luckyAt && toScratch(s).length < MAX_PENDING ? "chance" : null;
}

/** L'heure à laquelle un ticket apparaîtra par terre, ou 0 s'il est déjà là (ou si rien ne l'annonce). */
function nextFoundAt(s: FoundView, now: number): number {
  if (!s.player || foundKind(s, now)) return 0;
  if (isBroke(s)) return s.luckyAt - BROKE_LEAD_MS;
  return toScratch(s).length < MAX_PENDING ? s.luckyAt : 0;
}

/**
 * Le ticket par terre, pour un écran : se met à jour tout seul quand le ticket
 * apparaît, sans compte à rebours affiché.
 */
export function useFound(): "fauche" | "chance" | null {
  const [, tick] = useState(0);
  const kind = useGame((s) => foundKind(s, Date.now()));
  const wakeAt = useGame((s) => nextFoundAt(s, Date.now()));
  useEffect(() => {
    if (!wakeAt) return;
    const t = window.setTimeout(() => tick((n) => n + 1), Math.max(250, wakeAt - Date.now() + 60));
    return () => window.clearTimeout(t);
  }, [wakeAt]);
  return kind;
}

// ---------------------------------------------------------------------------
// Messages

let toastId = 0;
let toastTimer = 0;

/**
 * Message bref : bandeau au-dessus des onglets, 3 secondes. Un refus (pas assez
 * d'argent, lieu fermé) ou une erreur s'entend aussi : un double « non », tout doux.
 */
export function toast(text: string, kind: Toast["kind"] = "info"): void {
  if (kind === "erreur") playRefuse();
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

/**
 * Le texte de chaque échec, choisi par son code. Le serveur n'écrit qu'en français :
 * c'est l'appareil qui parle la langue du joueur. Ces phrases sont les clés de
 * traduction ; `{hote}` et `{n}` sont remplis à l'affichage.
 */
const FAILURES: Record<FailureCode, string> = {
  NETWORK: "Pas de réponse du kiosque. Vérifie ta connexion, puis réessaie.",
  SERVER_ERROR: "Le kiosque ne répond pas. Réessaie dans un instant.",
  NO_SERVER: "Le kiosque ne répond pas. Réessaie dans un instant.",
  CONFLICT: "Deux demandes en même temps. Réessaie dans un instant.",
  UNAUTHORIZED: "Ce compte n'est plus reconnu. Retrouve-le avec ton pseudo et ton code.",
  BAD_REQUEST: "Cette demande est illisible. Recharge la page et réessaie.",
  PSEUDO_INVALID: "Ce pseudo ne convient pas. Il faut 3 à 16 caractères : lettres, chiffres, espace ou tiret.",
  PLACE_LOCKED: "Ce lieu est encore fermé. Il te faut plus de Standing.",
  KIOSK_LOCKED: "Le Kiosque n'est à vendre qu'une fois ta collection complète.",
  SOW_LOCKED: "Seul le Patron du Kiosque laisse tomber des tickets pour les nouveaux venus.",
  NOT_FOUND: "Cette adresse n'existe pas.",
  PSEUDO_TAKEN: "Ce pseudo est pris. Essaie avec un autre.",
  INSUFFICIENT_FUNDS: "Il te manque de l'argent pour cet achat.",
  PENDING_FULL: "Gratte d'abord tes tickets en attente.",
  ALREADY_OWNED: "Tu possèdes déjà ce bien.",
  HOUSE_NOT_ELIGIBLE: "Rien ne traîne par terre pour l'instant.",
  TOO_FAST: "{hote} n'a que deux pattes. Réessaie dans un instant.",
  DAILY_LIMIT: "{n} tickets aujourd'hui : le guichet rouvre demain.",
  // Le Poker Tricheur (traduits dans src/i18n/en/poker.ts).
  TABLE_NOT_FOUND: "Cette table n'existe pas, ou elle a fermé. Vérifie le code.",
  TABLE_FULL: "Cette table est complète. Attends qu'un siège se libère.",
  ALREADY_SEATED: "Tu as déjà une place à une table. Quitte-la avant d'en rejoindre une autre.",
  NOT_SEATED: "Tu n'as plus de place à cette table.",
  BUYIN_UNAFFORDABLE: "Ta bourse ne suffit pas pour cette cave.",
  NOT_YOUR_TURN: "Ce n'est pas ton tour. Attends que la parole te revienne.",
  ACTION_IMPOSSIBLE: "Ce geste n'est plus possible : la table a déjà tourné.",
  BLIND_TOO_HIGH: "Cette blinde est trop haute pour ta bourse : il en faut quarante pour créer la table.",
  MASTERS_LOCKED: "La Table des Maîtres n'ouvre qu'à qui a relevé les huit défis.",
};

/** Les précisions que le serveur donne parfois à la place du message de son code : connues, donc traduites. */
const SERVER_DETAILS: ReadonlySet<string> = new Set([
  "Tu ne possèdes pas cet article.",
  "Rien par terre pour l'instant. Regarde encore dans un instant.",
]);

/** Le texte à montrer pour un échec, dans la langue du jeu : jamais de code technique. */
export function failureText(error: unknown): string {
  if (!(error instanceof ApiFailure)) return t(FAILURES.SERVER_ERROR);
  if (SERVER_DETAILS.has(error.message)) return t(error.message);
  const known = (FAILURES as Partial<Record<string, string>>)[error.code];
  if (known) return t(known, { hote: hostName("gaspard"), n: formatInt(DAILY_TICKET_LIMIT) });
  // Un code que cet appareil ne connaît pas (serveur plus récent) : à défaut, la phrase du serveur.
  return error.message && error.message !== error.code ? error.message : t(FAILURES.SERVER_ERROR);
}

// ---------------------------------------------------------------------------
// État du serveur

/** Se cale sur l'état rendu par le serveur. Les tickets déclarés quittent la liste locale. */
function applyState(state: PlayerState): void {
  const pending = new Set(state.pending.map((t) => t.id));
  const revealed = get().revealed.filter((id) => pending.has(id));
  if (!get().sandbox) saveRevealed(revealed);
  set({ player: state, revealed, luckyAt: Date.now() + (state.luckyIn ?? 0) });
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
  set({
    auth: null, player: null, revealed: [], phase: "bienvenue", openings: [], ending: false, welcome: false,
    trueEnding: false, replay: false,
  });
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
 * `countDelay` : ce qu'elle attend d'abord (le montant gagné défile, ses pièces arrivent).
 */
export function markRevealed(ticketId: string, countMs: number, countDelay = 0): void {
  const { revealed, sandbox } = get();
  if (revealed.includes(ticketId)) return;
  const next = [...revealed, ticketId];
  if (!sandbox) saveRevealed(next);
  set({ revealed: next, countMs, countDelay });
  window.clearTimeout(ackTimer);
  ackTimer = window.setTimeout(() => void flushAck(), 3000);
}

// ---------------------------------------------------------------------------
// Démarrage

let booted = false;

export async function boot(): Promise<void> {
  const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const settings = loadSettings();
  setLang(settings.langue);
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
      toast(t(FAILURES.UNAUTHORIZED), "erreur");
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
  set({
    auth, player: state, revealed: [], phase: "jeu", welcome, openings: [], ending: false,
    trueEnding: false, replay: false,
    luckyAt: Date.now() + (state.luckyIn ?? 0),
  });
}

export async function signup(pseudo: string, species: string): Promise<void> {
  const r = await api.createPlayer(pseudo, species);
  enter({ playerId: r.playerId, code: r.code }, r.state, true);
}

export async function login(pseudo: string, code: string): Promise<void> {
  const normalized = normalizeCode(code);
  if (!normalized) throw new ApiFailure("UNAUTHORIZED", 401);
  const r = await api.openSession(pseudo, normalized);
  enter({ playerId: r.playerId, code: normalized }, r.state, false);
  patchSettings({ codeNote: true });
}

export async function deleteAccount(): Promise<void> {
  const auth = requireAuth();
  await api.deleteMe(auth);
  // L'appareil vide son stockage.
  if (!get().sandbox) clearAll();
  // Les réglages repartent de zéro, sauf la langue : on ne change pas de langue en cours de phrase.
  const settings = { ...DEFAULT_SETTINGS, langue: get().settings.langue };
  setSoundEnabled(settings.son);
  setHapticsEnabled(settings.vibrations);
  set({ auth: null, player: null, revealed: [], phase: "bienvenue", settings, openings: [], ending: false, welcome: false });
  toast(t("Ton compte est supprimé. Il ne reste rien sur cet appareil."));
}

export function patchSettings(change: Partial<Settings>): void {
  const settings = { ...get().settings, ...change };
  saveSettings(settings);
  // La langue d'abord : l'écran se redessine tout entier dès que le réglage change (main.tsx).
  setLang(settings.langue);
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

/** Ce qui empêche un achat : la phrase à montrer, et si c'est faute d'argent (la bourse clignote alors). */
interface Blocker {
  text: string;
  funds: boolean;
}

const OFFLINE_TICKETS = "Hors connexion. Tu peux gratter tes tickets en attente, pas en acheter.";
const PENDING_FIRST = "Gratte d'abord tes tickets en attente.";

/** « Le Casino ouvre à ★ 130. Il te manque 26 ★ : passe chez Sidonie. » */
export function lockedText(place: PlaceId, standing: number): string {
  const needed = placeById(place).standing;
  return t("{lieu} ouvre à ★ {seuil}. Il te manque {manque} ★ : passe chez Sidonie.", {
    lieu: capitalize(placeShort(place)),
    seuil: formatInt(needed),
    manque: formatInt(needed - standing),
  });
}

function ticketBlock(type: string, qty: number): Blocker | null {
  const s = get();
  const def = ticketById(type);
  if (!s.player || !def) return null;
  if (!s.online) return { text: t(OFFLINE_TICKETS), funds: false };
  if (!isPlaceOpen(def.place, s.player.standing)) return { text: lockedText(def.place, s.player.standing), funds: false };
  if (toScratch(s).length + qty > MAX_PENDING) return { text: t(PENDING_FIRST), funds: false };
  const balance = displayBalance(s);
  const cost = def.price * qty;
  if (balance >= cost) return null;
  const montant = formatEuros(cost - balance);
  // Le ticket le plus cher encore à portée, parmi les lieux ouverts.
  const within = TICKETS.filter((x) => x.price <= balance && isPlaceOpen(x.place, s.player!.standing))
    .sort((a, b) => b.price - a.price)[0];
  let text: string;
  if (qty > 1 && balance >= def.price) {
    text = t("Il te manque {montant} pour ce carnet. À l'unité, ça passe.", { montant });
  } else if (within) {
    text = t("Il te manque {montant}. {ticket} est à {prix}.", {
      montant, ticket: ticketName(within.id), prix: formatEuros(within.price),
    });
  } else if (toScratch(s).length > 0) {
    // Plus rien à portée : on ne reste pas bloqué pour autant.
    text = t("Il te manque {montant}. Gratte d'abord tes tickets en attente.", { montant });
  } else {
    text = t("Il te manque {montant}. Regarde par terre : un ticket ne va pas tarder.", { montant });
  }
  return { text, funds: true };
}

/** Pourquoi un achat de ticket est impossible, vu de l'appareil. `null` : rien ne s'y oppose. */
export function ticketBlocker(type: string, qty: number): string | null {
  return ticketBlock(type, qty)?.text ?? null;
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
  const blocker = ticketBlock(type, qty);
  if (blocker) {
    if (blocker.funds) flashPurse();
    toast(blocker.text, "erreur");
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
          toast(t("Connexion coupée pendant l'achat. Si le ticket a été vendu, il t'attend dans À gratter."), "erreur");
          break;
        case "TOO_FAST":
          toast(t(FAILURES.TOO_FAST, { hote: hostName(placeById(def.place).host) }), "erreur");
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

const NOTHING_FOUND = "Rien par terre pour l'instant. Regarde encore dans un instant.";

/** Ramasse le ticket qui traîne par terre. Rend le ticket, ou `null` s'il n'y avait rien. */
export async function pickUpTicket(): Promise<PendingTicket | null> {
  const s = get();
  if (!s.online) {
    toast(t("Hors connexion. Tu peux gratter tes tickets en attente, pas en ramasser."), "erreur");
    return null;
  }
  if (!foundKind(s, Date.now())) {
    toast(t(NOTHING_FOUND));
    return null;
  }
  try {
    const r = await api.foundTicket(requireAuth(), ackList());
    applyState(r.state);
    return r.tickets[0] ?? null;
  } catch (error) {
    await recover(error);
    if (error instanceof ApiFailure && error.code === "HOUSE_NOT_ELIGIBLE") {
      // Le serveur n'a rien vu par terre : on se recale sur son horloge.
      await refresh().catch(() => undefined);
      toast(t(NOTHING_FOUND));
    } else {
      toast(failureText(error), "erreur");
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Les tickets semés et l'histoire

/** Le Patron peut laisser tomber des tickets : le Kiosque est à lui. */
export function canSow(s: Pick<GameState, "player">): boolean {
  return s.player?.kiosk === true;
}

/** Pourquoi semer est impossible, vu de l'appareil. `null` : rien ne s'y oppose. */
export function sowBlocker(type: string, qty: number): string | null {
  const s = get();
  const def = ticketById(type);
  if (!s.player || !def) return null;
  if (!s.online) return t("Hors connexion. Les tickets à semer attendront.");
  if (!s.player.kiosk) return t(FAILURES.SOW_LOCKED);
  const balance = displayBalance(s);
  const cost = def.price * qty;
  if (balance >= cost) return null;
  return t("Il te manque {montant} pour semer ça.", { montant: formatEuros(cost - balance) });
}

/**
 * Laisse tomber des tickets pour les nouveaux venus (un, cinq ou dix). Rend vrai si
 * c'est fait. Un refus s'affiche, sauf `quiet` : le geste du générique ne dit rien
 * quand la bourse est vide.
 */
export async function sowTickets(type: string, qty = 1, quiet = false): Promise<boolean> {
  const blocker = sowBlocker(type, qty);
  if (blocker) {
    if (!quiet) {
      if (get().online && get().player?.kiosk) flashPurse();
      toast(blocker, "erreur");
    }
    return false;
  }
  if (!get().player || !ticketById(type)) return false;
  try {
    const r = await api.sowTickets(requireAuth(), type, qty, ackList());
    applyState(r.state);
    return true;
  } catch (error) {
    await recover(error);
    if (!quiet) {
      if (error instanceof ApiFailure && error.code === "INSUFFICIENT_FUNDS") flashPurse();
      toast(failureText(error), "erreur");
    }
    return false;
  }
}

/** La vraie fin se mérite : le Kiosque est à lui, les huit défis sont relevés, et il ne l'a pas encore vue. */
export function trueEndingDue(s: Pick<GameState, "player">): boolean {
  const p = s.player;
  return !!p && p.kiosk && p.defis.length >= PLACES.length && !p.story.vraieFin;
}

/** Marque la vraie fin comme vue. Sans réseau, elle se rejouera à la prochaine visite. */
export async function markTrueEndingSeen(): Promise<boolean> {
  if (!get().player) return false;
  try {
    const r = await api.storySeen(requireAuth(), "vraie-fin", ackList());
    applyState(r.state);
    return true;
  } catch (error) {
    await recover(error);
    return false;
  }
}

/** Vue jusqu'au bout depuis le lancement du jeu : si le serveur ne l'a pas su, on le lui redira sans la rejouer. */
let trueEndingWatched = false;

/**
 * La vraie fin se lève, si elle est due : la coquille l'appelle au retour sur le Domaine.
 * Vue jusqu'au bout sans réseau, elle ne recommence pas à chaque passage : on redit
 * seulement au serveur qu'elle a été vue, et elle se rejouera au prochain lancement s'il
 * ne l'a toujours pas su.
 */
export function openTrueEnding(): void {
  const s = get();
  if (s.trueEnding || !trueEndingDue(s)) return;
  if (trueEndingWatched) void markTrueEndingSeen();
  else set({ trueEnding: true, replay: false });
}

/**
 * La vraie fin se referme : c'est à la cinématique de dire d'abord au serveur qu'elle a été
 * vue. `seen` : faux si elle n'a pas pu se jouer (son morceau du jeu n'est pas arrivé).
 */
export function closeTrueEnding(seen = true): void {
  if (seen && !get().replay) trueEndingWatched = true;
  set({ trueEnding: false, replay: false });
}

/** Les Souvenirs des Réglages : revoir le premier générique ou la vraie fin, sans rien changer au compte. */
export function replayMemory(memory: "fin" | "vraie-fin"): void {
  set(memory === "fin" ? { ending: true, replay: true } : { trueEnding: true, replay: true });
}

/** Le souvenir du premier générique se referme. */
export function closeMemory(): void {
  set({ ending: false, replay: false });
}

// ---------------------------------------------------------------------------
// Boutiques et tenue

function itemBlock(itemId: string): Blocker | null {
  const s = get();
  const item = itemId === KIOSK.id ? KIOSK : itemById(itemId);
  if (!s.player || !item) return null;
  if (!s.online) return { text: t("Hors connexion. Les boutiques rouvrent dès que le réseau revient."), funds: false };
  const balance = displayBalance(s);
  if (balance >= item.price) return null;
  return { text: t("Il te manque {montant}.", { montant: formatEuros(item.price - balance) }), funds: true };
}

/** Pourquoi un achat en boutique est impossible, vu de l'appareil. */
export function itemBlocker(itemId: string): string | null {
  return itemBlock(itemId)?.text ?? null;
}

/**
 * Achète un bien. Rend `true` si l'achat a eu lieu. Un achat qui franchit un seuil
 * de Standing met le lieu ouvert en file pour sa présentation en plein écran.
 */
export async function buyItem(itemId: string): Promise<boolean> {
  const blocker = itemBlock(itemId);
  if (blocker) {
    if (blocker.funds) flashPurse();
    toast(blocker.text, "erreur");
    return false;
  }
  const before = get().player;
  try {
    const r = await api.buyItem(requireAuth(), itemId, ackList());
    applyState(r.state);
    const opened = newlyOpened(before?.standing ?? 0, r.state.standing).map((p) => p.id);
    const ending = !before?.kiosk && r.state.kiosk;
    // La caisse, puis une note par étoile de Standing gagnée (huit au plus). Quand l'achat
    // ouvre un lieu ou conclut l'histoire, c'est la fanfare du grand moment qui prend la suite.
    playCashRegister();
    if (opened.length === 0 && !ending) playStars(r.state.standing - (before?.standing ?? 0), 0.42);
    set({ openings: [...get().openings, ...opened], ending: get().ending || ending, countMs: 500, countDelay: 0 });
    return true;
  } catch (error) {
    await recover(error);
    if (error instanceof ApiFailure && error.code === "INSUFFICIENT_FUNDS") {
      flashPurse();
      toast(itemBlocker(itemId) ?? failureText(error), "erreur");
    } else if (error instanceof ApiFailure && error.code === "NETWORK") {
      toast(t("Connexion coupée pendant l'achat. Regarde ta collection : s'il a été vendu, il y est."), "erreur");
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

// ---------------------------------------------------------------------------
// Pour le Poker Tricheur (src/app/poker.ts), qui parle au même serveur avec le même
// compte : se caler sur un état rendu par le serveur (il dit aussi à quelle table le
// joueur est assis, `player.poker`), déclarer les tickets grattés, réagir à un échec.
export { ackList, applyState, recover, requireAuth };
