-- Precio anterior para la sección "Bajaron de precio esta semana" del Home
-- (Fase UX, diseño/README.md). NULL = sin descuento activo; la validación
-- previous_price > price vive en el service, no aquí, para no bloquear
-- updates legítimos de precio que dejen la columna sin tocar.
alter table public.products add column previous_price numeric(12, 2);

-- Ejemplos reales sobre productos ya sembrados (no se toca seed.sql):
-- variedad de categorías, todos activos y con stock.
update public.products set previous_price = 23999.00 where id = 'b0000000-0000-0000-0000-000000000001'; -- Laptop Dell XPS 13, -21%
update public.products set previous_price = 13999.00 where id = 'b0000000-0000-0000-0000-000000000004'; -- Samsung Galaxy S22, -21%
update public.products set previous_price = 8499.00 where id = 'b0000000-0000-0000-0000-000000000009'; -- Monitor LG UltraGear 27", -18%
update public.products set previous_price = 1899.00 where id = 'b0000000-0000-0000-0000-000000000012'; -- Router TP-Link Archer AX55, -21%
update public.products set previous_price = 2799.00 where id = 'b0000000-0000-0000-0000-000000000014'; -- SSD Samsung 970 EVO 1TB, -18%
