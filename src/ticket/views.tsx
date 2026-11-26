// Les vues des onze moteurs : ce qui est imprimé dans la zone de jeu d'un ticket
// (BRIEF.md, sections 7.3 à 7.9, et les quatre moteurs ajoutés ensuite). Chaque vue
// lit une grille construite par src/engines et l'ensemble des cases déjà révélées ;
// elle ne décide de rien.

import type { CSSProperties, ReactNode } from "react";
import { formatEuros } from "../../shared/format";
import type { TicketDef } from "../../shared/types";
import { Symbole } from "../art/Illustration";
import type { Layout } from "../engines";
import { MAJORITY, type CampsLayout } from "../engines/camps";
import { tripleOf, type CoefLayout } from "../engines/coef";
import { optString, optStrings } from "../engines/common";
import { formatChrono, roundWon, type DuelLayout } from "../engines/duel";
import type { EtoileLayout } from "../engines/etoile";
import { COCKTAIL_INGREDIENTS, cardOf, drawnVisible, type LignesLayout } from "../engines/lignes";
import { LINES, completeLines, type MorpionLayout } from "../engines/morpion";
import { gridOf, type MotsLayout } from "../engines/mots";
import { PANEL_COUNT, panelCellIds, panelNames, panelRevealed, type MultiLayout } from "../engines/multi";
import type { NumerosLayout } from "../engines/numeros";
import { SQUARES, type ParcoursLayout } from "../engines/parcours";
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

