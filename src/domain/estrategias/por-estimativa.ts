import type { EstimadorTorax } from "../estimativa-torax";
import type { Modelo } from "../modelo";
import type { PerfilPet } from "../pet";
import type { Recomendacao } from "../recomendacao";
import type { EstrategiaRecomendacao } from "./estrategia";
import { recomendarPorTorax } from "./tamanho-por-torax";

/** Sem medida: estima o tórax (raça + peso + condição) e aplica a mesma grade. Confiança média. */
export class PorEstimativaStrategy implements EstrategiaRecomendacao {
  constructor(private readonly estimador: EstimadorTorax) {}

  aplicavel(perfil: PerfilPet): boolean {
    return perfil.fonte === "estimativa";
  }

  recomendar(modelo: Modelo, perfil: PerfilPet): Recomendacao {
    if (perfil.fonte !== "estimativa") throw new Error("PorEstimativaStrategy exige estimativa");
    return recomendarPorTorax(modelo, this.estimador.estimarCm(perfil), "media");
  }
}
