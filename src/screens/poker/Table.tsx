// La table du Poker Tricheur (POKER.md, section 5). Les sièges autour du tapis, le pot
// au milieu, la main du joueur en grand, en bas. Chaque temps de la main a son geste :
// remplacer une carte ou jouer franc jeu, parler aux enchères, accuser à l'abattage,
// lire le dénouement, passer à la main suivante.
//
// L'écran ne décide de rien : il montre la vue que le serveur fabrique pour ce joueur,
// et n'offre que les gestes que cette vue permet (`view.options`).

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { formatEuros } from "../../../shared/format";
import { placeById } from "../../../shared/places";
import type { HandResult, SeatView, TableView } from "../../../shared/poker/types";
import type { Line } from "../../app/dialogues";
import { capitalize } from "../../app/helpers";
import { nav, useNav } from "../../app/nav";
import { play, usePoker, useTableOffline, watchTable, type Left } from "../../app/poker";
import { isCalm, toast, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { playPot } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse, Compteur } from "../../ui/Bourse";
import { Bulle, Entete } from "../../ui/Commun";
import { Carte, nomDeCarte } from "../../ui/Carte";
import { Abattage } from "./Abattage";
import {
  betChoices, doubles, fallenSeats, hostStory, mastersLeft, netOf, phaseTotal, potSized, tournamentDecided, type BetChoice,
  type OutcomeLine,
} from "./calcul";
import { useDenouement, type Denouement } from "./denouement";
import { useTableEvents } from "./evenements";
import { Presentation, SortieMaitres, mastersOf } from "./Maitres";
import { BarreTemps, Jeton, Reperes, Tete } from "./parts";
import { hostLine, tableLine } from "./repliques";
import { Tapis } from "./Tapis";
import {
  categoryName, identityOf, isMastersEnd, mastersLeftText, nameInSentence, nameList, storyAfterWin, tableTitle,
  type Identity,
} from "./textes";
import "./poker.css";
import "./table.css";

/**
 * Retour au hall : l'écran d'avant la table. Une feuille ouverte par-dessus (celle qui
 * demande confirmation avant de partir) se referme d'abord toute seule ; on ne revient en
 * arrière que lorsque la table est redevenue l'écran affiché, un pas à la fois.
 */
function toHall(): void {
  if (nav.current().name === "poker-table") nav.back();
}

/** Qui est assis où : on s'en souvient après un départ, pour nommer encore celui dont on lit la main. */
function useRoster(view: TableView): (seat: number) => Identity | null {
  const known = useRef<Record<number, Identity>>({});
  for (const seat of view.seats) if (seat) known.current[seat.seat] = identityOf(seat);
  return useCallback((seat: number) => known.current[seat] ?? null, []);
}

/** Le jeu de cartes doré : celui de qui a vu la vraie fin. Tous les dos de cartes de sa table le portent. */
function useGoldenDeck(): boolean {
  return useGame((s) => s.player?.story.vraieFin === true);
}

