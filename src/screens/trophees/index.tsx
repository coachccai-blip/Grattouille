// La vitrine des trophées : la porte d'entrée de son morceau du jeu, chargé à la demande.
// L'écran est monté par App.tsx ; les annonces de médailles, par le crieur (Crieur.tsx).
// Ce qui reste chargé au démarrage tient en trois petits fichiers : le crieur, l'entrée
// du Domaine (Entree.tsx) et la file des annonces (src/app/trophees.ts).

export { Annonces } from "./Annonces";
export { Trophees as default } from "./Trophees";
