// Les dix musiques d'ambiance de Grattouille : une par lieu de la Promenade, du port au
// matin jusqu'à la Lune au lever de Terre, une pour la ville, une pour le Poker Tricheur.
//
// Une partition est une fonction : on lui demande la mesure n, elle écrit ses notes (la
// mélodie, la basse, l'harmonie, le rythme). Les airs sont écrits à la main ; ce qui les
// entoure (les réponses, les chorus, l'accompagnement) se renouvelle d'un tour à l'autre :
// une forme dure d'une à trois minutes, et ne revient jamais tout à fait la même.
//
// Les bruitages du jeu sont en do majeur pentatonique (do, ré, mi, sol, la). Chaque thème
// reste dans une tonalité qui contient ces cinq notes : do majeur ou la mineur (les
// touches blanches), sol majeur ou mi mineur (un dièse), fa majeur ou ré mineur (un
// bémol). Un bruitage tombe donc toujours juste sur la musique.

import type { PlaceId } from "../../../shared/types";
import {
  accord, brode, classe, echelle, grave, grince, lis, plaque, rang, sort, suite, ton, type Accord, type Broderie, type Note,
} from "./solfege";
import {
  ACCORDEON, BALAI, BASSE, CHARLEY, CLAVECIN, CLAVIER, CONTREBASSE, FLUTE, GUITARE, LAME, NAPPE, PIED, PINCE, RHODES,
  RIDE, SHAKER, TAPE, TIC, VERRE, VIBRA, VIOLE, type Piste,
} from "./timbres";

export type ThemeId = "ville" | "poker" | PlaceId;

export const THEME_IDS: readonly ThemeId[] = [
  "ville", "kiosque", "cafe", "casino", "salon", "cercle", "yacht", "banque", "lune", "poker",
];

/** Ce avec quoi une partition écrit. */
export interface Plume {
  /** Une note : sa piste, son pas dans la mesure, sa hauteur (MIDI), sa durée en pas, sa force de 0 à 1, et de combien de demi-tons elle est prise par en dessous. */
  n(piste: string, pas: number, ton: number, duree: number, force?: number, glisse?: number): void;
  /** Un nombre au hasard entre 0 et 1. */
  alea(): number;
  /** La mémoire du thème, le temps qu'il joue : où le soliste s'est arrêté, la tournure de sa dernière question. */
  m: Record<string, number>;
}

export interface Theme {
  /** Temps par minute. */
  tempo: number;
  /** Pas par mesure, et pas par temps : la grille sur laquelle tout s'écrit. */
  pas: number;
  division: number;
  /** Le balancement : de quelle fraction de pas les pas impairs sont retardés. */
  balance?: number;
  /** La souplesse : de combien de secondes, au plus, chaque note s'écarte de la grille. */
  souple?: number;
  /** La tonalité : les classes de hauteur (0 pour do) dont aucune note ne sort. */
  gamme: readonly number[];
  /** La longueur d'une phrase, en mesures : un thème qu'on retrouve reprend au début d'une phrase. */
  phrase: number;
  /** Son volume, réglé à la mesure pour que tous les thèmes sonnent au même niveau. */
  volume: number;
  /**
   * Sa salle : le niveau du premier écho (0,25 : quatre fois plus bas que le son direct),
   * son retard en fraction de temps (trois quarts de temps si rien n'est dit), et ce que
   * chaque écho renvoie au suivant.
   */
  salle?: number;
  echo?: number;
  retour?: number;
  pistes: Record<string, Piste>;
  /** Les airs écrits à la main, pour les relire (et les vérifier) d'un coup. */
  airs: readonly (readonly string[])[];
  /** Écrit la mesure `n`. */
  mesure(n: number, p: Plume): void;
}

/** Les touches blanches : do majeur, la mineur, fa lydien. */
const BLANCHES = [0, 2, 4, 5, 7, 9, 11];
/** Un dièse : sol majeur, mi mineur. */
const UN_DIESE = [0, 2, 4, 6, 7, 9, 11];
/** Un bémol : fa majeur, ré mineur. */
const UN_BEMOL = [0, 2, 4, 5, 7, 9, 10];

// ---------------------------------------------------------------------------
// Les gestes d'écriture

/** Joue une mesure écrite. `haut` la transpose (en demi-tons) ; `lie` allonge chaque note (en pas), pour qu'elle sonne par-dessus la suivante. */
function chante(p: Plume, piste: string, mesure: string, force = 1, haut = 0, lie = 0): void {
  for (const [pas, t, duree, appui] of lis(mesure)) p.n(piste, pas, t + haut, duree + lie, appui * force);
}

/** Un accord plaqué ; égrené de bas en haut si `egrene` (l'écart entre deux cordes, en pas) n'est pas nul. */
function plaquer(p: Plume, piste: string, pas: number, notes: readonly number[], duree: number, force = 1, egrene = 0): void {
  notes.forEach((t, i) => p.n(piste, pas + i * egrene, t, duree, force));
}

/** Une percussion écrite, un caractère par pas : « x » frappe, « o » frappe doucement, « - » effleure, « . » se tait. */
function frappe(p: Plume, piste: string, motif: string, force = 1, duree = 1, hauteur = 0): void {
  for (let i = 0; i < motif.length; i++) {
    const c = motif[i];
    const f = c === "x" ? 1 : c === "o" ? 0.6 : c === "-" ? 0.3 : 0;
    if (f > 0) p.n(piste, i, hauteur, duree, f * force);
  }
}

/** Les accords d'une mesure : un seul, ou deux qui se la partagent (« Dm7 G7 »). */
function harmonie(mesure: string): readonly [Accord, Accord] {
  const [un, deux] = mesure.split(" ");
  return [accord(un!), accord(deux ?? un!)];
}

/** La note de l'accord qui chante sous une mélodie : la plus haute, une tierce au moins en dessous. */
function dessous(a: Accord, midi: number): number {
  for (let t = midi - 3; t > midi - 12; t--) if (a.tons.includes(classe(t))) return t;
  return midi - 12;
}

/** La note voisine dans la gamme : `de` degrés plus haut, ou plus bas. C'est par elle qu'une basse rejoint l'accord suivant. */
function voisine(gamme: readonly number[], midi: number, de: number): number {
  let t = midi;
  for (let reste = Math.abs(de); reste > 0; ) {
    t += Math.sign(de);
    if (gamme.includes(classe(t))) reste--;
  }
  return t;
}

/**
 * La note par laquelle une basse rejoint sa prochaine fondamentale (`but`) : sa voisine dans
 * la gamme, du côté demandé ; de l'autre si celle-là grince sous l'accord qui sonne encore.
 */
function approche(gamme: readonly number[], sous: Accord, but: number, cote: number): number {
  const note = voisine(gamme, but, cote);
  return grince(sous, note) ? voisine(gamme, but, -cote) : note;
}

/** La basse qui alterne : la quinte de l'accord, ou sa fondamentale quand il est renversé. */
function alterne(a: Accord, plancher: number): number {
  return grave(a.basse !== a.tons[0] ? a.tons[0]! : (a.tons[2] ?? a.tons[1] ?? a.tons[0]!), plancher);
}

/**
 * Une mesure de chorus improvisé. Les phrases vont par quatre mesures, comme on parle :
 * une question, la même tournure reprise un peu plus bas (ou plus haut), un développement,
 * puis la chute. La reprise rejoue le tirage de la question : le même rythme, les mêmes
 * intervalles, posés sur l'accord du moment. `cle` : où le soliste range son fil.
 */
