import { describe, expect, it } from "vitest";
import { FAIXAS_PESO } from "../domain/faixas-peso";
import { copy, erroTorax } from "./copy";

describe("copy", () => {
  it("mensagens de erro do tórax dizem como corrigir", () => {
    expect(erroTorax("vazio")).toBe("Digite um número.");
    expect(erroTorax("invalido")).toBe("Use só números. Ex.: 46");
    expect(erroTorax("abaixo")).toBe("Mínimo 15 cm.");
    expect(erroTorax("acima")).toBe("Máximo 120 cm.");
  });

  it("rótulos das faixas de peso", () => {
    expect(FAIXAS_PESO.cao.map(copy.peso.faixa)).toEqual([
      "Até 3 kg",
      "3 a 6 kg",
      "6 a 10 kg",
      "10 a 15 kg",
      "15 a 25 kg",
      "Mais de 25 kg",
    ]);
    expect(FAIXAS_PESO.gato.map(copy.peso.faixa)).toEqual(["Até 3 kg", "3 a 5 kg", "5 a 7 kg", "Mais de 7 kg"]);
  });

  it("chips", () => {
    expect(copy.chip.porte("medio")).toBe("Porte médio");
    expect(copy.chip.peito(46.5)).toBe("Peito 46,5 cm");
  });

  it("nenhum texto ensina a medir (decisão de produto)", () => {
    expect(JSON.stringify(copy)).not.toMatch(/fita|barbante|régua|folha|nota de/i);
  });
});
