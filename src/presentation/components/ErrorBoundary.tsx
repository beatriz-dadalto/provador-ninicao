import { Component, type ErrorInfo, type ReactNode } from "react";
import type { Logger } from "../../application/ports";
import { copy } from "../copy";

interface Props {
  readonly logger: Logger;
  readonly onRecomecar: () => void;
  readonly children: ReactNode;
}

interface State {
  readonly falhou: boolean;
}

/**
 * Rede de segurança: qualquer erro de renderização vira uma tela de recuperação
 * com um único botão, nunca uma tela branca.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { falhou: false };

  static getDerivedStateFromError(): State {
    return { falhou: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.logger.error("Erro de renderização", { erro: String(error), pilha: info.componentStack ?? "" });
  }

  private recomecar = () => {
    this.setState({ falhou: false });
    this.props.onRecomecar();
  };

  override render() {
    if (!this.state.falhou) return this.props.children;
    return (
      <div className="step">
        <main className="step__body">
          <h1 className="step__title">{copy.falha.titulo}</h1>
        </main>
        <footer className="step__action">
          <button type="button" className="btn-primary" onClick={this.recomecar}>
            {copy.falha.acao}
          </button>
        </footer>
      </div>
    );
  }
}
