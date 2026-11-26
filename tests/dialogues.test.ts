// Le récit dans les deux langues : les répliques de src/app/dialogues.ts (parité du
// français et de l'anglais, longueurs, registres, fil rouge), et les phrases des écrans
// du récit (Bienvenue, grands moments, Domaine) avec leur dictionnaire anglais.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { CATALOG, KIOSK } from "../shared/catalog";
import { formatEuros, formatInt } from "../shared/format";
import { PLACES } from "../shared/places";
import { registerOf, type Register } from "../shared/rules";
import type { PlaceId } from "../shared/types";
import {
  FIN, PIOU, TEXTES, chapterOf, hostName, ouverture, patronLine, say,
  type Line, type Situation, type Speaker,
} from "../src/app/dialogues";
import { setLang, t, type Lang } from "../src/i18n";
import { EN_BOUTIQUES } from "../src/i18n/en/boutiques";
import { EN_JEU } from "../src/i18n/en/jeu";
import { EN_RECIT } from "../src/i18n/en/recit";
import { EN_TICKETS } from "../src/i18n/en/tickets";
import { placeShort } from "../src/i18n/noms";

// Chaque test repart du français, quoi qu'il arrive dans le précédent.
afterEach(() => setLang("fr"));

const LANGUES: readonly Lang[] = ["fr", "en"];
const REGISTRES: readonly Register[] = ["familier", "poli", "deferent", "obsequieux", "cosmique"];
const SITUATIONS: readonly Situation[] = ["accueil", "vendu", "perdu", "gagne", "gros", "jackpot"];
const HOTES = Object.keys(TEXTES.scripts) as Exclude<Speaker, "piou">[];
const VENDEURS: readonly Speaker[] = ["sidonie", "enzo", "colette", "archibald"];

/** 110 caractères au plus : deux à trois lignes dans une bulle, sur un téléphone de 360 px. */
const MAX = 110;
/** Le plus long pseudo permis : 16 caractères. */
const PSEUDO = "Maximilien-Jules";
/** Tout le Standing du catalogue : au-delà, le joueur possède aussi le Kiosque. */
const TOUT = CATALOG.reduce((sum, item) => sum + item.standing, 0);
const PATRON = TOUT + KIOSK.standing;

/** Longueur en caractères, pas en unités UTF-16. */
const len = (s: string) => [...s].length;
/** Les espaces insécables de la typographie française, ramenées à des espaces ordinaires. */
const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");
const isGesture = (s: string) => s.startsWith("~");
const spoken = (s: string) => (isGesture(s) ? s.slice(1).trim() : s);
const variables = (s: string) => [...new Set(s.match(/\{\w+\}/g) ?? [])].sort();
const sorted = (list: readonly string[]) => [...list].sort();

/** Le registre dans lequel on rencontre un personnage pour la première fois. */
function premierRegistre(speaker: Speaker): Register {
  const place = PLACES.find((p) => p.host === speaker);
  return place ? registerOf(place.standing) : "familier";
}

/** Les registres dans lesquels un personnage se rencontre : du seuil de son lieu jusqu'au bout. */
function registresDe(speaker: Speaker): Register[] {
  return REGISTRES.slice(REGISTRES.indexOf(premierRegistre(speaker)));
}

/** Un Standing qui tombe dans ce registre. */
const STANDING: Record<Register, number> = { familier: 5, poli: 200, deferent: 800, obsequieux: 6_000, cosmique: 50_000 };

interface Entree {
  /** Où la réplique se trouve : « gaspard.accueil.familier[0] ». */
  ou: string;
  fr: string;
  en: string;
}

/** Deux listes de même rôle, mises en paires ; `undefined` là où une langue n'a rien. */
function paires(ou: string, fr: readonly string[] | undefined, en: readonly string[] | undefined): Entree[] {
  const n = Math.max(fr?.length ?? 0, en?.length ?? 0);
  return Array.from({ length: n }, (_, i) => ({ ou: `${ou}[${i}]`, fr: fr?.[i] ?? "", en: en?.[i] ?? "" }));
}

const liste = (x: string | readonly string[]): readonly string[] => (typeof x === "string" ? [x] : x);

/** Toutes les répliques des hôtes et des vendeurs, par paires. */
function repliques(): Entree[] {
  const out: Entree[] = [];
  for (const h of HOTES) {
    for (const s of SITUATIONS) {
      for (const r of REGISTRES) {
        out.push(...paires(`${h}.${s}.${r}`, TEXTES.scripts[h].fr[s]?.[r], TEXTES.scripts[h].en[s]?.[r]));
      }
    }
    for (const r of REGISTRES) out.push(...paires(`rumeurs.${h}.${r}`, TEXTES.rumeurs[h].fr[r], TEXTES.rumeurs[h].en[r]));
  }
  for (const [h, deux] of Object.entries(TEXTES.apres)) out.push(...paires(`apres.${h}`, deux.fr, deux.en));
  out.push(...paires("debuts", TEXTES.debuts.fr, TEXTES.debuts.en));
  out.push(...paires("annonce", TEXTES.annonce.fr, TEXTES.annonce.en));
  for (const s of SITUATIONS) out.push(...paires(`patron.${s}`, TEXTES.patron.fr[s], TEXTES.patron.en[s]));
  for (const p of PLACES) out.push(...paires(`ouvertures.${p.id}`, [TEXTES.ouvertures[p.id].fr], [TEXTES.ouvertures[p.id].en]));
  return out;
}

