// Les sons (src/fx/audio.ts) : sans Web Audio (ici, Node), chaque fonction ne fait rien,
// sans erreur et sans rien laisser derrière elle. Avec un faux Web Audio, on vérifie ce
// que la recette ne peut pas entendre : le réglage « Son » coupe tout, un même son ne se
// redéclenche pas dix fois par seconde, jamais trop de voix à la fois, la sortie passe
// par un limiteur, un son d'interface dure moins de 200 ms, et les notes sortent toutes
// de la même gamme pentatonique.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Tier } from "../shared/rules";

type Audio = typeof import("../src/fx/audio");

const TIERS: readonly Tier[] = ["perdu", "rembourse", "petit", "joli", "gros", "enorme", "jackpot"];

/** Tous les sons du jeu : un nom lisible, et l'appel. */
function calls(audio: Audio): [string, () => void][] {
  return [
    ["playTap principal", () => audio.playTap()],
    ["playTap secondaire", () => audio.playTap("secondaire")],
    ["playTap texte", () => audio.playTap("texte")],
    ["playClick", () => audio.playClick(2)],
    ["playClick retour", () => audio.playClick(-1)],
    ["playSheet ouvre", () => audio.playSheet(true)],
    ["playSheet ferme", () => audio.playSheet(false)],
    ["playToggle allume", () => audio.playToggle(true)],
    ["playToggle éteint", () => audio.playToggle(false)],
    ["playRefuse", () => audio.playRefuse()],
    ["playTicketBought 1", () => audio.playTicketBought()],
    ["playTicketBought 5", () => audio.playTicketBought(5)],
    ["playTicketBought 10", () => audio.playTicketBought(10)],
    ["playCashRegister", () => audio.playCashRegister()],
    ["playStars", () => audio.playStars(40)],
    ["playCoin", () => audio.playCoin(3)],
    ["playReveal", () => audio.playReveal()],
    ["playReveal carte", () => audio.playReveal("carte")],
    ["playReveal dé", () => audio.playReveal("de")],
    ["playReveal lettre", () => audio.playReveal("lettre")],
    ["playMatch", () => audio.playMatch(1)],
    ["playDice", () => audio.playDice()],
    ["playLetter", () => audio.playLetter()],
    ["playPawnStep", () => audio.playPawnStep(4)],
    ["playSweep", () => audio.playSweep()],
    ["playStamp", () => audio.playStamp()],
    ...TIERS.map((tier): [string, () => void] => [`playTier ${tier}`, () => audio.playTier(tier)]),
    ...TIERS.map((tier): [string, () => void] => [`playTier ${tier}, en rafale`, () => audio.playTier(tier, true)]),
    ["playSparkle", () => audio.playSparkle()],
    ["playPickUp", () => audio.playPickUp()],
    ["playGull", () => audio.playGull()],
    ["playChirp", () => audio.playChirp()],
    ["playChapter", () => audio.playChapter()],
    ["playOpening", () => audio.playOpening()],
    ["playKeys", () => audio.playKeys()],
    ["playConfession", () => audio.playConfession()],
    ["playTicketDrop", () => audio.playTicketDrop()],
    ["playCardDeal", () => audio.playCardDeal()],
    ["playCardFlip", () => audio.playCardFlip()],
    ["playChip", () => audio.playChip()],
    ["playChip 4", () => audio.playChip(4)],
    ["playKnock", () => audio.playKnock()],
    ["playFold", () => audio.playFold()],
    ["playSleight", () => audio.playSleight()],
    ["playAccuse", () => audio.playAccuse()],
    ["playUnmasked", () => audio.playUnmasked()],
    ["playInnocent", () => audio.playInnocent()],
    ["playPot", () => audio.playPot()],
  ];
}

/** Ce que le module exporte, hors des sons : le réglage, le contexte, le grattage. */
const PLUMBING = ["setSoundEnabled", "unlockAudio", "suspendAudio", "resumeAudio", "scratchMove", "scratchEnd"];

// ---------------------------------------------------------------------------
// Sans Web Audio

