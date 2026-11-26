// L'abattage : toutes les mains montrées d'un coup, une rangée par joueur encore en jeu,
// chacune avec le nom de sa combinaison. C'est ici qu'on accuse : toucher la rangée d'un
// adversaire ouvre la feuille « Tricheur ! ». Puis le dénouement se lit sur les mêmes
// rangées : au-dessus de la main d'un accusé, le cri, puis le verdict (la fausse carte
// d'un tricheur, ou ce que chaque accusateur paie à l'innocent) ; à côté de chaque nom,
// le bilan de la main.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatEuros } from "../../../shared/format";
import type { Card } from "../../../shared/poker/cards";
import type { HandCategory } from "../../../shared/poker/hands";
import type { HandResult, TableView } from "../../../shared/poker/types";
import { capitalize } from "../../app/helpers";
import { nav } from "../../app/nav";
import { isCalm, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { playCardFlip } from "../../fx/audio";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Carte } from "../../ui/Carte";
import { doubles, neighbours, netOf, winnersOf } from "./calcul";
import type { Denouement } from "./denouement";
import { Jeton, Tete } from "./parts";
import { cardShort, categoryName, nameInSentence, nameList, playerName, type Identity } from "./textes";

interface Row {
  seat: number;
  cards: Card[];
  category: HandCategory;
}

/** Les mains montrées, dans le sens de la table à partir du voisin du joueur ; la sienne en dernier. */
function rowsOf(view: TableView): Row[] {
  const found = new Map<number, Row>();
  const result = view.phase === "denouement" ? view.result : null;
  if (result) {
    for (const hand of result.hands) found.set(hand.seat, { seat: hand.seat, cards: hand.cards, category: hand.category });
  } else {
    for (const seat of view.seats) {
      if (seat && seat.cards && seat.category) found.set(seat.seat, { seat: seat.seat, cards: seat.cards, category: seat.category });
    }
  }
  const order = neighbours(view).map((n) => n.seat);
  if (view.you !== null) order.push(view.you);
  const rows: Row[] = [];
  for (const seat of order) {
    const row = found.get(seat);
    if (row) rows.push(row);
  }
  return rows;
}

