import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { BUYER1, SELLER1 } from "../data/users";

// Login por Page Object, invocado explícitamente por cada test (no
// automático en cada uno): cada test arranca con un `page` nuevo de
// Playwright (contexto propio) — sesión por test, sin estado compartido
// entre specs.
interface Fixtures {
  loginAsBuyer: () => Promise<void>;
  loginAsSeller: () => Promise<void>;
}

export const test = base.extend<Fixtures>({
  loginAsBuyer: async ({ page }, use) => {
    await use(async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(BUYER1);
    });
  },
  loginAsSeller: async ({ page }, use) => {
    await use(async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(SELLER1);
    });
  },
});

export { expect };
