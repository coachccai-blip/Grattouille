// Le Carnet du Patron (LOT4.md, section 3) : ce que le Patron a semé, et ce que ses
// protégés sont devenus. Gaspard le tenait avant lui. On y relit les nouvelles de tous les
// paliers atteints ; rien n'est enregistré, tout se déduit du nombre de tickets semés.

import { formatEuros, formatInt } from "../../../shared/format";
import { hostName } from "../../app/dialogues";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { motDeGaspard, nouvellesDe, paliersAtteints, prochainPalier } from "../../app/suite/semis";
import { t } from "../../i18n";
import { Bouton } from "../../ui/Bouton";
import { Barre, BulleLibre, Entete } from "../../ui/Commun";
import { Lettre, Tete } from "./Vignette";
import "../reglages/reglages.css";
import "./semis.css";

const versKiosque = () => nav.reset([{ name: "promenade" }, { name: "comptoir", place: "kiosque" }]);

export function Carnet() {
  const player = useGame((s) => s.player);
  if (!player) return null;
  // Le Carnet se mérite avec le Kiosque : qui n'est pas Patron n'y lit qu'une phrase.
  if (!player.kiosk) {
    return (
      <main className="ecran carnet">
        <Entete titre={t("Le Carnet du Patron")} retour />
        <p className="note">{t("Seul le Patron du Kiosque laisse tomber des tickets pour les nouveaux venus.")}</p>
      </main>
    );
  }
  const { sown, sownValue } = player.stats;
  // Les dernières nouvelles d'abord.
  const courrier = paliersAtteints(sown).reverse().flatMap((palier) => nouvellesDe(palier) ?? []);
  const prochain = prochainPalier(sown);

  return (
    <main className="ecran carnet cascade">
      <Entete titre={t("Le Carnet du Patron")} retour />

      <BulleLibre pnj="gaspard" nom={hostName("gaspard")}>
        {t("« {replique} »", { replique: motDeGaspard(sown) })}
      </BulleLibre>

      <dl className="carnet-de-bord">
        <div><dt>{t("Tickets semés")}</dt><dd className="chiffres">{formatInt(sown)}</dd></div>
        <div><dt>{t("Leur valeur")}</dt><dd className="chiffres">{formatEuros(sownValue)}</dd></div>
      </dl>

      {/* Le geste se fait au comptoir : le Carnet y mène. */}
      <div className="carnet__semer">
        <p className="note">{t("Pour semer : au comptoir d'un lieu, ouvre les règles et lots d'un ticket.")}</p>
        <Bouton bloc onClick={versKiosque}>{t("Aller au Kiosque")}</Bouton>
      </div>

      <section className="rubrique" aria-labelledby="carnet-proteges">
        <h2 className="rubrique__titre" id="carnet-proteges">{t("Tes protégés")}</h2>
        {/* Où en est la prochaine lettre : la barre dit le chemin, la phrase dit le but. */}
        {prochain !== null ? (
          <div className="carnet__prochain">
            <p>
              {courrier.length === 0
                ? (prochain > 1 ? t("Le premier t'écrira à {n} tickets semés.", { n: formatInt(prochain) }) : t("Le premier t'écrira dès ton premier ticket semé."))
                : t("Prochaine lettre à {n} tickets semés.", { n: formatInt(prochain) })}
            </p>
            <Barre value={sown} max={prochain} />
          </div>
        ) : (
          <p className="note">{t("Ils ont tous écrit. Le premier d'entre eux sème à son tour.")}</p>
        )}
        <ol className="carnet__courrier" reversed>
          {courrier.map((nouvelles) => (
            <li key={nouvelles.palier} className="carnet__pli">
              <Tete venu={nouvelles.protege} />
              <Lettre nouvelles={nouvelles} />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
