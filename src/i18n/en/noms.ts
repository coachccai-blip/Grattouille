// Anglais — les noms tirés des données de shared/ : tickets, biens, lieux, boutiques,
// emplacements, espèces, rangs, tempéraments. Clé : l'identifiant.

import type { PlaceId, ShopId, Slot, Temperament } from "../../../shared/types";

export const EN_TICKET_NAMES: Record<string, string> = {};
export const EN_ITEM_NAMES: Record<string, string> = {};

export const EN_PLACES: Partial<Record<PlaceId, { name: string; short: string; moment: string }>> = {};
export const EN_SHOPS: Partial<Record<ShopId, { name: string; keeperName: string; blurb: string }>> = {};
export const EN_SLOT_LABELS: Partial<Record<Slot, string>> = {};
export const EN_SPECIES: Record<string, string> = {};
/** Rangs, par identifiant de lieu, plus `patron`. */
export const EN_RANKS: Record<string, string> = {};
export const EN_TEMPERAMENTS: Partial<Record<Temperament, string>> = {};
