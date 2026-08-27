import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/services/storage.service";
import { CATALOG_PAGE_SIZE } from "@/lib/constants/catalog";
import type { Database } from "@/types/database";
import type { Product, ProductFilters, ProductImage, ProductWithImages } from "@/types/product";
import type { ProductCondition } from "@/lib/constants/roles";

type Client = SupabaseClient<Database>;
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export interface ProductRowWithRelations extends ProductRow {
  product_images: Pick<ProductImage, "id" | "image_path" | "position" | "product_id">[];
  reviews: { rating: number }[];
}

export const PRODUCT_WITH_RELATIONS_SELECT =
  "*, product_images(id, image_path, position, product_id), reviews(rating)";

export interface ListProductsResult {
  items: Product[];
  total: number;
}

function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

export function mapProductRow(row: ProductRowWithRelations, supabase: Client): Product {
  const images = [...row.product_images].sort((a, b) => a.position - b.position);
  const cover = images[0];
  const ratings = row.reviews.map((r) => r.rating);

  return {
    id: row.id,
    seller_id: row.seller_id,
    category_id: row.category_id,
    title: row.title,
    description: row.description,
    brand: row.brand,
    condition: row.condition as ProductCondition,
    price: Number(row.price),
    stock: row.stock,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    image_url: cover ? getPublicUrl(cover.image_path, supabase) : null,
    average_rating: averageRating(ratings),
    review_count: ratings.length,
  };
}

export async function listActiveProducts(
  filters: ProductFilters,
  supabase: Client = createClient(),
): Promise<ListProductsResult> {
  const page = filters.page ?? 1;
  const from = (page - 1) * CATALOG_PAGE_SIZE;
  const to = from + CATALOG_PAGE_SIZE - 1;

  const selectColumns = filters.categorySlug
    ? "*, categories!inner(slug), product_images(id, image_path, position, product_id), reviews(rating)"
    : "*, product_images(id, image_path, position, product_id), reviews(rating)";

  let query = supabase.from("products").select(selectColumns, { count: "exact" }).eq("is_active", true);

  if (filters.categorySlug) {
    query = query.eq("categories.slug", filters.categorySlug);
  }
  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${term}%,brand.ilike.%${term}%`);
  }

  if (filters.sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (filters.sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = (data ?? []) as unknown as ProductRowWithRelations[];
  return {
    items: rows.map((row) => mapProductRow(row, supabase)),
    total: count ?? 0,
  };
}

export async function getProductById(
  id: string,
  supabase: Client = createClient(),
): Promise<ProductWithImages | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(id, image_path, position, product_id), reviews(rating)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ProductRowWithRelations;
  const product = mapProductRow(row, supabase);
  const images = [...row.product_images].sort((a, b) => a.position - b.position) as ProductImage[];

  return { ...product, images };
}

export async function getProductImages(
  productId: string,
  supabase: Client = createClient(),
): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

// Fire-and-forget en el hook que lo llame: un error aquí no debe romper la UI.
export async function registerView(productId: string, userId: string, supabase: Client = createClient()) {
  const { error } = await supabase.from("product_views").insert({ product_id: productId, user_id: userId });
  if (error) throw error;
}
