// À gratter (BRIEF.md, sections 6.6 et 12.2) : la pile des tickets en attente,
// gardée par Piou. Un ticket acheté n'est jamais perdu : il attend ici.

import { useMemo } from "react";
import { formatEuros } from "../../../shared/format";
import { ticketById } from "../../../shared/tickets";
import { PIOU } from "../../app/dialogues";
import { nav } from "../../app/nav";
import { toScratch, useGame } from "../../app/store";
import { Illustration } from "../../art/Illustration";
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
      <Entete titre="À gratter" retour droite={<Bourse />} />
      <BulleLibre pnj="piou" nom="Piou">{pile.length > 0 ? PIOU.enAttente(pile.length) : PIOU.pileVide}</BulleLibre>

      <ul className="pile">
        {pile.map((t, i) => {
          const def = ticketById(t.type);
          if (!def) return null;
          return (
            <li key={t.id}>
              <button
                type="button"
                className="pile__ticket"
                onClick={() => nav.push({ name: "grattage", tickets: [...pile.slice(i), ...pile.slice(0, i)] })}
                aria-label={`Gratter ${def.name}, ${t.house ? "offert par la maison" : formatEuros(def.price)}`}
              >
                <span className="pile__vignette" aria-hidden="true"><Illustration id={`ticket:${def.id}`} /></span>
                <span className="pile__nom">
                  {def.name}
                  {t.house && <small>Offert, toujours gagnant</small>}
                </span>
                <span className="pile__prix">{formatEuros(def.price)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="a-gratter__actions">
        {pile.length > 0 ? (
          <>
            <Bouton bloc onClick={() => nav.push({ name: "grattage", tickets: pile })}>Gratter le suivant</Bouton>
            {pile.length > 1 && (
              <Bouton variante="secondaire" bloc onClick={() => nav.push({ name: "grattage", tickets: pile, rafale: true })}>
                Tout gratter en rafale
              </Bouton>
            )}
          </>
        ) : (
          <Bouton bloc onClick={() => nav.reset([{ name: "promenade" }])}>Aller jouer</Bouton>
        )}
      </div>
    </main>
  );
}
