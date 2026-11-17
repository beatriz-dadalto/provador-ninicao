import type { Logger } from "../../application/ports";

const CHAVE = "provador:recarregou";

/**
 * Auto-recuperação de falhas fora do React:
 * - Depois de um deploy, um navegador com HTML antigo pode pedir um JS que não existe mais
 *   (Vite emite `vite:preloadError`). Recarregamos UMA vez por sessão para buscar a versão nova;
 *   a trava evita loop de reload se o problema persistir.
 * - Erros globais e promessas rejeitadas são registrados em vez de sumirem.
 */
export function instalarAutoRecuperacao(logger: Logger, win: Window = window) {
  win.addEventListener("vite:preloadError", (evento) => {
    if (lerFlag(win)) {
      logger.error("Falha ao carregar módulo após recarregar", {
        erro: String((evento as Event & { payload?: unknown }).payload),
      });
      return;
    }
    evento.preventDefault();
    gravarFlag(win);
    win.location.reload();
  });

  win.addEventListener("error", (e) => {
    logger.error("Erro global", { mensagem: e.message });
  });
  win.addEventListener("unhandledrejection", (e) => {
    logger.error("Promise rejeitada", { motivo: String(e.reason) });
  });
}

// sessionStorage pode lançar exceção (modo privado, bloqueio de armazenamento): nunca deixar isso quebrar o app.
function lerFlag(win: Window): boolean {
  try {
    return win.sessionStorage.getItem(CHAVE) === "1";
  } catch {
    return true; // sem armazenamento, não arriscamos loop de reload
  }
}

function gravarFlag(win: Window) {
  try {
    win.sessionStorage.setItem(CHAVE, "1");
  } catch {
    /* ignorado: lerFlag já trata a ausência */
  }
}
