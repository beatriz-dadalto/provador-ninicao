/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" esconde a faixa "Versão de teste". Qualquer outro valor (ou ausente) mostra. */
  readonly VITE_VERSAO_TESTE?: string;
}
