// La garde-robe de la Maison Sidonie, suite : 7 tenues et 7 accessoires.
//
// Même contrat que wardrobe.tsx (à lire d'abord) : chaque article est un calque <g>
// dessiné dans le repère de l'avatar (viewBox 0 0 400 480), sans <svg> autour.
// - `tenue` : couvre tout ce qui est sous y = 290. Partir de la silhouette BUSTE et
//   laisser le cou visible ; `clipPath="url(#av-buste)"` découpe un motif aux épaules.
// - `accessoire` : au cou, centré en (200, 290). Une canne ou un sceptre se tient
//   contre l'épaule, dans le cadre.
// `thumb` recadre la vignette de boutique quand le cadrage par défaut ne convient pas.
//
// Identifiants attendus (shared/catalog.ts) :
//   sac-a-patates, cire, peignoir, habit-amiral, hermine, combinaison-spatiale, cape-aurore,
//   ficelle, echarpe, canne, grand-cordon, sceptre, pendentif-lune, collier-planetes.

import { BUSTE, C, METAL, shade } from "./kit";
import type { WardrobeArt } from "./wardrobe";

/** L'ombre du flanc droit, la même pour toutes les tenues (reprise de wardrobe.tsx). */
const OMBRE_FLANC = "M330 372V480H300V340Q330 346 330 372Z";

/**
 * Une rangée de pastilles le long d'un tracé : perles, brillants, pois (reprise de
 * wardrobe.tsx). `pas` est l'écart entre deux centres, `strokeWidth` le diamètre.
 */
function pastilles(pas: number, decalage = 0) {
  return {
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: `0.1 ${(pas - 0.1).toFixed(2)}`,
    strokeDashoffset: decalage ? -decalage : undefined,
  } as const;
}

/** Un éclat à quatre branches, posé en (0, 0). */
const ECLAT = "M0 -9Q1 -1 9 0Q1 1 0 9Q-1 1 -9 0Q-1 -1 0 -9Z";

// ---------------------------------------------------------------------------
// Tenues

const JUTE = "#C2A06C";
/**
 * Le sac retourné : un coin en oreille à chaque épaule, une encolure taillée aux ciseaux,
 * la toile qui blouse au-dessus de la corde.
 */
const SAC =
  "M66 480Q70 468 69 458Q62 430 66 396Q66 356 76 340L58 318Q56 308 67 311L104 320Q112 319 124 319H146" +
  "L150 327L154 322L158 334L162 329L167 340L171 335L176 345L181 340L186 349L191 344L196 350L201 345" +
  "L206 350L211 344L216 349L221 340L226 345L231 335L235 340L240 329L244 334L248 322L251 327L254 319" +
  "H276Q288 319 296 320L333 311Q344 308 342 318L324 340Q334 356 334 396Q338 430 331 458Q330 468 334 480Z";
/** La trame, suggérée par quelques points : un tiret couché, un tiret debout. */
const TRAME =
  "M87 352h10M120 341v10M86 375v10M131 374h10M80 430h10" +
  "M171 372h10M224 363v10M176 431v10M207 436h10" +
  "M265 350h10M300 351v10M258 369v10M301 384h10M314 415v10M268 442h10" +
  "M95 475h10M245 475h10M300 474h10";
/** La corde qui sert de ceinture. */
const CORDE = "M69 456Q200 468 331 456";
/** Ses torons : de petits traits en biais, posés le long de sa courbe. */
function torons(): string {
  let d = "";
  for (let x = 74; x <= 328; x += 9) {
    const t = (x - 69) / 262;
    d += `M${x - 2.5} ${(459.5 + 24 * t * (1 - t)).toFixed(1)}l5 -7`;
  }
  return d;
}
const TORONS = torons();

const sacAPatates: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={SAC} fill={JUTE} />
      <g fill="none" stroke={shade(JUTE, -0.24)} strokeWidth="3" strokeLinecap="round">
        <path d={TRAME} />
        {/* Les fronces, au-dessus de la corde. */}
        <path d="M108 451Q104 441 108 431M150 453Q153 444 150 436M246 453Q250 443 246 434M292 450Q288 441 292 432" strokeWidth="2.5" />
      </g>
      {/* Le marquage au pochoir, un peu de travers. */}
      <path
        d="M0 5Q0 0 6.5 0Q13 0 13 6Q13 11 0 24H13.5M33 0H22L20.5 10Q33 6 33.5 16Q33.5 24 20 23M46 0V24M58 0L46 13M50 9L59 24M78 4Q76 0 71 0Q64 0 64 12Q64 24 71 24Q78 24 78 13H72"
        transform="translate(134 393) rotate(-4) scale(1.15)"
        fill="none"
        stroke={C.brique}
        strokeOpacity="0.6"
        strokeWidth="4.2"
        strokeLinejoin="round"
      />
      {/* Un accroc reprisé à gros points. */}
      <path d="M100 420L126 398" fill="none" stroke={shade(JUTE, -0.34)} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M101.6 411.4l7.2 8.4M109.4 404.8l7.2 8.4M117.2 398.2l7.2 8.4" fill="none" stroke={C.ivoire} strokeWidth="3" strokeLinecap="round" />
      {/* La pièce, son ombre, ses points qui chevauchent le bord. */}
      <g transform="translate(278 410) rotate(7)">
        <rect x="-20.5" y="-16.5" width="46" height="40" rx="2" fill={shade(JUTE, -0.28)} />
        <rect x="-23" y="-20" width="46" height="40" rx="2" fill={C.mer} />
        <path
          d="M-14 -25v10M0 -25v10M14 -25v10M-14 15v10M0 15v10M14 15v10M-28 -10h10M-28 6h10M18 -10h10M18 6h10"
          fill="none"
          stroke={C.ivoire}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      {/* Trois fils qui s'échappent de l'encolure. */}
      <path d="M158 334Q151 327 155 318M206 350Q211 341 205 334M240 329Q248 325 246 316" fill="none" stroke={shade(JUTE, 0.35)} strokeWidth="2" strokeLinecap="round" />
      <path d="M302 334L324 340Q334 356 334 396Q338 430 331 458Q330 468 334 480H302Z" fill={C.noir} fillOpacity="0.14" />
      {/* La corde, son ombre, son nœud et ses deux bouts. */}
      <g fill="none" strokeLinecap="round">
        <path d="M72 460.3Q200 472 328 460.3" stroke={C.noir} strokeOpacity="0.2" strokeWidth="8" strokeLinecap="butt" />
        <path d="M147 465Q141 474 143 482M154 465Q167 467 172 476" stroke={C.sable} strokeWidth="6.5" />
        <path d={CORDE} stroke={C.sable} strokeWidth="8" strokeLinecap="butt" />
        <path d={TORONS} stroke={shade(C.kraft, -0.2)} strokeWidth="2.2" />
      </g>
      <ellipse cx="150" cy="461.5" rx="11" ry="8.5" fill={C.sable} />
      <path d="M144.5 458.5l5 6M151 456.5l5 6" fill="none" stroke={shade(C.kraft, -0.2)} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  ),
};

