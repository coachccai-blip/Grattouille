// La Table des Maîtres, à la table (LOT4.md, section 5) : la présentation des quatre
// maîtres que le sort a désignés, et les trois façons d'en sortir. Gagnée, c'est l'un des
// sommets du jeu : la fanfare du jackpot, le montant qui défile, et les quatre maîtres
// ruinés qui saluent. Perdue, l'un d'eux raccompagne le joueur, et l'invite à revenir.
// Quittée, on repart avec son tapis, sans la victoire.

import { useEffect, useRef, type CSSProperties } from "react";
import { THIN, formatEuros } from "../../../shared/format";
import type { SeatView, TableView } from "../../../shared/poker/types";
import { isCalm, useGame } from "../../app/store";
import { playTier } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Fx } from "../../fx/particles";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse, useCompte } from "../../ui/Bourse";
import { Bulle, Entete } from "../../ui/Commun";
import { neighbours } from "./calcul";
import { Tete, unbroken } from "./parts";
import { mastersLine } from "./repliques";
import { identityOf, mastersEnding, playerName, tableTitle, type MastersEnd } from "./textes";

/** Les maîtres assis à la table, dans le sens de la table à partir du voisin du joueur. */
export function mastersOf(view: Pick<TableView, "seats" | "you">): SeatView[] {
  const out: SeatView[] = [];
  for (const place of neighbours(view)) if (place.who && place.who.bot !== null) out.push(place.who);
  return out;
}

/** Ce qu'un maître dit, dans sa bulle : une parole entre guillemets, ou un geste en italique. */
function Mot({ bot, moment }: { bot: string | null; moment: "assis" | "victoire" }) {
  const line = mastersLine(bot, moment);
  if (!line) return null;
  return line.gesture ? <em>{line.text}</em> : <span>{t("« {replique} »", { replique: line.text })}</span>;
}

/**
 * Le tirage : les quatre maîtres que le sort a désignés, chacun avec son mot en s'asseyant.
 * Il prend la place du tapis le temps de la première triche, quand il n'y a encore rien à y
 * lire ; la main du joueur et ses gestes restent dessous, comme d'habitude.
 */
export function Presentation({ view }: { view: TableView }) {
  const masters = mastersOf(view);
  return (
    <section className="poker-abattage poker-presentation" aria-labelledby="poker-presentation-titre">
      <h2 id="poker-presentation-titre" className="poker-presentation__titre">{t("Tes adversaires, tirés au sort")}</h2>
      <ul className="poker-presentation__maitres">
        {masters.map((seat, i) => {
          const who = identityOf(seat);
          return (
            <li key={seat.seat} className="poker-presentation__maitre" style={{ "--i": i } as CSSProperties}>
              <Tete who={who} />
              <p>
                <strong>{playerName(who)}</strong>
                <Mot bot={seat.bot} moment="assis" />
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface SortieProps {
  reason: MastersEnd;
  /** Ce qui retourne à la bourse : toute la table, le tapis, ou rien. */
  payout: number;
  /** Les maîtres tels qu'on les a vus pour la dernière fois à la table. Vide : on ne sait plus qui était là. */
  masters: readonly SeatView[];
  onBack: () => void;
}

/** Le maître qui raccompagne le joueur ruiné : celui qui a le plus gros tapis parmi ceux qui sont encore assis. */
function hostOfTheTable(masters: readonly SeatView[]): SeatView | null {
  let best: SeatView | null = null;
  for (const seat of masters) {
    if (seat.out) continue;
    if (!best || seat.stack > best.stack) best = seat;
  }
  return best ?? masters[0] ?? null;
}

/** Le montant de la victoire défile en autant de millisecondes, pendant la fanfare. */
const ROLL_MS = 2_200;

/**
 * Le montant remporté, en grand : il défile de zéro à sa valeur, et les pièces tintent. Ses
 * milliers se détachent d'un petit blanc (l'espace fine ne se voit pas dans un titre de cette taille).
 */
function Somme({ valeur, ms }: { valeur: number; ms: number }) {
  const shown = useCompte(valeur, ms, true, { depart: 0 });
  return (
    <>
      {formatEuros(shown).split(THIN).map((group, i) => (
        <span key={i} className={i > 0 ? "poker-fete__mille" : undefined}>{group}</span>
      ))}
    </>
  );
}

export function SortieMaitres({ reason, payout, masters, onBack }: SortieProps) {
  const calm = useGame(isCalm);
  const won = reason === "maitres-gagne";
  const lost = reason === "maitres-perdu";
  const ending = mastersEnding(reason, payout);
  const canvas = useRef<HTMLCanvasElement>(null);

  // La victoire sonne comme un jackpot ; la défaite, comme un ticket perdu : un soupir, jamais une moquerie.
  useEffect(() => {
    if (won) {
      playTier("jackpot");
      haptic.tier("jackpot");
    } else if (lost) {
      playTier("perdu");
    }
  }, [won, lost]);

  // Les confettis et la pluie de pièces, sur leur canvas : rien en animations réduites.
  useEffect(() => {
    if (!won || calm || !canvas.current) return;
    const fx = new Fx(canvas.current);
    fx.confetti(130, 4_000);
    fx.coinRain(50, 4_000);
    return () => fx.destroy();
  }, [won, calm]);

  const host = lost ? hostOfTheTable(masters) : null;

  return (
    <main className={cx("ecran poker-table poker-table--sortie", won && "poker-fete")}>
      <Entete titre={tableTitle({ kind: "maitres", place: null, code: "" })} droite={<Bourse />} />
      <div className="poker-sortie">
        <h2 className="t-titre">{ending.titre}</h2>
        {won && (
          <p className="poker-sortie__cagnotte poker-fete__somme">
            <span aria-hidden="true">{ending.somme}</span>
            <strong className="t-gain chiffres" aria-hidden="true">
              <Somme valeur={payout} ms={calm ? 0 : ROLL_MS} />
            </strong>
            {/* La phrase entière, dite une fois : le montant qui défile ne se lit pas chiffre à chiffre. */}
            <span className="invisible" role="status">{ending.texte}</span>
          </p>
        )}
        {won && masters.length > 0 && (
          <ul className="poker-fete__maitres" aria-label={t("Les maîtres saluent")}>
            {masters.map((seat, i) => (
              <li key={seat.seat} style={{ "--i": i } as CSSProperties}>
                <Tete who={identityOf(seat)} className="poker-tete--mini" />
                <p>
                  <span className="invisible">{playerName(identityOf(seat))}</span>
                  <Mot bot={seat.bot} moment="victoire" />
                </p>
              </li>
            ))}
          </ul>
        )}
        {host && <Bulle line={mastersLine(host.bot, "defaite")} className="poker-sortie__hote" />}
        {!won && <p>{unbroken(ending.texte)}</p>}
        <Bouton bloc onClick={onBack}>{t("Retour au hall")}</Bouton>
      </div>
      {won && <canvas ref={canvas} className="poker-fete__fx" aria-hidden="true" />}
    </main>
  );
}
