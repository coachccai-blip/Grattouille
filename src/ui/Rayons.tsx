// La section Trophées a trois rayons : les médailles, les souvenirs (les fins à revoir,
// l'histoire de chaque hôte) et l'album photo des expériences de vie. Ce sélecteur coiffe
// les trois écrans, sous le même titre : on passe de l'un à l'autre d'un appui, et
// « retour » ramène au Domaine depuis chacun. Les souvenirs étaient d'abord rangés dans
// les Réglages : trop cachés.
//
// Chargé avec le reste du jeu (il ne pèse presque rien) : les trois écrans, eux, arrivent
// à la demande, et chacun doit pouvoir s'afficher sans que les autres soient là.
//
// Ses classes s'appellent `rayons-trophees` : la Boutique a déjà ses « rayons » (les onglets
// d'un magasin, boutiques.css), et deux feuilles de style qui partagent un nom se mélangent.

import { nav } from "../app/nav";
import { storiesWaiting, useGame } from "../app/store";
import { t } from "../i18n";
import { cx } from "../ticket/parts";
import "./rayons.css";

export type Rayon = "trophees" | "souvenirs" | "album";

/** Le titre commun aux trois rayons. */
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
    <div className="rayons-trophees" role="tablist" aria-label={t("Médailles, souvenirs ou album")}>
      <button
        type="button"
        role="tab"
        aria-selected={actif === "trophees"}
        className={cx("rayons-trophees__onglet", actif === "trophees" && "rayons-trophees__onglet--actif")}
        onClick={() => aller("trophees")}
      >
        {t("Médailles")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={actif === "souvenirs"}
        className={cx("rayons-trophees__onglet", actif === "souvenirs" && "rayons-trophees__onglet--actif")}
        aria-label={histoires > 0 ? t("Souvenirs : {n} à écouter", { n: histoires }) : undefined}
        onClick={() => aller("souvenirs")}
      >
        {t("Souvenirs")}
        {/* Les histoires qui attendent : la pastille se voit depuis les autres rayons. */}
        {histoires > 0 && <span className="rayons-trophees__pastille" aria-hidden="true">{histoires}</span>}
      </button>
      {/* Les photos des expériences vécues à l'Agence Carpe Diem. */}
      <button
        type="button"
        role="tab"
        aria-selected={actif === "album"}
        className={cx("rayons-trophees__onglet", actif === "album" && "rayons-trophees__onglet--actif")}
        onClick={() => aller("album")}
      >
        {t("Album")}
      </button>
    </div>
  );
}
