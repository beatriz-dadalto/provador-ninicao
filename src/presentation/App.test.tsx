import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App, mostrarVersaoTeste } from "./App";
import { renderComDeps } from "./test-utils";

const titulo = (nome: string | RegExp) => screen.getByRole("heading", { level: 1, name: nome });
const progresso = () => screen.getByRole("progressbar").getAttribute("aria-label");

describe("App — fluxo do provador", () => {
  it("caminho principal: Cachorro → Shih Tzu → 6 a 10 kg → Normal → capa M, 'Pela raça e peso'", async () => {
    const { user } = renderComDeps(<App />);
    expect(progresso()).toBe("Passo 1 de 4");

    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    expect(titulo("Qual a raça?")).toHaveFocus();
    expect(progresso()).toBe("Passo 2 de 4");

    await user.click(screen.getByRole("button", { name: "Shih Tzu" }));
    expect(titulo("Quanto pesa, mais ou menos?")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "6 a 10 kg" }));
    expect(titulo("Ele é…")).toHaveFocus();
    expect(progresso()).toBe("Passo 4 de 4");

    await user.click(screen.getByRole("button", { name: "Normal" })); // 1 toque → resultado
    // 8 kg → 45,2 cm + 3 = 48,2 → M (54)
    expect(titulo("Tamanho ideal")).toHaveFocus();
    expect(screen.getByLabelText("Tamanho M")).toBeInTheDocument();
    expect(screen.getByText("Pela raça e peso")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Comprar M na Shopee" })).toHaveAttribute(
      "href",
      "https://shopee.com.br/product/479899025/23193407408",
    );
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Cachorro",
      "Shih Tzu",
      "6 a 10 kg",
      "Normal",
      "Recomeçar",
    ]);
  });

  it("'Não sei' com peso típico da raça vai direto para 'Ele é…'", async () => {
    const { user } = renderComDeps(<App />);
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    await user.click(screen.getByRole("button", { name: "Shih Tzu" }));
    await user.click(screen.getByRole("button", { name: "Não sei" }));
    expect(titulo("Ele é…")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cheinho" }));
    // 6,25 kg → 41,6 + 3 (cheinho) + 3 (folga) = 47,6 → M
    expect(screen.getByLabelText("Tamanho M")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Peso: não sei" })).toBeInTheDocument();
  });

  it("gato vira-lata sem peso: tela de porte sem mudar o total da barra → resultado", async () => {
    const { user } = renderComDeps(<App />);
    await user.click(screen.getByRole("button", { name: "Gato" }));
    await user.click(screen.getByRole("button", { name: "Vira-lata" }));
    await user.click(screen.getByRole("button", { name: "Não sei" }));
    expect(titulo("Qual o porte?")).toHaveFocus();
    expect(progresso()).toBe("Passo 3 de 4"); // total fixo: porte ocupa a posição do peso
    await user.click(screen.getByRole("button", { name: "Médio" }));
    await user.click(screen.getByRole("button", { name: "Normal" }));
    // 4,5 kg → 37,3 + 3 = 40,3 → P
    expect(screen.getByLabelText("Tamanho P")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Porte médio" })).toBeInTheDocument();
  });

  it("busca por sinônimo com acento e erro de digitação", async () => {
    const { user } = renderComDeps(<App />);
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar raça" }), "Salcicha");
    await user.click(screen.getByRole("button", { name: "Dachshund (Salsicha)" }));
    expect(titulo("Quanto pesa, mais ou menos?")).toBeInTheDocument();
  });

  it("atalho 'Já sei a medida do peito' → resultado direto com confiança alta", async () => {
    const { user } = renderComDeps(<App />);
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    await user.click(screen.getByRole("button", { name: "Já sei a medida do peito" }));
    expect(titulo("Medida do peito")).toHaveFocus();
    expect(progresso()).toBe("Passo 3 de 4"); // total fixo também no atalho da medida

    await user.type(screen.getByLabelText("Volta do peito"), "46");
    await user.keyboard("{Enter}"); // Enter no teclado do celular também confirma

    expect(screen.getByLabelText("Tamanho M")).toBeInTheDocument();
    expect(screen.getByText("Pela medida do peito")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Peito 46 cm" })).toBeInTheDocument();
  });

  it("medida inválida: explica como corrigir, sem avançar", async () => {
    const { user } = renderComDeps(<App />);
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    await user.click(screen.getByRole("button", { name: "Já sei a medida do peito" }));
    await user.type(screen.getByLabelText("Volta do peito"), "500");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Máximo 120 cm.");
    expect(titulo("Medida do peito")).toBeInTheDocument();
  });

  it("voltar preserva as respostas (e a busca digitada)", async () => {
    const { user } = renderComDeps(<App />);
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    await user.type(screen.getByRole("searchbox"), "shih");
    await user.click(screen.getByRole("button", { name: "Shih Tzu" }));
    await user.click(screen.getByRole("button", { name: "3 a 6 kg" }));
    await user.click(screen.getByRole("button", { name: /Voltar/ }));
    expect(screen.getByRole("button", { name: "3 a 6 kg" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Voltar/ }));
    expect(screen.getByRole("searchbox")).toHaveValue("shih");
    expect(screen.getByRole("button", { name: "Shih Tzu" })).toHaveAttribute("aria-pressed", "true");
  });

  it("chip do resultado edita a resposta; o resto continua lá", async () => {
    const { user } = renderComDeps(<App />);
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    await user.click(screen.getByRole("button", { name: "Shih Tzu" }));
    await user.click(screen.getByRole("button", { name: "6 a 10 kg" }));
    await user.click(screen.getByRole("button", { name: "Normal" }));

    await user.click(screen.getByRole("button", { name: "6 a 10 kg" }));
    expect(titulo("Quanto pesa, mais ou menos?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "15 a 25 kg" }));
    expect(screen.getByRole("button", { name: "Normal" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Normal" }));
    // 20 kg → 61,3 + 3 = 64,3 → GG
    expect(screen.getByLabelText("Tamanho GG")).toBeInTheDocument();
  });

  it("Recomeçar volta ao início sem respostas", async () => {
    const { user } = renderComDeps(<App />);
    await user.click(screen.getByRole("button", { name: "Gato" }));
    await user.click(screen.getByRole("button", { name: "Já sei a medida do peito" }));
    await user.type(screen.getByLabelText("Volta do peito"), "30{Enter}");
    await user.click(screen.getByRole("button", { name: "Recomeçar" }));
    expect(titulo("Qual é o seu pet?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gato" })).toHaveAttribute("aria-pressed", "false");
  });

  it("não existe campo de nome do pet em nenhum passo do fluxo", async () => {
    const { user } = renderComDeps(<App />);
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
  });

  it("erro inesperado numa tela vira 'Algo deu errado' com Recomeçar (nunca tela branca)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { user, deps } = renderComDeps(<App />);
    vi.spyOn(deps.catalogoRacas, "destaques").mockImplementation(() => {
      throw new Error("boom");
    });
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    expect(titulo("Algo deu errado")).toBeInTheDocument();
    expect(deps.logger.error).toHaveBeenCalledWith(
      "Erro de renderização",
      expect.objectContaining({ erro: "Error: boom" }),
    );
    await user.click(screen.getByRole("button", { name: "Recomeçar" }));
    expect(titulo("Qual é o seu pet?")).toBeInTheDocument();
  });
});

describe("faixa Versão de teste", () => {
  it("aparece por padrão, fora do fluxo de perguntas", () => {
    renderComDeps(<App />);
    expect(screen.getByRole("note")).toHaveTextContent("Versão de teste");
  });

  it("só some quando a variável de build é exatamente 'false'", () => {
    expect(mostrarVersaoTeste(undefined)).toBe(true);
    expect(mostrarVersaoTeste("true")).toBe(true);
    expect(mostrarVersaoTeste("")).toBe(true);
    expect(mostrarVersaoTeste("false")).toBe(false);
  });
});
