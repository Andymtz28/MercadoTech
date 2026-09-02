import { describe, expect, it } from "vitest";
import { canReview, createReview, listReviews } from "./review.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";

describe("canReview", () => {
  it("false si ya existe una reseña del comprador para ese producto", async () => {
    const supabase = createSupabaseMock({ tables: { reviews: { data: { id: "r1" } } } });
    const result = await canReview("p1", "b1", supabase);
    expect(result).toEqual({ allowed: false, orderId: null });
  });

  it("false sin pedido entregado que contenga el producto", async () => {
    const supabase = createSupabaseMock({
      tables: { reviews: { data: null }, order_items: { data: null } },
    });
    const result = await canReview("p1", "b1", supabase);
    expect(result).toEqual({ allowed: false, orderId: null });
  });

  it("true con {allowed, orderId} cuando hay un pedido entregado", async () => {
    const supabase = createSupabaseMock({
      tables: { reviews: { data: null }, order_items: { data: { order_id: "o1" } } },
    });
    const result = await canReview("p1", "b1", supabase);
    expect(result).toEqual({ allowed: true, orderId: "o1" });
  });

  it("propaga el error de la primera consulta", async () => {
    const supabase = createSupabaseMock({ tables: { reviews: { data: null, error: { message: "falló" } } } });
    await expect(canReview("p1", "b1", supabase)).rejects.toEqual({ message: "falló" });
  });
});

describe("listReviews / createReview", () => {
  it("listReviews propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { reviews: { data: null, error: { message: "no autorizado" } } } });
    await expect(listReviews("p1", supabase)).rejects.toEqual({ message: "no autorizado" });
  });

  it("createReview: caso feliz, no lanza", async () => {
    const supabase = createSupabaseMock({ tables: { reviews: { data: null, error: null } } });
    await expect(
      createReview({ productId: "p1", buyerId: "b1", orderId: "o1", rating: 5, comment: "excelente" }, supabase),
    ).resolves.toBeUndefined();
  });
});
