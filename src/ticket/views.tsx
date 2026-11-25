// Les vues des sept moteurs : ce qui est imprimé dans la zone de jeu d'un ticket
// (BRIEF.md, sections 7.3 à 7.9). Chaque vue lit une grille construite par
// src/engines et l'ensemble des cases déjà révélées ; elle ne décide de rien.

import type { ReactNode } from "react";
import type { TicketDef } from "../../shared/types";
import { Symbole } from "../art/Illustration";
import type { Layout } from "../engines";
import { optString, optStrings } from "../engines/common";
import { formatChrono, roundWon, type DuelLayout } from "../engines/duel";
import type { EtoileLayout } from "../engines/etoile";
import { cardOf, drawnVisible, type LignesLayout } from "../engines/lignes";
import { LINES, completeLines, type MorpionLayout } from "../engines/morpion";
import { PANEL_COUNT, PANEL_NAMES, panelCellIds, panelRevealed, type MultiLayout } from "../engines/multi";
import type { NumerosLayout } from "../engines/numeros";
import type { TrioLayout } from "../engines/trio";
import { palette } from "../engines/common";
import { Ajuste, Case, Montant, cx, prefixed, useTicket } from "./parts";
import { SYMBOL_NAMES, symbolKey } from "./themes";

interface ViewProps<L> {
  def: TicketDef;
  layout: L;
  revealed: ReadonlySet<string>;
  /** Préfixe des identifiants de cases : « p0: » pour le premier volet du ticket multiple. */
  prefix?: string;
}

// ---------------------------------------------------------------------------
// trio : trois identiques

