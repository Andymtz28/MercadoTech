import { describe, expect, it } from "vitest";
import { getSellerAnalyticsSummary } from "./analytics.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";

const baseProduct = {
  id: "p1",
  seller_id: "s1",
  category_id: "c1",
  title: "Laptop ligera",
  description: null,
  brand: "Dell",
  condition: "nuevo",
  price: "18999.00",
  previous_price: null,
  stock: 5,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  product_images: [],
  reviews: [],
};

describe("getSellerAnalyticsSummary", () => {
  it("calcula GMV, ticket promedio y ranking de productos ignorando pedidos cancelados", async () => {
    const supabase = createSupabaseMock({
      tables: {
        order_items: {
          data: [
            {
              id: "i1",
              product_id: "p1",
              title_snapshot: "Laptop ligera",
              quantity: 2,
              price_snapshot: "100.00",
              orders: { id: "o1", status: "pagado", created_at: "2026-01-02", buyer_id: "b1" },
            },
            {
              id: "i2",
              product_id: "p2",
              title_snapshot: "Mouse",
              quantity: 1,
              price_snapshot: "9999.00",
              orders: { id: "o2", status: "cancelado", created_at: "2026-01-03", buyer_id: "b2" },
            },
          ],
        },
        products: { data: [baseProduct] },
      },
    });

    const summary = await getSellerAnalyticsSummary("s1", supabase);

    expect(summary.gmv).toBe(200); // solo el pedido "pagado" cuenta, el cancelado no
    expect(summary.averageOrderValue).toBe(200);
    expect(summary.ordersByStatus.pagado).toBe(1);
    expect(summary.ordersByStatus.cancelado).toBe(1);
    expect(summary.topProductsByRevenue[0]).toMatchObject({ title: "Laptop ligera", units: 2, revenue: 200 });
  });

  it("marca como stock bajo solo los productos ACTIVOS por debajo del umbral", async () => {
    const supabase = createSupabaseMock({
      tables: {
        order_items: { data: [] },
        products: {
          data: [
            { ...baseProduct, id: "p1", title: "Con poco stock, activo", stock: 2, is_active: true },
            { ...baseProduct, id: "p2", title: "Con poco stock, inactivo", stock: 1, is_active: false },
            { ...baseProduct, id: "p3", title: "Con stock de sobra", stock: 50, is_active: true },
          ],
        },
      },
    });

    const summary = await getSellerAnalyticsSummary("s1", supabase);

    expect(summary.lowStockProducts).toEqual([{ title: "Con poco stock, activo", stock: 2 }]);
    expect(summary.totalProducts).toBe(3);
    expect(summary.activeProducts).toBe(2);
  });

  it("sin pedidos ni reseñas: GMV en 0 y rating null, sin dividir por cero", async () => {
    const supabase = createSupabaseMock({
      tables: {
        order_items: { data: [] },
        products: { data: [{ ...baseProduct, reviews: [] }] },
      },
    });

    const summary = await getSellerAnalyticsSummary("s1", supabase);

    expect(summary.gmv).toBe(0);
    expect(summary.averageOrderValue).toBe(0);
    expect(summary.topProductsByRevenue).toEqual([]);
    expect(summary.averageRating).toBeNull();
  });
});
