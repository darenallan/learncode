// Serveur local pour tester Learncode sur le PC et sur le téléphone (même Wi-Fi).
// Lancer : node serve.mjs   puis ouvrir l'adresse affichée.
// Lecture seule : il ne sert que les fichiers de ce dossier.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, normalize, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

const PORT = Number(process.env.PORT) || 5190;
const root = dirname(fileURLToPath(import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json" };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(root, path || "index.html");
  if (!file.startsWith(root) || /(^|[/\\])\./.test(path)) { res.writeHead(403); return res.end(); }   // pas de fichiers cachés (.git…)
  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  } catch { res.writeHead(404); res.end("introuvable"); }
}).listen(PORT, "0.0.0.0", () => {
  const lan = Object.values(networkInterfaces()).flat().filter((i) => i && i.family === "IPv4" && !i.internal).map((i) => i.address);
  console.log(`Learncode sur le PC :        http://127.0.0.1:${PORT}`);
  for (const ip of lan) console.log(`Sur le téléphone (même Wi-Fi) : http://${ip}:${PORT}`);
});
