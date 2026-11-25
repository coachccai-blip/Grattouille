// Fiche d'un ticket (BRIEF.md, sections 3 et 12.2) : règle, tableau des lots en
// euros avec les chances réelles, tempérament. La transparence fait partie du jeu.

import { useState } from "react";
import { expectedReturn, oddsLabel, prizeTable, winningWeight } from "../../../shared/economy";
import { formatEuros, formatReturn } from "../../../shared/format";
import { ticketById } from "../../../shared/tickets";
import { atLeast } from "../../app/helpers";
import { nav } from "../../app/nav";
import { buyTickets } from "../../app/store";
import { ruleOf } from "../../engines";
import { playTicketBought } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Bouton } from "../../ui/Bouton";
import { Jauge } from "../../ui/Commun";
import { Feuille } from "../../ui/Feuille";
import "./comptoir.css";

export function FicheTicket({ ticket }: { ticket: string }) {
  const def = ticketById(ticket);
  const [busy, setBusy] = useState(false);
  if (!def) return null;
  const table = prizeTable(def);

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    const sold = await buyTickets(def.id, 1);
    if (sold) {
      await atLeast(t0, 500);
      playTicketBought();
      haptic.buy();
      // La fiche laisse sa place à l'écran de grattage : le retour ramène au comptoir.
      nav.replace({ name: "grattage", tickets: sold });
      return;
    }
    setBusy(false);
  };

  return (
    <Feuille titre={`Règles et lots : ${def.name}`} onClose={() => nav.back()} className="fiche-ticket">
      <div className="fiche-ticket__tete">
        <h2 className="t-titre">{def.name}</h2>
        <span className="fiche-ticket__prix">{formatEuros(def.price)}</span>
      </div>
      <Jauge temperament={def.temperament} />
      <p>{ruleOf(def)}</p>
      {def.engine === "etoile" && <p className="note">Ton signe ne change pas tes chances. Il change la tête du ticket.</p>}
      <p className="note">
        Un ticket sur {oddsLabel(winningWeight(def.temperament)).replace("1 sur ", "")} gagne. Chaque euro misé en
        rapporte {formatReturn(expectedReturn(def.temperament))} en moyenne.
      </p>

      <table className="lots">
        <caption>Tableau des lots et chances réelles</caption>
        <thead>
          <tr>
            <th scope="col">Gain</th>
            <th scope="col">Chance</th>
          </tr>
        </thead>
        <tbody>
          {[...table].reverse().map((row) => (
            <tr key={row.multiplier} className={row.multiplier === 0 ? "lots__perdu" : undefined}>
              <td>{row.multiplier === 0 ? "Perdu" : formatEuros(row.amount)}</td>
              <td>{row.odds}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="fiche-ticket__acheter">
        <Bouton bloc attente={busy} onClick={() => void buy()}>Acheter {formatEuros(def.price)}</Bouton>
      </div>
    </Feuille>
  );
}
