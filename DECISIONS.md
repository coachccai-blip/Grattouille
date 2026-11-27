# Décisions

Ce que le brief ne tranchait pas, et le choix retenu à chaque fois : le plus simple qui
respecte les principes de la section 2. Les numéros de section renvoient à `BRIEF.md`.

## 0. Extension du 26 novembre : trente tickets, huit lieux, dix heures de jeu

La demande du 26 novembre (couvrir le rayon des tickets à gratter, doubler la durée de vie
à une dizaine d'heures, partir sans rien, ne jamais rester bloqué) prend le pas sur le
brief là où les deux se contredisent : sections 5 et 6, annexe A, tableau 5.7. Tout le
reste du brief tient toujours.

**Les jeux de la liste, pas leurs titres.** La liste reçue reprend des tickets vendus en
bureau de tabac. Le brief interdit de les reprendre (section 3 : « Tickets originaux.
Aucun nom, logo, visuel ni mise en page de tickets existants »). Chaque famille de jeux de
la liste a donc son ticket original, avec un nom, un dessin et un prix propres à
Grattouille. Quinze tickets s'ajoutent aux quinze du brief ; les familles déjà couvertes
n'ont pas été doublées.

| Famille demandée | Dans le jeu |
|---|---|
| Mots croisés (trois formats) | **La Grille du Jour**, **Sésame** : moteur `mots` |
| Multiplicateurs (X10, X20) | **Grande Marée**, **Intérêts Composés** : moteur `coef` |
| Deux camps face à face | **Le Rouge et le Noir**, **Bâbord, Tribord**, **Éclipse Totale** : moteur `camps` |
| Casino | **Le Rouge et le Noir**, et le Bandit Manchot du brief |
| Tarot, divination | **La Bonne Aventure** (huit arcanes au choix) |
| Coffre, banque | **Sésame**, **Compte Numéroté**, **Intérêts Composés**, à la Banque Coffre & Fils |
| Mélanges | **Cocktails du Commodore** |
| Aventure, voyage | **Saute-Crabe**, **Le Pari de Sir Auguste** : moteur `parcours` |
| Trésors à assembler | **Pêche au Gros**, et La Pie Voleuse du brief |
| Gros tickets à plusieurs jeux | **Le Gratte-Ciel**, et Le Grand Grattouille du brief |
| Trois montants identiques, numéros gagnants | La Tirelire de Piou, Bas de Laine, Mille-Pattes (brief), **Compte Numéroté** |
| Blackjack, astrologie, football, solitaire | Le 21 d'Hector, Signe du Homard, Lucarne, Réussite (brief) |
| Morpion | Tic-Tac-Truffe, Moustache d'Or (brief), **L'Alignement des Planètes** |

Non repris : le ticket à deux lots seulement (10 ou 200), qui n'entre dans aucun des trois
tempéraments ; les prix et les gains maximaux de la liste, puisque dans Grattouille le prix
d'un ticket marque l'étape (de 1 € à 1 000 Md€) et que le gain maximal découle du
tempérament (500, 1 000 ou 5 000 fois la mise).

**Quatre moteurs nouveaux**, soit onze en tout, avec le même contrat que les sept du
brief (`evaluate(buildLayout(def, gain, seed)) === gain` pour chaque gain du tableau) :

- `parcours` : trois dés à gratter, un pion qui avance du total sur un chemin de 18 cases,
  le gain est sur la case d'arrivée. Les totaux du milieu, les plus fréquents, portent les
  cases vides et les petits lots.
- `coef` : six montants et un coefficient (1, 2, 3, 5, 10 ou 20). Trois montants
  identiques, multipliés par le coefficient.
- `mots` : une grille de dix mots croisés et dix lettres à gratter. Le nombre de mots
  entièrement découverts fait le gain. Vingt grilles (dix par ticket), composées une fois
  pour toutes à partir de deux lexiques français et figées dans
  `src/engines/mots-grilles.ts` ; les mots s'écrivent avec dix lettres courantes.
- `camps` : neuf cases, deux camps. Le joueur choisit son camp avant de gratter ; s'il sort
  au moins cinq fois, il gagne le lot. Le choix ne change pas les chances.

**Huit lieux.** Après le Cercle : le Yacht « Démesure » (★ 5 000), la Banque Coffre & Fils
(★ 15 000) et le Croissant de Lune (★ 40 000). Les seuils des quatre lieux suivants du
brief sont relevés (10 → 20, 60 → 130, 250 → 400, 1 000 → 1 400) : les nouveaux biens à
quelques euros apportent des ★ plus tôt, et chaque lieu garde ainsi sa durée. Trois hôtes : le Commodore (pélican), Maître Taupin (taupe), Dame
Séléné (hase). Un cinquième registre de politesse, « Votre Immensité », au-delà de
★ 15 000.

**110 biens.** Les 52 biens de l'annexe A gardent leur prix, leurs ★ et leur boutique. 58
s'ajoutent aux deux bouts : de quoi commencer en gueux (ficelle à rôti à 1 €, chapeau en
papier journal, carton sous le ponton) et finir très loin (station orbitale, comète
apprivoisée à 40 Bn€). Total : 167,93 Bn€ et 67 578 ★. Le Kiosque passe à 250 Bn€ et
12 422 ★ : 80 000 ★ tout rond avec la collection complète. Le barème « prix → ★ » du brief
est prolongé par paliers jusqu'à 4 000 ★ par bien.

**Une unité de plus.** Mille milliards s'écrivent « 1 Bn€ » (un billion). Au-delà de
999 Bn€, plus de décimales. Le plus gros gain possible (5 000 fois 1 000 Md€) reste sous
`Number.MAX_SAFE_INTEGER`.

**On débarque sans un sou.** Le solde de départ est 0 € (4 € dans le brief). Le premier
ticket se ramasse par terre, sur l'écran d'accueil, et rapporte toujours 5 fois son prix :
5 €. Un rang accompagne la progression, du « Gueux » au « Crésus », puis « Patron ».

**Le ticket trouvé par terre** remplace le ticket offert par la maison (section 5.5). C'est
un exemplaire du ticket le moins cher du meilleur lieu débloqué, toujours gagnant, qui
rapporte 3 fois son prix. Il apparaît dans deux cas :

- *fauché* : plus de quoi acheter ce ticket et plus rien à gratter. Vingt secondes au plus
  après le précédent, sans limite de nombre. C'est ce qui garantit qu'on ne reste jamais
  bloqué, et qu'on ne redescend jamais d'un lieu ;
