// Le hall du Poker Tricheur (POKER.md, sections 3 et 5) : le sport national de
// Grattouille. Chaque lieu ouvert a son hôte, qui lance un défi (un tête-à-tête, sa
// cagnotte à la clé) et tient une table à quatre. Les lieux fermés sont là, grisés, avec
// ce qui les ouvre. Entre amis : créer une table, ou en rejoindre une avec son code.
//
// Au bout des huit défis : la Table des Maîtres (LOT4.md, section 5). Tant qu'il reste un
// maître à ruiner, elle se devine en bas de la liste, fermée, avec ce qui l'ouvre ; une
// fois ouverte, elle passe en tête, devant la Lune.

import { useEffect } from "react";
import { formatEuros, formatInt } from "../../../shared/format";
import { PLACES, placeById } from "../../../shared/places";
import { BLIND_LADDER, BLIND_SHARE } from "../../../shared/poker/rules";
import type { LobbyChallenge, LobbyHouse, PokerLobbyResponse } from "../../../shared/poker/types";
import { nextPlace } from "../../../shared/rules";
import type { PlaceDef } from "../../../shared/types";
import { hostName } from "../../app/dialogues";
import { capitalize } from "../../app/helpers";
import { nav } from "../../app/nav";
import { loadLobby, usePoker } from "../../app/poker";
import { displayBalance, lockedText, toast, useGame } from "../../app/store";
import { Icon } from "../../art/icons";
import { t } from "../../i18n";
import { placeShort } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse } from "../../ui/Bourse";
import { Bulle, BulleLibre, Entete, Phrase } from "../../ui/Commun";
import { challengesWon, duelOf, mastersCard, type Duel, type MastersCard } from "./calcul";
import { Reperes } from "./parts";
import { duelLine, piouHall } from "./repliques";
import { difficultyName, duelProgressText } from "./textes";
import "./poker.css";

interface Entry {
  place: PlaceDef;
  house: LobbyHouse;
  challenge: LobbyChallenge;
}

function entriesOf(lobby: PokerLobbyResponse): Entry[] {
  const out: Entry[] = [];
  for (const place of PLACES) {
    const house = lobby.houses.find((h) => h.place === place.id);
    const challenge = lobby.challenges.find((c) => c.place === place.id);
    if (house && challenge) out.push({ place, house, challenge });
  }
  return out;
}

/** Ce qu'il manque à la bourse pour une somme, ou `null` si elle suffit. */
function shortOf(amount: number, balance: number): string | null {
  return balance >= amount ? null : t("Il te manque {montant}.", { montant: formatEuros(amount - balance) });
}

/** Le nom de la table où le joueur est assis : le lieu d'une table de la maison, l'hôte d'un défi, ou son code. */
function seatTitle(seat: NonNullable<PokerLobbyResponse["seat"]> | null): string {
  // Le hall n'a pas encore répondu : on sait seulement, par l'état du joueur, qu'il est assis quelque part.
  if (!seat) return t("Ta table");
  if (seat.kind === "maitres") return t("La Table des Maîtres");
  if (seat.kind === "maison" && seat.place) return capitalize(placeShort(seat.place));
  if (seat.kind === "defi" && seat.place) return t("Défi : {hote}", { hote: hostName(placeById(seat.place).host) });
  return t("Table {code}", { code: seat.code });
}

/**
 * Un lieu ouvert : son hôte et ce qu'il dit de la manche à jouer, où en est son défi (trois
 * manches, de plus en plus chères ; la troisième gagnée ouvre son histoire, dans les
 * Souvenirs), puis les deux façons de s'y asseoir.
 */
