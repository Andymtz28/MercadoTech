"use client";

import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSellerOrders } from "@/hooks/useSellerOrders";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { getErrorMessage } from "@/lib/utils";
import type { OrderStatus } from "@/lib/constants/roles";

// dnd-kit (arrastre por teclado y mouse) solo se necesita en esta página —
// sacarlo del bundle común de /vendedor/pedidos (Fase 7.2, medido en
// docs/PERFORMANCE.md).
const OrdersKanban = dynamic(
  () => import("@/components/seller/OrdersKanban").then((m) => m.OrdersKanban),
  { ssr: false, loading: () => <LoadingState message="Cargando tablero…" /> },
);

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const { orders, loading, error, moveOrder, reload } = useSellerOrders(user?.id);

  async function handleMove(orderId: string, from: OrderStatus, to: OrderStatus) {
    try {
      await moveOrder(orderId, from, to);
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo actualizar el pedido."));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      {loading ? (
        <LoadingState message="Cargando pedidos…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState title="Todavía no tienes pedidos" description="Aparecerán aquí cuando alguien compre tus productos." />
      ) : (
        <OrdersKanban orders={orders} onMove={handleMove} />
      )}
    </div>
  );
}
