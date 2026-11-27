// L'entrée de la vitrine des trophées, posée sur le ciel du Domaine : une petite plaque de
// laiton qui dit où en est le joueur (« 12/38 »), et une pastille quand des médailles
// n'ont pas encore été regardées (« 3 nouvelles »). Chargée au démarrage : elle ne connaît
// ni les dessins ni les noms des médailles, seulement leur compte.

import { MEDAL_COUNT, medalsOf } from "../../../shared/trophies";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { medaillesNouvelles, useVues } from "../../app/trophees";
import { t } from "../../i18n";
import "./entree.css";

export function EntreeTrophees() {
  const player = useGame((s) => s.player);
  const vues = useVues();
  if (!player) return null;
  const n = medalsOf(player).length;
  const neuves = medaillesNouvelles(player, vues).length;
  return (
    <button
      type="button"
      className="entree-trophees"
      onClick={() => nav.push({ name: "trophees" })}
      aria-label={neuves > 0
        ? t("Trophées : {n} sur {total}, {neuves} à découvrir", { n, total: MEDAL_COUNT, neuves })
        : t("Trophées : {n} sur {total}", { n, total: MEDAL_COUNT })}
    >
      {/* La pastille porte son compte en clé : elle rebondit chaque fois qu'il change. */}
      {neuves > 0 && (
        <span key={neuves} className="entree-trophees__pastille" aria-hidden="true">
          {neuves > 1 ? t("{n} nouvelles", { n: neuves }) : t("1 nouvelle")}
        </span>
      )}
      <span className="entree-trophees__plaque" aria-hidden="true">
        {/* Une médaille et son ruban. */}
        <svg width="18" height="22" viewBox="0 0 18 22" focusable="false">
          <path d="M4 0H14V8L9 12L4 8Z" fill="#B02A5F" />
          <circle cx="9" cy="14" r="7" fill="currentColor" />
          <path d="M9 9.8l1.3 2.7 2.9.4-2.1 2 .5 2.9L9 16.4l-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#D9B866" />
        </svg>
        <span className="chiffres">{n}/{MEDAL_COUNT}</span>
      </span>
    </button>
  );
}
