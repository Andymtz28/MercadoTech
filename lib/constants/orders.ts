import type { OrderStatus } from "@/lib/constants/roles";

// Progresión hacia adelante que puede avanzar el vendedor. 'cancelado' es
// una rama aparte (solo el comprador la dispara, y solo desde 'pendiente'),
// no un paso de este flujo — el kanban de la Fase 3.7 lo usa para validar
// transiciones antes de llamar al service.
export const ORDER_STATUS_FLOW: readonly OrderStatus[] = ["pendiente", "pagado", "enviado", "entregado"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
