// L'Agence Carpe Diem côté écrans (LOT4.md, section 13) : chacune des trente expériences a
// son timbre, sa scène, son boniment et sa légende dans les deux langues ; aucune phrase
// d'interface sans traduction ; des longueurs bornées ; et ce qui reste chargé au démarrage.
// (Les trente expériences elles-mêmes, leurs prix et la route d'achat sont éprouvés dans
// tests/suite.test.ts.)

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { EXPERIENCES, EXPERIENCE_COUNT } from "../shared/experiences";
import { SPECIES } from "../shared/rules";
import { SCENES } from "../src/art/agence/scenes";
import { TIMBRES, Timbre } from "../src/art/agence/timbres";
import { i18nMisses, setLang, t, type Lang } from "../src/i18n";
import { EN_BOUTIQUES } from "../src/i18n/en/boutiques";
import { EN_EXPERIENCES } from "../src/i18n/en/experiences";
import { EN_JEU } from "../src/i18n/en/jeu";
import { EN_POKER } from "../src/i18n/en/poker";
import { EN_RECIT } from "../src/i18n/en/recit";
import { EN_SUITE } from "../src/i18n/en/suite";
import { EN_TICKETS } from "../src/i18n/en/tickets";
import { EN_TROPHEES } from "../src/i18n/en/trophees";
// Le `t()` de l'agence : c'est lui qui apporte le dictionnaire anglais de ses écrans.
import "../src/screens/agence/mots";
import {
  CHAPITRES, DIEM, MADAME_DIEM, TEXTES, bonimentDe, catalogue, chapitreDe, legendeDe, motDeDiem, nomExperience, type Paire,
} from "../src/screens/agence/textes";

// Chaque test repart du français, quoi qu'il arrive dans le précédent.
afterEach(() => setLang("fr"));

const LANGUES: readonly Lang[] = ["fr", "en"];
const IDS = EXPERIENCES.map((x) => x.id);
const root = fileURLToPath(new URL("../", import.meta.url));
const lire = (file: string) => readFileSync(`${root}${file}`, "utf8");
/** Longueur en caractères, pas en unités UTF-16. */
const len = (s: string) => [...s].length;
const doublons = (liste: readonly string[]) => liste.filter((x, i) => liste.indexOf(x) !== i);
const variables = (s: string) => [...new Set(s.match(/\{\w+\}/g) ?? [])].sort();

/** Toutes les paires de textes de l'agence : ce que c'est, et ses deux versions. */
function paires(): { quoi: string; paire: Paire }[] {
  return [
    ...CHAPITRES.map((c) => ({ quoi: `chapitre:${c.id}`, paire: c.titre })),
    ...IDS.flatMap((id) => [
      { quoi: `nom:${id}`, paire: { fr: EXPERIENCES.find((x) => x.id === id)!.name, en: TEXTES[id]?.nom ?? "" } },
      { quoi: `boniment:${id}`, paire: TEXTES[id]?.boniment ?? { fr: "", en: "" } },
      { quoi: `legende:${id}`, paire: TEXTES[id]?.legende ?? { fr: "", en: "" } },
    ]),
    ...Object.entries(DIEM).map(([cle, paire]) => ({ quoi: `diem:${cle}`, paire })),
  ];
}

// ---------------------------------------------------------------------------

