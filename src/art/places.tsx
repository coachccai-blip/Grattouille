// Les cinq premiers lieux de la Promenade (BRIEF.md, section 4.2). Les trois suivants : places-2.tsx.
//
// Façade du lieu, vue de face. viewBox 0 0 400 200. Le ciel reste transparent :
// l'écran peint derrière le dégradé du lieu (matin au port, minuit au Cercle).
// Le sol occupe le bas (à partir de y = 170 environ). La façade se lit aussi en
// petit, grisée, quand le lieu est encore fermé : silhouette franche, peu de détails.

import { C, METAL, Svg, shade, type Art } from "./kit";

/** Des petits ronds en un seul tracé : ampoules, oranges, poignées. */
function ronds(r: number, points: [number, number][]): string {
  const d = +(2 * r).toFixed(2);
  return points.map(([x, y]) => `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 ${-d} 0Z`).join("");
}

/** Des étoiles à quatre branches en un seul tracé : [x, y, rayon]. */
function etoiles(points: [number, number, number][]): string {
  return points
    .map(([x, y, r]) => {
      const q = +(r * 0.26).toFixed(2);
      return `M${x} ${y - r}L${x + q} ${y - q}L${x + r} ${y}L${x + q} ${y + q}L${x} ${y + r}L${x - q} ${y + q}L${x - r} ${y}L${x - q} ${y - q}Z`;
    })
    .join("");
}

/** Le Kiosque de Gaspard : le port, les mouettes, le store rayé mimosa et blanc. */
const kiosque: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* La mer et le quai */}
    <rect x="0" y="120" width="400" height="56" fill={C.mer} />
    <path d="M0 134H50L58 130L66 134H170L178 130L186 134H300L308 130L316 134H400V139H0Z" fill={shade(C.mer, 0.25)} />
    <rect x="0" y="172" width="400" height="28" fill={C.pierre} />
    <rect x="0" y="172" width="400" height="6" fill={shade(C.pierre, -0.18)} />
    {/* Une barque */}
    <path d="M40 132H104L96 146H50Z" fill={C.cerise} />
    <rect x="70" y="100" width="4" height="34" fill={C.boisFonce} />
    <path d="M74 102L98 128H74Z" fill={C.blanc} />
    {/* Mouettes */}
    <path d="M300 54Q308 44 316 54Q324 44 332 54Q324 50 316 58Q308 50 300 54Z" fill={C.blanc} />
    <path d="M250 30Q256 22 262 30Q268 22 274 30Q268 27 262 33Q256 27 250 30Z" fill={C.blanc} />
    {/* Le kiosque */}
    <rect x="140" y="92" width="120" height="84" fill={C.persienne} />
    <rect x="220" y="92" width="40" height="84" fill={shade(C.persienne, -0.25)} />
    <rect x="152" y="104" width="96" height="42" fill={C.nuit} />
    <rect x="146" y="146" width="108" height="8" fill={METAL.laiton} />
    {/* Des tickets en vitrine */}
    <rect x="160" y="112" width="18" height="26" rx="2" fill={C.ivoire} />
    <rect x="184" y="112" width="18" height="26" rx="2" fill={C.mimosa} />
    <rect x="208" y="112" width="18" height="26" rx="2" fill={C.bougainvillier} />
    {/* Le store rayé mimosa et blanc */}
    <path d="M124 60H276L290 96H110Z" fill={C.blanc} />
    <path d="M143 60H162L156 96H132ZM181 60H200V96H178ZM219 60H238L246 96H222ZM257 60H276L290 96H268Z" fill={C.mimosa} />
    <path d="M110 96H290V104Q281 110 272 104Q263 110 254 104Q245 110 236 104Q227 110 218 104Q209 110 200 104Q191 110 182 104Q173 110 164 104Q155 110 146 104Q137 110 128 104Q119 110 110 104Z" fill={shade(C.mimosa, -0.18)} />
    {/* Le toit et son fanion */}
    <path d="M150 60L200 34L250 60Z" fill={C.persFonce} />
    <rect x="198" y="14" width="4" height="22" fill={C.nuit} />
    <path d="M202 14L224 20L202 26Z" fill={C.cerise} />
  </Svg>
);

