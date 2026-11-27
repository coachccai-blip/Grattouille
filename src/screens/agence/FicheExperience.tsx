// La fiche d'une expérience de vie (LOT4.md, section 13). Une feuille monte du bas, comme
// pour un article de boutique : le timbre en grand, le nom, le prix, le boniment de Madame
// Diem, et le bouton « Vivre l'expérience ». Une expérience se vit une fois ; ensuite son
// timbre est oblitéré, et on la revit autant qu'on veut, gratuitement.
//
// Si le prix dépasse la moitié de la bourse, il faut garder le doigt posé, comme en
// boutique (les classes et les phrases de ce geste sont celles de la fiche d'un article).
// Le film vient avant le paiement : on ne fait pas payer un voyage qu'on ne saurait montrer.

import { useEffect, useState } from "react";
import { experienceById } from "../../../shared/experiences";
import { formatEuros } from "../../../shared/format";
import { nav } from "../../app/nav";
import { displayBalance, experienceBlocker, liveExperience, toast, useGame } from "../../app/store";
import { Diem } from "../../art/agence/diem";
import { Timbre } from "../../art/agence/timbres";
import { playCashRegister } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { pick } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Bouton, BoutonMaintenir } from "../../ui/Bouton";
import { Feuille } from "../../ui/Feuille";
import { chargerFilms } from "./films";
import { t } from "./mots";
import { MADAME_DIEM, bonimentDe, chapitreDe, nomExperience } from "./textes";
import "../boutiques/boutiques.css";
import "./agence.css";

export function FicheExperience({ experience: id }: { experience: string }) {
  const player = useGame((s) => s.player);
  const balance = useGame(displayBalance);
  const online = useGame((s) => s.online);
  const [busy, setBusy] = useState(false);
  const experience = experienceById(id);

  // Les films arrivent pendant qu'on lit le boniment.
  useEffect(() => {
    void chargerFilms();
  }, []);

  if (!player || !experience) return null;

  const nom = nomExperience(id);
  const vecue = player.experiences.includes(id);
  const manque = experience.price - balance;
  const vivreTexte = t("Vivre l'expérience");

  /** Le film prend la place de la fiche : en le refermant, on retrouve le catalogue. */
  const projeter = (premiere: boolean) => {
    const ici = nav.current();
    const film = { name: "experience", experience: id, premiere } as const;
    if (ici.name === "fiche-experience" && ici.experience === id) nav.replace(film);
    else nav.push(film);
  };

  const vivre = async () => {
    if (busy) return;
    setBusy(true);
    // Rien ne s'y oppose, vu d'ici : le film d'abord, le paiement ensuite.
    if (!experienceBlocker(id) && !(await chargerFilms())) {
      toast(t("Le film de ce souvenir n'arrive pas. Vérifie ta connexion, puis réessaie."), "erreur");
      setBusy(false);
      return;
    }
    const ok = await liveExperience(id);
    if (ok) {
      playCashRegister();
      haptic.buy();
      projeter(true);
    }
    setBusy(false);
  };

  return (
    <Feuille titre={nom} onClose={() => nav.back()} className="fiche-experience">
      <div className="fiche-experience__vue">
        <span className={cx("fiche-experience__timbre", vecue && "fiche-experience__timbre--vecue")}>
          <Timbre id={id} vecue={vecue} title={vecue ? t("{nom}, vécue", { nom }) : nom} />
        </span>
      </div>

      <h2 className="t-titre fiche-experience__nom">{nom}</h2>
      <p className="fiche-experience__prix">
        {vecue
          ? <span className="fiche-experience__tampon">{t("Vécue")}</span>
          : <span className="chiffres">{formatEuros(experience.price)}</span>}
        <span className="fiche-experience__chapitre">{pick(chapitreDe(id).titre)}</span>
      </p>

      <div className="bulle fiche-experience__diem">
        <span className="portrait"><Diem /></span>
        <p className="bulle__texte">
          <span className="bulle__nom">{MADAME_DIEM}</span>
          {t("« {replique} »", { replique: bonimentDe(id) })}
        </p>
      </div>

      <div className="fiche-article__actions">
        {!vecue && manque > 0 && (
          <>
            <p className="fiche-article__manque" role="status">{t("Il te manque {montant}.", { montant: formatEuros(manque) })}</p>
            <Bouton bloc disabled>{vivreTexte}</Bouton>
          </>
        )}
        {!vecue && manque <= 0 && (
          experience.price > balance / 2 ? (
            <>
              <BoutonMaintenir bloc reflet attente={busy} disabled={!online} onConfirm={() => void vivre()}>
                {/* Au clavier ou au lecteur d'écran, une activation suffit : la consigne ne leur est pas lue. */}
                <span className="maintenir__titre">{vivreTexte}</span>
                <span className="maintenir__geste" aria-hidden="true">{t("garde le doigt posé")}</span>
              </BoutonMaintenir>
              {online && <p className="note">{t("C'est plus de la moitié de ta bourse.")}</p>}
            </>
          ) : (
            <Bouton bloc reflet attente={busy} disabled={!online} onClick={() => void vivre()}>{vivreTexte}</Bouton>
          )
        )}
        {!vecue && !online && <p className="note">{t("Hors connexion. Les voyages attendront.")}</p>}

        {vecue && (
          <>
            <Bouton bloc onClick={() => projeter(false)}>{t("Revivre")}</Bouton>
            <p className="note">{t("Autant que tu veux : c'est la maison qui offre.")}</p>
          </>
        )}
      </div>
    </Feuille>
  );
}
