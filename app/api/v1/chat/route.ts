import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ask } from "@/services/chat.service";
import { apiError } from "@/lib/api-response";
import { getErrorMessage } from "@/lib/utils";
import { CHAT_QUERY_MAX_CHARS } from "@/lib/constants/ai";
import type { ChatMode } from "@/types/chat";

const VALID_MODES: ChatMode[] = ["compras", "soporte"];

// Cliente de SESIÓN (no admin): la búsqueda debe respetar la RLS de
// knowledge_embeddings (decisión 1 — la IA exige sesión).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError(401, "unauthorized", "Debes iniciar sesión para usar el asistente.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "invalid_json", "El body debe ser JSON válido.");
  }

  const { query, mode } = (body ?? {}) as { query?: unknown; mode?: unknown };
  if (typeof query !== "string" || !query.trim()) {
    return apiError(400, "invalid_query", "query es obligatorio.");
  }
  if (query.length > CHAT_QUERY_MAX_CHARS) {
    return apiError(400, "query_too_long", `query no puede superar ${CHAT_QUERY_MAX_CHARS} caracteres.`);
  }
  if (typeof mode !== "string" || !VALID_MODES.includes(mode as ChatMode)) {
    return apiError(422, "invalid_mode", "mode debe ser 'compras' o 'soporte'.");
  }

  try {
    const result = await ask(query, mode as ChatMode, supabase);
    console.log(
      `[chat] mode=${mode} retrievedCount=${result.metadata.retrievedCount} usedSourceCount=${result.metadata.usedSourceCount} hasRelevantContext=${result.hasRelevantContext}`,
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiError(500, "chat_failed", getErrorMessage(error, "No se pudo procesar tu consulta."));
  }
}
