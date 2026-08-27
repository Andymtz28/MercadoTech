"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import { addItem, checkout, listCartItems, removeItem, updateQuantity } from "@/services/cart.service";
import type { CartItemWithProduct } from "@/types/cart";

export function useCart(userId?: string) {
  const supabase = useRef(createClient()).current;
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setItems(await listCartItems(userId, supabase));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el carrito."));
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (productId: string, quantity = 1) => {
      if (!userId) throw new Error("Inicia sesión para agregar productos al carrito.");
      await addItem(userId, productId, quantity, supabase);
      await reload();
    },
    [userId, supabase, reload],
  );

  const changeQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      await updateQuantity(cartItemId, quantity, supabase);
      await reload();
    },
    [supabase, reload],
  );

  const remove = useCallback(
    async (cartItemId: string) => {
      await removeItem(cartItemId, supabase);
      await reload();
    },
    [supabase, reload],
  );

  // Tras error el carrito se recarga (el stock pudo cambiar); tras éxito
  // también, aunque la RPC ya lo vació — mantiene el hook como única fuente
  // de verdad del estado del carrito.
  const runCheckout = useCallback(async () => {
    if (!userId) throw new Error("Inicia sesión para comprar.");
    try {
      const orderId = await checkout(userId, supabase);
      await reload();
      return orderId;
    } catch (err) {
      await reload();
      throw err;
    }
  }, [userId, supabase, reload]);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.product ? item.product.price * item.quantity : 0), 0),
    [items],
  );

  return {
    items,
    count,
    subtotal,
    loading,
    error,
    add,
    updateQuantity: changeQuantity,
    remove,
    checkout: runCheckout,
    reload,
  };
}
