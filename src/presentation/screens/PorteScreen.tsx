import { type Especie, type Porte, PORTES } from "../../domain/pet";
import { ChoiceCard } from "../components/ChoiceCard";
import { Silhueta } from "../components/icons";
import { StepLayout } from "../components/StepLayout";
import { copy } from "../copy";
import type { Etapa } from "./tipos";

interface Props {
  readonly etapa: Etapa | undefined;
  readonly especie: Especie;
  readonly atual: Porte | null;
  readonly onEscolher: (p: Porte) => void;
  readonly onVoltar: () => void;
}

/** O mesmo pet cresce com o porte (ancorado no chão): dá para responder sem ler. */
const ESCALA: Record<Porte, number> = { pequeno: 0.55, medio: 0.78, grande: 1 };

export function PorteScreen({ etapa, especie, atual, onEscolher, onVoltar }: Props) {
  return (
    <StepLayout titulo={copy.porte.titulo} etapa={etapa} onVoltar={onVoltar}>
      <div className="choices choices--3">
        {PORTES.map((p) => (
          <ChoiceCard
            key={p}
            rotulo={copy.porte.opcoes[p]}
            icone={<Silhueta especie={especie} escala={ESCALA[p]} />}
            selecionado={atual === p}
            onClick={() => {
              onEscolher(p);
            }}
          />
        ))}
      </div>
    </StepLayout>
  );
}
