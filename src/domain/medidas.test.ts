import { describe, expect, it } from "vitest";
import { LIMITES, parseToraxCm } from "./medidas";

describe("parseToraxCm", () => {
  it.each([
    ["46,5", 46.5],
    ["46.5", 46.5],
    [" 46 ", 46],
    ["15", 15],
    ["120", 120],
  ])("aceita %j → %d", (entrada, esperado) => {
    expect(parseToraxCm(entrada)).toEqual({ ok: true, value: esperado });
  });

  it.each([
    ["", "vazio"],
    ["   ", "vazio"],
    ["abc", "invalido"],
    ["46,5,1", "invalido"],
    ["1e3", "invalido"],
    ["-20", "invalido"],
    ["Infinity", "invalido"],
    ["NaN", "invalido"],
    ["0x10", "invalido"],
    ["0", "abaixo"],
    ["14,9", "abaixo"],
    ["120,01", "acima"],
    ["999", "acima"],
  ])("rejeita %j com %s", (entrada, erro) => {
    expect(parseToraxCm(entrada)).toEqual({ ok: false, error: erro });
  });

  it("aceita os limites exatos", () => {
    expect(parseToraxCm(String(LIMITES.toraxCm.min))).toEqual({ ok: true, value: LIMITES.toraxCm.min });
    expect(parseToraxCm(String(LIMITES.toraxCm.max))).toEqual({ ok: true, value: LIMITES.toraxCm.max });
  });

  it("arredonda para 1 casa decimal sem erro de ponto flutuante", () => {
    expect(parseToraxCm("46,55")).toEqual({ ok: true, value: 46.6 });
    expect(parseToraxCm("21,05")).toEqual({ ok: true, value: 21.1 });
  });

  it("limita o tamanho da entrada (evita processamento de strings enormes)", () => {
    expect(parseToraxCm("1".repeat(1000))).toEqual({ ok: false, error: "invalido" });
  });
});
