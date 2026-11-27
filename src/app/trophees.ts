// Les trophées, côté appareil : ce qui reste chargé au démarrage, donc le strict nécessaire.
// L'écran, ses dessins, les noms des médailles et le tour de parole des annonces sont dans
// src/screens/trophees, chargés à la demande.
//
// - Les médailles « nouvelles » : gagnées, mais pas encore regardées dans la vitrine. Ce
//   que le joueur a regardé se retient sur l'appareil, dans les réglages
//   (`settings.medailles`), avec le compte à qui c'est. Un compte d'avant les trophées n'a
//   encore rien regardé : tout ce qu'il a mérité est « nouveau », et la pastille du
//   Domaine le lui dit. En bac à sable rien ne s'enregistre : c'est gardé en mémoire.
// - La file des annonces : quand une action fait gagner une médaille pendant la session,
//   elle y entre. Rien au premier état de la session (pas de fanfare rétroactive). C'est le
//   crieur (src/screens/trophees/Crieur.tsx) qui la fait passer à l'écran.

import { create } from "zustand";
import { medalsOf, newMedals } from "../../shared/trophies";
import type { PlayerState } from "../../shared/types";
import type { MedaillesVues } from "./persist";
import { useGame } from "./store";

type Jeu = ReturnType<typeof useGame.getState>;

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

// ---------------------------------------------------------------------------
// La file des annonces

/** Ce qu'un changement d'état du joueur vient de faire gagner. Rien au premier état, ni d'un compte à l'autre. */
export function gagneesEntre(avant: PlayerState | null, apres: PlayerState | null): string[] {
  if (!avant || !apres || avant.id !== apres.id) return [];
  return newMedals(avant, apres);
}

/** Plus rien à annoncer : le joueur est devant la vitrine, ou le compte a changé. */
export function oublierAnnonces(): void {
  const a = useAnnonces.getState();
  if (a.annonce || a.attente.length > 0) useAnnonces.setState({ annonce: null, attente: [] });
}

/** Les médailles déjà mises en file : une médaille ne s'annonce qu'une fois par session. */
const dites = new Set<string>();

// Chaque changement de l'état du joueur est comparé au précédent.
const cesser = useGame.subscribe((s, avant) => {
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

// En développement, un module rechargé à chaud n'écoute pas deux fois.
import.meta.hot?.dispose(cesser);
