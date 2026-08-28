"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Price } from "@/components/shared/Price";
import type { SellerOrderView } from "@/types/order";

interface OrderKanbanCardProps {
  order: SellerOrderView;
}

export function OrderKanbanCard({ order }: OrderKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { status: order.status },
  });

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }}
      className="cursor-grab touch-none py-3 active:cursor-grabbing"
      role="button"
      tabIndex={0}
      aria-roledescription="pedido arrastrable"
      aria-label={`Pedido ${order.id.slice(0, 8)}, ${order.myItems.length} ${order.myItems.length === 1 ? "producto" : "productos"}`}
    >
      <CardContent className="space-y-1 px-3">
        <p className="text-sm font-medium">Pedido #{order.id.slice(0, 8)}</p>
        <p className="text-xs text-muted-foreground">
          {order.myItems.length} {order.myItems.length === 1 ? "producto" : "productos"}
        </p>
        <Price value={order.myTotal} className="text-sm" />
      </CardContent>
    </Card>
  );
}
