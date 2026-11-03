# Learncode

Application d'apprentissage personnelle pour suivre le programme de **B2 informatique (Ynov)**, sur ordinateur comme sur téléphone. Les cours sont découpés en petites briques de 3 à 5 minutes, avec exercices, QCM et SQL exécuté directement dans le navigateur.

Site 100 % statique : aucun serveur, aucun compte. La progression est enregistrée dans le navigateur (`localStorage`).

## Contenu

| Page | Rôle |
|---|---|
| `index.html` | **Parcours B2** : menu du jour, test de niveau, révision des erreurs, série de jours consécutifs. Modules : SQL avancé, React.js & TypeScript, conception POO & design patterns, conteneurisation, scripting & automatisation système, Windows Server, travail collaboratif & documentation |
| `cours.html` | **Mes cours** : les supports réels des cours (PDF du prof) transformés en briques, avec une base PostgreSQL 18 exécutée dans le navigateur ([PGlite](https://pglite.dev)) pour lancer les exemples et vérifier les exercices |

Cours disponible : **SQL avancé** (PostgreSQL 18, 5 jours), construit à partir des 5 PDF de `cours/SQL_Avancé/`. Ses exemples tournent sur la base « CampusMarket », reconstituée d'après les supports.

## Lancer en local

Prérequis : Node.js 20+.

```bash
node serve.mjs
```

Le serveur affiche deux adresses :
- `http://127.0.0.1:5190` sur le PC ;
- l'adresse du PC sur le réseau, à ouvrir depuis le téléphone (même Wi-Fi).

Il est en lecture seule : il ne sert que les fichiers du dossier, jamais les fichiers cachés comme `.git`.

## Ajouter un cours

1. Créer un dossier `cours/<Nom_du_cours>/` et y déposer les supports (PDF, notes…).
2. Le transformer en briques avec la commande Claude Code `/ajouter-cours cours/<Nom_du_cours>` (voir `.claude/commands/ajouter-cours.md`). Elle produit `cours.js` et `jourN.js` puis les référence dans `MANIFEST` (`cours.html`).
3. Vérifier le cours avant de le publier :

```bash
cd outils && npm install && cd ..
node outils/valider-cours.mjs "cours/<Nom_du_cours>"
```

Le validateur contrôle la structure (identifiants uniques, QCM, textes à trous). Si le cours a une base, il exécute aussi chaque exemple et chaque solution sur PostgreSQL 18 (PGlite). Il renvoie le code 1 s'il reste un problème.

> Ne jamais changer l'identifiant d'une brique existante : la progression enregistrée y est rattachée.

## Structure

```
index.html            parcours B2 (contenu, exercices, progression)
cours.html            lecteur de cours + MANIFEST des cours disponibles
cours/<Nom>/          supports source (PDF) + cours.js et jourN.js générés
outils/               validateur de cours (Node + PGlite)
serve.mjs             serveur local en lecture seule
```

## Dépendances externes

Chargées à la volée depuis un CDN : PGlite (`cours.html`) et sql.js (`index.html`), pour exécuter du SQL dans le navigateur.
