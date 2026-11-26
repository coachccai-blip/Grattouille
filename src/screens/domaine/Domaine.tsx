// Le Domaine (BRIEF.md, section 9.4) : l'écran d'accueil montre ce que le joueur est
// devenu. Du fond vers l'avant : ciel du meilleur lieu débloqué, résidence choisie,
// véhicule à gauche, avatar au centre, trésors sur une console à droite. Et parfois,
// par terre, un ticket que quelqu'un a laissé tomber.
//
// Sous la scène, Piou dit quoi faire ensuite (RECIT.md) : une seule consigne à la fois,
// la prochaine étape utile, du premier ticket du quai jusqu'au rachat du Kiosque. Quand
// il parle d'un objectif chiffré (les ★ du prochain lieu, la collection), sa barre de
// progression est dans la bulle : l'information n'est écrite qu'une fois à l'écran.

import type { ReactNode } from "react";
import { CATALOG, COLLECTION_SIZE, KIOSK, itemById } from "../../../shared/catalog";
import { formatEuros } from "../../../shared/format";
import { bestPlace, collectionComplete, nextPlace } from "../../../shared/rules";
import { cheapestTicket } from "../../../shared/tickets";
import type { PlayerState, ShopId } from "../../../shared/types";
import { PIOU, hostName } from "../../app/dialogues";
import { skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import { displayBalance, isBroke, patchSettings, toScratch, useFound, useGame } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { t } from "../../i18n";
import { itemName, keeperName, placeMoment, placeShort, rankName } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse, Standing } from "../../ui/Bourse";
import { Barre, BulleLibre, Entete, Phrase } from "../../ui/Commun";
import { usePickUp } from "../../ui/Trouve";
import "./domaine.css";

/** Les trois trésors les plus chers, pour la console. */
function topTreasures(owned: readonly string[]): string[] {
  return CATALOG.filter((i) => i.slot === "tresor" && owned.includes(i.id))
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)
    .map((i) => i.id);
}

/** Le prix du bien le moins cher qui manque encore à la collection, ou `null` si elle est complète. */
function cheapestMissing(owned: readonly string[]): number | null {
  let min: number | null = null;
  for (const item of CATALOG) {
    if (!owned.includes(item.id) && (min === null || item.price < min)) min = item.price;
  }
  return min;
}

/** Ce que Piou conseille : une phrase, parfois une barre de progression, parfois un chemin. */
interface Avis {
  texte: string;
  /** Où en est l'objectif dont parle la phrase. */
  barre?: { value: number; max: number };
  actions?: ReactNode;
}

const versBoutiques = () => nav.reset([{ name: "boutiques" }]);
const versJeu = () => nav.reset([{ name: "promenade" }]);
const versBoutique = (shop: ShopId) => nav.reset([{ name: "boutiques" }, { name: "boutique", shop }]);

/**
 * Un seul conseil à la fois, sans jamais bloquer : Piou guide toute la partie. La
 * phrase dit pourquoi, le bouton dit où aller ; ils ne se répètent pas.
 */
