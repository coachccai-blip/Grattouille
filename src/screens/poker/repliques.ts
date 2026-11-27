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

import "./anglais";
import { hostName, type Line, type Speaker } from "../../app/dialogues";
import { lang, type Lang } from "../../i18n";
import type { DuelStage } from "./calcul";

type Deux<T> = Record<Lang, T>;

/** Les moments où un personnage parle à table. */
export type TableMoment = "accuse" | "demasque" | "innocent" | "gagne";

/**
 * Les moments d'un hôte pendant un défi : l'ouverture du duel, quand il prend l'avantage,
 * quand il le perd, sa victoire, et sa défaite.
 */
export type DuelMoment = "ouverture" | "avantage" | "recul" | "victoire" | "defaite";

/** Une réplique par manche, puis celle de la revanche. */
type ParEtape = readonly [string, string, string, string];
/** Une réplique par manche : en revanche, on pioche parmi les trois. */
type ParManche = readonly [string, string, string];

interface DuelVoice {
  ouverture: ParEtape;
  avantage: ParManche;
  recul: ParManche;
  victoire: ParEtape;
  defaite: ParEtape;
}

export type Bot =
  | "gaspard" | "ondine" | "hector" | "baron" | "auguste" | "balthazar" | "taupin" | "selene"
  | "sidonie" | "enzo" | "colette" | "archibald";

export type Host = Exclude<Bot, "sidonie" | "enzo" | "colette" | "archibald">;

type Voice = Record<TableMoment, readonly string[]>;

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
// Les défis, en trois manches (LOT4.md, section 15). La mise double d'une manche à l'autre,
// et l'hôte change de ton : il toise à la première, il se pique à la deuxième, il joue son
// va-tout à la troisième. Battu trois fois, il rend les armes et promet de raconter son
// histoire (elle s'ouvre dans les Souvenirs) ; en revanche, il est beau joueur.
//
// Cinq moments : l'ouverture du duel (dite dans le hall, puis à la table), le moment où il
// prend l'avantage, celui où il le perd (deux répliques de table : 70 caractères au plus),
// sa victoire et sa défaite (deux bulles : 110 au plus). Chacune a sa version par manche,
// puis une pour la revanche ; l'avantage et le recul n'en ont que trois, la revanche y pioche.