function improvise(p: Plume, cle: string, k: number, o: Pick<Broderie, "notes" | "accord" | "pas" | "temps" | "densite">): readonly Note[] {
  const place = k % 4;
  const milieu = Math.floor(o.notes.length / 2);
  if (place !== 1) {
    p.m[`${cle}Graine`] = Math.floor(p.alea() * 0x7fffffff);
    p.m[`${cle}Depart`] = p.m[cle] ?? milieu;
  }
  const question = p.m[`${cle}Depart`] ?? milieu;
  const depart = place === 1 ? question + (p.alea() < 0.7 ? -1 : 1) * (p.alea() < 0.5 ? 1 : 2) : question;
  const phrase = brode({
    ...o,
    alea: suite(p.m[`${cle}Graine`] ?? 1),
    depart,
    densite: place === 2 ? Math.min(1, o.densite + 0.15) : o.densite,
    cadence: place === 3,
  });
  p.m[cle] = phrase.fin;
  return phrase.notes;
}

// ---------------------------------------------------------------------------
// La ville : le thème de Grattouille. Do majeur, une promenade de bord de mer : une
// boîte à musique chante, un ukulélé gratte les contretemps, la basse descend la gamme.

const VILLE_ACCORDS: Record<string, readonly string[]> = {
  A: ["C", "G/B", "Am", "Em/G", "F", "C/E", "Dm7", "G7"],
  A2: ["C", "G/B", "Am", "Em/G", "F", "C/E", "Dm7 G7", "C"],
  B: ["F", "G", "Em", "Am", "Dm7", "G7", "C", "G7"],
  C: ["Am", "F", "C", "G", "Am", "F", "Dm7 G7", "C"],
};

const VILLE_AIRS: Record<string, readonly string[]> = {
  // L'air : « long, bref, long, long », une mesure sur deux.
  A: [
    "e5:3 g5 a5:2 g5:2", "d5:3 e5 g5:4", "c5:3 e5 a5:2 g5:2", "e5:6 d5 e5",
    "f5:3 a5 c6:2 a5:2", "g5:3 e5 c5:4", "d5:3 f5 a5:2 g5 f5", "g5:6 -:2",
  ],
  // Le même, qui se pose sur le do.
  A2: [
    "e5:3 g5 a5:2 g5:2", "d5:3 e5 g5:4", "c5:3 e5 a5:2 g5:2", "e5:6 d5 e5",
    "f5:3 a5 c6:2 a5:2", "g5:3 e5 c5:4", "d5:3 f5 e5:2 d5:2", "c5:6 -:2",
  ],
  // Le même, qui monte voir plus haut.
  A3: [
    "e5:3 g5 c6:2 a5:2", "g5:3 e5 d5:4", "c5:3 e5 a5:2 c6:2", "b5:2 a5:2 g5:2 e5 d5",
    "f5:3 a5 c6:2 d6:2", "c6:3 g5 e5:4", "d5:3 f5 e5:2 d5:2", "c5:6 -:2",
  ],
  // Le pont : la phrase s'élance, et redescend marche après marche.
  B: [
    "a5:2 c6:3 a5 g5 f5", "g5:2 b5:3 d6 b5 g5", "e5:2 g5:3 e5 d5 e5", "c6:4 a5:2 e5:2",
    "f5:2 a5:3 f5 e5 d5", "g5:2 b5:3 a5 g5 f5", "e5:3 g5 c6:4", "d6:3 b5 g5:4",
  ],
};

/** Trois tours de quatre phrases : l'air revient souvent, jamais dans le même ordre. */
const VILLE_FORME = ["A", "A2", "B", "A3", "A", "C", "B", "A2", "C", "A2", "B", "A3"];

const VILLE: Theme = {
  tempo: 104, pas: 8, division: 2, souple: 0.005, gamme: BLANCHES, phrase: 8, volume: 1.16, salle: 0.22, echo: 0.75, retour: 0.3,
  pistes: {
    lame: { timbre: LAME, vol: 1, pan: 0.12, salle: 0.5 },
    basse: { timbre: BASSE, vol: 0.58, filtre: ["lowpass", 800] },
    uku: { timbre: PINCE, vol: 0.66, filtre: ["lowpass", 3200], pan: -0.3, salle: 0.3 },
    shaker: { timbre: SHAKER, vol: 0.88, filtre: ["bandpass", 6200, 1.2], pan: 0.35 },
  },
  airs: Object.values(VILLE_AIRS),
  mesure(n, p) {
    const phrase = Math.floor(n / 8);
    const section = VILLE_FORME[phrase % VILLE_FORME.length]!;
    const k = n % 8;
    const tour = Math.floor(phrase / VILLE_FORME.length);
    const accords = VILLE_ACCORDS[section === "A3" ? "A2" : section]!;
    const [a1, a2] = harmonie(accords[k]!);

    // La basse : le premier temps, puis le troisième ; elle sautille quand l'air s'anime.
    const vif = section !== "A" && section !== "C";
    const b1 = grave(a1.basse, 43);
    p.n("basse", 0, b1, 3, 1);
    if (vif) p.n("basse", 3, b1, 1, 0.55);
    p.n("basse", 4, a2 !== a1 ? grave(a2.basse, 43) : alterne(a1, 43), vif ? 2 : 3, 0.85);
    if (vif && k < 7 && sort(n) < 0.5) p.n("basse", 7, approche(BLANCHES, a2, grave(harmonie(accords[k + 1]!)[0].basse, 43), sort(n + 1) < 0.5 ? -1 : 1), 1, 0.5);

    // Le ukulélé : les contretemps, un aller et un retour. Dans le pont, il égrène l'accord.
    const v1 = plaque(a1, 64, 3);
    const v2 = plaque(a2, 64, 3);
    if (section === "B") {
      for (let i = 0; i < 8; i++) p.n("uku", i, (i < 4 ? v1 : v2)[[0, 1, 2, 1][i % 4]!]!, 2, i % 2 ? 0.55 : 0.75);
    } else {
      plaquer(p, "uku", 2, v1, 0.9, 0.9, 0.1);
      plaquer(p, "uku", 3, [v1[2]!, v1[1]!], 0.7, 0.45, 0.08);
      plaquer(p, "uku", 6, v2, 0.9, 0.9, 0.1);
      plaquer(p, "uku", 7, [v2[2]!, v2[1]!], 0.7, 0.45, 0.08);
    }
    frappe(p, "shaker", section === "C" ? "o.x.o.x." : "o-x-o-x-", 1, 0.5);

    const air = VILLE_AIRS[section];
    if (air) {
      chante(p, "lame", air[k]!, 1, 0, 0.45);
      // Aux tours suivants, une réponse dans l'aigu quand l'air tient sa note.
      if ((k === 3 || k === 7) && (tour > 0 || section === "A3") && sort(n * 3) < 0.7) {
        const haut = plaque(a2, 79, 3);
        [2, 1, 0].forEach((i, j) => p.n("lame", 3 + j, haut[i]!, 1.6, 0.42));
      }
    } else {
      // L'interlude : la boîte à musique rêvasse sur la gamme des bruitages.
      const notes = echelle([0, 2, 4, 7, 9], 72, 88);
      for (const [pas, t, duree, appui] of improvise(p, "lame", k, { notes, accord: a1, pas: 8, temps: 2, densite: 0.55 })) {
        p.n("lame", pas, t, duree + 0.6, appui * 0.8);
      }
    }
  },
};

// ---------------------------------------------------------------------------
// Le Kiosque, au matin : une gigue en sol majeur. Une mandoline, une contrebasse en
// pizzicato qui rebondit, et un sifflet de marin qui vient doubler l'air.

const KIOSQUE_ACCORDS: Record<string, readonly string[]> = {
  A: ["G", "G", "C", "D", "G", "Em", "C D", "G"],
  B: ["Em", "Em", "C", "G", "Em", "C", "Am D7", "G"],
  C: ["C", "G", "D", "Em", "C", "G", "D7", "G"],
  D: ["Am", "D", "G", "Em", "Am", "D", "G D", "G"],
};

