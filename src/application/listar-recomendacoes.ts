import type { Modelo } from "../domain/modelo";
import type { PerfilPet } from "../domain/pet";
import type { Recomendacao } from "../domain/recomendacao";
import type { Recomendador } from "../domain/recomendador";
import type { Logger, ModeloRepository } from "./ports";

export interface ItemRecomendado {
  readonly modelo: Modelo;
  readonly recomendacao: Recomendacao;
}

/**
 * Caso de uso: recomenda o tamanho de cada modelo compatível com a espécie.
 * Um modelo com problema nunca derruba a lista: é registrado e ignorado.
 */
export class ListarRecomendacoes {
  constructor(
    private readonly repo: ModeloRepository,
    private readonly recomendador: Recomendador,
    private readonly logger: Logger,
  ) {}

  executar(perfil: PerfilPet): readonly ItemRecomendado[] {
    const itens: ItemRecomendado[] = [];
    for (const modelo of this.repo.listar()) {
      if (!modelo.especies.includes(perfil.especie)) continue;
      try {
        itens.push({ modelo, recomendacao: this.recomendador.recomendar(modelo, perfil) });
      } catch (e) {
        this.logger.error("Falha ao recomendar modelo", { modeloId: modelo.id, erro: String(e) });
      }
    }
    // Recomendações válidas primeiro; "acima da grade" vai para o fim.
    return itens.sort((a, b) => peso(a) - peso(b));
  }
}

const peso = (i: ItemRecomendado) => (i.recomendacao.status === "ok" ? 0 : 1);
