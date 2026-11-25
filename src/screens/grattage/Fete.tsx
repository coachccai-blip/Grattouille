// Les paliers de résultat (BRIEF.md, section 8.5). La fête du jackpot est le seul
// moment vraiment spectaculaire du jeu : les autres paliers sont sobres pour qu'elle
// porte. Les pièces et les confettis sont dessinés sur le canvas d'effets ; ici ne
// se trouvent que les mots, le montant et la réaction de l'hôte.

import { formatEuros } from "../../../shared/format";
import type { Tier } from "../../../shared/rules";
import type { Line } from "../../app/dialogues";
import { cx } from "../../ticket/parts";
import { Bulle } from "../../ui/Commun";

interface FeteProps {
  tier: Tier;
  gain: number;
  house: boolean;
  /** La réaction de l'hôte du lieu, à partir du palier « gros ». */
  reaction: Line | null;
  /** Vrai une seconde après le début du jackpot : un toucher passe la fête. */
  skippable: boolean;
  onSkip: () => void;
}

const TITRES: Partial<Record<Tier, string>> = {
  joli: "Joli coup",
  gros: "Gros gain",
  enorme: "Énorme",
  jackpot: "Jackpot",
};

export function Fete({ tier, gain, house, reaction, skippable, onSkip }: FeteProps) {
  if (tier === "perdu") {
    return <p className="fete fete--perdu">Rien cette fois.</p>;
  }
  if (tier === "rembourse") {
    return <p className="fete fete--bandeau">Remboursé.</p>;
  }
  if (tier === "petit" || tier === "joli") {
    return (
      <p className={cx("fete fete--bandeau", tier === "joli" && "fete--joli")}>
        {TITRES[tier] && <span className="fete__mot">{TITRES[tier]}</span>}
        <span className="fete__montant">{formatEuros(gain)}</span>
        {house && <span className="fete__mention">Offert par la maison</span>}
      </p>
    );
  }
  if (tier === "gros") {
    return (
      <div className="fete fete--gros">
        <p className="fete--bandeau fete--joli">
          <span className="fete__mot">{TITRES.gros}</span>
          <span className="fete__montant">{formatEuros(gain)}</span>
        </p>
        <Bulle line={reaction} />
      </div>
    );
  }
  // Énorme et jackpot : plein écran.
  return (
    <div
      className={cx("fete fete--plein", tier === "jackpot" && "fete--jackpot")}
      onClick={skippable ? onSkip : undefined}
      role="presentation"
    >
      {tier === "jackpot" && <span className="fete__eclair" aria-hidden="true" />}
      <p className="fete__mot">{TITRES[tier]}</p>
      <p className="fete__montant">{formatEuros(gain)}</p>
      <Bulle line={reaction} />
      {skippable && <p className="fete__passer">Touche l'écran pour continuer</p>}
    </div>
  );
}
