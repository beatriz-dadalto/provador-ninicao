import { LIMITES } from "../../domain/medidas";
import { ESPECIES, type Especie } from "../../domain/pet";
import type { Raca } from "../../domain/raca";
import { type ErroItem, exigir, ID, isObj, isTexto, parseLista } from "./validacao";

export interface ResultadoParseRacas {
  readonly racas: readonly Raca[];
  readonly erros: readonly ErroItem[];
}

const MAX_NOME = 40;
const MAX_SINONIMOS = 10;
const MAX_FONTE = 200;
/** Multiplicador de formato plausível; fora disso é erro de digitação nos dados. */
export const FAIXA_K_RACA = { min: 0.5, max: 1.5 } as const;

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function parseRaca(r: unknown): Raca {
  exigir(isObj(r), "raça não é objeto");
  exigir(typeof r.id === "string" && ID.test(r.id), "id inválido");
  exigir(isTexto(r.nome, MAX_NOME), "nome inválido");
  exigir(
    Array.isArray(r.sinonimos) && r.sinonimos.length <= MAX_SINONIMOS && r.sinonimos.every((s) => isTexto(s, MAX_NOME)),
    "sinonimos inválidos",
  );
  exigir(ESPECIES.includes(r.especie as Especie), "especie inválida");
  const peso = r.pesoTipicoKg;
  exigir(
    peso === null || (isNum(peso) && peso >= LIMITES.pesoKg.min && peso <= LIMITES.pesoKg.max),
    "pesoTipicoKg inválido",
  );
  // Regra de dados: nenhum peso típico sem fonte publicada.
  exigir(peso === null || isTexto(r.fonte, MAX_FONTE), "pesoTipicoKg exige fonte");
  exigir(r.fonte === null || isTexto(r.fonte, MAX_FONTE), "fonte inválida");
  exigir(isNum(r.kRaca) && r.kRaca >= FAIXA_K_RACA.min && r.kRaca <= FAIXA_K_RACA.max, "kRaca inválido");
  exigir(typeof r.destaque === "boolean", "destaque inválido");
  exigir(r.semRaca === undefined || typeof r.semRaca === "boolean", "semRaca inválido");

  return {
    id: r.id,
    nome: r.nome,
    sinonimos: r.sinonimos,
    especie: r.especie as Especie,
    pesoTipicoKg: peso,
    kRaca: r.kRaca,
    destaque: r.destaque,
    semRaca: r.semRaca ?? false,
  };
}

/** Valida racas.json; raça inválida é descartada e reportada, as demais seguem. */
export function parseRacas(dados: unknown): ResultadoParseRacas {
  const { itens, erros } = parseLista(dados, "racas", parseRaca);
  return { racas: itens, erros };
}
