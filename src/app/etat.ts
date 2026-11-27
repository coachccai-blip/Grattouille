// L'état du joueur tel que l'appareil le lit.
// Pendant une mise à jour, une page neuve peut parler quelques instants à un serveur
// plus ancien, qui ne connaît pas les champs ajoutés depuis. Chaque réponse passe donc
// par ici : ce qui manque reçoit sa valeur par défaut, et le reste du code lit l'état
// sans précaution.

import { PLACES } from "../../shared/places";
import type { PlaceId, PlayerState, PokerStats } from "../../shared/types";

function count(x: unknown): number {
  return typeof x === "number" && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0;
}

/** Complète un état rendu par le serveur. Ne touche à rien de ce qui est déjà là. */
export function completeState(raw: PlayerState): PlayerState {
  const partial = raw as Partial<PlayerState> & Pick<PlayerState, "stats" | "kiosk">;
  const poker = (partial.pokerStats ?? {}) as Partial<PokerStats>;
  const wins: readonly unknown[] = Array.isArray(partial.defis) ? partial.defis : [];
  const defis = PLACES.filter((place) => wins.includes(place.id)).map((place): PlaceId => place.id);
  // Les victoires contre chaque hôte : à défaut, un défi relevé compte pour une.
  const known = (partial.hostWins ?? {}) as Partial<Record<string, unknown>>;
  const hostWins = {} as Record<PlaceId, number>;
  for (const place of PLACES) hostWins[place.id] = Math.max(count(known[place.id]), defis.includes(place.id) ? 1 : 0);
  return {
    ...raw,
    stats: { ...raw.stats, sown: count(raw.stats?.sown), sownValue: count(raw.stats?.sownValue) },
    defis,
    masters: count(partial.masters),
    hostWins,
    story: { fin: partial.story?.fin === true || raw.kiosk === true, vraieFin: partial.story?.vraieFin === true },
    pokerStats: {
      hands: count(poker.hands), pots: count(poker.pots), unmasked: count(poker.unmasked), caught: count(poker.caught),
    },
  };
}

/** Une réponse de l'API : si elle porte l'état du joueur, il est complété au passage. */
export function completeResponse<T>(data: T): T {
  if (typeof data !== "object" || data === null) return data;
  const holder = data as { state?: unknown };
  if (typeof holder.state !== "object" || holder.state === null) return data;
  const state = holder.state as PlayerState;
  // Un état sans statistiques n'est pas celui d'un joueur : on n'y touche pas.
  if (typeof state.stats !== "object" || state.stats === null) return data;
  return { ...data, state: completeState(state) };
}
