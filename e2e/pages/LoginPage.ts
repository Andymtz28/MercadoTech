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
    // El submit no bloquea hasta terminar: sin esto, el caller podía seguir
    // navegando antes de que la sesión quedara establecida (carrera real,
    // encontrada por la corrida de CI en Fase 6.7).
    await this.page.waitForURL((url) => !url.pathname.startsWith("/login"));
  }
}
