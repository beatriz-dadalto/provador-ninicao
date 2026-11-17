/** Lista com ao menos um elemento — o tipo carrega a garantia que o parser valida. */
export type NaoVazia<T> = readonly [T, ...T[]];

export const naoVazia = <T>(xs: readonly T[]): xs is NaoVazia<T> => xs.length > 0;

/** O(1). Seguro por construção: uma NaoVazia sempre tem último elemento. */
export const ultimo = <T>(xs: NaoVazia<T>): T => xs[xs.length - 1] as T;
