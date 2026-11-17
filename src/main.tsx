import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { criarDependencias } from "./app/container";
import { DependenciasProvider } from "./app/dependencias-context";
import { instalarAutoRecuperacao } from "./infra/pwa/auto-recuperacao";
import { App } from "./presentation/App";
import "./presentation/styles.css";

const deps = criarDependencias();
instalarAutoRecuperacao(deps.logger);

const raiz = document.getElementById("root");
if (!raiz) throw new Error("#root não encontrado no index.html");

createRoot(raiz).render(
  <StrictMode>
    <DependenciasProvider value={deps}>
      <App />
    </DependenciasProvider>
  </StrictMode>,
);
