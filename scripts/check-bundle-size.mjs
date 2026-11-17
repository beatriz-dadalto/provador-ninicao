// Orçamento de performance: falha o CI se o carregamento inicial (JS + CSS, gzip) passar do limite.
// Referência: abrir rápido no navegador do Instagram em 4G.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const ORCAMENTO_KB = { js: 80, css: 10 };
const DIST = "dist/assets";

const total = { js: 0, css: 0 };
for (const nome of readdirSync(DIST)) {
  const ext = nome.endsWith(".js") ? "js" : nome.endsWith(".css") ? "css" : null;
  if (!ext) continue;
  const arquivo = join(DIST, nome);
  if (!statSync(arquivo).isFile()) continue;
  total[ext] += gzipSync(readFileSync(arquivo), { level: 9 }).length;
}

let falhou = false;
for (const ext of ["js", "css"]) {
  const kb = total[ext] / 1024;
  const ok = kb <= ORCAMENTO_KB[ext];
  falhou ||= !ok;
  console.log(
    `${ok ? "OK  " : "FALHA"} ${ext.toUpperCase()}: ${kb.toFixed(1)} KB gzip (orçamento ${ORCAMENTO_KB[ext]} KB)`,
  );
}
process.exit(falhou ? 1 : 0);
