import { type ReactNode, useEffect, useRef } from "react";
import { copy } from "../copy";
import type { Etapa } from "../screens/tipos";
import { IconeVoltar } from "./icons";

interface Props {
  readonly titulo: string;
  /** Posição na barra de progresso; ausente na tela de resultado. */
  readonly etapa?: Etapa | undefined;
  readonly onVoltar?: () => void;
  /** Ação principal. No celular fica fixa na zona do polegar; em telas largas segue o conteúdo. */
  readonly acao?: ReactNode | undefined;
  readonly children: ReactNode;
}

/**
 * Esqueleto comum a todas as telas (Nielsen 4 — consistência):
 * voltar + marca + progresso no topo, uma pergunta, no máximo uma ação principal.
 */
export function StepLayout({ titulo, etapa, onVoltar, acao, children }: Props) {
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // Leitor de tela anuncia a nova pergunta a cada troca de passo.
  useEffect(() => {
    tituloRef.current?.focus();
  }, [titulo]);

  return (
    <div className="step">
      <header className="step__top">
        <div className="topbar">
          {onVoltar ? (
            <button type="button" className="icon-btn" onClick={onVoltar} aria-label={copy.voltar}>
              <IconeVoltar />
            </button>
          ) : (
            <span className="icon-btn icon-btn--vazio" />
          )}
          <span className="brand">{copy.marca}</span>
          <span className="topbar__count" aria-hidden="true">
            {etapa ? copy.progressoCurto(etapa.atual, etapa.total) : ""}
          </span>
        </div>
        {etapa && (
          <div
            className="progress"
            role="progressbar"
            aria-label={copy.progresso(etapa.atual, etapa.total)}
            aria-valuemin={1}
            aria-valuemax={etapa.total}
            aria-valuenow={etapa.atual}
          >
            {Array.from({ length: etapa.total }, (_, i) => (
              <span key={i} className={i < etapa.atual ? "progress__seg is-on" : "progress__seg"} />
            ))}
          </div>
        )}
      </header>

      <main className="step__body">
        <h1 ref={tituloRef} tabIndex={-1} className="step__title">
          {titulo}
        </h1>
        {children}
      </main>

      {acao && <footer className="step__action">{acao}</footer>}
    </div>
  );
}
