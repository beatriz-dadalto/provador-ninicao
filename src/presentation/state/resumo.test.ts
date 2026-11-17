import { describe, expect, it } from "vitest";
import { racas } from "../../domain/test-fixtures";
import { estadoInicial, type ProvadorState } from "./provador-reducer";
import { resumoRespostas } from "./resumo";

const base: ProvadorState = { ...estadoInicial, especie: "cao", passo: "resultado" };
const rotulos = (s: ProvadorState) => resumoRespostas(s).map((c) => `${c.passo}:${c.rotulo}`);

describe("resumoRespostas (chips do resultado)", () => {
  it("sem espécie: nenhum chip", () => {
    expect(resumoRespostas(estadoInicial)).toEqual([]);
  });

  it("estimativa com faixa", () => {
    const s: ProvadorState = {
      ...base,
      origem: "estimativa",
      raca: racas.shihTzu,
      peso: { tipo: "faixa", faixaId: "6-10" },
      condicao: "normal",
    };
    expect(rotulos(s)).toEqual(["especie:Cachorro", "raca:Shih Tzu", "peso:6 a 10 kg", "condicao:Normal"]);
  });

  it("estimativa com 'Não sei' e porte (vira-lata)", () => {
    const s: ProvadorState = {
      ...base,
      origem: "estimativa",
      raca: racas.viraLata,
      peso: { tipo: "nao-sei" },
      porte: "grande",
      condicao: "cheinho",
    };
    expect(rotulos(s)).toEqual([
      "especie:Cachorro",
      "raca:Vira-lata",
      "peso:Peso: não sei",
      "porte:Porte grande",
      "condicao:Cheinho",
    ]);
  });

  it("porte antigo não aparece se a raça atual tem peso típico", () => {
    const s: ProvadorState = {
      ...base,
      origem: "estimativa",
      raca: racas.shihTzu,
      peso: { tipo: "nao-sei" },
      porte: "grande",
      condicao: "normal",
    };
    expect(rotulos(s)).not.toContain("porte:Porte grande");
  });

  it("faixa desconhecida é omitida, sem quebrar", () => {
    const s: ProvadorState = {
      ...base,
      origem: "estimativa",
      raca: racas.shihTzu,
      peso: { tipo: "faixa", faixaId: "x" },
    };
    expect(rotulos(s)).toEqual(["especie:Cachorro", "raca:Shih Tzu"]);
  });

  it("medida: espécie e peito (sem raça/peso, mesmo que tenham sido respondidos antes)", () => {
    const s: ProvadorState = { ...base, origem: "medida", raca: racas.shihTzu, toraxCm: 46.5 };
    expect(rotulos(s)).toEqual(["especie:Cachorro", "medida:Peito 46,5 cm"]);
    expect(rotulos({ ...s, toraxCm: null })).toEqual(["especie:Cachorro"]);
  });
});
