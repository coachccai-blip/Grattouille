// Le comptoir d'un lieu (BRIEF.md, sections 5.5, 6.6 et 12.2) : l'hôte, les trois
// tickets en carrousel, tempérament, prix. On y achète à l'unité, par carnet de 5
// ou de 10, et la maison y offre un ticket à qui n'a plus de quoi jouer.

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { maxGain } from "../../../shared/economy";
import { formatEuros } from "../../../shared/format";
import { placeById } from "../../../shared/places";
import { houseTicketDef } from "../../../shared/rules";
import { ticketsOfPlace } from "../../../shared/tickets";
import type { PlaceId } from "../../../shared/types";
import { PIOU, type Speaker } from "../../app/dialogues";
import { atLeast, lineFor, placeBackground } from "../../app/helpers";
import { nav } from "../../app/nav";
import { askHouseTicket, buyTickets, canAskHouse, toScratch, useGame } from "../../app/store";
import { playTicketBought } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Ticket } from "../../ticket/Ticket";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse } from "../../ui/Bourse";
import { Bulle, BulleLibre, Entete, HorsLigne, Jauge } from "../../ui/Commun";
import "./comptoir.css";

/** Le dernier ticket regardé dans chaque lieu, le temps de la visite. */
const lastChoice: Partial<Record<PlaceId, number>> = {};

/** Largeur d'une miniature : elle laisse toujours le comptoir et son bouton à l'écran. */
function useMiniWidth(): number {
  const measure = () => {
    const vw = Math.min(window.innerWidth, 480);
    const vh = window.innerHeight;
    return Math.round(Math.max(118, Math.min(250, vw * 0.62, (vh - 470) / 1.6)));
  };
  const [w, setW] = useState(measure);
  useEffect(() => {
    const update = () => setW(measure());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return w;
}

export function Comptoir({ place }: { place: PlaceId }) {
  const player = useGame((s) => s.player);
  const waiting = useGame((s) => toScratch(s).length);
  const house = useGame(canAskHouse);
  const def = placeById(place);
  const tickets = ticketsOfPlace(place);
  // À l'arrivée : le ticket choisi la dernière fois, sinon le moins cher. Jamais de pression.
  const [selected, setSelectedState] = useState(() => lastChoice[place] ?? 0);
  const setSelected = (next: number | ((i: number) => number)) => {
    setSelectedState((i) => {
      const value = typeof next === "function" ? next(i) : next;
      lastChoice[place] = value;
      return value;
    });
  };
  const [busy, setBusy] = useState<number | "maison" | null>(null);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const width = useMiniWidth();
  const swipe = useRef<{ x: number; id: number } | null>(null);

  if (!player) return null;
  const ticket = tickets[selected]!;
  const open = player.standing >= def.standing;
  // La maison offre le ticket le moins cher du meilleur lieu débloqué : ici, si c'est ce lieu.
  const houseHere = house && houseTicketDef(player.standing).place === place;
  const line = lineFor(player, def.host as Speaker, "accueil", seed);

  const buy = async (qty: number) => {
    if (busy !== null) return;
    setBusy(qty);
    const t0 = performance.now();
    const sold = await buyTickets(ticket.id, qty);
    if (sold) {
      // Le distributeur tourne jusqu'à la réponse du serveur, 500 ms au moins.
      await atLeast(t0, 500);
      playTicketBought();
      haptic.buy();
      nav.push({ name: "grattage", tickets: sold });
    }
    setBusy(null);
  };

  const askHouse = async () => {
    if (busy !== null) return;
    setBusy("maison");
    const t0 = performance.now();
    const offered = await askHouseTicket();
    if (offered) {
      await atLeast(t0, 500);
      playTicketBought();
      haptic.buy();
      nav.push({ name: "grattage", tickets: [offered] });
    }
    setBusy(null);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    swipe.current = { x: e.clientX, id: e.pointerId };
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (dx < -36) setSelected((i) => Math.min(tickets.length - 1, i + 1));
    else if (dx > 36) setSelected((i) => Math.max(0, i - 1));
  };

  return (
    <main className={cx("ecran comptoir", `comptoir--${def.text}`)} style={placeBackground(place)}>
      <HorsLigne />
      <div className="comptoir__haut">
        <Entete titre={def.name} grand retour droite={<Bourse />} />
      </div>
      <Bulle line={line} className="comptoir__hote" />

      <div
        className="carrousel"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => { swipe.current = null; }}
        role="group"
        aria-label="Les trois tickets du lieu"
      >
        <div className="carrousel__piste" style={{ transform: `translateX(${(1 - selected) * (width * 0.86 + 12)}px)` }}>
          {tickets.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={cx("carrousel__ticket", i === selected && "carrousel__ticket--choisi")}
              style={{ width: width * 0.86 }}
              aria-pressed={i === selected}
              aria-label={`${t.name}, ${formatEuros(t.price)}, jusqu'à ${formatEuros(maxGain(t))}`}
              onClick={() => (i === selected ? nav.push({ name: "fiche-ticket", ticket: t.id }) : setSelected(i))}
            >
              <Ticket def={t} width={width * 0.86} mini />
            </button>
          ))}
        </div>
      </div>

      {/* Le comptoir lui-même : tout ce qui se touche est ici, à portée de pouce. */}
      <div className="comptoir__zinc">
        <div className="comptoir__infos">
          <Jauge temperament={ticket.temperament} />
          <Bouton variante="texte" onClick={() => nav.push({ name: "fiche-ticket", ticket: ticket.id })}>règles et lots</Bouton>
        </div>
        {!open ? (
          <p className="note">Ce lieu est encore fermé.</p>
        ) : houseHere ? (
          <>
            <BulleLibre pnj="piou" nom="Piou" className="comptoir__piou">{PIOU.maison}</BulleLibre>
            <Bouton bloc attente={busy === "maison"} disabled={busy !== null} onClick={() => void askHouse()}>
              Ticket offert par la maison
            </Bouton>
          </>
        ) : (
          <>
            <Bouton bloc attente={busy === 1} disabled={busy !== null} onClick={() => void buy(1)}>
              Acheter {formatEuros(ticket.price)}
            </Bouton>
            <div className="comptoir__carnets">
              <Bouton variante="secondaire" attente={busy === 5} disabled={busy !== null} onClick={() => void buy(5)}>
                Carnet de 5 pour {formatEuros(ticket.price * 5)}
              </Bouton>
              <Bouton variante="secondaire" attente={busy === 10} disabled={busy !== null} onClick={() => void buy(10)}>
                Carnet de 10 pour {formatEuros(ticket.price * 10)}
              </Bouton>
            </div>
          </>
        )}
        {waiting > 0 && (
          <Bouton variante="texte" onClick={() => nav.push({ name: "a-gratter" })}>À gratter ({waiting})</Bouton>
        )}
      </div>
    </main>
  );
}
