// Dressing (BRIEF.md, section 9.3). On y entre en touchant son avatar. Quatre
// onglets, un par emplacement, avec les articles possédés et l'option « Rien ».
// On y change aussi d'espèce, gratuitement.

import { useState } from "react";
import { itemsOfSlot } from "../../../shared/catalog";
import { SPECIES, SPECIES_LABELS } from "../../../shared/rules";
import { nav } from "../../app/nav";
import { changeSpecies, useGame, wear } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Entete } from "../../ui/Commun";
import "./domaine.css";
import "../bienvenue/bienvenue.css";

type WearSlot = "chapeau" | "lunettes" | "tenue" | "accessoire";

const SLOTS: { id: WearSlot; label: string }[] = [
  { id: "chapeau", label: "Chapeau" },
  { id: "lunettes", label: "Lunettes" },
  { id: "tenue", label: "Tenue" },
  { id: "accessoire", label: "Accessoire" },
];

export function Dressing() {
  const player = useGame((s) => s.player);
  const [slot, setSlot] = useState<WearSlot>("chapeau");
  if (!player) return null;
  const owned = itemsOfSlot(slot).filter((i) => player.owned.includes(i.id));
  const worn = player.look[slot];

  return (
    <main className="ecran dressing">
      <Entete titre="Dressing" retour />
      <div className="dressing__miroir">
        <Avatar species={player.species} look={player.look} title={`${player.pseudo} dans le miroir`} />
      </div>

      <div className="dressing__onglets" role="tablist" aria-label="Emplacements">
        {SLOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === slot}
            className="dressing__onglet"
            onClick={() => setSlot(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="choix" role="tabpanel">
        <button type="button" className="choix__article" aria-pressed={worn === null} onClick={() => void wear(slot, null)}>
          <span className="choix__rien"><Icon name="fermer" /></span>
          <span>Rien</span>
        </button>
        {owned.map((item) => (
          <button
            key={item.id}
            type="button"
            className="choix__article"
            aria-pressed={worn === item.id}
            onClick={() => void wear(slot, item.id)}
          >
            <Illustration id={`item:${item.id}`} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
      {owned.length === 0 && (
        <div>
          <p className="note">Rien dans ce rayon pour l'instant. Mlle Sidonie a ce qu'il faut.</p>
          <Bouton variante="texte" onClick={() => nav.reset([{ name: "boutiques" }, { name: "boutique", shop: "sidonie" }])}>
            Aller chez Sidonie
          </Bouton>
        </div>
      )}

      <section className="rubrique" aria-label="Espèce">
        <h2 className="rubrique__titre">Espèce : on en change quand on veut, c'est gratuit</h2>
        <div className="especes__grille">
          {SPECIES.map((s) => (
            <button
              key={s}
              type="button"
              className={cx("espece", s === player.species && "espece--choisie")}
              aria-pressed={s === player.species}
              onClick={() => void changeSpecies(s)}
            >
              <Avatar species={s} crop="tete" />
              <span>{SPECIES_LABELS[s]}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
