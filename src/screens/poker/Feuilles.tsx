// Les feuilles du Poker Tricheur : les règles, s'asseoir (table d'un lieu, défi, Table
// des Maîtres, table d'amis à créer ou à rejoindre), puis celles de la table : remplacer
// une carte, accuser, recaver, quitter. Une feuille dit une chose et propose un geste.
//
// Ce sont des entrées de la navigation, comme les autres fiches : le bouton retour du
// téléphone les referme. Celles qui dépendent d'un temps de la main (la triche,
// l'accusation) se referment d'elles-mêmes quand ce temps est passé.

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { formatEuros, formatInt } from "../../../shared/format";
import type { Card } from "../../../shared/poker/cards";
import { CHEAT_MS, MASTERS_SEATS, MAX_BUYIN_BLINDS, MAX_SEATS, MIN_SEATS } from "../../../shared/poker/rules";
import type { Difficulty, TableView } from "../../../shared/poker/types";
import type { PlaceId } from "../../../shared/types";
import { capitalize } from "../../app/helpers";
import { nav, type Screen } from "../../app/nav";
import { afterSitFailure, joinTable, play, previewTable, sitDown, usePoker } from "../../app/poker";
import { displayBalance, failureText, useGame } from "../../app/store";
import { Symbole } from "../../art/Illustration";
import { playAccuse, playClick, playRefuse, playSleight } from "../../fx/audio";
import { t } from "../../i18n";
import { placeShort } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Carte, nomDeCarte } from "../../ui/Carte";
import { Feuille } from "../../ui/Feuille";
import {
  RANKS, SUITS, accusationCost, buyInSteps, cleanCode, defaultBuyIn, hostStory, isFullCode, mastersCard, maxBuyInChoices,
  rankTaken, suitTaken, swapped, tournamentDecided,
} from "./calcul";
import { Alerte, BarreTemps, Pas, Tete, steps, unbroken } from "./parts";
import {
  categoriesFromTop, categoryName, character, difficultyName, identityOf, nameInSentence, playerName, rankLabel, type Identity,
} from "./textes";
import "./poker.css";

type SheetScreen = Extract<Screen, { name: "poker-feuille" }>;

/** Ferme la feuille, une seule fois : le joueur et la table peuvent s'y mettre en même temps. */
function useFermer(): () => void {
  const done = useRef(false);
  return useCallback(() => {
    if (done.current) return;
    done.current = true;
    if (nav.current().name === "poker-feuille") nav.back();
  }, []);
}

