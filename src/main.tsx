// Les feuilles de style du socle passent avant tout le reste : les styles des
// composants, importés ensuite, peuvent ainsi les préciser.
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";

import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initNav } from "./app/nav";
import { loadSettings } from "./app/persist";
import { boot, useGame } from "./app/store";
import { installGrain } from "./fx/grain";
import { setLang } from "./i18n";

/**
 * Tout l'écran porte la langue en clé : changer de langue dans les réglages le
 * remonte d'un coup, et chaque texte se relit dans la nouvelle langue. L'état du jeu
 * (compte, navigation, tickets) vit dans les magasins : il ne bouge pas.
 */
function Racine() {
  const langue = useGame((s) => s.settings.langue);
  return <App key={langue} />;
}

// La langue est connue avant le premier affichage : pas d'éclair de français.
setLang(loadSettings().langue);
installGrain();
initNav();
createRoot(document.getElementById("root")!).render(<Racine />);
void boot();
