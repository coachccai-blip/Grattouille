// L'album photo des expériences de vie : le troisième rayon de la section Trophées, à côté
// des médailles et des souvenirs. Chaque expérience vécue à l'Agence Carpe Diem y laisse sa
// photo, dans l'ordre où le joueur les a vécues : de la glace face à la mer aux vacances de
// toute la ville, l'album raconte son ascension.
//
// - Une photo est la carte postale de l'expérience (Photo.tsx) : sa scène figée, le joueur
//   dedans. La toucher l'ouvre en grand, avec sa légende et son timbre ; de là, on revit
//   le film (Film.tsx, ouvert par son côté « photo »).
// - Rien n'est montré de ce qui reste à vivre : le catalogue de l'agence le fait déjà.
//   Madame Diem dit combien de pages restent blanches, et sa porte est à un bouton.
// - Les photos sont les scènes des films : elles arrivent avec eux (films.ts), et seulement
//   s'il y a de quoi en montrer. Une photo ne se dessine qu'à l'approche de l'écran : un
//   album plein en compte trente.
//
// Rien n'est stocké, ni sur l'appareil ni au serveur : l'album se lit dans les expériences
// vécues du joueur.

import { memo, useEffect, useRef, useState, type RefObject } from "react";
import { EXPERIENCE_COUNT, knownExperiences } from "../../../shared/experiences";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { Diem } from "../../art/agence/diem";
import { Bouton } from "../../ui/Bouton";
import { Barre, Entete } from "../../ui/Commun";
import { Rayons, titreDesTrophees } from "../../ui/Rayons";
import { chargerFilms, filmsPrets } from "./films";
import { t } from "./mots";
import { MADAME_DIEM, motDeLAlbum, nomExperience } from "./textes";
import "./album.css";

type Films = NonNullable<ReturnType<typeof filmsPrets>>;

/**
 * Vrai dès que l'élément approche de l'écran, et pour de bon : une photo dessinée le reste.
 * Là où le navigateur ne sait pas guetter, tout se dessine d'emblée.
 */
function useProche(cadre: RefObject<Element | null>): boolean {
  const [proche, setProche] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const element = cadre.current;
    if (proche || !element) return;
    const guet = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((entree) => entree.isIntersecting)) setProche(true);
      },
      // Un écran d'avance, en haut comme en bas : la photo est là avant qu'on y arrive.
      { rootMargin: "640px 0px" },
    );
    guet.observe(element);
    return () => guet.disconnect();
  }, [cadre, proche]);
  return proche;
}

interface VignetteProps {
  experience: string;
  /** Son numéro dans l'album : la combientième expérience que le joueur a vécue. */
  rang: number;
  /** De quoi dessiner les photos, une fois les films arrivés. */
  Photo: Films["Photo"] | null;
}

/** Une photo de l'album : collée un peu de travers, son nom écrit dessous. */
const Vignette = memo(function Vignette({ experience, rang, Photo }: VignetteProps) {
  const cadre = useRef<HTMLSpanElement>(null);
  const proche = useProche(cadre);
  const nom = nomExperience(experience);
  return (
    <li>
      <button
        type="button"
        className="photo"
        onClick={() => nav.push({ name: "experience", experience, photo: true })}
        aria-label={t("Souvenir {n} : {nom}", { n: rang, nom })}
      >
        <span className="photo__vue" ref={cadre} aria-hidden="true">
          {Photo && proche && <Photo experience={experience} className="photo__image" />}
        </span>
        <span className="photo__nom" aria-hidden="true">{nom}</span>
      </button>
    </li>
  );
});

export function Album() {
  const player = useGame((s) => s.player);
  const [films, setFilms] = useState(filmsPrets);
  const [panne, setPanne] = useState(false);
  const vecues = player ? knownExperiences(player.experiences) : [];
  const n = vecues.length;

  // Les photos arrivent avec les films, s'il y a de quoi en montrer.
  useEffect(() => {
    if (films || n === 0) return;
    let vivant = true;
    void chargerFilms().then((morceau) => {
      if (!vivant) return;
      if (morceau) setFilms(morceau);
      else setPanne(true);
    });
    return () => {
      vivant = false;
    };
  }, [films, n]);

  if (!player) return null;
  const versAgence = () => nav.push({ name: "agence" });

  return (
    <main className="ecran album">
      <Entete titre={titreDesTrophees()} retour />
      <Rayons actif="album" />
      <p className="album__chapeau">{t("Chaque expérience vécue à l'Agence Carpe Diem laisse sa photo ici.")}</p>

      {n > 0 ? (
        <>
          <div className="album__compte">
            <p className="album__compte-titre">{t("Expériences vécues : {n} sur {total}", { n, total: EXPERIENCE_COUNT })}</p>
            <Barre value={n} max={EXPERIENCE_COUNT} />
          </div>
          <ul className="album__photos cascade">
            {vecues.map((id, i) => <Vignette key={id} experience={id} rang={i + 1} Photo={films?.Photo ?? null} />)}
          </ul>
          {panne && !films && (
            <p className="note album__panne" role="status">{t("Les photos n'arrivent pas. Vérifie ta connexion, puis reviens.")}</p>
          )}
        </>
      ) : (
        // Un album neuf : deux emplacements vides, leurs quatre coins déjà collés.
        <div className="album__vide" aria-hidden="true"><span /><span /></div>
      )}

      {/* Ce qui reste à vivre ne se montre pas ici : Madame Diem le dit, et tient la porte. */}
      <div className="bulle album__diem">
        <span className="portrait"><Diem /></span>
        <p className="bulle__texte">
          <span className="bulle__nom">{MADAME_DIEM}</span>
          {t("« {replique} »", { replique: motDeLAlbum(n) })}
        </p>
      </div>
      {n < EXPERIENCE_COUNT && (
        <Bouton variante={n > 0 ? "secondaire" : "principal"} bloc className="album__porte" onClick={versAgence}>
          {t("Pousser la porte de l'agence")}
        </Bouton>
      )}
    </main>
  );
}
