// Tous les sons sont synthétisés avec Web Audio : aucun fichier audio (BRIEF.md, section 14.2).
//
// Une famille, pas une collection : une petite boîte à musique de bord de mer. Toutes
// les notes sortent de la même gamme pentatonique (do, ré, mi, sol, la), les timbres
// sont ronds (sinus et triangles, une attaque jamais sèche), un son d'interface dure
// moins de 200 ms.
//
// La sortie : toutes les voix passent par un même bus (volume général 0,6), puis un
// limiteur et un écrêteur doux. Les sons se superposent donc sans jamais saturer.
// Pas plus de quelques voix à la fois (`VOIX_MAX`), et un même son ne se redéclenche
// pas dix fois par seconde (`ECART_MIN`).
//
// Le réglage « Son » coupe tout. Le contexte démarre au premier toucher et se suspend
// quand l'application passe en arrière-plan. Sans Web Audio (un vieux navigateur, un
// test sous Node), chaque fonction ne fait rien, sans erreur.

import type { Tier } from "../../shared/rules";

const MASTER = 0.6;
/** Voix (sources sonores) qui peuvent sonner en même temps : les fanfares ont droit à tout. */
const VOIX_MAX = 16;
/** Au-delà, les sons d'interface (pièces, tics, appuis) attendent leur tour. */
const VOIX_INTERFACE = 10;
/** Écart minimal entre deux déclenchements du même son, en millisecondes : moins de dix par seconde. */
const ECART_MIN = 105;

let ctx: AudioContext | null = null;
/** Le bus où arrivent toutes les voix, avant le limiteur. */
let bus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = true;

// Grattage : une source de bruit qui tourne, dont seul le volume bouge.
let scratchSource: AudioBufferSourceNode | null = null;
let scratchGain: GainNode | null = null;
let scratchStopTimer: ReturnType<typeof setTimeout> | undefined;

// ---------------------------------------------------------------------------
// Le contexte et la sortie

/**
 * En bac à sable, chaque son joué laisse son nom dans `window.__sons` : la recette
 * vérifie ainsi, sans oreilles, quel son part sur quel geste.
 */
const trace: string[] | null = (() => {
  if (typeof window === "undefined" || !window.location?.search.includes("bac-a-sable")) return null;
  const list: string[] = [];
  (window as unknown as { __sons: string[] }).__sons = list;
  return list;
})();

const dbToGain = (db: number) => Math.pow(10, db / 20);

/** L'écrêteur : rien ne change sous 0,6 ; au-delà, la courbe s'arrondit et ne dépasse jamais 0,9. */
function softClip(): Float32Array<ArrayBuffer> {
  const n = 2049;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    curve[i] = a <= 0.6 ? x : Math.sign(x) * (0.6 + 0.38 * Math.tanh((a - 0.6) / 0.38));
  }
  return curve;
}

/** Le bus, le limiteur, l'écrêteur, la sortie. */
function build(c: AudioContext): void {
  const input = c.createGain();
  input.gain.value = MASTER;
  // Limiteur : il ne travaille qu'au-dessus de -6 dB, quand beaucoup de voix s'additionnent.
  const threshold = -6;
  const ratio = 20;
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = threshold;
  limiter.knee.value = 0;
  limiter.ratio.value = ratio;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.16;
  // Le compresseur de Web Audio remonte tout seul le niveau : son gain de rattrapage vaut
  // (1 ÷ gain à pleine échelle) puissance 0,6. On le retire, pour qu'un son seul sorte
  // exactement au volume où il a été écrit (mesuré : 1,4825 pour ces réglages).
  const trim = c.createGain();
  trim.gain.value = Math.pow(dbToGain(threshold - threshold / ratio), 0.6);
  const guard = c.createWaveShaper();
  guard.curve = softClip();
  input.connect(limiter);
  limiter.connect(trim);
  trim.connect(guard);
  guard.connect(c.destination);
  bus = input;
}

function context(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      const c = new Ctor();
      build(c);
      ctx = c;
    } catch {
      ctx = null;
      bus = null;
      return null;
    }
  }
  const visible = typeof document === "undefined" || document.visibilityState === "visible";
  if (ctx.state === "suspended" && visible) {
    try {
      void ctx.resume().catch(() => undefined);
    } catch {
      // Un navigateur sans promesse ici : tant pis, le geste suivant réessaiera.
    }
  }
  return ctx;
}

export function setSoundEnabled(on: boolean): void {
  const was = enabled;
  enabled = on;
  if (!on) scratchEnd();
  if (!ctx || !bus || was === on) return;
  const now = ctx.currentTime;
  try {
    bus.gain.cancelScheduledValues(now);
    if (on) {
      bus.gain.setValueAtTime(MASTER, now);
    } else {
      // Le son qui dit « coupé » a le temps de finir ; tout le reste se tait (une fanfare en cours aussi).
      bus.gain.setValueAtTime(MASTER, now + 0.2);
      bus.gain.linearRampToValueAtTime(0, now + 0.26);
    }
  } catch {
    // Rien à faire : plus aucun son ne part de toute façon.
  }
}

/** À appeler sur le premier toucher : les navigateurs n'autorisent le son qu'après un geste. */
export function unlockAudio(): void {
  context();
}

export function suspendAudio(): void {
  scratchEnd();
  if (ctx && ctx.state === "running") {
    try {
      void ctx.suspend().catch(() => undefined);
    } catch {
      // Voir context().
    }
  }
}

export function resumeAudio(): void {
  if (ctx && ctx.state === "suspended" && enabled) {
    try {
      void ctx.resume().catch(() => undefined);
    } catch {
      // Voir context().
    }
  }
}

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

// ---------------------------------------------------------------------------
// Les voix : jamais trop à la fois, jamais le même son en rafale

