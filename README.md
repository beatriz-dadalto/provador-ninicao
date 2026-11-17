# Provador Ninicão

PWA que recomenda o tamanho de roupa pet da Ninicão Moda Pet. Objetivo: reduzir devoluções por tamanho errado.
Acesso pelo link do Instagram; compra na Shopee.

> Status: MVP em validação. Medidas das peças, pesos de raça, faixas e o modelo de estimativa estão
> **pendentes de validação com a cliente** (ver `src/infra/data/*.json` e [ADR 0004](docs/adr/0004-estimativa-torax.md)).

## Fluxo

Uma pergunta por tela, resposta por toque, nada para ler e nenhuma instrução de como medir.

1. **Qual é o seu pet?** Cachorro | Gato
2. **Qual a raça?** busca (tolera acento e erro de digitação) + botões das raças comuns + Vira-lata.
   Rodapé: _Já sei a medida do peito_ → campo de tórax → resultado (confiança alta).
3. **Quanto pesa, mais ou menos?** faixas + Não sei. "Não sei" usa o peso típico da raça; sem ele, pergunta
   **Qual o porte?** (pequeno | médio | grande).
4. **Ele é…** Magrinho | Normal | Cheinho → resultado.
5. **Resultado:** UM tamanho, origem em uma linha (_Pela raça e peso_ / _Pela medida do peito_), comprar na Shopee,
   chips para editar, outros modelos, recomeçar.

Sem medida, o tórax é estimado (`K × kRaca × peso^(1/3) ± condição corporal`) e passa pela mesma grade da peça.
Entre dois tamanhos, decide a regra `desempate` do modelo ("maior" para casaco/capa/fleece, "menor" para malha elástica).

## Stack

React 19 · TypeScript (strict) · Vite · vite-plugin-pwa (Workbox) · Vitest + Testing Library · Playwright · ESLint (typescript-eslint strict) · Prettier · GitHub Actions → GitHub Pages.

## Arquitetura

```
src/
  domain/          Regras puras. Sem React, sem I/O. 100% de cobertura exigida.
    estrategias/   Strategy: PorTorax (medida) e PorEstimativa (estimador de tórax injetável)
  application/     Casos de uso + portas (interfaces). 100% de cobertura exigida.
  infra/           Implementações das portas: dados (JSON validado), logger, auto-recuperação PWA
  presentation/    React: reducer puro (estado), telas, componentes, microcopy
  app/             Composition root: único lugar que conhece as implementações concretas
```

Dependências só apontam para dentro (`presentation → application → domain`). O ESLint **bloqueia** imports que violem isso.

| Princípio | Onde                                                                                     |
| --------- | ---------------------------------------------------------------------------------------- |
| SRP       | Parser de dados, estratégias, reducer e copy separados                                   |
| OCP       | Nova regra = nova `EstrategiaRecomendacao`; novo modelo de tórax = novo `EstimadorTorax` |
| LSP       | Qualquer estratégia é intercambiável no `Recomendador`                                   |
| ISP       | Telas recebem só os callbacks que usam                                                   |
| DIP       | Casos de uso dependem de portas (`ModeloRepository`, `RacaRepository`, `Logger`)         |

## Interface

Minimalista e guiada: título grande (28–32 px), uma pergunta por tela, telas de um toque sem botão "Continuar",
uma única cor de acento (`--acao`) para o que é clicável/selecionado. Sem identidade de marca ainda:
**para aplicar a marca, troque só os tokens no topo de `src/presentation/styles.css`**.

- Ilustrações em SVG inline com o mesmo traço (3 px, grid 64): o mesmo pet de perfil muda só a barriga
  (magrinho/normal/cheinho) ou a escala (porte). Sem fontes nem imagens externas (CSP `'self'`).
- Slot opcional de miniatura por modelo (`miniatura` no `modelos.json`, caminho local em `public/`); ausente ou com erro, não aparece.
- Transição de entrada de 180 ms só em CSS, desligada com `prefers-reduced-motion`.

| Largura / caso          | Layout                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| ≤ 599 px                | Uma coluna; ação fixa na zona do polegar quando existe; raças em 2 colunas |
| 600–1023 px             | Centralizado (máx. 640 px); ação segue o conteúdo; raças em 3 colunas      |
| ≥ 1024 px               | Cartão centralizado (máx. 640 px), hover, navegação 100% por teclado       |
| Deitado (≤ 500 px alt.) | Nada fixo; ilustrações e herói menores; rolagem vertical alcança tudo      |

