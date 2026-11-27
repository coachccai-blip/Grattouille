// À gratter (BRIEF.md, sections 6.6 et 12.2) : la pile des tickets en attente,
// gardée par Piou. Un ticket acheté n'est jamais perdu : il attend ici.
//
// Piou en garde jusqu'à cinq cents (shared/rules.ts) : la pile se range donc par ticket.
// Les tickets du même type font une seule ligne, avec leur nombre sur la vignette ; ceux
// trouvés par terre ont la leur, juste après. Les lignes suivent l'ordre des comptoirs, du
// moins cher au plus cher : elles ne bougent pas pendant qu'on gratte. La liste se lit dans
// l'ordre où l'on gratte : « Gratter le suivant » prend le premier ticket de la première
// ligne ; toucher une ligne gratte ses tickets d'abord, puis les lignes suivantes.

import { useMemo } from "react";
import { formatEuros, formatInt } from "../../../shared/format";
import { TICKETS, ticketById } from "../../../shared/tickets";
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

/** Le rang d'un ticket dans l'ordre des comptoirs. Un ticket inconnu passe en dernier. */
const RANG = new Map(TICKETS.map((def, i) => [def.id, i]));
const rang = (type: string) => RANG.get(type) ?? TICKETS.length;

/** La pile rangée par ticket : l'ordre des comptoirs, et ceux trouvés par terre juste après ceux achetés. */
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
  return [...paquets.values()].sort((a, b) => rang(a.type) - rang(b.type) || Number(a.house) - Number(b.house));
}

/** Ce que gratte un appui sur la ligne `i` : ses tickets d'abord, puis les lignes suivantes, puis celles d'avant. */
export function fileDepuis(paquets: readonly Paquet[], i: number): PendingTicket[] {
  return [...paquets.slice(i), ...paquets.slice(0, i)].flatMap((paquet) => paquet.tickets);
}

function Ligne({ paquets, i }: { paquets: readonly Paquet[]; i: number }) {
  const paquet = paquets[i]!;
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
        onClick={() => nav.push({ name: "grattage", tickets: fileDepuis(paquets, i) })}
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
  // La pile, dans l'ordre où elle se lit : c'est celui du grattage.
  const file = useMemo(() => fileDepuis(paquets, 0), [paquets]);
  return (
    <main className="ecran a-gratter">
      <Entete titre={t("À gratter")} retour droite={<Bourse />} />
      <BulleLibre pnj="piou" nom={hostName("piou")}>{pile.length > 0 ? PIOU.enAttente(pile.length) : PIOU.pileVide}</BulleLibre>

      <ul className="pile cascade">
        {paquets.map((paquet, i) => <Ligne key={`${paquet.type}|${paquet.house}`} paquets={paquets} i={i} />)}
      </ul>

      <div className="a-gratter__actions">
        {pile.length > 0 ? (
          <>
            <Bouton bloc onClick={() => nav.push({ name: "grattage", tickets: file })}>
              {pile.length > 1 ? t("Gratter le suivant") : t("Gratter")}
            </Bouton>
            {pile.length > 1 && (
              <Bouton variante="secondaire" bloc onClick={() => nav.push({ name: "grattage", tickets: file, rafale: true })}>
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
