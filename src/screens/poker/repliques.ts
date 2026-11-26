// Ce que les personnages disent autour d'une table de Poker Tricheur, en français et en
// anglais (RECIT.md). Chacun garde la voix qu'on lui connaît au comptoir : Gaspard
// bonimente et change de sujet, Ondine reste pince-sans-rire, Hector compte au nom de la
// maison, le Baron grogne, la moustache de Sir Auguste frémit, le Commodore navigue,
// Maître Taupin chuchote, Dame Séléné regarde la Terre, Mlle Sidonie juge, Enzo fonce,
// Mme Colette trouve tout ravissant et Maître Archibald adjuge.
//
// Conventions, celles de src/app/dialogues.ts :
// - les deux langues côte à côte, de même forme (un test le vérifie) ;
// - une réplique qui commence par « ~ » est un geste : elle s'affiche sans guillemets ;
// - à table, 80 caractères au plus : la réplique tient sur deux lignes au-dessus des
//   cartes, sans jamais rien recouvrir ; un défi ou une ruine en prend 110 au plus ;
// - rien n'est figé à l'import : tout se lit dans la langue courante, au moment de l'affichage ;
// - on ne se moque jamais de qui perd, et un hôte ne dit jamais la règle du jeu.

import { hostName, type Line, type Speaker } from "../../app/dialogues";
import { lang, type Lang } from "../../i18n";

type Deux<T> = Record<Lang, T>;

/** Les moments où un personnage parle à table. */
export type TableMoment = "accuse" | "demasque" | "innocent" | "gagne";

/**
 * Les moments d'un hôte : son défi (avant la première victoire du joueur), la revanche
 * (sa cagnotte est déjà partie), sa ruine (il remet sa cagnotte, `{cagnotte}`), une ruine
 * de plus (il n'a plus rien à remettre), et sa victoire.
 */
export type HostMoment = "defi" | "revanche" | "ruine" | "ruine-encore" | "vainqueur";

export type Bot =
  | "gaspard" | "ondine" | "hector" | "baron" | "auguste" | "balthazar" | "taupin" | "selene"
  | "sidonie" | "enzo" | "colette" | "archibald";

export type Host = Exclude<Bot, "sidonie" | "enzo" | "colette" | "archibald">;

type Voice = Record<TableMoment, readonly string[]>;
type HostVoice = Record<HostMoment, string>;

// ---------------------------------------------------------------------------
// À table : accusé, démasqué, innocenté, ou devant un beau pot

