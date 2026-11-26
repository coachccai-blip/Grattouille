// Pièces communes aux tickets : la case à gratter, le montant qui se resserre pour
// tenir dans sa case, les correspondances (BRIEF.md, sections 7.2 et 8.3).

import {
  createContext, useContext, useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode,
} from "react";
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
  theme: TicketTheme;
}

export const TicketContext = createContext<TicketContextValue | null>(null);

export function useTicket(): TicketContextValue {
  const value = useContext(TicketContext);
  if (!value) throw new Error("TicketContext manquant");
  return value;
}

// Les polices arrivent parfois après le premier rendu : un texte mesuré avec la police
// de secours ne tient plus une fois la bonne police en place. Chaque arrivée de police
// fait donc remesurer les textes ajustés.
let fontsVersion = 0;
const fontsListeners = new Set<() => void>();

function fontsChanged(): void {
  fontsVersion++;
  for (const listener of fontsListeners) listener();
}

if (typeof document !== "undefined" && "fonts" in document) {
  document.fonts.addEventListener?.("loadingdone", fontsChanged);
  void document.fonts.ready.then(fontsChanged);
}

function subscribeFonts(listener: () => void): () => void {
  fontsListeners.add(listener);
  return () => {
    fontsListeners.delete(listener);
  };
}

function useFontsVersion(): number {
  return useSyncExternalStore(subscribeFonts, () => fontsVersion, () => 0);
}

/**
 * Le resserrement le plus fort : un dernier recours, pour qu'aucun texte ne soit
 * jamais coupé. Les cases sont dessinées pour que l'on en reste loin (0,8 au pire).
 */
const SERRE_MIN = 0.58;

/**
 * Un texte sur une ligne qui se resserre en largeur quand il déborde, comme les
 * montants imprimés en caractères étroits sur un vrai ticket. La hauteur des
 * lettres ne change pas : rien ne passe sous 12 px.
 */
export function Ajuste({ children, className }: { children: ReactNode; className?: string }) {
  const { width, mini } = useTicket();
  const fonts = useFontsVersion();
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    // Les deux largeurs sont celles de la mise en page : la transformation déjà posée
    // ne les change pas, on mesure donc sans rien remettre à zéro.
    const available = box.clientWidth;
    const needed = el.scrollWidth;
    if (available > 0 && needed > available) {
      // Un texte qui déborde part toujours du bord gauche de sa boîte, quel que soit
      // son alignement : c'est de là qu'il se resserre, sinon sa fin serait coupée.
      el.style.transformOrigin = "left center";
      el.style.transform = `scaleX(${Math.max(SERRE_MIN, available / needed).toFixed(3)})`;
    } else {
      el.style.transformOrigin = "";
      el.style.transform = "";
    }
  }, [width, mini, children, fonts]);
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
 * nombre au-dessus, l'unité en dessous (« 12,5 » puis « Md€ »). Un montant en euros
 * simples reste toujours sur une ligne : un « € » seul sur sa ligne ne ressemble à rien.
 * `max` : le nombre de caractères qui tiennent sur une ligne. `empile` : passe aussi
 * sur deux lignes tout montant dont l'unité est un mot à elle seule (« M€ », « Bn€ »).
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
