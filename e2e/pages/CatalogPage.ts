import type { Page } from "@playwright/test";

export class CatalogPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  // Navega por la UI (menú "Categorías" → link de la categoría), no por URL
  // directa — es lo que el spec del flujo comprador pide verificar.
  async filterByCategory(categoryName: string) {
    await this.page.getByRole("button", { name: "Categorías" }).click();
    await this.page.getByRole("menuitem", { name: categoryName }).click();
  }

  productCard(productId: string) {
    return this.page.locator(`[data-testid="product-card"][data-product-id="${productId}"]`);
  }

  async openProduct(productId: string) {
    await this.productCard(productId).click();
  }

  get productCards() {
    return this.page.getByTestId("product-card");
  }
}
