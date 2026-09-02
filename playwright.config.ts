import { defineConfig, devices } from "@playwright/test";

// Requisito de entorno: estos E2E corren contra Supabase LOCAL
// (`supabase start && supabase db reset` con las migraciones + el seed) —
// NUNCA contra el proyecto remoto. En CI (.github/workflows/ci.yml) el
// stack efímero se levanta en el mismo job antes de esta suite.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html"]] : [["html"], ["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  // En CI: build + start (paridad con producción — decisión 12). En local:
  // reutiliza `npm run dev` si ya está arriba (patrón ReadHub) para no
  // levantar un segundo servidor.
  webServer: {
    command: isCI ? "npm run build && npm run start" : "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