/** 1 : un son d'interface, qui peut céder sa place. 2 : un résultat, une fanfare, le récit. */
type Prio = 1 | 2;

interface Voice {
  start: number;
  end: number;
}

let voices: Voice[] = [];

/**
 * Une voix peut-elle sonner de `t0` à `t1` ? On compte les voix déjà prévues à chaque
 * instant où il en démarre une sur cet intervalle : c'est là que leur nombre culmine.
 */
function admit(c: AudioContext, t0: number, t1: number, prio: Prio): boolean {
  const now = c.currentTime;
  if (voices.some((v) => v.end <= now)) voices = voices.filter((v) => v.end > now);
  const cap = prio === 2 ? VOIX_MAX : VOIX_INTERFACE;
  let at = t0;
  for (;;) {
    let active = 0;
    // L'instant suivant à contrôler : le prochain départ d'une voix déjà prévue, avant `t1`.
    let next = Infinity;
    for (const v of voices) {
      if (v.start <= at && v.end > at) active++;
      else if (v.start > at && v.start < t1 && v.start < next) next = v.start;
    }
    if (active >= cap) return false;
    if (next === Infinity) break;
    at = next;
  }
  voices.push({ start: t0, end: t1 });
  return true;
}

const lastPlayed = new Map<string, number>();

function clock(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Le contexte, si ce son a le droit de partir maintenant : le réglage « Son » est
 * allumé, Web Audio existe, et le même son n'a pas été joué à l'instant.
 */
function begin(id: string, gap = ECART_MIN): AudioContext | null {
  const c = context();
  if (!c || !bus) return null;
  const now = clock();
  const last = lastPlayed.get(id);
  if (last !== undefined && now - last < gap) return null;
  lastPlayed.set(id, now);
  if (trace) {
    trace.push(id);
    if (trace.length > 4000) trace.splice(0, 2000);
  }
  return c;
}

// ---------------------------------------------------------------------------
// Les briques : une note, un souffle

interface ToneOptions {
  type?: OscillatorType;
  freq: number;
  /** Fréquence d'arrivée, pour un glissé. */
  to?: number;
  /** Départ, en secondes à partir de maintenant. */
  at?: number;
  dur: number;
  gain?: number;
  /** Montée du volume, en secondes : jamais sèche. */
  attack?: number;
  /** Temps passé au volume plein avant l'extinction, pour une note tenue. */
  hold?: number;
  prio?: Prio;
  /** Un filtre entre l'oscillateur et son volume : pour adoucir une dent de scie. */
  filter?: { type: BiquadFilterType; freq: number; q?: number };
  /** Points de passage de la hauteur : [instant en secondes depuis le départ, fréquence]. */
  bend?: readonly (readonly [number, number])[];
}

function tone(c: AudioContext, o: ToneOptions): void {
  if (!bus) return;
  const t0 = c.currentTime + (o.at ?? 0);
  const t1 = t0 + o.dur;
  if (!admit(c, t0, t1, o.prio ?? 1)) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.bend) for (const [dt, f] of o.bend) osc.frequency.linearRampToValueAtTime(f, t0 + dt);
  else if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t1);
  const peak = o.gain ?? 0.2;
  const attack = Math.min(o.attack ?? 0.005, o.dur * 0.5);
  // Une montée en ligne droite (pas de claquement), puis une extinction naturelle.
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  if (o.hold) g.gain.setValueAtTime(peak, Math.min(t0 + attack + o.hold, t1 - 0.02));
  g.gain.exponentialRampToValueAtTime(0.0001, t1);
  if (o.filter) {
    const f = c.createBiquadFilter();
    f.type = o.filter.type;
    f.frequency.value = o.filter.freq;
    f.Q.value = o.filter.q ?? 0.7;
    osc.connect(f);
    f.connect(g);
  } else {
    osc.connect(g);
  }
  g.connect(bus);
  osc.start(t0);
  osc.stop(t1 + 0.02);
}

interface NoiseOptions {
  at?: number;
  dur: number;
  gain?: number;
  filter?: BiquadFilterType;
  freq?: number;
  /** Fréquence d'arrivée du filtre : un souffle qui monte ou qui descend. */
  to?: number;
  q?: number;
  attack?: number;
  hold?: number;
  prio?: Prio;
}

function burst(c: AudioContext, o: NoiseOptions): void {
  if (!bus) return;
  const t0 = c.currentTime + (o.at ?? 0);
  const t1 = t0 + o.dur;
  if (!admit(c, t0, t1, o.prio ?? 1)) return;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.filter ?? "bandpass";
  f.frequency.setValueAtTime(o.freq ?? 3000, t0);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t1);
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  const peak = o.gain ?? 0.2;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + Math.min(o.attack ?? 0.004, o.dur * 0.5));
  if (o.hold) g.gain.setValueAtTime(peak, Math.min(t0 + (o.attack ?? 0.004) + o.hold, t1 - 0.02));
  g.gain.exponentialRampToValueAtTime(0.0001, t1);
  src.connect(f);
  f.connect(g);
  g.connect(bus);
  src.start(t0, Math.random() * 0.5);
  src.stop(t1 + 0.02);
}

/** Une lame de boîte à musique : un triangle, et son octave, plus brève, pour l'éclat. */
function bell(c: AudioContext, freq: number, at: number, dur: number, gain: number, prio: Prio = 1): void {
  tone(c, { type: "triangle", freq, at, dur, gain, attack: 0.004, prio });
  tone(c, { type: "sine", freq: freq * 2, at, dur: dur * 0.55, gain: gain * 0.26, attack: 0.004, prio });
}

