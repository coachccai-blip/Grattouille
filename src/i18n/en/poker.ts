// Anglais — le Poker Tricheur : hall, table, triche, accusation, règles, répliques d'interface.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Anglais britannique, simple, chaleureux. Les mots du jeu : « Cheater's Poker », « blind »,
// « buy-in » pour la cave, « stack » pour le tapis, « stake » pour la mise d'une main,
// « kitty » pour la cagnotte d'un hôte (« purse » est déjà la bourse du joueur), « lobby »
// pour le hall, « top up » pour recaver, « fair play » pour le franc jeu. Un joueur dont on
// ne connaît pas le genre est « they ». Un bouton qui tient sur une ligne en français tient
// sur une ligne en anglais.
//
// Les répliques des personnages ont leurs deux versions dans src/screens/poker/repliques.ts.
//
// La Table des Maîtres est « the Masters' Table » : un tournoi (« tournament ») où l'on est
// « knocked out » quand on n'a plus rien, et où « the last one seated takes it all ».

export const EN_POKER: Record<string, string> = {
  // --- La Promenade : la porte du poker
  "Le Poker Tricheur": "Cheater's Poker",
  "Le sport national de Grattouille": "Grattouille's national sport",
  "Le Poker Tricheur, le sport national de Grattouille": "Cheater's Poker, Grattouille's national sport",
  "Triche, bluffe, accuse.": "Cheat, bluff, accuse.",
  "Ta place t'attend à table.": "Your seat is waiting at the table.",

  // --- Les échecs du serveur (src/app/store.ts)
  "Cette table n'existe pas, ou elle a fermé. Vérifie le code.": "This table doesn't exist, or it has closed. Check the code.",
  "Cette table est complète. Attends qu'un siège se libère.": "This table is full. Wait for a seat to free up.",
  "Tu as déjà une place à une table. Quitte-la avant d'en rejoindre une autre.":
    "You already have a seat at a table. Leave it before joining another.",
  "Tu n'as plus de place à cette table.": "You no longer have a seat at this table.",
  "Ta bourse ne suffit pas pour cette cave.": "Your purse won't stretch to this buy-in.",
  "Ce n'est pas ton tour. Attends que la parole te revienne.": "It isn't your turn. Wait for the action to come back to you.",
  "Ce geste n'est plus possible : la table a déjà tourné.": "That move is no longer possible: the table has moved on.",
  "Cette blinde est trop haute pour ta bourse : il en faut quarante pour créer la table.":
    "This blind is too high for your purse: you need forty of them to create the table.",
  "Le geste n'est pas parti : pas de réseau. Réessaie.": "Your move didn't go through: no network. Try again.",

  // --- Le hall
  "Les règles, en cinq phrases": "The rules, in five sentences",
  "Hors connexion. Les tables rouvrent dès que le réseau revient.":
    "You're offline. The tables reopen as soon as the network is back.",
  "Le hall ouvre ses portes…": "The lobby is opening its doors…",
  "Ta table": "Your table",
  "Pour jouer ailleurs, quitte d'abord cette table.": "To play elsewhere, leave this table first.",
  "Reprendre ma place": "Back to my seat",
  "Les maîtres des lieux": "Your hosts",
  "Le défi": "The challenge",
  "Mise : {montant}": "Stake: {montant}",
  "Cagnotte : {montant}": "Kitty: {montant}",
  "Défi relevé": "Challenge won",
  "La table": "The table",
  "Blinde : {montant}": "Blind: {montant}",
  "Niveau {niveau}": "Level: {niveau}",
  "facile": "easy",
  "normal": "normal",
  "difficile": "hard",
  "Entre amis": "With friends",
  "Créer une table": "Create a table",
  "Rejoindre avec un code": "Join with a code",
  "Pour créer une table, il faut {montant} en bourse : quarante blindes.":
    "To create a table, you need {montant} in your purse: forty blinds.",
  "Défi : {hote}": "Challenge: {hote}",
  "Table {code}": "Table {code}",

  // --- Les règles
  "Les règles du Poker Tricheur": "The rules of Cheater's Poker",
  "Les règles": "The rules",
  "Chacun paie la blinde, puis reçoit cinq cartes.": "Everyone pays the blind, then gets five cards.",
  "En secret, tu peux remplacer une de tes cartes par celle de ton choix, ou jouer franc jeu.":
    "In secret, you may swap one of your cards for any card you like, or play fair.",
  "Un seul tour d'enchères, sans limite : parole, mise, relance, jusqu'à faire tapis, ou tu te couches.":
    "One round of betting, no limit: check, bet, raise, all the way to all in, or fold.",
  "À l'abattage, les mains se montrent et chacun peut accuser un joueur : un tricheur démasqué perd sa mise, et sa main ne compte plus.":
    "At the showdown, hands are shown and each player may accuse another: a cheat who is caught loses their stake, and their hand no longer counts.",
  "Accuser à tort coûte la mise de l'accusé, que tu lui verses ; puis la meilleure main encore en jeu prend le pot.":
    "A wrong accusation costs you the accused's stake, paid to them; then the best hand still standing takes the pot.",
  "Les mains, de la plus forte à la plus faible": "Hands, from strongest to weakest",
  "Carte haute": "High card",
  "Paire": "Pair",
  "Deux paires": "Two pair",
  "Brelan": "Three of a kind",
  "Suite": "Straight",
  "Couleur": "Flush",
  "Full": "Full house",
  "Carré": "Four of a kind",
  "Quinte flush": "Straight flush",

  // --- S'asseoir : la table d'un lieu, le défi de son hôte
  "La table : {lieu}": "The table: {lieu}",
  "Quatre à table : toi, {hote} et deux habitués.": "Four at the table: you, {hote} and two regulars.",
  "Un ticket ou deux, et tu reviens t'asseoir.": "A ticket or two, and you'll be back for a seat.",
  "Ta cave": "Your buy-in",
  "De {min} à {max}": "From {min} to {max}",
  "Ta cave quitte ta bourse et devient ton tapis : tu le reprends en partant.":
    "Your buy-in leaves your purse and becomes your stack: you take it back when you leave.",
  "S'asseoir": "Sit down",
  "S'asseoir avec {montant}": "Sit down with {montant}",
  "Le défi : {lieu}": "The challenge: {lieu}",
  "Défier {hote}": "Challenge {hote}",
  "Un tête-à-tête : {montant} chacun, jusqu'à ce que l'un des deux n'ait plus rien.":
    "Head-to-head: {montant} each, until one of you has nothing left.",
  "La blinde monte au fil des mains : le duel ne traîne pas.": "The blind goes up as the hands go by: the duel doesn't drag.",
  "Sa cagnotte est déjà gagnée : on rejoue pour l'honneur.": "The kitty is already won: this one is for honour.",
  "Si tu gagnes, sa cagnotte est pour toi : {montant}.": "If you win, the kitty is yours: {montant}.",
  "Défier pour {montant}": "Challenge for {montant}",

  // --- Créer une table, la rejoindre
  "Blinde": "Blind",
  "La mise d'entrée de chaque main": "What everyone pays to enter each hand",
  "Cave maximale": "Max buy-in",
  "Ce qu'un joueur pose, au plus": "The most a player can put down",
  "Sièges": "Seats",
  "Robots": "Bots",
  "Niveau des robots": "Bot level",
  "Tu poses {montant}. Tes amis rejoignent la table avec son code.": "You put down {montant}. Your friends join the table with its code.",
  "Créer la table": "Create the table",
  "{quoi} : moins": "{quoi}: less",
  "{quoi} : plus": "{quoi}: more",
  "Rejoindre une table": "Join a table",
  "Le code de la table": "The table's code",
  "Cinq lettres ou chiffres, donnés par la personne qui a créé la table.": "Five letters or digits, given by whoever created the table.",
  "Voir la table": "Find the table",
  "{n} sièges libres": "{n} free seats",
  "1 siège libre": "1 free seat",
  "Plus un siège": "No seats left",
  "Déjà à table": "Already at the table",

  // --- La salle d'attente d'une table d'amis
  "Tout le monde est là ? À toi de lancer.": "Everyone here? Yours to start.",
  "Donne le code à tes amis : il faut être deux pour jouer.": "Give your friends the code: it takes two to play.",
  "{nom} lance la partie quand tout le monde est là.": "{nom} starts the game once everyone is here.",
  "Ton tapis : {montant}": "Your stack: {montant}",
  "Partager": "Share",
  "Lancer la partie": "Start the game",
  "Rejoins ma table de Poker Tricheur sur Grattouille. Le code : {code}": "Join my Cheater's Poker table on Grattouille. The code: {code}",

  // --- La table : l'en-tête, les sièges, le pot
  "Quitter la table": "Leave the table",
  "Hors connexion. La table t'attend : on reprend dès que le réseau revient.":
    "You're offline. The table is waiting: play resumes as soon as the network is back.",
  "On retrouve ta table…": "Finding your table…",
  "Ta place": "Your seat",
  "Pot : {montant}": "Pot: {montant}",
  "Blinde : {montant}, puis {suivante} dans {n} mains": "Blind: {montant}, then {suivante} in {n} hands",
  "Blinde : {montant}, puis {suivante} à la main suivante": "Blind: {montant}, then {suivante} next hand",
  "libre": "free",
  "arrive…": "arriving…",
  "absent": "away",
  "couché": "folded",
  "à tapis": "all in",
  "attend": "waiting",
  "D": "D",
  "donneur": "dealer",
  "a la parole": "to speak",
  "{nom} : tapis {montant}": "{nom}: stack {montant}",
  "mise {montant}": "bet {montant}",
  // Ce qu'un joueur vient de faire, écrit un instant sur son siège.
  "Parole": "Check",
  "Se couche": "Folds",
  "Suit": "Calls",
  "Mise": "Bets",
  "Relance": "Raises",
  "Tapis !": "All in!",
  "Un joueur parti": "A player who left",

  // --- La table : ce qu'il y a à faire
  "Tu es noté absent : tes décisions tombent toutes seules.": "You're marked as away: your decisions are being made for you.",
  "Je suis là": "I'm here",
  "Touche une carte pour la remplacer, ou joue franc jeu.": "Tap a card to swap it, or play fair.",
  "Carte glissée, ni vu ni connu. Les autres choisissent…": "Card slipped in, nobody the wiser. The others are choosing…",
  "Franc jeu. Les autres choisissent…": "Fair play. The others are choosing…",
  "La table choisit ses cartes…": "The table is choosing its cards…",
  "Jouer franc jeu": "Play fair",
  "À toi : {montant} pour suivre.": "Your turn: {montant} to call.",
  "À toi de parler.": "Your turn to speak.",
  "Tu es hors du coup : la main se finit sans toi.": "You're out of this one: the hand finishes without you.",
  "{nom} réfléchit…": "{nom} is thinking…",
  "Les enchères continuent…": "The betting goes on…",
  "Qui a triché ? Touche une main pour l'accuser.": "Who cheated? Tap a hand to accuse.",
  "Rien à dire. Verdict dans un instant.": "Nothing to say. Verdict in a moment.",
  "Accusation lancée. Verdict dans un instant.": "Accusation made. Verdict in a moment.",
  "Les joueurs se jaugent…": "The players are sizing each other up…",
  "La main suivante arrive…": "Next hand coming up…",
  "Ton tapis ne couvre plus la blinde : recave pour jouer la suite.": "Your stack no longer covers the blind: top up to play on.",
  "On attend un joueur pour repartir.": "Waiting for a player to carry on.",
  "Ton tapis": "Your stack",
  "Ta mise": "Your stake",

  // --- La table : les gestes
  "Miser": "Bet",
  "Relancer à": "Raise to",
  "mini": "min",
  "milieu": "middle",
  "pot": "pot",
  "tapis": "all-in",
  "Se coucher": "Fold",
  "Suivre : {montant}": "Call: {montant}",
  "Tapis : {montant}": "All in: {montant}",
  "Autre montant": "Other amount",
  "Rien à dire": "Nothing to say",
  "Main suivante": "Next hand",
  "On attend les autres…": "Waiting for the others…",
  "Fin du défi": "See the outcome",
  "Recaver": "Top up",

  // --- La triche
  "Remplacer : {carte}": "Swap out: {carte}",
  "{carte}, glissée par toi": "{carte}, slipped in by you",
  "Remplacer une carte": "Swap a card",
  "Ta main : touche la carte à remplacer": "Your hand: tap the card to swap out",
  "Par quelle carte ? Une valeur, une couleur.": "For which card? One rank, one suit.",
  "Ta main devient : {main}": "Your hand becomes: {main}",
  "Valeur de la carte": "Card rank",
  "Couleur de la carte": "Card suit",
  "Glisser : {carte}": "Slip in: {carte}",
  "Glisser la carte": "Slip in the card",

  // --- L'abattage et les accusations
  "L'abattage": "The showdown",
  "Carte en double : quelqu'un a triché. Touche une main pour l'accuser.": "A card shown twice: somebody cheated. Tap a hand to accuse.",
  "Tu l'accuses.": "You're accusing them.",
  "Accuser {nom} ?": "Accuse {nom}?",
  "Si {nom} a triché, sa main ne compte plus ; sinon, tu lui paies {montant}.":
    "If {nom} cheated, their hand no longer counts; if not, you pay them {montant}.",
  "Si {nom} a triché, sa main ne compte plus ; sinon, rien à payer : ton tapis est vide.":
    "If {nom} cheated, their hand no longer counts; if not, nothing to pay: your stack is empty.",
  "Tricheur !": "Cheater!",
  "Finalement, non": "Actually, no",

  // --- Le dénouement
  "toi": "you",
  "{debut} et {fin}": "{debut} and {fin}",
  "{noms} : « Tricheur ! »": "{noms}: “Cheater!”",
  "Triche ! {fausse} à la place de {vraie}.": "Cheat! {fausse} in place of {vraie}.",
  "Franc jeu : tu lui paies {montant}.": "Fair play: you pay them {montant}.",
  "Franc jeu : ton tapis est vide, rien à payer.": "Fair play: your stack is empty, nothing to pay.",
  "Franc jeu : {nom} te paie {montant}.": "Fair play: {nom} pays you {montant}.",
  "Franc jeu : {nom} lui paie {montant}.": "Fair play: {nom} pays them {montant}.",
  "Franc jeu : {noms} lui paient {montant} chacun.": "Fair play: {noms} each pay them {montant}.",
  "Franc jeu : {noms} lui payez {montant} chacun.": "Fair play: {noms} each pay them {montant}.",
  "Franc jeu : {noms} te paient {montant} chacun.": "Fair play: {noms} each pay you {montant}.",
  "Franc jeu : {nom} n'a plus rien pour payer.": "Fair play: {nom} has nothing left to pay with.",
  "Cette main te rapporte {montant}.": "This hand earns you {montant}.",
  "Cette main te coûte {montant}.": "This hand costs you {montant}.",
  "Cette main ne te coûte rien.": "This hand costs you nothing.",
  "Tu prends le pot : {montant}.": "You take the pot: {montant}.",
  "Tu prends un pot annexe : {montant}.": "You take a side pot: {montant}.",
  "{nom} prend le pot : {montant}.": "{nom} takes the pot: {montant}.",
  "{nom} prend un pot annexe : {montant}.": "{nom} takes a side pot: {montant}.",
  "Pot partagé ({montant}) entre {noms}.": "Pot split ({montant}) between {noms}.",
  "Plus personne pour le prendre : le pot ({montant}) reste sur la table.": "Nobody left to take it: the pot ({montant}) stays on the table.",
  "Tout le monde s'est couché : tu prends le pot, {montant}.": "Everyone folded: you take the pot, {montant}.",
  "{nom} prend le pot sans montrer ses cartes : {montant}.": "{nom} takes the pot without showing a card: {montant}.",

  // --- Recaver, quitter
  "Montant": "Amount",
  "Ton tapis passera à {montant}, à la main suivante.": "Your stack will be {montant}, from the next hand.",
  "Recaver {montant}": "Top up {montant}",
  "Quitter la table ?": "Leave the table?",
  "En pleine main, partir c'est se coucher : ta mise ({montant}) reste au pot.":
    "Mid-hand, leaving means folding: your stake ({montant}) stays in the pot.",
  "Un pot de {montant} est resté sur la table : en partant, tu le laisses aux autres.":
    "A pot of {montant} is still on the table: if you leave, it goes to the others.",
  "Le défi s'arrête là : il faudra le reprendre du début.": "The challenge ends here: you'll have to start it again.",
  "Ton tapis ({montant}) retourne dans ta bourse.": "Your stack ({montant}) goes back into your purse.",
  "Rester à table": "Stay at the table",
  "Tu quittes la table avec {montant}.": "You leave the table with {montant}.",

  // --- Sorti de table
  "Trois mains sans jouer : ta place a été libérée.": "Three hands without playing: your seat has been given up.",
  "Trois mains sans pouvoir payer la blinde : ta place a été libérée.": "Three hands unable to pay the blind: your seat has been given up.",
  "Ta cave n'est pas arrivée à temps : ta place a été libérée.": "Your buy-in didn't arrive in time: your seat has been given up.",
  "La table s'est endormie : trente minutes sans un geste, elle a fermé.": "The table nodded off: thirty minutes without a move, and it closed.",
  "La table a fermé : il y avait trop d'argent sur le tapis pour compter juste.":
    "The table has closed: there was too much money on the baize to count straight.",
  "Match nul : plus personne n'a de quoi continuer.": "A draw: nobody has anything left to carry on.",
  "Défi relevé !": "Challenge won!",
  "Le défi reste à relever": "The challenge still stands",
  "Fin de la partie": "End of the game",
  "Sa cagnotte": "The kitty",
  "Tu le retentes quand tu veux.": "Try again whenever you like.",
  "Cette table a fermé.": "This table has closed.",
  "Ton tapis ({montant}) est retourné dans ta bourse.": "Your stack ({montant}) is back in your purse.",
  "Retour au hall": "Back to the lobby",

  // --- La Table des Maîtres : refus du serveur (src/app/store.ts)
  "La Table des Maîtres n'ouvre qu'à qui a relevé les huit défis.":
    "The Masters' Table only opens to whoever has beaten all eight challenges.",

  // --- La Table des Maîtres, dans le hall. Les « maîtres des lieux » sont « your hosts » ;
  // à cette table, ils sont « the masters ».
  "Défis relevés : {n} sur {total}": "Challenges won: {n} of {total}",
  "La Table des Maîtres": "The Masters' Table",
  "Ruine les huit maîtres des lieux pour t'y asseoir.": "Ruin all eight hosts to earn a seat.",
  "Quatre maîtres tirés au sort": "Four masters, drawn by lot",
  "Blinde de départ": "Opening blind",
  "Cave": "Buy-in",
  "Tournoi : le dernier assis prend tout": "Tournament: last one seated takes it all",
  "Tu l'as remportée une fois": "You've won it once",
  "Tu l'as remportée {n} fois": "You've won it {n} times",
  "Prendre place": "Take a seat",

  // --- S'y asseoir : ses règles en trois lignes
  "Toi, et quatre des huit maîtres des lieux, tirés au sort.": "You, and four of the eight hosts, drawn by lot.",
  "Chacun pose {cave}, et personne ne recave : à zéro, on quitte la table.":
    "Everyone puts down a {cave} buy-in, and nobody tops up: at zero, you leave the table.",
  "La blinde part de {blinde} et monte au fil des mains.": "The blind starts at {blinde} and goes up as the hands go by.",
  "Tu peux partir avec ton tapis, mais sans la victoire.": "You can leave with your stack, but without the win.",
  "Le dernier assis prend tout : {montant}.": "Last one seated takes it all: {montant}.",
  "S'asseoir pour {montant}": "Sit down for {montant}",

  // --- À la table
  "Table des Maîtres": "Masters' Table",
  "Tes adversaires, tirés au sort": "Your opponents, drawn by lot",
  "éliminé": "knocked out",
  "{nom} : éliminé": "{nom}: knocked out",
  "{n} maîtres assis": "{n} masters seated",
  "Plus qu'un maître": "One master left",
  "Fin du tournoi": "See the outcome",
  "Le tournoi s'arrête là pour toi : pas de victoire, et la table ferme derrière toi.":
    "The tournament ends here for you: no win, and the table closes behind you.",

  // --- Ses trois fins : gagnée, perdue, quittée
  "La table est à toi !": "The table is yours!",
  "Tu remportes": "You win",
  "Tu remportes {montant}.": "You win {montant}.",
  "Les maîtres saluent": "The masters salute you",
  "Les maîtres gardent la table": "The masters keep the table",
  "Tu y laisses ta cave, pas ta place : reviens quand tu veux, quatre maîtres seront tirés au sort.":
    "You leave your buy-in behind, not your seat: come back whenever you like, and four masters will be drawn afresh.",
  "Tu te lèves de table": "You leave the table",
  "Tu repars avec ton tapis, {montant}, sans la victoire. La table rouvre quand tu veux.":
    "You leave with your stack, {montant}, but without the win. The table reopens whenever you like.",
  "Tu repars sans la victoire. La table rouvre quand tu veux.": "You leave without the win. The table reopens whenever you like.",

  // --- La mise saisie à la main, et le tapis qui se confirme. Les enchères sont sans limite
  // (« no limit ») ; « stack » est le tapis du joueur, « all in » le geste de tout pousser.
  "À suivre : {montant}": "To call: {montant}",
  "Le montant, chiffre à chiffre": "The amount, digit by digit",
  "virgule": "decimal point",
  "Effacer": "Delete",
  "Unité": "Unit",
  "euros": "euros",
  "milliers d'euros": "thousands of euros",
  "millions d'euros": "millions of euros",
  "milliards d'euros": "billions of euros",
  "billions d'euros": "trillions of euros",
  "Entre {min} et {max}": "Between {min} and {max}",
  "Moins que le minimum : ce sera {montant}.": "Below the minimum: it will be {montant}.",
  "Plus que le maximum : ce sera {montant}.": "Above the maximum: it will be {montant}.",
  "Plus que ton tapis : ce sera tout ton tapis.": "More than your stack: it will be your whole stack.",
  "Tape un montant.": "Type an amount.",
  "Tu poses {montant} : il te restera {reste}.": "You put in {montant}: you'll have {reste} left.",
  "Tu ajoutes {montant} à ta mise : il te restera {reste}.": "You add {montant} to your bet: you'll have {reste} left.",
  "Tu poses {montant} : c'est tout ton tapis.": "You put in {montant}: that's your whole stack.",
  "Relancer": "Raise",
  "Miser {montant}": "Bet {montant}",
  "Relancer à {montant}": "Raise to {montant}",
  "Faire tapis ?": "Go all in?",
  "C'est tout ton tapis : si tu perds cette main, il ne te restera rien devant toi.":
    "That's your whole stack: lose this hand and you'll have nothing left in front of you.",
  "Avec les {deja} déjà misés, ta mise passe à {total}.": "With the {deja} you've already bet, your bet goes to {total}.",

  // --- L'histoire de chaque hôte : le battre trois fois au poker l'ouvre, dans les Souvenirs
  // (« Memories », comme aux Réglages). Ni « his » ni « her » : chaque phrase vaut pour les huit.
  "Son histoire : {n} victoire sur {total}": "Story: {n} of {total} wins",
  "Son histoire : {n} victoires sur {total}": "Story: {n} of {total} wins",
  "Son histoire t'attend dans tes Souvenirs.": "Story unlocked: see your Memories.",
  "Sa cagnotte est déjà gagnée : on rejoue pour l'honneur, et pour son histoire.":
    "The kitty is already won: this one is for honour, and for the story.",
  "Encore une victoire et {hote} te raconte son histoire.": "One more win and you'll hear {hote}'s story.",
  "Encore {n} victoires et {hote} te raconte son histoire.": "{n} more wins and you'll hear {hote}'s story.",
  "{hote} a une histoire à te raconter : elle t'attend dans tes Souvenirs.":
    "{hote} has a story to tell you: it's waiting in your Memories.",
  "{hotes} ont des histoires à te raconter : elles t'attendent dans tes Souvenirs.":
    "{hotes} have stories to tell you: they're waiting in your Memories.",
  "Les quatre maîtres ont des histoires à te raconter : elles t'attendent dans tes Souvenirs.":
    "All four masters have stories to tell you: they're waiting in your Memories.",
};
