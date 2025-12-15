import { defineConfig, devices } from "@playwright/test";

// Prefer localhost on Windows to avoid intermittent 127.0.0.1 binding issues.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev --port 3000",
    url: baseURL,
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
  },
});
