import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Price } from "@/components/shared/Price";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { Order } from "@/types/order";

interface OrderCardProps {
  order: Order;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={`/pedidos/${order.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Pedido #{order.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-4">
            <Price value={order.total} />
            <OrderStatusBadge status={order.status} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
