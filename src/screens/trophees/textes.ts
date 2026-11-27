// Les mots des trophées, en français et en anglais : le nom de chaque objet de la vitrine,
// la phrase qui dit ce qu'il compte, et le nom de chaque médaille (treize familles,
// quarante-deux médailles).
//
// Ce module n'est chargé qu'avec la vitrine (ou avec la première annonce de médaille) : les
// deux langues y sont côte à côte, comme les répliques des personnages, pour que rien de
// tout cela ne pèse sur le démarrage du jeu. Rien n'est figé à l'import : tout se lit dans
// la langue courante, au moment de l'affichage. Les phrases d'interface de la vitrine et de
// l'annonce, elles, passent par `t()` : leur anglais est en bas de ce fichier, et rejoint
// les dictionnaires du jeu quand ce morceau arrive (`addEnglish`).
//
// Deux trophées gardent leur secret : `legende` tant qu'il n'est pas gagné, `maitres` tant
// que les huit défis ne sont pas relevés. Ils ne livrent alors ni nom, ni phrase, ni
// palier. Deux autres, `semeur` et `mecene`, intriguent sans rien dire tant que le Kiosque
// n'est pas au joueur : ils montrent leur objet et leur nom, pas ce qu'ils comptent.

import { formatEuros, formatInt } from "../../../shared/format";
import { medalId, progressOf, trophyById, type TrophyFamily, type TrophyId, type TrophyProgress } from "../../../shared/trophies";
import type { PlayerState } from "../../../shared/types";
import { addEnglish, lang, type Lang } from "../../i18n";

type Deux = Record<Lang, string>;

interface Texte {
  /** L'objet exposé dans la vitrine. */
  nom: Deux;
  /** Ce que la famille compte. */
  phrase: Deux;
  /** À la place de la phrase, tant que le trophée ne se dévoile pas. */
  voile?: Deux;
  /** Le nom de chaque médaille, du premier palier au dernier. */
  medailles: readonly Deux[];
  /** Ce qu'il faut pour une médaille ; `{n}` est le palier. */
  palier: Deux;
  /** La même chose quand le palier vaut 1. */
  un?: Deux;
  /** La même chose pour le dernier palier, quand il demande tout. */
  tout?: Deux;
}

