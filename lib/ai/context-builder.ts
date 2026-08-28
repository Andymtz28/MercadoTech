import { buildRagUserMessage } from "@/lib/ai/prompts";
import {
  CONTEXT_BUILDER_DEFAULT_MAX_CONTEXT_CHARS,
  CONTEXT_BUILDER_DEFAULT_MAX_SOURCES,
  CONTEXT_BUILDER_DEFAULT_MIN_SIMILARITY,
  CONTEXT_BUILDER_MIN_CONTENT_LENGTH,
  CONTEXT_BUILDER_MIN_TRUNCATED_SOURCE_CHARS,
} from "@/lib/constants/ai";

export interface ContextCandidate {
  sourceType: "producto" | "articulo_soporte";
  sourceId: string;
  title: string;
  content: string;
  similarity: number;
}

export interface ContextSource {
  sourceType: "producto" | "articulo_soporte";
  sourceId: string;
  title: string;
  similarity: number;
}

export interface ContextBuilderOptions {
  maxSources?: number;
  minSimilarity?: number;
  maxContextChars?: number;
  minContentLength?: number;
  minTruncatedSourceChars?: number;
}

export interface ContextBuilderResult {
  userMessage: string;
  sources: ContextSource[];
  stats: { contextTruncated: boolean; totalChars: number };
}

// Función pura: cero red, cero Supabase, cero React. Decide qué fichas
// recuperadas entran de verdad al prompt y en qué orden, sin pasarse del
// presupuesto de caracteres.
export function buildContext(
  query: string,
  candidates: ContextCandidate[],
  opts: ContextBuilderOptions = {},
): ContextBuilderResult {
  const maxSources = opts.maxSources ?? CONTEXT_BUILDER_DEFAULT_MAX_SOURCES;
  const minSimilarity = opts.minSimilarity ?? CONTEXT_BUILDER_DEFAULT_MIN_SIMILARITY;
  const maxContextChars = opts.maxContextChars ?? CONTEXT_BUILDER_DEFAULT_MAX_CONTEXT_CHARS;
  const minContentLength = opts.minContentLength ?? CONTEXT_BUILDER_MIN_CONTENT_LENGTH;
  const minTruncatedSourceChars = opts.minTruncatedSourceChars ?? CONTEXT_BUILDER_MIN_TRUNCATED_SOURCE_CHARS;

  // 1. Selección: umbral de relevancia + contenido con sustancia, más
  // relevante primero, recortado al máximo de fuentes.
  const selected = candidates
    .filter((c) => c.similarity >= minSimilarity && c.content.length >= minContentLength)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxSources);

  // 2. Presupuesto: se acumula contenido hasta el límite de caracteres: si a
  // la fuente que ya no cabe entera le sobra poco espacio, se descarta
  // completa en vez de mandar media frase.
  const budgeted: ContextCandidate[] = [];
  let totalChars = 0;
  let contextTruncated = false;

  for (const candidate of selected) {
    const remaining = maxContextChars - totalChars;
    if (remaining <= 0) {
      contextTruncated = true;
      break;
    }
    if (candidate.content.length <= remaining) {
      budgeted.push(candidate);
      totalChars += candidate.content.length;
    } else {
      contextTruncated = true;
      if (remaining >= minTruncatedSourceChars) {
        const truncatedContent = candidate.content.slice(0, remaining);
        budgeted.push({ ...candidate, content: truncatedContent });
        totalChars += truncatedContent.length;
      }
      break;
    }
  }

  const userMessage = buildRagUserMessage(
    query,
    budgeted.map((source, index) => ({ index: index + 1, content: source.content })),
  );

  const sources: ContextSource[] = budgeted.map((s) => ({
    sourceType: s.sourceType,
    sourceId: s.sourceId,
    title: s.title,
    similarity: s.similarity,
  }));

  return { userMessage, sources, stats: { contextTruncated, totalChars } };
}
