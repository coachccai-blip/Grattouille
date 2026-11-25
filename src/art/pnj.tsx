// Les dix personnages de Grattouille-les-Bains (BRIEF.md, section 4.3).
//
// Portrait en buste, de face, affiché dans un médaillon rond. viewBox 0 0 120 120.
// Le fond est un aplat qui remplit tout le carré (le médaillon le rogne en cercle) :
// garder le visage dans le cercle de rayon 52 centré en (60, 60). Tête vers y = 50,
// épaules qui sortent par le bas. Deux points pour les yeux, pas de bouche :
// le caractère passe par les sourcils, la posture et la tenue.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Un semis de petits ronds en un seul tracé : taches, perles, poils de moustache. */
function semis(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** Piou : moineau groom au calot rouge. Enthousiaste : il bat des ailes, tête penchée, sourcils haut perchés. */
const piou: Art = (props) => {
  const plume = shade(C.bois, -0.12);
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.mimosa} />
      {/* Les ailes, qui battent */}
      <path d="M30 104Q8 96 10 66Q16 70 19 78Q21 70 26 68Q28 80 36 92ZM90 104Q112 96 110 66Q104 70 101 78Q99 70 94 68Q92 80 84 92Z" fill={shade(plume, -0.22)} />
      {/* Veste de groom à boutons de laiton */}
      <path d="M22 120V110Q22 92 42 92H78Q98 92 98 110V120Z" fill={C.cerise} />
      <path d="M78 92Q98 92 98 110V120H86V96Z" fill={shade(C.cerise, -0.25)} />
      <path d={semis(2.6, [[52, 105], [68, 105], [54, 115], [66, 115]])} fill={METAL.laiton} />
      <g transform="rotate(5 60 86)">
        {/* Tête ronde : calotte brune jusqu'aux yeux, joues crème tachées */}
        <ellipse cx="60" cy="54" rx="32" ry="30" fill={plume} />
        <path d="M31.5 58Q33 53 41 53H79Q87 53 88.5 58Q88 80 60 82.5Q32 80 31.5 58Z" fill={C.creme} />
        <path d={semis(2.3, [[39.5, 69], [80.5, 69]])} fill={shade(plume, -0.3)} />
        {/* Petit bec conique, en deux tons */}
        <path d="M55.5 63.5L60 70.5L64.5 63.5Z" fill={shade(C.mimosaFonce, -0.3)} />
        <path d="M53 59.5Q60 54.5 67 59.5L60 65Z" fill={C.mimosaFonce} />
        <circle cx="46" cy="60" r="2.8" fill={C.nuit} />
        <circle cx="74" cy="60" r="2.8" fill={C.nuit} />
        {/* Sourcils haut perchés */}
        <path d="M39 48Q46 41.5 53 45.5L52.2 48.5Q46 45 40.8 50.6Z" fill={C.creme} />
        <path d="M81 48Q74 41.5 67 45.5L67.8 48.5Q74 45 79.2 50.6Z" fill={C.creme} />
        {/* Calot rouge, de travers */}
        <g transform="rotate(-14 60 30)">
          <path d="M42 14Q42 10 46 10H74Q78 10 78 14V30Q60 36 42 30Z" fill={C.cerise} />
          <path d="M68 10H74Q78 10 78 14V30Q73 31.8 68 32.8Z" fill={shade(C.cerise, -0.25)} />
          <path d="M42 24Q60 30 78 24V30Q60 36 42 30Z" fill={METAL.laiton} />
        </g>
      </g>
      {/* Col officier */}
      <path d="M44 83.5Q60 89.5 76 83.5V90.5Q60 97 44 90.5Z" fill={METAL.laiton} />
    </Svg>
  );
};

