import type { Logger } from "../application/ports";

/** Implementação simples da porta Logger. Trocar por Sentry etc. não muda o resto do app. */
export const consoleLogger: Logger = {
  warn: (mensagem, contexto) => {
    console.warn(`[provador] ${mensagem}`, contexto ?? {});
  },
  error: (mensagem, contexto) => {
    console.error(`[provador] ${mensagem}`, contexto ?? {});
  },
};
