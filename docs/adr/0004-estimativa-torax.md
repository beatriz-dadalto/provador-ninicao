# ADR 0004 — Tamanho por raça + peso via tórax estimado (sem ensinar a medir)

Data: 2026-11-16 · Status: aceito · Números: **a validar** com dados da loja

## Contexto

- A dona do produto rejeitou qualquer forma de "ensinar a medir" (barbante, folha, nota, régua): as pessoas não conhecem.
- Fluxo aprovado: espécie → raça → peso aproximado (faixas ou "Não sei") → [porte, se preciso] → condição corporal → **um** tamanho.
  Atalho "Já sei a medida do peito" → campo de tórax → resultado.
- As grades das peças são em tórax (cm). O fluxo antigo tinha duas regras concorrentes: `PorTorax` e `PorPeso` (faixas de peso por tamanho no `modelos.json`).

## Decisão

1. **Uma única regra de tamanho, por tórax.** Sem medida, o tórax é estimado e passa pela mesma grade (`recomendarPorTorax`).
   `PorPesoStrategy` e `pesoKg` por tamanho foram removidos (redundantes e conflitantes com a estimativa).
2. **Estimativa alométrica**, injetável (`EstimadorTorax`; implementação `EstimadorAlometrico`):

   ```
   tórax ≈ K × kRaca × peso^(1/3) + ajuste(condição)
   ```

   - Raiz cúbica: em corpos de mesmo formato, peso ∝ volume ∝ comprimento³.
   - `K_PADRAO = 22,6`, calibrado com os dois pares publicados (relatório "Provador de tamanho pet"):
     - Yorkshire, fêmeas (Hibaru et al. 2018): 32,06 cm @ ~2,85 kg → 32,06 / 2,85^(1/3) = 32,06 / 1,418 ≈ **22,6**
     - Vira-latas BR (Guimarães et al. 2012): 47,7 cm @ 9,42 kg → 47,7 / 9,42^(1/3) = 47,7 / 2,112 ≈ **22,6**
   - Condição corporal: ~1,5 cm por ponto de BCS (Beagles: 7,8 cm entre BCS 3 e 8, Söder et al. 2025).
     Magrinho ≈ BCS 3, Normal ≈ 5, Cheinho ≈ 7 → **−3 / 0 / +3 cm**.
   - `kRaca = 1,0` em todas as raças (campo pronto para calibrar; nenhum multiplicador inventado).
   - Gatos: mesmo modelo, **não validado** (não há dados populacionais de tórax felino).

3. **Peso**: botões de faixa usam o ponto médio. Faixa aberta ("mais de X") usa o ponto médio de uma faixa hipotética com a
   largura da anterior (cães 30 kg, gatos 8 kg). "Não sei" → peso típico da raça; sem peso típico → tela de porte
   (cães 5 / 18 / 35 kg, ponto médio das categorias mini ≤10, médio 11–25, grande 26–44 kg; gatos 3 / 4,5 / 6 kg, sem fonte).
4. **Peso típico de raça** só com fonte publicada (padrão FCI/AKC/UKC ou estudo), registrada no `racas.json`.
   O parser **rejeita** peso sem fonte. Sem segurança → `null`.
5. **Desempate por modelo** (`desempate: "maior" | "menor"` no `modelos.json`). Zona de transição: o tamanho menor fica até
   2 cm abaixo do alvo (tórax + folga). "maior" (casaco, capa, fleece) escolhe o que cabe; "menor" (malha elástica) escolhe o
   menor. A interface mostra sempre UM tamanho; o alerta "entre tamanhos" foi removido.
6. **Confiança explícita**: medida → "alta" ("Pela medida do peito"); estimativa → "média" ("Pela raça e peso").
   O próprio relatório estima ~60% de acerto (±4 cm) em vira-latas com raça + peso.

## Alternativas

- **Manter faixas de peso por tamanho**: duas fontes de verdade para o mesmo tamanho; ignoram raça e condição. Rejeitado.
- **Tabela raça → tamanho**: exigiria dados que não existem (nenhuma média de tórax para as raças mais vendidas). Rejeitado.
- **Biblioteca de busca fuzzy** (Fuse.js etc.): ~30 raças; Levenshtein linear O(n·m) resolve e não pesa no orçamento de 80 KB.

## Consequências

- Trocar o modelo (ex.: regressão com dados próprios "raça + peso → tórax") = nova implementação de `EstimadorTorax`
  injetada no composition root, sem tocar em estratégias nem telas (OCP).
- Calibrar uma raça = editar `kRaca` no `racas.json`; o CI valida a faixa (0,5–1,5).
- Risco aceito: erro de ~4–5 cm na estimativa, meio degrau de grade. Mitigação: atalho de medida, regra de desempate,
  confiança visível. Métrica de sucesso: devolução/troca por tamanho por modelo (relatório, recomendação 6).
