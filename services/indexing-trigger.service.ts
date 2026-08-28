// Dispara la reindexación desde el navegador SIN bloquear ni romper el
// flujo que lo llama (publicar/editar/borrar un producto). Nunca lanza: si
// falla (Hugging Face caído, red, etc.) solo deja un warn en consola — el
// vendedor no debe enterarse ni ver un toast de error por esto.
export async function triggerReindex(sourceType: "producto" | "articulo_soporte", sourceId: string): Promise<void> {
  try {
    const response = await fetch("/api/v1/reindex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType, sourceId }),
    });
    if (!response.ok) {
      console.warn(`[indexing-trigger] reindex respondió ${response.status} para ${sourceType}/${sourceId}`);
    }
  } catch (error) {
    console.warn(`[indexing-trigger] reindex falló para ${sourceType}/${sourceId}:`, error);
  }
}
