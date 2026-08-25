-- rls-validation.sql — validación manual de políticas RLS.
--
-- Cómo ejecutar: contra una base con las migraciones + supabase/seed.sql ya
-- aplicados (`supabase db reset`), con:
--   supabase db execute --file supabase/tests/rls-validation.sql
-- o pegando el contenido en `supabase db psql` / cualquier cliente psql
-- conectado como el rol `postgres` (necesario para poder hacer SET ROLE).
--
-- Cada escenario simula un actor con:
--   select set_config('request.jwt.claims', json_build_object('sub', '<uuid>')::text, true);
--   set local role authenticated; -- o anon
-- (auth.uid() lee el campo "sub" de request.jwt.claims). Cada bloque va
-- envuelto en BEGIN/ROLLBACK para no dejar efectos secundarios, salvo donde
-- se indica lo contrario.
--
-- IDs de referencia (de supabase/seed.sql):
--   buyer1  = 10000000-0000-0000-0000-000000000001
--   buyer2  = 10000000-0000-0000-0000-000000000002
--   buyer3  = 10000000-0000-0000-0000-000000000003
--   seller1 = 20000000-0000-0000-0000-000000000001 (dueño de p01..p08)
--   seller2 = 20000000-0000-0000-0000-000000000002 (dueño de p09..p16)
--   admin   = 30000000-0000-0000-0000-000000000001
--   p01 = Laptop Dell XPS 13 (seller1) · p09 = Monitor LG UltraGear (seller2)
--   orden entregado de buyer2: 00000001-0000-0000-0000-000000000004 (contiene p03, p11)

-- =============================================================================
-- 1. Anónimo: ve productos activos; NO ve carritos, pedidos ni tickets.
-- =============================================================================
begin;
set local role anon;

-- Esperado: >=14 filas (16 productos - 2 inactivos: p08, p16).
select count(*) as productos_activos_visibles_anon from public.products;

-- Esperado: 0 filas (no existe policy de SELECT para anon en cart_items).
select count(*) as carritos_visibles_anon from public.cart_items;

-- Esperado: 0 filas.
select count(*) as pedidos_visibles_anon from public.orders;

-- Esperado: 0 filas.
select count(*) as tickets_visibles_anon from public.support_tickets;
rollback;

-- =============================================================================
-- 2. Comprador: ve/edita SU carrito; no puede tocar el de otro.
-- =============================================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000003')::text, true);
set local role authenticated;

-- Esperado: 2 filas (buyer3 tiene 2 items sembrados en seed.sql).
select count(*) as items_propios from public.cart_items where user_id = '10000000-0000-0000-0000-000000000003';

-- Esperado: UPDATE exitoso (1 fila afectada).
update public.cart_items set quantity = 3
where user_id = '10000000-0000-0000-0000-000000000003'
  and product_id = 'b0000000-0000-0000-0000-000000000005';

-- Esperado: 0 filas afectadas (RLS filtra el carrito de buyer1, no de buyer3).
update public.cart_items set quantity = 99
where user_id = '10000000-0000-0000-0000-000000000001';

-- Esperado: 0 filas (buyer3 no ve el carrito de otros usuarios vía SELECT).
select count(*) as carrito_ajeno_visible from public.cart_items where user_id = '10000000-0000-0000-0000-000000000001';
rollback;

-- =============================================================================
-- 3. Comprador: no puede insertar reseña sin pedido 'entregado'; sí con él.
-- =============================================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000001')::text, true);
set local role authenticated;

-- Esperado: ERROR (viola policy reviews_insert) — buyer1 no tiene pedido
-- 'entregado' que contenga p01 (su pedido con p01 está 'pendiente').
insert into public.reviews (product_id, buyer_id, order_id, rating, comment)
values ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', 5, 'no debería poder insertar esto');
rollback;

begin;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000002')::text, true);
set local role authenticated;

-- Esperado: INSERT exitoso — buyer2 sí tiene el pedido 00000001-...-004
-- 'entregado' con el producto p11 (Mouse Razer, dejado sin reseña en el
-- seed a propósito para esta prueba; p03 ya tiene reseña de buyer2 en el
-- seed y chocaría con unique(product_id, buyer_id)).
insert into public.reviews (product_id, buyer_id, order_id, rating, comment)
values ('b0000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000004', 5, 'validación RLS: insert permitido');
rollback;

-- =============================================================================
-- 4. Vendedor: CRUD de SUS productos; no puede editar productos ajenos.
-- =============================================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '20000000-0000-0000-0000-000000000001')::text, true);
set local role authenticated;

-- Esperado: INSERT exitoso (seller1 crea un producto propio).
insert into public.products (seller_id, category_id, title, price, stock)
values ('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Producto de prueba RLS', 100.00, 1);

-- Esperado: UPDATE exitoso (1 fila) — p01 es de seller1.
update public.products set stock = stock + 1 where id = 'b0000000-0000-0000-0000-000000000001';

-- Esperado: 0 filas afectadas — p09 es de seller2, no de seller1.
update public.products set stock = 0 where id = 'b0000000-0000-0000-0000-000000000009';

-- Esperado: 0 filas afectadas por la misma razón.
delete from public.products where id = 'b0000000-0000-0000-0000-000000000009';
rollback;