export const TABLE_TALK: Record<Bot, Deux<Voice>> = {
  gaspard: {
    fr: {
      accuse: ["Moi, tricher ? À mon âge ? Oh, une mouette !", "Tricheur, moi ? Je vends de la chance, je n'en fabrique pas."],
      demasque: ["Sapristi. Elle a glissé toute seule, cette carte.", "Bon. Pris la patte dans le sac. Ça arrive aux meilleurs."],
      innocent: ["Blanc comme une voile ! Par ici la monnaie.", "Honnête comme un matin de marché. Merci pour la pièce !"],
      gagne: ["Le port me réussit, on dirait !", "Nom d'une sardine, la belle prise !"],
    },
    en: {
      accuse: ["Me, cheat? At my age? Oh look, a seagull!", "A cheat, me? I sell luck. I don't manufacture it."],
      demasque: ["Blimey. That card slipped in all by itself.", "Right. Caught with my paw in the till. Happens to the best."],
      innocent: ["Clean as a sail! Cash this way, please.", "Honest as a market morning. Thanks for the coin!"],
      gagne: ["The harbour's being kind to me, it seems!", "Suffering sardines, what a catch!"],
    },
  },
  ondine: {
    fr: {
      accuse: ["Moi ? Je n'ai que deux pattes, et elles tiennent un plateau.", "Tricher demande de l'enthousiasme. Je n'en ai pas."],
      demasque: ["C'est le vent du large. Il déplace tout, ici.", "Tiens. Cette carte n'était pas sur la carte."],
      innocent: ["Propre comme mon tablier. L'addition, s'il vous plaît.", "Innocente. Comme toujours. C'est lassant."],
      gagne: ["Ça fera un beau pourboire.", "Je range ça avec les petites cuillères."],
    },
    en: {
      accuse: ["Me? I've only two paws, and they're holding a tray.", "Cheating takes enthusiasm. I haven't any."],
      demasque: ["That'll be the sea breeze. It moves everything round here.", "Well. That card wasn't on the menu."],
      innocent: ["Clean as my apron. The bill, if you please.", "Innocent. As ever. It gets tiresome."],
      gagne: ["That'll make a handsome tip.", "I'll put that away with the teaspoons."],
    },
  },
  hector: {
    fr: {
      accuse: ["La maison ne triche pas. Elle arrondit.", "~ Hector hausse un sourcil. Le gauche."],
      demasque: ["Une erreur de caisse.", "~ Hector rajuste sa visière. Trop tard."],
      innocent: ["Les comptes sont justes. Payez.", "La maison accepte les excuses. En espèces."],
      gagne: ["La banque ramasse.", "~ Hector ratisse le pot, sans un mot."],
    },
    en: {
      accuse: ["The house does not cheat. It rounds up.", "~ Hector raises an eyebrow. The left one."],
      demasque: ["A till error.", "~ Hector straightens his visor. Too late."],
      innocent: ["The books balance. Pay up.", "The house accepts apologies. In cash."],
      gagne: ["The bank collects.", "~ Hector rakes in the pot without a word."],
    },
  },
  baron: {
    fr: {
      accuse: ["Hmpf ! Un Baron ne triche pas. Il s'arrange.", "Tricheur ? Hmpf. Je mords pour moins que ça."],
      demasque: ["Hmpf. C'est le smoking. Il a trop de manches.", "Bon. Hmpf. Ne le répétez pas au Cercle."],
      innocent: ["Hmpf. Je l'avais dit. Payez, et essuyez vos pattes.", "Innocent. Je suis vexé quand même."],
      gagne: ["Hmpf. Joli pot. Je ne pleure pas.", "~ Le Baron renifle. C'est l'émotion."],
    },
    en: {
      accuse: ["Hmph! A Baron does not cheat. He makes arrangements.", "A cheat? Hmph. I've bitten for less."],
      demasque: ["Hmph. It's the dinner jacket. Too many sleeves.", "Fine. Hmph. Not a word of this at the Club."],
      innocent: ["Hmph. Told you so. Pay up, and wipe your paws.", "Innocent. I'm offended all the same."],
      gagne: ["Hmph. Nice pot. I am not crying.", "~ The Baron sniffs. It's the emotion."],
    },
  },
  auguste: {
    fr: {
      accuse: ["Tricher ? Au Cercle ? La moustache s'en offusque.", "On ne soupçonne pas une moustache pareille."],
      demasque: ["La moustache frémit. Elle le savait.", "J'avais parié qu'on ne verrait rien. Perdu."],
      innocent: ["La moustache est sans tache. Réglez, je vous prie.", "Innocent. J'avais parié dessus."],
      gagne: ["Le pot rejoint le Cercle. La moustache approuve.", "J'avais parié sur cette main. Naturellement."],
    },
    en: {
      accuse: ["Cheating? At the Club? The moustache takes offence.", "One does not suspect a moustache like this."],
      demasque: ["The moustache quivers. It knew.", "I had wagered nobody would notice. Lost."],
      innocent: ["The moustache is spotless. Settle up, if you please.", "Innocent. I had a wager on it."],
      gagne: ["The pot joins the Club. The moustache approves.", "I had a wager on this hand. Naturally."],
    },
  },
  balthazar: {
    fr: {
      accuse: ["Tricher ? Un Commodore ? J'ai fait fouiller les cales pour moins.", "Par ma casquette ! Mon bec est irréprochable."],
      demasque: ["Elle était dans mon bec. Je l'avais oubliée.", "Carte à la mer ! Enfin : carte repêchée."],
      innocent: ["Rien dans le bec, rien dans les cales. Par ici la solde !", "Pavillon blanc ! Payez le passage."],
      gagne: ["À l'abordage du pot !", "Encore un trésor pour la cale. Elle déborde."],
    },
    en: {
      accuse: ["Cheat? A Commodore? I've had the holds searched for less.", "By my cap! My bill is beyond reproach."],
      demasque: ["It was in my bill. I'd quite forgotten it.", "Card overboard! Or rather: card fished out."],
      innocent: ["Nothing in the bill, nothing in the hold. Pay the purser!", "White flag! That'll be the fare."],
      gagne: ["All hands to the pot!", "More treasure for the hold. It's overflowing."],
    },
  },
  taupin: {
    fr: {
      accuse: ["Tricher ? Je ne distingue pas un as d'un coffre.", "Chut. Tout est dans le registre. Presque tout."],
      demasque: ["Une erreur d'écriture. Une seule.", "Je l'avais prise pour un reçu."],
      innocent: ["Les comptes sont exacts. Votre versement aussi, j'espère.", "Innocent, en trois exemplaires. Signez ici."],
      gagne: ["Je verse cela au coffre. En chuchotant.", "Un dépôt. J'aime les dépôts."],
    },
    en: {
      accuse: ["Cheat? I can't tell an ace from a strongbox.", "Hush. It's all in the ledger. Nearly all."],
      demasque: ["A clerical error. Just the one.", "I took it for a receipt."],
      innocent: ["The accounts are exact. As your payment will be, I trust.", "Innocent, in triplicate. Sign here."],
      gagne: ["I'll put that in the vault. In a whisper.", "A deposit. I do like deposits."],
    },
  },
  selene: {
    fr: {
      accuse: ["Tricher ? Ici, les cartes flottent. Elles vont où elles veulent.", "On m'accuse. Tiens. La Terre se lève."],
      demasque: ["Elle est tombée de la Terre, sans doute.", "Ah. Vous l'avez vue. D'habitude, on regarde la Terre."],
      innocent: ["Rien à cacher. Ici, il n'y a pas d'ombre.", "Innocente. Comme un croissant."],
      gagne: ["Le pot monte jusqu'à moi. Tout monte, ici.", "Joli. Presque autant que la Terre."],
    },
    en: {
      accuse: ["Cheat? Cards float up here. They go where they please.", "I am accused. Well. The Earth is rising."],
      demasque: ["It fell from the Earth, no doubt.", "Ah. You saw it. People usually watch the Earth."],
      innocent: ["Nothing to hide. There are no shadows up here.", "Innocent. As a crescent."],
      gagne: ["The pot rises to me. Everything rises, here.", "Lovely. Almost as lovely as the Earth."],
    },
  },
  sidonie: {
    fr: {
      accuse: ["Tricher ? Avec ces manches-là ? Voyons.", "On ne m'accuse pas. On me complimente."],
      demasque: ["Hum. La carte n'allait pas avec ma tenue.", "Soit. Mais avouez que c'était élégant."],
      innocent: ["Irréprochable. Comme mon ourlet. Payez.", "Tenez-vous droit, et réglez."],
      gagne: ["Enfin un pot bien coupé.", "Voilà qui est seyant."],
    },
    en: {
      accuse: ["Cheat? In these sleeves? Really.", "One does not accuse me. One compliments me."],
      demasque: ["Hm. That card didn't go with my outfit.", "Very well. But admit it was elegant."],
      innocent: ["Faultless. Like my hem. Pay up.", "Stand up straight, and settle the bill."],
      gagne: ["At last, a well-cut pot.", "Now that is becoming."],
    },
  },
  enzo: {
    fr: {
      accuse: ["Tricher ? Pas le temps ! Vroum.", "Moi ? Trop lent, comme coup. Vrrr."],
      demasque: ["Oups. Dérapage. Vraoum.", "Zut. Sortie de route."],
      innocent: ["Tut tut ! Rien sous le capot.", "Propre ! La monnaie, vite. J'ai une course."],
      gagne: ["Vroum ! Pole position !", "Et hop, le plein. Vrrr."],
    },
    en: {
      accuse: ["Cheat? No time! Vroom.", "Me? Far too slow a move. Vrrr."],
      demasque: ["Oops. Skidded. Vroooom.", "Blast. Off the track."],
      innocent: ["Beep beep! Nothing under the bonnet.", "Clean! The change, quick. I've a race on."],
      gagne: ["Vroom! Pole position!", "And that's the tank filled. Vrrr."],
    },
  },
  colette: {
    fr: {
      accuse: ["Tricher, moi ? Quelle idée ravissante. Et fausse.", "Oh ! Un soupçon. C'est ravissant."],
      demasque: ["Une petite carte de rien du tout. Ravissante, non ?", "Démasquée ? Quel mot ravissant."],
      innocent: ["Innocente, et ravissante. Les deux se paient.", "Ravissant. Mon coussin vous remercie."],
      gagne: ["Un pot ravissant ! Je le mets en vitrine.", "Ravissant. Tout simplement."],
    },
    en: {
      accuse: ["Me, cheat? What a divine idea. And wrong.", "Oh! A suspicion. How divine."],
      demasque: ["Just a tiny little card. Divine, isn't it?", "Unmasked? What a divine word."],
      innocent: ["Innocent, and divine. Both come at a price.", "Divine. My cushion thanks you."],
      gagne: ["A divine pot! It's going in the window.", "Divine. Quite simply."],
    },
  },
  archibald: {
    fr: {
      accuse: ["Hou ! Objection. La pièce est authentique.", "Tricheur ? Une fois, deux fois… Non."],
      demasque: ["Hou. Un faux dans la collection. Retiré de la vente.", "Adjugé… à l'accusation. Hou."],
      innocent: ["Authentifié ! Hou hou. Frais d'expertise à régler.", "Certificat d'innocence. Adjugé !"],
      gagne: ["Une fois, deux fois… adjugé !", "Hou hou ! Le lot est pour moi."],
    },
    en: {
      accuse: ["Hoo! Objection. The piece is authentic.", "A cheat? Going once, going twice… No."],
      demasque: ["Hoo. A forgery in the collection. Withdrawn from sale.", "Sold… to the prosecution. Hoo."],
      innocent: ["Authenticated! Hoo hoo. Valuation fees are due.", "Certificate of innocence. Sold!"],
      gagne: ["Going once, going twice… sold!", "Hoo hoo! The lot is mine."],
    },
  },
};

