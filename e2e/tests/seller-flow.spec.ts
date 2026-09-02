import path from "node:path";
import { test, expect } from "../fixtures/test";
import { SellerProductsPage } from "../pages/SellerProductsPage";
import { CatalogPage } from "../pages/CatalogPage";
import { SellerKanbanPage } from "../pages/SellerKanbanPage";
import { OrdersPage } from "../pages/OrdersPage";
import { LoginPage } from "../pages/LoginPage";
import { BUYER1, SEED_PAID_ORDER_ID } from "../data/users";

// Ruta relativa a la raíz del repo (playwright siempre se ejecuta desde
// ahí) — evita __dirname/import.meta, que se comportan distinto según el
// sistema de módulos con el que Playwright transpile este archivo.
const FIXTURE_IMAGE = path.join(process.cwd(), "e2e", "data", "product-image.jpg");

test.describe("Flujo vendedor", () => {
  test("publica un producto y mueve un pedido por el kanban (teclado)", async ({ page, loginAsSeller }) => {
    const sellerProducts = new SellerProductsPage(page);
    const catalog = new CatalogPage(page);
    const kanban = new SellerKanbanPage(page);
    const orders = new OrdersPage(page);
    const uniqueTitle = `Producto E2E ${Date.now()}`;

    await test.step("login seller1 → panel", async () => {
      await loginAsSeller();
      await sellerProducts.goto();
      await expect(page.getByRole("heading", { name: /Mis productos|Productos/ })).toBeVisible();
    });

    await test.step("publica un producto (título único) con imagen de fixture", async () => {
      await sellerProducts.gotoPublish();
      await sellerProducts.fillBasicInfo({ title: uniqueTitle, price: 499, stock: 10, categoryName: "Audio" });
      await sellerProducts.addImage(FIXTURE_IMAGE);
      await sellerProducts.submit("Publicar");
      await expect(page).toHaveURL(/\/vendedor\/productos\/[0-9a-f-]+\/editar/);
    });

    await test.step("aparece en la tabla del vendedor Y en el catálogo público", async () => {
      await sellerProducts.goto();
      await expect(sellerProducts.rowByTitle(uniqueTitle)).toBeVisible();

      // catalog.goto() aterriza en el Home rediseñado (Fase UX post-Sesión 4):
      // ya no lista todo el catálogo, solo "Bajaron de precio" y "Mejor
      // calificados" — un producto recién publicado (sin previous_price ni
      // reseñas) nunca aparece ahí. El catálogo real de una categoría vive
      // en /categoria/[slug], al que se llega filtrando (igual que hace
      // buyer-flow.spec.ts, que sí encuentra productos existentes por esta vía).
      await catalog.goto();
      await catalog.filterByCategory("Audio");
      await expect(page.getByText(uniqueTitle)).toBeVisible();
    });

    await test.step("kanban: mueve el pedido 'pagado' a 'enviado' POR TECLADO", async () => {
      await kanban.goto();
      await expect(kanban.card(SEED_PAID_ORDER_ID)).toBeVisible();

      await kanban.moveCardToColumn(SEED_PAID_ORDER_ID, "enviado");

      const cardInShipped = kanban.column("enviado").locator(`[data-order-id="${SEED_PAID_ORDER_ID}"]`);
      await expect(cardInShipped).toBeVisible();
    });

    await test.step("la tarjeta persiste en 'enviado' tras recargar", async () => {
      await page.reload();
      const cardInShipped = kanban.column("enviado").locator(`[data-order-id="${SEED_PAID_ORDER_ID}"]`);
      await expect(cardInShipped).toBeVisible();
    });

    await test.step("el comprador de ese pedido ve 'enviado' en su detalle", async () => {
      // El panel de vendedor ((seller)/layout.tsx) usa SellerSidebar, no
      // Navbar — no hay botón "Menú de..." en /vendedor/pedidos. Hay que
      // volver a una página de la tienda (donde SÍ vive el navbar) antes de
      // poder cerrar sesión por ahí.
      await page.goto("/");
      await page.getByRole("button", { name: /Menú de/ }).click();
      await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(BUYER1);

      await orders.gotoOrder(SEED_PAID_ORDER_ID);
      await expect(page.getByText("Enviado")).toBeVisible();
    });
  });
});
