import { describe, expect, it } from "vitest";
import { addItem, checkout, listCartItems, removeItem, updateQuantity } from "./cart.service";
import { createSupabaseMock, findInvokedChain } from "./test-utils/supabase-mock";

describe("addItem", () => {
  it("producto nuevo en el carrito: inserta con la cantidad pedida", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: { data: { stock: 10 } },
        cart_items: { data: null }, // maybeSingle: no existe todavía
      },
    });

    await addItem("user-1", "prod-1", 2, supabase);

    const inserted = findInvokedChain(supabase.from, "insert");
    expect(inserted.insert).toHaveBeenCalledWith({ user_id: "user-1", product_id: "prod-1", quantity: 2 });
  });

  it("producto ya en el carrito: SUMA la cantidad existente (no la reemplaza)", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: { data: { stock: 100 } },
        cart_items: { data: { id: "item-1", quantity: 3 } },
      },
    });

    await addItem("user-1", "prod-1", 2, supabase);

    const updated = findInvokedChain(supabase.from, "update");
    expect(updated.update).toHaveBeenCalledWith({ quantity: 5 });
  });

  it("recorta la suma al stock disponible", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: { data: { stock: 4 } },
        cart_items: { data: { id: "item-1", quantity: 3 } },
      },
    });

    await addItem("user-1", "prod-1", 5, supabase);

    const updated = findInvokedChain(supabase.from, "update");
    expect(updated.update).toHaveBeenCalledWith({ quantity: 4 });
  });

  it("recorta al stock también para un producto nuevo", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: { data: { stock: 2 } },
        cart_items: { data: null },
      },
    });

    await addItem("user-1", "prod-1", 10, supabase);

    const inserted = findInvokedChain(supabase.from, "insert");
    expect(inserted.insert).toHaveBeenCalledWith({ user_id: "user-1", product_id: "prod-1", quantity: 2 });
  });

  // comportamiento actual, revisar: el código NO aplica un piso de 1 — si
  // se pide cantidad 0 (o negativa), la guarda tal cual. La spec original
  // asumía un piso [1, stock] que no existe en la implementación real.
  it("comportamiento actual: cantidad 0 se guarda como 0, sin piso de 1", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: { data: { stock: 10 } },
        cart_items: { data: null },
      },
    });

    await addItem("user-1", "prod-1", 0, supabase);

    const inserted = findInvokedChain(supabase.from, "insert");
    expect(inserted.insert).toHaveBeenCalledWith({ user_id: "user-1", product_id: "prod-1", quantity: 0 });
  });

  it("propaga el error si falla la lectura del producto", async () => {
    const supabase = createSupabaseMock({
      tables: { products: { data: null, error: { message: "producto no encontrado" } } },
    });

    await expect(addItem("user-1", "prod-1", 1, supabase)).rejects.toEqual({ message: "producto no encontrado" });
  });

  it("propaga el error si falla la lectura del carrito existente", async () => {
    const supabase = createSupabaseMock({
      tables: {
        products: { data: { stock: 10 } },
        cart_items: { data: null, error: { message: "fallo de lectura" } },
      },
    });

    await expect(addItem("user-1", "prod-1", 1, supabase)).rejects.toEqual({ message: "fallo de lectura" });
  });
});

describe("listCartItems", () => {
  it("mapea price string a number y arma el snapshot del producto", async () => {
    const supabase = createSupabaseMock({
      tables: {
        cart_items: {
          data: [
            {
              id: "item-1",
              product_id: "prod-1",
              quantity: 2,
              products: {
                id: "prod-1",
                title: "Laptop",
                price: "18999.00",
                stock: 5,
                is_active: true,
                product_images: [
                  { image_path: "a/b/2.jpg", position: 1 },
                  { image_path: "a/b/1.jpg", position: 0 },
                ],
              },
            },
          ],
        },
      },
    });

    const items = await listCartItems("user-1", supabase);

    expect(items).toHaveLength(1);
    expect(items[0].product?.price).toBe(18999);
    expect(items[0].product?.imageUrl).toContain("a/b/1.jpg");
  });

  it("producto huérfano (null): la fila se mapea con product: null", async () => {
    const supabase = createSupabaseMock({
      tables: {
        cart_items: { data: [{ id: "item-1", product_id: "prod-1", quantity: 1, products: null }] },
      },
    });

    const items = await listCartItems("user-1", supabase);

    expect(items[0]).toEqual({ id: "item-1", productId: "prod-1", quantity: 1, product: null });
  });

  it("propaga el error tal cual", async () => {
    const supabase = createSupabaseMock({
      tables: { cart_items: { data: null, error: { message: "sin acceso" } } },
    });

    await expect(listCartItems("user-1", supabase)).rejects.toEqual({ message: "sin acceso" });
  });
});

describe("updateQuantity / removeItem", () => {
  it("updateQuantity propaga el error del update", async () => {
    const supabase = createSupabaseMock({
      tables: { cart_items: { data: null, error: { message: "no existe" } } },
    });
    await expect(updateQuantity("item-1", 3, supabase)).rejects.toEqual({ message: "no existe" });
  });

  it("removeItem no lanza cuando el delete no tiene error", async () => {
    const supabase = createSupabaseMock({ tables: { cart_items: { data: null, error: null } } });
    await expect(removeItem("item-1", supabase)).resolves.toBeUndefined();
  });
});

describe("checkout", () => {
  it("llama a la RPC create_order_from_cart con p_buyer_id y devuelve el id del pedido", async () => {
    const supabase = createSupabaseMock({
      rpc: { create_order_from_cart: { data: "order-123" } },
    });

    const orderId = await checkout("user-1", supabase);

    expect(supabase.rpc).toHaveBeenCalledWith("create_order_from_cart", { p_buyer_id: "user-1" });
    expect(orderId).toBe("order-123");
  });

  it("propaga el MENSAJE del error (ej. stock insuficiente)", async () => {
    const supabase = createSupabaseMock({
      rpc: { create_order_from_cart: { data: null, error: { message: "Stock insuficiente para Laptop Dell XPS 13" } } },
    });

    await expect(checkout("user-1", supabase)).rejects.toEqual({ message: "Stock insuficiente para Laptop Dell XPS 13" });
  });
});
