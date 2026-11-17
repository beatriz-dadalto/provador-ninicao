import { describe, expect, it } from "vitest";
import { capaPlush, estimativa, medida } from "../test-fixtures";
import { PorToraxStrategy } from "./por-torax";

const s = new PorToraxStrategy();

describe("PorToraxStrategy", () => {
  it("só se aplica à medida digitada", () => {
    expect(s.aplicavel(medida(40))).toBe(true);
    expect(s.aplicavel(estimativa())).toBe(false);
  });

  it("confiança alta", () => {
    expect(s.recomendar(capaPlush, medida(46))).toEqual({
      status: "ok",
      modeloId: "capa-plush",
      tam: "M",
      confianca: "alta",
    });
  });

  it("chamada fora do contrato falha explicitamente (o Recomendador nunca faz isso)", () => {
    expect(() => s.recomendar(capaPlush, estimativa())).toThrow("PorToraxStrategy exige medida do peito");
  });
});