- *chance* : huit minutes après le précédent, même avec de l'argent, s'il reste de la place
  dans la pile.

Il se ramasse sur le Domaine (il brille au pied de l'avatar), sur la Promenade et, quand
on est fauché, au comptoir. Le serveur décide ; l'état rendu au client porte `luckyIn`, le temps restant
avant la prochaine trouvaille, pour que l'horloge de l'appareil ne compte pas. La route est
`POST /api/tickets/found` ; `POST /api/tickets/house` reste servie pour une page déjà
ouverte au moment d'une mise à jour.

**Comptes créés avec la première version.** Ils gardent leur solde, leurs biens et leurs
statistiques ; rien n'est à migrer. Un ticket les attend par terre à leur retour. Seule
conséquence : un lieu dont le seuil a été relevé peut se refermer jusqu'au prochain achat
en boutique (un compte à ★ 15 avait le Grand Café, il lui faut maintenant ★ 20).

**Limite quotidienne.** 6 000 tickets par jour au lieu de 3 000 : la partie est deux fois
plus longue, le frein contre les robots garde la même marge (quatre parties entières par
jour).

**Rythme mesuré** (`npm run simulate`, 6 000 parties par style, nombre médian de tickets
grattés avant chaque étape) :

| Style de jeu | Grand Café | Casino | Salon | Cercle | Yacht | Banque | Lune | Kiosque |
|---|---|---|---|---|---|---|---|---|
| Prudent (5 % du solde) | 119 | 282 | 496 | 795 | 1 072 | 1 411 | 1 736 | 1 900 |
| Standard (10 %) | 81 | 222 | 388 | 617 | 831 | 1 092 | 1 351 | 1 515 |
| Joueur (20 %) | 58 | 185 | 327 | 516 | 692 | 911 | 1 130 | 1 296 |
| Flambeur (50 %) | 42 | 159 | 304 | 480 | 644 | 837 | 1 034 | 1 212 |
| Tapis (tout le solde) | 27 | 126 | 272 | 442 | 602 | 791 | 994 | 1 173 |

Style standard : 1 515 tickets, soit 10,1 heures à 24 secondes par ticket (le brief en
comptait 753). 80 % des parties finissent entre 1 181 et 1 878 tickets. Par partie :
1,2 ticket trouvé faute de quoi jouer, 75 par chance. Aucune des 30 000 parties simulées
n'est restée bloquée. Ce tableau remplace celui de la section 5.7 comme référence de la
simulation.

## 0 bis. Suite du 26 novembre : récit, épure, anglais

Trois demandes du propriétaire du jeu, qui priment sur le brief là où elles le contredisent.

**Plus de mention « Jeu de fiction, aucun gain réel ».** Elle disparaît des tickets, de
l'écran de chargement, de l'écran de bienvenue, des réglages, de la page et du manifeste
(le brief la demandait à plusieurs endroits). Il reste, dans Réglages → À propos, un
paragraphe sobre « Dans la vraie vie » (les vraies chances d'un ticket, le numéro d'aide) :
c'est le seul endroit, et il se retire en une ligne si on n'en veut plus.

**Aucun texte sur un autre.**
- Le tampon « PAYÉ » ne se pose plus sur les cases : il est dans le talon du ticket, à
  droite du numéro de série.
- L'écran de grattage a trois étages : l'en-tête, le ticket, et un plateau sous le ticket
  qui porte les boutons puis le résultat. Les très gros gains ont leur fête en plein écran,
  sur fond opaque.
- Le composant qui resserre un montant trop long mesurait au pixel entier et ne se
  remesurait jamais : c'était la cause des montants rognés. Il mesure au dixième de pixel
  et se remesure. Un montant ne passe sur deux lignes que si son unité est un mot (M€,
  Md€, Bn€).
- Le bandeau du bac à sable a sa propre ligne en haut de l'écran.
- Une information n'est dite qu'une fois par écran : « Trouvé par terre » ne figure que
  sur le ticket, « jusqu'à X » que sur la miniature, l'hôte ne réagit qu'une fois.
- Une sonde automatique (`scratchpad`, hors dépôt) parcourt 124 écrans par langue et
  mesure chaque ligne de texte : aucun recouvrement en français ni en anglais à 360 × 640.

**Deux langues, le français par défaut.**
- `src/i18n/` : `t("Phrase française")` rend la phrase dans la langue courante ; la clé est
  la phrase française elle-même, les traductions sont dans `src/i18n/en/` (un dictionnaire
  par zone du jeu). Une phrase sans traduction reste en français et se signale
  (`i18nMisses()`), ce que les tests et la recette contrôlent.
- Les noms tirés des données (30 tickets, 110 biens, lieux, boutiques, espèces, rangs,
  tempéraments) passent par `src/i18n/noms.ts`. Les titres anglais des tickets sont
  originaux eux aussi (« Leapcrab », « Rainy-Day Sock », « One-Flippered Bandit »).
- Les répliques ont leurs deux versions côte à côte dans `src/app/dialogues.ts` : une
  adaptation, pas un mot à mot.
- Les montants s'écrivent à l'anglaise en anglais : « €1,500 », « €1.25M », « €1.25B »
  (milliard), « €1.25T » (billion). Le serveur, lui, n'écrit qu'en français : en anglais le
  client choisit le texte d'une erreur d'après son code.
- Les mots croisés ont leurs grilles anglaises (20 grilles, mêmes dix lettres). Le gain
  d'un ticket ne dépend jamais de la langue : seule l'image change.
- Les espaces insécables du français ne sont posées qu'en français.
- La langue se choisit dans les réglages et sur l'écran de bienvenue ; elle est gardée
  dans `grattouille.settings`. Changer de langue remonte tout l'écran d'un coup (la racine
  porte la langue en clé) : aucun composant n'a d'abonnement à gérer.

**Le récit.** Une seule journée en huit chapitres, du matin sur le port au lever de Terre
sur la Lune : chaque lieu qui ouvre a son carton de chapitre et son hôte qui se présente.
Un fil rouge court du premier ticket au générique (« qui sème les tickets ? ») : chaque
personnage a sa théorie, glissée dans une réplique d'accueil sur sept. Au rachat du
Kiosque, Gaspard avoue : c'est la tradition, le patron laisse tomber un ticket pour qui
débarque sans rien. Le joueur, devenu Patron, en laisse tomber un à son tour ; l'épilogue
montre l'inconnu qui débarque le lendemain. Piou donne une consigne à la fois, de la
première minute à l'après-fin. Le bouton d'inscription devient « Débarquer ».

## 0 ter. Le Poker Tricheur

Demande du 26 novembre : un poker entre amis, par tables à code, avec l'argent du jeu, où
chacun peut tricher d'une carte et accuser les autres ; des robots de difficulté réglable ;
des tables selon le patrimoine ; un retour dans la campagne. « Le sport national de
Grattouille. » Ce que la demande ne tranchait pas, tranché au plus simple.

Trois points de cette section ont changé avec la version 2.1 (section 0 quinquies) : les
enchères sont désormais sans limite, les défis se jouent en trois manches sans prime à
part, et les robots sont nettement plus forts. Ils sont corrigés ci-dessous.

- **Cinq cartes fermées, une seule triche.** Chacun reçoit cinq cartes et peut en remplacer
  UNE par la carte de son choix, pourvu qu'il ne l'ait pas déjà. Deux joueurs peuvent donc
  montrer la même carte : c'est un indice. Pas de cartes communes, pas de tirage.
- **Une main en cinq temps** : la blinde (payée par tous), la donne, la triche (secrète et
  simultanée), un seul tour d'enchères sans limite (trois relances au plus, tapis et pots
  annexes comme au poker ; à la limite du pot jusqu'à la version 2.0), puis l'abattage, où
  chaque joueur encore en jeu peut accuser un autre joueur encore en jeu.
- **Les accusations.** L'accusé qui a triché est démasqué : il perd toute sa mise, qui reste
  au pot, et sort de la main. L'accusé innocent reçoit de chaque accusateur une somme égale
  à sa propre mise. Un tricheur que personne n'accuse garde son secret : la triche n'est
  jamais révélée autrement. Seuls les joueurs de l'abattage accusent : ce sont eux qui ont
  un pot à gagner, et un risque à prendre.
- **Cas limites.** Une mise que personne n'a suivie revient à son joueur avant l'abattage
  (« la mise de l'accusé » est ce qu'il avait vraiment en jeu). Les accusations se jugent
  une à une : un accusateur démasqué paie quand même s'il a accusé à tort. Un pot dont tous
  les prétendants sont démasqués reste sur la table pour la main suivante ; qui quitte la
  table y renonce.
- **La table.** 2 à 6 sièges, une blinde sur une échelle (1, 2, 5, 10… jusqu'à 1 000 Md€),
  une cave entre 20 et 100 blindes, un code de 5 caractères. On ne s'assoit qu'à une table.
- **Le patrimoine.** Il faut de quoi poser 20 blindes pour s'asseoir, et la blinde d'une
  table créée ne dépasse pas le quarantième de la bourse du créateur.
- **Les robots** portent le nom et le portrait des personnages. Facile : triche peu et
  grossièrement, accuse au jugé. Normal : solide, accuse les mains trop belles et les cartes
  qu'il tient lui-même. Difficile : triche discrètement, accuse d'après la vraisemblance,
  et ne se laisse pas plumer (leurs réglages et leurs mesures : section 0 quinquies). Leur
  argent est fictif : le poker contre des robots crée ou détruit de l'argent, dans des
  proportions voisines de celles des tickets.
- **Les tables de la maison** : une par lieu ouvert, contre l'hôte et deux personnages, à la
  blinde du ticket le moins cher du lieu ; facile au Kiosque et au Grand Café, normal au
  Casino et au Salon, difficile ensuite.
- **Les défis** (la campagne) : un tête-à-tête contre l'hôte de chaque lieu ouvert. La
  blinde monte en cours de duel et un joueur qui ne peut plus la payer joue son reste à
  tapis. Huit défis, du Kiosque à la Lune. Depuis la version 2.1, chaque défi se joue en
  trois manches à mise doublée, sans prime à part (section 0 quinquies) ; jusqu'à la 2.0,
  c'était 30 blindes chacun et une cagnotte de 100 blindes à la première victoire, qui
  reste acquise à qui l'a touchée.
- **Serveur.** Pas de WebSocket : le client interroge sa table (réponse minimale quand rien
  n'a changé). Pas de minuteur côté serveur non plus : chaque requête fait d'abord avancer
  la table jusqu'à l'heure courante (délais échus, tours des robots). Le moteur est pur
  (`shared/poker/`) : c'est lui que les tests éprouvent et que le bac à sable réutilise.
- **L'argent entre la bourse et la table** passe par deux écritures qui ne sont pas
  atomiques ; chaque mouvement porte un identifiant et se rejoue sans doublon. Les tests
  coupent le serveur avant et après chaque écriture : pas un euro créé ni perdu.
- **Limites connues.** Les tables abandonnées ne sont pas nettoyées du stockage (elles ne
  retiennent pas d'argent). Chaque interrogation coûte deux lectures. `npm run simulate`
  ne modélise pas les gains du poker.

## 0 quater. Bruitages, animations et effets

Demande du 26 novembre : « une vraie expérience auditive » et des animations « pour
gamifier davantage ».

- **Tout est synthétisé** (Web Audio, `src/fx/audio.ts`) : une soixantaine de sons, aucun
  fichier, aucune dépendance. Une seule famille : une petite boîte à musique de bord de mer,
  sur une gamme pentatonique commune, pour qu'on puisse jouer une heure sans couper le son.
  Un son d'interface dure moins de 200 ms ; le jackpot a sa fanfare de deux secondes ; un
  ticket perdu a une petite chute tendre, jamais moqueuse. Une mouette à l'arrivée au port.
- **Chaque geste a son son**, déclenché là où l'événement se produit : boutons (trois appuis
  distincts), onglets, feuilles, interrupteurs, refus, achats (le distributeur, la caisse,
  une note par étoile gagnée), la bourse qui compte, le grattage, les dés, les cartes, les
  lettres, le pion, les paliers de gain, le tampon, le ticket trouvé, les temps du récit,
  et les dix sons du poker.
- **Sortie** : un limiteur et seize voix au plus ; un même son ne se redéclenche pas avant
  105 ms. Le réglage « Son » coupé, rien ne démarre, pas même le contexte audio.
- **Ces sons ont été vérifiés par mesure, pas à l'oreille** : un script compte ce qui se
  déclenche à chaque geste (97 gestes), un rendu hors ligne mesure durée et niveau de chaque
  son. Leur agrément reste à juger sur un vrai téléphone.
- **Animations** : uniquement `transform` et `opacity`. Transitions entre écrans (l'écran
  entre par la droite, repart par la droite, les onglets se fondent, les feuilles montent,
  les grands moments lèvent leur rideau), compteurs qui défilent (le gain, puis la bourse
  quand les pièces arrivent ; la fortune et le Standing), listes en cascade (12 éléments au
  plus, 40 ms d'écart), cartes qui se retournent, dés qui roulent, pion qui saute de case en
  case, étoiles qui jaillissent, reflet sur le bouton d'achat à portée, écran qui tremble
  d'un cheveu sur un gros gain.
- **Aucune animation ne fait attendre** : un écran se touche dès sa deuxième image, et les
  fêtes de gain gardent leurs durées. « Animations réduites » (ou la préférence du système)
  remplace tout mouvement par un fondu bref.
- **Pas de musique** dans la version 2.0 : choix d'alors, pour ne pas lasser. Le
  propriétaire en a demandé depuis : dix musiques d'ambiance, coupées par un réglage à
  elles (section 0 quinquies).

## 0 quinquies. La version 2.1 : la suite de l'histoire, le poker repensé, l'agence, les trophées, la musique

Demandes du 27 novembre, arrivées l'une après l'autre : une cinématique de plus pour qui
a tout acheté et gagné tous les défis (« la version avec Piou en fondateur de la ville »),
des musiques d'ambiance, le droit de laisser tomber des tickets à son tour, des trophées,
une table de poker contre quatre hôtes « avec des montants astronomiques » ; puis
l'histoire de chaque hôte dans les Souvenirs, un magasin d'« expériences de vie », la mise
libre et le tapis au poker, des robots qui misent gros, des défis en trois manches, deux
modes de table entre amis, des robots plus forts ; enfin les Souvenirs rangés « dans la
section trophées pour améliorer leur visibilité ». Et, dès la première : « attention à ne
pas impacter l'avancée des joueurs actuels ».

### La règle d'or : rien ne bouge pour les joueurs déjà là

- **Aucune donnée du jeu n'a changé** : ni prix, ni seuil de Standing, ni bien (toujours
  110), ni ticket, ni tableau de lots. `npm run simulate` rend au chiffre près le tableau
  de la section 0. Les récompenses de cette version ne se vendent pas et ne donnent pas de
  Standing.
- **Aucune migration.** Chaque champ ajouté à l'enregistrement d'un joueur est facultatif
  (`stats.sown`, `stats.sownValue`, `masters`, `pokerStats`, `hostWins`, `experiences`,
  `vraieFin`) et reçoit sa valeur par défaut à la lecture (`toState`). Lire un compte ne le
  réécrit pas ; une écriture ordinaire n'y glisse aucun champ nouveau. Les tests rejouent
  des enregistrements écrits par les versions 1.0, 1.1 et 2.0 (`tests/suite.test.ts`), et
  la répétition les dépose tels quels dans le vrai client Blobs avant de les faire lire par
  la fonction empaquetée.
- **Rien que des ajouts dans l'API** : trois routes neuves (`POST /api/tickets/sow`,
  `POST /api/story/seen`, `POST /api/experiences/buy`), des champs en plus dans l'état et
  dans le hall du poker. Une page restée ouverte avec l'ancien code continue de
  fonctionner ; une page neuve qui parle un instant à l'ancien serveur complète elle-même
  ce qui manque (`src/app/etat.ts`). Une table de poker déjà ouverte au moment de la mise à
  jour se joue et se règle selon ses règles d'origine.
- **Tout ce qui était mérité est acquis d'emblée.** Les trophées se calculent sur l'état du
  joueur, rien n'est stocké : un vieux compte a tout de suite les médailles de ce qu'il a
  déjà fait. Les défis relevés en 2.0 comptent. Un Patron d'avant la mise à jour peut semer
  dès sa première visite ; s'il avait aussi relevé les huit défis, la vraie fin l'attend
  sur son Domaine.
- **Le classement** : seules les Légendes y portent une marque (un as de cœur). Les entrées
  et la signature de publication des autres comptes gardent leur forme : personne n'est
  republié pour rien.
- **Les réglages de l'appareil** gagnent trois champs (musique, médailles vues, histoires
  écoutées), lus avec une valeur par défaut. Toujours trois clés de stockage local.
- **Un écran chargé à la demande qui n'arrive pas** (la page était ouverte pendant une mise
  à jour) se referme et invite à recharger, au lieu d'un écran blanc.

