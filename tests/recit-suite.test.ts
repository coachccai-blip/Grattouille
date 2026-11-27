// La suite de l'histoire, dans les deux langues : les nouveaux venus qui trouvent les
// tickets semés et les protégés qui donnent de leurs nouvelles (src/app/suite/semis.ts),
// la vraie fin « Huit as de cœur » (src/app/suite/vraie-fin.ts), ce que Piou et les
// maîtres des lieux en disent (src/app/dialogues.ts), et les phrases des écrans neufs
// avec leur dictionnaire anglais (src/i18n/en/suite.ts).

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CATALOG } from "../shared/catalog";
import { formatInt } from "../shared/format";
import { PLACES } from "../shared/places";
import { SPECIES } from "../shared/rules";
import { TICKETS, ticketsOfPlace } from "../shared/tickets";
import type { PlaceId, PlayerState } from "../shared/types";
import { PIOU, TEXTES, legendGreeting, legendLine } from "../src/app/dialogues";
import {
  PALIERS, TEXTES_SEMIS, ditLaFoule, ditLeNouveauVenu, foule, nouveauVenu, nouvellesDe, paliersAtteints,
  paliersFranchis, prochainPalier,
} from "../src/app/suite/semis";
import { AS, CONSIGNE, HOTES, LEGENDE, PLANS, PLAN_DES_CARTES, TITRE, VENU, type Plan } from "../src/app/suite/vraie-fin";
import { setLang, t, type Lang } from "../src/i18n";
import { EN_BOUTIQUES } from "../src/i18n/en/boutiques";
import { EN_JEU } from "../src/i18n/en/jeu";
import { EN_POKER } from "../src/i18n/en/poker";
import { EN_RECIT } from "../src/i18n/en/recit";
import { EN_SUITE } from "../src/i18n/en/suite";
import { EN_TICKETS } from "../src/i18n/en/tickets";

// Chaque test repart du français, quoi qu'il arrive dans le précédent.
afterEach(() => setLang("fr"));

const LANGUES: readonly Lang[] = ["fr", "en"];
/** 110 caractères au plus : deux à trois lignes dans une bulle, sur un téléphone de 360 px. */
const MAX = 110;
/** Une lettre de protégé s'écrit sur une carte, pas dans une bulle : un peu plus de place. */
const MAX_LETTRE = 150;
/** Un bouton tient sur une ligne à 320 px : 26 caractères au plus. */
const MAX_BOUTON = 26;

/** Longueur en caractères, pas en unités UTF-16. */
const len = (s: string) => [...s].length;
const variables = (s: string) => [...new Set(s.match(/\{\w+\}/g) ?? [])].sort();
const sorted = (list: readonly string[]) => [...list].sort();

