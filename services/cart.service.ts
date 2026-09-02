import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/services/storage.service";
import type { Database } from "@/types/database";
import type { CartItemWithProduct } from "@/types/cart";

type Client = SupabaseClient<Database>;

// Sincroniza las instancias de useCart montadas a la vez (navbar, /carrito,
// /producto/[id], /buscar): cada una llama a su propio createClient() y
// mantiene estado local, así que sin este broadcast una mutación en una
// página no se reflejaba en el contador del navbar hasta recargar — no hay
// Realtime de Postgres en cart_items, así que se notifica a nivel de módulo,
// igual que subscribeToAuthChanges pero sin pasar por el SDK de Supabase.
type CartChangeListener = () => void;
const cartChangeListeners = new Set<CartChangeListener>();

export function subscribeToCartChanges(onChange: CartChangeListener): () => void {
  cartChangeListeners.add(onChange);
  return () => cartChangeListeners.delete(onChange);
}

function notifyCartChanged() {
  cartChangeListeners.forEach((listener) => listener());
}

interface CartRow {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    title: string;
    price: number;
    stock: number;
    is_active: boolean;
    product_images: { image_path: string; position: number }[];
  } | null;
}

function mapCartRow(row: CartRow, supabase: Client): CartItemWithProduct {
  if (!row.products) {
    return { id: row.id, productId: row.product_id, quantity: row.quantity, product: null };
  }

  const cover = [...row.products.product_images].sort((a, b) => a.position - b.position)[0];

  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    product: {
      id: row.products.id,
      title: row.products.title,
      price: Number(row.products.price),
      stock: row.products.stock,
      isActive: row.products.is_active,
      imageUrl: cover ? getPublicUrl(cover.image_path, supabase) : null,
    },
  };
}

export async function listCartItems(userId: string, supabase: Client = createClient()): Promise<CartItemWithProduct[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, product_id, quantity, products(id, title, price, stock, is_active, product_images(image_path, position))")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;

  const rows = (data ?? []) as unknown as CartRow[];
  return rows.map((row) => mapCartRow(row, supabase));
}

// Si el producto ya está en el carrito SUMA la cantidad (no la reemplaza);
// en ambos casos la limita al stock actual.
export async function addItem(
  userId: string,
  productId: string,
  quantity = 1,
  supabase: Client = createClient(),
) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();
  if (productError) throw productError;

  const { data: existing, error: existingError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const nextQuantity = Math.min(existing.quantity + quantity, product.stock);
    const { error } = await supabase.from("cart_items").update({ quantity: nextQuantity }).eq("id", existing.id);
    if (error) throw error;
    notifyCartChanged();
    return;
  }

  const { error } = await supabase.from("cart_items").insert({
    user_id: userId,
    product_id: productId,
    quantity: Math.min(quantity, product.stock),
  });
  if (error) throw error;
  notifyCartChanged();
}

export async function updateQuantity(cartItemId: string, quantity: number, supabase: Client = createClient()) {
  const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);
  if (error) throw error;
  notifyCartChanged();
}

export async function removeItem(cartItemId: string, supabase: Client = createClient()) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
  notifyCartChanged();
}

// Checkout simulado: la RPC valida stock, crea el pedido con snapshots,
// descuenta stock y vacía el carrito en una sola transacción.
export async function checkout(userId: string, supabase: Client = createClient()): Promise<string> {
  const { data, error } = await supabase.rpc("create_order_from_cart", { p_buyer_id: userId });
  if (error) throw error;
  notifyCartChanged();
  return data as string;
}
