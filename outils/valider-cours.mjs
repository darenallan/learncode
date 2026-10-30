// Vérifie les fichiers d'un cours avant de le publier dans cours.html.
// Usage : node outils/valider-cours.mjs "cours/SQL_Avancé"
// - Toujours : structure des briques et des exercices (ids uniques, index de QCM, trous ___…).
// - Si le cours a une base (seed) : exécute chaque exemple et chaque solution sur PostgreSQL 18 (PGlite).
// Code de sortie 1 s'il reste un problème.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2];
if (!arg) {
  console.error('Usage : node outils/valider-cours.mjs "cours/<Nom>"');
  process.exit(2);
}
const rel = arg.replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/$/, "");
const dir = resolve(ROOT, rel);
if (!existsSync(dir)) {
  console.error("Dossier introuvable : " + dir);
  process.exit(2);
}

// Ordre des fichiers : celui de MANIFEST s'il y a une entrée, sinon cours.js puis les autres .js triés.
const html = readFileSync(join(ROOT, "cours.html"), "utf8");
const manifest = html.match(/const MANIFEST = (\[[\s\S]*?\]);/);
const entries = manifest ? vm.runInNewContext(manifest[1]) : [];
const sameDir = (m) => m.dir.replace(/\/$/, "").normalize("NFC") === rel.normalize("NFC");
let files = entries.find(sameDir)?.files;
if (!files) {
  console.log("(info) " + rel + " n'est pas encore dans MANIFEST (cours.html).");
  const js = readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "cours.js");
  js.sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  files = ["cours.js", ...js];
}

let problems = 0;
let db = null;
const bad = (where, msg) => {
  problems++;
  console.log("✗", where, "—", msg);
};
function finish() {
  if (db) db.close().catch(() => {});
  process.exit(problems ? 1 : 0);
}

const COURSES = [];
const ctx = {
  COURS: {
    add(c) {
      c.days = [];
      COURSES.push(c);
    },
    day(id, d) {
      const c = COURSES.find((x) => x.id === id);
      if (c) c.days.push(d);
      else bad(d.id || "?", 'COURS.day("' + id + '") : aucun cours avec cet id');
    },
  },
};
vm.createContext(ctx);
for (const f of files) {
  const p = join(dir, f);
  if (!existsSync(p)) {
    bad(f, "fichier listé mais absent");
    continue;
  }
  try {
    vm.runInContext(readFileSync(p, "utf8"), ctx, { filename: f });
  } catch (e) {
    bad(f, "erreur JavaScript : " + e.message);
  }
}
if (COURSES.length !== 1) {
  bad(rel, COURSES.length + " appel(s) à COURS.add (il en faut exactement 1, dans cours.js)");
  if (!COURSES.length) finish();
}
const c = COURSES[0];
for (const k of ["id", "title", "summary"]) if (!c[k]) bad("cours.js", "champ " + k + " manquant");

// Les cours déjà publiés ne doivent pas utiliser le même id.
for (const m of entries) {
  if (sameDir(m)) continue;
  const p = join(ROOT, m.dir, "cours.js");
  if (existsSync(p) && new RegExp("id:\\s*[\"']" + c.id + "[\"']").test(readFileSync(p, "utf8"))) bad("cours.js", 'id "' + c.id + '" déjà pris par ' + m.dir);
}