/** Le Grand Café des Arcades : l'après-midi en terrasse, chaises cannées et citronnade. */
const cafe: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* Le trottoir */}
    <rect x="0" y="170" width="400" height="30" fill={C.pierre} />
    <rect x="0" y="170" width="400" height="5" fill={shade(C.pierre, -0.18)} />
    {/* Toit d'ardoise, cheminées, fronton à cartouche de laiton */}
    <path d="M78 34H322L340 60H60Z" fill={C.ardoise} />
    <path d="M102 22H114V40H102ZM284 22H296V40H284ZM300 34H322L340 60H300Z" fill={shade(C.ardoise, -0.2)} />
    <path d="M168 60V46Q168 18 200 18Q232 18 232 46V60Z" fill={C.craie} />
    <ellipse cx="200" cy="40" rx="15" ry="10" fill={METAL.laiton} />
    {/* La façade */}
    <rect x="62" y="60" width="276" height="112" fill={C.craie} />
    <rect x="300" y="60" width="38" height="112" fill={shade(C.craie, -0.1)} />
    <rect x="56" y="57" width="288" height="6" fill={C.blanc} />
    <rect x="58" y="101" width="284" height="4" fill={C.blanc} />
    {/* Fenêtres de l'étage et leurs persiennes */}
    <path d="M111 68H129V96H111ZM191 68H209V96H191ZM271 68H289V96H271Z" fill={C.lagune} />
    <path d="M101 68H110V96H101ZM130 68H139V96H130ZM181 68H190V96H181ZM210 68H219V96H210ZM261 68H270V96H261ZM290 68H299V96H290Z" fill={C.persienne} />
    {/* Les trois arcades et leurs stores corbeille */}
    <path d="M92 172V140A28 28 0 0 1 148 140V172ZM172 172V140A28 28 0 0 1 228 140V172ZM252 172V140A28 28 0 0 1 308 140V172Z" fill={C.lagune} />
    <path d="M179 152H197V172H179ZM203 152H221V172H203Z" fill={C.persFonce} />
    <path d="M92 140A28 28 0 0 1 148 140ZM172 140A28 28 0 0 1 228 140ZM252 140A28 28 0 0 1 308 140Z" fill={C.cerise} />
    <path
      d="M92 140H148V144Q141 149 134 144Q127 149 120 144Q113 149 106 144Q99 149 92 144ZM172 140H228V144Q221 149 214 144Q207 149 200 144Q193 149 186 144Q179 149 172 144ZM252 140H308V144Q301 149 294 144Q287 149 280 144Q273 149 266 144Q259 149 252 144Z"
      fill={shade(C.cerise, -0.25)}
    />
    {/* La terrasse : guéridons, chaises cannées, citronnade */}
    <path
      d="M96 147H98.5V180H96ZM96 164H109V167H96ZM106.5 167H109V180H106.5ZM141.5 147H144V180H141.5ZM131 164H144V167H131ZM131 167H133.5V180H131ZM118.8 161H121.2V178H118.8ZM113 177.5H127V180H113ZM256 147H258.5V180H256ZM256 164H269V167H256ZM266.5 167H269V180H266.5ZM301.5 147H304V180H301.5ZM291 164H304V167H291ZM291 167H293.5V180H291ZM278.8 161H281.2V178H278.8ZM273 177.5H287V180H273Z"
      fill={C.bois}
    />
    <path d="M94.5 147H100V160H94.5ZM140 147H145.5V160H140ZM254.5 147H260V160H254.5ZM300 147H305.5V160H300Z" fill={C.paille} />
    <path d="M108 158H132V161H108ZM268 158H292V161H268Z" fill={C.blanc} />
    <path d="M113 146H121L120 158H114ZM124.5 152H128.5L128 158H125ZM274 152H278L277.5 158H274.5ZM283 152H287L286.5 158H283.5Z" fill={C.mimosa} />
    {/* Deux citronniers en caisse */}
    <path d="M31 160H49V177H31ZM351 160H369V177H351Z" fill={C.persFonce} />
    <path d="M39 146H41V160H39ZM359 146H361V160H359Z" fill={C.bois} />
    <path d={ronds(15, [[42, 136], [362, 136]])} fill={C.persFonce} />
    <path d={ronds(15, [[40, 134], [360, 134]])} fill={C.persienne} />
    <path d={ronds(2.4, [[33, 131], [44, 126], [41, 140], [353, 131], [364, 126], [361, 140]])} fill={C.mimosa} />
  </Svg>
);

