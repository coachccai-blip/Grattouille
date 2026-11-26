// Changer de résidence ou de véhicule parmi ceux qu'on possède (BRIEF.md, section 9.4).

import { itemsOfSlot } from "../../../shared/catalog";
import { nav } from "../../app/nav";
import { useGame, wear } from "../../app/store";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { playClick } from "../../fx/audio";
import { t } from "../../i18n";
import { itemName } from "../../i18n/noms";
import { Feuille } from "../../ui/Feuille";
import "./domaine.css";
import "./dressing.css";

export function ChoixDomaine({ slot }: { slot: "residence" | "vehicule" }) {
  const player = useGame((s) => s.player);
  if (!player) return null;
  const owned = itemsOfSlot(slot).filter((i) => player.owned.includes(i.id));
  const current = player.look[slot];
  const choose = (id: string | null) => {
    // Un déclic si le choix change ; la feuille, elle, se referme sur son glissé.
    if (id !== current) playClick(id === null ? -1 : 2);
    void wear(slot, id);
    nav.back();
  };
  const titre = slot === "residence" ? t("Où t'installer ?") : t("Quel véhicule sortir ?");
  return (
    <Feuille titre={titre} onClose={() => nav.back()} className="choix-domaine">
      <h2 className="t-titre">{titre}</h2>
      <div className="choix cascade">
        <button type="button" className="choix__article" aria-pressed={current === null} data-son="choix" onClick={() => choose(null)}>
          {slot === "residence" ? <Illustration id="decor:banc" /> : <span className="choix__rien"><Icon name="fermer" /></span>}
          <span>{slot === "residence" ? t("Le banc du port") : t("À pied")}</span>
        </button>
        {owned.map((item) => (
          <button key={item.id} type="button" className="choix__article" aria-pressed={current === item.id} data-son="choix" onClick={() => choose(item.id)}>
            <Illustration id={`item:${item.id}`} />
            <span>{itemName(item.id)}</span>
          </button>
        ))}
      </div>
    </Feuille>
  );
}
