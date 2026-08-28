"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteProduct, listSellerProducts } from "@/services/seller.service";
import { triggerReindex } from "@/services/indexing-trigger.service";
import { getErrorMessage } from "@/lib/utils";
import type { Product } from "@/types/product";

export function useSellerProducts(sellerId?: string) {
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
      setProducts(await listSellerProducts(sellerId));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar tus productos."));
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = useCallback(
    async (productId: string) => {
      try {
        await deleteProduct(productId);
        triggerReindex("producto", productId);
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
    [reload],
  );

  return { products, loading, error, remove, reload };
}
