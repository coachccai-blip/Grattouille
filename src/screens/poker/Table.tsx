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
import type { TableView } from "../../../shared/poker/types";
import type { Line } from "../../app/dialogues";
import { capitalize } from "../../app/helpers";
import { nav } from "../../app/nav";
import { play, usePoker, useTableOffline, watchTable, type Left } from "../../app/poker";
import { isCalm, toast, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { playPot } from "../../fx/audio";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse, Compteur } from "../../ui/Bourse";
import { Bulle, Entete } from "../../ui/Commun";
import { Carte, nomDeCarte } from "../../ui/Carte";
import { Abattage } from "./Abattage";
import { betChoices, netOf, phaseTotal, type BetChoice, type OutcomeLine } from "./calcul";
import { useDenouement, type Denouement } from "./denouement";
import { useTableEvents } from "./evenements";
import { BarreTemps, Tete } from "./parts";
import { hostLine, tableLine } from "./repliques";
import { Tapis } from "./Tapis";
import { categoryName, identityOf, nameInSentence, nameList, tableTitle, type Identity } from "./textes";
import "./poker.css";
import "./table.css";

/** Retour au hall, quelle que soit la feuille ouverte par-dessus la table. */
function toHall(): void {
  nav.reset([{ name: "promenade" }, { name: "poker" }]);
}

/** Qui est assis où : on s'en souvient après un départ, pour nommer encore celui dont on lit la main. */
function useRoster(view: TableView): (seat: number) => Identity | null {
  const known = useRef<Record<number, Identity>>({});
  for (const seat of view.seats) if (seat) known.current[seat.seat] = identityOf(seat);
  return useCallback((seat: number) => known.current[seat] ?? null, []);
}

/** La largeur d'une carte de la main du joueur : cinq cartes tiennent côte à côte. */
function useHandWidth(): number {
  const measure = () => Math.max(48, Math.min(84, Math.floor((Math.min(window.innerWidth, 480) - 24 - 4 * 6) / 5)));
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
  // Ce qu'on abandonne en partant se dit d'abord : une main en cours, un pot resté là, un défi.
  if (live || leftOver || view.kind === "defi") nav.push({ name: "poker-feuille", feuille: "quitter" });
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
  children: ReactNode;
}

