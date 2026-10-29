/* Jour 3 · Écrire des analyses avancées (Day_03_Student_Lessons.pdf). Format : voir jour1.js. */
COURS.day("sql-avance", {
  id: "j3",
  label: "Jour 3",
  title: "Écrire des analyses avancées",
  summary: "CTE, fonctions de fenêtrage, cadres, séries de dates, récursivité, LATERAL, rapports multi-niveaux, cohortes et séries consécutives.",
  bricks: [
    {
      id: "j3-cte",
      title: "Tables dérivées et CTE (WITH)",
      learn: [
        "« Quelles commandes payées ont rapporté plus de 60 ? » demande deux étapes : calculer un total par commande, **puis** filtrer ces totaux. Une **table dérivée** (un SELECT dans FROM) fournit à la requête externe une colonne `total` qui n'existe pas dans la table stockée.",
        "Une **CTE** (expression de table commune) nomme cette étape avec `WITH nom AS (…)`, **avant** la requête qui l'utilise : c'est plus lisible. Plusieurs CTE se séparent par des virgules, et une étape peut lire la précédente.",
        "**Portée** : une CTE n'existe que dans l'instruction de son WITH ; le point-virgule la fait disparaître. Ce n'est pas une table stockée. Nomme chaque étape d'après ce que contiennent ses lignes.",
      ],
      code: `WITH order_totals AS (
  SELECT o.order_id, SUM(i.quantity * i.unit_price) AS total
  FROM campus.orders AS o
  JOIN campus.order_items AS i USING (order_id)
  WHERE o.status = 'paid'
  GROUP BY o.order_id
)
SELECT order_id, total
FROM order_totals
WHERE total > 60
ORDER BY order_id;`,
      retiens: "Calcule à la granularité voulue dans une étape, filtre dans la suivante.",
      keys: [
        ["Table dérivée", "Résultat d'une sous-requête utilisé comme table dans FROM."],
        ["CTE", "Résultat de requête nommé, valable pour une seule instruction."],
        ["WITH nom AS (…)", "Introduit une étape nommée."],
        ["Portée", "Partie de l'instruction où un nom est utilisable."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : avec la CTE `order_totals`, les commandes payées dont le total est **inférieur à 60** : `order_id`, `total`, plus grand total d'abord puis par `order_id`.", sol: "WITH order_totals AS (SELECT o.order_id, SUM(i.quantity * i.unit_price) AS total FROM campus.orders AS o JOIN campus.order_items AS i USING (order_id) WHERE o.status = 'paid' GROUP BY o.order_id) SELECT order_id, total FROM order_totals WHERE total < 60 ORDER BY total DESC, order_id;", need: ["WITH"], why: "103, 109 et 110 valent 50 ; 108 vaut 40. Les commandes pending et cancelled sont exclues dans la CTE." },
        { t: "qcm", q: "Une CTE définie dans une instruction est-elle utilisable dans l'instruction suivante ?", o: ["Non, sa portée s'arrête au point-virgule", "Oui, jusqu'à la déconnexion", "Oui après COMMIT", "Oui, dans le schéma work"], a: 0 },
        { t: "sql", q: "Avec une CTE de totaux par commande payée, calcule le CA payé total de CampusMarket (une valeur, colonne `revenue`).", sol: "WITH order_totals AS (SELECT o.order_id, SUM(i.quantity * i.unit_price) AS total FROM campus.orders AS o JOIN campus.order_items AS i USING (order_id) WHERE o.status = 'paid' GROUP BY o.order_id) SELECT SUM(total) AS revenue FROM order_totals;", need: ["WITH"], why: "475 : le total de référence du cours." },
        { t: "fill", q: "Une CTE est introduite par le mot-clé ___", a: ["WITH"] },
      ],
    },
    {
      id: "j3-window",
      title: "Fenêtres : OVER et PARTITION BY",
      learn: [
        "Une **fonction de fenêtrage** calcule à partir des lignes liées à la ligne courante **tout en gardant chaque ligne** dans la sortie. GROUP BY remplacerait les personnes par une ligne par équipe ; un SUM fenêtré répète le total d'équipe à côté de chaque personne.",
        "`OVER (…)` transforme l'agrégat en calcul de fenêtrage. `PARTITION BY team` lance un calcul séparé par équipe. `OVER ()` utilise toutes les lignes comme une seule partition. Le ORDER BY final ne fait que trier l'affichage.",
        "La colonne `team_total` est une colonne de comparaison : l'additionner verticalement compterait chaque équipe trois fois.",
      ],
      code: `WITH sales(team, person, amount) AS (
  VALUES ('A','Ada',40), ('A','Ben',30), ('A','Cam',30),
         ('B','Dee',50), ('B','Eli',50), ('B','Fay',20)
)
SELECT team, person, amount,
  SUM(amount) OVER (PARTITION BY team) AS team_total
FROM sales
ORDER BY team, person;`,
      retiens: "Les fenêtres gardent les lignes ; les agrégats groupés les remplacent.",
      keys: [
        ["Fonction de fenêtrage", "Calcul sur des lignes liées qui conserve chaque ligne."],
        ["OVER (…)", "Définit les lignes disponibles pour le calcul."],
        ["PARTITION BY", "Un calcul indépendant par groupe."],
        ["OVER ()", "Toutes les lignes forment une seule partition."],
      ],
      ex: [
        { t: "qcm", q: "Différence entre `SUM … GROUP BY team` et `SUM … OVER (PARTITION BY team)` ?", o: ["La fenêtre garde chaque personne et répète le total d'équipe", "Aucune", "GROUP BY garde les personnes", "OVER supprime les doublons"], a: 0 },
        { t: "sql", q: "Pour chaque produit : `name`, `unit_price` et le prix moyen de sa catégorie (`cat_avg`) calculé par une fenêtre, triés par `product_id`.", sol: "SELECT name, unit_price, AVG(unit_price) OVER (PARTITION BY category_id) AS cat_avg FROM campus.products ORDER BY product_id;", need: ["OVER"] },
        { t: "sql", q: "Pour chaque produit : `name`, `stock` et `pct` = `ROUND(100.0 * stock / SUM(stock) OVER (), 1)` (part du stock total), triés par `product_id`.", sol: "SELECT name, stock, ROUND(100.0 * stock / SUM(stock) OVER (), 1) AS pct FROM campus.products ORDER BY product_id;", need: ["OVER"], hint: "100.0 force une division décimale ; avec 100, la division serait entière." },
        { t: "qcm", q: "Additionner verticalement la colonne `team_total` affichée (3 personnes par équipe) :", o: ["Compte chaque équipe trois fois", "Donne le total exact", "Donne la moyenne", "Est impossible"], a: 0 },
      ],
    },
    {
      id: "j3-rank",
      title: "RANK, DENSE_RANK et ROW_NUMBER",
      learn: [
        "Un classement exige un ordre **et** une règle pour les ex æquo. `RANK` donne la même position aux ex æquo et laisse un **saut** ensuite ; `DENSE_RANK` partage sans saut ; `ROW_NUMBER` donne un numéro **différent** à chaque ligne.",
        "Le ORDER BY **dans OVER** contrôle le calcul ; le ORDER BY externe, l'affichage. `WINDOW w AS (…)` nomme une fenêtre réutilisée par plusieurs fonctions (`OVER w`).",
        "Une fonction de fenêtrage ne peut pas apparaître dans le WHERE de son propre SELECT (WHERE est évalué avant). Pour filtrer sur un rang : calcule-le dans une CTE, filtre dans l'étape suivante.",
      ],
      code: `WITH s(person, amount) AS (
  VALUES ('Ada',40), ('Ben',30), ('Cam',30), ('Dee',20), ('Eli',20), ('Fay',10)
)
SELECT person, amount,
  RANK() OVER w AS r,
  DENSE_RANK() OVER w AS dr,
  ROW_NUMBER() OVER (ORDER BY amount DESC, person) AS rn
FROM s
WINDOW w AS (ORDER BY amount DESC)
ORDER BY amount DESC, person;`,
      retiens: "La règle des ex æquo fait partie de la question métier.",
      keys: [
        ["RANK()", "Positions partagées, avec saut après les ex æquo."],
        ["DENSE_RANK()", "Positions partagées, sans saut."],
        ["ROW_NUMBER()", "Numéro unique pour chaque ligne."],
        ["WINDOW w AS (…)", "Nomme une fenêtre réutilisable avec OVER w."],
      ],
      ex: [
        { t: "qcm", q: "Montants 40, 30, 30, 20. Quel est le RANK de la personne à 20 ?", o: ["4", "3", "2", "5"], a: 0, why: "Trois personnes la précèdent." },
        { t: "qcm", q: "Même question avec DENSE_RANK :", o: ["3", "4", "2", "1"], a: 0, why: "Seuls deux montants distincts sont supérieurs." },
        { t: "sql", q: "Exercice du cours : tous les membres des deux premiers rangs (RANK) des ventes, ex æquo compris : `person`, `amount`, `r`, triés par `r` puis `person`. Données : Ada 40, Ben 30, Cam 30, Dee 20, Eli 20, Fay 10.", start: "WITH s(person, amount) AS (\n  VALUES ('Ada',40), ('Ben',30), ('Cam',30), ('Dee',20), ('Eli',20), ('Fay',10)\n)\n", sol: "WITH s(person, amount) AS (VALUES ('Ada',40), ('Ben',30), ('Cam',30), ('Dee',20), ('Eli',20), ('Fay',10)), ranked AS (SELECT person, amount, RANK() OVER (ORDER BY amount DESC) AS r FROM s) SELECT person, amount, r FROM ranked WHERE r <= 2 ORDER BY r, person;", need: ["RANK"], why: "Ada, Ben et Cam. Avec ROW_NUMBER <= 2, Cam serait exclu." },
        { t: "qcm", q: "Pourquoi le filtre `r <= 2` doit-il être dans le SELECT qui lit la CTE `ranked` ?", o: ["WHERE est évalué avant les fonctions de fenêtrage de son propre SELECT", "Pour aller plus vite", "Ce n'est pas nécessaire", "Parce que RANK renvoie du texte"], a: 0 },
        { t: "sql", q: "Classe les produits par prix décroissant avec ROW_NUMBER (départage par `product_id`) : `name`, `unit_price`, `rn`, triés par `rn`.", sol: "SELECT name, unit_price, ROW_NUMBER() OVER (ORDER BY unit_price DESC, product_id) AS rn FROM campus.products ORDER BY rn;", need: ["ROW_NUMBER"] },
      ],
    },
    {
      id: "j3-laglead",
      title: "LAG et LEAD",
      learn: [
        "`LAG(amount)` lit la valeur de la ligne **précédente** dans l'ordre de la fenêtre ; `LEAD(amount)` celle de la ligne **suivante**. `amount - LAG(amount)` donne la variation d'une ligne à l'autre.",
        "Un voisin absent donne NULL par défaut (premier mois sans précédent, dernier sans suivant). LAG et LEAD ne créent pas les mois manquants : ils lisent les lignes fournies.",
      ],
      code: `WITH s(m, amount) AS (
  VALUES (1,10), (2,20), (3,0), (4,40), (5,50), (6,0)
)
SELECT m, amount,
  LAG(amount) OVER w AS before,
  LEAD(amount) OVER w AS after,
  amount - LAG(amount) OVER w AS change
FROM s
WINDOW w AS (ORDER BY m)
ORDER BY m;`,
      keys: [
        ["LAG(v)", "Valeur de la ligne précédente."],
        ["LEAD(v)", "Valeur de la ligne suivante."],
        ["NULL par défaut", "Quand la ligne voisine n'existe pas."],
      ],
      ex: [
        { t: "qcm", q: "Mois 1 à 4 : 10, 20, 0, 40. Que vaut `LAG(amount)` au mois 1 ?", o: ["NULL", "0", "10", "20"], a: 0 },
        { t: "qcm", q: "Que vaut `amount - LAG(amount)` au mois 3 (20 → 0) ?", o: ["-20", "20", "0", "NULL"], a: 0 },
        { t: "sql", q: "Pour chaque commande : `order_id`, `ordered_at` et l'`ordered_at` de la commande précédente (`prev_at`), dans l'ordre de `ordered_at`.", sol: "SELECT order_id, ordered_at, LAG(ordered_at) OVER (ORDER BY ordered_at) AS prev_at FROM campus.orders ORDER BY ordered_at;", need: ["LAG"] },
        { t: "fill", q: "Pour lire la valeur de la ligne suivante : ___(amount)", a: ["LEAD"] },
      ],
    },
    {
      id: "j3-frame",
      title: "Cadres : total cumulé et LAST_VALUE",
      learn: [
        "Un **cadre de fenêtre** est la partie de la partition ordonnée utilisée pour la ligne courante. `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` va de la première ligne à la ligne courante : c'est un **total cumulé**. L'écrire explicitement évite de dépendre du traitement par défaut des ex æquo.",
        "`LAST_VALUE(amount)` renvoie la dernière valeur **du cadre**, pas du rapport. Avec ORDER BY sans cadre explicite, c'est souvent la ligne courante ! Pour le vrai dernier mois : étendre le cadre jusqu'à `UNBOUNDED FOLLOWING`. Et « le dernier » n'est pas « le plus grand ».",
      ],
      code: `WITH s(m, amount) AS (
  VALUES (1,10), (2,20), (3,0), (4,40), (5,50), (6,0)
)
SELECT m, amount,
  SUM(amount) OVER (ORDER BY m ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
  LAST_VALUE(amount) OVER (ORDER BY m) AS default_last,
  LAST_VALUE(amount) OVER (ORDER BY m ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS final_amount
FROM s
ORDER BY m;`,
      retiens: "Précise le cadre dès que le calcul dépend des limites des lignes ordonnées.",
      keys: [
        ["Cadre", "Sous-ensemble des lignes ordonnées utilisé pour la ligne courante."],
        ["ROWS", "Limites du cadre en positions de lignes."],
        ["UNBOUNDED PRECEDING", "Depuis la première ligne de la partition."],
        ["CURRENT ROW", "Jusqu'à la ligne courante."],
        ["UNBOUNDED FOLLOWING", "Jusqu'à la dernière ligne de la partition."],
        ["LAST_VALUE(v)", "Valeur sur la dernière ligne du cadre."],
      ],
      ex: [
        { t: "sql", q: "Total cumulé du CA payé, commande par commande dans l'ordre des `order_id` : `order_id`, `total`, `running_total`. Calcule d'abord les totaux dans une CTE.", sol: "WITH t AS (SELECT o.order_id, SUM(i.quantity * i.unit_price) AS total FROM campus.orders AS o JOIN campus.order_items AS i USING (order_id) WHERE o.status = 'paid' GROUP BY o.order_id) SELECT order_id, total, SUM(total) OVER (ORDER BY order_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total FROM t ORDER BY order_id;", need: ["OVER"], why: "La dernière ligne atteint 475." },
        { t: "qcm", q: "`LAST_VALUE(amount) OVER (ORDER BY m)`, sans cadre explicite, renvoie souvent :", o: ["Le montant de la ligne courante", "Le montant du dernier mois", "Le maximum", "NULL"], a: 0 },
        { t: "fill", q: "Pour étendre le cadre jusqu'à la dernière ligne : `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED ___`", a: ["FOLLOWING"] },
      ],
    },
    {
      id: "j3-series",
      title: "generate_series et moyennes mobiles",
      learn: [
        "Un rapport quotidien exige une ligne **par jour**, y compris les jours sans activité. `generate_series(0, 5)` produit les entiers 0 à 5 ; `DATE '2026-01-01' + n` avance d'autant de jours. Ce calendrier devient le côté gauche d'un LEFT JOIN avec les ventes.",
        "`COALESCE(f.amount, 0)` après ce LEFT JOIN est une **décision métier** : ici, absence = jour sans vente confirmé. Ailleurs, une mesure manquante peut signifier « inconnu ».",
        "Une **moyenne mobile** fait la moyenne d'un cadre qui avance : `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` prend au plus trois lignes. Sans les jours vides, ces trois lignes couvriraient une période plus longue et irrégulière. Les premiers jours ont un cadre plus court.",
      ],
      code: `WITH daily(d, amount) AS (
  VALUES (1,10), (2,20), (3,0), (4,40), (5,50), (6,0)
)
SELECT d, amount,
  ROUND(AVG(amount) OVER (ORDER BY d ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg
FROM daily
ORDER BY d;`,
      retiens: "Une moyenne mobile exige un axe temporel complet.",
      keys: [
        ["generate_series(a, b)", "Lignes d'entiers de a à b inclus."],
        ["date + entier", "Avance la date de ce nombre de jours."],
        ["Moyenne mobile", "Moyenne d'un cadre borné qui avance."],
        ["n PRECEDING", "Commence le cadre n lignes avant."],
        ["ROUND(v, 2)", "Arrondi à deux décimales."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : moyenne mobile sur **2 jours** (jour courant + 1 précédent) : `d`, `moving_avg` arrondie à 2 décimales.", start: "WITH daily(d, amount) AS (\n  VALUES (1,10), (2,20), (3,0), (4,40), (5,50), (6,0)\n)\n", sol: "WITH daily(d, amount) AS (VALUES (1,10), (2,20), (3,0), (4,40), (5,50), (6,0)) SELECT d, ROUND(AVG(amount) OVER (ORDER BY d ROWS BETWEEN 1 PRECEDING AND CURRENT ROW), 2) AS moving_avg FROM daily ORDER BY d;", need: ["PRECEDING"], why: "10, 15, 10, 20, 45, 25 : le jour 6 fait la moyenne de 50 et 0." },
        { t: "qcm", q: "Pourquoi garder les jours sans vente dans la série avant une moyenne mobile ?", o: ["Sinon le cadre ROWS couvrirait une période plus longue et irrégulière", "Pour avoir plus de lignes", "Ce n'est pas utile", "Pour éviter les NULL"], a: 0 },
        { t: "sql", q: "Génère les dates (type date) du 1er au 7 mars 2026 dans une colonne `d`, avec `generate_series`.", sol: "SELECT DATE '2026-03-01' + g.n AS d FROM generate_series(0, 6) AS g(n) ORDER BY d;", need: ["GENERATE_SERIES"] },
        { t: "qcm", q: "`COALESCE(f.amount, 0)` après le LEFT JOIN avec le calendrier est :", o: ["Une décision métier : ici, absence = zéro vente confirmé", "Toujours correct", "Toujours faux", "Obligatoire en SQL"], a: 0 },
      ],
    },
    {
      id: "j3-recursive",
      title: "CTE récursives",
      learn: [
        "Comment parcourir un nombre **inconnu** de niveaux hiérarchiques ? Une **CTE récursive** part d'une **ancre**, puis applique à répétition une **étape** aux lignes nouvellement trouvées. `WITH RECURSIVE` permet à la CTE de se lire elle-même ; `UNION ALL` ajoute les lignes de chaque tour.",
        "La récursivité s'arrête quand l'étape ne renvoie plus de ligne : la **condition d'arrêt** est essentielle. Pour les catégories, l'ancre prend la racine (profondeur 0) et chaque tour joint les enfants des lignes trouvées (profondeur + 1).",
        "Un **cycle** ramène à un nœud déjà présent sur le chemin. La clause PostgreSQL `CYCLE id SET is_cycle USING path` le détecte, marque la ligne et arrête de développer cet itinéraire.",
      ],
      code: `WITH RECURSIVE tree(category_id, name, depth) AS (
  SELECT category_id, name, 0
  FROM campus.categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.category_id, c.name, t.depth + 1
  FROM campus.categories AS c
  JOIN tree AS t ON c.parent_id = t.category_id
)
SELECT category_id, name, depth
FROM tree
ORDER BY depth, category_id;`,
      retiens: "Ancre, étape, arrêt. Sans condition d'arrêt (ou gestion des cycles), la récursivité ne finit pas.",
      keys: [
        ["WITH RECURSIVE", "Permet à une CTE de lire son tour précédent."],
        ["Ancre", "Lignes initiales, avant UNION ALL."],
        ["Étape récursive", "Requête qui produit le tour suivant."],
        ["Terminaison", "L'étape ne renvoie plus de nouvelle ligne."],
        ["CYCLE … SET … USING", "Détecte un nœud répété sur le chemin."],
      ],
      ex: [
        { t: "sql", q: "Compte de 1 à 10 avec une CTE récursive (colonne `n`).", sol: "WITH RECURSIVE numbers(n) AS (VALUES (1) UNION ALL SELECT n + 1 FROM numbers WHERE n < 10) SELECT n FROM numbers ORDER BY n;", need: ["RECURSIVE"] },
        { t: "sql", q: "Avec une CTE récursive : Technology (category_id 2) et tous ses descendants, avec leur profondeur `depth` (Technology = 0) : `category_id`, `name`, `depth`, triés par `depth` puis `category_id`.", sol: "WITH RECURSIVE tree(category_id, name, depth) AS (SELECT category_id, name, 0 FROM campus.categories WHERE category_id = 2 UNION ALL SELECT c.category_id, c.name, t.depth + 1 FROM campus.categories AS c JOIN tree AS t ON c.parent_id = t.category_id) SELECT category_id, name, depth FROM tree ORDER BY depth, category_id;", need: ["RECURSIVE"] },
        { t: "qcm", q: "Que se passe-t-il quand l'étape récursive ne renvoie plus de ligne ?", o: ["La récursivité s'arrête", "Une erreur", "Elle recommence à l'ancre", "Elle renvoie NULL"], a: 0 },
        { t: "fill", q: "La clause PostgreSQL qui détecte les nœuds répétés : `___ id SET is_cycle USING path`", a: ["CYCLE"] },
      ],
    },
    {
      id: "j3-lateral",
      title: "LATERAL : une requête par ligne",
      learn: [
        "Quelle est la **dernière** commande payée de chaque étudiant ? Une sous-requête `LATERAL` dans FROM peut lire les colonnes d'un élément FROM **précédent** : elle s'exécute pour chaque étudiant, trie ses commandes et n'en garde qu'une (`LIMIT 1`).",
        "`LEFT JOIN LATERAL (…) ON true` conserve aussi les étudiants sans résultat (Farah, avec NULL). `ON true` n'ajoute aucune condition : la sous-requête fait déjà la correspondance avec l'étudiant. Avec un simple `JOIN LATERAL`, Farah disparaîtrait.",
      ],
      code: `SELECT s.student_id, s.full_name, last_order.order_id
FROM campus.students AS s
LEFT JOIN LATERAL (
  SELECT o.order_id
  FROM campus.orders AS o
  WHERE o.student_id = s.student_id AND o.status = 'paid'
  ORDER BY o.ordered_at DESC, o.order_id DESC
  LIMIT 1
) AS last_order ON true
ORDER BY s.student_id;`,
      keys: [
        ["LATERAL", "Une sous-requête FROM qui lit une ligne source précédente."],
        ["LEFT JOIN LATERAL", "Garde la ligne source même si la sous-requête ne renvoie rien."],
        ["ON true", "Accepte chaque ligne produite par la requête latérale."],
      ],
      ex: [
        { t: "sql", q: "Pour chaque étudiant : `full_name` et le montant de sa plus grosse commande payée (`best_total`), NULL s'il n'en a pas, avec `LEFT JOIN LATERAL`, triés par `student_id`.", sol: "SELECT s.full_name, b.total AS best_total FROM campus.students AS s LEFT JOIN LATERAL (SELECT SUM(i.quantity * i.unit_price) AS total FROM campus.orders AS o JOIN campus.order_items AS i USING (order_id) WHERE o.student_id = s.student_id AND o.status = 'paid' GROUP BY o.order_id ORDER BY total DESC LIMIT 1) AS b ON true ORDER BY s.student_id;", need: ["LATERAL"] },
        { t: "qcm", q: "Pourquoi `ON true` dans ce `LEFT JOIN LATERAL` ?", o: ["La sous-requête fait déjà la correspondance avec l'étudiant", "Pour garder toutes les commandes", "C'est une erreur", "Pour trier"], a: 0 },
        { t: "qcm", q: "Avec `JOIN LATERAL` (sans LEFT), Farah apparaît-elle ?", o: ["Non, sa sous-requête ne renvoie aucune ligne", "Oui, avec NULL", "Oui, deux fois", "Erreur"], a: 0 },
      ],
    },
    {
      id: "j3-grouping",
      title: "GROUPING SETS, ROLLUP et CUBE",
      learn: [
        "Un rapport peut mêler plusieurs **niveaux de synthèse** : totaux par campus **et** total général. `GROUPING SETS ((campus), ())` énumère les regroupements à calculer ; `()` est l'ensemble vide, qui donne le total général.",
        "Une colonne omise par un niveau apparaît en NULL : c'est un marqueur de synthèse, pas une donnée manquante. `GROUPING(campus)` vaut 1 quand campus est omis, 0 sinon : il lève l'ambiguïté.",
        "`ROLLUP(campus, category)` suit les préfixes : (campus, category), (campus), (). `CUBE(campus, category)` prend **tous** les sous-ensembles : il ajoute (category) seul. Additionner les lignes de niveaux différents compte deux fois les mêmes ventes.",
      ],
      code: `WITH sales(campus, category, amount) AS (
  VALUES ('north','Books',10), ('north','Tech',40),
         ('south','Books',30), ('south','Tech',20)
)
SELECT campus, category, SUM(amount) AS total,
  GROUPING(campus) AS gc, GROUPING(category) AS gk
FROM sales
GROUP BY CUBE (campus, category)
ORDER BY gc, gk, campus, category;`,
      retiens: "Étiquette chaque niveau avec GROUPING() pour expliquer les NULL de synthèse.",
      keys: [
        ["GROUPING SETS", "Liste des regroupements à calculer dans un seul résultat."],
        ["()", "Ensemble vide : le total général."],
        ["GROUPING(col)", "1 si le niveau omet la colonne, sinon 0."],
        ["ROLLUP(a, b)", "(a, b), (a), ()."],
        ["CUBE(a, b)", "(a, b), (a), (b), ()."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : totaux par catégorie et total général avec `GROUPING SETS`, plus `all_categories = GROUPING(category)` : `category`, `total`, `all_categories`, triés par `all_categories` puis `category`.", start: "WITH sales(campus, category, amount) AS (\n  VALUES ('north','Books',10), ('north','Tech',40),\n         ('south','Books',30), ('south','Tech',20)\n)\n", sol: "WITH sales(campus, category, amount) AS (VALUES ('north','Books',10), ('north','Tech',40), ('south','Books',30), ('south','Tech',20)) SELECT category, SUM(amount) AS total, GROUPING(category) AS all_categories FROM sales GROUP BY GROUPING SETS ((category), ()) ORDER BY all_categories, category;", need: ["GROUPING SETS"], why: "Books 40, Tech 60, total 100. campus est absent du SELECT : aucun niveau demandé ne le regroupe." },
        { t: "qcm", q: "Quels niveaux produit `ROLLUP(campus, category)` ?", o: ["(campus, category), (campus), ()", "(campus, category), (campus), (category), ()", "(campus), (category)", "() seulement"], a: 0 },
        { t: "qcm", q: "Sur une ligne, `GROUPING(campus) = 1` signifie :", o: ["campus est omis de ce regroupement (ligne de synthèse)", "campus vaut 1", "campus est NULL dans les données", "Une erreur"], a: 0 },
        { t: "qcm", q: "Totaux affichés : north 50, south 50, total général 100. Additionner les trois lignes :", o: ["Compte deux fois les ventes (200)", "Donne le bon total", "Donne 100", "Est interdit"], a: 0 },
      ],
    },
    {
      id: "j3-patterns",
      title: "Cohortes et séries consécutives",
      learn: [
        "Une **cohorte** est un groupe défini par un événement initial commun : ici, le mois du premier achat. Une CTE trouve ce mois avec `MIN` ; la jointure le rattache à chaque achat ; `m - first_mo` donne l'**ancienneté** (0 = mois de départ). `COUNT(DISTINCT person)` compte des personnes actives, pas des achats.",
        "Une **série** (îlot) est une suite de jours consécutifs ; une **lacune** sépare deux séries. Dans une suite consécutive, le numéro du jour et `ROW_NUMBER()` augmentent tous deux de 1 : leur **différence reste constante**. Cette clé d'îlot se résume avec GROUP BY (MIN, MAX, COUNT).",
      ],
      code: `WITH active(d) AS (VALUES (1), (2), (3), (6), (7), (10)),
labeled AS (
  SELECT d, d - ROW_NUMBER() OVER (ORDER BY d) AS k
  FROM active
)
SELECT MIN(d) AS first_day, MAX(d) AS last_day, COUNT(*) AS days
FROM labeled
GROUP BY k
ORDER BY first_day;`,
      retiens: "Îlots : jour − ROW_NUMBER() = constante dans une série consécutive.",
      keys: [
        ["Cohorte", "Personnes partageant un même événement de départ."],
        ["Ancienneté", "Mois écoulés depuis le mois de départ de la personne."],
        ["Îlot / série", "Suite de valeurs consécutives."],
        ["Lacune", "Interruption entre deux séries."],
        ["Clé d'îlot", "Valeur commune à toutes les lignes d'une même série."],
      ],
      ex: [
        { t: "qcm", q: "Jours actifs 1, 2, 3, 6, 7, 10 : que donne `d - ROW_NUMBER()` ?", o: ["0, 0, 0, 2, 2, 4", "1, 1, 1, 3, 3, 5", "0, 1, 2, 3, 4, 5", "0, 0, 0, 1, 1, 2"], a: 0 },
        { t: "sql", q: "Séries des jours actifs 4, 5, 6, 9, 12, 13 : `first_day`, `last_day`, `days`, triées par `first_day`.", start: "WITH active(d) AS (VALUES (4), (5), (6), (9), (12), (13))\n", sol: "WITH active(d) AS (VALUES (4), (5), (6), (9), (12), (13)), labeled AS (SELECT d, d - ROW_NUMBER() OVER (ORDER BY d) AS k FROM active) SELECT MIN(d) AS first_day, MAX(d) AS last_day, COUNT(*) AS days FROM labeled GROUP BY k ORDER BY first_day;", need: ["ROW_NUMBER"] },
        { t: "qcm", q: "En analyse de cohorte, que représente l'ancienneté (`age`) ?", o: ["Les mois écoulés depuis le premier achat de la personne", "L'âge de la personne", "Le nombre d'achats", "Le mois calendaire"], a: 0 },
        { t: "qcm", q: "Pourquoi `COUNT(DISTINCT person)` dans la cohorte ?", o: ["Pour compter des personnes actives, pas des achats", "Pour trier", "Pour enlever les NULL", "C'est obligatoire avec GROUP BY"], a: 0 },
      ],
    },
  ],
});
