// Roles de usuario (columna profiles.role).
export type UserRole = "buyer" | "seller" | "admin";
export const USER_ROLES: readonly UserRole[] = ["buyer", "seller", "admin"];

// Estados del ciclo de vida de un pedido (orders.status).
export type OrderStatus =
  | "pendiente"
  | "pagado"
  | "enviado"
  | "entregado"
  | "cancelado";
export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pendiente",
  "pagado",
  "enviado",
  "entregado",
  "cancelado",
];

// Estados de un ticket de soporte (support_tickets.status).
export type TicketStatus = "abierto" | "en_proceso" | "resuelto" | "cerrado";
export const TICKET_STATUSES: readonly TicketStatus[] = [
  "abierto",
  "en_proceso",
  "resuelto",
  "cerrado",
];

// Condición física de un producto (products.condition).
export type ProductCondition = "nuevo" | "usado" | "reacondicionado";
export const PRODUCT_CONDITIONS: readonly ProductCondition[] = [
  "nuevo",
  "usado",
  "reacondicionado",
];
