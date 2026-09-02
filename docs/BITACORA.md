# Bitácora del proyecto MercadoTech

Una sección por sesión, la más reciente primero. Cada fase documenta qué se
construyó, decisiones con su porqué, problemas encontrados (y cómo se
resolvieron) y qué quedó fuera a propósito.

## Sesión 6 — Testing y CI (2026-09-01)

*Nota de alcance:* el "Estado del repositorio al iniciar la sesión" de
`PROMPTS_sesion6.md` asume un cierre previo de Sesión 5 (commit `eed65ff`,
4 Skills activas, carpeta `mcp/` con su propio type-check). Verificado
contra `git log`: **este repo no tiene Sesión 5** — no existe `mcp/`, no
existe ese commit, y solo hay 3 Skills reales (`analista-negocio`,
`planificacion-por-fases`, `web-scraping`). Tampoco hay un cierre formal
de Sesión 4 en esta bitácora (se ejecutó — commits `4cda952`..`cdeffef` —
pero nunca se le agregó su sección; queda como pendiente heredado, fuera
del alcance de esta sesión). Esta sesión 6 arrancó directamente sobre el
commit `bd8ae49` (rediseño visual, ajeno al plan de fases) sin remoto de
GitHub configurado: el Prompt 0 tuvo que crear el repositorio, conectar
`origin` y hacer el primer push antes de instalar Vitest/Playwright.

### Fase 6.0–6.1 — GitHub remoto + infraestructura Vitest (commits `c004dc8`, `b92520e`)

**Construido:** repo conectado a GitHub (`Andymtz28/MercadoTech`) y
primer push; `vitest.config.mts` (alias `@` → raíz, `environment: "node"`,
cobertura v8 limitada a `lib/**`/`services/**`); scripts `test`,
`test:watch`, `test:coverage`.

**Decisión:** `environment: "node"` sin jsdom/Testing Library — esta
sesión testea lógica y servicios, no componentes (decisión ya tomada en
la spec).

### Fase 6.2 — Tests de lógica pura (commit `1cf2d1f`)

**Construido:** `lib/validators/auth.test.ts`, `lib/validators/product.test.ts`,
`lib/utils.test.ts`, `lib/ai/context-builder.test.ts`, `lib/ai/prompts.test.ts`
— 47 tests. Cobertura real (HTML report, `coverage/lib/validators/index.html`
y `coverage/lib/ai/context-builder.ts.html`): **100 % líneas/ramas/funciones**
en `lib/validators/` y en `context-builder.ts` — meta de la fase cumplida.

**Problema (menor, corregido):** un comentario en `lib/utils.ts` estaba
colgado sobre la función equivocada (documentaba `getErrorMessage` pero
aparecía encima de `getMonogram`); se reubicó al escribir su test.

**Fuera de alcance real:** el branch `remaining <= 0` al inicio del loop
de presupuesto de `context-builder.ts` no se cubría con el primer intento
de test (un candidato de 10 caracteres se filtraba antes de llegar al
loop por `CONTEXT_BUILDER_MIN_CONTENT_LENGTH`); se ajustó a un candidato
de 25 caracteres para ejercer la rama real.

### Fase 6.3 — Services con Supabase mockeado (commit `8a1834e`)

**Construido:** `services/test-utils/supabase-mock.ts` (fábrica
encadenable programable + `findInvokedChain`); 14 archivos de test
(`cart`, `order`, `product`, `seller`, `review`, `question`, `favorite`,
`auth`, `embedding`, `vector-search`, `chat`, `category`, `home`,
`storage`, `indexing-trigger`) — 138 tests. Cobertura real de `services/`:
**99.29 % líneas, 92.11 % statements, 80.12 % branches, 98.9 % funciones**
(meta de la fase: ≥80 % líneas, superada). `canAdvance` (antes helper
privado de `hooks/useSellerOrders.ts`) se exportó para testearlo sin
React — único cambio de producción permitido en esta fase.

**Comportamiento real anclado (no "corregido"), tal como exige la fase:**

* `cart.service.addItem` SUMA el duplicado y recorta a `[1, stock]` — no
  rechaza cantidades inválidas con un piso de 1 (una cantidad de 0 se
  guarda literalmente como 0).
* `canAdvance(from, to)` usa `ORDER_STATUS_FLOW.indexOf`: como
  `indexOf` de un valor no encontrado da `-1`, `canAdvance("cancelado",
  "pendiente")` da `true` (y cualquier estado desconocido → "pendiente"
  también), porque `-1 + 1 === indexOf("pendiente")`. Documentado como
  bug real en el test, no corregido (fuera del alcance de esta sesión).
