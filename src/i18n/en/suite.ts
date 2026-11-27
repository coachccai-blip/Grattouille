// Anglais — la suite de l'histoire, pour ce que les écrans du démarrage en affichent : les
// refus du magasin d'état, les entrées du Domaine, les Souvenirs des Réglages.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Ce fichier est chargé au démarrage : il reste court. Les phrases des écrans chargés à la
// demande (le geste du Patron, la vignette, le Carnet, la vraie fin) sont traduites dans
// `src/app/suite/en.ts`, qui voyage avec eux. Les répliques des personnages ont leurs deux
// versions côte à côte dans `src/app/dialogues.ts` et `src/app/suite/`.

export const EN_SUITE: Record<string, string> = {
  // --- Semer des tickets : refus (src/app/store.ts)
  "Seul le Patron du Kiosque laisse tomber des tickets pour les nouveaux venus.":
    "Only the Boss of the Kiosk drops tickets for the newcomers.",
  "Hors connexion. Les tickets à semer attendront.": "You're offline. The tickets to drop will have to wait.",
  "Il te manque {montant} pour semer ça.": "You're {montant} short to drop those.",

  // --- Le Domaine du Patron : le Carnet, et ce que Piou indique (src/screens/domaine/Domaine.tsx)
  "Carnet": "Notebook",
  "Ouvrir le Carnet du Patron": "Open the Boss's Notebook",
  "Aller au Poker Tricheur": "Go to Cheater's Poker",

  // --- Réglages : les souvenirs (src/screens/reglages/Reglages.tsx), et le générique revu (Moments.tsx)
  "Souvenirs": "Memories",
  "Les fins de l'histoire que tu as vues. Les revoir ne change rien à ton compte.":
    "The endings of the story you have seen. Watching them again changes nothing in your account.",
  "Le Kiosque est à toi": "The Kiosk is yours",
  "Huit as de cœur": "Eight aces of hearts",
  "Revoir : {titre}": "Watch again: {titre}",
  "Il paraît que l'histoire a une autre fin.": "They say the story has another ending.",
  "Refermer le souvenir": "Close the memory",
};
