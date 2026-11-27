// Le crieur : quand une médaille vient d'être gagnée (la file est tenue par
// src/app/trophees.ts), il va chercher de quoi l'annoncer. Chargé au démarrage, il ne pèse
// presque rien : le tour de parole (Annonces.tsx), le carton, son dessin et le nom de la
// médaille n'arrivent qu'à la première annonce, avec le morceau de la vitrine.

import { useEffect, useState, type ComponentType } from "react";
import { oublierAnnonces, useAnnonces } from "../../app/trophees";

/** Celui qui annonce pour de bon, une fois son morceau du jeu chargé. */
let Annonces: ComponentType | null = null;

export function Crieur() {
  const aDire = useAnnonces((a) => a.annonce !== null || a.attente.length > 0);
  const [, charge] = useState(0);

  useEffect(() => {
    if (!aDire || Annonces) return;
    let vivant = true;
    import("./index").then(
      (vitrine) => {
        Annonces = vitrine.Annonces;
        if (vivant) charge((n) => n + 1);
      },
      // Pas de réseau pour le dessin : on n'annonce pas, la pastille du Domaine le dira.
      () => oublierAnnonces(),
    );
    return () => {
      vivant = false;
    };
  }, [aDire]);

  return aDire && Annonces ? <Annonces /> : null;
}
