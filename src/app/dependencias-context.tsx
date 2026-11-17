import { createContext, type ReactNode, useContext } from "react";
import type { Dependencias } from "./container";

const Ctx = createContext<Dependencias | null>(null);

export function DependenciasProvider({ value, children }: { value: Dependencias; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDependencias(): Dependencias {
  const deps = useContext(Ctx);
  if (!deps) throw new Error("DependenciasProvider ausente");
  return deps;
}
