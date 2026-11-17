import { describe, expect, it } from "vitest";
import {
  AJUSTE_CONDICAO_CM,
  BCS_POR_CONDICAO,
  CM_POR_PONTO_BCS,
  EstimadorAlometrico,
  K_PADRAO,
} from "./estimativa-torax";

const e = new EstimadorAlometrico();
const est = (pesoKg: number, condicao: "magrinho" | "normal" | "cheinho" = "normal", kRaca = 1) =>
  e.estimarCm({ pesoKg, kRaca, condicao });

describe("EstimadorAlometrico (tórax ≈ k × kRaca × peso^(1/3) + ajuste)", () => {
  it("K_PADRAO reproduz os dois dados publicados usados na calibração (±0,3 cm)", () => {
    expect(K_PADRAO).toBe(22.6);
    expect(est(2.85)).toBeCloseTo(32.06, 0); // Yorkshire (Hibaru et al. 2018)
    expect(est(9.42)).toBeCloseTo(47.7, 0); // vira-latas BR (Guimarães et al. 2012)
  });

  it("condição corporal: −3 / 0 / +3 cm, derivados de 1,5 cm por ponto de BCS (3 / 5 / 7)", () => {
    expect(CM_POR_PONTO_BCS).toBe(1.5);
    expect(BCS_POR_CONDICAO).toEqual({ magrinho: 3, normal: 5, cheinho: 7 });
    expect(AJUSTE_CONDICAO_CM).toEqual({ magrinho: -3, normal: 0, cheinho: 3 });
    expect(est(8, "magrinho")).toBe(42.2);
    expect(est(8, "normal")).toBe(45.2);
    expect(est(8, "cheinho")).toBe(48.2);
  });

  it("kRaca multiplica o termo alométrico (não o ajuste corporal)", () => {
    expect(est(8, "cheinho", 1.1)).toBeCloseTo(22.6 * 1.1 * 2 + 3, 1);
  });

  it("aceita k injetado (recalibração sem tocar no resto do domínio)", () => {
    expect(new EstimadorAlometrico(20).estimarCm({ pesoKg: 8, kRaca: 1, condicao: "normal" })).toBe(40);
  });

  it("cresce com o peso (monotônico) e arredonda para 1 casa", () => {
    const pesos = [0.3, 1.5, 3, 4.5, 8, 12.5, 20, 30, 80];
    const toraxes = pesos.map((p) => est(p));
    expect([...toraxes].sort((a, b) => a - b)).toEqual(toraxes);
    for (const t of toraxes) expect(Math.round(t * 10) / 10).toBe(t);
  });
});
