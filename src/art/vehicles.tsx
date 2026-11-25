// Les véhicules de Chez Enzo, du vélo au jet (BRIEF.md, annexe A).
//
// Vue de profil, nez vers la droite. viewBox 0 0 240 140. Le sol est à y = 128 :
// les roues (ou la coque, ou le train d'atterrissage) le touchent. Fond transparent.
// Une ombre portée plate au sol, en `nuit` à 18 % d'opacité, assoit le véhicule.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Une roue posée au sol : pneu, jante, moyeu. `jr` et `mr` : rayons de la jante et du moyeu, en part du rayon. */
function roue(cx: number, r: number, jante: string, moyeu: string = C.noir, jr = 0.6, mr = 0.22) {
  const cy = 128 - r;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={C.noir} />
      <circle cx={cx} cy={cy} r={r * jr} fill={jante} />
      <circle cx={cx} cy={cy} r={r * mr} fill={moyeu} />
    </g>
  );
}

const velo: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="92" ry="6" fill={C.nuit} fillOpacity="0.18" />
    {/* Roues */}
    <circle cx="58" cy="98" r="27" fill="none" stroke={C.noir} strokeWidth="6" />
    <circle cx="182" cy="98" r="27" fill="none" stroke={C.noir} strokeWidth="6" />
    <circle cx="58" cy="98" r="20" fill="none" stroke={C.grisClair} strokeWidth="2" />
    <circle cx="182" cy="98" r="20" fill="none" stroke={C.grisClair} strokeWidth="2" />
    {/* Cadre */}
    <path d="M58 98L96 52H158L182 98M96 52L118 98H58M118 98L158 52" fill="none" stroke={C.persienne} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M118 98L158 52" fill="none" stroke={shade(C.persienne, -0.3)} strokeWidth="7" strokeLinecap="round" />
    {/* Selle et guidon */}
    <path d="M96 52L90 38" fill="none" stroke={C.grisFonce} strokeWidth="5" strokeLinecap="round" />
    <path d="M76 34H104Q108 40 100 42H80Q72 40 76 34Z" fill={C.boisFonce} />
    <path d="M158 52L152 30H170" fill="none" stroke={C.grisFonce} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Panier en osier */}
    <path d="M166 34H204L198 62H172Z" fill={C.kraft} />
    <path d="M186 34H204L198 62H186Z" fill={shade(C.kraft, -0.2)} />
    <circle cx="118" cy="98" r="7" fill={C.grisFonce} />
  </Svg>
);

/** Le scooter pétaradant : coque ronde, petites roues, et ses pétarades derrière lui. */
const scooter: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="124" cy="130" rx="76" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Les pétarades */}
    <circle cx="34" cy="100" r="8" fill={C.grisClair} />
    <circle cx="20" cy="86" r="10" fill={C.grisClair} />
    <circle cx="12" cy="66" r="6" fill={C.grisClair} />
    {/* Pot d'échappement */}
    <rect x="40" y="104" width="36" height="7" rx="3.5" fill={C.grisFonce} />
    {roue(78, 16, C.grisClair, C.grisFonce)}
    {roue(172, 16, C.grisClair, C.grisFonce)}
    {/* Selle */}
    <path d="M62 74Q62 60 78 60H110Q122 60 122 70V74Z" fill={C.boisFonce} />
    {/* Coque arrière, plancher et tablier, d'un seul tenant */}
    <path d="M46 92Q46 72 72 72H114Q122 72 124 82L128 98H150L140 56H154L168 104V108H110Q92 100 52 104Q46 100 46 92Z" fill={C.azur} />
    <path d="M58 100Q60 84 82 84H112L116 100Q92 96 58 100ZM148 56H154L168 104V108H162Z" fill={shade(C.azur, -0.25)} />
    {/* Garde-boue avant */}
    <path d="M152 110A20 20 0 0 1 192 110Z" fill={C.azur} />
    <path d="M172 90A20 20 0 0 1 192 110H172Z" fill={shade(C.azur, -0.25)} />
    {/* Guidon, phare, rétroviseur */}
    <path d="M146 44L142 26" fill="none" stroke={C.grisFonce} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="141" cy="23" r="5" fill={C.grisFonce} />
    <rect x="124" y="43" width="18" height="6" rx="3" fill={C.noir} />
    <path d="M136 46Q136 42 140 42H160Q170 42 170 50Q170 58 160 58H140Z" fill={C.azur} />
    <circle cx="165" cy="50" r="5" fill={C.mimosa} />
  </Svg>
);

