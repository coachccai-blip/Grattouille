// Le Domaine (BRIEF.md, section 9.4) : l'écran d'accueil montre ce que le joueur est
// devenu. Du fond vers l'avant : ciel du meilleur lieu débloqué, résidence choisie,
// véhicule à gauche, avatar au centre, trésors sur une console à droite. Et parfois,
// par terre, un ticket que quelqu'un a laissé tomber.
//
// Sous la scène, Piou dit quoi faire ensuite (RECIT.md) : une seule consigne à la fois,
// la prochaine étape utile, du premier ticket du quai jusqu'au rachat du Kiosque. Quand
// il parle d'un objectif chiffré (les ★ du prochain lieu, la collection), sa barre de
// progression est dans la bulle : l'information n'est écrite qu'une fois à l'écran, et
// l'écran tient sans défiler.

import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { CATALOG, COLLECTION_SIZE, KIOSK, itemById } from "../../../shared/catalog";
import { formatEuros } from "../../../shared/format";
import { PLACES } from "../../../shared/places";
import { bestPlace, collectionComplete, nextPlace } from "../../../shared/rules";
import type { PlayerState, ShopId } from "../../../shared/types";
import { PIOU, hostName } from "../../app/dialogues";
import { skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import { displayBalance, isBroke, isCalm, patchSettings, toScratch, useFound, useGame } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { t } from "../../i18n";
import { itemName, keeperName, placeMoment, placeShort, rankName } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Bourse, Standing, useCompteSouvenir } from "../../ui/Bourse";
import { Barre, BulleLibre, Entete, Phrase } from "../../ui/Commun";
import { useFoundSparkle, usePickUp } from "../../ui/Trouve";
import { EntreeTrophees } from "../trophees/Entree";
import "./domaine.css";

/** Le tout premier ticket, sous cloche : exposé chez qui a vu la vraie fin. Son dessin n'arrive que pour lui. */
const Cloche = lazy((): Promise<{ default: ComponentType }> => import("./Cloche").catch(() => ({ default: () => null })));

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
const versBoutique = (shop: ShopId) => nav.reset([{ name: "boutiques" }, { name: "boutique", shop }]);
const versJeu = () => nav.reset([{ name: "promenade" }]);
const versKiosque = () => nav.reset([{ name: "promenade" }, { name: "comptoir", place: "kiosque" }]);
const versPile = () => nav.push({ name: "a-gratter" });
const versClassement = () => nav.reset([{ name: "classement" }]);
const versCarnet = () => nav.push({ name: "carnet" });
const versPoker = () => nav.reset([{ name: "promenade" }, { name: "poker" }]);

/** Le chemin que Piou indique : un lien sous sa phrase. */
function Chemin({ vers, attente, children }: { vers: () => void; attente?: boolean; children: ReactNode }) {
  return <Bouton variante="texte" attente={attente} onClick={vers}>{children}</Bouton>;
}

/** « Aller chez Mlle Sidonie » : le chemin d'une boutique, au nom de qui la tient. */
function ChezVendeur({ shop }: { shop: ShopId }) {
  return <Chemin vers={() => versBoutique(shop)}>{t("Aller chez {vendeur}", { vendeur: keeperName(shop) })}</Chemin>;
}

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
      return { texte, actions: <Chemin vers={pickUp} attente={busy}>{t("Ramasser le ticket")}</Chemin> };
    }
    // Des tickets attendent dans la pile : rien de plus utile que de les gratter. Pour le
    // tout premier (ramassé, donc compté, mais pas encore gagnant), Piou explique le geste.
    if (waiting > 0) {
      const premier = player.stats.tickets <= 1 && player.stats.winners === 0;
      return {
        texte: premier ? PIOU.aGratter : PIOU.pile(waiting),
        actions: <Chemin vers={versPile}>{waiting > 1 ? t("Gratter mes tickets") : t("Gratter mon ticket")}</Chemin>,
      };
    }
    // Plus de quoi jouer, et rien par terre pour l'instant : cela ne dure pas vingt secondes.
    if (broke) return { texte: PIOU.fauche };
    // Après une dizaine de tickets : invitation non bloquante à noter son code.
    if (!sandbox && !codeNote && player.stats.tickets >= 10) {
      return {
        texte: PIOU.code,
        actions: (
          <span className="conseil__actions">
            <Chemin vers={() => nav.push({ name: "reglages" })}>{t("Voir mon code")}</Chemin>
            <Chemin vers={() => patchSettings({ codeNote: true })}>{t("Plus tard")}</Chemin>
          </span>
        ),
      };
    }
    // Après la fin : le Patron sème à son tour, huit maîtres des lieux restent à ruiner (il
    // paraît que personne n'y est arrivé), et il reste une fortune à faire grossir. Piou passe
    // d'un sujet à l'autre à mesure qu'on joue : la phrase ne change pas tant qu'on ne fait rien.
    if (player.kiosk) {
      const { stats, defis, story } = player;
      const tour = (stats.tickets + stats.sown + player.pokerStats.hands) % 4;
      const carnet = <Chemin vers={versCarnet}>{t("Ouvrir le Carnet du Patron")}</Chemin>;
      const indice = defis.length < PLACES.length
        ? {
          texte: PIOU.maitres(defis.length),
          barre: { value: defis.length, max: PLACES.length },
          actions: <Chemin vers={versPoker}>{t("Aller au Poker Tricheur")}</Chemin>,
        }
        : null;
      if (tour === 3) return { texte: PIOU.patron, actions: <Chemin vers={versClassement}>{t("Voir le classement")}</Chemin> };
      // Tant qu'il n'a presque rien semé, Piou dit d'abord comment on s'y prend.
      if (stats.sown < 2 ? tour !== 1 : tour === 1) return { texte: PIOU.semeur(stats.sown), actions: carnet };
      return indice ?? (story.vraieFin ? { texte: PIOU.legende } : { texte: PIOU.semeur(stats.sown), actions: carnet });
    }

    // Les premiers euros, et encore rien à soi : une ficelle chez Mlle Sidonie, ou d'abord un tour au Kiosque.
    if (player.owned.length === 0) {
      return balance >= 3
        ? { texte: PIOU.ficelle(formatEuros(balance)), actions: <ChezVendeur shop="sidonie" /> }
        : { texte: PIOU.kiosque, actions: <Chemin vers={versKiosque}>{t("Aller au Kiosque")}</Chemin> };
    }

    // Les ★ s'achètent en boutique ; quand la bourse ne suit pas, on retourne d'abord au comptoir.
    const missing = cheapestMissing(player.owned);
    const canShop = missing !== null && balance >= missing;
    const chemin = canShop
      ? <Chemin vers={versBoutiques}>{t("Aller aux boutiques")}</Chemin>
      : <Chemin vers={versJeu}>{t("Aller jouer")}</Chemin>;

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
    // Collection complète : le Kiosque est à vendre. Mme Colette s'en charge, quand la bourse suit.
    const prix = formatEuros(KIOSK.price);
    return balance >= KIOSK.price
      ? { texte: PIOU.kiosqueAVendre(prix), actions: <ChezVendeur shop="colette" /> }
      : { texte: PIOU.kiosqueAVendre(prix, formatEuros(KIOSK.price - balance)), actions: <Chemin vers={versJeu}>{t("Aller jouer")}</Chemin> };
  })();

  return (
    <BulleLibre pnj="piou" nom={hostName("piou")} className="conseil" voix={avis.texte}>
      <Phrase text={avis.texte} />
      {avis.barre && <Barre value={avis.barre.value} max={avis.barre.max} />}
      {avis.actions}
    </BulleLibre>
  );
}

