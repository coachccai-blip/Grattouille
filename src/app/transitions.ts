// Les transitions d'écran. Entrer dans un écran : il glisse depuis la droite ; revenir :
// l'écran qu'on quitte repart à droite ; changer d'onglet : fondu croisé ; une feuille
// qui se ferme redescend ; un grand moment qui s'achève se fond.
//
// La navigation ne change pas : les écrans se montent et se démontent exactement comme
// avant, d'un seul coup. Ce module ne fait que regarder le magasin de navigation. Quand
// l'écran affiché va changer, il en prend une copie figée (un « fantôme »), la pose à sa
// place exacte, et c'est elle qui joue la sortie pendant que le nouvel écran entre. Le
// fantôme ne reçoit aucun geste et s'enlève tout seul : rien n'est monté deux fois, rien
// ne peut rester bloqué, et l'on peut toucher le nouvel écran dès sa première image.
//
// Le sens de la transition est posé sur <html> (`data-nav`) : c'est lui qui choisit
// l'entrée du nouvel écran dans styles/mouvement.css.

import { hasTabs, resolveScreens, screenKey, tabOf, useNav, type Screen } from "./nav";
import { isCalm, useGame } from "./store";

type Kind = "pousse" | "retour" | "fondu";

/** Ce qui est à l'écran pour un état de la navigation. */
interface View {
  base: Screen;
  baseIndex: number;
  baseKey: string;
  sheetKeys: string[];
  tabs: boolean;
}

function viewOf(state: { stack: readonly Screen[]; index: number }): View {
  const { base, baseIndex, sheets } = resolveScreens(state.stack, state.index);
  return {
    base,
    baseIndex,
    baseKey: screenKey(base, baseIndex),
    sheetKeys: sheets.map((sheet, i) => screenKey(sheet, baseIndex + 1 + i)),
    tabs: hasTabs(base),
  };
}

function kindOf(from: View, to: View): Kind {
  const a = tabOf(from.base);
  const b = tabOf(to.base);
  // D'un onglet à l'autre : fondu croisé.
  if (a !== null && b !== null && a !== b) return "fondu";
  if (to.baseIndex > from.baseIndex) return "pousse";
  if (to.baseIndex < from.baseIndex) return "retour";
  return "fondu";
}

/** Ce qui se prépare pendant un même geste : plusieurs changements de la pile peuvent s'y suivre. */
interface Pending {
  from: View;
  /** Le sens qui était posé avant ce geste : on le remet si, tout compte fait, l'écran ne change pas. */
  navBefore: string | undefined;
  screen: HTMLElement | null;
  tabsClone: HTMLElement | null;
  sheets: HTMLElement[] | null;
}

let pending: Pending | null = null;
const ghosts = new Set<HTMLElement>();

function calm(): boolean {
  return isCalm(useGame.getState()) || document.documentElement.classList.contains("calme");
}

function canAnimate(): boolean {
  return !calm() && document.visibilityState === "visible" && useGame.getState().phase === "jeu";
}

function dismiss(ghost: HTMLElement): void {
  ghosts.delete(ghost);
  ghost.remove();
}

function dismissAll(): void {
  for (const ghost of [...ghosts]) dismiss(ghost);
}

/** Le fantôme s'enlève à la fin de son animation ; au pire, une demi-seconde plus tard. */
function release(ghost: HTMLElement): void {
  ghosts.add(ghost);
  const done = (e?: Event) => {
    if (e && e.target !== ghost) return;
    dismiss(ghost);
  };
  ghost.addEventListener("animationend", done);
  ghost.addEventListener("animationcancel", done);
  window.setTimeout(() => dismiss(ghost), 520);
}

/** Recopie le contenu des canvas (l'encre d'un ticket) : une copie de nœud ne le fait pas. */
function copyCanvases(from: Element, to: Element): void {
  const a = from.querySelectorAll("canvas");
  const b = to.querySelectorAll("canvas");
  a.forEach((canvas, i) => {
    const copy = b[i];
    // Le canvas d'effets (pièces, confettis en vol) reste vide : des particules figées ne diraient rien.
    if (!copy || canvas.classList.contains("grattage__fx") || canvas.classList.contains("moment__fx")) return;
    try {
      copy.getContext("2d")?.drawImage(canvas, 0, 0);
    } catch {
      // Un canvas vide ou libéré : la copie reste blanche.
    }
  });
}

/** Les boîtes qui défilent dans l'écran gardent leur défilement dans la copie. */
const SCROLLERS = ".feuille__corps, .rayons, .grattage__scene";

