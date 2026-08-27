import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
})

// PostgREST serializa las columnas `numeric` como string para no perder
// precisión, así que `value` puede llegar como string aunque el dominio ya
// lo haya convertido en la mayoría de los casos.
export function formatPrice(value: number | string): string {
  const numeric = typeof value === "string" ? Number(value) : value
  return priceFormatter.format(numeric)
}

// Los errores de Supabase (PostgrestError, AuthError) son objetos con
// `.message` pero NO instancias de `Error` — `err instanceof Error` falla
// silenciosamente para ellos y esconde el mensaje real (el que nombra el
// producto en los errores del checkout). Se lee `.message` de forma
// estructural en vez de por tipo, sin reescribirlo.
export function getErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado."): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message
  }
  return fallback
}
