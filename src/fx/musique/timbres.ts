// Les instruments de l'orchestre : rien que de la synthèse (un oscillateur ou du bruit,
// une enveloppe, parfois un filtre sur la piste). Une note coûte une voix, deux pour les
// instruments à deux anches (l'accordéon musette).
//
// Dans la famille des bruitages : des timbres ronds, des attaques jamais sèches. Les
// formes d'onde sont données par leurs harmoniques (la première vaut 1) : c'est ce qui
// distingue une lame d'une corde pincée, d'une anche ou d'un clavecin.

export interface Timbre {
  /** Un type d'oscillateur, la liste des harmoniques d'une onde périodique, ou « bruit ». */
  onde: OscillatorType | readonly number[] | "bruit";
  /** La montée, en secondes : jamais nulle, donc jamais de claquement. */
  a: number;
  /**
   * La décroissance, en secondes : le temps que met la note à retomber à son niveau tenu
   * (`s`), ou à s'éteindre si elle ne tient pas (corde pincée, lame, percussion).
   */
  d: number;
  /** Le niveau tenu, de 0 à 1. Zéro : la note s'éteint d'elle-même. */
  s: number;
  /** Le relâchement, en secondes, une fois la note finie. */
  r: number;
  /** Un second oscillateur, désaccordé de tant de centièmes de demi-ton : deux anches qui battent. */
  duo?: number;
  /** Chaque note est désaccordée au hasard d'au plus tant de centièmes : un instrument tenu par quelqu'un. */
  flou?: number;
  /** La hauteur part de tant de fois la note et y retombe en 50 ms : la peau d'un tambour. */
  chute?: number;
}

export interface Piste {
  timbre: Timbre;
  /** Sa place dans le mélange : 1 pour la voix qui chante ; le bruit filtré, plus faible par nature, peut dépasser 1. */
  vol: number;
  /** Le filtre de la piste : son type, sa fréquence, sa résonance. */
  filtre?: readonly [type: BiquadFilterType, frequence: number, q?: number];
  /** Sa place dans l'espace, de -1 (à gauche) à 1 (à droite). */
  pan?: number;
  /** La part envoyée dans la salle (la réverbération), de 0 à 1. */
  salle?: number;
}

// --- Les lames et les cordes : la note s'éteint d'elle-même.

/** Une lame de boîte à musique, de célesta : la fondamentale, son octave, un rien de douzième. */
export const LAME: Timbre = { onde: [1, 0.3, 0.12, 0.05], a: 0.004, d: 1.1, s: 0, r: 0.08, flou: 3 };
/** Une lame de vibraphone : la fondamentale et la double octave, qui chante longtemps. */
export const VIBRA: Timbre = { onde: [1, 0, 0.04, 0.2], a: 0.006, d: 1.7, s: 0, r: 0.12, flou: 3 };
/** Un verre qu'on effleure : presque une sinusoïde, très longue. */
export const VERRE: Timbre = { onde: [1, 0.08, 0, 0.06], a: 0.02, d: 3.2, s: 0, r: 0.3, flou: 4 };
/** Une corde pincée, légère : ukulélé, mandoline, pompe de guitare. */
export const PINCE: Timbre = { onde: [1, 0.55, 0.35, 0.22, 0.14, 0.09, 0.06, 0.04], a: 0.003, d: 0.55, s: 0, r: 0.05, flou: 5 };
/** Une guitare de jazz, ronde, qui tient la note. */
export const GUITARE: Timbre = { onde: [1, 0.42, 0.2, 0.1, 0.05, 0.02], a: 0.005, d: 1.5, s: 0, r: 0.1, flou: 4 };
/** Un piano électrique feutré. */
export const RHODES: Timbre = { onde: [1, 0.3, 0.1, 0.04, 0.02, 0.03], a: 0.006, d: 1.9, s: 0, r: 0.16, flou: 3 };
/** Un clavecin : toutes les harmoniques, une attaque franche, une extinction rapide. */
export const CLAVECIN: Timbre = {
  onde: [1, 0.85, 0.75, 0.62, 0.55, 0.46, 0.4, 0.33, 0.28, 0.23, 0.2, 0.16, 0.13, 0.1, 0.08, 0.06],
  a: 0.003, d: 1.6, s: 0, r: 0.07, flou: 3,
};
/** Une contrebasse en pizzicato : elle marche, elle rebondit. */
export const CONTREBASSE: Timbre = { onde: [1, 0.5, 0.24, 0.12, 0.06], a: 0.01, d: 0.9, s: 0, r: 0.07, flou: 3 };

