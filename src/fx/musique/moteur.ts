// Le moteur de la musique d'ambiance : il fait sonner les partitions (themes.ts) avec
// Web Audio, sans aucun fichier.
//
// - L'heure est celle du contexte audio. Une minuterie écrit les notes un peu à l'avance
//   (`AVANCE`) : la musique ne dérive pas et ne trébuche pas quand l'écran travaille. Si
//   le fil principal se fige plus longtemps que cette avance, elle reprend où elle en
//   était, sans rattraper son retard en rafale.
// - Jamais plus de `VOIX_MAX` voix à la fois, tous thèmes confondus. Une note qui n'a
//   pas de place est passée ; une note tenue attend qu'une place se libère.
// - Changer de thème, c'est un fondu enchaîné d'une seconde : le thème qui part se tait
//   et tout ce qu'il a créé est débranché. Chaque thème retient où il en était : en y
//   revenant, on entend la phrase suivante, pas la même.
// - Chaque note libère ses nœuds en s'éteignant : rien ne s'accumule sur une heure de jeu.
// - La sortie est celle des bruitages, derrière le même limiteur (voir `partage` dans
//   audio.ts), à un niveau (`NIVEAU`) qui les laisse toujours passer devant.

import { hertz, suite } from "./solfege";
import { THEMES, type Plume, type Theme, type ThemeId } from "./themes";
import type { Piste } from "./timbres";

/** Où brancher la musique : le contexte audio, et le nœud qui mène à la sortie. */
export interface Sortie {
  ctx: AudioContext;
  vers: AudioNode;
}

/** Le plus grand nombre de voix (sources sonores) à la fois. */
export const VOIX_MAX = 10;
/**
 * Le volume de la musique à la sortie : ce que vaut, là, une voix écrite à pleine force
 * sur une piste à plein volume. Réglé à la mesure, dans le navigateur : chaque thème sonne
 * autour de -44 dB (valeur efficace) et ne dépasse pas 0,06 en crête, quand un simple appui
 * de bouton culmine à 0,09 et un jackpot à 0,26. Les bruitages passent toujours devant.
 */
export const NIVEAU = 0.02;
/** La durée d'un fondu enchaîné, en secondes. */
export const FONDU = 1;
/** L'avance avec laquelle les notes sont écrites, en secondes, et le battement de la minuterie, en millisecondes. */
const AVANCE = 0.6;
const BATTEMENT = 150;
/** Le temps laissé avant la première note d'un thème, en secondes. */
const DEPART = 0.12;
/**
 * Ce que la salle renvoie, pour une part de 1. Réglé à la mesure : la Lune, qui en use le
 * plus, a sa salle 7 dB sous le son direct ; la ville, 13 dB.
 */
const SALLE = 1.6;

type Source = OscillatorNode | AudioBufferSourceNode;

/** Une note écrite, pas encore sonnée. */
interface Ecrite {
  t: number;
  piste: string;
  ton: number;
  /** En secondes. */
  duree: number;
  force: number;
  glisse: number;
  /** Une note tenue qui attend une voix libre : combien de fois elle a déjà attendu. */
  attentes: number;
}

interface Voix {
  src: Source;
  /** Son enveloppe : ce qu'il faut débrancher quand elle a fini. */
  g: GainNode;
  t0: number;
  t1: number;
  boucle: Boucle;
}

interface Canal {
  piste: Piste;
  entree: AudioNode;
}

/** Un thème en train de jouer (ou de s'éteindre). */
interface Boucle {
  id: ThemeId;
  theme: Theme;
  /** Son volume : c'est lui qui monte et descend dans un fondu enchaîné. */
  fondu: GainNode;
  /** Sa part de réverbération, qui suit le même fondu. */
  envoi: GainNode | null;
  /** Où en est son fondu à l'heure `t`, de 0 (muet) à 1 (plein) : on le sait sans le demander au contexte. */
  niveau: (t: number) => number;
  /** Tout ce qu'il faudra débrancher. */
  noeuds: AudioNode[];
  canaux: Record<string, Canal>;
  /** La prochaine mesure à écrire, et son heure. */
  mesure: number;
  tMesure: number;
  /** Les notes écrites qui attendent leur tour, de la plus proche à la plus lointaine. */
  file: Ecrite[];
  plume: Plume;
  /** L'heure où son fondu de sortie s'achève ; l'infini tant qu'il joue. */
  fin: number;
}