/** Gaspard : vieux renard argenté, gilet et visière de buraliste. Bonimenteur au grand cœur. */
const gaspard: Art = (props) => {
  const pelage = "#AEB6BD";
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.ciel} />
      {/* Oreilles */}
      <path d="M28 46L24 10L54 32Z" fill={pelage} />
      <path d="M92 46L96 10L66 32Z" fill={pelage} />
      <path d="M24 10L27 24L36 19Z" fill={C.grisFonce} />
      <path d="M96 10L93 24L84 19Z" fill={C.grisFonce} />
      {/* Épaules : chemise, gilet bordeaux */}
      <path d="M14 120V104Q14 88 34 88H86Q106 88 106 104V120Z" fill={C.craie} />
      <path d="M14 120V104Q14 88 34 88H46L60 112L74 88H86Q106 88 106 104V120Z" fill={C.bordeaux} />
      <path d="M86 88Q106 88 106 104V120H92V92Z" fill={shade(C.bordeaux, -0.25)} />
      <circle cx="60" cy="116" r="2.5" fill={C.mimosa} />
      <rect x="50" y="76" width="20" height="16" fill={pelage} />
      <path d="M50 80H70V88Q60 94 50 88Z" fill={shade(pelage, -0.2)} />
      {/* Tête */}
      <ellipse cx="60" cy="52" rx="33" ry="31" fill={pelage} />
      <path d="M26 60Q44 60 60 46Q76 60 94 60Q92 84 60 84Q28 84 26 60Z" fill={C.blanc} />
      <ellipse cx="60" cy="66" rx="6" ry="4.5" fill={C.noir} />
      <circle cx="48" cy="50" r="2.6" fill={C.nuit} />
      <circle cx="72" cy="50" r="2.6" fill={C.nuit} />
      {/* Sourcils broussailleux et relevés : le bonimenteur */}
      <path d="M40 43Q47 37 55 42L54 45Q47 41 41 46Z" fill={C.blanc} />
      <path d="M80 43Q73 37 65 42L66 45Q73 41 79 46Z" fill={C.blanc} />
      {/* Visière verte de buraliste */}
      <path d="M28 34Q60 16 92 34L90 40Q60 26 30 40Z" fill={C.persFonce} />
      <path d="M22 44Q60 26 98 44Q60 36 22 44Z" fill={C.persienne} />
    </Svg>
  );
};

/** Ondine : loutre en tablier blanc, plateau et citronnade. Pince-sans-rire : sourcils à plat, posés sur les yeux. */
const ondine: Art = (props) => {
  const pelage = C.bois;
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.persClair} />
      {/* Petites oreilles rondes, à hauteur des yeux */}
      <circle cx="21" cy="46" r="6.5" fill={pelage} />
      <circle cx="83" cy="46" r="6.5" fill={pelage} />
      <circle cx="21" cy="46" r="3" fill={C.boisFonce} />
      <circle cx="83" cy="46" r="3" fill={C.boisFonce} />
      {/* Cou épais, gorge claire, robe sombre, tablier blanc à bretelles */}
      <path d="M33 66H71L75 104H29Z" fill={pelage} />
      <path d="M42 74H62L64 104H40Z" fill={C.creme} />
      <path d="M33.5 76H70.5L70.8 82Q52 88.5 33.2 82Z" fill={shade(pelage, -0.22)} />
      <path d="M8 120V112Q8 97 30 93H37Q52 106 67 93H74Q96 97 96 112V120Z" fill={C.nuit} />
      <path d="M37 102H67V120H37Z" fill={C.blanc} />
      <path d="M37 102L29 93H36L46 102ZM67 102L75 93H68L58 102Z" fill={C.blanc} />
      {/* Tête large et plate, museau clair, moustaches */}
      <path d="M19 57C19 38 31 27 52 27C73 27 85 38 85 57C85 72 72 82 52 82C32 82 19 72 19 57Z" fill={pelage} />
      <path d="M27 64Q27 54 40 54Q47 54 52 57Q57 54 64 54Q77 54 77 64Q77 74 66 77Q60 81.5 52 81.5Q44 81.5 38 77Q27 74 27 64Z" fill={C.creme} />
      <path d={semis(1.1, [[33, 62], [37, 67], [33, 70], [71, 62], [67, 67], [71, 70]])} fill={shade(C.creme, -0.3)} />
      <path d="M31 63L13 58M30 67L11 68M31 71L14 78M73 63L86 59.5M74 67L86.5 68M73 71L85 75.5" fill="none" stroke={C.blanc} strokeWidth="0.9" />
      <path d="M43.5 53Q52 49 60.5 53Q61 60 52 63.5Q43 60 43.5 53Z" fill={C.noir} />
      <circle cx="40" cy="46.5" r="2.6" fill={C.nuit} />
      <circle cx="64" cy="46.5" r="2.6" fill={C.nuit} />
      {/* Sourcils à plat : pince-sans-rire */}
      <rect x="34" y="42" width="12" height="3" rx="1.5" fill={C.boisFonce} />
      <rect x="58" y="42" width="12" height="3" rx="1.5" fill={C.boisFonce} />
      {/* Le plateau et sa citronnade */}
      <path d="M87 120V100Q87 92 97 92Q107 92 107 100V120Z" fill={C.nuit} />
      <rect x="89" y="89" width="16" height="5" rx="1" fill={C.blanc} />
      <circle cx="97" cy="84" r="6" fill={pelage} />
      <ellipse cx="97" cy="79.5" rx="16" ry="3.6" fill={C.gris} />
      <ellipse cx="97" cy="77" rx="16" ry="3.6" fill={METAL.argent} />
      <path d="M91 56H103L101.5 76H92.5Z" fill={C.blanc} />
      <path d="M91.4 62H102.6L101.5 76H92.5Z" fill={C.mimosa} />
      <path d="M100 49L97.5 66" fill="none" stroke={C.cerise} strokeWidth="1.6" />
    </Svg>
  );
};

