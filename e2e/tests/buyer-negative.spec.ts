import { test, expect } from "../fixtures/test";
import { ProductPage } from "../pages/ProductPage";
import { CartPage } from "../pages/CartPage";
import { OUT_OF_STOCK_PRODUCT_ID } from "../data/users";

test.describe("Comprador — negativos", () => {
  test("producto sin stock: botón deshabilitado con motivo visible", async ({ page, loginAsBuyer }) => {
    await loginAsBuyer();
    const product = new ProductPage(page);
    await product.goto(OUT_OF_STOCK_PRODUCT_ID);

    await expect(product.addToCartButton).toBeDisabled();
    await expect(product.disabledReason).toBeVisible();
    await expect(page.getByText("Sin stock disponible")).toBeVisible();
  });

  test("carrito vacío: sin botón de checkout, se muestra el EmptyState", async ({ page, loginAsBuyer }) => {
    await loginAsBuyer();
    const cart = new CartPage(page);
    await cart.goto();

    await expect(page.getByText("Tu carrito está vacío")).toBeVisible();
    await expect(cart.checkoutButton).toHaveCount(0);
  });

  test("anónimo en /carrito → redirect a /login con redirectTo", async ({ page }) => {
    await page.goto("/carrito");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcarrito/);
  });
});
