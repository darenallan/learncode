---
description: Transforme un dossier de cours (PDF, notes…) en briques à apprendre dans cours.html
argument-hint: cours/<Nom_du_cours>
---

# Ajouter un cours à cours.html

Dossier du cours : **$ARGUMENTS**

Si aucun dossier n'est donné, liste les sous-dossiers de `cours/` absents de `MANIFEST` dans `cours.html`, puis demande lequel traiter.

Réponds en français, en phrases courtes. Fais une étape à la fois. Teste sur PC et en largeur téléphone. **Pas de commit, aucune dépense.**

## 1. Lire le cours en entier

- Liste les fichiers du dossier. Lis chaque support jusqu'au bout : PDF (par tranches de 20 pages), `.md`, `.txt`, `.docx`, `.pptx`, images. Ne saute aucune section, aucun exemple, aucun exercice corrigé.
- Si le dossier contient déjà `cours.js` ou des `jourN.js`, le cours existe : ne traite que les supports nouveaux ou modifiés, et ajoute leurs jours à la suite sans casser les ids existants (sinon la progression enregistrée se perd).
- Note pour chaque support le titre, l'ordre des notions, les définitions exactes, les exemples de code avec leurs résultats et les pièges que le prof signale.
- Repère la technologie (SQL/PostgreSQL ou autre) : elle décide si le cours a une base exécutable (étape 3).

## 2. Découper en briques

Un support (un jour, un chapitre) donne un **jour**. Un jour contient 8 à 18 **briques**.

- **Une brique = une seule notion**, apprise en 3 à 5 minutes. Si une notion en suppose une autre, celle-ci doit venir avant, dans une brique précédente.
- Suis l'ordre du cours et reprends son vocabulaire. Les noms de tables, de colonnes et les valeurs des exemples doivent être les mêmes que dans les supports.
- N'invente rien qui contredise le cours. Si le support est ambigu ou faux, choisis la version correcte et signale-le dans le rapport final.

## 3. Écrire les fichiers

Crée dans `$ARGUMENTS` :

- `cours.js` : un seul `COURS.add({...})`.
- `jour1.js`, `jour2.js`… : chacun contient un `COURS.day(...)`.

Commence chaque fichier par un commentaire qui cite le support source. Pour le format exact, prends modèle sur `cours/SQL_Avancé/cours.js` et `cours/SQL_Avancé/jour1.js`.

### cours.js

```js
COURS.add({
  id: "nom-court",            // unique, kebab-case, ne change plus jamais
  title: "Titre du cours",
  subtitle: "Techno · école",  // optionnel
  summary: "Une ou deux phrases sur ce qu'on apprend.",
  note: "Remarques sur les données d'exemple ou les limites.", // optionnel
  // Seulement pour un cours SQL :
  schemaDoc: `liste lisible des tables et colonnes`,
  seed: `DROP SCHEMA IF EXISTS x CASCADE; CREATE SCHEMA x; CREATE TABLE ...; INSERT ...;`,
  bench: `...`,               // optionnel : grosse table pour la performance, créée à la demande
});
```

- **Cours SQL** : le `seed` reconstruit la base des supports. Il doit redonner **exactement** les résultats montrés dans les PDF : vérifie chaque total, chaque nombre de lignes et chaque nom. Le schéma `public` et le schéma `work` sont remis à neuf avant chaque exécution. `work` sert aux essais de l'élève.
- **Autre cours** (Python, JS, réseau, maths…) : pas de `seed` ni de `bench`. Les exemples `code` s'affichent alors sans bouton « Exécuter », et seuls les exercices `qcm` et `fill` sont possibles.

### jourN.js

```js
COURS.day("nom-court", {
  id: "j1", label: "Jour 1", title: "Titre du support",
  summary: "Ce que couvre ce jour.",
  bricks: [
    {
      id: "j1-notion",           // unique dans tout le cours, préfixé par le jour
      title: "Nom de la notion",
      learn: ["Paragraphe 1, avec **gras** et `code`.", "Paragraphe 2…"], // 2 à 4 paragraphes
      code: `exemple`,           // optionnel ; exécutable si cours SQL
      retiens: "La phrase à garder en tête.",
      keys: [["Terme", "Définition courte."]],
      bench: true,               // optionnel, SQL : la brique utilise la table bench
      ex: [ /* 3 à 6 exercices */ ],
    },
  ],
});
```

