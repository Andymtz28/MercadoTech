"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import { getProductById } from "@/services/product.service";
import type { ProductWithImages } from "@/types/product";

export function useProduct(id: string) {
  const supabase = useRef(createClient()).current;
  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductById(id, supabase);
      setProduct(data);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el producto."));
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { product, loading, error, reload };
}
