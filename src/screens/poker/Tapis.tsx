// Le tapis : les sièges autour, le pot au milieu. Jusqu'à trois voisins, ils sont en
// face ; au-delà, le premier et le dernier prennent les côtés. La parole tourne comme
// autour d'une vraie table : à gauche, en face, à droite.

import type { ReactNode } from "react";
import { formatEuros } from "../../../shared/format";
import type { SeatView, TableView } from "../../../shared/poker/types";
import { Icon } from "../../art/icons";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { neighbours, sidesFor, type Neighbour } from "./calcul";
import type { SeatLabel } from "./evenements";
import { Jeton, Tete } from "./parts";
import { identityOf, playerName, seatStateText } from "./textes";

/** Ce qu'un joueur vient de faire, en deux mots : écrit à la place de son nom, un instant. */
function labelText(label: SeatLabel): string {
  // La somme se lit juste dessous, sur la ligne de la mise : le geste tient en un mot.
  if (label.allIn && label.kind !== "couche" && label.kind !== "parole") return t("Tapis !");
  switch (label.kind) {
    case "parole": return t("Parole");
    case "couche": return t("Se couche");
    case "suit": return t("Suit");
    case "mise": return t("Mise");
    case "relance": return t("Relance");
    default: return "";
  }
}

/** Ce qu'un lecteur d'écran lit d'un siège : une phrase, d'une traite. */
function spoken(seat: SeatView, view: TableView, name: string): string {
  // Éliminé de la Table des Maîtres : il n'a plus de tapis, plus de mise, plus la parole.
  if (seat.out) return t("{nom} : éliminé", { nom: name });
  const parts = [t("{nom} : tapis {montant}", { nom: name, montant: formatEuros(seat.stack) })];
  if (seat.bet > 0) parts.push(t("mise {montant}", { montant: formatEuros(seat.bet) }));
  const state = seatStateText(seat, view);
  if (state) parts.push(state);
  if (view.dealer === seat.seat) parts.push(t("donneur"));
  if (view.turn === seat.seat) parts.push(t("a la parole"));
  return parts.join(", ");
}

interface SiegeProps {
  place: Neighbour;
  view: TableView;
  label: SeatLabel | undefined;
}

function Siege({ place, view, label }: SiegeProps) {
  const seat = place.who;
  if (!seat) {
    // Un siège libre : un ami peut encore s'y asseoir avec le code.
    return (
      <div className="poker-siege poker-siege--libre" data-siege={place.seat}>
        <span className="poker-siege__tete"><Tete who={null} /></span>
        <span className="poker-siege__nom">{t("libre")}</span>
      </div>
    );
  }
  const who = identityOf(seat);
  const name = playerName(who);
  const turn = view.turn === seat.seat;
  const state = seatStateText(seat, view);
  const live = seat.inHand && !seat.folded;
  // Éliminé de la Table des Maîtres : le siège reste dessiné à sa place, éteint, pour que les autres ne bougent pas.
  const out = seat.out === true;
  // Se coucher, pousser son tapis : l'état écrit sous le nom dit déjà le geste. Rien n'est
  // dit deux fois : le nom reste, et c'est l'état qui s'anime.
  const echo = label !== undefined
    && state === (label.kind === "couche" ? t("couché") : label.allIn && label.kind !== "parole" ? t("à tapis") : undefined);
  const gesture = label !== undefined && !echo ? label : null;
  return (
    <div
      className={cx(
        "poker-siege", turn && "poker-siege--parle", (seat.folded || seat.absent || !seat.funded) && "poker-siege--efface",
        out && "poker-siege--elimine",
      )}
      data-siege={seat.seat}
    >
      <span className="invisible">{spoken(seat, view, name)}</span>
      <span className="poker-siege__tete" aria-hidden="true">
        <Tete who={who} />
        {live && <span className="poker-siege__cartes"><i /><i /><i /></span>}
        {view.dealer === seat.seat && !out && <span className="poker-siege__donneur">{t("D")}</span>}
        {seat.done && !out && <span className="poker-siege__pret"><Icon name="coche" size={14} /></span>}
      </span>
      {/* Le geste qui vient de tomber prend un instant la place du nom ; l'état (couché, absent) celle du tapis. */}
      <span className={cx("poker-siege__nom", gesture && "poker-siege__nom--geste")} aria-hidden="true" key={gesture ? gesture.id : "nom"}>
        {gesture ? labelText(gesture) : name}
      </span>
      <span
        className={cx("poker-siege__tapis chiffres", echo && "poker-siege__tapis--geste")}
        aria-hidden="true"
        key={echo && label ? label.id : "tapis"}
      >
        {state ?? formatEuros(seat.stack)}
      </span>
      <span className="poker-siege__mise chiffres" aria-hidden="true">
        {seat.bet > 0 && <><Jeton />{formatEuros(seat.bet)}</>}
      </span>
    </div>
  );
}

interface TapisProps {
  view: TableView;
  labels: Record<number, SeatLabel>;
  /** Ce qui s'écrit au milieu, sous le pot : la blinde. */
  children?: ReactNode;
  /** Ce qui prend la place du pot tant que la partie n'est pas lancée : le code de la table. */
  centre?: ReactNode;
}

export function Tapis({ view, labels, children, centre }: TapisProps) {
  const around = neighbours(view);
  const sides = sidesFor(around.length);
  const top = around.filter((_, i) => sides[i] === "haut");
  const left = around.find((_, i) => sides[i] === "gauche") ?? null;
  const right = around.find((_, i) => sides[i] === "droite") ?? null;
  const seat = (place: Neighbour) => <Siege key={place.seat} place={place} view={view} label={labels[place.seat]} />;
  return (
    <section className={cx("poker-tapis", (left || right) && "poker-tapis--cotes")} aria-label={t("La table")}>
      <div className={cx("poker-tapis__haut", `poker-tapis__haut--${top.length}`)}>{top.map(seat)}</div>
      <div className="poker-tapis__milieu">
        {left && seat(left)}
        <div className="poker-pot">
          {centre ?? (
            <span className="poker-pot__somme" data-pot>
              <span className="poker-pot__jetons" aria-hidden="true"><Jeton /><Jeton /><Jeton /></span>
              <span className="invisible">{t("Pot : {montant}", { montant: formatEuros(view.pot) })}</span>
              <span className="chiffres" aria-hidden="true">{formatEuros(view.pot)}</span>
            </span>
          )}
          {children}
        </div>
        {right && seat(right)}
      </div>
    </section>
  );
}