const KIOSQUE_AIRS: Record<string, readonly string[]> = {
  A: [
    "g5:2 b5 d6:2 b5", "a5 b5 a5 g5:2 d5", "e5:2 g5 c6:2 g5", "a5 g5 f#5 d5:3",
    "g5:2 b5 d6:2 b5", "e6:2 d6 b5:2 g5", "c6 b5 a5 a5 g5 f#5", "g5:3 -:2 d5",
  ],
  A2: [
    "g5:2 b5 d6:2 b5", "a5 b5 c6 b5:2 g5", "e5:2 g5 c6:2 g5", "a5 g5 f#5 d5:3",
    "g5:2 b5 d6:2 b5", "e6 d6 b5 g5:2 b5", "c6 b5 a5 a5 g5 f#5", "g5:3 -:3",
  ],
  B: [
    "e5:2 g5 b5:2 g5", "e5 f#5 g5 b5:3", "c6:2 g5 e5:2 g5", "d5 g5 b5 d6:3",
    "e6:2 b5 g5:2 b5", "e6 d6 c6 g5:2 e5", "a5 c6 e6 d6 c6 a5", "g5:2 b5 g5:3",
  ],
  // Le sifflet seul, en notes longues, pendant que la mandoline égrène les accords.
  C: [
    "e5:3 g5:3", "d5:3 b5:3", "a5:3 f#5:3", "g5:6",
    "e5:3 g5:3", "b5:3 d6:3", "c6:3 a5:3", "b5:3 g5:3",
  ],
  // La troisième reprise : elle part du la, et grimpe jusqu'au sol aigu.
  D: [
    "a5:2 c6 e6:2 c6", "d6 c6 a5 f#5:2 a5", "b5:2 d6 g6:2 d6", "e6 d6 b5 g5:3",
    "a5:2 c6 e6:2 c6", "d6:2 a5 f#5:2 d5", "g5 a5 b5 a5 g5 f#5", "g5:3 -:3",
  ],
};

/** Douze reprises, deux minutes : « A2 », « B2 », « D2 » sont les mêmes airs, joués autrement. */
const KIOSQUE_FORME = ["A", "A2", "B", "B2", "C", "A2", "D", "D2", "A", "B2", "C", "A2"];

const KIOSQUE: Theme = {
  tempo: 96, pas: 6, division: 3, souple: 0.005, gamme: UN_DIESE, phrase: 8, volume: 1.19, salle: 0.16, echo: 2 / 3, retour: 0.15,
  pistes: {
    mandoline: { timbre: PINCE, vol: 1, filtre: ["lowpass", 3600], pan: 0.15, salle: 0.45 },
    sifflet: { timbre: FLUTE, vol: 0.5, pan: -0.2, salle: 0.6 },
    basse: { timbre: CONTREBASSE, vol: 0.6, filtre: ["lowpass", 900] },
    pompe: { timbre: PINCE, vol: 0.44, filtre: ["lowpass", 2600], pan: -0.3, salle: 0.3 },
    tambourin: { timbre: SHAKER, vol: 0.95, filtre: ["bandpass", 5200, 1], pan: 0.3 },
  },
  airs: Object.values(KIOSQUE_AIRS),
  mesure(n, p) {
    const reprise = Math.floor(n / 8);
    const section = KIOSQUE_FORME[reprise % KIOSQUE_FORME.length]!;
    const k = n % 8;
    // Un tour sur deux, l'orchestre change de manière : la pompe redouble, la basse marche.
    const autrement = Math.floor(reprise / KIOSQUE_FORME.length) % 2 === 1;
    const accords = KIOSQUE_ACCORDS[section[0]!]!;
    const [a1, a2] = harmonie(accords[k]!);

    // La contrebasse sur les deux temps, la pompe sur les levées : « poum, tchic, poum, tchic ».
    p.n("basse", 0, grave(a1.basse, 43), 2.4, 1);
    p.n("basse", 3, a2 !== a1 ? grave(a2.basse, 43) : alterne(a1, 43), autrement ? 1.6 : 2.2, 0.8);
    if (autrement && k < 7) p.n("basse", 5, approche(UN_DIESE, a2, grave(harmonie(accords[k + 1]!)[0].basse, 43), sort(n) < 0.5 ? -1 : 1), 0.9, 0.55);
    plaquer(p, "pompe", 2, plaque(a1, 62, 3), 0.8, 0.8, 0.06);
    plaquer(p, "pompe", 5, plaque(a2, 62, 3), 0.8, 0.9, 0.06);
    if (autrement) {
      plaquer(p, "pompe", 1, plaque(a1, 62, 2), 0.7, 0.45);
      plaquer(p, "pompe", 4, plaque(a2, 62, 2), 0.7, 0.45);
    }
    frappe(p, "tambourin", section === "C" ? "o....." : autrement ? "o--o--" : "o.-o.-", 1, 0.5);

    if (section === "C") {
      chante(p, "sifflet", KIOSQUE_AIRS.C![k]!, 1);
      const v = plaque(a1, 67, 3);
      const w = plaque(a2, 67, 3);
      [0, 2, 1, 2, 0, 2].forEach((i, j) => p.n("mandoline", j, (j < 3 ? v : w)[i]! + (j === 4 ? 12 : 0), 1.6, j % 3 ? 0.5 : 0.7));
      return;
    }
    const air = (KIOSQUE_AIRS[section] ?? KIOSQUE_AIRS[section[0]!]!)[k]!;
    if (section === "B2" || section === "D2") {
      // Le sifflet prend l'air ; la mandoline l'accompagne une octave plus bas, à mi-voix.
      chante(p, "sifflet", air, 1.1);
      chante(p, "mandoline", air, 0.45, -12, 0.3);
    } else {
      chante(p, "mandoline", air, 1, 0, 0.3);
      // Le sifflet double l'air dans la reprise ; un tour sur deux, c'est dans l'exposé.
      if ((section === "A2") !== autrement && section[0] === "A") chante(p, "sifflet", air, 0.6);
    }
  },
};

// ---------------------------------------------------------------------------
// Le Grand Café, l'après-midi : une valse musette en fa majeur. L'accordéon déroule ses
// arpèges, la contrebasse marque le premier temps, la guitare fait la pompe.

const CAFE_ACCORDS: Record<string, readonly string[]> = {
  A: ["F", "F", "Dm", "Dm", "Gm", "Gm", "C7", "C7", "F", "F", "Dm", "Dm", "Gm", "C7", "F", "F"],
  B: ["Bb", "Bb", "F", "F", "Gm", "C7", "F", "F", "Bb", "Bb", "F", "Dm", "Gm", "C7", "F", "F"],
  // Le trio, côté ré mineur : la ronde des quintes.
  C: ["Dm", "Dm", "Gm", "Gm", "C", "C", "F", "F", "Bb", "Bb", "Gm", "Gm", "Am", "Am", "Dm", "C7"],
};

const CAFE_AIRS: Record<string, readonly string[]> = {
  A: [
    "c5 f5 a5 c6 a5 f5", "a5:4 g5 f5", "d5 f5 a5 d6 a5 f5", "f5:4 e5 d5",
    "d5 g5 bb5 d6 bb5 g5", "bb5:4 a5 g5", "e5 g5 bb5 c6 bb5 g5", "c6:3 bb5 a5 g5",
    "c5 f5 a5 c6 a5 f5", "c6 bb5 a5 g5 f5 e5", "d5 f5 a5 d6 a5 f5", "d6 c6 bb5 a5 g5 f5",
    "g5:2 bb5:2 d6:2", "c6:2 bb5 a5 g5 e5", "f5:6", "a5:2 f5:2 c5:2",
  ],
  // La même, avec les fioritures de l'accordéoniste.
  A2: [
    "c5 f5 a5 c6 a5 f5", "a5:2 bb5 a5 g5 f5", "d5 f5 a5 d6 a5 f5", "f5:2 g5 f5 e5 d5",
    "d5 g5 bb5 d6 bb5 g5", "bb5:2 c6 bb5 a5 g5", "e5 g5 bb5 c6 bb5 g5", "c6:3 bb5 a5 g5",
    "f5 a5 c6 f6 c6 a5", "c6 bb5 a5 g5 f5 e5", "f5 a5 d6 f6 d6 a5", "d6 c6 bb5 a5 g5 f5",
    "g5:2 bb5:2 d6:2", "c6:2 bb5 a5 g5 e5", "f5:6", "f5:4 -:2",
  ],
  // Le refrain : des notes longues, qui chantent.
  B: [
    "d6:4 c6:2", "bb5:4 d6:2", "c6:4 a5:2", "f5:4 a5:2",
    "bb5:4 a5:2", "g5:4 bb5:2", "a5:6", "a5:2 bb5:2 c6:2",
    "d6:4 f6:2", "d6:4 bb5:2", "c6:4 f6:2", "d6:4 a5:2",
    "bb5:2 a5:2 g5:2", "e5:2 g5:2 bb5:2", "a5:6", "f5:4 -:2",
  ],
  C: [
    "f6:6", "e6:2 d6:2 a5:2", "bb5:6", "a5:2 g5:2 d5:2",
    "e5:2 g5:2 c6:2", "e6:4 d6:2", "c6:6", "a5:2 c6:2 f6:2",
    "f6:4 d6:2", "d6:6", "d6:4 bb5:2", "g5:6",
    "a5:2 c6:2 e6:2", "e6:4 c6:2", "d6:6", "c6:2 bb5:2 g5:2",
  ],
};

