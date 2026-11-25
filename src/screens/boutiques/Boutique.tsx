// Une boutique (BRIEF.md, section 9.2). Chaque article est une étiquette : carton
// ivoire, œillet et ficelle, illustration, nom, prix, « +8 ★ ». Tri par prix
// croissant ; les articles possédés passent en fin de liste.

import { useState } from "react";
import { KIOSK, SLOT_LABELS, itemsOfShop, shopById } from "../../../shared/catalog";
import { formatEuros, formatInt } from "../../../shared/format";
import { collectionComplete } from "../../../shared/rules";
import type { ItemDef, PlayerState, ShopId, Slot } from "../../../shared/types";
import type { Speaker } from "../../app/dialogues";
import { lineFor } from "../../app/helpers";
import { nav } from "../../app/nav";
import { displayBalance, useGame } from "../../app/store";
import { Illustration } from "../../art/Illustration";
import { Etoile } from "../../art/icons";
import { cx } from "../../ticket/parts";
import { Bourse, Standing } from "../../ui/Bourse";
import { Bulle, Entete, HorsLigne } from "../../ui/Commun";
import "./boutiques.css";

type EtatArticle = "portee" | "cher" | "a-toi" | "porte";

/** Les quatre états d'une étiquette. */
export function etatOf(item: ItemDef, player: PlayerState, balance: number): { etat: EtatArticle; texte: string } {
  const isKiosk = item.id === KIOSK.id;
  const owned = isKiosk ? player.kiosk : player.owned.includes(item.id);
  if (owned) {
    if (!isKiosk && item.slot !== "tresor" && player.look[item.slot] === item.id) {
      return { etat: "porte", texte: item.slot === "residence" ? "installé" : item.slot === "vehicule" ? "au volant" : "porté" };
    }
    return { etat: "a-toi", texte: "à toi" };
  }
  if (balance >= item.price) return { etat: "portee", texte: "à ta portée" };
  return { etat: "cher", texte: `encore ${formatEuros(item.price - balance)}` };
}

function Etiquette({ item, player, balance }: { item: ItemDef; player: PlayerState; balance: number }) {
  const { etat, texte } = etatOf(item, player, balance);
  const owned = etat === "a-toi" || etat === "porte";
  return (
    <li className="etiquette-rang">
      <button
        type="button"
        className={cx("etiquette papier", `etiquette--${etat}`)}
        onClick={() => nav.push({ name: "fiche-article", item: item.id })}
        aria-label={`${item.name}, ${formatEuros(item.price)}, plus ${item.standing} étoiles, ${texte}`}
      >
        <span className="etiquette__oeillet" aria-hidden="true" />
        <span className="etiquette__dessin" aria-hidden="true"><Illustration id={`item:${item.id}`} /></span>
        <span className="etiquette__nom" aria-hidden="true">{item.name}</span>
        {!owned && (
          <span className="etiquette__prix" aria-hidden="true">
            <span className="chiffres">{formatEuros(item.price)}</span>
            <span className="etiquette__etoiles">+{formatInt(item.standing)}<Etoile /></span>
          </span>
        )}
        <span className={cx("etiquette__etat", owned && "etiquette__tampon")} aria-hidden="true">{texte}</span>
      </button>
    </li>
  );
}

export function Boutique({ shop }: { shop: ShopId }) {
  const player = useGame((s) => s.player);
  const balance = useGame(displayBalance);
  const def = shopById(shop);
  const [slot, setSlot] = useState<Slot>(def.slots[0]!);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  if (!player) return null;

  const all = itemsOfShop(shop).filter((i) => i.slot === slot);
  // Quand la collection est complète, Mme Colette met le Kiosque en vente.
  if (shop === "colette" && (collectionComplete(player.owned) || player.kiosk)) all.push(KIOSK);
  const owns = (i: ItemDef) => (i.id === KIOSK.id ? player.kiosk : player.owned.includes(i.id));
  const items = [...all.filter((i) => !owns(i)), ...all.filter(owns)];

  return (
    <main className="ecran ecran--onglets boutique">
      <HorsLigne />
      <Entete titre={def.name} grand retour droite={<><Bourse /><Standing /></>} />
      <Bulle line={lineFor(player, def.keeper as Speaker, "accueil", seed)} />

      {def.slots.length > 1 && (
        <div className="rayons" role="tablist" aria-label="Rayons">
          {def.slots.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={s === slot} className="rayons__onglet" onClick={() => setSlot(s)}>
              {SLOT_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      <ul className="etiquettes" role={def.slots.length > 1 ? "tabpanel" : undefined}>
        {items.map((item) => <Etiquette key={item.id} item={item} player={player} balance={balance} />)}
      </ul>
    </main>
  );
}