function Lieu({ entry, balance, duel }: { entry: Entry; balance: number; duel: Duel }) {
  const { place, house } = entry;
  const rematch = duel.stage === "revanche";
  const short = shortOf(duel.stake, balance);
  const table = shortOf(house.minBuyIn, balance);
  return (
    <li className="poker-lieu">
      <h3 className="poker-lieu__nom">{capitalize(placeShort(place.id))}</h3>
      {/* L'hôte change de ton d'une manche à l'autre : il toise, il se pique, il joue son va-tout. */}
      <Bulle line={duelLine(house.host, "ouverture", duel.stage)} className="poker-lieu__hote" />
      <p className={cx("poker-lieu__histoire", rematch && "poker-lieu__histoire--ouverte")}>
        <Reperes story={{ wins: duel.won, needed: duel.rounds }} />
        <span>{duelProgressText(duel)}</span>
      </p>
      <div className="poker-lieu__choix">
        <button
          type="button"
          className={cx("poker-billet", short && "poker-billet--court")}
          onClick={() => nav.push({ name: "poker-feuille", feuille: "defi", place: place.id })}
        >
          <strong className="poker-billet__titre">{rematch ? t("La revanche") : t("Le défi")}</strong>
          <span>{t("Mise : {montant}", { montant: formatEuros(duel.stake) })}</span>
          {short ? (
            <span className="poker-billet__manque">{short}</span>
          ) : (
            <span className="poker-billet__gain">{t("À la clé : {montant}", { montant: formatEuros(duel.prize) })}</span>
          )}
        </button>
        <button
          type="button"
          className={cx("poker-billet", table && "poker-billet--court")}
          onClick={() => nav.push({ name: "poker-feuille", feuille: "maison", place: place.id })}
        >
          <strong className="poker-billet__titre">{t("La table")}</strong>
          <span>{t("Blinde : {montant}", { montant: formatEuros(house.blind) })}</span>
          {table ? (
            <span className="poker-billet__manque">{table}</span>
          ) : (
            <span>{t("Niveau {niveau}", { niveau: difficultyName(house.difficulty) })}</span>
          )}
        </button>
      </div>
    </li>
  );
}

/** Un lieu fermé : grisé, avec ce qui l'ouvre. Le toucher le dit en toutes lettres. */
function Ferme({ entry, standing }: { entry: Entry; standing: number }) {
  const { place } = entry;
  const next = nextPlace(standing);
  const etat = place.id === next?.id
    ? t("Encore {n} ★", { n: formatInt(place.standing - standing) })
    : t("Ouvre à ★ {n}", { n: formatInt(place.standing) });
  return (
    <li>
      <button type="button" className="poker-ferme" onClick={() => toast(lockedText(place.id, standing), "erreur")}>
        <Icon name="cadenas" size={20} />
        <span className="poker-ferme__nom">{capitalize(placeShort(place.id))}</span>
        <span className="poker-ferme__etat"><Phrase text={etat} /></span>
      </button>
    </li>
  );
}

/**
 * La Table des Maîtres, ouverte : elle en impose. Quatre sièges dont on ne sait pas encore
 * qui les prendra, les sommes en grand, et ce qu'on y joue. La toucher ouvre la feuille qui
 * dit ses règles avant de s'y asseoir ; la bourse trop courte, elle dit ce qu'il manque.
 */
