// Les Souvenirs : la porte d'entrée de leurs écrans (LOT4.md, section 12).
// Ce module n'est chargé qu'à la demande (voir App.tsx) : la liste des souvenirs, les huit
// histoires des maîtres des lieux, leurs textes et leurs photos forment un morceau à part,
// que le reste du jeu n'attend pas.

import type { Screen } from "../../app/nav";
import { Histoire } from "./Histoire";
import { Souvenirs } from "./Souvenirs";

type EcranSouvenirs = Extract<Screen, { name: "souvenirs" | "histoire" }>;

export default function Memoire({ screen }: { screen: EcranSouvenirs }) {
  switch (screen.name) {
    case "souvenirs": return <Souvenirs />;
    case "histoire": return <Histoire lieu={screen.lieu} />;
  }
}
