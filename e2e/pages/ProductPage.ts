import type { Page } from "@playwright/test";

export class ProductPage {
  constructor(private readonly page: Page) {}

  async goto(productId: string) {
    await this.page.goto(`/producto/${productId}`);
  }

  get addToCartButton() {
    return this.page.getByRole("button", { name: "Agregar al carrito" });
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  get disabledReason() {
    // Anclado con ^$: sin esto, "Sin stock" (el motivo) también matchea por
    // substring el label de disponibilidad "Sin stock disponible" — violación
    // de "strict mode" real, encontrada por la corrida de CI en Fase 6.7.
    return this.page.getByText(/^(Inicia sesión para comprar|Es tu propio producto|Sin stock)$/);
  }
}
