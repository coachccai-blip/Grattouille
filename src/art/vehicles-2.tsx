// Chez Enzo, suite : 9 véhicules, du caddie de supermarché à la comète apprivoisée.
//
// Même contrat que vehicles.tsx (à lire d'abord) : même viewBox, même cadrage, même
// ombre portée au sol. Le véhicule se pose à gauche de l'avatar, dans le Domaine.
//
// Identifiants attendus (shared/catalog.ts) :
//   caddie, pedalo, helicoptere, sous-marin, dirigeable, paquebot, fusee, soucoupe, comete.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** L'eau, à la place du sol, et ses reflets : les mêmes que sous le yacht. */
const EAU = "M2 128Q2 118 16 118H224Q238 118 238 128Q238 138 224 138H16Q2 138 2 128Z";
const REFLETS = "M22 127H50L56 124L62 127H96V130H22ZM140 132H176L182 129L188 132H222V135H140Z";

/** Un semis de petits ronds en un seul tracé : pompons, rivets. */
function semis(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** Un hublot : cerclage de métal et vitre. */
function hublot(cx: number, cy: number, r: number, metal: string = METAL.laiton) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={metal} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill={C.ciel} />
    </g>
  );
}

/** Le caddie : panier de fils chromés, coussin de velours à pompons, plaid, et une roue folle. */
const caddie: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="130" cy="130" rx="72" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Rétroviseur : c'est un véhicule, tout de même */}
    <path d="M56 34L51 14" fill="none" stroke={C.grisFonce} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="50" cy="11" r="5.5" fill={C.grisFonce} />
    {/* Le coussin de velours, calé au fond du panier */}
    <g transform="rotate(-10 106 58)">
      <path d="M79 31Q106 37 133 31Q127 58 133 85Q106 79 79 85Q85 58 79 31Z" fill={C.bougainvillier} />
      <path d="M133 31Q127 58 133 85Q106 79 79 85Q104 74 121 74Q121 52 133 31Z" fill={C.bougFonce} />
      <circle cx="104" cy="56" r="3" fill={C.bougFonce} />
      <path d={semis(2.6, [[79, 31], [133, 31]])} fill={METAL.or} />
    </g>
    {/* Châssis : montant, longeron, chapes des roulettes */}
    <path d="M73 90L77 106H188" fill="none" stroke={C.gris} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M80 105H92L90 118H82Z" fill={C.grisFonce} />
    <circle cx="86" cy="119" r="9" fill={C.noir} />
    <circle cx="86" cy="119" r="4" fill={C.gris} />
    {/* La roue folle, de travers */}
    <g transform="rotate(14 180 106)">
      <path d="M174 105H186L184 118H176Z" fill={C.grisFonce} />
      <ellipse cx="180" cy="118.5" rx="5.5" ry="9.5" fill={C.noir} />
      <ellipse cx="180" cy="118.5" rx="2.4" ry="4.2" fill={C.gris} />
    </g>
    <path d="M190 110Q194 117 190 124M197 107Q203 117 197 127" fill="none" stroke={C.grisFonce} strokeWidth="2" strokeLinecap="round" />
    {/* Panier : fils d'argent, bord de chrome */}
    <path d="M80 44L87 93M96 44L100 92M111 44L113 91M127 44L126 90M143 44L138 90M159 44L151 89M174 44L164 88M190 44L177 87M67 61L201 58M71 77L195 72" fill="none" stroke={METAL.argent} strokeWidth="1.8" />
    <path d="M64 44L74 94L190 86L206 44" fill="none" stroke={METAL.argent} strokeWidth="3.5" strokeLinejoin="round" />
    <rect x="60" y="41.5" width="150" height="5" rx="2.5" fill={METAL.chrome} />
    {/* Le plaid à carreaux, jeté sur le bord, et ses franges */}
    <path d="M149 75.5H207" fill="none" stroke={shade(C.mimosa, -0.25)} strokeWidth="6" strokeDasharray="2 2.6" />
    <path d="M146 46Q146 36 158 36H200Q212 36 212 46L208.4 70Q208 73 205 73H149Q146 73 146 70Z" fill={C.mimosa} />
    <path d="M198 36H200Q212 36 212 46L208.4 70Q208 73 205 73H198Z" fill={shade(C.mimosa, -0.12)} />
    <path d="M146 52H211M146 61H209.7M162 36.5V73M186 36.5V73" fill="none" stroke={C.cerise} strokeWidth="2.2" />
    {/* Poignée */}
    <path d="M67.4 42L47.4 28L44.6 32L64.6 46Z" fill={METAL.chrome} />
    <rect x="34" y="23" width="20" height="9" rx="4.5" transform="rotate(35 44 27.5)" fill={C.cerise} />
  </Svg>
);

