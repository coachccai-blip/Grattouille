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
 * À poser une fois, au lancement. Rend la fonction qui retire les écoutes.
 *
 * Le contexte audio démarre au premier geste : les navigateurs n'autorisent le son qu'après
 * un geste, et selon le navigateur c'est le doigt qui se pose ou le doigt qui se lève qui
 * compte. On essaie donc aux deux : au pire, le tout premier son part quand le doigt se lève.
 *
 * L'appui léger part quand le geste est bien un appui (au « click », doigt levé, ou à
 * l'activation au clavier) : ces grandes surfaces sont aussi celles qu'on attrape pour faire
 * défiler la page, et un doigt posé sur un lieu de la Promenade pour remonter la rue ne doit
 * pas sonner. (Les boutons, eux, sonnent dès qu'on les enfonce : voir ui/Bouton.tsx.)
 */
export function installGestes(): () => void {
  const unlock = () => unlockAudio();
  const onClick = (e: MouseEvent) => {
    unlockAudio();
    if (!silentOrOwn(e.target)) playTap("secondaire");
  };
  window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  window.addEventListener("pointerup", unlock, { capture: true, passive: true });
  window.addEventListener("keydown", unlock, { capture: true });
  window.addEventListener("click", onClick, { capture: true });
  return () => {
    window.removeEventListener("pointerdown", unlock, { capture: true });
    window.removeEventListener("pointerup", unlock, { capture: true });
    window.removeEventListener("keydown", unlock, { capture: true });
    window.removeEventListener("click", onClick, { capture: true });
  };
}
