// Petits composants communs (BRIEF.md, section 13.5) : en-tête d'écran, barre
// d'onglets, message bref, bulle de personnage, jauge de tempérament, interrupteur.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Temperament } from "../../shared/types";
import type { Line } from "../app/dialogues";
import { nav, type Tab } from "../app/nav";
import { dismissToast, isCovered, toScratch, useGame } from "../app/store";
import { Portrait } from "../art/Illustration";
import { Etoile, Icon, type IconName } from "../art/icons";
import { piouParle } from "../fx/ambiance";
import { playClick, playToggle } from "../fx/audio";
import { t } from "../i18n";
import { temperamentName } from "../i18n/noms";
import { cx } from "../ticket/parts";
import "./commun.css";

/** Une phrase où chaque ★ devient l'étoile du Standing. */
export function Phrase({ text }: { text: string }) {
  const parts = text.split("★");
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <>
              <Etoile />
              <span className="invisible">{t("étoiles")}</span>
            </>
          )}
          {part}
        </span>
      ))}
    </>
  );
}

interface EnteteProps {
  titre: string;
  /** Flèche de retour à gauche. */
  retour?: boolean;
  gauche?: ReactNode;
  droite?: ReactNode;
  /** Titre masqué à l'œil, mais lu. */
  titreDiscret?: boolean;
  /** Titre sur sa propre ligne, sous la barre : pour les noms longs. */
  grand?: boolean;
}

/** La plus petite taille d'un titre qui se réduit pour tenir sur sa ligne. */
const TITRE_MIN = 18;

/**
 * Un titre trop long pour sa ligne (à côté d'une bourse bien garnie, sur un écran
 * étroit, ou une fois traduit) se réduit jusqu'à tenir, sans passer sous 18 px ;
 * au-delà, il passe sur deux lignes. Jamais de titre coupé.
 */
function useTitleFit(titre: string, off: boolean) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || off) return;
    let alive = true;
    const fit = () => {
      if (!alive) return;
      // La taille prévue par la feuille de style, puis la largeur que le titre voudrait sur une ligne.
      el.style.fontSize = "";
      el.style.whiteSpace = "nowrap";
      const base = parseFloat(getComputedStyle(el).fontSize);
      const room = el.clientWidth;
      const wanted = el.scrollWidth;
      el.style.whiteSpace = "";
      if (room > 0 && wanted > room) el.style.fontSize = `${Math.max(TITRE_MIN, Math.floor((base * room) / wanted * 10) / 10)}px`;
    };
    fit();
    // La place change quand la bourse s'allonge ou que l'écran tourne ; la police, quand elle finit de charger.
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(el);
    void document.fonts?.ready.then(fit);
    return () => {
      alive = false;
      observer?.disconnect();
      el.style.fontSize = "";
    };
  }, [titre, off]);
  return ref;
}

export function Entete({ titre, retour = false, gauche, droite, titreDiscret = false, grand = false }: EnteteProps) {
  const fit = useTitleFit(titre, titreDiscret);
  const title = (
    <h1 ref={fit} className={cx("entete__titre", titreDiscret && "invisible", grand && "entete__titre--grand")}>{titre}</h1>
  );
  return (
    <header className={cx("entete", grand && "entete--grand")}>
      <div className="entete__barre">
        {retour && (
          <button
            type="button"
            className="entete__bouton entete__retour"
            data-son="retour"
            onPointerDown={() => playClick(-1)}
            onClick={(e) => {
              // Au clavier, pas d'appui : le déclic part à l'activation.
              if (e.detail === 0) playClick(-1);
              nav.back();
            }}
            aria-label={t("Retour")}
          >
            <Icon name="retour" />
          </button>
        )}
        {gauche}
        {!grand && title}
        {droite && <div className="entete__droite">{droite}</div>}
      </div>
      {grand && title}
    </header>
  );
}

// Les mots des onglets, en français : ce sont les clés de traduction, lues à l'affichage.
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "domaine", label: "Domaine", icon: "domaine" },
  { id: "promenade", label: "Jouer", icon: "jouer" },
  { id: "boutiques", label: "Boutiques", icon: "boutiques" },
  { id: "classement", label: "Classement", icon: "classement" },
];

