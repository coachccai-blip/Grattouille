// Le dénouement d'une main, mis en scène : les accusations tombent une à une (« Tricheur ! »,
// puis le verdict), ensuite le pot rejoint son gagnant. Chaque battement a son son, et
// parfois un mot du personnage concerné.
//
// Rien n'attend la fin de la mise en scène : « Main suivante » répond dès la première
// image, et qui arrive en cours de route (un rechargement) voit tout d'un coup.

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { HandResult, TableView } from "../../../shared/poker/types";
import type { Line } from "../../app/dialogues";
import { playAccuse, playInnocent, playPot, playUnmasked } from "../../fx/audio";
import { outcomeLines, winnersOf, type OutcomeLine } from "./calcul";
import { flyChips } from "./evenements";
import { tableLine } from "./repliques";

export interface Beat {
  /** `accuse` : « Tricheur ! » ; `verdict` : démasqué ou innocent ; `pots` : le pot est ramassé. */
  kind: "accuse" | "verdict" | "pots";
  /** Le siège accusé (pour `accuse` et `verdict`). */
  seat: number;
  ms: number;
}

export interface Denouement {
  result: HandResult;
  lines: OutcomeLine[];
  /** Le battement à partir duquel chaque ligne se lit (même rang que `lines`). */
  lineBeat: number[];
  /** Les battements joués jusqu'ici : `beats.length` quand tout est dit. */
  beat: number;
  beats: Beat[];
  /** Les sièges qu'on vient d'accuser à voix haute, et ceux dont le verdict est tombé. */
  accused: ReadonlySet<number>;
  judged: ReadonlySet<number>;
  /** Les pots sont ramassés : les bilans s'affichent. */
  settled: boolean;
}

/** Le temps laissé à toutes les accusations d'une main, quel que soit leur nombre. */
const ACCUSATIONS_MS = 4_500;

/** Les battements d'un dénouement : une accusation (ou plusieurs), puis les pots. */
export function beatsOf(result: HandResult): Beat[] {
  const targets = [...new Set(result.accusations.map((a) => a.to))];
  const beats: Beat[] = [];
  if (targets.length === 1) {
    // Une seule accusation : elle a droit à son moment, le cri puis le verdict.
    beats.push({ kind: "accuse", seat: targets[0]!, ms: 1_300 }, { kind: "verdict", seat: targets[0]!, ms: 2_000 });
  } else {
    const each = targets.length > 0 ? Math.min(1_500, Math.round(ACCUSATIONS_MS / targets.length)) : 0;
    for (const seat of targets) beats.push({ kind: "verdict", seat, ms: each });
  }
  beats.push({ kind: "pots", seat: -1, ms: 0 });
  return beats;
}

/** À quel battement chaque ligne du récit se lit. */
export function lineBeats(lines: readonly OutcomeLine[], beats: readonly Beat[]): number[] {
  const verdictAt = (seat: number) => beats.findIndex((b) => b.kind === "verdict" && b.seat === seat);
  const pots = beats.findIndex((b) => b.kind === "pots");
  return lines.map((line) => {
    if (line.kind === "demasque") return Math.max(0, verdictAt(line.seat));
    if (line.kind === "tort") return Math.max(0, verdictAt(line.to));
    return pots;
  });
}

interface Stage {
  /** L'élément de la rangée d'un siège, pour y faire arriver les jetons. */
  root: RefObject<HTMLElement | null>;
  /** Un personnage dit quelque chose : affiché au-dessus des boutons, quelques secondes. */
  say: (line: Line | null, ms?: number) => void;
  /** Le personnage assis à un siège, ou `null` pour un joueur. */
  botAt: (seat: number) => string | null;
  /** Une somme vaut-elle un mot du gagnant ? */
  big: (amount: number) => boolean;
  calm: boolean;
}

function rowEl(root: HTMLElement | null, seat: number): Element | null {
  return root?.querySelector(`[data-rangee="${seat}"]`) ?? null;
}