/** Les marques du tutoiement, en mots entiers. */
const TU = /(^|[^\p{L}])(tu|te|toi|ton|ta|tes|t')(?![\p{L}])/iu;

interface Entree {
  ou: string;
  fr: string;
  en: string;
}

/** Les fautes d'écriture d'une liste de phrases, par règle : rien à signaler rend une liste vide. */
function fautes(entrees: readonly Entree[]) {
  return {
    vides: entrees.filter((e) => e.fr.trim() === "" || e.en.trim() === "").map((e) => e.ou),
    identiques: entrees.filter((e) => e.fr === e.en).map((e) => e.ou),
    variables: entrees.filter((e) => variables(e.fr).join() !== variables(e.en).join()).map((e) => e.ou),
    // Guillemets : ni « » ni guillemet droit en anglais ; pas de guillemet droit en français.
    guillemets: entrees.filter((e) => /[«»"]/.test(e.en) || e.fr.includes('"')).map((e) => e.ou),
    // Le français espace sa ponctuation haute (« mot ! »), l'anglais non.
    ponctuationFr: entrees.filter((e) => /[^\s][!?;]/.test(e.fr.replace(/[!?]+(?=[!?])/g, ""))).map((e) => `${e.ou} : ${e.fr}`),
    ponctuationEn: entrees.filter((e) => /\s[!?;:]/.test(e.en)).map((e) => `${e.ou} : ${e.en}`),
    // Les insécables sont posées à l'affichage : aucune dans les textes, ni espace double, ni espace au bord.
    espaces: entrees
      .filter((e) => /[  ]/.test(e.fr + e.en) || /\s{2}/.test(e.fr + e.en) || e.fr !== e.fr.trim() || e.en !== e.en.trim())
      .map((e) => e.ou),
    // Les montants passent par formatEuros : jamais de symbole écrit à la main.
    euros: entrees.filter((e) => (e.fr + e.en).includes("€")).map((e) => e.ou),
    // Les titres de la flatterie n'ont plus cours : on ne flatte pas quelqu'un de la maison.
    titres: entrees.filter((e) => /Excellenc|Immensit/.test(e.fr + e.en)).map((e) => e.ou),
    // Patron se dit Boss, Légende se dit Legend, partout.
    patron: entrees.filter((e) => /\bPatron\b/.test(e.fr) !== /\bBoss\b/.test(e.en)).map((e) => e.ou),
    legende: entrees.filter((e) => /\bLégende\b/.test(e.fr) !== /\bLegend\b/.test(e.en)).map((e) => e.ou),
  };
}

const RIEN = {
  vides: [], identiques: [], variables: [], guillemets: [], ponctuationFr: [], ponctuationEn: [], espaces: [], euros: [],
  titres: [], patron: [], legende: [],
};

function paires(ou: string, fr: readonly string[], en: readonly string[]): Entree[] {
  const n = Math.max(fr.length, en.length);
  return Array.from({ length: n }, (_, i) => ({ ou: `${ou}[${i}]`, fr: fr[i] ?? "", en: en[i] ?? "" }));
}

// ---------------------------------------------------------------------------

describe("les nouveaux venus : qui trouve le ticket semé", () => {
  const RANGS = Array.from({ length: 2000 }, (_, i) => i + 1);

  it("le rang décide de tout : le même rang rend toujours le même nouveau venu", () => {
    for (const rang of [1, 2, 7, 8, 9, 40, 41, 250, 999, 12_345]) {
      expect(nouveauVenu(rang)).toEqual(nouveauVenu(rang));
      expect(nouveauVenu(rang).rang).toBe(rang);
    }
    // Rien ne dépend de la langue : c'est la même personne en anglais.
    const fr = RANGS.slice(0, 50).map(nouveauVenu);
    setLang("en");
    expect(RANGS.slice(0, 50).map(nouveauVenu)).toEqual(fr);
  });

  it("une des huit espèces du jeu, un prénom, des hardes du catalogue", () => {
    const tenues = new Map(CATALOG.map((item) => [item.id, item.slot]));
    for (const rang of RANGS) {
      const venu = nouveauVenu(rang);
      expect([rang, (SPECIES as readonly string[]).includes(venu.espece)]).toEqual([rang, true]);
      expect([rang, TEXTES_SEMIS.prenoms.includes(venu.prenom)]).toEqual([rang, true]);
      for (const [slot, id] of Object.entries(venu.hardes)) expect([rang, id, tenues.get(id)]).toEqual([rang, id, slot]);
    }
    // Des hardes : rien qui coûte plus de quelques euros.
    const prix = new Map(CATALOG.map((item) => [item.id, item.price]));
    for (const hardes of TEXTES_SEMIS.hardes) for (const id of Object.values(hardes)) expect(prix.get(id)).toBeLessThanOrEqual(3);
  });

  it("variés : jamais deux fois de suite la même espèce ni le même prénom", () => {
    for (const rang of RANGS) {
      const a = nouveauVenu(rang);
      const b = nouveauVenu(rang + 1);
      expect([rang, a.espece === b.espece, a.prenom === b.prenom]).toEqual([rang, false, false]);
    }
  });

  it("dix d'un coup : dix prénoms différents, et toutes les espèces passent sur le quai", () => {
    for (const premier of RANGS.slice(0, 600)) {
      const dix = foule(premier, 10);
      expect(dix.map((v) => v.rang)).toEqual(Array.from({ length: 10 }, (_, i) => premier + i));
      expect([premier, new Set(dix.map((v) => v.prenom)).size]).toEqual([premier, 10]);
      expect([premier, new Set(dix.map((v) => v.espece)).size >= 5]).toEqual([premier, true]);
    }
    expect(foule(4, 5).map((v) => v.rang)).toEqual([4, 5, 6, 7, 8]);
    // Quarante tickets de suite : quarante prénoms différents. Et quand un prénom revient, c'est un autre animal.
    for (const premier of [1, 2, 9, 77, 500]) {
      expect([premier, new Set(foule(premier, 40).map((v) => v.prenom)).size]).toEqual([premier, 40]);
      expect([premier, nouveauVenu(premier).prenom, nouveauVenu(premier + 40).prenom]).toEqual([premier, nouveauVenu(premier).prenom, nouveauVenu(premier).prenom]);
      expect([premier, nouveauVenu(premier).espece === nouveauVenu(premier + 40).espece]).toEqual([premier, false]);
    }
    const cent = RANGS.slice(0, 100).map(nouveauVenu);
    expect(new Set(cent.map((v) => v.espece)).size).toBe(SPECIES.length);
    expect(new Set(cent.map((v) => v.prenom)).size).toBe(TEXTES_SEMIS.prenoms.length);
    expect(new Set(cent.map((v) => JSON.stringify(v.hardes))).size).toBe(TEXTES_SEMIS.hardes.length);
  });

  it("quarante prénoms, tous différents, qui tiennent au-dessus d'une bulle", () => {
    expect(TEXTES_SEMIS.prenoms.length).toBe(40);
    expect(new Set(TEXTES_SEMIS.prenoms).size).toBe(40);
    for (const prenom of TEXTES_SEMIS.prenoms) expect([prenom, len(prenom) <= 10 && /^\p{Lu}\p{Ll}+$/u.test(prenom)]).toEqual([prenom, true]);
  });

  it("un rang qui n'en est pas un (zéro, négatif, pas un nombre) : le premier venu", () => {
    for (const rang of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) expect(nouveauVenu(rang)).toEqual(nouveauVenu(1));
    expect(nouveauVenu(7.9)).toEqual(nouveauVenu(7));
  });
});

describe("ce que disent les nouveaux venus", () => {
  const LIEUX = PLACES.map((p) => p.id);
  const repliques = (): Entree[] =>
    LIEUX.flatMap((lieu) => paires(`repliques.${lieu}`, TEXTES_SEMIS.repliques[lieu].fr, TEXTES_SEMIS.repliques[lieu].en));
  const foules = (): Entree[] => paires("foule", TEXTES_SEMIS.foule.fr, TEXTES_SEMIS.foule.en);

  it("beaucoup de répliques : six par lieu au moins, plus de quarante par langue, sans doublon", () => {
    expect(sorted(Object.keys(TEXTES_SEMIS.repliques))).toEqual(sorted(LIEUX));
    for (const langue of LANGUES) {
      for (const lieu of LIEUX) expect([langue, lieu, TEXTES_SEMIS.repliques[lieu][langue].length >= 6]).toEqual([langue, lieu, true]);
      const toutes = [...LIEUX.flatMap((lieu) => TEXTES_SEMIS.repliques[lieu][langue]), ...TEXTES_SEMIS.foule[langue]];
      expect(toutes.length).toBeGreaterThanOrEqual(40);
      expect(toutes.filter((s, i) => toutes.indexOf(s) !== i)).toEqual([]);
    }
    expect(TEXTES_SEMIS.foule.fr.length).toBe(9);
  });

  it("chaque réplique existe dans les deux langues, ni vide ni identique, et s'écrit comme il faut", () => {
    expect(fautes([...repliques(), ...foules()])).toEqual(RIEN);
    // Seules variables : le prix et le nom du ticket ; la foule sait aussi combien elle est.
    expect(repliques().flatMap((e) => variables(e.fr)).filter((v) => !["{prix}", "{ticket}"].includes(v))).toEqual([]);
    expect(foules().flatMap((e) => variables(e.fr)).filter((v) => !["{prix}", "{ticket}", "{n}"].includes(v))).toEqual([]);
  });

  it("elles tiennent dans leur bulle, avec le plus long nom et le plus gros prix de chaque lieu", () => {
    const tropLongues: string[] = [];
    for (const langue of LANGUES) {
      setLang(langue);
      for (const ticket of TICKETS) {
        const n = TEXTES_SEMIS.repliques[ticket.place][langue].length;
        for (let rang = 1; rang <= n; rang++) {
          const dit = ditLeNouveauVenu(rang, ticket.id);
          if (len(dit) > MAX) tropLongues.push(`${langue} ${ticket.id} (${len(dit)}) : ${dit}`);
        }
        for (const qty of [5, 10]) {
          for (let premier = 1; premier <= 45; premier += 5) {
            const dit = ditLaFoule(premier, qty, ticket.id);
            if (len(dit) > MAX) tropLongues.push(`${langue} foule ${ticket.id} (${len(dit)}) : ${dit}`);
          }
        }
      }
    }
    expect(tropLongues).toEqual([]);
  });

  it("l'anglais tient dans la même place : jamais plus de 25 caractères de plus que le français", () => {
    const debordent = [...repliques(), ...foules()].filter((e) => len(e.en) > len(e.fr) + 25).map((e) => `${e.ou} : ${len(e.fr)} → ${len(e.en)}`);
    expect(debordent).toEqual([]);
  });

  it("ils ne tutoient personne, et ne se moquent de personne", () => {
    expect([...repliques(), ...foules()].filter((e) => TU.test(e.fr.replace(/on se tutoie/g, ""))).map((e) => `${e.ou} : ${e.fr}`)).toEqual([]);
  });

  it("la réplique dépend du prix du ticket : un café pour 1 €, la stupeur pour la Lune", () => {
    // Un ticket à 1 € : de quoi s'offrir un café.
    expect(ditLeNouveauVenu(6, "tirelire")).toMatch(/Un ticket à 1.€ ! De quoi m'offrir un café\./);
    expect(ditLeNouveauVenu(7, "gratte-ciel")).toMatch(/^Un ticket de la Lune\./);
    for (const langue of LANGUES) {
      setLang(langue);
      for (const lieu of LIEUX) {
        const liste = TEXTES_SEMIS.repliques[lieu][langue];
        for (const ticket of ticketsOfPlace(lieu)) {
          for (let rang = 1; rang <= 24; rang++) {
            const dit = ditLeNouveauVenu(rang, ticket.id);
            // Toutes les variables sont remplies, et la phrase vient bien de la liste de son lieu.
            expect(dit).not.toMatch(/\{\w+\}/);
            const modele = liste[rang % liste.length]!;
            expect([lieu, rang, dit.startsWith(modele.split("{")[0]!)]).toEqual([lieu, rang, true]);
          }
        }
      }
    }
  });

  it("déterministes et variées : le même rang redit la même phrase, deux rangs voisins jamais", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      for (const ticket of TICKETS) {
        const vues = new Set<string>();
        for (let rang = 1; rang <= 60; rang++) {
          const dit = ditLeNouveauVenu(rang, ticket.id);
          expect(ditLeNouveauVenu(rang, ticket.id)).toBe(dit);
          expect([ticket.id, rang, dit === ditLeNouveauVenu(rang + 1, ticket.id)]).toEqual([ticket.id, rang, false]);
          vues.add(dit);
        }
        // Toutes les phrases du lieu finissent par sortir.
        expect([langue, ticket.id, vues.size]).toEqual([langue, ticket.id, TEXTES_SEMIS.repliques[ticket.place][langue].length]);
      }
    }
  });

  it("un ticket inconnu parle comme au Kiosque, sans rien casser", () => {
    expect(ditLeNouveauVenu(2, "ticket-inconnu")).toBe(TEXTES_SEMIS.repliques.kiosque.fr[2]!.replace("{ticket}", "ticket-inconnu"));
  });

  it("la petite foule dit combien elle est, et fait entendre toutes ses phrases", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      for (const qty of [5, 10]) {
        const vues = new Set<number>();
        // De carnet en carnet, depuis le premier ticket semé.
        for (let premier = 1, i = 0; i < 9; premier += qty, i++) {
          const dit = ditLaFoule(premier, qty, "lucarne");
          expect(ditLaFoule(premier, qty, "lucarne")).toBe(dit);
          expect(dit).not.toMatch(/\{\w+\}/);
          const index = TEXTES_SEMIS.foule[langue].findIndex((modele) => dit.startsWith(modele.split("{")[0]!) && dit.endsWith(modele.split("}").pop()!));
          expect([langue, qty, premier, index >= 0]).toEqual([langue, qty, premier, true]);
          vues.add(index);
          // Deux carnets de suite ne disent jamais la même chose.
          expect(ditLaFoule(premier + qty, qty, "lucarne")).not.toBe(dit);
        }
        expect([langue, qty, vues.size]).toEqual([langue, qty, 9]);
      }
      expect(ditLaFoule(6, 5, "lucarne")).toMatch(/\b5\b/);
      expect(ditLaFoule(11, 10, "tirelire")).toMatch(/\b10\b/);
    }
  });

  it("tout change avec la langue, sans rechargement", () => {
    const lire = () => [ditLeNouveauVenu(3, "lucarne"), ditLaFoule(1, 5, "lucarne"), nouvellesDe(1)!.texte];
    const fr = lire();
    setLang("en");
    const en = lire();
    for (let i = 0; i < fr.length; i++) expect([i, en[i] === fr[i]]).toEqual([i, false]);
    expect(en[0]).toContain("€10");
    setLang("fr");
    expect(lire()).toEqual(fr);
  });
});