/** Hector : héron croupier, visière verte et nœud papillon. Impassible : un seul sourcil se lève. */
const hector: Art = (props) => (
  <Svg viewBox="0 0 120 120" {...props}>
    <rect width="120" height="120" fill={C.corail} />
    {/* Plumage gris, gilet noir, chemise blanche */}
    <path d="M20 120V114Q20 96 42 93H78Q100 96 100 114V120Z" fill={C.gris} />
    <path d="M78 93Q100 96 100 114V120H88V98Z" fill={shade(C.gris, -0.25)} />
    <path d="M38 120L44 93H76L82 120Z" fill={C.noir} />
    <path d="M50 93H70L60 114Z" fill={C.blanc} />
    {/* Long cou blanc */}
    <rect x="53" y="52" width="14" height="46" fill={C.blanc} />
    <rect x="62" y="52" width="5" height="46" fill={shade(C.blanc, -0.12)} />
    {/* Nœud papillon */}
    <path d="M60 97L48 91V103ZM60 97L72 91V103Z" fill={C.persFonce} />
    <circle cx="60" cy="97" r="3" fill={C.persienne} />
    {/* Tête */}
    <ellipse cx="60" cy="44" rx="21" ry="19" fill={C.blanc} />
    {/* Bandeau noir du héron : un sourcil à plat, l'autre levé */}
    <path d="M57 44.5Q47 43 39.6 46Q33 50 30 62Q36 53 41.5 49.5Q48 46.5 57 47.5Z" fill={C.noir} />
    <path d="M63 43.5Q72 35 80 40.5Q87 46 90 62Q84 51 79 45Q72 40.5 64.5 46.5Z" fill={C.noir} />
    <circle cx="51" cy="50.5" r="2.5" fill={C.nuit} />
    <circle cx="69" cy="50.5" r="2.5" fill={C.nuit} />
    {/* Long bec en poignard */}
    <path d="M54 53Q60 49 66 53L61 86Q60 88 59 86Z" fill={C.mimosa} />
    <path d="M60 51Q63.4 51.2 66 53L61 86Q60.5 87 60 87Z" fill={shade(C.mimosa, -0.2)} />
    {/* Visière verte */}
    <path d="M40 34Q60 19 80 34L79 38.5Q60 25.5 41 38.5Z" fill={C.persFonce} />
    <path d="M33 42Q60 22 87 42Q60 32 33 42Z" fill={C.persienne} />
  </Svg>
);

