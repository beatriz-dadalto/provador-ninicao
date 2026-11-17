import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

/**
 * E2E contra o build de produção (vite preview), não contra o servidor de dev:
 * testa CSP, service worker e bundle reais.
 * Android → Chromium; iOS → WebKit (motor do Safari e de todo navegador no iPhone).
 * Também: celular deitado (altura baixa), tablet (iPad Mini, WebKit) e desktop 1440×900.
 */
export default defineConfig({
  testDir: "e2e",
  testIgnore: "**/screenshots.spec.ts",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    locale: "pt-BR",
  },
  projects: [
    { name: "android-pequeno", use: { ...devices["Galaxy S8"] } },
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "ios-pequeno", use: { ...devices["iPhone 13 Mini"] } },
    { name: "ios", use: { ...devices["iPhone 15"] } },
    { name: "android-deitado", use: { ...devices["Pixel 7 landscape"] } },
    { name: "tablet", use: { ...devices["iPad Mini"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !CI,
    timeout: 30_000,
  },
});
