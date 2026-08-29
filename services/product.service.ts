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
    previous_price: row.previous_price !== null ? Number(row.previous_price) : null,
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
  if (filters.brands && filters.brands.length > 0) {
    query = query.in("brand", filters.brands);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }
  if (filters.condition) {
    query = query.eq("condition", filters.condition);
  }

  if (filters.sort === "rating_desc") {
    // average_rating es un agregado sobre reviews — PostgREST no puede
    // ordenar por él. El catálogo es chico: se trae todo lo que matchea el
    // resto de filtros y se ordena/pagina en memoria.
    const { data, error } = await query;
    if (error) throw error;
    const allItems = ((data ?? []) as unknown as ProductRowWithRelations[])
      .map((row) => mapProductRow(row, supabase))
      .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
    return { items: allItems.slice(from, to + 1), total: allItems.length };
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

export interface BrandCount {
  brand: string;
  count: number;
}

// Marcas + conteo para el sidebar de Resultados — en memoria, misma razón
// que los conteos de categoría del Home (PostgREST no agrupa).
export async function listBrandCounts(supabase: Client = createClient()): Promise<BrandCount[]> {
  const { data, error } = await supabase.from("products").select("brand").eq("is_active", true);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.brand) continue;
    counts.set(row.brand, (counts.get(row.brand) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);
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

// Productos con previous_price > price, ordenados por % de descuento
// (mayor primero). Se ordena en memoria: PostgREST no calcula expresiones
// entre columnas, y son pocas filas con descuento activo a la vez.
export async function listPriceDrops(limit: number, supabase: Client = createClient()): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_RELATIONS_SELECT)
    .eq("is_active", true)
    .not("previous_price", "is", null);
  if (error) throw error;

  const rows = (data ?? []) as unknown as ProductRowWithRelations[];
  return rows
    .map((row) => mapProductRow(row, supabase))
    .filter((product) => product.previous_price !== null && product.previous_price > product.price)
    .sort((a, b) => {
      const discountA = (a.previous_price! - a.price) / a.previous_price!;
      const discountB = (b.previous_price! - b.price) / b.previous_price!;
      return discountB - discountA;
    })
    .slice(0, limit);
}

// Productos activos con reseñas, mejor calificados primero (panel de
// reseñas del Home). Todo en memoria por la misma razón que listPriceDrops:
// el catálogo es chico y PostgREST no ordena por columnas calculadas.
export async function listTopReviewed(limit: number, supabase: Client = createClient()): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select(PRODUCT_WITH_RELATIONS_SELECT).eq("is_active", true);
  if (error) throw error;

  const rows = (data ?? []) as unknown as ProductRowWithRelations[];
  return rows
    .map((row) => mapProductRow(row, supabase))
    .filter((product) => product.review_count > 0)
    .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0) || b.review_count - a.review_count)
    .slice(0, limit);
}

// Fire-and-forget en el hook que lo llame: un error aquí no debe romper la UI.
export async function registerView(productId: string, userId: string, supabase: Client = createClient()) {
  const { error } = await supabase.from("product_views").insert({ product_id: productId, user_id: userId });
  if (error) throw error;
}
