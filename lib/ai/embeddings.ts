import { InferenceClient } from "@huggingface/inference";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL_DEFAULT, MAX_EMBEDDING_INPUT_CHARS } from "@/lib/constants/ai";
import type { ProductCondition } from "@/lib/constants/roles";

// Único lugar del proyecto que conoce @huggingface/inference. Los
// embeddings se generan SOLO con el SDK oficial (featureExtraction):
// Hugging Face documenta que feature-extraction no está disponible en su
// router OpenAI-compatible, un fetch directo ahí falla.
function getClient(): InferenceClient {
  const token = process.env.HUGGINGFACEHUB_API_TOKEN;
  if (!token) {
    throw new Error("HUGGINGFACEHUB_API_TOKEN no está configurada.");
  }
  return new InferenceClient(token);
}

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getClient();
  const model = process.env.HUGGINGFACE_EMBEDDING_MODEL || EMBEDDING_MODEL_DEFAULT;

  let result: unknown;
  try {
    result = await client.featureExtraction({ model, inputs: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
      throw new Error("Hugging Face rechazó el token (401): revisa HUGGINGFACEHUB_API_TOKEN.");
    }
    throw new Error(`No se pudo generar el embedding: ${message}`);
  }

  // all-MiniLM-L6-v2 devuelve un vector plano de 384 números; otros modelos
  // devuelven una matriz por token (number[][]). Se valida la forma exacta
  // en vez de asumirla — mejor un error claro que una fila corrupta.
  if (!Array.isArray(result) || result.some((value) => typeof value !== "number")) {
    throw new Error("Respuesta de embedding inválida: se esperaba un vector numérico plano.");
  }
  if (result.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Respuesta de embedding con dimensión inesperada: ${result.length} (se esperaban ${EMBEDDING_DIMENSIONS}).`,
    );
  }

  return result as number[];
}

interface ProductForEmbedding {
  title: string;
  brand: string | null;
  condition: ProductCondition;
  description: string | null;
}

// Secciones etiquetadas en orden de mayor a menor densidad semántica —
// título/marca/categoría/condición primero, la descripción (potencialmente
// larga) al final, truncada a MAX_EMBEDDING_INPUT_CHARS: si algo se corta,
// se corta lo menos importante.
export function buildProductEmbeddingText(product: ProductForEmbedding, categoryName: string | null): string {
  const lines = [
    `Título: ${product.title}`,
    product.brand ? `Marca: ${product.brand}` : null,
    categoryName ? `Categoría: ${categoryName}` : null,
    `Condición: ${product.condition}`,
    product.description ? `Descripción: ${product.description}` : null,
  ].filter((line): line is string => line !== null);

  return truncate(lines.join("\n"), MAX_EMBEDDING_INPUT_CHARS);
}

interface SupportArticleForEmbedding {
  title: string;
  category: string | null;
  content: string;
}

export function buildSupportArticleEmbeddingText(article: SupportArticleForEmbedding): string {
  const lines = [
    `Título: ${article.title}`,
    article.category ? `Categoría: ${article.category}` : null,
    `Contenido: ${article.content}`,
  ].filter((line): line is string => line !== null);

  return truncate(lines.join("\n"), MAX_EMBEDDING_INPUT_CHARS);
}