// PostgreSQL seulement si le cours a une base d'exemple.
let run = null;
if (c.seed) {
  let PGlite;
  try {
    ({ PGlite } = await import("@electric-sql/pglite"));
  } catch {
    console.error("PGlite manquant. Lance d'abord : npm install --prefix outils");
    process.exit(2);
  }
  const CLEAN = html.match(/const CLEAN = `([\s\S]*?)`;/)[1];
  const keep = (v) => v;
  const RAW = { rowMode: "array", parsers: { 1082: keep, 1083: keep, 1114: keep, 1184: keep, 1186: keep, 1266: keep } };
  db = await PGlite.create();
  try {
    await db.exec(CLEAN + c.seed);
  } catch (e) {
    bad("seed", e.message);
    finish();
  }
  if (c.bench) {
    try {
      await db.exec(c.bench);
    } catch (e) {
      bad("bench", e.message);
    }
  }
  const sets = (r) => r.filter((x) => x.fields && x.fields.length);
  run = async (sql, verify) => {
    await db.exec(CLEAN + c.seed);
    const r = await db.exec(sql, RAW);
    if (verify) {
      await db.exec("ROLLBACK").catch(() => {});
      return sets(await db.exec(verify, RAW));
    }
    return sets(r);
  };
}

const ids = new Set();
const dayIds = new Set();
let nb = 0;
let nex = 0;
if (!c.days.length) bad(rel, "aucun jour (COURS.day) chargé");
for (const d of c.days) {
  if (!d.id || !d.label || !d.title) bad(d.id || "jour ?", "id, label ou title manquant");
  if (dayIds.has(d.id)) bad(d.id, "id de jour dupliqué");
  dayIds.add(d.id);
  if (!d.bricks?.length) bad(d.id, "aucune brique");
  for (const b of d.bricks || []) {
    nb++;
    if (ids.has(b.id)) bad(b.id, "id de brique dupliqué");
    ids.add(b.id);
    if (!b.title || !b.learn?.length || !b.ex?.length) bad(b.id, "title, learn ou ex manquant");
    if (b.bench && !c.bench) bad(b.id, "bench:true mais le cours n'a pas de bench");
    for (const k of b.keys || []) if (!Array.isArray(k) || k.length !== 2) bad(b.id, "keys : chaque entrée doit être [terme, définition]");
    if (b.code && run) {
      try {
        await run(b.code);
      } catch (e) {
        bad(b.id + " code", e.message);
      }
    }
    for (const [i, ex] of (b.ex || []).entries()) {
      nex++;
      const w = b.id + " ex" + (i + 1) + " (" + ex.t + ")";
      if (!ex.q) bad(w, "pas d'énoncé q");
      if (ex.t === "qcm") {
        if (!Array.isArray(ex.o) || ex.o.length < 2) bad(w, "il faut au moins 2 options o");
        else {
          if (!(Number.isInteger(ex.a) && ex.a >= 0 && ex.a < ex.o.length)) bad(w, "index a invalide");
          if (new Set(ex.o).size !== ex.o.length) bad(w, "options en double");
        }
      } else if (ex.t === "fill") {
        if (!Array.isArray(ex.a) || !ex.a.length) bad(w, "a doit être une liste de réponses acceptées");
        if (!ex.q?.includes("___")) bad(w, "pas de trou ___ dans q");
      } else if (ex.t === "sql") {
        if (!run) {
          bad(w, "exercice sql dans un cours sans seed");
          continue;
        }
        if (!ex.sol) {
          bad(w, "pas de solution sol");
          continue;
        }
        try {
          const s = await run(ex.sol, ex.verify);
          const last = s[s.length - 1];
          const up = ex.sol.replace(/\s+/g, " ").toUpperCase();
          for (const k of ex.need || []) if (!up.includes(k.toUpperCase())) bad(w, "la solution n'utilise pas " + k);
          for (const k of ex.ban || []) if (up.includes(k.toUpperCase())) bad(w, "la solution utilise " + k);
          if (!last && ex.check !== "run") bad(w, 'la solution ne renvoie rien à comparer (ajoute verify ou check:"run")');
          else console.log("  ✓", w, last ? last.rows.length + " lignes : " + JSON.stringify(last.rows.slice(0, 3)).slice(0, 120) : "exécutée");
        } catch (e) {
          bad(w, e.message);
        }
      } else bad(w, "type inconnu (qcm, fill ou sql)");
    }
  }
}
console.log(`\n${c.title} : ${c.days.length} jour(s), ${nb} briques, ${nex} exercices, ${problems} problème(s)`);
finish();
