import type { Page } from "@playwright/test";

export class SellerProductsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/vendedor/productos");
  }

  async gotoPublish() {
    await this.page.goto("/vendedor/publicar");
  }

  async fillBasicInfo(input: { title: string; price: number; stock: number; categoryName: string }) {
    await this.page.getByLabel("Título").fill(input.title);
    await this.page.getByLabel("Precio").fill(String(input.price));
    await this.page.getByLabel("Stock").fill(String(input.stock));
    await this.page.getByLabel("Categoría").click();
    await this.page.getByRole("option", { name: input.categoryName }).click();
  }

  async addImage(filePath: string) {
    await this.page.getByTestId("product-image-input").setInputFiles(filePath);
  }

  async submit(label: string) {
    await this.page.getByRole("button", { name: label }).click();
  }

  rowByTitle(title: string) {
    return this.page.getByRole("row", { name: new RegExp(title) });
  }
}
