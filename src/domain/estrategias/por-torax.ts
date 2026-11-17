import type { Modelo } from "../modelo";
import type { PerfilPet } from "../pet";
import type { Recomendacao } from "../recomendacao";
import type { EstrategiaRecomendacao } from "./estrategia";
import { recomendarPorTorax } from "./tamanho-por-torax";

/** Medida do peito digitada pelo tutor: confiança alta. */
export class PorToraxStrategy implements EstrategiaRecomendacao {
  aplicavel(perfil: PerfilPet): boolean {
    return perfil.fonte === "medida";
  }

  recomendar(modelo: Modelo, perfil: PerfilPet): Recomendacao {
    // Contrato: o Recomendador só chama esta estratégia se `aplicavel` for verdadeiro.
    if (perfil.fonte !== "medida") throw new Error("PorToraxStrategy exige medida do peito");
    return recomendarPorTorax(modelo, perfil.toraxCm, "alta");
  }
}
