// Les trophées, côté appareil : ce qui reste chargé au démarrage, donc le strict nécessaire.
// L'écran, ses dessins et les noms des médailles sont dans src/screens/trophees, chargés à
// la demande.
//
// - Les médailles « nouvelles » : gagnées, mais pas encore regardées dans la vitrine. Ce
//   que le joueur a regardé se retient sur l'appareil, dans les réglages
//   (`settings.medailles`), avec le compte à qui c'est. Un compte d'avant les trophées n'a
//   encore rien regardé : tout ce qu'il a mérité est « nouveau », et la pastille du
//   Domaine le lui dit. En bac à sable rien ne s'enregistre : c'est gardé en mémoire.
// - Les annonces : quand une action fait gagner une médaille pendant la session, elle
//   rejoint une file. Rien au premier état de la session (pas de fanfare rétroactive). La
//   file se vide une annonce à la fois, jamais par-dessus un grand moment ; au-delà de
//   trois médailles en attente, une seule annonce les regroupe.

import { create } from "zustand";
import { medalsOf, newMedals } from "../../shared/trophies";
import type { PlayerState } from "../../shared/types";
import type { MedaillesVues } from "./persist";
import { isCovered, patchSettings, useGame } from "./store";

type Jeu = ReturnType<typeof useGame.getState>;

/** Au-delà de ce nombre de médailles en attente, une seule annonce les regroupe. */
export const GROUPE_AU_DELA = 3;

interface Annonces {
  /** Les médailles gagnées pendant la session et pas encore annoncées, dans l'ordre où elles sont tombées. */
  attente: string[];
  /** L'annonce à l'écran : une médaille, ou plusieurs d'un coup. */
  annonce: string[] | null;
  /** Bac à sable : ce qui a été regardé dans la vitrine, en mémoire seulement. */
  bac: MedaillesVues;
}

export const useAnnonces = create<Annonces>(() => ({ attente: [], annonce: null, bac: { joueur: "", vues: [] } }));

// ---------------------------------------------------------------------------
// Déjà vues, nouvelles

/** Les médailles de ce joueur qu'il n'a pas encore regardées dans la vitrine. */
export function medaillesNouvelles(player: PlayerState, vues: MedaillesVues): string[] {
  const gagnees = medalsOf(player);
  // Ce qu'un autre compte a regardé sur cet appareil ne compte pas.
  return vues.joueur === player.id ? gagnees.filter((medaille) => !vues.vues.includes(medaille)) : gagnees;
}

/** Ce que le joueur a déjà regardé : dans les réglages, ou en mémoire pour le bac à sable. */
export function vuesDe(s: Pick<Jeu, "sandbox" | "settings">, bac: MedaillesVues): MedaillesVues {
  return s.sandbox ? bac : s.settings.medailles;
}

/** Pour un écran : ce que le joueur a déjà regardé. */
export function useVues(): MedaillesVues {
  const bac = useAnnonces((a) => a.bac);
  return useGame((s) => vuesDe(s, bac));
}

/** Le joueur regarde la vitrine : tout ce qu'il a gagné est vu. */
export function marquerVues(): void {
  const s = useGame.getState();
  if (!s.player || medaillesNouvelles(s.player, vuesDe(s, useAnnonces.getState().bac)).length === 0) return;
  const medailles: MedaillesVues = { joueur: s.player.id, vues: medalsOf(s.player) };
  if (s.sandbox) useAnnonces.setState({ bac: medailles });
  else patchSettings({ medailles });
}

// ---------------------------------------------------------------------------
// La file des annonces

/** Ce qu'un changement d'état du joueur vient de faire gagner. Rien au premier état, ni d'un compte à l'autre. */
export function gagneesEntre(avant: PlayerState | null, apres: PlayerState | null): string[] {
  if (!avant || !apres || avant.id !== apres.id) return [];
  return newMedals(avant, apres);
}

/** L'annonce suivante : une médaille à la fois ; au-delà de trois en attente, toutes d'un coup. */
export function annonceSuivante(attente: readonly string[]): { annonce: string[]; reste: string[] } | null {
  if (attente.length === 0) return null;
  if (attente.length > GROUPE_AU_DELA) return { annonce: [...attente], reste: [] };
  return { annonce: [attente[0]!], reste: attente.slice(1) };
}

/** Faux pendant un grand moment (accueil, ouverture d'un lieu, générique, vraie fin) et hors du jeu : l'annonce attend son tour. */
export function peutAnnoncer(s: Parameters<typeof isCovered>[0] & Pick<Jeu, "phase">): boolean {
  return s.phase === "jeu" && !isCovered(s);
}

/** Fait passer l'annonce suivante à l'écran, si la place est libre. Rend vrai si une annonce est partie. */
export function annoncer(libre: boolean): boolean {
  const a = useAnnonces.getState();
  const suite = libre && !a.annonce ? annonceSuivante(a.attente) : null;
  if (!suite) return false;
  useAnnonces.setState({ annonce: suite.annonce, attente: suite.reste });
  return true;
}

/** L'annonce à l'écran a fini son temps. */
export function finAnnonce(): void {
  useAnnonces.setState({ annonce: null });
}

/** Plus rien à annoncer : le joueur est devant la vitrine, ou le compte a changé. */
export function oublierAnnonces(): void {
  const a = useAnnonces.getState();
  if (a.annonce || a.attente.length > 0) useAnnonces.setState({ annonce: null, attente: [] });
}

/** Les médailles déjà mises en file : une médaille ne s'annonce qu'une fois par session. */
const dites = new Set<string>();

// Chaque changement de l'état du joueur est comparé au précédent.
useGame.subscribe((s, avant) => {
  if (s.player === avant.player) return;
  if (s.player?.id !== avant.player?.id) {
    dites.clear();
    oublierAnnonces();
    return;
  }
  const gagnees = gagneesEntre(avant.player, s.player).filter((medaille) => !dites.has(medaille));
  if (gagnees.length === 0) return;
  for (const medaille of gagnees) dites.add(medaille);
  useAnnonces.setState((a) => ({ attente: [...a.attente, ...gagnees] }));
});