// ---------------------------------------------------------------------------
// Les défis : chaque hôte provoque, puis remet sa cagnotte, ou garde sa table

export const HOST_TALK: Record<Host, Deux<HostVoice>> = {
  gaspard: {
    fr: {
      defi: "Un tête-à-tête ? Le vieux renard a plus d'un tour dans sa manche. Façon de parler.",
      revanche: "Encore ! Ma cagnotte est partie, mais ma fierté est restée. On rejoue ?",
      ruine: "Sapristi ! Plumé à mon propre comptoir. La cagnotte est là : {cagnotte}. Bien joué !",
      "ruine-encore": "Nom d'une sardine ! Encore plumé. Et plus de cagnotte à donner, cette fois.",
      vainqueur: "Ha ! Le renard garde son comptoir. La revanche, c'est quand on veut.",
    },
    en: {
      defi: "A head-to-head? The old fox has a trick or two up his sleeve. So to speak.",
      revanche: "Again! My kitty is gone, but my pride stayed behind. Another round?",
      ruine: "Blimey! Fleeced at my own counter. Here's the kitty: {cagnotte}. Well played!",
      "ruine-encore": "Suffering sardines! Fleeced again. And no kitty left to hand over this time.",
      vainqueur: "Ha! The fox keeps his counter. A rematch, any time.",
    },
  },
  ondine: {
    fr: {
      defi: "Un duel ? Je sers la citronnade d'une patte, et je vous plume de l'autre.",
      revanche: "Vous revenez. La cagnotte, elle, ne reviendra pas. Citronnade ?",
      ruine: "Ruinée avant le goûter. Voici la cagnotte : {cagnotte}. La citronnade reste payante.",
      "ruine-encore": "Encore ruinée. Je note : ne plus jouer avec les habitués.",
      vainqueur: "La maison gagne. Je vous sers une citronnade : elle console de tout.",
    },
    en: {
      defi: "A duel? I serve lemonade with one paw, and fleece you with the other.",
      revanche: "You're back. The kitty won't be. Lemonade?",
      ruine: "Ruined before teatime. Here is the kitty: {cagnotte}. The lemonade is still extra.",
      "ruine-encore": "Ruined again. Note to self: no more cards with the regulars.",
      vainqueur: "The house wins. Let me pour you a lemonade: it soothes everything.",
    },
  },
  hector: {
    fr: {
      defi: "Tête-à-tête. La maison ne perd jamais. Elle prête, parfois.",
      revanche: "Vous revoilà. La maison a noté votre jeu. Tout votre jeu.",
      ruine: "La maison perd. C'est noté. Sa cagnotte : {cagnotte}. Ne l'ébruitez pas.",
      "ruine-encore": "La maison perd encore. Elle ouvre une enquête. Sur elle-même.",
      vainqueur: "La maison gagne. Elle vous remercie. Sobrement.",
    },
    en: {
      defi: "Head-to-head. The house never loses. It lends, occasionally.",
      revanche: "You again. The house has noted your game. All of it.",
      ruine: "The house loses. Duly noted. Its kitty: {cagnotte}. Keep it quiet.",
      "ruine-encore": "The house loses again. It is opening an inquiry. Into itself.",
      vainqueur: "The house wins. It thanks you. Soberly.",
    },
  },
  baron: {
    fr: {
      defi: "Hmpf. Un duel. Je ne perds jamais. Et quand je perds, je boude.",
      revanche: "Hmpf. Encore vous. Plus de cagnotte. Il me reste ma mauvaise humeur.",
      ruine: "Hmpf. Ruiné. Prenez la cagnotte : {cagnotte}. Je ne pleure pas, c'est le cigare.",
      "ruine-encore": "Hmpf. Encore ruiné. Sortez. Non, restez. Hmpf.",
      vainqueur: "Hmpf. Gagné. Ne faites pas cette tête. Je la fais déjà.",
    },
    en: {
      defi: "Hmph. A duel. I never lose. And when I lose, I sulk.",
      revanche: "Hmph. You again. No kitty left. I still have my bad temper.",
      ruine: "Hmph. Ruined. Take the kitty: {cagnotte}. I'm not crying, it's the cigar.",
      "ruine-encore": "Hmph. Ruined again. Get out. No, stay. Hmph.",
      vainqueur: "Hmph. I win. Don't pull that face. I'm already pulling it.",
    },
  },
  auguste: {
    fr: {
      defi: "Un tête-à-tête, à minuit. Je parie sur moi. La moustache aussi.",
      revanche: "Une revanche ? J'avais parié sur votre retour. J'ai déjà gagné.",
      ruine: "Le Cercle s'incline. Voici la cagnotte : {cagnotte}. La moustache s'affaisse.",
      "ruine-encore": "Ruiné de nouveau. J'avais parié le contraire. Deux pertes.",
      vainqueur: "Le Cercle l'emporte. Avec les honneurs dus à l'adversaire.",
    },
    en: {
      defi: "A head-to-head, at midnight. My money is on me. So is the moustache's.",
      revanche: "A rematch? I had a wager on your return. I've won already.",
      ruine: "The Club bows. Here is the kitty: {cagnotte}. The moustache droops.",
      "ruine-encore": "Ruined once more. I had wagered otherwise. Two losses.",
      vainqueur: "The Club prevails. With all honours due to its opponent.",
    },
  },
  balthazar: {
    fr: {
      defi: "Un duel à bord ! Je n'ai jamais perdu en mer. À quai, c'est autre chose.",
      revanche: "Rembarquez ! La cagnotte a coulé, mais le pavillon flotte.",
      ruine: "Touché, coulé ! La cagnotte est à vous : {cagnotte}. Je garde le yacht.",
      "ruine-encore": "Coulé une deuxième fois ! Le yacht est insubmersible. Moi, moins.",
      vainqueur: "Victoire ! Je fais sonner la corne. Ne le prenez pas pour vous.",
    },
    en: {
      defi: "A duel on board! I've never lost at sea. In harbour, that's another matter.",
      revanche: "Back on board! The kitty has sunk, but the flag still flies.",
      ruine: "A direct hit! The kitty is yours: {cagnotte}. I'm keeping the yacht.",
      "ruine-encore": "Sunk a second time! The yacht is unsinkable. I, rather less so.",
      vainqueur: "Victory! I'm sounding the horn. Don't take it personally.",
    },
  },
  taupin: {
    fr: {
      defi: "Un tête-à-tête. Parlez bas. Je ne vois pas vos cartes. Ni les miennes.",
      revanche: "Vous revenez. J'ai rouvert le registre. La colonne des cagnottes est vide.",
      ruine: "Le compte y est : zéro pour moi. La cagnotte, {cagnotte}, change de colonne.",
      "ruine-encore": "Ruiné de nouveau. Je l'inscris. À l'encre rouge.",
      vainqueur: "La Banque l'emporte. C'est écrit. En tout petit.",
    },
    en: {
      defi: "A head-to-head. Speak softly. I can't see your cards. Or mine.",
      revanche: "You're back. I've reopened the ledger. The kitty column is empty.",
      ruine: "It all adds up: nought for me. The kitty, {cagnotte}, changes column.",
      "ruine-encore": "Ruined once more. I'm entering it. In red ink.",
      vainqueur: "The Bank prevails. It's in writing. In very small print.",
    },
  },
  selene: {
    fr: {
      defi: "Un duel, ici ? D'en haut, je vois toutes les cartes. Sauf les vôtres. Dommage.",
      revanche: "Vous revoilà tout là-haut. La cagnotte, elle, est restée en bas.",
      ruine: "Tiens. Je n'ai plus rien. La cagnotte flotte vers vous : {cagnotte}.",
      "ruine-encore": "Encore plus rien. Ici, c'est presque normal.",
      vainqueur: "J'ai gagné. Ou bien est-ce demain ? Ici, on ne sait jamais.",
    },
    en: {
      defi: "A duel, up here? From above, I see every card. Except yours. Pity.",
      revanche: "Back up here again. The kitty, though, stayed down below.",
      ruine: "Well. I have nothing left. The kitty is drifting your way: {cagnotte}.",
      "ruine-encore": "Nothing left, again. Up here, that's almost normal.",
      vainqueur: "I have won. Or is that tomorrow? One never knows, up here.",
    },
  },
};

