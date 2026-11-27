// La musique d'ambiance (src/fx/musique.ts et src/fx/musique/) : ce que la recette ne peut
// pas entendre, vérifié sur un faux Web Audio.
//
// - Les partitions : dix thèmes, tous différents, chacun dans sa tonalité (une de celles
//   qui contiennent les cinq notes des bruitages), des airs qui tombent juste, plus d'une
//   minute de phrases toutes différentes.
// - Le moteur : chaque thème sonne, sous le niveau des bruitages, sans jamais dépasser
//   dix voix ; un changement de thème est un fondu, pas un empilement ; rien ne claque ;
//   rien ne s'accumule sur dix minutes ; un fil principal figé ne déclenche pas de rafale.
// - Le branchement : rien avant le premier geste du joueur ; le réglage « Musique » coupe
//   et rallume, indépendamment du réglage « Son » ; le thème suit l'écran ; tout se tait
//   quand la page est cachée.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLACES } from "../shared/places";
import { TICKETS } from "../shared/tickets";
import type { PendingTicket, PlayerState } from "../shared/types";
import { completeState } from "../src/app/etat";
import type { Screen } from "../src/app/nav";
import { EN_MUSIQUE } from "../src/i18n/en/musique";
import { FONDU, NIVEAU, VOIX_MAX, creeMoteur, type Moteur } from "../src/fx/musique/moteur";
import { accord, brode, classe, echelle, grince, hertz, lis, longueur, plaque, suite, ton } from "../src/fx/musique/solfege";
import { THEMES, THEME_IDS, type Plume, type ThemeId } from "../src/fx/musique/themes";

// ---------------------------------------------------------------------------
// Un faux Web Audio : il ne sonne pas, il note tout.

interface ParamEvent {
  kind: "set" | "linear" | "exp" | "target";
  value: number;
  time: number;
}

class FakeParam {
  value = 0;
  events: ParamEvent[] = [];
  setValueAtTime(value: number, time: number) {
    this.events.push({ kind: "set", value, time });
    return this;
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ kind: "linear", value, time });
    return this;
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    if (!(value > 0)) throw new RangeError("une rampe exponentielle ne peut pas viser zéro");
    this.events.push({ kind: "exp", value, time });
    return this;
  }
  setTargetAtTime(value: number, time: number, constante: number) {
    if (!(constante > 0)) throw new RangeError("une constante de temps est positive");
    this.events.push({ kind: "target", value, time });
    return this;
  }
  cancelScheduledValues(time: number) {
    this.events = this.events.filter((e) => e.time < time);
    return this;
  }
  /** La plus grande valeur que le paramètre vise : celle de ses automations s'il en a, sa valeur fixe sinon. */
  max(): number {
    return this.events.length > 0 ? Math.max(...this.events.map((e) => e.value)) : this.value;
  }
}

class FakeNode {
  outputs: FakeNode[] = [];
  /** La première sortie jamais branchée : on la connaît encore après le débranchement. */
  premier: FakeNode | null = null;
  constructor(readonly kind: string) {}
  connect(node: FakeNode) {
    this.outputs.push(node);
    this.premier ??= node;
    return node;
  }
  disconnect() {
    this.outputs = [];
  }
}

class FakeSource extends FakeNode {
  frequency = new FakeParam();
  detune = new FakeParam();
  type = "sine";
  buffer: unknown = null;
  loop = false;
  startAt: number | null = null;
  stopAt: number | null = null;
  onended: (() => void) | null = null;
  start(time = 0) {
    if (this.startAt !== null) throw new Error("une source ne démarre qu'une fois");
    this.startAt = time;
  }
  stop(time = 0) {
    if (this.startAt === null) throw new Error("une source s'arrête après avoir démarré");
    this.stopAt = time;
  }
  setPeriodicWave(onde: unknown) {
    if (!onde) throw new Error("pas d'onde");
    this.type = "custom";
  }
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
  constructor() {
    super("gain");
    this.gain.value = 1;
  }
}

class FakeFilter extends FakeNode {
  type = "lowpass";
  frequency = new FakeParam();
  Q = new FakeParam();
  constructor() {
    super("filter");
  }
}

class FakePanner extends FakeNode {
  pan = new FakeParam();
  constructor() {
    super("panner");
  }
}

class FakeConvolver extends FakeNode {
  buffer: unknown = null;
  constructor() {
    super("convolver");
  }
}

class FakeCompressor extends FakeNode {
  threshold = new FakeParam();
  knee = new FakeParam();
  ratio = new FakeParam();
  attack = new FakeParam();
  release = new FakeParam();
  constructor() {
    super("compressor");
  }
}

class FakeShaper extends FakeNode {
  curve: Float32Array | null = null;
  constructor() {
    super("shaper");
  }
}

class FakeContext {
  static made: FakeContext[] = [];
  currentTime = 10;
  sampleRate = 8000;
  state = "running";
  destination = new FakeNode("destination");
  nodes: FakeNode[] = [];
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  suspended = 0;
  resumed = 0;
  constructor() {
    FakeContext.made.push(this);
  }
  private note<T extends FakeNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }
  createOscillator() {
    const node = this.note(new FakeSource("oscillator"));
    this.sources.push(node);
    return node;
  }
  createBufferSource() {
    const node = this.note(new FakeSource("noise"));
    this.sources.push(node);
    return node;
  }
  createGain() {
    const node = this.note(new FakeGain());
    this.gains.push(node);
    return node;
  }
  createBiquadFilter() {
    return this.note(new FakeFilter());
  }
  createStereoPanner() {
    return this.note(new FakePanner());
  }
  createConvolver() {
    return this.note(new FakeConvolver());
  }
  createDynamicsCompressor() {
    return this.note(new FakeCompressor());
  }
  createWaveShaper() {
    return this.note(new FakeShaper());
  }
  createPeriodicWave(reel: Float32Array, imaginaire: Float32Array) {
    if (reel.length !== imaginaire.length || reel.length < 2) throw new Error("onde mal formée");
    return { reel, imaginaire };
  }
  createBuffer(channels: number, length: number) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: (canal: number) => data[canal]! };
  }
  suspend() {
    this.suspended++;
    this.state = "suspended";
    return Promise.resolve();
  }
  resume() {
    this.resumed++;
    this.state = "running";
    return Promise.resolve();
  }
  /** Le temps passe : les sources dont l'heure d'arrêt est venue le font savoir. */
  avance(secondes: number) {
    this.currentTime += secondes;
    for (const s of this.sources) {
      if (s.stopAt !== null && s.stopAt <= this.currentTime && s.onended) {
        const fini = s.onended;
        s.onended = null;
        fini();
      }
    }
  }
  /** Les nœuds dont le son atteint encore la sortie. */
  relies(): FakeNode[] {
    const oui = new Set<FakeNode>([this.destination]);
    const non = new Set<FakeNode>();
    const atteint = (n: FakeNode, vus: Set<FakeNode>): boolean => {
      if (oui.has(n)) return true;
      if (non.has(n) || vus.has(n)) return false;
      vus.add(n);
      const ok = n.outputs.some((o) => atteint(o, vus));
      (ok ? oui : non).add(n);
      return ok;
    };
    return this.nodes.filter((n) => atteint(n, new Set()));
  }
}

/** Le chemin d'un nœud jusqu'à la sortie, tel qu'il a été branché à sa création. */
function chemin(node: FakeNode): FakeNode[] {
  const out: FakeNode[] = [];
  let n: FakeNode | null = node;
  while (n && n.kind !== "destination") {
    out.push(n);
    n = n.premier;
  }
  return out;
}

/**
 * Le volume d'une source à l'entrée du limiteur (ou à la sortie, s'il n'y en a pas) : la
 * crête de son enveloppe, fois tous les volumes traversés.
 */
function niveauDe(source: FakeSource): number {
  let g = 1;
  for (const n of chemin(source)) {
    if (n.kind === "compressor") break;
    if (n instanceof FakeGain) g *= n.gain.max();
  }
  return g;
}

/** Les voix : chaque source, de son départ à la fin de son enveloppe (elle s'arrête 30 ms plus tard). */
function intervalles(sources: readonly FakeSource[]): { t0: number; t1: number; source: FakeSource }[] {
  return sources
    .filter((s) => s.startAt !== null && s.stopAt !== null)
    .map((s) => ({ t0: s.startAt!, t1: s.stopAt! - 0.03, source: s }));
}

/** Le plus grand nombre de sources qui sonnent au même instant. */
function maxOverlap(sources: readonly FakeSource[]): number {
  const marks: [number, number][] = [];
  for (const v of intervalles(sources)) if (v.t1 > v.t0) marks.push([v.t0, 1], [v.t1, -1]);
  marks.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let now = 0;
  let max = 0;
  for (const [, d] of marks) {
    now += d;
    if (now > max) max = now;
  }
  return max;
}