/** La largeur d'une carte de la main du joueur : cinq cartes tiennent côte à côte. */
function useHandWidth(): number {
  // Sur un écran court, la main cède un peu de hauteur au tapis.
  const measure = () => Math.max(48, Math.min(window.innerHeight < 620 ? 50 : 84, Math.floor((Math.min(window.innerWidth, 480) - 24 - 4 * 6) / 5)));
  const [width, setWidth] = useState(measure);
  useEffect(() => {
    const onResize = () => setWidth(measure());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

// ---------------------------------------------------------------------------
// L'en-tête : quitter, le nom de la table, les règles

function leaveTable(view: TableView): void {
  const live = view.hand !== null && !view.hand.folded
    && (view.phase === "triche" || view.phase === "encheres" || view.phase === "abattage");
  // Hors d'une main, `pot` est ce qui est resté sur la table : qui s'en va le laisse aux autres.
  const leftOver = view.hand === null && view.pot > 0;
  // Un tournoi déjà joué (le dénouement de sa dernière main) : son résultat est acquis, partir
  // n'y change rien. Pas de feuille : on va droit à la fin.
  if (tournamentDecided(view)) {
    void play({ type: "quitter" });
    return;
  }
  // Ce qu'on abandonne en partant se dit d'abord : une main en cours, un pot resté là, un défi, la Table des Maîtres.
  if (live || leftOver || view.kind === "defi" || view.kind === "maitres") nav.push({ name: "poker-feuille", feuille: "quitter" });
  else void play({ type: "quitter" });
}

function EnteteTable({ titre, view }: { titre: string; view: TableView | null }) {
  const busy = usePoker((s) => s.busy);
  return (
    <Entete
      titre={titre}
      gauche={
        <button
          type="button"
          className="entete__bouton entete__retour"
          onClick={() => (view && view.you !== null ? leaveTable(view) : nav.back())}
          disabled={busy === "quitter"}
          aria-label={view && view.you !== null ? t("Quitter la table") : t("Retour")}
        >
          <Icon name="fermer" />
        </button>
      }
      droite={
        <button
          type="button"
          className="entete__bouton"
          onClick={() => nav.push({ name: "poker-feuille", feuille: "regles" })}
          aria-label={t("Les règles")}
        >
          <Icon name="info" />
        </button>
      }
    />
  );
}

function HorsLigne() {
  return (
    <p className="poker-avis poker-avis--alerte" role="status">
      <Icon name="hors-ligne" size={20} />
      <span>{t("Hors connexion. La table t'attend : on reprend dès que le réseau revient.")}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// La voix de la table : ce qu'il y a à faire, ou ce qu'un personnage vient de dire

interface VoixProps {
  /** Un geste refusé : il passe devant tout le reste, trois secondes. */
  refus: string | null;
  /** Ce qu'un personnage dit, quand le joueur n'a rien à décider. */
  replique: Line | null;
  /** La phrase parle d'une carte en double : la petite carte teintée la précède. */
  double?: boolean;
  /** La place d'une réplique de deux lignes est gardée, qu'elle soit dite ou non. */
  garde?: boolean;
  children: ReactNode;
}

function Voix({ refus, replique, double = false, garde = false, children }: VoixProps) {
  if (refus) return <p className={cx("poker-voix poker-voix--refus", garde && "poker-voix--garde")} role="alert">{refus}</p>;
  if (replique) {
    return (
      <div className={cx("poker-voix poker-voix--replique", garde && "poker-voix--garde")}>
        <Tete who={{ bot: replique.speaker, pseudo: null, species: null, look: null }} className="poker-tete--mini" />
        <p>
          <span className="poker-voix__nom">{replique.name}</span>
          {replique.gesture ? <em>{replique.text}</em> : t("« {replique} »", { replique: replique.text })}
        </p>
      </div>
    );
  }
  return (
    <p className={cx("poker-voix", garde && "poker-voix--garde")} role="status">
      <span>
        {double && <span className="poker-voix__double" aria-hidden="true" />}
        {children}
      </span>
    </p>
  );
}

/** Vrai si une même carte est montrée par deux joueurs à l'abattage : l'un des deux l'a glissée. */
function hasDouble(view: TableView): boolean {
  return view.phase === "abattage" && doubles(view.seats.map((seat) => seat?.cards ?? [])).size > 0;
}

/** Ce qu'il y a à faire maintenant, en une phrase. */
function promptOf(view: TableView, who: (seat: number) => Identity | null): string {
  const o = view.options;
  const hand = view.hand;
  if (o.back) return t("Tu es noté absent : tes décisions tombent toutes seules.");
  switch (view.phase) {
    case "triche":
      if (o.cheat) return t("Touche une carte pour la remplacer, ou joue franc jeu.");
      if (hand?.chosen) return hand.swap ? t("Carte glissée, ni vu ni connu. Les autres choisissent…") : t("Franc jeu. Les autres choisissent…");
      return t("La table choisit ses cartes…");
    case "encheres": {
      if (view.turn === view.you) {
        return o.call > 0 ? t("À toi : {montant} pour suivre.", { montant: formatEuros(o.call) }) : t("À toi de parler.");
      }
      if (hand?.folded) return t("Tu es hors du coup : la main se finit sans toi.");
      const speaker = view.turn === null ? null : who(view.turn);
      return speaker ? t("{nom} réfléchit…", { nom: capitalize(nameInSentence(speaker)) }) : t("Les enchères continuent…");
    }
    case "abattage":
      if (o.accuse.length > 0) {
        return hasDouble(view)
          ? t("Carte en double : quelqu'un a triché. Touche une main pour l'accuser.")
          : t("Qui a triché ? Touche une main pour l'accuser.");
      }
      if (hand && !hand.folded && hand.spoke) return hand.accuse === null ? t("Rien à dire. Verdict dans un instant.") : t("Accusation lancée. Verdict dans un instant.");
      return t("Les joueurs se jaugent…");
    case "attente": {
      // Le tapis ne couvre plus la blinde : la table repartira sans lui, à moins de recaver.
      const me = view.you === null ? null : view.seats[view.you] ?? null;
      if (me && o.rebuy && me.stack + me.reserve < view.blind) return t("Ton tapis ne couvre plus la blinde : recave pour jouer la suite.");
      return view.deadline !== null ? t("La main suivante arrive…") : t("On attend un joueur pour repartir.");
    }
    default:
      return "";
  }
}

/** La blinde en vigueur ; dans un défi, ce qu'elle vaudra bientôt, et dans combien de mains. */
function blindText(view: TableView): string {
  const montant = formatEuros(view.blind);
  if (!view.rise) return t("Blinde : {montant}", { montant });
  const suivante = formatEuros(view.rise.blind);
  const n = view.rise.hand - view.handNo;
  return n > 1
    ? t("Blinde : {montant}, puis {suivante} dans {n} mains", { montant, suivante, n })
    : t("Blinde : {montant}, puis {suivante} à la main suivante", { montant, suivante });
}

// ---------------------------------------------------------------------------
// La main du joueur

/** Un jeu doré se montre : à la donne, chaque carte se pose de dos, puis se retourne, l'une après l'autre. */
const GOLD_FLIP_MS = 240;
const GOLD_EVERY_MS = 115;

function MaMain({ view, dealt, dore }: { view: TableView; dealt: boolean; dore: boolean }) {
  const hand = view.hand;
  const width = useHandWidth();
  // La donne d'un jeu doré : combien de cartes sont déjà retournées (les cinq, hors de ce moment).
  const flourish = dealt && dore;
  const [turned, setTurned] = useState(0);
  useEffect(() => {
    if (!flourish) return;
    setTurned(0);
    const timers: number[] = [];
    // Au rythme de la donne : chaque carte se retourne quand elle se pose.
    for (let i = 0; i < 5; i++) timers.push(window.setTimeout(() => setTurned((n) => Math.max(n, i + 1)), 140 + i * GOLD_EVERY_MS + GOLD_FLIP_MS));
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [flourish, view.handNo]);
  if (!hand) return null;
  const canCheat = view.phase === "triche" && view.options.cheat;
  return (
    <div
      className={cx(
        "poker-main", hand.folded && "poker-main--couchee", dealt && "poker-main--donne", canCheat && "poker-main--choix",
        // Tant qu'une carte est encore de dos, le nom de la combinaison attend, sous la main.
        flourish && turned < hand.cards.length && "poker-main--dos",
      )}
      style={{ "--carte": `${width}px` } as CSSProperties}
    >
      {hand.cards.map((card, i) => {
        const mine = hand.swap?.index === i;
        const name = nomDeCarte(card) ?? "";
        const face = (
          <Carte
            // La donne d'un jeu doré repart d'une carte neuve, déjà de dos : elle ne se retourne qu'une fois posée.
            key={flourish ? "dos" : "face"}
            carte={card}
            largeur={width}
            cachee={flourish && i >= turned}
            dore={dore}
            label={mine ? t("{carte}, glissée par toi", { carte: name }) : flourish ? name : undefined}
            className={mine ? "poker-carte--glissee" : undefined}
          />
        );
        return canCheat ? (
          <button
            key={i}
            type="button"
            className="poker-main__carte"
            style={{ "--i": i } as CSSProperties}
            onClick={() => nav.push({ name: "poker-feuille", feuille: "triche", index: i })}
            aria-label={t("Remplacer : {carte}", { carte: name })}
          >
            {face}
          </button>
        ) : (
          <span key={i} className="poker-main__carte" style={{ "--i": i } as CSSProperties}>{face}</span>
        );
      })}
    </div>
  );
}

/** Sous la main : le tapis du joueur, le nom de sa combinaison, sa mise. */
function Infos({ view }: { view: TableView }) {
  const me = view.seats[view.you as number]!;
  const hand = view.hand;
  const state = hand?.folded ? t("couché") : me.allIn ? t("à tapis") : hand ? categoryName(hand.category) : null;
  return (
    <div className="poker-moi__infos">
      {/* Comme autour du tapis : le tapis en mimosa, la mise à côté de son jeton. Sur un petit écran, ces deux signes suffisent. */}
      <span className="poker-moi__chiffre">
        <span className="poker-moi__nom">{t("Ton tapis")}</span>
        <span className="poker-moi__valeur">
          {view.dealer === view.you && <span className="poker-siege__donneur poker-siege__donneur--moi" title={t("donneur")}>{t("D")}</span>}
          <strong className="chiffres">{formatEuros(me.stack)}</strong>
        </span>
      </span>
      {/* Chaque chose garde sa colonne, qu'elle soit là ou non : le tapis à gauche, la mise à droite. */}
      {state ? <span className={cx("poker-moi__combi", hand?.folded && "poker-moi__combi--efface")}>{state}</span> : <span />}
      {hand ? (
        <span className="poker-moi__chiffre poker-moi__chiffre--droite">
          <span className="poker-moi__nom">{t("Ta mise")}</span>
          <span className="poker-moi__valeur poker-moi__valeur--mise">
            <Jeton />
            <strong className="chiffres">{formatEuros(me.committed)}</strong>
          </span>
        </span>
      ) : <span />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Les gestes

/** À partir de neuf signes (« 137,05 M€ », « 287,35 Bn€ »), une somme ne tient plus à côté du titre des mises. */
const LONG_AMOUNT = 9;

// Les tailles de mise : des clés de traduction, lues à l'affichage.
const SIZES: Record<BetChoice["size"], string> = { min: "mini", milieu: "milieu", pot: "pot", tapis: "tapis" };

function Encheres({ view, off }: { view: TableView; off: boolean }) {
  const busy = usePoker((s) => s.busy);
  const o = view.options;
  const me = view.seats[view.you as number]!;
  // Les tailles proposées : la plus petite, la hauteur du pot (ou le milieu), et le tapis quand il est permis.
  const choices = betChoices(o, { pot: potSized(view, me.bet) });
  // Suivre engage tout ce qui reste : c'est un tapis, et on le dit.
  const allIn = o.call > 0 && o.call >= me.stack;
  const titre = o.bet ? t("Miser") : t("Relancer à");
  // Des sommes à rallonge (« 137,05 Bn€ ») : chaque mise garde la largeur de sa somme.
  const longues = choices.some((choice) => formatEuros(choice.amount).length >= LONG_AMOUNT);
  const locked = off || busy !== null;
  // Un tapis engage tout : il se confirme sur sa feuille, qui redit le montant. Les autres gestes partent d'un appui.
  const shove = () => nav.push({ name: "poker-feuille", feuille: "tapis" });
  return (
    <div className="poker-actions">
      {choices.length > 0 && (
        <div className={cx("poker-mises", longues && "poker-mises--longues")} role="group" aria-label={titre}>
          <div className="poker-mises__tete">
            <span className="poker-mises__titre" aria-hidden="true">{titre}</span>
            {/* Le montant de son choix, saisi sur sa feuille : entre les bornes que le serveur donne. */}
            <button
              type="button"
              className="poker-mises__autre"
              data-geste="autre"
              disabled={locked}
              onClick={() => nav.push({ name: "poker-feuille", feuille: "mise" })}
            >
              <span>{t("Autre montant")}</span>
              <Icon name="chevron" size={14} />
            </button>
          </div>
          {choices.map((choice) => (
            <button
              key={choice.size}
              type="button"
              className={cx("poker-mise", choice.size === "tapis" && "poker-mise--tapis")}
              data-taille={choice.size}
              disabled={locked}
              onClick={() => (choice.action.type === "tapis" ? shove() : void play(choice.action))}
            >
              <span className="poker-mise__taille">{t(SIZES[choice.size])}</span>
              <span className="poker-mise__somme chiffres">{formatEuros(choice.amount)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="poker-actions__rang poker-actions__rang--parole">
        <Bouton variante="secondaire" data-geste="coucher" disabled={locked} attente={busy === "coucher"} onClick={() => void play({ type: "coucher" })}>
          {t("Se coucher")}
        </Bouton>
        {o.check ? (
          <Bouton data-geste="parole" disabled={locked} attente={busy === "parole"} onClick={() => void play({ type: "parole" })}>{t("Parole")}</Bouton>
        ) : allIn ? (
          <Bouton data-geste="tapis" disabled={locked} attente={busy === "suivre" || busy === "tapis"} onClick={shove}>
            {t("Tapis : {montant}", { montant: formatEuros(o.call) })}
          </Bouton>
        ) : (
          <Bouton data-geste="suivre" disabled={locked} attente={busy === "suivre"} onClick={() => void play({ type: "suivre" })}>
            {t("Suivre : {montant}", { montant: formatEuros(o.call) })}
          </Bouton>
        )}
      </div>
    </div>
  );
}

function Actions({ view }: { view: TableView }) {
  const busy = usePoker((s) => s.busy);
  const o = view.options;
  const me = view.seats[view.you as number]!;
  const off = busy !== null;
  const recave = () => nav.push({ name: "poker-feuille", feuille: "recave" });
  // Entre deux mains, on peut recaver (jusqu'à la cave maximale). Quand le tapis ne couvre plus
  // la blinde, c'est même le geste attendu : sans recave, la main suivante part sans le joueur.
  const canRebuy = o.rebuy !== null;
  const dry = canRebuy && me.stack + me.reserve < view.blind;

  if (o.back) {
    return (
      <div className="poker-actions">
        <Bouton bloc data-geste="retour" attente={busy === "retour"} disabled={off} onClick={() => void play({ type: "retour" })}>{t("Je suis là")}</Bouton>
      </div>
    );
  }
  if (view.phase === "triche" && o.cheat) {
    return (
      <div className="poker-actions">
        <Bouton variante="secondaire" bloc data-geste="franc-jeu" attente={busy === "franc-jeu"} disabled={off} onClick={() => void play({ type: "franc-jeu" })}>
          {t("Jouer franc jeu")}
        </Bouton>
      </div>
    );
  }
  if (view.phase === "encheres" && o.fold) return <Encheres view={view} off={false} />;
  if (view.phase === "abattage" && o.accuse.length > 0) {
    return (
      <div className="poker-actions">
        <Bouton variante="secondaire" bloc data-geste="rien" attente={busy === "rien"} disabled={off} onClick={() => void play({ type: "rien" })}>
          {t("Rien à dire")}
        </Bouton>
      </div>
    );
  }
  if (view.phase === "denouement") {
    // Un défi, la Table des Maîtres : un tournoi se joue jusqu'au bout. Quand le joueur n'a plus
    // rien, ou plus aucun adversaire, la suite est son dénouement.
    const over = tournamentDecided(view);
    const next = (
      <Bouton
        variante={dry ? "secondaire" : "principal"}
        data-geste="suite"
        attente={busy === "suite"}
        disabled={off || !o.next}
        onClick={() => void play({ type: "suite" })}
      >
        {!o.next ? t("On attend les autres…") : !over ? t("Main suivante") : view.kind === "maitres" ? t("Fin du tournoi") : t("Fin du défi")}
      </Bouton>
    );
    return (
      <div className="poker-actions">
        {/* Le geste attendu prend la place ; l'autre se range à côté, à sa largeur. */}
        <div className={cx("poker-actions__rang", !canRebuy ? "poker-actions__rang--seul" : dry ? "poker-actions__rang--recave" : "poker-actions__rang--suite")}>
          {canRebuy && !dry && <Bouton variante="secondaire" data-geste="recave" disabled={off} onClick={recave}>{t("Recaver")}</Bouton>}
          {next}
          {dry && <Bouton data-geste="recave" disabled={off} onClick={recave}>{t("Recaver")}</Bouton>}
        </div>
      </div>
    );
  }
  if (canRebuy && (dry || view.phase === "attente")) {
    return (
      <div className="poker-actions">
        <Bouton variante={dry ? "principal" : "secondaire"} bloc data-geste="recave" disabled={off} onClick={recave}>{t("Recaver")}</Bouton>
      </div>
    );
  }
  return <div className="poker-actions poker-actions--vide" />;
}

// ---------------------------------------------------------------------------
// Le dénouement, côté joueur : ce que la main lui rapporte, et où va le pot

function potLine(line: OutcomeLine, you: number | null, nom: (seat: number) => string): string | null {
  const montant = "amount" in line ? formatEuros(line.amount) : "";
  switch (line.kind) {
    case "pot":
      if (line.seat === you) return line.side ? t("Tu prends un pot annexe : {montant}.", { montant }) : t("Tu prends le pot : {montant}.", { montant });
      return line.side
        ? t("{nom} prend un pot annexe : {montant}.", { nom: capitalize(nom(line.seat)), montant })
        : t("{nom} prend le pot : {montant}.", { nom: capitalize(nom(line.seat)), montant });
    case "partage":
      return t("Pot partagé ({montant}) entre {noms}.", { montant, noms: nameList(line.seats.map(nom)) });
    case "reste":
      return t("Plus personne pour le prendre : le pot ({montant}) reste sur la table.", { montant });
    case "seul":
      return line.seat === you
        ? t("Tout le monde s'est couché : tu prends le pot, {montant}.", { montant })
        : t("{nom} prend le pot sans montrer ses cartes : {montant}.", { nom: capitalize(nom(line.seat)), montant });
    default:
      return null;
  }
}

/** Ce que la main rapporte ou coûte au joueur : la première chose qu'il veut savoir. */
function bilanOf(net: number | null): string | null {
  if (net === null) return null;
  if (net > 0) return t("Cette main te rapporte {montant}.", { montant: formatEuros(net) });
  if (net < 0) return t("Cette main te coûte {montant}.", { montant: formatEuros(-net) });
  return t("Cette main ne te coûte rien.");
}

/** Un pot emporté sans abattage : ce que la main rapporte au joueur, et qui ramasse. */
function BilanSeul({ result, you, nom }: { result: HandResult; you: number | null; nom: (seat: number) => string }) {
  const net = netOf(result, you);
  const headline = bilanOf(net);
  const pot = result.pots[0];
  const line = pot ? potLine({ kind: "seul", seat: pot.winners[0]?.seat ?? -1, amount: pot.amount }, you, nom) : null;
  return (
    <div className="poker-bilan" role="status">
      {headline && <p className={cx("poker-bilan__titre", net !== null && net > 0 && "poker-bilan__titre--gain")}>{headline}</p>}
      {line && <p>{line}</p>}
    </div>
  );
}

function Bilan({ outcome, you, nom }: { outcome: Denouement; you: number | null; nom: (seat: number) => string }) {
  const net = netOf(outcome.result, you);
  const headline = bilanOf(net);
  return (
    <div className="poker-bilan" role="status">
      {headline && (
        <p className={cx("poker-bilan__titre", net !== null && net > 0 && "poker-bilan__titre--gain", !outcome.settled && "poker-bilan--attend")}>
          {headline}
        </p>
      )}
      {outcome.lines.map((line, i) => {
        const text = potLine(line, you, nom);
        if (!text) return null;
        return <p key={i} className={cx(outcome.lineBeat[i]! >= outcome.beat && "poker-bilan--attend")}>{text}</p>;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// La partie

function Partie({ view, offline }: { view: TableView; offline: boolean }) {
  const root = useRef<HTMLElement>(null);
  const offset = usePoker((s) => s.offset);
  const notice = usePoker((s) => s.notice);
  const calm = useGame(isCalm);
  const dore = useGoldenDeck();
  const you = view.you as number;
  const who = useRoster(view);
  // La Table des Maîtres vient de s'ouvrir sous les yeux du joueur : le tirage se présente, une
  // fois, le temps de la première triche. (Lu avant que la donne ne consomme ce « tout neuf ».)
  const [arrival] = useState(() => view.kind === "maitres" && view.handNo <= 1 && usePoker.getState().fresh);
  const events = useTableEvents(view, root);
  const nom = useCallback((seat: number) => (seat === you ? t("toi") : nameInSentence(who(seat))), [you, who]);

  // Ce qu'un personnage dit : une réplique à la fois, quelques secondes.
  const [replique, setReplique] = useState<{ id: number; line: Line } | null>(null);
  const talkId = useRef(0);
  const talkTimer = useRef(0);
  const say = useCallback((line: Line | null, ms = 4_000) => {
    if (!line) return;
    const id = ++talkId.current;
    setReplique({ id, line });
    window.clearTimeout(talkTimer.current);
    talkTimer.current = window.setTimeout(() => setReplique((now) => (now?.id === id ? null : now)), ms);
  }, []);
  useEffect(() => () => window.clearTimeout(talkTimer.current), []);

  // Ce que le joueur a vu de cette main : un abattage ou un dénouement qui arrivent sous
  // ses yeux se jouent ; revenu en cours de route, il les trouve déjà dits.
  const sawBefore = useRef(0);
  const sawHand = useRef(0);
  if (view.phase === "triche" || view.phase === "encheres") sawBefore.current = view.handNo;
  if (view.phase === "triche" || view.phase === "encheres" || view.phase === "abattage") sawHand.current = view.handNo;

  const result = view.result && view.result.no === view.handNo ? view.result : null;
  const outcome = useDenouement(view, sawHand.current === view.handNo, {
    root,
    say,
    calm,
    botAt: (seat) => who(seat)?.bot ?? null,
    big: (amount) => amount >= view.blind * 10,
    fallen: fallenSeats(view),
  });
  const board = view.phase === "abattage" || outcome !== null;
  const masters = view.kind === "maitres";
  const presentation = arrival && masters && view.handNo === 1 && view.phase === "triche";
  const walkover = view.phase === "denouement" && result !== null && !result.showdown;

  // Un pot emporté sans abattage : un mot du gagnant, s'il est beau. Décidé d'avance, comme
  // au dénouement : sa place est gardée, le tapis ne bouge pas quand il parle.
  const walkPot = walkover && result ? result.pots[0] ?? null : null;
  const walkWinner = walkPot?.winners[0] ?? null;
  const walkBot = walkWinner ? who(walkWinner.seat)?.bot ?? null : null;
  const walkTalks = walkPot !== null && result !== null && sawHand.current === result.no && walkBot !== null
    && walkPot.amount >= view.blind * 10;
  const walked = useRef(0);
  useEffect(() => {
    if (!walkTalks || !result || walked.current === result.no) return;
    walked.current = result.no;
    say(tableLine(walkBot, "gagne", result.no), 3_600);
  }, [walkTalks, result, walkBot, say]);

  const myMove = view.options.back || view.options.cheat || view.turn === you || view.options.accuse.length > 0;
  // C'est au joueur de se décider : le téléphone le lui dit d'une courte vibration.
  useEffect(() => {
    if (myMove) haptic.reveal();
  }, [myMove, view.step]);

  return (
    <main
      ref={root}
      // Cinq ou six sièges : deux voisins s'assoient sur les côtés du tapis, qui a besoin de plus de place.
      className={cx(
        "ecran poker-table", board && "poker-table--abattage", view.seats.length >= 5 && "poker-table--grande",
        masters && "poker-table--maitres", dore && "poker-table--doree",
      )}
      data-phase={view.phase}
      data-main={view.handNo}
    >
      <EnteteTable titre={tableTitle(view)} view={view} />
      {offline && <HorsLigne />}
      <div className="poker-table__scene">
        {board ? (
          <Abattage view={view} who={who} flip={view.phase === "abattage" && sawBefore.current === view.handNo} outcome={outcome} dore={dore} />
        ) : presentation ? (
          <Presentation view={view} />
        ) : (
          <Tapis view={view} labels={events.labels}>
            <span className="poker-pot__blinde">{blindText(view)}</span>
            {/* À la Table des Maîtres : combien de maîtres sont encore assis. */}
            {masters && <span className="poker-pot__blinde poker-pot__maitres">{mastersLeftText(mastersLeft(view).left)}</span>}
          </Tapis>
        )}
      </div>
      {/* À lui de miser : les mises prennent une rangée de plus, la phrase tient en une ligne. */}
      <section className={cx("poker-moi", view.phase === "encheres" && view.options.fold && "poker-moi--mise")} data-siege="moi" aria-label={t("Ta place")}>
        <BarreTemps deadline={view.deadline} offset={offset} total={phaseTotal(view)} mine={myMove} />
        {outcome ? (
          <>
            {/* Après un abattage : un mot d'un personnage, s'il y en a un, puis ce que la main rapporte et où va
                le pot. Sa place est gardée tout le dénouement : les mains ne bougent pas quand il parle. */}
            {(outcome.talks || notice || replique) && (
              <Voix refus={notice?.text ?? null} replique={replique?.line ?? null} garde>{null}</Voix>
            )}
            <Bilan outcome={outcome} you={you} nom={nom} />
          </>
        ) : walkover && result ? (
          <>
            {/* Sans abattage : le même bilan, et un mot du gagnant si le pot est beau. */}
            {(walkTalks || notice || replique) && (
              <Voix refus={notice?.text ?? null} replique={replique?.line ?? null} garde>{null}</Voix>
            )}
            <BilanSeul result={result} you={you} nom={nom} />
            <Infos view={view} />
          </>
        ) : (
          <>
            <Voix refus={notice?.text ?? null} replique={myMove ? null : replique?.line ?? null} double={view.options.accuse.length > 0 && hasDouble(view)}>
              {promptOf(view, who)}
            </Voix>
            {!board && view.hand && <MaMain view={view} dealt={events.dealt === view.handNo && !calm} dore={dore} />}
            {!board && <Infos view={view} />}
          </>
        )}
        <Actions view={view} />
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// La salle d'attente d'une table d'amis : le code, qui est là, et le bouton pour lancer

function Attente({ view, offline }: { view: TableView; offline: boolean }) {
  const busy = usePoker((s) => s.busy);
  const you = view.you as number;
  const owner = view.owner === you;
  const who = view.owner !== null && view.seats[view.owner] ? identityOf(view.seats[view.owner]!) : null;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(view.code);
      toast(t("Code copié."));
    } catch {
      toast(t("Impossible de copier ici. Note le code à la main."), "erreur");
    }
  };
  const share = async () => {
    try {
      await navigator.share({
        text: t("Rejoins ma table de Poker Tricheur sur Grattouille. Le code : {code}", { code: view.code }),
        url: window.location.origin + window.location.pathname,
      });
    } catch (error) {
      // Le partage refermé sans rien envoyer n'est pas une panne ; s'il n'est pas possible ici, on copie.
      if ((error as { name?: string } | null)?.name !== "AbortError") await copy();
    }
  };

  return (
    <main className="ecran poker-table poker-table--attente" data-phase="attente" data-main={0}>
      <EnteteTable titre={tableTitle(view)} view={view} />
      {offline && <HorsLigne />}
      <div className="poker-table__scene">
        <Tapis view={view} labels={{}} centre={
          <div className="poker-code-table">
            <span className="poker-code-table__titre">{t("Le code de la table")}</span>
            <strong className="poker-code-table__lettres">{view.code}</strong>
          </div>
        } />
      </div>
      <section className="poker-moi" aria-label={t("Ta place")}>
        <p className="poker-voix" role="status">
          {owner
            ? view.options.start ? t("Tout le monde est là ? À toi de lancer.") : t("Donne le code à tes amis : il faut être deux pour jouer.")
            : t("{nom} lance la partie quand tout le monde est là.", { nom: capitalize(nameInSentence(who)) })}
        </p>
        <p className="poker-moi__reglages">
          {t("Blinde : {montant}", { montant: formatEuros(view.blind) })}
          {" · "}
          {t("Ton tapis : {montant}", { montant: formatEuros(view.seats[you]!.stack) })}
        </p>
        <div className="poker-actions">
          <div className={cx("poker-actions__rang", !canShare && "poker-actions__rang--seul")}>
            {canShare && <Bouton variante="secondaire" onClick={() => void share()}>{t("Partager")}</Bouton>}
            <Bouton variante="secondaire" onClick={() => void copy()}>
              <Icon name="copier" size={20} />{t("Copier le code")}
            </Bouton>
          </div>
          {owner && (
            <Bouton bloc data-geste="lancer" disabled={!view.options.start || busy !== null} attente={busy === "lancer"} onClick={() => void play({ type: "lancer" })}>
              {t("Lancer la partie")}
            </Bouton>
          )}
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sorti de table : pourquoi, et ce qui retourne dans la bourse

// Pourquoi le joueur n'est plus assis : des clés de traduction, lues à l'affichage.
const RAISONS: Partial<Record<Left["reason"], string>> = {
  absent: "Trois mains sans jouer : ta place a été libérée.",
  "a-sec": "Trois mains sans pouvoir payer la blinde : ta place a été libérée.",
  reserve: "Ta cave n'est pas arrivée à temps : ta place a été libérée.",
  inactive: "La table s'est endormie : trente minutes sans un geste, elle a fermé.",
  banque: "La table a fermé : il y avait trop d'argent sur le tapis pour compter juste.",
  "defi-nul": "Match nul : plus personne n'a de quoi continuer.",
};

function Sortie({ view, left, gone }: { view: TableView | null; left: Left | null; gone: boolean }) {
  const reason = left?.reason ?? null;
  const host = view?.kind === "defi" && view.place ? placeById(view.place).host : null;
  const won = reason === "defi-gagne";
  const lost = reason === "defi-perdu";
  const bonus = left?.bonus ?? 0;
  const payout = left?.payout ?? 0;

  // La cagnotte d'un hôte ruiné tombe en pièces sonnantes.
  useEffect(() => {
    if (won) playPot();
  }, [won]);

  // Une victoire de plus contre l'hôte : la troisième ouvre son histoire, dans les Souvenirs ;
  // les deux premières disent ce qu'il reste. L'état du joueur, rendu avec la fin de table,
  // porte déjà le nouveau compte (s'il est en train d'être relu, on attend qu'il soit là).
  const hostWins = useGame((s) => s.player?.hostWins);
  const rereading = usePoker((s) => s.lobbyBusy);
  const story = won && view?.place ? hostStory(hostWins, view.place) : null;
  const news = story && host && !rereading ? storyAfterWin(story, host) : null;

  const line = host && won ? hostLine(host, bonus > 0 ? "ruine" : "ruine-encore", formatEuros(bonus))
    : host && lost ? hostLine(host, "vainqueur") : null;
  const titre = won ? t("Défi relevé !") : lost ? t("Le défi reste à relever") : t("Fin de la partie");
  const texte = reason && RAISONS[reason] ? t(RAISONS[reason]!)
    : lost ? t("Tu le retentes quand tu veux.")
      : won || reason === "quitte" ? null
        : gone || view?.phase === "fermee" ? t("Cette table a fermé.") : t("Tu n'as plus de place à cette table.");

  return (
    <main className="ecran poker-table poker-table--sortie">
      <Entete titre={view ? tableTitle(view) : t("Le Poker Tricheur")} droite={<Bourse />} />
      <div className="poker-sortie">
        <h2 className="t-titre">{titre}</h2>
        {line && <Bulle line={line} className="poker-sortie__hote" />}
        {won && bonus > 0 && (
          <p className="poker-sortie__cagnotte">
            <span>{t("Sa cagnotte")}</span>
            <strong className="t-gain chiffres">+<Compteur valeur={bonus} ms={900} sonne depart={0} /></strong>
          </p>
        )}
        {story && news && (
          <p className={cx("poker-sortie__histoire", news.ouverte && "poker-sortie__histoire--ouverte")}>
            <Reperes story={story} />
            <span>{news.texte}</span>
          </p>
        )}
        {texte && <p>{texte}</p>}
        {payout > 0 && <p>{t("Ton tapis ({montant}) est retourné dans ta bourse.", { montant: formatEuros(payout) })}</p>}
        <Bouton bloc onClick={toHall}>{t("Retour au hall")}</Bouton>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------

export function Table({ code }: { code: string }) {
  const view = usePoker((s) => (s.code === code ? s.view : null));
  const left = usePoker((s) => (s.code === code ? s.left : null));
  const gone = usePoker((s) => s.code === code && s.gone);
  const offline = useTableOffline();

  useEffect(() => watchTable(code), [code]);

  // La Table des Maîtres : on se souvient de qui y était assis, et avec quel tapis. Une table
  // fermée n'a plus personne à ses sièges, et ce sont eux qui saluent sur le panneau de fin.
  const masters = useRef<SeatView[]>([]);
  if (view && view.kind === "maitres" && view.you !== null) {
    const seated = mastersOf(view);
    if (seated.length > 0) masters.current = seated;
  }
  // Ses trois fins ont leur panneau : gagnée, perdue, ou quittée avec son tapis.
  const end = left !== null && isMastersEnd(left.reason) && (view?.kind === "maitres" || left.reason !== "quitte") ? left.reason : null;

  // Parti de soi-même d'une autre table : retour au hall, en disant ce qu'on remporte. La
  // feuille de départ se referme d'abord ; la table ne recule qu'une fois redevenue l'écran affiché.
  const quit = left !== null && left.reason === "quitte" && end === null;
  const onTop = useNav((s) => s.stack[s.index]?.name === "poker-table");
  const leaving = useRef(false);
  useEffect(() => {
    if (!left || !quit || !onTop || leaving.current) return;
    leaving.current = true;
    toast(t("Tu quittes la table avec {montant}.", { montant: formatEuros(left.payout) }));
    toHall();
  }, [left, quit, onTop]);

  if (quit) return <main className="ecran poker-table" aria-busy="true" />;
  if (left && end) return <SortieMaitres reason={end} payout={left.payout} masters={masters.current} onBack={toHall} />;
  if (left || gone || (view && (view.phase === "fermee" || view.you === null))) return <Sortie view={view} left={left} gone={gone} />;
  if (!view) {
    return (
      <main className="ecran poker-table">
        <EnteteTable titre={t("Le Poker Tricheur")} view={null} />
        {offline && <HorsLigne />}
        <p className="poker-table__vide" role="status">{t("On retrouve ta table…")}</p>
      </main>
    );
  }
  if (view.phase === "attente" && !view.started) return <Attente view={view} offline={offline} />;
  return <Partie view={view} offline={offline} />;
}
