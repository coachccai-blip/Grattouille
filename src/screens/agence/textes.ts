// Les mots de l'Agence Carpe Diem (LOT4.md, section 13) : les cinq chapitres du catalogue,
// le nom anglais de chaque expérience, le boniment de Madame Diem, la légende de la carte
// postale, et ce que Madame Diem dit selon ce que le joueur a déjà vécu.
//
// Le nom français d'une expérience est celui de shared/experiences.ts. Tout le reste a ses
// deux versions côte à côte, et se lit avec `pick` au moment de l'affichage. Ce module
// n'arrive qu'avec l'agence : rien de ceci ne pèse sur le démarrage du jeu.
//
// Madame Diem est une carpe koï, et elle n'a rien de muet : elle vend du rêve au mètre,
// connaît tous ses clients par leur prénom et n'a jamais laissé un silence s'installer.
// Elle tutoie. Les légendes, elles, sont de la main du joueur : c'est lui qui écrit la carte.

import { EXPERIENCES, EXPERIENCE_COUNT, experienceById, type ExperienceDef } from "../../../shared/experiences";
import { pick } from "../../i18n";

export interface Paire {
  fr: string;
  en: string;
}

/** Elle n'a pas de prénom, et son nom ne se traduit pas. */
export const MADAME_DIEM = "Madame Diem";

// ---------------------------------------------------------------------------
// Les chapitres du catalogue : ceux de shared/experiences.ts, par prix croissant.

export interface Chapitre {
  id: "port" | "voyages" | "folies" | "ciel" | "derniere";
  titre: Paire;
  /** Sa première expérience : le chapitre va jusqu'à la première du suivant. */
  de: string;
}

export const CHAPITRES: readonly Chapitre[] = [
  { id: "port", titre: { fr: "À portée du port", en: "Close to the harbour" }, de: "glace" },
  { id: "voyages", titre: { fr: "Les grands voyages", en: "The great journeys" }, de: "australie" },
  { id: "folies", titre: { fr: "Les folies", en: "The follies" }, de: "everest" },
  { id: "ciel", titre: { fr: "Plus haut que le ciel", en: "Higher than the sky" }, de: "apesanteur" },
  { id: "derniere", titre: { fr: "La dernière", en: "The last one" }, de: "toute-la-ville" },
];

/** Le catalogue, chapitre par chapitre : chaque expérience y est une fois, dans l'ordre des prix. */
export function catalogue(): { chapitre: Chapitre; experiences: ExperienceDef[] }[] {
  const debuts = CHAPITRES.map((chapitre) => EXPERIENCES.findIndex((x) => x.id === chapitre.de));
  return CHAPITRES.map((chapitre, i) => ({
    chapitre,
    experiences: EXPERIENCES.slice(debuts[i], debuts[i + 1] ?? EXPERIENCES.length),
  }));
}

/** Le chapitre d'une expérience. */
export function chapitreDe(id: string): Chapitre {
  return catalogue().find((c) => c.experiences.some((x) => x.id === id))?.chapitre ?? CHAPITRES[0]!;
}

// ---------------------------------------------------------------------------
// Les trente expériences

export interface TexteExperience {
  /** Son nom anglais (le français est dans shared/experiences.ts). */
  nom: string;
  /** Le boniment de Madame Diem : une ou deux phrases. */
  boniment: Paire;
  /** La légende de la carte postale, de la main du joueur. */
  legende: Paire;
}

