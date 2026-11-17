/** "alta" = medida do peito digitada; "media" = tórax estimado por raça e peso. */
export type Confianca = "alta" | "media";

/**
 * Sempre UM tamanho: a dúvida entre tamanhos é resolvida pela regra de desempate do modelo,
 * nunca transferida ao cliente. Códigos, não textos: a apresentação traduz em microcopy.
 */
export type Recomendacao =
  | { readonly status: "ok"; readonly modeloId: string; readonly tam: string; readonly confianca: Confianca }
  | { readonly status: "acima-da-grade"; readonly modeloId: string; readonly maiorTam: string };