export const TEXTES: Record<TrophyId, Texte> = {
  tickets: {
    nom: { fr: "La Pièce à gratter", en: "The Scratching Coin" },
    phrase: {
      fr: "Tous les tickets joués, achetés ou ramassés par terre.",
      en: "Every ticket you've played, bought or found on the ground.",
    },
    medailles: [
      { fr: "Gratteur du dimanche", en: "Sunday Scratcher" },
      { fr: "Ongle verni", en: "Up to Scratch" },
      { fr: "Démangeaison chronique", en: "Itching for More" },
      { fr: "Poignet d'acier", en: "Wrist of Steel" },
      { fr: "Ongle d'or", en: "The Golden Fingernail" },
    ],
    palier: { fr: "{n} tickets joués", en: "{n} tickets played" },
  },
  gain: {
    nom: { fr: "Le Chèque géant", en: "The Giant Cheque" },
    phrase: { fr: "Ton plus gros gain sur un seul ticket.", en: "Your biggest win on a single ticket." },
    medailles: [
      { fr: "Argent de poche", en: "Pocket Money" },
      { fr: "Joli pactole", en: "A Tidy Sum" },
      { fr: "Sept chiffres", en: "Seven Figures" },
      { fr: "Le coffre ne ferme plus", en: "The Safe Won't Shut" },
      { fr: "Trop de zéros", en: "Too Many Noughts" },
      { fr: "Il faut un plus gros chèque", en: "We'll Need a Bigger Cheque" },
    ],
    palier: { fr: "{n} sur un seul ticket", en: "{n} on a single ticket" },
  },
  jackpots: {
    nom: { fr: "La Cloche du jackpot", en: "The Jackpot Bell" },
    phrase: { fr: "Elle sonne à chaque jackpot que tu décroches.", en: "It rings for every jackpot you land." },
    medailles: [
      { fr: "Coup de bol", en: "Beginner's Luck" },
      { fr: "Main heureuse", en: "Lucky Streak" },
      { fr: "La cloche n'en peut plus", en: "The Bell Needs a Holiday" },
    ],
    palier: { fr: "{n} jackpots", en: "{n} jackpots" },
    un: { fr: "1 jackpot", en: "1 jackpot" },
  },
  semeur: {
    nom: { fr: "La Poche trouée", en: "The Holey Pocket" },
    phrase: {
      fr: "Les tickets que tu laisses tomber pour les nouveaux venus.",
      en: "The tickets you drop on the ground for the newcomers.",
    },
    voile: {
      fr: "Une poche trouée, exposée comme un trésor. Gaspard change de sujet quand on lui en parle.",
      en: "A pocket with a hole in it, displayed like a treasure. Gaspard changes the subject when you bring it up.",
    },
    medailles: [
      { fr: "Tête en l'air", en: "Butterfingers" },
      { fr: "Deux mains gauches", en: "All Thumbs" },
      { fr: "Maladresse professionnelle", en: "Professionally Clumsy" },
      { fr: "Petit Poucet", en: "Trail of Breadcrumbs" },
      { fr: "Il pleut des tickets", en: "It's Raining Tickets" },
    ],
    palier: { fr: "{n} tickets laissés tomber", en: "{n} tickets dropped" },
    un: { fr: "1 ticket laissé tomber", en: "1 ticket dropped" },
  },
  mecene: {
    nom: { fr: "La Corne d'abondance", en: "The Horn of Plenty" },
    phrase: {
      fr: "La valeur de tous les tickets que tu as laissés tomber.",
      en: "What all the tickets you've dropped were worth.",
    },
    voile: {
      fr: "Elle déborde, mais pour qui ? À Grattouille, les grandes fortunes ont de drôles d'habitudes.",
      en: "It overflows, but for whom? In Grattouille, great fortunes have peculiar habits.",
    },
    medailles: [
      { fr: "Bon prince", en: "A Good Sort" },
      { fr: "Le cœur sur la patte", en: "Big-Hearted Beast" },
      { fr: "Mécène à ses heures", en: "Part-Time Philanthropist" },
      { fr: "La bonne fée du quai", en: "Fairy Godmother of the Quay" },
    ],
    palier: { fr: "{n} de tickets laissés tomber", en: "{n} worth of tickets dropped" },
  },
  collection: {
    nom: { fr: "Le Cintre d'or", en: "The Golden Hanger" },
    phrase: {
      fr: "Les biens que tu possèdes, des chapeaux aux résidences.",
      en: "The items you own, from hats to residences.",
    },
    medailles: [
      { fr: "Lèche-vitrines", en: "Window-Shopper" },
      { fr: "Panier percé", en: "Big Spender" },
      { fr: "Rupture de stock", en: "Bought the Lot" },
    ],
    palier: { fr: "{n} biens à toi", en: "{n} items to your name" },
  },
  voyage: {
    nom: { fr: "La Valise aux étiquettes", en: "The Stickered Suitcase" },
    phrase: {
      fr: "Les lieux qui t'ont ouvert leurs portes, jusqu'à la Lune.",
      en: "The places that have let you in, all the way to the Moon.",
    },
    medailles: [
      { fr: "Promenade digestive", en: "Day-Tripper" },
      { fr: "La Promenade par cœur", en: "Knows the Prom by Heart" },
      { fr: "Dans la Lune", en: "Over the Moon" },
    ],
    palier: { fr: "{n} lieux ouverts", en: "{n} places open" },
  },
  experiences: {
    nom: { fr: "La Boule à neige", en: "The Snow Globe" },
    phrase: {
      fr: "Les expériences vécues à l'Agence Carpe Diem.",
      en: "The experiences you've lived at the Carpe Diem Agency.",
    },
    medailles: [
      { fr: "Jour cueilli", en: "Day Seized" },
      { fr: "Jamais à la maison", en: "Never at Home" },
      { fr: "La vie en grand", en: "Living Large" },
      { fr: "Comme une carpe dans l'eau", en: "Hook, Line and Sinker" },
    ],
    palier: { fr: "{n} expériences vécues", en: "{n} experiences lived" },
    un: { fr: "1 expérience vécue", en: "1 experience lived" },
    tout: { fr: "Les {n} expériences, toutes vécues", en: "All {n} experiences lived" },
  },
  patron: {
    nom: { fr: "Les Clés du Kiosque", en: "The Keys to the Kiosk" },
    phrase: {
      fr: "Racheter le Kiosque de Gaspard, en bas de la Promenade.",
      en: "Buy Gaspard's Kiosk, at the very bottom of the Promenade.",
    },
    medailles: [{ fr: "Appelez-moi Patron", en: "Call Me Boss" }],
    palier: { fr: "Le Kiosque est à toi", en: "The Kiosk is yours" },
  },
  defis: {
    nom: { fr: "Le Gant relevé", en: "The Gauntlet" },
    phrase: {
      fr: "Les hôtes battus à leur propre défi, au Poker Tricheur.",
      en: "Hosts beaten at their own challenge, at Cheater's Poker.",
    },
    medailles: [
      { fr: "Même pas peur", en: "Bring It On" },
      { fr: "Terreur des tapis verts", en: "Terror of the Green Baize" },
      { fr: "Du jamais vu à Grattouille", en: "Unheard Of in Grattouille" },
    ],
    palier: { fr: "{n} défis relevés", en: "{n} challenges won" },
    un: { fr: "1 défi relevé", en: "1 challenge won" },
  },
  limier: {
    nom: { fr: "La Loupe du limier", en: "The Sleuth's Glass" },
    phrase: {
      fr: "Les tricheurs que tu as démasqués au Poker Tricheur.",
      en: "The cheaters you've unmasked at Cheater's Poker.",
    },
    medailles: [
      { fr: "Œil de lynx", en: "Eagle Eye" },
      { fr: "Flair de limier", en: "Nose of a Bloodhound" },
      { fr: "Brigade des manches", en: "The Sleeve Squad" },
    ],
    palier: { fr: "{n} tricheurs démasqués", en: "{n} cheaters unmasked" },
    un: { fr: "1 tricheur démasqué", en: "1 cheater unmasked" },
  },
  maitres: {
    nom: { fr: "La Coupe des Maîtres", en: "The Masters' Cup" },
    phrase: {
      fr: "Remporter la Table des Maîtres, face à quatre hôtes.",
      en: "Win the Masters' Table, against four of the hosts.",
    },
    voile: { fr: "Sous le drap, quelque chose brille. On verra bien.", en: "Something glints under the cloth. We'll see." },
    medailles: [{ fr: "Maître des Maîtres", en: "Master of Masters" }],
    palier: { fr: "Une victoire à la Table des Maîtres", en: "One win at the Masters' Table" },
  },
  legende: {
    nom: { fr: "Les Huit As de cœur", en: "Eight Aces of Hearts" },
    phrase: {
      fr: "Tu sais comment on se reconnaît, à Grattouille.",
      en: "You know how we recognise one another in Grattouille.",
    },
    voile: { fr: "Celui-là, personne n'en parle. Pas encore.", en: "Nobody talks about this one. Not yet." },
    medailles: [{ fr: "Le neuvième as", en: "The Ninth Ace" }],
    palier: { fr: "La vraie fin de l'histoire", en: "The story's true ending" },
  },
};

