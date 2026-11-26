// Le comptoir d'un lieu (BRIEF.md, sections 5.5, 6.6 et 12.2) : l'hôte, les tickets
// du lieu en carrousel (de trois à cinq), puis le zinc : le nom du ticket choisi, son
// tempérament, son prix. On y achète à l'unité, par carnet de 5 ou de 10. Qui n'a plus
// de quoi jouer y trouve un ticket par terre.

import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import { maxGain } from "../../../shared/economy";
import { formatEuros } from "../../../shared/format";
import { placeById } from "../../../shared/places";
import { ticketsOfPlace } from "../../../shared/tickets";
import type { PlaceId } from "../../../shared/types";
import { PIOU, hostName, type Speaker } from "../../app/dialogues";
import { atLeast, lineFor, placeBackground } from "../../app/helpers";
import { nav } from "../../app/nav";
import { buyTickets, displayBalance, pickUpTicket, toScratch, useFound, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { ticketRamasse } from "../../fx/ambiance";
import { playClick, playPickUp, playTicketBought } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { t } from "../../i18n";
import { placeName, ticketName } from "../../i18n/noms";
import { Ticket, ticketHeight } from "../../ticket/Ticket";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse } from "../../ui/Bourse";
import { Bulle, BulleLibre, Entete, HorsLigne, Jauge } from "../../ui/Commun";
import { useFoundSparkle } from "../../ui/Trouve";
import "./comptoir.css";

/** Le dernier ticket regardé dans chaque lieu, le temps de la visite. */
const lastChoice: Partial<Record<PlaceId, number>> = {};

/** L'écart entre deux miniatures, en pixels. */
const GAP = 12;
/** Ce que le carrousel garde pour ses points, sous les miniatures (voir comptoir.css). */
const DOTS = 14;

/**
 * La largeur d'une miniature : ce que la hauteur du carrousel permet, mesurée, sans
 * dépasser ce qui laisse voir ses voisines. Le carrousel prend la place qui reste entre
 * l'hôte et le zinc : rien ne déborde, et le zinc reste sous le pouce.
 * `ratio` : hauteur ÷ largeur de la plus haute miniature du lieu.
 */
function useMiniWidth(box: RefObject<HTMLElement | null>, ratio: number): number {
  const [width, setWidth] = useState(110);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const room = el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - DOTS;
      const widest = Math.min(Math.min(window.innerWidth, 480) * 0.56, 230);
      setWidth(Math.max(60, Math.floor(Math.min(widest, room / ratio))));
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [box, ratio]);
  return width;
}

