import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Category } from "@/types/category";

type Client = SupabaseClient<Database>;

export async function listCategories(supabase: Client = createClient()): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export interface CategoryWithCount extends Category {
  productCount: number;
}

// El conteo por categoría (tiles del Home) se arma en memoria a partir de
// los productos activos: PostgREST no ofrece GROUP BY, y el catálogo es
// chico como para justificar una vista o RPC solo para esto.
export async function listCategoriesWithCounts(supabase: Client = createClient()): Promise<CategoryWithCount[]> {
  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("category_id").eq("is_active", true),
  ]);
  if (categoriesResult.error) throw categoriesResult.error;
  if (productsResult.error) throw productsResult.error;

  const counts = new Map<string, number>();
  for (const row of productsResult.data ?? []) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  return (categoriesResult.data ?? []).map((category) => ({
    ...category,
    productCount: counts.get(category.id) ?? 0,
  }));
}
