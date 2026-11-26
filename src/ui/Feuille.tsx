// Feuille (BRIEF.md, section 13.5) : panneau ivoire qui monte du bas, avec une
// poignée. Se ferme en glissant vers le bas, en touchant le voile, ou au clavier.
// Elle monte sur un glissé montant, et redescend sur un glissé descendant : sa sortie
// est jouée par un fantôme (src/app/transitions.ts), une fois la feuille démontée.

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { playSheet } from "../fx/audio";
import { t } from "../i18n";
import "./feuille.css";

interface FeuilleProps {
  /** Nom de la feuille, lu par les lecteurs d'écran. */
  titre: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Feuille({ titre, onClose, children, className }: FeuilleProps) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; id: number } | null>(null);

  // Le son de la feuille : à l'ouverture, puis à la fermeture, d'où qu'elle vienne
  // (la poignée, le voile, le bouton retour du téléphone).
  useEffect(() => {
    playSheet(true);
    return () => playSheet(false);
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { y: e.clientY, id: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Sans capture, le glissé s'arrête au bord de la poignée.
    }
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId || !panel.current) return;
    const dy = Math.max(0, e.clientY - drag.current.y);
    panel.current.style.transition = "none";
    panel.current.style.transform = `translate(-50%, ${dy}px)`;
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId || !panel.current) return;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    const el = panel.current;
    // Glissée vers le bas, ou simplement touchée : la feuille se ferme. (La poignée
    // capture le pointeur pour suivre le doigt : le clic du bouton n'arriverait pas.)
    if (e.type === "pointerup" && (dy > 80 || Math.abs(dy) < 8)) {
      // Elle reste où le doigt l'a laissée : c'est de là qu'elle finit de descendre.
      onClose();
      // Si rien ne l'a refermée (ce qui n'arrive pas), elle reprend sa place.
      window.setTimeout(() => {
        if (!el.isConnected) return;
        el.style.transition = "";
        el.style.transform = "";
      }, 600);
      return;
    }
    el.style.transition = "";
    el.style.transform = "";
  };

  return (
    <>
      <div className="feuille__voile" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className={`feuille papier sur-papier ${className ?? ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        tabIndex={-1}
      >
        <div className="feuille__poignee" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          {/* Au clavier ou au lecteur d'écran (`detail` vaut 0), le bouton ferme directement. */}
          {/* Son propre son : le glissé de la feuille qui se referme, rien de plus. */}
          <button
            type="button"
            className="feuille__fermer"
            data-son="feuille"
            aria-label={t("Fermer")}
            onClick={(e) => {
              if (e.detail === 0) onClose();
            }}
          >
            <span aria-hidden="true" />
          </button>
        </div>
        <div className="feuille__corps">{children}</div>
      </div>
    </>
  );
}
