import type { Database } from "@/types/database";
import type { ProductCondition } from "@/lib/constants/roles";

export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];

// `price`/`previous_price` llegan como string desde PostgREST (columnas
// numeric) — el service las convierte a number antes de exponerlas.
// `image_url` y las métricas de reseñas son campos calculados, no columnas.
export type Product = Omit<
  Database["public"]["Tables"]["products"]["Row"],
  "price" | "previous_price" | "condition"
> & {
  price: number;
  previous_price: number | null;
  condition: ProductCondition;
  image_url: string | null;
  average_rating: number | null;
  review_count: number;
};

export type ProductWithImages = Product & {
  images: ProductImage[];
};

export interface ProductFilters {
  categorySlug?: string;
  search?: string;
  sort?: "recent" | "price_asc" | "price_desc" | "rating_desc";
  page?: number;
  brands?: string[];
  maxPrice?: number;
  condition?: ProductCondition;
}

// Imagen en la galería local del formulario de vendedor (Fase 3.7).
// `file` presente = todavía no subida (modo create, antes del submit);
// ausente = ya persistida.
export interface GalleryImage {
  id: string;
  imagePath: string | null;
  publicUrl: string;
  position: number;
  file: File | null;
}
