// Semer (LOT4.md, section 3) : sous le bouton d'achat de la fiche d'un ticket, le Patron
// peut en laisser tomber pour ceux qui débarquent sans rien. Un, cinq ou dix : les mêmes
// carnets qu'au comptoir. Il les paie, et ce n'est pas lui qui les grattera.
//
// Un joueur qui n'est pas Patron ne voit jamais ce morceau : la fiche ne le monte que pour
// qui possède le Kiosque (FicheTicket.tsx).

import { useEffect, useRef, useState } from "react";
import { formatEuros } from "../../../shared/format";
import { BUY_COOLDOWN_MS } from "../../../shared/rules";
import { BOOKLET_SIZES, ticketById } from "../../../shared/tickets";
import { atLeast } from "../../app/helpers";
import { nav } from "../../app/nav";
import { sowTickets, useGame } from "../../app/store";
import { t } from "../../app/suite/mots";
import { Icon } from "../../art/icons";
import { playTicketDrop } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Bouton } from "../../ui/Bouton";
import "./semis.css";

export function Semer({ ticket }: { ticket: string }) {
  const def = ticketById(ticket);
  const online = useGame((s) => s.online);
  const [busy, setBusy] = useState<number | null>(null);
  // Le guichet veut une seconde entre deux gestes : les boutons la laissent passer d'eux-mêmes,
  // plutôt que de refuser à qui referme la vignette d'un doigt pressé.
  const [repos, setRepos] = useState(false);
  const reprise = useRef(0);
  useEffect(() => () => window.clearTimeout(reprise.current), []);
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
      setRepos(true);
      reprise.current = window.setTimeout(() => setRepos(false), BUY_COOLDOWN_MS + 100);
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
              disabled={busy !== null || repos || !online}
              onClick={() => void semer(qty)}
              aria-label={qty > 1 ? t("Laisser tomber {n} tickets pour {prix}", { n: qty, prix }) : t("Laisser tomber 1 ticket pour {prix}", { prix })}
            >
              {/* Combien de tickets, puis ce qu'ils coûtent. */}
              <strong className="semer__nombre"><Icon name="jouer" plein size={18} />×{qty}</strong>
              <span className="chiffres">{prix}</span>
            </Bouton>
          );
        })}
      </div>
    </section>
  );
}