const CAFE_FORME = ["A", "A2", "B", "A2", "A", "C", "B", "A2"];

const CAFE: Theme = {
  tempo: 168, pas: 6, division: 2, souple: 0.005, gamme: UN_BEMOL, phrase: 16, volume: 1, salle: 0.16, echo: 1, retour: 0.2,
  pistes: {
    accordeon: { timbre: ACCORDEON, vol: 0.6, filtre: ["lowpass", 2600], pan: 0.1, salle: 0.4 },
    second: { timbre: CLAVIER, vol: 0.42, filtre: ["lowpass", 1800], pan: 0.3, salle: 0.4 },
    basse: { timbre: CONTREBASSE, vol: 0.9, filtre: ["lowpass", 900] },
    pompe: { timbre: PINCE, vol: 0.63, filtre: ["lowpass", 2400], pan: -0.3, salle: 0.25 },
  },
  airs: Object.values(CAFE_AIRS),
  mesure(n, p) {
    const phrase = Math.floor(n / 16);
    const section = CAFE_FORME[phrase % CAFE_FORME.length]!;
    const k = n % 16;
    const accords = CAFE_ACCORDS[section[0]!]!;
    const a = accord(accords[k]!);

    // « Poum, tchac, tchac » : la basse alterne fondamentale et quinte tant que l'accord dure.
    const redite = k > 0 && accords[k - 1] === accords[k];
    const v = plaque(a, 57, 3);
    plaquer(p, "pompe", 2, v, 0.8, 0.8, 0.05);
    plaquer(p, "pompe", 4, v, 0.8, 0.7, 0.05);
    if (k % 8 === 7) {
      // La dernière mesure d'une phrase : la basse marche, de degré en degré, vers l'accord qui suit.
      const suivants = k === 15 ? CAFE_ACCORDS[CAFE_FORME[(phrase + 1) % CAFE_FORME.length]![0]!]! : accords;
      const b0 = grave(a.basse, 41);
      const but = grave(accord(suivants[(k + 1) % 16]!).basse, 41);
      const sens = b0 < but ? -1 : 1;
      p.n("basse", 0, b0, 1.8, 1);
      p.n("basse", 2, voisine(UN_BEMOL, but, 2 * sens), 1.8, 0.75);
      p.n("basse", 4, voisine(UN_BEMOL, but, sens), 1.8, 0.8);
    } else {
      p.n("basse", 0, redite ? alterne(a, 41) : grave(a.basse, 41), 1.8, 1);
    }

    const air = CAFE_AIRS[section]![k]!;
    chante(p, "accordeon", air, 1);
    // Dans le refrain et le trio, une seconde voix se glisse sous les notes longues.
    if (section !== "A" && section !== "A2") {
      for (const [pas, t, duree] of lis(air)) if (duree >= 4) p.n("second", pas, dessous(a, t), duree, 0.9);
    }
  },
};

// ---------------------------------------------------------------------------
// Le Casino, au coucher du soleil : du swing en la mineur. La contrebasse marche, la
// cymbale fait « ting, ting-a-ting », un vibraphone expose le thème, puis improvise.

// (Do avec sa sixte, pas sa septième majeure : le thème se pose sur le do, qui grincerait contre un si.)
const CASINO_ACCORDS = [
  "Am7", "Dm7", "G7", "C6", "Fmaj7", "Bm7b5", "E7sus4", "Am7",
  "Am7", "Dm7", "G7", "C6", "Fmaj7", "Bm7b5", "E7sus4", "Am7 E7sus4",
];

const CASINO_AIRS: Record<string, readonly string[]> = {
  // Le thème : un appel sur la levée, la même tournure d'accord en accord, puis la réponse.
  tete: [
    "-:2 e5 g5:2 a5:4 -:3", "-:2 d5 f5:2 a5:4 -:3", "-:2 d5 f5:2 g5 f5:2 d5 b4:3", "c5:2 e5 g5:6 -:3",
    "-:2 a5 c6:2 e6:4 -:3", "-:2 a5 b5:2 d6:4 -:3", "e6:2 d6 b5:2 a5 e5:3 -:3", "a5:6 -:6",
    "-:2 e5 g5:2 a5:4 -:3", "-:2 d5 f5:2 a5:2 c6 a5:4", "-:2 d5 f5:2 g5 b5:2 d6 b5:3", "c6:2 g5 e5:6 -:3",
    "c6:2 a5 e5:2 a5 c6:2 e6 -:3", "d6:2 b5 a5:2 f5:4 -:3", "e5:2 a5 b5:2 d6 e6:6", "-:2 e6 c6:2 a5:7",
  ],
};

/** La pompe du piano : où tombent ses accords dans la mesure (le pas, la durée). Le pas 11 annonce l'accord suivant. */
const CASINO_POMPES: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 1.6], [5, 2.6]], [[5, 3]], [[2, 1.2], [8, 2.6]], [[0, 4.5]], [[5, 1.4], [11, 2.4]],
];

const CASINO_FORME = ["tete", "tete", "chorus", "tete", "chorus", "chorus"];

