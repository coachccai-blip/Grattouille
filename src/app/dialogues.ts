// Répliques des personnages, en français et en anglais (RECIT.md ; BRIEF.md, section 4.8
// et annexe B).
//
// Le récit : une seule journée qui n'en finit pas, du matin sur le port au lever de
// Terre sur la Lune, et un mystère qui court d'un bout à l'autre. Quelqu'un sème des
// tickets sur le chemin du joueur ; chaque personnage a sa théorie, glissée de temps
// en temps dans son accueil. C'est Gaspard : le patron du Kiosque laisse toujours
// tomber un ticket pour qui débarque sans rien. Il l'avoue en remettant les clés.
//
// Les personnages changent de registre à mesure que les portes s'ouvrent : familier
// jusqu'au Casino (130 ★), poli jusqu'au Salon Privé (400 ★), déférent jusqu'au Cercle
// (1 400 ★), obséquieux ensuite, et « cosmique » à partir de la Banque (15 000 ★),
// quand la fortune du joueur dépasse l'entendement. Un personnage qui n'a pas de
// réplique dans un registre prend celle du registre le plus proche.
//
// Conventions :
// - chaque personnage a ses deux versions côte à côte, `fr` puis `en`, de même forme
//   (mêmes situations, mêmes registres, même nombre de variantes : un test le vérifie) ;
// - `{pseudo}` est remplacé par le pseudo du joueur ; une réplique qui commence par
//   « ~ » est un geste, pas une parole : elle s'affiche sans guillemets ;
// - 110 caractères au plus, une idée par réplique. Les hôtes vouvoient, sauf Gaspard
//   et Enzo au registre familier. On ne se moque jamais de qui perd : c'est le ticket
//   qui a tort ;
// - rien n'est figé à l'import : tout se lit dans la langue courante au moment où on
//   le demande, parce que la langue peut changer en cours de partie.
// Piou, lui, ne change jamais de ton.

import { CATALOG, itemById } from "../../shared/catalog";
import { formatEuros, formatInt } from "../../shared/format";
import { PLACES, placeById } from "../../shared/places";
import { registerOf, type Register } from "../../shared/rules";
import type { PlaceId } from "../../shared/types";
import { lang, pick, type Lang } from "../i18n";

export type Speaker =
  | "piou" | "gaspard" | "ondine" | "hector" | "baron" | "auguste" | "balthazar" | "taupin" | "selene"
  | "sidonie" | "enzo" | "colette" | "archibald";

export type Situation = "accueil" | "vendu" | "perdu" | "gagne" | "gros" | "jackpot";

/** Tous ceux qui ont un comptoir : les huit hôtes et les quatre vendeurs. */
type Host = Exclude<Speaker, "piou">;

type Lines = Partial<Record<Register, readonly string[]>>;
type Script = Partial<Record<Situation, Lines>>;
/** La même chose dans les deux langues. */
type Deux<T> = Record<Lang, T>;

const NAMES: Deux<Record<Speaker, string>> = {
  fr: {
    piou: "Piou",
    gaspard: "Gaspard",
    ondine: "Ondine",
    hector: "Hector",
    baron: "Le Baron",
    auguste: "Sir Auguste",
    balthazar: "Le Commodore",
    taupin: "Maître Taupin",
    selene: "Dame Séléné",
    sidonie: "Mlle Sidonie",
    enzo: "Enzo",
    colette: "Mme Colette",
    archibald: "Maître Archibald",
  },
  en: {
    piou: "Piou",
    gaspard: "Gaspard",
    ondine: "Ondine",
    hector: "Hector",
    baron: "The Baron",
    auguste: "Sir Auguste",
    balthazar: "The Commodore",
    taupin: "Maître Taupin",
    selene: "Dame Séléné",
    sidonie: "Mlle Sidonie",
    enzo: "Enzo",
    colette: "Mme Colette",
    archibald: "Maître Archibald",
  },
};

const HOUSE: Deux<string> = { fr: "La maison", en: "The house" };

/** Le nom d'un personnage, tel qu'il s'écrit au-dessus d'une bulle ou en tête de phrase. */
export function hostName(id: string): string {
  return pick(NAMES)[id as Speaker] ?? pick(HOUSE);
}

// ---------------------------------------------------------------------------
// Gaspard, vieux renard argenté : bonimenteur au grand cœur. Il tutoie tant qu'on est
// du quartier. Quand on lui parle des tickets par terre, il change de sujet.

