import { describe, expect, it } from "vitest";
import {
  getProductById,
  getProductImages,
  listActiveProducts,
  listBrandCounts,
  listPriceDrops,
  listTopReviewed,
  mapProductRow,
  registerView,
  type ProductRowWithRelations,
} from "./product.service";
import { createSupabaseMock, findInvokedChain } from "./test-utils/supabase-mock";

// Tipado como ProductRowWithRelations vía cast: a nivel de tipos `price` es
// `number` (columna numeric generada por Supabase), pero en runtime
// PostgREST la sirve como string — el propio service la castea igual
// (`as unknown as ProductRowWithRelations[]`) antes de convertirla.
const baseRow = {
  id: "p1",
  seller_id: "s1",
  category_id: "c1",
  title: "Laptop Dell XPS 13",
  description: "desc",
  brand: "Dell",
  condition: "nuevo",
  price: "18999.00",
  previous_price: null,
  stock: 5,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  product_images: [
    { id: "img2", image_path: "s1/p1/2.jpg", position: 1, product_id: "p1" },
    { id: "img1", image_path: "s1/p1/1.jpg", position: 0, product_id: "p1" },
  ],
  reviews: [{ rating: 4 }, { rating: 5 }],
} as unknown as ProductRowWithRelations;

describe("mapProductRow", () => {
  it("convierte price (string de PostgREST) a number", () => {
    const supabase = createSupabaseMock();
    const product = mapProductRow(baseRow, supabase);
    expect(product.price).toBe(18999);
    expect(typeof product.price).toBe("number");
  });

  it("image_url es la portada por MENOR position, no la primera del arreglo", () => {
    const supabase = createSupabaseMock();
    const product = mapProductRow(baseRow, supabase);
    expect(product.image_url).toContain("s1/p1/1.jpg");
  });

  it("calcula average_rating y review_count sobre las reseñas", () => {
    const supabase = createSupabaseMock();
    const product = mapProductRow(baseRow, supabase);
    expect(product.average_rating).toBe(4.5);
    expect(product.review_count).toBe(2);
  });

  it("sin reseñas: average_rating es null y review_count 0", () => {
    const supabase = createSupabaseMock();
    const product = mapProductRow({ ...baseRow, reviews: [] }, supabase);
    expect(product.average_rating).toBeNull();
    expect(product.review_count).toBe(0);
  });

  it("sin imágenes: image_url es null", () => {
    const supabase = createSupabaseMock();
    const product = mapProductRow({ ...baseRow, product_images: [] }, supabase);
    expect(product.image_url).toBeNull();
  });

  it("previous_price string se convierte a number; null se conserva", () => {
    const supabase = createSupabaseMock();
    const withPreviousPrice = { ...baseRow, previous_price: "23999.00" } as unknown as ProductRowWithRelations;
    expect(mapProductRow(withPreviousPrice, supabase).previous_price).toBe(23999);
    expect(mapProductRow(baseRow, supabase).previous_price).toBeNull();
  });
});

describe("listActiveProducts — construcción de filtros", () => {
  it("siempre filtra is_active = true", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({}, supabase);
    const query = findInvokedChain(supabase.from, "eq");
    expect(query.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("categorySlug agrega el filtro por slug de categoría", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({ categorySlug: "laptops" }, supabase);
    const query = findInvokedChain(supabase.from, "eq");
    expect(query.eq).toHaveBeenCalledWith("categories.slug", "laptops");
  });

  it("search arma un OR de ilike sobre title y brand", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({ search: "dell" }, supabase);
    const query = findInvokedChain(supabase.from, "or");
    expect(query.or).toHaveBeenCalledWith("title.ilike.%dell%,brand.ilike.%dell%");
  });

  it("brands filtra con .in sobre la columna brand", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({ brands: ["Dell", "HP"] }, supabase);
    const query = findInvokedChain(supabase.from, "in");
    expect(query.in).toHaveBeenCalledWith("brand", ["Dell", "HP"]);
  });

  it("maxPrice filtra con .lte sobre price", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({ maxPrice: 10000 }, supabase);
    const query = findInvokedChain(supabase.from, "lte");
    expect(query.lte).toHaveBeenCalledWith("price", 10000);
  });

  it("condition filtra por igualdad exacta", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({ condition: "usado" }, supabase);
    const query = findInvokedChain(supabase.from, "eq");
    expect(query.eq).toHaveBeenCalledWith("condition", "usado");
  });

  it("sort price_asc ordena ascendente por price", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({ sort: "price_asc" }, supabase);
    const query = findInvokedChain(supabase.from, "order");
    expect(query.order).toHaveBeenCalledWith("price", { ascending: true });
  });

  it("sort price_desc ordena descendente por price", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({ sort: "price_desc" }, supabase);
    const query = findInvokedChain(supabase.from, "order");
    expect(query.order).toHaveBeenCalledWith("price", { ascending: false });
  });

  it("sin sort explícito (o 'recent') ordena por created_at descendente", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: [], count: 0 } } });
    await listActiveProducts({}, supabase);
    const query = findInvokedChain(supabase.from, "order");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("sort rating_desc ordena en memoria por average_rating (PostgREST no puede ordenar por un agregado)", async () => {
    const rows = [
      { ...baseRow, id: "low", reviews: [{ rating: 2 }] },
      { ...baseRow, id: "high", reviews: [{ rating: 5 }] },
      { ...baseRow, id: "mid", reviews: [{ rating: 3 }] },
    ];
    const supabase = createSupabaseMock({ tables: { products: { data: rows } } });
    const result = await listActiveProducts({ sort: "rating_desc" }, supabase);
    expect(result.items.map((p) => p.id)).toEqual(["high", "mid", "low"]);
  });
});

