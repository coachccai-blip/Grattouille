// Chaque geste a son son. Les composants qui ont le leur (bouton, onglet, interrupteur,
// carrousel, choix) le jouent eux-mêmes et se signalent par l'attribut `data-son`.
// Tout le reste de ce qui se touche (un lieu de la Promenade, une vitrine, une
// étiquette, un talon de la pile...) reçoit ici l'appui léger : un écran ajouté demain
// sonnera sans rien avoir à brancher.

import { playTap, unlockAudio } from "./audio";

/** Ce qui se touche. */
const TOUCHABLE = 'button, a[href], [role="button"], [role="tab"], [role="radio"], [role="switch"]';

function silentOrOwn(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target.closest(TOUCHABLE) : null;
  if (!el) return true;
  // Le composant joue son propre son.
  if (el.hasAttribute("data-son")) return true;
  // Un bouton éteint ne répond pas, et ne sonne pas.
  return (el as HTMLButtonElement).disabled === true || el.getAttribute("aria-disabled") === "true";
}

/**
 * À poser une fois, au lancement. Le contexte audio démarre au premier toucher (les
 * navigateurs n'autorisent le son qu'après un geste), puis chaque appui obtient sa
 * réponse sonore en moins de 100 ms. Rend la fonction qui retire les écoutes.
 */
export function installGestes(): () => void {
  const onDown = (e: PointerEvent) => {
    unlockAudio();
    if (!silentOrOwn(e.target)) playTap("secondaire");
  };
  const onKey = () => unlockAudio();
  // Au clavier ou avec une technologie d'assistance, il n'y a pas d'appui : le son part
  // à l'activation (`detail` vaut alors 0).
  const onClick = (e: MouseEvent) => {
    if (e.detail === 0 && !silentOrOwn(e.target)) playTap("secondaire");
  };
  window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
  window.addEventListener("keydown", onKey, { capture: true });
  window.addEventListener("click", onClick, { capture: true });
  return () => {
    window.removeEventListener("pointerdown", onDown, { capture: true });
    window.removeEventListener("keydown", onKey, { capture: true });
    window.removeEventListener("click", onClick, { capture: true });
  };
}