function copyScroll(from: Element, to: Element): void {
  const a = from.matches(SCROLLERS) ? [from, ...from.querySelectorAll(SCROLLERS)] : [...from.querySelectorAll(SCROLLERS)];
  const b = to.matches(SCROLLERS) ? [to, ...to.querySelectorAll(SCROLLERS)] : [...to.querySelectorAll(SCROLLERS)];
  a.forEach((el, i) => {
    const copy = b[i];
    if (!copy || (el.scrollTop === 0 && el.scrollLeft === 0)) return;
    copy.scrollTop = el.scrollTop;
    copy.scrollLeft = el.scrollLeft;
  });
}

function cloneOf(el: Element): HTMLElement {
  const copy = el.cloneNode(true) as HTMLElement;
  copyCanvases(el, copy);
  return copy;
}

/** La copie de l'écran affiché, posée à sa place exacte. Rend `null` s'il n'y a rien à copier. */
function buildScreenGhost(): { ghost: HTMLElement; tabs: HTMLElement | null } | null {
  const fond = document.querySelector(".jeu__fond");
  const screen = fond?.querySelector(":scope > .ecran");
  if (!fond || !(screen instanceof HTMLElement)) return null;
  const rect = screen.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;

  const ghost = document.createElement("div");
  ghost.className = "fantome";
  ghost.setAttribute("aria-hidden", "true");
  ghost.inert = true;

  const scroller = document.createElement("div");
  scroller.className = "fantome__defile";
  const copy = cloneOf(screen);
  // Mêmes dimensions que l'original : la mise en page de la copie est la sienne, au pixel près.
  copy.style.flex = "none";
  copy.style.width = `${rect.width}px`;
  copy.style.height = `${screen.offsetHeight}px`;
  copy.style.minHeight = "0";
  scroller.appendChild(copy);
  ghost.appendChild(scroller);

  // Les feuilles ouvertes par-dessus l'écran partent avec lui.
  fond.querySelectorAll(":scope > .feuille__voile, :scope > .feuille").forEach((el) => ghost.appendChild(cloneOf(el)));

  // La barre d'onglets : copiée à part, et gardée seulement si elle s'en va avec l'écran.
  const bar = fond.querySelector(":scope > .onglets");
  const tabs = bar ? cloneOf(bar) : null;

  document.body.appendChild(ghost);
  // Le défilement de la page devient celui de la copie (elle est en place : elle peut défiler).
  scroller.scrollTop = Math.max(0, -rect.top);
  copyScroll(screen, copy);
  const sheets = fond.querySelectorAll(":scope > .feuille");
  const copies = ghost.querySelectorAll(":scope > .feuille");
  sheets.forEach((sheet, i) => {
    if (copies[i]) copyScroll(sheet, copies[i]!);
  });
  return { ghost, tabs };
}

/** Règle la copie de l'écran pour la transition décidée : son animation, sa place dans la pile, ses onglets. */
function stage(p: Pending, kind: Kind, to: View): void {
  const ghost = p.screen;
  if (!ghost) return;
  ghost.className = `fantome fantome--${kind}`;
  // Les onglets partent avec l'écran quand le suivant n'en a pas ; sinon la vraie barre reste en place.
  const leaving = p.from.tabs && !to.tabs;
  if (p.tabsClone) {
    if (leaving && p.tabsClone.parentNode !== ghost) ghost.appendChild(p.tabsClone);
    else if (!leaving) p.tabsClone.remove();
  }
  if (kind === "pousse") {
    // Sous le nouvel écran, qui glisse par-dessus : avant lui dans la page, sans rang.
    ghost.style.zIndex = "";
    const root = document.getElementById("root");
    if (root && ghost.nextSibling !== root) document.body.insertBefore(ghost, root);
  } else {
    // Par-dessus le nouvel écran. Quand les onglets restent, ils restent aussi au-dessus du fantôme.
    ghost.style.zIndex = p.from.tabs && to.tabs ? "29" : "35";
    if (ghost.parentNode !== document.body || ghost.nextSibling !== null) document.body.appendChild(ghost);
  }
}

