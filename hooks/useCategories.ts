"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listCategories } from "@/services/category.service";
import type { Category } from "@/types/category";

export function useCategories() {
  const supabase = useRef(createClient()).current;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCategories(supabase);
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, loading, error, reload };
}
