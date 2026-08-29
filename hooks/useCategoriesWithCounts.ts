"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { listCategoriesWithCounts, type CategoryWithCount } from "@/services/category.service";

export function useCategoriesWithCounts() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listCategoriesWithCounts()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "No se pudieron cargar las categorías."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading, error };
}
