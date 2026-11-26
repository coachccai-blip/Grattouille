// Les grands moments, en plein écran (RECIT.md ; BRIEF.md, sections 5.4, 5.6 et 9.5) :
// l'arrivée sur le quai, l'ouverture d'un lieu et le générique de fin. Ce sont les
// cartons de chapitre du récit : une journée qui n'en finit pas, du matin sur le port
// au lever de Terre sur la Lune, puis le lendemain matin.

import { useEffect, useRef, useState } from "react";
import { formatEuros } from "../../../shared/format";
import { ticketsOfPlace } from "../../../shared/tickets";
import type { PlaceId } from "../../../shared/types";
import { FIN, PIOU, chapterOf, hostName, ouverture } from "../../app/dialogues";
import { skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import { closeEnding, closeOpening, closeWelcome, isCalm, useGame } from "../../app/store";
import { Illustration, Portrait } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { playOpening, playTicketBought, playTier } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Fx } from "../../fx/particles";
import { t } from "../../i18n";
import { placeMoment, placeName } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { usePickUp } from "../../ui/Trouve";
import "./moments.css";

/** « Chapitre 3 · Coucher de soleil » : chaque lieu est une heure de la journée. */
function Chapitre({ place }: { place: PlaceId }) {
  return <p className="moment__chapitre">{t("Chapitre {n} · {moment}", { n: chapterOf(place), moment: placeMoment(place) })}</p>;
}

/**
 * Un personnage et ce qu'il dit : son portrait et son nom une seule fois, puis une
 * bulle par phrase. `citation` : une parole d'hôte, entre guillemets comme au comptoir
 * (Piou, lui, parle sans guillemets partout dans le jeu).
 */
