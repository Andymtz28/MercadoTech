import type { Page } from "@playwright/test";

export class CartPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/carrito");
  }

  cartItem(productId: string) {
    return this.page.locator(`[data-testid="cart-item"][data-product-id="${productId}"]`);
  }

  get checkoutButton() {
    return this.page.getByTestId("checkout-button");
  }

  get subtotal() {
    return this.page.getByTestId("cart-subtotal");
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
