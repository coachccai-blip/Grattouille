// Le canvas d'encre posé sur un ticket, et le pont entre React et le moteur de
// grattage (BRIEF.md, section 8.2). Aucune mise à jour d'état pendant le geste :
// React n'est prévenu qu'à la révélation d'une case.

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type RefObject } from "react";
import type { Fx } from "../fx/particles";
import type { InkKind } from "./ink";
import { ScratchSurface } from "./surface";

export interface ScratchHandle {
  /** « Tout gratter » : gratte toutes les cases restantes, en `total` millisecondes. */
  sweep: (total?: number) => Promise<void>;
  /** Les cases présentes et pas encore révélées. */
  remaining: () => string[];
}

interface Props {
  /** L'élément du ticket : ses [data-case] sont les cases à gratter. */
  root: RefObject<HTMLElement | null>;
  ink: InkKind;
  fx: RefObject<Fx | null>;
  revealed: ReadonlySet<string>;
  calm: boolean;
  enabled: boolean;
  /** Change quand la grille affichée change (volets du ticket multiple) : l'encre est repeinte. */
  layoutKey: string;
  onReveal: (id: string) => void;
  onFirstTouch?: () => void;
}

export const ScratchLayer = forwardRef<ScratchHandle, Props>(function ScratchLayer(
  { root, ink, fx, revealed, calm, enabled, layoutKey, onReveal, onFirstTouch },
  ref,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const surface = useRef<ScratchSurface | null>(null);
  // Les rappels changent à chaque rendu : le moteur lit toujours les derniers.
  const callbacks = useRef({ onReveal, onFirstTouch });
  callbacks.current = { onReveal, onFirstTouch };
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  useLayoutEffect(() => {
    const el = root.current;
    const c = canvas.current;
    if (!el || !c) return;
    const s = new ScratchSurface({
      root: el,
      canvas: c,
      ink,
      fx: fx.current,
      revealed: revealedRef.current,
      calm,
      onReveal: (id) => callbacks.current.onReveal(id),
      onFirstTouch: () => callbacks.current.onFirstTouch?.(),
    });
    surface.current = s;
    // L'encre est peinte : l'encre provisoire en CSS peut s'effacer.
    el.dataset.encre = "canvas";

    // La police du motif et la taille du ticket peuvent arriver après le premier rendu.
    let raf = 0;
    let first = true;
    const relayout = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => s.layout());
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      relayout();
    }) : null;
    observer?.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      delete el.dataset.encre;
      s.destroy();
      surface.current = null;
    };
    // Un nouveau ticket monte un nouveau calque : ces valeurs ne changent pas en cours de vie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, ink]);

  // Changement de volet : nouvelles cases, nouvelle encre.
  const firstKey = useRef(layoutKey);
  useLayoutEffect(() => {
    if (firstKey.current === layoutKey) return;
    firstKey.current = layoutKey;
    surface.current?.layout();
  }, [layoutKey]);

  useEffect(() => {
    if (surface.current) {
      surface.current.calm = calm;
      surface.current.enabled = enabled;
    }
  }, [calm, enabled]);

  useImperativeHandle(ref, () => ({
    sweep: (total) => surface.current?.sweepAll(total) ?? Promise.resolve(),
    remaining: () => surface.current?.remaining() ?? [],
  }), []);

  // Le canvas d'encre est masqué aux lecteurs d'écran : « Tout gratter » est l'alternative au geste.
  return <canvas ref={canvas} className="ticket__encre" aria-hidden="true" />;
});
