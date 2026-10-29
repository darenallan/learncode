/* Jour 5 · Mesurer et améliorer (Day_05_Student_Lessons.pdf). Format : voir jour1.js.
   bench: true → la brique utilise work.bench_orders (300 000 commandes, créé à la première exécution). */
COURS.day("sql-avance", {
  id: "j5",
  label: "Jour 5",
  title: "Mesurer et améliorer",
  summary: "Plans d'exécution, mesures équitables, index B-tree, multicolonnes, d'expression et partiels, maintenance, pagination, partitionnement et requêtes préparées.",
  bricks: [
    {
      id: "j5-planner",
      title: "Performance, planificateur et sélectivité",
      learn: [
        "La **performance**, c'est le temps et les ressources nécessaires pour produire un résultat **correct**. Une requête plus rapide qui renvoie les mauvaises commandes n'est jamais une amélioration. Précise d'abord la question, les lignes attendues et le temps de réponse acceptable.",
        "Le **planificateur** choisit comment exécuter le SQL ; son **plan d'exécution** est un arbre d'opérations (parcours, jointures, tris). Il s'appuie sur des **statistiques**, des résumés stockés du contenu des tables.",
        "La **cardinalité** est un nombre de lignes ; la **sélectivité**, la proportion de lignes qui satisfont une condition. Dans le banc d'essai, `student_id = 42` : 30 lignes sur 300 000, soit 0,01 % ; `status = 'pending'` : 10 % ; `status = 'paid'` : 90 %.",
      ],
      retiens: "D'abord un résultat juste, ensuite un résultat rapide.",
      keys: [
        ["Performance", "Temps et ressources pour produire un résultat correct."],
        ["Planificateur", "Composant qui choisit comment exécuter le SQL."],
        ["Plan d'exécution", "Arbre d'opérations choisi par le planificateur."],
        ["Statistiques", "Résumés du contenu des tables utilisés pour prévoir."],
        ["Sélectivité", "Proportion de lignes qui satisfont une condition."],
      ],
      ex: [
        { t: "qcm", q: "`student_id = 42` : 30 lignes sur 300 000. Quelle sélectivité ?", o: ["0,01 %", "1 %", "0,1 %", "30 %"], a: 0 },
        { t: "qcm", q: "`status = 'paid'` : 270 000 lignes sur 300 000. Quelle sélectivité ?", o: ["90 %", "10 %", "27 %", "0,9 %"], a: 0 },
        { t: "qcm", q: "Une requête 10 fois plus rapide qui renvoie les mauvaises commandes est :", o: ["Un échec", "Une amélioration", "Acceptable", "Normale en production"], a: 0 },
        { t: "fill", q: "Le composant de PostgreSQL qui choisit comment exécuter le SQL est le ___", a: ["planificateur", "planificateur de requêtes", "planner"] },
      ],
    },
    {
      id: "j5-explain",
      title: "EXPLAIN, ANALYZE et BUFFERS",
      bench: true,
      learn: [
        "`EXPLAIN` affiche le plan **proposé** sans exécuter la requête. Lis-le **de bas en haut** : par exemple Seq Scan (lire la table) + Filter, puis Sort, puis Limit. `rows` prévoit les lignes **émises** par une opération. Le **coût** est un score de comparaison (coût initial..coût total), **pas des millisecondes**.",
        "`EXPLAIN (ANALYZE, BUFFERS)` **exécute** réellement la requête et ajoute les lignes réelles (`actual rows`), le nombre d'exécutions (`loops`) et les temps mesurés. `BUFFERS` montre l'activité des pages : `shared hit` = page déjà en mémoire PostgreSQL, `shared read` = page chargée en mémoire.",
        "Compare l'**estimation** et le **réel** pour la même opération : estimé 3 000, réel 30 000 → sous-estimation d'un facteur 10. Ça ne prouve pas à lui seul qu'un index aidera : regarde aussi les pages et les temps.",
      ],
      code: `EXPLAIN (ANALYZE, BUFFERS)
SELECT order_id FROM work.bench_orders
WHERE student_id = 42
ORDER BY order_id
LIMIT 3;`,
      retiens: "Lis ensemble les estimations, les lignes réelles et le travail mesuré.",
      keys: [
        ["EXPLAIN", "Affiche le plan sans exécuter."],
        ["ANALYZE (option)", "Exécute et mesure."],
        ["BUFFERS", "Activité des pages de données."],
        ["shared hit", "Page déjà en mémoire partagée."],
        ["shared read", "Page chargée en mémoire partagée."],
        ["cost", "Score du planificateur, pas un temps."],
        ["loops", "Nombre d'exécutions de l'opération."],
      ],
      ex: [
        { t: "qcm", q: "Dans un plan, `cost=8150.00` signifie :", o: ["Un score de comparaison du planificateur, pas des millisecondes", "8150 ms", "8150 lignes", "8150 pages"], a: 0 },
        { t: "qcm", q: "`EXPLAIN` sans ANALYZE exécute-t-il la requête ?", o: ["Non, il montre seulement le plan proposé", "Oui", "Oui, sans renvoyer de lignes", "Seulement pour les SELECT"], a: 0 },
        { t: "qcm", q: "Pour un parcours : estimation 3 000 lignes, réel 30 000 (loops = 1). Que conclure ?", o: ["Sous-estimation d'un facteur 10", "Surestimation d'un facteur 10", "Un facteur 100", "Aucune erreur"], a: 0 },
        { t: "qcm", q: "`shared hit` contre `shared read` :", o: ["hit = page déjà en mémoire PostgreSQL ; read = page chargée en mémoire", "hit = erreur", "read = écriture disque", "Identiques"], a: 0 },
        { t: "sql", q: "Affiche le plan réellement exécuté, avec les tampons, de : `SELECT count(*) FROM work.bench_orders WHERE status = 'pending';`", sol: "EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM work.bench_orders WHERE status = 'pending';", check: "run", need: ["EXPLAIN", "ANALYZE", "BUFFERS"], why: "Repère le parcours, ses lignes réelles (30 000) et les pages lues." },
      ],
    },
    {
      id: "j5-btree",
      title: "Index B-tree et mesures équitables",
      bench: true,
      learn: [
        "Un **index** est une structure physique séparée de la table, avec des valeurs de recherche et des références aux lignes. Un **B-tree** garde ces valeurs triées dans des pages reliées : pour l'étudiant 42, PostgreSQL navigue jusqu'à 42 au lieu de vérifier chaque ligne.",
        "`CREATE INDEX nom ON table (colonne)` crée un index candidat. Il ne **force** rien : le planificateur choisit (Index Scan, Bitmap Scan…). Un index coûte du **stockage** et du travail à **chaque écriture** concernée. Il doit préserver exactement les mêmes lignes (41, 10041, 20041).",
        "Mesure équitable : mêmes données, même résultat, mêmes réglages ; une exécution de préchauffage (cache chaud), puis plusieurs mesures **avant et après un seul changement**, résumées par la **médiane**. 24, 25, 25, 26, 80 ms → médiane 25 : la valeur aberrante ne domine pas.",
      ],
      code: `CREATE INDEX bench_student_idx ON work.bench_orders (student_id);
EXPLAIN (ANALYZE, BUFFERS)
SELECT order_id, total FROM work.bench_orders
WHERE student_id = 42
ORDER BY order_id
LIMIT 3;`,
      retiens: "Un seul changement à la fois, des résultats identiques, et la médiane de mesures répétées.",
      keys: [
        ["Index", "Structure séparée qui localise des lignes candidates."],
        ["B-tree", "Index à clés triées, parcouru par niveaux de pages."],
        ["CREATE INDEX", "Construit un index nommé sur une table."],
        ["Cache chaud", "Les pages utiles sont déjà en mémoire."],
        ["Médiane", "Valeur centrale après tri des mesures."],
      ],
      ex: [
        { t: "sql", q: "Crée un index nommé `bench_campus_idx` sur la colonne `campus_id` de `work.bench_orders`.", sol: "CREATE INDEX bench_campus_idx ON work.bench_orders (campus_id);", verify: "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'work' AND tablename = 'bench_orders' AND indexname <> 'bench_orders_pkey' ORDER BY indexname;", ordered: true, need: ["CREATE INDEX"] },
        { t: "qcm", q: "Créer un index force-t-il PostgreSQL à l'utiliser ?", o: ["Non, le planificateur choisit : il faut mesurer", "Oui", "Oui pour les SELECT", "Seulement après COMMIT"], a: 0 },
        { t: "qcm", q: "Temps mesurés : 24, 25, 25, 26, 80 ms. Quelle médiane ?", o: ["25", "36", "80", "24"], a: 0 },
        { t: "qcm", q: "Quels sont les coûts d'un index ?", o: ["Du stockage et du travail à chaque écriture concernée", "Aucun", "Il ralentit tous les SELECT", "Il réécrit la table triée"], a: 0 },
      ],
    },
    {
      id: "j5-multicol",
      title: "Index multicolonnes et skip scan",
      bench: true,
      learn: [
        "Un **index multicolonne** a plusieurs clés, ordonnées de gauche à droite. Pour `student_id = 42 AND order_id >= 20000 ORDER BY order_id`, l'index `(student_id, order_id)` fixe l'étudiant par **égalité**, puis lit une **plage** contiguë d'`order_id`, déjà dans l'ordre demandé.",
        "Règle de conception : **égalité avant plage**. Inverser les colonnes crée une autre structure triée et peut obliger à chercher dans une zone bien plus large.",
        "Le **skip scan** de PostgreSQL 18 permet parfois d'utiliser l'index sans condition sur la première colonne, par recherches répétées parmi ses valeurs ; c'est surtout utile quand elle a **peu de valeurs distinctes**. Il ne rend pas l'ordre des colonnes indifférent et ne garantit pas le choix de l'index.",
      ],
      code: `CREATE INDEX bench_student_order_idx ON work.bench_orders (student_id, order_id);
SELECT order_id, total FROM work.bench_orders
WHERE student_id = 42 AND order_id >= 20000
ORDER BY order_id
LIMIT 3;`,
      retiens: "Égalité d'abord, plage ensuite : l'index sert aussi le ORDER BY.",
      keys: [
        ["Index multicolonne", "Plusieurs colonnes de clé, ordonnées de gauche à droite."],
        ["Égalité avant plage", "La colonne fixée par = vient avant celle filtrée par une plage."],
        ["Skip scan", "PostgreSQL 18 : recherches répétées parmi les valeurs de tête."],
      ],
      ex: [
        { t: "qcm", q: "Écran : `WHERE campus_id = 2 AND order_id >= 20000 ORDER BY order_id`. Quelle clé de départ ?", o: ["(campus_id, order_id)", "(order_id, campus_id)", "(order_id)", "(total)"], a: 0 },
        { t: "qcm", q: "Règle de conception d'une clé multicolonne :", o: ["L'égalité avant la plage", "La plage avant l'égalité", "Les colonnes par ordre alphabétique", "La colonne la plus large d'abord"], a: 0 },
        { t: "qcm", q: "Le skip scan de PostgreSQL 18 :", o: ["Permet parfois d'utiliser l'index sans condition sur la 1re colonne, surtout si elle a peu de valeurs", "Rend l'ordre des colonnes indifférent", "Garantit l'usage de l'index", "Supprime les index inutiles"], a: 0 },
        { t: "sql", q: "Crée l'index `bench_student_order_idx` sur `(student_id, order_id)`, puis renvoie les 3 premières commandes de l'étudiant 42 à partir de l'`order_id` 20000 : `order_id`, `total`.", sol: "CREATE INDEX bench_student_order_idx ON work.bench_orders (student_id, order_id);\nSELECT order_id, total FROM work.bench_orders WHERE student_id = 42 AND order_id >= 20000 ORDER BY order_id LIMIT 3;", need: ["CREATE INDEX"], why: "20041, 30041 et 40041, chacune à 41.00." },
      ],
    },
    {
      id: "j5-sargable",
      title: "Conditions sargables et index d'expression",
      bench: true,
      learn: [
        "Une condition est **sargable** quand un index peut l'utiliser pour restreindre directement la recherche. Appliquer une fonction à **chaque valeur** de la colonne (`CAST(ordered_at AS date) = …`) peut empêcher un index ordinaire sur `ordered_at` de servir.",
        "Réécris le même jour UTC en **plage semi-ouverte** : `ordered_at >= '2025-01-02 00:00+00' AND ordered_at < '2025-01-03 00:00+00'`. La colonne reste nue à gauche, et on ne devine pas le dernier instant du jour (1 440 commandes, une par minute).",
        "Si la question exige une valeur calculée, un **index d'expression** stocke ce calcul : `CREATE INDEX … ON campus.students (lower(email))` sert `WHERE lower(email) = lower('ALICE@EXAMPLE.TEST')`. L'adresse stockée n'est pas modifiée. Sur 6 étudiants, PostgreSQL peut quand même préférer lire la table.",
      ],
      code: `SELECT count(*) AS day_orders
FROM work.bench_orders
WHERE ordered_at >= TIMESTAMPTZ '2025-01-02 00:00+00'
  AND ordered_at <  TIMESTAMPTZ '2025-01-03 00:00+00';`,
      retiens: "Laisse la colonne indexée seule d'un côté de la comparaison.",
      keys: [
        ["Sargable", "Condition qu'un index peut utiliser pour restreindre la recherche."],
        ["Plage semi-ouverte", "Borne inférieure incluse, borne supérieure exclue."],
        ["Index d'expression", "Index dont la clé est le résultat d'un calcul."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : réécris `WHERE CAST(ordered_at AS date) = DATE '2025-01-02'` en plage UTC semi-ouverte et compte les commandes (`day_orders`).", sol: "SELECT count(*) AS day_orders FROM work.bench_orders WHERE ordered_at >= TIMESTAMPTZ '2025-01-02 00:00+00' AND ordered_at < TIMESTAMPTZ '2025-01-03 00:00+00';", need: ["<"], ban: ["CAST", "::DATE"], why: "1 440 lignes : une commande par minute." },
        { t: "qcm", q: "Pourquoi `CAST(ordered_at AS date) = …` peut-il empêcher un index sur `ordered_at` de servir ?", o: ["La fonction appliquée à chaque valeur empêche de restreindre directement la recherche", "CAST est interdit dans WHERE", "Les dates ne s'indexent pas", "Il faut un index GIN"], a: 0 },
        { t: "sql", q: "Crée l'index d'expression `students_email_lower_idx` sur `lower(email)` de `campus.students`, puis cherche l'étudiant 'ALICE@EXAMPLE.TEST' sans tenir compte de la casse : `student_id`, `email`.", sol: "CREATE INDEX students_email_lower_idx ON campus.students (lower(email));\nSELECT student_id, email FROM campus.students WHERE lower(email) = lower('ALICE@EXAMPLE.TEST');", need: ["CREATE INDEX", "LOWER"] },
        { t: "fill", q: "Une condition qu'un index peut utiliser pour restreindre directement la recherche est dite ___", a: ["sargable"] },
      ],
    },
    {
      id: "j5-partial",
      title: "Index partiels, INCLUDE et parcours d'index seul",
      bench: true,
      learn: [
        "Un **index partiel** ne contient que les lignes qui satisfont son prédicat : `CREATE INDEX … (order_id) WHERE status = 'pending'` (30 000 entrées au lieu de 300 000). La requête doit **prouver** la condition pending : une requête sur les commandes paid ne peut pas s'appuyer sur cet index seul.",
        "Un **index couvrant** contient toutes les colonnes nécessaires à une requête. `INCLUDE (total)` transporte `total` dans l'index **sans** en faire une clé de recherche triée. Un **parcours d'index seul** (Index Only Scan) peut alors répondre depuis l'index.",
        "Il doit quand même vérifier la **visibilité** : la **carte de visibilité** indique si toutes les lignes d'une page du heap (le stockage principal de la table) sont visibles par tous. Sinon, PostgreSQL consulte la table : c'est ce que compte `Heap Fetches`.",
      ],
      code: `CREATE INDEX bench_pending_idx ON work.bench_orders (order_id)
WHERE status = 'pending';
SELECT order_id, status FROM work.bench_orders
WHERE status = 'pending' AND order_id >= 299950
ORDER BY order_id
LIMIT 3;`,
      keys: [
        ["Index partiel", "Ne contient que les lignes qui satisfont sa condition."],
        ["INCLUDE (…)", "Colonnes transportées, pas utilisées comme clé de tri."],
        ["Index couvrant", "Contient toutes les colonnes dont la requête a besoin."],
        ["Index Only Scan", "Répond depuis l'index, avec vérification de visibilité."],
        ["Heap", "Stockage principal des tables."],
        ["Heap Fetches", "Accès à la table pour vérifier la visibilité."],
      ],
      ex: [
        { t: "qcm", q: "Un index partiel `WHERE status = 'pending'` peut-il servir seul une requête sur `status = 'paid'` ?", o: ["Non, les lignes paid n'y sont pas", "Oui", "Oui après ANALYZE", "Seulement avec INCLUDE"], a: 0 },
        { t: "sql", q: "Crée l'index partiel `bench_pending_idx` sur `(order_id)` pour les commandes pending, puis renvoie les 3 premières commandes pending à partir de 299950 : `order_id`, `status`.", sol: "CREATE INDEX bench_pending_idx ON work.bench_orders (order_id) WHERE status = 'pending';\nSELECT order_id, status FROM work.bench_orders WHERE status = 'pending' AND order_id >= 299950 ORDER BY order_id LIMIT 3;", need: ["CREATE INDEX", "WHERE"] },
        { t: "qcm", q: "`INCLUDE (total)` dans un index :", o: ["Transporte total pour la sortie sans en faire une clé de recherche", "Trie aussi par total", "Rend total unique", "Compresse total"], a: 0 },
        { t: "qcm", q: "`Heap Fetches` supérieur à 0 dans un Index Only Scan signifie :", o: ["PostgreSQL a dû consulter la table pour vérifier la visibilité", "Une erreur", "L'index est corrompu", "Le cache est vide"], a: 0 },
      ],
    },
    {
      id: "j5-structures",
      title: "GIN, BRIN et algorithmes de jointure",
      learn: [
        "B-tree n'est pas la seule structure. **GIN** (index inversé) associe des valeurs composantes aux lignes qui les contiennent : utile pour trouver les documents contenant un mot ou les éléments d'une collection. **BRIN** résume des plages de pages : utile quand les valeurs suivent l'ordre physique, comme les dates d'un très grand journal chronologique. Aucun n'est « plus rapide » par principe.",
        "Un **algorithme de jointure** est la procédure physique qui trouve les correspondances. **Boucle imbriquée** : pour chaque ligne, rechercher dans l'autre entrée (éventuellement via un index). **Jointure par hachage** : construire une table de hachage d'un côté, la sonder avec l'autre. **Jointure par fusion** : parcourir deux entrées triées par la clé en alignant les égalités.",
        "La procédure ne doit **pas** changer la réponse logique, et un ordre interne de fusion ne remplace pas le ORDER BY demandé. Quand une jointure est lente, regarde d'abord la taille des entrées et les erreurs d'estimation.",
      ],
      keys: [
        ["GIN", "Index inversé : valeurs composantes → lignes."],
        ["BRIN", "Résumés de plages de pages ; données ordonnées physiquement."],
        ["Boucle imbriquée", "Pour chaque ligne, rechercher dans l'autre entrée."],
        ["Jointure par hachage", "Table de hachage d'une entrée, sondée par l'autre."],
        ["Jointure par fusion", "Deux entrées triées par la clé, alignées."],
      ],
      ex: [
        { t: "qcm", q: "Trouver les documents qui contiennent le mot « keyboard » :", o: ["GIN", "BRIN", "B-tree sur la date", "Aucun index possible"], a: 0 },
        { t: "qcm", q: "Filtrer des dates dans un immense journal où les lignes arrivent dans l'ordre chronologique :", o: ["BRIN", "GIN", "Un index partiel sur status", "Un index d'expression"], a: 0 },
        { t: "qcm", q: "Quel algorithme construit une table de recherche d'une entrée puis la sonde avec l'autre ?", o: ["La jointure par hachage", "La boucle imbriquée", "La jointure par fusion", "Le CROSS JOIN"], a: 0 },
        { t: "qcm", q: "Changer d'algorithme de jointure change-t-il les lignes du résultat ?", o: ["Non, seulement la procédure physique", "Oui", "Seulement l'ordre garanti", "Oui pour LEFT JOIN"], a: 0 },
      ],
    },
    {
      id: "j5-maintenance",
      title: "ANALYZE, VACUUM et mémoire de tri",
      bench: true,
      learn: [
        "Après de nombreux changements, les statistiques décrivent les données d'hier. La commande autonome **ANALYZE** échantillonne la table et actualise les statistiques (à ne pas confondre avec l'option de EXPLAIN). Un **tuple mort** est une ancienne version de ligne dont plus aucun instantané n'a besoin ; **VACUUM** rend son espace réutilisable et entretient la visibilité. **Autovacuum** le fait en fond.",
        "Un **tri** a besoin de mémoire de travail. Si `work_mem` ne suffit pas, PostgreSQL **déborde** vers des fichiers temporaires : le plan affiche `Sort Method: external merge  Disk: …`. `work_mem` vaut **par tri ou opération**, pas pour tout le serveur : l'augmenter multiplie la mémoire possible par les opérations et les sessions.",
        "Avant d'ajouter de la mémoire : l'application a-t-elle besoin de toutes les lignes, de toutes les colonnes ? Un ordre déjà fourni par un index utile peut éviter le tri.",
      ],
      code: `BEGIN;
SET LOCAL work_mem = '64kB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT order_id, total FROM work.bench_orders
ORDER BY total, order_id;
ROLLBACK;`,
      retiens: "Corrige d'abord la question (moins de lignes, moins de colonnes), ensuite seulement les ressources.",
      keys: [
        ["ANALYZE (commande)", "Actualise les statistiques du planificateur."],
        ["Tuple mort", "Ancienne version de ligne dont aucun instantané n'a besoin."],
        ["VACUUM", "Rend réutilisable l'espace des versions mortes."],
        ["Autovacuum", "Maintenance automatique en fond."],
        ["work_mem", "Mémoire de base par tri ou opération comparable."],
        ["Spill", "Débordement vers des fichiers temporaires."],
      ],
      ex: [
        { t: "qcm", q: "La commande autonome `ANALYZE table` :", o: ["Actualise les statistiques du planificateur", "Exécute la requête", "Supprime les tuples morts", "Crée un index"], a: 0 },
        { t: "qcm", q: "`VACUUM` :", o: ["Rend réutilisable l'espace des anciennes versions de lignes", "Vide la table", "Recalcule les index", "Actualise uniquement les statistiques"], a: 0 },
        { t: "qcm", q: "`Sort Method: external merge  Disk: 7000kB` indique :", o: ["Le tri a débordé vers des fichiers temporaires", "Une erreur", "L'utilisation d'un index", "Une jointure par fusion"], a: 0 },
        { t: "qcm", q: "Passer `work_mem` à 1 Go « pour être tranquille » :", o: ["Risqué : chaque tri de chaque session peut l'utiliser", "Toujours une bonne idée", "Sans effet", "Obligatoire en production"], a: 0 },
        { t: "fill", q: "Une ancienne version de ligne dont plus aucun instantané n'a besoin est un tuple ___", a: ["mort"] },
      ],
    },
    {
      id: "j5-pagination",
      title: "Pagination : OFFSET ou clé",
      bench: true,
      learn: [
        "`LIMIT 3 OFFSET 100000` saute 100 000 lignes avant de renvoyer la page. Même avec un index d'ordre, PostgreSQL doit **calculer les lignes sautées** : une page lointaine coûte cher.",
        "La **pagination par clé** mémorise la dernière valeur affichée et demande la suite : `WHERE order_id > 100000 ORDER BY order_id LIMIT 3`. Le B-tree de clé primaire va directement à la borne. Ça convient à « page suivante », pas aux sauts vers une page numérotée.",
        "La clé d'ordre doit être **unique** (ou complétée par un critère de départage unique), sinon des valeurs égales peuvent faire sauter des lignes entre deux pages.",
      ],
      code: `SELECT order_id, total FROM work.bench_orders
WHERE order_id > 100000
ORDER BY order_id
LIMIT 3;`,
      keys: [
        ["Pagination", "Renvoyer un grand résultat ordonné en petites pages."],
        ["OFFSET n", "Sauter n lignes, qu'il faut quand même calculer."],
        ["Pagination par clé", "Reprendre après la dernière clé affichée."],
        ["Critère de départage", "Clé unique qui rend l'ordre total."],
      ],
      ex: [
        { t: "sql", q: "Pagination par clé : la page précédente finissait à l'`order_id` 100000. Renvoie les 3 commandes suivantes (`order_id`, `total`) sans OFFSET.", sol: "SELECT order_id, total FROM work.bench_orders WHERE order_id > 100000 ORDER BY order_id LIMIT 3;", need: [">"], ban: ["OFFSET"] },
        { t: "qcm", q: "Pourquoi `OFFSET 100000` coûte-t-il cher même avec un index ?", o: ["PostgreSQL doit calculer les lignes sautées", "OFFSET désactive les index", "Il trie deux fois", "Il verrouille la table"], a: 0 },
        { t: "qcm", q: "Limite de la pagination par clé :", o: ["Adaptée à « page suivante », pas aux sauts vers une page numérotée", "Ne fonctionne qu'avec OFFSET", "Exige un index GIN", "Renvoie des doublons"], a: 0 },
        { t: "qcm", q: "Si la clé de tri n'est pas unique, que faut-il ajouter ?", o: ["Un critère de départage unique", "DISTINCT", "Un OFFSET", "Un index partiel"], a: 0 },
      ],
    },
    {
      id: "j5-partition",
      title: "Partitionnement de table",
      learn: [
        "Le **partitionnement** divise une table logique en tables filles physiques selon une clé (le mois, par exemple). Ce n'est **pas** le PARTITION BY d'une fenêtre, qui regroupe pour un calcul sans toucher au stockage.",
        "`PARTITION BY RANGE (ordered_on)` déclare comment le parent oriente les lignes ; `PARTITION OF … FOR VALUES FROM (…) TO (…)` crée une fille avec une borne inférieure **incluse** et une borne supérieure **exclue**, comme nos plages semi-ouvertes. On insère dans le parent ; PostgreSQL range chaque ligne dans la bonne fille.",
        "L'**élagage des partitions** exclut les filles dont les bornes ne peuvent pas contenir de correspondance : une requête sur février ne lit pas janvier. Le partitionnement sert aussi le cycle de vie (archiver ou supprimer les vieux mois), mais ajoute de la conception et de la maintenance : il n'accélère rien automatiquement.",
      ],
      code: `CREATE TABLE work.order_months (order_id integer, ordered_on date)
  PARTITION BY RANGE (ordered_on);
CREATE TABLE work.order_jan PARTITION OF work.order_months
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE work.order_feb PARTITION OF work.order_months
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
INSERT INTO work.order_months VALUES (101, '2026-01-05'), (104, '2026-02-01');
EXPLAIN SELECT order_id, ordered_on FROM work.order_months
WHERE ordered_on >= DATE '2026-02-01' AND ordered_on < DATE '2026-03-01';`,
      keys: [
        ["Partitionnement", "Table logique divisée en tables filles physiques."],
        ["PARTITION BY RANGE", "Oriente les lignes selon des plages de la clé."],
        ["PARTITION OF", "Crée une table fille du parent."],
        ["FOR VALUES FROM … TO", "Borne inférieure incluse, supérieure exclue."],
        ["Élagage", "Exclure les partitions qui ne peuvent pas correspondre."],
      ],
      ex: [
        { t: "qcm", q: "Le PARTITION BY d'une fenêtre et le partitionnement de table :", o: ["Différents : l'un regroupe pour un calcul, l'autre découpe le stockage", "Identiques", "Le premier modifie le stockage", "Le second est un calcul"], a: 0 },
        { t: "qcm", q: "`FOR VALUES FROM ('2026-01-01') TO ('2026-02-01')` : le 1er février appartient-il à cette partition ?", o: ["Non, la borne supérieure est exclue", "Oui", "Ça dépend du fuseau", "Erreur"], a: 0 },
        { t: "sql", q: "Le parent et les partitions de janvier et février sont déjà créés (code de départ). Ajoute la partition `work.order_mar` pour mars 2026, insère la commande (110, '2026-03-10') dans le parent, puis lis tout le contenu de `work.order_mar`.", start: "CREATE TABLE work.order_months (order_id integer, ordered_on date)\n  PARTITION BY RANGE (ordered_on);\nCREATE TABLE work.order_jan PARTITION OF work.order_months\n  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');\nCREATE TABLE work.order_feb PARTITION OF work.order_months\n  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');\n", sol: "CREATE TABLE work.order_months (order_id integer, ordered_on date) PARTITION BY RANGE (ordered_on);\nCREATE TABLE work.order_jan PARTITION OF work.order_months FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');\nCREATE TABLE work.order_feb PARTITION OF work.order_months FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');\nCREATE TABLE work.order_mar PARTITION OF work.order_months FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');\nINSERT INTO work.order_months VALUES (110, '2026-03-10');\nSELECT order_id, ordered_on FROM work.order_mar;", need: ["PARTITION OF", "ORDER_MAR"] },
        { t: "fill", q: "Exclure les partitions dont les bornes ne peuvent pas contenir de correspondance s'appelle l'___ des partitions.", a: ["élagage", "elagage"] },
      ],
    },
    {
      id: "j5-prepare",
      title: "Requêtes préparées",
      bench: true,
      learn: [
        "Un **paramètre** est une valeur fournie séparément à l'exécution. `PREPARE nom(text) AS … $1 …` nomme une instruction dans la session ; `$1` est le premier paramètre ; `EXECUTE nom('pending')` fournit la valeur ; `DEALLOCATE nom` la supprime.",
        "Un **plan personnalisé** est élaboré pour une valeur précise ; un **plan générique** sert pour toutes les valeurs. PostgreSQL choisit automatiquement. Préparer peut économiser de la planification répétée, sans garantir le même parcours pour chaque valeur.",
        "Même SQL, travail très différent : `'pending'` compte 30 000 lignes, `'paid'` 270 000. Mesure toujours avec des paramètres **représentatifs**.",
      ],
      code: `PREPARE queue_count(text) AS
  SELECT count(*) AS orders FROM work.bench_orders WHERE status = $1;
EXECUTE queue_count('pending');`,
      keys: [
        ["PREPARE … AS", "Nommer une instruction pour la réutiliser dans la session."],
        ["$1", "Emplacement du premier paramètre."],
        ["EXECUTE", "Exécuter l'instruction préparée avec des valeurs."],
        ["DEALLOCATE", "Supprimer l'instruction préparée."],
        ["Plan générique / personnalisé", "Réutilisable pour toutes valeurs / propre à une valeur."],
      ],
      ex: [
        { t: "sql", q: "Prépare `top_orders(int)` qui renvoie `order_id` et `total` des 3 premières commandes (ordre `order_id`) de l'étudiant `$1`, puis exécute-la pour l'étudiant 42.", sol: "PREPARE top_orders(int) AS SELECT order_id, total FROM work.bench_orders WHERE student_id = $1 ORDER BY order_id LIMIT 3;\nEXECUTE top_orders(42);", need: ["PREPARE", "EXECUTE"], why: "41, 10041 et 20041." },
        { t: "qcm", q: "Plan générique contre plan personnalisé :", o: ["Générique : réutilisable pour toutes les valeurs ; personnalisé : élaboré pour une valeur", "Identiques", "Le générique est toujours plus rapide", "Le personnalisé est partagé entre sessions"], a: 0 },
        { t: "fill", q: "Pour supprimer une instruction préparée : `___ queue_count`", a: ["DEALLOCATE"] },
        { t: "qcm", q: "Pourquoi mesurer `'pending'` et `'paid'` séparément ?", o: ["Même SQL, mais 30 000 contre 270 000 lignes : un travail très différent", "Pour la syntaxe", "PREPARE l'exige", "Aucune raison"], a: 0 },
      ],
    },
  ],
});
