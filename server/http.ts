// Outils communs aux routes : réponses JSON, lecture du corps, squelette d'une
// écriture authentifiée (BRIEF.md, sections 15.5, 15.6 et 15.8).

import { MAX_ACK, MAX_BODY_BYTES } from "../shared/rules";
import type { BoardEntry, PlayerState } from "../shared/types";
import { TICKET_ID_RE, readCredentials, safeEqual } from "./auth";
import { planPublish, publish } from "./board";
import { ApiError, fail } from "./errors";
import { applyAck, toState, type PlayerRecord } from "./player";
import { commit, unchanged, type Mutation, type Storage } from "./storage";

export interface Deps {
  storage: Storage;
  /** `prod`, `test` ou `bac-a-sable`. */
  context: string;
  /** Clé d'administration, lue dans une variable d'environnement. Jamais dans le dépôt. */
  adminKey?: string | null;
  now: () => number;
  /** Entier 32 bits non signé, tiré de crypto.getRandomValues en production. */
  random32: () => number;
  /** Laisse finir une tâche après la réponse (context.waitUntil sur Netlify). */
  defer?: (task: Promise<unknown>) => void;
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...headers } });
}

export function errorResponse(error: ApiError): Response {
  return json({ error: { code: error.code, message: error.message } }, error.status);
}

export type Body = Record<string, unknown>;

/**
 * Corps de requête : JSON, 4 Ko au plus, un objet. Un corps vide vaut `{}`.
 * Le type application/json est exigé : une page d'une autre origine ne peut pas
 * l'envoyer sans pré-vérification, et aucun en-tête CORS ne l'y autorise.
 */
export async function readBody(req: Request): Promise<Body> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) fail("BAD_REQUEST");
  let text: string;
  try {
    text = await req.text();
  } catch {
    fail("BAD_REQUEST");
  }
  if (text.length === 0) return {};
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) fail("BAD_REQUEST");
  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (!type.startsWith("application/json")) fail("BAD_REQUEST");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail("BAD_REQUEST");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) fail("BAD_REQUEST");
  return parsed as Body;
}

/** `ack` : une liste d'identifiants de tickets grattés. Absent : liste vide. */
export function readAck(body: Body, required = false): string[] {
  const raw = body.ack;
  if (raw === undefined || raw === null) {
    if (required) fail("BAD_REQUEST");
    return [];
  }
  if (!Array.isArray(raw) || raw.length > MAX_ACK) fail("BAD_REQUEST");
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id !== "string" || !TICKET_ID_RE.test(id)) fail("BAD_REQUEST");
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/** Lit un joueur authentifié, sans rien écrire. */
export async function readPlayer(req: Request, deps: Deps): Promise<PlayerRecord> {
  const cred = await readCredentials(req);
  if (!cred) fail("UNAUTHORIZED");
  const record = await deps.storage.getPlayer(cred.playerId);
  if (!record || !safeEqual(record.codeHash, cred.codeHash)) fail("UNAUTHORIZED");
  return record;
}

/**
 * Squelette d'une écriture : authentifier, lire le joueur et son etag, appliquer
 * `ack`, valider et modifier (`action`), recalculer, décider de la publication,
 * écrire sous condition, puis publier au classement.
 * `action` lève une ApiError pour refuser : rien n'est alors écrit.
 */
export async function writePlayer<T>(
  req: Request,
  deps: Deps,
  ack: readonly string[],
  action: (p: PlayerRecord, now: number, paid: number) => Mutation<T>,
): Promise<{ result: T; state: PlayerState }> {
  const cred = await readCredentials(req);
  if (!cred) fail("UNAUTHORIZED");
  const now = deps.now();
  const out: { entry: BoardEntry | null; state: PlayerState | null } = { entry: null, state: null };
  let result: T;
  try {
    result = await deps.storage.mutatePlayer(cred.playerId, (p) => {
      if (!safeEqual(p.codeHash, cred.codeHash)) fail("UNAUTHORIZED");
      // Le serveur traite toujours `ack` avant de vérifier le solde.
      const paid = applyAck(p, ack);
      const mutation = action(p, now, paid);
      out.entry = null;
      if (mutation.write) {
        p.updatedAt = now;
        out.entry = planPublish(p, now);
      }
      out.state = toState(p, now);
      return mutation;
    });
  } catch (error) {
    // Un identifiant inconnu ne se distingue pas d'un mauvais code.
    if (error instanceof ApiError && error.code === "NOT_FOUND") fail("UNAUTHORIZED");
    throw error;
  }
  if (out.entry) {
    const task = publish(deps.storage, out.entry, now);
    if (deps.defer) deps.defer(task);
    else await task;
  }
  return { result, state: out.state! };
}

export { commit, unchanged };
