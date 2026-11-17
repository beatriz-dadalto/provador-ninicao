import { expect, type Page, test } from "@playwright/test";

/** Coleta erros de console e violações de CSP: qualquer um reprova o teste. */
function vigiarErros(page: Page) {
  const erros: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(m.text());
  });
  page.on("pageerror", (e) => erros.push(e.message));
  return erros;
}

const toque = (page: Page, nome: string) => page.getByRole("button", { name: nome, exact: true }).click();

/** Caminho principal: só toques, nada digitado. */
async function porRacaEPeso(page: Page, { especie, raca, peso, porte, condicao }: Record<string, string>) {
  await toque(page, especie!);
  await toque(page, raca!);
  await toque(page, peso!);
  if (porte) await toque(page, porte);
  await toque(page, condicao!);
}

async function porMedida(page: Page, especie: string, torax: string) {
  await toque(page, especie);
  await toque(page, "Já sei a medida do peito");
  await page.getByLabel("Volta do peito").fill(torax);
  await toque(page, "Continuar");
}

test("caminho principal (raça e peso) leva à compra na Shopee com UM tamanho", async ({ page }) => {
  const erros = vigiarErros(page);
  await page.goto("./");

  // Shih Tzu 6–10 kg (8 kg) normal → 45,2 cm; fleece: +4 = 49,2 → M
  await porRacaEPeso(page, { especie: "Cachorro", raca: "Shih Tzu", peso: "6 a 10 kg", condicao: "Normal" });

  await expect(page.getByLabel(/^Tamanho /)).toHaveCount(1);
  await expect(page.getByLabel("Tamanho M")).toBeVisible();
  await expect(page.getByText("Pela raça e peso")).toBeVisible();
  const comprar = page.getByRole("link", { name: /^Comprar M na Shopee$/ });
  await expect(comprar).toBeVisible();
  await expect(comprar).toHaveAttribute("href", /^https:\/\/shopee\.com\.br\//);
  await expect(comprar).toHaveAttribute("rel", "noopener noreferrer");

  expect(erros).toEqual([]);
});

test("vira-lata sem peso: pergunta o porte e recomenda", async ({ page }) => {
  await page.goto("./");
  await porRacaEPeso(page, { especie: "Gato", raca: "Vira-lata", peso: "Não sei", porte: "Médio", condicao: "Normal" });
  await expect(page.getByLabel("Tamanho P")).toBeVisible();
  await expect(page.getByText("Pela raça e peso")).toBeVisible();
});

test("busca de raça tolera acento e erro de digitação", async ({ page }) => {
  await page.goto("./");
  await toque(page, "Cachorro");
  await page.getByRole("searchbox", { name: "Buscar raça" }).fill("salcicha");
  await expect(page.getByRole("button", { name: "Dachshund (Salsicha)" })).toBeVisible();
});

test("atalho 'Já sei a medida do peito' dá resultado com confiança alta", async ({ page }) => {
  const erros = vigiarErros(page);
  await page.goto("./");
  await porMedida(page, "Cachorro", "46");
  await expect(page.getByLabel("Tamanho M")).toBeVisible();
  await expect(page.getByText("Pela medida do peito")).toBeVisible();
  expect(erros).toEqual([]);
});

test("medida inválida não avança e explica o que fazer", async ({ page }) => {
  await page.goto("./");
  await porMedida(page, "Cachorro", "abc");
  await expect(page.getByRole("alert")).toHaveText("Use só números. Ex.: 46");
  await expect(page.getByRole("heading", { name: "Medida do peito" })).toBeVisible();
});

test("nenhuma instrução de como medir em nenhuma tela", async ({ page }) => {
  await page.goto("./");
  await porMedida(page, "Cachorro", "46");
  await page.getByRole("button", { name: "Peito 46 cm" }).click();
  await expect(page.locator("body")).not.toContainText(/fita|barbante|régua|passe a/i);
});

/** Telas do fluxo e o elemento que a pessoa precisa ver para seguir (a ação principal de cada uma). */
const TELAS: { nome: string; acao: (p: Page) => ReturnType<Page["getByRole"]>; ir: (p: Page) => Promise<void> }[] = [
  { nome: "espécie", acao: (p) => p.getByRole("button", { name: "Gato" }), ir: async () => {} },
  {
    nome: "raça",
    acao: (p) => p.getByRole("button", { name: "Já sei a medida do peito" }),
    ir: (p) => toque(p, "Cachorro"),
  },
  { nome: "peso", acao: (p) => p.getByRole("button", { name: "Não sei" }), ir: (p) => toque(p, "Vira-lata") },
  { nome: "porte", acao: (p) => p.getByRole("button", { name: "Grande" }), ir: (p) => toque(p, "Não sei") },
  { nome: "condição", acao: (p) => p.getByRole("button", { name: "Cheinho" }), ir: (p) => toque(p, "Médio") },
  { nome: "resultado", acao: (p) => p.getByRole("link", { name: /^Comprar / }), ir: (p) => toque(p, "Normal") },
  {
    nome: "medida",
    acao: (p) => p.getByRole("button", { name: "Continuar" }),
    ir: async (p) => {
      await p.getByRole("button", { name: "Cachorro", exact: true }).first().click(); // chip → espécie
      await toque(p, "Cachorro");
      await toque(p, "Já sei a medida do peito");
    },
  },
];

test("ação principal de cada tela visível sem rolar (zona do polegar no celular)", async ({ page }, info) => {
  // Celular deitado: a regra é "nada cortado, rolagem funciona" (teste próprio abaixo).
  test.skip(info.project.name === "android-deitado");
  await page.goto("./");
  for (const t of TELAS) {
    await t.ir(page);
    await expect(t.acao(page), t.nome).toBeInViewport();
  }
});

test("celular deitado: rolagem vertical alcança a ação de cada tela", async ({ page }, info) => {
  test.skip(info.project.name !== "android-deitado");
  await page.goto("./");
  for (const t of TELAS) {
    await t.ir(page);
    const acao = t.acao(page);
    await acao.scrollIntoViewIfNeeded();
    await expect(acao, t.nome).toBeInViewport();
  }
});

test("alvos de toque têm pelo menos 48 px de altura em todas as telas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); // mede o layout final, não um quadro da transição
  await page.goto("./");
  for (const t of TELAS) {
    await t.ir(page);
    for (const alvo of await page.locator("button, a").all()) {
      const caixa = await alvo.boundingBox();
      expect(caixa?.height ?? 0, `${t.nome}: ${await alvo.textContent()}`).toBeGreaterThanOrEqual(48);
    }
  }
});

