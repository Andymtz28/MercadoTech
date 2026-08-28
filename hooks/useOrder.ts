"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { cancelIfPending, getOrderById } from "@/services/order.service";
import type { OrderWithItems } from "@/types/order";

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await getOrderById(orderId));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el pedido."));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const cancel = useCallback(async () => {
    await cancelIfPending(orderId);
    await reload();
  }, [orderId, reload]);

  return { order, loading, error, cancel, reload };
}