describe("le catalogue : trente expériences, cinq chapitres", () => {
  it("chaque expérience est dans un chapitre, une fois, par prix croissant", () => {
    const rayons = catalogue();
    expect(rayons.map((r) => r.chapitre.id)).toEqual(["port", "voyages", "folies", "ciel", "derniere"]);
    expect(rayons.flatMap((r) => r.experiences.map((x) => x.id))).toEqual(IDS);
    expect(rayons.map((r) => r.experiences.length)).toEqual([7, 7, 6, 9, 1]);
    // Un chapitre commence par l'expérience qu'il annonce, et aucun n'est vide.
    for (const r of rayons) expect([r.chapitre.id, r.experiences[0]?.id]).toEqual([r.chapitre.id, r.chapitre.de]);
    expect(chapitreDe("glace").id).toBe("port");
    expect(chapitreDe("australie").id).toBe("voyages");
    expect(chapitreDe("soiree-lune").id).toBe("ciel");
    expect(chapitreDe("toute-la-ville").id).toBe("derniere");
    // Un identifiant inconnu ne casse rien.
    expect(chapitreDe("inconnue").id).toBe("port");
  });

  it("un texte par expérience, et pas un de plus", () => {
    expect(EXPERIENCE_COUNT).toBe(30);
    expect(Object.keys(TEXTES).sort()).toEqual([...IDS].sort());
    // Celles que le propriétaire du jeu a nommées.
    for (const id of ["australie", "japon-coree", "tour-du-monde", "soiree-lune"]) expect(TEXTES[id]).toBeDefined();
  });

  for (const langue of LANGUES) {
    it(`${langue} : chaque expérience a son nom, son boniment et sa légende ; chaque chapitre a son titre`, () => {
      setLang(langue);
      for (const id of IDS) {
        const nom = nomExperience(id);
        const boniment = bonimentDe(id);
        const legende = legendeDe(id);
        expect([id, nom.trim() !== "", boniment.trim() !== "", legende.trim() !== ""]).toEqual([id, true, true, true]);
        // Un nom commence par une capitale et ne finit pas par un point ; un boniment et une légende sont des phrases.
        expect([id, /^\p{Lu}/u.test(nom), /[.!?]$/.test(nom)]).toEqual([id, true, false]);
        expect([id, /^\p{Lu}.*[.!?]$/u.test(boniment)]).toEqual([id, true]);
        expect([id, /^[\p{Lu}\d].*[.!?»”]$/u.test(legende)]).toEqual([id, true]);
      }
      expect(doublons(IDS.map((id) => nomExperience(id).toLowerCase()))).toEqual([]);
      expect(doublons(IDS.map(bonimentDe))).toEqual([]);
      expect(doublons(IDS.map(legendeDe))).toEqual([]);
      expect(doublons(catalogue().map((r) => r.chapitre.titre[langue]))).toEqual([]);
    });
  }

  it("le nom français est celui du socle, le nom anglais celui de l'agence", () => {
    expect(nomExperience("australie")).toBe("Un roadtrip en Australie");
    expect(legendeDe("australie")).toBe("Bons baisers d'Australie !");
    setLang("en");
    expect(nomExperience("australie")).toBe("A road trip across Australia");
    expect(nomExperience("soiree-lune")).toBe("A party on the Moon");
    expect(legendeDe("australie")).toBe("Love from Australia!");
    // Une expérience que ce jeu ne connaît pas : son identifiant, et rien à lire.
    expect([nomExperience("inconnue"), bonimentDe("inconnue"), legendeDe("inconnue")]).toEqual(["inconnue", "", ""]);
  });

  it("les deux langues ont la même forme, et aucune ne recopie l'autre", () => {
    for (const { quoi, paire } of paires()) {
      expect([quoi, Object.keys(paire).sort()]).toEqual([quoi, ["en", "fr"]]);
      expect([quoi, paire.fr.trim() !== "", paire.en.trim() !== ""]).toEqual([quoi, true, true]);
      expect([quoi, paire.en !== paire.fr]).toEqual([quoi, true]);
      expect([quoi, variables(paire.en)]).toEqual([quoi, variables(paire.fr)]);
    }
    // Trente noms, trente boniments, trente légendes, cinq chapitres, et ce que dit Madame Diem.
    expect(paires()).toHaveLength(5 + 90 + Object.keys(DIEM).length);
  });

  it("écriture : guillemets et espaces de chaque langue", () => {
    const tout = paires();
    // L'anglais s'affiche tel quel : ni guillemet français ni droit, ni espace insécable, ni espace avant la ponctuation.
    expect(tout.filter(({ paire }) => /[«»  "]| [!?;:]/.test(paire.en)).map((p) => p.quoi)).toEqual([]);
    expect(tout.filter(({ paire }) => (paire.en.match(/“/g) ?? []).length !== (paire.en.match(/”/g) ?? []).length).map((p) => p.quoi)).toEqual([]);
    // Le français s'écrit avec des espaces ordinaires (les insécables sont posées à l'affichage) ; seule exception,
    // l'espace fine qui sépare les milliers d'un nombre, pour qu'il ne se coupe jamais en deux.
    expect(tout.filter(({ paire }) => /[ "]/.test(paire.fr)).map((p) => p.quoi)).toEqual([]);
    expect(tout.filter(({ paire }) => / /.test(paire.fr.replace(/\d \d{3}/g, ""))).map((p) => p.quoi)).toEqual([]);
    expect(tout.filter(({ paire }) => /\d \d{3}\b/.test(paire.fr)).map((p) => p.quoi)).toEqual([]);
    expect(tout.filter(({ paire }) => (paire.fr.match(/«/g) ?? []).length !== (paire.fr.match(/»/g) ?? []).length).map((p) => p.quoi)).toEqual([]);
    for (const { quoi, paire } of tout) {
      expect([quoi, paire.fr === paire.fr.trim(), paire.en === paire.en.trim(), /\s{2}/.test(paire.fr + paire.en)]).toEqual([quoi, true, true, false]);
    }
  });

  it("les nombres se disent pareil dans les deux langues", () => {
    const chiffres = (s: string) => (s.match(/\d[\d ,]*/g) ?? []).map((n) => n.replace(/\D/g, "")).sort();
    for (const { quoi, paire } of paires()) expect([quoi, chiffres(paire.en)]).toEqual([quoi, chiffres(paire.fr)]);
  });
});

// ---------------------------------------------------------------------------

describe("longueurs : tout tient dans sa place", () => {
  /**
   * La largeur de chaque caractère en Jost gras de 16 px, mesurée dans le navigateur : c'est
   * la police des noms dans le catalogue. Un caractère inconnu compte large.
   */
  const LARGEURS: Record<string, number> = {
    " ": 4.8, "'": 4.78, "(": 5.46, ")": 5.46, ",": 5.18, "-": 3.55, A: 12.19, C: 11.22, D: 11.73, E: 9.65, F: 8.82, J: 6.14,
    K: 11.18, L: 8.45, M: 14.26, O: 13.14, R: 10.35, S: 10, T: 9.12, U: 11.22, a: 8.62, b: 9.87, c: 7.9, d: 9.87, e: 9.17, f: 5.5, g: 9.76,
    h: 9.1, i: 4.42, j: 5.22, k: 9.23, l: 4.32, m: 13.12, n: 9.2, o: 9.44, p: 9.87, q: 9.87, r: 6.58, s: 7.3, t: 5.09, u: 9.2,
    v: 8.86, w: 12.6, x: 8.94, y: 8.76, z: 8.78, à: 8.7, è: 9.17, é: 9.17, î: 4.42,
  };
  const largeur = (texte: string) => [...texte].reduce((somme, ch) => somme + (LARGEURS[ch] ?? 13), 0);
  /** La place d'un nom sur une ligne du catalogue, à 320 px de large (mesurée : 170 px), moins une marge de sûreté. */
  const PLACE = 166;

  /** Le nombre de lignes qu'un nom occupe : il ne se coupe qu'aux espaces et après un trait d'union. */
  function lignes(nom: string): number {
    const mots = nom.split(/(?<=-)| /).map((mot, i, tous) => ({ mot, colle: i > 0 && tous[i - 1]!.endsWith("-") }));
    let n = 1;
    let courante = 0;
    for (const { mot, colle } of mots) {
      const avec = courante === 0 ? largeur(mot) : courante + (colle ? 0 : LARGEURS[" "]!) + largeur(mot);
      if (avec <= PLACE) courante = avec;
      else {
        n += 1;
        courante = largeur(mot);
      }
    }
    return n;
  }

  it("le modèle de largeur colle à ce que le navigateur a mesuré", () => {
    // Largeurs d'une seule ligne relevées à l'écran : le modèle les retrouve à trois pixels près (il ignore le crénage).
    const RELEVES: [string, number][] = [
      ["Un saut en parachute (parachute compris)", 311], ["Le tour du monde", 132], ["A dive to the bottom of the Mariana Trench", 320],
      ["Une descente dans la fosse des Mariannes", 316], ["A parachute jump (parachute included)", 291],
    ];
    for (const [nom, px] of RELEVES) expect([nom, Math.abs(largeur(nom) - px) <= 3]).toEqual([nom, true]);
    expect([lignes("Le tour du monde"), lignes("Un roadtrip en Australie"), lignes("Un vol en montgolfière au petit matin")]).toEqual([1, 2, 3]);
  });

  for (const langue of LANGUES) {
    it(`${langue} : un nom tient sur deux lignes à 320 px de large`, () => {
      setLang(langue);
      const trop = IDS.map((id) => nomExperience(id)).filter((nom) => lignes(nom) > 2);
      expect(trop).toEqual([]);
      // Et aucun mot ne dépasse à lui seul la ligne.
      const mots = IDS.flatMap((id) => nomExperience(id).split(" ")).filter((mot) => largeur(mot) > PLACE);
      expect(mots).toEqual([]);
      // Aucun caractère que le modèle ne connaît pas.
      expect([...new Set(IDS.flatMap((id) => [...nomExperience(id)]))].filter((ch) => !(ch in LARGEURS))).toEqual([]);
    });

    it(`${langue} : un boniment tient en deux phrases, une légende en deux lignes de carte postale`, () => {
      setLang(langue);
      expect(IDS.filter((id) => len(bonimentDe(id)) > 125)).toEqual([]);
      expect(IDS.filter((id) => len(bonimentDe(id)) < 50)).toEqual([]);
      expect(IDS.filter((id) => (bonimentDe(id).match(/[.!?](?= |$)/g) ?? []).length > 3)).toEqual([]);
      expect(IDS.filter((id) => len(legendeDe(id)) > 52)).toEqual([]);
      // Ce que dit Madame Diem tient dans sa bulle.
      expect(Object.values(DIEM).filter((paire) => len(paire[langue]) > 120)).toEqual([]);
    });
  }

  it("un nom anglais ne dépasse pas son original de plus de 6 caractères", () => {
    const trop = IDS.filter((id) => len(TEXTES[id]!.nom) > len(EXPERIENCES.find((x) => x.id === id)!.name) + 6);
    expect(trop).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("ce que dit Madame Diem", () => {
  for (const langue of LANGUES) {
    it(`${langue} : un mot pour chaque moment, des trente à vivre aux trente vécues`, () => {
      setLang(langue);
      expect(motDeDiem(0, true)).toBe(DIEM.bienvenue[langue]);
      expect(motDeDiem(0, false)).toBe(DIEM.bienvenue[langue]);
      expect(motDeDiem(1, true)).toBe(DIEM.debut[langue]);
      expect(motDeDiem(9, true)).toBe(DIEM.debut[langue]);
      expect(motDeDiem(10, true)).toBe(DIEM.milieu[langue]);
      expect(motDeDiem(19, true)).toBe(DIEM.milieu[langue]);
      expect(motDeDiem(20, true)).toBe(DIEM.bientot[langue].replace("{n}", "10"));
      expect(motDeDiem(28, true)).toBe(DIEM.bientot[langue].replace("{n}", "2"));
      expect(motDeDiem(29, true)).toBe(DIEM.presque[langue]);
      expect(motDeDiem(30, true)).toBe(DIEM.tout[langue]);
      // Plus rien à portée de bourse : elle renvoie aux tickets. Sauf si tout est vécu.
      expect(motDeDiem(4, false)).toBe(DIEM.fauche[langue]);
      expect(motDeDiem(29, false)).toBe(DIEM.fauche[langue]);
      expect(motDeDiem(30, false)).toBe(DIEM.tout[langue]);
      // Aucune accolade ne reste, quel que soit le compte.
      for (let n = 0; n <= 30; n++) expect(motDeDiem(n, true) + motDeDiem(n, false)).not.toMatch(/[{}]/);
    });
  }

  it("elle a un mot pour les trente vécues, et son nom ne se traduit pas", () => {
    expect(DIEM.tout.fr).toMatch(/Trente sur trente/);
    expect(DIEM.tout.en).toMatch(/Thirty out of thirty/);
    expect(MADAME_DIEM).toBe("Madame Diem");
    // « Plus que {n} » : la seule de ses phrases qui compte.
    expect(Object.values(DIEM).filter((paire) => paire.fr.includes("{n}"))).toEqual([DIEM.bientot]);
  });
});

// ---------------------------------------------------------------------------

describe("les timbres et les films : un par expérience", () => {
  const GESTES = [
    "va", "sort", "passe", "apparait", "disparait", "pop", "chute", "eclat", "etire", "flotte", "tourne", "defile", "pulse",
    "clignote", "saut", "bat", "secoue",
  ];
  /** Une tenue complète, pour voir chaque scène habillée. */
  const TENUE = { chapeau: "chapeau-journal", lunettes: null, tenue: null, accessoire: null };
  const dessin = (id: string, espece: string) =>
    renderToStaticMarkup(createElement("svg", null, createElement(SCENES[id]!.Art, { espece, look: TENUE })));

  it("trente timbres, trente scènes, et pas un de plus", () => {
    expect([...TIMBRES].sort()).toEqual([...IDS].sort());
    expect(Object.keys(SCENES).sort()).toEqual([...IDS].sort());
    // Trente dessins différents : pas deux expériences pour la même scène.
    expect(new Set(IDS.map((id) => SCENES[id]!.Art)).size).toBe(30);
  });

  it("un timbre se dessine, vécu ou non, sans aucun texte", () => {
    for (const id of IDS) {
      const neuf = renderToStaticMarkup(createElement(Timbre, { id }));
      const oblitere = renderToStaticMarkup(createElement(Timbre, { id, vecue: true }));
      expect([id, neuf.length > 400, oblitere.length > neuf.length]).toEqual([id, true, true]);
      expect([id, /<text|NaN|undefined/.test(oblitere)]).toEqual([id, false]);
      expect([id, neuf.includes("timbre__cachet"), oblitere.includes("timbre__cachet")]).toEqual([id, false, true]);
    }
    // Trente images différentes.
    expect(new Set(IDS.map((id) => renderToStaticMarkup(createElement(Timbre, { id })).replace(/timbre-\w+/g, ""))).size).toBe(30);
    // Un identifiant inconnu : un timbre vide, pas une erreur.
    expect(renderToStaticMarkup(createElement(Timbre, { id: "inconnue" }))).toContain("<svg");
  });

  it("un film dure de six à dix secondes, sur un ciel à lui, et ses bruits sont à l'heure", () => {
    for (const id of IDS) {
      const scene = SCENES[id]!;
      expect([id, scene.duree >= 6000 && scene.duree <= 10000]).toEqual([id, true]);
      expect([id, scene.fond.every((couleur) => /^#[0-9A-F]{6}$/i.test(couleur))]).toEqual([id, true]);
      // Le cadre de la carte postale (360 × 450) reste dans le dessin (360 × 800), et dans ce que tout écran montre.
      const cadre = scene.cadre ?? 175;
      expect([id, cadre >= 110 && cadre + 450 <= 740]).toEqual([id, true]);
      const sons = scene.sons ?? [];
      expect([id, sons.length >= 3 && sons.length <= 20]).toEqual([id, true]);
      const instants = sons.map(([ms]) => ms);
      expect([id, instants]).toEqual([id, [...instants].sort((a, b) => a - b)]);
      expect([id, instants.every((ms) => ms >= 100 && ms < scene.duree - 300)]).toEqual([id, true]);
    }
  });

  it("une scène se dessine pour chaque espèce : rien que des formes, aucun texte, et elle bouge", () => {
    for (const id of IDS) {
      const svg = dessin(id, "renard");
      expect([id, svg.length > 3000]).toEqual([id, true]);
      expect([id, /<text|<image|<filter|NaN|undefined/.test(svg)]).toEqual([id, false]);
      // Elle bouge pour de bon : au moins huit éléments animés, par des gestes connus.
      const gestes = [...svg.matchAll(/class="xp-a xp-([a-z]+)/g)].map((m) => m[1]!);
      expect([id, gestes.length >= 8]).toEqual([id, true]);
      expect([id, [...new Set(gestes)].filter((geste) => !GESTES.includes(geste))]).toEqual([id, []]);
      // Elle reste légère : pas plus de mille formes.
      expect([id, (svg.match(/<(path|circle|rect|ellipse)\b/g) ?? []).length < 1000]).toEqual([id, true]);
      // Le voyageur y tient son rôle : son buste, ou sa tête à une fenêtre.
      expect([id, svg.includes("av-tete")]).toEqual([id, true]);
    }
    // Chaque espèce se dessine dans chaque scène, et n'y fait pas la même tête.
    for (const id of ["glace", "parachute", "soiree-lune", "toute-la-ville"]) {
      const vues = SPECIES.map((espece) => dessin(id, espece));
      expect([id, new Set(vues).size]).toEqual([id, SPECIES.length]);
    }
  });

  it("le dernier film réunit toute la ville, Madame Diem comprise", () => {
    const svg = dessin("toute-la-ville", "renard");
    // Treize habitants au registre des portraits, et Madame Diem : quatorze médaillons.
    expect((svg.match(/clip-path="url\(#xp-rond\)"/g) ?? []).length).toBe(14);
  });
});

// ---------------------------------------------------------------------------

describe("le mouvement : transformations et opacité seulement", () => {
  const FEUILLES = ["src/screens/agence/film.css", "src/screens/agence/agence.css", "src/screens/agence/enseigne.css"];
  /** Les blocs @keyframes d'une feuille : leur nom, et ce qu'ils animent. */
  function images(css: string): { nom: string; proprietes: string[] }[] {
    const out: { nom: string; proprietes: string[] }[] = [];
    for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/g)) {
      const proprietes = [...m[2]!.matchAll(/\{([^{}]*)\}/g)].flatMap((bloc) =>
        bloc[1]!.split(";").map((decl) => decl.split(":")[0]!.trim()).filter(Boolean));
      out.push({ nom: m[1]!, proprietes: [...new Set(proprietes)] });
    }
    return out;
  }

  it("aucune animation de l'agence ne touche à autre chose", () => {
    let vues = 0;
    for (const feuille of FEUILLES) {
      for (const { nom, proprietes } of images(lire(feuille))) {
        vues += 1;
        expect([nom, proprietes.filter((p) => !["transform", "opacity", "animation-timing-function"].includes(p))]).toEqual([nom, []]);
      }
    }
    // Le relevé a bien trouvé les animations des scènes.
    expect(vues).toBeGreaterThan(18);
  });

  it("chaque geste des scènes a son animation, et la carte postale les fige tous", () => {
    const css = lire("src/screens/agence/film.css");
    const kit = lire("src/art/agence/kit.tsx");
    const gestes = [...kit.slice(kit.indexOf("export type Geste"), kit.indexOf("const BOUCLES")).matchAll(/"([a-z]+)"/g)].map((m) => m[1]!);
    expect(gestes.length).toBeGreaterThan(12);
    for (const geste of gestes) {
      expect([geste, css.includes(`.xp-${geste} { animation-name: xp-${geste}; }`), css.includes(`@keyframes xp-${geste} {`)]).toEqual([geste, true, true]);
    }
    // Image fixe : sur la carte postale et en animations réduites, plus rien ne bouge.
    expect(css).toMatch(/\.xp--carte \.xp__image \*,\s*\.calme \.xp__image \* \{ animation: none !important; \}/);
  });

  it("rien sous 12 px dans les feuilles de style de l'agence", () => {
    for (const feuille of FEUILLES) {
      const tailles = [...lire(feuille).matchAll(/font(?:-size)?:[^;]*?(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
      expect([feuille, tailles.filter((px) => px < 12)]).toEqual([feuille, []]);
    }
  });
});

// ---------------------------------------------------------------------------

describe("le dictionnaire anglais de l'agence", () => {
  const dir = `${root}src/screens/agence/`;
  /** Les dictionnaires chargés au démarrage : une phrase de l'agence peut déjà y être. */
  const DEMARRAGE: Record<string, string> = {
    ...EN_RECIT, ...EN_JEU, ...EN_BOUTIQUES, ...EN_TICKETS, ...EN_POKER, ...EN_SUITE, ...EN_TROPHEES,
  };
  const entries = Object.entries(EN_EXPERIENCES).map(([fr, en]) => ({ fr, en }));

  /** Les phrases passées à t() dans un fichier source. */
  function keysOf(source: string): string[] {
    return [...source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`) as string);
  }

  const fichiers = () => readdirSync(dir).filter((f) => /\.tsx?$/.test(f));
  const used = (sauf: readonly string[] = []) =>
    [...new Set(fichiers().filter((f) => !sauf.includes(f)).flatMap((f) => keysOf(readFileSync(dir + f, "utf8"))))];

  it("chaque phrase des écrans de l'agence a sa traduction", () => {
    const keys = used();
    // Le relevé a bien trouvé les écrans.
    expect(keys.length).toBeGreaterThan(15);
    expect(keys).toContain("Vivre l'expérience");
    expect(keys.filter((key) => !(key in EN_EXPERIENCES) && !(key in DEMARRAGE))).toEqual([]);
  });

  it("l'enseigne de l'onglet Boutiques ne compte que sur les dictionnaires du démarrage", () => {
    const keys = keysOf(lire("src/screens/agence/Enseigne.tsx"));
    expect(keys.length).toBeGreaterThanOrEqual(4);
    expect(keys.filter((key) => !(key in DEMARRAGE))).toEqual([]);
    expect(EN_BOUTIQUES["Agence Carpe Diem"]).toBe("Carpe Diem Agency");
  });

  it("le dictionnaire ne garde aucune phrase que les écrans n'emploient plus, ni aucune que le démarrage a déjà", () => {
    const keys = new Set(used(["Enseigne.tsx"]));
    expect(Object.keys(EN_EXPERIENCES).filter((key) => !keys.has(key))).toEqual([]);
    expect(Object.keys(EN_EXPERIENCES).filter((key) => key in DEMARRAGE)).toEqual([]);
  });

  it("t() trouve chaque phrase une fois l'agence arrivée", () => {
    setLang("en");
    expect(entries.filter((e) => t(e.fr) !== e.en).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => i18nMisses().includes(e.fr)).map((e) => e.fr)).toEqual([]);
    expect(t("Vivre l'expérience")).toBe("Live the experience");
    expect(t("Souvenir {n} sur {total}", { n: 8, total: 30 })).toBe("Memory 8 of 30");
  });

  it("une traduction emploie les variables de sa phrase française, toutes, et elles seules", () => {
    expect(entries.filter((e) => variables(e.en).join() !== variables(e.fr).join()).map((e) => `${e.fr} → ${e.en}`)).toEqual([]);
  });

  it("guillemets anglais, aucune traduction vide, pas d'espace à la française", () => {
    expect(entries.filter((e) => /[«»]/.test(e.en)).map((e) => e.en)).toEqual([]);
    expect(entries.filter((e) => e.en.trim() === "" || e.en !== e.en.trim()).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => /[  ]| [!?;:]/.test(e.en)).map((e) => e.en)).toEqual([]);
  });

  it("un bouton reste sur une ligne : « Vivre l'expérience », « Revivre », « Continuer »", () => {
    for (const fr of ["Vivre l'expérience", "Revivre"]) expect([fr, len(EN_EXPERIENCES[fr]!) <= 22]).toEqual([fr, true]);
    expect(len(EN_EXPERIENCES["Touche l'écran pour passer"]!)).toBeLessThanOrEqual(30);
  });

  it("aucun texte de l'agence n'est figé à l'import : tout suit la langue du moment", () => {
    const page = (langue: Lang) => {
      setLang(langue);
      return IDS.map((id) => [nomExperience(id), bonimentDe(id), legendeDe(id), chapitreDe(id).titre[langue]].join(" | "));
    };
    const fr = page("fr");
    const en = page("en");
    expect(en.filter((ligne, i) => ligne === fr[i])).toEqual([]);
    expect(page("fr")).toEqual(fr);
  });
});

// ---------------------------------------------------------------------------

describe("le poids : l'agence n'est chargée qu'à la demande", () => {
  /** Les modules qu'un fichier importe pour de bon (les `import type` ne pèsent rien). */
  const imports = (source: string) =>
    [...source.matchAll(/^import\s+(?!type\b)[^;]*?from\s+"([^"]+)";/gm)].map((m) => m[1]!);
  /** Ce qui n'arrive qu'avec l'agence ou avec ses films. */
  const LOURD = /art\/agence|agence\/(textes|mots|films|Film|Agence|FicheExperience|Experience|index)$|i18n\/en\/experiences/;

  it("l'onglet Boutiques ne monte que l'enseigne, et l'enseigne n'importe ni dessin ni texte", () => {
    const boutiques = lire("src/screens/boutiques/Boutiques.tsx");
    expect(imports(boutiques).filter((module) => module.includes("agence"))).toEqual(["../agence/Enseigne"]);
    const enseigne = lire("src/screens/agence/Enseigne.tsx");
    expect(imports(enseigne).filter((module) => LOURD.test(module))).toEqual([]);
    // Le portrait de Madame Diem arrive à part, et son absence ne casse rien.
    expect(enseigne).toMatch(/lazy<ComponentType>\(\(\) => import\("\.\.\/\.\.\/art\/agence\/diem"\)\.catch\(/);
    // Elle ne pèse presque rien : quelques lignes.
    expect(enseigne.replace(/^\s*\/\/.*$/gm, "").length).toBeLessThan(1900);
    expect(lire("src/screens/agence/enseigne.css").replace(/\/\*[\s\S]*?\*\//g, "").length).toBeLessThan(1800);
  });

  it("la coquille ne monte l'agence qu'à la demande", () => {
    const app = lire("src/App.tsx");
    expect(app).toMatch(/lazy\(\(\) => ouAbsent\(import\("\.\/screens\/agence"\)\)\)/);
    expect(imports(app).filter((module) => module.includes("agence"))).toEqual([]);
    // Ni le magasin d'état ni la navigation ne tirent l'agence derrière eux.
    for (const file of ["src/app/store.ts", "src/app/nav.ts", "src/i18n/index.ts"]) {
      expect([file, imports(lire(file)).filter((module) => LOURD.test(module))]).toEqual([file, []]);
    }
  });

  it("les trente films sont un morceau à part du catalogue", () => {
    for (const file of ["index.tsx", "Agence.tsx", "FicheExperience.tsx", "Experience.tsx", "textes.ts", "mots.ts"]) {
      const lourds = imports(lire(`src/screens/agence/${file}`)).filter((module) => /\/Film$|art\/agence\/(scenes|kit)/.test(module));
      expect([file, lourds]).toEqual([file, []]);
    }
    // Ils arrivent par films.ts, et par lui seul.
    expect(lire("src/screens/agence/films.ts")).toMatch(/import\("\.\/Film"\)/);
    expect(imports(lire("src/screens/agence/Film.tsx"))).toContain("../../art/agence/scenes");
  });

  it("le dictionnaire chargé au démarrage ne porte que les mots de l'enseigne", () => {
    const noms = IDS.map((id) => TEXTES[id]!.nom);
    expect(noms.filter((nom) => Object.values(EN_BOUTIQUES).includes(nom))).toEqual([]);
    const enseigne = ["Agence Carpe Diem", "Expériences de vie", "{n} vécue sur {total}", "{n} vécues sur {total}"];
    for (const cle of enseigne) expect([cle, typeof EN_BOUTIQUES[cle]]).toEqual([cle, "string"]);
    // Rien de l'agence dans le dictionnaire des boutiques, hors ces quatre phrases.
    expect(Object.keys(EN_BOUTIQUES).filter((cle) => /vécue|Diem|xpérience/.test(cle)).sort()).toEqual([...enseigne].sort());
  });

  it("rien de nouveau dans le stockage de l'appareil", () => {
    for (const file of readdirSync(`${root}src/screens/agence/`).filter((f) => /\.tsx?$/.test(f))) {
      expect([file, /localStorage|sessionStorage|indexedDB/.test(lire(`src/screens/agence/${file}`))]).toEqual([file, false]);
    }
  });
});

// ---------------------------------------------------------------------------

describe("l'agence dans la navigation", () => {
  it("trois écrans : le catalogue sous l'onglet Boutiques, la fiche et le film posés par-dessus", async () => {
    const { hasTabs, isSheet, resolveScreens, screenKey, tabOf } = await import("../src/app/nav");
    expect(tabOf({ name: "agence" })).toBe("boutiques");
    expect(hasTabs({ name: "agence" })).toBe(true);
    expect(isSheet({ name: "agence" })).toBe(false);
    expect(isSheet({ name: "fiche-experience", experience: "glace" })).toBe(true);
    expect(isSheet({ name: "experience", experience: "glace" })).toBe(true);
    // Le film ne remonte pas le catalogue : il reste dessous, là où on l'a laissé.
    const pile = [{ name: "domaine" }, { name: "boutiques" }, { name: "agence" }, { name: "experience", experience: "glace", premiere: true }] as const;
    const { base, sheets } = resolveScreens(pile, 3);
    expect([base.name, sheets.map((s) => s.name)]).toEqual(["agence", ["experience"]]);
    // Deux fiches, deux films : des clés différentes.
    expect(screenKey({ name: "fiche-experience", experience: "glace" }, 3)).not.toBe(screenKey({ name: "fiche-experience", experience: "mars" }, 3));
    expect(screenKey({ name: "experience", experience: "glace" }, 3)).not.toBe(screenKey({ name: "experience", experience: "mars" }, 3));
  });
});
