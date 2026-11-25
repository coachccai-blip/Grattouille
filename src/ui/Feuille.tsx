// Feuille (BRIEF.md, section 13.5) : panneau ivoire qui monte du bas, avec une
// poignée. Se ferme en glissant vers le bas, en touchant le voile, ou au clavier.

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
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
    panel.current.style.transition = "";
    panel.current.style.transform = "";
    // Glissée vers le bas, ou simplement touchée : la feuille se ferme. (La poignée
    // capture le pointeur pour suivre le doigt : le clic du bouton n'arriverait pas.)
    if (e.type === "pointerup" && (dy > 80 || Math.abs(dy) < 8)) onClose();
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
          <button
            type="button"
            className="feuille__fermer"
            aria-label="Fermer"
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
