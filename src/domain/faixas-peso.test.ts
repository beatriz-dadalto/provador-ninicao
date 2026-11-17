import { describe, expect, it } from "vitest";
import { FAIXAS_PESO, PESO_POR_PORTE, precisaPorte, resolverPesoKg } from "./faixas-peso";
import { ESPECIES, PORTES } from "./pet";

describe("FAIXAS_PESO", () => {
  it("cães: até 3 | 3–6 | 6–10 | 10–15 | 15–25 | mais de 25, com ponto médio", () => {
    expect(FAIXAS_PESO.cao.map((f) => [f.minKg, f.maxKg, f.representativoKg])).toEqual([
      [0, 3, 1.5],
      [3, 6, 4.5],
      [6, 10, 8],
      [10, 15, 12.5],
      [15, 25, 20],
      [25, null, 30],
    ]);
  });

  it("gatos: até 3 | 3–5 | 5–7 | mais de 7", () => {
    expect(FAIXAS_PESO.gato.map((f) => [f.minKg, f.maxKg, f.representativoKg])).toEqual([
      [0, 3, 1.5],
      [3, 5, 4],
      [5, 7, 6],
      [7, null, 8],
    ]);
  });

  it.each(ESPECIES)("%s: faixas contínuas, ids únicos e representativo dentro da faixa", (especie) => {
    const faixas = FAIXAS_PESO[especie];
    expect(new Set(faixas.map((f) => f.id)).size).toBe(faixas.length);
    faixas.forEach((f, i) => {
      const proxima = faixas[i + 1];
      if (proxima) expect(proxima.minKg).toBe(f.maxKg);
      else expect(f.maxKg).toBeNull();
      expect(f.representativoKg).toBeGreaterThan(f.minKg);
      if (f.maxKg !== null) expect(f.representativoKg).toBeLessThan(f.maxKg);
    });
  });

  it.each(ESPECIES)("%s: portes crescem (pequeno < médio < grande)", (especie) => {
    const pesos = PORTES.map((p) => PESO_POR_PORTE[especie][p]);
    expect([...pesos].sort((a, b) => a - b)).toEqual(pesos);
  });
});

describe("resolverPesoKg", () => {
  it("faixa → ponto médio da faixa da espécie", () => {
    expect(resolverPesoKg("cao", { tipo: "faixa", faixaId: "6-10" }, null, null)).toBe(8);
    expect(resolverPesoKg("gato", { tipo: "faixa", faixaId: "mais-7" }, null, null)).toBe(8);
  });

  it("faixa de outra espécie ou id desconhecido → null (nunca inventa peso)", () => {
    expect(resolverPesoKg("gato", { tipo: "faixa", faixaId: "15-25" }, null, null)).toBeNull();
    expect(resolverPesoKg("cao", { tipo: "faixa", faixaId: "x" }, null, null)).toBeNull();
  });

  it("faixa prevalece sobre peso típico e porte", () => {
    expect(resolverPesoKg("cao", { tipo: "faixa", faixaId: "0-3" }, 6.25, "grande")).toBe(1.5);
  });

  it("'Não sei' com peso típico da raça → peso típico", () => {
    expect(resolverPesoKg("cao", { tipo: "nao-sei" }, 6.25, null)).toBe(6.25);
  });

  it("'Não sei' sem peso típico → peso do porte; sem porte → null", () => {
    expect(resolverPesoKg("cao", { tipo: "nao-sei" }, null, "medio")).toBe(PESO_POR_PORTE.cao.medio);
    expect(resolverPesoKg("gato", { tipo: "nao-sei" }, null, "pequeno")).toBe(PESO_POR_PORTE.gato.pequeno);
    expect(resolverPesoKg("cao", { tipo: "nao-sei" }, null, null)).toBeNull();
  });
});

describe("precisaPorte", () => {
  it("só quando 'Não sei' e a raça não tem peso típico", () => {
    expect(precisaPorte({ tipo: "nao-sei" }, null)).toBe(true);
    expect(precisaPorte({ tipo: "nao-sei" }, 5)).toBe(false);
    expect(precisaPorte({ tipo: "faixa", faixaId: "3-6" }, null)).toBe(false);
  });
});
