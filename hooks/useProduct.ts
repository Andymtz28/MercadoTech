"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { getProductById } from "@/services/product.service";
import type { ProductWithImages } from "@/types/product";

export function useProduct(id: string) {
  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el producto."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { product, loading, error, reload };
}
