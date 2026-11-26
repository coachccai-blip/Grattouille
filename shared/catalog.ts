// Catalogue : les 110 biens et le Kiosque.
// 52 biens sont ceux de l'annexe A du brief, inchangés (prix, ★, boutique).
// Les 58 autres étendent le jeu aux deux bouts : de quoi commencer en gueux
// (une ficelle, un chapeau en papier journal) et finir ultra-riche (une comète
// apprivoisée). Les valeurs sont écrites en dur et font foi :
// 167 930 679 468 784 € et 67 578 ★, puis 417,93 Bn€ et 80 000 ★ avec le Kiosque.

import type { ItemDef, ShopId, Slot } from "./types";

const M = 1_000_000;
const MD = 1_000_000_000;
/** Un billion : mille milliards. */
const BN = 1_000_000_000_000;

/**
 * Barème de Standing, selon le prix. Jusqu'à 500 M€, c'est celui de l'annexe A ;
 * il se prolonge au-delà, et les babioles à moins de 5 € ne rapportent que 1 ★.
 */
export const STANDING_SCALE: readonly (readonly [number, number])[] = [
  [5, 1], [10, 2], [50, 3], [200, 5], [1_000, 8], [5_000, 12], [20_000, 18], [100_000, 25], [500_000, 40],
  [2 * M, 60], [10 * M, 90], [50 * M, 130], [200 * M, 200], [500 * M, 300], [2 * MD, 400],
  [10 * MD, 600], [50 * MD, 900], [200 * MD, 1_300], [1_000 * MD, 2_000], [5 * BN, 3_000],
];
export const STANDING_TOP = 4_000;

/** Les ★ d'un bien de ce prix. */
export function standingForPrice(price: number): number {
  for (const [limit, stars] of STANDING_SCALE) if (price < limit) return stars;
  return STANDING_TOP;
}

