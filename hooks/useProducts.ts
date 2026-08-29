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

  const { categorySlug, search, sort, page, maxPrice, condition } = filters;
  // Los arrays no son estables entre renders — se serializan para la
  // dependencia del effect y se vuelven a leer del objeto `filters` actual.
  const brandsKey = filters.brands?.join(",") ?? "";

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listActiveProducts({ categorySlug, search, sort, page, maxPrice, condition, brands: filters.brands });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los productos."));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, search, sort, page, maxPrice, condition, brandsKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, total, loading, error, reload };
}
