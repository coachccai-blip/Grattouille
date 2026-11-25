// Tous les sons sont synthétisés avec Web Audio. Aucun fichier audio (BRIEF.md, section 14.2).
// Volume général à 0,6. Le contexte démarre au premier toucher et se suspend quand
// l'application passe en arrière-plan.

import type { Tier } from "../../shared/rules";

const MASTER = 0.6;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = true;

// Grattage : une source de bruit qui tourne, dont seul le volume bouge.
let scratchSource: AudioBufferSourceNode | null = null;
let scratchGain: GainNode | null = null;
let scratchStopTimer = 0;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (!on) scratchEnd();
}

function context(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = MASTER;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended" && document.visibilityState === "visible") void ctx.resume().catch(() => undefined);
  return ctx;
}

/** À appeler sur le premier toucher : les navigateurs n'autorisent le son qu'après un geste. */
export function unlockAudio(): void {
  context();
}

export function suspendAudio(): void {
  scratchEnd();
  if (ctx && ctx.state === "running") void ctx.suspend().catch(() => undefined);
}

export function resumeAudio(): void {
  if (ctx && ctx.state === "suspended" && enabled) void ctx.resume().catch(() => undefined);
}

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

interface ToneOptions {
  type?: OscillatorType;
  freq: number;
  /** Fréquence d'arrivée, pour un glissé. */
  to?: number;
  /** Départ, en secondes à partir de maintenant. */
  at?: number;
  dur: number;
  gain?: number;
  attack?: number;
}

function tone(c: AudioContext, o: ToneOptions): void {
  if (!master) return;
  const t0 = c.currentTime + (o.at ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);
  const peak = o.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.02);
}

interface NoiseOptions {
  at?: number;
  dur: number;
  gain?: number;
  filter?: BiquadFilterType;
  freq?: number;
  q?: number;
}

function burst(c: AudioContext, o: NoiseOptions): void {
  if (!master) return;
  const t0 = c.currentTime + (o.at ?? 0);
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.filter ?? "bandpass";
  f.frequency.value = o.freq ?? 3000;
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  const peak = o.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + o.dur + 0.02);
}

const semitone = (n: number) => Math.pow(2, n / 12);

// Notes, en hertz.
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568, G4 = 392, C7 = 2093;

/** Arpège : une note toutes les `step` secondes. */
function arpeggio(c: AudioContext, notes: number[], step: number, o: Partial<ToneOptions> = {}, at = 0): void {
  notes.forEach((freq, i) => {
    tone(c, { type: "triangle", freq, at: at + i * step, dur: 0.22, gain: 0.16, ...o });
  });
}

// ---------------------------------------------------------------------------
// Grattage : bruit blanc dans un filtre passe-bande entre 2 et 5 kHz. Le volume
// suit la vitesse du doigt, lissée sur 50 ms. Silence à l'arrêt.

/** `speed` : vitesse du doigt en pixels par milliseconde. */
export function scratchMove(speed: number): void {
  const c = context();
  if (!c || !master) return;
  window.clearTimeout(scratchStopTimer);
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
    src.connect(f).connect(g).connect(master);
    src.start();
    scratchSource = src;
    scratchGain = g;
  }
  const target = Math.min(0.55, Math.max(0, speed) * 0.42);
  // Constante de temps de 17 ms : le volume rejoint sa cible en 50 ms environ.
  scratchGain.gain.setTargetAtTime(target, c.currentTime, 0.017);
  // Le doigt s'arrête sans se lever : silence.
  scratchStopTimer = window.setTimeout(scratchPause, 70);
}

function scratchPause(): void {
  if (ctx && scratchGain) scratchGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
}

