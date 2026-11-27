// L'Agence Carpe Diem (LOT4.md, section 13) : le catalogue des expériences de vie.
// Madame Diem et sa bulle, où en est le joueur (« N sur 30 »), puis les trente expériences
// par prix croissant, rangées par chapitres. Chaque ligne : son timbre, son nom, son prix,
// et où elle en est : à portée de bourse, encore trop chère (et de combien), ou vécue, et
// alors oblitérée. Toucher une ligne ouvre sa fiche.
//
// Une expérience n'est pas un bien : ni Standing, ni collection. On n'affiche donc ici que
// la bourse.

import { useEffect, useRef, useState } from "react";
import { EXPERIENCE_COUNT, knownExperiences, type ExperienceDef } from "../../../shared/experiences";
import { formatEuros } from "../../../shared/format";
import { nav, useNav } from "../../app/nav";
import { displayBalance, useGame } from "../../app/store";
import { Diem } from "../../art/agence/diem";
import { Timbre } from "../../art/agence/timbres";
import { Icon } from "../../art/icons";
import { haptic } from "../../fx/haptics";
import { pick } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Bourse } from "../../ui/Bourse";
import { Barre, Entete, HorsLigne } from "../../ui/Commun";
import { t } from "./mots";
import { MADAME_DIEM, catalogue, motDeDiem, nomExperience } from "./textes";
import "./agence.css";

interface LigneProps {
  experience: ExperienceDef;
  vecue: boolean;
  /** Elle vient d'être vécue : son cachet tombe sous les yeux du joueur. */
  fraiche: boolean;
  balance: number;
}

function Ligne({ experience, vecue, fraiche, balance }: LigneProps) {
  const nom = nomExperience(experience.id);
  const prix = formatEuros(experience.price);
  const portee = balance >= experience.price;
  // À lire au rendu : il suit la langue.
  const etat = portee ? t("à ta portée") : t("encore {montant}", { montant: formatEuros(experience.price - balance) });
  return (
    <li>
      <button
        type="button"
        className={cx("experience", vecue ? "experience--vecue" : portee ? "experience--portee" : "experience--cher", fraiche && "experience--fraiche")}
        onClick={() => nav.push({ name: "fiche-experience", experience: experience.id })}
        aria-label={vecue ? t("{nom}, vécue. Revivre", { nom }) : t("{nom}, {prix}, {etat}", { nom, prix, etat })}
      >
        <span className="experience__timbre" aria-hidden="true"><Timbre id={experience.id} vecue={vecue} /></span>
        <span className="experience__texte" aria-hidden="true">
          <span className="experience__nom">{nom}</span>
          {vecue ? (
            <span className="experience__pied">
              <span className="experience__tampon">{t("vécue")}</span>
              <span className="experience__action">{t("Revivre")}</span>
            </span>
          ) : (
            <span className="experience__pied">
              <span className="experience__prix chiffres">{prix}</span>
              <span className="experience__etat">{etat}</span>
            </span>
          )}
        </span>
        <Icon name="chevron" className="experience__chevron" />
      </button>
    </li>
  );
}

export function Agence() {
  const player = useGame((s) => s.player);
  const balance = useGame(displayBalance);
  // Vrai quand rien ne couvre le catalogue : ni fiche, ni film.
  const devant = useNav((s) => s.stack[s.index]?.name === "agence");
  const [fraiches, setFraiches] = useState<readonly string[]>([]);
  const connues = useRef<readonly string[] | null>(null);
  const vecues = player ? knownExperiences(player.experiences) : [];
  const cle = vecues.join();

  // Au retour d'un film, le cachet de l'expérience qu'on vient de vivre tombe sur son timbre.
  useEffect(() => {
    if (!devant) return;
    const avant = connues.current;
    const maintenant = cle === "" ? [] : cle.split(",");
    connues.current = maintenant;
    if (!avant) return;
    const neuves = maintenant.filter((id) => !avant.includes(id));
    if (neuves.length === 0) return;
    setFraiches(neuves);
    const timer = window.setTimeout(() => haptic.reveal(), 420);
    return () => window.clearTimeout(timer);
  }, [devant, cle]);

  if (!player) return null;
  const rayons = catalogue();
  const aPortee = rayons.some((r) => r.experiences.some((x) => !vecues.includes(x.id) && x.price <= balance));

  return (
    <main className="ecran ecran--onglets agence">
      <HorsLigne />
      <Entete titre={t("Agence Carpe Diem")} grand retour droite={<Bourse />} />

      <div className="bulle agence__diem">
        <span className="portrait"><Diem /></span>
        <p className="bulle__texte">
          <span className="bulle__nom">{MADAME_DIEM}</span>
          {t("« {replique} »", { replique: motDeDiem(vecues.length, aPortee) })}
        </p>
      </div>

      <div className="agence__compte">
        <p className="agence__compte-titre">
          {t("Expériences vécues : {n} sur {total}", { n: vecues.length, total: EXPERIENCE_COUNT })}
        </p>
        <Barre value={vecues.length} max={EXPERIENCE_COUNT} />
      </div>

      {rayons.map(({ chapitre, experiences }) => (
        <section key={chapitre.id} className="agence__chapitre" aria-labelledby={`agence-${chapitre.id}`}>
          <h2 className="agence__chapitre-titre" id={`agence-${chapitre.id}`}>{pick(chapitre.titre)}</h2>
          <ul className="agence__liste cascade">
            {experiences.map((experience) => (
              <Ligne
                key={experience.id}
                experience={experience}
                vecue={vecues.includes(experience.id)}
                fraiche={fraiches.includes(experience.id)}
                balance={balance}
              />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
