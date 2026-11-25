// Pièces communes aux tickets : la case à gratter, le montant qui se resserre pour
// tenir dans sa case, les correspondances (BRIEF.md, sections 7.2 et 8.3).

import { createContext, useContext, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { formatEuros } from "../../shared/format";
import { cellClip, type CellShape } from "../scratch/ink";
import type { TicketTheme } from "./themes";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export interface TicketContextValue {
  /** Largeur du ticket en pixels : les textes ajustés se recalculent quand elle change. */
  width: number;
  /** Miniature du comptoir : pas de texte ajusté, pas de taille minimale. */
  mini: boolean;
  theme: TicketTheme;
}

export const TicketContext = createContext<TicketContextValue | null>(null);

export function useTicket(): TicketContextValue {
  const value = useContext(TicketContext);
  if (!value) throw new Error("TicketContext manquant");
  return value;
}

/**
 * Un texte sur une ligne qui se resserre en largeur quand il déborde, comme les
 * montants imprimés en caractères étroits sur un vrai ticket. La hauteur des
 * lettres ne change pas : rien ne passe sous 12 px.
 */
export function Ajuste({ children, className }: { children: ReactNode; className?: string }) {
  const { width, mini } = useTicket();
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    el.style.transform = "";
    if (mini) return;
    const available = box.clientWidth;
    const needed = el.scrollWidth;
    if (available > 0 && needed > available) el.style.transform = `scaleX(${Math.max(0.58, available / needed).toFixed(3)})`;
  }, [width, mini, children]);
  return (
    <span className={cx("ajuste", className)}>
      <span ref={ref} className="ajuste__texte">{children}</span>
    </span>
  );
}

export function Montant({ value, className }: { value: number; className?: string }) {
  return <Ajuste className={cx("montant", className)}>{formatEuros(value)}</Ajuste>;
}

interface CaseProps {
  /** Identifiant de la case : c'est lui que le moteur de grattage rend à la révélation. */
  id: string;
  forme?: CellShape;
  /** La case est révélée. */
  vue: boolean;
  /** La case fait partie d'une correspondance visible. */
  touche?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Une case à gratter. Son contenu est sous l'encre : il n'est exposé aux lecteurs
 * d'écran qu'une fois révélé. `case__encre` est l'encre provisoire en CSS, visible
 * tant que le canvas n'a pas peint la sienne (et sur les miniatures).
 */
export function Case({ id, forme = "rect", vue, touche = false, className, style, children }: CaseProps) {
  const clip = cellClip(forme);
  return (
    <div
      className={cx("case", `case--${forme}`, vue && "case--vue", touche && "case--touche", className)}
      data-case={id}
      data-forme={forme}
      style={style}
    >
      <div className="case__fond" style={clip ? { clipPath: clip } : undefined} aria-hidden={!vue}>
        {children}
      </div>
      <span className="case__encre" style={clip ? { clipPath: clip } : undefined} aria-hidden="true" />
    </div>
  );
}

/** Préfixe les identifiants des cases d'un volet du ticket multiple. */
export function prefixed(prefix: string | undefined, id: string): string {
  return prefix ? `${prefix}${id}` : id;
}
