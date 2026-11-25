// Authentification sans e-mail ni mot de passe (BRIEF.md, section 11).
// Authorization: Bearer {playerId}.{code}
// Le serveur ne conserve que l'empreinte SHA-256 du code.

import { uniformInt } from "../shared/economy";
import { CODE_ALPHABET, CODE_LENGTH, normalizeCode } from "../shared/rules";

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const PLAYER_ID_RE = /^p_[a-z0-9]{16}$/;
export const TICKET_ID_RE = /^t_[a-z0-9]{12}$/;

/** Un entier 32 bits non signé tiré de crypto.getRandomValues. */
export function cryptoRandom32(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]!;
}

export function randomString(alphabet: string, length: number, next32: () => number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[uniformInt(alphabet.length, next32)];
  return out;
}

/** `p_` suivi de 16 caractères aléatoires. */
export function newPlayerId(next32: () => number): string {
  return `p_${randomString(ID_ALPHABET, 16, next32)}`;
}

/** `t_` suivi de 12 caractères aléatoires. */
export function newTicketId(next32: () => number): string {
  return `t_${randomString(ID_ALPHABET, 12, next32)}`;
}

/** Code de récupération : 16 caractères, sans caractères ambigus. */
export function newCode(next32: () => number): string {
  return randomString(CODE_ALPHABET, CODE_LENGTH, next32);
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  let hex = "";
  for (const byte of new Uint8Array(digest)) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

/** Comparaison en temps constant de deux chaînes. */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export interface Credentials {
  playerId: string;
  /** Empreinte du code présenté, à comparer à celle du joueur. */
  codeHash: string;
}

/** Lit l'en-tête Authorization. `null` s'il est absent ou mal formé. */
export async function readCredentials(req: Request): Promise<Credentials | null> {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1]!;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const playerId = token.slice(0, dot);
  const code = normalizeCode(token.slice(dot + 1));
  if (!PLAYER_ID_RE.test(playerId) || !code) return null;
  return { playerId, codeHash: await sha256Hex(code) };
}

/** Lit une clé d'administration présentée en Bearer. */
export function readBearer(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1]! : null;
}

export function isPlayerId(x: unknown): x is string {
  return typeof x === "string" && PLAYER_ID_RE.test(x);
}
