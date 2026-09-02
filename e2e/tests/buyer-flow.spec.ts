import { test, expect } from "../fixtures/test";
import { CatalogPage } from "../pages/CatalogPage";
import { ProductPage } from "../pages/ProductPage";
import { CartPage } from "../pages/CartPage";
import { OrdersPage } from "../pages/OrdersPage";
import { formatPrice } from "@/lib/utils";

// Laptop Dell XPS 13 del seed — categoría Laptops, con stock de sobra.
const LAPTOP_PRODUCT_ID = "b0000000-0000-0000-0000-000000000001";
const LAPTOP_PRICE = 18999;

test.describe("Flujo comprador", () => {
  test("login, filtrar, comprar y ver el pedido", async ({ page, loginAsBuyer }) => {
    const catalog = new CatalogPage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);
    const orders = new OrdersPage(page);

    await test.step("login buyer1 → catálogo con su menú de usuario", async () => {
      await loginAsBuyer();
      await expect(page.getByRole("button", { name: /Menú de/ })).toBeVisible();
    });

    await test.step('filtra "Laptops" → el grid solo muestra laptops', async () => {
      await catalog.goto();
      await catalog.filterByCategory("Laptops");
      await expect(page).toHaveURL(/\/categoria\/laptops/);
      await expect(catalog.productCard(LAPTOP_PRODUCT_ID)).toBeVisible();
    });

    await test.step("abre un producto CON stock → galería, precio", async () => {
      await catalog.openProduct(LAPTOP_PRODUCT_ID);
      await expect(page).toHaveURL(new RegExp(`/producto/${LAPTOP_PRODUCT_ID}`));
      await expect(page.getByText(formatPrice(LAPTOP_PRICE))).toBeVisible();
      await expect(product.addToCartButton).toBeEnabled();
    });

    await test.step("agrega 2 unidades → contador del navbar = 2", async () => {
      // No hay selector de cantidad en la ficha: se agrega 1 desde el
      // producto y se sube a 2 con el stepper del carrito.
      await product.addToCart();
      await cart.goto();
      const item = cart.cartItem(LAPTOP_PRODUCT_ID);
      await item.getByRole("button", { name: "Aumentar cantidad" }).click();
      await expect(item.getByTestId("cart-item-quantity")).toHaveText("2");
      await expect(page.getByRole("link", { name: /Carrito, 2 productos/ })).toBeVisible();
    });

    await test.step("carrito → subtotal correcto → Comprar", async () => {
      await expect(cart.subtotal).toHaveText(formatPrice(LAPTOP_PRICE * 2));
      await cart.checkout();
    });

    let orderId = "";
    await test.step("redirige a /pedidos/[id] → estado pendiente, ítems snapshot", async () => {
      await expect(page).toHaveURL(/\/pedidos\/[0-9a-f-]+$/);
      orderId = page.url().split("/pedidos/")[1];
      await expect(page.getByText("Pendiente")).toBeVisible();
      await expect(page.getByText(/Laptop Dell XPS 13/)).toBeVisible();
    });

    await test.step('"Mis pedidos" lista ese pedido (por id)', async () => {
      await orders.goto();
      await expect(orders.orderCard(orderId)).toBeVisible();
    });

    await test.step("logout → navbar anónimo", async () => {
      await page.getByRole("button", { name: /Menú de/ }).click();
      await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
      await expect(page.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
    });
  });
});
