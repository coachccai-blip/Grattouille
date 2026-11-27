// Anglais — ce que le reste du jeu dit du Poker Tricheur AVANT qu'on en pousse la porte :
// sa carte sur la Promenade, et les refus du serveur traduits par le magasin d'état.
// Le dictionnaire complet (`poker.ts`, plus de trois cents phrases) n'arrive qu'avec les
// écrans du poker, chargés à la demande : il ne pèse pas sur le premier chargement.
// Ces phrases sont recopiées de `poker.ts` ; un test vérifie qu'elles lui restent identiques.

export const EN_POKER_SEUIL: Record<string, string> = {
  "Le Poker Tricheur": "Cheater's Poker",
  "Le sport national de Grattouille": "Grattouille's national sport",
  "Le Poker Tricheur, le sport national de Grattouille": "Cheater's Poker, Grattouille's national sport",
  "Triche, bluffe, accuse.": "Cheat, bluff, accuse.",
  "Ta place t'attend à table.": "Your seat is waiting at the table.",
  "Cette table n'existe pas, ou elle a fermé. Vérifie le code.":
    "This table doesn't exist, or it has closed. Check the code.",
  "Cette table est complète. Attends qu'un siège se libère.": "This table is full. Wait for a seat to free up.",
  "Cette partie est déjà lancée : on n'y entre plus.": "This game has already started: nobody else can join.",
  "Tu as déjà une place à une table. Quitte-la avant d'en rejoindre une autre.":
    "You already have a seat at a table. Leave it before joining another.",
  "Tu n'as plus de place à cette table.": "You no longer have a seat at this table.",
  "Ta bourse ne suffit pas pour cette cave.": "Your purse won't stretch to this buy-in.",
  "Ce n'est pas ton tour. Attends que la parole te revienne.":
    "It isn't your turn. Wait for the action to come back to you.",
  "Ce geste n'est plus possible : la table a déjà tourné.":
    "That move is no longer possible: the table has moved on.",
  "Cette blinde est trop haute pour ta bourse : il en faut quarante pour créer la table.":
    "This blind is too high for your purse: you need forty of them to create the table.",
  "La Table des Maîtres n'ouvre qu'à qui a relevé les huit défis.":
    "The Masters' Table only opens to whoever has beaten all eight challenges.",
};
