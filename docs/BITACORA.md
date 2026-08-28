# Bitácora del proyecto MercadoTech

Una sección por sesión, la más reciente primero. Cada fase documenta qué se
construyó, decisiones con su porqué, problemas encontrados (y cómo se
resolvieron) y qué quedó fuera a propósito.

## Sesión 3 — UI Inteligente y Frontend Multimodal (2026-08-24 a 2026-08-27)

### Fase 3.0 — Entorno y herramientas (commit `0542d83`, 2026-08-24)

**Construido:** git inicializado (el proyecto no tenía repo hasta esta
sesión); `lucide-react`, `@dnd-kit/*` y 16 componentes shadcn/ui instalados;
scripts `type-check` y `db:types` agregados a `package.json`.

**Decisión:** `db:types` apunta al proyecto Supabase **remoto**
(`--project-id`), no `--local` — este proyecto corre contra un proyecto
hosted real, no un stack Docker local.

**Fuera de alcance:** nada; fase de solo tooling.

### Fase 3.1 — Tipos, tema y componentes base (commit `067e99e`, 2026-08-24)

**Construido:** `types/database.ts` regenerado desde el proyecto real;
tipos de dominio (`product`, `order`, `user`, `question`, `review`); tokens
de tema claro/oscuro con primario azul eléctrico en `app/globals.css`;
`formatPrice` en `lib/utils.ts`; `remotePatterns` de imágenes; 8 componentes
en `components/shared/`.

**Decisión:** precios en MXN (no soles, como sugería el ejemplo original)
porque el seed usa precios y teléfonos mexicanos.

**Problema:** este proyecto de shadcn usa `@base-ui/react` (no Radix) —
`asChild` no existe, se usa la prop `render`. Encontrado al construir la
página de muestra `/dev/ui`.

**Fuera de alcance:** toggle manual de tema (llegó parcialmente en 3.8 con
`next-themes`, respetando `prefers-color-scheme` del sistema).

### Fase 3.2 — Layouts y rutas (commit `2d82486`, 2026-08-24)

**Construido:** layout raíz (fuentes, `Toaster`, metadata, `lang="es"`);
layouts `(shop)`/`(seller)`/`(auth)`; `Navbar`, `SearchBar`,
`CategoriesMenu`, `CartIndicator`, `UserMenu`, `MobileNav`, `SellerSidebar`,
`NavLink`; las 14 rutas del mapa como placeholders con `EmptyState`.

**Decisión:** panel de vendedor bajo `/vendedor/*` para no chocar con
`/pedidos` del comprador.

**Problema:** un botón que renderiza un `<a>` vía `render` pierde la
semántica nativa de botón salvo que se le pase `nativeButton={false}`
explícito (Base UI lo advierte en consola).

**Fuera de alcance:** conexión real de auth/categorías/carrito al navbar
(llegó en fases siguientes).

### Fase 3.3 — Autenticación (commit `2c1e29f`, 2026-08-24)

**Construido:** migración `handle_new_user_metadata` (el `role` sale de
`raw_user_meta_data`, solo `'buyer'`/`'seller'`, nunca `'admin'`);
`lib/validators/auth.ts`; `services/auth.service.ts`; `hooks/useAuth.ts`;
`LoginForm`/`RegisterForm`; middleware con prefijos protegidos; guard de rol
en `(seller)/layout`.

**Decisión:** el rol se fija SOLO en el trigger de alta porque
`protect_profile_role` (sesión 2) bloquea cambiarlo después de creado.

**Problema:** Supabase Auth rechaza el TLD `.test` en `signUp` real (el
seed lo usa sin problema porque se insertó por SQL directo, sin pasar por
la API de Auth).

**Verificado en vivo contra el proyecto real:** registro con `role`
manipulado a `'admin'` cae a `'buyer'` (probado con SQL directo); login con
usuarios del seed; `buyer1` no puede entrar a `/vendedor`; `seller1` sí.

**Fuera de alcance:** recuperación de contraseña, confirmación de email
(dependen de la configuración del proyecto Supabase, no del código).

### Fase 3.4 — Catálogo (commit `4cbc6f8`, 2026-08-26)

**Construido:** `lib/constants/catalog.ts` y `storage.ts`;
`storage`/`category`/`product` services; `useCategories`/`useProducts`;
`components/catalog/` (`ProductCard`, `ProductGrid`, `FiltersPanel`,
`Pagination`); páginas `/`, `/categoria/[slug]`, `/buscar`.

