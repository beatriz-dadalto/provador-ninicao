/** Ferramentas comuns aos parsers de dados externos (modelos, raças): DRY e mesma política de erro. */

export type Obj = Record<string, unknown>;

export const ID = /^[a-z0-9-]{1,40}$/;

export const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
export const isNumPos = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
export const isTexto = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;

/** Erro de validação esperado (dado ruim). Qualquer outro erro é bug e propaga. */
export class Invalido extends Error {}

export function exigir(cond: unknown, motivo: string): asserts cond {
  if (!cond) throw new Invalido(motivo);
}

export interface ErroItem {
  readonly indice: number;
  readonly id: string | null;
  readonly motivo: string;
}

/**
 * Valida `dados[chave]` item a item. Itens inválidos são descartados (o app segue com os demais)
 * e reportados em `erros`. IDs duplicados: vale o primeiro.
 */
export function parseLista<T extends { readonly id: string }>(
  dados: unknown,
  chave: string,
  parseItem: (bruto: unknown) => T,
): { readonly itens: readonly T[]; readonly erros: readonly ErroItem[] } {
  const lista = isObj(dados) ? dados[chave] : undefined;
  if (!Array.isArray(lista)) {
    return { itens: [], erros: [{ indice: -1, id: null, motivo: `arquivo sem lista '${chave}'` }] };
  }
  const itens: T[] = [];
  const erros: ErroItem[] = [];
  const ids = new Set<string>();

  lista.forEach((bruto: unknown, indice) => {
    const id = isObj(bruto) && typeof bruto.id === "string" ? bruto.id : null;
    try {
      const item = parseItem(bruto);
      exigir(!ids.has(item.id), "id duplicado");
      ids.add(item.id);
      itens.push(item);
    } catch (e) {
      if (!(e instanceof Invalido)) throw e;
      erros.push({ indice, id, motivo: e.message });
    }
  });

  return { itens, erros };
}
