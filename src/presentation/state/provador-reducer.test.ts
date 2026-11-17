import { describe, expect, it } from "vitest";
import { PESO_POR_PORTE } from "../../domain/faixas-peso";
import { racas } from "../../domain/test-fixtures";
import {
  estadoInicial,
  etapa,
  podeIrPara,
  type ProvadorAction,
  provadorReducer,
  type ProvadorState,
  selecionarPerfil,
} from "./provador-reducer";

const aplicar = (...acoes: ProvadorAction[]) => acoes.reduce(provadorReducer, estadoInicial);
const em = (s: ProvadorState, ...acoes: ProvadorAction[]) => acoes.reduce(provadorReducer, s);

const ate = {
  raca: () => aplicar({ type: "escolherEspecie", especie: "cao" }),
  peso: (raca = racas.shihTzu) => em(ate.raca(), { type: "escolherRaca", raca }),
  condicao: () => em(ate.peso(), { type: "responderPeso", resposta: { tipo: "faixa", faixaId: "6-10" } }),
  porte: () => em(ate.peso(racas.viraLata), { type: "responderPeso", resposta: { tipo: "nao-sei" } }),
  resultado: () => em(ate.condicao(), { type: "escolherCondicao", condicao: "normal" }),
  medida: () => em(ate.raca(), { type: "abrirMedida" }),
};

describe("provadorReducer — caminho por raça e peso", () => {
  it("espécie → raça → peso → condição → resultado, um toque por tela", () => {
    const s = ate.resultado();
    expect(s.passo).toBe("resultado");
    expect(selecionarPerfil(s)).toEqual({
      fonte: "estimativa",
      especie: "cao",
      pesoKg: 8,
      kRaca: 1,
      condicao: "normal",
    });
  });

  it("'Não sei' com peso típico pula o porte e usa o peso da raça", () => {
    let s = em(ate.peso(), { type: "responderPeso", resposta: { tipo: "nao-sei" } });
    expect(s.passo).toBe("condicao");
    s = em(s, { type: "escolherCondicao", condicao: "cheinho" });
    expect(selecionarPerfil(s)).toMatchObject({ pesoKg: 6.25, condicao: "cheinho" });
  });

  it("'Não sei' em vira-lata abre UMA tela de porte, mapeada para peso", () => {
    let s = ate.porte();
    expect(s.passo).toBe("porte");
    s = em(s, { type: "escolherPorte", porte: "grande" }, { type: "escolherCondicao", condicao: "normal" });
    expect(selecionarPerfil(s)).toMatchObject({ pesoKg: PESO_POR_PORTE.cao.grande });
  });

  it("gato sem raça e sem peso: mesmo fluxo de porte", () => {
    const s = aplicar(
      { type: "escolherEspecie", especie: "gato" },
      { type: "escolherRaca", raca: racas.viraLataGato },
      { type: "responderPeso", resposta: { tipo: "nao-sei" } },
      { type: "escolherPorte", porte: "medio" },
      { type: "escolherCondicao", condicao: "magrinho" },
    );
    expect(selecionarPerfil(s)).toEqual({
      fonte: "estimativa",
      especie: "gato",
      pesoKg: PESO_POR_PORTE.gato.medio,
      kRaca: 1,
      condicao: "magrinho",
    });
  });

  it("raça de outra espécie é ignorada (estado sempre consistente)", () => {
    expect(em(ate.raca(), { type: "escolherRaca", raca: racas.persa })).toEqual(ate.raca());
  });

  it("digitar na busca guarda o texto", () => {
    expect(em(ate.raca(), { type: "digitarBusca", texto: "sal" }).busca).toBe("sal");
  });
});

