"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteProduct, listSellerProducts } from "@/services/seller.service";
import { getErrorMessage } from "@/lib/utils";
import type { Product } from "@/types/product";

export function useSellerProducts(sellerId?: string) {
  const supabase = useRef(createClient()).current;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!sellerId) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setProducts(await listSellerProducts(sellerId, supabase));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar tus productos."));
    } finally {
      setLoading(false);
    }
  }, [sellerId, supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = useCallback(
    async (productId: string) => {
      try {
        await deleteProduct(productId, supabase);
        await reload();
      } catch (err) {
        // 23503 = foreign_key_violation: el producto tiene ventas
        // (order_items.product_id es on delete restrict).
        const code = (err as { code?: string } | null)?.code;
        if (code === "23503") {
          throw new Error("Este producto tiene ventas; desactívalo en lugar de eliminarlo.");
        }
        throw err;
      }
    },
    [supabase, reload],
  );

  return { products, loading, error, remove, reload };
}