const GASPARD: Deux<Script> = {
  fr: {
    accueil: {
      familier: [
        "Approche, mon grand, c'est ici que ça se passe !",
        "Te revoilà ! J'ai du tout frais, du tout chaud.",
        "Quatre tickets, quatre façons d'avoir de la chance. Choisis !",
      ],
      poli: [
        "Bonjour, {pseudo}. Que puis-je vous proposer ?",
        "Ravi de vous revoir, {pseudo}. La chance vous attendait.",
        "Prenez votre temps, {pseudo}. Les tickets, eux, ne bougent pas.",
      ],
      deferent: [
        "Quel honneur de revoir {pseudo} à mon humble kiosque.",
        "J'ai mis de côté les plus beaux pour {pseudo}.",
        "Si {pseudo} veut bien jeter un œil à ma modeste sélection…",
      ],
      obsequieux: [
        "Votre Excellence au kiosque ! Je fais dérouler le tapis.",
        "Que Votre Excellence me pardonne la poussière sur le comptoir.",
        "Le port tout entier retient son souffle, Excellence.",
      ],
      cosmique: [
        "Votre Immensité ! Au kiosque ! Je m'assois, la tête me tourne.",
        "On vous voit depuis la Lune, Votre Immensité. Et vous revenez chez moi.",
        "Je ne sais plus compter vos zéros, Votre Immensité. Je compte sur mes pattes. Il m'en manque.",
      ],
    },
    vendu: {
      familier: [
        "Tiens, mon grand. Gratte-moi ça !",
        "Et un ticket tout chaud pour la compagnie !",
        "Celui-là, je le sens bien. Vas-y !",
      ],
      poli: [
        "Voici pour vous, {pseudo}. Bonne chance.",
        "Le voici, {pseudo}. Grattez sans crainte.",
        "Un excellent choix, {pseudo}, si je puis me permettre.",
      ],
      deferent: [
        "Si {pseudo} veut bien se donner la peine de gratter…",
        "Je l'ai choisi moi-même pour {pseudo}.",
        "Qu'il porte bonheur à {pseudo}, comme il se doit.",
      ],
      obsequieux: [
        "Que Votre Excellence daigne effleurer ce modeste ticket.",
        "Il n'est pas digne de Votre Excellence, mais il fera de son mieux.",
        "Je l'ai fait repasser ce matin, Excellence.",
      ],
      cosmique: [
        "Un ticket à trois sous, Votre Immensité. Vous êtes sûre ? Sûr ? Je ne sais plus rien.",
        "Je l'encadrerais bien, Votre Immensité, mais vous allez le gratter.",
        "Prenez-en soin, Votre Immensité : il est tout intimidé.",
      ],
    },
    perdu: {
      familier: [
        "Raté ! Celui-là avait la tête ailleurs.",
        "Ah, celui-là dormait. Ça arrive.",
        "Bah ! La mer aussi a ses jours sans poisson.",
      ],
      poli: [
        "Pas de chance. Le suivant sera le bon.",
        "Ce n'était pas son jour, {pseudo}. Au ticket, je veux dire.",
        "Un ticket timide. Cela arrive aux meilleurs.",
      ],
      deferent: [
        "Ce ticket ne vous méritait pas.",
        "Je présente mes excuses à {pseudo} au nom de ce ticket.",
        "Il sera sévèrement réprimandé, croyez-moi.",
      ],
      obsequieux: [
        "Je fais renvoyer l'imprimeur, Excellence.",
        "Ce ticket a manqué à tous ses devoirs, Excellence.",
        "Qu'on l'emporte. Votre Excellence ne doit plus le voir.",
      ],
      cosmique: [
        "Un ticket vide, Votre Immensité ? Je le signale aux autorités. C'est-à-dire à vous.",
        "Il n'a rien donné, Votre Immensité. Devant vous, il a perdu ses moyens.",
        "Ce ticket démissionne, Votre Immensité. Je viens d'accepter.",
      ],
    },
    gagne: {
      familier: ["Et voilà le travail !", "Ha ! Le port te réussit, on dirait.", "Ça rentre, mon grand, ça rentre !"],
      poli: ["Félicitations, {pseudo}.", "Voilà qui fait plaisir à voir, {pseudo}.", "Bien joué, {pseudo}. Vraiment."],
      deferent: [
        "La chance reconnaît les siens.",
        "{pseudo} a la main heureuse, comme toujours.",
        "Je n'en attendais pas moins de {pseudo}.",
      ],
      obsequieux: [
        "Le ticket s'incline, Excellence.",
        "C'était la moindre des choses, Excellence.",
        "Il n'a fait que son devoir, Excellence.",
      ],
      cosmique: [
        "Un gain de plus, Votre Immensité. Je ne sais plus où vous les rangez.",
        "Le ticket a fait de son mieux, Votre Immensité. Il tremblait.",
        "Quelques euros de plus, Votre Immensité. La Lune ne s'en apercevra pas.",
      ],
    },
    gros: {
      familier: ["Sapristi ! Regarde-moi ça !", "Nom d'une sardine ! Bravo, mon grand !", "~ Gaspard applaudit des deux pattes."],
      poli: [
        "Magnifique, {pseudo} ! J'en ai la visière de travers.",
        "Bravo, {pseudo} ! Le port va en parler.",
        "~ Gaspard applaudit, la visière de travers.",
      ],
      deferent: [
        "Quel coup ! {pseudo} honore mon kiosque.",
        "Je le ferai graver sur le comptoir.",
        "~ Gaspard applaudit avec déférence.",
      ],
      obsequieux: [
        "Votre Excellence fait pâlir le soleil du port.",
        "Je n'ose applaudir trop fort, Excellence.",
        "~ Gaspard applaudit, incliné jusqu'au comptoir.",
      ],
      cosmique: [
        "Un gros lot, Votre Immensité ! Ici ! Le store en a les rayures qui frisent.",
        "~ Gaspard applaudit, puis vérifie que le kiosque tient debout.",
      ],
    },
    jackpot: {
      familier: ["Le jackpot ! Chez moi ! Je vais le dire à tout le port !", "~ Gaspard lance sa visière en l'air."],
      poli: ["Le jackpot, {pseudo} ! Le jackpot !", "~ Gaspard lance sa visière en l'air."],
      deferent: ["Le jackpot ! {pseudo} entre dans la légende du kiosque.", "~ Gaspard ôte sa visière, très ému."],
      obsequieux: ["Le jackpot ! Que Votre Excellence me permette un cri de joie.", "~ Gaspard ôte sa visière et s'incline."],
      cosmique: [
        "Le jackpot, Votre Immensité ! Au kiosque ! Je ferme : je n'ai plus de monnaie.",
        "~ Gaspard lance sa visière. Elle ne redescend pas.",
      ],
    },
  },
  en: {
    accueil: {
      familier: [
        "Step right up, sunshine, this is where it all happens!",
        "Back again! I've got them fresh, I've got them hot.",
        "Four tickets, four ways to get lucky. Take your pick!",
      ],
      poli: [
        "Good day, {pseudo}. What can I offer you?",
        "Lovely to see you again, {pseudo}. Luck's been waiting for you.",
        "Take your time, {pseudo}. The tickets aren't going anywhere.",
      ],
      deferent: [
        "What an honour to see {pseudo} at my humble kiosk again.",
        "I've kept the finest ones aside for {pseudo}.",
        "If {pseudo} would care to glance at my modest selection…",
      ],
      obsequieux: [
        "Your Excellency, at the kiosk! I'll have the carpet rolled out.",
        "May Your Excellency forgive the dust on the counter.",
        "The whole harbour is holding its breath, Excellency.",
      ],
      cosmique: [
        "Your Immensity! At the kiosk! I must sit down, my head is spinning.",
        "They can see you from the Moon, Your Immensity. And still you come back to me.",
        "I can't count your zeros any more, Your Immensity. I use my paws. I'm several paws short.",
      ],
    },
    vendu: {
      familier: [
        "Here you go, sunshine. Get scratching!",
        "One piping-hot ticket, coming right up!",
        "I've a good feeling about this one. Go on!",
      ],
      poli: [
        "Here you are, {pseudo}. Good luck.",
        "There it is, {pseudo}. Scratch without fear.",
        "An excellent choice, {pseudo}, if I may say so.",
      ],
      deferent: [
        "If {pseudo} would be so kind as to scratch…",
        "I picked it out myself for {pseudo}.",
        "May it bring {pseudo} luck, as is only proper.",
      ],
      obsequieux: [
        "May Your Excellency deign to brush this humble ticket.",
        "It isn't worthy of Your Excellency, but it will do its best.",
        "I had it ironed this morning, Excellency.",
      ],
      cosmique: [
        "A penny ticket, Your Immensity. Are you certain? I'm not certain of anything any more.",
        "I'd have it framed, Your Immensity, but you're about to scratch it.",
        "Be gentle with it, Your Immensity: it's rather starstruck.",
      ],
    },
    perdu: {
      familier: [
        "A dud! That one had its head elsewhere.",
        "Ah, that one was fast asleep. It happens.",
        "Bah! Even the sea has its days without fish.",
      ],
      poli: [
        "Bad luck. The next one's the one.",
        "It wasn't its day, {pseudo}. The ticket's, I mean.",
        "A shy ticket. It happens to the best of them.",
      ],
      deferent: [
        "That ticket did not deserve you.",
        "I apologise to {pseudo} on that ticket's behalf.",
        "It will be severely reprimanded, believe me.",
      ],
      obsequieux: [
        "I shall have the printer dismissed, Excellency.",
        "That ticket has failed in every one of its duties, Excellency.",
        "Take it away. Your Excellency must never see it again.",
      ],
      cosmique: [
        "An empty ticket, Your Immensity? I'll report it to the authorities. That is to say, you.",
        "It gave nothing, Your Immensity. In your presence, it lost its nerve.",
        "That ticket has resigned, Your Immensity. I have just accepted.",
      ],
    },
    gagne: {
      familier: ["And that's how it's done!", "Ha! The harbour agrees with you, it seems.", "It's rolling in, sunshine, it's rolling in!"],
      poli: ["Congratulations, {pseudo}.", "Now that's a pleasure to see, {pseudo}.", "Well played, {pseudo}. Truly."],
      deferent: [
        "Luck knows its own.",
        "{pseudo} has the golden touch, as ever.",
        "I expected nothing less of {pseudo}.",
      ],
      obsequieux: [
        "The ticket bows, Excellency.",
        "It was the least it could do, Excellency.",
        "It has merely done its duty, Excellency.",
      ],
      cosmique: [
        "Another win, Your Immensity. I can't think where you keep them all.",
        "The ticket did its very best, Your Immensity. It was trembling.",
        "A few more euros, Your Immensity. The Moon will never notice.",
      ],
    },
    gros: {
      familier: ["Blimey! Would you look at that!", "Suffering sardines! Bravo, sunshine!", "~ Gaspard claps with both paws."],
      poli: [
        "Magnificent, {pseudo}! It's knocked my visor sideways.",
        "Bravo, {pseudo}! The whole harbour will hear of this.",
        "~ Gaspard applauds, visor askew.",
      ],
      deferent: [
        "What a win! {pseudo} does my kiosk proud.",
        "I shall have it engraved on the counter.",
        "~ Gaspard applauds, deferentially.",
      ],
      obsequieux: [
        "Your Excellency puts the harbour sun to shame.",
        "I dare not clap too loudly, Excellency.",
        "~ Gaspard applauds, bowing right down to the counter.",
      ],
      cosmique: [
        "A big win, Your Immensity! Here! The awning's stripes have gone curly.",
        "~ Gaspard applauds, then checks the kiosk is still standing.",
      ],
    },
    jackpot: {
      familier: ["The jackpot! At my kiosk! I'm telling the whole harbour!", "~ Gaspard throws his visor in the air."],
      poli: ["The jackpot, {pseudo}! The jackpot!", "~ Gaspard throws his visor in the air."],
      deferent: ["The jackpot! {pseudo} enters kiosk legend.", "~ Gaspard removes his visor, deeply moved."],
      obsequieux: ["The jackpot! If Your Excellency would permit me one cry of joy.", "~ Gaspard removes his visor and bows."],
      cosmique: [
        "The jackpot, Your Immensity! At the kiosk! I'm closing: I've run out of change.",
        "~ Gaspard throws his visor in the air. It doesn't come down.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Ondine, loutre en tablier blanc : pince-sans-rire. Pour elle, les tickets par terre,
// c'est le vent du large.

const ONDINE: Deux<Script> = {
  fr: {
    accueil: {
      familier: [
        "Je vous sers quoi ?",
        "Asseyez-vous où vous voulez. Enfin, où il reste une chaise.",
        "La citronnade est fraîche. Les tickets aussi.",
      ],
      poli: [
        "Qu'est-ce que je vous sers, {pseudo} ?",
        "Votre table vous attendait, {pseudo}. Elle s'ennuyait.",
        "Bonjour, {pseudo}. La maison a du ticket du jour.",
      ],
      deferent: [
        "La meilleure table est pour {pseudo}. Je viens de la décider.",
        "J'ai fait presser les citrons à la main pour {pseudo}.",
        "{pseudo} en terrasse. Les autres clients se tiennent mieux, d'un coup.",
      ],
      obsequieux: [
        "Votre Excellence désire-t-elle la terrasse entière ?",
        "J'ai fait repeindre les chaises, Excellence. On ne sait jamais.",
        "Le Grand Café n'était que Moyen avant Votre Excellence.",
      ],
      cosmique: [
        "Votre Immensité. J'ai agrandi la terrasse. Elle déborde sur le département voisin.",
        "La citronnade de Votre Immensité : un citron par verre, un verger par citron.",
        "Votre Immensité en terrasse. Le soleil a demandé la permission de se coucher.",
      ],
    },
    vendu: {
      familier: ["Tenez. Ne le trempez pas dans la citronnade.", "Voilà. Grattez, je regarde ailleurs.", "Un ticket, un. Servi."],
      poli: [
        "Voici, {pseudo}. Servi sans supplément.",
        "Et un ticket pour la table de {pseudo}.",
        "Le voilà. Je vous laisse en tête-à-tête.",
      ],
      deferent: [
        "Servi sur plateau, comme il convient à {pseudo}.",
        "Je l'ai tenu au frais pour {pseudo}.",
        "Un ticket bien né, pour {pseudo}.",
      ],
      obsequieux: [
        "Sur plateau d'argent, Excellence. Le plateau est offert.",
        "Je l'ai goûté avant, Excellence. Enfin, regardé.",
        "Qu'il soit à la hauteur de Votre Excellence. J'en doute.",
      ],
      cosmique: [
        "Votre ticket, Votre Immensité. Le plateau est en or. Le ticket est gêné.",
        "Servi, Votre Immensité. J'ai fait taire la terrasse.",
        "Je vous l'apporte moi-même, Votre Immensité. Le plateau n'osait pas.",
      ],
    },
    perdu: {
      familier: ["Vide. Comme ma tirelire.", "Rien. Il faisait le fier, pourtant.", "Ça, c'est un ticket décoratif."],
      poli: [
        "Rien dessous. Je le note sur l'ardoise des déceptions.",
        "Un ticket sans conversation, {pseudo}.",
        "Il n'a rien donné. Je ne le félicite pas.",
      ],
      deferent: [
        "Ce ticket ne sera plus servi dans cet établissement.",
        "{pseudo} mérite mieux. Le ticket le sait.",
        "Je le renvoie en cuisine.",
      ],
      obsequieux: [
        "Un ticket indigne. Je le fais expulser de la terrasse, Excellence.",
        "Il a honte, Excellence. Je l'ai vu rougir.",
        "Que Votre Excellence l'oublie. Moi, je n'oublierai pas.",
      ],
      cosmique: [
        "Rien, Votre Immensité. Je le raye de la carte. Et de la carte du monde.",
        "Un ticket vide devant Votre Immensité. Il a du cran. Il n'a que ça.",
        "Je débarrasse, Votre Immensité. Vous n'avez rien vu. Moi non plus.",
      ],
    },
    gagne: {
      familier: [
        "Tiens, tiens. Ça paie, la terrasse.",
        "Pas mal. Je ne dis pas bravo, mais je le pense.",
        "Voilà. La citronnade porte chance.",
      ],
      poli: ["Bien vu, {pseudo}.", "Voilà qui règle l'addition, {pseudo}.", "Je le savais. Enfin, je l'espérais."],
      deferent: [
        "{pseudo} gagne avec une élégance folle.",
        "La chance a très bon goût.",
        "Un gain servi à point pour {pseudo}.",
      ],
      obsequieux: [
        "Le ticket a compris à qui il avait affaire, Excellence.",
        "Évidemment, Excellence.",
        "Il n'aurait pas osé faire autrement.",
      ],
      cosmique: [
        "Gagné, Votre Immensité. Je le note. Je n'ai plus de place sur l'ardoise.",
        "Encore un gain, Votre Immensité. La routine. J'adore votre routine.",
        "Le ticket a payé, Votre Immensité. Il a même laissé un pourboire.",
      ],
    },
    gros: {
      familier: [
        "Ah oui. Quand même.",
        "~ Ondine applaudit, le plateau sous le bras.",
        "Ça, c'est une tournée générale. Non ? Tant pis.",
      ],
      poli: [
        "Joli. Très joli, {pseudo}.",
        "~ Ondine applaudit sans lâcher son plateau.",
        "J'en ai renversé un verre, {pseudo}. C'est vous dire.",
      ],
      deferent: [
        "{pseudo} fait trembler les arcades.",
        "~ Ondine applaudit et pose enfin son plateau.",
        "Toute la terrasse s'est retournée. Moi la première.",
      ],
      obsequieux: [
        "Les arcades s'inclinent, Excellence. Moi aussi, un peu.",
        "~ Ondine applaudit avec une solennité inhabituelle.",
        "Je ferai porter le champagne, Excellence. Enfin, la citronnade.",
      ],
      cosmique: [
        "Un gros lot, Votre Immensité. Les arcades demandent un autographe.",
        "~ Ondine pose son plateau sur un nuage qui passait.",
      ],
    },
    jackpot: {
      familier: ["Le jackpot. Ici. Je m'assois deux minutes.", "~ Ondine lâche son plateau. C'est la première fois."],
      poli: ["Le jackpot, {pseudo}. Je ne plaisante jamais avec ça.", "~ Ondine lâche son plateau. C'est la première fois."],
      deferent: ["Le jackpot ! {pseudo}, la maison est sans voix. Sauf moi.", "~ Ondine ôte son tablier et salue."],
      obsequieux: ["Le jackpot, Excellence. Je fais rebaptiser le café.", "~ Ondine ôte son tablier et salue très bas."],
      cosmique: [
        "Le jackpot, Votre Immensité. J'offre la citronnade. À toute la galaxie.",
        "~ Ondine lâche son plateau. Les verres restent en l'air, par respect.",
      ],
    },
  },
  en: {
    accueil: {
      familier: [
        "What'll it be?",
        "Sit wherever you like. Well, wherever there's a chair left.",
        "The lemonade is fresh. So are the tickets.",
      ],
      poli: [
        "What can I get you, {pseudo}?",
        "Your table's been waiting, {pseudo}. It was getting bored.",
        "Afternoon, {pseudo}. The ticket of the day is on the board.",
      ],
      deferent: [
        "The best table is for {pseudo}. I've just decided which one that is.",
        "I had the lemons squeezed by hand for {pseudo}.",
        "{pseudo}, on the terrace. The other customers are suddenly sitting up straight.",
      ],
      obsequieux: [
        "Would Your Excellency care for the entire terrace?",
        "I had the chairs repainted, Excellency. One never knows.",
        "The Grand Café was merely Medium before Your Excellency.",
      ],
      cosmique: [
        "Your Immensity. I've extended the terrace. It now spills into the next county.",
        "Your Immensity's lemonade: one lemon per glass, one orchard per lemon.",
        "Your Immensity, on the terrace. The sun has asked permission to set.",
      ],
    },
    vendu: {
      familier: ["Here. Don't dip it in the lemonade.", "There. Scratch away, I'm not looking.", "One ticket. Served."],
      poli: [
        "Here you are, {pseudo}. Served at no extra charge.",
        "And one ticket for {pseudo}'s table.",
        "There it is. I'll leave you two alone.",
      ],
      deferent: [
        "Served on a tray, as befits {pseudo}.",
        "I've been keeping it chilled for {pseudo}.",
        "A ticket of good family, for {pseudo}.",
      ],
      obsequieux: [
        "On a silver tray, Excellency. The tray is on the house.",
        "I tasted it first, Excellency. Well, looked at it.",
        "May it live up to Your Excellency. I have my doubts.",
      ],
      cosmique: [
        "Your ticket, Your Immensity. The tray is solid gold. The ticket is embarrassed.",
        "Served, Your Immensity. I've hushed the terrace.",
        "I'm bringing it myself, Your Immensity. The tray didn't dare.",
      ],
    },
    perdu: {
      familier: ["Empty. Like my piggy bank.", "Nothing. And it looked so pleased with itself.", "That one's purely decorative."],
      poli: [
        "Nothing under there. I'll chalk it up on the board of disappointments.",
        "A ticket with no conversation, {pseudo}.",
        "It gave nothing. I shan't be congratulating it.",
      ],
      deferent: [
        "That ticket will no longer be served in this establishment.",
        "{pseudo} deserves better. The ticket knows it.",
        "I'm sending it back to the kitchen.",
      ],
      obsequieux: [
        "An unworthy ticket. I'll have it thrown off the terrace, Excellency.",
        "It's ashamed, Excellency. I saw it blush.",
        "Your Excellency may forget it. I shall not.",
      ],
      cosmique: [
        "Nothing, Your Immensity. I'm striking it off the menu. And off the map.",
        "An empty ticket, in front of Your Immensity. It has nerve. That is all it has.",
        "I'll clear it away, Your Immensity. You saw nothing. Neither did I.",
      ],
    },
    gagne: {
      familier: [
        "Well, well. The terrace pays.",
        "Not bad. I won't say bravo, but I'm thinking it.",
        "There. Lemonade brings luck.",
      ],
      poli: ["Nicely done, {pseudo}.", "That should cover the bill, {pseudo}.", "I knew it. Well, I hoped."],
      deferent: [
        "{pseudo} wins with outrageous elegance.",
        "Luck has excellent taste.",
        "A win, done to a turn, for {pseudo}.",
      ],
      obsequieux: [
        "The ticket understood whom it was dealing with, Excellency.",
        "Naturally, Excellency.",
        "It wouldn't have dared do otherwise.",
      ],
      cosmique: [
        "A win, Your Immensity. I'm chalking it up. I've run out of board.",
        "Another win, Your Immensity. Routine. I do love your routine.",
        "The ticket paid up, Your Immensity. It even left a tip.",
      ],
    },
    gros: {
      familier: [
        "Oh. Well now.",
        "~ Ondine claps, tray tucked under her arm.",
        "That calls for drinks all round. No? Pity.",
      ],
      poli: [
        "Nice. Very nice, {pseudo}.",
        "~ Ondine claps without letting go of her tray.",
        "I spilled a glass, {pseudo}. That's how good it was.",
      ],
      deferent: [
        "{pseudo} is making the arcades tremble.",
        "~ Ondine claps and, at long last, puts down her tray.",
        "The whole terrace turned round. Me first.",
      ],
      obsequieux: [
        "The arcades bow, Excellency. So do I, slightly.",
        "~ Ondine applauds with unusual solemnity.",
        "I'll send over the champagne, Excellency. Well, the lemonade.",
      ],
      cosmique: [
        "A big win, Your Immensity. The arcades would like an autograph.",
        "~ Ondine sets her tray down on a passing cloud.",
      ],
    },
    jackpot: {
      familier: ["The jackpot. Here. I need to sit down for two minutes.", "~ Ondine drops her tray. It has never happened before."],
      poli: ["The jackpot, {pseudo}. I never joke about that.", "~ Ondine drops her tray. It has never happened before."],
      deferent: ["The jackpot! {pseudo}, the house is speechless. Except me.", "~ Ondine takes off her apron and bows."],
      obsequieux: ["The jackpot, Excellency. I'm having the café renamed.", "~ Ondine takes off her apron and bows very low."],
      cosmique: [
        "The jackpot, Your Immensity. Lemonade's on me. For the entire galaxy.",
        "~ Ondine drops her tray. The glasses stay in the air, out of respect.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Hector, héron croupier : impassible. Il compte tout, même les tickets que la maison
// n'a pas perdus.

const HECTOR: Deux<Script> = {
  fr: {
    accueil: {
      poli: ["Faites vos jeux.", "~ Hector hoche la tête, à peine.", "Bonsoir, {pseudo}. Les jeux sont ouverts."],
      deferent: [
        "La table de {pseudo} est prête.",
        "~ Hector incline la visière d'un centimètre.",
        "Bonsoir. La maison est honorée. Discrètement.",
      ],
      obsequieux: [
        "La jetée entière est à Votre Excellence.",
        "~ Hector incline la visière de deux centimètres.",
        "Votre Excellence. Les jeux n'attendaient que vous.",
      ],
      cosmique: [
        "Votre Immensité. La maison a agrandi la table. Et la jetée.",
        "~ Hector incline la visière de trois centimètres. Un record.",
        "Bonsoir, Votre Immensité. Le soleil se couche. Par égard.",
      ],
    },
    vendu: {
      poli: ["Les jeux sont faits.", "Un ticket. Bonne chance.", "~ Hector fait glisser le ticket sur le feutre."],
      deferent: [
        "Pour {pseudo}. Rien ne va plus.",
        "Le ticket de {pseudo}. Je n'ajoute rien.",
        "~ Hector fait glisser le ticket avec deux doigts.",
      ],
      obsequieux: [
        "Pour Votre Excellence. La maison retient son souffle.",
        "Ce ticket connaît son rang, Excellence.",
        "~ Hector présente le ticket sur le râteau du croupier.",
      ],
      cosmique: [
        "Pour Votre Immensité. La maison retient la marée.",
        "Votre ticket, Votre Immensité. Il mesure sa chance.",
        "~ Hector présente le ticket. Il a mis des gants. Deux paires.",
      ],
    },
    perdu: {
      poli: ["La maison garde la mise. Pour une fois.", "Rien.", "~ Hector ramasse le ticket sans un mot."],
      deferent: [
        "Un accident de parcours.",
        "Ce ticket ne reflète pas l'opinion de la maison.",
        "~ Hector fait disparaître le ticket avec tact.",
      ],
      obsequieux: [
        "La maison présente ses regrets, Excellence.",
        "Ce ticket sera interdit de casino.",
        "~ Hector escamote le ticket, mortifié.",
      ],
      cosmique: [
        "Rien. La maison ouvre une enquête, Votre Immensité.",
        "La maison est navrée, Votre Immensité. C'est une première.",
        "~ Hector escamote le ticket. Puis la table. Par précaution.",
      ],
    },
    gagne: {
      poli: ["Payé.", "La banque paie.", "~ Hector pousse les pièces vers vous."],
      deferent: [
        "Payé, avec les compliments de la table.",
        "La banque paie {pseudo}. Volontiers.",
        "~ Hector pousse les pièces, impeccable.",
      ],
      obsequieux: [
        "La banque paie, Excellence. Elle en est fière.",
        "Payé. La maison vous remercie de gagner.",
        "~ Hector aligne les pièces au cordeau.",
      ],
      cosmique: [
        "Payé, Votre Immensité. La banque a l'habitude. Elle s'y fait.",
        "La banque paie, Votre Immensité. Elle voudrait un reçu. Pour y croire.",
        "~ Hector pousse les pièces avec un râteau plus grand.",
      ],
    },
    gros: {
      poli: ["~ Il lève un sourcil.", "~ Hector lève un sourcil. Puis l'autre.", "Tiens."],
      deferent: ["Félicitations.", "Félicitations. Je le dis rarement.", "~ Hector applaudit, trois fois, pas une de plus."],
      obsequieux: [
        "La maison s'incline.",
        "La maison s'incline. Moi aussi.",
        "~ Hector ôte sa visière. Personne n'avait jamais vu ça.",
      ],
      cosmique: [
        "La maison s'incline, Votre Immensité. Elle ne se relèvera pas tout de suite.",
        "~ Hector lève les deux sourcils. Ils restent en haut.",
      ],
    },
    jackpot: {
      poli: ["Jackpot. C'est le mot.", "~ Hector lève les deux sourcils."],
      deferent: ["Jackpot. Toutes mes félicitations.", "~ Hector ôte sa visière."],
      obsequieux: ["Jackpot. La banque saute, Excellence. Avec plaisir.", "~ Hector ôte sa visière et la pose sur son cœur."],
      cosmique: [
        "Jackpot. La banque saute, Votre Immensité. La jetée aussi.",
        "~ Hector sourit. Les témoins ne sont pas d'accord entre eux.",
      ],
    },
  },
  en: {
    accueil: {
      poli: ["Place your bets.", "~ Hector nods. Barely.", "Good evening, {pseudo}. The tables are open."],
      deferent: [
        "{pseudo}'s table is ready.",
        "~ Hector tips his visor by one centimetre.",
        "Good evening. The house is honoured. Discreetly.",
      ],
      obsequieux: [
        "The entire pier is at Your Excellency's disposal.",
        "~ Hector tips his visor by two centimetres.",
        "Your Excellency. The tables were waiting for you alone.",
      ],
      cosmique: [
        "Your Immensity. The house has enlarged the table. And the pier.",
        "~ Hector tips his visor by three centimetres. A record.",
        "Good evening, Your Immensity. The sun is setting. Out of respect.",
      ],
    },
    vendu: {
      poli: ["The bets are placed.", "One ticket. Good luck.", "~ Hector slides the ticket across the baize."],
      deferent: [
        "For {pseudo}. No more bets.",
        "{pseudo}'s ticket. I shall add nothing.",
        "~ Hector slides the ticket over with two fingers.",
      ],
      obsequieux: [
        "For Your Excellency. The house holds its breath.",
        "This ticket knows its place, Excellency.",
        "~ Hector presents the ticket on the croupier's rake.",
      ],
      cosmique: [
        "For Your Immensity. The house is holding back the tide.",
        "Your ticket, Your Immensity. It is aware of its good fortune.",
        "~ Hector presents the ticket. He is wearing gloves. Two pairs.",
      ],
    },
    perdu: {
      poli: ["The house keeps the stake. For once.", "Nothing.", "~ Hector collects the ticket without a word."],
      deferent: [
        "A minor mishap.",
        "That ticket does not reflect the views of the house.",
        "~ Hector makes the ticket disappear, tactfully.",
      ],
      obsequieux: [
        "The house offers its regrets, Excellency.",
        "That ticket will be barred from the casino.",
        "~ Hector spirits the ticket away, mortified.",
      ],
      cosmique: [
        "Nothing. The house is opening an inquiry, Your Immensity.",
        "The house is sorry, Your Immensity. This is a first.",
        "~ Hector spirits away the ticket. Then the table. To be safe.",
      ],
    },
    gagne: {
      poli: ["Paid.", "The bank pays.", "~ Hector pushes the coins towards you."],
      deferent: [
        "Paid, with the table's compliments.",
        "The bank pays {pseudo}. Gladly.",
        "~ Hector pushes the coins across, impeccably.",
      ],
      obsequieux: [
        "The bank pays, Excellency. And is proud to.",
        "Paid. The house thanks you for winning.",
        "~ Hector lines the coins up with a ruler.",
      ],
      cosmique: [
        "Paid, Your Immensity. The bank is used to it. It is coping.",
        "The bank pays, Your Immensity. It would like a receipt. To believe it.",
        "~ Hector pushes the coins across with a larger rake.",
      ],
    },
    gros: {
      poli: ["~ He raises an eyebrow.", "~ Hector raises an eyebrow. Then the other.", "Well."],
      deferent: ["Congratulations.", "Congratulations. I seldom say it.", "~ Hector claps three times. Not once more."],
      obsequieux: [
        "The house bows.",
        "The house bows. So do I.",
        "~ Hector removes his visor. Nobody has ever seen that.",
      ],
      cosmique: [
        "The house bows, Your Immensity. It may be some time getting up.",
        "~ Hector raises both eyebrows. They stay up.",
      ],
    },
    jackpot: {
      poli: ["Jackpot. That is the word.", "~ Hector raises both eyebrows."],
      deferent: ["Jackpot. My sincere congratulations.", "~ Hector removes his visor."],
      obsequieux: ["Jackpot. You've broken the bank, Excellency. A pleasure.", "~ Hector removes his visor and holds it to his heart."],
      cosmique: [
        "Jackpot. You've broken the bank, Your Immensity. And the pier.",
        "~ Hector smiles. Witnesses disagree.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Le Baron, bouledogue en smoking : bourru, et il fond en larmes aux gros gains.
// Semer des tickets sur un quai, il trouve cela d'un commun.

const BARON: Deux<Script> = {
  fr: {
    accueil: {
      deferent: ["Hmpf. Entrez. Essuyez vos pattes.", "C'est privé, ici. Mais pour {pseudo}, soit.", "Asseyez-vous. Le velours ne mord pas."],
      obsequieux: [
        "Votre Excellence. Hmpf. Je veux dire : bienvenue.",
        "Le salon est à vous. Je ne le dis à personne d'autre.",
        "J'ai fait tirer les rideaux pour Votre Excellence.",
      ],
      cosmique: [
        "Votre Immensité. Hmpf. J'ai fait capitonner le plafond. Vous prenez de la place.",
        "Entrez, Votre Immensité. Le velours s'est levé tout seul.",
        "Hmpf. Votre Immensité. Je grogne, mais c'est de joie.",
      ],
    },
    vendu: {
      deferent: ["Tenez. Grattez proprement.", "Voilà. Ne me remerciez pas.", "Un ticket. Du sérieux, celui-là."],
      obsequieux: [
        "Pour Votre Excellence. Hmpf. Avec respect.",
        "Le meilleur du coffre, Excellence.",
        "Je vous le confie. Il vaut cher. Vous aussi.",
      ],
      cosmique: [
        "Pour Votre Immensité. Hmpf. Je l'ai gardé contre mon cœur. Ne le répétez pas.",
        "Tenez, Votre Immensité. Il est repassé. Moi aussi.",
      ],
    },
    perdu: {
      deferent: [
        "Hmpf. Ça arrive. Je n'aime pas ça non plus.",
        "Rien. Je le mords, si vous voulez.",
        "Ce ticket ne remettra pas les pattes ici.",
      ],
      obsequieux: [
        "Inadmissible. J'en parle au fabricant, Excellence.",
        "Je suis furieux pour vous, Excellence.",
        "Hmpf. Ce ticket me déçoit personnellement.",
      ],
      cosmique: [
        "Rien. Hmpf. Je le fais bannir du système solaire, Votre Immensité.",
        "Ce ticket vous a manqué de respect, Votre Immensité. Je le mords. Voilà. C'est fait.",
        "Hmpf. Je grogne pour vous, Votre Immensité. C'est compris dans le service.",
      ],
    },
    gagne: {
      deferent: ["Hmpf. Bien.", "Pas mal. Ne le répétez pas.", "Voilà. C'est mérité."],
      obsequieux: [
        "Bien joué, Excellence. Hmpf.",
        "Je suis content. Ça ne se voit pas, mais je le suis.",
        "C'est bien. C'est très bien.",
      ],
      cosmique: [
        "Hmpf. Gagné, Votre Immensité. Je remue la queue. Intérieurement.",
        "Bien. Très bien. Hmpf. Ne me regardez pas sourire.",
        "C'est mérité, Votre Immensité. Tout l'est, à ce prix-là.",
      ],
    },
    gros: {
      deferent: ["Hmpf. Je… Bravo. Voilà.", "~ Le Baron applaudit en regardant ailleurs.", "Beau coup. J'ai quelque chose dans la gorge."],
      obsequieux: [
        "Magnifique, Excellence. Je ne pleure pas.",
        "~ Le Baron applaudit et renifle bruyamment.",
        "~ Le Baron ôte son haut-de-forme, la truffe humide.",
      ],
      cosmique: [
        "Hmpf. Votre Immensité. Je… Pardon. C'est beau, tous ces zéros.",
        "~ Le Baron renifle. Le lustre tremble.",
      ],
    },
    jackpot: {
      deferent: [
        "Excusez-moi. Une poussière dans l'œil.",
        "Je ne pleure pas. C'est le velours.",
        "~ Le Baron sort un mouchoir grand comme une nappe.",
      ],
      obsequieux: [
        "Je… Pardon. C'est l'émotion.",
        "Ne me regardez pas, Excellence. Je suis ému.",
        "~ Le Baron fond en larmes dans son nœud papillon.",
      ],
      cosmique: [
        "Le jackpot. Votre Immensité. Je… Hmpf. Qu'on m'apporte une nappe.",
        "~ Le Baron pleure. Le salon prend l'eau.",
      ],
    },
  },
  en: {
    accueil: {
      deferent: ["Hmph. Come in. Wipe your paws.", "This is private. But for {pseudo}, very well.", "Sit down. The velvet doesn't bite."],
      obsequieux: [
        "Your Excellency. Hmph. By which I mean: welcome.",
        "The salon is yours. I say that to no one else.",
        "I've had the curtains drawn for Your Excellency.",
      ],
      cosmique: [
        "Your Immensity. Hmph. I've had the ceiling padded. You take up room.",
        "Come in, Your Immensity. The velvet stood up by itself.",
        "Hmph. Your Immensity. I'm growling, but it's joy.",
      ],
    },
    vendu: {
      deferent: ["Here. Scratch tidily.", "There. Don't thank me.", "A ticket. A serious one, this."],
      obsequieux: [
        "For Your Excellency. Hmph. With respect.",
        "The best in the safe, Excellency.",
        "I entrust it to you. It is worth a great deal. So are you.",
      ],
      cosmique: [
        "For Your Immensity. Hmph. I kept it next to my heart. Tell no one.",
        "Here, Your Immensity. It has been pressed. So have I.",
      ],
    },
    perdu: {
      deferent: [
        "Hmph. It happens. I don't care for it either.",
        "Nothing. I'll bite it, if you like.",
        "That ticket will not set paw in here again.",
      ],
      obsequieux: [
        "Unacceptable. I shall speak to the manufacturer, Excellency.",
        "I am furious on your behalf, Excellency.",
        "Hmph. I am personally disappointed in that ticket.",
      ],
      cosmique: [
        "Nothing. Hmph. I'll have it banished from the solar system, Your Immensity.",
        "That ticket was disrespectful, Your Immensity. I'm biting it. There. Done.",
        "Hmph. I growl on your behalf, Your Immensity. Service included.",
      ],
    },
    gagne: {
      deferent: ["Hmph. Good.", "Not bad. Don't repeat that.", "There. Well deserved."],
      obsequieux: [
        "Well played, Excellency. Hmph.",
        "I am pleased. It doesn't show, but I am.",
        "Good. Very good.",
      ],
      cosmique: [
        "Hmph. A win, Your Immensity. I am wagging my tail. Inwardly.",
        "Good. Very good. Hmph. Don't watch me smile.",
        "Well deserved, Your Immensity. At these prices, everything is.",
      ],
    },
    gros: {
      deferent: ["Hmph. I… Bravo. There.", "~ The Baron applauds while looking the other way.", "Fine win. I've something in my throat."],
      obsequieux: [
        "Magnificent, Excellency. I am not crying.",
        "~ The Baron applauds and sniffs, loudly.",
        "~ The Baron removes his top hat, nose rather damp.",
      ],
      cosmique: [
        "Hmph. Your Immensity. I… Forgive me. All those zeros. Beautiful.",
        "~ The Baron sniffs. The chandelier trembles.",
      ],
    },
    jackpot: {
      deferent: [
        "Excuse me. Something in my eye.",
        "I am not crying. It's the velvet.",
        "~ The Baron produces a handkerchief the size of a tablecloth.",
      ],
      obsequieux: [
        "I… Forgive me. I'm overcome.",
        "Don't look at me, Excellency. I'm moved.",
        "~ The Baron bursts into tears, into his bow tie.",
      ],
      cosmique: [
        "The jackpot. Your Immensity. I… Hmph. Somebody bring me a tablecloth.",
        "~ The Baron weeps. The salon is taking on water.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Sir Auguste, morse majordome : solennel, et sa moustache frémit. Il a parié sur le
// semeur de tickets, et refuse de dire sur qui.

const AUGUSTE: Deux<Script> = {
  fr: {
    accueil: {
      obsequieux: [
        "Le Cercle est honoré, Excellence. La moustache en frémit.",
        "Votre Excellence est attendue. Depuis toujours, je crois.",
        "Minuit sonne, Excellence. Les étoiles sont à l'heure.",
      ],
      cosmique: [
        "Votre Immensité au Cercle. La moustache se met au garde-à-vous.",
        "Minuit sonne pour Votre Immensité. Nous l'avions retenu.",
        "Nous avons élargi les portes, Votre Immensité. Et l'horizon. Par égard.",
      ],
    },
    vendu: {
      obsequieux: [
        "Le ticket de Votre Excellence, sur coussin de velours.",
        "Je l'ai tenu à température, Excellence.",
        "Qu'il soit digne de ce Cercle, et de Votre Excellence.",
      ],
      cosmique: [
        "Le ticket de Votre Immensité. Le coussin a son propre coussin.",
        "Je vous le présente, Votre Immensité. Il a révisé toute la nuit.",
      ],
    },
    perdu: {
      obsequieux: [
        "Le Cercle est consterné, Excellence.",
        "Ce ticket sera radié du Cercle, Excellence.",
        "~ La moustache de Sir Auguste s'affaisse.",
      ],
      cosmique: [
        "Le Cercle porte le deuil de ce ticket, Votre Immensité. Brièvement.",
        "Ce ticket est radié, Votre Immensité. À titre posthume.",
        "~ La moustache de Sir Auguste s'affaisse, puis se reprend, par devoir.",
      ],
    },
    gagne: {
      obsequieux: [
        "Comme il se doit, Excellence.",
        "Le Cercle approuve, Excellence.",
        "~ La moustache de Sir Auguste frémit d'aise.",
      ],
      cosmique: [
        "Comme il se doit, Votre Immensité. Le contraire eût été inconvenant.",
        "Le Cercle approuve à l'unanimité, Votre Immensité. J'ai voté pour tout le monde.",
        "~ La moustache de Sir Auguste frémit, d'un frémissement de gala.",
      ],
    },
    gros: {
      obsequieux: [
        "Le Cercle se lève, Excellence.",
        "~ Sir Auguste applaudit. La moustache suit le rythme.",
        "~ Sir Auguste ôte son chapeau et s'incline.",
      ],
      cosmique: [
        "Le Cercle se lève, Votre Immensité. Les fauteuils aussi.",
        "~ Sir Auguste s'incline si bas que sa moustache balaie le parquet.",
      ],
    },
    jackpot: {
      obsequieux: [
        "Un jackpot, Excellence. Je fais sonner les cloches de l'observatoire.",
        "~ La moustache de Sir Auguste frémit, puis se déploie.",
      ],
      cosmique: [
        "Un jackpot, Votre Immensité. Je fais sonner minuit une seconde fois.",
        "~ La moustache de Sir Auguste se déploie. On la voit depuis le port.",
      ],
    },
  },
  en: {
    accueil: {
      obsequieux: [
        "The Club is honoured, Excellency. The moustache is all a-quiver.",
        "Your Excellency is expected. And always has been, I believe.",
        "Midnight strikes, Excellency. The stars are on time.",
      ],
      cosmique: [
        "Your Immensity, at the Club. The moustache stands to attention.",
        "Midnight strikes for Your Immensity. We had it held back.",
        "We have widened the doors, Your Immensity. And the horizon. Out of respect.",
      ],
    },
    vendu: {
      obsequieux: [
        "Your Excellency's ticket, on a velvet cushion.",
        "I have kept it at room temperature, Excellency.",
        "May it prove worthy of this Club, and of Your Excellency.",
      ],
      cosmique: [
        "Your Immensity's ticket. The cushion has a cushion of its own.",
        "May I present it, Your Immensity. It has been rehearsing all night.",
      ],
    },
    perdu: {
      obsequieux: [
        "The Club is dismayed, Excellency.",
        "That ticket will be struck off the Club's register, Excellency.",
        "~ Sir Auguste's moustache droops.",
      ],
      cosmique: [
        "The Club is in mourning for that ticket, Your Immensity. Briefly.",
        "That ticket has been struck off, Your Immensity. Posthumously.",
        "~ Sir Auguste's moustache droops, then rallies, out of duty.",
      ],
    },
    gagne: {
      obsequieux: [
        "As it should be, Excellency.",
        "The Club approves, Excellency.",
        "~ Sir Auguste's moustache quivers with pleasure.",
      ],
      cosmique: [
        "As it should be, Your Immensity. Anything else would have been improper.",
        "The Club approves unanimously, Your Immensity. I voted for everyone.",
        "~ Sir Auguste's moustache quivers. A gala quiver.",
      ],
    },
    gros: {
      obsequieux: [
        "The Club rises, Excellency.",
        "~ Sir Auguste applauds. The moustache keeps time.",
        "~ Sir Auguste doffs his hat and bows.",
      ],
      cosmique: [
        "The Club rises, Your Immensity. So do the armchairs.",
        "~ Sir Auguste bows so low his moustache sweeps the parquet.",
      ],
    },
    jackpot: {
      obsequieux: [
        "A jackpot, Excellency. I shall have the observatory bells rung.",
        "~ Sir Auguste's moustache quivers, then unfurls.",
      ],
      cosmique: [
        "A jackpot, Your Immensity. I shall have midnight struck a second time.",
        "~ Sir Auguste's moustache unfurls. It can be seen from the harbour.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Le Commodore Balthazar, pélican : il commande le yacht « Démesure » et en est très
// content. Pour retrouver le semeur de tickets, il a fait fouiller les cales.

const BALTHAZAR: Deux<Script> = {
  fr: {
    accueil: {
      obsequieux: [
        "Bienvenue à bord, Excellence. Le yacht est plus long que la rade : nous avons fait agrandir la mer.",
        "Excellence sur le pont ! Qu'on sorte la passerelle en or. Non, l'autre. La grande.",
        "Deux heures du matin, Excellence. L'heure où les fortunes prennent le large.",
      ],
      cosmique: [
        "Votre Immensité à bord ! Le yacht s'enfonce d'un centimètre. C'est le poids des milliards.",
        "Nous mouillons au large de vos intérêts, Votre Immensité.",
        "La mer est à Votre Immensité. Je ne fais que la tenir propre.",
      ],
    },
    vendu: {
      obsequieux: [
        "Un ticket pour Votre Excellence, servi sur le pont supérieur.",
        "Je l'ai gardé dans mon bec, Excellence. Il est sec. Presque.",
        "Larguez les amarres, Excellence, et grattez.",
      ],
      cosmique: [
        "Pour Votre Immensité. Je l'ai fait bénir par l'amiral. C'est moi.",
        "Qu'on mette en panne ! Votre Immensité gratte.",
        "Votre ticket, Votre Immensité. Il a voyagé en première. Dans mon bec.",
      ],
    },
    perdu: {
      obsequieux: [
        "Un coup de roulis, Excellence. Ce ticket n'avait pas le pied marin.",
        "Par-dessus bord, celui-là. Les mouettes n'en voudront pas.",
        "~ Le Commodore jette le ticket à la mer et salue.",
      ],
      cosmique: [
        "Je fais draguer le fond pour retrouver votre chance, Votre Immensité.",
        "Mer d'huile, ticket vide. Je porte plainte contre la marée, Votre Immensité.",
        "~ Le Commodore fait mettre le ticket aux fers.",
      ],
    },
    gagne: {
      obsequieux: [
        "Bon vent, Excellence. Très bon vent.",
        "À la bonne heure ! Qu'on hisse le petit pavois.",
        "~ Le Commodore claque du bec, enchanté.",
      ],
      cosmique: [
        "La marée monte dans vos poches, Votre Immensité.",
        "Belle prise, Votre Immensité. Je la note au journal de bord, en lettres d'or.",
        "~ Le Commodore fait tirer une salve. Petite. Il est tard.",
      ],
    },
    gros: {
      obsequieux: [
        "Mille sabords dorés, Excellence ! Qu'on hisse le grand pavois !",
        "Une prise pareille ! Je la fais empailler, Excellence. Le ticket, pas vous.",
        "~ Le Commodore applaudit des deux ailes. Sa casquette s'envole.",
      ],
      cosmique: [
        "Qu'on fasse donner la corne de brume ! Tant pis pour les voisins. Il n'y en a pas.",
        "~ Le Commodore applaudit. Le yacht tangue.",
      ],
    },
    jackpot: {
      obsequieux: [
        "Le jackpot, Excellence ! Je rebaptise le navire. Il s'appellera Encore.",
        "~ Le Commodore avale sa casquette, puis la recrache, très digne.",
      ],
      cosmique: [
        "Le jackpot ! Votre Immensité, la mer déborde. C'est vous.",
        "~ Le Commodore tire tous les feux d'artifice du bord. Même les fusées de détresse.",
      ],
    },
  },
  en: {
    accueil: {
      obsequieux: [
        "Welcome aboard, Excellency. The yacht is longer than the bay: we had the sea enlarged.",
        "Excellency on deck! Fetch the golden gangway. No, the other one. The big one.",
        "Two in the morning, Excellency. The hour when fortunes put out to sea.",
      ],
      cosmique: [
        "Your Immensity aboard! The yacht sinks one centimetre. That'll be the weight of the billions.",
        "We lie at anchor just off the coast of your interest, Your Immensity.",
        "The sea belongs to Your Immensity. I merely keep it tidy.",
      ],
    },
    vendu: {
      obsequieux: [
        "A ticket for Your Excellency, served on the upper deck.",
        "I kept it in my bill, Excellency. It's dry. Nearly.",
        "Cast off, Excellency, and scratch.",
      ],
      cosmique: [
        "For Your Immensity. I had it blessed by the admiral. That's me.",
        "Heave to! Your Immensity is scratching.",
        "Your ticket, Your Immensity. It travelled first class. In my bill.",
      ],
    },
    perdu: {
      obsequieux: [
        "A bit of a roll, Excellency. That ticket never found its sea legs.",
        "Overboard with that one. Not even the gulls will want it.",
        "~ The Commodore casts the ticket into the sea and salutes.",
      ],
      cosmique: [
        "I'll have the seabed dredged for your luck, Your Immensity.",
        "Flat calm, empty ticket. I shall lodge a complaint against the tide, Your Immensity.",
        "~ The Commodore has the ticket clapped in irons.",
      ],
    },
    gagne: {
      obsequieux: [
        "Fair winds, Excellency. Very fair winds.",
        "Splendid! Hoist the small flags.",
        "~ The Commodore clacks his bill, delighted.",
      ],
      cosmique: [
        "The tide is coming in, Your Immensity. Into your pockets.",
        "A fine catch, Your Immensity. I'm entering it in the log, in gold ink.",
        "~ The Commodore orders a salute fired. A small one. It's late.",
      ],
    },
    gros: {
      obsequieux: [
        "Shiver my gilded timbers, Excellency! Dress the ship overall!",
        "What a catch! I'll have it stuffed, Excellency. The ticket, not you.",
        "~ The Commodore claps both wings. His cap flies off.",
      ],
      cosmique: [
        "Sound the foghorn! Never mind the neighbours. There aren't any.",
        "~ The Commodore applauds. The yacht pitches.",
      ],
    },
    jackpot: {
      obsequieux: [
        "The jackpot, Excellency! I'm renaming the ship. She'll be called Encore.",
        "~ The Commodore swallows his cap, then coughs it back up, with great dignity.",
      ],
      cosmique: [
        "The jackpot! Your Immensity, the sea is overflowing. That's you.",
        "~ The Commodore sets off every firework on board. Distress flares included.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Maître Taupin, taupe : banquier privé, très myope, très méticuleux. Il parle bas.
// Sa Banque n'ouvre qu'à 15 000 ★ : on ne le rencontre qu'au registre cosmique. Il tient
// le registre des tickets tombés ; la colonne « propriétaire » est vide.

const TAUPIN: Deux<Script> = {
  fr: {
    accueil: {
      cosmique: [
        "Votre Immensité. J'ai fait creuser un étage de plus. Vos chiffres ne tenaient plus debout.",
        "Je ne compte plus votre fortune, Votre Immensité. Je la pèse.",
        "Parlez bas, Votre Immensité. Les coffres sont jaloux.",
        "Votre Immensité ? Je ne vous vois pas, mais je reconnais le bruit de vos milliards.",
        "Chut. Ici, l'argent dort. Le vôtre ronfle, Votre Immensité.",
        "Entrez, Votre Immensité. Essuyez vos lingots sur le paillasson.",
      ],
    },
    vendu: {
      cosmique: [
        "Je vous le confie, Votre Immensité. J'ai mis mes lunettes des grands jours.",
        "Un ticket, tiré de la chambre forte. Signez ici. Et là. Et ici.",
        "Je vous le remets contre reçu, Votre Immensité. En trois exemplaires.",
        "Il est numéroté, Votre Immensité. Tout l'est, ici. Même moi.",
        "~ Maître Taupin tamponne le ticket, puis tamponne le tampon.",
      ],
    },
    perdu: {
      cosmique: [
        "Une goutte hors de l'océan, Votre Immensité. Je l'éponge.",
        "Un écart d'écriture, Votre Immensité. Je le passe en pertes. Et profits. Surtout profits.",
        "Je n'ai rien vu, Votre Immensité. C'est mon métier.",
        "~ Maître Taupin cherche la perte à la loupe. Il ne la trouve pas.",
        "~ Maître Taupin range le ticket dans un tiroir marqué Jamais.",
      ],
    },
    gagne: {
      cosmique: [
        "Je rajoute une ligne, Votre Immensité. Le registre fait le tour du pâté de maisons.",
        "Crédité, Votre Immensité. À la virgule près.",
        "Les intérêts de la chance, Votre Immensité. Ils courent vite.",
        "~ Maître Taupin note le gain. Sa plume fume.",
        "~ Maître Taupin fait claquer son boulier, satisfait.",
      ],
    },
    gros: {
      cosmique: [
        "Je fais commander des zéros, Votre Immensité. Nous sommes en rupture.",
        "Sapristi. Pardon. Je voulais dire : félicitations, Votre Immensité.",
        "Il me faut un coffre plus grand, Votre Immensité. Et un siège.",
        "~ Maître Taupin ôte ses lunettes pour mieux ne pas y croire.",
        "~ Maître Taupin applaudit du bout des griffes, à peine audible.",
      ],
    },
    jackpot: {
      cosmique: [
        "Le jackpot ! Votre Immensité, je ferme la banque. Elle est à vous de toute façon.",
        "Le jackpot. La banque saute, Votre Immensité. Je vais m'allonger dans le coffre.",
        "~ Maître Taupin compte jusqu'à l'infini. Il s'arrête à midi.",
        "~ Maître Taupin s'évanouit, sans faire de bruit, par politesse.",
      ],
    },
  },
  en: {
    accueil: {
      cosmique: [
        "Your Immensity. I've had another floor dug. Your figures could no longer stand upright.",
        "I no longer count your fortune, Your Immensity. I weigh it.",
        "Speak softly, Your Immensity. The vaults get jealous.",
        "Your Immensity? I can't see you, but I know the sound of your billions.",
        "Shh. Money sleeps here. Yours snores, Your Immensity.",
        "Come in, Your Immensity. Wipe your ingots on the mat.",
      ],
    },
    vendu: {
      cosmique: [
        "I entrust it to you, Your Immensity. I've put on my best spectacles.",
        "One ticket, fresh from the strongroom. Sign here. And there. And here.",
        "I hand it over against a receipt, Your Immensity. In triplicate.",
        "It is numbered, Your Immensity. Everything is, here. Even me.",
        "~ Maître Taupin stamps the ticket, then stamps the stamp.",
      ],
    },
    perdu: {
      cosmique: [
        "A drop out of the ocean, Your Immensity. I'll mop it up.",
        "A clerical discrepancy, Your Immensity. I'll file it under profit and loss. Mostly profit.",
        "I saw nothing, Your Immensity. That is my profession.",
        "~ Maître Taupin looks for the loss with a magnifying glass. He cannot find it.",
        "~ Maître Taupin files the ticket in a drawer marked Never.",
      ],
    },
    gagne: {
      cosmique: [
        "I'll add a line, Your Immensity. The ledger already goes round the block.",
        "Credited, Your Immensity. To the last decimal.",
        "Luck's interest, Your Immensity. It accrues quickly.",
        "~ Maître Taupin records the win. His pen is smoking.",
        "~ Maître Taupin clicks his abacus, satisfied.",
      ],
    },
    gros: {
      cosmique: [
        "I shall order more zeros, Your Immensity. We've run out.",
        "Good heavens. Pardon me. I meant: congratulations, Your Immensity.",
        "I shall need a bigger vault, Your Immensity. And a chair.",
        "~ Maître Taupin takes off his spectacles, the better not to believe it.",
        "~ Maître Taupin applauds with the tips of his claws, barely audible.",
      ],
    },
    jackpot: {
      cosmique: [
        "The jackpot! Your Immensity, I'm closing the bank. It's yours anyway.",
        "The jackpot. The bank is broken, Your Immensity. I shall go and lie down in the vault.",
        "~ Maître Taupin counts to infinity. He stops at noon.",
        "~ Maître Taupin faints, without a sound, out of politeness.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Dame Séléné, hase de la Lune : sereine, un peu ailleurs. Rien ne l'étonne, sauf la
// Terre. De là-haut, elle voit tout le port. Elle ne dira rien.

const SELENE: Deux<Script> = {
  fr: {
    accueil: {
      cosmique: [
        "Bonsoir. Ou bonjour. Ici, on ne sait jamais, Votre Immensité.",
        "Vous voilà sur la Lune. Regardez : d'ici, Grattouille tient derrière une patte.",
        "On vous attendait, Votre Immensité. Depuis quatre milliards d'années, à peu près.",
      ],
    },
    vendu: {
      cosmique: [
        "Un ticket, Votre Immensité. Ne le lâchez pas : ici, il s'envole.",
        "Grattez doucement. La poussière de Lune ne retombe jamais.",
        "Il pèse six fois moins lourd qu'en bas. Ses lots, non.",
      ],
    },
    perdu: {
      cosmique: [
        "Perdu. Vu d'ici, c'est tout petit, vous savez.",
        "Ce ticket est parti en orbite. Il repassera dans quatre-vingts ans.",
        "~ Dame Séléné souffle sur le ticket. Il s'éloigne lentement vers Saturne.",
      ],
    },
    gagne: {
      cosmique: [
        "Gagné. La Lune vous sourit. C'est son seul talent.",
        "Les étoiles s'alignent, Votre Immensité. Je leur avais demandé.",
        "~ Dame Séléné incline les oreilles, satisfaite.",
      ],
    },
    gros: {
      cosmique: [
        "Oh. Même la Terre s'est retournée pour voir.",
        "Un gain pareil, Votre Immensité : j'allume une étoile de plus.",
        "~ Dame Séléné applaudit. On n'entend rien : il n'y a pas d'air.",
      ],
    },
    jackpot: {
      cosmique: [
        "Le jackpot. Votre Immensité, il n'y a plus rien de plus grand que vous. J'ai regardé.",
        "~ Dame Séléné décroche le croissant de Lune et vous le tend.",
      ],
    },
  },
  en: {
    accueil: {
      cosmique: [
        "Good evening. Or good morning. One never knows up here, Your Immensity.",
        "So here you are, on the Moon. Look: from here, Grattouille fits behind one paw.",
        "We've been expecting you, Your Immensity. For four billion years, give or take.",
      ],
    },
    vendu: {
      cosmique: [
        "A ticket, Your Immensity. Don't let go: up here, it floats away.",
        "Scratch gently. Moon dust never settles.",
        "It weighs six times less than down there. Its prizes do not.",
      ],
    },
    perdu: {
      cosmique: [
        "Lost. From up here it looks very small, you know.",
        "That ticket has gone into orbit. It will be back in eighty years.",
        "~ Dame Séléné blows on the ticket. It drifts slowly off towards Saturn.",
      ],
    },
    gagne: {
      cosmique: [
        "A win. The Moon is smiling on you. It is her only talent.",
        "The stars are aligning, Your Immensity. I did ask them to.",
        "~ Dame Séléné dips her ears, satisfied.",
      ],
    },
    gros: {
      cosmique: [
        "Oh. Even the Earth turned round to look.",
        "A win like that, Your Immensity: I'm lighting an extra star.",
        "~ Dame Séléné applauds. Nothing can be heard: there is no air.",
      ],
    },
    jackpot: {
      cosmique: [
        "The jackpot. Your Immensity, there is nothing left that is bigger than you. I looked.",
        "~ Dame Séléné unhooks the crescent Moon and hands it to you.",
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Les quatre vendeurs : Mlle Sidonie (flamant rose, exigeante), Enzo (guépard pressé,
// qui parle en onomatopées et tutoie les débutants), Mme Colette (chatte persane, tout
// est « ravissant ») et Maître Archibald (hibou, qui adjuge tout au marteau).

const SIDONIE: Deux<Script> = {
  fr: {
    accueil: {
      familier: ["Tenez-vous droit. On va voir ce qu'on peut faire.", "Hum. Il y a du travail.", "Ne touchez à rien. Regardez."],
      poli: [
        "Ah, {pseudo}. Vous avez fait des efforts.",
        "Entrez. Je vous ai gardé deux ou trois choses.",
        "On progresse, {pseudo}. Lentement.",
      ],
      deferent: [
        "{pseudo}. Enfin quelqu'un qui sait porter le vêtement.",
        "Mes plus belles pièces vous attendaient.",
        "Entrez. Aujourd'hui, je ne critiquerai presque rien.",
      ],
      obsequieux: [
        "Votre Excellence. Je n'ai aucune remarque. C'est troublant.",
        "La Maison Sidonie est à vos mesures, Excellence.",
        "Que pourrais-je encore vous apprendre ?",
      ],
      cosmique: [
        "Votre Immensité. J'habille désormais les astres. Tenez-vous droit quand même.",
        "Une auréole ? Sur mesure, naturellement.",
        "Je n'ai plus de tissu assez cher. J'en fais venir de plus loin.",
      ],
    },
    vendu: {
      familier: ["Ça vous va. Presque.", "Ce n'est pas mal. Pour un début.", "Portez-le droit. Plus droit."],
      poli: ["Voilà qui est mieux.", "C'est correct. Je le dis rarement.", "Enfin une silhouette, {pseudo}."],
      deferent: [
        "On dirait que c'est fait pour vous. C'est le cas.",
        "Irréprochable. J'ai vérifié deux fois.",
        "Je n'ai rien à redire. Laissez-moi chercher encore.",
      ],
      obsequieux: [
        "Je n'ai plus rien à vous apprendre. Je le regrette.",
        "La perfection. C'est presque agaçant, Excellence.",
        "Je range mon mètre ruban. Il ne sert plus à rien.",
      ],
      cosmique: [
        "Cela vous va, Votre Immensité. L'univers est un peu serré aux épaules, voilà tout.",
        "Porté par Votre Immensité, même le vide a de l'allure.",
        "Je n'ai pas de miroir assez grand. Faites-moi confiance, Votre Immensité.",
      ],
    },
  },
  en: {
    accueil: {
      familier: ["Stand up straight. We'll see what can be done.", "Hm. There is work to do.", "Touch nothing. Look."],
      poli: [
        "Ah, {pseudo}. You've made an effort.",
        "Come in. I've kept one or two things back for you.",
        "We are making progress, {pseudo}. Slowly.",
      ],
      deferent: [
        "{pseudo}. At last, someone who knows how to wear clothes.",
        "My finest pieces have been waiting for you.",
        "Come in. Today I shall criticise almost nothing.",
      ],
      obsequieux: [
        "Your Excellency. I have no remarks. It is unsettling.",
        "Maison Sidonie is cut to your measure, Excellency.",
        "What could I possibly still teach you?",
      ],
      cosmique: [
        "Your Immensity. I now dress the heavens. Stand up straight all the same.",
        "A halo? Made to measure, naturally.",
        "I've run out of fabric that costs enough. I'm sending further afield.",
      ],
    },
    vendu: {
      familier: ["It suits you. Almost.", "Not bad. For a start.", "Wear it straight. Straighter."],
      poli: ["Now that is better.", "It is acceptable. I rarely say so.", "A silhouette at last, {pseudo}."],
      deferent: [
        "It looks as if it were made for you. It was.",
        "Faultless. I checked twice.",
        "I can find no fault. Let me keep looking.",
      ],
      obsequieux: [
        "I have nothing left to teach you. I regret it.",
        "Perfection. It is almost irritating, Excellency.",
        "I am putting away my tape measure. It has no further use.",
      ],
      cosmique: [
        "It suits you, Your Immensity. The universe is a touch tight across the shoulders, that's all.",
        "Worn by Your Immensity, even the void has style.",
        "I have no mirror large enough. You'll have to trust me, Your Immensity.",
      ],
    },
  },
};

const ENZO: Deux<Script> = {
  fr: {
    accueil: {
      familier: ["Vroum ? Vroum.", "Ouais. Vite. J'ai une course.", "Tut tut. Regarde, touche pas."],
      poli: ["Vrrr. Bonjour. On fait vite ?", "Ah, {pseudo}. Pile à l'heure. Presque.", "Les clés sont là. Enfin, vrrr, bientôt."],
      deferent: ["{pseudo} ! J'ai du lourd. Écoutez. Vraoum.", "Zou, par ici. Du beau, du rapide.", "Chut. Elle dort. Elle ronronne."],
      obsequieux: [
        "Excellence ! J'ai tout lustré. Deux fois. Vroum.",
        "Par ici, Excellence. Doucement. Non, vite.",
        "Le garage entier vous attendait. Moteurs chauds.",
      ],
      cosmique: [
        "Votre Immensité ! Ça ne roule plus, ça décolle. Fiouuu.",
        "J'ai une comète au fond du garage. Elle mord un peu.",
        "Trois, deux, un. Pardon. L'habitude.",
      ],
    },
    vendu: {
      familier: ["Vroum. Signe là.", "Tchac. Vendu. Suivant.", "Clés. Casque. Zou."],
      poli: ["Vrrr. Elle est à vous.", "Vendu. Tut tut. Bonne route.", "Voilà les clés, {pseudo}. Vrrr."],
      deferent: ["Écoutez ce moteur. Chut. Écoutez.", "C'est elle qui vous voulait. Vraoum.", "Du grand art. Je l'ai rodée moi-même."],
      obsequieux: [
        "Je l'ai lustrée moi-même. Deux fois.",
        "Une merveille, Excellence. Vrrraoum.",
        "Elle n'attendait que Votre Excellence. Moi aussi. Vite.",
      ],
      cosmique: [
        "Vendu, Votre Immensité. Attachez-vous. Attachez la galaxie.",
        "Fiouuu. Elle est à vous. Le plein est fait : d'étoiles.",
        "Contact, Votre Immensité. Trois, deux, un. Zou.",
      ],
    },
  },
  en: {
    accueil: {
      familier: ["Vroom? Vroom.", "Yeah. Quick. I've a race on.", "Beep beep. Look, don't touch."],
      poli: ["Vrrr. Hello. Shall we be quick?", "Ah, {pseudo}. Bang on time. Nearly.", "The keys are right here. Well, vrrr, soon."],
      deferent: ["{pseudo}! I've got something serious. Listen. Vroooom.", "Zip, this way. Beautiful and fast.", "Shh. She's asleep. She's purring."],
      obsequieux: [
        "Excellency! I've polished everything. Twice. Vroom.",
        "This way, Excellency. Slowly. No, quickly.",
        "The whole garage has been waiting. Engines warm.",
      ],
      cosmique: [
        "Your Immensity! We don't drive any more, we lift off. Whoosh.",
        "There's a comet at the back of the garage. She bites a bit.",
        "Three, two, one. Sorry. Habit.",
      ],
    },
    vendu: {
      familier: ["Vroom. Sign there.", "Bang. Sold. Next.", "Keys. Helmet. Off you go."],
      poli: ["Vrrr. She's all yours.", "Sold. Beep beep. Safe travels.", "Here are the keys, {pseudo}. Vrrr."],
      deferent: ["Listen to that engine. Shh. Listen.", "She's the one who chose you. Vroooom.", "A work of art. I ran her in myself."],
      obsequieux: [
        "I polished her myself. Twice.",
        "A marvel, Excellency. Vrrroooom.",
        "She was waiting for Your Excellency alone. So was I. Quick.",
      ],
      cosmique: [
        "Sold, Your Immensity. Buckle up. Buckle up the galaxy.",
        "Whoosh. She's yours. Tank's full: of stars.",
        "Ignition, Your Immensity. Three, two, one. Go.",
      ],
    },
  },
};

const COLETTE: Deux<Script> = {
  fr: {
    accueil: {
      familier: [
        "Entrez, entrez ! J'ai des choses ravissantes. Petites, mais ravissantes.",
        "Un premier chez-soi ! C'est ravissant.",
        "Ne regardez pas les prix. Regardez le charme.",
      ],
      poli: [
        "{pseudo} ! Quel plaisir. J'ai du ravissant pour vous.",
        "Asseyez-vous. Ce fauteuil est ravissant, n'est-ce pas ?",
        "J'ai pensé à vous ce matin. C'était ravissant.",
      ],
      deferent: [
        "Très chère clientèle ! Tout est ravissant aujourd'hui.",
        "Pour {pseudo}, je sors le catalogue ravissant.",
        "J'ai des vues, {pseudo}. Des vues ravissantes.",
      ],
      obsequieux: [
        "Excellence ! Vous êtes ravissante. Vous êtes ravissant. Tout l'est.",
        "Le plus ravissant de Grattouille est à vendre, Excellence.",
        "Rien n'est trop ravissant pour Votre Excellence.",
      ],
      cosmique: [
        "Votre Immensité ! J'ai du ravissant avec vue sur la Terre.",
        "L'espace, c'est ravissant. Et si calme. Pas un voisin.",
        "Un cratère exposé plein sud. Ravissant. Enfin, plein Soleil.",
      ],
    },
    vendu: {
      familier: ["C'est petit, mais c'est ravissant.", "Vous y serez ravissamment bien.", "Un nid ravissant. Signez ici."],
      poli: ["Ravissant, n'est-ce pas ?", "Un choix ravissant, {pseudo}.", "Vos voisins sont ravissants. Je crois."],
      deferent: [
        "Ravissant. Et cette vue !",
        "Tout Grattouille va vous envier. C'est ravissant.",
        "La lumière y est ravissante dès dix heures.",
      ],
      obsequieux: [
        "Trop ravissant pour quiconque d'autre.",
        "Le plus ravissant de ma carrière, Excellence.",
        "Je n'ai plus de mots. Enfin si : ravissant.",
      ],
      cosmique: [
        "Ravissant, Votre Immensité. Les voisins sont à trois cent mille kilomètres.",
        "Un bien ravissant. La vue comprend la Terre, charges incluses.",
        "Signez ici, Votre Immensité. La plume est ravissante. Le notaire flotte.",
      ],
    },
  },
  en: {
    accueil: {
      familier: [
        "Come in, come in! I have some divine little things. Small, but divine.",
        "A first home of one's own! How divine.",
        "Don't look at the prices. Look at the charm.",
      ],
      poli: [
        "{pseudo}! What a pleasure. I have something divine for you.",
        "Do sit down. Isn't that armchair divine?",
        "I thought of you this morning. It was divine.",
      ],
      deferent: [
        "My dearest client! Everything is divine today.",
        "For {pseudo}, I shall fetch the divine catalogue.",
        "I have views, {pseudo}. Divine views.",
      ],
      obsequieux: [
        "Excellency! You look divine. Everyone does. Everything does.",
        "The most divine corner of Grattouille is for sale, Excellency.",
        "Nothing is too divine for Your Excellency.",
      ],
      cosmique: [
        "Your Immensity! I have something divine with a view of the Earth.",
        "Space is divine. And so quiet. Not a single neighbour.",
        "A south-facing crater. Divine. Well, Sun-facing.",
      ],
    },
    vendu: {
      familier: ["It's small, but it's divine.", "You'll be divinely comfortable there.", "A divine little nest. Sign here."],
      poli: ["Divine, isn't it?", "A divine choice, {pseudo}.", "Your neighbours are divine. I believe."],
      deferent: [
        "Divine. And that view!",
        "All Grattouille will envy you. How divine.",
        "The light there is divine from ten o'clock onwards.",
      ],
      obsequieux: [
        "Far too divine for anyone else.",
        "The most divine of my career, Excellency.",
        "Words fail me. Well, one doesn't: divine.",
      ],
      cosmique: [
        "Divine, Your Immensity. The neighbours are three hundred thousand kilometres away.",
        "A divine property. The view includes the Earth, service charges covered.",
        "Sign here, Your Immensity. The pen is divine. The notary is floating.",
      ],
    },
  },
};

const ARCHIBALD: Deux<Script> = {
  fr: {
    accueil: {
      familier: [
        "Hou. Approchez. Les pièces du jour sont exposées.",
        "Bienvenue à la Galerie. On regarde avec les yeux.",
        "Hou hou. Nous ouvrons la séance.",
      ],
      poli: [
        "Cher amateur ! La séance peut commencer.",
        "{pseudo}, prenez place. Le catalogue est savant.",
        "Hou. J'ai là quelques lots dignes d'intérêt.",
      ],
      deferent: [
        "Cher collectionneur ! La salle se lève pour {pseudo}.",
        "Des pièces de premier ordre, {pseudo}. Provenance irréprochable.",
        "Hou. La séance n'attendait que vous.",
      ],
      obsequieux: [
        "Votre Excellence ! Le marteau en tremble d'émotion.",
        "Les musées nous envient déjà, Excellence.",
        "Hou. Je n'adjuge plus qu'à Votre Excellence.",
      ],
      cosmique: [
        "Votre Immensité ! J'ai fait décrocher une étoile. Elle est dans la réserve.",
        "Hou. Les musées ont fermé. Tout est chez vous.",
        "Mise à prix : indécente. Comme d'habitude, Votre Immensité.",
      ],
    },
    vendu: {
      familier: ["Une fois, deux fois, adjugé !", "Adjugé ! Emballez, c'est pesé.", "Adjugé ! Le marteau a parlé."],
      poli: ["Adjugé à la personne du fond.", "Adjugé à {pseudo}, sans conteste.", "Une fois, deux fois… adjugé, et bien adjugé."],
      deferent: ["Adjugé, avec mes compliments.", "Adjugé ! Une acquisition savante, {pseudo}.", "Adjugé. L'œuvre a trouvé son maître."],
      obsequieux: [
        "Adjugé. Le musée en pleurera.",
        "Adjugé à Votre Excellence. Personne n'a osé enchérir.",
        "Adjugé ! Je range le marteau, il a tout vu.",
      ],
      cosmique: [
        "Adjugé à Votre Immensité. Les étoiles n'ont pas surenchéri.",
        "Adjugé ! Hou. J'ai tapé si fort que la Lune a sursauté.",
        "Adjugé. Le catalogue est vide, Votre Immensité. J'en fais imprimer un autre.",
      ],
    },
  },
  en: {
    accueil: {
      familier: [
        "Hoo. Come closer. Today's lots are on display.",
        "Welcome to the Gallery. We look with our eyes.",
        "Hoo hoo. The sale is now open.",
      ],
      poli: [
        "Dear enthusiast! The sale may begin.",
        "{pseudo}, do take a seat. The catalogue is most learned.",
        "Hoo. I have a few lots here worthy of note.",
      ],
      deferent: [
        "Dear collector! The room rises for {pseudo}.",
        "Pieces of the first order, {pseudo}. Impeccable provenance.",
        "Hoo. The sale was waiting for you alone.",
      ],
      obsequieux: [
        "Your Excellency! The gavel is trembling with emotion.",
        "The museums envy us already, Excellency.",
        "Hoo. I knock down to Your Excellency alone, these days.",
      ],
      cosmique: [
        "Your Immensity! I've had a star taken down. It's in the storeroom.",
        "Hoo. The museums have closed. It's all at your place.",
        "Starting price: indecent. As usual, Your Immensity.",
      ],
    },
    vendu: {
      familier: ["Going once, going twice, sold!", "Sold! Wrap it up, job done.", "Sold! The gavel has spoken."],
      poli: ["Sold, to the party at the back.", "Sold to {pseudo}, beyond dispute.", "Going once, going twice… sold, and well sold."],
      deferent: ["Sold, with my compliments.", "Sold! A scholarly acquisition, {pseudo}.", "Sold. The work has found its master."],
      obsequieux: [
        "Sold. The museum will weep.",
        "Sold to Your Excellency. Nobody dared to bid.",
        "Sold! I'm retiring the gavel. It has seen everything.",
      ],
      cosmique: [
        "Sold to Your Immensity. The stars declined to bid.",
        "Sold! Hoo. I struck so hard the Moon jumped.",
        "Sold. The catalogue is empty, Your Immensity. I'm having another printed.",
      ],
    },
  },
};

const SCRIPTS: Record<Host, Deux<Script>> = {
  gaspard: GASPARD,
  ondine: ONDINE,
  hector: HECTOR,
  baron: BARON,
  auguste: AUGUSTE,
  balthazar: BALTHAZAR,
  taupin: TAUPIN,
  selene: SELENE,
  sidonie: SIDONIE,
  enzo: ENZO,
  colette: COLETTE,
  archibald: ARCHIBALD,
};

// ---------------------------------------------------------------------------
// Le fil rouge : qui sème les tickets ?
//
// Une théorie par personnage, glissée dans l'accueil une fois sur sept environ, jamais
// à chaque visite. Gaspard, lui, change de sujet (c'est lui).

const RUMEURS: Record<Host, Deux<Lines>> = {
  gaspard: {
    fr: {
      familier: [
        "Les tickets par terre ? Aucune idée, mon grand. Oh, regarde : une mouette !",
        "Qui sème des tickets ? Drôle de question. Tiens, tu as vu mes nouveautés ?",
      ],
      poli: ["Des tickets par terre, {pseudo} ? Tiens donc. Belle journée, n'est-ce pas ?"],
      deferent: ["Un ticket sur le quai ? Je n'ai rien vu. Je regardais ailleurs. Très fort."],
      obsequieux: ["Qui sème les tickets, Excellence ? Mystère. Parlons plutôt du temps : il est superbe."],
      cosmique: ["Les tickets par terre, Votre Immensité ? Je ne dirai rien. Enfin : je ne sais rien. Voilà."],
    },
    en: {
      familier: [
        "Tickets on the ground? No idea, sunshine. Oh, look: a seagull!",
        "Who's dropping tickets? Funny question. Say, have you seen what's new in?",
      ],
      poli: ["Tickets on the ground, {pseudo}? Fancy that. Lovely day, isn't it?"],
      deferent: ["A ticket on the quay? Didn't see a thing. I was looking the other way. Very hard."],
      obsequieux: ["Who drops the tickets, Excellency? A mystery. Let's discuss the weather instead: it's glorious."],
      cosmique: ["The tickets on the ground, Your Immensity? I'll say nothing. That is: I know nothing. There."],
    },
  },
  ondine: {
    fr: {
      familier: ["Les tickets par terre ? C'est le vent du large. Il fait tout, ici, sauf la vaisselle."],
      poli: ["Encore un ticket sur le quai, {pseudo} ? Le vent du large. Je ne vois que lui."],
      deferent: ["On sème des tickets, paraît-il. J'accuse le vent du large. Il ne s'est jamais défendu."],
      obsequieux: ["Les tickets tombés, Excellence ? Le vent du large. Je lui ai déjà dit deux mots."],
      cosmique: ["Qui sème les tickets, Votre Immensité ? Le vent du large. Il n'a pas d'alibi."],
    },
    en: {
      familier: ["Tickets on the ground? That's the sea breeze. It does everything round here but the washing-up."],
      poli: ["Another ticket on the quay, {pseudo}? The sea breeze. I can think of no one else."],
      deferent: ["Someone's dropping tickets, they say. I blame the sea breeze. It has never once denied it."],
      obsequieux: ["The dropped tickets, Excellency? The sea breeze. I've already had words with it."],
      cosmique: ["Who drops the tickets, Your Immensity? The sea breeze. It has no alibi."],
    },
  },
  hector: {
    fr: {
      poli: ["Des tickets par terre. La maison ne perd jamais rien. Donc quelqu'un perd exprès."],
      deferent: ["Un ticket trouvé, {pseudo} ? La maison ne perd rien. Quelqu'un perd exprès. Je compte."],
      obsequieux: ["Quelqu'un perd des tickets exprès, Excellence. La maison observe. Elle n'a pas de preuve."],
      cosmique: ["On perd des tickets exprès, Votre Immensité. La maison trouve cela généreux. Donc suspect."],
    },
    en: {
      poli: ["Tickets on the ground. The house never loses anything. So someone is losing on purpose."],
      deferent: ["A found ticket, {pseudo}? The house loses nothing. Someone loses on purpose. I'm counting."],
      obsequieux: ["Someone is losing tickets on purpose, Excellency. The house is watching. It has no proof."],
      cosmique: ["Tickets are being lost on purpose, Your Immensity. The house finds it generous. Hence suspicious."],
    },
  },
  baron: {
    fr: {
      deferent: ["Des tickets par terre. Hmpf. C'est d'un commun. Ici, on les pose sur un coussin."],
      obsequieux: ["Semer des tickets sur un quai, Excellence. Hmpf. D'un commun. Et sans carton d'invitation."],
      cosmique: ["On jette des tickets par terre, Votre Immensité. Hmpf. D'un commun. J'ai failli sourire."],
    },
    en: {
      deferent: ["Tickets on the ground. Hmph. How common. Here, we lay them on a cushion."],
      obsequieux: ["Scattering tickets on a quay, Excellency. Hmph. So common. And no invitation card."],
      cosmique: ["Tickets, thrown on the ground, Your Immensity. Hmph. So common. I very nearly smiled."],
    },
  },
  auguste: {
    fr: {
      obsequieux: ["Qui sème les tickets ? J'ai parié, Excellence. Gros. Je ne dirai pas sur qui."],
      cosmique: ["Le semeur de tickets, Votre Immensité ? Mon pari est pris. Ma moustache est scellée."],
    },
    en: {
      obsequieux: ["Who drops the tickets? I have placed a bet, Excellency. A large one. I shan't say on whom."],
      cosmique: ["The ticket-dropper, Your Immensity? My bet is placed. My moustache is sealed."],
    },
  },
  balthazar: {
    fr: {
      obsequieux: ["Des tickets tombés du ciel, Excellence ? J'ai fait fouiller les cales. Rien. Trois mousses, un homard."],
      cosmique: ["Le semeur de tickets court toujours, Votre Immensité. J'ai fait fouiller les cales. Deux fois."],
    },
    en: {
      obsequieux: ["Tickets from the sky, Excellency? I had the holds searched. Nothing. Three cabin boys and a lobster."],
      cosmique: ["The ticket-dropper is still at large, Your Immensity. I've had the holds searched. Twice."],
    },
  },
  taupin: {
    fr: {
      cosmique: [
        "Je tiens le registre des tickets tombés, Votre Immensité. Colonne Propriétaire : vide.",
        "Tant de tickets trouvés, Votre Immensité, et aucun perdu. Mes comptes ne tombent pas juste.",
      ],
    },
    en: {
      cosmique: [
        "I keep the ledger of dropped tickets, Your Immensity. The Owner column: empty.",
        "So many tickets found, Your Immensity, and none lost. My books don't balance.",
      ],
    },
  },
  selene: {
    fr: {
      cosmique: [
        "D'ici, je vois tout le port. Je sais qui sème les tickets. Je ne dirai rien.",
        "Les tickets du quai ? D'ici, on voit très bien qui c'est. C'est joli, un secret.",
      ],
    },
    en: {
      cosmique: [
        "From here I can see the whole harbour. I know who drops the tickets. I shan't tell.",
        "The tickets on the quay? One can see exactly who it is from here. Secrets are so pretty.",
      ],
    },
  },
  sidonie: {
    fr: { familier: ["Un ticket par terre ? Des poches mal cousues. Pas les miennes : je réponds de mes ourlets."] },
    en: { familier: ["A ticket on the ground? Badly sewn pockets. Not mine: I stand by my hems."] },
  },
  enzo: {
    fr: { familier: ["Les tickets par terre ? Vu personne. Je passe trop vite. Vroum."] },
    en: { familier: ["Tickets on the ground? Saw no one. I go past too fast. Vroom."] },
  },
  colette: {
    fr: { familier: ["Des tickets sur le trottoir ! C'est ravissant. Cela donne un cachet fou au quartier."] },
    en: { familier: ["Tickets on the pavement! How divine. It does wonders for the neighbourhood."] },
  },
  archibald: {
    fr: { familier: ["Hou. Un ticket trouvé : provenance inconnue. Je déteste cela. Je n'en dors plus de la journée."] },
    en: { familier: ["Hoo. A found ticket: provenance unknown. I detest that. I've not slept a wink all day."] },
  },
};

/** Une fois le Kiosque racheté, tout le monde sait. Chacun en dit un mot, de temps en temps. */
const APRES: Record<Exclude<Host, "gaspard">, Deux<readonly string[]>> = {
  ondine: {
    fr: ["Alors c'était Gaspard. Je dois des excuses au vent du large. Je ne les ferai pas."],
    en: ["So it was Gaspard. I owe the sea breeze an apology. It won't be getting one."],
  },
  hector: {
    fr: ["C'était donc le Kiosque. La maison perdait exprès. La maison, c'est vous. Joli coup."],
    en: ["So it was the Kiosk. The house was losing on purpose. The house is you now. Nicely played."],
  },
  baron: {
    fr: ["Vous semez des tickets, à présent. Hmpf. D'un commun. C'est très bien. Ne le répétez pas."],
    en: ["You drop tickets yourself now. Hmph. How common. It's very good. Don't repeat that."],
  },
  auguste: {
    fr: ["J'avais parié sur Gaspard, Votre Immensité. La moustache ne se trompe jamais."],
    en: ["My bet was on Gaspard, Your Immensity. The moustache is never wrong."],
  },
  balthazar: {
    fr: ["Le semeur, c'était le renard ! Et moi qui fouillais les cales. Le homard vous salue."],
    en: ["The dropper was the fox! And there I was searching the holds. The lobster sends his regards."],
  },
  taupin: {
    fr: ["J'ai rempli la colonne Propriétaire, Votre Immensité. À votre nom. À l'encre d'or."],
    en: ["I have filled in the Owner column, Your Immensity. In your name. In gold ink."],
  },
  selene: {
    fr: ["Je l'avais bien caché, n'est-ce pas ? D'ici, je vous regarde semer. C'est joli."],
    en: ["I kept it well hidden, didn't I? From here I watch you dropping them. It's rather lovely."],
  },
  sidonie: {
    fr: ["Vous tenez un kiosque. Hum. Il vous faut une visière. Je ne vends pas de visière. Hélas."],
    en: ["You keep a kiosk now. Hm. You will need a visor. I do not sell visors. Alas."],
  },
  enzo: {
    fr: ["Le Kiosque est à vous ! Fiouuu. Les tickets, semez-les vite. Tout va mieux vite."],
    en: ["The Kiosk is yours! Whoosh. Those tickets: drop them fast. Everything's better fast."],
  },
  colette: {
    fr: ["Le Kiosque vous va à ravir. Je l'ai vendu moi-même : c'était ravissant."],
    en: ["The Kiosk suits you divinely. I sold it myself: it was divine."],
  },
  archibald: {
    fr: ["Hou. Le Kiosque : la plus belle pièce de la collection. Et elle n'était pas au catalogue."],
    en: ["Hoo. The Kiosk: the finest piece in the collection. And it wasn't even in the catalogue."],
  },
};

/**
 * Après la vraie fin (« Huit as de cœur »), chaque maître des lieux a un mot pour la
 * Légende. Plus de « Votre Immensité » : on ne flatte pas quelqu'un de la maison.
 */
const LEGENDE: Record<Exclude<Host, "sidonie" | "enzo" | "colette" | "archibald">, Deux<string>> = {
  gaspard: {
    fr: "Légende ! Enfin : Patron. Enfin : les deux. Je m'y perds, mais le comptoir est astiqué.",
    en: "Legend! That is: Boss. That is: both. I lose track, but the counter is polished.",
  },
  ondine: {
    fr: "Mon as de cœur ? Rangé sous le plateau. Je ne confirmerai rien. Une citronnade, Légende ?",
    en: "My ace of hearts? Tucked under the tray. I shall confirm nothing. Lemonade, Legend?",
  },
  hector: {
    fr: "La maison a recompté. Huit as de cœur. La maison n'a rien vu. Bonsoir, Légende.",
    en: "The house has recounted. Eight aces of hearts. The house saw nothing. Good evening, Legend.",
  },
  baron: {
    fr: "Hmpf. Je n'ai pas pleuré, l'autre matin. C'étaient les embruns. Asseyez-vous, Légende.",
    en: "Hmph. I did not cry, the other morning. It was the sea spray. Sit down, Legend.",
  },
  auguste: {
    fr: "J'ai reparié sur vous, Légende. Je ne dirai pas quoi. La moustache, elle, le sait déjà.",
    en: "I have bet on you again, Legend. I shan't say on what. The moustache already knows.",
  },
  balthazar: {
    fr: "Légende à bord ! J'ai fait hisser huit pavillons. Tous à cœur. Pure coïncidence.",
    en: "Legend on deck! I've had eight flags hoisted. All hearts. Pure coincidence.",
  },
  taupin: {
    fr: "J'ai ouvert un registre des as de cœur, Légende. Huit lignes. Colonne Tricheur : vide. Naturellement.",
    en: "I have opened a ledger of aces of hearts, Legend. Eight lines. The Cheat column: empty. Naturally.",
  },
  selene: {
    fr: "D'ici, on voit le quai, la table et un calot rouge. Je ne dirai rien. Vous non plus, Légende.",
    en: "From here one can see the quay, the table and a red cap. I shan't tell. Nor will you, Legend.",
  },
};

/** Une théorie toutes les sept visites environ : assez pour intriguer, pas assez pour lasser. */
const RARE = 7;

// ---------------------------------------------------------------------------
// Les moments à part

/** Le premier matin : tant que le joueur ne possède rien, Gaspard se présente. */
const DEBUTS: Deux<readonly string[]> = {
  fr: [
    "Gaspard, pour te servir ! Tu débarques du bateau du matin ? Bienvenue sur le port, mon grand.",
    "Un ticket trouvé sur le quai ? Ça alors. Quelle chance tu as. Bon ! Qu'est-ce que je te sers ?",
    "Ici c'est le Kiosque, moi c'est Gaspard. Le reste de la Promenade, tu le verras bien assez tôt.",
  ],
  en: [
    "Gaspard, at your service! Fresh off the morning boat? Welcome to the harbour, sunshine.",
    "A ticket, just lying on the quay? Well I never. Lucky you. Right! What'll it be?",
    "This is the Kiosk, I'm Gaspard. The rest of the Promenade can wait its turn.",
  ],
};

/** Collection complète : Mme Colette annonce la vente du Kiosque. */
const ANNONCE: Deux<readonly string[]> = {
  fr: [
    "Votre Immensité ! Une exclusivité : le Kiosque de Gaspard. Petit, rayé, ravissant.",
    "Il ne vous manque plus qu'un bien, Votre Immensité. Sur le port. Ravissant.",
    "Gaspard vend son Kiosque, Votre Immensité. Mais pas à n'importe qui. C'est ravissant.",
  ],
  en: [
    "Your Immensity! An exclusive: Gaspard's Kiosk. Small, stripy, divine.",
    "There is just one property you don't own, Your Immensity. On the harbour. Divine.",
    "Gaspard is selling his Kiosk, Your Immensity. But not to just anyone. How divine.",
  ],
};

/**
 * Carton de chapitre : l'hôte se présente quand son lieu ouvre. Le nom du personnage
 * est déjà écrit au-dessus de la bulle : la phrase ne le répète pas.
 */
const OUVERTURES: Record<PlaceId, Deux<string>> = {
  kiosque: {
    fr: "Pour te servir ! Quatre tickets, un comptoir, et la plus belle vue du port.",
    en: "At your service! Four tickets, one counter, and the best view of the harbour.",
  },
  cafe: {
    fr: "Je sers la citronnade, les tickets et les nouvelles du port. Dans cet ordre.",
    en: "I serve the lemonade, the tickets and the harbour gossip. In that order.",
  },
  casino: {
    fr: "Croupier de la maison. Ici, on joue gros et on parle peu. Je me charge de parler peu.",
    en: "Croupier to the house. Here, we play high and say little. I take care of saying little.",
  },
  salon: {
    fr: "Hmpf. Ici, on n'entre pas : on est reçu. Je vous reçois. Essuyez vos pattes.",
    en: "Hmph. One does not walk in here: one is received. I am receiving you. Wipe your paws.",
  },
  cercle: {
    fr: "Ici, on parie sur tout, à minuit. Moustache de rigueur : la mienne suffira pour deux.",
    en: "Here, we bet on everything, at midnight. Moustaches required: mine will do for two.",
  },
  yacht: {
    fr: "À vos ordres ! Mon yacht est plus long que la rade : pour vous, on a poussé la mer.",
    en: "At your service! My yacht is longer than the bay: we moved the sea over for you.",
  },
  banque: {
    fr: "Banquier, de père en fils. Parlez bas : ici, les chiffres ne tiennent plus debout.",
    en: "A banker, like my father. Speak softly: in here, the figures can no longer stand up.",
  },
  lune: {
    fr: "Je garde le Croissant. Vous ne monterez pas plus haut : j'ai vérifié. Entrez, la Terre se lève.",
    en: "I keep the Crescent. You cannot climb any higher: I checked. Come in, the Earth is rising.",
  },
};

/** Une fois le Kiosque racheté, Gaspard appelle le joueur « Patron » (section 5.6), et la tradition continue. */
const PATRON: Deux<Record<Situation, readonly string[]>> = {
  fr: {
    accueil: [
      "Bonjour, Patron ! Le kiosque est en ordre, la caisse aussi.",
      "Patron ! J'ai astiqué le comptoir. Votre comptoir.",
      "Tout va bien, Patron. Les mouettes n'ont rien volé aujourd'hui.",
      "Le bateau du matin accoste, Patron. Vous avez pensé au ticket ?",
      "J'en ai semé deux sur le quai, Patron. Pardon : c'est votre métier, maintenant.",
    ],
    vendu: [
      "Voilà, Patron. C'est la maison qui vend. Donc vous.",
      "Un ticket du Patron, pour le Patron.",
      "Je vous fais crédit, Patron. Non, je plaisante. C'est payé.",
    ],
    perdu: [
      "Un mauvais ticket, Patron. Je le retire de la vente.",
      "Ça arrive même au Patron. La maison s'excuse auprès d'elle-même.",
      "Je note : réclamation du Patron auprès du Patron.",
    ],
    gagne: ["La maison paie, Patron. C'est-à-dire vous. À vous-même.", "Bien joué, Patron !", "Les affaires marchent, Patron."],
    gros: ["Patron ! Vous allez ruiner la maison. La vôtre !", "~ Gaspard applaudit son Patron des deux pattes."],
    jackpot: [
      "Le jackpot, Patron ! Je ferme boutique et j'ouvre le champagne.",
      "~ Gaspard lance sa visière en l'air. Elle retombe sur le Patron.",
    ],
  },
  en: {
    accueil: [
      "Morning, Boss! The kiosk's shipshape, and so is the till.",
      "Boss! I've polished the counter. Your counter.",
      "All's well, Boss. The seagulls haven't stolen a thing today.",
      "The morning boat's coming in, Boss. Did you remember the ticket?",
      "I dropped two on the quay, Boss. Sorry: that's your job now.",
    ],
    vendu: [
      "There, Boss. The house is selling. Which is to say, you.",
      "A ticket from the Boss, for the Boss.",
      "I'll put it on the slate, Boss. Only joking. It's paid.",
    ],
    perdu: [
      "A bad ticket, Boss. I'm taking it off sale.",
      "It happens even to the Boss. The house apologises to itself.",
      "Noted: a complaint from the Boss, addressed to the Boss.",
    ],
    gagne: ["The house pays, Boss. Meaning you. To yourself.", "Well played, Boss!", "Business is booming, Boss."],
    gros: ["Boss! You'll ruin the house. Your own!", "~ Gaspard applauds his Boss with both paws."],
    jackpot: [
      "The jackpot, Boss! I'm shutting up shop and opening the champagne.",
      "~ Gaspard throws his visor in the air. It lands on the Boss.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Dire une réplique

const ORDER: Register[] = ["familier", "poli", "deferent", "obsequieux", "cosmique"];

/** Tout le Standing que le catalogue peut donner. Au-delà, c'est qu'on possède aussi le Kiosque. */
const TOUT = CATALOG.reduce((sum, item) => sum + item.standing, 0);

export interface Line {
  speaker: Speaker;
  name: string;
  text: string;
  /** Un geste (« Il lève un sourcil. ») plutôt qu'une parole. */
  gesture: boolean;
}

function choose(list: readonly string[], seed: number): string {
  return list[Math.abs(Math.floor(seed)) % list.length]!;
}

function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

function toLine(speaker: Speaker, raw: string, pseudo = ""): Line {
  const gesture = raw.startsWith("~");
  const text = (gesture ? raw.slice(1).trim() : raw).replace(/\{pseudo\}/g, pseudo);
  return { speaker, name: hostName(speaker), text, gesture };
}

/** Les répliques du registre du joueur ; à défaut, celles du registre le plus proche que le personnage connaît. */
function nearest(lines: Lines | undefined, standing: number): readonly string[] | undefined {
  if (!lines) return undefined;
  const wanted = ORDER.indexOf(registerOf(standing));
  for (let d = 0; d < ORDER.length; d++) {
    const list = lines[ORDER[wanted + d]!] ?? lines[ORDER[wanted - d]!];
    if (list && list.length > 0) return list;
  }
  return undefined;
}

/**
 * Ce qu'un personnage dit à la place de son accueil ordinaire : Gaspard se présente
 * le premier matin, Mme Colette annonce la vente du Kiosque, et, de temps en temps,
 * chacun glisse sa théorie sur les tickets tombés (ou son mot sur le dénouement).
 */
function aside(speaker: Host, standing: number, seed: number): string | null {
  if (speaker === "gaspard" && standing === 0) return choose(DEBUTS[lang()], seed);
  if (speaker === "colette" && standing === TOUT) return choose(ANNONCE[lang()], seed);
  if (seed % RARE !== 0) return null;
  const turn = Math.floor(seed / RARE);
  if (standing > TOUT) {
    const after = speaker === "gaspard" ? undefined : APRES[speaker][lang()];
    return after ? choose(after, turn) : null;
  }
  const rumour = nearest(RUMEURS[speaker][lang()], standing);
  return rumour ? choose(rumour, turn) : null;
}

/**
 * La réplique d'un personnage dans une situation. `seed` fixe le choix parmi les
 * variantes, pour que la phrase ne change pas à chaque rafraîchissement de l'écran.
 * Rend `null` si le personnage n'a rien à dire dans cette situation.
 */
export function say(speaker: Speaker, situation: Situation, standing: number, pseudo: string, seed = 0): Line | null {
  if (speaker === "piou") return null;
  const turn = Math.abs(Math.floor(seed));
  // Le Kiosque racheté, Gaspard ne parle plus qu'à son Patron.
  if (speaker === "gaspard" && standing > TOUT) {
    const boss = patronLine(situation, turn);
    if (boss) return boss;
  }
  if (situation === "accueil") {
    const special = aside(speaker, standing, turn);
    if (special) return toLine(speaker, special, pseudo);
  }
  const list = nearest(SCRIPTS[speaker][lang()][situation], standing);
  if (!list) return null;
  return toLine(speaker, choose(list, turn), pseudo);
}

/** La réplique de Gaspard à son Patron. */
export function patronLine(situation: Situation, seed = 0): Line | null {
  const list = PATRON[lang()][situation];
  if (!list || list.length === 0) return null;
  return toLine("gaspard", choose(list, seed));
}

/** Les maîtres des lieux qui ont déjà salué la Légende depuis le lancement du jeu. */
const salues = new Set<string>();

/**
 * Vrai au premier passage au comptoir de cet hôte depuis le lancement du jeu : c'est le
 * moment de son mot à la Légende. Une fois par visite, pas à chaque passage.
 */
export function legendGreeting(speaker: string): boolean {
  if (!(speaker in LEGENDE) || salues.has(speaker)) return false;
  salues.add(speaker);
  return true;
}

/** Le mot d'un maître des lieux à la Légende, après la vraie fin ; `null` pour qui n'en a pas. */
export function legendLine(speaker: string): Line | null {
  const mot = (LEGENDE as Partial<Record<string, Deux<string>>>)[speaker];
  return mot ? toLine(speaker as Speaker, pick(mot)) : null;
}

/** Le numéro de chapitre d'un lieu : 1 pour le Kiosque, 8 pour la Lune. */
export function chapterOf(place: PlaceId): number {
  return PLACES.findIndex((p) => p.id === place) + 1;
}

/** Carton de chapitre : la phrase par laquelle l'hôte d'un lieu se présente. */
export function ouverture(place: PlaceId): Line {
  return toLine(placeById(place).host as Speaker, OUVERTURES[place][lang()]);
}

// ---------------------------------------------------------------------------
// Piou, groom du port : enthousiaste, pratique, il parle trop vite et vouvoie tout le
// monde. C'est lui qui dit quoi faire ensuite : une seule consigne à la fois, toujours
// la prochaine étape utile. Sa théorie sur les tickets : les poches trouées de Grattouille.

const P = {
  accueil: {
    fr: "Vous voilà à Grattouille-les-Bains, sans un sou en poche. Ça tombe bien : regardez par terre !",
    en: "Welcome to Grattouille-les-Bains! Not a penny in your pocket? Perfect timing: look down!",
  },
  premierTrouve: {
    fr: "Un ticket ! Quelqu'un l'a laissé tomber. Vite, avant les mouettes !",
    en: "A ticket! Somebody must have dropped it. Quick, before the seagulls get it!",
  },
  premierTicket: {
    fr: "Grattez, grattez ! Avec le doigt, comme une pièce. Ça porte bonheur !",
    en: "Scratch away! With your finger, like a coin. It's good luck!",
  },
  aGratter: {
    fr: "Votre ticket vous attend ! Ça se gratte avec le doigt, comme avec une pièce.",
    en: "Your ticket's waiting! You scratch it with a finger, just like with a coin.",
  },
  pileUn: {
    fr: "Un ticket vous attend ! C'est lui qui paiera la suite de la Promenade.",
    en: "A ticket is waiting for you! It's the one that pays for the rest of the Promenade.",
  },
  pile: {
    fr: "{n} tickets vous attendent ! Ce sont eux qui paieront la suite de la Promenade.",
    en: "{n} tickets are waiting for you! They're the ones that pay for the rest of the Promenade.",
  },
  kiosque: {
    fr: "Suivez-moi, suivez-moi ! Gaspard a quatre tickets tout chauds, et vous avez de quoi jouer.",
    en: "Follow me, follow me! Gaspard has four piping-hot tickets, and you can afford to play.",
  },
  ficelle: {
    fr: "{euros} en poche ! De quoi s'offrir une ficelle à {prix} : avec ça, vous voilà presque quelqu'un.",
    en: "{euros} in your pocket! Enough for some butcher's string at {prix}: you're almost somebody.",
  },
  standing: {
    fr: "Le Standing ouvre les portes. Encore {n} ★ pour {lieu}.",
    en: "Standing opens doors. {n} more ★ for {lieu}.",
  },
  premieresEtoiles: {
    fr: "Du Standing ! Chaque achat en rapporte, pour toujours. Encore {n} ★ pour {lieu}.",
    en: "Standing! Every purchase earns some, for good. {n} more ★ for {lieu}.",
  },
  prochainBoutiques: {
    fr: [
      "Encore {n} ★ pour {lieu}. Bonne nouvelle : votre bourse a de quoi en acheter.",
      "Plus que {n} ★ avant {lieu} ! Elles se vendent en boutique, et vous avez de quoi.",
      "Il vous manque {n} ★ pour {lieu}. Chaque achat en rapporte, et vous avez de quoi.",
    ],
    en: [
      "{n} more ★ for {lieu}. Good news: your purse can afford some.",
      "Only {n} ★ to go before {lieu}! The shops sell them, and you can afford it.",
      "You're {n} ★ short of {lieu}. Every purchase earns some, and you have the money.",
    ],
  },
  prochainJouer: {
    fr: [
      "Encore {n} ★ pour {lieu}. Les ★ s'achètent, et l'argent, lui, se gratte.",
      "Plus que {n} ★ avant {lieu} ! D'abord, regarnir la bourse. Un ticket, peut-être ?",
      "Il vous manque {n} ★ pour {lieu}, et de quoi les payer. Les comptoirs sont ouverts.",
    ],
    en: [
      "{n} more ★ for {lieu}. The ★ are bought, and the money is scratched.",
      "Only {n} ★ to go before {lieu}! First, top up the purse. A ticket, perhaps?",
      "You're {n} ★ short of {lieu}, and of the money to buy them. The counters are open.",
    ],
  },
  fauche: {
    fr: "Plus un sou ? Ça ne dure jamais, ici. Ouvrez l'œil : un ticket va traîner par terre.",
    en: "Not a penny? It never lasts, here. Keep your eyes peeled: a ticket will turn up on the ground.",
  },
  parTerre: {
    fr: "Plus un sou ? Regardez par terre ! À Grattouille, il traîne toujours un ticket pour qui n'a plus rien.",
    en: "Not a penny left? Look down! In Grattouille there's always a ticket lying about for those with nothing.",
  },
  chance: {
    fr: "Tiens, un ticket par terre ! C'est votre jour de chance.",
    en: "Well I never, a ticket on the ground! It's your lucky day.",
  },
  trouveFauche: {
    fr: [
      "Poches vides ? Ça tombe bien : un ticket par terre ! Grattouille a les poches trouées, je vous dis.",
      "Plus rien en bourse ? Voilà de quoi vous refaire : un ticket vous attend, là, par terre.",
    ],
    en: [
      "Empty pockets? What luck: a ticket on the ground! Grattouille has holes in its pockets, I tell you.",
      "Nothing left in the purse? Here's a fresh start: a ticket is waiting for you, right there.",
    ],
  },
  trouveChance: {
    fr: [
      "Un ticket sur le pavé ! Personne ne le réclame. Il est donc à vous.",
      "Oh ! Un ticket, là, tout seul. Les mouettes ne l'ont pas encore vu.",
      "Encore un ticket par terre ! Les poches trouées de Grattouille, je vous le jure sur mon calot.",
    ],
    en: [
      "A ticket on the pavement! Nobody's claiming it. So it's yours.",
      "Oh! A ticket, right there, all alone. The seagulls haven't spotted it yet.",
      "Another ticket on the ground! Grattouille has holes in its pockets, I swear on my cap.",
    ],
  },
  trouvePatron: {
    fr: "Un ticket par terre ! Le Patron en sème partout. Ah. C'est vous, le Patron.",
    en: "A ticket on the ground! The Boss leaves them everywhere. Ah. You're the Boss.",
  },
  enAttenteUn: {
    fr: "Je vous ai gardé 1 ticket au chaud.",
    en: "I've kept 1 ticket warm for you.",
  },
  enAttente: {
    fr: "Je vous ai gardé {n} tickets au chaud.",
    en: "I've kept {n} tickets warm for you.",
  },
  pileVide: {
    fr: "Plus rien à gratter ! Je garde la place au chaud quand même.",
    en: "Nothing left to scratch! I'll keep the spot warm all the same.",
  },
  code: {
    fr: "Pensez à noter votre code de récupération : sans lui, votre fortune reste sur ce téléphone.",
    en: "Do write down your recovery code: without it, your fortune stays on this phone.",
  },
  collection: {
    fr: "Tout est ouvert, jusqu'à la Lune ! Reste la collection : {n} sur {total}. Mme Colette promet une surprise.",
    en: "It's all open, right up to the Moon! Now the collection: {n} of {total}. Mme Colette promises a surprise.",
  },
  kiosqueAVendre: {
    fr: "Collection complète ! Le Kiosque de Gaspard est à vendre. {prix} : vous les avez.",
    en: "Collection complete! Gaspard's Kiosk is for sale. {prix}: you can afford it.",
  },
  kiosqueTropCher: {
    fr: "Le Kiosque de Gaspard est à vendre : {prix}. Il vous manque encore {manque}.",
    en: "Gaspard's Kiosk is for sale: {prix}. You're still {manque} short.",
  },
  patron: {
    fr: "Bonjour, Patron ! Tout est à vous, du port à la Lune. Reste le classement : il n'a pas de plafond.",
    en: "Morning, Boss! It's all yours, harbour to Moon. That leaves the leaderboard: it has no ceiling.",
  },
  nouveauVenu: {
    fr: "Un ticket ! Ramassez-le vite, avant les mouettes !",
    en: "A ticket! Pick it up, quick, before the seagulls do!",
  },
  // La suite : le Patron sème à son tour, et personne n'a jamais ruiné les huit maîtres des lieux.
  semeur: {
    fr: [
      "Vous voilà Patron : à vous de semer ! Au comptoir, sous les règles et lots d'un ticket, laissez-en tomber un.",
      "{n} tickets semés, Patron ! Sur le quai, on débarque déjà en regardant par terre.",
      "{n} tickets semés ! Les mouettes font la tête : il n'en reste jamais un pour elles.",
      "{n} tickets semés, Patron. Le bateau du matin affiche complet : ça s'est su.",
      "{n} tickets semés ! Les poches trouées de Grattouille, c'est vous. Je l'ai toujours dit. Enfin, depuis peu.",
    ],
    en: [
      "You're the Boss now: your turn! At any counter, under a ticket's rules and prizes, you can drop one.",
      "{n} tickets dropped, Boss! On the quay, people already step ashore looking down.",
      "{n} tickets dropped! The seagulls are sulking: there's never one left for them.",
      "{n} tickets dropped, Boss. The morning boat is fully booked: word has got round.",
      "{n} tickets dropped! Grattouille's holey pockets are yours. I always said so. Well, lately.",
    ],
  },
  maitres: {
    fr: [
      "Il paraît que personne n'a jamais ruiné les huit maîtres des lieux, au Poker Tricheur. Enfin, il paraît.",
      "{n} sur huit ! Il paraît que personne n'a ruiné tous les maîtres des lieux. Il paraît de moins en moins.",
      "Sept sur huit ! Plus qu'un maître des lieux à ruiner. Je ne dis rien, mais j'ai repassé mon calot.",
    ],
    en: [
      "They say nobody has ever ruined all eight hosts at Cheater's Poker. Well, so they say.",
      "{n} out of eight! They say nobody has ever ruined every host. They say it less and less.",
      "Seven out of eight! Just one host left to ruin. I'm saying nothing, but I've ironed my cap.",
    ],
  },
  legende: {
    fr: "Bonjour, Légende ! Pas un mot, hein ? Officiellement, je suis groom, et ce sont les poches trouées.",
    en: "Morning, Legend! Not a word, mind. Officially, I'm the bellboy, and it's the holes in the pockets.",
  },
  // Les Souvenirs : un maître des lieux battu trois fois au poker a une histoire à raconter.
  histoire: {
    fr: [
      "{nom} a une histoire pour vous ! Trois défaites, ça délie les langues. C'est dans vos Souvenirs.",
      "{nom} et d'autres ont une histoire pour vous ! Vite, vite : c'est dans vos Souvenirs.",
    ],
    en: [
      "{nom} has a story for you! Three defeats will loosen any tongue. It's in your Memories.",
      "{nom} and others have a story for you! Quick, quick: it's in your Memories.",
    ],
  },
} satisfies Record<string, Deux<string | readonly string[]>>;

/** Ce que Piou dit. Chaque valeur se lit dans la langue courante, au moment où on la demande. */
export const PIOU = {
  /** Arrivée sur le quai. */
  get accueil(): string {
    return pick(P.accueil);
  },
  /** Le tout premier ticket, par terre sur le quai. */
  get premierTrouve(): string {
    return pick(P.premierTrouve);
  },
  /** Premier grattage : le geste. */
  get premierTicket(): string {
    return pick(P.premierTicket);
  },
  /** Un premier ticket attend dans la pile, jamais gratté. */
  get aGratter(): string {
    return pick(P.aGratter);
  },
  /** Quelques euros, encore rien acheté : au Kiosque. */
  get kiosque(): string {
    return pick(P.kiosque);
  },
  /** Les cinq premiers euros : chez Mlle Sidonie, pour une ficelle à rôti. `euros` : le solde, déjà mis en forme. */
  ficelle(euros: string): string {
    return fill(pick(P.ficelle), { euros, prix: formatEuros(itemById("ficelle")?.price ?? 1) });
  },
  /** Le Standing, en une phrase. `place` : le nom court du prochain lieu, « le Grand Café ». */
  standing(stars: number, place: string): string {
    return fill(pick(P.standing), { n: formatInt(stars), lieu: place });
  },
  /**
   * Le premier achat : ce qu'est le Standing, dit une fois. La fiche de l'article vient de
   * dire qu'il ouvre les portes (`standing`) ; ici, d'où il vient, et qu'il ne se perd pas.
   */
  premieresEtoiles(stars: number, place: string): string {
    return fill(pick(P.premieresEtoiles), { n: formatInt(stars), lieu: place });
  },
  /** Le prochain lieu et les ★ qui manquent. `moyen` : de quoi en acheter, ou d'abord de quoi jouer. */
  prochainLieu(stars: number, place: string, moyen: "boutiques" | "jouer", seed = 0): string {
    const list = pick(moyen === "boutiques" ? P.prochainBoutiques : P.prochainJouer);
    return fill(choose(list, seed), { n: formatInt(stars), lieu: place });
  },
  /** Des tickets attendent dans la pile : rien de plus utile que d'aller les gratter. */
  pile(n: number): string {
    return n === 1 ? pick(P.pileUn) : fill(pick(P.pile), { n });
  },
  /** Plus de quoi jouer, et le ticket par terre n'est pas encore là. */
  get fauche(): string {
    return pick(P.fauche);
  },
  /** Plus de quoi jouer : un ticket traîne par terre. */
  get parTerre(): string {
    return pick(P.parTerre);
  },
  /** Un ticket par chance. */
  get chance(): string {
    return pick(P.chance);
  },
  /** Le ticket qui traîne par terre, avec ses variantes : de temps en temps, Piou y va de sa théorie. */
  trouve(raison: "fauche" | "chance", seed = 0): string {
    const list = raison === "fauche" ? [pick(P.parTerre), ...pick(P.trouveFauche)] : [pick(P.chance), ...pick(P.trouveChance)];
    return choose(list, seed);
  },
  /** Après la fin : c'est le joueur qui sème, désormais. */
  get trouvePatron(): string {
    return pick(P.trouvePatron);
  },
  /** La pile « À gratter ». */
  enAttente(n: number): string {
    return n === 1 ? pick(P.enAttenteUn) : fill(pick(P.enAttente), { n });
  },
  get pileVide(): string {
    return pick(P.pileVide);
  },
  /** Invitation à noter le code de récupération. */
  get code(): string {
    return pick(P.code);
  },
  /** Tous les lieux sont ouverts : il reste la collection. */
  collection(n: number, total: number): string {
    return fill(pick(P.collection), { n, total });
  },
  /** L'annonce : le Kiosque est à vendre. `manque` : ce qu'il manque pour l'acheter, ou rien si la bourse suffit. */
  kiosqueAVendre(prix: string, manque?: string | null): string {
    return manque ? fill(pick(P.kiosqueTropCher), { prix, manque }) : fill(pick(P.kiosqueAVendre), { prix });
  },
  /** Après la fin. */
  get patron(): string {
    return pick(P.patron);
  },
  /** Épilogue : Piou accueille celui qui débarque le lendemain. */
  get nouveauVenu(): string {
    return pick(P.nouveauVenu);
  },
  /** Le Patron sème à son tour : comment, tant qu'il débute (`n` : ses tickets semés), puis ce qu'on en dit sur le quai. */
  semeur(n: number): string {
    return fill(pick(P.semeur)[n < 2 ? 0 : n < 10 ? 1 : n < 50 ? 2 : n < 200 ? 3 : 4]!, { n: formatInt(n) });
  },
  /** L'indice d'après la fin : les huit maîtres des lieux. `n` : ceux qu'il a déjà ruinés (aucun, quelques-uns, sept). */
  maitres(n: number): string {
    return fill(pick(P.maitres)[n < 1 ? 0 : n < PLACES.length - 1 ? 1 : 2]!, { n });
  },
  /** Après la vraie fin : le secret se garde. */
  get legende(): string {
    return pick(P.legende);
  },
  /** Un hôte battu trois fois a une histoire à raconter. `nom` : le premier qui attend ; `autres` : il n'est pas le seul. */
  histoire(nom: string, autres: boolean): string {
    return fill(pick(P.histoire)[autres ? 1 : 0]!, { nom });
  },
};

// ---------------------------------------------------------------------------
// Générique de fin : Gaspard remet les clés, avoue la tradition du Kiosque, et le
// nouveau Patron laisse tomber un ticket pour celui qui débarque le lendemain.

const F = {
  titre: { fr: "Le Kiosque est à toi", en: "The Kiosk is yours" },
  gaspard: {
    fr: "Voilà les clés, Patron. Je les ai fait dorer. Je reste au comptoir, si vous voulez bien de moi.",
    en: "Here are the keys, Boss. I had them gilded. I'll stay on at the counter, if you'll have me.",
  },
  question: { fr: "Qui semait les tickets ?", en: "Who was dropping the tickets?" },
  aveu: {
    fr: [
      "C'était moi, Patron. C'est la tradition du Kiosque : un ticket pour qui débarque sans un sou.",
      "J'en ai trouvé un, autrefois, sur ce quai. Aujourd'hui, le Patron, c'est vous.",
    ],
    en: [
      "It was me, Boss. It's the Kiosk tradition: a ticket for whoever steps ashore without a penny.",
      "I found one myself, long ago, on this very quay. Today, the Boss is you.",
    ],
  },
  texte: {
    fr: "Le bateau du matin accoste. Quelqu'un débarque sans un sou, et regarde par terre.",
    en: "The morning boat comes in. Someone steps ashore without a penny, and looks down.",
  },
  suite: {
    fr: "Son histoire commence. La tienne continue : une fortune à faire grossir, un classement à tenir.",
    en: "Their story begins. Yours goes on: a fortune to grow, a leaderboard to top.",
  },
} satisfies Record<string, Deux<string | readonly string[]>>;

export const FIN = {
  /** Premier temps : les clés. */
  get titre(): string {
    return pick(F.titre);
  },
  get gaspard(): string {
    return pick(F.gaspard);
  },
  /** Deuxième temps : l'aveu. La question court depuis le premier matin. */
  get question(): string {
    return pick(F.question);
  },
  get aveu(): readonly string[] {
    return pick(F.aveu);
  },
  /** Troisième temps, l'épilogue : ce qui se passe sur le quai, puis ce qui continue. */
  get texte(): string {
    return pick(F.texte);
  },
  get suite(): string {
    return pick(F.suite);
  },
};

// ---------------------------------------------------------------------------

/**
 * Tout le texte des personnages, dans les deux langues : pour les tests de parité et
 * pour la relecture. Le jeu, lui, passe par `say`, `patronLine`, `ouverture`, `PIOU` et `FIN`.
 */
export const TEXTES = {
  noms: NAMES,
  scripts: SCRIPTS,
  rumeurs: RUMEURS,
  apres: APRES,
  debuts: DEBUTS,
  annonce: ANNONCE,
  ouvertures: OUVERTURES,
  patron: PATRON,
  piou: P,
  fin: F,
  legende: LEGENDE,
} as const;
