# ADR 0002 — Medidas embutidas no bundle, sem backend no MVP

Data: 2026-11-16 · Status: aceito

## Contexto

O provador precisa da grade de medidas de cada modelo. São poucos modelos (≤ 21) e mudam raramente.

## Decisão

`modelos.json` versionado no repositório, validado em build (teste) e em runtime (parser), embutido no bundle.

## Por quê

- Zero chamadas de rede em runtime: nada pode falhar por API fora do ar; offline desde a primeira visita.
- CAP: sem estado distribuído, não há trade-off de consistência/disponibilidade a gerenciar. Leitura sempre consistente com o deploy.
- Hospedagem estática (GitHub Pages hoje, Hostinger depois) sem servidor.
- Sem dados pessoais trafegando: LGPD simplificada.

## Consequências

- Atualizar medidas = PR + deploy automático (minutos).
- Fase 2 (coletar "serviu / não serviu" para calibrar faixas) exigirá backend; o caso de uso já depende de uma porta (`ModeloRepository`), então a troca de fonte de dados não afeta domínio nem telas.
