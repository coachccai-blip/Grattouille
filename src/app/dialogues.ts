// Répliques des personnages (BRIEF.md, section 4.8 et annexe B).
//
// Les personnages changent de registre à mesure que le Standing monte : familier
// sous 60 ★, poli de 60 à 249, déférent de 250 à 999, obséquieux à partir de 1 000.
// La première réplique de chaque liste est celle du brief, quand il en donne une.
// `{pseudo}` est remplacé par le pseudo du joueur. Une réplique qui commence par
// « ~ » est un geste, pas une parole : elle s'affiche sans guillemets.
// Piou, lui, ne change jamais de ton.

import { registerOf, type Register } from "../../shared/rules";

export type Speaker =
  | "piou" | "gaspard" | "ondine" | "hector" | "baron" | "auguste"
  | "sidonie" | "enzo" | "colette" | "archibald";

export type Situation = "accueil" | "vendu" | "perdu" | "gagne" | "gros" | "jackpot";

const NAMES: Record<Speaker, string> = {
  piou: "Piou",
  gaspard: "Gaspard",
  ondine: "Ondine",
  hector: "Hector",
  baron: "Le Baron",
  auguste: "Sir Auguste",
  sidonie: "Mlle Sidonie",
  enzo: "Enzo",
  colette: "Mme Colette",
  archibald: "Maître Archibald",
};

export function hostName(id: string): string {
  return NAMES[id as Speaker] ?? "La maison";
}

type Lines = Partial<Record<Register, readonly string[]>>;
type Script = Partial<Record<Situation, Lines>>;