/** Les phrases de Piou et du générique, par paires. */
function recit(): Entree[] {
  const out: Entree[] = [];
  for (const [cle, deux] of Object.entries(TEXTES.piou)) out.push(...paires(`piou.${cle}`, liste(deux.fr), liste(deux.en)));
  for (const [cle, deux] of Object.entries(TEXTES.fin)) out.push(...paires(`fin.${cle}`, liste(deux.fr), liste(deux.en)));
  return out;
}

const TOUTES = [...repliques(), ...recit()];

/** Une phrase telle qu'elle peut s'afficher au plus long : le pseudo le plus long, les plus grands nombres. */
function auPlusLong(text: string, langue: Lang): string {
  setLang(langue);
  const lieu = PLACES.map((p) => placeShort(p.id)).sort((a, b) => len(b) - len(a))[0]!;
  const filled = spoken(text)
    .replace(/\{pseudo\}/g, PSEUDO)
    .replace(/\{lieu\}/g, lieu)
    .replace(/\{n\}/g, formatInt(TOUT))
    .replace(/\{total\}/g, String(CATALOG.length))
    .replace(/\{euros\}/g, formatEuros(999_999))
    .replace(/\{prix\}/g, formatEuros(KIOSK.price))
    .replace(/\{manque\}/g, formatEuros(KIOSK.price - 10_000_000_000));
  setLang("fr");
  return filled;
}

// ---------------------------------------------------------------------------

describe("ce que les autres écrans importent est toujours là", () => {
  it("hostName, say et patronLine rendent ce qu'ils rendaient", () => {
    expect(hostName("gaspard")).toBe("Gaspard");
    expect(hostName("baron")).toBe("Le Baron");
    expect(hostName("balthazar")).toBe("Le Commodore");
    expect(hostName("inconnu")).toBe("La maison");
    const line: Line | null = say("gaspard", "vendu", 5, "Zoé", 0);
    expect(line).toEqual({ speaker: "gaspard", name: "Gaspard", text: "Tiens, mon grand. Gratte-moi ça !", gesture: false });
    // Les répliques du brief, à leur place.
    expect(say("gaspard", "vendu", 200, "Zoé", 0)?.text).toBe("Voici pour vous, Zoé. Bonne chance.");
    expect(say("gaspard", "vendu", 800, "Zoé", 0)?.text).toBe("Si Zoé veut bien se donner la peine de gratter…");
    expect(say("gaspard", "vendu", 6_000, "Zoé", 0)?.text).toBe("Que Votre Excellence daigne effleurer ce modeste ticket.");
    expect(say("hector", "gros", 200, "Zoé", 0)).toMatchObject({ text: "Il lève un sourcil.", gesture: true });
    expect(say("baron", "jackpot", 800, "Zoé", 0)?.text).toBe("Excusez-moi. Une poussière dans l'œil.");
    expect(say("piou", "accueil", 0, "Zoé", 0)).toBeNull();
    expect(say("sidonie", "perdu", 0, "Zoé", 0)).toBeNull();
    expect(patronLine("gagne", 1)).toMatchObject({ speaker: "gaspard", name: "Gaspard", text: "Bien joué, Patron !", gesture: false });
  });

  it("PIOU garde ses clés, des textes et des fonctions", () => {
    for (const cle of ["accueil", "premierTrouve", "kiosque", "pileVide", "parTerre", "chance", "code", "premierTicket"] as const) {
      expect([cle, typeof PIOU[cle]]).toEqual([cle, "string"]);
      expect(PIOU[cle].length).toBeGreaterThan(10);
    }
    expect(PIOU.enAttente(1)).toBe("Je vous ai gardé 1 ticket au chaud.");
    expect(PIOU.enAttente(3)).toBe("Je vous ai gardé 3 tickets au chaud.");
    expect(plain(PIOU.ficelle(formatEuros(5)))).toContain("5 € en poche");
    expect(PIOU.standing(12, "le Grand Café")).toBe("Le Standing ouvre les portes. Encore 12 ★ pour le Grand Café.");
  });

  it("FIN garde ses quatre clés, et le récit y ajoute l'aveu", () => {
    for (const cle of ["titre", "gaspard", "texte", "suite", "question"] as const) expect([cle, typeof FIN[cle]]).toEqual([cle, "string"]);
    expect(FIN.titre).toBe("Le Kiosque est à toi");
    expect(FIN.aveu.length).toBeGreaterThanOrEqual(2);
  });

  it("un chapitre et une présentation par lieu", () => {
    expect(PLACES.map((p) => chapterOf(p.id))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const langue of LANGUES) {
      setLang(langue);
      for (const p of PLACES) {
        const line = ouverture(p.id);
        expect([p.id, line.speaker, line.name]).toEqual([p.id, p.host, hostName(p.host)]);
        expect(line.gesture).toBe(false);
        // Le nom est déjà écrit au-dessus de la bulle : la phrase ne commence pas par lui.
        expect(line.text.startsWith(line.name)).toBe(false);
      }
    }
  });
});