// ---------------------------------------------------------------------------
// Piou, à la porte du hall : une seule consigne à la fois, toujours la prochaine étape utile

export const PIOU_HALL: Record<"accueil" | "fauche" | "assis", Deux<string>> = {
  /** Le sport national, en une phrase. */
  accueil: {
    fr: "Le sport national ! Ici, tout le monde triche. L'art, c'est de ne pas se faire prendre !",
    en: "The national sport! Everybody cheats here. The art is in not getting caught!",
  },
  /** La bourse ne couvre aucune cave. `{montant}` : ce qu'il faut pour la moins chère. */
  fauche: {
    fr: "Il vous faut {montant} pour vous asseoir. Un ticket ou deux, et à table !",
    en: "You need {montant} to take a seat. A ticket or two, and you're at the table!",
  },
  /** Le joueur est assis quelque part. */
  assis: {
    fr: "Votre place vous attend ! On ne fait pas patienter un tapis vert.",
    en: "Your seat is waiting! One doesn't keep a green baize waiting.",
  },
};

// ---------------------------------------------------------------------------
// Dire une réplique

function toLine(speaker: string, raw: string): Line {
  const gesture = raw.startsWith("~");
  return { speaker: speaker as Speaker, name: hostName(speaker), text: gesture ? raw.slice(1).trim() : raw, gesture };
}

