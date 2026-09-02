import { describe, expect, it } from "vitest";
import { addFavorite, isFavorite, listFavoriteProducts, removeFavorite } from "./favorite.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";

describe("isFavorite", () => {
  it("true si existe la fila", async () => {
    const supabase = createSupabaseMock({ tables: { favorites: { data: { id: "f1" } } } });
    expect(await isFavorite("p1", "u1", supabase)).toBe(true);
  });

  it("false si no existe", async () => {
    const supabase = createSupabaseMock({ tables: { favorites: { data: null } } });
    expect(await isFavorite("p1", "u1", supabase)).toBe(false);
  });

  it("propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { favorites: { data: null, error: { message: "falló" } } } });
    await expect(isFavorite("p1", "u1", supabase)).rejects.toEqual({ message: "falló" });
  });
});

describe("addFavorite / removeFavorite", () => {
  it("addFavorite: caso feliz, no lanza", async () => {
    const supabase = createSupabaseMock({ tables: { favorites: { data: null, error: null } } });
    await expect(addFavorite("p1", "u1", supabase)).resolves.toBeUndefined();
  });

  it("removeFavorite: propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { favorites: { data: null, error: { message: "no existe" } } } });
    await expect(removeFavorite("p1", "u1", supabase)).rejects.toEqual({ message: "no existe" });
  });
});

describe("listFavoriteProducts", () => {
  it("descarta favoritos cuyo producto ya no existe (products: null)", async () => {
    const supabase = createSupabaseMock({
      tables: {
        favorites: {
          data: [
            { product_id: "p1", products: null },
            {
              product_id: "p2",
              products: {
                id: "p2",
                seller_id: "s1",
                category_id: "c1",
                title: "Vivo",
                description: null,
                brand: null,
                condition: "nuevo",
                price: "10.00",
                previous_price: null,
                stock: 1,
                is_active: true,
                created_at: "2026-01-01",
                updated_at: "2026-01-01",
                product_images: [],
                reviews: [],
              },
            },
          ],
        },
      },
    });

    const products = await listFavoriteProducts("u1", supabase);

    expect(products).toHaveLength(1);
    expect(products[0].id).toBe("p2");
  });
});
