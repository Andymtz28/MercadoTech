import type { SupabaseClient } from "@supabase/supabase-js";
import { buildProductEmbeddingText, buildSupportArticleEmbeddingText, generateEmbedding } from "@/lib/ai/embeddings";
import type { Database } from "@/types/database";
import type { ProductCondition } from "@/lib/constants/roles";

type Client = SupabaseClient<Database>;
export type KnowledgeSourceType = "producto" | "articulo_soporte";

// El cliente (normalmente el admin/service role) lo INYECTA el caller
// (Route Handler o script) — este service nunca importa
// lib/supabase/admin.ts, para que siga siendo trivial de testear con un
// cliente falso.

export async function deleteEmbedding(sourceType: KnowledgeSourceType, sourceId: string, supabase: Client) {
  const { error } = await supabase
    .from("knowledge_embeddings")
    .delete()
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);
  if (error) throw error;
}

async function indexProduct(productId: string, supabase: Client): Promise<boolean> {
  const { data: product, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw error;

  if (!product) {
    await deleteEmbedding("producto", productId, supabase);
    return false;
  }

  const categoryName = (product.categories as { name: string } | null)?.name ?? null;
  const content = buildProductEmbeddingText(
    {
      title: product.title,
      brand: product.brand,
      condition: product.condition as ProductCondition,
      description: product.description,
    },
    categoryName,
  );
  const embedding = await generateEmbedding(content);

  const { error: upsertError } = await supabase.from("knowledge_embeddings").upsert(
    {
      source_type: "producto",
      source_id: productId,
      chunk_index: 0,
      content,
      embedding: embedding as unknown as string,
      metadata: { title: product.title, price: Number(product.price), category: categoryName },
    },
    { onConflict: "source_type,source_id,chunk_index" },
  );
  if (upsertError) throw upsertError;
  return true;
}

async function indexSupportArticle(articleId: string, supabase: Client): Promise<boolean> {
  const { data: article, error } = await supabase
    .from("support_articles")
    .select("*")
    .eq("id", articleId)
    .maybeSingle();
  if (error) throw error;

  if (!article) {
    await deleteEmbedding("articulo_soporte", articleId, supabase);
    return false;
  }

  const content = buildSupportArticleEmbeddingText(article);
  const embedding = await generateEmbedding(content);

  const { error: upsertError } = await supabase.from("knowledge_embeddings").upsert(
    {
      source_type: "articulo_soporte",
      source_id: articleId,
      chunk_index: 0,
      content,
      embedding: embedding as unknown as string,
      metadata: { title: article.title, category: article.category },
    },
    { onConflict: "source_type,source_id,chunk_index" },
  );
  if (upsertError) throw upsertError;
  return true;
}

// Orquesta: carga la fuente → arma el texto → genera el embedding → upsert.
// Devuelve false si la fuente ya no existe (y limpia su ficha huérfana en
// vez de indexarla).
export async function indexSource(
  sourceType: KnowledgeSourceType,
  sourceId: string,
  supabase: Client,
): Promise<boolean> {
  if (sourceType === "producto") return indexProduct(sourceId, supabase);
  return indexSupportArticle(sourceId, supabase);
}
