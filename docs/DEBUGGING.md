# Guía de debugging

Metodología y catálogo de errores reales de este proyecto. Escrita para
alguien que nunca vio el código: cada fila da el mensaje literal y el
primer paso concreto, no una teoría.

## El flujo

1. **Síntoma.** Anota el mensaje EXACTO (copia/pega, no lo parafrasees) y
   dónde apareció: navegador, terminal de `npm run dev`, GitHub Actions,
   Supabase.
2. **Reproducir.** Un test que falla en rojo es la mejor reproducción
   posible — es determinista y queda documentado. Si el bug no tiene test
   todavía, el primer paso suele ser escribir el que lo atrapa.
3. **Leer los logs correctos**, no adivinar:
   - Servidor Next (`npm run dev`): stack trace completo en la terminal.
   - Endpoint de chat / IA (`/api/v1/chat`, `lib/ai/*`): los errores de
     Hugging Face llegan envueltos por `lib/ai/embeddings.ts` /
     `lib/ai/completion.ts` — el mensaje ya dice si fue 401, timeout o
     forma de respuesta inesperada.
   - Base de datos: `npx supabase db query --linked --file <script>.sql`
     para reproducir un query suelto contra el proyecto remoto.
   - CI: en la pestaña Actions, abrir el job que falló (no solo mirar la
     ✗ roja) — el paso exacto y su output completo están ahí; los
     artefactos (`coverage-report`, `playwright-report`) se descargan
     desde la misma corrida.
4. **Una sola hipótesis a la vez.** Cambiar una cosa, volver a correr el
   test o el comando, ver si el síntoma cambió. Cambiar tres cosas a la
   vez rompe la trazabilidad de cuál arregló qué.
5. **El test pasa (o el comando corre limpio) → recién ahí se da por
   cerrado.** "Ya debería funcionar" no es un criterio de cierre.

## Cómo pedirle debugging a Claude

Dar, en este orden:

1. El síntoma con el mensaje **literal** (no "da error", sino el texto
   exacto o una captura).
2. Los pasos para reproducirlo (qué comando, qué pantalla, qué dato).
3. El log relevante, sin recortar la parte que parece "irrelevante" —
   frecuentemente la causa está ahí.
4. Qué ya se descartó, para no repetir el mismo diagnóstico.

Sin esto, Claude adivina causas genéricas en vez de diagnosticar la real.

## Catálogo de errores típicos de este stack

