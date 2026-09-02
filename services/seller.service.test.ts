import { describe, expect, it } from "vitest";
import { createProduct, deleteProduct, listSellerProducts, updateProduct } from "./seller.service";
import { createSupabaseMock, findInvokedChain } from "./test-utils/supabase-mock";
import type { ProductFormInput } from "@/lib/validators/product";

const formInput: ProductFormInput = {
  title: "  Laptop nueva  ",
  description: "  buena  ",
  brand: "  Dell  ",
  condition: "nuevo",
  categoryId: "c1",
  price: 9999,
  stock: 3,
};

describe("listSellerProducts", () => {
  it("incluye productos inactivos del propio vendedor (no filtra is_active)", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: {
          data: [
            {
              id: "p1",
              seller_id: "s1",
              category_id: "c1",
              title: "Activo",
              description: null,
              brand: null,
              condition: "nuevo",
              price: "100.00",
              previous_price: null,
              stock: 1,
              is_active: true,
              created_at: "2026-01-01",
              updated_at: "2026-01-01",
              product_images: [],
              reviews: [],
            },
            {
              id: "p2",
              seller_id: "s1",
              category_id: "c1",
              title: "Inactivo",
              description: null,
              brand: null,
              condition: "nuevo",
              price: "50.00",
              previous_price: null,
              stock: 0,
              is_active: false,
              created_at: "2026-01-01",
              updated_at: "2026-01-01",
              product_images: [],
              reviews: [],
            },
          ],
        },
      },
    });

    const products = await listSellerProducts("s1", supabase);

    expect(products).toHaveLength(2);
    expect(products.some((p) => !p.is_active)).toBe(true);
    const query = findInvokedChain(supabase.from, "eq");
    expect(query.eq).toHaveBeenCalledWith("seller_id", "s1");
    // nunca debe filtrar por is_active — a diferencia de listActiveProducts.
    expect(query.eq).not.toHaveBeenCalledWith("is_active", true);
  });
});

describe("createProduct", () => {
  it("recorta espacios en título/descripción/marca y devuelve el id", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: { id: "new-id" } } } });

    const id = await createProduct({ ...formInput, sellerId: "s1" }, supabase);

    expect(id).toBe("new-id");
    const inserted = findInvokedChain(supabase.from, "insert");
    expect(inserted.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Laptop nueva", description: "buena", brand: "Dell", seller_id: "s1" }),
    );
  });

  it("description/brand vacíos tras el trim se guardan como null", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: { id: "new-id" } } } });

    await createProduct({ ...formInput, description: "   ", brand: "   ", sellerId: "s1" }, supabase);

    const inserted = findInvokedChain(supabase.from, "insert");
    expect(inserted.insert).toHaveBeenCalledWith(expect.objectContaining({ description: null, brand: null }));
  });

  it("propaga el error del insert", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: null, error: { message: "falló" } } } });
    await expect(createProduct({ ...formInput, sellerId: "s1" }, supabase)).rejects.toEqual({ message: "falló" });
  });
});

describe("updateProduct", () => {
  it("envía los campos recortados sin tocar seller_id", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: null, error: null } } });

    await updateProduct("p1", formInput, supabase);

    const updated = findInvokedChain(supabase.from, "update");
    expect(updated.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Laptop nueva", category_id: "c1", price: 9999, stock: 3 }),
    );
    expect(updated.update.mock.calls[0][0]).not.toHaveProperty("seller_id");
  });
});

describe("deleteProduct", () => {
  it("no lanza cuando el delete no tiene error", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: null, error: null } } });
    await expect(deleteProduct("p1", supabase)).resolves.toBeUndefined();
  });

  it("propaga el error 23503 (foreign_key_violation) tal cual, sin traducirlo", () => {
    // comportamiento actual: la TRADUCCIÓN del código 23503 a un mensaje
    // accionable vive en el hook que llama a este service (ver
    // useSellerProducts), no aquí — el service se limita a propagar.
    const supabase = createSupabaseMock({
      tables: { products: { data: null, error: { code: "23503", message: "foreign key violation" } } },
    });
    return expect(deleteProduct("p1", supabase)).rejects.toEqual({ code: "23503", message: "foreign key violation" });
  });
});
