// La vitrine des trophées. En haut, le palmarès : combien de médailles sur 42. Puis les
// treize familles, chacune dans sa vitrine : l'objet exposé, son nom, ce qu'il compte, et
// ses médailles pendues à une tringle de laiton (gagnées en couleur, à gagner en
// silhouette). On touche une médaille pour lire son nom et ce qu'elle demande sur le
// cartel ; dessous, la jauge vers le prochain palier.
//
// Rien n'est enregistré ici : tout se calcule sur l'état du joueur (shared/trophies.ts),
// si bien qu'un compte d'avant les trophées trouve d'emblée tout ce qu'il a mérité. Les
// médailles qu'il n'avait pas encore regardées brillent à cette visite, puis sont vues.

import { useEffect, useState } from "react";
import { MEDAL_COUNT, TROPHIES, medalsOf, type TrophyFamily } from "../../../shared/trophies";
import type { PlayerState } from "../../../shared/types";
import { useGame } from "../../app/store";
import { medaillesNouvelles, oublierAnnonces, useVues } from "../../app/trophees";
import { Icon } from "../../art/icons";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Barre, Entete } from "../../ui/Commun";
import { Medaille, Objet } from "./art";
import { marquerVues } from "./file";
import { compteDe, ecrire, ficheDe } from "./textes";
import "./trophees.css";

interface VitrineProps {
  famille: TrophyFamily;
  player: PlayerState;
  /** Les médailles que le joueur n'avait pas encore regardées en ouvrant l'écran. */
  neuves: ReadonlySet<string>;
}

function Vitrine({ famille, player, neuves }: VitrineProps) {
  const fiche = ficheDe(famille, player);
  const { progres, voile } = fiche;
  const ouverte = voile === "ouvert";
  // La médaille que le cartel présente : la dernière gagnée ; à défaut, la première à gagner.
  const [rang, setRang] = useState(Math.max(1, progres.earned));
  const choisie = fiche.medailles[rang - 1] ?? fiche.medailles[0]!;

  return (
    <li className={cx("trophee", `trophee--${voile}`)}>
      <div className="trophee__tete">
        <span className="trophee__objet" aria-hidden="true">
          <Objet famille={famille.id} voile={voile === "mystere"} />
        </span>
        <div className="trophee__qui">
          <h2 className="trophee__nom">{fiche.nom}</h2>
          <p className="trophee__phrase">{fiche.phrase}</p>
        </div>
      </div>

      <span className="trophee__tringle" aria-hidden="true" />
      {ouverte ? (
        <div className="trophee__medailles" role="group" aria-label={t("Médailles")}>
          {fiche.medailles.map((m) => (
            <button
              key={m.id}
              type="button"
              className={cx("medaille", neuves.has(m.id) && "medaille--neuve")}
              aria-pressed={m.rang === choisie.rang}
              aria-label={m.gagnee
                ? t("{nom}, gagnée : {condition}", { nom: m.nom, condition: m.phrase })
                : t("{nom}, à gagner : {condition}", { nom: m.nom, condition: m.phrase })}
              onClick={() => setRang(m.rang)}
            >
              <Medaille famille={famille.id} rang={m.rang} gagnee={m.gagnee} />
            </button>
          ))}
        </div>
      ) : (
        <div className="trophee__medailles" role="img" aria-label={t("Médailles à découvrir")}>
          {fiche.medailles.map((m) => (
            <span key={m.id} className="medaille">
              <Medaille famille={famille.id} rang={m.rang} secrete />
            </span>
          ))}
        </div>
      )}

      {ouverte && (
        // Le cartel : le bouton de la médaille dit déjà tout cela aux lecteurs d'écran.
        <p className="cartel" aria-hidden="true">
          <span className="cartel__nom">{choisie.nom}</span>
          {neuves.has(choisie.id)
            ? <span className="cartel__etat cartel__etat--neuve">{t("nouvelle !")}</span>
            : choisie.gagnee
              ? <span className="cartel__etat cartel__etat--gagnee"><Icon name="coche" size={16} />{t("gagnée")}</span>
              : <span className="cartel__etat">{t("à gagner")}</span>}
          <span className="cartel__condition">{choisie.phrase}</span>
        </p>
      )}

      {ouverte && progres.total > 1 && (
        progres.next === null ? (
          // Tous les paliers sont atteints : là où le compte continue, il se dit, pour le plaisir.
          // (Arrêté pile au dernier palier, le cartel de la dernière médaille l'a déjà dit.)
          progres.value > famille.tiers[famille.tiers.length - 1]! && (
            <p className="trophee__compte trophee__compte--plein">
              <Icon name="coche" size={18} />
              <span className="chiffres">{compteDe(famille, progres.value)}</span>
            </p>
          )
        ) : (
          <div className="trophee__progres">
            <Barre value={progres.value} max={progres.next} />
            <p className="trophee__compte chiffres">
              {t("{valeur} sur {palier}", { valeur: ecrire(famille, progres.value), palier: ecrire(famille, progres.next) })}
            </p>
          </div>
        )
      )}
    </li>
  );
}

export function Trophees() {
  const player = useGame((s) => s.player);
  const vues = useVues();
  // Ce qui était nouveau en ouvrant l'écran le reste jusqu'à ce qu'on le quitte.
  const [neuves] = useState(() => new Set(player ? medaillesNouvelles(player, vues) : []));
  // Devant la vitrine, tout est vu, et plus rien n'est à annoncer.
  useEffect(() => {
    marquerVues();
    oublierAnnonces();
  }, []);
  if (!player) return null;
  const gagnees = medalsOf(player).length;

  return (
    <main className="ecran trophees">
      <Entete titre={t("Trophées")} retour />

      <div className="palmares">
        <p className="invisible">{t("Médailles gagnées : {n} sur {total}", { n: gagnees, total: MEDAL_COUNT })}</p>
        <p className="palmares__compte" aria-hidden="true">
          {gagnees}<span className="palmares__total">/{MEDAL_COUNT}</span>
        </p>
        <div className="palmares__suite" aria-hidden="true">
          <p className="palmares__mot">{t("Médailles gagnées")}</p>
          <Barre value={gagnees} max={MEDAL_COUNT} />
        </div>
      </div>
      {neuves.size > 0 && (
        <p className="trophees__neuves">
          <span className="trophees__eclat" aria-hidden="true" />
          {neuves.size > 1 ? t("{n} nouvelles médailles à admirer", { n: neuves.size }) : t("1 nouvelle médaille à admirer")}
        </p>
      )}

      {/* Les vitrines entrent en cascade. */}
      <ul className="trophees__liste cascade">
        {TROPHIES.map((famille) => <Vitrine key={famille.id} famille={famille} player={player} neuves={neuves} />)}
      </ul>
    </main>
  );
}
