// Point de jonction avec Netlify : choisit le contexte, branche Netlify Blobs,
// puis confie la requête à app.ts (BRIEF.md, sections 15.7 et 16).

import type { Context } from "@netlify/functions";
import { handle } from "./app";
import { cryptoRandom32 } from "./auth";
import { BlobsStorage } from "./storage.blobs";
import type { Storage } from "./storage";

const storages = new Map<string, Storage>();

/**
 * `prod` quand le déploiement est celui de production, `test` dans tous les autres
 * cas (aperçus, branches, développement local). Sans cette séparation, un aperçu
 * écrirait dans les données des vrais joueurs.
 */
export function contextName(context: Context | undefined): "prod" | "test" {
  return context?.deploy?.context === "production" ? "prod" : "test";
}

/** La clé d'administration vient d'une variable d'environnement définie dans l'interface de Netlify. */
function adminKey(): string | null {
  const g = globalThis as { Netlify?: { env?: { get?: (name: string) => string | undefined } } };
  const fromNetlify = g.Netlify?.env?.get?.("ADMIN_KEY");
  if (fromNetlify) return fromNetlify;
  return typeof process !== "undefined" ? process.env?.ADMIN_KEY ?? null : null;
}

export async function route(req: Request, context: Context): Promise<Response> {
  const ctx = contextName(context);
  let storage = storages.get(ctx);
  if (!storage) {
    storage = new BlobsStorage(ctx);
    storages.set(ctx, storage);
  }
  return handle(req, {
    storage,
    context: ctx,
    adminKey: adminKey(),
    now: Date.now,
    random32: cryptoRandom32,
    defer: typeof context?.waitUntil === "function" ? (task) => context.waitUntil(task) : undefined,
  });
}
