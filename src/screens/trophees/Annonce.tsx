// L'annonce d'une médaille qui vient d'être gagnée : un carton qui descend prendre, quelques
// secondes, la place de la barre d'en-tête (rien d'autre n'est recouvert), avec le dessin de
// la médaille et son nom. Au-delà de trois médailles gagnées d'un coup, un seul carton les
// annonce toutes. Un appui dessus ouvre la vitrine. C'est le crieur (Crieur.tsx) qui décide
// du moment ; ce module, lui, n'est chargé qu'à la première annonce.

import { useEffect, useRef, useState } from "react";
import { useGame } from "../../app/store";
import { playStars } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Medaille } from "./art";
import type { AnnonceProps } from "./Crieur";
import { lireMedaille, nomMedaille, voileDe } from "./textes";

/** Le temps qu'une annonce reste à l'écran, puis celui qu'elle met à repartir. */
const DUREE_MS = 3800;
const DUREE_GROUPE_MS = 4600;
const SORTIE_MS = 240;

/** Dans une annonce groupée, les médailles dessinées : les plus belles d'abord, quatre au plus. */
const MONTREES = 4;

export function Annonce({ medailles, onFin }: AnnonceProps) {
  const player = useGame((s) => s.player);
  const [sort, setSort] = useState(false);
  const fin = useRef(onFin);
  fin.current = onFin;
  const groupe = medailles.length > 1;
  const lues = medailles.map(lireMedaille).filter((lue) => lue !== null);

  useEffect(() => {
    // Une note par rang de la médaille : plus elle est haute, plus la gamme monte.
    playStars(groupe ? 8 : 2 + (lues[0]?.rang ?? 1));
    haptic.tier("joli");
    const duree = groupe ? DUREE_GROUPE_MS : DUREE_MS;
    const part = window.setTimeout(() => setSort(true), duree);
    const finie = window.setTimeout(() => fin.current(false), duree + SORTIE_MS);
    return () => {
      window.clearTimeout(part);
      window.clearTimeout(finie);
    };
    // Une annonce ne change pas en cours de route : le crieur en monte une nouvelle à chaque fois.
  }, []);

  const premiere = lues[0];
  if (!player || !premiere) return null;
  // Une médaille gagnée dévoile toujours son trophée : son nom se dit.
  const nom = nomMedaille(medailles[0]!, voileDe(premiere.famille.id, player));
  const n = medailles.length;

  return (
    <div className={cx("annonce", sort && "annonce--sort")} role="status">
      <button
        type="button"
        className={cx("annonce__carton papier", groupe && "annonce__carton--groupe")}
        onClick={() => fin.current(true)}
        aria-label={groupe
          ? t("{n} nouvelles médailles. Voir les trophées", { n })
          : t("Nouvelle médaille : {nom}. Voir les trophées", { nom })}
      >
        <span className="annonce__medailles" aria-hidden="true">
          {(groupe ? lues.slice(-MONTREES) : [premiere]).map((lue) => (
            <Medaille key={`${lue.famille.id}:${lue.rang}`} famille={lue.famille.id} rang={lue.rang} />
          ))}
          <span className="annonce__eclat" />
        </span>
        <span className="annonce__texte" aria-hidden="true">
          <span className="annonce__titre">{groupe ? t("D'un seul coup") : t("Nouvelle médaille")}</span>
          <span className="annonce__nom">{groupe ? t("{n} nouvelles médailles", { n }) : nom}</span>
        </span>
      </button>
    </div>
  );
}