* `useSellerOrders.moveOrder` rechaza una transición inválida en
  silencio: no dispara ningún toast de error (la spec original asumía
  que sí).
* `checkout()` vive en `cart.service.ts`, no en `order.service.ts`;
  `updateOrderStatus`/`listSellerOrders` viven en `order.service.ts`, no
  en `seller.service.ts` (que no tiene funciones de pedidos). Los
  archivos de test se organizaron según esta estructura real, no la que
  asumía la spec.

**Verificado:** la suite completa pasa con el stack de Supabase
(Docker/local) apagado — ningún test depende de red real.

### Fase 6.4 — Infraestructura Playwright (commit `2055901`)

**Construido:** `playwright.config.ts` (build&&start en CI, dev server
reutilizado en local, chromium-only en CI); `e2e/data/`, `e2e/fixtures/`,
7 Page Objects; `data-testid` agregados a 6 componentes (`ProductCard`,
`CartItemRow`, `CartSummary`, `OrdersKanban`, `OrderKanbanCard`,
`SortableImageGallery`) — solo atributos, cero cambios de lógica/estilo;
`Price` extendido para reenviar props de `<span>` (necesario para pasar
`data-testid` desde los componentes que lo envuelven).

**Problema (corregido, dato del seed):** el producto sin stock listado en
la spec (`b0000000-…-06`) no es el real — verificado con `grep` contra
`supabase/seed.sql`, el producto con stock 0 es `…-07` (el propio archivo
lo marca con un comentario). Corregido en `e2e/data/users.ts`.

### Fase 6.5–6.6 — E2E comprador y vendedor (commits `6bdc54b`, `50f1b09`)

**Construido:** `buyer-flow.spec.ts` + `buyer-negative.spec.ts` (login →
filtrar → comprar → ver pedido; stock 0 deshabilitado; carrito vacío;
anónimo redirigido); `seller-flow.spec.ts` + `seller-negative.spec.ts`
(publicar producto con imagen de fixture → aparece en tabla y catálogo →
mover pedido `pagado` → `enviado` **por teclado** — foco en el asa →
`Space` → flecha → `Space` — persiste tras `reload`; comprador ve
"Enviado" en su detalle; `buyer1` rechazado en `/vendedor`; retroceder
`enviado` → `pagado` rechazado). 24 tests enumerados (`playwright test
--list`) — 8 specs × 3 navegadores.

**Problema (corregido, dato del seed):** el único pedido `enviado` del
seed pertenece a `seller2`, no a `seller1` — `seller-negative.spec.ts`
mueve primero `SEED_PAID_ORDER_ID` (un pedido real de `seller1`) a
`enviado` antes de probar el retroceso ilegal, en vez de asumir un
pedido `enviado` preexistente de ese vendedor (esto obliga a correr esa
suite con `workers: 1` para no chocar con otro test que dependa del mismo
pedido).

**Sin verificar en vivo dentro de esta sesión:** no hay stack Docker
local disponible en este entorno — los specs se escribieron y se
enumeraron (`--list`), pero su ejecución real contra un navegador y
Supabase local se verificó por primera vez en el job `e2e` de GitHub
Actions (Fase 6.7), que sí tiene Docker.

### Fase 6.7 — CI en GitHub Actions (commits `78157e7`, `9866078`)

**Construido:** `.github/workflows/ci.yml` con jobs `checks` (lint,
type-check, `test:coverage`) y `e2e` (`needs: checks`; stack de Supabase
local vía `supabase/setup-cli@v1`; credenciales leídas dinámicamente con
`supabase status -o json`, no como secretos — son las claves estándar de
cualquier instancia local); `"packageManager": "npm@10.9.2"`.

**Decisiones corregidas contra el entorno real** (la spec asumía valores
de otro proyecto):

| Asumido por la spec | Valor real verificado | Acción |
|---|---|---|
| `npm@11.6.2` | `npm --version` local → `10.9.2` | Pin y `packageManager` con el valor real |
| Node 24 | `node --version` local → `v22.16.0` | `setup-node` con `node-version: 22` |
| Type-check de `mcp/` en el job `checks` | no existe `mcp/` en este repo | Paso omitido, documentado en un comentario del propio `ci.yml` |

