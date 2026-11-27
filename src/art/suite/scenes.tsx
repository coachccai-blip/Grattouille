// Les dessins de la vraie fin, « Huit as de cœur » : Piou qui raconte, tête nue puis
// recoiffé, et la mouette qui s'envole avec un ticket. (La tablée, les huit cartes et la
// pluie de tickets sont composées par la cinématique elle-même, avec les portraits et
// les cartes du jeu : src/screens/moments/VraieFin.tsx.)
//
// Même style que le reste (kit.tsx) : papier découpé à la gouache, aplats sans contour,
// ombres en formes décalées, deux points pour les yeux. Le ciel reste transparent :
// l'écran peint derrière le dégradé du matin.
// Ce module n'est chargé qu'avec la cinématique.

import { C, METAL, Svg, shade, type ArtProps } from "../kit";

/** Un semis de petits ronds en un seul tracé : taches, boutons. */
function semis(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** Le calot rouge du groom, galon de laiton : sur la tête, ou tenu contre le cœur. */
function Calot() {
  return (
    <>
      <path d="M42 14Q42 10 46 10H74Q78 10 78 14V30Q60 36 42 30Z" fill={C.cerise} />
      <path d="M68 10H74Q78 10 78 14V30Q73 31.8 68 32.8Z" fill={shade(C.cerise, -0.25)} />
      <path d="M42 24Q60 30 78 24V30Q60 36 42 30Z" fill={METAL.laiton} />
    </>
  );
}

/**
 * Piou lui-même, dans le repère de son médaillon (120 × 120). `nu` : il a ôté son calot,
 * et le tient à bout d'aile. Dessous, trois plumes en épi que personne n'avait jamais
 * vues ; ses sourcils se posent : il raconte.
 */
function Moineau({ nu }: { nu: boolean }) {
  const plume = shade(C.bois, -0.12);
  const sombre = shade(plume, -0.22);
  return (
    <>
      {/* Les ailes : elles battent d'ordinaire ; tête nue, l'une est au repos, l'autre lève le calot */}
      {nu ? (
        <path d="M30 106Q14 100 14 82Q20 86 23 92Q25 86 29 85Q30 94 36 100ZM90 104Q112 96 110 66Q104 70 101 78Q99 70 94 68Q92 80 84 92Z" fill={sombre} />
      ) : (
        <path d="M30 104Q8 96 10 66Q16 70 19 78Q21 70 26 68Q28 80 36 92ZM90 104Q112 96 110 66Q104 70 101 78Q99 70 94 68Q92 80 84 92Z" fill={sombre} />
      )}
      {/* Veste de groom à boutons de laiton */}
      <path d="M22 122V110Q22 92 42 92H78Q98 92 98 110V122Z" fill={C.cerise} />
      <path d="M78 92Q98 92 98 110V122H86V96Z" fill={shade(C.cerise, -0.25)} />
      <path d={semis(2.6, [[52, 105], [68, 105], [54, 115], [66, 115]])} fill={METAL.laiton} />
      <g transform={nu ? undefined : "rotate(5 60 86)"}>
        {/* Tête nue : trois plumes en épi */}
        {nu && <path d="M57 27Q52 14 57 7Q61 16 60 27ZM61 27Q62 12 69 9Q68 19 64 28ZM55 28Q46 20 46 13Q53 18 58 27Z" fill={sombre} />}
        {/* Tête ronde : calotte brune jusqu'aux yeux, joues crème tachées */}
        <ellipse cx="60" cy="54" rx="32" ry="30" fill={plume} />
        <path d="M31.5 58Q33 53 41 53H79Q87 53 88.5 58Q88 80 60 82.5Q32 80 31.5 58Z" fill={C.creme} />
        <path d={semis(2.3, [[39.5, 69], [80.5, 69]])} fill={shade(plume, -0.3)} />
        {/* Petit bec conique, en deux tons */}
        <path d="M55.5 63.5L60 70.5L64.5 63.5Z" fill={shade(C.mimosaFonce, -0.3)} />
        <path d="M53 59.5Q60 54.5 67 59.5L60 65Z" fill={C.mimosaFonce} />
        <circle cx="46" cy="60" r="2.8" fill={C.nuit} />
        <circle cx="74" cy="60" r="2.8" fill={C.nuit} />
        {/* Les sourcils : haut perchés d'ordinaire, posés quand il raconte */}
        {nu ? (
          <path d="M39 51.5Q46 47.5 53 48.5L52.6 51.2Q46 50.4 40.2 54ZM81 51.5Q74 47.5 67 48.5L67.4 51.2Q74 50.4 79.8 54Z" fill={C.creme} />
        ) : (
          <path d="M39 48Q46 41.5 53 45.5L52.2 48.5Q46 45 40.8 50.6ZM81 48Q74 41.5 67 45.5L67.8 48.5Q74 45 79.2 50.6Z" fill={C.creme} />
        )}
        {!nu && <g transform="rotate(-14 60 30)"><Calot /></g>}
      </g>
      {/* Col officier */}
      <path d="M44 83.5Q60 89.5 76 83.5V90.5Q60 97 44 90.5Z" fill={METAL.laiton} />
      {/* Le calot, levé à bout d'aile : sur le ciel, on ne voit que lui */}
      {nu && <g transform="translate(53 31) rotate(20 60 23)"><Calot /></g>}
    </>
  );
}

interface PiouProps extends ArtProps {
  /** Où est son calot : sur sa tête, comme toujours, ou levé à bout d'aile. */
  calot: "tete" | "aile";
}

/** Piou, en grand, sur le quai du premier matin : le moineau du médaillon (pnj.tsx), à qui l'on peut ôter son calot. */
export function PiouConteur({ calot, className, title }: PiouProps) {
  return (
    <Svg viewBox="0 0 400 260" className={className} title={title}>
      {/* La mer et le quai, comme au premier jour */}
      <rect x="0" y="150" width="400" height="60" fill={C.mer} />
      <path className="amb-scintille" d="M0 162H60L70 158L80 162H190L200 158L210 162H330L340 158L350 162H400V168H0Z" fill={shade(C.mer, 0.25)} />
      <rect x="0" y="200" width="400" height="60" fill={C.pierre} />
      <rect x="0" y="200" width="400" height="8" fill={shade(C.pierre, -0.18)} />
      {/* Le bateau du matin, encore loin, et deux mouettes */}
      <path d="M52 150V112L78 150Z" fill={C.blanc} />
      <path d="M48 150V122L32 150Z" fill={C.craie} />
      <path d="M26 152H86L79 162H33Z" fill={C.cerise} />
      <path d="M338 40Q346 30 354 40Q362 30 370 40Q362 36 354 44Q346 36 338 40Z" fill={C.blanc} />
      <g transform="translate(95 50) scale(1.75)"><Moineau nu={calot === "aile"} /></g>
    </Svg>
  );
}

/** Le médaillon de Piou tête nue, pour ses bulles tant qu'il raconte : le même dessin, sur son fond mimosa. */
export function PiouTeteNue({ className, title }: ArtProps) {
  return (
    <Svg viewBox="0 0 120 120" className={className} title={title}>
      <rect width="120" height="120" fill={C.mimosa} />
      <Moineau nu />
    </Svg>
  );
}

interface MouetteProps extends ArtProps {
  /** Elle tient un ticket dans son bec. */
  ticket?: boolean;
}

/**
 * Une mouette en vol, de profil, qui file vers la droite. Ses deux ailes portent la
 * classe `vf-aile` : la feuille de style de la cinématique les fait battre.
 */
export function Mouette({ ticket = false, className, title }: MouetteProps) {
  const ombre = shade(C.blanc, -0.14);
  return (
    <Svg viewBox="0 0 132 96" className={className} title={title}>
      {/* L'aile du fond */}
      <g className="vf-aile vf-aile--fond">
        <path d="M54 52Q46 22 22 10Q32 30 38 54Z" fill={ombre} />
        <path d="M22 10Q28 14 32 22L26 22Z" fill={C.grisFonce} />
      </g>
      {/* La queue, le corps, la tête */}
      <path d="M26 56L6 50L12 59L4 66L28 63Z" fill={C.grisClair} />
      <path d="M22 58Q40 44 72 48Q92 50 100 58Q88 72 60 72Q36 72 22 58Z" fill={C.blanc} />
      <path d="M60 72Q88 72 100 58Q90 66 62 67Q44 68 32 64Q44 72 60 72Z" fill={ombre} />
      <circle cx="96" cy="50" r="11.500" fill={C.blanc} />
      <circle cx="99.500" cy="47.500" r="1.900" fill={C.nuit} />
      {/* Le ticket, dans le bec */}
      {ticket && (
        <g transform="rotate(14 118 60)">
          <rect x="108" y="54" width="22" height="15" rx="2.500" fill={C.mimosa} />
          <path d="M108 66H130V69Q130 70 128.500 70H109.500Q108 70 108 69Z" fill={C.mimosaFonce} />
          <path d="M112 58.500H126V63.500H112Z" fill={C.nuit} />
        </g>
      )}
      <path d="M105 48L122 52.500L105 56Z" fill={C.mimosaFonce} />
      <path d="M105 52.300L122 52.500L105 56Z" fill={shade(C.mimosaFonce, -0.3)} />
      {/* L'aile de devant, pointe grise */}
      <g className="vf-aile">
        <path d="M58 54Q54 16 86 4Q78 28 82 56Z" fill={C.blanc} />
        <path d="M86 4Q80 10 76 20L84 16Z" fill={C.grisFonce} />
      </g>
    </Svg>
  );
}
