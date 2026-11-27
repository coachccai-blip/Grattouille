// Le film d'une expérience de vie (LOT4.md, section 13) : une fois payée, elle se joue en
// plein écran, six à dix secondes, dans une scène à elle (src/art/agence/), où le joueur
// tient son rôle. Puis un déclic : la scène se fige, et c'est une carte postale, avec sa
// légende, son timbre oblitéré et un bouton pour continuer. Un appui passe le film ; en
// animations réduites, on a d'emblée la carte postale.
//
// Ouverte depuis l'album de la section Trophées (`photo`), c'est la carte postale qu'on
// regarde d'abord : elle est déjà prise, elle se pose sans déclic, sans air et sans cachet
// qui tombe. « Revivre » rejoue alors le film, qui se fige de nouveau en carte postale.
//
// Le film est une feuille de la navigation, posée par-dessus le catalogue : le bouton
// retour du téléphone le referme. Il porte la classe `moment` (et `data-plein-ecran`) :
// tant qu'il est à l'écran, aucune médaille ne s'annonce par-dessus.
//
// Ce module et les trente scènes forment un morceau à part, chargé par films.ts. La photo
// d'une expérience (Photo.tsx), que l'album affiche, voyage avec lui.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EXPERIENCE_COUNT, knownExperiences } from "../../../shared/experiences";
import type { Tier } from "../../../shared/rules";
import { nav } from "../../app/nav";
import { isCalm, useGame } from "../../app/store";
import { SCENES, type Son } from "../../art/agence/scenes";
import { Timbre } from "../../art/agence/timbres";
import { mouette } from "../../fx/ambiance";
import {
  playAccuse, playCardDeal, playCardFlip, playChapter, playChirp, playClick, playCoin, playConfession, playDice, playFold,
  playInnocent, playKeys, playKnock, playLetter, playMatch, playOpening, playPawnStep, playPickUp, playPot, playSleight,
  playSparkle, playStamp, playStars, playSweep, playTicketBought, playTicketDrop, playTier, playUnmasked,
} from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Fx } from "../../fx/particles";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { t } from "./mots";
import { CADRE } from "./Photo";
import { chapitreDe, legendeDe, nomExperience, type Chapitre } from "./textes";
import "../moments/moments.css";
import "./film.css";

export { Photo } from "./Photo";

/** Les bruits d'un film : ceux du jeu, sous le nom de ce qu'ils racontent ici. */
const BRUITS: Record<Son, (n?: number) => void> = {
  mouette,
  oiseau: playChirp,
  hop: playPickUp,
  ding: (n) => playCoin(n ?? 0),
  scintille: playSparkle,
  souffle: playSweep,
  toc: (n) => playPawnStep(n ?? 0),
  coups: playKnock,
  roule: playDice,
  carillon: playLetter,
  accord: (n) => playMatch(n ?? 0),
  gamme: (n) => playStars(n ?? 5),
  grelots: playKeys,
  glisse: playFold,
  degringole: playUnmasked,
  halo: playInnocent,
  tendre: playConfession,
  fanfare: playOpening,
  clap: playAccuse,
  bravo: playPot,
  tic: (n) => playClick(n ?? 0),
  clin: playSleight,
  volette: playTicketDrop,
  cliquetis: () => playTicketBought(5),
  frotte: playCardDeal,
  declic: playCardFlip,
};

/** L'air qui salue la carte postale : plus l'expérience est folle, plus il est riche. */
const AIRS: Record<Chapitre["id"], Tier> = { port: "petit", voyages: "joli", folies: "gros", ciel: "enorme", derniere: "jackpot" };

interface FilmProps {
  experience: string;
  /** Elle vient d'être payée : la carte postale se fête. */
  premiere: boolean;
  /** Ouverte depuis l'album : la carte postale d'abord, le film si on le redemande. */
  photo?: boolean;
}

