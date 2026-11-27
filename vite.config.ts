import { fileURLToPath } from "node:url";
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

// La fabrique JSX du projet : celle de React, plus la typographie française
// (espaces insécables) posée sur tous les textes affichés. Voir src/jsx/.
const JSX = "@grattouille/jsx";

export default defineConfig({
  plugins: [react({ jsxImportSource: JSX }), devApi(), contentSecurityPolicy()],
  resolve: {
    alias: { [JSX]: fileURLToPath(new URL("./src/jsx", import.meta.url)) },
  },
  build: {
    target: "es2022",
    cssMinify: true,
    assetsInlineLimit: 0,
    // Le budget du brief porte sur le poids compressé du premier chargement : 300 Ko de
    // JavaScript au plus (section 8.7). On en est à 289 Ko : le fichier d'entrée et les
    // morceaux qu'il importe d'emblée. Les écrans chargés à la demande (poker, agence,
    // souvenirs, trophées, musique…) n'y comptent pas.
    chunkSizeWarningLimit: 900,
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
