// La section Trophées a deux rayons : les médailles, et les souvenirs (les fins à revoir,
// l'histoire de chaque hôte). Ce sélecteur coiffe les deux écrans, sous le même titre : on
// passe de l'un à l'autre d'un appui, et « retour » ramène au Domaine depuis l'un comme
// depuis l'autre. Les souvenirs étaient d'abord rangés dans les Réglages : trop cachés.
//
// Chargé avec le reste du jeu (il ne pèse presque rien) : les deux écrans, eux, arrivent à
// la demande, et chacun doit pouvoir s'afficher sans que l'autre soit là.

import { nav } from "../app/nav";
import { storiesWaiting, useGame } from "../app/store";
import { t } from "../i18n";
import { cx } from "../ticket/parts";
import "./rayons.css";

export type Rayon = "trophees" | "souvenirs";

/** Le titre commun aux deux rayons. */
export function titreDesTrophees(): string {
  return t("Trophées");
}

/** Combien d'histoires d'hôtes sont ouvertes et pas encore écoutées. */
export function useHistoiresEnAttente(): number {
  return useGame((s) => storiesWaiting(s).split(",").filter(Boolean).length);
}

export function Rayons({ actif }: { actif: Rayon }) {
  const histoires = useHistoiresEnAttente();
  const aller = (name: Rayon) => {
    // On remplace l'écran au lieu d'en empiler un : « retour » ramène toujours d'où l'on vient.
    if (name !== actif) nav.replace({ name });
  };
  return (
    <div className="rayons" role="tablist" aria-label={t("Médailles ou souvenirs")}>
      <button
        type="button"
        role="tab"
        aria-selected={actif === "trophees"}
        className={cx("rayon", actif === "trophees" && "rayon--actif")}
        onClick={() => aller("trophees")}
      >
        {t("Médailles")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={actif === "souvenirs"}
        className={cx("rayon", actif === "souvenirs" && "rayon--actif")}
        aria-label={histoires > 0 ? t("Souvenirs : {n} à écouter", { n: histoires }) : undefined}
        onClick={() => aller("souvenirs")}
      >
        {t("Souvenirs")}
        {/* Les histoires qui attendent : la pastille se voit depuis les médailles. */}
        {histoires > 0 && <span className="rayon__pastille" aria-hidden="true">{histoires}</span>}
      </button>
    </div>
  );
}
