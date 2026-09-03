"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { getSupportArticleById, type SupportArticle } from "@/services/support.service";

export function useSupportArticle(id: string) {
  const [article, setArticle] = useState<SupportArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getSupportArticleById(id)
      .then((data) => {
        if (active) setArticle(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "No se pudo cargar el artículo."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return { article, loading, error };
}
