import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(credentials: { email: string; password: string }) {
    await this.page.getByLabel("Correo").fill(credentials.email);
    await this.page.getByLabel("Contraseña").fill(credentials.password);
    await this.page.getByRole("button", { name: "Iniciar sesión" }).click();
  }
}