const CASINO: Theme = {
  tempo: 132, pas: 12, division: 3, souple: 0.006, gamme: BLANCHES, phrase: 8, volume: 1, salle: 0.2, echo: 2 / 3, retour: 0.25,
  pistes: {
    vibra: { timbre: VIBRA, vol: 0.9, pan: 0.15, salle: 0.5 },
    basse: { timbre: CONTREBASSE, vol: 0.78, filtre: ["lowpass", 1000] },
    piano: { timbre: RHODES, vol: 0.39, filtre: ["lowpass", 2400], pan: -0.3, salle: 0.35 },
    ride: { timbre: RIDE, vol: 0.44, filtre: ["highpass", 6000], pan: 0.3, salle: 0.2 },
    charley: { timbre: CHARLEY, vol: 0.69, filtre: ["highpass", 7500], pan: -0.2 },
  },
  airs: Object.values(CASINO_AIRS),
  mesure(n, p) {
    const phrase = Math.floor(n / 16);
    const section = CASINO_FORME[phrase % CASINO_FORME.length]!;
    const k = n % 16;
    const [a1, a2] = harmonie(CASINO_ACCORDS[k]!);
    const suivant = harmonie(CASINO_ACCORDS[(k + 1) % 16]!)[0];

    // La contrebasse qui marche : la fondamentale, deux pas le long de la gamme, puis la
    // note voisine de la fondamentale suivante.
    const gamme = echelle(BLANCHES, 40, 64);
    const racine = rang(gamme, grave(a1.basse, 43));
    const cible = rang(gamme, grave(suivant.basse, 43));
    const pasDeux = a2 !== a1 ? rang(gamme, grave(a2.basse, 43)) : racine + (p.alea() < 0.5 ? 2 : 1) * (p.alea() < 0.3 ? -1 : 1);
    const pasTrois = a2 !== a1 ? pasDeux : racine + (pasDeux > racine ? 4 : -3);
    // La note d'approche vient du côté où se trouve la basse ; jamais la même note deux fois
    // de suite, et jamais une note qui grince sous l'accord.
    const dernier = a2;
    const cote = pasTrois >= cible ? 1 : -1;
    let approche = cible + cote;
    if (approche === pasTrois || grince(dernier, gamme[Math.max(0, Math.min(gamme.length - 1, approche))]!)) approche = cible - cote;
    const marche = [racine, a2 !== a1 ? racine + 4 : pasDeux, a2 !== a1 ? pasDeux : pasTrois, approche];
    marche.forEach((i, temps) => {
      const t = gamme[Math.max(0, Math.min(gamme.length - 1, i))]!;
      p.n("basse", temps * 3, t, 2.4, temps === 0 ? 1 : 0.85);
      // Une note fantôme sur la levée, de temps en temps : c'est elle qui fait avancer.
      if (temps > 0 && p.alea() < 0.2) p.n("basse", temps * 3 + 2, t, 0.5, 0.4);
    });

    // « Ting, ting-a-ting » : les temps sonnent, les levées sont brèves.
    frappe(p, "ride", "x..o..x..o..", 1, 1.5);
    frappe(p, "ride", ".....-.....-", 1, 0.8);
    frappe(p, "charley", "...x.....x..", 1, 0.5);

    // Le piano ponctue : jamais deux mesures pareilles.
    const pompe = CASINO_POMPES[Math.floor(p.alea() * CASINO_POMPES.length)]!;
    const annonce = p.m.annonce === 1;
    p.m.annonce = 0;
    for (const [pas, duree] of pompe) {
      // L'accord annoncé à la fin de la mesure précédente sonne encore : on ne le rejoue pas.
      if (annonce && pas < 3) continue;
      if (pas === 11) p.m.annonce = 1;
      plaquer(p, "piano", pas, plaque(pas === 11 ? suivant : pas < 6 ? a1 : a2, 60, 3), duree, pas === 11 ? 0.7 : 0.9);
    }

    if (section === "tete") {
      chante(p, "vibra", CASINO_AIRS.tete![k]!, 1, 0, 0.5);
    } else {
      // Le chorus : le vibraphone improvise, par phrases de quatre mesures.
      const notes = echelle([9, 0, 2, 4, 7], 69, 88);
      for (const [pas, t, duree, appui] of improvise(p, "solo", k, { notes, accord: a1, pas: 12, temps: 3, densite: 0.65 })) {
        p.n("vibra", pas, t, duree + 0.5, appui * 0.85);
      }
    }
  },
};

// ---------------------------------------------------------------------------
// Le Salon Privé, le soir : un lounge feutré, en do. Un piano électrique, une basse de
// bossa, un shaker, et une flûte qui prend son temps.

const SALON_ACCORDS: Record<string, readonly string[]> = {
  A: ["Fmaj7", "Em7", "Dm7", "Cmaj7", "Fmaj7", "Em7", "Dm7 G7sus4", "Cmaj7"],
  B: ["Am7", "Am7", "Dm7", "G7sus4", "Em7", "Am7", "Dm7", "G7sus4"],
};

const SALON_AIRS: Record<string, readonly string[]> = {
  A: [
    "- a5 c6 e6:5", "d6:3 b5 g5:4", "- f5 a5 c6:5", "b5:3 g5 e5:4",
    "- a5 c6 e6:3 d6:2", "e6:3 d6 b5:4", "a5:3 f5 g5:2 a5:2", "g5:6 -:2",
  ],
  B: [
    "e6:4 c6:2 a5:2", "b5:3 a5 g5:4", "f6:4 d6:2 a5:2", "c6:3 d6 g5:4",
    "b5:4 g5:2 e5:2", "c6:3 b5 a5:4", "- d5 f5 a5 c6:2 e6:2", "d6:6 -:2",
  ],
};

/** Une phrase sur deux, la flûte se tait : le vibraphone répond à sa place. */
const SALON_FORME = ["A", "A-", "B", "A", "B-", "A-"];

const SALON: Theme = {
  tempo: 84, pas: 8, division: 2, souple: 0.007, gamme: BLANCHES, phrase: 8, volume: 1.05, salle: 0.26, echo: 0.75, retour: 0.35,
  pistes: {
    flute: { timbre: FLUTE, vol: 0.62, pan: 0.15, salle: 0.6 },
    vibra: { timbre: VIBRA, vol: 1, pan: 0.25, salle: 0.6 },
    piano: { timbre: RHODES, vol: 0.34, filtre: ["lowpass", 2000], pan: -0.25, salle: 0.4 },
    basse: { timbre: BASSE, vol: 0.54, filtre: ["lowpass", 700] },
    shaker: { timbre: SHAKER, vol: 0.78, filtre: ["bandpass", 5600, 1.2], pan: 0.35 },
    bois: { timbre: TAPE, vol: 1.2, filtre: ["bandpass", 1900, 1.6], pan: -0.35, salle: 0.3 },
  },
  airs: Object.values(SALON_AIRS),
  mesure(n, p) {
    const section = SALON_FORME[Math.floor(n / 8) % SALON_FORME.length]!;
    const k = n % 8;
    const [a1, a2] = harmonie(SALON_ACCORDS[section[0]!]![k]!);

    // La basse de bossa : la fondamentale, la quinte en levée, deux fois par mesure.
    const b1 = grave(a1.basse, 43);
    const b2 = grave(a2.basse, 43);
    p.n("basse", 0, b1, 2.8, 1);
    p.n("basse", 3, alterne(a1, 43), 0.9, 0.6);
    p.n("basse", 4, b2, 2.8, 0.9);
    p.n("basse", 7, alterne(a2, 43), 0.9, 0.55);

    // Le piano électrique : trois accords par mesure, sur le rythme 3 + 3 + 2.
    plaquer(p, "piano", 0, plaque(a1, 62, 3), 2.2, 0.9, 0.04);
    plaquer(p, "piano", 3, plaque(a1, 62, 3), 2.2, 0.7, 0.04);
    plaquer(p, "piano", 6, plaque(a2, 62, 3), 1.3, 0.8, 0.04);

    frappe(p, "shaker", "o-x-o-x-", 1, 0.5);
    // La clave, sur deux mesures.
    frappe(p, "bois", n % 2 === 0 ? "x..x..x." : "..x..x..", 1, 0.5);

    if (section.length === 1) {
      chante(p, "flute", SALON_AIRS[section]![k]!, 1);
    } else {
      const notes = echelle([0, 2, 4, 7, 9], 67, 88);
      for (const [pas, t, duree, appui] of improvise(p, "vibra", k, { notes, accord: a1, pas: 8, temps: 2, densite: 0.45 })) {
        p.n("vibra", pas, t, duree + 0.6, appui * 0.85);
      }
    }
  },
};

// ---------------------------------------------------------------------------
// Le Cercle des Moustaches, à minuit : une chaconne en ré mineur. La basse de viole
// descend ses quatre notes, toujours les mêmes ; le clavecin varie dessus, à l'ancienne.
// La cadence se pose sur une quinte à vide : ni majeure ni mineure, solennelle.

const CERCLE_SOL = ["Dm", "Am/C", "Gm/Bb", "Asus4 A5"];
const CERCLE_MAJEUR = ["Dm", "Gm", "C", "F", "Bb", "Gm", "Asus4", "A5"];

const CERCLE_AIRS: Record<string, readonly string[]> = {
  chant: ["d5:4 f5:4 a5:4", "c6:8 a5:4", "bb5:6 a5:2 g5:4", "a5:6 e5:6"],
  chant2: ["a5:6 d6:6", "e6:4 c6:4 a5:4", "d6:6 bb5:4 g5:2", "a5:12"],
  majeur: [
    "d5:6 f5:3 a5:3", "bb5:6 a5:3 g5:3", "c6:6 g5:3 e5:3", "f5:6 a5:3 c6:3",
    "d6:6 bb5:3 f5:3", "g5:6 bb5:3 d6:3", "e6:6 d6:3 a5:3", "a5:12",
  ],
};