/** Ce qui s'écrit à la place d'un nom que le jeu garde pour lui. */
export const SECRET = "???";

/**
 * Ce qu'un trophée laisse voir. `ouvert` : tout. `intrigue` : son objet et son nom, pas
 * ce qu'il compte. `mystere` : rien, pas même son nom.
 */
export type Voile = "ouvert" | "intrigue" | "mystere";

export function voileDe(famille: TrophyId, player: PlayerState): Voile {
  // Une médaille gagnée dévoile toujours son trophée.
  if (progressOf(player, famille).earned > 0) return "ouvert";
  if (famille === "legende") return "mystere";
  // La Table des Maîtres n'existe, pour le joueur, qu'une fois tous les défis relevés.
  if (famille === "maitres") return progressOf(player, "defis").next === null ? "ouvert" : "mystere";
  // Laisser tomber des tickets : on n'en parle qu'au Patron.
  if (famille === "semeur" || famille === "mecene") return player.kiosk ? "ouvert" : "intrigue";
  return "ouvert";
}

function dire(texte: Deux): string {
  return texte[lang()];
}

/** « La Pièce à gratter » ; « ??? » pour un trophée mystère. */
export function nomFamille(famille: TrophyId, voile: Voile = "ouvert"): string {
  return voile === "mystere" ? SECRET : dire(TEXTES[famille].nom);
}

/** Ce que la famille compte ; ou de quoi intriguer, tant qu'elle ne se dévoile pas. */
export function phraseFamille(famille: TrophyId, voile: Voile = "ouvert"): string {
  const texte = TEXTES[famille];
  return dire(voile === "ouvert" ? texte.phrase : texte.voile ?? texte.phrase);
}

/** « tickets:3 » : la famille et le rang (à partir de 1), ou `null` pour une médaille inconnue. */
export function lireMedaille(medaille: string): { famille: TrophyFamily; rang: number } | null {
  const [id, rang] = medaille.split(":");
  const famille = trophyById(id ?? "");
  const n = Number(rang);
  return famille && Number.isInteger(n) && n >= 1 && n <= famille.tiers.length ? { famille, rang: n } : null;
}

