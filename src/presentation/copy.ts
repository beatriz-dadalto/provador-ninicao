import type { FaixaPeso } from "../domain/faixas-peso";
import { type ErroMedida, LIMITES } from "../domain/medidas";
import type { CondicaoCorporal, Especie, Porte } from "../domain/pet";
import type { Confianca } from "../domain/recomendacao";

const fmt = (n: number) => n.toLocaleString("pt-BR");

const porteMinusculo: Record<Porte, string> = { pequeno: "pequeno", medio: "médio", grande: "grande" };

/**
 * Toda a microcopy num lugar só (SRP): títulos curtos, sem parágrafos, nada de instrução (Krug).
 * Erros dizem como corrigir (Nielsen 9).
 */
export const copy = {
  versaoTeste: "Versão de teste",
  marca: "Ninicão",
  voltar: "Voltar",
  continuar: "Continuar",
  progresso: (atual: number, total: number) => `Passo ${atual} de ${total}`,
  progressoCurto: (atual: number, total: number) => `${atual} de ${total}`,

  especie: {
    titulo: "Qual é o seu pet?",
    opcoes: { cao: "Cachorro", gato: "Gato" } satisfies Record<Especie, string>,
  },

  raca: {
    titulo: "Qual a raça?",
    rotuloBusca: "Buscar raça",
    placeholder: "Digite a raça",
    limpar: "Limpar busca",
    populares: "Raças comuns",
    resultados: "Raças encontradas",
    nenhuma: "Não achou? Toque em Vira-lata.",
    jaSeiMedida: "Já sei a medida do peito",
  },

  peso: {
    titulo: "Quanto pesa, mais ou menos?",
    naoSei: "Não sei",
    faixa: (f: FaixaPeso) =>
      f.maxKg === null
        ? `Mais de ${fmt(f.minKg)} kg`
        : f.minKg === 0
          ? `Até ${fmt(f.maxKg)} kg`
          : `${fmt(f.minKg)} a ${fmt(f.maxKg)} kg`,
  },

  porte: {
    titulo: "Qual o porte?",
    opcoes: { pequeno: "Pequeno", medio: "Médio", grande: "Grande" } satisfies Record<Porte, string>,
  },

  condicao: {
    titulo: "Ele é…",
    opcoes: { magrinho: "Magrinho", normal: "Normal", cheinho: "Cheinho" } satisfies Record<CondicaoCorporal, string>,
  },

  medida: {
    titulo: "Medida do peito",
    rotulo: "Volta do peito",
    unidade: "cm",
  },

  resultado: {
    titulo: "Tamanho ideal",
    tamanho: (tam: string) => `Tamanho ${tam}`,
    comprar: (tam: string) => `Comprar ${tam} na Shopee`,
    origem: { alta: "Pela medida do peito", media: "Pela raça e peso" } satisfies Record<Confianca, string>,
    outros: "Outros modelos",
    acimaDaGrade: (maior: string) => `Maior que o ${maior}. Fale com a loja no chat da Shopee.`,
    vazio: "Ainda não temos modelos para esse pet.",
    editar: "Toque para editar",
    recomecar: "Recomeçar",
  },

  chip: {
    pesoNaoSei: "Peso: não sei",
    porte: (p: Porte) => `Porte ${porteMinusculo[p]}`,
    peito: (cm: number) => `Peito ${fmt(cm)} cm`,
  },

  falha: {
    titulo: "Algo deu errado",
    acao: "Recomeçar",
  },
} as const;

export function erroTorax(erro: ErroMedida): string {
  const { min, max } = LIMITES.toraxCm;
  switch (erro) {
    case "vazio":
      return "Digite um número.";
    case "invalido":
      return "Use só números. Ex.: 46";
    case "abaixo":
      return `Mínimo ${fmt(min)} cm.`;
    case "acima":
      return `Máximo ${fmt(max)} cm.`;
  }
}