/** Les variations, dans l'ordre, et leur longueur en mesures : 36 mesures, une minute et demie. */
const CERCLE_FORME: readonly (readonly [string, number])[] = [
  ["expose", 4], ["croches", 4], ["chant", 4], ["doubles", 4], ["majeur", 8], ["pointe", 4], ["croches", 4], ["chant2", 4],
];

const CERCLE: Theme = {
  tempo: 72, pas: 12, division: 4, souple: 0.006, gamme: UN_BEMOL, phrase: 4, volume: 1.25, salle: 0.28, echo: 1, retour: 0.35,
  pistes: {
    clavecin: { timbre: CLAVECIN, vol: 1, filtre: ["lowpass", 4200], pan: 0.15, salle: 0.5 },
    viole: { timbre: VIOLE, vol: 0.42, filtre: ["lowpass", 1100], pan: -0.1, salle: 0.3 },
    orgue: { timbre: FLUTE, vol: 0.42, pan: -0.25, salle: 0.7 },
  },
  airs: Object.values(CERCLE_AIRS),
  mesure(n, p) {
    let k = n % 36;
    let variation = "expose";
    for (const [nom, longueur] of CERCLE_FORME) {
      variation = nom;
      if (k < longueur) break;
      k -= longueur;
    }
    const tour = Math.floor(n / 36);
    const [a1, a2] = harmonie((variation === "majeur" ? CERCLE_MAJEUR : CERCLE_SOL)[k]!);

    // La basse de viole : une note par mesure, tenue.
    const basse = grave(a1.basse, 45);
    p.n("viole", 0, basse, 11, 1);
    const v1 = plaque(a1, 62, 3);
    const v2 = plaque(a2, 62, 3);
    const main = (pas: number) => (pas < 6 ? v1 : v2);

    if (variation === "expose") {
      // L'accord arpégé sur le premier temps, repris sur le deuxième, une note sur le troisième.
      plaquer(p, "clavecin", 0, [basse, ...v1], 3.6, 0.9, 0.24);
      plaquer(p, "clavecin", 4, [v1[1]!, v1[2]!], 3, 0.6);
      p.n("clavecin", 8, v2[2]!, 3.5, 0.7);
      p.n("clavecin", 10, v2[1]!, 2, 0.6);
    } else if (variation === "doubles") {
      // Les doubles croches : la gamme monte de l'accord, et redescend.
      const gamme = echelle(UN_BEMOL, 57, 88);
      const pied = rang(gamme, v1[k % 2]!);
      for (let i = 0; i < 12; i++) {
        const marche = k % 2 === 0 ? (i < 6 ? i : 12 - i) : (i < 6 ? 7 - i : i - 5);
        p.n("clavecin", i, gamme[Math.min(gamme.length - 1, pied + marche)]!, 1.8, i % 4 === 0 ? 0.7 : 0.5);
      }
      // La main gauche : la basse et sa quinte, deux fois par mesure.
      plaquer(p, "clavecin", 0, [basse, grave(a1.tons[2] ?? a1.tons[1]!, basse + 1)], 5, 0.6);
      plaquer(p, "clavecin", 6, [grave(a2.basse, 45), grave(a2.tons[2] ?? a2.tons[1]!, grave(a2.basse, 45) + 1)], 5, 0.5);
    } else if (variation === "pointe") {
      // Le rythme pointé d'une ouverture à la française.
      for (const [pas, duree] of [[0, 2.8], [4, 2.8], [8, 3.8]] as const) plaquer(p, "clavecin", pas, main(pas), duree, 0.8, 0.12);
      p.n("clavecin", 3, v1[2]!, 0.9, 0.55);
      p.n("clavecin", 7, v2[2]!, 0.9, 0.55);
      p.n("clavecin", 0, basse, 5, 0.7);
    } else {
      // Les croches : l'accord brisé, sous le chant quand il y en a un.
      const doux = variation === "croches" ? 1 : 0.62;
      for (let i = 0; i < 6; i++) {
        const v = main(i * 2);
        const t = [v[0]!, v[1]!, v[2]!, v[1]!, v[0]! + 12, v[1]!][(i + (tour % 2) * (k % 2)) % 6]!;
        // Les cordes sonnent l'une sur l'autre, comme sous les sautereaux d'un vrai clavecin.
        p.n("clavecin", i * 2, t, variation === "majeur" ? 2.6 : 3.6, (i === 0 ? 0.85 : 0.6) * doux);
      }
      p.n("clavecin", 0, basse, 4, 0.6 * doux);
      const air = CERCLE_AIRS[variation];
      if (air) {
        chante(p, variation === "majeur" ? "clavecin" : "orgue", air[k]!, variation === "majeur" ? 0.95 : 1);
        // Dans l'éclaircie en fa majeur, l'orgue tient l'accord.
        if (variation === "majeur") plaquer(p, "orgue", 0, plaque(a1, 57, 2), 11, 0.55);
      }
    }
  },
};

// ---------------------------------------------------------------------------
// Le Yacht « Démesure », à deux heures du matin : un groove doux en mi mineur. Une
// basse qui rebondit, une caisse sourde, un piano électrique, un clavier des années 80.

const YACHT_ACCORDS: Record<string, readonly string[]> = {
  A: ["Em7", "Cmaj7", "Am7", "Bm7", "Em7", "Cmaj7", "Am7", "Bm7"],
  B: ["Cmaj7", "D6", "Em7", "Em7", "Cmaj7", "D6", "Gmaj7", "Bm7"],
};

const YACHT_AIRS: Record<string, readonly string[]> = {
  A: [
    "-:4 b5:2 d6:2 e6:6 -:2", "-:4 d6:2 b5:2 g5:6 -:2", "-:4 a5:2 c6:2 e6:4 d6:2 c6:2", "b5:6 a5:2 f#5:6 -:2",
    "-:4 b5:2 d6:2 f#6:6 -:2", "-:4 e6:2 d6:2 b5:6 -:2", "-:2 e6:2 d6:2 c6:2 a5:4 g5:2 a5:2", "b5:8 -:8",
  ],
  B: [
    "g5:6 e5:2 g5:4 b5:4", "a5:6 f#5:2 a5:4 d6:4", "b5:10 -:2 g5:2 a5:2", "b5:4 d6:4 e6:8",
    "g5:6 e5:2 g5:4 c6:4", "a5:6 f#5:2 a5:4 d6:4", "d6:6 b5:2 g5:4 b5:4", "f#5:12 -:4",
  ],
};

/** « A- » : le groove seul, où le clavier glisse quelques notes ; « A » et « B » : il chante. */
const YACHT_FORME = ["A-", "A", "B", "A", "A-", "B", "A", "A-"];

