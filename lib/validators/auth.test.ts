import { describe, expect, it } from "vitest";
import { validateLogin, validateRegister } from "./auth";

describe("validateLogin", () => {
  it("rechaza un correo con formato inválido", () => {
    const errors = validateLogin({ email: "no-es-un-correo", password: "algo" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeUndefined();
  });

  it("rechaza correo vacío", () => {
    const errors = validateLogin({ email: "", password: "algo" });
    expect(errors.email).toBeDefined();
  });

  it("rechaza contraseña vacía", () => {
    const errors = validateLogin({ email: "buyer1@mercadotech.test", password: "" });
    expect(errors.password).toBeDefined();
    expect(errors.email).toBeUndefined();
  });

  it("caso feliz: no hay errores", () => {
    const errors = validateLogin({ email: "buyer1@mercadotech.test", password: "MercadoTech123!" });
    expect(errors).toEqual({});
  });
});

describe("validateRegister", () => {
  const base = {
    email: "nuevo@mercadotech.test",
    password: "MercadoTech123!",
    displayName: "Ana Buyer",
    role: "buyer" as const,
  };

  it("rechaza display_name de menos de 2 caracteres", () => {
    const errors = validateRegister({ ...base, displayName: "A" });
    expect(errors.displayName).toBeDefined();
  });

  it("rechaza display_name vacío o solo espacios", () => {
    const errors = validateRegister({ ...base, displayName: "   " });
    expect(errors.displayName).toBeDefined();
  });

  it("acepta display_name de exactamente 2 caracteres (límite real: sin tope superior)", () => {
    // comportamiento actual: la función NO valida un máximo de longitud de
    // display_name (la spec original asumía un tope de 60 que no existe).
    const errors = validateRegister({ ...base, displayName: "Al" });
    expect(errors.displayName).toBeUndefined();
  });

  it("rechaza correo inválido", () => {
    const errors = validateRegister({ ...base, email: "no-valido" });
    expect(errors.email).toBeDefined();
  });

  it("rechaza contraseña de menos de 8 caracteres", () => {
    const errors = validateRegister({ ...base, password: "1234567" });
    expect(errors.password).toBeDefined();
  });

  it("acepta contraseña de exactamente 8 caracteres", () => {
    const errors = validateRegister({ ...base, password: "12345678" });
    expect(errors.password).toBeUndefined();
  });

  it("rechaza el rol admin (solo buyer/seller son registrables)", () => {
    // comportamiento actual: el chequeo es inline (input.role !== "buyer" &&
    // !== "seller"), no existe una constante exportada REGISTRABLE_ROLES ni
    // una función isUserRole separada.
    const errors = validateRegister({ ...base, role: "admin" as unknown as "buyer" });
    expect(errors.role).toBeDefined();
  });

  it("caso feliz por rol: buyer", () => {
    expect(validateRegister({ ...base, role: "buyer" })).toEqual({});
  });

  it("caso feliz por rol: seller", () => {
    expect(validateRegister({ ...base, role: "seller" })).toEqual({});
  });
});
