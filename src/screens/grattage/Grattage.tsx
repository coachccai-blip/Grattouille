// L'écran de grattage (BRIEF.md, section 8), en plein écran, sans onglets.
//
// Vie d'un ticket à l'écran : choix du signe ou du camp (moteurs `etoile` et
// `camps`), sortie du distributeur, grattage, résultat et sa fête, puis la suite
// (racheter, suivant).
// Tout le grattage se passe sur l'appareil, sans réseau. Quand le résultat
// s'affiche, le ticket est noté comme gratté ; il sera déclaré au serveur avec la
// requête suivante, ou en quittant l'écran.
//
// L'écran a trois étages : l'en-tête, la scène où se tient le ticket, et le plateau.
// Le plateau garde la même hauteur d'un temps à l'autre et porte, tour à tour, les
// boutons, puis le résultat : le ticket ne bouge pas, et rien ne se pose jamais sur lui.
// Quand le ticket est parti, le résultat s'affiche à sa place, au milieu de la scène.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { formatEuros } from "../../../shared/format";
import { placeById } from "../../../shared/places";
import { TIER_DURATION, TIER_RANK, isPlaceOpen, tierOf } from "../../../shared/rules";
import { ticketById } from "../../../shared/tickets";
import type { PendingTicket, TicketDef } from "../../../shared/types";
import { PIOU, hostName, type Line, type Speaker } from "../../app/dialogues";
import { atLeast, lineFor, nextFrame } from "../../app/helpers";
import { nav, useNav } from "../../app/nav";
import { buyTickets, displayBalance, flushAck, isCalm, markRevealed, rememberSign, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { buildLayout, cellIds, matches, needsPick, resolvePick } from "../../engines";
import { PANEL_COUNT, panelCellIds } from "../../engines/multi";
import { playMatch, playStamp, playTicketBought, playTier, scratchEnd } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Fx, type Point } from "../../fx/particles";
import { t } from "../../i18n";
import { ticketName } from "../../i18n/noms";
import { ScratchLayer, type ScratchHandle } from "../../scratch/ScratchLayer";
import { Ticket, useTicketWidth } from "../../ticket/Ticket";
import { cx } from "../../ticket/parts";
import { themeOf } from "../../ticket/themes";
import { Bouton } from "../../ui/Bouton";
import { Bourse } from "../../ui/Bourse";
import { Bulle, BulleLibre, Entete, HorsLigne } from "../../ui/Commun";
import { Fete, Resultat, fullScreen, resultText } from "./Fete";
import { Roue } from "./Roue";
import "./grattage.css";

type Phase = "choix" | "sortie" | "gratte" | "resultat" | "apres";

interface Props {
  tickets: PendingTicket[];
  rafale: boolean;
}

