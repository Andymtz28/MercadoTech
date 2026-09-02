# Performance — Fase 7.2

Metodología: **medir → cambiar → medir**. Ninguna optimización entra sin su
número de antes y de después; la que no mueve la aguja se revierte y queda
anotada como "intentada, sin efecto" — es un dato tan válido como el que sí
funciona.

Toda medición de bundle es contra `npm run build` (build de producción real,
nunca `next dev`). Este proyecto usa Turbopack (`next build`), así que
`@next/bundle-analyzer` (webpack) no aplica — el bundle se audita con el
resumen de tamaños por ruta que el propio build imprime.

## 1. Bundle: ANTES

```bash
npm run build
```

| Ruta | First Load JS |
|---|---|
| `/` | 202 kB |
| `/buscar` | 215 kB |
| `/carrito` | 208 kB |
| `/categoria/[slug]` | 201 kB |
| `/comparar` | 195 kB |
| `/favoritos` | 201 kB |
| `/login` | 203 kB |
| `/pedidos` | 192 kB |
| `/pedidos/[id]` | 220 kB |
| `/producto/[id]` | 210 kB |
| `/register` | 248 kB |
| `/vendedor/pedidos` | 211 kB |
| `/vendedor/productos` | 204 kB |
| **`/vendedor/productos/[id]/editar`** | **271 kB** |
| **`/vendedor/publicar`** | **271 kB** |
| Compartido por todas las rutas | 102 kB |

Verificado con `grep` (decisión 3 de la sesión 7 — la garantía de que
`lib/ai` no llega al cliente no depende de bundle-analyzer):

```bash
grep -rl "lib/ai" components hooks app --include="*.tsx"   # → components/chat/SourcesList.tsx (solo un COMENTARIO, no un import real)
grep -rl "@/lib/supabase" components hooks                 # → vacío
grep -rl "from \"@/services" components                    # → 3 archivos, los tres import type (borrados en compilación, cero peso real):
                                                             #   FiltersSidebar.tsx, CategoryTiles.tsx, Hero.tsx
```

`lib/ai` nunca se importa desde un componente cliente (ni con `import type`):
cero riesgo de que la lógica del proveedor de IA viaje al navegador. No se
agregó el paquete `server-only` como refuerzo porque esta sesión no suma
dependencias nuevas (regla del Prompt 0) y el grep ya es evidencia suficiente.

## 2. Candidatos a `dynamic import`, por impacto esperado

Sin ningún `dynamic import` en el repo al empezar (verificado). Orden de
impacto esperado antes de tocar nada:

1. **`SortableImageGallery`** (dnd-kit) — solo en las 2 rutas más pesadas del
   build (271 kB). Impacto esperado: alto.
2. **`OrdersKanban`** (dnd-kit) — solo en `/vendedor/pedidos` (211 kB, la
   tercera más pesada). Impacto esperado: medio-alto.
3. **`ChatWindow`/`ChatInput`** — están en el layout de `(shop)`, montado en
   casi toda la tienda, pero son dos componentes de <50 líneas sin
   dependencias pesadas (ni siquiera un parser de markdown). Impacto
   esperado: bajo — se prueba igual porque el candidato lo pedía la spec,
   pero se anticipa que valga poco.

## 3. Optimizaciones aplicadas

| Cambio | Antes | Después | Δ | Resultado |
|---|---|---|---|---|
| `dynamic import` de `SortableImageGallery` en `ProductForm.tsx` (`ssr:false`, con `loading`) | 271 kB | 250 kB | **-21 kB (-7.7%)** | ✅ mantenido |
| `dynamic import` de `OrdersKanban` en `vendedor/pedidos/page.tsx` (`ssr:false`, con `loading`) | 211 kB | 198 kB | **-13 kB (-6.2%)** | ✅ mantenido |
| `dynamic import` de `ChatWindow`/`ChatInput` en `ChatWidget.tsx` | 202 kB (`/`) | 202 kB (`/`) | **0 kB** | ❌ **revertido** — componentes demasiado chicos para que Next.js los separe en un chunk medible; anotado como "intentado, sin efecto" |
| `sizes` correcto en `ProductImage` (antes ausente en 6 usos: `ProductCard`, `CartItemRow`, `/comparar`, `ProductGallery` ×2, `SortableImageGallery`) | — | — | no aplica a First Load JS | ✅ mantenido — reduce el peso de la IMAGEN descargada (afecta LCP/datos móviles, no el bundle JS); antes Next.js avisaba en consola "`fill` but is missing `sizes`" en cada uno |
| `priority` en la primera tarjeta de "Bajaron de precio" (Home) | — | — | no aplica a First Load JS | ✅ mantenido — es el elemento LCP real de `/` (confirmado: Next.js lo señalaba como LCP en consola); ahora se sirve sin `loading="lazy"`. Alcance limitado a esa tarjeta, no a toda tarjeta de todo grid (decisión de la spec: "priority SOLO en la portada above-the-fold del Home") |

