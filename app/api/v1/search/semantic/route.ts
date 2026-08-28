import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchProducts } from "@/services/vector-search.service";
import { apiError } from "@/lib/api-response";
import { getErrorMessage } from "@/lib/utils";
import { CHAT_QUERY_MAX_CHARS } from "@/lib/constants/ai";

// Cliente de SESIÓN (no admin): la RLS de knowledge_embeddings exige
// `authenticated` (decisión 1) y aquí es donde se aplica. El embedding de
// la consulta se genera server-side — el token de Hugging Face nunca viaja
// al navegador.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError(401, "unauthorized", "Debes iniciar sesión para usar la búsqueda inteligente.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "invalid_json", "El body debe ser JSON válido.");
  }

  const { query } = (body ?? {}) as { query?: unknown };
  if (typeof query !== "string" || !query.trim()) {
    return apiError(400, "invalid_query", "query es obligatorio.");
  }
  if (query.length > CHAT_QUERY_MAX_CHARS) {
    return apiError(400, "query_too_long", `query no puede superar ${CHAT_QUERY_MAX_CHARS} caracteres.`);
  }

  try {
    const results = await searchProducts(query, supabase);
    return NextResponse.json({ results });
  } catch (error) {
    return apiError(500, "semantic_search_failed", getErrorMessage(error, "No se pudo completar la búsqueda inteligente."));
  }
}