const YACHT: Theme = {
  tempo: 96, pas: 16, division: 4, balance: 0.12, souple: 0.004, gamme: UN_DIESE, phrase: 8, volume: 1, salle: 0.24, echo: 0.75, retour: 0.35,
  pistes: {
    clavier: { timbre: CLAVIER, vol: 0.55, filtre: ["lowpass", 2200], pan: 0.15, salle: 0.6 },
    piano: { timbre: RHODES, vol: 0.43, filtre: ["lowpass", 2200], pan: -0.25, salle: 0.4 },
    basse: { timbre: BASSE, vol: 0.65, filtre: ["lowpass", 650] },
    pied: { timbre: PIED, vol: 1 },
    clap: { timbre: TAPE, vol: 1.3, filtre: ["bandpass", 1700, 0.8], pan: 0.1, salle: 0.3 },
    charley: { timbre: CHARLEY, vol: 0.48, filtre: ["highpass", 7500], pan: 0.3 },
  },
  airs: Object.values(YACHT_AIRS),
  mesure(n, p) {
    const section = YACHT_FORME[Math.floor(n / 8) % YACHT_FORME.length]!;
    const k = n % 8;
    const accords = YACHT_ACCORDS[section[0]!]!;
    const a = accord(accords[k]!);
    const suivant = accord(accords[(k + 1) % 8]!);

    frappe(p, "pied", section[0] === "B" ? "x.......x.x....." : "x......-..x.....", 1, 3, 40);
    frappe(p, "clap", "....x.......x...", 1, 1);
    frappe(p, "charley", p.alea() < 0.3 ? "o.x.o.x.o.x.o.x-" : "o.x.o.x.o.x.o.x.", 1, 0.6);

    // La basse : la fondamentale, son octave qui claque, et une note qui mène à l'accord suivant.
    const b = grave(a.basse, 40);
    p.n("basse", 0, b, 2.6, 1);
    if (p.alea() < 0.8) p.n("basse", 3, b, 0.9, 0.55);
    if (p.alea() < 0.85) p.n("basse", 6, b + 12, 1.2, 0.7);
    p.n("basse", 10, b, 1.8, 0.9);
    p.n("basse", 12, alterne(a, 40), 1.8, 0.7);
    p.n("basse", 14, approche(UN_DIESE, a, grave(suivant.basse, 40), p.alea() < 0.5 ? -1 : 1), 1.6, 0.6);

    // Le piano électrique : l'accord posé, puis une ponctuation.
    const v = plaque(a, 59, 3);
    plaquer(p, "piano", 0, v, 6.5, 0.85, 0.1);
    plaquer(p, "piano", 10, v, 2.2, 0.6);

    if (section.length === 1) {
      chante(p, "clavier", YACHT_AIRS[section]![k]!, 1);
    } else if (k % 2 === 1) {
      // Le groove seul : une réponse sur la gamme pentatonique, une mesure sur deux.
      const notes = echelle([4, 7, 9, 11, 2], 71, 88);
      const reponse = brode({
        alea: p.alea, notes, accord: a, pas: 16, temps: 4, depart: p.m.clavier ?? 4, densite: 0.5, cadence: true,
      });
      p.m.clavier = reponse.fin;
      for (const [pas, t, duree, appui] of reponse.notes) p.n("clavier", pas, t, duree, appui * 0.75);
    }
  },
};

// ---------------------------------------------------------------------------
// La Banque Coffre & Fils, avant l'aube : une mécanique d'horloge, en la mineur. Le
// balancier bat la seconde, un rouage égrène l'accord et se décale d'un cran à chaque
// mesure, un carillon sonne les quarts.

const BANQUE_ACCORDS = [
  "Am", "Am", "Fmaj7", "Fmaj7", "Dm", "Dm", "Em", "Em",
  "Am", "Am", "C", "C", "Dm", "Dm", "E5", "E5",
];

/** Les rouages : dans quel ordre ils parcourent les notes de l'accord. Leurs longueurs (6, 5, 7) ne tombent pas juste sur la mesure. */
const BANQUE_ROUAGES: readonly (readonly number[])[] = [[0, 1, 2, 3, 2, 1], [0, 2, 1, 3, 2], [0, 1, 2, 3, 4, 2, 1]];

/** Les quatre cloches du carillon. */
const BANQUE_CLOCHES = [ton("a5"), ton("c6"), ton("d6"), ton("e6")];

const BANQUE: Theme = {
  tempo: 120, pas: 8, division: 2, gamme: BLANCHES, phrase: 8, volume: 1.6, salle: 0.3, echo: 0.75, retour: 0.4,
  pistes: {
    rouage: { timbre: LAME, vol: 0.55, pan: 0.2, salle: 0.45 },
    carillon: { timbre: VERRE, vol: 0.6, pan: -0.25, salle: 0.8 },
    pendule: { timbre: VIBRA, vol: 0.85, filtre: ["lowpass", 900], salle: 0.3 },
    tic: { timbre: TIC, vol: 0.7, pan: -0.15, salle: 0.25 },
    tac: { timbre: TIC, vol: 0.6, pan: 0.15, salle: 0.25 },
  },
  airs: [],
  mesure(n, p) {
    const k = n % 16;
    const a = accord(BANQUE_ACCORDS[k]!);
    const phrase = Math.floor(n / 8);

    // Le balancier : tic, tac, deux fois par seconde. Toutes les huit mesures, on le remonte.
    p.n("tic", 0, ton("e6"), 0.5, 1);
    p.n("tac", 2, ton("b5"), 0.5, 1);
    p.n("tic", 4, ton("e6"), 0.5, 0.8);
    if (n % 8 === 7) for (let i = 0; i < 6; i++) p.n("tac", 5 + i * 0.5, ton("b5"), 0.3, 0.35 + i * 0.1);
    else p.n("tac", 6, ton("b5"), 0.5, 0.8);

    // Le poids de l'horloge : la fondamentale, grave, à chaque changement d'accord.
    if (k % 2 === 0) p.n("pendule", 0, grave(a.basse, 45), 14, 1);
    else p.n("pendule", 0, alterne(a, 45), 6, 0.5);

    // Le rouage : des croches sur l'accord. Il se tait deux mesures sur huit, et l'horloge reste seule.
    const rouage = BANQUE_ROUAGES[phrase % BANQUE_ROUAGES.length]!;
    if (n % 8 < 6) {
      const notes = echelle(a.tons.slice(0, 3), 64, 86);
      for (let i = 0; i < 8; i++) {
        const cran = rouage[(n * 8 + i) % rouage.length]!;
        p.n("rouage", i, notes[Math.min(notes.length - 1, cran)]!, 1.5, i === 0 ? 0.9 : i % 2 ? 0.5 : 0.65);
      }
    }

    // Le carillon : quatre cloches, dans un ordre qui change à chaque fois.
    if (n % 8 === 6) {
      const ordre = [0, 1, 2, 3].sort((x, y) => sort(phrase * 7 + x) - sort(phrase * 7 + y));
      ordre.forEach((cloche, i) => p.n("carillon", i * 2, BANQUE_CLOCHES[cloche]!, 6, 0.9 - i * 0.1));
    }
  },
};

// ---------------------------------------------------------------------------
// Le Croissant de Lune, au lever de Terre : fa lydien, sans pulsation. Des nappes
// lentes, un arpège de verre qui monte et reste suspendu, une étoile de loin en loin.

/** Les accords, deux mesures chacun : la nappe (quatre notes), et les couleurs où l'arpège puise. */
const LUNE_ACCORDS: readonly (readonly [nappe: readonly string[], couleurs: readonly string[]])[] = [
  [["f3", "c4", "e4", "g4"], ["c5", "e5", "g5", "a5", "b5", "e6"]],
  [["f3", "b3", "d4", "g4"], ["b4", "d5", "g5", "a5", "d6", "g6"]],
  [["e3", "b3", "d4", "g4"], ["b4", "e5", "g5", "b5", "d6", "e6"]],
  [["a3", "c4", "e4", "g4"], ["c5", "e5", "g5", "b5", "c6", "e6"]],
  [["d3", "a3", "c4", "f4"], ["a4", "e5", "f5", "a5", "c6", "e6"]],
  [["e3", "g3", "c4", "d4"], ["g4", "c5", "d5", "g5", "c6", "d6"]],
  [["f3", "a3", "c4", "e4"], ["a4", "c5", "e5", "g5", "b5", "c6"]],
  [["g3", "c4", "d4", "g4"], ["c5", "d5", "g5", "a5", "d6", "g6"]],
];

/** Le lever de Terre : des quintes qui s'empilent. */
const LUNE_LEVER = ["f4", "c5", "g5", "d6"];