export const CATALOG: readonly ItemDef[] = [
  // Maison Sidonie : chapeaux
  { id: "beret", name: "Béret de marin", shop: "sidonie", slot: "chapeau", price: 8, standing: 2 },
  { id: "canotier", name: "Canotier", shop: "sidonie", slot: "chapeau", price: 35, standing: 3 },
  { id: "melon", name: "Chapeau melon", shop: "sidonie", slot: "chapeau", price: 400, standing: 8 },
  { id: "haut-de-forme", name: "Haut-de-forme en soie", shop: "sidonie", slot: "chapeau", price: 9_000, standing: 18 },
  { id: "bicorne", name: "Bicorne d'apparat", shop: "sidonie", slot: "chapeau", price: 350_000, standing: 40 },
  { id: "couronne", name: "Couronne en or massif", shop: "sidonie", slot: "chapeau", price: 60 * M, standing: 200 },
  { id: "chapeau-journal", name: "Chapeau en papier journal", shop: "sidonie", slot: "chapeau", price: 2, standing: 1 },
  { id: "panama", name: "Panama", shop: "sidonie", slot: "chapeau", price: 120, standing: 5 },
  { id: "casquette-capitaine", name: "Casquette de capitaine", shop: "sidonie", slot: "chapeau", price: 4_500, standing: 12 },
  { id: "tiare", name: "Tiare de saphirs", shop: "sidonie", slot: "chapeau", price: 900 * M, standing: 400 },
  { id: "casque-scaphandre", name: "Casque de scaphandre doré", shop: "sidonie", slot: "chapeau", price: 30 * MD, standing: 900 },
  { id: "aureole", name: "Auréole (authentique)", shop: "sidonie", slot: "chapeau", price: 3 * BN, standing: 3000 },
  { id: "anneaux-saturne", name: "Couronne d'anneaux de Saturne", shop: "sidonie", slot: "chapeau", price: 30 * BN, standing: 4000 },

  // Maison Sidonie : lunettes
  { id: "lunettes-rondes", name: "Lunettes rondes", shop: "sidonie", slot: "lunettes", price: 12, standing: 3 },
  { id: "solaires-ecaille", name: "Solaires en écaille", shop: "sidonie", slot: "lunettes", price: 90, standing: 5 },
  { id: "monocle", name: "Monocle", shop: "sidonie", slot: "lunettes", price: 1_200, standing: 12 },
  { id: "lorgnon", name: "Lorgnon en or", shop: "sidonie", slot: "lunettes", price: 30_000, standing: 25 },
  { id: "solaires-diamants", name: "Solaires serties de diamants", shop: "sidonie", slot: "lunettes", price: 900_000, standing: 60 },
  { id: "monocle-saphir", name: "Monocle en saphir", shop: "sidonie", slot: "lunettes", price: 40 * M, standing: 130 },
  { id: "lunettes-carton", name: "Lunettes en carton", shop: "sidonie", slot: "lunettes", price: 3, standing: 1 },
  { id: "lunettes-aviateur", name: "Lunettes d'aviateur", shop: "sidonie", slot: "lunettes", price: 500, standing: 8 },
  { id: "jumelles-opera", name: "Jumelles d'opéra", shop: "sidonie", slot: "lunettes", price: 150_000, standing: 40 },
  { id: "lunettes-rubis", name: "Lunettes à verres de rubis", shop: "sidonie", slot: "lunettes", price: 400 * M, standing: 300 },
  { id: "visiere-cosmonaute", name: "Visière de cosmonaute", shop: "sidonie", slot: "lunettes", price: 12 * MD, standing: 900 },
  { id: "lunettes-etoiles", name: "Lunettes à poussière d'étoiles", shop: "sidonie", slot: "lunettes", price: 800 * MD, standing: 2000 },
  { id: "monocle-telescope", name: "Monocle-télescope", shop: "sidonie", slot: "lunettes", price: 12 * BN, standing: 4000 },

  // Maison Sidonie : tenues
  { id: "mariniere", name: "Marinière", shop: "sidonie", slot: "tenue", price: 15, standing: 3 },
  { id: "veston-tweed", name: "Veston en tweed", shop: "sidonie", slot: "tenue", price: 150, standing: 5 },
  { id: "trois-pieces", name: "Costume trois-pièces", shop: "sidonie", slot: "tenue", price: 2_500, standing: 12 },
  { id: "smoking", name: "Smoking sur mesure", shop: "sidonie", slot: "tenue", price: 60_000, standing: 25 },
  { id: "queue-de-pie", name: "Queue-de-pie brodée d'or", shop: "sidonie", slot: "tenue", price: 2 * M, standing: 90 },
  { id: "cape-imperiale", name: "Cape de velours impériale", shop: "sidonie", slot: "tenue", price: 80 * M, standing: 200 },
  { id: "sac-a-patates", name: "Sac à patates", shop: "sidonie", slot: "tenue", price: 3, standing: 1 },
  { id: "cire", name: "Ciré de pêcheur", shop: "sidonie", slot: "tenue", price: 45, standing: 3 },
  { id: "peignoir", name: "Peignoir de palace", shop: "sidonie", slot: "tenue", price: 12_000, standing: 18 },
  { id: "habit-amiral", name: "Habit d'amiral", shop: "sidonie", slot: "tenue", price: 9 * M, standing: 90 },
  { id: "hermine", name: "Manteau d'hermine", shop: "sidonie", slot: "tenue", price: 1.5 * MD, standing: 400 },
  { id: "combinaison-spatiale", name: "Combinaison spatiale sur mesure", shop: "sidonie", slot: "tenue", price: 1.5 * BN, standing: 3000 },
  { id: "cape-aurore", name: "Cape en aurore boréale", shop: "sidonie", slot: "tenue", price: 15 * BN, standing: 4000 },

  // Maison Sidonie : accessoires
  { id: "noeud-pap", name: "Nœud papillon", shop: "sidonie", slot: "accessoire", price: 5, standing: 2 },
  { id: "foulard", name: "Foulard en soie", shop: "sidonie", slot: "accessoire", price: 60, standing: 5 },
  { id: "gousset", name: "Montre à gousset", shop: "sidonie", slot: "accessoire", price: 800, standing: 8 },
  { id: "perles", name: "Collier de perles", shop: "sidonie", slot: "accessoire", price: 20_000, standing: 25 },
  { id: "tourbillon", name: "Montre à tourbillon", shop: "sidonie", slot: "accessoire", price: 750_000, standing: 60 },
  { id: "sautoir", name: "Sautoir de diamants", shop: "sidonie", slot: "accessoire", price: 25 * M, standing: 130 },
  { id: "ficelle", name: "Ficelle à rôti", shop: "sidonie", slot: "accessoire", price: 1, standing: 1 },
  { id: "echarpe", name: "Écharpe tricotée", shop: "sidonie", slot: "accessoire", price: 25, standing: 3 },
  { id: "canne", name: "Canne à pommeau d'argent", shop: "sidonie", slot: "accessoire", price: 4_000, standing: 12 },
  { id: "grand-cordon", name: "Grand cordon de l'Ordre du Homard", shop: "sidonie", slot: "accessoire", price: 250 * M, standing: 300 },
  { id: "sceptre", name: "Sceptre serti", shop: "sidonie", slot: "accessoire", price: 8 * MD, standing: 600 },
  { id: "pendentif-lune", name: "Pendentif en pierre de Lune", shop: "sidonie", slot: "accessoire", price: 400 * MD, standing: 2000 },
  { id: "collier-planetes", name: "Collier de planètes", shop: "sidonie", slot: "accessoire", price: 25 * BN, standing: 4000 },

  // Chez Enzo : garage et port
  { id: "velo", name: "Vélo d'occasion", shop: "enzo", slot: "vehicule", price: 40, standing: 3 },
  { id: "scooter", name: "Scooter pétaradant", shop: "enzo", slot: "vehicule", price: 900, standing: 8 },
  { id: "citadine", name: "Citadine « La Puce »", shop: "enzo", slot: "vehicule", price: 6_000, standing: 18 },
  { id: "cabriolet", name: "Cabriolet « Tramontane »", shop: "enzo", slot: "vehicule", price: 45_000, standing: 25 },
  { id: "berline", name: "Berline « Grand Large »", shop: "enzo", slot: "vehicule", price: 180_000, standing: 40 },
  { id: "coupe", name: "Coupé « Fauve GT »", shop: "enzo", slot: "vehicule", price: 650_000, standing: 60 },
  { id: "supercar", name: "Supercar « Éclair V12 »", shop: "enzo", slot: "vehicule", price: 4 * M, standing: 90 },
  { id: "hypercar", name: "Hypercar « Comète »", shop: "enzo", slot: "vehicule", price: 18 * M, standing: 130 },
  { id: "yacht", name: "Yacht « La Sirène »", shop: "enzo", slot: "vehicule", price: 120 * M, standing: 200 },
  { id: "jet", name: "Jet privé « Albatros »", shop: "enzo", slot: "vehicule", price: 350 * M, standing: 300 },
  { id: "caddie", name: "Caddie de supermarché", shop: "enzo", slot: "vehicule", price: 6, standing: 2 },
  { id: "pedalo", name: "Pédalo « Le Cygne »", shop: "enzo", slot: "vehicule", price: 250, standing: 8 },
  { id: "helicoptere", name: "Hélicoptère « Libellule »", shop: "enzo", slot: "vehicule", price: 70 * M, standing: 200 },
  { id: "sous-marin", name: "Sous-marin de poche", shop: "enzo", slot: "vehicule", price: 2 * MD, standing: 600 },
  { id: "dirigeable", name: "Dirigeable « Grand Nuage »", shop: "enzo", slot: "vehicule", price: 15 * MD, standing: 900 },
  { id: "paquebot", name: "Paquebot « Démesure II »", shop: "enzo", slot: "vehicule", price: 90 * MD, standing: 1300 },
  { id: "fusee", name: "Fusée « Grattouille One »", shop: "enzo", slot: "vehicule", price: 600 * MD, standing: 2000 },
  { id: "soucoupe", name: "Soucoupe volante d'occasion", shop: "enzo", slot: "vehicule", price: 6 * BN, standing: 4000 },
  { id: "comete", name: "Comète apprivoisée", shop: "enzo", slot: "vehicule", price: 40 * BN, standing: 4000 },

  // Agence Colette : résidences
  { id: "chambre-de-bonne", name: "Chambre de bonne", shop: "colette", slot: "residence", price: 3_000, standing: 12 },
  { id: "studio", name: "Studio sous les toits", shop: "colette", slot: "residence", price: 25_000, standing: 25 },
  { id: "appartement", name: "Appartement avec balcon", shop: "colette", slot: "residence", price: 120_000, standing: 40 },
  { id: "maison-pecheur", name: "Maison de pêcheur", shop: "colette", slot: "residence", price: 400_000, standing: 40 },
  { id: "loft", name: "Loft sur le port", shop: "colette", slot: "residence", price: 1_500_000, standing: 60 },
  { id: "villa-mimosas", name: "Villa « Les Mimosas »", shop: "colette", slot: "residence", price: 8 * M, standing: 90 },
  { id: "hotel-particulier", name: "Hôtel particulier", shop: "colette", slot: "residence", price: 30 * M, standing: 130 },
  { id: "villa-corniche", name: "Villa de la Corniche", shop: "colette", slot: "residence", price: 90 * M, standing: 200 },
  { id: "chateau", name: "Château de Belle-Rive", shop: "colette", slot: "residence", price: 300 * M, standing: 300 },
  { id: "ile", name: "Île privée", shop: "colette", slot: "residence", price: 800 * M, standing: 400 },
  { id: "carton", name: "Carton sous le ponton", shop: "colette", slot: "residence", price: 10, standing: 3 },
  { id: "tente", name: "Tente de plage", shop: "colette", slot: "residence", price: 80, standing: 5 },
  { id: "cabine", name: "Cabine de plage", shop: "colette", slot: "residence", price: 700, standing: 8 },
  { id: "palais", name: "Palais sur la lagune", shop: "colette", slot: "residence", price: 5 * MD, standing: 600 },
  { id: "tour", name: "Tour à ton nom", shop: "colette", slot: "residence", price: 40 * MD, standing: 900 },
  { id: "archipel", name: "Archipel privé", shop: "colette", slot: "residence", price: 250 * MD, standing: 2000 },
  { id: "station-orbitale", name: "Station orbitale", shop: "colette", slot: "residence", price: 2 * BN, standing: 3000 },
  { id: "base-lunaire", name: "Base lunaire « Mer de la Tranquillité »", shop: "colette", slot: "residence", price: 10 * BN, standing: 4000 },

  // Galerie Archibald : trésors
  { id: "coquillage", name: "Coquillage porte-bonheur", shop: "archibald", slot: "tresor", price: 20, standing: 3 },
  { id: "affiche", name: "Affiche ancienne du Casino", shop: "archibald", slot: "tresor", price: 300, standing: 8 },
  { id: "vase", name: "Vase en porcelaine", shop: "archibald", slot: "tresor", price: 5_000, standing: 18 },
  { id: "tableau", name: "Tableau « Nature morte au homard »", shop: "archibald", slot: "tresor", price: 70_000, standing: 25 },
  { id: "statue", name: "Statue en bronze", shop: "archibald", slot: "tresor", price: 900_000, standing: 60 },
  { id: "oeuf", name: "Œuf d'orfèvre", shop: "archibald", slot: "tresor", price: 12 * M, standing: 130 },
  { id: "fresque", name: "Fresque de maître", shop: "archibald", slot: "tresor", price: 100 * M, standing: 200 },
  { id: "diamant", name: "Diamant « L'Étoile du Port »", shop: "archibald", slot: "tresor", price: 500 * M, standing: 400 },
  { id: "capsule", name: "Capsule porte-bonheur", shop: "archibald", slot: "tresor", price: 2, standing: 1 },
  { id: "galet", name: "Galet en forme de cœur", shop: "archibald", slot: "tresor", price: 7, standing: 2 },
  { id: "boule-a-neige", name: "Boule à neige de Grattouille", shop: "archibald", slot: "tresor", price: 45, standing: 3 },
  { id: "nain", name: "Nain de jardin", shop: "archibald", slot: "tresor", price: 150, standing: 5 },
  { id: "maquette", name: "Maquette de voilier", shop: "archibald", slot: "tresor", price: 1_800, standing: 12 },
  { id: "pendule", name: "Pendule de cheminée", shop: "archibald", slot: "tresor", price: 15_000, standing: 18 },
  { id: "tapis", name: "Tapis d'Orient", shop: "archibald", slot: "tresor", price: 250_000, standing: 40 },
  { id: "armure", name: "Armure de chevalier", shop: "archibald", slot: "tresor", price: 5 * M, standing: 90 },
  { id: "dinosaure", name: "Squelette de dinosaure", shop: "archibald", slot: "tresor", price: 3 * MD, standing: 600 },
  { id: "meteorite", name: "Météorite", shop: "archibald", slot: "tresor", price: 20 * MD, standing: 900 },
  { id: "trone", name: "Trône en or massif", shop: "archibald", slot: "tresor", price: 150 * MD, standing: 1300 },
  { id: "morceau-de-lune", name: "Morceau de Lune", shop: "archibald", slot: "tresor", price: 1 * BN, standing: 3000 },
  { id: "etoile-a-ton-nom", name: "Étoile à ton nom", shop: "archibald", slot: "tresor", price: 20 * BN, standing: 4000 },
];

