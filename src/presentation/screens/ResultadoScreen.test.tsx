import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Modelo } from "../../domain/modelo";
import { capaPlush, estimativa, medida } from "../../domain/test-fixtures";
import type { Passo } from "../state/provador-reducer";
import { criarDepsTeste, renderComDeps } from "../test-utils";
import { ResultadoScreen } from "./ResultadoScreen";

const props = { respostas: [], onEditar: vi.fn(), onRecomecar: vi.fn() };

describe("ResultadoScreen", () => {
  it("por medida: UM tamanho, origem 'Pela medida do peito' e compra só na Shopee", () => {
    renderComDeps(<ResultadoScreen perfil={medida(46)} {...props} />);
    expect(screen.getByLabelText("Tamanho M")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Tamanho /)).toHaveLength(1);
    expect(screen.getByText("Pela medida do peito")).toHaveClass("badge--alta");
    const comprar = screen.getByRole("link", { name: "Comprar M na Shopee" });
    expect(comprar).toHaveAttribute("href", capaPlush.shopeeUrl);
    expect(comprar).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("por estimativa: origem 'Pela raça e peso' (confiança média), sem alerta de 'entre tamanhos'", () => {
    // 8 kg magrinho → 42,2 + 3 = 45,2 → M (zona de transição resolvida pelo desempate "maior")
    renderComDeps(<ResultadoScreen perfil={estimativa({ pesoKg: 8, condicao: "magrinho" })} {...props} />);
    expect(screen.getByLabelText("Tamanho M")).toBeInTheDocument();
    expect(screen.getByText("Pela raça e peso")).toHaveClass("badge--media");
    expect(screen.queryByText(/entre/i)).not.toBeInTheDocument();
  });

  it("miniatura local opcional: aparece se houver; some se falhar ao carregar", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const comFoto: Modelo = { ...capaPlush, miniatura: "modelos/capa-plush.webp" };
    const { container } = renderComDeps(
      <ResultadoScreen perfil={medida(46)} {...props} />,
      criarDepsTeste([comFoto, comFoto]),
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("src", "modelos/capa-plush.webp");
    expect(imgs[0]).toHaveAttribute("alt", "");
    fireEvent.error(imgs[0]!);
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("sem miniatura no modelo: nenhuma imagem", () => {
    const { container } = renderComDeps(<ResultadoScreen perfil={medida(46)} {...props} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("pet acima da grade: orienta a falar com a loja e não oferece compra", () => {
    renderComDeps(<ResultadoScreen perfil={medida(100)} {...props} />);
    expect(screen.getByText("Maior que o GG. Fale com a loja no chat da Shopee.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Comprar/ })).not.toBeInTheDocument();
  });

  it("sem modelos para a espécie: mensagem vazia, sem quebrar", () => {
    const deps = criarDepsTeste([{ ...capaPlush, especies: ["cao"] }]);
    renderComDeps(<ResultadoScreen perfil={medida(30, "gato")} {...props} />, deps);
    expect(screen.getByText("Ainda não temos modelos para esse pet.")).toBeInTheDocument();
  });

  it("lista os outros modelos com o tamanho de cada um (cada um com sua regra de desempate)", () => {
    const malha: Modelo = { ...capaPlush, id: "malha", nome: "Malha elástica", desempate: "menor" };
    renderComDeps(<ResultadoScreen perfil={medida(52)} {...props} />, criarDepsTeste([capaPlush, malha]));
    expect(screen.getByLabelText("Tamanho G")).toBeInTheDocument(); // capa: maior
    const linha = screen.getByRole("link", { name: /Malha elástica/ });
    expect(linha).toHaveTextContent("M"); // malha: menor
    expect(linha).toHaveAttribute("target", "_blank");
  });

  it("outro modelo acima da grade aparece com traço", () => {
    const pequeno: Modelo = { ...capaPlush, id: "pequeno", nome: "Pequeno", tamanhos: [capaPlush.tamanhos[0]] };
    renderComDeps(<ResultadoScreen perfil={medida(46)} {...props} />, criarDepsTeste([capaPlush, pequeno]));
    expect(screen.getByRole("link", { name: /Pequeno/ })).toHaveTextContent("—");
  });

  it("cada chip leva ao passo certo; Recomeçar dispara reinício", async () => {
    const onEditar = vi.fn<(p: Passo) => void>();
    const onRecomecar = vi.fn();
    const respostas = [
      { passo: "especie", rotulo: "Cachorro" },
      { passo: "raca", rotulo: "Shih Tzu" },
      { passo: "condicao", rotulo: "Normal" },
    ] as const;
    const { user } = renderComDeps(
      <ResultadoScreen perfil={estimativa()} respostas={respostas} onEditar={onEditar} onRecomecar={onRecomecar} />,
    );
    await user.click(screen.getByRole("button", { name: "Cachorro" }));
    await user.click(screen.getByRole("button", { name: "Shih Tzu" }));
    await user.click(screen.getByRole("button", { name: "Normal" }));
    await user.click(screen.getByRole("button", { name: "Recomeçar" }));
    expect(onEditar.mock.calls.map((c) => c[0])).toEqual(["especie", "raca", "condicao"]);
    expect(onRecomecar).toHaveBeenCalledOnce();
  });
});