/** Le Baron : bouledogue en smoking. Bourru : sourcils froncés, bajoues tombantes, pochette prête pour les larmes. */
const baron: Art = (props) => {
  const pelage = C.kraft;
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.bordeaux} />
      {/* Smoking : épaules massives, plastron, revers de satin */}
      <path d="M4 120V104Q4 86 26 86H94Q116 86 116 104V120Z" fill={C.noir} />
      <path d="M44 86H76L66 120H54Z" fill={C.blanc} />
      <path d="M44 86L54 120H42L34 90ZM76 86L66 120H78L86 90Z" fill={C.grisFonce} />
      <path d="M60 96L44 89V104ZM60 96L76 89V104Z" fill={C.noir} />
      <circle cx="60" cy="96" r="3.4" fill={C.grisFonce} />
      <path d="M86 104L91 99L94 103L98 100V106H86Z" fill={C.blanc} />
      {/* Oreilles repliées */}
      <path d="M30 22Q14 20 14 38Q24 42 32 32Z" fill={shade(pelage, -0.3)} />
      <path d="M90 22Q106 20 106 38Q96 42 88 32Z" fill={shade(pelage, -0.3)} />
      {/* Tête carrée, liste blanche */}
      <path d="M23 46Q23 20 49 20H71Q97 20 97 46V58Q97 80 60 80Q23 80 23 58Z" fill={pelage} />
      <path d="M55 20H65L63 50H57Z" fill={C.blanc} />
      {/* Bajoues */}
      <ellipse cx="60" cy="79" rx="10" ry="7" fill={shade(C.blanc, -0.2)} />
      <ellipse cx="76" cy="69" rx="17" ry="16" fill={shade(C.blanc, -0.1)} />
      <ellipse cx="44" cy="69" rx="17" ry="16" fill={C.blanc} />
      <path d="M50 54Q60 48 70 54Q70 62 60 64Q50 62 50 54Z" fill={C.noir} />
      <circle cx="40" cy="46" r="2.6" fill={C.nuit} />
      <circle cx="80" cy="46" r="2.6" fill={C.nuit} />
      {/* Sourcils froncés */}
      <path d="M29 35L50 41L49 45.5L29 40Z" fill={C.boisFonce} />
      <path d="M91 35L70 41L71 45.5L91 40Z" fill={C.boisFonce} />
    </Svg>
  );
};

/** Sir Auguste : morse majordome en queue-de-pie. Solennel : grosse moustache, sourcils graves. */
const auguste: Art = (props) => {
  const peau = shade(C.bois, 0.15);
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.marine} />
      {/* Tête en dôme, cou épais */}
      <path d="M30 58Q30 16 60 16Q90 16 90 58Q98 72 96 92H24Q22 72 30 58Z" fill={peau} />
      <path d="M72 19Q90 26 90 58Q98 72 96 92H88Q90 72 84 58Q84 30 72 19Z" fill={shade(peau, -0.18)} />
      {/* Queue-de-pie, plastron, nœud papillon */}
      <path d="M4 120V106Q4 88 26 88H94Q116 88 116 106V120Z" fill={C.noir} />
      <path d="M48 88H72L68 120H52Z" fill={C.blanc} />
      <path d="M60 96L49 90V102ZM60 96L71 90V102Z" fill={C.noir} />
      <circle cx="60" cy="96" r="2.8" fill={C.grisFonce} />
      {/* Défenses */}
      <path d="M40 72H49Q50 96 45 108Q39 96 40 72Z" fill={C.ivoire} />
      <path d="M71 72H80Q81 96 75 108Q70 96 71 72Z" fill={C.ivoire} />
      <path d="M46 72H49Q50 96 45 108Q47 94 46 72ZM77 72H80Q81 96 75 108Q78 94 77 72Z" fill={shade(C.ivoire, -0.2)} />
      {/* La moustache */}
      <ellipse cx="76" cy="66" rx="19" ry="13" fill={shade(C.creme, -0.1)} />
      <ellipse cx="44" cy="66" rx="19" ry="13" fill={C.creme} />
      <path d={semis(1.3, [[35, 64], [44, 70], [52, 64], [68, 64], [76, 70], [85, 64]])} fill={shade(C.creme, -0.3)} />
      <path d="M53 54Q60 49 67 54Q66 60 60 61Q54 60 53 54Z" fill={C.boisFonce} />
      <circle cx="46" cy="41" r="2.5" fill={C.nuit} />
      <circle cx="74" cy="41" r="2.5" fill={C.nuit} />
      {/* Sourcils broussailleux, graves */}
      <path d="M37 37Q45 30 55 30.5L55.5 34.5Q46 34 38.5 40.5Z" fill={C.creme} />
      <path d="M83 37Q75 30 65 30.5L64.5 34.5Q74 34 81.5 40.5Z" fill={C.creme} />
    </Svg>
  );
};

