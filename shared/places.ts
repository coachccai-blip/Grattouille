// Les huit lieux de la Promenade.
// Les cinq premiers sont ceux du brief (sections 4.2 et 5.3). Les trois derniers
// prolongent la nuit jusqu'au lever de Terre, pour qui est devenu vraiment trop riche.
// Les seuils de Standing sont réglés avec `npm run simulate`.

import type { PlaceDef, PlaceId } from "./types";

/** Du port à la Lune : du moins chic au plus chic. */
export const PLACES: readonly PlaceDef[] = [
  {
    id: "kiosque", name: "Le Kiosque de Gaspard", short: "le Kiosque", host: "gaspard",
    standing: 0, moment: "Matin", sky: ["#BEE7F5", "#FDF3D0"], text: "nuit",
  },
  {
    id: "cafe", name: "Le Grand Café des Arcades", short: "le Grand Café", host: "ondine",
    standing: 20, moment: "Après-midi", sky: ["#F6D9A8", "#E9A45C"], text: "nuit",
  },
  {
    id: "casino", name: "Le Casino de la Jetée", short: "le Casino", host: "hector",
    standing: 130, moment: "Coucher de soleil", sky: ["#FFB38A", "#C2639A", "#4B3277"], text: "bandeau",
  },
  {
    id: "salon", name: "Le Salon Privé", short: "le Salon Privé", host: "baron",
    standing: 400, moment: "Soir", sky: ["#5A1730", "#2B0B1A"], text: "ecume",
  },
  {
    id: "cercle", name: "Le Cercle des Moustaches", short: "le Cercle", host: "auguste",
    standing: 1_400, moment: "Minuit", sky: ["#0B1B33", "#050B18"], text: "ecume",
  },
  {
    id: "yacht", name: "Le Yacht « Démesure »", short: "le Yacht", host: "balthazar",
    standing: 5_000, moment: "Deux heures du matin", sky: ["#0A2A3F", "#03101C"], text: "ecume",
  },
  {
    id: "banque", name: "La Banque Coffre & Fils", short: "la Banque", host: "taupin",
    standing: 15_000, moment: "Avant l'aube", sky: ["#33424B", "#141B20"], text: "ecume",
  },
  {
    id: "lune", name: "Le Croissant de Lune", short: "la Lune", host: "selene",
    standing: 40_000, moment: "Lever de Terre", sky: ["#1B1440", "#07061A"], text: "ecume",
  },
];

const BY_ID = new Map(PLACES.map((p) => [p.id, p]));

export function placeById(id: PlaceId): PlaceDef {
  return BY_ID.get(id)!;
}

export function isPlaceId(x: unknown): x is PlaceId {
  return typeof x === "string" && BY_ID.has(x as PlaceId);
}
