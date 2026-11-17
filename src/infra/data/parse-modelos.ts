import { naoVazia } from "../../domain/colecoes";
import { DESEMPATES, type Desempate, type Modelo, type TamanhoGrade } from "../../domain/modelo";
import { ESPECIES, type Especie } from "../../domain/pet";
import { type ErroItem, exigir, ID, isNumPos, isObj, isTexto, parseLista } from "./validacao";

export type ErroModelo = ErroItem;

export interface ResultadoParse {
  readonly modelos: readonly Modelo[];
  readonly erros: readonly ErroModelo[];
}

const HOST_PERMITIDO = "shopee.com.br";
/**
 * Miniatura só local (CSP img-src 'self' e direitos de imagem): caminho relativo simples,
 * sem protocolo, sem "..", sem barra inicial.
 */
const MINIATURA = /^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:webp|png|jpg|svg)$/;
const LIMITE_TAMANHOS = 10;

/** OWASP A03/A10: só links https para a Shopee — bloqueia javascript:, data: e redirecionamento aberto. */
export function urlShopeeSegura(valor: unknown): valor is string {
  if (typeof valor !== "string" || valor.length > 300) return false;
  try {
    const u = new URL(valor);
    return u.protocol === "https:" && u.hostname === HOST_PERMITIDO && u.username === "" && u.password === "";
  } catch {
    return false;
  }
}

function parseTamanho(t: unknown, i: number): TamanhoGrade {
  exigir(isObj(t), `tamanho[${i}] não é objeto`);
  exigir(isTexto(t.tam, 4), `tamanho[${i}].tam inválido`);
  for (const campo of ["pescocoCm", "toraxCm", "comprimentoCm"] as const) {
    exigir(isNumPos(t[campo]) && t[campo] > 0, `tamanho[${i}].${campo} inválido`);
  }
  return {
    tam: t.tam,
    pescocoCm: t.pescocoCm as number,
    toraxCm: t.toraxCm as number,
    comprimentoCm: t.comprimentoCm as number,
  };
}

function parseModelo(m: unknown): Modelo {
  exigir(isObj(m), "modelo não é objeto");
  exigir(typeof m.id === "string" && ID.test(m.id), "id inválido");
  exigir(isTexto(m.nome, 80), "nome inválido");
  exigir(urlShopeeSegura(m.shopeeUrl), "shopeeUrl deve ser https://shopee.com.br/...");
  exigir(
    Array.isArray(m.especies) && m.especies.length > 0 && m.especies.every((e) => ESPECIES.includes(e as Especie)),
    "especies inválidas",
  );
  exigir(isNumPos(m.folgaToraxCm) && m.folgaToraxCm <= 20, "folgaToraxCm inválida");
  exigir(DESEMPATES.includes(m.desempate as Desempate), "desempate deve ser 'maior' ou 'menor'");
  exigir(
    m.miniatura === undefined ||
      (typeof m.miniatura === "string" && m.miniatura.length <= 120 && MINIATURA.test(m.miniatura)),
    "miniatura deve ser caminho local (ex.: modelos/capa.webp)",
  );
  exigir(Array.isArray(m.tamanhos) && m.tamanhos.length <= LIMITE_TAMANHOS, "tamanhos inválidos");

  const tamanhos = m.tamanhos.map(parseTamanho);
  exigir(naoVazia(tamanhos), "tamanhos inválidos");

  let ant: TamanhoGrade | undefined;
  for (const atual of tamanhos) {
    if (ant) exigir(atual.toraxCm > ant.toraxCm, `tórax deve crescer: ${ant.tam} → ${atual.tam}`);
    ant = atual;
  }

  return {
    id: m.id,
    nome: m.nome,
    shopeeUrl: m.shopeeUrl,
    especies: m.especies as Especie[],
    folgaToraxCm: m.folgaToraxCm,
    desempate: m.desempate as Desempate,
    ...(typeof m.miniatura === "string" && { miniatura: m.miniatura }),
    tamanhos,
  };
}

/** Valida dados vindos de fora do domínio; inválidos são descartados e reportados. */
export function parseModelos(dados: unknown): ResultadoParse {
  const { itens, erros } = parseLista(dados, "modelos", parseModelo);
  return { modelos: itens, erros };
}
