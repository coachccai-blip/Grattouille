// Ce qui vient d'arriver à la table, rendu sensible : les jetons glissent, les cartes
// se distribuent, chaque geste a son son, et le siège de qui vient de parler dit ce
// qu'il a fait. Le journal de la table (ses derniers événements publics, numérotés)
// donne la matière : on anime ce qui est arrivé depuis la dernière vue.
//
// Rien ici ne retarde le jeu : la vue s'affiche tout de suite, les boutons répondent
// tout de suite. Ce module n'ajoute que l'accompagnement, et le saute en animations
// réduites (les sons restent).

import { useEffect, useRef, useState, type RefObject } from "react";
import type { LogEntry, LogKind, TableView } from "../../../shared/poker/types";
import { takeFresh } from "../../app/poker";
import { isCalm, useGame } from "../../app/store";
import { playCardDeal, playChip, playClick, playFold, playKnock, playPot } from "../../fx/audio";
import { freshEntries } from "./calcul";

/** Ce qu'un joueur vient de faire : écrit à la place de son nom, un instant. */
export interface SeatLabel {
  id: number;
  kind: LogKind;
  amount: number;
  /** Sa mise dans le tour après ce geste. */
  to: number;
  allIn: boolean;
}

/** Combien de temps un geste reste écrit sur un siège. */
const LABEL_MS = 1_900;
/** L'écart entre deux gestes arrivés d'un coup (plusieurs robots ont parlé depuis la dernière relecture). */
const BETWEEN_MS = 380;
/** Une donne se rythme : neuf cartes par seconde au plus. */
const DEAL_EVERY_MS = 115;

const BETS: readonly LogKind[] = ["parole", "mise", "suit", "relance", "couche"];

