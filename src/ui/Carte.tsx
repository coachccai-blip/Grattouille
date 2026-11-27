// Une carte à jouer qui se retourne : sa face, son dos, 250 ms autour de l'axe vertical.
// Elle reprend le dessin des tickets à cartes (Réussite, Le 21 d'Hector) : carton blanc,
// la valeur en Jost gras, les enseignes et les figures du registre (le valet est un
// lièvre, la dame une chatte, le roi un ours). Tout est dessiné en SVG : la carte se
// met à l'échelle d'un bloc, de 40 à 96 px de large.
//
// Pour le poker comme pour le reste :
//
//   <Carte carte="Ah" />                    as de cœur, de face
//   <Carte carte="Td" largeur={72} />       dix de carreau, en grand
//   <Carte carte={main[0]} cachee={!vue} /> de dos, puis retournée quand `vue` passe à vrai
//   <Carte />                               une carte inconnue : forcément de dos
//   <Carte carte={c} cachee dore />         de dos, et ce dos est doré (le jeu de qui a vu la vraie fin)
//
// Une carte s'écrit à l'internationale, comme dans shared/poker/cards.ts : la valeur
// (2 à 9, T, J, Q, K, A) puis la couleur (s pique, h cœur, d carreau, c trèfle). Elle
// s'affiche dans la langue du jeu : V, D, R en français, J, Q, K en anglais.
//
// Le son est l'affaire de qui la retourne (`playCardFlip`, `playCardDeal`), sauf à le
// demander ici avec `sonne`.

import { useEffect, useRef, type CSSProperties } from "react";
import { Symbole } from "../art/Illustration";
import { playCardFlip } from "../fx/audio";
import { pick, t } from "../i18n";
import { cx } from "../ticket/parts";
import "./carte.css";

type Enseigne = "pique" | "coeur" | "carreau" | "trefle";

const ENSEIGNES: Record<string, Enseigne> = { s: "pique", h: "coeur", d: "carreau", c: "trefle" };
// Les noms français : ce sont les clés de traduction, lues à l'affichage (« pique » devient « spades »).
const NOMS_ENSEIGNES: Record<Enseigne, string> = { pique: "pique", coeur: "cœur", carreau: "carreau", trefle: "trèfle" };
const NOMS_FIGURES: Record<string, string> = { J: "valet", Q: "dame", K: "roi", A: "as" };
const FIGURES: Record<string, string> = { J: "carte:valet", Q: "carte:dame", K: "carte:roi" };
/** Les figures s'écrivent V, D, R en français, et J, Q, K en anglais. */
const RANGS_FR: Record<string, string> = { J: "V", Q: "D", K: "R" };

interface Lue {
  /** La valeur, à l'internationale : « 2 » à « 9 », « T », « J », « Q », « K », « A ». */
  valeur: string;
  enseigne: Enseigne;
  rouge: boolean;
}

/** Lit « Ah », « Td »... Rend `null` pour ce qui n'est pas une carte. */
function lire(carte: string | null | undefined): Lue | null {
  if (typeof carte !== "string" || carte.length !== 2) return null;
  const valeur = carte[0]!.toUpperCase();
  const enseigne = ENSEIGNES[carte[1]!.toLowerCase()];
  if (!enseigne || !"23456789TJQKA".includes(valeur)) return null;
  return { valeur, enseigne, rouge: enseigne === "coeur" || enseigne === "carreau" };
}

/** Ce qui s'imprime dans le coin : « 10 », « V », « A »... dans la langue du jeu. */
function rangAffiche(valeur: string): string {
  if (valeur === "T") return "10";
  return pick<Record<string, string>>({ fr: RANGS_FR, en: {} })[valeur] ?? valeur;
}

/** « as de cœur », « ten of diamonds » : le nom d'une carte, dans la langue du jeu. `null` si ce n'en est pas une. */
export function nomDeCarte(carte: string | null | undefined): string | null {
  const lue = lire(carte);
  if (!lue) return null;
  const figure = NOMS_FIGURES[lue.valeur];
  return t("{rang} de {couleur}", {
    rang: figure ? t(figure) : rangAffiche(lue.valeur),
    couleur: t(NOMS_ENSEIGNES[lue.enseigne]),
  });
}

