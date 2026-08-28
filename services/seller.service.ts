import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { mapProductRow, PRODUCT_WITH_RELATIONS_SELECT, type ProductRowWithRelations } from "@/services/product.service";
import type { Database } from "@/types/database";
import type { Product } from "@/types/product";
import type { ProductFormInput } from "@/lib/validators/product";

type Client = SupabaseClient<Database>;

// Incluye los propios inactivos (products_select ya lo permite para el
// vendedor dueño), a diferencia de listActiveProducts.
export async function listSellerProducts(sellerId: string, supabase: Client = createClient()): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_RELATIONS_SELECT)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as ProductRowWithRelations[];
  return rows.map((row) => mapProductRow(row, supabase));
}

export async function createProduct(
  input: ProductFormInput & { sellerId: string },
  supabase: Client = createClient(),
): Promise<string> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: input.sellerId,
      category_id: input.categoryId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      brand: input.brand.trim() || null,
      condition: input.condition,
      price: input.price,
      stock: input.stock,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateProduct(
  productId: string,
  input: ProductFormInput,
  supabase: Client = createClient(),
) {
  const { error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      brand: input.brand.trim() || null,
      condition: input.condition,
      price: input.price,
      stock: input.stock,
    })
    .eq("id", productId);
  if (error) throw error;
}

// order_items.product_id es on delete restrict: si el producto tiene
// ventas, Postgres devuelve el código 23503 (foreign_key_violation) — el
// hook lo traduce a un mensaje accionable ("desactívalo en su lugar").
export async function deleteProduct(productId: string, supabase: Client = createClient()) {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}
