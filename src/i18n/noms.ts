// Les noms tirés des données de shared/, dans la langue courante.
// En français, ce sont ceux de shared/ ; en anglais, ceux de en/noms.ts. Un nom
// anglais manquant retombe sur le français et se signale dans `i18nMisses()`.

import { SLOT_LABELS, itemById, shopById } from "../../shared/catalog";
import { TEMPERAMENT_LABELS } from "../../shared/economy";
import { placeById } from "../../shared/places";
import { SPECIES_LABELS, bestPlace, rankOf, type SpeciesId } from "../../shared/rules";
import { ticketById } from "../../shared/tickets";
import type { PlaceId, ShopId, Slot, Temperament } from "../../shared/types";
import {
  EN_ITEM_NAMES, EN_PLACES, EN_RANKS, EN_SHOPS, EN_SLOT_LABELS, EN_SPECIES, EN_TEMPERAMENTS, EN_TICKET_NAMES,
} from "./en/noms";
import { lang, missed } from "./index";

function en<T>(value: T | undefined, what: string, fallback: T): T {
  if (lang() !== "en") return fallback;
  if (value === undefined) {
    missed(what);
    return fallback;
  }
  return value;
}

/** « La Tirelire de Piou ». */
export function ticketName(id: string): string {
  return en(EN_TICKET_NAMES[id], `ticket:${id}`, ticketById(id)?.name ?? id);
}

/** « Chapeau en papier journal ». Le Kiosque a pour identifiant `kiosque`. */
export function itemName(id: string): string {
  return en(EN_ITEM_NAMES[id], `item:${id}`, id === "kiosque" ? placeById("kiosque").name : (itemById(id)?.name ?? id));
}

/** Nom complet : « Le Casino de la Jetée ». */
export function placeName(id: PlaceId): string {
  return en(EN_PLACES[id]?.name, `place:${id}`, placeById(id).name);
}

/** Nom court, en cours de phrase : « le Casino ». */
export function placeShort(id: PlaceId): string {
  return en(EN_PLACES[id]?.short, `place:${id}:short`, placeById(id).short);
}

/** Le moment de la journée : « Coucher de soleil ». */
export function placeMoment(id: PlaceId): string {
  return en(EN_PLACES[id]?.moment, `place:${id}:moment`, placeById(id).moment);
}

export function shopName(id: ShopId): string {
  return en(EN_SHOPS[id]?.name, `shop:${id}`, shopById(id).name);
}

/** « Mlle Sidonie ». */
export function keeperName(id: ShopId): string {
  return en(EN_SHOPS[id]?.keeperName, `shop:${id}:keeper`, shopById(id).keeperName);
}

/** « La garde-robe ». */
export function shopBlurb(id: ShopId): string {
  return en(EN_SHOPS[id]?.blurb, `shop:${id}:blurb`, shopById(id).blurb);
}

/** « Chapeaux ». */
export function slotLabel(slot: Slot): string {
  return en(EN_SLOT_LABELS[slot], `slot:${slot}`, SLOT_LABELS[slot]);
}

/** « Raton laveur ». */
export function speciesName(id: string): string {
  return en(EN_SPECIES[id], `species:${id}`, SPECIES_LABELS[id as SpeciesId] ?? id);
}

/** Le rang sous le pseudo : « Gueux », …, « Patron ». */
export function rankName(standing: number, kiosk: boolean): string {
  const key = kiosk ? "patron" : bestPlace(standing).id;
  return en(EN_RANKS[key], `rank:${key}`, rankOf(standing, kiosk));
}

/** « pépère », « joueur », « casse-cou ». */
export function temperamentName(temperament: Temperament): string {
  return en(EN_TEMPERAMENTS[temperament], `temperament:${temperament}`, TEMPERAMENT_LABELS[temperament]);
}
