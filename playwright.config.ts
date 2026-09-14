// DOM and computed-style assertions against the dev server. This is the
// acceptance gate fiodoir verifies a diff with: assertions or a snapshot
// diff, never taste. Run: npx playwright test
import { defineConfig } from "@playwright/test";

const PORT = 4399;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: `./node_modules/.bin/astro dev --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
