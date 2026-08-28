"use client";

import { useCallback, useEffect, useState } from "react";
import { addFavorite, isFavorite, removeFavorite } from "@/services/favorite.service";

// Favorito de UN producto puntual (usado en BuyBox/ProductInfo). Para la
// lista completa de favoritos ver useFavorites.
export function useFavorite(productId: string, userId?: string) {
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setFavorite(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const value = await isFavorite(productId, userId);
      setFavorite(value);
    } finally {
      setLoading(false);
    }
  }, [productId, userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(async () => {
    if (!userId) throw new Error("Inicia sesión para guardar favoritos.");
    if (favorite) {
      await removeFavorite(productId, userId);
      setFavorite(false);
    } else {
      await addFavorite(productId, userId);
      setFavorite(true);
    }
  }, [favorite, productId, userId]);

  return { favorite, loading, toggle };
}
