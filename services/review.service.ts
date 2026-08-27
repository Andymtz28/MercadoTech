import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Review } from "@/types/review";

type Client = SupabaseClient<Database>;

export interface CanReviewResult {
  allowed: boolean;
  orderId: string | null;
}

export async function listReviews(productId: string, supabase: Client = createClient()): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Refleja la policy reviews_insert: comprador con un pedido 'entregado' que
// contenga el producto, y que todavía no lo haya reseñado (unique por
// comprador/producto).
export async function canReview(
  productId: string,
  buyerId: string,
  supabase: Client = createClient(),
): Promise<CanReviewResult> {
  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_id", buyerId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { allowed: false, orderId: null };

  const { data, error } = await supabase
    .from("order_items")
    .select("order_id, orders!inner(status, buyer_id)")
    .eq("product_id", productId)
    .eq("orders.buyer_id", buyerId)
    .eq("orders.status", "entregado")
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  return { allowed: !!data, orderId: data?.order_id ?? null };
}

export async function createReview(
  input: { productId: string; buyerId: string; orderId: string; rating: number; comment: string },
  supabase: Client = createClient(),
) {
  const { error } = await supabase.from("reviews").insert({
    product_id: input.productId,
    buyer_id: input.buyerId,
    order_id: input.orderId,
    rating: input.rating,
    comment: input.comment,
  });
  if (error) throw error;
}
