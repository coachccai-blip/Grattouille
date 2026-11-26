// Le résultat d'un ticket (BRIEF.md, section 8.5) : un mot et un montant, dits une
// seule fois.
//
// - `Resultat` : le bloc. Il tombe sur le plateau, sous le ticket, sans jamais le
//   recouvrir. Quand le ticket s'en va, il monte au milieu de la scène : c'est le
//   même bloc qui se déplace, pas une seconde annonce.
// - `Fete` : les paliers « énorme » et « jackpot », en plein écran. Le fond est opaque
//   (aucun texte ne se lit à travers un autre) et porte le même bloc, en grand.
//
// La fête du jackpot est le seul moment vraiment spectaculaire du jeu : les autres
// paliers sont sobres pour qu'elle porte. Les pièces et les confettis sont dessinés
// sur le canvas d'effets ; l'hôte du lieu, lui, réagit une fois le ticket payé.

import { useLayoutEffect, useRef, type RefObject } from "react";
import { formatEuros } from "../../../shared/format";
import { TIER_RANK, type Tier } from "../../../shared/rules";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";

// Les mots des paliers, en français : ce sont les clés de traduction, lues à l'affichage.
const MOTS: Record<Tier, string> = {
  perdu: "Rien cette fois.",
  rembourse: "Remboursé.",
  petit: "Gagné",
  joli: "Joli coup",
  gros: "Gros gain",
  enorme: "Énorme",
  jackpot: "Jackpot",
};

// Les mêmes, en une phrase : ce que l'écran annonce aux lecteurs d'écran.
const ANNONCES: Record<Tier, string> = {
  perdu: "Rien cette fois.",
  rembourse: "Remboursé.",
  petit: "Gagné : {montant}.",
  joli: "Joli coup : {montant}.",
  gros: "Gros gain : {montant}.",
  enorme: "Énorme : {montant}.",
  jackpot: "Jackpot : {montant}.",
};

/** Le résultat en une phrase, pour l'annonce : un mot, en plus de la couleur et du son. */
export function resultText(tier: Tier, gain: number): string {
  return t(ANNONCES[tier], { montant: formatEuros(gain) });
}

/** Vrai pour les paliers fêtés en plein écran. */
export function fullScreen(tier: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK.enorme;
}

interface ResultatProps {
  tier: Tier;
  gain: number;
  /** En grand, pour la fête en plein écran. */
  grand?: boolean;
  /** Pour mesurer le bloc avant qu'il ne change de place. */
  blockRef?: RefObject<HTMLParagraphElement | null>;
  /** Là où le bloc se trouvait l'instant d'avant : il en repart, au lieu d'apparaître. */
  depart?: RefObject<DOMRect | null>;
  calm?: boolean;
}

/**
 * Le mot du palier et le montant gagné, en Abril Fatface. Décoratif pour les lecteurs
 * d'écran : la phrase entière est annoncée à part, une fois.
 */
export function Resultat({ tier, gain, grand = false, blockRef, depart, calm = false }: ResultatProps) {
  const own = useRef<HTMLParagraphElement>(null);
  const ref = blockRef ?? own;

  useLayoutEffect(() => {
    const el = ref.current;
    const from = depart?.current;
    if (!el || !depart || typeof el.animate !== "function") return;
    const to = el.getBoundingClientRect();
    if (!from || calm || to.height === 0) {
      // Rien à suivre du regard : un simple fondu.
      const fade = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "linear" });
      return () => fade.cancel();
    }
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = from.height / to.height;
    const move = el.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: "none" }],
      { duration: 360, easing: "cubic-bezier(.2, .8, .2, 1)" },
    );
    return () => move.cancel();
    // Le bloc ne se déplace qu'une fois, à son arrivée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p ref={ref} className={cx("resultat", `resultat--${tier}`, grand && "resultat--grand")} aria-hidden="true">
      <span className="resultat__mot">{t(MOTS[tier])}</span>
      {TIER_RANK[tier] >= TIER_RANK.petit && <span className="resultat__montant">{formatEuros(gain)}</span>}
    </p>
  );
}

interface FeteProps {
  tier: Tier;
  gain: number;
  blockRef: RefObject<HTMLParagraphElement | null>;
  /** Vrai une seconde après le début du jackpot : un toucher passe la fête. */
  skippable: boolean;
  onSkip: () => void;
}

/** Énorme et jackpot : plein écran. Le jackpot ajoute l'éclair, l'écran d'or et le montant qui grossit. */
export function Fete({ tier, gain, blockRef, skippable, onSkip }: FeteProps) {
  return (
    <div
      className={cx("fete", tier === "jackpot" ? "fete--jackpot" : "fete--enorme")}
      onClick={skippable ? onSkip : undefined}
      role="presentation"
    >
      {tier === "jackpot" && <span className="fete__eclair" aria-hidden="true" />}
      <Resultat tier={tier} gain={gain} grand blockRef={blockRef} />
      {skippable && <p className="fete__passer">{t("Touche l'écran pour continuer")}</p>}
    </div>
  );
}
