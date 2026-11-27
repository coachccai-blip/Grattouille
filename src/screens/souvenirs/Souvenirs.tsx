// Les Souvenirs (LOT4.md, section 12) : ce que le joueur a vécu, et ce que les maîtres des
// lieux veulent bien lui raconter. On y arrive par les Réglages.
//
// - Les deux fins, à revoir une fois vues. Avant, un mystère : on ne dit pas ce qu'elles sont,
//   et la deuxième ne se devine qu'après la première.
// - Les huit maîtres des lieux, dans l'ordre de la Promenade. Le défi d'un hôte, au poker, se
//   joue en trois manches, de plus en plus chères (LOT4.md, section 15) : qui les remporte
//   toutes les trois l'entend raconter son histoire. Avant : ses manches gagnées sur trois.
//   Un hôte dont le lieu n'est pas encore ouvert reste dans l'ombre : on ne présente pas
//   quelqu'un avant l'heure.
//
// Revoir un souvenir ne dit rien au serveur. Ce que l'appareil retient : quelles histoires
// ont été regardées (« Nouveau » sinon), et si c'était avec leur dernier temps, celui
// d'après la vraie fin (« Un mot de plus » sinon).

import type { ReactNode } from "react";
import { PLACES } from "../../../shared/places";
import { HOST_STORY_WINS, hostStoryOpen, isPlaceOpen } from "../../../shared/rules";
import type { PlaceDef, PlayerState } from "../../../shared/types";
import { FIN, hostName } from "../../app/dialogues";
import { capitalize } from "../../app/helpers";
import { nav } from "../../app/nav";
import { replayMemory, storiesSeen, useGame } from "../../app/store";
import { HISTOIRES } from "../../app/suite/histoires";
import { t } from "../../app/suite/mots";
import { Illustration, Portrait } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { pick } from "../../i18n";
import { placeShort } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Carte } from "../../ui/Carte";
import { Entete } from "../../ui/Commun";
import "../reglages/reglages.css";
import "./souvenirs.css";

/** Le titre d'une fin qu'on n'a pas vue : le même dans toutes les langues. */
const INCONNU = "???";

/** Celles dont on dit « elle te raconte ». */
const DAMES = new Set<string>(["ondine", "selene"]);

const versPoker = () => nav.reset([{ name: "promenade" }, { name: "poker" }]);

/** Où en est le défi d'un hôte : ses manches remportées sur trois, et ce qu'il en reste avant son histoire. */
function resteAFaire(victoires: number, dame: boolean): string {
  if (victoires <= 0) return t("Son défi au poker : trois manches à remporter.");
  const manches = { n: victoires, max: HOST_STORY_WINS };
  if (HOST_STORY_WINS - victoires === 1) {
    return dame
      ? t("Manche {n} sur {max} remportée. Encore une, et elle te raconte son histoire.", manches)
      : t("Manche {n} sur {max} remportée. Encore une, et il te raconte son histoire.", manches);
  }
  return dame
    ? t("Manche {n} sur {max} remportée. Encore deux, et elle te raconte son histoire.", manches)
    : t("Manche {n} sur {max} remportée. Encore deux, et il te raconte son histoire.", manches);
}

/** Les manches remportées sur trois : un pion plein par manche. */
function Pions({ victoires }: { victoires: number }) {
  return (
    <span className="pions" role="img" aria-label={t("{n} sur {max}", { n: victoires, max: HOST_STORY_WINS })}>
      {Array.from({ length: HOST_STORY_WINS }, (_, i) => <span key={i} className={cx("pion", i < victoires && "pion--gagne")} />)}
    </span>
  );
}

/** Un souvenir qui se rejoue : toute la carte se touche. */
function Rejouer({ image, titre, sous, action, marque, lu, onClick }: {
  image: ReactNode; titre: string; sous: string; action: string; marque?: string; lu: string; onClick: () => void;
}) {
  return (
    <button type="button" className="souvenir souvenir--ouvert" onClick={onClick} aria-label={lu}>
      {image}
      <span className="souvenir__texte">
        <span className="souvenir__nom">{titre}</span>
        <span className="souvenir__sous">{sous}</span>
        <span className="souvenir__pied">
          <span className={cx("souvenir__action", marque && "souvenir__action--neuf")}>{action}</span>
          {marque && <span className="souvenir__marque">{marque}</span>}
        </span>
      </span>
      <Icon name="chevron" className="souvenir__chevron" />
    </button>
  );
}

/** Un souvenir qui n'est pas encore là : une ombre, et ce qu'on peut en dire. */
function Mystere({ titre, sous, children }: { titre: string; sous: string; children?: ReactNode }) {
  return (
    <div className="souvenir souvenir--ferme">
      <span className="souvenir__image souvenir__image--mystere" aria-hidden="true"><Icon name="cadenas" /></span>
      <span className="souvenir__texte">
        <span className="souvenir__nom">{titre}</span>
        <span className="souvenir__sous">{sous}</span>
        {children}
      </span>
    </div>
  );
}

