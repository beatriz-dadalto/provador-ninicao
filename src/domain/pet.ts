export const ESPECIES = ["cao", "gato"] as const;
export type Especie = (typeof ESPECIES)[number];

/** Resposta de "Ele é…". Equivalência aproximada com o escore corporal (BCS 1–9) em estimativa-torax.ts. */
export const CONDICOES = ["magrinho", "normal", "cheinho"] as const;
export type CondicaoCorporal = (typeof CONDICOES)[number];

/** Resposta de "Qual o porte?" (só para quem não sabe o peso e a raça não tem peso típico). */
export const PORTES = ["pequeno", "medio", "grande"] as const;
export type Porte = (typeof PORTES)[number];

/**
 * O que sabemos do pet para recomendar. Duas origens, nunca misturadas:
 * - `medida`: o tutor digitou a volta do peito (confiança alta);
 * - `estimativa`: tórax estimado por peso, raça e condição corporal (confiança média).
 */
export type PerfilPet =
  | { readonly fonte: "medida"; readonly especie: Especie; readonly toraxCm: number }
  | {
      readonly fonte: "estimativa";
      readonly especie: Especie;
      readonly pesoKg: number;
      /** Multiplicador de formato da raça (1,0 = sem calibração). */
      readonly kRaca: number;
      readonly condicao: CondicaoCorporal;
    };
