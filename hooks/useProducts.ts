"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import { listActiveProducts } from "@/services/product.service";
import type { Product, ProductFilters } from "@/types/product";

export function useProducts(filters: ProductFilters) {
  const supabase = useRef(createClient()).current;
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { categorySlug, search, sort, page } = filters;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listActiveProducts({ categorySlug, search, sort, page }, supabase);
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los productos."));
    } finally {
      setLoading(false);
    }
  }, [categorySlug, search, sort, page, supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, total, loading, error, reload };
}
