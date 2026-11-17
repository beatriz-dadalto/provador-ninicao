import type { NaoVazia } from "./colecoes";
import type { Especie, Porte } from "./pet";

/** Faixa [minKg, maxKg) de um botão de peso. `maxKg = null` = "mais de minKg". */
export interface FaixaPeso {
  readonly id: string;
  readonly minKg: number;
  readonly maxKg: number | null;
  /** Peso usado na estimativa. */
  readonly representativoKg: number;
}

/** Faixa fechada: representativo = ponto médio. */
const entre = (minKg: number, maxKg: number): FaixaPeso => ({
  id: `${minKg}-${maxKg}`,
  minKg,
  maxKg,
  representativoKg: (minKg + maxKg) / 2,
});

/**
 * Faixa aberta "mais de X": não tem ponto médio. Representativo = ponto médio de uma faixa
 * hipotética com a mesma largura da anterior (cães: 25 + 10/2 = 30 kg; gatos: 7 + 2/2 = 8 kg).
 */
const acimaDe = (anterior: FaixaPeso & { maxKg: number }): FaixaPeso => ({
  id: `mais-${anterior.maxKg}`,
  minKg: anterior.maxKg,
  maxKg: null,
  representativoKg: anterior.maxKg + (anterior.maxKg - anterior.minKg) / 2,
});

const caoAte25 = entre(15, 25) as FaixaPeso & { maxKg: number };
const gatoAte7 = entre(5, 7) as FaixaPeso & { maxKg: number };

/** Botões de "Quanto pesa, mais ou menos?". A validar com a cliente. */
export const FAIXAS_PESO: Readonly<Record<Especie, NaoVazia<FaixaPeso>>> = {
  cao: [entre(0, 3), entre(3, 6), entre(6, 10), entre(10, 15), caoAte25, acimaDe(caoAte25)],
  gato: [entre(0, 3), entre(3, 5), gatoAte7, acimaDe(gatoAte7)],
};

/**
 * Peso representativo de cada porte (só para "Não sei" sem peso típico da raça). A validar.
 * Cães: categorias de porte das fabricantes de ração (mini até 10 kg, médio 11–25, grande 26–44),
 *       ponto médio de cada uma: 5 / 18 / 35 kg.
 * Gatos: sem fonte populacional; 3 / 4,5 / 6 kg cobrem a faixa comum de gato adulto doméstico.
 */
export const PESO_POR_PORTE: Readonly<Record<Especie, Readonly<Record<Porte, number>>>> = {
  cao: { pequeno: 5, medio: 18, grande: 35 },
  gato: { pequeno: 3, medio: 4.5, grande: 6 },
};

export type RespostaPeso = { readonly tipo: "faixa"; readonly faixaId: string } | { readonly tipo: "nao-sei" };

/** "Não sei" + raça sem peso típico → é preciso perguntar o porte. */
export const precisaPorte = (resposta: RespostaPeso, pesoTipicoKg: number | null): boolean =>
  resposta.tipo === "nao-sei" && pesoTipicoKg === null;

/** Peso usado na estimativa, ou `null` se faltar informação (nunca inventa). */
export function resolverPesoKg(
  especie: Especie,
  resposta: RespostaPeso,
  pesoTipicoKg: number | null,
  porte: Porte | null,
): number | null {
  if (resposta.tipo === "faixa") {
    return FAIXAS_PESO[especie].find((f) => f.id === resposta.faixaId)?.representativoKg ?? null;
  }
  if (pesoTipicoKg !== null) return pesoTipicoKg;
  return porte === null ? null : PESO_POR_PORTE[especie][porte];
}
