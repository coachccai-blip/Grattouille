// Client d'API (BRIEF.md, sections 15.5 et 15.9).
// - Une requête à la fois : les requêtes passent par une file.
// - Jamais de renvoi automatique d'un POST. Après une erreur réseau, c'est le
//   magasin d'état qui relit GET /api/me et se cale sur le serveur.
// - Mode bac à sable (?bac-a-sable) : une fausse API en mémoire, qui n'écrit
//   jamais sur le serveur.

import type {
  ApiErrorBody, CreatePlayerResponse, ErrorCode, HealthResponse, LeaderboardResponse, Look, OkResponse,
  SessionResponse, StateResponse, TicketsResponse,
} from "../../shared/types";
import type { Auth } from "./persist";

/**
 * Les codes du serveur, plus trois situations propres au client :
 * NETWORK (pas de réponse), SERVER_ERROR (panne), NO_SERVER (l'API n'est pas déployée).
 */
export type FailureCode = ErrorCode | "SERVER_ERROR" | "NETWORK" | "NO_SERVER";

export class ApiFailure extends Error {
  readonly code: FailureCode;
  readonly status: number;

  constructor(code: FailureCode, status = 0, message = "") {
    super(message || code);
    this.name = "ApiFailure";
    this.code = code;
    this.status = status;
  }
}

export interface RawRequest {
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
  auth?: Auth | null;
  keepalive?: boolean;
}

export interface RawResponse {
  status: number;
  data: unknown;
}

export type Transport = (req: RawRequest) => Promise<RawResponse>;

const TIMEOUT_MS = 15_000;

const httpTransport: Transport = async ({ method, path, body, auth, keepalive }) => {
  const headers: Record<string, string> = { accept: "application/json" };
  if (auth) headers.authorization = `Bearer ${auth.playerId}.${auth.code}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  let text: string;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive,
      signal: keepalive ? undefined : controller.signal,
      // Le classement est le seul contenu mis en cache (30 secondes, côté serveur).
      cache: path === "/api/leaderboard" ? "default" : "no-store",
      credentials: "omit",
    });
    text = await res.text();
  } catch {
    throw new ApiFailure("NETWORK");
  } finally {
    window.clearTimeout(timer);
  }
  try {
    return { status: res.status, data: JSON.parse(text) as unknown };
  } catch {
    // Une page HTML à la place du JSON : la fonction n'est pas déployée avec le site.
    const html = (res.headers.get("content-type") ?? "").includes("text/html");
    throw new ApiFailure(html || res.status === 404 ? "NO_SERVER" : "SERVER_ERROR", res.status);
  }
};

let transport: Transport = httpTransport;
let sandboxed = false;

/** Vrai si l'adresse demande le mode bac à sable. */
export function wantsSandbox(): boolean {
  return new URLSearchParams(window.location.search).has("bac-a-sable");
}

export function isSandbox(): boolean {
  return sandboxed;
}

/** Bascule sur la fausse API en mémoire. Le code serveur n'est chargé que dans ce cas. */
export async function enableSandbox(): Promise<void> {
  const mod = await import("./sandbox");
  transport = mod.createSandboxTransport(new URLSearchParams(window.location.search));
  sandboxed = true;
}

// Une requête à la fois.
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job);
  chain = run.catch(() => undefined);
  return run;
}

async function send<T>(req: RawRequest): Promise<T> {
  const { status, data } = await transport(req);
  if (status >= 200 && status < 300) return data as T;
  const error = (data as Partial<ApiErrorBody> | null)?.error;
  const code = (error?.code ?? "SERVER_ERROR") as FailureCode;
  throw new ApiFailure(code, status, error?.message ?? "");
}

function call<T>(req: RawRequest): Promise<T> {
  return enqueue(() => send<T>(req));
}

export const api = {
  health: () => call<HealthResponse>({ method: "GET", path: "/api/health" }),

  createPlayer: (pseudo: string, species: string) =>
    call<CreatePlayerResponse>({ method: "POST", path: "/api/players", body: { pseudo, species } }),

  openSession: (pseudo: string, code: string) =>
    call<SessionResponse>({ method: "POST", path: "/api/session", body: { pseudo, code } }),

  me: (auth: Auth) => call<StateResponse>({ method: "GET", path: "/api/me", auth }),

  buyTickets: (auth: Auth, type: string, qty: number, ack: string[]) =>
    call<TicketsResponse>({ method: "POST", path: "/api/tickets/buy", auth, body: { type, qty, ack } }),

  houseTicket: (auth: Auth, ack: string[]) =>
    call<TicketsResponse>({ method: "POST", path: "/api/tickets/house", auth, body: { ack } }),

  ack: (auth: Auth, ack: string[]) =>
    call<StateResponse>({ method: "POST", path: "/api/tickets/ack", auth, body: { ack } }),

  /** Déclaration envoyée au passage en arrière-plan : hors file, sans attendre la réponse. */
  ackNow: (auth: Auth, ack: string[]): void => {
    void transport({ method: "POST", path: "/api/tickets/ack", auth, body: { ack }, keepalive: true }).catch(() => undefined);
  },

  buyItem: (auth: Auth, itemId: string, ack: string[]) =>
    call<StateResponse>({ method: "POST", path: "/api/shop/buy", auth, body: { itemId, ack } }),

  setLook: (auth: Auth, change: { look?: Partial<Look>; species?: string }) =>
    call<StateResponse>({ method: "POST", path: "/api/look", auth, body: change }),

  deleteMe: (auth: Auth) => call<OkResponse>({ method: "DELETE", path: "/api/me", auth }),

  leaderboard: () => call<LeaderboardResponse>({ method: "GET", path: "/api/leaderboard" }),
};