describe("tout se lit dans la langue courante, au moment où on le demande", () => {
  it("les noms des personnages", () => {
    setLang("en");
    expect(hostName("baron")).toBe("The Baron");
    expect(hostName("balthazar")).toBe("The Commodore");
    expect(hostName("inconnu")).toBe("The house");
    // Les noms propres ne se traduisent pas.
    for (const id of ["piou", "gaspard", "ondine", "hector", "auguste", "taupin", "selene", "sidonie", "enzo", "colette", "archibald"]) {
      expect([id, hostName(id)]).toEqual([id, TEXTES.noms.fr[id as Speaker]]);
    }
    expect(hostName("taupin")).toBe("Maître Taupin");
    expect(hostName("selene")).toBe("Dame Séléné");
    setLang("fr");
    expect(hostName("baron")).toBe("Le Baron");
  });

  it("les répliques, Piou et le générique changent avec la langue, sans rechargement", () => {
    const lire = () => [
      say("gaspard", "vendu", 5, "Zoé", 0)?.text, say("hector", "gros", 200, "Zoé", 0)?.text, patronLine("accueil", 0)?.text,
      ouverture("casino").text, PIOU.accueil, PIOU.enAttente(3), PIOU.standing(12, "x"), PIOU.trouve("chance", 2),
      PIOU.prochainLieu(7, "x", "jouer", 1), FIN.titre, FIN.gaspard, FIN.aveu.join(" "), FIN.texte, FIN.suite,
    ];
    const fr = lire();
    setLang("en");
    const en = lire();
    expect(en[0]).toBe("Here you go, sunshine. Get scratching!");
    expect(en[9]).toBe("The Kiosk is yours");
    // Aucune phrase n'est restée dans l'autre langue.
    for (let i = 0; i < fr.length; i++) expect([i, en[i] === fr[i]]).toEqual([i, false]);
    setLang("fr");
    expect(lire()).toEqual(fr);
  });

  it("les montants passent par formatEuros, dans la langue du moment", () => {
    expect(plain(PIOU.ficelle(formatEuros(5)))).toContain("une ficelle à 1 €");
    expect(plain(PIOU.kiosqueAVendre(formatEuros(KIOSK.price)))).toContain("250 Bn€");
    setLang("en");
    expect(PIOU.ficelle(formatEuros(5))).toContain("€5 in your pocket");
    expect(PIOU.ficelle(formatEuros(5))).toContain("at €1");
    expect(PIOU.kiosqueAVendre(formatEuros(KIOSK.price), formatEuros(1_000_000))).toContain("€250T");
    expect(PIOU.kiosqueAVendre(formatEuros(KIOSK.price), formatEuros(1_000_000))).toContain("€1M short");
    expect(PIOU.standing(25_000, "the Moon")).toBe("Standing opens doors. 25,000 more ★ for the Moon.");
  });

  it("aucun symbole € écrit à la main dans une réplique", () => {
    expect(TOUTES.filter((e) => e.fr.includes("€") || e.en.includes("€")).map((e) => e.ou)).toEqual([]);
  });
});

