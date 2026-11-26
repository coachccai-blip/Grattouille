// Les vues des onze moteurs : ce qui est imprimé dans la zone de jeu d'un ticket
// (BRIEF.md, sections 7.3 à 7.9, et les quatre moteurs ajoutés ensuite). Chaque vue
// lit une grille construite par src/engines et l'ensemble des cases déjà révélées ;
// elle ne décide de rien.
//
// Tous les textes passent par `t()` : les tables gardent leurs mots français, c'est
// le rendu qui les écrit dans la langue du jeu.

import type { CSSProperties, ReactNode } from "react";
import { formatEuros } from "../../shared/format";
import type { TicketDef } from "../../shared/types";
import { Symbole } from "../art/Illustration";
import type { Layout } from "../engines";
import { MAJORITY, type CampsLayout } from "../engines/camps";
import { tripleOf, type CoefLayout } from "../engines/coef";
import { optString, optStrings, palette } from "../engines/common";
import { formatChrono, roundWon, type DuelLayout, type DuelSkin } from "../engines/duel";
import type { EtoileLayout } from "../engines/etoile";
import {
  CARD_RANK_NAMES, CARD_SUIT_NAMES, COCKTAIL_INGREDIENTS, cardOf, drawnVisible, type CardSuit, type LignesLayout,
} from "../engines/lignes";
import { LINES, completeLines, type MorpionLayout } from "../engines/morpion";
import { gridOf, type MotsLayout } from "../engines/mots";
import { PANEL_COUNT, panelCellIds, panelNames, panelRevealed, type MultiLayout } from "../engines/multi";
import type { NumerosLayout } from "../engines/numeros";
import { SQUARES, type ParcoursLayout } from "../engines/parcours";
import type { TrioLayout } from "../engines/trio";
import { pick, t } from "../i18n";
import { Ajuste, Case, Montant, MontantEmpile, cx, prefixed, useTicket } from "./parts";
import { symbolKey, symbolName } from "./themes";

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
  // Les trois cases identiques, une fois toutes visibles : elles se cerclent de mimosa.
  const counts = new Map<number, number[]>();
  layout.cells.forEach((a, i) => {
    if (!revealed.has(prefixed(prefix, `c${i}`))) return;
    counts.set(a, [...(counts.get(a) ?? []), i]);
  });
  const trio = [...counts.values()].find((list) => list.length >= 3) ?? null;
  const forme = prefix ? "rect" : theme.forme;
  return (
    <div className={cx("jeu-trio", `jeu-trio--${mode}`)}>
      <div className="jeu-trio__grille">
        {layout.cells.map((amount, i) => {
          const id = prefixed(prefix, `c${i}`);
          const key = mode === "symboles" ? symbolKey(def.options.family, symbols[pal.indexOf(amount)] ?? "") : "";
          return (
            <Case key={id} id={id} forme={forme} vue={revealed.has(id)} touche={trio?.includes(i) ?? false}>
              {mode === "symboles" ? (
                <>
                  <Symbole cle={key} className="jeu__symbole" title={symbolName(key)} />
                  <Montant value={amount} className="jeu__petit" />
                </>
              ) : (
                <MontantEmpile value={amount} max={6} className="jeu__gros" />
              )}
            </Case>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// numeros : numéros gagnants

/** Les deux titres de la grille : les numéros gagnants, puis ceux du joueur. */
function numerosTitres(comptes: boolean, volet: boolean): readonly [string, string] {
  // `comptes` : les numéros sont des comptes numérotés.
  if (comptes) return ["Comptes gagnants", "Tes comptes"];
  // Dans un volet du ticket multiple, le nom du volet dit déjà « les numéros ».
  if (volet) return ["Gagnants", "Les tiens"];
  return ["Numéros gagnants", "Tes numéros"];
}

function NumerosView({ def, layout, revealed, prefix }: ViewProps<NumerosLayout>) {
  const visibleWinners = new Set<number>();
  layout.winning.forEach((n, i) => {
    if (revealed.has(prefixed(prefix, `w${i}`))) visibleWinners.add(n);
  });
  // `comptes` : les numéros sont gravés sur des plaques de laiton.
  const comptes = !prefix && def.options.skin === "comptes";
  const [gagnants, tiens] = numerosTitres(comptes, Boolean(prefix));
  return (
    <div className={cx("jeu-numeros", `jeu-numeros--${layout.cols}`, comptes && "jeu-numeros--comptes")}>
      <p className="jeu__titre">{t(gagnants)}</p>
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
      <p className="jeu__titre">{t(tiens)}</p>
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
              <Symbole cle={key} className="jeu__symbole jeu__symbole--grand" title={symbolName(key)} />
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
        <span className="jeu__titre">{t("Lot")}</span>
        <Case id={lotId} vue={revealed.has(lotId)} touche={line !== null && revealed.has(lotId)}>
          <Montant value={layout.lot} className="jeu__gros" />
        </Case>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// duel : battre l'adversaire

/** Entre les deux camps : le ballon, le drapeau à damier ou le pique. */
const DUEL_EMBLEMES: Record<DuelSkin, string> = { foot: "foot:ballon", course: "course:drapeau", cartes: "carte:pique" };

function DuelView({ def, layout, revealed, prefix }: ViewProps<DuelLayout>) {
  // L'adversaire : une équipe (football), Hector à sa table ou le croupier (cartes), le rival (course).
  const them = layout.skin === "cartes" ? (def.id === "vingt-et-un" ? "Hector" : "Croupier") : "Rival";
  const course = layout.skin === "course";
  return (
    <div className={cx("jeu-duel", `jeu-duel--${layout.skin}`)}>
      {layout.rounds.map((round, i) => {
        const idM = prefixed(prefix, `r${i}m`);
        const idA = prefixed(prefix, `r${i}a`);
        const won = roundWon(layout.skin, round.you, round.them);
        const seen = revealed.has(idM);
        // « les Goélands » : sur le ticket, le nom de l'équipe suffit.
        const opponent = t(round.opponent ?? them).replace(/^les /, "");
        // Au-dessus de 21, l'adversaire saute : le mot le dit à côté de sa main.
        const bust = layout.skin === "cartes" && round.them > 21;
        return (
          <div className="jeu-duel__manche" key={idM}>
            <Case id={idM} vue={seen} touche={seen && won && revealed.has(idA)} className="jeu-duel__rencontre">
              <span className={cx("jeu-duel__camp", seen && won && "jeu-duel__camp--gagne")}>
                <Ajuste className="jeu-duel__nom">{t("Toi")}</Ajuste>
                <Ajuste className="jeu-duel__score">{course ? formatChrono(round.you) : String(round.you)}</Ajuste>
              </span>
              <span className="jeu-duel__contre" aria-hidden="true">
                <Symbole cle={DUEL_EMBLEMES[layout.skin]} />
              </span>
              <span className={cx("jeu-duel__camp", bust && "jeu-duel__camp--saute")}>
                <Ajuste className="jeu-duel__nom">{opponent}</Ajuste>
                {bust ? (
                  <span className="jeu-duel__score">
                    {round.them}
                    <small className="jeu-duel__note">{t("saute")}</small>
                  </span>
                ) : (
                  <Ajuste className="jeu-duel__score">{course ? formatChrono(round.them) : String(round.them)}</Ajuste>
                )}
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
    <div className={cx("jeu-etoile", `jeu-etoile--${theme.forme}`)}>
      <p className="jeu-etoile__signe">
        <span>{t(def.options.family === "arcane" ? "Ton arcane" : "Ton signe")}</span>
        <Symbole cle={pickKey} className="jeu-etoile__choisi" />
        <strong>{symbolName(pickKey, layout.pick)}</strong>
      </p>
      <div className="jeu-etoile__grille">
        {layout.cells.map((cell, i) => {
          const id = `s${i}`;
          const key = symbolKey(def.options.family, cell.sign);
          return (
            <Case key={id} id={id} forme={theme.forme} vue={revealed.has(id)} touche={revealed.has(id) && cell.sign === layout.pick}>
              <Symbole cle={key} className="jeu__symbole" title={symbolName(key)} />
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

/** Les figures s'écrivent V, D, R en français, et J, Q, K en anglais. */
const RANGS_EN: Record<string, string> = { V: "J", D: "Q", R: "K" };
const FIGURES: Record<string, string> = { V: "carte:valet", D: "carte:dame", R: "carte:roi" };

/** « valet de pique », ou « jack of spades ». */
function cardName(rank: string, suit: CardSuit): string {
  const figure = CARD_RANK_NAMES[rank];
  return t("{rang} de {couleur}", { rang: figure ? t(figure) : rank, couleur: t(CARD_SUIT_NAMES[suit]) });
}

function Element({ skin, e, stamped }: { skin: LignesLayout["skin"]; e: number; stamped?: boolean }) {
  if (skin === "cocktails") {
    const key = `cocktail:${COCKTAIL_INGREDIENTS[e] ?? "citron"}`;
    return (
      <span className={cx("jeu-ingredient", stamped && "jeu-element--tamponne")} role="img" aria-label={symbolName(key)}>
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
  const face = FIGURES[card.rank];
  const rang = pick<Record<string, string>>({ fr: {}, en: RANGS_EN })[card.rank] ?? card.rank;
  return (
    <span
      className={cx("jeu-carte", card.red && "jeu-carte--rouge", stamped && "jeu-element--tamponne")}
      role="img"
      aria-label={cardName(card.rank, card.suit)}
    >
      <span className="jeu-carte__rang" aria-hidden="true">{rang}</span>
      <Symbole cle={`carte:${card.suit}`} className="jeu-carte__enseigne" />
      {face && <Symbole cle={face} className="jeu-carte__figure" />}
    </span>
  );
}

function LignesView({ layout, revealed }: ViewProps<LignesLayout>) {
  const visible = drawnVisible(layout, revealed);
  return (
    <div className={cx("jeu-lignes", `jeu-lignes--${layout.skin}`)}>
      <p className="jeu__titre">{t(layout.skin === "cocktails" ? "Les ingrédients" : "Tirage")}</p>
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
    <svg className="jeu-de" viewBox="0 0 40 40" role="img" aria-label={t("Dé : {valeur}", { valeur: value })}>
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

function ParcoursView({ layout, revealed, prefix }: ViewProps<ParcoursLayout>) {
  const ids = layout.dice.map((_, i) => prefixed(prefix, `x${i}`));
  let at = 0;
  layout.dice.forEach((d, i) => {
    if (revealed.has(ids[i]!)) at += d;
  });
  const done = ids.every((id) => revealed.has(id));
  const won = done && (layout.squares[at - 1] ?? 0) > 0;
  const spot = at > 0 ? pathSpot(at) : null;
  // Au départ, le pion attend à gauche des dés ; ensuite il se pose au pied de sa case.
  const pawn = spot
    ? ({ "--col": spot.col, "--row": spot.row } as CSSProperties)
    : undefined;
  return (
    <div className={cx("jeu-parcours", `jeu-parcours--${layout.skin}`)}>
      <ol className="jeu-parcours__chemin" aria-label={t("Le chemin")}>
        {layout.squares.map((amount, i) => {
          const n = i + 1;
          const { col, row } = pathSpot(n);
          return (
            <li
              key={n}
              className={cx(
                "jeu-parcours__case",
                amount > 0 ? "jeu-parcours__case--lot" : "jeu-parcours__case--vide",
                // Au bout d'une rangée, une flèche montre que le chemin monte.
                n % PATH_COLS === 0 && n < SQUARES && "jeu-parcours__case--virage",
                // Le pion est là : le contenu de la case lui fait une place, il ne le recouvre pas.
                at === n && "jeu-parcours__case--pion",
                done && at === n && "jeu-parcours__case--arrivee",
                won && at === n && "jeu-parcours__case--gagne",
              )}
              style={{ gridColumn: col + 1, gridRow: row + 1 }}
              aria-label={amount > 0
                ? t("Case {n} : {montant}", { n, montant: formatEuros(amount) })
                : t("Case {n} : rien", { n })}
            >
              <span className="jeu-parcours__contenu" aria-hidden="true">
                {amount > 0
                  ? <MontantEmpile value={amount} max={5} empile className="jeu-parcours__lot" />
                  : <span className="jeu-parcours__numero">{n}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <span className={cx("jeu-parcours__pion", !spot && "jeu-parcours__pion--depart", won && "jeu-parcours__pion--gagne")} style={pawn} aria-hidden="true">
        <Symbole cle={PIONS[layout.skin] ?? "pion:crabe"} />
      </span>
      <div className="jeu-parcours__des">
        {/* Avant le premier dé, le pion attend ici ; ensuite, le total des dés grattés s'y écrit. */}
        <span className="jeu-parcours__depart">
          <span className="jeu__titre">{t(at > 0 ? "Total" : "Départ")}</span>
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
          <span className="jeu__titre">{t(COEF_LABELS[layout.skin] ?? "Coefficient")}</span>
          {/* Le calcul s'écrit quand les trois montants et le coefficient sont visibles. */}
          {found && kSeen && (
            <>
              <Ajuste className="jeu-coef__calcul">{`${formatEuros(base)} × ${layout.coef}`}</Ajuste>
              <Ajuste className="jeu-coef__total">{`= ${formatEuros(base * layout.coef)}`}</Ajuste>
            </>
          )}
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
  const vars = { n: count, total: grille.length };
  return (
    <div className="jeu-mots">
      <div className="jeu-mots__haut">
        <div
          className="jeu-mots__grille"
          style={{ "--cols": cols, "--rows": rows } as CSSProperties}
          role="img"
          aria-label={count > 1
            ? t("Grille de mots croisés : {n} mots complets sur {total}", vars)
            : t("Grille de mots croisés : {n} mot complet sur {total}", vars)}
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
        {/* Le barème : ce que rapportent 10 mots, 9 mots… 1 mot. */}
        <ol className="jeu-mots__bareme" aria-label={t("Barème")}>
          {layout.scale.map((amount, i) => (
            <li key={i} className={cx("jeu-mots__palier", count === i + 1 && "jeu-mots__palier--atteint")}>
              <span className="jeu-mots__n">{i + 1}</span>
              <Montant value={amount} />
            </li>
          )).reverse()}
        </ol>
      </div>
      <div className="jeu-mots__lettres" role="group" aria-label={t("Tes lettres")}>
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
  const pickName = symbolName(pickKey, layout.pick);
  return (
    <div className={cx("jeu-camps", `jeu-camps--${family}`)}>
      <div className="jeu-camps__grille">
        {layout.cells.map((camp, i) => {
          const id = `q${i}`;
          const key = `${family}:${camp}`;
          return (
            <Case key={id} id={id} forme={theme.forme} vue={revealed.has(id)} touche={won && camp === layout.pick && revealed.has(id)}>
              <Symbole cle={key} className="jeu__symbole jeu__symbole--grand" title={symbolName(key)} />
            </Case>
          );
        })}
      </div>
      <div className="jeu-camps__cote">
        <p className="jeu-camps__camp">
          <span className="jeu__titre">{t("Ton camp")}</span>
          <Symbole cle={pickKey} className="jeu-camps__choisi" />
          <Ajuste className="jeu-camps__nom">{pickName}</Ajuste>
        </p>
        {/* Le score se compte tout seul, case après case. */}
        <p
          className="jeu-camps__score"
          aria-label={t("{camp} {a}, {autre} {b}", { camp: pickName, a: mine, autre: symbolName(otherKey, other), b: theirs })}
        >
          <strong className={cx(won && "jeu-camps__gagne")}>{mine}</strong>
          <span aria-hidden="true">–</span>
          <span>{theirs}</span>
        </p>
        <div className="jeu-camps__lot">
          <span className="jeu__titre">{t("Lot")}</span>
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
      <div className="jeu-multi__pastilles" role="tablist" aria-label={t("Volets du ticket")}>
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
              <span className="invisible">{t(names[p]!)}</span>
            </button>
          );
        })}
        <Ajuste className="jeu-multi__nom">{t(names[panel] ?? names[0])}</Ajuste>
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
