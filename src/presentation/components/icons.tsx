import type { ReactNode } from "react";
import type { CondicaoCorporal, Especie } from "../../domain/pet";

/**
 * Sistema único de ilustração: grid 64×64, traço 3 px que não escala (non-scaling-stroke em cada
 * forma — a propriedade não é herdada), pontas arredondadas, só `currentColor`.
 * Provisório até as ilustrações da marca. Decorativos: sempre dentro de contêiner aria-hidden.
 */
const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const Svg = ({ px, children }: { px: number; children: ReactNode }) => (
  <svg width={px} height={px} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <g {...traco}>{children}</g>
  </svg>
);

const P = ({ d }: { d: string }) => <path d={d} vectorEffect="non-scaling-stroke" />;

/** Profundidade da barriga: a ÚNICA diferença entre as silhuetas. Dorso fixo em y = 27. */
const BARRIGA: Record<CondicaoCorporal, number> = { magrinho: 4, normal: 8, cheinho: 13 };
const DORSO = 27;
const CHAO = 56;

interface SilhuetaProps {
  readonly especie: Especie;
  readonly condicao?: CondicaoCorporal;
  /** Escala ancorada no chão (porte pequeno/médio/grande). */
  readonly escala?: number;
  readonly px?: number;
}

/** Pet de perfil: o mesmo animal em todas as telas; muda só a barriga (condição) ou a escala (porte). */
export function Silhueta({ especie, condicao = "normal", escala = 1, px = 72 }: SilhuetaProps) {
  const b = BARRIGA[condicao];
  const t = DORSO;
  const base = t + 4 + b * 1.6;
  const lado = b * 0.3; // a barriga arredonda para os lados quando cresce
  const corpo =
    `M15 ${t + 2}C24 ${t - 2} 36 ${t - 2} 44 ${t}C${48 + lado} ${t + 4} ${48 + lado} ${base} 40 ${base}` +
    `L22 ${base}C${12 - lado} ${base} ${12 - lado} ${t + 4} 15 ${t + 2}Z`;
  const pernas = `M21 ${base}V${CHAO}M27 ${base}V${CHAO}M37 ${base}V${CHAO}M43 ${base - 1}V${CHAO}`;
  const gato = especie === "gato";
  return (
    <Svg px={px}>
      <g transform={`translate(32 ${CHAO}) scale(${escala}) translate(-32 -${CHAO})`}>
        <P d={corpo} />
        <P d={pernas} />
        {gato ? (
          <>
            <P d={`M43 ${t}c-1-4 0-9 3-11l1-6 4 4h4l4-4 1 6c2 2 2 7 0 9-2 3-8 4-12 3`} />
            <P d={`M15 ${t + 3}C7 ${t + 4} 4 ${t - 6} 8 ${t - 13}`} />
            <circle cx="52" cy="17" r="1.2" fill="currentColor" stroke="none" />
          </>
        ) : (
          <>
            <P d={`M43 ${t}c0-5 1-10 5-12 4-2 8 0 9 3l4 2c1 1 1 3-1 4l-5 1c-2 2-6 3-9 2`} />
            <P d="M50 15c-3 1-4 5-3 9" />
            <P d={`M15 ${t + 1}L8 ${t - 7}`} />
            <circle cx="53" cy="18" r="1.2" fill="currentColor" stroke="none" />
          </>
        )}
      </g>
    </Svg>
  );
}

export const IconeVoltar = () => (
  <Svg px={24}>
    <P d="M40 14 22 32l18 18" />
  </Svg>
);

export const IconeLupa = () => (
  <Svg px={22}>
    <circle cx="28" cy="28" r="16" vectorEffect="non-scaling-stroke" />
    <P d="m40 40 12 12" />
  </Svg>
);

export const IconeFechar = () => (
  <Svg px={20}>
    <P d="M18 18l28 28M46 18 18 46" />
  </Svg>
);

export const IconeCheck = () => (
  <Svg px={16}>
    <P d="m14 34 12 12 24-26" />
  </Svg>
);

/** "Abre fora daqui" (Shopee em nova aba). */
export const IconeSaida = () => (
  <Svg px={20}>
    <P d="M36 12h16v16M52 12 30 34M46 38v12H14V18h12" />
  </Svg>
);
