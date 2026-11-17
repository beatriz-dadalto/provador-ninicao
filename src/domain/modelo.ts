import type { NaoVazia } from "./colecoes";
import type { Especie } from "./pet";

export interface TamanhoGrade {
  readonly tam: string;
  readonly pescocoCm: number;
  readonly toraxCm: number;
  readonly comprimentoCm: number;
}

/**
 * Regra de desempate quando o pet cai na zona de transição entre dois tamanhos.
 * Mercado: "maior" para casaco, capa e fleece; "menor" para malha elástica (relatório, seção 1).
 */
export const DESEMPATES = ["maior", "menor"] as const;
export type Desempate = (typeof DESEMPATES)[number];

export interface Modelo {
  readonly id: string;
  readonly nome: string;
  readonly shopeeUrl: string;
  readonly especies: readonly Especie[];
  /** Quanto a peça precisa ter a mais que o tórax do pet. */
  readonly folgaToraxCm: number;
  readonly desempate: Desempate;
  /** Miniatura local opcional (caminho relativo dentro de public/, ex.: "modelos/capa.webp"). */
  readonly miniatura?: string;
  /** Grade ordenada do menor para o maior tórax (garantido pelo parser). */
  readonly tamanhos: NaoVazia<TamanhoGrade>;
}
