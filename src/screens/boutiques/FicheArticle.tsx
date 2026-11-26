// Fiche d'un article (BRIEF.md, section 9.2). Une feuille monte du bas : aperçu en
// grand (sur l'avatar pour la garde-robe, dans le décor pour le reste), le prix, les ★,
// et le bouton « Acheter 60 000 € ». Le vendeur, lui, ne parle qu'une fois l'affaire
// conclue : son accueil est déjà dit dans la boutique, juste derrière la feuille.
// Un appui suffit. Si le prix dépasse la moitié du solde, il faut garder le doigt
// posé : le bouton se remplit en 600 ms.

import { useState } from "react";
import { CATALOG, KIOSK, itemById, shopById } from "../../../shared/catalog";
import { formatEuros, formatInt } from "../../../shared/format";
import { bestPlace, nextPlace } from "../../../shared/rules";
import type { LookSlot } from "../../../shared/types";
import { PIOU, type Speaker } from "../../app/dialogues";
import { lineFor, skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import { buyItem, displayBalance, isCovered, useGame, wear } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { playStamp } from "../../fx/audio";
import { envolEtoiles } from "../../fx/envol";
import { haptic } from "../../fx/haptics";
import { t } from "../../i18n";
import { itemName, placeShort, rankName } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton, BoutonMaintenir } from "../../ui/Bouton";
import { Bulle, Phrase } from "../../ui/Commun";
import { Feuille } from "../../ui/Feuille";
import "./boutiques.css";

const WEAR_SLOTS = new Set(["chapeau", "lunettes", "tenue", "accessoire"]);

/** Le domaine expose les trois trésors les plus chers : celui-ci en fait-il partie ? */
function isOnDisplay(itemId: string, owned: readonly string[]): boolean {
  return CATALOG.filter((i) => i.slot === "tresor" && owned.includes(i.id))
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)
    .some((i) => i.id === itemId);
}

