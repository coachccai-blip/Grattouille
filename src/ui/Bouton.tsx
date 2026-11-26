// Boutons (BRIEF.md, section 13.5).
// Bouton principal : pilule mimosa, 56 px de haut, tranche de 4 px. Son texte dit ce
// qui va se passer : « Acheter 20 € ». Bouton secondaire : contour de 2 px, texte seul.
// États : enfoncé, désactivé, en attente (pièce qui tourne).
//
// Chaque bouton a son appui, du plus plein (principal) au plus léger (lien). Un bouton
// d'achat qu'on a de quoi payer porte un reflet qui passe (`reflet`).

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { playTap } from "../fx/audio";
import { cx } from "../ticket/parts";
import "./bouton.css";

interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "principal" | "secondaire" | "texte";
  /** En attente d'une réponse : la pièce tourne, le bouton ne répond plus. */
  attente?: boolean;
  /** Occupe toute la largeur. */
  bloc?: boolean;
  /** Un reflet passe sur le bouton : « tu as de quoi payer ». */
  reflet?: boolean;
  children: ReactNode;
}

export function Bouton({
  variante = "principal", attente = false, bloc = false, reflet = false, className, children, disabled,
  onPointerDown, onClick, type, ...rest
}: BoutonProps) {
  const off = disabled || attente;
  return (
    <button
      type={type ?? "button"}
      className={cx(
        "bouton", `bouton--${variante}`, attente && "bouton--attente", bloc && "bouton--bloc",
        reflet && !off && "bouton--reflet", className,
      )}
      disabled={off}
      aria-busy={attente || undefined}
      data-son="bouton"
      onPointerDown={(e) => {
        // Chaque geste obtient une réponse sonore en moins de 100 ms.
        if (!off) playTap(variante);
        onPointerDown?.(e);
      }}
      onClick={(e) => {
        // Au clavier ou au lecteur d'écran (`detail` vaut 0), il n'y a pas eu d'appui : le son part ici.
        if (e.detail === 0 && !off) playTap(variante);
        onClick?.(e);
      }}
      {...rest}
    >
      {attente && <span className="bouton__piece" aria-hidden="true" />}
      <span className="bouton__texte">{children}</span>
    </button>
  );
}

interface MaintenirProps {
  children: ReactNode;
  /** Appelé quand le bouton a été maintenu jusqu'au bout. */
  onConfirm: () => void;
  disabled?: boolean;
  attente?: boolean;
  /** Durée du maintien, en millisecondes. */
  duree?: number;
  bloc?: boolean;
  reflet?: boolean;
}

/**
 * « Maintenir pour acheter » : le bouton se remplit en 600 ms (section 9.2), pour
 * les achats qui dépassent la moitié du solde. Au clavier ou avec une technologie
 * d'assistance, une activation suffit : le maintien n'est pas un obstacle.
 */
export function BoutonMaintenir({
  children, onConfirm, disabled = false, attente = false, duree = 600, bloc = false, reflet = false,
}: MaintenirProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(0);
  const fired = useRef(false);

  const stop = () => {
    window.clearTimeout(timer.current);
    setHolding(false);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || attente) return;
    playTap("principal");
    fired.current = false;
    setHolding(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Sans capture, relâcher hors du bouton annule simplement.
    }
    timer.current = window.setTimeout(() => {
      fired.current = true;
      setHolding(false);
      onConfirm();
    }, duree);
  };

  return (
    <button
      type="button"
      className={cx(
        "bouton", "bouton--principal", "bouton--maintenir", holding && "bouton--tenu", attente && "bouton--attente",
        bloc && "bouton--bloc", reflet && !disabled && !attente && !holding && "bouton--reflet",
      )}
      disabled={disabled || attente}
      aria-busy={attente || undefined}
      style={{ "--duree": `${duree}ms` } as React.CSSProperties}
      data-son="bouton"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        // `detail` vaut 0 pour une activation au clavier ou par un lecteur d'écran.
        if (e.detail === 0 && !fired.current) {
          playTap("principal");
          onConfirm();
        }
      }}
    >
      <span className="bouton__jauge" aria-hidden="true" />
      {attente && <span className="bouton__piece" aria-hidden="true" />}
      <span className="bouton__texte">{children}</span>
    </button>
  );
}