export const DUEL_TALK: Record<Host, Deux<DuelVoice>> = {
  gaspard: {
    fr: {
      ouverture: [
        "Un tête-à-tête ? Le vieux renard a plus d'un tour dans sa manche. Façon de parler.",
        "Encore un tête-à-tête ! Cette fois je pose le double, et je range mon sourire de vendeur.",
        "Dernière manche ! Je mets tout le tiroir-caisse sur la table. Sapristi, j'ai le trac.",
        "Pour le plaisir, alors ? Entre vieux adversaires, on se doit bien ça. La chaise est restée chaude.",
      ],
      avantage: [
        "Le renard passe devant. Façon de parler.",
        "Ah ! Je reprends du poil de la bête. Du poil de renard.",
        "Je mène ! Nom d'une sardine, pourvu que ça dure.",
      ],
      recul: [
        "Tiens, on me passe devant. C'est la politesse de la maison.",
        "Sapristi. On me fait courir, à mon âge.",
        "Aïe. Le tiroir-caisse fond à vue d'œil.",
      ],
      victoire: [
        "Ha ! Le renard garde son comptoir. La revanche, c'est quand on veut.",
        "Le double reste au Kiosque ! La manche attend, la chaise aussi : c'est quand on veut.",
        "Ouf ! J'ai eu chaud aux moustaches. La dernière manche attend toujours, elle ne bouge pas.",
        "Celle-là est pour moi. Entre nous, ça fait du bien de temps en temps.",
      ],
      defaite: [
        "Sapristi ! Plumé à mon propre comptoir. Bien joué. La prochaine, je pose le double.",
        "Nom d'une sardine, deux fois ! Quel œil. Il me reste une manche pour me refaire.",
        "Trois fois ! Le renard rend les armes. Et il doit une histoire : la sienne.",
        "Encore plumé ! À ce train-là, le Kiosque va changer de patron. Façon de parler.",
      ],
    },
    en: {
      ouverture: [
        "A head-to-head? The old fox has a trick or two up his sleeve. So to speak.",
        "Back again! This time I'm putting up double, and putting away my salesman's smile.",
        "Last round, my friend. The whole till goes on the table. Blimey, I've got stage fright.",
        "Just for fun, then? Pull up a chair. Old opponents owe each other that much.",
      ],
      avantage: [
        "The fox takes the lead. So to speak.",
        "Ha! The old fox gets his second wind.",
        "I'm ahead! Suffering sardines, let it last.",
      ],
      recul: [
        "Well, you're in front. Call it the courtesy of the house.",
        "Blimey. Making me run, at my age.",
        "Ouch. The till is melting before my eyes.",
      ],
      victoire: [
        "Ha! The fox keeps his counter. A rematch, any time.",
        "The double stays at the Kiosk! Come back, my friend: I'll keep your seat warm.",
        "Phew! That singed my whiskers. The last round's still here, it's going nowhere.",
        "That one's mine. Between us, it does a fox good now and then.",
      ],
      defaite: [
        "Blimey! Fleeced at my own counter. Well played. Next time, I put up double.",
        "Suffering sardines, twice! You've a sharp eye. I've one round left to win it back.",
        "Three times! I lay down my cards, my friend. I owe you a story: my own.",
        "Fleeced again! At this rate you'll be the one running the Kiosk. So to speak.",
      ],
    },
  },
  ondine: {
    fr: {
      ouverture: [
        "Un duel ? Je sers la citronnade d'une patte, et je vous plume de l'autre.",
        "Vous revenez. J'ai doublé la mise, et posé le plateau. C'est dire si c'est sérieux.",
        "Dernière manche. Le Grand Café retient son souffle. Moi aussi, mais ça ne se voit pas.",
        "Une revanche. Je vous sers, je vous plume, ou l'inverse. On verra bien.",
      ],
      avantage: [
        "Je mène. Ne le dites pas trop fort, ça ferait jaser.",
        "L'avantage au service. C'est le métier.",
        "Je passe devant. Je reste calme. C'est ma spécialité.",
      ],
      recul: [
        "Vous menez. Je note. Je note tout.",
        "Tiens. On me dépasse. C'est nouveau, et c'est désagréable.",
        "Le plateau tangue. Ça n'arrive jamais.",
      ],
      victoire: [
        "La maison gagne. Je vous sers une citronnade : elle console de tout.",
        "Le double reste en salle. Revenez : la manche vous attend, la citronnade aussi.",
        "J'ai tenu. De justesse. Ne le répétez pas en terrasse. Vous retentez quand vous voulez.",
        "Cette fois, c'est pour moi. Je l'ajoute à l'ardoise des bons souvenirs.",
      ],
      defaite: [
        "Battue avant le goûter. C'est noté. La prochaine fois, je double la mise. Et la vigilance.",
        "Deux fois. Je commence à vous trouver des qualités. C'est agaçant.",
        "Trois fois. Je m'incline. Et puisque vous y tenez, je vous raconterai. Sans enthousiasme. Presque.",
        "Encore vous. Encore battue. À force, je vais finir par sourire.",
      ],
    },
    en: {
      ouverture: [
        "A duel? I serve lemonade with one paw, and fleece you with the other.",
        "You're back. I've doubled the stake, and put down the tray. That's how serious this is.",
        "Last round. The Grand Café is holding its breath. So am I, though it doesn't show.",
        "A rematch. I serve you, I fleece you, or the other way round. We shall see.",
      ],
      avantage: [
        "I'm ahead. Not too loud, people will talk.",
        "Advantage, service. It's the job.",
        "I take the lead. I stay calm. It's my speciality.",
      ],
      recul: [
        "You're ahead. Noted. I note everything.",
        "Well. Overtaken. That's new, and I don't care for it.",
        "The tray is wobbling. That never happens.",
      ],
      victoire: [
        "The house wins. Let me pour you a lemonade: it soothes everything.",
        "The double stays in the room. Come back: the round will wait, and so will the lemonade.",
        "I held on. Just. Don't repeat that on the terrace. Try again whenever you like.",
        "This one is mine. I'll add it to the slate of fond memories.",
      ],
      defaite: [
        "Beaten before teatime. Noted. Next time, I double the stake. And the vigilance.",
        "Twice. I'm starting to see qualities in you. It's irritating.",
        "Three times. I yield. And since you insist, I shall tell you my story. Without enthusiasm. Almost.",
        "You again. Beaten again. Keep this up and I may end up smiling.",
      ],
    },
  },
  hector: {
    fr: {
      ouverture: [
        "Tête-à-tête. La maison ne perd jamais. Elle prête, parfois.",
        "Deuxième manche. La maison double la mise. Elle a aussi doublé d'attention.",
        "Dernière manche. La maison joue son va-tout. Il n'était jamais sorti du coffre.",
        "Une revanche. La maison vous reçoit comme elle reçoit ses habitués. C'est sa plus haute distinction.",
      ],
      avantage: [
        "La maison mène. C'est l'ordre des choses.",
        "~ Hector aligne ses jetons. Au millimètre.",
        "La maison respire. Brièvement.",
      ],
      recul: [
        "La maison est menée. Elle le note au crayon.",
        "~ Hector rajuste sa visière. Deux fois.",
        "La maison vacille. Elle n'a pas de procédure pour ça.",
      ],
      victoire: [
        "La maison gagne. Elle vous remercie. Sobrement.",
        "La maison garde le double. Elle vous attend pour la même manche. Sans rancune, par principe.",
        "La maison a tenu. Elle ne dira pas de combien. La dernière manche reste ouverte.",
        "La maison gagne celle-ci. Elle s'autorise un sourire. Intérieur.",
      ],
      defaite: [
        "La maison perd. C'est noté. À la prochaine manche, elle double la mise.",
        "La maison perd encore. Elle ouvre une enquête. Sur elle-même.",
        "Trois manches. La maison s'incline. Hector, lui, vous doit une histoire. Hors registre.",
        "La maison perd. Elle commence à en avoir l'habitude. Elle déteste les habitudes.",
      ],
    },
    en: {
      ouverture: [
        "Head-to-head. The house never loses. It lends, occasionally.",
        "Second round. The house doubles the stake. It has doubled its attention, too.",
        "Last round. The house goes all or nothing. That had never left the vault before.",
        "A rematch. The house receives you as it receives its regulars. It has no higher honour.",
      ],
      avantage: [
        "The house leads. As is only natural.",
        "~ Hector lines up his chips. To the millimetre.",
        "The house breathes. Briefly.",
      ],
      recul: [
        "The house is behind. It notes that in pencil.",
        "~ Hector adjusts his visor. Twice.",
        "The house wobbles. It has no procedure for that.",
      ],
      victoire: [
        "The house wins. It thanks you. Soberly.",
        "The house keeps the double. It awaits you for the same round. No hard feelings, on principle.",
        "The house held. It will not say by how much. The last round remains open.",
        "The house wins this one. It permits itself a smile. An inward one.",
      ],
      defaite: [
        "The house loses. Duly noted. Next round, it doubles the stake.",
        "The house loses again. It is opening an inquiry. Into itself.",
        "Three rounds. The house yields. Hector himself owes you a story. Off the books.",
        "The house loses. It is getting used to it. It loathes habits.",
      ],
    },
  },
  baron: {
    fr: {
      ouverture: [
        "Hmpf. Un duel. Je ne perds jamais. Et quand je perds, je boude.",
        "Hmpf. Encore vous. Je double la mise. Et je boude d'avance, pour gagner du temps.",
        "Hmpf. Dernière manche. Je joue tout. Même le cigare. Hmpf. Surtout pas le cigare.",
        "Hmpf. Une revanche. Asseyez-vous. Vous êtes à peu près tout ce que je supporte.",
      ],
      avantage: ["Hmpf. Je mène. Normal.", "Hmpf. Devant. Je ne souris pas, c'est un tic.", "Hmpf. Je mène. Ne touchez à rien."],
      recul: [
        "Hmpf. Derrière. Provisoirement.",
        "Hmpf. Vous menez. Je boude. Je joue quand même.",
        "Hmpf. Ça sent le roussi. C'est le cigare. Hmpf.",
      ],
      victoire: [
        "Hmpf. Gagné. Ne faites pas cette tête. Je la fais déjà.",
        "Hmpf. Le double reste ici. Revenez. Hmpf. Je n'ai pas dit s'il vous plaît.",
        "Hmpf. J'ai eu peur. Ne le répétez pas. La dernière manche vous attend. Moi aussi.",
        "Hmpf. Gagné. Pour une fois. Laissez-moi savourer. En silence.",
      ],
      defaite: [
        "Hmpf. Battu. Bien joué. Hmpf. La prochaine, je double. Et je boude déjà.",
        "Hmpf. Deux fois. Je ne pleure pas, c'est le cigare. Il me reste une manche.",
        "Hmpf. Trois fois. Je me rends. Je vous raconterai. Tout. Hmpf. Ne le dites à personne.",
        "Hmpf. Encore battu. Sortez. Non, restez. Hmpf.",
      ],
    },
    en: {
      ouverture: [
        "Hmph. A duel. I never lose. And when I lose, I sulk.",
        "Hmph. You again. I double the stake. And I'm sulking in advance, to save time.",
        "Hmph. Last round. I stake the lot. Even the cigar. Hmph. Not the cigar.",
        "Hmph. A rematch. Sit down. You're very nearly all I can stand.",
      ],
      avantage: ["Hmph. I lead. Naturally.", "Hmph. In front. I'm not smiling, it's a twitch.", "Hmph. I'm ahead. Touch nothing."],
      recul: [
        "Hmph. Behind. For now.",
        "Hmph. You lead. I'm sulking. I'm still playing.",
        "Hmph. Something's burning. It's the cigar. Hmph.",
      ],
      victoire: [
        "Hmph. I win. Don't pull that face. I'm already pulling it.",
        "Hmph. The double stays here. Come back. Hmph. I didn't say please.",
        "Hmph. I was worried. Don't repeat that. The last round awaits you. So do I.",
        "Hmph. I win. For once. Let me savour it. In silence.",
      ],
      defaite: [
        "Hmph. Beaten. Well played. Hmph. Next time I double. And I'm sulking already.",
        "Hmph. Twice. I'm not crying, it's the cigar. I've one round left.",
        "Hmph. Three times. I surrender. I shall tell you. Everything. Hmph. Tell no one.",
        "Hmph. Beaten again. Get out. No, stay. Hmph.",
      ],
    },
  },
  auguste: {
    fr: {
      ouverture: [
        "Un tête-à-tête, à minuit. Je parie sur moi. La moustache aussi.",
        "Vous revoilà. Je double la mise, et la moustache est cirée de frais. Je parie encore sur moi.",
        "La dernière manche ! Je mise tout, jusqu'à l'honneur du Cercle. La moustache en tremble.",
        "Une revanche entre gens d'honneur. Je parie que nous y prendrons plaisir. Pari tenu ?",
      ],
      avantage: [
        "Je mène. J'avais parié là-dessus.",
        "La moustache se redresse. Je passe devant.",
        "Je mène d'une courte moustache. Qu'elle tienne !",
      ],
      recul: [
        "Vous menez. Pari perdu. Un petit.",
        "La moustache frémit. Vous prenez le large.",
        "Diable. La moustache s'affaisse d'un cran.",
      ],
      victoire: [
        "Le Cercle l'emporte. Avec les honneurs dus à l'adversaire.",
        "Le double reste au Cercle. Je parie que vous reviendrez. La manche vous attend.",
        "Le Cercle a tenu, d'un poil de moustache. Vous retenterez, je le parie. J'y compte.",
        "Le Cercle gagne celle-ci. Les honneurs sont partagés, je vous l'accorde.",
      ],
      defaite: [
        "Le Cercle s'incline. J'avais parié le contraire. Je doublerai la mise, pour l'honneur.",
        "Battu deux fois ! Plus personne ne parie sur moi. Pas même la moustache.",
        "Trois manches. Le Cercle rend les armes. Je vous dois une histoire : pari tenu, parole donnée.",
        "Battu de nouveau. J'avais parié sur vous, cette fois. Enfin un pari gagné.",
      ],
    },
    en: {
      ouverture: [
        "A head-to-head, at midnight. My money is on me. So is the moustache's.",
        "Here you are again. I double the stake, and the moustache is freshly waxed. My money is still on me.",
        "The last round! I stake everything, down to the honour of the Club. The moustache trembles.",
        "A rematch between people of honour. I wager we shall enjoy it. Are we on?",
      ],
      avantage: [
        "I lead. I had money on that.",
        "The moustache perks up. I move ahead.",
        "I lead by a short whisker. May it hold!",
      ],
      recul: [
        "You lead. A wager lost. A small one.",
        "The moustache quivers. You're pulling away.",
        "Good heavens. The moustache droops a notch.",
      ],
      victoire: [
        "The Club prevails. With all honours due to its opponent.",
        "The double stays at the Club. I wager you'll be back. The round awaits you.",
        "The Club held, by a whisker. You will try again, I'd wager. I'm counting on it.",
        "The Club wins this one. The honours are shared, I grant you.",
      ],
      defaite: [
        "The Club bows. I had wagered otherwise. I shall double the stake, for honour's sake.",
        "Beaten twice! Nobody bets on me any more. Not even the moustache.",
        "Three rounds. The Club lays down its arms. I owe you a story: a wager kept, a word given.",
        "Beaten once more. I had my money on you, this time. A wager won, at last.",
      ],
    },
  },
  balthazar: {
    fr: {
      ouverture: [
        "Un duel à bord ! Je n'ai jamais perdu en mer. À quai, c'est autre chose.",
        "Rembarquez ! Je double la mise et je hisse le grand pavillon. Cette fois, je barre moi-même.",
        "Dernière manche ! Toutes voiles dehors, je mise la cale entière. Tenez bon la rampe !",
        "Une revanche ! Montez à bord. Vous connaissez le chemin du pont, et le pont vous connaît.",
      ],
      avantage: [
        "Vent arrière ! Je prends le large.",
        "Cap tenu ! Le Commodore passe devant.",
        "Terre en vue ! Je mène d'une encablure.",
      ],
      recul: [
        "Vous virez en tête. Le vent tournera.",
        "On prend l'eau ! Tous aux pompes !",
        "Avarie ! Le Commodore écope à la casquette.",
      ],
      victoire: [
        "Victoire ! Je fais sonner la corne. Ne le prenez pas pour vous.",
        "Le double reste en cale ! Revenez par la passerelle : la manche vous attend à quai.",
        "J'ai tenu la barre, de justesse ! La dernière manche reste à quai. Je vous y attends.",
        "Celle-ci est pour le yacht ! Un coup de corne, un seul. Par amitié.",
      ],
      defaite: [
        "Touché ! Belle manœuvre. À la prochaine manche, je double la mise et la vigie.",
        "Coulé une deuxième fois ! Le yacht est insubmersible. Moi, moins.",
        "Trois fois par le fond ! J'amène le pavillon. Je vous dois une histoire : celle du Commodore.",
        "Encore coulé ! À ce compte-là, je vous nomme second. Vingt et un coups de corne !",
      ],
    },
    en: {
      ouverture: [
        "A duel on board! I've never lost at sea. In harbour, that's another matter.",
        "Back on board! I double the stake and hoist the great flag. This time, I take the helm myself.",
        "Last round! Full sail, I stake the whole hold. Hold on to the rail!",
        "A rematch! Come aboard. You know the way to the deck, and the deck knows you.",
      ],
      avantage: [
        "Wind astern! I'm pulling away.",
        "Steady as she goes! The Commodore leads.",
        "Land ho! I lead by a cable's length.",
      ],
      recul: [
        "You round the buoy first. The wind will turn.",
        "We're taking on water! All hands to the pumps!",
        "Damage! The Commodore is bailing with his cap.",
      ],
      victoire: [
        "Victory! I'm sounding the horn. Don't take it personally.",
        "The double stays in the hold! Come back up the gangway: the round awaits you at the quay.",
        "I held the helm, only just! The last round stays moored. I'll be waiting there.",
        "This one is for the yacht! One blast of the horn, just one. Out of friendship.",
      ],
      defaite: [
        "A hit! Fine seamanship. Next round, I double the stake and the lookout.",
        "Sunk a second time! The yacht is unsinkable. I, rather less so.",
        "Sent to the bottom three times! I strike my colours. I owe you a story: the Commodore's own.",
        "Sunk again! At this rate I'm making you first mate. Twenty-one blasts of the horn!",
      ],
    },
  },
  taupin: {
    fr: {
      ouverture: [
        "Un tête-à-tête. Parlez bas. Je ne vois pas vos cartes. Ni les miennes.",
        "Vous revenez. J'ai doublé la mise. Et changé de lunettes. Parlez toujours bas.",
        "La dernière manche. Je mise tout le coffre. Chut. Même le coffre ne le sait pas.",
        "Une revanche. Je vous ai ouvert une colonne à votre nom. Elle est très remplie.",
      ],
      avantage: [
        "Je mène. C'est écrit. Au crayon, pour l'instant.",
        "La colonne de gauche grossit. C'est la mienne.",
        "Je mène. Chut. Ne le dites pas aux chiffres.",
      ],
      recul: [
        "Vous menez. Je le note. À la mine de plomb.",
        "Ma colonne maigrit. Je n'aime pas ça. Tout bas.",
        "L'encre rouge approche. Je l'entends.",
      ],
      victoire: [
        "La Banque l'emporte. C'est écrit. En tout petit.",
        "Le double reste au coffre. Revenez. J'ai laissé la ligne ouverte. Au crayon.",
        "La Banque a tenu. À une virgule près. La dernière manche reste inscrite à votre nom.",
        "Celle-ci est pour la Banque. Je l'inscris. Avec une petite fleur dans la marge.",
      ],
      defaite: [
        "Le compte y est : battu. À la prochaine manche, je double la mise. C'est déjà inscrit.",
        "Battu deux fois. Je l'inscris. À l'encre rouge. Il me reste une ligne.",
        "Trois manches. Je referme le registre. Et j'ouvre un autre livre : je vous dois mon histoire.",
        "Battu de nouveau. Je n'inscris plus rien. Je vous serre la patte. Tout bas.",
      ],
    },
    en: {
      ouverture: [
        "A head-to-head. Speak softly. I can't see your cards. Or mine.",
        "You're back. I've doubled the stake. And changed my glasses. Do keep your voice down.",
        "The last round. I stake the whole vault. Hush. Even the vault doesn't know.",
        "A rematch. I've opened a column in your name. It is very full.",
      ],
      avantage: [
        "I lead. It's in writing. In pencil, for now.",
        "The left-hand column is growing. That's mine.",
        "I lead. Hush. Don't tell the figures.",
      ],
      recul: [
        "You lead. I'm noting it. In soft pencil.",
        "My column is thinning. I don't like it. Quietly.",
        "The red ink is coming. I can hear it.",
      ],
      victoire: [
        "The Bank prevails. It's in writing. In very small print.",
        "The double stays in the vault. Come back. I've left the line open. In pencil.",
        "The Bank held. By a decimal point. The last round is still entered in your name.",
        "This one is for the Bank. I'm entering it. With a little flower in the margin.",
      ],
      defaite: [
        "It all adds up: beaten. Next round, I double the stake. It's already entered.",
        "Beaten twice. I'm entering it. In red ink. I've one line left.",
        "Three rounds. I close the ledger. And open another book: I owe you my story.",
        "Beaten once more. I'm entering nothing now. I shake your paw. Quietly.",
      ],
    },
  },
  selene: {
    fr: {
      ouverture: [
        "Un duel, ici ? D'en haut, je vois toutes les cartes. Sauf les vôtres. Dommage.",
        "Vous revoilà tout là-haut. J'ai doublé la mise : d'ici, tout paraît plus léger, même l'argent.",
        "La dernière manche. Je mise tout ce qui brille. La Terre s'est tournée pour regarder.",
        "Une revanche ? Ici, c'est toujours un peu la première fois. Asseyez-vous donc.",
      ],
      avantage: [
        "Je mène. C'est la marée : elle monte pour moi.",
        "Je passe devant, sur la pointe des pattes.",
        "Je mène. La Terre retient son souffle. Moi aussi.",
      ],
      recul: [
        "Vous menez. D'ici, on dirait une étoile filante.",
        "Tiens. Je décroche. C'est mon côté lunaire.",
        "Je décline. Comme un croissant. C'est de saison.",
      ],
      victoire: [
        "J'ai gagné. Ou bien est-ce demain ? Ici, on ne sait jamais.",
        "Le double reste sur la Lune. Revenez : ici, la manche ne vieillit pas.",
        "J'ai tenu. À un rayon près. La dernière manche vous attend, elle flotte encore.",
        "Celle-ci est pour moi. Je l'accroche là-haut, parmi les jolies soirées.",
      ],
      defaite: [
        "Battue. Tiens. D'en haut, je ne l'avais pas vu venir. La prochaine fois, je double la mise.",
        "Deux fois. Vous jouez comme on tombe : sans effort. Il me reste une manche, et la nuit entière.",
        "Trois fois. Je dépose les armes, elles flottent déjà. Je vous dois une histoire. Elle vient de loin.",
        "Battue encore. Ici, c'est presque une tradition. Elle me plaît bien.",
      ],
    },
    en: {
      ouverture: [
        "A duel, up here? From above, I see every card. Except yours. Pity.",
        "Back up here again. I've doubled the stake: from here everything feels lighter, even money.",
        "The last round. I stake everything that shines. The Earth has turned to watch.",
        "A rematch? Up here, it's always a little like the first time. Do sit down.",
      ],
      avantage: [
        "I lead. It's the tide: it rises for me.",
        "I slip ahead, on tiptoe.",
        "I lead. The Earth is holding its breath. So am I.",
      ],
      recul: [
        "You lead. From here, you look like a shooting star.",
        "Well. I'm drifting off. It's my lunar side.",
        "I'm waning. Like a crescent. It's the season.",
      ],
      victoire: [
        "I have won. Or is that tomorrow? One never knows, up here.",
        "The double stays on the Moon. Come back: up here, the round never ages.",
        "I held on. By a moonbeam. The last round awaits you, it's still floating.",
        "This one is mine. I'll hang it up there, among the lovely evenings.",
      ],
      defaite: [
        "Beaten. Well. From above, I didn't see that coming. Next time, I double the stake.",
        "Twice. You play the way one falls: effortlessly. I've one round left, and the whole night.",
        "Three times. I lay down my arms, they're floating already. I owe you a story. It comes from afar.",
        "Beaten again. Up here, that's almost a tradition. I rather like it.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Une table de défi ouverte avant les trois manches se règle comme avant : l'hôte ruiné
// remet sa cagnotte (`{cagnotte}`), une fois. Plus aucune nouvelle table ne passe par là.

export const KITTY_TALK: Record<Host, Deux<string>> = {
  gaspard: {
    fr: "Sapristi ! Plumé à mon propre comptoir. La cagnotte est là : {cagnotte}. Bien joué !",
    en: "Blimey! Fleeced at my own counter. Here's the kitty: {cagnotte}. Well played!",
  },
  ondine: {
    fr: "Ruinée avant le goûter. Voici la cagnotte : {cagnotte}. La citronnade reste payante.",
    en: "Ruined before teatime. Here is the kitty: {cagnotte}. The lemonade is still extra.",
  },
  hector: {
    fr: "La maison perd. C'est noté. Sa cagnotte : {cagnotte}. Ne l'ébruitez pas.",
    en: "The house loses. Duly noted. Its kitty: {cagnotte}. Keep it quiet.",
  },
  baron: {
    fr: "Hmpf. Ruiné. Prenez la cagnotte : {cagnotte}. Je ne pleure pas, c'est le cigare.",
    en: "Hmph. Ruined. Take the kitty: {cagnotte}. I'm not crying, it's the cigar.",
  },
  auguste: {
    fr: "Le Cercle s'incline. Voici la cagnotte : {cagnotte}. La moustache s'affaisse.",
    en: "The Club bows. Here is the kitty: {cagnotte}. The moustache droops.",
  },
  balthazar: {
    fr: "Touché, coulé ! La cagnotte est à vous : {cagnotte}. Je garde le yacht.",
    en: "A direct hit! The kitty is yours: {cagnotte}. I'm keeping the yacht.",
  },
  taupin: {
    fr: "Le compte y est : zéro pour moi. La cagnotte, {cagnotte}, change de colonne.",
    en: "It all adds up: nought for me. The kitty, {cagnotte}, changes column.",
  },
  selene: {
    fr: "Tiens. Je n'ai plus rien. La cagnotte flotte vers vous : {cagnotte}.",
    en: "Well. I have nothing left. The kitty is drifting your way: {cagnotte}.",
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
  return id in DUEL_TALK;
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

/**
 * Ce qu'un hôte dit pendant son défi, selon la manche. `seed` : en revanche, l'avantage et
 * le recul piochent parmi les répliques des trois manches. `null` pour qui n'est pas un hôte.
 */
export function duelLine(host: string | null, moment: DuelMoment, stage: DuelStage, seed = 0): Line | null {
  if (!host || !isHost(host)) return null;
  const lines: readonly string[] = DUEL_TALK[host][lang()][moment];
  const index = stage === "revanche" ? (lines.length > 3 ? 3 : Math.abs(Math.floor(seed)) % lines.length) : stage - 1;
  return toLine(host, lines[index]!);
}

/** Une table d'avant les trois manches : l'hôte ruiné remet sa cagnotte. `cagnotte` : la somme, déjà mise en forme. */
export function kittyLine(host: string | null, cagnotte: string): Line | null {
  if (!host || !isHost(host)) return null;
  return toLine(host, KITTY_TALK[host][lang()].replace(/\{cagnotte\}/g, cagnotte));
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
