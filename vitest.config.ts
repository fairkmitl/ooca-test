import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      reportsDirectory: "coverage",
      include: [
        "src/lib/services/**",
        "src/lib/constants.ts",
      ],
      exclude: [
        "src/generated/**",
        "src/lib/db.ts",
        "src/lib/types.ts",
        "src/lib/services/memberValidation.ts",
        "src/lib/services/orderService.ts",
        "node_modules/**",
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
