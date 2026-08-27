import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Order, OrderItem, OrderWithItems } from "@/types/order";
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
