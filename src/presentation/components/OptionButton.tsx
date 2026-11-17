import { IconeCheck } from "./icons";

export type VarianteOpcao = "chip" | "linha" | "destaque" | "secundaria";

interface Props {
  readonly rotulo: string;
  readonly onClick: () => void;
  readonly selecionado?: boolean;
  /** chip: grade de raças · linha: lista vertical · destaque: Vira-lata · secundaria: "Não sei". */
  readonly variante?: VarianteOpcao;
}

/** Opção só de texto: alvo ≥ 56 px; o toque responde e avança. */
export function OptionButton({ rotulo, onClick, selecionado = false, variante = "linha" }: Props) {
  return (
    <button
      type="button"
      className={`option option--${variante}${selecionado ? " is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selecionado}
    >
      <span className="option__label">{rotulo}</span>
      {selecionado && (
        <span className="check check--inline" aria-hidden="true">
          <IconeCheck />
        </span>
      )}
    </button>
  );
}
