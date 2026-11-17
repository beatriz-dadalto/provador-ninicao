import { describe, expect, it, vi } from "vitest";
import type { EstrategiaRecomendacao } from "./estrategias/estrategia";
import { criarRecomendadorPadrao, Recomendador } from "./recomendador";
import { capaPlush, estimativa, medida } from "./test-fixtures";

const fake = (aplicavel: boolean, tam: string): EstrategiaRecomendacao => ({
  aplicavel: vi.fn(() => aplicavel),
  recomendar: vi.fn(() => ({ status: "ok", modeloId: "x", tam, confianca: "alta" }) as const),
});

describe("Recomendador", () => {
  it("usa a primeira estratégia aplicável", () => {
    const a = fake(false, "A");
    const b = fake(true, "B");
    const c = fake(true, "C");
    expect(new Recomendador([a, b, c]).recomendar(capaPlush, medida(40))).toMatchObject({ tam: "B" });
    expect(c.recomendar).not.toHaveBeenCalled();
  });

  it("cai na última estratégia se nenhuma se declarar aplicável", () => {
    expect(new Recomendador([fake(false, "A"), fake(false, "Z")]).recomendar(capaPlush, medida(40))).toMatchObject({
      tam: "Z",
    });
  });

  it("exige ao menos uma estratégia (garantido em tempo de compilação)", () => {
    // @ts-expect-error — lista vazia não é NaoVazia
    const criar = () => new Recomendador([]);
    expect(criar).toBeTypeOf("function");
  });

  it("padrão: medida → confiança alta; estimativa → média", () => {
    const r = criarRecomendadorPadrao();
    expect(r.recomendar(capaPlush, medida(46))).toMatchObject({ tam: "M", confianca: "alta" });
    // 8 kg normal → 45,2 cm + 3 = 48,2 → M
    expect(r.recomendar(capaPlush, estimativa({ pesoKg: 8 }))).toMatchObject({ tam: "M", confianca: "media" });
    // 8 kg magrinho → 42,2 + 3 = 45,2 → M por 0,2 cm (capa: desempate "maior")
    expect(r.recomendar(capaPlush, estimativa({ pesoKg: 8, condicao: "magrinho" }))).toMatchObject({ tam: "M" });
  });

  it("padrão aceita estimador injetado", () => {
    const r = criarRecomendadorPadrao({ estimarCm: () => 30 });
    expect(r.recomendar(capaPlush, estimativa())).toMatchObject({ tam: "PP" });
  });
});
