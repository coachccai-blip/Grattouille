// Les quatre boutiques (BRIEF.md, section 9.1) : quatre vitrines et « Ma collection ».

import { COLLECTION_SIZE, SHOPS, itemsOfShop } from "../../../shared/catalog";
import { collectionComplete } from "../../../shared/rules";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { Portrait } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { Bourse, Standing } from "../../ui/Bourse";
import { Barre, Entete } from "../../ui/Commun";
import "./boutiques.css";

export function Boutiques() {
  const player = useGame((s) => s.player);
  if (!player) return null;
  const kioskForSale = collectionComplete(player.owned) && !player.kiosk;
  return (
    <main className="ecran ecran--onglets boutiques">
      <Entete titre="Boutiques" grand droite={<><Bourse /><Standing /></>} />

      <section className="collection" aria-label="Ma collection">
        <p className="collection__titre">Ma collection : {player.owned.length} sur {COLLECTION_SIZE}</p>
        <Barre value={player.owned.length} max={COLLECTION_SIZE} />
      </section>

      {kioskForSale && (
        <button type="button" className="objectif objectif--kiosque" onClick={() => nav.push({ name: "boutique", shop: "colette" })}>
          <span className="objectif__titre">Le Kiosque est à vendre</span>
          <span className="objectif__compte">Collection complète. Mme Colette a quelque chose pour vous.</span>
        </button>
      )}

      <ul className="vitrines">
        {SHOPS.map((shop) => {
          const items = itemsOfShop(shop.id);
          const owned = items.filter((i) => player.owned.includes(i.id)).length;
          return (
            <li key={shop.id}>
              <button
                type="button"
                className={`vitrine vitrine--${shop.id}`}
                onClick={() => nav.push({ name: "boutique", shop: shop.id })}
                aria-label={`${shop.name}, ${shop.blurb.toLowerCase()}, tenue par ${shop.keeperName}. ${owned} sur ${items.length}`}
              >
                {/* Une vitrine a la forme d'une vitrine : un store rayé, une glace, une enseigne. */}
                <span className="vitrine__store" aria-hidden="true" />
                <span className="vitrine__glace" aria-hidden="true">
                  <Portrait pnj={shop.keeper} />
                  <span className="vitrine__enseigne">
                    <span className="vitrine__nom">{shop.name}</span>
                    <span className="vitrine__rayon">{shop.blurb}, par {shop.keeperName}</span>
                    <span className="vitrine__compte">{owned} sur {items.length}</span>
                  </span>
                  <Icon name="chevron" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
