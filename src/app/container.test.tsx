import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { estimativa, medida } from "../domain/test-fixtures";
import { criarDependencias } from "./container";
import { useDependencias } from "./dependencias-context";

describe("composition root (integração das camadas com os dados reais)", () => {
  it("monta o grafo com modelos.json e racas.json publicados, sem avisos", () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const deps = criarDependencias(logger);

    const porMedida = deps.listarRecomendacoes.executar(medida(46));
    expect(porMedida.length).toBeGreaterThan(0);
    expect(porMedida.every((i) => i.recomendacao.status === "ok")).toBe(true);

    // Shih Tzu, "Não sei" → 6,25 kg típico → 41,6 cm estimados
    const shih = deps.catalogoRacas.buscar("cao", "shih tzu")[0];
    expect(shih?.pesoTipicoKg).toBe(6.25);
    const porEstimativa = deps.listarRecomendacoes.executar(estimativa({ pesoKg: shih?.pesoTipicoKg ?? 0 }));
    expect(porEstimativa.map((i) => i.recomendacao)).toEqual([
      { status: "ok", modeloId: "blusa-fleece", tam: "M", confianca: "media" }, // 41,6 + 4 = 45,6 → M (52)
      { status: "ok", modeloId: "capa-plush", tam: "P", confianca: "media" }, // 41,6 + 3 = 44,6 → P (45)
    ]);

    expect(deps.catalogoRacas.destaques("gato").length).toBeGreaterThan(0);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("usar o hook fora do provider falha de forma explícita", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useDependencias())).toThrow("DependenciasProvider ausente");
  });
});
