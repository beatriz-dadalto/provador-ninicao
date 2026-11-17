import { describe, expect, it, vi } from "vitest";
import { instalarAutoRecuperacao } from "./auto-recuperacao";

function fakeWindow(storage: Partial<Storage> | "quebrado") {
  const target = new EventTarget();
  const reload = vi.fn();
  const sessionStorage =
    storage === "quebrado"
      ? new Proxy(
          {},
          {
            get: () => () => {
              throw new Error("SecurityError");
            },
          },
        )
      : storage;
  const win = Object.assign(target, { location: { reload }, sessionStorage }) as unknown as Window;
  return { win, reload };
}

const memoria = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};
const logger = () => ({ warn: vi.fn(), error: vi.fn() });
const preloadError = () => new Event("vite:preloadError", { cancelable: true });

describe("instalarAutoRecuperacao", () => {
  it("recarrega uma única vez por sessão quando um módulo some após deploy", () => {
    const { win, reload } = fakeWindow(memoria());
    const log = logger();
    instalarAutoRecuperacao(log, win);

    const e1 = preloadError();
    win.dispatchEvent(e1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(e1.defaultPrevented).toBe(true);

    win.dispatchEvent(preloadError());
    expect(reload).toHaveBeenCalledTimes(1); // sem loop
    expect(log.error).toHaveBeenCalledWith("Falha ao carregar módulo após recarregar", expect.any(Object));
  });

  it("sem sessionStorage disponível, não recarrega (evita loop) e não quebra", () => {
    const { win, reload } = fakeWindow("quebrado");
    const log = logger();
    instalarAutoRecuperacao(log, win);
    expect(() => win.dispatchEvent(preloadError())).not.toThrow();
    expect(reload).not.toHaveBeenCalled();
  });

  it("registra erros globais e promises rejeitadas", () => {
    const { win } = fakeWindow(memoria());
    const log = logger();
    instalarAutoRecuperacao(log, win);
    win.dispatchEvent(Object.assign(new Event("error"), { message: "x" }));
    win.dispatchEvent(Object.assign(new Event("unhandledrejection"), { reason: "y" }));
    expect(log.error).toHaveBeenCalledWith("Erro global", { mensagem: "x" });
    expect(log.error).toHaveBeenCalledWith("Promise rejeitada", { motivo: "y" });
  });
});
