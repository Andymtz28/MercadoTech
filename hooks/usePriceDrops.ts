"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { listPriceDrops } from "@/services/product.service";
import type { Product } from "@/types/product";

export function usePriceDrops(limit: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPriceDrops(limit)
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "No se pudieron cargar las bajadas de precio."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [limit]);

  return { products, loading, error };
}
