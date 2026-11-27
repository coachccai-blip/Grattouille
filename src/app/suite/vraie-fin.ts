// La vraie fin, « Huit as de cœur » (LOT4.md, section 4) : ce qui s'y dit.
//
// Elle se mérite : le Kiosque est au joueur, et il a ruiné au Poker Tricheur les huit
// maîtres des lieux. Un beau matin, ils l'attendent autour d'une table dressée sur le
// quai. Quatre temps :
//   1. l'invitation : ils applaudissent, et Sir Auguste encaisse un pari ;
//   2. les huit as : chacun retourne sa carte, et c'est huit fois l'as de cœur ;
//   3. le secret : Piou ôte son calot. Le premier à débarquer sans un sou, c'était lui,
//      et ce jour-là il n'y avait rien par terre. Alors il a inventé la ville ;
//   4. la pluie de tickets : le bateau du matin accoste, toute la tablée vide ses poches,
//      et une mouette s'envole avec le dernier ticket.
//
// Conventions, celles de src/app/dialogues.ts : les deux langues côte à côte, de même
// forme ; 110 caractères au plus par phrase, une idée par écran ; les personnages
// vouvoient, le récit tutoie ; rien n'est figé à l'import. Chacun garde sa voix : Gaspard
// bonimente, Ondine accuse le vent du large, Hector parle au nom de la maison, le Baron
// grogne, la moustache de Sir Auguste frémit, le Commodore a tout dans le bec, Maître
// Taupin compte les exemplaires, et Dame Séléné a tout vu d'en haut. Ils ne disent plus
// « Votre Immensité » : on ne flatte pas quelqu'un de la maison.
// Ce module n'est chargé qu'avec la cinématique (src/screens/moments/VraieFin.tsx).

import type { Speaker } from "../dialogues";
import type { Lang } from "../../i18n";

type Deux<T> = Record<Lang, T>;

/** Les huit maîtres des lieux, du Kiosque à la Lune : l'ordre de la table. */
export const HOTES = ["gaspard", "ondine", "hector", "baron", "auguste", "balthazar", "taupin", "selene"] as const;
export type Hote = (typeof HOTES)[number];

/** Les quatre temps. */
export type Temps = "invitation" | "as" | "secret" | "pluie";

/**
 * Ce que montre le dessin, plan par plan : la tablée (qui se lève, puis paie son pari),
 * les huit cartes, Piou (qui ôte son calot, raconte, puis le remet), le quai (le bateau,
 * la pluie de tickets, la mouette).
 */
export type Image =
  | "tablee" | "bravo" | "pari"
  | "cartes" | "regards"
  | "calot" | "recit" | "recoiffe"
  | "bateau" | "pluie" | "mouette";

/** Qui parle : un personnage du jeu, ou celui qui débarque du bateau. */
export type Voix = Speaker | "venu";

export interface Replique {
  qui: Voix;
  /** Une bulle par phrase. */
  dit: Deux<readonly string[]>;
}

export interface Plan {
  id: string;
  temps: Temps;
  image: Image;
  /** Un titre, en grand : rare. */
  titre?: Deux<string>;
  /** Ce que raconte l'écran, avant les bulles. */
  recit?: Deux<string>;
  repliques?: readonly Replique[];
  /** Ce que raconte l'écran, après les bulles. */
  chute?: Deux<string>;
  /** Le bouton : une phrase française, clé de traduction (src/i18n/en/suite.ts). */
  bouton: string;
}

/** Le nom du souvenir, et le titre du deuxième temps une fois les cartes retournées. */
export const TITRE: Deux<string> = { fr: "Huit as de cœur", en: "Eight aces of hearts" };

/** Sous le titre du jeu de cartes, tant qu'il reste une carte à retourner. */
export const CONSIGNE: Deux<string> = {
  fr: "Chacun a posé une carte devant soi, face cachée. Retourne-les.",
  en: "Each of them has laid a card face down. Turn them over.",
};

/** Ce que chacun dit en retournant sa carte. */
export const AS: Record<Hote, Deux<string>> = {
  gaspard: {
    fr: "Je commence, Patron. Oh ! Un as de cœur. Ça alors.",
    en: "I'll go first, Boss. Oh! An ace of hearts. Well I never.",
  },
  ondine: {
    fr: "As de cœur. C'est le vent du large qui l'a posé là. Je ne vois que lui.",
    en: "Ace of hearts. The sea breeze put it there. I can think of no one else.",
  },
  hector: {
    fr: "As de cœur. La maison n'en met qu'un par paquet. La maison recompte.",
    en: "Ace of hearts. The house puts one in each pack. The house is recounting.",
  },
  baron: {
    fr: "Hmpf. As de cœur. Ne me regardez pas comme ça.",
    en: "Hmph. Ace of hearts. Don't look at me like that.",
  },
  auguste: {
    fr: "As de cœur. La moustache n'a même pas frémi : elle le savait.",
    en: "Ace of hearts. The moustache never even quivered: it knew.",
  },
  balthazar: {
    fr: "As de cœur ! Il a voyagé dans mon bec. Il est sec. Presque.",
    en: "Ace of hearts! It travelled in my bill. It's dry. Nearly.",
  },
  taupin: {
    fr: "As de cœur. Numéroté, tamponné, classé. En huit exemplaires, semble-t-il.",
    en: "Ace of hearts. Numbered, stamped and filed. In eight copies, it would seem.",
  },
  selene: {
    fr: "As de cœur. D'en haut, je vous ai tous vus le glisser dans la manche. C'était joli.",
    en: "Ace of hearts. From up there I watched you all slip it up your sleeves. So pretty.",
  },
};

