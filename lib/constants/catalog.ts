// Tamaño de página del catálogo: múltiplo de 4 para que la grilla (1-4
// columnas según breakpoint) siempre cierre filas completas.
export const CATALOG_PAGE_SIZE = 12;

export type SortOption = "recent" | "price_asc" | "price_desc";

export const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

export const DEFAULT_SORT: SortOption = "recent";
