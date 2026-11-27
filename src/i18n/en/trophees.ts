// Anglais — les trophées : l'entrée du Domaine.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Ce dictionnaire est chargé au démarrage : il ne porte que les phrases de la plaque posée
// sur le Domaine et du sélecteur des trois rayons (médailles, souvenirs, album), qui coiffe
// trois écrans chargés chacun à la demande. L'anglais de la vitrine et de l'annonce (`EN_VITRINE`), les noms des
// objets et des médailles et leurs phrases sont dans src/screens/trophees/textes.ts, chargé
// à la demande : ils rejoignent les dictionnaires du jeu quand ce morceau arrive.

export const EN_TROPHEES: Record<string, string> = {
  "Trophées : {n} sur {total}": "Trophies: {n} of {total}",
  "Trophées : {n} sur {total}, {neuves} à découvrir": "Trophies: {n} of {total}, {neuves} to discover",
  "{n} nouvelles": "{n} new",
  "1 nouvelle": "1 new",
  // Le sélecteur des trois rayons de la section (src/ui/Rayons.tsx).
  "Trophées": "Trophies",
  "Médailles, souvenirs ou album": "Medals, memories or album",
  "Médailles": "Medals",
  "Souvenirs": "Memories",
  "Souvenirs : {n} à écouter": "Memories: {n} to hear",
  // Le mot est le même dans les deux langues : il est ici pour que rien ne manque au relevé.
  "Album": "Album",
};
