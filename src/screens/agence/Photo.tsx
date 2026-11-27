// La photo d'une expérience de vie : sa scène, figée dans le cadre de sa carte postale
// (360 × 450). C'est l'image que le film laisse derrière lui, et celle que l'album range
// dans la section Trophées : le joueur y tient son rôle, avec sa tête du jour et ce qu'il
// porte.
//
// Rien n'y bouge (film.css fige tout ce qui porte `xp-photo`). Ce module arrive avec le
// morceau des films (films.ts) : les trente scènes pèsent trop pour le catalogue.

import { memo } from "react";
import { useGame } from "../../app/store";
import type { AvatarLook } from "../../art/Avatar";
import { SCENES } from "../../art/agence/scenes";
import { cx } from "../../ticket/parts";
import "./film.css";

/** Le cadre de la carte postale, quand la scène n'en choisit pas un : le milieu du dessin. */
export const CADRE = 175;

/** Le cadre d'une scène sur sa carte postale, tel qu'un `viewBox` le veut : 360 × 450. */
export function cadreDe(experience: string): string {
  return `0 ${SCENES[experience]?.cadre ?? CADRE} 360 450`;
}

/** Un joueur qui ne porte rien : la même tenue vide d'un rendu à l'autre. */
const SANS_RIEN: AvatarLook = {};

/**
 * La photo d'une expérience, à la taille de ce qui la contient (en 4:5). Une expérience que
 * ce jeu ne connaît pas ne montre rien.
 */
export const Photo = memo(function Photo({ experience, className }: { experience: string; className?: string }) {
  const espece = useGame((s) => s.player?.species ?? "renard");
  const look = useGame((s) => s.player?.look) ?? SANS_RIEN;
  const scene = SCENES[experience];
  if (!scene) return null;
  return (
    <svg
      className={cx("xp-photo", className)}
      viewBox={cadreDe(experience)}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <scene.Art espece={espece} look={look} />
    </svg>
  );
});
