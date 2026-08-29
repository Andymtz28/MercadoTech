"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { listTopReviewed } from "@/services/product.service";
import type { Product } from "@/types/product";

export function useTopReviewed(limit: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listTopReviewed(limit)
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "No se pudieron cargar las reseñas."));
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