const GASPARD: Script = {
  accueil: {
    familier: [
      "Approche, mon grand, c'est ici que ça se passe !",
      "Te revoilà ! J'ai du tout frais, du tout chaud.",
      "Trois tickets, trois façons d'avoir de la chance. Choisis !",
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
  },
  perdu: {
    familier: [
      "Raté ! Allez, un autre ?",
      "Ah, celui-là dormait. Ça arrive.",
      "Bah ! La mer aussi a ses jours sans poisson.",
    ],
    poli: [
      "Pas de chance. Le suivant sera le bon.",
      "Ce n'était pas le sien, {pseudo}. Rien de grave.",
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
  },
  gagne: {
    familier: ["Et voilà le travail !", "Qu'est-ce que je disais !", "Ça rentre, mon grand, ça rentre !"],
    poli: ["Félicitations, {pseudo}.", "Voilà qui fait plaisir à voir, {pseudo}.", "Bien joué, {pseudo}. Vraiment."],
    deferent: ["La chance reconnaît les siens.", "{pseudo} a la main heureuse, comme toujours.", "Je n'en attendais pas moins de {pseudo}."],
    obsequieux: ["Le ticket s'incline, Excellence.", "C'était la moindre des choses, Excellence.", "Il n'a fait que son devoir, Excellence."],
  },
  gros: {
    familier: ["Sapristi ! Regardez-moi ça !", "Nom d'une sardine ! Bravo, mon grand !", "~ Gaspard applaudit des deux pattes."],
    poli: ["Magnifique, {pseudo} ! J'en ai la visière de travers.", "Bravo, {pseudo} ! Le port va en parler.", "~ Gaspard applaudit, la visière de travers."],
    deferent: ["Quel coup ! {pseudo} honore mon kiosque.", "Je le ferai graver sur le comptoir.", "~ Gaspard applaudit avec déférence."],
    obsequieux: ["Votre Excellence fait pâlir le soleil du port.", "Je n'ose applaudir trop fort, Excellence.", "~ Gaspard applaudit, incliné jusqu'au comptoir."],
  },
  jackpot: {
    familier: ["Le jackpot ! Chez moi ! Je vais le dire à tout le port !", "~ Gaspard lance sa visière en l'air."],
    poli: ["Le jackpot, {pseudo} ! Le jackpot !", "~ Gaspard lance sa visière en l'air."],
    deferent: ["Le jackpot ! {pseudo} entre dans la légende du kiosque.", "~ Gaspard ôte sa visière, très ému."],
    obsequieux: ["Le jackpot ! Que Votre Excellence me permette un cri de joie.", "~ Gaspard ôte sa visière et s'incline."],
  },
};

const ONDINE: Script = {
  accueil: {
    familier: ["Qu'est-ce que je te sers ?", "Assieds-toi où tu veux. Enfin, où il reste une chaise.", "La citronnade est fraîche. Les tickets aussi."],
    poli: ["Qu'est-ce que je vous sers ?", "Votre table vous attendait, {pseudo}. Elle s'ennuyait.", "Bonjour, {pseudo}. La maison a du ticket du jour."],
    deferent: ["La meilleure table est pour {pseudo}. Je viens de la décider.", "J'ai fait presser les citrons à la main pour {pseudo}.", "{pseudo} en terrasse. Les autres clients se tiennent mieux, d'un coup."],
    obsequieux: ["Votre Excellence désire-t-elle la terrasse entière ?", "J'ai fait repeindre les chaises, Excellence. On ne sait jamais.", "Le Grand Café n'était que Moyen avant Votre Excellence."],
  },
  vendu: {
    familier: ["Tiens. Ne le trempe pas dans la citronnade.", "Voilà. Gratte, je regarde ailleurs.", "Un ticket, un. Servi."],
    poli: ["Voici, {pseudo}. Servi sans supplément.", "Et un ticket pour la table de {pseudo}.", "Le voilà. Je vous laisse en tête-à-tête."],
    deferent: ["Servi sur plateau, comme il convient à {pseudo}.", "Je l'ai tenu au frais pour {pseudo}.", "Un ticket bien né, pour {pseudo}."],
    obsequieux: ["Sur plateau d'argent, Excellence. Le plateau est offert.", "Je l'ai goûté avant, Excellence. Enfin, regardé.", "Qu'il soit à la hauteur de Votre Excellence. J'en doute."],
  },
  perdu: {
    familier: ["Vide. Comme ma tirelire.", "Rien. Il faisait le fier, pourtant.", "Ça, c'est un ticket décoratif."],
    poli: ["Rien dessous. Je le note sur l'ardoise des déceptions.", "Un ticket sans conversation, {pseudo}.", "Il n'a rien donné. Je ne le félicite pas."],
    deferent: ["Ce ticket ne sera plus servi dans cet établissement.", "{pseudo} mérite mieux. Le ticket le sait.", "Je le renvoie en cuisine."],
    obsequieux: ["Un ticket indigne. Je le fais expulser de la terrasse, Excellence.", "Il a honte, Excellence. Je l'ai vu rougir.", "Que Votre Excellence l'oublie. Moi, je n'oublierai pas."],
  },
  gagne: {
    familier: ["Tiens, tiens. Ça paie, la terrasse.", "Pas mal. Je ne dis pas bravo, mais je le pense.", "Voilà. La citronnade porte chance."],
    poli: ["Bien vu, {pseudo}.", "Voilà qui règle l'addition, {pseudo}.", "Je le savais. Enfin, je l'espérais."],
    deferent: ["{pseudo} gagne avec une élégance folle.", "La chance a très bon goût.", "Un gain servi à point pour {pseudo}."],
    obsequieux: ["Le ticket a compris à qui il avait affaire, Excellence.", "Évidemment, Excellence.", "Il n'aurait pas osé faire autrement."],
  },
  gros: {
    familier: ["Ah oui. Quand même.", "~ Ondine applaudit, le plateau sous le bras.", "Ça, c'est une tournée générale. Non ? Tant pis."],
    poli: ["Joli. Très joli, {pseudo}.", "~ Ondine applaudit sans lâcher son plateau.", "J'en ai renversé un verre, {pseudo}. C'est vous dire."],
    deferent: ["{pseudo} fait trembler les arcades.", "~ Ondine applaudit et pose enfin son plateau.", "Toute la terrasse s'est retournée. Moi la première."],
    obsequieux: ["Les arcades s'inclinent, Excellence. Moi aussi, un peu.", "~ Ondine applaudit avec une solennité inhabituelle.", "Je ferai porter le champagne, Excellence. Enfin, la citronnade."],
  },
  jackpot: {
    familier: ["Le jackpot. Ici. Je m'assois deux minutes.", "~ Ondine lâche son plateau. C'est la première fois."],
    poli: ["Le jackpot, {pseudo}. Je ne plaisante jamais avec ça.", "~ Ondine lâche son plateau. C'est la première fois."],
    deferent: ["Le jackpot ! {pseudo}, la maison est sans voix. Sauf moi.", "~ Ondine ôte son tablier et salue."],
    obsequieux: ["Le jackpot, Excellence. Je fais rebaptiser le café.", "~ Ondine ôte son tablier et salue très bas."],
  },
};

const HECTOR: Script = {
  accueil: {
    poli: ["Faites vos jeux.", "~ Hector hoche la tête, à peine.", "Bonsoir, {pseudo}. Les jeux sont ouverts."],
    deferent: ["La table de {pseudo} est prête.", "~ Hector incline la visière d'un centimètre.", "Bonsoir. La maison est honorée. Discrètement."],
    obsequieux: ["La jetée entière est à Votre Excellence.", "~ Hector incline la visière de deux centimètres.", "Votre Excellence. Les jeux n'attendaient que vous."],
  },
  vendu: {
    poli: ["Les jeux sont faits.", "Un ticket. Bonne chance.", "~ Hector fait glisser le ticket sur le feutre."],
    deferent: ["Pour {pseudo}. Rien ne va plus.", "Le ticket de {pseudo}. Je n'ajoute rien.", "~ Hector fait glisser le ticket avec deux doigts."],
    obsequieux: ["Pour Votre Excellence. La maison retient son souffle.", "Ce ticket connaît son rang, Excellence.", "~ Hector présente le ticket sur le râteau du croupier."],
  },
  perdu: {
    poli: ["La maison garde la mise. Pour une fois.", "Rien.", "~ Hector ramasse le ticket sans un mot."],
    deferent: ["Un accident de parcours.", "Ce ticket ne reflète pas l'opinion de la maison.", "~ Hector fait disparaître le ticket avec tact."],
    obsequieux: ["La maison présente ses regrets, Excellence.", "Ce ticket sera interdit de casino.", "~ Hector escamote le ticket, mortifié."],
  },
  gagne: {
    poli: ["Payé.", "La banque paie.", "~ Hector pousse les pièces vers vous."],
    deferent: ["Payé, avec les compliments de la table.", "La banque paie {pseudo}. Volontiers.", "~ Hector pousse les pièces, impeccable."],
    obsequieux: ["La banque paie, Excellence. Elle en est fière.", "Payé. La maison vous remercie de gagner.", "~ Hector aligne les pièces au cordeau."],
  },
  gros: {
    poli: ["~ Il lève un sourcil.", "~ Hector lève un sourcil. Puis l'autre.", "Tiens."],
    deferent: ["Félicitations.", "Félicitations. Je le dis rarement.", "~ Hector applaudit, trois fois, pas une de plus."],
    obsequieux: ["La maison s'incline.", "La maison s'incline. Moi aussi.", "~ Hector ôte sa visière. Personne n'avait jamais vu ça."],
  },
  jackpot: {
    poli: ["~ Hector lève les deux sourcils.", "Jackpot. C'est le mot."],
    deferent: ["Jackpot. Toutes mes félicitations.", "~ Hector ôte sa visière."],
    obsequieux: ["Jackpot. La banque saute, Excellence. Avec plaisir.", "~ Hector ôte sa visière et la pose sur son cœur."],
  },
};

const BARON: Script = {
  accueil: {
    deferent: ["Hmpf. Entrez. Essuyez vos pattes.", "C'est privé, ici. Mais pour {pseudo}, soit.", "Asseyez-vous. Le velours ne mord pas."],
    obsequieux: ["Votre Excellence. Hmpf. Je veux dire : bienvenue.", "Le salon est à vous. Je ne le dis à personne d'autre.", "J'ai fait tirer les rideaux pour Votre Excellence."],
  },
  vendu: {
    deferent: ["Tenez. Grattez proprement.", "Voilà. Ne me remerciez pas.", "Un ticket. Du sérieux, celui-là."],
    obsequieux: ["Pour Votre Excellence. Hmpf. Avec respect.", "Le meilleur du coffre, Excellence.", "Je vous le confie. Il vaut cher. Vous aussi."],
  },
  perdu: {
    deferent: ["Hmpf. Ça arrive. Je n'aime pas ça non plus.", "Rien. Je le mords, si vous voulez.", "Ce ticket ne remettra pas les pattes ici."],
    obsequieux: ["Inadmissible. J'en parle au fabricant, Excellence.", "Je suis furieux pour vous, Excellence.", "Hmpf. Ce ticket me déçoit personnellement."],
  },
  gagne: {
    deferent: ["Hmpf. Bien.", "Pas mal. Ne le répétez pas.", "Voilà. C'est mérité."],
    obsequieux: ["Bien joué, Excellence. Hmpf.", "Je suis content. Ça ne se voit pas, mais je le suis.", "C'est bien. C'est très bien."],
  },
  gros: {
    deferent: ["Hmpf. Je… Bravo. Voilà.", "~ Le Baron applaudit en regardant ailleurs.", "Beau coup. J'ai quelque chose dans la gorge."],
    obsequieux: ["Magnifique, Excellence. Je ne pleure pas.", "~ Le Baron applaudit et renifle bruyamment.", "~ Le Baron ôte son haut-de-forme, la truffe humide."],
  },
  jackpot: {
    deferent: ["Excusez-moi. Une poussière dans l'œil.", "Je ne pleure pas. C'est le velours.", "~ Le Baron sort un mouchoir grand comme une nappe."],
    obsequieux: ["Je… Pardon. C'est l'émotion.", "Ne me regardez pas, Excellence. Je suis ému.", "~ Le Baron fond en larmes dans son nœud papillon."],
  },
};

const AUGUSTE: Script = {
  accueil: {
    obsequieux: [
      "Le Cercle est honoré, Excellence. La moustache en frémit.",
      "Votre Excellence est attendue. Depuis toujours, je crois.",
      "Minuit sonne, Excellence. Les étoiles sont à l'heure.",
    ],
  },
  vendu: {
    obsequieux: [
      "Le ticket de Votre Excellence, sur coussin de velours.",
      "Je l'ai tenu à température, Excellence.",
      "Qu'il soit digne de ce Cercle, et de Votre Excellence.",
    ],
  },
  perdu: {
    obsequieux: [
      "Le Cercle est consterné, Excellence.",
      "Ce ticket sera radié du Cercle, Excellence.",
      "~ La moustache de Sir Auguste s'affaisse.",
    ],
  },
  gagne: {
    obsequieux: [
      "Comme il se doit, Excellence.",
      "Le Cercle approuve, Excellence.",
      "~ La moustache de Sir Auguste frémit d'aise.",
    ],
  },
  gros: {
    obsequieux: [
      "Le Cercle se lève, Excellence.",
      "~ Sir Auguste applaudit. La moustache suit le rythme.",
      "~ Sir Auguste ôte son chapeau et s'incline.",
    ],
  },
  jackpot: {
    obsequieux: [
      "Un jackpot, Excellence. Je fais sonner les cloches de l'observatoire.",
      "~ La moustache de Sir Auguste frémit, puis se déploie.",
    ],
  },
};

const SIDONIE: Script = {
  accueil: {
    familier: ["Tenez-vous droit. On va voir ce qu'on peut faire.", "Hum. Il y a du travail.", "Ne touchez à rien. Regardez."],
    poli: ["Ah, {pseudo}. Vous avez fait des efforts.", "Entrez. Je vous ai gardé deux ou trois choses.", "On progresse, {pseudo}. Lentement."],
    deferent: ["{pseudo}. Enfin quelqu'un qui sait porter le vêtement.", "Mes plus belles pièces vous attendaient.", "Entrez. Aujourd'hui, je ne critiquerai presque rien."],
    obsequieux: ["Votre Excellence. Je n'ai aucune remarque. C'est troublant.", "La Maison Sidonie est à vos mesures, Excellence.", "Que pourrais-je encore vous apprendre ?"],
  },
  vendu: {
    familier: ["Ça vous va. Presque.", "Ce n'est pas mal. Pour un début.", "Portez-le droit. Plus droit."],
    poli: ["Voilà qui est mieux.", "C'est correct. Je le dis rarement.", "Enfin une silhouette, {pseudo}."],
    deferent: ["On dirait que c'est fait pour vous. C'est le cas.", "Irréprochable. J'ai vérifié deux fois.", "Je n'ai rien à redire. Laissez-moi chercher encore."],
    obsequieux: ["Je n'ai plus rien à vous apprendre. Je le regrette.", "La perfection. C'est presque agaçant, Excellence.", "Je range mon mètre ruban. Il ne sert plus à rien."],
  },
};

const ENZO: Script = {
  accueil: {
    familier: ["Vroum ? Vroum.", "Ouais. Vite. J'ai une course.", "Tut tut. Regarde, touche pas."],
    poli: ["Vrrr. Bonjour. On fait vite ?", "Ah, {pseudo}. Pile à l'heure. Presque.", "Les clés sont là. Enfin, vrrr, bientôt."],
    deferent: ["{pseudo} ! J'ai du lourd. Écoutez. Vraoum.", "Zou, par ici. Du beau, du rapide.", "Chut. Elle dort. Elle ronronne."],
    obsequieux: ["Excellence ! J'ai tout lustré. Deux fois. Vroum.", "Par ici, Excellence. Doucement. Non, vite.", "Le garage entier vous attendait. Moteurs chauds."],
  },
  vendu: {
    familier: ["Vroum. Signe là.", "Tchac. Vendu. Suivant.", "Clés. Casque. Zou."],
    poli: ["Vrrr. Elle est à vous.", "Vendu. Tut tut. Bonne route.", "Voilà les clés, {pseudo}. Vrrr."],
    deferent: ["Écoutez ce moteur. Chut. Écoutez.", "Elle vous a choisi. Vraoum.", "Du grand art. Je l'ai rodée moi-même."],
    obsequieux: ["Je l'ai lustrée moi-même. Deux fois.", "Une merveille, Excellence. Vrrraoum.", "Elle n'attendait que Votre Excellence. Moi aussi. Vite."],
  },
};

const COLETTE: Script = {
  accueil: {
    familier: ["Entrez, entrez ! J'ai des choses ravissantes. Petites, mais ravissantes.", "Un premier chez-soi ! C'est ravissant.", "Ne regardez pas les prix. Regardez le charme."],
    poli: ["{pseudo} ! Quel plaisir. J'ai du ravissant pour vous.", "Asseyez-vous. Ce fauteuil est ravissant, n'est-ce pas ?", "J'ai pensé à vous ce matin. C'était ravissant."],
    deferent: ["Très chère clientèle ! Tout est ravissant aujourd'hui.", "Pour {pseudo}, je sors le catalogue ravissant.", "J'ai des vues, {pseudo}. Des vues ravissantes."],
    obsequieux: ["Excellence ! Vous êtes ravissante. Vous êtes ravissant. Tout l'est.", "Le plus ravissant de Grattouille est à vendre, Excellence.", "Rien n'est trop ravissant pour Votre Excellence."],
  },
  vendu: {
    familier: ["C'est petit, mais c'est ravissant.", "Vous y serez ravissamment bien.", "Un nid ravissant. Signez ici."],
    poli: ["Ravissant, n'est-ce pas ?", "Un choix ravissant, {pseudo}.", "Vos voisins sont ravissants. Je crois."],
    deferent: ["Ravissant. Et cette vue !", "Tout Grattouille va vous envier. C'est ravissant.", "La lumière y est ravissante dès dix heures."],
    obsequieux: ["Trop ravissant pour quiconque d'autre.", "Le plus ravissant de ma carrière, Excellence.", "Je n'ai plus de mots. Enfin si : ravissant."],
  },
};

const ARCHIBALD: Script = {
  accueil: {
    familier: ["Hou. Approchez. Les pièces du jour sont exposées.", "Bienvenue à la Galerie. On regarde avec les yeux.", "Hou hou. Nous ouvrons la séance."],
    poli: ["Cher amateur ! La séance peut commencer.", "{pseudo}, prenez place. Le catalogue est savant.", "Hou. J'ai là quelques lots dignes d'intérêt."],
    deferent: ["Cher collectionneur ! La salle se lève pour {pseudo}.", "Des pièces de premier ordre, {pseudo}. Provenance irréprochable.", "Hou. La séance n'attendait que vous."],
    obsequieux: ["Votre Excellence ! Le marteau en tremble d'émotion.", "Les musées nous envient déjà, Excellence.", "Hou. Je n'adjuge plus qu'à Votre Excellence."],
  },
  vendu: {
    familier: ["Une fois, deux fois, adjugé !", "Adjugé ! Emballez, c'est pesé.", "Adjugé ! Le marteau a parlé."],
    poli: ["Adjugé à la personne du fond.", "Adjugé à {pseudo}, sans conteste.", "Une fois, deux fois… adjugé, et bien adjugé."],
    deferent: ["Adjugé, avec mes compliments.", "Adjugé ! Une acquisition savante, {pseudo}.", "Adjugé. L'œuvre a trouvé son maître."],
    obsequieux: ["Adjugé. Le musée en pleurera.", "Adjugé à Votre Excellence. Personne n'a osé enchérir.", "Adjugé ! Je range le marteau, il a tout vu."],
  },
};

const SCRIPTS: Partial<Record<Speaker, Script>> = {
  gaspard: GASPARD,
  ondine: ONDINE,
  hector: HECTOR,
  baron: BARON,
  auguste: AUGUSTE,
  sidonie: SIDONIE,
  enzo: ENZO,
  colette: COLETTE,
  archibald: ARCHIBALD,
};

const ORDER: Register[] = ["familier", "poli", "deferent", "obsequieux"];

export interface Line {
  speaker: Speaker;
  name: string;
  text: string;
  /** Un geste (« Il lève un sourcil. ») plutôt qu'une parole. */
  gesture: boolean;
}

/**
 * La réplique d'un personnage dans une situation. `seed` fixe le choix parmi les
 * variantes, pour que la phrase ne change pas à chaque rafraîchissement de l'écran.
 * Rend `null` si le personnage n'a rien à dire dans cette situation.
 */
export function say(speaker: Speaker, situation: Situation, standing: number, pseudo: string, seed = 0): Line | null {
  const lines = SCRIPTS[speaker]?.[situation];
  if (!lines) return null;
  // Le registre du joueur ; à défaut, le plus proche que le personnage connaît.
  const wanted = ORDER.indexOf(registerOf(standing));
  let list: readonly string[] | undefined;
  for (let d = 0; d < ORDER.length && !list; d++) {
    list = lines[ORDER[wanted + d]!] ?? lines[ORDER[wanted - d]!];
  }
  if (!list || list.length === 0) return null;
  const raw = list[Math.abs(Math.floor(seed)) % list.length]!;
  const gesture = raw.startsWith("~");
  const text = (gesture ? raw.slice(1).trim() : raw).replace(/\{pseudo\}/g, pseudo);
  return { speaker, name: NAMES[speaker], text, gesture };
}

/** Une fois le Kiosque racheté, Gaspard appelle le joueur « Patron » (section 5.6). */
const PATRON: Partial<Record<Situation, readonly string[]>> = {
  accueil: [
    "Bonjour, Patron ! Le kiosque est en ordre, la caisse aussi.",
    "Patron ! J'ai astiqué le comptoir. Votre comptoir.",
    "Tout va bien, Patron. Les mouettes n'ont rien volé aujourd'hui.",
  ],
  vendu: [
    "Voilà, Patron. C'est la maison qui vend. Donc vous.",
    "Un ticket du Patron, pour le Patron.",
    "Je vous fais crédit, Patron. Non, je plaisante. C'est payé.",
  ],
  perdu: [
    "Un mauvais ticket, Patron. Je le retire de la vente.",
    "Ça arrive même au Patron. Surtout au Patron.",
    "Je note : réclamation du Patron auprès du Patron.",
  ],
  gagne: ["La maison paie, Patron. C'est-à-dire vous. À vous-même.", "Bien joué, Patron !", "Les affaires marchent, Patron."],
  gros: ["Patron ! Vous allez ruiner la maison. La vôtre !", "~ Gaspard applaudit son Patron des deux pattes."],
  jackpot: ["Le jackpot, Patron ! Je ferme boutique et j'ouvre le champagne.", "~ Gaspard lance sa visière en l'air. Elle retombe sur le Patron."],
};

/** La réplique de Gaspard à son Patron. */
export function patronLine(situation: Situation, seed = 0): Line | null {
  const list = PATRON[situation];
  if (!list || list.length === 0) return null;
  const raw = list[Math.abs(Math.floor(seed)) % list.length]!;
  const gesture = raw.startsWith("~");
  return { speaker: "gaspard", name: NAMES.gaspard, text: gesture ? raw.slice(1).trim() : raw, gesture };
}

// Piou ne change jamais de ton.
export const PIOU = {
  accueil: "Vous voilà à Grattouille-les-Bains avec 4 € en poche. Ça suffit pour commencer !",
  kiosque: "Suivez-moi, suivez-moi ! Le Kiosque de Gaspard est juste là, sur le port.",
  enAttente: (n: number) =>
    n === 1 ? "Je vous ai gardé 1 ticket au chaud." : `Je vous ai gardé ${n} tickets au chaud.`,
  pileVide: "Plus rien à gratter ! Je garde la place au chaud quand même.",
  maison: "La maison ne laisse personne repartir les poches vides.",
  code: "Notez ce code. Sans lui, votre fortune reste sur ce téléphone.",
  noeudPap: (euros: string) =>
    `${euros} en poche ! Filez chez Mlle Sidonie : un nœud papillon à 5 €, et vous voilà quelqu'un.`,
  standing: (stars: number, place: string) =>
    stars === 1
      ? `Le Standing ouvre les portes. Encore 1 ★ pour ${place}.`
      : `Le Standing ouvre les portes. Encore ${stars} ★ pour ${place}.`,
  premierTicket: "Grattez, grattez ! Avec le doigt, comme une pièce. Ça porte bonheur !",
} as const;

/** Générique de fin : Gaspard remet les clés. */
export const FIN = {
  titre: "Le Kiosque est à toi",
  gaspard: "Voilà les clés, Patron. Je les ai fait dorer. Je reste au comptoir, si vous voulez bien de moi.",
  texte:
    "Tu es arrivé à Grattouille-les-Bains avec 4 € en poche. Tu repars avec le kiosque où tout a commencé. La Promenade est à toi, du port jusqu'à la corniche.",
  suite: "Le jeu continue sans limite : il reste une fortune à faire grossir, et un classement à tenir.",
} as const;
