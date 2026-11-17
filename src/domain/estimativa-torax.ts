import type { CondicaoCorporal } from "./pet";

/*
 * Estimativa do tórax para quem não tem a medida. TODOS os números aqui são "a validar"
 * com dados próprios da loja (ver docs/adr/0004-estimativa-torax.md).
 *
 * Modelo alométrico: tórax ≈ K × kRaca × peso^(1/3) + ajuste da condição corporal.
 * Por que raiz cúbica: em corpos de mesmo formato, peso ∝ volume ∝ comprimento³,
 * logo qualquer circunferência ∝ peso^(1/3).
 *
 * Calibração de K com os dois únicos pares (tórax médio, peso médio) publicados:
 *   Yorkshire, fêmeas (Hibaru et al. 2018):   32,06 cm @ ~2,85 kg → 32,06 / 2,85^(1/3) = 32,06 / 1,418 ≈ 22,6
 *   Vira-latas BR (Guimarães et al. 2012):    47,7 cm  @  9,42 kg → 47,7  / 9,42^(1/3) = 47,7  / 2,112 ≈ 22,6
 * Erro esperado em vira-latas: ~4,7 cm (≈ 60% dentro de ±4 cm) → confiança "média".
 * Gatos: mesmo modelo, NÃO validado (não há dados populacionais de tórax felino).
 */
export const K_PADRAO = 22.6;

/** Beagles: 7,8 cm de tórax entre BCS 3 e 8 (Söder et al. 2025) → ~1,5 cm por ponto. */
export const CM_POR_PONTO_BCS = 1.5;
const BCS_REFERENCIA = 5;
/** Equivalência aproximada das silhuetas com o escore corporal 1–9. */
export const BCS_POR_CONDICAO: Readonly<Record<CondicaoCorporal, number>> = { magrinho: 3, normal: 5, cheinho: 7 };

/** −3 / 0 / +3 cm. */
export const AJUSTE_CONDICAO_CM: Readonly<Record<CondicaoCorporal, number>> = {
  magrinho: (BCS_POR_CONDICAO.magrinho - BCS_REFERENCIA) * CM_POR_PONTO_BCS,
  normal: (BCS_POR_CONDICAO.normal - BCS_REFERENCIA) * CM_POR_PONTO_BCS,
  cheinho: (BCS_POR_CONDICAO.cheinho - BCS_REFERENCIA) * CM_POR_PONTO_BCS,
};

export interface DadosEstimativa {
  readonly pesoKg: number;
  readonly kRaca: number;
  readonly condicao: CondicaoCorporal;
}

/** Porta do domínio: outro modelo (ex.: tabela própria raça+peso→tórax) entra sem mudar estratégias. */
export interface EstimadorTorax {
  estimarCm(dados: DadosEstimativa): number;
}

export class EstimadorAlometrico implements EstimadorTorax {
  constructor(private readonly k: number = K_PADRAO) {}

  estimarCm({ pesoKg, kRaca, condicao }: DadosEstimativa): number {
    const cm = this.k * kRaca * Math.cbrt(pesoKg) + AJUSTE_CONDICAO_CM[condicao];
    return Math.round(cm * 10) / 10;
  }
}