const CIRE = C.mimosa;
/** Les deux pans du grand col du ciré. */
const COL_CIRE_G = "M160 294L200 346L178 384Q170 390 162 382L112 338Q130 308 160 294Z";
const COL_CIRE_D = "M240 294L200 346L222 384Q230 390 238 382L288 338Q270 308 240 294Z";

const cire: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={BUSTE} fill={CIRE} />
      {/* La doublure marine, dans l'échancrure. */}
      <path d="M174 316H226L200 352Z" fill={C.marine} />
      {/* Le pli du devant : le bord qui recouvre, et son ombre. */}
      <path d="M200 346L209 356V480H200Z" fill={shade(CIRE, -0.2)} />
      {/* Poches à rabat : l'ombre du rabat, le rabat, sa couture, sa pression. */}
      <g fill={shade(CIRE, -0.22)}>
        <path d="M94 445H154V461Q124 469 94 461Z" />
        <path d="M250 445H310V461Q280 469 250 461Z" />
      </g>
      <g fill={CIRE}>
        <path d="M92 440H152V456Q122 464 92 456Z" />
        <path d="M248 440H308V456Q278 464 248 456Z" />
      </g>
      <path d="M92 440H152M248 440H308" fill="none" stroke={shade(CIRE, -0.22)} strokeWidth="2.5" />
      <circle cx="122" cy="451" r="3.5" fill={C.marine} />
      <circle cx="278" cy="451" r="3.5" fill={C.marine} />
      {/* Brandebourgs : une cordelette, deux pattes, une bûchette de bois. */}
      {[408, 452].map((y) => (
        <g key={y}>
          <path d={`M172 ${y}H228`} fill="none" stroke={C.marine} strokeWidth="3" />
          <circle cx="170" cy={y} r="5.5" fill={C.marine} />
          <circle cx="230" cy={y} r="5.5" fill={C.marine} />
          <rect x="188" y={y - 5} width="24" height="10" rx="5" fill={C.boisFonce} />
          <rect x="191" y={y - 3.5} width="12" height="2.5" rx="1.25" fill={shade(C.boisFonce, 0.35)} />
        </g>
      ))}
      {/* Grand col : chaque pan et son ombre. */}
      <g fill={shade(CIRE, -0.22)}>
        <path d={COL_CIRE_G} transform="translate(3 6)" />
        <path d={COL_CIRE_D} transform="translate(4 6)" />
      </g>
      <path d={COL_CIRE_G} fill={CIRE} />
      <path d={COL_CIRE_D} fill={CIRE} />
      {/* Le ciré luit : trois reflets. */}
      <g fill={shade(CIRE, 0.55)}>
        <path d="M82 384Q80 344 108 330Q92 352 94 388Z" />
        <path d="M128 334Q138 316 156 304Q146 318 140 338Z" />
        <path d="M100 396Q96 414 100 432L106 432Q102 414 106 396Z" />
      </g>
      <path d={OMBRE_FLANC} fill={C.noir} fillOpacity="0.14" />
    </g>
  ),
};

/** L'éponge : de petits traits debout, en quinconce. Aucun dans l'ouverture du col. */
function eponge(): string {
  let d = "";
  for (let j = 0; j < 7; j++) {
    const y = 334 + j * 22;
    for (let x = 84 + (j % 2) * 12; x < 322; x += 24) {
      if (y > 400 || x < 168 || x > 232) d += `M${x} ${y}v6`;
    }
  }
  return d;
}
const EPONGE = eponge();
/** Les deux pans du col châle. Celui de gauche croise par-dessus. */
const CHALE_G = "M166 290Q152 292 140 312Q120 348 150 392L186 434L214 430Q194 372 180 330Q172 306 166 290Z";
const CHALE_D = "M234 290Q248 292 260 312Q280 348 250 392L214 434L186 430Q206 372 220 330Q228 306 234 290Z";
/** Les deux pans de la ceinture, sous le nœud. */
const PANS_CEINTURE = "M196 440L188 480H206L210 442ZM210 442L219 480H237L222 438Z";

const peignoir: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le peignoir s'ouvre en pointe sur le poitrail. */}
      <path d="M70 480V372Q70 320 122 320H174Q178 352 206 398Q230 352 226 320H278Q330 320 330 372V480Z" fill={C.blanc} />
      <path d={EPONGE} clipPath="url(#av-buste)" fill="none" stroke="#E3E8ED" strokeWidth="2.8" strokeLinecap="round" />
      {/* Col châle : chaque pan, son ombre, son passepoil d'or. */}
      <path d={CHALE_D} transform="translate(4 6)" fill={C.noir} fillOpacity="0.13" />
      <path d={CHALE_D} fill={C.blanc} />
      <path d={CHALE_G} transform="translate(4 6)" fill={C.noir} fillOpacity="0.13" />
      <path d={CHALE_G} fill={C.blanc} />
      <path d="M140 312Q120 348 150 392L186 434" fill="none" stroke={METAL.or} strokeWidth="3" strokeLinecap="round" />
      <path d="M260 312Q280 348 250 392L214 434" fill="none" stroke={METAL.or} strokeWidth="3" strokeLinecap="round" />
      {/* Ceinture à deux filets d'or, ses pans, son nœud. */}
      <path d="M70 440Q200 452 330 440V446Q200 458 70 446Z" fill={C.noir} fillOpacity="0.13" />
      <path d="M70 416Q200 428 330 416V440Q200 452 70 440Z" fill={C.blanc} />
      <path d="M70 420.5Q200 432.5 330 420.5M70 435.5Q200 447.5 330 435.5" fill="none" stroke={METAL.or} strokeWidth="2" />
      <path d={PANS_CEINTURE} transform="translate(3 3)" fill={C.noir} fillOpacity="0.16" />
      <path d={PANS_CEINTURE} fill={C.blanc} />
      <rect x="-15" y="-11" width="30" height="22" rx="10" transform="translate(212 437) rotate(-12)" fill={C.noir} fillOpacity="0.16" />
      <rect x="-15" y="-11" width="30" height="22" rx="10" transform="translate(209 433) rotate(-12)" fill={C.blanc} />
      <path d="M202 428Q212 431 215 441" fill="none" stroke={C.grisClair} strokeWidth="2.5" strokeLinecap="round" />
      <path d={OMBRE_FLANC} fill={C.noir} fillOpacity="0.12" />
      {/* L'écusson du palace, brodé d'or : couronne, écu, lauriers. */}
      <g transform="translate(290 388)">
        <path d="M-15 -4Q-18 12 -3 20M15 -4Q18 12 3 20" stroke={METAL.or} strokeWidth="4" {...pastilles(6)} />
        <path d="M-10 -9H10V3Q10 13 0 17Q-10 13 -10 3Z" fill={METAL.or} />
        <path d="M0 -4L4 3L0 10L-4 3Z" fill={C.blanc} />
        <path d="M-9 -12V-20L-4.5 -15L0 -22L4.5 -15L9 -20V-12Z" fill={METAL.or} />
      </g>
    </g>
  ),
};

