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

// Monograma de 2 letras para categorías sin icono real (diseño/README.md):
// iniciales de las dos palabras significativas ("Componentes de PC" → CP,
// filtrando conectores cortos como "de"), o las dos primeras letras si es
// una sola palabra ("Laptops" → LA).
export function getMonogram(name: string): string {
  const words = name.split(/\s+/).filter((word) => word.length > 2 || word === word.toUpperCase())
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  const source = words[0] ?? name
  return source.slice(0, 2).toUpperCase()
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
