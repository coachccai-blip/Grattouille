// Les petites pièces des écrans du poker : la tête d'un joueur, un jeton, la barre de
// temps, un réglage à deux boutons.

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { remainingMs } from "./calcul";
import type { Identity } from "./textes";

/**
 * La tête d'un joueur dans son médaillon : le portrait d'un personnage, ou la tête de
 * l'avatar d'un joueur, avec son chapeau et ses lunettes. Décorative : le nom est écrit à côté.
 */
export function Tete({ who, className }: { who: Identity | null; className?: string }) {
  return (
    <span className={cx("poker-tete", !who && "poker-tete--vide", className)} aria-hidden="true">
      {who?.bot ? (
        <Illustration id={`pnj:${who.bot}`} />
      ) : who ? (
        <Avatar species={who.species ?? "renard"} look={who.look ?? {}} crop="tete" />
      ) : null}
    </span>
  );
}

/** Un jeton : un disque mimosa, à côté d'une somme posée sur le tapis. */
export function Jeton({ className }: { className?: string }) {
  return <span className={cx("poker-jeton", className)} aria-hidden="true" />;
}

interface TempsProps {
  /** L'échéance, à l'heure du serveur. `null` : rien ne presse (tour d'un robot, attente). */
  deadline: number | null;
  /** Heure du serveur moins heure de l'appareil. */
  offset: number;
  /** La durée entière du temps en cours. */
  total: number;
  /** C'est au joueur de se décider : la barre se voit davantage. */
  mine: boolean;
}

/** À partir de là, le temps presse : la barre change de couleur. */
const URGENT_MS = 5_000;

/**
 * La barre de temps : elle se vide jusqu'à l'échéance. Une seule animation, posée à
 * l'arrivée de l'échéance (une transformation, rien d'autre) : l'écran peut se redessiner
 * autant qu'il veut, la barre ne saute pas.
 */
export function BarreTemps({ deadline, offset, total, mine }: TempsProps) {
  // Mesuré une fois par échéance : la suite est l'affaire de l'animation.
  const start = useMemo(() => {
    const left = remainingMs(deadline, offset, Date.now());
    return { left, from: total > 0 ? Math.min(1, left / total) : 0 };
  }, [deadline, total]);
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    if (deadline === null || start.left <= 0) {
      setUrgent(false);
      return;
    }
    setUrgent(start.left <= URGENT_MS);
    const timer = window.setTimeout(() => setUrgent(true), Math.max(0, start.left - URGENT_MS));
    return () => window.clearTimeout(timer);
  }, [deadline, start]);

  const running = deadline !== null && start.left > 0;
  return (
    <div className={cx("poker-temps", mine && "poker-temps--moi", urgent && running && "poker-temps--presse")} aria-hidden="true">
      {running && (
        <span
          key={deadline}
          className="poker-temps__reste"
          style={{ "--depart": start.from, animationDuration: `${start.left}ms` } as CSSProperties}
        />
      )}
    </div>
  );
}

interface PasProps {
  /** Ce qu'on règle : « Blinde », « Sièges ». */
  label: string;
  /** La valeur choisie, telle qu'elle s'affiche. */
  value: string;
  /** Une précision sous le nom, s'il en faut une. */
  aide?: string;
  onMinus: (() => void) | null;
  onPlus: (() => void) | null;
}

/** Un réglage : son nom, sa valeur, et deux boutons pour la baisser ou la monter. */
export function Pas({ label, value, aide, onMinus, onPlus }: PasProps) {
  return (
    <div className="poker-pas" role="group" aria-label={label}>
      <span className="poker-pas__nom">{label}</span>
      <button
        type="button"
        className="poker-pas__bouton"
        onClick={onMinus ?? undefined}
        disabled={!onMinus}
        aria-label={t("{quoi} : moins", { quoi: label })}
      >
        <span aria-hidden="true">−</span>
      </button>
      <output className="poker-pas__valeur chiffres" aria-live="polite">{value}</output>
      <button
        type="button"
        className="poker-pas__bouton"
        onClick={onPlus ?? undefined}
        disabled={!onPlus}
        aria-label={t("{quoi} : plus", { quoi: label })}
      >
        <span aria-hidden="true">+</span>
      </button>
      {aide && <span className="poker-pas__aide">{aide}</span>}
    </div>
  );
}

/** Une liste de valeurs parcourue par un réglage : rend les deux gestes, ou `null` au bout de la liste. */
export function steps<T>(values: readonly T[], current: T, set: (value: T) => void): { minus: (() => void) | null; plus: (() => void) | null } {
  const index = values.indexOf(current);
  return {
    minus: index > 0 ? () => set(values[index - 1]!) : null,
    plus: index >= 0 && index < values.length - 1 ? () => set(values[index + 1]!) : null,
  };
}

/** Un message d'erreur dans une feuille : là où le joueur regarde, au-dessus du bouton. */
export function Alerte({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="poker-alerte" role="alert">{children}</p>;
}