const DRAP_AMIRAL = C.marine;
/** Les torsades d'une épaulette : neuf brins qui pendent. */
const TORSADES_G = "M66 334v20M73 339v19M80 343v18M87 345v18M94 346v18M101 346v18M108 345v17M115 342v17M122 338v16";
const TORSADES_D = "M334 334v20M327 339v19M320 343v18M313 345v18M306 346v18M299 346v18M292 345v17M285 342v17M278 338v16";

const habitAmiral: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={BUSTE} fill={DRAP_AMIRAL} />
      {/* Plastron boutonné, liseré d'or. */}
      <path d="M150 322Q200 352 250 322L240 480H160Z" fill={shade(DRAP_AMIRAL, -0.3)} />
      <path d="M150 324L160 480M250 324L240 480" fill="none" stroke={METAL.or} strokeWidth="2.5" />
      <g fill={METAL.or}>
        <circle cx="176" cy="368" r="6" />
        <circle cx="178" cy="400" r="6" />
        <circle cx="180" cy="432" r="6" />
        <circle cx="182" cy="464" r="6" />
        <circle cx="224" cy="368" r="6" />
        <circle cx="222" cy="400" r="6" />
        <circle cx="220" cy="432" r="6" />
        <circle cx="218" cy="464" r="6" />
      </g>
      {/* Col droit, galonné et brodé. */}
      <path d="M158 290Q200 322 242 290L248 322Q200 352 152 322Z" fill={shade(DRAP_AMIRAL, -0.3)} />
      <path d="M158 292Q200 324 242 292M153 320Q200 350 247 320" fill="none" stroke={METAL.or} strokeWidth="3.5" />
      <path d="M156 306Q200 337 244 306" stroke={METAL.or} strokeWidth="5" {...pastilles(9)} />
      <path d={OMBRE_FLANC} fill={C.noir} fillOpacity="0.3" />
      {/* Épaulettes à torsades : l'ombre des brins, les brins, la patte, le croissant. */}
      <g fill="none" strokeWidth="5.5" strokeLinecap="round">
        <path d={TORSADES_G} transform="translate(2.5 3)" stroke={C.noir} strokeOpacity="0.3" />
        <path d={TORSADES_D} transform="translate(2.5 3)" stroke={C.noir} strokeOpacity="0.3" />
        <path d={TORSADES_G} stroke={METAL.or} />
        <path d={TORSADES_D} stroke={METAL.or} />
      </g>
      <g fill={METAL.or}>
        <path d="M110 320L154 315L156 327L118 337Z" />
        <ellipse cx="94" cy="331" rx="32" ry="13" />
        <path d="M290 320L246 315L244 327L282 337Z" />
        <ellipse cx="306" cy="331" rx="32" ry="13" />
      </g>
      <path d="M65 329Q72 319 94 318.5Q116 319 124 325M335 329Q328 319 306 318.5Q284 319 276 325" fill="none" stroke={C.blanc} strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
      <g fill={C.blanc}>
        <path d={ECLAT} transform="translate(84 331) scale(0.55)" />
        <path d={ECLAT} transform="translate(104 331) scale(0.55)" />
        <path d={ECLAT} transform="translate(296 331) scale(0.55)" />
        <path d={ECLAT} transform="translate(316 331) scale(0.55)" />
      </g>
      {/* Deux décorations : une croix d'or, une médaille d'argent. */}
      <rect x="262" y="374" width="16" height="18" fill={C.cerise} />
      <rect x="268" y="374" width="4" height="18" fill={C.blanc} />
      <rect x="284" y="374" width="16" height="18" fill={C.azur} />
      <path d="M287 374h2.5v18h-2.5ZM294.5 374h2.5v18h-2.5Z" fill={C.blanc} />
      <path d="M-3 -10H3L2 -2L10 -3V3L2 2L3 10H-3L-2 2L-10 3V-3L-2 -2Z" transform="translate(270 402)" fill={METAL.or} />
      <circle cx="270" cy="402" r="2.5" fill={C.cerise} />
      <circle cx="292" cy="402" r="8.5" fill={METAL.argent} />
      <path d={ECLAT} transform="translate(292 402) scale(0.5)" fill={C.blanc} />
    </g>
  ),
};

/** Des mouchetures d'hermine : une petite queue noire par point. */
function mouchetures(points: readonly (readonly [number, number])[]): string {
  return points.map(([x, y]) => `M${x} ${y - 7}q4 7 3 14l-3 -3l-3 3q-1 -7 3 -14z`).join("");
}
const POURPRE = shade(C.cerise, -0.3);
/** Les deux pans du grand col d'hermine, puis les deux bords du devant. */
const COL_HERMINE_G = "M160 290Q146 292 132 308Q98 348 132 388Q160 416 196 428L204 410Q184 372 176 336Q170 310 160 290Z";
const COL_HERMINE_D = "M240 290Q254 292 268 308Q302 348 268 388Q240 416 204 428L196 410Q216 372 224 336Q230 310 240 290Z";
const BORD_HERMINE_G = "M148 400L204 418L178 480H126Z";
const BORD_HERMINE_D = "M252 400L196 418L222 480H274Z";
const MOUCHETURES_MANTEAU = mouchetures([
  [86, 362], [62, 404], [98, 410], [72, 450], [112, 452], [50, 468],
  [314, 362], [338, 404], [302, 410], [328, 450], [288, 452], [350, 468],
]);
const MOUCHETURES_COL = mouchetures([
  [146, 318], [126, 346], [146, 378], [172, 402], [166, 444], [152, 470],
  [254, 318], [274, 346], [254, 378], [228, 402], [234, 444], [248, 470],
]);