function Paroles({ pnj, lignes, citation = false }: { pnj: string; lignes: readonly string[]; citation?: boolean }) {
  return (
    <div className="moment__paroles">
      <Portrait pnj={pnj} />
      <div className="moment__bulles">
        {lignes.map((ligne, i) => (
          <p key={i} className="bulle__texte">
            {i === 0 && <span className="bulle__nom">{hostName(pnj)}</span>}
            {citation ? t("« {replique} »", { replique: ligne }) : ligne}
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * Le ticket du quai, celui que quelqu'un a laissé tomber. Il brille au pied du Kiosque
 * le premier matin ; au générique, c'est le joueur qui le laisse tomber pour un autre.
 */
function TicketDuQuai({ tombe = false }: { tombe?: boolean }) {
  return (
    <span className={cx("moment__ticket", tombe && "moment__ticket--tombe")}>
      <span className="moment__ticket-papier"><Icon name="jouer" plein size={22} /></span>
      <span className="moment__ticket-eclat" />
    </span>
  );
}

/**
 * Chapitre 1 : on débarque sans un sou, et un ticket traîne sur le quai (section 5.4).
 * Piou le montre du bec. Le ramasser emmène le gratter devant le Kiosque.
 */
export function Accueil() {
  const { busy, pickUp } = usePickUp((ticket) => {
    closeWelcome();
    // Le ticket se gratte devant le Kiosque : c'est là qu'on se retrouve ensuite, les premiers euros en poche.
    nav.reset([{ name: "promenade" }, { name: "comptoir", place: "kiosque" }, { name: "grattage", tickets: [ticket] }]);
  });
  return (
    <div className="moment moment--accueil" role="dialog" aria-modal="true" aria-label={t("Bienvenue à Grattouille-les-Bains")}>
      <div className="moment__decor" style={{ backgroundImage: skyOf("kiosque") }} aria-hidden="true">
        <Illustration id="place:kiosque" />
        <TicketDuQuai />
      </div>
      <div className="moment__corps">
        <Chapitre place="kiosque" />
        <Paroles pnj="piou" lignes={[PIOU.accueil, PIOU.premierTrouve]} />
        <Bouton bloc attente={busy} onClick={pickUp}>{t("Ramasser le ticket")}</Bouton>
        <Bouton variante="texte" onClick={closeWelcome}>{t("Faire un tour d'abord")}</Bouton>
      </div>
    </div>
  );
}

/**
 * Ouverture d'un lieu : un carton de chapitre. Quand un achat fait franchir un seuil
 * de Standing, l'écran s'assombrit et le lieu se présente : sa façade, son heure, son
 * nom, son hôte qui dit un mot, et le prix de ses tickets. C'est la récompense
 * principale de la progression : elle a droit à son plein écran.
 */
export function Ouverture({ place }: { place: PlaceId }) {
  const tickets = ticketsOfPlace(place);
  const nom = placeName(place);
  const hote = ouverture(place);
  useEffect(() => {
    playOpening();
    haptic.tier("gros");
  }, []);
  const go = () => {
    closeOpening();
    nav.reset([{ name: "promenade" }, { name: "comptoir", place }]);
  };
  return (
    <div className="moment moment--ouverture" role="dialog" aria-modal="true" aria-label={t("Un nouveau lieu ouvre : {lieu}", { lieu: nom })}>
      <div className="moment__decor" style={{ backgroundImage: skyOf(place) }} aria-hidden="true">
        <Illustration id={`place:${place}`} />
      </div>
      <div className="moment__corps">
        <Chapitre place={place} />
        <h2 className="moment__titre">{nom}</h2>
        <Paroles pnj={hote.speaker} lignes={[hote.text]} citation />
        <p className="moment__prix">
          <Icon name="jouer" plein size={20} />
          {t("Tickets de {min} à {max}", {
            min: formatEuros(tickets[0]!.price),
            max: formatEuros(tickets[tickets.length - 1]!.price),
          })}
        </p>
        <Bouton bloc onClick={go}>{t("Y aller")}</Bouton>
        <Bouton variante="texte" onClick={closeOpening}>{t("Plus tard")}</Bouton>
      </div>
    </div>
  );
}

/** Les trois temps du générique : les clés, l'aveu, puis le ticket qu'on laisse tomber à son tour. */
type Temps = "cles" | "aveu" | "epilogue";

/**
 * Générique de fin (section 5.6), en trois temps. Gaspard remet les clés et appelle
 * désormais le joueur « Patron ». Puis il avoue : les tickets par terre, c'était lui,
 * et c'est la tradition du Kiosque. Enfin le nouveau Patron laisse tomber un ticket
 * sur le quai pour celui qui débarque le lendemain : le geste est tout symbolique, il
 * ne demande rien au serveur. L'histoire recommence pour un autre, le jeu continue.
 */
export function Fin() {
  const calm = useGame(isCalm);
  const [temps, setTemps] = useState<Temps>("cles");
  const canvas = useRef<HTMLCanvasElement>(null);
  const corps = useRef<HTMLDivElement>(null);
  useEffect(() => {
    playTier("jackpot");
    haptic.tier("jackpot");
    const fx = canvas.current && !calm ? new Fx(canvas.current) : null;
    fx?.confetti(130, 4000);
    fx?.coinRain(50, 4000);
    return () => fx?.destroy();
  }, [calm]);
  // À chaque temps, la lecture d'écran repart du haut du texte.
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) premier.current = false;
    else corps.current?.focus();
  }, [temps]);

  const semer = () => {
    playTicketBought();
    haptic.buy();
    setTemps("epilogue");
  };

  return (
    <div className={cx("moment moment--fin", `moment--${temps}`)} role="dialog" aria-modal="true" aria-label={t("Générique de fin")}>
      {/* Le Kiosque doré tant que Gaspard parle ; puis le quai du premier matin, où tout recommence. */}
      <div className="moment__decor" style={{ backgroundImage: skyOf("kiosque") }} aria-hidden="true">
        {temps === "epilogue" ? <Illustration key="quai" id="place:kiosque" /> : <Illustration key="kiosque" id="item:kiosque" />}
        {temps === "epilogue" && <TicketDuQuai tombe />}
      </div>
      <div className="moment__corps moment__temps" key={temps} ref={corps} tabIndex={-1}>
        <p className="moment__chapitre">{t("Épilogue · Le lendemain matin")}</p>
        {temps === "cles" && (
          <>
            <h2 className="moment__titre">{FIN.titre}</h2>
            <Paroles pnj="gaspard" lignes={[FIN.gaspard]} citation />
            <Bouton bloc onClick={() => setTemps("aveu")}>{t("Prendre les clés")}</Bouton>
          </>
        )}
        {temps === "aveu" && (
          <>
            <h2 className="moment__titre">{FIN.question}</h2>
            <Paroles pnj="gaspard" lignes={FIN.aveu} citation />
            <Bouton bloc onClick={semer}>{t("Laisser tomber un ticket")}</Bouton>
          </>
        )}
        {temps === "epilogue" && (
          <>
            <p className="moment__recit">{FIN.texte}</p>
            <Paroles pnj="piou" lignes={[PIOU.nouveauVenu]} />
            <p className="note">{FIN.suite}</p>
            <Bouton bloc onClick={closeEnding}>{t("Continuer à jouer")}</Bouton>
          </>
        )}
      </div>
      <canvas ref={canvas} className="moment__fx" aria-hidden="true" />
    </div>
  );
}
