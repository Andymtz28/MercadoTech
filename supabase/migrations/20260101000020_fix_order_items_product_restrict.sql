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