export function Comptoir({ place }: { place: PlaceId }) {
  const player = useGame((s) => s.player);
  const waiting = useGame((s) => toScratch(s).length);
  const balance = useGame(displayBalance);
  const online = useGame((s) => s.online);
  const found = useFound();
  const def = placeById(place);
  const tickets = ticketsOfPlace(place);
  // À l'arrivée : le ticket choisi la dernière fois, sinon le moins cher. Jamais de pression.
  const [selected, setSelectedState] = useState(() => lastChoice[place] ?? 0);
  const setSelected = (next: number | ((i: number) => number)) => {
    const value = typeof next === "function" ? next(selected) : next;
    if (value === selected) return;
    // Un déclic par ticket : chacun a sa note, le long du carrousel.
    playClick(value);
    lastChoice[place] = value;
    setSelectedState(value);
  };
  const [busy, setBusy] = useState<number | "trouve" | null>(null);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const carousel = useRef<HTMLDivElement>(null);
  const ratio = Math.max(...tickets.map((x) => ticketHeight(x, 1)));
  const width = useMiniWidth(carousel, ratio);
  const swipe = useRef<{ x: number; id: number } | null>(null);
  const ticket = tickets[selected]!;
  // Sans le sou, un ticket traîne par terre : le comptoir le propose dès que le ticket
  // présenté est hors de portée, quel que soit le lieu.
  const foundHere = found === "fauche" && balance < ticket.price;
  useFoundSparkle(foundHere);

  if (!player) return null;
  const open = player.standing >= def.standing;
  const line = lineFor(player, def.host as Speaker, "accueil", seed);
  const prix = (qty: number) => formatEuros(ticket.price * qty);

  const buy = async (qty: number) => {
    if (busy !== null) return;
    setBusy(qty);
    const t0 = performance.now();
    const sold = await buyTickets(ticket.id, qty);
    if (sold) {
      // Le distributeur tourne jusqu'à la réponse du serveur, 500 ms au moins.
      await atLeast(t0, 500);
      // Le distributeur : un carnet s'imprime plus longtemps qu'un ticket.
      playTicketBought(qty);
      haptic.buy();
      nav.push({ name: "grattage", tickets: sold });
    }
    setBusy(null);
  };

  const pickUp = async () => {
    if (busy !== null) return;
    setBusy("trouve");
    const t0 = performance.now();
    const picked = await pickUpTicket();
    if (picked) {
      await atLeast(t0, 500);
      ticketRamasse();
      playPickUp();
      haptic.buy();
      nav.push({ name: "grattage", tickets: [picked] });
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
        <Entete
          titre={placeName(place)}
          grand
          retour
          droite={(
            <>
              {/* La pile « À gratter » : à côté de la bourse, avec ce qu'on possède. */}
              {waiting > 0 && (
                <button
                  type="button"
                  className="comptoir__pile"
                  onClick={() => nav.push({ name: "a-gratter" })}
                  aria-label={waiting > 1 ? t("{n} tickets à gratter", { n: waiting }) : t("1 ticket à gratter")}
                >
                  <Icon name="jouer" plein size={24} />
                  <span className="chiffres" aria-hidden="true">{waiting}</span>
                </button>
              )}
              <Bourse />
            </>
          )}
        />
      </div>
      {/* Une seule bulle à la fois : sans le sou, c'est Piou qui parle, et il montre le ticket par terre. */}
      {foundHere ? (
        <BulleLibre pnj="piou" nom={hostName("piou")} className="comptoir__hote">
          {player.stats.tickets === 0 ? PIOU.premierTrouve : player.kiosk ? PIOU.trouvePatron : PIOU.trouve("fauche", seed)}
        </BulleLibre>
      ) : (
        <Bulle line={line} className="comptoir__hote" />
      )}

      <div
        ref={carousel}
        className="carrousel"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => { swipe.current = null; }}
        role="group"
        aria-label={t("Les tickets du lieu")}
      >
        {/* La piste est centrée : on la décale pour amener le ticket choisi au milieu. */}
        {/* Les tickets du comptoir entrent en cascade, à partir du ticket présenté. */}
        <div className="carrousel__piste cascade" style={{ transform: `translateX(${((tickets.length - 1) / 2 - selected) * (width + GAP)}px)` }}>
          {tickets.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className={cx("carrousel__ticket", i === selected && "carrousel__ticket--choisi")}
              style={{ width, "--rang": Math.abs(i - selected) } as CSSProperties}
              data-son="carrousel"
              aria-pressed={i === selected}
              aria-label={t("{ticket}, {prix}, jusqu'à {max}", {
                ticket: ticketName(x.id), prix: formatEuros(x.price), max: formatEuros(maxGain(x)),
              })}
              onClick={() => (i === selected ? nav.push({ name: "fiche-ticket", ticket: x.id }) : setSelected(i))}
            >
              <Ticket def={x} width={width} mini />
            </button>
          ))}
        </div>
        <div className="carrousel__points" aria-hidden="true">
          {tickets.map((x, i) => <span key={x.id} className={cx("carrousel__point", i === selected && "carrousel__point--choisi")} />)}
        </div>
      </div>

      {/* Le comptoir lui-même : tout ce qui se touche est ici, à portée de pouce. */}
      <div className="comptoir__zinc">
        {/* Le ticket choisi, en clair : son nom et son tempérament. Sa promesse (« jusqu'à… ») est
            imprimée sur la miniature, juste au-dessus : le zinc ne la redit pas. */}
        <div className="comptoir__infos">
          <strong className="comptoir__nom">{ticketName(ticket.id)}</strong>
          <Jauge temperament={ticket.temperament} court />
          <Bouton variante="texte" className="comptoir__regles" onClick={() => nav.push({ name: "fiche-ticket", ticket: ticket.id })}>
            {t("règles et lots")}
          </Bouton>
        </div>
        {!open ? (
          <p className="note">{t("Ce lieu est encore fermé.")}</p>
        ) : foundHere ? (
          <Bouton bloc attente={busy === "trouve"} disabled={busy !== null} onClick={() => void pickUp()}>
            {t("Ramasser le ticket")}
          </Bouton>
        ) : (
          <>
            {/* Hors connexion, le bandeau dit déjà qu'on ne peut rien acheter : les boutons s'éteignent. */}
            {/* Un reflet passe sur le bouton quand la bourse suffit. */}
            <Bouton bloc reflet={balance >= ticket.price} attente={busy === 1} disabled={busy !== null || !online} onClick={() => void buy(1)}>
              {t("Acheter {prix}", { prix: prix(1) })}
            </Bouton>
            <div className="comptoir__carnets">
              {[5, 10].map((qty) => (
                <Bouton
                  key={qty}
                  variante="secondaire"
                  attente={busy === qty}
                  disabled={busy !== null || !online}
                  onClick={() => void buy(qty)}
                  aria-label={t("Carnet de {n} tickets pour {prix}", { n: qty, prix: prix(qty) })}
                >
                  {t("{n} pour {prix}", { n: qty, prix: prix(qty) })}
                </Bouton>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
