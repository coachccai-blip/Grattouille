// Le film d'une expérience, posé par-dessus le catalogue : cet écran-ci ne fait qu'attendre
// le morceau des films (films.ts), puis lui passe la main. Le plus souvent il est déjà là :
// la fiche l'a fait venir en s'ouvrant.
//
// Un film ne se projette que pour une expérience vécue : la fiche paie d'abord (le magasin
// d'état a déjà reçu la réponse du serveur), puis pousse cet écran. Arriver ici autrement
// (l'historique du navigateur, un état trafiqué) ne montre rien.
//
// L'album de la section Trophées pousse le même écran pour regarder une photo (`photo`) :
// on a alors la carte postale d'abord, et le film si on le redemande.

import { useEffect, useState } from "react";
import { experienceById } from "../../../shared/experiences";
import { nav } from "../../app/nav";
import { toast, useGame } from "../../app/store";
import { chargerFilms, filmsPrets } from "./films";
import { t } from "./mots";

export function Experience({ experience, premiere, photo = false }: { experience: string; premiere: boolean; photo?: boolean }) {
  const vecue = useGame((s) => s.player?.experiences.includes(experience) ?? false);
  const connue = vecue && experienceById(experience) !== undefined;
  const [prets, setPrets] = useState(() => filmsPrets() !== null);

  useEffect(() => {
    // Une expérience que ce jeu ne connaît pas, ou que le joueur n'a pas vécue : rien à montrer, on referme.
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
  return <films.Film experience={experience} premiere={premiere} photo={photo} />;
}
