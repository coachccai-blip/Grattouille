// L'annonce d'une médaille qui vient d'être gagnée : un carton de papier qui descend prendre,
// quelques secondes, la place exacte de la barre d'en-tête de l'écran (sa hauteur, pas un
// pixel de plus : rien d'autre n'est recouvert), avec le dessin de la médaille et son nom.
// Au-delà de trois médailles gagnées d'un coup, un seul carton les annonce toutes. Un appui
// dessus ouvre la vitrine. Le moment, c'est le tour de parole (Annonces.tsx) qui en décide.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { playStars } from "../../fx/audio";
import { haptic } from "../../fx/haptics";
import { t } from "../../i18n";
import { cx } from "../../ticket/parts";
import { Medaille } from "./art";
import { lireMedaille, nomMedaille } from "./textes";
import "./trophees.css";

interface AnnonceProps {
  /** Une médaille, ou plusieurs gagnées d'un coup : « famille:rang ». */
  medailles: string[];
  /** L'annonce a fini son temps, ou le joueur l'a touchée (`ouvrir`) pour aller voir la vitrine. */
  onFin: (ouvrir: boolean) => void;
}

/** Le temps qu'une annonce reste à l'écran, puis celui qu'elle met à repartir. */
const DUREE_MS = 3800;
const DUREE_GROUPE_MS = 4600;
const SORTIE_MS = 240;

/** Dans une annonce groupée, les médailles dessinées : les dernières tombées, quatre au plus. */
const MONTREES = 4;

/** La barre d'en-tête de l'écran affiché, si elle est à sa place (la page n'a pas défilé). */
function barreDEnTete(): DOMRect | null {
  const rect = document.querySelector(".jeu__fond > .ecran .entete__barre")?.getBoundingClientRect();
  return rect && rect.height >= 44 && rect.top >= 0 && rect.top < 140 ? rect : null;
}

export function Annonce({ medailles, onFin }: AnnonceProps) {
  const [sort, setSort] = useState(false);
  const [place, setPlace] = useState<CSSProperties>();
  const carton = useRef<HTMLDivElement>(null);
  const fin = useRef(onFin);
  fin.current = onFin;
  const groupe = medailles.length > 1;
  const lues = medailles.map(lireMedaille).filter((lue) => lue !== null);

  // Le carton se pose sur la barre d'en-tête, à sa hauteur. À défaut (une feuille ouverte sur une
  // page qui a défilé), il garde sa place en haut de l'écran, jamais sous l'encoche du téléphone.
  useLayoutEffect(() => {
    const barre = barreDEnTete();
    if (!barre || !carton.current) return;
    const haut = parseFloat(getComputedStyle(carton.current).top) || 0;
    setPlace({ top: Math.max(barre.top, haut), "--annonce-h": `${barre.height}px` } as CSSProperties);
  }, []);

  useEffect(() => {
    // Une note par rang de la médaille : plus elle est haute, plus la gamme monte.
    playStars(groupe ? 8 : 2 + (lues[0]?.rang ?? 1));
    haptic.tier("joli");
    const duree = groupe ? DUREE_GROUPE_MS : DUREE_MS;
    const part = window.setTimeout(() => setSort(true), duree);
    const finie = window.setTimeout(() => fin.current(false), duree + SORTIE_MS);
    return () => {
      window.clearTimeout(part);
      window.clearTimeout(finie);
    };
    // Une annonce ne change pas en cours de route : le crieur en monte une nouvelle à chaque fois.
  }, []);

  const premiere = lues[0];
  if (!premiere) return null;
  // Une médaille gagnée dévoile toujours son trophée : son nom se dit, même celui d'un trophée mystère.
  const nom = nomMedaille(medailles[0]!);
  const n = medailles.length;

  return (
    <div ref={carton} className={cx("annonce", sort && "annonce--sort")} style={place} role="status">
      <button
        type="button"
        className={cx("annonce__carton papier", groupe && "annonce__carton--groupe")}
        onClick={() => fin.current(true)}
        aria-label={groupe
          ? t("{n} nouvelles médailles. Voir les trophées", { n })
          : t("Nouvelle médaille : {nom}. Voir les trophées", { nom })}
      >
        <span className="annonce__medailles" aria-hidden="true">
          {(groupe ? lues.slice(-MONTREES) : [premiere]).map((lue) => (
            <Medaille key={`${lue.famille.id}:${lue.rang}`} famille={lue.famille.id} rang={lue.rang} />
          ))}
          <span className="annonce__eclat" />
        </span>
        <span className="annonce__texte" aria-hidden="true">
          <span className="annonce__titre">{groupe ? t("D'un seul coup") : t("Nouvelle médaille")}</span>
          <span className="annonce__nom">{groupe ? t("{n} nouvelles médailles", { n }) : nom}</span>
        </span>
      </button>
    </div>
  );
}