### Semer des tickets

- Dès que le Kiosque est à lui, le joueur peut laisser tomber des tickets pour ceux qui
  débarquent sans rien : un, cinq ou dix d'un coup, au prix du comptoir, depuis la fiche
  d'un ticket. Ce ne sont pas ses tickets : rien à gratter, rien de joué, rien de gagné. Sa
  bourse (et donc sa fortune au classement) baisse d'autant : c'est un don, et c'est voulu.
- Le reste est du récit : chaque ticket semé est trouvé par un nouveau venu qui dit sa
  chance, et des protégés écrivent à 1, 3, 8, 15, 30, 60, 120 et 250 tickets semés. Tout se
  déduit du nombre de tickets semés (le Carnet du Patron) : rien d'autre n'est enregistré.
- Le geste « Laisser tomber un ticket » du premier générique sème désormais pour de bon une
  Tirelire de Piou (1 €), quand la bourse le permet.
- Même délai d'une seconde que pour un achat. Pas de plafond quotidien : semer ne rapporte
  rien, il n'y a rien à protéger.

### La vraie fin, « Huit as de cœur », et les Souvenirs

- La vraie fin se mérite : le Kiosque et les huit hôtes battus au moins une fois, dans
  n'importe quel ordre. Elle se joue au retour sur le Domaine et se marque comme vue côté
  serveur (`story.vraieFin`). On y apprend que Piou, le groom, a fondé la ville.