**Regla de reversión aplicada de verdad, no solo en teoría**: el cambio de
`ChatWidget` se implementó, se midió (build antes/después idéntico en las 4
rutas de `(shop)` que se revisaron: `/`, `/producto/[id]`, `/carrito`,
`/login`), y se revirtió al confirmar 0 kB de diferencia — el código actual
en `components/chat/ChatWidget.tsx` NO tiene `dynamic import`.

## 4. Bundle: DESPUÉS

```bash
npm run build
```

| Ruta | Antes | Después | Δ |
|---|---|---|---|
| `/` | 202 kB | 202 kB | — |
| `/buscar` | 215 kB | 215 kB | — |
| `/carrito` | 208 kB | 208 kB | — |
| `/comparar` | 195 kB | 195 kB | — |
| `/login` | 203 kB | 204 kB | +1 kB (ruido, no relacionado) |
| `/pedidos/[id]` | 220 kB | 220 kB | — |
| `/producto/[id]` | 210 kB | 210 kB | — |
| `/register` | 248 kB | 248 kB | — |
| **`/vendedor/pedidos`** | 211 kB | **198 kB** | **-13 kB** |
| **`/vendedor/productos/[id]/editar`** | 271 kB | **250 kB** | **-21 kB** |
| **`/vendedor/publicar`** | 271 kB | **250 kB** | **-21 kB** |
| Compartido por todas las rutas | 102 kB | 102 kB | — |

Las rutas sin dnd-kit no cambian (esperado: el peso de `@dnd-kit/*` nunca
estuvo en su bundle). Las 3 rutas del panel de vendedor que sí lo usaban
bajaron entre 6% y 8%.

## 5. Core Web Vitals / Lighthouse — PENDIENTE de medición manual

Este agente no tiene acceso a un runner de Lighthouse (Chrome DevTools) ni a
la API de PageSpeed Insights (cuota agotada al intentarla contra
`https://mercadotech-kohl.vercel.app/` durante esta sesión — ver
`docs/DEBUGGING.md` si vuelve a pasar). La spec de la sesión 7 ya preveía
este paso como manual ("guíame para correrlo… y espera mis números").

**Pendiente — correr y pegar los 3 números (Performance, LCP, CLS, INP) de:**

1. Local, contra el build de producción real (no `next dev`):
   ```bash
   npm run build && npm run start
   ```
   Luego en Chrome: DevTools → pestaña **Lighthouse** → Device: **Mobile** →
   Categories: **Performance** → Analyze — correr sobre `/` y sobre
   `/categoria/laptops` (o cualquier categoría con productos).
2. O, más simple, contra la URL real ya desplegada:
   [pagespeed.web.dev](https://pagespeed.web.dev) → pegar
   `https://mercadotech-kohl.vercel.app/` → pestaña **Mobile**.

Objetivos de la spec: Performance ≥ 90 en home y catálogo; LCP < 2.5 s;
CLS < 0.1; INP < 200 ms. Esta tabla se completa con los números reales en
cuanto se corran (no se estiman ni se inventan):

| Página | Performance | LCP | CLS | INP |
|---|---|---|---|---|
| `/` (Home) | — | — | — | — |
| `/categoria/[slug]` (catálogo) | — | — | — | — |

## 6. Verificación tras cada cambio

* `npm run lint`, `npm run type-check`, `npm run test` (204 tests) — verdes
  después de cada `dynamic import` aplicado.
* `npm run build` — verde, sin errores de hidratación.
* Verificado en vivo (dev server, sin Docker) que `/vendedor/pedidos` y
  `/vendedor/publicar` siguen renderizando el kanban y la galería
  correctamente tras el `dynamic import` (sin errores de consola).
* `npm run test:e2e` completo: no se corrió en esta fase porque requiere
  Docker local (no disponible en este entorno) — el CI de la Fase 6.7 ya
  corre esta misma suite en cada push contra Supabase efímero; el próximo
  push a `main` con estos cambios sirve como esa verificación.
