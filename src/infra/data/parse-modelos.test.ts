import { describe, expect, it, vi } from "vitest";
import { capaPlush } from "../../domain/test-fixtures";
import { JsonModeloRepository } from "./json-modelo-repository";
import dadosReais from "./modelos.json";
import { parseModelos, urlShopeeSegura } from "./parse-modelos";

const clone = <T>(v: T): T => structuredClone(v);
const comModelo = (patch: (m: Record<string, unknown>) => void) => {
  const m = clone(capaPlush) as unknown as Record<string, unknown>;
  patch(m);
  return { modelos: [m] };
};

describe("modelos.json (dados reais)", () => {
  it("é 100% válido — CI falha se alguém publicar medida inconsistente", () => {
    const r = parseModelos(dadosReais);
    expect(r.erros).toEqual([]);
    expect(r.modelos.length).toBeGreaterThan(0);
  });

  it("casaco/capa/fleece desempatam para o maior", () => {
    const desempate = Object.fromEntries(parseModelos(dadosReais).modelos.map((m) => [m.id, m.desempate]));
    expect(desempate).toMatchObject({ "blusa-fleece": "maior", "capa-plush": "maior" });
  });
});

describe("parseModelos", () => {
  it("aceita um modelo válido", () => {
    expect(parseModelos({ modelos: [capaPlush] })).toEqual({ modelos: [capaPlush], erros: [] });
  });

  it.each([null, undefined, 42, "x", [], {}, { modelos: "x" }])("arquivo malformado %j não quebra", (dados) => {
    const r = parseModelos(dados);
    expect(r.modelos).toEqual([]);
    expect(r.erros).toEqual([{ indice: -1, id: null, motivo: "arquivo sem lista 'modelos'" }]);
  });

  it("campos antigos (pesoKg por tamanho) são ignorados: o peso agora passa pela estimativa de tórax", () => {
    const antigo = comModelo((m) => {
      (m.tamanhos as Record<string, unknown>[]).forEach((t) => (t.pesoKg = [0, 1]));
    });
    expect(parseModelos(antigo).modelos[0]?.tamanhos[0]).not.toHaveProperty("pesoKg");
  });

  it("erro inesperado (bug, não dado ruim) propaga em vez de ser engolido", () => {
    const armadilha = {
      get id() {
        return "x";
      },
      get nome(): string {
        throw new TypeError("bug");
      },
    };
    expect(() => parseModelos({ modelos: [armadilha] })).toThrow("bug");
  });

  it.each<[string, (m: Record<string, unknown>) => void]>([
    ["id com caractere proibido", (m) => (m.id = "Capa Plush")],
    ["nome vazio", (m) => (m.nome = "  ")],
    ["url javascript:", (m) => (m.shopeeUrl = "javascript:alert(1)")],
    ["url de outro domínio", (m) => (m.shopeeUrl = "https://shopee.com.br.evil.com/x")],
    ["espécie desconhecida", (m) => (m.especies = ["cavalo"])],
    ["sem espécies", (m) => (m.especies = [])],
    ["folga negativa", (m) => (m.folgaToraxCm = -1)],
    ["folga absurda", (m) => (m.folgaToraxCm = 50)],
    ["grade vazia", (m) => (m.tamanhos = [])],
    ["miniatura externa", (m) => (m.miniatura = "https://evil.com/x.png")],
    ["miniatura com ..", (m) => (m.miniatura = "../x.png")],
    ["miniatura absoluta", (m) => (m.miniatura = "/x.png")],
    ["miniatura sem extensão de imagem", (m) => (m.miniatura = "modelos/x.html")],
    ["miniatura não-texto", (m) => (m.miniatura = 1)],
    ["sem desempate", (m) => delete m.desempate],
    ["desempate desconhecido", (m) => (m.desempate = "medio")],
    ["tórax fora de ordem", (m) => ((m.tamanhos as { toraxCm: number }[])[1]!.toraxCm = 30)],
    ["tórax repetido", (m) => ((m.tamanhos as { toraxCm: number }[])[1]!.toraxCm = 36)],
    ["tórax NaN", (m) => ((m.tamanhos as { toraxCm: number }[])[0]!.toraxCm = Number.NaN)],
    ["tamanho não-objeto", (m) => ((m.tamanhos as unknown[])[0] = "PP")],
    ["rótulo de tamanho longo", (m) => ((m.tamanhos as { tam: string }[])[0]!.tam = "PPPPP")],
  ])("descarta modelo com %s", (_caso, patch) => {
    const r = parseModelos(comModelo(patch));
    expect(r.modelos).toEqual([]);
    expect(r.erros).toHaveLength(1);
  });

  it("miniatura local é opcional e preservada", () => {
    expect(parseModelos({ modelos: [capaPlush] }).modelos[0]).not.toHaveProperty("miniatura");
    const r = parseModelos(comModelo((m) => (m.miniatura = "modelos/capa-plush.webp")));
    expect(r.modelos[0]?.miniatura).toBe("modelos/capa-plush.webp");
  });

  it("um modelo inválido não impede os válidos", () => {
    const r = parseModelos({ modelos: [{ id: "x" }, capaPlush] });
    expect(r.modelos.map((m) => m.id)).toEqual(["capa-plush"]);
    expect(r.erros).toEqual([{ indice: 0, id: "x", motivo: "nome inválido" }]);
  });

  it("id duplicado: mantém o primeiro", () => {
    const r = parseModelos({ modelos: [capaPlush, capaPlush] });
    expect(r.modelos).toHaveLength(1);
    expect(r.erros[0]).toMatchObject({ indice: 1, motivo: "id duplicado" });
  });
});

describe("urlShopeeSegura", () => {
  it.each([
    ["https://shopee.com.br/product/1/2", true],
    ["http://shopee.com.br/product/1/2", false],
    ["https://user:pass@shopee.com.br/", false],
    ["https://evil.com/?r=shopee.com.br", false],
    ["data:text/html,oi", false],
    ["não é url", false],
    [123, false],
    [`https://shopee.com.br/${"a".repeat(400)}`, false],
  ])("%s → %s", (url, esperado) => {
    expect(urlShopeeSegura(url)).toBe(esperado);
  });
});

describe("JsonModeloRepository", () => {
  it("lista os válidos e registra os ignorados", () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const repo = new JsonModeloRepository({ modelos: [capaPlush, { id: "ruim" }] }, logger);
    expect(repo.listar().map((m) => m.id)).toEqual(["capa-plush"]);
    expect(logger.warn).toHaveBeenCalledWith("Modelo ignorado", expect.objectContaining({ id: "ruim" }));
  });
});