export const TEXTES: Record<string, TexteExperience> = {
  // --- À portée du port
  glace: {
    nom: "A triple-scoop ice cream by the sea",
    boniment: {
      fr: "Vanille, fraise, pistache : trois boules, et la mer pour décor. Mange vite, les mouettes aussi ont vu le prix.",
      en: "Vanilla, strawberry, pistachio: three scoops and the sea for a backdrop. Eat fast, the gulls have seen the price too.",
    },
    legende: { fr: "Trois boules. Deux pour moi, une pour la mouette.", en: "Three scoops. Two for me, one for the gull." },
  },
  "balade-en-pedalo": {
    nom: "An hour of pedalo at sunset",
    boniment: {
      fr: "Soixante minutes de mer d'huile, face au couchant. Le pédalo ne pédale pas tout seul : c'est écrit en tout petit.",
      en: "Sixty minutes of glassy sea, facing the sunset. The pedalo doesn't pedal itself: that's in the small print.",
    },
    legende: { fr: "Le soleil s'est couché avant mes mollets.", en: "The sun gave up before my calves did." },
  },
  "cerf-volant": {
    nom: "A giant kite on a blustery day",
    boniment: {
      fr: "Six mètres d'envergure. Par grand vent, on ne sait plus très bien qui promène l'autre.",
      en: "Six metres across. In a strong wind, it gets hard to say who is flying whom.",
    },
    legende: { fr: "C'est lui qui m'a promené.", en: "It took me for a walk." },
  },
  "pique-nique": {
    nom: "A black-tie picnic on the beach",
    boniment: {
      fr: "Nappe blanche, argenterie, maître d'hôtel. Le sable dans le sandwich est offert par la maison.",
      en: "White tablecloth, silverware, a head waiter. The sand in the sandwich is on the house.",
    },
    legende: { fr: "Sous la cloche d'argent : un jambon-beurre. Parfait.", en: "Under the silver cloche: a ham sandwich. Perfect." },
  },
  plongee: {
    nom: "A first dive among the clownfish",
    boniment: {
      fr: "Ils ne font pas de numéro : ils habitent là. Tu souffles des bulles, tu dis bonjour, tu ne touches à rien.",
      en: "They don't do an act: they live there. Blow some bubbles, say hello, touch nothing.",
    },
    legende: { fr: "Ils m'ont trouvé très drôle.", en: "They thought I was hilarious." },
  },
  montgolfiere: {
    nom: "A hot-air balloon ride at dawn",
    boniment: {
      fr: "On décolle avant le soleil, dans un panier en osier. Le silence est compris ; le pilote, lui, chante.",
      en: "We take off before the sun does, in a wicker basket. Silence is included; the pilot, however, sings.",
    },
    legende: { fr: "Vu d'en haut, Grattouille tient dans la main.", en: "From up here, Grattouille fits in my hand." },
  },
  parachute: {
    nom: "A parachute jump (parachute included)",
    boniment: {
      fr: "Parachute compris, donc. J'ai longtemps proposé la formule sans : les clients ne revenaient pas.",
      en: "Parachute included, then. I used to offer the package without one: customers never came back.",
    },
    legende: { fr: "4\u202F000 mètres, 50 secondes, un seul cri.", en: "4,000 metres, 50 seconds, one long scream." },
  },

  // --- Les grands voyages
  australie: {
    nom: "A road trip across Australia",
    boniment: {
      fr: "Trois mille kilomètres de piste rouge en camionnette. Les kangourous ont la priorité, et ils le savent.",
      en: "Three thousand kilometres of red track in a camper van. The kangaroos have right of way, and they know it.",
    },
    legende: { fr: "Bons baisers d'Australie !", en: "Love from Australia!" },
  },
  "japon-coree": {
    nom: "A trip to Japan and Korea",
    boniment: {
      fr: "Les cerisiers à Kyoto, les lanternes à Séoul. Le train est si rapide qu'on arrive avant d'avoir ouvert son bento.",
      en: "Cherry blossom in Kyoto, lanterns in Seoul. The train is so fast you arrive before you've opened your bento.",
    },
    legende: { fr: "J'ai tout mangé avec des baguettes. Presque tout.", en: "I ate everything with chopsticks. Nearly everything." },
  },
  safari: {
    nom: "A photo safari on the savannah",
    boniment: {
      fr: "On ne rapporte que des photos. Les lions sont prévenus ; la girafe, elle, se met toujours devant.",
      en: "You bring back nothing but photos. The lions have been told; the giraffe, though, always gets in front.",
    },
    legende: { fr: "412 photos. La girafe est sur toutes.", en: "412 photos. The giraffe is in every one." },
  },
  aurores: {
    nom: "A night under the northern lights",
    boniment: {
      fr: "Le ciel fait son numéro vers minuit. Prévois un bonnet : là-bas, on applaudit en moufles.",
      en: "The sky does its act around midnight. Bring a woolly hat: up there, people clap in mittens.",
    },
    legende: { fr: "Le ciel a dansé. J'ai gelé. C'était parfait.", en: "The sky danced. I froze. It was perfect." },
  },
  transatlantique: {
    nom: "Sailing across the Atlantic",
    boniment: {
      fr: "Trois semaines de voile, cap à l'ouest. Le mal de mer passe au bout de quatre jours : parole de poisson.",
      en: "Three weeks under sail, heading west. Seasickness wears off after four days: take it from a fish.",
    },
    legende: { fr: "L'Amérique est toujours à sa place.", en: "America is right where they left it." },
  },
  "tour-du-monde": {
    nom: "Round the world",
    boniment: {
      fr: "Tous les fuseaux horaires dans la même semaine. Tu reviens au point de départ, mais plus du tout pareil.",
      en: "Every time zone in a single week. You end up where you started, only not the same at all.",
    },
    legende: { fr: "J'ai fait le tour. Elle est bien ronde.", en: "I went all the way round. It is indeed round." },
  },
  antarctique: {
    nom: "An expedition to the penguins",
    boniment: {
      fr: "Moins quarante, et dix mille manchots en habit. Tu seras bien le seul à ne pas être en smoking.",
      en: "Minus forty, and ten thousand penguins in evening dress. You'll be the only one not in a dinner jacket.",
    },
    legende: { fr: "Ils m'ont adopté. Je reste un peu.", en: "They've adopted me. I may stay a while." },
  },

  // --- Les folies
  everest: {
    nom: "Everest by sedan chair",
    boniment: {
      fr: "Le toit du monde sans une goutte de sueur : des porteurs, une chaise capitonnée, du thé à tous les camps.",
      en: "The roof of the world without a drop of sweat: porters, a padded chair, and tea at every camp.",
    },
    legende: { fr: "8\u202F849 mètres. Pas une ampoule.", en: "8,849 metres. Not a single blister." },
  },
  "ile-deserte": {
    nom: "A month on a desert island, all-inclusive",
    boniment: {
      fr: "Personne à l'horizon pendant un mois. Sauf le service en chambre, qui vient à la nage.",
      en: "Not a soul on the horizon for a month. Except room service, which swims over.",
    },
    legende: { fr: "Seul au monde. Enfin, avec le service en chambre.", en: "All alone in the world. Well, plus room service." },
  },
  train: {
    nom: "A legendary train, just for you",
    boniment: {
      fr: "Douze wagons, un seul voyageur. Le contrôleur te demandera ton billet par pure politesse.",
      en: "Twelve carriages, one passenger. The conductor will ask for your ticket out of sheer politeness.",
    },
    legende: { fr: "J'ai dîné dans les douze wagons.", en: "I had dinner in all twelve carriages." },
  },
  film: {
    nom: "A film starring you",
    boniment: {
      fr: "Le scénario, les cascades, le baiser final : tout est pour toi. La critique sera excellente, c'est moi qui l'écris.",
      en: "The script, the stunts, the final kiss: all yours. The reviews will be glowing, since I write them.",
    },
    legende: { fr: "Une étoile est née. C'est moi.", en: "A star is born. It's me." },
  },
  abysses: {
    nom: "A dive to the bottom of the Mariana Trench",
    boniment: {
      fr: "Onze mille mètres sous la surface. Il y fait noir comme dans un four, mais j'y ai de la famille.",
      en: "Eleven thousand metres down. It's pitch dark, but I do have family there.",
    },
    legende: { fr: "Tout au fond, il y avait un ticket.", en: "At the very bottom, there was a ticket." },
  },
  parc: {
    nom: "A whole theme park to yourself",
    boniment: {
      fr: "Aucune file d'attente, toutes les lumières allumées, et la barbe à papa à volonté. Le grand huit t'attendra.",
      en: "No queues, every light on, and all the candyfloss you can eat. The roller coaster will wait for you.",
    },
    legende: { fr: "Onze tours de grand huit. Zéro file d'attente.", en: "Eleven goes on the roller coaster. Zero queues." },
  },

  // --- Plus haut que le ciel
  apesanteur: {
    nom: "A nap in zero gravity",
    boniment: {
      fr: "Tu t'endors, et ton oreiller aussi. Ne ronfle pas trop fort : là-haut, ça fait reculer.",
      en: "You drift off, and so does your pillow. Don't snore too hard: up there, it sends you backwards.",
    },
    legende: { fr: "La meilleure sieste de ma vie. Au plafond.", en: "The best nap of my life. On the ceiling." },
  },
  orbite: {
    nom: "A week in orbit",
    boniment: {
      fr: "Seize levers de soleil par jour, pendant sept jours. Prévois de quoi tirer les rideaux.",
      en: "Sixteen sunrises a day, for seven days. Bring something to draw the curtains with.",
    },
    legende: { fr: "112 levers de soleil. J'ai dormi pendant 3.", en: "112 sunrises. I slept through 3." },
  },
  "feu-artifice": {
    nom: "Fireworks you can see from space",
    boniment: {
      fr: "Le bouquet final fait la taille d'un continent. On a prévenu les voisins. Tous les voisins.",
      en: "The finale is the size of a continent. We've warned the neighbours. All of them.",
    },
    legende: { fr: "Même la Lune a fait « oh ».", en: "Even the Moon went “ooh”." },
  },
  "tour-de-lune": {
    nom: "Round the Moon",
    boniment: {
      fr: "On la contourne par la gauche, on salue la face cachée, et on rentre. Elle est timide : n'insiste pas.",
      en: "We go round by the left, wave at the far side, and head home. She's shy: don't push it.",
    },
    legende: { fr: "J'ai vu sa face cachée. Je ne dirai rien.", en: "I've seen her far side. My lips are sealed." },
  },
  "pas-sur-la-lune": {
    nom: "One small step on the Moon",
    boniment: {
      fr: "Un petit pas pour toi, une très grosse note pour la navette. Les empreintes, elles, restent un million d'années.",
      en: "One small step for you, one giant bill for the shuttle. The footprints, mind you, last a million years.",
    },
    legende: { fr: "Mes empreintes y sont pour un million d'années.", en: "My footprints are there for a million years." },
  },
  "soiree-lune": {
    nom: "A party on the Moon",
    boniment: {
      fr: "Boule à facettes, piste de danse dans un cratère, vue sur la Terre. Le voisin du dessous est à 384\u202F000 kilomètres.",
      en: "A mirror ball, a dance floor in a crater, a view of Earth. The downstairs neighbour is 384,000 kilometres away.",
    },
    legende: { fr: "On a dansé jusqu'au lever de Terre.", en: "We danced till Earthrise." },
  },
  mars: {
    nom: "A picnic on Mars",
    boniment: {
      fr: "Nappe à carreaux, sandwichs sous vide, et pas une fourmi à des millions de kilomètres à la ronde.",
      en: "A gingham cloth, vacuum-packed sandwiches, and not an ant for millions of kilometres around.",
    },
    legende: { fr: "Pas une fourmi. Mais quelqu'un a fini les chips.", en: "Not a single ant. But somebody finished the crisps." },
  },
  saturne: {
    nom: "Surfing the rings of Saturn",
    boniment: {
      fr: "La plus longue vague du système solaire : elle fait le tour de la planète et ne casse jamais.",
      en: "The longest wave in the solar system: it goes right round the planet and never breaks.",
    },
    legende: { fr: "Une seule vague. 270\u202F000 kilomètres.", en: "One wave. 270,000 kilometres." },
  },
  "dos-de-comete": {
    nom: "A ride on a comet's back",
    boniment: {
      fr: "Elle ne passe que tous les soixante-seize ans : ne rate pas l'arrêt. Et tiens-toi à la crinière, ça décoiffe.",
      en: "She only comes by every seventy-six years: don't miss the stop. And hold on to the mane, it's breezy up there.",
    },
    legende: { fr: "Prochain passage dans 76 ans. Je garde ma place.", en: "Next pass in 76 years. I'm keeping my seat." },
  },

  // --- La dernière
  "toute-la-ville": {
    nom: "A holiday for the whole town",
    boniment: {
      fr: "Tout Grattouille en vacances, de Piou au dernier des gueux. Il faudra bien quelqu'un pour garder le Kiosque : pas toi.",
      en: "All of Grattouille on holiday, from Piou to the very last pauper. Somebody will have to mind the Kiosk: not you.",
    },
    legende: { fr: "Toute la ville dit merci. Même Hector a souri.", en: "The whole town says thank you. Even Hector smiled." },
  },
};

