/* Cours « SQL avancé » (Ynov B2, PostgreSQL 18), construit à partir des 5 PDF de ce dossier.
   La base CampusMarket est reconstituée d'après les exemples et corrigés des supports :
   mêmes lignes, mêmes résultats (CA payé total 475, Chloe seule pour la division, etc.). */
COURS.add({
  id: "sql-avance",
  title: "SQL avancé",
  subtitle: "PostgreSQL 18 · Ynov B2",
  summary:
    "Bases solides, jointures et sous-requêtes, analyses avancées, transactions concurrentes, performance. Les 5 jours du cours, en briques.",
  note:
    "Les données d'exemple reproduisent celles des supports (CampusMarket et le banc d'essai du jour 5). Les scénarios à deux sessions du jour 4 se travaillent en prédisant le résultat : ce PostgreSQL n'ouvre qu'une connexion.",
  schemaDoc: `campus.departments (department_id, name)
campus.students    (student_id, full_name, email, department_id)
campus.categories  (category_id, name, parent_id)
campus.products    (product_id, sku, name, category_id, unit_price, stock, active)
campus.orders      (order_id, student_id, ordered_at, status)   -- status : paid, pending, cancelled
campus.order_items (order_id, product_id, quantity, unit_price) -- prix historique de la vente
campus.payments    (payment_id, order_id, amount)

work : schéma jetable pour tes essais.
work.bench_orders (order_id, student_id, ordered_at, status, campus_id, total)
  -- banc d'essai du jour 5 : 300 000 commandes synthétiques, à créer avec le bouton.`,
  seed: `
DROP SCHEMA IF EXISTS campus CASCADE;
CREATE SCHEMA campus;
CREATE TABLE campus.departments (
  department_id integer PRIMARY KEY,
  name text NOT NULL UNIQUE
);
CREATE TABLE campus.students (
  student_id integer PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  department_id integer NOT NULL REFERENCES campus.departments
);
CREATE TABLE campus.categories (
  category_id integer PRIMARY KEY,
  name text NOT NULL UNIQUE,
  parent_id integer REFERENCES campus.categories
);
CREATE TABLE campus.products (
  product_id integer PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  category_id integer NOT NULL REFERENCES campus.categories,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0),
  stock integer NOT NULL CHECK (stock >= 0),
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE campus.orders (
  order_id integer PRIMARY KEY,
  student_id integer NOT NULL REFERENCES campus.students,
  ordered_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled'))
);
CREATE TABLE campus.order_items (
  order_id integer REFERENCES campus.orders,
  product_id integer REFERENCES campus.products,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (order_id, product_id)
);
CREATE TABLE campus.payments (
  payment_id integer PRIMARY KEY,
  order_id integer NOT NULL REFERENCES campus.orders,
  amount numeric(12,2) NOT NULL CHECK (amount > 0)
);
INSERT INTO campus.departments VALUES (1, 'Computing'), (2, 'Design');
INSERT INTO campus.students VALUES
  (1, 'Alice Martin', 'alice@example.test', 1),
  (2, 'Bilal Amrani', 'bilal@example.test', 1),
  (3, 'Chloe Bernard', 'chloe@example.test', 2),
  (4, 'Diego Costa', 'diego@example.test', 2),
  (5, 'Eva Dupont', 'eva@example.test', 1),
  (6, 'Farah Idrissi', 'farah@example.test', 2);
INSERT INTO campus.categories VALUES
  (1, 'All', NULL), (2, 'Technology', 1), (3, 'Lifestyle', 1),
  (4, 'Accessories', 2), (5, 'Stationery', 3);
INSERT INTO campus.products VALUES
  (1, 'P-001', 'Keyboard', 2, 50.00, 20, true),
  (2, 'P-002', 'Mouse', 4, 25.00, 30, true),
  (3, 'P-003', 'Notebook', 5, 10.00, 50, true),
  (4, 'P-004', 'Bottle', 3, 20.00, 40, true),
  (5, 'P-005', 'USB Hub', 4, 30.00, 10, false),
  (6, 'P-006', 'Sticker Pack', 5, 5.00, 100, true);
INSERT INTO campus.orders VALUES
  (101, 1, '2026-01-05 09:00+00', 'paid'),
  (102, 2, '2026-01-20 12:00+00', 'paid'),
  (103, 1, '2026-02-03 10:00+00', 'paid'),
  (104, 3, '2026-02-05 14:00+00', 'paid'),
  (105, 4, '2026-02-10 08:30+00', 'pending'),
  (106, 5, '2026-02-12 16:00+00', 'cancelled'),
  (107, 2, '2026-02-20 11:00+00', 'paid'),
  (108, 3, '2026-03-01 09:15+00', 'paid'),
  (109, 5, '2026-03-05 17:45+00', 'paid'),
  (110, 4, '2026-03-10 13:00+00', 'paid');
INSERT INTO campus.order_items VALUES
  (101, 1, 1, 50.00), (101, 4, 1, 20.00),
  (102, 2, 2, 25.00), (102, 4, 1, 20.00),
  (103, 3, 5, 10.00),
  (104, 1, 1, 50.00), (104, 2, 1, 25.00),
  (105, 3, 2, 10.00),
  (106, 1, 2, 50.00),
  (107, 5, 2, 30.00), (107, 3, 1, 10.00),
  (108, 4, 2, 20.00),
  (109, 2, 2, 25.00),
  (110, 6, 10, 5.00);
INSERT INTO campus.payments VALUES
  (1, 101, 70.00), (2, 102, 30.00), (3, 102, 40.00), (4, 103, 50.00), (5, 104, 75.00),
  (6, 107, 70.00), (7, 108, 40.00), (8, 109, 50.00), (9, 110, 50.00);
`,
  // Banc d'essai du jour 5 : une commande par minute depuis le 1er janvier 2025 ;
  // l'étudiant 42 a 30 commandes (41, 10041, 20041…), 10 % sont pending.
  bench: `
CREATE TABLE work.bench_orders AS
SELECT g AS order_id,
       (g % 10000) + 1 AS student_id,
       TIMESTAMPTZ '2025-01-01 00:00+00' + (g - 1) * INTERVAL '1 minute' AS ordered_at,
       CASE WHEN g % 10 = 0 THEN 'pending' ELSE 'paid' END AS status,
       g % 2 + 1 AS campus_id,
       (g % 10000)::numeric(12,2) AS total
FROM generate_series(1, 300000) AS g;
ALTER TABLE work.bench_orders ADD PRIMARY KEY (order_id);
ANALYZE work.bench_orders;
`,
});
