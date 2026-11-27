// Le crieur : il fait passer à l'écran, une à une, les médailles gagnées pendant la session
// (la file est tenue par src/app/trophees.ts). Chargé au démarrage, il ne pèse presque rien :
// l'annonce elle-même, son dessin et le nom de la médaille n'arrivent qu'à la première fois.
//
// Une annonce attend son tour : jamais par-dessus un grand moment (accueil, ouverture d'un
// lieu, générique), ni pendant qu'un ticket montre son résultat ou qu'un carnet se gratte en
// rafale ; et toujours un instant après le geste qui l'a value, pour laisser la caisse et
// les étoiles finir de sonner.

import { useEffect, useRef, type ComponentType } from "react";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { annoncer, finAnnonce, oublierAnnonces, peutAnnoncer, useAnnonces } from "../../app/trophees";

export interface AnnonceProps {
  /** Une médaille, ou plusieurs gagnées d'un coup : « famille:rang ». */
  medailles: string[];
  /** L'annonce a fini son temps, ou le joueur l'a touchée (`ouvrir`) pour aller voir la vitrine. */
  onFin: (ouvrir: boolean) => void;
}

/** Le carton de l'annonce, une fois son morceau du jeu chargé. */
let Carton: ComponentType<AnnonceProps> | null = null;

/** Ce qui ne se couvre pas : un grand moment, la fête d'un résultat, un carnet gratté en rafale. */
const OCCUPE = ".moment, .fete, .grattage__plateau--resultat, .grattage--rafale";

function libre(): boolean {
  return peutAnnoncer(useGame.getState())
    && document.visibilityState === "visible"
    && nav.current().name !== "trophees"
    && document.querySelector(OCCUPE) === null;
}

/** Ce qu'une annonce attend après le geste qui l'a value, puis entre deux annonces, puis quand la place est prise. */
const APRES_LE_GESTE_MS = 1000;
const ENTRE_DEUX_MS = 450;
const PATIENCE_MS = 400;

export function Crieur() {
  const attente = useAnnonces((a) => a.attente);
  const annonce = useAnnonces((a) => a.annonce);
  const precedente = useRef(annonce);

  useEffect(() => {
    // Une annonce vient de finir : la suivante n'attend qu'un instant.
    const suite = precedente.current !== null && annonce === null;
    precedente.current = annonce;
    if (annonce || attente.length === 0) return;
    let vivant = true;
    let timer = 0;
    const essai = () => {
      if (!vivant) return;
      if (!libre()) {
        timer = window.setTimeout(essai, PATIENCE_MS);
        return;
      }
      import("./index").then(
        (vitrine) => {
          Carton = vitrine.Annonce;
          // La place a pu se prendre pendant le chargement : on repasse plus tard.
          if (vivant && !annoncer(libre())) timer = window.setTimeout(essai, PATIENCE_MS);
        },
        // Pas de réseau pour le dessin : on n'annonce pas, la pastille du Domaine le dira.
        () => oublierAnnonces(),
      );
    };
    timer = window.setTimeout(essai, suite ? ENTRE_DEUX_MS : APRES_LE_GESTE_MS);
    return () => {
      vivant = false;
      window.clearTimeout(timer);
    };
  }, [attente, annonce]);

  if (!annonce || !Carton) return null;
  return (
    <Carton
      key={annonce.join()}
      medailles={annonce}
      onFin={(ouvrir) => {
        finAnnonce();
        if (!ouvrir) return;
        // Quitter un ticket en cours, c'est le laisser dans la pile : la vitrine prend sa place.
        if (nav.current().name === "grattage") nav.replace({ name: "trophees" });
        else nav.push({ name: "trophees" });
      }}
    />
  );
}