| Mensaje literal | Causa | Primer paso |
|---|---|---|
| `new row violates row-level security policy for table "..."` | Una política RLS bloquea el insert/update — falta la condición para el rol actual o se está usando el cliente equivocado (browser/server en vez de admin, o viceversa) | Releer la policy en `supabase/policies.sql` para esa tabla y operación; confirmar con qué cliente (`lib/supabase/client.ts` vs `server.ts` vs `admin.ts`) se hizo la llamada |
| Un `select` devuelve `[]` sin error, donde se esperaban filas | RLS deniega silenciosamente (no es un 401, es 0 filas) — patrón distinto al de arriba pero misma raíz | Repetir el mismo `select` con `admin.ts` (bypassa RLS) para confirmar que las filas SÍ existen; si aparecen, el problema es la policy, no los datos |
| `permission denied for table ...` / `permission denied for schema ...` | Falta un `GRANT` al rol (`authenticated`, `anon`) sobre la tabla o el schema — RLS no sustituye a GRANT, son dos capas | Revisar `supabase/schema.sql` / la migración de la tabla: ¿tiene su `grant select/insert/update on ... to authenticated`? |
| `42P17: infinite recursion detected in policy for relation "..."` | Una policy hace un join embebido hacia otra tabla cuya propia policy vuelve a consultar la primera (ciclo) | Reescribir la policy más interna sin el join circular — ver el fix real de `orders_select`/`order_items_select` en [BITACORA.md](BITACORA.md) |
| `HUGGINGFACEHUB_API_TOKEN no está configurada.` | Falta la variable en `.env.local` (o no se cargó — servidor no reiniciado tras editarla) | Confirmar que existe en `.env.local`, reiniciar `npm run dev` |
| `Hugging Face rechazó el token (401): revisa HUGGINGFACEHUB_API_TOKEN.` | El token es inválido, expiró, o no tiene permiso de inference para el modelo | Regenerar el token en huggingface.co/settings/tokens; no es un problema de la app, es de la cuenta |
| `Respuesta de embedding con dimensión inesperada: N (se esperaban 384).` | Se cambió `HUGGINGFACE_EMBEDDING_MODEL` a un modelo con otra dimensión de salida sin migrar la columna | `knowledge_embeddings.embedding` está fijada en `vector(384)` (ver migración `20260101000022`); cambiar de modelo exige `alter column ... type vector(N)` + recrear el índice HNSW y `match_knowledge`, no alcanza con la env var |
| `Respuesta de embedding inválida: se esperaba un vector numérico plano.` | El modelo devolvió una matriz por token (`number[][]`) en vez de un vector plano — pasa con modelos que no son de tipo "sentence embedding" | Confirmar que el modelo en `HUGGINGFACE_EMBEDDING_MODEL` es compatible con `featureExtraction` de salida plana (el default, `all-MiniLM-L6-v2`, sí lo es) |
| `Cannot find name 'LayoutProps'` en `app/**/layout.tsx` (típicamente solo en CI, nunca local) | `LayoutProps<...>` es un tipo ambiente que Next.js genera en `.next/types/routes.d.ts`; solo existe después de `next dev`/`next build`. Local "funciona" porque `.next/` ya existe de sesiones previas; un checkout limpio no lo tiene | `npm run type-check` ya corre `next typegen` antes de `tsc --noEmit` (ver `package.json`) — si vuelve a aparecer, confirmar que nadie quitó ese paso del script |
| `npm ci` falla con `Missing: <paquete>@<versión> from lock file` en CI | El `npm` del runner es más nuevo que el que generó `package-lock.json` y resuelve dependencias opcionales distinto (lección del proyecto ReadHub) | Confirmar que el workflow instala la MISMA versión exacta que `package.json.packageManager` antes de `npm ci` |
| Un test unitario de `services/*.test.ts` pasa solo, pero falla corriendo la suite completa (o viceversa) | El mock de Supabase no cubre alguna llamada de esa función y se coló el `createClient()` real | Correr esa suite con la red/Supabase inaccesible (o revisando que TODAS las llamadas dentro del service reciban el `SupabaseClient` mockeado, no solo las obvias) |
| Playwright: timeout esperando el `webServer` | `next build` tarda más que el timeout configurado, o el puerto 3000 ya está ocupado por otro `next dev` | Subir `webServer.timeout` en `playwright.config.ts`; verificar que no haya un dev server previo corriendo |
| E2E rojos con "0 rows" o login que falla sin motivo aparente | Quedaron datos sucios de una corrida anterior (`supabase db reset` no se corrió antes) | Resetear la base local antes de la suite — es parte del contrato de los E2E, no opcional |
| El drag del kanban no se dispara en Playwright con `mouse.move`/`mouse.down` | dnd-kit con `KeyboardSensor`/`PointerSensor` no siempre reacciona a eventos de mouse sintéticos de Playwright | Usar el camino de teclado: foco en el asa → `Space` (levanta) → flechas (mueve) → `Space` (suelta) — ver `SellerKanbanPage.moveCardToColumn` |

### Fuera de alcance en este repo

El plan original de la Sesión 6 incluye un caso de "stdout corrupto en
MCP". Este repo **no tiene un servidor MCP propio** — la Sesión 5 del plan
maestro (la que lo crearía) no se ejecutó aquí — así que esa fila no
aplica; se omite en vez de inventar un caso que no existe en el código
real.

## Nota sobre el gate de validación

El plan original de esta fase asume una Skill
`.claude/skills/mercadotech-automatic-validator/` que este repo no tiene
(las únicas Skills reales son `analista-negocio`, `planificacion-por-fases`
y `web-scraping` — confirmado con `ls .claude/skills/`). En vez de crear
una skill nueva no pedida, la norma de gate quedó escrita directamente en
[CLAUDE.md](../CLAUDE.md): el ciclo de cierre de cualquier feature es
`npm run lint && npm run type-check && npm run test` (y `npm run test:e2e`
si el stack de Supabase local está arriba) — rojo en cualquiera de esos
comandos significa que la feature no está terminada, sin importar qué la
IA "cree" que ya revisó.
