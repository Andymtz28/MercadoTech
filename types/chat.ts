// "analisis": solo disponible para vendedores (verificado por rol en
// app/api/v1/chat/route.ts) — el asistente actúa como analista de datos
// sobre las ventas/productos propios del vendedor, no del marketplace.
export type ChatMode = "compras" | "soporte" | "analisis";

// Solo `price`/`imageUrl` (producto) o `category` (artículo) según
// sourceType — el chat los hidrata para que SourcesList arme el mini-card
// sin tener que volver a pedirle datos al servidor.
export interface ChatSource {
  sourceType: "producto" | "articulo_soporte";
  sourceId: string;
  title: string;
  similarity: number;
  price?: number;
  imageUrl?: string | null;
  category?: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

export interface ChatResult {
  query: string;
  answer: string;
  hasRelevantContext: boolean;
  sources: ChatSource[];
  metadata: {
    model: string;
    retrievedCount: number;
    usedSourceCount: number;
    contextTruncated: boolean;
  };
}
