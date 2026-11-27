// Anglais — Promenade, comptoir, pile à gratter, grattage, composants communs, messages.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Anglais britannique, simple, chaleureux. Les mots du jeu sont ceux des autres
// dictionnaires : « name » pour le pseudo, « purse » pour la bourse, « counter » pour le
// comptoir, « leaderboard » pour le classement, « Estate » pour le Domaine. Un bouton qui
// tient sur une ligne en français tient sur une ligne en anglais.

export const EN_JEU: Record<string, string> = {
  // --- Coquille : bac à sable, chargement, pannes, téléphone couché
  "Bac à sable : rien n'est enregistré.": "Sandbox: nothing is saved.",
  "Chargement de Grattouille": "Loading Grattouille",
  "Pas de réponse du kiosque.": "No answer from the kiosk.",
  "Vérifie ta connexion. Ta fortune et tes tickets t'attendent bien au chaud.":
    "Check your connection. Your fortune and your tickets are waiting, safe and warm.",
  "Le kiosque ne répond pas.": "The kiosk isn't answering.",
  "Laisse-lui un instant. Ta fortune et tes tickets t'attendent bien au chaud.":
    "Give it a moment. Your fortune and your tickets are waiting, safe and warm.",
  "Le kiosque n'est pas encore ouvert.": "The kiosk isn't open yet.",
  "Cette page a été publiée sans son serveur de jeu. Tu peux jouer quand même : rien ne sera enregistré.":
    "This page went online without its game server. You can play anyway: nothing will be saved.",
  "Réessayer": "Try again",
  "Jouer dans le bac à sable": "Play in the sandbox",
  "Tourne ton téléphone.": "Turn your phone upright.",
  "Grattouille a fait peau neuve. Recharge la page pour continuer : rien n'est perdu.":
    "Grattouille has had a fresh coat of paint. Reload the page to carry on: nothing is lost.",
  "Hors connexion. Cet écran attendra le retour du réseau.": "You're offline. This screen will wait for the network.",

  // --- Onglets, en-tête, bourse, feuille, bulle
  "Navigation principale": "Main navigation",
  "Domaine": "Estate",
  "Jouer": "Play",
  "Boutiques": "Shops",
  "Classement": "Leaderboard",
  ", {n} à gratter": ", {n} to scratch",
  "Retour": "Back",
  "Fermer": "Close",
  "Solde : {montant}": "Balance: {montant}",
  "Standing : {n} étoiles": "Standing: {n} stars",
  "étoiles": "stars",
  "« {replique} »": "“{replique}”",
  "tempérament : {nom}": "temperament: {nom}",

  // --- Le ticket trouvé par terre
  "Un ticket par terre !": "A ticket on the ground!",
  "Ramasse-le.": "Pick it up.",
  "Ramasser le ticket": "Pick up the ticket",
  "Rien par terre pour l'instant. Regarde encore dans un instant.": "Nothing on the ground just now. Look again in a moment.",
  "Hors connexion. Tu peux gratter tes tickets en attente, pas en ramasser.":
    "You're offline. You can scratch the tickets you have, but not pick up new ones.",

  // --- Promenade
  "La Promenade": "The Promenade",
  "Tickets de {min} à {max}": "Tickets from {min} to {max}",
  "Encore {n} ★": "{n} ★ to go",
  "Ouvre à ★ {n}": "Opens at ★ {n}",
  "{lieu}, ouvert, tickets de {min} à {max}": "{lieu}, open, tickets from {min} to {max}",
  "{lieu}, fermé : encore {n} étoiles": "{lieu}, closed: {n} stars to go",
  "{lieu}, fermé : ouvre à {n} étoiles": "{lieu}, closed: opens at {n} stars",
  "{lieu} ouvre à ★ {seuil}. Il te manque {manque} ★ : passe chez Sidonie.":
    "{lieu} opens at ★ {seuil}. You're {manque} ★ short: pop in to Sidonie's.",

  // --- Comptoir
  "Les tickets du lieu": "Tickets sold here",
  "{ticket}, {prix}, jusqu'à {max}": "{ticket}, {prix}, up to {max}",
  "règles et lots": "rules and prizes",
  "Ce lieu est encore fermé.": "This place is still closed.",
  "Acheter {prix}": "Buy {prix}",
  "{n} pour {prix}": "{n} for {prix}",
  "Carnet de {n} tickets pour {prix}": "Booklet of {n} tickets for {prix}",
  "1 ticket à gratter": "1 ticket to scratch",
  "{n} tickets à gratter": "{n} tickets to scratch",

  // --- Fiche d'un ticket
  "Règles et lots : {ticket}": "Rules and prizes: {ticket}",
  "Un ticket sur {n} gagne. Chaque euro misé en rapporte {retour} en moyenne.":
    "One ticket in {n} wins. On average, every euro staked pays back {retour}.",
  "Lots et chances réelles": "Prizes and real odds",
  "Gain": "Prize",
  "Chance": "Odds",
  "Perdu": "No win",
  "1 sur {n}": "1 in {n}",
  "jamais": "never",
  "Ton signe ne change pas tes chances. Il change la tête du ticket.":
    "Your sign doesn't change your odds. It changes the look of the ticket.",
  "Ton arcane ne change pas tes chances. Il change la tête du ticket.":
    "Your card doesn't change your odds. It changes the look of the ticket.",
  "Ton camp ne change pas tes chances. Il change ton cœur.": "Your side doesn't change your odds. It changes your heart.",

  // --- À gratter
  "À gratter": "To scratch",
  "Gratter {ticket}, {prix}": "Scratch {ticket}, {prix}",
  "Gratter {ticket}, trouvé par terre": "Scratch {ticket}, found on the ground",
  "Trouvé par terre": "Found on the ground",
  "Gratter le suivant": "Scratch the next one",
  "Gratter": "Scratch",
  "Tout gratter en rafale": "Auto-scratch them all",
  "Aller jouer": "Go and play",

  // --- Grattage : le choix, le geste, la rafale
  "Choisis ton signe": "Pick your sign",
  "Choisis ton arcane": "Pick your card",
  "Choisis ton camp": "Pick your side",
  "Ton signe": "Your sign",
  "Ton arcane": "Your card",
  "Ton camp": "Your side",
  "ou": "or",
  "Ticket {n} sur {total}": "Ticket {n} of {total}",
  "Tout gratter": "Scratch all",
  "Gratter en rafale": "Auto-scratch",
  "Total": "Total",
  "Touche l'écran pour mettre en pause": "Tap the screen to pause",

  // --- Grattage : le résultat, dit une fois
  "Rien cette fois.": "Nothing this time.",
  "Remboursé.": "Money back.",
  "Gagné": "You win",
  "Joli coup": "Nice one",
  "Gros gain": "Big win",
  "Énorme": "Huge",
  "Jackpot": "Jackpot",
  "Gagné : {montant}.": "You win {montant}.",
  "Joli coup : {montant}.": "Nice one: {montant}.",
  "Gros gain : {montant}.": "Big win: {montant}.",
  "Énorme : {montant}.": "Huge: {montant}.",
  "Jackpot : {montant}.": "Jackpot: {montant}.",
  "Touche l'écran pour continuer": "Tap the screen to continue",
  "{n} tickets : aucun gagnant": "{n} tickets: no winners",
  "{n} tickets : 1 gagnant": "{n} tickets: 1 winner",
  "{n} tickets : {gagnants} gagnants": "{n} tickets: {gagnants} winners",

  // --- Grattage : la suite
  "Racheter le même {prix}": "Same again {prix}",
  "Changer de ticket": "Pick another ticket",
  "Retour au comptoir": "Back to the counter",
  "Continuer": "Continue",
  "Ticket suivant": "Next ticket",

  // --- Ce qui empêche un achat
  "Hors connexion. Tu peux gratter tes tickets en attente, pas en acheter.":
    "You're offline. You can scratch the tickets you have, but not buy new ones.",
  "Hors connexion. Les boutiques rouvrent dès que le réseau revient.":
    "You're offline. The shops reopen as soon as the network is back.",
  "Gratte d'abord tes tickets en attente.": "Scratch the tickets you have first.",
  "Il te manque {montant}.": "You're {montant} short.",
  "Il te manque {montant} pour ce carnet. À l'unité, ça passe.":
    "You're {montant} short for this booklet. A single ticket will do.",
  "Il te manque {montant}. {ticket} est à {prix}.": "You're {montant} short. {ticket} costs {prix}.",
  "Il te manque {montant}. Gratte d'abord tes tickets en attente.":
    "You're {montant} short. Scratch the tickets you have first.",
  "Il te manque {montant}. Regarde par terre : un ticket ne va pas tarder.":
    "You're {montant} short. Keep an eye on the ground: a ticket will turn up soon.",
  "Connexion coupée pendant l'achat. Si le ticket a été vendu, il t'attend dans À gratter.":
    "The connection dropped during the purchase. If the ticket was sold, it's waiting in To scratch.",
  "Connexion coupée pendant l'achat. Regarde ta collection : s'il a été vendu, il y est.":
    "The connection dropped during the purchase. Check your collection: if it was sold, it's there.",
  "Ton compte est supprimé. Il ne reste rien sur cet appareil.": "Your account is deleted. Nothing is left on this device.",

  // --- Les réponses du serveur, choisies par leur code
  "Pas de réponse du kiosque. Vérifie ta connexion, puis réessaie.":
    "No answer from the kiosk. Check your connection, then try again.",
  "Le kiosque ne répond pas. Réessaie dans un instant.": "The kiosk isn't answering. Try again in a moment.",
  "Deux demandes en même temps. Réessaie dans un instant.": "Two requests at once. Try again in a moment.",
  "Ce compte n'est plus reconnu. Retrouve-le avec ton pseudo et ton code.":
    "This account is no longer recognised. Get it back with your name and your code.",
  "Cette demande est illisible. Recharge la page et réessaie.": "That request was unreadable. Reload the page and try again.",
  "Ce pseudo ne convient pas. Il faut 3 à 16 caractères : lettres, chiffres, espace ou tiret.":
    "That name won't do. It takes 3 to 16 characters: letters, digits, spaces or hyphens.",
  "Ce lieu est encore fermé. Il te faut plus de Standing.": "This place is still closed. You need more Standing.",
  "Le Kiosque n'est à vendre qu'une fois ta collection complète.":
    "The Kiosk only goes on sale once your collection is complete.",
  "Cette adresse n'existe pas.": "That address doesn't exist.",
  "Ce pseudo est pris. Essaie avec un autre.": "That name is taken. Try another one.",
  "Il te manque de l'argent pour cet achat.": "You don't have enough money for this.",
  "Tu possèdes déjà ce bien.": "You already own this.",
  "Rien ne traîne par terre pour l'instant.": "There's nothing on the ground just now.",
  "{hote} n'a que deux pattes. Réessaie dans un instant.": "{hote} only has two paws. Try again in a moment.",
  "{n} tickets aujourd'hui : le guichet rouvre demain.": "{n} tickets today: the counter reopens tomorrow.",
  "Tu ne possèdes pas cet article.": "You don't own that item.",
};
