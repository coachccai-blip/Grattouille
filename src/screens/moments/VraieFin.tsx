// La vraie fin, « Huit as de cœur » (LOT4.md, section 4) : la récompense de qui a racheté
// le Kiosque et ruiné au Poker Tricheur les huit maîtres des lieux. Un grand moment en
// plein écran, comme le premier générique, mais plus ample : quatre temps, une idée par
// écran, et c'est le joueur qui donne le rythme.
//
//   1. L'invitation : la tablée devant le Kiosque. On se lève, on applaudit, on s'assoit.
//   2. Les huit as : huit cartes face cachée, que le joueur retourne dans l'ordre qu'il veut.
//   3. Le secret : Piou ôte son calot, et raconte.
//   4. La pluie de tickets : le bateau accoste, la tablée vide ses poches, une mouette passe.
//
// Ce qui s'y dit est dans src/app/suite/vraie-fin.ts ; ce module n'en est que la mise en
// scène. Il n'est chargé qu'à la demande (App.tsx). Le serveur n'est appelé qu'une fois,
// à la toute fin, pour noter que la fin a été vue ; revue depuis les Souvenirs, la
// cinématique ne lui dit rien.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { hostName } from "../../app/dialogues";
import { skyOf } from "../../app/helpers";
import { closeTrueEnding, isCalm, markTrueEndingSeen, useGame } from "../../app/store";
import { t } from "../../app/suite/mots";
import {
  AS, CONSIGNE, HOTES, LEGENDE, PLANS, PLAN_DES_CARTES, TITRE, VENU, type Hote, type Image, type Voix,
} from "../../app/suite/vraie-fin";
import { Avatar, type AvatarLook } from "../../art/Avatar";
import { Illustration, Portrait } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { Mouette, PiouConteur, PiouTeteNue } from "../../art/suite/scenes";
import { mouette, piouParle } from "../../fx/ambiance";
import {
  playAccuse, playCardFlip, playChapter, playCoin, playConfession, playInnocent, playOpening, playPickUp, playPot,
  playSleight, playTicketDrop, playTier,
} from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { Fx } from "../../fx/particles";
import { pick } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Carte } from "../../ui/Carte";
import "./moments.css";
import "./vraie-fin.css";

/** Ce que porte celui qui débarque au dernier temps : un chapeau en papier journal, et rien d'autre. */
const HARDES: AvatarLook = { chapeau: "chapeau-journal" };

/** Les dix tickets de la pluie : un par maître des lieux, celui du joueur, et celui de Piou. */
const TICKETS = Array.from({ length: 10 }, (_, i) => i);
/** Celui que la mouette emporte. */
const EMPORTE = 7;

/**
 * Le médaillon de celui qui parle : un personnage du jeu, ou le nouveau venu, de l'espèce
 * qu'on lui donne. `nu` : Piou a ôté son calot, son médaillon aussi.
 */
function Medaillon({ qui, espece, nu }: { qui: Voix; espece: string; nu: boolean }) {
  if (qui === "piou" && nu) return <span className="portrait"><PiouTeteNue /></span>;
  if (qui !== "venu") return <Portrait pnj={qui} />;
  return (
    <span className="portrait">
      <Avatar species={espece} look={HARDES} crop="tete" />
    </span>
  );
}

/** Un personnage et ce qu'il dit : son médaillon et son nom une fois, puis une bulle par phrase, entre guillemets. */
function Paroles({ qui, lignes, espece, nu = false }: { qui: Voix; lignes: readonly string[]; espece: string; nu?: boolean }) {
  // Piou pépie quand ses bulles poussent (les autres parlent sans bruit).
  const premiere = lignes[0] ?? "";
  useEffect(() => {
    if (qui !== "piou") return;
    const timer = window.setTimeout(() => piouParle(premiere), 300);
    return () => window.clearTimeout(timer);
  }, [qui, premiere]);
  return (
    <div className="moment__paroles">
      <Medaillon qui={qui} espece={espece} nu={nu} />
      <div className="moment__bulles">
        {lignes.map((ligne, i) => (
          <p key={i} className="bulle__texte">
            {i === 0 && <span className="bulle__nom">{qui === "venu" ? pick(VENU) : hostName(qui)}</span>}
            {t("« {replique} »", { replique: ligne })}
          </p>
        ))}
      </div>
    </div>
  );
}

