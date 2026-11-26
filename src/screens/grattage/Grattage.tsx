// L'écran de grattage (BRIEF.md, section 8), en plein écran, sans onglets.
//
// Vie d'un ticket à l'écran : choix du signe ou du camp (moteurs `etoile` et
// `camps`), sortie du distributeur, grattage, résultat et sa fête, puis la suite
// (racheter, suivant).
// Tout le grattage se passe sur l'appareil, sans réseau. Quand le résultat
// s'affiche, le ticket est noté comme gratté ; il sera déclaré au serveur avec la
// requête suivante, ou en quittant l'écran.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatEuros } from "../../../shared/format";
import { placeById } from "../../../shared/places";
import { TIER_DURATION, TIER_RANK, isPlaceOpen, tierOf, type Tier } from "../../../shared/rules";
import { ticketById } from "../../../shared/tickets";
import type { PendingTicket, TicketDef } from "../../../shared/types";
import type { Line, Speaker } from "../../app/dialogues";
import { atLeast, lineFor, nextFrame, pluriel } from "../../app/helpers";
import { nav } from "../../app/nav";
import { buyTickets, displayBalance, flushAck, isCalm, markRevealed, rememberSign, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { buildLayout, cellIds, matches, needsPick, resolvePick } from "../../engines";
import { PANEL_COUNT, panelCellIds } from "../../engines/multi";
import { playMatch, playStamp, playTicketBought, playTier, scratchEnd } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Fx, type Point } from "../../fx/particles";
import { ScratchLayer, type ScratchHandle } from "../../scratch/ScratchLayer";
import { Ticket, useTicketWidth } from "../../ticket/Ticket";
import { cx } from "../../ticket/parts";
import { themeOf } from "../../ticket/themes";
import { Bouton } from "../../ui/Bouton";
import { Bourse } from "../../ui/Bourse";
import { Bulle, Entete, HorsLigne } from "../../ui/Commun";
import { Fete } from "./Fete";
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

/** Ce que l'écran annonce quand le résultat tombe : un mot, en plus de la couleur et du son. */
function resultText(tier: Tier, gain: number): string {
  if (tier === "perdu") return "Rien cette fois.";
  if (tier === "rembourse") return "Remboursé.";
  return `Gagné ${formatEuros(gain)}`;
}