Validação visual: `npm run build && npm run screenshots` gera `screenshots/<perfil>-<tema>/` (Galaxy S8, iPhone 13 Mini,
Pixel 7 deitado, iPad Mini, desktop 1440×900; claro e escuro). Pasta fora do git.

## Acessibilidade

Alvos ≥ 48 px (testado no E2E em todas as telas), foco no título a cada passo, `aria-pressed` nas respostas,
`aria-label` no voltar e no limpar busca, busca sem autocorreção. Contraste (WCAG 2.1) dos pares usados:

| Par                                    | Claro | Escuro | Mínimo |
| -------------------------------------- | ----: | -----: | -----: |
| `--texto` / `--fundo`                  | 16,72 |  15,45 |    4,5 |
| `--texto` / `--superficie`             | 15,41 |  13,70 |    4,5 |
| `--texto-suave` / `--superficie`       |  5,87 |   7,18 |    4,5 |
| `--texto` / `--acao-fundo` (novo)      | 14,33 |  11,62 |    4,5 |
| `--acao` / `--acao-fundo` (check)      |  6,32 |   6,62 |      3 |
| `--acao` / `--fundo` (links)           |  7,38 |   8,80 |    4,5 |
| `--acao-texto` / `--acao` (CTA, herói) |  7,38 |   9,10 |    4,5 |
| `--borda-controle` / `--superficie`    |  3,22 |   3,13 |      3 |
| `--ok` / `--ok-fundo`                  |  5,65 |   8,55 |    4,5 |
| `--aviso` / `--aviso-fundo`            |  6,51 |   9,23 |    4,5 |

## Robustez ("não pode dar crash")

- Domínio retorna `Result`/status explícitos; entradas validadas antes de virar número (faixas plausíveis).
- Dados validados na carga (`modelos.json`, `racas.json`): item inválido é descartado e registrado, os demais seguem funcionando. Testes reprovam o CI se os arquivos publicados tiverem qualquer erro.
- `ErrorBoundary` envolve todo o fluxo: erro inesperado vira tela "Recomeçar", nunca tela branca.
- Após deploy, chunk antigo ausente → recarrega **uma** vez por sessão (trava contra loop; tolera `sessionStorage` bloqueado).
- Dados embutidos no bundle + service worker: funciona offline após a primeira visita (testado em Chromium e WebKit).

## Segurança (OWASP)

- CSP restritiva via `<meta>` no build (`script-src 'self'`, `object-src 'none'`, `form-action 'none'`).
- Links externos só `https://shopee.com.br` (validado no parser) com `rel="noopener noreferrer"`.
- Sem coleta de dados pessoais, sem cookies, sem chamadas de rede em runtime.
- CI: `npm audit --audit-level=high`, Actions fixadas por SHA, permissões mínimas, Dependabot.

## Scripts

| Comando               | O que faz                                               |
| --------------------- | ------------------------------------------------------- |
| `npm run dev`         | Servidor local                                          |
| `npm run verify`      | Tudo que o CI roda, exceto E2E                          |
| `npm run test:e2e`    | E2E no build de produção (rode `npm run build` antes)   |
| `npm run size`        | Orçamento: JS ≤ 80 KB gzip, CSS ≤ 10 KB                 |
| `npm run screenshots` | Capturas de todas as telas (rode `npm run build` antes) |

Requer Node 24 (`.nvmrc`).

## CI/CD

`qualidade` (format, lint, tipos, testes + cobertura, audit, build, tamanho) → `e2e` (7 perfis: 2 Android, Android deitado, 2 iOS/WebKit, iPad Mini/WebKit, desktop 1440×900; contra o mesmo `dist` que será publicado) → `deploy` (só em `main`, só se tudo passar).

Para ativar o deploy: repositório **público** (GitHub Pages gratuito) e em _Settings → Pages → Source_ escolher **GitHub Actions**.

## Atualizar dados

- **Peças:** `src/infra/data/modelos.json`. O CI valida tórax crescente, `desempate` ("maior" | "menor"), URL da Shopee e campos obrigatórios.
- **Raças:** `src/infra/data/racas.json` (`nome`, `sinonimos` para a busca, `especie`, `pesoTipicoKg`, `fonte`, `kRaca`, `destaque`).
  Peso típico **exige fonte**; sem fonte, use `null` (o fluxo pergunta o porte). `kRaca` fica 1,0 até haver dados para calibrar.
- **Faixas de peso, portes e constantes da estimativa:** `src/domain/faixas-peso.ts` e `src/domain/estimativa-torax.ts`.

## Decisões

Ver [`docs/adr`](docs/adr).
