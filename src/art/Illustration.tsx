// Affiche une illustration du registre : composant SVG ou image (BRIEF.md, section 4.7).

import type { ArtProps } from "./kit";
import { illustration } from "./registry";

interface Props extends ArtProps {
  /** Identifiant du registre : `item:beret`, `pnj:gaspard`, `symbole:bandit:cerise`… */
  id: string;
}

export function Illustration({ id, className, title }: Props) {
  const art = illustration(id);
  if (typeof art === "string") {
    return <img className={className} src={art} alt={title ?? ""} aria-hidden={title ? undefined : true} draggable={false} />;
  }
  if (art) {
    const Comp = art;
    return <Comp className={className} title={title} />;
  }
  // Illustration manquante : un cadre vide plutôt qu'un trou dans la page.
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width="100%"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect x="6" y="6" width="36" height="36" rx="6" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
  );
}

/** Un symbole de ticket, par sa clé « famille:identifiant ». */
export function Symbole({ cle, className, title }: ArtProps & { cle: string }) {
  return <Illustration id={`symbole:${cle}`} className={className} title={title} />;
}

/** Le portrait d'un personnage dans son médaillon rond. */
export function Portrait({ pnj, className, title }: ArtProps & { pnj: string }) {
  return (
    <span className={`portrait ${className ?? ""}`}>
      <Illustration id={`pnj:${pnj}`} title={title} />
    </span>
  );
}
