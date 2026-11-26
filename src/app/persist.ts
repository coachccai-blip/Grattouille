// Stockage local (BRIEF.md, section 11) : trois clés, rien d'autre.
//   grattouille.auth      identifiant et code de récupération
//   grattouille.settings  son, vibrations, animations réduites, langue, signe préféré
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
  vibrations: boolean;
  /** Réglage « Animations réduites ». La préférence du système s'y ajoute. */
  calme: boolean;
  /** La langue du jeu : français par défaut, anglais au choix. */
  langue: Lang;
  /** Signe préféré, par ticket : proposé par défaut la fois suivante. */
  signes: Record<string, string>;
  /** L'invitation à noter le code de récupération a déjà été vue. */
  codeNote: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  son: true,
  vibrations: true,
  calme: false,
  langue: "fr",
  signes: {},
  codeNote: false,
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
    vibrations: typeof s.vibrations === "boolean" ? s.vibrations : DEFAULT_SETTINGS.vibrations,
    calme: typeof s.calme === "boolean" ? s.calme : DEFAULT_SETTINGS.calme,
    langue: isLang(s.langue) ? s.langue : DEFAULT_SETTINGS.langue,
    signes: s.signes && typeof s.signes === "object" ? { ...s.signes } : {},
    codeNote: s.codeNote === true,
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
