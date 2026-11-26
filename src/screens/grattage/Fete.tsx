// Le résultat d'un ticket (BRIEF.md, section 8.5) : un mot et un montant, les mêmes d'un
// bout à l'autre.
//
// - `Resultat` : le bloc. Pendant la fête, il se tient sur le plateau, sous le ticket,
//   sans jamais le recouvrir. Quand le ticket est parti, le même bloc prend sa place au
//   milieu de la scène. Il ne voyage pas de l'un à l'autre : aucun texte ne passe sur le
//   ticket ni sous un bouton, même le temps d'une animation.
// - `Fete` : les paliers « énorme » et « jackpot », en plein écran. Le fond est opaque
//   (aucun texte ne se lit à travers un autre) et porte le même bloc, en grand.
//
// La fête du jackpot est le seul moment vraiment spectaculaire du jeu : les autres
// paliers sont sobres pour qu'elle porte. Les pièces et les confettis sont dessinés
// sur le canvas d'effets ; l'hôte du lieu, lui, réagit une fois le ticket payé.

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
}

/**
 * Le mot du palier et le montant gagné, en Abril Fatface. Décoratif pour les lecteurs
 * d'écran : la phrase entière est annoncée à part, une fois.
 */
export function Resultat({ tier, gain, grand = false }: ResultatProps) {
  return (
    <p className={cx("resultat", `resultat--${tier}`, grand && "resultat--grand")} aria-hidden="true">
      <span className="resultat__mot">{t(MOTS[tier])}</span>
      {TIER_RANK[tier] >= TIER_RANK.petit && <span className="resultat__montant">{formatEuros(gain)}</span>}
    </p>
  );
}

interface FeteProps {
  tier: Tier;
  gain: number;
  /** Vrai une seconde après le début du jackpot : un toucher passe la fête. */
  skippable: boolean;
  onSkip: () => void;
}

/** Énorme et jackpot : plein écran. Le jackpot ajoute l'éclair, l'écran d'or et le montant qui grossit. */
export function Fete({ tier, gain, skippable, onSkip }: FeteProps) {
  return (
    <div
      className={cx("fete", tier === "jackpot" ? "fete--jackpot" : "fete--enorme")}
      onClick={skippable ? onSkip : undefined}
      role="presentation"
    >
      {tier === "jackpot" && <span className="fete__eclair" aria-hidden="true" />}
      <Resultat tier={tier} gain={gain} grand />
      {skippable && <p className="fete__passer">{t("Touche l'écran pour continuer")}</p>}
    </div>
  );
}