/** L'histoire d'un hôte : ouverte, en chemin, ou encore dans l'ombre. */
function Hote({ place, player, vues }: { place: PlaceDef; player: PlayerState; vues: readonly string[] }) {
  const nom = hostName(place.host);
  const lieu = capitalize(placeShort(place.id));
  const victoires = player.hostWins[place.id] ?? 0;

  if (hostStoryOpen(player.hostWins, place.id)) {
    const histoire = HISTOIRES[place.id];
    const titre = pick(histoire.titre);
    const complete = vues.includes(`${place.id}+`);
    const entamee = complete || vues.includes(place.id);
    // Regardée avant la vraie fin : depuis, l'hôte y a ajouté un mot.
    const unMotDePlus = entamee && !complete && player.story.vraieFin;
    const marque = !entamee ? t("Nouveau") : unMotDePlus ? t("Un mot de plus") : undefined;
    return (
      <Rejouer
        image={<Portrait pnj={place.host} className="souvenir__image" />}
        titre={nom}
        sous={t("{lieu} · « {titre} »", { lieu, titre })}
        action={entamee ? t("Revoir") : t("Écouter")}
        marque={marque}
        lu={entamee
          ? t("Revoir l'histoire de {nom} : {titre}", { nom, titre })
          : t("Écouter l'histoire de {nom} : {titre}", { nom, titre })}
        onClick={() => nav.push({ name: "histoire", lieu: place.id })}
      />
    );
  }

  // Jamais battu, et son lieu n'est pas encore ouvert : le joueur ne le connaît pas.
  if (victoires <= 0 && !isPlaceOpen(place.id, player.standing)) {
    return <Mystere titre={lieu} sous={t("Tu ne connais pas encore son hôte.")} />;
  }

  return (
    <div className="souvenir souvenir--ferme">
      <Portrait pnj={place.host} className="souvenir__image souvenir__image--attend" />
      <span className="souvenir__texte">
        <span className="souvenir__nom">{nom}</span>
        <span className="souvenir__sous">{lieu}</span>
        <span className="souvenir__pied">
          <Pions victoires={victoires} />
          <span className="souvenir__reste">{resteAFaire(victoires, DAMES.has(place.host))}</span>
        </span>
      </span>
    </div>
  );
}

export function Souvenirs() {
  const player = useGame((s) => s.player);
  const vues = useGame(storiesSeen);
  if (!player) return null;
  const { fin, vraieFin } = player.story;
  const fermees = PLACES.some((place) => !hostStoryOpen(player.hostWins, place.id));
  const titreFin = FIN.titre;
  const titreVraieFin = t("Huit as de cœur");

  return (
    <main className="ecran souvenirs cascade">
      <Entete titre={t("Souvenirs")} retour />
      <p className="souvenirs__chapeau">
        {t("Ce que tu as vécu à Grattouille, et ce que les maîtres des lieux veulent bien te raconter.")}
      </p>

      <section className="rubrique" aria-labelledby="souvenirs-fins">
        <h2 className="rubrique__titre" id="souvenirs-fins">{t("Les fins de l'histoire")}</h2>
        <ul className="souvenirs__liste">
          <li>
            {fin ? (
              <Rejouer
                image={<span className="souvenir__image souvenir__image--vue"><Illustration id="item:kiosque" /></span>}
                titre={titreFin}
                sous={t("Le jour où Gaspard t'a remis les clés.")}
                action={t("Revoir")}
                lu={t("Revoir : {titre}", { titre: titreFin })}
                onClick={() => replayMemory("fin")}
              />
            ) : (
              <Mystere titre={INCONNU} sous={t("L'histoire a une fin. Elle n'est pas pour tout de suite.")} />
            )}
          </li>
          {/* La deuxième fin ne se devine qu'une fois la première vue. */}
          {fin && (
            <li>
              {vraieFin ? (
                <Rejouer
                  image={<span className="souvenir__image souvenir__image--carte"><Carte carte="Ah" /></span>}
                  titre={titreVraieFin}
                  sous={t("Le matin où ils t'attendaient tous sur le quai.")}
                  action={t("Revoir")}
                  lu={t("Revoir : {titre}", { titre: titreVraieFin })}
                  onClick={() => replayMemory("vraie-fin")}
                />
              ) : (
                <Mystere titre={INCONNU} sous={t("Il paraît que l'histoire a une autre fin.")} />
              )}
            </li>
          )}
        </ul>
      </section>

      <section className="rubrique" aria-labelledby="souvenirs-hotes">
        <h2 className="rubrique__titre" id="souvenirs-hotes">{t("Les histoires des hôtes")}</h2>
        <p className="note">
          {t("Remporte les trois manches du défi d'un maître des lieux, au poker : il te racontera son histoire.")}
        </p>
        <ul className="souvenirs__liste">
          {PLACES.map((place) => <li key={place.id}><Hote place={place} player={player} vues={vues} /></li>)}
        </ul>
        {vraieFin && <p className="note">{t("Maintenant que tu sais, chacun a ajouté un mot à son histoire.")}</p>}
        {fermees && <Bouton variante="secondaire" onClick={versPoker}>{t("Aller au Poker Tricheur")}</Bouton>}
      </section>

      <p className="note souvenirs__pied">{t("Revoir un souvenir ne change rien à ton compte.")}</p>
    </main>
  );
}