Types d'exercices :

| `t` | Champs | Règles |
|---|---|---|
| `qcm` | `q`, `o` (2 à 4 options), `a` (index de la bonne), `why` | Des pièges plausibles, tirés des erreurs courantes. La bonne réponse ne doit pas toujours être la première. |
| `qcm` + `code` | idem + `code` | « Prédis » : l'élève prédit le résultat ou l'erreur du code. |
| `fill` | `q` avec `___`, `a` (toutes les formes acceptées), `why` | Un seul mot ou une expression courte. Les accents et la casse sont ignorés. |
| `sql` | `q`, `sol`, `why`, optionnels : `start`, `need`, `ban`, `verify`, `cols`, `check:"run"`, `hint` | La réponse est notée sur son résultat, comparé à celui de `sol`. L'ordre des lignes compte seulement si `sol` contient un ORDER BY. `verify` relit l'état après un INSERT/UPDATE. `need`/`ban` : mots exigés ou interdits. `cols:true` vérifie aussi le nom des colonnes. |

Pour qu'une brique s'ancre bien :
- Chaque `why` explique pourquoi la réponse est juste et pourquoi le piège est faux.
- Mélange reconnaître (qcm), restituer (fill) et produire (sql ou Prédis).
- Le dernier exercice demande d'appliquer la notion, pas seulement de la reconnaître.
- Reprends les exercices corrigés des supports : ce sont ceux de l'examen.
- Une notion clé du cours mérite des `keys`, qui alimentent le lexique.

Les fichiers sont chargés par de simples balises `<script>`. **Pas de `const` ou `let` global dont le nom est déjà utilisé** dans un autre fichier de cours : encapsule les variables dans le fichier, ou donne-leur un nom propre au cours.

## 4. Brancher le cours

Dans `cours.html`, ajoute une entrée au tableau `MANIFEST`, avec les fichiers dans l'ordre :

```js
{ dir: "cours/Nom_du_cours", files: ["cours.js", "jour1.js", "jour2.js"] },
```

Ne modifie pas le moteur de `cours.html`, sauf si le cours a vraiment besoin d'un nouveau type d'exercice. Dans ce cas, demande d'abord.

## 5. Vérifier

1. **Validation automatique** (obligatoire) :
   ```
   npm install --prefix outils   # seulement si outils/node_modules n'existe pas
   node outils/valider-cours.mjs "$ARGUMENTS"
   ```
   Corrige jusqu'à `0 problème(s)`. Pour un cours SQL, compare aussi les résultats affichés (`✓ … lignes : …`) à ceux des supports.
2. Relance `node outils/valider-cours.mjs "cours/SQL_Avancé"` (et les autres cours du MANIFEST) pour vérifier que rien n'est cassé.
3. **Navigateur** : lance `node serve.mjs` (http://127.0.0.1:5190, une seule fois), puis ouvre `cours.html`.
   - Le cours apparaît sur l'accueil.
   - Une brique se déroule jusqu'au bout : une bonne réponse, une mauvaise qui revient en fin de série, l'écran de fin.
   - Cours SQL : un exemple s'exécute, et un exercice SQL juste puis faux est bien noté.
   - Aucune erreur dans la console.
   - En largeur 390 px (iframe ou redimensionnement), pas de défilement horizontal.
   - Efface ensuite la progression de test : `localStorage.removeItem("learncode.cours.v1")`.

## 6. Rapport final (en français, court)

- Le résultat d'abord : nom du cours, nombre de jours, de briques et d'exercices.
- Ce qui a été vérifié, et comment.
- Les ambiguïtés ou erreurs trouvées dans les supports, et le choix fait.
- Les fichiers créés ou modifiés, en liens cliquables.
- Rappel : rien n'est commité.
