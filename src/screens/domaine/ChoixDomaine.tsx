// Changer de résidence ou de véhicule parmi ceux qu'on possède (BRIEF.md, section 9.4).

import { itemsOfSlot } from "../../../shared/catalog";
import { nav } from "../../app/nav";
import { useGame, wear } from "../../app/store";
import { Illustration } from "../../art/Illustration";
import { Feuille } from "../../ui/Feuille";
import "./domaine.css";

export function ChoixDomaine({ slot }: { slot: "residence" | "vehicule" }) {
  const player = useGame((s) => s.player);
  if (!player) return null;
  const owned = itemsOfSlot(slot).filter((i) => player.owned.includes(i.id));
  const current = player.look[slot];
  const choose = (id: string | null) => {
    void wear(slot, id);
    nav.back();
  };
  const titre = slot === "residence" ? "Où t'installer ?" : "Quel véhicule sortir ?";
  return (
    <Feuille titre={titre} onClose={() => nav.back()}>
      <h2 className="t-titre">{titre}</h2>
      <div className="choix" style={{ marginTop: 16 }}>
        <button type="button" className="choix__article" aria-pressed={current === null} onClick={() => choose(null)}>
          {slot === "residence" ? <Illustration id="decor:banc" /> : <span className="choix__rien">à pied</span>}
          <span>{slot === "residence" ? "Le banc du port" : "À pied"}</span>
        </button>
        {owned.map((item) => (
          <button key={item.id} type="button" className="choix__article" aria-pressed={current === item.id} onClick={() => choose(item.id)}>
            <Illustration id={`item:${item.id}`} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </Feuille>
  );
}