**Decisión:** búsqueda con `ilike` sobre `title`+`brand`, comentada como
"provisional hasta la sesión 4".

**Verificado en vivo:** 14 productos activos, filtro por categoría,
búsqueda, orden por precio y paginación, todo con datos reales del seed.

**Fuera de alcance:** búsqueda semántica (sesión 4).

### Fase 3.5 — Detalle, preguntas, reseñas, favoritos (commit `e27372b`, 2026-08-26)

**Construido:** `product.service` ampliado (`registerView`);
`question`/`review`/`favorite` services; 5 hooks; `components/product/` (5
componentes); páginas `/producto/[id]` y `/favoritos`.

**Decisión:** las preguntas muestran "Usuario" y las reseñas "Comprador
verificado" porque `profiles` no es legible para terceros (RLS).

**Problema (grave, corregido):** recursión infinita de RLS (`42P17`) entre
`orders_select` y `order_items_select` al leer con un join embebido
(`canReview`) — se detectó probando en vivo. Corregido moviendo las
verificaciones cruzadas a funciones `SECURITY DEFINER`
(`order_belongs_to_buyer`, `order_has_seller_item`), migración
`20260101000019`.

**Verificado en vivo:** una reseña real se publicó de punta a punta tras el
fix; favoritos persiste correctamente.

### Fase 3.6 — Carrito, checkout y pedidos (commit `39e2f27`, 2026-08-26)

**Construido:** `lib/constants/orders.ts`; `cart.service` y `order.service`;
`useCart`/`useOrders`/`useOrder`; `components/cart/` y `components/orders/`;
páginas `/carrito`, `/pedidos`, `/pedidos/[id]`.

**Problema (grave, corregido):** `err instanceof Error` fallaba para
**todos** los errores de Supabase (`PostgrestError` no es instancia de
`Error`), ocultando el mensaje real en cada `catch` de la app y mostrando
siempre un texto genérico. Se agregó `lib/utils.ts::getErrorMessage` (lee
`.message` estructuralmente) y se aplicó en los 14 archivos afectados.

**Verificado en vivo:** suma de cantidad en el carrito; checkout exitoso
con stock descontado y carrito vacío; checkout con stock insuficiente
mostrando el mensaje real de la RPC (`Stock insuficiente para "..."`);
cancelar pedido pendiente; un comprador no puede abrir el pedido de otro.

### Fase 3.7 — Panel de vendedor con drag & drop (commit `e125a48`, 2026-08-27)

**Construido:** `lib/constants/product.ts` y `validators/product.ts`;
`seller.service`; `storage.service` ampliado (`uploadProductImage`,
`deleteProductImage`, `saveImageOrder`); `order.service` ampliado (kanban);
3 hooks; 5 componentes en `components/seller/`; 4 páginas del panel.

**Problema (grave, corregido) — incidente de datos real:**

1. `<Select.Value>` de Base UI muestra el `value` crudo (un UUID, `"recent"`,
   etc.) salvo que se le pase la prop `items` con el mapa valor→etiqueta a
   `Select.Root` — afectaba también a `FiltersPanel` y `RegisterForm` de
   fases anteriores; corregido en los 4 usos.
2. `order_items.product_id` estaba en `ON DELETE SET NULL` (decisión de la
   sesión 2, para preservar snapshots) pero `deleteProduct` asumía
   `ON DELETE RESTRICT` para bloquear el borrado de productos con ventas.
   Con `SET NULL` el borrado se permitía silenciosamente: **un borrado de
   prueba real eliminó "Laptop Dell XPS 13" de la base**, junto con sus 2
   imágenes, 2 preguntas y el favorito de `buyer1`, dejando el pedido
   histórico con `product_id` en `NULL`. Se restauró el producto con los
   valores exactos de `seed.sql`, se re-vinculó el pedido histórico, y se
   corrigió el FK a `RESTRICT` (migración `20260101000020`). Verificado:
   el mismo borrado ahora falla con el código `23503` y el producto
   permanece intacto.

**Verificado en vivo:** publicar producto con imagen subida (path y
extensión correctos, URL pública `200`), editar, borrar sin ventas, y
borrar CON ventas ahora bloqueado.

### Fase 3.8 — Responsive, accesibilidad y checklist (commit `8ce997e`, 2026-08-27)

