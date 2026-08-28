-- policies.sql — copia de referencia, NO es la fuente de verdad.
-- La fuente de verdad es supabase/migrations/20260101000015_rls_policies.sql.

-- Políticas RLS para todas las tablas + GRANTs de la Data API.
-- Todas las tablas ya tienen RLS habilitado desde su creación (migraciones previas).

-- ---------------------------------------------------------------------------
-- Funciones helper (SECURITY DEFINER, search_path fijado: evitan repetir
-- subconsultas a profiles en cada política y en caliente).
-- ---------------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'seller'
  );
$$;

-- Impide que un usuario cambie su propio rol (solo un admin puede hacerlo).
create function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'No tienes permiso para cambiar tu rol';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- PROFILES — SELECT: dueño o admin · INSERT: vía trigger · UPDATE: solo dueño
-- (role protegido por trigger) · DELETE: no permitido.
-- ---------------------------------------------------------------------------

create policy profiles_select on public.profiles
  for select
  using (id = (select auth.uid()) or public.is_admin());

create policy profiles_update on public.profiles
  for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- CATEGORIES — SELECT: todos (incluido anon) · INSERT/UPDATE/DELETE: solo admin.
-- ---------------------------------------------------------------------------

create policy categories_select on public.categories
  for select
  using (true);

create policy categories_insert on public.categories
  for insert
  with check (public.is_admin());

create policy categories_update on public.categories
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy categories_delete on public.categories
  for delete
  using (public.is_admin());

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

-- ---------------------------------------------------------------------------
-- PRODUCTS — SELECT: activos para todos, el vendedor ve también los suyos
-- inactivos · INSERT: seller_id = auth.uid() y rol seller · UPDATE/DELETE:
-- solo el vendedor dueño.
-- ---------------------------------------------------------------------------

create policy products_select on public.products
  for select
  using (is_active or seller_id = (select auth.uid()));

create policy products_insert on public.products
  for insert
  with check (seller_id = (select auth.uid()) and public.is_seller());

create policy products_update on public.products
  for update
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));

create policy products_delete on public.products
  for delete
  using (seller_id = (select auth.uid()));

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

-- ---------------------------------------------------------------------------
-- PRODUCT_IMAGES — mismas condiciones de visibilidad que su producto;
-- escritura solo del vendedor dueño del producto.
-- ---------------------------------------------------------------------------

create policy product_images_select on public.product_images
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and (p.is_active or p.seller_id = (select auth.uid()))
    )
  );

create policy product_images_insert on public.product_images
  for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = (select auth.uid())
    )
  );

create policy product_images_update on public.product_images
  for update
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = (select auth.uid())
    )
  );

create policy product_images_delete on public.product_images
  for delete
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.seller_id = (select auth.uid())
    )
  );

grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

-- ---------------------------------------------------------------------------
-- CART_ITEMS — todo (SELECT/INSERT/UPDATE/DELETE) solo el dueño.
-- ---------------------------------------------------------------------------

create policy cart_items_select on public.cart_items
  for select
  using (user_id = (select auth.uid()));

create policy cart_items_insert on public.cart_items
  for insert
  with check (user_id = (select auth.uid()));

create policy cart_items_update on public.cart_items
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy cart_items_delete on public.cart_items
  for delete
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.cart_items to authenticated;

-- ---------------------------------------------------------------------------
-- ORDERS — SELECT: comprador dueño, vendedor con ítems en el pedido, o admin
-- · INSERT: solo vía create_order_from_cart (sin política de INSERT) ·
-- UPDATE: vendedor avanza status de pedidos con ítems suyos; comprador solo
-- puede cancelar si está 'pendiente' · DELETE: no permitido.
-- ---------------------------------------------------------------------------

create policy orders_select on public.orders
  for select
  using (
    buyer_id = (select auth.uid())
    or exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id and oi.seller_id = (select auth.uid())
    )
    or public.is_admin()
  );

create policy orders_seller_update_status on public.orders
  for update
  using (
    exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id and oi.seller_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id and oi.seller_id = (select auth.uid())
    )
  );

create policy orders_buyer_cancel on public.orders
  for update
  using (buyer_id = (select auth.uid()) and status = 'pendiente')
  with check (buyer_id = (select auth.uid()) and status = 'cancelado');

grant select, update on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- ORDER_ITEMS — SELECT: comprador del pedido, vendedor de sus ítems, o admin
-- · INSERT/UPDATE/DELETE: solo vía función (sin políticas de escritura).
-- ---------------------------------------------------------------------------

create policy order_items_select on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.buyer_id = (select auth.uid())
    )
    or seller_id = (select auth.uid())
    or public.is_admin()
  );

grant select on public.order_items to authenticated;

-- ---------------------------------------------------------------------------
-- QUESTIONS — SELECT: todos (producto público) · INSERT: cualquier
-- authenticated (como autor) · UPDATE: solo el vendedor dueño del producto
-- (para responder) · DELETE: autor de la pregunta o admin.
-- ---------------------------------------------------------------------------

create policy questions_select on public.questions
  for select
  using (true);

create policy questions_insert on public.questions
  for insert
  with check (user_id = (select auth.uid()));

create policy questions_update on public.questions
  for update
  using (
    exists (
      select 1 from public.products p
      where p.id = questions.product_id and p.seller_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = questions.product_id and p.seller_id = (select auth.uid())
    )
  );

