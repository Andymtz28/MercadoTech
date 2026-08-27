import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants/orders";
import type { OrderStatus } from "@/lib/constants/roles";

const VARIANTS: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pendiente: "outline",
  pagado: "secondary",
  enviado: "secondary",
  entregado: "default",
  cancelado: "destructive",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge variant={VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
