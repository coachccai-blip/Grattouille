// À gratter (BRIEF.md, sections 6.6 et 12.2) : la pile des tickets en attente,
// gardée par Piou. Un ticket acheté n'est jamais perdu : il attend ici.
//
// Piou en garde jusqu'à cinq cents (shared/rules.ts) : la pile se range donc par ticket.
// Les tickets du même type font une seule ligne, avec leur nombre sur la vignette ; ceux
// trouvés par terre ont la leur. Les lignes suivent l'ordre d'arrivée du premier de
// chacune. Toucher une ligne gratte ces tickets-là d'abord, puis le reste de la pile.

import { useMemo } from "react";
import { formatEuros, formatInt } from "../../../shared/format";
import { ticketById } from "../../../shared/tickets";
import type { PendingTicket } from "../../../shared/types";
import { PIOU, hostName } from "../../app/dialogues";
import { nav } from "../../app/nav";
import { toScratch, useGame } from "../../app/store";
import { Illustration } from "../../art/Illustration";
import { t } from "../../i18n";
import { ticketName } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse } from "../../ui/Bourse";
import { BulleLibre, Entete } from "../../ui/Commun";
import "../comptoir/comptoir.css";

/** Une ligne de la pile : les tickets d'un même type, trouvés par terre ou non, dans leur ordre d'arrivée. */
export interface Paquet {
  type: string;
  house: boolean;
  tickets: PendingTicket[];
}

/** La pile rangée par ticket, dans l'ordre d'arrivée du premier de chaque paquet. */
export function paquetsDe(pile: readonly PendingTicket[]): Paquet[] {
  const paquets = new Map<string, Paquet>();
  for (const ticket of pile) {
    const house = ticket.house === true;
    const cle = `${ticket.type}|${house ? "terre" : "achat"}`;
    let paquet = paquets.get(cle);
    if (!paquet) {
      paquet = { type: ticket.type, house, tickets: [] };
      paquets.set(cle, paquet);
    }
    paquet.tickets.push(ticket);
  }
  return [...paquets.values()];
}

/** Ce que gratte un appui sur un paquet : ses tickets d'abord, puis le reste de la pile, dans l'ordre. */
export function fileDepuis(paquet: Paquet, pile: readonly PendingTicket[]): PendingTicket[] {
  const siens = new Set(paquet.tickets.map((x) => x.id));
  return [...paquet.tickets, ...pile.filter((x) => !siens.has(x.id))];
}

function Ligne({ paquet, pile }: { paquet: Paquet; pile: readonly PendingTicket[] }) {
  const def = ticketById(paquet.type);
  if (!def) return null;
  const name = ticketName(def.id);
  const prix = formatEuros(def.price);
  const n = paquet.tickets.length;
  const label = paquet.house
    ? n > 1 ? t("Gratter {ticket}, trouvé par terre : {n} tickets", { ticket: name, n }) : t("Gratter {ticket}, trouvé par terre", { ticket: name })
    : n > 1 ? t("Gratter {ticket}, {prix} : {n} tickets", { ticket: name, prix, n }) : t("Gratter {ticket}, {prix}", { ticket: name, prix });
  return (
    <li className={n > 1 ? "pile__paquet" : undefined}>
      <button
        type="button"
        className={cx("pile__ticket", n > 1 && "pile__ticket--paquet")}
        onClick={() => nav.push({ name: "grattage", tickets: fileDepuis(paquet, pile) })}
        aria-label={label}
      >
        <span className="pile__vignette" aria-hidden="true">
          <Illustration id={`ticket:${def.id}`} />
          {/* Plusieurs tickets du même type : leur nombre, sur la vignette. */}
          {n > 1 && <span className="pile__nombre chiffres">{formatInt(n)}</span>}
        </span>
        <span className="pile__nom">
          {name}
          {/* Les mots mêmes qui sont imprimés sur le ticket. */}
          {paquet.house && <small>{t("Trouvé par terre")}</small>}
        </span>
        {/* Un ticket trouvé n'a rien coûté : pas de prix sur son talon. */}
        {!paquet.house && <span className="pile__prix">{prix}</span>}
      </button>
    </li>
  );
}

export function AGratter() {
  // Deux lectures stables, puis le calcul : un sélecteur qui fabrique un nouveau
  // tableau à chaque appel relancerait le rendu sans fin.
  const player = useGame((s) => s.player);
  const revealed = useGame((s) => s.revealed);
  const pile = useMemo(() => toScratch({ player, revealed }), [player, revealed]);
  const paquets = useMemo(() => paquetsDe(pile), [pile]);
  return (
    <main className="ecran a-gratter">
      <Entete titre={t("À gratter")} retour droite={<Bourse />} />
      <BulleLibre pnj="piou" nom={hostName("piou")}>{pile.length > 0 ? PIOU.enAttente(pile.length) : PIOU.pileVide}</BulleLibre>

      <ul className="pile cascade">
        {paquets.map((paquet) => <Ligne key={`${paquet.type}|${paquet.house}`} paquet={paquet} pile={pile} />)}
      </ul>

      <div className="a-gratter__actions">
        {pile.length > 0 ? (
          <>
            <Bouton bloc onClick={() => nav.push({ name: "grattage", tickets: pile })}>
              {pile.length > 1 ? t("Gratter le suivant") : t("Gratter")}
            </Bouton>
            {pile.length > 1 && (
              <Bouton variante="secondaire" bloc onClick={() => nav.push({ name: "grattage", tickets: pile, rafale: true })}>
                {t("Tout gratter en rafale")}
              </Bouton>
            )}
          </>
        ) : (
          <Bouton bloc onClick={() => nav.reset([{ name: "promenade" }])}>{t("Aller jouer")}</Bouton>
        )}
      </div>
    </main>
  );
}
