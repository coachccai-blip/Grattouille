// À gratter (BRIEF.md, sections 6.6 et 12.2) : la pile des tickets en attente,
// gardée par Piou. Un ticket acheté n'est jamais perdu : il attend ici.

import { useMemo } from "react";
import { formatEuros } from "../../../shared/format";
import { ticketById } from "../../../shared/tickets";
import { PIOU, hostName } from "../../app/dialogues";
import { nav } from "../../app/nav";
import { toScratch, useGame } from "../../app/store";
import { Illustration } from "../../art/Illustration";
import { t } from "../../i18n";
import { ticketName } from "../../i18n/noms";
import { Bouton } from "../../ui/Bouton";
import { Bourse } from "../../ui/Bourse";
import { BulleLibre, Entete } from "../../ui/Commun";
import "../comptoir/comptoir.css";

export function AGratter() {
  // Deux lectures stables, puis le calcul : un sélecteur qui fabrique un nouveau
  // tableau à chaque appel relancerait le rendu sans fin.
  const player = useGame((s) => s.player);
  const revealed = useGame((s) => s.revealed);
  const pile = useMemo(() => toScratch({ player, revealed }), [player, revealed]);
  return (
    <main className="ecran a-gratter">
      <Entete titre={t("À gratter")} retour droite={<Bourse />} />
      <BulleLibre pnj="piou" nom={hostName("piou")}>{pile.length > 0 ? PIOU.enAttente(pile.length) : PIOU.pileVide}</BulleLibre>

      <ul className="pile">
        {pile.map((ticket, i) => {
          const def = ticketById(ticket.type);
          if (!def) return null;
          const name = ticketName(def.id);
          const prix = formatEuros(def.price);
          return (
            <li key={ticket.id}>
              <button
                type="button"
                className="pile__ticket"
                onClick={() => nav.push({ name: "grattage", tickets: [...pile.slice(i), ...pile.slice(0, i)] })}
                aria-label={ticket.house
                  ? t("Gratter {ticket}, trouvé par terre", { ticket: name })
                  : t("Gratter {ticket}, {prix}", { ticket: name, prix })}
              >
                <span className="pile__vignette" aria-hidden="true"><Illustration id={`ticket:${def.id}`} /></span>
                <span className="pile__nom">
                  {name}
                  {ticket.house && <small>{t("Trouvé par terre, toujours gagnant")}</small>}
                </span>
                {/* Un ticket trouvé n'a rien coûté : pas de prix sur son talon. */}
                {!ticket.house && <span className="pile__prix">{prix}</span>}
              </button>
            </li>
          );
        })}
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
