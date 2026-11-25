// Aperçu des illustrations hors de l'application : rend des composants SVG dans une
// page statique et en prend une capture PNG avec le Chromium déjà installé.
//
//   npx tsx scripts/art-preview.tsx avatars <sortie.png>
//   npx tsx scripts/art-preview.tsx wardrobe <sortie.png> [espèce]
//   npx tsx scripts/art-preview.tsx map <module> <export> <sortie.png> [largeur] [fond] [préfixe]
//
// Exemple : npx tsx scripts/art-preview.tsx map src/art/vehicles.tsx VEHICLES /tmp/v.png 240 "#BEE7F5"
// Le mode `map` attend un export de type Record<string, Art>. Le préfixe ne garde
// que les clés qui commencent par lui (« bandit: » par exemple).

import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CATALOG } from "../shared/catalog";
import { SPECIES } from "../shared/rules";
import { ArtDefs, type Art } from "../src/art/kit";

interface Tile {
  label: string;
  node: ReactNode;
}

async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  let tiles: Tile[] = [];
  let out = "";
  let width = 200;
  let bg = "#17505C";

  if (mode === "avatars") {
    out = rest[0] ?? "";
    const { Avatar } = await import("../src/art/Avatar");
    const dressed = { chapeau: "beret", lunettes: "lunettes-rondes", tenue: "mariniere", accessoire: "noeud-pap" };
    for (const s of SPECIES) tiles.push({ label: s, node: <Avatar species={s} /> });
    for (const s of SPECIES) tiles.push({ label: `${s} habillé`, node: <Avatar species={s} look={dressed} /> });
    for (const s of SPECIES) tiles.push({ label: `${s} tête`, node: <Avatar species={s} look={dressed} crop="tete" /> });
    width = 190;
  } else if (mode === "wardrobe") {
    out = rest[0] ?? "";
    const species = rest[1] ?? "renard";
    const { Avatar, WardrobeThumb } = await import("../src/art/Avatar");
    for (const item of CATALOG.filter((i) => i.shop === "sidonie")) {
      tiles.push({ label: `${item.id} (${item.slot})`, node: <Avatar species={species} look={{ [item.slot]: item.id }} /> });
      tiles.push({ label: `${item.id} vignette`, node: <div style={{ background: "#FFF7E6" }}><WardrobeThumb id={item.id} /></div> });
    }
    width = 170;
  } else if (mode === "map") {
    const [modulePath, exportName] = rest;
    out = rest[2] ?? "";
    if (rest[3]) width = Number(rest[3]);
    if (rest[4]) bg = rest[4];
    const mod = (await import(pathToFileURL(resolve(modulePath ?? "")).href)) as Record<string, unknown>;
    const map = mod[exportName ?? ""] as Record<string, Art> | undefined;
    if (!map) throw new Error(`export introuvable : ${exportName}`);
    const prefix = rest[5] ?? "";
    tiles = Object.entries(map)
      .filter(([label]) => label.startsWith(prefix))
      .map(([label, Comp]) => ({ label, node: <Comp /> }));
  } else {
    console.error("modes : avatars, wardrobe, map (voir l'en-tête du fichier)");
    process.exit(2);
  }
  if (!out) throw new Error("chemin de sortie manquant");

  const html = `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; padding: 16px; background: ${bg}; font: 12px/1.3 system-ui, sans-serif; color: #fff; }
    .grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .tile { width: ${width}px; }
    .tile svg { display: block; width: 100%; height: auto; }
    .label { padding: 4px 0 0; text-shadow: 0 1px 2px rgba(0,0,0,.6); }
  </style>${renderToStaticMarkup(
    <>
      <ArtDefs />
      <div className="grid">
        {tiles.map((t) => (
          <div className="tile" key={t.label}>
            {t.node}
            <div className="label">{t.label}</div>
          </div>
        ))}
      </div>
    </>,
  )}`;
  const htmlPath = join(dirname(resolve(out)), `${Date.now()}-apercu.html`);
  writeFileSync(htmlPath, html);

  // Playwright est installé globalement : on le charge par require, qui suit NODE_PATH.
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { chromium } = require("playwright") as { chromium: { launch: () => Promise<any> } };
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.screenshot({ path: resolve(out), fullPage: true });
  await browser.close();
  console.log(`${tiles.length} illustrations → ${resolve(out)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
