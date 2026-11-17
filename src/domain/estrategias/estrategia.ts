import type { Modelo } from "../modelo";
import type { PerfilPet } from "../pet";
import type { Recomendacao } from "../recomendacao";

/**
 * Strategy: cada forma de recomendar (por medida, por estimativa…) é uma implementação.
 * Novas regras entram como novas estratégias, sem alterar as existentes (OCP).
 */
export interface EstrategiaRecomendacao {
  aplicavel(perfil: PerfilPet): boolean;
  recomendar(modelo: Modelo, perfil: PerfilPet): Recomendacao;
}