/** « La Puce » : toute petite, toute ronde, la valise du premier jour sanglée sur le toit. */
const citadine: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="82" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Pare-chocs */}
    <rect x="43" y="101" width="14" height="7" rx="3.5" fill={C.grisClair} />
    <rect x="183" y="101" width="14" height="7" rx="3.5" fill={C.grisClair} />
    {/* La valise sur la galerie */}
    <path d="M86 45H132" fill="none" stroke={C.noir} strokeWidth="2.5" strokeLinecap="round" />
    <rect x="93" y="28" width="32" height="16" rx="3" fill={C.terracotta} />
    <rect x="109" y="28" width="16" height="16" rx="3" fill={shade(C.terracotta, -0.22)} />
    <rect x="93" y="34" width="32" height="3" fill={shade(C.terracotta, -0.5)} />
    {/* Caisse */}
    <path d="M50 108V94Q50 80 62 74Q70 48 92 46H126Q138 46 144 56L152 74Q184 76 190 90V108Q190 112 186 112H54Q50 112 50 108Z" fill={C.mimosa} />
    <path d="M50 99H190V108Q190 112 186 112H54Q50 112 50 108Z" fill={shade(C.mimosa, -0.2)} />
    {/* Vitres */}
    <path d="M70 74Q76 55 94 53H104V74ZM111 53H125Q133 53 137 60L144 74H111Z" fill={C.ciel} />
    {/* Phare, feu arrière, poignée */}
    <circle cx="181" cy="89" r="6" fill={C.blanc} />
    <rect x="50" y="86" width="4" height="9" rx="2" fill={C.terracotta} />
    <rect x="116" y="82" width="11" height="3" rx="1.5" fill={shade(C.mimosa, -0.35)} />
    {/* Passages de roue et roues */}
    <path d="M62 112A18 18 0 0 1 98 112ZM142 112A18 18 0 0 1 178 112Z" fill={shade(C.mimosa, -0.45)} />
    {roue(80, 14, C.grisClair)}
    {roue(160, 14, C.grisClair)}
  </Svg>
);

/** Le cabriolet « Tramontane » : capote repliée, sièges crème, chromes et flancs blancs. */
const cabriolet: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="106" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Capote repliée, siège, volant, pare-brise : derrière la caisse */}
    <path d="M62 88Q62 72 78 72H96V88Z" fill={shade(C.creme, -0.2)} />
    <path d="M96 88V69Q96 62 103 62H110Q117 62 117 69V88Z" fill={C.creme} />
    <path d="M121 66L129 82" fill="none" stroke={C.nuit} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M119 62H127L141 86H129Z" fill={C.ciel} />
    <path d="M125 60H129L143 86H139Z" fill={METAL.chrome} />
    {/* Pare-chocs */}
    <rect x="10" y="101" width="16" height="7" rx="3.5" fill={METAL.chrome} />
    <rect x="216" y="101" width="16" height="7" rx="3.5" fill={METAL.chrome} />
    {/* Caisse : la hanche sur la roue arrière, l'aile avant qui plonge */}
    <path d="M16 104V94Q16 80 32 78Q52 76 70 80Q88 85 110 85H134Q160 80 184 82Q210 86 220 96Q224 100 224 104V108Q224 112 218 112H22Q16 112 16 106Z" fill={C.bougainvillier} />
    <path d="M16 100H222Q224 102 224 104V108Q224 112 218 112H22Q16 112 16 106Z" fill={shade(C.bougainvillier, -0.25)} />
    <rect x="34" y="93" width="172" height="3" rx="1.5" fill={METAL.chrome} />
    <circle cx="213" cy="95" r="4.5" fill={C.creme} />
    {/* Passages de roue et roues à flancs blancs */}
    <path d="M43 112A19 19 0 0 1 81 112ZM159 112A19 19 0 0 1 197 112Z" fill={shade(C.bougainvillier, -0.5)} />
    {roue(62, 15, C.blanc, METAL.argent, 0.7, 0.42)}
    {roue(178, 15, C.blanc, METAL.argent, 0.7, 0.42)}
  </Svg>
);

