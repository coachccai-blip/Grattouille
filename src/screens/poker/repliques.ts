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
// La Table des Maîtres : quatre des huit hôtes, tirés au sort, que le joueur a déjà tous
// ruinés une fois. Chacun a un mot en s'asseyant (`assis`), en quittant le tournoi les
// poches vides (`elimine`), quand le joueur prend toute la table (`victoire`), et quand
// c'est le joueur qui n'a plus rien (`defaite` : jamais une moquerie, toujours une
// invitation à revenir). Le premier tient en 60 caractères : les quatre se lisent ensemble,
// deux lignes chacun, à la place du tapis d'un écran de 320 px. Les deux suivants tiennent en
// 70 : ils se lisent à table, ou à quatre sur le panneau de la victoire. Le dernier a la place
// d'une bulle.

/** Les moments d'un maître à la Table des Maîtres. */
export type MastersMoment = "assis" | "elimine" | "victoire" | "defaite";

type MastersVoice = Record<MastersMoment, string>;

export const MASTERS_TALK: Record<Host, Deux<MastersVoice>> = {
  gaspard: {
    fr: {
      assis: "La grande table ! Qui garde le kiosque ? Oh, une mouette !",
      elimine: "Sapristi ! Plumé jusqu'à la queue. Je retourne vendre des tickets.",
      victoire: "Nom d'une sardine, toute la table ! Et tout a commencé au port.",
      defaite: "Sapristi, la table est dure ce soir. Un ticket, un tour au port, et on remet ça !",
    },
    en: {
      assis: "The big table! Who's minding the kiosk? Oh, a seagull!",
      elimine: "Blimey! Plucked to the tail. Back to selling tickets for me.",
      victoire: "Suffering sardines, the whole table! And it all began at the harbour.",
      defaite: "Blimey, a tough table tonight. A ticket, a stroll round the harbour, and we go again!",
    },
  },
  ondine: {
    fr: {
      assis: "Quatre maîtres à servir, et vous à plumer. Sans citronnade.",
      elimine: "Plus un jeton. Je retourne aux citronnades. Elles, au moins, restent.",
      victoire: "Toute la table. Je vous sers une citronnade. Offerte, pour une fois.",
      defaite: "Plus rien devant vous. Cela arrive aux meilleurs, le mardi surtout. Citronnade, puis revanche ?",
    },
    en: {
      assis: "Four masters to serve, and you to fleece. No lemonade.",
      elimine: "Not a chip left. Back to my lemonades. They, at least, stay put.",
      victoire: "The whole table. Let me pour you a lemonade. On the house, for once.",
      defaite: "Nothing left in front of you. It happens to the best, Tuesdays especially. Lemonade, then a rematch?",
    },
  },
  hector: {
    fr: {
      assis: "La maison prend place. Elle a compté les cartes. Deux fois.",
      elimine: "~ Hector ôte sa visière. La maison s'incline.",
      victoire: "La maison a tout perdu. Elle applaudit. Sobrement.",
      defaite: "La maison garde la table. Elle vous rouvre la porte quand vous voulez. Elle note tout, même les revanches.",
    },
    en: {
      assis: "The house takes its seat. It has counted the cards. Twice.",
      elimine: "~ Hector takes off his visor. The house bows.",
      victoire: "The house has lost everything. It applauds. Soberly.",
      defaite: "The house keeps the table. Its door reopens whenever you like. It notes everything, rematches included.",
    },
  },
  baron: {
    fr: {
      assis: "Hmpf. Vous m'avez déjà ruiné une fois. Ce soir, je mords.",
      elimine: "Hmpf. Sorti. Je boude, mais je reste regarder.",
      victoire: "Hmpf. Les quatre d'un coup. Bien joué. Je ne le répéterai pas.",
      defaite: "Hmpf. Ne faites pas cette tête. Revenez : j'ai horreur de gagner sans vous.",
    },
    en: {
      assis: "Hmph. You've ruined me once already. Tonight, I bite.",
      elimine: "Hmph. Out. I'm sulking, but I'm staying to watch.",
      victoire: "Hmph. All four at once. Well played. I shan't say it twice.",
      defaite: "Hmph. Don't pull that face. Come back: I can't stand winning without you.",
    },
  },
  auguste: {
    fr: {
      assis: "J'ai parié sur vous. La moustache, elle, parie sur moi.",
      elimine: "Éliminé. J'avais parié là-dessus : au moins, je gagne quelque chose.",
      victoire: "Toute la table ! Mon pari rapporte. La moustache s'incline.",
      defaite: "J'ai perdu mon pari sur vous. Je le double à votre retour : la moustache insiste.",
    },
    en: {
      assis: "My money is on you. The moustache's money is on me.",
      elimine: "Knocked out. I had a wager on it: at least I win something.",
      victoire: "The whole table! My wager pays off. The moustache bows.",
      defaite: "I've lost my wager on you. I'm doubling it for your return: the moustache insists.",
    },
  },
  balthazar: {
    fr: {
      assis: "Branle-bas de combat ! Je hisse le grand pavois.",
      elimine: "Coulé corps et biens ! Je regarde la suite depuis la vigie.",
      victoire: "Toute la flotte est à vous ! Vingt et un coups de corne !",
      defaite: "Vous voilà à l'eau, mais on repêche toujours les bons marins. Remontez à bord quand vous voulez !",
    },
    en: {
      assis: "Clear the decks! I'm hoisting every flag.",
      elimine: "Sunk with all hands! I'll watch the rest from the crow's nest.",
      victoire: "The whole fleet is yours! Twenty-one blasts of the horn!",
      defaite: "You're overboard, but good sailors always get fished out. Come back aboard whenever you like!",
    },
  },
  taupin: {
    fr: {
      assis: "Chut. J'ai ouvert un registre exprès : cinq lignes.",
      elimine: "Solde : zéro. Je ferme ma colonne. Proprement.",
      victoire: "Tout passe dans votre colonne. Jamais je n'ai écrit si gros chiffre.",
      defaite: "Votre colonne est à zéro. Ce n'est qu'une écriture : je garde la page ouverte pour votre retour.",
    },
    en: {
      assis: "Hush. I've opened a ledger specially: five lines.",
      elimine: "Balance: nil. I'm closing my column. Neatly.",
      victoire: "It all moves to your column. I have never written so large a figure.",
      defaite: "Your column stands at nil. It's only an entry: I'm keeping the page open for your return.",
    },
  },
  selene: {
    fr: {
      assis: "Quatre maîtres, une table : d'ici, une constellation.",
      elimine: "Je n'ai plus rien. Je flotte un peu plus haut, voilà tout.",
      victoire: "Tout monte vers vous, ce soir. Même la Terre a l'air de regarder.",
      defaite: "Vous n'avez plus rien. Ici, on appelle cela une nouvelle lune : elle revient toujours. Vous aussi, j'espère.",
    },
    en: {
      assis: "Four masters, one table: from here, a constellation.",
      elimine: "I have nothing left. I float a little higher, that's all.",
      victoire: "Everything rises to you tonight. Even the Earth seems to be watching.",
      defaite: "You have nothing left. Up here, we call that a new moon: it always comes back. So will you, I hope.",
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

/** Ce qu'un maître dit à la Table des Maîtres. `null` pour qui n'est pas l'un des huit hôtes. */
export function mastersLine(host: string | null, moment: MastersMoment): Line | null {
  if (!host || !isHost(host)) return null;
  return toLine(host, MASTERS_TALK[host][lang()][moment]);
}

/** Ce que Piou dit à la porte du hall. `montant` : déjà mis en forme. */
export function piouHall(moment: keyof typeof PIOU_HALL, montant = ""): string {
  return PIOU_HALL[moment][lang()].replace(/\{montant\}/g, montant);
}
