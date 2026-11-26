// Le Domaine (BRIEF.md, section 9.4) : l'écran d'accueil montre ce que le joueur est
// devenu. Du fond vers l'avant : ciel du meilleur lieu débloqué, résidence choisie,
// véhicule à gauche, avatar au centre, trésors sur une console à droite. Et parfois,
// par terre, un ticket que quelqu'un a laissé tomber.

import { CATALOG, COLLECTION_SIZE, KIOSK, itemById } from "../../../shared/catalog";
import { formatEuros, formatInt } from "../../../shared/format";
import { bestPlace, nextPlace, rankOf } from "../../../shared/rules";
import type { PlayerState } from "../../../shared/types";
import { PIOU } from "../../app/dialogues";
import { capitalize, pluriel, skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import { displayBalance, patchSettings, toScratch, useFound, useGame } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { Bouton } from "../../ui/Bouton";
import { cx } from "../../ticket/parts";
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

/** Carte d'objectif : le prochain lieu et sa barre de ★, puis la collection, puis le Kiosque. */
function Objectif({ player }: { player: PlayerState }) {
  const next = nextPlace(player.standing);
  if (next) {
    return (
      <section className="objectif" aria-label="Objectif">
        <p className="objectif__titre">Prochain lieu : {next.short}</p>
        <p className="objectif__compte"><Phrase text={`★ ${formatInt(player.standing)} sur ${formatInt(next.standing)}`} /></p>
        <Barre value={player.standing} max={next.standing} />
      </section>
    );
  }
  if (player.owned.length < COLLECTION_SIZE) {
    return (
      <section className="objectif" aria-label="Objectif">
        <p className="objectif__titre">Collection : {player.owned.length} sur {COLLECTION_SIZE}</p>
        <p className="objectif__compte">Quand elle sera complète, Mme Colette aura une surprise.</p>
        <Barre value={player.owned.length} max={COLLECTION_SIZE} />
      </section>
    );
  }
  if (!player.kiosk) {
    return (
      <button type="button" className="objectif objectif--kiosque" onClick={() => nav.reset([{ name: "boutiques" }, { name: "boutique", shop: "colette" }])}>
        <span className="objectif__titre">Le Kiosque est à vendre</span>
        <span className="objectif__compte">Mme Colette vous attend à l'agence. {formatEuros(KIOSK.price)}.</span>
      </button>
    );
  }
  return (
    <section className="objectif objectif--patron" aria-label="Objectif">
      <p className="objectif__titre">Patron du Kiosque</p>
      <p className="objectif__compte">La collection est complète. Il reste une fortune à faire grossir.</p>
    </section>
  );
}

/** Un seul conseil à la fois : Piou guide le début de partie, sans jamais bloquer. */
function Conseil({ player, found, busy, pickUp }: {
  player: PlayerState; found: "fauche" | "chance" | null; busy: boolean; pickUp: () => void;
}) {
  const balance = useGame(displayBalance);
  const codeNote = useGame((s) => s.settings.codeNote);
  const sandbox = useGame((s) => s.sandbox);

  // Un ticket traîne par terre : c'est la première chose à dire.
  if (found) {
    return (
      <BulleLibre pnj="piou" nom="Piou" className="conseil">
        {player.stats.tickets === 0 ? PIOU.premierTrouve : found === "fauche" ? PIOU.parTerre : PIOU.chance}
        <Bouton variante="texte" attente={busy} onClick={pickUp}>Ramasser le ticket</Bouton>
      </BulleLibre>
    );
  }
  if (player.stats.tickets <= 1 && player.owned.length === 0 && balance < 3) {
    return (
      <BulleLibre pnj="piou" nom="Piou" className="conseil">
        {PIOU.kiosque}
        <Bouton variante="texte" onClick={() => nav.reset([{ name: "promenade" }, { name: "comptoir", place: "kiosque" }])}>Aller au Kiosque</Bouton>
      </BulleLibre>
    );
  }
  if (player.owned.length === 0 && balance >= 3) {
    return (
      <BulleLibre pnj="piou" nom="Piou" className="conseil">
        {PIOU.ficelle(formatEuros(balance))}
        <Bouton variante="texte" onClick={() => nav.reset([{ name: "boutiques" }, { name: "boutique", shop: "sidonie" }])}>Aller chez Sidonie</Bouton>
      </BulleLibre>
    );
  }
  // Après une dizaine de tickets : invitation non bloquante à noter son code.
  if (!sandbox && !codeNote && player.stats.tickets >= 10) {
    return (
      <BulleLibre pnj="piou" nom="Piou" className="conseil">
        {PIOU.code}
        <span className="conseil__actions">
          <Bouton variante="texte" onClick={() => nav.push({ name: "reglages" })}>Voir mon code</Bouton>
          <Bouton variante="texte" onClick={() => patchSettings({ codeNote: true })}>Plus tard</Bouton>
        </span>
      </BulleLibre>
    );
  }
  return null;
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
        titre="Domaine"
        titreDiscret
        gauche={
          <button type="button" className="entete__bouton" onClick={() => nav.push({ name: "reglages" })} aria-label="Réglages">
            <Icon name="reglages" />
          </button>
        }
        droite={<><Bourse /><Standing /></>}
      />

      <div className={cx("domaine__scene", found && "domaine__scene--trouve")} style={{ backgroundImage: skyOf(best.id) }}>
        <button
          type="button"
          className="domaine__residence"
          onClick={() => (ownsResidences ? nav.push({ name: "choix-domaine", slot: "residence" }) : nav.reset([{ name: "boutiques" }, { name: "boutique", shop: "colette" }]))}
          aria-label={residence ? `Résidence : ${itemById(residence)?.name}. Changer de résidence` : "Pas encore de résidence : le banc du port. Voir l'Agence Colette"}
        >
          <Illustration id={residence ? `item:${residence}` : "decor:banc"} />
        </button>
        {(vehicle || ownsVehicles) && (
          <button
            type="button"
            className="domaine__vehicule"
            onClick={() => nav.push({ name: "choix-domaine", slot: "vehicule" })}
            aria-label={vehicle ? `Véhicule : ${itemById(vehicle)?.name}. Changer de véhicule` : "À pied. Choisir un véhicule"}
          >
            {vehicle ? <Illustration id={`item:${vehicle}`} /> : <span className="domaine__a-pied">à pied</span>}
          </button>
        )}
        {treasures.length > 0 && (
          <div className="domaine__tresors" aria-label={`Trésors exposés : ${treasures.map((id) => itemById(id)?.name).join(", ")}`}>
            <div className="domaine__tresors-rang">
              {treasures.map((id) => <Illustration key={id} id={`item:${id}`} />)}
            </div>
            <span className="domaine__console" aria-hidden="true" />
          </div>
        )}
        <button type="button" className="domaine__avatar" onClick={() => nav.push({ name: "dressing" })} aria-label="Ouvrir le dressing">
          <Avatar species={player.species} look={player.look} />
        </button>
        {/* Le ticket qui traîne par terre : il brille doucement, on le ramasse d'un toucher. */}
        {found && (
          <button type="button" className="domaine__trouve" onClick={pickUp} disabled={busy} aria-label="Un ticket traîne par terre. Le ramasser">
            <span className="domaine__trouve-ticket" aria-hidden="true"><Icon name="jouer" plein size={30} /></span>
            <span className="domaine__trouve-eclat" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="domaine__identite">
        <h2 className="t-titre">{player.pseudo}</h2>
        <p className="domaine__fortune">
          <span className={cx("domaine__rang", player.kiosk && "domaine__rang--patron")}>{rankOf(player.standing, player.kiosk)}</span>
          Fortune : <strong className="chiffres">{formatEuros(player.fortune)}</strong>
        </p>
      </div>

      <Conseil player={player} found={found} busy={busy} pickUp={pickUp} />
      <Objectif player={player} />

      {waiting > 0 && (
        <button type="button" className="talon-lien" onClick={() => nav.push({ name: "a-gratter" })}>
          <Icon name="jouer" plein />
          <span>{waiting} {pluriel(waiting, "ticket")} à gratter</span>
          <Icon name="chevron" />
        </button>
      )}
      <p className="invisible">{capitalize(best.moment)} à Grattouille-les-Bains.</p>
    </main>
  );
}
