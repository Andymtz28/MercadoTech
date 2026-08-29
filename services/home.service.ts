import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface HomeStats {
  activeProductCount: number;
  verifiedSellerCount: number;
}

// El esquema todavía no tiene un flag de verificación de vendedor — se
// cuenta cada vendedor distinto con al menos una publicación activa, mismo
// lenguaje que usa el diseño ("vendedores verificados") hasta que exista
// esa columna.
export async function getHomeStats(supabase: Client = createClient()): Promise<HomeStats> {
  const { data, error, count } = await supabase.from("products").select("seller_id", { count: "exact" }).eq("is_active", true);
  if (error) throw error;

  const sellerIds = new Set((data ?? []).map((row) => row.seller_id));
  return {
    activeProductCount: count ?? 0,
    verifiedSellerCount: sellerIds.size,
  };
}
