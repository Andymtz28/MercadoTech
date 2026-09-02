import { describe, expect, it, vi } from "vitest";
import { deleteEmbedding, indexSource } from "./embedding.service";
import { createSupabaseMock, findInvokedChain } from "./test-utils/supabase-mock";

// Excepción de dos niveles (Sesión 6, decisión 7): el cliente Supabase se
// INYECTA siempre; lib/ai/* (no inyectable, diseño de la Sesión 4) se
// mockea con vi.mock de módulo — es la única excepción de esta suite.
vi.mock("@/lib/ai/embeddings", () => ({
  generateEmbedding: vi.fn(async () => [0.1, 0.2, 0.3]),
  buildProductEmbeddingText: vi.fn(() => "texto de producto armado"),
  buildSupportArticleEmbeddingText: vi.fn(() => "texto de artículo armado"),
}));

describe("indexSource — producto", () => {
  it("producto inexistente: limpia la ficha huérfana y devuelve false", async () => {
    const supabase = createSupabaseMock({ tables: { products: { data: null } } });

    const result = await indexSource("producto", "p1", supabase);

    expect(result).toBe(false);
    const deleted = findInvokedChain(supabase.from, "delete");
    expect(deleted.delete).toHaveBeenCalled();
    expect(deleted.eq).toHaveBeenCalledWith("source_type", "producto");
    expect(deleted.eq).toHaveBeenCalledWith("source_id", "p1");
  });

  it("producto existente: arma el texto, genera el embedding y hace upsert", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: {
          data: { title: "Laptop", brand: "Dell", condition: "nuevo", description: "d", price: "999.00", categories: { name: "Laptops" } },
        },
      },
    });

    const result = await indexSource("producto", "p1", supabase);

    expect(result).toBe(true);
    const upserted = findInvokedChain(supabase.from, "upsert");
    expect(upserted.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: "producto",
        source_id: "p1",
        chunk_index: 0,
        content: "texto de producto armado",
        embedding: [0.1, 0.2, 0.3],
      }),
      { onConflict: "source_type,source_id,chunk_index" },
    );
  });

  it("el error del proveedor de embeddings se propaga", async () => {
    const { generateEmbedding } = await import("@/lib/ai/embeddings");
    vi.mocked(generateEmbedding).mockRejectedValueOnce(new Error("Hugging Face rechazó el token (401)"));

    const supabase = createSupabaseMock({
      tables: { products: { data: { title: "Laptop", brand: null, condition: "nuevo", description: null, categories: null } } },
    });

    await expect(indexSource("producto", "p1", supabase)).rejects.toThrow("Hugging Face rechazó el token (401)");
  });
});

describe("indexSource — artículo de soporte", () => {
  it("artículo existente: hace upsert con source_type articulo_soporte", async () => {
    const supabase = createSupabaseMock({
      tables: { support_articles: { data: { title: "Devoluciones", category: "Pedidos", content: "..." } } },
    });

    const result = await indexSource("articulo_soporte", "a1", supabase);

    expect(result).toBe(true);
    const upserted = findInvokedChain(supabase.from, "upsert");
    expect(upserted.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ source_type: "articulo_soporte", source_id: "a1" }),
      { onConflict: "source_type,source_id,chunk_index" },
    );
  });

  it("artículo inexistente: devuelve false sin generar embedding", async () => {
    const supabase = createSupabaseMock({ tables: { support_articles: { data: null } } });
    expect(await indexSource("articulo_soporte", "a1", supabase)).toBe(false);
  });
});

describe("deleteEmbedding", () => {
  it("propaga el error del delete", async () => {
    const supabase = createSupabaseMock({
      tables: { knowledge_embeddings: { data: null, error: { message: "falló" } } },
    });
    await expect(deleteEmbedding("producto", "p1", supabase)).rejects.toEqual({ message: "falló" });
  });
});
