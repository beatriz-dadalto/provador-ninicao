import type { Raca } from "./raca";

/** Máximo de erros de digitação tolerados (distância de edição). */
export const MAX_DISTANCIA = 2;

/**
 * Tolerância proporcional ao que já foi digitado: 2 erros em 4 letras casariam com quase tudo
 * ("dach" ≈ "raca"). Até 3 letras: só prefixo; 4–6: 1 erro; 7+: MAX_DISTANCIA.
 */
export const toleranciaPara = (termo: string): number => (termo.length < 4 ? 0 : termo.length < 7 ? 1 : MAX_DISTANCIA);
export const MAX_RESULTADOS = 6;
/** Limita o custo por toque de tecla (nomes de raça têm < 40 caracteres). */
const MAX_CHARS_TERMO = 40;

/** Insensível a acento, caixa e pontuação: "Shih-Tzu" e "shih tzu" viram a mesma chave. */
export const normalizar = (texto: string): string =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Levenshtein com duas linhas: O(|a|·|b|) tempo, O(|b|) memória. */
export function distanciaEdicao(a: string, b: string): number {
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      // Índices dentro dos limites por construção (0..b.length).
      atual[j] = Math.min(
        (anterior[j] as number) + 1,
        (atual[j - 1] as number) + 1,
        (anterior[j - 1] as number) + custo,
      );
    }
    anterior = atual;
  }
  return anterior[b.length] as number;
}

/**
 * Pontua um nome/sinônimo já normalizado: 0 = prefixo (do nome inteiro ou de uma palavra);
 * 1..tolerância = aproximado (contra o nome inteiro ou contra o trecho já digitado); null = não casa.
 */
function pontuar(termo: string, chave: string): number | null {
  const partes = [chave, ...chave.split(" ")];
  if (partes.some((p) => p.startsWith(termo))) return 0;
  const tolerancia = toleranciaPara(termo);
  if (tolerancia === 0) return null;
  const d = Math.min(
    ...partes.flatMap((p) => [distanciaEdicao(termo, p), distanciaEdicao(termo, p.slice(0, termo.length))]),
  );
  return d <= tolerancia ? d : null;
}

/**
 * Busca linear O(n·m): n raças (~30) × m chaves por raça × custo da distância (≤ 40²).
 * Para uma lista desse tamanho é instantâneo e dispensa índice ou biblioteca (orçamento de bundle).
 * Empate: mantém a ordem da lista (sort estável), que já põe as raças mais comuns primeiro.
 */
export function buscarRacas(racas: readonly Raca[], entrada: string): readonly Raca[] {
  const termo = normalizar(entrada.slice(0, MAX_CHARS_TERMO));
  if (termo === "") return [];

  const pontuadas: { raca: Raca; pontos: number }[] = [];
  for (const raca of racas) {
    const pontos = [raca.nome, ...raca.sinonimos].map((c) => pontuar(termo, normalizar(c))).filter((p) => p !== null);
    if (pontos.length > 0) pontuadas.push({ raca, pontos: Math.min(...pontos) });
  }
  return pontuadas
    .sort((a, b) => a.pontos - b.pontos)
    .slice(0, MAX_RESULTADOS)
    .map((p) => p.raca);
}