/** Les copies des feuilles qui se referment (et de leur voile), posées à leur place. */
function buildSheetGhosts(from: View, to: View): HTMLElement[] {
  const fond = document.querySelector(".jeu__fond");
  if (!fond) return [];
  const sheets = [...fond.querySelectorAll(":scope > .feuille")];
  const veils = [...fond.querySelectorAll(":scope > .feuille__voile")];
  const out: HTMLElement[] = [];
  from.sheetKeys.forEach((key, i) => {
    if (to.sheetKeys.includes(key)) return;
    const veil = veils[i];
    const sheet = sheets[i];
    if (veil) {
      const copy = cloneOf(veil);
      copy.classList.add("fantome-voile");
      copy.setAttribute("aria-hidden", "true");
      document.body.appendChild(copy);
      out.push(copy);
    }
    if (sheet) {
      const copy = cloneOf(sheet);
      copy.classList.add("fantome-feuille");
      copy.setAttribute("aria-hidden", "true");
      copy.removeAttribute("role");
      copy.removeAttribute("aria-modal");
      copy.removeAttribute("tabindex");
      copy.inert = true;
      document.body.appendChild(copy);
      copyScroll(sheet, copy);
      out.push(copy);
    }
  });
  return out;
}

function setNav(kind: string | undefined): void {
  const root = document.documentElement;
  if (kind === undefined) delete root.dataset.nav;
  else root.dataset.nav = kind;
}

/** La pile vient de changer. Appelé à chaque changement, avant que React ne redessine : l'ancien écran est encore là. */
function onNav(state: { stack: readonly Screen[]; index: number }, prev: { stack: readonly Screen[]; index: number }): void {
  const to = viewOf(state);
  if (!pending) {
    const from = viewOf(prev);
    if (from.baseKey === to.baseKey && from.sheetKeys.join("|") === to.sheetKeys.join("|")) return;
    // Un nouveau geste : la transition précédente, si elle court encore, laisse la place.
    dismissAll();
    pending = { from, navBefore: document.documentElement.dataset.nav, screen: null, tabsClone: null, sheets: null };
    // Tout ce qui change la pile dans la même foulée (revenir au Domaine, puis empiler deux
    // écrans) ne fait qu'une transition : du premier écran au dernier.
    queueMicrotask(() => {
      const p = pending;
      pending = null;
      if (!p) return;
      if (p.screen) release(p.screen);
      for (const ghost of p.sheets ?? []) release(ghost);
    });
  }
  const p = pending;
  const animate = canAnimate();

  if (p.from.baseKey !== to.baseKey) {
    // L'écran change.
    const kind = kindOf(p.from, to);
    setNav(kind);
    for (const ghost of p.sheets ?? []) ghost.remove();
    p.sheets = null;
    if (!animate) return;
    if (!p.screen) {
      const built = buildScreenGhost();
      if (!built) return;
      p.screen = built.ghost;
      p.tabsClone = built.tabs;
    }
    stage(p, kind, to);
    return;
  }

  // Le même écran : tout au plus une feuille s'ouvre (elle monte toute seule) ou se referme.
  setNav(p.navBefore);
  if (p.screen) {
    p.screen.remove();
    p.screen = null;
    p.tabsClone = null;
  }
  const closing = p.from.sheetKeys.some((key) => !to.sheetKeys.includes(key));
  if (closing && animate) {
    if (!p.sheets) p.sheets = buildSheetGhosts(p.from, to);
  } else if (p.sheets) {
    for (const ghost of p.sheets) ghost.remove();
    p.sheets = null;
  }
}

/** Le grand moment affiché, comme la coquille le choisit (App.tsx). */
function momentOf(s: { ending: boolean; openings: readonly string[]; welcome: boolean; phase: string }): string | null {
  if (s.phase !== "jeu") return null;
  if (s.ending) return "fin";
  if (s.openings[0]) return `ouverture:${s.openings[0]}`;
  return s.welcome ? "accueil" : null;
}

/** Un grand moment s'achève : sa copie se fond, au lieu de disparaître d'un coup. */
function onGame(state: Parameters<typeof momentOf>[0], prev: Parameters<typeof momentOf>[0]): void {
  const before = momentOf(prev);
  if (before === null || before === momentOf(state)) return;
  if (calm() || document.visibilityState !== "visible") return;
  const moment = document.querySelector(".moment");
  if (!moment) return;
  const copy = cloneOf(moment);
  copy.classList.add("fantome-moment");
  copy.setAttribute("aria-hidden", "true");
  copy.removeAttribute("role");
  copy.removeAttribute("aria-modal");
  copy.inert = true;
  document.body.appendChild(copy);
  copy.scrollTop = moment.scrollTop;
  release(copy);
}

let started = false;

/** À appeler une fois au lancement, après `initNav`. */
export function initTransitions(): void {
  if (started || typeof document === "undefined") return;
  started = true;
  useNav.subscribe(onNav);
  useGame.subscribe(onGame);
  // Une page qui passe en arrière-plan n'anime plus rien : les fantômes s'en vont.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") dismissAll();
  });
}
