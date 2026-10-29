/* Jour 2 · Poser des questions précises (Day_02_Student_Lessons.pdf). Format : voir jour1.js. */
COURS.day("sql-avance", {
  id: "j2",
  label: "Jour 2",
  title: "Poser des questions précises",
  summary: "Jointures, agrégation sur plusieurs tables, pièges du fanout, sous-requêtes, EXISTS, opérations ensemblistes et division relationnelle.",
  bricks: [
    {
      id: "j2-inner",
      title: "INNER JOIN, ON et alias",
      learn: [
        "Une commande stocke un `student_id` ; le nom de l'étudiant est dans `students`. Une **jointure** combine les lignes des deux tables quand leurs identifiants correspondent. La colonne qui les relie est la **clé de jointure**.",
        "`INNER JOIN … ON` renvoie une ligne **par paire correspondante**. `AS o` donne un **alias de table** ; `s.full_name` précise de quelle table vient la colonne. Une commande sans étudiant correspondant serait omise.",
        "Décide la **granularité** avant d'écrire : ici, une ligne = une commande. Alice apparaît donc deux fois (commandes 101 et 103), et c'est correct : ce n'est pas un doublon stocké.",
      ],
      code: `SELECT o.order_id, s.full_name
FROM campus.orders AS o
INNER JOIN campus.students AS s
  ON s.student_id = o.student_id
WHERE o.order_id IN (101, 102, 103)
ORDER BY o.order_id;`,
      retiens: "Choisis le sens d'une ligne de sortie avant de choisir la jointure.",
      keys: [
        ["INNER JOIN", "Garder chaque paire qui satisfait la condition ON."],
        ["ON", "Condition qui fait correspondre deux lignes."],
        ["Clé de jointure", "Colonne(s) utilisée(s) pour la correspondance."],
        ["Alias de table", "Nom court temporaire : FROM campus.orders AS o."],
        ["Cardinalité", "Nombre de lignes d'une table ou d'un résultat."],
      ],
      ex: [
        { t: "sql", q: "Pour chaque commande : `order_id`, `status` et `full_name` de l'étudiant, triées par `order_id`.", sol: "SELECT o.order_id, o.status, s.full_name FROM campus.orders AS o JOIN campus.students AS s ON s.student_id = o.student_id ORDER BY o.order_id;", need: ["JOIN"] },
        { t: "qcm", q: "Alice apparaît deux fois dans le résultat commandes–étudiants. Pourquoi ?", o: ["Elle a deux commandes : une ligne par commande", "Elle est stockée en double", "La jointure est fausse", "Il manque DISTINCT"], a: 0 },
        { t: "fill", q: "La condition de correspondance d'une jointure s'écrit après le mot-clé ___", a: ["ON"] },
        { t: "qcm", q: "Que désigne la cardinalité d'un résultat ?", o: ["Son nombre de lignes", "Son nombre de colonnes", "Son ordre de tri", "Sa clé primaire"], a: 0 },
      ],
    },
    {
      id: "j2-using",
      title: "USING et jointures sur trois tables",
      learn: [
        "Quand la clé porte le **même nom** des deux côtés, `USING (department_id)` demande plus brièvement l'égalité sur cette colonne, et l'affiche **une seule fois**. `JOIN` seul signifie `INNER JOIN`.",
        "On enchaîne les jointures : `orders` → `order_items` par `order_id`, puis `order_items` → `products` par `product_id`. `ON` reste utile si les noms diffèrent ou si la condition est plus riche.",
      ],
      code: `SELECT s.full_name, d.name AS department
FROM campus.students AS s
JOIN campus.departments AS d USING (department_id)
WHERE s.student_id <= 3
ORDER BY s.student_id;`,
      keys: [
        ["USING (col)", "Égalité sur la colonne de même nom des deux côtés."],
        ["JOIN", "Synonyme de INNER JOIN."],
      ],
      ex: [
        { t: "sql", q: "Nom de chaque étudiant (`full_name`) et nom de son département (`department`), avec `USING`, triés par `student_id`.", sol: "SELECT s.full_name, d.name AS department FROM campus.students AS s JOIN campus.departments AS d USING (department_id) ORDER BY s.student_id;", need: ["USING"] },
        { t: "sql", q: "Pour la commande 104 : nom de chaque produit acheté (`name`) et `quantity`, triés par `name`.", sol: "SELECT p.name, i.quantity FROM campus.order_items AS i JOIN campus.products AS p USING (product_id) WHERE i.order_id = 104 ORDER BY p.name;" },
        { t: "qcm", q: "`JOIN` écrit seul signifie :", o: ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "FULL JOIN"], a: 0 },
      ],
    },
    {
      id: "j2-left",
      title: "LEFT JOIN, ON contre WHERE",
      learn: [
        "`LEFT JOIN` conserve **chaque ligne de la table de gauche**. Sans correspondance, SQL fournit NULL pour les colonnes de droite. Plusieurs correspondances à droite peuvent quand même multiplier les lignes (Eva apparaît deux fois, Farah une fois avec NULL).",
        "Une condition sur la table de droite placée **dans ON** limite ce qui peut correspondre et garde les lignes de gauche. Placée **dans WHERE**, elle élimine les lignes sans correspondance, car leur NULL ne rend pas la condition vraie.",
        "Pour trouver les absents (**anti-jointure**) : `LEFT JOIN … WHERE o.order_id IS NULL`, en testant une clé **non nulle du côté facultatif**.",
      ],
      code: `SELECT s.full_name, o.order_id
FROM campus.students AS s
LEFT JOIN campus.orders AS o
  ON o.student_id = s.student_id AND o.status = 'paid'
WHERE s.student_id >= 5
ORDER BY s.student_id, o.order_id;`,
      retiens: "ON décide quelles paires correspondent ; WHERE décide quelles lignes du résultat restent.",
      keys: [
        ["LEFT JOIN", "Garder les lignes de gauche ; NULL à droite sans correspondance."],
        ["Ligne sans correspondance", "Ligne de gauche pour laquelle ON ne trouve aucun partenaire."],
        ["Anti-jointure", "LEFT JOIN + IS NULL sur une clé de droite."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : étudiants qui n'ont jamais passé de commande : `student_id`, `full_name` (LEFT JOIN + IS NULL).", sol: "SELECT s.student_id, s.full_name FROM campus.students AS s LEFT JOIN campus.orders AS o ON o.student_id = s.student_id WHERE o.order_id IS NULL ORDER BY s.student_id;", need: ["LEFT JOIN", "IS NULL"], why: "Seule Farah n'a aucune commande." },
        { t: "qcm", q: "Farah (sans commande) reste-t-elle dans le résultat ?", code: "… LEFT JOIN campus.orders AS o ON o.student_id = s.student_id\nWHERE o.status = 'paid'", o: ["Non : son status est NULL, la condition WHERE n'est pas vraie", "Oui", "Oui, avec un status NULL", "Erreur"], a: 0, why: "Pour la garder, la condition sur o.status doit aller dans ON." },
        { t: "qcm", q: "Pour détecter l'absence de correspondance, quelle colonne tester avec IS NULL ?", o: ["Une clé non nulle de la table de droite (o.order_id)", "s.student_id", "N'importe quelle colonne de gauche", "o.status"], a: 0, why: "s.student_id reste présent sur la ligne préservée : le tester ne trouverait personne." },
        { t: "sql", q: "Tous les étudiants avec leur nombre de commandes (`nb_orders`), y compris 0 : `student_id`, `nb_orders`, triés par `student_id`.", sol: "SELECT s.student_id, COUNT(o.order_id) AS nb_orders FROM campus.students AS s LEFT JOIN campus.orders AS o ON o.student_id = s.student_id GROUP BY s.student_id ORDER BY s.student_id;", hint: "COUNT(o.order_id) ignore le NULL de Farah ; COUNT(*) compterait sa ligne préservée." },
      ],
    },
    {
      id: "j2-full",
      title: "RIGHT, FULL et CROSS JOIN",
      learn: [
        "`RIGHT JOIN` préserve la table de droite (inverser les tables avec LEFT JOIN exprime le même choix). `FULL JOIN` préserve les lignes sans correspondance **des deux côtés**. `OUTER` est facultatif.",
        "`(VALUES ('Alice'), ('Bilal')) AS a(name)` utilise des lignes littérales comme une table `a` à une colonne `name`.",
        "`CROSS JOIN` associe **chaque** ligne de gauche à **chaque** ligne de droite, sans ON : c'est le **produit cartésien**. 2 × 2 = 4 lignes. Compte les combinaisons voulues avant de les générer ; oublier une condition de jointure produit la même multiplication par accident.",
      ],
      code: `SELECT a.name AS roster, b.name AS signup
FROM (VALUES ('Alice'), ('Bilal')) AS a(name)
FULL JOIN (VALUES ('Bilal'), ('Chloe')) AS b(name)
  ON a.name = b.name
ORDER BY a.name, b.name;`,
      keys: [
        ["RIGHT JOIN", "Garder chaque ligne de droite."],
        ["FULL JOIN", "Garder les lignes sans correspondance des deux côtés."],
        ["CROSS JOIN", "Toutes les paires possibles."],
        ["Produit cartésien", "Toutes les combinaisons de lignes."],
        ["AS a(name)", "Nommer une source de lignes et ses colonnes."],
      ],
      ex: [
        { t: "qcm", q: "`campus.products` (6 lignes) `CROSS JOIN` une liste de 3 campus : combien de lignes ?", o: ["18", "9", "6", "3"], a: 0 },
        { t: "qcm", q: "Combien de lignes renvoie l'exemple FULL JOIN (Alice, Bilal) / (Bilal, Chloe) ?", o: ["3", "2", "4", "1"], a: 0, why: "Bilal correspond ; Alice reste avec signup NULL ; Chloe reste avec roster NULL." },
        { t: "qcm", q: "Quelle jointure garde les lignes sans correspondance des DEUX côtés ?", o: ["FULL JOIN", "LEFT JOIN", "INNER JOIN", "CROSS JOIN"], a: 0 },
        { t: "sql", q: "Toutes les paires (produit, campus) pour les produits 1 et 2 et les campus 'north' et 'south' : `name`, `campus`, triées par `product_id` puis `campus`.", sol: "SELECT p.name, c.campus FROM campus.products AS p CROSS JOIN (VALUES ('north'), ('south')) AS c(campus) WHERE p.product_id IN (1, 2) ORDER BY p.product_id, c.campus;", need: ["CROSS JOIN"] },
      ],
    },
    {
      id: "j2-self",
      title: "Autojointure",
      learn: [
        "Une **autojointure** joint une table à elle-même avec deux alias de rôle. Dans `categories`, `parent_id` désigne une autre catégorie de la même table : l'alias `child` fournit chaque catégorie, l'alias `parent` celle dont elle dépend.",
        "`LEFT JOIN` conserve la racine All, dont le `parent_id` est NULL. Aucune ligne n'est copiée : la même table apparaît deux fois dans la requête.",
      ],
      code: `SELECT child.name AS category, parent.name AS parent_category
FROM campus.categories AS child
LEFT JOIN campus.categories AS parent
  ON parent.category_id = child.parent_id
ORDER BY child.category_id;`,
      keys: [
        ["Autojointure", "La même table utilisée deux fois, avec des alias de rôle différents."],
        ["parent_id", "Identifiant de la catégorie immédiatement au-dessus."],
      ],
      ex: [
        { t: "sql", q: "Chaque catégorie (`category`) avec le nom de son parent (`parent_category`), en gardant All, triées par `category_id`.", sol: "SELECT child.name AS category, parent.name AS parent_category FROM campus.categories AS child LEFT JOIN campus.categories AS parent ON parent.category_id = child.parent_id ORDER BY child.category_id;" },
        { t: "qcm", q: "Pourquoi LEFT JOIN plutôt que JOIN dans cette autojointure ?", o: ["Pour garder All, qui n'a pas de parent", "Pour éviter les doublons", "Pour trier", "C'est obligatoire pour une autojointure"], a: 0 },
        { t: "fill", q: "Une jointure d'une table avec elle-même s'appelle une ___", a: ["autojointure", "auto-jointure", "self join", "self-join"] },
      ],
    },
    {
      id: "j2-joinagg",
      title: "Jointures et agrégation",
      learn: [
        "Après une jointure, l'agrégation résume les lignes qu'elle reçoit. Ici, `WHERE` garde d'abord les commandes payées, `GROUP BY` forme un groupe par commande, puis `HAVING` garde les totaux d'au moins 70.",
        "Le chiffre d'affaires se calcule avec le **prix historique** de la ligne (`i.unit_price`), pas le prix actuel du produit. La commande annulée 106 (100 €) n'entre jamais : WHERE l'élimine avant le regroupement.",
      ],
      code: `SELECT o.order_id, SUM(i.quantity * i.unit_price) AS revenue
FROM campus.orders AS o
JOIN campus.order_items AS i USING (order_id)
WHERE o.status = 'paid'
GROUP BY o.order_id
HAVING SUM(i.quantity * i.unit_price) >= 70
ORDER BY o.order_id;`,
      retiens: "Écris le filtre des lignes avant de calculer la synthèse des groupes.",
      keys: [
        ["Prix historique", "Prix de vente stocké dans la ligne de commande."],
        ["Regrouper par identifiant", "GROUP BY s.student_id, s.full_name : l'identifiant fait le groupe, le nom s'affiche."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : étudiants dont le CA payé atteint au moins 100 : `full_name`, `revenue`, triés par `student_id`.", sol: "SELECT s.full_name, SUM(i.quantity * i.unit_price) AS revenue FROM campus.students AS s JOIN campus.orders AS o USING (student_id) JOIN campus.order_items AS i USING (order_id) WHERE o.status = 'paid' GROUP BY s.student_id, s.full_name HAVING SUM(i.quantity * i.unit_price) >= 100 ORDER BY s.student_id;", need: ["HAVING"], why: "Alice 120, Bilal 140, Chloe 115. Diego et Eva ont 50 ; Farah n'a pas de commande." },
        { t: "qcm", q: "La commande annulée 106 (100 €) compte-t-elle dans le CA payé ?", o: ["Non, WHERE l'élimine avant le regroupement", "Oui, dans HAVING", "Oui, avec un total de 0", "Erreur"], a: 0 },
        { t: "sql", q: "CA payé par produit : `name` et `revenue`, du plus grand CA au plus petit, puis par `name`.", sol: "SELECT p.name, SUM(i.quantity * i.unit_price) AS revenue FROM campus.orders AS o JOIN campus.order_items AS i USING (order_id) JOIN campus.products AS p USING (product_id) WHERE o.status = 'paid' GROUP BY p.product_id, p.name ORDER BY revenue DESC, p.name;", why: "Le total de la colonne revenue vaut 475 : le CA payé de CampusMarket." },
      ],
    },
    {
      id: "j2-fanout",
      title: "Fanout et préagrégation",
      learn: [
        "La commande 102 a **deux** lignes d'articles et **deux** paiements. Joindre directement articles et paiements par `order_id` associe chaque article à chaque paiement : 4 paires. C'est le **fanout** : la granularité devient « paire article-paiement ».",
        "Résultat : la somme des lignes donne 140 au lieu de 70, et la somme des paiements aussi 140. Des totaux égaux ne prouvent rien quand les deux ont été multipliés par la même jointure.",
        "La correction : **préagréger** chaque source à une ligne par commande dans des **tables dérivées** (un SELECT entre parenthèses dans FROM), puis joindre ces synthèses.",
      ],
      code: `SELECT i.order_id, i.total AS line_total, p.total AS payment_total
FROM (SELECT order_id, SUM(quantity * unit_price) AS total
      FROM campus.order_items GROUP BY order_id) AS i
JOIN (SELECT order_id, SUM(amount) AS total
      FROM campus.payments GROUP BY order_id) AS p
  ON p.order_id = i.order_id
WHERE i.order_id = 102;`,
      retiens: "Avant d'additionner, vérifie que chaque montant n'apparaît qu'une fois.",
      keys: [
        ["Un-à-plusieurs", "Une ligne d'un côté correspond à plusieurs lignes de l'autre."],
        ["Fanout", "Une jointure produit plusieurs lignes pour une ligne d'origine."],
        ["Préagrégation", "Résumer chaque source à la bonne granularité avant de joindre."],
        ["Table dérivée", "SELECT entre parenthèses utilisé comme table."],
      ],
      ex: [
        { t: "qcm", q: "Commande 101 : 2 lignes d'articles, 1 paiement de 70. Après jointure directe articles–paiements, que vaut `SUM(p.amount)` ?", o: ["140", "70", "35", "210"], a: 0, why: "Chaque article est associé au même paiement : il apparaît deux fois." },
        { t: "qcm", q: "Comment corriger ce fanout ?", o: ["Préagréger chaque source à une ligne par commande, puis joindre", "Ajouter DISTINCT dans SUM", "Utiliser LEFT JOIN", "Trier par order_id"], a: 0, why: "SUM(DISTINCT) éliminerait aussi deux paiements légitimes de même montant." },
        { t: "sql", q: "Pour chaque commande qui a des paiements : `order_id`, `line_total` et `payment_total` calculés sans fanout, triés par `order_id`.", sol: "SELECT i.order_id, i.total AS line_total, p.total AS payment_total FROM (SELECT order_id, SUM(quantity * unit_price) AS total FROM campus.order_items GROUP BY order_id) AS i JOIN (SELECT order_id, SUM(amount) AS total FROM campus.payments GROUP BY order_id) AS p ON p.order_id = i.order_id ORDER BY i.order_id;" },
        { t: "fill", q: "Une jointure qui produit plusieurs lignes de sortie pour une ligne d'origine crée un ___", a: ["fanout"] },
      ],
    },
    {
      id: "j2-subq",
      title: "Sous-requêtes scalaires et corrélées",
      learn: [
        "Une **sous-requête scalaire** s'utilise là où SQL attend une valeur : une colonne, **au plus une ligne**. Sans ligne elle donne NULL ; avec plusieurs lignes, c'est une erreur. Exemple : comparer chaque produit actif au prix actif maximum.",
        "Une **sous-requête corrélée** référence une colonne de la requête externe. `q.category_id = p.category_id` compare chaque produit `p` à la moyenne de **sa** catégorie, pas du catalogue entier. Le produit courant est inclus dans sa propre moyenne.",
      ],
      code: `SELECT p.name, p.unit_price
FROM campus.products AS p
WHERE p.unit_price > (
  SELECT AVG(q.unit_price)
  FROM campus.products AS q
  WHERE q.category_id = p.category_id
)
ORDER BY p.product_id;`,
      keys: [
        ["Scalaire", "Une seule valeur, pas une table."],
        ["Sous-requête scalaire", "Une colonne, au plus une ligne."],
        ["Sous-requête corrélée", "Elle utilise une valeur de la ligne externe courante."],
        ["Requête externe", "La requête qui contient la sous-requête."],
      ],
      ex: [
        { t: "sql", q: "Produits plus chers que le prix moyen de tous les produits : `name`, `unit_price`, triés par `product_id` (sous-requête scalaire).", sol: "SELECT name, unit_price FROM campus.products WHERE unit_price > (SELECT AVG(unit_price) FROM campus.products) ORDER BY product_id;", need: ["AVG"] },
        { t: "qcm", q: "Une sous-requête scalaire renvoie 2 lignes. Que se passe-t-il ?", o: ["Une erreur", "Elle prend la première", "NULL", "Elle prend le maximum"], a: 0 },
        { t: "qcm", q: "Keyboard est seul dans sa catégorie. `p.unit_price > AVG(de sa catégorie)` est-il vrai ?", o: ["Non : son prix égale la moyenne de sa catégorie", "Oui", "Inconnu", "Erreur"], a: 0 },
        { t: "fill", q: "Une sous-requête qui utilise une colonne de la requête externe est dite ___", a: ["corrélée", "correlee"] },
      ],
    },
    {
      id: "j2-exists",
      title: "EXISTS et NOT EXISTS",
      learn: [
        "`EXISTS (sous-requête)` est vrai si la sous-requête renvoie **au moins une ligne**. `NOT EXISTS` inverse le test. On l'utilise quand la question porte sur la présence ou l'absence d'une relation, pas sur l'affichage des lignes liées. Le `SELECT 1` interne est une convention : seule la présence de lignes compte.",
        "La granularité reste celle de la requête externe : chaque étudiant sort **une fois**, même s'il a plusieurs commandes payées. Aucun DISTINCT n'est nécessaire.",
      ],
      code: `SELECT s.student_id, s.full_name
FROM campus.students AS s
WHERE EXISTS (
  SELECT 1 FROM campus.orders AS o
  WHERE o.student_id = s.student_id AND o.status = 'paid'
)
ORDER BY s.student_id;`,
      retiens: "Choisis EXISTS quand l'information utile est l'existence d'une correspondance.",
      keys: [
        ["EXISTS", "Vrai si la sous-requête produit au moins une ligne."],
        ["NOT EXISTS", "Vrai si la sous-requête ne produit aucune ligne."],
        ["SELECT 1", "Constante conventionnelle dans EXISTS."],
      ],
      ex: [
        { t: "sql", q: "Exercice du cours : étudiants **sans** commande payée : `student_id`, `full_name`, triés par `student_id` (NOT EXISTS).", sol: "SELECT s.student_id, s.full_name FROM campus.students AS s WHERE NOT EXISTS (SELECT 1 FROM campus.orders AS o WHERE o.student_id = s.student_id AND o.status = 'paid') ORDER BY s.student_id;", need: ["NOT EXISTS"] },
        { t: "qcm", q: "Pourquoi EXISTS n'a-t-il pas besoin de DISTINCT ?", o: ["Il teste seulement la présence : il ne crée pas de ligne par commande", "DISTINCT est implicite partout", "À cause de SELECT 1", "Il en a besoin"], a: 0 },
        { t: "qcm", q: "Eva a une commande annulée et une payée. Fait-elle partie des étudiants « sans commande payée » ?", o: ["Non, sa commande 109 est payée", "Oui", "Oui, deux fois", "Ça dépend du tri"], a: 0, why: "Chercher « une commande non payée » serait une autre question, qui inclurait Eva à tort." },
        { t: "sql", q: "Catégories qui ne contiennent directement aucun produit : `name` (NOT EXISTS).", sol: "SELECT c.name FROM campus.categories AS c WHERE NOT EXISTS (SELECT 1 FROM campus.products AS p WHERE p.category_id = c.category_id);", need: ["NOT EXISTS"] },
      ],
    },
    {
      id: "j2-in-any",
      title: "IN, NOT IN et NULL ; ANY et ALL",
      learn: [
        "`IN` peut comparer une valeur aux lignes d'une sous-requête à une colonne. Mais avec un **NULL** dans la liste, `6 NOT IN (1, NULL)` vaut **inconnu** : NULL pourrait être 6. WHERE écarte alors le candidat 6, même s'il n'est pas dans les valeurs connues.",
        "Pour une question d'absence, `NOT EXISTS` exprime directement la règle : une comparaison avec NULL ne compte pas comme correspondance, donc 6 est gardé.",
        "`> ANY (…)` réussit si **au moins une** comparaison est vraie ; `> ALL (…)` exige qu'elles le soient **toutes** (un ensemble vide est accepté). `SOME` est un synonyme de ANY ; `IN` équivaut à `= ANY`.",
      ],
      code: `SELECT v.n,
  v.n IN (VALUES (1), (NULL)) AS in_set,
  v.n NOT IN (VALUES (1), (NULL)) AS not_in_set
FROM (VALUES (1), (6)) AS v(n)
ORDER BY v.n;`,
      retiens: "Question d'absence + NULL possibles : préfère NOT EXISTS à NOT IN.",
      keys: [
        ["IN (sous-requête)", "Égalité avec l'une des valeurs renvoyées."],
        ["NOT IN", "Aucune valeur égale ; un NULL rend le test inconnu."],
        ["ANY / SOME", "Au moins une comparaison vraie."],
        ["ALL", "Toutes les comparaisons vraies."],
      ],
      ex: [
        { t: "qcm", q: "Que renvoie cette requête ?", code: "SELECT 6 NOT IN (1, NULL);", o: ["NULL (inconnu)", "true", "false", "Une erreur"], a: 0 },
        { t: "qcm", q: "Pour une question d'absence avec des NULL possibles, que préférer ?", o: ["NOT EXISTS", "NOT IN", "IN", "= ALL"], a: 0 },
        { t: "qcm", q: "Pour USB Hub (30 €), que vaut `unit_price > ALL (VALUES (20), (30))` ?", o: ["false", "true", "NULL", "Une erreur"], a: 0, why: "30 > 20 est vrai mais 30 > 30 est faux. Avec >=, ce serait vrai." },
        { t: "fill", q: "`IN` est équivalent à l'opérateur `= ___`", a: ["ANY", "SOME"] },
      ],
    },
    {
      id: "j2-sets",
      title: "UNION, INTERSECT et EXCEPT",
      learn: [
        "Une **opération ensembliste** empile verticalement des résultats complets, au lieu de rattacher des colonnes comme une jointure. Les deux requêtes doivent renvoyer le même nombre de colonnes, de types compatibles. Le `ORDER BY` final trie le résultat combiné.",
        "`UNION` élimine les lignes entières répétées ; `UNION ALL` les garde (indispensable pour additionner des transactions). `INTERSECT` garde les lignes présentes des deux côtés ; `EXCEPT` garde celles du premier absentes du second : **le sens compte**.",
      ],
      code: `SELECT n FROM (VALUES (1), (1), (2)) AS a(n)
UNION
SELECT n FROM (VALUES (2), (3)) AS b(n)
ORDER BY n;
SELECT n FROM (VALUES (1), (1), (2)) AS a(n)
UNION ALL
SELECT n FROM (VALUES (2), (3)) AS b(n)
ORDER BY n;`,
      retiens: "Lis EXCEPT comme « premier résultat moins second résultat ».",
      keys: [
        ["UNION", "Combiner en éliminant les doublons."],
        ["UNION ALL", "Combiner en gardant chaque occurrence."],
        ["INTERSECT", "Lignes présentes dans les deux résultats."],
        ["EXCEPT", "Lignes du premier absentes du second."],
      ],
      ex: [
        { t: "qcm", q: "A = 1, 1, 2 et B = 2, 3. Combien de lignes renvoie `A UNION ALL B` ?", o: ["5", "3", "4", "2"], a: 0 },
        { t: "qcm", q: "Même A et B : que renvoie `A EXCEPT B` ?", o: ["1 (une seule ligne)", "1, 1", "3", "2"], a: 0, why: "EXCEPT élimine par défaut les lignes répétées." },
        { t: "qcm", q: "Et `B EXCEPT A` ?", o: ["3", "1", "2", "2, 3"], a: 0 },
        { t: "sql", q: "Les `product_id` vendus dans la commande 101 **ou** la commande 102, sans doublon, triés.", sol: "SELECT product_id FROM campus.order_items WHERE order_id = 101 UNION SELECT product_id FROM campus.order_items WHERE order_id = 102 ORDER BY product_id;", need: ["UNION"] },
        { t: "sql", q: "Les `product_id` présents **à la fois** dans la commande 101 et la commande 102.", sol: "SELECT product_id FROM campus.order_items WHERE order_id = 101 INTERSECT SELECT product_id FROM campus.order_items WHERE order_id = 102;", need: ["INTERSECT"] },
      ],
    },
    {
      id: "j2-division",
      title: "Division relationnelle",
      learn: [
        "« A acheté **chaque** produit requis » est une question de **division relationnelle** : trouver les candidats liés à chaque membre d'un ensemble requis. Ce n'est pas un mot-clé : c'est un modèle de question.",
        "On la traduit par « **aucun** produit requis ne **manque** » : un `NOT EXISTS` externe cherche un produit requis pour lequel le `NOT EXISTS` interne (l'achat) échoue. Si une seule exigence manque, l'étudiant est écarté. Acheter d'autres produits est permis.",
        "Avec l'ensemble requis {Keyboard, Mouse}, seule Chloe est retenue (commande 104). Si l'ensemble requis était vide, **tous** les étudiants seraient retenus.",
      ],
      code: `SELECT s.student_id, s.full_name
FROM campus.students AS s
WHERE NOT EXISTS (
  SELECT 1 FROM (VALUES (1), (2)) AS r(product_id)
  WHERE NOT EXISTS (
    SELECT 1
    FROM campus.orders AS o
    JOIN campus.order_items AS i USING (order_id)
    WHERE o.student_id = s.student_id
      AND o.status = 'paid'
      AND i.product_id = r.product_id))
ORDER BY s.student_id;`,
      retiens: "« Chaque exigence » = « aucune exigence ne manque » = double NOT EXISTS.",
      keys: [
        ["Division relationnelle", "Candidats liés à chaque membre d'un ensemble requis."],
        ["Ensemble requis", "Exigences que chaque candidat doit couvrir."],
      ],
      ex: [
        { t: "qcm", q: "Qui a acheté (commandes payées) Keyboard ET Mouse ?", o: ["Chloe seulement", "Alice et Chloe", "Bilal et Chloe", "Personne"], a: 0 },
        { t: "qcm", q: "Si l'ensemble requis était vide, qui serait retenu ?", o: ["Tous les étudiants", "Personne", "Une erreur", "Seulement ceux qui ont commandé"], a: 0, why: "Aucune exigence ne peut manquer, donc aucun étudiant n'est écarté." },
        { t: "fill", q: "« A acheté chaque produit requis » se traduit par « aucun produit requis ne ___ ».", a: ["manque"] },
        { t: "sql", q: "Étudiants ayant acheté (commandes payées) à la fois Keyboard (1) et Bottle (4) : `student_id`, `full_name`, triés par `student_id`.", sol: "SELECT s.student_id, s.full_name FROM campus.students AS s WHERE NOT EXISTS (SELECT 1 FROM (VALUES (1), (4)) AS r(product_id) WHERE NOT EXISTS (SELECT 1 FROM campus.orders AS o JOIN campus.order_items AS i USING (order_id) WHERE o.student_id = s.student_id AND o.status = 'paid' AND i.product_id = r.product_id)) ORDER BY s.student_id;", why: "Alice (commande 101) et Chloe (104 et 108) couvrent les deux produits." },
      ],
    },
  ],
});
