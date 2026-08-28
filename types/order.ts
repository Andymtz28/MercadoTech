import type { Database } from "@/types/database";
import type { OrderStatus } from "@/lib/constants/roles";

export type OrderItem = Omit<
  Database["public"]["Tables"]["order_items"]["Row"],
  "price_snapshot"
> & {
  price_snapshot: number;
};

export type Order = Omit<
  Database["public"]["Tables"]["orders"]["Row"],
  "status" | "total"
> & {
  status: OrderStatus;
  total: number;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

// Vista de un pedido desde la perspectiva del vendedor (Fase 3.7): solo SUS
// ítems y el total de esos ítems, no el pedido completo (puede ser
// multi-vendedor).
export interface SellerOrderView {
  id: string;
  status: OrderStatus;
  createdAt: string;
  buyerId: string;
  myItems: OrderItem[];
  myTotal: number;
}
