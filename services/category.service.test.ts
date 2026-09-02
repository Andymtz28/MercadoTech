import { describe, expect, it } from "vitest";
import { listCategories, listCategoriesWithCounts } from "./category.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";

describe("listCategories", () => {
  it("caso feliz devuelve las categorías", async () => {
    const supabase = createSupabaseMock({ tables: { categories: { data: [{ id: "c1", name: "Laptops" }] } } });
    expect(await listCategories(supabase)).toEqual([{ id: "c1", name: "Laptops" }]);
  });

  it("propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { categories: { data: null, error: { message: "falló" } } } });
    await expect(listCategories(supabase)).rejects.toEqual({ message: "falló" });
  });
});

describe("listCategoriesWithCounts", () => {
  it("cuenta productos activos por categoría, 0 si no tiene ninguno", async () => {
    const supabase = createSupabaseMock({
      tables: {
        categories: {
          data: [
            { id: "c1", name: "Laptops", slug: "laptops" },
            { id: "c2", name: "Audio", slug: "audio" },
          ],
        },
        products: { data: [{ category_id: "c1" }, { category_id: "c1" }] },
      },
    });

    const result = await listCategoriesWithCounts(supabase);

    expect(result).toEqual([
      { id: "c1", name: "Laptops", slug: "laptops", productCount: 2 },
      { id: "c2", name: "Audio", slug: "audio", productCount: 0 },
    ]);
  });

  it("propaga el error de cualquiera de las dos consultas", async () => {
    const supabase = createSupabaseMock({
      tables: {
        categories: { data: [], error: null },
        products: { data: null, error: { message: "falló productos" } },
      },
    });
    await expect(listCategoriesWithCounts(supabase)).rejects.toEqual({ message: "falló productos" });
  });
});
