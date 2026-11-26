// La bourse et le compteur de Standing (BRIEF.md, section 13.5).
// Bourse : pilule à liseré laiton, pièce à gauche, solde en Jost 700. Elle compte
// quand le solde change, rebondit quand l'argent arrive, et clignote quand un achat
// est refusé faute d'argent. Le Standing compte aussi, et ses étoiles jaillissent.
//
// `useCompte` et `Compteur` servent partout où un nombre défile : le montant gagné au
// résultat d'un ticket, le bilan d'un carnet, la fortune du Domaine.

import { useEffect, useRef, useState } from "react";
import { formatEuros, formatInt } from "../../shared/format";
import { displayBalance, isCalm, useGame } from "../app/store";
import { Icon } from "../art/icons";
import { playCoin } from "../fx/audio";
import { t } from "../i18n";
import { cx } from "../ticket/parts";
import "./bourse.css";

interface CompteOptions {
  /** Ce qu'un compte qui monte attend avant de partir, en millisecondes. */
  delai?: number;
  /** La valeur affichée au tout début, si ce n'est pas la valeur à atteindre. */
  depart?: number;
  /** Appelé quand un compte qui monte se met en route (après son délai). */
  onDepart?: () => void;
}

/** L'écart entre deux pièces : un peu moins de dix à la seconde. */
const COIN_EVERY_MS = 106;
/** Le nombre de degrés que montent les pièces, du début à la fin d'un compte. */
const COIN_STEPS = 7;

/**
 * Compte de la valeur affichée jusqu'à la nouvelle, en `ms` millisecondes.
 * `sonne` : les pièces tintent pendant le compte, et leur hauteur monte avec lui.
 */
