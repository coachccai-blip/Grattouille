// Le film d'une expérience, posé par-dessus le catalogue : cet écran-ci ne fait qu'attendre
// le morceau des films (films.ts), puis lui passe la main. Le plus souvent il est déjà là :
// la fiche l'a fait venir en s'ouvrant.

import { useEffect, useState } from "react";
import { experienceById } from "../../../shared/experiences";
import { nav } from "../../app/nav";
import { toast } from "../../app/store";
import { chargerFilms, filmsPrets } from "./films";
import { t } from "./mots";

export function Experience({ experience, premiere }: { experience: string; premiere: boolean }) {
  const connue = experienceById(experience) !== undefined;
  const [prets, setPrets] = useState(() => filmsPrets() !== null);

  useEffect(() => {
    // Une expérience que ce jeu ne connaît pas : rien à montrer, on referme.
    if (!connue) {
      nav.back();
      return;
    }
    if (prets) return;
    let vivant = true;
    void chargerFilms().then((films) => {
      if (!vivant) return;
      if (films) setPrets(true);
      else {
        toast(t("Le film de ce souvenir n'arrive pas. Vérifie ta connexion, puis réessaie."), "erreur");
        nav.back();
      }
    });
    return () => {
      vivant = false;
    };
  }, [connue, prets]);

  const films = filmsPrets();
  if (!connue || !films) return null;
  return <films.Film experience={experience} premiere={premiere} />;
}