/** L'écart d'une fréquence à la note juste la plus proche, en centièmes de demi-ton, et la classe de cette note. */
function noteDe(freq: number): { classe: number; cents: number } {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const juste = Math.round(midi);
  return { classe: ((juste % 12) + 12) % 12, cents: Math.abs(midi - juste) * 100 };
}

/** Les cinq notes des bruitages : do, ré, mi, sol, la. */
const PENTATONIQUE = [0, 2, 4, 7, 9];

// ---------------------------------------------------------------------------
// Le solfège

describe("le solfège", () => {
  it("les notes : le do du milieu vaut 60, le la du diapason 440 Hz", () => {
    expect(ton("c4")).toBe(60);
    expect(ton("a4")).toBe(69);
    expect(ton("bb3")).toBe(58);
    expect(ton("f#5")).toBe(78);
    expect(hertz(69)).toBeCloseTo(440, 6);
    expect(hertz(60)).toBeCloseTo(261.63, 1);
    expect(() => ton("h4")).toThrow();
  });

  it("une mesure écrite se lit : les notes, les silences, les durées", () => {
    expect(lis("e5:3 g5 a5:2 -:2")).toEqual([[0, 76, 3, 1], [3, 79, 1, 1], [4, 81, 2, 1]]);
    expect(lis("- bb4! c5?:2")).toEqual([[1, 70, 1, 1.25], [2, 72, 2, 0.6]]);
    expect(longueur("e5:3 g5 a5:2 -:2")).toBe(8);
    expect(() => lis("e5:3 zut")).toThrow();
  });

  it("les accords : la fondamentale d'abord, la basse à part quand l'accord est renversé", () => {
    expect(accord("C")).toEqual({ basse: 0, tons: [0, 4, 7] });
    expect(accord("Am7")).toEqual({ basse: 9, tons: [9, 0, 4, 7] });
    expect(accord("G/B")).toEqual({ basse: 11, tons: [7, 11, 2] });
    expect(accord("Bbmaj7")).toEqual({ basse: 10, tons: [10, 2, 5, 9] });
    expect(accord("Bm7b5").tons).toEqual([11, 2, 5, 9]);
    expect(accord("A5").tons).toEqual([9, 4]);
    expect(() => accord("Xyz")).toThrow();
  });

  it("un accord plaqué : des notes serrées au-dessus du plancher, la tierce et la septième d'abord", () => {
    // Sol 7 sans sa fondamentale (la basse la joue) : fa, si, ré.
    expect(plaque(accord("G7"), 64, 3)).toEqual([65, 71, 74]);
    expect(plaque(accord("C"), 64, 3)).toEqual([64, 67, 72]);
    // Une quinte à vide n'a que deux notes : elle se redouble à l'octave.
    expect(plaque(accord("A5"), 62, 3)).toEqual([64, 69, 76]);
    for (const nom of ["Dm7", "Fmaj7", "E7sus4", "Em9", "Dm9", "Cmaj7", "Bm7b5"]) {
      for (const plancher of [55, 59, 60, 62, 64]) {
        const v = plaque(accord(nom), plancher, 3);
        expect(v).toHaveLength(3);
        expect(v[2]! - v[0]!).toBeLessThanOrEqual(17);
        for (const t of v) expect(accord(nom).tons).toContain(classe(t));
        // Jamais deux notes à un demi-ton l'une de l'autre : la neuvième passe au-dessus.
        for (let i = 1; i < v.length; i++) expect([nom, plancher, v[i]! - v[i - 1]! > 1]).toEqual([nom, plancher, true]);
      }
    }
    // Mi mineur neuvième : ré, sol, et le fa dièse tout en haut (pas collé au sol).
    expect(plaque(accord("Em9"), 59, 3)).toEqual([62, 67, 78]);
    // Une basse grince sous un accord quand elle est un demi-ton sous une de ses notes.
    expect(grince(accord("Dm7"), ton("e3"))).toBe(true);
    expect(grince(accord("Dm7"), ton("c3"))).toBe(false);
    expect(grince(accord("Cmaj7"), ton("b2"))).toBe(false);
  });

  it("une phrase improvisée reste dans sa gamme, ne répète jamais une note, et se pose pour finir", () => {
    const notes = echelle(PENTATONIQUE, 69, 88);
    const alea = suite(7);
    let depart = 4;
    for (let mesure = 0; mesure < 200; mesure++) {
      const cadence = mesure % 4 === 3;
      const phrase = brode({ alea, notes, accord: accord("Am7"), pas: 12, temps: 3, depart, densite: 0.7, cadence });
      let precedente = -1;
      for (const [pas, t, duree] of phrase.notes) {
        expect(notes).toContain(t);
        expect(t).not.toBe(precedente);
        expect(pas + duree).toBeLessThanOrEqual(12);
        precedente = t;
      }
      if (cadence) {
        // La chute : une note tenue sur l'accord, puis le silence.
        const derniere = phrase.notes.at(-1)!;
        expect(derniere[2]).toBe(6);
        expect(accord("Am7").tons).toContain(classe(derniere[1]));
      }
      depart = phrase.fin;
    }
  });
});

// ---------------------------------------------------------------------------
// Les partitions, sans une note de Web Audio

interface Ecrite {
  piste: string;
  pas: number;
  ton: number;
  duree: number;
  force: number;
  glisse: number;
}

/** Les mesures d'un thème, telles qu'il les écrit. */
function ecrit(id: ThemeId, mesures: number, graine = 1): Ecrite[][] {
  const theme = THEMES[id];
  const alea = suite(graine);
  const m: Record<string, number> = {};
  const out: Ecrite[][] = [];
  for (let n = 0; n < mesures; n++) {
    const notes: Ecrite[] = [];
    const plume: Plume = {
      alea,
      m,
      n: (piste, pas, t, duree, force = 1, glisse = 0) => notes.push({ piste, pas, ton: t, duree, force, glisse }),
    };
    theme.mesure(n, plume);
    out.push(notes);
  }
  return out;
}

const dureeMesure = (id: ThemeId) => (THEMES[id].pas * 60) / THEMES[id].tempo / THEMES[id].division;

/** La signature d'une suite de mesures : deux phrases de même signature sont les mêmes à l'oreille. */
function signature(mesures: readonly Ecrite[][]): string {
  return mesures
    .map((notes) => notes.map((x) => `${x.piste}:${x.pas.toFixed(2)}:${x.ton}:${x.duree.toFixed(2)}`).sort().join(","))
    .join("|");
}

