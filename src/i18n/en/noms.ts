// Anglais — les noms tirés des données de shared/ : tickets, biens, lieux, boutiques,
// emplacements, espèces, rangs, tempéraments. Clé : l'identifiant.
//
// Chaque table suit l'ordre de sa source (shared/tickets.ts, catalog.ts, places.ts,
// rules.ts, economy.ts) : les deux fichiers se relisent côte à côte.
//
// Règles de ces noms, gardées par tests/i18n.test.ts :
// - anglais britannique ; guillemets “ ”, jamais « » ;
// - un nom anglais ne dépasse pas son original de plus de 6 caractères (ils sont
//   imprimés sur des étiquettes, des pastilles et des bandeaux de ticket), et un
//   titre de ticket tient en 24 caractères ;
// - les tickets sont originaux, en anglais aussi : aucun titre de jeu de loterie
//   existant (c'est pourquoi « Bas de Laine » n'est pas « Nest Egg », qui en est un).

import type { SpeciesId } from "../../../shared/rules";
import type { PlaceId, ShopId, Slot, Temperament } from "../../../shared/types";

/** Les trente tickets : des titres, donc une capitale à chaque mot plein. */
export const EN_TICKET_NAMES: Record<string, string> = {
  // Le Kiosque de Gaspard
  tirelire: "Piou's Piggy Bank",
  "signe-du-homard": "Sign of the Lobster",
  // « Saute-mouton » se dit « leapfrog » : le crabe prend la place de la grenouille.
  "saute-crabe": "Leapcrab",
  "tic-tac-truffe": "Tic-Tac-Truffle",

  // Le Grand Café des Arcades
  lucarne: "Top Corner",
  "grande-maree": "Spring Tide",
  // « Patience » : le nom britannique de la réussite, et ce qu'il faut pour la finir.
  reussite: "Patience",
  "grille-du-jour": "The Daily Grid",
  // La chaussette pleine de pièces du dessin : celle des économies « for a rainy day ».
  "bas-de-laine": "Rainy-Day Sock",

  // Le Casino de la Jetée
  "vingt-et-un": "Hector's 21",
  // « One-armed bandit », la machine à sous ; le manchot du dessin n'a que des ailerons.
  "bandit-manchot": "One-Flippered Bandit",
  "rouge-et-noir": "The Red and the Black",
  "mille-pattes": "Millipede",

  // Le Salon Privé
  "pie-voleuse": "The Thieving Magpie",
  // « It's on the cards » : c'est écrit, comme dans les cartes de la voyante.
  "bonne-aventure": "On the Cards",
  "caviar-champagne": "Caviar & Champagne",
  "grand-prix": "Corniche Grand Prix",

  // Le Cercle des Moustaches
  regate: "The Regatta",
  "pari-auguste": "Sir Auguste's Wager",
  // Un trophée, comme la Palme d'Or ou le Ballon d'Or : l'anglais les dit en français.
  "moustache-dor": "The Moustache d'Or",
  "grand-grattouille": "The Grand Grattouille",

  // Le Yacht « Démesure »
  cocktails: "Commodore's Cocktails",
  "babord-tribord": "Port and Starboard",
  "peche-au-gros": "Big-Game Fishing",

  // La Banque Coffre & Fils
  sesame: "Open Sesame",
  "compte-numerote": "Numbered Account",
  "interets-composes": "Compound Interest",

  // Le Croissant de Lune
  "eclipse-totale": "Total Eclipse",
  alignement: "The Planets Align",
  // « Skyscraper », le gratte-ciel ; « scratcher », le ticket à gratter.
  "gratte-ciel": "The Skyscratcher",
};

/**
 * Les 110 biens et le Kiosque. Comme en français : une capitale au premier mot et aux
 * noms propres seulement. Les surnoms entre « » passent entre “ ”.
 */