/** Fait glisser des jetons d'un élément à un autre, par-dessus la table. Sans effet si l'un des deux manque. */
export function flyChips(root: HTMLElement | null, from: Element | null, to: Element | null, count = 1): void {
  if (!root || !from || !to || typeof root.animate !== "function") return;
  const host = root.getBoundingClientRect();
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (a.width === 0 || b.width === 0) return;
  const x = a.left + a.width / 2;
  const y = a.top + a.height / 2;
  const dx = b.left + b.width / 2 - x;
  const dy = b.top + b.height / 2 - y;
  for (let i = 0; i < Math.min(5, count); i++) {
    const chip = document.createElement("span");
    chip.className = "poker-jeton poker-jeton--vol";
    chip.setAttribute("aria-hidden", "true");
    chip.style.left = `${x - host.left - 8}px`;
    chip.style.top = `${y - host.top - 8}px`;
    root.appendChild(chip);
    const remove = () => chip.remove();
    const flight = chip.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(.85)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${dx}px, ${dy}px) scale(.6)`, opacity: 0 },
      ],
      { duration: 420, delay: i * 55, easing: "cubic-bezier(.2, .8, .2, 1)", fill: "both" },
    );
    flight.onfinish = remove;
    flight.oncancel = remove;
    // Filet : une animation qui ne finirait pas (onglet caché) ne laisse pas de jeton en l'air.
    window.setTimeout(remove, 1_200);
  }
}

/** L'élément d'un siège (le joueur lui-même : « moi »), et celui du pot. */
export function seatEl(root: HTMLElement | null, seat: number, you: number | null): Element | null {
  return root?.querySelector(`[data-siege="${seat === you ? "moi" : seat}"]`) ?? null;
}

export function potEl(root: HTMLElement | null): Element | null {
  return root?.querySelector("[data-pot]") ?? null;
}

export interface TableEvents {
  /** Le dernier geste de chaque siège, tant qu'il reste écrit. */
  labels: Record<number, SeatLabel>;
  /** Le numéro de la main dont la donne vient d'arriver sous les yeux du joueur (0 : aucune). */
  dealt: number;
  /** Le numéro de la main dont l'abattage vient d'arriver sous ses yeux (0 : aucun). */
  shown: number;
}

/**
 * Suit le journal de la table. `root` : l'écran de la table, pour y faire glisser les jetons.
 * À la première vue, rien ne se rejoue, sauf si le joueur vient de s'asseoir.
 */
export function useTableEvents(view: TableView, root: RefObject<HTMLElement | null>): TableEvents {
  const calm = useGame(isCalm);
  const seen = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const labelId = useRef(0);
  const [labels, setLabels] = useState<Record<number, SeatLabel>>({});
  const [dealt, setDealt] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const later = (ms: number, run: () => void) => {
      if (ms <= 0) run();
      else timers.current.push(window.setTimeout(run, ms));
    };
    const last = view.log.length > 0 ? view.log[view.log.length - 1]!.n : 0;
    if (seen.current === null) seen.current = takeFresh() ? 0 : last;
    const fresh: LogEntry[] = freshEntries(view.log, seen.current);
    seen.current = Math.max(seen.current, last);
    if (fresh.length === 0) return;

    const el = root.current;
    const fly = (from: Element | null, to: Element | null, count: number) => {
      if (!calm) flyChips(el, from, to, count);
    };
    const label = (entry: LogEntry) => {
      const id = ++labelId.current;
      setLabels((all) => ({ ...all, [entry.seat]: { id, kind: entry.kind, amount: entry.amount, to: entry.to ?? 0, allIn: entry.allIn === true } }));
      later(LABEL_MS, () => setLabels((all) => {
        if (all[entry.seat]?.id !== id) return all;
        const { [entry.seat]: _gone, ...rest } = all;
        return rest;
      }));
    };

    // Les blindes tombent ensemble ; les gestes d'enchère se suivent, un par un.
    const blinds = fresh.filter((entry) => entry.kind === "blinde");
    if (blinds.length > 0) {
      playChip(Math.min(4, blinds.length));
      // Les sièges sont en place à la prochaine image : les jetons partent de là.
      later(30, () => {
        for (const entry of blinds) fly(seatEl(el, entry.seat, view.you), potEl(el), 1);
      });
    }

    let at = blinds.length > 0 ? 260 : 0;
    for (const entry of fresh) {
      if (entry.kind === "donne") {
        setDealt(entry.hand);
        for (let i = 0; i < 5; i++) later(140 + i * DEAL_EVERY_MS, playCardDeal);
        at = Math.max(at, 140 + 5 * DEAL_EVERY_MS);
      } else if (entry.kind === "abattage") {
        setShown(entry.hand);
      } else if (entry.kind === "arrivee") {
        playClick(1);
      } else if (entry.kind === "cave") {
        later(at, () => playChip(2));
      } else if (BETS.includes(entry.kind)) {
        const when = at;
        at += BETWEEN_MS;
        later(when, () => {
          if (entry.kind === "parole") playKnock();
          else if (entry.kind === "couche") playFold();
          else {
            playChip(entry.allIn ? 4 : entry.kind === "relance" ? 3 : 2);
            fly(seatEl(root.current, entry.seat, view.you), potEl(root.current), entry.allIn ? 4 : 2);
          }
          if (entry.seat !== view.you) label(entry);
        });
      } else if (entry.kind === "rendu") {
        const when = at;
        at += BETWEEN_MS;
        later(when, () => {
          playChip(1);
          fly(potEl(root.current), seatEl(root.current, entry.seat, view.you), 1);
        });
      } else if (entry.kind === "pot") {
        // Après un abattage, c'est le dénouement qui met le pot en scène, à son heure.
        const walkover = view.result !== null && view.result.no === entry.hand && !view.result.showdown;
        if (!walkover) continue;
        const when = at;
        at += BETWEEN_MS;
        later(when, () => {
          playPot();
          fly(potEl(root.current), seatEl(root.current, entry.seat, view.you), 5);
        });
      }
    }
    // `view` change à chaque relecture utile : c'est elle qui rythme cet effet.
  }, [view, root, calm]);

  return { labels, dealt, shown };
}
