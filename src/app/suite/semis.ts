// Les tickets semés (LOT4.md, section 3) : qui les trouve, et ce qu'ils deviennent.
//
// Devenu Patron, le joueur laisse tomber des tickets pour ceux qui débarquent sans rien.
// Chaque ticket semé est trouvé par un nouveau venu : une des huit espèces du jeu, un
// prénom, des hardes, et une phrase pour dire sa chance. Plus le ticket est cher, moins
// il en revient. À mesure que le Patron sème, des protégés donnent de leurs nouvelles :
// ils entrent au Grand Café, gagnent au Casino… jusqu'à la Lune, et jusqu'au premier
// d'entre eux, qui laisse tomber un ticket à son tour.
//
// Rien n'est enregistré : tout se déduit du rang du ticket semé (`stats.sown`). Le même
// rang rend toujours le même nouveau venu, la même phrase, les mêmes nouvelles.
//
// Conventions, celles de src/app/dialogues.ts : les deux langues côte à côte, de même
// forme ; 110 caractères au plus par réplique, une idée par réplique ; rien n'est figé à
// l'import. Les nouveaux venus parlent d'eux sans accord : ils sont de tous les genres.
// Ce module n'est chargé qu'avec les écrans qui s'en servent (src/screens/semis).

import { formatEuros } from "../../../shared/format";
import { SPECIES, type SpeciesId } from "../../../shared/rules";
import { ticketById } from "../../../shared/tickets";
import type { PlaceId } from "../../../shared/types";
import { pick, type Lang } from "../../i18n";
import { ticketName } from "../../i18n/noms";

type Deux<T> = Record<Lang, T>;

/** Ce qu'un personnage porte : des identifiants du catalogue, pour l'avatar. */
export type Hardes = Partial<Record<"chapeau" | "lunettes" | "tenue" | "accessoire", string>>;

export interface NouveauVenu {
  /** Le rang du ticket semé qu'il a trouvé, à partir de 1. */
  rang: number;
  prenom: string;
  espece: SpeciesId;
  hardes: Hardes;
}

// ---------------------------------------------------------------------------
// Qui débarque

/** Quarante prénoms de bord de mer. Ils ne se traduisent pas : on est à Grattouille-les-Bains. */
const PRENOMS: readonly string[] = [
  "Léon", "Lucette", "Marius", "Josette", "Fernand", "Odile", "Gédéon", "Paulette", "Anatole", "Ginette",
  "Barnabé", "Suzon", "Félix", "Mirabelle", "Honoré", "Capucine", "Lazare", "Noémie", "Ernest", "Violette",
  "Basile", "Margot", "Octave", "Zélie", "Firmin", "Clémence", "Isidore", "Yvonne", "Achille", "Rosalie",
  "Théophile", "Manon", "Aristide", "Perrine", "Blaise", "Louison", "Edmond", "Apolline", "Jules", "Bertille",
];

/** Ce qu'on a sur le dos en débarquant sans un sou : les quatre premiers articles de Mlle Sidonie, ou rien. */
const HARDES: readonly Hardes[] = [
  { chapeau: "chapeau-journal" },
  { tenue: "sac-a-patates" },
  { accessoire: "ficelle" },
  { chapeau: "chapeau-journal", tenue: "sac-a-patates" },
  { lunettes: "lunettes-carton", accessoire: "ficelle" },
  {},
  { tenue: "sac-a-patates", accessoire: "ficelle" },
  { lunettes: "lunettes-carton" },
];

function entier(x: number): number {
  return Number.isFinite(x) && x >= 1 ? Math.floor(x) : 1;
}

/**
 * Le nouveau venu qui trouve le ticket semé de rang `rang`. Le rang décide de tout : pas
 * de hasard, donc le même visage chaque fois qu'on y revient. D'un rang au suivant,
 * l'espèce et le prénom changent toujours (les pas sont choisis pour cela).
 */
export function nouveauVenu(rang: number): NouveauVenu {
  const r = entier(rang);
  // Tous les huit rangs, le tour décale l'espèce et les hardes : un prénom qui revient,
  // quarante tickets plus tard, n'est plus porté par le même animal.
  const tour = Math.floor(r / 8);
  return {
    rang: r,
    prenom: PRENOMS[(r * 7) % PRENOMS.length]!,
    espece: SPECIES[(r * 3 + tour) % SPECIES.length]!,
    hardes: HARDES[(r * 5 + tour) % HARDES.length]!,
  };
}

