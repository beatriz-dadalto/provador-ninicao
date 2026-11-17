import { type NaoVazia, ultimo } from "./colecoes";
import { EstimadorAlometrico, type EstimadorTorax } from "./estimativa-torax";
import type { EstrategiaRecomendacao } from "./estrategias/estrategia";
import { PorEstimativaStrategy } from "./estrategias/por-estimativa";
import { PorToraxStrategy } from "./estrategias/por-torax";
import type { Modelo } from "./modelo";
import type { PerfilPet } from "./pet";
import type { Recomendacao } from "./recomendacao";

/**
 * Escolhe a primeira estratégia aplicável, na ordem de prioridade recebida.
 * O tipo NaoVazia impede, em tempo de compilação, criar um recomendador sem estratégias.
 */
export class Recomendador {
  constructor(private readonly estrategias: NaoVazia<EstrategiaRecomendacao>) {}

  recomendar(modelo: Modelo, perfil: PerfilPet): Recomendacao {
    const estrategia = this.estrategias.find((e) => e.aplicavel(perfil)) ?? ultimo(this.estrategias);
    return estrategia.recomendar(modelo, perfil);
  }
}

/** Ordem padrão: medida real primeiro; estimativa (estimador injetável) depois. */
export const criarRecomendadorPadrao = (estimador: EstimadorTorax = new EstimadorAlometrico()) =>
  new Recomendador([new PorToraxStrategy(), new PorEstimativaStrategy(estimador)]);