describe("getProductById", () => {
  it("devuelve null si no existe", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: null } } });
    expect(await getProductById("p1", supabase)).toBeNull();
  });

  it("incluye images ordenadas por position además de los campos de Product", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: baseRow } } });
    const product = await getProductById("p1", supabase);
    expect(product?.images.map((i) => i.position)).toEqual([0, 1]);
  });
});

describe("getProductImages", () => {
  it("devuelve las imágenes ordenadas por position", async () => {
    const supabase = createSupabaseMock({
      tables: { product_images: { data: [{ id: "i1", position: 0 }, { id: "i2", position: 1 }] } },
    });
    const images = await getProductImages("p1", supabase);
    expect(images).toHaveLength(2);
  });

  it("propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { product_images: { data: null, error: { message: "falló" } } } });
    await expect(getProductImages("p1", supabase)).rejects.toEqual({ message: "falló" });
  });
});

describe("listPriceDrops", () => {
  it("ordena por % de descuento descendente y descarta los que no tienen previous_price > price", async () => {
    const rows = [
      { ...baseRow, id: "small", price: "90.00", previous_price: "100.00" }, // 10%
      { ...baseRow, id: "big", price: "50.00", previous_price: "100.00" }, // 50%
      { ...baseRow, id: "no-drop", price: "100.00", previous_price: "90.00" }, // previous < price: no es un drop real
    ];
    const supabase = createSupabaseMock({ tables: { products: { data: rows } } });

    const result = await listPriceDrops(5, supabase);

    expect(result.map((p) => p.id)).toEqual(["big", "small"]);
  });

  it("respeta el límite", async () => {
    const rows = [
      { ...baseRow, id: "a", price: "50.00", previous_price: "100.00" },
      { ...baseRow, id: "b", price: "60.00", previous_price: "100.00" },
    ];
    const supabase = createSupabaseMock({ tables: { products: { data: rows } } });
    expect(await listPriceDrops(1, supabase)).toHaveLength(1);
  });
});

describe("listTopReviewed", () => {
  it("descarta productos sin reseñas y ordena por rating promedio descendente", async () => {
    const rows = [
      { ...baseRow, id: "sin-reseñas", reviews: [] },
      { ...baseRow, id: "bajo", reviews: [{ rating: 2 }] },
      { ...baseRow, id: "alto", reviews: [{ rating: 5 }] },
    ];
    const supabase = createSupabaseMock({ tables: { products: { data: rows } } });

    const result = await listTopReviewed(5, supabase);

    expect(result.map((p) => p.id)).toEqual(["alto", "bajo"]);
  });
});

describe("registerView", () => {
  it("inserta la vista con product_id y user_id", async () => {
    const supabase = createSupabaseMock({ tables: { product_views: { data: null, error: null } } });
    await registerView("p1", "u1", supabase);
    const inserted = findInvokedChain(supabase.from, "insert");
    expect(inserted.insert).toHaveBeenCalledWith({ product_id: "p1", user_id: "u1" });
  });

  it("propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { product_views: { data: null, error: { message: "falló" } } } });
    await expect(registerView("p1", "u1", supabase)).rejects.toEqual({ message: "falló" });
  });
});

describe("listBrandCounts", () => {
  it("cuenta ocurrencias por marca entre productos activos, ignorando brand null", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: {
          data: [{ brand: "Dell" }, { brand: "Dell" }, { brand: "HP" }, { brand: null }],
        },
      },
    });

    const counts = await listBrandCounts(supabase);

    expect(counts).toEqual([
      { brand: "Dell", count: 2 },
      { brand: "HP", count: 1 },
    ]);
  });
});
