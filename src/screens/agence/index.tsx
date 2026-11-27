// L'Agence Carpe Diem : la porte d'entrée de ses écrans (LOT4.md, section 13).
// Ce module n'est chargé qu'à la demande (voir App.tsx) : l'agence, la fiche d'une
// expérience, leurs timbres et les boniments de Madame Diem forment un morceau à part, que
// le reste du jeu n'attend pas. Les trente films, eux, en sont encore un autre : ils
// n'arrivent qu'avec la première fiche ouverte (voir films.ts).
//
// L'album photo des expériences vécues est de la maison lui aussi, même s'il se range dans
// la section Trophées : il a besoin des noms, des légendes et des films de l'agence.

import type { Screen } from "../../app/nav";
import { Agence } from "./Agence";
import { Album } from "./Album";
import { Experience } from "./Experience";
import { FicheExperience } from "./FicheExperience";

type EcranAgence = Extract<Screen, { name: "agence" | "album" | "fiche-experience" | "experience" }>;

export default function Carpediem({ screen }: { screen: EcranAgence }) {
  switch (screen.name) {
    case "agence": return <Agence />;
    case "album": return <Album />;
    case "fiche-experience": return <FicheExperience experience={screen.experience} />;
    case "experience":
      return <Experience experience={screen.experience} premiere={screen.premiere === true} photo={screen.photo === true} />;
  }
}