/** Le plan des cartes : le seul où le joueur choisit l'ordre. */
export const PLAN_DES_CARTES = "cartes";

export const PLANS: readonly Plan[] = [
  // ------------------------------------------------------------ 1. L'invitation
  {
    id: "table",
    temps: "invitation",
    image: "tablee",
    titre: { fr: "On t'attendait", en: "You were expected" },
    recit: {
      fr: "Devant le Kiosque, une table est dressée. Huit couverts, pour les huit maîtres des lieux que tu as ruinés.",
      en: "In front of the Kiosk, a table has been laid. Eight places, for the eight hosts you ruined.",
    },
    bouton: "S'approcher",
  },
  {
    id: "bravo",
    temps: "invitation",
    image: "bravo",
    recit: {
      fr: "Ils se lèvent, tous les huit, et ils applaudissent. Même le Baron. Surtout le Baron.",
      en: "All eight get to their feet and applaud. Even the Baron. Especially the Baron.",
    },
    repliques: [
      {
        qui: "gaspard",
        dit: {
          fr: ["Approchez, Patron ! On vous a gardé le bout de la table : la place d'où l'on voit arriver le bateau."],
          en: ["Come on over, Boss! We've kept you the end of the table: the seat with a view of the boat coming in."],
        },
      },
    ],
    bouton: "S'asseoir",
  },
  {
    id: "pari",
    temps: "invitation",
    image: "pari",
    repliques: [
      {
        qui: "auguste",
        dit: {
          fr: ["J'avais parié sur vous dès le premier matin. À huit contre un. La moustache ne se trompe jamais."],
          en: ["I bet on you that very first morning. At eight to one. The moustache is never wrong."],
        },
      },
      {
        qui: "hector",
        dit: {
          fr: ["La maison avait parié contre. La maison paie. C'est une première."],
          en: ["The house bet against. The house pays. This is a first."],
        },
      },
    ],
    bouton: "Regarder la table",
  },

  // ------------------------------------------------------------ 2. Les huit as
  {
    id: PLAN_DES_CARTES,
    temps: "as",
    image: "cartes",
    titre: { fr: "Huit cartes", en: "Eight cards" },
    bouton: "Retourner une carte",
  },
  {
    id: "regards",
    temps: "as",
    image: "regards",
    repliques: [
      {
        qui: "gaspard",
        dit: {
          fr: ["Huit as de cœur dans un seul paquet. C'est comme ça qu'on se reconnaît, à Grattouille."],
          en: ["Eight aces of hearts in a single pack. That's how we know our own, in Grattouille."],
        },
      },
      {
        qui: "ondine",
        dit: {
          fr: ["Reste à savoir qui a distribué."],
          en: ["Which leaves the question of who dealt."],
        },
      },
    ],
    chute: {
      fr: "Huit têtes se tournent vers le groom.",
      en: "Eight heads turn towards the bellboy.",
    },
    bouton: "Regarder Piou",
  },

  // ------------------------------------------------------------ 3. Le secret
  {
    id: "calot",
    temps: "secret",
    image: "calot",
    recit: {
      fr: "Piou ôte son calot. Personne ne l'avait jamais vu sans.",
      en: "Piou takes off his cap. Nobody has ever seen him without it.",
    },
    repliques: [
      {
        qui: "piou",
        dit: {
          fr: ["Bon, bon. Je vous dois une histoire. Elle est courte : je parle trop vite."],
          en: ["Right, right. I owe you a story. It's a short one: I talk too fast."],
        },
      },
    ],
    bouton: "Écouter Piou",
  },
  {
    id: "premier",
    temps: "secret",
    image: "recit",
    repliques: [
      {
        qui: "piou",
        dit: {
          fr: [
            "Le premier à débarquer ici sans un sou, c'était moi. Il y a très, très longtemps.",
            "J'ai regardé par terre. Rien ! Pas un ticket, pas un quai. Une mouette, et elle regardait ailleurs.",
          ],
          en: [
            "The first to step ashore here without a penny was me. A very, very long time ago.",
            "I looked down. Nothing! Not a ticket, not a quay. One seagull, and it was looking the other way.",
          ],
        },
      },
    ],
    bouton: "Et alors ?",
  },
  {
    id: "ville",
    temps: "secret",
    image: "recit",
    repliques: [
      {
        qui: "piou",
        dit: {
          fr: [
            "Alors j'ai inventé une ville où il y aurait toujours quelque chose par terre.",
            "Un kiosque d'abord. Puis des poches trouées, pour tout le monde. La Lune, c'est venu après : j'ai vu grand.",
          ],
          en: [
            "So I invented a town where there would always be something on the ground.",
            "A kiosk first. Then holes in the pockets, for everyone. The Moon came later: I do think big.",
          ],
        },
      },
    ],
    bouton: "Et la chance ?",
  },
  {
    id: "chance",
    temps: "secret",
    image: "recit",
    repliques: [
      {
        qui: "piou",
        dit: {
          fr: ["Votre chance n'a jamais été de la chance. Ici, on triche ! Mais toujours pour celui qui n'a rien."],
          en: ["Your luck was never luck. Here, we cheat! But always for whoever has nothing."],
        },
      },
    ],
    bouton: "Et les huit défis ?",
  },
  {
    id: "examen",
    temps: "secret",
    image: "recit",
    repliques: [
      {
        qui: "piou",
        dit: {
          fr: [
            "Les huit défis ? L'examen ! Tricher pour les autres : vous savez. Démasquer qui triche pour soi : aussi.",
            "Il faut les deux, pour garder une ville pareille.",
          ],
          en: [
            "The eight challenges? The exam! Cheating for others: you can. Unmasking who cheats for themselves: too.",
            "It takes both, to look after a town like this.",
          ],
        },
      },
    ],
    bouton: "Et Piou, dans tout ça ?",
  },
  {
    id: "groom",
    temps: "secret",
    image: "recoiffe",
    recit: {
      fr: "Piou remet son calot. De travers, comme toujours.",
      en: "Piou puts his cap back on. Crooked, as always.",
    },
    repliques: [
      {
        qui: "piou",
        dit: {
          fr: ["Fondateur, c'est un métier de bureau. Groom, on voit le quai. Ne le répétez pas, Légende : j'y tiens."],
          en: ["Founder is a desk job. A bellboy gets to watch the quay. Keep it to yourself, Legend: I mean it."],
        },
      },
    ],
    bouton: "Promis",
  },

  // ------------------------------------------------------------ 4. La pluie de tickets
  {
    id: "bateau",
    temps: "pluie",
    image: "bateau",
    recit: {
      fr: "Une corne de brume : le bateau du matin accoste. Quelqu'un débarque sans un sou, et regarde par terre.",
      en: "A foghorn: the morning boat is coming in. Someone steps ashore without a penny, and looks down.",
    },
    repliques: [
      {
        qui: "piou",
        dit: {
          fr: ["Le bateau ! Vite, vite : tout le monde aux poches !"],
          en: ["The boat! Quick, quick: pockets, everybody!"],
        },
      },
    ],
    bouton: "Laisser tomber un ticket",
  },
  {
    id: "pluie",
    temps: "pluie",
    image: "pluie",
    recit: {
      fr: "Dix tickets tombent sur le quai : huit maîtres des lieux, toi, et Piou, qui jure que le sien lui a échappé.",
      en: "Ten tickets land on the quay: eight hosts, you, and Piou, who swears his just slipped out.",
    },
    repliques: [
      {
        qui: "venu",
        dit: {
          fr: ["Dix tickets ! Pour moi ? Mais je n'ai encore rien fait !"],
          en: ["Ten tickets! For me? But I haven't done anything yet!"],
        },
      },
      {
        qui: "piou",
        dit: {
          fr: ["Justement ! Ramassez-les vite, avant les mouettes !"],
          en: ["Exactly! Pick them up, quick, before the seagulls do!"],
        },
      },
    ],
    bouton: "Lever les yeux",
  },
  {
    id: "mouette",
    temps: "pluie",
    image: "mouette",
    recit: {
      fr: "Trop tard pour le dixième : une mouette l'emporte. Elle ira le gratter sur le toit du Kiosque.",
      en: "Too late for the tenth: a seagull makes off with it. She'll scratch it on the roof of the Kiosk.",
    },
    chute: {
      fr: "Il paraît qu'elles gagnent toujours.",
      en: "They say seagulls always win.",
    },
    bouton: "Retourner au Domaine",
  },
];

/** Celui qui débarque au dernier temps n'a pas encore de nom : c'est tout le monde. */
export const VENU: Deux<string> = { fr: "Quelqu'un", en: "Someone" };

/** Sous la dernière image : ce que la vraie fin change, dit une fois. */
export const LEGENDE: Deux<string> = {
  fr: "Te voilà Légende : c'est écrit sous ton pseudo.",
  en: "You are a Legend now: it says so under your name.",
};
