// Dressing (BRIEF.md, section 9.3). On y entre en touchant son avatar. Quatre
// onglets, un par emplacement, avec les articles possédés et l'option « Rien ».
// On y change aussi d'espèce, gratuitement.

import { useState } from "react";
import { itemsOfSlot } from "../../../shared/catalog";
import { SPECIES } from "../../../shared/rules";
import { nav } from "../../app/nav";
import { changeSpecies, useGame, wear } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { playClick } from "../../fx/audio";
import { t } from "../../i18n";
import { itemName, keeperName, speciesName } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import { Entete } from "../../ui/Commun";
import "./domaine.css";
import "../bienvenue/bienvenue.css";
import "./dressing.css";

type WearSlot = "chapeau" | "lunettes" | "tenue" | "accessoire";

/** Les libellés restent en français ici : c'est l'affichage qui les traduit. */
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
      <Entete titre={t("Dressing")} retour />
      <div className="dressing__miroir">
        <Avatar species={player.species} look={player.look} title={t("{pseudo} dans le miroir", { pseudo: player.pseudo })} />
      </div>

      <div className="dressing__onglets" role="tablist" aria-label={t("Emplacements")}>
        {SLOTS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === slot}
            className="dressing__onglet"
            data-son="choix"
            onClick={() => {
              if (s.id !== slot) playClick(i);
              setSlot(s.id);
            }}
          >
            {t(s.label)}
          </button>
        ))}
      </div>

      {owned.length > 0 ? (
        <div className="choix cascade" role="tabpanel">
          <button
            type="button"
            className="choix__article"
            aria-pressed={worn === null}
            data-son="choix"
            onClick={() => {
              if (worn !== null) playClick(-1);
              void wear(slot, null);
            }}
          >
            <span className="choix__rien"><Icon name="fermer" /></span>
            <span>{t("Rien")}</span>
          </button>
          {owned.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="choix__article"
              aria-pressed={worn === item.id}
              data-son="choix"
              onClick={() => {
                if (worn !== item.id) playClick(i);
                void wear(slot, item.id);
              }}
            >
              <Illustration id={`item:${item.id}`} />
              <span>{itemName(item.id)}</span>
            </button>
          ))}
        </div>
      ) : (
        // Rien à choisir : une phrase et le chemin de la boutique, plutôt qu'une case « Rien » toute seule.
        <div className="dressing__vide" role="tabpanel">
          <p className="note">{t("Rien à porter ici pour l'instant.")}</p>
          <Bouton variante="texte" onClick={() => nav.reset([{ name: "boutiques" }, { name: "boutique", shop: "sidonie" }])}>
            {t("Aller chez {vendeur}", { vendeur: keeperName("sidonie") })}
          </Bouton>
        </div>
      )}

      <section className="rubrique" aria-labelledby="dressing-espece">
        <h2 className="rubrique__titre" id="dressing-espece">{t("Changer d'espèce, c'est gratuit")}</h2>
        <div className="especes__grille cascade">
          {SPECIES.map((s, i) => (
            <button
              key={s}
              type="button"
              className={cx("espece", s === player.species && "espece--choisie")}
              aria-pressed={s === player.species}
              data-son="choix"
              onClick={() => {
                if (s !== player.species) playClick(i);
                void changeSpecies(s);
              }}
            >
              <Avatar species={s} crop="tete" />
              <span>{speciesName(s)}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
