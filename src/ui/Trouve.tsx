// Le ticket trouvé par terre (section 5.5 du brief, « le coup de pouce de la maison »,
// revue : on ne reste jamais bloqué, et la chance passe de temps en temps).
//
// `usePickUp` ramasse le ticket et part le gratter. `TicketParTerre` est le petit
// ticket qui brille au bas d'un écran quand il y en a un à ramasser.

import { useState } from "react";
import type { PendingTicket } from "../../shared/types";
import { atLeast } from "../app/helpers";
import { nav } from "../app/nav";
import { pickUpTicket, useFound } from "../app/store";
import { Icon } from "../art/icons";
import { playTicketBought } from "../fx/audio";
import { haptic } from "../fx/haptics";
import "./trouve.css";

/**
 * Ramasse le ticket par terre. Par défaut, l'écran de grattage s'ouvre par-dessus
 * l'écran courant ; `then` permet d'aller ailleurs (l'accueil emmène au Kiosque).
 */
export function usePickUp(then?: (ticket: PendingTicket) => void): { busy: boolean; pickUp: () => void } {
  const [busy, setBusy] = useState(false);
  const pickUp = () => {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    void pickUpTicket().then(async (ticket) => {
      if (ticket) {
        await atLeast(t0, 350);
        playTicketBought();
        haptic.buy();
        if (then) then(ticket);
        else nav.push({ name: "grattage", tickets: [ticket] });
      }
      setBusy(false);
    });
  };
  return { busy, pickUp };
}

/** Le ticket qui traîne au bas de l'écran, au-dessus des onglets. Rien s'il n'y en a pas. */
export function TicketParTerre() {
  const found = useFound();
  const { busy, pickUp } = usePickUp();
  if (!found) return null;
  return (
    <>
      {/* La place de la pastille, en bas du défilement : elle ne cache rien de l'écran. */}
      <div className="par-terre__reserve" aria-hidden="true" />
      <button type="button" className="par-terre" onClick={pickUp} disabled={busy}>
        <span className="par-terre__ticket" aria-hidden="true"><Icon name="jouer" plein size={24} /></span>
        <span className="par-terre__texte">
          <strong>Un ticket par terre !</strong>
          <span>
            {found === "fauche" ? "De quoi te refaire." : "C'est ton jour de chance."}{" "}
            <span className="par-terre__geste">Ramasse-le.</span>
          </span>
        </span>
        <span className="par-terre__eclat" aria-hidden="true" />
      </button>
    </>
  );
}
