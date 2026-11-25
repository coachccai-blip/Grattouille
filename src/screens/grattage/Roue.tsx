// La roue des signes (BRIEF.md, section 7.7). Avant de gratter un ticket du moteur
// `etoile`, le joueur choisit son signe. Le choix est mémorisé sur l'appareil et
// proposé par défaut la fois suivante.

import type { TicketDef } from "../../../shared/types";
import { Symbole } from "../../art/Illustration";
import { optStrings } from "../../engines/common";
import { cx } from "../../ticket/parts";
import { SYMBOL_NAMES, symbolKey } from "../../ticket/themes";
import { Bouton } from "../../ui/Bouton";

interface RoueProps {
  def: TicketDef;
  pick: string;
  onPick: (sign: string) => void;
  onGo: () => void;
}

export function Roue({ def, pick, onPick, onGo }: RoueProps) {
  const signs = optStrings(def.options, "signs");
  const pickKey = symbolKey(def.options.family, pick);
  const sombre = def.id === "signe-du-homard";
  return (
    <div className={cx("roue", sombre && "roue--nuit")}>
      <h2 className="t-titre">Choisis ton signe</h2>
      <div className="roue__cercle" role="radiogroup" aria-label="Ton signe" style={{ "--n": signs.length } as React.CSSProperties}>
        {signs.map((sign, i) => {
          const key = symbolKey(def.options.family, sign);
          return (
            <button
              key={sign}
              type="button"
              role="radio"
              aria-checked={sign === pick}
              aria-label={SYMBOL_NAMES[key] ?? sign}
              className={cx("roue__signe", sign === pick && "roue__signe--choisi")}
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => onPick(sign)}
            >
              <Symbole cle={key} />
            </button>
          );
        })}
        <div className="roue__centre" aria-hidden="true">
          <Symbole cle={pickKey} />
          <strong>{SYMBOL_NAMES[pickKey] ?? pick}</strong>
        </div>
      </div>
      <p className="note">Ton signe ne change pas tes chances. Il change la tête du ticket.</p>
      <Bouton bloc onClick={onGo}>Gratter avec ce signe</Bouton>
    </div>
  );
}
