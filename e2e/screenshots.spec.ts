import { type Page, test } from "@playwright/test";

/**
 * Uma imagem por tela, do tamanho da janela (o que a pessoa vê de fato, com a ação fixa no lugar).
 * Telas mais altas que a janela ganham uma segunda imagem rolada até o fim ("-fim").
 */
test("screenshots de todas as telas", async ({ page }, info) => {
  const pasta = `screenshots/${info.project.name}`;
  let n = 0;
  const foto = async (nome: string) => {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250); // fim da transição de entrada
    n += 1;
    const prefixo = `${pasta}/${String(n).padStart(2, "0")}-${nome}`;
    await page.screenshot({ path: `${prefixo}.png` });
    const rola = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1);
    if (rola) {
      await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${prefixo}-fim.png` });
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    }
  };
  const toque = (p: Page, nome: string) => p.getByRole("button", { name: nome, exact: true }).click();

  await page.goto("./");
  await foto("especie");
  await toque(page, "Cachorro");
  await foto("raca");
  await page.getByRole("searchbox").fill("pastor");
  await foto("raca-busca");
  await page.getByRole("searchbox").fill("ornitorrinco");
  await foto("raca-sem-resultado");
  await page.getByRole("button", { name: "Limpar busca" }).click();
  await toque(page, "Vira-lata");
  await foto("peso");
  await toque(page, "Não sei");
  await foto("porte");
  await toque(page, "Médio");
  await foto("condicao");
  await toque(page, "Normal");
  await foto("resultado-estimativa");
  await toque(page, "Cachorro");
  await foto("especie-selecionado");
  await toque(page, "Cachorro");
  await toque(page, "Já sei a medida do peito");
  await page.getByLabel("Volta do peito").fill("500");
  await toque(page, "Continuar");
  await foto("medida-erro");
  await page.getByLabel("Volta do peito").fill("46");
  await toque(page, "Continuar");
  await foto("resultado-medida");
  await page.goto("./");
  await toque(page, "Gato");
  await toque(page, "Persa");
  await toque(page, "3 a 5 kg");
  await foto("condicao-gato");
});
