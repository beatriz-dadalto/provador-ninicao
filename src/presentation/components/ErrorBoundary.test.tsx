import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomba({ explodir }: { explodir: boolean }) {
  if (explodir) throw new Error("boom");
  return <p>tudo certo</p>;
}

function Harness() {
  const [explodir, setExplodir] = useState(true);
  return (
    <ErrorBoundary
      logger={logger}
      onRecomecar={() => {
        setExplodir(false);
      }}
    >
      <Bomba explodir={explodir} />
    </ErrorBoundary>
  );
}
const logger = { warn: vi.fn(), error: vi.fn() };

describe("ErrorBoundary", () => {
  it("troca tela branca por recuperação e registra o erro; Recomeçar restaura o app", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // React loga o erro capturado
    render(<Harness />);

    expect(screen.getByRole("heading", { name: "Algo deu errado" })).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith("Erro de renderização", expect.objectContaining({ erro: "Error: boom" }));

    await userEvent.setup().click(screen.getByRole("button", { name: "Recomeçar" }));
    expect(screen.getByText("tudo certo")).toBeInTheDocument();
  });
});