**Construido:** eliminado `app/dev/ui` (placeholder de 3.1); `EmptyState`
con acción agregado en `/carrito`, `/pedidos`, `/favoritos`; `next-themes`
conectado (`ThemeProvider`); `docs/SESION3_CHECKLIST.md` con una fila por
pantalla.

**Problema (grave, corregido):**

1. `npm run build` fallaba **desde la Fase 3.4** (`useSearchParams` sin
   límite `<Suspense>` en `/`, `/categoria/[slug]`, `/buscar` y `/login`) —
   nunca se había corrido el build de producción hasta esta fase, solo
   `npm run dev`. Corregido envolviendo cada página en `<Suspense>`;
   verificado con `npm run build` (14/14 páginas) y `npm run start` real
   contra el proyecto remoto.
2. Los 14 hooks importaban `lib/supabase` directamente y creaban su propio
   cliente para pasarlo a cada `service`, violando la capa que exige el
   grep de verificación de esta fase. Refactorizados los 14 hooks para
   depender solo de `services/`; `useAuth` (el único que necesita una
   suscripción persistente a `onAuthStateChange`) se resolvió moviendo esa
   suscripción a `services/auth.service.ts::subscribeToAuthChanges`.
   Verificado en vivo que login/sesión/catálogo siguen funcionando.

### Estado de los criterios de aceptación de la sesión

* ✅ Flujo comprador completo (catálogo → detalle → carrito → checkout →
  pedidos) — verificado en vivo contra el proyecto real.
* ✅ Flujo vendedor completo (publicar con imágenes → editar → kanban) —
  verificado en vivo.
* ✅ `npm run lint`, `npm run type-check` y `npm run build` pasan.
* ✅ `grep -rl "@/lib/supabase" components hooks` y
  `grep -rl "from \"@/services" components` dan vacío.

### Deuda técnica y limitaciones conocidas

* Nombres de otros usuarios no son legibles (preguntas muestran "Usuario",
  reseñas "Comprador verificado") — RLS de `profiles` no lo permite; una
  vista `public_profiles` quedó fuera de alcance a propósito.
* Cancelar un pedido no repone el stock automáticamente (advertido en el
  diálogo de confirmación).
* Pedidos multi-vendedor: el total que ve el vendedor es solo el de sus
  ítems, nunca `orders.total`.
* Sin realtime: los cambios de estado de pedido se ven al recargar.
* Las imágenes de `product_images` sembradas por `seed.sql` no existen
  realmente en Storage (gap documentado desde la sesión 2); se corrige
  subiendo imágenes reales desde el panel de vendedor.

### Pendientes heredados

* Sesión 1 no se ejecutó: no existen `docs/COSTOS.md` ni `docs/PROMPTS.md`.
* De la sesión 2: la Fase 2.7 (`docs/ARQUITECTURA.md`) sí se completó. La
  Fase 2.6 se completó como script (`supabase/tests/rls-validation.sql`)
  pero ese script nunca se ejecutó contra una base real (se escribió antes
  de tener el proyecto remoto) — la validación real de RLS terminó
  ocurriendo de facto durante las Fases 3.5–3.8, que es donde se
  encontraron los bugs de recursión y de manejo de errores en vivo.

## Sesión 2 — Arquitectura Escalable y Backend con Supabase (reconstruida a partir de commits, 2026-08-19 a 2026-08-24)

*Reconstruida a partir de commits: la sesión 2 se hizo en un único commit
(`chore: initial commit — Sesión 2 completa`) que agrupa las Fases 2.1–2.7,
sin commits intermedios por fase.*

Entregó: proyecto Next.js 15 + React 19 + Tailwind v4 + shadcn/ui con la
estructura de capas completa; 17 migraciones (esquema de 14 tablas, RLS,
buckets de Storage, función transaccional de checkout); `seed.sql` con 6
usuarios, 8 categorías, 16 productos, pedidos en los 5 estados, preguntas,
reseñas, 10 artículos de FAQ y 2 tickets de soporte; script de validación
RLS; `docs/ARQUITECTURA.md`. Migrado y sembrado contra el proyecto Supabase
remoto `uuvgafxscvukrlzirmao`.

## Sesión 1 — Fundamentos, Setup y Estrategia de Costos

No se ejecutó. No existen `docs/COSTOS.md` ni `docs/PROMPTS.md`.
