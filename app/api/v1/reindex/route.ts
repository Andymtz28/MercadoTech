import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { indexSource, type KnowledgeSourceType } from "@/services/embedding.service";
import { apiError } from "@/lib/api-response";
import { getErrorMessage } from "@/lib/utils";

// Server-only: solo aquí y en scripts/index-all.ts se usa el cliente admin.
// Si la fuente ya no existe (producto borrado), indexSource limpia su ficha
// en vez de fallar.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError(401, "unauthorized", "Debes iniciar sesión.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "invalid_json", "El body debe ser JSON válido.");
  }

  const { sourceType, sourceId } = (body ?? {}) as { sourceType?: unknown; sourceId?: unknown };
  if (sourceType !== "producto" && sourceType !== "articulo_soporte") {
    return apiError(400, "invalid_source_type", "sourceType debe ser 'producto' o 'articulo_soporte'.");
  }
  if (typeof sourceId !== "string" || !sourceId) {
    return apiError(400, "invalid_source_id", "sourceId es obligatorio.");
  }

  try {
    const admin = createAdminClient();
    const indexed = await indexSource(sourceType as KnowledgeSourceType, sourceId, admin);
    return NextResponse.json({ indexed });
  } catch (error) {
    return apiError(500, "reindex_failed", getErrorMessage(error, "No se pudo reindexar la fuente."));
  }
}
