import { FAIXAS_PESO } from "../../domain/faixas-peso";
import { copy } from "../copy";
import { type Passo, precisaPorte, type ProvadorState } from "./provador-reducer";

export interface RespostaResumo {
  readonly passo: Passo;
  readonly rotulo: string;
}

/** Chips do resultado: cada resposta dada, na ordem do caminho, levando ao passo que a edita. */
export function resumoRespostas(s: ProvadorState): readonly RespostaResumo[] {
  if (s.especie === null) return [];
  const chips: RespostaResumo[] = [{ passo: "especie", rotulo: copy.especie.opcoes[s.especie] }];

  if (s.origem === "medida") {
    if (s.toraxCm !== null) chips.push({ passo: "medida", rotulo: copy.chip.peito(s.toraxCm) });
    return chips;
  }

  if (s.raca) chips.push({ passo: "raca", rotulo: s.raca.nome });
  const { peso } = s;
  if (peso?.tipo === "nao-sei") chips.push({ passo: "peso", rotulo: copy.chip.pesoNaoSei });
  if (peso?.tipo === "faixa") {
    const faixa = FAIXAS_PESO[s.especie].find((f) => f.id === peso.faixaId);
    if (faixa) chips.push({ passo: "peso", rotulo: copy.peso.faixa(faixa) });
  }
  if (precisaPorte(s) && s.porte) chips.push({ passo: "porte", rotulo: copy.chip.porte(s.porte) });
  if (s.condicao) chips.push({ passo: "condicao", rotulo: copy.condicao.opcoes[s.condicao] });
  return chips;
}
