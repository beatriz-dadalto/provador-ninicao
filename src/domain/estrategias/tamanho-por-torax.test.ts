import { describe, expect, it } from "vitest";
import type { Modelo } from "../modelo";
import { capaPlush } from "../test-fixtures";
import { MARGEM_DESEMPATE_CM, recomendarPorTorax } from "./tamanho-por-torax";

const maior = (torax: number) => recomendarPorTorax(capaPlush, torax, "alta");
const elastica: Modelo = { ...capaPlush, id: "malha", desempate: "menor" };
const menor = (torax: number) => recomendarPorTorax(elastica, torax, "media");

describe("recomendarPorTorax", () => {
  it("caso real das avaliações: pinscher com tórax 46 cm veste M na capa", () => {
    // alvo = 46 + 3 de folga = 49 → P (45) não cabe, M (54) cabe
    expect(maior(46)).toEqual({ status: "ok", modeloId: "capa-plush", tam: "M", confianca: "alta" });
  });

  it("limite inclusivo: alvo igual ao tórax da peça serve", () => {
    expect(maior(42)).toMatchObject({ tam: "P" }); // 42 + 3 = 45 = P
  });

  it("tórax abaixo da grade → menor tamanho", () => {
    expect(maior(15)).toMatchObject({ tam: "PP" });
  });

  it("acima do maior tamanho retorna status próprio, sem quebrar", () => {
    expect(maior(72)).toEqual({ status: "acima-da-grade", modeloId: "capa-plush", maiorTam: "GG" });
  });

  it(`zona de transição (menor tamanho até ${MARGEM_DESEMPATE_CM} cm abaixo do alvo)`, () => {
    // 52 + 3 = 55: M (54) fica 1 cm abaixo do alvo
    expect(maior(52)).toMatchObject({ tam: "G" }); // casaco/capa: o maior
    expect(menor(52)).toMatchObject({ tam: "M", confianca: "media" }); // malha elástica: o menor
  });

  it("'menor' na borda exata da margem e logo fora dela", () => {
    expect(menor(53)).toMatchObject({ tam: "M" }); // alvo 56, M 54 = alvo − 2
    expect(menor(53.1)).toMatchObject({ tam: "G" }); // alvo 56,1: M fica 2,1 cm abaixo
  });

  it("'menor' no primeiro tamanho: não há menor, fica no que cabe", () => {
    expect(menor(20)).toMatchObject({ tam: "PP" });
  });

  it("'menor' logo acima da grade: o maior tamanho ainda serve na malha elástica", () => {
    expect(menor(72)).toMatchObject({ status: "ok", tam: "GG" }); // alvo 75, GG 74
    expect(menor(74)).toEqual({ status: "acima-da-grade", modeloId: "malha", maiorTam: "GG" }); // alvo 77
  });
});
