// Pièces communes aux tickets : la case à gratter, le montant qui se resserre pour
// tenir dans sa case, les correspondances (BRIEF.md, sections 7.2 et 8.3).

import { createContext, useCallback, useContext, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { formatEuros, splitAmount } from "../../shared/format";
import { cellClip, type CellShape } from "../scratch/ink";
import type { TicketTheme } from "./themes";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export interface TicketContextValue {
  /** Largeur du ticket en pixels : les textes ajustés se recalculent quand elle change. */
  width: number;
  /** Miniature du comptoir : pas de taille minimale des textes, ni règle ni numéro de série. */
  mini: boolean;
  /** Ticket étroit (petit écran) : l'accessoire s'efface pour laisser la place au jeu. */
  serre: boolean;
  theme: TicketTheme;
}

export const TicketContext = createContext<TicketContextValue | null>(null);

export function useTicket(): TicketContextValue {
  const value = useContext(TicketContext);
  if (!value) throw new Error("TicketContext manquant");
  return value;
}

// Un texte ajusté se remesure chaque fois que sa boîte ou lui-même change de taille :
// une police qui arrive après le premier rendu, une ligne qui passe en gras, un volet
// qui change, un écran qui tourne. Un seul observateur pour tous les textes ajustés.
const fitters = new WeakMap<Element, () => void>();
const sizes = typeof ResizeObserver === "undefined"
  ? null
  : new ResizeObserver((entries) => {
    for (const entry of entries) fitters.get(entry.target)?.();
  });

/**
 * Le resserrement le plus fort : un dernier recours, pour qu'aucun texte ne soit
 * jamais coupé. Les cases sont dessinées pour que l'on en reste loin (0,8 au pire
 * sur l'écran de référence).
 */
const SERRE_MIN = 0.58;

/**
 * Un texte sur une ligne qui se resserre en largeur quand il déborde, comme les
 * montants imprimés en caractères étroits sur un vrai ticket. La hauteur des
 * lettres ne change pas : rien ne passe sous 12 px.
 */
export function Ajuste({ children, className }: { children: ReactNode; className?: string }) {
  const { width, mini } = useTicket();
  const ref = useRef<HTMLSpanElement>(null);
  /** Le resserrement déjà posé sur le texte : 1 s'il n'y en a pas. */
  const applied = useRef(1);
  const fit = useCallback(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    // Mesures au dixième de pixel : à un demi-pixel près, un texte « qui tient » est
    // coupé. Le rapport des deux largeurs ne dépend pas des transformations des parents
    // (une case qui rebondit, une miniature réduite) ; celle du texte lui-même est connue.
    const available = box.getBoundingClientRect().width;
    const needed = el.getBoundingClientRect().width / applied.current;
    if (available > 0 && needed > available - 0.25) {
      const scale = Number(Math.max(SERRE_MIN, (available - 0.25) / needed).toFixed(3));
      // Un texte qui déborde part toujours du bord gauche de sa boîte, quel que soit
      // son alignement : c'est de là qu'il se resserre, sinon sa fin serait coupée.
      el.style.transformOrigin = "left center";
      el.style.transform = `scaleX(${scale})`;
      applied.current = scale;
    } else {
      el.style.transformOrigin = "";
      el.style.transform = "";
      applied.current = 1;
    }
  }, []);
  // Avant que l'écran ne soit peint : jamais d'image avec un texte qui déborde.
  useLayoutEffect(fit, [fit, width, mini, children]);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box || !sizes) return;
    fitters.set(el, fit);
    fitters.set(box, fit);
    sizes.observe(el);
    sizes.observe(box);
    return () => {
      sizes.unobserve(el);
      sizes.unobserve(box);
      fitters.delete(el);
      fitters.delete(box);
    };
  }, [fit]);
  return (
    <span className={cx("ajuste", className)}>
      <span ref={ref} className="ajuste__texte">{children}</span>
    </span>
  );
}

export function Montant({ value, className }: { value: number; className?: string }) {
  return <Ajuste className={cx("montant", className)}>{formatEuros(value)}</Ajuste>;
}

/**
 * Un montant qui passe sur deux lignes quand il est trop long pour sa case : le
 * nombre au-dessus, l'unité en dessous (« 12,5 » puis « Md€ », « €5,000 » puis « T »).
 * Un montant en euros simples reste sur une ligne et se resserre : un « € » seul sur
 * sa ligne ne ressemble à rien.
 * `max` : le nombre de caractères qui tiennent sur une ligne. `empile` : détache aussi
 * l'unité d'un montant court quand elle fait plusieurs lettres (« 2 » puis « M€ »),
 * pour qu'une série de cases voisines se lise d'un seul coup d'œil.
 */
export function MontantEmpile(
  { value, max, empile = false, className }: { value: number; max: number; empile?: boolean; className?: string },
) {
  const text = formatEuros(value);
  const cut = splitAmount(text);
  const stacked = cut !== null && cut[1] !== "€" && (text.length > max || (empile && cut[1].length > 1));
  if (!stacked) return <Ajuste className={cx("montant", className)}>{text}</Ajuste>;
  return (
    <span className={cx("montant montant--empile", className)}>
      <Ajuste className="montant__nombre">{cut[0]}</Ajuste>
      <Ajuste className="montant__unite">{cut[1]}</Ajuste>
    </span>
  );
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
