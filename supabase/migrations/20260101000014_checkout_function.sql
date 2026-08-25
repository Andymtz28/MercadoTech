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
