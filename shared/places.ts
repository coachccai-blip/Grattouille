// Les cinq lieux de la Promenade (BRIEF.md, sections 4.2 et 5.3).

import type { PlaceDef, PlaceId } from "./types";

/** Du port à la corniche : du moins chic au plus chic. */
export const PLACES: readonly PlaceDef[] = [
  {
    id: "kiosque", name: "Le Kiosque de Gaspard", short: "le Kiosque", host: "gaspard",
    standing: 0, moment: "Matin", sky: ["#BEE7F5", "#FDF3D0"], text: "nuit",
  },
  {
    id: "cafe", name: "Le Grand Café des Arcades", short: "le Grand Café", host: "ondine",
    standing: 10, moment: "Après-midi", sky: ["#F6D9A8", "#E9A45C"], text: "nuit",
  },
  {
    id: "casino", name: "Le Casino de la Jetée", short: "le Casino", host: "hector",
    standing: 60, moment: "Coucher de soleil", sky: ["#FFB38A", "#C2639A", "#4B3277"], text: "bandeau",
  },
  {
    id: "salon", name: "Le Salon Privé", short: "le Salon Privé", host: "baron",
    standing: 250, moment: "Soir", sky: ["#5A1730", "#2B0B1A"], text: "ecume",
  },
  {
    id: "cercle", name: "Le Cercle des Moustaches", short: "le Cercle", host: "auguste",
    standing: 1000, moment: "Minuit", sky: ["#0B1B33", "#050B18"], text: "ecume",
  },
];

const BY_ID = new Map(PLACES.map((p) => [p.id, p]));

export function placeById(id: PlaceId): PlaceDef {
  return BY_ID.get(id)!;
}

export function isPlaceId(x: unknown): x is PlaceId {
  return typeof x === "string" && BY_ID.has(x as PlaceId);
}
