# Grattouille — brief fonctionnel

Version 1.0, 25 novembre 2026.

Ce document décrit tout ce qu'il faut pour développer Grattouille : l'univers, les règles, les chiffres, les écrans, la technique et l'ordre de réalisation. Il est écrit pour être lu par Claude Code et suivi jalon par jalon.

## Sommaire

1. Comment utiliser ce brief
2. Le jeu en une page
3. Cadre : un jeu de fiction
4. Univers et direction artistique
5. Boucle de jeu et progression
6. Économie
7. Les tickets
8. Le grattage
9. Boutiques, avatar et domaine
10. Classement
11. Compte et sauvegarde
12. Écrans et navigation
13. Design system
14. Mouvement, son et vibrations
15. Architecture technique
16. Déploiement sur Netlify
17. Qualité
18. Plan de réalisation
19. Après la V1

Annexes : A. Catalogue complet, B. Dialogues et textes d'interface, C. Sources vérifiées.

---

## 1. Comment utiliser ce brief

- Placer ce fichier à la racine du dépôt sous le nom `BRIEF.md`.
- Travailler jalon par jalon (section 18). Premier message conseillé : « Lis BRIEF.md en entier. Réalise le jalon 0, puis arrête-toi et dis-moi ce que je dois vérifier. »
- Les chiffres des sections 5, 6 et de l'annexe A sont contractuels. Ils ont été calibrés par simulation (section 6.7) : les recopier tels quels dans `shared/`, ne pas les arrondir ni les « améliorer » sans relancer la simulation.
- Quand le brief ne tranche pas, choisir l'option la plus simple qui respecte les principes de la section 2 et la consigner dans `DECISIONS.md`.
- Conventions : interface en français, identifiants de code tels qu'écrits ici, argent en euros entiers (jamais de centimes, jamais de nombres à virgule).
- Les API Netlify évoluent. Avant d'écrire le code serveur, relire les pages de l'annexe C et s'aligner sur les versions installées de `@netlify/blobs` et `@netlify/functions`.

## 2. Le jeu en une page

Grattouille est un jeu mobile de tickets à gratter où la chance est scandaleusement du côté du joueur. On arrive à Grattouille-les-Bains avec 4 € en poche. On gratte, on gagne souvent et parfois énormément, on s'habille, on se loge, on roule, et l'élégance ouvre des salons où les tickets coûtent des millions. À la fin, on rachète le kiosque où tout a commencé.

| | |
|---|---|
| Plateforme | Application web mobile en portrait, installable sur l'écran d'accueil |
| Public | Adultes francophones, jeu décontracté à une main |
| Session type | 3 à 10 minutes |
| Durée de l'aventure | 500 à 1 000 tickets, soit environ 3 à 4 heures cumulées, puis classement sans fin |
| Modèle | Gratuit, sans achat, sans publicité |
| Technique | Vite, React, TypeScript, Netlify Functions, Netlify Blobs |

### Sept principes

1. **Le ticket est la star.** C'est le seul objet brillant et tactile de l'écran. Tout le reste de l'interface est mat et calme pour lui laisser la place.
2. **La maison perd exprès.** Environ un ticket sur deux gagne, et chaque euro misé en rapporte en moyenne entre 2,59 et 4,89. Le joueur doit sentir cette générosité dès la première minute.
3. **L'élégance ouvre les portes.** Ce qu'on achète donne du Standing, et le Standing donne accès aux tickets plus chers. Dépenser fait avancer.
4. **La journée avance avec la fortune.** Chaque lieu a son heure : matin au port, minuit au Cercle. On voit sa richesse à la lumière.
5. **Tout répond au doigt.** Chaque geste obtient une réponse visible et sonore en moins de 100 ms.
6. **Pompeux mais tendre.** Typographie de palace, personnages qui se prennent très au sérieux, situations idiotes.
7. **Jamais de pression.** Pas de compte à rebours, pas de relance après une perte, pas de « presque gagné » fabriqué. On peut toujours rejouer, on n'est jamais bloqué.

## 3. Cadre : un jeu de fiction

Grattouille imite le plaisir de gratter, pas le jeu d'argent. Règles non négociables :

- **Aucun argent réel n'entre ni ne sort.** Pas d'achat intégré, pas de monnaie vendue, pas de lots, pas de conversion des gains. C'est ce qui tient le jeu hors du champ des jeux d'argent : en droit français, un jeu d'argent suppose quatre éléments réunis, une offre au public, du hasard, un sacrifice financier et une espérance de gain. Si une monétisation est envisagée un jour, consulter un juriste avant d'écrire une ligne de code. Ce brief n'est pas un avis juridique.
- **Le jeu se présente comme une simulation.** Mention « Jeu de fiction. Aucun argent réel. » sur l'écran de bienvenue, dans « À propos » et en microtexte sur le talon de chaque ticket.
- **Public adulte.** L'écran de bienvenue indique « Réservé aux adultes ». PEGI classe 18 ans les jeux qui simulent des jeux d'argent : à anticiper en cas de publication sur une boutique d'applications.
- **Tickets originaux.** Aucun nom, logo, visuel ni mise en page de tickets existants. Les noms de la section 6.4 ont été choisis pour ça ; les revérifier avant publication.
- **Transparence.** Chaque ticket affiche son tableau de lots et ses chances réelles, celles de la section 6.
- **« À propos ».** Un paragraphe « Dans la vraie vie » (annexe B) et le numéro de Joueurs Info Service, 09 74 75 13 13.
- **Vie privée.** Un pseudo et un identifiant aléatoire, rien d'autre. Aucun traceur, aucune statistique tierce.

## 4. Univers et direction artistique

### 4.1 Grattouille-les-Bains

Une station balnéaire Belle Époque peuplée d'animaux tirés à quatre épingles. Une seule rue, la Promenade, monte du port jusqu'à la corniche : plus on monte, plus c'est chic, et plus il est tard. Le joueur débarque au port le matin et finit sa course à minuit, tout en haut.

### 4.2 Les cinq lieux

| Lieu | Hôte | Moment | Décor | Fond, de haut en bas | Motif |
|---|---|---|---|---|---|
| Le Kiosque de Gaspard | Gaspard, vieux renard argenté, gilet et visière de buraliste | Matin | Port, mouettes, store rayé | `#BEE7F5` vers `#FDF3D0` | Rayures de store mimosa et blanc |
| Le Grand Café des Arcades | Ondine, loutre en tablier blanc | Après-midi | Terrasse, chaises cannées, citronnade | `#F6D9A8` vers `#E9A45C` | Cannage |
| Le Casino de la Jetée | Hector, héron croupier à visière verte | Coucher de soleil | Jetée, guirlandes d'ampoules | `#FFB38A`, `#C2639A`, `#4B3277` | Guirlande d'ampoules |
| Le Salon Privé | Le Baron, bouledogue en smoking | Soir | Velours, abat-jour, laiton | `#5A1730` vers `#2B0B1A` | Capitons en losange |
| Le Cercle des Moustaches | Sir Auguste, morse majordome | Minuit | Observatoire, étoiles, Art déco | `#0B1B33` vers `#050B18` | Éventails Art déco |

Texte sur ces fonds : `--nuit` sur le Kiosque et le Grand Café, `--ecume` sur le Salon Privé et le Cercle (contrastes vérifiés, tous supérieurs à 6,5). Le dégradé du Casino passe par un rose moyen où aucune des deux couleurs n'est lisible : y poser le texte sur un bandeau `--nuit`.

### 4.3 Les personnages

| Personnage | Espèce et tenue | Rôle | Caractère |
|---|---|---|---|
| Piou | Moineau groom, calot rouge | Guide du début, garde les tickets en attente | Enthousiaste, parle trop vite |
| Gaspard | Renard argenté, gilet, visière | Tient le Kiosque | Bonimenteur au grand cœur |
| Ondine | Loutre, tablier, plateau | Grand Café | Pince-sans-rire |
| Hector | Héron, nœud papillon | Casino | Impassible, lève un sourcil |
| Le Baron | Bouledogue, smoking | Salon Privé | Bourru, fond en larmes aux gros gains |
| Sir Auguste | Morse, queue-de-pie | Cercle des Moustaches | Solennel, la moustache frémit |
| Mlle Sidonie | Flamant rose, mètre ruban au cou | Maison Sidonie, la garde-robe | Exigeante, complimente rarement |
| Enzo | Guépard, blouson et gants de conduite | Chez Enzo, garage et port | Pressé, parle en onomatopées |
| Mme Colette | Chatte persane, tailleur et perles | Agence Colette, l'immobilier | Mondaine, tout est « ravissant » |
| Maître Archibald | Hibou, robe de commissaire-priseur | Galerie Archibald, les trésors | Érudit, adjuge tout au marteau |

### 4.4 Le joueur

Le joueur choisit une espèce parmi huit et peut en changer gratuitement : `renard`, `chat`, `ours`, `lapin`, `blaireau`, `grenouille`, `raton` (raton laveur), `herisson`.

### 4.5 Style d'illustration : papier découpé à la gouache

Tout est dessiné en SVG dans le code, sans image bitmap en V1.

- Aplats sans contour. Une ombre est une forme plus sombre décalée, jamais un flou. La lumière vient d'en haut à gauche.
- 40 formes et 6 couleurs au plus par illustration, métaux à part.
- Les métaux (laiton, or, argent) sont les seuls dégradés autorisés.
- Un grain de papier léger recouvre les grandes surfaces. Il est rendu une seule fois dans une texture réutilisée, jamais par un filtre SVG appliqué élément par élément.
- Visages : deux points pour les yeux, pas de bouche détaillée. L'expression passe par les sourcils et la posture.
- Matières par motif simple : chevrons pour le tweed, pois pour la soie, rayures pour la marinière, losanges pour le velours.

### 4.6 Gabarit de l'avatar

Les huit espèces partagent le même buste pour que les 24 articles de garde-robe tombent juste sans retouche.

- `viewBox="0 0 400 480"`.
- Repères communs : sommet du crâne à y = 80, ligne des yeux à y = 165 (yeux en x = 165 et x = 235), menton à y = 265, cou centré en (200, 285), épaules de x = 70 à x = 330 à partir de y = 320.
- Emplacements : `chapeau` posé sur le crâne (base à y = 95, largeur utile 170), `lunettes` centrées en (200, 165), `accessoire` au cou en (200, 290), `tenue` sur tout ce qui est sous y = 290.
- Ordre des calques, du fond vers l'avant : buste, `tenue`, oreilles, tête, `accessoire`, `lunettes`, `chapeau`.
- Une espèce ne fournit que ses couleurs (pelage, ventre, truffe), ses oreilles et son museau.

### 4.7 Illustrations remplaçables

`src/art/registry.ts` associe chaque identifiant (`item:beret`, `place:kiosque`, `pnj:gaspard`, `species:renard`, `ticket:lucarne`) à un composant SVG ou à l'URL d'une image. Remplacer plus tard un dessin par une illustration commandée revient à changer une ligne.

Prévoir une planche de contrôle, visible avec `?planche` dans l'adresse : toutes les illustrations sur une page, pour juger la cohérence d'un coup d'œil.

### 4.8 Ton

L'interface tutoie le joueur, en phrases courtes et sans majuscules décoratives. Les personnages, eux, changent de registre à mesure que le Standing monte. C'est du texte seul, et c'est une des récompenses les plus drôles du jeu.

| Standing | Registre | Gaspard tend un ticket |
|---|---|---|
| Moins de 60 | Familier | « Tiens, mon grand. Gratte-moi ça ! » |
| 60 à 249 | Poli | « Voici pour vous, {pseudo}. Bonne chance. » |
| 250 à 999 | Déférent | « Si {pseudo} veut bien se donner la peine de gratter… » |
| 1 000 et plus | Obséquieux | « Que Votre Excellence daigne effleurer ce modeste ticket. » |

D'autres répliques en annexe B.

## 5. Boucle de jeu et progression

### 5.1 La boucle

```
    gratter ───► gagner des euros ───► s'offrir de belles choses
       ▲                                         │
       │                                         ▼
 tickets plus chers ◄── lieux plus chics ◄── Standing ★
```

### 5.2 Trois compteurs

- **Le solde, en euros.** Ce que le joueur peut dépenser. Il démarre à 4 €.
- **Le Standing, en ★.** La somme des ★ de tous les biens possédés, portés ou non. Il ne baisse jamais. Il ouvre les lieux.
- **La fortune.** Solde, plus gains des tickets pas encore grattés, plus prix d'achat de tous les biens. C'est le score du classement. Acheter ne fait donc jamais baisser la fortune.

### 5.3 Les lieux

| Lieu | `id` | Standing requis | Tickets | Achats cumulés pour y arriver, du moins cher au plus cher |
|---|---|---|---|---|
| Le Kiosque de Gaspard | `kiosque` | ★ 0 | 1 €, 2 €, 5 € | Rien |
| Le Grand Café des Arcades | `cafe` | ★ 10 | 10 €, 20 €, 50 € | 40 €, soit les quatre premiers articles |
| Le Casino de la Jetée | `casino` | ★ 60 | 100 €, 500 €, 2 000 € | 2 835 € |
| Le Salon Privé | `salon` | ★ 250 | 10 000 €, 50 000 €, 250 000 € | 149 535 € |
| Le Cercle des Moustaches | `cercle` | ★ 1 000 | 1 M€, 5 M€, 25 M€ | 20,03 M€ |

Un lieu débloqué le reste pour toujours. Les lieux fermés sont visibles sur la Promenade, grisés, avec une plaque « ★ 60 ».

### 5.4 Le premier quart d'heure

