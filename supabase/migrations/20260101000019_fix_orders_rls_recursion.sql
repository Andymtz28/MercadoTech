-- Corrige "infinite recursion detected in policy for relation orders"
-- (42P17): orders_select consulta order_items para la visibilidad del
-- vendedor, y order_items_select consulta orders para la visibilidad del
-- comprador. Al leer order_items con un join embebido a orders (ej.
-- review.service.ts::canReview, `.select("order_id, orders!inner(...)")`),
-- Postgres evalúa ambas políticas entre sí sin poder resolver el ciclo.
-- Se detectó probando reseñas en vivo contra el proyecto real (Fase 3.5).
--
-- Arreglo: igual que is_admin()/is_seller(), mover cada verificación
-- cruzada a una función SECURITY DEFINER — su consulta interna corre con
-- el owner (postgres, con BYPASSRLS) y no vuelve a disparar la policy de
-- la tabla contraria, rompiendo el ciclo.

create or replace function public.order_belongs_to_buyer(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders where id = p_order_id and buyer_id = auth.uid()
  );
$$;

create or replace function public.order_has_seller_item(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.order_items where order_id = p_order_id and seller_id = auth.uid()
  );
$$;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select
  using (
    buyer_id = (select auth.uid())
    or public.order_has_seller_item(id)
    or public.is_admin()
  );

drop policy if exists orders_seller_update_status on public.orders;
create policy orders_seller_update_status on public.orders
  for update
  using (public.order_has_seller_item(id))
  with check (public.order_has_seller_item(id));

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select
  using (
    public.order_belongs_to_buyer(order_id)
    or seller_id = (select auth.uid())
    or public.is_admin()
  );