export function useCompte(target: number, ms: number, sonne = false, options: CompteOptions = {}): number {
  const { delai = 0, depart } = options;
  const [shown, setShown] = useState(depart ?? target);
  const current = useRef(depart ?? target);
  const onDepart = useRef(options.onDepart);
  onDepart.current = options.onDepart;
  useEffect(() => {
    const start = current.current;
    if (start === target) return;
    if (ms <= 0) {
      current.current = target;
      setShown(target);
      return;
    }
    const rising = target > start;
    // Seul un gain se fait attendre : une dépense quitte la bourse tout de suite.
    const t0 = performance.now() + (rising ? delai : 0);
    let raf = 0;
    let lastCoin = 0;
    let begun = false;
    const loop = (now: number) => {
      if (now < t0) {
        raf = requestAnimationFrame(loop);
        return;
      }
      if (!begun) {
        begun = true;
        if (rising) onDepart.current?.();
      }
      const k = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      const value = k >= 1 ? target : Math.round(start + (target - start) * eased);
      current.current = value;
      setShown(value);
      if (sonne && rising && k < 1 && now - lastCoin >= COIN_EVERY_MS) {
        lastCoin = now;
        playCoin(Math.floor(k * COIN_STEPS));
      }
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, sonne, delai]);
  return shown;
}

interface CompteurProps extends CompteOptions {
  valeur: number;
  /** Durée du défilement, en millisecondes. 0 : la valeur s'affiche d'un coup. */
  ms: number;
  sonne?: boolean;
  /** L'écriture du nombre : des euros, sauf mention contraire. */
  format?: (n: number) => string;
}

/** Un nombre qui défile jusqu'à sa valeur : un montant en euros, sauf mention contraire. */
export function Compteur({ valeur, ms, sonne = false, format = formatEuros, ...options }: CompteurProps) {
  const shown = useCompte(valeur, ms, sonne, options);
  return <>{format(shown)}</>;
}

/** Ce qu'un nombre valait la dernière fois qu'on l'a montré : il reprend de là en revenant sur l'écran. */
const souvenirs = new Map<string, number>();

/**
 * Un nombre qui se souvient : quitté à une valeur, retrouvé à une autre, il défile de
 * l'une à l'autre. La fortune du Domaine défile ainsi quand on y revient plus riche.
 */
export function useCompteSouvenir(cle: string | undefined, target: number, ms: number): number {
  const [depart] = useState(() => (cle === undefined ? target : souvenirs.get(cle) ?? target));
  const shown = useCompte(target, ms, false, { depart });
  useEffect(() => {
    if (cle !== undefined) souvenirs.set(cle, target);
  }, [cle, target]);
  return shown;
}

/** Ce que valait ce nombre la dernière fois qu'on l'a montré sous cette clé (ou sa valeur d'aujourd'hui). */
export function souvenirDe(cle: string | undefined, target: number): number {
  return cle === undefined ? target : souvenirs.get(cle) ?? target;
}

/**
 * Les chiffres dans des cases de largeur fixe. Jost n'a pas de chiffres tabulaires
 * (mesuré : `tabular-nums` n'y change rien) ; sans ces cases, un solde qui compte
 * danserait de gauche à droite (BRIEF.md, section 13.5).
 */
export function Cases({ text }: { text: string }) {
  return (
    <>
      {Array.from(text, (ch, i) => (ch >= "0" && ch <= "9" ? <span key={i} className="case-chiffre">{ch}</span> : ch))}
    </>
  );
}

export function Bourse({ className }: { className?: string }) {
  const balance = useGame(displayBalance);
  const countMs = useGame((s) => s.countMs);
  const countDelay = useGame((s) => s.countDelay);
  const flash = useGame((s) => s.purseFlash);
  const calm = useGame(isCalm);
  // L'argent arrive : la bourse rebondit. Le compteur change de parité à chaque arrivée,
  // pour que l'animation reparte même si la précédente n'est pas finie ; une demi-seconde
  // plus tard, il n'en reste rien.
  const [arrivee, setArrivee] = useState({ n: 0, vive: false });
  useEffect(() => {
    if (!arrivee.vive) return;
    const timer = window.setTimeout(() => setArrivee((a) => ({ ...a, vive: false })), 480);
    return () => window.clearTimeout(timer);
  }, [arrivee]);
  // Animations réduites : comptage du solde en 300 ms, sans attendre.
  const shown = useCompte(balance, calm ? 300 : countMs, true, {
    delai: calm ? 0 : countDelay,
    onDepart: () => setArrivee((a) => ({ n: a.n + 1, vive: true })),
  });
  const [refus, setRefus] = useState(false);
  const firstFlash = useRef(flash);
  useEffect(() => {
    if (flash === firstFlash.current) return;
    firstFlash.current = flash;
    setRefus(true);
    const t = window.setTimeout(() => setRefus(false), 700);
    return () => window.clearTimeout(t);
  }, [flash]);
  return (
    <div
      className={cx("bourse", refus && "bourse--refus", shown < balance && "bourse--compte", className)}
      data-bourse
      data-arrivee={arrivee.vive ? (arrivee.n % 2 === 1 ? "a" : "b") : undefined}
    >
      <Icon name="piece" plein className="bourse__piece" size={28} />
      <span className="bourse__montant chiffres" aria-hidden="true"><Cases text={formatEuros(shown)} /></span>
      <span className="invisible" role="status">{t("Solde : {montant}", { montant: formatEuros(balance) })}</span>
    </div>
  );
}

/** Les éclats qui jaillissent de l'étoile quand le Standing monte : six directions. */
const ECLATS = [0, 1, 2, 3, 4, 5];

/**
 * Compteur de Standing : étoile bougainvillier et nombre. Quand il monte, il compte et
 * ses étoiles jaillissent. `souvenir` : sur cet écran, il se souvient de ce qu'il valait
 * la dernière fois ; revenu plus haut (au Domaine, après un tour en boutique), il défile.
 */
export function Standing({ className, souvenir }: { className?: string; souvenir?: string }) {
  const standing = useGame((s) => s.player?.standing ?? 0);
  // La valeur d'où l'on part : lue une fois, avant que le compteur ne la mette à jour.
  const [first] = useState(() => souvenirDe(souvenir, standing));
  const shown = useCompteSouvenir(souvenir, standing, 900);
  const [pulse, setPulse] = useState(false);
  const seen = useRef(first);
  useEffect(() => {
    if (standing === seen.current) return;
    const rising = standing > seen.current;
    seen.current = standing;
    if (!rising) return;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 900);
    return () => window.clearTimeout(t);
  }, [standing]);
  return (
    <div className={cx("standing", pulse && "standing--gagne", className)} data-standing>
      <span className="standing__astre">
        <Icon name="etoile" plein className="standing__etoile" size={24} />
        {pulse && (
          <span className="standing__eclats" aria-hidden="true">
            {ECLATS.map((i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}
          </span>
        )}
      </span>
      <span className="standing__nombre chiffres" aria-hidden="true"><Cases text={formatInt(shown)} /></span>
      <span className="invisible">{t("Standing : {n} étoiles", { n: formatInt(standing) })}</span>
    </div>
  );
}
