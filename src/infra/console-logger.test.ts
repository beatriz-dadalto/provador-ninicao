import { describe, expect, it, vi } from "vitest";
import { consoleLogger } from "./console-logger";

describe("consoleLogger", () => {
  it("prefixa as mensagens e usa contexto vazio por padrão", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleLogger.warn("a");
    consoleLogger.error("b", { x: 1 });
    expect(warn).toHaveBeenCalledWith("[provador] a", {});
    expect(error).toHaveBeenCalledWith("[provador] b", { x: 1 });
  });
});
