// Sert la version construite (dist/) avec l'API de server/ branchée sur le stockage
// en mémoire : pour essayer le jeu tel qu'il sera publié, sans Netlify.
//
//   npm run build && npm run serve        http://localhost:4173
//
// Les en-têtes reprennent ceux de netlify.toml. Les données vivent dans le
// processus : elles disparaissent à l'arrêt.

import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handle, type Deps } from "../server/app";
import { cryptoRandom32 } from "../server/auth";
import { MemoryStorage } from "../server/storage";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "dist");
const PORT = Number(process.env.PORT ?? 4173);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const deps: Deps = {
  storage: new MemoryStorage(),
  context: "test",
  adminKey: process.env.ADMIN_KEY ?? null,
  now: Date.now,
  random32: cryptoRandom32,
};

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(", "));
  }
  const method = (req.method ?? "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD" && chunks.length > 0;
  return new Request(`http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`, {
    method, headers, body: hasBody ? Buffer.concat(chunks) : undefined,
  });
}

const server = createServer(async (req, res) => {
  try {
    const path = (req.url ?? "/").split("?")[0] ?? "/";
    if (path.startsWith("/api/") || path === "/api") {
      const response = await handle(await toRequest(req), deps);
      res.statusCode = response.status;
      response.headers.forEach((value, name) => res.setHeader(name, value));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const relative = normalize(decodeURIComponent(path === "/" ? "/index.html" : path));
    const file = join(ROOT, relative);
    if (!file.startsWith(ROOT + sep)) {
      res.statusCode = 403;
      res.end();
      return;
    }
    const body = await readFile(file);
    res.setHeader("content-type", TYPES[extname(file)] ?? "application/octet-stream");
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("referrer-policy", "no-referrer");
    res.setHeader("x-frame-options", "DENY");
    res.setHeader("cache-control", path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Introuvable");
  }
});

server.listen(PORT, () => {
  console.log(`Grattouille (version construite, API en mémoire) : http://localhost:${PORT}`);
});
