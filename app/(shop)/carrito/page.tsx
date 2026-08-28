"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { getErrorMessage } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  const { user } = useAuth();
  const { items, count, subtotal, loading, error, updateQuantity, remove, checkout, reload } = useCart(user?.id);
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const orderId = await checkout();
      toast.success("Pedido creado");
      router.push(`/pedidos/${orderId}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo completar el checkout."));
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) return <LoadingState message="Cargando carrito…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-2xl font-bold">Carrito</h1>
      {items.length === 0 ? (
        <EmptyState
          title="Tu carrito está vacío"
          description="Agrega productos desde el catálogo."
          actionLabel="Ver catálogo"
          onAction={() => router.push("/")}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQuantityChange={(quantity) => updateQuantity(item.id, quantity)}
                onRemove={() => remove(item.id)}
              />
            ))}
          </div>
          <CartSummary
            subtotal={subtotal}
            itemCount={count}
            onCheckout={handleCheckout}
            checkingOut={checkingOut}
          />
        </div>
      )}
    </Container>
  );
}
