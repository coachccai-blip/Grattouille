// Fabrique les icônes d'installation à partir d'un dessin vectoriel :
// une pièce mimosa frappée d'un « G », sur fond nuit.
//
//   node scripts/make-icons.mjs
//
// Les PNG produits sont rangés dans public/ et versionnés : cet outil ne sert qu'à
// les refaire. Il a besoin de Playwright et de son Chromium, qui ne sont pas des
// dépendances du projet (le jeu, lui, ne contient aucune image bitmap : ces icônes
// sont la seule exception, exigée par les écrans d'accueil des téléphones).

import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const font = readFileSync(join(root, "node_modules/@fontsource/abril-fatface/files/abril-fatface-latin-400-normal.woff2")).toString("base64");

/** `coin` : diamètre de la pièce, en part du côté. Plus petit pour l'icône masquable (zone sûre). */
function page(coin) {
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face { font-family: "Abril"; src: url(data:font/woff2;base64,${font}) format("woff2"); }
    html, body { margin: 0; width: 100vw; height: 100vw; background: #0E2F3A; overflow: hidden; }
    .fond { position: absolute; inset: 0; background: #0E2F3A; }
    /* Des rayons très discrets, comme derrière un gros gain. */
    .rayons { position: absolute; inset: -20%; background: repeating-conic-gradient(from 8deg, #17505C 0deg 12deg, transparent 12deg 24deg); opacity: .55; }
    .tranche, .piece { position: absolute; left: 50%; top: 50%; width: ${coin * 100}vw; height: ${coin * 100}vw; border-radius: 50%; transform: translate(-50%, -50%); }
    .tranche { background: #B88A14; margin-top: 3.4vw; }
    .piece { background: #F7C948; display: flex; align-items: center; justify-content: center; }
    .piece::before { content: ""; position: absolute; inset: 5.5%; border-radius: 50%; border: 1.6vw solid #B88A14; opacity: .55; }
    .g { position: relative; font: 400 ${coin * 78}vw/1 "Abril", serif; color: #0E2F3A; transform: translateY(-2%); }
    .eclat { position: absolute; left: ${50 + coin * 22}vw; top: ${50 - coin * 46}vw; width: ${coin * 22}vw; height: ${coin * 22}vw; background: #D9457A;
      clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
  </style><div class="fond"></div><div class="rayons"></div><div class="tranche"></div><div class="piece"><span class="g">G</span></div><div class="eclat"></div>`;
}

const targets = [
  { file: "icone-192.png", size: 192, coin: 0.74 },
  { file: "icone-512.png", size: 512, coin: 0.74 },
  { file: "icone-maskable-512.png", size: 512, coin: 0.56 },
  { file: "apple-touch-icon.png", size: 180, coin: 0.72 },
];

mkdirSync(join(root, "public"), { recursive: true });
const browser = await chromium.launch();
for (const t of targets) {
  const p = await browser.newPage({ viewport: { width: t.size, height: t.size }, deviceScaleFactor: 1 });
  await p.setContent(page(t.coin));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(root, "public", t.file) });
  await p.close();
  console.log(t.file);
}
await browser.close();
