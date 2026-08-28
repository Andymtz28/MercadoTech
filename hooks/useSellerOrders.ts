"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listSellerOrders, updateOrderStatus } from "@/services/order.service";
import { getErrorMessage } from "@/lib/utils";
import { ORDER_STATUS_FLOW } from "@/lib/constants/orders";
import type { OrderStatus } from "@/lib/constants/roles";
import type { SellerOrderView } from "@/types/order";

function canAdvance(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_FLOW.indexOf(to) === ORDER_STATUS_FLOW.indexOf(from) + 1;
}

export function useSellerOrders(sellerId?: string) {
  const supabase = useRef(createClient()).current;
  const [orders, setOrders] = useState<SellerOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!sellerId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setOrders(await listSellerOrders(sellerId, supabase));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar tus pedidos."));
    } finally {
      setLoading(false);
    }
  }, [sellerId, supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Rechaza cualquier transición que no sea un paso adelante en
  // ORDER_STATUS_FLOW SIN llamar al service; con transición válida hace una
  // actualización optimista y revierte con toast si el service falla.
  const moveOrder = useCallback(
    async (orderId: string, from: OrderStatus, to: OrderStatus) => {
      if (!canAdvance(from, to)) return;

      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: to } : order)));
      try {
        await updateOrderStatus(orderId, to, supabase);
      } catch (err) {
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: from } : order)));
        throw err;
      }
    },
    [supabase],
  );

  return { orders, loading, error, moveOrder, reload };
}