/** Cinq ou dix tickets d'un coup : la petite foule, du rang `premier` aux suivants. */
export function foule(premier: number, qty: number): NouveauVenu[] {
  const debut = entier(premier);
  return Array.from({ length: Math.max(1, Math.floor(qty)) }, (_, i) => nouveauVenu(debut + i));
}

// ---------------------------------------------------------------------------
// Ce qu'ils disent : six phrases par lieu, du ticket à 1 € au ticket de la Lune.
// `{prix}` : le prix du ticket trouvé ; `{ticket}` : son nom.

const REPLIQUES: Record<PlaceId, Deux<readonly string[]>> = {
  kiosque: {
    fr: [
      "Un ticket à {prix} ! De quoi m'offrir un café. Enfin, si je gagne. Et si on me prête une pièce pour gratter.",
      "Par terre, comme ça, sans prévenir ? Je débarque depuis deux minutes. Cette ville me plaît déjà.",
      "{ticket} ! Je n'avais rien, et me voilà avec quelque chose. Ça change tout, quelque chose.",
      "Un ticket ! Les mouettes le regardaient aussi. J'ai couru plus vite. Ma première victoire ici.",
      "{prix}, tombé du ciel ! Hier, je n'avais pas de quoi m'offrir une ficelle. Aujourd'hui, j'ai un ticket.",
      "Quelqu'un a les poches trouées, par ici. Je ne sais pas qui c'est, mais je l'aime déjà beaucoup.",
    ],
    en: [
      "A {prix} ticket! That's a coffee, right there. Well, if I win. And if someone lends me a coin to scratch it.",
      "Just lying there, no warning? I've been ashore two minutes. I like this town already.",
      "{ticket}! I had nothing, and now I have something. It changes everything, something.",
      "A ticket! The seagulls had their eye on it too. I ran faster. My first win in this town.",
      "{prix}, out of the blue! Yesterday I couldn't afford a piece of string. Today, I've got a ticket.",
      "Somebody round here has holes in their pockets. I don't know who, but I like them a lot already.",
    ],
  },
  cafe: {
    fr: [
      "{prix} par terre ! Chez moi, à ce prix-là, on se baisse deux fois : une pour ramasser, une pour vérifier.",
      "Un ticket à {prix} ? Je cherchais juste un verre d'eau. Me voilà presque dans les affaires.",
      "{ticket}. Je ne connais pas les règles. Je sens que je vais les aimer.",
      "Pas un sou en poche, mais un ticket à {prix} dans la patte. On commence à me dire bonjour.",
      "Il traînait là, tout seul. J'ai demandé à qui il était. Une loutre m'a répondu : au vent du large.",
      "{prix} ! De quoi tenir en terrasse jusqu'au soir. Je vais gratter très, très lentement.",
    ],
    en: [
      "{prix} on the ground! Where I'm from, at that price, you bend down twice: once to grab it, once to check.",
      "A {prix} ticket? I only wanted a glass of water. Now I'm practically in business.",
      "{ticket}. I don't know the rules. I have a feeling I'm going to like them.",
      "Not a penny in my pocket, but a {prix} ticket in my paw. People have started saying good morning.",
      "It was lying there all alone. I asked whose it was. An otter told me: the sea breeze's.",
      "{prix}! Enough to stay on the terrace till evening. I shall scratch very, very slowly.",
    ],
  },
  casino: {
    fr: [
      "{prix} ?! J'ai relu trois fois. Puis j'ai compté les zéros sur mes doigts. Il m'en reste, des doigts.",
      "Un ticket à {prix}, par terre. Chez moi, on appelle ça un héritage.",
      "Je débarque sans un sou et je trouve {prix}. Il doit y avoir une erreur. Ne la corrigez surtout pas.",
      "{ticket} ! Un héron à visière m'a vu le ramasser. Il a levé un sourcil. Chez lui, c'est un bravo.",
      "{prix} ! Je n'ose pas le gratter. Je vais d'abord le regarder un jour ou deux.",
      "J'ai regardé autour de moi : personne ne le cherchait. Drôle de ville. Belle ville.",
    ],
    en: [
      "{prix}?! I read it three times. Then I counted the zeros on my fingers. I had fingers to spare.",
      "A {prix} ticket, on the ground. Back home, we call that an inheritance.",
      "I step ashore without a penny and find {prix}. There must be some mistake. Please don't fix it.",
      "{ticket}! A heron in a visor saw me pick it up. He raised an eyebrow. From him, that's applause.",
      "{prix}! I daren't scratch it. I'll just look at it for a day or two first.",
      "I looked around: nobody was searching for it. Funny town. Lovely town.",
    ],
  },
  salon: {
    fr: [
      "{prix}. Par terre. J'ai dû m'asseoir à côté, le temps de reprendre mon souffle.",
      "Un ticket à {prix} ! Je n'ai pas de poche assez digne. Je le tiens à deux pattes.",
      "{prix} ? Ce matin, toute ma fortune tenait dans un mouchoir. Et le mouchoir était prêté.",
      "Je cherchais un banc pour la nuit. J'ai trouvé {ticket}. Le banc attendra.",
      "Un bouledogue en smoking a trouvé ça d'un commun. Puis il a reniflé. Je crois qu'il était content pour moi.",
      "Quelqu'un a perdu {prix}, et personne ne court après. Ici, on doit perdre exprès.",
    ],
    en: [
      "{prix}. On the ground. I had to sit down beside it until I got my breath back.",
      "A {prix} ticket! I haven't a pocket worthy of it. I'm holding it in both paws.",
      "{prix}? This morning my whole fortune fitted in a handkerchief. And the handkerchief was borrowed.",
      "I was looking for a bench for the night. I found {ticket}. The bench can wait.",
      "A bulldog in a dinner jacket called it common. Then he sniffed. I think he was pleased for me.",
      "Somebody has lost {prix}, and nobody is chasing after it. They must lose things on purpose here.",
    ],
  },
  cercle: {
    fr: [
      "{prix}. J'ai demandé à un morse si c'était une blague. Sa moustache a frémi. Je crois que non.",
      "Je ne savais pas qu'un ticket pouvait valoir {prix}. Ni qu'un ticket pareil pouvait traîner par terre.",
      "{prix} ! Je vais m'évanouir. Mais poliment : il y a du monde.",
      "J'ai débarqué avec une valise vide. Me voilà avec {ticket}. La valise n'en revient pas.",
      "Des millions, par terre, à minuit. Je l'ai ramassé avant de me réveiller. On ne sait jamais.",
      "{prix}… Vous qui l'avez laissé tomber, qui que vous soyez : je vous garde une part. Une grosse.",
    ],
    en: [
      "{prix}. I asked a walrus whether it was a joke. His moustache quivered. I believe not.",
      "I never knew a ticket could be worth {prix}. Or that a ticket like that could be lying on the ground.",
      "{prix}! I am going to faint. But politely: there are people about.",
      "I came ashore with an empty suitcase. Now I have {ticket}. The suitcase is speechless.",
      "Millions, on the ground, at midnight. I picked it up before I could wake up. You never know.",
      "{prix}… Whoever you are, you who dropped it: I'm keeping you a share. A big one.",
    ],
  },
  yacht: {
    fr: [
      "{prix}. Je relis, pour être sûr de mes yeux : {prix}. Non, ça ne passe toujours pas.",
      "Un pélican en casquette m'a salué. Moi ! Pour un ticket à {prix}. Je garde le ticket. Et le salut.",
      "Je n'avais jamais vu autant de zéros d'un coup. Ils ne tiennent pas tous devant : il y en a au dos.",
      "{prix} ! Ce matin, je ne possédais que mon ombre. Et encore : à midi, elle rétrécit.",
      "{ticket}, entre deux mouettes. Elles montaient la garde. Ou elles attendaient leur tour.",
      "On m'avait dit : à Grattouille, regarde par terre. Je croyais que c'était à cause des flaques.",
    ],
    en: [
      "{prix}. Let me read that again, to be sure of my eyes: {prix}. No, it still won't go in.",
      "A pelican in a cap saluted me. Me! Over a {prix} ticket. I'm keeping the ticket. And the salute.",
      "I'd never seen so many zeros at once. They don't all fit on the front: some are on the back.",
      "{prix}! This morning, all I owned was my shadow. And even that shrinks at noon.",
      "{ticket}, between two seagulls. They were standing guard. Or waiting their turn.",
      "They told me: in Grattouille, look down. I thought it was because of the puddles.",
    ],
  },
  banque: {
    fr: [
      "{prix}. Une taupe à lunettes m'a tendu un reçu à signer. En trois exemplaires. Pour un ticket trouvé !",
      "Des milliards, par terre, avant l'aube. Chut : je crois que les autres dorment encore.",
      "{prix} ! J'ai voulu le rendre. Personne n'en voulait. Quelle drôle de banque.",
      "Je n'ai pas de chaussures, et je tiens {prix} dans ma patte. Je vais commencer par les chaussures.",
      "{ticket}. Je ne comprends pas le titre. Le prix, encore moins. Je garde les deux.",
      "Hier, ma fortune tenait dans un dé à coudre. Aujourd'hui, {prix}. Il va me falloir un autre dé.",
    ],
    en: [
      "{prix}. A mole in spectacles handed me a receipt to sign. In triplicate. For a ticket I found!",
      "Billions, on the ground, before dawn. Shh: I think everyone else is still asleep.",
      "{prix}! I tried to hand it in. Nobody would take it. What a peculiar bank.",
      "I've no shoes, and I'm holding {prix} in my paw. I think I'll start with the shoes.",
      "{ticket}. I don't understand the title. The price, even less. I'm keeping both.",
      "Yesterday my fortune fitted in a thimble. Today, {prix}. I shall need another thimble.",
    ],
  },
  lune: {
    fr: [
      "{prix}. Non. Si ? Non. Laissez-moi m'asseoir. Par terre, tiens : c'est là que tout arrive.",
      "Un ticket de la Lune. À moi, qui n'ai jamais grimpé plus haut qu'un tabouret.",
      "{prix} ?! Ce matin, je n'avais rien. Ce soir, j'ai plus de zéros que d'amis. Ça va s'arranger : je partage.",
      "Il est tombé de la Lune, je ne vois que ça. Merci, la Lune. Merci, qui que vous soyez, là-haut ou en bas.",
      "{ticket}. Je ne le gratte pas tout de suite. D'abord, me souvenir de la tête que je fais.",
      "Je débarque. Je n'ai pas un sou. J'ai {prix}. Les trois phrases sont vraies. Je ne m'en remets pas.",
    ],
    en: [
      "{prix}. No. Really? No. Let me sit down. On the ground, why not: that's where it all happens.",
      "A ticket from the Moon. Mine. And I've never climbed anything higher than a stool.",
      "{prix}?! This morning I had nothing. Tonight I've more zeros than friends. That'll change: I'm sharing.",
      "It fell from the Moon, it must have. Thank you, Moon. Thank you, whoever you are, up there or down here.",
      "{ticket}. I shan't scratch it just yet. First I want to remember the look on my face.",
      "I've just landed. I haven't a penny. I have {prix}. All three are true. I may never get over it.",
    ],
  },
};

