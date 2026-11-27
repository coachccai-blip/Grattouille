// Anglais — les trophées : l'entrée du Domaine.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Ce dictionnaire est chargé au démarrage : il ne porte que les phrases de la plaque posée
// sur le Domaine et du sélecteur des deux rayons (médailles, souvenirs), qui coiffe deux
// écrans chargés chacun à la demande. L'anglais de la vitrine et de l'annonce (`EN_VITRINE`), les noms des
// objets et des médailles et leurs phrases sont dans src/screens/trophees/textes.ts, chargé
// à la demande : ils rejoignent les dictionnaires du jeu quand ce morceau arrive.

export const EN_TROPHEES: Record<string, string> = {
  "Trophées : {n} sur {total}": "Trophies: {n} of {total}",
  "Trophées : {n} sur {total}, {neuves} à découvrir": "Trophies: {n} of {total}, {neuves} to discover",
  "{n} nouvelles": "{n} new",
  "1 nouvelle": "1 new",
  // Le sélecteur des deux rayons de la section (src/ui/Rayons.tsx).
  "Trophées": "Trophies",
  "Médailles ou souvenirs": "Medals or memories",
  "Médailles": "Medals",
  "Souvenirs": "Memories",
  "Souvenirs : {n} à écouter": "Memories: {n} to hear",
};