**Problema (grave, corregido) — CI run #1 rojo:** `Cannot find name
'LayoutProps'` en los 4 layouts (`app/layout.tsx`, `app/(shop)/layout.tsx`,
`app/(seller)/layout.tsx`, `app/(auth)/layout.tsx`). Causa real:
`LayoutProps<...>` es un tipo ambiente que Next.js genera en
`.next/types/routes.d.ts` solo después de correr `next dev`/`next build`
al menos una vez — localmente "funcionaba" porque `.next/` ya existía de
sesiones previas de `next dev`; un checkout limpio de CI nunca lo genera.
Se descubrió `next typegen` (subcomando de Next 15 que genera esos tipos
sin build completo) y se cambió `type-check` a `"next typegen && tsc
--noEmit"` (commit `9866078`). Este bug era invisible en local desde el
principio del proyecto — el primer checkout limpio real fue el del
runner de CI.

**Estado de las corridas en GitHub Actions:**

* Corrida #1 (`78157e7`): roja — bug de `LayoutProps` de arriba.
* Corrida #2 (`9866078`, fix de `next typegen`): job `checks` **verde**;
  job `e2e` **rojo** — primera ejecución real de los specs contra
  Supabase local. 7 de 8 tests fallaron.
* Corrida #3 (`a8d0999`, fix del badge del carrito): job `checks`
  **verde**; job `e2e` **rojo de nuevo**, mismos 7 tests — el fix era
  correcto pero insuficiente por sí solo (ver el problema 2 abajo).