/** Le Casino de la Jetée : coucher de soleil sur les pilotis, coupoles et guirlandes d'ampoules. */
const casino: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* Le soleil qui se couche, la mer et ses reflets */}
    <circle cx="72" cy="150" r="28" fill={C.mimosa} />
    <rect x="0" y="160" width="400" height="40" fill={shade(C.marine, -0.2)} />
    <path d="M0 160H400V162.5H0ZM236 174H270V176H236ZM300 186H344V188H300ZM118 190H152V192H118Z" fill={shade(C.marine, 0.2)} />
    <path d="M50 169H94V171.5H50ZM58 176H86V178.5H58ZM65 183H79V185.5H65Z" fill={C.mimosa} />
    {/* La jetée sur pilotis */}
    <path
      d="M-1 152H5V182H-1ZM35 152H41V182H35ZM71 152H77V182H71ZM107 152H113V182H107ZM143 152H149V182H143ZM179 152H185V182H179ZM215 152H221V182H215ZM251 152H257V182H251ZM287 152H293V182H287ZM323 152H329V182H323ZM359 152H365V182H359ZM395 152H401V182H395ZM0 165H400V168H0Z"
      fill={C.bois}
    />
    <rect x="0" y="144" width="400" height="8" fill={C.bois} />
    <rect x="0" y="144" width="400" height="2.5" fill={C.kraft} />
    {/* Le casino : pavillon, tourelles, coupoles vert-de-gris */}
    <path d="M106 86H132V98H160V84H240V98H268V86H294V144H106Z" fill={C.ivoire} />
    <path d="M244 98H268V86H294V144H244Z" fill={shade(C.ivoire, -0.1)} />
    <rect x="128" y="96" width="144" height="4" fill={METAL.laiton} />
    <path d="M160 86Q160 40 200 40Q240 40 240 86ZM103 86Q103 70 119 60Q135 70 135 86ZM265 86Q265 70 281 60Q297 70 297 86Z" fill={C.persClair} />
    <path d="M200 40Q240 40 240 86H224Q224 54 200 40ZM281 60Q297 70 297 86H287Q287 72 281 60Z" fill={shade(C.persClair, -0.22)} />
    <path d="M198 42L200 18L202 42ZM117.6 62L119 46L120.4 62ZM279.6 62L281 46L282.4 62Z" fill={METAL.or} />
    {/* Fenêtres où se reflète le couchant, porte éclairée */}
    <path
      d="M142 136V114A6 6 0 0 1 154 114V136ZM164 136V114A6 6 0 0 1 176 114V136ZM224 136V114A6 6 0 0 1 236 114V136ZM246 136V114A6 6 0 0 1 258 114V136ZM114 128V106A5 5 0 0 1 124 106V128ZM276 128V106A5 5 0 0 1 286 106V128Z"
      fill={C.corail}
    />
    <path d="M184 144V116A16 16 0 0 1 216 116V144Z" fill={C.nuit} />
    <path d="M189 144V117A11 11 0 0 1 211 117V144Z" fill={C.mimosa} />
    {/* Réverbères et guirlandes d'ampoules */}
    <path d="M34.5 100H37.5V144H34.5ZM362.5 100H365.5V144H362.5Z" fill={C.nuit} />
    <path d="M36 96Q78 100 119 46Q156 60 200 18Q244 60 281 46Q322 100 364 96" fill="none" stroke={C.nuit} strokeWidth="1" />
    <path
      d={ronds(2.6, [
        [185.5, 35], [171.4, 44], [157.8, 50], [144.4, 53.2], [131.5, 53.6],
        [105.3, 66.8], [91.6, 79.4], [77.8, 89], [63.9, 95.4], [50, 98.8],
        [214.5, 35], [228.6, 44], [242.2, 50], [255.6, 53.2], [268.5, 53.6],
        [294.7, 66.8], [308.4, 79.4], [322.2, 89], [336.1, 95.4], [350, 98.8],
      ])}
      fill={C.mimosa}
    />
    <path d={ronds(4.5, [[36, 97], [364, 97]])} fill={C.ivoire} />
  </Svg>
);