const hermine: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le manteau, tout d'hermine, plus large que les épaules. */}
      <path d="M42 480Q38 384 72 338Q114 306 160 306H168Q200 326 232 306H240Q286 306 328 338Q362 384 358 480Z" fill={C.blanc} />
      <path d="M358 480Q362 384 328 338Q336 400 330 480Z" fill={C.noir} fillOpacity="0.14" />
      <path d={MOUCHETURES_MANTEAU} fill={C.noir} />
      {/* La robe de velours pourpre, son col d'or, un losange pour le velours. */}
      <path d="M168 312Q200 332 232 312L250 480H150Z" fill={POURPRE} />
      <path d="M200 441l7 10-7 10-7-10Z" fill={C.blanc} fillOpacity="0.22" />
      <path d="M168 306Q200 326 232 306V316Q200 338 168 316Z" fill={METAL.or} />
      {/* Les bords du devant, puis le grand col : chaque pièce et son ombre. */}
      <g fill={C.noir} fillOpacity="0.2">
        <path d={BORD_HERMINE_G} transform="translate(4 6)" />
        <path d={BORD_HERMINE_D} transform="translate(4 6)" />
      </g>
      <path d={BORD_HERMINE_G} fill={C.blanc} />
      <path d={BORD_HERMINE_D} fill={C.blanc} />
      <path d={COL_HERMINE_D} transform="translate(4 7)" fill={C.noir} fillOpacity="0.2" />
      <path d={COL_HERMINE_D} fill={C.blanc} />
      <path d={COL_HERMINE_G} transform="translate(4 7)" fill={C.noir} fillOpacity="0.2" />
      <path d={COL_HERMINE_G} fill={C.blanc} />
      <path d={MOUCHETURES_COL} fill={C.noir} />
      {/* Fermail : deux bossettes d'or à rubis, une chaîne, une perle en goutte. */}
      <path d="M171 356Q200 384 229 356" fill="none" stroke={METAL.or} strokeWidth="3.5" strokeDasharray="6 3" />
      <path d="M200 373L207.5 386Q207.5 394 200 395Q192.5 394 192.5 386Z" fill={C.blanc} />
      <path d="M200 373L207.5 386Q207.5 394 200 395Z" fill={C.grisClair} />
      <circle cx="200" cy="371" r="3.5" fill={METAL.or} />
      <circle cx="164" cy="352" r="9.5" fill={METAL.or} />
      <circle cx="236" cy="352" r="9.5" fill={METAL.or} />
      <circle cx="164" cy="352" r="4.5" fill={C.cerise} />
      <circle cx="236" cy="352" r="4.5" fill={C.cerise} />
      <circle cx="162.5" cy="350.5" r="1.6" fill={C.blanc} />
      <circle cx="234.5" cy="350.5" r="1.6" fill={C.blanc} />
    </g>
  ),
  thumb: "30 266 340 214",
};

const combinaisonSpatiale: WardrobeArt = {
  Layer: () => (
    <g>
      <path d={BUSTE} fill={C.blanc} />
      {/* Soufflets des épaules : trois plis et le jonc du bras. */}
      <g clipPath="url(#av-buste)" fill="none" stroke={C.grisClair} strokeWidth="6">
        <path d="M132 316Q112 354 126 406M116 316Q96 354 110 406M100 316Q80 354 94 406M66 410H128" />
        <path d="M268 316Q288 354 274 406M284 316Q304 354 290 406M300 316Q320 354 306 406M334 410H272" />
      </g>
      <path d="M200 336V380" fill="none" stroke={C.grisClair} strokeWidth="2.5" />
      {/* Ceinture de verrouillage. */}
      <path d="M70 466H330V480H70Z" fill={METAL.chrome} />
      {/* Prises d'air : une bleue, une rouge. */}
      <circle cx="118" cy="440" r="10" fill={METAL.argent} />
      <circle cx="118" cy="440" r="6" fill={C.azur} />
      <circle cx="282" cy="440" r="10" fill={METAL.argent} />
      <circle cx="282" cy="440" r="6" fill={C.cerise} />
      {/* Pupitre de poitrine : écran, molette, boutons. */}
      <rect x="167" y="384" width="72" height="46" rx="6" fill={C.noir} fillOpacity="0.18" />
      <rect x="164" y="380" width="72" height="46" rx="6" fill={C.grisClair} />
      <rect x="170" y="386" width="34" height="17" rx="2" fill={C.marine} />
      <path d="M174 397l5 -5l4 7l5 -9l4 5h8" fill="none" stroke={C.mimosa} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="220" cy="394.5" r="8" fill={C.blanc} />
      <path d="M220 394.5L224 389.5" fill="none" stroke={C.grisFonce} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="176" cy="414" r="5" fill={C.cerise} />
      <circle cx="192" cy="414" r="5" fill={C.mimosa} />
      <circle cx="208" cy="414" r="5" fill={C.azur} />
      <rect x="218" y="410" width="12" height="8" rx="2" fill={C.grisFonce} />
      {/* Drapeau et écusson de mission. */}
      <rect x="138.5" y="350.5" width="29" height="19" rx="2" fill={C.grisClair} />
      <rect x="140" y="352" width="9" height="16" fill={C.marine} />
      <rect x="149" y="352" width="8.5" height="16" fill={C.blanc} />
      <rect x="157.5" y="352" width="8.5" height="16" fill={C.cerise} />
      <circle cx="258" cy="364" r="16" fill={METAL.or} />
      <circle cx="258" cy="364" r="13" fill={C.marine} />
      <ellipse cx="258" cy="364" rx="10.5" ry="4" transform="rotate(-25 258 364)" fill="none" stroke={C.cerise} strokeWidth="2" />
      <path d={ECLAT} transform="translate(258 364) scale(0.75)" fill={C.blanc} />
      {/* L'anneau du col : le dedans, la paroi, le dessus, les verrous. */}
      <path d="M168 297.7A46 13 0 0 0 154 307A46 13 0 0 0 168 316.3ZM232 297.7A46 13 0 0 1 246 307A46 13 0 0 1 232 316.3Z" fill={C.grisFonce} />
      <path d="M142 307A58 19 0 0 0 258 307V321A58 19 0 0 1 142 321Z" fill={METAL.chrome} />
      <path
        d="M142 307A58 19 0 0 0 258 307A58 19 0 0 0 232 291.2V297.7A46 13 0 0 1 246 307A46 13 0 0 1 154 307A46 13 0 0 1 168 297.7V291.2A58 19 0 0 0 142 307Z"
        fill={METAL.argent}
      />
      <circle cx="162.7" cy="328.6" r="2.6" fill={C.grisFonce} />
      <circle cx="237.3" cy="328.6" r="2.6" fill={C.grisFonce} />
      <rect x="194" y="329" width="12" height="8" rx="2" fill={C.cerise} />
      <path d={OMBRE_FLANC} fill={C.noir} fillOpacity="0.12" />
    </g>
  ),
};

