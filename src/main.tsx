// Les feuilles de style du socle passent avant tout le reste : les styles des
// composants, importés ensuite, peuvent ainsi les préciser.
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";

import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initNav } from "./app/nav";
import { boot } from "./app/store";
import { installGrain } from "./fx/grain";

installGrain();
initNav();
createRoot(document.getElementById("root")!).render(<App />);
void boot();