function NumerosView({ def, layout, revealed, prefix }: ViewProps<NumerosLayout>) {
  const visibleWinners = new Set<number>();
  layout.winning.forEach((n, i) => {
    if (revealed.has(prefixed(prefix, `w${i}`))) visibleWinners.add(n);
  });
  // `comptes` : les numéros sont des comptes numérotés, gravés sur des plaques de laiton.
  const comptes = !prefix && def.options.skin === "comptes";
  return (
    <div className={cx("jeu-numeros", comptes && "jeu-numeros--comptes")}>
      <p className="jeu__titre">{comptes ? "Comptes gagnants" : "Numéros gagnants"}</p>
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
      <p className="jeu__titre">{comptes ? "Tes comptes" : "Tes numéros"}</p>
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

function MorpionView({ def, layout, revealed, prefix, cibles }: ViewProps<MorpionLayout> & { cibles?: readonly [string, string] }) {
  const target = `morpion:${cibles?.[0] ?? optString(def.options, "target", "truffe")}`;
  const other = `morpion:${cibles?.[1] ?? optString(def.options, "other", "gland")}`;
  const done = completeLines(layout.grid).find((l) => LINES[l]!.every((c) => revealed.has(prefixed(prefix, `g${c}`))));
  const line = done === undefined ? null : LINES[done]!;
  const lotId = prefixed(prefix, "lot");
  return (
    <div className="jeu-morpion">
      <div className="jeu-morpion__grille">
        {layout.grid.map((isTarget, i) => {
          const id = prefixed(prefix, `g${i}`);
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
        <Case id={lotId} vue={revealed.has(lotId)} touche={line !== null && revealed.has(lotId)}>
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
        <span>{def.options.family === "arcane" ? "Ton arcane" : "Ton signe"}</span>
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
  if (skin === "cocktails") {
    const key = `cocktail:${COCKTAIL_INGREDIENTS[e] ?? "citron"}`;
    return (
      <span className={cx("jeu-ingredient", stamped && "jeu-element--tamponne")} role="img" aria-label={SYMBOL_NAMES[key] ?? key}>
        <Symbole cle={key} />
      </span>
    );
  }
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
      <p className="jeu__titre">{layout.skin === "cocktails" ? "Les ingrédients" : "Tirage"}</p>
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
// parcours : trois dés et un chemin

/** Les points d'un dé, sur une grille 3 × 3 (0 à 8, de gauche à droite et de haut en bas). */
const PIPS: Record<number, readonly number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

function De({ value }: { value: number }) {
  return (
    <svg className="jeu-de" viewBox="0 0 40 40" role="img" aria-label={`Dé : ${value}`}>
      <rect x="2" y="2" width="36" height="36" rx="8" className="jeu-de__face" />
      <path d="M38 12v18a8 8 0 0 1 -8 8H12q20 -2 26 -26Z" className="jeu-de__ombre" />
      {(PIPS[value] ?? []).map((i) => (
        <circle key={i} cx={10 + (i % 3) * 10} cy={10 + Math.floor(i / 3) * 10} r="3.4" className="jeu-de__point" />
      ))}
    </svg>
  );
}

const PIONS: Record<string, string> = { jetee: "pion:crabe", monde: "pion:montgolfiere", ascenseur: "pion:ascenseur" };
const PATH_COLS = 6;
const PATH_ROWS = SQUARES / PATH_COLS;

/** La colonne et la rangée d'une case du chemin : il serpente du bas vers le haut. */
function pathSpot(square: number): { col: number; row: number } {
  const i = square - 1;
  const fromBottom = Math.floor(i / PATH_COLS);
  const inRow = i % PATH_COLS;
  return { col: fromBottom % 2 === 0 ? inRow : PATH_COLS - 1 - inRow, row: PATH_ROWS - 1 - fromBottom };
}

/**
 * Le montant d'une case du chemin. Court (« 30 € », « 2 M€ »), il tient sur une ligne ;
 * long (« 1 500 € », « 1 000 Bn€ »), il passe sur deux, le nombre au-dessus de l'unité.
 */
function MontantCase({ value }: { value: number }) {
  const text = formatEuros(value);
  // L'unité suit une espace insécable.
  const cut = text.lastIndexOf("\u00A0");
  if (text.length <= 5 || cut <= 0) {
    return (
      <span className="jeu-parcours__lot">
        <Ajuste>{text}</Ajuste>
      </span>
    );
  }
  return (
    <span className="jeu-parcours__lot">
      <Ajuste>{text.slice(0, cut)}</Ajuste>
      <Ajuste>{text.slice(cut + 1)}</Ajuste>
    </span>
  );
}

function ParcoursView({ layout, revealed, prefix }: ViewProps<ParcoursLayout>) {
  const ids = layout.dice.map((_, i) => prefixed(prefix, `x${i}`));
  let at = 0;
  layout.dice.forEach((d, i) => {
    if (revealed.has(ids[i]!)) at += d;
  });
  const done = ids.every((id) => revealed.has(id));
  const won = done && (layout.squares[at - 1] ?? 0) > 0;
  const spot = at > 0 ? pathSpot(at) : null;
  // Au départ, le pion attend à gauche des dés ; ensuite il se pose sur sa case.
  const pawn = spot
    ? ({ "--col": spot.col, "--row": spot.row } as CSSProperties)
    : undefined;
  return (
    <div className={cx("jeu-parcours", `jeu-parcours--${layout.skin}`)}>
      <div className="jeu-parcours__plateau">
        <ol className="jeu-parcours__chemin" aria-label="Le chemin">
          {layout.squares.map((amount, i) => {
            const n = i + 1;
            const { col, row } = pathSpot(n);
            return (
              <li
                key={n}
                className={cx(
                  "jeu-parcours__case",
                  amount > 0 ? "jeu-parcours__case--lot" : n < 3 ? "jeu-parcours__case--elan" : "jeu-parcours__case--vide",
                  // Au bout d'une rangée, une flèche montre que le chemin monte.
                  n % PATH_COLS === 0 && n < SQUARES && "jeu-parcours__case--virage",
                  done && at === n && "jeu-parcours__case--arrivee",
                  won && at === n && "jeu-parcours__case--gagne",
                )}
                style={{ gridColumn: col + 1, gridRow: row + 1 }}
                aria-label={amount > 0 ? `Case ${n} : ${formatEuros(amount)}` : `Case ${n} : rien`}
              >
                <span className="jeu-parcours__numero" aria-hidden="true">{n}</span>
                {amount > 0 ? <MontantCase value={amount} /> : null}
              </li>
            );
          })}
        </ol>
        <span className={cx("jeu-parcours__pion", !spot && "jeu-parcours__pion--depart", won && "jeu-parcours__pion--gagne")} style={pawn} aria-hidden="true">
          <Symbole cle={PIONS[layout.skin] ?? "pion:crabe"} />
        </span>
      </div>
      <div className="jeu-parcours__des">
        <span className="jeu-parcours__depart">
          <span className="jeu__titre">Départ</span>
          <strong className="jeu-parcours__total">{at > 0 ? at : ""}</strong>
        </span>
        {layout.dice.map((d, i) => (
          <Case key={ids[i]} id={ids[i]!} vue={revealed.has(ids[i]!)} touche={won}>
            <De value={d} />
          </Case>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// coef : trois identiques, multipliés par un coefficient

const COEF_LABELS: Record<string, string> = { maree: "Coefficient de marée", interets: "Taux d'intérêt", prime: "Prime" };

function CoefView({ layout, revealed, prefix }: ViewProps<CoefLayout>) {
  const base = tripleOf(layout);
  const trio = layout.cells
    .map((a, i) => (a === base && base > 0 ? i : -1))
    .filter((i) => i >= 0 && revealed.has(prefixed(prefix, `a${i}`)));
  const found = base > 0 && trio.length >= 3;
  const kId = prefixed(prefix, "k");
  const kSeen = revealed.has(kId);
  const emblem = `coef:${layout.skin === "interets" || layout.skin === "prime" ? "interets" : "maree"}`;
  return (
    <div className={cx("jeu-coef", `jeu-coef--${layout.skin}`)}>
      <div className="jeu-coef__grille">
        {layout.cells.map((amount, i) => {
          const id = prefixed(prefix, `a${i}`);
          return (
            <Case key={id} id={id} vue={revealed.has(id)} touche={found && amount === base}>
              <Montant value={amount} className="jeu__gros" />
            </Case>
          );
        })}
      </div>
      <div className="jeu-coef__bas">
        <span className="jeu-coef__nom">
          <span className="jeu__titre">{COEF_LABELS[layout.skin] ?? "Coefficient"}</span>
          {/* Le calcul s'écrit quand les trois montants et le coefficient sont visibles. */}
          <Ajuste className={cx("jeu-coef__calcul", found && kSeen && "jeu-coef__calcul--vu")}>
            {found && kSeen ? `${formatEuros(base)} × ${layout.coef} = ${formatEuros(base * layout.coef)}` : "montant × coefficient"}
          </Ajuste>
        </span>
        <Case id={kId} vue={kSeen} touche={found && kSeen} className="jeu-coef__k">
          <span className="jeu-coef__fois">
            <Symbole cle={emblem} className="jeu-coef__embleme" />
            <strong>×{layout.coef}</strong>
          </span>
        </Case>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// mots : mots croisés

function MotsView({ layout, revealed }: ViewProps<MotsLayout>) {
  const grille = gridOf(layout);
  const known = new Set<string>();
  layout.letters.forEach((letter, i) => {
    if (revealed.has(`l${i}`)) known.add(letter);
  });
  // Les cases de la grille : leur lettre, et les mots qui passent par là.
  const cells = new Map<string, { letter: string; words: number[]; row: number; col: number }>();
  let rows = 0;
  let cols = 0;
  grille.forEach(([text, row, col, dir], w) => {
    for (let i = 0; i < text.length; i++) {
      const r = row + (dir === 1 ? i : 0);
      const c = col + (dir === 0 ? i : 0);
      const key = `${r}:${c}`;
      const cell = cells.get(key) ?? { letter: text[i]!, words: [], row: r, col: c };
      cell.words.push(w);
      cells.set(key, cell);
      rows = Math.max(rows, r + 1);
      cols = Math.max(cols, c + 1);
    }
  });
  const complete = new Set<number>();
  grille.forEach(([text], w) => {
    if ([...text].every((ch) => known.has(ch))) complete.add(w);
  });
  const inGrid = new Set<string>();
  for (const cell of cells.values()) inGrid.add(cell.letter);
  const count = complete.size;
  return (
    <div className="jeu-mots">
      <div className="jeu-mots__haut">
        <div
          className="jeu-mots__grille"
          style={{ "--cols": cols, "--rows": rows } as CSSProperties}
          role="img"
          aria-label={`Grille de mots croisés : ${count} ${count > 1 ? "mots complets" : "mot complet"} sur ${grille.length}`}
        >
          {[...cells.values()].map((cell) => (
            <span
              key={`${cell.row}:${cell.col}`}
              className={cx(
                "jeu-mots__case",
                known.has(cell.letter) && "jeu-mots__case--vue",
                cell.words.some((w) => complete.has(w)) && "jeu-mots__case--mot",
              )}
              style={{ gridRow: cell.row + 1, gridColumn: cell.col + 1 }}
              aria-hidden="true"
            >
              {cell.letter}
            </span>
          ))}
        </div>
        <ol className="jeu-mots__bareme" aria-label="Barème">
          {layout.scale.map((amount, i) => (
            <li key={i} className={cx("jeu-mots__palier", count === i + 1 && "jeu-mots__palier--atteint")}>
              <span className="jeu-mots__n">{i + 1}</span>
              <Montant value={amount} />
            </li>
          )).reverse()}
        </ol>
      </div>
      <div className="jeu-mots__lettres" aria-label="Tes lettres">
        {layout.letters.map((letter, i) => {
          const id = `l${i}`;
          return (
            <Case key={id} id={id} forme="rond" vue={revealed.has(id)} touche={revealed.has(id) && inGrid.has(letter)}>
              <span className={cx("jeu-mots__lettre", !inGrid.has(letter) && "jeu-mots__lettre--morte")}>{letter}</span>
            </Case>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// camps : choisis ton camp

function CampsView({ def, layout, revealed }: ViewProps<CampsLayout>) {
  const { theme } = useTicket();
  const family = optString(def.options, "family", "roulette");
  const other = layout.pick === layout.camps[0] ? layout.camps[1] : layout.camps[0];
  let mine = 0;
  let theirs = 0;
  layout.cells.forEach((camp, i) => {
    if (!revealed.has(`q${i}`)) return;
    if (camp === layout.pick) mine++;
    else theirs++;
  });
  const won = mine >= MAJORITY;
  const pickKey = `${family}:${layout.pick}`;
  const otherKey = `${family}:${other}`;
  return (
    <div className={cx("jeu-camps", `jeu-camps--${family}`)}>
      <div className="jeu-camps__grille">
        {layout.cells.map((camp, i) => {
          const id = `q${i}`;
          const key = `${family}:${camp}`;
          return (
            <Case key={id} id={id} forme={theme.forme} vue={revealed.has(id)} touche={won && camp === layout.pick && revealed.has(id)}>
              <Symbole cle={key} className="jeu__symbole jeu__symbole--grand" title={SYMBOL_NAMES[key]} />
            </Case>
          );
        })}
      </div>
      <div className="jeu-camps__cote">
        <p className="jeu-camps__camp">
          <span className="jeu__titre">Ton camp</span>
          <Symbole cle={pickKey} className="jeu-camps__choisi" />
          <strong>{SYMBOL_NAMES[pickKey] ?? layout.pick}</strong>
        </p>
        {/* Le score se compte tout seul, case après case. */}
        <p className="jeu-camps__score" aria-label={`${SYMBOL_NAMES[pickKey] ?? layout.pick} ${mine}, ${SYMBOL_NAMES[otherKey] ?? other} ${theirs}`}>
          <strong className={cx(won && "jeu-camps__gagne")}>{mine}</strong>
          <span aria-hidden="true">–</span>
          <span>{theirs}</span>
        </p>
        <div className="jeu-camps__lot">
          <span className="jeu__titre">Lot</span>
          <Case id="lot" vue={revealed.has("lot")} touche={won && revealed.has("lot")}>
            <Montant value={layout.lot} className="jeu__moyen" />
          </Case>
        </div>
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
  const names = panelNames(layout);
  let view: ReactNode;
  if (layout.kind === "ciel") {
    if (panel === 0) view = <ParcoursView def={def} layout={layout.panels[0]} revealed={revealed} prefix={prefix} />;
    else if (panel === 1) view = <CoefView def={def} layout={layout.panels[1]} revealed={revealed} prefix={prefix} />;
    else view = <MorpionView def={def} layout={layout.panels[2]} revealed={revealed} prefix={prefix} cibles={["planete", "asteroide"]} />;
  } else if (panel === 0) view = <TrioView def={def} layout={layout.panels[0]} revealed={revealed} prefix={prefix} />;
  else if (panel === 1) view = <NumerosView def={def} layout={layout.panels[1]} revealed={revealed} prefix={prefix} />;
  else view = <DuelView def={def} layout={layout.panels[2]} revealed={revealed} prefix={prefix} />;
  return (
    <div className={cx("jeu-multi", `jeu-multi--${layout.kind}`)}>
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
              <span className="invisible">{names[p]}</span>
            </button>
          );
        })}
        <span className="jeu-multi__nom">{names[panel]}</span>
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
    case "parcours": return <ParcoursView def={def} layout={layout} revealed={revealed} />;
    case "coef": return <CoefView def={def} layout={layout} revealed={revealed} />;
    case "mots": return <MotsView def={def} layout={layout} revealed={revealed} />;
    case "camps": return <CampsView def={def} layout={layout} revealed={revealed} />;
  }
}
