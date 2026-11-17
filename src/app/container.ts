import { CatalogoRacas } from "../application/catalogo-racas";
import { ListarRecomendacoes } from "../application/listar-recomendacoes";
import type { Logger } from "../application/ports";
import { EstimadorAlometrico } from "../domain/estimativa-torax";
import { criarRecomendadorPadrao } from "../domain/recomendador";
import { consoleLogger } from "../infra/console-logger";
import { JsonModeloRepository } from "../infra/data/json-modelo-repository";
import { JsonRacaRepository } from "../infra/data/json-raca-repository";
import modelos from "../infra/data/modelos.json";
import racas from "../infra/data/racas.json";

export interface Dependencias {
  readonly listarRecomendacoes: ListarRecomendacoes;
  readonly catalogoRacas: CatalogoRacas;
  readonly logger: Logger;
}

/** Composition root: o único lugar que conhece implementações concretas. */
export function criarDependencias(logger: Logger = consoleLogger): Dependencias {
  const recomendador = criarRecomendadorPadrao(new EstimadorAlometrico());
  return {
    listarRecomendacoes: new ListarRecomendacoes(new JsonModeloRepository(modelos, logger), recomendador, logger),
    catalogoRacas: new CatalogoRacas(new JsonRacaRepository(racas, logger)),
    logger,
  };
}
