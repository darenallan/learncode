/* Jour 4 · Protéger le travail concurrent (Day_04_Student_Lessons.pdf). Format : voir jour1.js.
   Les expériences à deux sessions (A et B) se travaillent en prédiction : PGlite n'a qu'une connexion. */
const STOCK_DEMO = `CREATE TABLE work.stock_demo (
  product_id integer PRIMARY KEY,
  stock integer NOT NULL CHECK (stock >= 0)
);
INSERT INTO work.stock_demo VALUES (1, 5), (2, 5);
`;

COURS.day("sql-avance", {
  id: "j4",
  label: "Jour 4",
  title: "Protéger le travail concurrent",
  summary: "Transactions et ACID, points de sauvegarde, MVCC et niveaux d'isolement, anomalies, verrous, interblocages, upsert, MERGE et idempotence.",
  bricks: [
    {
      id: "j4-acid",
      title: "Transactions et ACID",
      learn: [
        "Une **transaction** est un groupe d'opérations traité comme une **unité de travail**. Transférer 20 € d'Alice à Bilal : retirer à Alice sans ajouter à Bilal ferait perdre de l'argent (100 + 40 = 140 deviendrait 80 + 40 = 120). Un passage en caisse qui réserve plusieurs produits a le même problème : tout réussit, ou rien ne subsiste.",
        "**ACID** désigne quatre garanties distinctes. **Atomicité** : toutes les modifications subsistent, ou aucune. **Cohérence** : les contraintes et règles correctement écrites restent vraies. **Isolement** : règles d'interaction entre transactions simultanées. **Durabilité** : une validation confirmée survit à un redémarrage.",
        "ACID ne corrige pas une réservation mal écrite : la cohérence dépend des règles que tu as déclarées.",
      ],
      retiens: "Atomicité = tout ou rien. Cohérence = règles respectées. Isolement = pas d'interférence. Durabilité = survit au redémarrage.",
      keys: [
        ["Transaction", "Groupe d'opérations acceptées ou annulées ensemble."],
        ["Atomicité", "Toutes les modifications subsistent, ou aucune."],
        ["Cohérence", "Les contraintes déclarées restent satisfaites."],
        ["Isolement", "Règles d'interaction entre transactions simultanées."],
        ["Durabilité", "Une validation confirmée est conservée."],
      ],
      ex: [
        { t: "qcm", q: "« Le produit 2 ne peut pas être réservé, donc on annule aussi le produit 1 » illustre :", o: ["L'atomicité", "La cohérence", "L'isolement", "La durabilité"], a: 0 },
        { t: "qcm", q: "`CHECK (stock >= 0)` rejette un stock négatif. Quelle propriété ?", o: ["La cohérence", "L'atomicité", "L'isolement", "La durabilité"], a: 0 },
        { t: "qcm", q: "Un autre passage en caisse ne peut pas lire notre modification de stock inachevée :", o: ["L'isolement", "La durabilité", "L'atomicité", "La cohérence"], a: 0 },
        { t: "qcm", q: "Après une validation réussie, la réservation survit à un redémarrage du serveur :", o: ["La durabilité", "L'isolement", "La cohérence", "L'atomicité"], a: 0 },
        { t: "fill", q: "ACID = atomicité, cohérence, isolement et ___", a: ["durabilité", "durabilite"] },
      ],
    },
    {
      id: "j4-savepoint",
      title: "COMMIT, ROLLBACK et SAVEPOINT",
      learn: [
        "`BEGIN` ouvre une transaction explicite ; `COMMIT` l'accepte ; `ROLLBACK` annule ses modifications. La valeur que renvoie `RETURNING` montre ce que **ta** connexion voit, pas qu'une validation a eu lieu : elle peut encore être annulée.",
        "Un **point de sauvegarde** (`SAVEPOINT nom`) marque une position dans la transaction. `ROLLBACK TO SAVEPOINT nom` annule le travail fait **après** ce repère et garde le travail antérieur. Un savepoint ne valide rien à lui seul : il faut toujours COMMIT.",
        "Si une instruction provoque une **erreur**, la transaction est **en échec** : elle refuse tout travail jusqu'à ROLLBACK, ou jusqu'au retour à un savepoint posé avant l'erreur.",
      ],
      code: STOCK_DEMO + `BEGIN;
UPDATE work.stock_demo SET stock = stock - 1 WHERE product_id = 1;
SAVEPOINT before_optional;
UPDATE work.stock_demo SET stock = stock - 2 WHERE product_id = 2;
ROLLBACK TO SAVEPOINT before_optional;
COMMIT;
SELECT product_id, stock FROM work.stock_demo ORDER BY product_id;`,
      retiens: "Un SAVEPOINT permet d'annuler une partie ; seul COMMIT valide.",
      keys: [
        ["BEGIN", "Démarre un bloc de transaction explicite."],
        ["COMMIT", "Accepte les modifications de la transaction."],
        ["ROLLBACK", "Annule les modifications de la transaction."],
        ["SAVEPOINT nom", "Nomme un point d'annulation partielle."],
        ["ROLLBACK TO SAVEPOINT", "Annule le travail après le repère, garde l'antérieur."],
        ["Transaction en échec", "Après une erreur : rien ne passe avant récupération."],
      ],
      ex: [
        { t: "qcm", q: "Dans l'exemple (5 et 5 au départ), quel est le stock final des produits 1 et 2 ?", o: ["4 et 5", "4 et 3", "5 et 5", "1 et 3"], a: 0, why: "La réservation du produit 1 précède le repère ; celle du produit 2 le suit et est annulée." },
        { t: "qcm", q: "Une instruction échoue au milieu d'une transaction. Ensuite ?", o: ["La transaction refuse tout jusqu'à ROLLBACK (ou retour à un savepoint antérieur)", "Elle continue normalement", "Elle valide automatiquement", "Elle redémarre"], a: 0 },
        { t: "sql", q: "Dans une transaction : retire 2 unités au produit 1 de `campus.products`, pose `SAVEPOINT avant_bonus`, retire 5 unités au produit 2, reviens au savepoint, puis valide.", sol: "BEGIN;\nUPDATE campus.products SET stock = stock - 2 WHERE product_id = 1;\nSAVEPOINT avant_bonus;\nUPDATE campus.products SET stock = stock - 5 WHERE product_id = 2;\nROLLBACK TO SAVEPOINT avant_bonus;\nCOMMIT;", verify: "SELECT product_id, stock FROM campus.products WHERE product_id IN (1, 2) ORDER BY product_id;", ordered: true, need: ["SAVEPOINT", "ROLLBACK TO", "COMMIT"], why: "Produit 1 : 20 → 18. Produit 2 : 30 → 25, puis retour à 30." },
        { t: "fill", q: "Pour annuler seulement le travail fait après un repère : `ROLLBACK TO ___ nom`", a: ["SAVEPOINT"] },
      ],
    },
    {
      id: "j4-panier",
      title: "Réussite SQL contre réussite métier",
      learn: [
        "Un client veut 4 unités du produit 1 **et** 6 du produit 2 (5 en stock chacun), et n'accepte le panier que si les deux réservations réussissent. Une **garde de réservation** dans le WHERE (`AND stock >= 6`) n'autorise la modification que si le stock suffit.",
        "Le second UPDATE ne renvoie **aucune ligne** : ce n'est **pas** une erreur SQL, la condition ne correspond simplement à rien. L'application doit examiner RETURNING et décider : ici, ROLLBACK, car valider la première réservation seule violerait la règle du client.",
      ],
      code: STOCK_DEMO + `BEGIN;
UPDATE work.stock_demo SET stock = stock - 4
WHERE product_id = 1 AND stock >= 4
RETURNING product_id, stock;
UPDATE work.stock_demo SET stock = stock - 6
WHERE product_id = 2 AND stock >= 6
RETURNING product_id, stock;
ROLLBACK;`,
      retiens: "« Pas d'erreur » ne veut pas dire « réservation faite » : lis RETURNING avant de valider.",
      keys: [
        ["Garde de réservation", "Condition WHERE qui n'autorise l'écriture que si le stock suffit."],
        ["Zéro ligne", "Aucune ligne n'a satisfait la condition : rien n'a été modifié."],
        ["Réussite SQL", "La commande s'est exécutée sans erreur."],
        ["Réussite métier", "L'action complète respecte la règle du client."],
      ],
      ex: [
        { t: "qcm", q: "Le 2e UPDATE (`stock >= 6` sur un stock de 5) ne renvoie aucune ligne. Est-ce une erreur SQL ?", o: ["Non : c'est du SQL valide, mais la réservation n'a pas eu lieu", "Oui, une erreur CHECK", "Oui, la transaction est en échec", "Non, et le stock devient -1"], a: 0 },
        { t: "qcm", q: "Le panier exige les deux produits et la 2e réservation a échoué. Quelle fin de transaction ?", o: ["ROLLBACK", "COMMIT", "SAVEPOINT", "Ne rien faire"], a: 0 },
        { t: "sql", q: "Réservation protégée : retire 15 unités du produit 1 de `campus.products` seulement si le stock suffit, et renvoie `product_id`, `stock`.", sol: "UPDATE campus.products SET stock = stock - 15 WHERE product_id = 1 AND stock >= 15 RETURNING product_id, stock;", need: [">=", "RETURNING"], why: "20 ≥ 15 : la ligne (1, 5) est renvoyée." },
        { t: "sql", q: "Même réservation protégée avec **25** unités (stock actuel : 20). Elle doit ne renvoyer aucune ligne.", sol: "UPDATE campus.products SET stock = stock - 25 WHERE product_id = 1 AND stock >= 25 RETURNING product_id, stock;", need: [">=", "RETURNING"] },
      ],
    },
    {
      id: "j4-mvcc",
      title: "Sessions, MVCC, validé et visible",
      learn: [
        "Une **connexion** est un échange client–serveur ; la **session** est son contexte côté serveur (transaction ouverte, paramètres). Deux sessions sont **concurrentes** si leurs transactions ouvertes se chevauchent dans le temps, même sans frappes simultanées.",
        "La session A fait `BEGIN; UPDATE … stock 5 → 1` sans valider. A voit 1 (ses propres écritures). B, avec un SELECT ordinaire, voit **5** : elle ne lit jamais une valeur non validée. Après le COMMIT de A, un **nouveau** SELECT de B voit 1.",
        "PostgreSQL utilise le **MVCC** (contrôle de concurrence multiversion) : il garde des versions des lignes pour que chaque lecteur utilise un **instantané** validé adapté. Un SELECT ordinaire **n'attend pas** l'écrivain ; un UPDATE de la même ligne, lui, **attend** la fin de A.",
      ],
      retiens: "Validé = accepté par l'auteur. Visible = inclus dans la vue d'un lecteur donné. Ce n'est pas la même chose.",
      keys: [
        ["Session", "État côté serveur associé à une connexion."],
        ["Concurrent", "Transactions dont les périodes se chevauchent."],
        ["Non validé", "Modifié dans une transaction pas encore validée."],
        ["MVCC", "Les lecteurs utilisent des versions stockées des lignes."],
        ["Instantané", "Versions validées visibles à un moment donné, plus ses propres écritures."],
      ],
      ex: [
        { t: "qcm", q: "A : `BEGIN; UPDATE stock 5 → 1` (pas de COMMIT). B : `SELECT stock`. B voit :", o: ["5", "1", "B attend", "Une erreur"], a: 0 },
        { t: "qcm", q: "Pendant ce temps, B lance un UPDATE sur la même ligne :", o: ["B attend la fin de A", "B écrase la modification de A", "Erreur immédiate", "B lit 1"], a: 0 },
        { t: "qcm", q: "A fait COMMIT, puis B relance son SELECT (niveau par défaut) :", o: ["1", "5", "B attend", "NULL"], a: 0 },
        { t: "qcm", q: "« Validé » et « visible » sont :", o: ["Liés mais différents : validé = accepté par l'auteur, visible = dans la vue d'un lecteur", "Synonymes", "Visible implique non validé", "Sans rapport"], a: 0 },
        { t: "fill", q: "Le contrôle de concurrence multiversion de PostgreSQL s'abrège ___", a: ["MVCC"] },
      ],
    },
    {
      id: "j4-isolation",
      title: "Read Committed, Repeatable Read, fantômes",
      learn: [
        "Un **niveau d'isolement** choisit les règles de visibilité. **READ COMMITTED** (par défaut) : chaque instruction démarre avec une **nouvelle** vue validée. Si A lit 5, que B valide 4, puis que A relit : A voit 4. C'est une **lecture non répétable** (permise), **pas** une lecture sale.",
        "Une **lecture sale** serait voir une modification non validée d'une autre transaction : PostgreSQL l'interdit toujours, même en `READ UNCOMMITTED` (traité comme Read Committed).",
        "**REPEATABLE READ** fixe son instantané à la **première instruction réelle** (pas au BEGIN) et le garde : A continue de voir 4 même après que B a validé 3. Une **lecture fantôme** est un ensemble de lignes qui change (un count passe de 2 à 3 après un INSERT validé) ; Repeatable Read de PostgreSQL l'évite aussi.",
      ],
      code: `BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT stock FROM campus.products WHERE product_id = 1;
ROLLBACK;`,
      retiens: "RC : nouvelle vue à chaque instruction. RR : une vue pour toute la transaction, prise à la 1re instruction.",
      keys: [
        ["Niveau d'isolement", "Règles de visibilité et de conflit d'une transaction."],
        ["READ COMMITTED", "Chaque instruction voit les données validées avant son début."],
        ["REPEATABLE READ", "Un instantané conservé pour toute la transaction."],
        ["Lecture non répétable", "Relire une ligne donne une valeur validée entre-temps."],
        ["Lecture sale", "Lire une valeur non validée : interdit dans PostgreSQL."],
        ["Lecture fantôme", "Une condition répétée renvoie un autre ensemble de lignes."],
      ],
      ex: [
        { t: "qcm", q: "Read Committed : A lit 5, B valide 4, A relit dans la même transaction. A voit :", o: ["4", "5", "A attend", "Erreur 40001"], a: 0 },
        { t: "qcm", q: "Comment s'appelle ce phénomène ?", o: ["Lecture non répétable", "Lecture sale", "Lecture fantôme", "Interblocage"], a: 0 },
        { t: "qcm", q: "PostgreSQL autorise-t-il les lectures sales ?", o: ["Non, même READ UNCOMMITTED se comporte comme Read Committed", "Oui en READ UNCOMMITTED", "Oui par défaut", "Seulement en SERIALIZABLE"], a: 0 },
        { t: "qcm", q: "Repeatable Read : A fait seulement BEGIN, B valide 4, puis A fait son premier SELECT. A voit :", o: ["4 : l'instantané est pris à la première instruction réelle", "5", "A attend", "NULL"], a: 0 },
        { t: "qcm", q: "Dans la même transaction, `count(*) WHERE stock > 0` passe de 2 à 3 après un INSERT validé par B :", o: ["Une lecture fantôme", "Une lecture sale", "Une mise à jour perdue", "Une anomalie d'écriture"], a: 0 },
        { t: "sql", q: "Démarre une transaction en REPEATABLE READ, lis le stock du produit 1 de `campus.products`, puis termine-la par ROLLBACK.", sol: "BEGIN ISOLATION LEVEL REPEATABLE READ;\nSELECT stock FROM campus.products WHERE product_id = 1;\nROLLBACK;", need: ["REPEATABLE READ", "ROLLBACK"] },
      ],
    },
    {
      id: "j4-serializable",
      title: "Anomalie d'écriture et SERIALIZABLE",
      learn: [
        "Règle : au moins un des deux membres d'une équipe reste de garde. Sous Repeatable Read, A et B comptent chacun **2** personnes de garde, A retire la personne 1, B la personne 2, et toutes deux valident : **plus personne**. C'est une **anomalie d'écriture** : lectures stables, lignes différentes, règle commune violée.",
        "**SERIALIZABLE** exige que les transactions réussies aient un effet possible dans **un ordre séquentiel**. PostgreSQL fait alors échouer l'une des deux avec le SQLSTATE **40001** (`serialization_failure`).",
        "Réessayer, c'est rejouer **toute la décision** : ROLLBACK, nouvelle transaction, **relire** l'effectif (maintenant 1), puis décider. Ici, B doit rester de garde : aucun UPDATE. Recopier l'ancien UPDATE serait faux. Les nouvelles tentatives sont **bornées**.",
      ],
      retiens: "Après 40001 : on ne rejoue pas l'écriture, on rejoue la lecture et la décision.",
      keys: [
        ["Anomalie d'écriture", "Écritures sur des lignes différentes qui violent ensemble une règle."],
        ["Règle multi-lignes", "Condition qui dépend de plusieurs lignes à la fois."],
        ["SERIALIZABLE", "Résultat équivalent à une exécution une par une."],
        ["SQLSTATE", "Code d'erreur stable à cinq caractères."],
        ["40001", "serialization_failure."],
        ["Nouvelle tentative bornée", "Réessayer avec une limite et une issue d'échec."],
      ],
      ex: [
        { t: "qcm", q: "Repeatable Read : A et B comptent 2 personnes de garde, chacune retire une personne différente et valide. Résultat ?", o: ["0 personne de garde : anomalie d'écriture", "1 personne : PostgreSQL bloque", "Erreur 40001 pour B", "Un interblocage"], a: 0 },
        { t: "qcm", q: "Même scénario en SERIALIZABLE :", o: ["Une des validations échoue avec SQLSTATE 40001", "Les deux réussissent", "Les deux échouent toujours", "Interblocage 40P01"], a: 0 },
        { t: "qcm", q: "B reçoit 40001. Comment réessayer ?", o: ["ROLLBACK, nouvelle transaction, relire l'effectif, décider de nouveau", "Relancer seulement l'ancien UPDATE", "Refaire COMMIT", "Ignorer l'erreur"], a: 0 },
        { t: "qcm", q: "À la nouvelle tentative, l'effectif de garde vaut 1. B doit :", o: ["Rester de garde : aucun UPDATE, la règle l'interdit", "Partir quand même", "Remettre l'effectif à 2", "Attendre un interblocage"], a: 0 },
        { t: "fill", q: "Le SQLSTATE d'un échec de sérialisation est ___", a: ["40001"] },
      ],
    },
    {
      id: "j4-lost-update",
      title: "Mise à jour perdue et UPDATE protégé",
      learn: [
        "A et B lisent chacun 5, calculent chacun 5 − 4 = 1 **dans l'application**, puis écrivent `stock = 1`. Résultat : stock 1, alors que 8 unités ont été promises. C'est une **mise à jour perdue** : une **constante périmée** écrase l'effet de l'autre transaction. Aucun CHECK ne peut la détecter.",
        "Remède : un seul **UPDATE protégé** qui teste et soustrait d'un coup, sur la valeur **stockée** : `SET stock = stock - 4 WHERE … AND stock >= 4`. UPDATE prend un **verrou de ligne** : B attend A, puis **revérifie** sa condition sur la nouvelle version validée.",
        "Exemple : A réserve 3 (5 → 2), B demande 2 et attend ; après le COMMIT de A, B voit 2, sa garde passe, il renvoie 0. Une **valeur zéro** renvoyée = réservation réussie qui vide le stock ; **zéro ligne** renvoyée = aucune réservation.",
      ],
      code: STOCK_DEMO + `UPDATE work.stock_demo SET stock = stock - 3
WHERE product_id = 1 AND stock >= 3
RETURNING product_id, stock;
UPDATE work.stock_demo SET stock = stock - 2
WHERE product_id = 1 AND stock >= 2
RETURNING product_id, stock;`,
      retiens: "Jamais « lire, calculer dans l'appli, écrire une constante ». Toujours `stock = stock - n` avec une garde.",
      keys: [
        ["Mise à jour perdue", "Une écriture périmée écrase l'effet d'une autre transaction."],
        ["Valeur périmée", "Valeur lue auparavant qui n'est plus actuelle."],
        ["UPDATE protégé", "Écriture dont le WHERE impose la condition requise."],
        ["Verrou de ligne", "Bloque les modifications incompatibles de la même ligne."],
        ["Revérification", "Après l'attente, le WHERE est retesté sur la nouvelle version."],
      ],
      ex: [
        { t: "qcm", q: "A et B lisent 5, calculent 1 côté application et écrivent `stock = 1`. Résultat ?", o: ["Stock 1 alors que 8 unités ont été promises : mise à jour perdue", "Stock -3", "Erreur CHECK", "Interblocage"], a: 0 },
        { t: "qcm", q: "A (`stock - 3`, garde `>= 3`) ouvert ; B (`stock - 2`, garde `>= 2`) attend ; A valide, puis B. Stock final ?", o: ["0", "2", "3", "Erreur"], a: 0, why: "B revérifie sur la valeur 2 : la garde passe, 2 − 2 = 0. Exactement 5 unités réservées." },
        { t: "qcm", q: "Différence entre « une valeur 0 renvoyée » et « zéro ligne renvoyée » ?", o: ["0 = réservation réussie qui vide le stock ; zéro ligne = aucune réservation", "Aucune", "Zéro ligne = succès", "0 = erreur"], a: 0 },
        { t: "sql", q: "Écris l'UPDATE protégé qui réserve 4 unités du produit 2 dans `campus.products` et renvoie `product_id`, `stock`.", sol: "UPDATE campus.products SET stock = stock - 4 WHERE product_id = 2 AND stock >= 4 RETURNING product_id, stock;", need: [">=", "RETURNING"] },
      ],
    },
    {
      id: "j4-locks",
      title: "FOR UPDATE, interblocages et délais",
      learn: [
        "`SELECT … FOR UPDATE` lit **et verrouille** les lignes : les écritures concurrentes et les autres lectures avec verrou attendent la fin de la transaction. Un SELECT ordinaire, lui, n'attend pas et lit la valeur validée. À réserver aux décisions en plusieurs étapes ; pour une simple soustraction, l'UPDATE protégé suffit.",
        "Un **interblocage** est un **cycle d'attente** : A tient le produit 1 et demande le 2, B tient le 2 et demande le 1. PostgreSQL le détecte et interrompt une transaction (SQLSTATE **40P01**). Le remède : verrouiller les lignes **dans le même ordre** (id croissant), garder les transactions courtes.",
        "`SET LOCAL lock_timeout = '3s'` borne chaque attente de verrou ; `statement_timeout` borne toute l'instruction. `SET LOCAL` ne vaut que pour la transaction courante. **25P02** signifie « transaction déjà en échec » : cherche l'erreur initiale.",
      ],
      code: `BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '10s';
SELECT product_id, stock FROM campus.products WHERE product_id = 1 FOR UPDATE;
ROLLBACK;`,
      retiens: "Toutes les transactions verrouillent dans le même ordre : pas de cycle, pas d'interblocage.",
      keys: [
        ["FOR UPDATE", "Verrouille les lignes renvoyées contre les écritures."],
        ["Interblocage", "Cycle d'attente : chacun attend un verrou détenu par l'autre."],
        ["40P01", "deadlock_detected."],
        ["55P03", "lock_not_available (dont lock_timeout dépassé)."],
        ["lock_timeout", "Attente maximale pour acquérir un verrou."],
        ["statement_timeout", "Durée maximale d'une instruction."],
        ["SET LOCAL", "Réglage valable jusqu'à la fin de la transaction."],
        ["25P02", "Transaction déjà en échec."],
      ],
      ex: [
        { t: "qcm", q: "A tient un verrou FOR UPDATE sur le produit 1. Le SELECT ordinaire de B :", o: ["Renvoie la valeur validée sans attendre", "Attend", "Échoue", "Renvoie NULL"], a: 0 },
        { t: "qcm", q: "A verrouille 1 puis demande 2 ; B verrouille 2 puis demande 1 :", o: ["Interblocage : PostgreSQL interrompt une transaction (40P01)", "Les deux attendent pour toujours", "A gagne toujours", "Une lecture fantôme"], a: 0 },
        { t: "qcm", q: "Comment éviter ce cycle précis ?", o: ["Verrouiller les lignes dans le même ordre (id croissant)", "Augmenter lock_timeout", "Utiliser UNION", "Désactiver MVCC"], a: 0 },
        { t: "qcm", q: "Que signifie 25P02 ?", o: ["La transaction est déjà en échec : chercher l'erreur initiale", "Un interblocage", "Un échec de sérialisation", "Un délai de verrou dépassé"], a: 0 },
        { t: "sql", q: "Ouvre une transaction, règle `lock_timeout` à '3s' pour elle seule, lis et verrouille la ligne du produit 1 (`product_id`, `stock`), puis ROLLBACK.", sol: "BEGIN;\nSET LOCAL lock_timeout = '3s';\nSELECT product_id, stock FROM campus.products WHERE product_id = 1 FOR UPDATE;\nROLLBACK;", need: ["SET LOCAL", "FOR UPDATE"] },
      ],
    },
    {
      id: "j4-upsert",
      title: "ON CONFLICT, upsert et MERGE",
      learn: [
        "`INSERT … ON CONFLICT (clé) DO NOTHING` ignore une insertion en doublon : `RETURNING` ne renvoie alors **aucune ligne**. Une clé de demande unique (`reservation-42`) rend ainsi une demande répétée détectable.",
        "Un **upsert** insère ou met à jour la ligne en conflit : `ON CONFLICT (clé) DO UPDATE SET label = excluded.label`. `excluded` désigne la ligne **proposée** ; un alias (`AS existing`) désigne la ligne stockée.",
        "`MERGE INTO cible USING source ON … WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT …` rapproche une source d'une cible. Différence : en concurrence, une insertion en doublon peut faire **échouer** MERGE (erreur d'unicité) au lieu de prendre la branche UPDATE.",
      ],
      code: `CREATE TABLE work.product_label (product_id integer PRIMARY KEY, label text);
INSERT INTO work.product_label VALUES (1, 'Old label');
INSERT INTO work.product_label AS existing VALUES (1, 'New label')
ON CONFLICT (product_id) DO UPDATE SET label = excluded.label
RETURNING product_id, label;`,
      keys: [
        ["ON CONFLICT", "Action alternative quand l'insertion viole une clé unique."],
        ["DO NOTHING", "Ignore l'insertion en conflit."],
        ["Upsert", "Insérer, ou mettre à jour la ligne existante de même clé."],
        ["excluded", "La ligne proposée à l'insertion."],
        ["MERGE", "Rapproche une source d'une cible et choisit l'action WHEN."],
        ["MATCHED / NOT MATCHED", "La ligne source a trouvé (ou non) une cible."],
      ],
      ex: [
        { t: "sql", q: "Upsert : insère la catégorie (2, 'Tech & Gadgets', 1) dans `campus.categories` ; en cas de conflit sur `category_id`, mets à jour `name` avec la valeur proposée. Renvoie `category_id`, `name`.", sol: "INSERT INTO campus.categories VALUES (2, 'Tech & Gadgets', 1) ON CONFLICT (category_id) DO UPDATE SET name = excluded.name RETURNING category_id, name;", need: ["ON CONFLICT", "EXCLUDED"] },
        { t: "qcm", q: "`INSERT … ON CONFLICT DO NOTHING RETURNING …` sur une clé déjà présente renvoie :", o: ["Aucune ligne", "La ligne existante", "Une erreur", "NULL"], a: 0 },
        { t: "fill", q: "Dans `DO UPDATE`, la ligne proposée à l'insertion s'appelle ___", a: ["excluded"] },
        { t: "sql", q: "Avec MERGE : rapproche la source `(VALUES (3, 60), (7, 15)) AS src(product_id, stock)` de `campus.products` ; si le produit existe, mets son stock à `src.stock`, sinon ne fais rien.", sol: "MERGE INTO campus.products AS p USING (VALUES (3, 60), (7, 15)) AS src(product_id, stock) ON p.product_id = src.product_id WHEN MATCHED THEN UPDATE SET stock = src.stock;", verify: "SELECT product_id, stock FROM campus.products ORDER BY product_id;", ordered: true, need: ["MERGE"] },
        { t: "qcm", q: "Différence MERGE / ON CONFLICT en concurrence ?", o: ["Une insertion concurrente en doublon peut faire échouer MERGE au lieu de prendre la branche UPDATE", "Aucune", "MERGE est toujours plus sûr", "ON CONFLICT ne gère pas les doublons"], a: 0 },
      ],
    },
    {
      id: "j4-idem",
      title: "Identités, séquences et idempotence",
      learn: [
        "Une **colonne d'identité** (`GENERATED ALWAYS AS IDENTITY`) tire ses valeurs d'une **séquence**, qui avance indépendamment des annulations : une insertion annulée qui avait reçu 1 laisse un **trou**, la suivante reçoit 2. Les trous sont normaux ; des identifiants consécutifs ne prouvent pas un historique complet.",
        "Une opération est **idempotente** si répéter la même demande a le même effet métier qu'une seule exécution. Même clé + même contenu : renvoyer le résultat déjà stocké, sans décrémenter de nouveau. Même clé + panier différent : rejeter. La clé, le stock et le résultat s'enregistrent dans la **même transaction**.",
        "Un service de paiement externe est hors du périmètre de ROLLBACK : utiliser sa propre clé d'idempotence et rapprocher les issues incertaines au lieu de débiter de nouveau à l'aveugle.",
      ],
      code: `BEGIN;
CREATE TABLE work.id_demo (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY);
COMMIT;
BEGIN;
INSERT INTO work.id_demo DEFAULT VALUES RETURNING id;
ROLLBACK;
INSERT INTO work.id_demo DEFAULT VALUES RETURNING id;`,
      keys: [
        ["Colonne d'identité", "Identifiant par défaut tiré d'une séquence."],
        ["Séquence", "Générateur de nombres qui ne recule pas lors d'un ROLLBACK."],
        ["DEFAULT VALUES", "Insère une ligne avec les valeurs par défaut."],
        ["Idempotent", "Répéter la demande ne duplique pas son effet."],
        ["Périmètre externe", "Travail d'un autre système que ROLLBACK ne défait pas."],
      ],
      ex: [
        { t: "qcm", q: "Dans l'exemple, quel `id` renvoie le dernier INSERT ?", o: ["2", "1", "0", "NULL"], a: 0, why: "La valeur 1 a été consommée par l'insertion annulée." },
        { t: "qcm", q: "Des identifiants avec des trous prouvent-ils des données perdues ?", o: ["Non, les séquences ne reculent pas lors d'un ROLLBACK", "Oui", "Oui si la table a une clé primaire", "Seulement en SERIALIZABLE"], a: 0 },
        { t: "qcm", q: "La même clé de réservation arrive une 2e fois, avec le même contenu :", o: ["Renvoyer le résultat déjà stocké, sans décrémenter de nouveau", "Décrémenter de nouveau", "Rejeter avec une erreur", "Supprimer la première"], a: 0 },
        { t: "qcm", q: "Même clé de réservation, mais un panier différent :", o: ["Rejeter la différence", "Renvoyer l'ancien résultat", "Accepter le nouveau panier", "L'ignorer"], a: 0 },
        { t: "fill", q: "Une opération qu'on peut répéter sans dupliquer son effet métier est ___", a: ["idempotente", "idempotent"] },
      ],
    },
  ],
});
