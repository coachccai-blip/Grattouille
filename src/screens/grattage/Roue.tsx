// Le choix avant de gratter (BRIEF.md, section 7.7).
// - Moteur `etoile` : la roue des signes. Le joueur choisit son signe.
// - Moteur `camps` : deux camps face à face. Le joueur choisit le sien.
// Le choix est mémorisé sur l'appareil et proposé par défaut la fois suivante.
// Il ne change pas les chances : il change la tête du ticket.

import type { TicketDef } from "../../../shared/types";
import { Symbole } from "../../art/Illustration";
import { pickOptions } from "../../engines";
import { optString } from "../../engines/common";
import { cx } from "../../ticket/parts";
import { SYMBOL_NAMES, symbolKey } from "../../ticket/themes";
import { Bouton } from "../../ui/Bouton";

interface RoueProps {
  def: TicketDef;
  pick: string;
  onPick: (sign: string) => void;
  onGo: () => void;
}

/** Les tickets dont le choix se fait sur fond de nuit. */
const SOMBRES = new Set(["signe-du-homard", "babord-tribord", "eclipse-totale"]);

function Camps({ def, pick, onPick, onGo }: RoueProps) {
  const family = optString(def.options, "family", "roulette");
  const camps = pickOptions(def);
  return (
    <div className={cx("roue roue--camps", SOMBRES.has(def.id) && "roue--nuit")}>
      <h2 className="t-titre">Choisis ton camp</h2>
      <div className="camps" role="radiogroup" aria-label="Ton camp">
        {camps.map((camp, i) => {
          const key = `${family}:${camp}`;
          return (
            <button
              key={camp}
              type="button"
              role="radio"
              aria-checked={camp === pick}
              className={cx("camps__camp", camp === pick && "camps__camp--choisi")}
              onClick={() => onPick(camp)}
            >
              <Symbole cle={key} />
              <strong>{SYMBOL_NAMES[key] ?? camp}</strong>
              {i === 0 && <span className="camps__contre" aria-hidden="true">ou</span>}
            </button>
          );
        })}
      </div>
      <p className="note">Ton camp ne change pas tes chances. Il change ton cœur.</p>
      <Bouton bloc onClick={onGo}>Gratter avec ce camp</Bouton>
    </div>
  );
}

export function Roue(props: RoueProps) {
  const { def, pick, onPick, onGo } = props;
  if (def.engine === "camps") return <Camps {...props} />;
  const signs = pickOptions(def);
  const pickKey = symbolKey(def.options.family, pick);
  const arcanes = def.options.family === "arcane";
  return (
    <div className={cx("roue", SOMBRES.has(def.id) && "roue--nuit")}>
      <h2 className="t-titre">{arcanes ? "Choisis ton arcane" : "Choisis ton signe"}</h2>
      <div className="roue__cercle" role="radiogroup" aria-label={arcanes ? "Ton arcane" : "Ton signe"} style={{ "--n": signs.length } as React.CSSProperties}>
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
      <p className="note">
        {arcanes ? "Ton arcane ne change pas tes chances. Il change la tête du ticket." : "Ton signe ne change pas tes chances. Il change la tête du ticket."}
      </p>
      <Bouton bloc onClick={onGo}>{arcanes ? "Gratter avec cet arcane" : "Gratter avec ce signe"}</Bouton>
    </div>
  );
}
