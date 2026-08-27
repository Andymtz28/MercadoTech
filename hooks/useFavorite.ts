"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addFavorite, isFavorite, removeFavorite } from "@/services/favorite.service";

// Favorito de UN producto puntual (usado en BuyBox/ProductInfo). Para la
// lista completa de favoritos ver useFavorites.
export function useFavorite(productId: string, userId?: string) {
  const supabase = useRef(createClient()).current;
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
      const value = await isFavorite(productId, userId, supabase);
      setFavorite(value);
    } finally {
      setLoading(false);
    }
  }, [productId, userId, supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(async () => {
    if (!userId) throw new Error("Inicia sesión para guardar favoritos.");
    if (favorite) {
      await removeFavorite(productId, userId, supabase);
      setFavorite(false);
    } else {
      await addFavorite(productId, userId, supabase);
      setFavorite(true);
    }
  }, [favorite, productId, userId, supabase]);

  return { favorite, loading, toggle };
}