/** La tête d'une feuille : un portrait, un titre, une ligne dessous. */
function Tetiere({ who, titre, children }: { who: Identity; titre: string; children?: ReactNode }) {
  return (
    <div className="poker-feuille__tete">
      <Tete who={who} className="poker-tete--grande" />
      <div>
        <h2 className="t-titre">{titre}</h2>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Les règles

// Cinq phrases : ce sont les clés de traduction, lues à l'affichage.
const REGLES = [
  "Chacun paie la blinde, puis reçoit cinq cartes.",
  "En secret, tu peux remplacer une de tes cartes par celle de ton choix, ou jouer franc jeu.",
  "Un seul tour d'enchères : parole, mise, relance jusqu'à la hauteur du pot, ou tu te couches.",
  "À l'abattage, les mains se montrent et chacun peut accuser un joueur : un tricheur démasqué perd sa mise, et sa main ne compte plus.",
  "Accuser à tort coûte la mise de l'accusé, que tu lui verses ; puis la meilleure main encore en jeu prend le pot.",
] as const;

function Regles() {
  const fermer = useFermer();
  return (
    <Feuille titre={t("Les règles du Poker Tricheur")} onClose={fermer} className="poker-feuille">
      <h2 className="t-titre">{t("Les règles")}</h2>
      <ol className="poker-regles">
        {REGLES.map((regle, i) => (
          <li key={regle}>
            <span className="poker-regles__numero" aria-hidden="true">{i + 1}</span>
            <span>{t(regle)}</span>
          </li>
        ))}
      </ol>
      <h3 className="poker-regles__titre">{t("Les mains, de la plus forte à la plus faible")}</h3>
      <ol className="poker-regles__mains">
        {categoriesFromTop().map((name) => <li key={name}>{name}</li>)}
      </ol>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// S'asseoir à la table d'un lieu

/** Ce qui se passe quand on s'assoit : le geste, son attente, son refus. */
function useSeating(): { busy: boolean; error: string | null; run: (seat: () => Promise<string>) => Promise<void> } {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (seat: () => Promise<string>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const code = await seat();
      // La feuille laisse sa place à la table : le retour ramène au hall.
      nav.replace({ name: "poker-table", code });
    } catch (failure) {
      playRefuse();
      setError(failureText(failure));
      setBusy(false);
      await afterSitFailure(failure);
    }
  };
  return { busy, error, run };
}

function Maison({ place }: { place: PlaceId }) {
  const fermer = useFermer();
  const house = usePoker((s) => s.lobby?.houses.find((h) => h.place === place) ?? null);
  const balance = useGame(displayBalance);
  const [wanted, setWanted] = useState<number | null>(null);
  const { busy, error, run } = useSeating();
  if (!house) return null;

  const values = buyInSteps(house.minBuyIn, house.maxBuyIn, house.blind, balance);
  const buyIn = wanted !== null && values.includes(wanted) ? wanted : defaultBuyIn(values, house.blind);
  const { minus, plus } = buyIn === null ? { minus: null, plus: null } : steps(values, buyIn, setWanted);
  const host = character(house.host);

  return (
    <Feuille titre={t("La table : {lieu}", { lieu: placeShort(place) })} onClose={fermer} className="poker-feuille">
      <Tetiere who={host} titre={capitalize(placeShort(place))}>
        <p className="note">{t("Quatre à table : toi, {hote} et deux habitués.", { hote: nameInSentence(host) })}</p>
      </Tetiere>
      {buyIn === null ? (
        <Alerte>
          {t("Il te manque {montant}.", { montant: formatEuros(house.minBuyIn - balance) })}
          {" "}
          {t("Un ticket ou deux, et tu reviens t'asseoir.")}
        </Alerte>
      ) : (
        <>
          <Pas
            label={t("Ta cave")}
            aide={t("De {min} à {max}", { min: formatEuros(house.minBuyIn), max: formatEuros(house.maxBuyIn) })}
            value={formatEuros(buyIn)}
            onMinus={minus}
            onPlus={plus}
          />
          <p className="note">{t("Ta cave quitte ta bourse et devient ton tapis : tu le reprends en partant.")}</p>
        </>
      )}
      <Alerte>{error}</Alerte>
      <div className="poker-feuille__action">
        <Bouton
          bloc
          reflet={buyIn !== null}
          disabled={buyIn === null}
          attente={busy}
          onClick={() => void run(() => sitDown({ maison: place, buyIn: buyIn ?? undefined }))}
        >
          {buyIn === null ? t("S'asseoir") : t("S'asseoir avec {montant}", { montant: formatEuros(buyIn) })}
        </Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// Relever le défi d'un hôte

function Defi({ place }: { place: PlaceId }) {
  const fermer = useFermer();
  const challenge = usePoker((s) => s.lobby?.challenges.find((c) => c.place === place) ?? null);
  const balance = useGame(displayBalance);
  // Trois victoires contre l'hôte ouvrent son histoire : tant qu'elle ne l'est pas, une revanche compte encore.
  const told = useGame((s) => hostStory(s.player?.hostWins, place).open);
  const { busy, error, run } = useSeating();
  if (!challenge) return null;
  const host = character(challenge.host);
  const short = balance < challenge.buyIn;
  const mise = formatEuros(challenge.buyIn);

  return (
    <Feuille titre={t("Le défi : {lieu}", { lieu: placeShort(place) })} onClose={fermer} className="poker-feuille">
      <Tetiere who={host} titre={t("Défier {hote}", { hote: nameInSentence(host) })}>
        <p className="note">{capitalize(placeShort(place))}</p>
      </Tetiere>
      <p>{t("Un tête-à-tête : {montant} chacun, jusqu'à ce que l'un des deux n'ait plus rien.", { montant: mise })}</p>
      <p>{t("La blinde monte au fil des mains : le duel ne traîne pas.")}</p>
      <p className="poker-feuille__gain">
        {!challenge.won
          ? t("Si tu gagnes, sa cagnotte est pour toi : {montant}.", { montant: formatEuros(challenge.bonus) })
          : told
            ? t("Sa cagnotte est déjà gagnée : on rejoue pour l'honneur.")
            : t("Sa cagnotte est déjà gagnée : on rejoue pour l'honneur, et pour son histoire.")}
      </p>
      {short && <Alerte>{t("Il te manque {montant}.", { montant: formatEuros(challenge.buyIn - balance) })}</Alerte>}
      <Alerte>{error}</Alerte>
      <div className="poker-feuille__action">
        <Bouton bloc reflet={!short} disabled={short} attente={busy} onClick={() => void run(() => sitDown({ defi: place }))}>
          {t("Défier pour {montant}", { montant: mise })}
        </Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// S'asseoir à la Table des Maîtres

// Ses règles, en trois lignes : des clés de traduction, lues à l'affichage. `{cave}` et
// `{blinde}` sont les sommes du hall, mises en forme.
const REGLES_MAITRES = [
  "Chacun pose {cave}, et personne ne recave : à zéro, on quitte la table.",
  "La blinde part de {blinde} et monte au fil des mains.",
  "Tu peux partir avec ton tapis, mais sans la victoire.",
] as const;

function Maitres() {
  const fermer = useFermer();
  const lobby = usePoker((s) => s.lobby);
  const balance = useGame(displayBalance);
  const { busy, error, run } = useSeating();
  const card = lobby ? mastersCard(lobby, balance) : null;
  // Le serveur ne connaît pas cette table : il n'y a rien à confirmer.
  if (!card) return null;

  const short = card.short > 0;
  const sommes = { cave: formatEuros(card.buyIn), blinde: formatEuros(card.blind) };

  return (
    <Feuille titre={t("La Table des Maîtres")} onClose={fermer} className="poker-feuille">
      <div>
        <h2 className="t-titre">{t("La Table des Maîtres")}</h2>
        <p className="note">{t("Toi, et quatre des huit maîtres des lieux, tirés au sort.")}</p>
      </div>
      <ol className="poker-regles">
        {REGLES_MAITRES.map((regle, i) => (
          <li key={regle}>
            <span className="poker-regles__numero" aria-hidden="true">{i + 1}</span>
            <span>{unbroken(t(regle, sommes))}</span>
          </li>
        ))}
      </ol>
      {/* Tout ce qui est sur la table : les cinq caves. */}
      <p className="poker-feuille__gain">
        {t("Le dernier assis prend tout : {montant}.", { montant: formatEuros(card.buyIn * MASTERS_SEATS) })}
      </p>
      {short && <Alerte>{t("Il te manque {montant}.", { montant: formatEuros(card.short) })}</Alerte>}
      <Alerte>{error}</Alerte>
      <div className="poker-feuille__action">
        {/* Refusée par le serveur (un défi manque encore) : le hall s'est relu, la table est fermée, la feuille dit pourquoi. */}
        <Bouton
          bloc
          reflet={!short && card.open}
          disabled={short || !card.open}
          attente={busy}
          onClick={() => void run(() => sitDown({ maitres: true }))}
        >
          {t("S'asseoir pour {montant}", { montant: sommes.cave })}
        </Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// Créer une table

const SEATS = Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, i) => MIN_SEATS + i);
const LEVELS: readonly Difficulty[] = ["facile", "normal", "difficile"];

function Creer() {
  const fermer = useFermer();
  const blinds = usePoker((s) => s.lobby?.blinds ?? null);
  const balance = useGame(displayBalance);
  const { busy, error, run } = useSeating();
  // La blinde proposée d'abord : la plus haute dont cent blindes ne pèsent pas plus du quart de la bourse ; sinon la plus petite.
  const [blind, setBlind] = useState<number | null>(null);
  const [caves, setCaves] = useState(MAX_BUYIN_BLINDS);
  const [seats, setSeats] = useState(4);
  const [bots, setBots] = useState(0);
  const [level, setLevel] = useState<Difficulty>("normal");
  if (!blinds) return null;

  if (blinds.length === 0) {
    return (
      <Feuille titre={t("Créer une table")} onClose={fermer} className="poker-feuille">
        <h2 className="t-titre">{t("Créer une table")}</h2>
        <Alerte>{t("Ta bourse ne suffit pas pour cette cave.")}</Alerte>
      </Feuille>
    );
  }

  const comfy = [...blinds].reverse().find((b) => b * MAX_BUYIN_BLINDS * 4 <= balance) ?? blinds[0]!;
  const chosen = blind !== null && blinds.includes(blind) ? blind : comfy;
  const maxBuyIn = chosen * caves;
  const buyIn = Math.min(maxBuyIn, Math.floor(balance));
  const maxBots = seats - 1;
  const robots = Math.min(bots, maxBots);
  const blindSteps = steps(blinds, chosen, setBlind);
  const caveSteps = steps(maxBuyInChoices(chosen), maxBuyIn, (value) => setCaves(Math.round(value / chosen)));
  const seatSteps = steps(SEATS, seats, setSeats);

  return (
    <Feuille titre={t("Créer une table")} onClose={fermer} className="poker-feuille">
      <h2 className="t-titre">{t("Créer une table")}</h2>
      <div className="poker-reglages">
        <Pas label={t("Blinde")} aide={t("La mise d'entrée de chaque main")} value={formatEuros(chosen)} onMinus={blindSteps.minus} onPlus={blindSteps.plus} />
        <Pas label={t("Cave maximale")} aide={t("Ce qu'un joueur pose, au plus")} value={formatEuros(maxBuyIn)} onMinus={caveSteps.minus} onPlus={caveSteps.plus} />
        <Pas label={t("Sièges")} value={formatInt(seats)} onMinus={seatSteps.minus} onPlus={seatSteps.plus} />
        <Pas
          label={t("Robots")}
          value={formatInt(robots)}
          onMinus={robots > 0 ? () => setBots(robots - 1) : null}
          onPlus={robots < maxBots ? () => setBots(robots + 1) : null}
        />
        {robots > 0 && (
          <div className="poker-niveaux" role="radiogroup" aria-label={t("Niveau des robots")}>
            {LEVELS.map((value, i) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={level === value}
                className={cx("poker-niveau", level === value && "poker-niveau--choisi")}
                data-son="choix"
                onClick={() => {
                  if (level !== value) playClick(i);
                  setLevel(value);
                }}
              >
                {capitalize(difficultyName(value))}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="note">{t("Tu poses {montant}. Tes amis rejoignent la table avec son code.", { montant: formatEuros(buyIn) })}</p>
      <Alerte>{error}</Alerte>
      <div className="poker-feuille__action">
        <Bouton
          bloc
          attente={busy}
          onClick={() => void run(() => sitDown({ blind: chosen, maxBuyIn, seats, bots: robots, difficulty: level, buyIn }))}
        >
          {t("Créer la table")}
        </Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// Rejoindre avec un code

function Rejoindre() {
  const fermer = useFermer();
  const balance = useGame(displayBalance);
  const [code, setCode] = useState("");
  const [table, setTable] = useState<TableView | null>(null);
  const [wanted, setWanted] = useState<number | null>(null);
  const [looking, setLooking] = useState(false);
  const [lookError, setLookError] = useState<string | null>(null);
  const { busy, error, run } = useSeating();

  const look = async (e: FormEvent) => {
    e.preventDefault();
    if (looking || !isFullCode(code)) return;
    setLooking(true);
    setLookError(null);
    try {
      const view = await previewTable(code);
      // Déjà assis à cette table : on y retourne, tout simplement.
      if (view.you !== null) {
        nav.replace({ name: "poker-table", code: view.code });
        return;
      }
      setTable(view);
    } catch (failure) {
      playRefuse();
      setLookError(failureText(failure));
      await afterSitFailure(failure);
    }
    setLooking(false);
  };

  if (!table) {
    return (
      <Feuille titre={t("Rejoindre une table")} onClose={fermer} className="poker-feuille">
        <h2 className="t-titre">{t("Rejoindre une table")}</h2>
        <form className="poker-code" onSubmit={(e) => void look(e)}>
          <label className="champ">
            <span className="champ__label">{t("Le code de la table")}</span>
            <input
              className="champ__saisie poker-code__saisie"
              value={code}
              onChange={(e) => {
                setCode(cleanCode(e.target.value));
                setLookError(null);
              }}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-describedby="poker-code-aide"
              aria-invalid={lookError ? true : undefined}
            />
            <span id="poker-code-aide" className={cx("champ__aide", lookError && "champ__aide--erreur")} role={lookError ? "alert" : undefined}>
              {lookError ?? t("Cinq lettres ou chiffres, donnés par la personne qui a créé la table.")}
            </span>
          </label>
          <Bouton bloc type="submit" disabled={!isFullCode(code)} attente={looking}>{t("Voir la table")}</Bouton>
        </form>
      </Feuille>
    );
  }

  const seated = table.seats.filter((seat) => seat !== null);
  const free = table.seats.length - seated.length;
  const values = buyInSteps(table.minBuyIn, table.maxBuyIn, table.blind, balance);
  const buyIn = wanted !== null && values.includes(wanted) ? wanted : defaultBuyIn(values, table.blind);
  const { minus, plus } = buyIn === null ? { minus: null, plus: null } : steps(values, buyIn, setWanted);

  return (
    <Feuille titre={t("Rejoindre une table")} onClose={fermer} className="poker-feuille">
      <h2 className="t-titre">{t("Table {code}", { code: table.code })}</h2>
      <p className="note">
        {t("Blinde : {montant}", { montant: formatEuros(table.blind) })}
        {" · "}
        {free > 1 ? t("{n} sièges libres", { n: free }) : free === 1 ? t("1 siège libre") : t("Plus un siège")}
      </p>
      <ul className="poker-presents" aria-label={t("Déjà à table")}>
        {seated.map((seat) => (
          <li key={seat.seat}>
            <Tete who={identityOf(seat)} />
            <span>{playerName(identityOf(seat))}</span>
          </li>
        ))}
      </ul>
      {free === 0 ? (
        <Alerte>{t("Cette table est complète. Attends qu'un siège se libère.")}</Alerte>
      ) : buyIn === null ? (
        <Alerte>{t("Il te manque {montant}.", { montant: formatEuros(table.minBuyIn - balance) })}</Alerte>
      ) : (
        <Pas
          label={t("Ta cave")}
          aide={t("De {min} à {max}", { min: formatEuros(table.minBuyIn), max: formatEuros(table.maxBuyIn) })}
          value={formatEuros(buyIn)}
          onMinus={minus}
          onPlus={plus}
        />
      )}
      <Alerte>{error}</Alerte>
      <div className="poker-feuille__action">
        <Bouton
          bloc
          disabled={buyIn === null || free === 0}
          attente={busy}
          onClick={() => {
            if (buyIn !== null) void run(() => joinTable(table.code, buyIn));
          }}
        >
          {buyIn === null ? t("S'asseoir") : t("S'asseoir avec {montant}", { montant: formatEuros(buyIn) })}
        </Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// La triche : remplacer une carte par celle de son choix

const SUIT_ART: Record<string, string> = { s: "pique", h: "coeur", d: "carreau", c: "trefle" };
// Les noms des couleurs : des clés de traduction (les mêmes que celles des cartes).
const SUIT_NAMES: Record<string, string> = { s: "pique", h: "cœur", d: "carreau", c: "trèfle" };

function Triche({ index }: { index: number }) {
  const fermer = useFermer();
  const view = usePoker((s) => s.view);
  const offset = usePoker((s) => s.offset);
  const busy = usePoker((s) => s.busy);
  const [slot, setSlot] = useState(index);
  const [rank, setRank] = useState<string | null>(null);
  const [suit, setSuit] = useState<string | null>(null);
  const hand = view?.hand ?? null;
  const open = view !== null && view.phase === "triche" && view.options.cheat && hand !== null;

  // Le temps de la triche est passé, ou le choix est fait : la feuille se referme.
  useEffect(() => {
    if (!open) fermer();
  }, [open, fermer]);
  if (!view || !hand || !open) return null;

  const card: Card | null = rank !== null && suit !== null ? `${rank}${suit}` : null;
  const result = card ? swapped(hand.cards, slot, card) : null;
  const replaced = nomDeCarte(hand.cards[slot]) ?? "";

  const confirm = async () => {
    if (!card || busy !== null) return;
    if (await play({ type: "tricher", index: slot, card })) playSleight();
    fermer();
  };

  return (
    <Feuille titre={t("Remplacer une carte")} onClose={fermer} className="poker-feuille poker-triche">
      <BarreTemps deadline={view.deadline} offset={offset} total={CHEAT_MS} mine />
      <h2 className="poker-triche__titre">{t("Remplacer : {carte}", { carte: replaced })}</h2>
      <div className="poker-triche__main" role="group" aria-label={t("Ta main : touche la carte à remplacer")}>
        {hand.cards.map((held, i) => (
          <button
            key={i}
            type="button"
            className="poker-triche__carte"
            aria-pressed={i === slot}
            aria-label={nomDeCarte(held) ?? undefined}
            onClick={() => setSlot(i)}
          >
            <Carte carte={i === slot && card ? card : held} largeur={48} choisie={i === slot} />
          </button>
        ))}
      </div>
      <p className="poker-triche__effet" role="status">
        {result ? t("Ta main devient : {main}", { main: categoryName(result.category) }) : t("Par quelle carte ? Une valeur, une couleur.")}
      </p>
      <div className="poker-touches poker-touches--valeurs" role="group" aria-label={t("Valeur de la carte")}>
        {RANKS.map((r) => (
          <button
            key={r}
            type="button"
            className={cx("poker-touche", rank === r && "poker-touche--choisie")}
            aria-pressed={rank === r}
            disabled={rankTaken(hand.cards, r, suit)}
            onClick={() => setRank(r)}
          >
            {rankLabel(r)}
          </button>
        ))}
      </div>
      <div className="poker-touches poker-touches--couleurs" role="group" aria-label={t("Couleur de la carte")}>
        {SUITS.map((s) => (
          <button
            key={s}
            type="button"
            className={cx("poker-touche", suit === s && "poker-touche--choisie")}
            aria-pressed={suit === s}
            aria-label={t(SUIT_NAMES[s]!)}
            disabled={suitTaken(hand.cards, s, rank)}
            onClick={() => setSuit(s)}
          >
            <Symbole cle={`carte:${SUIT_ART[s]!}`} />
          </button>
        ))}
      </div>
      <div className="poker-feuille__action">
        <Bouton bloc disabled={!card} attente={busy === "tricher"} onClick={() => void confirm()}>
          {card ? t("Glisser : {carte}", { carte: nomDeCarte(card) ?? "" }) : t("Glisser la carte")}
        </Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// L'accusation

function Accuser({ seat }: { seat: number }) {
  const fermer = useFermer();
  const view = usePoker((s) => s.view);
  const busy = usePoker((s) => s.busy);
  const target = view?.seats[seat] ?? null;
  const me = view && view.you !== null ? view.seats[view.you] ?? null : null;
  const open = view !== null && view.phase === "abattage" && view.options.accuse.includes(seat) && target !== null && me !== null;

  // L'abattage est fini, ou le joueur a parlé : la feuille se referme.
  useEffect(() => {
    if (!open) fermer();
  }, [open, fermer]);
  if (!view || !target || !me || !open) return null;

  const who = identityOf(target);
  const nom = nameInSentence(who);
  const cost = accusationCost(target, me);

  const accuse = async () => {
    if (busy !== null) return;
    playAccuse();
    await play({ type: "accuser", seat });
    fermer();
  };

  return (
    <Feuille titre={t("Accuser {nom} ?", { nom })} onClose={fermer} className="poker-feuille poker-accuse">
      <Tetiere who={who} titre={t("Accuser {nom} ?", { nom })}>
        {target.category && <p className="note">{categoryName(target.category)}</p>}
      </Tetiere>
      <div className="poker-accuse__main">
        {(target.cards ?? []).map((card, i) => <Carte key={i} carte={card} largeur={48} />)}
      </div>
      <p className="poker-accuse__risque">
        {cost > 0
          ? t("Si {nom} a triché, sa main ne compte plus ; sinon, tu lui paies {montant}.", { nom, montant: formatEuros(cost) })
          : t("Si {nom} a triché, sa main ne compte plus ; sinon, rien à payer : ton tapis est vide.", { nom })}
      </p>
      <div className="poker-feuille__action">
        <Bouton bloc className="poker-accuse__cri" attente={busy === "accuser"} onClick={() => void accuse()}>
          {t("Tricheur !")}
        </Bouton>
        <Bouton variante="texte" bloc onClick={fermer}>{t("Finalement, non")}</Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// Recaver

function Recave() {
  const fermer = useFermer();
  const view = usePoker((s) => s.view);
  const busy = usePoker((s) => s.busy);
  const balance = useGame(displayBalance);
  const [wanted, setWanted] = useState<number | null>(null);
  const range = view?.options.rebuy ?? null;
  const me = view && view.you !== null ? view.seats[view.you] ?? null : null;
  const open = view !== null && range !== null && me !== null;

  // Revenu dans le coup, ou parti : plus rien à recaver.
  useEffect(() => {
    if (!open) fermer();
  }, [open, fermer]);
  if (!view || !range || !me) return null;

  const values = buyInSteps(range.min, range.max, view.blind, balance);
  const amount = wanted !== null && values.includes(wanted) ? wanted : values.length > 0 ? values[values.length - 1]! : null;
  const { minus, plus } = amount === null ? { minus: null, plus: null } : steps(values, amount, setWanted);

  const pay = async () => {
    if (amount === null || busy !== null) return;
    await play({ type: "recaver", amount });
    fermer();
  };

  return (
    <Feuille titre={t("Recaver")} onClose={fermer} className="poker-feuille">
      <h2 className="t-titre">{t("Recaver")}</h2>
      {amount === null ? (
        <Alerte>{t("Il te manque {montant}.", { montant: formatEuros(range.min - balance) })}</Alerte>
      ) : (
        <>
          <Pas label={t("Montant")} value={formatEuros(amount)} onMinus={minus} onPlus={plus} />
          <p className="note">
            {t("Ton tapis passera à {montant}, à la main suivante.", { montant: formatEuros(me.stack + me.reserve + amount) })}
          </p>
        </>
      )}
      <div className="poker-feuille__action">
        <Bouton bloc disabled={amount === null} attente={busy === "recaver"} onClick={() => void pay()}>
          {amount === null ? t("Recaver") : t("Recaver {montant}", { montant: formatEuros(amount) })}
        </Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------
// Quitter la table

function Quitter() {
  const fermer = useFermer();
  const view = usePoker((s) => s.view);
  const busy = usePoker((s) => s.busy);
  const me = view && view.you !== null ? view.seats[view.you] ?? null : null;
  // Un tournoi qui vient de se jouer (défi, Table des Maîtres) : son résultat est acquis, il n'y a
  // plus rien à abandonner. La feuille se referme, et le dénouement mène à la fin.
  const open = view !== null && me !== null && view.phase !== "fermee" && !tournamentDecided(view);

  useEffect(() => {
    if (!open) fermer();
  }, [open, fermer]);
  if (!view || !me || !open) return null;

  const inHand = view.hand !== null && !view.hand.folded && (view.phase === "triche" || view.phase === "encheres" || view.phase === "abattage");
  // Hors d'une main, `pot` est ce qui est resté sur la table : qui s'en va le laisse aux autres.
  const leftOver = !inHand && view.hand === null ? view.pot : 0;
  const stack = me.stack + me.reserve;

  const leave = async () => {
    if (busy !== null) return;
    // Parti : la table ramène elle-même au hall. Refusé : la feuille se referme, la table dit pourquoi.
    if (!(await play({ type: "quitter" }))) fermer();
  };

  return (
    <Feuille titre={t("Quitter la table ?")} onClose={fermer} className="poker-feuille">
      <h2 className="t-titre">{t("Quitter la table ?")}</h2>
      {inHand && (
        <p>{t("En pleine main, partir c'est se coucher : ta mise ({montant}) reste au pot.", { montant: formatEuros(me.committed) })}</p>
      )}
      {leftOver > 0 && (
        <p>{t("Un pot de {montant} est resté sur la table : en partant, tu le laisses aux autres.", { montant: formatEuros(leftOver) })}</p>
      )}
      {view.kind === "defi" && <p>{t("Le défi s'arrête là : il faudra le reprendre du début.")}</p>}
      {/* À la Table des Maîtres, partir c'est renoncer : on garde son tapis, pas la victoire. */}
      {view.kind === "maitres" && <p>{t("Le tournoi s'arrête là pour toi : pas de victoire, et la table ferme derrière toi.")}</p>}
      <p>{t("Ton tapis ({montant}) retourne dans ta bourse.", { montant: formatEuros(stack) })}</p>
      <div className="poker-feuille__action">
        <Bouton bloc attente={busy === "quitter"} onClick={() => void leave()}>{t("Quitter la table")}</Bouton>
        <Bouton variante="texte" bloc onClick={fermer}>{t("Rester à table")}</Bouton>
      </div>
    </Feuille>
  );
}

// ---------------------------------------------------------------------------

export function FeuillePoker({ screen }: { screen: SheetScreen }) {
  switch (screen.feuille) {
    case "regles": return <Regles />;
    case "creer": return <Creer />;
    case "rejoindre": return <Rejoindre />;
    case "maison": return <Maison place={screen.place} />;
    case "defi": return <Defi place={screen.place} />;
    case "maitres": return <Maitres />;
    case "triche": return <Triche index={screen.index} />;
    case "accuser": return <Accuser seat={screen.seat} />;
    case "recave": return <Recave />;
    case "quitter": return <Quitter />;
  }
}
