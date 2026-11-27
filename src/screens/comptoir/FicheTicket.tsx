// Fiche d'un ticket (BRIEF.md, sections 3 et 12.2) : règle, tableau des lots en
// euros avec les chances réelles, tempérament. La transparence fait partie du jeu.

import { lazy, Suspense, useState, type ComponentType } from "react";
import { expectedReturn, prizeTable, winningWeight } from "../../../shared/economy";
import { formatEuros, formatReturn } from "../../../shared/format";
import { ticketById } from "../../../shared/tickets";
import { atLeast, oddsOutOf, oddsText, pickNote } from "../../app/helpers";
import { nav } from "../../app/nav";
import { buyTickets, canSow, displayBalance, useGame } from "../../app/store";
import { ruleOf } from "../../engines";
import { playTicketBought } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { t } from "../../i18n";
import { ticketName } from "../../i18n/noms";
import { Bouton } from "../../ui/Bouton";
import { Jauge } from "../../ui/Commun";
import { Feuille } from "../../ui/Feuille";
import "./comptoir.css";

/** Le geste du Patron : laisser tomber ce ticket pour un nouveau venu. Chargé à la demande, pour lui seul. */
const Semer = lazy((): Promise<{ default: ComponentType<{ ticket: string }> }> =>
  import("../semis").then((semis) => ({ default: semis.Semer }), () => ({ default: () => null })));

export function FicheTicket({ ticket }: { ticket: string }) {
  const def = ticketById(ticket);
  const balance = useGame(displayBalance);
  const patron = useGame(canSow);
  const [busy, setBusy] = useState(false);
  if (!def) return null;
  const table = prizeTable(def);
  const name = ticketName(def.id);
  const note = pickNote(def);

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    const sold = await buyTickets(def.id, 1);
    if (sold) {
      await atLeast(t0, 500);
      playTicketBought(1);
      haptic.buy();
      // La fiche laisse sa place à l'écran de grattage : le retour ramène au comptoir.
      nav.replace({ name: "grattage", tickets: sold });
      return;
    }
    setBusy(false);
  };

  return (
    <Feuille titre={t("Règles et lots : {ticket}", { ticket: name })} onClose={() => nav.back()} className="fiche-ticket">
      <div className="fiche-ticket__tete">
        <h2 className="t-titre">{name}</h2>
        <span className="fiche-ticket__prix">{formatEuros(def.price)}</span>
      </div>
      <Jauge temperament={def.temperament} />
      <p>{ruleOf(def)}</p>
      {note && <p className="note">{t(note)}</p>}
      <p className="note">
        {t("Un ticket sur {n} gagne. Chaque euro misé en rapporte {retour} en moyenne.", {
          n: oddsOutOf(winningWeight(def.temperament)),
          retour: formatReturn(expectedReturn(def.temperament)),
        })}
      </p>

      <table className="lots">
        {/* Le titre du tableau suffit à l'œil : les en-têtes de colonnes sont pour les lecteurs d'écran. */}
        <caption>{t("Lots et chances réelles")}</caption>
        <thead className="invisible">
          <tr>
            <th scope="col">{t("Gain")}</th>
            <th scope="col">{t("Chance")}</th>
          </tr>
        </thead>
        <tbody>
          {[...table].reverse().map((row) => (
            <tr key={row.multiplier} className={row.multiplier === 0 ? "lots__perdu" : undefined}>
              <td>{row.multiplier === 0 ? t("Perdu") : formatEuros(row.amount)}</td>
              <td>{oddsText(row.weight)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="fiche-ticket__acheter">
        <Bouton bloc reflet={balance >= def.price} attente={busy} onClick={() => void buy()}>
          {t("Acheter {prix}", { prix: formatEuros(def.price) })}
        </Bouton>
      </div>
      {patron && <Suspense fallback={null}><Semer ticket={def.id} /></Suspense>}
    </Feuille>
  );
}