1. Écran de bienvenue, choix de l'espèce et du pseudo.
2. Piou : « Vous voilà à Grattouille-les-Bains avec 4 € en poche. » Il emmène le joueur au Kiosque.
3. Le premier ticket acheté par un compte gagne toujours 5 fois son prix (règle serveur). Un doigt fantôme montre le geste sur la première case et disparaît dès que le joueur gratte.
4. Avec 8 € en poche, Piou suggère le nœud papillon à 5 €. Première ★ et une phrase d'explication : « Le Standing ouvre les portes. Encore 8 ★ pour le Grand Café. »
5. Jeu libre. Le Grand Café s'ouvre en général entre le 40ᵉ et le 70ᵉ ticket.
6. Après une dizaine de tickets, invitation non bloquante à noter son code de récupération (section 11).

### 5.5 Le coup de pouce de la maison

On ne redescend jamais d'un lieu et on ne reste jamais bloqué.

- **Condition.** Aucun ticket en attente, et un solde inférieur au prix du ticket le moins cher du meilleur lieu débloqué.
- **Effet.** Le comptoir de ce lieu propose « Ticket offert par la maison ». C'est un exemplaire du ticket le moins cher du lieu, marqué « Offert, toujours gagnant », qui rapporte 3 fois son prix : 3 €, 30 €, 300 €, 30 000 € ou 3 M€ selon le lieu.
- **Limite.** Un toutes les 20 secondes, sans autre plafond.

### 5.6 La fin

Quand la collection est complète (52 biens sur 52), Mme Colette met en vente **le Kiosque de Gaspard** pour 1 Md€. L'acheter lance le générique de fin : Gaspard remet les clés et appelle désormais le joueur « Patron ». Le joueur porte ensuite un liseré d'or au classement, et le jeu continue sans limite pour la course à la fortune.

### 5.7 Rythme attendu

Nombre médian de tickets grattés avant chaque étape, d'après la simulation de la section 6.7 (6 000 parties par style de jeu) :

| Style de jeu | Grand Café | Casino | Salon Privé | Cercle | Tout acheter, Kiosque compris |
|---|---|---|---|---|---|
| Prudent : mise d'au plus 5 % du solde | 108 | 228 | 440 | 732 | 1 023 |
| Standard : au plus 10 % | 66 | 166 | 321 | 543 | 753 |
| Joueur : au plus 20 % | 42 | 130 | 255 | 429 | 598 |
| Flambeur : au plus 50 % | 21 | 98 | 210 | 365 | 531 |
| Tapis : tout le solde | 15 | 79 | 186 | 339 | 507 |

Pour le style standard, 80 % des parties finissent entre 561 et 978 tickets. Une partie voit en moyenne 15 gains d'au moins 25 fois la mise et 3,7 gains d'au moins 100 fois ; deux parties sur trois touchent au moins un jackpot (500 fois la mise ou plus).

## 6. Économie

### 6.1 Règles monétaires

- Tous les montants sont des entiers en euros.
- Le solde ne peut pas être négatif.
- Le gain d'un ticket est décidé par le serveur au moment de l'achat. Il est versé au solde quand le ticket est déclaré gratté (section 15.4).
- Les achats en boutique sont définitifs. Pas de revente en V1.
- Une seule fonction d'affichage, `formatEuros(n)`, dans `shared/` :

| Montant | Affichage |
|---|---|
| Moins de 1 million | Séparateur de milliers : `9 500 €`, `250 000 €` |
| De 1 million à moins de 1 milliard | `1,25 M€`, deux décimales au plus, sans zéro inutile |
| 1 milliard et plus | `1,25 Md€`, puis `1 250 Md€` au-delà de 999 Md€ |

### 6.2 Trois tempéraments

Chaque ticket a un tempérament qui fixe son tableau de lots, exprimé en multiples de son prix. Chaque lieu propose un ticket de chaque tempérament, du moins cher au plus cher.

| | Pépère | Joueur | Casse-cou |
|---|---|---|---|
| Tickets gagnants | 61,5 % (1 sur 1,6) | 52,1 % (1 sur 1,9) | 37,4 % (1 sur 2,7) |
| Retour moyen par euro misé | 2,59 € | 3,15 € | 4,89 € |
| Gros gain (≥ ×50) | 1 sur 108 | 1 sur 79 | 1 sur 69 |
| Jackpot (≥ ×500) | 1 sur 6 667 | 1 sur 2 500 | 1 sur 345 |
| Gain maximal | ×500 | ×1 000 | ×5 000 |

### 6.3 Tableaux de lots

Source de vérité, à recopier telle quelle :

```ts
// shared/economy.ts — [multiplicateur du prix du ticket, poids sur 100 000]
export const WEIGHT_TOTAL = 100_000; // le reste des poids = ticket perdant
export const TEMPERAMENTS = {
  pepere: [[1, 22000], [2, 18000], [3, 9000], [5, 6500], [10, 3500], [20, 1600], [50, 600], [100, 250], [200, 60], [500, 15]],
  joueur: [[1, 17000], [2, 14000], [3, 8000], [5, 6000], [10, 4000], [20, 1800], [50, 800], [100, 300], [250, 120], [1000, 40]],
  "casse-cou": [[1, 9000], [2, 10000], [5, 9000], [10, 6000], [25, 2000], [50, 800], [100, 350], [500, 200], [1000, 80], [5000, 10]],
} as const;
```

Les mêmes tableaux, lisibles :

**Pépère**

| Gain | Poids | Chance |
|---|---|---|
| Perdu | 38475 | 1 sur 2,6 |
| ×1 | 22000 | 1 sur 4,5 |
| ×2 | 18000 | 1 sur 5,6 |
| ×3 | 9000 | 1 sur 11 |
| ×5 | 6500 | 1 sur 15 |
| ×10 | 3500 | 1 sur 29 |
| ×20 | 1600 | 1 sur 62 |
| ×50 | 600 | 1 sur 167 |
| ×100 | 250 | 1 sur 400 |
| ×200 | 60 | 1 sur 1 667 |
| ×500 | 15 | 1 sur 6 667 |

**Joueur**

| Gain | Poids | Chance |
|---|---|---|
| Perdu | 47940 | 1 sur 2,1 |
| ×1 | 17000 | 1 sur 5,9 |
| ×2 | 14000 | 1 sur 7,1 |
| ×3 | 8000 | 1 sur 12 |
| ×5 | 6000 | 1 sur 17 |
| ×10 | 4000 | 1 sur 25 |
| ×20 | 1800 | 1 sur 56 |
| ×50 | 800 | 1 sur 125 |
| ×100 | 300 | 1 sur 333 |
| ×250 | 120 | 1 sur 833 |
| ×1000 | 40 | 1 sur 2 500 |

**Casse-cou**

| Gain | Poids | Chance |
|---|---|---|
| Perdu | 62560 | 1 sur 1,6 |
| ×1 | 9000 | 1 sur 11 |
| ×2 | 10000 | 1 sur 10 |
| ×5 | 9000 | 1 sur 11 |
| ×10 | 6000 | 1 sur 17 |
| ×25 | 2000 | 1 sur 50 |
| ×50 | 800 | 1 sur 125 |
| ×100 | 350 | 1 sur 286 |
| ×500 | 200 | 1 sur 500 |
| ×1000 | 80 | 1 sur 1 250 |
| ×5000 | 10 | 1 sur 10 000 |

Dans le jeu, la fiche de chaque ticket affiche ce tableau converti en euros.

### 6.4 Les quinze tickets

| # | Ticket | Lieu | Prix | Moteur | Tempérament | Gain maximal |
|---|---|---|---|---|---|---|
| 1 | La Tirelire de Piou (`tirelire`) | Le Kiosque de Gaspard | 1 € | `trio` | Pépère | 500 € |
| 2 | Signe du Homard (`signe-du-homard`) | Le Kiosque de Gaspard | 2 € | `etoile` | Joueur | 2 000 € |
| 3 | Tic-Tac-Truffe (`tic-tac-truffe`) | Le Kiosque de Gaspard | 5 € | `morpion` | Casse-cou | 25 000 € |
| 4 | Lucarne (`lucarne`) | Le Grand Café des Arcades | 10 € | `duel` | Pépère | 5 000 € |
| 5 | Réussite (`reussite`) | Le Grand Café des Arcades | 20 € | `lignes` | Joueur | 20 000 € |
| 6 | Bas de Laine (`bas-de-laine`) | Le Grand Café des Arcades | 50 € | `numeros` | Casse-cou | 250 000 € |
| 7 | Le 21 d'Hector (`vingt-et-un`) | Le Casino de la Jetée | 100 € | `duel` | Pépère | 50 000 € |
| 8 | Bandit Manchot (`bandit-manchot`) | Le Casino de la Jetée | 500 € | `trio` | Joueur | 500 000 € |
| 9 | Mille-Pattes (`mille-pattes`) | Le Casino de la Jetée | 2 000 € | `numeros` | Casse-cou | 10 M€ |
| 10 | La Pie Voleuse (`pie-voleuse`) | Le Salon Privé | 10 000 € | `trio` | Pépère | 5 M€ |
| 11 | Caviar & Champagne (`caviar-champagne`) | Le Salon Privé | 50 000 € | `etoile` | Joueur | 50 M€ |
| 12 | Grand Prix de la Corniche (`grand-prix`) | Le Salon Privé | 250 000 € | `duel` | Casse-cou | 1,25 Md€ |
| 13 | La Régate (`regate`) | Le Cercle des Moustaches | 1 M€ | `lignes` | Pépère | 500 M€ |
| 14 | Moustache d'Or (`moustache-dor`) | Le Cercle des Moustaches | 5 M€ | `morpion` | Joueur | 5 Md€ |
| 15 | Le Grand Grattouille (`grand-grattouille`) | Le Cercle des Moustaches | 25 M€ | `multi` | Casse-cou | 125 Md€ |

Les moteurs sont décrits en section 7.

### 6.5 Tirage

Le tirage se fait uniquement sur le serveur.