export function Domaine() {
  const player = useGame((s) => s.player);
  const found = useFound();
  const { busy, pickUp } = usePickUp();
  const calm = useGame(isCalm);
  // Le ticket qui traîne scintille en apparaissant ; la fortune défile quand on revient plus riche.
  useFoundSparkle(found !== null);
  const fortune = useCompteSouvenir(player ? `fortune:${player.id}` : undefined, player?.fortune ?? 0, calm ? 0 : 900);
  if (!player) return null;
  const best = bestPlace(player.standing);
  const residence = player.look.residence;
  const vehicle = player.look.vehicule;
  const treasures = topTreasures(player.owned);
  const ownsResidences = player.owned.some((id) => itemById(id)?.slot === "residence");
  const ownsVehicles = player.owned.some((id) => itemById(id)?.slot === "vehicule");
  const legende = player.kiosk && player.story.vraieFin;

  return (
    <main className="ecran ecran--onglets domaine cascade">
      <Entete
        titre={t("Domaine")}
        titreDiscret
        gauche={
          <button type="button" className="entete__bouton" onClick={() => nav.push({ name: "reglages" })} aria-label={t("Réglages")}>
            <Icon name="reglages" />
          </button>
        }
        droite={<><Bourse /><Standing souvenir={`standing:${player.id}`} /></>}
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
        {/* Les entrées posées sur le ciel, en haut à droite : les trophées (une autre peut venir à côté). */}
        <div className="domaine__entrees">
          {/* Le Carnet du Patron : ce qu'il a semé, et les nouvelles de ses protégés. */}
          {player.kiosk && (
            <button type="button" className="entree-carnet" onClick={versCarnet} aria-label={t("Ouvrir le Carnet du Patron")}>
              <span className="entree-carnet__plaque" aria-hidden="true">
                <svg width="16" height="20" viewBox="0 0 16 20" focusable="false">
                  <rect x="2" y="1" width="13" height="18" rx="2" fill="#1F6F57" />
                  <rect x="5.500" y="5" width="7" height="4" rx="1" fill="#FFF7E6" />
                  <path d="M0.800 5H4M0.800 10H4M0.800 15H4" fill="none" stroke="#C99A3A" strokeWidth="1.600" strokeLinecap="round" />
                </svg>
                {t("Carnet")}
              </span>
            </button>
          )}
          <EntreeTrophees />
        </div>
      </div>

      <div className={cx("domaine__identite", legende && "domaine__identite--legende")}>
        <h2 className="t-titre">{player.pseudo}</h2>
        <p className="domaine__fortune">
          <span className={cx("domaine__rang", player.kiosk && "domaine__rang--patron", legende && "domaine__rang--legende")}>
            {rankName(player.standing, player.kiosk, player.story.vraieFin)}
          </span>
          {t("Fortune :")} <strong className="chiffres">{formatEuros(fortune)}</strong>
        </p>
        {/* La vraie fin vue, le tout premier ticket est exposé sous cloche, à côté du nom. */}
        {legende && <Suspense fallback={null}><Cloche /></Suspense>}
      </div>

      <Conseil player={player} found={found} busy={busy} pickUp={pickUp} />
      <p className="invisible">{t("{moment} à Grattouille-les-Bains.", { moment: placeMoment(best.id) })}</p>
    </main>
  );
}
