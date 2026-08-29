// Tamaño de página del catálogo: múltiplo de 4 para que la grilla (1-4
// columnas según breakpoint) siempre cierre filas completas.
export const CATALOG_PAGE_SIZE = 12;

export type SortOption = "recent" | "price_asc" | "price_desc" | "rating_desc";

export const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: "recent", label: "Más relevantes" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "rating_desc", label: "Mejor calificados" },
];

export const DEFAULT_SORT: SortOption = "recent";

// Rango del slider de precio máximo del sidebar de Resultados
// (diseño/README.md § Resultados de búsqueda).
export const PRICE_FILTER_MIN = 0;
export const PRICE_FILTER_MAX = 30000;
export const PRICE_FILTER_STEP = 500;
