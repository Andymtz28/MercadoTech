"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { listFavoriteProducts } from "@/services/favorite.service";
import type { Product } from "@/types/product";

// Lista completa de productos favoritos del usuario (página /favoritos).
export function useFavorites(userId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listFavoriteProducts(userId);
      setProducts(data);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar tus favoritos."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { products, loading, error, reload };
}
