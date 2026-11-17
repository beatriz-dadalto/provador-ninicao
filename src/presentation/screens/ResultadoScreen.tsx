import { useMemo, useState } from "react";
import type { ItemRecomendado } from "../../application/listar-recomendacoes";
import { useDependencias } from "../../app/dependencias-context";
import type { PerfilPet } from "../../domain/pet";
import { IconeCheck, IconeSaida } from "../components/icons";
import { StepLayout } from "../components/StepLayout";
import { copy } from "../copy";
import type { Passo } from "../state/provador-reducer";
import type { RespostaResumo } from "../state/resumo";

interface Props {
  readonly perfil: PerfilPet;
  readonly respostas: readonly RespostaResumo[];
  readonly onEditar: (p: Passo) => void;
  readonly onRecomecar: () => void;
}

/** UM tamanho, como herói: é a resposta que a pessoa veio buscar. Origem em uma linha. */
export function ResultadoScreen({ perfil, respostas, onEditar, onRecomecar }: Props) {
  const { listarRecomendacoes } = useDependencias();
  const itens = useMemo(() => listarRecomendacoes.executar(perfil), [listarRecomendacoes, perfil]);
  const [principal, ...outros] = itens;

  return (
    // Sem rodapé fixo: o CTA fica colado ao tamanho, visível sem rolar em qualquer tela.
    <StepLayout titulo={copy.resultado.titulo}>
      {principal ? <Principal item={principal} /> : <p className="empty">{copy.resultado.vazio}</p>}

      <nav className="chips" aria-label={copy.resultado.editar}>
        {respostas.map((r) => (
          <button
            key={r.passo}
            type="button"
            className="chip"
            onClick={() => {
              onEditar(r.passo);
            }}
          >
            {r.rotulo}
          </button>
        ))}
      </nav>

      {outros.length > 0 && (
        <section className="others" aria-labelledby="outros">
          <h2 id="outros" className="others__title">
            {copy.resultado.outros}
          </h2>
          <ul className="others__list">
            {outros.map((i) => (
              <li key={i.modelo.id}>
                <a className="others__row" href={i.modelo.shopeeUrl} target="_blank" rel="noopener noreferrer">
                  <Miniatura src={i.modelo.miniatura} pequena />
                  <span className="others__name">{i.modelo.nome}</span>
                  <strong className="others__size">{i.recomendacao.status === "ok" ? i.recomendacao.tam : "—"}</strong>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" className="link-btn link-btn--center" onClick={onRecomecar}>
        {copy.resultado.recomecar}
      </button>
    </StepLayout>
  );
}

/** Slot opcional de miniatura local. Ausente ou com erro de carga: simplesmente não aparece. */
function Miniatura({ src, pequena = false }: { readonly src: string | undefined; readonly pequena?: boolean }) {
  const [falhou, setFalhou] = useState(false);
  if (src === undefined || falhou) return null;
  const px = pequena ? 40 : 72;
  return (
    <img
      className={pequena ? "thumb thumb--sm" : "thumb"}
      src={src}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => {
        setFalhou(true);
      }}
    />
  );
}

function Principal({ item }: { item: ItemRecomendado }) {
  const r = item.recomendacao;
  return (
    <div className="result">
      <Miniatura src={item.modelo.miniatura} />
      <p className="result__model">{item.modelo.nome}</p>
      {r.status === "acima-da-grade" ? (
        <p className="result__note">{copy.resultado.acimaDaGrade(r.maiorTam)}</p>
      ) : (
        <>
          <p className="result__size" aria-label={copy.resultado.tamanho(r.tam)}>
            {r.tam}
          </p>
          <p className={`badge badge--${r.confianca}`}>
            {r.confianca === "alta" && (
              <span className="badge__icon" aria-hidden="true">
                <IconeCheck />
              </span>
            )}
            {copy.resultado.origem[r.confianca]}
          </p>
          <a className="btn-primary" href={item.modelo.shopeeUrl} target="_blank" rel="noopener noreferrer">
            {copy.resultado.comprar(r.tam)}
            <span className="btn-primary__icon" aria-hidden="true">
              <IconeSaida />
            </span>
          </a>
        </>
      )}
    </div>
  );
}