/** Mlle Sidonie : flamant rose, mètre ruban au cou. Exigeante : chignon serré, sourcils sévères. */
const sidonie: Art = (props) => {
  const rose = C.bougClair;
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.persFonce} />
      {/* Robe sombre */}
      <path d="M20 120V110Q20 93 44 89H76Q100 93 100 110V120Z" fill={C.nuit} />
      {/* Long cou en S, col blanc */}
      <path d="M60 95C60 83 37 83 39 68C41 55 57 59 60 46" fill="none" stroke={rose} strokeWidth="10" />
      <path d="M48 89Q55 86 60 92Q54 101 44 96ZM72 89Q65 86 60 92Q66 101 76 96Z" fill={C.blanc} />
      {/* Le mètre ruban */}
      <path d="M46.5 96H53.5L50 120H43ZM66.5 96H73.5L80 116H73Z" fill={C.mimosa} />
      <path d="M50 101h3M49.3 106h3M48.6 111h3M47.9 116h3M69.2 101h3M70.9 106h3M72.5 111h3" fill="none" stroke={C.nuit} strokeWidth="0.9" />
      {/* Tête, chignon de plumes */}
      <circle cx="80" cy="20" r="7.5" fill={C.bougainvillier} />
      <ellipse cx="64" cy="36" rx="19" ry="18" fill={rose} />
      {/* Bec busqué à pointe noire */}
      <g transform="rotate(12 64 40)">
        <path d="M56 40Q64 35 72 40Q73 54 64 66Q55 54 56 40Z" fill={C.creme} />
        <path d="M70.5 53.5Q68.5 60 64 66Q59.5 60 57.5 53.5Z" fill={C.noir} />
      </g>
      <circle cx="52" cy="36" r="2.5" fill={C.nuit} />
      <circle cx="76" cy="36" r="2.5" fill={C.nuit} />
      {/* Sourcils sévères */}
      <path d="M46 29.5L57 32L56.5 34.3L45.5 31.8Z" fill={C.nuit} />
      <path d="M82 29.5L71 32L71.5 34.3L82.5 31.8Z" fill={C.nuit} />
    </Svg>
  );
};

