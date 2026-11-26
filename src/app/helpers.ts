// Petites aides partagées par les écrans.

import type { CSSProperties } from "react";
import { oddsLabel } from "../../shared/economy";
import { placeById } from "../../shared/places";
import type { PlaceId, PlayerState, TicketDef } from "../../shared/types";
import { MOTIFS, motifBackground } from "../art/motifs";
import { lang, t } from "../i18n";
import { patronLine, say, type Line, type Situation, type Speaker } from "./dialogues";

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Le dégradé du ciel d'un lieu, de haut en bas (section 4.2). */
export function skyOf(place: PlaceId): string {
  return `linear-gradient(to bottom, ${placeById(place).sky.join(", ")})`;
}

/** Le fond d'un lieu : son motif répété, posé sur son dégradé. */
export function placeBackground(place: PlaceId): CSSProperties {
  const sky = skyOf(place);
  const motif = MOTIFS[place];
  const image = motifBackground(place);
  if (!motif || !image) return { backgroundImage: sky };
  return {
    backgroundImage: `${image}, ${sky}`,
    backgroundSize: `${motif.width}px ${motif.height}px, 100% 100%`,
    backgroundRepeat: "repeat, no-repeat",
  };
}

/**
 * La réplique d'un personnage pour ce joueur. Une fois le Kiosque racheté, Gaspard
 * l'appelle « Patron ».
 */
export function lineFor(player: PlayerState, speaker: Speaker, situation: Situation, seed: number): Line | null {
  if (speaker === "gaspard" && player.kiosk) return patronLine(situation, seed) ?? say(speaker, situation, player.standing, player.pseudo, seed);
  return say(speaker, situation, player.standing, player.pseudo, seed);
}

/** Attend au moins `ms` millisecondes depuis `since`. */
export function atLeast(since: number, ms: number): Promise<void> {
  const left = ms - (performance.now() - since);
  return left > 0 ? new Promise((resolve) => setTimeout(resolve, left)) : Promise.resolve();
}

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Le pluriel français simple : 1 ticket, 2 tickets. Il ne vaut qu'en français : une
 * phrase à traduire prend deux clés, choisies par le code (`n > 1`).
 */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return n > 1 ? plurielForme : singulier;
}

/** Le « 2,6 » de « 1 sur 2,6 », ou le « 2.6 » de « 1 in 2.6 » ; `null` pour un lot qui ne sort jamais. */
function oddsNumber(weight: number): string | null {
  // shared/ n'écrit qu'à la française : « 1 sur 6 667 », « 1 sur 2,6 », « jamais ».
  const label = oddsLabel(weight);
  if (!label.startsWith("1 sur ")) return null;
  const n = label.slice(6);
  // À l'anglaise : le point pour les décimales, la virgule entre les milliers.
  return lang() === "en" ? n.replace(",", ".").replace(/\s/g, ",") : n;
}

/** Les chances d'un lot, dans la langue du jeu : « 1 sur 2,6 », « 1 in 2.6 ». */
export function oddsText(weight: number): string {
  const n = oddsNumber(weight);
  return n === null ? t("jamais") : t("1 sur {n}", { n });
}

/** « 2,6 » : sur combien de tickets un seul gagne. */
export function oddsOutOf(weight: number): string {
  return oddsNumber(weight) ?? "∞";
}

/**
 * Ce qu'il faut savoir du choix à faire avant de gratter (un signe, un arcane, un camp) :
 * il ne change pas les chances. Rend la phrase française, clé de traduction ; `null` pour
 * un ticket sans choix.
 */
export function pickNote(def: TicketDef): string | null {
  if (def.engine === "camps") return "Ton camp ne change pas tes chances. Il change ton cœur.";
  if (def.engine !== "etoile") return null;
  return def.options.family === "arcane"
    ? "Ton arcane ne change pas tes chances. Il change la tête du ticket."
    : "Ton signe ne change pas tes chances. Il change la tête du ticket.";
}
