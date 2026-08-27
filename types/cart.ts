// El precio mostrado en el carrito es el ACTUAL de products (no un
// snapshot) — el snapshot histórico lo fija la RPC de checkout al crear
// el pedido.
export interface CartProductSnapshot {
  id: string;
  title: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
}

export interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  // null cuando el producto ya no es visible para el comprador (RLS lo
  // filtra si quedó inactivo) — la fila se muestra como "ya no disponible".
  product: CartProductSnapshot | null;
}