describe("parité du français et de l'anglais", () => {
  it("les mêmes personnages, les mêmes situations, les mêmes registres", () => {
    expect(sorted(HOTES)).toEqual(sorted(Object.keys(TEXTES.rumeurs)));
    expect(sorted(Object.keys(TEXTES.noms.fr))).toEqual(sorted(Object.keys(TEXTES.noms.en)));
    expect(sorted(Object.keys(TEXTES.noms.fr))).toEqual(sorted(["piou", ...HOTES]));
    for (const h of HOTES) {
      const { fr, en } = TEXTES.scripts[h];
      expect([h, sorted(Object.keys(en))]).toEqual([h, sorted(Object.keys(fr))]);
      for (const s of Object.keys(fr) as Situation[]) {
        expect([h, s, sorted(Object.keys(en[s] ?? {}))]).toEqual([h, s, sorted(Object.keys(fr[s] ?? {}))]);
      }
      expect([h, sorted(Object.keys(TEXTES.rumeurs[h].en))]).toEqual([h, sorted(Object.keys(TEXTES.rumeurs[h].fr))]);
    }
    expect(sorted(Object.keys(TEXTES.patron.en))).toEqual(sorted(Object.keys(TEXTES.patron.fr)));
    expect(sorted(Object.keys(TEXTES.ouvertures))).toEqual(sorted(PLACES.map((p) => p.id)));
  });

  it("autant de variantes dans chaque liste, et aucune phrase vide", () => {
    expect(TOUTES.filter((e) => e.fr.trim() === "" || e.en.trim() === "").map((e) => e.ou)).toEqual([]);
  });

  it("un geste reste un geste, une parole reste une parole", () => {
    expect(TOUTES.filter((e) => isGesture(e.fr) !== isGesture(e.en)).map((e) => e.ou)).toEqual([]);
    // Un geste se raconte à la troisième personne : jamais de pseudo dedans.
    expect(TOUTES.filter((e) => isGesture(e.fr) && /\{pseudo\}/.test(e.fr + e.en)).map((e) => e.ou)).toEqual([]);
  });

  it("{pseudo} et les autres variables : les mêmes dans les deux langues", () => {
    expect(TOUTES.filter((e) => variables(e.fr).join() !== variables(e.en).join()).map((e) => `${e.ou} : ${e.fr} / ${e.en}`)).toEqual([]);
    // Seules les répliques des hôtes nomment le joueur ; Piou et le générique ne connaissent que leurs propres variables.
    const connues = ["{pseudo}", "{n}", "{lieu}", "{euros}", "{prix}", "{manque}", "{total}"];
    expect(TOUTES.flatMap((e) => variables(e.fr)).filter((v) => !connues.includes(v))).toEqual([]);
    expect(recit().filter((e) => e.fr.includes("{pseudo}")).map((e) => e.ou)).toEqual([]);
  });

  it("les registres polis et déférents nomment le joueur dans les deux langues, les autres non", () => {
    // « Votre Excellence » et « Votre Immensité » remplacent le pseudo ; au registre familier, on ne le connaît pas encore.
    const fautifs = repliques().filter((e) => /\.(familier|obsequieux|cosmique)\[/.test(e.ou) && e.fr.includes("{pseudo}"));
    expect(fautifs.map((e) => e.ou)).toEqual([]);
  });

  it("les titres : Excellence et Immensité, chacun dans son registre", () => {
    const hors = (registre: string, mot: RegExp) =>
      repliques().filter((e) => !e.ou.includes(`.${registre}[`) && /^\w+\.\w+\.\w+\[/.test(e.ou) && (mot.test(e.fr) || mot.test(e.en))).map((e) => e.ou);
    expect(hors("obsequieux", /Excellenc[ey]/)).toEqual([]);
    expect(hors("cosmique", /Immensit[éy]/)).toEqual([]);
    // Et la traduction suit : là où le français dit « Excellence », l'anglais aussi.
    const ecart = TOUTES.filter((e) => /Excellence/.test(e.fr) !== /Excellency/.test(e.en) || /Immensité/.test(e.fr) !== /Immensity/.test(e.en));
    expect(ecart.map((e) => e.ou)).toEqual([]);
  });

  it("Patron se dit Boss, partout", () => {
    expect(TOUTES.filter((e) => /\bPatron\b/.test(e.fr) !== /\bBoss\b/.test(e.en)).map((e) => e.ou)).toEqual([]);
  });
});

describe("écriture", () => {
  it(`${MAX} caractères au plus, même avec le plus long pseudo et les plus grands nombres`, () => {
    const tropLongues: string[] = [];
    for (const e of TOUTES) {
      for (const langue of LANGUES) {
        const text = auPlusLong(e[langue], langue);
        if (len(text) > MAX) tropLongues.push(`${e.ou} (${langue}, ${len(text)}) : ${text}`);
      }
    }
    expect(tropLongues).toEqual([]);
  });

  it("l'anglais tient dans la même place : jamais plus de 25 caractères de plus que le français", () => {
    const debordent = TOUTES.filter((e) => len(spoken(e.en)) > len(spoken(e.fr)) + 25).map((e) => `${e.ou} : ${len(e.fr)} → ${len(e.en)}`);
    expect(debordent).toEqual([]);
  });

  it("guillemets : aucun « » en anglais, aucun guillemet droit, et la bulle pose les siens", () => {
    expect(TOUTES.filter((e) => /[«»]/.test(e.en)).map((e) => e.ou)).toEqual([]);
    expect(TOUTES.filter((e) => e.en.includes('"') || e.fr.includes('"')).map((e) => e.ou)).toEqual([]);
    expect(TOUTES.filter((e) => (e.en.match(/“/g) ?? []).length !== (e.en.match(/”/g) ?? []).length).map((e) => e.ou)).toEqual([]);
    // En français, la bulle entoure déjà la réplique de guillemets : pas de guillemets dedans.
    expect(repliques().filter((e) => /[«»]/.test(e.fr)).map((e) => e.ou)).toEqual([]);
  });

  it("typographie : le français espace sa ponctuation haute, l'anglais non", () => {
    // Le français s'écrit avec des espaces ordinaires (l'affichage pose les insécables) : « mot ! », jamais « mot! ».
    expect(TOUTES.filter((e) => /[^\s~][!?;]/.test(e.fr.replace(/[!?]+(?=[!?])/g, ""))).map((e) => `${e.ou} : ${e.fr}`)).toEqual([]);
    expect(TOUTES.filter((e) => /[\u00a0\u202f]/.test(e.fr + e.en)).map((e) => e.ou)).toEqual([]);
    expect(TOUTES.filter((e) => /\s[!?;:]/.test(e.en)).map((e) => `${e.ou} : ${e.en}`)).toEqual([]);
    expect(TOUTES.filter((e) => /\s{2}/.test(e.fr + e.en) || e.fr !== e.fr.trim() || e.en !== e.en.trim()).map((e) => e.ou)).toEqual([]);
  });

  it("aucune des mentions retirées, nulle part dans les répliques", () => {
    const retirees = /jeu de fiction|aucun (argent|gain) réel|réservé aux adultes|work of fiction|no real (money|winnings)|adults only/i;
    expect(TOUTES.filter((e) => retirees.test(e.fr) || retirees.test(e.en)).map((e) => e.ou)).toEqual([]);
  });

  it("une même phrase ne sert pas deux fois dans la bouche d'un personnage", () => {
    for (const langue of LANGUES) {
      for (const h of HOTES) {
        // D'un registre à l'autre, un geste peut se répéter (Gaspard lance toujours sa visière) : on compare les paroles.
        const paroles = repliques().filter((e) => e.ou.startsWith(`${h}.`)).map((e) => e[langue]).filter((s) => !isGesture(s));
        const doubles = paroles.filter((s, i) => paroles.indexOf(s) !== i);
        expect([langue, h, doubles]).toEqual([langue, h, []]);
      }
    }
  });
});

describe("vouvoiement", () => {
  // Les marques du tutoiement, en mots entiers.
  const TU = /(^|[^\p{L}])(tu|te|toi|ton|ta|tes|t')(?![\p{L}])/iu;

  it("les hôtes vouvoient, sauf Gaspard et Enzo au registre familier", () => {
    const fautifs = repliques()
      .filter((e) => !/^(gaspard|enzo)\.\w+\.familier\[/.test(e.ou) && !/^(rumeurs\.gaspard\.familier|debuts|ouvertures\.kiosque)\[/.test(e.ou))
      .filter((e) => !isGesture(e.fr) && TU.test(e.fr.replace(/Tut tut/g, "")));
    expect(fautifs.map((e) => `${e.ou} : ${e.fr}`)).toEqual([]);
  });

  it("Gaspard et Enzo tutoient bien les débutants", () => {
    const familier = [...(TEXTES.scripts.gaspard.fr.vendu?.familier ?? []), ...TEXTES.debuts.fr].join(" ");
    expect(TU.test(familier) || /Gratte-moi|Vas-y/.test(familier)).toBe(true);
    expect((TEXTES.scripts.enzo.fr.accueil?.familier ?? []).join(" ")).toMatch(/Regarde, touche pas/);
  });

  it("Piou vouvoie, toujours", () => {
    const piou = recit().filter((e) => e.ou.startsWith("piou."));
    expect(piou.filter((e) => TU.test(e.fr)).map((e) => `${e.ou} : ${e.fr}`)).toEqual([]);
    expect(piou.some((e) => /\bvous\b/i.test(e.fr))).toBe(true);
  });
});

describe("registres", () => {
  it("chaque personnage a ses répliques dans chaque registre où on le rencontre", () => {
    for (const h of HOTES) {
      const attendues: Situation[] = VENDEURS.includes(h) ? ["accueil", "vendu"] : [...SITUATIONS];
      expect([h, sorted(Object.keys(TEXTES.scripts[h].fr))]).toEqual([h, sorted(attendues)]);
      for (const s of attendues) {
        expect([h, s, Object.keys(TEXTES.scripts[h].fr[s] ?? {})]).toEqual([h, s, registresDe(h)]);
      }
    }
  });

  it("au moins trois variantes là où le joueur revient souvent : accueil, ticket perdu, petit gain", () => {
    const pauvres: string[] = [];
    for (const langue of LANGUES) {
      for (const h of HOTES) {
        for (const s of ["accueil", "perdu", "gagne", "vendu"] as const) {
          for (const [r, list] of Object.entries(TEXTES.scripts[h][langue][s] ?? {})) {
            // « vendu » : trois variantes pour les vendeurs, qui n'ont que cela à dire après l'accueil.
            const min = s === "vendu" && !VENDEURS.includes(h) ? 2 : 3;
            if (list.length < min) pauvres.push(`${langue} ${h}.${s}.${r} : ${list.length}`);
          }
        }
        for (const s of ["gros", "jackpot"] as const) {
          for (const [r, list] of Object.entries(TEXTES.scripts[h][langue][s] ?? {})) {
            if (list.length < 2) pauvres.push(`${langue} ${h}.${s}.${r} : ${list.length}`);
          }
        }
      }
      for (const s of SITUATIONS) {
        const min = s === "gros" || s === "jackpot" ? 2 : 3;
        if (TEXTES.patron[langue][s].length < min) pauvres.push(`${langue} patron.${s}`);
      }
    }
    expect(pauvres).toEqual([]);
  });

  it("say() parle dans le registre du joueur, et retombe sur le plus proche à défaut", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      for (const h of HOTES) {
        for (const r of REGISTRES) {
          for (const s of Object.keys(TEXTES.scripts[h].fr) as Situation[]) {
            // Une graine qui n'est pas multiple de 7 : la réplique ordinaire, pas un aparté.
            const line = say(h, s, STANDING[r], PSEUDO, 1);
            expect([langue, h, s, r, line === null]).toEqual([langue, h, s, r, false]);
            const voulu = registresDe(h).includes(r) ? r : premierRegistre(h);
            const attendu = TEXTES.scripts[h][langue][s]![voulu]!.map((raw) => spoken(raw).replace(/\{pseudo\}/g, PSEUDO));
            // Gaspard, tant que le joueur ne possède rien, se présente : c'est un autre test.
            expect([langue, h, s, r, attendu.includes(line!.text)]).toEqual([langue, h, s, r, true]);
            expect(line!.text).not.toMatch(/\{\w+\}/);
          }
        }
      }
    }
  });

  it("la graine fixe la variante : la même graine rend la même phrase, et toutes les variantes sortent", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      const list = TEXTES.scripts.ondine[langue].perdu!.poli!;
      const seen = new Set<string>();
      for (let seed = 0; seed < 12; seed++) {
        const a = say("ondine", "perdu", 200, "Zoé", seed)!.text;
        expect(say("ondine", "perdu", 200, "Zoé", seed)!.text).toBe(a);
        seen.add(a);
      }
      expect(seen.size).toBe(list.length);
    }
  });
});

describe("le fil rouge : qui sème les tickets ?", () => {
  const rumeursDe = (h: Exclude<Speaker, "piou">, langue: Lang) =>
    REGISTRES.flatMap((r) => TEXTES.rumeurs[h][langue][r] ?? []).map((raw) => spoken(raw).replace(/\{pseudo\}/g, PSEUDO));

  it("chaque personnage a sa théorie, dans chaque registre où on le rencontre", () => {
    for (const h of HOTES) {
      const registres = Object.keys(TEXTES.rumeurs[h].fr);
      expect([h, registres.length > 0]).toEqual([h, true]);
      // Les huit hôtes en ont une par registre ; les vendeurs, une seule, sans titre, qui vaut pour tous.
      if (!VENDEURS.includes(h)) expect([h, registres]).toEqual([h, registresDe(h)]);
    }
  });

  it("glissée de temps en temps, jamais à chaque visite : une fois sur sept environ", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      for (const h of HOTES) {
        for (const r of registresDe(h)) {
          const rumeurs = rumeursDe(h, langue);
          let n = 0;
          let derniere = false;
          let deuxDeSuite = 0;
          for (let seed = 0; seed < 1000; seed++) {
            const est = rumeurs.includes(say(h, "accueil", STANDING[r], PSEUDO, seed)!.text);
            if (est) n++;
            if (est && derniere) deuxDeSuite++;
            derniere = est;
          }
          expect([langue, h, r, n >= 100 && n <= 200]).toEqual([langue, h, r, true]);
          expect([langue, h, r, deuxDeSuite]).toEqual([langue, h, r, 0]);
        }
      }
    }
  });

  it("jamais ailleurs que dans l'accueil", () => {
    for (const h of HOTES) {
      const rumeurs = rumeursDe(h, "fr");
      for (const s of Object.keys(TEXTES.scripts[h].fr).filter((x) => x !== "accueil") as Situation[]) {
        for (let seed = 0; seed < 70; seed++) {
          expect(rumeurs.includes(say(h, s, STANDING[premierRegistre(h)], PSEUDO, seed)!.text)).toBe(false);
        }
      }
    }
  });

  it("Gaspard change de sujet, et personne ne vend la mèche avant la fin", () => {
    // Avant le générique, seule Dame Séléné sait ; aucune théorie ne nomme Gaspard.
    for (const h of HOTES) {
      for (const langue of LANGUES) expect([h, rumeursDe(h, langue).filter((s) => /Gaspard/.test(s))]).toEqual([h, []]);
    }
    expect(rumeursDe("gaspard", "fr").length).toBeGreaterThanOrEqual(5);
    // Piou a sa théorie : les poches trouées de Grattouille.
    expect(Array.from({ length: 8 }, (_, i) => PIOU.trouve("chance", i)).some((s) => /poches trouées/.test(s))).toBe(true);
    expect(Array.from({ length: 8 }, (_, i) => PIOU.trouve("fauche", i)).some((s) => /poches trouées/.test(s))).toBe(true);
    expect(PIOU.trouve("chance", 0)).toBe(PIOU.chance);
    expect(PIOU.trouve("fauche", 0)).toBe(PIOU.parTerre);
  });

  it("le premier matin, Gaspard se présente à qui ne possède encore rien", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      const debuts = TEXTES.debuts[langue];
      for (let seed = 0; seed < 21; seed++) expect(debuts.includes(say("gaspard", "accueil", 0, "Zoé", seed)!.text)).toBe(true);
      // Dès la première ★, il reprend son boniment.
      expect(debuts.includes(say("gaspard", "accueil", 1, "Zoé", 1)!.text)).toBe(false);
      // Et il ne se présente qu'à l'accueil.
      expect(debuts.includes(say("gaspard", "perdu", 0, "Zoé", 1)!.text)).toBe(false);
    }
  });

  it("collection complète : Mme Colette annonce la vente du Kiosque", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      const annonce = TEXTES.annonce[langue];
      for (let seed = 0; seed < 21; seed++) expect(annonce.includes(say("colette", "accueil", TOUT, "Zoé", seed)!.text)).toBe(true);
      expect(annonce.includes(say("colette", "accueil", TOUT - 1, "Zoé", 1)!.text)).toBe(false);
      expect(annonce.every((s) => /Kiosque|Kiosk|port|harbour/.test(s))).toBe(true);
    }
  });

  it("après la fin : Gaspard dit Patron, les théories s'arrêtent, chacun a son mot sur le dénouement", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      const patron = SITUATIONS.flatMap((s) => TEXTES.patron[langue][s]).map(spoken);
      for (const s of SITUATIONS) {
        for (let seed = 0; seed < 14; seed++) expect(patron.includes(say("gaspard", s, PATRON, "Zoé", seed)!.text)).toBe(true);
      }
      for (const h of HOTES.filter((x) => x !== "gaspard")) {
        const rumeurs = rumeursDe(h, langue);
        const apres = TEXTES.apres[h as keyof typeof TEXTES.apres][langue];
        let n = 0;
        for (let seed = 0; seed < 700; seed++) {
          const text = say(h, "accueil", PATRON, PSEUDO, seed)!.text;
          expect(rumeurs.includes(text)).toBe(false);
          if (apres.includes(text)) n++;
        }
        expect([langue, h, n]).toEqual([langue, h, 100]);
      }
    }
    // Piou change de phrase quand un ticket traîne.
    setLang("fr");
    expect(PIOU.trouvePatron).toBe("Un ticket par terre ! Le Patron en sème partout. Ah. C'est vous, le Patron.");
  });

  it("l'aveu : c'était Gaspard, c'est la tradition du Kiosque, et le Patron, c'est le joueur", () => {
    expect(FIN.aveu.join(" ")).toMatch(/C'était moi/);
    expect(FIN.aveu.join(" ")).toMatch(/tradition du Kiosque/);
    expect(FIN.aveu.join(" ")).toMatch(/le Patron, c'est vous/);
    // L'épilogue fait écho à l'arrivée : même quai, mêmes mouettes.
    expect(PIOU.premierTrouve).toMatch(/avant les mouettes/);
    expect(PIOU.nouveauVenu).toMatch(/avant les mouettes/);
    setLang("en");
    expect(FIN.aveu.join(" ")).toMatch(/It was me/);
    expect(FIN.aveu.join(" ")).toMatch(/the Boss is you/);
    expect(PIOU.nouveauVenu).toMatch(/before the seagulls/);
  });
});