function Conseil({ player, found, busy, pickUp }: {
  player: PlayerState; found: "fauche" | "chance" | null; busy: boolean; pickUp: () => void;
}) {
  const balance = useGame(displayBalance);
  const waiting = useGame((s) => toScratch(s).length);
  const broke = useGame(isBroke);
  const codeNote = useGame((s) => s.settings.codeNote);
  const sandbox = useGame((s) => s.sandbox);

  const avis = ((): Avis => {
    // Un ticket traîne par terre : c'est la première chose à dire.
    if (found) {
      const texte = player.kiosk
        ? PIOU.trouvePatron
        : player.stats.tickets === 0 ? PIOU.premierTrouve : PIOU.trouve(found, player.stats.tickets);
      return { texte, actions: <Bouton variante="texte" attente={busy} onClick={pickUp}>{t("Ramasser le ticket")}</Bouton> };
    }
    // Plus de quoi jouer, et rien par terre pour l'instant : cela ne dure pas vingt secondes.
    if (broke) return { texte: PIOU.fauche };
    // Le ticket du quai est ramassé, pas encore gratté : le talon, juste dessous, y emmène.
    if (player.stats.tickets === 0 && waiting > 0) return { texte: PIOU.aGratter };
    // Après une dizaine de tickets : invitation non bloquante à noter son code.
    if (!sandbox && !codeNote && player.stats.tickets >= 10) {
      return {
        texte: PIOU.code,
        actions: (
          <span className="conseil__actions">
            <Bouton variante="texte" onClick={() => nav.push({ name: "reglages" })}>{t("Voir mon code")}</Bouton>
            <Bouton variante="texte" onClick={() => patchSettings({ codeNote: true })}>{t("Plus tard")}</Bouton>
          </span>
        ),
      };
    }
    // Après la fin : il reste une fortune à faire grossir.
    if (player.kiosk) {
      return { texte: PIOU.patron, actions: <Bouton variante="texte" onClick={() => nav.reset([{ name: "classement" }])}>{t("Voir le classement")}</Bouton> };
    }

    const missing = cheapestMissing(player.owned);
    const canShop = missing !== null && balance >= missing;
    const canPlay = balance >= cheapestTicket("kiosque").price;
    // Ni de quoi acheter ni de quoi jouer, mais des tickets en attente : le talon, juste dessous, y emmène.
    if (!canShop && !canPlay && waiting > 0) return { texte: PIOU.pile };
    // Les ★ s'achètent en boutique ; quand la bourse ne suit pas, on retourne d'abord au comptoir.
    const chemin = canShop
      ? <Bouton variante="texte" onClick={versBoutiques}>{t("Aller aux boutiques")}</Bouton>
      : <Bouton variante="texte" onClick={versJeu}>{t("Aller jouer")}</Bouton>;

    // Les premiers euros, et encore rien à soi : une ficelle chez Mlle Sidonie, ou d'abord un tour au Kiosque.
    if (player.owned.length === 0) {
      if (balance >= 3) {
        return {
          texte: PIOU.ficelle(formatEuros(balance)),
          actions: <Bouton variante="texte" onClick={() => versBoutique("sidonie")}>{t("Aller chez {vendeur}", { vendeur: keeperName("sidonie") })}</Bouton>,
        };
      }
      return {
        texte: PIOU.kiosque,
        actions: <Bouton variante="texte" onClick={() => nav.reset([{ name: "promenade" }, { name: "comptoir", place: "kiosque" }])}>{t("Aller au Kiosque")}</Bouton>,
      };
    }

    // Le prochain lieu et les ★ qui manquent. Au premier achat, Piou dit ce qu'est le Standing.
    const next = nextPlace(player.standing);
    if (next) {
      const stars = next.standing - player.standing;
      const lieu = placeShort(next.id);
      return {
        texte: player.owned.length === 1
          ? PIOU.premieresEtoiles(stars, lieu)
          : PIOU.prochainLieu(stars, lieu, canShop ? "boutiques" : "jouer", player.owned.length),
        barre: { value: player.standing, max: next.standing },
        actions: chemin,
      };
    }
    // Tout est ouvert : il reste la collection.
    if (!collectionComplete(player.owned)) {
      return {
        texte: PIOU.collection(player.owned.length, COLLECTION_SIZE),
        barre: { value: player.owned.length, max: COLLECTION_SIZE },
        actions: chemin,
      };
    }
    // Collection complète : le Kiosque est à vendre.
    if (balance >= KIOSK.price) {
      return {
        texte: PIOU.kiosqueAVendre(formatEuros(KIOSK.price)),
        actions: <Bouton variante="texte" onClick={() => versBoutique("colette")}>{t("Aller chez {vendeur}", { vendeur: keeperName("colette") })}</Bouton>,
      };
    }
    return {
      texte: PIOU.kiosqueAVendre(formatEuros(KIOSK.price), formatEuros(KIOSK.price - balance)),
      actions: <Bouton variante="texte" onClick={versJeu}>{t("Aller jouer")}</Bouton>,
    };
  })();

  return (
    <BulleLibre pnj="piou" nom={hostName("piou")} className="conseil">
      <Phrase text={avis.texte} />
      {avis.barre && <Barre value={avis.barre.value} max={avis.barre.max} />}
      {avis.actions}
    </BulleLibre>
  );
}