1. Tirer un entier uniforme `r` dans [0, 100 000[ avec `crypto.getRandomValues`, par rejet pour éviter tout biais de modulo.
2. Parcourir le tableau du tempérament en cumulant les poids. Le premier lot dont le cumul dépasse `r` est gagné. Si aucun ne le dépasse, le ticket est perdant.
3. `gain = multiplicateur × prix`.

Deux exceptions : le premier ticket d'un compte gagne ×5 (section 5.4), et le ticket offert par la maison gagne ×3 (section 5.5).

### 6.6 Carnets et tickets en attente

- Un ticket s'achète à l'unité, par carnet de 5 ou par carnet de 10, sans remise.
- Un ticket acheté et pas encore gratté est « en attente ». Il survit à la fermeture de l'application et se retrouve dans la pile « À gratter ».
- 20 tickets en attente au plus. Au-delà, l'achat est refusé : « Gratte d'abord tes tickets en attente. »

### 6.7 Simulation et garde-fous d'équilibrage

Écrire `scripts/simulate.ts`, qui importe `shared/` et rejoue des parties complètes.

- **Modèle de joueur.** Deux paramètres : part maximale du solde misée sur un ticket, et part maximale du solde dépensée pour un bien. À chaque tour : acheter le bien le moins cher non possédé tant que son prix tient dans la part d'achats ; demander le ticket de la maison si la condition de 5.5 est remplie ; sinon acheter le ticket débloqué le plus cher qui tient dans la part de mise, ou à défaut le moins cher que le solde permet.
- **Styles.** Prudent 5 % et 20 %, standard 10 % et 30 %, joueur 20 % et 40 %, flambeur 50 % et 60 %, tapis 100 % et 60 %.
- **Sortie.** Le tableau de la section 5.7, sur au moins 5 000 parties par style.
- **Tolérance.** Les médianes doivent retomber à 15 % près sur celles de 5.7. Sinon, il y a un écart entre `shared/` et ce brief.
- **Tests unitaires associés.** La somme des poids de chaque tempérament est inférieure à 100 000. Les retours moyens calculés exactement valent 2,59, 3,15 et 4,89. Les proportions de tickets gagnants valent 61,525 %, 52,06 % et 37,44 %.

Toute retouche d'un prix, d'un poids ou d'un seuil passe par ce script avant d'être validée.

## 7. Les tickets

### 7.1 Modèle commun

Le serveur ne connaît d'un ticket que son type, son gain et une graine. La grille, c'est-à-dire ce qu'il y a sous l'encre, est fabriquée sur l'appareil du joueur, de façon déterministe, à partir de ces trois valeurs. L'argent ne dépend donc jamais de ce que le client affiche.

```ts
// shared/types.ts
export interface PendingTicket {
  id: string;     // "t_" + 12 caractères aléatoires
  type: string;   // id du ticket, par exemple "lucarne"
  gain: number;   // euros, 0 si perdant
  seed: number;   // entier 32 bits non signé
  house?: true;   // offert par la maison
  at: number;     // date d'achat en millisecondes
}
```

Chaque moteur expose deux fonctions pures :

```ts
buildLayout(def: TicketDef, gain: number, seed: number, pick?: string): Layout
evaluate(layout: Layout, pick?: string): number // ce que la grille paie, lue comme la lirait un joueur
```

**Invariant testé :** `evaluate(buildLayout(def, gain, seed)) === gain` pour chaque ticket, chaque gain possible (0 compris) et 500 graines. Pour le moteur `etoile`, le même `pick` est passé aux deux fonctions, et le test couvre chaque signe.

Outils communs, dans `src/engines/common.ts` :

- `mulberry32(seed)` : générateur pseudo-aléatoire déterministe.
- `palette(def)` : les montants possibles du ticket, soit chaque multiplicateur du tempérament multiplié par le prix.
- `splitGain(gain, palette, maxParts, rng)` : découpe un gain en 1 à `maxParts` montants de la palette. Lister les découpages possibles en 1, 2 et 3 montants, sans tenir compte de l'ordre. Choisir d'abord le nombre de montants parmi ceux qui existent, avec les poids 5, 3 et 2, puis un découpage au hasard. Un seul montant est toujours possible. `gain = 0` rend une liste vide.
- `decoy(palette, rng)` : montant leurre pour une case non gagnante. Le i-ème montant de la palette, par ordre croissant en partant de 0, a le poids 0,65 puissance i. La loi est la même que le ticket soit gagnant ou perdant : on ne fabrique pas de « presque gagné ». Si un leurre enfreint une contrainte du moteur, on en tire un autre.

### 7.2 Anatomie d'un ticket

- **Format.** Portrait, rapport 5:8. Largeur : le plus petit de (largeur d'écran − 32 px) et 420 px. Hauteur plafonnée à (hauteur d'écran − 230 px), en réduisant l'échelle si besoin. Aucune case à gratter ne fait moins de 44 px de côté.
- **De haut en bas.** Bandeau avec le nom du ticket en Abril Fatface et la pastille de prix en haut à droite. Promesse : « Jusqu'à 25 000 € ». Zone de jeu. Règle en une phrase. Talon détachable : perforation en pointillés, numéro de série `GR-0000-0000` dérivé de la graine, microtexte « Jeu de fiction, aucun gain réel ».
- **Papier.** Ivoire teinté de la couleur du ticket, guilloché SVG à 8 % d'opacité, coins arrondis de 14 px.
- **Encre à gratter.** Elle recouvre chaque case. Sa teinte dépend du ticket (section 7.10). Son comportement est décrit en section 8.

Le microtexte et le numéro de série en petites capitales espacées n'existent que sur le ticket, parce que c'est ainsi qu'un vrai ticket est imprimé. Le reste de l'interface n'utilise pas ce style.

### 7.3 Moteur `trio` : trois identiques

- **Règle affichée.** « Trouve 3 montants identiques : tu gagnes ce montant. »
- **Grille.** 9 cases en 3 × 3, chacune cache un montant de la palette.
- **Gagnant.** Le gain apparaît exactement 3 fois. Aucun autre montant n'apparaît plus de 2 fois.
- **Perdant.** Aucun montant n'apparaît plus de 2 fois.
- **`evaluate`.** Le montant présent au moins 3 fois, sinon 0.
- **Mode `symboles`.** Chaque montant de la palette est lié à un symbole fixe. La case montre le symbole et son montant dessous. Règle : « 3 symboles identiques : tu gagnes leur montant. »
- **Moment fort.** À la troisième case identique, les trois se soulèvent et un trait mimosa les relie.

### 7.4 Moteur `numeros` : numéros gagnants

- **Règle affichée.** « Chaque fois qu'un de tes numéros est aussi un numéro gagnant, tu gagnes le montant inscrit dessous. »
- **Grille.** `winning` : K numéros gagnants distincts entre 1 et 49. `yours` : N cases, chacune avec un numéro distinct et un montant.
- **Construction.** `parts = splitGain(gain, palette, 3)`. Autant de cases que de parts reçoivent un numéro gagnant (tous différents) et le montant de la part. Les autres reçoivent un numéro non gagnant et un leurre.
- **`evaluate`.** Somme des montants des cases dont le numéro figure dans `winning`.
- **Moment fort.** Une case gagnante se cercle de mimosa et tinte dès que son numéro et le numéro gagnant correspondant sont tous deux visibles, quel que soit l'ordre de grattage.

### 7.5 Moteur `morpion` : trois alignés

- **Règle affichée.** « Aligne 3 truffes en ligne, en colonne ou en diagonale : tu gagnes le lot. » Le nom du symbole change selon le ticket.
- **Grille.** 9 cases en 3 × 3 qui cachent le symbole cible ou l'autre symbole, plus une case « lot » qui cache un montant.
- **Gagnant.** Exactement une des 8 lignes possibles est faite de 3 symboles cibles. Le lot vaut le gain.
- **Perdant.** Aucune ligne complète. Le lot est un leurre.
- **Dans les deux cas.** Entre 3 et 5 symboles cibles sur la grille.
- **`evaluate`.** Le lot si une ligne est complète, sinon 0.
- **Moment fort.** Un trait barre la ligne gagnante, comme au crayon.

### 7.6 Moteur `duel` : battre l'adversaire

- **Règle affichée.** « À chaque manche gagnée, tu remportes son montant. Égalité : pas de gain. »
- **Grille.** R manches, chacune avec ta valeur, celle de l'adversaire et un montant. Deux cases à gratter par manche : la rencontre et le montant.
- **Construction.** `parts = splitGain(gain, palette, 3)`. Autant de manches gagnées que de parts. Les autres sont perdues ou à égalité, avec un leurre.
- **`evaluate`.** Somme des montants des manches gagnées.
- **Trois habillages.**
  - `foot` : scores de 0 à 5, le plus grand gagne.
  - `cartes` : ta main vaut de 12 à 21. Celle du croupier vaut de 17 à 21, ou « saute » au-delà de 21. Tu gagnes si ta main est strictement plus forte ou si le croupier saute.
  - `course` : chronos entre 1:10.00 et 1:39.99, le plus petit gagne.

### 7.7 Moteur `etoile` : ton signe

- **Avant de gratter.** Le joueur choisit son signe dans une roue. Le choix est mémorisé sur l'appareil et proposé par défaut la fois suivante.
- **Règle affichée.** « Chaque fois que ton signe apparaît, tu gagnes le montant inscrit dessous. » La fiche du ticket précise : « Ton signe ne change pas tes chances. Il change la tête du ticket. »
- **Grille.** C cases, chacune avec un signe et un montant. Elle est construite après le choix, que l'on passe en `pick`.
- **Construction.** `parts = splitGain(gain, palette, 3)`. Autant de cases que de parts montrent le signe choisi avec le montant de la part. Les autres montrent un autre signe et un leurre.
- **`evaluate`.** Somme des montants des cases qui montrent le signe choisi.

### 7.8 Moteur `lignes` : tirage et rangées à compléter

- **Règle affichée.** « Gratte le tirage. Une rangée dont les 3 éléments sont sortis rapporte son montant. »
- **Grille.** `draw` : 8 éléments à gratter. `lines` : 4 rangées de 3 éléments, visibles dès le départ avec leur montant. Les 12 éléments des rangées sont tous différents.
- **Construction.** `parts = splitGain(gain, palette, 2)`. Autant de rangées gagnantes que de parts : leurs 3 éléments sont dans le tirage. Les places restantes du tirage sont réparties au hasard : au plus 2 éléments par rangée non gagnante, le reste avec des éléments qui ne sont sur aucune rangée. Les rangées non gagnantes portent un leurre. Pour l'affichage, trier les rangées par montant croissant.
- **`evaluate`.** Somme des montants des rangées dont les 3 éléments sont dans le tirage.
- **Moment fort.** Chaque élément tiré qui figure sur une rangée y est tamponné (180 ms). Rangée complète : son montant s'illumine.
- **Deux habillages.** `cartes` : jeu de 32 cartes, du 7 à l'as, figures animales. `nombres` : nombres de 1 à 40.

### 7.9 Moteur `multi` : trois jeux en un

- Trois volets sur un même ticket : un `trio`, un `numeros` (2 gagnants, 6 numéros) et un `duel` (3 manches, habillage `cartes`).
- Un seul volet est visible à la fois. Le ticket passe seul au volet suivant quand le volet courant est entièrement gratté. Trois pastilles permettent de revenir en arrière.
- **Construction.** `parts = splitGain(gain, palette, 3)`. Chaque part est attribuée à un volet différent, tiré au hasard. Les volets sans part sont perdants. Chaque volet construit sa grille avec un seul lot, à partir de la graine `seed + numéro du volet`.
- **`evaluate`.** Somme des trois volets.

### 7.10 Habillage et options des quinze tickets

| Ticket | Options du moteur | Décor et symboles | Encre |
|---|---|---|---|
| La Tirelire de Piou | `trio`, mode montants | Papier ivoire, encre azur, cochon-tirelire en faïence, 9 cases rondes comme des pièces | Argent |
| Signe du Homard | `etoile`, 6 cases, 12 constellations : homard, chouette, tortue, paon, hippocampe, cerf, baleine, papillon, lièvre, cygne, abeille, escargot | Ciel de nuit étoilé, cases en forme d'étoile | Nacre lilas |
| Tic-Tac-Truffe | `morpion`, cible truffe, autre symbole gland | Papier kraft, feuilles de chêne, cochon truffier en veston | Cuivre |
| Lucarne | `duel`, 4 manches, habillage `foot`. Adversaires : les Goélands, les Sardines, les Bigorneaux, les Mouettes | Pelouse rayée, fanions, cage de but | Blanc craie |
| Réussite | `lignes`, habillage `cartes` | Tapis vert amande, cartes dont le valet est un lièvre, la dame une chatte, le roi un ours | Argent |
| Bas de Laine | `numeros`, 3 gagnants, 8 numéros en 2 × 4 | Tricot rouge et crème, chaussette pleine de pièces | Or |
| Le 21 d'Hector | `duel`, 4 manches, habillage `cartes` | Feutre vert, Hector distribue | Argent |
| Bandit Manchot | `trio`, mode symboles : cloche, cerise, citron, trèfle, fer à cheval, étoile, sept, diamant, couronne, manchot | Rouge cerise et chrome, un manchot masqué tient le levier | Chrome |
| Mille-Pattes | `numeros`, 4 gagnants, 15 numéros en 3 × 5 | Vert feuille, un mille-pattes dont chaque segment porte un numéro et un soulier verni | Or |
| La Pie Voleuse | `trio`, mode symboles : bouton de nacre, perle, améthyste, topaze, aigue-marine, saphir, émeraude, rubis, diamant, étoile de diamants | Noir et blanc, éclats de couleur, une pie en collier de perles | Nacre irisée |
| Caviar & Champagne | `etoile`, 6 cases, 6 mets : caviar, champagne, homard, truffe, macaron, huître | Noir et or, bulles, 6 cloches d'argent à soulever | Or champagne |
| Grand Prix de la Corniche | `duel`, 4 manches, habillage `course` | Bleu course, damier, route en lacets au-dessus de la mer | Argent |
| La Régate | `lignes`, habillage `nombres` : 4 voiliers, 3 bouées chacun, tirage de 8 bouées | Bleu marine et blanc, pavillons | Blanc nacré |
| Moustache d'Or | `morpion`, cible moustache, autre symbole monocle | Velours bordeaux, dorures | Or |
| Le Grand Grattouille | `multi` | Noir profond, feuille d'or, format 9:16 | Or |

Dans les modes `symboles`, les symboles sont donnés du plus petit montant au plus grand.

## 8. Le grattage

### 8.1 Sensation recherchée

On doit avoir envie de gratter même un ticket perdant. Le geste doit rappeler une pièce sur du papier : ça accroche un peu, ça fait du bruit, ça laisse des copeaux, et la case se libère d'un coup quand on a assez gratté.

### 8.2 Moteur

- **Trois calques par ticket.** Le ticket en DOM et SVG, avec le contenu des cases. Un `canvas` d'encre par-dessus. Un `canvas` d'effets tout en haut, pour les copeaux et les pièces.
- **Encre.** Pour chaque case, un dégradé métallique, un grain et un motif répété de petits « G » à 6 % d'opacité. Elle est peinte une fois à l'ouverture du ticket.
- **Résolution.** `devicePixelRatio` plafonné à 2.
- **Entrée.** Pointer Events sur le canvas d'encre, avec `touch-action: none` et `setPointerCapture`. Lire `getCoalescedEvents()` quand il existe. Un seul pointeur actif.
- **Tracé.** `globalCompositeOperation = "destination-out"`. Entre deux positions du doigt, tamponner la brosse tous les (rayon ÷ 3) pixels pour ne laisser aucun trou. La brosse est un disque à bord irrégulier, pré-rendu en 3 variantes tournées au hasard. Rayon : 6,5 % de la largeur du ticket, soit environ 24 px.
- **Couverture.** Chaque case a une grille logique de cellules de 8 px. Une cellule est grattée quand le centre de la brosse passe à moins d'un rayon. Couverture = cellules grattées ÷ cellules de la case. Pas de `getImageData` pendant le geste.
- **Copeaux.** À chaque tampon sur une case encore couverte, 1 ou 2 particules de la couleur de l'encre : rectangles de 2 à 5 px, vitesse opposée au mouvement, gravité, durée de 400 à 700 ms. 80 particules au plus, prises dans une réserve réutilisée.
- **Son et vibrations.** Section 14.
- **React.** Aucune mise à jour d'état pendant le geste. Tout passe par des refs. React n'est prévenu qu'à la révélation d'une case.

### 8.3 Révélation

- Une case est révélée quand sa couverture atteint 55 %. Le reste de son encre se dissout en 220 ms à partir du dernier point touché, avec un « toc » et une vibration de 10 ms. Le contenu rebondit : échelle 1, puis 1,12, puis 1.
- Les correspondances (trois identiques, numéro gagnant, rangée complète) se signalent dès que les cases concernées sont visibles.
- Quand toutes les cases sont révélées, le résultat se joue (section 8.5).
- Quitter l'écran en cours de grattage ne perd rien : le ticket retourne dans « À gratter », et sa grille sera reconstruite à l'identique.

### 8.4 Tout gratter et rafale

- **« Tout gratter ».** Bouton toujours visible sous le ticket. Une pièce balaie chaque case restante en zigzag, avec 80 ms de décalage entre deux cases et 900 ms au total, son et copeaux compris. C'est aussi l'alternative d'accessibilité au geste.
- **Rafale.** Dans un carnet, à partir du deuxième ticket, l'écran propose « Gratter en rafale ». Chaque ticket est alors gratté tout seul en 1,2 s environ et son gain s'ajoute à un total courant. Un toucher met en pause. Un gain de palier « gros » ou supérieur arrête la rafale pour laisser la fête se jouer. Un récapitulatif clôt le carnet : « Carnet de 10 : 6 gagnants, 235 € ».

### 8.5 Paliers de résultat

Le palier dépend du rapport m = gain ÷ prix du ticket.

| Palier | Condition | Ce qui se passe | Durée |
|---|---|---|---|
| Perdu | gain = 0 | Le ticket pâlit, « Rien cette fois. », note sourde et brève, pas de vibration | 0,4 s |
| Remboursé | m = 1 | « Remboursé. » Les pièces retournent à la bourse | 0,6 s |
| Petit | 1 < m < 5 | Quelques pièces sautent vers la bourse, le solde compte | 0,8 s |
| Joli | 5 ≤ m < 25 | Gerbe de pièces, bandeau « Joli coup », le solde compte | 1,2 s |
| Gros | 25 ≤ m < 100 | Rayons mimosa derrière le ticket, l'hôte du lieu applaudit | 1,8 s |
| Énorme | 100 ≤ m < 500 | Plein écran : pluie de pièces, confettis, l'hôte ôte son chapeau | 2,5 s |
| Jackpot | m ≥ 500 | Séquence complète : éclair, écran d'or, montant qui grossit, longue vibration. Un toucher la passe après 1 s | 3,5 s |

- Le ticket offert par la maison joue le palier « petit » avec la mention « Offert par la maison ».
- Le montant gagné s'affiche en Abril Fatface. Le solde, dans la bourse, compte jusqu'à sa nouvelle valeur pendant la durée indiquée.
- La fête du jackpot est le seul moment vraiment spectaculaire du jeu. Les autres paliers sont sobres pour qu'elle porte.

### 8.6 Après le résultat

- Un ticket perdant se froisse en boule et saute hors de l'écran en 400 ms. Un ticket gagnant reçoit le tampon « Payé » et glisse dans la bourse.
- Bouton principal : « Racheter le même 5 € » si le solde le permet, sinon « Retour au comptoir ». Bouton secondaire : « Changer de ticket ».
- Dans un carnet : « Ticket suivant » et le compteur « 3 sur 10 ».
- Racheter garde le joueur sur l'écran de grattage. Le nouveau ticket sort du distributeur à la place de l'ancien.

### 8.7 Budget de performance

- 60 images par seconde pendant le grattage sur un téléphone Android de milieu de gamme de 2021.
- Moins de 8 ms de script par image pendant le geste.
- Aucun appel réseau pendant le grattage.
- Les canvas sont libérés en quittant l'écran.

## 9. Boutiques, avatar et domaine

### 9.1 Quatre boutiques

| Boutique | Tenue par | Contenu | Où ça se voit |
|---|---|---|---|
| Maison Sidonie | Mlle Sidonie | 24 articles : chapeaux, lunettes, tenues, accessoires | Sur l'avatar |
| Chez Enzo | Enzo | 10 véhicules, du vélo au jet | Garé dans le domaine |
| Agence Colette | Mme Colette | 10 résidences, puis le Kiosque | Décor du domaine |
| Galerie Archibald | Maître Archibald | 8 trésors | Exposés dans le domaine, 3 à l'écran au plus |

Catalogue complet, prix et ★ en annexe A.

### 9.2 Étiquettes, fiche et achat

- **Dans la liste**, chaque article est une étiquette de boutique : carton ivoire, œillet et ficelle, illustration, nom, prix, « +8 ★ ».
- **Quatre états.** « À ta portée » : prix en `--persienne-fonce`. « Encore 1 200 € » : la somme manquante en `--cerise`. « À toi » : tampon. « Porté » : pour la garde-robe.
- **Tri.** Prix croissant. Les articles possédés passent en fin de liste.
- **Fiche.** Une feuille monte du bas : aperçu en grand (sur l'avatar pour la garde-robe, dans le décor pour le reste), une phrase du vendeur, le prix, les ★, et le bouton « Acheter 60 000 € ».
- **Achat.** Un appui suffit. Si le prix dépasse la moitié du solde, le bouton devient « Maintenir pour acheter » et se remplit en 600 ms.
- **Après l'achat.** Tampon « Vendu », bruit de caisse, les ★ s'envolent vers le compteur. La fiche propose aussitôt « Porter maintenant », « S'y installer » ou « Prendre le volant ».

### 9.3 Dressing

On y entre en touchant son avatar. Quatre onglets, un par emplacement (`chapeau`, `lunettes`, `tenue`, `accessoire`), avec les articles possédés et l'option « Rien ». On y change aussi d'espèce, gratuitement.

### 9.4 Le domaine

L'écran d'accueil montre ce que le joueur est devenu.

- Du fond vers l'avant : ciel du meilleur lieu débloqué, résidence choisie, véhicule choisi à gauche, avatar au centre, trésors sur une console à droite (les 3 plus chers).
- Sans résidence : le banc du port, avec une valise. Sans véhicule : à pied.
- Toucher la résidence ou le véhicule permet d'en choisir un autre parmi ceux qu'on possède.
- Une seule animation d'ambiance par décor, lente : la mer qui scintille, un fanion qui bouge, une lampe qui vacille.

### 9.5 Ouverture d'un lieu

Quand un achat fait franchir un seuil de Standing, l'écran s'assombrit et le lieu se présente : sa façade, son hôte, la phrase « Le Casino de la Jetée vous ouvre ses portes. » et le bouton « Y aller ». C'est la récompense principale de la progression : elle a droit à son plein écran.

### 9.6 Le Kiosque de Gaspard

- En vente à l'Agence Colette quand les 52 biens sont possédés.
- Prix : 1 Md€. Standing : +914 ★, ce qui porte le maximum à 5 000 ★.
- Compte dans la fortune comme n'importe quel bien.
- Déclenche le générique de fin (section 5.6).

## 10. Classement

- **Score.** La fortune (section 5.2). Les 100 premiers sont affichés.
- **Écran.** Podium des trois premiers avec de grands avatars, puis une plaque par joueur : rang, mini-avatar (tête, chapeau, lunettes), pseudo, fortune, Standing. Les propriétaires du Kiosque portent un liseré d'or.
- **Ma ligne.** Toujours visible : épinglée en bas quand elle est hors de l'écran. Au-delà du 200ᵉ : « Tu n'es pas encore classé. Il te manque 12 400 € pour entrer dans les 200 premiers. »
- **Données.** Un seul document, `top`, qui contient au plus 200 entrées triées :

```ts
interface BoardEntry {
  id: string; pseudo: string; species: string;
  look: { chapeau: string | null; lunettes: string | null; tenue: string | null; accessoire: string | null };
  fortune: number; standing: number; kiosk: boolean;
  at: number; // date de la dernière publication
}
```

- **Publication.** Après chaque écriture d'un joueur dont la fortune a changé, si sa dernière publication date de plus de 30 secondes : lire `top`, remplacer ou insérer l'entrée, trier par fortune décroissante (à égalité, la publication la plus ancienne d'abord), garder 200 entrées, écrire avec `onlyIfMatch`. En cas de conflit, recommencer, 3 essais au plus. Un échec n'est jamais une erreur pour le joueur : la publication suivante rattrape.
- **Lecture.** `GET /api/leaderboard` est public et renvoie la même réponse à tout le monde, mise en cache 30 secondes. Le client retrouve sa propre ligne grâce à son `id`.
- **Rafraîchissement.** À l'ouverture de l'onglet et au geste « tirer pour rafraîchir », au plus une fois toutes les 20 secondes.
- **État vide.** « Personne encore. La première place est à prendre. »
- **Modération.** Les pseudos sont filtrés à la création (section 11). Une route d'administration protégée par une clé retire un joueur du classement.

## 11. Compte et sauvegarde

Pas d'adresse e-mail, pas de mot de passe.

- **Création.** Un pseudo et une espèce. Le serveur crée un identifiant (`p_` suivi de 16 caractères aléatoires) et un code de récupération de 16 caractères, affiché sous la forme `XXXX-XXXX-XXXX-XXXX`, tirés dans l'alphabet `ABCDEFGHJKMNPQRSTVWXYZ23456789` (sans caractères ambigus). Le serveur ne conserve que l'empreinte SHA-256 du code.
- **Sur l'appareil.** L'identifiant et le code sont gardés dans `localStorage` et envoyés à chaque requête : `Authorization: Bearer {playerId}.{code}`.
- **Pseudo.** 3 à 16 caractères : lettres accentuées ou non, chiffres, espace, tiret. Unique sans tenir compte de la casse ni des accents. Une liste de mots refusés couvre les grossièretés courantes, « admin » et les noms des personnages.
- **Changer d'appareil.** Écran de bienvenue, « J'ai déjà un compte », pseudo et code.
- **Retrouver son code.** Réglages, « Mon code de récupération » : l'afficher, le copier. Texte : « Ce code est la seule clé de ta fortune. Note-le quelque part. »
- **Supprimer son compte.** Réglages, « Supprimer mon compte », saisir son pseudo pour confirmer. Le serveur efface le joueur, libère le pseudo et le retire du classement. L'appareil vide son stockage.
- **Stockage local.** `grattouille.auth`, `grattouille.settings` (son, vibrations, animations réduites, signe préféré) et `grattouille.revealed` (tickets grattés pas encore déclarés au serveur). Rien d'autre.
- **Sans code noté**, un stockage vidé fait perdre le compte. L'invitation à noter le code le dit sans détour.

## 12. Écrans et navigation

### 12.1 Navigation

- Quatre onglets en bas : Domaine, Jouer, Boutiques, Classement. « Jouer » est mis en avant par une pastille mimosa.
- Les réglages s'ouvrent depuis la roue dentée du Domaine.
- L'écran de grattage est en plein écran, sans onglets.
- Une seule page, sans routes d'URL. Le bouton retour du téléphone ramène à l'écran précédent (un état d'historique par écran).
- Toute action principale se trouve dans la moitié basse de l'écran, à portée de pouce.

### 12.2 Liste des écrans

| Écran | Contenu | Actions |
|---|---|---|
| Bienvenue | Logo, « Jeu de fiction. Aucun argent réel. Réservé aux adultes. » | Commencer, J'ai déjà un compte |
| Création | Choix de l'espèce, saisie du pseudo | Entrer à Grattouille-les-Bains |
| Domaine | Section 9.4, solde, Standing, fortune, carte d'objectif, tickets en attente | Dressing, réglages, changer de résidence ou de véhicule |
| Dressing | Avatar en grand, quatre onglets d'emplacements | Porter, retirer, changer d'espèce |
| Promenade | Les cinq lieux empilés, le Kiosque en bas, ouverte sur le meilleur lieu débloqué | Entrer dans un lieu |
| Comptoir | L'hôte, les trois tickets en carrousel, tempérament, prix | Acheter, carnet de 5, carnet de 10, règles et lots, ticket de la maison |
| Fiche d'un ticket | Règle, tableau des lots en euros avec les chances, tempérament | Acheter |
| Grattage | Section 8 | Gratter, tout gratter, racheter, suivant |
| À gratter | Pile des tickets en attente, gardée par Piou | Gratter le suivant, tout gratter en rafale |
| Boutiques | Les quatre vitrines et « Ma collection : 37 sur 52 » | Entrer dans une boutique |
| Boutique | Étiquettes par catégorie, fiche d'un article | Acheter, porter |
| Classement | Section 10 | Rafraîchir |
| Réglages | Son, vibrations, animations réduites, code de récupération, suppression du compte, à propos | |
| Ouverture d'un lieu | Section 9.5 | Y aller |
| Générique de fin | Section 5.6 | Continuer à jouer |

### 12.3 Maquettes fil de fer

Dans ces schémas, `*34` représente le compteur de Standing, `[ 1 250 € ]` la bourse, et `Top` l'onglet Classement.

Domaine :

```
┌──────────────────────────────────┐
│ (réglages)     [ 1 250 € ] [*34] │
│                                  │
│          ciel du moment          │
│        ┌────────────────┐        │
│        │   résidence    │        │
│        └────────────────┘        │
│  véhicule     AVATAR    trésors  │
│                                  │
│  Marcel                          │
│  Fortune : 4 870 €               │
│ ┌──────────────────────────────┐ │
│ │ Prochain lieu : le Casino    │ │
│ │ *34 sur 60  ▓▓▓▓▓▓▓░░░░░░    │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 3 tickets à gratter        > │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Domaine  (JOUER)  Boutiques  Top │
└──────────────────────────────────┘
```

Promenade :

```
┌──────────────────────────────────┐
│ La Promenade         [ 1 250 € ] │
│ ┌──────────────────────────────┐ │
│ │ Le Cercle des Moustaches     │ │
│ │ fermé : *1000                │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Le Salon Privé               │ │
│ │ fermé : *250                 │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Le Casino de la Jetée        │ │
│ │ fermé : encore 26 étoiles    │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Le Grand Café des Arcades    │ │
│ │ ouvert, tickets de 10 à 50 € │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Le Kiosque de Gaspard        │ │
│ │ ouvert, tickets de 1 à 5 €   │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Domaine  (JOUER)  Boutiques  Top │
└──────────────────────────────────┘
```

Comptoir :

```
┌──────────────────────────────────┐
│ <  Le Grand Café     [ 1 250 € ] │
│                                  │
│  Ondine : « Qu'est-ce que je     │
│  vous sers ? »                   │
│                                  │
│  ┌────┐ ┌──────────────┐ ┌────┐  │
│  │    │ │   RÉUSSITE   │ │    │  │
│  │ 10 │ │              │ │ 50 │  │
│  │  € │ │     20 €     │ │  € │  │
│  │    │ │   jusqu'à    │ │    │  │
│  │    │ │   20 000 €   │ │    │  │
│  └────┘ └──────────────┘ └────┘  │
│  tempérament : joueur            │
│  règles et lots                  │
│ ┌──────────────────────────────┐ │
│ │         Acheter 20 €         │ │
│ └──────────────────────────────┘ │
│  Carnet de 5        Carnet de 10 │
│  À gratter (3)                   │
└──────────────────────────────────┘
```

Grattage :

```
┌──────────────────────────────────┐
│ <   ticket 3 sur 5   [ 1 230 € ] │
│                                  │
│  ┌────────────────────────────┐  │
│  │ LA TIRELIRE DE PIOU    1 € │  │
│  │ Jusqu'à 500 €              │  │
│  │                            │  │
│  │  [ 5 € ] [ #### ] [ 2 € ]  │  │
│  │  [ #### ] [ 5 € ] [ #### ] │  │
│  │  [ 1 € ] [ #### ] [ #### ] │  │
│  │                            │  │
│  │ 3 montants identiques :    │  │
│  │ tu gagnes ce montant.      │  │
│  │ - - - - - - - - - - - - -  │  │
│  │ GR-4821-0937               │  │
│  └────────────────────────────┘  │
│                                  │
│ ┌──────────────────────────────┐ │
│ │         Tout gratter         │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Boutique :

```
┌──────────────────────────────────┐
│ <  Maison Sidonie    [ 1 250 € ] │
│  Chapeaux  Lunettes  Tenues  ... │
│                                  │
│ ┌──────────────┐┌──────────────┐ │
│ │ o            ││ o            │ │
│ │   (dessin)   ││   (dessin)   │ │
│ │ Chapeau      ││ Haut-de-     │ │
│ │ melon        ││ forme        │ │
│ │ 400 €   +8*  ││ 9 000 € +18* │ │
│ │ à ta portée  ││ encore       │ │
│ │              ││ 7 750 €      │ │
│ └──────────────┘└──────────────┘ │
│ ┌──────────────┐┌──────────────┐ │
│ │ o            ││ o            │ │
│ │   (dessin)   ││   (dessin)   │ │
│ │ Béret        ││ Canotier     │ │
│ │ porté        ││ à toi        │ │
│ └──────────────┘└──────────────┘ │
├──────────────────────────────────┤
│ Domaine  (JOUER)  Boutiques  Top │
└──────────────────────────────────┘
```

Classement :

```
┌──────────────────────────────────┐
│ Classement                       │
│                                  │
│        2         1         3     │
│    (avatar)  (AVATAR)  (avatar)  │
│      Lulu     Marcel      Zoé    │
│     88 M€    1,2 Md€     41 M€   │
│                                  │
│  4  (o) Capucine         12,5 M€ │
│  5  (o) Tonton Jo         9,8 M€ │
│  6  (o) Mimi              4,1 M€ │
│  7  (o) Belle Lurette     1,2 M€ │
│  ...                             │
│ ┌──────────────────────────────┐ │
│ │ 38  (o) Toi          4 870 € │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Domaine  (JOUER)  Boutiques  Top │
└──────────────────────────────────┘
```

### 12.4 Attentes, vides et erreurs

Un message d'erreur dit ce qui s'est passé et quoi faire. Il ne s'excuse pas et ne montre jamais de code technique.

| Situation | Ce que voit le joueur |
|---|---|
| Premier chargement | Logo et pièce qui tourne, moins de 2 secondes visées |
| Achat d'un ticket | Le distributeur tourne jusqu'à la réponse du serveur, 500 ms au moins |
| Hors connexion | Bandeau : « Hors connexion. Tu peux gratter tes tickets en attente, pas en acheter. » |
| Serveur muet | « Le kiosque ne répond pas. Réessaie dans un instant. » et le bouton « Réessayer » |
| Connexion coupée pendant un achat | L'application relit l'état du joueur, puis : « Connexion coupée pendant l'achat. Si le ticket a été vendu, il t'attend dans À gratter. » |
| Solde insuffisant | « Il te manque 12 €. La Tirelire de Piou est à 1 €. » |
| Lieu fermé | « Le Casino ouvre à ★ 60. Il te manque 26 ★ : passe chez Sidonie. » |
| Trop de tickets en attente | « Gratte d'abord tes tickets en attente. » |
| Achats trop rapprochés | « Gaspard n'a que deux pattes. Réessaie dans un instant. » |
| Pseudo déjà pris | « Ce pseudo est pris. Essaie avec un autre. » |

## 13. Design system

### 13.1 Parti pris

Une Riviera vue de nuit depuis la baie : fond bleu profond, papier ivoire pour tout ce qui est en papier, jaune mimosa pour l'argent, rose bougainvillier pour le Standing et la fête, vert persienne pour dire « tu peux ».

Chaque objet a la forme de ce qu'il est. Un ticket est un ticket, avec son talon. Un article est une étiquette, avec sa ficelle. Une ligne de classement est une plaque vissée. Il n'y a pas de carte générique à coins arrondis.

### 13.2 Couleurs

```css
:root {
  /* Fonds et textes */
  --nuit: #0E2F3A;                /* fond de l'application ; encre sur papier */
  --lagune: #17505C;              /* surfaces posées sur le fond nuit */
  --ecume: #E6F2F0;               /* texte principal sur fond sombre */
  --brume: #B4CDD0;               /* texte secondaire sur fond sombre */
  --ivoire: #FFF7E6;              /* papier : tickets, étiquettes, feuilles */
  --encre-douce: #4A6670;         /* texte secondaire sur papier */

  /* Sens */
  --mimosa: #F7C948;              /* argent, gains, action principale */
  --mimosa-fonce: #B88A14;        /* tranche des boutons et des pièces, jamais du texte */
  --bougainvillier: #D9457A;      /* Standing, fête : grandes formes et icônes */
  --bougainvillier-fonce: #B02A5F;/* le même, pour du texte sur papier */
  --bougainvillier-clair: #F08DB1;/* le même, pour du texte sur fond sombre */
  --persienne: #2F8F72;           /* « tu peux » : formes et icônes */
  --persienne-fonce: #1F6F57;     /* texte sur papier */
  --persienne-clair: #5FC9A6;     /* texte sur fond sombre */
  --cerise: #C8323C;              /* erreur, somme manquante, sur papier */
  --cerise-clair: #FF8A8F;        /* le même sur fond sombre */

  /* Métaux : les seuls dégradés de l'interface */
  --laiton: linear-gradient(160deg, #F3D58A 0%, #C99A3A 45%, #8F6A1F 100%);
  --encre-argent: linear-gradient(135deg, #C9CED4 0%, #F1F3F5 40%, #AEB5BC 60%, #D9DDE1 100%);
}
```

Contrastes vérifiés (WCAG) :

| Texte | Fond | Rapport |
|---|---|---|
| `--ecume` | `--nuit` | 12,3 |
| `--brume` | `--nuit` | 8,4 |
| `--ecume` | `--lagune` | 7,8 |
| `--brume` | `--lagune` | 5,3 |
| `--mimosa` | `--nuit` | 9,0 |
| `--nuit` | `--mimosa` | 9,0 |
| `--nuit` | `--ivoire` | 13,2 |
| `--encre-douce` | `--ivoire` | 5,7 |
| `--bougainvillier-fonce` | `--ivoire` | 5,8 |
| `--persienne-fonce` | `--ivoire` | 5,6 |
| `--cerise` | `--ivoire` | 4,9 |
| `--bougainvillier-clair` | `--nuit` | 6,1 |
| `--persienne-clair` | `--nuit` | 6,9 |
| `--cerise-clair` | `--nuit` | 6,2 |

`--bougainvillier` et `--persienne` sans suffixe n'atteignent pas 4,5 sur ces fonds : les réserver aux formes, aux icônes et aux textes de 24 px et plus.

Les couleurs des lieux sont en section 4.2. Elles n'habillent que le décor du lieu, pas les composants.

### 13.3 Typographie

- **Abril Fatface** pour les titres, les noms de tickets et les montants gagnés. Une seule graisse. Jamais en dessous de 24 px : ses déliés fins se perdent.
- **Jost** pour tout le reste, en 400, 500 et 700. Sa géométrie rappelle les enseignes Art déco.
- Polices hébergées dans le dépôt (par exemple avec les paquets Fontsource), sous-ensemble latin, `font-display: swap`.

| Rôle | Police | Taille et interligne |
|---|---|---|
| Montant du jackpot | Abril Fatface | 64 / 64 |
| Montant gagné, nom d'un lieu | Abril Fatface | 40 / 44 |
| Titre d'écran, nom d'un ticket | Abril Fatface | 28 / 32 |
| Bouton, solde | Jost 700 | 20 / 24 |
| Texte courant | Jost 400 | 16 / 24 |
| Texte secondaire | Jost 400 | 14 / 20 |
| Mention | Jost 500 | 12 / 16 |

- Rien en dessous de 12 px.
- Phrases en casse normale partout. Les capitales espacées sont réservées à ce qui est imprimé sur les tickets.
- Le solde utilise `font-variant-numeric: tabular-nums`. Si la police ne fournit pas de chiffres tabulaires, animer le solde dans des cases de largeur fixe.
- Vérifier le dessin du signe € et des chiffres en Abril Fatface. S'il déçoit, composer les montants en Jost 700.

### 13.4 Espaces, rayons, ombres

- **Espaces.** 4, 8, 12, 16, 24, 32, 48 px.
- **Rayons, selon l'objet.** Ticket : 14 px. Étiquette : 6 px et un coin coupé. Bouton et bourse : pilule. Feuille : 24 px en haut. Plaque de rang : 4 px.
- **Ombres.** Teintées de nuit, jamais grises. Papier : `0 10px 24px rgba(14, 47, 58, .35)`. Bouton principal : une tranche pleine de 4 px en `--mimosa-fonce`, sans flou.
- **Largeur.** Contenu limité à 480 px et centré. Au-delà, le décor du lieu continue.
- **Bords d'écran.** Respecter `env(safe-area-inset-*)`.

### 13.5 Composants

| Composant | Description | États |
|---|---|---|
| Bourse | Pilule à liseré laiton, pièce à gauche, solde en Jost 700. En haut à droite des écrans de jeu et de boutique | Compte quand le solde change. Clignote en `--cerise-clair` quand un achat est refusé faute d'argent |
| Compteur de Standing | Étoile bougainvillier et nombre | Les ★ gagnées s'y envolent |
| Bouton principal | Pilule mimosa, texte `--nuit`, 56 px de haut, tranche de 4 px. Son texte dit ce qui va se passer : « Acheter 20 € » | Enfoncé, désactivé (opacité 40 %, sans tranche), en attente (pièce qui tourne) |
| Bouton secondaire | Contour de 2 px, texte seul | Les mêmes |
| Ticket | Section 7.2. Miniature au comptoir, grand au grattage : c'est le même composant | Neuf, en cours, perdu (pâli), gagnant (tampon « Payé ») |
| Étiquette | Section 9.2 | À ta portée, trop cher, à toi, porté |
| Plaque de rang | Bande de laiton mat, deux vis, rang, mini-avatar, pseudo, fortune | Ordinaire, podium, toi (fond ivoire), propriétaire du Kiosque (liseré d'or) |
| Carte d'objectif | Sur le Domaine : le prochain lieu et sa barre de ★, puis « Collection : 37 sur 52 », puis « Le Kiosque est à vendre » | |
| Feuille | Panneau ivoire qui monte du bas, avec une poignée | Se ferme en glissant vers le bas |
| Message bref | Bandeau au-dessus des onglets, 3 secondes | Information, erreur |
| Jauge de tempérament | Trois pastilles, dont une, deux ou trois pleines, et le mot à côté | |
| Barre d'onglets | Quatre onglets, icône et mot. « Jouer » porte une pastille mimosa plus grande | Actif : icône pleine, mot en `--mimosa` |
| Bulle de personnage | Portrait rond de l'hôte et une phrase | À l'entrée d'un lieu, après un gros gain, à l'achat |

### 13.6 Icônes

Un jeu d'icônes maison en SVG : grille de 24 px, trait de 2 px à bouts ronds, version pleine pour l'onglet actif. Maison au palmier (Domaine), ticket (Jouer), cintre (Boutiques), coupe (Classement), roue dentée, étoile, pièce, flèche de retour, cadenas, haut-parleur, téléphone qui vibre.

## 14. Mouvement, son et vibrations

### 14.1 Mouvement

Le mouvement répond à un geste. Pas d'animation d'entrée posée sur chaque élément, pas de boucle décorative en dehors de l'animation d'ambiance du domaine.

| Usage | Durée | Courbe |
|---|---|---|
| Appui sur un bouton, enfoncement de 3 px | 80 ms | linéaire |
| Bascule, changement d'onglet | 160 ms | `--sortie` |
| Feuille, changement d'écran | 280 ms | `--sortie` |
| Ticket qui sort du distributeur | 600 ms | `--sortie` |
| Rebond d'un contenu révélé, d'une pièce | 300 ms | `--rebond` |
| Fêtes | Section 8.5 | |

```css
:root {
  --sortie: cubic-bezier(.2, .8, .2, 1);
  --rebond: cubic-bezier(.34, 1.56, .64, 1);
}
```

- Confettis, pièces et copeaux sont dessinés sur canvas, jamais en éléments DOM.
- Avec `prefers-reduced-motion` ou le réglage « Animations réduites » : fondus de 200 ms, pas de particules, comptage du solde en 300 ms, fêtes ramenées à une image fixe et au montant.

### 14.2 Son

Tous les sons sont synthétisés avec Web Audio. Aucun fichier audio.

| Événement | Recette |
|---|---|
| Grattage | Bruit blanc dans un filtre passe-bande entre 2 et 5 kHz. Le volume suit la vitesse du doigt, lissée sur 50 ms. Silence à l'arrêt |
| Case révélée | Clic boisé : sinus qui glisse de 880 à 440 Hz en 60 ms |
| Pièce | Triangle à 1 319 Hz et 1 976 Hz, extinction en 250 ms. Un demi-ton plus haut à chaque pièce pendant le comptage |
| Perdu | Note sourde descendante, 120 ms, volume faible |
| Petit, joli | Deux notes ; arpège de trois notes |
| Gros, énorme | Arpège de cinq notes et cymbale ; fanfare de huit notes |
| Jackpot | Fanfare, roulement, chute de pièces pendant 2 secondes |
| Ticket acheté | Bruit bref d'imprimante, puis clic |
| Achat en boutique | Deux tintements et un tiroir-caisse |

Volume général à 0,6. Réglage « Son » activé par défaut. Le contexte audio démarre au premier toucher et se suspend quand l'application passe en arrière-plan.

### 14.3 Vibrations

Avec `navigator.vibrate`, quand il existe et que le réglage est activé. Cette API manquait à Safari sur iPhone au moment d'écrire ce brief : dans ce cas il ne se passe rien, sans erreur. Un contournement circule pour l'iPhone (le retour haptique d'une case à cocher de type interrupteur), mais il ne réagit qu'à un toucher franc, pas à un glissé : hors périmètre en V1.

| Événement | Motif en millisecondes |
|---|---|
| Grattage | 4, tous les 48 px parcourus, au plus une fois toutes les 60 ms |
| Case révélée | 10 |
| Achat | 12 |
| Petit | 15 |
| Joli | 20, 40, 20 |
| Gros | 30, 40, 30, 40, 60 |
| Énorme | 40, 40, 40, 40, 40, 40, 120 |
| Jackpot | 60, 40, 60, 40, 60, 40, 60, 40, 300 |
| Perdu | Aucune |

## 15. Architecture technique

### 15.1 Pile technique

- **Client.** Vite, React, TypeScript strict. Un seul magasin d'état (Zustand ou un contexte React). CSS natif avec les variables de la section 13, un fichier par composant. Canvas 2D et Web Audio natifs.
- **Serveur.** Une seule Netlify Function qui route `/api/*`, `@netlify/blobs` pour le stockage.
- **Tests.** Vitest.
- **Dépendances à l'exécution.** `react`, `react-dom`, `zustand`, `@netlify/blobs`. Toute autre dépendance est justifiée dans `DECISIONS.md`.
- Pas de bibliothèque de composants, pas de moteur de jeu, pas de fichier audio ni d'image bitmap en V1.

### 15.2 Arborescence

```
/
├─ BRIEF.md
├─ DECISIONS.md
├─ netlify.toml
├─ package.json
├─ index.html
├─ public/                 manifest.webmanifest, icônes
├─ shared/                 importé par le client et par la fonction
│  ├─ types.ts
│  ├─ economy.ts           tempéraments, tirage
│  ├─ tickets.ts           les 15 tickets
│  ├─ places.ts            les 5 lieux
│  ├─ catalog.ts           les 52 biens et le Kiosque
│  ├─ rules.ts             standing, fortune, validations
│  └─ format.ts            formatEuros
├─ src/
│  ├─ app/                 magasin d'état, client d'API, navigation
│  ├─ screens/             un dossier par écran
│  ├─ scratch/             moteur de grattage
│  ├─ engines/             trio, numeros, morpion, duel, etoile, lignes, multi
│  ├─ art/                 avatars, décors, personnages, tickets, icônes, registry.ts
│  ├─ fx/                  particules, fêtes, audio, vibrations
│  └─ styles/              tokens.css
├─ server/                 logique serveur, hors du dossier des fonctions
│  ├─ router.ts
│  ├─ storage.ts           interface, version Blobs, version mémoire pour les tests
│  ├─ auth.ts
│  ├─ board.ts
│  └─ handlers/
├─ netlify/functions/
│  └─ api.mts              point d'entrée unique
├─ scripts/simulate.ts
└─ tests/
```

La logique serveur vit dans `server/` et non dans `netlify/functions/`, pour que Netlify ne prenne pas un fichier utilitaire pour une fonction.

### 15.3 Types partagés

```ts
// shared/types.ts
export type PlaceId = "kiosque" | "cafe" | "casino" | "salon" | "cercle";
export type Temperament = "pepere" | "joueur" | "casse-cou";
export type EngineId = "trio" | "numeros" | "morpion" | "duel" | "etoile" | "lignes" | "multi";
export type Slot = "chapeau" | "lunettes" | "tenue" | "accessoire" | "vehicule" | "residence" | "tresor";

export interface TicketDef {
  id: string; name: string; place: PlaceId; price: number;
  temperament: Temperament; engine: EngineId; options: Record<string, unknown>;
}

export interface ItemDef {
  id: string; name: string; shop: "sidonie" | "enzo" | "colette" | "archibald";
  slot: Slot; price: number; standing: number;
}

export interface PlayerState {      // ce que le client reçoit
  id: string; pseudo: string; species: string;
  balance: number;                  // dépensable tout de suite
  pending: PendingTicket[];         // achetés, pas encore déclarés grattés (20 au plus)
  owned: string[];                  // ids du catalogue
  look: Record<"chapeau" | "lunettes" | "tenue" | "accessoire" | "vehicule" | "residence", string | null>;
  kiosk: boolean;
  standing: number;                 // recalculé par le serveur à chaque écriture
  fortune: number;                  // balance + gains en attente + prix des biens
  stats: {
    tickets: number; winners: number; wagered: number; won: number;
    bestGain: number; bestTicket: string | null; jackpots: number;
  };
  createdAt: number;
}
```

Le serveur garde en plus, dans `PlayerRecord` : `v` (version du schéma), `pseudoKey`, `codeHash`, `boardAt`, `lastBuyAt`, `lastHouseAt`, `day`, `dayTickets`, `banned`, `updatedAt`. Ces champs ne sont jamais envoyés au client.

### 15.4 Vie d'un ticket

1. **Achat.** Le client envoie `POST /api/tickets/buy`. Le serveur tire le gain, débite le prix, range le ticket dans `pending` et le renvoie. Le gain n'est pas encore dans le solde.
2. **Grattage.** Tout se passe sur l'appareil, sans réseau. Quand le résultat s'affiche, le client ajoute l'identifiant du ticket à `grattouille.revealed`.
3. **Déclaration.** Le client déclare les tickets grattés dans le champ `ack` de sa requête suivante, quelle qu'elle soit. S'il n'y en a pas, il envoie `POST /api/tickets/ack` en quittant l'écran de grattage, au passage en arrière-plan (`fetch` avec `keepalive`) ou 3 secondes après le dernier grattage.
4. **Versement.** Pour chaque ticket déclaré encore présent dans `pending`, le serveur ajoute le gain au solde, met à jour les statistiques de gain (`winners`, `won`, `bestGain`, `bestTicket`, et `jackpots` pour un gain d'au moins 500 fois le prix) et retire le ticket. Déclarer deux fois le même ticket ne verse rien la seconde fois.

Conséquences :

- Le solde affiché vaut `state.balance` plus les gains des tickets grattés pas encore déclarés.
- Le serveur traite toujours `ack` avant de vérifier le solde : on peut donc racheter tout de suite avec ce qu'on vient de gagner.
- Un ticket acheté n'est jamais perdu. Coupure réseau, application fermée, changement d'appareil : il est dans `pending` et se retrouve dans « À gratter ».

### 15.5 API

Toutes les réponses sont en JSON. Une erreur a la forme `{ "error": { "code": "…", "message": "…" } }`.

| Méthode et chemin | Accès | Corps | Réponse |
|---|---|---|---|
| `GET /api/health` | Libre | | `{ ok, context }` |
| `POST /api/players` | Libre | `{ pseudo, species }` | `{ playerId, code, state }` |
| `POST /api/session` | Libre | `{ pseudo, code }` | `{ playerId, state }` |
| `GET /api/me` | Joueur | | `{ state }` |
| `POST /api/tickets/buy` | Joueur | `{ type, qty, ack? }` | `{ tickets, state }` |
| `POST /api/tickets/house` | Joueur | `{ ack? }` | `{ tickets, state }` |
| `POST /api/tickets/ack` | Joueur | `{ ack }` | `{ state }` |
| `POST /api/shop/buy` | Joueur | `{ itemId, equip?, ack? }` | `{ state }` |
| `POST /api/look` | Joueur | `{ look?, species? }` | `{ state }` |
| `DELETE /api/me` | Joueur | | `{ ok }` |
| `GET /api/leaderboard` | Libre | | `{ entries, updatedAt }` |
| `POST /api/admin/ban` | Clé d'administration | `{ playerId }` | `{ ok }` |

`ack` est une liste d'identifiants de tickets grattés. `qty` vaut 1, 5 ou 10.

| Code d'erreur | Statut | Sens |
|---|---|---|
| `BAD_REQUEST` | 400 | Corps illisible, champ manquant, ticket ou article inconnu, quantité invalide |
| `PSEUDO_INVALID` | 400 | Pseudo hors format ou refusé |
| `UNAUTHORIZED` | 401 | Identifiant ou code invalide |
| `PLACE_LOCKED` | 403 | Standing insuffisant pour ce ticket |
| `KIOSK_LOCKED` | 403 | Collection incomplète |
| `NOT_FOUND` | 404 | Joueur ou route inconnus |
| `PSEUDO_TAKEN` | 409 | Pseudo déjà pris |
| `INSUFFICIENT_FUNDS` | 409 | Solde insuffisant |
| `PENDING_FULL` | 409 | Plus de 20 tickets en attente |
| `ALREADY_OWNED` | 409 | Bien déjà possédé |
| `HOUSE_NOT_ELIGIBLE` | 409 | Conditions du ticket de la maison non remplies |
| `CONFLICT` | 409 | Trois écritures concurrentes ratées de suite |
| `TOO_FAST` | 429 | Moins d'une seconde depuis le dernier achat de ticket |
| `DAILY_LIMIT` | 429 | Plus de 3 000 tickets achetés dans la journée |

### 15.6 Déroulé d'un achat de ticket côté serveur

1. Authentifier la requête.
2. Lire le joueur et son etag.
3. Appliquer `ack` (section 15.4).
4. Refuser si : ticket inconnu, quantité invalide, lieu fermé, `pending.length + qty > 20`, `balance < price × qty`, dernier achat depuis moins d'une seconde, plus de 3 000 tickets achetés aujourd'hui.
5. Tirer les gains (section 6.5) et créer les tickets avec un identifiant et une graine aléatoires.
6. Débiter : `balance -= price × qty`. Ajouter les tickets à `pending`. Mettre à jour `stats.tickets` et `stats.wagered`.
7. Recalculer `standing` et `fortune`. Décider s'il faut publier au classement (section 10).
8. Écrire avec `onlyIfMatch`. En cas de refus, reprendre à l'étape 2, trois essais au plus, puis `CONFLICT`.
9. Publier au classement si c'est décidé. Un échec ici n'empêche pas de répondre.
10. Répondre `{ tickets, state }`.

Les autres routes suivent le même squelette : lire, appliquer `ack`, valider, modifier, écrire sous condition.

- **Ticket de la maison.** Conditions de la section 5.5, vérifiées après `ack`. Le ticket créé porte `house: true` et un gain de 3 fois le prix.
- **Achat en boutique.** Refuser si l'article est inconnu, déjà possédé, ou trop cher. Pour le Kiosque, exiger les 52 biens. Avec `equip: true`, mettre l'article à son emplacement dans `look`.
- **`/api/look`.** Chaque article désigné doit être possédé et correspondre à son emplacement. `null` retire.

### 15.7 Stockage

Trois stores Netlify Blobs, ouverts en cohérence forte :

| Store | Clé | Valeur |
|---|---|---|
| `gr-players-{ctx}` | `playerId` | `PlayerRecord` |
| `gr-pseudos-{ctx}` | Pseudo normalisé | `{ playerId }` |
| `gr-board-{ctx}` | `top` | `{ entries: BoardEntry[], updatedAt }` |

`{ctx}` vaut `prod` quand `context.deploy.context === "production"`, et `test` dans tous les autres cas. Sans cette séparation, un aperçu de déploiement écrirait dans les données des vrais joueurs : les stores de site sont partagés entre tous les déploiements.

Toute écriture d'un document existant est conditionnelle :

```ts
// server/storage.ts — schéma à adapter à la version installée de @netlify/blobs
import { getStore } from "@netlify/blobs";

const players = (ctx: string) =>
  getStore({ name: `gr-players-${ctx}`, consistency: "strong" });

export async function mutatePlayer<T>(
  ctx: string, id: string, mutate: (p: PlayerRecord) => T,
): Promise<T> {
  const store = players(ctx);
  for (let attempt = 0; attempt < 3; attempt++) {
    const found = await store.getWithMetadata(id, { type: "json" });
    if (!found) throw new ApiError(404, "NOT_FOUND");
    const record = found.data as PlayerRecord;
    const result = mutate(record);           // lève ApiError en cas de refus
    const { modified } = await store.setJSON(id, record, { onlyIfMatch: found.etag });
    if (modified) return result;             // sinon quelqu'un a écrit entre-temps : on relit
  }
  throw new ApiError(409, "CONFLICT");
}
```

- **Création d'un compte.** Réserver d'abord le pseudo avec `setJSON(pseudoKey, { playerId }, { onlyIfNew: true })`. Si `modified` est faux, répondre `PSEUDO_TAKEN`. Écrire ensuite le joueur avec `onlyIfNew`. Si cette écriture échoue, libérer le pseudo.
- **Interface.** `server/storage.ts` expose une interface (`getPlayer`, `mutatePlayer`, `createPlayer`, `deletePlayer`, `claimPseudo`, `getBoard`, `mutateBoard`) avec deux implémentations : Blobs, et mémoire pour les tests.
- **Pourquoi Blobs suffit ici.** Netlify recommande plutôt sa base Postgres pour des soldes soumis à des écritures concurrentes. Ici, chaque joueur n'écrit que dans son propre document, chaque écriture est conditionnelle, et le classement est une donnée dérivée que l'on peut reconstruire. Si le jeu grandit, seule l'implémentation de `storage.ts` change.
- **Pas de sauvegarde automatique.** Blobs n'a ni versions ni restauration. Pour un jeu de fiction c'est acceptable ; le noter dans « À propos » n'est pas nécessaire.

### 15.8 Sécurité et triche

- Le tirage, les prix, les seuils et les soldes ne viennent jamais du client. Le client envoie des intentions : « j'achète ce ticket », « j'ai gratté celui-ci ».
- Lire le gain dans la réponse avant de gratter ne donne aucun avantage : il est déjà fixé.
- Corps de requête limité à 4 Ko, validé champ par champ, sans bibliothèque.
- Aucune requête d'une autre origine : pas d'en-tête CORS.
- Les empreintes de code sont comparées en temps constant.
- Deux freins contre les robots : un achat de ticket par seconde, 3 000 tickets par jour. Un joueur banni par la route d'administration disparaît du classement ; son compte continue de fonctionner.
- La clé d'administration est une variable d'environnement, jamais dans le dépôt.
- Les journaux ne contiennent ni code de récupération ni empreinte.

### 15.9 Client

- **Une requête à la fois.** Le client d'API met les requêtes en file.
- **Jamais de renvoi automatique d'un `POST`.** Après une erreur réseau, le client appelle `GET /api/me` et se cale sur l'état du serveur.
- **Au lancement.** `GET /api/me`. Les tickets de `pending` déjà présents dans `grattouille.revealed` sont déclarés. Les autres vont dans « À gratter ».
- **Affichage optimiste** seulement là où un retour en arrière est simple : porter un article, changer de résidence. Jamais pour un achat.
- **Mode bac à sable.** Avec `?bac-a-sable`, le client utilise une fausse API en mémoire, qui tire les gains localement avec les mêmes tableaux. Il sert au jalon 1 et aux démonstrations hors ligne. Il n'écrit jamais sur le serveur.

## 16. Déploiement sur Netlify

### 16.1 Ce qui a été vérifié le 25 novembre 2026

- **Glisser-déposer.** Connecté à son compte, on peut déposer un projet qui n'est pas encore construit : Netlify détecte le framework et lance la construction. Sans connexion, les fichiers sont publiés tels quels.
- **Fonctions.** La documentation des fonctions décrit deux chemins : un dépôt Git relié, ou un déploiement manuel par la CLI ou l'API. Elle ne dit rien du glisser-déposer. D'anciennes réponses du support disent que les fonctions n'y sont pas prises en charge ; un témoignage de juillet 2026 sur le forum rapporte qu'elles le sont pour un dossier contenant `netlify/`. **Conclusion : tester au jalon 0, avec la voie A en solution de repli.**
- **Blobs.** Rien à configurer : l'accès est fourni automatiquement à la fonction.
- **Crédits de l'offre gratuite.** 300 par mois, sans dépassement possible : à zéro, les projets du compte sont mis en pause.

| Poste | Coût |
|---|---|
| Mise en production réussie | 15 crédits |
| Aperçu de déploiement, déploiement de branche, déploiement en échec | 0 |
| Calcul des fonctions | 10 crédits par Go-heure |
| Bande passante | 20 crédits par Go |
| Requêtes web, fichiers statiques et appels de fonction compris | 2 crédits pour 10 000 |

Ces chiffres changent : les relire sur la page de l'annexe C avant de s'y fier.

### 16.2 Fichiers de configuration

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
```

```ts
// netlify/functions/api.mts
import type { Config, Context } from "@netlify/functions";
import { route } from "../../server/router";

export default async (req: Request, context: Context) => route(req, context);

export const config: Config = { path: "/api/*" };
```

Pas de règle de redirection : l'application n'a qu'une page et aucune route d'URL.

### 16.3 Voie A, recommandée : le dépôt GitHub relié à Netlify

1. Dans Netlify, créer le projet en important le dépôt GitHub. La commande de construction et le dossier publié viennent de `netlify.toml`.
2. Branche de production : `main`.
3. Travailler sur des branches. Chaque demande de fusion reçoit un aperçu de déploiement gratuit, avec sa propre adresse et les stores `test`. C'est là qu'on essaie.
4. Fusionner dans `main` en fin de jalon seulement : une mise en production, 15 crédits.

Avec 300 crédits par mois, on dispose d'une vingtaine de mises en production au grand maximum, et le trafic puise dans la même réserve. Ne pas pousser chaque petite retouche sur `main`.

### 16.4 Voie B : le glisser-déposer

1. Télécharger le dépôt depuis GitHub et le décompresser.
2. Connecté à Netlify, déposer **le dossier du projet entier**, et non `dist` : les fonctions ont besoin de l'étape de construction. Ne pas inclure `node_modules`.
3. Vérifier que la fonction `api` apparaît dans la liste des fonctions du projet et que `/api/health` répond.
4. Si la fonction n'apparaît pas, passer à la voie A.

Chaque dépôt part directement en production, sans étape d'aperçu, et coûte 15 crédits.

### 16.5 Réglages

- **Variable d'environnement.** `ADMIN_KEY`, définie dans l'interface de Netlify avec une portée qui inclut les fonctions. Une variable déclarée dans `netlify.toml` n'est pas visible par les fonctions.
- **Région.** Les stores de site sont créés par défaut aux États-Unis. On peut choisir Francfort (`eu-central-1`) en passant `region` à chaque `getStore`, sans exception, et en plaçant la fonction dans la même région. Ce choix se fait au jalon 0 et ne se change plus : changer de région ne déplace pas les données. En V1, garder les valeurs par défaut : l'animation du distributeur couvre la latence.
- **Développement local.** `netlify dev` lance Vite, la fonction et un store Blobs local, isolé de la production.

### 16.6 Ordre de grandeur des crédits

Hypothèses : premier chargement de 600 Ko en 20 requêtes, un appel d'API d'environ 0,3 seconde sur une fonction de 1 Go.

| Usage | Crédits |
|---|---|
| 1 000 premières visites | Environ 16 : 12 de bande passante, 4 de requêtes |
| 1 000 achats de tickets | Environ 1 |
| Une partie complète, soit 750 tickets | Moins de 1 |
| Une mise en production | 15 |

Un mois avec 5 mises en production, 5 000 visites et 100 000 achats tient dans les 300 crédits. Les carnets, la déclaration groupée des tickets et le cache du classement existent pour ça.

### 16.7 Avant d'ouvrir au public

- `/api/health` répond en production et la fonction est listée.
- Un compte créé en aperçu n'apparaît pas en production.
- `ADMIN_KEY` est définie.
- Les mentions « Jeu de fiction » et « Réservé aux adultes » sont visibles dès le premier écran.
- Les noms des tickets ont été revérifiés.
- L'application s'installe sur l'écran d'accueil d'un iPhone et d'un Android, avec son icône et en plein écran.

## 17. Qualité

### 17.1 Accessibilité

- « Tout gratter » rend chaque ticket jouable sans geste de grattage.
- Cibles tactiles de 48 px au moins, cases à gratter de 44 px au moins.
- Contrastes de la section 13.2. Aucune information portée par la couleur seule : un gain, c'est une couleur, un mot et un son.
- Lecteurs d'écran : chaque bouton a un nom. Le résultat est annoncé dans une zone `aria-live` (« Gagné 50 € »). Le canvas d'encre est masqué ; le contenu d'une case n'est exposé qu'une fois révélé.
- Animations réduites, son et vibrations se règlent séparément.
- Le zoom du navigateur n'est pas bloqué. Seule la zone de grattage neutralise les gestes du navigateur.
- Avec un texte agrandi à 130 %, aucun écran ne casse.

### 17.2 Performance

- Premier chargement : 300 Ko de JavaScript compressé au plus, 600 Ko au total avec les polices.
- Écran utile en moins de 2,5 secondes sur une connexion 4G moyenne.
- Fichiers nommés avec une empreinte et mis en cache longtemps.
- Grattage : section 8.7.
- API : 95 % des réponses en moins de 800 ms.

### 17.3 Compatibilité

- Safari sur iPhone et Chrome sur Android, deux dernières versions majeures.
- Écrans de 360 × 640 à 430 × 932.
- Portrait seulement. En paysage : « Tourne ton téléphone. »
- Sur ordinateur, le jeu reste jouable à la souris dans une colonne de 480 px.
- Installation sur l'écran d'accueil : `manifest.webmanifest` (nom, icônes 192 et 512 px dont une version masquable, `display: standalone`, `orientation: portrait`, couleur de thème `--nuit`) et balises Apple équivalentes. Pas de service worker en V1.

### 17.4 Tests automatiques

- **Économie.** Section 6.7.
- **Moteurs.** L'invariant de la section 7.1 sur les 15 tickets. `splitGain` rend toujours des montants de la palette dont la somme est exacte. Un `trio` perdant ne contient jamais trois montants identiques. Un `morpion` perdant n'a aucune ligne complète.
- **Règles.** Standing, fortune, conditions du ticket de la maison. `formatEuros` sur 999 999, 1 000 000, 1 250 000 et 1 250 000 000.
- **Serveur, avec le stockage en mémoire.** Création, pseudo déjà pris, achat nominal, chacun des refus de la section 15.5, versement à la déclaration, déclaration répétée sans double versement, deux achats concurrents sur le même joueur, publication au classement, limite de 200 entrées.

### 17.5 Recette sur un vrai téléphone, à chaque jalon

- Gratter avec le pouce, vite puis lentement : ni trou dans le tracé, ni saccade.
- Couper le réseau pendant un achat, puis le rétablir.
- Fermer l'application avec des tickets en attente, la rouvrir.
- Ouvrir le même compte dans deux onglets et acheter des deux côtés.
- Vider le stockage du navigateur et récupérer le compte avec le code.
- Activer les animations réduites, couper le son.
- Jouer dix minutes d'une seule main, debout. C'est le vrai test.

## 18. Plan de réalisation

Chaque jalon se termine par une version jouable et une liste de points à vérifier par un humain. Ne pas commencer un jalon avant que le précédent soit validé.

### Jalon 0 : socle et déploiement

- Projet Vite, React, TypeScript. `tokens.css`, polices, coquille à quatre onglets vides.
- `netlify.toml`, `netlify/functions/api.mts`, route `GET /api/health` qui écrit puis relit un blob dans un store `gr-health-{ctx}`.
- Déployer par la voie B, sinon par la voie A.

Validé quand : `/api/health` répond `{ ok: true }` en production, la page s'affiche sur un téléphone, et la voie de déploiement retenue est notée dans `DECISIONS.md`.

### Jalon 1 : le grattage

Le cœur du plaisir d'abord, sans serveur, en mode bac à sable.

- Moteur de grattage complet (section 8), composant Ticket (section 7.2), moteur `trio`, ticket La Tirelire de Piou.
- Paliers de résultat, son et vibrations de base, boutons « Tout gratter » et « Racheter le même ».

Validé quand : on enchaîne vingt tickets au pouce sans friction, à 60 images par seconde, et que l'invariant de 7.1 passe pour `trio`.

### Jalon 2 : économie et serveur

- `shared/` complet : tempéraments, tickets, lieux, catalogue, règles, `formatEuros`, avec leurs tests.
- `server/` : stockage, authentification, création et récupération de compte, `me`, achat, déclaration, ticket de la maison.
- Client : magasin d'état, client d'API, écran de bienvenue, création de compte, premier ticket gagnant.

Validé quand : les tests de la section 17.4 passent, deux onglets ne peuvent pas corrompre un solde, et un achat interrompu se retrouve dans « À gratter ».

### Jalon 3 : tous les tickets

- Les six moteurs restants et les quinze habillages.
- Promenade, comptoir, fiche d'un ticket avec son tableau de lots, carnets, rafale, pile « À gratter ».

Validé quand : l'invariant de 7.1 passe pour les quinze tickets, chaque ticket est jouable sur un écran de 360 × 640, et les lieux fermés affichent ce qui manque.

### Jalon 4 : boutiques, avatar, domaine

- Les quatre boutiques, les étiquettes, la fiche, l'achat.
- Huit espèces, 24 articles de garde-robe, dressing.
- Domaine avec résidences, véhicules et trésors. Ouverture d'un lieu en plein écran.
- Le Kiosque et le générique de fin.

Validé quand : n'importe quelle combinaison d'espèce et de vêtements s'affiche proprement sur la planche de contrôle, et qu'un achat qui franchit un seuil ouvre bien le lieu.

### Jalon 5 : classement

- Publication, lecture, écran, ligne du joueur épinglée.
- Suppression de compte, filtre de pseudos, route d'administration.

Validé quand : dix publications simultanées n'en perdent aucune durablement, et qu'un compte supprimé disparaît du classement.

### Jalon 6 : finitions

- Fêtes complètes par palier, dialogues des personnages selon le Standing (annexe B), tous les sons, toutes les vibrations.
- Réglages, « À propos », manifeste d'installation, états d'attente, de vide et d'erreur (section 12.4).
- Passe d'accessibilité et de performance (sections 17.1 et 17.2).

Validé quand : la recette de la section 17.5 est faite sur un iPhone et un Android.

### Jalon 7 : équilibrage et ouverture

- `scripts/simulate.ts` reproduit le tableau de la section 5.7 à 15 % près.
- Liste de la section 16.7.

Validé quand : une personne qui ne connaît pas le jeu atteint le Grand Café sans aide et comprend le Standing sans qu'on le lui explique.

## 19. Après la V1

Idées volontairement laissées de côté, par ordre d'intérêt :

1. Ticket du jour offert.
2. Image à partager après un gros gain.
3. Trophées : premier jackpot, cent tickets, collection complète d'une boutique.
4. Ambiance sonore propre à chaque lieu.
5. Second classement, celui du plus gros gain.
6. Tickets de saison à durée limitée.
7. Revente des biens à l'Agence Colette.
8. Service worker et démarrage hors ligne.
9. Illustrations commandées à la place des SVG (section 4.7).
10. Passage à une base Postgres si les joueurs se comptent en milliers.

---

## Annexe A. Catalogue complet

52 biens pour 2 545 029 535 €, soit environ 2,55 Md€, et 4 086 ★. Avec le Kiosque : 3,55 Md€ et 5 000 ★.

Barème de Standing, selon le prix :

| Prix | Standing |
|---|---|
| Moins de 10 € | +2 ★ |
| De 10 à 49 € | +3 ★ |
| De 50 à 199 € | +5 ★ |
| De 200 à 999 € | +8 ★ |
| De 1 000 à 4 999 € | +12 ★ |
| De 5 000 à 19 999 € | +18 ★ |
| De 20 000 à 99 999 € | +25 ★ |
| De 100 000 à 499 999 € | +40 ★ |
| De 500 000 € à moins de 2 M€ | +60 ★ |
| De 2 M€ à moins de 10 M€ | +90 ★ |
| De 10 M€ à moins de 50 M€ | +130 ★ |
| De 50 M€ à moins de 200 M€ | +200 ★ |
| De 200 M€ à moins de 500 M€ | +300 ★ |
| 500 M€ et plus | +400 ★ |

Les valeurs ci-dessous font foi : les écrire en dur dans `shared/catalog.ts`.

### Maison Sidonie : chapeaux

| Article | `id` | Prix | Standing |
|---|---|---|---|
| Béret de marin | `beret` | 8 € | +2 ★ |
| Canotier | `canotier` | 35 € | +3 ★ |
| Chapeau melon | `melon` | 400 € | +8 ★ |
| Haut-de-forme en soie | `haut-de-forme` | 9 000 € | +18 ★ |
| Bicorne d'apparat | `bicorne` | 350 000 € | +40 ★ |
| Couronne en or massif | `couronne` | 60 M€ | +200 ★ |

### Maison Sidonie : lunettes

| Article | `id` | Prix | Standing |
|---|---|---|---|
| Lunettes rondes | `lunettes-rondes` | 12 € | +3 ★ |
| Solaires en écaille | `solaires-ecaille` | 90 € | +5 ★ |
| Monocle | `monocle` | 1 200 € | +12 ★ |
| Lorgnon en or | `lorgnon` | 30 000 € | +25 ★ |
| Solaires serties de diamants | `solaires-diamants` | 900 000 € | +60 ★ |
| Monocle en saphir | `monocle-saphir` | 40 M€ | +130 ★ |

### Maison Sidonie : tenues

| Article | `id` | Prix | Standing |
|---|---|---|---|
| Marinière | `mariniere` | 15 € | +3 ★ |
| Veston en tweed | `veston-tweed` | 150 € | +5 ★ |
| Costume trois-pièces | `trois-pieces` | 2 500 € | +12 ★ |
| Smoking sur mesure | `smoking` | 60 000 € | +25 ★ |
| Queue-de-pie brodée d'or | `queue-de-pie` | 2 M€ | +90 ★ |
| Cape de velours impériale | `cape-imperiale` | 80 M€ | +200 ★ |

### Maison Sidonie : accessoires

| Article | `id` | Prix | Standing |
|---|---|---|---|
| Nœud papillon | `noeud-pap` | 5 € | +2 ★ |
| Foulard en soie | `foulard` | 60 € | +5 ★ |
| Montre à gousset | `gousset` | 800 € | +8 ★ |
| Collier de perles | `perles` | 20 000 € | +25 ★ |
| Montre à tourbillon | `tourbillon` | 750 000 € | +60 ★ |
| Sautoir de diamants | `sautoir` | 25 M€ | +130 ★ |

### Chez Enzo : garage et port

| Article | `id` | Prix | Standing |
|---|---|---|---|
| Vélo d'occasion | `velo` | 40 € | +3 ★ |
| Scooter pétaradant | `scooter` | 900 € | +8 ★ |
| Citadine « La Puce » | `citadine` | 6 000 € | +18 ★ |
| Cabriolet « Tramontane » | `cabriolet` | 45 000 € | +25 ★ |
| Berline « Grand Large » | `berline` | 180 000 € | +40 ★ |
| Coupé « Fauve GT » | `coupe` | 650 000 € | +60 ★ |
| Supercar « Éclair V12 » | `supercar` | 4 M€ | +90 ★ |
| Hypercar « Comète » | `hypercar` | 18 M€ | +130 ★ |
| Yacht « La Sirène » | `yacht` | 120 M€ | +200 ★ |
| Jet privé « Albatros » | `jet` | 350 M€ | +300 ★ |

### Agence Colette : résidences

| Article | `id` | Prix | Standing |
|---|---|---|---|
| Chambre de bonne | `chambre-de-bonne` | 3 000 € | +12 ★ |
| Studio sous les toits | `studio` | 25 000 € | +25 ★ |
| Appartement avec balcon | `appartement` | 120 000 € | +40 ★ |
| Maison de pêcheur | `maison-pecheur` | 400 000 € | +40 ★ |
| Loft sur le port | `loft` | 1,5 M€ | +60 ★ |
| Villa « Les Mimosas » | `villa-mimosas` | 8 M€ | +90 ★ |
| Hôtel particulier | `hotel-particulier` | 30 M€ | +130 ★ |
| Villa de la Corniche | `villa-corniche` | 90 M€ | +200 ★ |
| Château de Belle-Rive | `chateau` | 300 M€ | +300 ★ |
| Île privée | `ile` | 800 M€ | +400 ★ |

Et, quand la collection est complète : le Kiosque de Gaspard (`kiosque`), 1 Md€, +914 ★.

### Galerie Archibald : trésors

| Article | `id` | Prix | Standing |
|---|---|---|---|
| Coquillage porte-bonheur | `coquillage` | 20 € | +3 ★ |
| Affiche ancienne du Casino | `affiche` | 300 € | +8 ★ |
| Vase en porcelaine | `vase` | 5 000 € | +18 ★ |
| Tableau « Nature morte au homard » | `tableau` | 70 000 € | +25 ★ |
| Statue en bronze | `statue` | 900 000 € | +60 ★ |
| Œuf d'orfèvre | `oeuf` | 12 M€ | +130 ★ |
| Fresque de maître | `fresque` | 100 M€ | +200 ★ |
| Diamant « L'Étoile du Port » | `diamant` | 500 M€ | +400 ★ |

## Annexe B. Dialogues et textes d'interface

### Répliques des personnages

`{pseudo}` est remplacé par le pseudo du joueur. Une case vide signifie que le personnage ne se rencontre pas à ce niveau de Standing. Ces répliques donnent le ton : en écrire trois ou quatre par situation dans le même esprit.

| Personnage, situation | Moins de 60 ★ | 60 à 249 ★ | 250 à 999 ★ | 1 000 ★ et plus |
|---|---|---|---|---|
| Gaspard, ticket vendu | « Tiens, mon grand. Gratte-moi ça ! » | « Voici pour vous, {pseudo}. Bonne chance. » | « Si {pseudo} veut bien se donner la peine de gratter… » | « Que Votre Excellence daigne effleurer ce modeste ticket. » |
| Gaspard, ticket perdant | « Raté ! Allez, un autre ? » | « Pas de chance. Le suivant sera le bon. » | « Ce ticket ne vous méritait pas. » | « Je fais renvoyer l'imprimeur, Excellence. » |
| Mlle Sidonie, article vendu | « Ça vous va. Presque. » | « Voilà qui est mieux. » | « On dirait que c'est fait pour vous. C'est le cas. » | « Je n'ai plus rien à vous apprendre. Je le regrette. » |
| Enzo, véhicule vendu | « Vroum. Signe là. » | « Vrrr. Elle est à vous. » | « Écoutez ce moteur. Chut. Écoutez. » | « Je l'ai lustrée moi-même. Deux fois. » |
| Mme Colette, visite | « C'est petit, mais c'est ravissant. » | « Ravissant, n'est-ce pas ? » | « Ravissant. Et cette vue ! » | « Trop ravissant pour quiconque d'autre. » |
| Maître Archibald, trésor vendu | « Une fois, deux fois, adjugé ! » | « Adjugé à la personne du fond. » | « Adjugé, avec mes compliments. » | « Adjugé. Le musée en pleurera. » |
| Hector, gros gain | | Il lève un sourcil. | « Félicitations. » | « La maison s'incline. » |
| Le Baron, jackpot | | | « Excusez-moi. Une poussière dans l'œil. » | « Je… Pardon. C'est l'émotion. » |

Piou, lui, ne change jamais de ton :

- Accueil : « Vous voilà à Grattouille-les-Bains avec 4 € en poche. Ça suffit pour commencer ! »
- Tickets en attente : « Je vous ai gardé 3 tickets au chaud. »
- Ticket de la maison : « La maison ne laisse personne repartir les poches vides. »
- Code de récupération : « Notez ce code. Sans lui, votre fortune reste sur ce téléphone. »

### Textes d'interface

| Endroit | Texte |
|---|---|
| Achat d'un ticket | « Acheter 20 € » |
| Carnets | « Carnet de 5 pour 100 € », « Carnet de 10 pour 200 € » |
| Grattage | « Tout gratter », « Gratter en rafale » |
| Après le résultat | « Racheter le même 20 € », « Changer de ticket », « Ticket suivant » |
| Résultats | « Rien cette fois. », « Remboursé. », « Joli coup », « Gros gain », « Énorme », « Jackpot » |
| Ticket de la maison | « Ticket offert par la maison », « Offert, toujours gagnant » |
| Après un achat en boutique | « Porter maintenant », « S'y installer », « Prendre le volant » |
| Ouverture d'un lieu | « Le Casino de la Jetée vous ouvre ses portes. », « Y aller » |
| Fiche du ticket Signe du Homard | « Ton signe ne change pas tes chances. Il change la tête du ticket. » |
| Bienvenue | « Jeu de fiction. Aucun argent réel. Réservé aux adultes. » |

Les messages d'attente et d'erreur sont en section 12.4.

### « Dans la vraie vie »

Texte de l'écran « À propos » :

> Dans la vraie vie, c'est l'inverse. Un vrai ticket à gratter reverse en moyenne autour de 70 % des mises, et entre un ticket sur trois et un sur quatre est gagnant, souvent juste pour rembourser la mise. Ici, chaque euro misé en rapporte plus de deux : c'est pour ça que c'est un jeu.
>
> Si le jeu d'argent pèse sur toi ou sur un proche : Joueurs Info Service, 09 74 75 13 13, appel anonyme et non surtaxé, tous les jours de 8 h à 2 h.

Revérifier ces chiffres et ce numéro avant publication.

## Annexe C. Sources vérifiées

Consultées le 25 novembre 2026. Les relire avant de coder ce qui en dépend.

| Sujet | Page |
|---|---|
| Netlify Blobs : API, cohérence, écritures conditionnelles, limites, régions | https://docs.netlify.com/build/data-and-storage/netlify-blobs |
| Stores partagés entre production et aperçus | https://www.netlify.com/knowledge-base/why-your-deploy-preview-can-delete-netlify-blobs-data/ |
| Fonctions : mise en route, déploiement | https://docs.netlify.com/build/functions/get-started |
| Fonctions : chemins, méthodes, région | https://docs.netlify.com/build/functions/configuration/ |
| Façons de déployer, dont le glisser-déposer | https://docs.netlify.com/deploy/create-deploys/ |
| Netlify Drop | https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/ |
| Crédits de l'offre gratuite | https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ |
| Critères d'un jeu d'argent en droit français | https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques-et-les-faq/loterie-des-pratiques-commerciales-reglementees |
| Classement PEGI des simulations de jeux d'argent | https://www.osborneclarke.com/insights/games-loot-boxes-get-16-plus-age-rating-europe-under-pegi-overhaul |
| Joueurs Info Service | https://www.joueurs-info-service.fr/ |
| Jeux de grattage existants, pour vérifier les noms | https://www.fdj.fr/jeux-illiko |
| Taux de retour des jeux de grattage existants | https://www.fdj.fr/transparence/Transparence.html |

