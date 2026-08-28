import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCompletion } from "@/lib/ai/completion";
import { SHOPPING_SYSTEM_INSTRUCTIONS, SUPPORT_SYSTEM_INSTRUCTIONS } from "@/lib/ai/prompts";
import { buildContext, type ContextCandidate } from "@/lib/ai/context-builder";
import { searchKnowledge } from "@/services/vector-search.service";
import { getProductById } from "@/services/product.service";
import type { Database } from "@/types/database";
import type { ChatMode, ChatResult, ChatSource } from "@/types/chat";

type Client = SupabaseClient<Database>;

interface KnowledgeMetadata {
  title?: string;
  category?: string | null;
}

// Orquesta compra/soporte SIN reimplementar nada propio: vector-search hace
// la búsqueda (filtrada por source_type según el modo), context-builder
// decide qué entra al prompt, y lib/ai/completion redacta la respuesta.
export async function ask(query: string, mode: ChatMode, supabase: Client): Promise<ChatResult> {
  const sourceType = mode === "compras" ? "producto" : "articulo_soporte";
  const systemInstructions = mode === "compras" ? SHOPPING_SYSTEM_INSTRUCTIONS : SUPPORT_SYSTEM_INSTRUCTIONS;

  const matches = await searchKnowledge(query, sourceType, supabase);

  const candidates: ContextCandidate[] = matches.map((match) => ({
    sourceType: match.sourceType,
    sourceId: match.sourceId,
    title: (match.metadata as KnowledgeMetadata | null)?.title ?? "Sin título",
    content: match.content,
    similarity: match.similarity,
  }));

  const { userMessage, sources, stats } = buildContext(query, candidates);
  const completion = await generateCompletion(systemInstructions, userMessage);

  // Hidratación de las fuentes que sobrevivieron al contexto (máximo
  // maxSources, no todo lo recuperado): producto → precio/imagen actuales;
  // artículo → categoría, ya denormalizada en la ficha desde la indexación.
  const hydratedSources: ChatSource[] = await Promise.all(
    sources.map(async (source) => {
      if (source.sourceType !== "producto") {
        const metadata = matches.find((m) => m.sourceId === source.sourceId)?.metadata as KnowledgeMetadata | null;
        return { ...source, category: metadata?.category ?? null };
      }
      const product = await getProductById(source.sourceId, supabase);
      if (!product) return source; // huérfano: se cita sin datos de producto vivo
      return { ...source, price: product.price, imageUrl: product.image_url };
    }),
  );

  return {
    query,
    answer: completion.text,
    hasRelevantContext: sources.length > 0,
    sources: hydratedSources,
    metadata: {
      model: completion.model,
      retrievedCount: matches.length,
      usedSourceCount: sources.length,
      contextTruncated: stats.contextTruncated,
    },
  };
}