- Elle débloque le rang « Légende » à la place de « Patron », le tout premier ticket exposé
  sous cloche sur le Domaine, un dos de cartes doré au poker, de nouvelles répliques, la
  marque au classement et une médaille. Rien qui se vende.
- **Les Souvenirs** sont le second rayon de la section Trophées : les deux fins à revoir, et
  l'histoire de chacun des huit hôtes. Une relecture ne rappelle pas le serveur et ne sème
  rien.
- **Rangés avec les trophées, pas dans les Réglages.** Ils y étaient d'abord, et le
  propriétaire les a voulus « dans la section trophées pour améliorer leur visibilité » :
  personne ne va chercher une histoire dans des réglages. La section s'ouvre depuis la
  plaque du Domaine et porte deux rayons, « Médailles » et « Souvenirs », qu'un sélecteur
  échange sans empiler d'écran (Retour ramène toujours au Domaine). La pastille de la
  plaque compte tout ce qui est neuf, médailles à regarder et histoires à écouter ; s'il
  n'y a de neuf que des histoires, la plaque mène droit aux Souvenirs. Le rayon Souvenirs
  porte lui aussi le compte des histoires qui attendent. L'entrée des Réglages a disparu :
  un seul chemin, celui qu'on voit.
- **L'histoire d'un hôte** s'ouvre quand on a gagné les trois manches de son défi. Le compte
  est tenu par le serveur (`hostWins`). Rétroactif autant que possible : un défi relevé
  avant cette version compte pour la première manche ; les revanches gagnées en 2.0
  n'étaient pas comptées et ne peuvent pas l'être. Remporter la Table des Maîtres n'ouvre
  aucune histoire.