/** Le pédalo « Le Cygne » : coque blanche, aile en relief, cou en S, bec orange, deux sièges. */
const pedalo: Art = (props) => {
  const ombre = shade(C.blanc, -0.14);
  const cou = "M162 104C190 102 206 84 194 64C185 49 186 33 202 31";
  const aile = "M174 98Q154 76 118 74Q84 73 40 60Q44 73 56 80Q46 80 38 77Q46 90 60 94Q52 96 46 96Q64 111 106 110Q154 110 174 98Z";
  return (
    <Svg viewBox="0 0 240 140" {...props}>
      <path d={EAU} fill={C.mer} />
      {/* Les deux sièges */}
      <path d="M64 90V62Q64 52 74 52H78Q88 52 88 62V90ZM100 90V62Q100 52 110 52H114Q124 52 124 62V90Z" fill={C.corail} />
      <path d="M80 52.3Q88 53.5 88 62V90H80ZM116 52.3Q124 53.5 124 62V90H116Z" fill={shade(C.corail, -0.22)} />
      {/* Le cou du cygne, sa tête, son bec */}
      <path d={cou} transform="translate(3 2)" fill="none" stroke={ombre} strokeWidth="15" strokeLinecap="round" />
      <path d={cou} fill="none" stroke={C.blanc} strokeWidth="15" strokeLinecap="round" />
      <path d="M210 23.5Q225 24 235 34Q222 40.5 209 38Z" fill={C.corail} />
      <ellipse cx="207.5" cy="33" rx="11.5" ry="9.5" fill={ombre} />
      <ellipse cx="205" cy="31" rx="11.5" ry="9.5" fill={C.blanc} />
      <path d="M208 22.5Q215 20 217.5 26L211 30.5Z" fill={C.noir} />
      <circle cx="204" cy="28" r="2.2" fill={C.nuit} />
      {/* Coque */}
      <path d="M12 68Q24 84 46 86H166Q192 86 200 98Q204 110 194 118Q190 122 182 122H56Q32 122 24 100Q18 86 12 68Z" fill={C.blanc} />
      <path d="M27 107H201.5Q200 113 194 118Q190 122 182 122H56Q36 122 27 107Z" fill={ombre} />
      {/* L'aile, en relief : elle cache le bas des sièges */}
      <path d={aile} transform="translate(2.5 3)" fill={shade(C.blanc, -0.24)} />
      <path d={aile} fill={C.blanc} />
      <path d={REFLETS} fill={shade(C.mer, 0.25)} />
    </Svg>
  );
};

