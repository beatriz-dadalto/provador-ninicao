import { describe, expect, it } from "vitest";
import { listaRacas } from "../domain/test-fixtures";
import { CatalogoRacas } from "./catalogo-racas";

const catalogo = new CatalogoRacas({ listar: () => listaRacas });
const ids = (xs: readonly { id: string }[]) => xs.map((r) => r.id);

describe("CatalogoRacas", () => {
  it("destaques da espécie, na ordem dos dados", () => {
    expect(ids(catalogo.destaques("cao"))).toEqual(["shih-tzu", "dachshund"]);
    expect(ids(catalogo.destaques("gato"))).toEqual(["persa"]);
  });

  it("Vira-lata da espécie (fora dos destaques, sempre disponível)", () => {
    expect(catalogo.semRaca("cao")?.id).toBe("vira-lata");
    expect(catalogo.semRaca("gato")?.id).toBe("vira-lata-gato");
  });

  it("busca só dentro da espécie", () => {
    expect(ids(catalogo.buscar("gato", "vira"))).toEqual(["vira-lata-gato"]);
    expect(ids(catalogo.buscar("cao", "persa"))).toEqual([]);
  });

  it("busca vazia não retorna nada", () => {
    expect(catalogo.buscar("cao", "")).toEqual([]);
  });

  it("repositório vazio não quebra", () => {
    const vazio = new CatalogoRacas({ listar: () => [] });
    expect(vazio.destaques("cao")).toEqual([]);
    expect(vazio.semRaca("cao")).toBeNull();
    expect(vazio.buscar("cao", "pug")).toEqual([]);
  });
});
