// Le ticket (BRIEF.md, section 7.2). Miniature au comptoir, grand au grattage :
// c'est le même composant. Toutes ses dimensions sont en `em` : sa taille de police
// vaut un vingt-cinquième de sa largeur, il se met donc à l'échelle d'un bloc.
//
// De haut en bas : bandeau avec le nom et la pastille de prix, promesse, zone de
// jeu, règle en une phrase, talon détachable (perforation, numéro de série). C'est
// sur le talon qu'un ticket gagnant reçoit son tampon « Payé » : il ne recouvre rien.

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { maxGain } from "../../shared/economy";
import { formatEuros } from "../../shared/format";
import { serialOf } from "../../shared/rules";
import type { TicketDef } from "../../shared/types";
import { Illustration } from "../art/Illustration";
import { buildLayout, ruleOf, type Layout } from "../engines";
import { t } from "../i18n";
import { ticketName } from "../i18n/noms";
import { INKS } from "../scratch/ink";
import { TicketContext, cx } from "./parts";
import { isDark, themeOf } from "./themes";
import { EngineView } from "./views";
import "./ticket.css";

export type TicketEtat = "neuf" | "perdu" | "gagnant";

interface TicketProps {
  def: TicketDef;
  /** La grille. Absente : un spécimen, pour la miniature du comptoir. */
  layout?: Layout;
  /** La graine du ticket, d'où sort son numéro de série. */
  seed?: number;
  revealed?: ReadonlySet<string>;
  /** Largeur en pixels. */
  width: number;
  /** Miniature : décorative, sans taille minimale des textes, sans règle ni numéro de série. */
  mini?: boolean;
  etat?: TicketEtat;
  /** Ticket trouvé par terre : le ticket le dit, et lui seul. */
  house?: boolean;
  /** Volet affiché du ticket multiple. */
  panel?: number;
  onPanel?: (panel: number) => void;
  rootRef?: Ref<HTMLDivElement>;
  className?: string;
  /** Le canvas d'encre, posé par l'écran de grattage. */
  children?: ReactNode;
}

const NOTHING: ReadonlySet<string> = new Set();

/**
 * En dessous de cette largeur (un écran de 320 × 568), les textes sont à leur plancher
 * de 12 px sur un ticket bien plus petit qu'eux : la règle s'efface pour laisser sa
 * place au jeu. Elle reste à un geste, sur la fiche « règles et lots » du comptoir.
 */
const SERRE_SOUS = 212;
const guillocheCache = new Map<string, string>();

/** Guilloché : des ondes entrelacées, imprimées à 8 % d'opacité. */
function guilloche(color: string): string {
  const cached = guillocheCache.get(color);
  if (cached) return cached;
  const wave = "c8-10 16 10 24 0s16 10 24 0";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="1.2">` +
    `<path d="M0 6${wave}M0 18${wave}M0 30${wave}M0 42${wave}"/>` +
    `<path d="M0 12c8 10 16-10 24 0s16-10 24 0M0 24c8 10 16-10 24 0s16-10 24 0M0 36c8 10 16-10 24 0s16-10 24 0"/>` +
    `</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  guillocheCache.set(color, url);
  return url;
}

/** La hauteur d'un ticket pour une largeur donnée. */
export function ticketHeight(def: TicketDef, width: number): number {
  return themeOf(def.id).ratio === "9:16" ? (width * 16) / 9 : (width * 8) / 5;
}

