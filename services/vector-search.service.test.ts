import { describe, expect, it, vi } from "vitest";
import { searchByEmbedding, searchKnowledge, searchProducts } from "./vector-search.service";
import { createSupabaseMock } from "./test-utils/supabase-mock";
import { VECTOR_SEARCH_DEFAULT_SIMILARITY_THRESHOLD, VECTOR_SEARCH_DEFAULT_TOP_K } from "@/lib/constants/ai";

vi.mock("@/lib/ai/embeddings", () => ({
  generateEmbedding: vi.fn(async () => [0.1, 0.2, 0.3]),
}));

describe("searchByEmbedding", () => {
  it("pasa el embedding, el threshold y el topK por defecto a la RPC", async () => {
    const supabase = createSupabaseMock({ rpc: { match_knowledge: { data: [] } } });

    await searchByEmbedding([0.1, 0.2], "producto", supabase);

    expect(supabase.rpc).toHaveBeenCalledWith("match_knowledge", {
      query_embedding: [0.1, 0.2],
      p_source_type: "producto",
      match_count: VECTOR_SEARCH_DEFAULT_TOP_K,
      similarity_threshold: VECTOR_SEARCH_DEFAULT_SIMILARITY_THRESHOLD,
    });
  });

  it("omite p_source_type cuando sourceType es null (busca en ambas fuentes)", async () => {
    const supabase = createSupabaseMock({ rpc: { match_knowledge: { data: [] } } });
    await searchByEmbedding([0.1], null, supabase);
    const args = supabase.rpc.mock.calls[0][1];
    expect(args).not.toHaveProperty("p_source_type");
  });

  it("respeta matchCount y similarityThreshold personalizados", async () => {
    const supabase = createSupabaseMock({ rpc: { match_knowledge: { data: [] } } });
    await searchByEmbedding([0.1], "producto", supabase, { matchCount: 3, similarityThreshold: 0.5 });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "match_knowledge",
      expect.objectContaining({ match_count: 3, similarity_threshold: 0.5 }),
    );
  });

  it("mapea las filas de la RPC a KnowledgeMatch", async () => {
    const supabase = createSupabaseMock({
      rpc: { match_knowledge: { data: [{ source_type: "producto", source_id: "p1", content: "c", metadata: {}, similarity: 0.8 }] } },
    });
    const matches = await searchByEmbedding([0.1], "producto", supabase);
    expect(matches).toEqual([{ sourceType: "producto", sourceId: "p1", content: "c", metadata: {}, similarity: 0.8 }]);
  });
});

describe("searchKnowledge", () => {
  it("genera el embedding de la consulta y llama a searchByEmbedding", async () => {
    const supabase = createSupabaseMock({ rpc: { match_knowledge: { data: [] } } });
    await searchKnowledge("laptop liviana", "producto", supabase);
    expect(supabase.rpc).toHaveBeenCalledWith("match_knowledge", expect.objectContaining({ query_embedding: [0.1, 0.2, 0.3] }));
  });
});

describe("searchProducts", () => {
  it("sin matches: no consulta products y devuelve []", async () => {
    const supabase = createSupabaseMock({ rpc: { match_knowledge: { data: [] } } });
    const results = await searchProducts("nada relevante", supabase);
    expect(results).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("descarta fichas huérfanas: producto ya inactivo/borrado no aparece en el resultado", async () => {
    const supabase = createSupabaseMock({
      rpc: {
        match_knowledge: {
          data: [
            { source_type: "producto", source_id: "vivo", content: "c", metadata: {}, similarity: 0.9 },
            { source_type: "producto", source_id: "huerfano", content: "c", metadata: {}, similarity: 0.7 },
          ],
        },
      },
      tables: {
        products: {
          // solo "vivo" existe activo — "huerfano" fue borrado/desactivado.
          data: [
            {
              id: "vivo",
              seller_id: "s1",
              category_id: "c1",
              title: "Producto vivo",
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
          ],
        },
      },
    });

    const results = await searchProducts("algo", supabase);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("vivo");
    expect(results[0].similarity).toBe(0.9);
  });
});
