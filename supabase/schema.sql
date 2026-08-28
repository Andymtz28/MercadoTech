-- schema.sql — copia de referencia, NO es la fuente de verdad.
-- La fuente de verdad son las migraciones en supabase/migrations/.
-- Generado a partir de: extensions, profiles, categories, products, product_images,
-- cart_items, orders, order_items, questions, reviews, favorites, product_views,
-- support_articles, support_tickets, checkout_function.


-- ==== 20260101000000_extensions.sql ====
-- Extensiones requeridas por el esquema.
create extension if not exists pgcrypto with schema extensions;

-- ==== 20260101000001_profiles.sql ====
-- PROFILES: 1:1 con auth.users (mismo UUID como PK y FK).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  phone text,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  avatar_path text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Crea el profile automáticamente cuando se crea el usuario en auth.users.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==== 20260101000002_categories.sql ====
-- CATEGORIES: árbol simple de categorías tecnológicas.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  parent_id uuid references public.categories (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- ==== 20260101000003_products.sql ====
-- PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  title text not null,
  description text,
  brand text,
  condition text not null default 'nuevo' check (condition in ('nuevo', 'usado', 'reacondicionado')),
  price numeric(12, 2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create index products_seller_id_idx on public.products (seller_id);
create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ==== 20260101000004_product_images.sql ====
-- PRODUCT_IMAGES: galería ordenable (position la actualiza el drag & drop en sesión 3).
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_path text not null,
  position integer not null default 0
);

alter table public.product_images enable row level security;

create index product_images_product_id_idx on public.product_images (product_id);

-- ==== 20260101000005_cart_items.sql ====
-- CART_ITEMS: carrito persistente por usuario.
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

create index cart_items_user_id_idx on public.cart_items (user_id);

-- ==== 20260101000006_orders.sql ====
-- ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create index orders_buyer_id_idx on public.orders (buyer_id);

-- ==== 20260101000007_order_items.sql ====
-- ORDER_ITEMS: snapshot de título y precio; seller_id denormalizado para RLS del vendedor.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  title_snapshot text not null,
  price_snapshot numeric(12, 2) not null,
  quantity integer not null check (quantity > 0)
);

alter table public.order_items enable row level security;

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_seller_id_idx on public.order_items (seller_id);

-- ==== 20260101000008_questions.sql ====
-- QUESTIONS: preguntas y respuestas estilo Mercado Libre.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question text not null,
  answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

create index questions_product_id_idx on public.questions (product_id);

-- ==== 20260101000009_reviews.sql ====
-- REVIEWS: reseñas verificadas, solo de quien compró (order_id referencia la compra que verifica).
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id)
);

alter table public.reviews enable row level security;

create index reviews_product_id_idx on public.reviews (product_id);

-- ==== 20260101000010_favorites.sql ====
-- FAVORITES
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.favorites enable row level security;

create index favorites_user_id_idx on public.favorites (user_id);

