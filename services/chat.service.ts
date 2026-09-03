import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCompletion } from "@/lib/ai/completion";
import { ANALYST_SYSTEM_INSTRUCTIONS, SHOPPING_SYSTEM_INSTRUCTIONS, SUPPORT_SYSTEM_INSTRUCTIONS, buildAnalystUserMessage } from "@/lib/ai/prompts";
import { buildContext, type ContextCandidate } from "@/lib/ai/context-builder";
import { formatAnalyticsSummary } from "@/lib/ai/analytics-formatter";
import { searchKnowledge } from "@/services/vector-search.service";
import { getProductById } from "@/services/product.service";
import { getSellerAnalyticsSummary } from "@/services/analytics.service";
import type { Database } from "@/types/database";
import type { ChatMode, ChatResult, ChatSource } from "@/types/chat";

type Client = SupabaseClient<Database>;

interface KnowledgeMetadata {
  title?: string;
  category?: string | null;
}

// El modo "análisis" no busca en knowledge_embeddings: el "contexto" es un
// resumen ya calculado de los datos reales del propio vendedor. userId es
// obligatorio para ese modo (verificado por el caller — route.ts ya
// resolvió y validó el rol antes de llamar aquí).
async function askAnalyst(query: string, userId: string, supabase: Client): Promise<ChatResult> {
  const summary = await getSellerAnalyticsSummary(userId, supabase);
  const summaryText = formatAnalyticsSummary(summary);
  const userMessage = buildAnalystUserMessage(query, summaryText);
  const completion = await generateCompletion(ANALYST_SYSTEM_INSTRUCTIONS, userMessage);

  return {
    query,
    answer: completion.text,
    hasRelevantContext: true,
    sources: [],
    metadata: {
      model: completion.model,
      retrievedCount: 0,
      usedSourceCount: 0,
      contextTruncated: false,
    },
  };
}

// Orquesta compra/soporte SIN reimplementar nada propio: vector-search hace
// la búsqueda (filtrada por source_type según el modo), context-builder
// decide qué entra al prompt, y lib/ai/completion redacta la respuesta.
export async function ask(query: string, mode: ChatMode, supabase: Client, userId: string): Promise<ChatResult> {
  if (mode === "analisis") return askAnalyst(query, userId, supabase);

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
