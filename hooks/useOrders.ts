"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { listOrders } from "@/services/order.service";
import type { Order } from "@/types/order";

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setOrders(await listOrders(userId));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar tus pedidos."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { orders, loading, error, reload };
}
