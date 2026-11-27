// L'enseigne de l'Agence Carpe Diem, dans l'onglet Boutiques : la cinquième, après les
// quatre vitrines. Elle ne vend pas des biens mais des souvenirs, et cela se voit : ce
// n'est pas une vitrine sous son store, c'est une carte postale « par avion », avec son
// timbre à l'effigie de Madame Diem.
//
// C'est tout ce que l'agence ajoute au démarrage du jeu, avec trois phrases dans
// src/i18n/en/boutiques.ts : le catalogue, les timbres, les boniments et les films
// n'arrivent qu'en poussant la porte (App.tsx). Le portrait de Madame Diem lui-même
// arrive un instant après l'enseigne ; sans réseau, le timbre reste bleu, et rien ne casse.

import { lazy, Suspense } from "react";
import { EXPERIENCE_COUNT } from "../../../shared/experiences";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { t } from "../../i18n";
import "./enseigne.css";

const Diem = lazy(() => import("../../art/agence/diem").catch(() => ({ default: () => null })));

export function Enseigne() {
  const vecues = useGame((s) => s.player?.experiences.length ?? 0);
  const boutique = t("Agence Carpe Diem");
  const rayon = t("Expériences de vie");
  const compte = vecues > 1
    ? t("{n} vécues sur {total}", { n: vecues, total: EXPERIENCE_COUNT })
    : t("{n} vécue sur {total}", { n: vecues, total: EXPERIENCE_COUNT });
  return (
    <li>
      <button
        type="button"
        className="vitrine enseigne-agence"
        onClick={() => nav.push({ name: "agence" })}
        aria-label={t("{boutique}, {rayon}, par {vendeur}. {compte}.", { boutique, rayon, vendeur: "Madame Diem", compte })}
      >
        <span className="enseigne-agence__carte" aria-hidden="true">
          <span className="enseigne-agence__timbre"><Suspense fallback={null}><Diem /></Suspense></span>
          <span className="vitrine__enseigne">
            <span className="vitrine__nom">{boutique}</span>
            <span className="vitrine__rayon">{rayon}</span>
            <span className="vitrine__compte">{compte}</span>
          </span>
          <Icon name="chevron" />
        </span>
      </button>
    </li>
  );
}
