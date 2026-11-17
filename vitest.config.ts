import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test-setup.ts", "src/main.tsx", "src/domain/test-fixtures.ts"],
      thresholds: {
        // Regras de negócio: cobertura total. Restante: 90%.
        "src/domain/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "src/application/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90,
      },
    },
  },
});