- **Sans divulgâcher** : une histoire peut s'ouvrir avant les deux fins (trois victoires
  contre Gaspard sont possibles dès le Kiosque). Son corps ne dit ni qui sème les tickets
  ni qui a fait la ville ; un dernier temps s'y ajoute une fois la vraie fin vue. Un test
  relit chaque histoire pour s'en assurer.

### Le poker repensé

- **Sans limite.** Le propriétaire voulait miser un montant libre et faire tapis ; avec des
  enchères plafonnées au pot, cela n'avait pas de sens. Une mise va désormais de la blinde
  à tout le tapis. Un seul tour, trois relances au plus : le reste ne change pas. L'écran
  garde trois tailles proposées et gagne une saisie libre (son propre pavé de chiffres et
  des touches d'unité, pour ne pas taper quinze chiffres) et un bouton Tapis, confirmé.
- **Des parties plus courtes**, c'était le but. En médiane : un défi se dénoue en 8 à 10
  mains (15 avant) ; un tapis de 50 blindes double ou disparaît en 13 à 25 mains à une
  table ordinaire (51 à 166 avant, selon le niveau).
- **Des robots plus forts**, à la demande du propriétaire (« ils se couchent trop souvent et
  ne disent pas assez "tricheurs" »). Confiant, un robot mise jusqu'à trois fois le pot ; il
  lui arrive de bluffer ; il triche pour des mains plausibles. Face à une mise du pot, le
  robot difficile se couche 17 fois sur 100 (48 avant) et le normal 28 (40 avant). Il accuse
  un tricheur dont la main le bat 82 fois sur 100 (54 avant) ; le normal 42 (16), le facile
  35 (10). Ils accusent aussi un peu plus souvent à tort (11, 3 et 9 fois sur 100).
- **Pousser son tapis à chaque main n'est pas une martingale** : ce joueur-là gagne un défi
  41 fois sur 100 contre le robot facile, 14 contre le normal, 13 contre le difficile. Qui
  triche à chaque main pour la meilleure main gagne 58, 37 et 2 fois sur 100. Qui joue bien
  et triche discrètement : 72, 65 et 45. Mesuré sur 400 défis par case.
- **Le défi en trois manches** (« un sentiment de progression plutôt que trois fois le même
  défi »). Chacun pose la même mise et le gagnant repart avec tout : 100 blindes du lieu à
  la manche 1 (100 € au Kiosque, on repart avec 200 €), le double à la manche 2, encore le
  double à la manche 3. L'hôte se défend un cran mieux à chaque manche, et ses répliques
  changent. À la troisième victoire son histoire s'ouvre ; le défi reste ensuite jouable en
  revanche, aux conditions de la manche 3.
- **Plus de prime à part** : l'ancienne cagnotte de 100 blindes à la première victoire
  disparaît (elle reste acquise à qui l'a touchée). La cagnotte est ce que l'hôte pose sur
  la table ; perdre, c'est perdre sa mise. Sur les trois manches, un hôte rapporte 700
  blindes de son lieu à qui les gagne toutes (130 avant), et en coûte autant à qui les perd.
  Entrer coûte plus cher qu'avant : 100 blindes au lieu de 30.
- **« Les huit défis relevés »** veut toujours dire : chaque hôte battu au moins une fois.
  C'est ce qui ouvre la Table des Maîtres et la vraie fin.
- **La Table des Maîtres** : le joueur contre quatre des huit hôtes, tirés au sort, au
  niveau difficile. Blinde de départ 10 Bn€, cagnotte de 300 Bn€ chacun, pas de recave, la
  blinde monte, les perdants sont éliminés, le dernier assis remporte tout (1 500 Bn€). Elle
  se dénoue en 16 mains en médiane (9 tables sur 10 entre 7 et 23). Un robot à la place du
  joueur la gagne une fois sur cinq. On peut partir avec son tapis, sans victoire.
- **En tournoi, un robot tient à son tapis** tant que la blinde est basse : il n'engage plus
  le tiers de son tapis sans un brelan, ni ne suit un tapis sans une très belle main. Sans
  cette retenue, les maîtres s'éliminaient entre eux dès la première main (une table sur
  quatre) ; un maître tombe désormais avant la troisième main dans 3,5 % des tables. La
  retenue s'efface à mesure que la blinde monte : la fin de partie reste rapide.
- **Deux modes de table entre amis**, choisis à la création. Classique (le mode par défaut,
  celui des tables existantes) : chacun choisit sa cave, recave permise, on sort quand on
  veut. Table des Maîtres : le même tournoi, entre amis — même cagnotte pour tous (30
  blindes de départ), même barème, on rejoint avant le lancement. Il dure 18 à 21 mains en
  médiane, selon le nombre de sièges.
- **Quitter un tournoi entre amis, c'est abandonner** : le tapis reste sur la table pour le
  gagnant, sans quoi celui qui mène partirait avec ses gains. Seul humain encore là, on
  reprend son tapis et la table ferme. Un absent n'est pas écarté tant qu'un autre humain
  joue : la blinde entame son tapis, il revient quand il veut. Si plus personne n'a de
  jetons (tous à tapis et démasqués), les joueurs de la dernière main se partagent le pot.
- **Seule la Table des Maîtres du hall compte pour le trophée** : sinon un tournoi à 1 €
  entre amis suffirait.
- **Les compteurs du poker** (`pokerStats` : mains, pots, tricheurs démasqués, fois où l'on
  s'est fait prendre) n'existaient pas avant : ils partent de zéro pour tout le monde, et
  sont versés quand on quitte la table.
- **Limites connues.** Le robot difficile est dur : c'est lui qu'on affronte à la troisième
  manche de chaque défi, et dès la première à partir du Cercle. Une page restée ouverte avec
  l'ancien écran qui rejoindrait un tournoi ne le reconnaîtrait pas. Le tournoi à plusieurs humains a été joué par les
  tests et par un second joueur piloté dans la même page, pas sur plusieurs téléphones.

### L'Agence Carpe Diem : les expériences de vie

- **Le nom** : l'Agence Carpe Diem, tenue par Madame Diem, une carpe koï. Le jeu de mots
  tient dans les deux langues. Cinquième enseigne de l'onglet Boutiques.
- **Trente expériences**, de 3 € (une glace face à la mer) à 500 Bn€ (des vacances pour
  toute la ville) : `shared/experiences.ts`. Chacune a sa scène animée, en plein écran.
- **Une expérience n'est pas un bien.** Elle ne donne pas de Standing, n'entre pas dans la
  collection et ne compte pour rien dans le rachat du Kiosque : la progression existante ne
  change pas. Elle se vit une fois ; on la revit ensuite gratuitement.
- **Son prix reste compté dans la fortune**, comme celui d'un bien : s'offrir un voyage ne
  fait pas reculer au classement. (Semer un ticket, au contraire, est un don.)

### Les trophées

- Treize familles, quarante-deux médailles : tickets joués, plus gros gain sur un seul
  ticket, jackpots, tickets semés et leur valeur, collection, lieux ouverts, expériences
  vécues (la dernière médaille les demande toutes), Kiosque, défis de poker, tricheurs
  démasqués, Table des Maîtres, vraie fin. `shared/trophies.ts` est une fonction pure de
  l'état du joueur.
- Les trophées liés à la suite de l'histoire restent sous un drap tant qu'ils ne sont pas à
  portée, pour ne rien divulgâcher.
- Les médailles déjà vues sont retenues sur l'appareil. À la première visite après la mise
  à jour, pas de rafale d'annonces : une pastille sur le Domaine.
- La section a deux rayons : les médailles, et les Souvenirs (voir plus haut).
- Seul le trophée des tricheurs démasqués ne peut pas être rétroactif : ils n'étaient pas
  comptés en 2.0.

### Les musiques d'ambiance

- Dix thèmes synthétisés (Web Audio, aucun fichier) : un par lieu, joué à son comptoir et
  pendant qu'on y gratte, un pour les écrans principaux, un pour le poker. Chaque tonalité
  contient les cinq notes des bruitages.
- Un réglage « Musique », indépendant de « Son », allumé par défaut. Rien ne démarre avant
  le premier geste ; tout se tait quand la page est cachée. Le moteur et les partitions
  sont chargés à la demande.
- **Composées à l'aveugle** : vérifiées par la mesure (niveau, saturation, nombre de voix,
  fuites), jamais écoutées dans l'environnement de travail. Leur niveau, placé un peu sous
  les bruitages d'interface, est un pari : il tient à une constante (`NIVEAU`, dans
  `src/fx/musique/moteur.ts`).

