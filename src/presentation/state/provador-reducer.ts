import { precisaPorte as precisaPorteDominio, type RespostaPeso, resolverPesoKg } from "../../domain/faixas-peso";
import { type ErroMedida, parseToraxCm } from "../../domain/medidas";
import type { CondicaoCorporal, Especie, PerfilPet, Porte } from "../../domain/pet";
import type { Raca } from "../../domain/raca";

/**
 * Caminho comum: especie → raca → peso → [porte, só se "Não sei" sem peso típico] → condicao → resultado.
 * Atalho:        especie → raca → medida → resultado.
 */
export type Passo = "especie" | "raca" | "peso" | "porte" | "condicao" | "medida" | "resultado";

export interface ProvadorState {
  readonly passo: Passo;
  readonly especie: Especie | null;
  /** Texto da busca de raça (preservado ao voltar). */
  readonly busca: string;
  readonly raca: Raca | null;
  readonly peso: RespostaPeso | null;
  readonly porte: Porte | null;
  readonly condicao: CondicaoCorporal | null;
  readonly toraxTexto: string;
  readonly toraxCm: number | null;
  readonly toraxErro: ErroMedida | null;
  /** Rota concluída por último; decide a origem (e a confiança) do resultado. */
  readonly origem: "estimativa" | "medida" | null;
}

export type ProvadorAction =
  | { type: "escolherEspecie"; especie: Especie }
  | { type: "digitarBusca"; texto: string }
  | { type: "escolherRaca"; raca: Raca }
  | { type: "responderPeso"; resposta: RespostaPeso }
  | { type: "escolherPorte"; porte: Porte }
  | { type: "escolherCondicao"; condicao: CondicaoCorporal }
  | { type: "abrirMedida" }
  | { type: "digitarTorax"; texto: string }
  | { type: "confirmarTorax" }
  | { type: "voltar" }
  | { type: "irPara"; passo: Passo }
  | { type: "reiniciar" };

export const estadoInicial: ProvadorState = {
  passo: "especie",
  especie: null,
  busca: "",
  raca: null,
  peso: null,
  porte: null,
  condicao: null,
  toraxTexto: "",
  toraxCm: null,
  toraxErro: null,
  origem: null,
};

/** A tela de porte faz parte do caminho deste pet? */
export const precisaPorte = (s: ProvadorState): boolean =>
  s.raca !== null && s.peso !== null && precisaPorteDominio(s.peso, s.raca.pesoTipicoKg);

/** Um passo só é alcançável se todos os dados exigidos antes dele existem. */
export function podeIrPara(s: ProvadorState, passo: Passo): boolean {
  switch (passo) {
    case "especie":
      return true;
    case "raca":
    case "medida":
      return s.especie !== null;
    case "peso":
      return s.especie !== null && s.raca !== null;
    case "porte":
      return podeIrPara(s, "peso") && precisaPorte(s);
    case "condicao":
      return podeIrPara(s, "peso") && s.peso !== null && (!precisaPorte(s) || s.porte !== null);
    case "resultado":
      return selecionarPerfil(s) !== null;
  }
}

function anterior(s: ProvadorState): Passo {
  switch (s.passo) {
    case "especie":
    case "raca":
      return "especie";
    case "peso":
    case "medida":
      return "raca";
    case "porte":
      return "peso";
    case "condicao":
      return precisaPorte(s) ? "porte" : "peso";
    case "resultado":
      return s.origem === "medida" ? "medida" : "condicao";
  }
}

/** Avança para `passo` só se ele for alcançável no novo estado; senão mantém o estado anterior. */
const avancar = (antes: ProvadorState, depois: Omit<ProvadorState, "passo">, passo: Passo): ProvadorState => {
  const s = { ...depois, passo };
  return podeIrPara(s, passo) ? s : antes;
};

/** Reducer puro e total: qualquer ação em qualquer estado produz um estado válido. */
export function provadorReducer(s: ProvadorState, a: ProvadorAction): ProvadorState {
  switch (a.type) {
    case "escolherEspecie":
      // Mesma espécie (edição): preserva tudo. Outra: raça e faixas de peso não valem mais.
      return a.especie === s.especie
        ? { ...s, passo: "raca" }
        : {
            ...s,
            especie: a.especie,
            busca: "",
            raca: null,
            peso: null,
            porte: null,
            condicao: null,
            origem: null,
            passo: "raca",
          };

    case "digitarBusca":
      return { ...s, busca: a.texto };

    case "escolherRaca":
      return s.especie !== null && a.raca.especie === s.especie ? avancar(s, { ...s, raca: a.raca }, "peso") : s;

    case "responderPeso": {
      const depois = { ...s, peso: a.resposta };
      return podeIrPara(s, "peso") ? avancar(s, depois, precisaPorte(depois) ? "porte" : "condicao") : s;
    }

    case "escolherPorte":
      return podeIrPara(s, "porte") ? avancar(s, { ...s, porte: a.porte }, "condicao") : s;

    case "escolherCondicao":
      return podeIrPara(s, "condicao")
        ? avancar(s, { ...s, condicao: a.condicao, origem: "estimativa" }, "resultado")
        : s;

    case "abrirMedida":
      return podeIrPara(s, "medida") ? { ...s, passo: "medida" } : s;

    case "digitarTorax":
      return { ...s, toraxTexto: a.texto, toraxErro: null };

    case "confirmarTorax": {
      if (!podeIrPara(s, "medida")) return s;
      const r = parseToraxCm(s.toraxTexto);
      return r.ok
        ? { ...s, toraxCm: r.value, toraxErro: null, origem: "medida", passo: "resultado" }
        : { ...s, toraxCm: null, toraxErro: r.error };
    }

    case "voltar":
      return { ...s, passo: anterior(s) };

    case "irPara":
      return podeIrPara(s, a.passo) ? { ...s, passo: a.passo } : s;

    case "reiniciar":
      return estadoInicial;
  }
}

/** Seletor: monta o PerfilPet do domínio apenas quando a rota escolhida está completa. */
export function selecionarPerfil(s: ProvadorState): PerfilPet | null {
  const { especie } = s;
  if (especie === null) return null;
  if (s.origem === "medida") {
    return s.toraxCm === null ? null : { fonte: "medida", especie, toraxCm: s.toraxCm };
  }
  if (s.origem !== "estimativa" || s.raca === null || s.peso === null || s.condicao === null) return null;
  const pesoKg = resolverPesoKg(especie, s.peso, s.raca.pesoTipicoKg, s.porte);
  return pesoKg === null ? null : { fonte: "estimativa", especie, pesoKg, kRaca: s.raca.kRaca, condicao: s.condicao };
}

/**
 * Barra de progresso com total FIXO (Nielsen 4 — consistência): o total nunca muda no meio do fluxo.
 * Porte e medida ocupam a posição do peso (complementam/substituem essa pergunta), então a barra
 * nunca promete menos passos do que a pessoa terá. Sem barra no resultado.
 */
export const TOTAL_ETAPAS = 4;
const POSICAO: Readonly<Record<Exclude<Passo, "resultado">, number>> = {
  especie: 1,
  raca: 2,
  peso: 3,
  porte: 3,
  medida: 3,
  condicao: 4,
};

export function etapa(s: ProvadorState): { readonly atual: number; readonly total: number } | undefined {
  if (s.passo === "resultado") return undefined;
  return { atual: POSICAO[s.passo], total: TOTAL_ETAPAS };
}