// La gamme pentatonique de do, en hertz : toutes les notes du jeu en sortent.
const G3 = 196, A3 = 220, C4 = 261.63, E4 = 329.63, G4 = 392, A4 = 440;
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880;
const C6 = 1046.5, D6 = 1174.66, E6 = 1318.51, G6 = 1567.98, A6 = 1760;
const C7 = 2093, D7 = 2349.32, E7 = 2637.02;

/** L'échelle, de bas en haut : ce que montent les pièces, les étoiles, le pion. */
const LADDER: readonly number[] = [C5, D5, E5, G5, A5, C6, D6, E6, G6, A6, C7, D7, E7];

function rung(i: number): number {
  return LADDER[Math.max(0, Math.min(LADDER.length - 1, Math.floor(i)))]!;
}

function pickOf(list: readonly number[]): number {
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Arpège de lames : une note toutes les `step` secondes. */
function arpeggio(c: AudioContext, notes: readonly number[], step: number, at: number, dur: number, gain: number, prio: Prio): void {
  notes.forEach((freq, i) => bell(c, freq, at + i * step, dur, gain, prio));
}

/** Une cymbale douce : du bruit au-dessus de 6 kHz. */
function cymbal(c: AudioContext, at: number, dur: number, gain: number): void {
  burst(c, { at, dur, gain, filter: "highpass", freq: 6000, q: 0.5, prio: 2 });
}

// ---------------------------------------------------------------------------
// Grattage : bruit blanc dans un filtre passe-bande entre 2 et 5 kHz. Le volume
// suit la vitesse du doigt, lissée sur 50 ms. Silence à l'arrêt.

/** `speed` : vitesse du doigt en pixels par milliseconde. */
export function scratchMove(speed: number): void {
  const c = context();
  if (!c || !bus) return;
  clearTimeout(scratchStopTimer);
  if (!scratchSource || !scratchGain) {
    const src = c.createBufferSource();
    src.buffer = noise(c);
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 3200; // moyenne géométrique de 2 et 5 kHz
    f.Q.value = 1.05;
    const g = c.createGain();
    g.gain.value = 0;
    src.connect(f);
    f.connect(g);
    g.connect(bus);
    src.start();
    scratchSource = src;
    scratchGain = g;
    if (trace) trace.push("grattage");
  }
  const target = Math.min(0.55, Math.max(0, speed) * 0.42);
  // Constante de temps de 17 ms : le volume rejoint sa cible en 50 ms environ.
  scratchGain.gain.setTargetAtTime(target, c.currentTime, 0.017);
  // Le doigt s'arrête sans se lever : silence.
  scratchStopTimer = setTimeout(scratchPause, 70);
}

function scratchPause(): void {
  if (ctx && scratchGain) scratchGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
}

/** Le doigt se lève. */
export function scratchEnd(): void {
  clearTimeout(scratchStopTimer);
  scratchStopTimer = undefined;
  const src = scratchSource;
  const g = scratchGain;
  scratchSource = null;
  scratchGain = null;
  if (!ctx || !src || !g) return;
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
  try {
    src.stop(ctx.currentTime + 0.15);
  } catch {
    // Déjà arrêtée.
  }
}

// ---------------------------------------------------------------------------
// L'interface

export type TapKind = "principal" | "secondaire" | "texte";

/**
 * Appui sur un bouton. Trois appuis, du plus plein au plus léger : le bouton
 * principal, le bouton secondaire (et tout ce qui se touche), le lien.
 */
export function playTap(kind: TapKind = "principal"): void {
  const c = begin(`appui-${kind}`);
  if (!c) return;
  if (kind === "principal") {
    tone(c, { type: "triangle", freq: G4, to: C4, dur: 0.08, gain: 0.15, attack: 0.004 });
    tone(c, { type: "sine", freq: C5, dur: 0.05, gain: 0.06, attack: 0.004 });
  } else if (kind === "secondaire") {
    tone(c, { type: "sine", freq: E5, to: C5, dur: 0.06, gain: 0.1, attack: 0.004 });
  } else {
    tone(c, { type: "sine", freq: A5, to: G5, dur: 0.04, gain: 0.065, attack: 0.003 });
  }
}

const CLICKS: readonly number[] = [E5, G5, A5, C6, D6];

/**
 * Un déclic : onglet, carrousel, signe, camp, espèce, langue. `index` donne sa note
 * (chaque onglet a la sienne) ; -1, c'est le retour, plus grave.
 */
export function playClick(index = 0): void {
  const c = begin("declic");
  if (!c) return;
  const freq = index < 0 ? C5 : CLICKS[index % CLICKS.length]!;
  tone(c, { type: "triangle", freq, to: freq * 0.94, dur: 0.045, gain: 0.1, attack: 0.003 });
  burst(c, { dur: 0.014, gain: 0.04, freq: 2600, q: 2, attack: 0.002 });
}

/** Une feuille s'ouvre (glissé montant) ou se referme (glissé descendant). */
export function playSheet(open: boolean): void {
  const c = begin(open ? "feuille-ouvre" : "feuille-ferme", 160);
  if (!c) return;
  if (open) {
    tone(c, { type: "sine", freq: C5, to: G5, dur: 0.17, gain: 0.08, attack: 0.02, hold: 0.07 });
    burst(c, { dur: 0.16, gain: 0.06, freq: 900, to: 2600, q: 0.8, attack: 0.03, hold: 0.05 });
  } else {
    tone(c, { type: "sine", freq: G5, to: C5, dur: 0.15, gain: 0.07, attack: 0.015, hold: 0.06 });
    burst(c, { dur: 0.14, gain: 0.05, freq: 2400, to: 800, q: 0.8, attack: 0.02, hold: 0.04 });
  }
}

/** Un interrupteur : deux notes, montantes quand il s'allume, descendantes quand il s'éteint. */
export function playToggle(on: boolean): void {
  const c = begin("interrupteur", 120);
  if (!c) return;
  const [a, b] = on ? [E5, A5] : [A5, E5];
  tone(c, { type: "triangle", freq: a, dur: 0.08, gain: 0.1, attack: 0.004 });
  tone(c, { type: "triangle", freq: b, at: 0.075, dur: 0.115, gain: 0.1, attack: 0.004 });
}

/** Un refus, une erreur : un double « non » doux. Jamais un buzzer. */
export function playRefuse(): void {
  const c = begin("refus", 300);
  if (!c) return;
  tone(c, { type: "triangle", freq: G4, to: 349, dur: 0.085, gain: 0.12, attack: 0.012, hold: 0.02 });
  tone(c, { type: "triangle", freq: E4, to: 294, at: 0.1, dur: 0.095, gain: 0.12, attack: 0.012, hold: 0.02 });
}

// ---------------------------------------------------------------------------
// L'argent

/** Ticket acheté : le distributeur imprime, coupe, et tinte. Un carnet imprime plus longtemps. */
export function playTicketBought(qty = 1): void {
  const c = begin("distributeur", 250);
  if (!c) return;
  const ticks = qty >= 10 ? 13 : qty >= 5 ? 9 : 5;
  for (let i = 0; i < ticks; i++) burst(c, { at: i * 0.035, dur: 0.03, gain: 0.2, freq: 1800 + (i % 5) * 220, q: 3, attack: 0.003, prio: 2 });
  const end = ticks * 0.035;
  // Le couperet : un « clac » rond, pas une onde carrée.
  tone(c, { type: "triangle", freq: A5, to: E5, at: end, dur: 0.035, gain: 0.1, attack: 0.002, prio: 2 });
  burst(c, { at: end, dur: 0.02, gain: 0.08, freq: 1200, q: 1.5, attack: 0.003, prio: 2 });
  // Le ticket est là : une note. Un carnet : deux, puis trois.
  bell(c, C6, end + 0.05, 0.2, 0.09, 2);
  if (qty >= 5) bell(c, E6, end + 0.13, 0.2, 0.08, 2);
  if (qty >= 10) bell(c, G6, end + 0.21, 0.26, 0.08, 2);
}

/** Achat en boutique : deux tintements et le tiroir-caisse. */
export function playCashRegister(): void {
  const c = begin("caisse", 300);
  if (!c) return;
  bell(c, E6, 0, 0.3, 0.12, 2);
  bell(c, G6, 0.09, 0.38, 0.12, 2);
  burst(c, { at: 0.2, dur: 0.12, gain: 0.14, filter: "lowpass", freq: 900, q: 0.7, prio: 2 });
  tone(c, { type: "triangle", freq: 330, to: 196, at: 0.2, dur: 0.12, gain: 0.1, attack: 0.003, prio: 2 });
}

/** Le Standing monte : une note par étoile gagnée, huit au plus, en montant la gamme. */
export function playStars(count: number, at = 0): void {
  const n = Math.max(0, Math.min(8, Math.floor(count)));
  if (n === 0) return;
  const c = begin("etoiles", 300);
  if (!c) return;
  for (let i = 0; i < n; i++) bell(c, rung(2 + i), at + i * 0.07, 0.2, 0.085, 2);
}

/** Les notes que montent les pièces, à mesure que le compte avance. */
const COINS: readonly number[] = [C6, D6, E6, G6, A6, C7, D7];

/**
 * Pièce : un triangle et sa quinte, extinction en 200 ms. `step` : le degré de la
 * gamme, de 0 à 6 ; la hauteur monte avec le compte.
 */
export function playCoin(step = 0): void {
  const c = begin("piece");
  if (!c) return;
  const freq = COINS[Math.max(0, Math.min(COINS.length - 1, Math.floor(step)))]!;
  tone(c, { type: "triangle", freq, dur: 0.2, gain: 0.1, attack: 0.003 });
  // La quinte au-dessus ; pour un mi, la quarte : le si n'est pas de la gamme.
  const second = freq === E6 || freq === E7 ? freq * (4 / 3) : freq * 1.5;
  tone(c, { type: "triangle", freq: second, dur: 0.16, gain: 0.05, attack: 0.003 });
}

// ---------------------------------------------------------------------------
// Le grattage

export type RevealKind = "case" | "carte" | "de" | "lettre";

/**
 * Une case est révélée : un tic boisé. Les tickets à cartes, à dés et à lettres ont
 * le leur : la carte qui se retourne, le dé qui roule, la lettre qui s'allume.
 */
export function playReveal(kind: RevealKind = "case"): void {
  if (kind === "carte") return playCardFlip();
  if (kind === "de") return playDice();
  if (kind === "lettre") return playLetter();
  const c = begin("case");
  if (!c) return;
  const freq = pickOf([G5, A5, C6]);
  tone(c, { freq, to: freq / 2, dur: 0.07, gain: 0.17, attack: 0.003 });
}

const MATCHES: readonly (readonly number[])[] = [[G5, C6, E6], [C6, E6, G6], [E6, G6, C7]];

/** Une combinaison se signale : un accord égrené. `n` : son rang sur le ticket, qui monte. */
export function playMatch(n = 0): void {
  const c = begin("combinaison", 140);
  if (!c) return;
  const chord = MATCHES[Math.max(0, Math.min(MATCHES.length - 1, Math.floor(n)))]!;
  chord.forEach((freq, i) => tone(c, { type: "triangle", freq, at: i * 0.028, dur: 0.3, gain: 0.11, attack: 0.004, prio: 2 }));
  tone(c, { type: "sine", freq: chord[2]! * 2, at: 0.056, dur: 0.16, gain: 0.03, attack: 0.004, prio: 2 });
}

/** Le dé qui roule : quelques rebonds sur le bois, de plus en plus serrés. */
export function playDice(): void {
  const c = begin("de", 180);
  if (!c) return;
  const hits = [0, 0.055, 0.105, 0.148, 0.185];
  hits.forEach((at, i) => {
    burst(c, { at, dur: 0.02, gain: 0.3 - i * 0.045, freq: 1700 + Math.random() * 900, q: 4, attack: 0.003 });
  });
  tone(c, { type: "triangle", freq: E5, to: C5, at: 0, dur: 0.04, gain: 0.09, attack: 0.003 });
  tone(c, { type: "triangle", freq: D5, to: C5, at: 0.185, dur: 0.05, gain: 0.08, attack: 0.003 });
}

/** La lettre qui s'allume : une lame claire, jamais deux fois la même de suite. */
let lastLetter = 0;

export function playLetter(): void {
  const c = begin("lettre");
  if (!c) return;
  lastLetter = (lastLetter + 1 + Math.floor(Math.random() * 3)) % 5;
  const freq = rung(5 + lastLetter);
  tone(c, { type: "sine", freq, dur: 0.22, gain: 0.1, attack: 0.006 });
  tone(c, { type: "sine", freq: freq * 2, dur: 0.1, gain: 0.03, attack: 0.006 });
}

/** Le pion avance d'une case : un « toc » de bois, un degré plus haut à chaque case. */
export function playPawnStep(step = 0): void {
  const c = begin("pion");
  if (!c) return;
  const freq = rung(2 + (Math.max(0, Math.floor(step)) % 6));
  tone(c, { type: "triangle", freq, to: freq * 0.9, dur: 0.06, gain: 0.12, attack: 0.003 });
  burst(c, { dur: 0.014, gain: 0.07, freq: 900, q: 2, attack: 0.003 });
}

/** « Tout gratter » : un balayage. */
export function playSweep(): void {
  const c = begin("balayage", 400);
  if (!c) return;
  burst(c, { dur: 0.36, gain: 0.22, freq: 700, to: 3600, q: 1.1, attack: 0.07, hold: 0.12 });
  tone(c, { type: "sine", freq: C5, to: C6, dur: 0.32, gain: 0.04, attack: 0.05, hold: 0.12 });
}

/** Un tampon s'abat : « Payé », « Vendu ». */
export function playStamp(): void {
  const c = begin("tampon", 200);
  if (!c) return;
  tone(c, { type: "sine", freq: 160, to: 70, dur: 0.11, gain: 0.3, attack: 0.003, prio: 2 });
  // Sur le haut-parleur d'un téléphone, c'est ce « toc » qu'on entend.
  tone(c, { type: "triangle", freq: 330, to: 165, dur: 0.07, gain: 0.13, attack: 0.003, prio: 2 });
  burst(c, { dur: 0.05, gain: 0.12, filter: "lowpass", freq: 1200, q: 0.5, attack: 0.003, prio: 2 });
}

// ---------------------------------------------------------------------------
// Le résultat d'un ticket (section 8.5)

/** La fanfare du jackpot : deux secondes, puis les pièces qui tombent. */
function fanfare(c: AudioContext): void {
  // Le thème : « ta-ta-ta taaa, ta-ta taa, ta-ta TAAA ».
  const lead: readonly (readonly [number, number, number, number])[] = [
    // [départ, note, durée, tenue]
    [0, G5, 0.12, 0], [0.11, G5, 0.12, 0], [0.22, G5, 0.12, 0], [0.33, C6, 0.44, 0.2],
    [0.78, A5, 0.12, 0], [0.89, C6, 0.12, 0], [1.0, E6, 0.3, 0.12],
    [1.3, D6, 0.12, 0], [1.41, E6, 0.12, 0], [1.52, G6, 0.9, 0.36],
  ];
  for (const [at, freq, dur, hold] of lead) {
    tone(c, { type: "triangle", freq, at, dur, hold, gain: 0.16, attack: 0.006, prio: 2 });
    // Un rien de cuivre : une dent de scie très adoucie, sous le triangle.
    tone(c, { type: "sawtooth", freq, at, dur: dur * 0.9, hold, gain: 0.035, attack: 0.012, prio: 2, filter: { type: "lowpass", freq: 1900 } });
  }
  // L'harmonie, sous les notes tenues, et la basse.
  for (const [at, notes, dur, hold] of [
    [0.33, [E5, G5], 0.44, 0.2], [1.0, [G5, C6], 0.3, 0.12], [1.52, [C5, E6, C6], 0.9, 0.36],
  ] as const) {
    for (const freq of notes) tone(c, { type: "sine", freq, at, dur, hold, gain: 0.07, attack: 0.008, prio: 2 });
  }
  tone(c, { type: "triangle", freq: C4, at: 0.33, dur: 0.42, gain: 0.1, attack: 0.008, prio: 2 });
  tone(c, { type: "triangle", freq: G3, at: 1.0, dur: 0.3, gain: 0.1, attack: 0.008, prio: 2 });
  tone(c, { type: "triangle", freq: C4, at: 1.52, dur: 0.9, hold: 0.3, gain: 0.11, attack: 0.008, prio: 2 });
  // Le roulement, avant chaque note tenue, et les cymbales dessus.
  for (let i = 0; i < 6; i++) burst(c, { at: i * 0.055, dur: 0.03, gain: 0.035 + i * 0.006, freq: 1800, q: 0.8, prio: 2 });
  for (let i = 0; i < 4; i++) burst(c, { at: 1.3 + i * 0.055, dur: 0.03, gain: 0.05 + i * 0.008, freq: 1800, q: 0.8, prio: 2 });
  cymbal(c, 0.33, 0.5, 0.07);
  cymbal(c, 1.52, 1.1, 0.11);
  // L'éclat final, puis la chute de pièces.
  [C7, E7, G6, C7].forEach((freq, i) => tone(c, { type: "sine", freq, at: 1.64 + i * 0.1, dur: 0.16, gain: 0.045, attack: 0.004, prio: 2 }));
  for (let i = 0; i < 14; i++) {
    const at = 2.05 + (i / 14) * 1.2 + Math.random() * 0.04;
    tone(c, { type: "triangle", freq: pickOf(COINS), at, dur: 0.18, gain: 0.05, attack: 0.003, prio: 2 });
  }
  bell(c, C7, 3.28, 0.45, 0.08, 2);
}

/**
 * Le résultat d'un ticket, selon son palier : une petite chute tendre pour un ticket
 * perdu, puis des paliers de plus en plus riches, jusqu'à la fanfare du jackpot.
 * `bref` : en rafale, une ou deux notes seulement.
 */
export function playTier(tier: Tier, bref = false): void {
  const c = begin(`palier-${tier}`, 200);
  if (!c) return;
  if (bref) {
    if (tier === "perdu") tone(c, { type: "sine", freq: C5, dur: 0.09, gain: 0.05, attack: 0.01, prio: 2 });
    else if (tier === "rembourse") tone(c, { type: "triangle", freq: G5, dur: 0.1, gain: 0.07, attack: 0.006, prio: 2 });
    else arpeggio(c, [C5, E5], 0.08, 0, 0.18, 0.11, 2);
    return;
  }
  switch (tier) {
    case "perdu":
      // Un soupir : ré, puis do, qui se pose. Doux, et jamais moqueur.
      tone(c, { type: "sine", freq: D5, dur: 0.16, gain: 0.085, attack: 0.02, prio: 2 });
      tone(c, { type: "sine", freq: C5, at: 0.13, dur: 0.34, gain: 0.085, attack: 0.02, prio: 2 });
      tone(c, { type: "triangle", freq: C4, at: 0.13, dur: 0.3, gain: 0.04, attack: 0.03, prio: 2 });
      break;
    case "rembourse":
      // Ni gagné ni perdu : la même note, deux fois, la seconde en écho.
      bell(c, G5, 0, 0.18, 0.11, 2);
      bell(c, G5, 0.13, 0.22, 0.06, 2);
      break;
    case "petit":
      arpeggio(c, [C5, E5], 0.1, 0, 0.24, 0.14, 2);
      break;
    case "joli":
      arpeggio(c, [C5, E5, G5], 0.09, 0, 0.22, 0.14, 2);
      bell(c, C6, 0.27, 0.36, 0.14, 2);
      tone(c, { type: "sine", freq: C7, at: 0.36, dur: 0.12, gain: 0.03, attack: 0.004, prio: 2 });
      break;
    case "gros":
      arpeggio(c, [G4, C5, E5, G5, C6], 0.085, 0, 0.22, 0.14, 2);
      bell(c, E6, 0.425, 0.6, 0.14, 2);
      tone(c, { type: "sine", freq: C6, at: 0.425, dur: 0.55, gain: 0.07, attack: 0.008, prio: 2 });
      tone(c, { type: "triangle", freq: C4, at: 0.425, dur: 0.5, gain: 0.09, attack: 0.008, prio: 2 });
      cymbal(c, 0.425, 0.5, 0.08);
      break;
    case "enorme":
      arpeggio(c, [G4, C5, E5, G5, C6, G5, C6], 0.105, 0, 0.24, 0.15, 2);
      // L'accord tenu, la basse, la cymbale.
      tone(c, { type: "triangle", freq: E6, at: 0.735, dur: 0.85, hold: 0.3, gain: 0.15, attack: 0.006, prio: 2 });
      for (const freq of [C6, G6, G5]) tone(c, { type: "sine", freq, at: 0.735, dur: 0.8, hold: 0.3, gain: 0.07, attack: 0.008, prio: 2 });
      tone(c, { type: "triangle", freq: C4, at: 0.735, dur: 0.8, hold: 0.25, gain: 0.1, attack: 0.008, prio: 2 });
      cymbal(c, 0.735, 0.8, 0.1);
      [C7, E7, C7].forEach((freq, i) => tone(c, { type: "sine", freq, at: 0.9 + i * 0.11, dur: 0.14, gain: 0.04, attack: 0.004, prio: 2 }));
      break;
    case "jackpot":
      fanfare(c);
      break;
  }
}

// ---------------------------------------------------------------------------
// Le ticket par terre

/** Un ticket traîne par terre : un scintillement. */
export function playSparkle(): void {
  const c = begin("scintillement", 600);
  if (!c) return;
  [E6, A6, E7].forEach((freq, i) => tone(c, { type: "sine", freq, at: i * 0.06, dur: 0.18, gain: 0.075, attack: 0.004 }));
}

/** On le ramasse : « hop ». */
export function playPickUp(): void {
  const c = begin("hop", 300);
  if (!c) return;
  tone(c, { type: "sine", freq: C5, to: C6, dur: 0.09, gain: 0.12, attack: 0.006, prio: 2 });
  bell(c, G6, 0.085, 0.14, 0.06, 2);
}

// ---------------------------------------------------------------------------
// Le récit

/**
 * Une mouette : trois cris qui retombent. C'est la signature du jeu : on l'entend en
 * débarquant au port, et rarement ensuite.
 */
export function playGull(): void {
  const c = begin("mouette", 4000);
  if (!c) return;
  const cries: readonly (readonly [number, number, number])[] = [[0, 1, 0.2], [0.3, 0.95, 0.16], [0.56, 0.9, 0.11]];
  for (const [at, k, gain] of cries) {
    tone(c, {
      type: "sawtooth", freq: 1250 * k, at, dur: 0.27, gain, attack: 0.03, hold: 0.07, prio: 2,
      bend: [[0.06, 1780 * k], [0.26, 1120 * k]],
      filter: { type: "bandpass", freq: 2100, q: 1.3 },
    });
  }
}

/** Piou parle : un pépiement. */
export function playChirp(): void {
  const c = begin("pepiement", 1200);
  if (!c) return;
  tone(c, { type: "sine", freq: 2100, to: 3100, dur: 0.06, gain: 0.07, attack: 0.008, hold: 0.015, prio: 2 });
  tone(c, { type: "sine", freq: 2350, to: 3500, at: 0.08, dur: 0.06, gain: 0.07, attack: 0.008, hold: 0.015, prio: 2 });
}

/** Le carton d'un chapitre : une note grave qui se pose, et la gamme qui monte comme une harpe. */
export function playChapter(): void {
  const c = begin("chapitre", 800);
  if (!c) return;
  tone(c, { type: "triangle", freq: C4, dur: 0.9, gain: 0.08, attack: 0.02, prio: 2 });
  tone(c, { type: "sine", freq: G4, dur: 0.8, gain: 0.05, attack: 0.02, prio: 2 });
  [C5, D5, E5, G5, A5, C6].forEach((freq, i) => tone(c, { type: "triangle", freq, at: 0.08 + i * 0.05, dur: 0.34, gain: 0.07, attack: 0.005, prio: 2 }));
}

/** Un lieu ouvre ses portes : le carton du chapitre, en fanfare. */
export function playOpening(): void {
  const c = begin("ouverture", 800);
  if (!c) return;
  tone(c, { type: "triangle", freq: C4, dur: 1.2, hold: 0.5, gain: 0.08, attack: 0.02, prio: 2 });
  arpeggio(c, [G4, C5, E5, G5, C6], 0.11, 0, 0.28, 0.13, 2);
  tone(c, { type: "triangle", freq: C6, at: 0.6, dur: 0.7, hold: 0.2, gain: 0.13, attack: 0.006, prio: 2 });
  tone(c, { type: "sine", freq: E6, at: 0.6, dur: 0.7, hold: 0.2, gain: 0.08, attack: 0.008, prio: 2 });
  tone(c, { type: "sine", freq: G6, at: 0.6, dur: 0.6, hold: 0.15, gain: 0.05, attack: 0.008, prio: 2 });
  cymbal(c, 0.6, 0.7, 0.06);
}

/** Les clés de Gaspard : un trousseau qui tinte. */
export function playKeys(): void {
  const c = begin("cles", 600);
  if (!c) return;
  let at = 0;
  for (let i = 0; i < 6; i++) {
    const freq = pickOf([C7, D7, E7, 3136]);
    tone(c, { type: "triangle", freq, at, dur: 0.08, gain: 0.07, attack: 0.003, prio: 2 });
    tone(c, { type: "sine", freq: freq * 1.48, at, dur: 0.06, gain: 0.03, attack: 0.003, prio: 2 });
    at += 0.05 + Math.random() * 0.05;
  }
  burst(c, { at, dur: 0.03, gain: 0.09, freq: 1500, q: 1.5, attack: 0.003, prio: 2 });
}

/** L'aveu de Gaspard : quatre notes lentes, qui se posent sur le la. */
export function playConfession(): void {
  const c = begin("aveu", 1200);
  if (!c) return;
  const phrase: readonly (readonly [number, number, number])[] = [[0, E5, 0.3], [0.26, D5, 0.3], [0.52, C5, 0.3], [0.8, A4, 0.75]];
  for (const [at, freq, dur] of phrase) {
    tone(c, { type: "sine", freq, at, dur, gain: 0.085, attack: 0.03, prio: 2 });
    tone(c, { type: "triangle", freq, at, dur: dur * 0.8, gain: 0.03, attack: 0.03, prio: 2 });
  }
  tone(c, { type: "sine", freq: A3 * 2, at: 0.8, dur: 0.7, gain: 0.03, attack: 0.05, prio: 2 });
  tone(c, { type: "sine", freq: E4, at: 0.8, dur: 0.7, gain: 0.04, attack: 0.05, prio: 2 });
}

/** Le ticket tombe sur le quai : il volette, se pose, et brille. */
export function playTicketDrop(): void {
  const c = begin("ticket-tombe", 1200);
  if (!c) return;
  [0.25, 0.42, 0.6].forEach((at, i) => burst(c, { at, dur: 0.08, gain: 0.13, freq: 2600 - i * 400, to: 1500, q: 1.2, attack: 0.02, hold: 0.02, prio: 2 }));
  tone(c, { type: "triangle", freq: 400, to: 250, at: 0.83, dur: 0.055, gain: 0.12, attack: 0.003, prio: 2 });
  burst(c, { at: 0.83, dur: 0.025, gain: 0.09, freq: 1100, q: 1.5, attack: 0.003, prio: 2 });
  tone(c, { type: "sine", freq: E6, at: 0.97, dur: 0.18, gain: 0.07, attack: 0.004, prio: 2 });
  tone(c, { type: "sine", freq: A6, at: 1.04, dur: 0.22, gain: 0.07, attack: 0.004, prio: 2 });
}

// ---------------------------------------------------------------------------
// Le Poker Tricheur : appelés par les écrans du poker

/** Une carte distribuée : elle glisse sur le tapis. (Une donne se rythme : pas plus de neuf cartes par seconde.) */
export function playCardDeal(): void {
  const c = begin("carte-donnee");
  if (!c) return;
  burst(c, { dur: 0.095, gain: 0.2, freq: 2600 + Math.random() * 500, to: 1200, q: 1.4, attack: 0.012, hold: 0.03 });
  tone(c, { type: "triangle", freq: 300, to: 210, at: 0.075, dur: 0.04, gain: 0.07, attack: 0.003 });
}

/** Une carte retournée. */
export function playCardFlip(): void {
  const c = begin("carte-retournee");
  if (!c) return;
  burst(c, { dur: 0.08, gain: 0.22, freq: 1500, to: 4200, q: 1.2, attack: 0.01, hold: 0.025 });
  tone(c, { type: "triangle", freq: 330, to: 220, at: 0.075, dur: 0.04, gain: 0.08, attack: 0.003 });
}

/** Un jeton misé, ou une petite pile : `n` jetons, quatre tintements au plus. */
export function playChip(n = 1): void {
  const c = begin("jeton");
  if (!c) return;
  const count = Math.max(1, Math.min(4, Math.floor(n)));
  for (let i = 0; i < count; i++) {
    const at = i * 0.045;
    const freq = 2350 + Math.random() * 250;
    tone(c, { type: "triangle", freq, at, dur: 0.05, gain: 0.08, attack: 0.003 });
    tone(c, { type: "sine", freq: freq * 1.42, at, dur: 0.035, gain: 0.035, attack: 0.003 });
  }
}

/** Parole : deux coups sur la table. */
export function playKnock(): void {
  const c = begin("parole", 300);
  if (!c) return;
  for (const at of [0, 0.13]) {
    tone(c, { type: "sine", freq: 180, to: 110, at, dur: 0.06, gain: 0.2, attack: 0.003 });
    tone(c, { type: "triangle", freq: 330, to: 220, at, dur: 0.045, gain: 0.11, attack: 0.003 });
    burst(c, { at, dur: 0.03, gain: 0.12, filter: "lowpass", freq: 800, q: 0.7, attack: 0.003 });
  }
}

/** Se coucher : les cartes glissent, et retombent. */
export function playFold(): void {
  const c = begin("coucher", 300);
  if (!c) return;
  burst(c, { dur: 0.15, gain: 0.18, freq: 2200, to: 900, q: 1.1, attack: 0.02, hold: 0.04 });
  tone(c, { type: "sine", freq: E5, to: C5, at: 0.05, dur: 0.13, gain: 0.06, attack: 0.02 });
}

/** La carte escamotée : un froissement à peine, et un clin d'œil. */
export function playSleight(): void {
  const c = begin("triche", 300);
  if (!c) return;
  burst(c, { dur: 0.05, gain: 0.06, filter: "highpass", freq: 3500, q: 0.7, attack: 0.008 });
  tone(c, { type: "triangle", freq: A5, at: 0.05, dur: 0.035, gain: 0.05, attack: 0.004 });
  tone(c, { type: "triangle", freq: C6, at: 0.09, dur: 0.06, gain: 0.05, attack: 0.004 });
}

/** « Tricheur ! » : l'accusation tombe, deux notes et un coup sur la table. */
export function playAccuse(): void {
  const c = begin("accusation", 500);
  if (!c) return;
  tone(c, { type: "triangle", freq: G4, dur: 0.09, gain: 0.15, attack: 0.004, prio: 2 });
  tone(c, { type: "triangle", freq: C5, at: 0.1, dur: 0.3, hold: 0.08, gain: 0.16, attack: 0.004, prio: 2 });
  tone(c, { type: "sawtooth", freq: C5, at: 0.1, dur: 0.26, gain: 0.035, attack: 0.01, prio: 2, filter: { type: "lowpass", freq: 1700 } });
  tone(c, { type: "sine", freq: G5, at: 0.1, dur: 0.26, gain: 0.06, attack: 0.006, prio: 2 });
  burst(c, { at: 0.1, dur: 0.06, gain: 0.14, freq: 1500, q: 0.7, attack: 0.003, prio: 2 });
  tone(c, { type: "triangle", freq: 330, to: 196, at: 0.1, dur: 0.07, gain: 0.1, attack: 0.003, prio: 2 });
}

/** Démasqué : le masque dégringole la gamme, et tombe. */
export function playUnmasked(): void {
  const c = begin("demasque", 500);
  if (!c) return;
  [E6, D6, C6, A5, G5].forEach((freq, i) => tone(c, { type: "triangle", freq, at: i * 0.055, dur: 0.1, gain: 0.11, attack: 0.004, prio: 2 }));
  tone(c, { type: "triangle", freq: G4, to: 294, at: 0.3, dur: 0.22, gain: 0.13, attack: 0.006, prio: 2 });
  burst(c, { at: 0.3, dur: 0.05, gain: 0.08, filter: "lowpass", freq: 1000, q: 0.7, prio: 2 });
}

/** Innocent : une quinte claire, comme une auréole. */
export function playInnocent(): void {
  const c = begin("innocent", 500);
  if (!c) return;
  bell(c, C6, 0, 0.3, 0.12, 2);
  bell(c, G6, 0.12, 0.45, 0.12, 2);
  tone(c, { type: "sine", freq: E6, at: 0.12, dur: 0.4, gain: 0.05, attack: 0.008, prio: 2 });
  tone(c, { type: "sine", freq: C7, at: 0.24, dur: 0.2, gain: 0.035, attack: 0.004, prio: 2 });
}

/** Le pot ramassé : une cascade de jetons, et une pièce pour finir. */
export function playPot(): void {
  const c = begin("pot", 500);
  if (!c) return;
  let at = 0;
  for (let i = 0; i < 8; i++) {
    const freq = 2100 + i * 70 + Math.random() * 120;
    tone(c, { type: "triangle", freq, at, dur: 0.05, gain: 0.09, attack: 0.003, prio: 2 });
    at += 0.035 + Math.random() * 0.02;
  }
  tone(c, { type: "triangle", freq: 330, to: 220, at: at + 0.02, dur: 0.07, gain: 0.09, attack: 0.004, prio: 2 });
  bell(c, E6, at + 0.06, 0.26, 0.1, 2);
  bell(c, A6, at + 0.14, 0.3, 0.08, 2);
}
