// Navigation (BRIEF.md, section 12.1) : une seule page, sans routes d'URL.
// Le bouton retour du téléphone ramène à l'écran précédent : un état d'historique
// par écran. Les feuilles (fiches) sont des entrées comme les autres, pour que le
// bouton retour les referme.

import { create } from "zustand";
import type { PendingTicket, PlaceId, ShopId } from "../../shared/types";

export type Tab = "domaine" | "promenade" | "boutiques" | "classement";

export type Screen =
  | { name: Tab }
  | { name: "dressing" }
  | { name: "reglages" }
  // La vitrine des trophées : un écran à part, chargé à la demande.
  | { name: "trophees" }
  | { name: "comptoir"; place: PlaceId }
  | { name: "a-gratter" }
  | { name: "grattage"; tickets: PendingTicket[]; rafale?: boolean }
  | { name: "boutique"; shop: ShopId }
  // Le Carnet du Patron : les tickets semés et les nouvelles des protégés. Chargé à la demande.
  | { name: "carnet" }
  // Feuilles : posées par-dessus l'écran du dessous.
  | { name: "fiche-ticket"; ticket: string }
  | { name: "fiche-article"; item: string }
  | { name: "choix-domaine"; slot: "residence" | "vehicule" }
  // Des tickets viennent d'être semés : qui les trouve (`rang` : le premier des `qty`). Posé par-dessus la fiche.
  | { name: "semis"; ticket: string; rang: number; qty: number }
  // Le Poker Tricheur : le hall, une table (par son code), et leurs feuilles.
  | { name: "poker" }
  | { name: "poker-table"; code: string }
  | ({ name: "poker-feuille" } & PokerSheet);

/**
 * Les feuilles du Poker Tricheur : les règles, créer une table, rejoindre avec un code,
 * s'asseoir à la table d'un lieu, relever le défi de son hôte, remplacer une carte (sa
 * place dans la main), accuser un joueur (son siège), quitter la table, recaver.
 */
export type PokerSheet =
  | { feuille: "regles" | "creer" | "rejoindre" | "quitter" | "recave" }
  | { feuille: "maison" | "defi"; place: PlaceId }
  | { feuille: "triche"; index: number }
  | { feuille: "accuser"; seat: number }
  // La Table des Maîtres : ses règles en trois lignes, avant de s'y asseoir.
  | { feuille: "maitres" };

const SHEETS = new Set(["fiche-ticket", "fiche-article", "choix-domaine", "poker-feuille", "semis"]);
const TABS = new Set<string>(["domaine", "promenade", "boutiques", "classement"]);

export function isSheet(screen: Screen): boolean {
  return SHEETS.has(screen.name);
}

export function isTab(screen: Screen): screen is { name: Tab } {
  return TABS.has(screen.name);
}

interface NavState {
  stack: Screen[];
  /** Position dans la pile : l'écran affiché. */
  index: number;
}

const ROOT: Screen = { name: "domaine" };

export const useNav = create<NavState>(() => ({ stack: [ROOT], index: 0 }));

let listening = false;
/** Ce qu'il reste à empiler une fois le retour arrière terminé. */
let afterPop: (() => void) | null = null;

function onPopState(event: PopStateEvent): void {
  const state = event.state as { gr?: number } | null;
  const { stack } = useNav.getState();
  const wanted = typeof state?.gr === "number" ? state.gr : 0;
  useNav.setState({ index: Math.max(0, Math.min(stack.length - 1, wanted)) });
  const next = afterPop;
  afterPop = null;
  next?.();
}

/** À appeler une fois au lancement. */
export function initNav(): void {
  if (listening) return;
  listening = true;
  try {
    window.history.replaceState({ gr: 0 }, "");
  } catch {
    // Historique indisponible : la navigation reste en mémoire.
  }
  window.addEventListener("popstate", onPopState);
}

function pushState(index: number): void {
  try {
    window.history.pushState({ gr: index }, "");
  } catch {
    // Voir initNav.
  }
}

