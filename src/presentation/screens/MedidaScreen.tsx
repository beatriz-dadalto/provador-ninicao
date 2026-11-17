import { type SubmitEvent, useId } from "react";
import { NumberField } from "../components/NumberField";
import { StepLayout } from "../components/StepLayout";
import { copy } from "../copy";
import type { Etapa } from "./tipos";

interface Props {
  readonly etapa: Etapa | undefined;
  readonly valor: string;
  readonly erro: string | null;
  readonly onChange: (texto: string) => void;
  readonly onConfirmar: () => void;
  readonly onVoltar: () => void;
}

/** Atalho para quem já tem a medida do peito. Só o campo: nenhuma instrução de como medir. */
export function MedidaScreen({ etapa, valor, erro, onChange, onConfirmar, onVoltar }: Props) {
  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConfirmar();
  };
  const formId = useId();

  return (
    <StepLayout
      titulo={copy.medida.titulo}
      etapa={etapa}
      onVoltar={onVoltar}
      acao={
        <button type="submit" form={formId} className="btn-primary">
          {copy.continuar}
        </button>
      }
    >
      <form id={formId} onSubmit={enviar} noValidate>
        <NumberField
          rotulo={copy.medida.rotulo}
          unidade={copy.medida.unidade}
          valor={valor}
          erro={erro}
          onChange={onChange}
        />
      </form>
    </StepLayout>
  );
}
