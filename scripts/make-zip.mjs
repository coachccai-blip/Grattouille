// Fabrique livraison/grattouille-netlify.zip : le projet entier, sans node_modules ni
// dist, prêt à déposer sur Netlify (BRIEF.md, section 16.4).
//
//   npm run zip
//
// Les fichiers sont à la racine de l'archive : netlify.toml et package.json y sont
// visibles tout de suite, que l'on dépose le zip lui-même ou le dossier décompressé.
// Aucune dépendance : le format ZIP est écrit ici, avec zlib.

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUT_DIR = join(ROOT, "livraison");
const OUT = join(OUT_DIR, "grattouille-netlify.zip");

/** Ce qui ne part pas : dépendances, sorties de construction, données locales. */
const EXCLUDED = new Set(["node_modules", "dist", ".git", ".netlify", "livraison", ".DS_Store", "Thumbs.db"]);

function listFiles(dir, prefix = "") {
  const files = [];
  for (const name of readdirSync(dir).sort()) {
    if (EXCLUDED.has(name) || name.endsWith(".log")) continue;
    const path = join(dir, name);
    const inZip = prefix ? `${prefix}/${name}` : name;
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...listFiles(path, inZip));
    else if (stat.isFile()) files.push({ path, name: inZip });
  }
  return files;
}

/** Date et heure au format MS-DOS, celui des en-têtes ZIP. */
function dosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

const files = listFiles(ROOT);
const { time, day } = dosDateTime(new Date());
const UTF8 = 0x0800; // noms de fichiers en UTF-8
const DEFLATE = 8;
const parts = [];
const directory = [];
let offset = 0;

for (const file of files) {
  const data = readFileSync(file.path);
  const packed = deflateRawSync(data, { level: 9 });
  const name = Buffer.from(file.name, "utf8");
  const sum = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(UTF8, 6);
  local.writeUInt16LE(DEFLATE, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(day, 12);
  local.writeUInt32LE(sum, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  parts.push(local, name, packed);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(0x031e, 4); // créé sous Unix : les droits ci-dessous sont lus
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(UTF8, 8);
  central.writeUInt16LE(DEFLATE, 10);
  central.writeUInt16LE(time, 12);
  central.writeUInt16LE(day, 14);
  central.writeUInt32LE(sum, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // fichier ordinaire, rw-r--r--
  central.writeUInt32LE(offset, 42);
  directory.push(central, name);

  offset += local.length + name.length + packed.length;
}

const directorySize = directory.reduce((n, b) => n + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directorySize, 12);
end.writeUInt32LE(offset, 16);

mkdirSync(OUT_DIR, { recursive: true });
const zip = Buffer.concat([...parts, ...directory, end]);
writeFileSync(OUT, zip);

for (const needed of ["netlify.toml", "package.json", "package-lock.json", "index.html", "netlify/functions/api.mts"]) {
  if (!files.some((f) => f.name === needed)) {
    console.error(`Il manque ${needed} dans l'archive.`);
    process.exit(1);
  }
}
console.log(`${OUT}\n${files.length} fichiers, ${(zip.length / 1024).toFixed(0)} Ko`);
