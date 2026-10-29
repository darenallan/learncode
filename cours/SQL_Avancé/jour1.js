/* Jour 1 · Construire des bases solides (Day_01_Student_Lessons.pdf).
   Brique : learn (paragraphes), code (exemple exécutable), retiens, keys, ex.
   Exercices : qcm (o, a = index de la bonne option), fill (a = réponses acceptées),
   sql (sol = solution de référence ; verify relit l'état ; need/ban = mots exigés/interdits). */
COURS.day("sql-avance", {
  id: "j1",
  label: "Jour 1",
  title: "Construire des bases solides",
  summary: "Lire et filtrer une table, comprendre NULL, définir des tables avec contraintes, modifier sans risque, résumer avec GROUP BY.",
  bricks: [
    {
      id: "j1-bases",
      title: "Base, SGBD, table, ligne",
      learn: [
        "Une **base de données** est un ensemble organisé de faits enregistrés. Le **SGBD** (système de gestion de base de données) est le logiciel qui stocke ces faits et contrôle leur lecture et leur modification. Dans ce cours, le SGBD est PostgreSQL 18 et la boutique d'exemple s'appelle CampusMarket.",
        "Une base relationnelle range les faits en **tables**. Une **ligne** décrit une instance (un produit), une **colonne** décrit une propriété (son nom, son prix). Ce que représente une ligne s'appelle la **granularité**.",
        "Le **client** (psql dans un terminal, DBeaver, ou cette page) envoie du SQL au **serveur** PostgreSQL par une **connexion**. Le serveur renvoie un **jeu de résultats** ou une erreur. SQL est le langage ; PostgreSQL est le serveur qui le comprend.",
      ],
      code: `SELECT product_id, name, unit_price
FROM campus.products;`,
      retiens: "Avant chaque requête, demande-toi : que représente une ligne du résultat ?",
      keys: [
        ["SGBD", "Logiciel qui stocke les données et contrôle leur accès (ici PostgreSQL)."],
        ["Table", "Ensemble de lignes qui décrivent le même type de fait."],
        ["Granularité", "Ce que représente une ligne : un produit, une commande…"],
        ["Client", "Programme qui envoie le SQL (psql, DBeaver)."],
        ["Serveur", "Processus PostgreSQL qui reçoit et exécute le SQL."],
        ["Connexion", "Conversation entre un client et le serveur, avec une base et un rôle."],
        ["Jeu de résultats", "Lignes renvoyées par une requête."],
      ],
      ex: [
        { t: "qcm", q: "Quel est le rôle de PostgreSQL dans ce cours ?", o: ["Un SGBD : il stocke et traite les données", "Le langage dans lequel on écrit les requêtes", "Un client graphique pour taper du SQL", "L'outil qui démarre le conteneur"], a: 0, why: "SQL est le langage, psql et DBeaver sont des clients, Docker Compose démarre l'environnement. PostgreSQL est le serveur." },
        { t: "qcm", q: "Dans `campus.products`, que représente une ligne ?", o: ["Un produit", "Une propriété des produits", "Une commande", "La table entière"], a: 0, why: "Une ligne = une instance (un produit). Une colonne = une propriété." },
        { t: "fill", q: "Ce que représente une ligne d'une table ou d'un résultat s'appelle la ___.", a: ["granularité", "granularite"], why: "La granularité guide toute la requête : on la décide avant d'écrire le SQL." },
        { t: "qcm", q: "Le client envoie une instruction SQL au serveur. Que renvoie le serveur ?", o: ["Des lignes de résultat ou une erreur", "Une copie complète de la base", "Le fichier compose.yaml", "Rien, il exécute en silence"], a: 0, why: "Le SQL va vers le serveur ; les lignes ou l'erreur reviennent au client." },
      ],
    },
    {
      id: "j1-schema",
      title: "Schémas et noms qualifiés",
      learn: [
        "Une base PostgreSQL contient plusieurs **schémas**. Un schéma est un espace de noms qui regroupe des objets comme les tables. Dans `campus.products`, `campus` est le schéma et `products` la table : c'est un **nom qualifié**.",
        "Les vraies données du cours sont dans `campus` ; les essais jetables vont dans `work`. Écrire le nom complet évite de dépendre du `search_path`, le réglage invisible qui dit dans quels schémas chercher un nom non qualifié.",
        "Dans psql, le **point-virgule** termine une instruction SQL. Les commandes qui commencent par une barre oblique inverse (comme `\\q` pour quitter) sont des commandes psql, pas du SQL. Si une relation « n'existe pas », vérifie la base connectée, l'orthographe du schéma et l'ordre de configuration avant de modifier le SQL au hasard.",
      ],
      code: `SELECT count(*) AS students FROM campus.students;
SELECT count(*) AS orders FROM campus.orders;`,
      retiens: "Écris toujours `schema.table` : `campus.products`, `work.product_proposal`.",
      keys: [
        ["Schéma", "Espace de noms qui regroupe des tables dans une base."],
        ["campus.products", "Nom du schéma, un point, nom de la table."],
        ["search_path", "Schémas parcourus, dans l'ordre, pour un nom non qualifié."],
        ["work", "Schéma jetable du cours pour les essais."],
        [";", "Termine une instruction SQL."],
        ["\\q", "Commande psql (pas SQL) pour quitter."],
      ],
      ex: [
        { t: "qcm", q: "Dans `campus.products`, que désigne `campus` ?", o: ["Le schéma", "La base de données", "La table", "Une colonne"], a: 0 },
        { t: "qcm", q: "Une erreur « relation does not exist » apparaît. Que vérifier d'abord ?", o: ["La base connectée, l'orthographe du schéma et l'ordre de configuration", "Supprimer les contraintes de la table", "Ajouter DISTINCT", "Remplacer le point-virgule par une virgule"], a: 0, why: "Une erreur est un retour d'information : lis le message, puis teste une explication." },
        { t: "fill", q: "Dans psql, la commande pour quitter est ___", a: ["\\q"], why: "Les commandes à barre oblique inverse sont des commandes du client psql, pas du SQL." },
        { t: "sql", q: "Compte les produits de `campus.products` dans une colonne nommée `products`.", sol: "SELECT count(*) AS products FROM campus.products;", cols: true, why: "Le jeu de données de référence contient 6 produits." },
      ],
    },
    {
      id: "j1-select",
      title: "SELECT, FROM et AS",
      learn: [
        "`SELECT` lit des données et renvoie un jeu de résultats. `SELECT` nomme les colonnes de sortie, `FROM` désigne la table d'entrée. Une **clause** est une partie nommée d'une instruction. `SELECT *` demande toutes les colonnes ; des colonnes explicites sont plus claires pour un rapport stable.",
        "Le résultat est une nouvelle représentation des données : il ne modifie pas la table, et sélectionner moins de colonnes ne supprime pas les autres.",
        "Un **alias** est un nom temporaire. `unit_price AS price_eur` nomme la colonne de résultat sans renommer la colonne enregistrée (ce n'est pas un `ALTER TABLE`).",
      ],
      code: `SELECT product_id, name, unit_price AS price_eur
FROM campus.products;`,
      retiens: "Un SELECT ne modifie jamais la table. Un alias ne renomme rien dans la base.",
      keys: [
        ["SELECT", "Choisir les expressions à afficher."],
        ["FROM", "Choisir la table d'entrée."],
        ["SELECT *", "Toutes les colonnes de l'entrée."],
        ["AS", "Donner un nom lisible à une colonne de sortie."],
        ["Alias", "Nom au niveau de la requête, pas une modification de la table."],
        ["Clause", "Partie nommée d'une instruction SQL."],
      ],
      ex: [
        { t: "sql", q: "Affiche le nom (`name`) et le prix (`unit_price`) de tous les produits.", sol: "SELECT name, unit_price FROM campus.products;" },
        { t: "sql", q: "Affiche `name` et `stock` de chaque produit, en renommant `stock` en `units_left`.", sol: "SELECT name, stock AS units_left FROM campus.products;", cols: true, need: ["AS"] },
        { t: "qcm", q: "Après `SELECT unit_price AS price_eur FROM campus.products;`, comment s'appelle la colonne enregistrée dans la table ?", o: ["Toujours `unit_price`", "`price_eur`", "Les deux", "Elle est supprimée"], a: 0, why: "L'alias n'existe que dans le résultat de cette requête." },
        { t: "qcm", q: "Que devient la colonne `stock` après `SELECT name FROM campus.products;` ?", o: ["Rien : elle reste stockée, elle n'est juste pas affichée", "Elle est supprimée", "Elle passe à NULL", "Elle est masquée pour tout le monde"], a: 0 },
      ],
    },
    {
      id: "j1-order",
      title: "ORDER BY, LIMIT et OFFSET",
      learn: [
        "Les lignes d'une table n'ont **aucun ordre garanti**. `ORDER BY` trie le résultat : `ASC` croissant (par défaut), `DESC` décroissant. Les clés de tri s'évaluent de gauche à droite ; une dernière clé **unique** (comme `product_id`) départage les ex æquo et rend l'ordre déterministe.",
        "`LIMIT` plafonne le nombre de lignes renvoyées ; `OFFSET` saute des lignes avant de renvoyer la page. « Les deux premiers » n'a de sens métier qu'après un tri pertinent.",
      ],
      code: `SELECT name, unit_price
FROM campus.products
ORDER BY unit_price DESC, product_id
LIMIT 2;`,
      retiens: "Sans ORDER BY, pas d'ordre. Termine par une clé unique pour départager.",
      keys: [
        ["ORDER BY", "Trier les lignes renvoyées."],
        ["ASC", "Du plus petit au plus grand ; sens par défaut."],
        ["DESC", "Du plus grand au plus petit."],
        ["LIMIT n", "Renvoyer au plus n lignes."],
        ["OFFSET n", "Sauter les n premières lignes triées."],
      ],
      ex: [
        { t: "sql", q: "Les 3 produits les moins chers : `name` et `unit_price`, du moins cher au plus cher, départagés par `product_id`.", sol: "SELECT name, unit_price FROM campus.products ORDER BY unit_price, product_id LIMIT 3;", need: ["LIMIT"] },
        { t: "qcm", q: "Quel résultat ?", code: "SELECT name FROM campus.products\nORDER BY unit_price DESC, product_id\nLIMIT 2 OFFSET 2;", o: ["Mouse, Bottle", "Keyboard, USB Hub", "USB Hub, Mouse", "Bottle, Notebook"], a: 0, why: "Ordre décroissant : Keyboard 50, USB Hub 30, Mouse 25, Bottle 20… OFFSET 2 saute les deux premiers." },
        { t: "qcm", q: "Sans `ORDER BY`, dans quel ordre sortent les lignes ?", o: ["Aucun ordre n'est garanti", "Par clé primaire", "Par ordre d'insertion", "Par ordre alphabétique"], a: 0 },
        { t: "fill", q: "Pour trier du plus grand au plus petit : `ORDER BY unit_price ___`", a: ["DESC"] },
      ],
    },
    {
      id: "j1-types",
      title: "Littéraux et types de données",
      learn: [
        "Un **littéral** est une valeur écrite directement dans le SQL : texte entre **apostrophes** (`'Keyboard'`), nombre sans guillemets (`50.00`), booléen `TRUE`/`FALSE`. Les **guillemets doubles** désignent un **identifiant** (un nom de colonne sensible à la casse comme `\"Name\"`), pas du texte.",
        "Un **type** définit les valeurs qu'une colonne accepte et les opérations possibles : `integer`/`bigint` (entiers), `numeric(12,2)` (décimal exact : 12 chiffres dont 2 après la virgule), `text`, `boolean`, `date` (jour du calendrier), `timestamptz` (instant affiché selon le fuseau). Le type aide la base à refuser les entrées incompatibles.",
        "`numeric(12,2)` n'interdit pas à lui seul un prix négatif : c'est le rôle d'une contrainte `CHECK`.",
      ],
      code: `SELECT 'Keyboard' AS label, 50.00 AS price, TRUE AS available;`,
      retiens: "Apostrophes = texte. Guillemets doubles = nom (identifiant).",
      keys: [
        ["'texte'", "Littéral textuel."],
        ["\"Name\"", "Identifiant entre guillemets, sensible à la casse."],
        ["numeric(12,2)", "Décimal exact : 12 chiffres au total, 2 décimales."],
        ["integer / bigint", "Entiers ; bigint a une plage plus étendue."],
        ["boolean", "Vrai, faux, ou inconnu via NULL."],
        ["timestamptz", "Instant, affiché selon le fuseau de la session."],
      ],
      ex: [
        { t: "qcm", q: "Comment écrire le texte Keyboard en SQL ?", o: ["`'Keyboard'`", "`\"Keyboard\"`", "`Keyboard`", "`(Keyboard)`"], a: 0, why: "Les guillemets doubles désignent un identifiant ; sans guillemets, c'est aussi un nom." },
        { t: "qcm", q: "Quel type pour un prix qui doit être calculé exactement ?", o: ["`numeric(12,2)`", "`integer`", "`text`", "`boolean`"], a: 0 },
        { t: "qcm", q: "`numeric(12,2)` interdit-il un prix négatif ?", o: ["Non, il faut une contrainte CHECK", "Oui, toujours", "Oui si la colonne est NOT NULL", "Seulement pour les entiers"], a: 0 },
        { t: "fill", q: "Les guillemets doubles, comme dans `\"Name\"`, servent à écrire un ___.", a: ["identifiant", "identifiants", "nom", "identifier"], why: "Un identifiant nomme une table ou une colonne." },
      ],
    },
    {
      id: "j1-expr",
      title: "Expressions et CAST",
      learn: [
        "Une **expression** combine valeurs, opérateurs ou fonctions pour produire une valeur, calculée pour chaque ligne. `unit_price * stock` donne la valeur du stock au prix actuel ; ce n'est pas le chiffre d'affaires des ventes, qui utilisera le prix historique de chaque ligne de commande.",
        "Le type compte en arithmétique : la **division entière** élimine la partie décimale (`5 / 2` vaut `2`). `CAST(5 AS numeric) / 2` vaut `2.5`. Le raccourci PostgreSQL est `5::numeric`. Une conversion invalide (le texte « cheap » en nombre) produit une erreur.",
      ],
      code: `SELECT name, unit_price * stock AS catalog_value
FROM campus.products
ORDER BY product_id
LIMIT 3;`,
      retiens: "Entier / entier = entier. Convertis un opérande en numeric pour une division décimale.",
      keys: [
        ["Expression", "Calcul qui produit une valeur pour chaque ligne."],
        ["*  /", "Multiplier, diviser ; les types des opérandes influent sur le résultat."],
        ["CAST(v AS type)", "Convertir vers le type nommé."],
        ["v::type", "Raccourci PostgreSQL de CAST."],
      ],
      ex: [
        { t: "qcm", q: "Que renvoie PostgreSQL ?", code: "SELECT 7 / 2;", o: ["3", "3.5", "4", "Une erreur"], a: 0, why: "Deux entiers : division entière, la partie décimale est éliminée." },
        { t: "sql", q: "Affiche `name` et le prix TTC (`unit_price * 1.2`) nommé `price_ttc`, pour chaque produit.", sol: "SELECT name, unit_price * 1.2 AS price_ttc FROM campus.products;" },
        { t: "fill", q: "Le raccourci PostgreSQL de `CAST(5 AS numeric)` s'écrit `5___numeric`.", a: ["::"] },
        { t: "qcm", q: "`unit_price * stock` donne-t-il le chiffre d'affaires des ventes ?", o: ["Non : c'est la valeur du stock au prix actuel", "Oui", "Oui si on ajoute ORDER BY", "Seulement pour les produits actifs"], a: 0, why: "Le CA utilise le prix historique stocké dans chaque ligne de commande." },
      ],
    },
    {
      id: "j1-where",
      title: "WHERE et les comparaisons",
      learn: [
        "`WHERE` filtre les lignes d'entrée selon une **condition** (un **prédicat**). Une condition vaut vrai, faux ou inconnu ; PostgreSQL ne garde une ligne que si elle est **vraie**.",
        "Opérateurs : `=`, `<>` (différent), `<`, `<=`, `>`, `>=`. Les **bornes** comptent : `>= 25` garde Mouse (25 €), `> 25` l'écarte. Les lignes écartées ne sont pas supprimées : elles sont simplement absentes du résultat.",
      ],
      code: `SELECT name, unit_price
FROM campus.products
WHERE unit_price >= 25
ORDER BY unit_price DESC, product_id;`,
      retiens: "Traduire une règle métier, c'est d'abord décider si la borne est incluse.",
      keys: [
        ["WHERE", "Garder les lignes dont la condition est vraie."],
        ["Prédicat", "Expression dont le résultat est une valeur de vérité."],
        ["<>", "Différent de."],
        [">=", "Supérieur ou égal à."],
      ],
      ex: [
        { t: "sql", q: "Produits dont le stock est inférieur à 30 : `name` et `stock`, triés par stock croissant.", sol: "SELECT name, stock FROM campus.products WHERE stock < 30 ORDER BY stock;", need: ["WHERE"] },
        { t: "qcm", q: "Avec `WHERE unit_price > 25`, Mouse (exactement 25 €) est-il gardé ?", o: ["Non, > exclut l'égalité", "Oui", "Ça dépend de ORDER BY", "Oui s'il est actif"], a: 0 },
        { t: "fill", q: "« Différent de » s'écrit ___ en SQL standard.", a: ["<>", "!="] },
        { t: "qcm", q: "Que deviennent les lignes écartées par `WHERE` ?", o: ["Elles restent dans la table, absentes du résultat", "Elles sont supprimées", "Elles passent à NULL", "Elles sont déplacées dans work"], a: 0 },
      ],
    },
    {
      id: "j1-logic",
      title: "AND, OR, NOT, IN et BETWEEN",
      learn: [
        "`AND` exige que les deux conditions soient vraies ; `OR`, qu'au moins une le soit ; `NOT` inverse (NULL reste inconnu). `AND` est évalué **avant** `OR` : les parenthèses rendent le regroupement voulu explicite.",
        "`IN (2, 4)` teste l'appartenance à une liste. `BETWEEN 10 AND 25` inclut **les deux bornes** : c'est `prix >= 10 AND prix <= 25`.",
      ],
      code: `SELECT name, unit_price, stock
FROM campus.products
WHERE active
  AND (unit_price >= 20 OR stock < 15)
ORDER BY product_id;`,
      retiens: "Mets des parenthèses dès que tu mélanges AND et OR.",
      keys: [
        ["AND", "Les deux côtés doivent être vrais."],
        ["OR", "Au moins un côté doit être vrai."],
        ["NOT", "Inverse une condition ; NOT inconnu reste inconnu."],
        ["IN (…)", "Correspondre à l'une des valeurs listées."],
        ["BETWEEN a AND b", "Entre a et b, bornes incluses."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : produits **actifs** coûtant au moins 20 € : `name` et `unit_price`, les plus chers d'abord, départagés par `product_id`.", sol: "SELECT name, unit_price FROM campus.products WHERE active AND unit_price >= 20 ORDER BY unit_price DESC, product_id;", why: "USB Hub est exclu : il est inactif, même s'il coûte 30 €." },
        { t: "qcm", q: "`unit_price BETWEEN 10 AND 25` équivaut à :", o: ["`unit_price >= 10 AND unit_price <= 25`", "`unit_price > 10 AND unit_price < 25`", "`unit_price >= 10 OR unit_price <= 25`", "`unit_price > 10 AND unit_price <= 25`"], a: 0 },
        { t: "sql", q: "Produits des catégories 2 ou 4 (utilise `IN`) : `product_id` et `name`, triés par `product_id`.", sol: "SELECT product_id, name FROM campus.products WHERE category_id IN (2, 4) ORDER BY product_id;", need: ["IN"] },
        { t: "qcm", q: "Sans parenthèses, USB Hub (inactif, 30 €, stock 10) est-il gardé ?", code: "WHERE active AND unit_price >= 20 OR stock < 15", o: ["Oui : c'est (active AND prix >= 20) OR stock < 15, et stock < 15 est vrai", "Non, il est inactif", "Erreur de syntaxe", "Seulement s'il coûte plus de 20 €"], a: 0, why: "AND passe avant OR. D'où l'intérêt des parenthèses." },
      ],
    },
    {
      id: "j1-like",
      title: "LIKE, ILIKE et DISTINCT",
      learn: [
        "`LIKE` compare du texte à un **motif** : `%` correspond à n'importe quelle suite de caractères (même vide), `_` à exactement un caractère. `ILIKE` est la version PostgreSQL insensible à la casse.",
        "`SELECT` garde normalement les doublons. `DISTINCT` les élimine **sur toute la ligne sélectionnée** : avec deux colonnes, c'est la paire qui doit être unique. DISTINCT ne corrige pas une jointure fausse et ne touche pas aux doublons stockés.",
      ],
      code: `SELECT DISTINCT category_id
FROM campus.products
ORDER BY category_id;`,
      retiens: "% = zéro ou plusieurs caractères ; _ = exactement un.",
      keys: [
        ["LIKE", "Recherche d'un motif textuel (sensible à la casse)."],
        ["ILIKE", "Recherche de motif insensible à la casse (PostgreSQL)."],
        ["%", "Zéro ou plusieurs caractères."],
        ["_", "Exactement un caractère."],
        ["DISTINCT", "Un exemplaire de chaque ligne sélectionnée distincte."],
      ],
      ex: [
        { t: "sql", q: "Produits dont le nom contient « book » : `name`.", sol: "SELECT name FROM campus.products WHERE name LIKE '%book%';", need: ["LIKE"] },
        { t: "qcm", q: "Le motif `'M_use'` correspond à :", o: ["Mouse", "Muse", "Mouuse", "M_use uniquement"], a: 0, why: "_ remplace exactement un caractère : M + o + use." },
        { t: "sql", q: "Produits dont le nom commence par « s », sans tenir compte de la casse (utilise `ILIKE`) : `name`.", sol: "SELECT name FROM campus.products WHERE name ILIKE 's%';", need: ["ILIKE"] },
        { t: "qcm", q: "Dans `SELECT DISTINCT category_id, active …`, sur quoi porte l'unicité ?", o: ["Sur la paire (category_id, active)", "Sur category_id seulement", "Sur active seulement", "Sur toute la table"], a: 0 },
      ],
    },
    {
      id: "j1-null",
      title: "NULL et la logique à trois valeurs",
      learn: [
        "`NULL` marque une information **absente ou inconnue** : ce n'est ni zéro, ni une chaîne vide. La catégorie racine All n'a pas de parent : son `parent_id` vaut NULL.",
        "SQL a un troisième résultat de vérité : **inconnu**. Une comparaison ordinaire avec NULL donne inconnu, et `WHERE` ne garde que vrai. Donc `parent_id = NULL` ne trouve rien : on écrit `IS NULL` ou `IS NOT NULL`.",
        "Table à connaître : `NULL = NULL` → inconnu ; `FALSE AND NULL` → false ; `TRUE OR NULL` → true. `IS DISTINCT FROM` compare en traitant NULL comme une valeur comparable.",
      ],
      code: `SELECT category_id, name
FROM campus.categories
WHERE parent_id IS NULL;`,
      retiens: "Jamais `= NULL`. Toujours `IS NULL`. Et ne remplace NULL par 0 que si 0 a ce sens métier.",
      keys: [
        ["NULL", "Aucune valeur connue n'est présente."],
        ["IS NULL", "Tester l'absence de valeur."],
        ["IS NOT NULL", "Tester la présence d'une valeur."],
        ["Inconnu", "Résultat d'une comparaison avec NULL ; WHERE l'écarte."],
        ["IS DISTINCT FROM", "Comparaison qui traite NULL comme comparable."],
      ],
      ex: [
        { t: "qcm", q: "Combien de lignes ?", code: "SELECT name FROM campus.categories\nWHERE parent_id = NULL;", o: ["0", "1 (All)", "5", "Une erreur"], a: 0, why: "parent_id = NULL vaut inconnu pour toutes les lignes ; WHERE n'en garde aucune." },
        { t: "qcm", q: "Que vaut `FALSE AND NULL` ?", o: ["false", "inconnu (NULL)", "true", "Une erreur"], a: 0, why: "Un côté faux suffit à rendre AND faux, quelle que soit la valeur inconnue." },
        { t: "qcm", q: "Que vaut `TRUE OR NULL` ?", o: ["true", "inconnu (NULL)", "false", "Une erreur"], a: 0 },
        { t: "sql", q: "Catégories qui ont un parent : `name`, triées par `category_id`.", sol: "SELECT name FROM campus.categories WHERE parent_id IS NOT NULL ORDER BY category_id;", need: ["IS NOT NULL"] },
        { t: "fill", q: "Pour tester une valeur manquante : `WHERE parent_id ___`", a: ["IS NULL"] },
      ],
    },
    {
      id: "j1-case",
      title: "COALESCE et CASE",
      learn: [
        "`COALESCE(a, b)` renvoie le premier argument non NULL. Il sert à un libellé d'affichage ou à une valeur par défaut choisie délibérément. Il ne modifie pas la donnée enregistrée, et 0 n'est qu'une convention d'affichage.",
        "`CASE WHEN … THEN … ELSE … END` choisit une valeur selon des conditions, testées **dans l'ordre** : la première vraie l'emporte. `ELSE` donne la valeur de repli. CASE crée une valeur dans SELECT ; ce n'est ni une boucle ni une mise à jour.",
      ],
      code: `SELECT name,
  CASE WHEN unit_price >= 30 THEN 'premium' ELSE 'standard' END AS price_band
FROM campus.products
ORDER BY product_id;`,
      retiens: "Dans un CASE, place les conditions les plus strictes en premier.",
      keys: [
        ["COALESCE(a, b)", "a s'il est présent, sinon b."],
        ["CASE", "Sélection conditionnelle d'une valeur."],
        ["WHEN … THEN", "Condition et valeur choisie."],
        ["ELSE", "Valeur de repli si aucune condition n'est vraie."],
        ["END", "Ferme l'expression CASE."],
      ],
      ex: [
        { t: "sql", q: "Pour chaque catégorie : `name` et `COALESCE(parent_id, 0)` nommé `parent_display`, triées par `category_id`.", sol: "SELECT name, COALESCE(parent_id, 0) AS parent_display FROM campus.categories ORDER BY category_id;", need: ["COALESCE"] },
        { t: "sql", q: "Affiche `name` et `stock_level` : 'faible' si stock < 25, 'moyen' si stock < 60, sinon 'élevé'. Trie par `product_id`.", sol: "SELECT name, CASE WHEN stock < 25 THEN 'faible' WHEN stock < 60 THEN 'moyen' ELSE 'élevé' END AS stock_level FROM campus.products ORDER BY product_id;", need: ["CASE"] },
        { t: "qcm", q: "Pour Keyboard (50 €), que renvoie ce CASE ?", code: "CASE WHEN unit_price >= 20 THEN 'A'\n     WHEN unit_price >= 40 THEN 'B'\n     ELSE 'C' END", o: ["'A' : la première condition vraie l'emporte", "'B'", "'C'", "'A' et 'B'"], a: 0 },
        { t: "qcm", q: "`COALESCE(parent_id, 0)` modifie-t-il `parent_id` dans la table ?", o: ["Non, seulement la valeur affichée", "Oui", "Oui après COMMIT", "Seulement pour la racine"], a: 0 },
      ],
    },
    {
      id: "j1-dates",
      title: "Fonctions, dates et intervalles semi-ouverts",
      learn: [
        "Une **fonction** prend des arguments et renvoie une valeur : `trim` retire les espaces autour du texte, `lower` passe en minuscules. Les fonctions imbriquées s'évaluent de l'intérieur : `lower(trim(' SQL '))` retire les espaces, puis met en minuscules.",
        "`date` identifie un jour ; `timestamp without time zone` une date et une heure locales ; `timestamptz` un **instant**, affiché selon le fuseau de la session. Le cours travaille en UTC (`+00`) pour qu'un filtre ait le même sens partout.",
        "Pour un mois, utilise un **intervalle semi-ouvert** : inclure le début (`>= 1er janvier`), exclure le début suivant (`< 1er février`). Pas besoin de deviner le dernier instant du 31, et les mois s'enchaînent sans trou.",
      ],
      code: `SELECT order_id, ordered_at
FROM campus.orders
WHERE ordered_at >= TIMESTAMPTZ '2026-01-01+00'
  AND ordered_at <  TIMESTAMPTZ '2026-02-01+00'
ORDER BY ordered_at, order_id;`,
      retiens: "Une période = `>= début` ET `< début de la période suivante`.",
      keys: [
        ["trim(text)", "Retire les espaces autour du texte."],
        ["lower(text)", "Texte en minuscules."],
        ["DATE '…'", "Littéral typé de date du calendrier."],
        ["TIMESTAMPTZ '…'", "Instant typé avec un décalage horaire."],
        ["Semi-ouvert", "Début inclus, fin exclue."],
      ],
      ex: [
        { t: "sql", q: "Commandes de février 2026 avec un intervalle semi-ouvert : `order_id`, triées par `order_id`.", sol: "SELECT order_id FROM campus.orders WHERE ordered_at >= TIMESTAMPTZ '2026-02-01+00' AND ordered_at < TIMESTAMPTZ '2026-03-01+00' ORDER BY order_id;", need: ["<"], ban: ["BETWEEN"] },
        { t: "qcm", q: "Que renvoie cette requête ?", code: "SELECT lower(trim('  SQL  '));", o: ["sql", "SQL", "'  sql  '", "Une erreur"], a: 0 },
        { t: "qcm", q: "Pourquoi préférer `< '2026-02-01'` à `<= '2026-01-31 23:59:59'` ?", o: ["On n'a pas à deviner le dernier instant possible du mois", "C'est plus court à écrire", "<= est interdit sur les dates", "Pour trier plus vite"], a: 0 },
        { t: "qcm", q: "Quel type identifie un instant précis, affiché selon le fuseau de la session ?", o: ["timestamptz", "date", "timestamp without time zone", "text"], a: 0 },
      ],
    },
    {
      id: "j1-ddl",
      title: "CREATE TABLE et contraintes",
      learn: [
        "Avant de créer une table, dis ce que représente **une ligne** : un seul type de fait. Mélanger des faits sans rapport crée des lignes confuses et des doublons. Les instructions qui définissent les objets forment le **DDL** (langage de définition des données).",
        "Une **clé candidate** identifie une ligne de façon unique et minimale ; la **clé primaire** est celle qu'on choisit. Une **clé étrangère** exige que la valeur référence une clé parente existante. Une **clé composée** utilise plusieurs colonnes, comme (order_id, product_id).",
        "`NOT NULL` exige une valeur. `CHECK` exige qu'une condition **ne soit pas fausse** : avec NULL elle vaut inconnu, donc NULL passe ! Combine `NOT NULL` et `CHECK` quand la valeur doit exister et respecter un intervalle. `UNIQUE` interdit les répétitions (par défaut, plusieurs NULL sont permis).",
      ],
      code: `CREATE TABLE work.product_proposal (
  product_id integer PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0),
  stock integer NOT NULL CHECK (stock >= 0)
);
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'work' AND table_name = 'product_proposal'
ORDER BY ordinal_position;`,
      retiens: "CHECK seul laisse passer NULL. Une valeur obligatoire et bornée = NOT NULL + CHECK.",
      keys: [
        ["DDL", "Instructions qui définissent les objets de la base."],
        ["PRIMARY KEY", "Identifiant unique et non NULL de chaque ligne."],
        ["FOREIGN KEY / REFERENCES", "La valeur doit exister dans la table parente."],
        ["UNIQUE", "Pas de valeur répétée (NULL distincts par défaut)."],
        ["NOT NULL", "Une valeur doit être présente."],
        ["CHECK (…)", "La condition ne doit pas être fausse."],
        ["Clé composée", "Plusieurs colonnes forment ensemble l'identifiant."],
      ],
      ex: [
        { t: "qcm", q: "Avec seulement `CHECK (unit_price > 0)`, une ligne où `unit_price` est NULL est-elle acceptée ?", o: ["Oui : NULL > 0 vaut inconnu, pas faux", "Non", "Oui, et le prix devient 0", "Erreur de syntaxe"], a: 0 },
        { t: "qcm", q: "Quelle contrainte empêche deux produits d'avoir le même code `sku` ?", o: ["`UNIQUE (sku)`", "`CHECK (sku)`", "`NOT NULL`", "`FOREIGN KEY`"], a: 0 },
        { t: "qcm", q: "Pourquoi un nom de personne est-il une mauvaise clé primaire ?", o: ["Deux personnes peuvent le partager et il peut changer", "Le texte est interdit dans une clé", "Il est trop long", "Il ne peut pas être NULL"], a: 0 },
        {
          t: "sql",
          q: "Crée `work.category_proposal` : `category_id` integer clé primaire, `name` text obligatoire et unique, `parent_id` integer (facultatif).",
          sol: "CREATE TABLE work.category_proposal (\n  category_id integer PRIMARY KEY,\n  name text NOT NULL UNIQUE,\n  parent_id integer\n);",
          verify: "SELECT c.column_name, c.data_type, c.is_nullable, (SELECT string_agg(tc.constraint_type, ',' ORDER BY tc.constraint_type) FROM information_schema.key_column_usage k JOIN information_schema.table_constraints tc ON tc.constraint_schema = k.constraint_schema AND tc.constraint_name = k.constraint_name WHERE k.table_schema = 'work' AND k.table_name = 'category_proposal' AND k.column_name = c.column_name) AS keys FROM information_schema.columns c WHERE c.table_schema = 'work' AND c.table_name = 'category_proposal' ORDER BY c.ordinal_position;",
          ordered: true,
          need: ["CREATE TABLE"],
          why: "La correction compare les colonnes, leurs types, l'obligation et les contraintes de clé.",
        },
      ],
    },
    {
      id: "j1-dml",
      title: "INSERT, UPDATE et RETURNING",
      learn: [
        "`INSERT INTO table (colonnes) VALUES (…)` ajoute des lignes. Préciser la liste des colonnes rend la correspondance visible. `RETURNING` renvoie les lignes qui viennent de changer, pour vérifier ce qui a été enregistré.",
        "Une modification refusée indique la règle qui a échoué : réinsérer un `product_id` existant viole la clé primaire (erreur d'unicité), un `name` NULL viole `NOT NULL`, un stock de -1 viole le `CHECK`. On corrige les données, on ne supprime pas la règle.",
        "`UPDATE table SET colonne = valeur WHERE …` modifie les lignes trouvées. **Sans WHERE, toutes les lignes changent** : vérifie d'abord la condition avec un SELECT.",
      ],
      code: `CREATE TABLE work.product_proposal (
  product_id integer PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0),
  stock integer NOT NULL CHECK (stock >= 0)
);
INSERT INTO work.product_proposal (product_id, sku, name, unit_price, stock)
VALUES (900, 'P-900', 'Desk Pad', 12.50, 8)
RETURNING product_id, name, unit_price, stock;`,
      retiens: "UPDATE ou DELETE : écris d'abord le SELECT avec le même WHERE.",
      keys: [
        ["INSERT INTO", "Choisir la table cible."],
        ["VALUES", "Fournir une ou plusieurs lignes."],
        ["RETURNING", "Afficher les lignes qui viennent de changer."],
        ["UPDATE … SET", "Attribuer une nouvelle valeur aux lignes ciblées."],
        ["23505", "SQLSTATE d'une violation d'unicité."],
      ],
      ex: [
        { t: "qcm", q: "Insérer de nouveau `product_id` 900 (déjà présent) provoque :", o: ["Une erreur de contrainte d'unicité (clé primaire)", "Une erreur CHECK", "Un remplacement silencieux de la ligne", "Une deuxième ligne 900"], a: 0 },
        { t: "qcm", q: "Que fait cette instruction ?", code: "UPDATE campus.products SET stock = 0;", o: ["Elle met le stock de TOUS les produits à 0", "Rien, il manque WHERE", "Une erreur", "Elle met à 0 le premier produit"], a: 0 },
        { t: "sql", q: "Augmente de 5 le stock du produit 3 (Notebook) et renvoie `product_id` et `stock` avec `RETURNING`.", sol: "UPDATE campus.products SET stock = stock + 5 WHERE product_id = 3 RETURNING product_id, stock;", need: ["RETURNING"] },
        { t: "sql", q: "Ajoute dans `campus.categories` la catégorie 6 « Books », dont le parent est 3 (Lifestyle).", sol: "INSERT INTO campus.categories (category_id, name, parent_id) VALUES (6, 'Books', 3);", verify: "SELECT category_id, name, parent_id FROM campus.categories ORDER BY category_id;", ordered: true },
      ],
    },
    {
      id: "j1-tx",
      title: "Transactions, DELETE, TRUNCATE, DROP, ALTER",
      learn: [
        "Une **transaction** regroupe du travail en une unité : `BEGIN` la démarre, `COMMIT` la rend permanente, `ROLLBACK` annule ses modifications. Dans ta transaction, un SELECT voit déjà tes propres changements. C'est la façon sûre de s'exercer : modifier, examiner, annuler.",
        "`DELETE … WHERE` supprime les lignes ciblées. `TRUNCATE` vide toute la table. `DROP TABLE` supprime la table elle-même (définition et données). Ce ne sont pas des synonymes.",
        "`ALTER TABLE` fait évoluer une définition : `ADD COLUMN`, `DROP COLUMN`. Une **migration** est une modification de schéma contrôlée et versionnée.",
      ],
      code: `BEGIN;
UPDATE campus.products SET unit_price = unit_price * 1.05
WHERE product_id = 1
RETURNING unit_price;
ROLLBACK;
SELECT unit_price FROM campus.products WHERE product_id = 1;`,
      retiens: "Pour t'exercer sans risque : BEGIN, modification avec RETURNING, ROLLBACK.",
      keys: [
        ["BEGIN", "Démarrer une transaction."],
        ["COMMIT", "Conserver les modifications."],
        ["ROLLBACK", "Annuler les modifications de la transaction."],
        ["DELETE … WHERE", "Supprimer les lignes ciblées."],
        ["TRUNCATE", "Vider toute la table (la définition reste)."],
        ["DROP TABLE", "Supprimer la table et ses données."],
        ["ALTER TABLE", "Modifier une définition (ADD/DROP COLUMN)."],
      ],
      ex: [
        { t: "qcm", q: "Que renvoie le dernier SELECT ?", code: "BEGIN;\nDELETE FROM campus.payments;\nROLLBACK;\nSELECT count(*) FROM campus.payments;", o: ["9", "0", "Une erreur", "1"], a: 0, why: "ROLLBACK annule la suppression : les 9 paiements sont toujours là." },
        { t: "qcm", q: "Quelle commande supprime la table ET sa définition ?", o: ["DROP TABLE", "TRUNCATE", "DELETE", "ALTER TABLE"], a: 0 },
        { t: "fill", q: "Pour annuler toutes les modifications de la transaction en cours : ___", a: ["ROLLBACK"] },
        { t: "sql", q: "Ajoute une colonne `description` de type `text` à `campus.products`.", sol: "ALTER TABLE campus.products ADD COLUMN description text;", verify: "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'campus' AND table_name = 'products' ORDER BY ordinal_position;", ordered: true, need: ["ALTER TABLE"] },
      ],
    },
    {
      id: "j1-normal",
      title: "Normalisation et dépendances",
      learn: [
        "Si chaque ligne d'étudiant répète le nom du département, renommer Computing oblige à modifier toutes les copies ; en oublier une crée des faits contradictoires. C'est une **anomalie de mise à jour**. On stocke le fait une fois, avec un identifiant, et on le référence.",
        "Une **dépendance fonctionnelle** X → Y : quand des lignes ont le même X, elles ont le même Y. `product_id → product_name`, `order_id → student_id`, mais il faut `(order_id, product_id) → quantity`. X est le **déterminant**.",
        "Formes normales : **1NF** chaque champ contient une valeur de son domaine (pas de liste) ; **2NF** aucun fait non clé ne dépend d'une partie seulement d'une clé composée ; **3NF** aucun fait non clé ne dépend d'un autre fait non clé ; **BCNF** tout déterminant non trivial est une superclé.",
      ],
      retiens: "Explique la dépendance et l'anomalie : mémoriser les numéros des formes ne suffit pas.",
      keys: [
        ["Anomalie de mise à jour", "Un seul changement réel exige plusieurs modifications coordonnées."],
        ["X → Y", "Dépendance fonctionnelle : X détermine Y."],
        ["Déterminant", "Membre gauche d'une dépendance fonctionnelle."],
        ["1NF", "Une valeur par champ, pas de liste répétée."],
        ["2NF", "Pas de dépendance envers une partie de la clé composée."],
        ["3NF", "Pas de dépendance via un attribut non clé."],
        ["BCNF", "Tout déterminant non trivial est une superclé."],
      ],
      ex: [
        { t: "qcm", q: "Une table `order_lines(order_id, product_id, student_email, product_name, quantity)`. Où doit aller `product_name` ?", o: ["Dans products, car product_id le détermine", "Il reste dans order_lines", "Dans students", "Dans payments"], a: 0, why: "Et student_email va dans students : la commande référence son étudiant." },
        { t: "qcm", q: "Quelle forme normale élimine les dépendances envers une partie seulement d'une clé composée ?", o: ["2NF", "1NF", "3NF", "BCNF"], a: 0 },
        { t: "qcm", q: "`students` stocke `department_id` et `department_name`, et `department_id → department_name`. Quel problème ?", o: ["Un fait non clé dépend d'un autre fait non clé : 3NF n'est pas respectée", "1NF n'est pas respectée", "Aucun problème", "2NF n'est pas respectée"], a: 0 },
        { t: "qcm", q: "Pourquoi `order_items` garde-t-il un `unit_price` alors que `products` en a un ?", o: ["Il enregistre le prix historique de la vente", "C'est une erreur de conception", "Pour accélérer les jointures", "Parce que products peut être vide"], a: 0 },
        { t: "fill", q: "Dans une dépendance fonctionnelle X → Y, X s'appelle le ___.", a: ["déterminant", "determinant"] },
      ],
    },
    {
      id: "j1-agg",
      title: "Agrégats : COUNT, SUM, AVG, MIN, MAX",
      learn: [
        "Une **fonction d'agrégation** résume plusieurs lignes en une valeur : `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Sans `GROUP BY`, la requête produit **une seule ligne** de synthèse pour toute l'entrée filtrée.",
        "`COUNT(*)` compte les lignes ; `COUNT(colonne)` ne compte que les valeurs non NULL ; `COUNT(DISTINCT colonne)` les valeurs différentes. La plupart des agrégats **ignorent NULL**. Sur une entrée vide, `COUNT` renvoie 0 mais `SUM` renvoie NULL.",
      ],
      code: `SELECT COUNT(*) AS categories, COUNT(parent_id) AS known_parents
FROM campus.categories;`,
      retiens: "Prévois la réponse sur un petit cas avant d'exécuter l'agrégat.",
      keys: [
        ["COUNT(*)", "Compter chaque ligne."],
        ["COUNT(col)", "Compter les valeurs non NULL."],
        ["COUNT(DISTINCT col)", "Compter les valeurs non NULL différentes."],
        ["SUM / AVG", "Somme / moyenne des valeurs présentes."],
        ["MIN / MAX", "Plus petite / plus grande valeur présente."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : nombre de produits actifs (`active_products`) et leur stock total (`active_units`).", sol: "SELECT COUNT(*) AS active_products, SUM(stock) AS active_units FROM campus.products WHERE active;", why: "USB Hub est inactif : 5 produits, 20 + 30 + 50 + 40 + 100 = 240 unités. Pas de GROUP BY : on veut une synthèse globale." },
        { t: "qcm", q: "Que renvoie cette requête (aucun produit ne coûte plus de 1000 €) ?", code: "SELECT SUM(stock) FROM campus.products\nWHERE unit_price > 1000;", o: ["NULL", "0", "Aucune ligne", "Une erreur"], a: 0, why: "Une ligne de synthèse est toujours renvoyée ; SUM sur une entrée vide vaut NULL (COUNT vaudrait 0)." },
        { t: "qcm", q: "Sur `campus.categories`, `COUNT(*)` vaut 5 et `COUNT(parent_id)` vaut 4. Pourquoi ?", o: ["COUNT(colonne) ignore les NULL : la racine n'a pas de parent", "Une catégorie est en double", "COUNT(*) compte les colonnes", "Une erreur de données"], a: 0 },
        { t: "sql", q: "Prix moyen (`avg_price`), minimum (`min_price`) et maximum (`max_price`) de tous les produits.", sol: "SELECT AVG(unit_price) AS avg_price, MIN(unit_price) AS min_price, MAX(unit_price) AS max_price FROM campus.products;" },
      ],
    },
    {
      id: "j1-groupby",
      title: "GROUP BY, WHERE et HAVING",
      learn: [
        "`GROUP BY` répartit les lignes en groupes de mêmes valeurs ; les agrégats se calculent dans chaque groupe. La **granularité** change : une ligne par catégorie au lieu d'une par produit. Toute colonne sélectionnée non agrégée doit être une clé de regroupement.",
        "`WHERE` filtre les **lignes** avant le regroupement ; `HAVING` filtre les **groupes** après le calcul. Ici, WHERE garde les produits actifs, puis HAVING garde les catégories d'au moins deux produits actifs.",
        "`VALUES (1, 'Pen'), (2, 'Book')` construit de petites lignes littérales pour tester une idée sans créer de table (colonnes `column1`, `column2`).",
      ],
      code: `SELECT category_id, COUNT(*) AS active_products
FROM campus.products
WHERE active
GROUP BY category_id
HAVING COUNT(*) >= 2
ORDER BY category_id;`,
      retiens: "WHERE = lignes avant le regroupement. HAVING = groupes après le calcul.",
      keys: [
        ["GROUP BY", "Définir les groupes à résumer."],
        ["Clé de regroupement", "Valeurs qui identifient un groupe."],
        ["HAVING", "Filtrer les groupes après le calcul des agrégats."],
        ["VALUES", "Construire des lignes à partir de valeurs littérales."],
      ],
      ex: [
        { t: "sql", q: "Par catégorie : `category_id`, nombre de produits (`products`) et stock total (`units`), triés par `category_id`.", sol: "SELECT category_id, COUNT(*) AS products, SUM(stock) AS units FROM campus.products GROUP BY category_id ORDER BY category_id;", need: ["GROUP BY"] },
        { t: "qcm", q: "Pour « garder les catégories d'au moins 2 produits », WHERE ou HAVING ?", o: ["HAVING : la condition porte sur le groupe", "WHERE", "Les deux fonctionnent", "ORDER BY"], a: 0 },
        { t: "fill", q: "Pour filtrer des groupes après le calcul de `COUNT(*)`, on utilise ___", a: ["HAVING"] },
        { t: "qcm", q: "Que se passe-t-il ?", code: "SELECT category_id, name, COUNT(*)\nFROM campus.products\nGROUP BY category_id;", o: ["Erreur : name n'est ni regroupé ni agrégé", "Un nom au hasard par catégorie", "Tous les noms concaténés", "Une ligne par produit"], a: 0 },
      ],
    },
  ],
});
