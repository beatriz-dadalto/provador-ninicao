import type { Logger, RacaRepository } from "../../application/ports";
import type { Raca } from "../../domain/raca";
import { parseRacas } from "./parse-racas";

/** Mesmo padrão do JsonModeloRepository: embutido no bundle, validado uma vez na construção. */
export class JsonRacaRepository implements RacaRepository {
  private readonly racas: readonly Raca[];

  constructor(dados: unknown, logger: Logger) {
    const { racas, erros } = parseRacas(dados);
    for (const e of erros) logger.warn("Raça ignorada", { ...e });
    this.racas = racas;
  }

  listar(): readonly Raca[] {
    return this.racas;
  }
}
