// La coquille de l'application : une seule page, pas de routes d'URL (BRIEF.md, section 12.1).

import { lazy, Suspense, useEffect, useLayoutEffect, type ComponentType } from "react";
import { hasTabs, nav, resolveScreens, screenKey, tabOf, useNav, type Screen } from "./app/nav";
import { boot, closeTrueEnding, isCalm, openTrueEnding, trueEndingDue, useGame } from "./app/store";
import { Icon } from "./art/icons";
import { ArtDefs } from "./art/kit";
import { installGestes } from "./fx/gestes";
import { t } from "./i18n";
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
import { Crieur } from "./screens/trophees/Crieur";
import { Bouton } from "./ui/Bouton";
import { Message, Onglets } from "./ui/Commun";
import "./app.css";

// La planche de contrôle n'est chargée que sur demande (?planche).
const Planche = lazy(() => import("./screens/planche/Planche"));

// Le Poker Tricheur a son propre morceau : il n'est chargé qu'en poussant sa porte.
const Poker = lazy(() => import("./screens/poker"));

// La vitrine des trophées aussi : ses dessins et les noms des médailles n'arrivent qu'avec elle.
const Trophees = lazy(() => import("./screens/trophees"));

/** Au lancement, qui est assis à une table de poker y revient : une fois, pas à chaque changement de langue. */
let pokerRepris = false;

/** Un morceau de la suite n'est pas arrivé (plus de réseau) : on referme ce qu'il devait montrer, sans rien casser. */
function Absent() {
  useEffect(() => {
    if (useGame.getState().trueEnding) closeTrueEnding(false);
    else nav.back();
  }, []);
  return null;
}

const ouAbsent = <P,>(morceau: Promise<{ default: ComponentType<P> }>): Promise<{ default: ComponentType<P> }> =>
  morceau.catch(() => ({ default: Absent }));

// La suite de l'histoire a ses propres morceaux : la vraie fin, puis les tickets semés et le Carnet du Patron.
const VraieFin = lazy(() => ouAbsent(import("./screens/moments/VraieFin")));
const Semis = lazy(() => ouAbsent(import("./screens/semis")));

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
    // Le Carnet du Patron, et la vignette d'un ticket semé : chargés à la demande, eux aussi.
    case "carnet":
      return <Suspense fallback={<main className="ecran" aria-busy="true" />}><Semis screen={screen} /></Suspense>;
    case "semis":
      return <Suspense fallback={null}><Semis screen={screen} /></Suspense>;
    // Le temps que le morceau du poker arrive : un écran vide à sa place, ou pas encore de feuille.
    case "poker":
    case "poker-table":
      return <Suspense fallback={<main className="ecran" aria-busy="true" />}><Poker screen={screen} /></Suspense>;
    case "poker-feuille":
      return <Suspense fallback={null}><Poker screen={screen} /></Suspense>;
    case "trophees":
      return <Suspense fallback={<main className="ecran" aria-busy="true" />}><Trophees /></Suspense>;
  }
}

