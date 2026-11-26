// Anglais — Boutiques, fiches, dressing, classement, réglages.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.

export const EN_BOUTIQUES: Record<string, string> = {
  // --- Boutiques : les quatre vitrines
  "Boutiques": "Shops",
  "Ma collection : {n} sur {total}": "My collection: {n} of {total}",
  "Le Kiosque est à vendre": "The Kiosk is for sale",
  "Chez {vendeur}, pour {prix}.": "At {vendeur}'s, for {prix}.",
  "{n} sur {total}": "{n} of {total}",
  "{boutique}, {rayon}, par {vendeur}. {compte}.": "{boutique}, {rayon}, run by {vendeur}. {compte}.",

  // --- Une boutique : rayons et étiquettes
  "Rayons": "Departments",
  "installé": "moved in",
  "au volant": "at the wheel",
  "porté": "wearing",
  "à toi": "yours",
  "à ta portée": "within reach",
  "encore {montant}": "{montant} to go",
  "{nom}, {prix}, plus {n} étoiles, {etat}": "{nom}, {prix}, plus {n} stars, {etat}",

  // --- Fiche d'un article
  "Acheter {prix}": "Buy {prix}",
  "{nom}, porté": "{nom}, as worn",
  "Vendu": "Sold",
  "À toi": "Yours",
  "+{n}★ de Standing": "+{n}★ Standing",
  "Il te manque {montant}.": "You're {montant} short.",
  "garde le doigt posé": "press and hold",
  "C'est plus de la moitié de ta bourse.": "That's more than half your money.",
  "Hors connexion. Les boutiques rouvrent dès que le réseau revient.":
    "You're offline. The shops reopen as soon as the network is back.",
  "Retirer": "Take off",
  "Porter maintenant": "Wear it now",
  "Porter": "Wear",
  "Tu y habites.": "You live here.",
  "S'y installer": "Move in",
  "C'est ton véhicule du moment.": "This is your current ride.",
  "Prendre le volant": "Take the wheel",
  "Exposé chez toi, parmi tes trois plus beaux trésors.": "On display at your place, among your three finest treasures.",
  "Rangé dans ta collection : chez toi, seuls tes trois plus beaux trésors sont exposés.":
    "Kept in your collection: only your three finest treasures go on display at your place.",
  "Le Kiosque est à toi, {rang}.": "The Kiosk is yours, {rang}.",
  "Fermer": "Close",

  // --- Dressing
  "Dressing": "Wardrobe",
  "{pseudo} dans le miroir": "{pseudo} in the mirror",
  "Emplacements": "Categories",
  "Chapeau": "Hat",
  "Lunettes": "Glasses",
  "Tenue": "Outfit",
  "Accessoire": "Accessory",
  "Rien": "Nothing",
  "Rien à porter ici pour l'instant.": "Nothing to wear here yet.",
  "Aller chez {vendeur}": "Go to {vendeur}'s",
  "Changer d'espèce, c'est gratuit": "Changing species is free",

  // --- Choix de la résidence et du véhicule
  "Où t'installer ?": "Where will you live?",
  "Quel véhicule sortir ?": "What will you drive?",
  "Le banc du port": "The harbour bench",
  "À pied": "On foot",

  // --- Classement
  "Classement": "Leaderboard",
  "Rafraîchir le classement": "Refresh the leaderboard",
  "Relâche pour rafraîchir": "Release to refresh",
  "Tire pour rafraîchir": "Pull to refresh",
  "Le classement vient d'être mis à jour.": "The leaderboard has just been updated.",
  "Le classement ne répond pas.": "The leaderboard isn't answering.",
  "Réessayer": "Try again",
  "Personne encore. La première place est à prendre.": "Nobody yet. First place is up for grabs.",
  "Le classement arrive…": "The leaderboard is on its way…",
  "Les trois premiers": "The top three",
  "La suite du classement": "The rest of the leaderboard",
  "Toi": "You",
  "{rang}. {nom} : {fortune}, {etoiles} étoiles.": "{rang}. {nom}: {fortune}, {etoiles} stars.",
  "{rang}. {nom}, propriétaire du Kiosque : {fortune}, {etoiles} étoiles.":
    "{rang}. {nom}, owner of the Kiosk: {fortune}, {etoiles} stars.",
  "Tu n'es pas encore classé. Il te manque {montant} pour entrer dans les {n} premiers.":
    "You're not ranked yet. You need {montant} more to enter the top {n}.",
  "Tu n'es pas encore classé. Ta fortune y sera inscrite d'ici une minute.":
    "You're not ranked yet. Your fortune will be on the board within a minute.",

  // --- Réglages
  "Réglages": "Settings",
  "Langue": "Language",
  "Son": "Sound",
  "Vibrations": "Vibration",
  "Ce navigateur ne sait pas faire vibrer le téléphone.": "This browser can't make the phone vibrate.",
  "Animations réduites": "Reduced motion",
  "Déjà demandé par les réglages de ton téléphone.": "Already requested in your phone's settings.",
  "Fondus courts, pas de particules, fêtes en image fixe.": "Short fades, no particles, still-image celebrations.",

  "Mon code de récupération": "My recovery code",
  "Pas d'adresse e-mail, pas de mot de passe : ce code est la seule clé de ta fortune. Note-le quelque part. Sans lui, un téléphone perdu ou vidé, et le compte est perdu.":
    "No email address, no password: this code is the only key to your fortune. Write it down somewhere. Without it, a lost or wiped phone means a lost account.",
  "Afficher mon code": "Show my code",
  "Copier le code": "Copy the code",
  "Code copié.": "Code copied.",
  "Impossible de copier ici. Note le code à la main.": "Can't copy here. Write the code down by hand.",
  "Pour retrouver ton compte sur un autre téléphone, il suffit de ton pseudo ({pseudo}) et de ce code.":
    "To get your account back on another phone, all you need is your name ({pseudo}) and this code.",

  "Carnet de bord": "Logbook",
  "Tickets grattés": "Tickets scratched",
  "Tickets gagnants": "Winning tickets",
  "Misé en tout": "Total staked",
  "Gagné en tout": "Total won",
  "Plus beau gain": "Best win",
  "pas encore": "not yet",
  "Jackpots": "Jackpots",

  "À propos": "About",
  "Les tickets trouvés": "Found tickets",
  "On débarque sans un sou, et on n'est jamais bloqué : qui n'a plus de quoi jouer trouve un ticket par terre, toujours gagnant. De temps en temps, la chance en laisse traîner un pour tout le monde.":
    "You arrive without a penny, and you never get stuck: anyone with nothing left to play with finds a ticket on the ground, and it always wins. Now and then, luck leaves one lying around for everybody.",
  "Les grands nombres": "Big numbers",
  "{million}, c'est un million d'euros ; {milliard}, un milliard ; {billion}, un billion, soit mille milliards. Oui, ça existe. Non, personne n'en a jamais vu.":
    "{million} is a million euros; {milliard}, a billion; {billion}, a trillion, which is a thousand billion. Yes, that exists. No, nobody has ever seen one.",
  "Dans la vraie vie": "In real life",
  "Un vrai ticket à gratter reverse en moyenne autour de 70 % des mises, et entre un ticket sur trois et un sur quatre est gagnant, souvent juste pour rembourser la mise. Ici, chaque euro misé en rapporte plus de deux : c'est pour ça que c'est un jeu.":
    "A real scratch card pays back around 70% of the money staked on average, and between one card in three and one in four wins, often just enough to cover its price. Here, every euro staked brings back more than two: that's what makes it a game.",
  "Si le jeu d'argent pèse sur toi ou sur un proche : Joueurs Info Service, appel anonyme et non surtaxé, tous les jours de 8 h à 2 h.":
    "If gambling is weighing on you or someone close to you: Joueurs Info Service, a French helpline, anonymous and charged as a normal call, every day from 8 am to 2 am. Outside France, your national gambling helpline can help.",
  "09 74 75 13 13": "+33 9 74 75 13 13",
  "Vie privée": "Privacy",
  "Un pseudo et un identifiant tiré au hasard, rien d'autre : ni traceur, ni statistique tierce, ni publicité. Sur ce téléphone, le jeu ne garde que ton identifiant, ton code, tes réglages et les tickets grattés en attente d'envoi.":
    "A name and a random ID, nothing else: no trackers, no third-party analytics, no ads. On this phone, the game only keeps your ID, your code, your settings and the scratched tickets waiting to be sent.",
  "Grattouille, version {version}.": "Grattouille, version {version}.",

  "Supprimer mon compte": "Delete my account",
  "Ta fortune, tes biens et ta place au classement seront effacés pour de bon, et ton pseudo redeviendra libre.":
    "Your fortune, your belongings and your place on the leaderboard will be erased for good, and your name will be free again.",
  "Pour confirmer, écris ton pseudo : {pseudo}": "To confirm, type your name: {pseudo}",
  "Ce n'est pas ton pseudo. Rien n'a été supprimé.": "That's not your name. Nothing was deleted.",
  "Supprimer pour de bon": "Delete for good",
  "Finalement non": "No, keep it",
};