export interface Etat {
  theme: ThemeId | null;
  /** La mesure qui vient d'être écrite. */
  mesure: number;
  /** Les thèmes branchés : celui qui joue, et ceux qui finissent de s'éteindre. */
  boucles: number;
  /** Les voix qui sonnent en ce moment. */
  voix: number;
  /** Depuis le début : les notes sonnées, et celles qui n'ont pas eu de voix. */
  notes: number;
  passees: number;
  enPause: boolean;
}

export interface Moteur {
  /** Joue ce thème, en fondu enchaîné avec celui qui jouait. `null` : le silence. */
  jouer(theme: ThemeId | null): void;
  /** Le volume d'ensemble : 1 en temps normal, moins quand un grand moment prend l'écran. */
  niveau(n: number): void;
  /** La page se cache : silence tout de suite, et plus rien ne s'écrit. */
  pause(): void;
  /** La page revient. */
  reprise(): void;
  /** Le réglage « Musique » est coupé : un fondu bref, puis tout est débranché. */
  arret(): void;
  /** Écrit les notes des `horizon` secondes à venir : c'est ce que fait la minuterie à chaque battement. */
  avance(horizon?: number): void;
  etat(): Etat;
  /** Le nœud où toute la musique passe avant de rejoindre la sortie : pour la mesurer. */
  bus: GainNode;
}

/**
 * `graine` : d'où part le hasard des improvisations. La même graine rejoue la même musique
 * (les tests s'en servent) ; le jeu en prend une nouvelle à chaque visite.
 */
