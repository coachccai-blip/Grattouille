// Anglais — la suite de l'histoire, pour ce que les écrans du démarrage en affichent : les
// refus du magasin d'état, les entrées du Domaine, le rayon des Souvenirs dans la section Trophées.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Ce fichier est chargé au démarrage : il reste court. Les phrases des écrans chargés à la
// demande (le geste du Patron, la vignette, le Carnet, la vraie fin, les Souvenirs) sont traduites dans
// `src/app/suite/en.ts`, qui voyage avec eux. Les répliques des personnages ont leurs deux
// versions côte à côte dans `src/app/dialogues.ts` et `src/app/suite/`.

export const EN_SUITE: Record<string, string> = {
  // --- Semer des tickets : refus (src/app/store.ts)
  "Seul le Patron du Kiosque laisse tomber des tickets pour les nouveaux venus.":
    "Only the Boss of the Kiosk drops tickets for the newcomers.",
  "Hors connexion. Les tickets à semer attendront.": "You're offline. The tickets to drop will have to wait.",
  "Il te manque {montant} pour semer ça.": "You're {montant} short to drop those.",

  // --- L'Agence Carpe Diem : refus (src/app/store.ts)
  "Tu as déjà vécu cette expérience.": "You've already lived that one.",
  "Hors connexion. Les voyages attendront.": "You're offline. The trips will have to wait.",
  "Il te manque {montant} pour vivre ça.": "You're {montant} short to live that.",

  // --- Le Domaine du Patron : le Carnet, et ce que Piou indique (src/screens/domaine/Domaine.tsx)
  "Carnet": "Notebook",
  "Ouvrir le Carnet du Patron": "Open the Boss's Notebook",
  "Aller au Poker Tricheur": "Go to Cheater's Poker",

  // --- Le Domaine : un hôte a une histoire à raconter (src/screens/domaine/Domaine.tsx)
  "Ouvrir mes Souvenirs": "Open my Memories",

  // --- Le générique revu depuis les Souvenirs (Moments.tsx)
  "Refermer le souvenir": "Close the memory",
};
