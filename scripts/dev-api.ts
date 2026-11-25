// API de développement : `npm run dev` sert /api/* avec le vrai code de server/,
// branché sur le stockage en mémoire. Aucune installation de la CLI Netlify n'est
// nécessaire pour travailler sur le jeu. `netlify dev` reste la voie pour essayer
// la fonction avec un vrai store Blobs local (BRIEF.md, section 16.5).
//
// Les données vivent dans le processus : elles disparaissent à l'arrêt du serveur.

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";

type Handle = (req: Request, deps: Record<string, unknown>) => Promise<Response>;

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(", "));
  }
  const method = (req.method ?? "GET").toUpperCase();
  const url = `http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`;
  const hasBody = method !== "GET" && method !== "HEAD" && chunks.length > 0;
  return new Request(url, { method, headers, body: hasBody ? Buffer.concat(chunks) : undefined });
}

async function send(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

export function devApi(): Plugin {
  return {
    name: "grattouille-dev-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      let deps: Record<string, unknown> | null = null;
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) return next();
        try {
          // Chargé par Vite : le code serveur se recharge à chaud comme le reste.
          const app = (await server.ssrLoadModule("/server/app.ts")) as { handle: Handle };
          if (!deps) {
            const storage = (await server.ssrLoadModule("/server/storage.ts")) as { MemoryStorage: new () => unknown };
            const auth = (await server.ssrLoadModule("/server/auth.ts")) as { cryptoRandom32: () => number };
            deps = {
              storage: new storage.MemoryStorage(),
              context: "test",
              adminKey: process.env.ADMIN_KEY ?? null,
              now: Date.now,
              random32: auth.cryptoRandom32,
            };
          }
          await send(res, await app.handle(await toRequest(req), deps));
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          console.error(error);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: { code: "SERVER_ERROR", message: "Le kiosque ne répond pas. Réessaie dans un instant." } }));
        }
      });
    },
  };
}