### Le poids

- Le premier chargement reste sous les 300 Ko de JavaScript compressé du brief. Tout écran
  neuf est chargé à la demande, avec ses dessins et ses textes dans les deux langues ; le
  dictionnaire anglais du poker (plus de trois cents phrases) a quitté le démarrage pour
  voyager avec ses écrans.

### Ce qui a été vérifié avant de livrer

- 1 078 tests (19 fichiers), dont ceux qui rejouent des comptes des versions 1.0, 1.1 et
  2.0 ; `npm run simulate` identique au chiffre près (10,1 heures, aucune partie bloquée).
- À l'écran, sous Chromium, en français et en anglais, à 360 × 640, 320 × 568 et 390 × 844 :
  l'ancien parcours du jeu (124 écrans, quatre passes) ne montre aucun changement pour un
  joueur ordinaire ; les écrans neufs (jusqu'à 143 par passe, six passes) sont sondés un à
  un — textes qui se recouvrent, coupés, hors écran ou sous 12 px, traductions manquantes.
  Aucune traduction ne manque. Le seul défaut trouvé (la cagnotte d'un tournoi cachée sous
  le bouton à 320 px) est corrigé. Ont été joués de bout en bout : la vraie fin, une
  histoire d'hôte, des tickets semés par un, cinq et dix, six expériences de l'agence, une
  Table des Maîtres. Les Souvenirs une fois passés dans la section Trophées, les écrans
  neufs ont été repris dans les deux langues à 360 et 320 px : rien à signaler.
- La répétition depuis l'archive : installation, construction, tests, simulation, puis la
  fonction empaquetée par l'outil de Netlify, branchée sur le client Blobs — le parcours
  général, puis les comptes d'avant déposés tels quels dans le store.
- Ce qui n'a pas pu l'être est à la section 8.

## 1. Déploiement (jalon 0)

**Voie retenue : la voie B d'abord (déposer le projet entier sur Netlify), la voie A
(dépôt GitHub relié) en repli.** L'archive `livraison/grattouille-netlify.zip`, fabriquée
par `npm run zip`, contient le projet à sa racine, sans `node_modules` ni `dist`.

Le dépôt sur Netlify lui-même **n'a pas été essayé** : l'environnement où le projet a été
écrit n'a pas d'accès à un compte Netlify. La question ouverte de la section 16.1 (les
fonctions sont-elles prises en charge par le glisser-déposer ?) reste donc à trancher au
premier dépôt : si la fonction `api` n'apparaît pas dans la liste des fonctions, passer à
la voie A. Sans sa fonction, la page le dit elle-même (« Le kiosque n'est pas encore
ouvert ») et propose le bac à sable.

Ce qui a été vérifié à la place, à partir de l'archive décompressée dans un dossier vide :

- `npm install`, `npm run build`, `npm test` (155 tests) et `npm run simulate` passent ;
- `netlify/functions` est empaqueté sans erreur par l'outil de construction de Netlify,
  `@netlify/zip-it-and-ship-it` 16.6.0 : une fonction `api`, API de fonctions version 2,
  route `/api/*`, `@netlify/blobs` embarqué ;
- la fonction ainsi empaquetée, branchée sur le serveur Blobs local fourni par
  `@netlify/blobs/server`, répond comme attendu : santé, création de compte, pseudo déjà
  pris, premier ticket (5 fois son prix), déclaration, achat en boutique, tenue,
  classement, clé d'administration, suppression. Un compte créé dans le contexte de
  production est inconnu d'un aperçu, et inversement (stores `gr-*-prod` et `gr-*-test`).

Autres points de déploiement :

- **Documentation Netlify.** `docs.netlify.com` n'était pas joignable depuis
  l'environnement de travail. Le code est aligné sur les types et les notices des paquets
  installés : `@netlify/blobs` 11.1.11 (`getStore({ name, consistency: "strong" })`,
  `getWithMetadata`, `setJSON` avec `onlyIfMatch` et `onlyIfNew`) et `@netlify/functions`
  6.1.2. À relire sur la page de l'annexe C si un appel se comporte autrement en ligne.
- **Node 22** (`.node-version`, `engines`) : `@netlify/blobs` 11 demande Node 22.12 au moins.
- **Région** : valeurs par défaut, comme le demande la section 16.5.
- **`ADMIN_KEY`** : sans clé d'au moins 8 caractères, la route d'administration est
  fermée à tout le monde.
- **Serveur Blobs local.** Il ne renvoie pas d'etag à la lecture et son écriture
  conditionnelle n'est pas atomique. `server/storage.blobs.ts` va donc chercher l'etag par
  `list()` quand la lecture n'en donne pas, et refuse d'écrire s'il n'en trouve aucun.
  Conséquence : avec `netlify dev`, deux achats lancés exactement en même temps peuvent
  passer tous les deux. En ligne, c'est l'écriture conditionnelle du service qui protège ;
  les tests rejouent ce conflit de façon déterministe (`tests/blobs.test.ts`).

## 2. Dépendances

À l'exécution : `react`, `react-dom`, `zustand`, `@netlify/blobs`, et rien d'autre.

Au développement, en plus de Vite, TypeScript, Vitest et leurs types :

- `@fontsource/abril-fatface` et `@fontsource/jost` : les polices sont servies par le
  site (woff2, sous-ensemble latin, 44 Ko en tout). Aucun appel à un serveur tiers, ce
  qui permet une politique de sécurité `font-src 'self'`.
- `@netlify/functions` : les types `Config` et `Context` du point d'entrée.
- `tsx` : lance `scripts/simulate.ts` et `scripts/serve.ts`.

**Images bitmap.** Les seules sont les quatre icônes d'installation de `public/`
(192, 512, 512 masquable, 180 pour iOS). iOS n'accepte pas d'icône SVG sur l'écran
d'accueil, et la section 16.7 demande que l'application s'installe avec son icône. Elles
sont dessinées en SVG puis rendues par `scripts/make-icons.mjs` (outil ponctuel, qui
demande Playwright : il n'est pas dans les dépendances). Tout le reste est du SVG écrit
dans le code.

## 3. Économie et règles

- **`formatEuros` arrondit au plus proche**, comme l'exemple du brief (20 029 535 €
  s'écrit « 20,03 M€ »). À 999,995 M€ on passe à « 1 Md€ », à 999,995 Md€ à « 1 Bn€ ».
  Au-delà de 999 Bn€, plus de décimales : « 1 250 Bn€ ».
- **Chances affichées** (`oddsLabel`) : une décimale sous 10, un entier au-delà, arrondi
  au pair le plus proche pour retomber sur les tableaux de la section 5 (62,5 donne 62).
- **Simulation.** Le brief décrit le joueur simulé mais laisse deux points ouverts. Avec
  le monde du brief, son tableau 5.7 était retrouvé à 2,4 % près avec ces deux lectures :
  l'étape d'un lieu est le premier ticket que le joueur y achète (pas le moment où son
  Standing l'ouvre) ; le Kiosque est racheté dès que le solde atteint son prix. Le joueur
  simulé ramasse un ticket par terre quand il est fauché, et un tous les 20 tickets pour la
  chance (huit minutes de jeu). `npm run simulate` compare désormais au tableau de la
  section 0 et sort en erreur si une médiane s'écarte de plus de 15 %, ou si une partie
  reste bloquée.
- **Ticket trouvé par terre.** Il compte dans les tickets grattés et dans les tickets
  gagnants, pas dans les mises. Il ne consomme pas la limite de 6 000 tickets par jour.
- **Sécurité des grands nombres.** Les additions de solde et de statistiques plafonnent
  à `Number.MAX_SAFE_INTEGER`.

## 4. Serveur

- **`server/storage.ts` et `server/storage.blobs.ts`.** L'interface et la version en
  mémoire d'un côté, la version Netlify Blobs de l'autre. Le bac à sable du client peut
  ainsi réutiliser le vrai code du serveur sans embarquer `@netlify/blobs` dans le
  navigateur.
- **`server/app.ts` et `server/router.ts`.** `app.ts` route une `Request` vers une
  `Response` avec des dépendances injectées (stockage, horloge, hasard) : c'est lui que
  les tests, le serveur de développement et le bac à sable appellent. `router.ts` est la
  jonction avec Netlify : contexte `prod` ou `test`, Blobs, `ADMIN_KEY`, `waitUntil`.
- **Codes d'erreur.** `SERVER_ERROR` (500) s'ajoute à la liste de la section 15.5. Le
  client connaît en plus `NETWORK` (pas de réponse) et `NO_SERVER` (la page est servie
  sans sa fonction) ; ils ne sortent jamais du serveur.
- **Classement.** Publication à la création du compte, puis quand ce qui se voit au
  classement a changé (fortune, Standing, espèce, tenue, Kiosque), au plus toutes les
  30 secondes par joueur. Une publication qui échoue efface sa marque : l'écriture suivante du joueur la
  rattrape. `GET /api/leaderboard` rend les 200 entrées gardées ; l'écran en montre 100,
  plus le rang du joueur.
- **Pseudo réservé puis abandonné.** La réservation porte l'identifiant du compte et une
  date. Une réservation sans compte ne peut être reprise qu'après 60 secondes : deux
  inscriptions simultanées ne peuvent pas se voler un pseudo.
- **Administration.** `POST /api/admin/ban { playerId, unban? }` avec
  `Authorization: Bearer {ADMIN_KEY}`. `unban: true` lève le bannissement ; le joueur
  revient au classement à sa prochaine écriture.
- **Requêtes.** Corps JSON de 4 Ko au plus, type de contenu `application/json` exigé.
  Pas d'en-têtes CORS : la page et l'API ont la même origine.

## 5. Client

- **Bac à sable** (`?bac-a-sable`). C'est le vrai code de `server/` branché sur le
  stockage en mémoire, chargé à la demande (6 Ko compressés). Mêmes règles, mêmes
  tableaux de lots ; tout disparaît au rechargement. Trois raccourcis de démonstration :
  `&solde=5000000`, `&biens=30` (possède d'emblée les 30 biens les moins chers ; `110` pour
  tout le catalogue), `&palier=jackpot` (chaque ticket acheté tombe sur ce palier de
  résultat).
- **Développement sans Netlify.** `npm run dev` sert aussi `/api/*` avec le stockage en
  mémoire (`scripts/dev-api.ts`). `npm run serve` sert la version construite de la même
  façon. `netlify dev` reste possible pour essayer Blobs en local.
- **Politique de sécurité du contenu.** Une balise `meta` injectée à la construction
  (tout en `'self'`, aucune autre origine), plus les en-têtes de `netlify.toml`.
- **Navigation.** Aucune route d'URL. Chaque écran est une entrée d'historique : le
  bouton retour du téléphone ramène à l'écran précédent et referme une fiche. Le Domaine
  est la racine.
- **Stockage local.** Les trois clés de la section 11, rien d'autre.
  `grattouille.settings` garde aussi le signe, l'arcane ou le camp choisi la dernière fois
  sur chaque ticket à choix, et le fait d'avoir déjà vu l'invitation à noter son code.
- **Pannes au lancement.** Trois écrans : pas de réseau, serveur en erreur, page publiée
  sans sa fonction. Un compte que le serveur ne connaît plus ramène à l'écran de
  bienvenue avec un message.
- **Typographie française.** Les textes s'écrivent avec des espaces ordinaires. La
  fabrique JSX du projet (`src/jsx/`, branchée dans `vite.config.ts`) pose les espaces
  insécables à l'affichage (`src/app/typo.ts`) : avant « ; ! ? : », à l'intérieur des
  guillemets, entre un nombre et son unité, après « Mme » et « Mlle ». Une ligne ne
  commence donc jamais par « ! » ou « € », et il n'y a rien à appeler à la main.
- **Chiffres tabulaires.** Jost n'en fournit pas (mesuré : `tabular-nums` ne change rien).
  La bourse et le Standing affichent donc chaque chiffre dans une case de largeur fixe,
  comme le prévoit la section 13.5.
- **Écrans étroits et texte agrandi.** Le solde s'écrit en 20 px à partir de 400 px de
  large, puis rétrécit jusqu'à 16 px à 320 px. Quand la bourse et le Standing ne tiennent
  plus côte à côte, le Standing passe dessous. Vérifié à 430, 390, 360, 320 et 277 px de large (277 px : un téléphone de
  360 px zoomé à 130 %).
- **Comptoir.** À l'arrivée, le ticket présenté est le dernier regardé dans ce lieu,
  sinon le moins cher. Un lieu propose de trois à cinq tickets : le carrousel se centre
  sur le ticket choisi et des points disent où l'on en est.
- **Grands moments.** L'accueil de Piou, l'ouverture d'un lieu et le générique de fin sont
  de vrais dialogues : l'écran derrière eux est inerte (`inert`), au doigt comme au clavier.
- **Titres longs.** Les noms de lieux et de boutiques ont leur propre ligne et peuvent
  passer sur deux.

## 6. Tickets et grattage

- **Dimensions.** Tout le ticket est en `em` : sa taille de police vaut un vingt-cinquième
  de sa largeur. La miniature du comptoir et le grand ticket sont le même composant.
  Sur le grand ticket, aucun texte ne descend sous 12 px ; un montant trop long est
  resserré en largeur plutôt que rapetissé.
- **Taille du grand ticket.** Il prend la largeur disponible, sans dépasser la hauteur
  laissée par l'en-tête et le bouton « Tout gratter ». À 360 × 640, les cases à gratter
  des 30 tickets mesurent au moins 44 px (vérifié ticket par ticket, de l'achat au
  résultat).
- **Mille-Pattes.** Quinze numéros en 5 colonnes de 3.
- **Le Grand Grattouille et Le Gratte-Ciel.** Trois volets, un à la fois. « Tout gratter »
  balaie le volet en cours, puis les suivants. Le Gratte-Ciel monte en ascenseur
  (`parcours`), touche une prime (`coef`) et finit au sommet (`morpion`).
- **Tickets à choix.** Le signe, l'arcane ou le camp se choisit avant de gratter ; le
  dernier choisi est proposé la fois suivante.
- **Montants sur une case.** Jusqu'à cinq caractères, le montant tient sur une ligne ;
  au-delà, le nombre passe au-dessus de son unité (« 1 500 » puis « Md€ »).
- **Couleurs.** Chaque ticket a son papier, son encre à gratter et sa zone de jeu,
  décrits dans `src/ticket/themes.ts` à partir de la palette de la section 13.2.
- **Pinceau.** Le pinceau marque dès qu'il touche une case non révélée ; le son et les
  copeaux ne partent que si de l'encre a vraiment été retirée.

## 7. Illustrations

- Un registre unique, `src/art/registry.ts`, liste les 269 illustrations attendues
  (articles, lieux, personnages, espèces, vignettes et symboles des tickets). La planche
  de contrôle `?planche` les montre toutes et signale celles qui manqueraient. Les
  illustrations de l'extension sont dans des fichiers à part (`*-2.tsx`, `wardrobe-3.tsx`),
  à côté de celles du brief.
- Deux inscriptions dessinées en tracés, sans police : « 25 KG » sur le sac à patates,
  « MOT » sur la vignette de Sésame.
- Trois couleurs hors palette, pour des symboles qui n'ont pas d'équivalent : jaune
  citron `#FBE04F`, violet améthyste `#8C5FBF`, bleu aigue-marine `#7FD0DD`.
- La chouette n'a pas d'aigrettes (le hibou, c'est Archibald). Le champagne est une
  coupe, pas une bouteille. Le masque du manchot est cerise.

## 8. Ce qui reste à vérifier en conditions réelles

Rien de ceci n'a pu être fait depuis l'environnement de travail :

- le dépôt sur Netlify, `/api/health` en production, la fonction dans la liste, `ADMIN_KEY` ;
- un vrai téléphone : latence du grattage au doigt, vibrations, son (le contexte audio
  démarre au premier toucher), installation sur l'écran d'accueil d'un iPhone et d'un
  Android ;
- Safari et Firefox : tous les parcours automatisés ont tourné sous Chromium seulement ;
- les noms des trente tickets, à revérifier avant d'ouvrir au public (section 16.7) : ils
  ont été choisis pour ne reprendre aucun titre existant, sans recherche d'antériorité ;
- la durée d'une partie : dix heures sont une mesure de simulation (1 515 tickets à 24
  secondes), pas une partie jouée de bout en bout par une personne ;
- les musiques : composées et mesurées, jamais écoutées (section 0 quinquies) ;
- le poker à plusieurs sur de vrais téléphones, en particulier un tournoi entre amis ;
- l'agrément des robots renforcés : leurs taux sont mesurés par simulation contre des
  profils de joueur écrits à la main, pas contre des personnes.
