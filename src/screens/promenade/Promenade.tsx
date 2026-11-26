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
import { placeBackground } from "../../app/helpers";
import { nav } from "../../app/nav";
import { lockedText, toast, useGame } from "../../app/store";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { mouetteParfois } from "../../fx/ambiance";
import { t } from "../../i18n";
import { placeMoment, placeName } from "../../i18n/noms";
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

  // Le bord de mer : de temps en temps, une mouette passe.
  useEffect(() => mouetteParfois(), []);

  useEffect(() => {
    // Ouverte sur le meilleur lieu débloqué.
    const show = () => bestRef.current?.scrollIntoView({ block: "center" });
    show();
    // Au retour d'un autre écran, le navigateur remet la page là où on l'avait laissée. Si la
    // Promenade n'avait encore jamais été affichée, c'est tout en haut, sur la Lune : on
    // revient alors au meilleur lieu ouvert.
    const frame = requestAnimationFrame(() => {
      const box = bestRef.current?.getBoundingClientRect();
      if (box && window.scrollY < 1 && box.bottom > window.innerHeight) show();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const enter = (place: PlaceDef) => {
    if (standing >= place.standing) nav.push({ name: "comptoir", place: place.id });
    else toast(lockedText(place.id, standing), "erreur");
  };

  return (
    <main className="ecran ecran--onglets promenade">
      <Entete titre={t("La Promenade")} droite={<Bourse />} />
      <ol className="promenade__rue" reversed>
        {/* De la Lune jusqu'au port : le Kiosque est en bas. */}
        {[...PLACES].reverse().map((place) => {
          const open = standing >= place.standing;
          const tickets = ticketsOfPlace(place.id);
          const lieu = placeName(place.id);
          // Sur la plaque, l'essentiel : le cadenas et le gris disent « fermé », la couleur dit « ouvert ».
          // La phrase entière est pour les lecteurs d'écran.
          let etat: string;
          let lu: string;
          if (open) {
            const prix = { min: formatEuros(tickets[0]!.price), max: formatEuros(tickets[tickets.length - 1]!.price) };
            etat = t("Tickets de {min} à {max}", prix);
            lu = t("{lieu}, ouvert, tickets de {min} à {max}", { lieu, ...prix });
          } else if (place.id === next?.id) {
            const n = formatInt(place.standing - standing);
            etat = t("Encore {n} ★", { n });
            lu = t("{lieu}, fermé : encore {n} étoiles", { lieu, n });
          } else {
            const n = formatInt(place.standing);
            etat = t("Ouvre à ★ {n}", { n });
            lu = t("{lieu}, fermé : ouvre à {n} étoiles", { lieu, n });
          }
          return (
            <li key={place.id}>
              <button
                ref={place.id === best.id ? bestRef : undefined}
                type="button"
                className={cx("lieu", !open && "lieu--ferme")}
                onClick={() => enter(place)}
                aria-label={lu}
              >
                <span className="lieu__decor" style={placeBackground(place.id)} aria-hidden="true">
                  <Illustration id={`place:${place.id}`} />
                </span>
                {/* Le nom et l'état, sur une plaque : lisibles sur tous les ciels. */}
                <span className="lieu__plaque" aria-hidden="true">
                  <span className="lieu__moment">{placeMoment(place.id)}</span>
                  <span className="lieu__nom">{lieu}</span>
                  <span className="lieu__etat">
                    {!open && <Icon name="cadenas" size={16} />}
                    <Phrase text={etat} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <TicketParTerre />
    </main>
  );
}