/**
 * La petite foule : neuf phrases, dites par le premier pour tous les autres. `{n}` : combien
 * ils sont ; `{prix}` : le prix d'un ticket. (Neuf, et non huit : de dix en dix comme de
 * cinq en cinq, on les entend toutes avant d'en réentendre une.)
 */
const FOULE: Deux<readonly string[]> = {
  fr: [
    "Il y en a pour tout le monde ! Ne poussez pas : aujourd'hui, c'est le quai qui régale.",
    "On était {n} sur le bateau, sans un sou à nous tous. On est {n} sur le quai, un ticket chacun.",
    "{n} tickets par terre ! On s'est regardés. Personne n'a osé y croire en premier.",
    "On ne se connaissait pas. On a ramassé chacun le sien. Maintenant, on se tutoie.",
    "Un ticket chacun, et pas une dispute. Même les mouettes n'en reviennent pas.",
    "On a cru à une blague. Puis à un piège. Puis on a compté : {n} tickets, {n} débarqués.",
    "C'est bien la première fois qu'on fait la queue pour se baisser.",
    "{n} tickets à {prix} ! On va gratter ensemble, en rang, sur le parapet.",
    "On voulait remercier quelqu'un. Il n'y a personne. Alors on dit merci au quai. Merci, le quai.",
  ],
  en: [
    "There's one for everybody! No pushing: today, the quay is buying.",
    "There were {n} of us on the boat, without a penny between us. Now we're {n} on the quay, a ticket each.",
    "{n} tickets on the ground! We looked at each other. Nobody dared believe it first.",
    "We'd never met. We each picked one up. Now we're on first-name terms.",
    "A ticket each, and not one squabble. Even the seagulls can't believe it.",
    "We thought it was a joke. Then a trap. Then we counted: {n} tickets, {n} of us.",
    "It's the first time any of us has queued up to bend down.",
    "{n} tickets at {prix}! We're going to scratch them together, in a row, on the sea wall.",
    "We wanted to thank someone. There's nobody here. So we're thanking the quay. Thank you, quay.",
  ],
};