/** La berline « Grand Large » : longue, bleu marine, calandre droite et fanion sur l'aile. */
const berline: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="110" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Pare-chocs */}
    <rect x="6" y="101" width="16" height="7" rx="3.5" fill={METAL.chrome} />
    <rect x="216" y="101" width="16" height="7" rx="3.5" fill={METAL.chrome} />
    {/* Fanion */}
    <rect x="203" y="60" width="2" height="20" fill={METAL.argent} />
    <path d="M204 60L220 64L204 69Z" fill={C.mimosa} />
    {/* Pavillon et caisse */}
    <path d="M46 80Q50 54 72 52H134Q146 52 152 60L164 80Z" fill={C.marine} />
    <path d="M12 104V88Q12 78 24 78H214Q226 78 226 88V106Q226 112 220 112H18Q12 112 12 106Z" fill={C.marine} />
    <path d="M12 97H226V106Q226 112 220 112H18Q12 112 12 106Z" fill={shade(C.marine, -0.3)} />
    {/* Vitres */}
    <path d="M62 77Q64 60 78 58H100V77ZM107 58H132Q141 58 145 64L153 77H107Z" fill={C.ciel} />
    {/* Chromes : jonc de caisse, poignées, calandre */}
    <rect x="16" y="91" width="196" height="3" rx="1.5" fill={METAL.chrome} />
    <path d="M86 83H97V86H86ZM136 83H147V86H136Z" fill={METAL.chrome} />
    <rect x="218" y="80" width="8" height="22" rx="2" fill={METAL.chrome} />
    <circle cx="211" cy="86" r="4" fill={C.creme} />
    <rect x="12" y="83" width="4" height="9" rx="2" fill={C.cerise} />
    {/* Passages de roue et roues */}
    <path d="M38 112A20 20 0 0 1 78 112ZM162 112A20 20 0 0 1 202 112Z" fill={shade(C.marine, -0.55)} />
    {roue(58, 16, METAL.argent, C.marine)}
    {roue(182, 16, METAL.argent, C.marine)}
  </Svg>
);

/** Le coupé « Fauve GT » : capot interminable, vert anglais, roues à rayons chromées. */
const coupe: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="108" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Échappement et pare-chocs fins */}
    <rect x="4" y="106" width="18" height="4" rx="2" fill={METAL.chrome} />
    <rect x="8" y="98" width="12" height="4" rx="2" fill={METAL.chrome} />
    <rect x="218" y="100" width="12" height="4" rx="2" fill={METAL.chrome} />
    {/* Caisse */}
    <path d="M14 102Q14 92 26 90L62 70Q72 62 86 62H106Q118 62 126 70L140 84Q192 84 214 92Q226 96 226 104Q226 112 218 112H22Q14 112 14 104Z" fill={C.persFonce} />
    <path d="M14 100H225Q226 102 226 104Q226 112 218 112H22Q14 112 14 104Z" fill={shade(C.persFonce, -0.3)} />
    {/* Vitre, phare sous globe, filet crème */}
    <path d="M74 82L86 68Q88 66 92 66H104Q112 66 118 72L128 82Z" fill={C.ciel} />
    <ellipse cx="205" cy="95" rx="8" ry="3.5" transform="rotate(16 205 95)" fill={C.creme} />
    <rect x="30" y="94" width="160" height="2" rx="1" fill={C.creme} />
    {/* Passages de roue et roues à rayons */}
    <path d="M41 112A19 19 0 0 1 79 112ZM157 112A19 19 0 0 1 195 112Z" fill={shade(C.persFonce, -0.6)} />
    {roue(60, 15, METAL.argent, METAL.or, 0.68)}
    {roue(176, 15, METAL.argent, METAL.or, 0.68)}
  </Svg>
);

