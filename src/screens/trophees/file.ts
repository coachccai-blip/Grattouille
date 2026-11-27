// La file des annonces, côté annonce : dans quel ordre les médailles passent à l'écran, quand
// elles se regroupent, quand elles attendent ; et ce que le joueur a regardé dans la vitrine.
// La file elle-même, et ce qui y fait entrer une médaille, sont dans src/app/trophees.ts
// (chargé au démarrage) ; ce module-ci arrive avec la vitrine.

import { medalsOf } from "../../../shared/trophies";
import type { MedaillesVues } from "../../app/persist";
import { isCovered, patchSettings, useGame } from "../../app/store";
import { medaillesNouvelles, useAnnonces, vuesDe } from "../../app/trophees";

/** Au-delà de ce nombre de médailles en attente, une seule annonce les regroupe. */
export const GROUPE_AU_DELA = 3;

/** L'annonce suivante : une médaille à la fois ; au-delà de trois en attente, toutes d'un coup. */
export function annonceSuivante(attente: readonly string[]): { annonce: string[]; reste: string[] } | null {
  if (attente.length === 0) return null;
  if (attente.length > GROUPE_AU_DELA) return { annonce: [...attente], reste: [] };
  return { annonce: [attente[0]!], reste: attente.slice(1) };
}

/** Faux pendant un grand moment (accueil, ouverture d'un lieu, générique, vraie fin) et hors du jeu : l'annonce attend son tour. */
export function peutAnnoncer(s: Parameters<typeof isCovered>[0] & { phase: string }): boolean {
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

/** Un grand moment commence alors que l'annonce venait d'arriver : elle lui laisse l'écran, et repassera après. */
export function remettreAnnonce(): void {
  const a = useAnnonces.getState();
  if (a.annonce) useAnnonces.setState({ annonce: null, attente: [...a.annonce, ...a.attente] });
}

/** Le joueur regarde la vitrine : tout ce qu'il a gagné est vu. */
export function marquerVues(): void {
  const s = useGame.getState();
  if (!s.player || medaillesNouvelles(s.player, vuesDe(s, useAnnonces.getState().bac)).length === 0) return;
  const medailles: MedaillesVues = { joueur: s.player.id, vues: medalsOf(s.player) };
  // En bac à sable rien ne s'enregistre : c'est gardé en mémoire, le temps de la visite.
  if (s.sandbox) useAnnonces.setState({ bac: medailles });
  else patchSettings({ medailles });
}