const NUIT_BOREALE = "#1B2452";
const AURORE_VERT = C.persClair;
const AURORE_CLAIR = "#B9F3D0";
const AURORE_TURQUOISE = "#39B7C6";
const AURORE_VIOLET = "#8466C9";

/** Une lisière entre deux voiles : son abscisse en haut (y = 336), au pied (y = 480), et son déhanché. */
type Lisiere = readonly [haut: number, pied: number, s: number];
const LISIERES: readonly Lisiere[] = [
  [94, 66, 18], [114, 92, 34], [138, 122, 20], [158, 146, 36], [182, 176, 22], [204, 204, 30],
  [224, 228, 16], [246, 256, 32], [266, 280, 20], [288, 308, 34], [308, 336, 22],
];
/** Les dix voiles, de gauche à droite. Les deux bords de la cape restent violets. */
const COULEURS_VOILES = [
  AURORE_TURQUOISE, AURORE_VERT, AURORE_CLAIR, AURORE_VERT, AURORE_TURQUOISE,
  AURORE_VIOLET, AURORE_TURQUOISE, AURORE_VERT, AURORE_CLAIR, AURORE_VERT,
];
/**
 * Un voile d'aurore : la bande qui ondule entre deux lisières, du haut de la cape à son
 * pied. Elle déborde de `d` sous la suivante, pour ne laisser aucun jour.
 */
function voile([ah, ap, sa]: Lisiere, [bh, bp, sb]: Lisiere, d: number): string {
  return `M${ah} 336C${ah + sa} 388 ${ap - sa} 434 ${ap} 480H${bp + d}C${bp + d - sb} 434 ${bh + d + sb} 388 ${bh + d} 336Z`;
}
const VOILES: readonly (readonly [string, string])[] = COULEURS_VOILES.map((couleur, i) => {
  const gauche = LISIERES[i] as Lisiere;
  const droite = LISIERES[i + 1] as Lisiere;
  return [voile(gauche, droite, i < COULEURS_VOILES.length - 1 ? 2 : 0), couleur] as const;
});
/** Le ciel au-dessus de l'aurore : du col jusqu'à une lisière qui ondule. Deux profondeurs. */
const CIEL_HAUT = "M76 334Q118 308 200 308Q282 308 324 334C314 352 296 374 264 372C232 370 222 346 192 346C162 346 150 364 124 362C100 360 88 346 76 334Z";
const CIEL_BAS = "M76 334Q118 308 200 308Q282 308 324 334C322 352 316 366 300 368C276 372 266 404 240 404C212 404 200 372 172 372C144 372 136 394 110 392C88 390 80 356 76 334Z";
/** Une étoile à cinq branches, posée en (0, 0). */
const ETOILE_5 = "M0 -15L3.7 -5.1L14.3 -4.6L6 1.9L8.8 12.1L0 6.3L-8.8 12.1L-6 1.9L-14.3 -4.6L-3.7 -5.1Z";

const capeAurore: WardrobeArt = {
  Layer: () => (
    <g>
      {/* La cape, plus large que les épaules : ses bords sont les deux voiles violets. */}
      <path d="M44 480Q40 380 76 334Q118 308 200 308Q282 308 324 334Q360 380 356 480Z" fill={AURORE_VIOLET} />
      {VOILES.map(([d, couleur]) => (
        <path key={d} d={d} fill={couleur} />
      ))}
      <path d="M356 480Q360 380 324 334Q334 400 328 480Z" fill={C.noir} fillOpacity="0.18" />
      {/* La nuit descend sur les voiles : une première épaisseur les éteint, la seconde les couvre. */}
      <path d={CIEL_BAS} fill={NUIT_BOREALE} fillOpacity="0.5" />
      <path d={CIEL_HAUT} fill={NUIT_BOREALE} />
      {/* Quelques étoiles. */}
      <g fill={C.blanc}>
        <circle cx="112" cy="338" r="2" />
        <circle cx="134" cy="328" r="1.6" />
        <circle cx="148" cy="346" r="1.8" />
        <circle cx="168" cy="326" r="2" />
        <circle cx="232" cy="330" r="1.8" />
        <circle cx="250" cy="350" r="2.2" />
        <circle cx="274" cy="330" r="1.6" />
        <circle cx="294" cy="346" r="2" />
        <path d={ECLAT} transform="translate(178 340) scale(0.55)" />
        <path d={ECLAT} transform="translate(270 356) scale(0.7)" />
        <path d={ECLAT} transform="translate(150 424) scale(0.7)" />
        <path d={ECLAT} transform="translate(238 452) scale(0.6)" />
        <path d={ECLAT} transform="translate(302 414) scale(0.5)" />
      </g>
      {/* Liseré d'or à l'encolure, agrafe en étoile. */}
      <path d="M150 311Q200 301 250 311" fill="none" stroke={METAL.or} strokeWidth="4" strokeLinecap="round" />
      <path d={ETOILE_5} transform="translate(202 326) scale(1.15)" fill={C.noir} fillOpacity="0.3" />
      <path d={ETOILE_5} transform="translate(200 323) scale(1.15)" fill={METAL.or} />
      <circle cx="200" cy="323" r="4" fill={C.blanc} />
    </g>
  ),
  thumb: "30 266 340 214",
};

// ---------------------------------------------------------------------------
// Accessoires

