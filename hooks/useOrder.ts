"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import { cancelIfPending, getOrderById } from "@/services/order.service";
import type { OrderWithItems } from "@/types/order";

export function useOrder(orderId: string) {
  const supabase = useRef(createClient()).current;
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await getOrderById(orderId, supabase));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el pedido."));
    } finally {
      setLoading(false);
    }
  }, [orderId, supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const cancel = useCallback(async () => {
    await cancelIfPending(orderId, supabase);
    await reload();
  }, [orderId, supabase, reload]);

  return { order, loading, error, cancel, reload };
}
