import { describe, expect, it, vi } from "vitest";
import { ask } from "./chat.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";

// Excepción de dos niveles (decisión 7): lib/ai/* se mockea por módulo.
// context-builder es puro y barato — se espía manteniendo su lógica real
// (importOriginal) en vez de reimplementarla en un mock, solo para poder
// verificar el ORDEN de las llamadas.
vi.mock("@/lib/ai/embeddings", () => ({
  generateEmbedding: vi.fn(async () => [0.1, 0.2, 0.3]),
}));
vi.mock("@/lib/ai/completion", () => ({
  generateCompletion: vi.fn(async () => ({ text: "Respuesta mock.", model: "mock-model", stopReason: "stop" })),
}));
vi.mock("@/lib/ai/context-builder", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/context-builder")>();
  return { ...actual, buildContext: vi.fn(actual.buildContext) };
});

const productRow = {
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
  product_images: [{ id: "img1", image_path: "s1/p1/1.jpg", position: 0, product_id: "p1" }],
  reviews: [],
};

const relevantMatch = {
  source_type: "producto",
  source_id: "p1",
  content: "Contenido suficientemente largo para pasar el filtro de longitud mínima del context-builder.",
  metadata: { title: "Laptop ligera", price: 18999, category: "Laptops" },
  similarity: 0.9,
};

describe("ask — orquestación", () => {
  it("llama en el orden búsqueda -> contexto -> completion", async () => {
    const { generateEmbedding } = await import("@/lib/ai/embeddings");
    const { buildContext } = await import("@/lib/ai/context-builder");
    const { generateCompletion } = await import("@/lib/ai/completion");

    const supabase = createSupabaseMock({
      rpc: { match_knowledge: { data: [relevantMatch] } },
      tables: { products: { data: productRow } },
    });

    await ask("laptop liviana para la universidad", "compras", supabase);

    const embOrder = vi.mocked(generateEmbedding).mock.invocationCallOrder[0];
    const ctxOrder = vi.mocked(buildContext).mock.invocationCallOrder[0];
    const compOrder = vi.mocked(generateCompletion).mock.invocationCallOrder[0];
    expect(embOrder).toBeLessThan(ctxOrder);
    expect(ctxOrder).toBeLessThan(compOrder);
  });

  it("modo 'compras' busca en source_type=producto", async () => {
    const supabase = createSupabaseMock({
      rpc: { match_knowledge: { data: [] } },
    });
    await ask("q", "compras", supabase);
    expect(supabase.rpc).toHaveBeenCalledWith("match_knowledge", expect.objectContaining({ p_source_type: "producto" }));
  });

  it("modo 'soporte' busca en source_type=articulo_soporte", async () => {
    const supabase = createSupabaseMock({
      rpc: { match_knowledge: { data: [] } },
    });
    await ask("q", "soporte", supabase);
    expect(supabase.rpc).toHaveBeenCalledWith(
      "match_knowledge",
      expect.objectContaining({ p_source_type: "articulo_soporte" }),
    );
  });

  it("hasRelevantContext=false sin fuentes seleccionadas, pero la completion SE LLAMA igual", async () => {
    const { generateCompletion } = await import("@/lib/ai/completion");
    const supabase = createSupabaseMock({ rpc: { match_knowledge: { data: [] } } });

    const result = await ask("¿venden autos usados?", "compras", supabase);

    expect(result.hasRelevantContext).toBe(false);
    expect(result.sources).toEqual([]);
    expect(generateCompletion).toHaveBeenCalled();
  });

  it("hidrata fuentes de producto con precio e imagen actuales", async () => {
    const supabase = createSupabaseMock({
      rpc: { match_knowledge: { data: [relevantMatch] } },
      tables: { products: { data: productRow } },
    });

    const result = await ask("laptop liviana", "compras", supabase);

    expect(result.sources[0]).toMatchObject({ sourceId: "p1", price: 18999 });
    expect(result.sources[0].imageUrl).toContain("s1/p1/1.jpg");
  });

  it("hidrata fuentes de artículo con la categoría de sus metadatos (sin volver a consultar Supabase)", async () => {
    const supabase = createSupabaseMock({
      rpc: {
        match_knowledge: {
          data: [
            {
              source_type: "articulo_soporte",
              source_id: "a1",
              content: "Contenido suficientemente largo para pasar el filtro de longitud mínima.",
              metadata: { title: "Devoluciones", category: "Pedidos" },
              similarity: 0.8,
            },
          ],
        },
      },
    });

    const result = await ask("¿cómo devuelvo un producto?", "soporte", supabase);

    expect(result.sources[0]).toMatchObject({ sourceId: "a1", category: "Pedidos" });
  });

  it("fuente de producto huérfano (ya borrado): se cita sin datos de producto vivo, no revienta", async () => {
    const supabase = createSupabaseMock({
      rpc: { match_knowledge: { data: [relevantMatch] } },
      tables: { products: { data: null } }, // el producto ya no existe
    });

    const result = await ask("laptop liviana", "compras", supabase);

    expect(result.sources[0]).toEqual({ sourceType: "producto", sourceId: "p1", title: "Laptop ligera", similarity: 0.9 });
  });

  it("metadata refleja retrievedCount, usedSourceCount y contextTruncated reales", async () => {
    const supabase = createSupabaseMock({
      rpc: { match_knowledge: { data: [relevantMatch] } },
      tables: { products: { data: productRow } },
    });

    const result = await ask("laptop liviana", "compras", supabase);

    expect(result.metadata.retrievedCount).toBe(1);
    expect(result.metadata.usedSourceCount).toBe(1);
    expect(result.metadata.contextTruncated).toBe(false);
    expect(result.metadata.model).toBe("mock-model");
  });

  it("el error de generateCompletion se propaga", async () => {
    const { generateCompletion } = await import("@/lib/ai/completion");
    vi.mocked(generateCompletion).mockRejectedValueOnce(new Error("El modelo ya no está disponible"));

    const supabase = createSupabaseMock({ rpc: { match_knowledge: { data: [] } } });

    await expect(ask("q", "compras", supabase)).rejects.toThrow("El modelo ya no está disponible");
  });
});