function Maitres({ card }: { card: MastersCard }) {
  const court = card.short > 0;
  return (
    <button
      type="button"
      className={cx("poker-maitres poker-maitres--ouverte", court && "poker-maitres--courte")}
      onClick={() => nav.push({ name: "poker-feuille", feuille: "maitres" })}
    >
      <span className="poker-maitres__sieges" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <span key={i} className="poker-maitres__siege">?</span>)}
      </span>
      <strong className="poker-maitres__nom">{t("La Table des Maîtres")}</strong>
      {/* « Contre quatre maîtres des lieux » : c'est LA table, pas le mode du même nom qu'on crée entre amis. */}
      <span className="poker-maitres__devise">{t("Contre quatre maîtres des lieux, tirés au sort")}</span>
      <span className="poker-maitres__sommes">
        <span className="poker-maitres__somme">
          <span>{t("Blinde de départ")}</span>
          <strong className="chiffres">{formatEuros(card.blind)}</strong>
        </span>
        <span className="poker-maitres__somme">
          <span>{t("Cave")}</span>
          <strong className="chiffres">{formatEuros(card.buyIn)}</strong>
        </span>
      </span>
      <span className="poker-maitres__regle">{t("Tournoi : le dernier assis prend tout")}</span>
      {card.won > 0 && (
        <span className="poker-maitres__palmares">
          <Icon name="coche" size={16} />
          {card.won === 1 ? t("Tu l'as remportée une fois") : t("Tu l'as remportée {n} fois", { n: formatInt(card.won) })}
        </span>
      )}
      {court ? (
        <span className="poker-maitres__manque">{t("Il te manque {montant}.", { montant: formatEuros(card.short) })}</span>
      ) : (
        <span className="poker-maitres__entrer">{t("Prendre place")}</span>
      )}
    </button>
  );
}

/** La Table des Maîtres, fermée : elle se devine. Un cadenas, ce qui l'ouvre, et où l'on en est : rien de plus. */
function MaitresFermee({ card }: { card: MastersCard }) {
  const compte = t("{n} sur {total}", { n: card.defis, total: card.total });
  return (
    <div className="poker-maitres poker-maitres--fermee">
      <Icon name="cadenas" size={20} />
      <div className="poker-maitres__texte">
        <strong className="poker-maitres__nom">{t("La Table des Maîtres")}</strong>
        <span>{t("Ruine les huit maîtres des lieux pour t'y asseoir.")}</span>
        <span className="poker-maitres__compte">
          {/* Un pion par maître : plein quand il est ruiné. Le compte s'écrit à côté. */}
          <span className="poker-maitres__pions" aria-hidden="true">
            {Array.from({ length: card.total }, (_, i) => <i key={i} className={i < card.defis ? "poker-maitres__pion--plein" : undefined} />)}
          </span>
          <span>{compte}</span>
        </span>
      </div>
    </div>
  );
}