function isBot(id: string): id is Bot {
  return id in TABLE_TALK;
}

function isHost(id: string): id is Host {
  return id in HOST_TALK;
}

/**
 * Ce qu'un personnage dit à table. `seed` fixe le choix parmi les variantes : la
 * réplique ne change pas d'un affichage à l'autre. `null` pour qui n'est pas un personnage.
 */
export function tableLine(bot: string | null, moment: TableMoment, seed = 0): Line | null {
  if (!bot || !isBot(bot)) return null;
  const list = TABLE_TALK[bot][lang()][moment];
  return toLine(bot, list[Math.abs(Math.floor(seed)) % list.length]!);
}

/** Ce qu'un hôte dit de son défi. `cagnotte` : la somme qu'il remet, déjà mise en forme. */
export function hostLine(host: string, moment: HostMoment, cagnotte = ""): Line | null {
  if (!isHost(host)) return null;
  return toLine(host, HOST_TALK[host][lang()][moment].replace(/\{cagnotte\}/g, cagnotte));
}

/** Ce que Piou dit à la porte du hall. `montant` : déjà mis en forme. */
export function piouHall(moment: keyof typeof PIOU_HALL, montant = ""): string {
  return PIOU_HALL[moment][lang()].replace(/\{montant\}/g, montant);
}