/** L'hélicoptère « Libellule » : bulle de verre, queue fine et annelée, patins, une pale. */
const helicoptere: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="132" cy="130" rx="96" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Patins */}
    <path d="M140 108L134 125M184 108L190 125" fill="none" stroke={C.grisFonce} strokeWidth="3" />
    <path d="M112 126H200Q208 126 212 118" fill="none" stroke={C.grisFonce} strokeWidth="4" strokeLinecap="round" />
    {/* Rotor de queue, dérives */}
    <rect x="24.5" y="40" width="3" height="40" rx="1.5" transform="rotate(18 26 60)" fill={C.gris} />
    <path d="M40 58L26 32H37L56 59Z" fill={C.corail} />
    <path d="M32 62L25 78H33L46 64Z" fill={shade(C.corail, -0.25)} />
    {/* Poutre de queue, annelée comme un abdomen de libellule */}
    <path d="M130 66L26 57V63L118 84Z" fill={C.corail} />
    <path d="M26 60L122 75L118 84L26 63Z" fill={shade(C.corail, -0.25)} />
    <path d="M60 59.9L64 60.3V71.7L60 70.8ZM70 60.8L74 61.2V74L70 73Z" fill={C.creme} />
    <circle cx="26" cy="60" r="3.5" fill={C.grisFonce} />
    {/* Capot du moteur, mât, moyeu et pale */}
    <path d="M126 64Q130 46 146 46H154Q164 46 168 60Z" fill={shade(C.corail, -0.25)} />
    <rect x="149" y="32" width="4" height="16" fill={C.grisFonce} />
    <rect x="62" y="27.5" width="176" height="3.5" rx="1.75" fill={C.gris} />
    <rect x="142" y="26" width="18" height="6.5" rx="3.2" fill={C.grisFonce} />
    {/* Cabine */}
    <path d="M112 84Q112 60 146 58H168Q208 60 210 88Q210 110 176 112H142Q112 110 112 84Z" fill={C.corail} />
    <path d="M116.5 98H208.4Q203 111 176 112H142Q122 110.6 116.5 98Z" fill={shade(C.corail, -0.25)} />
    {/* La bulle, jusqu'au nez */}
    <path d="M148 58H168Q208 60 210 88Q210 92 209.5 95.5H148Z" fill={C.azur} />
    <path d="M178 61Q190 63.5 197 70L182 92H171Z" fill={shade(C.azur, 0.45)} />
    <rect x="164" y="58" width="3.5" height="37.5" fill={C.corail} />
    <rect x="116" y="95.5" width="93.5" height="2.5" fill={METAL.or} />
  </Svg>
);

/** Le sous-marin de poche : coque sarcelle, hublots et périscope de laiton, hélice à l'arrière. */
const sousMarin: Art = (props) => {
  // Sarcelle : entre la persienne et la mer, absente de la palette.
  const coque = "#1C8587";
  return (
    <Svg viewBox="0 0 240 140" {...props}>
      <path d={EAU} fill={C.mer} />
      {/* Hélice */}
      <ellipse cx="30" cy="79" rx="5" ry="10.5" fill={METAL.laiton} />
      <ellipse cx="30" cy="105" rx="5" ry="10.5" fill={METAL.laiton} />
      <rect x="26" y="87" width="18" height="10" rx="4" fill={METAL.laiton} />
      {/* Gouvernails */}
      <path d="M50 82L40 60H56L76 76ZM50 102L40 120H56L76 108Z" fill={shade(coque, -0.3)} />
      {/* Périscope */}
      <path d="M134 44V18H146" fill="none" stroke={METAL.laiton} strokeWidth="4.5" strokeLinejoin="round" />
      <rect x="143" y="13.5" width="8" height="9" rx="2" fill={METAL.laiton} />
      {/* Kiosque */}
      <path d="M114 66V46Q114 38 122 38H146Q154 38 156 46L160 66Z" fill={coque} />
      <path d="M142 38H146Q154 38 156 46L160 66H146Z" fill={shade(coque, -0.25)} />
      {/* Coque */}
      <path d="M36 92Q62 64 112 62H170Q216 62 216 92Q216 122 170 122H112Q62 120 36 92Z" fill={coque} />
      <path d="M47 102H214Q206 122 170 122H112Q70 120.6 47 102Z" fill={shade(coque, -0.25)} />
      {hublot(100, 86, 9.5)}
      {hublot(136, 86, 9.5)}
      {hublot(172, 86, 9.5)}
      <circle cx="205" cy="82" r="4" fill={C.mimosa} />
      <path d={REFLETS} fill={shade(C.mer, 0.25)} />
    </Svg>
  );
};

