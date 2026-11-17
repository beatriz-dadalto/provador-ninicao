import type { Modelo } from "../domain/modelo";
import type { Raca } from "../domain/raca";

/** Porta de saída: o caso de uso depende desta abstração, não de JSON/HTTP (DIP). */
export interface ModeloRepository {
  listar(): readonly Modelo[];
}

export interface RacaRepository {
  listar(): readonly Raca[];
}

/** Porta para registrar problemas sem acoplar a um provedor (console, Sentry…). */
export interface Logger {
  warn(mensagem: string, contexto?: Record<string, unknown>): void;
  error(mensagem: string, contexto?: Record<string, unknown>): void;
}
