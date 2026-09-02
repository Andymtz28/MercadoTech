import { test, expect } from "../fixtures/test";

// Smoke mínimo (Fase 6.4): solo prueba que la tubería completa (webServer +
// Playwright + Supabase local con seed) funciona antes de escribir los
// specs reales de las Fases 6.5/6.6.
test("la home carga y muestra el grid de productos", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tecnología comparable/ })).toBeVisible();
  await expect(page.getByTestId("product-card").first()).toBeVisible();
});
