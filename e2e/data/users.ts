// Usuarios DEL SEED (supabase/seed.sql) — existen tal cual tras
// `supabase db reset`. Misma contraseña para todos.
export const SEED_PASSWORD = "MercadoTech123!";

export const BUYER1 = { email: "buyer1@mercadotech.test", password: SEED_PASSWORD };
export const SELLER1 = { email: "seller1@mercadotech.test", password: SEED_PASSWORD };

// Producto con stock 0 en el seed — usado en los negativos del comprador.
// OJO: el estado de partida de la spec decía "...06", pero ese id
// (Memoria RAM Corsair) tiene stock 30 en supabase/seed.sql; el que
// realmente tiene stock 0 (comentario "p07 con stock 0" en el propio seed)
// es "...07" (Audífonos Sony WH-1000XM4).
export const OUT_OF_STOCK_PRODUCT_ID = "b0000000-0000-0000-0000-000000000007";

// Pedido 'pagado' del seed, de buyer1, con un ítem de seller1 — usado en el
// E2E del kanban del vendedor (Fase 6.6). No hay ningún pedido 'enviado' de
// seller1 en el seed (el único 'enviado' es de seller2) — el negativo de
// "no retroceder" arranca moviendo este mismo pedido a 'enviado' primero.
export const SEED_PAID_ORDER_ID = "00000001-0000-0000-0000-000000000002";
