// La Promenade (BRIEF.md, sections 4.1 et 5.3) : les huit lieux empilés, le Kiosque
// en bas et la Lune tout en haut, ouverte sur le meilleur lieu débloqué. Les lieux
// fermés sont visibles, grisés, avec leur plaque. C'est aussi là qu'on trouve, de
// temps en temps, un ticket par terre.

import { useEffect, useRef } from "react";
import { formatEuros, formatInt } from "../../../shared/format";
import { PLACES } from "../../../shared/places";
import { bestPlace, nextPlace } from "../../../shared/rules";
import { ticketsOfPlace } from "../../../shared/tickets";
import type { PlaceDef } from "../../../shared/types";
import { capitalize, placeBackground } from "../../app/helpers";
import { nav } from "../../app/nav";
import { toast, useGame } from "../../app/store";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { cx } from "../../ticket/parts";
import { Bourse } from "../../ui/Bourse";
import { Entete, Phrase } from "../../ui/Commun";
import { TicketParTerre } from "../../ui/Trouve";
import "./promenade.css";

export function Promenade() {
  const standing = useGame((s) => s.player?.standing ?? 0);
  const best = bestPlace(standing);
  const next = nextPlace(standing);
  const bestRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Ouverte sur le meilleur lieu débloqué.
    bestRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const enter = (place: PlaceDef) => {
    if (standing >= place.standing) {
      nav.push({ name: "comptoir", place: place.id });
      return;
    }
    const missing = place.standing - standing;
    toast(`${capitalize(place.short)} ouvre à ★ ${formatInt(place.standing)}. Il te manque ${formatInt(missing)} ★ : passe chez Sidonie.`, "erreur");
  };

  return (
    <main className="ecran ecran--onglets promenade">
      <Entete titre="La Promenade" droite={<Bourse />} />
      <ol className="promenade__rue" reversed>
        {/* De la Lune jusqu'au port : le Kiosque est en bas. */}
        {[...PLACES].reverse().map((place) => {
          const open = standing >= place.standing;
          const tickets = ticketsOfPlace(place.id);
          const status = open
            ? `ouvert, tickets de ${formatEuros(tickets[0]!.price)} à ${formatEuros(tickets[tickets.length - 1]!.price)}`
            : place.id === next?.id
              ? `fermé : encore ${formatInt(place.standing - standing)} ★`
              : `fermé : ★ ${formatInt(place.standing)}`;
          return (
            <li key={place.id}>
              <button
                ref={place.id === best.id ? bestRef : undefined}
                type="button"
                className={cx("lieu", !open && "lieu--ferme")}
                onClick={() => enter(place)}
                aria-label={`${place.name}, ${status.replace("★", "étoiles")}`}
              >
                <span className="lieu__decor" style={placeBackground(place.id)} aria-hidden="true">
                  <Illustration id={`place:${place.id}`} />
                </span>
                {/* Le nom et l'état, sur une plaque : lisibles sur tous les ciels. */}
                <span className="lieu__plaque" aria-hidden="true">
                  <span className="lieu__nom">{place.name}</span>
                  <span className="lieu__etat">
                    {!open && <Icon name="cadenas" size={16} />}
                    <Phrase text={status} />
                  </span>
                </span>
                <span className="lieu__moment" aria-hidden="true">{place.moment}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <TicketParTerre />
    </main>
  );
}
