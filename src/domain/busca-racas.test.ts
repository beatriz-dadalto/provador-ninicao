import { describe, expect, it } from "vitest";
import { buscarRacas, distanciaEdicao, MAX_RESULTADOS, normalizar, toleranciaPara } from "./busca-racas";
import type { Raca } from "./raca";
import { listaRacas, racas } from "./test-fixtures";

const caes = listaRacas.filter((r) => r.especie === "cao");
const ids = (termo: string, lista: readonly Raca[] = caes) => buscarRacas(lista, termo).map((r) => r.id);

describe("normalizar", () => {
  it("remove acento, caixa, pontuação e espaços extras", () => {
    expect(normalizar("  Lulu da POMERÂNIA ")).toBe("lulu da pomerania");
    expect(normalizar("Shih-Tzu")).toBe("shih tzu");
    expect(normalizar("Bulldog   Francês!")).toBe("bulldog frances");
    expect(normalizar("")).toBe("");
  });
});

describe("distanciaEdicao (Levenshtein)", () => {
  it.each([
    ["", "", 0],
    ["abc", "", 3],
    ["", "abc", 3],
    ["pug", "pug", 0],
    ["yorkshre", "yorkshire", 1],
    ["shitzu", "shih tzu", 2],
    ["kitten", "sitting", 3],
  ])("%j × %j = %d", (a, b, d) => {
    expect(distanciaEdicao(a, b)).toBe(d);
  });
});

describe("buscarRacas", () => {
  it("busca vazia ou só espaços → nenhum resultado (a tela mostra os destaques)", () => {
    expect(ids("")).toEqual([]);
    expect(ids("   ")).toEqual([]);
    expect(ids("--")).toEqual([]);
  });

  it("por nome, ignorando caixa e acento", () => {
    expect(ids("SHIH TZU")).toEqual(["shih-tzu"]);
    expect(ids("bulldog frances")).toEqual(["bulldog-frances"]);
    expect(ids("francês")).toEqual(["bulldog-frances"]); // prefixo de outra palavra do nome
  });

  it("por prefixo enquanto digita", () => {
    expect(ids("dach")).toEqual(["dachshund"]);
    expect(ids("s")).toEqual(["shih-tzu", "dachshund", "spitz", "vira-lata"]);
  });

  it("por sinônimo (salsicha → Dachshund, SRD/sem raça → Vira-lata, com acento)", () => {
    expect(ids("salsicha")).toEqual(["dachshund"]);
    expect(ids("srd")).toEqual(["vira-lata"]);
    expect(ids("sem raca")).toEqual(["vira-lata"]);
    expect(ids("pomerania")).toEqual(["spitz"]);
  });

  it("tolera erro de digitação até 2 edições", () => {
    expect(ids("shitsu")).toEqual(["shih-tzu"]);
    expect(ids("salcicha")).toEqual(["dachshund"]);
    expect(ids("bulldog francez")).toEqual(["bulldog-frances"]);
    expect(ids("salsixx")).toEqual(["dachshund"]); // erro no meio da digitação (prefixo)
  });

  it("tolerância cresce com o termo: 0 até 3 letras, 1 de 4 a 6, 2 a partir de 7", () => {
    expect([3, 4, 6, 7, 20].map((n) => toleranciaPara("a".repeat(n)))).toEqual([0, 1, 1, 2, 2]);
  });

  it("erros acima da tolerância não casam (evita ruído)", () => {
    expect(ids("xyzabc")).toEqual([]);
    expect(ids("dax")).toEqual([]); // < 4 letras: só prefixo exato
    expect(ids("shitxx")).toEqual([]); // 6 letras, 2 erros
    expect(ids("dach")).toEqual(["dachshund"]); // não casa "raça"/"da" por aproximação
  });

  it("raça desconhecida → lista vazia, sem erro", () => {
    expect(ids("ornitorrinco")).toEqual([]);
  });

  it("prefixo exato vem antes de casamento aproximado", () => {
    const lista: Raca[] = [
      { ...racas.shihTzu, id: "a", nome: "Bolonhês", sinonimos: [] },
      { ...racas.shihTzu, id: "b", nome: "Boloh", sinonimos: [] },
    ];
    expect(ids("bolonh", lista)).toEqual(["a", "b"]);
  });

  it(`limita a ${MAX_RESULTADOS} resultados`, () => {
    const muitas = Array.from({ length: 10 }, (_, i) => ({ ...racas.shihTzu, id: `r${i}`, nome: `Raça ${i}` }));
    expect(ids("raca", muitas)).toHaveLength(MAX_RESULTADOS);
  });

  it("entrada enorme é truncada (custo limitado) e não quebra", () => {
    expect(ids("salsicha".padEnd(10_000, "x"))).toEqual([]);
  });
});
