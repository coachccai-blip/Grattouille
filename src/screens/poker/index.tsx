// Le Poker Tricheur : la porte d'entrée de ses écrans (POKER.md, section 5).
// Ce module n'est chargé qu'à la demande (voir App.tsx) : le hall, la table et leurs
// feuilles forment un morceau à part, que le reste du jeu n'attend pas.

import type { Screen } from "../../app/nav";

type PokerScreen = Extract<Screen, { name: "poker" | "poker-table" | "poker-feuille" }>;

export default function Poker({ screen }: { screen: PokerScreen }) {
  return <main className="ecran" data-poker={screen.name} />;
}
