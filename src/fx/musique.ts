// La musique d'ambiance : un air par lieu de la Promenade, un pour la ville, un pour le
// Poker Tricheur, tous synthétisés (aucun fichier audio).
//
// Ce fichier est le seul morceau de la musique chargé au démarrage du jeu, et il ne fait
// qu'attendre : le réglage « Musique » allumé, et le premier geste du joueur (avant lui,
// le navigateur refuse le son). Alors seulement arrivent, à la demande, la régie (qui
// choisit le thème selon l'écran : musique/regie.ts), le moteur (musique/moteur.ts) et
// les dix partitions (musique/themes.ts).
//
// Le réglage « Musique » est indépendant du réglage « Son » : couper l'un ne coupe pas l'autre.

import { useGame } from "../app/store";
import { partage } from "./audio";

let pose = false;
let geste = false;
let demandee = false;
/** Après un chargement manqué (plus de réseau), on ne réessaie pas à chaque geste. */
let pasAvant = 0;
let oublie = (): void => undefined;

function accorde(): void {
  if (demandee || !geste || !useGame.getState().settings.musique || Date.now() < pasAvant) return;
  demandee = true;
  import("./musique/regie").then(
    (regie) => {
      oublie();
      regie.ouvre();
    },
    () => {
      demandee = false;
      pasAvant = Date.now() + 30_000;
    },
  );
}

/** À poser une fois, au lancement. */
export function installMusique(): void {
  if (pose) return;
  pose = true;
  const sansGeste = partage.auGeste(() => {
    geste = true;
    // Dans le geste même : c'est là que le navigateur laisse démarrer le contexte audio,
    // y compris quand le réglage « Son » est coupé.
    if (useGame.getState().settings.musique) partage.sortie();
    accorde();
  });
  // Le réglage rallumé plus tard, dans les Réglages.
  const sansReglage = useGame.subscribe(accorde);
  oublie = () => {
    sansGeste();
    sansReglage();
  };
}
