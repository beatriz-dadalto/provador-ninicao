# ADR 0003 — Dependências: riscos aceitos e ajustes

Data: 2026-11-16 · Status: aceito

## 1. Vulnerabilidades moderadas em `glob`/`minimatch` (via `workbox-build`)

- Avisos: GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249 (severidade moderada).
- Alcance: só ferramenta de build, roda no CI sobre arquivos do próprio repositório. Nenhuma entrada de usuário; nada disso vai para o navegador.
- Correção automática sugerida rebaixa `vite-plugin-pwa` para 1.1.0 (pior).
- Decisão: aceitar; CI bloqueia severidade **alta** ou maior. Revisar quando o Dependabot trouxer `workbox-build` corrigido.

## 2. `overrides` de `@babel/plugin-transform-runtime` para `^7.29.0`

- Causa: dependência **opcional** de `@vitejs/plugin-react` → `@rolldown/plugin-babel` → o npm resolve a v8 deste plugin, que exige Babel 8, enquanto a árvore usa Babel 7 (`eslint-plugin-react-hooks`, `workbox-build`). Resultado: `ERESOLVE`.
- O plugin não é usado (o React plugin usa Oxc). Fixar em 7.x elimina o conflito sem `--legacy-peer-deps` (que mascararia outros problemas na árvore toda).
- Remover o override quando o ecossistema migrar para Babel 8.

## 3. TypeScript fixo em 6.0.x

- `typescript-eslint@8.73` suporta TypeScript `<6.1`. A 7.0 está disponível, mas quebraria o lint tipado.

## 4. `jsdom` 29.x (não 31)

- jsdom 30+ exige Node ≥ 24.15. Ambiente local em 24.14. A 29.1.1 atende Node ≥ 24.0, sem perda para os testes.
