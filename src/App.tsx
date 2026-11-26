// La coquille de l'application : une seule page, pas de routes d'URL (BRIEF.md, section 12.1).

import { lazy, Suspense, useEffect } from "react";
import { nav, resolveScreens, tabOf, useNav, type Screen } from "./app/nav";
import { boot, isCalm, useGame } from "./app/store";
import { Icon } from "./art/icons";
import { ArtDefs } from "./art/kit";
import { unlockAudio } from "./fx/audio";
import { AGratter } from "./screens/a-gratter/AGratter";
import { Bienvenue } from "./screens/bienvenue/Bienvenue";
import { Boutique } from "./screens/boutiques/Boutique";
import { Boutiques } from "./screens/boutiques/Boutiques";
import { FicheArticle } from "./screens/boutiques/FicheArticle";
import { Classement } from "./screens/classement/Classement";
import { Comptoir } from "./screens/comptoir/Comptoir";
import { FicheTicket } from "./screens/comptoir/FicheTicket";
import { ChoixDomaine } from "./screens/domaine/ChoixDomaine";
import { Domaine } from "./screens/domaine/Domaine";
import { Dressing } from "./screens/domaine/Dressing";
import { Grattage } from "./screens/grattage/Grattage";
import { Accueil, Fin, Ouverture } from "./screens/moments/Moments";
import { Promenade } from "./screens/promenade/Promenade";
import { Reglages } from "./screens/reglages/Reglages";
import { Bouton } from "./ui/Bouton";
import { Message, Onglets } from "./ui/Commun";
import "./app.css";

// La planche de contrôle n'est chargée que sur demande (?planche).
const Planche = lazy(() => import("./screens/planche/Planche"));

function ScreenView({ screen }: { screen: Screen }) {
  switch (screen.name) {
    case "domaine": return <Domaine />;
    case "dressing": return <Dressing />;
    case "reglages": return <Reglages />;
    case "promenade": return <Promenade />;
    case "comptoir": return <Comptoir place={screen.place} />;
    case "a-gratter": return <AGratter />;
    case "grattage": return <Grattage tickets={screen.tickets} rafale={screen.rafale ?? false} />;
    case "boutiques": return <Boutiques />;
    case "boutique": return <Boutique shop={screen.shop} />;
    case "classement": return <Classement />;
    case "fiche-ticket": return <FicheTicket ticket={screen.ticket} />;
    case "fiche-article": return <FicheArticle item={screen.item} />;
    case "choix-domaine": return <ChoixDomaine slot={screen.slot} />;
  }
}

function screenKey(screen: Screen, index: number): string {
  switch (screen.name) {
    case "comptoir": return `${index}:comptoir:${screen.place}`;
    case "boutique": return `${index}:boutique:${screen.shop}`;
    case "grattage": return `${index}:grattage:${screen.tickets[0]?.id ?? ""}`;
    case "fiche-ticket": return `${index}:fiche-ticket:${screen.ticket}`;
    case "fiche-article": return `${index}:fiche-article:${screen.item}`;
    case "choix-domaine": return `${index}:choix:${screen.slot}`;
    default: return `${index}:${screen.name}`;
  }
}

const WITH_TABS = new Set(["domaine", "promenade", "boutiques", "boutique", "classement"]);

function Jeu() {
  const stack = useNav((s) => s.stack);
  const index = useNav((s) => s.index);
  const welcome = useGame((s) => s.welcome);
  const opening = useGame((s) => s.openings[0]);
  const ending = useGame((s) => s.ending);
  const sandbox = useGame((s) => s.sandbox);
  const { base, baseIndex, sheets } = resolveScreens(stack, index);
  const tabs = WITH_TABS.has(base.name);
  const moment = ending || Boolean(opening) || welcome;
  return (
    <>
      {/* Derrière un grand moment (accueil, ouverture d'un lieu, générique), l'écran ne répond plus. */}
      <div className="jeu__fond" inert={moment}>
        <ScreenView key={screenKey(base, baseIndex)} screen={base} />
        {tabs && <Onglets actif={tabOf(base)} />}
        {sheets.map((sheet, i) => <ScreenView key={screenKey(sheet, baseIndex + 1 + i)} screen={sheet} />)}
      </div>
      {ending ? <Fin /> : opening ? <Ouverture key={opening} place={opening} /> : welcome ? <Accueil /> : null}
      <Message onglets={tabs && sheets.length === 0} />
      {sandbox && <p className="bac-a-sable">Bac à sable : rien n'est enregistré.</p>}
    </>
  );
}

function Amorce() {
  return (
    <div className="amorce" role="status" aria-label="Chargement de Grattouille">
      <span aria-hidden="true">Grattouille</span>
      <span className="amorce__piece" aria-hidden="true" />
    </div>
  );
}

const PANNES = {
  reseau: {
    titre: "Pas de réponse du kiosque.",
    texte: "Vérifie ta connexion, puis réessaie. Ta fortune et tes tickets t'attendent bien au chaud.",
  },
  serveur: {
    titre: "Le kiosque ne répond pas.",
    texte: "Réessaie dans un instant. Ta fortune et tes tickets t'attendent bien au chaud.",
  },
  absent: {
    titre: "Le kiosque n'est pas encore ouvert.",
    texte: "Cette page a été publiée sans son serveur de jeu. En attendant, le bac à sable permet de jouer sans rien enregistrer.",
  },
} as const;

function Panne() {
  const kind = useGame((s) => s.panne) ?? "serveur";
  const { titre, texte } = PANNES[kind];
  return (
    <main className="ecran panne">
      <p className="panne__logo" aria-hidden="true">Grattouille</p>
      <Icon name="hors-ligne" size={40} />
      <h1 className="t-titre">{titre}</h1>
      <p>{texte}</p>
      <Bouton bloc onClick={() => void boot()}>Réessayer</Bouton>
      {kind === "absent" && (
        <a className="bouton bouton--secondaire bouton--bloc" href="?bac-a-sable">
          <span className="bouton__texte">Jouer dans le bac à sable</span>
        </a>
      )}
    </main>
  );
}

function Paysage() {
  return (
    <div className="paysage" role="status">
      <Icon name="telephone" size={56} />
      <p className="t-fort">Tourne ton téléphone.</p>
    </div>
  );
}

export function App() {
  const phase = useGame((s) => s.phase);
  const calm = useGame(isCalm);
  const planche = new URLSearchParams(window.location.search).has("planche");

  useEffect(() => {
    document.documentElement.classList.toggle("calme", calm);
  }, [calm]);

  useEffect(() => {
    // Le contexte audio démarre au premier toucher.
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
    window.addEventListener("keydown", unlock, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
    };
  }, []);

  if (planche) {
    return (
      <Suspense fallback={<Amorce />}>
        <ArtDefs />
        <Planche />
      </Suspense>
    );
  }
  return (
    <>
      <ArtDefs />
      {phase === "amorce" && <Amorce />}
      {phase === "panne" && <Panne />}
      {phase === "bienvenue" && <Bienvenue />}
      {phase === "jeu" && <Jeu />}
      {/* Hors du jeu aussi, un message doit pouvoir s'afficher (compte supprimé, compte inconnu). */}
      {phase !== "jeu" && <Message onglets={false} />}
      <Paysage />
    </>
  );
}

export { nav };