/** « Gratteur du dimanche » ; « ??? » tant que le trophée ne se dévoile pas. */
export function nomMedaille(medaille: string, voile: Voile = "ouvert"): string {
  const lue = lireMedaille(medaille);
  if (!lue || voile !== "ouvert") return SECRET;
  return dire(TEXTES[lue.famille.id].medailles[lue.rang - 1]!);
}

/** Ce qu'il faut pour cette médaille : « 500 tickets joués », « 1 M€ sur un seul ticket ». Rien tant que le trophée ne se dévoile pas. */
export function phraseMedaille(medaille: string, voile: Voile = "ouvert"): string {
  const lue = lireMedaille(medaille);
  if (!lue || voile !== "ouvert") return "";
  const palier = lue.famille.tiers[lue.rang - 1]!;
  // Le dernier palier d'une famille qui demande tout le dit : « Les 30 expériences, toutes vécues ».
  const tout = lue.rang === lue.famille.tiers.length ? TEXTES[lue.famille.id].tout : undefined;
  return tout ? dire(tout).replace("{n}", ecrire(lue.famille, palier)) : compteDe(lue.famille, palier);
}

/** Une valeur de la famille : un montant en euros, ou un nombre. */
export function ecrire(famille: TrophyFamily, valeur: number): string {
  return famille.unit === "euros" ? formatEuros(valeur) : formatInt(valeur);
}

/** Une valeur de la famille, avec ce qu'elle compte : « 6 204 tickets joués », « 1 jackpot ». */
export function compteDe(famille: TrophyFamily, valeur: number): string {
  const texte = TEXTES[famille.id];
  return dire(valeur === 1 && texte.un ? texte.un : texte.palier).replace("{n}", ecrire(famille, valeur));
}

export interface FicheMedaille {
  id: string;
  rang: number;
  gagnee: boolean;
  nom: string;
  phrase: string;
}

/** Tout ce que la vitrine montre d'une famille, pour ce joueur : rien de plus n'est affiché. */
export interface Fiche {
  famille: TrophyFamily;
  voile: Voile;
  nom: string;
  phrase: string;
  medailles: FicheMedaille[];
  progres: TrophyProgress;
}

export function ficheDe(famille: TrophyFamily, player: PlayerState): Fiche {
  const voile = voileDe(famille.id, player);
  const progres = progressOf(player, famille.id);
  return {
    famille,
    voile,
    nom: nomFamille(famille.id, voile),
    phrase: phraseFamille(famille.id, voile),
    medailles: famille.tiers.map((_, i) => {
      const id = medalId(famille.id, i + 1);
      return { id, rang: i + 1, gagnee: i < progres.earned, nom: nomMedaille(id, voile), phrase: phraseMedaille(id, voile) };
    }),
    progres,
  };
}

// ---------------------------------------------------------------------------
// L'anglais des phrases d'interface de la vitrine et de l'annonce.
// Clé : la phrase française telle qu'elle est passée à `t()`. Valeur : sa traduction.
// (Celles de l'entrée du Domaine, chargée au démarrage, sont dans src/i18n/en/trophees.ts.)

export const EN_VITRINE: Record<string, string> = {
  // --- La vitrine
  "Médailles gagnées": "Medals earned",
  "Médailles gagnées : {n} sur {total}": "Medals earned: {n} of {total}",
  "{n} nouvelles médailles à admirer": "{n} new medals to admire",
  "1 nouvelle médaille à admirer": "1 new medal to admire",
  "Médailles à découvrir": "Medals yet to be discovered",
  "{nom}, gagnée : {condition}": "{nom}, earned: {condition}",
  "{nom}, à gagner : {condition}": "{nom}, yet to earn: {condition}",
  "gagnée": "earned",
  "à gagner": "to earn",
  "nouvelle !": "new!",
  "{valeur} sur {palier}": "{valeur} of {palier}",

  // --- L'annonce d'une médaille
  "Nouvelle médaille": "New medal",
  "Nouvelle médaille : {nom}. Voir les trophées": "New medal: {nom}. See the trophies",
  "D'un seul coup": "All at once",
  "{n} nouvelles médailles": "{n} new medals",
  "{n} nouvelles médailles. Voir les trophées": "{n} new medals. See the trophies",
};

addEnglish(EN_VITRINE);
