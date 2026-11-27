// La vignette d'un ticket semé (LOT4.md, section 3) : quelqu'un débarque, trouve le ticket
// que le Patron vient de laisser tomber, et dit sa chance. Cinq ou dix tickets d'un coup :
// une petite foule. Quand le geste fait franchir un palier, un protégé donne ensuite de ses
// nouvelles : une carte postale du lieu où il est arrivé.
//
// Tout se déduit du rang du ticket semé : le même rang montre toujours le même nouveau
// venu (src/app/suite/semis.ts). Posée par-dessus la fiche du ticket, la vignette se
// referme sur elle : on peut semer encore.

import { useEffect, useRef, useState } from "react";
import { formatInt } from "../../../shared/format";
import { ticketById } from "../../../shared/tickets";
import { skyOf } from "../../app/helpers";
import { nav } from "../../app/nav";
import {
  ditLaFoule, ditLeNouveauVenu, foule, nouvellesDe, paliersFranchis, type NouveauVenu, type Nouvelles,
} from "../../app/suite/semis";
import { Avatar } from "../../art/Avatar";
import { Illustration } from "../../art/Illustration";
import { Icon } from "../../art/icons";
import { playCoin, playPickUp, playStamp } from "../../fx/audio";
import { t } from "../../i18n";
import { placeName } from "../../i18n/noms";
import { cx } from "../../ticket/parts";
import { Bouton } from "../../ui/Bouton";
import "../moments/moments.css";
import "./semis.css";

/** Le médaillon d'un nouveau venu ou d'un protégé : sa tête, et ce qu'il a dessus. */
export function Tete({ venu, className }: { venu: NouveauVenu; className?: string }) {
  return (
    <span className={cx("portrait", className)}>
      <Avatar species={venu.espece} look={venu.hardes} crop="tete" />
    </span>
  );
}

/** La lettre d'un protégé : ce qu'il écrit, signé de son prénom et du lieu d'où il écrit. */
export function Lettre({ nouvelles, className }: { nouvelles: Nouvelles; className?: string }) {
  return (
    <figure className={cx("lettre", className)}>
      <blockquote className="lettre__texte">{nouvelles.texte}</blockquote>
      <figcaption className="lettre__signature">
        <strong>{nouvelles.protege.prenom}</strong>
        <span>{placeName(nouvelles.lieu)}</span>
      </figcaption>
    </figure>
  );
}

/** Le petit ticket que chacun tient dans la foule. */
function PetitTicket() {
  return <span className="semis__petit-ticket"><Icon name="jouer" plein size={14} /></span>;
}

export function Vignette({ ticket, rang, qty }: { ticket: string; rang: number; qty: number }) {
  const lieu = ticketById(ticket)?.place ?? "kiosque";
  const venus = foule(rang, qty);
  const premier = venus[0]!;
  const seul = venus.length === 1;
  /** Les protégés qui écrivent : un par palier que ce geste a fait franchir. */
  const courrier = paliersFranchis(rang - 1, rang + venus.length - 1).flatMap((palier) => nouvellesDe(palier) ?? []);
  /** 0 : la vignette ; ensuite, une lettre par étape. */
  const [etape, setEtape] = useState(0);
  const corps = useRef<HTMLDivElement>(null);
  const lettre = etape > 0 ? courrier[etape - 1]! : null;
  const derniere = etape >= courrier.length;

  // « Hop » : le ticket est ramassé. Une foule en ramasse plusieurs ; une lettre arrive tamponnée.
  useEffect(() => {
    const timers: number[] = [];
    if (etape === 0) {
      timers.push(window.setTimeout(playPickUp, 720));
      for (let i = 1; i < Math.min(venus.length, 6); i++) timers.push(window.setTimeout(() => playCoin(i), 760 + i * 120));
    } else {
      timers.push(window.setTimeout(playStamp, 260));
      corps.current?.focus();
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [etape, venus.length]);

  const suite = () => {
    if (derniere) nav.back();
    else setEtape(etape + 1);
  };

  const titre = seul
    ? t("Ticket semé n° {n}", { n: formatInt(rang) })
    : t("Tickets semés n° {a} à {b}", { a: formatInt(rang), b: formatInt(rang + venus.length - 1) });

  return (
    <div className="moment moment--semis" role="dialog" aria-modal="true" aria-label={lettre ? t("Un protégé t'écrit") : titre}>
      <div className="moment__decor semis__decor" style={{ backgroundImage: skyOf(lettre ? lettre.lieu : lieu) }} aria-hidden="true">
        {lettre ? (
          // La carte postale : la façade du lieu, et le protégé devant, dans ses beaux habits.
          <div className="semis__scene semis__scene--carte" key={lettre.palier}>
            <Illustration id={`place:${lettre.lieu}`} />
            <span className="semis__venu"><Avatar species={lettre.protege.espece} look={lettre.protege.hardes} /></span>
          </div>
        ) : (
          // Le banc du port, là où l'on s'assoit quand on n'a rien : le ticket tombe, quelqu'un le trouve.
          <div className={cx("semis__scene", !seul && "semis__scene--foule")} key="quai">
            <Illustration id="decor:banc" />
            {seul ? (
              <>
                <span className="semis__venu"><Avatar species={premier.espece} look={premier.hardes} /></span>
                <span className="moment__ticket semis__trouve">
                  <span className="moment__ticket-papier"><Icon name="jouer" plein size={22} /></span>
                  <span className="moment__ticket-eclat" />
                </span>
              </>
            ) : (
              <div className="semis__foule">
                {venus.length > 5 && (
                  <div className="semis__rang semis__rang--fond">
                    {venus.slice(5).map((venu, i) => <span key={venu.rang} className="semis__tete" style={{ animationDelay: `${420 + i * 70}ms` }}><Avatar species={venu.espece} look={venu.hardes} /><PetitTicket /></span>)}
                  </div>
                )}
                <div className="semis__rang">
                  {venus.slice(0, 5).map((venu, i) => <span key={venu.rang} className="semis__tete" style={{ animationDelay: `${180 + i * 70}ms` }}><Avatar species={venu.espece} look={venu.hardes} /><PetitTicket /></span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="moment__corps moment__temps" key={etape} ref={corps} tabIndex={-1}>
        {lettre ? (
          <>
            <p className="moment__chapitre">{t("Des nouvelles de {prenom}", { prenom: lettre.protege.prenom })}</p>
            <Lettre nouvelles={lettre} className="lettre--penchee" />
            <p className="note">{t("À relire dans le Carnet du Patron, sur ton Domaine.")}</p>
          </>
        ) : (
          <>
            <p className="moment__chapitre">{titre}</p>
            <div className="moment__paroles">
              <Tete venu={premier} />
              <div className="moment__bulles">
                <p className="bulle__texte">
                  <span className="bulle__nom">{seul ? premier.prenom : t("{prenom} et les autres", { prenom: premier.prenom })}</span>
                  {t("« {replique} »", { replique: seul ? ditLeNouveauVenu(rang, ticket) : ditLaFoule(rang, venus.length, ticket) })}
                </p>
              </div>
            </div>
          </>
        )}
        <Bouton bloc onClick={suite}>
          {derniere ? t("Continuer") : etape === 0 ? t("Un protégé t'écrit") : t("Encore une lettre")}
        </Bouton>
      </div>
    </div>
  );
}