const LUNE: Theme = {
  tempo: 54, pas: 8, division: 2, souple: 0.02, gamme: BLANCHES, phrase: 4, volume: 1.06, salle: 0.4, echo: 0.75, retour: 0.5,
  pistes: {
    nappe: { timbre: NAPPE, vol: 0.185, filtre: ["lowpass", 1500], salle: 0.5 },
    verre: { timbre: VERRE, vol: 0.89, pan: 0.2, salle: 0.9 },
    etoile: { timbre: LAME, vol: 0.9, pan: -0.4, salle: 1 },
  },
  airs: [],
  mesure(n, p) {
    const k = n % 16;
    const [nappe, couleurs] = LUNE_ACCORDS[Math.floor(k / 2)]!;
    const tour = Math.floor(n / 16);
    const lever = k === 0 && tour % 2 === 0;

    // La nappe : l'accord éclot note après note, pendant que le précédent s'en va. Un verre
    // tinte à son arrivée : on sait tout de suite où l'on est.
    if (k % 2 === 0) {
      nappe.forEach((nom, i) => p.n("nappe", i * 0.8, ton(nom), 15 - i * 0.8, i === 0 ? 1 : 0.8));
      if (!lever) p.n("verre", 0, ton(couleurs[1]!), 6, 0.5);
    }

    if (lever) {
      // La Terre se lève.
      LUNE_LEVER.forEach((nom, i) => p.n("verre", i * 2, ton(nom), 7, 0.95 - i * 0.08));
      return;
    }
    // L'arpège suspendu : il monte par les couleurs de l'accord, s'arrête où il veut, et
    // laisse sa dernière note en l'air.
    let cran = p.m.cran ?? 1;
    for (let i = k % 2 === 0 ? 1 : 0; i < 4; i++) {
      if (p.alea() < 0.28) continue;
      cran = (cran + (p.alea() < 0.75 ? 1 : 2)) % couleurs.length;
      p.n("verre", i * 2 + (p.alea() < 0.3 ? 1 : 0), ton(couleurs[cran]!), 5, 0.55 + 0.35 * p.alea());
    }
    p.m.cran = cran;
    // Une étoile, parfois : très haut, très loin.
    if (p.alea() < 0.22) p.n("etoile", Math.floor(p.alea() * 8), [ton("e7"), ton("g6"), ton("d7"), ton("a6"), ton("c7")][Math.floor(p.alea() * 5)]!, 3, 0.7);
  },
};

// ---------------------------------------------------------------------------
// Le Poker Tricheur : un blues lent en ré mineur, à douze croches par mesure. Les
// balais tournent sur la caisse, la contrebasse prend son temps, une guitare pose ses
// phrases et tire sur ses cordes.

const POKER_ACCORDS = ["Dm7", "Gm7", "Dm7", "Dm7", "Gm7", "Gm7", "Dm7", "Dm7", "Bbmaj7", "Am7", "Dm7", "Am7"];

const POKER_AIRS: Record<string, readonly string[]> = {
  // Appel, réponse : les trois lignes d'un blues.
  tete: [
    "-:3 a5:2 c6 d6:6", "-:3 d6:2 c6 a5:2 g5 f5:3", "-:3 a5:2 c6 d6:3 f6:3", "d6:6 -:6",
    "-:3 g5:2 bb5 d6:6", "-:3 d6:2 c6 bb5:2 a5 g5:3", "-:3 f5:2 g5 a5:6", "-:2 a5 c6:2 a5 g5:2 f5 d5:3",
    "-:3 d6:2 f6 d6:6", "-:3 c6:2 e6 c6:3 a5:3", "d5:2 f5 a5:2 d6 a5:6", "-:6 e5:2 g5 a5:3",
  ],
};

/** Un chorus écrit, un chorus improvisé : douze mesures chacun, quarante-huit secondes. */
const POKER_FORME = ["tete", "chorus", "tete", "chorus", "chorus"];

const POKER: Theme = {
  tempo: 60, pas: 12, division: 3, souple: 0.008, gamme: UN_BEMOL, phrase: 12, volume: 1.3, salle: 0.24, echo: 1 / 3, retour: 0.25,
  pistes: {
    guitare: { timbre: GUITARE, vol: 0.85, filtre: ["lowpass", 2600], pan: 0.15, salle: 0.6 },
    piano: { timbre: RHODES, vol: 0.43, filtre: ["lowpass", 1900], pan: -0.3, salle: 0.4 },
    basse: { timbre: CONTREBASSE, vol: 0.9, filtre: ["lowpass", 900] },
    balai: { timbre: BALAI, vol: 0.53, filtre: ["bandpass", 3200, 0.6], pan: 0.2, salle: 0.3 },
    tape: { timbre: TAPE, vol: 1.3, filtre: ["bandpass", 2300, 0.7], pan: -0.1, salle: 0.3 },
  },
  airs: Object.values(POKER_AIRS),
  mesure(n, p) {
    const chorus = Math.floor(n / 12);
    const section = POKER_FORME[chorus % POKER_FORME.length]!;
    const k = n % 12;
    const a = accord(POKER_ACCORDS[k]!);
    const suivant = accord(POKER_ACCORDS[(k + 1) % 12]!);

    // Les balais : un tour sur chaque temps fort, une frappe sur les temps faibles, et les croches à peine.
    frappe(p, "balai", "x.....x.....", 1, 5);
    frappe(p, "tape", "..-x.-..-x.-", 1, 0.5);

    // La contrebasse : la fondamentale, longuement ; puis elle marche vers l'accord suivant.
    const gamme = echelle(UN_BEMOL, 38, 62);
    const racine = rang(gamme, grave(a.basse, 43));
    const cible = rang(gamme, grave(suivant.basse, 43));
    const troisieme = racine + (k % 4 === 3 || p.alea() < 0.5 ? 4 : 2);
    // La note d'approche : du côté où se trouve la basse, mais jamais une note qui grince sous l'accord.
    const cote = troisieme >= cible ? 1 : -1;
    let approche = cible + cote;
    if (approche === troisieme || grince(a, gamme[Math.max(0, Math.min(gamme.length - 1, approche))]!)) approche = cible - cote;
    const marche = [racine, k % 4 === 3 ? racine + 2 : racine, troisieme, approche];
    marche.forEach((i, temps) => {
      const t = gamme[Math.max(0, Math.min(gamme.length - 1, i))]!;
      if (temps === 1 && k % 4 !== 3) p.n("basse", 5, t, 0.9, 0.45);
      else p.n("basse", temps * 3, t, temps === 0 ? 4.6 : 2.7, temps === 0 ? 1 : 0.8);
    });

    // Le piano électrique : sur les temps faibles, deux et quatre.
    const v = plaque(a, 62, 3);
    const annonce = p.alea() < 0.25;
    plaquer(p, "piano", 3, v, 2, 0.8, 0.05);
    plaquer(p, "piano", 9, v, annonce ? 1.2 : 2, 0.7, 0.05);
    if (annonce) plaquer(p, "piano", 11, plaque(suivant, 62, 3), 0.8, 0.5);

    if (section === "tete") {
      // La première note de chaque phrase est tirée par en dessous : la corde qu'on tend.
      lis(POKER_AIRS.tete![k]!).forEach(([pas, t, duree, appui], i) => {
        const tiree = i === 0 && duree <= 2 && UN_BEMOL.includes(classe(t - 2));
        p.n("guitare", pas, t, duree + 1, appui, tiree ? -2 : 0);
      });
    } else {
      const notes = echelle([2, 5, 7, 9, 0], 69, 89);
      improvise(p, "solo", k, { notes, accord: a, pas: 12, temps: 3, densite: 0.5 }).forEach(([pas, t, duree, appui], i) => {
        const tiree = i === 0 && UN_BEMOL.includes(classe(t - 2)) && p.alea() < 0.5;
        p.n("guitare", pas, t, duree + 1, appui * 0.85, tiree ? -2 : 0);
      });
    }
  },
};

// ---------------------------------------------------------------------------

export const THEMES: Record<ThemeId, Theme> = {
  ville: VILLE, kiosque: KIOSQUE, cafe: CAFE, casino: CASINO, salon: SALON,
  cercle: CERCLE, yacht: YACHT, banque: BANQUE, lune: LUNE, poker: POKER,
};
