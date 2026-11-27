// Les tickets semés : la porte d'entrée de leurs écrans (LOT4.md, section 3).
// Ce module n'est chargé qu'à la demande (voir App.tsx et FicheTicket.tsx) : le geste du
// Patron, la vignette de qui trouve le ticket, les lettres des protégés et le Carnet
// forment un morceau à part, avec tous leurs textes, que le reste du jeu n'attend pas.

import type { Screen } from "../../app/nav";
import { Carnet } from "./Carnet";
import { Vignette } from "./Vignette";

export { Semer } from "./Semer";

type SemisScreen = Extract<Screen, { name: "carnet" | "semis" }>;

export default function Semis({ screen }: { screen: SemisScreen }) {
  switch (screen.name) {
    case "carnet": return <Carnet />;
    case "semis": return <Vignette ticket={screen.ticket} rang={screen.rang} qty={screen.qty} />;
  }
}
