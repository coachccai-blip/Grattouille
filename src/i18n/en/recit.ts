// Anglais — Bienvenue, grands moments, Domaine.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Les répliques des personnages (Piou, Gaspard et les autres) ne sont pas ici : elles
// ont leurs deux versions côte à côte dans `src/app/dialogues.ts`.

export const EN_RECIT: Record<string, string> = {
  // --- Bienvenue : l'affiche
  "Langue": "Language",
  "Sans un sou, mais la chance scandaleusement de ton côté.":
    "Not a penny to your name, but luck scandalously on your side.",
  "Commencer": "Start",
  "J'ai déjà un compte": "I already have an account",

  // --- Bienvenue : qui débarque ?
  "Qui débarque au port ?": "Who's stepping ashore?",
  "Choisis ton espèce. Tu pourras en changer quand tu veux.": "Pick your species. You can change it whenever you like.",
  "Ton pseudo": "Your name",
  "3 à 16 caractères. C'est le nom que verra tout le classement.":
    "3 to 16 characters. It's the name the whole leaderboard will see.",
  "Débarquer": "Step ashore",
  "Retour": "Back",
  "Ce pseudo est réservé. Essaie avec un autre.": "That name is reserved. Try another one.",
  "Il faut 3 à 16 caractères : lettres, chiffres, espace ou tiret.":
    "It takes 3 to 16 characters: letters, digits, spaces or hyphens.",
  "Ce pseudo est pris. Essaie avec un autre.": "That name is taken. Try another one.",
  "Ce pseudo ne convient pas. Essaie avec un autre.": "That name won't do. Try another one.",

  // --- Bienvenue : retrouver son compte
  "Te revoilà au port !": "Back in port!",
  "Ton pseudo et ton code de récupération suffisent : ni adresse e-mail, ni mot de passe.":
    "Your name and recovery code are all it takes: no email address, no password.",
  "Ton code de récupération": "Your recovery code",
  "16 caractères, affichés dans Réglages, « Mon code de récupération ».":
    "16 characters, shown in Settings under “My recovery code”.",
  "Retrouver mon compte": "Get my account back",
  "Entre ton pseudo et ton code de 16 caractères, tel que tu l'as noté.":
    "Enter your name and your 16-character code, just as you wrote it down.",
  "Pseudo ou code incorrect.": "Wrong name or code.",

  // --- Grands moments : l'arrivée, les cartons de chapitre
  "Bienvenue à Grattouille-les-Bains": "Welcome to Grattouille-les-Bains",
  "Chapitre {n} · {moment}": "Chapter {n} · {moment}",
  "« {replique} »": "“{replique}”",
  "Ramasser le ticket": "Pick up the ticket",
  "Faire un tour d'abord": "Have a look around first",
  "Un nouveau lieu ouvre : {lieu}": "A new place opens: {lieu}",
  "Tickets de {min} à {max}": "Tickets from {min} to {max}",
  "Y aller": "Go there",
  "Plus tard": "Later",

  // --- Grands moments : le générique de fin
  "Générique de fin": "End credits",
  "Épilogue · Le lendemain matin": "Epilogue · The next morning",
  "Prendre les clés": "Take the keys",
  "Laisser tomber un ticket": "Drop a ticket",
  "Continuer à jouer": "Keep playing",

  // --- Domaine : la scène
  "Domaine": "Estate",
  "Réglages": "Settings",
  "Résidence : {nom}. En changer": "Residence: {nom}. Change it",
  "Pas encore de résidence : le banc du port. Voir les résidences à vendre":
    "No residence yet: the harbour bench. See the residences for sale",
  "Véhicule : {nom}. En changer": "Vehicle: {nom}. Change it",
  "À pied. Choisir un véhicule": "On foot. Choose a vehicle",
  "à pied": "on foot",
  "Trésors exposés : {liste}": "Treasures on display: {liste}",
  "Ouvrir le dressing": "Open the dressing room",
  "Un ticket traîne par terre. Le ramasser": "There's a ticket on the ground. Pick it up",
  "Fortune :": "Fortune:",
  "{moment} à Grattouille-les-Bains.": "{moment} in Grattouille-les-Bains.",

  // --- Domaine : les chemins que Piou indique
  "Aller chez {vendeur}": "Go to {vendeur}'s",
  "Aller au Kiosque": "Go to the Kiosk",
  "Aller aux boutiques": "Go to the shops",
  "Aller jouer": "Go and play",
  "Voir mon code": "See my code",
  "Voir le classement": "See the leaderboard",
  "Gratter mon ticket": "Scratch my ticket",
  "Gratter mes tickets": "Scratch my tickets",
};