function Voix({ refus, replique, children }: VoixProps) {
  if (refus) return <p className="poker-voix poker-voix--refus" role="alert">{refus}</p>;
  if (replique) {
    return (
      <div className="poker-voix poker-voix--replique">
        <Tete who={{ bot: replique.speaker, pseudo: null, species: null, look: null }} className="poker-tete--mini" />
        <p>
          <span className="poker-voix__nom">{replique.name}</span>
          {replique.gesture ? <em>{replique.text}</em> : t("« {replique} »", { replique: replique.text })}
        </p>
      </div>
    );
  }
  return <p className="poker-voix" role="status">{children}</p>;
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
      if (o.accuse.length > 0) return t("Qui a triché ? Touche une main pour l'accuser.");
      if (hand && !hand.folded && hand.spoke) return hand.accuse === null ? t("Rien à dire. Verdict dans un instant.") : t("Accusation lancée. Verdict dans un instant.");
      return t("Les joueurs se jaugent…");
    case "attente":
      return view.deadline !== null ? t("La main suivante arrive…") : t("On attend un joueur pour repartir.");
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

function MaMain({ view, dealt }: { view: TableView; dealt: boolean }) {
  const hand = view.hand;
  const width = useHandWidth();
  if (!hand) return null;
  const canCheat = view.phase === "triche" && view.options.cheat;
  return (
    <div
      className={cx("poker-main", hand.folded && "poker-main--couchee", dealt && "poker-main--donne", canCheat && "poker-main--choix")}
      style={{ "--carte": `${width}px` } as CSSProperties}
    >
      {hand.cards.map((card, i) => {
        const mine = hand.swap?.index === i;
        const name = nomDeCarte(card) ?? "";
        const face = (
          <Carte
            carte={card}
            largeur={width}
            label={mine ? t("{carte}, glissée par toi", { carte: name }) : undefined}
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
      <span className="poker-moi__chiffre">
        <span className="poker-moi__nom">
          {t("Ton tapis")}
          {view.dealer === view.you && <span className="poker-siege__donneur poker-siege__donneur--moi" title={t("donneur")}>{t("D")}</span>}
        </span>
        <strong className="chiffres">{formatEuros(me.stack)}</strong>
      </span>
      {/* Chaque chose garde sa colonne, qu'elle soit là ou non : le tapis à gauche, la mise à droite. */}
      {state ? <span className={cx("poker-moi__combi", hand?.folded && "poker-moi__combi--efface")}>{state}</span> : <span />}
      {hand ? (
        <span className="poker-moi__chiffre poker-moi__chiffre--droite">
          <span className="poker-moi__nom">{t("Ta mise")}</span>
          <strong className="chiffres">{formatEuros(me.committed)}</strong>
        </span>
      ) : <span />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Les gestes

// Les tailles de mise : des clés de traduction, lues à l'affichage.
const SIZES: Record<BetChoice["size"], string> = { min: "mini", milieu: "milieu", pot: "pot", tapis: "tapis" };

function Encheres({ view, off }: { view: TableView; off: boolean }) {
  const busy = usePoker((s) => s.busy);
  const o = view.options;
  const me = view.seats[view.you as number]!;
  const choices = betChoices(o);
  // Suivre engage tout ce qui reste : c'est un tapis, et on le dit.
  const allIn = o.call > 0 && o.call >= me.stack;
  const titre = o.bet ? t("Miser") : t("Relancer à");
  return (
    <div className="poker-actions">
      {choices.length > 0 && (
        <div className="poker-mises" role="group" aria-label={titre}>
          <span className="poker-mises__titre" aria-hidden="true">{titre}</span>
          {choices.map((choice) => (
            <button
              key={choice.size}
              type="button"
              className={cx("poker-mise", choice.size === "tapis" && "poker-mise--tapis")}
              disabled={off || busy !== null}
              onClick={() => void play(choice.action)}
            >
              <span className="poker-mise__taille">{t(SIZES[choice.size])}</span>
              <span className="poker-mise__somme chiffres">{formatEuros(choice.amount)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="poker-actions__rang poker-actions__rang--parole">
        <Bouton variante="secondaire" disabled={off || busy !== null} attente={busy === "coucher"} onClick={() => void play({ type: "coucher" })}>
          {t("Se coucher")}
        </Bouton>
        {o.check ? (
          <Bouton disabled={off || busy !== null} attente={busy === "parole"} onClick={() => void play({ type: "parole" })}>{t("Parole")}</Bouton>
        ) : (
          <Bouton disabled={off || busy !== null} attente={busy === "suivre"} onClick={() => void play({ type: "suivre" })}>
            {allIn ? t("Tapis : {montant}", { montant: formatEuros(o.call) }) : t("Suivre : {montant}", { montant: formatEuros(o.call) })}
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
  // Le tapis ne couvre plus la blinde : sans recave, la main suivante part sans le joueur.
  const dry = me.stack + me.reserve < view.blind;
  // Recaver se propose quand le tapis est passé sous la cave minimale de la table : avant, rien ne presse.
  const low = o.rebuy !== null && me.stack + me.reserve < view.minBuyIn;

  if (o.back) {
    return (
      <div className="poker-actions">
        <Bouton bloc attente={busy === "retour"} disabled={off} onClick={() => void play({ type: "retour" })}>{t("Je suis là")}</Bouton>
      </div>
    );
  }
  if (view.phase === "triche" && o.cheat) {
    return (
      <div className="poker-actions">
        <Bouton variante="secondaire" bloc attente={busy === "franc-jeu"} disabled={off} onClick={() => void play({ type: "franc-jeu" })}>
          {t("Jouer franc jeu")}
        </Bouton>
      </div>
    );
  }
  if (view.phase === "encheres" && o.fold) return <Encheres view={view} off={false} />;
  if (view.phase === "abattage" && o.accuse.length > 0) {
    return (
      <div className="poker-actions">
        <Bouton variante="secondaire" bloc attente={busy === "rien"} disabled={off} onClick={() => void play({ type: "rien" })}>
          {t("Rien à dire")}
        </Bouton>
      </div>
    );
  }
  if (view.phase === "denouement") {
    // Un défi se joue jusqu'au bout : quand l'un des deux n'a plus rien, la suite est son dénouement.
    const rival = view.kind === "defi" ? view.seats.find((seat) => seat !== null && seat.bot !== null) ?? null : null;
    const over = view.kind === "defi" && (me.stack + me.reserve <= 0 || (rival !== null && rival.stack <= 0));
    const next = (
      <Bouton
        variante={dry && low ? "secondaire" : "principal"}
        attente={busy === "suite"}
        disabled={off || !o.next}
        onClick={() => void play({ type: "suite" })}
      >
        {!o.next ? t("On attend les autres…") : over ? t("Fin du défi") : t("Main suivante")}
      </Bouton>
    );
    return (
      <div className="poker-actions">
        <div className={cx("poker-actions__rang", !low && "poker-actions__rang--seul")}>
          {low && !dry && <Bouton variante="secondaire" disabled={off} onClick={recave}>{t("Recaver")}</Bouton>}
          {next}
          {low && dry && <Bouton disabled={off} onClick={recave}>{t("Recaver")}</Bouton>}
        </div>
      </div>
    );
  }
  if (low && (dry || view.phase === "attente")) {
    return (
      <div className="poker-actions">
        <Bouton variante={dry ? "principal" : "secondaire"} bloc disabled={off} onClick={recave}>{t("Recaver")}</Bouton>
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
  const you = view.you as number;
  const who = useRoster(view);
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
  });
  const board = view.phase === "abattage" || outcome !== null;
  const walkover = view.phase === "denouement" && result !== null && !result.showdown;

  // Un pot emporté sans abattage : un mot du gagnant, s'il est beau.
  const walked = useRef(0);
  useEffect(() => {
    if (!walkover || !result || walked.current === result.no || sawHand.current !== result.no) return;
    walked.current = result.no;
    const top = result.pots[0]?.winners[0];
    const bot = top ? who(top.seat)?.bot ?? null : null;
    if (top && bot && result.pots[0]!.amount >= view.blind * 10) say(tableLine(bot, "gagne", result.no), 3_600);
  }, [walkover, result, who, say, view.blind]);

  const myMove = view.options.back || view.options.cheat || view.turn === you || view.options.accuse.length > 0;
  const walkLine = walkover && result ? potLine({ kind: "seul", seat: result.pots[0]?.winners[0]?.seat ?? -1, amount: result.pots[0]?.amount ?? 0 }, you, nom) : null;

  return (
    <main ref={root} className={cx("ecran poker-table", board && "poker-table--abattage")} data-phase={view.phase} data-main={view.handNo}>
      <EnteteTable titre={tableTitle(view)} view={view} />
      {offline && <HorsLigne />}
      <div className="poker-table__scene">
        {board ? (
          <Abattage view={view} who={who} flip={view.phase === "abattage" && sawBefore.current === view.handNo} outcome={outcome} />
        ) : (
          <Tapis view={view} labels={events.labels}>
            <span className="poker-pot__blinde">{blindText(view)}</span>
          </Tapis>
        )}
      </div>
      <section className="poker-moi" data-siege="moi" aria-label={t("Ta place")}>
        <BarreTemps deadline={view.deadline} offset={offset} total={phaseTotal(view)} mine={myMove} />
        {outcome ? (
          <>
            {/* Après un abattage : un mot d'un personnage, s'il y en a un, puis ce que la main rapporte et où va le pot. */}
            {(notice || replique) && <Voix refus={notice?.text ?? null} replique={replique?.line ?? null}>{null}</Voix>}
            <Bilan outcome={outcome} you={you} nom={nom} />
          </>
        ) : (
          <>
            <Voix refus={notice?.text ?? null} replique={myMove ? null : replique?.line ?? null}>
              {walkover ? [bilanOf(result ? netOf(result, you) : null), walkLine].filter(Boolean).join(" ") : promptOf(view, who)}
            </Voix>
            {!board && view.hand && <MaMain view={view} dealt={events.dealt === view.handNo && !calm} />}
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
              <Icon name="copier" size={20} /> {t("Copier le code")}
            </Bouton>
          </div>
          {owner && (
            <Bouton bloc disabled={!view.options.start || busy !== null} attente={busy === "lancer"} onClick={() => void play({ type: "lancer" })}>
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

  const line = host && won ? hostLine(host, bonus > 0 ? "ruine" : "ruine-encore", formatEuros(bonus))
    : host && lost ? hostLine(host, "vainqueur") : null;
  const titre = won ? t("Défi relevé !") : lost ? t("Le défi reste à relever") : t("La table est derrière toi");
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

  // Parti de soi-même : retour au hall, en disant ce qu'on remporte.
  const quit = left !== null && left.reason === "quitte";
  useEffect(() => {
    if (!left || left.reason !== "quitte") return;
    toast(t("Tu quittes la table avec {montant}.", { montant: formatEuros(left.payout) }));
    toHall();
  }, [left]);

  if (quit) return <main className="ecran poker-table" aria-busy="true" />;
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
