import { useMemo, useReducer, useState } from "react";
import { useDependencias } from "../app/dependencias-context";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { copy, erroTorax } from "./copy";
import { CondicaoScreen } from "./screens/CondicaoScreen";
import { EspecieScreen } from "./screens/EspecieScreen";
import { MedidaScreen } from "./screens/MedidaScreen";
import { PesoScreen } from "./screens/PesoScreen";
import { PorteScreen } from "./screens/PorteScreen";
import { RacaScreen } from "./screens/RacaScreen";
import { ResultadoScreen } from "./screens/ResultadoScreen";
import { estadoInicial, etapa, provadorReducer, selecionarPerfil } from "./state/provador-reducer";
import { resumoRespostas } from "./state/resumo";

/**
 * O boundary envolve o Provador (e não o contrário): erro em qualquer tela é capturado.
 * "Recomeçar" troca a key e remonta o Provador com estado limpo.
 */
/** Faixa de pré-lançamento. Desligar no build com VITE_VERSAO_TESTE=false. */
export const mostrarVersaoTeste = (valor: string | undefined): boolean => valor !== "false";

export function App() {
  const { logger } = useDependencias();
  const [sessao, setSessao] = useState(0);
  return (
    <>
      {mostrarVersaoTeste(import.meta.env.VITE_VERSAO_TESTE) && (
        <p className="versao-teste" role="note">
          {copy.versaoTeste}
        </p>
      )}
      <ErrorBoundary
        logger={logger}
        onRecomecar={() => {
          setSessao((n) => n + 1);
        }}
      >
        <Provador key={sessao} />
      </ErrorBoundary>
    </>
  );
}

/** Erro de invariante: o reducer garante que o passo só é alcançável com os dados; o boundary recupera. */
const invariante = (passo: string): never => {
  throw new Error(`Passo "${passo}" sem dados obrigatórios`);
};

function Provador() {
  const [s, dispatch] = useReducer(provadorReducer, estadoInicial);
  const perfil = useMemo(() => selecionarPerfil(s), [s]);
  const progresso = etapa(s);
  const voltar = () => {
    dispatch({ type: "voltar" });
  };

  if (s.passo === "especie") {
    return (
      <EspecieScreen
        etapa={progresso}
        atual={s.especie}
        onEscolher={(especie) => {
          dispatch({ type: "escolherEspecie", especie });
        }}
      />
    );
  }

  const especie = s.especie ?? invariante(s.passo);

  switch (s.passo) {
    case "raca":
      return (
        <RacaScreen
          etapa={progresso}
          especie={especie}
          busca={s.busca}
          atual={s.raca}
          onBuscar={(texto) => {
            dispatch({ type: "digitarBusca", texto });
          }}
          onEscolher={(raca) => {
            dispatch({ type: "escolherRaca", raca });
          }}
          onJaSeiMedida={() => {
            dispatch({ type: "abrirMedida" });
          }}
          onVoltar={voltar}
        />
      );
    case "peso":
      return (
        <PesoScreen
          etapa={progresso}
          especie={especie}
          atual={s.peso}
          onResponder={(resposta) => {
            dispatch({ type: "responderPeso", resposta });
          }}
          onVoltar={voltar}
        />
      );
    case "porte":
      return (
        <PorteScreen
          etapa={progresso}
          especie={especie}
          atual={s.porte}
          onEscolher={(porte) => {
            dispatch({ type: "escolherPorte", porte });
          }}
          onVoltar={voltar}
        />
      );
    case "condicao":
      return (
        <CondicaoScreen
          etapa={progresso}
          especie={especie}
          atual={s.condicao}
          onEscolher={(condicao) => {
            dispatch({ type: "escolherCondicao", condicao });
          }}
          onVoltar={voltar}
        />
      );
    case "medida":
      return (
        <MedidaScreen
          etapa={progresso}
          valor={s.toraxTexto}
          erro={s.toraxErro && erroTorax(s.toraxErro)}
          onChange={(texto) => {
            dispatch({ type: "digitarTorax", texto });
          }}
          onConfirmar={() => {
            dispatch({ type: "confirmarTorax" });
          }}
          onVoltar={voltar}
        />
      );
    case "resultado":
      return (
        <ResultadoScreen
          perfil={perfil ?? invariante(s.passo)}
          respostas={resumoRespostas(s)}
          onEditar={(passo) => {
            dispatch({ type: "irPara", passo });
          }}
          onRecomecar={() => {
            dispatch({ type: "reiniciar" });
          }}
        />
      );
  }
}
