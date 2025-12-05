import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  testDir: "tests",
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  reporter: "html",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // {
    //     name: 'firefox',
    //     use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //     name: 'webkit',
    //     use: { ...devices['Desktop Safari'] },
    // },
  ],
});