const CHANVRE = C.sable;
/** La ficelle : le tour de cou, la boucle ratée, le grand bout, le petit bout. */
const FICELLE = "M166 284Q200 304 234 284M197 297Q170 274 173 296Q177 311 197 301M199 301Q191 338 199 366Q203 380 196 392M203 300Q223 314 219 342";

const ficelle: WardrobeArt = {
  Layer: () => (
    <g fill="none">
      <path d={FICELLE} transform="translate(1.5 3)" stroke={C.noir} strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round" />
      {/* Deux bouts qui s'effilochent. */}
      <path d="M196 392l-5 9M196 392l0 11M196 392l5 9M219 342l-4 8M219 342l1 10M219 342l6 7" stroke={CHANVRE} strokeWidth="2" strokeLinecap="round" />
      {/* Ficelle de boucher : un brin écru, un brin rouge. */}
      <path d={FICELLE} stroke={CHANVRE} strokeWidth="5" strokeLinecap="round" />
      <path d={FICELLE} stroke={C.cerise} strokeWidth="5" strokeDasharray="3 6" />
      {/* Le nœud, fait à la va-vite. */}
      <ellipse cx="200" cy="298" rx="7" ry="6.5" fill={CHANVRE} />
      <path d="M196 295l4 5M201 294l4 5" stroke={C.cerise} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  thumb: "125 262 150 148",
};

const LAINE = C.azur;
/** L'écharpe : le tour de cou, puis le pan qui pend. */
const TOUR_ECHARPE = "M150 276Q200 266 250 276Q256 290 250 304Q200 318 150 304Q144 290 150 276Z";
const PAN_ECHARPE = "M224 290L231 392";
/** Une rayure du tour de cou, de x = a à x = b : elle suit son bombé, en haut comme en bas. */
function rayure(a: number, b: number): string {
  const haut = (x: number) => (276 - 20 * ((x - 150) / 100) * (1 - (x - 150) / 100)).toFixed(1);
  const bas = (x: number) => (304 + 28 * ((x - 150) / 100) * (1 - (x - 150) / 100)).toFixed(1);
  return `M${a} ${haut(a)}L${b} ${haut(b)}V${bas(b)}L${a} ${bas(a)}Z`;
}
const RAYURES_IVOIRE = rayure(166, 174) + rayure(196, 204) + rayure(226, 234);
const RAYURES_CORAIL = rayure(153, 157) + rayure(183, 187) + rayure(213, 217) + rayure(243, 247);

const echarpe: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le pan : franges, laine, rayures, côtes du tricot. */}
      <g fill="none">
        <path d="M211.6 401.3L251.5 398.6" stroke={LAINE} strokeWidth="16" strokeDasharray="4 3.3" />
        <path d={PAN_ECHARPE} stroke={LAINE} strokeWidth="40" />
        <path d={PAN_ECHARPE} stroke={C.ivoire} strokeWidth="40" strokeDasharray="8 22" strokeDashoffset="-26" />
        <path d={PAN_ECHARPE} stroke={C.corail} strokeWidth="40" strokeDasharray="4 26" strokeDashoffset="-41" />
        <path d="M216.5 312.5L222 392.6M234.5 311.3L240 391.4" stroke={C.noir} strokeOpacity="0.1" strokeWidth="2.5" />
      </g>
      {/* Le tour de cou, bien rembourré, et son ombre. */}
      <path d={TOUR_ECHARPE} transform="translate(2 5)" fill={C.noir} fillOpacity="0.2" />
      <path d={TOUR_ECHARPE} fill={LAINE} />
      <path d={RAYURES_IVOIRE} fill={C.ivoire} />
      <path d={RAYURES_CORAIL} fill={C.corail} />
      <path d="M152 284Q200 276 248 284M152 297Q200 307 248 297" fill="none" stroke={C.noir} strokeOpacity="0.1" strokeWidth="2.5" />
    </g>
  ),
  thumb: "118 250 166 162",
};

const BOIS_CANNE = shade(C.boisFonce, -0.2);

const canne: WardrobeArt = {
  Layer: () => (
    <g>
      {/* La dragonne : un cordon et son gland, qui pendent droit. */}
      <path d="M318 268Q305 274 306 292" fill="none" stroke={C.noir} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M302.5 296H309.5L311.5 314H300.5Z" fill={C.bordeaux} />
      <circle cx="306" cy="294" r="4" fill={shade(C.bordeaux, -0.3)} />
      <g transform="translate(330 246) rotate(11.9)">
        {/* Le fût de bois sombre et son reflet. */}
        <path d="M-6 22H6L4.5 270H-4.5Z" fill={BOIS_CANNE} />
        <path d="M-4 32H-1.5L-1 270H-3Z" fill={shade(BOIS_CANNE, 0.3)} />
        {/* La virole gravée, puis le pommeau d'argent. */}
        <path d="M-7.5 16H7.5V32H-7.5Z" fill={METAL.argent} />
        <path d="M-7.5 21.5H7.5M-7.5 26.5H7.5" fill="none" stroke={C.grisFonce} strokeOpacity="0.6" strokeWidth="1.5" />
        <path d="M-5 9H5L7.5 17H-7.5Z" fill={METAL.argent} />
        <ellipse cx="0" cy="0" rx="17" ry="15.5" fill={METAL.argent} />
        <path d="M14.7 -7.8A17 15.5 0 0 1 -8.5 13.4A25 23 0 0 0 14.7 -7.8Z" fill={C.noir} fillOpacity="0.2" />
        <ellipse cx="-6" cy="-6" rx="5.5" ry="3.5" transform="rotate(-35 -6 -6)" fill={C.blanc} fillOpacity="0.9" />
      </g>
    </g>
  ),
  thumb: "226 222 170 258",
};

/** Une onde de moire le long du cordon, à la hauteur `y` de son repère. */
function moire(y: number): string {
  let d = `M-30 ${y}q9 -6 18 0`;
  for (let i = 0; i < 17; i++) d += "t18 0";
  return d;
}
/** La plaque : une étoile à huit branches, posée en (0, 0). */
const ETOILE_8 = "M34 0L14.8 6.1L24 24L6.1 14.8L0 34L-6.1 14.8L-24 24L-14.8 6.1L-34 0L-14.8 -6.1L-24 -24L-6.1 -14.8L0 -34L6.1 -14.8L24 -24L14.8 -6.1Z";