/** « Un roadtrip en Australie », ou son nom anglais. Un identifiant inconnu se rend tel quel. */
export function nomExperience(id: string): string {
  const fr = experienceById(id)?.name ?? id;
  return pick({ fr, en: TEXTES[id]?.nom ?? fr });
}

export function bonimentDe(id: string): string {
  const texte = TEXTES[id];
  return texte ? pick(texte.boniment) : "";
}

export function legendeDe(id: string): string {
  const texte = TEXTES[id];
  return texte ? pick(texte.legende) : "";
}

// ---------------------------------------------------------------------------
// Ce que dit Madame Diem, derrière son comptoir

export const DIEM = {
  /** À qui pousse la porte pour la première fois. */
  bienvenue: {
    fr: "Bienvenue à l'Agence Carpe Diem ! Ici, rien de ce que je vends ne se range dans un placard : que des souvenirs.",
    en: "Welcome to the Carpe Diem Agency! Nothing I sell will fit in a cupboard: memories only.",
  },
  /** De une à neuf expériences vécues. */
  debut: {
    fr: "On dit “muette comme une carpe”. On ne m'avait pas rencontrée. Alors, on part où ?",
    en: "They say fish can't talk. They hadn't met me. So, where are we off to?",
  },
  /** De dix à dix-neuf. */
  milieu: {
    fr: "Tu commences à avoir des choses à raconter. Méfie-toi : on y prend goût.",
    en: "You're starting to have stories to tell. Careful: it's habit-forming.",
  },
  /** De vingt à vingt-huit : il en reste `{n}`. */
  bientot: {
    fr: "Plus que {n}. Après, il faudra que j'invente autre chose.",
    en: "Only {n} to go. After that, I'll have to think up something new.",
  },
  /** Vingt-neuf : il n'en reste qu'une. */
  presque: {
    fr: "Plus qu'une. Garde-la pour un grand jour : c'est mon conseil, et il est gratuit.",
    en: "Just one left. Save it for a big day: that's my advice, and it's free.",
  },
  /** Les trente. */
  tout: {
    fr: "Trente sur trente ! Tu as vécu tout mon catalogue. Il ne te reste qu'à recommencer : c'est la maison qui offre.",
    en: "Thirty out of thirty! You've lived my entire catalogue. All that's left is to do it again: it's on the house.",
  },
  /** Rien de ce qui reste à vivre n'est à portée de bourse. */
  fauche: {
    fr: "Rien à ta portée pour l'instant ? Les souvenirs savent attendre. Les tickets, moins.",
    en: "Nothing within reach just now? Memories can wait. Tickets, less so.",
  },
} satisfies Record<string, Paire>;

/**
 * Le mot de Madame Diem, selon ce que le joueur a vécu (`vecues`, de 0 à 30) et ce que sa
 * bourse lui permet (`aPortee` : au moins une expérience à vivre est dans ses moyens).
 */
export function motDeDiem(vecues: number, aPortee: boolean): string {
  const reste = EXPERIENCE_COUNT - vecues;
  if (reste <= 0) return pick(DIEM.tout);
  if (vecues <= 0) return pick(DIEM.bienvenue);
  if (!aPortee) return pick(DIEM.fauche);
  if (reste === 1) return pick(DIEM.presque);
  if (vecues >= 20) return pick(DIEM.bientot).replace("{n}", String(reste));
  return pick(vecues >= 10 ? DIEM.milieu : DIEM.debut);
}