/** Le Salon Privé : le soir, velours, abat-jour et laiton derrière un cordon. */
const salon: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* Le trottoir et le tapis rouge */}
    <rect x="0" y="170" width="400" height="30" fill={shade(C.pierre, -0.5)} />
    <rect x="0" y="170" width="400" height="5" fill={shade(C.pierre, -0.62)} />
    <path d="M178 170H222L244 200H156Z" fill={C.cerise} />
    {/* Deux lampadaires à abat-jour */}
    <path d="M60.5 98H63.5V171H60.5ZM55 170H69V174H55Z" fill={METAL.laiton} />
    <path d="M336.5 98H339.5V171H336.5ZM331 170H345V174H331Z" fill={METAL.laiton} />
    <path d="M56 80H68L73 98H51ZM332 80H344L349 98H327Z" fill={C.mimosa} />
    {/* La façade de pierre, son fronton, ses boules de laiton */}
    <rect x="96" y="46" width="208" height="126" fill={C.pierre} />
    <rect x="276" y="46" width="28" height="126" fill={shade(C.pierre, -0.14)} />
    <path d="M124 42L200 14L276 42Z" fill={shade(C.pierre, -0.14)} />
    <rect x="88" y="40" width="224" height="8" fill={C.craie} />
    <circle cx="96" cy="34" r="6" fill={METAL.or} />
    <circle cx="304" cy="34" r="6" fill={METAL.or} />
    <ellipse cx="200" cy="30" rx="11" ry="6.5" fill={METAL.or} />
    {/* Deux fenêtres : velours tiré, abat-jour allumé */}
    <path d="M114 88H146V150H114ZM254 88H286V150H254Z" fill={C.bordeaux} />
    <path d="M114 88H129Q127 122 114 138ZM146 88H131Q133 122 146 138ZM254 88H269Q267 122 254 138ZM286 88H271Q273 122 286 138Z" fill={shade(C.bordeaux, -0.35)} />
    <path d="M124 118H136L141 134H119ZM264 118H276L281 134H259Z" fill={C.mimosa} />
    <path d="M128 134H132V146H128ZM123 146H137V150H123ZM268 134H272V146H268ZM263 146H277V150H263Z" fill={METAL.laiton} />
    <path d="M110 150H150V154H110ZM250 150H290V154H250Z" fill={C.craie} />
    {/* La porte laquée sous sa marquise de velours */}
    <rect x="174" y="98" width="52" height="74" fill={C.craie} />
    <rect x="178" y="102" width="44" height="70" fill={C.noir} />
    <path d="M195.5 130H198V146H195.5ZM202 130H204.5V146H202Z" fill={METAL.or} />
    <rect x="230" y="122" width="10" height="13" fill={METAL.laiton} />
    <path d="M148 104Q150 72 200 72Q250 72 252 104Z" fill={C.bordeaux} />
    <path
      d="M148 104H252V112Q245.5 118 239 112Q232.5 118 226 112Q219.5 118 213 112Q206.5 118 200 112Q193.5 118 187 112Q180.5 118 174 112Q167.5 118 161 112Q154.5 118 148 112Z"
      fill={shade(C.bordeaux, -0.3)}
    />
    <rect x="148" y="102.5" width="104" height="3" fill={METAL.laiton} />
    {/* Le cordon de velours entre deux potelets */}
    <path d="M168 154Q200 172 232 154" fill="none" stroke={C.cerise} strokeWidth="3" />
    <path d="M166.5 152H169.5V178H166.5ZM230.5 152H233.5V178H230.5ZM162 177H174V180H162ZM226 177H238V180H226Z" fill={METAL.laiton} />
    <circle cx="168" cy="150" r="3.4" fill={METAL.or} />
    <circle cx="232" cy="150" r="3.4" fill={METAL.or} />
  </Svg>
);

