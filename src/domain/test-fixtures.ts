import type { Modelo } from "./modelo";
import type { CondicaoCorporal, Especie, PerfilPet } from "./pet";
import type { Raca } from "./raca";

/** Grade da capa plush como publicada na Shopee em 16/11/2026 (fixture estável para testes). */
export const capaPlush: Modelo = {
  id: "capa-plush",
  nome: "Capa de inverno plush",
  shopeeUrl: "https://shopee.com.br/product/479899025/23193407408",
  especies: ["cao", "gato"],
  folgaToraxCm: 3,
  desempate: "maior",
  tamanhos: [
    { tam: "PP", pescocoCm: 25, toraxCm: 36, comprimentoCm: 22 },
    { tam: "P", pescocoCm: 30, toraxCm: 45, comprimentoCm: 29 },
    { tam: "M", pescocoCm: 36, toraxCm: 54, comprimentoCm: 36 },
    { tam: "G", pescocoCm: 40, toraxCm: 62, comprimentoCm: 46 },
    { tam: "GG", pescocoCm: 46, toraxCm: 74, comprimentoCm: 50 },
  ],
};

export const medida = (toraxCm: number, especie: Especie = "cao"): PerfilPet => ({
  fonte: "medida",
  especie,
  toraxCm,
});

export const estimativa = (
  p: { pesoKg?: number; kRaca?: number; condicao?: CondicaoCorporal; especie?: Especie } = {},
): PerfilPet => ({
  fonte: "estimativa",
  especie: p.especie ?? "cao",
  pesoKg: p.pesoKg ?? 8,
  kRaca: p.kRaca ?? 1,
  condicao: p.condicao ?? "normal",
});

const raca = (r: Partial<Raca> & Pick<Raca, "id" | "nome">): Raca => ({
  sinonimos: [],
  especie: "cao",
  pesoTipicoKg: null,
  kRaca: 1,
  destaque: false,
  semRaca: false,
  ...r,
});

/** Catálogo pequeno e estável para testes (não depende do racas.json publicado). */
export const racas = {
  shihTzu: raca({ id: "shih-tzu", nome: "Shih Tzu", sinonimos: ["shitzu"], pesoTipicoKg: 6.25, destaque: true }),
  dachshund: raca({ id: "dachshund", nome: "Dachshund (Salsicha)", sinonimos: ["salsicha", "teckel"], destaque: true }),
  spitz: raca({ id: "spitz", nome: "Spitz Alemão (Lulu)", sinonimos: ["lulu da pomerânia"], pesoTipicoKg: 2.3 }),
  bulldogFrances: raca({ id: "bulldog-frances", nome: "Bulldog Francês", pesoTipicoKg: 11 }),
  viraLata: raca({ id: "vira-lata", nome: "Vira-lata", sinonimos: ["SRD", "sem raça"], semRaca: true }),
  persa: raca({ id: "persa", nome: "Persa", especie: "gato", destaque: true }),
  viraLataGato: raca({ id: "vira-lata-gato", nome: "Vira-lata", especie: "gato", sinonimos: ["SRD"], semRaca: true }),
} as const;

export const listaRacas: readonly Raca[] = Object.values(racas);
