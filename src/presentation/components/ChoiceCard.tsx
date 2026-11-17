import type { ReactNode } from "react";
import { IconeCheck } from "./icons";

interface Props {
  readonly rotulo: string;
  readonly icone: ReactNode;
  readonly onClick: () => void;
  /** Resposta já dada (ao voltar ou editar): exposta como aria-pressed e marcada com check. */
  readonly selecionado?: boolean;
}

/** Cartão grande com ilustração: o toque já responde e avança. */
export function ChoiceCard({ rotulo, icone, onClick, selecionado = false }: Props) {
  return (
    <button
      type="button"
      className={selecionado ? "choice is-selected" : "choice"}
      onClick={onClick}
      aria-pressed={selecionado}
    >
      {selecionado && (
        <span className="check" aria-hidden="true">
          <IconeCheck />
        </span>
      )}
      <span className="choice__icon" aria-hidden="true">
        {icone}
      </span>
      <span className="choice__label">{rotulo}</span>
    </button>
  );
}
