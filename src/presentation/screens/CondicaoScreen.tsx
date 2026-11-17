import { CONDICOES, type CondicaoCorporal, type Especie } from "../../domain/pet";
import { ChoiceCard } from "../components/ChoiceCard";
import { Silhueta } from "../components/icons";
import { StepLayout } from "../components/StepLayout";
import { copy } from "../copy";
import type { Etapa } from "./tipos";

interface Props {
  readonly etapa: Etapa | undefined;
  readonly especie: Especie;
  readonly atual: CondicaoCorporal | null;
  readonly onEscolher: (c: CondicaoCorporal) => void;
  readonly onVoltar: () => void;
}

/** Último passo: o toque já mostra o resultado. */
export function CondicaoScreen({ etapa, especie, atual, onEscolher, onVoltar }: Props) {
  return (
    <StepLayout titulo={copy.condicao.titulo} etapa={etapa} onVoltar={onVoltar}>
      <div className="choices choices--3">
        {CONDICOES.map((c) => (
          <ChoiceCard
            key={c}
            rotulo={copy.condicao.opcoes[c]}
            icone={<Silhueta especie={especie} condicao={c} />}
            selecionado={atual === c}
            onClick={() => {
              onEscolher(c);
            }}
          />
        ))}
      </div>
    </StepLayout>
  );
}