export function FicheArticle({ item: id }: { item: string }) {
  const player = useGame((s) => s.player);
  const balance = useGame(displayBalance);
  const online = useGame((s) => s.online);
  const [busy, setBusy] = useState(false);
  const [bought, setBought] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const isKiosk = id === KIOSK.id;
  const item = isKiosk ? KIOSK : itemById(id);
  if (!player || !item) return null;

  const nom = itemName(item.id);
  const shop = shopById(item.shop);
  const owned = isKiosk ? player.kiosk : player.owned.includes(item.id);
  const wearable = WEAR_SLOTS.has(item.slot);
  const slot = item.slot === "tresor" || isKiosk ? null : (item.slot as LookSlot);
  const current = slot ? player.look[slot] === item.id : false;
  const missing = item.price - balance;
  const next = nextPlace(player.standing);
  const acheter = t("Acheter {prix}", { prix: formatEuros(item.price) });

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await buyItem(item.id);
    if (ok) {
      // La caisse a sonné (c'est l'achat lui-même qui la fait sonner) ; le tampon « Vendu »
      // tombe, et les ★ s'envolent vers le compteur, une par note. Sauf si l'achat ouvre un
      // lieu ou conclut l'histoire : le grand moment couvre déjà tout l'écran.
      window.setTimeout(playStamp, 260);
      haptic.buy();
      if (!isCovered(useGame.getState())) {
        envolEtoiles(
          document.querySelector(".fiche-article__etoiles"),
          document.querySelector("[data-standing] .standing__etoile"),
          item.standing,
        );
      }
      setBought(true);
      // Le Kiosque lance le générique de fin : la fiche s'efface.
      if (isKiosk) nav.back();
    }
    setBusy(false);
  };

  return (
    <Feuille titre={nom} onClose={() => nav.back()} className="fiche-article">
      <div className={cx("apercu", wearable ? "apercu--avatar" : "apercu--decor", `apercu--${item.slot}`)}
        style={wearable ? undefined : { backgroundImage: skyOf(bestPlace(player.standing).id) }}>
        {wearable && slot ? (
          <Avatar species={player.species} look={{ ...player.look, [slot]: item.id }} title={t("{nom}, porté", { nom })} />
        ) : (
          <Illustration id={`item:${item.id}`} title={nom} />
        )}
        {owned && (
          <span className={cx("apercu__tampon", bought && "apercu__tampon--frais")} aria-hidden="true">
            {bought ? t("Vendu") : t("À toi")}
          </span>
        )}
      </div>

      <h2 className="t-titre fiche-article__nom">{nom}</h2>
      <p className="fiche-article__prix">
        <span className="chiffres">{formatEuros(item.price)}</span>
        <span className={cx("fiche-article__etoiles", bought && "fiche-article__etoiles--envol")}>
          <Phrase text={t("+{n}★ de Standing", { n: formatInt(item.standing) })} />
        </span>
      </p>
      {bought && <Bulle line={lineFor(player, shop.keeper as Speaker, "vendu", seed)} className="fiche-article__vendeur" />}

      <div className="fiche-article__actions">
        {!owned && missing > 0 && (
          <>
            <p className="fiche-article__manque" role="status">{t("Il te manque {montant}.", { montant: formatEuros(missing) })}</p>
            <Bouton bloc disabled>{acheter}</Bouton>
          </>
        )}
        {!owned && missing <= 0 && (
          item.price > balance / 2 ? (
            <>
              <BoutonMaintenir bloc reflet attente={busy} disabled={!online} onConfirm={() => void buy()}>
                {/* Au clavier ou au lecteur d'écran, une activation suffit : la consigne ne leur est pas lue. */}
                <span className="maintenir__titre">{acheter}</span>
                <span className="maintenir__geste" aria-hidden="true">{t("garde le doigt posé")}</span>
              </BoutonMaintenir>
              {online && <p className="note">{t("C'est plus de la moitié de ta bourse.")}</p>}
            </>
          ) : (
            <Bouton bloc reflet attente={busy} disabled={!online} onClick={() => void buy()}>{acheter}</Bouton>
          )
        )}
        {!owned && !online && <p className="note">{t("Hors connexion. Les boutiques rouvrent dès que le réseau revient.")}</p>}

        {owned && bought && next && (
          <p className="fiche-article__standing">
            <Phrase text={PIOU.standing(next.standing - player.standing, placeShort(next.id))} />
          </p>
        )}
        {owned && slot && wearable && (
          current
            ? <Bouton variante="secondaire" bloc onClick={() => void wear(slot, null)}>{t("Retirer")}</Bouton>
            : <Bouton bloc onClick={() => void wear(slot, item.id)}>{bought ? t("Porter maintenant") : t("Porter")}</Bouton>
        )}
        {owned && slot === "residence" && (
          current ? <p className="note">{t("Tu y habites.")}</p> : <Bouton bloc onClick={() => void wear(slot, item.id)}>{t("S'y installer")}</Bouton>
        )}
        {owned && slot === "vehicule" && (
          current
            ? <p className="note">{t("C'est ton véhicule du moment.")}</p>
            : <Bouton bloc onClick={() => void wear(slot, item.id)}>{t("Prendre le volant")}</Bouton>
        )}
        {owned && item.slot === "tresor" && (
          <p className="note">
            {isOnDisplay(item.id, player.owned)
              ? t("Exposé chez toi, parmi tes trois plus beaux trésors.")
              : t("Rangé dans ta collection : chez toi, seuls tes trois plus beaux trésors sont exposés.")}
          </p>
        )}
        {owned && isKiosk && <p className="note">{t("Le Kiosque est à toi, {rang}.", { rang: rankName(player.standing, true) })}</p>}
        {/* Après un achat, la fiche tient lieu de reçu : on la referme d'un mot. Sinon, la poignée suffit. */}
        {bought && <Bouton variante="texte" onClick={() => nav.back()}>{t("Fermer")}</Bouton>}
      </div>
    </Feuille>
  );
}
