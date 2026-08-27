"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useOrder } from "@/hooks/useOrder";
import { getErrorMessage } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderItemsTable } from "@/components/orders/OrderItemsTable";
import { Price } from "@/components/shared/Price";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, error, cancel, reload } = useOrder(id);
  const [cancelling, setCancelling] = useState(false);

  if (loading) return <LoadingState message="Cargando pedido…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!order) return <ErrorState message="No encontramos este pedido, o no tienes acceso a él." />;

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancel();
      toast.success("Pedido cancelado");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo cancelar el pedido."));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Container className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderItemsTable items={order.items} />

      <div className="flex items-center justify-between border-t pt-4">
        <span className="font-medium">Total</span>
        <Price value={order.total} className="text-lg" />
      </div>

      {order.status === "pendiente" && (
        <Dialog>
          <DialogTrigger render={<Button variant="destructive">Cancelar pedido</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Cancelar este pedido?</DialogTitle>
              <DialogDescription>El stock no se repone automáticamente.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Volver</Button>} />
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? "Cancelando…" : "Sí, cancelar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );
}
