// Petites aides partagées par les écrans.

import type { CSSProperties } from "react";
import { placeById } from "../../shared/places";
import type { PlaceId, PlayerState } from "../../shared/types";
import { MOTIFS, motifBackground } from "../art/motifs";
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

/** Le pluriel français simple : 1 ticket, 2 tickets. */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return n > 1 ? plurielForme : singulier;
}