function remplir(texte: string, vars: Record<string, string | number>): string {
  return texte.replace(/\{(\w+)\}/g, (tout, nom: string) => (nom in vars ? String(vars[nom]) : tout));
}

/** Le lieu d'un ticket : c'est lui qui donne le ton. Un ticket inconnu parle comme au Kiosque. */
function lieuDe(type: string): PlaceId {
  return ticketById(type)?.place ?? "kiosque";
}

function variables(type: string): Record<string, string> {
  return { prix: formatEuros(ticketById(type)?.price ?? 1), ticket: ticketName(type) };
}

/** Ce que dit le nouveau venu de rang `rang` en trouvant ce ticket. D'un rang au suivant, la phrase change. */
export function ditLeNouveauVenu(rang: number, type: string): string {
  const liste = pick(REPLIQUES[lieuDe(type)]);
  return remplir(liste[entier(rang) % liste.length]!, variables(type));
}

/** Ce que dit la petite foule qui trouve `qty` tickets d'un coup, par la voix du premier. */
export function ditLaFoule(premier: number, qty: number, type: string): string {
  const liste = pick(FOULE);
  // De carnet en carnet (cinq par cinq), la phrase avance d'un cran ; de dix en dix, de deux.
  return remplir(liste[Math.floor(entier(premier) / 5) % liste.length]!, { ...variables(type), n: Math.max(1, Math.floor(qty)) });
}

