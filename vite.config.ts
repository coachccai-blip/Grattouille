import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { configDefaults } from "vitest/config";
import { devApi } from "./scripts/dev-api.ts";

// Politique de sécurité du contenu, injectée dans la page construite seulement :
// en développement, Vite a besoin de scripts en ligne pour le rechargement à chaud.
// Rien ne sort vers une autre origine : ni traceur, ni statistique tierce (BRIEF.md, section 3).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

function contentSecurityPolicy(): Plugin {
  return {
    name: "grattouille-csp",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "<!-- csp -->",
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi(), contentSecurityPolicy()],
  build: {
    target: "es2022",
    cssMinify: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [...configDefaults.exclude],
    environment: "node",
    testTimeout: 60_000,
  },
});
