# Décisions

Ce que le brief ne tranchait pas, et le choix retenu à chaque fois : le plus simple qui
respecte les principes de la section 2. Les numéros de section renvoient à `BRIEF.md`.

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

- `npm install`, `npm run build`, `npm test` (144 tests) et `npm run simulate` passent ;
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
  s'écrit « 20,03 M€ »). À 999,995 M€ on passe à « 1 Md€ ». Au-delà de 999 Md€, plus de
  décimales : « 1 250 Md€ ».
- **Chances affichées** (`oddsLabel`) : une décimale sous 10, un entier au-delà, arrondi
  au pair le plus proche pour retomber sur les tableaux de la section 5 (62,5 donne 62).
- **Simulation.** Le brief décrit le joueur simulé mais laisse deux points ouverts. Le
  tableau de la section 5.7 est retrouvé à 2,4 % près avec ces deux lectures : l'étape
  d'un lieu est le premier ticket que le joueur y achète (pas le moment où son Standing
  l'ouvre) ; le Kiosque est racheté dès que le solde atteint son prix. `npm run simulate`
  sort en erreur si une médiane s'écarte de plus de 15 %.
- **Ticket offert par la maison.** Il compte dans les tickets grattés et dans les
  tickets gagnants, pas dans les mises. Il ne consomme pas la limite de 3 000 tickets par
  jour. Vingt secondes au moins séparent deux tickets offerts.
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
  `&solde=5000000`, `&biens=30` (possède d'emblée les 30 biens les moins chers),
  `&palier=jackpot` (chaque ticket acheté tombe sur ce palier de résultat).
- **Développement sans Netlify.** `npm run dev` sert aussi `/api/*` avec le stockage en
  mémoire (`scripts/dev-api.ts`). `npm run serve` sert la version construite de la même
  façon. `netlify dev` reste possible pour essayer Blobs en local.
- **Politique de sécurité du contenu.** Une balise `meta` injectée à la construction
  (tout en `'self'`, aucune autre origine), plus les en-têtes de `netlify.toml`.
- **Navigation.** Aucune route d'URL. Chaque écran est une entrée d'historique : le
  bouton retour du téléphone ramène à l'écran précédent et referme une fiche. Le Domaine
  est la racine.
- **Stockage local.** Les trois clés de la section 11, rien d'autre.
  `grattouille.settings` garde aussi le signe choisi la dernière fois sur chaque ticket à
  signe et le fait d'avoir déjà vu l'invitation à noter son code.
- **Pannes au lancement.** Trois écrans : pas de réseau, serveur en erreur, page publiée
  sans sa fonction. Un compte que le serveur ne connaît plus ramène à l'écran de
  bienvenue avec un message.
- **Chiffres tabulaires.** Jost n'en fournit pas (mesuré : `tabular-nums` ne change rien).
  La bourse et le Standing affichent donc chaque chiffre dans une case de largeur fixe,
  comme le prévoit la section 13.5.
- **Écrans étroits et texte agrandi.** Le solde s'écrit en 20 px à partir de 400 px de
  large, puis rétrécit jusqu'à 16 px à 320 px. Quand la bourse et le Standing ne tiennent
  plus côte à côte, le Standing passe dessous. Vérifié à 430, 390, 360, 320 et 277 px de large (277 px : un téléphone de
  360 px zoomé à 130 %).
- **Comptoir.** À l'arrivée, le ticket présenté est le dernier regardé dans ce lieu,
  sinon le moins cher.
- **Titres longs.** Les noms de lieux et de boutiques ont leur propre ligne et peuvent
  passer sur deux.

## 6. Tickets et grattage

- **Dimensions.** Tout le ticket est en `em` : sa taille de police vaut un vingt-cinquième
  de sa largeur. La miniature du comptoir et le grand ticket sont le même composant.
  Sur le grand ticket, aucun texte ne descend sous 12 px ; un montant trop long est
  resserré en largeur plutôt que rapetissé.
- **Taille du grand ticket.** Il prend la largeur disponible, sans dépasser la hauteur
  laissée par l'en-tête et le bouton « Tout gratter ». À 360 × 640, les cases à gratter
  des 15 tickets mesurent au moins 44 px.
- **Mille-Pattes.** Quinze numéros en 5 colonnes de 3.
- **Le Grand Grattouille.** Trois volets, un à la fois. « Tout gratter » balaie le volet
  en cours, puis les suivants.
- **Tickets à signe.** Le signe se choisit avant de gratter ; le dernier choisi est
  proposé la fois suivante.
- **Couleurs.** Chaque ticket a son papier, son encre à gratter et sa zone de jeu,
  décrits dans `src/ticket/themes.ts` à partir de la palette de la section 13.2.
- **Pinceau.** Le pinceau marque dès qu'il touche une case non révélée ; le son et les
  copeaux ne partent que si de l'encre a vraiment été retirée.

## 7. Illustrations

- Un registre unique, `src/art/registry.ts`, liste les 145 illustrations attendues
  (articles, lieux, personnages, espèces, vignettes et symboles des tickets). La planche
  de contrôle `?planche` les montre toutes et signale celles qui manqueraient.
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
- les noms des tickets, à revérifier avant d'ouvrir au public (section 16.7).