export function Domaine() {
  const player = useGame((s) => s.player);
  const waiting = useGame((s) => toScratch(s).length);
  const found = useFound();
  const { busy, pickUp } = usePickUp();
  if (!player) return null;
  const best = bestPlace(player.standing);
  const residence = player.look.residence;
  const vehicle = player.look.vehicule;
  const treasures = topTreasures(player.owned);
  const ownsResidences = player.owned.some((id) => itemById(id)?.slot === "residence");
  const ownsVehicles = player.owned.some((id) => itemById(id)?.slot === "vehicule");

  return (
    <main className="ecran ecran--onglets domaine">
      <Entete
        titre={t("Domaine")}
        titreDiscret
        gauche={
          <button type="button" className="entete__bouton" onClick={() => nav.push({ name: "reglages" })} aria-label={t("Réglages")}>
            <Icon name="reglages" />
          </button>
        }
        droite={<><Bourse /><Standing /></>}
      />

      <div className={cx("domaine__scene", found && "domaine__scene--trouve")} style={{ backgroundImage: skyOf(best.id) }}>
        <button
          type="button"
          className="domaine__residence"
          onClick={() => (ownsResidences ? nav.push({ name: "choix-domaine", slot: "residence" }) : versBoutique("colette"))}
          aria-label={
            residence
              ? t("Résidence : {nom}. En changer", { nom: itemName(residence) })
              : t("Pas encore de résidence : le banc du port. Voir les résidences à vendre")
          }
        >
          <Illustration id={residence ? `item:${residence}` : "decor:banc"} />
        </button>
        {(vehicle || ownsVehicles) && (
          <button
            type="button"
            className="domaine__vehicule"
            onClick={() => nav.push({ name: "choix-domaine", slot: "vehicule" })}
            aria-label={vehicle ? t("Véhicule : {nom}. En changer", { nom: itemName(vehicle) }) : t("À pied. Choisir un véhicule")}
          >
            {vehicle ? <Illustration id={`item:${vehicle}`} /> : <span className="domaine__a-pied">{t("à pied")}</span>}
          </button>
        )}
        {treasures.length > 0 && (
          <div className="domaine__tresors" role="img" aria-label={t("Trésors exposés : {liste}", { liste: treasures.map(itemName).join(", ") })}>
            <div className="domaine__tresors-rang">
              {treasures.map((id) => <Illustration key={id} id={`item:${id}`} />)}
            </div>
            <span className="domaine__console" aria-hidden="true" />
          </div>
        )}
        <button type="button" className="domaine__avatar" onClick={() => nav.push({ name: "dressing" })} aria-label={t("Ouvrir le dressing")}>
          <Avatar species={player.species} look={player.look} />
        </button>
        {/* Le ticket qui traîne par terre : il brille doucement, on le ramasse d'un toucher. */}
        {found && (
          <button type="button" className="domaine__trouve" onClick={pickUp} disabled={busy} aria-label={t("Un ticket traîne par terre. Le ramasser")}>
            <span className="domaine__trouve-ticket" aria-hidden="true"><Icon name="jouer" plein size={30} /></span>
            <span className="domaine__trouve-eclat" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="domaine__identite">
        <h2 className="t-titre">{player.pseudo}</h2>
        <p className="domaine__fortune">
          <span className={cx("domaine__rang", player.kiosk && "domaine__rang--patron")}>{rankName(player.standing, player.kiosk)}</span>
          {t("Fortune :")} <strong className="chiffres">{formatEuros(player.fortune)}</strong>
        </p>
      </div>

      <Conseil player={player} found={found} busy={busy} pickUp={pickUp} />

      {waiting > 0 && (
        <button type="button" className="talon-lien" onClick={() => nav.push({ name: "a-gratter" })}>
          <Icon name="jouer" plein />
          <span>{waiting > 1 ? t("{n} tickets à gratter", { n: waiting }) : t("1 ticket à gratter")}</span>
          <Icon name="chevron" />
        </button>
      )}
      <p className="invisible">{t("{moment} à Grattouille-les-Bains.", { moment: placeMoment(best.id) })}</p>
    </main>
  );
}
