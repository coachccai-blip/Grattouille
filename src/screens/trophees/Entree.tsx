// L'entrée de la section Trophées, posée sur le ciel du Domaine, en haut à droite : une
// petite plaque de laiton qui dit où en est le joueur (« 12/42 ») et, dessous, une pastille
// quand il y a du nouveau (« 3 nouvelles ») : des médailles pas encore regardées, ou des
// histoires d'hôtes pas encore écoutées (les souvenirs sont le second rayon de la section).
// Chargée au démarrage : elle ne connaît ni les dessins ni les noms, seulement les comptes.

import { MEDAL_COUNT, medalsOf } from "../../../shared/trophies";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { medaillesNouvelles, useVues } from "../../app/trophees";
import { Etoile } from "../../art/icons";
import { t } from "../../i18n";
import { useHistoiresEnAttente } from "../../ui/Rayons";
import "./entree.css";

export function EntreeTrophees() {
  const player = useGame((s) => s.player);
  const vues = useVues();
  const histoires = useHistoiresEnAttente();
  if (!player) return null;
  const n = medalsOf(player).length;
  const medailles = medaillesNouvelles(player, vues).length;
  // La pastille compte tout ce qui est nouveau dans la section : médailles et histoires.
  const neuves = medailles + histoires;
  return (
    <button
      type="button"
      className="entree-trophees"
      // S'il n'y a de neuf que des histoires, on arrive droit sur les souvenirs.
      onClick={() => nav.push({ name: medailles === 0 && histoires > 0 ? "souvenirs" : "trophees" })}
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
