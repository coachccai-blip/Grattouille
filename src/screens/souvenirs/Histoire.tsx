// L'histoire d'un maître des lieux (LOT4.md, section 12) : sa cinématique personnelle.
// Qui l'a battu trois fois au poker l'écoute raconter, à la première personne, comment il
// a débarqué à Grattouille-les-Bains et ce qu'il y est devenu. C'est un album : une photo
// par temps, sa légende de la main de l'hôte, et ce qu'il en dit. Le joueur tourne les
// pages ; son bouton dit ce qu'il demande.
//
// Ce qui s'y dit est dans src/app/suite/histoires.ts, les photos dessinées exprès dans
// src/art/suite/histoires.tsx ; les autres sont les illustrations du jeu. Rien n'est dit
// au serveur : l'appareil retient seulement que l'histoire a été regardée jusqu'au bout
// (src/app/store.ts). Le dernier temps, « Maintenant que tu sais », n'existe que pour qui
// a vu la vraie fin.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { itemById } from "../../../shared/catalog";
import { isPlaceId, placeById } from "../../../shared/places";
import { hostStoryOpen } from "../../../shared/rules";
import type { PlaceId } from "../../../shared/types";
import { hostName } from "../../app/dialogues";
import { capitalize, skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import { markStorySeen, useGame } from "../../app/store";
import { ENCORE, HISTOIRES, tempsDe, type Son } from "../../app/suite/histoires";
import { t } from "../../app/suite/mots";
import { Illustration, Portrait } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { DESSINS } from "../../art/suite/histoires";
import { mouette } from "../../fx/ambiance";
import {
  playCardDeal, playChapter, playChip, playCoin, playConfession, playKeys, playKnock, playPickUp, playSparkle, playStamp,
} from "../../fx/audio";
import { pick } from "../../i18n";
import { placeShort } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import "../moments/moments.css";
import "./souvenirs.css";

/** Le bruit d'une page, une fois la photo posée. */
const SONS: Record<Son, () => void> = {
  ticket: playPickUp,
  gain: () => playCoin(0),
  cle: playKeys,
  mouette,
  porte: playKnock,
  tampon: playStamp,
  jeton: () => playChip(2),
  etoile: playSparkle,
};

/**
 * Comment une image se pose dans la photo : un dessin de l'album la remplit ; une façade
 * ou une maison se tient sous un ciel, la mouette y vole ; un portrait est cadré serré ; un
 * objet, un symbole ou un ticket est posé sur le papier de l'album, une constellation sur la nuit.
 */
type Genre = "dessin" | "ciel" | "vol" | "portrait" | "objet" | "nuit" | "ticket";

function genreDe(image: string): Genre {
  const [famille, nom = ""] = image.split(":");
  switch (famille) {
    // La mouette vole dans le ciel de l'album : elle n'a pas de fond à elle.
    case "dessin": return nom === "mouette" ? "vol" : "dessin";
    case "place":
    case "decor": return "ciel";
    case "pnj": return "portrait";
    case "ticket": return "ticket";
    // Une résidence a son sol et veut un ciel ; le Kiosque n'est pas au catalogue, mais c'en est une.
    case "item": return nom === "kiosque" || itemById(nom)?.slot === "residence" ? "ciel" : "objet";
    // Une constellation est faite pour la nuit ; les autres symboles, pour le papier.
    case "symbole": return nom === "constellation" ? "nuit" : "objet";
    default: return "objet";
  }
}

/** La photo d'un temps : l'image, dans son cadre. Le ciel est celui du lieu photographié, ou de l'hôte qui raconte. */
function Photo({ image, lieu }: { image: string; lieu: PlaceId }) {
  const genre = genreDe(image);
  const [famille, nom = ""] = image.split(":");
  const Dessin = famille === "dessin" ? DESSINS[nom] : undefined;
  const ciel = famille === "place" && isPlaceId(nom) ? nom : lieu;
  const style: CSSProperties | undefined = genre === "ciel" || genre === "vol" ? { backgroundImage: skyOf(ciel) } : undefined;
  return (
    <div className={cx("histoire__vue", `histoire__vue--${genre}`)} style={style}>
      {Dessin ? <Dessin /> : <Illustration id={image} />}
    </div>
  );
}

export function Histoire({ lieu }: { lieu: PlaceId }) {
  const player = useGame((s) => s.player);
  const histoire = HISTOIRES[lieu];
  const ouverte = !!player && hostStoryOpen(player.hostWins, lieu);
  // Fixé à l'ouverture : l'histoire ne change pas de longueur en cours de route.
  const [temps] = useState(() => tempsDe(lieu, useGame.getState().player?.story.vraieFin === true));
  const [index, setIndex] = useState(0);
  const corps = useRef<HTMLDivElement>(null);
  const page = temps[index]!;
  const dernier = index === temps.length - 1;
  const apres = page === histoire.apres;
  const nom = hostName(histoire.hote);

  // Une histoire qui n'est pas ouverte ne se raconte pas : on referme.
  useEffect(() => {
    if (!ouverte) nav.back();
  }, [ouverte]);

  // Le carton du chapitre à l'ouverture ; ensuite la photo glisse sur l'album. Le dernier
  // temps se pose comme un aveu. Puis le bruit de ce que montre la photo.
  useEffect(() => {
    if (!ouverte) return;
    const timers: number[] = [];
    if (index === 0) timers.push(window.setTimeout(playChapter, 240));
    else {
      if (apres) playConfession();
      else playCardDeal();
      corps.current?.focus();
    }
    const son = page.son;
    if (son) timers.push(window.setTimeout(SONS[son], index === 0 ? 900 : apres ? 1500 : 420));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [index, ouverte, apres, page.son]);

  if (!ouverte) return null;

  const suite = () => {
    if (!dernier) {
      setIndex(index + 1);
      return;
    }
    // Regardée jusqu'au bout : l'appareil s'en souvient, et Piou n'en parle plus.
    markStorySeen(lieu);
    nav.back();
  };

  const bouton = dernier
    ? t("Refermer le souvenir")
    : page.bouton ? pick(page.bouton) : pick(ENCORE);

  return (
    <div
      className={cx("moment", "moment--histoire", apres && "histoire--apres")}
      role="dialog"
      aria-modal="true"
      aria-label={t("L'histoire de {nom}", { nom })}
    >
      <div className="histoire__album" style={{ backgroundImage: skyOf(lieu) }}>
        <figure className={cx("histoire__photo", index % 2 === 1 && "histoire__photo--penchee")} key={index}>
          <Photo image={page.image} lieu={lieu} />
          <figcaption className="histoire__legende">{pick(page.legende)}</figcaption>
        </figure>
      </div>
      <div className="moment__corps moment__temps histoire__corps" key={index} ref={corps} tabIndex={-1}>
        <div className="histoire__qui">
          <Portrait pnj={histoire.hote} className="histoire__portrait" />
          <p className="histoire__nom">
            <span className="t-fort">{nom}</span>
            <span className="histoire__ou">
              {capitalize(placeShort(placeById(lieu).id))}
              <span className="histoire__page chiffres" aria-label={t("Page {n} sur {max}", { n: index + 1, max: temps.length })}>
                {index + 1} / {temps.length}
              </span>
            </span>
          </p>
          {/* Refermer l'album avant la fin : l'histoire reste à écouter. */}
          <button type="button" className="histoire__fermer" onClick={() => nav.back()} aria-label={t("Refermer le souvenir")}>
            <Icon name="fermer" />
          </button>
        </div>
        {index === 0 && <h1 className="histoire__titre">{pick(histoire.titre)}</h1>}
        {apres && <p className="moment__chapitre">{t("Maintenant que tu sais")}</p>}
        <div className="moment__bulles histoire__bulles">
          {pick(page.dit).map((ligne, i) => (
            <p key={i} className="bulle__texte">{t("« {replique} »", { replique: ligne })}</p>
          ))}
        </div>
        <Bouton bloc onClick={suite}>{bouton}</Bouton>
      </div>
    </div>
  );
}
