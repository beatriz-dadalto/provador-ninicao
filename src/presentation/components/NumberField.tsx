import { useId } from "react";

interface Props {
  readonly rotulo: string;
  readonly unidade: string;
  readonly valor: string;
  readonly erro: string | null;
  readonly onChange: (texto: string) => void;
}

/**
 * Teclado numérico no celular, unidade fixa ao lado (Nielsen 5 — prevenir erro)
 * e mensagem de erro ligada ao campo para leitores de tela.
 */
export function NumberField({ rotulo, unidade, valor, erro, onChange }: Props) {
  const id = useId();
  const erroId = `${id}-erro`;

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {rotulo}
      </label>
      <div className={erro ? "field__box has-error" : "field__box"}>
        <input
          id={id}
          className="field__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={8}
          value={valor}
          onChange={(e) => {
            onChange(e.currentTarget.value);
          }}
          aria-invalid={erro !== null}
          aria-describedby={erro ? erroId : undefined}
        />
        <span className="field__unit" aria-hidden="true">
          {unidade}
        </span>
      </div>
      {erro && (
        <p id={erroId} className="field__error" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
