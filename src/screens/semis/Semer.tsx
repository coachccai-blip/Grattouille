// Semer (LOT4.md, section 3) : sous le bouton d'achat de la fiche d'un ticket, le Patron
// peut en laisser tomber pour ceux qui débarquent sans rien. Un, cinq ou dix : les mêmes
// carnets qu'au comptoir. Il les paie, et ce n'est pas lui qui les grattera.
//
// Un joueur qui n'est pas Patron ne voit jamais ce morceau : la fiche ne le monte que pour
// qui possède le Kiosque (FicheTicket.tsx).

import { useState } from "react";
import { formatEuros } from "../../../shared/format";
import { BOOKLET_SIZES, ticketById } from "../../../shared/tickets";
import { atLeast } from "../../app/helpers";
import { nav } from "../../app/nav";
import { sowTickets, useGame } from "../../app/store";
import { playTicketDrop } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { t } from "../../i18n";
import { Bouton } from "../../ui/Bouton";
import "./semis.css";

export function Semer({ ticket }: { ticket: string }) {
  const def = ticketById(ticket);
  const online = useGame((s) => s.online);
  const [busy, setBusy] = useState<number | null>(null);
  if (!def) return null;

  const semer = async (qty: number) => {
    if (busy !== null) return;
    setBusy(qty);
    const t0 = performance.now();
    // Un refus (bourse trop légère, guichet trop pressé) s'affiche tout seul.
    const ok = await sowTickets(def.id, qty);
    if (ok) {
      await atLeast(t0, 350);
      // Le ticket quitte la main, volette, et se pose sur le quai.
      playTicketDrop();
      haptic.buy();
      const semes = useGame.getState().player?.stats.sown ?? qty;
      // Qui le trouve ? La vignette se pose par-dessus la fiche : on y revient ensuite, pour en semer d'autres.
      nav.push({ name: "semis", ticket: def.id, rang: Math.max(1, semes - qty + 1), qty });
    }
    setBusy(null);
  };

  return (
    <section className="semer" aria-labelledby="semer-titre">
      <h3 className="semer__titre" id="semer-titre">{t("Laisser tomber pour un nouveau venu")}</h3>
      <p className="note">{t("Tu l'offres à qui débarque sans rien. Il ne te rapporte que des nouvelles.")}</p>
      <div className="semer__choix">
        {BOOKLET_SIZES.map((qty) => {
          const prix = formatEuros(def.price * qty);
          return (
            <Bouton
              key={qty}
              variante="secondaire"
              className="semer__bouton"
              attente={busy === qty}
              disabled={busy !== null || !online}
              onClick={() => void semer(qty)}
              aria-label={qty > 1 ? t("Laisser tomber {n} tickets pour {prix}", { n: qty, prix }) : t("Laisser tomber 1 ticket pour {prix}", { prix })}
            >
              <strong>{qty > 1 ? t("{n} tickets", { n: qty }) : t("1 ticket")}</strong>
              <span className="chiffres">{prix}</span>
            </Bouton>
          );
        })}
      </div>
    </section>
  );
}
