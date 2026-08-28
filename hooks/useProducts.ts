"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { listActiveProducts } from "@/services/product.service";
import type { Product, ProductFilters } from "@/types/product";

export function useProducts(filters: ProductFilters) {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { categorySlug, search, sort, page } = filters;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listActiveProducts({ categorySlug, search, sort, page });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los productos."));
    } finally {
      setLoading(false);
    }
  }, [categorySlug, search, sort, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, total, loading, error, reload };
}
