// Le solfège du moteur de musique : les notes, les accords, les phrases écrites à la
// main et celles qui s'improvisent. Rien ici ne touche à Web Audio : ce ne sont que des
// nombres (hauteurs MIDI, pas de la grille), que les partitions (themes.ts) assemblent
// et que le moteur (moteur.ts) fait sonner.

const DEMI_TONS: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** Le nom d'une note, à l'anglaise et en minuscules : « c4 » est le do du milieu (60), « f#5 », « bb3 ». */
export function ton(nom: string): number {
  const m = /^([a-g])([#b]?)(\d)$/.exec(nom);
  if (!m) throw new Error(`Note illisible : « ${nom} »`);
  return 12 * (Number(m[3]) + 1) + DEMI_TONS[m[1]!]! + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}

/** La fréquence d'une hauteur MIDI, au tempérament égal (la 440) : celui des bruitages. */
export function hertz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** La classe d'une hauteur : 0 pour tous les do, 2 pour tous les ré... */
export function classe(midi: number): number {
  return ((Math.round(midi) % 12) + 12) % 12;
}

// ---------------------------------------------------------------------------
// Les phrases écrites

/** Une note d'une phrase : son pas dans la mesure, sa hauteur, sa durée en pas, sa force. */
export type Note = readonly [pas: number, ton: number, duree: number, force: number];

const phrases = new Map<string, readonly Note[]>();

/**
 * Lit une mesure écrite : « e5:3 g5 a5:2 -:2 ». Chaque mot est une note suivie de sa
 * durée en pas (un pas si rien n'est dit) ; « - » est un silence ; « ! » appuie la note,
 * « ? » l'effleure.
 */
export function lis(texte: string): readonly Note[] {
  const connue = phrases.get(texte);
  if (connue) return connue;
  const notes: Note[] = [];
  let pas = 0;
  for (const mot of texte.split(/\s+/)) {
    if (!mot) continue;
    const m = /^(-|[a-g][#b]?\d)([!?]?)(?::(\d+(?:\.\d+)?))?$/.exec(mot);
    if (!m) throw new Error(`Phrase illisible : « ${mot} » dans « ${texte} »`);
    const duree = m[3] ? Number(m[3]) : 1;
    if (m[1] !== "-") notes.push([pas, ton(m[1]!), duree, m[2] === "!" ? 1.25 : m[2] === "?" ? 0.6 : 1]);
    pas += duree;
  }
  phrases.set(texte, notes);
  return notes;
}

/** La longueur d'une mesure écrite, en pas (silences compris). */
export function longueur(texte: string): number {
  let pas = 0;
  for (const mot of texte.split(/\s+/)) if (mot) pas += Number(mot.split(":")[1] ?? 1);
  return pas;
}

// ---------------------------------------------------------------------------
// Les accords

/** Un accord : sa basse et ses notes, en classes de hauteur. `tons[0]` est la fondamentale. */
export interface Accord {
  basse: number;
  tons: readonly number[];
}

/** Les intervalles de chaque espèce d'accord, dans l'ordre : fondamentale, tierce (ou quarte), quinte, septième, neuvième. */
const ESPECES: Record<string, readonly number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  "5": [0, 7],
  "6": [0, 4, 7, 9],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  sus4: [0, 5, 7],
  "7sus4": [0, 5, 7, 10],
  add9: [0, 4, 7, 14],
  m9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
};

const accords = new Map<string, Accord>();

/** Lit le nom d'un accord : « Am7 », « G/B » (sol sur basse de si), « E7sus4 », « Bm7b5 », « A5 ». */
export function accord(nom: string): Accord {
  const connu = accords.get(nom);
  if (connu) return connu;
  const m = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/.exec(nom);
  const espece = m ? ESPECES[m[3]!] : undefined;
  if (!m || !espece) throw new Error(`Accord illisible : « ${nom} »`);
  const alteration = (signe: string | undefined) => (signe === "#" ? 1 : signe === "b" ? -1 : 0);
  const fond = DEMI_TONS[m[1]!.toLowerCase()]! + alteration(m[2]);
  const lu: Accord = {
    basse: classe(m[4] ? DEMI_TONS[m[4].toLowerCase()]! + alteration(m[5]) : fond),
    tons: espece.map((i) => classe(fond + i)),
  };
  accords.set(nom, lu);
  return lu;
}

/** La note la plus grave de cette classe, à partir du plancher. */
export function grave(pc: number, plancher: number): number {
  return plancher + ((((pc - plancher) % 12) + 12) % 12);
}

/** Ce qui compte d'abord dans un accord quand on ne peut pas tout jouer : la tierce, la septième, la neuvième, la quinte, la fondamentale. */
const PRIORITE = [1, 3, 4, 2, 0];

/**
 * L'accord plaqué : `n` notes serrées, en montant à partir du plancher. D'un accord au
 * suivant les voix bougent donc à peine, comme sous les doigts d'un pianiste.
 */
export function plaque(a: Accord, plancher: number, n = 3): number[] {
  const choisies: number[] = [];
  for (const i of PRIORITE) {
    const pc = a.tons[i];
    if (pc !== undefined && choisies.length < n) choisies.push(pc);
  }
  const notes: number[] = [];
  for (let midi = plancher; notes.length < n && midi < plancher + 36; midi++) {
    if (choisies.includes(classe(midi))) notes.push(midi);
  }
  return notes;
}

/** Toutes les notes de ces classes de hauteur entre deux bornes, en montant : l'échelle d'un instrument. */
export function echelle(classes: readonly number[], bas: number, haut: number): number[] {
  const notes: number[] = [];
  for (let midi = bas; midi <= haut; midi++) if (classes.includes(classe(midi))) notes.push(midi);
  return notes;
}

/** Le rang, dans une échelle, de la note la plus proche de `midi`. */
export function rang(notes: readonly number[], midi: number): number {
  let meilleur = 0;
  for (let i = 1; i < notes.length; i++) {
    if (Math.abs(notes[i]! - midi) < Math.abs(notes[meilleur]! - midi)) meilleur = i;
  }
  return meilleur;
}

// ---------------------------------------------------------------------------
// Le hasard

/** Un tirage qui ne dépend que de `n` : le même choix à chaque fois pour la même mesure. */
export function sort(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Une suite de nombres au hasard qu'une graine suffit à rejouer (mulberry32). */
export function suite(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// L'improvisation

/**
 * Les cellules rythmiques d'un temps, selon le nombre de pas qu'il compte. Une durée
 * négative est un silence. Les premières reviennent le plus souvent.
 */
const CELLULES: Record<number, readonly (readonly number[])[]> = {
  2: [[2], [1, 1], [-1, 1], [2], [-2]],
  3: [[3], [2, 1], [-2, 1], [2, 1], [1, 1, 1], [-3]],
  4: [[4], [2, 2], [-2, 2], [3, 1], [2, 1, 1], [-4]],
};

export interface Broderie {
  /** Le hasard du moteur. */
  alea: () => number;
  /** Les notes permises, en montant : une gamme pentatonique sur le registre de l'instrument. */
  notes: readonly number[];
  /** L'accord de la mesure : la phrase se pose sur ses notes aux temps forts. */
  accord: Accord;
  /** Pas par mesure, et pas par temps. */
  pas: number;
  temps: number;
  /** D'où part la phrase : un rang dans `notes` (celui où la mesure précédente s'est arrêtée). */
  depart: number;
  /** De 0 (presque rien) à 1 (bavard) : la part des temps qui chantent. */
  densite: number;
  /** La phrase se termine dans cette mesure : une note longue sur l'accord, puis le silence. */
  cadence?: boolean;
}

/**
 * Une mesure improvisée : une marche le long de la gamme, par petits pas, qui se pose sur
 * les notes de l'accord au début de chaque temps. Rend les notes et le rang où elle s'arrête,
 * pour que la mesure suivante reprenne le fil.
 */
export function brode(o: Broderie): { notes: Note[]; fin: number } {
  const cellules = CELLULES[o.temps] ?? CELLULES[2]!;
  const notes: Note[] = [];
  const haut = o.notes.length - 1;
  let ici = Math.max(0, Math.min(haut, o.depart));
  // La ligne monte dans le bas du registre, descend dans le haut.
  let sens = ici < o.notes.length / 2 ? 1 : -1;
  /** La note de l'accord la plus proche du rang `i`, en regardant d'abord dans le sens de la ligne ; jamais le rang `sauf`. */
  const surAccord = (i: number, sauf = -1): number => {
    for (let ecart = 0; ecart < 5; ecart++) {
      for (const j of [i + ecart * sens, i - ecart * sens]) {
        if (j >= 0 && j <= haut && j !== sauf && o.accord.tons.includes(classe(o.notes[j]!))) return j;
      }
    }
    return i;
  };
  const temps = Math.floor(o.pas / o.temps);
  for (let b = 0; b < temps; b++) {
    const debut = b * o.temps;
    if (o.cadence && b >= temps - 2) {
      // La chute : une note tenue sur l'accord, à l'avant-dernier temps (pas celle qu'on vient d'entendre).
      if (b === temps - 2) {
        ici = surAccord(ici, ici);
        notes.push([debut, o.notes[ici]!, o.temps * 2, 0.9]);
      }
      continue;
    }
    if (o.alea() > o.densite) continue;
    const cellule = cellules[Math.floor(o.alea() ** 1.6 * cellules.length)]!;
    let pas = debut;
    cellule.forEach((duree, k) => {
      if (duree > 0) {
        const avant = ici;
        ici += sens * (o.alea() < 0.22 ? 2 : 1);
        // Au bout du registre, la ligne fait demi-tour ; ailleurs, elle change d'avis de temps en temps.
        if (ici >= haut) {
          ici = haut;
          sens = -1;
        } else if (ici <= 0) {
          ici = 0;
          sens = 1;
        } else if (o.alea() < 0.18) sens = -sens;
        if (k === 0 && o.alea() < 0.7) ici = surAccord(ici, avant);
        // Jamais deux fois la même note de suite.
        if (ici === avant) ici = avant + sens >= 0 && avant + sens <= haut ? avant + sens : avant - sens;
        notes.push([pas, o.notes[ici]!, duree, k === 0 ? 1 : 0.8]);
      }
      pas += Math.abs(duree);
    });
  }
  return { notes, fin: ici };
}