export const nav = {
  /** L'écran affiché (une feuille compte). */
  current(): Screen {
    const { stack, index } = useNav.getState();
    return stack[index] ?? ROOT;
  },

  push(screen: Screen): void {
    const { stack, index } = useNav.getState();
    const next = [...stack.slice(0, index + 1), screen];
    useNav.setState({ stack: next, index: next.length - 1 });
    pushState(next.length - 1);
  },

  /** Remplace l'écran affiché, sans toucher à l'historique. */
  replace(screen: Screen): void {
    const { stack, index } = useNav.getState();
    const next = stack.slice(0, index + 1);
    next[index] = screen;
    useNav.setState({ stack: next });
  },

  back(): void {
    const { index } = useNav.getState();
    if (index <= 0) return;
    try {
      window.history.back();
    } catch {
      useNav.setState({ index: index - 1 });
    }
  },

  /**
   * Revient au Domaine, puis empile ces écrans. Sert aux onglets et aux raccourcis
   * (« Y aller » après l'ouverture d'un lieu).
   */
  reset(screens: Screen[]): void {
    const { index } = useNav.getState();
    const pushAll = () => {
      useNav.setState({ stack: [ROOT], index: 0 });
      for (const s of screens) nav.push(s);
    };
    if (index <= 0) {
      pushAll();
      return;
    }
    afterPop = pushAll;
    try {
      window.history.go(-index);
    } catch {
      afterPop = null;
      pushAll();
    }
  },

  /**
   * Change d'onglet. Le Domaine est l'écran de départ : y revenir, c'est revenir
   * en arrière ; les autres onglets se remplacent entre eux.
   */
  tab(tab: Tab): void {
    const { stack, index } = useNav.getState();
    const here = stack[index] ?? ROOT;
    if (here.name === tab && index <= 1) return;
    if (tab === "domaine") {
      nav.reset([]);
      return;
    }
    if (index === 1 && isTab(here)) {
      nav.replace({ name: tab });
      return;
    }
    nav.reset([{ name: tab }]);
  },
};

/** L'écran plein à afficher, et les feuilles ouvertes par-dessus. */
export function resolveScreens(stack: readonly Screen[], index: number): { base: Screen; baseIndex: number; sheets: Screen[] } {
  let baseIndex = index;
  while (baseIndex > 0 && isSheet(stack[baseIndex]!)) baseIndex--;
  return { base: stack[baseIndex] ?? ROOT, baseIndex, sheets: stack.slice(baseIndex + 1, index + 1) };
}

/**
 * La clé d'un écran dans la pile : deux écrans de même clé sont le même écran. La
 * coquille s'en sert pour monter les écrans, les transitions pour savoir lequel s'en va.
 */
export function screenKey(screen: Screen, index: number): string {
  switch (screen.name) {
    case "comptoir": return `${index}:comptoir:${screen.place}`;
    case "boutique": return `${index}:boutique:${screen.shop}`;
    case "grattage": return `${index}:grattage:${screen.tickets[0]?.id ?? ""}`;
    case "fiche-ticket": return `${index}:fiche-ticket:${screen.ticket}`;
    case "fiche-article": return `${index}:fiche-article:${screen.item}`;
    case "choix-domaine": return `${index}:choix:${screen.slot}`;
    case "semis": return `${index}:semis:${screen.rang}`;
    case "poker-table": return `${index}:poker-table:${screen.code}`;
    case "poker-feuille": return `${index}:poker-feuille:${screen.feuille}`;
    default: return `${index}:${screen.name}`;
  }
}

const WITH_TABS = new Set<string>(["domaine", "promenade", "boutiques", "boutique", "classement"]);

/** Vrai si cet écran porte la barre d'onglets. */
export function hasTabs(screen: Screen): boolean {
  return WITH_TABS.has(screen.name);
}

/** L'onglet auquel appartient un écran, pour la barre d'onglets. */
export function tabOf(screen: Screen): Tab | null {
  switch (screen.name) {
    case "domaine":
    case "dressing":
      return "domaine";
    case "promenade":
      return "promenade";
    case "boutiques":
    case "boutique":
      return "boutiques";
    case "classement":
      return "classement";
    default:
      return null;
  }
}
