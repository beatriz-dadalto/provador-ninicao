import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { CatalogoRacas } from "../application/catalogo-racas";
import { ListarRecomendacoes } from "../application/listar-recomendacoes";
import type { Dependencias } from "../app/container";
import { DependenciasProvider } from "../app/dependencias-context";
import type { Modelo } from "../domain/modelo";
import type { Raca } from "../domain/raca";
import { criarRecomendadorPadrao } from "../domain/recomendador";
import { capaPlush, listaRacas } from "../domain/test-fixtures";

export function criarDepsTeste(modelos: readonly Modelo[] = [capaPlush], racas: readonly Raca[] = listaRacas) {
  const logger = { warn: vi.fn(), error: vi.fn() };
  return {
    logger,
    listarRecomendacoes: new ListarRecomendacoes({ listar: () => modelos }, criarRecomendadorPadrao(), logger),
    catalogoRacas: new CatalogoRacas({ listar: () => racas }),
  } satisfies Dependencias;
}

export function renderComDeps(ui: ReactElement, deps: Dependencias = criarDepsTeste()) {
  return { user: userEvent.setup(), deps, ...render(<DependenciasProvider value={deps}>{ui}</DependenciasProvider>) };
}