describe("les partitions", () => {
  it("dix thèmes : un par lieu, la ville, le poker", () => {
    expect([...THEME_IDS].sort()).toEqual([...PLACES.map((p) => p.id), "poker", "ville"].sort());
    expect(Object.keys(THEMES).sort()).toEqual([...THEME_IDS].sort());
    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      expect([id, theme.tempo >= 40 && theme.tempo <= 200]).toEqual([id, true]);
      expect([id, theme.pas % theme.division]).toEqual([id, 0]);
      expect([id, theme.phrase >= 4]).toEqual([id, true]);
      expect([id, Object.keys(theme.pistes).length >= 3]).toEqual([id, true]);
    }
  });

  it("chaque tonalité contient les cinq notes des bruitages : ils tombent toujours juste", () => {
    for (const id of THEME_IDS) {
      const { gamme } = THEMES[id];
      expect([id, gamme.length]).toEqual([id, 7]);
      for (const note of PENTATONIQUE) expect([id, note, gamme.includes(note)]).toEqual([id, note, true]);
    }
  });

  it("les airs écrits tombent juste : chaque mesure a son compte de pas, chaque note est dans la tonalité", () => {
    let airs = 0;
    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      for (const air of theme.airs) {
        airs++;
        for (const mesure of air) {
          expect([id, mesure, longueur(mesure)]).toEqual([id, mesure, theme.pas]);
          for (const [, t] of lis(mesure)) expect([id, mesure, theme.gamme.includes(classe(t))]).toEqual([id, mesure, true]);
        }
      }
    }
    // Huit thèmes ont des airs écrits à la main ; la Banque et la Lune sont des mécaniques.
    expect(airs).toBeGreaterThanOrEqual(20);
    expect(THEME_IDS.filter((id) => THEMES[id].airs.length > 0)).toHaveLength(8);
  });

  it("chaque mesure sonne : de la mélodie, de la basse, de l'harmonie, et rien hors de la mesure", () => {
    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      const mesures = ecrit(id, 240);
      const pistes = new Set<string>();
      mesures.forEach((notes, n) => {
        expect([id, n, notes.length > 0]).toEqual([id, n, true]);
        for (const x of notes) {
          pistes.add(x.piste);
          expect([id, n, x.piste, x.piste in theme.pistes]).toEqual([id, n, x.piste, true]);
          expect([id, n, x.piste, x.pas >= 0 && x.pas < theme.pas]).toEqual([id, n, x.piste, true]);
          expect([id, n, x.piste, x.duree > 0 && x.force > 0 && x.force <= 1.25]).toEqual([id, n, x.piste, true]);
          // Une note prise par en dessous part d'une note de la gamme, elle aussi.
          if (theme.pistes[x.piste]!.timbre.onde !== "bruit") {
            expect([id, n, x.piste, x.ton, theme.gamme.includes(classe(x.ton + x.glisse))]).toEqual([id, n, x.piste, x.ton, true]);
            expect([id, n, x.piste, x.ton >= 36 && x.ton <= 100]).toEqual([id, n, x.piste, true]);
          }
        }
      });
      // Toutes les pistes servent.
      expect([id, [...pistes].sort()]).toEqual([id, Object.keys(theme.pistes).sort()]);
    }
  });

  it("les dix thèmes sont distincts : ni le même tempo et la même mesure, ni les mêmes notes", () => {
    const allures = new Set(THEME_IDS.map((id) => `${THEMES[id].tempo}/${THEMES[id].pas}/${THEMES[id].division}`));
    expect(allures.size).toBe(THEME_IDS.length);
    const debuts = new Set(THEME_IDS.map((id) => signature(ecrit(id, 8))));
    expect(debuts.size).toBe(THEME_IDS.length);
    // Chacun a au moins un instrument que le précédent sur la Promenade n'a pas.
    const ordre: ThemeId[] = ["ville", ...PLACES.map((p) => p.id), "poker"];
    for (let i = 1; i < ordre.length; i++) {
      const avant = new Set(Object.values(THEMES[ordre[i - 1]!].pistes).map((p) => p.timbre));
      const neufs = Object.values(THEMES[ordre[i]!].pistes).filter((p) => !avant.has(p.timbre));
      expect([ordre[i], neufs.length > 0]).toEqual([ordre[i], true]);
    }
  });

  it("plus d'une minute de phrases toutes différentes, et jamais deux fois la même de suite", () => {
    for (const id of THEME_IDS) {
      const { phrase } = THEMES[id];
      const secondes = dureeMesure(id) * phrase;
      // Les quatre premières minutes, phrase par phrase.
      const nombre = Math.ceil(240 / secondes);
      const mesures = ecrit(id, nombre * phrase);
      const phrases = Array.from({ length: nombre }, (_, i) => signature(mesures.slice(i * phrase, (i + 1) * phrase)));
      const differentes = new Set(phrases).size;
      expect([id, Math.round(differentes * secondes) >= 60]).toEqual([id, true]);
      for (let i = 1; i < phrases.length; i++) expect([id, i, phrases[i] !== phrases[i - 1]]).toEqual([id, i, true]);
      // La première minute ne revient pas telle quelle dans la minute qui suit.
      const minute = Math.ceil(60 / dureeMesure(id));
      expect([id, signature(mesures.slice(0, minute)) !== signature(mesures.slice(minute, 2 * minute))]).toEqual([id, true]);
    }
  });

  it("une même graine rejoue la même musique : les tests ne dépendent pas du hasard", () => {
    for (const id of THEME_IDS) expect([id, signature(ecrit(id, 40, 5)) === signature(ecrit(id, 40, 5))]).toEqual([id, true]);
    // Et une autre graine improvise autrement, là où le thème improvise.
    expect(signature(ecrit("casino", 64, 5))).not.toBe(signature(ecrit("casino", 64, 6)));
  });
});

// ---------------------------------------------------------------------------
// Le moteur, sur un faux contexte