* Corridas #4, #5 y #6: ver el resto de esta sección — terminan con
  **ambos jobs verdes** (corrida #6, commit `9f4ced6`).

Diagnosticar el job `e2e` requirió pedirle al usuario que copiara el log
manualmente: GitHub exige sesión iniciada para ver logs de Actions
incluso en un repo público, y ni el navegador de este agente ni la
extensión Claude in Chrome tenían esa sesión disponible.

**Problema 1 (grave, corregido) — el badge del carrito no se sincroniza:**
`hooks/useCart.ts` crea estado local independiente cada vez que se
llama — el layout `(shop)` (navbar), `/carrito`, `/producto/[id]` y
`/buscar` tienen CADA UNO su propia instancia con su propio
`items`/`count`. Mutar el carrito desde una página nunca notificaba a
las demás instancias montadas, así que el contador del navbar quedaba
con el número viejo hasta un refresh completo — un bug real de UX que
ningún test unitario podía atrapar (depende de dos componentes montados
a la vez). Corregido con `subscribeToCartChanges` en `cart.service.ts`
(mismo patrón que `subscribeToAuthChanges`, pero a nivel de módulo
porque `cart_items` no tiene Realtime de Postgres activado). Commit
`a8d0999`.

**Problema 2 (test, corregido) — rol accesible real de los enlaces-botón:**
Con el badge YA sincronizando, el mismo test seguía fallando. Se
reprodujo localmente (`npx playwright test` apuntando al dev server
contra el proyecto remoto, sin tocar Supabase local) y el snapshot de
accesibilidad de Playwright reveló la causa real: `CartIndicator` y el
"Iniciar sesión" anónimo de `UserMenu` son
`<Button nativeButton={false} render={<Link/>}>` de Base UI — el DOM es
un `<a>` real que navega bien, pero Base UI expone rol **"button"** en
el árbol de accesibilidad, no "link" (ni siquiera con
`nativeButton={false}`, a diferencia de lo que sugiere la nota de la
Fase 3.2). Los specs usaban `getByRole("link", ...)`. Corregido en
`buyer-flow.spec.ts` (2 asserts).

**Problema 3 (test, corregido) — carrera de login sin esperar el redirect:**
`LoginPage.login()` hacía clic en "Iniciar sesión" y retornaba de
inmediato, sin esperar el `router.push()` posterior al login exitoso.
Varios tests navegaban a la siguiente página ANTES de que la sesión
quedara establecida, cayendo como anónimos: esto explica
`seller-negative.spec.ts` viendo `/login?redirectTo=...` donde esperaba
`/` (buyer1 nunca llegó autenticado), y muy probablemente los timeouts de
`seller-flow.spec.ts` (heading nunca aparece: `/vendedor/productos`
redirige a login) y del kanban en `seller-negative.spec.ts` (la página
de pedidos tampoco carga sin sesión). Corregido con
`page.waitForURL(url => !url.pathname.startsWith("/login"))` dentro de
`LoginPage.login()` — arregla la carrera para las 4 fases que dependen
del login (6.5, 6.6 y ambos negativos) desde un solo lugar.

**Problema 4 (test, corregido) — regex sin anclar en `disabledReason`:**
`buyer-negative.spec.ts` (producto sin stock) violaba el "strict mode" de
Playwright: el regex `/Sin stock/` (sin anclar) matcheaba TANTO el motivo
deshabilitado ("Sin stock", en `BuyBox.tsx`) COMO el label de
disponibilidad ("Sin stock **disponible**", el mismo componente, dos
párrafos distintos) porque el segundo contiene al primero como
substring. Corregido anclando con `^(...)$` en
`ProductPage.disabledReason`.

**Problema 5 (dato, corregido) — `previous_price` no sobrevive un reset
limpio:** `home.spec.ts` no encontraba ningún `data-testid="product-card"`
porque la sección "Bajaron de precio" del Home queda vacía. Causa real:
la migración `20260101000025` fija `previous_price` con `UPDATE ...
WHERE id = ...`, pero en cualquier `supabase db reset` las migraciones
corren ANTES que `seed.sql` — el `UPDATE` se ejecuta contra una tabla
`products` todavía vacía y no actualiza ninguna fila. En el proyecto
remoto "funcionó" porque los productos ya existían cuando esa migración
se aplicó con `db push` (nunca hubo un reset completo ahí). Corregido
repitiendo los mismos 5 `UPDATE` al final de `seed.sql` (idempotente,
mismos IDs/valores) para que un reset limpio quede igual que el remoto.

**Corrida #4 (`a87716c`, con los 5 problemas de arriba):** job `checks`
verde; job `e2e` bajó de 7 a **2** tests rojos — confirma que los
diagnósticos de arriba eran correctos. Los 2 que quedaron llevaron a dos
bugs REALES de producción más, encontrados igual por Playwright:

**Problema 6 (grave, corregido) — el menú de usuario estaba roto para
TODOS los usuarios:** `logout → navbar anónimo` colgaba 30s esperando el
ítem "Cerrar sesión". Reproducido localmente (dev server contra el
proyecto remoto): al abrir el menú, Next.js mostraba un Runtime Error de
Base UI — `MenuGroupContext is missing. Menu group parts must be used
within <Menu.Group> or <Menu.RadioGroup>` — porque `UserMenu.tsx` usaba
`DropdownMenuLabel` (que internamente es `Menu.GroupLabel`) SIN envolverlo
en `DropdownMenuGroup`, un requisito de Base UI que Radix no tiene. El
crash rompía TODO el contenido del menú, no solo el label. Nadie lo había
notado porque ninguna prueba manual anterior había abierto el menú de
usuario. Corregido envolviendo el label en `DropdownMenuGroup`.

**Problema 7 (grave, corregido) — "Cerrar sesión" nunca cerraba la
sesión:** con el crash de arriba resuelto, el menú abría bien pero el
clic en "Cerrar sesión" no hacía nada — la sesión seguía activa. Causa:
`DropdownMenuItem onSelect={onLogout}` usa `onSelect`, que en Base UI
`Menu.Item` NO es un evento de selección de ítem (como en Radix) sino el
evento nativo de HTML para selección de TEXTO — nunca se dispara en un
`<div>` no editable, así que `onLogout` jamás se ejecutaba. TypeScript no
lo marcó porque `onSelect` es una prop válida de `HTMLAttributes`, solo
que la equivocada. Corregido cambiando a `onClick={onLogout}` (la prop
real de `Menu.Item`). Este bug significa que, en producción, ningún
usuario podía cerrar sesión desde el menú del navbar antes de este fix.

**Problema 8 (test, corregido) — `CatalogPage.goto()` apunta al Home
rediseñado, no a un catálogo:** `seller-flow.spec.ts` publicaba un
producto y luego no lo encontraba en "el catálogo público". Causa: la
Fase 6.4 escribió `CatalogPage.goto()` como `page.goto("/")` asumiendo
(sin verificar) que el Home listaba todo el catálogo — cierto en la
Sesión 3, pero el rediseño de UX (anterior a esta sesión, commit
`d9d0543`) reemplazó esa lista por las secciones curadas "Bajaron de
precio" y "Mejor calificados", que un producto recién publicado nunca
integra (sin `previous_price` ni reseñas). `buyer-flow.spec.ts` no sufría
esto porque ya filtraba por categoría antes de buscar el producto.
Corregido agregando el mismo `catalog.filterByCategory("Audio")` en
`seller-flow.spec.ts`, verificado publicando un producto real contra el
proyecto remoto y confirmando que aparece en `/categoria/audio` (limpiado
después con `DELETE` directo — el `window.confirm()` nativo de "Eliminar"
no se puede automatizar desde este navegador).

**Corrida #5 (`96fae46`, con los problemas 6-8):** job `checks` verde;
job `e2e` bajó a **1** test rojo — confirma los problemas 6 y 7 (los más
graves de la sesión) y deja ver un último problema, distinto:

**Problema 9 (test, corregido) — el panel de vendedor no tiene navbar:**
El último paso de `seller-flow.spec.ts` (cerrar sesión como vendedor,
entrar como comprador, ver el pedido "Enviado") colgaba 30s buscando el
botón "Menú de..." — pero `app/(seller)/layout.tsx` usa `SellerSidebar`,
NO `Navbar`/`UserMenu`: ese botón simplemente no existe en
`/vendedor/pedidos` (ni en ninguna otra ruta de `/vendedor/*`). Otro caso
de la Fase 6.6 asumiendo que el navbar estaba en todas las páginas sin
verificarlo. Corregido con `page.goto("/")` antes de abrir el menú —
mismo patrón que ya usa `SellerSidebar` con su propio link "Volver a la
tienda".

**Corrida #6 (`9f4ced6`, con el problema 9): ✅ AMBOS jobs verdes** —
`checks` en 36s, `e2e` en 249s (4m 9s). Fase 6.7 cerrada de verdad: 5
corridas, 9 problemas reales encontrados y corregidos (3 bugs de
producción: sincronización del carrito, crash del menú de usuario,
logout no funcional; 6 correcciones a los tests que asumían estructura
de UI/datos sin haberla verificado nunca, porque no había Docker local
en este entorno hasta que CI lo proveyó).

### Fase 6.8 — Debugging y gate de validación (commit `828d80c`)

**Construido:** `docs/DEBUGGING.md` (flujo síntoma→reproducir→logs→
hipótesis→fix; catálogo de errores reales con mensaje literal — RLS,
GRANT, recursión de policy, Hugging Face, dimensión de embeddings,
`LayoutProps`/`next typegen`, lockfile de CI, mocks incompletos, kanban
por teclado); norma de gate en `CLAUDE.md`.

**Desviación de la spec (documentada, no corregida en silencio):** la
Fase 6.8 original asume una Skill
`.claude/skills/mercadotech-automatic-validator/SKILL.md` que este repo
no tiene. En vez de crear una Skill nueva no pedida, la norma de gate
(`npm run lint && npm run type-check && npm run test`, más
`npm run test:e2e` si el stack local está arriba) quedó escrita
directamente en `CLAUDE.md`. Verificado rompiendo a propósito una
aserción de `hooks/useSellerOrders.test.ts` (el gate falló citando el
test exacto) y revirtiendo (el gate volvió a verde) — mismo criterio de
aceptación que pedía la spec, aplicado sin la Skill inexistente.

### Números finales de la sesión

* 21 archivos de test, **202 tests unitarios**, todos verdes
  (`npm run test`).
* Cobertura real (`npm run test:coverage`, HTML report):
  `services/` 99.29 % líneas / 92.11 % statements / 80.12 % branches;
  `lib/validators/` 100 % en las 4 métricas; `lib/ai/context-builder.ts`
  y `lib/ai/prompts.ts` 100 % en las 4 métricas.
* 24 tests E2E enumerados (8 specs × 3 navegadores en local; CI corre
  solo los 8 de `chromium`).
* 59 archivos, 6363 líneas insertadas entre `c004dc8` y `828d80c`.

### Cambio de alcance heredado

Por decisión ya registrada en `MercadoTech_sesion6.md`, esta sesión
absorbió el contenido de la antigua "Fase 7.1" (CI) — la Sesión 7 arranca
sin esa fase, directo en performance y despliegue.

### Fuera de alcance (a propósito)

* Tests de componentes React (esta sesión usa `environment: "node"`, sin
  jsdom/Testing Library — decisión tomada en la spec).
* Tests del servidor MCP (no existe en este repo).
* Branch protection de GitHub y despliegue (Sesión 7).
* Reconstrucción retroactiva del cierre de Sesión 4/5 en esta bitácora
  (fuera del alcance pedido para esta sesión; queda como pendiente).

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