/**
 * Met en scène le dénouement de la main en cours. `live` : il arrive sous les yeux du
 * joueur ; sinon tout est déjà dit. Rend `null` hors d'un dénouement avec abattage.
 */
export function useDenouement(view: TableView, live: boolean, stage: Stage): Denouement | null {
  const result = view.phase === "denouement" && view.result && view.result.no === view.handNo && view.result.showdown
    ? view.result : null;
  const key = result ? `${view.code}:${result.no}` : "";
  const plan = useMemo(() => {
    if (!result) return null;
    const beats = beatsOf(result);
    const lines = outcomeLines(result);
    return { result, beats, lines, lineBeat: lineBeats(lines, beats) };
    // La clé change avec la main : le résultat d'une même main ne change pas.
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [beat, setBeat] = useState(0);
  const played = useRef("");
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const liveRef = useRef(live);
  liveRef.current = live;

  useEffect(() => {
    if (!plan || played.current === key) return;
    played.current = key;
    const { beats } = plan;
    if (!liveRef.current) {
      setBeat(beats.length);
      return;
    }
    const timers: number[] = [];
    const spoken = new Set<number>();
    const enter = (index: number) => {
      setBeat(index + 1);
      const b = beats[index]!;
      const s = stageRef.current;
      const res = plan.result;
      if (b.kind === "accuse") {
        playAccuse();
        // Une main sur deux, l'accusé proteste ; l'autre, il attend le verdict pour parler.
        const bot = s.botAt(b.seat);
        if (bot && (res.no + b.seat) % 2 === 0) {
          spoken.add(b.seat);
          s.say(tableLine(bot, "accuse", res.no), 3_600);
        }
      } else if (b.kind === "verdict") {
        const guilty = res.unmasked.some((u) => u.seat === b.seat);
        if (guilty) playUnmasked();
        else playInnocent();
        if (!guilty && !s.calm) {
          // L'accusateur paie l'innocent : ses jetons traversent la table.
          for (const a of res.accusations) {
            if (a.to === b.seat && !a.right && a.paid > 0) flyChips(s.root.current, rowEl(s.root.current, a.from), rowEl(s.root.current, a.to), 3);
          }
        }
        const bot = s.botAt(b.seat);
        if (bot && spoken.size === 0) {
          spoken.add(b.seat);
          s.say(tableLine(bot, guilty ? "demasque" : "innocent", res.no + b.seat), 3_600);
        }
      } else {
        const winners = [...winnersOf(res)];
        if (winners.length > 0) {
          playPot();
          if (!s.calm) {
            const pot = s.root.current?.querySelector("[data-pot]") ?? null;
            for (const seat of winners) flyChips(s.root.current, pot, rowEl(s.root.current, seat), 4);
          }
        }
        // Un beau pot vaut un mot du gagnant, si personne n'a déjà parlé.
        if (spoken.size === 0) {
          for (const pot of res.pots) {
            const top = pot.winners[0];
            const bot = top ? s.botAt(top.seat) : null;
            if (top && bot && s.big(pot.amount)) {
              s.say(tableLine(bot, "gagne", res.no), 3_600);
              break;
            }
          }
        }
      }
    };
    let at = 350;
    beats.forEach((b, index) => {
      timers.push(window.setTimeout(() => enter(index), at));
      at += b.ms;
    });
    setBeat(0);
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [plan, key]);

  if (!plan) return null;
  const shown = played.current === key ? beat : live ? 0 : plan.beats.length;
  const accused = new Set<number>();
  const judged = new Set<number>();
  plan.beats.slice(0, shown).forEach((b) => {
    if (b.kind === "accuse") accused.add(b.seat);
    if (b.kind === "verdict") {
      accused.add(b.seat);
      judged.add(b.seat);
    }
  });
  return {
    result: plan.result,
    lines: plan.lines,
    lineBeat: plan.lineBeat,
    beat: shown,
    beats: plan.beats,
    accused,
    judged,
    settled: shown >= plan.beats.length,
  };
}