/** La supercar « Éclair V12 » : un coin rouge au ras du sol, l'éclair mimosa sur le flanc. */
const supercar: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="112" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Aileron */}
    <path d="M20 80V64H28V80Z" fill={shade(C.cerise, -0.45)} />
    <path d="M6 58H44L50 66H6Z" fill={C.cerise} />
    <rect x="4" y="106" width="14" height="4" rx="2" fill={METAL.chrome} />
    {/* Caisse en coin */}
    <path d="M12 104L16 84Q18 78 28 78L98 68H124Q134 68 142 76L156 86L220 100Q230 102 230 108V112Q230 116 224 116H18Q12 116 12 110Z" fill={C.cerise} />
    <path d="M12 104H229Q230 106 230 108V112Q230 116 224 116H18Q12 116 12 110Z" fill={shade(C.cerise, -0.3)} />
    <path d="M12 110H230V112Q230 116 224 116H18Q12 116 12 110Z" fill={C.noir} />
    {/* Vitre teintée, prise d'air, phare */}
    <path d="M100 72H123Q131 72 138 79L148 88H96Z" fill={C.nuit} />
    <path d="M78 90L96 88V102H84Z" fill={C.noir} />
    <path d="M196 97L218 102V105L196 100Z" fill={C.creme} />
    <rect x="13" y="87" width="4" height="10" rx="2" fill={C.mimosa} />
    {/* L'éclair */}
    <path d="M104 93H164L156 99H206L198 104H138L146 98H104Z" fill={C.mimosa} />
    {/* Passages de roue et roues */}
    <path d="M38 116A20 20 0 0 1 78 116ZM162 116A20 20 0 0 1 202 116Z" fill={C.noir} />
    {roue(58, 16, METAL.argent)}
    {roue(182, 16, METAL.argent)}
  </Svg>
);

/** L'hypercar « Comète » : lagune, nuit et or, une traînée dorée et l'étoile sur l'aile. */
const hypercar: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="120" cy="130" rx="116" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Aileron et dérive */}
    <path d="M2 56H44L50 64H2Z" fill={METAL.or} />
    <path d="M18 64H30L38 84H24Z" fill={C.nuit} />
    <path d="M100 72L46 60V84Z" fill={C.nuit} />
    {/* Caisse en goutte */}
    <path d="M6 102L14 86Q60 76 100 72H122Q134 72 144 82L152 90Q166 86 184 86Q206 86 224 98Q234 104 234 110Q234 116 226 116H14Q6 116 6 110Z" fill={C.lagune} />
    <path d="M6 102H229.5Q234 105 234 110H6Z" fill={C.nuit} />
    <path d="M6 108H234V110Q234 116 226 116H14Q6 116 6 110Z" fill={METAL.or} />
    {/* Bulle, phare */}
    <path d="M104 76H121Q130 76 137 83L144 90H98Z" fill={C.azur} />
    <path d="M106 78H115L109 88H100Z" fill={shade(C.azur, 0.45)} />
    <path d="M208 97L228 105L210 102Z" fill={C.ciel} />
    {/* La traînée de la comète */}
    <path d="M20 101Q100 88 158 93V100Q100 95 20 101Z" fill={METAL.or} />
    {/* Passages de roue et roues dorées */}
    <path d="M35 116A21 21 0 0 1 77 116ZM163 116A21 21 0 0 1 205 116Z" fill={C.noir} />
    {roue(56, 17, METAL.or, C.nuit, 0.64)}
    {roue(184, 17, METAL.or, C.nuit, 0.64)}
    {/* L'étoile */}
    <path d="M186 70L189 82L201 85L189 88L186 100L183 88L171 85L183 82Z" fill={C.blanc} />
  </Svg>
);