export const EN_ITEM_NAMES: Record<string, string> = {
  // Maison Sidonie : chapeaux
  beret: "Sailor's beret",
  canotier: "Straw boater",
  melon: "Bowler hat",
  "haut-de-forme": "Silk top hat",
  bicorne: "Ceremonial bicorne",
  couronne: "Solid gold crown",
  "chapeau-journal": "Newspaper hat",
  panama: "Panama hat",
  "casquette-capitaine": "Captain's cap",
  tiare: "Sapphire tiara",
  "casque-scaphandre": "Gilded diving helmet",
  aureole: "Halo (genuine)",
  "anneaux-saturne": "Crown of Saturn's rings",

  // Maison Sidonie : lunettes
  "lunettes-rondes": "Round glasses",
  "solaires-ecaille": "Tortoiseshell sunglasses",
  monocle: "Monocle",
  lorgnon: "Gold pince-nez",
  "solaires-diamants": "Diamond-studded sunglasses",
  "monocle-saphir": "Sapphire monocle",
  "lunettes-carton": "Cardboard glasses",
  "lunettes-aviateur": "Aviator sunglasses",
  "jumelles-opera": "Opera glasses",
  "lunettes-rubis": "Ruby-lensed glasses",
  "visiere-cosmonaute": "Cosmonaut's visor",
  "lunettes-etoiles": "Stardust glasses",
  "monocle-telescope": "Telescope monocle",

  // Maison Sidonie : tenues
  mariniere: "Breton top",
  "veston-tweed": "Tweed jacket",
  "trois-pieces": "Three-piece suit",
  // « Sur mesure » se dit « bespoke » chez le tailleur : le même mot pour le scaphandre.
  smoking: "Bespoke dinner jacket",
  "queue-de-pie": "Gold-embroidered tailcoat",
  "cape-imperiale": "Imperial velvet cape",
  "sac-a-patates": "Potato sack",
  cire: "Fisherman's oilskin",
  peignoir: "Grand hotel bathrobe",
  "habit-amiral": "Admiral's uniform",
  hermine: "Ermine robe",
  "combinaison-spatiale": "Bespoke spacesuit",
  "cape-aurore": "Northern Lights cape",

  // Maison Sidonie : accessoires
  "noeud-pap": "Bow tie",
  foulard: "Silk scarf",
  gousset: "Pocket watch",
  // « String of pearls », puis « String of planets » : le même collier, en plus grand.
  perles: "String of pearls",
  tourbillon: "Tourbillon watch",
  sautoir: "Diamond necklace",
  ficelle: "Butcher's string",
  echarpe: "Knitted scarf",
  canne: "Silver-topped cane",
  "grand-cordon": "Sash of the Order of the Lobster",
  sceptre: "Jewelled sceptre",
  // « Moonstone » serait la pierre de lune des bijoutiers : celle-ci vient de la Lune.
  "pendentif-lune": "Moon rock pendant",
  "collier-planetes": "String of planets",

  // Chez Enzo : garage et port
  velo: "Second-hand bike",
  scooter: "Sputtering scooter",
  citadine: "City car “The Flea”",
  cabriolet: "Convertible “Tramontane”",
  // « Grand Large » reste : en anglais aussi, c'est grand et c'est large.
  berline: "Saloon “Grand Large”",
  // Un fauve, c'est un « big cat » : le coupé vert anglais garde son clin d'œil.
  coupe: "Coupé “Big Cat GT”",
  supercar: "Supercar “Lightning V12”",
  hypercar: "Hypercar “Comet”",
  yacht: "Yacht “The Mermaid”",
  jet: "Private jet “Albatross”",
  caddie: "Supermarket trolley",
  pedalo: "Pedalo “The Swan”",
  helicoptere: "Helicopter “Dragonfly”",
  "sous-marin": "Pocket submarine",
  // « On cloud nine » : au septième ciel.
  dirigeable: "Airship “Cloud Nine”",
  // Le même nom que le Yacht des lieux, avec son numéro.
  paquebot: "Ocean liner “Excess II”",
  fusee: "Rocket “Grattouille One”",
  soucoupe: "Second-hand flying saucer",
  comete: "Tame comet",

  // Agence Colette : résidences
  "chambre-de-bonne": "Maid's room",
  studio: "Rooftop studio",
  appartement: "Flat with a balcony",
  "maison-pecheur": "Fisherman's cottage",
  loft: "Harbourside loft",
  "villa-mimosas": "Villa “Les Mimosas”",
  "hotel-particulier": "Town mansion",
  "villa-corniche": "Villa on the Corniche",
  chateau: "Château de Belle-Rive",
  ile: "Private island",
  carton: "Box under the pier",
  tente: "Beach tent",
  cabine: "Beach hut",
  // Un palais gothique vénitien : « palazzo ».
  palais: "Palazzo on the lagoon",
  tour: "Tower in your name",
  archipel: "Private archipelago",
  "station-orbitale": "Orbital station",
  "base-lunaire": "Moon base “Sea of Tranquillity”",

  // Galerie Archibald : trésors
  coquillage: "Lucky seashell",
  affiche: "Vintage Casino poster",
  vase: "Porcelain vase",
  tableau: "Painting “Still Life with Lobster”",
  statue: "Bronze statue",
  oeuf: "Jewelled egg",
  fresque: "Old Master fresco",
  diamant: "Diamond “Star of the Harbour”",
  capsule: "Lucky bottle cap",
  galet: "Heart-shaped pebble",
  "boule-a-neige": "Grattouille snow globe",
  nain: "Garden gnome",
  maquette: "Model sailing ship",
  pendule: "Mantel clock",
  tapis: "Persian rug",
  armure: "Suit of armour",
  dinosaure: "Dinosaur skeleton",
  meteorite: "Meteorite",
  trone: "Solid gold throne",
  "morceau-de-lune": "Piece of the Moon",
  "etoile-a-ton-nom": "Star in your name",

  // Le Kiosque, en vente quand la collection est complète : le nom du lieu.
  kiosque: "Gaspard's Kiosk",
};