create policy questions_delete on public.questions
  for delete
  using (user_id = (select auth.uid()) or public.is_admin());

grant select on public.questions to anon, authenticated;
grant insert, update, delete on public.questions to authenticated;

-- ---------------------------------------------------------------------------
-- REVIEWS — SELECT: todos · INSERT: comprador con pedido 'entregado' que
-- contenga el producto · UPDATE: solo autor · DELETE: autor o admin.
-- ---------------------------------------------------------------------------

create policy reviews_select on public.reviews
  for select
  using (true);

create policy reviews_insert on public.reviews
  for insert
  with check (
    buyer_id = (select auth.uid())
    and exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.id = reviews.order_id
        and o.buyer_id = (select auth.uid())
        and o.status = 'entregado'
        and oi.product_id = reviews.product_id
    )
  );

create policy reviews_update on public.reviews
  for update
  using (buyer_id = (select auth.uid()))
  with check (buyer_id = (select auth.uid()));

create policy reviews_delete on public.reviews
  for delete
  using (buyer_id = (select auth.uid()) or public.is_admin());

grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

-- ---------------------------------------------------------------------------
-- FAVORITES — SELECT/INSERT/DELETE solo el dueño.
-- ---------------------------------------------------------------------------

create policy favorites_select on public.favorites
  for select
  using (user_id = (select auth.uid()));

create policy favorites_insert on public.favorites
  for insert
  with check (user_id = (select auth.uid()));

create policy favorites_delete on public.favorites
  for delete
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.favorites to authenticated;

-- ---------------------------------------------------------------------------
-- PRODUCT_VIEWS — SELECT: vendedor del producto o admin · INSERT: cualquier
-- authenticated (como autor del evento).
-- ---------------------------------------------------------------------------

create policy product_views_select on public.product_views
  for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_views.product_id and p.seller_id = (select auth.uid())
    )
    or public.is_admin()
  );

create policy product_views_insert on public.product_views
  for insert
  with check (user_id = (select auth.uid()));

grant select, insert on public.product_views to authenticated;

-- ---------------------------------------------------------------------------
-- SUPPORT_ARTICLES — SELECT: todos si is_published · INSERT/UPDATE/DELETE:
-- solo admin.
-- ---------------------------------------------------------------------------

create policy support_articles_select on public.support_articles
  for select
  using (is_published);

create policy support_articles_insert on public.support_articles
  for insert
  with check (public.is_admin());

create policy support_articles_update on public.support_articles
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy support_articles_delete on public.support_articles
  for delete
  using (public.is_admin());

grant select on public.support_articles to anon, authenticated;
grant insert, update, delete on public.support_articles to authenticated;

-- ---------------------------------------------------------------------------
-- SUPPORT_TICKETS — SELECT: dueño o admin · INSERT: dueño · UPDATE: dueño
-- (solo puede cerrar) o admin (cualquier campo) · DELETE: no permitido.
-- ---------------------------------------------------------------------------

create policy support_tickets_select on public.support_tickets
  for select
  using (user_id = (select auth.uid()) or public.is_admin());

create policy support_tickets_insert on public.support_tickets
  for insert
  with check (user_id = (select auth.uid()));

create policy support_tickets_owner_close on public.support_tickets
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and status = 'cerrado');

create policy support_tickets_admin_update on public.support_tickets
  for update
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.support_tickets to authenticated;

-- ---------------------------------------------------------------------------
-- TICKET_MESSAGES — SELECT/INSERT: dueño del ticket o admin · sin
-- UPDATE/DELETE (histórico inmutable).
-- ---------------------------------------------------------------------------

create policy ticket_messages_select on public.ticket_messages
  for select
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_messages.ticket_id and t.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

create policy ticket_messages_insert on public.ticket_messages
  for insert
  with check (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_messages.ticket_id and t.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

grant select, insert on public.ticket_messages to authenticated;

-- ==== 20260101000019_fix_orders_rls_recursion.sql ====
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

-- ==== 20260101000024_knowledge_embeddings_rls.sql ====
-- knowledge_embeddings — SELECT solo para authenticated (decisión de la
-- Fase 4.4: la IA exige sesión, tanto para no dejar la pestaña muerta con
-- una RLS que la contradiga como para proteger la cuota gratuita de
-- Hugging Face). INSERT/UPDATE/DELETE: sin política ni GRANT — solo el
-- cliente admin (service role, que bypasea RLS) escribe, desde
-- app/api/v1/reindex y scripts/index-all.ts (Fase 4.3).

create policy knowledge_embeddings_select on public.knowledge_embeddings
  for select
  using ((select auth.uid()) is not null);

grant select on public.knowledge_embeddings to authenticated;

-- match_knowledge es SECURITY INVOKER: igual que la tabla, solo
-- authenticated puede ejecutarlo (anon nunca tendría filas visibles de
-- todos modos, pero se restringe también el EXECUTE por claridad y para no
-- gastar cuota de Hugging Face generando el embedding de una consulta que
-- de entrada no vería resultados).
revoke execute on function public.match_knowledge(extensions.vector, text, int, float) from public;
revoke execute on function public.match_knowledge(extensions.vector, text, int, float) from anon;
grant execute on function public.match_knowledge(extensions.vector, text, int, float) to authenticated;