/** Fuseau du dirigeable, de la queue (16, 56) au nez (232, 56) : `h` vers le haut, `b` vers le bas. */
function fuseau(h: number, b: number = h): string {
  const y = (k: number) => +(56 + k).toFixed(1);
  return `M16 56C44 ${y(-0.85 * h)} 232 ${y(-1.55 * h)} 232 56C232 ${y(1.55 * b)} 44 ${y(0.85 * b)} 16 56Z`;
}

/** Le dirigeable « Grand Nuage » : enveloppe rayée crème et corail, nacelle marine. Il flotte. */
const dirigeable: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    {/* Il ne touche pas terre : son ombre est petite et pâle */}
    <ellipse cx="150" cy="131" rx="52" ry="3.5" fill={C.nuit} fillOpacity="0.1" />
    {/* Empennage */}
    <path d="M30 46L20 20H40L66 36Z" fill={C.corail} />
    <path d="M30 66L20 92H40L66 76Z" fill={shade(C.corail, -0.25)} />
    {/* Nacelle et hélice */}
    <rect x="99" y="91" width="3" height="27" rx="1.5" fill={C.nuit} />
    <rect x="102" y="101" width="20" height="7" rx="3.5" fill={C.grisFonce} />
    <path d="M118 90H188L184 108Q182 114 174 114H132Q124 114 122 108Z" fill={C.marine} />
    <path d="M120.9 104.5H184.8L184 108Q182 114 174 114H132Q124 114 122 108Z" fill={shade(C.marine, -0.3)} />
    <path d="M130 100H178" fill="none" stroke={C.creme} strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 11.9" />
    {/* Enveloppe rayée */}
    <path d={fuseau(44)} fill={C.corail} />
    <path d={fuseau(32)} fill={C.creme} />
    <path d={fuseau(20)} fill={C.corail} />
    <path d={fuseau(7)} fill={C.creme} />
    {/* Le ventre, à l'ombre */}
    <path d={fuseau(-32, 44)} fill={shade(C.corail, -0.25)} />
    <path d={fuseau(-20, 32)} fill={shade(C.creme, -0.16)} />
    {/* Dérive latérale */}
    <path d="M12 52.5H58L50 59.5H16Z" fill={shade(C.corail, -0.4)} />
  </Svg>
);

/** Le paquebot « Démesure II » : coque noire, ponts blancs, trois cheminées rouges, des hublots à perte de vue. */
const paquebot: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <path d={EAU} fill={C.mer} />
    {/* Mâts et pavillon de poupe */}
    <path d="M26 78L20 46M196 66L202 34" fill="none" stroke={C.nuit} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 46L6 51L19 57Z" fill={C.cerise} />
    {/* Les trois cheminées, inclinées vers la poupe */}
    <path d="M52 66L48 30H66L70 66ZM92 66L88 30H106L110 66ZM132 66L128 30H146L150 66Z" fill={C.cerise} />
    <path d="M60 30H66L70 66H64ZM100 30H106L110 66H104ZM140 30H146L150 66H144Z" fill={shade(C.cerise, -0.25)} />
    <path d="M48 30H66L66.9 38H48.9ZM88 30H106L106.9 38H88.9ZM128 30H146L146.9 38H128.9Z" fill={C.noir} />
    {/* Ponts et passerelle */}
    <path d="M158 64V54H178L184 64ZM40 76V64H182L190 76ZM22 90V76H198L210 90Z" fill={C.blanc} />
    <path d="M172 54H178L184 64H172ZM168 64H182L190 76H168ZM184 76H198L210 90H184Z" fill={shade(C.blanc, -0.2)} />
    <path d="M162 57H177L179 60.5H162ZM46 68H180L183 72.5H46Z" fill={C.nuit} />
    <path d="M30 83H200" fill="none" stroke={C.nuit} strokeWidth="4" strokeLinecap="round" strokeDasharray="0.1 7.9" />
    {/* Coque */}
    <path d="M6 90H198Q220 88 236 80L222 122H18Q8 110 6 90Z" fill={C.noir} />
    <path d="M13 116H224L222 122H18Q15 119.5 13 116Z" fill={C.cerise} />
    <rect x="8" y="93" width="198" height="2" fill={METAL.or} />
    {/* Hublots : deux rangs de pointillés */}
    <path d="M16 101H214M20 109H212" fill="none" stroke={C.creme} strokeWidth="3.2" strokeLinecap="round" strokeDasharray="0.1 8.9" />
    <path d={REFLETS} fill={shade(C.mer, 0.25)} />
  </Svg>
);

