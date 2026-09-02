import type { Page } from "@playwright/test";

export class OrdersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/pedidos");
  }

  async gotoOrder(orderId: string) {
    await this.page.goto(`/pedidos/${orderId}`);
  }

  // Localiza el pedido por su HREF real (/pedidos/{id}) — nunca "el primero
  // de la lista": el id sale de la URL de redirección del checkout.
  orderCard(orderId: string) {
    return this.page.locator(`a[href="/pedidos/${orderId}"]`);
  }

  statusBadge(status: string) {
    return this.page.getByText(status, { exact: true });
  }
}
