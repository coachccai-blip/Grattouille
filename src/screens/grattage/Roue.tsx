// Le choix avant de gratter (BRIEF.md, section 7.7).
// - Moteur `etoile` : la roue des signes. Le joueur choisit son signe.
// - Moteur `camps` : deux camps face à face. Le joueur choisit le sien.
// Le choix est mémorisé sur l'appareil et proposé par défaut la fois suivante.
// Il ne change pas les chances : il change la tête du ticket.

import type { TicketDef } from "../../../shared/types";
import { pickNote } from "../../app/helpers";
import { Symbole } from "../../art/Illustration";
import { pickOptions } from "../../engines";
import { optString } from "../../engines/common";
import { playClick } from "../../fx/audio";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { symbolKey, symbolName } from "../../ticket/themes";
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
  const note = pickNote(def);
  return (
    <div className={cx("roue roue--camps", SOMBRES.has(def.id) && "roue--nuit")}>
      <h2 className="t-titre">{t("Choisis ton camp")}</h2>
      <div className="camps" role="radiogroup" aria-label={t("Ton camp")}>
        {camps.map((camp, i) => {
          const key = `${family}:${camp}`;
          return (
            <button
              key={camp}
              type="button"
              role="radio"
              aria-checked={camp === pick}
              className={cx("camps__camp", camp === pick && "camps__camp--choisi")}
              data-son="choix"
              onClick={() => {
                // Un déclic par changement de camp.
                if (camp !== pick) playClick(i * 2);
                onPick(camp);
              }}
            >
              <Symbole cle={key} />
              <strong>{symbolName(key, camp)}</strong>
              {i === 0 && <span className="camps__contre" aria-hidden="true">{t("ou")}</span>}
            </button>
          );
        })}
      </div>
      {note && <p className="note">{t(note)}</p>}
      <Bouton bloc onClick={onGo}>{t("Gratter")}</Bouton>
    </div>
  );
}

export function Roue(props: RoueProps) {
  const { def, pick, onPick, onGo } = props;
  if (def.engine === "camps") return <Camps {...props} />;
  const signs = pickOptions(def);
  const pickKey = symbolKey(def.options.family, pick);
  const arcanes = def.options.family === "arcane";
  const note = pickNote(def);
  return (
    <div className={cx("roue", SOMBRES.has(def.id) && "roue--nuit")}>
      <h2 className="t-titre">{arcanes ? t("Choisis ton arcane") : t("Choisis ton signe")}</h2>
      <div
        className="roue__cercle"
        role="radiogroup"
        aria-label={arcanes ? t("Ton arcane") : t("Ton signe")}
        style={{ "--n": signs.length } as React.CSSProperties}
      >
        {signs.map((sign, i) => {
          const key = symbolKey(def.options.family, sign);
          return (
            <button
              key={sign}
              type="button"
              role="radio"
              aria-checked={sign === pick}
              aria-label={symbolName(key, sign)}
              className={cx("roue__signe", sign === pick && "roue__signe--choisi")}
              style={{ "--i": i } as React.CSSProperties}
              data-son="choix"
              onClick={() => {
                // Un déclic par changement de signe : la roue a ses cinq notes.
                if (sign !== pick) playClick(i);
                onPick(sign);
              }}
            >
              <Symbole cle={key} />
            </button>
          );
        })}
        <div className="roue__centre" aria-hidden="true">
          <Symbole cle={pickKey} />
          <strong>{symbolName(pickKey, pick)}</strong>
        </div>
      </div>
      {note && <p className="note">{t(note)}</p>}
      <Bouton bloc onClick={onGo}>{t("Gratter")}</Bouton>
    </div>
  );
}
