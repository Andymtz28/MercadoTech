"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderCard } from "@/components/orders/OrderCard";

export default function OrdersPage() {
  const { user } = useAuth();
  const { orders, loading, error, reload } = useOrders(user?.id);
  const router = useRouter();

  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-2xl font-bold">Mis pedidos</h1>
      {loading ? (
        <LoadingState message="Cargando pedidos…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Todavía no tienes pedidos"
          description="Tus compras aparecerán aquí."
          actionLabel="Ver catálogo"
          onAction={() => router.push("/")}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </Container>
  );
}