const grandCordon: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Le cordon : de l'épaule à la hanche, découpé par le buste. */}
      <g clipPath="url(#av-buste)">
        <g transform="translate(112 318) rotate(35.9)">
          <rect x="-70" y="24" width="380" height="5" fill={C.noir} fillOpacity="0.2" />
          <rect x="-70" y="-24" width="380" height="48" fill={C.cerise} />
          {/* La moire : trois ondes. */}
          <g fill="none" stroke={shade(C.cerise, 0.24)} strokeWidth="2.5">
            <path d={moire(-11)} />
            <path d={moire(1)} />
            <path d={moire(13)} />
          </g>
          <path d="M-70 -24H310V-19.5H-70ZM-70 19.5H310V24H-70Z" fill={shade(C.cerise, -0.25)} />
          <rect x="236" y="-24" width="80" height="48" fill={C.noir} fillOpacity="0.2" />
        </g>
      </g>
      {/* La plaque de grand-croix : rayons d'argent, étoile d'or, homard d'émail. */}
      <g transform="translate(226 402) scale(1.15)">
        <path d={ETOILE_8} transform="translate(3 4)" fill={C.noir} fillOpacity="0.25" />
        <path d={ETOILE_8} transform="rotate(22.5) scale(0.9)" fill={METAL.argent} />
        <path d={ETOILE_8} fill={METAL.or} />
        <circle r="16" fill={METAL.or} />
        <circle r="13.5" fill={C.ivoire} />
        <g fill={C.cerise}>
          <ellipse cx="0" cy="-1.5" rx="3.4" ry="5.2" />
          <path d="M-2.8 2.5H2.8L1.8 8L4.4 11.6H-4.4L-1.8 8Z" />
          <ellipse cx="-7.6" cy="-8.4" rx="2.7" ry="3.8" transform="rotate(-28 -7.6 -8.4)" />
          <ellipse cx="7.6" cy="-8.4" rx="2.7" ry="3.8" transform="rotate(28 7.6 -8.4)" />
        </g>
        <path
          d="M-2.6 -4L-6.6 -6.5M2.6 -4L6.6 -6.5M-1 -6.4L-2.6 -12M1 -6.4L2.6 -12M-3.2 -0.5H-7M-3.2 2L-6.8 3.4M3.2 -0.5H7M3.2 2L6.8 3.4"
          fill="none"
          stroke={C.cerise}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d={ECLAT} transform="translate(-20 -22) scale(0.6)" fill={C.blanc} />
      </g>
    </g>
  ),
  thumb: "50 262 300 218",
};

const sceptre: WardrobeArt = {
  Layer: () => (
    <g transform="translate(90 244) rotate(-10.2) scale(1.12)">
      {/* La hampe d'or et son filet de lumière. */}
      <path d="M-5 30H5L4 270H-4Z" fill={METAL.or} />
      <path d="M-3.4 36H-1.6L-1.4 268H-2.8Z" fill={C.blanc} fillOpacity="0.5" />
      {/* Trois nœuds sertis : rubis, saphir, émeraude. */}
      <g fill={METAL.or}>
        <rect x="-9" y="56" width="18" height="13" rx="5" />
        <rect x="-9" y="112" width="18" height="13" rx="5" />
        <rect x="-9" y="168" width="18" height="13" rx="5" />
      </g>
      <circle cx="0" cy="62.5" r="4.2" fill={C.cerise} />
      <circle cx="0" cy="118.5" r="4.2" fill={C.azur} />
      <circle cx="0" cy="174.5" r="4.2" fill={C.persienne} />
      <g fill={C.blanc} fillOpacity="0.7">
        <circle cx="-1.3" cy="61.2" r="1.4" />
        <circle cx="-1.3" cy="117.2" r="1.4" />
        <circle cx="-1.3" cy="173.2" r="1.4" />
      </g>
      {/* Le calice qui porte le globe. */}
      <path d="M-11 15H11L6.5 27H-6.5Z" fill={METAL.or} />
      <rect x="-8.5" y="26" width="17" height="7" rx="3.5" fill={METAL.or} />
      {/* Le globe, son ombre, ses cercles sertis, sa croix. */}
      <path d="M-3 -39H3V-33H9V-27H3V-17H-3V-27H-9V-33H-3Z" fill={METAL.or} />
      <circle r="18" fill={METAL.or} />
      <path d="M15.6 -9A18 18 0 0 1 -9 15.6A27 27 0 0 0 15.6 -9Z" fill={C.noir} fillOpacity="0.2" />
      <path d="M-17.5 2Q0 11 17.5 2M0 -18V6" fill="none" stroke={C.mimosaFonce} strokeWidth="5" />
      <path d="M-15 3.8Q0 10.5 15 3.8" stroke={C.blanc} strokeWidth="3" {...pastilles(7.4)} />
      <circle cx="0" cy="6.6" r="4.6" fill={C.cerise} />
      <circle cx="-1.4" cy="5.2" r="1.5" fill={C.blanc} fillOpacity="0.8" />
      <ellipse cx="-7.5" cy="-8.5" rx="5" ry="3" transform="rotate(-38 -7.5 -8.5)" fill={C.blanc} fillOpacity="0.75" />
      <path d={ECLAT} transform="translate(-21 -15) scale(0.7)" fill={C.blanc} />
    </g>
  ),
  thumb: "8 194 196 286",
};

const PIERRE_DE_LUNE = "#D2E7F5";

const pendentifLune: WardrobeArt = {
  Layer: () => (
    <g>
      {/* Chaîne fine et bélière d'argent. */}
      <path d="M168 263Q175 298 200 312Q225 298 232 263" fill="none" stroke={METAL.argent} strokeWidth="2.5" strokeDasharray="4 2" />
      <circle cx="200" cy="316.5" r="5" fill="none" stroke={METAL.argent} strokeWidth="3" />
      {/* La lueur : deux anneaux translucides. */}
      <circle cx="200" cy="348" r="40" fill={C.ciel} fillOpacity="0.2" />
      <circle cx="200" cy="348" r="32" fill={C.ciel} fillOpacity="0.3" />
      {/* La pierre : laiteuse, une ombre lilas, un croissant de lumière. */}
      <circle cx="200" cy="348" r="23" fill={PIERRE_DE_LUNE} />
      <path d="M219.9 336.5A23 23 0 0 1 188.5 367.9A34.5 34.5 0 0 0 219.9 336.5Z" fill={C.lilas} fillOpacity="0.7" />
      <ellipse cx="196" cy="344" rx="13" ry="11" fill={C.blanc} fillOpacity="0.45" />
      <path d="M185.3 356.5A17 17 0 0 1 205.8 332A28 28 0 0 0 185.3 356.5Z" fill={C.blanc} />
      {/* Serti d'argent. */}
      <circle cx="200" cy="348" r="23" fill="none" stroke={METAL.argent} strokeWidth="3.5" />
      <g fill={C.blanc}>
        <path d={ECLAT} transform="translate(229 328) scale(0.8)" />
        <path d={ECLAT} transform="translate(172 372) scale(0.5)" />
      </g>
    </g>
  ),
  thumb: "116 258 168 136",
};