interface CarteProps {
  /** La carte : « Ah », « Td », « 7s ». Absente ou illisible : une carte inconnue, de dos. */
  carte?: string | null;
  /** De dos. Changer cette valeur retourne la carte, en 250 ms. */
  cachee?: boolean;
  /** Largeur en pixels, de 40 à 96 (56 par défaut). La hauteur suit : 7 pour 5. */
  largeur?: number;
  /** Mise en avant : la carte choisie, la carte gagnante. */
  choisie?: boolean;
  /** Le dos doré : celui du jeu de cartes de qui a vu la vraie fin. */
  dore?: boolean;
  /** Elle fait entendre son retournement elle-même (sinon, c'est à l'écran d'appeler `playCardFlip`). */
  sonne?: boolean;
  /**
   * Ce qu'en lit un lecteur d'écran. Par défaut : le nom de la carte quand elle est de
   * face ; rien quand elle est de dos (à l'écran de dire, s'il le faut, à qui elle est).
   */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Une figure, une enseigne : une illustration du registre, posée dans le dessin de la
 * carte. `x`, `y`, `c` : le coin et le côté du carré qu'elle occupe, dans le repère de
 * la carte (50 × 70).
 */
function Dessin({ cle, x, y, c }: { cle: string; x: number; y: number; c: number }) {
  // Les illustrations sont des <svg> qui remplissent la largeur de ce qui les porte : ce
  // cadre de même proportion que la carte les ramène à un carré de côté `c`.
  return (
    <svg x={x} y={y - c * 0.2} width={c} height={c * 1.4} viewBox="0 0 50 70" aria-hidden="true">
      <Symbole cle={cle} />
    </svg>
  );
}

export function Carte({ carte, cachee = false, largeur = 56, choisie = false, dore = false, sonne = false, label, className, style }: CarteProps) {
  const lue = lire(carte);
  const dos = cachee || !lue;
  // Le son du retournement, si on le lui a confié : à chaque changement de côté, pas à l'arrivée.
  const avant = useRef(dos);
  useEffect(() => {
    if (avant.current === dos) return;
    avant.current = dos;
    if (sonne) playCardFlip();
  }, [dos, sonne]);

  const nom = label ?? (dos ? undefined : nomDeCarte(carte) ?? undefined);
  const figure = lue ? FIGURES[lue.valeur] : undefined;
  const rang = lue ? rangAffiche(lue.valeur) : "";
  return (
    <span
      className={cx("carte", dos && "carte--cachee", lue?.rouge && "carte--rouge", choisie && "carte--choisie", dore && "carte--doree", className)}
      style={{ "--carte-l": `${largeur}px`, ...style } as CSSProperties}
      role={nom ? "img" : undefined}
      aria-label={nom}
      aria-hidden={nom ? undefined : true}
    >
      <span className="carte__pivot">
        <svg className="carte__face" viewBox="0 0 50 70" aria-hidden="true" focusable="false">
          <rect className="carte__carton" x="0.6" y="0.6" width="48.8" height="68.8" rx="5" />
          {lue && (
            <>
              {/* Le coin : la valeur, et l'enseigne dessous. */}
              <text className={cx("carte__rang", rang.length > 1 && "carte__rang--large")} x="10.5" y="17">{rang}</text>
              <Dessin cle={`carte:${lue.enseigne}`} x={4.5} y={20} c={12} />
              {/* Le milieu : la figure, ou l'enseigne en grand. */}
              {figure
                ? <Dessin cle={figure} x={15} y={26} c={32} />
                : <Dessin cle={`carte:${lue.enseigne}`} x={19} y={31} c={25} />}
            </>
          )}
        </svg>
        <span className="carte__dos" />
      </span>
    </span>
  );
}
