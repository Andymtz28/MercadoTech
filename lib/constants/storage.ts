// Nombres de los buckets creados en la Fase 2.4 — deben coincidir
// exactamente con supabase/migrations/20260101000016_storage_buckets.sql.
export const PRODUCT_IMAGES_BUCKET = "product-images";
export const AVATARS_BUCKET = "avatars";

// Límites del bucket (espejo del lado cliente para validar antes de subir).
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
