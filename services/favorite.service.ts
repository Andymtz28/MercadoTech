import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { mapProductRow, PRODUCT_WITH_RELATIONS_SELECT, type ProductRowWithRelations } from "@/services/product.service";
import type { Database } from "@/types/database";
import type { Product } from "@/types/product";

type Client = SupabaseClient<Database>;

interface FavoriteRow {
  product_id: string;
  products: ProductRowWithRelations | null;
}

export async function isFavorite(
  productId: string,
  userId: string,
  supabase: Client = createClient(),
): Promise<boolean> {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function addFavorite(productId: string, userId: string, supabase: Client = createClient()) {
  const { error } = await supabase.from("favorites").insert({ product_id: productId, user_id: userId });
  if (error) throw error;
}

export async function removeFavorite(productId: string, userId: string, supabase: Client = createClient()) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("product_id", productId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listFavoriteProducts(userId: string, supabase: Client = createClient()): Promise<Product[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select(`product_id, products(${PRODUCT_WITH_RELATIONS_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as FavoriteRow[];
  return rows
    .filter((row): row is FavoriteRow & { products: ProductRowWithRelations } => row.products !== null)
    .map((row) => mapProductRow(row.products, supabase));
}