function centerOf(el: Element | null): Point {
  const r = el?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/**
 * La hauteur de fenêtre que le ticket ne prend jamais : c'est avec elle que les tickets ont
 * été réglés (252 px de large sur un écran de 360 × 640, et le ticket « serré », sans sa
 * règle, sur un écran de 320 × 568). L'écran peut en garder plus, jamais moins.
 */
const RESERVE = 236;

/**
 * Ce que l'écran garde pour autre chose que le ticket : marges, en-tête, fente du
 * distributeur et plateau (234 px, ou 222 sur un écran court : voir grattage.css), plus
 * les encoches du téléphone et, en bac à sable, la ligne du bandeau (`--haut`, `--bas`).
 */
function estimateReserve(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;visibility:hidden;padding-top:var(--haut);padding-bottom:var(--bas)";
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const insets = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  probe.remove();
  return Math.max(RESERVE, (window.innerHeight <= 600 ? 222 : 234) + (Number.isFinite(insets) ? insets : 0));
}

/**
 * La hauteur de fenêtre que le ticket ne peut pas prendre. Estimée d'abord, puis
 * mesurée sur la scène dès qu'elle est à l'écran (`shown`) : un bandeau de plus, un
 * texte agrandi, et le ticket se réduit au lieu de déborder sur le plateau.
 */
function useReserve(scene: RefObject<HTMLElement | null>, shown: boolean): number {
  const [reserve, setReserve] = useState(estimateReserve);
  useLayoutEffect(() => {
    const el = scene.current;
    if (!el || !shown) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const room = el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (room > 0) setReserve(Math.max(RESERVE, Math.ceil(window.innerHeight - room)));
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [scene, shown]);
  return reserve;
}

export function Grattage({ tickets, rafale: startRafale }: Props) {
  const player = useGame((s) => s.player);
  const calm = useGame(isCalm);
  const online = useGame((s) => s.online);
  const balance = useGame(displayBalance);
  // D'où l'on vient : « Retour au comptoir » ne se dit que si le retour y mène.
  const fromCounter = useNav((s) => s.stack[s.index - 1]?.name === "comptoir");

  const [queue, setQueue] = useState(tickets);
  const [index, setIndex] = useState(0);
  const ticket = queue[index] ?? queue[0]!;
  const def = ticketById(ticket.type) as TicketDef;
  const theme = themeOf(def.id);
  const house = ticket.house === true;
  const tier = tierOf(ticket.gain, def.price, house);

  const [rafale, setRafale] = useState(startRafale);
  const [phase, setPhase] = useState<Phase>(() => (needsPick(def) && !startRafale ? "choix" : "sortie"));
  const [pick, setPick] = useState<string | undefined>(() =>
    needsPick(def) ? resolvePick(def, useGame.getState().settings.signes[def.id]) : undefined);
  const [cells, setCells] = useState<ReadonlySet<string>>(() => new Set());
  const [panel, setPanel] = useState(0);
  const [auto, setAuto] = useState(false);        // « Tout gratter » est en cours
  const [gone, setGone] = useState(false);        // le ticket a quitté l'écran
  const [busy, setBusy] = useState(false);
  const [skippable, setSkippable] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  // Le tout premier ticket d'un compte, pas encore gratté : le doigt fantôme montre le geste,
  // et Piou encourage. L'un et l'autre s'en vont dès que le joueur s'y met.
  const [first] = useState(() => (player?.stats.tickets ?? 9) <= 1 && (player?.stats.winners ?? 1) === 0 && !startRafale);
  const [ghost, setGhost] = useState(first);
  const [encourage, setEncourage] = useState(first);
  const [ghostAt, setGhostAt] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [totals, setTotals] = useState({ count: 0, winners: 0, gain: 0 });

  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const layer = useRef<ScratchHandle>(null);
  const fxCanvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<Fx | null>(null);
  const finished = useRef(false);
  const sweeping = useRef(false);
  const alive = useRef(true);
  const resultMs = useRef(800);
  const seenMatches = useRef(0);
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const rafaleRef = useRef(rafale);
  rafaleRef.current = rafale;

  const reserve = useReserve(scene, phase !== "choix");
  const width = useTicketWidth(def, reserve);
  const layout = useMemo(() => buildLayout(def, ticket.gain, ticket.seed, pick), [def, ticket, pick]);
  const ids = useMemo(() => cellIds(layout), [layout]);
  const multi = layout.engine === "multi";

  // --- Le canvas d'effets : copeaux, pièces, confettis. Libéré en quittant l'écran.
  useEffect(() => {
    alive.current = true;
    const f = fxCanvas.current ? new Fx(fxCanvas.current) : null;
    fx.current = f;
    const onResize = () => f?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      alive.current = false;
      window.removeEventListener("resize", onResize);
      f?.destroy();
      fx.current = null;
      scratchEnd();
      // En quittant l'écran de grattage, les tickets grattés sont déclarés.
      void flushAck();
    };
  }, []);

  useEffect(() => {
    if (fx.current) fx.current.calm = calm;
  }, [calm]);

  // --- Met un ticket à l'écran.
  const start = useCallback((q: PendingTicket[], i: number) => {
    const d = ticketById(q[i]!.type)!;
    const asks = needsPick(d);
    finished.current = false;
    seenMatches.current = 0;
    setEncourage(false);
    setQueue(q);
    setIndex(i);
    setCells(new Set());
    setPanel(0);
    setAuto(false);
    setGone(false);
    setSkippable(false);
    setAnnounce("");
    setPick(asks ? resolvePick(d, useGame.getState().settings.signes[d.id]) : undefined);
    setPhase(asks && !rafaleRef.current ? "choix" : "sortie");
  }, []);

  // --- Sortie du distributeur, puis grattage.
  useEffect(() => {
    if (phase !== "sortie") return;
    const timer = window.setTimeout(() => setPhase("gratte"), calm ? 200 : rafale ? 240 : 600);
    return () => window.clearTimeout(timer);
  }, [phase, calm, rafale, index, queue]);

  // --- Les correspondances tintent dès que leurs cases sont visibles.
  useEffect(() => {
    const count = matches(layout, cells).length;
    if (phase === "gratte" && count > seenMatches.current) playMatch();
    seenMatches.current = count;
  }, [layout, cells, phase]);

  // --- Le résultat et sa fête.
  const finish = useCallback(() => {
    if (finished.current || !alive.current) return;
    finished.current = true;
    const big = TIER_RANK[tier] >= TIER_RANK.gros;
    // Un gain de palier « gros » ou supérieur arrête la rafale pour laisser la fête se jouer.
    const quick = rafaleRef.current && !big;
    if (rafaleRef.current && big) setRafale(false);
    const duration = quick ? 420 : calm ? Math.min(TIER_DURATION[tier], 900) : TIER_DURATION[tier];
    setEncourage(false);
    setPhase("resultat");
    // « Trouvé par terre » est imprimé sur le ticket : l'annonce ne le répète pas.
    setAnnounce(resultText(tier, ticket.gain));
    setTotals((sum) => ({ count: sum.count + 1, winners: sum.winners + (ticket.gain > 0 ? 1 : 0), gain: sum.gain + ticket.gain }));
    // Le ticket rejoint `grattouille.revealed` : la bourse compte jusqu'à sa nouvelle valeur.
    markRevealed(ticket.id, quick ? 300 : TIER_DURATION[tier]);
    playTier(tier);
    haptic.tier(tier);
    if (ticket.gain > 0) window.setTimeout(playStamp, 120);

    const f = fx.current;
    if (f && !calm) {
      const from = centerOf(root.current);
      const to = centerOf(document.querySelector("[data-bourse]"));
      if (quick) {
        if (ticket.gain > 0) f.coinsTo(from, to, 3, 0.6);
      } else if (tier === "rembourse") f.coinsTo(from, to, 3, 0.6);
      else if (tier === "petit") f.coinsTo(from, to, 6, 1);
      else if (tier === "joli") f.coinsTo(from, to, 14, 1.7);
      else if (tier === "gros") f.coinsTo(from, to, 24, 2.2);
      else if (tier === "enorme") {
        f.coinRain(42, 2000);
        f.confetti(80, 2000);
      } else if (tier === "jackpot") {
        f.coinRain(64, 3000);
        f.confetti(130, 3000);
      }
    }
    // Un toucher passe la fête du jackpot après 1 s.
    if (tier === "jackpot" && !quick) window.setTimeout(() => alive.current && setSkippable(true), 1000);
    resultMs.current = duration;
  }, [tier, calm, ticket]);

  // --- La fête dure le temps de son palier, puis l'écran propose la suite.
  useEffect(() => {
    if (phase !== "resultat") return;
    const timer = window.setTimeout(() => setPhase("apres"), resultMs.current);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // --- Volet suivant du ticket multiple, puis fin du grattage.
  useEffect(() => {
    if (phase !== "gratte") return;
    if (multi) {
      const current = panelCellIds(layout, panel);
      if (current.every((id) => cells.has(id)) && panel < PANEL_COUNT - 1) {
        // Le ticket passe seul au volet suivant quand le volet courant est entièrement gratté.
        const timer = window.setTimeout(() => setPanel((p) => (p === panel ? panel + 1 : p)), auto || rafale ? 160 : 520);
        return () => window.clearTimeout(timer);
      }
    }
    if (ids.length > 0 && ids.every((id) => cells.has(id))) {
      // Le temps que la dernière encre finisse de se dissoudre.
      const timer = window.setTimeout(finish, calm || rafale ? 60 : 260);
      return () => window.clearTimeout(timer);
    }
  }, [cells, phase, panel, multi, layout, ids, auto, rafale, calm, finish]);

  // --- « Tout gratter » : aussi l'alternative d'accessibilité au geste.
  const sweep = useCallback(async (total: number) => {
    if (sweeping.current) return;
    sweeping.current = true;
    setAuto(true);
    setGhost(false);
    try {
      const began = performance.now();
      while (alive.current && performance.now() - began < 12_000) {
        await nextFrame();
        // Tant qu'il reste des cases sur le volet affiché, on les balaie.
        if ((layer.current?.remaining().length ?? 0) > 0) {
          await layer.current?.sweep(total);
          continue;
        }
        if (!multi || panelRef.current >= PANEL_COUNT - 1) break;
        // Volet terminé : on attend que le suivant soit à l'écran.
        const from = panelRef.current;
        const t0 = performance.now();
        while (alive.current && panelRef.current === from && performance.now() - t0 < 1500) await nextFrame();
        if (panelRef.current === from) break;
      }
    } finally {
      sweeping.current = false;
    }
  }, [multi]);

  // --- Rafale : chaque ticket se gratte tout seul en 1,2 s environ.
  useEffect(() => {
    if (!rafale) return;
    if (phase === "gratte") {
      void sweep(multi ? 420 : 620);
      return;
    }
    if (phase === "apres") {
      if (index + 1 < queue.length) {
        const timer = window.setTimeout(() => start(queue, index + 1), 140);
        return () => window.clearTimeout(timer);
      }
      setRafale(false); // fin du carnet : le récapitulatif s'affiche
    }
  }, [rafale, phase, index, queue, multi, sweep, start]);

  // --- Le ticket quitte l'écran : froissé s'il a perdu, vers la bourse s'il a gagné.
  useEffect(() => {
    if (phase !== "apres") return;
    const timer = window.setTimeout(() => setGone(true), calm ? 200 : 400);
    return () => window.clearTimeout(timer);
  }, [phase, calm, index, queue]);

  // --- Le doigt fantôme montre le geste sur la première case.
  useEffect(() => {
    if (!ghost || phase !== "gratte") {
      setGhostAt(null);
      return;
    }
    const cell = root.current?.querySelector<HTMLElement>("[data-case]");
    const box = scene.current?.getBoundingClientRect();
    const r = cell?.getBoundingClientRect();
    if (r && box) setGhostAt({ x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height });
  }, [ghost, phase, width]);

  const onReveal = useCallback((id: string) => {
    setGhost(false);
    setEncourage(false);
    setCells((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const skip = () => {
    if (phase === "resultat" && skippable) setPhase("apres");
  };

  const rebuy = async () => {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    const sold = await buyTickets(def.id, 1);
    if (sold && alive.current) {
      await atLeast(t0, 500);
      playTicketBought();
      haptic.buy();
      setTotals({ count: 0, winners: 0, gain: 0 });
      // Le nouveau ticket sort du distributeur à la place de l'ancien.
      start(sold, 0);
    }
    if (alive.current) setBusy(false);
  };

  if (!player) return null;
  const place = placeById(def.place);
  const host = place.host as Speaker;
  const last = index + 1 >= queue.length;
  const carnet = queue.length > 1;
  const canRebuy = !house && online && isPlaceOpen(def.place, player.standing) && balance >= def.price;
  const etat = phase === "resultat" || phase === "apres" ? (ticket.gain > 0 ? "gagnant" : "perdu") : "neuf";
  const showTicket = phase !== "choix" && !gone;
  const fete = phase === "resultat" && !rafale;
  const plein = fete && fullScreen(tier);
  // L'hôte réagit une fois, quand le ticket est payé : à la mesure du gain, et pour un
  // gros gain même au milieu d'un carnet.
  let reaction: Line | null = null;
  if (phase === "apres" && !rafale) {
    if (TIER_RANK[tier] >= TIER_RANK.gros) reaction = lineFor(player, host, tier === "jackpot" ? "jackpot" : "gros", seed + index);
    else if (!carnet) reaction = lineFor(player, host, ticket.gain > 0 ? "gagne" : "perdu", seed + index);
  }
  // Le récapitulatif vaut pour un carnet comme pour une pile de tickets dépareillés.
  const recap = totals.winners === 0
    ? t("{n} tickets : aucun gagnant", { n: totals.count })
    : totals.winners > 1
      ? t("{n} tickets : {gagnants} gagnants", { n: totals.count, gagnants: totals.winners })
      : t("{n} tickets : 1 gagnant", { n: totals.count });
  const pause = () => setRafale(false);

  return (
    <main className={cx("ecran grattage", rafale && "grattage--rafale", plein && tier === "jackpot" && "grattage--or")}>
      <HorsLigne />
      {/* Le ticket porte déjà son nom : l'en-tête ne le dit qu'aux lecteurs d'écran. Dans un carnet, il compte les tickets. */}
      <Entete
        titre={carnet ? t("Ticket {n} sur {total}", { n: index + 1, total: queue.length }) : ticketName(def.id)}
        titreDiscret
        retour
        gauche={carnet ? <span className="grattage__compte chiffres" aria-hidden="true">{index + 1}/{queue.length}</span> : undefined}
        droite={<Bourse />}
      />
      <p className="invisible" role="status" aria-live="polite">{announce}</p>

      {/* En rafale, toucher la scène met en pause : le bouton du plateau le dit et le fait aussi. */}
      <div
        className={cx("grattage__scene", phase === "choix" && "grattage__scene--choix")}
        ref={scene}
        onClick={rafale ? pause : undefined}
      >
        <span className="distributeur" aria-hidden="true" />

        {phase === "choix" && (
          <Roue
            def={def}
            pick={pick ?? ""}
            onPick={setPick}
            onGo={() => {
              if (pick) rememberSign(def.id, pick);
              setPhase("sortie");
            }}
          />
        )}

        {showTicket && (
          <div
            key={ticket.id}
            className={cx(
              "grattage__ticket",
              phase === "sortie" && "grattage__ticket--sort",
              phase === "apres" && (ticket.gain > 0 ? "grattage__ticket--paye" : "grattage__ticket--froisse"),
              phase === "resultat" && TIER_RANK[tier] >= TIER_RANK.gros && "grattage__ticket--rayons",
            )}
          >
            <Ticket
              def={def}
              layout={layout}
              seed={ticket.seed}
              revealed={cells}
              width={width}
              etat={etat}
              house={house}
              panel={panel}
              onPanel={phase === "gratte" && !auto ? setPanel : undefined}
              rootRef={root}
            >
              {phase === "gratte" && (
                <ScratchLayer
                  ref={layer}
                  root={root}
                  ink={theme.encre}
                  fx={fx}
                  revealed={cells}
                  calm={calm}
                  enabled={!auto && !rafale}
                  layoutKey={`${ticket.id}:${panel}:${width}`}
                  onReveal={onReveal}
                  onFirstTouch={() => setGhost(false)}
                />
              )}
            </Ticket>
          </div>
        )}

        {ghostAt && (
          <span
            className="doigt"
            style={{ left: ghostAt.x, top: ghostAt.y, width: ghostAt.w, height: ghostAt.h }}
            aria-hidden="true"
          >
            <Icon name="doigt" plein size={44} />
          </span>
        )}

        {/* Le ticket est parti : le résultat prend sa place au milieu de la scène, et l'hôte réagit.
            Rien ne s'affiche ici tant que le ticket sort : aucun texte ne le croise. */}
        {gone && phase === "apres" && !rafale && (
          <div className="bilan">
            {carnet && last ? (
              // Dernier ticket : le compte des gagnants et le total, à la place du dernier résultat.
              <p className="resultat resultat--carnet">
                <span className="resultat__mot">{recap}</span>
                <span className="resultat__montant">{formatEuros(totals.gain)}</span>
              </p>
            ) : (
              <Resultat tier={tier} gain={ticket.gain} />
            )}
            <Bulle line={reaction} />
          </div>
        )}
      </div>

      {/* Le plateau : les boutons, puis le résultat, à la même place et jamais sur le ticket. */}
      {phase !== "choix" && (
        <div className={cx("grattage__plateau", fete && "grattage__plateau--resultat")}>
          {rafale ? (
            <button type="button" className="grattage__pause" onClick={pause}>
              <span className="grattage__total">
                <span>{t("Total")}</span>
                <strong className="chiffres">{formatEuros(totals.gain)}</strong>
              </span>
              <span>{t("Touche l'écran pour mettre en pause")}</span>
            </button>
          ) : phase === "resultat" ? (
            !plein && <Resultat tier={tier} gain={ticket.gain} />
          ) : phase === "apres" ? (
            last ? (
              <>
                {canRebuy ? (
                  <Bouton bloc attente={busy} onClick={() => void rebuy()}>
                    {t("Racheter le même {prix}", { prix: formatEuros(def.price) })}
                  </Bouton>
                ) : (
                  <Bouton bloc onClick={() => nav.back()}>{fromCounter ? t("Retour au comptoir") : t("Continuer")}</Bouton>
                )}
                {canRebuy && (
                  <Bouton variante="secondaire" bloc disabled={busy} onClick={() => nav.back()}>
                    {fromCounter ? t("Changer de ticket") : t("Continuer")}
                  </Bouton>
                )}
              </>
            ) : (
              <>
                <Bouton bloc onClick={() => start(queue, index + 1)}>{t("Ticket suivant")}</Bouton>
                <Bouton variante="secondaire" bloc onClick={() => setRafale(true)}>{t("Gratter en rafale")}</Bouton>
              </>
            )
          ) : (
            <>
              <Bouton bloc disabled={phase !== "gratte" || auto} onClick={() => void sweep(900)}>{t("Tout gratter")}</Bouton>
              {carnet && index >= 1 && (
                <Bouton variante="secondaire" bloc disabled={phase !== "gratte" || auto} onClick={() => setRafale(true)}>
                  {t("Gratter en rafale")}
                </Bouton>
              )}
              {/* Premier grattage : Piou encourage, dans la bande libre sous le bouton. Il se tait à la première case grattée. */}
              {encourage && (
                <BulleLibre pnj="piou" nom={hostName("piou")} nomDiscret className="grattage__piou">{PIOU.premierTicket}</BulleLibre>
              )}
            </>
          )}
        </div>
      )}

      {/* Énorme et jackpot : la fête prend tout l'écran, sur un fond opaque. La bourse reste dessus, et compte. */}
      {plein && <Fete tier={tier} gain={ticket.gain} skippable={skippable} onSkip={skip} />}

      {/* Le canvas d'effets, tout en haut : copeaux, pièces, confettis. */}
      <canvas ref={fxCanvas} className="grattage__fx" aria-hidden="true" />
    </main>
  );
}