function TrioView({ def, layout, revealed, prefix }: ViewProps<TrioLayout>) {
  const { theme } = useTicket();
  const symbols = optStrings(def.options, "symbols");
  const pal = palette(def);
  const mode = symbols.length > 0 ? "symboles" : "montants";
  // Les trois cases identiques, une fois toutes visibles.
  const counts = new Map<number, number[]>();
  layout.cells.forEach((a, i) => {
    if (!revealed.has(prefixed(prefix, `c${i}`))) return;
    counts.set(a, [...(counts.get(a) ?? []), i]);
  });
  const trio = [...counts.values()].find((list) => list.length >= 3) ?? null;
  const forme = prefix ? "rect" : theme.forme;
  return (
    <div className="jeu-trio">
      <div className="jeu-trio__grille">
        {layout.cells.map((amount, i) => {
          const id = prefixed(prefix, `c${i}`);
          const key = mode === "symboles" ? symbolKey(def.options.family, symbols[pal.indexOf(amount)] ?? "") : "";
          return (
            <Case key={id} id={id} forme={forme} vue={revealed.has(id)} touche={trio?.includes(i) ?? false}>
              {mode === "symboles" ? (
                <>
                  <Symbole cle={key} className="jeu__symbole" title={SYMBOL_NAMES[key]} />
                  <Montant value={amount} className="jeu__petit" />
                </>
              ) : (
                <Montant value={amount} className="jeu__gros" />
              )}
            </Case>
          );
        })}
        {trio && (
          // À la troisième case identique, un trait mimosa relie les trois.
          <svg className="jeu__trait" viewBox="0 0 3 3" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points={trio.slice(0, 3).map((i) => `${(i % 3) + 0.5},${Math.floor(i / 3) + 0.5}`).join(" ")}
              pathLength="1"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// numeros : numéros gagnants

function NumerosView({ layout, revealed, prefix }: ViewProps<NumerosLayout>) {
  const visibleWinners = new Set<number>();
  layout.winning.forEach((n, i) => {
    if (revealed.has(prefixed(prefix, `w${i}`))) visibleWinners.add(n);
  });
  return (
    <div className="jeu-numeros">
      <p className="jeu__titre">Numéros gagnants</p>
      <div className="jeu-numeros__gagnants">
        {layout.winning.map((n, i) => {
          const id = prefixed(prefix, `w${i}`);
          const hit = revealed.has(id) && layout.yours.some((y, k) => y.n === n && revealed.has(prefixed(prefix, `n${k}`)));
          return (
            <Case key={id} id={id} vue={revealed.has(id)} touche={hit}>
              <span className="jeu__numero jeu__numero--grand">{n}</span>
            </Case>
          );
        })}
      </div>
      <p className="jeu__titre">Tes numéros</p>
      <div className="jeu-numeros__grille" style={{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }}>
        {layout.yours.map((cell, i) => {
          const id = prefixed(prefix, `n${i}`);
          // Une case gagnante se cercle dès que son numéro et le numéro gagnant sont tous deux visibles.
          const hit = revealed.has(id) && visibleWinners.has(cell.n);
          return (
            <Case key={id} id={id} vue={revealed.has(id)} touche={hit}>
              <span className="jeu__numero">{cell.n}</span>
              <Montant value={cell.amount} className="jeu__petit" />
            </Case>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// morpion : trois alignés

function MorpionView({ def, layout, revealed }: ViewProps<MorpionLayout>) {
  const target = `morpion:${optString(def.options, "target", "truffe")}`;
  const other = `morpion:${optString(def.options, "other", "gland")}`;
  const done = completeLines(layout.grid).find((l) => LINES[l]!.every((c) => revealed.has(`g${c}`)));
  const line = done === undefined ? null : LINES[done]!;
  return (
    <div className="jeu-morpion">
      <div className="jeu-morpion__grille">
        {layout.grid.map((isTarget, i) => {
          const id = `g${i}`;
          const key = isTarget ? target : other;
          return (
            <Case key={id} id={id} vue={revealed.has(id)} touche={line?.includes(i) ?? false}>
              <Symbole cle={key} className="jeu__symbole jeu__symbole--grand" title={SYMBOL_NAMES[key]} />
            </Case>
          );
        })}
        {line && (
          // Un trait barre la ligne gagnante, comme au crayon.
          <svg className="jeu__trait jeu__trait--crayon" viewBox="0 0 3 3" preserveAspectRatio="none" aria-hidden="true">
            <line
              x1={(line[0] % 3) + 0.5 + ((line[0] % 3) - (line[2] % 3)) * 0.14}
              y1={Math.floor(line[0] / 3) + 0.5 + (Math.floor(line[0] / 3) - Math.floor(line[2] / 3)) * 0.14}
              x2={(line[2] % 3) + 0.5 + ((line[2] % 3) - (line[0] % 3)) * 0.14}
              y2={Math.floor(line[2] / 3) + 0.5 + (Math.floor(line[2] / 3) - Math.floor(line[0] / 3)) * 0.14}
              pathLength="1"
            />
          </svg>
        )}
      </div>
      <div className="jeu-morpion__lot">
        <span className="jeu__titre">Lot</span>
        <Case id="lot" vue={revealed.has("lot")} touche={line !== null && revealed.has("lot")}>
          <Montant value={layout.lot} className="jeu__gros" />
        </Case>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// duel : battre l'adversaire

function duelValue(skin: DuelLayout["skin"], value: number): { text: string; note?: string } {
  if (skin === "course") return { text: formatChrono(value) };
  if (skin === "cartes" && value > 21) return { text: String(value), note: "saute" };
  return { text: String(value) };
}

function DuelView({ def, layout, revealed, prefix }: ViewProps<DuelLayout>) {
  const them = layout.skin === "cartes" ? (def.id === "vingt-et-un" ? "Hector" : "Croupier") : layout.skin === "course" ? "Rival" : "";
  return (
    <div className={cx("jeu-duel", `jeu-duel--${layout.skin}`)}>
      {layout.rounds.map((round, i) => {
        const idM = prefixed(prefix, `r${i}m`);
        const idA = prefixed(prefix, `r${i}a`);
        const won = roundWon(layout.skin, round.you, round.them);
        const seen = revealed.has(idM);
        const you = duelValue(layout.skin, round.you);
        const other = duelValue(layout.skin, round.them);
        return (
          <div className="jeu-duel__manche" key={idM}>
            <Case id={idM} vue={seen} touche={seen && won && revealed.has(idA)} className="jeu-duel__rencontre">
              <span className={cx("jeu-duel__camp", seen && won && "jeu-duel__camp--gagne")}>
                <Ajuste className="jeu-duel__nom">Toi</Ajuste>
                <Ajuste className="jeu-duel__score">{you.text}</Ajuste>
              </span>
              <span className="jeu-duel__contre" aria-hidden="true">
                <Symbole cle={layout.skin === "foot" ? "foot:ballon" : layout.skin === "course" ? "course:drapeau" : "carte:pique"} />
              </span>
              <span className="jeu-duel__camp">
                <Ajuste className="jeu-duel__nom">{round.opponent ?? them}{other.note ? ` (${other.note})` : ""}</Ajuste>
                <Ajuste className="jeu-duel__score">{other.text}</Ajuste>
              </span>
            </Case>
            <Case id={idA} vue={revealed.has(idA)} touche={seen && won && revealed.has(idA)} className="jeu-duel__montant">
              <Montant value={round.amount} className="jeu__moyen" />
            </Case>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// etoile : ton signe

function EtoileView({ def, layout, revealed }: ViewProps<EtoileLayout>) {
  const { theme } = useTicket();
  const pickKey = symbolKey(def.options.family, layout.pick);
  return (
    <div className="jeu-etoile">
      <p className="jeu-etoile__signe">
        <span>Ton signe</span>
        <Symbole cle={pickKey} className="jeu-etoile__choisi" />
        <strong>{SYMBOL_NAMES[pickKey] ?? layout.pick}</strong>
      </p>
      <div className="jeu-etoile__grille">
        {layout.cells.map((cell, i) => {
          const id = `s${i}`;
          const key = symbolKey(def.options.family, cell.sign);
          return (
            <Case key={id} id={id} forme={theme.forme} vue={revealed.has(id)} touche={revealed.has(id) && cell.sign === layout.pick}>
              <Symbole cle={key} className="jeu__symbole" title={SYMBOL_NAMES[key]} />
              <Montant value={cell.amount} className="jeu__petit" />
            </Case>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// lignes : tirage et rangées à compléter

function Element({ skin, e, stamped }: { skin: LignesLayout["skin"]; e: number; stamped?: boolean }) {
  if (skin === "nombres") {
    return (
      <span className={cx("jeu-bouee", stamped && "jeu-element--tamponne")}>
        <span>{e}</span>
      </span>
    );
  }
  const card = cardOf(e);
  const face = card.rank === "V" ? "carte:valet" : card.rank === "D" ? "carte:dame" : card.rank === "R" ? "carte:roi" : null;
  return (
    <span className={cx("jeu-carte", card.red && "jeu-carte--rouge", stamped && "jeu-element--tamponne")} role="img" aria-label={card.name}>
      <span className="jeu-carte__rang" aria-hidden="true">{card.rank}</span>
      <Symbole cle={`carte:${card.suit}`} className="jeu-carte__enseigne" />
      {face && <Symbole cle={face} className="jeu-carte__figure" />}
    </span>
  );
}

function LignesView({ layout, revealed }: ViewProps<LignesLayout>) {
  const visible = drawnVisible(layout, revealed);
  return (
    <div className={cx("jeu-lignes", `jeu-lignes--${layout.skin}`)}>
      <p className="jeu__titre">Tirage</p>
      <div className="jeu-lignes__tirage">
        {layout.draw.map((e, i) => {
          const id = `d${i}`;
          const onLine = layout.lines.some((l) => l.items.includes(e));
          return (
            <Case key={id} id={id} vue={revealed.has(id)} touche={revealed.has(id) && onLine}>
              <Element skin={layout.skin} e={e} />
            </Case>
          );
        })}
      </div>
      <div className="jeu-lignes__rangees">
        {layout.lines.map((line, l) => {
          const complete = line.items.every((e) => visible.has(e));
          return (
            <div className={cx("jeu-lignes__rangee", complete && "jeu-lignes__rangee--complete")} key={l}>
              {layout.skin === "nombres" && <Symbole cle="regate:voilier" className="jeu-lignes__voilier" />}
              <span className="jeu-lignes__elements">
                {/* Chaque élément tiré qui figure sur une rangée y est tamponné. */}
                {line.items.map((e) => <Element key={e} skin={layout.skin} e={e} stamped={visible.has(e)} />)}
              </span>
              <Montant value={line.amount} className="jeu-lignes__montant" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// multi : trois jeux en un

interface MultiProps extends ViewProps<MultiLayout> {
  panel: number;
  onPanel?: (panel: number) => void;
}

function MultiView({ def, layout, revealed, panel, onPanel }: MultiProps) {
  const { mini } = useTicket();
  const prefix = `p${panel}:`;
  let view: ReactNode;
  if (panel === 0) view = <TrioView def={def} layout={layout.panels[0]} revealed={revealed} prefix={prefix} />;
  else if (panel === 1) view = <NumerosView def={def} layout={layout.panels[1]} revealed={revealed} prefix={prefix} />;
  else view = <DuelView def={def} layout={layout.panels[2]} revealed={revealed} prefix={prefix} />;
  return (
    <div className="jeu-multi">
      {/* Trois pastilles permettent de revenir en arrière. */}
      <div className="jeu-multi__pastilles" role="tablist" aria-label="Volets du ticket">
        {Array.from({ length: PANEL_COUNT }, (_, p) => {
          const complete = panelCellIds(layout, p).every((id) => revealed.has(id));
          const reachable = p === 0 || panelCellIds(layout, p - 1).every((id) => revealed.has(id));
          // Sur une miniature, les pastilles ne sont qu'un dessin : pas de bouton dans un bouton.
          if (mini) {
            return (
              <span key={p} className={cx("jeu-multi__pastille", p === panel && "jeu-multi__pastille--active")}>
                <span>{p + 1}</span>
              </span>
            );
          }
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={p === panel}
              className={cx("jeu-multi__pastille", p === panel && "jeu-multi__pastille--active", complete && "jeu-multi__pastille--finie")}
              disabled={!onPanel || !reachable}
              onClick={() => onPanel?.(p)}
            >
              <span aria-hidden="true">{p + 1}</span>
              <span className="invisible">{PANEL_NAMES[p]}</span>
            </button>
          );
        })}
        <span className="jeu-multi__nom">{PANEL_NAMES[panel]}</span>
      </div>
      <div className="jeu-multi__volet" key={panel}>{view}</div>
    </div>
  );
}

export { panelRevealed };

// ---------------------------------------------------------------------------

interface EngineViewProps {
  def: TicketDef;
  layout: Layout;
  revealed: ReadonlySet<string>;
  panel?: number;
  onPanel?: (panel: number) => void;
}

export function EngineView({ def, layout, revealed, panel = 0, onPanel }: EngineViewProps) {
  switch (layout.engine) {
    case "trio": return <TrioView def={def} layout={layout} revealed={revealed} />;
    case "numeros": return <NumerosView def={def} layout={layout} revealed={revealed} />;
    case "morpion": return <MorpionView def={def} layout={layout} revealed={revealed} />;
    case "duel": return <DuelView def={def} layout={layout} revealed={revealed} />;
    case "etoile": return <EtoileView def={def} layout={layout} revealed={revealed} />;
    case "lignes": return <LignesView def={def} layout={layout} revealed={revealed} />;
    case "multi": return <MultiView def={def} layout={layout} revealed={revealed} panel={panel} onPanel={onPanel} />;
  }
}
