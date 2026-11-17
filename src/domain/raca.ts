import type { Especie } from "./pet";

export interface Raca {
  readonly id: string;
  readonly nome: string;
  /** Outros nomes usados na busca ("salsicha", "SRD"…). */
  readonly sinonimos: readonly string[];
  readonly especie: Especie;
  /** Peso de padrão de raça publicado. `null` = sem fonte segura: o fluxo pergunta o porte. */
  readonly pesoTipicoKg: number | null;
  /** Multiplicador de formato sobre K_PADRAO. 1,0 até haver dados para calibrar. */
  readonly kRaca: number;
  /** Aparece como botão rápido na tela de raça. */
  readonly destaque: boolean;
  /** "Vira-lata": opção de saída sempre visível na tela de raça (inclusive quando a busca não acha). */
  readonly semRaca: boolean;
}