export function Film({ experience, premiere, photo = false }: FilmProps) {
  const calm = useGame(isCalm);
  const espece = useGame((s) => s.player?.species ?? "renard");
  const look = useGame((s) => s.player?.look) ?? {};
  // Le rang du souvenir : la combientième expérience que le joueur a vécue.
  const rang = useGame((s) => (s.player ? knownExperiences(s.player.experiences).indexOf(experience) + 1 : 0));
  const scene = SCENES[experience];
  const [carte, setCarte] = useState(calm || photo);
  /** La carte sort de l'album, et le film n'a pas été rejoué : elle se pose sans bruit. */
  const [rangee, setRangee] = useState(photo);
  const [sortie, setSortie] = useState(false);
  /** Quand la carte s'est posée : un appui parti pour passer le film ne la referme pas dans la foulée. */
  const depuis = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pied = useRef<HTMLDivElement>(null);
  const air = AIRS[chapitreDe(experience).id];

  // Le film : le carton du chapitre, ses bruits à leur heure, puis le déclic qui le fige.
  useEffect(() => {
    if (carte || !scene) return;
    const timers = [window.setTimeout(() => setCarte(true), scene.duree), window.setTimeout(playChapter, 220)];
    for (const [ms, son, n] of scene.sons ?? []) timers.push(window.setTimeout(() => BRUITS[son](n), ms));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [carte, scene]);

  // La carte postale : le déclic, l'air de la fin, le cachet qui tombe, et des confettis la première fois.
  // Sortie de l'album, elle ne fait rien de tout cela : c'est une photo qu'on regarde.
  useEffect(() => {
    if (!carte) return;
    depuis.current = Date.now();
    pied.current?.focus({ preventScroll: true });
    if (rangee) return;
    if (!calm) playCardFlip();
    const timers = [
      window.setTimeout(() => playTier(air, !premiere), 260),
      window.setTimeout(playStamp, calm ? 500 : 880),
    ];
    if (premiere) haptic.tier(air);
    const fx = premiere && !calm && canvas.current ? new Fx(canvas.current) : null;
    if (fx) timers.push(window.setTimeout(() => fx.confetti(air === "jackpot" ? 130 : 70, air === "jackpot" ? 4200 : 2600), 320));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      fx?.destroy();
    };
  }, [carte, calm, air, premiere, rangee]);

  /** Depuis l'album : le film se rejoue, puis se fige de nouveau, avec son déclic cette fois. */
  const revivre = () => {
    if (sortie) return;
    setRangee(false);
    setCarte(false);
  };

  const fermer = () => {
    if (sortie || Date.now() - depuis.current < 480) return;
    if (calm) {
      nav.back();
      return;
    }
    // Le film se fond avant de rendre la main. (Si le bouton retour du téléphone l'a déjà refermé, on n'insiste pas.)
    setSortie(true);
    window.setTimeout(() => {
      if (nav.current().name === "experience") nav.back();
    }, 240);
  };

  // Au clavier : Échap passe le film, puis referme la carte.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (carte) fermer();
      else setCarte(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!scene) return null;
  const nom = nomExperience(experience);

  return (
    <div
      className={cx("moment moment--experience", carte ? "xp--carte" : "xp--film", sortie && "xp--sortie", carte && rangee && "xp--rangee")}
      role="dialog"
      aria-modal="true"
      aria-label={nom}
      data-plein-ecran=""
      style={{ "--xp-haut": scene.fond[0], "--xp-bas": scene.fond[1] } as CSSProperties}
    >
      {carte && rang > 0 && <p className="xp__haut">{t("Souvenir {n} sur {total}", { n: rang, total: EXPERIENCE_COUNT })}</p>}
      <div className="xp__cadre">
        <div className="xp__vue" aria-hidden="true">
          <svg
            className="xp__image"
            viewBox={carte ? `0 ${scene.cadre ?? CADRE} 360 450` : "0 0 360 800"}
            preserveAspectRatio="xMidYMid slice"
            focusable="false"
          >
            <scene.Art espece={espece} look={look} />
          </svg>
        </div>
        {carte && (
          <div className="xp__dos">
            <p className="xp__legende">{legendeDe(experience)}</p>
            <span className="xp__timbre" aria-hidden="true"><Timbre id={experience} vecue /></span>
          </div>
        )}
      </div>
      {carte ? (
        <div className={cx("xp__pied", photo && !calm && "xp__pied--deux")} ref={pied} tabIndex={-1}>
          {/* Sans animations, il n'y a pas de film à revivre : la carte postale est tout ce qu'on en garde. */}
          {photo && !calm && <Bouton variante="secondaire" bloc onClick={revivre}>{t("Revivre")}</Bouton>}
          <Bouton bloc onClick={fermer}>{t("Continuer")}</Bouton>
        </div>
      ) : (
        <button type="button" className="xp__passer" data-son="film" onClick={() => setCarte(true)} aria-label={t("Passer l'animation")}>
          <span aria-hidden="true">{t("Touche l'écran pour passer")}</span>
        </button>
      )}
      {carte && !calm && !rangee && <span className="xp__flash" aria-hidden="true" />}
      <canvas ref={canvas} className="moment__fx" aria-hidden="true" />
    </div>
  );
}