-- =============================================================================
-- 5. Vendedor: ve pedidos que contienen sus ítems; no ve pedidos ajenos.
-- =============================================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '20000000-0000-0000-0000-000000000001')::text, true);
set local role authenticated;

-- Esperado: >0 filas — seller1 tiene ítems en los pedidos 001, 002, 004, 006.
select count(*) as pedidos_con_items_propios from public.orders o
where exists (select 1 from public.order_items oi where oi.order_id = o.id and oi.seller_id = '20000000-0000-0000-0000-000000000001');

-- Esperado: 0 filas — el pedido 003 (buyer2, monitor de seller2) no debe
-- aparecer para seller1.
select count(*) as pedido_ajeno_visible from public.orders where id = '00000001-0000-0000-0000-000000000003';
rollback;

-- =============================================================================
-- 6. Vendedor: puede responder preguntas SOLO de sus productos.
-- =============================================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '20000000-0000-0000-0000-000000000001')::text, true);
set local role authenticated;

-- Esperado: UPDATE exitoso — la pregunta es sobre p01, producto de seller1.
update public.questions
set answer = 'Respuesta de validación RLS', answered_at = now()
where product_id = 'b0000000-0000-0000-0000-000000000001'
  and question = '¿Tiene garantía?';

-- Esperado: 0 filas afectadas — la pregunta es sobre p09, producto de seller2.
update public.questions
set answer = 'no debería poder responder esto'
where product_id = 'b0000000-0000-0000-0000-000000000009'
  and question = '¿Tiene soporte VESA para montar en brazo?';
rollback;

-- =============================================================================
-- 7. Usuario: no puede cambiar su propio role.
-- =============================================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000001')::text, true);
set local role authenticated;

-- Esperado: ERROR "No tienes permiso para cambiar tu rol" (trigger
-- protect_profile_role, disparado por la policy profiles_update).
update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000001';
rollback;

begin;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000001')::text, true);
set local role authenticated;

-- Esperado: UPDATE exitoso — editar un campo propio distinto de role sí está permitido.
update public.profiles set display_name = 'Ana Buyer (editado)' where id = '10000000-0000-0000-0000-000000000001';
rollback;

-- =============================================================================
-- 8. Admin: puede moderar (borrar pregunta/reseña, editar support_articles).
-- =============================================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '30000000-0000-0000-0000-000000000001')::text, true);
set local role authenticated;

-- Esperado: DELETE exitoso (1 fila) — admin puede borrar cualquier pregunta.
delete from public.questions
where product_id = 'b0000000-0000-0000-0000-000000000007'
  and question = '¿Cuándo vuelve a haber stock?';

-- Esperado: DELETE exitoso (1 fila) — admin puede borrar cualquier reseña.
delete from public.reviews where product_id = 'b0000000-0000-0000-0000-000000000014';

-- Esperado: UPDATE exitoso — admin puede editar cualquier artículo de soporte.
update public.support_articles set is_published = false
where title = '¿Puedo pagar en abonos o meses sin intereses?';
rollback;

-- =============================================================================
-- 9. Checkout: create_order_from_cart falla con carrito vacío y con stock
--    insuficiente; el éxito descuenta stock y vacía el carrito.
-- =============================================================================
begin;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000002')::text, true);
set local role authenticated;

-- Esperado: ERROR "El carrito está vacío" — buyer2 no tiene cart_items en el seed.
select public.create_order_from_cart('10000000-0000-0000-0000-000000000002');
rollback;

begin;
-- Preparación (todavía como el rol de conexión, sin RLS): forzar stock
-- insuficiente para un producto en el carrito de buyer3. Debe ejecutarse
-- ANTES de cambiar a "authenticated": buyer3 no es el vendedor dueño de p05
-- y la policy products_update se lo bloquearía.
update public.products set stock = 0 where id = 'b0000000-0000-0000-0000-000000000005';

select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000003')::text, true);
set local role authenticated;

-- Esperado: ERROR "Stock insuficiente para..." (p05 quedó con stock 0, el
-- carrito de buyer3 pide 1).
select public.create_order_from_cart('10000000-0000-0000-0000-000000000003');
rollback;

begin;
select set_config('request.jwt.claims', json_build_object('sub', '10000000-0000-0000-0000-000000000003')::text, true);
set local role authenticated;

-- Esperado: 2 filas antes del checkout (seed: p05 x1, p12 x2).
select count(*) as items_antes from public.cart_items where user_id = '10000000-0000-0000-0000-000000000003';

-- Esperado: retorna un uuid válido (id del nuevo pedido), sin error — hay
-- stock suficiente para ambos productos.
select public.create_order_from_cart('10000000-0000-0000-0000-000000000003') as nuevo_pedido_id;

-- Esperado: 0 filas — el carrito se vació tras el checkout.
select count(*) as items_despues from public.cart_items where user_id = '10000000-0000-0000-0000-000000000003';

-- Esperado: stock de p05 bajó de 6 a 5.
select stock as stock_p05_despues from public.products where id = 'b0000000-0000-0000-0000-000000000005';

-- Esperado: stock de p12 bajó de 8 a 6.
select stock as stock_p12_despues from public.products where id = 'b0000000-0000-0000-0000-000000000012';
rollback;
