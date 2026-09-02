import { describe, expect, it } from "vitest";
import { validateProductForm, type ProductFormInput } from "./product";
import { MIN_PRODUCT_PRICE, PRODUCT_DESCRIPTION_MAX_LENGTH, PRODUCT_TITLE_MAX_LENGTH } from "@/lib/constants/product";

const validInput: ProductFormInput = {
  title: "Laptop ProBook 14 pulgadas",
  description: "Equipo en buen estado.",
  brand: "HP",
  condition: "nuevo",
  categoryId: "c0000000-0000-0000-0000-000000000001",
  price: 9999,
  stock: 5,
};

describe("validateProductForm", () => {
  it("caso feliz: sin errores", () => {
    expect(validateProductForm(validInput)).toEqual({});
  });

  it("rechaza título vacío", () => {
    const errors = validateProductForm({ ...validInput, title: "" });
    expect(errors.title).toBeDefined();
  });

  it("rechaza título de solo espacios", () => {
    const errors = validateProductForm({ ...validInput, title: "   " });
    expect(errors.title).toBeDefined();
  });

  it(`rechaza título de más de ${PRODUCT_TITLE_MAX_LENGTH} caracteres`, () => {
    const errors = validateProductForm({ ...validInput, title: "a".repeat(PRODUCT_TITLE_MAX_LENGTH + 1) });
    expect(errors.title).toBeDefined();
  });

  it(`acepta título de exactamente ${PRODUCT_TITLE_MAX_LENGTH} caracteres`, () => {
    const errors = validateProductForm({ ...validInput, title: "a".repeat(PRODUCT_TITLE_MAX_LENGTH) });
    expect(errors.title).toBeUndefined();
  });

  it(`rechaza descripción de más de ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres`, () => {
    const errors = validateProductForm({ ...validInput, description: "a".repeat(PRODUCT_DESCRIPTION_MAX_LENGTH + 1) });
    expect(errors.description).toBeDefined();
  });

  it("acepta descripción vacía (no es obligatoria)", () => {
    // comportamiento actual: solo se valida el máximo, nunca un mínimo ni
    // que exista contenido.
    const errors = validateProductForm({ ...validInput, description: "" });
    expect(errors.description).toBeUndefined();
  });

  it("rechaza precio en 0", () => {
    const errors = validateProductForm({ ...validInput, price: 0 });
    expect(errors.price).toBeDefined();
  });

  it("rechaza precio negativo", () => {
    const errors = validateProductForm({ ...validInput, price: -10 });
    expect(errors.price).toBeDefined();
  });

  it(`acepta el precio mínimo real (${MIN_PRODUCT_PRICE})`, () => {
    const errors = validateProductForm({ ...validInput, price: MIN_PRODUCT_PRICE });
    expect(errors.price).toBeUndefined();
  });

  it("rechaza precio no finito (NaN)", () => {
    const errors = validateProductForm({ ...validInput, price: NaN });
    expect(errors.price).toBeDefined();
  });

  it("rechaza stock negativo", () => {
    const errors = validateProductForm({ ...validInput, stock: -1 });
    expect(errors.stock).toBeDefined();
  });

  it("rechaza stock no entero", () => {
    const errors = validateProductForm({ ...validInput, stock: 1.5 });
    expect(errors.stock).toBeDefined();
  });

  it("acepta stock en 0", () => {
    const errors = validateProductForm({ ...validInput, stock: 0 });
    expect(errors.stock).toBeUndefined();
  });

  it("rechaza sin categoría", () => {
    const errors = validateProductForm({ ...validInput, categoryId: "" });
    expect(errors.categoryId).toBeDefined();
  });
});
