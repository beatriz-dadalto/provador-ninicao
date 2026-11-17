import type { Especie } from "../../domain/pet";
import { ChoiceCard } from "../components/ChoiceCard";
import { Silhueta } from "../components/icons";
import { StepLayout } from "../components/StepLayout";
import { copy } from "../copy";
import type { Etapa } from "./tipos";

interface Props {
  readonly etapa: Etapa | undefined;
  readonly atual: Especie | null;
  readonly onEscolher: (e: Especie) => void;
}

/** Toque no cartão já avança: nenhum botão "Continuar" a mais (Krug — menos cliques difíceis). */
export function EspecieScreen({ etapa, atual, onEscolher }: Props) {
  return (
    <StepLayout titulo={copy.especie.titulo} etapa={etapa}>
      <div className="choices choices--2">
        {(["cao", "gato"] as const).map((e) => (
          <ChoiceCard
            key={e}
            rotulo={copy.especie.opcoes[e]}
            icone={<Silhueta especie={e} px={80} />}
            selecionado={atual === e}
            onClick={() => {
              onEscolher(e);
            }}
          />
        ))}
      </div>
    </StepLayout>
  );
}
