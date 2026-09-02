"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { OrderKanbanCard } from "@/components/seller/OrderKanbanCard";
import { ORDER_STATUS_LABELS } from "@/lib/constants/orders";
import type { OrderStatus } from "@/lib/constants/roles";
import type { SellerOrderView } from "@/types/order";

const COLUMNS: OrderStatus[] = ["pendiente", "pagado", "enviado", "entregado", "cancelado"];

interface OrdersKanbanProps {
  orders: SellerOrderView[];
  onMove: (orderId: string, from: OrderStatus, to: OrderStatus) => void;
}

function Column({ status, orders }: { status: OrderStatus; orders: SellerOrderView[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: status === "cancelado" });

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-column-${status}`}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border p-3 ${isOver ? "bg-muted" : ""}`}
    >
      <p className="text-sm font-semibold">
        {ORDER_STATUS_LABELS[status]} <span className="text-muted-foreground">({orders.length})</span>
      </p>
      <div className="flex flex-col gap-2">
        {orders.map((order) => (
          <OrderKanbanCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

export function OrdersKanban({ orders, onMove }: OrdersKanbanProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const from = active.data.current?.status as OrderStatus | undefined;
    const to = over.id as OrderStatus;
    if (!from || from === to) return;
    onMove(active.id as string, from, to);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" aria-label="Tablero de pedidos">
        {COLUMNS.map((status) => (
          <Column key={status} status={status} orders={orders.filter((order) => order.status === status)} />
        ))}
      </div>
    </DndContext>
  );
}