/**
 * Le Kiosque de Gaspard : en vente quand la collection est complète (section 9.6).
 * Gaspard est dur en affaires : son kiosque vaut plus cher que tout le reste réuni.
 */
export const KIOSK: ItemDef = {
  id: "kiosque", name: "Le Kiosque de Gaspard", shop: "colette", slot: "residence",
  price: 250 * BN, standing: 12_422,
};

export const COLLECTION_SIZE = CATALOG.length; // 110

const BY_ID = new Map(CATALOG.map((i) => [i.id, i]));

export function itemById(id: string): ItemDef | undefined {
  return BY_ID.get(id);
}

/** Les articles d'une boutique, par prix croissant. */
export function itemsOfShop(shop: ShopId): ItemDef[] {
  return CATALOG.filter((i) => i.shop === shop).sort((a, b) => a.price - b.price);
}

export function itemsOfSlot(slot: Slot): ItemDef[] {
  return CATALOG.filter((i) => i.slot === slot).sort((a, b) => a.price - b.price);
}

export interface ShopDef {
  id: ShopId;
  name: string;
  keeper: string; // identifiant du personnage
  keeperName: string;
  blurb: string;
  slots: readonly Slot[];
}

export const SHOPS: readonly ShopDef[] = [
  { id: "sidonie", name: "Maison Sidonie", keeper: "sidonie", keeperName: "Mlle Sidonie", blurb: "La garde-robe", slots: ["chapeau", "lunettes", "tenue", "accessoire"] },
  { id: "enzo", name: "Chez Enzo", keeper: "enzo", keeperName: "Enzo", blurb: "Garage et port", slots: ["vehicule"] },
  { id: "colette", name: "Agence Colette", keeper: "colette", keeperName: "Mme Colette", blurb: "L'immobilier", slots: ["residence"] },
  { id: "archibald", name: "Galerie Archibald", keeper: "archibald", keeperName: "Maître Archibald", blurb: "Les trésors", slots: ["tresor"] },
];

export function shopById(id: ShopId): ShopDef {
  return SHOPS.find((s) => s.id === id)!;
}

export const SLOT_LABELS: Record<Slot, string> = {
  chapeau: "Chapeaux",
  lunettes: "Lunettes",
  tenue: "Tenues",
  accessoire: "Accessoires",
  vehicule: "Véhicules",
  residence: "Résidences",
  tresor: "Trésors",
};
