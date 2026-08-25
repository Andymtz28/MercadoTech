import type { UserRole } from "@/lib/constants/roles";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role: Extract<UserRole, "buyer" | "seller">;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateLogin(input: LoginInput): FieldErrors<LoginInput> {
  const errors: FieldErrors<LoginInput> = {};

  if (!input.email || !EMAIL_RE.test(input.email)) {
    errors.email = "Ingresa un correo válido.";
  }
  if (!input.password) {
    errors.password = "Ingresa tu contraseña.";
  }

  return errors;
}

export function validateRegister(input: RegisterInput): FieldErrors<RegisterInput> {
  const errors: FieldErrors<RegisterInput> = {};

  if (!input.displayName || input.displayName.trim().length < 2) {
    errors.displayName = "Ingresa un nombre de al menos 2 caracteres.";
  }
  if (!input.email || !EMAIL_RE.test(input.email)) {
    errors.email = "Ingresa un correo válido.";
  }
  if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (input.role !== "buyer" && input.role !== "seller") {
    errors.role = "Selecciona un tipo de cuenta válido.";
  }

  return errors;
}
