import { err, ok, type Result } from "./result";

export type ErroMedida = "vazio" | "invalido" | "abaixo" | "acima";

/**
 * Faixas plausíveis para cães e gatos domésticos. Servem para prevenir erro de digitação
 * (heurística 5 de Nielsen) e validar dados (peso típico das raças), não para decidir tamanho.
 */
export const LIMITES = {
  pesoKg: { min: 0.3, max: 80 },
  toraxCm: { min: 15, max: 120 },
} as const;

const MAX_CHARS = 8;
/** Apenas dígitos com no máximo um separador decimal (vírgula ou ponto). */
const DECIMAL_BR = /^\d{1,3}(?:[.,]\d{1,2})?$/;

function parseDecimal(entrada: string, faixa: { min: number; max: number }): Result<number, ErroMedida> {
  const texto = entrada.trim();
  if (texto === "") return err("vazio");
  if (texto.length > MAX_CHARS || !DECIMAL_BR.test(texto)) return err("invalido");

  const bruto = Number(texto.replace(",", "."));
  // Valida o valor digitado ANTES de arredondar: 120,01 não pode virar 120 e passar.
  if (bruto < faixa.min) return err("abaixo");
  if (bruto > faixa.max) return err("acima");

  // Arredonda para 1 casa trabalhando em décimos (46,55 → 46,6, sem erro de ponto flutuante).
  return ok(Math.round(bruto * 10) / 10);
}

export const parseToraxCm = (entrada: string) => parseDecimal(entrada, LIMITES.toraxCm);
