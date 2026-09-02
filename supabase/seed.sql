-- seed.sql — datos de prueba para desarrollo local.
-- Se aplica automáticamente con `supabase db reset`.
--
-- IMPORTANTE (gap conocido, documentado desde el día uno — lección de ReadHub):
-- las filas de product_images y profiles.avatar_path referencian rutas de
-- Storage con la convención {owner_id}/... pero los ARCHIVOS NO EXISTEN
-- realmente en los buckets `product-images` / `avatars` hasta que se suban
-- desde la UI (sesión 3). Las URLs públicas de esas imágenes darán 404 hasta
-- entonces; esto es esperado y no indica un bug de la seed.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Usuarios (auth.users + identities). Contraseña de laboratorio para todos:
-- MercadoTech123!
-- profiles se crea automáticamente vía trigger handle_new_user; el role se
-- corrige después porque el trigger siempre inserta con el default 'buyer'.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'buyer1@mercadotech.test', extensions.crypt('MercadoTech123!', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Ana Buyer"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'buyer2@mercadotech.test', extensions.crypt('MercadoTech123!', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Beto Comprador"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'buyer3@mercadotech.test', extensions.crypt('MercadoTech123!', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Carla Cliente"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'seller1@mercadotech.test', extensions.crypt('MercadoTech123!', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"TechStore MX"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'seller2@mercadotech.test', extensions.crypt('MercadoTech123!', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"ElectroHub"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@mercadotech.test', extensions.crypt('MercadoTech123!', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin MercadoTech"}', now(), now(), '', '', '', '');

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', jsonb_build_object('sub', '10000000-0000-0000-0000-000000000001', 'email', 'buyer1@mercadotech.test'), 'email', now(), now(), now()),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', jsonb_build_object('sub', '10000000-0000-0000-0000-000000000002', 'email', 'buyer2@mercadotech.test'), 'email', now(), now(), now()),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', jsonb_build_object('sub', '10000000-0000-0000-0000-000000000003', 'email', 'buyer3@mercadotech.test'), 'email', now(), now(), now()),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', jsonb_build_object('sub', '20000000-0000-0000-0000-000000000001', 'email', 'seller1@mercadotech.test'), 'email', now(), now(), now()),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', jsonb_build_object('sub', '20000000-0000-0000-0000-000000000002', 'email', 'seller2@mercadotech.test'), 'email', now(), now(), now()),
  (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', jsonb_build_object('sub', '30000000-0000-0000-0000-000000000001', 'email', 'admin@mercadotech.test'), 'email', now(), now(), now());

update public.profiles set role = 'seller' where id in ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002');
update public.profiles set role = 'admin' where id = '30000000-0000-0000-0000-000000000001';
update public.profiles set phone = '+52 55 1234 5678' where id = '10000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------------

insert into public.categories (id, name, slug) values
  ('c0000000-0000-0000-0000-000000000001', 'Laptops', 'laptops'),
  ('c0000000-0000-0000-0000-000000000002', 'Smartphones', 'smartphones'),
  ('c0000000-0000-0000-0000-000000000003', 'Componentes de PC', 'componentes-de-pc'),
  ('c0000000-0000-0000-0000-000000000004', 'Audio', 'audio'),
  ('c0000000-0000-0000-0000-000000000005', 'Gaming', 'gaming'),
  ('c0000000-0000-0000-0000-000000000006', 'Monitores', 'monitores'),
  ('c0000000-0000-0000-0000-000000000007', 'Accesorios', 'accesorios'),
  ('c0000000-0000-0000-0000-000000000008', 'Redes', 'redes');

-- ---------------------------------------------------------------------------
-- Productos — 16 en total, 8 por vendedor. p07 con stock 0, p08 y p16
-- inactivos (para probar filtros y validación de checkout).
-- ---------------------------------------------------------------------------

insert into public.products (id, seller_id, category_id, title, description, brand, condition, price, stock, is_active) values
  ('b0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Laptop Dell XPS 13', 'Ultrabook de 13 pulgadas, pantalla InfinityEdge, ideal para productividad.', 'Dell', 'nuevo', 18999.00, 12, true),
  ('b0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Laptop Lenovo ThinkPad E14', 'Equipo corporativo confiable, teclado retroiluminado, batería de larga duración.', 'Lenovo', 'usado', 9999.00, 5, true),
  ('b0000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'iPhone 13 128GB', 'Reacondicionado certificado, batería con 90%+ de salud, incluye cable USB-C.', 'Apple', 'reacondicionado', 8999.00, 7, true),
  ('b0000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Samsung Galaxy S22', 'Pantalla AMOLED 120Hz, cámara triple, 5G.', 'Samsung', 'nuevo', 10999.00, 4, true),
  ('b0000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Tarjeta gráfica RTX 4070', '12GB GDDR6X, ray tracing, ideal para gaming 1440p.', 'NVIDIA', 'nuevo', 11999.00, 6, true),
  ('b0000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Memoria RAM Corsair 16GB', 'DDR4 3200MHz, kit de 2x8GB, disipador de aluminio.', 'Corsair', 'nuevo', 899.00, 30, true),
  ('b0000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Audífonos Sony WH-1000XM4', 'Cancelación de ruido líder en su categoría, 30h de batería.', 'Sony', 'nuevo', 5999.00, 0, true),
  ('b0000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'Teclado mecánico Logitech G Pro', 'Switches GX Blue, formato TKL, para esports.', 'Logitech', 'nuevo', 1899.00, 15, false),
  ('b0000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 'Monitor LG UltraGear 27"', 'QHD 165Hz, 1ms, panel IPS, compatible con G-Sync.', 'LG', 'nuevo', 6999.00, 10, true),
  ('b0000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 'Monitor Samsung Odyssey 32"', 'Curvo VA, 165Hz, HDR10, ideal para gaming inmersivo.', 'Samsung', 'nuevo', 9999.00, 3, true),
  ('b0000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'Mouse Razer DeathAdder', 'Sensor óptico 20K DPI, ergonómico, cable trenzado.', 'Razer', 'nuevo', 799.00, 25, true),
  ('b0000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 'Router TP-Link Archer AX55', 'WiFi 6, doble banda, hasta 6 dispositivos simultáneos sin pérdida de velocidad.', 'TP-Link', 'nuevo', 1499.00, 8, true),
  ('b0000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 'Switch Ethernet Netgear 8 puertos', 'Gigabit no administrable, carcasa metálica, plug and play.', 'Netgear', 'nuevo', 899.00, 12, true),
  ('b0000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'SSD Samsung 970 EVO 1TB', 'NVMe M.2, velocidades de lectura hasta 3500MB/s.', 'Samsung', 'nuevo', 2299.00, 20, true),
  ('b0000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'Consola Xbox Series S', '1TB, incluye un control inalámbrico, todo digital.', 'Microsoft', 'usado', 6499.00, 4, true),
  ('b0000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'Bocina JBL Flip 6', 'Resistente al agua IP67, 12h de batería, sonido estéreo con otra unidad.', 'JBL', 'reacondicionado', 1599.00, 9, false);

-- ---------------------------------------------------------------------------
-- Imágenes de producto (2 por producto). Rutas coherentes con la convención
-- del bucket {seller_id}/{product_id}/{n}.{ext}; los archivos aún no existen
-- en Storage (ver nota al inicio del archivo).
-- ---------------------------------------------------------------------------

insert into public.product_images (product_id, image_path, position)
select p.id, p.seller_id::text || '/' || p.id::text || '/1.jpg', 0 from public.products p
union all
select p.id, p.seller_id::text || '/' || p.id::text || '/2.jpg', 1 from public.products p;

-- ---------------------------------------------------------------------------
-- Carrito de muestra (no forma parte de los pedidos sembrados).
-- ---------------------------------------------------------------------------

insert into public.cart_items (user_id, product_id, quantity) values
  ('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 1),
  ('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000012', 2);

-- ---------------------------------------------------------------------------
-- Pedidos — al menos uno por cada estado, con order_items y snapshots.
-- ---------------------------------------------------------------------------

insert into public.orders (id, buyer_id, status, total) values
  ('00000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'pendiente', 18999.00),
  ('00000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'pagado', 1798.00),
  ('00000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'enviado', 6999.00),
  ('00000001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'entregado', 9798.00),
  ('00000001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'entregado', 2299.00),
  ('00000001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'cancelado', 10999.00);

insert into public.order_items (order_id, product_id, seller_id, title_snapshot, price_snapshot, quantity) values
  ('00000001-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Laptop Dell XPS 13', 18999.00, 1),
  ('00000001-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'Memoria RAM Corsair 16GB', 899.00, 2),
  ('00000001-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'Monitor LG UltraGear 27"', 6999.00, 1),
  ('00000001-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'iPhone 13 128GB', 8999.00, 1),
  ('00000001-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'Mouse Razer DeathAdder', 799.00, 1),
  ('00000001-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000002', 'SSD Samsung 970 EVO 1TB', 2299.00, 1),
  ('00000001-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Samsung Galaxy S22', 10999.00, 1);

-- ---------------------------------------------------------------------------
-- Preguntas — mínimo 6, algunas respondidas, otras no.
-- ---------------------------------------------------------------------------

insert into public.questions (product_id, user_id, question, answer, answered_at) values
  ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '¿Incluye el cargador original?', 'Sí, se entrega con el cargador original de 45W de Dell.', now()),
  ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '¿Tiene garantía?', null, null),
  ('b0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '¿El iPhone viene con caja?', 'Viene en caja genérica, no la original, pero con todos los accesorios funcionales.', now()),
  ('b0000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '¿Cuánto tarda el envío a Guadalajara?', 'El envío estándar tarda de 3 a 5 días hábiles.', now()),
  ('b0000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', '¿Tiene soporte VESA para montar en brazo?', null, null),
  ('b0000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', '¿Es compatible con PS5?', 'Sí, es compatible siempre que la ranura M.2 tenga disipador o heatsink.', now()),
  ('b0000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '¿Cuándo vuelve a haber stock?', null, null),
  ('b0000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', '¿Es inalámbrico o con cable?', 'Es un mouse con cable trenzado, sin versión inalámbrica.', now());

-- ---------------------------------------------------------------------------
-- Reseñas — solo sobre pedidos 'entregado' (coherentes con la política RLS).
-- ---------------------------------------------------------------------------

-- Nota: p11 (Mouse Razer DeathAdder) queda deliberadamente sin reseña aunque
-- también fue entregado en el pedido 004 — lo usa rls-validation.sql (Fase
-- 2.6) para probar un INSERT exitoso sin chocar con unique(product_id, buyer_id).
insert into public.reviews (product_id, buyer_id, order_id, rating, comment) values
  ('b0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000004', 5, 'Excelente estado, tal como se describía. Llegó antes de lo esperado.'),
  ('b0000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000005', 5, 'Muy rápido, la instalación fue sencilla.');

-- ---------------------------------------------------------------------------
-- Favoritos y vistas de producto
-- ---------------------------------------------------------------------------

insert into public.favorites (user_id, product_id) values
  ('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007'),
  ('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009'),
  ('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000014'),
  ('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003');

insert into public.product_views (product_id, user_id, viewed_at) values
  ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', now() - interval '3 days'),
  ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', now() - interval '2 days'),
  ('b0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', now() - interval '1 day'),
  ('b0000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', now() - interval '5 hours'),
  ('b0000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', now() - interval '1 hour');

-- ---------------------------------------------------------------------------
-- Artículos de soporte (FAQ) — base del RAG de la sesión 4. Contenido real,
-- no lorem ipsum, 2-4 párrafos cada uno.
-- ---------------------------------------------------------------------------

insert into public.support_articles (title, content, category) values
(
  '¿Cuánto tarda en llegar mi pedido?',
  E'El tiempo de entrega depende de la ubicación del vendedor y la tuya. En envíos nacionales estándar, el tiempo habitual es de 3 a 5 días hábiles a partir de que el vendedor confirma el envío. Para zonas metropolitanas de las principales ciudades, algunos vendedores ofrecen entrega en 24-48 horas.\n\nPuedes seguir el estado de tu pedido desde la sección "Mis pedidos", donde verás el estado actual: pendiente, pagado, enviado, entregado o cancelado. En cuanto el vendedor marca el pedido como enviado, recibirás una notificación.\n\nSi tu pedido lleva más de 7 días hábiles en estado "enviado" sin actualizarse, te recomendamos contactar primero al vendedor mediante la sección de preguntas del producto y, si no obtienes respuesta en 48 horas, abrir un ticket de soporte.',
  'envíos'
),
(
  '¿MercadoTech cubre los gastos de envío?',
  E'El costo de envío lo define cada vendedor de forma independiente y se muestra de forma clara antes de confirmar la compra, dentro del resumen del carrito. Algunos vendedores ofrecen envío gratuito en compras que superan cierto monto; esto se indica directamente en la ficha del producto.\n\nMercadoTech no subsidia ni cobra comisión adicional sobre el envío: el monto que ves es exactamente el que cobra el vendedor por el servicio de paquetería que utiliza.',
  'envíos'
),
(
  '¿Qué hago si mi pedido llegó dañado o incompleto?',
  E'Si tu pedido llega con daños físicos o falta algún artículo, no rechaces el paquete: primero documenta el problema con fotos claras del producto, el empaque y la etiqueta de envío. Esta evidencia es indispensable para procesar cualquier reclamo.\n\nCon las fotos listas, abre un ticket de soporte seleccionando el pedido correspondiente y describe el problema. Nuestro equipo (o el agente de voz, si prefieres ese canal) revisará el caso junto con el vendedor y te indicará si corresponde reposición, reembolso parcial o devolución completa.\n\nEl plazo para reportar daños o faltantes es de 5 días naturales a partir de la fecha de entrega registrada en el sistema.',
  'envíos'
),
(
  '¿Qué métodos de pago acepta MercadoTech?',
  E'Aceptamos tarjetas de crédito y débito de las principales redes, así como transferencia bancaria directa al confirmar tu pedido. El cargo se procesa una sola vez, al momento de crear el pedido a partir de tu carrito.\n\nNo almacenamos los datos completos de tu tarjeta en nuestros servidores: el procesamiento del pago se realiza a través de un proveedor externo certificado, y nosotros solo guardamos una referencia de la transacción.',
  'pagos'
),
(
  '¿Por qué mi pedido quedó en estado "pendiente" después de pagar?',
  E'Un pedido permanece en estado "pendiente" hasta que el sistema confirma que el pago fue autorizado exitosamente por el banco o procesador de pagos; este proceso normalmente toma solo unos segundos, pero en ocasiones puede tardar unos minutos si el banco emisor realiza validaciones adicionales.\n\nSi han pasado más de 30 minutos y tu pedido sigue en "pendiente", revisa que no haya un cargo duplicado en tu estado de cuenta y luego abre un ticket de soporte adjuntando el número de pedido para que podamos verificar el estado con el procesador de pagos.',
  'pagos'
),
(
  '¿Puedo pagar en abonos o meses sin intereses?',
  E'La disponibilidad de meses sin intereses depende del banco emisor de tu tarjeta y de promociones vigentes, y se muestra automáticamente como opción al momento de pagar si tu tarjeta califica. MercadoTech no ofrece un sistema propio de abonos fuera de las promociones bancarias disponibles en el checkout.',
  'pagos'
),
(
  '¿Cuál es la política de devoluciones?',
  E'Puedes solicitar la devolución de un producto dentro de los 15 días naturales posteriores a la entrega, siempre que el artículo esté en las mismas condiciones en que lo recibiste, con su empaque y accesorios originales. Productos usados o reacondicionados también aplican para devolución bajo esta misma ventana, salvo que el vendedor indique lo contrario explícitamente en la descripción.\n\nPara iniciar una devolución, ve a "Mis pedidos", selecciona el pedido en cuestión y abre un ticket de soporte indicando el motivo. El vendedor tiene hasta 3 días hábiles para responder con las instrucciones de devolución.\n\nUna vez que el vendedor confirma la recepción del producto devuelto en buen estado, el reembolso se procesa en un plazo de 5 a 10 días hábiles, dependiendo de tu banco.',
  'devoluciones'
),
(
  '¿Quién paga el envío de una devolución?',
  E'Si la devolución se debe a un error del vendedor (producto incorrecto, dañado de fábrica o muy distinto a la descripción), el costo del envío de regreso corre por cuenta del vendedor. Si la devolución es por cambio de opinión del comprador y el producto no presenta ningún problema, el costo del envío de regreso corre por cuenta del comprador, salvo que el vendedor ofrezca devoluciones gratuitas como parte de su política.',
  'devoluciones'
),
(
  '¿Puedo cancelar un pedido antes de que lo envíen?',
  E'Sí. Mientras tu pedido esté en estado "pendiente", puedes cancelarlo directamente desde "Mis pedidos" sin necesidad de justificación ni de contactar al vendedor. Una vez que el pedido cambia a "pagado" o etapas posteriores, la cancelación directa ya no está disponible y debes solicitarla mediante un ticket de soporte, ya que el vendedor podría estar preparando el envío.',
  'devoluciones'
),
(
  '¿Cómo cambio mi rol de comprador a vendedor?',
  E'El rol de tu cuenta (comprador, vendedor o administrador) no puede modificarse directamente desde tu perfil por motivos de seguridad; solo un administrador puede realizar este cambio. Si quieres empezar a vender en MercadoTech, abre un ticket de soporte con el asunto "Solicitud de cuenta vendedor" indicando el nombre de tu negocio o marca, y un administrador validará y activará tu cuenta.\n\nUna vez activada, tendrás acceso al panel de vendedor desde donde podrás publicar productos, gestionar tu inventario y responder preguntas de compradores.',
  'cuenta'
);

-- ---------------------------------------------------------------------------
-- Tickets de soporte con mensajes.
-- ---------------------------------------------------------------------------

insert into public.support_tickets (id, user_id, subject, status, channel) values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'No he recibido mi pedido enviado hace una semana', 'en_proceso', 'chat'),
  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Se me cobró dos veces por el mismo pedido', 'abierto', 'voz');

insert into public.ticket_messages (ticket_id, sender_role, content) values
  ('a0000000-0000-0000-0000-000000000001', 'usuario', 'Hola, mi pedido del Monitor LG UltraGear lleva 8 días marcado como "enviado" y no tengo número de rastreo. ¿Pueden ayudarme?'),
  ('a0000000-0000-0000-0000-000000000001', 'agente', 'Gracias por escribirnos. Estoy revisando tu pedido con el vendedor para conseguir el número de guía; te confirmo en breve.'),
  ('a0000000-0000-0000-0000-000000000001', 'humano', 'El vendedor confirmó que el paquete salió con retraso de la paquetería. Te comparto el número de guía por correo y damos seguimiento diario hasta la entrega.'),
  ('a0000000-0000-0000-0000-000000000002', 'usuario', 'Veo dos cargos idénticos en mi tarjeta por el mismo pedido del iPhone 13, ¿me pueden confirmar si es un error?'),
  ('a0000000-0000-0000-0000-000000000002', 'agente', 'Entiendo la preocupación, vamos a verificar con el procesador de pagos si se generó una duplicidad en la transacción y te contactamos con el resultado.');

-- ---------------------------------------------------------------------------
-- previous_price para "Bajaron de precio esta semana" (Home).
--
-- La migración 20260101000025 ya trae estos mismos UPDATE, con el comentario
-- "no se toca seed.sql" — pero esa migración corre ANTES de este archivo en
-- cualquier `supabase db reset` (migraciones primero, seed.sql al final), así
-- que en un reset limpio (CI, un dev nuevo) los UPDATE de la migración no
-- encuentran filas todavía y no hacen nada: previous_price queda NULL para
-- todos y el Home no muestra ningún producto. En el proyecto remoto "funcionó"
-- porque los productos ya existían cuando esa migración se aplicó con
-- `db push`. Se repite aquí (idempotente, mismos IDs y valores) para que un
-- reset limpio quede igual que el remoto — encontrado por el job e2e de CI
-- (Fase 6.7): home.spec.ts no encontraba ningún data-testid="product-card".
update public.products set previous_price = 23999.00 where id = 'b0000000-0000-0000-0000-000000000001'; -- Laptop Dell XPS 13, -21%
update public.products set previous_price = 13999.00 where id = 'b0000000-0000-0000-0000-000000000004'; -- Samsung Galaxy S22, -21%
update public.products set previous_price = 8499.00 where id = 'b0000000-0000-0000-0000-000000000009'; -- Monitor LG UltraGear 27", -18%
update public.products set previous_price = 1899.00 where id = 'b0000000-0000-0000-0000-000000000012'; -- Router TP-Link Archer AX55, -21%
update public.products set previous_price = 2799.00 where id = 'b0000000-0000-0000-0000-000000000014'; -- SSD Samsung 970 EVO 1TB, -18%
