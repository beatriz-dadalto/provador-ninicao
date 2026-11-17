import { defineConfig, devices } from "@playwright/test";

/**
 * Validação visual (não roda no CI): `npm run build && npm run screenshots`.
 * Gera screenshots/<perfil>-<tema>/<nn-tela>.png em todos os tamanhos e nos dois temas.
 */
const perfis = {
  "galaxy-s8": devices["Galaxy S8"],
  "iphone-13-mini": devices["iPhone 13 Mini"],
  "pixel-7-deitado": devices["Pixel 7 landscape"],
  "ipad-mini": devices["iPad Mini"],
  "desktop-1440": { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
};

export default defineConfig({
  testDir: "e2e",
  testMatch: "screenshots.spec.ts",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://localhost:4173", locale: "pt-BR" },
  projects: Object.entries(perfis).flatMap(([nome, device]) =>
    (["light", "dark"] as const).map((tema) => ({
      name: `${nome}-${tema === "light" ? "claro" : "escuro"}`,
      use: { ...device, colorScheme: tema },
    })),
  ),
  webServer: { command: "npm run preview", url: "http://localhost:4173", reuseExistingServer: true, timeout: 30_000 },
});