describe("le moteur", () => {
  let ctx: FakeContext;
  let vers: FakeGain;
  let moteur: Moteur;

  /** Le temps passe, et la minuterie du moteur bat (toutes les 150 ms). */
  const passe = (secondes: number) => {
    for (let t = 0; t < secondes - 1e-9; t += 0.05) {
      ctx.avance(0.05);
      vi.advanceTimersByTime(50);
    }
  };

  /** Les sources du thème qui joue, et celles des thèmes d'avant : on les reconnaît à leur volume de fondu. */
  const fonduDe = (source: FakeSource): FakeGain => chemin(source).filter((n): n is FakeGain => n instanceof FakeGain).at(-3)!;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeContext.made = [];
    ctx = new FakeContext();
    vers = new FakeGain();
    vers.connect(ctx.destination);
    moteur = creeMoteur({ ctx: ctx as unknown as AudioContext, vers: vers as unknown as AudioNode });
  });

  afterEach(() => {
    moteur.arret();
    passe(2);
    vi.useRealTimers();
  });

  it("tant qu'on ne lui demande rien, il ne fait rien : pas une source, pas une minuterie", () => {
    passe(3);
    expect(ctx.sources).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(moteur.etat()).toMatchObject({ theme: null, boucles: 0, voix: 0, notes: 0 });
    // Son seul nœud : le bus, branché là où on lui a dit, au niveau de la musique.
    expect(moteur.bus).toBe(ctx.gains[0]);
    expect((moteur.bus as unknown as FakeGain).outputs).toEqual([vers]);
    expect(moteur.bus.gain.value).toBe(NIVEAU);
  });

  it("chaque thème sonne : des notes écrites à l'avance, jamais dans le passé, toutes arrêtées", () => {
    for (const id of THEME_IDS) {
      const avant = ctx.sources.length;
      moteur.jouer(id);
      const t0 = ctx.currentTime;
      passe(30);
      const faites = ctx.sources.slice(avant);
      expect([id, faites.length > 20]).toEqual([id, true]);
      expect(moteur.etat().theme).toBe(id);
      for (const s of faites) {
        expect([id, s.startAt !== null && s.startAt >= t0]).toEqual([id, true]);
        expect([id, s.stopAt !== null && s.stopAt > s.startAt!]).toEqual([id, true]);
        // L'avance : jamais plus d'une seconde devant l'horloge.
        expect([id, s.startAt! <= ctx.currentTime + 1]).toEqual([id, true]);
      }
      // Les notes couvrent les trente secondes : pas de trou de plus de cinq secondes.
      const departs = faites.map((s) => s.startAt!).sort((a, b) => a - b);
      for (let i = 1; i < departs.length; i++) expect([id, departs[i]! - departs[i - 1]! < 5]).toEqual([id, true]);
      expect([id, departs.at(-1)! > t0 + 28]).toEqual([id, true]);
    }
  });

  it("chaque thème reste dans sa tonalité : toute note part d'une note juste de sa gamme", () => {
    for (const id of THEME_IDS) {
      const avant = ctx.sources.length;
      moteur.jouer(id);
      passe(120);
      const notes = ctx.sources.slice(avant).filter((s) => s.kind === "oscillator");
      expect([id, notes.length > 30]).toEqual([id, true]);
      const classes = new Set<number>();
      for (const s of notes) {
        const depart = noteDe(s.frequency.events[0]!.value);
        const arrivee = noteDe(s.frequency.events.at(-1)!.value);
        for (const n of [depart, arrivee]) {
          expect([id, n.classe, n.cents < 5]).toEqual([id, n.classe, true]);
          expect([id, n.classe, THEMES[id].gamme.includes(n.classe)]).toEqual([id, n.classe, true]);
        }
        classes.add(arrivee.classe);
        // Rien de strident, rien d'inaudible.
        const hz = s.frequency.events.at(-1)!.value;
        expect([id, Math.round(hz), hz >= 60 && hz <= 2800]).toEqual([id, Math.round(hz), true]);
      }
      // Une vraie gamme, pas trois notes.
      expect([id, classes.size >= 5]).toEqual([id, true]);
    }
  });

  it("aucune note ne claque : l'enveloppe part de zéro, monte en deux millisecondes au moins, et finit à zéro avant l'arrêt", () => {
    for (const id of THEME_IDS) {
      const avant = ctx.sources.length;
      moteur.jouer(id);
      passe(40);
      for (const s of ctx.sources.slice(avant)) {
        const enveloppe = (s.premier as FakeGain).gain.events;
        expect([id, enveloppe[0]]).toEqual([id, { kind: "set", value: 0, time: s.startAt }]);
        expect([id, enveloppe[1]!.kind]).toEqual([id, "linear"]);
        expect([id, enveloppe[1]!.time - s.startAt! >= 0.002]).toEqual([id, true]);
        const fin = enveloppe.at(-1)!;
        expect([id, fin.kind, fin.value]).toEqual([id, "linear", 0]);
        expect([id, s.stopAt! >= fin.time]).toEqual([id, true]);
        for (let i = 1; i < enveloppe.length; i++) expect([id, enveloppe[i]!.time >= enveloppe[i - 1]!.time]).toEqual([id, true]);
      }
    }
  });

  it("la musique reste sous les bruitages : chaque voix sous le plus discret des appuis, et l'ensemble sous un seul son plein", async () => {
    // Les bruitages, dans le même faux contexte : le volume de l'appui principal et celui du lien.
    vi.resetModules();
    vi.stubGlobal("window", { AudioContext: FakeContext, location: { search: "" } });
    vi.stubGlobal("document", { visibilityState: "visible" });
    const audio = await import("../src/fx/audio");
    audio.unlockAudio();
    const bruitages = FakeContext.made.at(-1)!;
    audio.playTap("texte");
    const lien = Math.max(...bruitages.sources.map(niveauDe));
    const debut = bruitages.sources.length;
    audio.playTap("principal");
    const appui = Math.max(...bruitages.sources.slice(debut).map(niveauDe));
    vi.unstubAllGlobals();
    expect(lien).toBeCloseTo(0.065 * 0.6, 6);
    expect(appui).toBeCloseTo(0.15 * 0.6, 6);

    for (const id of THEME_IDS) {
      const avant = ctx.sources.length;
      moteur.jouer(id);
      passe(90);
      const voix = intervalles(ctx.sources.slice(avant)).map((v) => ({ ...v, g: niveauDe(v.source) }));
      // Une voix seule : sous le plus discret des bruitages (le lien : 0,039).
      const plusForte = Math.max(...voix.map((v) => v.g));
      expect([id, plusForte < lien]).toEqual([id, true]);
      expect([id, plusForte > 0.004]).toEqual([id, true]);
      // Toutes les voix d'un instant, si leurs crêtes tombaient ensemble et en phase (cela
      // n'arrive pas : mesurée dans le navigateur, la crête réelle reste sous 0,06) : moins
      // que deux appuis de bouton.
      let pire = 0;
      for (const v of voix) {
        let somme = 0;
        for (const w of voix) if (w.t0 <= v.t0 && w.t1 > v.t0) somme += w.g;
        if (somme > pire) pire = somme;
      }
      expect([id, pire < 2 * appui]).toEqual([id, true]);
    }
  });

  it("jamais plus de dix voix à la fois, et aucune note passée faute de voix quand un thème joue seul", () => {
    expect(VOIX_MAX).toBe(10);
    for (const id of THEME_IDS) {
      const avant = ctx.sources.length;
      const passees = moteur.etat().passees;
      moteur.jouer(id);
      passe(180);
      const faites = ctx.sources.slice(avant);
      expect([id, maxOverlap(faites) <= VOIX_MAX]).toEqual([id, true]);
      expect([id, maxOverlap(faites) >= 3]).toEqual([id, true]);
      // Ce que le moteur compte à chaque instant le confirme.
      expect([id, moteur.etat().voix <= VOIX_MAX]).toEqual([id, true]);
      moteur.arret();
      passe(2);
      expect([id, moteur.etat().passees - passees]).toEqual([id, 0]);
    }
    // Tous thèmes confondus, fondus compris : le plafond tient.
    expect(maxOverlap(ctx.sources)).toBeLessThanOrEqual(VOIX_MAX);
  });

  it("changer de thème, c'est un fondu enchaîné : l'ancien descend à zéro, le nouveau monte de zéro", () => {
    moteur.jouer("ville");
    passe(8);
    const ville = fonduDe(ctx.sources.at(-1)!);
    expect(ville.gain.value).toBe(0);
    expect(ville.gain.events).toEqual([{ kind: "target", value: THEMES.ville.volume, time: 10 }]);

    const t = ctx.currentTime;
    const avant = ctx.sources.length;
    const ecrites = ctx.sources.filter((s) => s.startAt! > t);
    expect(ecrites.length).toBeGreaterThan(0);
    moteur.jouer("cafe");
    // L'ancien thème : son volume part d'où il est (plein, ici), tombe vite au quart, et finit
    // à zéro exactement, une seconde plus tard.
    expect(ville.gain.events.slice(-3)).toEqual([
      { kind: "set", value: expect.closeTo(THEMES.ville.volume, 6), time: t },
      { kind: "linear", value: expect.closeTo(THEMES.ville.volume / 4, 6), time: expect.closeTo(t + FONDU * 0.35, 9) },
      { kind: "linear", value: 0, time: t + FONDU },
    ]);
    // Ses notes écrites d'avance, pas encore commencées, ne sonneront pas : la place est au nouveau.
    for (const s of ecrites) {
      expect(s.stopAt).toBe(0);
      expect((s.premier as FakeGain).outputs).toEqual([]);
    }
    expect(moteur.etat()).toMatchObject({ theme: "cafe", boucles: 2 });
    passe(0.3);
    const cafe = fonduDe(ctx.sources.at(-1)!);
    expect(cafe).not.toBe(ville);
    expect(cafe.gain.value).toBe(0);
    expect(cafe.gain.events).toEqual([{ kind: "target", value: THEMES.cafe.volume, time: t }]);
    // Les deux passent par le même bus : un seul volume pour toute la musique.
    expect(chemin(ville).at(1)).toBe(moteur.bus);
    expect(chemin(cafe).at(1)).toBe(moteur.bus);

    // Une seconde plus tard, il ne reste que le nouveau : l'ancien est débranché, ses notes arrêtées.
    passe(FONDU + 0.4);
    expect(moteur.etat()).toMatchObject({ theme: "cafe", boucles: 1 });
    expect(ville.outputs).toEqual([]);
    // Aucune note de l'ancien thème ne dépasse la fin de son fondu : elle s'arrête quand son volume est à zéro.
    const anciennes = ctx.sources.slice(0, avant).filter((s) => fonduDe(s) === ville);
    for (const s of anciennes) expect(s.stopAt!).toBeLessThanOrEqual(t + FONDU + 0.03);
    // Et tout ce qui s'écrit depuis le changement est du nouveau thème.
    for (const s of ctx.sources.slice(avant)) expect(fonduDe(s)).toBe(cafe);
  });

  it("les notes tenues du thème qui part s'arrêtent à la fin de son fondu, quand son volume est à zéro : rien ne claque", () => {
    moteur.jouer("lune");
    passe(7);
    const t = ctx.currentTime;
    // Les nappes de la Lune durent huit secondes : elles sonnent encore.
    const tenues = ctx.sources.filter((s) => s.startAt! <= t && s.stopAt! > t + 2);
    expect(tenues.length).toBeGreaterThanOrEqual(3);
    moteur.jouer("ville");
    const lune = fonduDe(tenues[0]!);
    expect(lune.gain.events.at(-1)).toEqual({ kind: "linear", value: 0, time: t + FONDU });
    for (const s of tenues) {
      expect(s.stopAt!).toBeGreaterThanOrEqual(t + FONDU);
      expect(s.stopAt!).toBeLessThanOrEqual(t + FONDU + 0.03);
    }
    passe(FONDU + 0.2);
    expect(moteur.etat()).toMatchObject({ theme: "ville", boucles: 1 });
    expect(lune.outputs).toEqual([]);
  });

  it("un thème quitté au milieu de son fondu d'entrée repart du niveau où il était : pas de saut", () => {
    moteur.jouer("ville");
    passe(0.2);
    const ville = fonduDe(ctx.sources.at(-1)!);
    const t = ctx.currentTime;
    moteur.jouer("cafe");
    // Deux dixièmes de seconde après son départ, le volume en était à 55 % : c'est de là qu'il redescend.
    const ou = THEMES.ville.volume * (1 - Math.exp(-0.2 / (FONDU / 4)));
    expect(ville.gain.events.slice(-3)).toEqual([
      { kind: "set", value: expect.closeTo(ou, 6), time: t },
      { kind: "linear", value: expect.closeTo(ou / 4, 6), time: expect.closeTo(t + FONDU * 0.35, 9) },
      { kind: "linear", value: 0, time: t + FONDU },
    ]);
    // Et s'il est chassé une seconde fois (un troisième thème arrive), il repart encore de là où il est descendu.
    passe(0.1);
    const t2 = ctx.currentTime;
    moteur.jouer("lune");
    const descendu = ou * (1 - (0.75 * 0.1) / (FONDU * 0.35));
    expect(ville.gain.events.slice(-3)).toEqual([
      { kind: "set", value: expect.closeTo(descendu, 6), time: t2 },
      { kind: "linear", value: expect.closeTo(descendu / 4, 6), time: expect.closeTo(t2 + 0.15 * 0.35, 9) },
      { kind: "linear", value: 0, time: expect.closeTo(t2 + 0.15, 9) },
    ]);
    // Les volumes ne font que des trajets continus : chaque point de départ est écrit, jamais deviné par le contexte.
    for (let i = 1; i < ville.gain.events.length; i++) expect(ville.gain.events[i]!.time).toBeGreaterThanOrEqual(ville.gain.events[i - 1]!.time);
  });

  it("pas d'empilement : dix changements d'écran en trois secondes ne laissent qu'un thème, et dix voix au plus", () => {
    const tour: ThemeId[] = ["ville", "kiosque", "ville", "cafe", "poker", "ville", "lune", "casino", "ville", "yacht"];
    for (const id of tour) {
      moteur.jouer(id);
      passe(0.3);
      // Jamais trois musiques à la fois : celle qui joue, celle qui s'éteint, et à la rigueur celle d'avant, déjà presque muette.
      expect(moteur.etat().boucles).toBeLessThanOrEqual(3);
    }
    expect(moteur.etat().theme).toBe("yacht");
    passe(FONDU + 0.5);
    expect(moteur.etat().boucles).toBe(1);
    expect(maxOverlap(ctx.sources)).toBeLessThanOrEqual(VOIX_MAX);
    // Redemander le thème qui joue ne le relance pas.
    const n = ctx.sources.length;
    const etat = moteur.etat();
    moteur.jouer("yacht");
    expect(ctx.sources.length).toBe(n);
    expect(moteur.etat()).toEqual(etat);
  });

  it("un thème qu'on retrouve reprend à la phrase suivante, pas au début", () => {
    moteur.jouer("ville");
    // Onze mesures de 2,3 secondes : on est dans la deuxième phrase (huit mesures par phrase).
    passe(25);
    expect(Math.floor(moteur.etat().mesure / 8)).toBe(1);
    moteur.jouer("cafe");
    passe(4);
    moteur.jouer("ville");
    expect(moteur.etat().mesure).toBe(16);
    // Un passage éclair (moins d'une mesure) ne fait pas avancer le thème : on le retrouve où on l'a laissé.
    moteur.jouer("poker");
    passe(1);
    expect(moteur.etat().mesure).toBe(0);
    moteur.jouer("ville");
    passe(1);
    moteur.jouer("poker");
    expect(moteur.etat().mesure).toBe(0);
  });

  it("une note tenue qui n'a pas de voix attend son tour au lieu de disparaître", () => {
    // La Banque et le Yacht d'abord, puis la Lune et ses nappes longues, en plein fondu.
    moteur.jouer("yacht");
    passe(6);
    const avant = ctx.sources.length;
    moteur.jouer("lune");
    passe(12);
    const lune = ctx.sources.slice(avant).filter((s) => fonduDe(s) !== fonduDe(ctx.sources[avant - 1]!));
    // Le premier accord de la nappe : ses quatre notes sont là, tenues plus de cinq secondes.
    const nappes = lune.filter((s) => s.kind === "oscillator" && s.stopAt! - s.startAt! > 5);
    expect(nappes.length).toBeGreaterThanOrEqual(4);
    expect(maxOverlap(ctx.sources)).toBeLessThanOrEqual(VOIX_MAX);
  });

  it("le niveau d'ensemble baisse pour un grand moment, et remonte après", () => {
    moteur.jouer("ville");
    passe(2);
    const bus = moteur.bus.gain as unknown as FakeParam;
    moteur.niveau(0.4);
    expect(bus.events.at(-1)).toEqual({ kind: "target", value: NIVEAU * 0.4, time: ctx.currentTime });
    moteur.niveau(1);
    expect(bus.events.at(-1)).toEqual({ kind: "target", value: NIVEAU, time: ctx.currentTime });
    // Jamais au-dessus du niveau de la musique, quoi qu'on demande.
    moteur.niveau(7);
    expect(bus.max()).toBe(NIVEAU);
  });

  it("la page se cache : silence tout de suite, plus rien ne s'écrit ; elle revient : la musique reprend sans rafale", () => {
    moteur.jouer("kiosque");
    passe(5);
    const bus = moteur.bus.gain as unknown as FakeParam;
    moteur.pause();
    expect(bus.events.at(-1)).toEqual({ kind: "target", value: 0, time: ctx.currentTime });
    expect(moteur.etat().enPause).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    const n = ctx.sources.length;
    // Une minute en arrière-plan (ici l'horloge du contexte continue : le pire des cas).
    passe(60);
    expect(ctx.sources.length).toBe(n);

    const retour = ctx.currentTime;
    moteur.reprise();
    expect(bus.events.at(-1)).toMatchObject({ kind: "target", value: NIVEAU });
    expect(moteur.etat().enPause).toBe(false);
    passe(1);
    const reprises = ctx.sources.slice(n);
    // Rien n'est joué dans le passé, et la minute manquée n'est pas rattrapée d'un coup.
    for (const s of reprises) expect(s.startAt!).toBeGreaterThanOrEqual(retour);
    expect(reprises.length).toBeGreaterThan(0);
    expect(reprises.length).toBeLessThan(40);
  });

  it("le fil principal se fige cinq secondes : pas une note dans le passé, pas de rafale au réveil", () => {
    moteur.jouer("casino");
    passe(4);
    const n = ctx.sources.length;
    // L'horloge audio avance, la minuterie ne bat plus.
    ctx.avance(5);
    const reveil = ctx.currentTime;
    passe(0.6);
    const apres = ctx.sources.slice(n);
    expect(apres.length).toBeGreaterThan(0);
    for (const s of apres) expect(s.startAt!).toBeGreaterThanOrEqual(reveil);
    // Ce qui s'écrit dans la demi-seconde du réveil : une demi-seconde de musique, pas cinq.
    expect(apres.length).toBeLessThan(30);
  });

  it("couper la musique : un fondu bref, puis plus un nœud, plus une minuterie", () => {
    moteur.jouer("salon");
    passe(10);
    const salon = fonduDe(ctx.sources.at(-1)!);
    const t = ctx.currentTime;
    moteur.arret();
    expect(salon.gain.events.at(-1)).toEqual({ kind: "linear", value: 0, time: t + 0.25 });
    expect(moteur.etat().theme).toBeNull();
    const n = ctx.sources.length;
    passe(1);
    expect(ctx.sources.length).toBe(n);
    for (const s of ctx.sources) expect(s.stopAt!).toBeLessThanOrEqual(t + 0.6);
    expect(moteur.etat()).toMatchObject({ boucles: 0, voix: 0 });
    expect(vi.getTimerCount()).toBe(0);
    // Il ne reste de branché que le bus et la salle (la réverbération), qui servent à tous les thèmes.
    expect(ctx.relies().map((x) => x.kind).sort()).toEqual(["convolver", "gain"]);
    // Rallumée, elle reprend à la phrase suivante.
    moteur.jouer("salon");
    passe(1);
    expect(moteur.etat()).toMatchObject({ theme: "salon", boucles: 1 });
    expect(moteur.etat().mesure).toBeGreaterThanOrEqual(8);
  });

  it("dix minutes de jeu : les nœuds ne s'accumulent pas, chaque note libère les siens", () => {
    for (const id of ["ville", "casino", "lune"] as const) {
      moteur.jouer(id);
      passe(3);
      let pic = 0;
      for (let minute = 0; minute < 10; minute++) {
        for (let i = 0; i < 12; i++) {
          passe(5);
          pic = Math.max(pic, ctx.relies().length);
        }
      }
      // Dix minutes : des milliers de notes sont passées...
      expect([id, ctx.sources.length > 500]).toEqual([id, true]);
      // ... et il n'y a jamais eu plus de quelques dizaines de nœuds branchés à la fois :
      // les pistes du thème, et les notes écrites pour la demi-seconde à venir.
      expect([id, pic < 90]).toEqual([id, true]);
      expect([id, ctx.relies().length < 90]).toEqual([id, true]);
      // Toute source finie a débranché son enveloppe.
      for (const s of ctx.sources) {
        if (s.stopAt! <= ctx.currentTime) expect((s.premier as FakeGain).outputs).toEqual([]);
      }
    }
    moteur.arret();
    passe(2);
    expect(ctx.relies().map((x) => x.kind).sort()).toEqual(["convolver", "gain"]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("sans réverbération ni panoramique (un vieux navigateur), la musique joue quand même", () => {
    const vieux = new FakeContext() as unknown as Record<string, unknown>;
    vieux.createConvolver = undefined;
    vieux.createStereoPanner = undefined;
    const sortie = new FakeGain();
    sortie.connect((vieux as unknown as FakeContext).destination);
    const autre = creeMoteur({ ctx: vieux as unknown as AudioContext, vers: sortie as unknown as AudioNode });
    autre.jouer("lune");
    autre.avance();
    expect((vieux as unknown as FakeContext).sources.length).toBeGreaterThan(0);
    autre.arret();
    (vieux as unknown as FakeContext).avance(3);
    autre.avance();
    expect(autre.etat().boucles).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Le réglage

describe("le réglage « Musique »", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const avecStockage = async (contenu: string | null) => {
    const stock = new Map<string, string>();
    if (contenu !== null) stock.set("grattouille.settings", contenu);
    vi.stubGlobal("window", {
      location: { search: "" },
      localStorage: {
        getItem: (k: string) => stock.get(k) ?? null,
        setItem: (k: string, v: string) => void stock.set(k, v),
        removeItem: (k: string) => void stock.delete(k),
      },
    });
    const persist = await import("../src/app/persist");
    return { persist, stock };
  };

  it("allumée par défaut, y compris pour un joueur dont les réglages ne connaissent pas la musique", async () => {
    const neuf = await avecStockage(null);
    expect(neuf.persist.DEFAULT_SETTINGS.musique).toBe(true);
    expect(neuf.persist.loadSettings().musique).toBe(true);
    // Les réglages d'un compte de la version 2.0 : rien ne bouge, et la musique est allumée.
    const ancien = await avecStockage(JSON.stringify({ son: false, vibrations: false, calme: true, langue: "en", signes: { lucarne: "coeur" }, codeNote: true }));
    expect(ancien.persist.loadSettings()).toMatchObject({
      son: false, musique: true, vibrations: false, calme: true, langue: "en", signes: { lucarne: "coeur" }, codeNote: true,
    });
    // Une valeur de travers ne la coupe pas.
    const bizarre = await avecStockage(JSON.stringify({ musique: "non" }));
    expect(bizarre.persist.loadSettings().musique).toBe(true);
  });

  it("coupée, elle le reste ; et elle s'enregistre dans la même clé que les autres réglages", async () => {
    const { persist, stock } = await avecStockage(JSON.stringify({ son: true, musique: false }));
    expect(persist.loadSettings()).toMatchObject({ son: true, musique: false });
    persist.saveSettings({ ...persist.loadSettings(), musique: true, son: false });
    expect([...stock.keys()]).toEqual(["grattouille.settings"]);
    expect(persist.loadSettings()).toMatchObject({ son: false, musique: true });
  });

  it("son libellé existe en anglais", () => {
    expect(EN_MUSIQUE.Musique).toBe("Music");
  });
});

// ---------------------------------------------------------------------------
// Le branchement : la façade, la régie, le vrai magasin d'état et la vraie navigation

type Audio = typeof import("../src/fx/audio");
type Store = typeof import("../src/app/store");
type Nav = typeof import("../src/app/nav");
type Regie = typeof import("../src/fx/musique/regie");

const TICKET_DU = (place: string) => TICKETS.find((t) => t.place === place)!.id;

function pending(id: string, type: string): PendingTicket {
  return { id, type, gain: 0, seed: 1, at: 0 };
}

/**
 * Un joueur, avec ces tickets en attente. L'état est complété comme le jeu complète toute
 * réponse du serveur : un champ ajouté demain à l'état du joueur ne casse pas ces tests.
 */
function joueur(tickets: PendingTicket[] = []): PlayerState {
  return completeState({
    id: "p_1", pseudo: "Zabeth", species: "renard", balance: 100, pending: tickets, owned: [],
    look: {}, kiosk: false, standing: 0, fortune: 100,
    stats: { tickets: 0, winners: 0, wagered: 0, won: 0, bestGain: 0, bestTicket: null, jackpots: 0 },
    createdAt: 0, luckyIn: 60_000,
  } as unknown as PlayerState);
}

describe("le thème selon l'écran", () => {
  let regie: Regie;
  const jeu = (over: Partial<Parameters<Regie["sceneDe"]>[0]> = {}): Parameters<Regie["sceneDe"]>[0] => ({
    phase: "jeu", welcome: false, ending: false, trueEnding: false, openings: [], player: joueur(), revealed: [], ...over,
  });
  const theme = (stack: Screen[], over: Partial<Parameters<Regie["sceneDe"]>[0]> = {}) => regie.sceneDe(jeu(over), stack, stack.length - 1).theme;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("window", { location: { search: "" } });
    regie = await import("../src/fx/musique/regie");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("la ville sur les écrans principaux, écran de bienvenue compris", () => {
    for (const name of ["domaine", "promenade", "boutiques", "classement"] as const) expect(theme([{ name }])).toBe("ville");
    expect(theme([{ name: "domaine" }, { name: "reglages" }])).toBe("ville");
    expect(theme([{ name: "domaine" }, { name: "dressing" }])).toBe("ville");
    expect(theme([{ name: "domaine" }, { name: "a-gratter" }])).toBe("ville");
    expect(theme([{ name: "domaine" }, { name: "trophees" }])).toBe("ville");
    expect(theme([{ name: "boutiques" }, { name: "boutique", shop: "tailleur" as never }, { name: "fiche-article", item: "x" }])).toBe("ville");
    expect(regie.sceneDe(jeu({ phase: "bienvenue", player: null }), [{ name: "domaine" }], 0)).toMatchObject({ theme: "ville", niveau: 1 });
    // Pendant le chargement ou une panne : rien.
    expect(regie.sceneDe(jeu({ phase: "amorce" }), [{ name: "domaine" }], 0).theme).toBeNull();
    expect(regie.sceneDe(jeu({ phase: "panne" }), [{ name: "domaine" }], 0).theme).toBeNull();
  });

  it("le thème du lieu à son comptoir, et sur la fiche d'un de ses tickets", () => {
    for (const place of PLACES) {
      const comptoir: Screen[] = [{ name: "promenade" }, { name: "comptoir", place: place.id }];
      expect(theme(comptoir)).toBe(place.id);
      expect(theme([...comptoir, { name: "fiche-ticket", ticket: TICKET_DU(place.id) }])).toBe(place.id);
      // Les tickets qu'on vient de semer, par-dessus la fiche : toujours l'air du lieu.
      expect(theme([...comptoir, { name: "fiche-ticket", ticket: TICKET_DU(place.id) }, { name: "semis", ticket: TICKET_DU(place.id), rang: 1, qty: 1 }])).toBe(place.id);
    }
    // L'histoire d'un hôte, dans les Souvenirs : sur l'air de chez lui.
    const souvenirs = [{ name: "domaine" }, { name: "reglages" }, { name: "souvenirs" }] as Screen[];
    expect(theme(souvenirs)).toBe("ville");
    for (const place of PLACES) expect(theme([...souvenirs, { name: "histoire", lieu: place.id } as Screen])).toBe(place.id);
    // Tous les tickets du jeu mènent à un thème qui existe.
    for (const t of TICKETS) expect(THEME_IDS).toContain(theme([{ name: "promenade" }, { name: "fiche-ticket", ticket: t.id }]));
  });

  it("pendant qu'on gratte : le lieu du ticket en cours, pas celui d'où l'on vient", () => {
    const a = pending("t_a", TICKET_DU("kiosque"));
    const b = pending("t_b", TICKET_DU("casino"));
    const c = pending("t_c", TICKET_DU("lune"));
    const pile: Screen[] = [{ name: "domaine" }, { name: "a-gratter" }, { name: "grattage", tickets: [a, b, c] }];
    const player = joueur([a, b, c]);
    expect(theme(pile, { player })).toBe("kiosque");
    // Le premier est gratté (son résultat est à l'écran) : le suivant est du Casino.
    expect(theme(pile, { player, revealed: ["t_a"] })).toBe("casino");
    expect(theme(pile, { player, revealed: ["t_a", "t_b"] })).toBe("lune");
    // Tout est gratté, ou déjà déclaré au serveur : on reste sur le lieu du dernier.
    expect(theme(pile, { player, revealed: ["t_a", "t_b", "t_c"] })).toBe("lune");
    expect(theme(pile, { player: joueur([]) })).toBe("lune");
    // Depuis un comptoir, un ticket d'ailleurs trouvé par terre garde son propre lieu.
    expect(theme([{ name: "promenade" }, { name: "comptoir", place: "cafe" }, { name: "grattage", tickets: [a] }], { player })).toBe("kiosque");
  });

  it("le blues du poker sur tous ses écrans, feuilles comprises", () => {
    const hall: Screen[] = [{ name: "promenade" }, { name: "poker" }];
    expect(theme(hall)).toBe("poker");
    expect(theme([...hall, { name: "poker-feuille", feuille: "regles" }])).toBe("poker");
    expect(theme([...hall, { name: "poker-feuille", feuille: "defi", place: "cafe" }])).toBe("poker");
    const table: Screen[] = [...hall, { name: "poker-table", code: "ABCD" }];
    expect(theme(table)).toBe("poker");
    expect(theme([...table, { name: "poker-feuille", feuille: "accuser", seat: 2 }])).toBe("poker");
  });

  it("un grand moment : la musique s'efface à demi pour l'accueil et le carton d'un lieu, se tait pour un générique", () => {
    const ici: Screen[] = [{ name: "promenade" }, { name: "comptoir", place: "salon" }];
    const scene = (over: Partial<Parameters<Regie["sceneDe"]>[0]>) => regie.sceneDe(jeu(over), ici, 1);
    expect(scene({})).toMatchObject({ theme: "salon", niveau: 1 });
    expect(scene({ welcome: true })).toMatchObject({ theme: "salon", niveau: regie.RETRAIT });
    expect(scene({ openings: ["cercle"] })).toMatchObject({ theme: "salon", niveau: regie.RETRAIT });
    expect(scene({ ending: true }).theme).toBeNull();
    expect(scene({ trueEnding: true }).theme).toBeNull();
    expect(regie.RETRAIT).toBeGreaterThan(0.2);
    expect(regie.RETRAIT).toBeLessThan(0.6);
  });
});

describe("le branchement dans le jeu", () => {
  let audio: Audio;
  let store: Store;
  let nav: Nav;
  let musique: typeof import("../src/fx/musique");
  let document: { visibilityState: string; addEventListener: (type: string, fn: () => void) => void };
  let ecoutes: (() => void)[];
  let horloge = 100_000;

  const ctx = () => FakeContext.made[0]!;
  /** Le moteur, tel que la régie le laisse voir en bac à sable. */
  const moteur = () => (globalThis as unknown as { window: { __musique?: Moteur } }).window.__musique!;
  const reglages = (change: Partial<Store["useGame"] extends { getState(): { settings: infer S } } ? S : never>) =>
    store.useGame.setState({ settings: { ...store.useGame.getState().settings, ...change } });

  /** Le temps passe : l'horloge audio, les minuteries, l'horloge des bruitages. */
  const passe = async (secondes: number) => {
    for (let t = 0; t < secondes - 1e-9; t += 0.05) {
      FakeContext.made[0]?.avance(0.05);
      horloge += 50;
      await vi.advanceTimersByTimeAsync(50);
    }
  };
  /** Le geste du joueur, tel que src/fx/gestes.ts le signale ; puis le temps que la musique arrive. */
  const geste = async () => {
    audio.unlockAudio();
    await vi.dynamicImportSettled();
    await passe(0.2);
  };
  const va = (...stack: Screen[]) => nav.useNav.setState({ stack, index: stack.length - 1 });
  /** Les sources de la musique : celles qui ne passent pas par le bus des bruitages. */
  const deLaMusique = () => ctx().sources.filter((s) => chemin(s).includes(moteur().bus as unknown as FakeNode));

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    FakeContext.made = [];
    horloge = 100_000;
    ecoutes = [];
    document = { visibilityState: "visible", addEventListener: (type, fn) => void (type === "visibilitychange" && ecoutes.push(fn)) };
    vi.stubGlobal("window", { AudioContext: FakeContext, location: { search: "?bac-a-sable" } });
    vi.stubGlobal("document", document);
    vi.spyOn(performance, "now").mockImplementation(() => horloge);
    audio = await import("../src/fx/audio");
    store = await import("../src/app/store");
    nav = await import("../src/app/nav");
    musique = await import("../src/fx/musique");
    store.useGame.setState({ phase: "bienvenue" });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("avant le premier geste du joueur, rien : pas de contexte audio, pas de moteur chargé, pas d'avertissement du navigateur", async () => {
    musique.installMusique();
    await vi.dynamicImportSettled();
    await passe(5);
    // Changer d'écran ou de réglage n'y change rien.
    store.useGame.setState({ phase: "jeu", player: joueur() });
    va({ name: "promenade" }, { name: "comptoir", place: "cafe" });
    reglages({ musique: false });
    reglages({ musique: true });
    await vi.dynamicImportSettled();
    await passe(5);
    expect(FakeContext.made).toHaveLength(0);
    expect((globalThis as unknown as { window: { __musique?: Moteur } }).window.__musique).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("au premier geste, sur l'écran de bienvenue : le thème de la ville, dans le contexte des bruitages et derrière leur limiteur", async () => {
    musique.installMusique();
    // Posée deux fois (l'écran se remonte quand on change de langue) : une seule musique.
    musique.installMusique();
    await geste();
    expect(FakeContext.made).toHaveLength(1);
    expect(moteur().etat()).toMatchObject({ theme: "ville", boucles: 1 });
    await passe(3);
    const notes = deLaMusique();
    expect(notes.length).toBeGreaterThan(10);
    for (const s of notes) {
      // Son volume, [son filtre], le volume de sa piste, [sa place dans l'espace], le fondu
      // du thème, le bus de la musique ; puis le limiteur, son rattrapage et l'écrêteur des bruitages.
      const kinds = chemin(s).map((n) => n.kind);
      expect(kinds.slice(-4)).toEqual(["gain", "compressor", "gain", "shaper"]);
      // Elle ne passe pas par le bus des bruitages : le réglage « Son » ne la commande pas.
      expect(chemin(s)).not.toContain(ctx().gains[0]);
    }
    // D'autres gestes n'ouvrent ni un autre contexte ni une autre musique.
    await geste();
    await geste();
    expect(FakeContext.made).toHaveLength(1);
    expect(moteur().etat().boucles).toBe(1);
  });

  it("le réglage « Musique » coupe, et rallume", async () => {
    musique.installMusique();
    await geste();
    await passe(2);
    reglages({ musique: false });
    expect(moteur().etat().theme).toBeNull();
    await passe(1);
    const n = ctx().sources.length;
    expect(moteur().etat()).toMatchObject({ boucles: 0, voix: 0 });
    // Coupée, elle le reste : ni un geste, ni un changement d'écran, ni le retour sur la page ne la relancent.
    await geste();
    store.useGame.setState({ phase: "jeu", player: joueur() });
    va({ name: "promenade" }, { name: "comptoir", place: "yacht" });
    document.visibilityState = "hidden";
    ecoutes.forEach((f) => f());
    document.visibilityState = "visible";
    ecoutes.forEach((f) => f());
    await passe(3);
    expect(ctx().sources.length).toBe(n);
    expect(moteur().etat().theme).toBeNull();
    // Rallumée : le thème de l'écran où l'on est, tout de suite.
    reglages({ musique: true });
    await passe(0.2);
    expect(moteur().etat()).toMatchObject({ theme: "yacht", boucles: 1 });
    await passe(2);
    expect(ctx().sources.length).toBeGreaterThan(n);
  });

  it("musique coupée d'emblée : rien n'est chargé ; allumée plus tard, elle démarre sans autre geste", async () => {
    reglages({ musique: false });
    musique.installMusique();
    await geste();
    await passe(2);
    expect((globalThis as unknown as { window: { __musique?: Moteur } }).window.__musique).toBeUndefined();
    // Le contexte existe (les bruitages l'ont créé), mais aucune source n'est de la musique.
    audio.playTap();
    expect(ctx().sources.length).toBeGreaterThan(0);
    for (const s of ctx().sources) expect(chemin(s)).toContain(ctx().gains[0]);
    reglages({ musique: true });
    await vi.dynamicImportSettled();
    await passe(1);
    expect(moteur().etat().theme).toBe("ville");
  });

  it("indépendante du réglage « Son » : couper le son ne coupe pas la musique", async () => {
    musique.installMusique();
    await geste();
    await passe(2);
    audio.setSoundEnabled(false);
    const avant = deLaMusique().length;
    const bruitagesAvant = ctx().sources.length - avant;
    await passe(5);
    audio.playTap();
    audio.playTier("jackpot");
    // La musique continue ; les bruitages se taisent.
    expect(deLaMusique().length).toBeGreaterThan(avant);
    expect(ctx().sources.length - deLaMusique().length).toBe(bruitagesAvant);
    expect(moteur().etat().theme).toBe("ville");
    // Le bus des bruitages est muet, celui de la musique ne l'est pas.
    expect(ctx().gains[0]!.gain.events.at(-1)).toMatchObject({ kind: "linear", value: 0 });
    expect((moteur().bus.gain as unknown as FakeParam).events.every((e) => e.value > 0)).toBe(true);
    expect(moteur().bus.gain.value).toBe(NIVEAU);
  });

  it("indépendante du réglage « Son » : couper la musique ne coupe pas le son", async () => {
    musique.installMusique();
    await geste();
    await passe(1);
    reglages({ musique: false });
    await passe(1);
    const n = ctx().sources.length;
    horloge += 10_000;
    audio.playTap();
    audio.playCoin(2);
    const bruitages = ctx().sources.slice(n);
    expect(bruitages.length).toBeGreaterThan(0);
    for (const s of bruitages) expect(chemin(s)).toContain(ctx().gains[0]);
    // Le bus des bruitages n'a pas bougé.
    expect(ctx().gains[0]!.gain.value).toBe(0.6);
    expect(ctx().gains[0]!.gain.events).toEqual([]);
  });

  it("son coupé d'emblée, musique allumée : la musique ouvre elle-même le contexte au premier geste, et les bruitages restent muets", async () => {
    audio.setSoundEnabled(false);
    musique.installMusique();
    await geste();
    await passe(2);
    expect(FakeContext.made).toHaveLength(1);
    expect(moteur().etat().theme).toBe("ville");
    expect(deLaMusique().length).toBeGreaterThan(5);
    audio.playTap();
    audio.playCoin();
    expect(ctx().sources.length).toBe(deLaMusique().length);
  });

  it("son et musique coupés d'emblée : le contexte audio n'est même pas créé", async () => {
    audio.setSoundEnabled(false);
    reglages({ musique: false });
    musique.installMusique();
    await geste();
    audio.playTap();
    await passe(2);
    expect(FakeContext.made).toHaveLength(0);
  });

  it("le thème suit l'écran : un fondu à chaque changement, un seul thème à la fois", async () => {
    musique.installMusique();
    await geste();
    store.useGame.setState({ phase: "jeu", player: joueur() });
    va({ name: "domaine" });
    await passe(1.5);
    expect(moteur().etat()).toMatchObject({ theme: "ville", boucles: 1 });

    const parcours: [Screen[], ThemeId][] = [
      [[{ name: "promenade" }], "ville"],
      [[{ name: "promenade" }, { name: "comptoir", place: "kiosque" }], "kiosque"],
      [[{ name: "promenade" }, { name: "comptoir", place: "kiosque" }, { name: "fiche-ticket", ticket: TICKET_DU("kiosque") }], "kiosque"],
      [[{ name: "promenade" }, { name: "comptoir", place: "cafe" }], "cafe"],
      [[{ name: "promenade" }], "ville"],
      [[{ name: "promenade" }, { name: "poker" }], "poker"],
      [[{ name: "promenade" }, { name: "poker" }, { name: "poker-table", code: "ABCD" }], "poker"],
      [[{ name: "promenade" }, { name: "comptoir", place: "lune" }], "lune"],
      [[{ name: "boutiques" }], "ville"],
    ];
    let avant = "ville";
    for (const [stack, attendu] of parcours) {
      va(...stack);
      // La navigation se pose (un dixième de seconde), puis le fondu commence.
      await passe(0.2);
      expect(moteur().etat().theme).toBe(attendu);
      expect(moteur().etat().boucles).toBe(attendu === avant ? 1 : 2);
      await passe(FONDU + 0.5);
      expect(moteur().etat()).toMatchObject({ theme: attendu, boucles: 1 });
      avant = attendu;
    }
    expect(maxOverlap(deLaMusique())).toBeLessThanOrEqual(VOIX_MAX);
  });

  it("une navigation qui passe par un écran en un éclair ne change pas la musique", async () => {
    musique.installMusique();
    await geste();
    store.useGame.setState({ phase: "jeu", player: joueur() });
    va({ name: "promenade" }, { name: "comptoir", place: "casino" });
    await passe(2);
    expect(moteur().etat()).toMatchObject({ theme: "casino", boucles: 1 });
    // « Retour », puis aussitôt un autre comptoir : la Promenade n'est qu'un passage.
    va({ name: "domaine" });
    va({ name: "promenade" });
    await passe(0.05);
    va({ name: "promenade" }, { name: "comptoir", place: "casino" });
    await passe(0.5);
    expect(moteur().etat()).toMatchObject({ theme: "casino", boucles: 1 });
  });

  it("une pile de tickets de plusieurs lieux, grattée en rafale : la musique ne zappe pas", async () => {
    musique.installMusique();
    await geste();
    const tickets = Array.from({ length: 8 }, (_, i) => pending(`t_${i}`, TICKET_DU(i % 2 === 0 ? "kiosque" : "salon")));
    store.useGame.setState({ phase: "jeu", player: joueur(tickets) });
    va({ name: "domaine" }, { name: "a-gratter" }, { name: "grattage", tickets });
    await passe(2);
    expect(moteur().etat()).toMatchObject({ theme: "kiosque", boucles: 1 });
    // Un ticket toutes les demi-secondes, d'un lieu puis de l'autre.
    for (let i = 0; i < 7; i++) {
      store.useGame.setState({ revealed: tickets.slice(0, i + 1).map((t) => t.id) });
      await passe(0.5);
      expect(moteur().etat()).toMatchObject({ theme: "kiosque", boucles: 1 });
    }
    // La pile s'arrête sur un ticket du Salon : au bout d'une seconde et demie, son thème arrive.
    await passe(1.6);
    expect(moteur().etat().theme).toBe("salon");
  });

  it("un grand moment : la musique s'efface à demi, puis revient ; un générique se joue dans le silence", async () => {
    musique.installMusique();
    await geste();
    store.useGame.setState({ phase: "jeu", player: joueur(), welcome: true });
    va({ name: "domaine" });
    await passe(0.5);
    const bus = moteur().bus.gain as unknown as FakeParam;
    expect(moteur().etat().theme).toBe("ville");
    expect(bus.events.at(-1)!.value).toBeCloseTo(NIVEAU * 0.4, 9);
    store.useGame.setState({ welcome: false });
    await passe(0.5);
    expect(bus.events.at(-1)!.value).toBe(NIVEAU);
    // Un lieu ouvre : même retrait, le thème ne change pas.
    store.useGame.setState({ openings: ["cafe"] });
    await passe(0.5);
    expect(moteur().etat()).toMatchObject({ theme: "ville", boucles: 1 });
    expect(bus.events.at(-1)!.value).toBeCloseTo(NIVEAU * 0.4, 9);
    store.useGame.setState({ openings: [] });
    // Le générique : silence, puis la musique revient quand il se referme.
    store.useGame.setState({ ending: true });
    await passe(0.5);
    expect(moteur().etat().theme).toBeNull();
    await passe(2);
    expect(moteur().etat()).toMatchObject({ boucles: 0, voix: 0 });
    store.useGame.setState({ ending: false });
    await passe(0.5);
    expect(moteur().etat()).toMatchObject({ theme: "ville", boucles: 1 });
    expect(bus.events.at(-1)!.value).toBe(NIVEAU);
  });

  it("la page est cachée : tout se tait, plus rien ne s'écrit ; elle revient : la musique reprend, même son coupé", async () => {
    musique.installMusique();
    await geste();
    await passe(2);
    audio.setSoundEnabled(false);
    const bus = moteur().bus.gain as unknown as FakeParam;
    // Ce que fait le jeu quand la page se cache (src/app/store.ts), puis ce que fait la régie.
    document.visibilityState = "hidden";
    audio.suspendAudio();
    ecoutes.forEach((f) => f());
    expect(ctx().state).toBe("suspended");
    expect(bus.events.at(-1)).toMatchObject({ kind: "target", value: 0 });
    expect(moteur().etat().enPause).toBe(true);
    const n = ctx().sources.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(ctx().sources.length).toBe(n);
    // Un changement d'écran pendant ce temps (une réponse du serveur) ne réveille rien.
    store.useGame.setState({ phase: "jeu", player: joueur() });
    va({ name: "promenade" }, { name: "comptoir", place: "banque" });
    await vi.advanceTimersByTimeAsync(2_000);
    expect(ctx().state).toBe("suspended");
    expect(moteur().etat().enPause).toBe(true);

    // Le retour : les bruitages ne réveillent pas le contexte (le son est coupé), la musique si.
    document.visibilityState = "visible";
    audio.resumeAudio();
    expect(ctx().state).toBe("suspended");
    ecoutes.forEach((f) => f());
    expect(ctx().state).toBe("running");
    expect(moteur().etat().enPause).toBe(false);
    expect(bus.events.at(-1)).toMatchObject({ kind: "target", value: NIVEAU });
    await passe(2);
    expect(moteur().etat().theme).toBe("banque");
    expect(ctx().sources.length).toBeGreaterThan(n);
  });

  it("un contexte que le navigateur a endormi se réveille au geste suivant, même son coupé", async () => {
    musique.installMusique();
    await geste();
    audio.setSoundEnabled(false);
    ctx().state = "suspended";
    const reveils = ctx().resumed;
    audio.unlockAudio();
    expect(ctx().resumed).toBe(reveils + 1);
    expect(ctx().state).toBe("running");
  });

  it("sans Web Audio, ou avec un contexte qui refuse de naître : le jeu continue, sans musique et sans erreur", async () => {
    class Casse {
      constructor() {
        throw new Error("NotSupportedError");
      }
    }
    for (const fenetre of [{ location: { search: "" } }, { AudioContext: Casse, location: { search: "" } }]) {
      vi.resetModules();
      vi.stubGlobal("window", fenetre);
      const a = await import("../src/fx/audio");
      const s = await import("../src/app/store");
      const n = await import("../src/app/nav");
      const m = await import("../src/fx/musique");
      s.useGame.setState({ phase: "jeu", player: joueur() });
      m.installMusique();
      expect(() => a.unlockAudio()).not.toThrow();
      await vi.dynamicImportSettled();
      await vi.advanceTimersByTimeAsync(500);
      n.useNav.setState({ stack: [{ name: "promenade" }, { name: "comptoir", place: "cafe" }], index: 1 });
      s.useGame.setState({ settings: { ...s.useGame.getState().settings, musique: false } });
      s.useGame.setState({ settings: { ...s.useGame.getState().settings, musique: true } });
      expect(() => a.unlockAudio()).not.toThrow();
      await vi.advanceTimersByTimeAsync(3_000);
      expect(a.partage.sortie()).toBeNull();
    }
  });

  it("la musique ne fait jamais taire un bruitage : une panne chez elle ne remonte pas jusqu'au geste", () => {
    audio.partage.auGeste(() => {
      throw new Error("la musique est en panne");
    });
    let appels = 0;
    const oublie = audio.partage.auGeste(() => void appels++);
    expect(() => audio.unlockAudio()).not.toThrow();
    audio.playTap();
    expect(ctx().sources.length).toBeGreaterThan(0);
    expect(appels).toBe(1);
    oublie();
    audio.unlockAudio();
    expect(appels).toBe(1);
  });
});
