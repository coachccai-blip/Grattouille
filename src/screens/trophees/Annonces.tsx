// Le tour de parole des médailles : ce qui fait passer à l'écran, une à une, celles qui ont
// été gagnées pendant la session (la file est tenue par src/app/trophees.ts). Ce module arrive
// avec la première annonce, appelé par le crieur (Crieur.tsx).
//
// Une annonce attend son tour : jamais par-dessus un grand moment (accueil, ouverture d'un
// lieu, générique, vraie fin), ni pendant qu'un ticket montre son résultat ou qu'un carnet
// se gratte en rafale ; et toujours un instant après le geste qui l'a value, pour laisser la
// caisse et les étoiles finir de sonner. Son carton prend la place de la barre d'en-tête :
// sur une page qui a défilé (la barre n'est plus là, c'est du texte qu'il recouvrirait),
// elle attend l'écran suivant. Si un grand moment commence pendant qu'elle est à l'écran,
// elle lui laisse la place.

import { useEffect, useRef } from "react";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { useAnnonces } from "../../app/trophees";
import { Annonce } from "./Annonce";
import { annoncer, finAnnonce, peutAnnoncer, remettreAnnonce } from "./file";

/**
 * Ce qui prend tout l'écran : un grand moment du récit, la fête d'un très gros lot, et tout
 * plein écran qui se signale par `data-plein-ecran` (une animation venue d'un autre écran).
 */
const PLEIN_ECRAN = ".moment, .fete, [data-plein-ecran]";
/** Ce pendant quoi une annonce n'arrive pas : cela, un résultat qui s'affiche, un carnet gratté en rafale. */
const OCCUPE = `${PLEIN_ECRAN}, .grattage__plateau--resultat, .grattage--rafale`;

/** Vrai si rien de ce que `quoi` désigne n'occupe l'écran, et que le joueur est bien là pour voir. */
function libre(quoi: string): boolean {
  return peutAnnoncer(useGame.getState())
    && document.visibilityState === "visible"
    && nav.current().name !== "trophees"
    && document.querySelector(quoi) === null;
}

/**
 * Le carton a sa place : la barre d'en-tête de l'écran est là, à découvert, ou une feuille
 * couvre l'écran (ce qui est dessous ne se lit plus, et le haut d'une feuille n'est que sa
 * poignée). Sur une page qui a défilé, la barre n'est plus là. Et là où le carton se
 * poserait, ce qui est au-dessus doit être un écran du jeu ou une feuille : sous un plein
 * écran venu d'ailleurs, quel qu'il soit, la barre est couverte, et l'annonce attend.
 */
function enTeteLibre(): boolean {
  const barre = document.querySelector(".jeu__fond > .ecran .entete__barre")?.getBoundingClientRect();
  const enPlace = !barre || barre.top >= 0;
  if (!enPlace && !document.querySelector(".feuille")) return false;
  const dessus = document.elementFromPoint(window.innerWidth / 2, barre && enPlace ? barre.top + barre.height / 2 : 40);
  return !dessus || dessus.closest(".jeu__fond") !== null;
}

/** Ce qu'une annonce attend après le geste qui l'a value, puis entre deux annonces, puis quand la place est prise. */
const APRES_LE_GESTE_MS = 1000;
const ENTRE_DEUX_MS = 450;
const PATIENCE_MS = 400;
/** En deçà, une annonce interrompue n'a pas été lue : elle repassera. */
const LUE_MS = 2000;

export function Annonces() {
  const attente = useAnnonces((a) => a.attente);
  const annonce = useAnnonces((a) => a.annonce);
  const precedente = useRef(annonce);

  // La file : faire passer l'annonce suivante quand la place est libre.
  useEffect(() => {
    // Une annonce vient de finir : la suivante n'attend qu'un instant.
    const suite = precedente.current !== null && annonce === null;
    precedente.current = annonce;
    if (annonce || attente.length === 0) return;
    let timer = 0;
    const essai = () => {
      if (!annoncer(libre(OCCUPE) && enTeteLibre())) timer = window.setTimeout(essai, PATIENCE_MS);
    };
    timer = window.setTimeout(essai, suite ? ENTRE_DEUX_MS : APRES_LE_GESTE_MS);
    return () => window.clearTimeout(timer);
  }, [attente, annonce]);

  // L'annonce à l'écran : si un grand moment commence, elle lui laisse la place.
  useEffect(() => {
    if (!annonce) return;
    const depuis = Date.now();
    const veille = window.setInterval(() => {
      if (libre(PLEIN_ECRAN)) return;
      if (Date.now() - depuis < LUE_MS) remettreAnnonce();
      else finAnnonce();
    }, 120);
    return () => window.clearInterval(veille);
  }, [annonce]);

  if (!annonce) return null;
  return (
    <Annonce
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
