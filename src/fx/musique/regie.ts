// La régie de la musique d'ambiance : c'est ici, et nulle part ailleurs, que se décide
// quel thème va sur quel écran. Elle suit la navigation et l'état du jeu, et tient le
// moteur : le thème du lieu à son comptoir, sur la fiche d'un de ses tickets et pendant
// qu'on gratte un ticket de ce lieu ; le blues du poker sur tous ses écrans ; le thème de
// la ville partout ailleurs, écran de bienvenue compris.
//
// Elle arrive avec le moteur et les partitions, à la demande (voir src/fx/musique.ts) :
// rien de tout cela ne pèse sur le démarrage du jeu.

import { ticketById } from "../../../shared/tickets";
import type { PendingTicket } from "../../../shared/types";
import { resolveScreens, screenKey, useNav, type Screen } from "../../app/nav";
import { isCovered, toScratch, useGame } from "../../app/store";
import { partage } from "../audio";
import { creeMoteur, type Moteur } from "./moteur";
import type { ThemeId } from "./themes";

type Jeu = ReturnType<typeof useGame.getState>;

/** Ce que la régie regarde du jeu. */
export type Vue = Pick<Jeu, "phase" | "welcome" | "ending" | "trueEnding" | "openings" | "player" | "revealed">;

/** Ce que la musique doit faire : quel thème (`null` : le silence), à quel niveau, et sur quel écran. */
export interface Scene {
  theme: ThemeId | null;
  niveau: number;
  ecran: string;
}

/**
 * Pendant l'accueil de Piou ou le carton d'un chapitre, la musique s'efface à demi : la
 * mouette, le pépiement, la fanfare du lieu qui ouvre passent devant. Un générique, lui,
 * se joue dans le silence : il a ses propres sons, et ils sont rares.
 */
export const RETRAIT = 0.4;

/** Le ticket en cours sur l'écran de grattage : le premier de la pile qui reste à gratter (le dernier, quand tout l'est). */
function ticketEnCours(tickets: readonly PendingTicket[], jeu: Vue): PendingTicket | undefined {
  const restent = new Set(toScratch(jeu).map((t) => t.id));
  return tickets.find((t) => restent.has(t.id)) ?? tickets[tickets.length - 1];
}

/** La scène qui convient à cet instant du jeu. */
export function sceneDe(jeu: Vue, stack: readonly Screen[], index: number): Scene {
  if (jeu.phase === "bienvenue") return { theme: "ville", niveau: 1, ecran: "bienvenue" };
  if (jeu.phase !== "jeu") return { theme: null, niveau: 1, ecran: jeu.phase };
  const { base, baseIndex } = resolveScreens(stack, index);
  const ecran = screenKey(base, baseIndex);
  if (jeu.ending || jeu.trueEnding) return { theme: null, niveau: 1, ecran };

  let theme: ThemeId = "ville";
  if (base.name === "comptoir") theme = base.place;
  else if (base.name === "grattage") theme = ticketById(ticketEnCours(base.tickets, jeu)?.type ?? "")?.place ?? "ville";
  else if (base.name === "poker" || base.name === "poker-table") theme = "poker";
  // La fiche d'un ticket, où qu'elle s'ouvre, joue l'air de son lieu.
  const dessus = stack[index];
  if (dessus?.name === "fiche-ticket") theme = ticketById(dessus.ticket)?.place ?? theme;
  return { theme, niveau: isCovered(jeu) ? RETRAIT : 1, ecran };
}

// ---------------------------------------------------------------------------

/** Un changement d'écran s'entend presque aussitôt : le temps que la navigation se pose (un retour, puis un autre écran). */
const DELAI_ECRAN = 120;
/**
 * Sur un même écran (une pile de tickets de plusieurs lieux, grattée en rafale), le thème
 * attend que le ticket en cours ne change plus : la musique ne zappe pas.
 */
const DELAI_TICKET = 1500;

let moteur: Moteur | null = null;
let contexte: AudioContext | null = null;
let ouverte = false;
/** La scène que le moteur joue, et celle qu'une minuterie s'apprête à lui donner. */
let jouee: Scene | null = null;
let attendue: Scene | null = null;
let minuterie: ReturnType<typeof setTimeout> | undefined;

const visible = (): boolean => typeof document === "undefined" || document.visibilityState === "visible";
const allumee = (): boolean => useGame.getState().settings.musique;

function scene(): Scene {
  // La planche de contrôle (?planche) se regarde en silence.
  if (typeof window !== "undefined" && window.location.search.includes("planche")) return { theme: null, niveau: 1, ecran: "planche" };
  const { stack, index } = useNav.getState();
  return sceneDe(useGame.getState(), stack, index);
}

const pareilles = (a: Scene | null, b: Scene): boolean => a !== null && a.theme === b.theme && a.niveau === b.niveau && a.ecran === b.ecran;

function annule(): void {
  clearTimeout(minuterie);
  minuterie = undefined;
  attendue = null;
}

/** Donne au moteur la scène du moment. */
function applique(): void {
  annule();
  if (!allumee()) {
    moteur?.arret();
    jouee = null;
    return;
  }
  const s = scene();
  jouee = s;
  if (!moteur) {
    if (!s.theme) return;
    // Pas encore de contexte (aucun geste, pas de Web Audio) : le prochain geste réessaiera.
    const sortie = partage.sortie();
    if (!sortie) return;
    contexte = sortie.ctx;
    moteur = creeMoteur(sortie);
    if (!visible()) moteur.pause();
    // En bac à sable, la recette peut interroger le moteur : `window.__musique.etat()`.
    if (typeof window !== "undefined" && window.location.search.includes("bac-a-sable")) {
      (window as unknown as { __musique: Moteur }).__musique = moteur;
    }
  }
  moteur.niveau(s.niveau);
  moteur.jouer(s.theme);
}

/** Quelque chose a changé dans le jeu ou dans la navigation : la scène est-elle encore la bonne ? */
function revoit(): void {
  if (!allumee()) {
    // Le réglage coupe tout de suite.
    if (jouee || minuterie !== undefined) applique();
    return;
  }
  const s = scene();
  if (pareilles(jouee, s)) {
    annule();
    return;
  }
  if (pareilles(attendue, s)) return;
  // Rallumer la musique s'entend tout de suite, comme la couper.
  const delai = !jouee ? 0 : s.ecran === jouee.ecran && s.theme !== jouee.theme ? DELAI_TICKET : DELAI_ECRAN;
  clearTimeout(minuterie);
  attendue = s;
  minuterie = setTimeout(applique, delai);
}

/** Chaque geste du joueur : c'est le moment où le navigateur accepte de (re)lancer le son. */
function auGeste(): void {
  if (!allumee()) return;
  if (!moteur) {
    if (minuterie === undefined) applique();
  } else if (contexte?.state === "suspended") {
    partage.sortie();
  }
}

/** La page se cache : tout se tait. Elle revient : la musique reprend, que le réglage « Son » soit allumé ou non. */
function auChangementDePage(): void {
  if (!moteur) return;
  if (visible()) {
    if (allumee()) partage.sortie();
    moteur.reprise();
  } else {
    moteur.pause();
  }
}

/** Ouvre la régie : une fois, au premier geste du joueur si le réglage « Musique » est allumé. */
export function ouvre(): void {
  if (ouverte) return;
  ouverte = true;
  useGame.subscribe(revoit);
  useNav.subscribe(revoit);
  partage.auGeste(auGeste);
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", auChangementDePage);
  applique();
}
