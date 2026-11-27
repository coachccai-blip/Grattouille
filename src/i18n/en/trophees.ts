// Anglais — les trophées : l'entrée du Domaine, l'écran, l'annonce d'une médaille.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Ce dictionnaire est chargé au démarrage : il ne porte que les quelques mots de
// l'interface. Les noms des douze objets et des 38 médailles, et leurs phrases, ont leurs
// deux versions côte à côte dans src/screens/trophees/textes.ts, chargé avec la vitrine.

export const EN_TROPHEES: Record<string, string> = {
  // --- L'entrée, sur le Domaine
  "Trophées : {n} sur {total}": "Trophies: {n} of {total}",
  "Trophées : {n} sur {total}, {neuves} à découvrir": "Trophies: {n} of {total}, {neuves} to discover",
  "{n} nouvelles": "{n} new",
  "1 nouvelle": "1 new",

  // --- La vitrine
  "Trophées": "Trophies",
  "Médailles gagnées": "Medals earned",
  "Médailles gagnées : {n} sur {total}": "Medals earned: {n} of {total}",
  "{n} nouvelles médailles à admirer": "{n} new medals to admire",
  "1 nouvelle médaille à admirer": "1 new medal to admire",
  "Médailles": "Medals",
  "Médailles à découvrir": "Medals yet to be discovered",
  "{nom}, gagnée : {condition}": "{nom}, earned: {condition}",
  "{nom}, à gagner : {condition}": "{nom}, yet to earn: {condition}",
  "gagnée": "earned",
  "à gagner": "to earn",
  "nouvelle !": "new!",
  "{valeur} sur {palier}": "{valeur} of {palier}",

  // --- L'annonce d'une médaille
  "Nouvelle médaille": "New medal",
  "Nouvelle médaille : {nom}. Voir les trophées": "New medal: {nom}. See the trophies",
  "D'un seul coup": "All at once",
  "{n} nouvelles médailles": "{n} new medals",
  "{n} nouvelles médailles. Voir les trophées": "{n} new medals. See the trophies",
};
