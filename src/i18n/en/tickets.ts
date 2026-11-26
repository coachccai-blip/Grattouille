// Anglais — Tickets : libellés des jeux, règles, noms des symboles.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
//
// Tout tient sur un ticket de 252 px : une traduction n'est jamais plus longue que sa
// phrase française de plus de quelques lettres, et une règle tient sur deux lignes.

export const EN_TICKETS: Record<string, string> = {
  // --- Le ticket lui-même (src/ticket/Ticket.tsx)
  "Jusqu'à {montant}": "Up to {montant}",
  "Trouvé par terre": "Found on the ground",
  "Payé": "Paid",

  // --- Les règles, une par façon de jouer (src/engines/index.ts)
  "3 symboles identiques : tu gagnes leur montant.": "3 matching symbols win their amount.",
  "Trouve 3 montants identiques : tu gagnes ce montant.": "Find 3 matching amounts to win that amount.",
  "Chacun de tes numéros qui est aussi gagnant rapporte son montant.":
    "Each of your numbers that is also a winning number wins its amount.",
  "Chacun de tes comptes qui est aussi gagnant rapporte son montant.":
    "Each of your accounts that is also a winning account wins its amount.",
  "Aligne 3 truffes en ligne, en colonne ou en diagonale : tu gagnes le lot.":
    "Line up 3 truffles in a row, a column or a diagonal to win the prize.",
  "Aligne 3 moustaches en ligne, en colonne ou en diagonale : tu gagnes le lot.":
    "Line up 3 moustaches in a row, a column or a diagonal to win the prize.",
  "Aligne 3 planètes en ligne, en colonne ou en diagonale : tu gagnes le lot.":
    "Line up 3 planets in a row, a column or a diagonal to win the prize.",
  "Chaque match gagné rapporte son montant. Match nul : pas de gain.":
    "Each match you win pays its amount. A draw pays nothing.",
  "Chaque manche gagnée rapporte son montant. Égalité : pas de gain.":
    "Each hand you win pays its amount. A tie pays nothing.",
  "Chaque course gagnée rapporte son montant. Égalité : pas de gain.":
    "Each race you win pays its amount. A dead heat pays nothing.",
  "Chaque fois que ton arcane apparaît, tu gagnes le montant inscrit dessous.":
    "Each time your card appears, you win the amount shown below it.",
  "Chaque fois que ton signe apparaît, tu gagnes le montant inscrit dessous.":
    "Each time your sign appears, you win the amount shown below it.",
  "Une rangée dont les 3 cartes sont sorties au tirage rapporte son montant.":
    "A row whose 3 cards all come up in the draw wins its amount.",
  "Un voilier dont les 3 bouées sont sorties au tirage rapporte son montant.":
    "A boat whose 3 buoys all come up in the draw wins its amount.",
  "Un cocktail dont les 3 ingrédients sont sortis rapporte son montant.":
    "A cocktail whose 3 ingredients all come up wins its amount.",
  "Trois jeux en un : gratte les trois volets, leurs gains s'additionnent.":
    "Three games in one: scratch all three panels and their winnings add up.",
  "Ton pion avance du total des 3 dés : tu gagnes le montant de sa case d'arrivée.":
    "Your pawn moves the total of the 3 dice and wins the amount on its final square.",
  "3 montants identiques : tu gagnes ce montant, multiplié par le taux d'intérêt.":
    "3 matching amounts win that amount, multiplied by the interest rate.",
  "3 montants identiques : tu gagnes ce montant, multiplié par le coefficient.":
    "3 matching amounts win that amount, times the multiplier.",
  "Chaque mot complété avec tes 10 lettres fait monter le lot.":
    "Each word completed with your 10 letters raises the prize.",
  "Si ton camp sort au moins 5 fois sur 9, tu gagnes le lot.":
    "If your side comes up at least 5 times out of 9, you win the prize.",

  // --- Numéros gagnants
  "Numéros gagnants": "Winning numbers",
  "Tes numéros": "Your numbers",
  "Comptes gagnants": "Winning accounts",
  "Tes comptes": "Your accounts",

  // --- Le lot d'un ticket à lot unique (trois alignés, camps)
  "Lot": "Prize",

  // --- Les duels : toi contre une équipe, Hector, le croupier ou un rival
  "Toi": "You",
  "Hector": "Hector",
  "Croupier": "Dealer",
  "Rival": "Rival",
  // Les quatre équipes de Lucarne. Sur le ticket, le français s'écrit sans son article.
  "les Goélands": "Gulls",
  "les Sardines": "Sardines",
  "les Bigorneaux": "Winkles",
  "les Mouettes": "Puffins",
  // Au-dessus de 21, l'adversaire saute.
  "saute": "bust",

  // --- Ton signe, ton camp
  "Ton signe": "Your sign",
  "Ton arcane": "Your card",
  "Ton camp": "Your side",
  "{camp} {a}, {autre} {b}": "{camp} {a}, {autre} {b}",

  // --- Tirage et rangées
  "Tirage": "The draw",
  "Les ingrédients": "Ingredients",
  // Les cartes, pour les lecteurs d'écran : « valet de pique ».
  "{rang} de {couleur}": "{rang} of {couleur}",
  "valet": "jack",
  "dame": "queen",
  "roi": "king",
  "as": "ace",
  "pique": "spades",
  "cœur": "hearts",
  "carreau": "diamonds",
  "trèfle": "clubs",

  // --- Les dés et le chemin
  "Départ": "Start",
  "Total": "Total",
  "Dé : {valeur}": "Die: {valeur}",
  "Le chemin": "The path",
  "Case {n} : {montant}": "Square {n}: {montant}",
  "Case {n} : rien": "Square {n}: nothing",

  // --- Le coefficient
  "Coefficient de marée": "Tide multiplier",
  "Taux d'intérêt": "Interest rate",
  "Prime": "Bonus",
  "Coefficient": "Multiplier",

  // --- Mots croisés
  "Grille de mots croisés : {n} mots complets sur {total}": "Crossword grid: {n} of {total} words complete",
  "Grille de mots croisés : {n} mot complet sur {total}": "Crossword grid: {n} of {total} words complete",
  "Barème": "Prize scale",
  "Tes lettres": "Your letters",

  // --- Les tickets à trois volets
  "Volets du ticket": "Ticket panels",
  "Le trio": "The trio",
  "Le tirage": "The draw",
  "Le 21": "The 21",
  "L'ascenseur": "The lift",
  "Le bureau": "The office",
  "Le toit": "The roof",

  // --- Les signes et les symboles (SYMBOL_NAMES, src/ticket/themes.ts)
  // Constellations du Signe du Homard.
  "Homard": "Lobster",
  "Chouette": "Owl",
  "Tortue": "Turtle",
  "Paon": "Peacock",
  "Hippocampe": "Seahorse",
  "Cerf": "Stag",
  "Baleine": "Whale",
  "Papillon": "Butterfly",
  "Lièvre": "Hare",
  "Cygne": "Swan",
  "Abeille": "Bee",
  "Escargot": "Snail",
  // Mets de Caviar & Champagne.
  "Caviar": "Caviar",
  "Champagne": "Champagne",
  "Truffe": "Truffle",
  "Macaron": "Macaron",
  "Huître": "Oyster",
  // Bandit Manchot.
  "Cloche": "Bell",
  "Cerise": "Cherry",
  "Citron": "Lemon",
  "Trèfle": "Clover",
  "Fer à cheval": "Horseshoe",
  "Étoile": "Star",
  "Sept": "Seven",
  "Diamant": "Diamond",
  "Couronne": "Crown",
  "Manchot": "Penguin",
  // La Pie Voleuse.
  "Bouton de nacre": "Pearl button",
  "Perle": "Pearl",
  "Améthyste": "Amethyst",
  "Topaze": "Topaz",
  "Aigue-marine": "Aquamarine",
  "Saphir": "Sapphire",
  "Émeraude": "Emerald",
  "Rubis": "Ruby",
  "Étoile de diamants": "Diamond star",
  // Trois alignés.
  "Gland": "Acorn",
  "Moustache": "Moustache",
  "Monocle": "Monocle",
  "Planète": "Planet",
  "Astéroïde": "Asteroid",
  // Arcanes de La Bonne Aventure, astres d'Éclipse Totale.
  "Le Soleil": "The Sun",
  "La Lune": "The Moon",
  "L'Étoile": "The Star",
  "La Roue": "The Wheel",
  "La Couronne": "The Crown",
  "Le Phare": "The Lighthouse",
  "L'Ancre": "The Anchor",
  "La Sirène": "The Mermaid",
  // Pêche au Gros.
  "Sardine": "Sardine",
  "Crevette": "Prawn",
  "Crabe": "Crab",
  "Daurade": "Sea bream",
  "Raie": "Ray",
  "Thon": "Tuna",
  "Espadon": "Swordfish",
  "Requin": "Shark",
  "Kraken": "Kraken",
  // Cocktails du Commodore.
  "Orange": "Orange",
  "Fraise": "Strawberry",
  "Ananas": "Pineapple",
  "Noix de coco": "Coconut",
  "Menthe": "Mint",
  "Olive": "Olive",
  "Glaçon": "Ice cube",
  "Café": "Coffee",
  "Sirop": "Syrup",
  "Bulles": "Bubbles",
  "Sucre": "Sugar",
  "Ombrelle": "Cocktail umbrella",
  // Les camps : la roulette, les fanaux.
  "Rouge": "Red",
  "Noir": "Black",
  "Bâbord": "Port",
  "Tribord": "Starboard",
};