/** Le yacht « La Sirène » : coque marine, trois ponts blancs, la sirène d'or à la proue. */
const yacht: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    {/* L'eau, à la place du sol */}
    <path d="M2 128Q2 118 16 118H224Q238 118 238 128Q238 138 224 138H16Q2 138 2 128Z" fill={C.mer} />
    {/* Pavillon de poupe */}
    <path d="M24 96L17 70" fill="none" stroke={C.nuit} strokeWidth="2" strokeLinecap="round" />
    <path d="M17 70L3 75L15 82Z" fill={C.cerise} />
    {/* Mât, radar et dôme */}
    <rect x="94" y="32" width="4" height="24" fill={C.nuit} />
    <rect x="82" y="40" width="28" height="4" rx="2" fill={C.nuit} />
    <circle cx="116" cy="49" r="7" fill={C.blanc} />
    {/* Les trois ponts */}
    <path d="M70 66V54H124L136 66ZM48 80V66H152L166 80ZM30 96V80H178L194 96Z" fill={C.blanc} />
    <path d="M112 54H124L136 66H112ZM138 66H152L166 80H138ZM162 80H178L194 96H162Z" fill={shade(C.blanc, -0.2)} />
    <path d="M76 57H120L125 62H76ZM54 70H146L152 76H54ZM36 85H172L178 91H36Z" fill={C.nuit} />
    {/* Coque */}
    <path d="M12 96H150Q200 94 234 84L208 122H20Z" fill={C.marine} />
    <path d="M16 109H217L208 122H20Z" fill={shade(C.marine, -0.3)} />
    <path d="M19 117H212L208 122H20Z" fill={C.cerise} />
    <rect x="14" y="99" width="190" height="2.5" fill={METAL.or} />
    {/* Hublots : un pointillé rond */}
    <path d="M40 106H150" fill="none" stroke={C.blanc} strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 17.9" />
    {/* La sirène de proue */}
    <path d="M233 85Q231 96 220 101Q226 94 224 87Z" fill={METAL.or} />
    {/* Reflets sur l'eau */}
    <path d="M22 127H50L56 124L62 127H96V130H22ZM140 132H176L182 129L188 132H222V135H140Z" fill={shade(C.mer, 0.25)} />
  </Svg>
);

/** Le jet privé « Albatros » : blanc, ventre marine, filet d'or, l'oiseau sur la dérive. */
const jet: Art = (props) => (
  <Svg viewBox="0 0 240 140" {...props}>
    <ellipse cx="126" cy="130" rx="106" ry="5" fill={C.nuit} fillOpacity="0.18" />
    {/* Train d'atterrissage */}
    <path d="M200 106V122M128 106V120" fill="none" stroke={C.grisFonce} strokeWidth="3" />
    <circle cx="200" cy="122" r="6" fill={C.noir} />
    <circle cx="128" cy="120" r="8" fill={C.noir} />
    <path d="M198 122a2 2 0 1 0 4 0a2 2 0 1 0 -4 0ZM125 120a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z" fill={C.grisClair} />
    {/* Empennage en T */}
    <path d="M76 82L42 30H20L36 80Z" fill={C.marine} />
    <path d="M6 24H48L58 32H14Z" fill={shade(C.marine, -0.3)} />
    <path d="M34 58Q39 51 44 58Q49 51 54 58Q49 55.5 44 61Q39 55.5 34 58Z" fill={C.blanc} />
    {/* Fuselage */}
    <path d="M234 100Q226 90 208 85Q198 82 186 82H66L22 78Q14 78 16 84L60 104Q70 108 84 108H206Q226 108 234 100Z" fill={C.blanc} />
    <path d="M36 93H228L232 98H47Z" fill={shade(C.blanc, -0.12)} />
    <path d="M47 98H232L234 100Q226 108 206 108H84Q70 108 60 104Z" fill={C.marine} />
    <rect x="42" y="95" width="187" height="3" fill={METAL.or} />
    {/* Pare-brise et hublots */}
    <path d="M204 86L220 93H206L198 86Z" fill={C.nuit} />
    <path d="M104 89H176" fill="none" stroke={C.nuit} strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 15.9" />
    {/* Réacteur */}
    <rect x="62" y="65" width="46" height="18" rx="9" fill={METAL.argent} />
    <ellipse cx="103" cy="74" rx="4" ry="8" fill={C.nuit} />
    {/* Aile et ailette */}
    <path d="M158 100L98 119H80L124 98Z" fill={C.grisClair} />
    <path d="M80 119L72 102H79L92 119Z" fill={METAL.or} />
  </Svg>
);

/**
 * Identifiants attendus : velo, scooter, citadine, cabriolet, berline, coupe,
 * supercar, hypercar, yacht, jet.
 */
export const VEHICLES: Record<string, Art> = {
  velo,
  scooter,
  citadine,
  cabriolet,
  berline,
  coupe,
  supercar,
  hypercar,
  yacht,
  jet,
};
