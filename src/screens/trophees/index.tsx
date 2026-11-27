// La vitrine des trophées : la porte d'entrée de son morceau du jeu, chargé à la demande.
// L'écran est monté par App.tsx ; l'annonce d'une médaille, par le crieur (Crieur.tsx).
// Ce qui reste chargé au démarrage tient en trois petits fichiers : le crieur, l'entrée
// du Domaine (Entree.tsx) et la file des annonces (src/app/trophees.ts).

export { Annonce } from "./Annonce";
export { Trophees as default } from "./Trophees";
