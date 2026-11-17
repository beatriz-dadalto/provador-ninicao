import { describe, expect, it, vi } from "vitest";
import type { EstimadorTorax } from "../estimativa-torax";
import { capaPlush, estimativa, medida } from "../test-fixtures";
import { PorEstimativaStrategy } from "./por-estimativa";

const estimador = (cm: number): EstimadorTorax => ({ estimarCm: vi.fn(() => cm) });

describe("PorEstimativaStrategy", () => {
  it("só se aplica à estimativa", () => {
    const s = new PorEstimativaStrategy(estimador(40));
    expect(s.aplicavel(estimativa())).toBe(true);
    expect(s.aplicavel(medida(40))).toBe(false);
  });

  it("usa o estimador injetado e marca confiança média", () => {
    const e = estimador(46);
    const perfil = estimativa({ pesoKg: 6, kRaca: 1, condicao: "cheinho" });
    expect(new PorEstimativaStrategy(e).recomendar(capaPlush, perfil)).toEqual({
      status: "ok",
      modeloId: "capa-plush",
      tam: "M",
      confianca: "media",
    });
    expect(e.estimarCm).toHaveBeenCalledWith(perfil);
  });

  it("chamada fora do contrato falha explicitamente", () => {
    expect(() => new PorEstimativaStrategy(estimador(1)).recomendar(capaPlush, medida(40))).toThrow(
      "PorEstimativaStrategy exige estimativa",
    );
  });
});