/** La fusée « Grattouille One » : rétro, debout sur ses ailerons, coiffe rouge et hublot. */
const fusee: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="74" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Pas de tir */}
    <rect x="56" y="124.5" width="128" height="3.5" fill={C.grisFonce} />
    <rect x="64" y="121" width="112" height="4" rx="1" fill={C.gris} />
    {/* Ailerons latéraux, tuyère */}
    <path d="M102 80Q78 94 72 122H86Q90 106 106 102Z" fill={C.cerise} />
    <path d="M138 80Q162 94 168 122H154Q150 106 134 102Z" fill={shade(C.cerise, -0.25)} />
    <path d="M108 108H132L136 118H104Z" fill={C.grisFonce} />
    {/* Corps */}
    <path d="M120 4Q146 36 146 70Q146 94 134 110H106Q94 94 94 70Q94 36 120 4Z" fill={C.blanc} />
    <path d="M132 41H141.1Q146 55 146 70Q146 94 134 110H124Q136 94 136 70Q136 55 132 41Z" fill={shade(C.blanc, -0.14)} />
    {/* Coiffe rouge et sa bague d'or */}
    <path d="M120 4Q132.8 19.8 139.3 36H100.7Q107.2 19.8 120 4Z" fill={C.cerise} />
    <path d="M120 4Q132.8 19.8 139.3 36H130Q127 19 120 4Z" fill={shade(C.cerise, -0.25)} />
    <path d="M100.7 36H139.3L141.1 41H98.9Z" fill={METAL.or} />
    {hublot(120, 62, 10, METAL.or)}
    {/* Aileron de face */}
    <path d="M116 90Q120 84 124 90V122H116Z" fill={shade(C.cerise, -0.25)} />
  </Svg>
);

/** La soucoupe volante d'occasion : dôme de verre, couronne de feux (un grillé), une bosse, une rustine. */
const soucoupe: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="84" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Les trois béquilles */}
    <path d="M72 92L52 125M168 92L188 125M120 100V125" fill="none" stroke={C.grisFonce} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M42 124H62V128H42ZM178 124H198V128H178ZM111 124H129V128H111Z" fill={C.grisFonce} />
    {/* Antenne tordue */}
    <path d="M120 30L125 17L117 10" fill="none" stroke={C.grisFonce} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    <circle cx="116" cy="8" r="3.5" fill={C.cerise} />
    {/* Dôme de verre */}
    <path d="M88 60Q88 28 120 28Q152 28 152 60Z" fill={C.persClair} />
    <path d="M98 54Q98 38 114 34L118 38Q106 42 105 54Z" fill={shade(C.persClair, 0.5)} />
    {/* Ventre */}
    <path d="M92 98H148Q144 110 120 110Q96 110 92 98Z" fill={C.grisFonce} />
    {/* Disque : dessus d'argent, dessous à l'ombre */}
    <path d="M18 80Q56 58 90 56H150Q164 57 172 60L176 65L184 63Q204 69 222 80Q184 100 150 102H90Q56 100 18 80Z" fill={METAL.argent} />
    <path d="M18 80H222Q184 100 150 102H90Q56 100 18 80Z" fill={C.gris} />
    <rect x="84" y="55" width="72" height="6" rx="3" fill={C.grisFonce} />
    {/* Couronne de feux : l'un d'eux a rendu l'âme */}
    <path d="M18 80Q22 75 34 75H206Q218 75 222 80Q218 85 206 85H34Q22 85 18 80Z" fill={C.grisFonce} />
    <path d="M40 80H200" fill="none" stroke={C.mimosa} strokeWidth="5.5" strokeLinecap="round" strokeDasharray="0.1 19.9" />
    <circle cx="160" cy="80" r="2.75" fill={C.gris} />
    {/* La bosse */}
    <path d="M172 60L176 65L184 63L190 70L180 73L168 70Z" fill={C.grisFonce} />
    <path d="M168 70L180 73L190 70L182 75H172Z" fill={C.blanc} />
    {/* La rustine de cuivre, rivetée */}
    <g transform="rotate(-18 60 68)">
      <rect x="50" y="63" width="20" height="10" rx="1.5" fill={METAL.cuivre} />
      <path d={semis(1, [[52.5, 65.5], [67.5, 65.5], [52.5, 70.5], [67.5, 70.5]])} fill={C.grisFonce} />
    </g>
  </Svg>
);