export function Ticket({
  def, layout, seed = 0, revealed = NOTHING, width, mini = false, etat = "neuf", house = false,
  panel = 0, onPanel, rootRef, className, children,
}: TicketProps) {
  const theme = themeOf(def.id);
  const grid = useMemo(() => layout ?? buildLayout(def, 0, 1), [layout, def]);
  const ink = INKS[theme.encre];
  const name = ticketName(def.id);
  const style = {
    fontSize: `${width / 25}px`,
    "--tk-papier": theme.papier,
    "--tk-texte": theme.texte,
    "--tk-doux": theme.doux,
    "--tk-bandeau": theme.bandeau === "or" ? "var(--or)" : theme.bandeau,
    "--tk-bandeau-texte": theme.bandeauTexte,
    "--tk-zone": theme.zone,
    "--tk-zone-texte": theme.zoneTexte,
    "--tk-case": theme.caseFond,
    "--tk-case-texte": theme.caseTexte,
    "--tk-accent": theme.accent,
    // Le tampon : rose foncé sur un papier clair, rose clair sur un papier de nuit.
    "--tk-tampon": isDark(theme.papier) ? "var(--bougainvillier-clair)" : "var(--bougainvillier-fonce)",
    "--tk-encre": `linear-gradient(135deg, ${ink.stops[0]} 0%, ${ink.stops[1]} 40%, ${ink.stops[2]} 60%, ${ink.stops[3]} 100%)`,
    "--tk-guilloche": guilloche(theme.texte),
  } as CSSProperties;
  const serre = !mini && width < SERRE_SOUS;
  const context = useMemo(() => ({ width, mini, serre, theme }), [width, mini, serre, theme]);

  return (
    <TicketContext.Provider value={context}>
      <div
        ref={rootRef}
        className={cx(
          "ticket", theme.ratio === "9:16" && "ticket--9-16", mini && "ticket--mini", serre && "ticket--serre",
          etat !== "neuf" && `ticket--${etat}`, `ticket--${def.engine}`, className,
        )}
        style={style}
        data-ticket={def.id}
        aria-hidden={mini ? true : undefined}
      >
        <span className="ticket__ombre" aria-hidden="true" />
        <div className="ticket__papier">
          <header className="ticket__bandeau">
            {/* Un nom long (« Grand Prix de la Corniche ») s'écrit plus petit, sur deux lignes. */}
            <span className={cx("ticket__nom", name.length > 16 && "ticket__nom--long")}>{name}</span>
            <span className="ticket__prix">{formatEuros(def.price)}</span>
          </header>
          <div className="ticket__promesse">
            <span className="ticket__jusqua">
              {t("Jusqu'à {montant}", { montant: formatEuros(maxGain(def)) })}
              {house && <span className="ticket__offert">{t("Trouvé par terre")}</span>}
            </span>
            <span className="ticket__vignette">
              <Illustration id={`ticket:${def.id}`} />
            </span>
          </div>
          <div className="ticket__zone">
            <EngineView def={def} layout={grid} revealed={revealed} panel={panel} onPanel={mini ? undefined : onPanel} />
          </div>
          {/* La miniature n'a ni règle ni numéro : à sa taille, ce ne serait que du bruit. */}
          {!mini && !serre && <p className="ticket__regle">{ruleOf(def)}</p>}
          <footer className="ticket__talon">
            {!mini && <span className="ticket__serie">{serialOf(seed)}</span>}
          </footer>
        </div>
        {/* Le tampon tombe sur le talon, à côté du numéro de série : aucune case, aucun montant dessous. */}
        {etat === "gagnant" && (
          <span className="ticket__cachet" aria-hidden="true">
            <span className="ticket__tampon">{t("Payé")}</span>
          </span>
        )}
        {children}
      </div>
    </TicketContext.Provider>
  );
}

/**
 * La largeur d'un ticket à l'écran de grattage (section 7.2) : le plus petit de
 * (largeur d'écran − 32 px) et 420 px, avec une hauteur plafonnée à (hauteur
 * d'écran − `reserve`), en réduisant l'échelle si besoin.
 */
export function useTicketWidth(def: TicketDef, reserve = 230): number {
  const ratio = themeOf(def.id).ratio === "9:16" ? 16 / 9 : 8 / 5;
  const measure = () => {
    const vw = Math.min(window.innerWidth, 480);
    const vh = window.innerHeight;
    const byWidth = Math.min(vw - 32, 420);
    const byHeight = (vh - reserve) / ratio;
    return Math.max(200, Math.floor(Math.min(byWidth, byHeight)));
  };
  const [width, setWidth] = useState(measure);
  useEffect(() => {
    const update = () => setWidth(measure());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
    // `measure` ne dépend que du format du ticket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, reserve]);
  return width;
}
