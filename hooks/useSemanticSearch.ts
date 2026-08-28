"use client";

import { useEffect, useState } from "react";
import type { ProductMatch } from "@/services/vector-search.service";
import { getErrorMessage } from "@/lib/utils";

interface ApiErrorBody {
  error?: { message?: string };
}

// `enabled` deja la pestaña IA inactiva hasta que el usuario la abre con
// sesión iniciada — evita quemar cuota de Hugging Face en cada carga de
// /buscar.
export function useSemanticSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/v1/search/semantic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then(async (response) => {
        const body = (await response.json()) as { results?: ProductMatch[] } & ApiErrorBody;
        if (!response.ok) {
          throw new Error(body.error?.message ?? "No se pudo completar la búsqueda inteligente.");
        }
        return body.results ?? [];
      })
      .then((data) => {
        if (active) setResults(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "No se pudo completar la búsqueda inteligente."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, enabled]);

  return { results, loading, error };
}
