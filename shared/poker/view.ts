// Ce que voit un joueur (POKER.md, section 4) : sa main, les mains montrées à l'abattage,
// jamais les cartes cachées des autres ni qui a triché, sauf démasqué.
//
// La vue est fabriquée siège par siège à partir de l'état complet de la table. Les robots
// décident sur cette même vue : ils n'en savent pas plus qu'un joueur assis à leur place.

import { betOptions } from "./betting";
import { evaluate } from "./hands";
import { canDeal, currentBlind, isFunded, isMasters, isOut, nextRise, playerInHand, rebuyRange, seatIndexOf } from "./state";
import type { HandResult, Options, OwnHand, SeatView, TableState, TableView } from "./types";

function noOptions(): Options {
  return {
    start: false, cheat: false, check: false, call: 0, bet: null, raise: null, allIn: false, fold: false,
    accuse: [], rebuy: null, back: false, next: false,
  };
}

/** La vue depuis un siège. `you` vaut `null` pour qui n'est pas assis. */
export function viewOfSeat(t: TableState, you: number | null, now: number): TableView {
  const h = t.hand;
  const seats: (SeatView | null)[] = t.seats.map((seat, index) => {
    if (!seat) return null;
    const p = playerInHand(t, index);
    // Une main ne se montre qu'à l'abattage, et seulement si son joueur est encore en jeu.
    const shown = p !== null && t.phase === "abattage" && !p.folded;
    // Qui a fait son choix se voit ; ce qu'il a choisi, jamais.
    let done = false;
    if (t.phase === "denouement") done = seat.ready;
    else if (p && t.phase === "triche") done = p.chosen;
    else if (p && t.phase === "abattage") done = p.spoke;
    const view: SeatView = {
      seat: index,
      pseudo: seat.bot === null ? seat.pseudo : null,
      bot: seat.bot,
      species: seat.bot === null ? seat.species : null,
      look: seat.bot === null && seat.look ? { ...seat.look } : null,
      stack: seat.stack,
      reserve: seat.reserve,
      funded: isFunded(seat),
      absent: seat.absent,
      inHand: p !== null,
      folded: p !== null && p.folded,
      allIn: p !== null && p.allIn && !p.folded,
      bet: p ? p.bet : 0,
      committed: p ? p.committed : 0,
      done,
      cards: shown ? [...p.cards] : null,
      category: shown ? evaluate(p.cards).category : null,
    };
    // Table des Maîtres : un joueur éliminé garde son siège, vide. Le champ n'existe que là.
    if (isOut(t, index)) view.out = true;
    return view;
  });

  const seat = you === null ? null : t.seats[you] ?? null;
  const me = seat && you !== null ? playerInHand(t, you) : null;
  const options = noOptions();
  let hand: OwnHand | null = null;

  if (seat && you !== null) {
    options.start = t.kind === "privee" && !t.started && t.phase === "attente" && t.owner === seat.playerId && canDeal(t);
    options.back = seat.absent;
    options.rebuy = rebuyRange(t, you);
    options.next = t.phase === "denouement" && isFunded(seat) && !seat.ready;
  }
  if (h && me && you !== null && seat) {
    hand = {
      cards: [...me.cards],
      category: evaluate(me.cards).category,
      swap: me.swap ? { index: me.swap.index, from: me.swap.from } : null,
      chosen: me.chosen,
      folded: me.folded,
      spoke: me.spoke,
      accuse: me.accuse,
    };
    if (!me.folded) {
      if (t.phase === "triche") options.cheat = !me.chosen;
      if (t.phase === "encheres" && h.turn === you) {
        const rivals = h.players.filter((p) => p !== me && !p.folded && !p.allIn).length;
        const bets = betOptions({
          pot: h.pot, bet: h.bet, raises: h.raises, blind: h.blind, mine: me.bet, stack: seat.stack, rivals,
        });
        options.check = bets.check;
        options.call = bets.call;
        options.bet = bets.bet;
        options.raise = bets.raise;
        options.allIn = bets.allIn;
        options.fold = true;
      }
      if (t.phase === "abattage" && !me.spoke) {
        options.accuse = h.players.filter((p) => p !== me && !p.folded).map((p) => p.seat);
      }
    }
  }

  // L'échéance : celle du temps en cours. Le temps de réflexion d'un robot ne se montre pas.
  let deadline: number | null = null;
  if (h && (t.phase === "triche" || t.phase === "abattage")) deadline = h.deadline;
  else if (h && t.phase === "encheres" && h.turn !== null) {
    const speaker = t.seats[h.turn];
    deadline = speaker && speaker.bot === null && !speaker.absent ? h.deadline : null;
  } else if (t.phase === "denouement" || t.phase === "attente") deadline = t.nextAt;

  const owner = t.owner === null ? -1 : seatIndexOf(t, t.owner);
  const view: TableView = {
    code: t.code,
    kind: t.kind,
    place: t.place,
    format: isMasters(t) ? "tournoi" : "classique",
    blind: currentBlind(t),
    rise: nextRise(t),
    minBuyIn: t.minBuyIn,
    maxBuyIn: t.maxBuyIn,
    difficulty: t.difficulty,
    version: t.version,
    step: t.step,
    now,
    phase: t.phase,
    started: t.started,
    seats,
    you: seat ? you : null,
    owner: owner >= 0 ? owner : null,
    dealer: t.dealer >= 0 ? t.dealer : null,
    handNo: t.handNo,
    pot: h ? h.pot : t.carry,
    bet: h ? h.bet : 0,
    turn: h && t.phase === "encheres" ? h.turn : null,
    deadline,
    hand,
    options,
    log: t.log.map((entry) => ({ ...entry })),
    result: t.result === null ? null : (JSON.parse(JSON.stringify(t.result)) as HandResult),
    closed: t.closed,
  };
  // La manche d'un défi : le champ n'existe que là.
  if (t.kind === "defi" && t.level !== undefined) view.level = t.level;
  return view;
}

/** La vue d'un joueur. S'il n'est pas assis à cette table, c'est un aperçu : rien de caché n'y figure. */
export function viewFor(t: TableState, playerId: string | null, now: number): TableView {
  const index = playerId ? seatIndexOf(t, playerId) : -1;
  return viewOfSeat(t, index >= 0 ? index : null, now);
}