/** Le doigt se lève. */
export function scratchEnd(): void {
  window.clearTimeout(scratchStopTimer);
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
// Événements

/** Case révélée : clic boisé, sinus qui glisse de 880 à 440 Hz en 60 ms. */
export function playReveal(): void {
  const c = context();
  if (c) tone(c, { freq: 880, to: 440, dur: 0.06, gain: 0.28, attack: 0.002 });
}

/** Une correspondance se signale : un tintement clair. */
export function playMatch(): void {
  const c = context();
  if (!c) return;
  tone(c, { type: "triangle", freq: G6, dur: 0.25, gain: 0.14 });
  tone(c, { type: "sine", freq: G6 * 2, dur: 0.18, gain: 0.05 });
}

/**
 * Pièce : triangle à 1 319 Hz et 1 976 Hz, extinction en 250 ms.
 * Un demi-ton plus haut à chaque pièce pendant le comptage.
 */
export function playCoin(step = 0): void {
  const c = context();
  if (!c) return;
  const k = semitone(Math.min(step, 14));
  tone(c, { type: "triangle", freq: 1319 * k, dur: 0.25, gain: 0.12, attack: 0.002 });
  tone(c, { type: "triangle", freq: 1976 * k, dur: 0.25, gain: 0.07, attack: 0.002 });
}

/** Appui sur un bouton : un clic très bref. */
export function playTap(): void {
  const c = context();
  if (c) tone(c, { type: "sine", freq: 520, to: 420, dur: 0.035, gain: 0.07, attack: 0.002 });
}

/** Ticket acheté : bruit bref d'imprimante, puis clic. */
export function playTicketBought(): void {
  const c = context();
  if (!c) return;
  for (let i = 0; i < 5; i++) burst(c, { at: i * 0.035, dur: 0.03, gain: 0.1, freq: 1800 + i * 220, q: 3 });
  tone(c, { type: "square", freq: 1400, to: 900, at: 0.2, dur: 0.03, gain: 0.08, attack: 0.001 });
}

/** Achat en boutique : deux tintements et un tiroir-caisse. */
export function playCashRegister(): void {
  const c = context();
  if (!c) return;
  tone(c, { type: "triangle", freq: E6, dur: 0.3, gain: 0.14 });
  tone(c, { type: "triangle", freq: G6, at: 0.09, dur: 0.4, gain: 0.14 });
  burst(c, { at: 0.2, dur: 0.12, gain: 0.16, filter: "lowpass", freq: 900, q: 0.7 });
  tone(c, { type: "sine", freq: 130, to: 80, at: 0.2, dur: 0.14, gain: 0.2, attack: 0.003 });
}

/** Un tampon s'abat : « Payé », « Vendu ». */
export function playStamp(): void {
  const c = context();
  if (!c) return;
  tone(c, { type: "sine", freq: 160, to: 70, dur: 0.11, gain: 0.3, attack: 0.002 });
  burst(c, { dur: 0.05, gain: 0.12, filter: "lowpass", freq: 1200, q: 0.5 });
}

/** Un lieu ouvre ses portes : une petite fanfare. */
export function playOpening(): void {
  const c = context();
  if (!c) return;
  arpeggio(c, [G4, C5, E5, G5, C6], 0.11, { dur: 0.3, gain: 0.15 });
  tone(c, { type: "triangle", freq: C6, at: 0.6, dur: 0.6, gain: 0.14 });
  tone(c, { type: "triangle", freq: E6, at: 0.6, dur: 0.6, gain: 0.1 });
}

/** Le résultat d'un ticket, selon son palier (section 8.5). */
export function playTier(tier: Tier): void {
  const c = context();
  if (!c) return;
  switch (tier) {
    case "perdu":
      // Note sourde descendante, 120 ms, volume faible.
      tone(c, { type: "sine", freq: 196, to: 131, dur: 0.12, gain: 0.1 });
      break;
    case "rembourse":
      tone(c, { type: "triangle", freq: C5, dur: 0.16, gain: 0.13 });
      break;
    case "petit":
      // Deux notes.
      arpeggio(c, [C5, E5], 0.1);
      break;
    case "joli":
      // Arpège de trois notes.
      arpeggio(c, [C5, E5, G5], 0.1);
      break;
    case "gros":
      // Arpège de cinq notes et cymbale.
      arpeggio(c, [C5, E5, G5, C6, E6], 0.09);
      burst(c, { at: 0.42, dur: 0.5, gain: 0.1, filter: "highpass", freq: 6000, q: 0.5 });
      break;
    case "enorme":
      // Fanfare de huit notes.
      arpeggio(c, [G4, C5, E5, G5, C6, G5, C6, E6], 0.11, { dur: 0.3, gain: 0.17 });
      burst(c, { at: 0.85, dur: 0.7, gain: 0.12, filter: "highpass", freq: 6000, q: 0.5 });
      break;
    case "jackpot": {
      // Fanfare, roulement, chute de pièces pendant 2 secondes.
      arpeggio(c, [G4, C5, E5, G5, C6, G5, C6, E6], 0.1, { dur: 0.32, gain: 0.18 });
      tone(c, { type: "triangle", freq: C6, at: 0.85, dur: 0.9, gain: 0.16 });
      tone(c, { type: "triangle", freq: E6, at: 0.85, dur: 0.9, gain: 0.13 });
      tone(c, { type: "triangle", freq: G6, at: 0.85, dur: 0.9, gain: 0.11 });
      for (let i = 0; i < 16; i++) burst(c, { at: 0.05 + i * 0.045, dur: 0.04, gain: 0.07, freq: 240, q: 1.2 });
      burst(c, { at: 0.85, dur: 0.9, gain: 0.12, filter: "highpass", freq: 6000, q: 0.5 });
      for (let i = 0; i < 26; i++) {
        const at = 1.0 + (i / 26) * 2 + Math.random() * 0.05;
        const k = semitone(Math.floor(Math.random() * 10));
        tone(c, { type: "triangle", freq: 1319 * k, at, dur: 0.2, gain: 0.06, attack: 0.002 });
      }
      tone(c, { type: "triangle", freq: C7, at: 3.0, dur: 0.5, gain: 0.1 });
      break;
    }
  }
}