export function Grattage({ tickets, rafale: startRafale }: Props) {
  const player = useGame((s) => s.player);
  const calm = useGame(isCalm);
  const online = useGame((s) => s.online);
  const balance = useGame(displayBalance);

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
  // Le doigt fantôme : seulement pour le tout premier ticket d'un compte.
  const [ghost, setGhost] = useState(() => (player?.stats.tickets ?? 9) <= 1 && (player?.stats.winners ?? 1) === 0 && !startRafale);
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

  const width = useTicketWidth(def, 236);
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
    const t = window.setTimeout(() => setPhase("gratte"), calm ? 200 : rafale ? 240 : 600);
    return () => window.clearTimeout(t);
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
    setPhase("resultat");
    setAnnounce(house && ticket.gain > 0 ? `${resultText(tier, ticket.gain)}. Trouvé par terre.` : resultText(tier, ticket.gain));
    setTotals((t) => ({ count: t.count + 1, winners: t.winners + (ticket.gain > 0 ? 1 : 0), gain: t.gain + ticket.gain }));
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
  }, [tier, calm, house, ticket]);

  // --- La fête dure le temps de son palier, puis l'écran propose la suite.
  useEffect(() => {
    if (phase !== "resultat") return;
    const t = window.setTimeout(() => setPhase("apres"), resultMs.current);
    return () => window.clearTimeout(t);
  }, [phase]);

  // --- Volet suivant du ticket multiple, puis fin du grattage.
  useEffect(() => {
    if (phase !== "gratte") return;
    if (multi) {
      const current = panelCellIds(layout, panel);
      if (current.every((id) => cells.has(id)) && panel < PANEL_COUNT - 1) {
        // Le ticket passe seul au volet suivant quand le volet courant est entièrement gratté.
        const t = window.setTimeout(() => setPanel((p) => (p === panel ? panel + 1 : p)), auto || rafale ? 160 : 520);
        return () => window.clearTimeout(t);
      }
    }
    if (ids.length > 0 && ids.every((id) => cells.has(id))) {
      // Le temps que la dernière encre finisse de se dissoudre.
      const t = window.setTimeout(finish, calm || rafale ? 60 : 260);
      return () => window.clearTimeout(t);
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
        const t = window.setTimeout(() => start(queue, index + 1), 140);
        return () => window.clearTimeout(t);
      }
      setRafale(false); // fin du carnet : le récapitulatif s'affiche
    }
  }, [rafale, phase, index, queue, multi, sweep, start]);

  // --- Le ticket quitte l'écran : froissé s'il a perdu, vers la bourse s'il a gagné.
  useEffect(() => {
    if (phase !== "apres") return;
    const t = window.setTimeout(() => setGone(true), calm ? 200 : 400);
    return () => window.clearTimeout(t);
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
  let reaction: Line | null = null;
  if (phase === "resultat" && !rafale && TIER_RANK[tier] >= TIER_RANK.gros) {
    reaction = lineFor(player, host, tier === "jackpot" ? "jackpot" : "gros", seed + index);
  } else if (phase === "apres" && !rafale && !carnet) {
    reaction = lineFor(player, host, ticket.gain > 0 ? "gagne" : "perdu", seed + index);
  }

  return (
    <main className={cx("ecran grattage", rafale && "grattage--rafale")}>
      <HorsLigne />
      {/* Le ticket porte déjà son nom : l'en-tête ne le répète qu'aux lecteurs d'écran. */}
      <Entete titre={carnet ? `Ticket ${index + 1} sur ${queue.length}` : def.name} titreDiscret={!carnet} retour droite={<Bourse />} />
      <p className="invisible" role="status" aria-live="polite">{announce}</p>

      <div className={cx("grattage__scene", phase === "choix" && "grattage__scene--choix")} ref={scene}>
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

        {phase === "resultat" && !rafale && (
          <Fete tier={tier} gain={ticket.gain} house={house} reaction={reaction} skippable={skippable} onSkip={skip} />
        )}

        {gone && phase === "apres" && (
          <div className="bilan">
            <p className={cx("bilan__titre", ticket.gain > 0 && "bilan__titre--gain")}>{resultText(tier, ticket.gain)}</p>
            {house && <p className="bilan__mention">Trouvé par terre</p>}
            {carnet && last && (
              <p className="bilan__carnet">
                Carnet de {totals.count} : {totals.winners} {pluriel(totals.winners, "gagnant")}, {formatEuros(totals.gain)}
              </p>
            )}
            <Bulle line={reaction} />
          </div>
        )}

        {rafale && (
          <button type="button" className="grattage__pause" onClick={() => setRafale(false)}>
            <span>Total : <strong className="chiffres">{formatEuros(totals.gain)}</strong></span>
            <span>Touche l'écran pour mettre en pause</span>
          </button>
        )}
      </div>

      <div className="grattage__actions">
        {(phase === "sortie" || phase === "gratte") && !rafale && (
          <>
            <Bouton bloc disabled={phase !== "gratte" || auto} onClick={() => void sweep(900)}>Tout gratter</Bouton>
            {carnet && index >= 1 && (
              <Bouton variante="secondaire" bloc disabled={phase !== "gratte" || auto} onClick={() => setRafale(true)}>
                Gratter en rafale
              </Bouton>
            )}
          </>
        )}
        {phase === "apres" && !rafale && (
          last ? (
            <>
              {canRebuy ? (
                <Bouton bloc attente={busy} onClick={() => void rebuy()}>Racheter le même {formatEuros(def.price)}</Bouton>
              ) : (
                <Bouton bloc onClick={() => nav.back()}>Retour au comptoir</Bouton>
              )}
              {canRebuy && <Bouton variante="secondaire" bloc disabled={busy} onClick={() => nav.back()}>Changer de ticket</Bouton>}
            </>
          ) : (
            <>
              <Bouton bloc onClick={() => start(queue, index + 1)}>Ticket suivant</Bouton>
              <Bouton variante="secondaire" bloc onClick={() => { setRafale(true); }}>Gratter en rafale</Bouton>
            </>
          )
        )}
      </div>

      {/* Le canvas d'effets, tout en haut : copeaux, pièces, confettis. */}
      <canvas ref={fxCanvas} className="grattage__fx" aria-hidden="true" />
    </main>
  );
}
