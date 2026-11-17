import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * OWASP A05: Content-Security-Policy via <meta>, porque GitHub Pages não permite cabeçalhos.
 * Só no build: o servidor de desenvolvimento do Vite injeta scripts inline para HMR.
 * Na Hostinger, repetir como cabeçalho HTTP (adiciona frame-ancestors, que não funciona em <meta>).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

const cspNoBuild = (): Plugin => ({
  name: "csp-meta",
  apply: "build",
  transformIndexHtml: () => [
    { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CSP }, injectTo: "head-prepend" },
  ],
});

export default defineConfig({
  // Caminhos relativos: o mesmo build roda em usuario.github.io/repo/ e na raiz da Hostinger.
  base: "./",
  build: {
    target: "es2022",
    sourcemap: false,
  },
  plugins: [
    react(),
    cspNoBuild(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script", // arquivo externo, compatível com a CSP (sem script inline)
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Provador Ninicão",
        short_name: "Provador",
        description: "Descubra o tamanho certo da roupinha do seu pet.",
        lang: "pt-BR",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
      },
    }),
  ],
});