/**
 * Les huit lieux. `name` : le nom complet, qui peut ouvrir une phrase. `short` : le
 * nom en cours de phrase, article en minuscule. `moment` : l'heure de la journée.
 */
export const EN_PLACES: Record<PlaceId, { name: string; short: string; moment: string }> = {
  kiosque: { name: "Gaspard's Kiosk", short: "the Kiosk", moment: "Morning" },
  cafe: { name: "The Grand Café des Arcades", short: "the Grand Café", moment: "Afternoon" },
  casino: { name: "The Pier Casino", short: "the Casino", moment: "Sunset" },
  salon: { name: "The Private Salon", short: "the Private Salon", moment: "Evening" },
  cercle: { name: "The Moustache Club", short: "the Club", moment: "Midnight" },
  yacht: { name: "The Yacht “Excess”", short: "the Yacht", moment: "Two in the morning" },
  banque: { name: "Vault & Sons Bank", short: "the Bank", moment: "Before dawn" },
  lune: { name: "The Crescent Moon", short: "the Moon", moment: "Earthrise" },
};

/**
 * Les quatre boutiques. Les enseignes et les titres de civilité restent en français :
 * on est à Grattouille-les-Bains. Le rayon, lui, se dit en anglais.
 */
export const EN_SHOPS: Record<ShopId, { name: string; keeperName: string; blurb: string }> = {
  sidonie: { name: "Maison Sidonie", keeperName: "Mlle Sidonie", blurb: "Fashion" },
  enzo: { name: "Chez Enzo", keeperName: "Enzo", blurb: "Garage and harbour" },
  colette: { name: "Agence Colette", keeperName: "Mme Colette", blurb: "Property" },
  archibald: { name: "Galerie Archibald", keeperName: "Maître Archibald", blurb: "Treasures" },
};

export const EN_SLOT_LABELS: Record<Slot, string> = {
  chapeau: "Hats",
  lunettes: "Glasses",
  tenue: "Outfits",
  accessoire: "Accessories",
  vehicule: "Vehicles",
  residence: "Residences",
  tresor: "Treasures",
};

export const EN_SPECIES: Record<string, string> = {
  renard: "Fox",
  chat: "Cat",
  ours: "Bear",
  lapin: "Rabbit",
  blaireau: "Badger",
  grenouille: "Frog",
  raton: "Raccoon",
  herisson: "Hedgehog",
} satisfies Record<SpeciesId, string>;

/**
 * Rangs, par identifiant de lieu, plus `patron`. De gueux à Crésus : la même ascension,
 * du port à la Lune. Le dernier sert aussi d'adresse (« The Kiosk is yours, Boss. »).
 */
export const EN_RANKS: Record<string, string> = {
  kiosque: "Pauper",
  cafe: "Regular",
  casino: "High roller",
  salon: "Bigwig",
  cercle: "Old money",
  yacht: "Nabob",
  banque: "Tycoon",
  lune: "Croesus",
  patron: "Boss",
} satisfies Record<PlaceId | "patron", string>;

/** Du plus sage au plus fou, en minuscules : ils suivent « temperament: » sur la jauge. */
export const EN_TEMPERAMENTS: Record<Temperament, string> = {
  pepere: "mellow",
  joueur: "playful",
  "casse-cou": "daredevil",
};
