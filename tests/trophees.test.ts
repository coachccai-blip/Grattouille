// Les trophées côté écrans : les noms et les phrases des douze objets et des 38 médailles
// dans les deux langues, les trophées qui gardent leur secret, ce qui est « déjà vu » et ce
// qui est « nouveau », la file des annonces, et ce qui reste chargé au démarrage.
// (Le calcul des médailles lui-même, shared/trophies.ts, est éprouvé dans tests/suite.test.ts.)

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatEuros, formatInt } from "../shared/format";
import { PLACES } from "../shared/places";
import { MEDAL_COUNT, TROPHIES, medalId, medalsOf, type TrophyId } from "../shared/trophies";
import type { PlayerState } from "../shared/types";
import { DEFAULT_SETTINGS, loadSettings } from "../src/app/persist";
import { useGame } from "../src/app/store";
import { gagneesEntre, medaillesNouvelles, oublierAnnonces, useAnnonces, vuesDe } from "../src/app/trophees";
import { i18nMisses, setLang, t, type Lang } from "../src/i18n";
import { EN_BOUTIQUES } from "../src/i18n/en/boutiques";
import { EN_JEU } from "../src/i18n/en/jeu";
import { EN_POKER } from "../src/i18n/en/poker";
import { EN_RECIT } from "../src/i18n/en/recit";
import { EN_TICKETS } from "../src/i18n/en/tickets";
import { EN_TROPHEES } from "../src/i18n/en/trophees";
import { gradeDe } from "../src/screens/trophees/art";
import {
  GROUPE_AU_DELA, annonceSuivante, annoncer, finAnnonce, marquerVues, peutAnnoncer, remettreAnnonce,
} from "../src/screens/trophees/file";
import {
  SECRET, TEXTES, compteDe, ecrire, ficheDe, lireMedaille, nomFamille, nomMedaille, phraseFamille, phraseMedaille, voileDe,
} from "../src/screens/trophees/textes";

// Chaque test repart du français, quoi qu'il arrive dans le précédent.
afterEach(() => setLang("fr"));

const LANGUES: readonly Lang[] = ["fr", "en"];
const FAMILLES = TROPHIES.map((famille) => famille.id);
const MEDAILLES = TROPHIES.flatMap((famille) => famille.tiers.map((_, i) => medalId(famille.id, i + 1)));
const ALL_PLACES = PLACES.map((place) => place.id);
/** Longueur en caractères, pas en unités UTF-16. */
const len = (s: string) => [...s].length;
const doublons = (liste: readonly string[]) => liste.filter((x, i) => liste.indexOf(x) !== i);
const variables = (s: string) => [...new Set(s.match(/\{\w+\}/g) ?? [])].sort();

/** Un état vierge, celui d'un compte qui débarque. */
function neuf(id = "p_0000000000000000"): PlayerState {
  return {
    id, pseudo: "Neuf", species: "renard", balance: 0, pending: [], owned: [],
    look: { chapeau: null, lunettes: null, tenue: null, accessoire: null, vehicule: null, residence: null },
    kiosk: false, standing: 0, fortune: 0,
    stats: { tickets: 0, winners: 0, wagered: 0, won: 0, bestGain: 0, bestTicket: null, jackpots: 0, sown: 0, sownValue: 0 },
    createdAt: 0, luckyIn: 0, defis: [], masters: 0, story: { fin: false, vraieFin: false },
    pokerStats: { hands: 0, pots: 0, unmasked: 0, caught: 0 },
    hostWins: { kiosque: 0, cafe: 0, casino: 0, salon: 0, cercle: 0, yacht: 0, banque: 0, lune: 0 }, experiences: [],
  };
}

/** Un compte d'avant les trophées, déjà bien avancé : 1 620 tickets, un gros lot, cinq jackpots. */
function ancien(id = "p_ancien0000000000"): PlayerState {
  const state = neuf(id);
  state.stats = { ...state.stats, tickets: 1_620, bestGain: 2_000_000, jackpots: 5 };
  return state;
}

/** Un compte qui a tout gagné. */
function comble(): PlayerState {
  const state = neuf("p_comble0000000000");
  state.stats = { ...state.stats, tickets: 5_000, bestGain: 1e15, jackpots: 25, sown: 1_000, sownValue: 1e12 };
  state.owned = Array.from({ length: 110 }, (_, i) => `bien-${i}`);
  state.kiosk = true;
  state.standing = 1e6;
  state.defis = [...ALL_PLACES];
  state.pokerStats.unmasked = 50;
  state.masters = 1;
  state.story = { fin: true, vraieFin: true };
  return state;
}

// ---------------------------------------------------------------------------

