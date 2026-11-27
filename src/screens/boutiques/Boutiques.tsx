// Les quatre boutiques (BRIEF.md, section 9.1) : quatre vitrines et « Ma collection ».

import { COLLECTION_SIZE, KIOSK, SHOPS, itemsOfShop } from "../../../shared/catalog";
import { formatEuros } from "../../../shared/format";
import { collectionComplete } from "../../../shared/rules";
import { nav } from "../../app/nav";
import { useGame } from "../../app/store";
import { Portrait } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { t } from "../../i18n";
import { keeperName, shopBlurb, shopName } from "../../i18n/noms";
import { Bourse, Standing } from "../../ui/Bourse";
import { Barre, Entete } from "../../ui/Commun";
import { Enseigne as EnseigneAgence } from "../agence/Enseigne";
import "./boutiques.css";

export function Boutiques() {
  const player = useGame((s) => s.player);
  if (!player) return null;
  const kioskForSale = collectionComplete(player.owned) && !player.kiosk;
  return (
    <main className="ecran ecran--onglets boutiques">
      <Entete titre={t("Boutiques")} grand droite={<><Bourse /><Standing /></>} />

      <div className="collection">
        <p className="collection__titre">
          {t("Ma collection : {n} sur {total}", { n: player.owned.length, total: COLLECTION_SIZE })}
        </p>
        <Barre value={player.owned.length} max={COLLECTION_SIZE} />
      </div>

      {kioskForSale && (
        <button type="button" className="objectif objectif--kiosque" onClick={() => nav.push({ name: "boutique", shop: "colette" })}>
          <span className="objectif__titre">{t("Le Kiosque est à vendre")}</span>
          <span className="objectif__compte">
            {t("Chez {vendeur}, pour {prix}.", { vendeur: keeperName("colette"), prix: formatEuros(KIOSK.price) })}
          </span>
        </button>
      )}

      <ul className="vitrines cascade">
        {SHOPS.map((shop) => {
          const items = itemsOfShop(shop.id);
          const owned = items.filter((i) => player.owned.includes(i.id)).length;
          const compte = t("{n} sur {total}", { n: owned, total: items.length });
          return (
            <li key={shop.id}>
              <button
                type="button"
                className={`vitrine vitrine--${shop.id}`}
                onClick={() => nav.push({ name: "boutique", shop: shop.id })}
                aria-label={t("{boutique}, {rayon}, par {vendeur}. {compte}.", {
                  boutique: shopName(shop.id), rayon: shopBlurb(shop.id), vendeur: keeperName(shop.id), compte,
                })}
              >
                {/* Une vitrine a la forme d'une vitrine : un store rayé, une glace, une enseigne. */}
                <span className="vitrine__store" aria-hidden="true" />
                <span className="vitrine__glace" aria-hidden="true">
                  <Portrait pnj={shop.keeper} />
                  {/* Le nom de la boutique dit déjà qui la tient : l'enseigne s'en tient au rayon. */}
                  <span className="vitrine__enseigne">
                    <span className="vitrine__nom">{shopName(shop.id)}</span>
                    <span className="vitrine__rayon">{shopBlurb(shop.id)}</span>
                    <span className="vitrine__compte">{compte}</span>
                  </span>
                  <Icon name="chevron" />
                </span>
              </button>
            </li>
          );
        })}
        {/* La cinquième enseigne : l'Agence Carpe Diem. On y vend des souvenirs, pas des biens. */}
        <EnseigneAgence />
      </ul>
    </main>
  );
}