describe("Piou guide toute la partie", () => {
  it("une consigne pour chaque étape, dans les deux langues", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      const lieu = placeShort("cafe");
      const consignes = [
        PIOU.accueil, PIOU.premierTrouve, PIOU.premierTicket, PIOU.aGratter, PIOU.kiosque, PIOU.ficelle(formatEuros(5)),
        PIOU.standing(19, lieu), PIOU.premieresEtoiles(19, lieu), PIOU.prochainLieu(7, lieu, "boutiques"),
        PIOU.prochainLieu(7, lieu, "jouer"), PIOU.pile(1), PIOU.pile(4), PIOU.fauche, PIOU.parTerre, PIOU.chance,
        PIOU.trouvePatron, PIOU.enAttente(1), PIOU.enAttente(4), PIOU.pileVide, PIOU.code, PIOU.collection(104, 110),
        PIOU.kiosqueAVendre(formatEuros(KIOSK.price)), PIOU.kiosqueAVendre(formatEuros(KIOSK.price), formatEuros(5)),
        PIOU.patron, PIOU.nouveauVenu,
      ];
      for (const [i, c] of consignes.entries()) {
        expect([langue, i, typeof c === "string" && c.length > 10 && len(c) <= MAX]).toEqual([langue, i, true]);
        // Toutes les variables sont remplies.
        expect(c).not.toMatch(/\{\w+\}/);
      }
      // Aucune consigne ne se répète.
      expect(new Set(consignes).size).toBe(consignes.length);
    }
  });

  it("le prochain lieu : le nombre de ★ qui manquent et le nom du lieu, quelle que soit la variante", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      for (const moyen of ["boutiques", "jouer"] as const) {
        const variantes = new Set<string>();
        for (let seed = 0; seed < 6; seed++) {
          const text = PIOU.prochainLieu(1_234, placeShort("yacht"), moyen, seed);
          expect(text).toContain(formatInt(1_234));
          expect(text).toContain(placeShort("yacht"));
          expect(text).toContain("★");
          variantes.add(text);
        }
        expect(variantes.size).toBe(3);
      }
    }
  });

  it("singulier et pluriel", () => {
    expect(PIOU.pile(1)).toMatch(/^Un ticket vous attend/);
    expect(PIOU.pile(5)).toMatch(/^5 tickets vous attendent/);
    setLang("en");
    expect(PIOU.pile(1)).toMatch(/^A ticket is waiting/);
    expect(PIOU.pile(5)).toMatch(/^5 tickets are waiting/);
    expect(PIOU.enAttente(1)).toBe("I've kept 1 ticket warm for you.");
    expect(PIOU.enAttente(5)).toBe("I've kept 5 tickets warm for you.");
  });
});

