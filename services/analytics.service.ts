import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { listSellerOrders } from "@/services/order.service";
import { listSellerProducts } from "@/services/seller.service";
import { ANALYST_LOW_STOCK_THRESHOLD, ANALYST_TOP_PRODUCTS_LIMIT } from "@/lib/constants/ai";
import type { Database } from "@/types/database";
import type { OrderStatus } from "@/lib/constants/roles";

type Client = SupabaseClient<Database>;

export interface SellerAnalyticsProductRanking {
  title: string;
  units: number;
  revenue: number;
}

export interface SellerAnalyticsSummary {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: { title: string; stock: number }[];
  ordersByStatus: Record<OrderStatus, number>;
  gmv: number;
  averageOrderValue: number;
  topProductsByRevenue: SellerAnalyticsProductRanking[];
  averageRating: number | null;
}

// Todo lo que ve el modo "análisis" del asistente sale de las MISMAS
// funciones que ya usa el panel de vendedor (listSellerOrders,
// listSellerProducts) — nunca se reimplementa la consulta, y la RLS ya
// garantiza que un vendedor solo puede ver sus propios pedidos/productos
// (mismo camino que usa services/ para todo lo demás).
export async function getSellerAnalyticsSummary(
  sellerId: string,
  supabase: Client = createClient(),
): Promise<SellerAnalyticsSummary> {
  const [orders, products] = await Promise.all([
    listSellerOrders(sellerId, supabase),
    listSellerProducts(sellerId, supabase),
  ]);

  const ordersByStatus: Record<OrderStatus, number> = {
    pendiente: 0,
    pagado: 0,
    enviado: 0,
    entregado: 0,
    cancelado: 0,
  };
  for (const order of orders) {
    ordersByStatus[order.status] += 1;
  }

  const countedOrders = orders.filter((order) => order.status !== "cancelado");
  const gmv = countedOrders.reduce((sum, order) => sum + order.myTotal, 0);
  const averageOrderValue = countedOrders.length > 0 ? gmv / countedOrders.length : 0;

  const revenueByProduct = new Map<string, SellerAnalyticsProductRanking>();
  for (const order of countedOrders) {
    for (const item of order.myItems) {
      const key = item.product_id ?? item.title_snapshot;
      const existing = revenueByProduct.get(key);
      const lineRevenue = item.price_snapshot * item.quantity;
      if (existing) {
        existing.units += item.quantity;
        existing.revenue += lineRevenue;
      } else {
        revenueByProduct.set(key, { title: item.title_snapshot, units: item.quantity, revenue: lineRevenue });
      }
    }
  }
  const topProductsByRevenue = Array.from(revenueByProduct.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, ANALYST_TOP_PRODUCTS_LIMIT);

  const lowStockProducts = products
    .filter((product) => product.is_active && product.stock <= ANALYST_LOW_STOCK_THRESHOLD)
    .map((product) => ({ title: product.title, stock: product.stock }));

  const ratedProducts = products.filter((product) => product.average_rating !== null);
  const averageRating =
    ratedProducts.length > 0
      ? ratedProducts.reduce((sum, product) => sum + (product.average_rating ?? 0), 0) / ratedProducts.length
      : null;

  return {
    totalProducts: products.length,
    activeProducts: products.filter((product) => product.is_active).length,
    lowStockProducts,
    ordersByStatus,
    gmv,
    averageOrderValue,
    topProductsByRevenue,
    averageRating,
  };
}
