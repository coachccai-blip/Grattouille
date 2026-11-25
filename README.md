# Grattouille

Un jeu de tickets à gratter où la chance sourit au joueur. Jeu de fiction : aucun argent
réel, rien à acheter, rien à retirer. Réservé aux adultes.

Tout le cahier des charges est dans [`BRIEF.md`](BRIEF.md). Les choix que le brief
laissait ouverts sont consignés dans [`DECISIONS.md`](DECISIONS.md).

## Mettre en ligne sur Netlify

### En déposant le projet (voie B)

1. Se connecter à Netlify. Sans connexion, les fichiers seraient publiés tels quels,
   sans construction ni serveur de jeu.
2. Décompresser `grattouille-netlify.zip` et déposer **le dossier obtenu, en entier** :
   celui qui contient `netlify.toml` et `package.json`. Pas le dossier `dist`, et sans
   `node_modules`. Netlify lit `netlify.toml`, lance `npm run build` et publie `dist`.
3. Vérifier que la fonction `api` apparaît dans la liste des fonctions du projet, et que
   `https://<ton-site>.netlify.app/api/health` répond `{"ok":true,"context":"prod"}`.
4. Si la fonction n'apparaît pas, le jeu affiche « Le kiosque n'est pas encore ouvert » :
   passer alors par un dépôt GitHub relié (ci-dessous).

### Par un dépôt GitHub relié (voie A)

Dans Netlify, créer le projet en important le dépôt. La commande de construction et le
dossier publié viennent de `netlify.toml`. Branche de production : `main`. Chaque demande
de fusion reçoit un aperçu gratuit, avec ses propres données (stores `test`).

### Réglage

Définir la variable d'environnement `ADMIN_KEY` (8 caractères au moins) dans l'interface
de Netlify, avec une portée qui inclut les fonctions. Elle protège la route qui retire un
joueur du classement :

```
curl -X POST https://<ton-site>.netlify.app/api/admin/ban \
  -H "Authorization: Bearer <ADMIN_KEY>" -H "Content-Type: application/json" \
  -d '{"playerId":"p_…"}'
```

`{"playerId":"p_…","unban":true}` lève le bannissement.

Le stockage (Netlify Blobs) ne demande aucune configuration. Chaque mise en production
coûte des crédits : voir la section 16 du brief avant de redéployer souvent.

## Travailler en local

Il faut Node 22.12 ou plus récent.

```
npm install
npm run dev        # http://localhost:5173, avec une API en mémoire
```

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement. `/api/*` est servi en mémoire : rien à installer d'autre. |
| `npm run build` | Vérifie les types puis construit `dist/`. |
| `npm run serve` | Sert `dist/` et l'API en mémoire sur http://localhost:4173, comme en ligne. |
| `npm test` | Les tests : économie, moteurs de tickets, règles, serveur, stockage Blobs, simulation. |
| `npm run simulate` | Simule des parties complètes et compare au tableau de la section 5.7 du brief. |
| `npm run zip` | Fabrique `livraison/grattouille-netlify.zip`, l'archive à déposer sur Netlify. |

Avec la CLI de Netlify, `netlify dev` lance en plus la vraie fonction et un store Blobs
local, isolé de la production.

## Adresses utiles

- `?bac-a-sable` : le jeu complet sans serveur. Rien n'est enregistré, tout disparaît au
  rechargement. Pour une démonstration : `?bac-a-sable&solde=5000000&biens=30`, ou
  `?bac-a-sable&palier=jackpot` pour voir une fête de jackpot.
- `?planche` : la planche de contrôle des illustrations et des tickets.

## Organisation

```
shared/              les chiffres du jeu : économie, tickets, lieux, catalogue, règles
server/              la logique du serveur (comptes, tickets, boutiques, classement)
netlify/functions/   api.mts, le point d'entrée unique de /api/*
src/app/             magasin d'état, client d'API, navigation, bac à sable
src/engines/         les 7 moteurs de tickets
src/scratch/         le grattage sur canvas
src/ticket/          le ticket et ses 15 habillages
src/art/             toutes les illustrations, en SVG
src/fx/              particules, son synthétisé, vibrations
src/screens/         un dossier par écran
src/ui/              boutons, bourse, feuilles, en-têtes
scripts/             simulation, serveur local, fabrication de l'archive
tests/
```

Les chiffres des sections 5 et 6 du brief vivent dans `shared/` et nulle part ailleurs.
Toute retouche d'un prix, d'un poids ou d'un seuil passe par `npm run simulate` et
`npm test` avant d'être validée.

## Avant d'ouvrir au public

La liste de la section 16.7 du brief, et ce qui n'a pas pu être vérifié hors ligne
(`DECISIONS.md`, section 8) : la fonction en production, un vrai téléphone, l'installation
sur l'écran d'accueil, Safari et Firefox, les noms des tickets.