/** Quatre onglets, icône et mot. « Jouer » porte une pastille mimosa plus grande. */
export function Onglets({ actif }: { actif: Tab | null }) {
  const waiting = useGame((s) => toScratch(s).length);
  // La barre monte en arrivant. Sauf quand on revient en arrière : elle attendait sous
  // l'écran qui s'en va, déjà en place. (Décidé une fois, à la pose : elle ne rejoue rien.)
  const [posee] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.nav === "retour");
  return (
    <nav className={cx("onglets", posee && "onglets--posee")} aria-label={t("Navigation principale")}>
      {TABS.map((tab, i) => {
        const active = tab.id === actif;
        const jouer = tab.id === "promenade";
        // Un déclic par changement : rien si l'on est déjà sur cet écran.
        const declic = () => {
          if (nav.current().name !== tab.id) playClick(i);
        };
        return (
          <button
            key={tab.id}
            type="button"
            className={cx("onglet", active && "onglet--actif", jouer && "onglet--jouer")}
            aria-current={active ? "page" : undefined}
            data-son="onglet"
            onPointerDown={declic}
            onClick={(e) => {
              if (e.detail === 0) declic();
              nav.tab(tab.id);
            }}
          >
            <span className="onglet__pastille">
              <Icon name={tab.icon} plein={active || jouer} size={jouer ? 30 : 26} />
              {/* Le compte porte sa valeur en clé : il rebondit chaque fois qu'il change. */}
              {jouer && waiting > 0 && <span key={waiting} className="onglet__compte" aria-hidden="true">{waiting}</span>}
            </span>
            <span className="onglet__mot">
              {t(tab.label)}
              {jouer && waiting > 0 && <span className="invisible">{t(", {n} à gratter", { n: waiting })}</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** Message bref : bandeau au-dessus des onglets, 3 secondes. Information ou erreur. */
export function Message({ onglets }: { onglets: boolean }) {
  const toast = useGame((s) => s.toast);
  if (!toast) return <div className="invisible" role="status" aria-live="polite" />;
  return (
    <div
      key={toast.id}
      className={cx("message", toast.kind === "erreur" && "message--erreur", onglets && "message--onglets")}
      role={toast.kind === "erreur" ? "alert" : "status"}
      onClick={dismissToast}
    >
      <Phrase text={toast.text} />
    </div>
  );
}

/** Bandeau hors connexion. */
export function HorsLigne() {
  const online = useGame((s) => s.online);
  if (online) return null;
  return (
    <div className="hors-ligne" role="status">
      <Icon name="hors-ligne" size={20} />
      <span>{t("Hors connexion. Tu peux gratter tes tickets en attente, pas en acheter.")}</span>
    </div>
  );
}

/** Piou pépie quand il dit quelque chose de nouveau. Les autres personnages parlent sans bruit. */
function useVoix(pnj: string | undefined, words: string | undefined): void {
  // Sous un grand moment, l'écran attend son tour : Piou y parlera quand le rideau sera levé.
  const covered = useGame(isCovered);
  useEffect(() => {
    if (pnj === "piou" && words && !covered) piouParle(words);
  }, [pnj, words, covered]);
}

/** Bulle de personnage : portrait rond de l'hôte et une phrase. Elle pousse en apparaissant. */
export function Bulle({ line, className }: { line: Line | null; className?: string }) {
  useVoix(line?.speaker, line?.text);
  if (!line) return null;
  return (
    <div className={cx("bulle", className)}>
      <Portrait pnj={line.speaker} />
      <p className="bulle__texte">
        <span className="bulle__nom">{line.name}</span>
        {/* Une parole entre guillemets, ceux de la langue ; un geste en italique, sans guillemets. */}
        {line.gesture ? <em className="bulle__geste">{line.text}</em> : t("« {replique} »", { replique: line.text })}
      </p>
    </div>
  );
}

interface BulleLibreProps {
  pnj: string;
  nom: string;
  children: ReactNode;
  className?: string;
  /** Le nom n'est dit qu'aux lecteurs d'écran : le portrait suffit, là où la place manque. */
  nomDiscret?: boolean;
  /** Ce qui est dit, quand `children` n'est pas un simple texte : Piou ne pépie qu'à une phrase nouvelle. */
  voix?: string;
}

/** La même bulle, pour un texte libre (Piou). */
export function BulleLibre({ pnj, nom, children, className, nomDiscret = false, voix }: BulleLibreProps) {
  useVoix(pnj, voix ?? (typeof children === "string" ? children : undefined));
  return (
    <div className={cx("bulle", className)}>
      <Portrait pnj={pnj} />
      <p className="bulle__texte">
        <span className={nomDiscret ? "invisible" : "bulle__nom"}>{nom}</span>
        {children}
      </p>
    </div>
  );
}

const GAUGE: Record<Temperament, number> = { pepere: 1, joueur: 2, "casse-cou": 3 };

/**
 * Jauge de tempérament : trois pastilles, dont une, deux ou trois pleines, et le mot à côté.
 * `court` : le mot seul (« pépère »), là où la place manque ; la phrase entière reste lue.
 */
export function Jauge({ temperament, court = false }: { temperament: Temperament; court?: boolean }) {
  const level = GAUGE[temperament];
  const nom = temperamentName(temperament);
  const phrase = t("tempérament : {nom}", { nom });
  return (
    <span className="jauge">
      <span className="jauge__pastilles" aria-hidden="true">
        {[1, 2, 3].map((i) => <span key={i} className={cx("jauge__pastille", i <= level && "jauge__pastille--pleine")} />)}
      </span>
      {court ? (
        <>
          <span aria-hidden="true">{nom}</span>
          <span className="invisible">{phrase}</span>
        </>
      ) : (
        <span>{phrase}</span>
      )}
    </span>
  );
}

interface InterrupteurProps {
  label: string;
  aide?: string;
  icon: IconName;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Interrupteur({ label, aide, icon, checked, onChange }: InterrupteurProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cx("interrupteur", checked && "interrupteur--actif")}
      data-son="interrupteur"
      onClick={() => {
        // Deux notes : montantes quand il s'allume, descendantes quand il s'éteint. L'interrupteur
        // du son lui-même s'entend dans les deux sens : il sonne avant de se taire, après s'être rallumé.
        if (checked) {
          playToggle(false);
          onChange(false);
        } else {
          onChange(true);
          playToggle(true);
        }
      }}
    >
      <Icon name={icon} className="interrupteur__icone" />
      <span className="interrupteur__texte">
        <span>{label}</span>
        {aide && <span className="interrupteur__aide">{aide}</span>}
      </span>
      <span className="interrupteur__rail" aria-hidden="true">
        <span className="interrupteur__bouton" />
      </span>
    </button>
  );
}

/** Barre de progression, pour la carte d'objectif. */
export function Barre({ value, max }: { value: number; max: number }) {
  const ratio = max <= 0 ? 1 : Math.max(0, Math.min(1, value / max));
  return (
    <span className="barre" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)}>
      <span className="barre__plein" style={{ transform: `scaleX(${ratio})` }} />
    </span>
  );
}