export function creeMoteur(sortie: Sortie, graine = 20_261_127): Moteur {
  const { ctx } = sortie;
  const alea = suite(graine);

  const bus = ctx.createGain();
  bus.gain.value = NIVEAU;
  bus.connect(sortie.vers);

  let courante: Boucle | null = null;
  const sortantes: Boucle[] = [];
  let voix: Voix[] = [];
  /** Où reprendre chaque thème : au début de la phrase suivante. */
  const reprises: Partial<Record<ThemeId, number>> = {};
  let cible = 1;
  let enPause = false;
  let minuterie: ReturnType<typeof setInterval> | undefined;
  let notes = 0;
  let passees = 0;

  // -------------------------------------------------------------------------
  // La matière : les ondes, le bruit, la salle

  const ondes = new Map<readonly number[], PeriodicWave>();

  /** L'onde d'un timbre, à partir de ses harmoniques (le navigateur la ramène à une crête de 1, comme ses propres ondes). */
  function onde(harmoniques: readonly number[]): PeriodicWave {
    let w = ondes.get(harmoniques);
    if (!w) {
      const sinus = new Float32Array(harmoniques.length + 1);
      harmoniques.forEach((h, i) => {
        sinus[i + 1] = h;
      });
      w = ctx.createPeriodicWave(new Float32Array(harmoniques.length + 1), sinus);
      ondes.set(harmoniques, w);
    }
    return w;
  }

  let bruitBlanc: AudioBuffer | null = null;

  function bruit(): AudioBuffer {
    if (!bruitBlanc) {
      bruitBlanc = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = bruitBlanc.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = alea() * 2 - 1;
    }
    return bruitBlanc;
  }

  let salle: AudioNode | null | undefined;

  /**
   * La salle : une réverbération courte et sourde, la même pour tous les thèmes. Sa
   * réponse est du bruit qui s'éteint en une seconde et demie, de plus en plus voilé ; les
   * vingt premières millisecondes sont muettes, pour que la note reste nette devant.
   */
  function laSalle(): AudioNode | null {
    if (salle !== undefined) return salle;
    salle = null;
    if (typeof ctx.createConvolver !== "function") return null;
    try {
      const sr = ctx.sampleRate;
      const n = Math.floor(sr * 1.5);
      const reponse = ctx.createBuffer(2, n, sr);
      for (let canal = 0; canal < 2; canal++) {
        const data = reponse.getChannelData(canal);
        let voile = 0;
        for (let i = Math.floor(sr * 0.02); i < n; i++) {
          const x = i / n;
          voile += (0.5 - 0.42 * x) * (alea() * 2 - 1 - voile);
          data[i] = voile * (1 - x) ** 2 * Math.exp(-3.2 * x);
        }
      }
      const echo = ctx.createConvolver();
      echo.buffer = reponse;
      echo.connect(bus);
      salle = echo;
    } catch {
      salle = null;
    }
    return salle;
  }

  // -------------------------------------------------------------------------
  // Les voix : jamais trop à la fois

  /**
   * `n` voix peuvent-elles sonner de `t0` à `t1` ? Rend 0 si oui ; sinon l'heure où la
   * première des voix qui gênent se taira. On compte les voix prévues à chaque instant où
   * il en démarre une sur l'intervalle : c'est là que leur nombre culmine.
   */
  function admet(t0: number, t1: number, n: number): number {
    let at = t0;
    for (;;) {
      let actives = 0;
      let suivant = Infinity;
      let libre = Infinity;
      for (const v of voix) {
        if (v.t0 <= at && v.t1 > at) {
          actives++;
          if (v.t1 < libre) libre = v.t1;
        } else if (v.t0 > at && v.t0 < t1 && v.t0 < suivant) suivant = v.t0;
      }
      if (actives + n > VOIX_MAX) return libre;
      if (suivant === Infinity) return 0;
      at = suivant;
    }
  }

  /** Fait sonner une note écrite. Rend la note à réécrire plus tard, si elle doit attendre une voix. */
  function sonne(b: Boucle, note: Ecrite): Ecrite | null {
    const canal = b.canaux[note.piste];
    if (!canal || !(note.force > 0) || !(note.duree > 0)) return null;
    const tb = canal.piste.timbre;
    const t0 = note.t;
    const ta = t0 + Math.min(tb.a, note.duree * 0.5);
    // La fin de la note : celle qui est écrite, ou plus tôt si la corde s'est éteinte avant.
    let t1 = Math.max(ta + 0.005, t0 + note.duree);
    if (tb.s <= 0 && tb.d > 0) t1 = Math.min(t1, ta + tb.d);
    const fin = t1 + tb.r;
    const sources = tb.duo ? 2 : 1;

    const libre = admet(t0, fin, sources);
    if (libre !== 0) {
      // Une note tenue (une nappe, un accord d'orgue) entre dès qu'une voix se libère, si
      // elle a encore l'essentiel de sa durée devant elle. Les autres sont passées.
      const reste = t0 + note.duree - libre;
      if (note.duree >= 1.2 && note.attentes < 3 && reste >= note.duree * 0.5) {
        return { ...note, t: libre + 0.005, duree: reste, attentes: note.attentes + 1 };
      }
      passees++;
      return null;
    }

    const g = ctx.createGain();
    const p = g.gain;
    p.setValueAtTime(0, t0);
    p.linearRampToValueAtTime(note.force, ta);
    if (tb.d > 0) {
      // La décroissance : vers le niveau tenu, ou vers le silence (un centième de la crête).
      const plancher = tb.s > 0 ? tb.s : 0.01;
      const td = ta + tb.d;
      if (t1 <= td) {
        p.exponentialRampToValueAtTime(note.force * plancher ** ((t1 - ta) / tb.d), t1);
      } else {
        p.exponentialRampToValueAtTime(note.force * plancher, td);
        p.setValueAtTime(note.force * plancher, t1);
      }
    } else {
      p.setValueAtTime(note.force, t1);
    }
    // Le relâchement finit à zéro, exactement : la source peut s'arrêter sans claquer.
    p.linearRampToValueAtTime(0, fin);
    g.connect(canal.entree);

    const arret = fin + 0.03;
    let derniere: Source | null = null;
    for (let k = 0; k < sources; k++) {
      let src: Source;
      if (tb.onde === "bruit") {
        const souffle = ctx.createBufferSource();
        souffle.buffer = bruit();
        souffle.loop = true;
        souffle.connect(g);
        souffle.start(t0, alea() * 0.8);
        src = souffle;
      } else {
        const osc = ctx.createOscillator();
        if (typeof tb.onde === "string") osc.type = tb.onde;
        else osc.setPeriodicWave(onde(tb.onde));
        const f = hertz(note.ton);
        if (note.glisse) {
          // La note est prise par en dessous, et tirée jusqu'à sa hauteur : une corde qu'on tend.
          osc.frequency.setValueAtTime(hertz(note.ton + note.glisse), t0);
          osc.frequency.exponentialRampToValueAtTime(f, t0 + 0.09);
        } else if (tb.chute) {
          osc.frequency.setValueAtTime(f * tb.chute, t0);
          osc.frequency.exponentialRampToValueAtTime(f, t0 + 0.05);
        } else {
          osc.frequency.setValueAtTime(f, t0);
        }
        const faux = (tb.flou ? (alea() * 2 - 1) * tb.flou : 0) + (tb.duo ? (k === 0 ? -0.5 : 0.5) * tb.duo : 0);
        if (faux !== 0) osc.detune.value = faux;
        osc.connect(g);
        osc.start(t0);
        src = osc;
      }
      src.stop(arret);
      voix.push({ src, g, t0, t1: fin, boucle: b });
      derniere = src;
    }
    // La note éteinte, son volume est débranché : plus rien ne la retient.
    if (derniere) derniere.onended = () => g.disconnect();
    notes++;
    return null;
  }

  // -------------------------------------------------------------------------
  // Les thèmes : ouvrir, écrire, quitter, fermer

  function ouvre(id: ThemeId, now: number): Boucle {
    const theme = THEMES[id];
    const noeuds: AudioNode[] = [];
    const fondu = ctx.createGain();
    fondu.gain.value = 0;
    fondu.gain.setTargetAtTime(theme.volume, now, FONDU / 4);
    fondu.connect(bus);
    noeuds.push(fondu);

    const echo = theme.salle ? laSalle() : null;
    let envoi: GainNode | null = null;
    if (echo) {
      envoi = ctx.createGain();
      envoi.gain.value = 0;
      envoi.gain.setTargetAtTime(theme.volume * (theme.salle ?? 0) * SALLE, now, FONDU / 4);
      envoi.connect(echo);
      noeuds.push(envoi);
    }

    const canaux: Record<string, Canal> = {};
    for (const [nom, piste] of Object.entries(theme.pistes)) {
      const volume = ctx.createGain();
      volume.gain.value = piste.vol;
      noeuds.push(volume);
      let entree: AudioNode = volume;
      if (piste.filtre) {
        const filtre = ctx.createBiquadFilter();
        filtre.type = piste.filtre[0];
        filtre.frequency.value = piste.filtre[1];
        filtre.Q.value = piste.filtre[2] ?? 0.7;
        filtre.connect(volume);
        noeuds.push(filtre);
        entree = filtre;
      }
      let bout: AudioNode = volume;
      if (piste.pan && typeof ctx.createStereoPanner === "function") {
        const pan = ctx.createStereoPanner();
        pan.pan.value = piste.pan;
        volume.connect(pan);
        noeuds.push(pan);
        bout = pan;
      }
      bout.connect(fondu);
      if (envoi && piste.salle) {
        const part = ctx.createGain();
        part.gain.value = piste.salle;
        bout.connect(part);
        part.connect(envoi);
        noeuds.push(part);
      }
      canaux[nom] = { piste, entree };
    }

    const pas = 60 / theme.tempo / theme.division;
    const b: Boucle = {
      id, theme, fondu, envoi, noeuds, canaux,
      // Le fondu d'entrée : le volume rejoint sa valeur en une seconde environ.
      niveau: (t) => 1 - Math.exp(-Math.max(0, t - now) / (FONDU / 4)),
      mesure: reprises[id] ?? 0,
      tMesure: now + DEPART,
      file: [],
      fin: Infinity,
      plume: {
        alea,
        m: {},
        n(piste, position, hauteur, duree, force = 1, glisse = 0) {
          // Le balancement retarde les pas impairs ; la souplesse déplace chaque note d'un cheveu.
          const boiteux = theme.balance && Math.floor(position) % 2 === 1 ? theme.balance : 0;
          const cheveu = theme.souple ? (alea() * 2 - 1) * theme.souple : 0;
          b.file.push({
            t: b.tMesure + (position + boiteux) * pas + cheveu,
            piste, ton: hauteur, duree: duree * pas, force, glisse, attentes: 0,
          });
        },
      },
    };
    return b;
  }

  /** Écrit la prochaine mesure du thème dans sa file. */
  function ecrit(b: Boucle): void {
    const { theme } = b;
    try {
      theme.mesure(b.mesure, b.plume);
    } catch {
      // Une mesure qui ne s'écrit pas, c'est un silence : la musique continue à la suivante.
      passees++;
    }
    b.mesure++;
    b.tMesure += (theme.pas * 60) / theme.tempo / theme.division;
    b.file.sort((x, y) => x.t - y.t);
  }

  /**
   * Le thème s'éteint en `duree` secondes. Son volume part d'où il en est (même au milieu de
   * son fondu d'entrée), tombe vite au quart, puis rejoint zéro, exactement : ses notes
   * encore tenues peuvent alors s'arrêter sans claquer. Celles qui étaient écrites mais
   * n'avaient pas commencé ne sonneront pas : la place est au thème qui arrive.
   */
  function eteint(b: Boucle, now: number, duree: number): void {
    const depart = b.niveau(now);
    const coude = now + duree * 0.35;
    const fin = now + duree;
    b.niveau = (t) =>
      t >= fin ? 0 : t <= coude ? depart * (1 - (0.75 * (t - now)) / (coude - now)) : (depart * 0.25 * (fin - t)) / (fin - coude);
    b.fin = fin + 0.02;
    const pleins: [GainNode | null, number][] = [
      [b.fondu, b.theme.volume],
      [b.envoi, b.theme.volume * (b.theme.salle ?? 0) * SALLE],
    ];
    for (const [g, plein] of pleins) {
      if (!g) continue;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(plein * depart, now);
      g.gain.linearRampToValueAtTime(plein * depart * 0.25, coude);
      g.gain.linearRampToValueAtTime(0, fin);
    }
    b.file = [];
    for (const v of voix) {
      if (v.boucle !== b || v.t1 <= now) continue;
      const jamais = v.t0 > now;
      if (!jamais && v.t1 <= b.fin) continue;
      try {
        v.src.stop(jamais ? 0 : b.fin);
      } catch {
        // Une source déjà arrêtée.
      }
      if (jamais) {
        v.g.disconnect();
        v.t1 = v.t0;
      } else {
        v.t1 = b.fin;
      }
    }
  }

  /** Le thème s'en va. */
  function quitte(b: Boucle, now: number, duree: number): void {
    // On le retrouvera au début de la phrase suivante (ou de celle-ci, s'il venait de la commencer).
    const { phrase } = b.theme;
    reprises[b.id] = Math.ceil(Math.max(0, b.mesure - 1) / phrase) * phrase;
    // Un thème qui s'éteignait encore quand celui-ci s'en va à son tour (trois écrans en une
    // seconde) s'efface tout de suite : jamais trois musiques à la fois.
    for (const vieux of sortantes) if (vieux.fin > now + 0.4) eteint(vieux, now, 0.15);
    eteint(b, now, duree);
    sortantes.push(b);
  }

  function ferme(b: Boucle): void {
    for (const n of b.noeuds) {
      try {
        n.disconnect();
      } catch {
        // Déjà débranché.
      }
    }
    b.noeuds = [];
  }

  // -------------------------------------------------------------------------
  // La minuterie

  function regle(): void {
    const utile = !enPause && (courante !== null || sortantes.length > 0);
    if (utile && minuterie === undefined) minuterie = setInterval(() => avance(), BATTEMENT);
    else if (!utile && minuterie !== undefined) {
      clearInterval(minuterie);
      minuterie = undefined;
    }
  }

  function avance(horizon: number = AVANCE): void {
    const now = ctx.currentTime;
    // Le ménage : les thèmes éteints sont débranchés, les voix finies sont oubliées.
    for (let i = sortantes.length - 1; i >= 0; i--) {
      if (now >= sortantes[i]!.fin + 0.05) ferme(sortantes.splice(i, 1)[0]!);
    }
    if (voix.some((v) => v.t1 <= now)) voix = voix.filter((v) => v.t1 > now);

    const b = courante;
    if (b && !enPause) {
      // En retard (le fil principal s'est figé, la page revient) : la musique reprend où
      // elle en était, sans jouer d'un coup tout ce qu'elle a manqué.
      const prochain = b.file.length > 0 ? b.file[0]!.t : b.tMesure;
      if (prochain < now) {
        const retard = now + 0.04 - prochain;
        b.tMesure += retard;
        for (const n of b.file) n.t += retard;
      }
      const limite = now + horizon;
      while (b.tMesure < limite) ecrit(b);
      let k = 0;
      const attendent: Ecrite[] = [];
      while (k < b.file.length && b.file[k]!.t < limite) {
        try {
          const plusTard = sonne(b, b.file[k++]!);
          if (plusTard) attendent.push(plusTard);
        } catch {
          // Une note que le navigateur refuse est passée : elle ne fait pas taire les autres.
          passees++;
        }
      }
      b.file.splice(0, k);
      if (attendent.length > 0) {
        b.file.push(...attendent);
        b.file.sort((x, y) => x.t - y.t);
      }
    }
    regle();
  }

  function versLeBus(valeur: number, quand: number, lenteur: number): void {
    bus.gain.cancelScheduledValues(quand);
    bus.gain.setTargetAtTime(valeur, quand, lenteur);
  }

  function jouer(id: ThemeId | null, duree: number = FONDU): void {
    if ((courante?.id ?? null) === id) return;
    const now = ctx.currentTime;
    if (courante) quitte(courante, now, duree);
    courante = id ? ouvre(id, now) : null;
    avance();
  }

  return {
    bus,
    jouer: (id) => jouer(id),
    arret: () => jouer(null, 0.25),
    niveau(n) {
      cible = Math.max(0, Math.min(1, n));
      if (!enPause) versLeBus(NIVEAU * cible, ctx.currentTime, 0.14);
    },
    pause() {
      if (enPause) return;
      enPause = true;
      versLeBus(0, ctx.currentTime, 0.012);
      regle();
    },
    reprise() {
      if (!enPause) return;
      enPause = false;
      versLeBus(NIVEAU * cible, ctx.currentTime + 0.02, 0.18);
      avance();
    },
    avance,
    etat() {
      const now = ctx.currentTime;
      return {
        theme: courante?.id ?? null,
        mesure: courante ? courante.mesure - 1 : -1,
        boucles: (courante ? 1 : 0) + sortantes.length,
        voix: voix.filter((v) => v.t0 <= now && v.t1 > now).length,
        notes, passees, enPause,
      };
    },
  };
}