describe("les protégés donnent de leurs nouvelles", () => {
  const lettres = (): Entree[] =>
    PALIERS.map((palier) => ({ ou: `etapes.${palier}`, fr: TEXTES_SEMIS.etapes[palier]!.texte.fr, en: TEXTES_SEMIS.etapes[palier]!.texte.en }));

  it("huit paliers : 1, 3, 8, 15, 30, 60, 120 et 250 tickets semés", () => {
    expect([...PALIERS]).toEqual([1, 3, 8, 15, 30, 60, 120, 250]);
    expect(sorted(Object.keys(TEXTES_SEMIS.etapes))).toEqual(sorted(PALIERS.map(String)));
    for (const palier of PALIERS) expect(nouvellesDe(palier)?.palier).toBe(palier);
    for (const autre of [0, 2, 4, 9, 100, 251, 1000]) expect(nouvellesDe(autre)).toBeNull();
  });

  it("du Grand Café à la Lune, puis le premier d'entre eux laisse tomber un ticket à son tour", () => {
    const lieux = PALIERS.map((palier) => nouvellesDe(palier)!.lieu);
    const attendus: PlaceId[] = [...PLACES.slice(1).map((p) => p.id), "kiosque"];
    expect(lieux).toEqual(attendus);
    expect(PALIERS.map((palier) => nouvellesDe(palier)!.boucle)).toEqual([false, false, false, false, false, false, false, true]);
    // Le dernier, c'est le tout premier : celui du premier ticket semé.
    const premier = nouvellesDe(1)!.protege;
    const dernier = nouvellesDe(250)!.protege;
    expect([dernier.rang, dernier.prenom, dernier.espece]).toEqual([1, premier.prenom, premier.espece]);
    expect(nouvellesDe(250)!.texte).toMatch(/votre tout premier ticket/);
    expect(nouvellesDe(250)!.texte).toMatch(/laissé tomber un à mon tour/);
    setLang("en");
    expect(nouvellesDe(250)!.texte).toMatch(/your very first ticket/);
    expect(nouvellesDe(250)!.texte).toMatch(/I dropped one myself/);
  });

  it("un protégé est un ancien : il a trouvé son ticket avant le palier, et il a changé de tenue", () => {
    const tenues = new Map(CATALOG.map((item) => [item.id, item.slot]));
    for (const palier of PALIERS) {
      const { protege } = nouvellesDe(palier)!;
      expect([palier, protege.rang <= palier]).toEqual([palier, true]);
      const venu = nouveauVenu(protege.rang);
      expect([protege.prenom, protege.espece]).toEqual([venu.prenom, venu.espece]);
      expect(protege.hardes).not.toEqual(venu.hardes);
      for (const [slot, id] of Object.entries(protege.hardes)) expect([palier, id, tenues.get(id)]).toEqual([palier, id, slot]);
    }
    // Sept protégés différents, et le premier qui revient.
    expect(new Set(PALIERS.map((palier) => nouvellesDe(palier)!.protege.rang)).size).toBe(7);
    // Sur le pont du Yacht, la ficelle du premier jour : la lettre le dit, l'avatar le montre.
    expect(nouvellesDe(30)!.protege.hardes.accessoire).toBe("ficelle");
    expect(nouvellesDe(30)!.texte).toMatch(/ficelle/);
  });

  it("chaque lettre existe dans les deux langues, s'écrit comme il faut et tient sur sa carte", () => {
    expect(fautes(lettres())).toEqual(RIEN);
    expect(lettres().flatMap((e) => variables(e.fr + e.en))).toEqual([]);
    for (const e of lettres()) {
      expect([e.ou, len(e.fr) <= MAX_LETTRE, len(e.en) <= MAX_LETTRE]).toEqual([e.ou, true, true]);
    }
    // Un protégé vouvoie son bienfaiteur.
    expect(lettres().filter((e) => TU.test(e.fr)).map((e) => e.ou)).toEqual([]);
    expect(lettres().some((e) => /\bvous\b|\bvotre\b/.test(e.fr))).toBe(true);
  });

  it("les paliers franchis par un geste, dans l'ordre : un ticket, un carnet de cinq, un carnet de dix", () => {
    expect(paliersFranchis(0, 1)).toEqual([1]);
    expect(paliersFranchis(1, 2)).toEqual([]);
    expect(paliersFranchis(2, 3)).toEqual([3]);
    expect(paliersFranchis(0, 5)).toEqual([1, 3]);
    expect(paliersFranchis(0, 10)).toEqual([1, 3, 8]);
    expect(paliersFranchis(10, 20)).toEqual([15]);
    expect(paliersFranchis(8, 8)).toEqual([]);
    expect(paliersFranchis(245, 255)).toEqual([250]);
    expect(paliersFranchis(250, 260)).toEqual([]);
    // Un par un jusqu'à 300 : chaque palier arrive une fois, et une seule.
    const vus: number[] = [];
    for (let n = 0; n < 300; n++) vus.push(...paliersFranchis(n, n + 1));
    expect(vus).toEqual([...PALIERS]);
  });

  it("les nouvelles se relisent : toutes celles dont le palier est atteint, et la prochaine s'annonce", () => {
    expect(paliersAtteints(0)).toEqual([]);
    expect(paliersAtteints(1)).toEqual([1]);
    expect(paliersAtteints(40)).toEqual([1, 3, 8, 15, 30]);
    expect(paliersAtteints(250)).toEqual([...PALIERS]);
    expect(paliersAtteints(9_999)).toEqual([...PALIERS]);
    expect(prochainPalier(0)).toBe(1);
    expect(prochainPalier(1)).toBe(3);
    expect(prochainPalier(40)).toBe(60);
    expect(prochainPalier(249)).toBe(250);
    expect(prochainPalier(250)).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe("la vraie fin : Huit as de cœur", () => {
  const TEMPS = ["invitation", "as", "secret", "pluie"] as const;

  /** Toutes les phrases de la cinématique, par paires. */
  function phrases(): Entree[] {
    const out: Entree[] = [];
    for (const plan of PLANS) {
      if (plan.titre) out.push({ ou: `${plan.id}.titre`, ...plan.titre });
      if (plan.recit) out.push({ ou: `${plan.id}.recit`, ...plan.recit });
      if (plan.chute) out.push({ ou: `${plan.id}.chute`, ...plan.chute });
      for (const [i, replique] of (plan.repliques ?? []).entries()) {
        out.push(...paires(`${plan.id}.${replique.qui}${i}`, replique.dit.fr, replique.dit.en));
      }
    }
    for (const hote of HOTES) out.push({ ou: `as.${hote}`, ...AS[hote] });
    out.push({ ou: "titre", ...TITRE }, { ou: "consigne", ...CONSIGNE }, { ou: "venu", ...VENU }, { ou: "legende", ...LEGENDE });
    return out;
  }

  /** Ce que disent les personnages : tout sauf le récit. */
  const paroles = (): Entree[] => phrases().filter((e) => /^as\.|\.\w+\d\[/.test(e.ou));
  const recits = (): Entree[] => phrases().filter((e) => /\.(recit|chute|titre)$|^(consigne|legende)$/.test(e.ou));
  const de = (plan: Plan, langue: Lang) => (plan.repliques ?? []).flatMap((r) => r.dit[langue]).join(" ");

  it("quatre temps, dans l'ordre : l'invitation, les huit as, le secret, la pluie de tickets", () => {
    expect([...new Set(PLANS.map((p) => p.temps))]).toEqual([...TEMPS]);
    // Les plans d'un même temps se suivent : on ne revient jamais en arrière.
    const rangs = PLANS.map((p) => TEMPS.indexOf(p.temps));
    expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
    expect(new Set(PLANS.map((p) => p.id)).size).toBe(PLANS.length);
    // Plus ample que le premier générique (trois écrans), sans s'éterniser.
    expect(PLANS.length).toBeGreaterThanOrEqual(12);
    expect(PLANS.length).toBeLessThanOrEqual(16);
  });

  it("chaque phrase existe dans les deux langues, ni vide ni identique, et s'écrit comme il faut", () => {
    expect(phrases().length).toBeGreaterThanOrEqual(40);
    expect(fautes(phrases())).toEqual(RIEN);
    expect(phrases().flatMap((e) => variables(e.fr + e.en))).toEqual([]);
  });

  it("pas de pavé : 110 caractères au plus par phrase, deux bulles au plus par personnage, une idée par écran", () => {
    const tropLongues = phrases().flatMap((e) => LANGUES.filter((l) => len(e[l]) > MAX).map((l) => `${e.ou} (${l}, ${len(e[l])})`));
    expect(tropLongues).toEqual([]);
    expect(phrases().filter((e) => len(e.en) > len(e.fr) + 25).map((e) => e.ou)).toEqual([]);
    for (const plan of PLANS) {
      for (const replique of plan.repliques ?? []) {
        expect([plan.id, replique.dit.fr.length === replique.dit.en.length, replique.dit.fr.length <= 2]).toEqual([plan.id, true, true]);
      }
      // Un écran : quatre blocs de texte au plus (un récit, deux ou trois bulles, une chute).
      const blocs = (plan.recit ? 1 : 0) + (plan.chute ? 1 : 0) + (plan.repliques ?? []).reduce((n, r) => n + r.dit.fr.length, 0);
      expect([plan.id, blocs <= 4]).toEqual([plan.id, true]);
      // Et jamais un écran vide : il raconte, ou il fait parler (le plan des cartes a ses huit as).
      expect([plan.id, blocs > 0 || plan.id === PLAN_DES_CARTES]).toEqual([plan.id, true]);
    }
  });

  it("le premier temps : la table sur le quai, les applaudissements, le pari de Sir Auguste", () => {
    const invitation = PLANS.filter((p) => p.temps === "invitation");
    expect(invitation[0]!.recit!.fr).toMatch(/Devant le Kiosque, une table est dressée/);
    expect(invitation.map((p) => p.recit?.fr ?? "").join(" ")).toMatch(/applaudissent/);
    const pari = invitation.find((p) => (p.repliques ?? []).some((r) => r.qui === "auguste"))!;
    expect(de(pari, "fr")).toMatch(/parié sur vous dès le premier matin/);
    expect(de(pari, "en")).toMatch(/bet on you that very first morning/);
  });

  it("le deuxième temps : huit hôtes, huit cartes, huit as de cœur", () => {
    expect([...HOTES]).toEqual(PLACES.map((p) => p.host));
    expect(sorted(Object.keys(AS))).toEqual(sorted(HOTES));
    for (const hote of HOTES) {
      expect([hote, /[Aa]s de cœur/.test(AS[hote].fr), /[Aa]ce of hearts/.test(AS[hote].en)]).toEqual([hote, true, true]);
    }
    expect(TITRE).toEqual({ fr: "Huit as de cœur", en: "Eight aces of hearts" });
    expect(PLANS.filter((p) => p.id === PLAN_DES_CARTES).length).toBe(1);
    const apres = PLANS[PLANS.findIndex((p) => p.id === PLAN_DES_CARTES) + 1]!;
    expect(de(apres, "fr")).toMatch(/C'est comme ça qu'on se reconnaît, à Grattouille\./);
    expect(de(apres, "en")).toMatch(/That's how we know our own, in Grattouille\./);
  });

  it("chacun garde sa voix en retournant sa carte", () => {
    expect(AS.gaspard.fr).toMatch(/Patron/);
    expect(AS.ondine.fr).toMatch(/vent du large/);
    expect(AS.hector.fr).toMatch(/La maison/);
    expect(AS.baron.fr).toMatch(/^Hmpf\./);
    expect(AS.auguste.fr).toMatch(/moustache/);
    expect(AS.balthazar.fr).toMatch(/bec/);
    expect(AS.taupin.fr).toMatch(/exemplaires/);
    expect(AS.selene.fr).toMatch(/D'en haut/);
    expect(AS.baron.en).toMatch(/^Hmph\./);
    expect(AS.ondine.en).toMatch(/sea breeze/);
  });

  it("le troisième temps : Piou ôte son calot, et dit le secret", () => {
    const secret = PLANS.filter((p) => p.temps === "secret");
    // Lui seul parle : c'est son histoire.
    expect([...new Set(secret.flatMap((p) => (p.repliques ?? []).map((r) => r.qui)))]).toEqual(["piou"]);
    expect(secret[0]!.recit!.fr).toMatch(/Piou ôte son calot/);
    expect(secret[secret.length - 1]!.recit!.fr).toMatch(/Piou remet son calot/);
    const fr = secret.map((p) => de(p, "fr")).join(" ");
    expect(fr).toMatch(/Le premier à débarquer ici sans un sou, c'était moi/);
    expect(fr).toMatch(/J'ai regardé par terre\. Rien !/);
    expect(fr).toMatch(/j'ai inventé une ville où il y aurait toujours quelque chose par terre/);
    expect(fr).toMatch(/Votre chance n'a jamais été de la chance\. Ici, on triche ! Mais toujours pour celui qui n'a rien\./);
    expect(fr).toMatch(/Tricher pour les autres : vous savez\. Démasquer qui triche pour soi : aussi\./);
    const en = secret.map((p) => de(p, "en")).join(" ");
    expect(en).toMatch(/The first to step ashore here without a penny was me/);
    expect(en).toMatch(/Your luck was never luck\. Here, we cheat! But always for whoever has nothing\./);
  });

  it("le dernier temps : le bateau du matin, dix tickets sur le quai, et la mouette", () => {
    const pluie = PLANS.filter((p) => p.temps === "pluie");
    expect(pluie[0]!.recit!.fr).toMatch(/le bateau du matin accoste\. Quelqu'un débarque sans un sou, et regarde par terre\./);
    expect(pluie.map((p) => p.recit!.fr).join(" ")).toMatch(/Dix tickets tombent sur le quai/);
    const derniere = PLANS[PLANS.length - 1]!;
    expect(derniere.temps).toBe("pluie");
    expect(derniere.recit!.fr).toMatch(/une mouette l'emporte/);
    expect(derniere.recit!.en).toMatch(/a seagull makes off with it/);
    // L'écho du premier matin : « avant les mouettes ».
    expect(pluie.map((p) => de(p, "fr")).join(" ")).toMatch(/Ramassez-les vite, avant les mouettes !/);
    expect(LEGENDE.fr).toMatch(/Légende/);
  });

  it("les huit maîtres des lieux ont tous la parole, et Piou aussi", () => {
    const voix = new Set(PLANS.flatMap((p) => (p.repliques ?? []).map((r) => r.qui)));
    for (const hote of ["gaspard", "ondine", "hector", "auguste"]) expect([hote, voix.has(hote as never)]).toEqual([hote, true]);
    expect(voix.has("piou")).toBe(true);
    expect(voix.has("venu")).toBe(true);
    // Ceux qui ne parlent pas autour de la table parlent en retournant leur carte.
    for (const hote of HOTES) expect(AS[hote].fr.length).toBeGreaterThan(20);
  });

  it("les personnages vouvoient, le récit tutoie", () => {
    expect(paroles().filter((e) => TU.test(e.fr)).map((e) => `${e.ou} : ${e.fr}`)).toEqual([]);
    expect(paroles().some((e) => /\bvous\b/i.test(e.fr))).toBe(true);
    expect(recits().some((e) => TU.test(e.fr))).toBe(true);
    expect(recits().filter((e) => /\bvous\b|\bvotre\b|\bvos\b/i.test(e.fr)).map((e) => e.ou)).toEqual([]);
  });

  it("chaque bouton dit ce qui va se passer, tient sur une ligne et a sa traduction", () => {
    const tous: Record<string, string> = { ...EN_RECIT, ...EN_JEU, ...EN_SUITE };
    for (const plan of PLANS) {
      const en = tous[plan.bouton];
      expect([plan.id, plan.bouton, typeof en]).toEqual([plan.id, plan.bouton, "string"]);
      expect([plan.bouton, len(plan.bouton) <= MAX_BOUTON, len(en!) <= MAX_BOUTON]).toEqual([plan.bouton, true, true]);
    }
    // Pas deux fois le même bouton : chaque appui mène ailleurs.
    expect(new Set(PLANS.map((p) => p.bouton)).size).toBe(PLANS.length);
    expect(PLANS[PLANS.length - 1]!.bouton).toBe("Retourner au Domaine");
    // Le geste du premier générique revient, mot pour mot.
    expect(PLANS.some((p) => p.bouton === "Laisser tomber un ticket")).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("ce que Piou en dit, sur le Domaine", () => {
  const P = TEXTES.piou;

  it("l'indice des huit maîtres des lieux évolue : aucun, quelques-uns, sept sur huit", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      const [aucun, quelques, sept] = P.maitres[langue];
      expect(PIOU.maitres(0)).toBe(aucun);
      for (let n = 1; n <= 6; n++) {
        expect(PIOU.maitres(n)).toBe(quelques!.replace("{n}", String(n)));
        expect(PIOU.maitres(n)).toMatch(new RegExp(`^${n} `));
      }
      expect(PIOU.maitres(7)).toBe(sept);
      const dits = Array.from({ length: 8 }, (_, n) => PIOU.maitres(n));
      for (const dit of dits) {
        expect(dit).not.toMatch(/\{\w+\}/);
        expect(len(dit)).toBeLessThanOrEqual(MAX);
        expect(dit).toMatch(langue === "fr" ? /huit/i : /eight/i);
      }
    }
    setLang("fr");
    expect(PIOU.maitres(0)).toMatch(/Il paraît que personne n'a jamais ruiné les huit maîtres des lieux/);
    expect(PIOU.maitres(7)).toMatch(/^Sept sur huit !/);
  });

  it("le Patron sème : Piou dit comment, puis ce qu'on en dit sur le quai", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      const modeles = P.semeur[langue];
      expect(modeles.length).toBe(5);
      const paliers: [number, number][] = [[0, 0], [1, 0], [2, 1], [9, 1], [10, 2], [49, 2], [50, 3], [199, 3], [200, 4], [12_345, 4]];
      for (const [n, i] of paliers) {
        expect([langue, n, PIOU.semeur(n)]).toEqual([langue, n, modeles[i]!.replace("{n}", formatInt(n))]);
        expect(len(PIOU.semeur(n))).toBeLessThanOrEqual(MAX);
      }
    }
    // Tant qu'il débute, la consigne : où se trouve le geste.
    setLang("fr");
    expect(PIOU.semeur(0)).toMatch(/à vous de semer ! Au comptoir, sous les règles et lots d'un ticket/);
    expect(PIOU.semeur(40)).toMatch(/^40 tickets semés !/);
    setLang("en");
    expect(PIOU.semeur(0)).toMatch(/under a ticket's rules and prizes/);
    // Les mots de l'interface : « règles et lots » se dit « rules and prizes ».
    expect(EN_JEU["règles et lots"]).toBe("rules and prizes");
  });

  it("après la vraie fin : le secret se garde", () => {
    expect(PIOU.legende).toMatch(/^Bonjour, Légende !/);
    expect(PIOU.legende).toMatch(/poches trouées/);
    setLang("en");
    expect(PIOU.legende).toMatch(/Legend/);
    expect(len(PIOU.legende)).toBeLessThanOrEqual(MAX);
  });
});

describe("le mot de chaque maître des lieux à la Légende", () => {
  const mots = (): Entree[] => HOTES.map((hote) => ({ ou: `legende.${hote}`, ...TEXTES.legende[hote] }));

  it("un mot par hôte, dans les deux langues, qui tient dans sa bulle", () => {
    expect(sorted(Object.keys(TEXTES.legende))).toEqual(sorted(HOTES));
    expect(fautes(mots())).toEqual(RIEN);
    for (const e of mots()) {
      expect([e.ou, len(e.fr) <= MAX, len(e.en) <= MAX]).toEqual([e.ou, true, true]);
      expect([e.ou, /Légende/.test(e.fr), /Legend/.test(e.en)]).toEqual([e.ou, true, true]);
      // La bulle pose déjà ses guillemets : pas de guillemets dedans.
      expect([e.ou, /[«»]/.test(e.fr)]).toEqual([e.ou, false]);
    }
    expect(mots().filter((e) => TU.test(e.fr)).map((e) => e.ou)).toEqual([]);
  });

  it("legendLine le rend dans la langue du moment ; les vendeurs et Piou n'en ont pas", () => {
    for (const langue of LANGUES) {
      setLang(langue);
      for (const hote of HOTES) {
        expect(legendLine(hote)).toMatchObject({ speaker: hote, text: TEXTES.legende[hote][langue], gesture: false });
      }
    }
    for (const autre of ["piou", "sidonie", "enzo", "colette", "archibald", "inconnu"]) expect(legendLine(autre)).toBeNull();
  });

  it("une fois par visite du jeu : le premier passage au comptoir, pas les suivants", () => {
    for (const hote of HOTES) {
      expect([hote, legendGreeting(hote)]).toEqual([hote, true]);
      expect([hote, legendGreeting(hote)]).toEqual([hote, false]);
    }
    expect(legendGreeting("sidonie")).toBe(false);
    expect(legendGreeting("piou")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Le magasin d'état : quand la vraie fin se lève, ce qu'un souvenir ne fait pas, ce qu'un
// ticket semé change. Chaque test repart d'un magasin neuf, branché sur une fausse API.

/** Un Patron qui possède tout : `plus` règle ce qui change d'un test à l'autre. */
function patron(plus: Partial<PlayerState> = {}): PlayerState {
  return {
    id: "p_test", pseudo: "Zabeth", species: "renard", balance: 1_000, pending: [], owned: CATALOG.map((item) => item.id),
    look: { chapeau: null, lunettes: null, tenue: null, accessoire: null, vehicule: null, residence: null },
    kiosk: true, standing: 80_000, fortune: 1_000,
    stats: { tickets: 12, winners: 5, wagered: 100, won: 300, bestGain: 50, bestTicket: "tirelire", jackpots: 0, sown: 0, sownValue: 0 },
    createdAt: 0, luckyIn: 60_000, defis: PLACES.map((p) => p.id), masters: 0, story: { fin: true, vraieFin: false },
    pokerStats: { hands: 0, pots: 0, unmasked: 0, caught: 0 },
    hostWins: { kiosque: 0, cafe: 0, casino: 0, salon: 0, cercle: 0, yacht: 0, banque: 0, lune: 0 },
    ...plus,
  };
}

/** Un magasin neuf, sa fausse API, et un joueur dedans. */
async function magasin(player: PlayerState) {
  vi.resetModules();
  // Le magasin programme ses messages avec les minuteurs de la fenêtre : ici, ceux de Node.
  vi.stubGlobal("window", { setTimeout, clearTimeout, location: { search: "" } });
  const store = await import("../src/app/store");
  const { api, ApiFailure } = await import("../src/app/api");
  store.useGame.setState({ phase: "jeu", sandbox: true, online: true, auth: { playerId: player.id, code: "CODE" }, player, toast: null });
  const vue = vi.spyOn(api, "storySeen");
  const seme = vi.spyOn(api, "sowTickets");
  vi.spyOn(api, "me").mockRejectedValue(new ApiFailure("NETWORK"));
  return { ...store, ApiFailure, vue, seme, etat: () => store.useGame.getState() };
}

describe("le magasin d'état : la vraie fin, les souvenirs, les tickets semés", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("la vraie fin se mérite : le Kiosque et les huit défis, et elle ne se doit qu'une fois", async () => {
    const m = await magasin(patron());
    expect(m.trueEndingDue(m.etat())).toBe(true);
    expect(m.trueEndingDue({ player: patron({ kiosk: false }) })).toBe(false);
    expect(m.trueEndingDue({ player: patron({ defis: PLACES.slice(0, 7).map((p) => p.id) }) })).toBe(false);
    expect(m.trueEndingDue({ player: patron({ story: { fin: true, vraieFin: true } }) })).toBe(false);
    expect(m.trueEndingDue({ player: null })).toBe(false);
    // Semer, c'est l'affaire du Patron, avec ou sans défis.
    expect(m.canSow(m.etat())).toBe(true);
    expect(m.canSow({ player: patron({ kiosk: false }) })).toBe(false);
    expect(m.canSow({ player: null })).toBe(false);
  });

  it("elle se lève quand elle est due, couvre le jeu, et se referme une fois le serveur prévenu", async () => {
    const m = await magasin(patron());
    m.vue.mockImplementation(async () => ({ state: patron({ story: { fin: true, vraieFin: true } }) }));
    expect(m.isCovered(m.etat())).toBe(false);
    m.openTrueEnding();
    expect([m.etat().trueEnding, m.etat().replay, m.isCovered(m.etat())]).toEqual([true, false, true]);
    // La rouvrir pendant qu'elle se joue ne change rien.
    m.openTrueEnding();
    expect(m.vue).not.toHaveBeenCalled();
    // La cinématique prévient le serveur à la toute fin, puis rend la main.
    expect(await m.markTrueEndingSeen()).toBe(true);
    m.closeTrueEnding();
    expect([m.etat().trueEnding, m.isCovered(m.etat()), m.etat().player?.story.vraieFin]).toEqual([false, false, true]);
    expect(m.vue).toHaveBeenCalledTimes(1);
    // Elle n'est plus due : revenir sur le Domaine ne la relance pas.
    m.openTrueEnding();
    expect(m.etat().trueEnding).toBe(false);
    expect(m.vue).toHaveBeenCalledTimes(1);
  });

  it("qui ne l'a pas méritée ne la voit pas", async () => {
    for (const player of [patron({ kiosk: false }), patron({ defis: [] }), patron({ story: { fin: true, vraieFin: true } })]) {
      const m = await magasin(player);
      m.openTrueEnding();
      expect(m.etat().trueEnding).toBe(false);
      expect(m.vue).not.toHaveBeenCalled();
    }
  });

  it("sans réseau à la fin : elle ne recommence pas à chaque passage, on redit seulement au serveur qu'elle a été vue", async () => {
    const m = await magasin(patron());
    m.vue.mockRejectedValue(new m.ApiFailure("NETWORK"));
    m.openTrueEnding();
    expect(await m.markTrueEndingSeen()).toBe(false);
    m.closeTrueEnding();
    // Toujours due, mais déjà vue jusqu'au bout depuis le lancement : pas de seconde séance.
    expect([m.etat().trueEnding, m.trueEndingDue(m.etat())]).toEqual([false, true]);
    m.openTrueEnding();
    expect(m.etat().trueEnding).toBe(false);
    expect(m.vue).toHaveBeenCalledTimes(2);
    // Le réseau revient : au passage suivant, le serveur l'apprend, et le joueur devient Légende.
    m.vue.mockImplementation(async () => ({ state: patron({ story: { fin: true, vraieFin: true } }) }));
    m.openTrueEnding();
    await vi.waitFor(() => expect(m.etat().player?.story.vraieFin).toBe(true));
    expect(m.etat().trueEnding).toBe(false);
  });

  it("son morceau du jeu n'est pas arrivé : elle se referme sans être comptée comme vue, et se relèvera", async () => {
    const m = await magasin(patron());
    m.openTrueEnding();
    m.closeTrueEnding(false);
    expect(m.etat().trueEnding).toBe(false);
    m.openTrueEnding();
    expect(m.etat().trueEnding).toBe(true);
    expect(m.vue).not.toHaveBeenCalled();
  });

  it("un souvenir ne dit rien au serveur, et ne compte pas pour une vraie séance", async () => {
    const m = await magasin(patron());
    // Le premier générique, revu : il couvre le jeu, puis se referme.
    m.replayMemory("fin");
    expect([m.etat().ending, m.etat().replay, m.etat().trueEnding, m.isCovered(m.etat())]).toEqual([true, true, false, true]);
    m.closeMemory();
    expect([m.etat().ending, m.etat().replay, m.isCovered(m.etat())]).toEqual([false, false, false]);
    // La vraie fin, revue.
    m.replayMemory("vraie-fin");
    expect([m.etat().trueEnding, m.etat().replay, m.etat().ending]).toEqual([true, true, false]);
    m.closeTrueEnding();
    expect([m.etat().trueEnding, m.etat().replay]).toEqual([false, false]);
    expect(m.vue).not.toHaveBeenCalled();
    expect(m.seme).not.toHaveBeenCalled();
    // Ce compte la doit encore pour de bon : le souvenir ne l'en a pas privé.
    m.openTrueEnding();
    expect([m.etat().trueEnding, m.etat().replay]).toEqual([true, false]);
  });

  it("le premier générique, lui, reste ce qu'il était : closeEnding le referme", async () => {
    const m = await magasin(patron());
    m.useGame.setState({ ending: true });
    expect(m.isCovered(m.etat())).toBe(true);
    m.closeEnding();
    expect([m.etat().ending, m.etat().replay]).toEqual([false, false]);
  });

  it("semer : la bourse baisse, le compteur monte, et rien d'autre ne bouge", async () => {
    const m = await magasin(patron());
    m.seme.mockImplementation(async (_auth, _type, qty) => ({
      state: patron({ balance: 1_000 - qty * 10, stats: { ...patron().stats, sown: qty, sownValue: qty * 10 } }),
    }));
    expect(m.sowBlocker("lucarne", 5)).toBeNull();
    expect(await m.sowTickets("lucarne", 5)).toBe(true);
    expect(m.seme).toHaveBeenCalledWith({ playerId: "p_test", code: "CODE" }, "lucarne", 5, []);
    const { player } = m.etat();
    expect([player?.balance, player?.stats.sown, player?.stats.sownValue, player?.stats.tickets, player?.pending.length]).toEqual([950, 5, 50, 12, 0]);
    expect(m.etat().toast).toBeNull();
  });

  it("le geste du générique est silencieux : bourse vide, pas un mot, pas un appel", async () => {
    const m = await magasin(patron({ balance: 0 }));
    expect(await m.sowTickets("tirelire", 1, true)).toBe(false);
    expect(m.seme).not.toHaveBeenCalled();
    expect([m.etat().toast, m.etat().purseFlash]).toEqual([null, 0]);
    // Au comptoir, le même refus se dit : il manque de quoi, et la bourse clignote.
    expect(await m.sowTickets("tirelire", 1)).toBe(false);
    expect(m.etat().toast?.kind).toBe("erreur");
    expect(m.etat().toast?.text).toMatch(/^Il te manque 1.€ pour semer ça\.$/);
    expect(m.etat().purseFlash).toBe(1);
    expect(m.seme).not.toHaveBeenCalled();
  });

  it("le geste du générique reste silencieux quand le serveur refuse ou ne répond pas", async () => {
    for (const code of ["NETWORK", "TOO_FAST", "INSUFFICIENT_FUNDS"] as const) {
      const m = await magasin(patron());
      m.seme.mockRejectedValue(new m.ApiFailure(code));
      expect(await m.sowTickets("tirelire", 1, true)).toBe(false);
      expect([code, m.etat().toast, m.etat().purseFlash]).toEqual([code, null, 0]);
    }
  });

  it("qui n'est pas Patron ne sème pas : le refus est dit, et rien ne part", async () => {
    const m = await magasin(patron({ kiosk: false }));
    expect(m.sowBlocker("tirelire", 1)).toBe("Seul le Patron du Kiosque laisse tomber des tickets pour les nouveaux venus.");
    expect(await m.sowTickets("tirelire", 1)).toBe(false);
    expect(m.seme).not.toHaveBeenCalled();
    // Hors connexion non plus.
    m.useGame.setState({ player: patron(), online: false });
    expect(m.sowBlocker("tirelire", 1)).toBe("Hors connexion. Les tickets à semer attendront.");
  });
});

// ---------------------------------------------------------------------------
// Les écrans neufs et retouchés, et leur dictionnaire anglais.

const lire = (chemin: string) => readFileSync(fileURLToPath(new URL(`../${chemin}`, import.meta.url)), "utf8");
const dossier = (chemin: string) =>
  readdirSync(fileURLToPath(new URL(`../${chemin}`, import.meta.url))).filter((f) => /\.tsx?$/.test(f)).map((f) => `${chemin}/${f}`);

/** Les phrases passées à `t()` dans un fichier source. */
function cles(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) out.push(JSON.parse(`"${m[1]}"`) as string);
  return out;
}

describe("les écrans de la suite et leur dictionnaire anglais", () => {
  /** Les écrans du lot : tout y est neuf, donc tout y est traduit dans suite.ts ou déjà ailleurs. */
  const NEUFS = [...dossier("src/screens/semis"), "src/screens/moments/VraieFin.tsx", "src/screens/domaine/Cloche.tsx"];
  /** Les écrans retouchés : seules leurs phrases nouvelles sont dans suite.ts. */
  const RETOUCHES = [
    "src/screens/moments/Moments.tsx", "src/screens/domaine/Domaine.tsx", "src/screens/comptoir/FicheTicket.tsx",
    "src/screens/comptoir/Comptoir.tsx", "src/screens/reglages/Reglages.tsx", "src/app/store.ts",
  ];
  const TOUS: Record<string, string> = { ...EN_RECIT, ...EN_JEU, ...EN_BOUTIQUES, ...EN_TICKETS, ...EN_POKER, ...EN_SUITE };
  const neuves = [...new Set(NEUFS.flatMap((chemin) => cles(lire(chemin))))];
  const boutons = PLANS.map((p) => p.bouton);

  it("aucune phrase d'interface sans traduction", () => {
    expect(neuves.length).toBeGreaterThan(15);
    expect([...neuves, ...boutons].filter((fr) => TOUS[fr] === undefined)).toEqual([]);
    setLang("en");
    for (const fr of [...neuves, ...boutons]) expect([fr, t(fr)]).toEqual([fr, TOUS[fr]]);
  });

  it("le dictionnaire ne traduit que ce que le jeu affiche", () => {
    const affichees = new Set([...[...NEUFS, ...RETOUCHES].flatMap((chemin) => cles(lire(chemin))), ...boutons]);
    // Les refus de store.ts sont des constantes : on les cherche telles quelles dans le fichier.
    const store = lire("src/app/store.ts");
    expect(Object.keys(EN_SUITE).filter((fr) => !affichees.has(fr) && !store.includes(JSON.stringify(fr)))).toEqual([]);
  });

  it("une phrase traduite ailleurs l'est de la même façon ici", () => {
    const ailleurs: Record<string, string> = { ...EN_RECIT, ...EN_JEU, ...EN_BOUTIQUES, ...EN_TICKETS, ...EN_POKER };
    const ecarts = Object.keys(EN_SUITE).filter((fr) => ailleurs[fr] !== undefined && ailleurs[fr] !== EN_SUITE[fr]);
    expect(ecarts.map((fr) => `« ${fr} » : “${EN_SUITE[fr]}” ici, “${ailleurs[fr]}” ailleurs`)).toEqual([]);
  });

  it("guillemets anglais, mêmes variables, et rien de vide", () => {
    for (const [fr, en] of Object.entries(EN_SUITE)) {
      expect([fr, /[«»"]/.test(en)]).toEqual([fr, false]);
      expect([fr, en.trim() !== "" && en === en.trim()]).toEqual([fr, true]);
      expect([fr, variables(en)]).toEqual([fr, variables(fr)]);
      expect([fr, /\s[!?;:]/.test(en) || /[  ]/.test(en)]).toEqual([fr, false]);
      expect([fr, en === fr]).toEqual([fr, false]);
    }
  });

  it("aucun texte en dur : les noms passent par noms.ts, les montants par formatEuros", () => {
    for (const chemin of NEUFS) {
      const source = lire(chemin);
      expect([chemin, /SPECIES_LABELS|rankOf\(|\bdef\.name\b|\?\.name\b|\.short\b|\.moment\b/.test(source)]).toEqual([chemin, false]);
      expect([chemin, source.includes("€")]).toEqual([chemin, false]);
    }
  });

  it("les modules de la suite ne pèsent pas sur le démarrage : ils se chargent à la demande", () => {
    const app = lire("src/App.tsx");
    expect(app).toMatch(/lazy\(\(\) => \w*\(?import\("\.\/screens\/moments\/VraieFin"\)\)?\)/);
    expect(app).toMatch(/lazy\(\(\) => \w*\(?import\("\.\/screens\/semis"\)\)?\)/);
    expect(lire("src/screens/comptoir/FicheTicket.tsx")).toMatch(/lazy\([^;]*import\("\.\.\/semis"\)/s);
    expect(lire("src/screens/domaine/Domaine.tsx")).toMatch(/lazy\([^;]*import\("\.\/Cloche"\)/s);
    // Ni la coquille ni les écrans du démarrage n'importent les textes de la suite autrement que par là.
    const demarrage = [
      "src/App.tsx", "src/app/store.ts", "src/app/dialogues.ts", "src/app/nav.ts", "src/screens/moments/Moments.tsx",
      "src/screens/domaine/Domaine.tsx", "src/screens/comptoir/Comptoir.tsx", "src/screens/comptoir/FicheTicket.tsx",
      "src/screens/reglages/Reglages.tsx",
    ];
    for (const chemin of demarrage) {
      const source = lire(chemin);
      const statiques = [...source.matchAll(/^import\s[^;]*?from\s+"([^"]+)";/gms)].map((m) => m[1]!);
      expect([chemin, statiques.filter((from) => /suite\/|\/semis|VraieFin|Cloche/.test(from))]).toEqual([chemin, []]);
    }
  });

  it("le premier générique sème un vrai ticket, sauf en souvenir ; la vraie fin ne rappelle le serveur qu'à la fin", () => {
    const moments = lire("src/screens/moments/Moments.tsx");
    const fin = moments.slice(moments.indexOf("export function Fin()"));
    expect(fin).toMatch(/if \(!relecture\) void sowTickets\("tirelire", 1, true\)/);
    const vraieFin = lire("src/screens/moments/VraieFin.tsx");
    expect(vraieFin).toMatch(/markTrueEndingSeen\(\)/);
    expect(vraieFin).not.toMatch(/sowTickets|api\.|fetch\(/);
  });
});
