// L'entrée de la vitrine des trophées, posée sur le ciel du Domaine, en haut à droite : une
// petite plaque de laiton qui dit où en est le joueur (« 12/38 ») et, dessous, une pastille
// quand des médailles n'ont pas encore été regardées (« 3 nouvelles »). Chargée au
// démarrage : elle ne connaît ni les dessins ni les noms des médailles, seulement leur compte.

import { MEDAL_COUNT, medalsOf } from "../../../shared/trophies";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { medaillesNouvelles, useVues } from "../../app/trophees";
import { Etoile } from "../../art/icons";
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
      <span className="entree-trophees__plaque" aria-hidden="true">
        {/* Une médaille et son ruban, dessinés par la feuille de style. */}
        <span className="entree-trophees__medaille"><Etoile /></span>
        <span className="chiffres">{n}/{MEDAL_COUNT}</span>
      </span>
      {/* La pastille, sous la plaque. Elle porte son compte en clé : elle rebondit chaque fois qu'il change. */}
      {neuves > 0 && (
        <span key={neuves} className="entree-trophees__pastille" aria-hidden="true">
          {neuves > 1 ? t("{n} nouvelles", { n: neuves }) : t("1 nouvelle")}
        </span>
      )}
    </button>
  );
}