/** Le Cercle des Moustaches : minuit à l'observatoire, étoiles et Art déco. */
const cercle: Art = (props) => (
  <Svg viewBox="0 0 400 200" {...props}>
    {/* La lune et les étoiles */}
    <path d="M70 26A17 17 0 1 0 86 54A14 14 0 1 1 70 26Z" fill={C.ivoire} />
    <path d={etoiles([[274, 14, 8], [28, 86, 4], [120, 44, 4], [140, 84, 3], [336, 56, 5], [304, 96, 3], [372, 112, 3.5], [44, 132, 3]])} fill={C.mimosa} />
    {/* Le parvis */}
    <rect x="0" y="170" width="400" height="30" fill={C.ardoise} />
    <rect x="0" y="170" width="400" height="5" fill={shade(C.ardoise, -0.3)} />
    {/* Les gradins Art déco, coiffés d'or */}
    <path d="M70 128H118V104H158V76H242V104H282V128H330V172H70Z" fill={C.brume} />
    <path d="M230 76H242V172H230ZM272 104H282V172H272ZM320 128H330V172H320Z" fill={shade(C.brume, -0.2)} />
    <path d="M70 128H118V131H70ZM118 104H158V107H118ZM158 76H242V79H158ZM242 104H282V107H242ZM282 128H330V131H282Z" fill={METAL.or} />
    {/* Hautes fenêtres éclairées */}
    <path
      d="M82 138H89V164H82ZM99 138H106V164H99ZM126 114H133V164H126ZM143 114H150V164H143ZM250 114H257V164H250ZM267 114H274V164H267ZM294 138H301V164H294ZM311 138H318V164H311ZM163 90H169V160H163ZM231 90H237V160H231Z"
      fill={C.mimosa}
    />
    {/* La coupole d'argent, sa fente et la lunette de laiton */}
    <rect x="160" y="70" width="80" height="6" fill={shade(C.brume, -0.2)} />
    <path d="M162 70A38 38 0 0 1 238 70Z" fill={METAL.argent} />
    <path d="M204 70V32.2A38 38 0 0 1 216 35.5V70Z" fill={C.nuit} />
    <path d="M207.6 51.6L243.6 15.6L248.4 20.4L212.4 56.4Z" fill={METAL.laiton} />
    <path d="M235.5 21.5L242.5 14.5L249.5 21.5L242.5 28.5Z" fill={METAL.or} />
    {/* L'enseigne : une moustache d'or */}
    <rect x="176" y="83" width="48" height="18" rx="3" fill={C.nuit} />
    <path d="M200 91.5C196.5 87 189.5 86.5 185.5 90C183 92 180.5 91.5 179.5 88.5C179 94.5 183.5 98 189.5 97.2C194.5 96.5 198 94.5 200 93C202 94.5 205.5 96.5 210.5 97.2C216.5 98 221 94.5 220.5 88.5C219.5 91.5 217 92 214.5 90C210.5 86.5 203.5 87 200 91.5Z" fill={METAL.or} />
    {/* La porte et son éventail */}
    <path d="M184 172V120A16 16 0 0 1 216 120V172Z" fill={METAL.or} />
    <path d="M187 172V123H213V172Z" fill={C.nuit} />
    <path d="M200 120V104M200 120L188.7 108.7M200 120L211.3 108.7M200 120L184.6 115M200 120L215.4 115" fill="none" stroke={C.nuit} strokeWidth="1.4" />
    <path d="M176 172H224V176H176ZM168 176H232V180H168Z" fill={C.ecume} />
  </Svg>
);

/** Identifiants attendus : kiosque, cafe, casino, salon, cercle. */
export const PLACE_ART: Record<string, Art> = {
  kiosque,
  cafe,
  casino,
  salon,
  cercle,
};
