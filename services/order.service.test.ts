import { describe, expect, it } from "vitest";
import { cancelIfPending, getOrderById, listOrders, listSellerOrders, updateOrderStatus } from "./order.service";
import { createSupabaseMock, findInvokedChain } from "./test-utils/supabase-mock";

describe("listOrders", () => {
  it("mapea status y convierte total de string a number", async () => {
    const supabase = createSupabaseMock({
      tables: {
        orders: {
          data: [{ id: "o1", buyer_id: "u1", status: "pendiente", total: "1499.00", created_at: "2026-01-01" }],
        },
      },
    });

    const orders = await listOrders("u1", supabase);

    expect(orders[0].total).toBe(1499);
    expect(orders[0].status).toBe("pendiente");
  });

  it("propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { orders: { data: null, error: { message: "falló" } } } });
    await expect(listOrders("u1", supabase)).rejects.toEqual({ message: "falló" });
  });
});

describe("getOrderById", () => {
  it("devuelve null si no existe", async () => {
    const supabase = createSupabaseMock({ tables: { orders: { data: null } } });
    expect(await getOrderById("o1", supabase)).toBeNull();
  });

  it("separa order_items del resto y convierte price_snapshot", async () => {
    const supabase = createSupabaseMock({
      tables: {
        orders: {
          data: {
            id: "o1",
            buyer_id: "u1",
            status: "pagado",
            total: "999.00",
            created_at: "2026-01-01",
            order_items: [{ id: "i1", product_id: "p1", quantity: 1, price_snapshot: "999.00" }],
          },
        },
      },
    });

    const order = await getOrderById("o1", supabase);

    expect(order?.items).toHaveLength(1);
    expect(order?.items[0].price_snapshot).toBe(999);
    expect(order?.total).toBe(999);
  });
});

describe("cancelIfPending", () => {
  it("filtra por status pendiente al actualizar a cancelado", async () => {
    const supabase = createSupabaseMock({ tables: { orders: { data: null, error: null } } });

    await cancelIfPending("o1", supabase);

    const updated = findInvokedChain(supabase.from, "update");
    expect(updated.update).toHaveBeenCalledWith({ status: "cancelado" });
    expect(updated.eq).toHaveBeenCalledWith("status", "pendiente");
  });

  it("propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { orders: { data: null, error: { message: "no autorizado" } } } });
    await expect(cancelIfPending("o1", supabase)).rejects.toEqual({ message: "no autorizado" });
  });
});

describe("listSellerOrders", () => {
  it("agrupa varios ítems del mismo pedido y suma myTotal", async () => {
    const supabase = createSupabaseMock({
      tables: {
        order_items: {
          data: [
            {
              id: "i1",
              product_id: "p1",
              quantity: 2,
              price_snapshot: "100.00",
              orders: { id: "o1", status: "pagado", created_at: "2026-01-02", buyer_id: "b1" },
            },
            {
              id: "i2",
              product_id: "p2",
              quantity: 1,
              price_snapshot: "50.00",
              orders: { id: "o1", status: "pagado", created_at: "2026-01-02", buyer_id: "b1" },
            },
            {
              id: "i3",
              product_id: "p3",
              quantity: 1,
              price_snapshot: "30.00",
              orders: { id: "o2", status: "pendiente", created_at: "2026-01-01", buyer_id: "b2" },
            },
          ],
        },
      },
    });

    const views = await listSellerOrders("seller-1", supabase);

    expect(views).toHaveLength(2);
    const o1 = views.find((v) => v.id === "o1")!;
    expect(o1.myItems).toHaveLength(2);
    expect(o1.myTotal).toBe(250); // 2*100 + 1*50
  });

  it("ordena por createdAt descendente (más reciente primero)", async () => {
    const supabase = createSupabaseMock({
      tables: {
        order_items: {
          data: [
            {
              id: "i1",
              product_id: "p1",
              quantity: 1,
              price_snapshot: "10.00",
              orders: { id: "old", status: "pagado", created_at: "2026-01-01", buyer_id: "b1" },
            },
            {
              id: "i2",
              product_id: "p2",
              quantity: 1,
              price_snapshot: "10.00",
              orders: { id: "new", status: "pagado", created_at: "2026-01-05", buyer_id: "b1" },
            },
          ],
        },
      },
    });

    const views = await listSellerOrders("seller-1", supabase);
    expect(views.map((v) => v.id)).toEqual(["new", "old"]);
  });
});

describe("updateOrderStatus", () => {
  it("envía el status destino al update (la secuencia se valida en el hook, no aquí)", async () => {
    const supabase = createSupabaseMock({ tables: { orders: { data: null, error: null } } });

    await updateOrderStatus("o1", "enviado", supabase);

    const updated = findInvokedChain(supabase.from, "update");
    expect(updated.update).toHaveBeenCalledWith({ status: "enviado" });
  });

  it("propaga el error", async () => {
    const supabase = createSupabaseMock({ tables: { orders: { data: null, error: { message: "rechazado por RLS" } } } });
    await expect(updateOrderStatus("o1", "enviado", supabase)).rejects.toEqual({ message: "rechazado por RLS" });
  });
});