/** Enzo : guépard en blouson, gants de conduite sur le volant. Pressé : penché, écharpe au vent. */
const enzo: Art = (props) => {
  const pelage = C.paille;
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.cerise} />
      {/* Blouson, écharpe au vent */}
      <path d="M12 120V104Q12 86 32 86H88Q108 86 108 104V120Z" fill={C.marine} />
      <path d="M88 86Q108 86 108 104V120H94V90Z" fill={shade(C.marine, -0.25)} />
      <path d="M70 79Q84 71 97 76Q108 80 118 73V84Q108 90 97 86Q84 82 74 91Z" fill={C.blanc} />
      <g transform="rotate(-6 60 84)">
        {/* Oreilles rondes */}
        <circle cx="35" cy="26" r="9" fill={pelage} />
        <circle cx="85" cy="26" r="9" fill={pelage} />
        <circle cx="35" cy="26" r="4" fill={C.boisFonce} />
        <circle cx="85" cy="26" r="4" fill={C.boisFonce} />
        {/* Tête, museau blanc, larmes noires du guépard */}
        <ellipse cx="60" cy="50" rx="31" ry="29" fill={pelage} />
        <path d="M60 56Q52 53.5 47.5 59.5Q44.5 67 52 71Q56 76 60 76Q64 76 68 71Q75.5 67 72.5 59.5Q68 53.5 60 56Z" fill={C.blanc} />
        <path d="M50.8 52.5Q46.5 60 42.8 70.5L45.8 71.8Q49.6 61.5 53.6 54ZM69.2 52.5Q73.5 60 77.2 70.5L74.2 71.8Q70.4 61.5 66.4 54Z" fill={C.noir} />
        <path d="M55.5 59.5Q60 57 64.5 59.5Q63.5 64.5 60 65.5Q56.5 64.5 55.5 59.5Z" fill={C.noir} />
        <path d={semis(1.9, [[41, 33], [51, 27], [60, 32], [69, 27], [79, 33], [33, 47], [87, 47], [37, 59], [83, 59]])} fill={C.noir} />
        <circle cx="48" cy="49" r="2.6" fill={C.nuit} />
        <circle cx="72" cy="49" r="2.6" fill={C.nuit} />
        {/* Sourcils décidés */}
        <path d="M40 40L54 42.5L53.6 45.2L40 43.6Z" fill={C.noir} />
        <path d="M80 40L66 42.5L66.4 45.2L80 43.6Z" fill={C.noir} />
      </g>
      <path d="M43 82Q60 77 77 80Q80 86 77 91Q60 97 43 92Q40 87 43 82Z" fill={C.blanc} />
      <circle cx="75" cy="86" r="5.5" fill={shade(C.blanc, -0.12)} />
      {/* Volant et gants de conduite */}
      <circle cx="60" cy="136" r="38" fill="none" stroke={C.noir} strokeWidth="7" />
      <rect x="28" y="99" width="17" height="14" rx="6" fill={C.kraft} transform="rotate(-20 36.5 106)" />
      <rect x="75" y="99" width="17" height="14" rx="6" fill={C.kraft} transform="rotate(20 83.5 106)" />
      <path d={semis(2.2, [[36.5, 105.5], [83.5, 105.5]])} fill={shade(C.kraft, -0.4)} />
    </Svg>
  );
};

/** Mme Colette : chatte persane, tailleur et perles. Mondaine : sourcils ravis, tout est « ravissant ». */
const colette: Art = (props) => {
  const tete =
    "M60 20Q76 18 86 30Q100 36 100 52L95 53Q104 60 100 72L94 72Q98 82 86 86L78 84Q68 92 60 88Q52 92 42 84L34 86Q22 82 26 72L20 72Q16 60 25 53L20 52Q20 36 34 30Q44 18 60 20Z";
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.lilas} />
      {/* Petites oreilles écartées */}
      <path d="M27 36L29 13L48 24ZM93 36L91 13L72 24Z" fill={C.blanc} />
      <path d="M31 30L32 19L41 25ZM89 30L88 19L79 25Z" fill={C.rose} />
      {/* Tailleur, galon, rang de perles */}
      <path d="M12 120V106Q12 88 32 88H88Q108 88 108 106V120Z" fill={C.bougainvillier} />
      <path d="M88 88Q108 88 108 106V120H94V92Z" fill={C.bougFonce} />
      <path d="M40 88H80Q60 108 40 88Z" fill={C.bougFonce} />
      <path d="M17 106l3 2.6l3-2.6M27 97l3 2.6l3-2.6M29 111l3 2.6l3-2.6M45 113l3 2.6l3-2.6M57 115l3 2.6l3-2.6M69 113l3 2.6l3-2.6M83 108l3 2.6l3-2.6" fill="none" stroke={C.bougFonce} strokeWidth="1.2" />
      <path d={semis(2.5, [[38, 96], [42.5, 101], [48, 105], [54, 107.5], [60, 108.5], [66, 107.5], [72, 105], [77.5, 101], [82, 96]])} fill={C.ivoire} />
      {/* Tête toute en fourrure */}
      <path d={tete} transform="translate(2.5 3)" fill={shade(C.lilas, -0.3)} />
      <path d={tete} fill={C.blanc} />
      <path d="M60 58.5Q54 56 51.5 60.5Q51 66 57 66Q59 66 60 64.5Q61 66 63 66Q69 66 68.5 60.5Q66 56 60 58.5Z" fill={shade(C.lilas, 0.7)} />
      <path d="M56.5 53H63.5L60 57.5Z" fill={C.bougClair} />
      <circle cx="47" cy="50" r="2.6" fill={C.nuit} />
      <circle cx="73" cy="50" r="2.6" fill={C.nuit} />
      {/* Sourcils haut levés, ravis */}
      <path d="M40.5 41.5Q46 36.5 53 39L52.5 41Q46 38.8 41.8 43.2Z" fill={C.nuit} />
      <path d="M79.5 41.5Q74 36.5 67 39L67.5 41Q74 38.8 78.2 43.2Z" fill={C.nuit} />
      <path d="M44.6 50.4L40.4 47.2L45.3 48.5ZM75.4 50.4L79.6 47.2L74.7 48.5Z" fill={C.nuit} />
    </Svg>
  );
};