describe("les mots des trophées : douze objets, 38 médailles, deux langues", () => {
  it("un texte par famille, et un nom par palier", () => {
    expect(Object.keys(TEXTES).sort()).toEqual([...FAMILLES].sort());
    expect(MEDAL_COUNT).toBe(38);
    expect(MEDAILLES).toHaveLength(38);
    for (const famille of TROPHIES) expect([famille.id, TEXTES[famille.id].medailles.length]).toEqual([famille.id, famille.tiers.length]);
  });

  for (const langue of LANGUES) {
    it(`${langue} : chaque famille a un nom et une phrase, chaque médaille a un nom et une phrase`, () => {
      setLang(langue);
      for (const id of FAMILLES) {
        expect([id, nomFamille(id).trim().length > 0, phraseFamille(id).trim().length > 0]).toEqual([id, true, true]);
        // Une phrase est une phrase : une capitale, un point.
        expect([id, /^\p{Lu}.*[.?!]$/u.test(phraseFamille(id))]).toEqual([id, true]);
      }
      for (const medaille of MEDAILLES) {
        expect([medaille, nomMedaille(medaille).trim().length > 0, phraseMedaille(medaille).trim().length > 0]).toEqual([medaille, true, true]);
        expect([medaille, nomMedaille(medaille)]).not.toEqual([medaille, SECRET]);
        // Le modèle est rempli : plus d'accolade.
        expect(phraseMedaille(medaille)).not.toMatch(/[{}]/);
      }
    });

    it(`${langue} : pas deux médailles du même nom, pas deux objets du même nom`, () => {
      setLang(langue);
      const medailles = MEDAILLES.map((medaille) => nomMedaille(medaille));
      const familles = FAMILLES.map((id) => nomFamille(id));
      expect(doublons(medailles.map((nom) => nom.toLowerCase()))).toEqual([]);
      expect(doublons(familles.map((nom) => nom.toLowerCase()))).toEqual([]);
      // Une médaille ne porte pas non plus le nom d'un objet.
      expect(medailles.filter((nom) => familles.includes(nom))).toEqual([]);
      expect(new Set(MEDAILLES.map((medaille) => phraseMedaille(medaille))).size).toBe(38);
    });

    it(`${langue} : la phrase d'une médaille dit son palier, en euros ou en nombre`, () => {
      setLang(langue);
      for (const famille of TROPHIES) {
        famille.tiers.forEach((palier, i) => {
          const phrase = phraseMedaille(medalId(famille.id, i + 1));
          // Une famille à un seul palier le dit en toutes lettres (« Le Kiosque est à toi »).
          if (famille.tiers.length === 1) return;
          const ecrit = famille.unit === "euros" ? formatEuros(palier) : formatInt(palier);
          expect([famille.id, palier, phrase.includes(ecrit)]).toEqual([famille.id, palier, true]);
        });
      }
      expect(ecrire(TROPHIES[1]!, 1e15)).toBe(formatEuros(1e15));
    });

    it(`${langue} : un nom tient sur le carton d'une annonce, une phrase tient en deux lignes`, () => {
      setLang(langue);
      const longs = [...MEDAILLES.map((medaille) => nomMedaille(medaille)), ...FAMILLES.map((id) => nomFamille(id))].filter((nom) => len(nom) > 27);
      expect(longs).toEqual([]);
      expect(MEDAILLES.map((medaille) => phraseMedaille(medaille)).filter((phrase) => len(phrase) > 40)).toEqual([]);
      const phrases = FAMILLES.flatMap((id) => [phraseFamille(id), phraseFamille(id, "intrigue")]);
      expect(phrases.filter((phrase) => len(phrase) > 110)).toEqual([]);
    });
  }

  it("les deux langues ont la même forme, et aucune ne recopie l'autre", () => {
    for (const id of FAMILLES) {
      const texte = TEXTES[id];
      const paires = [texte.nom, texte.phrase, ...texte.medailles, texte.palier, ...(texte.voile ? [texte.voile] : []), ...(texte.un ? [texte.un] : [])];
      for (const paire of paires) {
        expect(Object.keys(paire).sort()).toEqual(["en", "fr"]);
        expect([paire.fr, paire.fr.trim() !== "", paire.en.trim() !== ""]).toEqual([paire.fr, true, true]);
        expect([paire.fr, variables(paire.en)]).toEqual([paire.fr, variables(paire.fr)]);
      }
      // Un nom, une phrase : traduits pour de bon. (« 1 jackpot » se dit pareil : c'est un palier.)
      for (const paire of [texte.nom, texte.phrase, ...texte.medailles, ...(texte.voile ? [texte.voile] : [])]) {
        expect([paire.fr, paire.en !== paire.fr]).toEqual([paire.fr, true]);
      }
    }
  });

  it("écriture : guillemets et espaces de chaque langue", () => {
    const tout = FAMILLES.flatMap((id) => {
      const texte = TEXTES[id];
      return [texte.nom, texte.phrase, ...texte.medailles, texte.palier, ...(texte.voile ? [texte.voile] : []), ...(texte.un ? [texte.un] : [])];
    });
    // L'anglais s'affiche tel quel : ni guillemet français, ni espace insécable, ni espace avant la ponctuation.
    expect(tout.filter((p) => /[«»\u00A0\u202F]| [!?;:]|"/.test(p.en)).map((p) => p.en)).toEqual([]);
    // Le français s'écrit avec des espaces ordinaires : les insécables sont posées à l'affichage.
    expect(tout.filter((p) => /[\u00A0\u202F]|"/.test(p.fr)).map((p) => p.fr)).toEqual([]);
    expect(tout.filter((p) => p.fr !== p.fr.trim() || p.en !== p.en.trim() || /\s{2}/.test(p.fr + p.en)).map((p) => p.fr)).toEqual([]);
  });

  it("un palier qui vaut 1 a sa phrase au singulier", () => {
    for (const famille of TROPHIES) {
      const texte = TEXTES[famille.id];
      const compte = texte.palier.fr.includes("{n}");
      if (compte && famille.unit === "nombre" && famille.tiers[0] === 1) expect([famille.id, typeof texte.un]).toEqual([famille.id, "object"]);
      // Un modèle sans `{n}` ne sert qu'à une famille d'un seul palier.
      if (!compte) expect([famille.id, famille.tiers.length]).toEqual([famille.id, 1]);
    }
    expect(compteDe(TROPHIES[2]!, 1)).toBe("1 jackpot");
    expect(compteDe(TROPHIES[2]!, 31)).toBe("31 jackpots");
    expect(phraseMedaille("semeur:1")).toBe("1 ticket laissé tomber");
    setLang("en");
    expect(phraseMedaille("semeur:1")).toBe("1 ticket dropped");
    expect(phraseMedaille("gain:6")).toBe("€1,000T on a single ticket");
    expect(phraseMedaille("tickets:4")).toBe("1,500 tickets played");
  });

  it("une médaille inconnue ne casse rien", () => {
    expect(lireMedaille("tickets:3")).toMatchObject({ rang: 3 });
    for (const inconnue of ["", "tickets", "tickets:0", "tickets:6", "tickets:deux", "licorne:1", "patron:2"]) {
      expect([inconnue, lireMedaille(inconnue)]).toEqual([inconnue, null]);
      expect(nomMedaille(inconnue)).toBe(SECRET);
      expect(phraseMedaille(inconnue)).toBe("");
    }
  });

  it("le grade d'une médaille : du cuivre au premier palier, l'étoile à rayons au dernier", () => {
    for (const famille of TROPHIES) {
      const grades = famille.tiers.map((_, i) => gradeDe(famille.id, i + 1));
      expect([famille.id, grades.at(-1)]).toEqual([famille.id, 6]);
      if (grades.length > 1) expect([famille.id, grades[0]]).toEqual([famille.id, 1]);
      // Le grade ne redescend jamais d'un palier au suivant.
      for (let i = 1; i < grades.length; i++) expect(grades[i]!).toBeGreaterThan(grades[i - 1]!);
    }
    expect(TROPHIES.find((f) => f.id === "gain")!.tiers.map((_, i) => gradeDe("gain", i + 1))).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

// ---------------------------------------------------------------------------

describe("les trophées qui gardent leur secret", () => {
  /** Tout ce que la vitrine écrit pour une famille, d'un seul tenant. */
  const ecrit = (id: TrophyId, player: PlayerState) => {
    const fiche = ficheDe(TROPHIES.find((f) => f.id === id)!, player);
    return [fiche.nom, fiche.phrase, ...fiche.medailles.flatMap((m) => [m.nom, m.phrase])].join(" | ");
  };
  /** Les vrais mots d'une famille, dans les deux langues : ce qu'un secret ne doit pas laisser passer. */
  const vrais = (id: TrophyId, avecLeNom: boolean) => {
    const texte = TEXTES[id];
    return [...(avecLeNom ? [texte.nom] : []), texte.phrase, ...texte.medailles, texte.palier, ...(texte.un ? [texte.un] : [])]
      .flatMap((paire) => [paire.fr, paire.en]);
  };

  for (const langue of LANGUES) {
    it(`${langue} : la vraie fin et la Table des Maîtres ne livrent ni nom ni phrase avant l'heure`, () => {
      setLang(langue);
      const player = ancien();
      for (const id of ["legende", "maitres"] as const) {
        expect(voileDe(id, player)).toBe("mystere");
        const fiche = ficheDe(TROPHIES.find((f) => f.id === id)!, player);
        expect(fiche.nom).toBe(SECRET);
        expect(fiche.medailles.map((m) => [m.nom, m.phrase, m.gagnee])).toEqual([[SECRET, "", false]]);
        // À la place de la phrase : de quoi piquer la curiosité, et rien de ce que le trophée compte.
        expect(fiche.phrase.length).toBeGreaterThan(10);
        const page = ecrit(id, player);
        expect(vrais(id, true).filter((mot) => page.includes(mot))).toEqual([]);
        expect(page).not.toMatch(/Maîtres|Masters|Table|as de cœur|Aces|poker|Poker|fin|ending/);
      }
    });

    it(`${langue} : les tickets semés intriguent sans rien dire tant que le Kiosque n'est pas au joueur`, () => {
      setLang(langue);
      const player = ancien();
      for (const id of ["semeur", "mecene"] as const) {
        expect(voileDe(id, player)).toBe("intrigue");
        const fiche = ficheDe(TROPHIES.find((f) => f.id === id)!, player);
        // L'objet et son nom se montrent ; ce qu'il compte, non.
        expect(fiche.nom).toBe(TEXTES[id].nom[langue]);
        expect(fiche.phrase).toBe(TEXTES[id].voile![langue]);
        expect(fiche.medailles.every((m) => m.nom === SECRET && m.phrase === "" && !m.gagnee)).toBe(true);
        const page = ecrit(id, player);
        expect(vrais(id, false).filter((mot) => page.includes(mot))).toEqual([]);
        expect(page).not.toMatch(/laiss|tomb|drop|nouveaux venus|newcomer|sem[eé]/i);
      }
    });
  }

  it("seuls ces quatre trophées ont un voile, et un compte qui débarque voit les huit autres en clair", () => {
    expect(FAMILLES.filter((id) => TEXTES[id].voile)).toEqual(["semeur", "mecene", "maitres", "legende"]);
    const player = neuf();
    expect(FAMILLES.filter((id) => voileDe(id, player) !== "ouvert")).toEqual(["semeur", "mecene", "maitres", "legende"]);
    for (const id of FAMILLES.filter((f) => !TEXTES[f].voile)) {
      const fiche = ficheDe(TROPHIES.find((f) => f.id === id)!, player);
      expect(fiche.nom).toBe(TEXTES[id].nom.fr);
      expect(fiche.medailles.every((m) => m.nom !== SECRET && m.phrase !== "")).toBe(true);
    }
  });

  it("chacun se dévoile à son heure", () => {
    const player = neuf();
    // Le Kiosque racheté : on peut semer, les deux trophées disent ce qu'ils comptent.
    player.kiosk = true;
    expect([voileDe("semeur", player), voileDe("mecene", player)]).toEqual(["ouvert", "ouvert"]);
    expect(phraseFamille("semeur", voileDe("semeur", player))).toBe(TEXTES.semeur.phrase.fr);
    expect([voileDe("maitres", player), voileDe("legende", player)]).toEqual(["mystere", "mystere"]);
    // Sept défis : la Table des Maîtres reste sous son drap. Huit : elle se montre.
    player.defis = ALL_PLACES.slice(0, 7);
    expect(voileDe("maitres", player)).toBe("mystere");
    player.defis = [...ALL_PLACES];
    expect(voileDe("maitres", player)).toBe("ouvert");
    expect(nomFamille("maitres", voileDe("maitres", player))).toBe("La Coupe des Maîtres");
    // La vraie fin ne se dévoile qu'une fois vue, même pour qui la mérite déjà.
    expect(voileDe("legende", player)).toBe("mystere");
    player.story.vraieFin = true;
    expect(voileDe("legende", player)).toBe("ouvert");
    expect(nomMedaille("legende:1", voileDe("legende", player))).toBe("Le neuvième as");
  });

  it("une médaille gagnée dévoile toujours son trophée : son annonce peut dire son nom", () => {
    const player = neuf();
    player.masters = 1;
    player.stats.sown = 1;
    expect([voileDe("maitres", player), voileDe("semeur", player)]).toEqual(["ouvert", "ouvert"]);
    // La valeur semée, elle, n'a encore rien gagné : sans le Kiosque, elle intrigue toujours.
    expect(voileDe("mecene", player)).toBe("intrigue");
    const tout = comble();
    expect(FAMILLES.map((id) => voileDe(id, tout))).toEqual(FAMILLES.map(() => "ouvert"));
    expect(medalsOf(tout).map((medaille) => nomMedaille(medaille, voileDe(lireMedaille(medaille)!.famille.id, tout))).includes(SECRET)).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe("déjà vues, nouvelles", () => {
  const RIEN = DEFAULT_SETTINGS.medailles;

  beforeEach(() => {
    useGame.setState({ player: null, sandbox: false, settings: { ...DEFAULT_SETTINGS } });
    useAnnonces.setState({ attente: [], annonce: null, bac: { joueur: "", vues: [] } });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("un compte d'avant les trophées : tout ce qu'il a mérité est nouveau, sans rien avoir à faire", () => {
    const player = ancien();
    expect(RIEN).toEqual({ joueur: "", vues: [] });
    expect(medaillesNouvelles(player, RIEN)).toEqual(medalsOf(player));
    expect(medaillesNouvelles(player, RIEN)).toHaveLength(4 + 3 + 2);
    // Un compte qui débarque n'a rien gagné : rien de nouveau.
    expect(medaillesNouvelles(neuf(), RIEN)).toEqual([]);
  });

  it("ce qui a été regardé ne l'est plus ; ce qui se gagne ensuite le redevient", () => {
    const player = ancien();
    const vues = { joueur: player.id, vues: medalsOf(player) };
    expect(medaillesNouvelles(player, vues)).toEqual([]);
    player.stats.tickets = 5_000;
    player.stats.jackpots = 25;
    expect(medaillesNouvelles(player, vues)).toEqual(["tickets:5", "jackpots:3"]);
  });

  it("ce qu'un autre compte a regardé sur le même appareil ne compte pas", () => {
    const player = ancien();
    const autre = { joueur: "p_quelquunautre000", vues: medalsOf(comble()) };
    expect(medaillesNouvelles(player, autre)).toEqual(medalsOf(player));
  });

  it("regarder la vitrine retient tout dans les réglages, au nom du compte", () => {
    const player = ancien();
    useGame.setState({ player });
    expect(useGame.getState().settings.medailles).toEqual(RIEN);
    marquerVues();
    const { settings } = useGame.getState();
    expect(settings.medailles).toEqual({ joueur: player.id, vues: medalsOf(player) });
    expect(medaillesNouvelles(player, settings.medailles)).toEqual([]);
    // Les autres réglages n'ont pas bougé.
    expect({ ...settings, medailles: RIEN }).toEqual(DEFAULT_SETTINGS);
    // Rien de nouveau : rien n'est réécrit.
    marquerVues();
    expect(useGame.getState().settings).toBe(settings);
  });

  it("en bac à sable rien ne s'enregistre : c'est gardé en mémoire, le temps de la visite", () => {
    const player = ancien();
    useGame.setState({ player, sandbox: true });
    const avant = useGame.getState().settings;
    expect(medaillesNouvelles(player, vuesDe(useGame.getState(), useAnnonces.getState().bac))).toHaveLength(9);
    marquerVues();
    expect(useGame.getState().settings).toBe(avant);
    expect(useAnnonces.getState().bac).toEqual({ joueur: player.id, vues: medalsOf(player) });
    expect(medaillesNouvelles(player, vuesDe(useGame.getState(), useAnnonces.getState().bac))).toEqual([]);
    // Et le vrai compte de l'appareil garde ce qu'il avait regardé.
    expect(vuesDe({ sandbox: false, settings: avant }, useAnnonces.getState().bac)).toBe(avant.medailles);
  });

  it("sans compte, rien à retenir", () => {
    marquerVues();
    expect(useGame.getState().settings.medailles).toEqual(RIEN);
  });

  /** Fait lire à l'appareil des réglages enregistrés. */
  function enregistres(settings: unknown): void {
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => (key === "grattouille.settings" ? JSON.stringify(settings) : null) },
    });
  }

  it("des réglages enregistrés avant les trophées se lisent avec la valeur de départ", () => {
    // Sans stockage du tout (ou illisible) : les réglages de départ.
    expect(loadSettings().medailles).toEqual(RIEN);
    // Les réglages d'un joueur des versions 1.0 à 2.0 : ce champ n'existait pas.
    enregistres({ son: false, vibrations: true, calme: true, langue: "en", signes: { lucarne: "lion" }, codeNote: true });
    const lus = loadSettings();
    expect(lus.medailles).toEqual(RIEN);
    // Et ses autres réglages sont bien les siens.
    expect([lus.son, lus.calme, lus.langue, lus.signes, lus.codeNote]).toEqual([false, true, "en", { lucarne: "lion" }, true]);
  });

  it("des médailles vues enregistrées se relisent, et ce qui est illisible est écarté", () => {
    enregistres({ medailles: { joueur: "p_ancien0000000000", vues: ["tickets:1", "gain:2"] } });
    expect(loadSettings().medailles).toEqual({ joueur: "p_ancien0000000000", vues: ["tickets:1", "gain:2"] });
    for (const abime of [null, 3, "tickets:1", [], { joueur: 12 }, { vues: "tout" }]) {
      enregistres({ medailles: abime });
      expect([abime, loadSettings().medailles]).toEqual([abime, RIEN]);
    }
    enregistres({ medailles: { joueur: "p_x", vues: ["tickets:1", 4, null, "gain:1"] } });
    expect(loadSettings().medailles).toEqual({ joueur: "p_x", vues: ["tickets:1", "gain:1"] });
  });

  it("la suppression du compte repart des réglages de départ : plus aucune médaille vue", () => {
    // deleteAccount (src/app/store.ts) repart de `{ ...DEFAULT_SETTINGS, … }` : ce champ y est vide,
    // et rien ne le reporte d'un compte au suivant.
    expect(DEFAULT_SETTINGS.medailles).toEqual({ joueur: "", vues: [] });
    const store = readFileSync(fileURLToPath(new URL("../src/app/store.ts", import.meta.url)), "utf8");
    const supprime = store.slice(store.indexOf("export async function deleteAccount"), store.indexOf("export function patchSettings"));
    expect(supprime).toMatch(/const settings = \{ \.\.\.DEFAULT_SETTINGS\b[^}]*\};/);
    expect(supprime).toMatch(/clearAll\(\)/);
    expect(supprime).not.toMatch(/medailles/);
    // Aucune clé de stockage en plus : toujours les trois mêmes.
    const persist = readFileSync(fileURLToPath(new URL("../src/app/persist.ts", import.meta.url)), "utf8");
    expect([...persist.matchAll(/"(grattouille\.[a-z]+)"/g)].map((m) => m[1]).sort()).toEqual([
      "grattouille.auth", "grattouille.revealed", "grattouille.settings",
    ]);
  });
});

// ---------------------------------------------------------------------------

describe("la file des annonces", () => {
  const LIBRE: Parameters<typeof peutAnnoncer>[0] = { phase: "jeu", welcome: false, ending: false, openings: [] };

  beforeEach(() => {
    // Le compte change : la file repart de zéro, et plus rien n'a été dit.
    useGame.setState({ player: null, sandbox: false, settings: { ...DEFAULT_SETTINGS }, phase: "jeu", welcome: false, ending: false, openings: [] });
    useAnnonces.setState({ attente: [], annonce: null, bac: { joueur: "", vues: [] } });
  });

  /** L'état du joueur change, comme après une réponse du serveur. */
  function devient(player: PlayerState, change: (p: PlayerState) => void): PlayerState {
    const next = structuredClone(player);
    change(next);
    useGame.setState({ player: next });
    return next;
  }
  const file = () => useAnnonces.getState().attente;
  const aLEcran = () => useAnnonces.getState().annonce;

  it("ce qu'un changement d'état vient de faire gagner, et rien d'un compte à l'autre", () => {
    const avant = neuf();
    const apres = neuf();
    apres.stats.tickets = 100;
    expect(gagneesEntre(avant, apres)).toEqual(["tickets:1", "tickets:2"]);
    expect(gagneesEntre(apres, apres)).toEqual([]);
    expect(gagneesEntre(null, apres)).toEqual([]);
    expect(gagneesEntre(apres, null)).toEqual([]);
    expect(gagneesEntre(neuf("p_a"), ancien("p_b"))).toEqual([]);
  });

  it("rien au premier état de la session : un compte d'avant les trophées n'a pas de rafale d'annonces", () => {
    const player = ancien();
    expect(medalsOf(player)).toHaveLength(9);
    useGame.setState({ player });
    expect(file()).toEqual([]);
    expect(annoncer(true)).toBe(false);
    expect(aLEcran()).toBeNull();
    // La pastille du Domaine, elle, les compte toutes.
    expect(medaillesNouvelles(player, useGame.getState().settings.medailles)).toHaveLength(9);
  });

  it("une médaille gagnée pendant la session rejoint la file, puis passe à l'écran", () => {
    let player = neuf();
    player.stats.tickets = 9;
    useGame.setState({ player });
    player = devient(player, (p) => { p.stats.tickets = 10; });
    expect(file()).toEqual(["tickets:1"]);
    expect(annoncer(true)).toBe(true);
    expect(aLEcran()).toEqual(["tickets:1"]);
    expect(file()).toEqual([]);
    // Une seule annonce à la fois.
    devient(player, (p) => { p.stats.bestGain = 150; });
    expect(file()).toEqual(["gain:1"]);
    expect(annoncer(true)).toBe(false);
    expect(aLEcran()).toEqual(["tickets:1"]);
    finAnnonce();
    expect(aLEcran()).toBeNull();
    expect(annoncer(true)).toBe(true);
    expect(aLEcran()).toEqual(["gain:1"]);
  });

  it("un changement qui ne fait rien gagner ne met rien en file", () => {
    let player = ancien();
    useGame.setState({ player });
    player = devient(player, (p) => { p.balance += 500; p.stats.tickets += 1; p.look.chapeau = "casquette"; });
    devient(player, (p) => { p.stats.winners += 1; });
    expect(file()).toEqual([]);
  });

  it("l'ordre : celui où les médailles sont tombées, puis celui des familles et des rangs", () => {
    let player = neuf();
    useGame.setState({ player });
    player = devient(player, (p) => { p.stats.jackpots = 1; });
    player = devient(player, (p) => { p.stats.tickets = 100; p.owned = Array.from({ length: 10 }, (_, i) => `b${i}`); });
    expect(file()).toEqual(["jackpots:1", "tickets:1", "tickets:2", "collection:1"]);
    expect(annonceSuivante(["jackpots:1", "tickets:1", "tickets:2"])).toEqual({ annonce: ["jackpots:1"], reste: ["tickets:1", "tickets:2"] });
    expect(annonceSuivante(["tickets:1", "tickets:2"])).toEqual({ annonce: ["tickets:1"], reste: ["tickets:2"] });
    expect(annonceSuivante(["tickets:2"])).toEqual({ annonce: ["tickets:2"], reste: [] });
    expect(annonceSuivante([])).toBeNull();
  });

  it("jusqu'à trois, une par une ; au-delà de trois, une seule annonce les regroupe", () => {
    expect(GROUPE_AU_DELA).toBe(3);
    let player = neuf();
    useGame.setState({ player });
    // Trois d'un coup : trois annonces, dans l'ordre.
    player = devient(player, (p) => { p.stats.tickets = 500; });
    expect(file()).toEqual(["tickets:1", "tickets:2", "tickets:3"]);
    const vues: string[][] = [];
    while (annoncer(true)) {
      vues.push(aLEcran()!);
      finAnnonce();
    }
    expect(vues).toEqual([["tickets:1"], ["tickets:2"], ["tickets:3"]]);
    // Un très gros lot : quatre paliers du gain et le premier jackpot, d'un seul coup.
    devient(player, (p) => { p.stats.bestGain = 2_000_000_000; p.stats.jackpots = 1; });
    expect(file()).toHaveLength(5);
    expect(annoncer(true)).toBe(true);
    expect(aLEcran()).toEqual(["gain:1", "gain:2", "gain:3", "gain:4", "jackpots:1"]);
    expect(file()).toEqual([]);
    finAnnonce();
    expect(annoncer(true)).toBe(false);
  });

  it("le regroupement se décide au moment d'annoncer : ce qui arrive pendant une annonce attend avec le reste", () => {
    let player = neuf();
    useGame.setState({ player });
    player = devient(player, (p) => { p.stats.tickets = 100; });
    expect(annoncer(true)).toBe(true);
    expect(aLEcran()).toEqual(["tickets:1"]);
    devient(player, (p) => { p.stats.bestGain = 1_000_000; });
    expect(file()).toEqual(["tickets:2", "gain:1", "gain:2", "gain:3"]);
    finAnnonce();
    expect(annoncer(true)).toBe(true);
    expect(aLEcran()).toEqual(["tickets:2", "gain:1", "gain:2", "gain:3"]);
  });

  it("une annonce interrompue par un grand moment repasse après, en tête de file", () => {
    let player = neuf();
    useGame.setState({ player });
    player = devient(player, (p) => { p.stats.tickets = 100; });
    expect(annoncer(true)).toBe(true);
    expect(aLEcran()).toEqual(["tickets:1"]);
    remettreAnnonce();
    expect(aLEcran()).toBeNull();
    expect(file()).toEqual(["tickets:1", "tickets:2"]);
    expect(annoncer(false)).toBe(false);
    expect(annoncer(true)).toBe(true);
    expect(aLEcran()).toEqual(["tickets:1"]);
    // Sans annonce à l'écran, rien à remettre.
    finAnnonce();
    remettreAnnonce();
    expect([aLEcran(), file()]).toEqual([null, ["tickets:2"]]);
  });

  it("rien pendant un grand moment : l'annonce attend que le rideau se lève", () => {
    expect(peutAnnoncer(LIBRE)).toBe(true);
    expect(peutAnnoncer({ ...LIBRE, welcome: true })).toBe(false);
    expect(peutAnnoncer({ ...LIBRE, ending: true })).toBe(false);
    expect(peutAnnoncer({ ...LIBRE, openings: ["cafe"] })).toBe(false);
    // La vraie fin est le plus grand des moments.
    expect(peutAnnoncer({ ...LIBRE, trueEnding: true })).toBe(false);
    for (const phase of ["amorce", "bienvenue", "panne"] as const) expect(peutAnnoncer({ ...LIBRE, phase })).toBe(false);

    // Un achat ouvre un lieu et fait gagner deux médailles : le lieu se présente d'abord.
    let player = neuf();
    player.owned = Array.from({ length: 9 }, (_, i) => `b${i}`);
    useGame.setState({ player });
    player = devient(player, (p) => { p.owned.push("b9"); p.standing = 25; });
    useGame.setState({ openings: ["cafe"] });
    expect(file()).toEqual(["collection:1", "voyage:1"]);
    expect(annoncer(peutAnnoncer(useGame.getState()))).toBe(false);
    expect(aLEcran()).toBeNull();
    expect(file()).toEqual(["collection:1", "voyage:1"]);
    // Le générique aussi passe avant.
    useGame.setState({ openings: [], ending: true });
    expect(annoncer(peutAnnoncer(useGame.getState()))).toBe(false);
    useGame.setState({ ending: false });
    expect(annoncer(peutAnnoncer(useGame.getState()))).toBe(true);
    expect(aLEcran()).toEqual(["collection:1"]);
  });

  it("une médaille ne s'annonce qu'une fois par session", () => {
    let player = neuf();
    player.stats.tickets = 9;
    useGame.setState({ player });
    player = devient(player, (p) => { p.stats.tickets = 10; });
    expect(annoncer(true)).toBe(true);
    finAnnonce();
    // L'appareil se recale sur un état plus ancien, puis retrouve le bon : pas de seconde annonce.
    player = devient(player, (p) => { p.stats.tickets = 9; });
    devient(player, (p) => { p.stats.tickets = 10; });
    expect(file()).toEqual([]);
  });

  it("devant la vitrine, ou quand le compte change, la file s'oublie", () => {
    let player = neuf();
    useGame.setState({ player });
    player = devient(player, (p) => { p.stats.tickets = 100; });
    expect(annoncer(true)).toBe(true);
    oublierAnnonces();
    expect([file(), aLEcran()]).toEqual([[], null]);
    // Un autre compte entre : ses médailles sont un premier état, rien n'est annoncé.
    devient(player, (p) => { p.stats.bestGain = 150; });
    expect(file()).toEqual(["gain:1"]);
    useGame.setState({ player: ancien("p_autrecompte00000") });
    expect([file(), aLEcran()]).toEqual([[], null]);
    // Et le compte s'en va (session fermée, compte supprimé) : rien non plus.
    useGame.setState({ player: null });
    expect([file(), aLEcran()]).toEqual([[], null]);
  });

  it("les 38 médailles peuvent tomber d'un coup sans rien casser : une seule annonce", () => {
    useGame.setState({ player: neuf("p_comble0000000000") });
    useGame.setState({ player: comble() });
    expect(file()).toHaveLength(38);
    expect(annoncer(true)).toBe(true);
    expect(aLEcran()).toHaveLength(38);
    expect(file()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("le dictionnaire anglais des trophées", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const dir = `${root}src/screens/trophees/`;
  const OTHERS: Record<string, string> = { ...EN_RECIT, ...EN_JEU, ...EN_BOUTIQUES, ...EN_TICKETS, ...EN_POKER };
  const entries = Object.entries(EN_TROPHEES).map(([fr, en]) => ({ fr, en }));

  /** Les phrases passées à t() dans un fichier source. */
  function keysOf(source: string): string[] {
    return [...source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`) as string);
  }

  function used(): string[] {
    const files = [...readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).map((f) => dir + f), `${root}src/app/trophees.ts`];
    return [...new Set(files.flatMap((file) => keysOf(readFileSync(file, "utf8"))))];
  }

  it("chaque phrase des écrans des trophées a sa traduction", () => {
    const keys = used();
    // Le relevé a bien trouvé les écrans.
    expect(keys.length).toBeGreaterThan(15);
    expect(keys).toContain("Trophées");
    expect(keys.filter((key) => !(key in EN_TROPHEES))).toEqual([]);
  });

  it("le dictionnaire ne garde aucune phrase que les écrans n'emploient plus", () => {
    const keys = new Set(used());
    expect(Object.keys(EN_TROPHEES).filter((key) => !keys.has(key))).toEqual([]);
  });

  it("t() trouve chaque phrase, et aucune ne contredit un autre dictionnaire", () => {
    setLang("en");
    expect(entries.filter((e) => t(e.fr) !== e.en).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => e.fr in OTHERS && OTHERS[e.fr] !== e.en).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => i18nMisses().includes(e.fr)).map((e) => e.fr)).toEqual([]);
  });

  it("une traduction emploie les variables de sa phrase française, toutes, et elles seules", () => {
    expect(entries.filter((e) => variables(e.en).join() !== variables(e.fr).join()).map((e) => `${e.fr} → ${e.en}`)).toEqual([]);
  });

  it("guillemets anglais, aucune traduction vide, pas d'espace à la française", () => {
    expect(entries.filter((e) => /[«»]/.test(e.en)).map((e) => e.en)).toEqual([]);
    expect(entries.filter((e) => e.en.trim() === "" || e.en !== e.en.trim()).map((e) => e.fr)).toEqual([]);
    expect(entries.filter((e) => /[\u00A0\u202F]| [!?;:]/.test(e.en)).map((e) => e.en)).toEqual([]);
  });

  it("aucun texte de la vitrine n'est figé à l'import : tout suit la langue du moment", () => {
    const player = comble();
    const page = (langue: Lang) => {
      setLang(langue);
      return TROPHIES.map((famille) => JSON.stringify(ficheDe(famille, player)));
    };
    const fr = page("fr");
    const en = page("en");
    expect(en.filter((fiche, i) => fiche === fr[i])).toEqual([]);
    expect(page("fr")).toEqual(fr);
    // Et rien n'est resté en français faute de traduction.
    setLang("en");
    for (const famille of TROPHIES) ficheDe(famille, player);
    expect(i18nMisses().filter((manque) => /m[ée]daille|troph[ée]e/i.test(manque))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("le poids : la vitrine n'est chargée qu'à la demande", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const lire = (file: string) => readFileSync(`${root}${file}`, "utf8");
  /** Les modules qu'un fichier importe pour de bon (les `import type` ne pèsent rien). */
  const imports = (source: string) =>
    [...source.matchAll(/^import\s+(?!type\b)[^;]*?from\s+"([^"]+)";/gm)].map((m) => m[1]!);

  /** Ce qui n'arrive qu'avec la vitrine : les dessins, les noms, l'écran, le carton de l'annonce. */
  const LOURD = /\/(art|textes|file|Trophees|Annonces?|index)$|screens\/trophees$/;

  it("ce qui reste au démarrage n'importe ni les dessins ni les noms", () => {
    for (const file of ["src/app/trophees.ts", "src/screens/trophees/Entree.tsx", "src/screens/trophees/Crieur.tsx"]) {
      expect([file, imports(lire(file)).filter((module) => LOURD.test(module))]).toEqual([file, []]);
    }
    // Le crieur va chercher de quoi annoncer quand il en a besoin, pas avant.
    expect(lire("src/screens/trophees/Crieur.tsx")).toMatch(/import\("\.\/index"\)/);
    // Et il ne pèse presque rien : quelques lignes, sans dessin ni minuterie.
    expect(lire("src/screens/trophees/Crieur.tsx").replace(/^\s*\/\/.*$/gm, "").length).toBeLessThan(1200);
  });

  it("la coquille et le Domaine ne montent que le crieur, l'entrée, et l'écran à la demande", () => {
    const app = lire("src/App.tsx");
    expect(app).toMatch(/lazy\(\(\) => (?:ouAbsent\()?import\("\.\/screens\/trophees"\)/);
    expect(imports(app).filter((module) => module.includes("trophees"))).toEqual(["./screens/trophees/Crieur"]);
    const domaine = lire("src/screens/domaine/Domaine.tsx");
    expect(imports(domaine).filter((module) => module.includes("trophees"))).toEqual(["../trophees/Entree"]);
  });

  it("le dictionnaire chargé au démarrage ne porte que les mots de l'interface, pas les 38 noms", () => {
    const values = Object.values(EN_TROPHEES);
    const noms = FAMILLES.flatMap((id) => [TEXTES[id].nom.en, ...TEXTES[id].medailles.map((m) => m.en)]);
    expect(noms.filter((nom) => values.includes(nom))).toEqual([]);
    expect(Object.keys(EN_TROPHEES).length).toBeLessThan(30);
  });
});