export function Hall() {
  const lobby = usePoker((s) => s.lobby);
  const busy = usePoker((s) => s.lobbyBusy);
  const error = usePoker((s) => s.lobbyError);
  const standing = useGame((s) => s.player?.standing ?? 0);
  const balance = useGame(displayBalance);
  const online = useGame((s) => s.online);
  const sandbox = useGame((s) => s.sandbox);
  // Les victoires contre chaque hôte : autant de manches gagnées ; la troisième ouvre son histoire.
  const hostWins = useGame((s) => s.player?.hostWins);

  useEffect(() => {
    void loadLobby();
  }, []);

  const entries = lobby ? entriesOf(lobby) : [];
  const open = entries.filter((e) => e.house.open).reverse();
  const closed = entries.filter((e) => !e.house.open);
  // Assis quelque part : le hall le dit ; avant sa réponse, l'état du joueur le sait déjà.
  const seatedCode = useGame((s) => s.player?.poker?.code ?? null);
  const seat = lobby?.seat ?? null;
  const tableCode = seat?.code ?? seatedCode;
  // La moins chère des caves ouvertes : ce qu'il faut pour s'asseoir quelque part.
  const cheapest = open.length > 0 ? Math.min(...open.map((e) => e.house.minBuyIn)) : 0;
  const broke = lobby !== null && tableCode === null && open.length > 0 && balance < cheapest;
  const offline = !sandbox && !online;
  // Les défis relevés, et la Table des Maîtres (un serveur plus ancien ne la connaît pas : pas de carte).
  const defis = lobby ? challengesWon(lobby) : null;
  const maitres = lobby ? mastersCard(lobby, balance) : null;

  const piou = tableCode ? piouHall("assis") : broke ? piouHall("fauche", formatEuros(cheapest)) : piouHall("accueil");

  const back = () => {
    if (tableCode) nav.push({ name: "poker-table", code: tableCode });
  };

  return (
    <main className="ecran poker-hall">
      <Entete titre={t("Le Poker Tricheur")} retour grand droite={<Bourse />} />

      <BulleLibre pnj="piou" nom={hostName("piou")} className="poker-hall__piou">{piou}</BulleLibre>
      <button
        type="button"
        className="bouton bouton--texte poker-hall__regles"
        onClick={() => nav.push({ name: "poker-feuille", feuille: "regles" })}
      >
        <span className="bouton__texte">{t("Les règles, en cinq phrases")}</span>
      </button>

      {offline && (
        <p className="poker-avis poker-avis--alerte" role="status">
          <Icon name="hors-ligne" size={20} />
          <span>{t("Hors connexion. Les tables rouvrent dès que le réseau revient.")}</span>
        </p>
      )}

      {!lobby && error && (
        <div className="poker-hall__vide" role="alert">
          <p>{error}</p>
          <Bouton onClick={() => void loadLobby()} attente={busy}>{t("Réessayer")}</Bouton>
        </div>
      )}
      {!lobby && !error && !tableCode && <p className="poker-hall__vide" role="status">{t("Le hall ouvre ses portes…")}</p>}

      {tableCode && (
        <section className="poker-place papier" aria-label={t("Ta table")}>
          <div className="poker-place__texte">
            <strong>{seatTitle(seat)}</strong>
            <span>{t("Pour jouer ailleurs, quitte d'abord cette table.")}</span>
          </div>
          <Bouton bloc onClick={back}>{t("Reprendre ma place")}</Bouton>
        </section>
      )}

      {lobby && !tableCode && (
        <>
          <section className="rubrique" aria-labelledby="poker-hall-lieux">
            <div className="poker-hall__titre">
              <h2 id="poker-hall-lieux" className="rubrique__titre">{t("Les maîtres des lieux")}</h2>
              {/* Dès le premier défi relevé : où l'on en est des huit. */}
              {defis && defis.won > 0 && (
                <p className="poker-hall__defis">{t("Défis relevés : {n} sur {total}", { n: defis.won, total: defis.total })}</p>
              )}
            </div>
            {maitres?.open && <Maitres card={maitres} />}
            <ul className="poker-hall__lieux cascade">
              {open.map((entry) => (
                <Lieu key={entry.place.id} entry={entry} balance={balance} duel={duelOf(entry.challenge, hostWins)} />
              ))}
            </ul>
            {closed.length > 0 && (
              <ul className="poker-hall__fermes">
                {closed.map((entry) => <Ferme key={entry.place.id} entry={entry} standing={standing} />)}
              </ul>
            )}
            {maitres && !maitres.open && <MaitresFermee card={maitres} />}
          </section>

          <section className="rubrique" aria-labelledby="poker-hall-amis">
            <h2 id="poker-hall-amis" className="rubrique__titre">{t("Entre amis")}</h2>
            {/* Deux façons de jouer, choisies en créant la table : classique, ou aux règles de la Table des Maîtres. */}
            <p className="note poker-hall__modes">{t("Une table classique, ou aux règles de la Table des Maîtres : tu choisis en la créant.")}</p>
            <div className="poker-hall__amis">
              <Bouton
                variante="secondaire"
                bloc
                disabled={lobby.blinds.length === 0}
                onClick={() => nav.push({ name: "poker-feuille", feuille: "creer" })}
              >
                {t("Créer une table")}
              </Bouton>
              <Bouton variante="secondaire" bloc onClick={() => nav.push({ name: "poker-feuille", feuille: "rejoindre" })}>
                {t("Rejoindre avec un code")}
              </Bouton>
            </div>
            {lobby.blinds.length === 0 && (
              <p className="note">
                {t("Pour créer une table, il faut {montant} en bourse : quarante blindes.", { montant: formatEuros(BLIND_LADDER[0]! * BLIND_SHARE) })}
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
