import type { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { mapProductRow, PRODUCT_WITH_RELATIONS_SELECT, type ProductRowWithRelations } from "@/services/product.service";
import { VECTOR_SEARCH_DEFAULT_SIMILARITY_THRESHOLD, VECTOR_SEARCH_DEFAULT_TOP_K } from "@/lib/constants/ai";
import type { Database } from "@/types/database";
import type { Product } from "@/types/product";
import type { KnowledgeSourceType } from "@/services/embedding.service";

type Client = SupabaseClient<Database>;

export interface KnowledgeMatch {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  content: string;
  metadata: unknown;
  similarity: number;
}

export interface ProductMatch extends Product {
  similarity: number;
}

interface SearchOptions {
  matchCount?: number;
  similarityThreshold?: number;
}

// El caller pasa el cliente de SESIÓN (nunca el admin): la RLS de
// knowledge_embeddings exige `authenticated` (decisión 1 de la sesión 4).
export async function searchByEmbedding(
  embedding: number[],
  sourceType: KnowledgeSourceType | null,
  supabase: Client,
  opts: SearchOptions = {},
): Promise<KnowledgeMatch[]> {
  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding as unknown as string,
    ...(sourceType ? { p_source_type: sourceType } : {}),
    match_count: opts.matchCount ?? VECTOR_SEARCH_DEFAULT_TOP_K,
    similarity_threshold: opts.similarityThreshold ?? VECTOR_SEARCH_DEFAULT_SIMILARITY_THRESHOLD,
  });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    sourceType: row.source_type as KnowledgeSourceType,
    sourceId: row.source_id,
    content: row.content,
    metadata: row.metadata,
    similarity: row.similarity,
  }));
}

// Embedding de la consulta + matching contra fichas de producto +
// hidratación con products ACTIVOS (precio/imagen actuales, mismas
// convenciones que product.service). Una ficha puede apuntar a un producto
// ya borrado o desactivado (huérfano, sin FK dura) — se descarta en
// silencio en vez de mostrar un resultado roto.
export async function searchProducts(query: string, supabase: Client, opts: SearchOptions = {}): Promise<ProductMatch[]> {
  const embedding = await generateEmbedding(query);
  const matches = await searchByEmbedding(embedding, "producto", supabase, opts);
  if (matches.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_RELATIONS_SELECT)
    .eq("is_active", true)
    .in(
      "id",
      matches.map((m) => m.sourceId),
    );
  if (error) throw error;

  const rows = (data ?? []) as unknown as ProductRowWithRelations[];
  const productById = new Map(rows.map((row) => [row.id, mapProductRow(row, supabase)]));

  return matches
    .map((match) => {
      const product = productById.get(match.sourceId);
      return product ? { ...product, similarity: match.similarity } : null;
    })
    .filter((match): match is ProductMatch => match !== null);
}
