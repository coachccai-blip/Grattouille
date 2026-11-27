// Les Souvenirs : l'histoire de chacun des huit maîtres des lieux (LOT4.md, section 12).
//
// Qui bat trois fois un hôte au poker gagne sa confidence : il raconte, à la première
// personne, comment il a débarqué à Grattouille-les-Bains sans un sou, ce qu'il a trouvé
// par terre, et comment il est devenu ce qu'il est. Chaque histoire est un album : une
// photo par temps, sa légende de la main de l'hôte, et ce qu'il en dit.
//
// Elles se répondent : Gaspard a vendu un parapluie à Ondine (elle dit que c'est elle qui
// l'a servi) et un autre à Maître Taupin, pour son tunnel ; Hector a servi deux étés de
// poteau à linge à Ondine ; le Baron porte au Cercle une moustache prêtée par Sir Auguste ;
// le homard du Commodore a son ticket chez Gaspard ; et Dame Séléné, d'en haut, les voit
// tous faire.
//
// SANS DIVULGÂCHER. Une histoire peut s'ouvrir avant les deux fins. Les six temps d'une
// histoire ne disent donc ni qui sème les tickets, ni qui a fait la ville, ni ce que chacun
// cache dans sa manche : seulement des clins d'œil (le groom « déjà là », la maison qui
// « compte mal », le bateau qu'on guette). Le septième temps, `apres`, n'est montré qu'à
// qui a vu la vraie fin (`player.story.vraieFin`) : « Maintenant que vous savez… ». Un test
// (tests/recit-suite.test.ts) relit le corps de chaque histoire à la recherche d'un mot de trop.
//
// Conventions, celles de src/app/dialogues.ts : les deux langues côte à côte, de même
// forme ; 110 caractères au plus par bulle, une idée par bulle ; les hôtes vouvoient (sauf
// Gaspard, qui tutoie « pour les histoires ») et ne flattent plus : pas d'« Excellence »
// entre gens qui se sont plumés trois fois. Une citation dans une bulle se met entre
// guillemets anglais : la bulle a déjà les siens.
// Ce module n'est chargé qu'avec l'écran des Souvenirs (src/screens/souvenirs).

import type { PlaceId } from "../../../shared/types";
import type { Lang } from "../../i18n";
import type { Speaker } from "../dialogues";

type Deux<T> = Record<Lang, T>;

/** Le bruit d'une page : par défaut, la photo qui glisse sur l'album. */
export type Son = "ticket" | "gain" | "cle" | "mouette" | "porte" | "tampon" | "jeton" | "etoile";

export interface Temps {
  /**
   * La photo : une illustration du registre (`place:cafe`, `pnj:piou`, `item:smoking`,
   * `ticket:vingt-et-un`, `symbole:pie:bouton`, `decor:banc`) ou un dessin de l'album
   * (`dessin:parapluies`, voir src/art/suite/histoires.tsx).
   */
  image: string;
  /** Ce que l'hôte a écrit sous la photo. */
  legende: Deux<string>;
  /** Ce qu'il en dit : une bulle par phrase. */
  dit: Deux<readonly string[]>;
  /** Le bouton qui tourne la page : ce que demande le joueur. Le dernier temps n'en a pas. */
  bouton?: Deux<string>;
  son?: Son;
}

export interface Histoire {
  lieu: PlaceId;
  hote: Speaker;
  titre: Deux<string>;
  /** Le corps de l'histoire : six temps, sans un mot des secrets. */
  temps: readonly Temps[];
  /** Le temps de plus, pour qui a vu la vraie fin. */
  apres: Temps;
}

/** Le bouton qui mène au temps de plus. */
export const ENCORE: Deux<string> = { fr: "Et maintenant que je sais ?", en: "And now that I know?" };

