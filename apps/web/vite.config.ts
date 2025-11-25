import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "src/app.d.ts",
        "src/lib/types.ts",
        "*.config.{js,ts,cjs}",
        "**/*.test.{js,ts}",
        "src/app.html",
        "src/routes/**", // Exclude routes until UI tests are implemented
        ".svelte-kit/**",
        "**/*.cjs",
      ],
    },
  },
});