describe("provadorReducer — atalho 'Já sei a medida do peito'", () => {
  it("raça → medida → resultado direto, sem raça nem peso", () => {
    const s = em(ate.medida(), { type: "digitarTorax", texto: "46" }, { type: "confirmarTorax" });
    expect(s.passo).toBe("resultado");
    expect(selecionarPerfil(s)).toEqual({ fonte: "medida", especie: "cao", toraxCm: 46 });
  });

  it("tórax inválido mantém o passo e mostra erro; digitar limpa o erro", () => {
    let s = em(ate.medida(), { type: "digitarTorax", texto: "500" }, { type: "confirmarTorax" });
    expect(s).toMatchObject({ passo: "medida", toraxErro: "acima", toraxCm: null });
    s = em(s, { type: "digitarTorax", texto: "40" });
    expect(s.toraxErro).toBeNull();
  });

  it("a última rota concluída decide a origem do resultado", () => {
    // Fez a estimativa, voltou e usou a medida: resultado por medida.
    let s = em(ate.resultado(), { type: "irPara", passo: "medida" }, { type: "digitarTorax", texto: "46" });
    s = em(s, { type: "confirmarTorax" });
    expect(selecionarPerfil(s)?.fonte).toBe("medida");
    // E o inverso.
    s = em(s, { type: "irPara", passo: "condicao" }, { type: "escolherCondicao", condicao: "normal" });
    expect(selecionarPerfil(s)?.fonte).toBe("estimativa");
  });
});

describe("provadorReducer — voltar, editar, reiniciar", () => {
  it.each<[string, () => ProvadorState, string]>([
    ["especie", () => estadoInicial, "especie"],
    ["raca", ate.raca, "especie"],
    ["peso", ate.peso, "raca"],
    ["porte", ate.porte, "peso"],
    ["condicao (sem porte)", ate.condicao, "peso"],
    ["condicao (com porte)", () => em(ate.porte(), { type: "escolherPorte", porte: "medio" }), "porte"],
    ["medida", ate.medida, "raca"],
    ["resultado (estimativa)", ate.resultado, "condicao"],
    [
      "resultado (medida)",
      () => em(ate.medida(), { type: "digitarTorax", texto: "46" }, { type: "confirmarTorax" }),
      "medida",
    ],
  ])("voltar de %s → %s", (_de, estado, para) => {
    expect(provadorReducer(estado(), { type: "voltar" }).passo).toBe(para);
  });

  it("voltar preserva todas as respostas", () => {
    const s = em(ate.resultado(), { type: "voltar" }, { type: "voltar" }, { type: "voltar" });
    expect(s).toMatchObject({
      passo: "raca",
      raca: racas.shihTzu,
      peso: { tipo: "faixa", faixaId: "6-10" },
      condicao: "normal",
    });
  });

  it("voltar da medida preserva o texto digitado", () => {
    const s = em(ate.medida(), { type: "digitarTorax", texto: "46" }, { type: "voltar" }, { type: "abrirMedida" });
    expect(s.toraxTexto).toBe("46");
  });

  it("editar pelo chip leva ao passo e mantém as demais respostas", () => {
    const s = em(ate.resultado(), { type: "irPara", passo: "peso" });
    expect(s).toMatchObject({ passo: "peso", raca: racas.shihTzu, condicao: "normal" });
  });

  it("escolher a MESMA espécie preserva tudo; trocar de espécie limpa o que dependia dela", () => {
    const mesma = em(
      ate.resultado(),
      { type: "irPara", passo: "especie" },
      { type: "escolherEspecie", especie: "cao" },
    );
    expect(mesma).toMatchObject({ passo: "raca", raca: racas.shihTzu, peso: { tipo: "faixa" }, condicao: "normal" });

    const outra = em(ate.resultado(), { type: "escolherEspecie", especie: "gato" });
    expect(outra).toMatchObject({ passo: "raca", raca: null, peso: null, porte: null, condicao: null, busca: "" });
    expect(selecionarPerfil(outra)).toBeNull();
  });

  it("trocar para raça com peso típico depois de 'Não sei' dispensa o porte", () => {
    const s = em(ate.porte(), { type: "voltar" }, { type: "voltar" }, { type: "escolherRaca", raca: racas.spitz });
    expect(s.passo).toBe("peso");
    expect(em(s, { type: "responderPeso", resposta: { tipo: "nao-sei" } }).passo).toBe("condicao");
  });

  it("reiniciar volta ao estado inicial", () => {
    expect(provadorReducer(ate.resultado(), { type: "reiniciar" })).toBe(estadoInicial);
  });

  it("é imutável: não altera o estado anterior", () => {
    const antes = ate.peso();
    const copia = structuredClone(antes);
    provadorReducer(antes, { type: "responderPeso", resposta: { tipo: "nao-sei" } });
    expect(antes).toEqual(copia);
  });
});

