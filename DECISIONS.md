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
Grattouille. » Ce que la demande ne tranchait pas, tranché au plus simple :

- **Cinq cartes fermées, une seule triche.** Chacun reçoit cinq cartes et peut en remplacer
  UNE par la carte de son choix, pourvu qu'il ne l'ait pas déjà. Deux joueurs peuvent donc
  montrer la même carte : c'est un indice. Pas de cartes communes, pas de tirage.
- **Une main en cinq temps** : la blinde (payée par tous), la donne, la triche (secrète et
  simultanée), un seul tour d'enchères à la limite du pot (trois relances au plus, tapis et
  pots annexes comme au poker), puis l'abattage, où chaque joueur encore en jeu peut accuser
  un autre joueur encore en jeu.
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
  grossièrement, accuse au hasard. Normal : triche une fois sur trois, accuse les mains
  trop belles et les cartes qu'il tient lui-même. Difficile : triche discrètement, accuse
  d'après la vraisemblance. Leur argent est fictif : le poker contre des robots crée ou
  détruit de l'argent, dans des proportions voisines de celles des tickets.
- **Les tables de la maison** : une par lieu ouvert, contre l'hôte et deux personnages, à la
  blinde du ticket le moins cher du lieu ; facile au Kiosque et au Grand Café, normal au
  Casino et au Salon, difficile ensuite.
- **Les défis** (la campagne) : un tête-à-tête contre l'hôte de chaque lieu ouvert, 30
  blindes chacun. La blinde monte en cours de duel (elle double toutes les quatre mains,
  puis toutes les deux) et un joueur qui ne peut plus la payer joue son reste à tapis : un
  duel se dénoue en 14 à 16 mains en médiane. La première fois qu'il ruine l'hôte d'un
  lieu, le joueur reçoit sa cagnotte : 100 blindes de ce lieu. Huit défis, du Kiosque à la
  Lune.
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
- **Pas de musique ni de boucle d'ambiance** : choix délibéré, pour ne pas lasser.

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
  secondes), pas une partie jouée de bout en bout par une personne.