/** La largeur d'une carte et le pas d'une carte à la suivante, selon la place et le nombre de mains. */
function useCardFit(rows: number): { width: number; step: number } {
  const [screen, setScreen] = useState(() => Math.min(window.innerWidth, 480));
  useEffect(() => {
    const onResize = () => setScreen(Math.min(window.innerWidth, 480));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Ce qui reste aux cartes : l'écran moins ses marges (16), le bord du tapis (20), celles de la
  // rangée (16), la tête (40), deux écarts (16), la retenue des cartes (3), et la colonne du nom.
  const text = screen < 350 ? 98 : 108;
  const room = screen - 16 - 20 - 16 - 40 - 16 - 3 - text;
  // Peu de mains et un écran large : les cartes prennent leurs aises.
  const width = screen >= 380 ? (rows <= 3 ? 56 : rows <= 5 ? 48 : 44) : screen >= 350 ? (rows <= 3 ? 48 : rows <= 4 ? 44 : 40) : 40;
  // Chaque carte montre au moins son coin : la valeur et l'enseigne.
  const step = Math.max(17, Math.min(width + 4, Math.floor((room - width) / 4)));
  return { width, step };
}

interface Verdict {
  /** Les accusateurs, dans l'ordre où ils sont nommés : le joueur en dernier (« Colette et toi »). */
  from: number[];
  /**
   * Ce qu'on lit une fois le verdict tombé : une ligne pour un tricheur ; pour un innocent,
   * une seule phrase si ses accusateurs paient tous la même somme, sinon une par accusateur.
   */
  lines: string[];
  guilty: boolean;
}

/** Ce qui se dit au-dessus de la main d'un accusé, une fois le verdict tombé. */
function verdictOf(result: HandResult, seat: number, you: number | null, nom: (seat: number) => string): Verdict | null {
  const against = result.accusations.filter((a) => a.to === seat).sort((a, b) => Number(a.from === you) - Number(b.from === you));
  if (against.length === 0) return null;
  const from = against.map((a) => a.from);
  const unmasked = result.unmasked.find((u) => u.seat === seat);
  if (unmasked) {
    return {
      from,
      guilty: true,
      lines: [t("Triche ! {fausse} à la place de {vraie}.", { fausse: cardShort(unmasked.to), vraie: cardShort(unmasked.from) })],
    };
  }
  // Plusieurs accusateurs, la même somme : une seule phrase les nomme tous.
  const paid = against[0]!.paid;
  if (against.length > 1 && paid > 0 && against.every((a) => a.paid === paid)) {
    const vars = { noms: nameList(from.map(nom)), montant: formatEuros(paid) };
    const line = seat === you ? t("Franc jeu : {noms} te paient {montant} chacun.", vars)
      : from.includes(you ?? -1) ? t("Franc jeu : {noms} lui payez {montant} chacun.", vars)
        : t("Franc jeu : {noms} lui paient {montant} chacun.", vars);
    return { from, guilty: false, lines: [line] };
  }
  const lines = against.map((a) => {
    const montant = formatEuros(a.paid);
    if (a.from === you) {
      return a.paid > 0 ? t("Franc jeu : tu lui paies {montant}.", { montant }) : t("Franc jeu : ton tapis est vide, rien à payer.");
    }
    const accusateur = nom(a.from);
    if (seat === you) {
      return a.paid > 0
        ? t("Franc jeu : {nom} te paie {montant}.", { nom: accusateur, montant })
        : t("Franc jeu : {nom} n'a plus rien pour payer.", { nom: accusateur });
    }
    return a.paid > 0
      ? t("Franc jeu : {nom} lui paie {montant}.", { nom: accusateur, montant })
      : t("Franc jeu : {nom} n'a plus rien pour payer.", { nom: accusateur });
  });
  return { from, guilty: false, lines };
}

interface AbattageProps {
  view: TableView;
  who: (seat: number) => Identity | null;
  /** L'abattage vient d'arriver sous les yeux du joueur : les mains se retournent, une rangée après l'autre. */
  flip: boolean;
  /** Le dénouement en cours, s'il y en a un. */
  outcome: Denouement | null;
}

export function Abattage({ view, who, flip, outcome }: AbattageProps) {
  const calm = useGame(isCalm);
  const rows = rowsOf(view);
  const { width, step } = useCardFit(rows.length);
  const twice = doubles(rows.map((row) => row.cards));
  const you = view.you;
  const showdown = view.phase === "abattage";
  const accusable = showdown ? view.options.accuse : [];
  const mine = view.hand;
  const result = outcome?.result ?? null;
  const winners = result && outcome?.settled ? winnersOf(result) : new Set<number>();
  const nom = (seat: number) => (seat === you ? t("toi") : nameInSentence(who(seat)));

  // Les mains des autres se retournent une rangée après l'autre ; la sienne est déjà de face.
  const others = rows.filter((row) => row.seat !== you).length;
  const [turned, setTurned] = useState(flip && !calm ? 0 : others);
  useEffect(() => {
    if (!flip) return;
    if (calm) {
      playCardFlip();
      return;
    }
    const timers: number[] = [];
    for (let i = 0; i < others; i++) {
      timers.push(window.setTimeout(() => {
        setTurned((n) => Math.max(n, i + 1));
        playCardFlip();
      }, 180 + i * 190));
    }
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
    // Une fois par abattage : un joueur qui part en cours de route ne fait rien rejouer.
  }, [flip, view.handNo]); // eslint-disable-line react-hooks/exhaustive-deps

  // S'il y a trop de mains pour l'écran, le tapis défile : la rangée dont c'est le moment vient en vue.
  const board = useRef<HTMLElement>(null);
  const beat = outcome?.beat ?? 0;
  useEffect(() => {
    const el = board.current;
    if (!el || !outcome || beat === 0 || el.scrollHeight <= el.clientHeight + 1) return;
    const current = outcome.beats[Math.min(beat, outcome.beats.length) - 1];
    const seat = current && current.kind !== "pots" ? current.seat : [...winnersOf(outcome.result)][0];
    const row = seat === undefined ? null : el.querySelector(`[data-rangee="${seat}"]`);
    if (!row) return;
    const box = el.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    const delta = r.bottom > box.bottom - 6 ? r.bottom - box.bottom + 8 : r.top < box.top + 6 ? r.top - box.top - 8 : 0;
    if (delta !== 0) el.scrollTo({ top: el.scrollTop + delta, behavior: calm ? "auto" : "smooth" });
    // Un battement à la fois : c'est lui qui déclenche.
  }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps

  let rank = 0;
  return (
    <section ref={board} className={cx("poker-abattage", rows.length >= 5 && "poker-abattage--dense")} aria-label={t("L'abattage")}>
      {/* Au dénouement, le sort du pot se lit sous la table : ici, il ne reste que l'endroit d'où partent les jetons. */}
      {result ? <span className="poker-abattage__ancre" data-pot aria-hidden="true" /> : (
        <p className="poker-abattage__pot">
          <span className="poker-pot__somme" data-pot>
            <span className="poker-pot__jetons" aria-hidden="true"><Jeton /><Jeton /><Jeton /></span>
            <span className="chiffres">{t("Pot : {montant}", { montant: formatEuros(view.pot) })}</span>
          </span>
        </p>
      )}
      <ul className="poker-abattage__mains">
        {rows.map((row) => {
          const me = row.seat === you;
          const faceUp = me || rank++ < turned;
          const identity = who(row.seat);
          const name = me ? t("Toi") : playerName(identity);
          const canAccuse = accusable.includes(row.seat);
          const verdict = result ? verdictOf(result, row.seat, you, nom) : null;
          const cried = verdict !== null && (outcome?.accused.has(row.seat) ?? false);
          const judged = verdict !== null && (outcome?.judged.has(row.seat) ?? false);
          const guilty = judged && verdict !== null && verdict.guilty;
          const fake = guilty ? result?.unmasked.find((u) => u.seat === row.seat)?.index ?? -1 : -1;
          // Le bilan de chacun s'écrit quand les pots sont ramassés ; sa place est gardée d'ici là.
          const net = result ? netOf(result, row.seat) : null;
          const settled = outcome?.settled ?? false;
          // Pendant l'abattage, l'accusation du joueur est un secret : lui seul la voit sur la rangée.
          const chosen = showdown && mine?.accuse === row.seat;
          const spoke = showdown && (view.seats[row.seat]?.done ?? false);

          const content = (
            <>
              {/* Le cri, puis le verdict, l'un à la place de l'autre : la place du plus long des deux
                  est gardée dès le début du dénouement, rien ne saute. */}
              {verdict && (
                <span className="poker-rangee__verdict">
                  <span className={cx("poker-rangee__cri", cried && !judged && "poker-rangee__dit")}>
                    {t("{noms} : « Tricheur ! »", { noms: capitalize(nameList(verdict.from.map(nom))) })}
                  </span>
                  <span className={cx("poker-rangee__sentence", verdict.guilty ? "poker-rangee__sentence--triche" : "poker-rangee__sentence--franc", judged && "poker-rangee__dit")}>
                    {verdict.lines.map((line) => <span key={line}>{line}</span>)}
                  </span>
                </span>
              )}
              {chosen && <span className="poker-rangee__verdict poker-rangee__verdict--secret">{t("Tu l'accuses.")}</span>}
              <span className="poker-rangee__tete" aria-hidden="true">
                <Tete who={identity} />
                {spoke && <span className="poker-siege__pret"><Icon name="coche" size={14} /></span>}
              </span>
              <span className="poker-rangee__qui">
                <span className="poker-rangee__nom">{name}</span>
                <span className={cx("poker-rangee__combi", guilty && "poker-rangee__combi--nulle")}>{categoryName(row.category)}</span>
                {net !== null && (
                  <span
                    className={cx(
                      "poker-rangee__bilan chiffres", net > 0 && "poker-rangee__bilan--plus", net < 0 && "poker-rangee__bilan--moins",
                      !settled && "poker-rangee__bilan--attend",
                    )}
                  >
                    {net > 0 ? `+${formatEuros(net)}` : net < 0 ? `−${formatEuros(-net)}` : formatEuros(0)}
                  </span>
                )}
              </span>
              <span className="poker-rangee__cartes" style={{ "--pas": `${step}px`, "--carte": `${width}px` } as CSSProperties}>
                {row.cards.map((card, i) => (
                  <Carte
                    key={i}
                    carte={card}
                    largeur={width}
                    cachee={!faceUp}
                    className={cx(
                      twice.has(card) && faceUp && !result && "poker-carte--double",
                      fake === i && "poker-carte--fausse",
                      me && mine?.swap?.index === i && "poker-carte--glissee",
                    )}
                  />
                ))}
              </span>
            </>
          );
          return (
            <li
              key={row.seat}
              data-rangee={row.seat}
              className={cx(
                "poker-rangee", me && "poker-rangee--moi", winners.has(row.seat) && "poker-rangee--gagne",
                guilty && "poker-rangee--triche", canAccuse && "poker-rangee--accusable",
              )}
            >
              {canAccuse ? (
                <button
                  type="button"
                  className="poker-rangee__zone"
                  onClick={() => nav.push({ name: "poker-feuille", feuille: "accuser", seat: row.seat })}
                >
                  {content}
                </button>
              ) : (
                <div className="poker-rangee__zone">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
