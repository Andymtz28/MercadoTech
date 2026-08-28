import type { ProductCondition } from "@/lib/constants/roles";
import { MIN_PRODUCT_PRICE, PRODUCT_TITLE_MAX_LENGTH, PRODUCT_DESCRIPTION_MAX_LENGTH } from "@/lib/constants/product";
import type { FieldErrors } from "@/lib/validators/auth";

export interface ProductFormInput {
  title: string;
  description: string;
  brand: string;
  condition: ProductCondition;
  categoryId: string;
  price: number;
  stock: number;
}

export function validateProductForm(input: ProductFormInput): FieldErrors<ProductFormInput> {
  const errors: FieldErrors<ProductFormInput> = {};

  if (!input.title.trim()) {
    errors.title = "El título es obligatorio.";
  } else if (input.title.length > PRODUCT_TITLE_MAX_LENGTH) {
    errors.title = `Máximo ${PRODUCT_TITLE_MAX_LENGTH} caracteres.`;
  }
  if (input.description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Máximo ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }
  if (!input.categoryId) {
    errors.categoryId = "Selecciona una categoría.";
  }
  if (!Number.isFinite(input.price) || input.price < MIN_PRODUCT_PRICE) {
    errors.price = "Ingresa un precio válido mayor a 0.";
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    errors.stock = "Ingresa un stock válido (entero, 0 o mayor).";
  }

  return errors;
}
