import type { Page } from "@playwright/test";
import type { OrderStatus } from "@/lib/constants/roles";

export class SellerKanbanPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/vendedor/pedidos");
  }

  card(orderId: string) {
    return this.page.locator(`[data-testid="kanban-card"][data-order-id="${orderId}"]`);
  }

  column(status: OrderStatus) {
    return this.page.getByTestId(`kanban-column-${status}`);
  }

  // Camino de TECLADO de dnd-kit (decisión 9 de la sesión — el mouse es
  // frágil bajo Playwright para dnd-kit): foco en el asa → Space (recoge) →
  // flechas (mueve el paso por defecto de KeyboardSensor, 25px) hasta que
  // el centro de la tarjeta cae dentro de la columna destino → Space
  // (suelta). Se mide contra el DOM real en vez de asumir un número fijo de
  // flechas, para no depender de un valor mágico.
  async moveCardToColumn(orderId: string, targetStatus: OrderStatus, maxSteps = 40) {
    const card = this.card(orderId);
    const targetColumn = this.column(targetStatus);

    await card.focus();
    await this.page.keyboard.press("Space");

    const targetBox = await targetColumn.boundingBox();
    if (!targetBox) throw new Error(`No se encontró la columna destino ${targetStatus}`);

    for (let i = 0; i < maxSteps; i += 1) {
      const cardBox = await card.boundingBox();
      if (!cardBox) throw new Error("La tarjeta perdió su posición durante el arrastre por teclado.");
      const cardCenterX = cardBox.x + cardBox.width / 2;

      if (cardCenterX >= targetBox.x && cardCenterX <= targetBox.x + targetBox.width) {
        break;
      }
      await this.page.keyboard.press(cardCenterX < targetBox.x ? "ArrowRight" : "ArrowLeft");
    }

    await this.page.keyboard.press("Space");
  }
}
