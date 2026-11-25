// La bourse et le compteur de Standing (BRIEF.md, section 13.5).
// Bourse : pilule à liseré laiton, pièce à gauche, solde en Jost 700. Elle compte
// quand le solde change et clignote quand un achat est refusé faute d'argent.

import { useEffect, useRef, useState } from "react";
import { formatEuros, formatInt } from "../../shared/format";
import { displayBalance, isCalm, useGame } from "../app/store";
import { Icon } from "../art/icons";
import { playCoin } from "../fx/audio";
import { cx } from "../ticket/parts";
import "./bourse.css";

/**
 * Compte de la valeur affichée jusqu'à la nouvelle, en `ms` millisecondes.
 * `sonne` : une pièce tinte à chaque palier, un demi-ton plus haut à chaque fois.
 */
export function useCompte(target: number, ms: number, sonne = false): number {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const start = current.current;
    if (start === target) return;
    if (ms <= 0) {
      current.current = target;
      setShown(target);
      return;
    }
    const rising = target > start;
    const t0 = performance.now();
    let raf = 0;
    let lastCoin = 0;
    let step = 0;
    const loop = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      const value = k >= 1 ? target : Math.round(start + (target - start) * eased);
      current.current = value;
      setShown(value);
      if (sonne && rising && k < 1 && now - lastCoin > 90) {
        lastCoin = now;
        playCoin(step++);
      }
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, sonne]);
  return shown;
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
  const flash = useGame((s) => s.purseFlash);
  const calm = useGame(isCalm);
  // Animations réduites : comptage du solde en 300 ms.
  const shown = useCompte(balance, calm ? 300 : countMs, true);
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
    <div className={cx("bourse", refus && "bourse--refus", className)} data-bourse>
      <Icon name="piece" plein className="bourse__piece" size={28} />
      <span className="bourse__montant chiffres" aria-hidden="true"><Cases text={formatEuros(shown)} /></span>
      <span className="invisible" role="status">Solde : {formatEuros(balance)}</span>
    </div>
  );
}

/** Compteur de Standing : étoile bougainvillier et nombre. Les ★ gagnées s'y envolent. */
export function Standing({ className }: { className?: string }) {
  const standing = useGame((s) => s.player?.standing ?? 0);
  const shown = useCompte(standing, 600);
  const [pulse, setPulse] = useState(false);
  const first = useRef(standing);
  useEffect(() => {
    if (standing === first.current) return;
    first.current = standing;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(t);
  }, [standing]);
  return (
    <div className={cx("standing", pulse && "standing--gagne", className)} data-standing>
      <Icon name="etoile" plein className="standing__etoile" size={24} />
      <span className="standing__nombre chiffres" aria-hidden="true"><Cases text={formatInt(shown)} /></span>
      <span className="invisible">Standing : {formatInt(standing)} étoiles</span>
    </div>
  );
}
