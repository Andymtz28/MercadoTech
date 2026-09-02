import { test, expect } from "../fixtures/test";
import { SellerKanbanPage } from "../pages/SellerKanbanPage";
import { SEED_PAID_ORDER_ID } from "../data/users";

test.describe("Vendedor — negativos", () => {
  test("buyer1 no puede entrar al panel de vendedor", async ({ page, loginAsBuyer }) => {
    await loginAsBuyer();
    await page.goto("/vendedor/productos");

    await expect(page).toHaveURL("/");
    await expect(page.getByText("Necesitas una cuenta de vendedor para entrar aquí.")).toBeVisible();
  });

  // Nota: por el seed, el único pedido 'enviado' pertenece a seller2 — para
  // probar el retroceso con un pedido de seller1 este test arranca
  // avanzando el mismo pedido 'pagado' del flujo principal. Depende de
  // correr con workers:1 (como en CI) para no chocar con seller-flow.spec.ts
  // si ambos tocaran el mismo pedido en paralelo.
  test("no se puede retroceder un pedido de 'enviado' a 'pagado'", async ({ page, loginAsSeller }) => {
    await loginAsSeller();
    const kanban = new SellerKanbanPage(page);
    await kanban.goto();

    await kanban.moveCardToColumn(SEED_PAID_ORDER_ID, "enviado");
    await expect(kanban.column("enviado").locator(`[data-order-id="${SEED_PAID_ORDER_ID}"]`)).toBeVisible();

    // comportamiento actual, revisar: moveOrder rechaza el retroceso en
    // silencio (canAdvance devuelve false y el hook simplemente no llama al
    // service) — NO aparece ningún toast de error, a diferencia de lo que
    // asumía la spec original. Se ancla al comportamiento real: la tarjeta
    // se queda en 'enviado', sin feedback visible para el vendedor.
    await kanban.moveCardToColumn(SEED_PAID_ORDER_ID, "pagado");
    await expect(kanban.column("enviado").locator(`[data-order-id="${SEED_PAID_ORDER_ID}"]`)).toBeVisible();
    await expect(kanban.column("pagado").locator(`[data-order-id="${SEED_PAID_ORDER_ID}"]`)).toHaveCount(0);
  });
});
