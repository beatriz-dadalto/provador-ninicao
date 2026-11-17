# ADR 0001 — PWA com React + Vite (não app nativo, não Flutter Web)

Data: 2026-11-16 · Status: aceito

## Contexto

Entrada principal: link na bio e nos Stories do Instagram, que abre no navegador interno do app, em Android e iOS.
Requisito do projeto: stack de mercado (portfólio e crescimento futuro).

## Decisão

PWA estática com React 19 + TypeScript + Vite.

## Alternativas

- **App nativo (Flutter) + backend**: exige instalar pela loja, o que quebra o fluxo do Instagram; custo de lojas (Apple US$ 99/ano, Google US$ 25) e revisão. Rejeitado.
- **Flutter Web**: bundle inicial pesado para 4G no navegador do Instagram. Rejeitado.
- **Preact**: menor, mas menos reconhecido em portfólio. Rejeitado pelo requisito de mercado.
- **Next.js**: SSR/SEO não são necessários no MVP; acrescenta complexidade de hospedagem. Caminho de migração aberto (domínio independente de framework).

## Consequências

- JS inicial medido: 72,6 KB gzip (orçamento de 80 KB, verificado no CI). Após o fluxo por raça (ADR 0004): 75,6 KB.
- Domínio e casos de uso não importam React: migrar de framework não exige reescrever regras.
