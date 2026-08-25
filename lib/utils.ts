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
