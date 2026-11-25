// Fiche d'un article (BRIEF.md, section 9.2). Une feuille monte du bas : aperçu en
// grand (sur l'avatar pour la garde-robe, dans le décor pour le reste), une phrase
// du vendeur, le prix, les ★, et le bouton « Acheter 60 000 € ».
// Un appui suffit. Si le prix dépasse la moitié du solde, le bouton devient
// « Maintenir pour acheter » et se remplit en 600 ms.

import { useState } from "react";
import { KIOSK, itemById, shopById } from "../../../shared/catalog";
import { formatEuros, formatInt } from "../../../shared/format";
import { bestPlace, nextPlace } from "../../../shared/rules";
import type { LookSlot } from "../../../shared/types";
import { PIOU, type Speaker } from "../../app/dialogues";
import { lineFor, skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import { buyItem, displayBalance, useGame, wear } from "../../app/store";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { Etoile } from "../../art/icons";
import { playCashRegister, playStamp } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { cx } from "../../ticket/parts";
import { Bouton, BoutonMaintenir } from "../../ui/Bouton";
import { Bulle, Phrase } from "../../ui/Commun";
import { Feuille } from "../../ui/Feuille";
import "./boutiques.css";

const WEAR_SLOTS = new Set(["chapeau", "lunettes", "tenue", "accessoire"]);

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

  const shop = shopById(item.shop);
  const owned = isKiosk ? player.kiosk : player.owned.includes(item.id);
  const wearable = WEAR_SLOTS.has(item.slot);
  const slot = item.slot === "tresor" || isKiosk ? null : (item.slot as LookSlot);
  const current = slot ? player.look[slot] === item.id : false;
  const missing = item.price - balance;
  const line = lineFor(player, shop.keeper as Speaker, bought ? "vendu" : "accueil", seed);
  const next = nextPlace(player.standing);

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await buyItem(item.id);
    if (ok) {
      // Tampon « Vendu », bruit de caisse, les ★ s'envolent vers le compteur.
      playCashRegister();
      window.setTimeout(playStamp, 260);
      haptic.buy();
      setBought(true);
      // Le Kiosque lance le générique de fin : la fiche s'efface.
      if (isKiosk) nav.back();
    }
    setBusy(false);
  };

  return (
    <Feuille titre={item.name} onClose={() => nav.back()} className="fiche-article">
      <div className={cx("apercu", wearable ? "apercu--avatar" : "apercu--decor", `apercu--${item.slot}`)}
        style={wearable ? undefined : { backgroundImage: skyOf(bestPlace(player.standing).id) }}>
        {wearable && slot ? (
          <Avatar species={player.species} look={{ ...player.look, [slot]: item.id }} title={`${item.name}, porté`} />
        ) : (
          <Illustration id={`item:${item.id}`} title={item.name} />
        )}
        {owned && <span className={cx("apercu__tampon", bought && "apercu__tampon--frais")} aria-hidden="true">{bought ? "Vendu" : "À toi"}</span>}
      </div>

      <h2 className="t-titre fiche-article__nom">{item.name}</h2>
      <p className="fiche-article__prix">
        <span className="chiffres">{formatEuros(item.price)}</span>
        <span className={cx("fiche-article__etoiles", bought && "fiche-article__etoiles--envol")}>
          +{formatInt(item.standing)}<Etoile /><span className="invisible">étoiles</span> de Standing
        </span>
      </p>
      <Bulle line={line} className="fiche-article__vendeur" />

      <div className="fiche-article__actions">
        {!owned && missing > 0 && (
          <>
            <p className="fiche-article__manque" role="status">Il te manque {formatEuros(missing)}.</p>
            <Bouton bloc disabled>Acheter {formatEuros(item.price)}</Bouton>
          </>
        )}
        {!owned && missing <= 0 && (
          item.price > balance / 2 ? (
            <>
              <BoutonMaintenir bloc attente={busy} disabled={!online} onConfirm={() => void buy()}>
                Maintenir pour acheter {formatEuros(item.price)}
              </BoutonMaintenir>
              <p className="note">C'est plus de la moitié de ta bourse : garde le doigt posé.</p>
            </>
          ) : (
            <Bouton bloc attente={busy} disabled={!online} onClick={() => void buy()}>Acheter {formatEuros(item.price)}</Bouton>
          )
        )}
        {!owned && !online && <p className="note">Hors connexion. Les boutiques rouvrent dès que le réseau revient.</p>}

        {owned && bought && next && (
          <p className="fiche-article__standing"><Phrase text={PIOU.standing(next.standing - player.standing, next.short)} /></p>
        )}
        {owned && slot && wearable && (
          current
            ? <Bouton variante="secondaire" bloc onClick={() => void wear(slot, null)}>Retirer</Bouton>
            : <Bouton bloc onClick={() => void wear(slot, item.id)}>{bought ? "Porter maintenant" : "Porter"}</Bouton>
        )}
        {owned && slot === "residence" && (
          current ? <p className="note">Tu y habites.</p> : <Bouton bloc onClick={() => void wear(slot, item.id)}>S'y installer</Bouton>
        )}
        {owned && slot === "vehicule" && (
          current ? <p className="note">C'est ton véhicule du moment.</p> : <Bouton bloc onClick={() => void wear(slot, item.id)}>Prendre le volant</Bouton>
        )}
        {owned && item.slot === "tresor" && <p className="note">Exposé dans ton domaine, parmi tes trois plus beaux trésors.</p>}
        {owned && isKiosk && <p className="note">Le Kiosque est à toi, Patron.</p>}
        {owned && <Bouton variante="texte" onClick={() => nav.back()}>Fermer</Bouton>}
      </div>
    </Feuille>
  );
}
