// Les grands moments, en plein écran : l'accueil de Piou, l'ouverture d'un lieu
// (BRIEF.md, section 9.5) et le générique de fin (section 5.6).

import { useEffect, useRef } from "react";
import { placeById } from "../../../shared/places";
import { ticketsOfPlace } from "../../../shared/tickets";
import { formatEuros } from "../../../shared/format";
import type { PlaceId } from "../../../shared/types";
import { FIN, PIOU, hostName, patronLine } from "../../app/dialogues";
import { skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import { closeEnding, closeOpening, closeWelcome, isCalm, useGame } from "../../app/store";
import { Illustration, Portrait } from "../../art/Illustration";
import { playOpening, playTier } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Fx } from "../../fx/particles";
import { Bouton } from "../../ui/Bouton";
import { Bulle, BulleLibre } from "../../ui/Commun";
import { usePickUp } from "../../ui/Trouve";
import "./moments.css";

/**
 * Piou accueille un nouveau compte (section 5.4). On débarque sans un sou : le premier
 * ticket se ramasse par terre, et Piou emmène ensuite au Kiosque.
 */
export function Accueil() {
  const { busy, pickUp } = usePickUp((ticket) => {
    closeWelcome();
    // Le ticket se gratte devant le Kiosque : c'est là qu'on se retrouve ensuite, 5 € en poche.
    nav.reset([{ name: "promenade" }, { name: "comptoir", place: "kiosque" }, { name: "grattage", tickets: [ticket] }]);
  });
  return (
    <div className="moment moment--accueil" role="dialog" aria-modal="true" aria-label="Bienvenue à Grattouille-les-Bains">
      <div className="moment__decor" style={{ backgroundImage: skyOf("kiosque") }} aria-hidden="true">
        <Illustration id="place:kiosque" />
      </div>
      <div className="moment__corps">
        <BulleLibre pnj="piou" nom="Piou">{PIOU.accueil}</BulleLibre>
        <BulleLibre pnj="piou" nom="Piou">{PIOU.premierTrouve}</BulleLibre>
        <Bouton bloc attente={busy} onClick={pickUp}>Ramasser le ticket</Bouton>
        <Bouton variante="texte" onClick={closeWelcome}>Faire un tour d'abord</Bouton>
      </div>
    </div>
  );
}

/**
 * Ouverture d'un lieu. Quand un achat fait franchir un seuil de Standing, l'écran
 * s'assombrit et le lieu se présente : sa façade, son hôte, la phrase, et « Y aller ».
 * C'est la récompense principale de la progression : elle a droit à son plein écran.
 */
export function Ouverture({ place }: { place: PlaceId }) {
  const def = placeById(place);
  const tickets = ticketsOfPlace(place);
  useEffect(() => {
    playOpening();
    haptic.tier("gros");
  }, []);
  const go = () => {
    closeOpening();
    nav.reset([{ name: "promenade" }, { name: "comptoir", place }]);
  };
  return (
    <div className="moment moment--ouverture" role="dialog" aria-modal="true" aria-label={`${def.name} vous ouvre ses portes`}>
      <div className="moment__decor" style={{ backgroundImage: skyOf(place) }} aria-hidden="true">
        <Illustration id={`place:${place}`} />
      </div>
      <div className="moment__corps">
        <p className="moment__moment">{def.moment}</p>
        <h2 className="moment__titre">{def.name} vous ouvre ses portes.</h2>
        <div className="moment__hote">
          <Portrait pnj={def.host} />
          <p>
            {hostName(def.host)} vous y attend. Tickets de {formatEuros(tickets[0]!.price)} à{" "}
            {formatEuros(tickets[tickets.length - 1]!.price)}.
          </p>
        </div>
        <Bouton bloc onClick={go}>Y aller</Bouton>
        <Bouton variante="texte" onClick={closeOpening}>Plus tard</Bouton>
      </div>
    </div>
  );
}

/** Générique de fin : Gaspard remet les clés et appelle désormais le joueur « Patron ». */
export function Fin() {
  const calm = useGame(isCalm);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    playTier("jackpot");
    haptic.tier("jackpot");
    const fx = canvas.current && !calm ? new Fx(canvas.current) : null;
    fx?.confetti(130, 4000);
    fx?.coinRain(50, 4000);
    return () => fx?.destroy();
  }, [calm]);
  return (
    <div className="moment moment--fin" role="dialog" aria-modal="true" aria-label="Générique de fin">
      <div className="moment__decor" style={{ backgroundImage: skyOf("kiosque") }} aria-hidden="true">
        <Illustration id="item:kiosque" />
      </div>
      <div className="moment__corps">
        <h2 className="moment__titre">{FIN.titre}</h2>
        <Bulle line={patronLine("accueil", 0) && { speaker: "gaspard", name: "Gaspard", text: FIN.gaspard, gesture: false }} />
        <p>{FIN.texte}</p>
        <p className="note">{FIN.suite}</p>
        <Bouton bloc onClick={closeEnding}>Continuer à jouer</Bouton>
      </div>
      <canvas ref={canvas} className="moment__fx" aria-hidden="true" />
    </div>
  );
}