-- ==== 20260101000011_product_views.sql ====
-- PRODUCT_VIEWS: cada apertura de un producto es un evento (sin contador agregado).
create table public.product_views (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

alter table public.product_views enable row level security;

create index product_views_product_id_idx on public.product_views (product_id);

-- ==== 20260101000012_support_articles.sql ====
-- SUPPORT_ARTICLES: base de conocimiento (FAQ) para el RAG de soporte (sesión 4).
create table public.support_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_articles enable row level security;

create trigger support_articles_set_updated_at
  before update on public.support_articles
  for each row execute function public.set_updated_at();

-- ==== 20260101000013_support_tickets.sql ====
-- SUPPORT_TICKETS + TICKET_MESSAGES: soporte (los usa el agente de voz en sesión 8).
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  status text not null default 'abierto'
    check (status in ('abierto', 'en_proceso', 'resuelto', 'cerrado')),
  channel text not null default 'chat' check (channel in ('chat', 'voz')),
  created_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;

create index support_tickets_user_id_idx on public.support_tickets (user_id);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  sender_role text not null check (sender_role in ('usuario', 'agente', 'humano')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.ticket_messages enable row level security;

create index ticket_messages_ticket_id_idx on public.ticket_messages (ticket_id);

-- ==== 20260101000014_checkout_function.sql ====
-- Checkout transaccional: crea un pedido a partir del carrito del comprador.
create function public.create_order_from_cart(p_buyer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total numeric(12, 2) := 0;
  v_item record;
  v_current_stock integer;
  v_is_active boolean;
begin
  if p_buyer_id <> auth.uid() then
    raise exception 'p_buyer_id debe coincidir con el usuario autenticado';
  end if;

  if not exists (select 1 from public.cart_items where user_id = p_buyer_id) then
    raise exception 'El carrito está vacío';
  end if;

  create temporary table _checkout_items on commit drop as
  select
    ci.product_id,
    ci.quantity,
    p.seller_id,
    p.title as title_snapshot,
    p.price as price_snapshot
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = p_buyer_id;

  for v_item in select * from _checkout_items loop
    select stock, is_active into v_current_stock, v_is_active
    from public.products
    where id = v_item.product_id
    for update;

    if not v_is_active then
      raise exception 'El producto "%" ya no está disponible', v_item.title_snapshot;
    end if;

    if v_current_stock < v_item.quantity then
      raise exception 'Stock insuficiente para "%": disponible %, solicitado %',
        v_item.title_snapshot, v_current_stock, v_item.quantity;
    end if;

    v_total := v_total + (v_item.price_snapshot * v_item.quantity);
  end loop;

  insert into public.orders (buyer_id, status, total)
  values (p_buyer_id, 'pendiente', v_total)
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, seller_id, title_snapshot, price_snapshot, quantity
  )
  select v_order_id, product_id, seller_id, title_snapshot, price_snapshot, quantity
  from _checkout_items;

  update public.products p
  set stock = p.stock - ci.quantity
  from _checkout_items ci
  where p.id = ci.product_id;

  delete from public.cart_items where user_id = p_buyer_id;

  return v_order_id;
end;
$$;

revoke execute on function public.create_order_from_cart(uuid) from public;
revoke execute on function public.create_order_from_cart(uuid) from anon;
grant execute on function public.create_order_from_cart(uuid) to authenticated;

-- ==== 20260101000018_handle_new_user_metadata.sql ====
-- Reemplaza handle_new_user(): ahora lee display_name y role desde
-- new.raw_user_meta_data (enviados por signUp(options.data) en el
-- registro). El role se valida contra una lista blanca ('buyer'|'seller') —
-- CUALQUIER otro valor, incluido 'admin' manipulado por el cliente, cae a
-- 'buyer'. Es la ÚNICA vía para fijar el role de un usuario nuevo: después
-- de este INSERT, protect_profile_role (Fase 2.3) bloquea que el propio
-- usuario se lo cambie.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'role' in ('buyer', 'seller') then new.raw_user_meta_data->>'role'
      else 'buyer'
    end
  );
  return new;
end;
$$;

-- ==== 20260101000017_fix_protect_profile_role.sql (ver policies.sql para el resto de RLS) ====
-- Corrige protect_profile_role(): la versión original bloqueaba CUALQUIER
-- cambio de role, incluso desde conexiones administrativas/scripts (seed,
-- migraciones) sin sesión de usuario, porque auth.uid() es NULL ahí y
-- is_admin() siempre da falso en ese contexto. Se detectó al correr
-- supabase/seed.sql contra un proyecto real (Fase 2.5): el UPDATE que
-- corrige el role de sellers/admin fallaba con "No tienes permiso para
-- cambiar tu rol".
--
-- La regla de negocio real es: un usuario AUTENTICADO no puede cambiar su
-- propio role salvo que sea admin. Fuera de una sesión autenticada
-- (auth.uid() is null) no aplica RLS de todos modos, así que tampoco debe
-- aplicar esta restricción.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.role <> old.role and not public.is_admin() then
    raise exception 'No tienes permiso para cambiar tu rol';
  end if;
  return new;
end;
$$;

-- ==== 20260101000020_fix_order_items_product_restrict.sql ====
-- Corrige order_items.product_id de "on delete set null" a "on delete
-- restrict". La Fase 2.2 lo dejó en SET NULL pensando en preservar el
-- historial si un producto se borraba; pero la Fase 3.7 requiere que
-- eliminar un producto con ventas quede BLOQUEADO (deleteProduct atrapa el
-- código 23503 y muestra "Este producto tiene ventas; desactívalo en lugar
-- de eliminarlo"). Con SET NULL ese borrado se permitía silenciosamente:
-- se detectó al probar en vivo — un borrado real eliminó un producto con
-- pedidos asociados sin ningún error, dejando order_items.product_id en
-- NULL. El historial de la orden no se pierde de todos modos porque
-- title_snapshot/price_snapshot ya lo preservan; lo que SET NULL rompía era
-- la posibilidad de bloquear el borrado en primer lugar.
alter table public.order_items
  drop constraint order_items_product_id_fkey;

alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id) references public.products (id) on delete restrict;
