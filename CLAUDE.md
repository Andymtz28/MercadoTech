@AGENTS.md

# MercadoTech

Plataforma de compra/venta de productos tecnológicos con centro de soporte
operado por agentes de voz. Ver `MercadoTech_sesion2.md`/`_sesion3.md`/`_sesion4.md`
para la especificación completa por fases.

## Comandos

```bash
npm run dev          # servidor de desarrollo (Turbopack)
npm run build        # build de producción
npm run start         # sirve el build de producción
npm run lint           # ESLint
npm run type-check       # next typegen && tsc --noEmit
npm run test           # Vitest (unit — services, hooks, lib/ai)
npm run test:coverage    # Vitest con reporte de cobertura (v8)
npm run test:e2e          # Playwright (requiere stack de Supabase local arriba)
npm run db:types          # regenera types/database.ts (proyecto REMOTO, --project-id)
```

Este proyecto corre contra un proyecto Supabase **remoto** (no hay stack
Docker local): `npx supabase db push` aplica migraciones nuevas;
`npx supabase db query --linked --file <archivo>.sql` para SQL puntual.

## Variables de entorno

`.env.local`: credenciales de Supabase (URL, anon key, service role) +
`HUGGINGFACEHUB_API_TOKEN` (sesión 4, personal de cada quien — nunca en el
chat con el asistente ni en un commit).

## Arquitectura y reglas de capas

```
components/ui/       Componentes shadcn/ui (@base-ui/react, NO Radix: usar `render`, no `asChild`; botones que renderizan un <a> necesitan `nativeButton={false}`).
components/shared/    Price, RatingStars, ConditionBadge, ProductImage, EmptyState, ErrorState, LoadingState, Container, ThemeProvider.
components/layout/    Navbar, SearchBar, CategoriesMenu, CartIndicator, UserMenu, MobileNav, SellerSidebar, NavLink.
components/auth|catalog|product|cart|orders|seller/   Presentación pura por dominio.
hooks/                Estado de cliente. Llaman a services SIN pasarles un SupabaseClient (cada service usa su propio createClient() por defecto).
services/             Lógica de negocio. SupabaseClient inyectable, pero el caller normal (hooks) no lo pasa.
lib/supabase/         client.ts (browser) · server.ts (RLS) · admin.ts (service role, solo Route Handlers/scripts) · middleware.ts
lib/ai/               Único lugar que conoce la API del proveedor de IA (sesión 4).
lib/voice/            Único lugar que conoce la API de voz (sesión 8).
lib/validators/       Validación framework-agnóstica.
lib/constants/        roles, auth, catalog, storage, orders, product — cada tunable con su porqué.
types/                Tipos de dominio + database.ts (generado).
app/api/v1/           Route Handlers delgados, solo lo que no corre en el navegador.
```

Reglas: un archivo una responsabilidad · sin barrels · la UI nunca importa
`lib/ai/`, `lib/voice/` ni `lib/supabase/admin.ts` · un solo camino de datos
(hooks → services → Supabase/RLS, sin API REST paralela) · todo tunable en
`lib/constants/`. Verificación de capas: `grep -rl "@/lib/supabase" components hooks`
y `grep -rl "from \"@/services" components` deben dar vacío.

### Mapa de rutas (sesión 3)

`/`, `/categoria/[slug]`, `/buscar`, `/producto/[id]`, `/favoritos`,
`/carrito`, `/pedidos`, `/pedidos/[id]` — `/login`, `/register` — panel de
vendedor bajo el prefijo `/vendedor/*` (`/vendedor/productos`,
`/vendedor/publicar`, `/vendedor/productos/[id]/editar`, `/vendedor/pedidos`)
para no chocar con `/pedidos` del comprador. Middleware protege `/carrito`,
`/pedidos`, `/favoritos` y `/vendedor` (sesión iniciada).

### Convenciones aprendidas en la sesión 3

* `numeric` llega como `string` desde PostgREST: los services lo convierten
  con `Number()`; los componentes siempre reciben `number`.
* `PostgrestError` NO es instancia de `Error` — usar siempre
  `getErrorMessage(err, fallback)` de `lib/utils.ts`, nunca `err instanceof Error`.
* `image_url` llega ya resuelta (pública) desde el service; los componentes
  nunca arman la URL de Storage a mano.
* Filtros de catálogo viven en la URL (`useSearchParams`); toda página que
  los use necesita un límite `<Suspense>` alrededor o `next build` falla.
* Las transiciones del kanban de pedidos se validan en el hook
  (`ORDER_STATUS_FLOW`), nunca en el componente ni confiando solo en RLS.

## Norma de cierre de feature (sesión 6)

Al terminar cualquier feature el ciclo es: revisión de código →
correcciones → gate de validación. El gate es rojo/verde, sin término
medio:

```bash
npm run lint && npm run type-check && npm run test
```

(agregar `npm run test:e2e` cuando el stack de Supabase local esté arriba
— `supabase status` en verde). Si algo de esto falla, la feature NO está
terminada, sin importar qué tan segura se vea la IA de que ya la revisó.
CI (`.github/workflows/ci.yml`) corre exactamente este mismo gate en cada
push/PR contra `main`. Ver [docs/DEBUGGING.md](docs/DEBUGGING.md) para
diagnosticar cuando el gate falla.

## Estado del proyecto

Sesiones 2 y 3 completas y verificadas contra el proyecto Supabase remoto
(catálogo, auth, carrito/checkout, panel de vendedor con drag & drop).
Pendiente: sesión 1 (no ejecutada) y sesión 4 (RAG con Hugging Face, en curso).
Detalle completo por fase, decisiones y bugs corregidos:
[docs/BITACORA.md](docs/BITACORA.md) · checklist de accesibilidad:
[docs/SESION3_CHECKLIST.md](docs/SESION3_CHECKLIST.md).