function Jeu() {
  const stack = useNav((s) => s.stack);
  const index = useNav((s) => s.index);
  const welcome = useGame((s) => s.welcome);
  const opening = useGame((s) => s.openings[0]);
  const ending = useGame((s) => s.ending);
  const trueEnding = useGame((s) => s.trueEnding);
  const due = useGame(trueEndingDue);
  const sandbox = useGame((s) => s.sandbox);
  const { base, baseIndex, sheets } = resolveScreens(stack, index);
  const tabs = hasTabs(base);
  const moment = ending || Boolean(opening) || welcome;
  const key = screenKey(base, baseIndex);

  // La vraie fin se mérite (le Kiosque, les huit défis), et se joue au retour sur le Domaine :
  // jamais par-dessus un autre grand moment.
  const surLeDomaine = base.name === "domaine" && sheets.length === 0;
  useEffect(() => {
    if (due && surLeDomaine && !moment) openTrueEnding();
  }, [due, surLeDomaine, moment]);

  // Un nouvel écran s'ouvre en haut de page, quel que soit le défilement de celui qu'on quitte.
  // (La Promenade se cale ensuite d'elle-même sur le meilleur lieu ouvert.)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);

  // Bac à sable : le bandeau a sa propre ligne tout en haut, que chaque écran lui laisse (app.css).
  // Avant le premier affichage, pour que rien ne saute.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("bac-a-sable", sandbox);
    return () => document.documentElement.classList.remove("bac-a-sable");
  }, [sandbox]);

  // Revenu dans le jeu alors qu'on est assis à une table de poker (l'état du joueur le
  // dit) : on retrouve sa place, avec le hall et la Promenade derrière soi.
  useEffect(() => {
    if (pokerRepris) return;
    pokerRepris = true;
    const code = useGame.getState().player?.poker?.code;
    if (code) nav.reset([{ name: "promenade" }, { name: "poker" }, { name: "poker-table", code }]);
  }, []);

  return (
    <>
      {/* Derrière un grand moment (accueil, ouverture d'un lieu, générique), l'écran ne répond plus. */}
      <div className="jeu__fond" inert={moment || trueEnding}>
        <ScreenView key={key} screen={base} />
        {tabs && <Onglets actif={tabOf(base)} />}
        {sheets.map((sheet, i) => <ScreenView key={screenKey(sheet, baseIndex + 1 + i)} screen={sheet} />)}
      </div>
      {trueEnding
        ? <Suspense fallback={null}><VraieFin /></Suspense>
        : ending ? <Fin /> : opening ? <Ouverture key={opening} place={opening} /> : welcome ? <Accueil /> : null}
      <Message onglets={tabs && sheets.length === 0} />
      {/* Une médaille vient d'être gagnée : le crieur l'annonce, quand la place est libre. */}
      <Crieur />
      {sandbox &&<p className="bandeau-bac-a-sable"><span>{t("Bac à sable : rien n'est enregistré.")}</span></p>}
    </>
  );
}

function Amorce() {
  return (
    <div className="amorce" role="status" aria-label={t("Chargement de Grattouille")}>
      <span aria-hidden="true">Grattouille</span>
      <span className="amorce__piece" aria-hidden="true" />
    </div>
  );
}

// Les pannes, en français : ce sont les clés de traduction, lues à l'affichage.
// Le texte ne répète pas le bouton qui le suit (« Réessayer », « Jouer dans le bac à sable »).
const PANNES = {
  reseau: {
    titre: "Pas de réponse du kiosque.",
    texte: "Vérifie ta connexion. Ta fortune et tes tickets t'attendent bien au chaud.",
  },
  serveur: {
    titre: "Le kiosque ne répond pas.",
    texte: "Laisse-lui un instant. Ta fortune et tes tickets t'attendent bien au chaud.",
  },
  absent: {
    titre: "Le kiosque n'est pas encore ouvert.",
    texte: "Cette page a été publiée sans son serveur de jeu. Tu peux jouer quand même : rien ne sera enregistré.",
  },
} as const;

function Panne() {
  const kind = useGame((s) => s.panne) ?? "serveur";
  const { titre, texte } = PANNES[kind];
  return (
    <main className="ecran panne">
      <p className="panne__logo" aria-hidden="true">Grattouille</p>
      <Icon name="hors-ligne" size={40} />
      <h1 className="t-titre">{t(titre)}</h1>
      <p>{t(texte)}</p>
      <Bouton bloc onClick={() => void boot()}>{t("Réessayer")}</Bouton>
      {kind === "absent" && (
        <a className="bouton bouton--secondaire bouton--bloc" href="?bac-a-sable">
          <span className="bouton__texte">{t("Jouer dans le bac à sable")}</span>
        </a>
      )}
    </main>
  );
}

function Paysage() {
  return (
    <div className="paysage" role="status">
      <Icon name="telephone" size={56} />
      <p className="t-fort">{t("Tourne ton téléphone.")}</p>
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

  // Le contexte audio démarre au premier toucher, et tout ce qui se touche a son appui.
  useEffect(() => installGestes(), []);

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