/** L'ombre d'un astre : un croissant en bas à droite du disque de centre (x, y) et de rayon r. */
function croissant(x: number, y: number, r: number): string {
  const x1 = (x + r * 0.866).toFixed(1);
  const y1 = (y - r * 0.5).toFixed(1);
  const x2 = (x - r * 0.5).toFixed(1);
  const y2 = (y + r * 0.866).toFixed(1);
  const R = r * 1.5;
  return `M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}A${R} ${R} 0 0 0 ${x1} ${y1}Z`;
}
/** Une bande de nuages : la tranche du disque (x, y, r) entre deux hauteurs comptées du centre. */
function bande(x: number, y: number, r: number, h1: number, h2: number): string {
  const w1 = Math.sqrt(r * r - h1 * h1);
  const w2 = Math.sqrt(r * r - h2 * h2);
  return `M${(x - w1).toFixed(1)} ${y + h1}A${r} ${r} 0 0 0 ${(x - w2).toFixed(1)} ${y + h2}H${(x + w2).toFixed(1)}A${r} ${r} 0 0 0 ${(x + w1).toFixed(1)} ${y + h1}Z`;
}
/** Les sept planètes du collier : x, y, rayon, couleur. La plus grosse au milieu. */
const PLANETES: readonly (readonly [number, number, number, string])[] = [
  [165, 289, 6, C.grisClair],
  [166, 313, 8.5, C.terracotta],
  [178, 337, 11.5, C.paille],
  [200, 357, 17, C.sable],
  [222, 337, 11.5, C.azur],
  [234, 313, 8.5, C.lilas],
  [235, 289, 6, C.grisClair],
];

const collierPlanetes: WardrobeArt = {
  Layer: () => (
    <g>
      <path
        d="M166 264Q163 278 165 289Q163 302 166 313Q169 328 178 337Q187 352 200 357Q213 352 222 337Q231 328 234 313Q237 302 235 289Q237 278 234 264"
        fill="none"
        stroke={METAL.or}
        strokeWidth="2.5"
      />
      <g fill={C.noir} fillOpacity="0.25">
        {PLANETES.map(([x, y, r]) => (
          <circle key={x} cx={x + 1.5} cy={y + 2.5} r={r + 0.5} />
        ))}
      </g>
      {/* L'anneau de la planète annelée passe derrière elle, puis devant. */}
      <path d="M-21.5 0A21.5 6 0 0 1 21.5 0" transform="translate(178 337) rotate(-20)" fill="none" stroke={METAL.or} strokeWidth="3.2" />
      {PLANETES.map(([x, y, r, couleur]) => (
        <circle key={x} cx={x} cy={y} r={r} fill={couleur} />
      ))}
      {/* Cratères, calotte de glace, bandes de nuages, continents. */}
      <circle cx="163.4" cy="290.6" r="1.6" fill={C.gris} />
      <circle cx="236.6" cy="287.4" r="1.6" fill={C.gris} />
      <ellipse cx="164.5" cy="315.5" rx="3.4" ry="2" fill={shade(C.terracotta, -0.28)} />
      <path d={bande(166, 313, 8.5, -8.4, -6.2)} fill={C.blanc} fillOpacity="0.85" />
      <path d={bande(178, 337, 11.5, -2.5, 1)} transform="rotate(-20 178 337)" fill={C.kraft} />
      <g transform="rotate(-14 200 357)">
        <path d={bande(200, 357, 17, -12, -7.5)} fill={C.terracotta} />
        <path d={bande(200, 357, 17, -1.5, 5)} fill={C.terracotta} />
        <path d={bande(200, 357, 17, 9.5, 13)} fill={C.terracotta} fillOpacity="0.6" />
        <ellipse cx="206.5" cy="359" rx="4.2" ry="2.5" fill={C.brique} />
      </g>
      <g transform="translate(222 337) scale(1.15)" fill={C.vert}>
        <path d="M-7 -4Q-4 -8 0 -6Q3 -3 -1 -1Q-5 1 -7 -4Z" />
        <path d="M1 3Q5 1 7 3Q7 7 3 8Q0 6 1 3Z" />
      </g>
      <path d={bande(234, 313, 8.5, -3, 0.5)} transform="rotate(-14 234 313)" fill={C.blanc} fillOpacity="0.4" />
      {/* Chaque planète : son ombre en croissant, un reflet. */}
      <g fill={C.noir} fillOpacity="0.2">
        {PLANETES.map(([x, y, r]) => (
          <path key={x} d={croissant(x, y, r)} />
        ))}
      </g>
      <g fill={C.blanc} fillOpacity="0.85">
        {PLANETES.map(([x, y, r]) => (
          <circle key={x} cx={x - r * 0.36} cy={y - r * 0.4} r={r * 0.2} />
        ))}
      </g>
      <path d="M-21.5 0A21.5 6 0 0 0 21.5 0" transform="translate(178 337) rotate(-20)" fill="none" stroke={METAL.or} strokeWidth="3.2" />
      <g fill={C.blanc}>
        <path d={ECLAT} transform="translate(229 363) scale(0.6)" />
        <path d={ECLAT} transform="translate(150 304) scale(0.45)" />
      </g>
    </g>
  ),
  thumb: "118 258 164 122",
};

export const WARDROBE_3: Record<string, WardrobeArt> = {
  "sac-a-patates": sacAPatates,
  cire,
  peignoir,
  "habit-amiral": habitAmiral,
  hermine,
  "combinaison-spatiale": combinaisonSpatiale,
  "cape-aurore": capeAurore,
  ficelle,
  echarpe,
  canne,
  "grand-cordon": grandCordon,
  sceptre,
  "pendentif-lune": pendentifLune,
  "collier-planetes": collierPlanetes,
};
