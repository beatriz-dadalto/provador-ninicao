import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { racas } from "../../domain/test-fixtures";
import { renderComDeps } from "../test-utils";
import { CondicaoScreen } from "./CondicaoScreen";
import { EspecieScreen } from "./EspecieScreen";
import { MedidaScreen } from "./MedidaScreen";
import { PesoScreen } from "./PesoScreen";
import { PorteScreen } from "./PorteScreen";
import { RacaScreen } from "./RacaScreen";

const etapa = { atual: 2, total: 4 };
const titulo = () => screen.getByRole("heading", { level: 1 });

describe("EspecieScreen", () => {
  it("um toque escolhe; a resposta atual aparece marcada", async () => {
    const onEscolher = vi.fn();
    const { user } = renderComDeps(<EspecieScreen etapa={etapa} atual="gato" onEscolher={onEscolher} />);
    expect(screen.getByRole("button", { name: "Gato" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Cachorro" })).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    expect(onEscolher).toHaveBeenCalledWith("cao");
  });
});

describe("RacaScreen", () => {
  const render = (busca = "", atual = null as (typeof racas)[keyof typeof racas] | null) => {
    const cb = { onBuscar: vi.fn(), onEscolher: vi.fn(), onJaSeiMedida: vi.fn(), onVoltar: vi.fn() };
    const r = renderComDeps(<RacaScreen etapa={etapa} especie="cao" busca={busca} atual={atual} {...cb} />);
    return { ...r, ...cb };
  };
  const opcoes = () =>
    screen.getAllByRole("button", { pressed: false }).concat(screen.queryAllByRole("button", { pressed: true }));

  it("sem busca: botões das raças mais comuns + Vira-lata, só da espécie", () => {
    render();
    expect(titulo()).toHaveTextContent("Qual a raça?");
    for (const nome of ["Shih Tzu", "Dachshund (Salsicha)", "Vira-lata"]) {
      expect(screen.getByRole("button", { name: nome })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Persa" })).not.toBeInTheDocument();
    expect(opcoes()).toHaveLength(3);
  });

  it("digitar chama onBuscar; resultados substituem os destaques", async () => {
    const { user, onBuscar } = render("salsicha");
    expect(screen.getByRole("group", { name: "Raças encontradas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dachshund (Salsicha)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Shih Tzu" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Buscar raça" }), "x");
    expect(onBuscar).toHaveBeenCalledWith("salsichax");
  });

  it("raça desconhecida: estado vazio útil, aponta para o Vira-lata", () => {
    render("ornitorrinco");
    expect(screen.getByRole("status")).toHaveTextContent("Não achou? Toque em Vira-lata.");
    expect(screen.getByRole("button", { name: "Vira-lata" })).toBeInTheDocument();
  });

  it("buscar 'srd' não duplica o Vira-lata (que já tem botão próprio) nem mostra estado vazio", () => {
    render("srd");
    expect(screen.getAllByRole("button", { name: "Vira-lata" })).toHaveLength(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("botão limpar (×) zera a busca; só aparece com texto", async () => {
    const { user, onBuscar } = render("sal");
    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(onBuscar).toHaveBeenCalledWith("");
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });

  it("campo sem autocorreção nem maiúscula automática", () => {
    render();
    expect(screen.queryByRole("button", { name: "Limpar busca" })).not.toBeInTheDocument();
    const campo = screen.getByRole("searchbox");
    expect(campo).toHaveAttribute("autocorrect", "off");
    expect(campo).toHaveAttribute("autocapitalize", "off");
    expect(campo).toHaveAttribute("spellcheck", "false");
  });

  it("Enter escolhe o primeiro resultado; sem resultado, não faz nada", async () => {
    const a = render("shit");
    await a.user.type(screen.getByRole("searchbox"), "{Enter}");
    expect(a.onEscolher).toHaveBeenCalledWith(racas.shihTzu);
    a.unmount();
    const b = render("zzzz");
    await b.user.type(screen.getByRole("searchbox"), "{Enter}");
    expect(b.onEscolher).not.toHaveBeenCalled();
  });

  it("tocar numa raça escolhe; a atual aparece marcada; atalho de medida e voltar", async () => {
    const { user, onEscolher, onJaSeiMedida, onVoltar } = render("", racas.viraLata);
    expect(screen.getByRole("button", { name: "Vira-lata" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Shih Tzu" }));
    expect(onEscolher).toHaveBeenCalledWith(racas.shihTzu);
    await user.click(screen.getByRole("button", { name: "Já sei a medida do peito" }));
    expect(onJaSeiMedida).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: /Voltar/ }));
    expect(onVoltar).toHaveBeenCalledOnce();
  });
});

describe("PesoScreen", () => {
  it("cães: 6 faixas + Não sei; toque responde", async () => {
    const onResponder = vi.fn();
    const { user } = renderComDeps(
      <PesoScreen etapa={etapa} especie="cao" atual={null} onResponder={onResponder} onVoltar={vi.fn()} />,
    );
    const nomes = screen.getAllByRole("button", { pressed: false }).map((b) => b.textContent);
    expect(nomes).toEqual([
      "Até 3 kg",
      "3 a 6 kg",
      "6 a 10 kg",
      "10 a 15 kg",
      "15 a 25 kg",
      "Mais de 25 kg",
      "Não sei",
    ]);
    await user.click(screen.getByRole("button", { name: "Mais de 25 kg" }));
    await user.click(screen.getByRole("button", { name: "Não sei" }));
    expect(onResponder.mock.calls).toEqual([[{ tipo: "faixa", faixaId: "mais-25" }], [{ tipo: "nao-sei" }]]);
  });

  it("gatos: 4 faixas; resposta atual marcada (faixa ou Não sei)", () => {
    const { unmount } = renderComDeps(
      <PesoScreen
        etapa={etapa}
        especie="gato"
        atual={{ tipo: "faixa", faixaId: "3-5" }}
        onResponder={vi.fn()}
        onVoltar={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(4); // 3 faixas + Não sei
    expect(screen.getByRole("button", { name: "3 a 5 kg" })).toHaveAttribute("aria-pressed", "true");
    unmount();
    renderComDeps(
      <PesoScreen etapa={etapa} especie="gato" atual={{ tipo: "nao-sei" }} onResponder={vi.fn()} onVoltar={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Não sei" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("PorteScreen", () => {
  it.each(["cao", "gato"] as const)("%s: pequeno, médio, grande", async (especie) => {
    const onEscolher = vi.fn();
    const { user } = renderComDeps(
      <PorteScreen etapa={etapa} especie={especie} atual="medio" onEscolher={onEscolher} onVoltar={vi.fn()} />,
    );
    expect(titulo()).toHaveTextContent("Qual o porte?");
    expect(screen.getByRole("button", { name: "Médio" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Grande" }));
    expect(onEscolher).toHaveBeenCalledWith("grande");
  });
});

describe("CondicaoScreen", () => {
  it("magrinho, normal, cheinho; toque escolhe", async () => {
    const onEscolher = vi.fn();
    const { user } = renderComDeps(
      <CondicaoScreen etapa={etapa} especie="gato" atual={null} onEscolher={onEscolher} onVoltar={vi.fn()} />,
    );
    expect(titulo()).toHaveTextContent("Ele é…");
    expect(screen.getAllByRole("button", { pressed: false }).map((b) => b.textContent)).toEqual([
      "Magrinho",
      "Normal",
      "Cheinho",
    ]);
    await user.click(screen.getByRole("button", { name: "Cheinho" }));
    expect(onEscolher).toHaveBeenCalledWith("cheinho");
  });
});

describe("MedidaScreen", () => {
  it("campo de tórax, erro acessível e nenhuma instrução de medir", async () => {
    const onConfirmar = vi.fn();
    const { user } = renderComDeps(
      <MedidaScreen
        etapa={etapa}
        valor="500"
        erro="Máximo 120 cm."
        onChange={vi.fn()}
        onConfirmar={onConfirmar}
        onVoltar={vi.fn()}
      />,
    );
    expect(titulo()).toHaveTextContent("Medida do peito");
    const campo = screen.getByLabelText("Volta do peito");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAttribute("inputmode", "decimal");
    expect(screen.getByRole("alert")).toHaveTextContent("Máximo 120 cm.");
    expect(document.body).not.toHaveTextContent(/fita|passe|barbante/i);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onConfirmar).toHaveBeenCalledOnce();
  });
});
