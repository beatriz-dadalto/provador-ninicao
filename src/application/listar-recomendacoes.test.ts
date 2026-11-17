import { describe, expect, it, vi } from "vitest";
import type { Modelo } from "../domain/modelo";
import { criarRecomendadorPadrao, Recomendador } from "../domain/recomendador";
import { capaPlush, estimativa, medida } from "../domain/test-fixtures";
import { ListarRecomendacoes } from "./listar-recomendacoes";
import type { Logger, ModeloRepository } from "./ports";

const repo = (modelos: Modelo[]): ModeloRepository => ({ listar: () => modelos });
const logger = (): Logger => ({ warn: vi.fn(), error: vi.fn() });

const soCao: Modelo = { ...capaPlush, id: "so-cao", especies: ["cao"] };
const pequeno: Modelo = { ...capaPlush, id: "pequeno", tamanhos: [capaPlush.tamanhos[0], capaPlush.tamanhos[1]!] };

describe("ListarRecomendacoes", () => {
  it("filtra modelos pela espécie", () => {
    const uc = new ListarRecomendacoes(repo([capaPlush, soCao]), criarRecomendadorPadrao(), logger());
    expect(uc.executar(medida(40, "gato")).map((i) => i.modelo.id)).toEqual(["capa-plush"]);
  });

  it("gato por estimativa usa o mesmo modelo (marcado como não validado) e confiança média", () => {
    const uc = new ListarRecomendacoes(repo([capaPlush]), criarRecomendadorPadrao(), logger());
    // 4,5 kg → 37,3 cm + 3 = 40,3 → P
    const [item] = uc.executar(estimativa({ especie: "gato", pesoKg: 4.5 }));
    expect(item?.recomendacao).toEqual({ status: "ok", modeloId: "capa-plush", tam: "P", confianca: "media" });
  });

  it("coloca 'acima da grade' depois das recomendações válidas", () => {
    const uc = new ListarRecomendacoes(repo([pequeno, capaPlush]), criarRecomendadorPadrao(), logger());
    expect(uc.executar(medida(60)).map((i) => i.modelo.id)).toEqual(["capa-plush", "pequeno"]);
  });

  it("um modelo que falha não derruba os outros e é registrado", () => {
    const log = logger();
    const quebrado = new Recomendador([
      {
        aplicavel: () => true,
        recomendar: (m) => {
          if (m.id === "so-cao") throw new Error("boom");
          return { status: "ok", modeloId: m.id, tam: "M", confianca: "alta" };
        },
      },
    ]);
    const uc = new ListarRecomendacoes(repo([soCao, capaPlush]), quebrado, log);
    expect(uc.executar(medida(40)).map((i) => i.modelo.id)).toEqual(["capa-plush"]);
    expect(log.error).toHaveBeenCalledWith("Falha ao recomendar modelo", { modeloId: "so-cao", erro: "Error: boom" });
  });

  it("repositório vazio retorna lista vazia", () => {
    expect(new ListarRecomendacoes(repo([]), criarRecomendadorPadrao(), logger()).executar(medida(40))).toEqual([]);
  });
});
