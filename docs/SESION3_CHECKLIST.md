# Checklist Fase 3.8 — Responsive, accesibilidad y estados

Recorrido de las 14 rutas del mapa en 375px, 768px y 1280px. "Skeleton"
incluye tanto grillas con `<Skeleton>` reales (catálogo) como `LoadingState`
(spinner + texto) para pantallas de un solo recurso o formularios — ambas
formas comunican "esto está cargando" sin dejar la pantalla en blanco, que
es el requisito real detrás del ítem.

| Ruta | Carga (skeleton/spinner) | EmptyState + acción | ErrorState + reintento | Foco/teclado | ProductImage + alt | Tema claro/oscuro |
|---|---|---|---|---|---|---|
| `/` | ✅ Skeleton en grilla (12) | ✅ "No encontramos productos" (sin acción — no aplica: sin filtro que limpiar en home) | ✅ `onRetry` → recarga | ✅ tabs nativos en cards, Select con teclado | ✅ alt = título del producto | ✅ tokens de `globals.css` + `ThemeProvider` |
| `/categoria/[slug]` | ✅ Skeleton en grilla | ✅ "Sin productos en esta categoría" (sin acción — no aplica) | ✅ `onRetry` | ✅ igual que `/` | ✅ | ✅ |
| `/buscar` | ✅ Skeleton en grilla | ✅ "Sin resultados" con sugerencia de reformular | ✅ `onRetry` | ✅ | ✅ | ✅ |
| `/producto/[id]` | ✅ `LoadingState` | N/A (no es lista) | ✅ `onRetry`; "no encontrado" sin retry (correcto: reintentar no cambia que no exista) | ✅ galería con tabs `role="tab"`, formularios con `<Label htmlFor>` | ✅ alt = título; miniaturas `alt=""` decorativas (el botón padre ya las nombra) | ✅ |
| `/favoritos` | ✅ Skeleton en grilla | ✅ "Todavía no tienes favoritos" → botón "Ver catálogo" (agregado en 3.8) | ✅ `onRetry` | ✅ | ✅ | ✅ |
| `/carrito` | ✅ `LoadingState` | ✅ "Tu carrito está vacío" → botón "Ver catálogo" (agregado en 3.8) | ✅ `onRetry` | ✅ steppers de cantidad son botones nativos | ✅ alt = título del producto | ✅ |
| `/pedidos` | ✅ `LoadingState` | ✅ "Todavía no tienes pedidos" → botón "Ver catálogo" (agregado en 3.8) | ✅ `onRetry` | ✅ | N/A | ✅ |
| `/pedidos/[id]` | ✅ `LoadingState` | N/A | ✅ `onRetry`; "sin acceso" sin retry (correcto) | ✅ diálogo de cancelación con foco atrapado (Base UI Dialog) | N/A | ✅ |
| `/login` | N/A (formulario, no carga datos) | N/A | ✅ error inline del formulario (reintentar = reenviar) | ✅ `<Label htmlFor>` + orden de tab nativo | N/A | ✅ |
| `/register` | N/A | N/A | ✅ error inline | ✅ Select de tipo de cuenta operable con teclado (`items` de Base UI) | N/A | ✅ |
| `/vendedor/productos` | ✅ `LoadingState` | ✅ "Todavía no tienes productos" → botón "Publicar producto" | ✅ `onRetry` | ✅ tabla con botones de acción nombrados (`aria-label`) | N/A (tabla de texto) | ✅ |
| `/vendedor/publicar` | N/A (formulario) | N/A | ✅ errores por campo + `toast` en submit | ✅ formulario nativo; galería drag & drop con `PointerSensor` + `KeyboardSensor` y anuncios aria de dnd-kit | ✅ miniaturas `alt=""` (drag handle y botón "Quitar" ya llevan `aria-label`) | ✅ |
| `/vendedor/productos/[id]/editar` | ✅ `LoadingState` (`form.loading`) | N/A | ✅ `toast` en submit/subida | ✅ igual que publicar | ✅ | ✅ |
| `/vendedor/pedidos` | ✅ `LoadingState` | ✅ "Todavía no tienes pedidos" (sin acción — no aplica: depende de que compren) | ✅ `onRetry` | ✅ Kanban con `PointerSensor` + `KeyboardSensor`, anuncios aria de dnd-kit por defecto | N/A | ✅ |

## Verificación de capas (grep)

```bash
grep -rl "@/lib/supabase" components hooks
grep -rl "from \"@/services" components
```

Ambos comandos devuelven **vacío**. Se corrigió una desviación real: los 14
hooks creaban su propio cliente Supabase (`createClient()`) y lo pasaban
explícitamente a cada función de service, en vez de dejar que cada service
use su propio parámetro por defecto. Se refactorizaron los 14 hooks; el
único caso especial es `useAuth`, que necesita una suscripción persistente
a `onAuthStateChange` — se resolvió moviendo esa suscripción a
`services/auth.service.ts::subscribeToAuthChanges`, así `useAuth.ts` tampoco
importa `lib/supabase` directamente.

## Otros hallazgos corregidos en esta fase

- **`npm run build` fallaba desde la Fase 3.4** y nunca se había detectado
  porque toda la verificación previa usó `npm run dev` (que no exige límites
  de Suspense para `useSearchParams()`). Afectaba `/`, `/categoria/[slug]`,
  `/buscar` y `/login`: las cuatro usan `useSearchParams()` sin un
  `<Suspense>` alrededor, y el prerenderizado de producción lo exige
  explícitamente. Se corrigió extrayendo el contenido de cada página a un
  componente interno envuelto en `<Suspense fallback={<LoadingState .../>}>`.
  `npm run build` ahora termina limpio (14/14 páginas).
- **Tema oscuro nunca se activaba**: `next-themes` estaba instalado (lo trae
  el init de shadcn) pero nunca conectado — sin un `ThemeProvider`, nada
  agregaba la clase `dark` a `<html>` aunque el sistema operativo del
  usuario estuviera en modo oscuro. Se agregó
  `components/shared/ThemeProvider.tsx` (envoltorio de `next-themes`,
  `attribute="class"`, `defaultTheme="system"`) y se conectó en
  `app/layout.tsx`.
- Se eliminó `app/dev/ui/page.tsx` (página de muestra de la Fase 3.1).
- No quedan placeholders "Próximamente" — las 14 rutas están implementadas.

## Verificación final

- `npm run lint` — limpio.
- `npm run type-check` — limpio.
- `npm run build` — limpio (ver commit de esta fase).
- Flujo comprador completo (registro → login → catálogo → detalle →
  carrito → checkout → pedidos) y flujo vendedor completo (login → publicar
  con imágenes → editar → kanban de pedidos) verificados en vivo contra el
  proyecto Supabase remoto en fases anteriores (3.3–3.7); esta fase no
  repite esas pruebas end-to-end, solo el pase de estados/accesibilidad y
  la corrección de capas.
