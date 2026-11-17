import { buscarRacas } from "../domain/busca-racas";
import type { Especie } from "../domain/pet";
import type { Raca } from "../domain/raca";
import type { RacaRepository } from "./ports";

/** Caso de uso da tela "Qual a raça?": botões rápidos e busca, sempre dentro da espécie escolhida. */
export class CatalogoRacas {
  constructor(private readonly repo: RacaRepository) {}

  destaques(especie: Especie): readonly Raca[] {
    return this.daEspecie(especie).filter((r) => r.destaque && !r.semRaca);
  }

  /** O "Vira-lata" da espécie (primeiro marcado), ou null se os dados não tiverem. */
  semRaca(especie: Especie): Raca | null {
    return this.daEspecie(especie).find((r) => r.semRaca) ?? null;
  }

  buscar(especie: Especie, termo: string): readonly Raca[] {
    return buscarRacas(this.daEspecie(especie), termo);
  }

  private daEspecie(especie: Especie): readonly Raca[] {
    return this.repo.listar().filter((r) => r.especie === especie);
  }
}
