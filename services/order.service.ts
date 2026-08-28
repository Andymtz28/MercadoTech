import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Order, OrderItem, OrderWithItems, SellerOrderView } from "@/types/order";
import type { OrderStatus } from "@/lib/constants/roles";

type Client = SupabaseClient<Database>;
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

function mapOrder(row: OrderRow): Order {
  return { ...row, status: row.status as OrderStatus, total: Number(row.total) };
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return { ...row, price_snapshot: Number(row.price_snapshot) };
}

export async function listOrders(userId: string, supabase: Client = createClient()): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function getOrderById(
  orderId: string,
  supabase: Client = createClient(),
): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { order_items, ...orderRow } = data as OrderRow & { order_items: OrderItemRow[] };
  return { ...mapOrder(orderRow), items: order_items.map(mapOrderItem) };
}

// Filtra por status='pendiente': si ya cambió de estado, 0 filas afectadas
// y la RLS (orders_buyer_cancel) tampoco lo permitiría de todos modos.
export async function cancelIfPending(orderId: string, supabase: Client = createClient()) {
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelado" })
    .eq("id", orderId)
    .eq("status", "pendiente");
  if (error) throw error;
}

interface SellerOrderItemRow extends OrderItemRow {
  orders: { id: string; status: string; created_at: string; buyer_id: string };
}

// El vendedor solo ve SUS ítems y el total de esos ítems, no orders.total
// (que puede incluir productos de otros vendedores en pedidos multi-vendedor).
export async function listSellerOrders(
  sellerId: string,
  supabase: Client = createClient(),
): Promise<SellerOrderView[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("*, orders!inner(id, status, created_at, buyer_id)")
    .eq("seller_id", sellerId);
  if (error) throw error;

  const rows = (data ?? []) as unknown as SellerOrderItemRow[];
  const byOrder = new Map<string, SellerOrderView>();

  for (const row of rows) {
    const { orders: order, ...itemRow } = row;
    const item = mapOrderItem(itemRow);
    const existing = byOrder.get(order.id);
    if (existing) {
      existing.myItems.push(item);
      existing.myTotal += item.price_snapshot * item.quantity;
    } else {
      byOrder.set(order.id, {
        id: order.id,
        status: order.status as OrderStatus,
        createdAt: order.created_at,
        buyerId: order.buyer_id,
        myItems: [item],
        myTotal: item.price_snapshot * item.quantity,
      });
    }
  }

  return Array.from(byOrder.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  supabase: Client = createClient(),
) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}
