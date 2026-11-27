// Anglais — les écrans de la suite de l'histoire : le geste du Patron, la vignette d'un
// ticket semé, les lettres des protégés, le Carnet, la vraie fin, le premier ticket sous cloche,
// les Souvenirs et l'album d'une histoire.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Ce dictionnaire-ci ne pèse pas sur le démarrage : il n'est chargé qu'avec ces écrans,
// qui passent par le `t()` de `./mots` (LOT4.md, section 11). Ce que les écrans du
// démarrage affichent (le Domaine, les Réglages, les refus du magasin d'état) est dans
// `src/i18n/en/suite.ts`.
// « Semer » se dit « to drop », comme partout dans le jeu ; le Carnet du Patron, « the Boss's Notebook ».

export const EN_ECRANS: Record<string, string> = {
  // --- Le geste du Patron, sur la fiche d'un ticket (src/screens/semis/Semer.tsx)
  "Laisser tomber pour un nouveau venu": "Drop some for a newcomer",
  "Tu l'offres à qui débarque sans rien. Il ne te rapporte que des nouvelles.":
    "A gift for whoever steps ashore with nothing. All it brings you is news.",
  "Laisser tomber 1 ticket pour {prix}": "Drop 1 ticket for {prix}",
  "Laisser tomber {n} tickets pour {prix}": "Drop {n} tickets for {prix}",

  // --- La vignette : qui trouve le ticket, puis les nouvelles d'un protégé (src/screens/semis/Vignette.tsx)
  "Ticket semé n° {n}": "Dropped ticket no. {n}",
  "Tickets semés n° {a} à {b}": "Dropped tickets no. {a} to {b}",
  "{prenom} et les autres": "{prenom} and the others",
  "Un protégé t'écrit": "A protégé has written",
  "Encore une lettre": "Another letter",
  "Des nouvelles de {prenom}": "News from {prenom}",
  "À relire dans le Carnet du Patron, sur ton Domaine.": "Yours to reread in the Boss's Notebook, on your Estate.",

  // --- Le Carnet du Patron (src/screens/semis/Carnet.tsx)
  "Le Carnet du Patron": "The Boss's Notebook",
  "Tickets semés": "Tickets dropped",
  "Leur valeur": "Their value",
  "Pour semer : au comptoir d'un lieu, ouvre les règles et lots d'un ticket.":
    "To drop one: at any counter, open a ticket's rules and prizes.",
  "Tes protégés": "Your protégés",
  "Le premier t'écrira dès ton premier ticket semé.": "The first will write as soon as you drop your first ticket.",
  "Prochaine lettre à {n} tickets semés.": "Next letter at {n} tickets dropped.",
  "Ils ont tous écrit. Le premier d'entre eux sème à son tour.": "They have all written. The very first now drops tickets too.",

  // --- Le premier ticket sous cloche, sur le Domaine d'une Légende (src/screens/domaine/Cloche.tsx)
  "Ton tout premier ticket, sous cloche": "Your very first ticket, under glass",
  "Ton tout premier ticket : celui du quai. Gratté jusqu'au carton.":
    "Your very first ticket: the one from the quay. Scratched down to the card.",

  // --- La vraie fin, « Huit as de cœur » (src/screens/moments/VraieFin.tsx)
  "La vraie fin · Un beau matin": "The true ending · One fine morning",
  "Les huit cartes de la tablée": "The table's eight cards",
  "La carte de {hote}, face cachée. La retourner": "{hote}'s card, face down. Turn it over",
  "La carte de {hote} : as de cœur": "{hote}'s card: ace of hearts",
  // Les boutons, plan par plan (src/app/suite/vraie-fin.ts) : 26 caractères au plus.
  "S'approcher": "Come closer",
  "S'asseoir": "Sit down",
  "Regarder la table": "Look at the table",
  "Retourner une carte": "Turn a card over",
  "Regarder Piou": "Look at Piou",
  "Écouter Piou": "Listen to Piou",
  "Et alors ?": "And then?",
  "Et la chance ?": "And the luck?",
  "Et les huit défis ?": "And the eight challenges?",
  "Et Piou, dans tout ça ?": "And what about Piou?",
  "Promis": "Promise",
  "Lever les yeux": "Look up",
  "Retourner au Domaine": "Back to the Estate",

  // --- Les Souvenirs : la liste (src/screens/souvenirs/Souvenirs.tsx)
  "Ce que tu as vécu à Grattouille, et ce que les maîtres des lieux veulent bien te raconter.":
    "What you have lived through in Grattouille, and what the hosts are willing to tell you.",
  "Les fins de l'histoire": "The endings",
  "Huit as de cœur": "Eight aces of hearts",
  "Le jour où Gaspard t'a remis les clés.": "The day Gaspard handed you the keys.",
  "Le matin où ils t'attendaient tous sur le quai.": "The morning they were all waiting for you on the quay.",
  "L'histoire a une fin. Elle n'est pas pour tout de suite.": "The story has an ending. Not for a while yet.",
  "Il paraît que l'histoire a une autre fin.": "They say the story has another ending.",
  "Revoir": "Watch again",
  "Revoir : {titre}": "Watch again: {titre}",
  "Écouter": "Listen",
  "Nouveau": "New",
  "Un mot de plus": "One more word",
  "Les histoires des hôtes": "The hosts' stories",
  "Remporte les trois manches du défi d'un maître des lieux, au poker : il te racontera son histoire.":
    "Win all three rounds of a host's poker challenge and they will tell you their story.",
  "{lieu} · « {titre} »": "{lieu} · “{titre}”",
  "Revoir l'histoire de {nom} : {titre}": "Watch {nom}'s story again: {titre}",
  "Écouter l'histoire de {nom} : {titre}": "Listen to {nom}'s story: {titre}",
  "Tu ne connais pas encore son hôte.": "You haven't met its host yet.",
  "{n} sur {max}": "{n} out of {max}",
  // Une manche du défi se dit « a round ».
  "Son défi au poker : trois manches à remporter.": "The poker challenge: three rounds to win.",
  "Manche {n} sur {max} remportée. Encore deux, et il te raconte son histoire.":
    "Round {n} of {max} won. Two more and he'll tell you his story.",
  "Manche {n} sur {max} remportée. Encore deux, et elle te raconte son histoire.":
    "Round {n} of {max} won. Two more and she'll tell you her story.",
  "Manche {n} sur {max} remportée. Encore une, et il te raconte son histoire.":
    "Round {n} of {max} won. One more and he'll tell you his story.",
  "Manche {n} sur {max} remportée. Encore une, et elle te raconte son histoire.":
    "Round {n} of {max} won. One more and she'll tell you her story.",
  "Maintenant que tu sais, chacun a ajouté un mot à son histoire.":
    "Now that you know, each of them has added a word to their story.",
  "Revoir un souvenir ne change rien à ton compte.": "Watching a memory again changes nothing in your account.",

  // --- L'histoire d'un hôte, son album (src/screens/souvenirs/Histoire.tsx). Les répliques, les légendes
  //     et les boutons des pages ont leurs deux versions dans src/app/suite/histoires.ts.
  "L'histoire de {nom}": "{nom}'s story",
  "Page {n} sur {max}": "Page {n} of {max}",
  "Maintenant que tu sais": "Now that you know",
};