export const HISTOIRES: Record<PlaceId, Histoire> = {
  // ------------------------------------------------------------ Gaspard, le Kiosque
  kiosque: {
    lieu: "kiosque",
    hote: "gaspard",
    titre: { fr: "Trente-six parapluies", en: "Thirty-six umbrellas" },
    temps: [
      {
        image: "place:kiosque",
        legende: { fr: "Le Kiosque. Ouvert tous les matins.", en: "The Kiosk. Open every morning." },
        dit: {
          fr: ["Trois fois plumé ! Ça vaut bien une histoire, mon grand. Pour les histoires, je tutoie. Même les Immensités."],
          en: ["Fleeced three times! That's worth a story, sunshine. In a story, I drop the titles. Even ‘Your Immensity’."],
        },
        bouton: { fr: "Écouter Gaspard", en: "Listen to Gaspard" },
      },
      {
        image: "dessin:parapluies",
        legende: { fr: "Ma valise. Trente-six parapluies.", en: "My suitcase. Thirty-six umbrellas." },
        dit: {
          fr: [
            "Avant, je faisais les foires. Je vendais des parapluies. Garantis à vie ! La vie du parapluie, s'entend.",
            "Un matin, j'ai pris le bateau pour une ville où il ne pleut jamais. Avec trente-six parapluies. Le flair !",
          ],
          en: [
            "I used to work the fairs. I sold umbrellas. Guaranteed for life! The umbrella's life, that is.",
            "One morning I took the boat to a town where it never rains. With thirty-six umbrellas. What a nose!",
          ],
        },
        bouton: { fr: "Et alors ?", en: "And then?" },
      },
      {
        image: "decor:banc",
        legende: { fr: "Le quai, ce matin-là. Pas un nuage.", en: "The quay, that morning. Not a cloud." },
        dit: {
          fr: [
            "J'ai débarqué sans un sou et sans un nuage. Le bonimenteur le plus sec de toute la côte !",
            "Et là, par terre : un ticket. Je l'ai gratté avec une baleine de parapluie. Gagnant ! Pas gros. Mais gagnant.",
          ],
          en: [
            "I stepped ashore without a penny or a cloud in the sky. The driest patter merchant on the whole coast!",
            "And there, on the ground: a ticket. I scratched it with an umbrella rib. A winner! Not big. But a winner.",
          ],
        },
        bouton: { fr: "Et ensuite ?", en: "And after that?" },
        son: "ticket",
      },
      {
        image: "pnj:piou",
        legende: { fr: "Le groom. Il avait la clé.", en: "The bellboy. He had the key." },
        dit: {
          fr: [
            "Sur le quai, il y avait un kiosque. Fermé. Avec une pancarte : on demande un vendeur, sachant causer.",
            "Un groom avait la clé. Un moineau pressé. Je n'ai jamais su pourquoi. Il était déjà là. Il l'est toujours.",
          ],
          en: [
            "On the quay stood a kiosk. Shut. With a sign: salesman wanted, must have the gift of the gab.",
            "A bellboy had the key. A sparrow in a hurry. I never found out why. He was already here. He always is.",
          ],
        },
        bouton: { fr: "Et les parapluies ?", en: "And the umbrellas?" },
        son: "cle",
      },
      {
        image: "pnj:ondine",
        legende: { fr: "Ondine. Ma première cliente. Elle dit le contraire.", en: "Ondine. My first customer. She says otherwise." },
        dit: {
          fr: [
            "Les parapluies ? Trente-quatre tiennent le toit du Kiosque. Pas une fuite. Il ne pleut jamais : garanti !",
            "Les deux autres, je les ai vendus. Un à Ondine, contre une citronnade. Un à une taupe. Pour un tunnel.",
          ],
          en: [
            "The umbrellas? Thirty-four hold up the Kiosk roof. Not one leak. It never rains: guaranteed!",
            "I sold the other two. One to Ondine, for a lemonade. One to a mole. For a tunnel.",
          ],
        },
        bouton: { fr: "Et depuis ?", en: "And since then?" },
      },
      {
        image: "dessin:bateau",
        legende: { fr: "Le bateau du matin. Je ne le rate jamais.", en: "The morning boat. I never miss it." },
        dit: {
          fr: [
            "Depuis, je vends des tickets. Et chaque matin, je regarde arriver le bateau. On ne sait jamais qui débarque.",
            "Voilà, tu sais tout. Enfin : presque tout. Oh, regarde : une mouette !",
          ],
          en: [
            "Since then, I've sold tickets. And every morning I watch the boat come in. You never know who'll step off.",
            "There, now you know everything. Well: nearly everything. Oh, look: a seagull!",
          ],
        },
        son: "mouette",
      },
    ],
    apres: {
      image: "item:kiosque",
      legende: { fr: "Le Kiosque. En plus doré.", en: "The Kiosk. Only shinier." },
      dit: {
        fr: [
          "Maintenant que tu sais : mon ticket, le groom l'avait laissé tomber. Et la pancarte, c'était son écriture.",
          "Il m'a tendu la clé : tiens, ça m'encombre. Je te l'ai rendue pareil, mon grand. En plus doré.",
        ],
        en: [
          "Now that you know: it was the bellboy who dropped my ticket. And the sign was in his handwriting.",
          "He held out the key: here, it's in my way. I passed it on to you the same way, sunshine. Only shinier.",
        ],
      },
      son: "cle",
    },
  },

  // ------------------------------------------------------------ Ondine, le Grand Café
  cafe: {
    lieu: "cafe",
    hote: "ondine",
    titre: { fr: "Un citron sur le ventre", en: "A lemon on my belly" },
    temps: [
      {
        image: "place:cafe",
        legende: { fr: "Le Grand Café. À l'heure creuse.", en: "The Grand Café. In the quiet hour." },
        dit: {
          fr: [
            "Trois fois battue. C'est le vent du large qui tenait mes cartes. Je ne vois que lui.",
            "Asseyez-vous. Je raconte une fois. Je ne répéterai pas : j'ai des verres à essuyer.",
          ],
          en: [
            "Beaten three times. The sea breeze was holding my cards. I can think of no one else.",
            "Sit down. I'll tell it once. I shan't repeat it: I have glasses to dry.",
          ],
        },
        bouton: { fr: "S'asseoir en terrasse", en: "Take a seat outside" },
      },
      {
        image: "dessin:citron",
        legende: { fr: "La traversée. Vue du citron.", en: "The crossing. As seen by the lemon." },
        dit: {
          fr: [
            "Je ne suis pas arrivée par le bateau. Le billet était trop cher. Je suis arrivée derrière. À la nage.",
            "Trois jours sur le dos, un citron sur le ventre. C'était tout mon bagage.",
          ],
          en: [
            "I didn't come by boat. The fare was too dear. I came behind the boat. I swam.",
            "Three days on my back, with a lemon on my belly. That was all my luggage.",
          ],
        },
        bouton: { fr: "Un citron ?", en: "A lemon?" },
      },
      {
        image: "dessin:ticket",
        legende: { fr: "Le ticket. Arrivé de face.", en: "The ticket. It came head-on." },
        dit: {
          fr: [
            "Un citron. On ne sait jamais. En sortant de l'eau, j'ai reçu un ticket en pleine figure.",
            "J'ai accusé le vent du large. Il ne s'est pas défendu. J'ai gardé l'habitude.",
          ],
          en: [
            "A lemon. You never know. As I climbed out of the water, a ticket hit me full in the face.",
            "I blamed the sea breeze. It didn't deny it. I've kept up the habit.",
          ],
        },
        bouton: { fr: "Et le ticket ?", en: "And the ticket?" },
        son: "ticket",
      },
      {
        image: "symbole:cocktail:citron",
        legende: { fr: "Le citron. Il a tout vu.", en: "The lemon. It saw everything." },
        dit: {
          fr: [
            "Gagnant. De quoi acheter un verre, un sucre et une chaise. Avec le citron, cela fait un café.",
            "J'ai écrit “Grand” sur l'ardoise. Personne n'a vérifié.",
          ],
          en: [
            "A winner. Enough for one glass, one sugar lump and one chair. Add the lemon and you have a café.",
            "I chalked ‘Grand’ on the board. Nobody checked.",
          ],
        },
        bouton: { fr: "Et les clients ?", en: "And the customers?" },
        son: "gain",
      },
      {
        image: "pnj:hector",
        legende: { fr: "Le poteau de la jetée. Deuxième client.", en: "The post at the end of the pier. Second customer." },
        dit: {
          fr: [
            "Premier client : Gaspard. Il a payé avec un parapluie. Il ne pleut jamais. Je l'ai toujours.",
            "Deuxième client : le poteau au bout de la jetée. Au bout de deux étés, il a commandé. C'était Hector.",
          ],
          en: [
            "First customer: Gaspard. He paid with an umbrella. It never rains. I still have it.",
            "Second customer: the post at the end of the pier. After two summers, it ordered. It was Hector.",
          ],
        },
        bouton: { fr: "Et aujourd'hui ?", en: "And today?" },
      },
      {
        image: "decor:banc",
        legende: { fr: "Le banc du quai. Je livre.", en: "The bench on the quay. I deliver." },
        dit: {
          fr: [
            "Aujourd'hui, la première citronnade est offerte à qui débarque sans rien. Erreur de caisse.",
            "Tous les jours la même erreur. C'est le vent du large qui tient la caisse. Je ne vois que lui.",
          ],
          en: [
            "Today, the first lemonade is free for whoever steps ashore with nothing. A till error.",
            "The same error every day. The sea breeze works the till. I can think of no one else.",
          ],
        },
      },
    ],
    apres: {
      image: "pnj:gaspard",
      legende: { fr: "Le coupable. Il lance trop fort.", en: "The culprit. He throws too hard." },
      dit: {
        fr: [
          "Maintenant que vous savez : ce n'était pas le vent. C'était Gaspard. Il lance comme il vend. Trop fort.",
          "Le vent du large est innocent. Je continue de l'accuser. Un secret, cela se garde au frais.",
        ],
        en: [
          "Now that you know: it wasn't the sea breeze. It was Gaspard. He throws the way he sells. Too hard.",
          "The sea breeze is innocent. I shall go on blaming it. A secret is best kept on ice.",
        ],
      },
    },
  },

  // ------------------------------------------------------------ Hector, le Casino
  casino: {
    lieu: "casino",
    hote: "hector",
    titre: { fr: "Deux étés au bout de la jetée", en: "Two summers at the end of the pier" },
    temps: [
      {
        image: "place:casino",
        legende: { fr: "Le Casino. Au bout de la jetée.", en: "The Casino. At the end of the pier." },
        dit: {
          fr: [
            "Trois défaites. La maison les a comptées. La maison vous doit une explication.",
            "La maison n'en donne jamais. La maison fait une exception.",
          ],
          en: [
            "Three defeats. The house has counted them. The house owes you an explanation.",
            "The house never gives one. The house is making an exception.",
          ],
        },
        bouton: { fr: "Écouter la maison", en: "Listen to the house" },
      },
      {
        image: "dessin:bateau",
        legende: { fr: "Le bateau du matin. Hector est à bord.", en: "The morning boat. Hector is on board." },
        dit: {
          fr: [
            "La maison a débarqué ici sans un sou. À l'époque, la maison s'appelait Hector. Elle n'avait pas de toit.",
            "Ni toit, ni porte, ni paillasson. Seulement Hector. C'est peu, pour une maison.",
          ],
          en: [
            "The house landed here without a penny. In those days the house was called Hector. It had no roof.",
            "No roof, no door, no doormat. Only Hector. Not much, for a house.",
          ],
        },
        bouton: { fr: "Et alors ?", en: "And then?" },
      },
      {
        image: "dessin:poteau",
        legende: { fr: "Hector, deuxième été. Jour de lessive.", en: "Hector, second summer. Washing day." },
        dit: {
          fr: [
            "Hector est allé au bout de la jetée. Il a attendu. Un héron sait attendre. Il a attendu deux étés.",
            "On l'a pris pour un poteau. Ondine y a étendu ses torchons. Il n'a rien dit : c'était de la visite.",
          ],
          en: [
            "Hector walked to the end of the pier. He waited. A heron knows how to wait. He waited two summers.",
            "He was taken for a post. Ondine hung her tea towels on him. He said nothing: it was company.",
          ],
        },
        bouton: { fr: "Deux étés ?", en: "Two summers?" },
      },
      {
        image: "item:affiche",
        legende: { fr: "L'affiche de l'ouverture. Hector n'a pas bougé.", en: "The opening-night poster. Hector hasn't moved." },
        dit: {
          fr: [
            "Un matin, un ticket s'est posé sur son bec. Gagnant. De quoi acheter un tapis vert, quatre murs et un toit.",
            "Il a tout fait bâtir autour de lui. Sans bouger. Le Casino est au bout de la jetée parce qu'il y était.",
          ],
          en: [
            "One morning a ticket landed on his bill. A winner. Enough for a green baize, four walls and a roof.",
            "He had it all built around him. Without moving. The Casino is at the end of the pier because he was.",
          ],
        },
        bouton: { fr: "Pourquoi “la maison” ?", en: "Why ‘the house’?" },
        son: "ticket",
      },
      {
        image: "item:maison-pecheur",
        legende: { fr: "Une maison. Pas la sienne. La sienne, c'est lui.", en: "A house. Not his. His own house is him." },
        dit: {
          fr: [
            "Depuis, Hector dit “la maison”. Quand on est sa propre maison, on n'est plus jamais à la rue.",
            "Et l'on est toujours rentré à l'heure.",
          ],
          en: [
            "Ever since, Hector says ‘the house’. When you are your own house, you are never out on the street again.",
            "And you are always home on time.",
          ],
        },
        bouton: { fr: "La maison gagne toujours ?", en: "Does the house always win?" },
      },
      {
        image: "ticket:vingt-et-un",
        legende: { fr: "La maison compte. Parfois mal.", en: "The house counts. Sometimes badly." },
        dit: {
          fr: [
            "La maison gagne toujours. Sauf quand quelqu'un entre ici sans rien. Ces soirs-là, la maison compte mal.",
            "La maison ne sait pas pourquoi. La maison ne cherche pas. Bonsoir.",
          ],
          en: [
            "The house always wins. Except when someone walks in with nothing. On those nights, the house miscounts.",
            "The house doesn't know why. The house doesn't look into it. Good evening.",
          ],
        },
      },
    ],
    apres: {
      image: "pnj:piou",
      legende: { fr: "Le groom. En avance, comme toujours.", en: "The bellboy. Early, as always." },
      dit: {
        fr: [
          "Maintenant que vous savez : le ticket sur le bec, c'était le groom. Il a dit que la maison régalait.",
          "Il n'y avait pas encore de maison. Il avait de l'avance. Depuis, la maison régale. En comptant mal.",
        ],
        en: [
          "Now that you know: the ticket on the bill was the bellboy's doing. He said it was on the house.",
          "There was no house yet. He was ahead of things. Ever since, it has been on the house. By miscounting.",
        ],
      },
    },
  },

  // ------------------------------------------------------------ Le Baron, le Salon Privé
  salon: {
    lieu: "salon",
    hote: "baron",
    titre: { fr: "Sans carton d'invitation", en: "No invitation card" },
    temps: [
      {
        image: "place:salon",
        legende: { fr: "Le Salon Privé. Très privé.", en: "The Private Salon. Very private." },
        dit: {
          fr: [
            "Hmpf. Trois fois. On ne bat pas le Baron trois fois sans carton d'invitation. Asseyez-vous quand même.",
            "Je vais vous dire une chose. Une seule. Et je nierai.",
          ],
          en: [
            "Hmph. Three times. One does not beat the Baron three times without an invitation card. Sit down anyway.",
            "I shall tell you one thing. Just one. And I shall deny it.",
          ],
        },
        bouton: { fr: "S'asseoir sur un coussin", en: "Sit on a cushion" },
      },
      {
        image: "item:smoking",
        legende: { fr: "Le smoking de mon père.", en: "My father's dinner jacket." },
        dit: {
          fr: [
            "Je ne suis pas baron. Baron, c'est mon prénom. Ma mère voyait grand. Mon père, lui, était videur.",
            "J'ai débarqué ici sans un sou, dans son smoking. Trop large aux épaules. J'ai grandi dedans.",
          ],
          en: [
            "I am no baron. Baron is my first name. My mother thought big. My father was a doorman.",
            "I landed here without a penny, in his dinner jacket. Too broad in the shoulders. I grew into it.",
          ],
        },
        bouton: { fr: "Et alors ?", en: "And then?" },
      },
      {
        image: "dessin:coussin",
        legende: { fr: "Mon premier ticket. Pas à même le sol.", en: "My first ticket. Not on the bare ground." },
        dit: {
          fr: [
            "Sur le quai, un ticket. Par terre ! D'un commun. J'ai failli l'enjamber.",
            "Je l'ai ramassé. Je l'ai posé sur mon mouchoir. On ne gratte pas la chance à même le pavé. Hmpf.",
          ],
          en: [
            "On the quay, a ticket. On the ground! How common. I very nearly stepped over it.",
            "I picked it up. I laid it on my handkerchief. One does not scratch one's luck on the cobbles. Hmph.",
          ],
        },
        bouton: { fr: "Il a gagné ?", en: "Did it win?" },
        son: "ticket",
      },
      {
        image: "item:cabine",
        legende: { fr: "Le premier Salon. Une porte, un coussin.", en: "The first Salon. One door, one cushion." },
        dit: {
          fr: [
            "Gagnant. J'ai loué une pièce, acheté une porte et un coussin. Puis j'ai fait le métier de mon père.",
            "Le premier soir, j'ai refusé tout le monde. Moi compris : je n'avais pas de carton. J'ai dormi dehors.",
          ],
          en: [
            "A winner. I rented a room, bought a door and a cushion. Then I took up my father's trade.",
            "The first night, I turned everyone away. Myself included: I had no card. I slept outside.",
          ],
        },
        bouton: { fr: "Et le deuxième soir ?", en: "And the second night?" },
        son: "porte",
      },
      {
        image: "pnj:auguste",
        legende: { fr: "Sir Auguste. Il parie. Il gagne. C'est agaçant.", en: "Sir Auguste. He bets. He wins. It is tiresome." },
        dit: {
          fr: [
            "Le deuxième soir, un morse a parié que je ne tiendrais pas la porte fermée. Sir Auguste. Il a gagné.",
            "Quelqu'un attendait sur le trottoir. Sans carton, sans rien. J'ai ouvert. À cause du courant d'air. Hmpf.",
          ],
          en: [
            "The second night, a walrus bet that I couldn't keep the door shut. Sir Auguste. He won.",
            "Someone was waiting on the pavement. No card, no anything. I opened up. Because of the draught. Hmph.",
          ],
        },
        bouton: { fr: "Et la pochette ?", en: "And the pocket square?" },
      },
      {
        image: "item:foulard",
        legende: { fr: "La pochette. Pour les embruns.", en: "The pocket square. For the sea spray." },
        dit: {
          fr: [
            "Depuis, chaque ticket du Salon repose sur un coussin. Et la pochette, c'est pour les embruns.",
            "Il y a beaucoup d'embruns, les soirs où quelqu'un gagne gros. Ne le répétez pas. Sortez. Revenez.",
          ],
          en: [
            "Ever since, every ticket in the Salon rests on a cushion. And the pocket square is for the sea spray.",
            "There is a great deal of sea spray, on nights when someone wins big. Don't repeat that. Leave. Come back.",
          ],
        },
      },
    ],
    apres: {
      image: "dessin:coussin",
      legende: { fr: "Le coussin. Il n'en veut toujours pas.", en: "The cushion. He still won't have it." },
      dit: {
        fr: [
          "Maintenant que vous savez. Hmpf. Ce ticket par terre, le groom l'avait posé là. Exprès. Sur le pavé.",
          "Je lui ai offert un coussin, pour les suivants. Il refuse. Il dit qu'il faut se baisser. Il a raison. Hmpf.",
        ],
        en: [
          "Now that you know. Hmph. That ticket on the ground: the bellboy had put it there. On purpose. On the cobbles.",
          "I offered him a cushion, for the next ones. He refuses. He says one has to bend down. He is right. Hmph.",
        ],
      },
    },
  },

  // ------------------------------------------------------------ Sir Auguste, le Cercle
  cercle: {
    lieu: "cercle",
    hote: "auguste",
    titre: { fr: "Mon dernier bouton", en: "My last button" },
    temps: [
      {
        image: "place:cercle",
        legende: { fr: "Le Cercle. Moustache exigée.", en: "The Club. Moustache required." },
        dit: {
          fr: [
            "Trois défaites. La moustache l'avait annoncé : elle a frémi dès votre premier jeton. Prenez un fauteuil.",
            "Un majordome ne parle jamais de lui. J'ai donc parié que je le ferais. Je déteste perdre.",
          ],
          en: [
            "Three defeats. The moustache saw it coming: it quivered at your very first chip. Do take an armchair.",
            "A butler never speaks of himself. So I bet that I would. I do hate losing.",
          ],
        },
        bouton: { fr: "Prendre un fauteuil", en: "Take an armchair" },
      },
      {
        image: "item:paquebot",
        legende: { fr: "Le paquebot. Trente ans de service.", en: "The liner. Thirty years of service." },
        dit: {
          fr: [
            "J'ai servi trente ans sur un paquebot. On n'y pariait pas. Alors je pariais seul. Contre l'horizon.",
            "Un soir, j'ai parié mes gages que nous arriverions à l'heure. Nous sommes arrivés à l'heure. Au mauvais port.",
          ],
          en: [
            "I served thirty years aboard a liner. Nobody gambled there. So I bet alone. Against the horizon.",
            "One evening I bet my wages that we would arrive on time. We arrived on time. At the wrong port.",
          ],
        },
        bouton: { fr: "Au mauvais port ?", en: "The wrong port?" },
      },
      {
        image: "symbole:pie:bouton",
        legende: { fr: "Mon dernier bouton.", en: "My last button." },
        dit: {
          fr: [
            "Grattouille-les-Bains. Sans un sou, en queue-de-pie, un plateau vide à la main. Très digne. Très fauché.",
            "Il me restait un bouton. Je l'ai parié : je trouverai quelque chose par terre avant midi.",
          ],
          en: [
            "Grattouille-les-Bains. Without a penny, in a tailcoat, holding an empty tray. Very dignified. Very broke.",
            "I had one button left. I bet it: I shall find something on the ground before noon.",
          ],
        },
        bouton: { fr: "Et alors ?", en: "And then?" },
        son: "jeton",
      },
      {
        image: "symbole:morpion:moustache",
        legende: { fr: "La moustache. Premier frémissement.", en: "The moustache. First quiver." },
        dit: {
          fr: [
            "Un ticket. Sous ma semelle. La moustache a frémi pour la première fois. Elle n'a plus cessé.",
            "J'avais gagné mon pari. Contre moi-même. J'ai dû me payer. Ce fut une soirée confuse.",
          ],
          en: [
            "A ticket. Under my sole. The moustache quivered for the very first time. It has never stopped.",
            "I had won my bet. Against myself. I had to pay up. It was a confusing evening.",
          ],
        },
        bouton: { fr: "Et le Cercle ?", en: "And the Club?" },
        son: "ticket",
      },
      {
        image: "pnj:baron",
        legende: { fr: "Le Baron. Sa moustache de gala est au vestiaire.", en: "The Baron. His gala moustache is in the cloakroom." },
        dit: {
          fr: [
            "J'ai ouvert un cercle où l'on n'entre qu'avec une moustache. J'en prête à l'entrée. Par courtoisie.",
            "Le Baron en porte une, les soirs de gala. Ne le répétez pas : il la rend toujours un peu humide.",
          ],
          en: [
            "I opened a club where no one gets in without a moustache. I lend them at the door. As a courtesy.",
            "The Baron wears one on gala nights. Don't repeat it: he always hands it back a little damp.",
          ],
        },
        bouton: { fr: "Et les paris ?", en: "And the bets?" },
      },
      {
        image: "dessin:bateau",
        legende: { fr: "Le bateau du matin. Les paris sont ouverts.", en: "The morning boat. Bets are open." },
        dit: {
          fr: [
            "Depuis, je parie sur chaque nouveau venu qui descend du bateau. Qu'il s'en sortira. Je n'ai jamais perdu.",
            "Hector dit que je triche. Je ne triche pas : je sers. Un majordome voit toujours ce qui manque à quelqu'un.",
          ],
          en: [
            "Ever since, I bet on every newcomer who steps off the boat. That they'll make it. I have never lost.",
            "Hector says I cheat. I do not cheat: I serve. A butler always sees what someone is missing.",
          ],
        },
      },
    ],
    apres: {
      image: "symbole:pie:bouton",
      legende: { fr: "Recousu. Au fil rouge.", en: "Sewn back on. With red thread." },
      dit: {
        fr: [
          "Maintenant que vous savez : le ticket sous ma semelle, le groom l'y avait glissé. J'avais parié que non.",
          "J'ai donc perdu un pari. Une seule fois. Et un bouton. Il me l'a rendu l'autre matin. Recousu au fil rouge.",
        ],
        en: [
          "Now that you know: the ticket under my sole had been slipped there by the bellboy. I had bet it hadn't.",
          "So I did lose a bet. Just the once. And a button. He gave it back the other morning. Sewn on with red thread.",
        ],
      },
    },
  },

  // ------------------------------------------------------------ Le Commodore, le Yacht
  yacht: {
    lieu: "yacht",
    hote: "balthazar",
    titre: { fr: "Douze jours sans un mot", en: "Twelve days without a word" },
    temps: [
      {
        image: "place:yacht",
        legende: { fr: "Le Démesure. À quai.", en: "The Excess. In port." },
        dit: {
          fr: [
            "Trois fois coulé ! Par vous ! Je vous nomme invité d'honneur. C'est moins salissant que mousse.",
            "Montez sur la passerelle. Je vais vous confier un secret d'état-major.",
          ],
          en: [
            "Sunk three times! By you! I hereby appoint you guest of honour. It's less messy than cabin boy.",
            "Come up on the bridge. I shall entrust you with a top-brass secret.",
          ],
        },
        bouton: { fr: "Monter à bord", en: "Come aboard" },
      },
      {
        image: "dessin:caisse",
        legende: { fr: "La cale. Deuxième caisse à gauche.", en: "The hold. Second crate on the left." },
        dit: {
          fr: [
            "Ce jour-là, je ne suis pas arrivé sur le pont. Je suis arrivé dans la cale. Clandestin. Entre deux caisses.",
            "Dans l'une des caisses, on sanglotait. Un homard. On l'attendait en cuisine. Et pas comme invité.",
          ],
          en: [
            "That day, I did not arrive on deck. I arrived in the hold. A stowaway. Between two crates.",
            "Inside one of the crates, someone was sobbing. A lobster. He was expected in the galley. Not as a guest.",
          ],
        },
        bouton: { fr: "Pauvre homard !", en: "Poor lobster!" },
      },
      {
        image: "item:grand-cordon",
        legende: { fr: "L'Ordre du Homard. Créé le treizième jour.", en: "The Order of the Lobster. Created on day thirteen." },
        dit: {
          fr: [
            "Je l'ai caché dans mon bec. Douze jours. Je n'ai pas dit un mot de toute la traversée. Moi ! Douze jours !",
            "Il pince quand il rêve. J'ai tenu bon. C'est là que j'ai gagné mes galons. Je me les suis remis moi-même.",
          ],
          en: [
            "I hid him in my bill. Twelve days. I did not say one word the whole crossing. Me! Twelve days!",
            "He pinches when he dreams. I held firm. That is where I earned my stripes. I pinned them on myself.",
          ],
        },
        bouton: { fr: "Et à l'arrivée ?", en: "And on arrival?" },
      },
      {
        image: "ticket:signe-du-homard",
        legende: { fr: "Son ticket. Il touche des droits.", en: "His ticket. He gets royalties." },
        dit: {
          fr: [
            "Nous avons débarqué à deux, sans un sou. C'est lui qui a vu le ticket sur le quai. Il l'a gratté à la pince.",
            "Gagnant ! Gaspard en a fait un ticket à son nom : le Signe du Homard. Il touche des droits. En crevettes.",
          ],
          en: [
            "Two of us stepped ashore without a penny. He was the one who spotted the ticket. He scratched it with a claw.",
            "A winner! Gaspard named a ticket after him: Sign of the Lobster. He gets royalties. In shrimps.",
          ],
        },
        bouton: { fr: "Et le yacht ?", en: "And the yacht?" },
        son: "ticket",
      },
      {
        image: "symbole:arcane:ancre",
        legende: { fr: "L'ancre. Jamais levée.", en: "The anchor. Never weighed." },
        dit: {
          fr: [
            "Avec nos gains, j'ai acheté une coque. Puis un pont. Puis trop de ponts. D'où le nom.",
            "Le Démesure n'a jamais quitté le quai : j'ai le mal de mer. Un commodore à quai, c'est rare. Donc très chic.",
          ],
          en: [
            "With our winnings I bought a hull. Then a deck. Then too many decks. Hence the name.",
            "The Excess has never left the quay: I get seasick. A commodore in port is rare. Therefore very chic.",
          ],
        },
        bouton: { fr: "Et les mousses ?", en: "And the cabin boys?" },
      },
      {
        image: "item:beret",
        legende: { fr: "Le béret des mousses. Il y en a trois.", en: "The cabin boys' beret. There are three of them." },
        dit: {
          fr: [
            "Je fais fouiller les cales chaque soir. On y trouve parfois quelqu'un qui n'a pas pu payer son billet.",
            "Je le nomme mousse. Ils sont trois. Le homard est leur capitaine. Rompez ! Et pas un mot à l'équipage.",
          ],
          en: [
            "I have the holds searched every night. Now and then we find someone who couldn't pay their fare.",
            "I make them a cabin boy. There are three. The lobster is their captain. Dismissed! Not a word to the crew.",
          ],
        },
      },
    ],
    apres: {
      image: "symbole:mets:homard",
      legende: { fr: "Le homard. Il a pris la cabine.", en: "The lobster. He took the cabin." },
      dit: {
        fr: [
          "Maintenant que vous savez : notre ticket, le groom l'avait posé tout au bord du quai. À hauteur de homard.",
          "Il pense à tout le monde. Depuis, c'est une carte qui voyage dans mon bec. Le homard, lui, a pris la cabine.",
        ],
        en: [
          "Now that you know: the bellboy had put our ticket right at the edge of the quay. At lobster height.",
          "He thinks of everyone. These days it's a card that travels in my bill. The lobster took the cabin.",
        ],
      },
    },
  },

  // ------------------------------------------------------------ Maître Taupin, la Banque
  banque: {
    lieu: "banque",
    hote: "taupin",
    titre: { fr: "Coffre & Fils", en: "Vault & Sons" },
    temps: [
      {
        image: "place:banque",
        legende: { fr: "La Banque. Avant l'aube.", en: "The Bank. Before dawn." },
        dit: {
          fr: [
            "Trois défaites. Je les ai inscrites, tamponnées, classées. En trois exemplaires. Un par défaite.",
            "Le règlement prévoit, dans ce cas, une confidence. Article unique. Je l'ai rédigé ce matin.",
          ],
          en: [
            "Three defeats. I have entered, stamped and filed them. In triplicate. One copy per defeat.",
            "In such cases the rules provide for a confidence. One single article. I drafted it this morning.",
          ],
        },
        bouton: { fr: "Lire l'article", en: "Read the article" },
        son: "tampon",
      },
      {
        image: "dessin:taupiniere",
        legende: { fr: "Mon arrivée. Terrasse du Grand Café.", en: "My arrival. The terrace of the Grand Café." },
        dit: {
          fr: [
            "Je ne suis pas arrivé par le bateau. J'ai creusé. Je visais une banque, en Suisse. Je vois mal de loin.",
            "Je suis ressorti sous la terrasse du Grand Café. Ondine a regardé le trou. Elle a accusé le vent du large.",
          ],
          en: [
            "I did not come by boat. I dug. I was aiming for a bank, in Switzerland. My long sight is poor.",
            "I came up under the terrace of the Grand Café. Ondine looked at the hole. She blamed the sea breeze.",
          ],
        },
        bouton: { fr: "Et alors ?", en: "And then?" },
      },
      {
        image: "dessin:ticket",
        legende: { fr: "Pièce numéro 1. Non grattée.", en: "Item number 1. Unscratched." },
        dit: {
          fr: [
            "Sur la taupinière, il y avait un ticket. Je ne l'ai pas gratté : il n'était pas à mon nom. Je l'ai classé.",
            "Je cherche son propriétaire depuis. Le dossier fait quatre cents pages. Colonne Propriétaire : vide.",
          ],
          en: [
            "On the molehill lay a ticket. I did not scratch it: it was not in my name. I filed it.",
            "I have been looking for its owner ever since. The file runs to four hundred pages. Owner column: empty.",
          ],
        },
        bouton: { fr: "Et la Banque ?", en: "And the Bank?" },
        son: "tampon",
      },
      {
        image: "symbole:cocktail:ombrelle",
        legende: { fr: "Coffre numéro 2. Vendu par Gaspard.", en: "Vault number 2. Sold by Gaspard." },
        dit: {
          fr: [
            "Il fallait le mettre en sûreté. J'ai creusé un coffre. Puis une banque autour. C'est l'ordre logique.",
            "Coffre numéro 2 : un parapluie. Gaspard me l'a vendu pour le tunnel. Il ne pleut pas, dans un tunnel.",
          ],
          en: [
            "It had to be kept safe. I dug a vault. Then a bank around the vault. That is the logical order.",
            "Vault number 2: an umbrella. Gaspard sold it to me for the tunnel. It does not rain in a tunnel.",
          ],
        },
        bouton: { fr: "Pourquoi “& Fils” ?", en: "Why ‘& Sons’?" },
      },
      {
        image: "dessin:registre",
        legende: { fr: "Le registre des arrivées. Colonne Famille.", en: "The arrivals ledger. Family column." },
        dit: {
          fr: [
            "Coffre & Fils. Je n'ai pas de fils. J'ai fait peindre l'enseigne quand même. Elle est en règle.",
            "Le registre des arrivées a une colonne Famille. Quand quelqu'un débarque seul, j'y écris : “& Fils”.",
          ],
          en: [
            "Vault & Sons. I have no sons. I had the sign painted all the same. It is perfectly in order.",
            "The arrivals ledger has a Family column. When someone lands alone, I write in it: ‘& Sons’.",
          ],
        },
        bouton: { fr: "À tout le monde ?", en: "For everyone?" },
      },
      {
        image: "item:lunettes-rondes",
        legende: { fr: "Mes lunettes. De près, je vois très bien.", en: "My glasses. Up close, I see very well." },
        dit: {
          fr: [
            "À tout le monde. Vous y êtes aussi. Tamponné. Cela ne donne droit à rien.",
            "Sauf à une chaise ici, les nuits où les comptes ne tombent pas juste. Ils tombent rarement juste.",
          ],
          en: [
            "For everyone. You are in it too. Stamped. It entitles you to nothing.",
            "Except a chair here, on nights when the books don't balance. They seldom balance.",
          ],
        },
        son: "tampon",
      },
    ],
    apres: {
      image: "dessin:ticket",
      legende: { fr: "Propriétaire : quatre lettres.", en: "Owner: four letters." },
      dit: {
        fr: [
          "Maintenant que vous savez : j'ai rempli la colonne Propriétaire de mon premier ticket. Quatre lettres.",
          "Je ne l'ai toujours pas gratté. Un cadeau, cela se conserve. Je le lui ai dit. Il a rougi jusqu'au calot.",
        ],
        en: [
          "Now that you know: I have filled in the Owner column for my first ticket. Four letters.",
          "I still haven't scratched it. A gift is for keeping. I told him so. He blushed right up to his cap.",
        ],
      },
      son: "tampon",
    },
  },

  // ------------------------------------------------------------ Dame Séléné, la Lune
  lune: {
    lieu: "lune",
    hote: "selene",
    titre: { fr: "Celle qui levait les yeux", en: "The one who looked up" },
    temps: [
      {
        image: "place:lune",
        legende: { fr: "Le Croissant de Lune. Vue sur tout.", en: "The Crescent Moon. A view of everything." },
        dit: {
          fr: [
            "Trois fois. D'ici, je vous regardais venir. Les trois fois. C'était joli. Approchez du bord.",
            "Je vais vous dire comment on arrive si haut. Par distraction, bien sûr.",
          ],
          en: [
            "Three times. From here I watched you coming. All three times. It was pretty. Come closer to the edge.",
            "I shall tell you how one ends up so high. By not paying attention, of course.",
          ],
        },
        bouton: { fr: "S'approcher du bord", en: "Step up to the edge" },
      },
      {
        image: "dessin:bateau",
        legende: { fr: "Le bateau du matin. Je regardais en l'air.", en: "The morning boat. I was looking up." },
        dit: {
          fr: [
            "Je suis arrivée par le bateau du matin. Sans un sou, comme tout le monde.",
            "En débarquant, tout le monde regarde par terre. Moi, j'ai levé les yeux. Il n'y avait rien, là-haut.",
          ],
          en: [
            "I came on the morning boat. Without a penny, like everybody else.",
            "Stepping ashore, everybody looks down. I looked up. There was nothing up there.",
          ],
        },
        bouton: { fr: "Rien du tout ?", en: "Nothing at all?" },
      },
      {
        image: "dessin:echelle",
        legende: { fr: "Le lendemain matin. Avec une échelle.", en: "The next morning. With a ladder." },
        dit: {
          fr: [
            "Pas même une lune. J'ai dit tout haut que c'était dommage. Un groom a noté quelque chose sur sa manche.",
            "Le lendemain, il y avait un croissant. Et une échelle. Un lièvre ne refuse jamais une échelle.",
          ],
          en: [
            "Not even a moon. I said out loud that it was a pity. A bellboy jotted something on his cuff.",
            "The next day there was a crescent. And a ladder. A hare never says no to a ladder.",
          ],
        },
        bouton: { fr: "Et le ticket ?", en: "And the ticket?" },
        son: "etoile",
      },
      {
        image: "dessin:mouette",
        legende: { fr: "La livraison. Essoufflée.", en: "The delivery. Out of breath." },
        dit: {
          fr: [
            "Mon ticket était resté sur le quai : je regardais en l'air. Une mouette me l'a monté. Essoufflée.",
            "Gagnant, bien sûr. Je lui dois toujours le pourboire. Elle le sait. Elle repasse.",
          ],
          en: [
            "My ticket had stayed on the quay: I was looking up. A seagull flew it up to me. Out of breath.",
            "A winner, of course. I still owe her the tip. She knows. She keeps calling round.",
          ],
        },
        bouton: { fr: "Et d'en haut ?", en: "And from up here?" },
        son: "mouette",
      },
      {
        image: "item:jumelles-opera",
        legende: { fr: "Mes jumelles. Je ne dirai pas ce qu'on y voit.", en: "My opera glasses. I shan't say what one sees." },
        dit: {
          fr: [
            "D'ici, je vois Ondine offrir la première citronnade. Hector compter de travers. Le Baron ouvrir sa porte.",
            "Sir Auguste parier sur un inconnu. Taupin écrire “& Fils”. Le Commodore fouiller ses cales. Gaspard guetter.",
          ],
          en: [
            "From here I see Ondine pour the first lemonade for free. Hector miscount. The Baron open his door.",
            "Sir Auguste bet on a stranger. Taupin write ‘& Sons’. The Commodore search his holds. Gaspard keep watch.",
          ],
        },
        bouton: { fr: "Ils le savent ?", en: "Do they know?" },
      },
      {
        image: "symbole:constellation:lievre",
        legende: { fr: "Ma constellation. Visible du quai.", en: "My constellation. You can see it from the quay." },
        dit: {
          fr: [
            "Chacun croit être le seul. Je ne dirai rien. C'est joli, un secret. Huit, c'est plus joli encore.",
            "D'ici, on ne voit pas qui est riche. On voit qui regarde par terre et qui lève les yeux. Vous faites les deux.",
          ],
          en: [
            "Each of them thinks they're the only one. I shan't tell. Secrets are so pretty. Eight are prettier still.",
            "From here you can't see who is rich. You see who looks down, and who looks up. You do both.",
          ],
        },
      },
    ],
    apres: {
      image: "pnj:piou",
      legende: { fr: "Il voit grand.", en: "He does think big." },
      dit: {
        fr: [
          "Maintenant que vous savez : la Lune, Piou l'a accrochée dans la nuit. Parce que j'avais dit dommage.",
          "Je lui sers de vigie. Quand le bateau du matin paraît, j'allume le croissant. En bas, les poches se trouent.",
        ],
        en: [
          "Now that you know: Piou hung the Moon. Overnight. Because I had said it was a pity.",
          "I keep watch for him. When the morning boat appears, I light the crescent. Down below, pockets spring holes.",
        ],
      },
      son: "etoile",
    },
  },
};

/** Les temps d'une histoire, dans l'ordre : son corps, et le temps de plus pour qui a vu la vraie fin. */
export function tempsDe(lieu: PlaceId, vraieFin: boolean): readonly Temps[] {
  const histoire = HISTOIRES[lieu];
  return vraieFin ? [...histoire.temps, histoire.apres] : histoire.temps;
}

/** Tout le texte des histoires, dans les deux langues : pour les tests de parité et pour la relecture. */
export const TEXTES_HISTOIRES = { histoires: HISTOIRES, encore: ENCORE };