// ---------------------------------------------------------------------------
// Les protégés : huit paliers, huit nouvelles

/** À tant de tickets semés, un protégé donne de ses nouvelles. */
export const PALIERS: readonly number[] = [1, 3, 8, 15, 30, 60, 120, 250];

interface Etape {
  /** D'où il écrit. Le dernier écrit du quai : il vient d'y laisser tomber un ticket. */
  lieu: PlaceId;
  /** Le rang du ticket qu'il avait trouvé : toujours un ancien, il a eu le temps de faire son chemin. */
  rang: number;
  /** Ce qu'il porte, maintenant que la chance a tourné. */
  tenue: Hardes;
  texte: Deux<string>;
}

const ETAPES: Record<number, Etape> = {
  1: {
    lieu: "cafe",
    rang: 1,
    tenue: { chapeau: "beret", tenue: "mariniere" },
    texte: {
      fr: "J'ai gratté : gagné ! Me voilà en terrasse au Grand Café, une citronnade devant moi. La première que je paie de ma vie.",
      en: "I scratched it: I won! I'm on the terrace of the Grand Café with a lemonade. The first one I've ever paid for.",
    },
  },
  3: {
    lieu: "casino",
    rang: 2,
    tenue: { chapeau: "canotier", tenue: "veston-tweed", accessoire: "noeud-pap" },
    texte: {
      fr: "J'ai gagné au Casino ! Le croupier a levé un sourcil : il paraît que c'est une ovation. Je vous dois tout, sourcil compris.",
      en: "I won at the Casino! The croupier raised an eyebrow: I'm told that's a standing ovation. I owe you everything, eyebrow included.",
    },
  },
  8: {
    lieu: "salon",
    rang: 5,
    tenue: { chapeau: "melon", tenue: "trois-pieces", lunettes: "monocle" },
    texte: {
      fr: "Le Salon Privé m'a ouvert sa porte. J'ai essuyé mes pattes, comme demandé. Le Baron a reniflé : je lui rappelle quelqu'un.",
      en: "The Private Salon opened its door to me. I wiped my paws, as instructed. The Baron sniffed: I remind him of someone.",
    },
  },
  15: {
    lieu: "cercle",
    rang: 9,
    tenue: { chapeau: "haut-de-forme", tenue: "smoking", accessoire: "gousset" },
    texte: {
      fr: "Me voilà membre du Cercle des Moustaches. Je n'ai pas de moustache : Sir Auguste m'en prête une le jeudi.",
      en: "I'm a member of the Moustache Club now. I haven't a moustache: Sir Auguste lends me one on Thursdays.",
    },
  },
  30: {
    lieu: "yacht",
    rang: 17,
    tenue: { chapeau: "casquette-capitaine", tenue: "habit-amiral", accessoire: "ficelle" },
    texte: {
      fr: "Je vous écris du pont du Yacht. Le Commodore me salue chaque matin. Je porte toujours ma ficelle, sur l'habit : elle porte chance.",
      en: "I'm writing from the deck of the Yacht. The Commodore salutes me every morning. I still wear my string, over the uniform: it's lucky.",
    },
  },
  60: {
    lieu: "banque",
    rang: 34,
    tenue: { chapeau: "bicorne", tenue: "queue-de-pie", lunettes: "lorgnon" },
    texte: {
      fr: "J'ai un compte à la Banque. Maître Taupin m'a fait signer en trois exemplaires. J'ai signé d'une croix. Trois croix.",
      en: "I have an account at the Bank. Maître Taupin had me sign in triplicate. I signed with a cross. Three crosses.",
    },
  },
  120: {
    lieu: "lune",
    rang: 71,
    tenue: { tenue: "combinaison-spatiale" },
    texte: {
      fr: "Je suis sur la Lune. D'ici, on voit le quai où j'ai trouvé votre ticket : il tient derrière une patte. Je n'oublie pas.",
      en: "I'm on the Moon. From here you can see the quay where I found your ticket: it fits behind one paw. I haven't forgotten.",
    },
  },
  250: {
    lieu: "kiosque",
    // Le tout premier : celui du premier ticket semé. La boucle est bouclée.
    rang: 1,
    tenue: { chapeau: "panama", tenue: "trois-pieces", accessoire: "ficelle" },
    texte: {
      fr: "C'est encore moi : votre tout premier ticket. Ce matin, sur le quai, j'en ai laissé tomber un à mon tour. Je n'ai rien dit. Vous savez ce que c'est.",
      en: "It's me again: your very first ticket. This morning, on the quay, I dropped one myself. I said nothing. You know how it is.",
    },
  },
};