describe("podeIrPara / guarda de passos", () => {
  it("não deixa pular para passos sem os dados exigidos", () => {
    expect(podeIrPara(estadoInicial, "especie")).toBe(true);
    for (const p of ["raca", "peso", "porte", "condicao", "medida", "resultado"] as const) {
      expect(podeIrPara(estadoInicial, p)).toBe(false);
    }
    expect(podeIrPara(ate.raca(), "medida")).toBe(true);
    expect(podeIrPara(ate.raca(), "peso")).toBe(false);
    expect(podeIrPara(ate.peso(), "condicao")).toBe(false);
    expect(podeIrPara(ate.condicao(), "porte")).toBe(false); // faixa escolhida: porte não se aplica
    expect(podeIrPara(ate.porte(), "condicao")).toBe(false); // falta o porte
    expect(podeIrPara(ate.condicao(), "resultado")).toBe(false); // falta a condição
  });

  it("irPara e ações fora de ordem não mudam o estado", () => {
    expect(provadorReducer(estadoInicial, { type: "irPara", passo: "resultado" })).toBe(estadoInicial);
    expect(provadorReducer(estadoInicial, { type: "abrirMedida" })).toBe(estadoInicial);
    expect(provadorReducer(estadoInicial, { type: "escolherRaca", raca: racas.shihTzu })).toBe(estadoInicial);
    expect(provadorReducer(ate.raca(), { type: "responderPeso", resposta: { tipo: "nao-sei" } })).toEqual(ate.raca());
    expect(provadorReducer(ate.peso(), { type: "escolherPorte", porte: "medio" }).passo).toBe("peso");
    expect(provadorReducer(ate.peso(), { type: "escolherCondicao", condicao: "normal" }).passo).toBe("peso");
    expect(provadorReducer(estadoInicial, { type: "confirmarTorax" }).passo).toBe("especie");
  });
});

describe("selecionarPerfil", () => {
  it("null sem dados completos", () => {
    expect(selecionarPerfil(estadoInicial)).toBeNull();
    expect(selecionarPerfil(ate.condicao())).toBeNull();
    expect(selecionarPerfil({ ...ate.resultado(), raca: null })).toBeNull();
    expect(selecionarPerfil({ ...ate.resultado(), peso: { tipo: "faixa", faixaId: "x" } })).toBeNull();
    expect(selecionarPerfil({ ...ate.resultado(), origem: "medida" })).toBeNull(); // sem tórax
  });
});

describe("etapa (barra de progresso)", () => {
  it("4 passos no caminho comum; 5 quando precisa de porte; 3 no atalho de medida", () => {
    expect(etapa(estadoInicial)).toEqual({ atual: 1, total: 4 });
    expect(etapa(ate.peso())).toEqual({ atual: 3, total: 4 });
    expect(etapa(ate.porte())).toEqual({ atual: 3, total: 4 });
    expect(etapa(ate.condicao())).toEqual({ atual: 4, total: 4 });
    expect(etapa(ate.medida())).toEqual({ atual: 3, total: 4 });
    expect(etapa(ate.resultado())).toBeUndefined();
  });
});
