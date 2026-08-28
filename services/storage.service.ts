import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  PRODUCT_IMAGES_BUCKET,
} from "@/lib/constants/storage";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ProductImage } from "@/types/product";

type Client = SupabaseClient<Database>;

export function getPublicUrl(path: string, supabase: Client = createClient()): string {
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Mismos límites que el bucket (Fase 2.4): valida en cliente antes de subir
// para dar feedback inmediato, la política de Storage lo vuelve a exigir.
export function validateProductImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return "Formato no soportado. Usa JPG, PNG, WEBP o GIF.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "La imagen supera el límite de 5 MB.";
  }
  return null;
}

// Path: {seller_id}/{product_id}/{n}.{ext} — la extensión sale del MIME
// real, no del nombre de archivo que trae el usuario.
export async function uploadProductImage(
  file: File,
  sellerId: string,
  productId: string,
  position: number,
  supabase: Client = createClient(),
): Promise<ProductImage> {
  const invalidReason = validateProductImageFile(file);
  if (invalidReason) throw new Error(invalidReason);

  const ext = MIME_EXTENSIONS[file.type] ?? "jpg";
  const path = `${sellerId}/${productId}/${position}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, image_path: path, position })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductImage(
  imageId: string,
  imagePath: string,
  supabase: Client = createClient(),
) {
  const { error: storageError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([imagePath]);
  if (storageError) throw storageError;

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
}

// Upsert con filas completas (id, product_id, image_path, position) — se
// llama tras cada reorden en modo edición.
export async function saveImageOrder(images: ProductImage[], supabase: Client = createClient()) {
  if (images.length === 0) return;
  const { error } = await supabase.from("product_images").upsert(images);
  if (error) throw error;
}
