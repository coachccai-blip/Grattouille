// Stockage local (BRIEF.md, section 11) : trois clés, rien d'autre.
//   grattouille.auth      identifiant et code de récupération
//   grattouille.settings  son, musique, vibrations, animations réduites, langue, signe préféré
//   grattouille.revealed  tickets grattés pas encore déclarés au serveur

import { isLang, type Lang } from "../i18n";

const KEY_AUTH = "grattouille.auth";
const KEY_SETTINGS = "grattouille.settings";
const KEY_REVEALED = "grattouille.revealed";

export interface Auth {
  playerId: string;
  code: string;
}

export interface Settings {
  son: boolean;
  /** La musique d'ambiance : un réglage à part, que « Son » ne commande pas. */
  musique: boolean;
  vibrations: boolean;
  /** Réglage « Animations réduites ». La préférence du système s'y ajoute. */
  calme: boolean;
  /** La langue du jeu : français par défaut, anglais au choix. */
  langue: Lang;
  /** Signe préféré, par ticket : proposé par défaut la fois suivante. */
  signes: Record<string, string>;
  /** L'invitation à noter le code de récupération a déjà été vue. */
  codeNote: boolean;
  /** Les médailles déjà regardées dans la vitrine des trophées (src/app/trophees.ts). */
  medailles: MedaillesVues;
  /** Les histoires des hôtes déjà regardées dans les Souvenirs (src/app/store.ts), sous la même forme : « lieu », ou « lieu+ » avec son dernier temps. */
  histoires: MedaillesVues;
}

/** Les médailles qu'un compte a déjà regardées sur cet appareil : « famille:rang ». */
export interface MedaillesVues {
  /** Le compte à qui elles sont : un autre compte, sur le même appareil, repart de zéro. */
  joueur: string;
  vues: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  son: true,
  musique: true,
  vibrations: true,
  calme: false,
  langue: "fr",
  signes: {},
  codeNote: false,
  medailles: { joueur: "", vues: [] },
  histoires: { joueur: "", vues: [] },
};

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage plein ou refusé (navigation privée) : le jeu continue sans mémoire.
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Rien à faire.
  }
}

export function loadAuth(): Auth | null {
  const a = read<Partial<Auth>>(KEY_AUTH);
  return a && typeof a.playerId === "string" && typeof a.code === "string" ? { playerId: a.playerId, code: a.code } : null;
}

export function saveAuth(auth: Auth): void {
  write(KEY_AUTH, auth);
}

export function loadSettings(): Settings {
  const s = read<Partial<Settings>>(KEY_SETTINGS) ?? {};
  return {
    son: typeof s.son === "boolean" ? s.son : DEFAULT_SETTINGS.son,
    // Des réglages enregistrés avant la musique ne connaissent pas ce champ : elle est allumée.
    musique: typeof s.musique === "boolean" ? s.musique : DEFAULT_SETTINGS.musique,
    vibrations: typeof s.vibrations === "boolean" ? s.vibrations : DEFAULT_SETTINGS.vibrations,
    calme: typeof s.calme === "boolean" ? s.calme : DEFAULT_SETTINGS.calme,
    langue: isLang(s.langue) ? s.langue : DEFAULT_SETTINGS.langue,
    signes: s.signes && typeof s.signes === "object" ? { ...s.signes } : {},
    codeNote: s.codeNote === true,
    medailles: readMedailles(s.medailles),
    // Des réglages enregistrés avant les Souvenirs non plus : aucune histoire n'a encore été regardée.
    histoires: readMedailles(s.histoires),
  };
}

/** Des réglages enregistrés avant les trophées ne connaissent pas ce champ : rien n'a encore été regardé. */
function readMedailles(raw: unknown): MedaillesVues {
  const m = (raw && typeof raw === "object" ? raw : {}) as Partial<MedaillesVues>;
  return {
    joueur: typeof m.joueur === "string" ? m.joueur : "",
    vues: Array.isArray(m.vues) ? m.vues.filter((x): x is string => typeof x === "string") : [],
  };
}

export function saveSettings(settings: Settings): void {
  write(KEY_SETTINGS, settings);
}

export function loadRevealed(): string[] {
  const list = read<unknown>(KEY_REVEALED);
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
}

export function saveRevealed(ids: readonly string[]): void {
  if (ids.length === 0) remove(KEY_REVEALED);
  else write(KEY_REVEALED, ids);
}

/** Suppression du compte : l'appareil vide son stockage. */
export function clearAll(): void {
  remove(KEY_AUTH);
  remove(KEY_SETTINGS);
  remove(KEY_REVEALED);
}

export function clearSession(): void {
  remove(KEY_AUTH);
  remove(KEY_REVEALED);
}
