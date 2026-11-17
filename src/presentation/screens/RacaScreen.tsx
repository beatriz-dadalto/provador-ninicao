import { type SubmitEvent, useId, useMemo, useRef } from "react";
import { useDependencias } from "../../app/dependencias-context";
import type { Especie } from "../../domain/pet";
import type { Raca } from "../../domain/raca";
import { IconeFechar, IconeLupa } from "../components/icons";
import { OptionButton } from "../components/OptionButton";
import { StepLayout } from "../components/StepLayout";
import { copy } from "../copy";
import type { Etapa } from "./tipos";

interface Props {
  readonly etapa: Etapa | undefined;
  readonly especie: Especie;
  readonly busca: string;
  readonly atual: Raca | null;
  readonly onBuscar: (texto: string) => void;
  readonly onEscolher: (r: Raca) => void;
  readonly onJaSeiMedida: () => void;
  readonly onVoltar: () => void;
}

/**
 * Busca + raças comuns em grade + "Vira-lata" sempre visível: ninguém fica sem opção para tocar,
 * mesmo quando a busca não acha nada.
 */
export function RacaScreen({ etapa, especie, busca, atual, onBuscar, onEscolher, onJaSeiMedida, onVoltar }: Props) {
  const { catalogoRacas } = useDependencias();
  const destaques = useMemo(() => catalogoRacas.destaques(especie), [catalogoRacas, especie]);
  const viraLata = useMemo(() => catalogoRacas.semRaca(especie), [catalogoRacas, especie]);
  const encontradas = useMemo(() => catalogoRacas.buscar(especie, busca), [catalogoRacas, especie, busca]);
  const buscando = busca.trim() !== "";
  // O Vira-lata já tem botão próprio: não repete na lista.
  const resultados = encontradas.filter((r) => !r.semRaca);
  const campoId = useId();
  const campo = useRef<HTMLInputElement>(null);

  // Enter/"Buscar" no teclado do celular escolhe o primeiro resultado.
  const enviar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const [primeira] = encontradas;
    if (primeira) onEscolher(primeira);
  };

  const opcao = (r: Raca, variante: "chip" | "linha" | "destaque") => (
    <OptionButton
      key={r.id}
      rotulo={r.nome}
      variante={variante}
      selecionado={atual?.id === r.id}
      onClick={() => {
        onEscolher(r);
      }}
    />
  );

  return (
    <StepLayout
      titulo={copy.raca.titulo}
      etapa={etapa}
      onVoltar={onVoltar}
      acao={
        <button type="button" className="link-btn link-btn--center" onClick={onJaSeiMedida}>
          {copy.raca.jaSeiMedida}
        </button>
      }
    >
      <form role="search" className="search" onSubmit={enviar}>
        <label htmlFor={campoId} className="sr-only">
          {copy.raca.rotuloBusca}
        </label>
        <span className="search__icon" aria-hidden="true">
          <IconeLupa />
        </span>
        <input
          ref={campo}
          id={campoId}
          className="search__input"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={40}
          placeholder={copy.raca.placeholder}
          value={busca}
          onChange={(e) => {
            onBuscar(e.currentTarget.value);
          }}
        />
        {busca !== "" && (
          <button
            type="button"
            className="search__clear"
            aria-label={copy.raca.limpar}
            onClick={() => {
              onBuscar("");
              campo.current?.focus();
            }}
          >
            <IconeFechar />
          </button>
        )}
      </form>

      {!buscando && (
        <div className="grid-racas" role="group" aria-label={copy.raca.populares}>
          {destaques.map((r) => opcao(r, "chip"))}
        </div>
      )}

      {buscando && resultados.length > 0 && (
        <div className="rows" role="group" aria-label={copy.raca.resultados}>
          {resultados.map((r) => opcao(r, "linha"))}
        </div>
      )}

      {buscando && encontradas.length === 0 && (
        <p className="hint" role="status">
          {copy.raca.nenhuma}
        </p>
      )}

      {viraLata && opcao(viraLata, "destaque")}
    </StepLayout>
  );
}
