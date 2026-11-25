// Catalogue : les 52 biens et le Kiosque (BRIEF.md, annexe A).
// Les valeurs sont écrites en dur et font foi : 2 545 029 535 € et 4 086 ★,
// puis 3,55 Md€ et 5 000 ★ avec le Kiosque.

import type { ItemDef, ShopId, Slot } from "./types";

const M = 1_000_000;

export const CATALOG: readonly ItemDef[] = [
  // Maison Sidonie : chapeaux
  { id: "beret", name: "Béret de marin", shop: "sidonie", slot: "chapeau", price: 8, standing: 2 },
  { id: "canotier", name: "Canotier", shop: "sidonie", slot: "chapeau", price: 35, standing: 3 },
  { id: "melon", name: "Chapeau melon", shop: "sidonie", slot: "chapeau", price: 400, standing: 8 },
  { id: "haut-de-forme", name: "Haut-de-forme en soie", shop: "sidonie", slot: "chapeau", price: 9_000, standing: 18 },
  { id: "bicorne", name: "Bicorne d'apparat", shop: "sidonie", slot: "chapeau", price: 350_000, standing: 40 },
  { id: "couronne", name: "Couronne en or massif", shop: "sidonie", slot: "chapeau", price: 60 * M, standing: 200 },

  // Maison Sidonie : lunettes
  { id: "lunettes-rondes", name: "Lunettes rondes", shop: "sidonie", slot: "lunettes", price: 12, standing: 3 },
  { id: "solaires-ecaille", name: "Solaires en écaille", shop: "sidonie", slot: "lunettes", price: 90, standing: 5 },
  { id: "monocle", name: "Monocle", shop: "sidonie", slot: "lunettes", price: 1_200, standing: 12 },
  { id: "lorgnon", name: "Lorgnon en or", shop: "sidonie", slot: "lunettes", price: 30_000, standing: 25 },
  { id: "solaires-diamants", name: "Solaires serties de diamants", shop: "sidonie", slot: "lunettes", price: 900_000, standing: 60 },
  { id: "monocle-saphir", name: "Monocle en saphir", shop: "sidonie", slot: "lunettes", price: 40 * M, standing: 130 },

  // Maison Sidonie : tenues
  { id: "mariniere", name: "Marinière", shop: "sidonie", slot: "tenue", price: 15, standing: 3 },
  { id: "veston-tweed", name: "Veston en tweed", shop: "sidonie", slot: "tenue", price: 150, standing: 5 },
  { id: "trois-pieces", name: "Costume trois-pièces", shop: "sidonie", slot: "tenue", price: 2_500, standing: 12 },
  { id: "smoking", name: "Smoking sur mesure", shop: "sidonie", slot: "tenue", price: 60_000, standing: 25 },
  { id: "queue-de-pie", name: "Queue-de-pie brodée d'or", shop: "sidonie", slot: "tenue", price: 2 * M, standing: 90 },
  { id: "cape-imperiale", name: "Cape de velours impériale", shop: "sidonie", slot: "tenue", price: 80 * M, standing: 200 },

  // Maison Sidonie : accessoires
  { id: "noeud-pap", name: "Nœud papillon", shop: "sidonie", slot: "accessoire", price: 5, standing: 2 },
  { id: "foulard", name: "Foulard en soie", shop: "sidonie", slot: "accessoire", price: 60, standing: 5 },
  { id: "gousset", name: "Montre à gousset", shop: "sidonie", slot: "accessoire", price: 800, standing: 8 },
  { id: "perles", name: "Collier de perles", shop: "sidonie", slot: "accessoire", price: 20_000, standing: 25 },
  { id: "tourbillon", name: "Montre à tourbillon", shop: "sidonie", slot: "accessoire", price: 750_000, standing: 60 },
  { id: "sautoir", name: "Sautoir de diamants", shop: "sidonie", slot: "accessoire", price: 25 * M, standing: 130 },

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

  // Galerie Archibald : trésors
  { id: "coquillage", name: "Coquillage porte-bonheur", shop: "archibald", slot: "tresor", price: 20, standing: 3 },
  { id: "affiche", name: "Affiche ancienne du Casino", shop: "archibald", slot: "tresor", price: 300, standing: 8 },
  { id: "vase", name: "Vase en porcelaine", shop: "archibald", slot: "tresor", price: 5_000, standing: 18 },
  { id: "tableau", name: "Tableau « Nature morte au homard »", shop: "archibald", slot: "tresor", price: 70_000, standing: 25 },
  { id: "statue", name: "Statue en bronze", shop: "archibald", slot: "tresor", price: 900_000, standing: 60 },
  { id: "oeuf", name: "Œuf d'orfèvre", shop: "archibald", slot: "tresor", price: 12 * M, standing: 130 },
  { id: "fresque", name: "Fresque de maître", shop: "archibald", slot: "tresor", price: 100 * M, standing: 200 },
  { id: "diamant", name: "Diamant « L'Étoile du Port »", shop: "archibald", slot: "tresor", price: 500 * M, standing: 400 },
];

/** Le Kiosque de Gaspard : en vente quand la collection est complète (section 9.6). */
export const KIOSK: ItemDef = {
  id: "kiosque", name: "Le Kiosque de Gaspard", shop: "colette", slot: "residence",
  price: 1_000_000_000, standing: 914,
};

export const COLLECTION_SIZE = CATALOG.length; // 52

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