/** Maître Archibald : hibou en robe de commissaire-priseur, marteau levé. Érudit : sourcils lourds, lorgnon de laiton. */
const archibald: Art = (props) => {
  const plumage = shade(C.kraft, -0.25);
  return (
    <Svg viewBox="0 0 120 120" {...props}>
      <rect width="120" height="120" fill={C.sable} />
      {/* Aigrettes */}
      <path d="M23 35L16 12L26 19L27 5L41 21ZM81 35L88 12L78 19L77 5L63 21Z" fill={C.boisFonce} />
      {/* Robe noire, rabat blanc */}
      <path d="M4 120V106Q4 88 24 88H80Q100 88 100 106V120Z" fill={C.noir} />
      <path d="M44 84H60L64 110H54L52 98L50 110H40Z" fill={C.blanc} />
      {/* Tête ronde, disques de la face */}
      <ellipse cx="52" cy="50" rx="33" ry="32" fill={plumage} />
      <circle cx="38" cy="55" r="15" fill={C.creme} />
      <circle cx="66" cy="55" r="15" fill={C.creme} />
      {/* Sourcils lourds, d'un seul tenant */}
      <path d="M21 47Q29 32 42 35Q50 37 52 44Q54 37 62 35Q75 32 83 47L79 50Q74 42 66 42Q58 42 52 53Q46 42 38 42Q30 42 25 50Z" fill={C.boisFonce} />
      <path d="M47.5 56Q52 52.5 56.5 56L52 68Z" fill={C.mimosaFonce} />
      <circle cx="38" cy="55" r="2.6" fill={C.nuit} />
      <circle cx="66" cy="55" r="2.6" fill={C.nuit} />
      {/* Lorgnon */}
      <circle cx="38" cy="55" r="8.5" fill="none" stroke={METAL.laiton} strokeWidth="1.8" />
      <circle cx="66" cy="55" r="8.5" fill="none" stroke={METAL.laiton} strokeWidth="1.8" />
      {/* Le marteau, levé */}
      <rect x="97" y="48" width="4.5" height="48" fill={C.bois} />
      <rect x="88" y="38" width="23" height="13" rx="3" fill={C.boisFonce} />
      <rect x="97" y="38" width="5" height="13" fill={METAL.laiton} />
      <path d="M86 120V102Q86 92 98 92Q110 92 110 102V120Z" fill={C.noir} />
      <path d="M91 98Q91 89 96 89Q98 86 101.5 89Q107 89 107 98Z" fill={plumage} />
    </Svg>
  );
};

/**
 * Identifiants attendus : piou, gaspard, ondine, hector, baron, auguste, sidonie,
 * enzo, colette, archibald.
 */
export const PNJ: Record<string, Art> = {
  piou,
  gaspard,
  ondine,
  hector,
  baron,
  auguste,
  sidonie,
  enzo,
  colette,
  archibald,
};