test("teclado: Tab chega às opções e Enter/Espaço respondem", async ({ page }, info) => {
  test.skip(!info.project.name.startsWith("desktop"));
  await page.goto("./");
  await page.bringToFront(); // com testes em paralelo, garante que esta janela tem o foco
  // O título recebe o foco a cada passo (leitor de tela); o Tab parte dele.
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cachorro" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Qual a raça?" })).toBeFocused();
  await page.keyboard.press("Tab"); // voltar
  await page.keyboard.press("Tab"); // busca
  await page.keyboard.type("shih");
  await page.keyboard.press("Enter"); // primeiro resultado
  await expect(page.getByRole("heading", { name: "Quanto pesa, mais ou menos?" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space"); // "Até 3 kg"
  await expect(page.getByRole("heading", { name: "Ele é…" })).toBeVisible();
});

test("sem rolagem horizontal em nenhuma tela", async ({ page }) => {
  await page.goto("./");
  const semRolagemLateral = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(await semRolagemLateral()).toBe(true);
  await toque(page, "Cachorro");
  expect(await semRolagemLateral()).toBe(true); // raça
  await toque(page, "Vira-lata");
  expect(await semRolagemLateral()).toBe(true); // peso
  await toque(page, "Não sei");
  expect(await semRolagemLateral()).toBe(true); // porte
  await toque(page, "Grande");
  expect(await semRolagemLateral()).toBe(true); // condição
  await toque(page, "Cheinho");
  expect(await semRolagemLateral()).toBe(true); // resultado
  await toque(page, "Cachorro"); // chip → espécie
  await toque(page, "Cachorro");
  await toque(page, "Já sei a medida do peito");
  expect(await semRolagemLateral()).toBe(true); // medida
});

test("CSP está ativa no build de produção", async ({ page }) => {
  await page.goto("./");
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("object-src 'none'");
});

test("offline-first: depois da primeira visita, funciona sem internet", async ({ page, context }) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // a partir daqui o SW controla a página
  await context.setOffline(true);
  await page.reload();

  await porRacaEPeso(page, { especie: "Cachorro", raca: "Shih Tzu", peso: "6 a 10 kg", condicao: "Normal" });
  await expect(page.getByLabel("Tamanho M")).toBeVisible();
});