// ---------------------------------------------------------------------------
// Les écrans du récit : Bienvenue, grands moments, Domaine.

const ECRANS = ["src/screens/bienvenue/Bienvenue.tsx", "src/screens/moments/Moments.tsx", "src/screens/domaine/Domaine.tsx"];
const lire = (chemin: string) => readFileSync(fileURLToPath(new URL(`../${chemin}`, import.meta.url)), "utf8");

/** Les phrases passées à `t()` dans un fichier source. */
function cles(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) out.push(JSON.parse(`"${m[1]}"`) as string);
  return out;
}

describe("les écrans du récit et leur dictionnaire anglais", () => {
  const sources = ECRANS.map((chemin) => ({ chemin, source: lire(chemin) }));
  const utilisees = [...new Set(sources.flatMap((s) => cles(s.source)))];
  const TOUS: Record<string, string> = { ...EN_RECIT, ...EN_JEU, ...EN_BOUTIQUES, ...EN_TICKETS };

  it("chaque phrase affichée a sa traduction", () => {
    expect(utilisees.length).toBeGreaterThan(40);
    expect(utilisees.filter((fr) => EN_RECIT[fr] === undefined)).toEqual([]);
    setLang("en");
    for (const fr of utilisees) expect([fr, t(fr)]).toEqual([fr, TOUS[fr]]);
  });

  it("le dictionnaire ne traduit que ce que ces écrans affichent", () => {
    expect(Object.keys(EN_RECIT).filter((fr) => !utilisees.includes(fr))).toEqual([]);
  });

  it("une phrase traduite ailleurs l'est de la même façon ici", () => {
    const ailleurs: Record<string, string> = { ...EN_JEU, ...EN_BOUTIQUES, ...EN_TICKETS };
    const ecarts = Object.keys(EN_RECIT).filter((fr) => ailleurs[fr] !== undefined && ailleurs[fr] !== EN_RECIT[fr]);
    expect(ecarts.map((fr) => `« ${fr} » : “${EN_RECIT[fr]}” ici, “${ailleurs[fr]}” ailleurs`)).toEqual([]);
  });

  it("guillemets anglais, mêmes variables, et rien de vide", () => {
    for (const [fr, en] of Object.entries(EN_RECIT)) {
      expect([fr, /[«»"]/.test(en)]).toEqual([fr, false]);
      expect([fr, en.trim() !== "" && en === en.trim()]).toEqual([fr, true]);
      expect([fr, variables(en)]).toEqual([fr, variables(fr)]);
      expect([fr, /\s[!?;:]/.test(en) || /[\u00a0\u202f]/.test(en)]).toEqual([fr, false]);
    }
  });

  it("un bouton sur une ligne reste sur une ligne : la traduction ne s'allonge pas", () => {
    // Les libellés des boutons principaux : 26 caractères au plus tiennent sur une ligne à 320 px.
    const boutons = [
      "Commencer", "J'ai déjà un compte", "Débarquer", "Retrouver mon compte", "Ramasser le ticket",
      "Y aller", "Prendre les clés", "Laisser tomber un ticket", "Continuer à jouer",
    ];
    for (const fr of boutons) {
      expect([fr, utilisees.includes(fr)]).toEqual([fr, true]);
      expect([fr, len(EN_RECIT[fr]!) <= Math.max(len(fr), 26)]).toEqual([fr, true]);
    }
  });

  it("plus aucune des mentions retirées : ni dans les écrans, ni dans le dictionnaire, ni dans les répliques", () => {
    const retirees = /jeu de fiction|aucun (argent|gain) réel|réservé aux adultes|work of fiction|no real (money|winnings)|adults only/i;
    for (const { chemin, source } of sources) expect([chemin, retirees.test(source)]).toEqual([chemin, false]);
    expect(retirees.test(lire("src/app/dialogues.ts"))).toBe(false);
    expect(Object.entries(EN_RECIT).filter(([fr, en]) => retirees.test(fr) || retirees.test(en))).toEqual([]);
  });

  it("aucun texte en dur : les noms des données passent par noms.ts, les montants par formatEuros", () => {
    for (const { chemin, source } of sources) {
      // Jamais le nom français d'une donnée lu directement à l'affichage.
      expect([chemin, /SPECIES_LABELS|rankOf\(|\.keeperName|\bdef\.name\b|\?\.name\b|\.short\b|\.moment\b/.test(source)]).toEqual([chemin, false]);
      // Jamais de symbole € écrit à la main.
      expect([chemin, source.includes("€")]).toEqual([chemin, false]);
    }
    // L'écran de bienvenue offre le choix de la langue, et l'enregistre dans les réglages.
    expect(lire("src/screens/bienvenue/Bienvenue.tsx")).toMatch(/patchSettings\(\{ langue: \w+ \}\)/);
  });

  it("les grands moments : chapitres, présentation de l'hôte, aveu, ticket laissé sur le quai", () => {
    const moments = lire("src/screens/moments/Moments.tsx");
    for (const attendu of ["chapterOf(", "placeMoment(", "placeName(", "ouverture(", "FIN.question", "FIN.aveu", "PIOU.nouveauVenu", "closeEnding"]) {
      expect([attendu, moments.includes(attendu)]).toEqual([attendu, true]);
    }
    // Le geste du générique est tout symbolique : il ne demande rien au serveur.
    const fin = moments.slice(moments.indexOf("export function Fin()"));
    expect(/pickUpTicket|usePickUp|api\.|buyTickets|fetch\(/.test(fin)).toBe(false);
  });
});

// Le type `PlaceId` sert à vérifier, à la compilation, que les cartons couvrent tous les lieux.
const _tousLesLieux: Record<PlaceId, { fr: string; en: string }> = TEXTES.ouvertures;
void _tousLesLieux;