export interface Nouvelles {
  /** Le palier : tant de tickets semés. */
  palier: number;
  /** D'où le protégé écrit. */
  lieu: PlaceId;
  /** Le dernier écrit du quai, où il vient de semer à son tour. */
  boucle: boolean;
  /** Le protégé, dans la tenue qu'il porte désormais. */
  protege: NouveauVenu;
  texte: string;
}

/** Les nouvelles d'un palier, ou `null` si ce n'en est pas un. */
export function nouvellesDe(palier: number): Nouvelles | null {
  const etape = ETAPES[palier];
  if (!etape) return null;
  return {
    palier,
    lieu: etape.lieu,
    boucle: palier === PALIERS[PALIERS.length - 1],
    protege: { ...nouveauVenu(etape.rang), hardes: etape.tenue },
    texte: pick(etape.texte),
  };
}

/** Les paliers franchis en passant de `avant` à `apres` tickets semés, dans l'ordre. */
export function paliersFranchis(avant: number, apres: number): number[] {
  return PALIERS.filter((palier) => avant < palier && palier <= apres);
}

/** Les paliers atteints avec `semes` tickets semés : ce sont les nouvelles qui se relisent. */
export function paliersAtteints(semes: number): number[] {
  return PALIERS.filter((palier) => palier <= semes);
}

/** Le prochain palier, ou `null` quand tous les protégés ont écrit. */
export function prochainPalier(semes: number): number | null {
  return PALIERS.find((palier) => palier > semes) ?? null;
}

// ---------------------------------------------------------------------------
// Le Carnet du Patron : Gaspard l'a tenu avant le joueur, et le lui présente.

const CARNET: Deux<{ vide: string; tenu: string }> = {
  fr: {
    vide: "Le carnet était à moi, Patron. Il est à vous. Première page : blanche. Ça ne durera pas.",
    tenu: "Tout y est, Patron : qui a trouvé quoi, et ce qu'il est devenu. Je n'ai rien écrit sur les mouettes.",
  },
  en: {
    vide: "The notebook was mine, Boss. Now it's yours. First page: blank. That won't last.",
    tenu: "It's all in there, Boss: who found what, and what became of them. I left out the seagulls.",
  },
};

/** Ce que Gaspard dit en ouvrant le Carnet, selon qu'il est encore vide ou non. */
export function motDeGaspard(semes: number): string {
  return semes > 0 ? pick(CARNET).tenu : pick(CARNET).vide;
}

// ---------------------------------------------------------------------------

/** Tout le texte, dans les deux langues : pour les tests de parité et pour la relecture. */
export const TEXTES_SEMIS = {
  prenoms: PRENOMS,
  hardes: HARDES,
  repliques: REPLIQUES,
  foule: FOULE,
  etapes: ETAPES,
  carnet: CARNET,
} as const;