/** La comète apprivoisée : noyau de glace sellé et bridé, longue queue de bandes bleu pâle et or. */
const comete: Art = (props) => {
  const bleu = shade(C.azur, 0.35);
  return (
    <Svg viewBox="0 0 240 140" {...props}>
      {/* Elle flotte : ombre petite et pâle */}
      <ellipse cx="184" cy="131" rx="36" ry="3.5" fill={C.nuit} fillOpacity="0.1" />
      {/* La queue : des bandes plates, bleu pâle et or */}
      <path d="M184 40Q110 34 38 20Q112 46 184 56Z" fill={METAL.or} />
      <path d="M184 52Q96 50 8 36Q98 62 184 68Z" fill={bleu} />
      <path d="M184 64Q106 64 30 58Q108 74 184 80Z" fill={C.blanc} />
      <path d="M184 76Q96 80 10 76Q98 90 184 92Z" fill={METAL.or} />
      <path d="M184 88Q118 94 50 98Q118 104 184 106Z" fill={bleu} />
      {/* Le halo, puis le noyau de glace et ses facettes */}
      <circle cx="186" cy="74" r="38" fill={shade(C.ciel, 0.55)} />
      <circle cx="186" cy="74" r="31" fill={bleu} />
      <path d="M184 50L203 55L212 71L209 89L195 100L175 98L162 86L161 67L171 54Z" fill={C.blanc} />
      <path d="M212 71L209 89L195 100L175 98L194 88L202 74Z" fill={C.azur} />
      <path d="M161 67L176 73L175 98L162 86Z" fill={C.ciel} />
      {/* Sangle, tapis de selle, quartier, siège, étrier */}
      <path d="M179.5 60L178.5 98.3L182.5 98.8L183.5 60Z" fill={C.boisFonce} />
      <path d="M164 47H208L205 62Q186 68 167 62Z" fill={C.cerise} />
      <path d="M172 49H201Q202 58 198 62.5Q186 66 175 62.5Q171 58 172 49Z" fill={shade(C.bois, -0.14)} />
      <path d="M170 48.5Q172 38.5 180 42Q188 45.5 196 40.5Q202 39 203 48.5Q197 52 186 52Q175 52 170 48.5Z" fill={C.bois} />
      <path d="M191 65V72M187.5 81Q187.5 72.5 191 72.5Q194.5 72.5 194.5 81Z" fill="none" stroke={METAL.or} strokeWidth="1.8" strokeLinejoin="round" />
      {/* Bride et rênes */}
      <path d="M204.5 55.5Q215 74 207 92" fill="none" stroke={C.boisFonce} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M212 74Q228 56 202 43.5" fill="none" stroke={C.boisFonce} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="212" cy="74" r="2.8" fill={METAL.or} />
      {/* Étincelles */}
      <path d="M228 34L230 41L237 43L230 45L228 52L226 45L219 43L226 41ZM230 98L231.5 103L236.5 104.5L231.5 106L230 111L228.5 106L223.5 104.5L228.5 103Z" fill={METAL.or} />
    </Svg>
  );
};

export const VEHICLES_2: Record<string, Art> = {
  caddie,
  pedalo,
  helicoptere,
  "sous-marin": sousMarin,
  dirigeable,
  paquebot,
  fusee,
  soucoupe,
  comete,
};
