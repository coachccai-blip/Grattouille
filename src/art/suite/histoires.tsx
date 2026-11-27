// Les photos de l'album des Souvenirs : ce que les huit maîtres des lieux ont gardé de leur
// arrivée à Grattouille-les-Bains (les histoires sont dans src/app/suite/histoires.ts).
// Le reste de l'album est fait des illustrations du jeu : façades, portraits, objets, tickets.
//
// Même style que le reste (kit.tsx) : papier découpé à la gouache, aplats sans contour,
// ombres en formes décalées, deux points pour les yeux. Une photo remplit son cadre :
// viewBox 0 0 200 140, fond compris. Aucun texte dans les dessins : la légende est sous la photo.
// Ce module n'est chargé qu'avec l'écran des Souvenirs.

import type { ReactNode } from "react";
import { C, METAL, Svg, shade, type Art, type ArtProps } from "../kit";
import { Mouette } from "./scenes";

const VUE = "0 0 200 140";

/** Un semis de petits ronds en un seul tracé : étoiles, miettes de terre. */
function semis(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** Un ticket jaune mimosa, posé à plat : sa case à gratter, son talon perforé. Centré sur (0, 0), 30 × 20. */
function Ticket({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <rect x="-15" y="-8.5" width="30" height="20" rx="2.5" fill={C.mimosaFonce} />
      <rect x="-15" y="-10" width="30" height="20" rx="2.5" fill={C.mimosa} />
      <rect x="-11" y="-6" width="15" height="12" rx="1.5" fill={C.creme} />
      <path d="M8 -9V9" fill="none" stroke={C.nuit} strokeWidth="1" strokeDasharray="1.8 2" />
      <circle cx="11.5" cy="0" r="1.6" fill={C.nuit} />
    </g>
  );
}

/** Le bateau du matin, de profil : coque rouge, cabine blanche, cheminée et sa fumée. Sa ligne de flottaison est à y = 0. */
function Vapeur({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path d={semis(5, [[14, -52], [24, -60]]) + semis(7, [[36, -66]])} fill={C.blanc} fillOpacity="0.8" />
      <rect x="2" y="-44" width="11" height="20" fill={C.nuit} />
      <rect x="2" y="-40" width="11" height="4" fill={C.mimosa} />
      <rect x="-16" y="-26" width="46" height="16" rx="2" fill={C.blanc} />
      <path d="M30 -26V-10H20V-26Z" fill={C.craie} />
      <path d={semis(2.6, [[-8, -18], [2, -18], [12, -18]])} fill={C.azur} />
      <path d="M-34 -10H46L38 6H-26Z" fill={C.cerise} />
      <path d="M-30 -2H42L38 6H-26Z" fill={shade(C.cerise, -0.25)} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Gaspard : sa valise, ouverte sur le quai. Trente-six parapluies, pas un nuage.

/** Un parapluie fermé, planté dans la valise, crosse en l'air. */
function Parapluie({ x, angle, couleur }: { x: number; angle: number; couleur: string }) {
  return (
    <g transform={`rotate(${angle} ${x} 100)`}>
      <path d={`M${x} 34V100`} fill="none" stroke={C.boisFonce} strokeWidth="2" />
      <path d={`M${x} 34q0 -9 6 -9q5 0 5 5`} fill="none" stroke={C.boisFonce} strokeWidth="2.6" strokeLinecap="round" />
      <path d={`M${x - 5.5} 50Q${x} 44 ${x + 5.5} 50L${x + 2.5} 100H${x - 2.5}Z`} fill={couleur} />
      <path d={`M${x} 47Q${x + 3} 47.5 ${x + 5.5} 50L${x + 2.5} 100H${x}Z`} fill={shade(couleur, -0.22)} />
    </g>
  );
}

function Parapluies({ className, title }: ArtProps) {
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill={C.ciel} />
      <circle cx="166" cy="26" r="13" fill={C.mimosa} />
      <rect y="82" width="200" height="18" fill={C.mer} />
      <path d="M0 88H40L46 85L52 88H120L126 85L132 88H200V91H0Z" fill={shade(C.mer, 0.25)} />
      <rect y="98" width="200" height="42" fill={C.pierre} />
      <rect y="98" width="200" height="5" fill={shade(C.pierre, -0.18)} />
      {/* Le couvercle, rabattu derrière */}
      <path d="M50 96L58 70H150L142 96Z" fill={shade(C.bois, -0.28)} />
      {/* Les parapluies, en éventail */}
      <Parapluie x={64} angle={-24} couleur={C.bougainvillier} />
      <Parapluie x={76} angle={-15} couleur={C.azur} />
      <Parapluie x={88} angle={-7} couleur={C.mimosa} />
      <Parapluie x={100} angle={0} couleur={C.persienne} />
      <Parapluie x={112} angle={7} couleur={C.cerise} />
      <Parapluie x={124} angle={15} couleur={C.lilas} />
      <Parapluie x={136} angle={24} couleur={C.corail} />
      {/* La valise : cuir, sangles, coins de laiton */}
      <ellipse cx="102" cy="131" rx="58" ry="4" fill={C.nuit} fillOpacity="0.22" />
      <rect x="48" y="94" width="104" height="36" rx="4" fill={C.bois} />
      <path d="M48 118H152V126Q152 130 148 130H52Q48 130 48 126Z" fill={shade(C.bois, -0.2)} />
      <path d="M66 94H73V130H66ZM127 94H134V130H127Z" fill={C.boisFonce} />
      <path d="M48 98Q48 94 52 94H58V100H48ZM152 98Q152 94 148 94H142V100H152ZM48 124H58V130H52Q48 130 48 126ZM152 124H142V130H148Q152 130 152 126Z" fill={METAL.laiton} />
      <rect x="92" y="104" width="16" height="9" rx="2" fill={C.creme} />
      <path d="M95 107.500H105M95 110H102" fill="none" stroke={C.encre} strokeWidth="1" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Le bateau du matin : il accoste tous les jours, et tout le monde l'a pris. Sauf deux.

function Bateau({ className, title }: ArtProps) {
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill={C.ciel} />
      <circle cx="164" cy="30" r="14" fill={C.mimosa} />
      <path d="M22 26Q28 19 34 26Q40 19 46 26Q40 23.500 34 29Q28 23.500 22 26Z" fill={C.blanc} />
      <rect y="88" width="200" height="28" fill={C.mer} />
      <Vapeur transform="translate(84 92) scale(1.25)" />
      <path d="M0 96H30L36 93L42 96H108L114 93L120 96H170L176 93L182 96H200V100H0Z" fill={shade(C.mer, 0.25)} />
      <rect y="112" width="200" height="28" fill={C.pierre} />
      <rect y="112" width="200" height="5" fill={shade(C.pierre, -0.18)} />
      {/* La bitte d'amarrage, et le cordage qui attend */}
      <path d="M160 112V102Q160 98 166 98Q172 98 172 102V112Z" fill={C.grisFonce} />
      <rect x="157" y="100" width="18" height="4" rx="2" fill={C.noir} />
      <path d="M150 126Q158 118 166 124Q174 130 182 122" fill="none" stroke={C.paille} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Un ticket par terre, sur les pavés du quai : c'est par là que tout commence, pour tout le monde.

function TicketParTerre({ className, title }: ArtProps) {
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill={C.pierre} />
      {/* Le bord du quai, et la mer qui clapote */}
      <rect width="200" height="26" fill={C.mer} />
      <path d="M0 14H34L40 11L46 14H110L116 11L122 14H200V17H0Z" fill={shade(C.mer, 0.25)} />
      <rect y="26" width="200" height="7" fill={shade(C.pierre, -0.22)} />
      {/* Les pavés */}
      <path d="M0 66H200M0 102H200M38 33V66M104 33V66M168 33V66M70 66V102M140 66V102M24 102V140M96 102V140M172 102V140" fill="none" stroke={shade(C.pierre, -0.14)} strokeWidth="2" />
      <path d="M44 38H98V41H44ZM110 72H134V75H110ZM30 108H90V111H30Z" fill={shade(C.pierre, 0.3)} />
      {/* Le ticket, son ombre, son éclat */}
      <g transform="translate(104 86) rotate(-13) scale(2.3)">
        <rect x="-13.5" y="-7" width="30" height="20" rx="2.5" fill={C.nuit} fillOpacity="0.2" />
      </g>
      <Ticket transform="translate(100 80) rotate(-13) scale(2.3)" />
      <path d="M150 44L152.200 51.800L160 54L152.200 56.200L150 64L147.800 56.200L140 54L147.800 51.800Z" fill={C.blanc} />
      <path d="M46 118L47.300 122.700L52 124L47.300 125.300L46 130L44.700 125.300L40 124L44.700 122.700Z" fill={C.blanc} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Ondine : la traversée sur le dos, derrière le bateau, un citron sur le ventre.

function Citron({ className, title }: ArtProps) {
  const pelage = C.bois;
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill="#F6D9A8" />
      <circle cx="40" cy="20" r="11" fill={C.ivoire} />
      <rect y="38" width="200" height="102" fill={C.mer} />
      {/* Le bateau, loin devant */}
      <Vapeur transform="translate(150 40) scale(0.42)" />
      <path d="M0 46H60L66 43.500L72 46H200V48.500H0Z" fill={shade(C.mer, 0.25)} />
      {/* La loutre, sur le dos : la queue, le corps, le ventre clair, les pattes en l'air */}
      <path d="M146 100Q176 96 192 108Q174 108 150 108Z" fill={shade(pelage, -0.25)} />
      <ellipse cx="100" cy="98" rx="56" ry="16" fill={pelage} />
      <ellipse cx="104" cy="93" rx="40" ry="9.500" fill={C.kraft} />
      <path d={semis(5.5, [[150, 84], [160, 87]])} fill={shade(pelage, -0.25)} />
      {/* La tête : museau clair, truffe, l'œil fermé de qui se laisse porter */}
      <circle cx="42" cy="92" r="16" fill={pelage} />
      <path d={semis(4, [[32, 78], [50, 77]])} fill={shade(pelage, -0.25)} />
      <ellipse cx="38" cy="96" rx="9" ry="7" fill={C.kraft} />
      <ellipse cx="33" cy="93" rx="3" ry="2.2" fill={C.noir} />
      <path d="M41 86Q45 83.500 49 86" fill="none" stroke={C.noir} strokeWidth="1.6" strokeLinecap="round" />
      {/* Le citron : tout son bagage */}
      <path d="M92 80Q94 71 106 71Q118 71 120 80Q118 89 106 89Q94 89 92 80Z" fill={C.mimosa} />
      <path d="M106 89Q118 89 120 80Q119 76 117 74Q118 84 104 86Q98 86 95 84Q98 89 106 89Z" fill={C.mimosaFonce} />
      <path d="M90 80L93.500 78V82ZM122 80L118.500 78V82Z" fill={C.mimosaFonce} />
      <path d="M99 76Q102 74 105 74.500" fill="none" stroke={C.blanc} strokeWidth="1.6" strokeLinecap="round" />
      {/* L'eau qui la porte, et le sillage */}
      <path d="M0 106Q20 100 40 106T80 106T120 106T160 106T200 106V140H0Z" fill={C.mer} fillOpacity="0.82" />
      <path d="M14 120H40L46 117L52 120H96M118 128H150L156 125L162 128H190" fill="none" stroke={shade(C.mer, 0.3)} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Hector : deux étés au bout de la jetée. On l'a pris pour un poteau ; Ondine y a étendu ses torchons.

/** Un torchon sur la corde : blanc, une rayure, sa pince. Accroché en (0, 0). */
function Torchon({ x, y, angle, rayure }: { x: number; y: number; angle: number; rayure: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x="-7" y="0" width="14" height="19" fill={C.blanc} />
      <rect x="3" y="0" width="4" height="19" fill={C.craie} />
      <rect x="-7" y="12" width="14" height="3" fill={rayure} />
      <rect x="-1.5" y="-3" width="3" height="6" rx="1" fill={C.boisFonce} />
    </g>
  );
}

function Poteau({ className, title }: ArtProps) {
  const plume = C.grisClair;
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill="#FFB38A" />
      <rect y="52" width="200" height="34" fill="#C2639A" fillOpacity="0.55" />
      <circle cx="150" cy="78" r="16" fill={C.mimosa} />
      <rect y="84" width="200" height="56" fill="#4B3277" />
      <path d="M118 92H182M130 98H170" fill="none" stroke={C.mimosa} strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      {/* La jetée : son plancher, ses lames */}
      <rect y="108" width="200" height="32" fill={C.bois} />
      <rect y="108" width="200" height="4" fill={shade(C.bois, 0.18)} />
      <path d="M34 112V140M82 112V140M128 112V140M174 112V140" fill="none" stroke={C.boisFonce} strokeOpacity="0.5" strokeWidth="1.6" />
      {/* Le vrai poteau, et la corde à linge */}
      <rect x="164" y="56" width="10" height="56" fill={C.boisFonce} />
      <rect x="162" y="53" width="14" height="5" rx="2" fill={shade(C.boisFonce, 0.2)} />
      <path d="M80 30Q120 58 166 60" fill="none" stroke={C.craie} strokeWidth="1.4" />
      <Torchon x={102} y={42} angle={6} rayure={C.cerise} />
      <Torchon x={124} y={51} angle={3} rayure={C.azur} />
      <Torchon x={146} y={57} angle={-2} rayure={C.persienne} />
      {/* Hector : pattes, corps, cou, bec. Il n'a pas bougé. */}
      <path d="M50 108V80M58 108V80" fill="none" stroke={C.paille} strokeWidth="2.6" />
      <path d="M44 108H52M56 108H64" fill="none" stroke={C.paille} strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="54" cy="68" rx="14" ry="17" fill={plume} />
      <path d="M54 85Q66 82 68 68Q68 60 64 56Q64 74 50 82Z" fill={shade(plume, -0.18)} />
      <path d="M52 54Q44 42 54 30" fill="none" stroke={plume} strokeWidth="7" strokeLinecap="round" />
      <circle cx="56" cy="28" r="7.5" fill={plume} />
      <path d="M62 25L82 29.500L62 32Z" fill={C.mimosaFonce} />
      <circle cx="58" cy="26.500" r="1.5" fill={C.nuit} />
      <path d="M48 25Q56 16 64 23Q56 21 49 27Z" fill={C.persienne} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Le Baron : son premier ticket, sur un mouchoir, sur un coussin. Pas à même le pavé.

function Coussin({ className, title }: ArtProps) {
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill={C.prune} />
      <path d="M0 0H200V20Q100 34 0 20Z" fill={shade(C.prune, -0.3)} />
      <rect y="108" width="200" height="32" fill={C.boisFonce} />
      <rect y="108" width="200" height="4" fill={shade(C.boisFonce, 0.22)} />
      {/* Le coussin de velours, ses glands d'or */}
      <ellipse cx="102" cy="112" rx="66" ry="5" fill={C.noir} fillOpacity="0.35" />
      <path d="M36 104Q30 74 48 64Q100 52 152 64Q170 74 164 104Q100 116 36 104Z" fill={C.bordeaux} />
      <path d="M48 64Q100 52 152 64Q160 68 163 76Q100 62 37 76Q40 68 48 64Z" fill={shade(C.bordeaux, 0.16)} />
      <path d="M36 104Q100 116 164 104Q164 99 163.500 96Q100 108 36.500 96Q36 99 36 104Z" fill={shade(C.bordeaux, -0.3)} />
      <path d="M34 102L26 116M34 102L31 118M34 102L37 117M166 102L174 116M166 102L169 118M166 102L163 117" fill="none" stroke={METAL.or} strokeWidth="2" strokeLinecap="round" />
      <path d={semis(3.4, [[34, 102], [166, 102]])} fill={METAL.or} />
      {/* Le mouchoir, plié en losange, et le ticket */}
      <path d="M100 58L136 76L100 94L64 76Z" fill={shade(C.bordeaux, -0.3)} />
      <path d="M100 55L136 73L100 91L64 73Z" fill={C.blanc} />
      <path d="M100 91L136 73L130 70L100 85Z" fill={C.craie} />
      <Ticket transform="translate(100 71) rotate(-9)" />
      <path d="M146 44L147.800 50.200L154 52L147.800 53.800L146 60L144.200 53.800L138 52L144.200 50.200Z" fill={C.blanc} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Le Commodore : la cale. Dans la deuxième caisse à gauche, quelqu'un sanglote.

function Caisse({ className, title }: ArtProps) {
  const planche = shade(C.bois, 0.08);
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill={C.nuit} />
      {/* Le hublot, et ce qu'il laisse passer de jour */}
      <path d="M150 22L92 140H170L186 22Z" fill={C.blanc} fillOpacity="0.07" />
      <circle cx="168" cy="26" r="15" fill={C.ciel} />
      <circle cx="168" cy="26" r="15" fill="none" stroke={METAL.laiton} strokeWidth="4" />
      <rect y="116" width="200" height="24" fill={C.boisFonce} />
      <rect y="116" width="200" height="3" fill={shade(C.boisFonce, 0.2)} />
      {/* La première caisse, bien fermée */}
      <rect x="14" y="70" width="56" height="46" fill={C.bois} />
      <path d="M14 82H70M14 94H70M14 106H70" fill="none" stroke={C.boisFonce} strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M14 70H22V116H14ZM62 70H70V116H62Z" fill={shade(C.bois, -0.22)} />
      <path d="M42 100V84M36 90L42 83L48 90" fill="none" stroke={C.boisFonce} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* La deuxième : une planche manque, et l'on voit deux yeux */}
      <rect x="84" y="54" width="78" height="62" fill={planche} />
      <path d="M84 66H162M84 100H162" fill="none" stroke={C.boisFonce} strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M84 54H93V116H84ZM153 54H162V116H153Z" fill={shade(planche, -0.22)} />
      <rect x="93" y="74" width="60" height="16" fill={C.noir} />
      <path d={semis(4.2, [[114, 82], [130, 82]])} fill={C.blanc} />
      <path d={semis(1.9, [[115, 83], [131, 83]])} fill={C.nuit} />
      {/* Les antennes, la pince agrippée au bord, et une larme */}
      <path d="M112 74Q104 50 90 42M132 74Q142 50 158 44" fill="none" stroke={C.cerise} strokeWidth="2" strokeLinecap="round" />
      <path d="M96 92Q90 80 100 74Q108 78 104 84Q110 82 110 90Q104 96 96 92Z" fill={C.cerise} />
      <path d="M96 92Q104 96 110 90Q110 87 109 85Q106 91 98 89Z" fill={shade(C.cerise, -0.25)} />
      <path d="M140 92Q144 99 140 103Q136 99 140 92Z" fill={C.azur} />
      <path d="M140 108Q143 113 140 116Q137 113 140 108Z" fill={C.azur} fillOpacity="0.7" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Maître Taupin : son arrivée, sous la terrasse du Grand Café. Il visait la Suisse.

function Taupiniere({ className, title }: ArtProps) {
  const terre = C.bois;
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill={C.sable} />
      {/* Le dallage de la terrasse, le store du café */}
      <path d="M0 58H200M0 96H200M0 132H200M30 22V58M96 22V58M162 22V58M62 58V96M138 58V96M20 96V132M180 96V132" fill="none" stroke={C.pierre} strokeWidth="2" />
      <rect width="200" height="22" fill={C.blanc} />
      <path d="M0 0H20V22H0ZM40 0H60V22H40ZM80 0H100V22H80ZM120 0H140V22H120ZM160 0H180V22H160Z" fill={C.cerise} />
      <path d="M0 22H200V26H0Z" fill={shade(C.sable, -0.2)} />
      {/* Le guéridon, et une citronnade */}
      <ellipse cx="38" cy="124" rx="16" ry="4" fill={C.grisFonce} />
      <rect x="36" y="72" width="4" height="52" fill={C.grisFonce} />
      <ellipse cx="38" cy="70" rx="30" ry="7" fill={C.craie} />
      <path d="M8 70Q8 77 38 77Q68 77 68 70Q68 74 38 74Q8 74 8 70Z" fill={C.pierre} />
      <path d="M32 50H46L44 68H34Z" fill={C.mimosa} fillOpacity="0.85" />
      <path d="M31 46H47L46 50H32Z" fill={C.blanc} fillOpacity="0.9" />
      <path d="M43 44L48 34" fill="none" stroke={C.cerise} strokeWidth="1.6" strokeLinecap="round" />
      {/* La taupinière : la terre, les dalles soulevées, les miettes */}
      <path d="M150 96L176 90L182 104L160 110Z" fill={C.pierre} />
      <path d="M62 104L82 92L90 104L72 114Z" fill={C.pierre} />
      <path d="M64 132Q112 56 160 132Z" fill={terre} />
      <path d="M112 94Q140 108 160 132H132Q128 112 112 94Z" fill={shade(terre, -0.2)} />
      <path d={semis(2.6, [[58, 128], [168, 126], [80, 122], [150, 118], [176, 132]])} fill={shade(terre, -0.2)} />
      {/* Maître Taupin : le trou, la tête, les grosses lunettes, les mains au bord */}
      <ellipse cx="112" cy="97" rx="17" ry="5" fill={C.noir} />
      <path d="M99 97Q99 80 112 80Q125 80 125 97Z" fill={C.grisFonce} />
      <path d={semis(5.4, [[106, 89], [118, 89]])} fill={C.ciel} />
      <path d="M100.600 89a5.400 5.400 0 1 0 10.800 0a5.400 5.400 0 1 0 -10.800 0ZM112.600 89a5.400 5.400 0 1 0 10.800 0a5.400 5.400 0 1 0 -10.800 0Z" fill="none" stroke={METAL.laiton} strokeWidth="1.8" />
      <path d={semis(1.5, [[107, 89.500], [119, 89.500]])} fill={C.nuit} />
      <ellipse cx="112" cy="96" rx="3" ry="2.2" fill={C.rose} />
      <path d={semis(4, [[96, 99], [128, 99]])} fill={C.rose} />
      {/* Le ticket, posé sur la pente */}
      <Ticket transform="translate(142 112) rotate(34) scale(0.86)" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Maître Taupin, encore : le registre des arrivées. Dans la colonne Famille, toujours le même signe.

/** Une esperluette tracée à la plume, haute de 9, posée en (x, y). */
function esperluette(x: number, y: number): string {
  return `M${x + 7} ${y + 9}L${x + 1.5} ${y + 2.5}Q${x} ${y} ${x + 2.5} ${y}Q${x + 5} ${y} ${x + 3.5} ${y + 2.5}L${x + 0.5} ${y + 5.5}Q${x - 1} ${y + 8.5} ${x + 2.5} ${y + 9}Q${x + 5.5} ${y + 9} ${x + 7} ${y + 5}`;
}

function Registre({ className, title }: ArtProps) {
  const lignes = [40, 54, 68, 82, 96, 110];
  const noms = [30, 22, 34, 26, 30, 20];
  let encre = "";
  let signes = "";
  lignes.forEach((y, i) => {
    encre += `M34 ${y}h${noms[i]}M84 ${y}h10m4 0h12M144 ${y}h${18 - (i % 3) * 3}`;
    signes += esperluette(130, y - 7);
  });
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill={C.boisFonce} />
      <rect x="20" y="12" width="166" height="122" rx="3" fill={C.noir} fillOpacity="0.3" />
      <rect x="16" y="8" width="166" height="122" rx="3" fill={C.creme} />
      <rect x="16" y="8" width="11" height="122" fill={C.bordeaux} />
      <rect x="27" y="8" width="155" height="18" fill={shade(C.creme, -0.1)} />
      <path d="M34 17h26M84 17h18M130 17h30" fill="none" stroke={C.nuit} strokeWidth="3" strokeLinecap="round" />
      <path d="M27 26H182M27 46H182M27 60H182M27 74H182M27 88H182M27 102H182M27 116H182" fill="none" stroke={C.brume} strokeWidth="1" />
      <path d="M76 8V130M122 8V130" fill="none" stroke={C.cerise} strokeOpacity="0.5" strokeWidth="1" />
      <path d={encre} fill="none" stroke={C.encre} strokeWidth="1.8" strokeLinecap="round" />
      <path d={signes} fill="none" stroke={C.nuit} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Le tampon, de travers : c'est en règle */}
      <g transform="rotate(-14 152 96)" fill="none" stroke={C.cerise} strokeOpacity="0.82">
        <circle cx="152" cy="96" r="19" strokeWidth="2.6" />
        <circle cx="152" cy="96" r="14.500" strokeWidth="1" />
        <path d="M142 96H162M146 90.500H158M146 101.500H158" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* La plume */}
      <path d="M96 138L150 122L152 126Z" fill={C.nuit} />
      <path d="M150 122L162 119L152 126Z" fill={METAL.or} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Dame Séléné : le lendemain matin, il y avait un croissant. Et une échelle.

function Echelle({ className, title }: ArtProps) {
  const nuit = "#1B1440";
  // Deux montants, du quai à la pointe du croissant, et neuf barreaux de l'un à l'autre.
  const barreaux: string[] = [];
  for (let i = 1; i <= 9; i++) {
    const x = 53 + i * 7.85;
    const y = 128 - i * 6.95;
    barreaux.push(`M${+x.toFixed(1)} ${+y.toFixed(1)}l6.8 6`);
  }
  return (
    <Svg viewBox={VUE} className={className} title={title}>
      <rect width="200" height="140" fill={nuit} />
      <rect y="92" width="200" height="48" fill="#07061A" fillOpacity="0.5" />
      <path d={semis(1.3, [[18, 20], [44, 46], [70, 14], [96, 34], [112, 12], [184, 78], [30, 72], [176, 110], [88, 62]])} fill={C.blanc} />
      <path d="M60 30L61.300 34.700L66 36L61.300 37.300L60 42L58.700 37.300L54 36L58.700 34.700Z" fill={C.blanc} />
      {/* Le croissant, tout neuf */}
      <circle cx="150" cy="40" r="28" fill={C.ivoire} />
      <circle cx="163" cy="31" r="25" fill={nuit} />
      <path d="M126 54Q134 66 150 68Q138 62 131 50Z" fill={C.paille} />
      {/* Le quai, le Kiosque et sa lucarne allumée */}
      <rect y="126" width="200" height="14" fill="#07061A" />
      <path d="M10 126V108H40V126ZM6 108L25 96L44 108Z" fill="#07061A" />
      <rect x="20" y="112" width="10" height="9" fill={C.mimosa} />
      {/* L'échelle, du quai à la pointe du croissant */}
      <path d="M53 128L131.500 58.500M59.800 134L138.300 64.500" fill="none" stroke={C.paille} strokeWidth="2.4" strokeLinecap="round" />
      <path d={barreaux.join("")} fill="none" stroke={C.paille} strokeWidth="2" strokeLinecap="round" />
      {/* Le lièvre, à mi-chemin : un lièvre ne refuse jamais une échelle */}
      <g transform="translate(101 87) rotate(-41)">
        <ellipse cx="0" cy="0" rx="11" ry="7.5" fill={C.blanc} />
        <circle cx="-11" cy="2" r="3.4" fill={C.craie} />
        <circle cx="11" cy="-5" r="6" fill={C.blanc} />
        <path d="M9 -9Q4 -24 9 -27Q13 -22 13 -10ZM13 -9Q14 -23 20 -24Q21 -17 16 -8Z" fill={C.blanc} />
        <path d="M10 -11Q8 -21 9.500 -24Q11 -20 11.500 -11Z" fill={C.rose} />
        <circle cx="13.500" cy="-5.500" r="1.2" fill={C.nuit} />
      </g>
    </Svg>
  );
}

// ---------------------------------------------------------------------------

/** La mouette de la vraie fin, un ticket dans le bec : elle livre aussi sur la Lune. Son ciel est celui de l'album. */
function Livraison({ className, title }: ArtProps): ReactNode {
  return <Mouette ticket className={className} title={title} />;
}

/** Les dessins de l'album, par leur nom dans les histoires (`dessin:parapluies`…). */
export const DESSINS: Record<string, Art> = {
  parapluies: Parapluies,
  bateau: Bateau,
  ticket: TicketParTerre,
  citron: Citron,
  poteau: Poteau,
  coussin: Coussin,
  caisse: Caisse,
  taupiniere: Taupiniere,
  registre: Registre,
  echelle: Echelle,
  mouette: Livraison,
};