// --- Les instruments qui tiennent la note.

/** Une basse ronde, qui pousse sans peser. */
export const BASSE: Timbre = { onde: [1, 0.55, 0.28, 0.12, 0.05], a: 0.012, d: 0.3, s: 0.55, r: 0.08 };
/** L'accordéon musette : deux anches désaccordées, qui battent. */
export const ACCORDEON: Timbre = {
  onde: [1, 0.72, 0.58, 0.4, 0.32, 0.24, 0.18, 0.13, 0.09, 0.06, 0.04],
  a: 0.03, d: 0.25, s: 0.85, r: 0.09, duo: 13,
};
/** Une flûte, un sifflet : presque une sinusoïde, avec du souffle dans l'attaque. */
export const FLUTE: Timbre = { onde: [1, 0.14, 0.05], a: 0.045, d: 0.3, s: 0.8, r: 0.14, flou: 4 };
/** Un clavier doux des années quatre-vingt : creux comme une clarinette. */
export const CLAVIER: Timbre = { onde: [1, 0, 0.3, 0, 0.14, 0, 0.07], a: 0.02, d: 0.4, s: 0.7, r: 0.16, flou: 4 };
/** Une viole, un violoncelle : l'archet met du temps à prendre la corde. */
export const VIOLE: Timbre = { onde: [1, 0.5, 0.34, 0.2, 0.12, 0.07, 0.04], a: 0.09, d: 0.4, s: 0.85, r: 0.3, flou: 4 };
/** Une nappe : elle arrive et s'en va sans qu'on sache quand. */
export const NAPPE: Timbre = { onde: [1, 0.22, 0.1, 0.04], a: 1.3, d: 0, s: 1, r: 1.3, flou: 6 };

// --- Les percussions : du bruit filtré par la piste, ou une note brève.

/** Une cymbale charleston fermée : un « tss ». */
export const CHARLEY: Timbre = { onde: "bruit", a: 0.002, d: 0.05, s: 0, r: 0.01 };
/** Une cymbale ride : elle sonne après le coup. */
export const RIDE: Timbre = { onde: "bruit", a: 0.003, d: 0.32, s: 0, r: 0.02 };
/** Un shaker, des maracas : un « tch » sans attaque. */
export const SHAKER: Timbre = { onde: "bruit", a: 0.014, d: 0.07, s: 0, r: 0.01 };
/** Le balai qui tourne sur la peau : un souffle qui enfle et retombe. */
export const BALAI: Timbre = { onde: "bruit", a: 0.09, d: 0.4, s: 0, r: 0.04 };
/** Le balai qui frappe, un claquement de doigts : sec, sans dureté. */
export const TAPE: Timbre = { onde: "bruit", a: 0.003, d: 0.085, s: 0, r: 0.01 };
/** Une grosse caisse sourde, accordée : la hauteur tombe d'une douzième (c'est ce « toc » qu'on entend sur un téléphone). */
export const PIED: Timbre = { onde: "sine", a: 0.004, d: 0.2, s: 0, r: 0.02, chute: 3 };
/** Le tic d'une horloge, un bloc de bois : une note très brève. */
export const TIC: Timbre = { onde: "triangle", a: 0.002, d: 0.045, s: 0, r: 0.01 };
