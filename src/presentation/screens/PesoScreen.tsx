import { FAIXAS_PESO, type RespostaPeso } from "../../domain/faixas-peso";
import type { Especie } from "../../domain/pet";
import { OptionButton } from "../components/OptionButton";
import { StepLayout } from "../components/StepLayout";
import { copy } from "../copy";
import type { Etapa } from "./tipos";

interface Props {
  readonly etapa: Etapa | undefined;
  readonly especie: Especie;
  readonly atual: RespostaPeso | null;
  readonly onResponder: (r: RespostaPeso) => void;
  readonly onVoltar: () => void;
}

/** Faixas por toque, sem digitar. "Não sei" é resposta válida, não erro. */
export function PesoScreen({ etapa, especie, atual, onResponder, onVoltar }: Props) {
  return (
    <StepLayout titulo={copy.peso.titulo} etapa={etapa} onVoltar={onVoltar}>
      <div className="rows" role="group" aria-label={copy.peso.titulo}>
        {FAIXAS_PESO[especie].map((f) => (
          <OptionButton
            key={f.id}
            rotulo={copy.peso.faixa(f)}
            selecionado={atual?.tipo === "faixa" && atual.faixaId === f.id}
            onClick={() => {
              onResponder({ tipo: "faixa", faixaId: f.id });
            }}
          />
        ))}
        <OptionButton
          rotulo={copy.peso.naoSei}
          variante="secundaria"
          selecionado={atual?.tipo === "nao-sei"}
          onClick={() => {
            onResponder({ tipo: "nao-sei" });
          }}
        />
      </div>
    </StepLayout>
  );
}
