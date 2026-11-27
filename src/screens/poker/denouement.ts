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
import { beatsOf, lineBeats, outcomeLines, winnersOf, type Beat, type OutcomeLine } from "./calcul";
import { flyChips } from "./evenements";
import { mastersLine, tableLine } from "./repliques";

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
  /**
   * Un personnage dira quelque chose pendant ce dénouement : sa place est gardée du début à
   * la fin, pour que les mains ne bougent pas quand il parle.
   */
  talks: boolean;
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
  /** Table des Maîtres : les sièges que cette main élimine. Qui s'en va a le dernier mot. */
  fallen?: readonly number[];
  calm: boolean;
}

function rowEl(root: HTMLElement | null, seat: number): Element | null {
  return root?.querySelector(`[data-rangee="${seat}"]`) ?? null;
}

/**
 * Ce qui se dira, et à quel battement : une seule réplique par dénouement, décidée d'avance.
 * L'accusé proteste (une main sur deux) ou réagit à son verdict ; sinon, un beau pot vaut un
 * mot de son gagnant. À la Table des Maîtres, un maître que la main élimine passe devant
 * tout le monde : il dit son mot quand le pot est ramassé.
 */
function talkOf(result: HandResult, beats: readonly Beat[], stage: Pick<Stage, "botAt" | "big" | "fallen">): { at: number; line: Line } | null {
  for (const seat of stage.fallen ?? []) {
    const line = mastersLine(stage.botAt(seat), "elimine");
    if (line) return { at: beats.length - 1, line };
  }
  for (let at = 0; at < beats.length; at++) {
    const b = beats[at]!;
    let line: Line | null = null;
    if (b.kind === "accuse") {
      const bot = stage.botAt(b.seat);
      if (bot && (result.no + b.seat) % 2 === 0) line = tableLine(bot, "accuse", result.no);
    } else if (b.kind === "verdict") {
      const bot = stage.botAt(b.seat);
      const guilty = result.unmasked.some((u) => u.seat === b.seat);
      if (bot) line = tableLine(bot, guilty ? "demasque" : "innocent", result.no + b.seat);
    } else {
      for (const pot of result.pots) {
        const top = pot.winners[0];
        const bot = top ? stage.botAt(top.seat) : null;
        if (top && bot && stage.big(pot.amount)) {
          line = tableLine(bot, "gagne", result.no);
          break;
        }
      }
    }
    if (line) return { at, line };
  }
  return null;
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
    return { result, beats, lines, lineBeat: lineBeats(lines, beats), talk: talkOf(result, beats, stage) };
    // La clé change avec la main : le résultat d'une même main ne change pas, ni qui est assis où.
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
    const enter = (index: number) => {
      setBeat(index + 1);
      const b = beats[index]!;
      const s = stageRef.current;
      const res = plan.result;
      if (plan.talk?.at === index) s.say(plan.talk.line, 3_600);
      if (b.kind === "accuse") {
        playAccuse();
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
      } else {
        const winners = [...winnersOf(res)];
        if (winners.length > 0) {
          playPot();
          if (!s.calm) {
            const pot = s.root.current?.querySelector("[data-pot]") ?? null;
            for (const seat of winners) flyChips(s.root.current, pot, rowEl(s.root.current, seat), 4);
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
    talks: live && plan.talk !== null,
  };
}
