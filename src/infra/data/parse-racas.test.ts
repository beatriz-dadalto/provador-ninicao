import { describe, expect, it, vi } from "vitest";
import { buscarRacas } from "../../domain/busca-racas";
import { ESPECIES } from "../../domain/pet";
import type { Raca } from "../../domain/raca";
import { racas as fixtures } from "../../domain/test-fixtures";
import { JsonRacaRepository } from "./json-raca-repository";
import { parseRacas } from "./parse-racas";
import dadosReais from "./racas.json";

const valida = { ...fixtures.shihTzu, fonte: "Padrão FCI nº 208" };
const com = (patch: (r: Record<string, unknown>) => void) => {
  const r = structuredClone(valida) as unknown as Record<string, unknown>;
  patch(r);
  return { racas: [r] };
};

describe("racas.json (dados reais)", () => {
  const { racas, erros } = parseRacas(dadosReais);

  it("é 100% válido — CI falha se alguém publicar raça inconsistente", () => {
    expect(erros).toEqual([]);
    expect(racas.length).toBeGreaterThan(20);
  });

  it("todo peso típico publicado tem fonte", () => {
    for (const bruto of dadosReais.racas) {
      if (bruto.pesoTipicoKg !== null) expect(bruto.fonte, bruto.id).toBeTruthy();
    }
  });

  it("kRaca = 1,0 em todas (não calibrado: nenhum multiplicador inventado)", () => {
    expect(new Set(racas.map((r) => r.kRaca))).toEqual(new Set([1]));
  });

  it.each(ESPECIES)("%s: tem destaques e exatamente um Vira-lata sem peso típico (cai na tela de porte)", (especie) => {
    const daEspecie = racas.filter((r) => r.especie === especie);
    expect(daEspecie.filter((r) => r.destaque).length).toBeGreaterThanOrEqual(4);
    const vira = daEspecie.filter((r) => r.semRaca);
    expect(vira).toHaveLength(1);
    expect(vira[0]).toMatchObject({ nome: "Vira-lata", pesoTipicoKg: null });
  });

  it.each<[string, string]>([
    ["salsicha", "dachshund"],
    ["SRD", "vira-lata"],
    ["sem raça", "vira-lata"],
    ["vira lata", "vira-lata"],
    ["lulu", "spitz-alemao"],
    ["shitzu", "shih-tzu"],
    ["yorkshre", "yorkshire"],
    ["bulldog frances", "bulldog-frances"],
  ])("busca real de cães: %j → %s em primeiro", (termo, id) => {
    expect(
      buscarRacas(
        racas.filter((r) => r.especie === "cao"),
        termo,
      )[0]?.id,
    ).toBe(id);
  });

  it("busca real de gatos: 'siames' e 'srd'", () => {
    const gatos = racas.filter((r) => r.especie === "gato");
    expect(buscarRacas(gatos, "siames")[0]?.id).toBe("siames");
    expect(buscarRacas(gatos, "srd")[0]?.id).toBe("vira-lata-gato");
  });
});

describe("parseRacas", () => {
  it("aceita raça válida (sem levar 'fonte' para o domínio)", () => {
    expect(parseRacas({ racas: [valida] })).toEqual({ racas: [fixtures.shihTzu], erros: [] });
  });

  it("semRaca é opcional (padrão false) e aceita true", () => {
    expect(parseRacas({ racas: [{ ...valida, semRaca: undefined }] }).racas[0]?.semRaca).toBe(false);
    expect(parseRacas(com((x) => (x.semRaca = true))).racas[0]?.semRaca).toBe(true);
  });

  it("aceita peso típico null sem fonte", () => {
    const r = parseRacas(com((x) => ((x.pesoTipicoKg = null), (x.fonte = null))));
    expect(r.racas[0]?.pesoTipicoKg).toBeNull();
  });

  it.each([null, undefined, 42, [], {}, { racas: {} }])("arquivo malformado %j não quebra", (dados) => {
    expect(parseRacas(dados)).toEqual({
      racas: [],
      erros: [{ indice: -1, id: null, motivo: "arquivo sem lista 'racas'" }],
    });
  });

  it.each<[string, (r: Record<string, unknown>) => void]>([
    ["id numérico", (r) => (r.id = 1)],
    ["id inválido", (r) => (r.id = "Shih Tzu")],
    ["nome vazio", (r) => (r.nome = " ")],
    ["nome longo", (r) => (r.nome = "x".repeat(41))],
    ["sinonimos não-lista", (r) => (r.sinonimos = "shitzu")],
    ["sinonimo vazio", (r) => (r.sinonimos = [""])],
    ["sinonimos demais", (r) => (r.sinonimos = Array.from({ length: 11 }, (_, i) => `s${i}`))],
    ["espécie desconhecida", (r) => (r.especie = "cavalo")],
    ["peso texto", (r) => (r.pesoTipicoKg = "6")],
    ["peso abaixo do plausível", (r) => (r.pesoTipicoKg = 0.1)],
    ["peso acima do plausível", (r) => (r.pesoTipicoKg = 200)],
    ["peso NaN", (r) => (r.pesoTipicoKg = Number.NaN)],
    ["peso sem fonte", (r) => (r.fonte = null)],
    ["fonte não-texto", (r) => (r.fonte = 5)],
    ["fonte ausente com peso null", (r) => ((r.pesoTipicoKg = null), delete r.fonte)],
    ["kRaca ausente", (r) => delete r.kRaca],
    ["kRaca absurdo", (r) => (r.kRaca = 3)],
    ["destaque não-booleano", (r) => (r.destaque = "sim")],
    ["semRaca não-booleano", (r) => (r.semRaca = 1)],
  ])("descarta raça com %s", (_caso, patch) => {
    const r = parseRacas(com(patch));
    expect(r.racas).toEqual([]);
    expect(r.erros).toHaveLength(1);
  });

  it("raça não-objeto é descartada", () => {
    expect(parseRacas({ racas: ["pug"] }).erros).toEqual([{ indice: 0, id: null, motivo: "raça não é objeto" }]);
  });

  it("uma inválida não impede as válidas; id duplicado mantém o primeiro", () => {
    const r = parseRacas({ racas: [{ id: "x" }, valida, valida] });
    expect(r.racas.map((x: Raca) => x.id)).toEqual(["shih-tzu"]);
    expect(r.erros).toEqual([
      { indice: 0, id: "x", motivo: "nome inválido" },
      { indice: 2, id: "shih-tzu", motivo: "id duplicado" },
    ]);
  });
});

describe("JsonRacaRepository", () => {
  it("lista as válidas e registra as ignoradas", () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const repo = new JsonRacaRepository({ racas: [valida, { id: "ruim" }] }, logger);
    expect(repo.listar().map((r) => r.id)).toEqual(["shih-tzu"]);
    expect(logger.warn).toHaveBeenCalledWith("Raça ignorada", expect.objectContaining({ id: "ruim" }));
  });
});
