// Le Poker Tricheur : la porte d'entrée de ses écrans (POKER.md, section 5).
// Ce module n'est chargé qu'à la demande (voir App.tsx) : le hall, la table et leurs
// feuilles forment un morceau à part, que le reste du jeu n'attend pas.

import "./anglais";
import type { Screen } from "../../app/nav";
import { FeuillePoker } from "./Feuilles";
import { Hall } from "./Hall";
import { Table } from "./Table";

type PokerScreen = Extract<Screen, { name: "poker" | "poker-table" | "poker-feuille" }>;

export default function Poker({ screen }: { screen: PokerScreen }) {
  switch (screen.name) {
    case "poker": return <Hall />;
    case "poker-table": return <Table code={screen.code} />;
    case "poker-feuille": return <FeuillePoker screen={screen} />;
  }
}
