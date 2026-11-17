import type { Logger, ModeloRepository } from "../../application/ports";
import type { Modelo } from "../../domain/modelo";
import { parseModelos } from "./parse-modelos";

/**
 * Dados embutidos no bundle: funciona offline desde a primeira visita e não há
 * requisição de rede que possa falhar. Validação acontece uma vez, na construção.
 */
export class JsonModeloRepository implements ModeloRepository {
  private readonly modelos: readonly Modelo[];

  constructor(dados: unknown, logger: Logger) {
    const { modelos, erros } = parseModelos(dados);
    for (const e of erros) logger.warn("Modelo ignorado", { ...e });
    this.modelos = modelos;
  }

  listar(): readonly Modelo[] {
    return this.modelos;
  }
}