/** La place d'un convive le long de la table : neuf places, la dernière pour le joueur. */
function place(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

/** Où et comment tombe le ticket `i` : sa place sur le quai, sa hauteur, son angle, son heure. Rien au hasard. */
function chute(i: number): CSSProperties {
  return {
    "--i": i, "--y": `${(i * 7) % 6}px`, "--r": `${((i * 53) % 41) - 20}deg`, "--d": `${((i * 3) % 10) * 85}ms`,
  } as CSSProperties;
}

/**
 * La tablée devant le Kiosque doré : les huit maîtres des lieux en rang derrière la nappe,
 * chacun sa carte posée devant lui, et Piou perché sur une tourelle. `bravo` : ils se
 * lèvent et applaudissent ; `pari` : la maison paie Sir Auguste, et le joueur a pris place ;
 * `regards` : huit têtes se tournent vers le groom.
 */
function Tablee({ image, espece, look }: { image: Image; espece: string; look: AvatarLook }) {
  const assis = image === "pari" || image === "regards";
  return (
    <div className={cx("vf__tablee", `vf__tablee--${image}`)}>
      <Illustration id="item:kiosque" />
      <span className="vf__perchoir"><Portrait pnj="piou" /></span>
      {HOTES.map((hote, i) => (
        <span key={hote} className={cx("vf__convive", `vf__convive--${hote}`, i % 2 === 1 && "vf__convive--fond")} style={place(i)}>
          <Portrait pnj={hote} />
        </span>
      ))}
      {assis && (
        <span className="vf__convive vf__convive--toi" style={place(HOTES.length)}>
          <span className="portrait"><Avatar species={espece} look={look} crop="tete" /></span>
        </span>
      )}
      {image === "pari" && <span className="vf__mise" />}
      <span className="vf__table">
        {HOTES.map((hote, i) => <span key={hote} className="vf__dos" style={place(i)} />)}
      </span>
    </div>
  );
}

/**
 * Les huit cartes, sur la nappe : le joueur les retourne dans l'ordre qu'il veut. Chacune
 * est un bouton, sous le médaillon de qui l'a posée.
 */
function Cartes({ vues, parle, onRetourne }: { vues: readonly Hote[]; parle: Hote | null; onRetourne: (hote: Hote) => void }) {
  return (
    <div className="vf__nappe" role="group" aria-label={t("Les huit cartes de la tablée")}>
      {HOTES.map((hote) => {
        const vue = vues.includes(hote);
        const nom = hostName(hote);
        return (
          <button
            key={hote}
            type="button"
            className={cx("vf__couvert", vue && "vf__couvert--vu", parle === hote && "vf__couvert--parle")}
            onClick={() => onRetourne(hote)}
            aria-disabled={vue || undefined}
            aria-label={vue ? t("La carte de {hote} : as de cœur", { hote: nom }) : t("La carte de {hote}, face cachée. La retourner", { hote: nom })}
          >
            <Portrait pnj={hote} />
            <Carte carte="Ah" cachee={!vue} style={{ "--carte-l": "var(--vf-carte)" } as CSSProperties} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Le quai du premier matin : le bateau accoste, quelqu'un débarque. `pluie` : dix tickets
 * tombent ; `mouette` : il n'en reste que neuf, et une mouette s'envole avec le dixième.
 */
function Quai({ image, espece }: { image: Image; espece: string }) {
  return (
    <div className={cx("vf__quai", `vf__quai--${image}`)}>
      <Illustration id="place:kiosque" />
      <span className="vf__debarque">
        <span className="portrait"><Avatar species={espece} look={HARDES} crop="tete" /></span>
      </span>
      {image !== "bateau" && TICKETS.map((i) => (image === "mouette" && i === EMPORTE ? null : (
        <span key={i} className="vf__ticket" style={chute(i)}>
          <span className="moment__ticket-papier"><Icon name="jouer" plein size={18} /></span>
        </span>
      )))}
      {image === "mouette" && <span className="vf__mouette" style={place(EMPORTE)}><Mouette ticket /></span>}
    </div>
  );
}

/**
 * Ce que Piou raconte, en petit, dans une bulle de pensée à côté de lui : une image par
 * idée. La mouette qui regardait ailleurs, le kiosque d'abord, l'as de cœur de ceux qui
 * trichent pour les autres, et la carte qu'on retourne à ceux qui trichent pour eux.
 */
function Pensee({ plan }: { plan: string }) {
  let image: ReactNode = null;
  if (plan === "premier") image = <Mouette />;
  else if (plan === "ville") image = <Illustration id="place:kiosque" />;
  else if (plan === "chance") image = <Carte carte="Ah" largeur={34} style={{ transform: "rotate(-8deg)" }} />;
  else if (plan === "examen") {
    image = (
      <>
        <Carte carte="Ah" largeur={30} style={{ transform: "rotate(-12deg) translateX(3px)" }} />
        <Carte largeur={30} style={{ transform: "rotate(10deg) translateX(-3px)" }} />
      </>
    );
  }
  if (!image) return null;
  return (
    <span className="vf__pensee" key={plan}>
      <span className={cx("vf__pensee-image", `vf__pensee-image--${plan}`)}>{image}</span>
    </span>
  );
}

/** Le dessin d'un plan. Les plans d'un même décor gardent leur dessin monté : seul ce qui change s'anime. */
function decorDe(image: Image): "tablee" | "cartes" | "piou" | "quai" {
  if (image === "cartes") return "cartes";
  if (image === "calot" || image === "recit" || image === "recoiffe") return "piou";
  if (image === "bateau" || image === "pluie" || image === "mouette") return "quai";
  return "tablee";
}

export default function VraieFin() {
  const relecture = useGame((s) => s.replay);
  const calm = useGame(isCalm);
  const espece = useGame((s) => s.player?.species ?? "renard");
  const look = useGame((s) => s.player?.look) ?? {};
  const [index, setIndex] = useState(0);
  /** Les cartes retournées, dans l'ordre où le joueur les a choisies. */
  const [vues, setVues] = useState<readonly Hote[]>([]);
  const [attente, setAttente] = useState(false);
  const [sortie, setSortie] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const corps = useRef<HTMLDivElement>(null);
  const fx = useRef<Fx | null>(null);

  const plan = PLANS[index]!;
  const dernier = index === PLANS.length - 1;
  const cartes = plan.id === PLAN_DES_CARTES;
  const toutes = vues.length === HOTES.length;
  const parle = vues[vues.length - 1] ?? null;
  const decor = decorDe(plan.image);
  // Tant que Piou raconte, il est tête nue : sur le dessin, et dans le médaillon de ses bulles.
  const nu = decor === "piou" && plan.image !== "recoiffe";
  // Celui qui débarque n'est pas le joueur : il est d'une autre espèce que lui.
  const venu = espece === "herisson" ? "raton" : "herisson";

  useEffect(() => {
    const effets = canvas.current && !calm ? new Fx(canvas.current) : null;
    fx.current = effets;
    return () => {
      effets?.destroy();
      fx.current = null;
    };
  }, [calm]);

  // À chaque plan, la lecture d'écran repart du haut du texte.
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) premier.current = false;
    else corps.current?.focus();
  }, [index]);

  // Le son de chaque plan : la signature du jeu en ouverture, la fanfare quand on se lève,
  // les jetons du pari, l'accusation quand les têtes se tournent, les quatre notes de l'aveu
  // quand le calot tombe, les tickets sur le quai, et la mouette pour finir.
  useEffect(() => {
    const timers: number[] = [];
    const plus = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    switch (plan.image) {
      case "tablee":
        mouette();
        plus(playChapter, 180);
        break;
      case "bravo":
        plus(playOpening, 120);
        plus(() => fx.current?.confetti(90, 2600), 200);
        haptic.tier("gros");
        break;
      case "pari":
        plus(playPot, 500);
        break;
      case "regards":
        plus(playAccuse, 900);
        break;
      case "calot":
        plus(playConfession, 350);
        break;
      case "recoiffe":
        plus(playSleight, 250);
        break;
      case "bateau":
        mouette();
        break;
      case "pluie":
        playTicketDrop();
        haptic.buy();
        for (let i = 1; i < TICKETS.length; i++) plus(() => playCoin(i), 380 + i * 110);
        break;
      case "mouette":
        plus(playPickUp, 350);
        plus(mouette, 1100);
        plus(playInnocent, 2300);
        break;
      default:
        break;
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [plan.image]);

  /** Une carte se retourne : la huitième fait apparaître le titre. */
  const retourner = (hote: Hote) => {
    if (vues.includes(hote)) return;
    const suite = [...vues, hote];
    setVues(suite);
    playCardFlip();
    haptic.reveal();
    if (suite.length === HOTES.length) {
      window.setTimeout(() => {
        playTier("gros");
        haptic.tier("gros");
        fx.current?.confetti(70, 2200);
      }, 320);
    }
  };

  const fermer = () => {
    // La cinématique se fond avant de rendre la main ; sans animation, elle s'efface d'un coup.
    if (calm) closeTrueEnding();
    else {
      setSortie(true);
      window.setTimeout(() => closeTrueEnding(), 240);
    }
  };

  const avancer = async () => {
    if (attente || sortie) return;
    if (cartes && !toutes) {
      // Le bouton retourne la prochaine carte, dans l'ordre de la table : nul besoin de viser.
      retourner(HOTES.find((hote) => !vues.includes(hote))!);
      return;
    }
    if (!dernier) {
      setIndex(index + 1);
      return;
    }
    if (!relecture) {
      // La fin est vue : le serveur le note. Sans réseau, elle se rejouera une autre fois.
      setAttente(true);
      await markTrueEndingSeen();
    }
    fermer();
  };

  const titre = cartes ? (toutes ? pick(TITRE) : pick(plan.titre!)) : plan.titre ? pick(plan.titre) : null;
  const bouton = cartes && toutes ? t("Continuer") : dernier && relecture ? t("Refermer le souvenir") : t(plan.bouton);

  let dessin: ReactNode;
  if (decor === "cartes") dessin = <Cartes vues={vues} parle={parle} onRetourne={retourner} />;
  else if (decor === "piou") {
    dessin = (
      <>
        <PiouConteur calot={nu ? "aile" : "tete"} />
        <Pensee plan={plan.id} />
      </>
    );
  }
  else if (decor === "quai") dessin = <Quai image={plan.image} espece={venu} />;
  else dessin = <Tablee image={plan.image} espece={espece} look={look} />;

  return (
    <div
      className={cx("moment moment--vraie-fin", `vf--${plan.temps}`, `vf--${decor}`, sortie && "vf--sortie")}
      role="dialog"
      aria-modal="true"
      aria-label={pick(TITRE)}
    >
      {/* Les cartes se touchent : leur décor n'est pas qu'une image. */}
      <div className="moment__decor vf__decor" style={{ backgroundImage: skyOf("kiosque") }} aria-hidden={decor === "cartes" ? undefined : true}>
        <div className="vf__scene" key={decor}>{dessin}</div>
      </div>
      <div className="moment__corps moment__temps" key={plan.id} ref={corps} tabIndex={-1}>
        <p className="moment__chapitre">{t("La vraie fin · Un beau matin")}</p>
        {titre && <h2 className="moment__titre" key={titre} aria-live={cartes ? "polite" : undefined}>{titre}</h2>}
        {plan.recit && <p className="moment__recit">{pick(plan.recit)}</p>}
        {cartes && (parle
          ? <Paroles key={parle} qui={parle} lignes={[pick(AS[parle])]} espece={venu} />
          : <p className="moment__recit">{pick(CONSIGNE)}</p>)}
        {(plan.repliques ?? []).map((replique, i) => (
          <Paroles key={i} qui={replique.qui} lignes={pick(replique.dit)} espece={venu} nu={nu} />
        ))}
        {plan.chute && <p className="moment__recit vf__chute">{pick(plan.chute)}</p>}
        {dernier && <p className="note vf__legende">{pick(LEGENDE)}</p>}
        <Bouton bloc attente={attente} onClick={() => void avancer()}>{bouton}</Bouton>
        {relecture && !dernier && <Bouton variante="texte" onClick={fermer}>{t("Refermer le souvenir")}</Bouton>}
      </div>
      <canvas ref={canvas} className="moment__fx" aria-hidden="true" />
    </div>
  );
}
