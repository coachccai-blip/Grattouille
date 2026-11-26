// Le ticket trouvé par terre (section 5.5 du brief, « le coup de pouce de la maison »,
// revue : on ne reste jamais bloqué, et la chance passe de temps en temps).
//
// `usePickUp` ramasse le ticket et part le gratter. `TicketParTerre` est le petit
// ticket qui brille au bas d'un écran quand il y en a un à ramasser.

import { useEffect, useState } from "react";
import type { PendingTicket } from "../../shared/types";
import { atLeast } from "../app/helpers";
import { nav } from "../app/nav";
import { pickUpTicket, useFound, useGame } from "../app/store";
import { Icon } from "../art/icons";
import { ticketParTerre, ticketRamasse } from "../fx/ambiance";
import { playPickUp } from "../fx/audio";
import { haptic } from "../fx/haptics";
import { t } from "../i18n";
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
        // « Hop » : un ticket ramassé ne sort pas du distributeur.
        ticketRamasse();
        playPickUp();
        haptic.buy();
        if (then) then(ticket);
        else nav.push({ name: "grattage", tickets: [ticket] });
      }
      setBusy(false);
    });
  };
  return { busy, pickUp };
}

/**
 * Un ticket par terre scintille (à l'oreille aussi) quand il apparaît : une fois par
 * ticket, quel que soit l'écran où on le voit d'abord. `shown` : il est à l'écran.
 */
export function useFoundSparkle(shown: boolean): void {
  const present = useFound() !== null;
  useEffect(() => {
    ticketParTerre(present, shown);
  }, [present, shown]);
}

/**
 * Le ticket qui traîne au bas de l'écran, au-dessus des onglets. Rien s'il n'y en a pas.
 * Deux lignes, pas plus : ce qu'il y a, et quoi faire. Le pourquoi, c'est Piou qui le raconte.
 * À poser en dernier dans un écran à onglets : la pastille reste en vue pendant que l'écran défile.
 */
export function TicketParTerre() {
  const found = useFound();
  // Un message bref s'affiche au même endroit : la pastille lui laisse la place, le temps qu'il passe.
  const message = useGame((s) => s.toast !== null);
  const { busy, pickUp } = usePickUp();
  useFoundSparkle(Boolean(found) && !message);
  if (!found) return null;
  return (
    // Le sol sur lequel la pastille est posée : ce qui défile passe dessous, jamais sous elle.
    <div className="par-terre__sol">
      {!message && (
        <button type="button" className="par-terre" onClick={pickUp} disabled={busy}>
          <span className="par-terre__ticket" aria-hidden="true"><Icon name="jouer" plein size={24} /></span>
          <span className="par-terre__texte">
            <strong>{t("Un ticket par terre !")}</strong>
            <span>{t("Ramasse-le.")}</span>
          </span>
          <span className="par-terre__eclat" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