describe("sans Web Audio (Node)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("le module se charge sans fenêtre, et n'en fabrique pas", async () => {
    expect(typeof window).toBe("undefined");
    const audio = await import("../src/fx/audio");
    expect(typeof audio.playTap).toBe("function");
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  it("la liste des sons du test est complète : aucune fonction exportée n'y échappe", async () => {
    const audio = await import("../src/fx/audio");
    const exported = Object.keys(audio).filter((name) => typeof (audio as Record<string, unknown>)[name] === "function");
    const tested = new Set<string>(PLUMBING);
    const source = calls(audio).map(([, call]) => call.toString());
    for (const name of exported) if (source.some((text) => text.includes(`audio.${name}(`))) tested.add(name);
    expect(exported.filter((name) => !tested.has(name))).toEqual([]);
    // Les noms que les écrans du poker attendent, tels que le cahier des charges les donne.
    for (const name of ["playCardDeal", "playCardFlip", "playChip", "playKnock", "playFold", "playSleight", "playAccuse", "playUnmasked", "playInnocent", "playPot"]) {
      expect([name, exported.includes(name)]).toEqual([name, true]);
    }
  });

  it("chaque fonction s'appelle sans erreur, son allumé ou coupé, et ne laisse aucune minuterie", async () => {
    const audio = await import("../src/fx/audio");
    const globalsBefore = Object.keys(globalThis).sort();
    for (const on of [true, false, true]) {
      expect(() => audio.setSoundEnabled(on)).not.toThrow();
      expect(() => audio.unlockAudio()).not.toThrow();
      for (const [name, call] of calls(audio)) expect(call, name).not.toThrow();
      expect(() => audio.scratchMove(1.2)).not.toThrow();
      expect(() => audio.scratchMove(0)).not.toThrow();
      expect(() => audio.scratchEnd()).not.toThrow();
      expect(() => audio.suspendAudio()).not.toThrow();
      expect(() => audio.resumeAudio()).not.toThrow();
    }
    expect(vi.getTimerCount()).toBe(0);
    expect(Object.keys(globalThis).sort()).toEqual(globalsBefore);
  });

  it("des arguments de travers ne font rien de pire", async () => {
    const audio = await import("../src/fx/audio");
    const odd = [Number.NaN, -1, 1e9, Number.POSITIVE_INFINITY, 0.5];
    for (const n of odd) {
      expect(() => audio.playCoin(n)).not.toThrow();
      expect(() => audio.playStars(n)).not.toThrow();
      expect(() => audio.playMatch(n)).not.toThrow();
      expect(() => audio.playClick(n)).not.toThrow();
      expect(() => audio.playChip(n)).not.toThrow();
      expect(() => audio.playPawnStep(n)).not.toThrow();
      expect(() => audio.playTicketBought(n)).not.toThrow();
      expect(() => audio.scratchMove(n)).not.toThrow();
    }
    expect(() => audio.playTier("inconnu" as Tier)).not.toThrow();
    expect(() => audio.playReveal("inconnu" as never)).not.toThrow();
    expect(() => audio.playTap("inconnu" as never)).not.toThrow();
    audio.scratchEnd();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("une fenêtre sans AudioContext (vieux navigateur) : rien non plus", async () => {
    vi.stubGlobal("window", { location: { search: "" } });
    vi.stubGlobal("document", { visibilityState: "visible" });
    try {
      const audio = await import("../src/fx/audio");
      for (const [name, call] of calls(audio)) expect(call, name).not.toThrow();
      audio.scratchMove(1);
      audio.scratchEnd();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("un AudioContext qui refuse de naître ne casse rien", async () => {
    class Broken {
      constructor() {
        throw new Error("NotSupportedError");
      }
    }
    vi.stubGlobal("window", { AudioContext: Broken, location: { search: "" } });
    vi.stubGlobal("document", { visibilityState: "visible" });
    try {
      const audio = await import("../src/fx/audio");
      for (const [name, call] of calls(audio)) expect(call, name).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

// ---------------------------------------------------------------------------
// Avec un faux Web Audio

interface ParamEvent {
  kind: string;
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
  setTargetAtTime(value: number, time: number) {
    this.events.push({ kind: "target", value, time });
    return this;
  }
  cancelScheduledValues(time: number) {
    this.events = this.events.filter((e) => e.time < time);
    return this;
  }
}

class FakeNode {
  outputs: FakeNode[] = [];
  constructor(readonly kind: string) {}
  connect(node: FakeNode) {
    this.outputs.push(node);
    return node;
  }
  disconnect() {
    this.outputs = [];
  }
}

class FakeSource extends FakeNode {
  frequency = new FakeParam();
  type = "sine";
  buffer: unknown = null;
  loop = false;
  startAt: number | null = null;
  stopAt: number | null = null;
  start(time = 0) {
    if (this.startAt !== null) throw new Error("une source ne démarre qu'une fois");
    this.startAt = time;
  }
  stop(time = 0) {
    this.stopAt = time;
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
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  compressors: FakeCompressor[] = [];
  shapers: FakeShaper[] = [];
  suspended = 0;
  resumed = 0;
  constructor() {
    FakeContext.made.push(this);
  }
  createOscillator() {
    const node = new FakeSource("oscillator");
    this.sources.push(node);
    return node;
  }
  createBufferSource() {
    const node = new FakeSource("noise");
    this.sources.push(node);
    return node;
  }
  createGain() {
    const node = new FakeGain();
    this.gains.push(node);
    return node;
  }
  createBiquadFilter() {
    return new FakeFilter();
  }
  createDynamicsCompressor() {
    const node = new FakeCompressor();
    this.compressors.push(node);
    return node;
  }
  createWaveShaper() {
    const node = new FakeShaper();
    this.shapers.push(node);
    return node;
  }
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
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
}

/** Vrai si le son de `node` atteint la sortie, et par où il passe. */
function pathToDestination(node: FakeNode, seen = new Set<FakeNode>()): string[] | null {
  if (node.kind === "destination") return ["destination"];
  if (seen.has(node)) return null;
  seen.add(node);
  for (const next of node.outputs) {
    const rest = pathToDestination(next, seen);
    if (rest) return [node.kind, ...rest];
  }
  return null;
}

/** Le plus grand nombre de sources qui sonnent au même instant. */
function maxOverlap(sources: readonly FakeSource[]): number {
  const marks: [number, number][] = [];
  for (const s of sources) {
    if (s.startAt === null || s.stopAt === null) continue;
    // La source s'arrête 20 ms après son extinction : c'est l'extinction qui compte.
    marks.push([s.startAt, 1], [s.stopAt - 0.02, -1]);
  }
  marks.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let now = 0;
  let max = 0;
  for (const [, d] of marks) {
    now += d;
    if (now > max) max = now;
  }
  return max;
}

/** L'écart d'une fréquence à la gamme pentatonique de do (do, ré, mi, sol, la), en centièmes de demi-ton. */
function centsOffScale(freq: number): number {
  const semis = 12 * Math.log2(freq / 261.6256);
  const inOctave = ((semis % 12) + 12) % 12;
  return Math.min(...[0, 2, 4, 7, 9, 12].map((degree) => Math.abs(inOctave - degree))) * 100;
}

describe("avec un faux Web Audio", () => {
  let audio: Audio;
  let now = 100_000;

  /** Le contexte du module (il n'y en a jamais qu'un). */
  const ctx = () => FakeContext.made[0]!;
  /** L'horloge du jeu avance : assez pour que n'importe quel son puisse repartir. */
  const later = (ms = 10_000) => {
    now += ms;
    if (FakeContext.made[0]) FakeContext.made[0].currentTime += ms / 1000;
  };
  /** Les sources créées par `call`, à un moment où rien d'autre ne sonne. */
  const sourcesOf = (call: () => void): FakeSource[] => {
    later();
    const before = FakeContext.made[0]?.sources.length ?? 0;
    call();
    return ctx().sources.slice(before);
  };

  beforeEach(async () => {
    vi.resetModules();
    FakeContext.made = [];
    now = 100_000;
    vi.stubGlobal("window", { AudioContext: FakeContext, location: { search: "?bac-a-sable" } });
    vi.stubGlobal("document", { visibilityState: "visible" });
    vi.spyOn(performance, "now").mockImplementation(() => now);
    audio = await import("../src/fx/audio");
  });

  /** Le premier geste du joueur : sans lui, le module ne démarre aucun son. */
  const geste = () => audio.unlockAudio();

  it("avant le premier geste du joueur, rien ne démarre : pas de contexte, pas d'avertissement du navigateur", () => {
    audio.playTap();
    audio.playSparkle();
    audio.playTier("jackpot");
    expect(FakeContext.made).toHaveLength(0);
    geste();
    audio.playTap();
    expect(FakeContext.made).toHaveLength(1);
    expect(FakeContext.made[0]!.sources.length).toBeGreaterThan(0);
  });

  afterEach(() => {
    audio.scratchEnd();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("le contexte ne naît qu'au premier son, une seule fois, et sa sortie passe par le limiteur", () => {
    expect(FakeContext.made.length).toBe(0);
    audio.unlockAudio();
    audio.playTap();
    later();
    audio.playCoin();
    expect(FakeContext.made.length).toBe(1);
    expect(ctx().compressors.length).toBe(1);
    expect(ctx().shapers.length).toBe(1);
    // Chaque voix rejoint la sortie par : son volume, le bus, le limiteur, son rattrapage, l'écrêteur.
    for (const source of ctx().sources) {
      const path = pathToDestination(source);
      expect(path).not.toBeNull();
      expect(path!.slice(-5)).toEqual(["gain", "compressor", "gain", "shaper", "destination"]);
    }
    // Le limiteur ne travaille qu'en haut de l'échelle, et l'écrêteur ne laisse rien dépasser.
    const limiter = ctx().compressors[0]!;
    expect(limiter.threshold.value).toBeLessThanOrEqual(-3);
    expect(limiter.ratio.value).toBeGreaterThanOrEqual(12);
    const curve = ctx().shapers[0]!.curve!;
    expect(Math.max(...curve)).toBeLessThan(1);
    expect(Math.min(...curve)).toBeGreaterThan(-1);
    // Sous le seuil, la courbe ne change rien au son.
    const mid = (curve.length - 1) / 2;
    expect(curve[mid]).toBeCloseTo(0, 6);
    expect(curve[Math.round(mid * 1.5)]).toBeCloseTo(0.5, 3);
  });

  it("chaque son fait sonner au moins une voix, à des volumes et des hauteurs raisonnables", () => {
    geste();
    for (const [name, call] of calls(audio)) {
      const made = sourcesOf(call);
      expect([name, made.length > 0]).toEqual([name, true]);
      for (const source of made) {
        expect([name, source.startAt !== null && source.startAt >= ctx().currentTime]).toEqual([name, true]);
        expect([name, source.stopAt !== null && source.stopAt > source.startAt!]).toEqual([name, true]);
        if (source.kind === "oscillator") {
          for (const e of source.frequency.events) {
            expect([name, Number.isFinite(e.value) && e.value >= 60 && e.value <= 5000]).toEqual([name, true]);
          }
        }
      }
    }
    // Aucun volume ne dépasse 0,35 : les sons restent ronds, et loin de la saturation.
    for (const gain of ctx().gains) {
      for (const e of gain.gain.events) expect(e.value).toBeLessThanOrEqual(0.6);
    }
    const voices = ctx().gains.filter((g) => g.gain.events.some((e) => e.kind === "exp"));
    for (const g of voices) expect(Math.max(...g.gain.events.map((e) => e.value))).toBeLessThanOrEqual(0.35);
  });

  it("le réglage « Son » coupe tout : aucune source, aucune minuterie, et plus de grattage", () => {
    geste();
    audio.playTap();
    audio.scratchMove(1);
    const before = ctx().sources.length;
    audio.setSoundEnabled(false);
    later();
    for (const [, call] of calls(audio)) call();
    audio.scratchMove(2);
    audio.unlockAudio();
    expect(ctx().sources.length).toBe(before);
    expect(FakeContext.made.length).toBe(1);
    // Le bus se tait (après avoir laissé finir le son de l'interrupteur) ; il revient quand on rallume.
    const bus = ctx().gains[0]!;
    expect(bus.gain.events.at(-1)).toMatchObject({ kind: "linear", value: 0 });
    audio.setSoundEnabled(true);
    expect(bus.gain.events.at(-1)).toMatchObject({ kind: "set", value: 0.6 });
    later();
    audio.playTap();
    expect(ctx().sources.length).toBeGreaterThan(before);
  });

  it("son coupé d'emblée : le contexte audio n'est même pas créé", () => {
    audio.setSoundEnabled(false);
    audio.unlockAudio();
    for (const [, call] of calls(audio)) call();
    audio.scratchMove(1);
    expect(FakeContext.made.length).toBe(0);
  });

  it("un même son ne se redéclenche pas dix fois par seconde", () => {
    geste();
    const window = globalThis as unknown as { window: { __sons: string[] } };
    for (const [name, call] of calls(audio)) {
      later();
      const sons = window.window.__sons;
      const before = sons.length;
      // Vingt-cinq appels en une seconde, un toutes les 40 ms.
      for (let i = 0; i < 25; i++) {
        call();
        now += 40;
      }
      const played = sons.length - before;
      expect([name, played >= 1 && played <= 9]).toEqual([name, true]);
    }
  });

  it("jamais plus de seize voix à la fois, même quand tout sonne en même temps", () => {
    geste();
    audio.unlockAudio();
    later();
    const before = ctx().sources.length;
    // Tous les sons du jeu au même instant, trois fois de suite à 200 ms d'écart.
    for (let round = 0; round < 3; round++) {
      for (const [, call] of calls(audio)) call();
      later(200);
    }
    const made = ctx().sources.slice(before);
    expect(made.length).toBeGreaterThan(16);
    expect(maxOverlap(made)).toBeLessThanOrEqual(16);
    // La fanfare du jackpot, seule, tient dans ce plafond sans rien perdre.
    const fanfare = sourcesOf(() => audio.playTier("jackpot"));
    expect(fanfare.length).toBeGreaterThanOrEqual(55);
    expect(maxOverlap(fanfare)).toBeLessThanOrEqual(16);
  });

  it("un son d'interface dure moins de 200 ms", () => {
    geste();
    const ui: [string, () => void][] = [
      ["appui principal", () => audio.playTap()],
      ["appui secondaire", () => audio.playTap("secondaire")],
      ["lien", () => audio.playTap("texte")],
      ["déclic", () => audio.playClick(1)],
      ["retour", () => audio.playClick(-1)],
      ["feuille qui s'ouvre", () => audio.playSheet(true)],
      ["feuille qui se ferme", () => audio.playSheet(false)],
      ["interrupteur allumé", () => audio.playToggle(true)],
      ["interrupteur éteint", () => audio.playToggle(false)],
      ["refus", () => audio.playRefuse()],
      ["case révélée", () => audio.playReveal()],
      ["pion", () => audio.playPawnStep(2)],
    ];
    for (const [name, call] of ui) {
      const made = sourcesOf(call);
      const t0 = ctx().currentTime;
      // La source s'arrête 20 ms après la fin de son extinction.
      const end = Math.max(...made.map((s) => s.stopAt! - 0.02));
      expect([name, end - t0 <= 0.2 + 1e-9]).toEqual([name, true]);
    }
  });

  it("la fanfare du jackpot dure deux secondes, et la fête garde ses pièces jusqu'au bout", () => {
    geste();
    const made = sourcesOf(() => audio.playTier("jackpot"));
    const t0 = ctx().currentTime;
    const notes = made.filter((s) => s.kind === "oscillator" && s.type === "sawtooth");
    // Le thème (la voix de cuivre) : dix notes, la dernière s'éteint un peu après deux secondes.
    expect(notes.length).toBe(10);
    const themeEnd = Math.max(...notes.map((s) => s.stopAt!)) - t0;
    expect(themeEnd).toBeGreaterThan(1.9);
    expect(themeEnd).toBeLessThan(2.6);
    const end = Math.max(...made.map((s) => s.stopAt!)) - t0;
    expect(end).toBeGreaterThan(3);
    expect(end).toBeLessThan(4);
    // Les cinq paliers de gain s'enrichissent : de plus en plus de voix, du petit gain au jackpot.
    const sizes = (["petit", "joli", "gros", "enorme", "jackpot"] as const).map((tier) => sourcesOf(() => audio.playTier(tier)).length);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThan(sizes[i - 1]!);
    // Un ticket perdu ou remboursé reste plus sobre que le plus petit des gains.
    expect(sourcesOf(() => audio.playTier("perdu")).length).toBeLessThanOrEqual(sizes[0]!);
    expect(sourcesOf(() => audio.playTier("rembourse")).length).toBeLessThanOrEqual(sizes[0]!);
  });

  it("une même gamme pentatonique pour toutes les notes", () => {
    geste();
    const musical: [string, () => void][] = [
      ...[0, 1, 2, 3, 4, 5, 6].map((step): [string, () => void] => [`pièce ${step}`, () => audio.playCoin(step)]),
      ["étoiles", () => audio.playStars(8)],
      ["interrupteur", () => audio.playToggle(true)],
      ["combinaison", () => audio.playMatch(0)],
      ["combinaison haute", () => audio.playMatch(2)],
      ["lettre", () => audio.playLetter()],
      ["chapitre", () => audio.playChapter()],
      ["ouverture", () => audio.playOpening()],
      ["aveu", () => audio.playConfession()],
      ["scintillement", () => audio.playSparkle()],
      ["innocent", () => audio.playInnocent()],
      ...TIERS.map((tier): [string, () => void] => [`palier ${tier}`, () => audio.playTier(tier)]),
    ];
    for (const [name, call] of musical) {
      const notes = sourcesOf(call).filter((s) => s.kind === "oscillator");
      expect([name, notes.length > 0]).toEqual([name, true]);
      for (const note of notes) {
        // La note de départ de chaque oscillateur (pas les glissés) : à moins de cinq centièmes de la gamme.
        const freq = note.frequency.events[0]!.value;
        expect([name, Math.round(freq), centsOffScale(freq) < 5]).toEqual([name, Math.round(freq), true]);
      }
    }
  });

  it("les pièces montent avec le compte, sans jamais redescendre", () => {
    geste();
    const pitches = [0, 1, 2, 3, 4, 5, 6, 7, 20].map((step) => sourcesOf(() => audio.playCoin(step))[0]!.frequency.events[0]!.value);
    for (let i = 1; i < pitches.length; i++) expect(pitches[i]).toBeGreaterThanOrEqual(pitches[i - 1]!);
    expect(pitches[6]).toBeGreaterThan(pitches[0]! * 1.9);
    // Au-delà du dernier degré, la hauteur ne grimpe plus : rien de strident.
    expect(pitches.at(-1)).toBe(pitches[6]);
    expect(Math.max(...pitches)).toBeLessThan(2500);
  });

  it("un carnet s'imprime plus longtemps qu'un ticket, et une étoile vaut une note (huit au plus)", () => {
    geste();
    const one = sourcesOf(() => audio.playTicketBought(1)).length;
    const five = sourcesOf(() => audio.playTicketBought(5)).length;
    const ten = sourcesOf(() => audio.playTicketBought(10)).length;
    expect(five).toBeGreaterThan(one);
    expect(ten).toBeGreaterThan(five);
    const stars = (n: number) => new Set(sourcesOf(() => audio.playStars(n)).map((s) => s.startAt)).size;
    expect(stars(1)).toBe(1);
    expect(stars(3)).toBe(3);
    expect(stars(8)).toBe(8);
    expect(stars(500)).toBe(8);
    expect(sourcesOf(() => audio.playStars(0)).length).toBe(0);
  });

  it("le grattage : une seule source qui tourne, coupée quand le doigt se lève", () => {
    geste();
    audio.unlockAudio();
    vi.useFakeTimers();
    try {
      later();
      const before = ctx().sources.length;
      audio.scratchMove(1);
      audio.scratchMove(2);
      audio.scratchMove(0.5);
      const made = ctx().sources.slice(before);
      expect(made.length).toBe(1);
      expect(made[0]!.loop).toBe(true);
      expect(made[0]!.stopAt).toBeNull();
      audio.scratchEnd();
      expect(made[0]!.stopAt).not.toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("le contexte se suspend quand la page se cache, et reprend quand elle revient", () => {
    geste();
    audio.playTap();
    audio.suspendAudio();
    expect(ctx().suspended).toBe(1);
    expect(ctx().state).toBe("suspended");
    audio.resumeAudio();
    expect(ctx().resumed).toBe(1);
    // Page cachée : un son demandé ne réveille pas le contexte.
    audio.suspendAudio();
    (globalThis as unknown as { document: { visibilityState: string } }).document.visibilityState = "hidden";
    later();
    audio.playCoin();
    expect(ctx().resumed).toBe(1);
    // Son coupé : revenir sur la page ne le relance pas non plus.
    audio.setSoundEnabled(false);
    audio.resumeAudio();
    expect(ctx().resumed).toBe(1);
  });
});
